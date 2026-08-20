import 'package:flutter/material.dart';
import '../../../core/theme/app_theme.dart';
import '../../categories/data/category_model.dart';
import '../../listings/data/listing_model.dart';
import '../../listings/data/listing_repository.dart';
import '../../listings/presentation/widgets/listing_card.dart';

class CategoryListingsScreen extends StatefulWidget {
  final CategoryModel category;
  final String? initialSubcategoryId;
  final String? initialSubSubcategoryId;

  const CategoryListingsScreen({
    super.key,
    required this.category,
    this.initialSubcategoryId,
    this.initialSubSubcategoryId,
  });

  @override
  State<CategoryListingsScreen> createState() => _CategoryListingsScreenState();
}

class _CategoryListingsScreenState extends State<CategoryListingsScreen> {
  final ListingRepository _repository = ListingRepository();
  final TextEditingController _searchController = TextEditingController();
  final ScrollController _scrollController = ScrollController();

  List<ListingModel> _listings = [];
  bool _isLoading = false;
  bool _hasMore = true;
  int _page = 1;

  String? _selectedSubcategoryId;
  String? _selectedSubSubcategoryId;
  String? _selectedCity;
  String? _selectedCondition;
  double? _minPrice;
  double? _maxPrice;
  String _selectedSort = 'created_at_desc';
  final Map<String, dynamic> _customFilters = {};

  final List<String> _cities = [
    'All Cities',
    'Lahore',
    'Karachi',
    'Islamabad',
    'Rawalpindi',
    'Faisalabad',
    'Multan',
    'Peshawar',
    'Gujranwala',
    'Sialkot',
    'Quetta'
  ];

  @override
  void initState() {
    super.initState();
    _selectedSubcategoryId = widget.initialSubcategoryId;
    _selectedSubSubcategoryId = widget.initialSubSubcategoryId;
    _loadListings();

    _scrollController.addListener(() {
      if (_scrollController.position.pixels >= _scrollController.position.maxScrollExtent - 200) {
        if (!_isLoading && _hasMore) {
          _loadMoreListings();
        }
      }
    });
  }

  @override
  void dispose() {
    _searchController.dispose();
    _scrollController.dispose();
    super.dispose();
  }

  List<String> get _allSubcategoryIds {
    final List<String> ids = [];
    for (final sub in widget.category.subcategories) {
      ids.add(sub.id);
      for (final ss in sub.subcategories) {
        ids.add(ss.id);
      }
    }
    return ids;
  }

  CategoryModel? get _currentActiveCategoryModel {
    if (_selectedSubSubcategoryId != null) {
      for (final sub in widget.category.subcategories) {
        for (final ss in sub.subcategories) {
          if (ss.id == _selectedSubSubcategoryId) return ss;
        }
      }
    }
    if (_selectedSubcategoryId != null) {
      for (final sub in widget.category.subcategories) {
        if (sub.id == _selectedSubcategoryId) return sub;
      }
    }
    return widget.category;
  }

  Future<void> _loadListings() async {
    setState(() {
      _isLoading = true;
      _page = 1;
      _listings = [];
    });

    final results = await _repository.getCategoryTreeListings(
      categoryId: widget.category.id,
      subcategoryIds: _allSubcategoryIds,
      selectedSubcategoryId: _selectedSubcategoryId,
      selectedSubSubcategoryId: _selectedSubSubcategoryId,
      queryText: _searchController.text,
      city: _selectedCity,
      condition: _selectedCondition,
      minPrice: _minPrice,
      maxPrice: _maxPrice,
      customFilters: _customFilters,
      sortBy: _selectedSort,
      page: 1,
    );

    if (mounted) {
      setState(() {
        _listings = results;
        _isLoading = false;
        _hasMore = results.length >= 30;
      });
    }
  }

  Future<void> _loadMoreListings() async {
    if (_isLoading) return;
    setState(() => _isLoading = true);

    final nextPage = _page + 1;
    final results = await _repository.getCategoryTreeListings(
      categoryId: widget.category.id,
      subcategoryIds: _allSubcategoryIds,
      selectedSubcategoryId: _selectedSubcategoryId,
      selectedSubSubcategoryId: _selectedSubSubcategoryId,
      queryText: _searchController.text,
      city: _selectedCity,
      condition: _selectedCondition,
      minPrice: _minPrice,
      maxPrice: _maxPrice,
      customFilters: _customFilters,
      sortBy: _selectedSort,
      page: nextPage,
    );

    if (mounted) {
      setState(() {
        _page = nextPage;
        _listings.addAll(results);
        _isLoading = false;
        _hasMore = results.length >= 30;
      });
    }
  }

  int get _activeFiltersCount {
    int count = 0;
    if (_selectedCity != null && _selectedCity != 'All Cities') count++;
    if (_selectedCondition != null) count++;
    if (_minPrice != null || _maxPrice != null) count++;
    count += _customFilters.values.where((v) => v != null && v.toString().trim().isNotEmpty).length;
    return count;
  }

  @override
  Widget build(BuildContext context) {
    final subcategories = widget.category.subcategories;
    final selectedSub = subcategories.where((s) => s.id == _selectedSubcategoryId).firstOrNull;
    final subSubcategories = selectedSub?.subcategories ?? [];

    return Scaffold(
      appBar: AppBar(
        title: Text(
          widget.category.name,
          style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 18),
        ),
      ),
      body: Column(
        children: [
          // Search & Filter Header
          Padding(
            padding: const EdgeInsets.fromLTRB(14, 10, 14, 6),
            child: Row(
              children: [
                Expanded(
                  child: Container(
                    decoration: BoxDecoration(
                      color: Theme.of(context).cardColor,
                      borderRadius: BorderRadius.circular(14),
                      border: Border.all(color: Colors.grey.shade300),
                    ),
                    child: TextField(
                      controller: _searchController,
                      onSubmitted: (_) => _loadListings(),
                      decoration: InputDecoration(
                        hintText: 'Search in ${widget.category.name}...',
                        prefixIcon: const Icon(Icons.search, size: 20),
                        border: InputBorder.none,
                        contentPadding: const EdgeInsets.symmetric(vertical: 12),
                        suffixIcon: _searchController.text.isNotEmpty
                            ? IconButton(
                                icon: const Icon(Icons.clear, size: 18),
                                onPressed: () {
                                  _searchController.clear();
                                  _loadListings();
                                },
                              )
                            : null,
                      ),
                    ),
                  ),
                ),
                const SizedBox(width: 8),
                Badge(
                  isLabelVisible: _activeFiltersCount > 0,
                  label: Text('$_activeFiltersCount'),
                  child: IconButton.filled(
                    icon: const Icon(Icons.tune, size: 20),
                    style: IconButton.styleFrom(
                      backgroundColor: _activeFiltersCount > 0 ? const Color(0xFF10B981) : AppTheme.primaryColor,
                    ),
                    onPressed: _showFilterModal,
                  ),
                ),
              ],
            ),
          ),

          // Subcategories Horizontal Selector Pills
          if (subcategories.isNotEmpty) ...[
            SingleChildScrollView(
              scrollDirection: Axis.horizontal,
              padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 4),
              child: Row(
                children: [
                  ChoiceChip(
                    label: const Text('All'),
                    selected: _selectedSubcategoryId == null,
                    onSelected: (selected) {
                      if (selected) {
                        setState(() {
                          _selectedSubcategoryId = null;
                          _selectedSubSubcategoryId = null;
                        });
                        _loadListings();
                      }
                    },
                  ),
                  const SizedBox(width: 8),
                  ...subcategories.map((sub) {
                    final isSelected = _selectedSubcategoryId == sub.id;
                    return Padding(
                      padding: const EdgeInsets.only(right: 8.0),
                      child: ChoiceChip(
                        label: Text(sub.name),
                        selected: isSelected,
                        onSelected: (selected) {
                          setState(() {
                            _selectedSubcategoryId = selected ? sub.id : null;
                            _selectedSubSubcategoryId = null;
                          });
                          _loadListings();
                        },
                      ),
                    );
                  }),
                ],
              ),
            ),
          ],

          // Sub-subcategories Pills (if any)
          if (subSubcategories.isNotEmpty) ...[
            SingleChildScrollView(
              scrollDirection: Axis.horizontal,
              padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 4),
              child: Row(
                children: [
                  ChoiceChip(
                    label: const Text('All Sub-types'),
                    selected: _selectedSubSubcategoryId == null,
                    onSelected: (selected) {
                      if (selected) {
                        setState(() => _selectedSubSubcategoryId = null);
                        _loadListings();
                      }
                    },
                  ),
                  const SizedBox(width: 6),
                  ...subSubcategories.map((ss) {
                    final isSelected = _selectedSubSubcategoryId == ss.id;
                    return Padding(
                      padding: const EdgeInsets.only(right: 6.0),
                      child: ChoiceChip(
                        label: Text(ss.name),
                        selected: isSelected,
                        onSelected: (selected) {
                          setState(() => _selectedSubSubcategoryId = selected ? ss.id : null);
                          _loadListings();
                        },
                      ),
                    );
                  }),
                ],
              ),
            ),
          ],

          const Divider(height: 1),

          // Listings Grid View
          Expanded(
            child: RefreshIndicator(
              onRefresh: _loadListings,
              child: _listings.isEmpty && !_isLoading
                  ? Center(
                      child: Padding(
                        padding: const EdgeInsets.all(32.0),
                        child: Column(
                          mainAxisAlignment: MainAxisAlignment.center,
                          children: [
                            Icon(Icons.inventory_2_outlined, size: 64, color: Colors.grey.shade400),
                            const SizedBox(height: 16),
                            Text(
                              'No listings found in ${widget.category.name}',
                              style: const TextStyle(fontSize: 17, fontWeight: FontWeight.bold),
                              textAlign: TextAlign.center,
                            ),
                            const SizedBox(height: 8),
                            const Text(
                              'Try clearing your filters or check back later.',
                              style: TextStyle(color: Colors.grey),
                              textAlign: TextAlign.center,
                            ),
                            const SizedBox(height: 20),
                            if (_activeFiltersCount > 0)
                              ElevatedButton.icon(
                                onPressed: () {
                                  setState(() {
                                    _selectedCity = null;
                                    _selectedCondition = null;
                                    _minPrice = null;
                                    _maxPrice = null;
                                    _customFilters.clear();
                                  });
                                  _loadListings();
                                },
                                icon: const Icon(Icons.refresh, size: 18),
                                label: const Text('Clear Filters'),
                              ),
                          ],
                        ),
                      ),
                    )
                  : GridView.builder(
                      controller: _scrollController,
                      padding: const EdgeInsets.all(12),
                      gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                        crossAxisCount: 2,
                        childAspectRatio: 0.72,
                        crossAxisSpacing: 10,
                        mainAxisSpacing: 10,
                      ),
                      itemCount: _listings.length + (_isLoading ? 2 : 0),
                      itemBuilder: (context, index) {
                        if (index >= _listings.length) {
                          return Container(
                            decoration: BoxDecoration(
                              color: Colors.grey.shade200,
                              borderRadius: BorderRadius.circular(16),
                            ),
                            child: const Center(child: CircularProgressIndicator()),
                          );
                        }
                        return ListingCard(listing: _listings[index]);
                      },
                    ),
            ),
          ),
        ],
      ),
    );
  }

  void _showFilterModal() {
    final activeCat = _currentActiveCategoryModel ?? widget.category;
    final customFields = activeCat.customFields;

    final minPriceCtrl = TextEditingController(text: _minPrice != null ? _minPrice!.toInt().toString() : '');
    final maxPriceCtrl = TextEditingController(text: _maxPrice != null ? _maxPrice!.toInt().toString() : '');

    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      shape: const RoundedRectangleBorder(borderRadius: BorderRadius.vertical(top: Radius.circular(24))),
      builder: (ctx) => StatefulBuilder(
        builder: (context, setModalState) => DraggableScrollableSheet(
          initialChildSize: 0.85,
          maxChildSize: 0.95,
          minChildSize: 0.5,
          expand: false,
          builder: (_, scrollCtrl) => Padding(
            padding: const EdgeInsets.fromLTRB(20, 16, 20, 20),
            child: ListView(
              controller: scrollCtrl,
              children: [
                // Modal Header
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Text('Filter ${widget.category.name}', style: const TextStyle(fontSize: 19, fontWeight: FontWeight.bold)),
                    TextButton(
                      onPressed: () {
                        setState(() {
                          _selectedCity = null;
                          _selectedCondition = null;
                          _minPrice = null;
                          _maxPrice = null;
                          _customFilters.clear();
                        });
                        setModalState(() {});
                      },
                      child: const Text('Reset All', style: TextStyle(color: Colors.red)),
                    ),
                  ],
                ),
                const SizedBox(height: 12),

                // City / Location
                const Text('Location / City', style: TextStyle(fontSize: 15, fontWeight: FontWeight.bold)),
                const SizedBox(height: 6),
                DropdownButtonFormField<String>(
                  value: _selectedCity ?? 'All Cities',
                  decoration: const InputDecoration(prefixIcon: Icon(Icons.location_on, size: 20)),
                  items: _cities.map((c) => DropdownMenuItem(value: c, child: Text(c))).toList(),
                  onChanged: (val) {
                    setState(() => _selectedCity = val);
                    setModalState(() {});
                  },
                ),
                const SizedBox(height: 16),

                // Price Range
                if (widget.category.isPriceEnabled) ...[
                  const Text('Price Range (PKR)', style: TextStyle(fontSize: 15, fontWeight: FontWeight.bold)),
                  const SizedBox(height: 8),
                  Row(
                    children: [
                      Expanded(
                        child: TextField(
                          controller: minPriceCtrl,
                          keyboardType: TextInputType.number,
                          decoration: const InputDecoration(hintText: 'Min PKR', prefixText: 'Rs '),
                          onChanged: (v) => _minPrice = double.tryParse(v),
                        ),
                      ),
                      const SizedBox(width: 10),
                      Expanded(
                        child: TextField(
                          controller: maxPriceCtrl,
                          keyboardType: TextInputType.number,
                          decoration: const InputDecoration(hintText: 'Max PKR', prefixText: 'Rs '),
                          onChanged: (v) => _maxPrice = double.tryParse(v),
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 16),
                ],

                // Condition Filter
                const Text('Condition', style: TextStyle(fontSize: 15, fontWeight: FontWeight.bold)),
                const SizedBox(height: 8),
                Wrap(
                  spacing: 8,
                  children: ['New', 'Used', 'Refurbished', 'Open Box'].map((c) {
                    final isSelected = _selectedCondition?.toLowerCase() == c.toLowerCase();
                    return FilterChip(
                      label: Text(c),
                      selected: isSelected,
                      onSelected: (selected) {
                        setState(() => _selectedCondition = selected ? c : null);
                        setModalState(() {});
                      },
                    );
                  }).toList(),
                ),
                const SizedBox(height: 18),

                // ── DYNAMIC CATEGORY SPECIFICATIONS FILTERS (From Admin) ──
                if (customFields.isNotEmpty) ...[
                  const Divider(),
                  const SizedBox(height: 8),
                  const Text('Category Specifications', style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold)),
                  const SizedBox(height: 12),
                  ...customFields.map((field) {
                    final fieldName = field.name;
                    final fieldLabel = field.label;
                    final options = field.options;

                    if (options.isNotEmpty || field.type == 'select' || field.type == 'radio') {
                      return Padding(
                        padding: const EdgeInsets.only(bottom: 12.0),
                        child: DropdownButtonFormField<String>(
                          value: _customFilters[fieldName]?.toString(),
                          decoration: InputDecoration(labelText: fieldLabel),
                          items: [
                            const DropdownMenuItem(value: '', child: Text('All')),
                            ...options.map((opt) => DropdownMenuItem(value: opt, child: Text(opt))),
                          ],
                          onChanged: (val) {
                            setState(() {
                              if (val == null || val.isEmpty) {
                                _customFilters.remove(fieldName);
                              } else {
                                _customFilters[fieldName] = val;
                              }
                            });
                            setModalState(() {});
                          },
                        ),
                      );
                    }

                    return Padding(
                      padding: const EdgeInsets.only(bottom: 12.0),
                      child: TextFormField(
                        initialValue: _customFilters[fieldName]?.toString(),
                        decoration: InputDecoration(labelText: fieldLabel),
                        onChanged: (val) {
                          if (val.trim().isEmpty) {
                            _customFilters.remove(fieldName);
                          } else {
                            _customFilters[fieldName] = val.trim();
                          }
                        },
                      ),
                    );
                  }),
                ],

                // Sort By
                const Divider(),
                const SizedBox(height: 8),
                const Text('Sort By', style: TextStyle(fontSize: 15, fontWeight: FontWeight.bold)),
                const SizedBox(height: 6),
                RadioListTile<String>(
                  title: const Text('Latest (Newest First)'),
                  value: 'created_at_desc',
                  groupValue: _selectedSort,
                  onChanged: (v) {
                    setState(() => _selectedSort = v!);
                    setModalState(() {});
                  },
                ),
                RadioListTile<String>(
                  title: const Text('Price: Low to High'),
                  value: 'price_asc',
                  groupValue: _selectedSort,
                  onChanged: (v) {
                    setState(() => _selectedSort = v!);
                    setModalState(() {});
                  },
                ),
                RadioListTile<String>(
                  title: const Text('Price: High to Low'),
                  value: 'price_desc',
                  groupValue: _selectedSort,
                  onChanged: (v) {
                    setState(() => _selectedSort = v!);
                    setModalState(() {});
                  },
                ),
                const SizedBox(height: 16),

                // Apply Button
                SizedBox(
                  width: double.infinity,
                  height: 50,
                  child: ElevatedButton(
                    onPressed: () {
                      Navigator.pop(ctx);
                      _loadListings();
                    },
                    style: ElevatedButton.styleFrom(
                      backgroundColor: AppTheme.primaryColor,
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
                    ),
                    child: const Text('Apply Filters', style: TextStyle(color: Colors.white, fontSize: 16, fontWeight: FontWeight.bold)),
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
