-- F0.5 — Minimal accounts table for cron job multi-account support
-- F1.1 will extend this with: name, owner_id, sp_api_credentials, ads_api_credentials, stripe fields, etc.
--
-- To seed your account after creating the table:
-- INSERT INTO accounts (id, marketplace_id, ads_profile_id)
-- VALUES ('<your-auth-uid>', 'A2Q3Y263D00KWC', '<your-ads-profile-id>');

CREATE TABLE IF NOT EXISTS accounts (
  id TEXT PRIMARY KEY,                        -- = auth.uid() in Phase 0; UUID in Phase 1
  marketplace_id TEXT NOT NULL DEFAULT 'A2Q3Y263D00KWC',
  ads_profile_id TEXT NOT NULL DEFAULT '',
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- RLS: only the owner (whose uid matches the account id) can see their row
ALTER TABLE accounts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "accounts: user sees own row"
  ON accounts FOR ALL
  USING (id = auth.uid()::text);

-- Trigger updated_at (reuses function created by coupon_daily migration if already applied)
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER accounts_updated_at
  BEFORE UPDATE ON accounts
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();
