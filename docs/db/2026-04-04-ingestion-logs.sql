-- ingestion_logs migration
-- Data: 2026-04-04

create table ingestion_logs (
  id               uuid        primary key default gen_random_uuid(),
  account_id       text        not null,
  type             text        not null, -- 'incremental', 'historical', 'reprocess'
  status           text        not null, -- 'success', 'error', 'running'
  days_processed   integer     not null default 0,
  error_message    text,
  executed_at      timestamptz not null default now()
);

-- Índice para busca rápida por conta e data
create index ingestion_logs_account_idx on ingestion_logs (account_id, executed_at desc);

-- RLS
alter table ingestion_logs enable row level security;

create policy "ingestion_logs_tenant_isolation"
  on ingestion_logs
  for all
  using (account_id = current_setting('app.current_account_id', true));
