'use server'

import { randomBytes } from 'node:crypto'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { accountRepository } from '@/lib/supabase/repositories/account-repository'
import { ActionResult } from '../settings/types'

const accountInfoSchema = z.object({
  account_id: z.string(),
  name: z.string().min(1, 'Nome da loja obrigatório'),
  marketplace_id: z.string().min(1),
  ads_profile_id: z.string(),
  timezone: z.string().min(1),
})

export async function saveAccountInfo(_prev: ActionResult | null, formData: FormData): Promise<ActionResult> {
  const data = Object.fromEntries(formData.entries())
  const validated = accountInfoSchema.safeParse(data)

  if (!validated.success) {
    return { ok: false, error: validated.error.errors[0]?.message ?? 'Dados inválidos' }
  }

  try {
    await accountRepository.update(validated.data.account_id, {
      name: validated.data.name,
      marketplace_id: validated.data.marketplace_id,
      ads_profile_id: validated.data.ads_profile_id,
      timezone: validated.data.timezone,
    })
    revalidatePath('/dashboard/account')
    return { ok: true }
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : 'Erro ao salvar' }
  }
}

export async function startAmazonOAuth(): Promise<never> {
  const state = randomBytes(16).toString('hex')
  const cookieStore = await cookies()
  cookieStore.set('amazon_oauth_state', state, { httpOnly: true, maxAge: 600, path: '/' })

  const appId = process.env.AMAZON_APP_ID ?? ''
  const callbackUrl = encodeURIComponent(`${process.env.NEXT_PUBLIC_APP_URL}/api/auth/amazon/callback`)
  const url = `https://sellercentral.amazon.com.br/apps/authorize/consent?application_id=${appId}&state=${state}&redirect_uri=${callbackUrl}&version=beta`

  redirect(url)
}

export async function startAdsOAuth(): Promise<never> {
  const state = randomBytes(16).toString('hex')
  const cookieStore = await cookies()
  cookieStore.set('amazon_ads_oauth_state', state, { httpOnly: true, maxAge: 600, path: '/' })

  const clientId = process.env.AMAZON_ADS_CLIENT_ID ?? ''
  const callbackUrl = encodeURIComponent(`${process.env.NEXT_PUBLIC_APP_URL}/api/auth/amazon-ads/callback`)
  const url = `https://www.amazon.com/ap/oa?client_id=${clientId}&scope=advertising::campaign_management&response_type=code&redirect_uri=${callbackUrl}&state=${state}`

  redirect(url)
}

export async function removeMember(accountId: string, userId: string): Promise<ActionResult> {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { ok: false, error: 'Não autenticado' }

    await accountRepository.removeMember(accountId, userId)
    revalidatePath('/dashboard/account')
    return { ok: true }
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : 'Erro ao remover membro' }
  }
}

export async function advanceOnboardingStep(accountId: string, step: number): Promise<ActionResult> {
  try {
    await accountRepository.advanceOnboarding(accountId, step)
    revalidatePath('/dashboard/account')
    revalidatePath('/dashboard/onboarding')
    return { ok: true }
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : 'Erro' }
  }
}
