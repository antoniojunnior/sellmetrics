import { saveSkuCost } from '../actions'
import { skuCostRepository } from '@/lib/supabase/repositories/sku-cost-repository'
import { SectionBlock, StatusBadge, DataTable } from '@/components/ui/LayoutComponents'
import { SubmitButton } from '../components/submit-button'

export default async function SkuCostsPage() {
  const accountId = 'default-account'
  const marketplaceId = 'ATVPDKIKX0DER'
  const today = new Date('2026-04-04').toISOString().split('T')[0]
  
  // Em produção, buscaríamos a lista de SKUs únicos da conta
  const skus = ['SKU-EXAMPLE-001']
  
  // Busca o histórico completo para cada SKU para mostrar vigência e histórico
  const skuData = await Promise.all(skus.map(async (sku) => {
    const history = await skuCostRepository.getCostHistory(accountId, sku)
    return { sku, history }
  }))

  const columns = [
    { 
      header: 'SKU', 
      key: 'sku',
      className: 'font-bold text-slate-900 dark:text-slate-100'
    },
    { 
      header: 'COGS', 
      key: 'unit_cost',
      render: (val: number) => `R$ ${val.toFixed(2)}`
    },
    { 
      header: 'Prep', 
      key: 'prep_cost_unit',
      render: (val: number) => `R$ ${val.toFixed(2)}`
    },
    { 
      header: 'Taxa', 
      key: 'tax_rate',
      render: (val: number) => `${(val * 100).toFixed(1)}%`
    },
    { 
      header: 'Amazon Fee', 
      key: 'amazon_fee_unit',
      render: (val: number) => `R$ ${val.toFixed(2)}`
    },
    { 
      header: 'Status', 
      key: 'status',
      render: (_: any, row: any) => {
        const isCurrent = !row.valid_to || (row.valid_from <= today && row.valid_to > today)
        const isFuture = row.valid_from > today
        
        if (isFuture) return <StatusBadge status="pending" label="Futuro" />
        if (isCurrent) return <StatusBadge status="ok" label="Vigente" />
        return <StatusBadge status="pending" label="Encerrado" />
      }
    },
    { 
      header: 'Vigência', 
      key: 'valid_from',
      render: (_: any, row: any) => (
        <span className="text-xs text-slate-500">
          {row.valid_from} {row.valid_to ? `até ${row.valid_to}` : '— Atual'}
        </span>
      )
    }
  ]

  return (
    <div className="p-8 space-y-10">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-slate-50 tracking-tight">Parâmetros de Custo</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Gestão de COGS, impostos e taxas por SKU com histórico SCD2.</p>
        </div>
      </header>

      {/* Formulário Inline Redenhado */}
      <SectionBlock 
        title="Novo Regime de Custo" 
        subtitle="As alterações fecham automaticamente o regime anterior e iniciam a nova vigência."
        className="bg-slate-50/50 dark:bg-slate-900/20 border-dashed"
      >
        <form action={saveSkuCost} className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-7 gap-6 items-end">
          <input type="hidden" name="account_id" value={accountId} />
          <input type="hidden" name="marketplace_id" value={marketplaceId} />
          
          <div className="space-y-1.5">
            <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">SKU</label>
            <input name="sku" type="text" className="w-full bg-white dark:bg-slate-900 rounded-xl border-slate-200 dark:border-slate-800 text-sm focus:ring-indigo-500 focus:border-indigo-500" placeholder="EX: AMZ-001" required />
          </div>
          <div className="space-y-1.5">
            <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">COGS (Unit)</label>
            <input name="unit_cost" type="number" step="0.0001" className="w-full bg-white dark:bg-slate-900 rounded-xl border-slate-200 dark:border-slate-800 text-sm focus:ring-indigo-500 focus:border-indigo-500" required />
          </div>
          <div className="space-y-1.5">
            <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Prep Center</label>
            <input name="prep_cost_unit" type="number" step="0.0001" className="w-full bg-white dark:bg-slate-900 rounded-xl border-slate-200 dark:border-slate-800 text-sm focus:ring-indigo-500 focus:border-indigo-500" required />
          </div>
          <div className="space-y-1.5">
            <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Imposto (%)</label>
            <input name="tax_rate" type="number" step="0.01" className="w-full bg-white dark:bg-slate-900 rounded-xl border-slate-200 dark:border-slate-800 text-sm focus:ring-indigo-500 focus:border-indigo-500" required />
          </div>
          <div className="space-y-1.5">
            <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Taxa Amazon</label>
            <input name="amazon_fee_unit" type="number" step="0.0001" className="w-full bg-white dark:bg-slate-900 rounded-xl border-slate-200 dark:border-slate-800 text-sm focus:ring-indigo-500 focus:border-indigo-500" required />
          </div>
          <div className="space-y-1.5">
            <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Início</label>
            <input name="valid_from" type="date" className="w-full bg-white dark:bg-slate-900 rounded-xl border-slate-200 dark:border-slate-800 text-sm focus:ring-indigo-500 focus:border-indigo-500" required />
          </div>
          <div>
            <SubmitButton label="Salvar Regime" className="w-full h-[38px] rounded-xl shadow-lg shadow-indigo-200 dark:shadow-none" />
          </div>
        </form>
      </SectionBlock>

      {/* Listagem de SKUs e Histórico */}
      <div className="space-y-6">
        {skuData.map(({ sku, history }) => (
          <SectionBlock 
            key={sku} 
            title={`SKU: ${sku}`} 
            rightAction={<span className="text-[10px] font-bold text-slate-400 uppercase">{history.length} Registros no Histórico</span>}
          >
            <DataTable 
              columns={columns} 
              data={history} 
              emptyMessage="Nenhum parâmetro de custo cadastrado para este SKU."
            />
          </SectionBlock>
        ))}
      </div>
    </div>
  )
}
