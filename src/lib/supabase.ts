import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://your-project.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'your-anon-key';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
  realtime: {
    params: {
      eventsPerSecond: 10,
    },
  },
});

export type Database = {
  public: {
    Tables: {
      users: {
        Row: {
          id: string;
          email: string;
          full_name: string;
          avatar_url: string | null;
          phone: string | null;
          role: string;
          roles: string[] | null;
          is_verified: boolean;
          email_verified: boolean;
          is_temp_password: boolean;
          is_active: boolean;
          city: string | null;
          country: string | null;
          bio: string | null;
          created_at: string;
          updated_at: string;
        };
      };
      listings: {
        Row: {
          id: string;
          title: string;
          description: string;
          price: number;
          currency: string;
          category_id: string;
          subcategory_id: string | null;
          seller_id: string;
          status: string;
          condition: string;
          images: string[];
          video_url: string | null;
          location: string;
          city: string;
          country: string;
          is_featured: boolean;
          is_negotiable: boolean;
          views_count: number;
          created_at: string;
          updated_at: string;
          expires_at: string | null;
          attributes: Record<string, string> | null;
        };
      };
      categories: {
        Row: {
          id: string;
          name: string;
          slug: string;
          icon: string;
          parent_id: string | null;
          description: string | null;
          color: string | null;
          created_at: string;
        };
      };
    };
  };
};
