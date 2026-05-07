// ─── Types ───────────────────────────────────────────────────────────────────

export type AsaasBillingType = 'BOLETO' | 'CREDIT_CARD' | 'PIX' | 'UNDEFINED'
export type AsaasCycle = 'WEEKLY' | 'BIWEEKLY' | 'MONTHLY' | 'QUARTERLY' | 'SEMIANNUALLY' | 'YEARLY'
export type AsaasSubscriptionStatus = 'ACTIVE' | 'INACTIVE' | 'EXPIRED'

export interface AsaasCustomer {
  id: string
  name: string
  email: string
}

export interface AsaasSubscription {
  id: string
  customer: string
  billingType: AsaasBillingType
  cycle: AsaasCycle
  value: number
  status: AsaasSubscriptionStatus
  invoiceUrl: string | null
}

export interface AsaasWebhookEvent {
  event: string
  payment?: {
    id: string
    customer: string
    subscription: string | null
    status: string
    value: number
  }
  subscription?: {
    id: string
    customer: string
    status: AsaasSubscriptionStatus
    value: number
    externalReference: string | null
  }
}

// ─── Plans ───────────────────────────────────────────────────────────────────

export const PLAN_PRICES: Record<string, number> = {
  starter: parseFloat(process.env.ASAAS_PRICE_STARTER ?? '79.00'),
  pro: parseFloat(process.env.ASAAS_PRICE_PRO ?? '149.00'),
}

// ─── Client ──────────────────────────────────────────────────────────────────

function getBaseUrl(): string {
  const base = (process.env.ASAAS_BASE_URL ?? 'https://api.asaas.com').replace(/\/$/, '')
  // ASAAS API path prefix is /api/v3 — base URL should not include it
  return base
}

function apiPath(path: string): string {
  // Normalize: always use /api/v3 prefix
  return `/api/v3${path.startsWith('/') ? path : '/' + path}`
}

function getApiKey(): string {
  const key = process.env.ASAAS_API_KEY
  if (!key) throw new Error('ASAAS_API_KEY not configured')
  return key
}

async function asaasRequest<T>(
  method: 'GET' | 'POST' | 'DELETE',
  path: string,
  body?: unknown,
): Promise<T> {
  const res = await fetch(`${getBaseUrl()}${apiPath(path)}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      'access_token': getApiKey(),
      'User-Agent': 'Sellmetrics/1.0',
    },
    body: body ? JSON.stringify(body) : undefined,
  })

  if (!res.ok) {
    const text = await res.text()
    throw new Error(`ASAAS ${method} ${path} → ${res.status}: ${text}`)
  }

  return res.json() as Promise<T>
}

// ─── API methods ─────────────────────────────────────────────────────────────

export const asaas = {
  customers: {
    create(data: { name: string; email: string; externalReference?: string }) {
      return asaasRequest<AsaasCustomer>('POST', '/customers', data)
    },
    findByEmail(email: string) {
      return asaasRequest<{ data: AsaasCustomer[] }>('GET', `/customers?email=${encodeURIComponent(email)}&limit=1`)
    },
  },

  subscriptions: {
    create(data: {
      customer: string
      billingType: AsaasBillingType
      cycle: AsaasCycle
      value: number
      nextDueDate: string
      description: string
      externalReference: string
    }) {
      return asaasRequest<AsaasSubscription>('POST', '/subscriptions', data)
    },
    inactivate(subscriptionId: string) {
      return asaasRequest<AsaasSubscription>('DELETE', `/subscriptions/${subscriptionId}`)
    },
  },
}
