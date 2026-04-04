-- =============================================================================
-- Sellmetrics — Schema v1
-- Arquivo: docs/db-spec/2026-04-04-schema-v1.sql
-- Commit sugerido: docs(db): add sellmetrics schema v1
-- =============================================================================


-- -----------------------------------------------------------------------------
-- 1. daily_sales_snapshot
-- Fonte: SP-API Sales & Traffic Report (dateGranularity=DAY, asinGranularity=SKU)
-- Uso: Vendas, Unidades, Pedidos, COGS do período, TACOS (denominador)
-- Temporalidade: fato histórico diário; sem SCD2; reprocessável sob comando
-- -----------------------------------------------------------------------------

create table daily_sales_snapshot (
  id               uuid        primary key default gen_random_uuid(),

  account_id       text        not null,
  marketplace_id   text        not null,
  sku              text        not null,
  snapshot_date    date        not null,

  -- Métricas diárias (fonte: orderedProductSales, unitsOrdered, totalOrderItems)
  orders_count     integer     not null default 0,
  units_sold       integer     not null default 0,
  gross_sales      numeric(14,2) not null default 0,

  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

-- Garante unicidade por dia/conta/marketplace/SKU
create unique index daily_sales_snapshot_ux
  on daily_sales_snapshot (account_id, marketplace_id, sku, snapshot_date);

-- Índice para queries de período
create index daily_sales_snapshot_period_idx
  on daily_sales_snapshot (account_id, marketplace_id, snapshot_date);

-- RLS
alter table daily_sales_snapshot enable row level security;

create policy "daily_sales_snapshot_tenant_isolation"
  on daily_sales_snapshot
  for all
  using (account_id = current_setting('app.current_account_id', true));


-- -----------------------------------------------------------------------------
-- 2. daily_ads_snapshot
-- Fonte: Amazon Ads API — Sponsored Products, timeUnit=DAILY, janela de
--        atribuição fixa (ex: 7 dias). Snapshot congelado na data de captura.
-- Uso: ADS, Vendas ADS, Cliques, ACOS, TACOS, Conversão ADS
-- Temporalidade: snapshot congelado; não reabre histórico por atribuição
-- -----------------------------------------------------------------------------

create table daily_ads_snapshot (
  id               uuid        primary key default gen_random_uuid(),

  account_id       text        not null,
  marketplace_id   text        not null,
  snapshot_date    date        not null,

  -- Métricas diárias (fonte: cost, attributedSales, clicks, attributedConversions)
  ads_spend        numeric(14,2) not null default 0,
  ads_sales        numeric(14,2) not null default 0,
  ads_clicks       integer     not null default 0,
  ads_orders       integer     not null default 0,

  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

-- Garante unicidade por dia/conta/marketplace
create unique index daily_ads_snapshot_ux
  on daily_ads_snapshot (account_id, marketplace_id, snapshot_date);

-- Índice para queries de período
create index daily_ads_snapshot_period_idx
  on daily_ads_snapshot (account_id, marketplace_id, snapshot_date);

-- RLS
alter table daily_ads_snapshot enable row level security;

create policy "daily_ads_snapshot_tenant_isolation"
  on daily_ads_snapshot
  for all
  using (account_id = current_setting('app.current_account_id', true));


-- -----------------------------------------------------------------------------
-- 3. sku_cost_parameters (SCD2)
-- Fonte: entrada manual (COGS, prep, imposto, taxa Amazon estimada)
-- Uso: cálculo de COGS do período, prep total, imposto total, taxa Amazon total
--      Lookup: valid_from <= snapshot_date AND (valid_to > snapshot_date OR valid_to IS NULL)
-- Temporalidade: SCD2 obrigatório — NUNCA sobrescrever; sempre inserir novo
--                registro e fechar valid_to do anterior na mesma operação
-- -----------------------------------------------------------------------------

create table sku_cost_parameters (
  id                uuid          primary key default gen_random_uuid(),

  account_id        text          not null,
  marketplace_id    text          not null,
  sku               text          not null,

  -- Parâmetros de custo por unidade
  unit_cost         numeric(14,4) not null,   -- COGS unitário (custo de aquisição/produção)
  prep_cost_unit    numeric(14,4) not null,   -- Custo de preparação por unidade
  tax_rate          numeric(8,4)  not null,   -- Alíquota de imposto (fração, ex: 0.0400 = 4%)
  amazon_fee_unit   numeric(14,4) not null,   -- Taxa Amazon estimada por unidade (referral + FBA)

  -- Validade temporal (SCD2)
  -- valid_from: data de início de vigência deste regime de custo (inclusive)
  -- valid_to:   data de fim de vigência (exclusive); null = vigente até hoje
  valid_from        date          not null,
  valid_to          date,

  created_at        timestamptz   not null default now(),
  updated_at        timestamptz   not null default now(),

  -- Garante que não haja dois regimes sobrepostos para o mesmo SKU
  constraint sku_cost_valid_from_before_valid_to
    check (valid_to is null or valid_to > valid_from)
);

-- Índice de lookup por data (usado em todos os cálculos de período)
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
  using (account_id = current_setting('app.current_account_id', true));


-- -----------------------------------------------------------------------------
-- 4. fixed_costs_monthly
-- Fonte: entrada manual (contador, aluguel, Amazon Prime, outros fixos)
-- Uso: rateio de custos fixos para qualquer período (Lucro Período, Margem Real)
--      Fórmula de rateio: total_fixed_month * (dias_no_período_no_mês / dias_do_mês)
-- Temporalidade: um registro por mês/conta; novo mês = nova linha
-- -----------------------------------------------------------------------------

create table fixed_costs_monthly (
  id                  uuid          primary key default gen_random_uuid(),

  account_id          text          not null,
  year_month          date          not null, -- Usar sempre o 1º dia do mês (ex: 2026-03-01)

  -- Componentes de custo fixo mensal
  accounting_fees     numeric(14,2) not null default 0, -- Contador
  rent                numeric(14,2) not null default 0, -- Aluguel
  amazon_prime        numeric(14,2) not null default 0, -- Amazon Prime
  other_fixed_costs   numeric(14,2) not null default 0, -- Outros fixos

  -- Total gerado automaticamente (soma dos componentes)
  total_fixed_month   numeric(14,2) generated always as (
    accounting_fees + rent + amazon_prime + other_fixed_costs
  ) stored,

  created_at          timestamptz   not null default now(),
  updated_at          timestamptz   not null default now()
);

-- Garante unicidade por conta/mês
create unique index fixed_costs_monthly_ux
  on fixed_costs_monthly (account_id, year_month);

-- RLS
alter table fixed_costs_monthly enable row level security;

create policy "fixed_costs_monthly_tenant_isolation"
  on fixed_costs_monthly
  for all
  using (account_id = current_setting('app.current_account_id', true));


-- -----------------------------------------------------------------------------
-- 5. period_manual_inputs
-- Fonte: entrada manual por período de análise
-- Uso: Vendas Cupom, Custo Cupom, Resgate Cupom (%), ajustes pontuais
-- Temporalidade: amarrado ao período; revisão manual é reescrita consciente
-- -----------------------------------------------------------------------------

create table period_manual_inputs (
  id                  uuid          primary key default gen_random_uuid(),

  account_id          text          not null,
  period_start_date   date          not null,
  period_end_date     date          not null,

  -- Dados de cupons
  coupon_sales_value  numeric(14,2) not null default 0, -- Vendas realizadas com cupom
  coupon_cost_value   numeric(14,2) not null default 0, -- Valor total de desconto concedido
  coupon_distributed  integer       not null default 0, -- Cupons distribuídos no período
  coupon_redeemed     integer       not null default 0, -- Cupons resgatados no período

  -- Ajustes e anotações livres
  manual_notes        text,
  manual_adjustments  jsonb,

  created_at          timestamptz   not null default now(),
  updated_at          timestamptz   not null default now(),

  constraint period_end_after_start
    check (period_end_date >= period_start_date)
);

-- Garante unicidade por conta/período exato
create unique index period_manual_inputs_ux
  on period_manual_inputs (account_id, period_start_date, period_end_date);

-- RLS
alter table period_manual_inputs enable row level security;

create policy "period_manual_inputs_tenant_isolation"
  on period_manual_inputs
  for all
  using (account_id = current_setting('app.current_account_id', true));
