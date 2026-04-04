-- period_manual_inputs migration
-- Data: 2026-04-04

create table period_manual_inputs (
  id                  uuid          primary key default gen_random_uuid(),

  account_id          text          not null,
  period_start_date   date          not null,
  period_end_date     date          not null,

  -- Dados de cupons
  coupon_sales_value  numeric(14,2) not null default 0,
  coupon_cost_value   numeric(14,2) not null default 0,
  coupon_distributed  integer       not null default 0,
  coupon_redeemed     integer       not null default 0,

  -- Ajustes e anotações
  manual_notes        text,
  manual_adjustments  jsonb,

  created_at          timestamptz   not null default now(),
  updated_at          timestamptz   not null default now(),

  constraint period_end_after_start
    check (period_end_date >= period_start_date)
);

-- Unicidade: (account_id, period_start_date, period_end_date)
create unique index period_manual_inputs_ux
  on period_manual_inputs (account_id, period_start_date, period_end_date);

-- RLS
alter table period_manual_inputs enable row level security;

create policy "period_manual_inputs_tenant_isolation"
  on period_manual_inputs
  for all
  using (account_id = current_setting('app.current_account_id', true));
