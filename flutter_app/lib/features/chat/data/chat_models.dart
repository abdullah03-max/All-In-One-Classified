class ChatUserModel {
  final String id;
  final String fullName;
  final String? avatarUrl;
  final String? role;

  ChatUserModel({
    required this.id,
    required this.fullName,
    this.avatarUrl,
    this.role,
  });

  factory ChatUserModel.fromJson(Map<String, dynamic> json) {
    return ChatUserModel(
      id: json['id'] ?? '',
      fullName: json['full_name'] ?? 'User',
      avatarUrl: json['avatar_url'],
      role: json['role'],
    );
  }
}

class ChatReplyInfo {
  final String replyToId;
  final String replyToSender;
  final String replyToText;

  ChatReplyInfo({
    required this.replyToId,
    required this.replyToSender,
    required this.replyToText,
  });
}

class ChatMessageModel {
  final String id;
  final String conversationId;
  final String senderId;
  final String rawContent;
  final DateTime createdAt;
  final bool isRead;
  final ChatReplyInfo? replyInfo;
  final String cleanContent;

  ChatMessageModel({
    required this.id,
    required this.conversationId,
    required this.senderId,
    required this.rawContent,
    required this.createdAt,
    this.isRead = false,
    this.replyInfo,
    required this.cleanContent,
  });

  // Alias for backward compatibility
  String get content => cleanContent;

  bool get isAudioVoiceNote {
    final c = cleanContent.trim();
    return c.startsWith('[audio]:') ||
        c.contains('chat-audios') ||
        c.endsWith('.webm') ||
        c.endsWith('.m4a') ||
        c.endsWith('.mp3') ||
        c.endsWith('.aac') ||
        c.endsWith('.ogg');
  }

  String? get audioUrl {
    if (!isAudioVoiceNote) return null;
    final c = cleanContent.trim();
    if (c.startsWith('[audio]:')) {
      return c.substring(8).trim();
    }
    return c;
  }

  List<double> get waveformBars {
    final url = audioUrl;
    if (url != null && url.contains('wf=')) {
      try {
        final uri = Uri.parse(url);
        final wfStr = uri.queryParameters['wf'];
        if (wfStr != null && wfStr.isNotEmpty) {
          final parts = wfStr.split(',');
          final parsed = parts.map((p) => double.tryParse(p) ?? 20.0).toList();
          if (parsed.isNotEmpty) {
            final maxVal = parsed.reduce((a, b) => a > b ? a : b);
            final scale = maxVal > 0 ? maxVal : 100.0;
            return parsed.map((v) => (v / scale).clamp(0.12, 1.0)).toList();
          }
        }
      } catch (_) {}
    }
    // Fallback deterministic waveform based on message id for older messages
    final hash = id.hashCode.abs();
    final List<double> fallback = [];
    for (int i = 0; i < 30; i++) {
      final v = ((hash * (i + 1) * 37) % 85 + 15) / 100.0;
      fallback.add(v.clamp(0.15, 0.95));
    }
    return fallback;
  }

  String get previewText {
    if (isAudioVoiceNote) return '🎤 Voice Message';
    if (cleanContent.startsWith('[Image]') || cleanContent.startsWith('http') && (cleanContent.endsWith('.jpg') || cleanContent.endsWith('.png') || cleanContent.endsWith('.jpeg'))) {
      return '📷 Photo';
    }
    return cleanContent;
  }

  static (ChatReplyInfo?, String) parseContent(String text) {
    if (text.startsWith('[reply:')) {
      final closingIdx = text.indexOf(']:');
      if (closingIdx != -1) {
        final metaStr = text.substring(7, closingIdx);
        final remaining = text.substring(closingIdx + 2);
        final parts = metaStr.split('|');
        if (parts.length >= 3) {
          final info = ChatReplyInfo(
            replyToId: parts[0],
            replyToSender: parts[1],
            replyToText: parts.sublist(2).join('|'),
          );
          return (info, remaining);
        }
      }
    }
    return (null, text);
  }

  factory ChatMessageModel.fromJson(Map<String, dynamic> json) {
    final raw = json['content'] as String? ?? '';
    final (reply, clean) = parseContent(raw);

    return ChatMessageModel(
      id: json['id'] ?? '',
      conversationId: json['conversation_id'] ?? '',
      senderId: json['sender_id'] ?? '',
      rawContent: raw,
      createdAt: json['created_at'] != null ? DateTime.tryParse(json['created_at']) ?? DateTime.now() : DateTime.now(),
      isRead: json['is_read'] ?? false,
      replyInfo: reply,
      cleanContent: clean,
    );
  }
}

class ChatConversationModel {
  final String id;
  final String listingId;
  final String buyerId;
  final String sellerId;
  final String? listingTitle;
  final String? listingImage;
  final double? listingPrice;
  final String? listingCurrency;
  final String? listingStatus;
  final ChatUserModel? buyer;
  final ChatUserModel? seller;
  final ChatUserModel? otherUser;
  final ChatMessageModel? lastMessage;
  final int unreadCount;
  final DateTime updatedAt;

  ChatConversationModel({
    required this.id,
    required this.listingId,
    required this.buyerId,
    required this.sellerId,
    this.listingTitle,
    this.listingImage,
    this.listingPrice,
    this.listingCurrency,
    this.listingStatus,
    this.buyer,
    this.seller,
    this.otherUser,
    this.lastMessage,
    this.unreadCount = 0,
    required this.updatedAt,
  });

  factory ChatConversationModel.fromJson(Map<String, dynamic> json, String currentUserId) {
    final buyer = json['buyer'] != null ? ChatUserModel.fromJson(json['buyer']) : null;
    final seller = json['seller'] != null ? ChatUserModel.fromJson(json['seller']) : null;
    final otherUser = (buyer?.id == currentUserId) ? seller : buyer;

    final listing = json['listing'];
    String? title = listing?['title'];
    double? price = listing?['price'] != null ? (listing['price'] as num).toDouble() : null;
    String? currency = listing?['currency'] ?? 'PKR';
    String? status = listing?['status'];
    String? image;
    if (listing?['images'] is List && (listing['images'] as List).isNotEmpty) {
      image = listing['images'][0];
    }

    ChatMessageModel? lastMsg;
    if (json['messages'] is List && (json['messages'] as List).isNotEmpty) {
      final msgs = (json['messages'] as List).map((m) => ChatMessageModel.fromJson(m)).toList();
      msgs.sort((a, b) => b.createdAt.compareTo(a.createdAt));
      lastMsg = msgs.first;
    }

    // Calculate unread count for current user
    int count = 0;
    if (json['messages'] is List) {
      for (final m in json['messages']) {
        if (m['is_read'] == false && m['sender_id'] != currentUserId) {
          count++;
        }
      }
    }

    return ChatConversationModel(
      id: json['id'] ?? '',
      listingId: json['listing_id'] ?? '',
      buyerId: json['buyer_id'] ?? '',
      sellerId: json['seller_id'] ?? '',
      listingTitle: title ?? 'Marketplace Item',
      listingImage: image,
      listingPrice: price,
      listingCurrency: currency,
      listingStatus: status,
      buyer: buyer,
      seller: seller,
      otherUser: otherUser,
      lastMessage: lastMsg,
      unreadCount: count,
      updatedAt: json['updated_at'] != null ? DateTime.tryParse(json['updated_at']) ?? DateTime.now() : DateTime.now(),
    );
  }
}
