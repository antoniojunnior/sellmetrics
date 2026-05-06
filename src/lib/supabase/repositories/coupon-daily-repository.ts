import { createClient } from '../server'
import { CouponDaily } from '../types'

export interface CouponPeriodSum {
  coupon_sales_value: number
  coupon_cost_value: number
  coupon_distributed: number
  coupon_redeemed: number
}

export const couponDailyRepository = {
  async upsertCouponRange(
    accountId: string,
    startDate: string,
    endDate: string,
    values: {
      coupon_sales_value: number
      coupon_cost_value: number
      coupon_distributed: number
      coupon_redeemed: number
    }
  ): Promise<void> {
    const parseUTC = (s: string) => {
      const [y, m, d] = s.split('-').map(Number)
      return new Date(Date.UTC(y, m - 1, d))
    }

    const start = parseUTC(startDate)
    const end = parseUTC(endDate)
    const totalDays = Math.round((end.getTime() - start.getTime()) / 86400000) + 1

    const rows: Omit<CouponDaily, 'id' | 'created_at' | 'updated_at'>[] = []

    for (let i = 0; i < totalDays; i++) {
      const d = new Date(start)
      d.setUTCDate(d.getUTCDate() + i)
      const dateStr = d.toISOString().split('T')[0]

      rows.push({
        account_id: accountId,
        sku: '',
        snapshot_date: dateStr,
        coupon_sales_value: Math.round((values.coupon_sales_value / totalDays) * 100) / 100,
        coupon_cost_value: Math.round((values.coupon_cost_value / totalDays) * 100) / 100,
        coupon_distributed: Math.round(values.coupon_distributed / totalDays),
        coupon_redeemed: Math.round(values.coupon_redeemed / totalDays),
      })
    }

    const supabase = await createClient()
    const { error } = await supabase
      .from('coupon_daily')
      .upsert(rows, { onConflict: 'account_id,sku,snapshot_date' })

    if (error) throw new Error(`Failed to upsert coupon_daily: ${error.message}`)
  },

  async getCouponSumByPeriod(
    accountId: string,
    startDate: string,
    endDate: string
  ): Promise<CouponPeriodSum> {
    const supabase = await createClient()
    const { data, error } = await supabase
      .from('coupon_daily')
      .select('coupon_sales_value, coupon_cost_value, coupon_distributed, coupon_redeemed')
      .eq('account_id', accountId)
      .gte('snapshot_date', startDate)
      .lte('snapshot_date', endDate)

    if (error) throw new Error(`Failed to fetch coupon_daily: ${error.message}`)

    const rows = (data as Pick<CouponDaily, 'coupon_sales_value' | 'coupon_cost_value' | 'coupon_distributed' | 'coupon_redeemed'>[] || [])

    return {
      coupon_sales_value: rows.reduce((acc, r) => acc + Number(r.coupon_sales_value), 0),
      coupon_cost_value: rows.reduce((acc, r) => acc + Number(r.coupon_cost_value), 0),
      coupon_distributed: rows.reduce((acc, r) => acc + r.coupon_distributed, 0),
      coupon_redeemed: rows.reduce((acc, r) => acc + r.coupon_redeemed, 0),
    }
  },
}
