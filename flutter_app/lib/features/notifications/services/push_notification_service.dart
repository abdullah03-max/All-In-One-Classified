import 'dart:async';
import 'dart:convert';
import 'dart:io';
import 'dart:typed_data';
import 'package:flutter/material.dart';
import 'package:flutter_local_notifications/flutter_local_notifications.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import '../../chat/presentation/chat_list_screen.dart';
import '../presentation/notifications_screen.dart';

class PushNotificationService {
  static final SupabaseClient _client = Supabase.instance.client;
  static final FlutterLocalNotificationsPlugin _localNotifications = FlutterLocalNotificationsPlugin();

  static RealtimeChannel? _messageChannel;
  static RealtimeChannel? _notificationChannel;
  static Timer? _backgroundPollTimer;

  static final Set<String> _notifiedMessageIds = {};
  static final Set<String> _notifiedNotificationIds = {};
  static GlobalKey<NavigatorState>? _navigatorKey;

  static const String _channelIdMessages = 'all_in_one_messages_v2';
  static const String _channelNameMessages = 'Messages & Chat Alerts';
  static const String _channelDescMessages = 'Instant alerts for incoming chat messages';

  static const String _channelIdGeneral = 'all_in_one_general_v2';
  static const String _channelNameGeneral = 'Account & Marketplace Alerts';
  static const String _channelDescGeneral = 'Notifications about verification, listings, and promotions';

  /// Initializes Local Notifications & Real-Time Listeners
  static Future<void> initialize({GlobalKey<NavigatorState>? navigatorKey}) async {
    _navigatorKey = navigatorKey;

    // 1. Setup Android and iOS initialization settings
    const androidSettings = AndroidInitializationSettings('@mipmap/ic_launcher');
    const darwinSettings = DarwinInitializationSettings(
      requestAlertPermission: true,
      requestBadgePermission: true,
      requestSoundPermission: true,
    );

    const initSettings = InitializationSettings(
      android: androidSettings,
      iOS: darwinSettings,
    );

    await _localNotifications.initialize(
      settings: initSettings,
      onDidReceiveNotificationResponse: _onNotificationTapped,
    );

    // 2. Request Android 13+ Notification Permission & Create Channels
    if (Platform.isAndroid) {
      final androidImplementation = _localNotifications
          .resolvePlatformSpecificImplementation<AndroidFlutterLocalNotificationsPlugin>();

      await androidImplementation?.requestNotificationsPermission();

      // Create High Importance Channel for Messages (Heads-up with Sound & Vibration)
      final messageChannel = AndroidNotificationChannel(
        _channelIdMessages,
        _channelNameMessages,
        description: _channelDescMessages,
        importance: Importance.max,
        playSound: true,
        enableVibration: true,
        vibrationPattern: Int64List.fromList([0, 250, 200, 250]),
        showBadge: true,
        enableLights: true,
      );

      // Create Channel for General Notifications
      final generalChannel = AndroidNotificationChannel(
        _channelIdGeneral,
        _channelNameGeneral,
        description: _channelDescGeneral,
        importance: Importance.high,
        playSound: true,
        enableVibration: true,
        showBadge: true,
      );

      await androidImplementation?.createNotificationChannel(messageChannel);
      await androidImplementation?.createNotificationChannel(generalChannel);
    }

    // 3. Start Listeners for Current User
    final user = _client.auth.currentUser;
    if (user != null) {
      _startListeners(user.id);
    }

    // 4. Listen for Auth State Changes
    _client.auth.onAuthStateChange.listen((data) {
      final session = data.session;
      if (session != null) {
        _startListeners(session.user.id);
      } else {
        stopListeners();
      }
    });
  }

  /// Start Realtime Channels & Background Polling
  static void _startListeners(String userId) {
    stopListeners();

    // A. Subscribe to Realtime Messages
    _messageChannel = _client
        .channel('user_messages:$userId')
        .onPostgresChanges(
          event: PostgresChangeEvent.insert,
          schema: 'public',
          table: 'messages',
          callback: (payload) async {
            final record = payload.newRecord;
            if (record.isEmpty) return;

            final messageId = record['id'] as String? ?? '';
            final senderId = record['sender_id'] as String? ?? '';
            final conversationId = record['conversation_id'] as String? ?? '';
            final content = record['content'] as String? ?? 'Sent a message';

            if (senderId == userId) return; // Don't notify self
            if (_notifiedMessageIds.contains(messageId)) return;
            _notifiedMessageIds.add(messageId);

            // Fetch sender name
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

            String displayBody = content;
            if (content.startsWith('[reply:')) {
              final parts = content.split(']:');
              if (parts.length > 1) displayBody = parts.sublist(1).join(']:');
            } else if (content.startsWith('http') && (content.contains('.m4a') || content.contains('.mp3') || content.contains('.wav') || content.contains('.aac'))) {
              displayBody = '🎤 Voice message';
            }

            await showNativeNotification(
              id: messageId.hashCode,
              title: senderName,
              body: displayBody,
              channelId: _channelIdMessages,
              channelName: _channelNameMessages,
              payload: jsonEncode({'type': 'chat', 'conversation_id': conversationId}),
            );
          },
        )
        .subscribe();

    // B. Subscribe to Realtime Notifications (KYC, Listing approval, etc.)
    _notificationChannel = _client
        .channel('user_notifications:$userId')
        .onPostgresChanges(
          event: PostgresChangeEvent.insert,
          schema: 'public',
          table: 'notifications',
          filter: PostgresChangeFilter(
            type: PostgresChangeFilterType.eq,
            column: 'user_id',
            value: userId,
          ),
          callback: (payload) async {
            final record = payload.newRecord;
            if (record.isEmpty) return;

            final notifId = record['id'] as String? ?? '';
            final title = record['title'] as String? ?? 'All In One Notification';
            final message = record['message'] as String? ?? '';

            if (_notifiedNotificationIds.contains(notifId)) return;
            _notifiedNotificationIds.add(notifId);

            await showNativeNotification(
              id: notifId.hashCode,
              title: title,
              body: message,
              channelId: _channelIdGeneral,
              channelName: _channelNameGeneral,
              payload: jsonEncode({'type': 'notification', 'id': notifId}),
            );
          },
        )
        .subscribe();

    // C. Background Periodic Poller (checks every 12 seconds to guarantee background delivery)
    _backgroundPollTimer = Timer.periodic(const Duration(seconds: 12), (_) async {
      await _checkNewMessagesAndNotifications(userId);
    });
  }

  /// Polls for any unread messages or notifications missed during screen switch
  static Future<void> _checkNewMessagesAndNotifications(String userId) async {
    try {
      // 1. Check unread notifications
      final notifications = await _client
          .from('notifications')
          .select('id, title, message, is_read, created_at')
          .eq('user_id', userId)
          .eq('is_read', false)
          .order('created_at', ascending: false)
          .limit(5);

      for (final n in notifications) {
        final notifId = n['id'] as String;
        if (!_notifiedNotificationIds.contains(notifId)) {
          _notifiedNotificationIds.add(notifId);
          await showNativeNotification(
            id: notifId.hashCode,
            title: n['title'] as String? ?? 'Notification',
            body: n['message'] as String? ?? '',
            channelId: _channelIdGeneral,
            channelName: _channelNameGeneral,
            payload: jsonEncode({'type': 'notification', 'id': notifId}),
          );
        }
      }
    } catch (_) {}
  }

  /// Displays Native Heads-Up Notification with System Sound & Vibration
  static Future<void> showNativeNotification({
    required int id,
    required String title,
    required String body,
    required String channelId,
    required String channelName,
    String? payload,
  }) async {
    final androidDetails = AndroidNotificationDetails(
      channelId,
      channelName,
      importance: Importance.max,
      priority: Priority.high,
      playSound: true,
      enableVibration: true,
      vibrationPattern: Int64List.fromList([0, 250, 200, 250]),
      styleInformation: BigTextStyleInformation(body),
      icon: '@mipmap/ic_launcher',
    );

    const darwinDetails = DarwinNotificationDetails(
      presentAlert: true,
      presentBadge: true,
      presentSound: true,
    );

    final details = NotificationDetails(
      android: androidDetails,
      iOS: darwinDetails,
    );

    await _localNotifications.show(
      id: id,
      title: title,
      body: body,
      notificationDetails: details,
      payload: payload,
    );
  }

  /// Handles notification tap event
  static void _onNotificationTapped(NotificationResponse response) {
    final payload = response.payload;
    if (payload == null || _navigatorKey == null) return;

    try {
      final data = jsonDecode(payload) as Map<String, dynamic>;
      final type = data['type'];

      if (type == 'chat') {
        _navigatorKey?.currentState?.push(
          MaterialPageRoute(builder: (_) => const ChatListScreen()),
        );
      } else if (type == 'notification') {
        _navigatorKey?.currentState?.push(
          MaterialPageRoute(builder: (_) => const NotificationsScreen()),
        );
      }
    } catch (_) {}
  }

  /// Stops all active listeners and timers
  static void stopListeners() {
    _messageChannel?.unsubscribe();
    _notificationChannel?.unsubscribe();
    _backgroundPollTimer?.cancel();
    _messageChannel = null;
    _notificationChannel = null;
    _backgroundPollTimer = null;
  }
}
