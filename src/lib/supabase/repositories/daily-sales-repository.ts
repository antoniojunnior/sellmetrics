import { createClient } from '../server'
import { DailySalesSnapshot } from '../types'

export interface SalesSum {
  orders_count: number
  units_sold: number
  gross_sales: number
}

export const dailySalesRepository = {
  async upsertDailySalesSnapshot(data: Omit<DailySalesSnapshot, 'id' | 'created_at' | 'updated_at'>): Promise<DailySalesSnapshot> {
    const supabase = await createClient()
    
    // Forçamos o updated_at para garantir que o banco registre a atualização
    const dataWithTimestamp = {
      ...data,
      updated_at: new Date().toISOString()
    }

    const { data: result, error } = await supabase
      .from('daily_sales_snapshot')
      .upsert(dataWithTimestamp, {
        onConflict: 'account_id, marketplace_id, sku, snapshot_date',
        ignoreDuplicates: false // Garante que ele SOBRESCREVA os dados antigos
      })
      .select()
      .single()

    if (error) {
      console.error('Snapshot Upsert Error:', error)
      throw new Error(`Failed to update sales snapshot: ${error.message}`)
    }

    return result as DailySalesSnapshot
  },

  async deleteSalesByPeriod(accountId: string, startDate: string, endDate: string, sku?: string): Promise<void> {
    const supabase = await createClient()
    
    let query = supabase
      .from('daily_sales_snapshot')
      .delete()
      .eq('account_id', accountId)
      .gte('snapshot_date', startDate)
      .lte('snapshot_date', endDate)

    if (sku) {
      query = query.eq('sku', sku)
    }

    const { error } = await query

    if (error) {
      throw new Error(`Failed to delete sales snapshots: ${error.message}`)
    }
  },

  async getSalesByPeriod(accountId: string, startDate: string, endDate: string, sku?: string): Promise<DailySalesSnapshot[]> {
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

  async getSalesSumByPeriod(accountId: string, startDate: string, endDate: string): Promise<SalesSum> {
    const supabase = await createClient()
    
    const { data, error } = await supabase
      .from('daily_sales_snapshot')
      .select('orders_count, units_sold, gross_sales')
      .eq('account_id', accountId)
      .gte('snapshot_date', startDate)
      .lte('snapshot_date', endDate)

    if (error) {
      throw new Error(`Failed to fetch sales sum: ${error.message}`)
    }

    return data.reduce((acc, curr) => ({
      orders_count: acc.orders_count + curr.orders_count,
      units_sold: acc.units_sold + curr.units_sold,
      gross_sales: acc.gross_sales + Number(curr.gross_sales)
    }), { orders_count: 0, units_sold: 0, gross_sales: 0 })
  }
}
