import 'dart:convert';
import 'package:http/http.dart' as http;
import 'package:supabase_flutter/supabase_flutter.dart';

class PaymentPackageModel {
  final String id;
  final String name;
  final int price;
  final int durationDays;
  final String description;

  PaymentPackageModel({
    required this.id,
    required this.name,
    required this.price,
    required this.durationDays,
    required this.description,
  });
}

class PaymentRepository {
  final SupabaseClient _client = Supabase.instance.client;
  static const String _apiBaseUrl = 'https://all-in-one-classified.vercel.app/api/safepay';

  final List<PaymentPackageModel> packages = [
    PaymentPackageModel(
      id: 'urgent',
      name: 'Urgent Badge',
      price: 500,
      durationDays: 7,
      description: 'Get an URGENT badge on your listing for 7 days to sell faster.',
    ),
    PaymentPackageModel(
      id: 'featured',
      name: 'Featured Ad',
      price: 1200,
      durationDays: 15,
      description: 'Top placement on Homepage & Search results for 15 days.',
    ),
    PaymentPackageModel(
      id: 'vip',
      name: 'Premium VIP',
      price: 2500,
      durationDays: 30,
      description: 'Maximum visibility with VIP gold styling for 30 days.',
    ),
  ];

  /// Initiates Safepay Checkout Server-Side (Secure - No Secret Keys in Mobile App)
  Future<Map<String, dynamic>?> createSafepayCheckoutTracker({
    required String listingId,
    required String packageId,
  }) async {
    final user = _client.auth.currentUser;
    if (user == null) return null;

    try {
      final response = await http.post(
        Uri.parse('$_apiBaseUrl/create-tracker'),
        headers: {'Content-Type': 'application/json'},
        body: jsonEncode({
          'listing_id': listingId,
          'user_id': user.id,
          'package_id': packageId,
        }),
      );

      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);
        return data; // { success: true, tracker_token, checkout_url }
      } else {
        print('Safepay server error: ${response.body}');
        return null;
      }
    } catch (e) {
      print('Initiate Safepay tracker error: $e');
      return null;
    }
  }

  /// Verifies Payment Server-Side with Supabase RPC
  Future<bool> verifyPaymentServerSide(String trackerToken) async {
    try {
      final response = await http.post(
        Uri.parse('$_apiBaseUrl/verify-tracker'),
        headers: {'Content-Type': 'application/json'},
        body: jsonEncode({'tracker_token': trackerToken}),
      );

      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);
        return data['success'] == true || data['status'] == 'completed';
      }
      return false;
    } catch (e) {
      print('Verify payment error: $e');
      return false;
    }
  }
}
