import { createClient } from '../server'
import { FixedCostsMonthly } from '../types'

export interface ProportionalFixedCost {
  accounting_fees: number
  rent: number
  amazon_prime: number
  other_fixed_costs: number
  total_fixed_period: number
}

export const fixedCostsRepository = {
  async upsertFixedCostsMonth(data: Omit<FixedCostsMonthly, 'id' | 'total_fixed_month' | 'created_at' | 'updated_at'>): Promise<FixedCostsMonthly> {
    const supabase = await createClient()
    
    const { data: result, error } = await supabase
      .from('fixed_costs_monthly')
      .upsert(data, {
        onConflict: 'account_id, year_month'
      })
      .select()
      .single()

    if (error) {
      throw new Error(`Failed to upsert fixed costs: ${error.message}`)
    }

    return result as FixedCostsMonthly
  },

  async getFixedCostsByPeriod(accountId: string, startDate: string, endDate: string): Promise<ProportionalFixedCost> {
    const supabase = await createClient()
    
    // Busca os meses que intersectam o período
    const startMonth = startDate.substring(0, 7) + '-01'
    const endMonth = endDate.substring(0, 7) + '-01'

    const { data, error } = await supabase
      .from('fixed_costs_monthly')
      .select('*')
      .eq('account_id', accountId)
      .gte('year_month', startMonth)
      .lte('year_month', endMonth)

    if (error) {
      throw new Error(`Failed to fetch fixed costs: ${error.message}`)
    }

    const start = new Date(startDate)
    const end = new Date(endDate)
    
    const totals: ProportionalFixedCost = {
      accounting_fees: 0,
      rent: 0,
      amazon_prime: 0,
      other_fixed_costs: 0,
      total_fixed_period: 0
    }

    data.forEach((monthData) => {
      const monthStart = new Date(monthData.year_month)
      // Garante que o UTC não interfira no cálculo da data (usando o último dia do mês)
      const monthEnd = new Date(monthStart.getFullYear(), monthStart.getMonth() + 1, 0)
      
      // Determina o intervalo de intersecção entre o mês e o período solicitado
      const intersectStart = start > monthStart ? start : monthStart
      const intersectEnd = end < monthEnd ? end : monthEnd
      
      if (intersectStart <= intersectEnd) {
        const daysInMonth = monthEnd.getDate()
        // Cálculo da diferença de dias (inclusivo)
        const diffInMs = intersectEnd.getTime() - intersectStart.getTime()
        const daysInIntersect = Math.ceil(diffInMs / (1000 * 60 * 60 * 24)) + 1
        
        const ratio = daysInIntersect / daysInMonth

        totals.accounting_fees += Number(monthData.accounting_fees) * ratio
        totals.rent += Number(monthData.rent) * ratio
        totals.amazon_prime += Number(monthData.amazon_prime) * ratio
        totals.other_fixed_costs += Number(monthData.other_fixed_costs) * ratio
        totals.total_fixed_period += Number(monthData.total_fixed_month) * ratio
      }
    })

    return totals
  }
}
