export const runtime = 'edge'

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { asaas, PLAN_PRICES } from '@/lib/asaas/client'
import { accountRepository } from '@/lib/supabase/repositories/account-repository'

function nextDueDate(): string {
  const d = new Date()
  d.setDate(d.getDate() + 1)
  return d.toISOString().split('T')[0]
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { planId, cpfCnpj } = await request.json() as { planId: string; cpfCnpj?: string }
    const value = PLAN_PRICES[planId]
    if (!value) {
      return NextResponse.json({ error: 'Invalid plan' }, { status: 400 })
    }

    const account = await accountRepository.getByUserId(user.id)
    if (!account) {
      return NextResponse.json({ error: 'Account not found' }, { status: 404 })
    }

    let customerId = account.asaas_customer_id ?? undefined

    if (!customerId) {
      const existing = await asaas.customers.findByEmail(user.email ?? '')
      if (existing.data.length > 0) {
        customerId = existing.data[0].id
      } else {
        const customer = await asaas.customers.create({
          name: account.name ?? user.email ?? 'Sellmetrics User',
          email: user.email ?? '',
          cpfCnpj: cpfCnpj ?? '',
          externalReference: account.id,
        })
        customerId = customer.id
      }
      await accountRepository.updateBilling(account.id, { asaas_customer_id: customerId })
    }

    // Always patch CPF/CNPJ — customer may have been created without it
    if (cpfCnpj) {
      await asaas.customers.update(customerId, { cpfCnpj })
    }

    const subscription = await asaas.subscriptions.create({
      customer: customerId,
      billingType: 'UNDEFINED',
      cycle: 'MONTHLY',
      value,
      nextDueDate: nextDueDate(),
      description: `Sellmetrics ${planId.charAt(0).toUpperCase() + planId.slice(1)}`,
      externalReference: account.id,
    })

    if (!subscription.invoiceUrl) {
      return NextResponse.json({ error: 'Failed to generate payment link' }, { status: 500 })
    }

    return NextResponse.json({ url: subscription.invoiceUrl })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unexpected error'
    console.error('[checkout]', message)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
