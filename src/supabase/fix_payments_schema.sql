-- ============================================================
-- FIX PAYMENTS SCHEMA & RESTRICT TO SUPERADMIN ONLY
-- ============================================================

-- 1. Safely add 'superadmin' and 'super_admin' to user_role ENUM if missing
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'superadmin' AND enumtypid = 'user_role'::regtype) THEN
    ALTER TYPE user_role ADD VALUE 'superadmin';
  END IF;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'super_admin' AND enumtypid = 'user_role'::regtype) THEN
    ALTER TYPE user_role ADD VALUE 'super_admin';
  END IF;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

-- 2. Ensure listing featured columns exist
ALTER TABLE public.listings ADD COLUMN IF NOT EXISTS featured_until TIMESTAMPTZ;
ALTER TABLE public.listings ADD COLUMN IF NOT EXISTS featured_package TEXT;
ALTER TABLE public.listings ADD COLUMN IF NOT EXISTS badge_type TEXT;

-- 3. Ensure payment table structure is complete
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
  package_name TEXT,
  duration_days INTEGER DEFAULT 7,
  notes TEXT,
  verified_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Ensure individual columns exist if table pre-existed
ALTER TABLE public.payments ADD COLUMN IF NOT EXISTS listing_id UUID REFERENCES public.listings(id) ON DELETE SET NULL;
ALTER TABLE public.payments ADD COLUMN IF NOT EXISTS package_name TEXT;
ALTER TABLE public.payments ADD COLUMN IF NOT EXISTS duration_days INTEGER DEFAULT 7;
ALTER TABLE public.payments ADD COLUMN IF NOT EXISTS receipt_url TEXT;
ALTER TABLE public.payments ADD COLUMN IF NOT EXISTS transaction_id TEXT;

-- 4. RLS Security Policies - RESTRICTED TO SUPERADMIN ONLY
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own payments" ON public.payments;
CREATE POLICY "Users can view own payments" ON public.payments 
FOR SELECT USING (
  auth.uid() = user_id OR 
  EXISTS (
    SELECT 1 FROM public.users 
    WHERE id = auth.uid() 
    AND (role::text IN ('superadmin', 'super_admin') OR 'superadmin' = ANY(roles::text[]) OR 'super_admin' = ANY(roles::text[]))
  )
);

DROP POLICY IF EXISTS "Users can create payments" ON public.payments;
CREATE POLICY "Users can create payments" ON public.payments 
FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Admins can update payments" ON public.payments;
DROP POLICY IF EXISTS "SuperAdmins can update payments" ON public.payments;
CREATE POLICY "SuperAdmins can update payments" ON public.payments 
FOR UPDATE USING (
  EXISTS (
    SELECT 1 FROM public.users 
    WHERE id = auth.uid() 
    AND (role::text IN ('superadmin', 'super_admin') OR 'superadmin' = ANY(roles::text[]) OR 'super_admin' = ANY(roles::text[]))
  )
);

-- 5. Helper Function: SuperAdmin Approve Payment & Promote Listing Automatically
CREATE OR REPLACE FUNCTION public.approve_payment_and_promote(
  p_payment_id UUID,
  p_admin_id UUID,
  p_status TEXT DEFAULT 'completed'
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_listing_id UUID;
  v_duration INTEGER;
  v_package TEXT;
BEGIN
  -- Verify caller is a SuperAdmin
  IF NOT EXISTS (
    SELECT 1 FROM public.users
    WHERE id = p_admin_id
    AND (role::text IN ('superadmin', 'super_admin') OR 'superadmin' = ANY(roles::text[]) OR 'super_admin' = ANY(roles::text[]))
  ) THEN
    RAISE EXCEPTION 'Access Denied: Only SuperAdmins can approve payments and activate promotions.';
  END IF;

  -- Update Payment status
  UPDATE public.payments
  SET status = p_status::payment_status,
      verified_by = p_admin_id,
      updated_at = now()
  WHERE id = p_payment_id
  RETURNING listing_id, duration_days, package_name INTO v_listing_id, v_duration, v_package;

  -- If approved & associated with a listing, activate featured promotion on listing
  IF p_status = 'completed' AND v_listing_id IS NOT NULL THEN
    UPDATE public.listings
    SET is_featured = true,
        featured_until = (now() + (COALESCE(v_duration, 7) || ' days')::INTERVAL),
        featured_package = COALESCE(v_package, 'Featured'),
        updated_at = now()
    WHERE id = v_listing_id;
  END IF;
END;
$$;

GRANT EXECUTE ON FUNCTION public.approve_payment_and_promote(UUID, UUID, TEXT) TO authenticated, service_role;
NOTIFY pgrst, 'reload schema';
