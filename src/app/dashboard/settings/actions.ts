'use server'

import { z } from 'zod'
import { revalidatePath } from 'next/cache'
import { skuCostRepository } from '@/lib/supabase/repositories/sku-cost-repository'
import { fixedCostsRepository } from '@/lib/supabase/repositories/fixed-costs-repository'
import { couponDailyRepository } from '@/lib/supabase/repositories/coupon-daily-repository'
import { ActionResult } from './types'

// 1. Schema para SCD2 SkuCost
const skuCostSchema = z.object({
  account_id: z.string(),
  marketplace_id: z.string(),
  sku: z.string().min(1, 'SKU obrigatório'),
  unit_cost: z.coerce.number().positive(),
  prep_cost_unit: z.coerce.number().nonnegative(),
  tax_rate: z.coerce.number().min(0).max(100).transform(v => v / 100),
  amazon_fee_unit: z.coerce.number().nonnegative(),
  valid_from: z.string().refine(v => !isNaN(Date.parse(v)), 'Data inválida')
})

export async function saveSkuCost(_prev: ActionResult | null, formData: FormData): Promise<ActionResult> {
  const data = Object.fromEntries(formData.entries())
  const validated = skuCostSchema.safeParse(data)

  if (!validated.success) {
    const firstError = validated.error.errors[0]?.message ?? 'Dados inválidos'
    return { ok: false, error: firstError }
  }

  try {
    await skuCostRepository.createCostParameters(validated.data)
    revalidatePath('/dashboard/settings/costs')
    return { ok: true }
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Erro ao salvar custo do SKU'
    return { ok: false, error: message }
  }
}

// 2. Schema para Custos Fixos
const fixedCostsSchema = z.object({
  account_id: z.string(),
  year_month: z.string().transform(v => `${v}-01`),
  accounting_fees: z.coerce.number().nonnegative(),
  rent: z.coerce.number().nonnegative(),
  amazon_prime: z.coerce.number().nonnegative(),
  other_fixed_costs: z.coerce.number().nonnegative()
})

export async function saveFixedCosts(_prev: ActionResult | null, formData: FormData): Promise<ActionResult> {
  const data = Object.fromEntries(formData.entries())
  const validated = fixedCostsSchema.safeParse(data)

  if (!validated.success) {
    const firstError = validated.error.errors[0]?.message ?? 'Dados inválidos'
    return { ok: false, error: firstError }
  }

  try {
    await fixedCostsRepository.upsertFixedCostsMonth(validated.data)
    revalidatePath('/dashboard/settings/fixed-costs')
    return { ok: true }
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Erro ao salvar custos fixos'
    return { ok: false, error: message }
  }
}

// 3. Schema para Cupons Diários (F0.6 — substitui period_manual_inputs)
const couponDailySchema = z.object({
  account_id: z.string(),
  period_start_date: z.string(),
  period_end_date: z.string(),
  coupon_sales_value: z.coerce.number().nonnegative(),
  coupon_cost_value: z.coerce.number().nonnegative(),
  coupon_distributed: z.coerce.number().int().nonnegative(),
  coupon_redeemed: z.coerce.number().int().nonnegative(),
}).refine(d => d.period_end_date >= d.period_start_date, {
  message: 'Data de fim deve ser igual ou posterior ao início',
  path: ['period_end_date'],
})

export async function saveCouponDaily(_prev: ActionResult | null, formData: FormData): Promise<ActionResult> {
  const rawData = Object.fromEntries(formData.entries())
  const validated = couponDailySchema.safeParse(rawData)

  if (!validated.success) {
    const firstError = validated.error.errors[0]?.message ?? 'Dados inválidos'
    return { ok: false, error: firstError }
  }

  const { account_id, period_start_date, period_end_date, ...values } = validated.data

  try {
    await couponDailyRepository.upsertCouponRange(account_id, period_start_date, period_end_date, values)
    revalidatePath('/dashboard/settings/manual-inputs')
    return { ok: true }
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Erro ao salvar cupons'
    return { ok: false, error: message }
  }
}
