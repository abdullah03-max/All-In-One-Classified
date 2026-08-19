import 'dart:io';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:image_picker/image_picker.dart';
import 'package:intl/intl.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import '../../../core/theme/app_theme.dart';

class VerificationApplicationScreen extends StatefulWidget {
  const VerificationApplicationScreen({super.key});

  @override
  State<VerificationApplicationScreen> createState() => _VerificationApplicationScreenState();
}

class _VerificationApplicationScreenState extends State<VerificationApplicationScreen> {
  final _formKey = GlobalKey<FormState>();
  final SupabaseClient _client = Supabase.instance.client;

  final _fullNameController = TextEditingController();
  final _cnicController = TextEditingController();
  final _phoneController = TextEditingController();
  final _dobController = TextEditingController();

  DateTime? _selectedDob;
  final String _selectedCity = 'Lahore';
  File? _cnicFrontFile;
  File? _cnicBackFile;
  File? _selfieFile;

  bool _isSubmitting = false;
  Map<String, dynamic>? _existingApp;
  bool _isLoading = true;

  @override
  void initState() {
    super.initState();
    _checkExistingApplication();
  }

  @override
  void dispose() {
    _fullNameController.dispose();
    _cnicController.dispose();
    _phoneController.dispose();
    _dobController.dispose();
    super.dispose();
  }

  Future<void> _checkExistingApplication() async {
    final user = _client.auth.currentUser;
    if (user == null) return;

    try {
      final app = await _client
          .from('verification_applications')
          .select('*')
          .eq('user_id', user.id)
          .maybeSingle();

      setState(() {
        _existingApp = app;
        _isLoading = false;
      });
    } catch (e) {
      setState(() => _isLoading = false);
    }
  }

  Future<void> _selectDateOfBirth() async {
    final now = DateTime.now();
    final initial = _selectedDob ?? DateTime(2000, 1, 1);
    final picked = await showDatePicker(
      context: context,
      initialDate: initial,
      firstDate: DateTime(1940),
      lastDate: DateTime(now.year - 13, now.month, now.day),
      helpText: 'SELECT DATE OF BIRTH',
      builder: (context, child) {
        return Theme(
          data: Theme.of(context).copyWith(
            colorScheme: const ColorScheme.dark(
              primary: AppTheme.primaryColor,
              onPrimary: Colors.white,
              surface: Color(0xFF1E293B),
              onSurface: Colors.white,
            ),
          ),
          child: child!,
        );
      },
    );

    if (picked != null) {
      setState(() {
        _selectedDob = picked;
        _dobController.text = DateFormat('yyyy-MM-dd').format(picked);
      });
    }
  }

  Future<void> _pickImage(String type) async {
    final picker = ImagePicker();
    final picked = await picker.pickImage(source: ImageSource.gallery, imageQuality: 85);
    if (picked != null) {
      setState(() {
        if (type == 'front') _cnicFrontFile = File(picked.path);
        if (type == 'back') _cnicBackFile = File(picked.path);
        if (type == 'selfie') _selfieFile = File(picked.path);
      });
    }
  }

  Future<void> _submitVerification() async {
    final user = _client.auth.currentUser;
    if (user == null) return;

    if (_cnicFrontFile == null || _cnicBackFile == null || _selfieFile == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Please upload CNIC Front, CNIC Back, and Selfie photo.')),
      );
      return;
    }

    if (_formKey.currentState!.validate()) {
      setState(() => _isSubmitting = true);

      try {
        // Format & validate DOB (Ensure valid YYYY-MM-DD for PostgreSQL DATE type)
        String rawDob = _dobController.text.trim();
        String formattedDob = rawDob;
        try {
          DateTime? parsed;
          if (_selectedDob != null) {
            parsed = _selectedDob;
          } else {
            parsed = DateTime.tryParse(rawDob) ??
                DateFormat('dd-MM-yyyy').tryParse(rawDob) ??
                DateFormat('MM-dd-yyyy').tryParse(rawDob);
          }
          if (parsed != null) {
            formattedDob = DateFormat('yyyy-MM-dd').format(parsed);
          }
        } catch (_) {}

        // Upload images to Supabase Storage bucket 'listing-images'
        final ts = DateTime.now().millisecondsSinceEpoch;
        final frontPath = 'kyc/${user.id}/${ts}_front.jpg';
        final backPath = 'kyc/${user.id}/${ts}_back.jpg';
        final selfiePath = 'kyc/${user.id}/${ts}_selfie.jpg';

        await _client.storage.from('listing-images').upload(
          frontPath,
          _cnicFrontFile!,
          fileOptions: const FileOptions(upsert: true),
        );
        await _client.storage.from('listing-images').upload(
          backPath,
          _cnicBackFile!,
          fileOptions: const FileOptions(upsert: true),
        );
        await _client.storage.from('listing-images').upload(
          selfiePath,
          _selfieFile!,
          fileOptions: const FileOptions(upsert: true),
        );

        final frontUrl = _client.storage.from('listing-images').getPublicUrl(frontPath);
        final backUrl = _client.storage.from('listing-images').getPublicUrl(backPath);
        final selfieUrl = _client.storage.from('listing-images').getPublicUrl(selfiePath);

        // Insert Record into verification_applications
        await _client.from('verification_applications').insert({
          'user_id': user.id,
          'full_name': _fullNameController.text.trim(),
          'cnic_number': _cnicController.text.trim(),
          'dob': formattedDob,
          'phone': _phoneController.text.trim(),
          'city': _selectedCity,
          'cnic_front_url': frontUrl,
          'cnic_back_url': backUrl,
          'selfie_url': selfieUrl,
          'status': 'pending',
        });

        if (mounted) {
          setState(() => _isSubmitting = false);
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(
              content: Text('Verification application submitted! Admin will review your details.'),
              backgroundColor: Color(0xFF10B981),
            ),
          );
          _checkExistingApplication();
        }
      } catch (e) {
        if (mounted) {
          setState(() => _isSubmitting = false);
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(content: Text('Error submitting application: $e')),
          );
        }
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Account Verification')),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator())
          : _existingApp != null
              ? _buildExistingStatusCard()
              : SingleChildScrollView(
                  padding: const EdgeInsets.all(20.0),
                  child: Form(
                    key: _formKey,
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        const Text('Verified Seller Badge', style: TextStyle(fontSize: 20, fontWeight: FontWeight.bold)),
                        const SizedBox(height: 6),
                        const Text('Get a blue verification checkmark on your profile and listings to build trust with buyers.', style: TextStyle(color: Colors.grey, fontSize: 13)),
                        const SizedBox(height: 24),

                        TextFormField(
                          controller: _fullNameController,
                          decoration: const InputDecoration(
                            labelText: 'Full Name (as on CNIC) *',
                            prefixIcon: Icon(Icons.person_outline),
                          ),
                          validator: (v) => v == null || v.trim().isEmpty ? 'Full name is required' : null,
                        ),
                        const SizedBox(height: 16),

                        TextFormField(
                          controller: _cnicController,
                          keyboardType: TextInputType.number,
                          inputFormatters: [
                            FilteringTextInputFormatter.digitsOnly,
                            LengthLimitingTextInputFormatter(13),
                          ],
                          decoration: const InputDecoration(
                            labelText: 'CNIC Number (13 digits) *',
                            hintText: '3520212345671',
                            prefixIcon: Icon(Icons.badge_outlined),
                          ),
                          validator: (v) {
                            if (v == null || v.trim().isEmpty) return 'CNIC is required';
                            if (v.trim().length != 13) return 'CNIC must be exactly 13 digits';
                            return null;
                          },
                        ),
                        const SizedBox(height: 16),

                        TextFormField(
                          controller: _dobController,
                          readOnly: true,
                          onTap: _selectDateOfBirth,
                          decoration: InputDecoration(
                            labelText: 'Date of Birth *',
                            hintText: 'Tap to select date',
                            prefixIcon: const Icon(Icons.cake_outlined),
                            suffixIcon: IconButton(
                              icon: const Icon(Icons.calendar_month, color: AppTheme.primaryColor),
                              onPressed: _selectDateOfBirth,
                            ),
                          ),
                          validator: (v) => v == null || v.trim().isEmpty ? 'Date of birth is required' : null,
                        ),
                        const SizedBox(height: 16),

                        TextFormField(
                          controller: _phoneController,
                          keyboardType: TextInputType.phone,
                          inputFormatters: [
                            FilteringTextInputFormatter.digitsOnly,
                            LengthLimitingTextInputFormatter(11),
                          ],
                          decoration: const InputDecoration(
                            labelText: 'Mobile Phone *',
                            hintText: '03001234567',
                            prefixIcon: Icon(Icons.phone_outlined),
                          ),
                          validator: (v) => v == null || v.trim().isEmpty ? 'Phone is required' : null,
                        ),
                        const SizedBox(height: 24),

                        // Document Upload Section
                        const Text('Upload Verification Documents', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 15)),
                        const SizedBox(height: 12),

                        _buildUploadCard('CNIC Front Photo', _cnicFrontFile, () => _pickImage('front')),
                        const SizedBox(height: 12),
                        _buildUploadCard('CNIC Back Photo', _cnicBackFile, () => _pickImage('back')),
                        const SizedBox(height: 12),
                        _buildUploadCard('Selfie Photo holding CNIC', _selfieFile, () => _pickImage('selfie')),
                        const SizedBox(height: 32),

                        SizedBox(
                          width: double.infinity,
                          height: 52,
                          child: ElevatedButton(
                            onPressed: _isSubmitting ? null : _submitVerification,
                            child: _isSubmitting
                                ? const SizedBox(width: 22, height: 22, child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white))
                                : const Text('Submit for Verification'),
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
    );
  }

  Widget _buildUploadCard(String label, File? file, VoidCallback onTap) {
    return InkWell(
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.all(14),
        decoration: BoxDecoration(
          color: Theme.of(context).cardColor,
          borderRadius: BorderRadius.circular(12),
          border: Border.all(color: file != null ? const Color(0xFF10B981) : Colors.grey.shade300),
        ),
        child: Row(
          children: [
            Icon(file != null ? Icons.check_circle : Icons.upload_file, color: file != null ? const Color(0xFF10B981) : AppTheme.primaryColor),
            const SizedBox(width: 12),
            Expanded(
              child: Text(
                file != null ? '$label (Selected)' : 'Upload $label',
                style: TextStyle(fontWeight: file != null ? FontWeight.bold : FontWeight.normal, fontSize: 13),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildExistingStatusCard() {
    final status = _existingApp!['status'] ?? 'pending';
    Color color = Colors.amber;
    if (status == 'approved') color = const Color(0xFF10B981);
    if (status == 'rejected') color = Colors.redAccent;

    return Center(
      child: Padding(
        padding: const EdgeInsets.all(24.0),
        child: Card(
          child: Padding(
            padding: const EdgeInsets.all(24.0),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                Icon(status == 'approved' ? Icons.verified : Icons.hourglass_bottom, size: 60, color: color),
                const SizedBox(height: 16),
                Text('Verification Status: ${status.toUpperCase()}', style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold, color: color)),
                const SizedBox(height: 8),
                Text(
                  status == 'approved'
                      ? 'Congratulations! Your seller account is verified.'
                      : status == 'pending'
                          ? 'Your verification application is currently under admin review.'
                          : 'Your verification was rejected. Reason: ${_existingApp!['rejection_reason'] ?? 'Document issue'}',
                  textAlign: TextAlign.center,
                  style: const TextStyle(color: Colors.grey),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
