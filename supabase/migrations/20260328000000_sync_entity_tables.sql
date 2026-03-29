-- ============================================================
-- Helix PWA Cloud Sync: All entity tables + supporting tables
-- Generated: 2026-03-28
--
-- Creates tables for every SYNC_ENTITIES entry plus
-- infrastructure tables (profiles, user_config, workspaces,
-- device_links, etc.) required by the sync engine.
-- ============================================================

-- ============================================================
-- HELPER: workspace membership check for RLS
-- ============================================================
CREATE OR REPLACE FUNCTION public.user_workspace_ids(uid uuid)
RETURNS SETOF uuid
LANGUAGE sql STABLE SECURITY DEFINER
AS $$
  SELECT workspace_id FROM public.workspace_members WHERE user_id = uid;
$$;


-- ============================================================
-- INFRASTRUCTURE TABLES
-- ============================================================

-- profiles: extends auth.users with display info + workspace link
CREATE TABLE IF NOT EXISTS public.profiles (
  id          uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email       text,
  display_name text,
  avatar_url  text,
  workspace_id uuid,
  created_at  timestamptz DEFAULT now(),
  updated_at  timestamptz DEFAULT now()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "profiles_select" ON public.profiles
  FOR SELECT USING (auth.uid() = id);
CREATE POLICY "profiles_insert" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "profiles_update" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "profiles_service" ON public.profiles
  FOR ALL USING (auth.role() = 'service_role');


-- workspaces: team/business workspace
CREATE TABLE IF NOT EXISTS public.workspaces (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name        text NOT NULL,
  owner_id    uuid REFERENCES auth.users(id),
  created_at  timestamptz DEFAULT now(),
  updated_at  timestamptz DEFAULT now()
);

ALTER TABLE public.workspaces ENABLE ROW LEVEL SECURITY;

CREATE POLICY "workspaces_select" ON public.workspaces
  FOR SELECT USING (
    owner_id = auth.uid()
    OR id IN (SELECT public.user_workspace_ids(auth.uid()))
  );
CREATE POLICY "workspaces_insert" ON public.workspaces
  FOR INSERT WITH CHECK (owner_id = auth.uid());
CREATE POLICY "workspaces_update" ON public.workspaces
  FOR UPDATE USING (owner_id = auth.uid());
CREATE POLICY "workspaces_delete" ON public.workspaces
  FOR DELETE USING (owner_id = auth.uid());


-- workspace_members
CREATE TABLE IF NOT EXISTS public.workspace_members (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id  uuid NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  user_id       uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role          text DEFAULT 'member',
  title         text,
  created_at    timestamptz DEFAULT now(),
  UNIQUE(workspace_id, user_id)
);

ALTER TABLE public.workspace_members ENABLE ROW LEVEL SECURITY;

CREATE POLICY "wm_select" ON public.workspace_members
  FOR SELECT USING (
    user_id = auth.uid()
    OR workspace_id IN (SELECT public.user_workspace_ids(auth.uid()))
  );
CREATE POLICY "wm_insert" ON public.workspace_members
  FOR INSERT WITH CHECK (
    workspace_id IN (SELECT id FROM public.workspaces WHERE owner_id = auth.uid())
  );
CREATE POLICY "wm_delete" ON public.workspace_members
  FOR DELETE USING (
    workspace_id IN (SELECT id FROM public.workspaces WHERE owner_id = auth.uid())
    OR user_id = auth.uid()
  );


-- workspace_invites
CREATE TABLE IF NOT EXISTS public.workspace_invites (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id  uuid NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  invited_email text NOT NULL,
  invited_by    uuid REFERENCES auth.users(id),
  role          text DEFAULT 'member',
  status        text DEFAULT 'pending',
  created_at    timestamptz DEFAULT now()
);

ALTER TABLE public.workspace_invites ENABLE ROW LEVEL SECURITY;

CREATE POLICY "wi_select" ON public.workspace_invites
  FOR SELECT USING (
    invited_by = auth.uid()
    OR workspace_id IN (SELECT public.user_workspace_ids(auth.uid()))
  );
CREATE POLICY "wi_insert" ON public.workspace_invites
  FOR INSERT WITH CHECK (invited_by = auth.uid());
CREATE POLICY "wi_update" ON public.workspace_invites
  FOR UPDATE USING (
    invited_by = auth.uid()
    OR workspace_id IN (SELECT public.user_workspace_ids(auth.uid()))
  );


-- user_config: key-value store for non-array settings
CREATE TABLE IF NOT EXISTS public.user_config (
  user_id     uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  key         text NOT NULL,
  data        jsonb,
  updated_at  timestamptz DEFAULT now(),
  created_at  timestamptz DEFAULT now(),
  PRIMARY KEY (user_id, key)
);

ALTER TABLE public.user_config ENABLE ROW LEVEL SECURITY;

CREATE POLICY "uc_select" ON public.user_config
  FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "uc_insert" ON public.user_config
  FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "uc_update" ON public.user_config
  FOR UPDATE USING (user_id = auth.uid());
CREATE POLICY "uc_delete" ON public.user_config
  FOR DELETE USING (user_id = auth.uid());


-- device_links: magic codes for cross-device linking
CREATE TABLE IF NOT EXISTS public.device_links (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  code        text NOT NULL UNIQUE,
  used        boolean DEFAULT false,
  expires_at  timestamptz NOT NULL,
  created_at  timestamptz DEFAULT now()
);

ALTER TABLE public.device_links ENABLE ROW LEVEL SECURITY;

CREATE POLICY "dl_select" ON public.device_links
  FOR SELECT USING (true);  -- anyone can look up a code
CREATE POLICY "dl_insert" ON public.device_links
  FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "dl_update" ON public.device_links
  FOR UPDATE USING (user_id = auth.uid());


-- invoice_views: tracks when shared invoices are viewed
CREATE TABLE IF NOT EXISTS public.invoice_views (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id  text NOT NULL,
  viewed_at   timestamptz DEFAULT now(),
  user_agent  text
);

ALTER TABLE public.invoice_views ENABLE ROW LEVEL SECURITY;

CREATE POLICY "iv_insert" ON public.invoice_views
  FOR INSERT WITH CHECK (true);  -- public invoice links
CREATE POLICY "iv_select" ON public.invoice_views
  FOR SELECT USING (auth.role() = 'service_role');


-- report_schedules
CREATE TABLE IF NOT EXISTS public.report_schedules (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  report_type text,
  schedule    text,
  data        jsonb,
  updated_at  timestamptz DEFAULT now(),
  created_at  timestamptz DEFAULT now()
);

ALTER TABLE public.report_schedules ENABLE ROW LEVEL SECURITY;

CREATE POLICY "rs_select" ON public.report_schedules
  FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "rs_insert" ON public.report_schedules
  FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "rs_update" ON public.report_schedules
  FOR UPDATE USING (user_id = auth.uid());
CREATE POLICY "rs_delete" ON public.report_schedules
  FOR DELETE USING (user_id = auth.uid());


-- bank_connections: Plaid link tokens / connection records
CREATE TABLE IF NOT EXISTS public.bank_connections (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  institution_id  text,
  institution_name text,
  access_token    text,  -- encrypted at rest by Supabase
  item_id         text,
  cursor          text,
  status          text DEFAULT 'active',
  created_at      timestamptz DEFAULT now(),
  updated_at      timestamptz DEFAULT now()
);

ALTER TABLE public.bank_connections ENABLE ROW LEVEL SECURITY;

CREATE POLICY "bc_select" ON public.bank_connections
  FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "bc_insert" ON public.bank_connections
  FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "bc_update" ON public.bank_connections
  FOR UPDATE USING (user_id = auth.uid());
CREATE POLICY "bc_delete" ON public.bank_connections
  FOR DELETE USING (user_id = auth.uid());


-- bank_reconciliations: matching bank txns to app records
CREATE TABLE IF NOT EXISTS public.bank_reconciliations (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id             uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  bank_transaction_id uuid,
  matched_type        text,
  matched_id          uuid,
  status              text DEFAULT 'matched',
  data                jsonb,
  created_at          timestamptz DEFAULT now()
);

ALTER TABLE public.bank_reconciliations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "br_select" ON public.bank_reconciliations
  FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "br_insert" ON public.bank_reconciliations
  FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "br_update" ON public.bank_reconciliations
  FOR UPDATE USING (user_id = auth.uid());
CREATE POLICY "br_delete" ON public.bank_reconciliations
  FOR DELETE USING (user_id = auth.uid());


-- ============================================================
-- SYNC ENTITY TABLES
-- All share the same schema used by uploadAll / pushChanges /
-- pullAll / pullChanges in the PWA sync engine.
-- ============================================================

-- Template: each table has id, user_id, workspace_id, data (jsonb),
-- deleted_at, client_updated_at, updated_at, created_at.

DO $$ BEGIN
  RAISE NOTICE 'Creating sync entity tables...';
END $$;

-- 1. prospects
CREATE TABLE IF NOT EXISTS public.prospects (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  workspace_id      uuid,
  data              jsonb,
  deleted_at        timestamptz,
  client_updated_at timestamptz,
  updated_at        timestamptz DEFAULT now(),
  created_at        timestamptz DEFAULT now()
);

-- 2. events
CREATE TABLE IF NOT EXISTS public.events (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  workspace_id      uuid,
  data              jsonb,
  deleted_at        timestamptz,
  client_updated_at timestamptz,
  updated_at        timestamptz DEFAULT now(),
  created_at        timestamptz DEFAULT now()
);

-- 3. tasks
CREATE TABLE IF NOT EXISTS public.tasks (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  workspace_id      uuid,
  data              jsonb,
  deleted_at        timestamptz,
  client_updated_at timestamptz,
  updated_at        timestamptz DEFAULT now(),
  created_at        timestamptz DEFAULT now()
);

-- 4. notes
CREATE TABLE IF NOT EXISTS public.notes (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  workspace_id      uuid,
  data              jsonb,
  deleted_at        timestamptz,
  client_updated_at timestamptz,
  updated_at        timestamptz DEFAULT now(),
  created_at        timestamptz DEFAULT now()
);

-- 5. products
CREATE TABLE IF NOT EXISTS public.products (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  workspace_id      uuid,
  data              jsonb,
  deleted_at        timestamptz,
  client_updated_at timestamptz,
  updated_at        timestamptz DEFAULT now(),
  created_at        timestamptz DEFAULT now()
);

-- 6. orders
CREATE TABLE IF NOT EXISTS public.orders (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  workspace_id      uuid,
  data              jsonb,
  deleted_at        timestamptz,
  client_updated_at timestamptz,
  updated_at        timestamptz DEFAULT now(),
  created_at        timestamptz DEFAULT now()
);

-- 7. services
CREATE TABLE IF NOT EXISTS public.services (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  workspace_id      uuid,
  data              jsonb,
  deleted_at        timestamptz,
  client_updated_at timestamptz,
  updated_at        timestamptz DEFAULT now(),
  created_at        timestamptz DEFAULT now()
);

-- 8. time_entries (JS key: timeEntries)
CREATE TABLE IF NOT EXISTS public.time_entries (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  workspace_id      uuid,
  data              jsonb,
  deleted_at        timestamptz,
  client_updated_at timestamptz,
  updated_at        timestamptz DEFAULT now(),
  created_at        timestamptz DEFAULT now()
);

-- 9. invoices
CREATE TABLE IF NOT EXISTS public.invoices (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  workspace_id      uuid,
  data              jsonb,
  deleted_at        timestamptz,
  client_updated_at timestamptz,
  updated_at        timestamptz DEFAULT now(),
  created_at        timestamptz DEFAULT now()
);

-- 10. jobs
CREATE TABLE IF NOT EXISTS public.jobs (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  workspace_id      uuid,
  data              jsonb,
  deleted_at        timestamptz,
  client_updated_at timestamptz,
  updated_at        timestamptz DEFAULT now(),
  created_at        timestamptz DEFAULT now()
);

-- 11. bookings
CREATE TABLE IF NOT EXISTS public.bookings (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  workspace_id      uuid,
  data              jsonb,
  deleted_at        timestamptz,
  client_updated_at timestamptz,
  updated_at        timestamptz DEFAULT now(),
  created_at        timestamptz DEFAULT now()
);

-- 12. contacts
CREATE TABLE IF NOT EXISTS public.contacts (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  workspace_id      uuid,
  data              jsonb,
  deleted_at        timestamptz,
  client_updated_at timestamptz,
  updated_at        timestamptz DEFAULT now(),
  created_at        timestamptz DEFAULT now()
);

-- 13. cliques
CREATE TABLE IF NOT EXISTS public.cliques (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  workspace_id      uuid,
  data              jsonb,
  deleted_at        timestamptz,
  client_updated_at timestamptz,
  updated_at        timestamptz DEFAULT now(),
  created_at        timestamptz DEFAULT now()
);

-- 14. connections
CREATE TABLE IF NOT EXISTS public.connections (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  workspace_id      uuid,
  data              jsonb,
  deleted_at        timestamptz,
  client_updated_at timestamptz,
  updated_at        timestamptz DEFAULT now(),
  created_at        timestamptz DEFAULT now()
);

-- 15. places
CREATE TABLE IF NOT EXISTS public.places (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  workspace_id      uuid,
  data              jsonb,
  deleted_at        timestamptz,
  client_updated_at timestamptz,
  updated_at        timestamptz DEFAULT now(),
  created_at        timestamptz DEFAULT now()
);

-- 16. discoveries
CREATE TABLE IF NOT EXISTS public.discoveries (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  workspace_id      uuid,
  data              jsonb,
  deleted_at        timestamptz,
  client_updated_at timestamptz,
  updated_at        timestamptz DEFAULT now(),
  created_at        timestamptz DEFAULT now()
);

-- 17. checkins
CREATE TABLE IF NOT EXISTS public.checkins (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  workspace_id      uuid,
  data              jsonb,
  deleted_at        timestamptz,
  client_updated_at timestamptz,
  updated_at        timestamptz DEFAULT now(),
  created_at        timestamptz DEFAULT now()
);

-- 18. functions
CREATE TABLE IF NOT EXISTS public.functions (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  workspace_id      uuid,
  data              jsonb,
  deleted_at        timestamptz,
  client_updated_at timestamptz,
  updated_at        timestamptz DEFAULT now(),
  created_at        timestamptz DEFAULT now()
);

-- 19. invites
CREATE TABLE IF NOT EXISTS public.invites (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  workspace_id      uuid,
  data              jsonb,
  deleted_at        timestamptz,
  client_updated_at timestamptz,
  updated_at        timestamptz DEFAULT now(),
  created_at        timestamptz DEFAULT now()
);

-- 20. hangouts
CREATE TABLE IF NOT EXISTS public.hangouts (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  workspace_id      uuid,
  data              jsonb,
  deleted_at        timestamptz,
  client_updated_at timestamptz,
  updated_at        timestamptz DEFAULT now(),
  created_at        timestamptz DEFAULT now()
);

-- 21. trips
CREATE TABLE IF NOT EXISTS public.trips (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  workspace_id      uuid,
  data              jsonb,
  deleted_at        timestamptz,
  client_updated_at timestamptz,
  updated_at        timestamptz DEFAULT now(),
  created_at        timestamptz DEFAULT now()
);

-- 22. dates
CREATE TABLE IF NOT EXISTS public.dates (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  workspace_id      uuid,
  data              jsonb,
  deleted_at        timestamptz,
  client_updated_at timestamptz,
  updated_at        timestamptz DEFAULT now(),
  created_at        timestamptz DEFAULT now()
);

-- 23. quests
CREATE TABLE IF NOT EXISTS public.quests (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  workspace_id      uuid,
  data              jsonb,
  deleted_at        timestamptz,
  client_updated_at timestamptz,
  updated_at        timestamptz DEFAULT now(),
  created_at        timestamptz DEFAULT now()
);

-- 24. group_challenges (JS key: groupChallenges)
CREATE TABLE IF NOT EXISTS public.group_challenges (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  workspace_id      uuid,
  data              jsonb,
  deleted_at        timestamptz,
  client_updated_at timestamptz,
  updated_at        timestamptz DEFAULT now(),
  created_at        timestamptz DEFAULT now()
);

-- 25. accountability
CREATE TABLE IF NOT EXISTS public.accountability (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  workspace_id      uuid,
  data              jsonb,
  deleted_at        timestamptz,
  client_updated_at timestamptz,
  updated_at        timestamptz DEFAULT now(),
  created_at        timestamptz DEFAULT now()
);

-- ============================================================
-- VAULT / FINANCIAL TABLES (the 6 causing console errors)
-- ============================================================

-- 26. expenses
CREATE TABLE IF NOT EXISTS public.expenses (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  workspace_id      uuid,
  data              jsonb,
  deleted_at        timestamptz,
  client_updated_at timestamptz,
  updated_at        timestamptz DEFAULT now(),
  created_at        timestamptz DEFAULT now()
);

-- 27. receipts
CREATE TABLE IF NOT EXISTS public.receipts (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  workspace_id      uuid,
  data              jsonb,
  deleted_at        timestamptz,
  client_updated_at timestamptz,
  updated_at        timestamptz DEFAULT now(),
  created_at        timestamptz DEFAULT now()
);

-- 28. bankAccounts (JS key maps directly — no snake_case alias)
CREATE TABLE IF NOT EXISTS public."bankAccounts" (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  workspace_id      uuid,
  data              jsonb,
  deleted_at        timestamptz,
  client_updated_at timestamptz,
  updated_at        timestamptz DEFAULT now(),
  created_at        timestamptz DEFAULT now()
);

-- 29. bankTransactions (JS key maps directly — no snake_case alias)
CREATE TABLE IF NOT EXISTS public."bankTransactions" (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  workspace_id      uuid,
  data              jsonb,
  deleted_at        timestamptz,
  client_updated_at timestamptz,
  updated_at        timestamptz DEFAULT now(),
  created_at        timestamptz DEFAULT now()
);

-- 30. budgets
CREATE TABLE IF NOT EXISTS public.budgets (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  workspace_id      uuid,
  data              jsonb,
  deleted_at        timestamptz,
  client_updated_at timestamptz,
  updated_at        timestamptz DEFAULT now(),
  created_at        timestamptz DEFAULT now()
);

-- 31. financialSnapshots (synced via save() but not in SYNC_ENTITIES)
CREATE TABLE IF NOT EXISTS public."financialSnapshots" (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  workspace_id      uuid,
  data              jsonb,
  deleted_at        timestamptz,
  client_updated_at timestamptz,
  updated_at        timestamptz DEFAULT now(),
  created_at        timestamptz DEFAULT now()
);


-- ============================================================
-- INDEXES: user_id + updated_at on every sync entity table
-- ============================================================

CREATE INDEX IF NOT EXISTS idx_prospects_user ON public.prospects(user_id);
CREATE INDEX IF NOT EXISTS idx_prospects_updated ON public.prospects(updated_at);
CREATE INDEX IF NOT EXISTS idx_events_user ON public.events(user_id);
CREATE INDEX IF NOT EXISTS idx_events_updated ON public.events(updated_at);
CREATE INDEX IF NOT EXISTS idx_tasks_user ON public.tasks(user_id);
CREATE INDEX IF NOT EXISTS idx_tasks_updated ON public.tasks(updated_at);
CREATE INDEX IF NOT EXISTS idx_notes_user ON public.notes(user_id);
CREATE INDEX IF NOT EXISTS idx_notes_updated ON public.notes(updated_at);
CREATE INDEX IF NOT EXISTS idx_products_user ON public.products(user_id);
CREATE INDEX IF NOT EXISTS idx_products_updated ON public.products(updated_at);
CREATE INDEX IF NOT EXISTS idx_orders_user ON public.orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_updated ON public.orders(updated_at);
CREATE INDEX IF NOT EXISTS idx_services_user ON public.services(user_id);
CREATE INDEX IF NOT EXISTS idx_services_updated ON public.services(updated_at);
CREATE INDEX IF NOT EXISTS idx_time_entries_user ON public.time_entries(user_id);
CREATE INDEX IF NOT EXISTS idx_time_entries_updated ON public.time_entries(updated_at);
CREATE INDEX IF NOT EXISTS idx_invoices_user ON public.invoices(user_id);
CREATE INDEX IF NOT EXISTS idx_invoices_updated ON public.invoices(updated_at);
CREATE INDEX IF NOT EXISTS idx_jobs_user ON public.jobs(user_id);
CREATE INDEX IF NOT EXISTS idx_jobs_updated ON public.jobs(updated_at);
CREATE INDEX IF NOT EXISTS idx_bookings_user ON public.bookings(user_id);
CREATE INDEX IF NOT EXISTS idx_bookings_updated ON public.bookings(updated_at);
CREATE INDEX IF NOT EXISTS idx_contacts_user ON public.contacts(user_id);
CREATE INDEX IF NOT EXISTS idx_contacts_updated ON public.contacts(updated_at);
CREATE INDEX IF NOT EXISTS idx_cliques_user ON public.cliques(user_id);
CREATE INDEX IF NOT EXISTS idx_cliques_updated ON public.cliques(updated_at);
CREATE INDEX IF NOT EXISTS idx_connections_user ON public.connections(user_id);
CREATE INDEX IF NOT EXISTS idx_connections_updated ON public.connections(updated_at);
CREATE INDEX IF NOT EXISTS idx_places_user ON public.places(user_id);
CREATE INDEX IF NOT EXISTS idx_places_updated ON public.places(updated_at);
CREATE INDEX IF NOT EXISTS idx_discoveries_user ON public.discoveries(user_id);
CREATE INDEX IF NOT EXISTS idx_discoveries_updated ON public.discoveries(updated_at);
CREATE INDEX IF NOT EXISTS idx_checkins_user ON public.checkins(user_id);
CREATE INDEX IF NOT EXISTS idx_checkins_updated ON public.checkins(updated_at);
CREATE INDEX IF NOT EXISTS idx_functions_user ON public.functions(user_id);
CREATE INDEX IF NOT EXISTS idx_functions_updated ON public.functions(updated_at);
CREATE INDEX IF NOT EXISTS idx_invites_user ON public.invites(user_id);
CREATE INDEX IF NOT EXISTS idx_invites_updated ON public.invites(updated_at);
CREATE INDEX IF NOT EXISTS idx_hangouts_user ON public.hangouts(user_id);
CREATE INDEX IF NOT EXISTS idx_hangouts_updated ON public.hangouts(updated_at);
CREATE INDEX IF NOT EXISTS idx_trips_user ON public.trips(user_id);
CREATE INDEX IF NOT EXISTS idx_trips_updated ON public.trips(updated_at);
CREATE INDEX IF NOT EXISTS idx_dates_user ON public.dates(user_id);
CREATE INDEX IF NOT EXISTS idx_dates_updated ON public.dates(updated_at);
CREATE INDEX IF NOT EXISTS idx_quests_user ON public.quests(user_id);
CREATE INDEX IF NOT EXISTS idx_quests_updated ON public.quests(updated_at);
CREATE INDEX IF NOT EXISTS idx_group_challenges_user ON public.group_challenges(user_id);
CREATE INDEX IF NOT EXISTS idx_group_challenges_updated ON public.group_challenges(updated_at);
CREATE INDEX IF NOT EXISTS idx_accountability_user ON public.accountability(user_id);
CREATE INDEX IF NOT EXISTS idx_accountability_updated ON public.accountability(updated_at);
CREATE INDEX IF NOT EXISTS idx_expenses_user ON public.expenses(user_id);
CREATE INDEX IF NOT EXISTS idx_expenses_updated ON public.expenses(updated_at);
CREATE INDEX IF NOT EXISTS idx_receipts_user ON public.receipts(user_id);
CREATE INDEX IF NOT EXISTS idx_receipts_updated ON public.receipts(updated_at);
CREATE INDEX IF NOT EXISTS idx_bankAccounts_user ON public."bankAccounts"(user_id);
CREATE INDEX IF NOT EXISTS idx_bankAccounts_updated ON public."bankAccounts"(updated_at);
CREATE INDEX IF NOT EXISTS idx_bankTransactions_user ON public."bankTransactions"(user_id);
CREATE INDEX IF NOT EXISTS idx_bankTransactions_updated ON public."bankTransactions"(updated_at);
CREATE INDEX IF NOT EXISTS idx_budgets_user ON public.budgets(user_id);
CREATE INDEX IF NOT EXISTS idx_budgets_updated ON public.budgets(updated_at);
CREATE INDEX IF NOT EXISTS idx_financialSnapshots_user ON public."financialSnapshots"(user_id);
CREATE INDEX IF NOT EXISTS idx_financialSnapshots_updated ON public."financialSnapshots"(updated_at);

-- workspace_id indexes for shared-data queries
CREATE INDEX IF NOT EXISTS idx_prospects_ws ON public.prospects(workspace_id) WHERE workspace_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_events_ws ON public.events(workspace_id) WHERE workspace_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_tasks_ws ON public.tasks(workspace_id) WHERE workspace_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_notes_ws ON public.notes(workspace_id) WHERE workspace_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_products_ws ON public.products(workspace_id) WHERE workspace_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_orders_ws ON public.orders(workspace_id) WHERE workspace_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_services_ws ON public.services(workspace_id) WHERE workspace_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_time_entries_ws ON public.time_entries(workspace_id) WHERE workspace_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_invoices_ws ON public.invoices(workspace_id) WHERE workspace_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_jobs_ws ON public.jobs(workspace_id) WHERE workspace_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_bookings_ws ON public.bookings(workspace_id) WHERE workspace_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_contacts_ws ON public.contacts(workspace_id) WHERE workspace_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_expenses_ws ON public.expenses(workspace_id) WHERE workspace_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_budgets_ws ON public.budgets(workspace_id) WHERE workspace_id IS NOT NULL;


-- ============================================================
-- RLS POLICIES: Enable RLS + apply standard policies on all
-- sync entity tables.
--
-- SELECT: user_id = auth.uid() OR workspace_id in user's workspaces
-- INSERT: user_id = auth.uid()
-- UPDATE: user_id = auth.uid()
-- DELETE: user_id = auth.uid()
-- ============================================================

-- Helper to apply RLS to a list of tables via DO block
DO $$
DECLARE
  tbl text;
  tbls text[] := ARRAY[
    'prospects','events','tasks','notes','products','orders',
    'services','time_entries','invoices','jobs','bookings','contacts',
    'cliques','connections','places','discoveries','checkins',
    'functions','invites','hangouts','trips','dates',
    'quests','group_challenges','accountability',
    'expenses','receipts','budgets'
  ];
  quoted_tbls text[] := ARRAY[
    'bankAccounts','bankTransactions','financialSnapshots'
  ];
  qtbl text;
BEGIN
  -- Standard (unquoted) tables
  FOREACH tbl IN ARRAY tbls LOOP
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', tbl);

    EXECUTE format(
      'CREATE POLICY %I ON public.%I FOR SELECT USING (
        user_id = auth.uid()
        OR workspace_id IN (SELECT public.user_workspace_ids(auth.uid()))
      )',
      tbl || '_select', tbl
    );

    EXECUTE format(
      'CREATE POLICY %I ON public.%I FOR INSERT WITH CHECK (user_id = auth.uid())',
      tbl || '_insert', tbl
    );

    EXECUTE format(
      'CREATE POLICY %I ON public.%I FOR UPDATE USING (user_id = auth.uid())',
      tbl || '_update', tbl
    );

    EXECUTE format(
      'CREATE POLICY %I ON public.%I FOR DELETE USING (user_id = auth.uid())',
      tbl || '_delete', tbl
    );
  END LOOP;

  -- Quoted (camelCase) tables
  FOREACH qtbl IN ARRAY quoted_tbls LOOP
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', qtbl);

    EXECUTE format(
      'CREATE POLICY %I ON public.%I FOR SELECT USING (
        user_id = auth.uid()
        OR workspace_id IN (SELECT public.user_workspace_ids(auth.uid()))
      )',
      qtbl || '_select', qtbl
    );

    EXECUTE format(
      'CREATE POLICY %I ON public.%I FOR INSERT WITH CHECK (user_id = auth.uid())',
      qtbl || '_insert', qtbl
    );

    EXECUTE format(
      'CREATE POLICY %I ON public.%I FOR UPDATE USING (user_id = auth.uid())',
      qtbl || '_update', qtbl
    );

    EXECUTE format(
      'CREATE POLICY %I ON public.%I FOR DELETE USING (user_id = auth.uid())',
      qtbl || '_delete', qtbl
    );
  END LOOP;
END $$;


-- ============================================================
-- AUTO-UPDATE updated_at TRIGGER
-- ============================================================
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DO $$
DECLARE
  tbl text;
  tbls text[] := ARRAY[
    'profiles','workspaces','user_config',
    'prospects','events','tasks','notes','products','orders',
    'services','time_entries','invoices','jobs','bookings','contacts',
    'cliques','connections','places','discoveries','checkins',
    'functions','invites','hangouts','trips','dates',
    'quests','group_challenges','accountability',
    'expenses','receipts','budgets',
    'bank_connections','report_schedules',
    'bankAccounts','bankTransactions','financialSnapshots'
  ];
BEGIN
  FOREACH tbl IN ARRAY tbls LOOP
    EXECUTE format(
      'CREATE TRIGGER trg_%s_updated_at
       BEFORE UPDATE ON public.%I
       FOR EACH ROW EXECUTE FUNCTION public.set_updated_at()',
      replace(tbl, '"', ''), tbl
    );
  END LOOP;
END $$;


-- ============================================================
-- AUTO-CREATE PROFILE ON AUTH SIGNUP
-- ============================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, display_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'display_name', split_part(NEW.email, '@', 1))
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();


-- ============================================================
-- Plaid-specific: bank_accounts and bank_transactions used by
-- Edge Functions (snake_case, separate from sync entity tables)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.bank_accounts (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  connection_id     uuid REFERENCES public.bank_connections(id) ON DELETE CASCADE,
  plaid_account_id  text,
  name              text,
  official_name     text,
  type              text,
  subtype           text,
  mask              text,
  current_balance   numeric,
  available_balance numeric,
  iso_currency_code text DEFAULT 'USD',
  created_at        timestamptz DEFAULT now(),
  updated_at        timestamptz DEFAULT now()
);

ALTER TABLE public.bank_accounts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "ba_select" ON public.bank_accounts FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "ba_insert" ON public.bank_accounts FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "ba_update" ON public.bank_accounts FOR UPDATE USING (user_id = auth.uid());

CREATE TABLE IF NOT EXISTS public.bank_transactions (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id             uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  account_id          uuid REFERENCES public.bank_accounts(id) ON DELETE CASCADE,
  plaid_transaction_id text UNIQUE,
  amount              numeric,
  name                text,
  merchant_name       text,
  category            text[],
  date                date,
  pending             boolean DEFAULT false,
  iso_currency_code   text DEFAULT 'USD',
  created_at          timestamptz DEFAULT now(),
  updated_at          timestamptz DEFAULT now()
);

ALTER TABLE public.bank_transactions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "bt_select" ON public.bank_transactions FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "bt_insert" ON public.bank_transactions FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "bt_update" ON public.bank_transactions FOR UPDATE USING (user_id = auth.uid());

CREATE INDEX IF NOT EXISTS idx_bank_accounts_user ON public.bank_accounts(user_id);
CREATE INDEX IF NOT EXISTS idx_bank_accounts_conn ON public.bank_accounts(connection_id);
CREATE INDEX IF NOT EXISTS idx_bank_transactions_user ON public.bank_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_bank_transactions_account ON public.bank_transactions(account_id);
CREATE INDEX IF NOT EXISTS idx_bank_transactions_date ON public.bank_transactions(date);
