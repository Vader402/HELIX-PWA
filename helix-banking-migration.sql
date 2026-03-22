-- ============================================
-- HELIX BANKING - SQL MIGRATION
-- Plaid-powered banking: connections, accounts,
-- transactions, reconciliation
-- Run in Supabase SQL Editor
-- ============================================

-- Enable Vault extension (idempotent)
CREATE EXTENSION IF NOT EXISTS vault WITH SCHEMA vault;

-- 1. BANK CONNECTIONS
-- access_token stored in Supabase Vault (vault_secret_id references it)
-- NEVER stored in plain text in this table
CREATE TABLE IF NOT EXISTS bank_connections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  plaid_item_id text UNIQUE NOT NULL,
  vault_secret_id uuid NOT NULL,
  institution_id text,
  institution_name text,
  status text NOT NULL DEFAULT 'active'
    CHECK (status IN ('active','error','expired','pending_reauth')),
  error_code text,
  error_message text,
  consent_expires_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_bank_connections_user ON bank_connections(user_id);

-- Helper: store access token in Vault, return secret ID
CREATE OR REPLACE FUNCTION store_plaid_token(p_access_token text, p_item_id text)
RETURNS uuid AS $$
DECLARE
  secret_id uuid;
BEGIN
  INSERT INTO vault.secrets (secret, name, description)
  VALUES (p_access_token, 'plaid_' || p_item_id, 'Plaid access token for item ' || p_item_id)
  RETURNING id INTO secret_id;
  RETURN secret_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Helper: retrieve access token from Vault
CREATE OR REPLACE FUNCTION get_plaid_token(p_vault_secret_id uuid)
RETURNS text AS $$
DECLARE
  token text;
BEGIN
  SELECT decrypted_secret INTO token
  FROM vault.decrypted_secrets
  WHERE id = p_vault_secret_id;
  RETURN token;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Helper: rotate access token in Vault
CREATE OR REPLACE FUNCTION rotate_plaid_token(p_vault_secret_id uuid, p_new_token text)
RETURNS void AS $$
BEGIN
  UPDATE vault.secrets
  SET secret = p_new_token
  WHERE id = p_vault_secret_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. BANK ACCOUNTS
-- Individual accounts within a connection (checking, savings, credit, etc.)
CREATE TABLE IF NOT EXISTS bank_accounts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  connection_id uuid NOT NULL REFERENCES bank_connections(id) ON DELETE CASCADE,
  plaid_account_id text UNIQUE NOT NULL,
  name text NOT NULL,
  official_name text,
  type text NOT NULL,
  subtype text,
  mask text,
  current_balance numeric(12,2),
  available_balance numeric(12,2),
  currency_code text DEFAULT 'USD',
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_bank_accounts_user ON bank_accounts(user_id);
CREATE INDEX IF NOT EXISTS idx_bank_accounts_connection ON bank_accounts(connection_id);

-- 3. BANK TRANSACTIONS
-- Raw transaction data from Plaid sync
CREATE TABLE IF NOT EXISTS bank_transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  account_id uuid NOT NULL REFERENCES bank_accounts(id) ON DELETE CASCADE,
  plaid_transaction_id text UNIQUE NOT NULL,
  amount numeric(12,2) NOT NULL,
  currency_code text DEFAULT 'USD',
  date date NOT NULL,
  authorized_date date,
  name text NOT NULL,
  merchant_name text,
  category text[],
  pending boolean NOT NULL DEFAULT false,
  payment_channel text,
  transaction_type text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_bank_txn_user ON bank_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_bank_txn_account ON bank_transactions(account_id);
CREATE INDEX IF NOT EXISTS idx_bank_txn_date ON bank_transactions(date DESC);
CREATE INDEX IF NOT EXISTS idx_bank_txn_plaid ON bank_transactions(plaid_transaction_id);

-- 4. BANK SYNC CURSORS
-- Tracks Plaid sync cursor per connection for incremental transaction sync
-- sync_in_progress prevents concurrent syncs from webhook + manual trigger
CREATE TABLE IF NOT EXISTS bank_sync_cursors (
  connection_id uuid PRIMARY KEY REFERENCES bank_connections(id) ON DELETE CASCADE,
  cursor text NOT NULL DEFAULT '',
  sync_in_progress boolean NOT NULL DEFAULT false,
  sync_started_at timestamptz,
  last_synced_at timestamptz NOT NULL DEFAULT now()
);

-- Atomic lock function: returns true if lock acquired, false if already syncing
CREATE OR REPLACE FUNCTION acquire_sync_lock(p_connection_id uuid)
RETURNS boolean AS $$
DECLARE
  acquired boolean;
BEGIN
  UPDATE bank_sync_cursors
  SET sync_in_progress = true, sync_started_at = now()
  WHERE connection_id = p_connection_id
    AND (sync_in_progress = false
         OR sync_started_at < now() - interval '10 minutes')
  RETURNING true INTO acquired;
  RETURN COALESCE(acquired, false);
END;
$$ LANGUAGE plpgsql;

-- Release lock after sync completes
CREATE OR REPLACE FUNCTION release_sync_lock(p_connection_id uuid, p_cursor text)
RETURNS void AS $$
BEGIN
  UPDATE bank_sync_cursors
  SET sync_in_progress = false,
      sync_started_at = null,
      cursor = p_cursor,
      last_synced_at = now()
  WHERE connection_id = p_connection_id;
END;
$$ LANGUAGE plpgsql;

-- 5. BANK RECONCILIATIONS
-- Links bank transactions to Helix invoices/jobs (many-to-many)
-- One transaction can split across multiple invoices/jobs
-- matched_amount tracks how much of the transaction applies to each entity
CREATE TABLE IF NOT EXISTS bank_reconciliations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  transaction_id uuid NOT NULL REFERENCES bank_transactions(id) ON DELETE CASCADE,
  entity_type text NOT NULL,
  entity_id text NOT NULL,
  matched_amount numeric(12,2) NOT NULL,
  match_type text NOT NULL DEFAULT 'manual'
    CHECK (match_type IN ('manual','auto','suggested')),
  confidence numeric(3,2),
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT valid_entity_type CHECK (entity_type IN ('invoice', 'job'))
);

CREATE INDEX IF NOT EXISTS idx_bank_recon_user ON bank_reconciliations(user_id);
CREATE INDEX IF NOT EXISTS idx_bank_recon_txn ON bank_reconciliations(transaction_id);
CREATE INDEX IF NOT EXISTS idx_bank_recon_entity ON bank_reconciliations(entity_type, entity_id);

-- ============================================
-- RLS POLICIES
-- ============================================

ALTER TABLE bank_connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE bank_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE bank_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE bank_sync_cursors ENABLE ROW LEVEL SECURITY;
ALTER TABLE bank_reconciliations ENABLE ROW LEVEL SECURITY;

-- Users can read their own connections (minus vault_secret_id — never exposed)
-- Client queries SELECT id, institution_name, status, etc. — never vault_secret_id
CREATE POLICY "users_read_own_connections"
  ON bank_connections FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "users_read_own_accounts"
  ON bank_accounts FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "users_read_own_transactions"
  ON bank_transactions FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "users_read_own_reconciliations"
  ON bank_reconciliations FOR SELECT
  USING (user_id = auth.uid());

-- Users can create/update/delete their own reconciliations
CREATE POLICY "users_insert_own_reconciliations"
  ON bank_reconciliations FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "users_update_own_reconciliations"
  ON bank_reconciliations FOR UPDATE
  USING (user_id = auth.uid());

CREATE POLICY "users_delete_own_reconciliations"
  ON bank_reconciliations FOR DELETE
  USING (user_id = auth.uid());

-- Service role (Edge Functions) handles all writes to
-- bank_connections, bank_accounts, bank_transactions, bank_sync_cursors
-- No INSERT/UPDATE/DELETE policies needed for authenticated users on those tables

-- Vault functions are SECURITY DEFINER — only callable by service role
-- Revoke execute from anon and authenticated
REVOKE EXECUTE ON FUNCTION store_plaid_token FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION get_plaid_token FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION rotate_plaid_token FROM anon, authenticated;

-- ============================================
-- UPDATED_AT TRIGGER
-- ============================================

CREATE OR REPLACE FUNCTION update_banking_updated_at()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER bank_connections_updated_at
  BEFORE UPDATE ON bank_connections
  FOR EACH ROW EXECUTE FUNCTION update_banking_updated_at();

CREATE TRIGGER bank_accounts_updated_at
  BEFORE UPDATE ON bank_accounts
  FOR EACH ROW EXECUTE FUNCTION update_banking_updated_at();

-- ============================================
-- SECURITY NOTES:
-- - access_token stored in Supabase Vault, referenced by vault_secret_id
--   Vault handles encryption + rotation. Only SECURITY DEFINER functions access it.
-- - vault_secret_id column IS visible to client via RLS SELECT,
--   but it's just a UUID — useless without vault access (revoked from anon/authenticated)
-- - Client can only SELECT their own data via RLS
-- - Client can only write to bank_reconciliations (manual matching)
-- - All other writes go through Edge Functions with service_role key
-- - Plaid webhook signatures verified in plaid-webhook Edge Function
-- - Sync lock prevents concurrent syncs (10-min stale timeout)
-- ============================================
