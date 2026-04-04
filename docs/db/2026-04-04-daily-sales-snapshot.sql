-- daily_sales_snapshot migration
-- Data: 2026-04-04

create table daily_sales_snapshot (
  id               uuid        primary key default gen_random_uuid(),

  account_id       text        not null,
  marketplace_id   text        not null,
  sku              text        not null,
  snapshot_date    date        not null,

  -- Métricas diárias
  orders_count     integer     not null default 0,
  units_sold       integer     not null default 0,
  gross_sales      numeric(14,2) not null default 0,

  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

-- Unicidade: (account_id, marketplace_id, sku, snapshot_date)
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
  using (account_id = auth.uid()::text);
