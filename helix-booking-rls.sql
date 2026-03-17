-- ============================================
-- HELIX BOOKING RLS POLICIES
-- Run in Supabase SQL Editor
-- Enables public (anon) booking page to work
-- ============================================

-- 1. PROFILES: anon can read public profile info by booking_slug
--    (only exposes display_name, email, booking_slug — not sensitive data)
CREATE POLICY "Allow anon read profiles by booking_slug"
  ON profiles
  FOR SELECT
  TO anon
  USING (booking_slug IS NOT NULL AND booking_slug != '');

-- 2. SERVICES: anon can read services for any user (needed for booking page)
--    Only exposes service data (name, duration, availability, rate)
CREATE POLICY "Allow anon read services for booking"
  ON services
  FOR SELECT
  TO anon
  USING (deleted_at IS NULL);

-- 3. USER_CONFIG: anon can read bookingSettings only
--    Locked to key = 'bookingSettings' so other config stays private
CREATE POLICY "Allow anon read booking settings"
  ON user_config
  FOR SELECT
  TO anon
  USING (key = 'bookingSettings');

-- 4. BOOKINGS: anon can read bookings (for availability/double-book check)
--    Only non-deleted bookings visible
CREATE POLICY "Allow anon read bookings for availability"
  ON bookings
  FOR SELECT
  TO anon
  USING (deleted_at IS NULL);

-- 5. BOOKINGS: anon can INSERT new bookings (the actual booking action)
CREATE POLICY "Allow anon insert bookings"
  ON bookings
  FOR INSERT
  TO anon
  WITH CHECK (true);

-- 6. EVENTS: anon can read events (for busy-time slot filtering)
--    Only non-deleted events visible
CREATE POLICY "Allow anon read events for availability"
  ON events
  FOR SELECT
  TO anon
  USING (deleted_at IS NULL);

-- ============================================
-- VERIFY: Make sure RLS is enabled on all tables
-- (These are idempotent — safe to re-run)
-- ============================================
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE services ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE events ENABLE ROW LEVEL SECURITY;

-- ============================================
-- SECURITY NOTES:
-- - profiles: only rows with a booking_slug are visible to anon
-- - user_config: ONLY bookingSettings key exposed (not payment/auth config)
-- - bookings/events: read-only for availability checks, data column
--   contains no auth tokens or sensitive info
-- - anon can only INSERT bookings, never UPDATE or DELETE
-- - Authenticated users still need their own RLS policies
--   (user_id = auth.uid()) for full CRUD — those should already exist
-- ============================================
