import { createClient } from '../server'
import { PeriodManualInputs } from '../types'

export const periodManualInputsRepository = {
  async upsertPeriodManualInputs(data: Omit<PeriodManualInputs, 'id' | 'created_at' | 'updated_at'>) {
    const supabase = await createClient()
    
    const { data: result, error } = await supabase
      .from('period_manual_inputs')
      .upsert(data, {
        onConflict: 'account_id, period_start_date, period_end_date'
      })
      .select()
      .single()

    if (error) {
      throw new Error(`Failed to upsert manual inputs: ${error.message}`)
    }

    return result as PeriodManualInputs
  },

  /**
   * Busca todos os inputs manuais que intersectam o período informado.
   * Lógica de intersecção: (start_date <= input_end) AND (end_date >= input_start)
   */
  async getManualInputsByPeriod(accountId: string, startDate: string, endDate: string): Promise<PeriodManualInputs[]> {
    const supabase = await createClient()
    
    const { data, error } = await supabase
      .from('period_manual_inputs')
      .select('*')
      .eq('account_id', accountId)
      .lte('period_start_date', endDate)
      .gte('period_end_date', startDate)

    if (error) {
      throw new Error(`Failed to fetch manual inputs: ${error.message}`)
    }

    return (data as PeriodManualInputs[] || [])
  }
}
