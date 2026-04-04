import { saveManualInputs } from '../actions'
import { createClient } from '@/lib/supabase/server'
import { PeriodManualInputs } from '@/lib/supabase/types'
import { SectionBlock, DataTable } from '@/components/ui/LayoutComponents'
import { SubmitButton } from '../components/submit-button'

export default async function ManualInputsPage() {
  const supabase = await createClient()
  const { data: inputs } = await supabase
    .from('period_manual_inputs')
    .select('*')
    .eq('account_id', 'default-account')
    .order('period_start_date', { ascending: false })

  const formatMoney = (val: number) => `R$ ${val.toFixed(2)}`

  const columns = [
    { 
      header: 'Período', 
      key: 'period',
      className: 'font-bold text-slate-900 dark:text-slate-100',
      render: (_: any, row: any) => `${row.period_start_date} até ${row.period_end_date}`
    },
    { 
      header: 'Vendas com Cupom', 
      key: 'coupon_sales_value',
      render: formatMoney
    },
    { 
      header: 'Custo do Cupom', 
      key: 'coupon_cost_value',
      render: formatMoney
    },
    { 
      header: 'Resgates', 
      key: 'resgates',
      render: (_: any, row: any) => `${row.coupon_redeemed} / ${row.coupon_distributed}`
    },
    { 
      header: 'Taxa Conversão', 
      key: 'tx',
      render: (_: any, row: any) => {
        if (row.coupon_distributed === 0) return '—'
        const rate = (row.coupon_redeemed / row.coupon_distributed) * 100
        return <span className="text-indigo-600 font-bold">{rate.toFixed(1)}%</span>
      }
    },
    { 
      header: 'Notas', 
      key: 'manual_notes',
      className: 'max-w-[200px] truncate text-slate-400 italic',
      render: (val: string) => val || '—'
    }
  ]

  return (
    <div className="p-8 space-y-10">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-slate-50 tracking-tight">Inputs Manuais</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Lance dados que não vêm da API, como uso de cupons de desconto por período.
          </p>
        </div>
      </header>

      {/* Formulário de Novo Input */}
      <SectionBlock 
        title="Lançamento de Período" 
        className="bg-slate-50/50 dark:bg-slate-900/20 border-dashed"
      >
        <form action={saveManualInputs} className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-8 gap-6 items-end">
          <input type="hidden" name="account_id" value="default-account" />
          
          <div className="space-y-1.5 lg:col-span-2">
            <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Início</label>
            <input name="period_start_date" type="date" className="w-full bg-white dark:bg-slate-900 rounded-xl border-slate-200 dark:border-slate-800 text-sm focus:ring-indigo-500 focus:border-indigo-500" required />
          </div>
          <div className="space-y-1.5 lg:col-span-2">
            <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Fim</label>
            <input name="period_end_date" type="date" className="w-full bg-white dark:bg-slate-900 rounded-xl border-slate-200 dark:border-slate-800 text-sm focus:ring-indigo-500 focus:border-indigo-500" required />
          </div>
          <div className="space-y-1.5 lg:col-span-2">
            <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Venda Cupom (R$)</label>
            <input name="coupon_sales_value" type="number" step="0.01" className="w-full bg-white dark:bg-slate-900 rounded-xl border-slate-200 dark:border-slate-800 text-sm focus:ring-indigo-500 focus:border-indigo-500" required />
          </div>
          <div className="space-y-1.5 lg:col-span-2">
            <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Custo Cupom (R$)</label>
            <input name="coupon_cost_value" type="number" step="0.01" className="w-full bg-white dark:bg-slate-900 rounded-xl border-slate-200 dark:border-slate-800 text-sm focus:ring-indigo-500 focus:border-indigo-500" required />
          </div>

          <div className="space-y-1.5 lg:col-span-2">
            <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Distribuídos</label>
            <input name="coupon_distributed" type="number" className="w-full bg-white dark:bg-slate-900 rounded-xl border-slate-200 dark:border-slate-800 text-sm focus:ring-indigo-500 focus:border-indigo-500" required />
          </div>
          <div className="space-y-1.5 lg:col-span-2">
            <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Resgatados</label>
            <input name="coupon_redeemed" type="number" className="w-full bg-white dark:bg-slate-900 rounded-xl border-slate-200 dark:border-slate-800 text-sm focus:ring-indigo-500 focus:border-indigo-500" required />
          </div>
          
          <div className="space-y-1.5 lg:col-span-3">
            <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Notas Adicionais</label>
            <input name="manual_notes" type="text" placeholder="Ex: Promoção Dia das Mães" className="w-full bg-white dark:bg-slate-900 rounded-xl border-slate-200 dark:border-slate-800 text-sm focus:ring-indigo-500 focus:border-indigo-500" />
          </div>

          <div className="lg:col-span-1">
            <SubmitButton label="Gravar" className="w-full h-[38px] rounded-xl shadow-lg shadow-indigo-200 dark:shadow-none" />
          </div>
        </form>
      </SectionBlock>

      {/* Histórico de Lançamentos */}
      <SectionBlock title="Lançamentos Históricos">
        <DataTable 
          columns={columns} 
          data={inputs || []} 
          emptyMessage="Nenhum input manual cadastrado ainda."
        />
      </SectionBlock>
    </div>
  )
}
