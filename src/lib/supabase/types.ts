export interface DailySalesSnapshot {
  id: string
  account_id: string
  marketplace_id: string
  sku: string
  snapshot_date: string
  orders_count: number
  units_sold: number
  gross_sales: number
  created_at: string
  updated_at: string
}

export interface DailyAdsSnapshot {
  id: string
  account_id: string
  marketplace_id: string
  snapshot_date: string
  ads_spend: number
  ads_sales: number
  ads_clicks: number
  ads_orders: number
  created_at: string
  updated_at: string
}

export interface SkuCostParameters {
  id: string
  account_id: string
  marketplace_id: string
  sku: string
  unit_cost: number
  prep_cost_unit: number
  tax_rate: number
  amazon_fee_unit: number
  valid_from: string
  valid_to: string | null
  created_at: string
  updated_at: string
}

export interface FixedCostsMonthly {
  id: string
  account_id: string
  year_month: string
  accounting_fees: number
  rent: number
  amazon_prime: number
  other_fixed_costs: number
  total_fixed_month: number
  created_at: string
  updated_at: string
}

export interface PeriodManualInputs {
  id: string
  account_id: string
  period_start_date: string
  period_end_date: string
  coupon_sales_value: number
  coupon_cost_value: number
  coupon_distributed: number
  coupon_redeemed: number
  manual_notes: string | null
  manual_adjustments: Record<string, unknown> | null
  created_at: string
  updated_at: string
}
