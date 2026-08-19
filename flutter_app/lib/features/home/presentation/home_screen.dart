import 'package:flutter/material.dart';
import '../../../core/theme/app_theme.dart';
import '../../categories/data/category_model.dart';
import '../../categories/data/category_repository.dart';
import '../../categories/presentation/categories_screen.dart';
import '../../listings/data/listing_model.dart';
import '../../listings/data/listing_repository.dart';
import '../../listings/presentation/listings_search_screen.dart';
import '../../listings/presentation/widgets/listing_card.dart';
import '../../notifications/presentation/notifications_screen.dart';
import '../../ai_assistant/presentation/ai_assistant_screen.dart';

class HomeScreen extends StatefulWidget {
  const HomeScreen({super.key});

  @override
  State<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends State<HomeScreen> {
  final CategoryRepository _categoryRepository = CategoryRepository();
  final ListingRepository _listingRepository = ListingRepository();

  List<CategoryModel> _categories = [];
  List<ListingModel> _featuredListings = [];
  List<ListingModel> _recentListings = [];
  bool _isLoading = true;

  @override
  void initState() {
    super.initState();
    _loadHomeData();
  }

  Future<void> _loadHomeData() async {
    setState(() => _isLoading = true);

    final catsFuture = _categoryRepository.getCategoriesHierarchy();
    final featuredFuture = _listingRepository.getFeaturedListings(limit: 10);
    final recentFuture = _listingRepository.getRecentListings(limit: 20);

    final results = await Future.wait([catsFuture, featuredFuture, recentFuture]);

    setState(() {
      _categories = results[0] as List<CategoryModel>;
      _featuredListings = results[1] as List<ListingModel>;
      _recentListings = results[2] as List<ListingModel>;
      _isLoading = false;
    });
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Row(
          children: [
            Container(
              padding: const EdgeInsets.all(6),
              decoration: BoxDecoration(
                color: AppTheme.primaryColor,
                borderRadius: BorderRadius.circular(10),
              ),
              child: const Icon(Icons.storefront, color: Colors.white, size: 20),
            ),
            const SizedBox(width: 10),
            const Text(
              'All In One',
              style: TextStyle(fontWeight: FontWeight.bold, fontSize: 18),
            ),
          ],
        ),
        actions: [
          IconButton(
            icon: const Icon(Icons.auto_awesome, color: Color(0xFF818CF8)),
            tooltip: 'AI Assistant',
            onPressed: () {
              Navigator.push(
                context,
                MaterialPageRoute(builder: (_) => const AiAssistantScreen()),
              );
            },
          ),
          IconButton(
            icon: const Icon(Icons.search),
            onPressed: () {
              Navigator.push(
                context,
                MaterialPageRoute(builder: (_) => const ListingsSearchScreen()),
              );
            },
          ),
          IconButton(
            icon: const Icon(Icons.notifications_none),
            onPressed: () {
              Navigator.push(
                context,
                MaterialPageRoute(builder: (_) => const NotificationsScreen()),
              );
            },
          ),
        ],
      ),
      floatingActionButton: FloatingActionButton.extended(
        onPressed: () {
          Navigator.push(
            context,
            MaterialPageRoute(builder: (_) => const AiAssistantScreen()),
          );
        },
        backgroundColor: const Color(0xFF4F46E5),
        icon: const Icon(Icons.auto_awesome, color: Colors.white, size: 18),
        label: const Text(
          'Ask AI',
          style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold),
        ),
      ),
      body: RefreshIndicator(
        onRefresh: _loadHomeData,
        child: _isLoading
            ? const Center(child: CircularProgressIndicator())
            : SingleChildScrollView(
                padding: const EdgeInsets.all(16.0),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    // Search Bar Trigger Input
                    GestureDetector(
                      onTap: () {
                        Navigator.push(
                          context,
                          MaterialPageRoute(builder: (_) => const ListingsSearchScreen()),
                        );
                      },
                      child: Container(
                        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
                        decoration: BoxDecoration(
                          color: Theme.of(context).cardColor,
                          borderRadius: BorderRadius.circular(14),
                          border: Border.all(color: Colors.grey.shade300),
                        ),
                        child: const Row(
                          children: [
                            Icon(Icons.search, color: Colors.grey),
                            SizedBox(width: 10),
                            Text('Search cars, mobiles, property...', style: TextStyle(color: Colors.grey, fontSize: 14)),
                          ],
                        ),
                      ),
                    ),
                    const SizedBox(height: 20),

                    // Categories Header
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        const Text('Categories', style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
                        TextButton(
                          onPressed: () {
                            Navigator.push(
                              context,
                              MaterialPageRoute(builder: (_) => const CategoriesScreen()),
                            );
                          },
                          child: const Text('See All'),
                        ),
                      ],
                    ),
                    const SizedBox(height: 10),

                    // Categories Dynamic Grid
                    if (_categories.isNotEmpty)
                      GridView.builder(
                        shrinkWrap: true,
                        physics: const NeverScrollableScrollPhysics(),
                        gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                          crossAxisCount: 4,
                          crossAxisSpacing: 8,
                          mainAxisSpacing: 8,
                        ),
                        itemCount: _categories.length > 8 ? 8 : _categories.length,
                        itemBuilder: (context, index) {
                          final cat = _categories[index];
                          return InkWell(
                            onTap: () {
                              Navigator.push(
                                context,
                                MaterialPageRoute(
                                  builder: (_) => ListingsSearchScreen(
                                    initialCategoryId: cat.id,
                                    initialCategoryName: cat.name,
                                  ),
                                ),
                              );
                            },
                            child: Column(
                              mainAxisAlignment: MainAxisAlignment.center,
                              children: [
                                CircleAvatar(
                                  radius: 24,
                                  backgroundColor: AppTheme.primaryLight,
                                  child: Icon(
                                    _getCategoryIcon(cat.name),
                                    color: AppTheme.primaryColor,
                                    size: 22,
                                  ),
                                ),
                                const SizedBox(height: 6),
                                Text(
                                  cat.name,
                                  textAlign: TextAlign.center,
                                  maxLines: 1,
                                  overflow: TextOverflow.ellipsis,
                                  style: const TextStyle(fontSize: 11, fontWeight: FontWeight.w500),
                                ),
                              ],
                            ),
                          );
                        },
                      ),
                    const SizedBox(height: 24),

                    // Featured Listings Section
                    if (_featuredListings.isNotEmpty) ...[
                      const Row(
                        children: [
                          Icon(Icons.star, color: Colors.amber, size: 20),
                          SizedBox(width: 6),
                          Text('Featured Listings', style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
                        ],
                      ),
                      const SizedBox(height: 12),
                      SizedBox(
                        height: 250,
                        child: ListView.builder(
                          scrollDirection: Axis.horizontal,
                          itemCount: _featuredListings.length,
                          itemBuilder: (context, index) {
                            return Container(
                              width: 180,
                              margin: const EdgeInsets.only(right: 12),
                              child: ListingCard(listing: _featuredListings[index]),
                            );
                          },
                        ),
                      ),
                      const SizedBox(height: 24),
                    ],

                    // Recent Listings Header
                    const Text('Recent Listings', style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
                    const SizedBox(height: 12),

                    // Recent Listings Grid
                    GridView.builder(
                      shrinkWrap: true,
                      physics: const NeverScrollableScrollPhysics(),
                      gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                        crossAxisCount: 2,
                        childAspectRatio: 0.72,
                        crossAxisSpacing: 10,
                        mainAxisSpacing: 10,
                      ),
                      itemCount: _recentListings.length,
                      itemBuilder: (context, index) {
                        return ListingCard(listing: _recentListings[index]);
                      },
                    ),
                  ],
                ),
              ),
      ),
    );
  }

  IconData _getCategoryIcon(String name) {
    final n = name.toLowerCase();
    if (n.contains('vehicle') || n.contains('car') || n.contains('auto')) return Icons.directions_car;
    if (n.contains('mobile') || n.contains('phone')) return Icons.smartphone;
    if (n.contains('real estate') || n.contains('property') || n.contains('house')) return Icons.home;
    if (n.contains('electronic') || n.contains('appliance')) return Icons.tv;
    if (n.contains('fashion') || n.contains('cloth')) return Icons.checkroom;
    if (n.contains('job')) return Icons.work;
    if (n.contains('service')) return Icons.build;
    return Icons.category;
  }
}
