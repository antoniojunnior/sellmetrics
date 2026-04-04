import { saveSkuCost } from '../actions'
import { skuCostRepository } from '@/lib/supabase/repositories/sku-cost-repository'
import { SectionBlock } from '@/components/ui/section-block'
import { StatusBadge } from '@/components/ui/status-badge'
import { SubmitButton } from '../components/submit-button'

export default async function SkuCostsPage() {
  const accountId = 'default-account'
  const marketplaceId = 'ATVPDKIKX0DER'
  const today = new Date('2026-04-04').toISOString().split('T')[0]
  
  const skus = ['SKU-EXAMPLE-001']
  
  const skuData = await Promise.all(skus.map(async (sku) => {
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

      {/* Listagem de SKUs */}
      <div className="space-y-6">
        {skuData.map(({ sku, history }) => (
          <div key={sku} className="border border-border rounded-xl overflow-hidden bg-surface">
            <header className="px-4 py-3 border-b border-border bg-slate-50/50 flex justify-between items-center">
              <h3 className="text-sm font-bold text-text-primary">SKU: {sku}</h3>
              <span className="text-[10px] font-bold text-text-muted uppercase">{history.length} Registros</span>
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
                  {history.map((row: any) => {
                    const isCurrent = !row.valid_to || (row.valid_from <= today && row.valid_to > today)
                    const isFuture = row.valid_from > today
                    return (
                      <tr key={row.id} className="hover:bg-background/30 transition-colors">
                        <td className="px-4 py-3 font-mono font-bold text-text-primary">R$ {row.unit_cost.toFixed(2)}</td>
                        <td className="px-4 py-3 font-mono text-xs">R$ {row.prep_cost_unit.toFixed(2)}</td>
                        <td className="px-4 py-3 font-mono text-xs">{(row.tax_rate * 100).toFixed(1)}%</td>
                        <td className="px-4 py-3 font-mono text-xs">R$ {row.amazon_fee_unit.toFixed(2)}</td>
                        <td className="px-4 py-3">
                          {isFuture ? <StatusBadge status="pending" label="Futuro" /> : isCurrent ? <StatusBadge status="ok" label="Vigente" /> : <StatusBadge status="pending" label="Encerrado" />}
                        </td>
                        <td className="px-4 py-3 text-[11px] text-text-muted">
                          {row.valid_from} {row.valid_to ? `até ${row.valid_to}` : '— Atual'}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
