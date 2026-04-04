/**
 * Cliente para Amazon Selling Partner API (SP-API)
 * Documentação: https://developer-docs.amazon.com/sp-api/docs/report-type-values-analytics#sales-and-traffic-business-reports
 */

export interface SpApiSalesRecord {
  date: string
  sku: string
  ordersCount: number
  unitsSold: number
  grossSales: number
}

export const spApiClient = {
  /**
   * Busca o Sales & Traffic Business Report
   * ReportType: GET_SALES_AND_TRAFFIC_REPORT
   * Granularidade fixa: dateGranularity=DAY, asinGranularity=SKU
   */
  async getSalesAndTrafficReport(
    accountId: string,
    startDate: string,
    endDate: string
  ): Promise<SpApiSalesRecord[]> {
    // 1. Obter Token de Acesso (Lógica de OAuth/LWA)
    // 2. Criar Relatório (POST /reports/2021-06-30/reports)
    // 3. Poll de status até COMPLETED
    // 4. Baixar documento e processar JSON/Tab-delimited
    
    console.log(`[SP-API] Solicitando relatório para conta ${accountId} entre ${startDate} e ${endDate}`)
    
    // Simulação de resposta da API para fins de estrutura
    // Na implementação real, usaríamos axios/fetch com retry exponencial (p-retry)
    return [] 
  },

  /**
   * Helper para retry exponencial em caso de 429 (Rate Limit)
   */
  async withRetry<T>(fn: () => Promise<T>, retries = 3): Promise<T> {
    try {
      return await fn()
    } catch (error: any) {
      if (retries > 0 && error?.status === 429) {
        const delay = Math.pow(2, 3 - retries) * 1000
        await new Promise(resolve => setTimeout(resolve, delay))
        return this.withRetry(fn, retries - 1)
      }
      throw error
    }
  }
}
