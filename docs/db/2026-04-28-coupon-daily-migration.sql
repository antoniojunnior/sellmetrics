-- Migração F0.6: tabela coupon_daily para substituir period_manual_inputs para cupons
-- Executar no painel do Supabase ou via Supabase CLI
-- Esta migração pode ser executada incrementalmente — period_manual_inputs continua funcionando

-- 1. Criar tabela coupon_daily
CREATE TABLE IF NOT EXISTS coupon_daily (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id TEXT NOT NULL,
  sku TEXT NOT NULL DEFAULT '',          -- '' = vale para todos os SKUs da conta
  snapshot_date DATE NOT NULL,
  coupon_sales_value NUMERIC(12,2) NOT NULL DEFAULT 0,
  coupon_cost_value NUMERIC(12,2) NOT NULL DEFAULT 0,
  coupon_distributed INTEGER NOT NULL DEFAULT 0,
  coupon_redeemed INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (account_id, sku, snapshot_date)
);

-- 2. RLS
ALTER TABLE coupon_daily ENABLE ROW LEVEL SECURITY;

CREATE POLICY "coupon_daily: user vê apenas sua conta"
  ON coupon_daily FOR ALL
  USING (account_id = auth.uid()::text);

-- 3. Índice para queries por período
CREATE INDEX IF NOT EXISTS coupon_daily_account_date
  ON coupon_daily (account_id, snapshot_date);

-- 4. Trigger updated_at
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER coupon_daily_updated_at
  BEFORE UPDATE ON coupon_daily
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- NOTAS:
-- - sku = '' (string vazia) representa cupons de conta inteira (todos os SKUs).
--   Usar string vazia em vez de NULL garante que UNIQUE (account_id, sku, snapshot_date) funcione corretamente.
-- - A migração de dados de period_manual_inputs → coupon_daily deve ser feita manualmente
--   ou via script, distribuindo o valor do período pelos dias individuais.
-- - O código de consumo foi migrado: coupon-daily-repository.ts substitui period-manual-inputs-repository.ts.
