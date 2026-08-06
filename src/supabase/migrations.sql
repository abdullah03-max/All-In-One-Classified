-- ============================================================
-- BAZAAR MARKETPLACE - Complete Database Schema
-- Run this in your Supabase SQL Editor
-- ============================================================

-- Enable extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- ============================================================
-- ENUMS
-- ============================================================
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_role') THEN
    CREATE TYPE user_role AS ENUM ('buyer', 'seller', 'moderator', 'admin', 'super_admin');
  END IF;
END;
$$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'listing_status') THEN
    CREATE TYPE listing_status AS ENUM ('draft', 'pending', 'active', 'rejected', 'sold', 'expired', 'suspended');
  END IF;
END;
$$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'listing_condition') THEN
    CREATE TYPE listing_condition AS ENUM ('new', 'like_new', 'good', 'fair', 'poor');
  END IF;
END;
$$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'offer_status') THEN
    CREATE TYPE offer_status AS ENUM ('pending', 'accepted', 'rejected', 'countered', 'withdrawn');
  END IF;
END;
$$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'payment_status') THEN
    CREATE TYPE payment_status AS ENUM ('pending', 'completed', 'failed', 'refunded');
  END IF;
END;
$$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'report_status') THEN
    CREATE TYPE report_status AS ENUM ('pending', 'reviewed', 'resolved', 'dismissed');
  END IF;
END;
$$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'notification_type') THEN
    CREATE TYPE notification_type AS ENUM ('message', 'offer', 'listing_status', 'payment', 'report', 'system');
  END IF;
END;
$$;

-- ============================================================
-- TABLES
-- ============================================================

-- Users (extends auth.users)
CREATE TABLE IF NOT EXISTS public.users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL UNIQUE,
  full_name TEXT NOT NULL,
  avatar_url TEXT,
  phone TEXT,
  role user_role NOT NULL DEFAULT 'buyer',
  roles user_role[] NOT NULL DEFAULT ARRAY['buyer']::user_role[],
  is_verified BOOLEAN NOT NULL DEFAULT false,
  email_verified BOOLEAN NOT NULL DEFAULT false,
  is_temp_password BOOLEAN NOT NULL DEFAULT false,
  is_active BOOLEAN NOT NULL DEFAULT true,
  city TEXT,
  country TEXT DEFAULT 'Pakistan',
  bio TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.users ADD COLUMN IF NOT EXISTS roles user_role[] NOT NULL DEFAULT ARRAY['buyer']::user_role[];
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS email_verified BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS is_temp_password BOOLEAN NOT NULL DEFAULT false;
UPDATE public.users SET roles = ARRAY[role]::user_role[] WHERE roles IS NULL;

-- Categories
CREATE TABLE IF NOT EXISTS public.categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  icon TEXT NOT NULL DEFAULT 'Tag',
  parent_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
  description TEXT,
  color TEXT DEFAULT '#3b82f6',
  sort_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  attributes_schema JSONB DEFAULT '[]'::jsonb,
  image_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Ensure columns exist if table was already created
ALTER TABLE public.categories ADD COLUMN IF NOT EXISTS attributes_schema JSONB DEFAULT '[]'::jsonb;
ALTER TABLE public.categories ADD COLUMN IF NOT EXISTS image_url TEXT;

-- Listings
CREATE TABLE IF NOT EXISTS public.listings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  price NUMERIC(12,2) NOT NULL DEFAULT 0,
  currency TEXT NOT NULL DEFAULT 'PKR',
  category_id UUID NOT NULL REFERENCES public.categories(id) ON DELETE RESTRICT,
  subcategory_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
  seller_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  status listing_status NOT NULL DEFAULT 'pending',
  condition listing_condition NOT NULL DEFAULT 'good',
  images TEXT[] NOT NULL DEFAULT '{}',
  video_url TEXT,
  location TEXT NOT NULL DEFAULT '',
  city TEXT NOT NULL DEFAULT '',
  country TEXT NOT NULL DEFAULT 'Pakistan',
  is_featured BOOLEAN NOT NULL DEFAULT false,
  is_negotiable BOOLEAN NOT NULL DEFAULT false,
  views_count INTEGER NOT NULL DEFAULT 0,
  attributes JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at TIMESTAMPTZ DEFAULT (now() + INTERVAL '30 days'),
  search_vector TSVECTOR
);

-- Conversations
CREATE TABLE IF NOT EXISTS public.conversations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  listing_id UUID NOT NULL REFERENCES public.listings(id) ON DELETE CASCADE,
  buyer_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  seller_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(listing_id, buyer_id, seller_id)
);

-- Messages
CREATE TABLE IF NOT EXISTS public.messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  conversation_id UUID NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  is_read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Bookmarks
CREATE TABLE IF NOT EXISTS public.bookmarks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  listing_id UUID NOT NULL REFERENCES public.listings(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, listing_id)
);

-- Offers
CREATE TABLE IF NOT EXISTS public.offers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  listing_id UUID NOT NULL REFERENCES public.listings(id) ON DELETE CASCADE,
  buyer_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  seller_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  amount NUMERIC(12,2) NOT NULL,
  status offer_status NOT NULL DEFAULT 'pending',
  message TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Reports
CREATE TABLE IF NOT EXISTS public.reports (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  reporter_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  listing_id UUID NOT NULL REFERENCES public.listings(id) ON DELETE CASCADE,
  reason TEXT NOT NULL,
  description TEXT,
  status report_status NOT NULL DEFAULT 'pending',
  moderator_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
  resolution_note TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Notifications
CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  type notification_type NOT NULL DEFAULT 'system',
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  is_read BOOLEAN NOT NULL DEFAULT false,
  data JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Payments
CREATE TABLE IF NOT EXISTS public.payments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  listing_id UUID REFERENCES public.listings(id) ON DELETE SET NULL,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  amount NUMERIC(12,2) NOT NULL,
  currency TEXT NOT NULL DEFAULT 'PKR',
  method TEXT NOT NULL,
  status payment_status NOT NULL DEFAULT 'pending',
  transaction_id TEXT,
  receipt_url TEXT,
  notes TEXT,
  verified_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Reviews
CREATE TABLE IF NOT EXISTS public.reviews (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  reviewer_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  seller_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  listing_id UUID REFERENCES public.listings(id) ON DELETE SET NULL,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(reviewer_id, listing_id)
);

-- ============================================================
-- INDEXES
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_listings_seller ON public.listings(seller_id);
CREATE INDEX IF NOT EXISTS idx_listings_category ON public.listings(category_id);
CREATE INDEX IF NOT EXISTS idx_listings_status ON public.listings(status);
CREATE INDEX IF NOT EXISTS idx_listings_city ON public.listings(city);
CREATE INDEX IF NOT EXISTS idx_listings_created ON public.listings(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_listings_featured ON public.listings(is_featured) WHERE is_featured = true;
CREATE INDEX IF NOT EXISTS idx_listings_search ON public.listings USING GIN(search_vector);
CREATE INDEX IF NOT EXISTS idx_messages_conversation ON public.messages(conversation_id, created_at);
CREATE INDEX IF NOT EXISTS idx_conversations_buyer ON public.conversations(buyer_id);
CREATE INDEX IF NOT EXISTS idx_conversations_seller ON public.conversations(seller_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user ON public.notifications(user_id, is_read, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_bookmarks_user ON public.bookmarks(user_id);

-- ============================================================
-- FUNCTIONS & TRIGGERS
-- ============================================================

-- Auto-create user profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email, full_name, avatar_url, phone)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
    NEW.raw_user_meta_data->>'avatar_url',
    COALESCE(NEW.raw_user_meta_data->>'phone', NEW.phone)
  )
  ON CONFLICT (id) DO UPDATE
  SET
    full_name = EXCLUDED.full_name,
    avatar_url = EXCLUDED.avatar_url,
    phone = EXCLUDED.phone;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Securely delete a user from auth.users (cascades to public.users)
CREATE OR REPLACE FUNCTION public.delete_user_by_admin(target_user_id UUID)
RETURNS void AS $$
DECLARE
  calling_user_role TEXT;
BEGIN
  -- Check caller permissions
  SELECT role INTO calling_user_role FROM public.users WHERE id = auth.uid();
  
  IF calling_user_role IS NULL OR calling_user_role NOT IN ('admin', 'super_admin') THEN
    RAISE EXCEPTION 'Access Denied: Only administrators can delete users.';
  END IF;

  -- Delete target user
  DELETE FROM auth.users WHERE id = target_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update listing search vector
CREATE OR REPLACE FUNCTION public.update_listing_search()
RETURNS TRIGGER AS $$
BEGIN
  NEW.search_vector := to_tsvector('english',
    COALESCE(NEW.title, '') || ' ' ||
    COALESCE(NEW.description, '') || ' ' ||
    COALESCE(NEW.city, '') || ' ' ||
    COALESCE(NEW.location, '')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER listings_search_update
  BEFORE INSERT OR UPDATE ON public.listings
  FOR EACH ROW EXECUTE FUNCTION public.update_listing_search();

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER listings_updated_at BEFORE UPDATE ON public.listings FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
CREATE TRIGGER users_updated_at BEFORE UPDATE ON public.users FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
CREATE TRIGGER conversations_updated_at BEFORE UPDATE ON public.conversations FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
CREATE TRIGGER offers_updated_at BEFORE UPDATE ON public.offers FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- Increment listing view count
CREATE OR REPLACE FUNCTION public.increment_view_count(listing_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE public.listings SET views_count = views_count + 1 WHERE id = listing_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update conversation updated_at on new message
CREATE OR REPLACE FUNCTION public.update_conversation_on_message()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.conversations SET updated_at = now() WHERE id = NEW.conversation_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER on_message_created
  AFTER INSERT ON public.messages
  FOR EACH ROW EXECUTE FUNCTION public.update_conversation_on_message();

-- Get or create conversation
CREATE OR REPLACE FUNCTION public.get_or_create_conversation(
  p_listing_id UUID,
  p_buyer_id UUID,
  p_seller_id UUID
) RETURNS UUID AS $$
DECLARE
  v_conversation_id UUID;
BEGIN
  SELECT id INTO v_conversation_id
  FROM public.conversations
  WHERE listing_id = p_listing_id AND buyer_id = p_buyer_id AND seller_id = p_seller_id;
  
  IF v_conversation_id IS NULL THEN
    INSERT INTO public.conversations (listing_id, buyer_id, seller_id)
    VALUES (p_listing_id, p_buyer_id, p_seller_id)
    RETURNING id INTO v_conversation_id;
  END IF;
  
  RETURN v_conversation_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================
-- VIEWS
-- ============================================================

CREATE OR REPLACE VIEW public.listing_details AS
SELECT
  l.*,
  u.full_name AS seller_name,
  u.avatar_url AS seller_avatar,
  u.phone AS seller_phone,
  u.is_verified AS seller_verified,
  c.name AS category_name,
  c.slug AS category_slug,
  c.icon AS category_icon,
  sc.name AS subcategory_name
FROM public.listings l
LEFT JOIN public.users u ON l.seller_id = u.id
LEFT JOIN public.categories c ON l.category_id = c.id
LEFT JOIN public.categories sc ON l.subcategory_id = sc.id;

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================

ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.listings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bookmarks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.offers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;

-- Users policies
CREATE POLICY "Users can view all profiles" ON public.users FOR SELECT USING (true);
CREATE POLICY "Users can insert own profile" ON public.users FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "Admins can insert user profiles" ON public.users FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role IN ('admin', 'super_admin'))
);
CREATE POLICY "Users can update own profile" ON public.users FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Admins can update users" ON public.users FOR UPDATE USING (
  EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role IN ('admin', 'super_admin'))
);
CREATE POLICY "Admins can delete users" ON public.users FOR DELETE USING (
  EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role IN ('admin', 'super_admin'))
);
CREATE POLICY "Service role full access to users" ON public.users USING (auth.role() = 'service_role');

-- Categories policies
CREATE POLICY "Anyone can view categories" ON public.categories FOR SELECT USING (true);
CREATE POLICY "Admins can manage categories" ON public.categories FOR ALL USING (
  EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role IN ('admin', 'super_admin'))
);

-- Listings policies
CREATE POLICY "Anyone can view active listings" ON public.listings FOR SELECT USING (status = 'active' OR seller_id = auth.uid() OR
  EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role IN ('moderator', 'admin', 'super_admin')));
CREATE POLICY "Sellers can create listings" ON public.listings FOR INSERT WITH CHECK (auth.uid() = seller_id);
CREATE POLICY "Sellers can update own listings" ON public.listings FOR UPDATE USING (auth.uid() = seller_id OR
  EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role IN ('moderator', 'admin', 'super_admin')));
CREATE POLICY "Sellers can delete own listings" ON public.listings FOR DELETE USING (auth.uid() = seller_id OR
  EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role IN ('admin', 'super_admin')));

-- Conversations policies
CREATE POLICY "Users can view own conversations" ON public.conversations FOR SELECT USING (auth.uid() IN (buyer_id, seller_id));
CREATE POLICY "Buyers can create conversations" ON public.conversations FOR INSERT WITH CHECK (auth.uid() = buyer_id);

-- Messages policies
CREATE POLICY "Users can view messages in own conversations" ON public.messages FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.conversations WHERE id = conversation_id AND auth.uid() IN (buyer_id, seller_id)));
CREATE POLICY "Users can send messages in own conversations" ON public.messages FOR INSERT WITH CHECK (
  auth.uid() = sender_id AND
  EXISTS (SELECT 1 FROM public.conversations WHERE id = conversation_id AND auth.uid() IN (buyer_id, seller_id)));
CREATE POLICY "Users can mark messages as read" ON public.messages FOR UPDATE USING (
  EXISTS (SELECT 1 FROM public.conversations WHERE id = conversation_id AND auth.uid() IN (buyer_id, seller_id)));

-- Bookmarks policies
CREATE POLICY "Users can view own bookmarks" ON public.bookmarks FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can manage own bookmarks" ON public.bookmarks FOR ALL USING (auth.uid() = user_id);

-- Offers policies
CREATE POLICY "Users can view own offers" ON public.offers FOR SELECT USING (auth.uid() IN (buyer_id, seller_id));
CREATE POLICY "Buyers can create offers" ON public.offers FOR INSERT WITH CHECK (auth.uid() = buyer_id);
CREATE POLICY "Sellers can update offer status" ON public.offers FOR UPDATE USING (auth.uid() = seller_id OR auth.uid() = buyer_id);

-- Reports policies
CREATE POLICY "Users can create reports" ON public.reports FOR INSERT WITH CHECK (auth.uid() = reporter_id);
CREATE POLICY "Users can view own reports" ON public.reports FOR SELECT USING (auth.uid() = reporter_id OR
  EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role IN ('moderator', 'admin', 'super_admin')));
CREATE POLICY "Moderators can update reports" ON public.reports FOR UPDATE USING (
  EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role IN ('moderator', 'admin', 'super_admin')));

-- Notifications policies
CREATE POLICY "Users can view own notifications" ON public.notifications FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update own notifications" ON public.notifications FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "System can create notifications" ON public.notifications FOR INSERT WITH CHECK (true);

-- Payments policies
CREATE POLICY "Users can view own payments" ON public.payments FOR SELECT USING (auth.uid() = user_id OR
  EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role IN ('admin', 'super_admin')));
CREATE POLICY "Users can create payments" ON public.payments FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Admins can update payments" ON public.payments FOR UPDATE USING (
  EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role IN ('admin', 'super_admin')));

-- Reviews policies
CREATE POLICY "Anyone can view reviews" ON public.reviews FOR SELECT USING (true);
CREATE POLICY "Users can create reviews" ON public.reviews FOR INSERT WITH CHECK (auth.uid() = reviewer_id);

-- ============================================================
-- STORAGE BUCKETS
-- ============================================================

INSERT INTO storage.buckets (id, name, public) VALUES
  ('listing-images', 'listing-images', true),
  ('listing-videos', 'listing-videos', true),
  ('avatars', 'avatars', true),
  ('receipts', 'receipts', false)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "Anyone can view listing images" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated can upload listing images" ON storage.objects;
DROP POLICY IF EXISTS "Users can update own listing images" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete own listing images" ON storage.objects;

CREATE POLICY "Anyone can view listing images" ON storage.objects FOR SELECT USING (bucket_id = 'listing-images');
CREATE POLICY "Authenticated can upload listing images" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'listing-images' AND auth.role() = 'authenticated');
CREATE POLICY "Users can update own listing images" ON storage.objects FOR UPDATE USING (bucket_id = 'listing-images' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "Users can delete own listing images" ON storage.objects FOR DELETE USING (bucket_id = 'listing-images' AND auth.uid()::text = (storage.foldername(name))[1]);

DROP POLICY IF EXISTS "Anyone can view listing videos" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated can upload listing videos" ON storage.objects;
DROP POLICY IF EXISTS "Users can update own listing videos" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete own listing videos" ON storage.objects;

CREATE POLICY "Anyone can view listing videos" ON storage.objects FOR SELECT USING (bucket_id = 'listing-videos');
CREATE POLICY "Authenticated can upload listing videos" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'listing-videos' AND auth.role() = 'authenticated');
CREATE POLICY "Users can update own listing videos" ON storage.objects FOR UPDATE USING (bucket_id = 'listing-videos' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "Users can delete own listing videos" ON storage.objects FOR DELETE USING (bucket_id = 'listing-videos' AND auth.uid()::text = (storage.foldername(name))[1]);

DROP POLICY IF EXISTS "Anyone can view avatars" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated can upload avatars" ON storage.objects;
DROP POLICY IF EXISTS "Users can update own avatar" ON storage.objects;

CREATE POLICY "Anyone can view avatars" ON storage.objects FOR SELECT USING (bucket_id = 'avatars');
CREATE POLICY "Authenticated can upload avatars" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'avatars' AND auth.role() = 'authenticated');
CREATE POLICY "Users can update own avatar" ON storage.objects FOR UPDATE USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

-- ============================================================
-- SEED DATA - Categories
-- ============================================================
INSERT INTO public.categories (id, name, slug, icon, parent_id, color, sort_order) VALUES
  ('c1000000-0000-0000-0000-000000000001', 'Vehicles', 'vehicles', 'Car', null, '#ef4444', 1),
  ('c1000000-0000-0000-0000-000000000002', 'Property', 'property', 'Building2', null, '#8b5cf6', 2),
  ('c1000000-0000-0000-0000-000000000003', 'Electronics', 'electronics', 'Smartphone', null, '#3b82f6', 3),
  ('c1000000-0000-0000-0000-000000000004', 'Jobs', 'jobs', 'Briefcase', null, '#10b981', 4),
  ('c1000000-0000-0000-0000-000000000005', 'Fashion & Beauty', 'fashion-beauty', 'ShoppingBag', null, '#ec4899', 5),
  ('c1000000-0000-0000-0000-000000000006', 'Furniture & Home', 'furniture-home', 'Home', null, '#f59e0b', 6),
  ('c1000000-0000-0000-0000-000000000007', 'Services', 'services', 'Wrench', null, '#06b6d4', 7),
  ('c1000000-0000-0000-0000-000000000008', 'Education', 'education', 'BookOpen', null, '#6366f1', 8),
  ('c1000000-0000-0000-0000-000000000009', 'Pets', 'pets', 'PawPrint', null, '#f97316', 9),
  ('c1000000-0000-0000-0000-000000000010', 'Sports & Hobbies', 'sports-hobbies', 'Trophy', null, '#84cc16', 10),
  ('c1000000-0000-0000-0000-000000000011', 'Business & Industrial', 'business-industrial', 'Factory', null, '#64748b', 11),
  ('c1000000-0000-0000-0000-000000000012', 'Agriculture', 'agriculture', 'Leaf', null, '#22c55e', 12),
  ('c1000000-0000-0000-0000-000000000014', 'Others', 'others', 'MoreHorizontal', null, '#94a3b8', 14)
ON CONFLICT (id) DO NOTHING;

-- Subcategories: Vehicles
INSERT INTO public.categories (id, name, slug, icon, parent_id, color) VALUES
  ('c1000000-0000-0000-0000-000000000101', 'Cars', 'cars', 'Car', 'c1000000-0000-0000-0000-000000000001', '#ef4444'),
  ('c1000000-0000-0000-0000-000000000102', 'Motorcycles', 'motorcycles', 'Bike', 'c1000000-0000-0000-0000-000000000001', '#ef4444'),
  ('c1000000-0000-0000-0000-000000000103', 'Bicycles', 'bicycles', 'Bike', 'c1000000-0000-0000-0000-000000000001', '#ef4444'),
  ('c1000000-0000-0000-0000-000000000104', 'Trucks & Buses', 'trucks-buses', 'Truck', 'c1000000-0000-0000-0000-000000000001', '#ef4444'),
  ('c1000000-0000-0000-0000-000000000105', 'Auto Parts', 'auto-parts', 'Settings', 'c1000000-0000-0000-0000-000000000001', '#ef4444'),
  ('c1000000-0000-0000-0000-000000000106', 'Heavy Machinery', 'heavy-machinery', 'Cog', 'c1000000-0000-0000-0000-000000000001', '#ef4444')
ON CONFLICT DO NOTHING;

-- Subcategories: Property
INSERT INTO public.categories (id, name, slug, icon, parent_id, color) VALUES
  ('c1000000-0000-0000-0000-000000000107', 'Houses', 'houses', 'Home', 'c1000000-0000-0000-0000-000000000002', '#8b5cf6'),
  ('c1000000-0000-0000-0000-000000000108', 'Apartments', 'apartments', 'Building', 'c1000000-0000-0000-0000-000000000002', '#8b5cf6'),
  ('c1000000-0000-0000-0000-000000000109', 'Plots', 'plots', 'Map', 'c1000000-0000-0000-0000-000000000002', '#8b5cf6'),
  ('c1000000-0000-0000-0000-000000000110', 'Commercial Property', 'commercial-property', 'Building2', 'c1000000-0000-0000-0000-000000000002', '#8b5cf6'),
  ('c1000000-0000-0000-0000-000000000111', 'Rentals', 'rentals', 'Key', 'c1000000-0000-0000-0000-000000000002', '#8b5cf6')
ON CONFLICT DO NOTHING;

-- Subcategories: Electronics
INSERT INTO public.categories (id, name, slug, icon, parent_id, color) VALUES
  ('c1000000-0000-0000-0000-000000000112', 'Mobile Phones', 'mobile-phones', 'Smartphone', 'c1000000-0000-0000-0000-000000000003', '#3b82f6'),
  ('c1000000-0000-0000-0000-000000000113', 'Tablets', 'tablets', 'Tablet', 'c1000000-0000-0000-0000-000000000003', '#3b82f6'),
  ('c1000000-0000-0000-0000-000000000114', 'Laptops', 'laptops', 'Laptop', 'c1000000-0000-0000-0000-000000000003', '#3b82f6'),
  ('c1000000-0000-0000-0000-000000000115', 'Computers', 'computers', 'Monitor', 'c1000000-0000-0000-0000-000000000003', '#3b82f6'),
  ('c1000000-0000-0000-0000-000000000116', 'Cameras', 'cameras', 'Camera', 'c1000000-0000-0000-0000-000000000003', '#3b82f6'),
  ('c1000000-0000-0000-0000-000000000117', 'Gaming Consoles', 'gaming-consoles', 'Gamepad2', 'c1000000-0000-0000-0000-000000000003', '#3b82f6'),
  ('c1000000-0000-0000-0000-000000000118', 'Accessories', 'electronics-accessories', 'Headphones', 'c1000000-0000-0000-0000-000000000003', '#3b82f6')
ON CONFLICT DO NOTHING;

-- Subcategories: Jobs
INSERT INTO public.categories (id, name, slug, icon, parent_id, color) VALUES
  ('c1000000-0000-0000-0000-000000000119', 'Full-Time', 'full-time', 'Briefcase', 'c1000000-0000-0000-0000-000000000004', '#10b981'),
  ('c1000000-0000-0000-0000-000000000120', 'Part-Time', 'part-time', 'Clock', 'c1000000-0000-0000-0000-000000000004', '#10b981'),
  ('c1000000-0000-0000-0000-000000000121', 'Remote', 'remote', 'Globe', 'c1000000-0000-0000-0000-000000000004', '#10b981'),
  ('c1000000-0000-0000-0000-000000000122', 'Freelance', 'freelance', 'User', 'c1000000-0000-0000-0000-000000000004', '#10b981'),
  ('c1000000-0000-0000-0000-000000000123', 'Internship', 'internship', 'GraduationCap', 'c1000000-0000-0000-0000-000000000004', '#10b981')
ON CONFLICT DO NOTHING;

-- Subcategories: Fashion
INSERT INTO public.categories (id, name, slug, icon, parent_id, color) VALUES
  ('Men''s Fashion', 'mens-fashion', 'User', 'c1000000-0000-0000-0000-000000000005', '#ec4899'),
  ('Women''s Fashion', 'womens-fashion', 'User', 'c1000000-0000-0000-0000-000000000005', '#ec4899'),
  ('c1000000-0000-0000-0000-000000000126', 'Shoes', 'shoes', 'Footprints', 'c1000000-0000-0000-0000-000000000005', '#ec4899'),
  ('c1000000-0000-0000-0000-000000000127', 'Watches', 'watches', 'Watch', 'c1000000-0000-0000-0000-000000000005', '#ec4899'),
  ('c1000000-0000-0000-0000-000000000128', 'Jewelry', 'jewelry', 'Gem', 'c1000000-0000-0000-0000-000000000005', '#ec4899'),
  ('c1000000-0000-0000-0000-000000000129', 'Cosmetics', 'cosmetics', 'Sparkles', 'c1000000-0000-0000-0000-000000000005', '#ec4899')
ON CONFLICT DO NOTHING;

-- Subcategories: Pets
INSERT INTO public.categories (id, name, slug, icon, parent_id, color) VALUES
  ('c1000000-0000-0000-0000-000000000147', 'Dogs', 'dogs', 'PawPrint', 'c1000000-0000-0000-0000-000000000009', '#f97316'),
  ('c1000000-0000-0000-0000-000000000148', 'Cats', 'cats', 'Cat', 'c1000000-0000-0000-0000-000000000009', '#f97316'),
  ('c1000000-0000-0000-0000-000000000149', 'Birds', 'birds', 'Bird', 'c1000000-0000-0000-0000-000000000009', '#f97316'),
  ('c1000000-0000-0000-0000-000000000150', 'Fish', 'fish', 'Fish', 'c1000000-0000-0000-0000-000000000009', '#f97316'),
  ('c1000000-0000-0000-0000-000000000151', 'Pet Accessories', 'pet-accessories', 'ShoppingBag', 'c1000000-0000-0000-0000-000000000009', '#f97316')
ON CONFLICT DO NOTHING;

-- Subcategories: Home & Office Repair
INSERT INTO public.categories (id, name, slug, icon, parent_id, color) VALUES
  ('d1000000-0000-0000-0000-000000000e10', 'Painters', 'painters', 'Paintbrush', 'd1000000-0000-0000-0000-000000000d15', '#06b6d4'),
  ('d1000000-0000-0000-0000-000000000e11', 'Electricians', 'electricians', 'Zap', 'd1000000-0000-0000-0000-000000000d15', '#06b6d4'),
  ('d1000000-0000-0000-0000-000000000e12', 'Plumbers', 'plumbers', 'Droplets', 'd1000000-0000-0000-0000-000000000d15', '#06b6d4'),
  ('d1000000-0000-0000-0000-000000000e13', 'Carpenters', 'carpenters', 'Hammer', 'd1000000-0000-0000-0000-000000000d15', '#06b6d4'),
  ('d1000000-0000-0000-0000-000000000e14', 'Pest Control', 'pest-control', 'Bug', 'd1000000-0000-0000-0000-000000000d15', '#06b6d4'),
  ('d1000000-0000-0000-0000-000000000e15', 'Water Tank Cleaning', 'water-tank-cleaning', 'Droplets', 'd1000000-0000-0000-0000-000000000d15', '#06b6d4'),
  ('d1000000-0000-0000-0000-000000000e16', 'Deep Cleaning', 'deep-cleaning', 'Sparkles', 'd1000000-0000-0000-0000-000000000d15', '#06b6d4'),
  ('d1000000-0000-0000-0000-000000000e17', 'Geyser Services', 'geyser-services', 'Flame', 'd1000000-0000-0000-0000-000000000d15', '#06b6d4'),
  ('d1000000-0000-0000-0000-000000000e18', 'AC Services', 'ac-services', 'Wind', 'd1000000-0000-0000-0000-000000000d15', '#06b6d4'),
  ('d1000000-0000-0000-0000-000000000e19', 'Other Repair Services', 'other-repair-services', 'Wrench', 'd1000000-0000-0000-0000-000000000d15', '#06b6d4')
ON CONFLICT DO NOTHING;

-- Subcategories: Health & Beauty
INSERT INTO public.categories (id, name, slug, icon, parent_id, color) VALUES
  ('d1000000-0000-0000-0000-000000000e20', 'Beauty & Spa', 'beauty-spa', 'Sparkles', 'd1000000-0000-0000-0000-000000000d14', '#06b6d4'),
  ('d1000000-0000-0000-0000-000000000e21', 'Fitness Trainers', 'fitness-trainers', 'Activity', 'd1000000-0000-0000-0000-000000000d14', '#06b6d4'),
  ('d1000000-0000-0000-0000-000000000e22', 'Health Services', 'health-services', 'Heart', 'd1000000-0000-0000-0000-000000000d14', '#06b6d4')
ON CONFLICT DO NOTHING;

-- Subcategories: Business & Industrial
INSERT INTO public.categories (id, name, slug, icon, parent_id, color) VALUES
  ('d1000000-0000-0000-0000-000000000f01', 'Business for Sale', 'business-for-sale', 'Store', 'c1000000-0000-0000-0000-000000000011', '#64748b'),
  ('d1000000-0000-0000-0000-000000000f02', 'Food & Restaurants', 'food-restaurants', 'Utensils', 'c1000000-0000-0000-0000-000000000011', '#64748b'),
  ('d1000000-0000-0000-0000-000000000f03', 'Construction & Heavy Machinery', 'construction-heavy-machinery', 'HardHat', 'c1000000-0000-0000-0000-000000000011', '#64748b'),
  ('d1000000-0000-0000-0000-000000000f04', 'Agriculture', 'biz-agriculture', 'Leaf', 'c1000000-0000-0000-0000-000000000011', '#64748b'),
  ('d1000000-0000-0000-0000-000000000f05', 'Medical & Pharma', 'medical-pharma', 'Stethoscope', 'c1000000-0000-0000-0000-000000000011', '#64748b'),
  ('d1000000-0000-0000-0000-000000000f06', 'Trade & Industrial Machinery', 'trade-industrial-machinery', 'Cog', 'c1000000-0000-0000-0000-000000000011', '#64748b'),
  ('d1000000-0000-0000-0000-000000000f07', 'Other Business & Industry', 'other-business-industry', 'Briefcase', 'c1000000-0000-0000-0000-000000000011', '#64748b')
ON CONFLICT DO NOTHING;

-- Sub-subcategories: Business for Sale
INSERT INTO public.categories (id, name, slug, icon, parent_id, color) VALUES
  ('d1000000-0000-0000-0000-000000000f10', 'Mobile Shops', 'mobile-shops', 'Smartphone', 'd1000000-0000-0000-0000-000000000f01', '#64748b'),
  ('d1000000-0000-0000-0000-000000000f11', 'Water Plants', 'water-plants', 'Droplets', 'd1000000-0000-0000-0000-000000000f01', '#64748b'),
  ('d1000000-0000-0000-0000-000000000f12', 'Beauty Salons', 'beauty-salons', 'Sparkles', 'd1000000-0000-0000-0000-000000000f01', '#64748b'),
  ('d1000000-0000-0000-0000-000000000f13', 'Grocery Stores', 'grocery-stores', 'ShoppingCart', 'd1000000-0000-0000-0000-000000000f01', '#64748b'),
  ('d1000000-0000-0000-0000-000000000f14', 'Hotels & Restaurants', 'hotels-restaurants', 'Utensils', 'd1000000-0000-0000-0000-000000000f01', '#64748b'),
  ('d1000000-0000-0000-0000-000000000f15', 'Pharmacies', 'pharmacies', 'Pill', 'd1000000-0000-0000-0000-000000000f01', '#64748b'),
  ('d1000000-0000-0000-0000-000000000f16', 'Snooker Clubs', 'snooker-clubs', 'Trophy', 'd1000000-0000-0000-0000-000000000f01', '#64748b'),
  ('d1000000-0000-0000-0000-000000000f17', 'Cosmetic & Jewellery Shops', 'cosmetic-jewellery-shops', 'Sparkles', 'd1000000-0000-0000-0000-000000000f01', '#64748b'),
  ('d1000000-0000-0000-0000-000000000f18', 'Gyms', 'gyms', 'Dumbbell', 'd1000000-0000-0000-0000-000000000f01', '#64748b'),
  ('d1000000-0000-0000-0000-000000000f19', 'Clinics', 'clinics', 'Stethoscope', 'd1000000-0000-0000-0000-000000000f01', '#64748b'),
  ('d1000000-0000-0000-0000-000000000f20', 'Franchises', 'franchises', 'Building2', 'd1000000-0000-0000-0000-000000000f01', '#64748b'),
  ('d1000000-0000-0000-0000-000000000f21', 'Gift & Toy Shops', 'gift-toy-shops', 'Gift', 'd1000000-0000-0000-0000-000000000f01', '#64748b'),
  ('d1000000-0000-0000-0000-000000000f22', 'Petrol Pumps', 'petrol-pumps', 'Fuel', 'd1000000-0000-0000-0000-000000000f01', '#64748b'),
  ('d1000000-0000-0000-0000-000000000f23', 'Auto Part Shops', 'auto-part-shops', 'Settings', 'd1000000-0000-0000-0000-000000000f01', '#64748b'),
  ('d1000000-0000-0000-0000-000000000f24', 'Other Businesses', 'other-businesses', 'Briefcase', 'd1000000-0000-0000-0000-000000000f01', '#64748b')
ON CONFLICT DO NOTHING;

-- Sub-subcategories: Food & Restaurants
INSERT INTO public.categories (id, name, slug, icon, parent_id, color) VALUES
  ('d1000000-0000-0000-0000-000000000f30', 'Baking Equipments', 'baking-equipments', 'Utensils', 'd1000000-0000-0000-0000-000000000f02', '#64748b'),
  ('d1000000-0000-0000-0000-000000000f31', 'Food Display Counters', 'food-display-counters', 'Store', 'd1000000-0000-0000-0000-000000000f02', '#64748b'),
  ('d1000000-0000-0000-0000-000000000f32', 'Ovens & Tandoor', 'ovens-tandoor', 'Flame', 'd1000000-0000-0000-0000-000000000f02', '#64748b'),
  ('d1000000-0000-0000-0000-000000000f33', 'Fryers', 'fryers', 'Flame', 'd1000000-0000-0000-0000-000000000f02', '#64748b'),
  ('d1000000-0000-0000-0000-000000000f34', 'Tables & Platforms', 'tables-platforms', 'Layers', 'd1000000-0000-0000-0000-000000000f02', '#64748b'),
  ('d1000000-0000-0000-0000-000000000f35', 'Fruit & Vegetable Machines', 'fruit-vegetable-machines', 'Apple', 'd1000000-0000-0000-0000-000000000f02', '#64748b'),
  ('d1000000-0000-0000-0000-000000000f36', 'Chillers', 'chillers', 'Thermometer', 'd1000000-0000-0000-0000-000000000f02', '#64748b'),
  ('d1000000-0000-0000-0000-000000000f37', 'Food Stalls', 'food-stalls', 'Store', 'd1000000-0000-0000-0000-000000000f02', '#64748b'),
  ('d1000000-0000-0000-0000-000000000f38', 'Delivery Bags', 'delivery-bags', 'ShoppingBag', 'd1000000-0000-0000-0000-000000000f02', '#64748b'),
  ('d1000000-0000-0000-0000-000000000f39', 'Crockery & Cutlery', 'crockery-cutlery', 'Utensils', 'd1000000-0000-0000-0000-000000000f02', '#64748b'),
  ('d1000000-0000-0000-0000-000000000f40', 'Ice cream Machines', 'ice-cream-machines', 'Sparkles', 'd1000000-0000-0000-0000-000000000f02', '#64748b'),
  ('d1000000-0000-0000-0000-000000000f41', 'Other Restaurant Equipments', 'other-restaurant-equipments', 'Wrench', 'd1000000-0000-0000-0000-000000000f02', '#64748b')
ON CONFLICT DO NOTHING;

-- Sub-subcategories: Construction & Heavy Machinery
INSERT INTO public.categories (id, name, slug, icon, parent_id, color) VALUES
  ('d1000000-0000-0000-0000-000000000f50', 'Construction Material', 'construction-material', 'Building', 'd1000000-0000-0000-0000-000000000f03', '#64748b'),
  ('d1000000-0000-0000-0000-000000000f51', 'Concrete Grinders', 'concrete-grinders', 'Cog', 'd1000000-0000-0000-0000-000000000f03', '#64748b'),
  ('d1000000-0000-0000-0000-000000000f52', 'Drill Machines', 'drill-machines', 'Zap', 'd1000000-0000-0000-0000-000000000f03', '#64748b'),
  ('d1000000-0000-0000-0000-000000000f53', 'Loaders', 'loaders', 'Truck', 'd1000000-0000-0000-0000-000000000f03', '#64748b'),
  ('d1000000-0000-0000-0000-000000000f54', 'Concrete Mixers', 'concrete-mixers', 'Cog', 'd1000000-0000-0000-0000-000000000f03', '#64748b'),
  ('d1000000-0000-0000-0000-000000000f55', 'Road Roller', 'road-roller', 'Truck', 'd1000000-0000-0000-0000-000000000f03', '#64748b'),
  ('d1000000-0000-0000-0000-000000000f56', 'Cranes', 'cranes', 'HardHat', 'd1000000-0000-0000-0000-000000000f03', '#64748b'),
  ('d1000000-0000-0000-0000-000000000f57', 'Construction Lifters', 'construction-lifters', 'HardHat', 'd1000000-0000-0000-0000-000000000f03', '#64748b'),
  ('d1000000-0000-0000-0000-000000000f58', 'Pavers', 'pavers', 'Truck', 'd1000000-0000-0000-0000-000000000f03', '#64748b'),
  ('d1000000-0000-0000-0000-000000000f59', 'Excavators', 'excavators', 'Truck', 'd1000000-0000-0000-0000-000000000f03', '#64748b'),
  ('d1000000-0000-0000-0000-000000000f60', 'Concrete Cutters', 'concrete-cutters', 'Scissors', 'd1000000-0000-0000-0000-000000000f03', '#64748b'),
  ('d1000000-0000-0000-0000-000000000f61', 'Compactors', 'compactors', 'Cog', 'd1000000-0000-0000-0000-000000000f03', '#64748b'),
  ('d1000000-0000-0000-0000-000000000f62', 'Water Pumps', 'water-pumps', 'Droplets', 'd1000000-0000-0000-0000-000000000f03', '#64748b'),
  ('d1000000-0000-0000-0000-000000000f63', 'Bulldozers', 'bulldozers', 'Truck', 'd1000000-0000-0000-0000-000000000f03', '#64748b'),
  ('d1000000-0000-0000-0000-000000000f64', 'Air Compressors', 'air-compressors', 'Wind', 'd1000000-0000-0000-0000-000000000f03', '#64748b'),
  ('d1000000-0000-0000-0000-000000000f65', 'Dump Truck', 'dump-truck', 'Truck', 'd1000000-0000-0000-0000-000000000f03', '#64748b'),
  ('d1000000-0000-0000-0000-000000000f66', 'Motor Graders', 'motor-graders', 'Truck', 'd1000000-0000-0000-0000-000000000f03', '#64748b'),
  ('d1000000-0000-0000-0000-000000000f67', 'Other Heavy Equipments', 'other-heavy-equipments', 'Wrench', 'd1000000-0000-0000-0000-000000000f03', '#64748b')
ON CONFLICT DO NOTHING;

-- Sub-subcategories: Agriculture
INSERT INTO public.categories (id, name, slug, icon, parent_id, color) VALUES
  ('d1000000-0000-0000-0000-000000000f70', 'Farm Machinery & Equipments', 'farm-machinery-equipments', 'Tractor', 'd1000000-0000-0000-0000-000000000f04', '#64748b'),
  ('d1000000-0000-0000-0000-000000000f71', 'Seeds', 'biz-seeds', 'Leaf', 'd1000000-0000-0000-0000-000000000f04', '#64748b'),
  ('d1000000-0000-0000-0000-000000000f72', 'Crops', 'biz-crops', 'Leaf', 'd1000000-0000-0000-0000-000000000f04', '#64748b'),
  ('d1000000-0000-0000-0000-000000000f73', 'Pesticides & Fertilizers', 'pesticides-fertilizers', 'Flask', 'd1000000-0000-0000-0000-000000000f04', '#64748b'),
  ('d1000000-0000-0000-0000-000000000f74', 'Plants & Trees', 'plants-trees', 'Leaf', 'd1000000-0000-0000-0000-000000000f04', '#64748b'),
  ('d1000000-0000-0000-0000-000000000f75', 'Other Agriculture', 'other-agriculture', 'Leaf', 'd1000000-0000-0000-0000-000000000f04', '#64748b'),
  ('d1000000-0000-0000-0000-000000000f76', 'Silage', 'silage', 'Leaf', 'd1000000-0000-0000-0000-000000000f04', '#64748b')
ON CONFLICT DO NOTHING;

-- Sub-subcategories: Medical & Pharma
INSERT INTO public.categories (id, name, slug, icon, parent_id, color) VALUES
  ('d1000000-0000-0000-0000-000000000f80', 'Ultrasound Machines', 'ultrasound-machines', 'Activity', 'd1000000-0000-0000-0000-000000000f05', '#64748b'),
  ('d1000000-0000-0000-0000-000000000f81', 'Surgical Masks', 'surgical-masks', 'Shield', 'd1000000-0000-0000-0000-000000000f05', '#64748b'),
  ('d1000000-0000-0000-0000-000000000f82', 'Patient Beds', 'patient-beds', 'Heart', 'd1000000-0000-0000-0000-000000000f05', '#64748b'),
  ('d1000000-0000-0000-0000-000000000f83', 'Wheelchairs', 'wheelchairs', 'Heart', 'd1000000-0000-0000-0000-000000000f05', '#64748b'),
  ('d1000000-0000-0000-0000-000000000f84', 'Oxygen Concentrators', 'oxygen-concentrators', 'Wind', 'd1000000-0000-0000-0000-000000000f05', '#64748b'),
  ('d1000000-0000-0000-0000-000000000f85', 'Oxygen Cylinders', 'oxygen-cylinders', 'Wind', 'd1000000-0000-0000-0000-000000000f05', '#64748b'),
  ('d1000000-0000-0000-0000-000000000f86', 'Pulse Oximeters', 'pulse-oximeters', 'Activity', 'd1000000-0000-0000-0000-000000000f05', '#64748b'),
  ('d1000000-0000-0000-0000-000000000f87', 'Hearing Aids', 'hearing-aids', 'Heart', 'd1000000-0000-0000-0000-000000000f05', '#64748b'),
  ('d1000000-0000-0000-0000-000000000f88', 'Blood Pressure Monitors', 'blood-pressure-monitors', 'Activity', 'd1000000-0000-0000-0000-000000000f05', '#64748b'),
  ('d1000000-0000-0000-0000-000000000f89', 'Thermometers', 'thermometers', 'Thermometer', 'd1000000-0000-0000-0000-000000000f05', '#64748b'),
  ('d1000000-0000-0000-0000-000000000f90', 'Walkers', 'walkers', 'Heart', 'd1000000-0000-0000-0000-000000000f05', '#64748b'),
  ('d1000000-0000-0000-0000-000000000f91', 'Nebulizers', 'nebulizers', 'Wind', 'd1000000-0000-0000-0000-000000000f05', '#64748b'),
  ('d1000000-0000-0000-0000-000000000f92', 'Sanitizers', 'sanitizers', 'Droplets', 'd1000000-0000-0000-0000-000000000f05', '#64748b'),
  ('d1000000-0000-0000-0000-000000000f93', 'Surgical Gloves', 'surgical-gloves', 'Shield', 'd1000000-0000-0000-0000-000000000f05', '#64748b'),
  ('d1000000-0000-0000-0000-000000000f94', 'X-ray Machines', 'x-ray-machines', 'Activity', 'd1000000-0000-0000-0000-000000000f05', '#64748b'),
  ('d1000000-0000-0000-0000-000000000f95', 'Medical Lighting', 'medical-lighting', 'Zap', 'd1000000-0000-0000-0000-000000000f05', '#64748b'),
  ('d1000000-0000-0000-0000-000000000f96', 'Medicines', 'medicines', 'Pill', 'd1000000-0000-0000-0000-000000000f05', '#64748b'),
  ('d1000000-0000-0000-0000-000000000f97', 'Glucometers', 'glucometers', 'Activity', 'd1000000-0000-0000-0000-000000000f05', '#64748b'),
  ('d1000000-0000-0000-0000-000000000f98', 'Breast Pumps', 'breast-pumps', 'Heart', 'd1000000-0000-0000-0000-000000000f05', '#64748b'),
  ('d1000000-0000-0000-0000-000000000f99', 'Commode Chairs', 'commode-chairs', 'Heart', 'd1000000-0000-0000-0000-000000000f05', '#64748b'),
  ('d1000000-0000-0000-0000-000000000fa0', 'Surgical Instruments', 'surgical-instruments', 'Scissors', 'd1000000-0000-0000-0000-000000000f05', '#64748b'),
  ('d1000000-0000-0000-0000-000000000fa1', 'Medical Scrubs', 'medical-scrubs', 'Shield', 'd1000000-0000-0000-0000-000000000f05', '#64748b'),
  ('d1000000-0000-0000-0000-000000000fa2', 'Weighing Scales', 'weighing-scales', 'Activity', 'd1000000-0000-0000-0000-000000000f05', '#64748b'),
  ('d1000000-0000-0000-0000-000000000fa3', 'Health Accessories', 'health-accessories', 'Heart', 'd1000000-0000-0000-0000-000000000f05', '#64748b'),
  ('d1000000-0000-0000-0000-000000000fa4', 'Microscopes', 'microscopes', 'Stethoscope', 'd1000000-0000-0000-0000-000000000f05', '#64748b'),
  ('d1000000-0000-0000-0000-000000000fa5', 'Other Medical Supplies', 'other-medical-supplies', 'Stethoscope', 'd1000000-0000-0000-0000-000000000f05', '#64748b')
ON CONFLICT DO NOTHING;

-- Sub-subcategories: Trade & Industrial Machinery
INSERT INTO public.categories (id, name, slug, icon, parent_id, color) VALUES
  ('d1000000-0000-0000-0000-000000000fb0', 'Woodworking Machines', 'woodworking-machines', 'Wrench', 'd1000000-0000-0000-0000-000000000f06', '#64748b'),
  ('d1000000-0000-0000-0000-000000000fb1', 'Currency Counting Machines', 'currency-counting-machines', 'Briefcase', 'd1000000-0000-0000-0000-000000000f06', '#64748b'),
  ('d1000000-0000-0000-0000-000000000fb2', 'Plastic & Rubber Processing Machines', 'plastic-rubber-processing-machines', 'Cog', 'd1000000-0000-0000-0000-000000000f06', '#64748b'),
  ('d1000000-0000-0000-0000-000000000fb3', 'Industry Laser Machines', 'industry-laser-machines', 'Zap', 'd1000000-0000-0000-0000-000000000f06', '#64748b'),
  ('d1000000-0000-0000-0000-000000000fb4', 'Molding Machines', 'molding-machines', 'Cog', 'd1000000-0000-0000-0000-000000000f06', '#64748b'),
  ('d1000000-0000-0000-0000-000000000fb5', 'Packaging Machines', 'packaging-machines', 'Package', 'd1000000-0000-0000-0000-000000000f06', '#64748b'),
  ('d1000000-0000-0000-0000-000000000fb6', 'Welding Equipments', 'welding-equipments', 'Flame', 'd1000000-0000-0000-0000-000000000f06', '#64748b'),
  ('d1000000-0000-0000-0000-000000000fb7', 'Paper Machines', 'paper-machines', 'Cog', 'd1000000-0000-0000-0000-000000000f06', '#64748b'),
  ('d1000000-0000-0000-0000-000000000fb8', 'Air Compressors', 'biz-air-compressors', 'Wind', 'd1000000-0000-0000-0000-000000000f06', '#64748b'),
  ('d1000000-0000-0000-0000-000000000fb9', 'Sealing Machines', 'sealing-machines', 'Package', 'd1000000-0000-0000-0000-000000000f06', '#64748b'),
  ('d1000000-0000-0000-0000-000000000fc0', 'Lathe Machines', 'lathe-machines', 'Cog', 'd1000000-0000-0000-0000-000000000f06', '#64748b'),
  ('d1000000-0000-0000-0000-000000000fc1', 'Liquid Filling Machines', 'liquid-filling-machines', 'Droplets', 'd1000000-0000-0000-0000-000000000f06', '#64748b'),
  ('d1000000-0000-0000-0000-000000000fc2', 'Marking Machines', 'marking-machines', 'Cog', 'd1000000-0000-0000-0000-000000000f06', '#64748b'),
  ('d1000000-0000-0000-0000-000000000fc3', 'Textile Machinery', 'textile-machinery', 'Scissors', 'd1000000-0000-0000-0000-000000000f06', '#64748b'),
  ('d1000000-0000-0000-0000-000000000fc4', 'Sewing Machines', 'biz-sewing-machines', 'Scissors', 'd1000000-0000-0000-0000-000000000f06', '#64748b'),
  ('d1000000-0000-0000-0000-000000000fc5', 'Knitting Machines', 'knitting-machines', 'Scissors', 'd1000000-0000-0000-0000-000000000f06', '#64748b'),
  ('d1000000-0000-0000-0000-000000000fc6', 'Embroidery Machines', 'embroidery-machines', 'Sparkles', 'd1000000-0000-0000-0000-000000000f06', '#64748b'),
  ('d1000000-0000-0000-0000-000000000fc7', 'Printing Machines', 'printing-machines', 'Printer', 'd1000000-0000-0000-0000-000000000f06', '#64748b'),
  ('d1000000-0000-0000-0000-000000000fc8', 'Other Business & Industrial Machines', 'other-biz-industrial-machines', 'Wrench', 'd1000000-0000-0000-0000-000000000f06', '#64748b')
ON CONFLICT DO NOTHING;

-- RPC function to manually create an admin user
CREATE OR REPLACE FUNCTION public.create_admin_user(
  admin_password TEXT,
  admin_name TEXT,
  admin_phone TEXT DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  new_user_id UUID;
BEGIN
  -- Check if caller is super_admin
  IF NOT EXISTS (
    SELECT 1 FROM public.users
    WHERE id = auth.uid() AND role = 'super_admin'
  ) THEN
    RAISE EXCEPTION 'Only super admins can create admin users.';
  END IF;

  -- Generate a new UUID
  new_user_id := extensions.uuid_generate_v4();
  
  -- Insert into auth.users
  INSERT INTO auth.users (
    id,
    instance_id,
    email,
    encrypted_password,
    email_confirmed_at,
    raw_app_meta_data,
    raw_user_meta_data,
    created_at,
    updated_at,
    role,
    aud,
    phone,
    phone_confirmed_at
  )
  VALUES (
    new_user_id,
    '00000000-0000-0000-0000-000000000000',
    admin_email,
    crypt(admin_password, gen_salt('bf')),
    now(),
    '{"provider":"email","providers":["email"]}',
    jsonb_build_object('full_name', admin_name),
    now(),
    now(),
    'authenticated',
    'authenticated',
    admin_phone,
    CASE WHEN admin_phone IS NOT NULL THEN now() ELSE NULL END
  );

  -- Insert into public.users
  INSERT INTO public.users (
    id,
    email,
    full_name,
    phone,
    role,
    roles,
    is_verified,
    is_active
  )
  VALUES (
    new_user_id,
    admin_email,
    admin_name,
    admin_phone,
    'admin',
    ARRAY['admin']::user_role[],
    true,
    true
  )
  ON CONFLICT (id) DO UPDATE SET
    role = 'admin',
    roles = ARRAY['admin']::user_role[],
    is_verified = true,
    full_name = EXCLUDED.full_name,
    phone = EXCLUDED.phone;

  RETURN new_user_id;
END;
$$;

-- RPC function to invite user safely by admin (sets up auth.users and public.users inactive profiles)
CREATE OR REPLACE FUNCTION public.invite_user_by_admin(
  user_email TEXT,
  user_full_name TEXT,
  user_phone TEXT,
  user_role public.user_role
)
  user_role public.user_role,
  user_password TEXT
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  new_user_id UUID;
  enc_pwd TEXT;
  caller_role public.user_role;
BEGIN
  -- 1. Check if caller has permissions and enforce role hierarchy
  SELECT role INTO caller_role FROM public.users WHERE id = auth.uid();

  IF caller_role IS NULL THEN
    RAISE EXCEPTION 'Unauthorized.';
  END IF;

  IF caller_role = 'admin' THEN
    IF user_role != 'moderator' THEN
      RAISE EXCEPTION 'Admins can only create Moderators.';
    END IF;
  ELSIF caller_role != 'super_admin' THEN
    RAISE EXCEPTION 'Only admins or super admins can invite users.';
  END IF;

  -- Ensure nobody can invite a super_admin
  IF user_role = 'super_admin' THEN
    RAISE EXCEPTION 'Cannot invite a Super Admin.';
  END IF;

  -- 2. Check if user already exists in public.users
  SELECT id INTO new_user_id FROM public.users WHERE email = user_email;

  -- Encrypt password
  enc_pwd := crypt(user_password, gen_salt('bf'));

  IF new_user_id IS NOT NULL THEN
    -- Check if they are already active and have changed their temporary password
    IF EXISTS (SELECT 1 FROM public.users WHERE id = new_user_id AND is_active = true AND is_temp_password = false) THEN
      RAISE EXCEPTION 'An active user with this email address already exists.';
    END IF;
    
    -- If they exist but are pending/inactive, reuse their ID and update profile
    UPDATE public.users
    SET full_name = user_full_name,
        phone = user_phone,
        role = user_role::public.user_role,
        roles = ARRAY[user_role::public.user_role]::public.user_role[],
        is_temp_password = true,
        is_active = true,
        email_verified = true,
        updated_at = now()
    WHERE id = new_user_id;

    -- Update password in auth.users
    UPDATE auth.users
    SET encrypted_password = enc_pwd,
        email_confirmed_at = now(), -- confirm email immediately on re-invite
        phone = user_phone,
        updated_at = now()
    WHERE id = new_user_id;

    -- Update invitation status
    UPDATE public.invitations
    SET status = 'pending',
        expires_at = now() + interval '24 hours'
    WHERE id = new_user_id;

    RETURN new_user_id;
  END IF;

  -- Generate new ID
  new_user_id := extensions.uuid_generate_v4();

  -- 3. Insert into auth.users (active, confirmed email)
  INSERT INTO auth.users (
    id,
    instance_id,
    email,
    encrypted_password,
    email_confirmed_at,
    raw_app_meta_data,
    raw_user_meta_data,
    created_at,
    updated_at,
    role,
    aud,
    phone
  )
  VALUES (
    new_user_id,
    '00000000-0000-0000-0000-000000000000',
    user_email,
    enc_pwd,
    now(), -- confirmed email immediately on invite
    '{"provider":"email","providers":["email"]}',
    jsonb_build_object('full_name', user_full_name, 'role', user_role),
    now(),
    now(),
    'authenticated',
    'authenticated',
    user_phone
  );

  -- 4. Insert into public.users (active, verified email, with temporary password flag)
  INSERT INTO public.users (
    id,
    email,
    full_name,
    phone,
    role,
    roles,
    is_verified,
    email_verified,
    is_temp_password,
    is_active,
    created_at,
    updated_at
  )
  VALUES (
    new_user_id,
    user_email,
    user_full_name,
    user_phone,
    user_role::public.user_role,
    ARRAY[user_role::public.user_role]::public.user_role[],
    true,
    true, -- email verified
    true, -- temp password
    true, -- active
    now(),
    now()
  );

  -- 5. Insert into invitations
  INSERT INTO public.invitations (
    id,
    email,
    role,
    expires_at,
    status,
    created_at
  )
  VALUES (
    new_user_id,
    user_email,
    user_role::public.user_role,
    now() + interval '24 hours',
    'pending',
    now()
  );

  RETURN new_user_id;
END;
$$;

-- RPC function to confirm invited user's invitation and activate account directly
CREATE OR REPLACE FUNCTION public.confirm_user_invitation(
  invite_token UUID,
  new_password TEXT,
  user_full_name TEXT
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  invite_email TEXT;
  invite_role public.user_role;
  enc_pwd TEXT;
BEGIN
  -- 1. Find and validate invitation
  SELECT email, role::public.user_role INTO invite_email, invite_role
  FROM public.invitations
  WHERE id = invite_token AND status = 'pending';

  IF invite_email IS NULL THEN
    RAISE EXCEPTION 'Invitation is invalid, has expired, or has already been accepted.';
  END IF;

  -- 2. Encrypt the password using bcrypt
  enc_pwd := crypt(new_password, gen_salt('bf'));

  -- 3. Create or update user in auth.users
  INSERT INTO auth.users (
    id,
    instance_id,
    email,
    encrypted_password,
    email_confirmed_at,
    raw_app_meta_data,
    raw_user_meta_data,
    created_at,
    updated_at,
    role,
    aud
  )
  VALUES (
    invite_token,
    '00000000-0000-0000-0000-000000000000',
    invite_email,
    enc_pwd,
    now(),
    '{"provider":"email","providers":["email"]}',
    jsonb_build_object('full_name', user_full_name),
    now(),
    now(),
    'authenticated',
    'authenticated'
  )
  ON CONFLICT (id) DO UPDATE SET
    encrypted_password = enc_pwd,
    email_confirmed_at = now(),
    raw_user_meta_data = jsonb_build_object('full_name', user_full_name),
    updated_at = now();

  -- 4. Create or update user profile in public.users
  INSERT INTO public.users (
    id,
    email,
    full_name,
    role,
    roles,
    is_verified,
    email_verified,
    is_temp_password,
    is_active,
    created_at,
    updated_at
  )
  VALUES (
    invite_token,
    invite_email,
    user_full_name,
    invite_role,
    ARRAY[invite_role]::public.user_role[],
    true,
    true,
    false, -- No longer temp password!
    true,
    now(),
    now()
  )
  ON CONFLICT (id) DO UPDATE SET
    full_name = user_full_name,
    role = invite_role,
    roles = ARRAY[invite_role]::public.user_role[],
    is_verified = true,
    email_verified = true,
    is_temp_password = false, -- No longer temp password!
    is_active = true,
    updated_at = now();

  -- 5. Mark invitation as accepted
  UPDATE public.invitations
  SET status = 'accepted'
  WHERE id = invite_token;

  RETURN TRUE;
END;
$$;

-- RPC function to manually update an admin user
CREATE OR REPLACE FUNCTION public.update_admin_user(
  target_user_id UUID,
  new_email TEXT,
  new_name TEXT,
  new_phone TEXT,
  new_password TEXT DEFAULT NULL
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Check if caller is super_admin
  IF NOT EXISTS (
    SELECT 1 FROM public.users
    WHERE id = auth.uid() AND role = 'super_admin'
  ) THEN
    RAISE EXCEPTION 'Only super admins can update admin users.';
  END IF;

  -- Update auth.users
  UPDATE auth.users
  SET 
    email = new_email,
    encrypted_password = CASE WHEN new_password IS NOT NULL THEN crypt(new_password, gen_salt('bf')) ELSE encrypted_password END,
    email_confirmed_at = CASE WHEN email <> new_email THEN now() ELSE email_confirmed_at END,
    raw_user_meta_data = raw_user_meta_data || jsonb_build_object('full_name', new_name),
    phone = new_phone,
    phone_confirmed_at = CASE WHEN new_phone IS NOT NULL AND (phone IS NULL OR phone <> new_phone) THEN now() ELSE phone_confirmed_at END,
    updated_at = now()
  WHERE id = target_user_id;

  -- Update public.users profile
  UPDATE public.users
  SET
    email = new_email,
    full_name = new_name,
    phone = new_phone,
    updated_at = now()
  WHERE id = target_user_id;
END;
$$;

-- Seed attribute schemas for specific categories
-- Mobile Phones (c1000000-0000-0000-0000-000000000112)
UPDATE public.categories 
SET attributes_schema = '[
  {"name": "brand", "label": "Brand", "type": "select", "options": ["Apple", "Samsung", "Xiaomi", "Oppo", "Vivo", "Infinix", "Realme", "Google", "OnePlus", "Nokia", "Motorola"], "required": true},
  {"name": "model", "label": "Model", "type": "text", "required": true},
  {"name": "pta_status", "label": "PTA Status", "type": "select", "options": ["Approved", "Not Approved", "Patched"], "required": true},
  {"name": "sim_slots", "label": "SIM Slots", "type": "select", "options": ["Single SIM", "Dual SIM", "eSIM", "Dual eSIM"], "required": true},
  {"name": "ram", "label": "RAM (GB)", "type": "select", "options": ["2 GB", "3 GB", "4 GB", "6 GB", "8 GB", "12 GB", "16 GB", "18 GB"], "required": true},
  {"name": "storage", "label": "Storage", "type": "select", "options": ["16 GB", "32 GB", "64 GB", "128 GB", "256 GB", "512 GB", "1 TB"], "required": true},
  {"name": "color", "label": "Color", "type": "text", "required": true},
  {"name": "condition", "label": "Condition", "type": "select", "options": ["New", "Like New", "Good", "Fair", "Poor"], "required": true},
  {"name": "warranty", "label": "Warranty", "type": "select", "options": ["No Warranty", "Local Warranty", "International Warranty", "Brand Warranty"], "required": true},
  {"name": "accessories", "label": "Accessories Included", "type": "text", "required": false},
  {"name": "battery_health", "label": "Battery Health (%)", "type": "number", "required": false},
  {"name": "imei", "label": "IMEI (Optional)", "type": "text", "required": false}
]''::jsonb, 
image_url = ''https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?q=80&w=600''
WHERE id = ''c1000000-0000-0000-0000-000000000112'';

-- Cars (c1000000-0000-0000-0000-000000000101)
UPDATE public.categories 
SET attributes_schema = ''[
  {"name": "make", "label": "Make", "type": "select", "options": ["Toyota", "Honda", "Suzuki", "Kia", "Hyundai", "Nissan", "Mitsubishi", "Daihatsu", "Audi", "BMW", "Mercedes-Benz", "Changan", "MG", "Haval", "Proton"], "required": true},
  {"name": "model", "label": "Model", "type": "text", "required": true},
  {"name": "year", "label": "Year", "type": "number", "required": true},
  {"name": "mileage", "label": "Mileage (km)", "type": "number", "required": true},
  {"name": "fuel_type", "label": "Fuel Type", "type": "select", "options": ["Petrol", "Diesel", "CNG", "Hybrid", "Electric"], "required": true},
  {"name": "transmission", "label": "Transmission", "type": "select", "options": ["Manual", "Automatic"], "required": true},
  {"name": "engine_capacity", "label": "Engine Capacity (cc)", "type": "number", "required": true},
  {"name": "registered_city", "label": "Registered City", "type": "text", "required": true},
  {"name": "color", "label": "Color", "type": "text", "required": true},
  {"name": "condition", "label": "Condition", "type": "select", "options": ["New", "Used", "Imported"], "required": true}
]''::jsonb,
image_url = ''https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?q=80&w=600''
WHERE id = ''c1000000-0000-0000-0000-000000000101'';

-- Houses (c1000000-0000-0000-0000-000000000107)
UPDATE public.categories 
SET attributes_schema = ''[
  {"name": "property_type", "label": "Property Type", "type": "select", "options": ["Residential House", "Villa", "Townhouse", "Penthouse"], "required": true},
  {"name": "bedrooms", "label": "Bedrooms", "type": "select", "options": ["Studio", "1", "2", "3", "4", "5", "6", "7+"], "required": true},
  {"name": "bathrooms", "label": "Bathrooms", "type": "select", "options": ["1", "2", "3", "4", "5", "6+", "Shared"], "required": true},
  {"name": "area", "label": "Area (Marla/Kanal/Sq.Ft)", "type": "text", "required": true},
  {"name": "furnished", "label": "Furnished", "type": "select", "options": ["Unfurnished", "Semi-Furnished", "Fully Furnished"], "required": true},
  {"name": "parking", "label": "Parking Spaces", "type": "select", "options": ["None", "1 Vehicle", "2 Vehicles", "3+ Vehicles"], "required": true},
  {"name": "purpose", "label": "Purpose", "type": "select", "options": ["For Sale", "For Rent"], "required": true}
]''::jsonb,
image_url = ''https://images.unsplash.com/photo-1580587771525-78b9dba3b914?q=80&w=600''
WHERE id = ''c1000000-0000-0000-0000-000000000107'';

-- Apartments (c1000000-0000-0000-0000-000000000108)
UPDATE public.categories 
SET attributes_schema = ''[
  {"name": "bedrooms", "label": "Bedrooms", "type": "select", "options": ["Studio", "1", "2", "3", "4", "5+"], "required": true},
  {"name": "bathrooms", "label": "Bathrooms", "type": "select", "options": ["1", "2", "3", "4+"], "required": true},
  {"name": "area", "label": "Area (Marla/Sq.Ft)", "type": "text", "required": true},
  {"name": "furnished", "label": "Furnished", "type": "select", "options": ["Unfurnished", "Semi-Furnished", "Fully Furnished"], "required": true},
  {"name": "parking", "label": "Parking Spaces", "type": "select", "options": ["None", "1 Vehicle", "2 Vehicles"], "required": true},
  {"name": "purpose", "label": "Purpose", "type": "select", "options": ["For Sale", "For Rent"], "required": true}
]'::jsonb,
image_url = 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?q=80&w=600'
WHERE id = 'c1000000-0000-0000-0000-000000000108';

-- Create table for database-driven category field options
CREATE TABLE IF NOT EXISTS public.category_field_options (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  category_id UUID NOT NULL REFERENCES public.categories(id) ON DELETE CASCADE,
  parent_id UUID REFERENCES public.category_field_options(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Indexing for fast lookups
CREATE INDEX IF NOT EXISTS idx_cfo_category ON public.category_field_options(category_id);
CREATE INDEX IF NOT EXISTS idx_cfo_parent ON public.category_field_options(parent_id);

-- Enable RLS Policies
ALTER TABLE public.category_field_options ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can view category options" ON public.category_field_options;
CREATE POLICY "Anyone can view category options" ON public.category_field_options FOR SELECT USING (true);

DROP POLICY IF EXISTS "Admins can manage category options" ON public.category_field_options;
CREATE POLICY "Admins can manage category options" ON public.category_field_options FOR ALL USING (
  EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role IN ('admin', 'super_admin'))
);

-- Seed Brands for Mobile Phones (c1000000-0000-0000-0000-000000000112)
DO $$
DECLARE
  v_cat_id UUID := 'c1000000-0000-0000-0000-000000000112';
  v_brand_id UUID;
  v_brand_name TEXT;
  v_brands TEXT[] := ARRAY[
    'Apple', 'Samsung', 'Google', 'Xiaomi', 'Vivo', 'OPPO', 'OnePlus', 'Realme', 'Tecno', 'Infinix', 
    'Motorola', 'Nokia', 'Huawei', 'Honor', 'Sony', 'LG', 'Itel', 'ZTE', 'HTC', 'Lenovo', 'Asus', 
    'BlackBerry', 'TCL', 'Microsoft', 'Panasonic', 'Acer', 'Meizu', 'Gionee', 'Lava', 'Hisense', 
    'Nothing', 'HMD', 'Philips', 'Sharp', 'Razer', 'T-Mobile', 'Fairphone', 'Cubot', 'Doogee', 
    'Ulefone', 'UMIDIGI', 'Blackview', 'Coolpad', 'Cat', 'Kyocera', 'Spice', 'Sparx', 'QMobile', 
    'Calme', 'Club', 'Mobilink JazzX', 'GFive', 'Haier', 'Voice', 'RIVO', 'G-TIDE', 'Gright', 
    'Innjoo', 'Oscal', 'Oukitel', 'Villaon', 'Wiko', 'XMobile', 'XSmart', 'AllCall', 'BLU', 
    'Archos', 'Dcode', 'Energizer', 'E-Tachi', 'Faywa', 'Gresso', 'iNew', 'KXD', 'Me Mobile', 
    'Sego', 'Sonim', 'VGO TEL', 'Vnus', 'Xtouch', 'Alcatel', 'Sony Ericsson', 'Other'
  ];
BEGIN
  FOREACH v_brand_name IN ARRAY v_brands LOOP
    -- Insert Brand if it doesn't exist
    INSERT INTO public.category_field_options (category_id, parent_id, name)
    VALUES (v_cat_id, null, v_brand_name)
    ON CONFLICT DO NOTHING;
  END LOOP;

  -- Insert Models for Apple
  SELECT id INTO v_brand_id FROM public.category_field_options WHERE category_id = v_cat_id AND parent_id IS NULL AND name = 'Apple';
  IF v_brand_id IS NOT NULL THEN
    INSERT INTO public.category_field_options (category_id, parent_id, name) VALUES
      (v_cat_id, v_brand_id, 'iPhone'),
      (v_cat_id, v_brand_id, 'iPhone 3G'),
      (v_cat_id, v_brand_id, 'iPhone 3GS'),
      (v_cat_id, v_brand_id, 'iPhone 4'),
      (v_cat_id, v_brand_id, 'iPhone 4S'),
      (v_cat_id, v_brand_id, 'iPhone 5'),
      (v_cat_id, v_brand_id, 'iPhone 5C'),
      (v_cat_id, v_brand_id, 'iPhone 5S'),
      (v_cat_id, v_brand_id, 'iPhone SE (1st Gen)'),
      (v_cat_id, v_brand_id, 'iPhone 6'),
      (v_cat_id, v_brand_id, 'iPhone 6 Plus'),
      (v_cat_id, v_brand_id, 'iPhone 6S'),
      (v_cat_id, v_brand_id, 'iPhone 6S Plus'),
      (v_cat_id, v_brand_id, 'iPhone 7'),
      (v_cat_id, v_brand_id, 'iPhone 7 Plus'),
      (v_cat_id, v_brand_id, 'iPhone 8'),
      (v_cat_id, v_brand_id, 'iPhone 8 Plus'),
      (v_cat_id, v_brand_id, 'iPhone X'),
      (v_cat_id, v_brand_id, 'iPhone XR'),
      (v_cat_id, v_brand_id, 'iPhone XS'),
      (v_cat_id, v_brand_id, 'iPhone XS Max'),
      (v_cat_id, v_brand_id, 'iPhone 11'),
      (v_cat_id, v_brand_id, 'iPhone 11 Pro'),
      (v_cat_id, v_brand_id, 'iPhone 11 Pro Max'),
      (v_cat_id, v_brand_id, 'iPhone SE (2nd Gen)'),
      (v_cat_id, v_brand_id, 'iPhone 12 Mini'),
      (v_cat_id, v_brand_id, 'iPhone 12'),
      (v_cat_id, v_brand_id, 'iPhone 12 Pro'),
      (v_cat_id, v_brand_id, 'iPhone 12 Pro Max'),
      (v_cat_id, v_brand_id, 'iPhone 13 Mini'),
      (v_cat_id, v_brand_id, 'iPhone 13'),
      (v_cat_id, v_brand_id, 'iPhone 13 Pro'),
      (v_cat_id, v_brand_id, 'iPhone 13 Pro Max'),
      (v_cat_id, v_brand_id, 'iPhone SE (3rd Gen)'),
      (v_cat_id, v_brand_id, 'iPhone 14'),
      (v_cat_id, v_brand_id, 'iPhone 14 Plus'),
      (v_cat_id, v_brand_id, 'iPhone 14 Pro'),
      (v_cat_id, v_brand_id, 'iPhone 14 Pro Max'),
      (v_cat_id, v_brand_id, 'iPhone 15'),
      (v_cat_id, v_brand_id, 'iPhone 15 Plus'),
      (v_cat_id, v_brand_id, 'iPhone 15 Pro'),
      (v_cat_id, v_brand_id, 'iPhone 15 Pro Max'),
      (v_cat_id, v_brand_id, 'iPhone 16'),
      (v_cat_id, v_brand_id, 'iPhone 16 Plus'),
      (v_cat_id, v_brand_id, 'iPhone 16 Pro'),
      (v_cat_id, v_brand_id, 'iPhone 16 Pro Max')
    ON CONFLICT DO NOTHING;
  END IF;

  -- Insert Models for Samsung
  SELECT id INTO v_brand_id FROM public.category_field_options WHERE category_id = v_cat_id AND parent_id IS NULL AND name = 'Samsung';
  IF v_brand_id IS NOT NULL THEN
    INSERT INTO public.category_field_options (category_id, parent_id, name) VALUES
      (v_cat_id, v_brand_id, 'Galaxy S24 Ultra'),
      (v_cat_id, v_brand_id, 'Galaxy S24+'),
      (v_cat_id, v_brand_id, 'Galaxy S24'),
      (v_cat_id, v_brand_id, 'Galaxy S23 Ultra'),
      (v_cat_id, v_brand_id, 'Galaxy S23+'),
      (v_cat_id, v_brand_id, 'Galaxy S23'),
      (v_cat_id, v_brand_id, 'Galaxy S22 Ultra'),
      (v_cat_id, v_brand_id, 'Galaxy S22'),
      (v_cat_id, v_brand_id, 'Galaxy Z Fold 5'),
      (v_cat_id, v_brand_id, 'Galaxy Z Flip 5'),
      (v_cat_id, v_brand_id, 'Galaxy A54 5G'),
      (v_cat_id, v_brand_id, 'Galaxy A34 5G')
    ON CONFLICT DO NOTHING;
  -- Update public.users profile
  UPDATE public.users
  SET
    email = new_email,
    full_name = new_name,
    phone = new_phone,
    updated_at = now()
  WHERE id = target_user_id;
END;
$$;

-- Seed attribute schemas for specific categories
-- Mobile Phones (c1000000-0000-0000-0000-000000000112)
UPDATE public.categories 
SET attributes_schema = '[
  {"name": "brand", "label": "Brand", "type": "select", "options": ["Apple", "Samsung", "Xiaomi", "Oppo", "Vivo", "Infinix", "Realme", "Google", "OnePlus", "Nokia", "Motorola"], "required": true},
  {"name": "model", "label": "Model", "type": "text", "required": true},
  {"name": "pta_status", "label": "PTA Status", "type": "select", "options": ["Approved", "Not Approved", "Patched"], "required": true},
  {"name": "sim_slots", "label": "SIM Slots", "type": "select", "options": ["Single SIM", "Dual SIM", "eSIM", "Dual eSIM"], "required": true},
  {"name": "ram", "label": "RAM (GB)", "type": "select", "options": ["2 GB", "3 GB", "4 GB", "6 GB", "8 GB", "12 GB", "16 GB", "18 GB"], "required": true},
  {"name": "storage", "label": "Storage", "type": "select", "options": ["16 GB", "32 GB", "64 GB", "128 GB", "256 GB", "512 GB", "1 TB"], "required": true},
  {"name": "color", "label": "Color", "type": "text", "required": true},
  {"name": "condition", "label": "Condition", "type": "select", "options": ["New", "Like New", "Good", "Fair", "Poor"], "required": true},
  {"name": "warranty", "label": "Warranty", "type": "select", "options": ["No Warranty", "Local Warranty", "International Warranty", "Brand Warranty"], "required": true},
  {"name": "accessories", "label": "Accessories Included", "type": "text", "required": false},
  {"name": "battery_health", "label": "Battery Health (%)", "type": "number", "required": false},
  {"name": "imei", "label": "IMEI (Optional)", "type": "text", "required": false}
]'::jsonb, 
image_url = 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?q=80&w=600'
WHERE id = 'c1000000-0000-0000-0000-000000000112';

-- Cars (c1000000-0000-0000-0000-000000000101)
UPDATE public.categories 
SET attributes_schema = '[
  {"name": "make", "label": "Make", "type": "select", "options": ["Toyota", "Honda", "Suzuki", "Kia", "Hyundai", "Nissan", "Mitsubishi", "Daihatsu", "Audi", "BMW", "Mercedes-Benz", "Changan", "MG", "Haval", "Proton"], "required": true},
  {"name": "model", "label": "Model", "type": "text", "required": true},
  {"name": "year", "label": "Year", "type": "number", "required": true},
  {"name": "mileage", "label": "Mileage (km)", "type": "number", "required": true},
  {"name": "fuel_type", "label": "Fuel Type", "type": "select", "options": ["Petrol", "Diesel", "CNG", "Hybrid", "Electric"], "required": true},
  {"name": "transmission", "label": "Transmission", "type": "select", "options": ["Manual", "Automatic"], "required": true},
  {"name": "engine_capacity", "label": "Engine Capacity (cc)", "type": "number", "required": true},
  {"name": "registered_city", "label": "Registered City", "type": "text", "required": true},
  {"name": "color", "label": "Color", "type": "text", "required": true},
  {"name": "condition", "label": "Condition", "type": "select", "options": ["New", "Used", "Imported"], "required": true}
]'::jsonb,
image_url = 'https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?q=80&w=600'
WHERE id = 'c1000000-0000-0000-0000-000000000101';

-- Houses (c1000000-0000-0000-0000-000000000107)
UPDATE public.categories 
SET attributes_schema = '[
  {"name": "property_type", "label": "Property Type", "type": "select", "options": ["Residential House", "Villa", "Townhouse", "Penthouse"], "required": true},
  {"name": "bedrooms", "label": "Bedrooms", "type": "select", "options": ["Studio", "1", "2", "3", "4", "5", "6", "7+"], "required": true},
  {"name": "bathrooms", "label": "Bathrooms", "type": "select", "options": ["1", "2", "3", "4", "5", "6+", "Shared"], "required": true},
  {"name": "area", "label": "Area (Marla/Kanal/Sq.Ft)", "type": "text", "required": true},
  {"name": "furnished", "label": "Furnished", "type": "select", "options": ["Unfurnished", "Semi-Furnished", "Fully Furnished"], "required": true},
  {"name": "parking", "label": "Parking Spaces", "type": "select", "options": ["None", "1 Vehicle", "2 Vehicles", "3+ Vehicles"], "required": true},
  {"name": "purpose", "label": "Purpose", "type": "select", "options": ["For Sale", "For Rent"], "required": true}
]'::jsonb,
image_url = 'https://images.unsplash.com/photo-1580587771525-78b9dba3b914?q=80&w=600'
WHERE id = 'c1000000-0000-0000-0000-000000000107';

-- Apartments (c1000000-0000-0000-0000-000000000108)
UPDATE public.categories 
SET attributes_schema = '[
  {"name": "bedrooms", "label": "Bedrooms", "type": "select", "options": ["Studio", "1", "2", "3", "4", "5+"], "required": true},
  {"name": "bathrooms", "label": "Bathrooms", "type": "select", "options": ["1", "2", "3", "4+"], "required": true},
  {"name": "area", "label": "Area (Marla/Sq.Ft)", "type": "text", "required": true},
  {"name": "furnished", "label": "Furnished", "type": "select", "options": ["Unfurnished", "Semi-Furnished", "Fully Furnished"], "required": true},
  {"name": "parking", "label": "Parking Spaces", "type": "select", "options": ["None", "1 Vehicle", "2 Vehicles"], "required": true},
  {"name": "purpose", "label": "Purpose", "type": "select", "options": ["For Sale", "For Rent"], "required": true}
]'::jsonb,
image_url = 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?q=80&w=600'
WHERE id = 'c1000000-0000-0000-0000-000000000108';

-- Create table for database-driven category field options
CREATE TABLE IF NOT EXISTS public.category_field_options (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  category_id UUID NOT NULL REFERENCES public.categories(id) ON DELETE CASCADE,
  parent_id UUID REFERENCES public.category_field_options(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Indexing for fast lookups
CREATE INDEX IF NOT EXISTS idx_cfo_category ON public.category_field_options(category_id);
CREATE INDEX IF NOT EXISTS idx_cfo_parent ON public.category_field_options(parent_id);

-- Enable RLS Policies
ALTER TABLE public.category_field_options ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can view category options" ON public.category_field_options;
CREATE POLICY "Anyone can view category options" ON public.category_field_options FOR SELECT USING (true);

DROP POLICY IF EXISTS "Admins can manage category options" ON public.category_field_options;
CREATE POLICY "Admins can manage category options" ON public.category_field_options FOR ALL USING (
  EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role IN ('admin', 'super_admin'))
);

-- Seed Brands for Mobile Phones (c1000000-0000-0000-0000-000000000112)
DO $$
DECLARE
  v_cat_id UUID := 'c1000000-0000-0000-0000-000000000112';
  v_brand_id UUID;
  v_brand_name TEXT;
  v_brands TEXT[] := ARRAY[
    'Apple', 'Samsung', 'Google', 'Xiaomi', 'Vivo', 'OPPO', 'OnePlus', 'Realme', 'Tecno', 'Infinix', 
    'Motorola', 'Nokia', 'Huawei', 'Honor', 'Sony', 'LG', 'Itel', 'ZTE', 'HTC', 'Lenovo', 'Asus', 
    'BlackBerry', 'TCL', 'Microsoft', 'Panasonic', 'Acer', 'Meizu', 'Gionee', 'Lava', 'Hisense', 
    'Nothing', 'HMD', 'Philips', 'Sharp', 'Razer', 'T-Mobile', 'Fairphone', 'Cubot', 'Doogee', 
    'Ulefone', 'UMIDIGI', 'Blackview', 'Coolpad', 'Cat', 'Kyocera', 'Spice', 'Sparx', 'QMobile', 
    'Calme', 'Club', 'Mobilink JazzX', 'GFive', 'Haier', 'Voice', 'RIVO', 'G-TIDE', 'Gright', 
    'Innjoo', 'Oscal', 'Oukitel', 'Villaon', 'Wiko', 'XMobile', 'XSmart', 'AllCall', 'BLU', 
    'Archos', 'Dcode', 'Energizer', 'E-Tachi', 'Faywa', 'Gresso', 'iNew', 'KXD', 'Me Mobile', 
    'Sego', 'Sonim', 'VGO TEL', 'Vnus', 'Xtouch', 'Alcatel', 'Sony Ericsson', 'Other'
  ];
BEGIN
  FOREACH v_brand_name IN ARRAY v_brands LOOP
    -- Insert Brand if it doesn't exist
    INSERT INTO public.category_field_options (category_id, parent_id, name)
    VALUES (v_cat_id, null, v_brand_name)
    ON CONFLICT DO NOTHING;
  END LOOP;

  -- Insert Models for Apple
  SELECT id INTO v_brand_id FROM public.category_field_options WHERE category_id = v_cat_id AND parent_id IS NULL AND name = 'Apple';
  IF v_brand_id IS NOT NULL THEN
    INSERT INTO public.category_field_options (category_id, parent_id, name) VALUES
      (v_cat_id, v_brand_id, 'iPhone'),
      (v_cat_id, v_brand_id, 'iPhone 3G'),
      (v_cat_id, v_brand_id, 'iPhone 3GS'),
      (v_cat_id, v_brand_id, 'iPhone 4'),
      (v_cat_id, v_brand_id, 'iPhone 4S'),
      (v_cat_id, v_brand_id, 'iPhone 5'),
      (v_cat_id, v_brand_id, 'iPhone 5C'),
      (v_cat_id, v_brand_id, 'iPhone 5S'),
      (v_cat_id, v_brand_id, 'iPhone SE (1st Gen)'),
      (v_cat_id, v_brand_id, 'iPhone 6'),
      (v_cat_id, v_brand_id, 'iPhone 6 Plus'),
      (v_cat_id, v_brand_id, 'iPhone 6S'),
      (v_cat_id, v_brand_id, 'iPhone 6S Plus'),
      (v_cat_id, v_brand_id, 'iPhone 7'),
      (v_cat_id, v_brand_id, 'iPhone 7 Plus'),
      (v_cat_id, v_brand_id, 'iPhone 8'),
      (v_cat_id, v_brand_id, 'iPhone 8 Plus'),
      (v_cat_id, v_brand_id, 'iPhone X'),
      (v_cat_id, v_brand_id, 'iPhone XR'),
      (v_cat_id, v_brand_id, 'iPhone XS'),
      (v_cat_id, v_brand_id, 'iPhone XS Max'),
      (v_cat_id, v_brand_id, 'iPhone 11'),
      (v_cat_id, v_brand_id, 'iPhone 11 Pro'),
      (v_cat_id, v_brand_id, 'iPhone 11 Pro Max'),
      (v_cat_id, v_brand_id, 'iPhone SE (2nd Gen)'),
      (v_cat_id, v_brand_id, 'iPhone 12 Mini'),
      (v_cat_id, v_brand_id, 'iPhone 12'),
      (v_cat_id, v_brand_id, 'iPhone 12 Pro'),
      (v_cat_id, v_brand_id, 'iPhone 12 Pro Max'),
      (v_cat_id, v_brand_id, 'iPhone 13 Mini'),
      (v_cat_id, v_brand_id, 'iPhone 13'),
      (v_cat_id, v_brand_id, 'iPhone 13 Pro'),
      (v_cat_id, v_brand_id, 'iPhone 13 Pro Max'),
      (v_cat_id, v_brand_id, 'iPhone SE (3rd Gen)'),
      (v_cat_id, v_brand_id, 'iPhone 14'),
      (v_cat_id, v_brand_id, 'iPhone 14 Plus'),
      (v_cat_id, v_brand_id, 'iPhone 14 Pro'),
      (v_cat_id, v_brand_id, 'iPhone 14 Pro Max'),
      (v_cat_id, v_brand_id, 'iPhone 15'),
      (v_cat_id, v_brand_id, 'iPhone 15 Plus'),
      (v_cat_id, v_brand_id, 'iPhone 15 Pro'),
      (v_cat_id, v_brand_id, 'iPhone 15 Pro Max'),
      (v_cat_id, v_brand_id, 'iPhone 16'),
      (v_cat_id, v_brand_id, 'iPhone 16 Plus'),
      (v_cat_id, v_brand_id, 'iPhone 16 Pro'),
      (v_cat_id, v_brand_id, 'iPhone 16 Pro Max')
    ON CONFLICT DO NOTHING;
  END IF;

  -- Insert Models for Samsung
  SELECT id INTO v_brand_id FROM public.category_field_options WHERE category_id = v_cat_id AND parent_id IS NULL AND name = 'Samsung';
  IF v_brand_id IS NOT NULL THEN
    INSERT INTO public.category_field_options (category_id, parent_id, name) VALUES
      (v_cat_id, v_brand_id, 'Galaxy S24 Ultra'),
      (v_cat_id, v_brand_id, 'Galaxy S24+'),
      (v_cat_id, v_brand_id, 'Galaxy S24'),
      (v_cat_id, v_brand_id, 'Galaxy S23 Ultra'),
      (v_cat_id, v_brand_id, 'Galaxy S23+'),
      (v_cat_id, v_brand_id, 'Galaxy S23'),
      (v_cat_id, v_brand_id, 'Galaxy S22 Ultra'),
      (v_cat_id, v_brand_id, 'Galaxy S22'),
      (v_cat_id, v_brand_id, 'Galaxy Z Fold 5'),
      (v_cat_id, v_brand_id, 'Galaxy Z Flip 5'),
      (v_cat_id, v_brand_id, 'Galaxy A54 5G'),
      (v_cat_id, v_brand_id, 'Galaxy A34 5G')
    ON CONFLICT DO NOTHING;
  END IF;

  -- Insert Models for Google
  SELECT id INTO v_brand_id FROM public.category_field_options WHERE category_id = v_cat_id AND parent_id IS NULL AND name = 'Google';
  IF v_brand_id IS NOT NULL THEN
    INSERT INTO public.category_field_options (category_id, parent_id, name) VALUES
      (v_cat_id, v_brand_id, 'Pixel 9 Pro XL'),
      (v_cat_id, v_brand_id, 'Pixel 9 Pro'),
      (v_cat_id, v_brand_id, 'Pixel 9'),
      (v_cat_id, v_brand_id, 'Pixel 9 Pro Fold'),
      (v_cat_id, v_brand_id, 'Pixel 8 Pro'),
      (v_cat_id, v_brand_id, 'Pixel 8'),
      (v_cat_id, v_brand_id, 'Pixel 8a'),
      (v_cat_id, v_brand_id, 'Pixel 7 Pro'),
      (v_cat_id, v_brand_id, 'Pixel 7'),
      (v_cat_id, v_brand_id, 'Pixel 6 Pro'),
      (v_cat_id, v_brand_id, 'Pixel 6')
    ON CONFLICT DO NOTHING;
  END IF;
END;
$$;

-- ============================================================
-- ENABLE SUPABASE REALTIME FOR ALL CHANNELS
-- ============================================================
DROP PUBLICATION IF EXISTS supabase_realtime;
CREATE PUBLICATION supabase_realtime FOR TABLE 
  public.listings, 
  public.offers, 
  public.reports, 
  public.notifications, 
  public.bookmarks, 
  public.messages, 
  public.conversations,
  public.verification_applications;

-- Add 'changes_requested' value to listing_status enum if not exists
ALTER TYPE public.listing_status ADD VALUE IF NOT EXISTS 'changes_requested';

-- Add columns to track who moderated the listing and when
ALTER TABLE public.listings 
  ADD COLUMN IF NOT EXISTS moderated_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS moderated_at TIMESTAMPTZ;

-- Seed Electronics & Home Appliances category
INSERT INTO public.categories (id, name, slug, icon, color, parent_id, sort_order, description)
VALUES ('c1000000-0000-0000-0000-000000000016', 'Electronics & Home Appliances', 'electronics-home-appliances', 'Tv', '#3b82f6', NULL, 16, 'Electronics & Home Appliances')
ON CONFLICT (id) DO NOTHING;

-- Seed Kids category
INSERT INTO public.categories (id, name, slug, icon, color, parent_id, sort_order, description)
VALUES ('c1000000-0000-0000-0000-000000000017', 'Kids', 'kids', 'Baby', '#fb7185', NULL, 17, 'Kids')
ON CONFLICT (id) DO NOTHING;

-- Verification Applications Table (KYC)
CREATE TABLE IF NOT EXISTS public.verification_applications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  cnic_number TEXT NOT NULL,
  dob DATE NOT NULL,
  phone TEXT NOT NULL,
  city TEXT NOT NULL,
  cnic_front_url TEXT NOT NULL,
  cnic_back_url TEXT NOT NULL,
  selfie_url TEXT NOT NULL,
  address TEXT,
  status TEXT NOT NULL DEFAULT 'pending', -- 'pending', 'approved', 'rejected'
  rejection_reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.verification_applications ENABLE ROW LEVEL SECURITY;

-- Enable RLS Policies for verification_applications
CREATE POLICY "Users can view their own applications" 
  ON public.verification_applications FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own applications" 
  ON public.verification_applications FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins/Moderators/Super Admins can view all applications" 
  ON public.verification_applications FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE users.id = auth.uid() 
      AND (users.role IN ('admin', 'super_admin', 'moderator'))
    )
  );

CREATE POLICY "Admins/Moderators/Super Admins can update applications" 
  ON public.verification_applications FOR UPDATE 
  USING (
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE users.id = auth.uid() 
      AND (users.role IN ('admin', 'super_admin', 'moderator'))
    )
  );

-- RPC function to check if email already exists in auth.users or public.users before registration
CREATE OR REPLACE FUNCTION public.check_email_exists(user_email text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM auth.users WHERE LOWER(email) = LOWER(user_email)
  ) OR EXISTS (
    SELECT 1 FROM public.users WHERE LOWER(email) = LOWER(user_email)
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.check_email_exists(text) TO anon, authenticated, service_role;

-- Columns for message deletion & delivery status
ALTER TABLE public.messages ADD COLUMN IF NOT EXISTS is_deleted BOOLEAN DEFAULT false;
ALTER TABLE public.messages ADD COLUMN IF NOT EXISTS is_delivered BOOLEAN DEFAULT false;
ALTER TABLE public.messages ADD COLUMN IF NOT EXISTS deleted_for_users TEXT[] DEFAULT '{}';

-- RPC function to mark all messages in a conversation as read by a participant (bypassing RLS update restrictions)
CREATE OR REPLACE FUNCTION public.mark_messages_read(
  p_conversation_id UUID,
  p_user_id UUID
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM public.conversations
    WHERE id = p_conversation_id
    AND (buyer_id = p_user_id OR seller_id = p_user_id)
  ) THEN
    UPDATE public.messages
    SET is_read = true, is_delivered = true
    WHERE conversation_id = p_conversation_id
    AND sender_id != p_user_id;
  END IF;
END;
$$;

GRANT EXECUTE ON FUNCTION public.mark_messages_read(UUID, UUID) TO anon, authenticated, service_role;





