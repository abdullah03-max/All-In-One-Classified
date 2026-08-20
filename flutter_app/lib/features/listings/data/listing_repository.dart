import 'package:flutter/foundation.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'listing_model.dart';

class ListingRepository {
  final SupabaseClient _client = Supabase.instance.client;

  /// Fetches featured/promoted listings (`is_featured = true`)
  Future<List<ListingModel>> getFeaturedListings({int limit = 10}) async {
    try {
      final response = await _client
          .from('listings')
          .select('''
            *,
            category:categories!listings_category_id_fkey(id, name, slug, icon, color),
            seller:users!listings_seller_id_fkey(id, full_name, avatar_url, is_verified, phone, city)
          ''')
          .eq('status', 'active')
          .eq('is_featured', true)
          .order('created_at', ascending: false)
          .limit(limit);

      final List<dynamic> data = response as List<dynamic>;
      return data.map((json) => ListingModel.fromJson(json)).toList();
    } catch (e) {
      print('Fetch featured listings error: $e');
      return [];
    }
  }

  /// Fetches recent active listings
  Future<List<ListingModel>> getRecentListings({int limit = 20}) async {
    try {
      final response = await _client
          .from('listings')
          .select('''
            *,
            category:categories!listings_category_id_fkey(id, name, slug, icon, color),
            seller:users!listings_seller_id_fkey(id, full_name, avatar_url, is_verified, phone, city)
          ''')
          .eq('status', 'active')
          .order('created_at', ascending: false)
          .limit(limit);

      final List<dynamic> data = response as List<dynamic>;
      return data.map((json) => ListingModel.fromJson(json)).toList();
    } catch (e) {
      print('Fetch recent listings error: $e');
      return [];
    }
  }

  /// Fetches listings by category ID (or subcategory) for category rows on Home
  Future<List<ListingModel>> getListingsByCategory(String categoryId, {List<String> subcategoryIds = const [], int limit = 10}) async {
    try {
      final allIds = [categoryId, ...subcategoryIds];
      final idList = allIds.join(',');

      final response = await _client
          .from('listings')
          .select('''
            *,
            category:categories!listings_category_id_fkey(id, name, slug, icon, color),
            seller:users!listings_seller_id_fkey(id, full_name, avatar_url, is_verified, phone, city)
          ''')
          .eq('status', 'active')
          .or('category_id.in.($idList),subcategory_id.in.($idList)')
          .order('created_at', ascending: false)
          .limit(limit);

      final List<dynamic> data = response as List<dynamic>;
      return data.map((json) => ListingModel.fromJson(json)).toList();
    } catch (e) {
      print('Fetch category listings error: $e');
      return [];
    }
  }

  /// Fetches complete category tree listings with dynamic attribute and subcategory filters
  Future<List<ListingModel>> getCategoryTreeListings({
    required String categoryId,
    List<String> subcategoryIds = const [],
    String? selectedSubcategoryId,
    String? selectedSubSubcategoryId,
    String? queryText,
    String? city,
    String? condition,
    double? minPrice,
    double? maxPrice,
    Map<String, dynamic>? customFilters,
    String sortBy = 'created_at_desc',
    int page = 1,
    int pageSize = 30,
  }) async {
    try {
      dynamic query = _client.from('listings').select('''
        *,
        category:categories!listings_category_id_fkey(id, name, slug, icon, color),
        seller:users!listings_seller_id_fkey(id, full_name, avatar_url, is_verified, phone, city)
      ''').eq('status', 'active');

      // Category hierarchy matching
      if (selectedSubSubcategoryId != null && selectedSubSubcategoryId.isNotEmpty) {
        query = query.eq('sub_subcategory_id', selectedSubSubcategoryId);
      } else if (selectedSubcategoryId != null && selectedSubcategoryId.isNotEmpty) {
        query = query.eq('subcategory_id', selectedSubcategoryId);
      } else {
        final allIds = [categoryId, ...subcategoryIds];
        final idList = allIds.join(',');
        query = query.or('category_id.in.($idList),subcategory_id.in.($idList)');
      }

      if (queryText != null && queryText.trim().isNotEmpty) {
        final q = queryText.trim();
        query = query.or('title.ilike.%$q%,description.ilike.%$q%,city.ilike.%$q%');
      }

      if (city != null && city.isNotEmpty && city != 'All Cities') {
        query = query.ilike('city', '%$city%');
      }

      if (condition != null && condition.isNotEmpty) {
        final mapped = mapConditionToDb(condition);
        query = query.eq('condition', mapped);
      }

      if (minPrice != null) query = query.gte('price', minPrice);
      if (maxPrice != null) query = query.lte('price', maxPrice);

      // Sorting
      if (sortBy == 'price_asc') {
        query = query.order('price', ascending: true);
      } else if (sortBy == 'price_desc') {
        query = query.order('price', ascending: false);
      } else if (sortBy == 'views') {
        query = query.order('views_count', ascending: false);
      } else {
        query = query.order('created_at', ascending: false);
      }

      // Pagination
      final from = (page - 1) * pageSize;
      final to = from + pageSize - 1;
      query = query.range(from, to);

      final response = await query;
      final List<dynamic> data = response as List<dynamic>;
      var list = data.map((json) => ListingModel.fromJson(json)).toList();

      // In-memory dynamic custom attribute filtering (Brand, PTA Status, RAM, Storage, Make, Year, Transmission, etc.)
      if (customFilters != null && customFilters.isNotEmpty) {
        list = list.where((item) {
          if (item.attributes == null) return false;
          final attrs = item.attributes!;
          for (final entry in customFilters.entries) {
            final key = entry.key;
            final val = entry.value;
            if (val == null || val.toString().trim().isEmpty) continue;
            final itemVal = attrs[key]?.toString().toLowerCase() ?? '';
            if (!itemVal.contains(val.toString().toLowerCase())) {
              return false;
            }
          }
          return true;
        }).toList();
      }

      return list;
    } catch (e) {
      print('getCategoryTreeListings error: $e');
      return [];
    }
  }

  /// Advanced Search, Filter & Paginated Query
  Future<List<ListingModel>> searchListings({
    String? queryText,
    String? categoryId,
    String? subcategoryId,
    String? subSubcategoryId,
    double? minPrice,
    double? maxPrice,
    String? condition,
    String? city,
    String sortBy = 'created_at_desc',
    int page = 1,
    int pageSize = 20,
  }) async {
    try {
      dynamic query = _client.from('listings').select('''
        *,
        category:categories!listings_category_id_fkey(id, name, slug, icon, color),
        seller:users!listings_seller_id_fkey(id, full_name, avatar_url, is_verified, phone, city)
      ''').eq('status', 'active');

      if (queryText != null && queryText.trim().isNotEmpty) {
        final q = queryText.trim();
        query = query.or('title.ilike.%$q%,description.ilike.%$q%,city.ilike.%$q%');
      }

      if (subSubcategoryId != null && subSubcategoryId.isNotEmpty) {
        query = query.eq('sub_subcategory_id', subSubcategoryId);
      } else if (subcategoryId != null && subcategoryId.isNotEmpty) {
        query = query.eq('subcategory_id', subcategoryId);
      } else if (categoryId != null && categoryId.isNotEmpty) {
        query = query.or('category_id.eq.$categoryId,subcategory_id.eq.$categoryId');
      }

      if (minPrice != null) {
        query = query.gte('price', minPrice);
      }
      if (maxPrice != null) {
        query = query.lte('price', maxPrice);
      }

      if (condition != null && condition.isNotEmpty) {
        final mapped = mapConditionToDb(condition);
        query = query.eq('condition', mapped);
      }

      if (city != null && city.isNotEmpty) {
        query = query.ilike('city', '%$city%');
      }

      // Sorting
      if (sortBy == 'price_asc') {
        query = query.order('price', ascending: true);
      } else if (sortBy == 'price_desc') {
        query = query.order('price', ascending: false);
      } else if (sortBy == 'views') {
        query = query.order('views_count', ascending: false);
      } else {
        query = query.order('created_at', ascending: false);
      }

      // Pagination
      final from = (page - 1) * pageSize;
      final to = from + pageSize - 1;
      query = query.range(from, to);

      final response = await query;
      final List<dynamic> data = response as List<dynamic>;
      return data.map((json) => ListingModel.fromJson(json)).toList();
    } catch (e) {
      print('Search listings error: $e');
      return [];
    }
  }

  /// Map UI condition string to Postgres listing_condition enum
  static String mapConditionToDb(String input) {
    final lower = input.toLowerCase().replaceAll(' ', '_');
    if (lower == 'new') return 'new';
    if (lower == 'open_box' || lower == 'like_new' || lower == 'brand_new') return 'like_new';
    if (lower == 'used' || lower == 'good' || lower == 'excellent') return 'good';
    if (lower == 'refurbished' || lower == 'fair') return 'fair';
    if (lower == 'for_parts' || lower == 'poor' || lower == 'parts') return 'poor';
    return 'good';
  }

  /// Records a unique ad view using Supabase RPC increment_view_count with per-user/device deduplication
  Future<bool> recordUniqueView(String listingId, {String? sellerId}) async {
    try {
      final user = _client.auth.currentUser;
      final userId = user?.id;

      // Do not count seller's own views
      if (userId != null && sellerId != null && userId == sellerId) {
        return false;
      }

      final prefs = await SharedPreferences.getInstance();
      final cacheKey = 'viewed_listings_${userId ?? "guest"}';
      final viewedList = prefs.getStringList(cacheKey) ?? [];

      if (viewedList.contains(listingId)) {
        // Already viewed by this account/device
        return false;
      }

      // Add to local viewed cache
      viewedList.add(listingId);
      if (viewedList.length > 500) {
        viewedList.removeRange(0, viewedList.length - 500);
      }
      await prefs.setStringList(cacheKey, viewedList);

      // Call Supabase RPC increment_view_count
      await _client.rpc('increment_view_count', params: {'listing_id': listingId});
      debugPrint('[ViewTracker] Unique view recorded for listing: $listingId');
      return true;
    } catch (e) {
      debugPrint('[ViewTracker] Error recording view: $e');
      return false;
    }
  }

  /// Increments views count
  Future<void> incrementViews(String listingId, {String? sellerId}) async {
    await recordUniqueView(listingId, sellerId: sellerId);
  }
}
