import 'package:flutter/material.dart';
import '../../../core/theme/app_theme.dart';
import '../data/listing_model.dart';
import '../data/listing_repository.dart';
import 'widgets/listing_card.dart';

class ListingsSearchScreen extends StatefulWidget {
  final String? initialQuery;
  final String? initialCategoryId;
  final String? initialCategoryName;

  const ListingsSearchScreen({
    super.key,
    this.initialQuery,
    this.initialCategoryId,
    this.initialCategoryName,
  });

  @override
  State<ListingsSearchScreen> createState() => _ListingsSearchScreenState();
}

class _ListingsSearchScreenState extends State<ListingsSearchScreen> {
  final ListingRepository _repository = ListingRepository();
  final TextEditingController _searchController = TextEditingController();
  final ScrollController _scrollController = ScrollController();

  List<ListingModel> _listings = [];
  bool _isLoading = false;
  bool _hasMore = true;
  int _page = 1;

  String? _selectedCondition;
  String _selectedSort = 'created_at_desc';

  @override
  void initState() {
    super.initState();
    if (widget.initialQuery != null) {
      _searchController.text = widget.initialQuery!;
    }
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

  Future<void> _loadListings() async {
    setState(() {
      _isLoading = true;
      _page = 1;
      _listings = [];
    });

    final results = await _repository.searchListings(
      queryText: _searchController.text,
      categoryId: widget.initialCategoryId,
      condition: _selectedCondition,
      sortBy: _selectedSort,
      page: 1,
    );

    setState(() {
      _listings = results;
      _isLoading = false;
      _hasMore = results.length >= 20;
    });
  }

  Future<void> _loadMoreListings() async {
    if (_isLoading) return;
    setState(() => _isLoading = true);

    final nextPage = _page + 1;
    final results = await _repository.searchListings(
      queryText: _searchController.text,
      categoryId: widget.initialCategoryId,
      condition: _selectedCondition,
      sortBy: _selectedSort,
      page: nextPage,
    );

    setState(() {
      _page = nextPage;
      _listings.addAll(results);
      _isLoading = false;
      _hasMore = results.length >= 20;
    });
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text(widget.initialCategoryName ?? 'Search Listings'),
      ),
      body: Column(
        children: [
          // Search Input Bar
          Padding(
            padding: const EdgeInsets.all(12.0),
            child: Row(
              children: [
                Expanded(
                  child: TextField(
                    controller: _searchController,
                    onSubmitted: (_) => _loadListings(),
                    decoration: InputDecoration(
                      hintText: 'Search cars, mobiles, property...',
                      prefixIcon: const Icon(Icons.search),
                      suffixIcon: _searchController.text.isNotEmpty
                          ? IconButton(
                              icon: const Icon(Icons.clear),
                              onPressed: () {
                                _searchController.clear();
                                _loadListings();
                              },
                            )
                          : null,
                    ),
                  ),
                ),
                const SizedBox(width: 8),
                IconButton.filled(
                  icon: const Icon(Icons.tune),
                  style: IconButton.styleFrom(backgroundColor: AppTheme.primaryColor),
                  onPressed: _showFilterModal,
                ),
              ],
            ),
          ),

          // Active Filter Chips
          SingleChildScrollView(
            scrollDirection: Axis.horizontal,
            padding: const EdgeInsets.symmetric(horizontal: 12),
            child: Row(
              children: [
                FilterChip(
                  label: const Text('New'),
                  selected: _selectedCondition == 'new',
                  onSelected: (selected) {
                    setState(() => _selectedCondition = selected ? 'new' : null);
                    _loadListings();
                  },
                ),
                const SizedBox(width: 6),
                FilterChip(
                  label: const Text('Used'),
                  selected: _selectedCondition == 'used',
                  onSelected: (selected) {
                    setState(() => _selectedCondition = selected ? 'used' : null);
                    _loadListings();
                  },
                ),
                const SizedBox(width: 6),
                FilterChip(
                  label: const Text('Refurbished'),
                  selected: _selectedCondition == 'refurbished',
                  onSelected: (selected) {
                    setState(() => _selectedCondition = selected ? 'refurbished' : null);
                    _loadListings();
                  },
                ),
              ],
            ),
          ),

          // Listing Results Grid
          Expanded(
            child: RefreshIndicator(
              onRefresh: _loadListings,
              child: _listings.isEmpty && !_isLoading
                  ? const Center(
                      child: Column(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          Icon(Icons.search_off, size: 60, color: Colors.grey),
                          SizedBox(height: 12),
                          Text('No listings found', style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold)),
                          Text('Try adjusting your search query or filters', style: TextStyle(color: Colors.grey)),
                        ],
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
    showModalBottomSheet(
      context: context,
      shape: const RoundedRectangleBorder(borderRadius: BorderRadius.vertical(top: Radius.circular(20))),
      builder: (ctx) => Padding(
        padding: const EdgeInsets.all(20.0),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text('Sort Listings By', style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
            const SizedBox(height: 12),
            RadioListTile<String>(
              title: const Text('Latest (Newest First)'),
              value: 'created_at_desc',
              groupValue: _selectedSort,
              onChanged: (v) {
                setState(() => _selectedSort = v!);
                Navigator.pop(ctx);
                _loadListings();
              },
            ),
            RadioListTile<String>(
              title: const Text('Price: Low to High'),
              value: 'price_asc',
              groupValue: _selectedSort,
              onChanged: (v) {
                setState(() => _selectedSort = v!);
                Navigator.pop(ctx);
                _loadListings();
              },
            ),
            RadioListTile<String>(
              title: const Text('Price: High to Low'),
              value: 'price_desc',
              groupValue: _selectedSort,
              onChanged: (v) {
                setState(() => _selectedSort = v!);
                Navigator.pop(ctx);
                _loadListings();
              },
            ),
          ],
        ),
      ),
    );
  }
}
