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

    const parseUTC = (s: string) => {
      const [y, m, d] = s.split('-').map(Number)
      return new Date(Date.UTC(y, m - 1, d))
    }

    const qStart = parseUTC(startDate)
    const qEnd = parseUTC(endDate)

    return (data as PeriodManualInputs[] || []).map(input => {
      const iStart = parseUTC(input.period_start_date)
      const iEnd = parseUTC(input.period_end_date)
      const inputDays = Math.round((iEnd.getTime() - iStart.getTime()) / 86400000) + 1

      const effectiveStart = qStart > iStart ? qStart : iStart
      const effectiveEnd = qEnd < iEnd ? qEnd : iEnd
      const intersectDays = Math.round((effectiveEnd.getTime() - effectiveStart.getTime()) / 86400000) + 1

      const ratio = Math.min(1, Math.max(0, intersectDays / inputDays))

      return {
        ...input,
        coupon_sales_value: Number(input.coupon_sales_value) * ratio,
        coupon_cost_value: Number(input.coupon_cost_value) * ratio,
        coupon_distributed: Math.round(input.coupon_distributed * ratio),
        coupon_redeemed: Math.round(input.coupon_redeemed * ratio),
      }
    })
  }
}
