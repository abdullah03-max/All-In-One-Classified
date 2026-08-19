import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import '../../../core/theme/app_theme.dart';
import '../../listings/data/listing_model.dart';
import '../data/payment_repository.dart';
import 'safepay_checkout_screen.dart';

class PromoteListingScreen extends StatefulWidget {
  final ListingModel listing;

  const PromoteListingScreen({super.key, required this.listing});

  @override
  State<PromoteListingScreen> createState() => _PromoteListingScreenState();
}

class _PromoteListingScreenState extends State<PromoteListingScreen> {
  final PaymentRepository _repository = PaymentRepository();
  late PaymentPackageModel _selectedPackage;
  bool _isProcessing = false;

  @override
  void initState() {
    super.initState();
    _selectedPackage = _repository.packages[1]; // Default to 'Featured Ad'
  }

  Future<void> _startSafepayPayment() async {
    setState(() => _isProcessing = true);

    try {
      final res = await _repository.createSafepayCheckoutTracker(
        listingId: widget.listing.id,
        packageId: _selectedPackage.id,
      );

      if (res != null && res['checkout_url'] != null && res['tracker_token'] != null) {
        final checkoutUrl = res['checkout_url'];
        final trackerToken = res['tracker_token'];

        if (mounted) {
          setState(() => _isProcessing = false);

          final bool? success = await Navigator.push<bool>(
            context,
            MaterialPageRoute(
              builder: (_) => SafepayCheckoutScreen(
                checkoutUrl: checkoutUrl,
                trackerToken: trackerToken,
              ),
            ),
          );

          if (success == true) {
            ScaffoldMessenger.of(context).showSnackBar(
              const SnackBar(
                content: Text('🎉 Payment Successful! Your ad is now FEATURED & PROMOTED!'),
                backgroundColor: const Color(0xFF10B981),
              ),
            );
            Navigator.pop(context, true);
          } else {
            ScaffoldMessenger.of(context).showSnackBar(
              const SnackBar(content: Text('Payment was cancelled or failed.')),
            );
          }
        }
      } else {
        if (mounted) {
          setState(() => _isProcessing = false);
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(content: Text('Failed to initiate Safepay session. Please try again.')),
          );
        }
      }
    } catch (e) {
      if (mounted) {
        setState(() => _isProcessing = false);
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Payment error: $e')),
        );
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final currencyFormatter = NumberFormat.currency(symbol: 'PKR ', decimalDigits: 0);

    return Scaffold(
      appBar: AppBar(title: const Text('Promote Listing')),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(20.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Listing Preview Mini Card
            Card(
              child: Padding(
                padding: const EdgeInsets.all(12.0),
                child: Row(
                  children: [
                    if (widget.listing.images.isNotEmpty)
                      ClipRRect(
                        borderRadius: BorderRadius.circular(8),
                        child: Image.network(widget.listing.images.first, width: 60, height: 60, fit: BoxFit.cover),
                      ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(widget.listing.title, maxLines: 1, overflow: TextOverflow.ellipsis, style: const TextStyle(fontWeight: FontWeight.bold)),
                          const SizedBox(height: 4),
                          Text(currencyFormatter.format(widget.listing.price), style: const TextStyle(color: AppTheme.primaryColor, fontWeight: FontWeight.bold)),
                        ],
                      ),
                    ),
                  ],
                ),
              ),
            ),
            const SizedBox(height: 24),

            const Text('Select Promotion Package', style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
            const SizedBox(height: 6),
            const Text('Boost your ad views up to 10x faster with paid promotions.', style: TextStyle(color: Colors.grey, fontSize: 13)),
            const SizedBox(height: 16),

            // Packages Cards
            ..._repository.packages.map((pkg) {
              final isSelected = _selectedPackage.id == pkg.id;
              return GestureDetector(
                onTap: () => setState(() => _selectedPackage = pkg),
                child: Container(
                  margin: const EdgeInsets.only(bottom: 12),
                  padding: const EdgeInsets.all(16),
                  decoration: BoxDecoration(
                    color: isSelected ? AppTheme.primaryLight.withOpacity(0.4) : Theme.of(context).cardColor,
                    borderRadius: BorderRadius.circular(12),
                    border: Border.all(
                      color: isSelected ? AppTheme.primaryColor : Colors.grey.shade300,
                      width: isSelected ? 2 : 1,
                    ),
                  ),
                  child: Row(
                    children: [
                      Radio<String>(
                        value: pkg.id,
                        groupValue: _selectedPackage.id,
                        onChanged: (_) => setState(() => _selectedPackage = pkg),
                      ),
                      const SizedBox(width: 8),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Row(
                              mainAxisAlignment: MainAxisAlignment.spaceBetween,
                              children: [
                                Text(pkg.name, style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 16)),
                                Text(currencyFormatter.format(pkg.price), style: const TextStyle(color: AppTheme.primaryColor, fontWeight: FontWeight.bold, fontSize: 16)),
                              ],
                            ),
                            const SizedBox(height: 4),
                            Text('${pkg.durationDays} Days Duration', style: const TextStyle(color: Colors.amber, fontWeight: FontWeight.bold, fontSize: 12)),
                            const SizedBox(height: 4),
                            Text(pkg.description, style: const TextStyle(color: Colors.grey, fontSize: 12)),
                          ],
                        ),
                      ),
                    ],
                  ),
                ),
              );
            }).toList(),

            const SizedBox(height: 24),

            // Start Payment Button
            SizedBox(
              width: double.infinity,
              height: 52,
              child: ElevatedButton.icon(
                onPressed: _isProcessing ? null : _startSafepayPayment,
                icon: const Icon(Icons.lock_outline),
                label: _isProcessing
                    ? const SizedBox(width: 22, height: 22, child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white))
                    : Text('Pay ${currencyFormatter.format(_selectedPackage.price)} with Safepay'),
                style: ElevatedButton.styleFrom(
                  backgroundColor: const Color(0xFF10B981),
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
