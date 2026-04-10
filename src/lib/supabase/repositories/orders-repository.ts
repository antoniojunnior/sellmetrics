import { createClient } from '../server'

export interface AmazonOrderItem {
  id?: string
  account_id: string
  marketplace_id: string
  amazon_order_id: string
  purchase_date: string
  sku: string
  quantity: number
  item_price: number
  order_status: string
}

export const ordersRepository = {
  async upsertOrderItems(items: AmazonOrderItem[]) {
    if (items.length === 0) return
    
    const supabase = await createClient()
    
    // Adicionamos updated_at manualmente para garantir que o banco registre a mudança
    const itemsToUpsert = items.map(item => ({
      ...item,
      updated_at: new Date().toISOString()
    }))

    const { error } = await supabase
      .from('amazon_orders')
      .upsert(itemsToUpsert, {
        onConflict: 'account_id, amazon_order_id, sku'
      })

    if (error) {
      throw new Error(`Failed to upsert amazon orders: ${error.message}`)
    }
  },

  async getOrdersByPeriod(accountId: string, startDate: string, endDate: string, sku?: string) {
    const supabase = await createClient()
    
    let query = supabase
      .from('amazon_orders')
      .select('*')
      .eq('account_id', accountId)
      .gte('purchase_date', `${startDate}T00:00:00Z`)
      .lte('purchase_date', `${endDate}T23:59:59Z`)

    if (sku) {
      query = query.ilike('sku', `%${sku}%`)
    }

    const { data, error } = await query.order('purchase_date', { ascending: false })

    if (error) {
      throw new Error(`Failed to fetch orders: ${error.message}`)
    }

    return data as AmazonOrderItem[]
  }
}
