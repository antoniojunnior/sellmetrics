-- Procedure para Upsert de Custo SCD2 (Atômico)
-- Data: 2026-04-04

CREATE OR REPLACE FUNCTION create_sku_cost_regime(
  p_account_id TEXT,
  p_marketplace_id TEXT,
  p_sku TEXT,
  p_unit_cost NUMERIC,
  p_prep_cost_unit NUMERIC,
  p_tax_rate NUMERIC,
  p_amazon_fee_unit NUMERIC,
  p_valid_from DATE
) RETURNS void AS $$
BEGIN
  -- 1. Fecha o regime anterior (se existir um aberto)
  UPDATE sku_cost_parameters
  SET valid_to = p_valid_from,
      updated_at = NOW()
  WHERE account_id = p_account_id
    AND marketplace_id = p_marketplace_id
    AND sku = p_sku
    AND valid_to IS NULL;

  -- 2. Insere o novo regime
  INSERT INTO sku_cost_parameters (
    account_id,
    marketplace_id,
    sku,
    unit_cost,
    prep_cost_unit,
    tax_rate,
    amazon_fee_unit,
    valid_from,
    valid_to
  ) VALUES (
    p_account_id,
    p_marketplace_id,
    p_sku,
    p_unit_cost,
    p_prep_cost_unit,
    p_tax_rate,
    p_amazon_fee_unit,
    p_valid_from,
    NULL
  );
END;
$$ LANGUAGE plpgsql;
