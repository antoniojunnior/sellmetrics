import { createClient } from '../server'
import { SkuCostParameters } from '../types'

export const skuCostRepository = {
  /**
   * Implementação SCD2: Chama RPC no banco para fechar anterior e abrir novo de forma atômica.
   */
  async createCostParameters(data: Omit<SkuCostParameters, 'id' | 'valid_to' | 'created_at' | 'updated_at'>): Promise<void> {
    const supabase = await createClient()
    
    const { error } = await supabase.rpc('create_sku_cost_regime', {
      p_account_id: data.account_id,
      p_marketplace_id: data.marketplace_id,
      p_sku: data.sku,
      p_unit_cost: data.unit_cost,
      p_prep_cost_unit: data.prep_cost_unit,
      p_tax_rate: data.tax_rate,
      p_amazon_fee_unit: data.amazon_fee_unit,
      p_valid_from: data.valid_from
    })

    if (error) {
      throw new Error(`Failed to create cost regime (RPC): ${error.message}`)
    }
  },

  async getCostForDate(accountId: string, marketplaceId: string, sku: string, date: string) {
    const supabase = await createClient()
    
    const { data, error } = await supabase
      .from('sku_cost_parameters')
      .select('*')
      .eq('account_id', accountId)
      .eq('marketplace_id', marketplaceId)
      .eq('sku', sku)
      .lte('valid_from', date)
      .or(`valid_to.gt.${date},valid_to.is.null`)
      .single()

    if (error && error.code !== 'PGRST116') { // Ignorar erro de "não encontrado"
      throw new Error(`Failed to fetch cost for date: ${error.message}`)
    }

    return (data as SkuCostParameters | null)
  },

  async getCostHistory(accountId: string, sku: string) {
    const supabase = await createClient()
    
    const { data, error } = await supabase
      .from('sku_cost_parameters')
      .select('*')
      .eq('account_id', accountId)
      .eq('sku', sku)
      .order('valid_from', { ascending: false })

    if (error) {
      throw new Error(`Failed to fetch cost history: ${error.message}`)
    }

    return data as SkuCostParameters[]
  }
}
