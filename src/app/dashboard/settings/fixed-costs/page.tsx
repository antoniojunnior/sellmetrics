import { saveFixedCosts } from '../actions'
import { createClient } from '@/lib/supabase/server'
import { FixedCostsMonthly } from '@/lib/supabase/types'
import { SectionBlock } from '@/components/ui/LayoutComponents'
import { SubmitButton } from '../components/submit-button'

export default async function FixedCostsPage() {
  const supabase = await createClient()
  const { data: costs } = await supabase
    .from('fixed_costs_monthly')
    .select('*')
    .eq('account_id', 'default-account')
    .order('year_month', { ascending: false })

  const formatMoney = (val: number) => `R$ ${val.toFixed(2)}`

  return (
    <div className="p-8 space-y-10">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-slate-50 tracking-tight">Custos Fixos Mensais</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Cadastre os custos operacionais mensais que serão rateados proporcionalmente no dashboard.
          </p>
        </div>
      </header>

      {/* Formulário de Novo Lançamento */}
      <SectionBlock 
        title="Novo Lançamento Mensal" 
        className="bg-slate-50/50 dark:bg-slate-900/20 border-dashed"
      >
        <form action={saveFixedCosts} className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-6 items-end">
          <input type="hidden" name="account_id" value="default-account" />
          
          <div className="space-y-1.5">
            <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Mês de Referência</label>
            <input name="year_month" type="month" className="w-full bg-white dark:bg-slate-900 rounded-xl border-slate-200 dark:border-slate-800 text-sm focus:ring-indigo-500 focus:border-indigo-500" required />
          </div>
          <div className="space-y-1.5">
            <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Contador</label>
            <input name="accounting_fees" type="number" step="0.01" className="w-full bg-white dark:bg-slate-900 rounded-xl border-slate-200 dark:border-slate-800 text-sm focus:ring-indigo-500 focus:border-indigo-500" required />
          </div>
          <div className="space-y-1.5">
            <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Aluguel</label>
            <input name="rent" type="number" step="0.01" className="w-full bg-white dark:bg-slate-900 rounded-xl border-slate-200 dark:border-slate-800 text-sm focus:ring-indigo-500 focus:border-indigo-500" required />
          </div>
          <div className="space-y-1.5">
            <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Amazon Prime</label>
            <input name="amazon_prime" type="number" step="0.01" className="w-full bg-white dark:bg-slate-900 rounded-xl border-slate-200 dark:border-slate-800 text-sm focus:ring-indigo-500 focus:border-indigo-500" required />
          </div>
          <div className="space-y-1.5">
            <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Outros Custos</label>
            <input name="other_fixed_costs" type="number" step="0.01" className="w-full bg-white dark:bg-slate-900 rounded-xl border-slate-200 dark:border-slate-800 text-sm focus:ring-indigo-500 focus:border-indigo-500" required />
          </div>
          <div className="md:col-span-full lg:col-span-1">
            <SubmitButton label="Salvar Mês" className="w-full h-[38px] rounded-xl shadow-lg shadow-indigo-200 dark:shadow-none" />
          </div>
        </form>
      </SectionBlock>

      {/* Histórico de Meses */}
      <SectionBlock title="Histórico de Rateio">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {(costs as FixedCostsMonthly[] || []).map((month) => {
            const date = new Date(month.year_month + 'T12:00:00Z')
            const monthName = date.toLocaleString('pt-BR', { month: 'long', year: 'numeric' })
            
            return (
              <div key={month.id} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
                {/* Decoration */}
                <div className="absolute top-0 right-0 w-16 h-16 bg-indigo-50 dark:bg-indigo-900/20 rounded-bl-full -z-0 opacity-50 group-hover:scale-110 transition-transform" />
                
                <div className="relative z-10">
                  <header className="flex justify-between items-start mb-4">
                    <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100 capitalize">{monthName}</h3>
                    <div className="text-right">
                      <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Total Fixo</p>
                      <p className="text-xl font-black text-indigo-600 dark:text-indigo-400">{formatMoney(month.total_fixed_month || 0)}</p>
                    </div>
                  </header>

                  <div className="space-y-2 pt-4 border-t border-slate-100 dark:border-slate-800 text-sm">
                    <div className="flex justify-between">
                      <span className="text-slate-500 dark:text-slate-400">Contador</span>
                      <span className="font-mono text-slate-700 dark:text-slate-300">{formatMoney(month.accounting_fees)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500 dark:text-slate-400">Aluguel</span>
                      <span className="font-mono text-slate-700 dark:text-slate-300">{formatMoney(month.rent)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500 dark:text-slate-400">Amz Prime</span>
                      <span className="font-mono text-slate-700 dark:text-slate-300">{formatMoney(month.amazon_prime)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500 dark:text-slate-400">Outros</span>
                      <span className="font-mono text-slate-700 dark:text-slate-300">{formatMoney(month.other_fixed_costs)}</span>
                    </div>
                  </div>
                </div>
              </div>
            )
          })}

          {costs?.length === 0 && (
            <div className="col-span-full py-12 text-center text-slate-400 italic">
              Nenhum custo fixo cadastrado ainda.
            </div>
          )}
        </div>
      </SectionBlock>
    </div>
  )
}
