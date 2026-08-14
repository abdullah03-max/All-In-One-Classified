-- ============================================================
-- SAFEPAY PAYMENTS SCHEMA & AUTOMATIC PROMOTION FULFILLMENT
-- ============================================================

-- 1. Ensure user_role ENUM values exist
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

-- 2. Ensure listing promotion columns exist
ALTER TABLE public.listings ADD COLUMN IF NOT EXISTS featured_until TIMESTAMPTZ;
ALTER TABLE public.listings ADD COLUMN IF NOT EXISTS featured_package TEXT;
ALTER TABLE public.listings ADD COLUMN IF NOT EXISTS badge_type TEXT;

-- 3. Payments Table Definition
CREATE TABLE IF NOT EXISTS public.payments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  listing_id UUID REFERENCES public.listings(id) ON DELETE SET NULL,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  amount NUMERIC(12,2) NOT NULL,
  currency TEXT NOT NULL DEFAULT 'PKR',
  method TEXT NOT NULL DEFAULT 'Safepay',
  status TEXT NOT NULL DEFAULT 'pending',
  tracker_token TEXT UNIQUE,
  transaction_id TEXT,
  gateway TEXT DEFAULT 'Safepay Sandbox',
  package_name TEXT,
  duration_days INTEGER DEFAULT 7,
  notes TEXT,
  verified_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
  paid_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Ensure individual columns exist if table pre-existed
ALTER TABLE public.payments ADD COLUMN IF NOT EXISTS listing_id UUID REFERENCES public.listings(id) ON DELETE SET NULL;
ALTER TABLE public.payments ADD COLUMN IF NOT EXISTS tracker_token TEXT UNIQUE;
ALTER TABLE public.payments ADD COLUMN IF NOT EXISTS gateway TEXT DEFAULT 'Safepay Sandbox';
ALTER TABLE public.payments ADD COLUMN IF NOT EXISTS package_name TEXT;
ALTER TABLE public.payments ADD COLUMN IF NOT EXISTS duration_days INTEGER DEFAULT 7;
ALTER TABLE public.payments ADD COLUMN IF NOT EXISTS paid_at TIMESTAMPTZ;

-- 4. Row Level Security Policies
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

DROP POLICY IF EXISTS "SuperAdmins can update payments" ON public.payments;
CREATE POLICY "SuperAdmins can update payments" ON public.payments 
FOR UPDATE USING (
  EXISTS (
    SELECT 1 FROM public.users 
    WHERE id = auth.uid() 
    AND (role::text IN ('superadmin', 'super_admin') OR 'superadmin' = ANY(roles::text[]) OR 'super_admin' = ANY(roles::text[]))
  )
);

-- 5. Helper Function: Safepay Automatic Promotion Fulfillment
CREATE OR REPLACE FUNCTION public.fulfill_safepay_promotion(
  p_tracker_token TEXT,
  p_status TEXT DEFAULT 'paid',
  p_txn_id TEXT DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_listing_id UUID;
  v_duration INTEGER;
  v_package TEXT;
  v_current_status TEXT;
BEGIN
  -- Select existing payment details
  SELECT listing_id, duration_days, package_name, status 
  INTO v_listing_id, v_duration, v_package, v_current_status
  FROM public.payments WHERE tracker_token = p_tracker_token;

  -- Idempotency check: Ignore if already marked paid
  IF v_current_status = 'paid' THEN
    RETURN;
  END IF;

  -- Update Payment status
  UPDATE public.payments
  SET status = p_status,
      transaction_id = COALESCE(p_txn_id, transaction_id),
      paid_at = CASE WHEN p_status = 'paid' THEN now() ELSE paid_at END,
      updated_at = now()
  WHERE tracker_token = p_tracker_token;

  -- If paid & associated with a listing, activate featured promotion on listing
  IF p_status = 'paid' AND v_listing_id IS NOT NULL THEN
    UPDATE public.listings
    SET is_featured = true,
        featured_until = (now() + (COALESCE(v_duration, 7) || ' days')::INTERVAL),
        featured_package = COALESCE(v_package, 'Featured'),
        updated_at = now()
    WHERE id = v_listing_id;
  END IF;
END;
$$;

GRANT EXECUTE ON FUNCTION public.fulfill_safepay_promotion(TEXT, TEXT, TEXT) TO authenticated, service_role;
NOTIFY pgrst, 'reload schema';
