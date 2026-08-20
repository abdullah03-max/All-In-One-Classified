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
  Map<String, List<ListingModel>> _categoryListings = {};
  bool _isLoading = true;

  @override
  void initState() {
    super.initState();
    _loadHomeData();
  }

  Future<void> _loadHomeData() async {
    setState(() => _isLoading = true);

    try {
      final catsFuture = _categoryRepository.getCategoriesHierarchy();
      final featuredFuture = _listingRepository.getFeaturedListings(limit: 10);
      final recentFuture = _listingRepository.getRecentListings(limit: 30);

      final results = await Future.wait([catsFuture, featuredFuture, recentFuture]);

      final cats = results[0] as List<CategoryModel>;
      final featured = results[1] as List<ListingModel>;
      final recent = results[2] as List<ListingModel>;

      // Group recent listings by Category
      final Map<String, List<ListingModel>> catMap = {};
      for (final listing in recent) {
        final catId = listing.categoryId ?? listing.category?.id;
        if (catId != null && catId.isNotEmpty) {
          catMap.putIfAbsent(catId, () => []).add(listing);
        }
      }

      // Also for main categories that have subcategories, group subcategory listings under parent
      for (final parent in cats) {
        final subIds = parent.subcategories.map((s) => s.id).toSet();
        if (subIds.isNotEmpty) {
          final matching = recent.where((l) {
            final cId = l.categoryId ?? l.category?.id ?? '';
            final subId = l.subcategoryId ?? '';
            return cId == parent.id || subIds.contains(cId) || subIds.contains(subId);
          }).toList();
          if (matching.isNotEmpty) {
            catMap[parent.id] = matching;
          }
        }
      }

      setState(() {
        _categories = cats;
        _featuredListings = featured;
        _recentListings = recent;
        _categoryListings = catMap;
        _isLoading = false;
      });
    } catch (e) {
      print('Load home data error: $e');
      setState(() => _isLoading = false);
    }
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
      // Floating AI button strictly on Home Screen
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

                    // ── CATEGORY-WISE ROWS (ROW BY ROW LIKE WEBSITE) ──
                    ..._categories.map((cat) {
                      final catItems = _categoryListings[cat.id] ?? [];
                      if (catItems.isEmpty) return const SizedBox.shrink();

                      return Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Row(
                            mainAxisAlignment: MainAxisAlignment.spaceBetween,
                            children: [
                              Row(
                                children: [
                                  Icon(_getCategoryIcon(cat.name), color: AppTheme.primaryColor, size: 20),
                                  const SizedBox(width: 8),
                                  Text(
                                    cat.name,
                                    style: const TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
                                  ),
                                ],
                              ),
                              TextButton(
                                onPressed: () {
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
                                child: const Text('View All'),
                              ),
                            ],
                          ),
                          const SizedBox(height: 10),
                          SizedBox(
                            height: 250,
                            child: ListView.builder(
                              scrollDirection: Axis.horizontal,
                              itemCount: catItems.length,
                              itemBuilder: (context, index) {
                                return Container(
                                  width: 180,
                                  margin: const EdgeInsets.only(right: 12),
                                  child: ListingCard(listing: catItems[index]),
                                );
                              },
                            ),
                          ),
                          const SizedBox(height: 24),
                        ],
                      );
                    }),

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
    if (n.contains('mobile') || n.contains('phone') || n.contains('tech')) return Icons.smartphone;
    if (n.contains('bike') || n.contains('motorcycle')) return Icons.two_wheeler;
    if (n.contains('real estate') || n.contains('property') || n.contains('house')) return Icons.home;
    if (n.contains('electronic') || n.contains('appliance')) return Icons.tv;
    if (n.contains('fashion') || n.contains('cloth')) return Icons.checkroom;
    if (n.contains('furniture')) return Icons.chair;
    if (n.contains('animal') || n.contains('pet')) return Icons.pets;
    if (n.contains('job')) return Icons.work;
    if (n.contains('service')) return Icons.build;
    return Icons.category;
  }
}
