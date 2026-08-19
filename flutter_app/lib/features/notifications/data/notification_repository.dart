import 'package:supabase_flutter/supabase_flutter.dart';
import 'notification_model.dart';

class NotificationRepository {
  final SupabaseClient _client = Supabase.instance.client;

  /// Fetches recent notifications for user
  Future<List<NotificationModel>> getNotifications(String userId) async {
    try {
      final response = await _client
          .from('notifications')
          .select('*')
          .eq('user_id', userId)
          .order('created_at', ascending: false)
          .limit(50);

      final List<dynamic> data = response as List<dynamic>;
      return data.map((json) => NotificationModel.fromJson(json)).toList();
    } catch (e) {
      print('Fetch notifications error: $e');
      return [];
    }
  }

  /// Marks a single notification as read
  Future<void> markAsRead(String notificationId) async {
    try {
      await _client
          .from('notifications')
          .update({'is_read': true})
          .eq('id', notificationId);
    } catch (e) {
      print('Mark read error: $e');
    }
  }

  /// Marks all notifications as read for current user
  Future<void> markAllAsRead(String userId) async {
    try {
      await _client
          .from('notifications')
          .update({'is_read': true})
          .eq('user_id', userId);
    } catch (e) {
      print('Mark all read error: $e');
    }
  }
}
