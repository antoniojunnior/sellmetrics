Crie a estrutura de ingestão de dados em src/lib/ingestion/:

1. sp-api-client.ts
   - Funções para autenticação e chamada ao endpoint do Sales & Traffic Report
   - Parâmetros: accountId, startDate, endDate, dateGranularity=DAY, asinGranularity=SKU
   - Retorna array de { date, sku, ordersCount, unitsSold, grossSales }

2. ads-api-client.ts
   - Funções para autenticação e chamada ao relatório diário de Sponsored Products
   - Parâmetros: profileId, startDate, endDate, timeUnit=DAILY
   - Janela de atribuição: fixar uma única (ex: 7 dias) e documentar no código
   - Retorna array de { date, adsSpend, adsSales, adsClicks, adsOrders }

3. ingestion-service.ts
   - ingestHistorical(accountId, startDate, endDate): carga histórica completa por intervalo
     - chama sp-api-client e ads-api-client
     - usa upsert nos repositórios correspondentes
     - processa em lotes de 7 dias para não estourar rate limits
   - ingestYesterday(accountId): atualização incremental diária
     - busca dados apenas do dia D-1
     - usa upsert nos repositórios

4. ingestion-job.ts
   - Função exportável que pode ser chamada por um CRON ou Supabase Edge Function
   - Chama ingestYesterday para todas as contas configuradas
   - Registra resultado (sucesso/erro) em log

Requisitos:
- Separar claramente cliente de API da lógica de persistência
- Usar variáveis de ambiente para credenciais (nunca hardcode)
- Tratar rate limiting com retry exponencial
- Documentar no código qual endpoint/report está sendo usado e com quais parâmetros fixos

Ao final, faça commit com:
feat(ingestion): create sp-api and ads-api ingestion pipeline

Me mostre cada arquivo com comentários explicando as decisões de implementação.
