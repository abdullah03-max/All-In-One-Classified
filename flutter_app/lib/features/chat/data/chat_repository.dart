import 'dart:io';
import 'package:supabase_flutter/supabase_flutter.dart';
import 'chat_models.dart';

class ChatRepository {
  final SupabaseClient _client = Supabase.instance.client;

  /// Fetches all active chat conversations for user
  Future<List<ChatConversationModel>> getConversations(String userId) async {
    try {
      final response = await _client
          .from('conversations')
          .select('''
            *,
            listing:listings(id, title, images, price, currency, status),
            buyer:users!conversations_buyer_id_fkey(id, full_name, avatar_url, role),
            seller:users!conversations_seller_id_fkey(id, full_name, avatar_url, role),
            messages(id, content, created_at, is_read, sender_id)
          ''')
          .or('buyer_id.eq.$userId,seller_id.eq.$userId')
          .order('updated_at', ascending: false);

      final List<dynamic> data = response as List<dynamic>;
      final list = data.map((json) => ChatConversationModel.fromJson(json, userId)).toList();

      list.sort((a, b) {
        final timeA = a.lastMessage?.createdAt ?? a.updatedAt;
        final timeB = b.lastMessage?.createdAt ?? b.updatedAt;
        return timeB.compareTo(timeA);
      });

      return list;
    } catch (e) {
      print('Fetch conversations error: $e');
      return [];
    }
  }

  /// Fetches a single conversation by ID with complete listing and user info
  Future<ChatConversationModel?> getConversationById(String conversationId, String currentUserId) async {
    try {
      final response = await _client
          .from('conversations')
          .select('''
            *,
            listing:listings(id, title, images, price, currency, status),
            buyer:users!conversations_buyer_id_fkey(id, full_name, avatar_url, role),
            seller:users!conversations_seller_id_fkey(id, full_name, avatar_url, role),
            messages(id, content, created_at, is_read, sender_id)
          ''')
          .eq('id', conversationId)
          .maybeSingle();

      if (response != null) {
        return ChatConversationModel.fromJson(response, currentUserId);
      }
      return null;
    } catch (e) {
      print('Get conversation by id error: $e');
      return null;
    }
  }

  /// Fetches message history for a conversation
  Future<List<ChatMessageModel>> getMessages(String conversationId) async {
    try {
      final response = await _client
          .from('messages')
          .select('*')
          .eq('conversation_id', conversationId)
          .order('created_at', ascending: true);

      final List<dynamic> data = response as List<dynamic>;
      return data.map((json) => ChatMessageModel.fromJson(json)).toList();
    } catch (e) {
      print('Fetch messages error: $e');
      return [];
    }
  }

  /// Sends a new text or audio voice note message
  Future<ChatMessageModel?> sendMessage({
    required String conversationId,
    required String senderId,
    required String content,
  }) async {
    try {
      final response = await _client
          .from('messages')
          .insert({
            'conversation_id': conversationId,
            'sender_id': senderId,
            'content': content,
            'is_read': false,
          })
          .select()
          .single();

      // Update conversation updated_at timestamp
      try {
        await _client
            .from('conversations')
            .update({'updated_at': DateTime.now().toIso8601String()})
            .eq('id', conversationId);
      } catch (_) {}

      return ChatMessageModel.fromJson(response);
    } catch (e) {
      print('Send message error: $e');
      return null;
    }
  }

  /// Uploads audio voice note file to Supabase Storage bucket
  /// Matches web app format: 'listing-images' bucket -> 'chat-audios/[conversationId]/voice_[timestamp].m4a'
  Future<String?> uploadVoiceNote({
    required String conversationId,
    required String userId,
    required File audioFile,
  }) async {
    final fileName = 'voice_${DateTime.now().millisecondsSinceEpoch}_${DateTime.now().microsecond}.m4a';
    final filePath = 'chat-audios/$conversationId/$fileName';

    try {
      await _client.storage.from('listing-images').upload(
        filePath,
        audioFile,
        fileOptions: const FileOptions(contentType: 'audio/mp4', upsert: true),
      );
      final publicUrl = _client.storage.from('listing-images').getPublicUrl(filePath);
      return '[audio]:$publicUrl';
    } catch (e) {
      // Fallback bucket 'chat-attachments'
      try {
        final fallbackPath = '$userId/$fileName';
        await _client.storage.from('chat-attachments').upload(
          fallbackPath,
          audioFile,
          fileOptions: const FileOptions(contentType: 'audio/mp4', upsert: true),
        );
        final publicUrl = _client.storage.from('chat-attachments').getPublicUrl(fallbackPath);
        return '[audio]:$publicUrl';
      } catch (err2) {
        print('Voice note upload error: $err2');
        return null;
      }
    }
  }

  /// Marks messages as read in database
  Future<void> markMessagesRead(String conversationId, String userId) async {
    try {
      try {
        await _client.rpc('mark_messages_read', params: {
          'p_conversation_id': conversationId,
          'p_user_id': userId,
        });
      } catch (_) {
        await _client
            .from('messages')
            .update({'is_read': true})
            .eq('conversation_id', conversationId)
            .neq('sender_id', userId);
      }
    } catch (e) {
      print('Mark read error: $e');
    }
  }

  /// Retrieves or creates conversation ID
  Future<String?> getOrCreateConversation(String listingId, String buyerId, String sellerId) async {
    try {
      // 1. Try Supabase RPC get_or_create_conversation first
      try {
        final res = await _client.rpc('get_or_create_conversation', params: {
          'p_listing_id': listingId,
          'p_buyer_id': buyerId,
          'p_seller_id': sellerId,
        });
        if (res != null && res.toString().isNotEmpty) {
          return res.toString();
        }
      } catch (_) {}

      // 2. Query existing conversation
      final existing = await _client
          .from('conversations')
          .select('id')
          .eq('listing_id', listingId)
          .eq('buyer_id', buyerId)
          .eq('seller_id', sellerId)
          .maybeSingle();

      if (existing != null) {
        return existing['id'] as String?;
      }

      // 3. Insert new conversation
      final newConv = await _client
          .from('conversations')
          .insert({
            'listing_id': listingId,
            'buyer_id': buyerId,
            'seller_id': sellerId,
          })
          .select('id')
          .single();

      return newConv['id'] as String?;
    } catch (e) {
      print('Get or create conversation error: $e');
      return null;
    }
  }
}
