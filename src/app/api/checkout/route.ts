export const runtime = 'edge'

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getStripe, PLAN_PRICE_IDS } from '@/lib/stripe/client'
import { accountRepository } from '@/lib/supabase/repositories/account-repository'

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { planId } = await request.json() as { planId: string }
  const priceId = PLAN_PRICE_IDS[planId]
  if (!priceId) {
    return NextResponse.json({ error: 'Invalid plan' }, { status: 400 })
  }

  const account = await accountRepository.getByUserId(user.id)
  if (!account) {
    return NextResponse.json({ error: 'Account not found' }, { status: 404 })
  }

  let customerId = account.stripe_customer_id ?? undefined

  if (!customerId) {
    const customer = await getStripe().customers.create({
      email: user.email,
      metadata: { account_id: account.id, user_id: user.id },
    })
    customerId = customer.id
    await accountRepository.updateStripe(account.id, { stripe_customer_id: customerId })
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? ''
  const session = await getStripe().checkout.sessions.create({
    customer: customerId,
    mode: 'subscription',
    line_items: [{ price: priceId, quantity: 1 }],
    payment_method_types: ['card'],
    success_url: `${appUrl}/dashboard/account?checkout=success`,
    cancel_url: `${appUrl}/dashboard/account?checkout=cancelled`,
    subscription_data: {
      metadata: { account_id: account.id },
    },
  })

  return NextResponse.json({ url: session.url })
}
