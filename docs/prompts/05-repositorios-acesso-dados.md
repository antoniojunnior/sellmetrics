Crie os repositórios de acesso a dados em src/lib/supabase/repositories/:

1. daily-sales-repository.ts
   - upsertDailySalesSnapshot(data): insere ou atualiza snapshot diário por (account_id, marketplace_id, sku, snapshot_date)
   - getSalesByPeriod(accountId, startDate, endDate, sku?): retorna todos os snapshots no intervalo
   - getSalesSumByPeriod(accountId, startDate, endDate): retorna somas de orders_count, units_sold, gross_sales

2. daily-ads-repository.ts
   - upsertDailyAdsSnapshot(data): insere ou atualiza snapshot diário de ADS
   - getAdsByPeriod(accountId, startDate, endDate): retorna snapshots no intervalo
   - getAdsSumByPeriod(accountId, startDate, endDate): retorna somas de ads_spend, ads_sales, ads_clicks, ads_orders

3. sku-cost-repository.ts
   - createCostParameters(data): insere novo regime de custo (SCD2), fechando valid_to do regime anterior automaticamente
   - getCostForDate(accountId, marketplaceId, sku, date): busca parâmetros válidos em uma data específica
   - getCostHistory(accountId, sku): retorna histórico completo de regimes de custo

4. fixed-costs-repository.ts
   - upsertFixedCostsMonth(data): insere ou atualiza custos fixos mensais
   - getFixedCostsByPeriod(accountId, startDate, endDate): retorna linhas de fixed_costs_monthly intersectando o período e calcula rateio proporcional em dias

5. period-manual-inputs-repository.ts
   - upsertPeriodManualInputs(data): insere ou atualiza inputs manuais de período
   - getManualInputsByPeriod(accountId, startDate, endDate): busca inputs pelo período exato

Requisitos:
- Usar createClient do Supabase server
- Tipagem TypeScript explícita para todos os parâmetros e retornos
- Nunca usar `any`
- Tratar e relançar erros com mensagens claras
- Seguir o padrão: se error throw error; return data

Ao final, faça commit com:
feat(repositories): create core data access layer

Me mostre cada arquivo criado.
