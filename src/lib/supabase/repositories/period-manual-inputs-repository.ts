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

  async getManualInputsByPeriod(accountId: string, startDate: string, endDate: string) {
    const supabase = await createClient()
    
    const { data, error } = await supabase
      .from('period_manual_inputs')
      .select('*')
      .eq('account_id', accountId)
      .eq('period_start_date', startDate)
      .eq('period_end_date', endDate)
      .single()

    if (error && error.code !== 'PGRST116') {
      throw new Error(`Failed to fetch manual inputs: ${error.message}`)
    }

    return (data as PeriodManualInputs | null)
  }
}
