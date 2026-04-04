import { createClient } from '../server'
import { DailyAdsSnapshot } from '../types'

export const dailyAdsRepository = {
  async upsertDailyAdsSnapshot(data: Omit<DailyAdsSnapshot, 'id' | 'created_at' | 'updated_at'>) {
    const supabase = await createClient()
    
    const { data: result, error } = await supabase
      .from('daily_ads_snapshot')
      .upsert(data, {
        onConflict: 'account_id, marketplace_id, snapshot_date'
      })
      .select()
      .single()

    if (error) {
      throw new Error(`Failed to upsert ads snapshot: ${error.message}`)
    }

    return result as DailyAdsSnapshot
  },

  async getAdsByPeriod(accountId: string, startDate: string, endDate: string) {
    const supabase = await createClient()
    
    const { data, error } = await supabase
      .from('daily_ads_snapshot')
      .select('*')
      .eq('account_id', accountId)
      .gte('snapshot_date', startDate)
      .lte('snapshot_date', endDate)
      .order('snapshot_date', { ascending: true })

    if (error) {
      throw new Error(`Failed to fetch ads by period: ${error.message}`)
    }

    return data as DailyAdsSnapshot[]
  },

  async getAdsSumByPeriod(accountId: string, startDate: string, endDate: string) {
    const supabase = await createClient()
    
    const { data, error } = await supabase
      .from('daily_ads_snapshot')
      .select('ads_spend.sum(), ads_sales.sum(), ads_clicks.sum(), ads_orders.sum()')
      .eq('account_id', accountId)
      .gte('snapshot_date', startDate)
      .lte('snapshot_date', endDate)
      .single()

    if (error) {
      throw new Error(`Failed to fetch ads sum: ${error.message}`)
    }

    return {
      ads_spend: (data as any).sum_ads_spend || 0,
      ads_sales: (data as any).sum_ads_sales || 0,
      ads_clicks: (data as any).sum_ads_clicks || 0,
      ads_orders: (data as any).sum_ads_orders || 0
    }
  }
}
