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
}

export interface AsaasPayment {
  id: string
  customer: string
  subscription: string | null
  status: string
  value: number
  invoiceUrl: string | null
  bankSlipUrl: string | null
  pixQrCodeUrl: string | null
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

// ASAAS_BASE_URL must include /api/v3 — e.g. https://sandbox.asaas.com/api/v3
function getBaseUrl(): string {
  return (process.env.ASAAS_BASE_URL ?? 'https://api.asaas.com/api/v3').replace(/\/$/, '')
}

function getApiKey(): string {
  const key = process.env.ASAAS_API_KEY
  if (!key) throw new Error('ASAAS_API_KEY not configured')
  return key
}

async function asaasRequest<T>(
  method: 'GET' | 'POST' | 'PUT' | 'DELETE',
  path: string,
  body?: unknown,
): Promise<T> {
  const url = `${getBaseUrl()}${path.startsWith('/') ? path : '/' + path}`
  const res = await fetch(url, {
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
    create(data: { name: string; email: string; cpfCnpj?: string; externalReference?: string }) {
      return asaasRequest<AsaasCustomer>('POST', '/customers', data)
    },
    update(customerId: string, data: { cpfCnpj?: string; name?: string }) {
      return asaasRequest<AsaasCustomer>('PUT', `/customers/${customerId}`, data)
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
    payments(subscriptionId: string) {
      return asaasRequest<{ data: AsaasPayment[] }>('GET', `/subscriptions/${subscriptionId}/payments?limit=1`)
    },
  },
}
