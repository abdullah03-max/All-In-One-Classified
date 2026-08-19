import 'dart:io';
import 'package:flutter/material.dart';
import 'package:image_picker/image_picker.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import '../../../core/theme/app_theme.dart';
import '../../auth/presentation/login_screen.dart';
import '../../categories/data/category_model.dart';
import '../../categories/data/category_repository.dart';
import '../../location/services/location_service.dart';

class PostAdScreen extends StatefulWidget {
  const PostAdScreen({super.key});

  @override
  State<PostAdScreen> createState() => _PostAdScreenState();
}

class _PostAdScreenState extends State<PostAdScreen> {
  int _currentStep = 0;
  final _formKey = GlobalKey<FormState>();

  // Category Selection
  final CategoryRepository _categoryRepository = CategoryRepository();
  List<CategoryModel> _categories = [];
  CategoryModel? _selectedCategory;
  CategoryModel? _selectedSubcategory;
  CategoryModel? _selectedSubSubcategory;

  // Dynamic category attributes state
  final Map<String, dynamic> _dynamicAttributes = {};

  // Listing Data Controllers
  final _titleController = TextEditingController();
  final _descController = TextEditingController();
  final _priceController = TextEditingController();

  String _selectedCondition = 'used';
  String _selectedCity = 'Lahore';
  bool _isNegotiable = true;
  bool _isSubmitting = false;
  bool _isLocating = false;

  // Images
  final ImagePicker _picker = ImagePicker();
  final List<XFile> _selectedImageFiles = [];
  final List<String> _uploadedImageUrls = [];

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
    _loadCategories();
  }

  @override
  void dispose() {
    _titleController.dispose();
    _descController.dispose();
    _priceController.dispose();
    super.dispose();
  }

  Future<void> _loadCategories() async {
    final cats = await _categoryRepository.getCategoriesHierarchy();
    if (mounted) {
      setState(() => _categories = cats);
    }
  }

  List<dynamic> get _activeAttributesSchema {
    final active = _selectedSubSubcategory ?? _selectedSubcategory ?? _selectedCategory;
    if (active != null && active.attributesSchema.isNotEmpty) {
      return active.attributesSchema;
    }
    return [];
  }

  Future<void> _detectCurrentLocation() async {
    setState(() => _isLocating = true);

    try {
      final pos = await LocationService.getCurrentPosition();
      if (pos != null) {
        final city = await LocationService.getCityFromCoordinates(pos.latitude, pos.longitude);
        if (mounted) {
          if (city != null && city.trim().isNotEmpty) {
            final matched = _cities.firstWhere(
              (c) => c.toLowerCase().contains(city.toLowerCase()) || city.toLowerCase().contains(c.toLowerCase()),
              orElse: () => city,
            );
            if (!_cities.contains(matched)) {
              _cities.insert(0, matched);
            }
            setState(() {
              _selectedCity = matched;
              _isLocating = false;
            });
            ScaffoldMessenger.of(context).showSnackBar(
              SnackBar(content: Text('📍 Location detected: $matched'), backgroundColor: const Color(0xFF10B981)),
            );
          } else {
            setState(() => _isLocating = false);
          }
        }
      } else {
        if (mounted) {
          setState(() => _isLocating = false);
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(content: Text('Could not access device GPS or permission was denied.')),
          );
        }
      }
    } catch (e) {
      if (mounted) {
        setState(() => _isLocating = false);
      }
    }
  }

  Future<void> _pickImages() async {
    try {
      final List<XFile> pickedFiles = await _picker.pickMultiImage();
      if (pickedFiles.isNotEmpty) {
        setState(() {
          _selectedImageFiles.addAll(pickedFiles);
        });
      }
    } catch (e) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Error picking images: $e')),
      );
    }
  }

  Future<void> _uploadImagesToSupabase() async {
    final user = Supabase.instance.client.auth.currentUser;
    if (user == null) return;

    _uploadedImageUrls.clear();

    for (final xfile in _selectedImageFiles) {
      final file = File(xfile.path);
      final fileExt = xfile.path.split('.').last;
      final fileName = '${user.id}/${DateTime.now().millisecondsSinceEpoch}_${_uploadedImageUrls.length}.$fileExt';

      try {
        await Supabase.instance.client.storage
            .from('listings')
            .upload(fileName, file);

        final publicUrl = Supabase.instance.client.storage
            .from('listings')
            .getPublicUrl(fileName);

        _uploadedImageUrls.add(publicUrl);
      } catch (e) {
        print('Storage upload warning: $e');
      }
    }
  }

  Future<void> _submitListing() async {
    final user = Supabase.instance.client.auth.currentUser;
    if (user == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Please log in to post an ad.')),
      );
      return;
    }

    if (_selectedCategory == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Please select a category.')),
      );
      return;
    }

    setState(() => _isSubmitting = true);

    try {
      // 1. Upload Images to Supabase Storage
      await _uploadImagesToSupabase();

      // 2. Insert Listing Record into 'listings' table
      final assignedCategoryId = _selectedSubSubcategory?.id ?? _selectedSubcategory?.id ?? _selectedCategory!.id;

      final payload = {
        'seller_id': user.id,
        'title': _titleController.text.trim(),
        'description': _descController.text.trim(),
        'price': double.tryParse(_priceController.text.trim()) ?? 0,
        'currency': 'PKR',
        'category_id': assignedCategoryId,
        'subcategory_id': _selectedSubcategory?.id,
        'sub_subcategory_id': _selectedSubSubcategory?.id,
        'condition': _selectedCondition,
        'city': _selectedCity,
        'location': _selectedCity,
        'country': 'Pakistan',
        'is_negotiable': _isNegotiable,
        'is_featured': false,
        'status': 'active',
        'images': _uploadedImageUrls,
        'attributes': _dynamicAttributes,
        'views_count': 0,
      };

      await Supabase.instance.client.from('listings').insert(payload);

      if (mounted) {
        setState(() => _isSubmitting = false);
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('🎉 Your ad has been posted successfully and is now LIVE!'),
            backgroundColor: Color(0xFF10B981),
          ),
        );
        _resetForm();
      }
    } catch (e) {
      if (mounted) {
        setState(() => _isSubmitting = false);
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Error posting ad: ${e.toString()}')),
        );
      }
    }
  }

  void _resetForm() {
    setState(() {
      _currentStep = 0;
      _titleController.clear();
      _descController.clear();
      _priceController.clear();
      _selectedImageFiles.clear();
      _uploadedImageUrls.clear();
      _selectedCategory = null;
      _selectedSubcategory = null;
      _selectedSubSubcategory = null;
      _dynamicAttributes.clear();
    });
  }

  @override
  Widget build(BuildContext context) {
    final user = Supabase.instance.client.auth.currentUser;

    if (user == null) {
      return Scaffold(
        appBar: AppBar(title: const Text('Post an Ad')),
        body: Center(
          child: Padding(
            padding: const EdgeInsets.all(24.0),
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                const Icon(Icons.lock_outline, size: 60, color: Colors.grey),
                const SizedBox(height: 16),
                const Text('Login Required', style: TextStyle(fontSize: 20, fontWeight: FontWeight.bold)),
                const SizedBox(height: 8),
                const Text('Please log into your account to post classified ads.', textAlign: TextAlign.center, style: TextStyle(color: Colors.grey)),
                const SizedBox(height: 24),
                ElevatedButton.icon(
                  onPressed: () async {
                    await Navigator.push(
                      context,
                      MaterialPageRoute(builder: (_) => const LoginScreen()),
                    );
                    setState(() {});
                  },
                  icon: const Icon(Icons.login),
                  label: const Text('Log In / Register'),
                ),
              ],
            ),
          ),
        ),
      );
    }

    return Scaffold(
      appBar: AppBar(
        title: const Text('Post an Ad'),
      ),
      body: Stepper(
        type: StepperType.vertical,
        currentStep: _currentStep,
        onStepContinue: () {
          if (_currentStep == 0 && _selectedCategory == null) {
            ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Please select a category')));
            return;
          }
          if (_currentStep < 4) {
            setState(() => _currentStep += 1);
          } else {
            _submitListing();
          }
        },
        onStepCancel: () {
          if (_currentStep > 0) {
            setState(() => _currentStep -= 1);
          }
        },
        steps: [
          // Step 1: Category Hierarchy Selection
          Step(
            title: const Text('Category'),
            isActive: _currentStep >= 0,
            content: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Text('Select Category Hierarchy', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16)),
                const SizedBox(height: 12),
                DropdownButtonFormField<CategoryModel>(
                  value: _selectedCategory,
                  decoration: const InputDecoration(labelText: 'Main Category *'),
                  items: _categories.map((cat) => DropdownMenuItem(value: cat, child: Text(cat.name))).toList(),
                  onChanged: (cat) {
                    setState(() {
                      _selectedCategory = cat;
                      _selectedSubcategory = null;
                      _selectedSubSubcategory = null;
                      _dynamicAttributes.clear();
                    });
                  },
                ),
                if (_selectedCategory != null && _selectedCategory!.subcategories.isNotEmpty) ...[
                  const SizedBox(height: 16),
                  DropdownButtonFormField<CategoryModel>(
                    value: _selectedSubcategory,
                    decoration: const InputDecoration(labelText: 'Subcategory (Optional)'),
                    items: _selectedCategory!.subcategories.map((sub) => DropdownMenuItem(value: sub, child: Text(sub.name))).toList(),
                    onChanged: (sub) {
                      setState(() {
                        _selectedSubcategory = sub;
                        _selectedSubSubcategory = null;
                        _dynamicAttributes.clear();
                      });
                    },
                  ),
                ],
                if (_selectedSubcategory != null && _selectedSubcategory!.subcategories.isNotEmpty) ...[
                  const SizedBox(height: 16),
                  DropdownButtonFormField<CategoryModel>(
                    value: _selectedSubSubcategory,
                    decoration: const InputDecoration(labelText: 'Sub-Subcategory (Optional)'),
                    items: _selectedSubcategory!.subcategories.map((subsub) => DropdownMenuItem(value: subsub, child: Text(subsub.name))).toList(),
                    onChanged: (subsub) {
                      setState(() {
                        _selectedSubSubcategory = subsub;
                        _dynamicAttributes.clear();
                      });
                    },
                  ),
                ],
              ],
            ),
          ),

          // Step 2: Basic Ad Info & Dynamic Category Attributes
          Step(
            title: const Text('Details & Attributes'),
            isActive: _currentStep >= 1,
            content: Form(
              key: _formKey,
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  TextFormField(
                    controller: _titleController,
                    decoration: const InputDecoration(labelText: 'Ad Title *', hintText: 'e.g. iPhone 14 Pro Max 256GB'),
                    validator: (v) => v == null || v.trim().isEmpty ? 'Title is required' : null,
                  ),
                  const SizedBox(height: 16),
                  TextFormField(
                    controller: _descController,
                    maxLines: 4,
                    decoration: const InputDecoration(labelText: 'Description *', hintText: 'Describe your item features, condition...'),
                    validator: (v) => v == null || v.trim().isEmpty ? 'Description is required' : null,
                  ),
                  const SizedBox(height: 16),
                  DropdownButtonFormField<String>(
                    value: _selectedCondition,
                    decoration: const InputDecoration(labelText: 'Condition'),
                    items: _conditions.map((c) => DropdownMenuItem(value: c, child: Text(c.replaceAll('_', ' ').toUpperCase()))).toList(),
                    onChanged: (v) => setState(() => _selectedCondition = v!),
                  ),

                  // ── DYNAMIC CATEGORY ATTRIBUTES (From Admin attributes_schema) ──
                  if (_activeAttributesSchema.isNotEmpty) ...[
                    const SizedBox(height: 24),
                    const Text('Category Specifications', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16)),
                    const SizedBox(height: 12),
                    ..._activeAttributesSchema.map((field) {
                      if (field is! Map) return const SizedBox.shrink();
                      final fieldName = field['name']?.toString() ?? '';
                      final fieldLabel = field['label']?.toString() ?? fieldName;
                      final fieldType = field['type']?.toString() ?? 'text';
                      final options = field['options'] is List ? (field['options'] as List).map((o) => o.toString()).toList() : <String>[];

                      if (options.isNotEmpty || fieldType == 'select') {
                        return Padding(
                          padding: const EdgeInsets.only(bottom: 14.0),
                          child: DropdownButtonFormField<String>(
                            value: _dynamicAttributes[fieldName]?.toString(),
                            decoration: InputDecoration(labelText: fieldLabel),
                            items: options.map((opt) => DropdownMenuItem(value: opt, child: Text(opt))).toList(),
                            onChanged: (val) {
                              setState(() {
                                if (val != null) _dynamicAttributes[fieldName] = val;
                              });
                            },
                          ),
                        );
                      }

                      if (fieldType == 'boolean') {
                        return Padding(
                          padding: const EdgeInsets.only(bottom: 8.0),
                          child: SwitchListTile(
                            contentPadding: EdgeInsets.zero,
                            title: Text(fieldLabel),
                            value: _dynamicAttributes[fieldName] == true,
                            onChanged: (val) => setState(() => _dynamicAttributes[fieldName] = val),
                          ),
                        );
                      }

                      return Padding(
                        padding: const EdgeInsets.only(bottom: 14.0),
                        child: TextFormField(
                          initialValue: _dynamicAttributes[fieldName]?.toString(),
                          keyboardType: fieldType == 'number' ? TextInputType.number : TextInputType.text,
                          decoration: InputDecoration(labelText: fieldLabel),
                          onChanged: (val) => _dynamicAttributes[fieldName] = val.trim(),
                        ),
                      );
                    }),
                  ],
                ],
              ),
            ),
          ),

          // Step 3: Price & Location (with GPS Location Button)
          Step(
            title: const Text('Pricing & Location'),
            isActive: _currentStep >= 2,
            content: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                TextFormField(
                  controller: _priceController,
                  keyboardType: TextInputType.number,
                  decoration: const InputDecoration(labelText: 'Price (PKR) *', prefixText: 'PKR '),
                  validator: (v) => v == null || v.trim().isEmpty ? 'Price is required' : null,
                ),
                const SizedBox(height: 16),

                // GPS Location Detection Button
                SizedBox(
                  width: double.infinity,
                  height: 48,
                  child: OutlinedButton.icon(
                    onPressed: _isLocating ? null : _detectCurrentLocation,
                    icon: _isLocating
                        ? const SizedBox(width: 18, height: 18, child: CircularProgressIndicator(strokeWidth: 2))
                        : const Icon(Icons.my_location, color: AppTheme.primaryColor),
                    label: Text(_isLocating ? 'Detecting Location...' : 'Use Current GPS Location'),
                    style: OutlinedButton.styleFrom(
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                    ),
                  ),
                ),
                const SizedBox(height: 14),

                DropdownButtonFormField<String>(
                  value: _selectedCity,
                  decoration: const InputDecoration(labelText: 'City / Location *'),
                  items: _cities.map((city) => DropdownMenuItem(value: city, child: Text(city))).toList(),
                  onChanged: (city) => setState(() => _selectedCity = city!),
                ),
                const SizedBox(height: 12),
                SwitchListTile(
                  title: const Text('Price Negotiable'),
                  value: _isNegotiable,
                  onChanged: (v) => setState(() => _isNegotiable = v),
                ),
              ],
            ),
          ),

          // Step 4: Image Uploads
          Step(
            title: const Text('Photos'),
            isActive: _currentStep >= 3,
            content: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Text('Upload Item Photos', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16)),
                const SizedBox(height: 8),
                ElevatedButton.icon(
                  onPressed: _pickImages,
                  icon: const Icon(Icons.add_a_photo),
                  label: const Text('Pick Photos from Gallery'),
                ),
                const SizedBox(height: 16),
                if (_selectedImageFiles.isNotEmpty)
                  GridView.builder(
                    shrinkWrap: true,
                    physics: const NeverScrollableScrollPhysics(),
                    gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                      crossAxisCount: 3,
                      crossAxisSpacing: 8,
                      mainAxisSpacing: 8,
                    ),
                    itemCount: _selectedImageFiles.length,
                    itemBuilder: (context, index) {
                      return Stack(
                        children: [
                          ClipRRect(
                            borderRadius: BorderRadius.circular(8),
                            child: Image.file(
                              File(_selectedImageFiles[index].path),
                              fit: BoxFit.cover,
                              width: double.infinity,
                              height: double.infinity,
                            ),
                          ),
                          Positioned(
                            top: 4,
                            right: 4,
                            child: GestureDetector(
                              onTap: () => setState(() => _selectedImageFiles.removeAt(index)),
                              child: const CircleAvatar(
                                radius: 12,
                                backgroundColor: Colors.red,
                                child: Icon(Icons.close, size: 14, color: Colors.white),
                              ),
                            ),
                          ),
                        ],
                      );
                    },
                  ),
              ],
            ),
          ),

          // Step 5: Preview & Final Submit
          Step(
            title: const Text('Preview & Publish'),
            isActive: _currentStep >= 4,
            content: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Text('Review Ad Details', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 18)),
                const SizedBox(height: 12),
                ListTile(
                  title: Text(_titleController.text.isEmpty ? 'Untitled Ad' : _titleController.text, style: const TextStyle(fontWeight: FontWeight.bold)),
                  subtitle: Text('${_selectedCategory?.name ?? ''} • ${_selectedCity}'),
                  trailing: Text('PKR ${_priceController.text}', style: const TextStyle(fontWeight: FontWeight.bold, color: AppTheme.primaryColor, fontSize: 16)),
                ),
                const Divider(),
                Text(_descController.text, style: const TextStyle(height: 1.4)),
                const SizedBox(height: 20),
                if (_isSubmitting)
                  const Center(
                    child: Column(
                      children: [
                        CircularProgressIndicator(),
                        SizedBox(height: 8),
                        Text('Uploading photos & publishing ad...'),
                      ],
                    ),
                  ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}
