import 'package:flutter/material.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import 'package:app_links/app_links.dart';
import 'core/config/supabase_config.dart';
import 'app.dart';
import 'features/auth/presentation/reset_password_screen.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();

  // Initialize Supabase SDK with PKCE Auth Flow enabled
  await Supabase.initialize(
    url: SupabaseConfig.supabaseUrl,
    anonKey: SupabaseConfig.supabaseAnonKey,
    authOptions: const FlutterAuthClientOptions(
      authFlowType: AuthFlowType.pkce,
    ),
  );

  // Setup AppLinks to guarantee capturing OAuth callback on cold start & background resume
  final appLinks = AppLinks();

  void handleDeepLinkRecovery(Uri uri) {
    if (uri.toString().contains('reset-password') || uri.toString().contains('type=recovery')) {
      debugPrint('[DeepLink] Password recovery link detected: $uri');
      WidgetsBinding.instance.addPostFrameCallback((_) {
        navigatorKey.currentState?.push(
          MaterialPageRoute(
            builder: (_) => const ResetPasswordScreen(),
          ),
        );
      });
    }
  }

  // 1. Cold start / initial link handling
  try {
    final initialUri = await appLinks.getInitialLink();
    if (initialUri != null) {
      debugPrint('[DeepLink] Cold start URI received: $initialUri');
      await Supabase.instance.client.auth.getSessionFromUrl(initialUri);
      handleDeepLinkRecovery(initialUri);
    }
  } catch (e) {
    debugPrint('[DeepLink] Initial URI parsing error: $e');
  }

  // 2. Incoming link stream handling (background & resumed app)
  appLinks.uriLinkStream.listen((uri) async {
    debugPrint('[DeepLink] Background/Resumed URI received: $uri');
    try {
      await Supabase.instance.client.auth.getSessionFromUrl(uri);
      handleDeepLinkRecovery(uri);
    } catch (e) {
      debugPrint('[DeepLink] Session restoration error: $e');
    }
  }, onError: (err) {
    debugPrint('[DeepLink] Stream listener error: $err');
  });

  runApp(const MarketplaceApp());
}
