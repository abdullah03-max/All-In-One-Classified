import 'package:flutter/material.dart';
import '../../../core/theme/app_theme.dart';

class ListingMapView extends StatelessWidget {
  final String city;
  final String? location;
  final double? latitude;
  final double? longitude;

  const ListingMapView({
    super.key,
    required this.city,
    this.location,
    this.latitude,
    this.longitude,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      width: double.infinity,
      height: 180,
      decoration: BoxDecoration(
        color: Colors.blue.shade50,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: Colors.blue.shade200),
      ),
      child: Stack(
        children: [
          Center(
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                const Icon(Icons.location_on, size: 44, color: AppTheme.primaryColor),
                const SizedBox(height: 8),
                Text(
                  location ?? city,
                  style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 16),
                ),
                Text(
                  'Pakistan',
                  style: TextStyle(color: Colors.grey.shade600, fontSize: 12),
                ),
              ],
            ),
          ),
          Positioned(
            bottom: 10,
            right: 10,
            child: Container(
              padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(12),
                boxShadow: const [BoxShadow(color: Colors.black12, blurRadius: 4)],
              ),
              child: const Row(
                children: [
                  Icon(Icons.map, size: 14, color: AppTheme.primaryColor),
                  SizedBox(width: 4),
                  Text('Marketplace Location', style: TextStyle(fontSize: 11, fontWeight: FontWeight.bold)),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }
}
