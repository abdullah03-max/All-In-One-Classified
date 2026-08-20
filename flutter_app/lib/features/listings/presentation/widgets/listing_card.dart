import 'package:flutter/material.dart';
import 'package:cached_network_image/cached_network_image.dart';
import 'package:intl/intl.dart';
import '../../../../core/theme/app_theme.dart';
import '../../data/listing_model.dart';
import '../listing_detail_screen.dart';

class ListingCard extends StatelessWidget {
  final ListingModel listing;
  final VoidCallback? onFavoriteToggle;

  const ListingCard({
    super.key,
    required this.listing,
    this.onFavoriteToggle,
  });

  @override
  Widget build(BuildContext context) {
    final currencyFormatter = NumberFormat.currency(symbol: 'PKR ', decimalDigits: 0);

    final isJobOrService = listing.category != null &&
        (listing.category!.name.toLowerCase().contains('job') ||
            listing.category!.name.toLowerCase().contains('service') ||
            !listing.category!.isPriceEnabled);

    final isNonPriced = listing.price == 0 || isJobOrService;

    return GestureDetector(
      onTap: () {
        Navigator.push(
          context,
          MaterialPageRoute(
            builder: (_) => ListingDetailScreen(listing: listing),
          ),
        );
      },
      child: Container(
        decoration: BoxDecoration(
          color: Theme.of(context).cardColor,
          borderRadius: BorderRadius.circular(16),
          boxShadow: [
            BoxShadow(
              color: Colors.black.withOpacity(0.04),
              blurRadius: 10,
              offset: const Offset(0, 4),
            ),
          ],
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Thumbnail Image & Badges
            Stack(
              children: [
                ClipRRect(
                  borderRadius: const BorderRadius.vertical(top: Radius.circular(16)),
                  child: AspectRatio(
                    aspectRatio: 1.3,
                    child: listing.images.isNotEmpty
                        ? CachedNetworkImage(
                            imageUrl: listing.images.first,
                            fit: BoxFit.cover,
                            placeholder: (context, url) => Container(
                              color: Colors.grey.shade200,
                              child: const Center(child: CircularProgressIndicator(strokeWidth: 2)),
                            ),
                            errorWidget: (context, url, error) => Container(
                              color: Colors.grey.shade200,
                              child: const Icon(Icons.image_not_supported, color: Colors.grey),
                            ),
                          )
                        : Container(
                            color: Colors.grey.shade200,
                            child: const Icon(Icons.image, size: 40, color: Colors.grey),
                          ),
                  ),
                ),

                // Featured Badge
                if (listing.isFeatured)
                  Positioned(
                    top: 8,
                    left: 8,
                    child: Container(
                      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                      decoration: BoxDecoration(
                        gradient: const LinearGradient(
                          colors: [Color(0xFFF59E0B), Color(0xFFD97706)],
                        ),
                        borderRadius: BorderRadius.circular(8),
                      ),
                      child: const Row(
                        children: [
                          Icon(Icons.star, size: 12, color: Colors.white),
                          SizedBox(width: 3),
                          Text(
                            'FEATURED',
                            style: TextStyle(color: Colors.white, fontSize: 9, fontWeight: FontWeight.bold),
                          ),
                        ],
                      ),
                    ),
                  ),

                // Condition Badge (Only for non-job/non-service items)
                if (!isJobOrService && listing.condition.isNotEmpty)
                  Positioned(
                    bottom: 8,
                    left: 8,
                    child: Container(
                      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                      decoration: BoxDecoration(
                        color: Colors.black.withOpacity(0.6),
                        borderRadius: BorderRadius.circular(6),
                      ),
                      child: Text(
                        listing.condition.toUpperCase(),
                        style: const TextStyle(color: Colors.white, fontSize: 9, fontWeight: FontWeight.w600),
                      ),
                    ),
                  ),

                // Favorite Heart Toggle Button
                Positioned(
                  top: 8,
                  right: 8,
                  child: GestureDetector(
                    onTap: onFavoriteToggle,
                    child: CircleAvatar(
                      radius: 16,
                      backgroundColor: Colors.white.withOpacity(0.9),
                      child: Icon(
                        listing.isFavorite ? Icons.favorite : Icons.favorite_border,
                        size: 18,
                        color: listing.isFavorite ? Colors.redAccent : Colors.grey.shade700,
                      ),
                    ),
                  ),
                ),
              ],
            ),

            // Listing Content Body
            Padding(
              padding: const EdgeInsets.all(12.0),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    listing.title,
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                    style: const TextStyle(
                      fontWeight: FontWeight.bold,
                      fontSize: 14,
                    ),
                  ),
                  const SizedBox(height: 4),

                  if (!isNonPriced)
                    Text(
                      currencyFormatter.format(listing.price),
                      style: const TextStyle(
                        color: AppTheme.primaryColor,
                        fontSize: 15,
                        fontWeight: FontWeight.w800,
                      ),
                    )
                  else
                    Text(
                      isJobOrService ? 'Apply / Details' : 'Contact for Price',
                      style: const TextStyle(
                        color: Color(0xFF10B981),
                        fontSize: 13,
                        fontWeight: FontWeight.bold,
                      ),
                    ),

                  const SizedBox(height: 8),

                  // Location City & Verification
                  Row(
                    children: [
                      const Icon(Icons.location_on_outlined, size: 13, color: Colors.grey),
                      const SizedBox(width: 2),
                      Expanded(
                        child: Text(
                          listing.city,
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                          style: const TextStyle(fontSize: 11, color: AppTheme.textSecondaryLight),
                        ),
                      ),
                      if (listing.seller?.isVerified == true) ...[
                        const Icon(Icons.verified, size: 14, color: Colors.blue),
                      ],
                    ],
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}
