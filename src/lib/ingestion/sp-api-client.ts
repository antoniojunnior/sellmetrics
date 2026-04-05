/**
 * Cliente para Amazon Selling Partner API (SP-API)
 */

export interface SpApiSalesRecord {
  date: string
  sku: string
  ordersCount: number
  unitsSold: number
  grossSales: number
}

export const spApiClient = {
  async getSalesAndTrafficReport(
    accountId: string,
    startDate: string,
    endDate: string
  ): Promise<SpApiSalesRecord[]> {
    const clientId = process.env.AMAZON_SP_API_CLIENT_ID
    
    // Se não houver credenciais, geramos dados simulados para teste do dashboard
    if (!clientId || clientId.includes('xxx')) {
      console.log(`[SP-API] Credenciais ausentes. Gerando dados simulados para ${accountId}...`)
      return this.generateMockData(startDate, endDate)
    }

    // TODO: Implementação real da chamada via fetch/axios para a Amazon
    console.log(`[SP-API] Chamada real para conta ${accountId} entre ${startDate} e ${endDate}`)
    return [] 
  },

  generateMockData(startStr: string, endStr: string): SpApiSalesRecord[] {
    const start = new Date(startStr)
    const end = new Date(endStr)
    const records: SpApiSalesRecord[] = []
    
    // SKUs fixos para teste
    const skus = ['AMZ-PROD-001', 'AMZ-PROD-002']

    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
      const dateStr = d.toISOString().split('T')[0]
      
      for (const sku of skus) {
        records.push({
          date: dateStr,
          sku: sku,
          ordersCount: Math.floor(Math.random() * 10) + 1,
          unitsSold: Math.floor(Math.random() * 15) + 1,
          grossSales: Math.floor(Math.random() * 500) + 50
        })
      }
    }
    return records
  }
}
