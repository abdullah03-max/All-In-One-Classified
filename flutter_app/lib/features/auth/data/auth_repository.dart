import 'package:flutter/foundation.dart';
import 'package:google_sign_in/google_sign_in.dart';
import 'package:supabase_flutter/supabase_flutter.dart';

class AuthRepository {
  final SupabaseClient _client = Supabase.instance.client;

  User? get currentAuthUser => _client.auth.currentUser;

  Stream<AuthState> get authStateChanges => _client.auth.onAuthStateChange;

  /// Sign In with Email & Password
  Future<AuthResponse> signIn({
    required String email,
    required String password,
  }) async {
    final response = await _client.auth.signInWithPassword(
      email: email.trim(),
      password: password,
    );
    
    if (response.user != null) {
      await ensureProfile(response.user!);
    }

    return response;
  }

  /// Sign Up new user with full profile metadata & email redirect options
  Future<AuthResponse> signUp({
    required String email,
    required String password,
    required String fullName,
    String phone = '',
    String role = 'buyer',
  }) async {
    final cleanEmail = email.trim().toLowerCase();

    // 1. Check if email already exists in public.users table (matching website logic)
    final existing = await _client
        .from('users')
        .select('id, email')
        .eq('email', cleanEmail)
        .maybeSingle();

    if (existing != null) {
      throw const AuthException('This email is already registered. Please sign in instead.');
    }

    // 2. Call Supabase auth.signUp with full user metadata
    final roles = role == 'seller' ? ['seller', 'buyer'] : ['buyer'];
    final response = await _client.auth.signUp(
      email: cleanEmail,
      password: password,
      emailRedirectTo: 'allinoneclassified://login-callback',
      data: {
        'full_name': fullName.trim(),
        'phone': phone.trim(),
        'role': role,
        'roles': roles,
      },
    );

    // 3. Check if user already exists in auth.users (identities empty)
    if (response.user != null && response.user!.identities != null && response.user!.identities!.isEmpty) {
      throw const AuthException('This email is already registered. Please sign in instead.');
    }

    // 4. If session is immediately created (email verification disabled in Supabase), create profile
    if (response.user != null && response.session != null) {
      await ensureProfile(response.user!);
    }

    return response;
  }

  /// Send OTP code to email for passwordless login
  Future<void> signInWithOtp({required String email}) async {
    await _client.auth.signInWithOtp(
      email: email.trim().toLowerCase(),
      emailRedirectTo: 'allinoneclassified://login-callback',
    );
  }

  /// Verify 6-digit OTP code (signup, recovery, or email login)
  Future<AuthResponse> verifyOtp({
    required String email,
    required String token,
    required OtpType type,
  }) async {
    final cleanEmail = email.trim().toLowerCase();
    final response = await _client.auth.verifyOTP(
      email: cleanEmail,
      token: token.trim(),
      type: type,
    );

    if (response.user != null) {
      await ensureProfile(response.user!);
    }

    return response;
  }

  /// Resend OTP code
  Future<void> resendOtp({
    required String email,
    required OtpType type,
  }) async {
    final cleanEmail = email.trim().toLowerCase();
    if (type == OtpType.email) {
      await _client.auth.signInWithOtp(
        email: cleanEmail,
        emailRedirectTo: 'allinoneclassified://login-callback',
      );
    } else {
      await _client.auth.resend(
        email: cleanEmail,
        type: type,
        emailRedirectTo: 'allinoneclassified://login-callback',
      );
    }
  }

  /// Reset password link / recovery code dispatch
  Future<void> resetPassword({required String email}) async {
    await _client.auth.resetPasswordForEmail(
      email.trim(),
      redirectTo: 'allinoneclassified://login-callback',
    );
  }

  /// Update password (after recovery verification or while logged in)
  Future<UserResponse> updatePassword({required String newPassword}) async {
    return await _client.auth.updateUser(
      UserAttributes(password: newPassword.trim()),
    );
  }

  /// Sign In with Google (Native in-app with direct ID Token)
  Future<bool> signInWithGoogle() async {
    try {
      const webClientId = '149903783861-k73ip90mqpfr9qj8am9bqmpcq7e2iu1s.apps.googleusercontent.com';
      const androidClientId = '149903783861-t1f3qsig98uahdj04kvth6bf46lktcck.apps.googleusercontent.com';
      final googleSignIn = GoogleSignIn(
        clientId: androidClientId,
        serverClientId: webClientId,
        scopes: ['email', 'profile'],
      );

      // Sign out first to ensure account chooser appears
      try {
        await googleSignIn.signOut();
      } catch (_) {}

      final googleUser = await googleSignIn.signIn();
      if (googleUser == null) {
        // User dismissed account chooser
        return false;
      }

      final googleAuth = await googleUser.authentication;
      final idToken = googleAuth.idToken;
      final accessToken = googleAuth.accessToken;

      if (idToken == null) {
        throw const AuthException('No ID token received from Google Play Services.');
      }

      final response = await _client.auth.signInWithIdToken(
        provider: OAuthProvider.google,
        idToken: idToken,
        accessToken: accessToken,
      );

      if (response.user != null) {
        await ensureProfile(response.user!);
        return true;
      }
      return false;
    } catch (e) {
      debugPrint('[GoogleSignIn] Error: $e');
      rethrow;
    }
  }

  /// Sign Out
  Future<void> signOut() async {
    try {
      final googleSignIn = GoogleSignIn();
      await googleSignIn.signOut();
    } catch (_) {}
    await _client.auth.signOut();
  }

  /// Fetch user profile from 'users' table
  Future<Map<String, dynamic>?> fetchUserProfile(String userId) async {
    try {
      final data = await _client
          .from('users')
          .select('*')
          .eq('id', userId)
          .maybeSingle();
      return data;
    } catch (e) {
      return null;
    }
  }

  /// Ensures user record exists in 'users' table matching website profile logic
  Future<void> ensureProfile(User authUser) async {
    final existing = await fetchUserProfile(authUser.id);
    final meta = authUser.userMetadata ?? {};
    final name = meta['full_name'] ?? meta['name'] ?? meta['preferred_username'] ?? authUser.email?.split('@').first ?? 'Member';
    final phone = meta['phone'] ?? '';
    final role = meta['role'] ?? 'buyer';

    if (existing == null) {
      await _createProfile(
        userId: authUser.id,
        email: authUser.email ?? '',
        fullName: name,
        phone: phone,
        role: role,
      );

      if (authUser.email != null && authUser.email!.isNotEmpty) {
        await sendWelcomeEmail(authUser.email!, name);
      }
    }
  }

  /// Inserts profile into public.users table
  Future<void> _createProfile({
    required String userId,
    required String email,
    required String fullName,
    required String phone,
    required String role,
  }) async {
    try {
      final roles = role == 'seller' ? ['seller', 'buyer'] : ['buyer'];
      await _client.from('users').upsert({
        'id': userId,
        'email': email,
        'full_name': fullName,
        'phone': phone.isNotEmpty ? phone : null,
        'role': role,
        'roles': roles,
        'is_verified': false,
        'email_verified': true,
        'is_active': true,
      });
    } catch (e) {
      try {
        await _client.from('users').upsert({
          'id': userId,
          'email': email,
          'full_name': fullName,
          'phone': phone.isNotEmpty ? phone : null,
          'role': role,
          'is_verified': false,
          'is_active': true,
        });
      } catch (_) {}
    }
  }

  /// Sends Welcome Email via Supabase Edge Function 'send-email' (matching website logic)
  Future<void> sendWelcomeEmail(String email, String name) async {
    if (email.isEmpty) return;
    try {
      const appOrigin = 'https://all-in-one-classified.vercel.app';
      final userName = name.isNotEmpty ? name : 'Member';
      final emailBody = '''
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><title>Welcome to All In One</title></head>
<body style="margin: 0; padding: 20px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; color: #1e293b;">
  <div style="max-width: 520px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; border: 1px solid #e2e8f0; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);">
    <div style="background-color: #2563eb; padding: 24px; text-align: center;">
      <h1 style="color: #ffffff; margin: 0; font-size: 22px; font-weight: 700;">All In One</h1>
    </div>
    <div style="padding: 28px 24px;">
      <h2 style="font-size: 18px; margin: 0 0 14px 0; color: #0f172a;">Welcome, $userName!</h2>
      <p style="font-size: 14px; line-height: 1.6; color: #475569; margin: 0 0 20px 0;">Your account registration is complete and your email is verified. You can now post ads, explore products, and chat directly with buyers and sellers.</p>
      <div style="text-align: center; margin: 28px 0;">
        <a href="$appOrigin" style="background-color: #2563eb; color: #ffffff; padding: 12px 28px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 14px; display: inline-block;">Get Started</a>
      </div>
      <p style="font-size: 13px; line-height: 1.5; color: #64748b; margin: 0;">If you ever have any questions, our support team is here to help at <a href="$appOrigin/contact" style="color: #2563eb; text-decoration: none;">$appOrigin/contact</a>.</p>
    </div>
    <div style="background-color: #f1f5f9; padding: 16px 24px; text-align: center; font-size: 12px; color: #94a3b8;">
      © ${DateTime.now().year} All In One Marketplace. All rights reserved.
    </div>
  </div>
</body>
</html>
''';
      final plainText = 'Welcome to All In One, $userName!\n\nYour account registration is complete. You can now browse listings and post ads.\n\nAccess your account: $appOrigin\nSupport: $appOrigin/contact';

      await _client.functions.invoke('send-email', body: {
        'to': email,
        'subject': 'Welcome to All In One Marketplace, $userName!',
        'text': plainText,
        'html': emailBody,
      });
      debugPrint('[AuthRepository] Welcome email dispatched to $email');
    } catch (e) {
      debugPrint('[AuthRepository] Welcome email dispatch error: $e');
    }
  }
}
