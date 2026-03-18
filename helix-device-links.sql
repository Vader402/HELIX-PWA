-- Device Link Codes for Helix PWA
-- Allows a signed-in device to generate a 6-digit code that another device
-- can use to authenticate without email/password.

-- Create the table
CREATE TABLE IF NOT EXISTS public.device_links (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code       text UNIQUE NOT NULL,
  user_id    uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  session_token text NOT NULL,
  created_at timestamptz DEFAULT now(),
  used       boolean DEFAULT false,
  expires_at timestamptz NOT NULL
);

-- Enable RLS
ALTER TABLE public.device_links ENABLE ROW LEVEL SECURITY;

-- Authenticated users can create link codes
CREATE POLICY "authenticated_insert_device_links"
  ON public.device_links
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Anon (unauthenticated) users can look up a code to redeem it
CREATE POLICY "anon_select_device_links"
  ON public.device_links
  FOR SELECT
  TO anon
  USING (used = false AND expires_at > now());

-- Anon users can mark a code as used
CREATE POLICY "anon_update_device_links"
  ON public.device_links
  FOR UPDATE
  TO anon
  USING (used = false AND expires_at > now())
  WITH CHECK (used = true);

-- Cleanup: delete expired or used codes older than 1 hour
CREATE OR REPLACE FUNCTION public.cleanup_device_links()
RETURNS void
LANGUAGE sql
SECURITY DEFINER
AS $$
  DELETE FROM public.device_links
  WHERE used = true OR expires_at < now() - interval '1 hour';
$$;

-- Index for fast lookups by code
CREATE INDEX IF NOT EXISTS idx_device_links_code ON public.device_links(code) WHERE used = false;
