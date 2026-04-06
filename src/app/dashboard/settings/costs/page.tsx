export const runtime = "edge";
import { saveSkuCost } from '../actions'
import { skuCostRepository } from '@/lib/supabase/repositories/sku-cost-repository'
import { SkuCostParameters } from '@/lib/supabase/types'
import { SectionBlock } from '@/components/ui/section-block'
import { StatusBadge } from '@/components/ui/status-badge'
import { SubmitButton } from '../components/submit-button'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export default async function SkuCostsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const accountId = user.id
  const marketplaceId = 'ATVPDKIKX0DER' // Pode ser expandido futuramente
  const today = new Date('2026-04-04').toISOString().split('T')[0]
  
  // 1. Busca todos os SKUs únicos presentes nos pedidos (snapshots) para esta conta
  const { data: snapshotSkus } = await supabase
    .from('daily_sales_snapshot')
    .select('sku')
    .eq('account_id', accountId)

  // Extrai SKUs únicos
  const uniqueSkus = Array.from(new Set((snapshotSkus || []).map(s => s.sku)))
  
  // Se não houver nenhum SKU em snapshots, podemos mostrar um exemplo ou lista vazia
  if (uniqueSkus.length === 0) {
    uniqueSkus.push('SKU-EXEMPLO-001')
  }
  
  // 2. Busca o histórico completo para cada SKU identificado
  const skuData = await Promise.all(uniqueSkus.map(async (sku) => {
    const history = await skuCostRepository.getCostHistory(accountId, sku)
    return { sku, history }
  }))

  return (
    <div className="space-y-8">
      {/* Formulário Inline */}
      <SectionBlock 
        title="Novo Regime de Custo" 
        subtitle="As alterações fecham automaticamente o regime anterior e iniciam a nova vigência."
        className="border-dashed bg-background/30"
      >
        <form action={saveSkuCost} className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-7 gap-4 items-end">
          <input type="hidden" name="account_id" value={accountId} />
          <input type="hidden" name="marketplace_id" value={marketplaceId} />
          
          <div className="space-y-1">
            <label className="text-[10px] font-black uppercase text-text-muted tracking-widest">SKU</label>
            <input name="sku" type="text" className="w-full bg-surface rounded-lg border-border text-sm focus:ring-accent/20 focus:border-accent outline-none px-3 py-2" placeholder="EX: AMZ-001" required />
          </div>
          <div className="space-y-1">
            <label className="text-[10px] font-black uppercase text-text-muted tracking-widest">COGS (Unit)</label>
            <input name="unit_cost" type="number" step="0.0001" className="w-full bg-surface rounded-lg border-border text-sm focus:ring-accent/20 focus:border-accent outline-none px-3 py-2" required />
          </div>
          <div className="space-y-1">
            <label className="text-[10px] font-black uppercase text-text-muted tracking-widest">Prep Center</label>
            <input name="prep_cost_unit" type="number" step="0.0001" className="w-full bg-surface rounded-lg border-border text-sm focus:ring-accent/20 focus:border-accent outline-none px-3 py-2" required />
          </div>
          <div className="space-y-1">
            <label className="text-[10px] font-black uppercase text-text-muted tracking-widest">Imposto (%)</label>
            <input name="tax_rate" type="number" step="0.01" className="w-full bg-surface rounded-lg border-border text-sm focus:ring-accent/20 focus:border-accent outline-none px-3 py-2" required />
          </div>
          <div className="space-y-1">
            <label className="text-[10px] font-black uppercase text-text-muted tracking-widest">Taxa Amazon</label>
            <input name="amazon_fee_unit" type="number" step="0.0001" className="w-full bg-surface rounded-lg border-border text-sm focus:ring-accent/20 focus:border-accent outline-none px-3 py-2" required />
          </div>
          <div className="space-y-1">
            <label className="text-[10px] font-black uppercase text-text-muted tracking-widest">Início</label>
            <input name="valid_from" type="date" className="w-full bg-surface rounded-lg border-border text-sm focus:ring-accent/20 focus:border-accent outline-none px-3 py-2" required />
          </div>
          <div>
            <SubmitButton label="Salvar" className="w-full h-[38px]" />
          </div>
        </form>
      </SectionBlock>

      {/* Listagem de SKUs Identificados */}
      <div className="space-y-6">
        <h2 className="text-sm font-bold text-text-secondary uppercase tracking-widest px-2">Produtos Identificados ({skuData.length})</h2>
        {skuData.map(({ sku, history }) => (
          <div key={sku} className="border border-border rounded-xl overflow-hidden bg-surface shadow-sm">
            <header className="px-4 py-3 border-b border-border bg-slate-50/50 flex justify-between items-center">
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 rounded-full bg-accent animate-pulse" />
                <h3 className="text-sm font-bold text-text-primary">SKU: {sku}</h3>
              </div>
              <span className="text-[10px] font-bold text-text-muted uppercase">{history.length} Regimes Históricos</span>
            </header>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-border">
                <thead className="bg-slate-50/30">
                  <tr className="text-[10px] font-black text-text-muted uppercase tracking-widest">
                    <th className="px-4 py-3 text-left">COGS</th>
                    <th className="px-4 py-3 text-left">Prep</th>
                    <th className="px-4 py-3 text-left">Taxa</th>
                    <th className="px-4 py-3 text-left">Amazon</th>
                    <th className="px-4 py-3 text-left">Status</th>
                    <th className="px-4 py-3 text-left">Vigência</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/50 text-sm text-text-secondary">
                  {history.length > 0 ? history.map((row: SkuCostParameters) => {
                    const isCurrent = !row.valid_to || (row.valid_from <= today && (row.valid_to > today || row.valid_to === null))
                    const isFuture = row.valid_from > today
                    return (
                      <tr key={row.id} className="hover:bg-background/30 transition-colors">
                        <td className="px-4 py-3 font-mono font-bold text-text-primary">R$ {Number(row.unit_cost).toFixed(2)}</td>
                        <td className="px-4 py-3 font-mono text-xs">R$ {Number(row.prep_cost_unit).toFixed(2)}</td>
                        <td className="px-4 py-3 font-mono text-xs">{(Number(row.tax_rate) * 100).toFixed(1)}%</td>
                        <td className="px-4 py-3 font-mono text-xs">R$ {Number(row.amazon_fee_unit).toFixed(2)}</td>
                        <td className="px-4 py-3">
                          {isFuture ? <StatusBadge status="pending" label="Futuro" /> : isCurrent ? <StatusBadge status="ok" label="Vigente" /> : <StatusBadge status="pending" label="Encerrado" />}
                        </td>
                        <td className="px-4 py-3 text-[11px] text-text-muted">
                          {row.valid_from} {row.valid_to ? `até ${row.valid_to}` : '— Atual'}
                        </td>
                      </tr>
                    )
                  }) : (
                    <tr>
                      <td colSpan={6} className="px-4 py-10 text-center text-xs text-text-muted italic bg-slate-50/10">
                        Nenhum parâmetro de custo configurado. Use o formulário acima para este SKU.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
