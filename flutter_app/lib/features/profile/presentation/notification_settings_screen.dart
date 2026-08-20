import 'package:flutter/material.dart';
import '../../notifications/services/push_notification_service.dart';

class NotificationSettingsScreen extends StatefulWidget {
  const NotificationSettingsScreen({super.key});

  @override
  State<NotificationSettingsScreen> createState() => _NotificationSettingsScreenState();
}

class _NotificationSettingsScreenState extends State<NotificationSettingsScreen> {
  bool _newMessages = true;
  bool _newOffers = true;
  bool _listingStatusChanges = true;
  bool _priceDrops = false;
  bool _marketingEmails = false;

  bool _isLoading = true;
  bool _isSaving = false;

  @override
  void initState() {
    super.initState();
    _loadPreferences();
  }

  Future<void> _loadPreferences() async {
    try {
      final prefs = await PushNotificationService.loadPreferences();
      if (mounted) {
        setState(() {
          _newMessages = prefs['new_messages'] ?? true;
          _newOffers = prefs['new_offers'] ?? true;
          _listingStatusChanges = prefs['listing_status_changes'] ?? true;
          _priceDrops = prefs['price_drops'] ?? false;
          _marketingEmails = prefs['marketing_emails'] ?? false;
          _isLoading = false;
        });
      }
    } catch (_) {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  Future<void> _savePreferences() async {
    setState(() => _isSaving = true);

    try {
      final prefsPayload = {
        'new_messages': _newMessages,
        'new_offers': _newOffers,
        'listing_status_changes': _listingStatusChanges,
        'price_drops': _priceDrops,
        'marketing_emails': _marketingEmails,
      };

      await PushNotificationService.savePreferences(prefsPayload);

      if (mounted) {
        setState(() => _isSaving = false);
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Notification preferences saved successfully!'),
            backgroundColor: Color(0xFF10B981),
          ),
        );
      }
    } catch (e) {
      if (mounted) {
        setState(() => _isSaving = false);
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Error saving preferences: $e')),
        );
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Notification Preferences')),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator())
          : SingleChildScrollView(
              padding: const EdgeInsets.all(16.0),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Text('Manage Push & Email Alerts', style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold)),
                  const SizedBox(height: 6),
                  const Text('Choose what notifications you want to receive on mobile and email.', style: TextStyle(color: Colors.grey, fontSize: 13)),
                  const SizedBox(height: 20),

                  SwitchListTile(
                    title: const Text('New Chat Messages'),
                    subtitle: const Text('Get notified when a buyer or seller messages you'),
                    value: _newMessages,
                    onChanged: (v) => setState(() => _newMessages = v),
                  ),
                  const Divider(),

                  SwitchListTile(
                    title: const Text('New Offers'),
                    subtitle: const Text('Get notified when someone makes an offer on your ad'),
                    value: _newOffers,
                    onChanged: (v) => setState(() => _newOffers = v),
                  ),
                  const Divider(),

                  SwitchListTile(
                    title: const Text('Listing Status Changes'),
                    subtitle: const Text('Get notified when your ad is approved or rejected'),
                    value: _listingStatusChanges,
                    onChanged: (v) => setState(() => _listingStatusChanges = v),
                  ),
                  const Divider(),

                  SwitchListTile(
                    title: const Text('Price Drops'),
                    subtitle: const Text('Get notified when saved ads drop in price'),
                    value: _priceDrops,
                    onChanged: (v) => setState(() => _priceDrops = v),
                  ),
                  const Divider(),

                  SwitchListTile(
                    title: const Text('Marketing & Promotional Emails'),
                    subtitle: const Text('Receive promotional offers and marketplace news'),
                    value: _marketingEmails,
                    onChanged: (v) => setState(() => _marketingEmails = v),
                  ),
                  const SizedBox(height: 32),

                  SizedBox(
                    width: double.infinity,
                    height: 50,
                    child: ElevatedButton(
                      onPressed: _isSaving ? null : _savePreferences,
                      child: _isSaving
                          ? const SizedBox(width: 22, height: 22, child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white))
                          : const Text('Save Preferences'),
                    ),
                  ),
                ],
              ),
            ),
    );
  }
}
