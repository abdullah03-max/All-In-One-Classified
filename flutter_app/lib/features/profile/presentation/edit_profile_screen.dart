import 'dart:io';
import 'package:flutter/material.dart';
import 'package:image_picker/image_picker.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import '../../../core/theme/app_theme.dart';

class EditProfileScreen extends StatefulWidget {
  const EditProfileScreen({super.key});

  @override
  State<EditProfileScreen> createState() => _EditProfileScreenState();
}

class _EditProfileScreenState extends State<EditProfileScreen> {
  final _formKey = GlobalKey<FormState>();
  final SupabaseClient _client = Supabase.instance.client;

  late TextEditingController _nameController;
  late TextEditingController _phoneController;
  late TextEditingController _bioController;

  String _selectedCity = 'Lahore';
  String? _avatarUrl;
  bool _isLoading = true;
  bool _isSaving = false;
  File? _newAvatarFile;

  final List<String> _cities = [
    'Lahore', 'Karachi', 'Islamabad', 'Rawalpindi', 'Faisalabad',
    'Multan', 'Peshawar', 'Quetta', 'Sialkot', 'Gujranwala', 'Hyderabad'
  ];

  @override
  void initState() {
    super.initState();
    _nameController = TextEditingController();
    _phoneController = TextEditingController();
    _bioController = TextEditingController();
    _loadProfileData();
  }

  @override
  void dispose() {
    _nameController.dispose();
    _phoneController.dispose();
    _bioController.dispose();
    super.dispose();
  }

  Future<void> _loadProfileData() async {
    final user = _client.auth.currentUser;
    if (user == null) return;

    try {
      final data = await _client.from('users').select('*').eq('id', user.id).maybeSingle();
      if (data != null) {
        setState(() {
          _nameController.text = data['full_name'] ?? '';
          _phoneController.text = data['phone'] ?? '';
          _bioController.text = data['bio'] ?? '';
          _avatarUrl = data['avatar_url'];
          final city = data['city'];
          if (city != null && _cities.contains(city)) {
            _selectedCity = city;
          }
          _isLoading = false;
        });
      } else {
        setState(() => _isLoading = false);
      }
    } catch (e) {
      setState(() => _isLoading = false);
    }
  }

  Future<void> _pickAvatar() async {
    final picker = ImagePicker();
    final picked = await picker.pickImage(source: ImageSource.gallery);
    if (picked != null) {
      setState(() => _newAvatarFile = File(picked.path));
    }
  }

  Future<void> _saveProfile() async {
    final user = _client.auth.currentUser;
    if (user == null) return;

    if (_formKey.currentState!.validate()) {
      setState(() => _isSaving = true);

      try {
        String? finalAvatarUrl = _avatarUrl;

        // Upload Avatar if new image selected
        if (_newAvatarFile != null) {
          final fileExt = _newAvatarFile!.path.split('.').last;
          final fileName = '${user.id}/avatar_${DateTime.now().millisecondsSinceEpoch}.$fileExt';
          await _client.storage.from('avatars').upload(fileName, _newAvatarFile!);
          finalAvatarUrl = _client.storage.from('avatars').getPublicUrl(fileName);
        }

        // Update 'users' table
        await _client.from('users').update({
          'full_name': _nameController.text.trim(),
          'phone': _phoneController.text.trim(),
          'city': _selectedCity,
          'bio': _bioController.text.trim(),
          'avatar_url': finalAvatarUrl,
          'updated_at': DateTime.now().toIso8601String(),
        }).eq('id', user.id);

        if (mounted) {
          setState(() => _isSaving = false);
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(content: Text('Profile updated successfully!'), backgroundColor: Color(0xFF10B981)),
          );
          Navigator.pop(context, true);
        }
      } catch (e) {
        if (mounted) {
          setState(() => _isSaving = false);
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(content: Text('Error updating profile: $e')),
          );
        }
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Edit Profile')),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator())
          : SingleChildScrollView(
              padding: const EdgeInsets.all(20.0),
              child: Form(
                key: _formKey,
                child: Column(
                  children: [
                    // Avatar Picker Button
                    Center(
                      child: Stack(
                        children: [
                          CircleAvatar(
                            radius: 48,
                            backgroundColor: AppTheme.primaryLight,
                            backgroundImage: _newAvatarFile != null
                                ? FileImage(_newAvatarFile!)
                                : (_avatarUrl != null ? NetworkImage(_avatarUrl!) as ImageProvider : null),
                            child: (_newAvatarFile == null && _avatarUrl == null)
                                ? const Icon(Icons.person, size: 48, color: AppTheme.primaryColor)
                                : null,
                          ),
                          Positioned(
                            bottom: 0,
                            right: 0,
                            child: GestureDetector(
                              onTap: _pickAvatar,
                              child: const CircleAvatar(
                                radius: 16,
                                backgroundColor: AppTheme.primaryColor,
                                child: Icon(Icons.camera_alt, size: 16, color: Colors.white),
                              ),
                            ),
                          ),
                        ],
                      ),
                    ),
                    const SizedBox(height: 24),

                    // Full Name Input
                    TextFormField(
                      controller: _nameController,
                      decoration: const InputDecoration(labelText: 'Full Name *', prefixIcon: Icon(Icons.person_outline)),
                      validator: (v) => v == null || v.trim().isEmpty ? 'Name is required' : null,
                    ),
                    const SizedBox(height: 16),

                    // Phone Input
                    TextFormField(
                      controller: _phoneController,
                      keyboardType: TextInputType.phone,
                      decoration: const InputDecoration(labelText: 'Mobile Phone', prefixIcon: Icon(Icons.phone_outlined)),
                    ),
                    const SizedBox(height: 16),

                    // City Dropdown
                    DropdownButtonFormField<String>(
                      value: _selectedCity,
                      decoration: const InputDecoration(labelText: 'City / Location', prefixIcon: Icon(Icons.location_city_outlined)),
                      items: _cities.map((c) => DropdownMenuItem(value: c, child: Text(c))).toList(),
                      onChanged: (v) => setState(() => _selectedCity = v!),
                    ),
                    const SizedBox(height: 16),

                    // Bio Input
                    TextFormField(
                      controller: _bioController,
                      maxLines: 3,
                      decoration: const InputDecoration(labelText: 'Short Bio', hintText: 'Tell buyers about yourself...'),
                    ),
                    const SizedBox(height: 28),

                    // Save Button
                    SizedBox(
                      width: double.infinity,
                      height: 50,
                      child: ElevatedButton(
                        onPressed: _isSaving ? null : _saveProfile,
                        child: _isSaving
                            ? const SizedBox(width: 22, height: 22, child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white))
                            : const Text('Save Profile'),
                      ),
                    ),
                  ],
                ),
              ),
            ),
    );
  }
}
