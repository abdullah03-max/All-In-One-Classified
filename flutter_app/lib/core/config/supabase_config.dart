class SupabaseConfig {
  // Supabase Project Credentials (Same as web project)
  static const String supabaseUrl = 'https://itpqfayntwpganhcukyy.supabase.co';
  static const String supabaseAnonKey = 'sb_publishable_BrYbRkxliWKmTqPVgAQ4-g_-_EFciq9';


  // API Endpoints
  static const String apiBaseUrl = 'https://all-in-one-classified.vercel.app';
  static const String chatApiEndpoint = '$apiBaseUrl/api/chat';
  static const String safepayCreateTrackerEndpoint = '$apiBaseUrl/api/safepay/create-tracker';

  // Storage Bucket Names
  static const String avatarsBucket = 'avatars';
  static const String listingsBucket = 'listing-images';
  static const String verificationBucket = 'listing-images';
  static const String chatAttachmentsBucket = 'listing-images';
}
