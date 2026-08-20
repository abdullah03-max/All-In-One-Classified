import 'package:flutter/material.dart';
import 'package:url_launcher/url_launcher.dart';
import '../../../core/theme/app_theme.dart';
import 'safety_tips_screen.dart';

class HelpCenterScreen extends StatefulWidget {
  const HelpCenterScreen({super.key});

  @override
  State<HelpCenterScreen> createState() => _HelpCenterScreenState();
}

class _HelpCenterScreenState extends State<HelpCenterScreen> {
  final TextEditingController _searchController = TextEditingController();
  String _searchQuery = '';
  String _selectedCategory = 'All';

  final List<Map<String, String>> _faqs = [
    {
      'category': 'Posting & Selling',
      'question': 'How do I post a free ad?',
      'answer': 'Tap the "+" icon on the bottom navigation bar or "Post an Ad". Select your category, enter details, price, upload photos & product video, and submit. Your ad will be sent for quick moderation approval and then go live immediately!',
    },
    {
      'category': 'Posting & Selling',
      'question': 'How long does ad moderation take?',
      'answer': 'Our moderators review ads 24/7. Most ads are approved and published within 5 to 15 minutes.',
    },
    {
      'category': 'Posting & Selling',
      'question': 'How can I edit or delete my ad?',
      'answer': 'Go to your Profile tab -> My Listings. Find the ad and tap "Edit" to modify details or tap the trash icon to delete permanently.',
    },
    {
      'category': 'Buying & Chat',
      'question': 'How do I chat with a seller?',
      'answer': 'Open any listing and tap "Chat with Seller". You can send text messages, negotiable offers, and voice notes securely through our built-in SafeChat without sharing your personal phone number.',
    },
    {
      'category': 'Buying & Chat',
      'question': 'How do I make a negotiable price offer?',
      'answer': 'On the listing details page or inside the chat screen, tap "Make an Offer" and enter your proposed price in PKR.',
    },
    {
      'category': 'Account & Safety',
      'question': 'How do I get the Verified Seller Badge?',
      'answer': 'Go to Profile -> Account Verification. Submit your CNIC and phone details. Once verified by our team, your profile and ads will display a blue "Verified Account" badge.',
    },
    {
      'category': 'Account & Safety',
      'question': 'What should I do if I suspect a scam?',
      'answer': 'Tap the "Report Listing" button on the ad page, choose the reason (e.g., Scam or Fraud), and describe the issue. Our moderation team will investigate immediately.',
    },
  ];

  final List<String> _categories = ['All', 'Posting & Selling', 'Buying & Chat', 'Account & Safety'];

  @override
  void dispose() {
    _searchController.dispose();
    super.dispose();
  }

  List<Map<String, String>> get _filteredFaqs {
    return _faqs.where((faq) {
      final matchesCat = _selectedCategory == 'All' || faq['category'] == _selectedCategory;
      final q = _searchQuery.toLowerCase();
      final matchesSearch = q.isEmpty ||
          faq['question']!.toLowerCase().contains(q) ||
          faq['answer']!.toLowerCase().contains(q);
      return matchesCat && matchesSearch;
    }).toList();
  }

  Future<void> _contactSupport(String channel) async {
    if (channel == 'whatsapp') {
      final Uri uri = Uri.parse('https://wa.me/923001234567?text=Hello%20All%20In%20One%20Support');
      if (await canLaunchUrl(uri)) {
        await launchUrl(uri, mode: LaunchMode.externalApplication);
      }
    } else if (channel == 'email') {
      final Uri uri = Uri.parse('mailto:support@bazaar.pk?subject=Support%20Inquiry');
      if (await canLaunchUrl(uri)) {
        await launchUrl(uri);
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;

    return Scaffold(
      appBar: AppBar(
        title: const Text('Help Center & Support'),
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Search Header Box
            Container(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                gradient: const LinearGradient(
                  colors: [Color(0xFF1E1B4B), Color(0xFF312E81)],
                  begin: Alignment.topLeft,
                  end: Alignment.bottomRight,
                ),
                borderRadius: BorderRadius.circular(20),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Text(
                    'How can we help you?',
                    style: TextStyle(color: Colors.white, fontSize: 18, fontWeight: FontWeight.bold),
                  ),
                  const SizedBox(height: 4),
                  Text(
                    'Search FAQs, safety guides or contact support.',
                    style: TextStyle(color: Colors.white.withOpacity(0.8), fontSize: 12),
                  ),
                  const SizedBox(height: 12),
                  Container(
                    decoration: BoxDecoration(
                      color: Colors.white,
                      borderRadius: BorderRadius.circular(12),
                    ),
                    child: TextField(
                      controller: _searchController,
                      onChanged: (v) => setState(() => _searchQuery = v),
                      style: const TextStyle(color: Colors.black87),
                      decoration: const InputDecoration(
                        hintText: 'Search help topics...',
                        hintStyle: TextStyle(color: Colors.grey),
                        prefixIcon: Icon(Icons.search, color: Colors.grey),
                        border: InputBorder.none,
                        contentPadding: EdgeInsets.symmetric(vertical: 12),
                      ),
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 16),

            // Quick Safety Tips Banner
            InkWell(
              onTap: () {
                Navigator.push(
                  context,
                  MaterialPageRoute(builder: (_) => const SafetyTipsScreen()),
                );
              },
              borderRadius: BorderRadius.circular(16),
              child: Container(
                padding: const EdgeInsets.all(14),
                decoration: BoxDecoration(
                  color: const Color(0xFF10B981).withOpacity(isDark ? 0.15 : 0.1),
                  borderRadius: BorderRadius.circular(16),
                  border: Border.all(color: const Color(0xFF10B981).withOpacity(0.3)),
                ),
                child: const Row(
                  children: [
                    Icon(Icons.shield_outlined, color: Color(0xFF10B981), size: 28),
                    SizedBox(width: 12),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text('Safety Tips & Scam Protection', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 14)),
                          Text('Important rules to buy & sell safely', style: TextStyle(fontSize: 11, color: Colors.grey)),
                        ],
                      ),
                    ),
                    Icon(Icons.arrow_forward_ios, size: 14, color: Color(0xFF10B981)),
                  ],
                ),
              ),
            ),
            const SizedBox(height: 20),

            // Category Chips
            SingleChildScrollView(
              scrollDirection: Axis.horizontal,
              child: Row(
                children: _categories.map((cat) {
                  final isSelected = _selectedCategory == cat;
                  return Padding(
                    padding: const EdgeInsets.only(right: 8.0),
                    child: ChoiceChip(
                      label: Text(cat),
                      selected: isSelected,
                      onSelected: (selected) {
                        if (selected) setState(() => _selectedCategory = cat);
                      },
                    ),
                  );
                }).toList(),
              ),
            ),
            const SizedBox(height: 16),

            // FAQ Expansion List
            const Text('Frequently Asked Questions', style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold)),
            const SizedBox(height: 10),

            ..._filteredFaqs.map((faq) {
              return Card(
                margin: const EdgeInsets.only(bottom: 10),
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
                child: ExpansionTile(
                  title: Text(
                    faq['question']!,
                    style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 13.5),
                  ),
                  childrenPadding: const EdgeInsets.fromLTRB(16, 0, 16, 14),
                  children: [
                    Text(
                      faq['answer']!,
                      style: TextStyle(
                        fontSize: 12.5,
                        height: 1.5,
                        color: isDark ? Colors.grey.shade300 : Colors.grey.shade700,
                      ),
                    ),
                  ],
                ),
              );
            }),

            const SizedBox(height: 24),

            // Contact Support Section
            Container(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: Theme.of(context).cardColor,
                borderRadius: BorderRadius.circular(16),
                border: Border.all(color: Colors.grey.shade300),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Text('Still need help?', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16)),
                  const SizedBox(height: 4),
                  const Text('Our support team is available to help you with any issue.', style: TextStyle(fontSize: 12, color: Colors.grey)),
                  const SizedBox(height: 14),
                  Row(
                    children: [
                      Expanded(
                        child: OutlinedButton.icon(
                          onPressed: () => _contactSupport('whatsapp'),
                          icon: const Icon(Icons.chat, color: Color(0xFF10B981), size: 16),
                          label: const Text('WhatsApp'),
                        ),
                      ),
                      const SizedBox(width: 10),
                      Expanded(
                        child: OutlinedButton.icon(
                          onPressed: () => _contactSupport('email'),
                          icon: const Icon(Icons.email_outlined, color: AppTheme.primaryColor, size: 16),
                          label: const Text('Email Us'),
                        ),
                      ),
                    ],
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}
