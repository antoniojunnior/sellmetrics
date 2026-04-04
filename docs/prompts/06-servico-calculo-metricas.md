Crie o arquivo src/lib/services/period-metrics-service.ts

Esse serviço recebe (accountId, startDate, endDate, sku?) e retorna
todos os indicadores da planilha de operação, calculados a partir
dos repositórios de dados persistidos (nunca consultando APIs externas diretamente).

Os indicadores a calcular são:

BLOCO A — Volume
- days: número de dias do período
- gross_sales: soma de gross_sales dos snapshots diários
- units_sold: soma de units_sold
- orders_count: soma de orders_count

BLOCO B — ADS
- ads_spend: soma de ads_spend
- ads_sales: soma de ads_sales
- ads_clicks: soma de ads_clicks
- ads_orders: soma de ads_orders
- acos: ads_spend / ads_sales (0 se ads_sales = 0)
- tacos: ads_spend / gross_sales (0 se gross_sales = 0)
- ads_conversion: ads_orders / ads_clicks (0 se ads_clicks = 0)

BLOCO C — Custos variáveis (lookup SCD2 por dia e SKU)
- cogs_total: soma de (units_sold_dia * unit_cost_valido_na_data)
- prep_total: soma de (units_sold_dia * prep_cost_unit_valido_na_data)
- tax_total: soma de (gross_sales_dia * tax_rate_valido_na_data)
- amazon_fee_total: soma de (units_sold_dia * amazon_fee_unit_valido_na_data)
- total_variable_cost: cogs + prep + tax + amazon_fee + coupon_cost_value

BLOCO D — Cupons (de period_manual_inputs)
- coupon_sales_value
- coupon_cost_value
- coupon_distributed
- coupon_redeemed
- coupon_redemption_rate: redeemed / distributed

BLOCO E — Receita e margens
- revenue_net: gross_sales - total_variable_cost
- margin_contribution: revenue_net / gross_sales (%)
- margin_post_ads: (revenue_net - ads_spend) / gross_sales (%)
- markup: gross_sales / total_variable_cost

BLOCO F — Custos fixos e lucro
- fixed_costs_period: rateio proporcional de fixed_costs_monthly no período
- profit_period: revenue_net - ads_spend - fixed_costs_period
- profit_over_revenue: profit_period / gross_sales (%)
- profit_over_investment: profit_period / cogs_total (%)

BLOCO G — KPIs diários
- revenue_per_day: gross_sales / days
- net_per_day: revenue_net / days

Requisitos:
- Importar e usar os repositórios criados na Fase 2
- Tipagem explícita com interface PeriodMetrics para o retorno
- Tratar divisão por zero em todos os indicadores percentuais
- Retornar null para indicadores onde faltam dados, não zero

Ao final, faça commit com:
feat(services): create period metrics calculation service

Me mostre o arquivo completo com todos os tipos e cálculos.
