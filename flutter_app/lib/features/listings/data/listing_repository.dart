import 'package:supabase_flutter/supabase_flutter.dart';
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

  /// Advanced Search, Filter & Paginated Query
  Future<List<ListingModel>> searchListings({
    String? queryText,
    String? categoryId,
    String? subcategoryId,
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
        query = query.or('title.ilike.%$queryText%,description.ilike.%$queryText%');
      }

      if (subcategoryId != null && subcategoryId.isNotEmpty) {
        query = query.eq('subcategory_id', subcategoryId);
      } else if (categoryId != null && categoryId.isNotEmpty) {
        query = query.eq('category_id', categoryId);
      }

      if (minPrice != null) {
        query = query.gte('price', minPrice);
      }
      if (maxPrice != null) {
        query = query.lte('price', maxPrice);
      }

      if (condition != null && condition.isNotEmpty) {
        query = query.eq('condition', condition.toLowerCase());
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

  /// Increments views count using Supabase RPC increment_listing_views
  Future<void> incrementViews(String listingId) async {
    try {
      await _client.rpc('increment_listing_views', params: {'listing_id': listingId});
    } catch (_) {}
  }
}
