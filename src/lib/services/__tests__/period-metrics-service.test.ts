import { periodMetricsService } from '../period-metrics-service'
import { dailySalesRepository } from '../../supabase/repositories/daily-sales-repository'
import { dailyAdsRepository } from '../../supabase/repositories/daily-ads-repository'
import { couponDailyRepository } from '../../supabase/repositories/coupon-daily-repository'
import { fixedCostsRepository } from '../../supabase/repositories/fixed-costs-repository'
import { skuCostRepository } from '../../supabase/repositories/sku-cost-repository'

vi.mock('../../supabase/repositories/daily-sales-repository')
vi.mock('../../supabase/repositories/daily-ads-repository')
vi.mock('../../supabase/repositories/coupon-daily-repository')
vi.mock('../../supabase/repositories/fixed-costs-repository')
vi.mock('../../supabase/repositories/sku-cost-repository')

const mockSalesRepo = dailySalesRepository.getSalesByPeriod as ReturnType<typeof vi.fn>
const mockAdsRepo = dailyAdsRepository.getAdsSumByPeriod as ReturnType<typeof vi.fn>
const mockCouponRepo = couponDailyRepository.getCouponSumByPeriod as ReturnType<typeof vi.fn>
const mockFixedRepo = fixedCostsRepository.getFixedCostsByPeriod as ReturnType<typeof vi.fn>
const mockSkuCostRepo = skuCostRepository.getCostsByPeriod as ReturnType<typeof vi.fn>

const accountId = 'test-account'
const marketplaceId = 'ATVPDKIKX0DER'
const sku = 'SKU-001'

const noAds = { ads_spend: 0, ads_sales: 0, ads_clicks: 0, ads_orders: 0 }
const noCoupons = { coupon_sales_value: 0, coupon_cost_value: 0, coupon_distributed: 0, coupon_redeemed: 0 }
const noFixed = { total_fixed_period: 0 }

describe('periodMetricsService', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  test('CENÁRIO BASE — período simples com 1 SKU', async () => {
    const start = '2026-04-01'
    const end = '2026-04-05'

    mockSalesRepo.mockResolvedValue([
      { snapshot_date: '2026-04-01', units_sold: 10, gross_sales: 100, orders_count: 5, marketplace_id: marketplaceId, sku },
      { snapshot_date: '2026-04-02', units_sold: 10, gross_sales: 100, orders_count: 5, marketplace_id: marketplaceId, sku },
      { snapshot_date: '2026-04-03', units_sold: 10, gross_sales: 100, orders_count: 5, marketplace_id: marketplaceId, sku },
      { snapshot_date: '2026-04-04', units_sold: 10, gross_sales: 100, orders_count: 5, marketplace_id: marketplaceId, sku },
      { snapshot_date: '2026-04-05', units_sold: 10, gross_sales: 100, orders_count: 5, marketplace_id: marketplaceId, sku },
    ])

    mockAdsRepo.mockResolvedValue({ ads_spend: 50, ads_sales: 150, ads_clicks: 100, ads_orders: 10 })

    mockCouponRepo.mockResolvedValue({
      coupon_sales_value: 20,
      coupon_cost_value: 5,
      coupon_distributed: 10,
      coupon_redeemed: 2,
    })

    mockFixedRepo.mockResolvedValue({ total_fixed_period: 25 })

    mockSkuCostRepo.mockResolvedValue([{
      unit_cost: 2,
      prep_cost_unit: 0.5,
      tax_rate: 0.1,
      amazon_fee_unit: 1,
      valid_from: '2026-04-01',
      valid_to: null,
    }])

    const metrics = await periodMetricsService.calculateMetrics(accountId, start, end, sku)

    expect(metrics.days).toBe(5)
    expect(metrics.gross_sales).toBe(500)
    expect(metrics.units_sold).toBe(50)
    expect(metrics.orders_count).toBe(25)
    expect(metrics.ads_spend).toBe(50)
    expect(metrics.acos).toBeCloseTo(50 / 150)
    expect(metrics.tacos).toBeCloseTo(50 / 500)

    // cogs: 50 * 2 = 100 | prep: 50 * 0.5 = 25 | tax: 500 * 0.1 = 50 | fee: 50 * 1 = 50
    // total_variable_cost = 100 + 25 + 50 + 50 = 225 (cupom NÃO entra aqui)
    expect(metrics.cogs_total).toBe(100)
    expect(metrics.total_variable_cost).toBe(225)

    // revenue_net = (gross_sales - canceled_sales) - total_variable_cost = (500 - 0) - 225 = 275
    expect(metrics.revenue_net).toBe(275)

    // profit = revenue_net - ads_spend - fixed = 275 - 50 - 25 = 200
    expect(metrics.profit_period).toBe(200)
  })

  test('CENÁRIO SCD2 — mudança de custo no meio do período', async () => {
    const start = '2026-04-01'
    const end = '2026-04-04'

    mockSalesRepo.mockResolvedValue([
      { snapshot_date: '2026-04-01', units_sold: 10, gross_sales: 100, orders_count: 5, marketplace_id: marketplaceId, sku },
      { snapshot_date: '2026-04-02', units_sold: 10, gross_sales: 100, orders_count: 5, marketplace_id: marketplaceId, sku },
      { snapshot_date: '2026-04-03', units_sold: 10, gross_sales: 100, orders_count: 5, marketplace_id: marketplaceId, sku },
      { snapshot_date: '2026-04-04', units_sold: 10, gross_sales: 100, orders_count: 5, marketplace_id: marketplaceId, sku },
    ])

    mockAdsRepo.mockResolvedValue(noAds)
    mockCouponRepo.mockResolvedValue(noCoupons)
    mockFixedRepo.mockResolvedValue(noFixed)

    // Regime 1: valid até 02 (valid_to='2026-04-03' significa que o dia 03 já é o novo)
    // Regime 2: válido a partir de 03
    mockSkuCostRepo.mockResolvedValue([
      { unit_cost: 2, prep_cost_unit: 0, tax_rate: 0, amazon_fee_unit: 0, valid_from: '2026-04-01', valid_to: '2026-04-03' },
      { unit_cost: 5, prep_cost_unit: 0, tax_rate: 0, amazon_fee_unit: 0, valid_from: '2026-04-03', valid_to: null },
    ])

    const metrics = await periodMetricsService.calculateMetrics(accountId, start, end, sku)

    // Dias 01-02: 20 un × 2 = 40 | Dias 03-04: 20 un × 5 = 100
    expect(metrics.cogs_total).toBe(140)
  })

  test('CENÁRIO DE ZEROS — período sem ADS', async () => {
    const start = '2026-04-01'
    const end = '2026-04-01'

    mockSalesRepo.mockResolvedValue([
      { snapshot_date: '2026-04-01', units_sold: 10, gross_sales: 100, orders_count: 5, marketplace_id: marketplaceId, sku },
    ])

    mockAdsRepo.mockResolvedValue(noAds)
    mockCouponRepo.mockResolvedValue(noCoupons)
    mockFixedRepo.mockResolvedValue(noFixed)

    mockSkuCostRepo.mockResolvedValue([{
      unit_cost: 1, prep_cost_unit: 0, tax_rate: 0, amazon_fee_unit: 0,
      valid_from: '2026-04-01', valid_to: null,
    }])

    const metrics = await periodMetricsService.calculateMetrics(accountId, start, end, sku)

    expect(metrics.acos).toBe(null)
    expect(metrics.tacos).toBe(0)
    expect(metrics.ads_conversion).toBe(null)
  })

  test('CENÁRIO SEM CUSTO — SKU sem parâmetro cadastrado', async () => {
    const start = '2026-04-01'
    const end = '2026-04-01'

    mockSalesRepo.mockResolvedValue([
      { snapshot_date: '2026-04-01', units_sold: 10, gross_sales: 100, orders_count: 5, marketplace_id: marketplaceId, sku },
    ])

    mockAdsRepo.mockResolvedValue(noAds)
    mockCouponRepo.mockResolvedValue(noCoupons)
    mockFixedRepo.mockResolvedValue(noFixed)
    mockSkuCostRepo.mockResolvedValue([]) // sem regimes → has_missing_costs = true

    const metrics = await periodMetricsService.calculateMetrics(accountId, start, end, sku)

    expect(metrics.cogs_total).toBe(null)
    expect(metrics.revenue_net).toBe(null)
    expect(metrics.profit_period).toBe(null)
  })

  test('CENÁRIO MULTI-MÊS — período atravessando dois meses', async () => {
    // 25/03 a 05/04 = 12 dias
    mockSalesRepo.mockResolvedValue([])
    mockAdsRepo.mockResolvedValue(noAds)
    mockCouponRepo.mockResolvedValue(noCoupons)

    // Repositório já retorna o total proporcional calculado
    mockFixedRepo.mockResolvedValue({ total_fixed_period: 120 })

    const metrics = await periodMetricsService.calculateMetrics(accountId, '2026-03-25', '2026-04-05', sku)

    expect(metrics.fixed_costs_period).toBe(120)
    expect(metrics.days).toBe(12)
  })
})
