import 'dart:async';
import 'dart:convert';
import 'dart:io';
import 'dart:typed_data';
import 'package:flutter/material.dart';
import 'package:flutter_local_notifications/flutter_local_notifications.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import '../../chat/presentation/chat_list_screen.dart';
import '../../chat/presentation/chat_room_screen.dart';
import '../presentation/notifications_screen.dart';

class PushNotificationService {
  static final SupabaseClient _client = Supabase.instance.client;
  static final FlutterLocalNotificationsPlugin _localNotifications = FlutterLocalNotificationsPlugin();
  static const FlutterSecureStorage _storage = FlutterSecureStorage();

  static RealtimeChannel? _messageChannel;
  static RealtimeChannel? _notificationChannel;
  static Timer? _backgroundPollTimer;

  static final Set<String> _notifiedMessageIds = {};
  static final Set<String> _notifiedNotificationIds = {};
  static final Set<String> _userConversationIds = {};
  static GlobalKey<NavigatorState>? _navigatorKey;

  // Cached in-memory preferences
  static Map<String, bool> _preferences = {
    'new_messages': true,
    'new_offers': true,
    'listing_status_changes': true,
    'price_drops': false,
    'marketing_emails': false,
  };

  static const String _channelIdMessages = 'all_in_one_messages_v3';
  static const String _channelNameMessages = 'Messages & Chat Alerts';
  static const String _channelDescMessages = 'Instant push alerts for incoming chat messages';

  static const String _channelIdGeneral = 'all_in_one_general_v3';
  static const String _channelNameGeneral = 'Account & Marketplace Alerts';
  static const String _channelDescGeneral = 'Notifications about verification, listings, and promotions';

  /// Initializes Local Notifications, loads user preferences, and starts listeners
  static Future<void> initialize({GlobalKey<NavigatorState>? navigatorKey}) async {
    _navigatorKey = navigatorKey;

    // 1. Load preferences from local storage & Supabase user metadata
    await loadPreferences();

    // 2. Setup Android and iOS initialization settings
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

    // 3. Request Android 13+ Notification Permission & Create Channels
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

    // 4. Start Listeners for Current User
    final user = _client.auth.currentUser;
    if (user != null) {
      _startListeners(user.id);
    }

    // 5. Listen for Auth State Changes
    _client.auth.onAuthStateChange.listen((data) {
      final session = data.session;
      if (session != null) {
        _startListeners(session.user.id);
      } else {
        stopListeners();
      }
    });
  }

  /// Loads preferences from local storage or user metadata
  static Future<Map<String, bool>> loadPreferences() async {
    try {
      final raw = await _storage.read(key: 'user_notification_preferences');
      if (raw != null) {
        final decoded = jsonDecode(raw) as Map<String, dynamic>;
        _preferences = {
          'new_messages': decoded['new_messages'] ?? true,
          'new_offers': decoded['new_offers'] ?? true,
          'listing_status_changes': decoded['listing_status_changes'] ?? true,
          'price_drops': decoded['price_drops'] ?? false,
          'marketing_emails': decoded['marketing_emails'] ?? false,
        };
        return _preferences;
      }
    } catch (_) {}

    // Fallback to Supabase User Metadata
    final user = _client.auth.currentUser;
    if (user != null && user.userMetadata != null && user.userMetadata!['notification_preferences'] != null) {
      try {
        final meta = user.userMetadata!['notification_preferences'] as Map<String, dynamic>;
        _preferences = {
          'new_messages': meta['new_messages'] ?? true,
          'new_offers': meta['new_offers'] ?? true,
          'listing_status_changes': meta['listing_status_changes'] ?? true,
          'price_drops': meta['price_drops'] ?? false,
          'marketing_emails': meta['marketing_emails'] ?? false,
        };
        await _storage.write(key: 'user_notification_preferences', value: jsonEncode(_preferences));
        return _preferences;
      } catch (_) {}
    }

    return _preferences;
  }

  /// Saves preferences both to device local storage and Supabase user metadata
  static Future<void> savePreferences(Map<String, bool> newPrefs) async {
    _preferences = Map.from(newPrefs);
    try {
      await _storage.write(key: 'user_notification_preferences', value: jsonEncode(_preferences));
    } catch (_) {}

    final user = _client.auth.currentUser;
    if (user != null) {
      try {
        await _client.auth.updateUser(
          UserAttributes(data: {'notification_preferences': _preferences}),
        );
      } catch (_) {}
    }
  }

  static bool _isPrefEnabled(String key) {
    return _preferences[key] ?? true;
  }

  /// Start Realtime Channels & Background Polling
  static Future<void> _startListeners(String userId) async {
    stopListeners();

    // Cache initial conversation IDs
    await _refreshUserConversations(userId);

    // A. Subscribe to Realtime Messages (WhatsApp-like instant push)
    _messageChannel = _client
        .channel('public_chat_messages:$userId')
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

            // 1. Ignore messages sent by self
            if (senderId.isEmpty || senderId == userId) return;

            // 2. Check if user enabled "New Chat Messages"
            if (!_isPrefEnabled('new_messages')) return;

            // 3. Avoid duplicate notifications
            if (_notifiedMessageIds.contains(messageId)) return;
            _notifiedMessageIds.add(messageId);

            // 4. Verify conversation belongs to current user
            if (!_userConversationIds.contains(conversationId)) {
              final isParticipant = await _verifyConversationParticipant(conversationId, userId);
              if (!isParticipant) return;
              _userConversationIds.add(conversationId);
            }

            // 5. Fetch sender name & listing context
            String senderName = 'Buyer/Seller';
            String listingTitle = 'Chat Message';
            try {
              final convData = await _client
                  .from('conversations')
                  .select('listing:listings(title), buyer:users!conversations_buyer_id_fkey(id, full_name), seller:users!conversations_seller_id_fkey(id, full_name)')
                  .eq('id', conversationId)
                  .maybeSingle();

              if (convData != null) {
                if (convData['listing'] != null && convData['listing']['title'] != null) {
                  listingTitle = convData['listing']['title'] as String;
                }
                final buyer = convData['buyer'];
                final seller = convData['seller'];
                if (senderId == buyer?['id']) {
                  senderName = buyer?['full_name'] ?? 'Buyer';
                } else if (senderId == seller?['id']) {
                  senderName = seller?['full_name'] ?? 'Seller';
                }
              }
            } catch (_) {
              try {
                final senderUser = await _client.from('users').select('full_name').eq('id', senderId).maybeSingle();
                if (senderUser != null && senderUser['full_name'] != null) {
                  senderName = senderUser['full_name'] as String;
                }
              } catch (_) {}
            }

            String displayBody = content;
            if (content.startsWith('[reply:')) {
              final parts = content.split(']:');
              if (parts.length > 1) displayBody = parts.sublist(1).join(']:');
            } else if (content.startsWith('[audio]:') || (content.startsWith('http') && (content.contains('.m4a') || content.contains('.mp3') || content.contains('.wav') || content.contains('.aac')))) {
              displayBody = '🎤 Voice message';
            } else if (content.startsWith('[Image]') || (content.startsWith('http') && (content.contains('.jpg') || content.contains('.png') || content.contains('.jpeg')))) {
              displayBody = '📷 Photo';
            }

            await showNativeNotification(
              id: messageId.hashCode,
              title: senderName,
              body: displayBody,
              channelId: _channelIdMessages,
              channelName: _channelNameMessages,
              payload: jsonEncode({
                'type': 'chat',
                'conversation_id': conversationId,
                'sender_name': senderName,
                'listing_title': listingTitle,
              }),
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

            if (!_isPrefEnabled('listing_status_changes')) return;
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

    // C. Background Periodic Poller (checks every 6 seconds to guarantee background delivery)
    _backgroundPollTimer = Timer.periodic(const Duration(seconds: 6), (_) async {
      await _checkNewMessagesAndNotifications(userId);
    });
  }

  static Future<void> _refreshUserConversations(String userId) async {
    try {
      final convs = await _client
          .from('conversations')
          .select('id')
          .or('buyer_id.eq.$userId,seller_id.eq.$userId');

      _userConversationIds.clear();
      for (final c in convs) {
        final id = c['id'] as String?;
        if (id != null) _userConversationIds.add(id);
      }
    } catch (_) {}
  }

  static Future<bool> _verifyConversationParticipant(String convId, String userId) async {
    try {
      final conv = await _client
          .from('conversations')
          .select('id, buyer_id, seller_id')
          .eq('id', convId)
          .maybeSingle();

      if (conv != null) {
        return conv['buyer_id'] == userId || conv['seller_id'] == userId;
      }
    } catch (_) {}
    return false;
  }

  /// Polls for unread chat messages & notifications missed when app was in background
  static Future<void> _checkNewMessagesAndNotifications(String userId) async {
    try {
      // 1. Check unread chat messages if enabled
      if (_isPrefEnabled('new_messages')) {
        await _refreshUserConversations(userId);

        if (_userConversationIds.isNotEmpty) {
          final unreadMessages = await _client
              .from('messages')
              .select('id, conversation_id, sender_id, content, created_at, sender:users!messages_sender_id_fkey(full_name)')
              .inFilter('conversation_id', _userConversationIds.toList())
              .neq('sender_id', userId)
              .eq('is_read', false)
              .order('created_at', ascending: false)
              .limit(5);

          for (final msg in unreadMessages) {
            final msgId = msg['id'] as String;
            if (!_notifiedMessageIds.contains(msgId)) {
              _notifiedMessageIds.add(msgId);

              String senderName = 'Buyer/Seller';
              final senderData = msg['sender'];
              if (senderData != null && senderData['full_name'] != null) {
                senderName = senderData['full_name'] as String;
              }

              final content = msg['content'] as String? ?? 'Sent a message';
              String displayBody = content;
              if (content.startsWith('[reply:')) {
                final parts = content.split(']:');
                if (parts.length > 1) displayBody = parts.sublist(1).join(']:');
              } else if (content.startsWith('[audio]:') || (content.startsWith('http') && (content.contains('.m4a') || content.contains('.mp3') || content.contains('.wav')))) {
                displayBody = '🎤 Voice message';
              }

              await showNativeNotification(
                id: msgId.hashCode,
                title: senderName,
                body: displayBody,
                channelId: _channelIdMessages,
                channelName: _channelNameMessages,
                payload: jsonEncode({
                  'type': 'chat',
                  'conversation_id': msg['conversation_id'],
                  'sender_name': senderName,
                  'listing_title': 'Chat',
                }),
              );
            }
          }
        }
      }

      // 2. Check unread system notifications if enabled
      if (_isPrefEnabled('listing_status_changes')) {
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

  /// Handles notification tap event (opens the exact chat room or notification screen)
  static void _onNotificationTapped(NotificationResponse response) {
    final payload = response.payload;
    if (payload == null || _navigatorKey == null) return;

    try {
      final data = jsonDecode(payload) as Map<String, dynamic>;
      final type = data['type'];

      if (type == 'chat') {
        final convId = data['conversation_id'] as String?;
        final senderName = data['sender_name'] as String? ?? 'Chat';
        final listingTitle = data['listing_title'] as String? ?? 'Listing';

        if (convId != null && convId.isNotEmpty) {
          _navigatorKey?.currentState?.push(
            MaterialPageRoute(
              builder: (_) => ChatRoomScreen(
                conversationId: convId,
                listingTitle: listingTitle,
                otherUserName: senderName,
              ),
            ),
          );
        } else {
          _navigatorKey?.currentState?.push(
            MaterialPageRoute(builder: (_) => const ChatListScreen()),
          );
        }
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
