import { createAdminClient } from '@/lib/supabase/admin'
import { ingestionService } from './ingestion-service'

interface ActiveAccount {
  id: string
  marketplace_id: string
  ads_profile_id: string
}

async function loadActiveAccounts(): Promise<ActiveAccount[]> {
  const admin = createAdminClient()
  const { data, error } = await admin
    .from('accounts')
    .select('id, marketplace_id, ads_profile_id')
    .eq('active', true)

  if (error) {
    console.warn('[Job] Falha ao ler accounts — fallback para variáveis de ambiente:', error.message)
    return loadFromEnv()
  }

  if (!data || data.length === 0) {
    console.warn('[Job] Nenhuma conta ativa em accounts — fallback para variáveis de ambiente.')
    return loadFromEnv()
  }

  return data as ActiveAccount[]
}

function loadFromEnv(): ActiveAccount[] {
  const accountId = process.env.DEFAULT_ACCOUNT_ID
  if (!accountId) {
    console.warn('[Job] DEFAULT_ACCOUNT_ID não configurado.')
    return []
  }
  return [{
    id: accountId,
    marketplace_id: process.env.DEFAULT_MARKETPLACE_ID ?? 'A2Q3Y263D00KWC',
    ads_profile_id: process.env.DEFAULT_ADS_PROFILE_ID ?? '',
  }]
}

export async function runDailyIngestionJob() {
  const activeAccounts = await loadActiveAccounts()

  if (activeAccounts.length === 0) {
    console.warn('[Job] Nenhuma conta para processar.')
    return []
  }

  const results = []

  for (const account of activeAccounts) {
    try {
      console.log(`[Job] Processando conta: ${account.id}`)
      const result = await ingestionService.ingestYesterday(
        account.id,
        account.marketplace_id,
        account.ads_profile_id
      )
      results.push({ accountId: account.id, status: 'success', result })
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Unknown error'
      console.error(`[Job] Erro ao processar conta ${account.id}:`, message)
      results.push({ accountId: account.id, status: 'error', error: message })
    }
  }

  console.log(`[Job] Job finalizado. ${results.length} conta(s) processada(s).`)
  return results
}
