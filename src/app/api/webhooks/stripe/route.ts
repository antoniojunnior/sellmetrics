import { NextRequest, NextResponse } from 'next/server'
import { getStripe } from '@/lib/stripe/client'
import { accountRepository } from '@/lib/supabase/repositories/account-repository'
import type Stripe from 'stripe'

export async function POST(request: NextRequest) {
  const body = await request.text()
  const sig = request.headers.get('stripe-signature') ?? ''
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET ?? ''

  let event: Stripe.Event
  try {
    event = getStripe().webhooks.constructEvent(body, sig, webhookSecret)
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Invalid signature'
    console.error('[Stripe webhook] Signature verification failed:', message)
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  const getAccountId = (obj: Stripe.Subscription | Stripe.Invoice): string | undefined => {
    if ('metadata' in obj && obj.metadata?.account_id) return obj.metadata.account_id
    return undefined
  }

  switch (event.type) {
    case 'customer.subscription.created':
    case 'customer.subscription.updated': {
      const sub = event.data.object as Stripe.Subscription
      const accountId = getAccountId(sub)
      if (!accountId) break

      const planMap: Record<string, string> = {
        [process.env.STRIPE_PRICE_STARTER ?? '']: 'starter',
        [process.env.STRIPE_PRICE_PRO ?? '']: 'pro',
      }
      const priceId = sub.items.data[0]?.price.id ?? ''
      const planId = planMap[priceId] ?? 'free'

      await accountRepository.updateStripe(accountId, {
        stripe_subscription_id: sub.id,
        plan_id: planId,
        trial_ends_at: sub.trial_end ? new Date(sub.trial_end * 1000).toISOString() : null,
      })
      break
    }

    case 'customer.subscription.deleted': {
      const sub = event.data.object as Stripe.Subscription
      const accountId = getAccountId(sub)
      if (!accountId) break
      await accountRepository.updateStripe(accountId, {
        plan_id: 'free',
        stripe_subscription_id: null,
        trial_ends_at: null,
      })
      break
    }

    case 'invoice.payment_failed': {
      const invoice = event.data.object as Stripe.Invoice
      const accountId = getAccountId(invoice)
      if (accountId) {
        console.warn(`[Stripe] Payment failed for account ${accountId}`)
      }
      break
    }

    default:
      break
  }

  return NextResponse.json({ received: true })
}
