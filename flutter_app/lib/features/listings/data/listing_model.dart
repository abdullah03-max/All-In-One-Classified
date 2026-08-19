import '../../categories/data/category_model.dart';

class SellerModel {
  final String id;
  final String fullName;
  final String? avatarUrl;
  final bool isVerified;
  final String? phone;
  final String? city;

  SellerModel({
    required this.id,
    required this.fullName,
    this.avatarUrl,
    this.isVerified = false,
    this.phone,
    this.city,
  });

  factory SellerModel.fromJson(Map<String, dynamic> json) {
    return SellerModel(
      id: json['id'] ?? '',
      fullName: json['full_name'] ?? 'Seller',
      avatarUrl: json['avatar_url'],
      isVerified: json['is_verified'] ?? false,
      phone: json['phone'],
      city: json['city'],
    );
  }
}

class ListingModel {
  final String id;
  final String title;
  final String description;
  final double price;
  final String currency;
  final String categoryId;
  final String? subcategoryId;
  final String? subSubcategoryId;
  final String sellerId;
  final String status;
  final String condition;
  final List<String> images;
  final String? videoUrl;
  final String location;
  final String city;
  final String country;
  final bool isFeatured;
  final bool isNegotiable;
  final int viewsCount;
  final DateTime createdAt;
  final Map<String, dynamic>? attributes;
  final CategoryModel? category;
  final SellerModel? seller;
  bool isFavorite;

  ListingModel({
    required this.id,
    required this.title,
    required this.description,
    required this.price,
    this.currency = 'PKR',
    required this.categoryId,
    this.subcategoryId,
    this.subSubcategoryId,
    required this.sellerId,
    required this.status,
    required this.condition,
    this.images = const [],
    this.videoUrl,
    required this.location,
    required this.city,
    this.country = 'Pakistan',
    this.isFeatured = false,
    this.isNegotiable = false,
    this.viewsCount = 0,
    required this.createdAt,
    this.attributes,
    this.category,
    this.seller,
    this.isFavorite = false,
  });

  factory ListingModel.fromJson(Map<String, dynamic> json) {
    List<String> parsedImages = [];
    if (json['images'] != null) {
      if (json['images'] is List) {
        parsedImages = List<String>.from(json['images']);
      }
    }

    Map<String, dynamic>? parsedAttributes;
    if (json['attributes'] != null && json['attributes'] is Map) {
      parsedAttributes = Map<String, dynamic>.from(json['attributes']);
    }

    return ListingModel(
      id: json['id'] ?? '',
      title: json['title'] ?? '',
      description: json['description'] ?? '',
      price: (json['price'] ?? 0).toDouble(),
      currency: json['currency'] ?? 'PKR',
      categoryId: json['category_id'] ?? '',
      subcategoryId: json['subcategory_id'],
      subSubcategoryId: json['sub_subcategory_id'],
      sellerId: json['seller_id'] ?? '',
      status: json['status'] ?? 'active',
      condition: json['condition'] ?? 'used',
      images: parsedImages,
      videoUrl: json['video_url'],
      location: json['location'] ?? json['city'] ?? 'Pakistan',
      city: json['city'] ?? 'Lahore',
      country: json['country'] ?? 'Pakistan',
      isFeatured: json['is_featured'] ?? false,
      isNegotiable: json['is_negotiable'] ?? false,
      viewsCount: json['views_count'] ?? 0,
      createdAt: json['created_at'] != null 
          ? DateTime.tryParse(json['created_at']) ?? DateTime.now()
          : DateTime.now(),
      attributes: parsedAttributes,
      category: json['category'] != null ? CategoryModel.fromJson(json['category']) : null,
      seller: json['seller'] != null ? SellerModel.fromJson(json['seller']) : null,
    );
  }
}
