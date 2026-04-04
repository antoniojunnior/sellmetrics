'use server'

import { z } from 'zod'
import { revalidatePath } from 'next/cache'
import { skuCostRepository } from '@/lib/supabase/repositories/sku-cost-repository'
import { fixedCostsRepository } from '@/lib/supabase/repositories/fixed-costs-repository'
import { periodManualInputsRepository } from '@/lib/supabase/repositories/period-manual-inputs-repository'

// 1. Schema para SCD2 SkuCost
const skuCostSchema = z.object({
  account_id: z.string(),
  marketplace_id: z.string(),
  sku: z.string().min(1, 'SKU obrigatório'),
  unit_cost: z.coerce.number().positive(),
  prep_cost_unit: z.coerce.number().nonnegative(),
  tax_rate: z.coerce.number().min(0).max(100).transform(v => v / 100), // Converte de % para decimal
  amazon_fee_unit: z.coerce.number().nonnegative(),
  valid_from: z.string().refine(v => !isNaN(Date.parse(v)), 'Data inválida')
})

export async function saveSkuCost(formData: FormData) {
  const data = Object.fromEntries(formData.entries())
  const validated = skuCostSchema.safeParse(data)

  if (!validated.success) {
    return { error: validated.error.flatten().fieldErrors }
  }

  try {
    await skuCostRepository.createCostParameters(validated.data)
    revalidatePath('/dashboard/settings/costs')
    return { success: true }
  } catch (e: any) {
    return { error: { server: [e.message] } }
  }
}

// 2. Schema para Custos Fixos
const fixedCostsSchema = z.object({
  account_id: z.string(),
  year_month: z.string().transform(v => `${v}-01`), // Garante o 1º dia do mês
  accounting_fees: z.coerce.number().nonnegative(),
  rent: z.coerce.number().nonnegative(),
  amazon_prime: z.coerce.number().nonnegative(),
  other_fixed_costs: z.coerce.number().nonnegative()
})

export async function saveFixedCosts(formData: FormData) {
  const data = Object.fromEntries(formData.entries())
  const validated = fixedCostsSchema.safeParse(data)

  if (!validated.success) return { error: validated.error.flatten().fieldErrors }

  try {
    await fixedCostsRepository.upsertFixedCostsMonth(validated.data)
    revalidatePath('/dashboard/settings/fixed-costs')
    return { success: true }
  } catch (e: any) {
    return { error: { server: [e.message] } }
  }
}

// 3. Schema para Inputs Manuais
const manualInputsSchema = z.object({
  account_id: z.string(),
  period_start_date: z.string(),
  period_end_date: z.string(),
  coupon_sales_value: z.coerce.number().nonnegative(),
  coupon_cost_value: z.coerce.number().nonnegative(),
  coupon_distributed: z.coerce.number().int().nonnegative(),
  coupon_redeemed: z.coerce.number().int().nonnegative(),
  manual_notes: z.string().optional()
})

export async function saveManualInputs(formData: FormData) {
  const data = Object.fromEntries(formData.entries())
  const validated = manualInputsSchema.safeParse(data)

  if (!validated.success) return { error: validated.error.flatten().fieldErrors }

  try {
    await periodManualInputsRepository.upsertPeriodManualInputs(validated.data)
    revalidatePath('/dashboard/settings/manual-inputs')
    return { success: true }
  } catch (e: any) {
    return { error: { server: [e.message] } }
  }
}
