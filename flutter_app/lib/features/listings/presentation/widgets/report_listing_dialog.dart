import 'package:flutter/material.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import '../../../auth/presentation/login_screen.dart';

class ReportListingDialog extends StatefulWidget {
  final String listingId;

  const ReportListingDialog({super.key, required this.listingId});

  @override
  State<ReportListingDialog> createState() => _ReportListingDialogState();
}

class _ReportListingDialogState extends State<ReportListingDialog> {
  final _formKey = GlobalKey<FormState>();
  final _descController = TextEditingController();

  String _selectedReason = 'Spam or misleading';
  bool _isSubmitting = false;

  final List<String> _reasons = [
    'Spam or misleading',
    'Wrong category',
    'Prohibited item',
    'Scam or fraud',
    'Duplicate listing',
    'Inappropriate content',
    'Other'
  ];

  @override
  void dispose() {
    _descController.dispose();
    super.dispose();
  }

  Future<void> _submitReport() async {
    final user = Supabase.instance.client.auth.currentUser;
    if (user == null) {
      Navigator.pop(context);
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Please log in to report a listing.')),
      );
      Navigator.push(
        context,
        MaterialPageRoute(builder: (_) => const LoginScreen()),
      );
      return;
    }

    if (_formKey.currentState!.validate()) {
      setState(() => _isSubmitting = true);

      try {
        await Supabase.instance.client.from('reports').insert({
          'reporter_id': user.id,
          'listing_id': widget.listingId,
          'reason': _selectedReason,
          'description': _descController.text.trim(),
          'status': 'pending',
        });

        if (mounted) {
          Navigator.pop(context);
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(
              content: Text('Report submitted successfully. Our moderation team will review it shortly.'),
              backgroundColor: Color(0xFF10B981),
              duration: Duration(seconds: 4),
            ),
          );
        }
      } catch (e) {
        if (mounted) {
          setState(() => _isSubmitting = false);
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(content: Text('Error submitting report: ${e.toString()}')),
          );
        }
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return AlertDialog(
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
      title: const Row(
        children: [
          Icon(Icons.flag_outlined, color: Colors.redAccent, size: 22),
          SizedBox(width: 8),
          Text('Report Listing', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 18)),
        ],
      ),
      content: SingleChildScrollView(
        child: Form(
          key: _formKey,
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const Text(
                'Why are you reporting this listing? Help us keep our marketplace safe and trusted.',
                style: TextStyle(fontSize: 12.5, color: Colors.grey, height: 1.4),
              ),
              const SizedBox(height: 16),

              // Reason Dropdown
              DropdownButtonFormField<String>(
                value: _selectedReason,
                decoration: const InputDecoration(
                  labelText: 'Reason *',
                  contentPadding: EdgeInsets.symmetric(horizontal: 12, vertical: 10),
                ),
                items: _reasons.map((r) => DropdownMenuItem(value: r, child: Text(r))).toList(),
                onChanged: (val) {
                  if (val != null) setState(() => _selectedReason = val);
                },
              ),
              const SizedBox(height: 14),

              // Description Box
              TextFormField(
                controller: _descController,
                maxLines: 3,
                decoration: const InputDecoration(
                  hintText: 'Provide additional details or proof...',
                  labelText: 'Additional details (Optional)',
                ),
              ),
            ],
          ),
        ),
      ),
      actionsPadding: const EdgeInsets.fromLTRB(16, 0, 16, 16),
      actions: [
        TextButton(
          onPressed: () => Navigator.pop(context),
          child: const Text('Cancel'),
        ),
        ElevatedButton(
          onPressed: _isSubmitting ? null : _submitReport,
          style: ElevatedButton.styleFrom(
            backgroundColor: Colors.redAccent,
            foregroundColor: Colors.white,
            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
          ),
          child: _isSubmitting
              ? const SizedBox(width: 18, height: 18, child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white))
              : const Text('Submit Report'),
        ),
      ],
    );
  }
}
