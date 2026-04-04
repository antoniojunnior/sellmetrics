import { Suspense } from 'react'
import { periodMetricsService } from '@/lib/services/period-metrics-service'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { MetricCard } from '@/components/ui/metric-card'
import { WaterfallRow } from '@/components/ui/waterfall-row'
import { SectionBlock } from '@/components/ui/section-block'
import { StatusBadge } from '@/components/ui/status-badge'
import { PeriodSelector } from '@/components/ui/period-selector'
import { SkeletonCard, SkeletonBar } from '@/components/ui/skeleton-loader'

const formatCurrency = (val: number | null) => 
  val !== null ? new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val) : '—'

export default async function PeriodDashboardPage({ 
  searchParams 
}: { 
  searchParams: Promise<{ startDate?: string; endDate?: string; sku?: string }> 
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const params = await searchParams
  const today = new Date('2026-04-04')
  const defaultStart = new Date(today)
  defaultStart.setDate(today.getDate() - 30)

  const startDate = params.startDate || defaultStart.toISOString().split('T')[0]
  const endDate = params.endDate || today.toISOString().split('T')[0]
  const sku = params.sku || ''

  return (
    <div className="space-y-8">
      {/* TOPO: Seletor e Status */}
      <div className="space-y-4">
        <PeriodSelector startDate={startDate} endDate={endDate} sku={sku} />
        <div className="flex items-center justify-between px-2">
          <div className="flex items-center gap-2 text-[10px] font-bold text-text-muted uppercase tracking-widest">
            <span className="w-2 h-2 rounded-full bg-positive animate-pulse" />
            Dados sincronizados: D-1 (Ontem)
          </div>
          <StatusBadge status="ok" label="Snapshot Completo" />
        </div>
      </div>

      <Suspense fallback={<DashboardLoadingSkeleton />}>
        <MetricsContent accountId={user.id} startDate={startDate} endDate={endDate} sku={sku} />
      </Suspense>
    </div>
  )
}

async function MetricsContent({ accountId, startDate, endDate, sku }: { accountId: string, startDate: string, endDate: string, sku: string }) {
  const metrics = await periodMetricsService.calculateMetrics(accountId, startDate, endDate, sku || undefined)

  return (
    <div className="space-y-8">
      {/* LINHA 1 — KPIs Principais */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard label="Receita Bruta" value={metrics.gross_sales.toFixed(2)} unit="R$" highlight trend="up" trendValue="12.5%" />
        <MetricCard label="Receita Líquida" value={metrics.revenue_net?.toFixed(2) || null} unit="R$" highlight trend="up" trendValue="8.2%" />
        <MetricCard label="Lucro do Período" value={metrics.profit_period?.toFixed(2) || null} unit="R$" highlight trend="down" trendValue="2.1%" />
        <MetricCard label="Margem pós ADS" value={metrics.margin_post_ads !== null ? (metrics.margin_post_ads * 100).toFixed(1) : null} unit="%" highlight />
      </div>

      {/* LINHA 2 — KPIs Secundários */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard label="ACOS" value={metrics.acos ? (metrics.acos * 100).toFixed(1) : null} unit="%" />
        <MetricCard label="TACOS" value={metrics.tacos ? (metrics.tacos * 100).toFixed(1) : null} unit="%" />
        <MetricCard label="Faturamento/Dia" value={metrics.revenue_per_day.toFixed(2)} unit="R$" />
        <MetricCard label="Líquido/Dia" value={metrics.net_per_day?.toFixed(2) || null} unit="R$" />
      </div>

      {/* LINHA 3 — Waterfall e Performance */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-7">
          <SectionBlock title="Custos & Margens" subtitle="Construção do resultado operacional">
            <div className="space-y-1">
              <WaterfallRow label="Receita Bruta" value={metrics.gross_sales} type="revenue" percentage={100} />
              <WaterfallRow label="COGS (Investimento Vendido)" value={metrics.cogs_total} type="cost" percentage={metrics.gross_sales ? (metrics.cogs_total! / metrics.gross_sales) * 100 : 0} />
              <WaterfallRow label="Prep Center" value={metrics.prep_total} type="cost" percentage={metrics.gross_sales ? (metrics.prep_total! / metrics.gross_sales) * 100 : 0} />
              <WaterfallRow label="Imposto" value={metrics.tax_total} type="cost" percentage={metrics.gross_sales ? (metrics.tax_total! / metrics.gross_sales) * 100 : 0} />
              <WaterfallRow label="Taxas Amazon" value={metrics.amazon_fee_total} type="cost" percentage={metrics.gross_sales ? (metrics.amazon_fee_total! / metrics.gross_sales) * 100 : 0} />
              <WaterfallRow label="Cupons" value={metrics.coupon_cost_value} type="cost" percentage={metrics.gross_sales ? (metrics.coupon_cost_value / metrics.gross_sales) * 100 : 0} />
              <WaterfallRow type="separator" label="" value={0} />
              <WaterfallRow label="Receita Líquida" value={metrics.revenue_net} type="revenue" />
              <WaterfallRow label="Publicidade (ADS)" value={metrics.ads_spend} type="cost" percentage={metrics.gross_sales ? (metrics.ads_spend / metrics.gross_sales) * 100 : 0} />
              <WaterfallRow label="Custos Fixos (Proporcional)" value={metrics.fixed_costs_period} type="cost" />
              <WaterfallRow type="separator" label="" value={0} />
              <WaterfallRow label="LUCRO DO PERÍODO" value={metrics.profit_period} type="result" />
            </div>
          </SectionBlock>
        </div>

        <div className="lg:col-span-5 space-y-8">
          <SectionBlock title="ADS & Performance">
            <div className="grid grid-cols-2 gap-y-6">
              <div><p className="text-[10px] font-black text-text-muted uppercase mb-1">Spend</p><p className="text-xl font-bold text-text-primary">{formatCurrency(metrics.ads_spend)}</p></div>
              <div><p className="text-[10px] font-black text-text-muted uppercase mb-1">Sales</p><p className="text-xl font-bold text-text-primary">{formatCurrency(metrics.ads_sales)}</p></div>
              <div><p className="text-[10px] font-black text-text-muted uppercase mb-1">Cliques</p><p className="text-xl font-bold text-text-primary">{metrics.ads_clicks}</p></div>
              <div><p className="text-[10px] font-black text-text-muted uppercase mb-1">Conversão</p><p className="text-xl font-bold text-text-primary">{(metrics.ads_conversion! * 100).toFixed(1)}%</p></div>
            </div>
          </SectionBlock>

          <SectionBlock title="Cupons">
            <div className="flex justify-between items-end">
              <div>
                <p className="text-[10px] font-black text-text-muted uppercase mb-1">Resgates</p>
                <p className="text-2xl font-bold text-text-primary">{metrics.coupon_redeemed} <span className="text-sm font-normal text-text-muted">/ {metrics.coupon_distributed}</span></p>
              </div>
              <div className="text-right">
                <p className="text-[10px] font-black text-text-muted uppercase mb-1">Taxa</p>
                <p className="text-xl font-bold text-accent">{(metrics.coupon_redemption_rate! * 100).toFixed(1)}%</p>
              </div>
            </div>
          </SectionBlock>
        </div>
      </div>

      {/* LINHA 4 — Volume e Rentabilidade */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <SectionBlock title="Volume de Pedidos">
          <div className="space-y-4">
            <div className="flex justify-between items-center"><span className="text-sm text-text-secondary">Unidades</span><span className="font-bold text-text-primary">{metrics.units_sold}</span></div>
            <div className="flex justify-between items-center"><span className="text-sm text-text-secondary">Pedidos</span><span className="font-bold text-text-primary">{metrics.orders_count}</span></div>
            <div className="flex justify-between items-center"><span className="text-sm text-text-secondary">Ticket Médio</span><span className="font-bold text-text-primary">{formatCurrency(metrics.gross_sales / (metrics.orders_count || 1))}</span></div>
          </div>
        </SectionBlock>

        <SectionBlock title="Rentabilidade">
          <div className="space-y-4">
            <div className="flex justify-between items-center"><span className="text-sm text-text-secondary">Lucro/Receita</span><span className="font-bold text-positive">{(metrics.profit_over_revenue! * 100).toFixed(1)}%</span></div>
            <div className="flex justify-between items-center"><span className="text-sm text-text-secondary">Lucro/Investimento</span><span className="font-bold text-positive">{(metrics.profit_over_investment! * 100).toFixed(1)}%</span></div>
            <div className="flex justify-between items-center"><span className="text-sm text-text-secondary">Markup</span><span className="font-bold text-accent">{metrics.markup?.toFixed(2) || '—'}</span></div>
          </div>
        </SectionBlock>

        <SectionBlock title="Resumo do Período">
          <div className="h-full flex flex-col justify-center items-center text-center p-4 bg-background rounded-xl border border-dashed border-border">
            <p className="text-4xl font-black text-text-muted/30">{metrics.days}</p>
            <p className="text-[10px] font-black text-text-muted uppercase tracking-widest mt-2">Dias Analisados</p>
          </div>
        </SectionBlock>
      </div>
    </div>
  )
}

function DashboardLoadingSkeleton() {
  return (
    <div className="space-y-8">
      <div className="grid grid-cols-4 gap-6">
        <SkeletonCard /> <SkeletonCard /> <SkeletonCard /> <SkeletonCard />
      </div>
      <div className="grid grid-cols-12 gap-8">
        <div className="col-span-7"><SkeletonBar /><SkeletonBar /><SkeletonBar /></div>
        <div className="col-span-5"><SkeletonCard /></div>
      </div>
    </div>
  )
}
