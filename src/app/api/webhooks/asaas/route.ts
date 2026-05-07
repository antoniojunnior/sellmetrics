export const runtime = 'edge'

import { NextRequest, NextResponse } from 'next/server'
import { accountRepository } from '@/lib/supabase/repositories/account-repository'
import type { AsaasWebhookEvent } from '@/lib/asaas/client'
import { PLAN_PRICES } from '@/lib/asaas/client'

// ASAAS sends the configured token in the access_token header
function verifyToken(request: NextRequest): boolean {
  const token = process.env.ASAAS_WEBHOOK_TOKEN
  if (!token) return false
  return request.headers.get('asaas-access-token') === token
}

function planIdFromValue(value: number): string {
  const starter = PLAN_PRICES['starter']
  const pro = PLAN_PRICES['pro']
  if (value >= pro) return 'pro'
  if (value >= starter) return 'starter'
  return 'free'
}

export async function POST(request: NextRequest) {
  if (!verifyToken(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const event = await request.json() as AsaasWebhookEvent

  switch (event.event) {
    case 'PAYMENT_CONFIRMED':
    case 'PAYMENT_RECEIVED': {
      const payment = event.payment
      if (!payment?.subscription) break

      // externalReference on subscription = account_id
      // We resolve account via asaas_customer_id stored in account
      const accountId = await resolveAccountByCustomer(payment.customer)
      if (!accountId) break

      const planId = planIdFromValue(payment.value)
      await accountRepository.updateBilling(accountId, {
        asaas_subscription_id: payment.subscription,
        plan_id: planId,
      })
      break
    }

    case 'SUBSCRIPTION_ACTIVATED': {
      const sub = event.subscription
      if (!sub) break
      const accountId = sub.externalReference ?? await resolveAccountByCustomer(sub.customer)
      if (!accountId) break
      const planId = planIdFromValue(sub.value)
      await accountRepository.updateBilling(accountId, {
        asaas_subscription_id: sub.id,
        plan_id: planId,
      })
      break
    }

    case 'SUBSCRIPTION_INACTIVATED':
    case 'SUBSCRIPTION_DELETED': {
      const sub = event.subscription
      if (!sub) break
      const accountId = sub.externalReference ?? await resolveAccountByCustomer(sub.customer)
      if (!accountId) break
      await accountRepository.updateBilling(accountId, {
        plan_id: 'free',
        asaas_subscription_id: null,
      })
      break
    }

    case 'PAYMENT_OVERDUE': {
      const payment = event.payment
      if (payment) console.warn(`[ASAAS] Payment overdue for customer ${payment.customer}`)
      break
    }

    default:
      break
  }

  return NextResponse.json({ received: true })
}

async function resolveAccountByCustomer(customerId: string): Promise<string | null> {
  // Lazy import to avoid circular deps — admin client used inside
  const { createAdminClient } = await import('@/lib/supabase/admin')
  const admin = createAdminClient()
  const { data } = await admin
    .from('accounts')
    .select('id')
    .eq('asaas_customer_id', customerId)
    .maybeSingle()
  return data?.id ?? null
}
