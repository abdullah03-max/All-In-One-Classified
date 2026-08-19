import 'dart:async';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:supabase_flutter/supabase_flutter.dart' hide AuthState;
import '../data/auth_repository.dart';
import 'auth_state.dart';

class AuthCubit extends Cubit<AuthState> {
  final AuthRepository _repository;
  StreamSubscription<AuthState>? _authSubscription;

  AuthCubit(this._repository) : super(AuthInitial()) {
    _initAuthListener();
  }

  void _initAuthListener() {
    final currentUser = _repository.currentAuthUser;
    if (currentUser != null) {
      _loadUserProfile(currentUser.id, currentUser.email ?? '');
    } else {
      emit(Unauthenticated());
    }

    _repository.authStateChanges.listen((data) async {
      final session = data.session;
      if (session != null) {
        await _repository.ensureProfile(session.user);
        await _loadUserProfile(session.user.id, session.user.email ?? '');
      } else {
        emit(Unauthenticated());
      }
    });
  }

  Future<void> _loadUserProfile(String userId, String email) async {
    try {
      final currentUser = _repository.currentAuthUser;
      if (currentUser != null) {
        await _repository.ensureProfile(currentUser);
      }
      final profile = await _repository.fetchUserProfile(userId);
      final fullName = profile?['full_name'] ?? email.split('@').first;
      final role = profile?['role'] ?? 'buyer';
      final isVerified = profile?['is_verified'] ?? false;
      final avatarUrl = profile?['avatar_url'] as String?;

      emit(Authenticated(
        userId: userId,
        email: email,
        fullName: fullName,
        role: role,
        isVerified: isVerified,
        avatarUrl: avatarUrl,
      ));
    } catch (_) {
      emit(Authenticated(
        userId: userId,
        email: email,
        fullName: email.split('@').first,
        role: 'buyer',
        isVerified: false,
        avatarUrl: null,
      ));
    }
  }

  // 1. Login with Email & Password
  Future<void> login(String email, String password) async {
    emit(AuthLoading());
    try {
      final response = await _repository.signIn(email: email, password: password);
      if (response.user != null) {
        await _loadUserProfile(response.user!.id, response.user!.email ?? '');
      } else {
        emit(const AuthError('Login failed. Please check credentials.'));
      }
    } on AuthException catch (e) {
      emit(AuthError(e.message));
    } catch (e) {
      emit(AuthError('An unexpected error occurred: ${e.toString()}'));
    }
  }

  // 2. Login with Email OTP
  Future<void> signInWithOtp(String email) async {
    emit(AuthLoading());
    try {
      await _repository.signInWithOtp(email: email);
      emit(OtpSent(email: email, type: 'login'));
    } on AuthException catch (e) {
      emit(AuthError(e.message));
    } catch (e) {
      emit(AuthError(e.toString()));
    }
  }

  // 3. Google Sign In
  Future<void> signInWithGoogle() async {
    emit(AuthLoading());
    try {
      final success = await _repository.signInWithGoogle();
      if (!success) {
        emit(Unauthenticated());
      }
    } on AuthException catch (e) {
      emit(AuthError(e.message));
    } catch (e) {
      emit(AuthError('Google sign in failed: ${e.toString()}'));
    }
  }

  // 4. Registration
  Future<bool> register({
    required String email,
    required String password,
    required String fullName,
    String phone = '',
  }) async {
    emit(AuthLoading());
    try {
      final response = await _repository.signUp(
        email: email,
        password: password,
        fullName: fullName,
        phone: phone,
        role: 'buyer',
      );

      if (response.user != null) {
        if (response.session != null) {
          await _loadUserProfile(response.user!.id, response.user!.email ?? '');
          return true;
        } else {
          // Email confirmation is required / OTP sent
          emit(OtpSent(email: email, type: 'signup'));
          return false;
        }
      } else {
        emit(const AuthError('Registration failed. Please try again.'));
        return false;
      }
    } on AuthException catch (e) {
      emit(AuthError(e.message));
      return false;
    } catch (e) {
      emit(AuthError('Registration error: ${e.toString()}'));
      return false;
    }
  }

  // 5. Verify OTP
  Future<bool> verifyOtp({
    required String email,
    required String token,
    required OtpType type,
  }) async {
    emit(AuthLoading());
    try {
      final response = await _repository.verifyOtp(
        email: email,
        token: token,
        type: type,
      );

      if (response.user != null) {
        if (type != OtpType.recovery) {
          await _loadUserProfile(response.user!.id, response.user!.email ?? '');
        }
        return true;
      } else {
        emit(const AuthError('Verification failed. Invalid or expired code.'));
        return false;
      }
    } on AuthException catch (e) {
      emit(AuthError(e.message));
      return false;
    } catch (e) {
      emit(AuthError('Verification error: ${e.toString()}'));
      return false;
    }
  }

  // 6. Resend OTP
  Future<void> resendOtp({
    required String email,
    required OtpType type,
  }) async {
    try {
      await _repository.resendOtp(email: email, type: type);
    } on AuthException catch (e) {
      emit(AuthError(e.message));
    } catch (e) {
      emit(AuthError(e.toString()));
    }
  }

  // 7. Forgot Password (Dispatches recovery code/link)
  Future<bool> resetPassword(String email) async {
    emit(AuthLoading());
    try {
      await _repository.resetPassword(email: email);
      emit(PasswordResetSent(email));
      return true;
    } on AuthException catch (e) {
      emit(AuthError(e.message));
      return false;
    } catch (e) {
      emit(AuthError(e.toString()));
      return false;
    }
  }

  // 8. Update Password (after OTP recovery verification)
  Future<bool> updatePassword(String newPassword) async {
    emit(AuthLoading());
    try {
      await _repository.updatePassword(newPassword: newPassword);
      emit(PasswordUpdated());
      return true;
    } on AuthException catch (e) {
      emit(AuthError(e.message));
      return false;
    } catch (e) {
      emit(AuthError(e.toString()));
      return false;
    }
  }

  // 9. Logout
  Future<void> logout() async {
    emit(AuthLoading());
    await _repository.signOut();
    emit(Unauthenticated());
  }

  @override
  Future<void> close() {
    _authSubscription?.cancel();
    return super.close();
  }
}
