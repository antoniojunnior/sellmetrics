-- sku_cost_parameters migration (SCD2)
-- Data: 2026-04-04

create table sku_cost_parameters (
  id                uuid          primary key default gen_random_uuid(),

  account_id        text          not null,
  marketplace_id    text          not null,
  sku               text          not null,

  -- Parâmetros de custo por unidade
  unit_cost         numeric(14,4) not null,   -- COGS unitário
  prep_cost_unit    numeric(14,4) not null,   -- Custo de preparação por unidade
  tax_rate          numeric(8,4)  not null,   -- Alíquota de imposto
  amazon_fee_unit   numeric(14,4) not null,   -- Taxa Amazon estimada por unidade

  -- Temporalidade SCD2
  valid_from        date          not null,
  valid_to          date,

  created_at        timestamptz   not null default now(),
  updated_at        timestamptz   not null default now(),

  constraint sku_cost_valid_from_before_valid_to
    check (valid_to is null or valid_to > valid_from)
);

-- Índice de lookup por data (account_id + marketplace_id + sku + temporalidade)
create index sku_cost_parameters_lookup_idx
  on sku_cost_parameters (
    account_id,
    marketplace_id,
    sku,
    valid_from,
    coalesce(valid_to, '9999-12-31'::date)
  );

-- RLS
alter table sku_cost_parameters enable row level security;

create policy "sku_cost_parameters_tenant_isolation"
  on sku_cost_parameters
  for all
  using (account_id = auth.uid()::text);
