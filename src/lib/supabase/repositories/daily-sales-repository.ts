import { createClient } from '../server'
import { DailySalesSnapshot } from '../types'

export const dailySalesRepository = {
  async upsertDailySalesSnapshot(data: Omit<DailySalesSnapshot, 'id' | 'created_at' | 'updated_at'>) {
    const supabase = await createClient()
    
    const { data: result, error } = await supabase
      .from('daily_sales_snapshot')
      .upsert(data, {
        onConflict: 'account_id, marketplace_id, sku, snapshot_date'
      })
      .select()
      .single()

    if (error) {
      console.error('Error in upsertDailySalesSnapshot:', error)
      throw new Error(`Failed to upsert sales snapshot: ${error.message}`)
    }

    return result as DailySalesSnapshot
  },

  async getSalesByPeriod(accountId: string, startDate: string, endDate: string, sku?: string) {
    const supabase = await createClient()
    
    let query = supabase
      .from('daily_sales_snapshot')
      .select('*')
      .eq('account_id', accountId)
      .gte('snapshot_date', startDate)
      .lte('snapshot_date', endDate)

    if (sku) {
      query = query.eq('sku', sku)
    }

    const { data, error } = await query.order('snapshot_date', { ascending: true })

    if (error) {
      throw new Error(`Failed to fetch sales by period: ${error.message}`)
    }

    return data as DailySalesSnapshot[]
  },

  async getSalesSumByPeriod(accountId: string, startDate: string, endDate: string) {
    const supabase = await createClient()
    
    const { data, error } = await supabase
      .from('daily_sales_snapshot')
      .select('orders_count.sum(), units_sold.sum(), gross_sales.sum()')
      .eq('account_id', accountId)
      .gte('snapshot_date', startDate)
      .lte('snapshot_date', endDate)
      .single()

    if (error) {
      throw new Error(`Failed to fetch sales sum: ${error.message}`)
    }

    return {
      orders_count: (data as any).sum_orders_count || 0,
      units_sold: (data as any).sum_units_sold || 0,
      gross_sales: (data as any).sum_gross_sales || 0
    }
  }
}
