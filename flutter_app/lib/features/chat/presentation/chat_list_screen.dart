import 'package:flutter/material.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import 'package:cached_network_image/cached_network_image.dart';
import 'package:intl/intl.dart';
import '../../../core/theme/app_theme.dart';
import '../../auth/presentation/login_screen.dart';
import '../data/chat_models.dart';
import '../data/chat_repository.dart';
import 'chat_room_screen.dart';

class ChatListScreen extends StatefulWidget {
  const ChatListScreen({super.key});

  @override
  State<ChatListScreen> createState() => _ChatListScreenState();
}

class _ChatListScreenState extends State<ChatListScreen> {
  final ChatRepository _repository = ChatRepository();
  final SupabaseClient _client = Supabase.instance.client;

  List<ChatConversationModel> _conversations = [];
  bool _isLoading = true;
  RealtimeChannel? _messagesChannel;
  RealtimeChannel? _conversationsChannel;

  @override
  void initState() {
    super.initState();
    _loadConversations();
    _subscribeToRealtime();
  }

  @override
  void dispose() {
    _messagesChannel?.unsubscribe();
    _conversationsChannel?.unsubscribe();
    super.dispose();
  }

  Future<void> _loadConversations() async {
    final user = _client.auth.currentUser;
    if (user == null) {
      if (mounted) setState(() => _isLoading = false);
      return;
    }

    final items = await _repository.getConversations(user.id);
    if (mounted) {
      setState(() {
        _conversations = items;
        _isLoading = false;
      });
    }
  }

  void _subscribeToRealtime() {
    final user = _client.auth.currentUser;
    if (user == null) return;

    // Listen to all public messages events
    _messagesChannel = _client
        .channel('public:chat_list_messages:${user.id}')
        .onPostgresChanges(
          event: PostgresChangeEvent.all,
          schema: 'public',
          table: 'messages',
          callback: (_) {
            _loadConversations();
          },
        )
        .subscribe();

    // Listen to conversations updates
    _conversationsChannel = _client
        .channel('public:chat_list_conversations:${user.id}')
        .onPostgresChanges(
          event: PostgresChangeEvent.all,
          schema: 'public',
          table: 'conversations',
          callback: (_) {
            _loadConversations();
          },
        )
        .subscribe();
  }

  @override
  Widget build(BuildContext context) {
    final user = _client.auth.currentUser;
    final timeFormat = DateFormat('hh:mm a');

    if (user == null) {
      return Scaffold(
        appBar: AppBar(title: const Text('Messages')),
        body: Center(
          child: Padding(
            padding: const EdgeInsets.all(24.0),
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                const Icon(Icons.chat_bubble_outline, size: 60, color: Colors.grey),
                const SizedBox(height: 16),
                const Text('Login Required', style: TextStyle(fontSize: 20, fontWeight: FontWeight.bold)),
                const SizedBox(height: 8),
                const Text('Log into your account to chat with buyers and sellers.', textAlign: TextAlign.center, style: TextStyle(color: Colors.grey)),
                const SizedBox(height: 24),
                ElevatedButton.icon(
                  onPressed: () async {
                    await Navigator.push(
                      context,
                      MaterialPageRoute(builder: (_) => const LoginScreen()),
                    );
                    _loadConversations();
                  },
                  icon: const Icon(Icons.login),
                  label: const Text('Log In / Register'),
                ),
              ],
            ),
          ),
        ),
      );
    }

    return Scaffold(
      appBar: AppBar(
        title: const Text('Messages & Voice Notes'),
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh),
            onPressed: _loadConversations,
          ),
        ],
      ),
      body: RefreshIndicator(
        onRefresh: _loadConversations,
        child: _isLoading
            ? const Center(child: CircularProgressIndicator())
            : _conversations.isEmpty
                ? const Center(
                    child: Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        Icon(Icons.mark_chat_unread_outlined, size: 60, color: Colors.grey),
                        SizedBox(height: 16),
                        Text('No Conversations Yet', style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
                        SizedBox(height: 6),
                        Text('Start a chat on any listing detail page.', style: TextStyle(color: Colors.grey, fontSize: 13)),
                      ],
                    ),
                  )
                : ListView.builder(
                    itemCount: _conversations.length,
                    itemBuilder: (context, index) {
                      final conv = _conversations[index];
                      final lastMsg = conv.lastMessage;
                      final otherName = conv.otherUser?.fullName ?? 'User';
                      final avatarUrl = conv.otherUser?.avatarUrl;
                      final isSystem = conv.otherUser?.role == 'moderator' || conv.otherUser?.role == 'admin' || conv.otherUser?.role == 'super_admin';

                      return ListTile(
                        onTap: () async {
                          await Navigator.push(
                            context,
                            MaterialPageRoute(
                              builder: (_) => ChatRoomScreen(
                                conversationId: conv.id,
                                listingTitle: conv.listingTitle ?? 'Listing',
                                otherUserName: isSystem ? 'All in One (System)' : otherName,
                                otherUserAvatarUrl: avatarUrl,
                                otherUserRole: conv.otherUser?.role,
                                listingImage: conv.listingImage,
                                listingPrice: conv.listingPrice,
                              ),
                            ),
                          );
                          _loadConversations();
                        },
                        leading: Stack(
                          clipBehavior: Clip.none,
                          children: [
                            if (isSystem)
                              const CircleAvatar(
                                radius: 24,
                                backgroundColor: Color(0xFF3B82F6),
                                child: Icon(Icons.shield, color: Colors.white, size: 24),
                              )
                            else if (avatarUrl != null && avatarUrl.trim().isNotEmpty)
                              CircleAvatar(
                                radius: 24,
                                backgroundColor: AppTheme.primaryLight,
                                child: ClipOval(
                                  child: CachedNetworkImage(
                                    imageUrl: avatarUrl,
                                    width: 48,
                                    height: 48,
                                    fit: BoxFit.cover,
                                    placeholder: (_, __) => const CircularProgressIndicator(strokeWidth: 2),
                                    errorWidget: (_, __, ___) => Text(
                                      otherName.isNotEmpty ? otherName[0].toUpperCase() : 'U',
                                      style: const TextStyle(fontWeight: FontWeight.bold, color: AppTheme.primaryColor),
                                    ),
                                  ),
                                ),
                              )
                            else
                              CircleAvatar(
                                radius: 24,
                                backgroundColor: AppTheme.primaryLight,
                                child: Text(
                                  otherName.isNotEmpty ? otherName[0].toUpperCase() : 'U',
                                  style: const TextStyle(fontWeight: FontWeight.bold, color: AppTheme.primaryColor),
                                ),
                              ),
                            if (conv.listingImage != null && conv.listingImage!.isNotEmpty)
                              Positioned(
                                bottom: -2,
                                right: -2,
                                child: Container(
                                  padding: const EdgeInsets.all(1.5),
                                  decoration: BoxDecoration(
                                    color: Colors.white,
                                    shape: BoxShape.circle,
                                    boxShadow: [
                                      BoxShadow(color: Colors.black.withOpacity(0.15), blurRadius: 3),
                                    ],
                                  ),
                                  child: ClipOval(
                                    child: SizedBox(
                                      width: 18,
                                      height: 18,
                                      child: CachedNetworkImage(
                                        imageUrl: conv.listingImage!,
                                        fit: BoxFit.cover,
                                      ),
                                    ),
                                  ),
                                ),
                              ),
                          ],
                        ),
                        title: Row(
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          children: [
                            Expanded(
                              child: Text(
                                isSystem ? 'All in One (System)' : otherName,
                                maxLines: 1,
                                overflow: TextOverflow.ellipsis,
                                style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 15),
                              ),
                            ),
                            if (lastMsg != null)
                              Text(
                                timeFormat.format(lastMsg.createdAt),
                                style: const TextStyle(fontSize: 11, color: Colors.grey),
                              ),
                          ],
                        ),
                        subtitle: Row(
                          children: [
                            Expanded(
                              child: Text(
                                lastMsg != null
                                    ? lastMsg.previewText
                                    : (conv.listingTitle ?? 'Chat started'),
                                maxLines: 1,
                                overflow: TextOverflow.ellipsis,
                                style: TextStyle(
                                  color: conv.unreadCount > 0 ? Colors.black87 : Colors.grey.shade600,
                                  fontWeight: conv.unreadCount > 0 ? FontWeight.bold : FontWeight.normal,
                                  fontSize: 13,
                                ),
                              ),
                            ),
                            if (conv.unreadCount > 0)
                              Container(
                                padding: const EdgeInsets.symmetric(horizontal: 7, vertical: 2),
                                decoration: BoxDecoration(
                                  color: AppTheme.primaryColor,
                                  borderRadius: BorderRadius.circular(10),
                                ),
                                child: Text(
                                  '${conv.unreadCount}',
                                  style: const TextStyle(color: Colors.white, fontSize: 11, fontWeight: FontWeight.bold),
                                ),
                              ),
                          ],
                        ),
                      );
                    },
                  ),
      ),
    );
  }
}
