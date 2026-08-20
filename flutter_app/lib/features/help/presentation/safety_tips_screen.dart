import 'package:flutter/material.dart';

class SafetyTipsScreen extends StatelessWidget {
  const SafetyTipsScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;

    final List<Map<String, dynamic>> rules = [
      {
        'icon': Icons.location_on_outlined,
        'title': 'Meet in Safe, Public Locations',
        'desc': 'Always meet buyers or sellers in crowded, well-lit places like shopping malls, bank lobbies, or cafes during daylight. Never invite strangers to private secluded spots alone.',
        'color': Colors.blue,
      },
      {
        'icon': Icons.visibility_outlined,
        'title': 'Inspect the Item Before Paying',
        'desc': 'Thoroughly check the product. Dial *#06# on mobile phones to check PTA approval via 8484. Check vehicle engine and chassis numbers against official registration documents.',
        'color': const Color(0xFF10B981),
      },
      {
        'icon': Icons.credit_card_off_outlined,
        'title': 'Avoid Advance Payments & Deposits',
        'desc': 'Never send advance money or courier delivery fees to unknown sellers via Easypaisa or JazzCash before seeing the product in person. 99% of advance fee requests are scams.',
        'color': Colors.amber,
      },
      {
        'icon': Icons.lock_outline,
        'title': 'Never Share Passwords or OTPs',
        'desc': 'All In One staff will NEVER ask for your password, PIN, or SMS verification codes. Keep your security credentials 100% confidential.',
        'color': Colors.purple,
      },
      {
        'icon': Icons.chat_bubble_outline,
        'title': 'Use In-App SafeChat',
        'desc': 'Keep all chat conversations and negotiable offers within our app to maintain a verified transaction history if any issue arises.',
        'color': Colors.teal,
      },
      {
        'icon': Icons.flag_outlined,
        'title': 'Report Suspicious Listings',
        'desc': 'If an ad seems unrealistically cheap or a user sends fake payment screenshots, immediately tap "Report Listing" so our moderators can ban them.',
        'color': Colors.redAccent,
      },
    ];

    return Scaffold(
      appBar: AppBar(
        title: const Text('Safety Tips & Guidelines'),
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Top Shield Banner
            Container(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                gradient: const LinearGradient(
                  colors: [Color(0xFF065F46), Color(0xFF047857)],
                  begin: Alignment.topLeft,
                  end: Alignment.bottomRight,
                ),
                borderRadius: BorderRadius.circular(20),
              ),
              child: const Row(
                children: [
                  Icon(Icons.gpp_good, color: Colors.white, size: 40),
                  SizedBox(width: 14),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          'Your Safety is Our Top Priority',
                          style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 16),
                        ),
                        SizedBox(height: 2),
                        Text(
                          'Follow these 6 golden rules for secure trading in Pakistan.',
                          style: TextStyle(color: Colors.white70, fontSize: 12),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 20),

            const Text(
              '6 Golden Rules for Buyers & Sellers',
              style: TextStyle(fontSize: 17, fontWeight: FontWeight.bold),
            ),
            const SizedBox(height: 12),

            ...rules.map((rule) {
              final Color color = rule['color'] as Color;
              return Container(
                margin: const EdgeInsets.only(bottom: 12),
                padding: const EdgeInsets.all(14),
                decoration: BoxDecoration(
                  color: Theme.of(context).cardColor,
                  borderRadius: BorderRadius.circular(16),
                  border: Border.all(color: isDark ? const Color(0xFF334155) : Colors.grey.shade200),
                ),
                child: Row(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Container(
                      padding: const EdgeInsets.all(10),
                      decoration: BoxDecoration(
                        color: color.withOpacity(0.12),
                        borderRadius: BorderRadius.circular(12),
                      ),
                      child: Icon(rule['icon'] as IconData, color: color, size: 22),
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            rule['title'] as String,
                            style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 14),
                          ),
                          const SizedBox(height: 4),
                          Text(
                            rule['desc'] as String,
                            style: TextStyle(
                              fontSize: 12,
                              color: isDark ? Colors.grey.shade300 : Colors.grey.shade600,
                              height: 1.4,
                            ),
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
              );
            }),
          ],
        ),
      ),
    );
  }
}
