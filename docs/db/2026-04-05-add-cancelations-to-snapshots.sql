-- Adiciona suporte a cancelamentos nos snapshots diários
-- Data: 2026-04-05

alter table daily_sales_snapshot 
add column canceled_count integer not null default 0,
add column canceled_sales numeric(14,2) not null default 0;
