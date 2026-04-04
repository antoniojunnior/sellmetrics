-- fixed_costs_monthly migration
-- Data: 2026-04-04

create table fixed_costs_monthly (
  id                  uuid          primary key default gen_random_uuid(),

  account_id          text          not null,
  year_month          date          not null, -- Primeiro dia do mês (ex: 2026-03-01)

  -- Componentes de custo fixo
  accounting_fees     numeric(14,2) not null default 0,
  rent                numeric(14,2) not null default 0,
  amazon_prime        numeric(14,2) not null default 0,
  other_fixed_costs   numeric(14,2) not null default 0,

  -- Coluna gerada
  total_fixed_month   numeric(14,2) generated always as (
    accounting_fees + rent + amazon_prime + other_fixed_costs
  ) stored,

  created_at          timestamptz   not null default now(),
  updated_at          timestamptz   not null default now()
);

-- Unicidade: (account_id, year_month)
create unique index fixed_costs_monthly_ux
  on fixed_costs_monthly (account_id, year_month);

-- RLS
alter table fixed_costs_monthly enable row level security;

create policy "fixed_costs_monthly_tenant_isolation"
  on fixed_costs_monthly
  for all
  using (account_id = current_setting('app.current_account_id', true));
