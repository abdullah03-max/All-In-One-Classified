import 'package:flutter/material.dart';
import '../../../core/theme/app_theme.dart';
import '../data/category_model.dart';
import '../data/category_repository.dart';
import '../../listings/presentation/listings_search_screen.dart';

class CategoriesScreen extends StatefulWidget {
  const CategoriesScreen({super.key});

  @override
  State<CategoriesScreen> createState() => _CategoriesScreenState();
}

class _CategoriesScreenState extends State<CategoriesScreen> {
  final CategoryRepository _repository = CategoryRepository();
  List<CategoryModel> _categories = [];
  bool _isLoading = true;
  CategoryModel? _selectedCategory;

  @override
  void initState() {
    super.initState();
    _loadCategories();
  }

  Future<void> _loadCategories() async {
    final cats = await _repository.getCategoriesHierarchy();
    setState(() {
      _categories = cats;
      if (cats.isNotEmpty) {
        _selectedCategory = cats.first;
      }
      _isLoading = false;
    });
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('All Categories'),
      ),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator())
          : Row(
              children: [
                // Left Column: Top-Level Parent Categories List
                Container(
                  width: 120,
                  color: Colors.grey.shade100,
                  child: ListView.builder(
                    itemCount: _categories.length,
                    itemBuilder: (context, index) {
                      final cat = _categories[index];
                      final isSelected = _selectedCategory?.id == cat.id;

                      return InkWell(
                        onTap: () => setState(() => _selectedCategory = cat),
                        child: Container(
                          padding: const EdgeInsets.symmetric(vertical: 16, horizontal: 10),
                          decoration: BoxDecoration(
                            color: isSelected ? Colors.white : Colors.transparent,
                            border: Border(
                              left: BorderSide(
                                color: isSelected ? AppTheme.primaryColor : Colors.transparent,
                                width: 4,
                              ),
                            ),
                          ),
                          child: Column(
                            mainAxisAlignment: MainAxisAlignment.center,
                            children: [
                              CircleAvatar(
                                radius: 18,
                                backgroundColor: isSelected ? AppTheme.primaryLight : Colors.grey.shade200,
                                child: Icon(
                                  _getCategoryIcon(cat.name),
                                  size: 18,
                                  color: isSelected ? AppTheme.primaryColor : Colors.grey.shade700,
                                ),
                              ),
                              const SizedBox(height: 6),
                              Text(
                                cat.name,
                                textAlign: TextAlign.center,
                                maxLines: 2,
                                overflow: TextOverflow.ellipsis,
                                style: TextStyle(
                                  fontSize: 11,
                                  fontWeight: isSelected ? FontWeight.bold : FontWeight.normal,
                                  color: isSelected ? AppTheme.primaryColor : Colors.black87,
                                ),
                              ),
                            ],
                          ),
                        ),
                      );
                    },
                  ),
                ),

                // Right Area: Subcategories & Sub-subcategories Explorer
                Expanded(
                  child: _selectedCategory == null
                      ? const SizedBox()
                      : ListView(
                          padding: const EdgeInsets.all(16),
                          children: [
                            // View All In Category Button
                            ElevatedButton.icon(
                              onPressed: () {
                                Navigator.push(
                                  context,
                                  MaterialPageRoute(
                                    builder: (_) => ListingsSearchScreen(
                                      initialCategoryId: _selectedCategory!.id,
                                      initialCategoryName: _selectedCategory!.name,
                                    ),
                                  ),
                                );
                              },
                              icon: const Icon(Icons.grid_view),
                              label: Text('All in ${_selectedCategory!.name}'),
                            ),
                            const SizedBox(height: 16),

                            // Subcategories Expansion List
                            ..._selectedCategory!.subcategories.map((sub) {
                              return ExpansionTile(
                                leading: Icon(_getCategoryIcon(sub.name), color: AppTheme.primaryColor),
                                title: Text(sub.name, style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 14)),
                                children: [
                                  ListTile(
                                    title: Text('All ${sub.name}', style: const TextStyle(color: AppTheme.primaryColor, fontWeight: FontWeight.bold, fontSize: 13)),
                                    onTap: () {
                                      Navigator.push(
                                        context,
                                        MaterialPageRoute(
                                          builder: (_) => ListingsSearchScreen(
                                            initialCategoryId: sub.id,
                                            initialCategoryName: sub.name,
                                          ),
                                        ),
                                      );
                                    },
                                  ),

                                  // Sub-subcategories Items
                                  ...sub.subcategories.map((subsub) {
                                    return ListTile(
                                      contentPadding: const EdgeInsets.only(left: 36, right: 16),
                                      title: Text(subsub.name, style: const TextStyle(fontSize: 13)),
                                      trailing: const Icon(Icons.chevron_right, size: 16, color: Colors.grey),
                                      onTap: () {
                                        Navigator.push(
                                          context,
                                          MaterialPageRoute(
                                            builder: (_) => ListingsSearchScreen(
                                              initialCategoryId: subsub.id,
                                              initialCategoryName: subsub.name,
                                            ),
                                          ),
                                        );
                                      },
                                    );
                                  }).toList(),
                                ],
                              );
                            }).toList(),
                          ],
                        ),
                ),
              ],
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
