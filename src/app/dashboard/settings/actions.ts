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
  tax_rate: z.coerce.number().min(0).max(100).transform(v => v / 100), 
  amazon_fee_unit: z.coerce.number().nonnegative(),
  valid_from: z.string().refine(v => !isNaN(Date.parse(v)), 'Data inválida')
})

export async function saveSkuCost(formData: FormData): Promise<void> {
  const data = Object.fromEntries(formData.entries())
  const validated = skuCostSchema.safeParse(data)

  if (!validated.success) return

  try {
    await skuCostRepository.createCostParameters(validated.data)
    revalidatePath('/dashboard/settings/costs')
  } catch (e) {
    console.error(e)
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

export async function saveFixedCosts(formData: FormData): Promise<void> {
  const data = Object.fromEntries(formData.entries())
  const validated = fixedCostsSchema.safeParse(data)

  if (!validated.success) return

  try {
    await fixedCostsRepository.upsertFixedCostsMonth(validated.data)
    revalidatePath('/dashboard/settings/fixed-costs')
  } catch (e) {
    console.error(e)
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
  manual_notes: z.string().optional().nullable()
})

export async function saveManualInputs(formData: FormData): Promise<void> {
  const rawData = Object.fromEntries(formData.entries())
  const validated = manualInputsSchema.safeParse(rawData)

  if (!validated.success) return

  try {
    await periodManualInputsRepository.upsertPeriodManualInputs({
      ...validated.data,
      manual_notes: validated.data.manual_notes || null,
      manual_adjustments: null
    })
    revalidatePath('/dashboard/settings/manual-inputs')
  } catch (e) {
    console.error(e)
  }
}
