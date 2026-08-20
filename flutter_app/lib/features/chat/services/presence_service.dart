import 'package:flutter/foundation.dart';
import 'package:supabase_flutter/supabase_flutter.dart';

class PresenceService {
  static final PresenceService _instance = PresenceService._internal();
  factory PresenceService() => _instance;
  PresenceService._internal();

  final SupabaseClient _client = Supabase.instance.client;
  RealtimeChannel? _presenceChannel;
  final ValueNotifier<Set<String>> onlineUserIdsNotifier = ValueNotifier<Set<String>>({});

  void init() {
    final user = _client.auth.currentUser;
    if (user == null) {
      onlineUserIdsNotifier.value = {};
      return;
    }

    _presenceChannel?.unsubscribe();
    final channel = _client.channel('global-presence');
    _presenceChannel = channel;

    void updatePresence() {
      try {
        final state = channel.presenceState();
        final Set<String> onlineIds = {};
        for (final entry in state) {
          for (final p in entry.presences) {
            final uid = p.payload['user_id'] as String?;
            if (uid != null && uid.isNotEmpty) {
              onlineIds.add(uid);
            }
          }
        }
        onlineUserIdsNotifier.value = onlineIds;
      } catch (e) {
        debugPrint('[Presence] Error updating presence: $e');
      }
    }

    channel
      .onPresenceSync((_) => updatePresence())
      .onPresenceJoin((_) => updatePresence())
      .onPresenceLeave((_) => updatePresence())
      .subscribe((status, [error]) async {
        if (status == RealtimeSubscribeStatus.subscribed) {
          try {
            await channel.track({
              'user_id': user.id,
              'online_at': DateTime.now().toIso8601String(),
            });
            updatePresence();
          } catch (_) {}
        }
      });
  }

  bool isUserOnline(String? userId, {String? role}) {
    if (role == 'admin' || role == 'super_admin' || role == 'moderator') {
      return true; // System / Support accounts are always active
    }
    if (userId == null || userId.isEmpty) return false;
    return onlineUserIdsNotifier.value.contains(userId);
  }

  void dispose() {
    try {
      _presenceChannel?.untrack();
      _presenceChannel?.unsubscribe();
    } catch (_) {}
    _presenceChannel = null;
  }
}
