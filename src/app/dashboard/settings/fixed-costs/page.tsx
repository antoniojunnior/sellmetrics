import { saveFixedCosts } from '../actions'
import { createClient } from '@/lib/supabase/server'
import { FixedCostsMonthly } from '@/lib/supabase/types'
import { SectionBlock } from '@/components/ui/section-block'
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
    <div className="space-y-10">
      <header>
        <h1 className="text-2xl font-black text-text-primary tracking-tight">Custos Fixos Mensais</h1>
        <p className="text-sm text-text-secondary mt-1">
          Cadastre os custos operacionais mensais que serão rateados proporcionalmente no dashboard.
        </p>
      </header>

      {/* Formulário */}
      <SectionBlock title="Novo Lançamento Mensal" className="border-dashed">
        <form action={saveFixedCosts} className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-6 items-end">
          <input type="hidden" name="account_id" value="default-account" />
          
          <div className="space-y-1.5">
            <label className="text-[10px] font-black uppercase text-text-muted tracking-widest">Mês</label>
            <input name="year_month" type="month" className="w-full bg-surface rounded-xl border-border text-sm focus:ring-accent/20 focus:border-accent outline-none px-3 py-2" required />
          </div>
          <div className="space-y-1.5">
            <label className="text-[10px] font-black uppercase text-text-muted tracking-widest">Contador</label>
            <input name="accounting_fees" type="number" step="0.01" className="w-full bg-surface rounded-xl border-border text-sm focus:ring-accent/20 focus:border-accent outline-none px-3 py-2" required />
          </div>
          <div className="space-y-1.5">
            <label className="text-[10px] font-black uppercase text-text-muted tracking-widest">Aluguel</label>
            <input name="rent" type="number" step="0.01" className="w-full bg-surface rounded-xl border-border text-sm focus:ring-accent/20 focus:border-accent outline-none px-3 py-2" required />
          </div>
          <div className="space-y-1.5">
            <label className="text-[10px] font-black uppercase text-text-muted tracking-widest">Amz Prime</label>
            <input name="amazon_prime" type="number" step="0.01" className="w-full bg-surface rounded-xl border-border text-sm focus:ring-accent/20 focus:border-accent outline-none px-3 py-2" required />
          </div>
          <div className="space-y-1.5">
            <label className="text-[10px] font-black uppercase text-text-muted tracking-widest">Outros</label>
            <input name="other_fixed_costs" type="number" step="0.01" className="w-full bg-surface rounded-xl border-border text-sm focus:ring-accent/20 focus:border-accent outline-none px-3 py-2" required />
          </div>
          <div>
            <SubmitButton label="Salvar Mês" className="w-full h-[38px]" />
          </div>
        </form>
      </SectionBlock>

      {/* Grid de Meses */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {(costs as FixedCostsMonthly[] || []).map((month) => {
          const date = new Date(month.year_month + 'T12:00:00Z')
          const monthName = date.toLocaleString('pt-BR', { month: 'long', year: 'numeric' })
          
          return (
            <div key={month.id} className="bg-surface border border-border rounded-2xl p-5 shadow-card hover:shadow-card-hover transition-all group">
              <header className="flex justify-between items-start mb-4">
                <h3 className="text-lg font-bold text-text-primary capitalize">{monthName}</h3>
                <div className="text-right">
                  <p className="text-[10px] font-black uppercase tracking-widest text-text-muted">Total Fixo</p>
                  <p className="text-xl font-black text-accent">{formatMoney(month.total_fixed_month || 0)}</p>
                </div>
              </header>

              <div className="space-y-2 pt-4 border-t border-border text-xs text-text-secondary">
                <div className="flex justify-between"><span>Contador</span><span className="font-mono">{formatMoney(month.accounting_fees)}</span></div>
                <div className="flex justify-between"><span>Aluguel</span><span className="font-mono">{formatMoney(month.rent)}</span></div>
                <div className="flex justify-between"><span>Amz Prime</span><span className="font-mono">{formatMoney(month.amazon_prime)}</span></div>
                <div className="flex justify-between"><span>Outros</span><span className="font-mono">{formatMoney(month.other_fixed_costs)}</span></div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
