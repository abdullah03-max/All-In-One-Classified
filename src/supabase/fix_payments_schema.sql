-- ============================================================
-- PAYMENTS SCHEMA & FEATURED LISTINGS EXTENSION
-- ============================================================

-- 1. Ensure listing featured columns exist
ALTER TABLE public.listings ADD COLUMN IF NOT EXISTS featured_until TIMESTAMPTZ;
ALTER TABLE public.listings ADD COLUMN IF NOT EXISTS featured_package TEXT;
ALTER TABLE public.listings ADD COLUMN IF NOT EXISTS badge_type TEXT;

-- 2. Ensure payment table structure is complete
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

-- 3. RLS Security Policies
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own payments" ON public.payments;
CREATE POLICY "Users can view own payments" ON public.payments 
FOR SELECT USING (
  auth.uid() = user_id OR 
  EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role IN ('admin', 'superadmin'))
);

DROP POLICY IF EXISTS "Users can create payments" ON public.payments;
CREATE POLICY "Users can create payments" ON public.payments 
FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Admins can update payments" ON public.payments;
CREATE POLICY "Admins can update payments" ON public.payments 
FOR UPDATE USING (
  EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role IN ('admin', 'superadmin'))
);

-- 4. Helper Function: Approve Payment & Promote Listing Automatically
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
