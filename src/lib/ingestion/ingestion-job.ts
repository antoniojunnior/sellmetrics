import { ingestionService } from './ingestion-service'

/**
 * Função principal para execução agendada (CRON).
 *
 * Fase 0: lê conta única de variáveis de ambiente.
 * Fase 1: substituir por query em `accounts WHERE active = true`.
 */
export async function runDailyIngestionJob() {
  const accountId = process.env.DEFAULT_ACCOUNT_ID
  const marketplaceId = process.env.DEFAULT_MARKETPLACE_ID ?? 'A2Q3Y263D00KWC'
  const adsProfileId = process.env.DEFAULT_ADS_PROFILE_ID ?? ''

  if (!accountId) {
    console.warn('[Job] DEFAULT_ACCOUNT_ID não configurado. Configure via variável de ambiente.')
    return []
  }

  const activeAccounts = [{ accountId, marketplaceId, adsProfileId }]
  const results = []

  for (const account of activeAccounts) {
    try {
      console.log(`[Job] Processando conta: ${account.accountId}`)
      const result = await ingestionService.ingestYesterday(
        account.accountId,
        account.marketplaceId,
        account.adsProfileId
      )
      results.push({ accountId: account.accountId, status: 'success', result })
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Unknown error'
      console.error(`[Job] Erro ao processar conta ${account.accountId}:`, message)
      results.push({ accountId: account.accountId, status: 'error', error: message })
    }
  }

  console.log('[Job] Job finalizado.')
  return results
}
