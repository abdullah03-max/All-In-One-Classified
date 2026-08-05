-- Create invitations table
CREATE TABLE IF NOT EXISTS public.invitations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL UNIQUE,
  role TEXT NOT NULL CHECK (role IN ('admin', 'moderator')),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'expired')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS
ALTER TABLE public.invitations ENABLE ROW LEVEL SECURITY;

-- Policy: Super Admins can manage all invitations
DROP POLICY IF EXISTS "Super Admins can manage all invitations" ON public.invitations;
CREATE POLICY "Super Admins can manage all invitations"
  ON public.invitations
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE users.id = auth.uid() AND users.role = 'super_admin'
    )
  );

-- Policy: Admins can manage moderator invitations only
DROP POLICY IF EXISTS "Admins can manage moderator invitations" ON public.invitations;
CREATE POLICY "Admins can manage moderator invitations"
  ON public.invitations
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE users.id = auth.uid() AND users.role = 'admin'
    ) AND role = 'moderator'
  );

-- Policy: Anyone can read a pending invitation by ID (token check)
DROP POLICY IF EXISTS "Anyone can read pending invitation by ID" ON public.invitations;
CREATE POLICY "Anyone can read pending invitation by ID"
  ON public.invitations
  FOR SELECT
  USING (status = 'pending' AND expires_at > now());
