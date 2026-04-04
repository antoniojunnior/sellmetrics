import { createClient } from '../server'
import { FixedCostsMonthly } from '../types'

export const fixedCostsRepository = {
  async upsertFixedCostsMonth(data: Omit<FixedCostsMonthly, 'id' | 'total_fixed_month' | 'created_at' | 'updated_at'>) {
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

  /**
   * Retorna os custos fixos que intersectam o período e calcula o rateio.
   */
  async getFixedCostsByPeriod(accountId: string, startDate: string, endDate: string) {
    const supabase = await createClient()
    
    // Simplificação: busca os meses que cobrem o intervalo
    const startMonth = startDate.substring(0, 7) + '-01'
    const endMonth = endDate.substring(0, 7) + '-01'

    const { data, error } = await supabase
      .from('fixed_costs_monthly')
      .select('*')
      .eq('account_id', accountId)
      .gte('year_month', startMonth)
      .lte('year_month', endMonth)

    if (error) {
      throw new Error(`Failed to fetch fixed costs by period: ${error.message}`)
    }

    const fixedCosts = data as FixedCostsMonthly[]

    // Lógica de rateio proporcional (pode ser expandida conforme necessidade)
    const periodStart = new Date(startDate)
    const periodEnd = new Date(endDate)
    const totalDays = Math.ceil((periodEnd.getTime() - periodStart.getTime()) / (1000 * 60 * 60 * 24)) + 1

    let totalProportionalCost = 0

    fixedCosts.forEach(cost => {
      const monthDate = new Date(cost.year_month)
      const daysInMonth = new Date(monthDate.getFullYear(), monthDate.getMonth() + 1, 0).getDate()
      
      // Aqui calcularíamos a intersecção exata de dias, mas para simplificação inicial:
      // Rateio por dia = total_fixed_month / dias_do_mês
      const dailyCost = cost.total_fixed_month / daysInMonth
      
      // Cálculo simplificado: assumes todos os dias do período estão dentro dos meses retornados
      // Em uma implementação real, iteraríamos dia a dia ou calcularíamos intersecções.
    })

    return fixedCosts
  }
}
