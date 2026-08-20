import 'package:supabase_flutter/supabase_flutter.dart';
import 'category_model.dart';

class CategoryRepository {
  final SupabaseClient _client = Supabase.instance.client;

  /// Fetches top-level parent categories and builds subcategory hierarchy with attribute inheritance
  Future<List<CategoryModel>> getCategoriesHierarchy() async {
    try {
      final response = await _client
          .from('categories')
          .select('*')
          .order('sort_order', ascending: true);

      final List<dynamic> rawData = response as List<dynamic>;
      final allCategories = rawData.map((c) => CategoryModel.fromJson(c)).toList();

      // Separate main categories (parent_id is null)
      final mainCats = allCategories.where((c) => c.parentId == null || c.parentId!.isEmpty).toList();

      // Build 3-level tree (Category -> Subcategory -> Sub-subcategory)
      return mainCats.map((parent) {
        final subcats = allCategories.where((c) => c.parentId == parent.id).map((sub) {
          final subsubcats = allCategories.where((c) => c.parentId == sub.id).map((ss) {
            final ssSchema = ss.attributesSchema.isNotEmpty
                ? ss.attributesSchema
                : (sub.attributesSchema.isNotEmpty ? sub.attributesSchema : parent.attributesSchema);

            return CategoryModel(
              id: ss.id,
              name: ss.name,
              slug: ss.slug,
              icon: ss.icon ?? sub.icon ?? parent.icon,
              parentId: ss.parentId,
              description: ss.description,
              color: ss.color ?? sub.color ?? parent.color,
              sortOrder: ss.sortOrder,
              attributesSchema: ssSchema,
              subcategories: const [],
            );
          }).toList();

          final subSchema = sub.attributesSchema.isNotEmpty ? sub.attributesSchema : parent.attributesSchema;

          return CategoryModel(
            id: sub.id,
            name: sub.name,
            slug: sub.slug,
            icon: sub.icon ?? parent.icon,
            parentId: sub.parentId,
            description: sub.description,
            color: sub.color ?? parent.color,
            sortOrder: sub.sortOrder,
            attributesSchema: subSchema,
            subcategories: subsubcats,
          );
        }).toList();

        return CategoryModel(
          id: parent.id,
          name: parent.name,
          slug: parent.slug,
          icon: parent.icon,
          parentId: parent.parentId,
          description: parent.description,
          color: parent.color,
          sortOrder: parent.sortOrder,
          attributesSchema: parent.attributesSchema,
          subcategories: subcats,
        );
      }).toList();
    } catch (e) {
      print('Category loading error: $e');
      return [];
    }
  }
}
