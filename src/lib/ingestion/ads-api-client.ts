/**
 * Cliente para Amazon Ads API
 */

export interface AdsApiReportRecord {
  date: string
  adsSpend: number
  adsSales: number
  adsClicks: number
  adsOrders: number
}

export const adsApiClient = {
  async getSponsoredProductsReport(
    profileId: string,
    startDate: string,
    endDate: string
  ): Promise<AdsApiReportRecord[]> {
    const clientId = process.env.AMAZON_ADS_API_CLIENT_ID

    if (!clientId || clientId.includes('yyy')) {
      console.log(`[Ads-API] Credenciais ausentes. Gerando dados simulados para profile ${profileId}...`)
      return this.generateMockData(startDate, endDate)
    }

    // TODO: Implementação real da chamada via fetch para a Amazon Ads
    console.log(`[Ads-API] Chamada real para profile ${profileId} (${startDate} a ${endDate})`)
    return []
  },

  generateMockData(startStr: string, endStr: string): AdsApiReportRecord[] {
    const start = new Date(startStr)
    const end = new Date(endStr)
    const records: AdsApiReportRecord[] = []

    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
      const dateStr = d.toISOString().split('T')[0]
      const spend = Math.floor(Math.random() * 50) + 10
      
      records.push({
        date: dateStr,
        adsSpend: spend,
        adsSales: spend * (Math.random() * 5 + 2), // ROAS entre 2 e 7
        adsClicks: Math.floor(Math.random() * 100) + 20,
        adsOrders: Math.floor(Math.random() * 10) + 1
      })
    }
    return records
  }
}
