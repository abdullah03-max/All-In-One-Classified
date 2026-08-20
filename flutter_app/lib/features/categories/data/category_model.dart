class CategoryCustomField {
  final String name;
  final String label;
  final String type; // select, text, number, checkbox, radio
  final bool required;
  final List<String> options;

  CategoryCustomField({
    required this.name,
    required this.label,
    required this.type,
    this.required = false,
    this.options = const [],
  });

  factory CategoryCustomField.fromJson(Map<String, dynamic> json) {
    List<String> opts = [];
    if (json['options'] is List) {
      opts = (json['options'] as List).map((e) => e.toString()).toList();
    }

    return CategoryCustomField(
      name: json['name']?.toString() ?? '',
      label: json['label']?.toString() ?? json['name']?.toString() ?? '',
      type: json['type']?.toString().toLowerCase() ?? 'text',
      required: json['required'] == true,
      options: opts,
    );
  }
}

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

  /// Checks if Price is enabled for this category. Defaults to true unless explicitly disabled.
  bool get isPriceEnabled {
    if (attributesSchema.isEmpty) return true;
    for (final field in attributesSchema) {
      if (field is Map) {
        if (field['_type'] == '__category_config__' && field['price_enabled'] is bool) {
          return field['price_enabled'] as bool;
        }
        if (field['price_enabled'] == false) {
          return false;
        }
      }
    }
    return true;
  }

  /// Extracts condition option style: 'full' (New, Used, Refurbished, Open Box) or 'simple' (New, Used) or null
  String? get conditionType {
    for (final field in attributesSchema) {
      if (field is Map) {
        final stdId = field['standardId'] ?? field['name'];
        if (stdId == 'condition_full') return 'full';
        if (stdId == 'condition_simple') return 'simple';
      }
    }
    return 'full'; // Default fallback
  }

  /// Checks if animal sex (Male, Female, Pair) is enabled
  bool get hasAnimalSex {
    for (final field in attributesSchema) {
      if (field is Map) {
        final stdId = field['standardId'] ?? field['name'];
        if (stdId == 'animal_sex') return true;
      }
    }
    return false;
  }

  /// Checks if human gender (Male, Female, Other) is enabled
  bool get hasHumanGender {
    for (final field in attributesSchema) {
      if (field is Map) {
        final stdId = field['standardId'] ?? field['name'];
        if (stdId == 'human_gender') return true;
      }
    }
    return false;
  }

  /// Extracts clean custom attributes list (excluding standard & config headers)
  List<CategoryCustomField> get customFields {
    final List<CategoryCustomField> list = [];
    for (final field in attributesSchema) {
      if (field is Map) {
        if (field['_type'] == '__category_config__' || field['name'] == '__price_config__') {
          continue;
        }
        if (field['isStandard'] == true || field['is_standard'] == true) {
          continue;
        }
        final stdId = field['standardId'] ?? field['name'];
        if (stdId == 'condition_full' || stdId == 'condition_simple' || stdId == 'animal_sex' || stdId == 'human_gender') {
          continue;
        }

        list.add(CategoryCustomField.fromJson(Map<String, dynamic>.from(field)));
      }
    }
    return list;
  }
}
