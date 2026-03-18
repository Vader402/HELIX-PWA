-- ============================================
-- HELIX TEAM LEAD FEATURES - SQL MIGRATION
-- Adds title to workspace_members, assigned_to to entity tables
-- ============================================

-- 1. Add title column to workspace_members
ALTER TABLE workspace_members
  ADD COLUMN IF NOT EXISTS title text;

-- 2. Add assigned_to column to entity tables
ALTER TABLE prospects
  ADD COLUMN IF NOT EXISTS assigned_to uuid REFERENCES auth.users(id);

ALTER TABLE tasks
  ADD COLUMN IF NOT EXISTS assigned_to uuid REFERENCES auth.users(id);

ALTER TABLE events
  ADD COLUMN IF NOT EXISTS assigned_to uuid REFERENCES auth.users(id);

ALTER TABLE jobs
  ADD COLUMN IF NOT EXISTS assigned_to uuid REFERENCES auth.users(id);

ALTER TABLE bookings
  ADD COLUMN IF NOT EXISTS assigned_to uuid REFERENCES auth.users(id);

-- 3. Add indexes on assigned_to for each table
CREATE INDEX IF NOT EXISTS idx_prospects_assigned_to ON prospects(assigned_to);
CREATE INDEX IF NOT EXISTS idx_tasks_assigned_to ON tasks(assigned_to);
CREATE INDEX IF NOT EXISTS idx_events_assigned_to ON events(assigned_to);
CREATE INDEX IF NOT EXISTS idx_jobs_assigned_to ON jobs(assigned_to);
CREATE INDEX IF NOT EXISTS idx_bookings_assigned_to ON bookings(assigned_to);

-- 4. RLS policies: workspace members can read each other's assigned items
-- These policies allow any member of the same workspace to SELECT rows
-- assigned to other members in that workspace.

-- Prospects: workspace members can read assigned items
CREATE POLICY "workspace_members_read_assigned_prospects"
  ON prospects FOR SELECT
  USING (
    assigned_to IS NOT NULL
    AND EXISTS (
      SELECT 1 FROM workspace_members wm1
      JOIN workspace_members wm2 ON wm1.workspace_id = wm2.workspace_id
      WHERE wm1.user_id = auth.uid()
        AND wm2.user_id = prospects.assigned_to
    )
  );

-- Tasks: workspace members can read assigned items
CREATE POLICY "workspace_members_read_assigned_tasks"
  ON tasks FOR SELECT
  USING (
    assigned_to IS NOT NULL
    AND EXISTS (
      SELECT 1 FROM workspace_members wm1
      JOIN workspace_members wm2 ON wm1.workspace_id = wm2.workspace_id
      WHERE wm1.user_id = auth.uid()
        AND wm2.user_id = tasks.assigned_to
    )
  );

-- Events: workspace members can read assigned items
CREATE POLICY "workspace_members_read_assigned_events"
  ON events FOR SELECT
  USING (
    assigned_to IS NOT NULL
    AND EXISTS (
      SELECT 1 FROM workspace_members wm1
      JOIN workspace_members wm2 ON wm1.workspace_id = wm2.workspace_id
      WHERE wm1.user_id = auth.uid()
        AND wm2.user_id = events.assigned_to
    )
  );

-- Jobs: workspace members can read assigned items
CREATE POLICY "workspace_members_read_assigned_jobs"
  ON jobs FOR SELECT
  USING (
    assigned_to IS NOT NULL
    AND EXISTS (
      SELECT 1 FROM workspace_members wm1
      JOIN workspace_members wm2 ON wm1.workspace_id = wm2.workspace_id
      WHERE wm1.user_id = auth.uid()
        AND wm2.user_id = jobs.assigned_to
    )
  );

-- Bookings: workspace members can read assigned items
CREATE POLICY "workspace_members_read_assigned_bookings"
  ON bookings FOR SELECT
  USING (
    assigned_to IS NOT NULL
    AND EXISTS (
      SELECT 1 FROM workspace_members wm1
      JOIN workspace_members wm2 ON wm1.workspace_id = wm2.workspace_id
      WHERE wm1.user_id = auth.uid()
        AND wm2.user_id = bookings.assigned_to
    )
  );

-- Update policy: workspace leads (owner/admin) can update assigned_to on any workspace member's items
CREATE POLICY "workspace_leads_assign_prospects"
  ON prospects FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM workspace_members
      WHERE user_id = auth.uid()
        AND role IN ('owner', 'admin')
        AND workspace_id = prospects.workspace_id
    )
  );

CREATE POLICY "workspace_leads_assign_tasks"
  ON tasks FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM workspace_members
      WHERE user_id = auth.uid()
        AND role IN ('owner', 'admin')
        AND workspace_id = tasks.workspace_id
    )
  );

CREATE POLICY "workspace_leads_assign_events"
  ON events FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM workspace_members
      WHERE user_id = auth.uid()
        AND role IN ('owner', 'admin')
        AND workspace_id = events.workspace_id
    )
  );

CREATE POLICY "workspace_leads_assign_jobs"
  ON jobs FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM workspace_members
      WHERE user_id = auth.uid()
        AND role IN ('owner', 'admin')
        AND workspace_id = jobs.workspace_id
    )
  );

CREATE POLICY "workspace_leads_assign_bookings"
  ON bookings FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM workspace_members
      WHERE user_id = auth.uid()
        AND role IN ('owner', 'admin')
        AND workspace_id = bookings.workspace_id
    )
  );
