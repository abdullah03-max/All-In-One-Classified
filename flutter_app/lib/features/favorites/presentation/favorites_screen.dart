import 'dart:async';
import 'package:flutter/material.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import '../../auth/presentation/login_screen.dart';
import '../../listings/data/listing_model.dart';
import '../../listings/presentation/widgets/listing_card.dart';
import '../data/favorite_repository.dart';

class FavoritesScreen extends StatefulWidget {
  const FavoritesScreen({super.key});

  @override
  State<FavoritesScreen> createState() => _FavoritesScreenState();
}

class _FavoritesScreenState extends State<FavoritesScreen> {
  final FavoriteRepository _repository = FavoriteRepository();
  final SupabaseClient _client = Supabase.instance.client;

  List<ListingModel> _favorites = [];
  bool _isLoading = true;
  RealtimeChannel? _realtimeChannel;

  @override
  void initState() {
    super.initState();
    _loadFavorites();
    _subscribeToRealtimeBookmarks();
  }

  @override
  void dispose() {
    _realtimeChannel?.unsubscribe();
    super.dispose();
  }

  Future<void> _loadFavorites() async {
    final user = _client.auth.currentUser;
    if (user == null) {
      setState(() => _isLoading = false);
      return;
    }

    setState(() => _isLoading = true);
    final items = await _repository.getFavoriteListings(user.id);
    if (mounted) {
      setState(() {
        _favorites = items;
        _isLoading = false;
      });
    }
  }

  // Realtime Synchronization across devices (Website <-> Flutter Mobile)
  void _subscribeToRealtimeBookmarks() {
    final user = _client.auth.currentUser;
    if (user == null) return;

    _realtimeChannel = _client
        .channel('public:bookmarks:${user.id}')
        .onPostgresChanges(
          event: PostgresChangeEvent.all,
          schema: 'public',
          table: 'bookmarks',
          filter: PostgresChangeFilter(
            type: PostgresChangeFilterType.eq,
            column: 'user_id',
            value: user.id,
          ),
          callback: (payload) {
            print('Bookmark change detected, reloading favorites...');
            _loadFavorites();
          },
        )
        .subscribe();
  }

  Future<void> _handleFavoriteToggle(ListingModel listing) async {
    final user = _client.auth.currentUser;
    if (user == null) return;

    final newState = await _repository.toggleFavorite(user.id, listing.id);

    setState(() {
      if (!newState) {
        _favorites.removeWhere((item) => item.id == listing.id);
      }
    });

    if (mounted) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(newState ? 'Added to Saved Ads' : 'Removed from Saved Ads'),
          duration: const Duration(seconds: 2),
        ),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    final user = _client.auth.currentUser;

    if (user == null) {
      return Scaffold(
        appBar: AppBar(title: const Text('Saved Ads')),
        body: Center(
          child: Padding(
            padding: const EdgeInsets.all(24.0),
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                const Icon(Icons.favorite_border, size: 60, color: Colors.grey),
                const SizedBox(height: 16),
                const Text('Saved Listings', style: TextStyle(fontSize: 20, fontWeight: FontWeight.bold)),
                const SizedBox(height: 8),
                const Text('Log in to save your favorite ads and sync them across all your devices.', textAlign: TextAlign.center, style: TextStyle(color: Colors.grey)),
                const SizedBox(height: 24),
                ElevatedButton.icon(
                  onPressed: () async {
                    await Navigator.push(
                      context,
                      MaterialPageRoute(builder: (_) => const LoginScreen()),
                    );
                    _loadFavorites();
                  },
                  icon: const Icon(Icons.login),
                  label: const Text('Log In / Register'),
                ),
              ],
            ),
          ),
        ),
      );
    }

    return Scaffold(
      appBar: AppBar(
        title: Text('Saved Ads (${_favorites.length})'),
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh),
            onPressed: _loadFavorites,
          ),
        ],
      ),
      body: RefreshIndicator(
        onRefresh: _loadFavorites,
        child: _isLoading
            ? const Center(child: CircularProgressIndicator())
            : _favorites.isEmpty
                ? const Center(
                    child: Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        Icon(Icons.favorite_border, size: 60, color: Colors.grey),
                        SizedBox(height: 16),
                        Text('No Saved Ads Yet', style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
                        SizedBox(height: 6),
                        Text('Tap the heart icon on any ad to save it for later.', style: TextStyle(color: Colors.grey, fontSize: 13)),
                      ],
                    ),
                  )
                : GridView.builder(
                    padding: const EdgeInsets.all(12),
                    gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                      crossAxisCount: 2,
                      childAspectRatio: 0.72,
                      crossAxisSpacing: 10,
                      mainAxisSpacing: 10,
                    ),
                    itemCount: _favorites.length,
                    itemBuilder: (context, index) {
                      final item = _favorites[index];
                      return ListingCard(
                        listing: item,
                        onFavoriteToggle: () => _handleFavoriteToggle(item),
                      );
                    },
                  ),
      ),
    );
  }
}
