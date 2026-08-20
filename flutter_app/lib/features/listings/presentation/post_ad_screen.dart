import 'dart:io';
import 'package:flutter/material.dart';
import 'package:image_picker/image_picker.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import '../../../core/theme/app_theme.dart';
import '../../auth/presentation/login_screen.dart';
import '../../categories/data/category_model.dart';
import '../../categories/data/category_repository.dart';
import '../../location/services/location_service.dart';
import '../data/listing_repository.dart';

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
  String? _selectedAnimalSex;
  String? _selectedHumanGender;
  String _selectedCity = 'Lahore';
  bool _isNegotiable = true;
  bool _isSubmitting = false;
  bool _isLocating = false;

  // Images & Video
  final ImagePicker _picker = ImagePicker();
  final List<XFile> _selectedImageFiles = [];
  final List<String> _uploadedImageUrls = [];
  XFile? _selectedVideoFile;
  String? _uploadedVideoUrl;

  final List<String> _cities = [
    'Lahore', 'Karachi', 'Islamabad', 'Rawalpindi', 'Faisalabad',
    'Multan', 'Peshawar', 'Quetta', 'Sialkot', 'Gujranwala', 'Hyderabad',
    'Abbottabad', 'Bahawalpur', 'Sargodha', 'Sukkur', 'Larkana', 'Sheikhupura',
    'Jhang', 'Rahim Yar Khan', 'Gujrat'
  ];

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

  CategoryModel? get _activeCategory {
    return _selectedSubSubcategory ?? _selectedSubcategory ?? _selectedCategory;
  }

  bool get _isPriceEnabled {
    final active = _activeCategory;
    if (active == null) return true;
    return active.isPriceEnabled;
  }

  List<String> get _conditionOptions {
    final active = _activeCategory;
    if (active == null) return ['new', 'used', 'refurbished', 'open_box'];
    final type = active.conditionType;
    if (type == 'simple') {
      return ['new', 'used'];
    }
    return ['new', 'used', 'refurbished', 'open_box'];
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

  Future<void> _pickVideo() async {
    try {
      final XFile? pickedVideo = await _picker.pickVideo(
        source: ImageSource.gallery,
        maxDuration: const Duration(minutes: 3),
      );
      if (pickedVideo != null) {
        setState(() {
          _selectedVideoFile = pickedVideo;
        });
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('🎥 Video attached successfully!'), backgroundColor: Color(0xFF10B981)),
        );
      }
    } catch (e) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Error picking video: $e')),
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

  Future<void> _uploadVideoToSupabase() async {
    final user = Supabase.instance.client.auth.currentUser;
    if (user == null || _selectedVideoFile == null) return;

    try {
      final file = File(_selectedVideoFile!.path);
      final fileExt = _selectedVideoFile!.path.split('.').last;
      final fileName = 'videos/${user.id}/${DateTime.now().millisecondsSinceEpoch}_video.$fileExt';

      await Supabase.instance.client.storage
          .from('listings')
          .upload(fileName, file);

      final publicUrl = Supabase.instance.client.storage
          .from('listings')
          .getPublicUrl(fileName);

      _uploadedVideoUrl = publicUrl;
    } catch (e) {
      print('Video storage upload warning: $e');
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
      // 1. Upload Images & Video to Supabase Storage
      await _uploadImagesToSupabase();
      await _uploadVideoToSupabase();

      // 2. Insert Listing Record into 'listings' table
      final assignedCategoryId = _selectedSubSubcategory?.id ?? _selectedSubcategory?.id ?? _selectedCategory!.id;

      final combinedAttributes = Map<String, dynamic>.from(_dynamicAttributes);
      if (_selectedAnimalSex != null) combinedAttributes['sex'] = _selectedAnimalSex;
      if (_selectedHumanGender != null) combinedAttributes['gender'] = _selectedHumanGender;

      final priceValue = _isPriceEnabled ? (double.tryParse(_priceController.text.trim()) ?? 0.0) : 0.0;

      final payload = {
        'seller_id': user.id,
        'title': _titleController.text.trim(),
        'description': _descController.text.trim(),
        'price': priceValue,
        'currency': 'PKR',
        'category_id': assignedCategoryId,
        'subcategory_id': _selectedSubcategory?.id,
        'sub_subcategory_id': _selectedSubSubcategory?.id,
        'condition': ListingRepository.mapConditionToDb(_selectedCondition),
        'city': _selectedCity,
        'location': _selectedCity,
        'country': 'Pakistan',
        'is_negotiable': _isPriceEnabled ? _isNegotiable : false,
        'is_featured': false,
        'status': 'active',
        'images': _uploadedImageUrls,
        'video_url': _uploadedVideoUrl,
        'attributes': combinedAttributes,
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
      _selectedVideoFile = null;
      _uploadedVideoUrl = null;
      _selectedCategory = null;
      _selectedSubcategory = null;
      _selectedSubSubcategory = null;
      _dynamicAttributes.clear();
      _selectedAnimalSex = null;
      _selectedHumanGender = null;
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
          if (_currentStep == 1) {
            if (!_formKey.currentState!.validate()) return;
          }
          if (_currentStep == 2 && _isPriceEnabled) {
            if (_priceController.text.trim().isEmpty) {
              ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Please enter a valid price')));
              return;
            }
          }
          if (_currentStep < 3) {
            setState(() => _currentStep += 1);
          }
        },
        onStepCancel: () {
          if (_currentStep > 0) {
            setState(() => _currentStep -= 1);
          }
        },
        steps: [
          // Step 1: Category, Subcategory, Sub-Subcategory Selector
          Step(
            title: const Text('Category'),
            isActive: _currentStep >= 0,
            content: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                // 1. Main Category
                DropdownButtonFormField<CategoryModel>(
                  value: _selectedCategory,
                  decoration: const InputDecoration(labelText: 'Main Category *'),
                  hint: const Text('Select Main Category'),
                  items: _categories.map((c) {
                    return DropdownMenuItem(
                      value: c,
                      child: Text(c.name),
                    );
                  }).toList(),
                  onChanged: (cat) {
                    setState(() {
                      _selectedCategory = cat;
                      _selectedSubcategory = null;
                      _selectedSubSubcategory = null;
                      _dynamicAttributes.clear();
                    });
                  },
                ),

                // 2. Subcategory (if available)
                if (_selectedCategory != null && _selectedCategory!.subcategories.isNotEmpty) ...[
                  const SizedBox(height: 16),
                  DropdownButtonFormField<CategoryModel>(
                    value: _selectedSubcategory,
                    decoration: const InputDecoration(labelText: 'Subcategory *'),
                    hint: const Text('Select Subcategory'),
                    items: _selectedCategory!.subcategories.map((sub) {
                      return DropdownMenuItem(
                        value: sub,
                        child: Text(sub.name),
                      );
                    }).toList(),
                    onChanged: (sub) {
                      setState(() {
                        _selectedSubcategory = sub;
                        _selectedSubSubcategory = null;
                        _dynamicAttributes.clear();
                      });
                    },
                  ),
                ],

                // 3. Sub-Subcategory (if available)
                if (_selectedSubcategory != null && _selectedSubcategory!.subcategories.isNotEmpty) ...[
                  const SizedBox(height: 16),
                  DropdownButtonFormField<CategoryModel>(
                    value: _selectedSubSubcategory,
                    decoration: const InputDecoration(labelText: 'Sub-Subcategory (Optional)'),
                    hint: const Text('Select Sub-Subcategory'),
                    items: _selectedSubcategory!.subcategories.map((subsub) {
                      return DropdownMenuItem(
                        value: subsub,
                        child: Text(subsub.name),
                      );
                    }).toList(),
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

                  // Condition Dropdown
                  DropdownButtonFormField<String>(
                    value: _conditionOptions.contains(_selectedCondition) ? _selectedCondition : _conditionOptions.first,
                    decoration: const InputDecoration(labelText: 'Condition'),
                    items: _conditionOptions.map((c) => DropdownMenuItem(value: c, child: Text(c.replaceAll('_', ' ').toUpperCase()))).toList(),
                    onChanged: (v) => setState(() => _selectedCondition = v!),
                  ),

                  // Animal Sex (if enabled for category)
                  if (_activeCategory?.hasAnimalSex == true) ...[
                    const SizedBox(height: 16),
                    DropdownButtonFormField<String>(
                      value: _selectedAnimalSex,
                      decoration: const InputDecoration(labelText: 'Sex (Animal)'),
                      items: const [
                        DropdownMenuItem(value: 'male', child: Text('Male')),
                        DropdownMenuItem(value: 'female', child: Text('Female')),
                        DropdownMenuItem(value: 'pair', child: Text('Pair')),
                      ],
                      onChanged: (v) => setState(() => _selectedAnimalSex = v),
                    ),
                  ],

                  // Human Gender (if enabled for category)
                  if (_activeCategory?.hasHumanGender == true) ...[
                    const SizedBox(height: 16),
                    DropdownButtonFormField<String>(
                      value: _selectedHumanGender,
                      decoration: const InputDecoration(labelText: 'Gender'),
                      items: const [
                        DropdownMenuItem(value: 'male', child: Text('Male')),
                        DropdownMenuItem(value: 'female', child: Text('Female')),
                        DropdownMenuItem(value: 'other', child: Text('Other')),
                      ],
                      onChanged: (v) => setState(() => _selectedHumanGender = v),
                    ),
                  ],

                  // ── DYNAMIC CUSTOM ATTRIBUTES BUILDER FIELDS ──
                  if (_activeCategory != null && _activeCategory!.customFields.isNotEmpty) ...[
                    const SizedBox(height: 24),
                    const Text('Category Specifications', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16)),
                    const SizedBox(height: 12),
                    ..._activeCategory!.customFields.map((field) {
                      final fieldName = field.name;
                      final fieldLabel = field.label + (field.required ? ' *' : '');
                      final fieldType = field.type;
                      final options = field.options;

                      if (options.isNotEmpty || fieldType == 'select' || fieldType == 'radio') {
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

                      if (fieldType == 'checkbox' || fieldType == 'boolean') {
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

          // Step 3: Price & Location (Price is conditionally rendered based on isPriceEnabled)
          Step(
            title: Text(_isPriceEnabled ? 'Pricing & Location' : 'Location'),
            isActive: _currentStep >= 2,
            content: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                if (_isPriceEnabled) ...[
                  TextFormField(
                    controller: _priceController,
                    keyboardType: TextInputType.number,
                    decoration: const InputDecoration(labelText: 'Price (PKR) *', prefixText: 'PKR '),
                    validator: (v) {
                      if (!_isPriceEnabled) return null;
                      return v == null || v.trim().isEmpty ? 'Price is required' : null;
                    },
                  ),
                  const SizedBox(height: 12),
                  SwitchListTile(
                    contentPadding: EdgeInsets.zero,
                    title: const Text('Negotiable Price'),
                    subtitle: const Text('Allow buyers to make offers'),
                    value: _isNegotiable,
                    onChanged: (v) => setState(() => _isNegotiable = v),
                  ),
                  const SizedBox(height: 16),
                ],

                // Location / City Selection
                Row(
                  children: [
                    Expanded(
                      child: DropdownButtonFormField<String>(
                        value: _cities.contains(_selectedCity) ? _selectedCity : _cities.first,
                        decoration: const InputDecoration(labelText: 'City / Location *', prefixIcon: Icon(Icons.location_on)),
                        items: _cities.map((c) => DropdownMenuItem(value: c, child: Text(c))).toList(),
                        onChanged: (v) => setState(() => _selectedCity = v!),
                      ),
                    ),
                    const SizedBox(width: 8),
                    IconButton.filledTonal(
                      icon: _isLocating
                          ? const SizedBox(width: 18, height: 18, child: CircularProgressIndicator(strokeWidth: 2))
                          : const Icon(Icons.my_location),
                      tooltip: 'Auto-detect current city',
                      onPressed: _isLocating ? null : _detectCurrentLocation,
                    ),
                  ],
                ),
              ],
            ),
          ),

          // Step 4: Photos & Product Video
          Step(
            title: const Text('Photos & Video'),
            isActive: _currentStep >= 3,
            content: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Text('Media Upload', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16)),
                const SizedBox(height: 4),
                const Text('Add high quality photos & video to get 5x more buyers.', style: TextStyle(color: Colors.grey, fontSize: 12)),
                const SizedBox(height: 16),

                // Upload Buttons
                Wrap(
                  spacing: 12,
                  runSpacing: 10,
                  children: [
                    ElevatedButton.icon(
                      onPressed: _pickImages,
                      icon: const Icon(Icons.add_a_photo, size: 18),
                      label: Text('Add Photos (${_selectedImageFiles.length})'),
                      style: ElevatedButton.styleFrom(
                        backgroundColor: AppTheme.primaryColor,
                        foregroundColor: Colors.white,
                        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                      ),
                    ),
                    OutlinedButton.icon(
                      onPressed: _pickVideo,
                      icon: const Icon(Icons.video_library, size: 18),
                      label: Text(_selectedVideoFile != null ? 'Video Selected' : 'Add Product Video'),
                      style: OutlinedButton.styleFrom(
                        foregroundColor: const Color(0xFF10B981),
                        side: const BorderSide(color: Color(0xFF10B981)),
                        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 16),

                // Video Preview Card
                if (_selectedVideoFile != null) ...[
                  Container(
                    padding: const EdgeInsets.all(12),
                    decoration: BoxDecoration(
                      color: const Color(0xFF10B981).withOpacity(0.1),
                      borderRadius: BorderRadius.circular(12),
                      border: Border.all(color: const Color(0xFF10B981).withOpacity(0.3)),
                    ),
                    child: Row(
                      children: [
                        const Icon(Icons.movie_creation, color: Color(0xFF10B981), size: 28),
                        const SizedBox(width: 10),
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              const Text('Product Video Attached', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 13)),
                              Text(_selectedVideoFile!.name, style: const TextStyle(fontSize: 11, color: Colors.grey), maxLines: 1, overflow: TextOverflow.ellipsis),
                            ],
                          ),
                        ),
                        IconButton(
                          icon: const Icon(Icons.delete_outline, color: Colors.red, size: 20),
                          onPressed: () => setState(() => _selectedVideoFile = null),
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(height: 16),
                ],

                // Selected Images Grid
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
                          Positioned.fill(
                            child: ClipRRect(
                              borderRadius: BorderRadius.circular(8),
                              child: Image.file(
                                File(_selectedImageFiles[index].path),
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
                                  _selectedImageFiles.removeAt(index);
                                });
                              },
                              child: Container(
                                padding: const EdgeInsets.all(2),
                                decoration: const BoxDecoration(
                                  color: Colors.black54,
                                  shape: BoxShape.circle,
                                ),
                                child: const Icon(Icons.close, size: 16, color: Colors.white),
                              ),
                            ),
                          ),
                        ],
                      );
                    },
                  ),
                const SizedBox(height: 24),
                if (_isSubmitting)
                  const Center(child: CircularProgressIndicator())
                else
                  SizedBox(
                    width: double.infinity,
                    height: 50,
                    child: ElevatedButton(
                      onPressed: _submitListing,
                      style: ElevatedButton.styleFrom(
                        backgroundColor: const Color(0xFF10B981),
                        foregroundColor: Colors.white,
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                      ),
                      child: const Text('Post Ad Now', style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold)),
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
