# PRD — Sellmetrics v2.0: De Cockpit Financeiro a SaaS Gerencial Profissional

**Data:** 28 de abril de 2026  
**Versão:** 2.0  
**Status:** Rascunho — aprovação pendente  
**Autor:** Antonio da Luz Junior  
**Referências:**
- `docs/prd/prd-sellmetrics-v1.md` — PRD original (princípios preservados)
- `docs/audit/2026-04-27-auditoria-tecnica-e-roadmap.md` — auditoria técnica
- `docs/decisions/ADR-001..004` — decisões arquiteturais
- *Engenharia de Software com Agentes Inteligentes* — Sandeco (2026)

---

## 1. Visão e Proposta de Valor

### 1.1 O Problema

O seller Amazon iniciante opera cego. Ele sabe quanto faturou porque o Seller Central mostra. Não sabe quanto lucrou, porque lucro real exige cruzar vendas com COGS, frete, prep, imposto, taxas Amazon, ADS e custos fixos — dados que vivem em 4 telas diferentes, em moedas e granularidades incompatíveis. A alternativa atual é a planilha: manual, propensa a erro, quebra a cada coluna nova e não escala além de 20 SKUs.

Ferramentas existentes (Sellerboard, Jungle Scout, Helium 10) resolvem partes do problema, mas são em inglês, custosas para o mercado BR, orientadas ao seller americano e opacas no cálculo — o seller não sabe *por que* o número é aquele.

### 1.2 A Solução

Sellmetrics é o **cockpit financeiro-operacional para o seller Amazon BR iniciante**: uma ferramenta SaaS que transforma dados brutos da Amazon em decisões claras de negócio. O diferencial não é ter mais gráficos — é ter os números *certos*, com rastreabilidade completa de como foram calculados, e entregar a pergunta respondida antes que o seller precise formulá-la.

### 1.3 Proposta de Valor por Fase

| Fase | Proposta para o seller | O que o produto entrega |
|---|---|---|
| **0 — Fundação** | "Posso confiar nos números" | Dashboard correto, sem datas congeladas, sem bugs financeiros |
| **1 — SaaS Multi-tenant** | "Posso convidar meu contador" | Auth real, conta configurável, OAuth Amazon, planos/billing |
| **2 — Integrações Reais** | "Dados atualizados sem eu fazer nada" | Sales & Traffic, Ads API, FBA Inventory, Catalog reais |
| **3 — Camada Gerencial** | "Sei qual SKU dá dinheiro" | P&L por SKU, DOI, devoluções, comparativos |
| **4 — Inteligência Operacional** | "O produto me avisa o que fazer" | Alertas, forecast de vendas e estoque, cash flow |
| **5 — Diferencial Competitivo** | "É minha vantagem sobre a concorrência" | IA conversacional, reconciliação, multi-marketplace |

---

## 2. Usuário-Alvo

### 2.1 Persona Principal: "O Seller Iniciante BR"

- **Faturamento:** R$ 5k–50k/mês na Amazon.com.br
- **SKUs:** 5–30 produtos
- **Operação:** FBA principalmente, alguns FBM
- **Dor principal:** não sabe a margem real por SKU; toma decisões de preço no feeling
- **Comportamento:** acessa o painel 3–5x/semana, principalmente de manhã
- **Device:** 60% desktop, 40% mobile
- **Contexto:** geralmente o único operador; eventualmente tem contador externo
- **Nível técnico:** baixo a médio; não quer configurar nada complexo
- **Disposição de pagar:** R$ 50–150/mês se o produto claramente economiza mais do que isso

### 2.2 Persona Secundária: "O Contador do Seller"

- Acesso de leitura apenas
- Quer P&L por período exportável em CSV/Excel
- Não precisa entender de Amazon — quer os números no formato dele

### 2.3 Critério de Sucesso para o Usuário

O produto entrega valor quando o seller consegue responder, em menos de 30 segundos, sem planilha:
1. Qual SKU tem a maior margem real este mês?
2. Qual SKU está prestes a ficar sem estoque?
3. Quanto lucrei no último período de 30 dias?

---

## 3. Princípios de Engenharia (Não-Negociáveis)

Derivados do PRD v1, das ADRs e das diretrizes de *Engenharia de Software com Agentes Inteligentes* (Sandeco, 2026):

### 3.1 Processo sobre Velocidade

Nenhuma feature entra em produção sem: requisito documentado, implementação revisada, teste automatizado cobrindo o caminho feliz e ao menos um caso de borda crítico. Conforme o livro de referência: *"código que funciona não é código correto"* — o Sellmetrics lida com dinheiro real; o custo de um número errado é a credibilidade do produto.

### 3.2 Dados Persistidos como Fonte de Verdade (ADR-001)

Snapshots diários são o único source of truth. Nenhuma tela consulta SP-API ou Ads API em tempo de execução. Isso garante performance, auditabilidade histórica e resiliência a rate limits.

### 3.3 Temporalidade Obrigatória para Parâmetros de Custo (ADR-002)

SCD2 em `sku_cost_parameters`. Nenhuma mudança de parâmetro retroage. Um COGS alterado hoje não muda o P&L de ontem.

### 3.4 Snapshot ADS Congelado (ADR-003)

O snapshot diário de ADS é imutável após captura. Sem reabertura por redistribuição de atribuição. Estabilidade de KPIs > precisão marginal de atribuição.

### 3.5 Separação Rígida de Camadas

```
Apresentação (Next.js pages + Server Components)
       ↓
Serviços de domínio (period-metrics-service, alert-engine, etc.)
       ↓
Repositórios (acesso a dados — Supabase)
       ↓
Clientes de API (SP-API, Ads API — exclusivamente para ingestão)
```

Regra: camadas superiores não conhecem implementação das inferiores. Repository pattern obrigatório. Nenhum `supabase.from()` fora de repositórios.

### 3.6 Testabilidade como Requisito de Design

Todo serviço de domínio é testável sem banco de dados real. Repositórios têm interface (`IRepository`) para facilitar mock. Mínimo 80% de cobertura de branches nos serviços financeiros.

### 3.7 Observabilidade desde o Dia 1

Cada operação com efeito colateral (ingestão, upsert, cálculo) emite log estruturado com: `account_id`, `operation`, `duration_ms`, `result` (success/error), `error_code`. Logs indexáveis. Sem `console.log` em produção.

### 3.8 Segurança por Padrão

- RLS ativo em todas as tabelas (`account_id` como boundary)
- Credenciais em secret manager (Cloudflare Secrets / Doppler), nunca em env files commitados
- Middleware de autenticação ativo e testado
- Refresh tokens criptografados em banco (AES-256-GCM)
- OWASP Top 10 checado antes de cada release

---

## 4. Arquitetura de Referência

```
┌─────────────────────────────────────────────────────────────┐
│                    Cloudflare Pages                          │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  Next.js 15 App Router (Edge Runtime)               │   │
│  │  ├── /dashboard/* (Server Components + Suspense)    │   │
│  │  ├── /api/cron/* (Worker triggers)                  │   │
│  │  ├── /api/webhooks/* (Amazon SP-API notifications)  │   │
│  │  └── /auth/* (Supabase SSR)                         │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                              │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  Cloudflare Workers (background jobs)               │   │
│  │  ├── daily-ingestion (cron 05:00 UTC)               │   │
│  │  ├── alert-engine (cron a cada hora)                │   │
│  │  └── report-polling (queue consumer)                │   │
│  └─────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
                            ↕
┌─────────────────────────────────────────────────────────────┐
│                    Supabase                                  │
│  ├── PostgreSQL (OLTP — dados operacionais)                  │
│  ├── RLS multi-tenant (account_id em todas as tabelas)       │
│  ├── Edge Functions (operações atômicas SCD2)                │
│  └── Realtime (alertas push para dashboard)                  │
└─────────────────────────────────────────────────────────────┘
                            ↕
┌─────────────────────────────────────────────────────────────┐
│                 Amazon APIs (ingestão only)                   │
│  ├── SP-API Reports v2021-06-30 (Sales & Traffic)            │
│  ├── SP-API FBA Inventory                                    │
│  ├── SP-API Catalog / Listings                               │
│  ├── SP-API Returns                                          │
│  └── Ads API v3 (Sponsored Products, Search Terms)          │
└─────────────────────────────────────────────────────────────┘
```

### 4.1 Modelo de Dados — Evolução do Schema

**Tabelas novas por fase:**

| Tabela | Fase | Propósito |
|---|---|---|
| `accounts` | 1 | Config da conta Amazon: marketplace, profile_id, currency, timezone, plano |
| `account_members` | 1 | Multi-usuário por conta: user_id, account_id, role (owner/member/viewer) |
| `subscription_plans` | 1 | Planos SaaS: free/starter/pro |
| `inventory_snapshot` | 2 | Posição diária de estoque FBA por SKU/FNSKU |
| `listing_catalog` | 2 | ASIN, SKU, título, categoria, imagem, BSR |
| `returns_snapshot` | 2 | Devoluções diárias por SKU |
| `sponsored_campaigns` | 2 | Estrutura de campanhas Ads (campanha → ad group → keyword) |
| `sponsored_search_terms` | 2 | Search term report diário |
| `alert_rules` | 4 | Regras configuradas pelo usuário |
| `alert_events` | 4 | Histórico de alertas disparados |
| `forecast_snapshots` | 4 | Previsões geradas por SKU |

**Campos adicionados em tabelas existentes:**

- `daily_sales_snapshot`: `currency`, `sessions`, `page_views`, `buybox_pct`, `unit_session_pct`, `refund_count`, `refund_value`
- `daily_ads_snapshot`: `campaign_id`, `ad_type` (sp/sb/sd)
- `sku_cost_parameters`: `freight_to_fba_unit`, `target_margin_pct`, `lead_time_days`

### 4.2 CI/CD Pipeline

```
PR aberto
  └── GitHub Actions
       ├── lint (ESLint)
       ├── typecheck (tsc --noEmit)
       ├── test (Vitest — unit + integration)
       ├── build (next build)
       └── preview deploy (Cloudflare Pages preview URL)

Merge em main
  └── GitHub Actions
       ├── todos os checks acima
       └── deploy produção (Cloudflare Pages)
```

---

## 5. Modelo de Negócio SaaS

### 5.1 Planos

| Plano | Preço | SKUs | Usuários | Funcionalidades |
|---|---|---|---|---|
| **Free** | R$ 0 | 5 | 1 | Dashboard período, P&L agregado, 30 dias de histórico |
| **Starter** | R$ 79/mês | 30 | 2 | + P&L por SKU, inventário, alertas básicos, 12 meses |
| **Pro** | R$ 149/mês | ilimitado | 5 | + IA, forecast, Search Terms, exportação, histórico completo |

### 5.2 Trial e Conversão

- 14 dias de Pro grátis na ativação (sem cartão)
- Checkout via Stripe (cartão BR + Pix)
- Downgrade automático para Free ao expirar trial sem pagamento
- Dados preservados por 90 dias após downgrade

### 5.3 Funil de Ativação

```
Signup → Conectar Amazon (OAuth) → Cadastrar custos do 1º SKU
    → Rodar ingestão histórica (30 dias) → Ver P&L do primeiro período
    → "Aha moment": margem real vs. percepção do seller
```

O "aha moment" acontece quando o seller vê, pela primeira vez, que está ganhando R$ 18/unidade (não R$ 40 como ele achava). Esse é o momento de conversão.

---

## 6. Fases de Desenvolvimento

---

### FASE 0 — Estabilização da Fundação
**Duração estimada:** 2 semanas  
**Objetivo:** tornar o produto confiável para tomada de decisão

#### Contexto
O MVP tem base conceitual sólida (PRD bem escrito, SCD2, RLS, 30+ KPIs) mas 9 bugs críticos (P0) o tornam não confiável. Conforme a auditoria: *"antes de qualquer evolução de feature, esses pontos precisam ser sanados — sem eles, qualquer indicador exibido pode estar incorreto."*

Aplicando o princípio do livro de referência: *construir com processo significa não aceitar que "funciona localmente" é suficiente*. Fase 0 não adiciona features — corrige a fundação.

#### Requisitos Funcionais

**F0.1 — Datas dinâmicas com timezone correto**
- Criar `src/lib/utils/today.ts` com função `getToday(): string` retornando data atual em `America/Sao_Paulo`
- Substituir todas as ocorrências de `new Date('2026-04-04')` por `getToday()`
- Arquivos afetados: `dashboard/period/page.tsx:27`, `dashboard/orders/page.tsx:22`, `dashboard/settings/costs/page.tsx:19`
- Teste: data padrão do seletor de período deve ser "hoje" ao abrir o dashboard

**F0.2 — Rateio proporcional de custos fixos**
- Restaurar lógica de rateio em `fixed-costs-repository.ts`: para cada mês interceptado pelo período, calcular `dias_no_mes_dentro_do_periodo / dias_totais_do_mes × total_fixed_month`
- Testes obrigatórios:
  - Período de 3 dias dentro de um único mês
  - Período de 3 dias atravessando 2 meses
  - Período de 1 mês completo
  - Período sem custos cadastrados

**F0.3 — Middleware de autenticação ativo**
- Reimplementar `updateSession` em `src/lib/supabase/middleware.ts` usando `@supabase/ssr` + `createServerClient`
- Usar `NextResponse.redirect` (não `redirect()` de Next.js) para compatibilidade com Edge/Cloudflare
- Proteger todas as rotas `/dashboard/*` centralmente
- Teste: sessão expirada deve redirecionar para `/login` sem loop

**F0.4 — Build com type safety ativo**
- Remover de `next.config.ts`: `eslint: { ignoreDuringBuilds: true }` e `typescript: { ignoreBuildErrors: true }`
- Corrigir todos os erros TS/ESLint que aparecerem
- Criar `.eslintrc` com rules: `@typescript-eslint/no-explicit-any: error`

**F0.5 — Ingestão diária automatizada**
- Criar `src/app/api/cron/daily-ingestion/route.ts` protegida por `Authorization: Bearer ${CRON_SECRET}`
- Adicionar em `wrangler.toml`: `crons = ["0 5 * * *"]` (05:00 UTC = 02:00 BRT)
- Substituir lista hardcoded por `SELECT id, marketplace_id, ads_profile_id FROM accounts WHERE active = true`
- Logar resultado por conta em `ingestion_logs`

**F0.6 — Cupons como snapshots diários**
- Criar tabela `coupon_daily(account_id, sku, snapshot_date, coupon_cost_value, coupon_sales_value)`
- Migrar `period_manual_inputs` cupons para novo modelo
- Atualizar `period-metrics-service` para somar `coupon_daily` no período (sem duplicação por sobreposição)

**F0.7 — Segurança de credenciais**
- Rotacionar: SP-API Refresh Token, Supabase Service Role Key
- Remover AWS Access Key (não usada pelo LWA moderno)
- Mover credenciais para Cloudflare Secrets (`wrangler secret put`)
- Criar `.env.example` com placeholders documentados

**F0.8 — Testes e CI**
- Corrigir `period-metrics-service.test.ts`: mock de `getManualInputsByPeriod` deve retornar array; alinhar `total_variable_cost` esperado com a implementação atual
- Migrar de Jest para Vitest (5–10x mais rápido, melhor suporte ESM/TypeScript)
- Criar `.github/workflows/ci.yml`: lint → typecheck → test → build em PRs
- Adicionar pre-commit hook via Husky: lint-staged em arquivos `.ts/.tsx`

#### Definition of Done — Fase 0
- [ ] Dashboard abre com data de hoje ao iniciar
- [ ] Cálculo de custos fixos bate com planilha de referência em qualquer janela de datas
- [ ] `next build` passa sem warnings de tipo ou lint
- [ ] CI verde em PR antes do merge
- [ ] Cron dispara automaticamente às 02:00 BRT
- [ ] `.env.example` no repo, credenciais reais fora do working directory

---

### FASE 1 — SaaS Multi-tenant
**Duração estimada:** 4 semanas  
**Objetivo:** transformar o monoprojeto em produto comercializável com múltiplos usuários

#### Contexto
Hoje o `account_id` é o `auth.uid()` — cada usuário é uma conta, não há colaboração, não há billing, não há OAuth Amazon. A Fase 1 constrói a infraestrutura SaaS: accounts, membros, planos, e o fluxo de onboarding que transforma um signup em um usuário ativo com dados reais.

#### Requisitos Funcionais

**F1.1 — Modelo de accounts e membros**
- Criar tabela `accounts(id, name, marketplace_id, ads_profile_id, currency, timezone, sp_api_refresh_token_enc, ads_refresh_token_enc, active, plan_id, trial_ends_at, created_at)`
- Criar tabela `account_members(account_id, user_id, role, invited_at, accepted_at)`
- Roles: `owner` (criador, admin completo), `member` (leitura + configuração), `viewer` (leitura apenas)
- RLS: substituir `auth.uid()::text` por `EXISTS (SELECT 1 FROM account_members WHERE account_id = table.account_id AND user_id = auth.uid())`
- Migração: conta existente recebe `account_id` novo, usuário atual vira `owner`

**F1.2 — OAuth Amazon (SP-API)**
- Página `/dashboard/account/connect` com botão "Conectar Amazon"
- Redirect para `https://sellercentral.amazon.com.br/apps/authorize/consent?application_id={APP_ID}&state={csrf_token}`
- Callback em `/api/auth/amazon/callback`: trocar `spapi_oauth_code` por `refresh_token` via `https://api.amazon.com/auth/o2/token`
- Salvar `refresh_token` criptografado em `accounts.sp_api_refresh_token_enc` (AES-256-GCM, chave em Cloudflare Secret)
- Mesmo fluxo para Ads API (endpoint OAuth separado)

**F1.3 — Tela de configuração da conta**
- `/dashboard/account` com seções:
  - Informações gerais (nome da loja, marketplace, timezone)
  - Conexão Amazon (status SP-API + Ads API, botão reconectar)
  - Membros (convidar por email, alterar role, revogar)
  - Plano atual + link para upgrade

**F1.4 — Planos e billing**
- Integração Stripe:
  - `subscription_plans`: free, starter (R$79), pro (R$149)
  - Webhook `/api/webhooks/stripe` para `customer.subscription.updated`, `invoice.payment_failed`
  - Checkout via Stripe Checkout (suporte Pix + cartão BR)
- Limites por plano aplicados no service layer: `skuLimitService.check(accountId)` lança erro se acima do limite
- Trial de 14 dias ao signup (sem cartão)

**F1.5 — Onboarding wizard**
- Fluxo de primeira vez detectado por `account.onboarding_completed = false`
- Passo 1: conectar SP-API → Passo 2: cadastrar custo do primeiro SKU → Passo 3: rodar ingestão histórica (últimos 30 dias) → Passo 4: ver P&L
- Cada passo tem estado persistido (pode sair e voltar)
- Progress bar no sidebar durante onboarding

**F1.6 — Feedback de ações (UX)**
- Server Actions retornam `{ ok: boolean, error?: string }` (não silenciam erros)
- `SubmitButton` usa `useFormState` para exibir toast de sucesso/erro
- Corrigir `settings/actions.ts:30,55,84` que hoje silenciam erros

#### Definition of Done — Fase 1
- [ ] Usuário cria conta, conecta Amazon via OAuth, e vê dados sem tocar em .env
- [ ] Contador pode ser convidado com role `viewer` e ver apenas leitura
- [ ] Billing funcional: signup → trial → upgrade → cobrança recorrente
- [ ] Onboarding wizard completo leva seller do zero ao primeiro P&L em < 10 minutos
- [ ] Todos os erros de Server Actions chegam ao usuário via toast

---

### FASE 2 — Integrações Amazon Reais
**Duração estimada:** 5 semanas  
**Objetivo:** substituir dados mock/estimados por dados reais das APIs Amazon

#### Contexto
Hoje a agregação diária usa Orders API (N chamadas por pedido, frágil, lento) e a Ads API é mock. PRD §"Fontes de dados" especifica `Sales & Traffic Business Report` como fonte primária. Esta fase realiza a integração conforme o PRD original, corrigindo o desvio (P0-5, P0-6 da auditoria).

#### Requisitos Funcionais

**F2.1 — Sales & Traffic Report como fonte primária de vendas**
- Implementar `spApiReportsClient.createSalesAndTrafficReport(accountId, date)`:
  1. `POST /reports/2021-06-30/reports` com `reportType=GET_SALES_AND_TRAFFIC_REPORT`, `dataStartTime`, `dataEndTime`
  2. Polling `GET /reports/2021-06-30/reports/{reportId}` até `status=DONE` (max 10 tentativas com backoff exponencial)
  3. `GET` no `url` retornado, parsear JSON, mapear campos:
     - `orderedProductSales` → `gross_sales`
     - `unitsOrdered` → `units_sold`
     - `totalOrderItems` → `orders_count`
     - `sessions` → `sessions`
     - `pageViews` → `page_views`
     - `buyBoxPercentage` → `buybox_pct`
     - `unitSessionPercentage` → `unit_session_pct`
  4. Upsert em lote: `dailySalesRepository.upsertBatch(records)` — uma chamada ao banco, não N

- Manter Orders API apenas para `/dashboard/orders` (auditoria de pedido individual), com paginação e cache de 1h

**F2.2 — Ads API v3 real (Sponsored Products)**
- Implementar fluxo OAuth para Ads API (refresh token separado do SP-API)
- `adsApiClient.createSponsoredProductsReport(profileId, date)`:
  1. `POST /reporting/reports` com `reportTypeId=spCampaigns`, `timeUnit=DAILY`
  2. Polling até `status=COMPLETED`
  3. Download do gzip, descompressão, parse JSON
  4. Upsert em `daily_ads_snapshot` com `campaign_id` e `ad_type=sp`
- Adicionar suporte a Sponsored Brands e Display na próxima iteração

**F2.3 — Ads Search Term Report**
- `adsApiClient.createSearchTermReport(profileId, date)`:
  - Campos: `query`, `impressions`, `clicks`, `cost`, `sales`, `orders`, `campaign_id`
  - Persistir em `sponsored_search_terms(account_id, snapshot_date, campaign_id, query, ...)`
- UI: tabela "Termos sem conversão" em `/dashboard/ads` — ordenada por `cost DESC` onde `orders = 0`

**F2.4 — FBA Inventory API**
- `spApiClient.getFbaInventory(accountId, date)`:
  - `GET /fba/inventory/v1/summaries` com granularidade por FNSKU
  - Campos: `asin`, `fnSku`, `sellerSku`, `condition`, `inventoryDetails.fulfillableQuantity`, `reservedQuantity`, `inboundReceivingQuantity`, `unfulfillableQuantity`
  - Persistir em `inventory_snapshot(account_id, snapshot_date, sku, fnsku, available, inbound, reserved, unfulfillable)`
- KPI calculado: `doi = available / avg_units_sold_30d` (dias de estoque)

**F2.5 — Catalog API**
- `spApiClient.getCatalogItem(accountId, asin)`:
  - `GET /catalog/2022-04-01/items/{asin}` com `includedData=attributes,images,summaries`
  - Campos: `title`, `brand`, `productType`, `mainImage.link`, `browseClassification.displayName` (categoria)
  - Persistir em `listing_catalog(account_id, asin, sku, title, brand, category, main_image_url, updated_at)`
- Sincronização lazy: buscar ao primeiro acesso, atualizar semanalmente via cron

**F2.6 — Returns Report**
- `spApiClient.createReturnsReport(accountId, date)`:
  - `POST /reports/2021-06-30/reports` com `reportType=GET_FBA_FULFILLMENT_CUSTOMER_RETURNS_DATA`
  - Campos: `sku`, `fnsku`, `asin`, `quantity`, `disposition`, `reason`
  - Persistir em `returns_snapshot(account_id, snapshot_date, sku, quantity, refund_amount, reason_category)`
- KPI calculado: `return_rate = SUM(returns_qty) / SUM(units_sold)` por SKU no período

**F2.7 — Cron de ingestão com queue**
- Substituir loop síncrono por Cloudflare Queue:
  - Cron dispara → enfileira um job por conta ativa
  - Worker consumer processa cada job isoladamente (falha em uma conta não afeta outras)
  - Retry automático em falha (max 3 tentativas com backoff)
- Log estruturado por job em `ingestion_logs`: `account_id`, `date`, `source`, `records_processed`, `duration_ms`, `error`

#### Definition of Done — Fase 2
- [ ] Sales & Traffic Report é a fonte de `daily_sales_snapshot` — validado contra planilha de referência (erro < 0.1%)
- [ ] Ads API retorna dados reais — ACOS/TACOS não são mais mock
- [ ] FBA Inventory disponível no dashboard: DOI calculado por SKU
- [ ] `listing_catalog` preenchido: título e imagem aparecem em todas as tabelas de SKU
- [ ] Devoluções: `return_rate` disponível por SKU
- [ ] Ingestão diária processa múltiplas contas em paralelo via queue, com log auditável

---

### FASE 3 — Camada Gerencial
**Duração estimada:** 6 semanas  
**Objetivo:** transformar dados em decisões de negócio com drill-down por SKU e comparativos

#### Contexto
Com dados corretos (Fase 0+2), o dashboard atual só responde "quanto faturei no período". Um seller precisa de: "qual SKU é o motor do meu negócio?", "estou perdendo dinheiro com algum produto?", "este mês foi melhor que o anterior?". Esta fase constrói essas respostas.

#### Requisitos Funcionais

**F3.1 — Dashboard `/dashboard/products` (P&L por SKU)**
- Tabela com colunas:
  - Imagem + Título (de `listing_catalog`)
  - Receita (R$) no período
  - Unidades vendidas
  - Margem de contribuição (%)
  - Margem real / Lucro (R$)
  - ACOS (%) — se tiver ADS no período
  - DOI (dias de estoque)
  - Status: `▲ Saudável` / `⚠ Estoque baixo` / `✗ Sem margem` / `— Sem custo`
- Ordenação padrão: Lucro (R$) decrescente
- Filtros: por status, por margem mínima
- Exportar CSV com todos os campos

**F3.2 — Detalhe `/dashboard/products/[sku]`**
- Gráfico de linha: receita e unidades diárias nos últimos 90 dias (Recharts)
- Seção P&L: waterfall idêntico ao período, mas só para este SKU
- Histórico de custos (SCD2): tabela com todos os regimes `valid_from → valid_to` e os valores
- ADS: ACOS e spend diário (linha) + campanhas ativas (tabela com campanha, bid, impressões, cliques, ACOS)
- Estoque: gráfico de posição diária + projeção simples "acaba em X dias"
- Devoluções: taxa por período + motivos mais comuns (tabela)

**F3.3 — Dashboard `/dashboard/inventory`**
- Tabela: SKU, título, estoque disponível, DOI, status de reposição
- Status de reposição calculado:
  - `crítico` se `doi < lead_time_days`
  - `atenção` se `doi < lead_time_days * 1.5`
  - `ok` caso contrário
- Card "Capital Alocado Total": `SUM(available_units * unit_cost_current)` por conta
- Ranking "Estoque parado": SKUs com `doi > 90` e sem vendas nos últimos 30 dias

**F3.4 — Dashboard `/dashboard/ads`**
- Visão agregada: ACOS, TACOS, ADS spend, ADS sales, clicks, conversão — por período
- Tabela de campanhas: campanha, tipo (SP/SB/SD), impressões, cliques, CTR, CPC, spend, sales, ACOS
- Tabela "Termos sem conversão": busca real → clicks → custo → 0 vendas → candidatos a negativador
- Drill-down: clicar na campanha → ver keywords/targets + performance por keyword

**F3.5 — Comparativos em todos os cards**
- `MetricCard` ganha prop `comparison?: { value: number; label: string }`
- Período de comparação: imediatamente antes (mesma duração) — calculado automaticamente
- Exibição: `▲ +12% vs. período anterior` ou `▼ -8% vs. mês anterior`
- Seletor: "Comparar com: período anterior / mês anterior / ano anterior"

**F3.6 — Gráficos no dashboard de período**
- Gráfico de linha: receita bruta diária com média móvel de 7 dias
- Gráfico de barras: unidades por SKU (top 10)
- Gráfico de área: ADS spend vs. ADS sales diário
- Usando Recharts (já compatível com Server Components via `'use client'` no wrapper)

**F3.7 — Melhorias de UX**
- Tooltips explicativos em todos os KPIs com sigla (ACOS, TACOS, COGS, DOI) — glossário inline
- Estado vazio com CTA claro: "Conecte sua conta Amazon para ver dados reais"
- Mobile: sidebar colapsável, cards em coluna única, tabelas com scroll horizontal
- Exportação: botão "Exportar CSV" nos dashboards de período, produtos e ads
- Acessibilidade: `aria-label` em todos os inputs, foco visível em botões, contraste WCAG AA

#### Definition of Done — Fase 3
- [ ] Em < 30 segundos o seller sabe qual SKU tem maior lucro absoluto
- [ ] Em < 30 segundos o seller sabe qual SKU está prestes a ficar sem estoque
- [ ] Comparativo vs. período anterior disponível em todos os KPIs principais
- [ ] Dashboard funciona corretamente em iPhone 14 (375px)
- [ ] CSV exportado importa corretamente no Excel BR (separador ponto-e-vírgula, decimal vírgula)

---

### FASE 4 — Inteligência Operacional
**Duração estimada:** 8 semanas  
**Objetivo:** o produto trabalha por você — notifica antes que você precise verificar

#### Contexto
Dashboards informam. Alertas agem. Um seller iniciante não tem tempo de verificar 5 dashboards diariamente. Esta fase faz o produto assumir o papel de "olhar constante" sobre a operação, notificando o que importa quando importa.

Aplicando o conceito de *agent harness* do livro de referência: nesta fase os "agentes" são workers de processamento que observam os dados, detectam anomalias e disparam ações — o padrão observe-orient-decide-act aplicado à operação Amazon.

#### Requisitos Funcionais

**F4.1 — Engine de alertas**
- Cron a cada hora: `alert-engine` worker executa todas as regras ativas por conta
- Arquitetura: `IAlertRule` interface com método `evaluate(account, data): AlertEvent | null`
- Regras padrão (não configuráveis, sempre ativas):
  - `StockCriticalRule`: `doi < lead_time_days` → alerta crítico
  - `NegativeMarginRule`: margem de contribuição < 0% nos últimos 7 dias por SKU
  - `BuyBoxLostRule`: `buybox_pct < 80%` por 3 dias consecutivos
- Regras configuráveis (usuário define thresholds):
  - ACOS acima de X% por N dias
  - Venda diária caiu Y% vs. média 14 dias
  - Estoque abaixo de N dias
- Canais: email (Resend) + notificação in-app (badge no sidebar, lista em `/dashboard/alerts`)
- Deduplicação: mesmo alerta não renotifica por 24h

**F4.2 — Dashboard `/dashboard/alerts`**
- Lista de alertas ativos (não resolvidos) com: SKU, tipo, valor atual, threshold, data
- Lista de histórico (resolvidos/fechados)
- Configuração de regras: formulário para criar/editar regras configuráveis
- Ação: "Marcar como visto" / "Snooze por 7 dias"

**F4.3 — Forecast de vendas por SKU**
- Algoritmo: média móvel exponencial (EMA) sobre 90 dias de `units_sold` diário
- Output: previsão para as próximas 4 semanas com banda de confiança (± 1 desvio padrão)
- Persistir em `forecast_snapshots(account_id, sku, generated_at, forecast_date, predicted_units, lower_bound, upper_bound)`
- Atualizar semanalmente via cron
- Exibir em `/dashboard/products/[sku]`: linha tracejada de previsão no gráfico

**F4.4 — Forecast de estoque**
- Cálculo: `days_remaining = available / avg_daily_sales_ema`
- `reorder_point = lead_time_days + (avg_daily_sales_ema * safety_stock_days)` onde `safety_stock_days = 14` (configurável)
- Alerta: se `days_remaining < reorder_point`, disparar `StockCriticalRule`
- Sugestão de quantidade: `reorder_qty = avg_daily_sales_ema * (lead_time_days + safety_stock_days * 2) - available`

**F4.5 — Cash flow básico**
- Saldo a receber Amazon: `gross_sales_last_14d * (1 - estimated_fee_rate)` — estimativa com tag "aproximado"
- Próximas saídas cadastradas manualmente: tabela simples `cash_outflows(account_id, description, amount, due_date)`
- Runway: `(saldo_estimado + caixa_cadastrado) / burn_rate_diario`
- Tela `/dashboard/cashflow` — informativa, não substitui contador

**F4.6 — Buy Box Health**
- Gráfico % Buy Box diário por SKU (de `daily_sales_snapshot.buybox_pct`)
- Alerta configurável: `buybox_pct < threshold` por N dias consecutivos
- Sugestão quando Buy Box perdido: "Verifique seu preço vs. competidores" (link para Seller Central)

#### Definition of Done — Fase 4
- [ ] Seller recebe email quando ACOS ultrapassa threshold — sem precisar abrir o dashboard
- [ ] Forecast de estoque prevê esgotamento com 30 dias de antecedência (validado contra histórico)
- [ ] `/dashboard/alerts` mostra todos os alertas ativos com contexto suficiente para ação imediata
- [ ] Engine de alertas processa conta de 30 SKUs em < 10 segundos

---

### FASE 5 — Diferencial Competitivo
**Duração estimada:** contínuo (não tem fim)  
**Objetivo:** transformar o Sellmetrics na vantagem injusta do seller BR

#### Contexto
Fases 0-4 entregam um produto funcional e superior à planilha. Fase 5 cria barreiras de saída: o produto acumula histórico, aprende sobre o negócio, e entrega insights que nenhuma planilha e nenhuma ferramenta genérica consegue. Aqui os agentes inteligentes entram de verdade — não como gimmick, mas como camada que conecta dados históricos ricos com linguagem natural.

#### Requisitos Funcionais

**F5.1 — Assistente IA (Plano Pro)**
- Interface de chat em `/dashboard/ai` (floating button em todas as telas)
- Arquitetura: Claude Sonnet via API com system prompt contextualizado + tool use
- Tools disponíveis para o assistente:
  ```
  get_period_metrics(start_date, end_date, sku?)
  get_top_skus_by_metric(metric, period, limit)
  get_inventory_status(sku?)
  get_alerts_active()
  get_trend(sku, metric, days)
  compare_periods(period1, period2, metric)
  ```
- Perguntas de exemplo respondidas:
  - "Qual produto teve maior queda de margem este mês?"
  - "Quanto eu lucrei nos últimos 90 dias descontando o ADS?"
  - "Qual SKU vai ficar sem estoque primeiro?"
  - "Compare meu ACOS de abril vs. março"
- Prompt caching ativado para o system prompt (reduz custo em ~80%)
- Contexto de conta injetado no system prompt: marketplace, moeda, SKUs ativos, período atual

**F5.2 — Detecção de anomalias**
- Z-score sobre 30 dias de histórico diário por métrica (receita, unidades, ACOS, sessions)
- Threshold: `|z| > 2.5` = anomalia provável
- Integrar com engine de alertas: `AnomalyRule` gerada automaticamente
- Exibir no gráfico: ponto destacado em vermelho/amarelo com tooltip explicativo

**F5.3 — Reconciliação Settlement Reports (revisita ADR-004)**
- Importar Settlement Report quinzenal: `reportType=GET_V2_SETTLEMENT_REPORT_DATA_FLAT_FILE`
- Parse dos campos de fee real por pedido
- Relatório de variância: `amazon_fee_real - amazon_fee_estimado` por SKU
- Não substitui o cálculo do sistema — complementa com "seu erro de estimativa está em X%"
- Gera sugestão: "Atualize o amazon_fee_unit do SKU ABC para R$ 8,42 (atual: R$ 7,90)"

**F5.4 — Multi-marketplace (Amazon.com.br + Amazon.com)**
- Tabela `accounts` já suporta múltiplos `marketplace_id`
- Currency: `daily_sales_snapshot.currency` + FX diário (Open Exchange Rates API)
- P&L consolidado: seletor "Todos os marketplaces" converte tudo para BRL na data do snapshot
- Nota: multi-conta de SP-API requer aprovação de aplicativo Amazon — documentar processo

**F5.5 — Colaboração multi-usuário avançada**
- Convite por email com magic link
- Role `viewer` não vê custos (COGS) — apenas receita e margens
- Audit log: `account_activity_log(account_id, user_id, action, entity, entity_id, created_at)`
- Export agendado: contador recebe P&L mensal por email automaticamente no dia 1

**F5.6 — Brand Analytics (busca orgânica)**
- Disponível apenas para sellers com marca registrada (Brand Registry)
- `GET /analytics/2024-02-01/report` com `reportType=SEARCH_QUERY_PERFORMANCE`
- KPIs: impressões orgânicas, cliques, purchases por keyword
- Market share estimado: `purchases / total_market_purchases` por query
- Integra com `/dashboard/ads` como aba "Orgânico"

#### Definition of Done — Fase 5 (iterativo)
- [ ] Assistente IA responde perguntas sobre dados reais em < 3 segundos
- [ ] Detecção de anomalias identifica quedas de receita > 30% com 0 falsos negativos no backtest de 90 dias
- [ ] Settlement reconciliation mostra delta de fees com erro < 0.5% vs. relatório real
- [ ] P&L consolidado BR + USA em BRL com FX correto

---

## 7. Requisitos Não-Funcionais

### 7.1 Performance

| Métrica | Target | Como medir |
|---|---|---|
| TTFB dashboard principal | < 200ms | Cloudflare Analytics |
| P99 de cálculo de métricas (período 90 dias, 30 SKUs) | < 800ms | Traces estruturados |
| Ingestão diária (30 SKUs, 1 dia) | < 60s | `ingestion_logs.duration_ms` |
| Polling de relatório Amazon | < 5 min por relatório | Monitoramento por job |

### 7.2 Disponibilidade

- SLA: 99.5% (Cloudflare Pages + Supabase free tier — escalar para pago se chegar a R$10k MRR)
- Ingestão com retry automático: falha em um dia não compromete histórico
- Dashboard funciona com dados defasados se ingestão falhar (mostra banner "Dados de D-X")

### 7.3 Escalabilidade

- Arquitetura suporta 1.000 contas ativas sem mudança (Supabase Pro + Cloudflare Workers)
- OLAP separation: avaliar DuckDB ou Tinybird quando consultas de período > 1M linhas (provavelmente com > 500 contas ativas × 2 anos × 30 SKUs)
- Batch upsert já implementado desde Fase 2: 1 round-trip por ingestão diária

### 7.4 Segurança

- OWASP Top 10 checklist em cada release
- Pen test externo antes do lançamento comercial (Fase 1)
- Refresh tokens criptografados: AES-256-GCM com chave rotacionada anualmente
- Rate limiting em `/api/cron/*` e `/api/webhooks/*`: Cloudflare WAF
- CSP headers ativados via `next.config.ts`

### 7.5 Observabilidade

- Logger estruturado: Pino + Logflare (compatível com Cloudflare Edge)
- Sentry para captura de erros não tratados (free tier — 5k erros/mês)
- Cloudflare Analytics para métricas de tráfego e performance
- Dashboard interno de saúde: taxa de sucesso da ingestão diária por conta (últimos 7 dias)

---

## 8. Gestão de Risco

| Risco | Probabilidade | Impacto | Mitigação |
|---|---|---|---|
| Amazon rate limiting bloqueia ingestão | Alta | Alto | Retry com backoff exponencial + Cloudflare Queue para isolamento por conta |
| SP-API Reports leva > 30min (timeout Cloudflare) | Média | Alto | Worker dedicado para polling (não edge function) + queue |
| Drift entre `amazon_fee_unit` estimado e real | Alta | Médio | Settlement reconciliation (Fase 5) + tooltip "estimado" em todos os KPIs de fee |
| Seller conecta conta errada (outro marketplace) | Média | Alto | Validação do `marketplaceId` retornado pelo OAuth antes de persistir |
| Vazamento de credenciais Amazon | Baixa | Crítico | Criptografia + secret manager + rotação anual + audit log de acesso |
| Supabase row limit free tier | Alta | Médio | Monitorar uso; upgrade para Pro com < 30 dias de antecedência |
| Falha no cron diário passa despercebida | Média | Alto | Alert automático se `ingestion_logs` não tiver registro de hoje por conta ativa |

---

## 9. Decisões Arquiteturais a Registrar (ADRs pendentes)

| ADR | Decisão proposta | Motivo |
|---|---|---|
| ADR-005 | Adotar Vitest em vez de Jest | 5–10x mais rápido, melhor ESM/TypeScript, API compatível |
| ADR-006 | Cloudflare Queue para ingestão assíncrona | Isolamento de falhas, retry automático, sem timeout de edge function |
| ADR-007 | Criptografia AES-256-GCM para refresh tokens | LGPD compliance + segurança em profundidade |
| ADR-008 | Stripe como processador de pagamentos BR | Suporte a Pix, SDK React, webhooks confiáveis |
| ADR-009 | Claude Sonnet para assistente IA com tool use | Melhor custo-benefício vs. GPT-4o para português BR + tool use |
| ADR-010 | Pino + Logflare para logging estruturado | Compatível com Edge runtime, integra com Supabase |

---

## 10. Métricas de Sucesso do Produto

### 10.1 Métricas de Negócio

| Métrica | Fase 1 | Fase 3 | Fase 5 |
|---|---|---|---|
| MRR | R$ 0 | R$ 5k | R$ 30k |
| Contas ativas | 10 (beta) | 100 | 500 |
| Churn mensal | — | < 8% | < 5% |
| Conversão free → pago | — | > 15% | > 20% |
| NPS | — | > 40 | > 60 |

### 10.2 Métricas de Engenharia

| Métrica | Target |
|---|---|
| Cobertura de testes (serviços financeiros) | > 80% de branches |
| Build time (CI) | < 3 minutos |
| Deploy frequência | ≥ 1x/semana |
| MTTR (mean time to recovery) | < 2 horas |
| % de ingestões diárias com sucesso | > 99% |
| Erros JS em produção (Sentry) | 0 não tratados |

### 10.3 Critérios de Sucesso do Modelo de Dados (PRD v1 preservado)

O modelo é correto quando:
1. Todos os indicadores da planilha de referência são reproduzidos com erro < 0.01%
2. Alteração de parâmetro de custo não altera indicadores de períodos anteriores
3. Qualquer janela de análise é recalculável sem nova chamada às APIs externas
4. Job diário mantém dashboard atualizado com D-1 sem intervenção manual

---

## 11. Glossário

| Termo | Definição |
|---|---|
| **ACOS** | Advertising Cost of Sales — `ads_spend / ads_sales` |
| **TACOS** | Total Advertising Cost of Sales — `ads_spend / gross_sales` |
| **COGS** | Cost of Goods Sold — custo do produto vendido |
| **DOI** | Days of Inventory — dias de estoque restante |
| **SCD2** | Slowly Changing Dimension Type 2 — versionamento histórico de parâmetros |
| **EMA** | Exponential Moving Average — média móvel exponencial para forecast |
| **FBA** | Fulfillment by Amazon — Amazon armazena e entrega |
| **FBM** | Fulfillment by Merchant — seller entrega diretamente |
| **Buy Box** | Botão "Comprar" da listagem Amazon — perder = perder vendas |
| **BSR** | Best Seller Rank — ranking de vendas na categoria |
| **LWA** | Login with Amazon — protocolo OAuth da Amazon (SP-API) |
| **RLS** | Row Level Security — controle de acesso por linha no Supabase |
| **MRR** | Monthly Recurring Revenue — receita recorrente mensal |
| **MTTR** | Mean Time to Recovery — tempo médio de recuperação de incidentes |

---

## 12. Changelog

| Data | Versão | Mudança |
|---|---|---|
| 2026-04-28 | 2.0 | Documento criado. Incorpora auditoria técnica de 27/04/2026 e transição para modelo SaaS multi-tenant. Preserva todos os princípios do PRD v1. |

---

*Este PRD é um contrato vivo. Qualquer mudança de escopo relevante deve ser registrada no changelog acima antes de ser implementada.*
