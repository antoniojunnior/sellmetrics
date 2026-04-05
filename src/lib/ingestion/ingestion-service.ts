import { dailyAdsRepository } from '../supabase/repositories/daily-ads-repository'
import { dailySalesRepository } from '../supabase/repositories/daily-sales-repository'
import { adsApiClient } from './ads-api-client'
import { spApiClient } from './sp-api-client'

export const ingestionService = {
  /**
   * Carga histórica completa por intervalo.
   * Processa em lotes de 7 dias para respeitar rate limits e janelas de relatório.
   */
  async ingestHistorical(accountId: string, marketplaceId: string, adsProfileId: string, startDate: string, endDate: string) {
    const start = new Date(startDate)
    const end = new Date(endDate)
    
    let currentStart = new Date(start)
    
    while (currentStart <= end) {
      let currentEnd = new Date(currentStart)
      currentEnd.setDate(currentEnd.getDate() + 6) // Lotes de 7 dias
      
      if (currentEnd > end) currentEnd = end
      
      const sDate = currentStart.toISOString().split('T')[0]
      const eDate = currentEnd.toISOString().split('T')[0]
      
      console.log(`[Ingestion] Processando lote: ${sDate} até ${eDate}`)
      
      // 1. Buscar e persistir vendas (Abordagem via Pedidos API)
      const sales = await spApiClient.getSalesDataByOrders(accountId, sDate, eDate)
      for (const record of sales) {
        await dailySalesRepository.upsertDailySalesSnapshot({
          account_id: accountId,
          marketplace_id: marketplaceId,
          sku: record.sku,
          snapshot_date: record.date,
          orders_count: record.ordersCount,
          units_sold: record.unitsSold,
          gross_sales: record.grossSales
        })
      }
      
      // 2. Buscar e persistir ADS (Ads API)
      const ads = await adsApiClient.getSponsoredProductsReport(adsProfileId, sDate, eDate)
      for (const record of ads) {
        await dailyAdsRepository.upsertDailyAdsSnapshot({
          account_id: accountId,
          marketplace_id: marketplaceId,
          snapshot_date: record.date,
          ads_spend: record.adsSpend,
          ads_sales: record.adsSales,
          ads_clicks: record.adsClicks,
          ads_orders: record.adsOrders
        })
      }
      
      currentStart.setDate(currentStart.getDate() + 7)
    }
    
    return { status: 'success', accountId, startDate, endDate }
  },

  /**
   * Atualização incremental diária (D-1).
   */
  async ingestYesterday(accountId: string, marketplaceId: string, adsProfileId: string) {
    const yesterday = new Date()
    yesterday.setDate(yesterday.getDate() - 1)
    const dateStr = yesterday.toISOString().split('T')[0]
    
    return this.ingestHistorical(accountId, marketplaceId, adsProfileId, dateStr, dateStr)
  }
}
