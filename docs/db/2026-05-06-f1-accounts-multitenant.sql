-- F1.1 — SaaS Multi-tenant: accounts full schema + account_members + RLS migration
-- Requires: 2026-05-06-accounts-minimal.sql (accounts table must exist)
-- Date: 2026-05-06

-- ─── 1. subscription_plans ───────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS subscription_plans (
  id          TEXT        PRIMARY KEY,  -- 'free', 'starter', 'pro'
  name        TEXT        NOT NULL,
  price_brl   INTEGER     NOT NULL DEFAULT 0,  -- centavos
  sku_limit   INTEGER,                          -- NULL = unlimited
  user_limit  INTEGER     NOT NULL DEFAULT 1,
  history_days INTEGER,                          -- NULL = unlimited
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

INSERT INTO subscription_plans (id, name, price_brl, sku_limit, user_limit, history_days) VALUES
  ('free',    'Free',    0,     5,    1, 30),
  ('starter', 'Starter', 7900,  30,   2, 365),
  ('pro',     'Pro',     14900, NULL, 5, NULL)
ON CONFLICT (id) DO NOTHING;

-- ─── 2. Alter accounts (add missing F1.1 columns) ────────────────────────────

ALTER TABLE accounts
  ADD COLUMN IF NOT EXISTS name                   TEXT,
  ADD COLUMN IF NOT EXISTS owner_id               UUID,
  ADD COLUMN IF NOT EXISTS currency               TEXT NOT NULL DEFAULT 'BRL',
  ADD COLUMN IF NOT EXISTS timezone               TEXT NOT NULL DEFAULT 'America/Sao_Paulo',
  ADD COLUMN IF NOT EXISTS sp_api_refresh_token_enc  TEXT,
  ADD COLUMN IF NOT EXISTS ads_refresh_token_enc     TEXT,
  ADD COLUMN IF NOT EXISTS plan_id                TEXT NOT NULL DEFAULT 'free'
    REFERENCES subscription_plans(id),
  ADD COLUMN IF NOT EXISTS trial_ends_at          TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS onboarding_completed   BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS onboarding_step        INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS stripe_customer_id     TEXT,
  ADD COLUMN IF NOT EXISTS stripe_subscription_id TEXT;

-- Backfill: accounts criadas na Fase 0 têm id = auth.uid() como owner
UPDATE accounts
SET owner_id = id::uuid
WHERE owner_id IS NULL
  AND id ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$';

-- ─── 3. account_members ──────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS account_members (
  account_id   TEXT        NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  user_id      UUID        NOT NULL,
  role         TEXT        NOT NULL DEFAULT 'owner'
    CHECK (role IN ('owner', 'member', 'viewer')),
  invited_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  accepted_at  TIMESTAMPTZ,
  PRIMARY KEY (account_id, user_id)
);

CREATE INDEX IF NOT EXISTS account_members_user_idx ON account_members(user_id);

-- Backfill: existing accounts get owner membership
INSERT INTO account_members (account_id, user_id, role, accepted_at)
SELECT
  a.id              AS account_id,
  a.id::uuid        AS user_id,
  'owner'           AS role,
  a.created_at      AS accepted_at
FROM accounts a
WHERE a.id ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
ON CONFLICT (account_id, user_id) DO NOTHING;

-- RLS for account_members
ALTER TABLE account_members ENABLE ROW LEVEL SECURITY;

-- Owner sees all members of their accounts; members see their own row
CREATE POLICY "account_members_select"
  ON account_members FOR SELECT
  USING (
    user_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM account_members am
      WHERE am.account_id = account_members.account_id
        AND am.user_id = auth.uid()
        AND am.role = 'owner'
    )
  );

CREATE POLICY "account_members_owner_mutate"
  ON account_members FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM account_members am
      WHERE am.account_id = account_members.account_id
        AND am.user_id = auth.uid()
        AND am.role = 'owner'
    )
  );

-- ─── 4. RLS helper function ───────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION is_account_member(p_account_id TEXT)
RETURNS BOOLEAN
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM account_members
    WHERE account_id = p_account_id
      AND user_id = auth.uid()
  );
$$;

-- ─── 5. Update accounts RLS ───────────────────────────────────────────────────

DROP POLICY IF EXISTS "accounts: user sees own row" ON accounts;

CREATE POLICY "accounts_member_access"
  ON accounts FOR SELECT
  USING (is_account_member(id));

CREATE POLICY "accounts_owner_mutate"
  ON accounts FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM account_members
      WHERE account_id = accounts.id
        AND user_id = auth.uid()
        AND role = 'owner'
    )
  );

-- ─── 6. Migrate RLS on all data tables ───────────────────────────────────────

-- daily_sales_snapshot
DROP POLICY IF EXISTS "daily_sales_snapshot_tenant_isolation" ON daily_sales_snapshot;
CREATE POLICY "daily_sales_snapshot_member_access"
  ON daily_sales_snapshot FOR ALL
  USING (is_account_member(account_id));

-- daily_ads_snapshot
DROP POLICY IF EXISTS "daily_ads_snapshot_tenant_isolation" ON daily_ads_snapshot;
CREATE POLICY "daily_ads_snapshot_member_access"
  ON daily_ads_snapshot FOR ALL
  USING (is_account_member(account_id));

-- sku_cost_parameters
DROP POLICY IF EXISTS "sku_cost_parameters_tenant_isolation" ON sku_cost_parameters;
CREATE POLICY "sku_cost_parameters_member_access"
  ON sku_cost_parameters FOR ALL
  USING (is_account_member(account_id));

-- fixed_costs_monthly
DROP POLICY IF EXISTS "fixed_costs_monthly_tenant_isolation" ON fixed_costs_monthly;
CREATE POLICY "fixed_costs_monthly_member_access"
  ON fixed_costs_monthly FOR ALL
  USING (is_account_member(account_id));

-- period_manual_inputs
DROP POLICY IF EXISTS "period_manual_inputs_tenant_isolation" ON period_manual_inputs;
CREATE POLICY "period_manual_inputs_member_access"
  ON period_manual_inputs FOR ALL
  USING (is_account_member(account_id));

-- coupon_daily (created in F0.6 — policy name may vary)
DROP POLICY IF EXISTS "coupon_daily_tenant_isolation" ON coupon_daily;
DROP POLICY IF EXISTS "coupon_daily_owner_access" ON coupon_daily;
CREATE POLICY "coupon_daily_member_access"
  ON coupon_daily FOR ALL
  USING (is_account_member(account_id));

-- ─── 7. subscription_plans RLS (public read) ─────────────────────────────────

ALTER TABLE subscription_plans ENABLE ROW LEVEL SECURITY;
CREATE POLICY "subscription_plans_public_read"
  ON subscription_plans FOR SELECT USING (true);
