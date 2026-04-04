import { Suspense } from 'react'
import { periodMetricsService, PeriodMetrics } from '@/lib/services/period-metrics-service'

// Helpers de formatação
const formatCurrency = (val: number | null) => 
  val !== null ? new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val) : '—'

const formatPercent = (val: number | null) => 
  val !== null ? `${(val * 100).toFixed(1)}%` : '—'

const formatNumber = (val: number | null) => 
  val !== null ? new Intl.NumberFormat('pt-BR').format(val) : '—'

const getSemanticColor = (val: number | null, invert = false) => {
  if (val === null || val === 0) return 'text-slate-500'
  const isPositive = val > 0
  if (invert) return isPositive ? 'text-red-600' : 'text-green-600'
  return isPositive ? 'text-green-600' : 'text-red-600'
}

interface PageProps {
  searchParams: Promise<{
    startDate?: string
    endDate?: string
    sku?: string
  }>
}

export default async function PeriodDashboardPage({ searchParams }: PageProps) {
  const params = await searchParams
  
  // Datas padrão: últimos 30 dias
  const today = new Date('2026-04-04') // Data do contexto
  const defaultStart = new Date(today)
  defaultStart.setDate(today.getDate() - 30)

  const startDate = params.startDate || defaultStart.toISOString().split('T')[0]
  const endDate = params.endDate || today.toISOString().split('T')[0]
  const sku = params.sku || ''

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-8 bg-slate-50 min-h-screen">
      {/* BLOCO 1 — Filtros e Cabeçalho */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 bg-white p-6 rounded-xl shadow-sm border border-slate-200">
        <form className="flex flex-wrap items-end gap-4">
          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Início</label>
            <input 
              type="date" 
              name="startDate" 
              defaultValue={startDate}
              className="block w-full rounded-lg border-slate-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm" 
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Fim</label>
            <input 
              type="date" 
              name="endDate" 
              defaultValue={endDate}
              className="block w-full rounded-lg border-slate-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm" 
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">SKU (Opcional)</label>
            <input 
              type="text" 
              name="sku" 
              defaultValue={sku}
              placeholder="Ex: SKU-123"
              className="block w-full rounded-lg border-slate-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm" 
            />
          </div>
          <button 
            type="submit"
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 transition-colors shadow-sm sm:text-sm"
          >
            Atualizar Dashboard
          </button>
        </form>

        <div className="text-right hidden md:block">
          <p className="text-sm text-slate-500">Período de Análise</p>
          <p className="text-lg font-bold text-slate-800">{startDate} até {endDate}</p>
        </div>
      </div>

      <Suspense fallback={<DashboardSkeleton />}>
        <MetricsContent accountId="default-account" startDate={startDate} endDate={endDate} sku={sku} />
      </Suspense>
    </div>
  )
}

async function MetricsContent({ accountId, startDate, endDate, sku }: { accountId: string, startDate: string, endDate: string, sku: string }) {
  const metrics = await periodMetricsService.calculateMetrics(accountId, startDate, endDate, sku || undefined)

  return (
    <div className="space-y-8">
      {/* BLOCO 2 — Cards de Destaque */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard title="Receita Bruta" value={formatCurrency(metrics.gross_sales)} />
        <KpiCard title="Receita Líquida" value={formatCurrency(metrics.revenue_net)} color={getSemanticColor(metrics.revenue_net)} />
        <KpiCard title="Lucro Período" value={formatCurrency(metrics.profit_period)} color={getSemanticColor(metrics.profit_period)} />
        <KpiCard title="Margem pós ADS" value={formatPercent(metrics.margin_post_ads)} color={getSemanticColor(metrics.margin_post_ads)} />
        <KpiCard title="ACOS" value={formatPercent(metrics.acos)} color={getSemanticColor(metrics.acos, true)} />
        <KpiCard title="TACOS" value={formatPercent(metrics.tacos)} color={getSemanticColor(metrics.tacos, true)} />
        <KpiCard title="Faturamento/Dia" value={formatCurrency(metrics.revenue_per_day)} />
        <KpiCard title="Lucro/Dia" value={formatCurrency(metrics.net_per_day)} color={getSemanticColor(metrics.net_per_day)} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* BLOCO 3 & 4 — Volume e ADS */}
        <div className="lg:col-span-2 space-y-8">
          <section className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
            <h3 className="text-sm font-bold text-slate-800 mb-4 uppercase tracking-wider">Volume & Pedidos</h3>
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center p-4 bg-slate-50 rounded-lg">
                <p className="text-xs text-slate-500 mb-1">Vendas (R$)</p>
                <p className="text-lg font-bold">{formatCurrency(metrics.gross_sales)}</p>
              </div>
              <div className="text-center p-4 bg-slate-50 rounded-lg">
                <p className="text-xs text-slate-500 mb-1">Unidades</p>
                <p className="text-lg font-bold">{formatNumber(metrics.units_sold)}</p>
              </div>
              <div className="text-center p-4 bg-slate-50 rounded-lg">
                <p className="text-xs text-slate-500 mb-1">Pedidos</p>
                <p className="text-lg font-bold">{formatNumber(metrics.orders_count)}</p>
              </div>
            </div>
          </section>

          <section className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
            <h3 className="text-sm font-bold text-slate-800 mb-4 uppercase tracking-wider">ADS & Performance</h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-6">
              <div><p className="text-xs text-slate-500">Investimento ADS</p><p className="font-bold">{formatCurrency(metrics.ads_spend)}</p></div>
              <div><p className="text-xs text-slate-500">Vendas ADS</p><p className="font-bold">{formatCurrency(metrics.ads_sales)}</p></div>
              <div><p className="text-xs text-slate-500">Cliques</p><p className="font-bold">{formatNumber(metrics.ads_clicks)}</p></div>
              <div><p className="text-xs text-slate-500">ACOS</p><p className={`font-bold ${getSemanticColor(metrics.acos, true)}`}>{formatPercent(metrics.acos)}</p></div>
              <div><p className="text-xs text-slate-500">TACOS</p><p className={`font-bold ${getSemanticColor(metrics.tacos, true)}`}>{formatPercent(metrics.tacos)}</p></div>
              <div><p className="text-xs text-slate-500">Conversão</p><p className="font-bold">{formatPercent(metrics.ads_conversion)}</p></div>
            </div>
          </section>

          {/* BLOCO 5 — Cupons */}
          <section className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
            <h3 className="text-sm font-bold text-slate-800 mb-4 uppercase tracking-wider">Cupons</h3>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
              <div className="col-span-2 sm:col-span-1"><p className="text-xs text-slate-500">Vendas</p><p className="font-bold">{formatCurrency(metrics.coupon_sales_value)}</p></div>
              <div className="col-span-2 sm:col-span-1"><p className="text-xs text-slate-500">Custo</p><p className="font-bold">{formatCurrency(metrics.coupon_cost_value)}</p></div>
              <div><p className="text-xs text-slate-500">Distribuídos</p><p className="font-bold">{formatNumber(metrics.coupon_distributed)}</p></div>
              <div><p className="text-xs text-slate-500">Resgatados</p><p className="font-bold">{formatNumber(metrics.coupon_redeemed)}</p></div>
              <div><p className="text-xs text-slate-500">Resgate %</p><p className="font-bold">{formatPercent(metrics.coupon_redemption_rate)}</p></div>
            </div>
          </section>
        </div>

        {/* BLOCO 6 — Waterfall de Custos & Margens */}
        <aside className="space-y-8">
          <section className="bg-slate-800 text-white p-6 rounded-xl shadow-lg">
            <h3 className="text-xs font-bold text-slate-400 mb-6 uppercase tracking-wider">Construção do Resultado</h3>
            <div className="space-y-3">
              <WaterfallItem label="Receita Bruta" value={metrics.gross_sales} isTotal />
              <WaterfallItem label="Investimento Vendido (COGS)" value={metrics.cogs_total} isExpense />
              <WaterfallItem label="Prep total" value={metrics.prep_total} isExpense />
              <WaterfallItem label="Imposto total" value={metrics.tax_total} isExpense />
              <WaterfallItem label="Taxa Amazon total" value={metrics.amazon_fee_total} isExpense />
              <WaterfallItem label="Custo Cupom" value={metrics.coupon_cost_value} isExpense />
              <div className="pt-2 border-t border-slate-700">
                <WaterfallItem label="Receita Líquida" value={metrics.revenue_net} isTotal />
              </div>
              <div className="flex justify-between text-sm py-1">
                <span className="text-slate-400">Margem de Contribuição</span>
                <span className="font-mono text-indigo-400 font-bold">{formatPercent(metrics.margin_contribution)}</span>
              </div>
              <WaterfallItem label="ADS" value={metrics.ads_spend} isExpense />
              <div className="flex justify-between text-sm py-1 border-b border-slate-700 pb-2">
                <span className="text-slate-400">Margem pós ADS</span>
                <span className={`font-mono font-bold ${getSemanticColor(metrics.margin_post_ads)}`}>{formatPercent(metrics.margin_post_ads)}</span>
              </div>
              <WaterfallItem label="Custos Fixos Período" value={metrics.fixed_costs_period} isExpense />
              <div className="pt-2 border-t-2 border-indigo-500">
                <WaterfallItem label="LUCRO DO PERÍODO" value={metrics.profit_period} isTotal highlight />
              </div>
              <div className="flex justify-between text-sm pt-4">
                <span className="text-slate-400">Markup</span>
                <span className="font-mono">{metrics.markup?.toFixed(2) || '—'}</span>
              </div>
            </div>
          </section>

          {/* BLOCO 7 — Rentabilidade */}
          <section className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
            <h3 className="text-sm font-bold text-slate-800 mb-4 uppercase tracking-wider">Rentabilidade</h3>
            <div className="space-y-4">
              <div>
                <p className="text-xs text-slate-500 mb-1">Lucro / Receita (%)</p>
                <p className={`text-xl font-bold ${getSemanticColor(metrics.profit_over_revenue)}`}>{formatPercent(metrics.profit_over_revenue)}</p>
              </div>
              <div>
                <p className="text-xs text-slate-500 mb-1">Lucro / Investimento (%)</p>
                <p className={`text-xl font-bold ${getSemanticColor(metrics.profit_over_investment)}`}>{formatPercent(metrics.profit_over_investment)}</p>
              </div>
            </div>
          </section>
        </aside>
      </div>
    </div>
  )
}

function KpiCard({ title, value, color = 'text-slate-900' }: { title: string, value: string, color?: string }) {
  return (
    <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-200">
      <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">{title}</p>
      <p className={`text-xl font-black ${color} truncate`}>{value}</p>
    </div>
  )
}

function WaterfallItem({ label, value, isExpense = false, isTotal = false, highlight = false }: { label: string, value: number | null, isExpense?: boolean, isTotal?: boolean, highlight?: boolean }) {
  const displayValue = formatCurrency(value)
  const prefix = isExpense && value !== 0 && value !== null ? '(−) ' : ''
  
  return (
    <div className={`flex justify-between items-center text-sm ${isTotal ? 'font-bold' : 'text-slate-300'} ${highlight ? 'text-lg text-indigo-400' : ''}`}>
      <span className={isTotal ? 'text-slate-100' : 'text-slate-400'}>{label}</span>
      <span className="font-mono">{prefix}{displayValue}</span>
    </div>
  )
}

function DashboardSkeleton() {
  return (
    <div className="animate-pulse space-y-8">
      <div className="grid grid-cols-4 gap-4">
        {[...Array(8)].map((_, i) => <div key={i} className="h-24 bg-slate-200 rounded-xl" />)}
      </div>
      <div className="grid grid-cols-3 gap-8">
        <div className="col-span-2 h-96 bg-slate-200 rounded-xl" />
        <div className="h-96 bg-slate-200 rounded-xl" />
      </div>
    </div>
  )
}
