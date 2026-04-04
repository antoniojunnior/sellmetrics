import { dailyAdsRepository } from '../supabase/repositories/daily-ads-repository'
import { dailySalesRepository } from '../supabase/repositories/daily-sales-repository'
import { fixedCostsRepository } from '../supabase/repositories/fixed-costs-repository'
import { periodManualInputsRepository } from '../supabase/repositories/period-manual-inputs-repository'
import { skuCostRepository } from '../supabase/repositories/sku-cost-repository'

export interface PeriodMetrics {
  // BLOCO A — Volume
  days: number
  gross_sales: number
  units_sold: number
  orders_count: number

  // BLOCO B — ADS
  ads_spend: number
  ads_sales: number
  ads_clicks: number
  ads_orders: number
  acos: number | null
  tacos: number | null
  ads_conversion: number | null

  // BLOCO C — Custos variáveis
  cogs_total: number | null
  prep_total: number | null
  tax_total: number | null
  amazon_fee_total: number | null
  total_variable_cost: number | null

  // BLOCO D — Cupons
  coupon_sales_value: number
  coupon_cost_value: number
  coupon_distributed: number
  coupon_redeemed: number
  coupon_redemption_rate: number | null

  // BLOCO E — Receita e margens
  revenue_net: number | null
  margin_contribution: number | null
  margin_post_ads: number | null
  markup: number | null

  // BLOCO F — Custos fixos e lucro
  fixed_costs_period: number
  profit_period: number | null
  profit_over_revenue: number | null
  profit_over_investment: number | null

  // BLOCO G — KPIs diários
  revenue_per_day: number
  net_per_day: number | null
}

export const periodMetricsService = {
  async calculateMetrics(
    accountId: string,
    startDate: string,
    endDate: string,
    sku?: string
  ): Promise<PeriodMetrics> {
    // 1. Coleta de dados em paralelo
    const [salesSnapshots, adsSum, manualInputs, fixedCosts] = await Promise.all([
      dailySalesRepository.getSalesByPeriod(accountId, startDate, endDate, sku),
      dailyAdsRepository.getAdsSumByPeriod(accountId, startDate, endDate),
      periodManualInputsRepository.getManualInputsByPeriod(accountId, startDate, endDate),
      fixedCostsRepository.getFixedCostsByPeriod(accountId, startDate, endDate)
    ])

    // BLOCO A — Volume
    const start = new Date(startDate)
    const end = new Date(endDate)
    const days = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1

    const gross_sales = salesSnapshots.reduce((acc, s) => acc + Number(s.gross_sales), 0)
    const units_sold = salesSnapshots.reduce((acc, s) => acc + s.units_sold, 0)
    const orders_count = salesSnapshots.reduce((acc, s) => acc + s.orders_count, 0)

    // BLOCO B — ADS
    const { ads_spend, ads_sales, ads_clicks, ads_orders } = adsSum
    const acos = ads_sales > 0 ? ads_spend / ads_sales : null
    const tacos = gross_sales > 0 ? ads_spend / gross_sales : null
    const ads_conversion = ads_clicks > 0 ? ads_orders / ads_clicks : null

    // BLOCO C — Custos variáveis (Cálculo SCD2 dia a dia)
    let cogs_total = 0
    let prep_total = 0
    let tax_total = 0
    let amazon_fee_total = 0
    let has_missing_costs = false

    // Cache local por SKU para evitar múltiplas buscas do mesmo SKU no mesmo período
    const skuCostsMap: Record<string, any[]> = {}

    for (const sale of salesSnapshots) {
      const skuKey = `${sale.marketplace_id}-${sale.sku}`
      let regimes = skuCostsMap[skuKey]

      if (!regimes) {
        regimes = await skuCostRepository.getCostsByPeriod(
          accountId,
          sale.marketplace_id,
          sale.sku,
          startDate,
          endDate
        )
        skuCostsMap[skuKey] = regimes
      }

      // Lookup em memória do regime válido para o dia do snapshot
      const costs = regimes.find(r => 
        r.valid_from <= sale.snapshot_date && 
        (r.valid_to > sale.snapshot_date || r.valid_to === null)
      )

      if (!costs) {
        has_missing_costs = true
        break
      }

      cogs_total += Math.round(sale.units_sold * Number(costs.unit_cost) * 100) / 100
      prep_total += Math.round(sale.units_sold * Number(costs.prep_cost_unit) * 100) / 100
      tax_total += Math.round(Number(sale.gross_sales) * Number(costs.tax_rate) * 100) / 100
      amazon_fee_total += Math.round(sale.units_sold * Number(costs.amazon_fee_unit) * 100) / 100
    }

    // BLOCO D — Cupons
    const coupon_sales_value = manualInputs?.coupon_sales_value ? Number(manualInputs.coupon_sales_value) : 0
    const coupon_cost_value = manualInputs?.coupon_cost_value ? Number(manualInputs.coupon_cost_value) : 0
    const coupon_distributed = manualInputs?.coupon_distributed || 0
    const coupon_redeemed = manualInputs?.coupon_redeemed || 0
    const coupon_redemption_rate = coupon_distributed > 0 ? coupon_redeemed / coupon_distributed : null

    // Totais de custos variáveis (arredondado)
    const total_variable_cost = has_missing_costs 
      ? null 
      : Math.round((cogs_total + prep_total + tax_total + amazon_fee_total + coupon_cost_value) * 100) / 100

    // BLOCO E — Receita e margens
    const revenue_net = total_variable_cost !== null ? gross_sales - total_variable_cost : null
    const margin_contribution = (revenue_net !== null && gross_sales > 0) ? revenue_net / gross_sales : null
    const margin_post_ads = (revenue_net !== null && gross_sales > 0) ? (revenue_net - ads_spend) / gross_sales : null
    const markup = (total_variable_cost !== null && total_variable_cost > 0) ? gross_sales / total_variable_cost : null

    // BLOCO F — Custos fixos e lucro
    const fixed_costs_period = fixedCosts.total_fixed_period
    const profit_period = revenue_net !== null ? revenue_net - ads_spend - fixed_costs_period : null
    const profit_over_revenue = (profit_period !== null && gross_sales > 0) ? profit_period / gross_sales : null
    const profit_over_investment = (profit_period !== null && cogs_total > 0) ? profit_period / cogs_total : null

    // BLOCO G — KPIs diários
    const revenue_per_day = gross_sales / days
    const net_per_day = revenue_net !== null ? revenue_net / days : null

    return {
      days,
      gross_sales,
      units_sold,
      orders_count,
      ads_spend,
      ads_sales,
      ads_clicks,
      ads_orders,
      acos,
      tacos,
      ads_conversion,
      cogs_total: has_missing_costs ? null : cogs_total,
      prep_total: has_missing_costs ? null : prep_total,
      tax_total: has_missing_costs ? null : tax_total,
      amazon_fee_total: has_missing_costs ? null : amazon_fee_total,
      total_variable_cost,
      coupon_sales_value,
      coupon_cost_value,
      coupon_distributed,
      coupon_redeemed,
      coupon_redemption_rate,
      revenue_net,
      margin_contribution,
      margin_post_ads,
      markup,
      fixed_costs_period,
      profit_period,
      profit_over_revenue,
      profit_over_investment,
      revenue_per_day,
      net_per_day
    }
  }
}
