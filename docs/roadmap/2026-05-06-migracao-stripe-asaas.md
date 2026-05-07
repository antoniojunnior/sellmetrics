# Migração Stripe → ASAAS

**Data:** 2026-05-06  
**Status:** Pendente (não iniciado)

## Contexto

Substituir Stripe por ASAAS como processador de pagamentos. Motivação: mercado BR, suporte nativo a PIX e boleto, sem IOF/câmbio, preço em BRL.

## Escopo atual (Stripe)

| Arquivo | Responsabilidade |
|---|---|
| `src/lib/stripe/client.ts` | Inicialização lazy + Price IDs |
| `src/app/api/checkout/route.ts` | Cria customer + sessão de checkout |
| `src/app/api/webhooks/stripe/route.ts` | Recebe eventos, atualiza `plan_id` |
| `src/lib/supabase/types.ts` | campos `stripe_customer_id`, `stripe_subscription_id` |
| `src/lib/supabase/repositories/account-repository.ts` | método `updateStripe()` |

## Mapeamento Stripe → ASAAS

| Stripe | ASAAS |
|---|---|
| `customers.create` | `POST /v3/customers` |
| `checkout.sessions.create` | `POST /v3/subscriptions` → retorna `invoiceUrl` |
| Redirect para hosted page | Redirect para `invoiceUrl` (ASAAS hospeda) |
| Webhook HMAC-SHA256 | Header `asaas-access-token` (token fixo) |
| `customer.subscription.created/updated` | `PAYMENT_CONFIRMED` + `SUBSCRIPTION_ACTIVATED` |
| `customer.subscription.deleted` | `SUBSCRIPTION_INACTIVATED` |
| Price IDs por plano | `value` + `cycle: MONTHLY` por plano |
| Só cartão | PIX + Boleto + Cartão (`billingType: UNDEFINED`) |

## Tarefas

### #1 — Client ASAAS (base) `PENDENTE`
- Remover pacote `stripe` do `package.json`
- Criar `src/lib/asaas/client.ts` com fetch wrapper e tipos manuais (Customer, Subscription, WebhookEvent)
- Lazy init com `ASAAS_API_KEY`

### #2 — Substituir rota de checkout `PENDENTE` (bloqueado por #1)
- Substituir `src/app/api/checkout/route.ts`
- `POST /v3/customers` → cria ou reutiliza customer ASAAS
- `POST /v3/subscriptions` com `billingType: UNDEFINED`
- Redireciona para `invoiceUrl`
- Salva `asaas_customer_id` na conta

### #3 — Substituir webhook handler `PENDENTE` (bloqueado por #1)
- Substituir `src/app/api/webhooks/stripe/route.ts`
- Validar header `asaas-access-token` contra `ASAAS_WEBHOOK_TOKEN`
- Mapear eventos: `PAYMENT_CONFIRMED` → atualiza `plan_id`; `SUBSCRIPTION_INACTIVATED` → `plan_id = 'free'`

### #4 — Migration SQL `PENDENTE` (independente)
```sql
ALTER TABLE accounts RENAME COLUMN stripe_customer_id TO asaas_customer_id;
ALTER TABLE accounts RENAME COLUMN stripe_subscription_id TO asaas_subscription_id;
```
- Atualizar `Account` interface em `src/lib/supabase/types.ts`
- Renomear `updateStripe()` → `updateBilling()` em `account-repository.ts`

### #5 — Frontend + env `PENDENTE` (bloqueado por #2, #3, #4)
- `BillingPanel`: simplificar para botão único "Assinar" (ASAAS hospeda seleção de método)
- Adicionar menção a PIX/boleto disponíveis
- `.env.example`: trocar vars `STRIPE_*` por `ASAAS_*`

## Variáveis de ambiente

```bash
# Remover
STRIPE_SECRET_KEY
STRIPE_WEBHOOK_SECRET
STRIPE_PRICE_STARTER
STRIPE_PRICE_PRO

# Adicionar
ASAAS_API_KEY=$aact_...                        # chave do painel ASAAS
ASAAS_BASE_URL=https://api.asaas.com           # sandbox: https://sandbox.asaas.com
ASAAS_WEBHOOK_TOKEN=...                        # token em Integrações > Webhooks
ASAAS_PRICE_STARTER=79.00                      # valor em BRL
ASAAS_PRICE_PRO=149.00
```

## Riscos

| Risco | Mitigação |
|---|---|
| Sem TypeScript SDK oficial | Tipar manualmente — escopo pequeno (3 endpoints) |
| Webhook valida só token fixo (sem HMAC) | IP allowlist no Cloudflare para IPs ASAAS |
| `invoiceUrl` gerado a cada POST | Ok — fluxo sempre cria nova sessão |
| Edge Runtime | `fetch` nativo funciona, sem SDK Node.js |

## Estimativa

~3h, ~6 arquivos modificados, 1 migration SQL.
