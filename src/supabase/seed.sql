-- ============================================================
-- DEMO SEED DATA
-- Run AFTER creating demo auth users via Supabase Auth dashboard
-- or via the signup flow. This script seeds sample listings
-- assuming you have at least one seller user created.
--
-- IMPORTANT: Replace the seller_id below with an actual user ID
-- from your public.users table after they've signed up.
-- ============================================================

-- Example: Update a user to be a seller and verified
-- UPDATE public.users SET role = 'seller', is_verified = true WHERE email = 'seller@bazaar.pk';
-- UPDATE public.users SET role = 'admin', is_verified = true WHERE email = 'admin@bazaar.pk';
-- UPDATE public.users SET role = 'super_admin', is_verified = true WHERE email = 'superadmin@bazaar.pk';
-- UPDATE public.users SET role = 'moderator', is_verified = true WHERE email = 'moderator@bazaar.pk';

-- Sample listings (replace seller_id with real UUID after signup)
/*
INSERT INTO public.listings (title, description, price, category_id, seller_id, condition, images, city, country, status, is_featured, is_negotiable, location)
VALUES
  (
    'iPhone 14 Pro Max 256GB - Excellent Condition',
    'Selling my iPhone 14 Pro Max in excellent condition. Always used with case and screen protector. Comes with original box, charger, and unused EarPods. Battery health 92%. No scratches or dents. Selling due to upgrade.',
    285000,
    (SELECT id FROM public.categories WHERE slug = 'mobile-phones' LIMIT 1),
    'YOUR_SELLER_USER_ID_HERE',
    'like_new',
    ARRAY['https://images.unsplash.com/photo-1678652197831-2d180705cd2c?w=800'],
    'Karachi',
    'Pakistan',
    'active',
    true,
    true,
    'DHA Phase 6'
  ),
  (
    'Toyota Corolla Altis 2021 - Low Mileage',
    'Well maintained Toyota Corolla Altis 2021 model. Only 25,000 km driven. Single owner, all original parts, full service history available. AC, power steering, power windows all working perfectly.',
    5800000,
    (SELECT id FROM public.categories WHERE slug = 'cars' LIMIT 1),
    'YOUR_SELLER_USER_ID_HERE',
    'good',
    ARRAY['https://images.unsplash.com/photo-1623869675184-0b00f0203409?w=800'],
    'Lahore',
    'Pakistan',
    'active',
    true,
    true,
    'Gulberg III'
  ),
  (
    '3 Bed Apartment for Sale - DHA Phase 5',
    'Beautiful 3 bedroom apartment located in the heart of DHA Phase 5. Features modern kitchen, spacious living room, 2 bathrooms, and a balcony with city view. Gated community with 24/7 security.',
    18500000,
    (SELECT id FROM public.categories WHERE slug = 'apartments' LIMIT 1),
    'YOUR_SELLER_USER_ID_HERE',
    'good',
    ARRAY['https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=800'],
    'Karachi',
    'Pakistan',
    'active',
    false,
    false,
    'DHA Phase 5'
  );
*/

-- Note: To properly seed data, sign up demo users first via the app's
-- registration flow, then use their generated UUIDs in the INSERT statements above.
