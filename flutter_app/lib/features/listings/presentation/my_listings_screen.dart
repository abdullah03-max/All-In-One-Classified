import 'package:flutter/material.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import 'package:cached_network_image/cached_network_image.dart';
import 'package:intl/intl.dart';
import '../../../core/theme/app_theme.dart';
import '../data/listing_model.dart';
import '../../payments/presentation/promote_listing_screen.dart';
import 'edit_listing_screen.dart';
import 'listing_detail_screen.dart';

class MyListingsScreen extends StatefulWidget {
  const MyListingsScreen({super.key});

  @override
  State<MyListingsScreen> createState() => _MyListingsScreenState();
}

class _MyListingsScreenState extends State<MyListingsScreen> {
  final SupabaseClient _client = Supabase.instance.client;
  List<ListingModel> _listings = [];
  bool _isLoading = true;
  String _selectedStatusFilter = 'all';
  String _searchQuery = '';

  @override
  void initState() {
    super.initState();
    _fetchMyListings();
  }

  Future<void> _fetchMyListings() async {
    final user = _client.auth.currentUser;
    if (user == null) return;

    setState(() => _isLoading = true);

    try {
      final response = await _client
          .from('listings')
          .select('''
            *,
            category:categories!listings_category_id_fkey(id, name, slug, icon, color),
            seller:users!listings_seller_id_fkey(id, full_name, avatar_url, is_verified, phone, city)
          ''')
          .eq('seller_id', user.id)
          .order('created_at', ascending: false);

      final List<dynamic> data = response as List<dynamic>;
      if (mounted) {
        setState(() {
          _listings = data.map((j) => ListingModel.fromJson(j)).toList();
          _isLoading = false;
        });
      }
    } catch (e) {
      print('Error fetching seller listings: $e');
      if (mounted) {
        setState(() => _isLoading = false);
      }
    }
  }

  Future<void> _markStatus(String id, String newStatus) async {
    final user = _client.auth.currentUser;
    if (user == null) return;

    try {
      await _client
          .from('listings')
          .update({'status': newStatus})
          .eq('id', id)
          .eq('seller_id', user.id);

      _fetchMyListings();
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Listing marked as ${newStatus.toUpperCase()}')),
        );
      }
    } catch (e) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Error updating status: $e')),
      );
    }
  }

  Future<void> _deleteListing(String id) async {
    final user = _client.auth.currentUser;
    if (user == null) return;

    final confirm = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('Delete Listing'),
        content: const Text('Are you sure you want to permanently delete this listing? This action cannot be undone.'),
        actions: [
          TextButton(onPressed: () => Navigator.pop(ctx, false), child: const Text('Cancel')),
          ElevatedButton(
            onPressed: () => Navigator.pop(ctx, true),
            style: ElevatedButton.styleFrom(backgroundColor: Colors.redAccent, foregroundColor: Colors.white),
            child: const Text('Delete Permanently'),
          ),
        ],
      ),
    );

    if (confirm == true) {
      try {
        await _client.from('listings').delete().eq('id', id).eq('seller_id', user.id);
        _fetchMyListings();
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(content: Text('Listing deleted successfully.'), backgroundColor: Color(0xFF10B981)),
          );
        }
      } catch (e) {
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(content: Text('Error deleting listing: $e')),
          );
        }
      }
    }
  }

  List<ListingModel> get _filteredListings {
    return _listings.where((l) {
      final matchesStatus = _selectedStatusFilter == 'all' || l.status == _selectedStatusFilter;
      final matchesQuery = _searchQuery.isEmpty || l.title.toLowerCase().contains(_searchQuery.toLowerCase());
      return matchesStatus && matchesQuery;
    }).toList();
  }

  @override
  Widget build(BuildContext context) {
    final currencyFormatter = NumberFormat.currency(symbol: 'PKR ', decimalDigits: 0);

    return Scaffold(
      appBar: AppBar(
        title: const Text('My Listings'),
      ),
      body: RefreshIndicator(
        onRefresh: _fetchMyListings,
        child: Column(
          children: [
            // Search Input
            Padding(
              padding: const EdgeInsets.all(12.0),
              child: TextField(
                onChanged: (val) => setState(() => _searchQuery = val),
                decoration: const InputDecoration(
                  hintText: 'Search my listings...',
                  prefixIcon: Icon(Icons.search),
                ),
              ),
            ),

            // Filter Tabs Bar
            SingleChildScrollView(
              scrollDirection: Axis.horizontal,
              padding: const EdgeInsets.symmetric(horizontal: 12),
              child: Row(
                children: [
                  _buildFilterTab('all', 'All (${_listings.length})'),
                  _buildFilterTab('active', 'Active'),
                  _buildFilterTab('pending', 'Pending'),
                  _buildFilterTab('sold', 'Sold'),
                  _buildFilterTab('rejected', 'Rejected'),
                ],
              ),
            ),
            const SizedBox(height: 8),

            // Listings ListView
            Expanded(
              child: _isLoading
                  ? const Center(child: CircularProgressIndicator())
                  : _filteredListings.isEmpty
                      ? const Center(
                          child: Column(
                            mainAxisAlignment: MainAxisAlignment.center,
                            children: [
                              Icon(Icons.inventory_2_outlined, size: 60, color: Colors.grey),
                              SizedBox(height: 12),
                              Text('No listings found', style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold)),
                            ],
                          ),
                        )
                      : ListView.builder(
                          padding: const EdgeInsets.all(12),
                          itemCount: _filteredListings.length,
                          itemBuilder: (context, index) {
                            final listing = _filteredListings[index];
                            return Card(
                              margin: const EdgeInsets.only(bottom: 12),
                              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                              child: Padding(
                                padding: const EdgeInsets.all(12.0),
                                child: Column(
                                  children: [
                                    Row(
                                      children: [
                                        ClipRRect(
                                          borderRadius: BorderRadius.circular(10),
                                          child: SizedBox(
                                            width: 80,
                                            height: 80,
                                            child: listing.images.isNotEmpty
                                                ? CachedNetworkImage(
                                                    imageUrl: listing.images.first,
                                                    fit: BoxFit.cover,
                                                    errorWidget: (_, __, ___) => Container(
                                                      color: Colors.grey.shade200,
                                                      child: const Icon(Icons.broken_image, color: Colors.grey),
                                                    ),
                                                  )
                                                : Container(color: Colors.grey.shade200, child: const Icon(Icons.image)),
                                          ),
                                        ),
                                        const SizedBox(width: 12),
                                        Expanded(
                                          child: Column(
                                            crossAxisAlignment: CrossAxisAlignment.start,
                                            children: [
                                              Row(
                                                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                                children: [
                                                  _buildStatusBadge(listing.status),
                                                  Text('${listing.viewsCount} views', style: const TextStyle(fontSize: 11, color: Colors.grey)),
                                                ],
                                              ),
                                              const SizedBox(height: 4),
                                              Text(
                                                listing.title,
                                                maxLines: 1,
                                                overflow: TextOverflow.ellipsis,
                                                style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 14),
                                              ),
                                              const SizedBox(height: 2),
                                              Text(
                                                currencyFormatter.format(listing.price),
                                                style: const TextStyle(color: AppTheme.primaryColor, fontWeight: FontWeight.bold, fontSize: 14),
                                              ),
                                            ],
                                          ),
                                        ),
                                      ],
                                    ),
                                    const Divider(height: 16),

                                    // Action Buttons Bar with Horizontal Scroll to prevent ANY overflow
                                    SingleChildScrollView(
                                      scrollDirection: Axis.horizontal,
                                      child: Row(
                                        mainAxisAlignment: MainAxisAlignment.end,
                                        children: [
                                          TextButton.icon(
                                            onPressed: () async {
                                              final promoted = await Navigator.push<bool>(
                                                context,
                                                MaterialPageRoute(builder: (_) => PromoteListingScreen(listing: listing)),
                                              );
                                              if (promoted == true) _fetchMyListings();
                                            },
                                            icon: const Icon(Icons.rocket_launch, size: 15, color: Colors.amber),
                                            label: const Text('Promote', style: TextStyle(color: Colors.amber, fontSize: 12)),
                                          ),
                                          TextButton.icon(
                                            onPressed: () {
                                              Navigator.push(
                                                context,
                                                MaterialPageRoute(builder: (_) => ListingDetailScreen(listing: listing)),
                                              );
                                            },
                                            icon: const Icon(Icons.remove_red_eye, size: 15),
                                            label: const Text('View', style: TextStyle(fontSize: 12)),
                                          ),
                                          TextButton.icon(
                                            onPressed: () async {
                                              final updated = await Navigator.push<bool>(
                                                context,
                                                MaterialPageRoute(builder: (_) => EditListingScreen(listing: listing)),
                                              );
                                              if (updated == true) _fetchMyListings();
                                            },
                                            icon: const Icon(Icons.edit, size: 15),
                                            label: const Text('Edit', style: TextStyle(fontSize: 12)),
                                          ),
                                          if (listing.status == 'active')
                                            TextButton.icon(
                                              onPressed: () => _markStatus(listing.id, 'sold'),
                                              icon: const Icon(Icons.check_circle_outline, size: 15, color: Colors.blue),
                                              label: const Text('Mark Sold', style: TextStyle(color: Colors.blue, fontSize: 12)),
                                            )
                                          else if (listing.status == 'sold')
                                            TextButton.icon(
                                              onPressed: () => _markStatus(listing.id, 'active'),
                                              icon: const Icon(Icons.refresh, size: 15, color: Color(0xFF10B981)),
                                              label: const Text('Re-activate', style: TextStyle(color: Color(0xFF10B981), fontSize: 12)),
                                            ),
                                          TextButton.icon(
                                            onPressed: () => _deleteListing(listing.id),
                                            icon: const Icon(Icons.delete_outline, color: Colors.redAccent, size: 15),
                                            label: const Text('Delete', style: TextStyle(color: Colors.redAccent, fontSize: 12, fontWeight: FontWeight.bold)),
                                          ),
                                        ],
                                      ),
                                    ),
                                  ],
                                ),
                              ),
                            );
                          },
                        ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildFilterTab(String status, String label) {
    final isSelected = _selectedStatusFilter == status;
    return Padding(
      padding: const EdgeInsets.only(right: 6),
      child: ChoiceChip(
        label: Text(label),
        selected: isSelected,
        onSelected: (_) => setState(() => _selectedStatusFilter = status),
      ),
    );
  }

  Widget _buildStatusBadge(String status) {
    Color bg = Colors.grey.shade100;
    Color text = Colors.grey.shade700;

    if (status == 'active') {
      bg = Colors.green.shade50;
      text = const Color(0xFF10B981);
    } else if (status == 'pending') {
      bg = Colors.amber.shade50;
      text = Colors.amber.shade800;
    } else if (status == 'sold') {
      bg = Colors.blue.shade50;
      text = Colors.blue;
    } else if (status == 'rejected') {
      bg = Colors.red.shade50;
      text = Colors.red;
    }

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
      decoration: BoxDecoration(color: bg, borderRadius: BorderRadius.circular(6)),
      child: Text(status.toUpperCase(), style: TextStyle(color: text, fontSize: 10, fontWeight: FontWeight.bold)),
    );
  }
}
