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
      const monthEnd = new Date(monthStart.getFullYear(), monthStart.getMonth() + 1, 0)
      
      // Verifica se há qualquer intersecção entre o mês e o período
      const hasIntersection = start <= monthEnd && end >= monthStart
      
      if (hasIntersection) {
        // Regra alterada: Contabiliza o valor INTEGRAL do mês se houver intersecção
        totals.accounting_fees += Number(monthData.accounting_fees)
        totals.rent += Number(monthData.rent)
        totals.amazon_prime += Number(monthData.amazon_prime)
        totals.other_fixed_costs += Number(monthData.other_fixed_costs)
        totals.total_fixed_period += Number(monthData.total_fixed_month)
      }
    })

    return totals
  }
}
