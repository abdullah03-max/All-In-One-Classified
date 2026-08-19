import 'package:supabase_flutter/supabase_flutter.dart';
import '../../listings/data/listing_model.dart';

class FavoriteRepository {
  final SupabaseClient _client = Supabase.instance.client;

  /// Fetches saved listings for current user ordered by creation date
  Future<List<ListingModel>> getFavoriteListings(String userId) async {
    try {
      final response = await _client
          .from('bookmarks')
          .select('''
            id,
            created_at,
            listing:listings!bookmarks_listing_id_fkey(
              *,
              category:categories!listings_category_id_fkey(id, name, slug, icon, color),
              seller:users!listings_seller_id_fkey(id, full_name, avatar_url, is_verified, phone, city)
            )
          ''')
          .eq('user_id', userId)
          .order('created_at', ascending: false);

      final List<dynamic> data = response as List<dynamic>;
      final listings = <ListingModel>[];

      for (final item in data) {
        if (item['listing'] != null) {
          final model = ListingModel.fromJson(item['listing']);
          model.isFavorite = true;
          listings.add(model);
        }
      }

      return listings;
    } catch (e) {
      print('Fetch favorites error: $e');
      return [];
    }
  }

  /// Checks if a specific listing is bookmarked by user
  Future<bool> isBookmarked(String userId, String listingId) async {
    try {
      final data = await _client
          .from('bookmarks')
          .select('id')
          .eq('user_id', userId)
          .eq('listing_id', listingId)
          .maybeSingle();

      return data != null;
    } catch (e) {
      return false;
    }
  }

  /// Adds a bookmark
  Future<void> addBookmark(String userId, String listingId) async {
    await _client.from('bookmarks').insert({
      'user_id': userId,
      'listing_id': listingId,
    });
  }

  /// Removes a bookmark
  Future<void> removeBookmark(String userId, String listingId) async {
    await _client
        .from('bookmarks')
        .delete()
        .eq('user_id', userId)
        .eq('listing_id', listingId);
  }

  /// Toggles favorite status in 'bookmarks' table
  Future<bool> toggleFavorite(String userId, String listingId) async {
    final exists = await isBookmarked(userId, listingId);
    if (exists) {
      await removeBookmark(userId, listingId);
      return false;
    } else {
      await addBookmark(userId, listingId);
      return true;
    }
  }
}
