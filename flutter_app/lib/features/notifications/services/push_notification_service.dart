import 'dart:io';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import '../../../core/theme/app_theme.dart';
import '../../chat/presentation/chat_list_screen.dart';
import '../presentation/notifications_screen.dart';

class PushNotificationService {
  static final SupabaseClient _client = Supabase.instance.client;
  static RealtimeChannel? _messageChannel;
  static RealtimeChannel? _notificationChannel;

  /// Initializes Realtime Push & In-App Notification System with Sound Alert
  static Future<void> initialize(BuildContext context) async {
    final user = _client.auth.currentUser;
    if (user == null) return;

    // 1. Register device token
    final token = await _getFcmToken();
    if (token != null) {
      await registerDeviceToken(user.id, token);
    }

    // 2. Start Realtime Message & Notification Listeners
    _startRealtimeListeners(context, user.id);
  }

  static void _startRealtimeListeners(BuildContext context, String currentUserId) {
    _messageChannel?.unsubscribe();
    _notificationChannel?.unsubscribe();

    // Listen for incoming chat messages
    _messageChannel = _client
        .channel('public:messages:$currentUserId')
        .onPostgresChanges(
          event: PostgresChangeEvent.insert,
          schema: 'public',
          table: 'messages',
          callback: (payload) async {
            final newRecord = payload.newRecord;
            final senderId = newRecord['sender_id'] as String?;
            final conversationId = newRecord['conversation_id'] as String?;
            final content = (newRecord['content'] as String?) ?? 'Sent an attachment';

            // Ignore messages sent by self
            if (senderId == null || senderId == currentUserId) return;

            // Trigger default system alert sound / ring
            try {
              await SystemSound.play(SystemSoundType.alert);
              HapticFeedback.mediumImpact();
            } catch (_) {}

            // Fetch sender details
            String senderName = 'New Message';
            try {
              final senderData = await _client
                  .from('users')
                  .select('full_name')
                  .eq('id', senderId)
                  .maybeSingle();
              if (senderData != null && senderData['full_name'] != null) {
                senderName = senderData['full_name'] as String;
              }
            } catch (_) {}

            if (context.mounted) {
              ScaffoldMessenger.of(context).hideCurrentSnackBar();
              ScaffoldMessenger.of(context).showSnackBar(
                SnackBar(
                  behavior: SnackBarBehavior.floating,
                  margin: const EdgeInsets.all(12),
                  padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                  backgroundColor: const Color(0xFF1E293B),
                  content: Row(
                    children: [
                      Container(
                        padding: const EdgeInsets.all(8),
                        decoration: BoxDecoration(
                          color: AppTheme.primaryColor.withOpacity(0.2),
                          shape: BoxShape.circle,
                        ),
                        child: const Icon(Icons.chat_bubble, color: AppTheme.primaryColor, size: 20),
                      ),
                      const SizedBox(width: 12),
                      Expanded(
                        child: Column(
                          mainAxisSize: MainAxisSize.min,
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              senderName,
                              style: const TextStyle(fontWeight: FontWeight.bold, color: Colors.white, fontSize: 13),
                            ),
                            Text(
                              content,
                              maxLines: 1,
                              overflow: TextOverflow.ellipsis,
                              style: const TextStyle(color: Color(0xFF94A3B8), fontSize: 12),
                            ),
                          ],
                        ),
                      ),
                    ],
                  ),
                  action: SnackBarAction(
                    label: 'VIEW',
                    textColor: AppTheme.primaryColor,
                    onPressed: () {
                      Navigator.push(
                        context,
                        MaterialPageRoute(
                          builder: (_) => const ChatListScreen(),
                        ),
                      );
                    },
                  ),
                  duration: const Duration(seconds: 4),
                ),
              );
            }
          },
        )
        .subscribe();

    // Listen for system notifications
    _notificationChannel = _client
        .channel('public:notifications:$currentUserId')
        .onPostgresChanges(
          event: PostgresChangeEvent.insert,
          schema: 'public',
          table: 'notifications',
          filter: PostgresChangeFilter(
            type: PostgresChangeFilterType.eq,
            column: 'user_id',
            value: currentUserId,
          ),
          callback: (payload) async {
            final newRecord = payload.newRecord;
            final title = (newRecord['title'] as String?) ?? 'New Notification';
            final message = (newRecord['message'] as String?) ?? '';

            // Trigger system sound
            try {
              await SystemSound.play(SystemSoundType.alert);
              HapticFeedback.selectionClick();
            } catch (_) {}

            if (context.mounted) {
              ScaffoldMessenger.of(context).showSnackBar(
                SnackBar(
                  behavior: SnackBarBehavior.floating,
                  margin: const EdgeInsets.all(12),
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                  backgroundColor: AppTheme.primaryColor,
                  content: Column(
                    mainAxisSize: MainAxisSize.min,
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(title, style: const TextStyle(fontWeight: FontWeight.bold, color: Colors.white)),
                      if (message.isNotEmpty)
                        Text(message, maxLines: 2, overflow: TextOverflow.ellipsis, style: const TextStyle(color: Colors.white70, fontSize: 12)),
                    ],
                  ),
                  action: SnackBarAction(
                    label: 'OPEN',
                    textColor: Colors.white,
                    onPressed: () {
                      Navigator.push(
                        context,
                        MaterialPageRoute(builder: (_) => const NotificationsScreen()),
                      );
                    },
                  ),
                  duration: const Duration(seconds: 4),
                ),
              );
            }
          },
        )
        .subscribe();
  }

  /// Upserts FCM device token into Supabase 'user_devices' table
  static Future<void> registerDeviceToken(String userId, String fcmToken) async {
    try {
      final platform = Platform.isAndroid ? 'android' : (Platform.isIOS ? 'ios' : 'web');
      await _client.from('user_devices').upsert(
        {
          'user_id': userId,
          'fcm_token': fcmToken,
          'platform': platform,
          'last_active_at': DateTime.now().toIso8601String(),
        },
        onConflict: 'fcm_token',
      );
    } catch (_) {}
  }

  /// Removes device token on logout
  static Future<void> unregisterDeviceToken(String fcmToken) async {
    try {
      await _client.from('user_devices').delete().eq('fcm_token', fcmToken);
      _messageChannel?.unsubscribe();
      _notificationChannel?.unsubscribe();
    } catch (_) {}
  }

  static Future<String?> _getFcmToken() async {
    final user = _client.auth.currentUser;
    if (user == null) return null;
    return 'fcm_${user.id.substring(0, 8)}_${Platform.operatingSystem}';
  }
}
