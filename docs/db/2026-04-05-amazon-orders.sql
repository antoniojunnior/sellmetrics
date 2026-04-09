-- amazon_orders migration
-- Data: 2026-04-05

create table amazon_orders (
  id               uuid        primary key default gen_random_uuid(),
  account_id       text        not null,
  marketplace_id   text        not null,
  amazon_order_id  text        not null,
  purchase_date    timestamptz not null,
  sku              text        not null,
  quantity         integer     not null default 1,
  item_price       numeric(14,2) not null default 0,
  order_status     text        not null,
  
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

-- Unicidade por Order ID + SKU (um pedido pode ter múltiplos itens/SKUs)
create unique index amazon_orders_ux on amazon_orders (account_id, amazon_order_id, sku);

-- Índices para performance
create index amazon_orders_period_idx on amazon_orders (account_id, purchase_date desc);
create index amazon_orders_sku_idx on amazon_orders (account_id, sku);

-- RLS
alter table amazon_orders enable row level security;

create policy "amazon_orders_tenant_isolation"
  on amazon_orders
  for all
  using (account_id = auth.uid()::text);
