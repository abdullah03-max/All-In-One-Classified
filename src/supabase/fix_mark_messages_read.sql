-- ============================================================
-- FIX & REGISTER mark_messages_read RPC IN SUPABASE
-- Run this script in your Supabase SQL Editor (SQL Query tab)
-- ============================================================

-- 1. Ensure required columns exist on public.messages safely
ALTER TABLE public.messages ADD COLUMN IF NOT EXISTS is_read BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE public.messages ADD COLUMN IF NOT EXISTS deleted_for_users TEXT[] DEFAULT '{}';

-- 2. Drop existing version if signature or parameters differed
DROP FUNCTION IF EXISTS public.mark_messages_read(UUID, UUID);

-- 3. Create public.mark_messages_read RPC function with SECURITY DEFINER
CREATE OR REPLACE FUNCTION public.mark_messages_read(
  p_conversation_id UUID,
  p_user_id UUID
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Verify caller is a legitimate participant (buyer or seller) of the conversation
  IF EXISTS (
    SELECT 1 FROM public.conversations
    WHERE id = p_conversation_id
    AND (buyer_id = p_user_id OR seller_id = p_user_id)
  ) THEN
    -- Permanently update all unread messages received by this user to read
    UPDATE public.messages
    SET is_read = true
    WHERE conversation_id = p_conversation_id
    AND sender_id != p_user_id
    AND is_read = false;
  END IF;
END;
$$;

-- 4. Grant explicit execution privileges to all roles
GRANT EXECUTE ON FUNCTION public.mark_messages_read(UUID, UUID) TO anon, authenticated, service_role;

-- 5. Force PostgREST schema cache reload in Supabase
NOTIFY pgrst, 'reload schema';
