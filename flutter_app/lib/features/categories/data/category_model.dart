class CategoryModel {
  final String id;
  final String name;
  final String slug;
  final String? icon;
  final String? parentId;
  final String? description;
  final String? color;
  final int? sortOrder;
  final List<dynamic> attributesSchema;
  final List<CategoryModel> subcategories;

  CategoryModel({
    required this.id,
    required this.name,
    required this.slug,
    this.icon,
    this.parentId,
    this.description,
    this.color,
    this.sortOrder,
    this.attributesSchema = const [],
    this.subcategories = const [],
  });

  factory CategoryModel.fromJson(Map<String, dynamic> json, {List<CategoryModel> subcats = const []}) {
    List<dynamic> schema = [];
    if (json['attributes_schema'] is List) {
      schema = json['attributes_schema'] as List<dynamic>;
    }

    return CategoryModel(
      id: json['id'] ?? '',
      name: json['name'] ?? '',
      slug: json['slug'] ?? '',
      icon: json['icon'],
      parentId: json['parent_id'],
      description: json['description'],
      color: json['color'],
      sortOrder: json['sort_order'],
      attributesSchema: schema,
      subcategories: subcats,
    );
  }
}
