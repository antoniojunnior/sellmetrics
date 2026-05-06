import Stripe from 'stripe'

let _client: Stripe | null = null

export function getStripe(): Stripe {
  if (!_client) {
    const key = process.env.STRIPE_SECRET_KEY
    if (!key) throw new Error('STRIPE_SECRET_KEY not configured')
    _client = new Stripe(key, {
      apiVersion: '2026-04-22.dahlia',
      typescript: true,
    })
  }
  return _client
}

export const PLAN_PRICE_IDS: Record<string, string> = {
  starter: process.env.STRIPE_PRICE_STARTER ?? '',
  pro: process.env.STRIPE_PRICE_PRO ?? '',
}
