import { periodMetricsService } from '../period-metrics-service'
import { dailySalesRepository } from '../../supabase/repositories/daily-sales-repository'
import { dailyAdsRepository } from '../../supabase/repositories/daily-ads-repository'
import { periodManualInputsRepository } from '../../supabase/repositories/period-manual-inputs-repository'
import { fixedCostsRepository } from '../../supabase/repositories/fixed-costs-repository'
import { skuCostRepository } from '../../supabase/repositories/sku-cost-repository'

jest.mock('../../supabase/repositories/daily-sales-repository')
jest.mock('../../supabase/repositories/daily-ads-repository')
jest.mock('../../supabase/repositories/period-manual-inputs-repository')
jest.mock('../../supabase/repositories/fixed-costs-repository')
jest.mock('../../supabase/repositories/sku-cost-repository')

describe('periodMetricsService', () => {
  const accountId = 'test-account'
  const startDate = '2026-03-25'
  const endDate = '2026-04-05'
  const marketplaceId = 'ATVPDKIKX0DER'
  const sku = 'SKU-001'

  beforeEach(() => {
    jest.clearAllMocks()
  })

  test('CENÁRIO BASE — período simples com 1 SKU', async () => {
    const start = '2026-04-01'
    const end = '2026-04-05'
    
    ;(dailySalesRepository.getSalesByPeriod as jest.Mock).mockResolvedValue([
      { snapshot_date: '2026-04-01', units_sold: 10, gross_sales: 100, orders_count: 5, marketplace_id: marketplaceId, sku },
      { snapshot_date: '2026-04-02', units_sold: 10, gross_sales: 100, orders_count: 5, marketplace_id: marketplaceId, sku },
      { snapshot_date: '2026-04-03', units_sold: 10, gross_sales: 100, orders_count: 5, marketplace_id: marketplaceId, sku },
      { snapshot_date: '2026-04-04', units_sold: 10, gross_sales: 100, orders_count: 5, marketplace_id: marketplaceId, sku },
      { snapshot_date: '2026-04-05', units_sold: 10, gross_sales: 100, orders_count: 5, marketplace_id: marketplaceId, sku },
    ])

    ;(dailyAdsRepository.getAdsSumByPeriod as jest.Mock).mockResolvedValue({
      ads_spend: 50,
      ads_sales: 150,
      ads_clicks: 100,
      ads_orders: 10
    })

    ;(periodManualInputsRepository.getManualInputsByPeriod as jest.Mock).mockResolvedValue({
      coupon_sales_value: 20,
      coupon_cost_value: 5,
      coupon_distributed: 10,
      coupon_redeemed: 2
    })

    ;(fixedCostsRepository.getFixedCostsByPeriod as jest.Mock).mockResolvedValue({
      total_fixed_period: 25
    })

    ;(skuCostRepository.getCostForDate as jest.Mock).mockResolvedValue({
      unit_cost: 2,
      prep_cost_unit: 0.5,
      tax_rate: 0.1,
      amazon_fee_unit: 1
    })

    const metrics = await periodMetricsService.calculateMetrics(accountId, start, end, sku)

    expect(metrics.days).toBe(5)
    expect(metrics.gross_sales).toBe(500)
    expect(metrics.units_sold).toBe(50)
    expect(metrics.orders_count).toBe(25)
    expect(metrics.ads_spend).toBe(50)
    expect(metrics.acos).toBeCloseTo(50 / 150)
    expect(metrics.tacos).toBeCloseTo(50 / 500)
    
    // Custos variáveis:
    // cogs: 50 * 2 = 100
    // prep: 50 * 0.5 = 25
    // tax: 500 * 0.1 = 50
    // amazon_fee: 50 * 1 = 50
    // total_var: 100 + 25 + 50 + 50 + 5 (coupon) = 230
    expect(metrics.cogs_total).toBe(100)
    expect(metrics.total_variable_cost).toBe(230)
    expect(metrics.revenue_net).toBe(500 - 230) // 270
    expect(metrics.profit_period).toBe(270 - 50 - 25) // 195
  })

  test('CENÁRIO SCD2 — mudança de custo no meio do período', async () => {
    const start = '2026-04-01'
    const end = '2026-04-04'
    
    ;(dailySalesRepository.getSalesByPeriod as jest.Mock).mockResolvedValue([
      { snapshot_date: '2026-04-01', units_sold: 10, gross_sales: 100, marketplace_id: marketplaceId, sku },
      { snapshot_date: '2026-04-02', units_sold: 10, gross_sales: 100, marketplace_id: marketplaceId, sku },
      { snapshot_date: '2026-04-03', units_sold: 10, gross_sales: 100, marketplace_id: marketplaceId, sku },
      { snapshot_date: '2026-04-04', units_sold: 10, gross_sales: 100, marketplace_id: marketplaceId, sku },
    ])

    ;(dailyAdsRepository.getAdsSumByPeriod as jest.Mock).mockResolvedValue({
      ads_spend: 0, ads_sales: 0, ads_clicks: 0, ads_orders: 0
    })

    ;(fixedCostsRepository.getFixedCostsByPeriod as jest.Mock).mockResolvedValue({
      total_fixed_period: 0
    })

    // Mock SCD2: custo muda no dia 03
    ;(skuCostRepository.getCostForDate as jest.Mock).mockImplementation((acc, mkt, sku, date) => {
      if (date < '2026-04-03') {
        return Promise.resolve({ unit_cost: 2, prep_cost_unit: 0, tax_rate: 0, amazon_fee_unit: 0 })
      }
      return Promise.resolve({ unit_cost: 5, prep_cost_unit: 0, tax_rate: 0, amazon_fee_unit: 0 })
    })

    const metrics = await periodMetricsService.calculateMetrics(accountId, start, end, sku)

    // COGS: (20 * 2) + (20 * 5) = 40 + 100 = 140
    expect(metrics.cogs_total).toBe(140)
  })

  test('CENÁRIO DE ZEROS — período sem ADS', async () => {
    const start = '2026-04-01'
    const end = '2026-04-01'
    
    ;(dailySalesRepository.getSalesByPeriod as jest.Mock).mockResolvedValue([
      { snapshot_date: '2026-04-01', units_sold: 10, gross_sales: 100, marketplace_id: marketplaceId, sku },
    ])

    ;(dailyAdsRepository.getAdsSumByPeriod as jest.Mock).mockResolvedValue({
      ads_spend: 0, ads_sales: 0, ads_clicks: 0, ads_orders: 0
    })

    ;(skuCostRepository.getCostForDate as jest.Mock).mockResolvedValue({
      unit_cost: 1, prep_cost_unit: 0, tax_rate: 0, amazon_fee_unit: 0
    })
    
    ;(fixedCostsRepository.getFixedCostsByPeriod as jest.Mock).mockResolvedValue({
      total_fixed_period: 0
    })

    const metrics = await periodMetricsService.calculateMetrics(accountId, start, end, sku)

    expect(metrics.acos).toBe(null) // De acordo com o serviço, se ads_sales=0 retorna null
    expect(metrics.tacos).toBe(0)
    expect(metrics.ads_conversion).toBe(null)
  })

  test('CENÁRIO SEM CUSTO — SKU sem parâmetro cadastrado', async () => {
    const start = '2026-04-01'
    const end = '2026-04-01'
    
    ;(dailySalesRepository.getSalesByPeriod as jest.Mock).mockResolvedValue([
      { snapshot_date: '2026-04-01', units_sold: 10, gross_sales: 100, marketplace_id: marketplaceId, sku },
    ])

    ;(skuCostRepository.getCostForDate as jest.Mock).mockResolvedValue(null)

    const metrics = await periodMetricsService.calculateMetrics(accountId, start, end, sku)

    expect(metrics.cogs_total).toBe(null)
    expect(metrics.revenue_net).toBe(null)
    expect(metrics.profit_period).toBe(null)
  })

  test('CENÁRIO MULTI-MÊS — período atravessando dois meses', async () => {
    // 25/03 a 05/04 (12 dias)
    // Março: 25, 26, 27, 28, 29, 30, 31 (7 dias)
    // Abril: 1, 2, 3, 4, 5 (5 dias)
    
    ;(dailySalesRepository.getSalesByPeriod as jest.Mock).mockResolvedValue([])
    ;(dailyAdsRepository.getAdsSumByPeriod as jest.Mock).mockResolvedValue({
      ads_spend: 0, ads_sales: 0, ads_clicks: 0, ads_orders: 0
    })

    // O repositório já retorna o total proporcional calculado
    ;(fixedCostsRepository.getFixedCostsByPeriod as jest.Mock).mockResolvedValue({
      total_fixed_period: 120 // Simulado: R$ 10/dia * 12 dias
    })

    const metrics = await periodMetricsService.calculateMetrics(accountId, '2026-03-25', '2026-04-05', sku)

    expect(metrics.fixed_costs_period).toBe(120)
    expect(metrics.days).toBe(12)
  })
})
