Com base no schema aprovado em docs/db-spec/2026-04-04-schema-v1.sql,
crie os arquivos de migração Supabase na pasta docs/db/, um arquivo por tabela,
nomeados com o padrão: YYYY-MM-DD-nome-da-tabela.sql

As tabelas a criar são:

1. daily_sales_snapshot
   - Chave: (account_id, marketplace_id, sku, snapshot_date) UNIQUE
   - Campos: orders_count, units_sold, gross_sales
   - Sem SCD2; cada linha é um fato histórico diário

2. daily_ads_snapshot
   - Chave: (account_id, marketplace_id, snapshot_date) UNIQUE
   - Campos: ads_spend, ads_sales, ads_clicks, ads_orders

3. sku_cost_parameters (SCD2 obrigatório)
   - Campos: unit_cost, prep_cost_unit, tax_rate, amazon_fee_unit
   - Campos de temporalidade: valid_from (date), valid_to (date nullable)
   - Regra: valid_from <= target_date AND (valid_to > target_date OR valid_to IS NULL)
   - NUNCA atualizar por overwrite; sempre inserir novo registro e fechar valid_to do anterior

4. fixed_costs_monthly
   - Chave: (account_id, year_month) UNIQUE
   - Campos: accounting_fees, rent, amazon_prime, other_fixed_costs
   - total_fixed_month como coluna gerada (soma dos anteriores)

5. period_manual_inputs
   - Chave: (account_id, period_start_date, period_end_date) UNIQUE
   - Campos: coupon_sales_value, coupon_cost_value, coupon_distributed, coupon_redeemed
   - manual_notes (text), manual_adjustments (jsonb)

Para todas as tabelas:
- Habilitar RLS (Row Level Security)
- Criar políticas de acesso por tenant (usar tenant_id ou account_id como filtro)
- Criar índices relevantes para queries de período (account_id + snapshot_date)
- Usar uuid para PKs com gen_random_uuid()
- Incluir created_at e updated_at (timestamptz)

Ao final, faça commit com:
db(migration): create core snapshot and cost parameter tables

Me mostre cada arquivo criado com seu conteúdo.
