import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:cached_network_image/cached_network_image.dart';
import '../../../core/theme/app_theme.dart';
import '../../auth/logic/auth_cubit.dart';
import '../../auth/logic/auth_state.dart';
import '../../auth/presentation/login_screen.dart';
import '../../listings/presentation/my_listings_screen.dart';
import '../../favorites/presentation/favorites_screen.dart';
import 'edit_profile_screen.dart';
import 'security_screen.dart';
import 'notification_settings_screen.dart';
import 'verification_application_screen.dart';
import '../../ai_assistant/presentation/ai_assistant_screen.dart';

class ProfileScreen extends StatelessWidget {
  const ProfileScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return BlocBuilder<AuthCubit, AuthState>(
      builder: (context, state) {
        final isAuthenticated = state is Authenticated;

        return Scaffold(
          appBar: AppBar(
            title: const Text('My Profile'),
            actions: isAuthenticated
                ? [
                    IconButton(
                      icon: const Icon(Icons.edit_outlined),
                      tooltip: 'Edit Profile',
                      onPressed: () {
                        Navigator.push(
                          context,
                          MaterialPageRoute(builder: (_) => const EditProfileScreen()),
                        );
                      },
                    ),
                    IconButton(
                      icon: const Icon(Icons.logout, color: Colors.redAccent),
                      tooltip: 'Log Out',
                      onPressed: () => _confirmLogout(context),
                    ),
                  ]
                : null,
          ),
          body: isAuthenticated
              ? _buildAuthenticatedProfile(context, state)
              : _buildGuestProfile(context),
        );
      },
    );
  }

  Widget _buildGuestProfile(BuildContext context) {
    return SingleChildScrollView(
      padding: const EdgeInsets.all(24.0),
      child: Column(
        children: [
          const SizedBox(height: 30),
          Container(
            width: 90,
            height: 90,
            decoration: BoxDecoration(
              color: AppTheme.primaryLight,
              shape: BoxShape.circle,
            ),
            child: const Icon(
              Icons.person_outline,
              size: 48,
              color: AppTheme.primaryColor,
            ),
          ),
          const SizedBox(height: 20),
          const Text(
            'Welcome to All In One',
            textAlign: TextAlign.center,
            style: TextStyle(
              fontSize: 22,
              fontWeight: FontWeight.bold,
            ),
          ),
          const SizedBox(height: 8),
          const Text(
            'Log in or create an account to post classified ads, save favorites, and chat with buyers and sellers.',
            textAlign: TextAlign.center,
            style: TextStyle(
              color: AppTheme.textSecondaryLight,
              fontSize: 14,
              height: 1.4,
            ),
          ),
          const SizedBox(height: 28),
          SizedBox(
            width: double.infinity,
            height: 52,
            child: ElevatedButton.icon(
              onPressed: () {
                Navigator.push(
                  context,
                  MaterialPageRoute(builder: (_) => const LoginScreen()),
                );
              },
              icon: const Icon(Icons.login),
              label: const Text('Log In / Register'),
            ),
          ),
          const SizedBox(height: 32),
          const Divider(),
          const SizedBox(height: 16),
          _buildProfileOption(
            icon: Icons.info_outline,
            title: 'About App',
            subtitle: 'All In One Marketplace v1.0',
            onTap: () {},
          ),
          _buildProfileOption(
            icon: Icons.help_outline,
            title: 'Help & Support',
            subtitle: 'Contact support & safety guidelines',
            onTap: () {},
          ),
        ],
      ),
    );
  }

  Widget _buildAuthenticatedProfile(BuildContext context, Authenticated state) {
    return SingleChildScrollView(
      padding: const EdgeInsets.all(20.0),
      child: Column(
        children: [
          const SizedBox(height: 10),
          // User Avatar & Name
          if (state.avatarUrl != null && state.avatarUrl!.trim().isNotEmpty)
            CircleAvatar(
              radius: 44,
              backgroundColor: AppTheme.primaryLight,
              child: ClipOval(
                child: CachedNetworkImage(
                  imageUrl: state.avatarUrl!,
                  width: 88,
                  height: 88,
                  fit: BoxFit.cover,
                  placeholder: (_, __) => const CircularProgressIndicator(strokeWidth: 2),
                  errorWidget: (_, __, ___) => Text(
                    state.fullName.isNotEmpty ? state.fullName[0].toUpperCase() : 'U',
                    style: const TextStyle(
                      fontSize: 32,
                      fontWeight: FontWeight.bold,
                      color: AppTheme.primaryColor,
                    ),
                  ),
                ),
              ),
            )
          else
            CircleAvatar(
              radius: 44,
              backgroundColor: AppTheme.primaryLight,
              child: Text(
                state.fullName.isNotEmpty ? state.fullName[0].toUpperCase() : 'U',
                style: const TextStyle(
                  fontSize: 32,
                  fontWeight: FontWeight.bold,
                  color: AppTheme.primaryColor,
                ),
              ),
            ),
          const SizedBox(height: 14),
          Text(
            state.fullName,
            style: const TextStyle(
              fontSize: 20,
              fontWeight: FontWeight.bold,
            ),
          ),
          const SizedBox(height: 4),
          Text(
            state.email,
            style: const TextStyle(
              color: AppTheme.textSecondaryLight,
              fontSize: 14,
            ),
          ),
          const SizedBox(height: 12),

          // Verification Badge (if verified)
          if (state.isVerified) ...[
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 4),
              decoration: BoxDecoration(
                color: Colors.green.shade50,
                borderRadius: BorderRadius.circular(20),
                border: Border.all(color: Colors.green.shade200),
              ),
              child: const Row(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Icon(Icons.verified, size: 14, color: Color(0xFF10B981)),
                  SizedBox(width: 4),
                  Text(
                    'Verified Seller',
                    style: TextStyle(
                      color: Color(0xFF10B981),
                      fontSize: 11,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 12),
          ] else
            const SizedBox(height: 8),
          const SizedBox(height: 32),

          // Option List Tiles
          _buildProfileOption(
            icon: Icons.shield_outlined,
            title: 'Account Verification',
            subtitle: 'Apply for Verified Seller Badge',
            onTap: () {
              Navigator.push(
                context,
                MaterialPageRoute(builder: (_) => const VerificationApplicationScreen()),
              );
            },
          ),
          _buildProfileOption(
            icon: Icons.list_alt,
            title: 'My Listings',
            subtitle: 'Manage your posted classified ads',
            onTap: () {
              Navigator.push(
                context,
                MaterialPageRoute(builder: (_) => const MyListingsScreen()),
              );
            },
          ),
          _buildProfileOption(
            icon: Icons.favorite_border,
            title: 'Saved Ads',
            subtitle: 'View items in your wishlist',
            onTap: () {
              Navigator.push(
                context,
                MaterialPageRoute(builder: (_) => const FavoritesScreen()),
              );
            },
          ),
          _buildProfileOption(
            icon: Icons.lock_outline,
            title: 'Account Security',
            subtitle: 'Change password & security settings',
            onTap: () {
              Navigator.push(
                context,
                MaterialPageRoute(builder: (_) => const SecurityScreen()),
              );
            },
          ),
          _buildProfileOption(
            icon: Icons.auto_awesome,
            title: 'AI Assistant',
            subtitle: 'Ask questions about marketplace and ads',
            onTap: () {
              Navigator.push(
                context,
                MaterialPageRoute(builder: (_) => const AiAssistantScreen()),
              );
            },
          ),
          _buildProfileOption(
            icon: Icons.notifications_none,
            title: 'Notification Settings',
            subtitle: 'Manage push & email preferences',
            onTap: () {
              Navigator.push(
                context,
                MaterialPageRoute(builder: (_) => const NotificationSettingsScreen()),
              );
            },
          ),
          const SizedBox(height: 24),

          // Logout Button
          SizedBox(
            width: double.infinity,
            height: 50,
            child: OutlinedButton.icon(
              onPressed: () => _confirmLogout(context),
              icon: const Icon(Icons.logout, color: Colors.redAccent),
              label: const Text(
                'Log Out',
                style: TextStyle(color: Colors.redAccent, fontWeight: FontWeight.bold),
              ),
              style: OutlinedButton.styleFrom(
                side: const BorderSide(color: Colors.redAccent),
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
              ),
            ),
          ),
        ],
      ),
    );
  }


  Widget _buildProfileOption({
    required IconData icon,
    required String title,
    required String subtitle,
    required VoidCallback onTap,
  }) {
    return Card(
      margin: const EdgeInsets.only(bottom: 12),
      child: ListTile(
        leading: CircleAvatar(
          radius: 20,
          backgroundColor: AppTheme.primaryLight,
          child: Icon(icon, color: AppTheme.primaryColor, size: 20),
        ),
        title: Text(title, style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 14)),
        subtitle: Text(subtitle, style: const TextStyle(fontSize: 12, color: AppTheme.textSecondaryLight)),
        trailing: const Icon(Icons.chevron_right, color: Colors.grey),
        onTap: onTap,
      ),
    );
  }

  void _confirmLogout(BuildContext context) {
    showDialog(
      context: context,
      builder: (dialogCtx) => AlertDialog(
        title: const Text('Log Out'),
        content: const Text('Are you sure you want to log out of your account?'),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(dialogCtx),
            child: const Text('Cancel'),
          ),
          ElevatedButton(
            onPressed: () {
              Navigator.pop(dialogCtx);
              context.read<AuthCubit>().logout();
            },
            style: ElevatedButton.styleFrom(backgroundColor: Colors.redAccent),
            child: const Text('Log Out'),
          ),
        ],
      ),
    );
  }
}
