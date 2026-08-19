import 'dart:convert';
import 'package:http/http.dart' as http;
import '../../../core/config/supabase_config.dart';

class AiChatMessage {
  final String id;
  final String sender; // 'user' or 'assistant'
  final String content;
  final DateTime timestamp;

  AiChatMessage({
    required this.id,
    required this.sender,
    required this.content,
    required this.timestamp,
  });
}

class AiAssistantService {
  static const String _groqApiKey = String.fromEnvironment('GROQ_API_KEY', defaultValue: '');
  static const String _groqUrl = 'https://api.groq.com/openai/v1/chat/completions';
  static const String _groqModel = 'llama-3.3-70b-versatile';
  static const String _backendEndpoint = SupabaseConfig.chatApiEndpoint;

  static const String _systemPrompt = '''
You are the official conversational AI Assistant for "All In One Classified" marketplace in Pakistan.

YOUR CAPABILITIES & BEHAVIOR:
1. MULTILINGUAL AUTOMATIC DETECTION:
   - Detect the user's input language automatically: English, Urdu (اردو), Roman Urdu (e.g. "ma ad kaisy post kro?", "yar mobile sell karna hai"), or mixed English-Urdu.
   - Respond fluently in the EXACT SAME LANGUAGE and tone as the user!
   - If the user speaks Roman Urdu, reply naturally in friendly Roman Urdu!
   - If the user speaks Urdu, reply in proper Urdu (اردو)!
   - If the user speaks English, reply in clear English!

2. GENERAL AI KNOWLEDGE:
   - For general questions ("Hello", "How are you?", "What is Python?", "What is Artificial Intelligence?", "Who was Albert Einstein?", "How do I create a website?", math, science, history, coding, general life questions), answer naturally, intelligently, and accurately using your broad AI knowledge in the user's language!
   - DO NOT say "I don't have information about this" for general knowledge questions!

3. MARKETPLACE KNOWLEDGE:
   - Platform Name: All In One Classified Marketplace.
   - Posting Ads: Users tap '+ Post Ad', upload up to 10 photos, select category (Mobiles & Tablets, Vehicles & Cars, Property, Electronics, Bikes, Fashion, Jobs, Services), set price in PKR, select condition (New, Used, Refurbished, Open Box), location, and publish.
   - Seller Verification / Blue Badge: Go to Profile -> Account Verification, enter 13-digit CNIC, pick Date of Birth, upload CNIC Front, Back, and Selfie photo. Admin reviews and awards verified seller checkmark.
   - Promoting Ads: Users can promote listings with Safepay checkout (Debit/Credit Card, JazzCash, EasyPaisa). Featured Ads (PKR 500 / 7 days), Top Spot VIP (PKR 1,000 / 14 days).
   - Messaging: Real-time text chat and voice audio notes between buyers and sellers directly on listing pages.
   - Safety: Meet in safe public places, inspect items before payment, avoid sharing passwords.

4. FORMATTING:
   - Use clean, structured Markdown formatting (bolding, bullet points, numbered lists).
''';

  /// Sends query to Groq Llama 3.3 70B with conversation history and fallback
  Future<String> askAi({
    required String query,
    required List<AiChatMessage> history,
  }) async {
    final cleanQuery = query.trim();
    if (cleanQuery.isEmpty) return '';

    // 1. Direct High-Speed Groq Llama 3.3 70B API Call
    try {
      final messages = <Map<String, String>>[
        {'role': 'system', 'content': _systemPrompt}
      ];

      for (final m in history.take(6)) {
        messages.add({
          'role': m.sender == 'assistant' ? 'assistant' : 'user',
          'content': m.content,
        });
      }

      messages.add({'role': 'user', 'content': cleanQuery});

      final response = await http.post(
        Uri.parse(_groqUrl),
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer $_groqApiKey',
        },
        body: jsonEncode({
          'model': _groqModel,
          'messages': messages,
          'temperature': 0.5,
          'max_tokens': 800,
        }),
      ).timeout(const Duration(seconds: 15));

      if (response.statusCode == 200) {
        final data = jsonDecode(utf8.decode(response.bodyBytes));
        final answer = data['choices']?[0]?['message']?['content'] as String?;
        if (answer != null && answer.trim().isNotEmpty) {
          return answer.trim();
        }
      }
    } catch (_) {}

    // 2. Serverless Backend Endpoint Fallback
    try {
      final historyPayload = history.take(6).map((m) => {
        'sender': m.sender,
        'content': m.content,
      }).toList();

      final response = await http.post(
        Uri.parse(_backendEndpoint),
        headers: {'Content-Type': 'application/json'},
        body: jsonEncode({
          'message': cleanQuery,
          'history': historyPayload,
        }),
      ).timeout(const Duration(seconds: 10));

      if (response.statusCode == 200) {
        final data = jsonDecode(utf8.decode(response.bodyBytes));
        if (data is Map && data['answer'] != null) {
          return data['answer'].toString().trim();
        }
      }
    } catch (_) {}

    // 3. Intelligent Bilingual Offline Fallback
    return _generateFallback(cleanQuery);
  }

  String _generateFallback(String query) {
    final q = query.toLowerCase();

    // Post Ad / Add Listing
    if (q.contains('post') || q.contains('ad') || q.contains('listing') || q.contains('sell') || q.contains('bechna') || q.contains('lagani')) {
      return "To post an ad on All In One:\n1. Tap the **+ Post Ad** tab at the bottom.\n2. Upload up to 10 photos of your item.\n3. Enter Title, Category, Price, Condition, and Location.\n4. Tap **Post Ad Now** to publish instantly!";
    }

    // Safepay / Payment
    if (q.contains('safepay') || q.contains('payment') || q.contains('promote') || q.contains('featured') || q.contains('boost') || q.contains('paise')) {
      return "You can promote your listings with **Safepay**:\n- Choose Featured (PKR 500 / 7 days) or Top Spot (PKR 1,000 / 14 days).\n- Pay securely via Debit/Credit card or JazzCash/EasyPaisa through Safepay Checkout.";
    }

    // Account Verification / KYC
    if (q.contains('verify') || q.contains('badge') || q.contains('kyc') || q.contains('cnic') || q.contains('blue check')) {
      return "To get a **Verified Seller Badge**:\n1. Go to **Profile -> Account Verification**.\n2. Fill in your CNIC details and select your Date of Birth.\n3. Upload clear photos of CNIC Front, Back, and Selfie.\n4. Admin will review your application and award the verified checkmark!";
    }

    // Chat / Messages
    if (q.contains('chat') || q.contains('message') || q.contains('contact seller') || q.contains('rabta')) {
      return "You can chat in real-time with any seller directly on any listing by tapping **Chat with Seller**. You can send text messages and voice audio notes!";
    }

    // Default friendly response
    return "Hello! I am your **All In One AI Assistant** ✨.\n\nI can help you with:\n- How to post and feature classified ads\n- Account verification & Blue Badge\n- Safe buying & selling tips\n- General and marketplace questions in English, Urdu, and Roman Urdu!\n\nWhat would you like to ask?";
  }
}
