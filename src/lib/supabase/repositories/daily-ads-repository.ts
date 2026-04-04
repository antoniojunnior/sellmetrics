import { createClient } from '../server'
import { DailyAdsSnapshot } from '../types'

export interface AdsSum {
  ads_spend: number
  ads_sales: number
  ads_clicks: number
  ads_orders: number
}

export const dailyAdsRepository = {
  async upsertDailyAdsSnapshot(data: Omit<DailyAdsSnapshot, 'id' | 'created_at' | 'updated_at'>): Promise<DailyAdsSnapshot> {
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

  async getAdsByPeriod(accountId: string, startDate: string, endDate: string): Promise<DailyAdsSnapshot[]> {
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

  async getAdsSumByPeriod(accountId: string, startDate: string, endDate: string): Promise<AdsSum> {
    const supabase = await createClient()
    
    const { data, error } = await supabase
      .from('daily_ads_snapshot')
      .select('ads_spend, ads_sales, ads_clicks, ads_orders')
      .eq('account_id', accountId)
      .gte('snapshot_date', startDate)
      .lte('snapshot_date', endDate)

    if (error) {
      throw new Error(`Failed to fetch ads sum: ${error.message}`)
    }

    return data.reduce((acc, curr) => ({
      ads_spend: acc.ads_spend + Number(curr.ads_spend),
      ads_sales: acc.ads_sales + Number(curr.ads_sales),
      ads_clicks: acc.ads_clicks + curr.ads_clicks,
      ads_orders: acc.ads_orders + curr.ads_orders
    }), { ads_spend: 0, ads_sales: 0, ads_clicks: 0, ads_orders: 0 })
  }
}
