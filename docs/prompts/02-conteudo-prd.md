# PRD — Sellmetrics

## Visão geral

Este PRD define a concepção do Sellmetrics, um cockpit financeiro-operacional para vendedores Amazon, construído sobre um modelo orientado a períodos de análise, dados persistidos localmente e indicadores precisos de resultado. O produto substitui o uso de planilhas manuais por um painel dinâmico, confiável e historicamente consistente.

A aplicação tem como centro conceitual o **período de análise** — não o pedido individual — e calcula todos os indicadores a partir de snapshots diários persistidos, combinados com parâmetros históricos de custo versionados no tempo. Isso garante que qualquer janela de observação possa ser recalculada sem nova consulta às APIs externas e sem distorção de períodos passados por mudanças recentes de parâmetros.

---

## Objetivo do produto

Permitir ao operador Amazon acompanhar, para qualquer janela de datas, todos os indicadores financeiros e operacionais relevantes para a tomada de decisão: vendas, unidades, pedidos, publicidade paga, cupons, custos variáveis, margens em múltiplos níveis, lucro do período e KPIs diários.

O sistema deve:
- Persistir diariamente os dados-base vindos da Amazon (SP-API e Ads API);
- Combinar esses dados com parâmetros internos de custo, também versionados no tempo;
- Permitir que qualquer nova janela de análise seja recalculada sem nova consulta à API;
- Preservar a consistência histórica dos indicadores mesmo quando parâmetros de custo são atualizados.

---

## Escopo fechado

### Entra no escopo

- Todos os indicadores financeiros e operacionais presentes na planilha de referência da operação.
- Persistência diária dos dados Amazon de vendas (SP-API) e publicidade (Ads API), com granularidade por SKU/ASIN.
- Persistência histórica de todos os parâmetros que impactam indicadores, com validade temporal (SCD2).
- Cálculo flexível para qualquer janela temporal, baseado exclusivamente em dados persistidos.
- Entrada manual de dados não disponíveis ou não confiáveis via API: COGS, prep center, imposto, taxas Amazon estimadas, cupons e custos fixos mensais.
- Dois indicadores de "investimento" semanticamente distintos:
  - **Investimento Vendido (COGS do período):** custo dos produtos efetivamente vendidos no período.
  - **Capital Alocado:** estoque atual multiplicado pelo custo unitário (posição de capital imobilizado).

### Fica fora do escopo

- Indicadores de competição: ranking de categoria, buy box, número de ofertas concorrentes.
- Dependência de Settlement Reports como fonte de custos Amazon; os custos serão parametrizados manualmente.
- Períodos "fechados" ou travados contabilmente; todas as janelas são sempre recalculáveis.
- Análise multi-marketplace ou multi-conta no MVP; o modelo comporta, mas o MVP é por conta/marketplace.

---

## Princípios do modelo

### Período sempre fluido
A aplicação não tem conceito de período travado. O usuário pode alterar livremente a janela de observação, e o sistema sempre recalcula os indicadores com base nos registros diários persistidos e nos parâmetros históricos válidos para cada data.

### Persistência diária como fonte de verdade
A aplicação consulta as APIs Amazon apenas para construir e manter o histórico diário persistido. Em uma carga inicial, busca todo o histórico da operação. Depois, executa atualização diária do dia anterior. As telas consultam apenas a base persistida — nunca a API diretamente.

### Temporalidade obrigatória para parâmetros de custo
Qualquer parâmetro que impacta indicadores financeiros deve ter histórico temporal (SCD2). Mudanças de COGS, prep, imposto ou taxa Amazon não podem alterar resultados de períodos passados. O lookup de custo sempre usa a data do snapshot como business date.

### Snapshot de ADS congelado na data
O snapshot diário de ADS é a verdade do dia no momento da captura. A aplicação não reabre dias históricos de ADS por causa de redistribuição de atribuição pela Amazon Ads. Isso garante estabilidade dos indicadores ACOS, TACOS e Conversão ao longo do tempo.

### Separação entre dados Amazon e lógica gerencial interna
Dados de vendas e publicidade vêm da Amazon. A maior parte da lógica gerencial depende de parâmetros internos do operador. O resultado é um cockpit gerencial — não uma escrituração contábil oficial.

---

## Fontes de dados

### Amazon Selling Partner API (SP-API)
Fornece a base para vendas, unidades e pedidos por dia e por SKU/ASIN, por meio do relatório **Sales & Traffic Business Report** com `dateGranularity=DAY` e `asinGranularity=SKU`.

Campos extraídos por dia/SKU:
- `orderedProductSales` → gross_sales
- `unitsOrdered` → units_sold
- `totalOrderItems` → orders_count

### Amazon Ads API
Fornece dados de publicidade paga por dia, por meio de relatório de Sponsored Products com `timeUnit=DAILY`. A janela de atribuição é fixada em uma única configuração (ex: 7 dias) e documentada no código. O relatório não é reprocessado para dias passados.

Campos extraídos por dia:
- `cost` → ads_spend
- `attributedSales` → ads_sales
- `clicks` → ads_clicks
- `attributedConversions` → ads_orders

### Entradas manuais
Os seguintes dados são sempre de entrada manual, versionados com validade temporal quando aplicável:
- Custo unitário do produto (COGS)
- Custo de preparação por unidade (prep center)
- Alíquota de imposto padrão
- Taxa Amazon estimada por unidade (referral + FBA consolidado)
- Dados de cupons: valor de vendas com cupom, custo do cupom, cupons distribuídos, cupons resgatados
- Custos fixos mensais: contador, aluguel, Amazon Prime, outros

---

## Modelo lógico de negócio

### Entidade: daily_sales_snapshot
Consolidado diário de vendas por conta, marketplace e SKU.
- Chave: `(account_id, marketplace_id, sku, snapshot_date)`
- Campos: `orders_count`, `units_sold`, `gross_sales`
- Temporalidade: fato histórico diário; sem SCD2; reprocessável sob comando explícito.

### Entidade: daily_ads_snapshot
Consolidado diário de publicidade por conta e marketplace.
- Chave: `(account_id, marketplace_id, snapshot_date)`
- Campos: `ads_spend`, `ads_sales`, `ads_clicks`, `ads_orders`
- Temporalidade: snapshot congelado na data; não reabre histórico por atribuição.

### Entidade: sku_cost_parameters (SCD2)
Parâmetros históricos de custo por SKU, com validade temporal.
- Chave lógica: `(account_id, marketplace_id, sku)` + intervalo `valid_from / valid_to`
- Campos: `unit_cost`, `prep_cost_unit`, `tax_rate`, `amazon_fee_unit`
- Regra de lookup: `valid_from <= snapshot_date AND (valid_to > snapshot_date OR valid_to IS NULL)`
- Regra de atualização: nunca sobrescrever; sempre inserir novo registro e fechar `valid_to` do anterior.

### Entidade: fixed_costs_monthly
Custos fixos mensais do negócio.
- Chave: `(account_id, year_month)`
- Campos: `accounting_fees`, `rent`, `amazon_prime`, `other_fixed_costs`, `total_fixed_month` (gerado)
- Temporalidade: um registro por mês; novo mês = nova linha.

### Entidade: period_manual_inputs
Inputs manuais por período de análise, principalmente cupons.
- Chave: `(account_id, period_start_date, period_end_date)`
- Campos: `coupon_sales_value`, `coupon_cost_value`, `coupon_distributed`, `coupon_redeemed`, `manual_notes`, `manual_adjustments`

---

## Regras de cálculo dos indicadores

### Bloco A — Período e volume
- **Dias:** `end_date - start_date + 1`
- **Vendas (R$):** `SUM(gross_sales)` no período
- **Unidades:** `SUM(units_sold)` no período
- **Pedidos:** `SUM(orders_count)` no período

### Bloco B — ADS
- **ADS (R$):** `SUM(ads_spend)`
- **Vendas ADS (R$):** `SUM(ads_sales)`
- **Cliques ADS:** `SUM(ads_clicks)`
- **ACOS:** `ads_spend / ads_sales`
- **TACOS:** `ads_spend / gross_sales`
- **Conversão ADS:** `ads_orders / ads_clicks`

### Bloco C — Custos variáveis (com lookup SCD2 por dia e SKU)
- **COGS do período (Investimento Vendido):** `SUM(units_sold_dia × unit_cost_válido_na_data)`
- **Prep total:** `SUM(units_sold_dia × prep_cost_unit_válido_na_data)`
- **Imposto total:** `SUM(gross_sales_dia × tax_rate_válido_na_data)`
- **Taxa Amazon total:** `SUM(units_sold_dia × amazon_fee_unit_válido_na_data)`
- **Total Custo Variável:** `COGS + prep + imposto + taxa_amazon + coupon_cost_value`

### Bloco D — Cupons
- **Vendas Cupom:** `coupon_sales_value` (period_manual_inputs)
- **Custo Cupom:** `coupon_cost_value`
- **Cupons Distribuídos:** `coupon_distributed`
- **Cupons Resgatados:** `coupon_redeemed`
- **Resgate Cupom (%):** `coupon_redeemed / coupon_distributed`

### Bloco E — Receita e margens
- **Receita Bruta:** `gross_sales`
- **Total Custo:** `total_custo_variavel`
- **Receita Líquida:** `gross_sales - total_custo_variavel`
- **Margem de Contribuição:** `receita_liquida / gross_sales (%)`
- **Margem pós ADS:** `(receita_liquida - ads_spend) / gross_sales (%)`
- **Markup:** `gross_sales / total_custo_variavel`

### Bloco F — Custos fixos e lucro
- **Total Fixos Período:** rateio proporcional de `total_fixed_month` pelos dias do período em cada mês
- **Margem Real / Lucro Período:** `receita_liquida - ads_spend - total_fixos_periodo`
- **Lucro/Receita (%):** `lucro_periodo / gross_sales`
- **Lucro/Investimento (%):** `lucro_periodo / cogs_periodo`

### Bloco G — KPIs diários
- **Faturamento/Dia:** `gross_sales / dias`
- **Líquido/Dia:** `receita_liquida / dias`

### Indicador de posição (futuro)
- **Capital Alocado:** `estoque_atual × unit_cost_vigente` (requer integração com FBA Inventory API)

---

## Estratégia de ingestão de dados

### Carga histórica inicial
Na implantação, o sistema busca todo o histórico da operação via SP-API e Amazon Ads API e persiste em snapshots diários. A partir desse ponto, os dashboards dependem exclusivamente da base local.

### Atualização diária incremental
Um job diário (CRON ou Supabase Edge Function) busca os dados do dia D-1 nas duas APIs, consolida e atualiza os snapshots. Uma única chamada por origem por dia é suficiente.

### Reprocessamento histórico eventual
A arquitetura prevê reprocessamento de intervalos históricos sob comando explícito do operador (ex: botão "reprocessar período"), sem que isso seja o fluxo padrão de uso.

### Consultas às APIs
As APIs são usadas exclusivamente para ingestão. Nenhuma tela ou endpoint da aplicação consulta SP-API or Ads API diretamente em tempo de execução.

---

## Decisões explícitas do produto

| Decisão | Diretriz |
|---|---|
| Centro do produto | Painel financeiro-operacional por período, não dashboard transacional por pedido |
| Fonte de cálculo | Snapshots diários persistidos + parâmetros históricos de custo (SCD2) |
| Consulta à Amazon em tela | Nunca; APIs servem apenas para ingestão controlada |
| Temporalidade de custos | Obrigatória (SCD2) para todos os parâmetros que impactam indicadores |
| Settlement Reports | Fora do modelo; custos Amazon parametrizados manualmente com histórico |
| Competição / ranking / buy box | Fora do escopo do MVP |
| Períodos travados | Não existem; toda janela é sempre recalculável |
| Granularidade de vendas | Por dia e por SKU/ASIN |
| Snapshot de ADS | Congelado na data de captura; sem reabertura por atribuição |
| Cupons | Entrada manual por período no MVP; automatizável futuramente |

---

## Critérios de sucesso do modelo

O modelo será considerado bem definido e implementado quando:

1. Todos os indicadores da planilha de referência (13 dias de operação) forem reproduzidos com exatidão a partir dos dados persistidos.
2. A alteração de um parâmetro de custo (ex: COGS) não alterar os indicadores de períodos anteriores à data de vigência do novo custo.
3. Qualquer janela de análise puder ser recalculada sem nova chamada às APIs externas.
4. O job diário de ingestão for suficiente para manter o dashboard atualizado com D-1.

---

## Como registrar este artefato

- **Caminho no repositório:** `docs/prd/prd-sellmetrics-v1.md`
- **Commit sugerido:** `chore(prd): add sellmetrics prd v1`
- **Observação:** qualquer alteração de escopo relevante deve ser registrada no próprio arquivo com uma seção de changelog no final, antes de ser commitada.
