import 'package:flutter/material.dart';
import '../../../core/theme/app_theme.dart';
import '../services/location_service.dart';

class LocationPickerDialog extends StatefulWidget {
  final String currentCity;

  const LocationPickerDialog({super.key, required this.currentCity});

  @override
  State<LocationPickerDialog> createState() => _LocationPickerDialogState();
}

class _LocationPickerDialogState extends State<LocationPickerDialog> {
  final TextEditingController _searchController = TextEditingController();
  bool _isLocating = false;

  final List<String> _cities = [
    'All Pakistan', 'Karachi', 'Lahore', 'Islamabad', 'Rawalpindi', 'Faisalabad', 'Multan',
    'Peshawar', 'Quetta', 'Sialkot', 'Gujranwala', 'Hyderabad', 'Abbottabad',
    'Bahawalpur', 'Sargodha', 'Sukkur', 'Larkana', 'Sheikhupura', 'Jhang',
    'Rahim Yar Khan', 'Gujrat'
  ];

  String _searchQuery = '';

  List<String> get _filteredCities {
    if (_searchQuery.isEmpty) return _cities;
    return _cities.where((c) => c.toLowerCase().contains(_searchQuery.toLowerCase())).toList();
  }

  Future<void> _useCurrentLocation() async {
    setState(() => _isLocating = true);

    final pos = await LocationService.getCurrentPosition();
    if (pos != null) {
      final city = await LocationService.getCityFromCoordinates(pos.latitude, pos.longitude);
      if (mounted) {
        setState(() => _isLocating = false);
        Navigator.pop(context, city ?? 'Lahore');
      }
    } else {
      if (mounted) {
        setState(() => _isLocating = false);
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Could not fetch location permission or location service is disabled.')),
        );
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Select Location'),
      ),
      body: Column(
        children: [
          // GPS Location Button
          Padding(
            padding: const EdgeInsets.all(16.0),
            child: SizedBox(
              width: double.infinity,
              height: 48,
              child: OutlinedButton.icon(
                onPressed: _isLocating ? null : _useCurrentLocation,
                icon: _isLocating
                    ? const SizedBox(width: 18, height: 18, child: CircularProgressIndicator(strokeWidth: 2))
                    : const Icon(Icons.my_location, color: AppTheme.primaryColor),
                label: const Text('Use Current GPS Location'),
                style: OutlinedButton.styleFrom(
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                ),
              ),
            ),
          ),

          // City Search Bar
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 16.0),
            child: TextField(
              controller: _searchController,
              onChanged: (val) => setState(() => _searchQuery = val),
              decoration: const InputDecoration(
                hintText: 'Search city...',
                prefixIcon: Icon(Icons.search),
              ),
            ),
          ),
          const SizedBox(height: 12),

          // Cities ListView
          Expanded(
            child: ListView.builder(
              itemCount: _filteredCities.length,
              itemBuilder: (context, index) {
                final city = _filteredCities[index];
                final isSelected = widget.currentCity == city;

                return ListTile(
                  title: Text(
                    city,
                    style: TextStyle(
                      fontWeight: isSelected ? FontWeight.bold : FontWeight.normal,
                      color: isSelected ? AppTheme.primaryColor : null,
                    ),
                  ),
                  trailing: isSelected ? const Icon(Icons.check_circle, color: AppTheme.primaryColor) : null,
                  onTap: () => Navigator.pop(context, city),
                );
              },
            ),
          ),
        ],
      ),
    );
  }
}
