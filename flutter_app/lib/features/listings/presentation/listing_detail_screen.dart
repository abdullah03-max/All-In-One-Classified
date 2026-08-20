import 'package:flutter/material.dart';
import 'package:cached_network_image/cached_network_image.dart';
import 'package:intl/intl.dart';
import 'package:url_launcher/url_launcher.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import '../../../core/theme/app_theme.dart';
import '../../auth/presentation/login_screen.dart';
import '../../chat/data/chat_repository.dart';
import '../../chat/presentation/chat_room_screen.dart';
import '../../favorites/data/favorite_repository.dart';
import '../../location/presentation/listing_map_view.dart';
import '../data/listing_model.dart';
import '../data/listing_repository.dart';
import 'widgets/full_screen_image_viewer.dart';
import 'widgets/report_listing_dialog.dart';

class ListingDetailScreen extends StatefulWidget {
  final ListingModel listing;

  const ListingDetailScreen({super.key, required this.listing});

  @override
  State<ListingDetailScreen> createState() => _ListingDetailScreenState();
}

class _ListingDetailScreenState extends State<ListingDetailScreen> {
  static const Set<String> _ignoredAttributeKeys = {
    'virtual_category_id',
    'virtual_subcategory_id',
    'virtual_sub_subcategory_id',
    'subcategory_name',
    'sub_subcategory_name',
    'category_name',
    'contact_name',
    'show_phone',
    'category_id',
    'subcategory_id',
    'sub_subcategory_id',
    'id',
  };

  int _currentImageIndex = 0;
  bool _isFavorite = false;
  bool _isStartingChat = false;
  late int _viewsCount;
  final ListingRepository _listingRepository = ListingRepository();
  final FavoriteRepository _favoriteRepository = FavoriteRepository();
  final ChatRepository _chatRepository = ChatRepository();

  @override
  void initState() {
    super.initState();
    _isFavorite = widget.listing.isFavorite;
    _viewsCount = widget.listing.viewsCount;
    _recordView();
  }

  void _recordView() async {
    final recorded = await _listingRepository.recordUniqueView(
      widget.listing.id,
      sellerId: widget.listing.sellerId,
    );
    if (recorded && mounted) {
      setState(() {
        _viewsCount++;
      });
    }
  }

  void _toggleFavorite() async {
    final user = Supabase.instance.client.auth.currentUser;
    if (user == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Please log in to save listings.')),
      );
      return;
    }

    setState(() => _isFavorite = !_isFavorite);
    final newState = await _favoriteRepository.toggleFavorite(user.id, widget.listing.id);
    setState(() => _isFavorite = newState);
  }

  void _callSeller() async {
    final phone = widget.listing.seller?.phone;
    if (phone != null && phone.trim().isNotEmpty) {
      final Uri launchUri = Uri(scheme: 'tel', path: phone.trim());
      await launchUrl(launchUri);
    } else {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Seller phone number is not available.')),
      );
    }
  }

  void _startChatWithSeller() async {
    final user = Supabase.instance.client.auth.currentUser;
    if (user == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Please log in to chat with the seller.')),
      );
      await Navigator.push(
        context,
        MaterialPageRoute(builder: (_) => const LoginScreen()),
      );
      return;
    }

    if (user.id == widget.listing.sellerId) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('You cannot message yourself on your own listing.')),
      );
      return;
    }

    setState(() => _isStartingChat = true);

    final convId = await _chatRepository.getOrCreateConversation(
      widget.listing.id,
      user.id,
      widget.listing.sellerId,
    );

    if (mounted) {
      setState(() => _isStartingChat = false);

      if (convId != null && convId.isNotEmpty) {
        Navigator.push(
          context,
          MaterialPageRoute(
            builder: (_) => ChatRoomScreen(
              conversationId: convId,
              otherUserId: widget.listing.sellerId,
              listingTitle: widget.listing.title,
              otherUserName: widget.listing.seller?.fullName ?? 'Seller',
              otherUserAvatarUrl: widget.listing.seller?.avatarUrl,
              listing: widget.listing,
              listingImage: widget.listing.images.isNotEmpty ? widget.listing.images[0] : null,
              listingPrice: widget.listing.price,
            ),
          ),
        );
      } else {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Failed to initiate conversation. Please try again.')),
        );
      }
    }
  }

  void _openReportDialog() {
    showDialog(
      context: context,
      builder: (_) => ReportListingDialog(listingId: widget.listing.id),
    );
  }

  void _openFullScreenViewer(int initialIndex) {
    if (widget.listing.images.isEmpty) return;
    Navigator.push(
      context,
      MaterialPageRoute(
        builder: (_) => FullScreenImageViewer(
          images: widget.listing.images,
          initialIndex: initialIndex,
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final listing = widget.listing;
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final currencyFormatter = NumberFormat.currency(symbol: 'PKR ', decimalDigits: 0);
    final dateFormatter = DateFormat('MMM dd, yyyy');

    final textColor = isDark ? Colors.white : const Color(0xFF0F172A);
    final secondaryTextColor = isDark ? const Color(0xFF94A3B8) : const Color(0xFF64748B);
    final bodyTextColor = isDark ? const Color(0xFFCBD5E1) : const Color(0xFF334155);
    final cardBgColor = isDark ? const Color(0xFF1E293B) : Colors.white;
    final borderColor = isDark ? const Color(0xFF334155) : const Color(0xFFE2E8F0);
    final priceColor = isDark ? const Color(0xFF60A5FA) : const Color(0xFF1D4ED8);

    return Scaffold(
      appBar: AppBar(
        title: const Text('Listing Details'),
        actions: [
          IconButton(
            icon: Icon(
              _isFavorite ? Icons.favorite : Icons.favorite_border,
              color: _isFavorite ? Colors.redAccent : null,
            ),
            onPressed: _toggleFavorite,
          ),
          IconButton(
            icon: const Icon(Icons.flag_outlined, color: Colors.amber),
            tooltip: 'Report Listing',
            onPressed: _openReportDialog,
          ),
        ],
      ),
      body: SingleChildScrollView(
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // ── Interactive Image Slider Gallery ──
            if (listing.images.isNotEmpty)
              Stack(
                children: [
                  SizedBox(
                    height: 300,
                    child: PageView.builder(
                      itemCount: listing.images.length,
                      onPageChanged: (idx) => setState(() => _currentImageIndex = idx),
                      itemBuilder: (context, index) {
                        return GestureDetector(
                          onTap: () => _openFullScreenViewer(index),
                          child: CachedNetworkImage(
                            imageUrl: listing.images[index],
                            fit: BoxFit.cover,
                            placeholder: (_, __) => Container(color: isDark ? const Color(0xFF1E293B) : Colors.grey.shade200),
                            errorWidget: (_, __, ___) => Container(
                              color: isDark ? const Color(0xFF1E293B) : Colors.grey.shade200,
                              child: const Icon(Icons.image_not_supported, size: 50),
                            ),
                          ),
                        );
                      },
                    ),
                  ),

                  // Zoom Hint Badge
                  Positioned(
                    top: 12,
                    right: 12,
                    child: Container(
                      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                      decoration: BoxDecoration(
                        color: Colors.black.withOpacity(0.65),
                        borderRadius: BorderRadius.circular(12),
                      ),
                      child: const Row(
                        children: [
                          Icon(Icons.zoom_in, color: Colors.white, size: 14),
                          SizedBox(width: 4),
                          Text('Tap to zoom', style: TextStyle(color: Colors.white, fontSize: 11)),
                        ],
                      ),
                    ),
                  ),

                  // Image Counter Indicator Badge
                  Positioned(
                    bottom: 12,
                    right: 12,
                    child: Container(
                      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                      decoration: BoxDecoration(
                        color: Colors.black.withOpacity(0.75),
                        borderRadius: BorderRadius.circular(12),
                      ),
                      child: Text(
                        '${_currentImageIndex + 1} / ${listing.images.length}',
                        style: const TextStyle(color: Colors.white, fontSize: 12, fontWeight: FontWeight.bold),
                      ),
                    ),
                  ),
                ],
              )
            else
              Container(
                height: 200,
                color: isDark ? const Color(0xFF1E293B) : Colors.grey.shade200,
                child: Center(child: Icon(Icons.image, size: 60, color: secondaryTextColor)),
              ),

            // ── Content Body Container ──
            Padding(
              padding: const EdgeInsets.all(16.0),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  // Featured Badge
                  if (listing.isFeatured) ...[
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                      decoration: BoxDecoration(
                        gradient: const LinearGradient(colors: [Color(0xFFF59E0B), Color(0xFFD97706)]),
                        borderRadius: BorderRadius.circular(6),
                      ),
                      child: const Text(
                        '⭐ FEATURED LISTING',
                        style: TextStyle(color: Colors.white, fontSize: 11, fontWeight: FontWeight.bold),
                      ),
                    ),
                    const SizedBox(height: 8),
                  ],

                  // Video Preview Banner
                  if (listing.videoUrl != null && listing.videoUrl!.isNotEmpty) ...[
                    InkWell(
                      onTap: () async {
                        final uri = Uri.parse(listing.videoUrl!);
                        if (await canLaunchUrl(uri)) {
                          await launchUrl(uri, mode: LaunchMode.externalApplication);
                        }
                      },
                      borderRadius: BorderRadius.circular(12),
                      child: Container(
                        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
                        margin: const EdgeInsets.only(bottom: 12),
                        decoration: BoxDecoration(
                          color: const Color(0xFF10B981).withOpacity(0.12),
                          borderRadius: BorderRadius.circular(12),
                          border: Border.all(color: const Color(0xFF10B981).withOpacity(0.35)),
                        ),
                        child: const Row(
                          children: [
                            Icon(Icons.play_circle_fill, color: Color(0xFF10B981), size: 28),
                            SizedBox(width: 10),
                            Expanded(
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Text('Watch Product Video', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 13)),
                                  Text('Tap to open video preview', style: TextStyle(fontSize: 11, color: Colors.grey)),
                                ],
                              ),
                            ),
                            Icon(Icons.open_in_new, size: 16, color: Color(0xFF10B981)),
                          ],
                        ),
                      ),
                    ),
                  ],

                  // Price (Only for priced categories, hide PKR 0 for Jobs/Services)
                  if (listing.price > 0 &&
                      (listing.category == null ||
                          (listing.category!.isPriceEnabled &&
                              !listing.category!.name.toLowerCase().contains('job') &&
                              !listing.category!.name.toLowerCase().contains('service')))) ...[
                    Text(
                      currencyFormatter.format(listing.price),
                      style: TextStyle(
                        fontSize: 26,
                        fontWeight: FontWeight.w800,
                        color: priceColor,
                      ),
                    ),
                    const SizedBox(height: 6),
                  ] else if (listing.category != null &&
                      (listing.category!.name.toLowerCase().contains('job') ||
                          listing.category!.name.toLowerCase().contains('service'))) ...[
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                      decoration: BoxDecoration(
                        color: const Color(0xFF10B981).withOpacity(0.12),
                        borderRadius: BorderRadius.circular(8),
                      ),
                      child: const Text(
                        'Apply / Contact for Details',
                        style: TextStyle(
                          color: Color(0xFF10B981),
                          fontSize: 14,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                    ),
                    const SizedBox(height: 6),
                  ],

                  // Title
                  Text(
                    listing.title,
                    style: TextStyle(
                      fontSize: 19,
                      fontWeight: FontWeight.bold,
                      height: 1.3,
                      color: textColor,
                    ),
                  ),
                  const SizedBox(height: 14),

                  // Metadata Badges Wrap (Condition, City, Views, Date)
                  Wrap(
                    spacing: 8,
                    runSpacing: 8,
                    children: [
                      if (listing.category == null ||
                          (!listing.category!.name.toLowerCase().contains('job') &&
                              !listing.category!.name.toLowerCase().contains('service')))
                        _buildMetaChip(context, Icons.info_outline, 'Condition: ${listing.condition.toUpperCase()}'),
                      _buildMetaChip(context, Icons.location_on_outlined, listing.city),
                      _buildMetaChip(context, Icons.remove_red_eye_outlined, '$_viewsCount views'),
                      _buildMetaChip(context, Icons.calendar_today_outlined, dateFormatter.format(listing.createdAt)),
                    ],
                  ),
                  const SizedBox(height: 20),
                  Divider(color: borderColor),
                  const SizedBox(height: 16),

                  // Full Description
                  Text(
                    'Description',
                    style: TextStyle(fontSize: 17, fontWeight: FontWeight.bold, color: textColor),
                  ),
                  const SizedBox(height: 8),
                  Text(
                    listing.description,
                    style: TextStyle(
                      fontSize: 14.5,
                      height: 1.6,
                      color: bodyTextColor,
                    ),
                  ),
                  const SizedBox(height: 20),
                  Divider(color: borderColor),
                  const SizedBox(height: 16),

                  // Specifications & Attributes Section
                  Text(
                    'Specifications',
                    style: TextStyle(fontSize: 17, fontWeight: FontWeight.bold, color: textColor),
                  ),
                  const SizedBox(height: 12),
                  Container(
                    decoration: BoxDecoration(
                      color: cardBgColor,
                      borderRadius: BorderRadius.circular(12),
                      border: Border.all(color: borderColor),
                    ),
                    child: Column(
                      children: [
                        _buildSpecRow(context, 'Condition', listing.condition.toUpperCase(), isDark),
                        _buildSpecRow(context, 'City / Location', listing.city, isDark),
                        _buildSpecRow(context, 'Negotiable', listing.isNegotiable ? 'Yes' : 'No', isDark),
                        _buildSpecRow(context, 'Date Listed', dateFormatter.format(listing.createdAt), isDark),
                        // Dynamic category attributes (filtering internal/virtual IDs)
                        if (listing.attributes != null && listing.attributes is Map)
                          ...(listing.attributes as Map).entries.where((e) {
                            final rawKey = e.key.toString().toLowerCase().trim();
                            if (_ignoredAttributeKeys.contains(rawKey)) return false;
                            if (rawKey.contains('category') || rawKey.contains('virtual_')) return false;
                            final val = e.value?.toString().trim() ?? '';
                            return val.isNotEmpty && val != 'null';
                          }).map((e) {
                            final key = e.key
                                .toString()
                                .replaceAll('_', ' ')
                                .replaceAll('-', ' ')
                                .toUpperCase();
                            final val = e.value.toString();
                            return _buildSpecRow(context, key, val, isDark);
                          }),
                      ],
                    ),
                  ),
                  const SizedBox(height: 20),
                  Divider(color: borderColor),
                  const SizedBox(height: 16),

                  // Location Map View
                  Text(
                    'Item Location',
                    style: TextStyle(fontSize: 17, fontWeight: FontWeight.bold, color: textColor),
                  ),
                  const SizedBox(height: 12),
                  ListingMapView(city: listing.city, location: listing.location),
                  const SizedBox(height: 20),
                  Divider(color: borderColor),
                  const SizedBox(height: 16),

                  // Seller Profile Information Card
                  Text(
                    'Seller Information',
                    style: TextStyle(fontSize: 17, fontWeight: FontWeight.bold, color: textColor),
                  ),
                  const SizedBox(height: 12),
                  Container(
                    padding: const EdgeInsets.all(14.0),
                    decoration: BoxDecoration(
                      color: cardBgColor,
                      borderRadius: BorderRadius.circular(12),
                      border: Border.all(color: borderColor),
                    ),
                    child: Row(
                      children: [
                        if (listing.seller?.avatarUrl != null && listing.seller!.avatarUrl!.trim().isNotEmpty)
                          CircleAvatar(
                            radius: 26,
                            backgroundColor: AppTheme.primaryLight,
                            child: ClipOval(
                              child: CachedNetworkImage(
                                imageUrl: listing.seller!.avatarUrl!,
                                width: 52,
                                height: 52,
                                fit: BoxFit.cover,
                                placeholder: (_, __) => const CircularProgressIndicator(strokeWidth: 2),
                                errorWidget: (_, __, ___) => Text(
                                  (listing.seller?.fullName ?? 'S')[0].toUpperCase(),
                                  style: const TextStyle(fontSize: 20, fontWeight: FontWeight.bold, color: AppTheme.primaryColor),
                                ),
                              ),
                            ),
                          )
                        else
                          CircleAvatar(
                            radius: 26,
                            backgroundColor: AppTheme.primaryLight,
                            child: Text(
                              (listing.seller?.fullName ?? 'S')[0].toUpperCase(),
                              style: const TextStyle(fontSize: 20, fontWeight: FontWeight.bold, color: AppTheme.primaryColor),
                            ),
                          ),
                        const SizedBox(width: 14),
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Row(
                                children: [
                                  Flexible(
                                    child: Text(
                                      listing.seller?.fullName ?? 'Verified Seller',
                                      style: TextStyle(fontWeight: FontWeight.bold, fontSize: 15, color: textColor),
                                      overflow: TextOverflow.ellipsis,
                                    ),
                                  ),
                                  if (listing.seller?.isVerified == true) ...[
                                    const SizedBox(width: 6),
                                    const Icon(Icons.verified, size: 16, color: Colors.blue),
                                  ],
                                ],
                              ),
                              const SizedBox(height: 2),
                              Text(
                                listing.seller?.city ?? listing.city,
                                style: TextStyle(color: secondaryTextColor, fontSize: 12),
                              ),
                            ],
                          ),
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(height: 16),

                  // Safety Tip Banner
                  Container(
                    padding: const EdgeInsets.all(12),
                    decoration: BoxDecoration(
                      color: const Color(0xFF10B981).withOpacity(0.08),
                      borderRadius: BorderRadius.circular(12),
                      border: Border.all(color: const Color(0xFF10B981).withOpacity(0.25)),
                    ),
                    child: const Row(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Icon(Icons.gpp_good, color: Color(0xFF10B981), size: 20),
                        SizedBox(width: 10),
                        Expanded(
                          child: Text(
                            'Safety Tip: Always meet the seller in a busy public location. Inspect the product before handing over payment.',
                            style: TextStyle(fontSize: 11.5, color: Colors.grey, height: 1.4),
                          ),
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(height: 14),

                  // Report This Ad Button
                  InkWell(
                    onTap: _openReportDialog,
                    borderRadius: BorderRadius.circular(12),
                    child: Container(
                      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
                      decoration: BoxDecoration(
                        color: Colors.redAccent.withOpacity(0.06),
                        borderRadius: BorderRadius.circular(12),
                        border: Border.all(color: Colors.redAccent.withOpacity(0.2)),
                      ),
                      child: const Row(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          Icon(Icons.flag_outlined, color: Colors.redAccent, size: 18),
                          SizedBox(width: 8),
                          Text(
                            'Report this Ad (Scam, Fake, Sold)',
                            style: TextStyle(
                              color: Colors.redAccent,
                              fontSize: 13,
                              fontWeight: FontWeight.bold,
                            ),
                          ),
                        ],
                      ),
                    ),
                  ),
                  const SizedBox(height: 24),
                ],
              ),
            ),
          ],
        ),
      ),

      // ── Fixed Bottom Navigation Container for Action Buttons ──
      bottomNavigationBar: Container(
        decoration: BoxDecoration(
          color: cardBgColor,
          border: Border(top: BorderSide(color: borderColor)),
          boxShadow: [
            BoxShadow(
              color: Colors.black.withOpacity(isDark ? 0.3 : 0.06),
              blurRadius: 10,
              offset: const Offset(0, -3),
            ),
          ],
        ),
        child: SafeArea(
          child: Padding(
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
            child: Row(
              children: [
                // Call Seller Button
                Expanded(
                  child: ElevatedButton.icon(
                    onPressed: _callSeller,
                    icon: const Icon(Icons.phone, color: Colors.white, size: 19),
                    label: const Text('Call Seller'),
                    style: ElevatedButton.styleFrom(
                      backgroundColor: const Color(0xFF10B981),
                      foregroundColor: Colors.white,
                      elevation: 0,
                      padding: const EdgeInsets.symmetric(vertical: 14),
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                      textStyle: const TextStyle(fontWeight: FontWeight.bold, fontSize: 14, letterSpacing: 0.2),
                    ),
                  ),
                ),
                const SizedBox(width: 12),

                // Chat with Seller Button
                Expanded(
                  child: ElevatedButton.icon(
                    onPressed: _isStartingChat ? null : _startChatWithSeller,
                    icon: _isStartingChat
                        ? const SizedBox(width: 18, height: 18, child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white))
                        : const Icon(Icons.chat_bubble_outline, color: Colors.white, size: 19),
                    label: Text(_isStartingChat ? 'Opening...' : 'Chat with Seller'),
                    style: ElevatedButton.styleFrom(
                      backgroundColor: const Color(0xFF2563EB),
                      foregroundColor: Colors.white,
                      elevation: 0,
                      padding: const EdgeInsets.symmetric(vertical: 14),
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                      textStyle: const TextStyle(fontWeight: FontWeight.bold, fontSize: 14, letterSpacing: 0.2),
                    ),
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildMetaChip(BuildContext context, IconData icon, String label) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
      decoration: BoxDecoration(
        color: isDark ? const Color(0xFF1E293B) : const Color(0xFFF1F5F9),
        borderRadius: BorderRadius.circular(8),
        border: Border.all(color: isDark ? const Color(0xFF334155) : const Color(0xFFE2E8F0)),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(icon, size: 14, color: isDark ? const Color(0xFF94A3B8) : const Color(0xFF64748B)),
          const SizedBox(width: 6),
          Text(
            label,
            style: TextStyle(
              fontSize: 12,
              fontWeight: FontWeight.w500,
              color: isDark ? const Color(0xFFCBD5E1) : const Color(0xFF334155),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildSpecRow(BuildContext context, String key, String val, bool isDark) {
    final borderColor = isDark ? const Color(0xFF334155) : const Color(0xFFE2E8F0);
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 11),
      decoration: BoxDecoration(
        border: Border(bottom: BorderSide(color: borderColor)),
      ),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Expanded(
            flex: 2,
            child: Text(
              key,
              style: TextStyle(
                color: isDark ? const Color(0xFF94A3B8) : const Color(0xFF64748B),
                fontSize: 13,
              ),
            ),
          ),
          const SizedBox(width: 8),
          Expanded(
            flex: 3,
            child: Text(
              val,
              textAlign: TextAlign.end,
              style: TextStyle(
                fontWeight: FontWeight.bold,
                fontSize: 13,
                color: isDark ? Colors.white : const Color(0xFF0F172A),
              ),
            ),
          ),
        ],
      ),
    );
  }
}
