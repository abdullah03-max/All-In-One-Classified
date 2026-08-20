import 'package:flutter/material.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import 'package:intl/intl.dart';
import '../../../core/theme/app_theme.dart';
import '../data/notification_model.dart';
import '../data/notification_repository.dart';

class NotificationsScreen extends StatefulWidget {
  const NotificationsScreen({super.key});

  @override
  State<NotificationsScreen> createState() => _NotificationsScreenState();
}

class _NotificationsScreenState extends State<NotificationsScreen> {
  final NotificationRepository _repository = NotificationRepository();
  final SupabaseClient _client = Supabase.instance.client;

  List<NotificationModel> _notifications = [];
  bool _isLoading = true;
  RealtimeChannel? _realtimeChannel;

  @override
  void initState() {
    super.initState();
    _loadNotifications();
    _subscribeToRealtimeNotifications();
  }

  @override
  void dispose() {
    _realtimeChannel?.unsubscribe();
    super.dispose();
  }

  Future<void> _loadNotifications() async {
    final user = _client.auth.currentUser;
    if (user == null) {
      setState(() => _isLoading = false);
      return;
    }

    setState(() => _isLoading = true);
    final items = await _repository.getNotifications(user.id);
    if (mounted) {
      setState(() {
        _notifications = items;
        _isLoading = false;
      });
    }
  }

  void _subscribeToRealtimeNotifications() {
    final user = _client.auth.currentUser;
    if (user == null) return;

    _realtimeChannel = _client
        .channel('public:notifications:${user.id}')
        .onPostgresChanges(
          event: PostgresChangeEvent.insert,
          schema: 'public',
          table: 'notifications',
          filter: PostgresChangeFilter(
            type: PostgresChangeFilterType.eq,
            column: 'user_id',
            value: user.id,
          ),
          callback: (payload) {
            final newNotif = NotificationModel.fromJson(payload.newRecord);
            setState(() {
              _notifications.insert(0, newNotif);
            });
          },
        )
        .subscribe();
  }

  void _markAllRead() async {
    final user = _client.auth.currentUser;
    if (user == null) return;

    await _repository.markAllAsRead(user.id);
    _loadNotifications();
    if (mounted) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('All notifications marked as read.')),
      );
    }
  }

  void _handleNotificationTap(NotificationModel notif) async {
    if (!notif.isRead) {
      await _repository.markAsRead(notif.id);
      setState(() {
        final idx = _notifications.indexWhere((n) => n.id == notif.id);
        if (idx != -1) {
          _notifications[idx] = NotificationModel(
            id: notif.id,
            userId: notif.userId,
            type: notif.type,
            title: notif.title,
            message: notif.message,
            isRead: true,
            data: notif.data,
            createdAt: notif.createdAt,
          );
        }
      });
    }
  }

  int get _unreadCount => _notifications.where((n) => !n.isRead).length;

  @override
  Widget build(BuildContext context) {
    final user = _client.auth.currentUser;
    final timeFormat = DateFormat('MMM dd, hh:mm a');

    if (user == null) {
      return Scaffold(
        appBar: AppBar(title: const Text('Notifications')),
        body: const Center(
          child: Padding(
            padding: EdgeInsets.all(24.0),
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Icon(Icons.notifications_none, size: 60, color: Colors.grey),
                SizedBox(height: 16),
                Text('Notifications', style: TextStyle(fontSize: 20, fontWeight: FontWeight.bold)),
                SizedBox(height: 8),
                Text('Log into your account to view your marketplace alerts.', textAlign: TextAlign.center, style: TextStyle(color: Colors.grey)),
              ],
            ),
          ),
        ),
      );
    }

    return Scaffold(
      appBar: AppBar(
        title: Text('Notifications ${_unreadCount > 0 ? "($_unreadCount)" : ""}'),
        actions: [
          if (_unreadCount > 0)
            TextButton(
              onPressed: _markAllRead,
              child: const Text('Mark All Read'),
            ),
        ],
      ),
      body: RefreshIndicator(
        onRefresh: _loadNotifications,
        child: _isLoading
            ? const Center(child: CircularProgressIndicator())
            : _notifications.isEmpty
                ? const Center(
                    child: Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        Icon(Icons.notifications_none, size: 60, color: Colors.grey),
                        SizedBox(height: 16),
                        Text('No Notifications Yet', style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
                        SizedBox(height: 6),
                        Text('You will receive updates here for messages and listings.', style: TextStyle(color: Colors.grey, fontSize: 13)),
                      ],
                    ),
                  )
                : ListView.builder(
                    padding: const EdgeInsets.symmetric(vertical: 8, horizontal: 12),
                    itemCount: _notifications.length,
                    itemBuilder: (context, index) {
                      final notif = _notifications[index];
                      final isDark = Theme.of(context).brightness == Brightness.dark;
                      final titleColor = isDark ? Colors.white : const Color(0xFF0F172A);
                      final messageColor = isDark ? const Color(0xFFCBD5E1) : const Color(0xFF475569);

                      return Container(
                        margin: const EdgeInsets.only(bottom: 8),
                        decoration: BoxDecoration(
                          color: notif.isRead
                              ? (isDark ? const Color(0xFF1E293B).withOpacity(0.5) : Colors.white)
                              : (isDark ? const Color(0xFF1E293B) : const Color(0xFFEFF6FF)),
                          borderRadius: BorderRadius.circular(16),
                          border: Border.all(
                            color: notif.isRead
                                ? (isDark ? const Color(0xFF334155).withOpacity(0.5) : Colors.grey.shade200)
                                : (isDark ? const Color(0xFF3B82F6).withOpacity(0.4) : const Color(0xFF93C5FD)),
                          ),
                        ),
                        child: ListTile(
                          contentPadding: const EdgeInsets.symmetric(horizontal: 14, vertical: 6),
                          onTap: () => _handleNotificationTap(notif),
                          leading: CircleAvatar(
                            backgroundColor: _getNotifColor(notif.type).withOpacity(0.18),
                            child: Icon(_getNotifIcon(notif.type), color: _getNotifColor(notif.type), size: 20),
                          ),
                          title: Row(
                            mainAxisAlignment: MainAxisAlignment.spaceBetween,
                            children: [
                              Expanded(
                                child: Text(
                                  notif.title,
                                  style: TextStyle(
                                    fontWeight: notif.isRead ? FontWeight.w600 : FontWeight.bold,
                                    fontSize: 14,
                                    color: titleColor,
                                  ),
                                ),
                              ),
                              Text(
                                timeFormat.format(notif.createdAt),
                                style: TextStyle(
                                  fontSize: 11,
                                  color: isDark ? const Color(0xFF94A3B8) : Colors.grey.shade600,
                                ),
                              ),
                            ],
                          ),
                          subtitle: Padding(
                            padding: const EdgeInsets.only(top: 4),
                            child: Text(
                              notif.message,
                              style: TextStyle(
                                fontSize: 13,
                                color: messageColor,
                                height: 1.35,
                              ),
                            ),
                          ),
                        ),
                      );
                    },
                  ),
      ),
    );
  }

  IconData _getNotifIcon(String type) {
    if (type == 'new_message' || type.contains('chat')) return Icons.chat_bubble_outline;
    if (type == 'listing_status_change' || type.contains('listing')) return Icons.list_alt;
    if (type == 'price_drop') return Icons.trending_down;
    if (type == 'new_offer') return Icons.local_offer_outlined;
    return Icons.notifications;
  }

  Color _getNotifColor(String type) {
    if (type == 'new_message' || type.contains('chat')) return AppTheme.primaryColor;
    if (type == 'listing_status_change' || type.contains('listing')) return const Color(0xFF10B981);
    if (type == 'price_drop') return Colors.amber.shade800;
    return Colors.purple;
  }
}
