import 'dart:io';
import 'package:flutter/material.dart';
import 'package:image_picker/image_picker.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import 'package:cached_network_image/cached_network_image.dart';
import '../../../core/theme/app_theme.dart';
import '../data/listing_model.dart';
import '../data/listing_repository.dart';

class EditListingScreen extends StatefulWidget {
  final ListingModel listing;

  const EditListingScreen({super.key, required this.listing});

  @override
  State<EditListingScreen> createState() => _EditListingScreenState();
}

class _EditListingScreenState extends State<EditListingScreen> {
  final _formKey = GlobalKey<FormState>();
  late TextEditingController _titleController;
  late TextEditingController _descController;
  late TextEditingController _priceController;

  late String _selectedCondition;
  late String _selectedCity;
  late bool _isNegotiable;
  bool _isSaving = false;
  String _uploadStatus = '';

  // Images & Video
  final ImagePicker _picker = ImagePicker();
  final List<String> _existingImageUrls = [];
  final List<XFile> _newImageFiles = [];
  XFile? _newVideoFile;
  String? _currentVideoUrl;

  final List<String> _cities = [
    'Lahore', 'Karachi', 'Islamabad', 'Rawalpindi', 'Faisalabad',
    'Multan', 'Peshawar', 'Quetta', 'Sialkot', 'Gujranwala', 'Hyderabad',
    'Abbottabad', 'Bahawalpur', 'Sargodha', 'Sukkur', 'Larkana', 'Sheikhupura',
    'Jhang', 'Rahim Yar Khan', 'Gujrat'
  ];

  final List<String> _conditions = ['new', 'used', 'refurbished', 'open_box'];

  @override
  void initState() {
    super.initState();
    _titleController = TextEditingController(text: widget.listing.title);
    _descController = TextEditingController(text: widget.listing.description);
    _priceController = TextEditingController(text: widget.listing.price > 0 ? widget.listing.price.toInt().toString() : '0');
    _selectedCondition = widget.listing.condition.toLowerCase();
    if (!_conditions.contains(_selectedCondition)) {
      _selectedCondition = 'used';
    }
    _selectedCity = _cities.contains(widget.listing.city) ? widget.listing.city : 'Lahore';
    _isNegotiable = widget.listing.isNegotiable;
    _existingImageUrls.addAll(widget.listing.images);
    _currentVideoUrl = widget.listing.videoUrl;
  }

  @override
  void dispose() {
    _titleController.dispose();
    _descController.dispose();
    _priceController.dispose();
    super.dispose();
  }

  Future<void> _pickMoreImages() async {
    try {
      final picked = await _picker.pickMultiImage();
      if (picked.isNotEmpty) {
        setState(() => _newImageFiles.addAll(picked));
      }
    } catch (e) {
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Error picking images: $e')));
    }
  }

  Future<void> _pickVideo() async {
    try {
      final video = await _picker.pickVideo(source: ImageSource.gallery, maxDuration: const Duration(minutes: 3));
      if (video != null) {
        setState(() => _newVideoFile = video);
      }
    } catch (e) {
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Error picking video: $e')));
    }
  }

  Future<void> _saveChanges() async {
    final user = Supabase.instance.client.auth.currentUser;
    if (user == null || user.id != widget.listing.sellerId) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Unauthorized action.')),
      );
      return;
    }

    if (!_formKey.currentState!.validate()) return;

    setState(() {
      _isSaving = true;
      _uploadStatus = 'Saving changes...';
    });

    try {
      final List<String> finalImages = List<String>.from(_existingImageUrls);

      // Upload newly added images to 'listing-images'
      for (int i = 0; i < _newImageFiles.length; i++) {
        final xfile = _newImageFiles[i];
        if (mounted) setState(() => _uploadStatus = 'Uploading photo ${i + 1}/${_newImageFiles.length}...');
        final bytes = await xfile.readAsBytes();
        final ext = xfile.name.split('.').last.toLowerCase();
        final fileName = '${user.id}/${DateTime.now().millisecondsSinceEpoch}_edit_$i.$ext';

        await Supabase.instance.client.storage
            .from('listing-images')
            .uploadBinary(fileName, bytes, fileOptions: FileOptions(contentType: 'image/$ext', upsert: true));

        final publicUrl = Supabase.instance.client.storage.from('listing-images').getPublicUrl(fileName);
        finalImages.add(publicUrl);
      }

      // Upload new video if selected
      String? finalVideoUrl = _currentVideoUrl;
      if (_newVideoFile != null) {
        if (mounted) setState(() => _uploadStatus = 'Uploading video...');
        final bytes = await _newVideoFile!.readAsBytes();
        final ext = _newVideoFile!.name.split('.').last.toLowerCase();
        final fileName = 'videos/${user.id}/${DateTime.now().millisecondsSinceEpoch}_edit_video.$ext';

        await Supabase.instance.client.storage
            .from('listing-images')
            .uploadBinary(fileName, bytes, fileOptions: FileOptions(contentType: 'video/$ext', upsert: true));

        finalVideoUrl = Supabase.instance.client.storage.from('listing-images').getPublicUrl(fileName);
      }

      if (mounted) setState(() => _uploadStatus = 'Updating database...');

      await Supabase.instance.client
          .from('listings')
          .update({
            'title': _titleController.text.trim(),
            'description': _descController.text.trim(),
            'price': double.tryParse(_priceController.text.trim()) ?? 0,
            'condition': ListingRepository.mapConditionToDb(_selectedCondition),
            'city': _selectedCity,
            'location': _selectedCity,
            'is_negotiable': _isNegotiable,
            'images': finalImages,
            'video_url': finalVideoUrl,
            'updated_at': DateTime.now().toIso8601String(),
          })
          .eq('id', widget.listing.id)
          .eq('seller_id', user.id);

      if (mounted) {
        setState(() {
          _isSaving = false;
          _uploadStatus = '';
        });
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Listing updated successfully!'),
            backgroundColor: Color(0xFF10B981),
          ),
        );
        Navigator.pop(context, true);
      }
    } catch (e) {
      if (mounted) {
        setState(() {
          _isSaving = false;
          _uploadStatus = '';
        });
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Error updating listing: ${e.toString()}')),
        );
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Edit Listing'),
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(20.0),
        child: Form(
          key: _formKey,
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const Text('Title *', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 13)),
              const SizedBox(height: 6),
              TextFormField(
                controller: _titleController,
                decoration: const InputDecoration(hintText: 'Ad Title'),
                validator: (v) => v == null || v.trim().isEmpty ? 'Title is required' : null,
              ),
              const SizedBox(height: 16),

              const Text('Price (PKR) *', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 13)),
              const SizedBox(height: 6),
              TextFormField(
                controller: _priceController,
                keyboardType: TextInputType.number,
                decoration: const InputDecoration(prefixText: 'PKR '),
                validator: (v) => v == null || v.trim().isEmpty ? 'Price is required' : null,
              ),
              const SizedBox(height: 16),

              const Text('Description *', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 13)),
              const SizedBox(height: 6),
              TextFormField(
                controller: _descController,
                maxLines: 4,
                decoration: const InputDecoration(hintText: 'Item description...'),
                validator: (v) => v == null || v.trim().isEmpty ? 'Description is required' : null,
              ),
              const SizedBox(height: 16),

              const Text('Condition', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 13)),
              const SizedBox(height: 6),
              DropdownButtonFormField<String>(
                value: _selectedCondition,
                decoration: const InputDecoration(contentPadding: EdgeInsets.symmetric(horizontal: 12, vertical: 10)),
                items: _conditions.map((c) => DropdownMenuItem(value: c, child: Text(c.replaceAll('_', ' ').toUpperCase()))).toList(),
                onChanged: (v) => setState(() => _selectedCondition = v!),
              ),
              const SizedBox(height: 16),

              const Text('City / Location', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 13)),
              const SizedBox(height: 6),
              DropdownButtonFormField<String>(
                value: _selectedCity,
                decoration: const InputDecoration(contentPadding: EdgeInsets.symmetric(horizontal: 12, vertical: 10)),
                items: _cities.map((city) => DropdownMenuItem(value: city, child: Text(city))).toList(),
                onChanged: (v) => setState(() => _selectedCity = v!),
              ),
              const SizedBox(height: 12),

              SwitchListTile(
                contentPadding: EdgeInsets.zero,
                title: const Text('Price Negotiable'),
                value: _isNegotiable,
                onChanged: (v) => setState(() => _isNegotiable = v),
              ),
              const SizedBox(height: 16),

              // ── Photos & Video Management ──
              const Divider(),
              const SizedBox(height: 8),
              const Text('Media (Photos & Video)', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 15)),
              const SizedBox(height: 10),

              Wrap(
                spacing: 10,
                runSpacing: 10,
                children: [
                  ElevatedButton.icon(
                    onPressed: _pickMoreImages,
                    icon: const Icon(Icons.add_photo_alternate, size: 16),
                    label: const Text('Add Photos'),
                    style: ElevatedButton.styleFrom(
                      backgroundColor: AppTheme.primaryColor,
                      foregroundColor: Colors.white,
                    ),
                  ),
                  OutlinedButton.icon(
                    onPressed: _pickVideo,
                    icon: const Icon(Icons.videocam, size: 16),
                    label: Text(_newVideoFile != null || _currentVideoUrl != null ? 'Video Attached' : 'Add Video'),
                    style: OutlinedButton.styleFrom(
                      foregroundColor: const Color(0xFF10B981),
                      side: const BorderSide(color: Color(0xFF10B981)),
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 12),

              // Existing & New Images Preview
              if (_existingImageUrls.isNotEmpty || _newImageFiles.isNotEmpty)
                GridView.builder(
                  shrinkWrap: true,
                  physics: const NeverScrollableScrollPhysics(),
                  gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                    crossAxisCount: 3,
                    crossAxisSpacing: 8,
                    mainAxisSpacing: 8,
                  ),
                  itemCount: _existingImageUrls.length + _newImageFiles.length,
                  itemBuilder: (context, index) {
                    final isExisting = index < _existingImageUrls.length;
                    return Stack(
                      children: [
                        Positioned.fill(
                          child: ClipRRect(
                            borderRadius: BorderRadius.circular(8),
                            child: isExisting
                                ? CachedNetworkImage(
                                    imageUrl: _existingImageUrls[index],
                                    fit: BoxFit.cover,
                                    errorWidget: (_, __, ___) => Container(color: Colors.grey.shade300, child: const Icon(Icons.broken_image)),
                                  )
                                : Image.file(
                                    File(_newImageFiles[index - _existingImageUrls.length].path),
                                    fit: BoxFit.cover,
                                  ),
                          ),
                        ),
                        Positioned(
                          top: 4,
                          right: 4,
                          child: GestureDetector(
                            onTap: () {
                              setState(() {
                                if (isExisting) {
                                  _existingImageUrls.removeAt(index);
                                } else {
                                  _newImageFiles.removeAt(index - _existingImageUrls.length);
                                }
                              });
                            },
                            child: Container(
                              padding: const EdgeInsets.all(3),
                              decoration: const BoxDecoration(
                                color: Colors.black54,
                                shape: BoxShape.circle,
                              ),
                              child: const Icon(Icons.close, size: 14, color: Colors.white),
                            ),
                          ),
                        ),
                      ],
                    );
                  },
                ),
              const SizedBox(height: 28),

              if (_isSaving)
                Column(
                  children: [
                    const Center(child: CircularProgressIndicator()),
                    const SizedBox(height: 8),
                    Text(_uploadStatus, style: const TextStyle(color: Colors.grey, fontSize: 13)),
                  ],
                )
              else
                SizedBox(
                  width: double.infinity,
                  height: 50,
                  child: ElevatedButton(
                    onPressed: _saveChanges,
                    style: ElevatedButton.styleFrom(
                      backgroundColor: const Color(0xFF10B981),
                      foregroundColor: Colors.white,
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                    ),
                    child: const Text('Save Changes', style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold)),
                  ),
                ),
            ],
          ),
        ),
      ),
    );
  }
}
