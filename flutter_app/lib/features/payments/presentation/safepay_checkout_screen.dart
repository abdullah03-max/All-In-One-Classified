import 'package:flutter/material.dart';
import 'package:webview_flutter/webview_flutter.dart';
import '../data/payment_repository.dart';

class SafepayCheckoutScreen extends StatefulWidget {
  final String checkoutUrl;
  final String trackerToken;

  const SafepayCheckoutScreen({
    super.key,
    required this.checkoutUrl,
    required this.trackerToken,
  });

  @override
  State<SafepayCheckoutScreen> createState() => _SafepayCheckoutScreenState();
}

class _SafepayCheckoutScreenState extends State<SafepayCheckoutScreen> {
  late WebViewController _webViewController;
  final PaymentRepository _paymentRepository = PaymentRepository();
  bool _isLoading = true;

  @override
  void initState() {
    super.initState();
    _webViewController = WebViewController()
      ..setJavaScriptMode(JavaScriptMode.unrestricted)
      ..setNavigationDelegate(
        NavigationDelegate(
          onPageStarted: (url) => setState(() => _isLoading = true),
          onPageFinished: (url) => setState(() => _isLoading = false),
          onNavigationRequest: (request) {
            print('Navigating to: ${request.url}');

            // Intercept Safepay Completion or Redirect URL
            if (request.url.contains('payment/status') || request.url.contains('tracker=')) {
              _verifyAndFinishPayment();
              return NavigationDecision.prevent;
            }
            return NavigationDecision.navigate;
          },
        ),
      )
      ..loadRequest(Uri.parse(widget.checkoutUrl));
  }

  Future<void> _verifyAndFinishPayment() async {
    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(content: Text('Verifying payment server-side...')),
    );

    final success = await _paymentRepository.verifyPaymentServerSide(widget.trackerToken);

    if (mounted) {
      Navigator.pop(context, success);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Safepay Secure Checkout'),
        actions: [
          IconButton(
            icon: const Icon(Icons.close),
            onPressed: () => Navigator.pop(context, false),
          ),
        ],
      ),
      body: Stack(
        children: [
          WebViewWidget(controller: _webViewController),
          if (_isLoading)
            const Center(child: CircularProgressIndicator()),
        ],
      ),
    );
  }
}
