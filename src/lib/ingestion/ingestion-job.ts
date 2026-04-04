import { ingestionService } from './ingestion-service'

/**
 * Função principal para execução agendada (CRON).
 * Este job busca todas as contas ativas e realiza a ingestão incremental do dia anterior.
 */
export async function runDailyIngestionJob() {
  console.log('[Job] Iniciando job diário de ingestão...')
  
  // 1. Em um sistema real, buscaríamos uma lista de contas ativas no banco.
  // Ex: const activeAccounts = await accountRepository.getActiveAccounts()
  const activeAccounts = [
    { accountId: 'default-account', marketplaceId: 'ATVPDKIKX0DER', adsProfileId: 'profile-1' }
  ]

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
    } catch (error: any) {
      console.error(`[Job] Erro ao processar conta ${account.accountId}:`, error.message)
      results.push({ accountId: account.accountId, status: 'error', error: error.message })
    }
  }

  console.log('[Job] Job finalizado.')
  return results
}
