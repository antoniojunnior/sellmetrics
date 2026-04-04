import { createClient } from '../server'
import { SkuCostParameters } from '../types'

export const skuCostRepository = {
  /**
   * Implementação SCD2: Insere novo regime e fecha o anterior.
   */
  async createCostParameters(data: Omit<SkuCostParameters, 'id' | 'valid_to' | 'created_at' | 'updated_at'>) {
    const supabase = await createClient()
    
    // 1. Fechar o regime anterior (valid_to = valid_from do novo)
    const { error: updateError } = await supabase
      .from('sku_cost_parameters')
      .update({ valid_to: data.valid_from })
      .eq('account_id', data.account_id)
      .eq('marketplace_id', data.marketplace_id)
      .eq('sku', data.sku)
      .is('valid_to', null)

    if (updateError) {
      throw new Error(`Failed to close previous cost regime: ${updateError.message}`)
    }

    // 2. Inserir o novo regime
    const { data: result, error: insertError } = await supabase
      .from('sku_cost_parameters')
      .insert({ ...data, valid_to: null })
      .select()
      .single()

    if (insertError) {
      throw new Error(`Failed to insert new cost parameters: ${insertError.message}`)
    }

    return result as SkuCostParameters
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
