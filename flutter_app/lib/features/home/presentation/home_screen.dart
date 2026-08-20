import 'package:flutter/material.dart';
import '../../../core/theme/app_theme.dart';
import '../../categories/data/category_model.dart';
import '../../categories/data/category_repository.dart';
import '../../categories/presentation/categories_screen.dart';
import '../../categories/presentation/category_listings_screen.dart';
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
  Map<String, List<ListingModel>> _categoryListings = {};
  bool _isLoading = true;
  String _currentCity = 'Pakistan';

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
      final recentFuture = _listingRepository.getRecentListings(limit: 50);

      final results = await Future.wait([catsFuture, featuredFuture, recentFuture]);

      final cats = results[0] as List<CategoryModel>;
      final featured = results[1] as List<ListingModel>;
      final recent = results[2] as List<ListingModel>;

      final Map<String, List<ListingModel>> catMap = {};

      for (final parent in cats) {
        final subIds = parent.subcategories.map((s) => s.id).toSet();
        final subSubIds = <String>{};
        for (final s in parent.subcategories) {
          for (final ss in s.subcategories) {
            subSubIds.add(ss.id);
          }
        }

        final matching = recent.where((l) {
          final cId = l.categoryId ?? l.category?.id ?? '';
          final subId = l.subcategoryId ?? '';
          final subSubId = l.subSubcategoryId ?? '';
          return cId == parent.id ||
              subIds.contains(cId) ||
              subIds.contains(subId) ||
              subSubIds.contains(cId) ||
              subSubIds.contains(subSubId);
        }).toList();

        if (matching.isNotEmpty) {
          catMap[parent.id] = matching;
        }
      }

      if (mounted) {
        setState(() {
          _categories = cats;
          _featuredListings = featured;
          _categoryListings = catMap;
          _isLoading = false;
        });
      }
    } catch (e) {
      print('Load home data error: $e');
      if (mounted) {
        setState(() => _isLoading = false);
      }
    }
  }

  void _navigateToCategory(CategoryModel cat) {
    Navigator.push(
      context,
      MaterialPageRoute(
        builder: (_) => CategoryListingsScreen(category: cat),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;

    return Scaffold(
      appBar: AppBar(
        elevation: 0,
        backgroundColor: isDark ? const Color(0xFF0F172A) : Colors.white,
        title: Row(
          children: [
            Container(
              padding: const EdgeInsets.all(7),
              decoration: BoxDecoration(
                gradient: const LinearGradient(
                  colors: [Color(0xFF3B82F6), Color(0xFF1D4ED8)],
                  begin: Alignment.topLeft,
                  end: Alignment.bottomRight,
                ),
                borderRadius: BorderRadius.circular(12),
                boxShadow: [
                  BoxShadow(
                    color: const Color(0xFF3B82F6).withOpacity(0.3),
                    blurRadius: 8,
                    offset: const Offset(0, 2),
                  ),
                ],
              ),
              child: const Icon(Icons.storefront, color: Colors.white, size: 20),
            ),
            const SizedBox(width: 10),
            Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Text(
                  'All In One',
                  style: TextStyle(fontWeight: FontWeight.w900, fontSize: 18, letterSpacing: -0.5),
                ),
                Row(
                  children: [
                    const Icon(Icons.location_on, size: 11, color: Color(0xFF10B981)),
                    const SizedBox(width: 2),
                    Text(
                      _currentCity,
                      style: const TextStyle(fontSize: 11, color: Colors.grey, fontWeight: FontWeight.w500),
                    ),
                  ],
                ),
              ],
            ),
          ],
        ),
        actions: [
          IconButton(
            icon: const Icon(Icons.auto_awesome, color: Color(0xFF6366F1), size: 22),
            tooltip: 'AI Assistant',
            onPressed: () {
              Navigator.push(
                context,
                MaterialPageRoute(builder: (_) => const AiAssistantScreen()),
              );
            },
          ),
          IconButton(
            icon: const Icon(Icons.notifications_none, size: 22),
            onPressed: () {
              Navigator.push(
                context,
                MaterialPageRoute(builder: (_) => const NotificationsScreen()),
              );
            },
          ),
          const SizedBox(width: 4),
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
        elevation: 6,
        backgroundColor: const Color(0xFF4F46E5),
        icon: const Icon(Icons.auto_awesome, color: Colors.white, size: 18),
        label: const Text(
          'Ask AI',
          style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold, letterSpacing: 0.3),
        ),
      ),
      body: RefreshIndicator(
        onRefresh: _loadHomeData,
        child: _isLoading
            ? const Center(child: CircularProgressIndicator())
            : SingleChildScrollView(
                physics: const AlwaysScrollableScrollPhysics(),
                padding: const EdgeInsets.only(bottom: 40),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    // ── 1. MODERN SEARCH HERO BAR ──
                    Container(
                      margin: const EdgeInsets.fromLTRB(16, 12, 16, 14),
                      child: GestureDetector(
                        onTap: () {
                          Navigator.push(
                            context,
                            MaterialPageRoute(builder: (_) => const ListingsSearchScreen()),
                          );
                        },
                        child: Container(
                          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 13),
                          decoration: BoxDecoration(
                            color: isDark ? const Color(0xFF1E293B) : Colors.white,
                            borderRadius: BorderRadius.circular(16),
                            border: Border.all(
                              color: isDark ? const Color(0xFF334155) : Colors.grey.shade200,
                            ),
                            boxShadow: [
                              BoxShadow(
                                color: Colors.black.withOpacity(isDark ? 0.2 : 0.04),
                                blurRadius: 10,
                                offset: const Offset(0, 4),
                              ),
                            ],
                          ),
                          child: Row(
                            children: [
                              const Icon(Icons.search, color: Color(0xFF3B82F6), size: 22),
                              const SizedBox(width: 12),
                              Expanded(
                                child: Text(
                                  'Find cars, mobiles, laptops, houses...',
                                  style: TextStyle(
                                    color: isDark ? Colors.grey.shade400 : Colors.grey.shade500,
                                    fontSize: 14,
                                    fontWeight: FontWeight.w400,
                                  ),
                                ),
                              ),
                              Container(
                                padding: const EdgeInsets.all(6),
                                decoration: BoxDecoration(
                                  color: const Color(0xFF3B82F6).withOpacity(0.1),
                                  borderRadius: BorderRadius.circular(10),
                                ),
                                child: const Icon(Icons.tune, color: Color(0xFF3B82F6), size: 16),
                              ),
                            ],
                          ),
                        ),
                      ),
                    ),

                    // ── 2. PROMOTIONAL HERO BANNER ──
                    Container(
                      margin: const EdgeInsets.symmetric(horizontal: 16),
                      padding: const EdgeInsets.all(16),
                      decoration: BoxDecoration(
                        gradient: const LinearGradient(
                          colors: [Color(0xFF1E1B4B), Color(0xFF312E81), Color(0xFF4338CA)],
                          begin: Alignment.topLeft,
                          end: Alignment.bottomRight,
                        ),
                        borderRadius: BorderRadius.circular(20),
                        boxShadow: [
                          BoxShadow(
                            color: const Color(0xFF4338CA).withOpacity(0.3),
                            blurRadius: 12,
                            offset: const Offset(0, 4),
                          ),
                        ],
                      ),
                      child: Row(
                        children: [
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Container(
                                  padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                                  decoration: BoxDecoration(
                                    color: const Color(0xFF10B981),
                                    borderRadius: BorderRadius.circular(6),
                                  ),
                                  child: const Text(
                                    '100% FREE CLASSIFIEDS',
                                    style: TextStyle(color: Colors.white, fontSize: 9, fontWeight: FontWeight.w900),
                                  ),
                                ),
                                const SizedBox(height: 6),
                                const Text(
                                  'Buy & Sell Anything Fast',
                                  style: TextStyle(color: Colors.white, fontSize: 16, fontWeight: FontWeight.bold),
                                ),
                                const SizedBox(height: 2),
                                Text(
                                  'Join thousands of verified sellers across Pakistan',
                                  style: TextStyle(color: Colors.white.withOpacity(0.8), fontSize: 11),
                                ),
                              ],
                            ),
                          ),
                          const SizedBox(width: 10),
                          Container(
                            padding: const EdgeInsets.all(12),
                            decoration: BoxDecoration(
                              color: Colors.white.withOpacity(0.15),
                              shape: BoxShape.circle,
                            ),
                            child: const Icon(Icons.rocket_launch, color: Colors.amber, size: 28),
                          ),
                        ],
                      ),
                    ),
                    const SizedBox(height: 22),

                    // ── 3. CATEGORIES EXPLORER ──
                    Padding(
                      padding: const EdgeInsets.symmetric(horizontal: 16),
                      child: Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          const Text(
                            'Explore Categories',
                            style: TextStyle(fontSize: 18, fontWeight: FontWeight.w800),
                          ),
                          TextButton(
                            onPressed: () {
                              Navigator.push(
                                context,
                                MaterialPageRoute(builder: (_) => const CategoriesScreen()),
                              );
                            },
                            child: const Text('See All →', style: TextStyle(fontWeight: FontWeight.w600)),
                          ),
                        ],
                      ),
                    ),
                    const SizedBox(height: 10),

                    // Categories Grid (Modern Cards)
                    if (_categories.isNotEmpty)
                      Padding(
                        padding: const EdgeInsets.symmetric(horizontal: 16),
                        child: GridView.builder(
                          shrinkWrap: true,
                          physics: const NeverScrollableScrollPhysics(),
                          gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                            crossAxisCount: 4,
                            crossAxisSpacing: 10,
                            mainAxisSpacing: 12,
                            childAspectRatio: 0.82,
                          ),
                          itemCount: _categories.length > 8 ? 8 : _categories.length,
                          itemBuilder: (context, index) {
                            final cat = _categories[index];
                            final color = _getCategoryColor(index);

                            return InkWell(
                              onTap: () => _navigateToCategory(cat),
                              borderRadius: BorderRadius.circular(16),
                              child: Column(
                                mainAxisAlignment: MainAxisAlignment.center,
                                children: [
                                  Container(
                                    width: 54,
                                    height: 54,
                                    decoration: BoxDecoration(
                                      color: color.withOpacity(isDark ? 0.2 : 0.12),
                                      borderRadius: BorderRadius.circular(16),
                                      border: Border.all(color: color.withOpacity(0.25), width: 1),
                                    ),
                                    child: Center(
                                      child: Icon(
                                        _getCategoryIcon(cat.name),
                                        color: color,
                                        size: 24,
                                      ),
                                    ),
                                  ),
                                  const SizedBox(height: 6),
                                  Text(
                                    cat.name,
                                    textAlign: TextAlign.center,
                                    maxLines: 2,
                                    overflow: TextOverflow.ellipsis,
                                    style: const TextStyle(
                                      fontSize: 11,
                                      fontWeight: FontWeight.w600,
                                      height: 1.1,
                                    ),
                                  ),
                                ],
                              ),
                            );
                          },
                        ),
                      ),
                    const SizedBox(height: 24),

                    // ── 4. FEATURED & PROMOTED LISTINGS ──
                    if (_featuredListings.isNotEmpty) ...[
                      Padding(
                        padding: const EdgeInsets.symmetric(horizontal: 16),
                        child: Row(
                          children: [
                            Container(
                              padding: const EdgeInsets.all(6),
                              decoration: BoxDecoration(
                                color: Colors.amber.withOpacity(0.15),
                                borderRadius: BorderRadius.circular(8),
                              ),
                              child: const Icon(Icons.star, color: Colors.amber, size: 18),
                            ),
                            const SizedBox(width: 8),
                            const Text(
                              'Featured Listings',
                              style: TextStyle(fontSize: 18, fontWeight: FontWeight.w800),
                            ),
                            const Spacer(),
                            Container(
                              padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                              decoration: BoxDecoration(
                                color: Colors.amber.withOpacity(0.2),
                                borderRadius: BorderRadius.circular(6),
                              ),
                              child: const Text(
                                'SPONSORED',
                                style: TextStyle(fontSize: 9, fontWeight: FontWeight.bold, color: Colors.amber),
                              ),
                            ),
                          ],
                        ),
                      ),
                      const SizedBox(height: 12),
                      SizedBox(
                        height: 250,
                        child: ListView.builder(
                          scrollDirection: Axis.horizontal,
                          padding: const EdgeInsets.symmetric(horizontal: 16),
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
                      const SizedBox(height: 26),
                    ],

                    // ── 5. CATEGORY-WISE LISTINGS (ROW BY ROW) ──
                    ..._categories.map((cat) {
                      final catItems = _categoryListings[cat.id] ?? [];
                      if (catItems.isEmpty) return const SizedBox.shrink();

                      return Container(
                        margin: const EdgeInsets.only(bottom: 24),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Padding(
                              padding: const EdgeInsets.symmetric(horizontal: 16),
                              child: Row(
                                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                children: [
                                  Row(
                                    children: [
                                      Container(
                                        padding: const EdgeInsets.all(6),
                                        decoration: BoxDecoration(
                                          color: AppTheme.primaryColor.withOpacity(0.12),
                                          borderRadius: BorderRadius.circular(8),
                                        ),
                                        child: Icon(
                                          _getCategoryIcon(cat.name),
                                          color: AppTheme.primaryColor,
                                          size: 18,
                                        ),
                                      ),
                                      const SizedBox(width: 8),
                                      Text(
                                        cat.name,
                                        style: const TextStyle(fontSize: 18, fontWeight: FontWeight.w800),
                                      ),
                                    ],
                                  ),
                                  TextButton(
                                    onPressed: () => _navigateToCategory(cat),
                                    child: const Text('View All →', style: TextStyle(fontWeight: FontWeight.bold)),
                                  ),
                                ],
                              ),
                            ),
                            const SizedBox(height: 10),
                            SizedBox(
                              height: 250,
                              child: ListView.builder(
                                scrollDirection: Axis.horizontal,
                                padding: const EdgeInsets.symmetric(horizontal: 16),
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
                          ],
                        ),
                      );
                    }),
                  ],
                ),
              ),
      ),
    );
  }

  Color _getCategoryColor(int index) {
    final colors = [
      const Color(0xFFEF4444),
      const Color(0xFFF97316),
      const Color(0xFF3B82F6),
      const Color(0xFF10B981),
      const Color(0xFF8B5CF6),
      const Color(0xFFEC4899),
      const Color(0xFF06B6D4),
      const Color(0xFFEAB308),
    ];
    return colors[index % colors.length];
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
