'use server'

import { createClient } from '@/lib/supabase/server'
import { accountRepository } from '@/lib/supabase/repositories/account-repository'
import { ingestionService } from '@/lib/ingestion/ingestion-service'
import { ActionResult } from '../settings/types'

export async function runOnboardingIngestion(accountId: string): Promise<ActionResult> {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { ok: false, error: 'Não autenticado' }

    const account = await accountRepository.getById(accountId)
    if (!account || account.owner_id !== user.id) {
      return { ok: false, error: 'Conta não encontrada' }
    }

    const endDate = new Date()
    endDate.setDate(endDate.getDate() - 1)
    const startDate = new Date(endDate)
    startDate.setDate(startDate.getDate() - 29)

    const fmt = (d: Date) => d.toISOString().split('T')[0]

    await ingestionService.ingestHistorical(
      account.id,
      account.marketplace_id,
      account.ads_profile_id,
      fmt(startDate),
      fmt(endDate)
    )

    await accountRepository.advanceOnboarding(accountId, 4)
    return { ok: true }
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : 'Erro na ingestão' }
  }
}
