export const runtime = "edge";
import { saveFixedCosts } from '../actions'
import { createClient } from '@/lib/supabase/server'
import { FixedCostsMonthly } from '@/lib/supabase/types'
import { SectionBlock } from '@/components/ui/section-block'
import { SubmitButton } from '../components/submit-button'
import { redirect } from 'next/navigation'

export default async function FixedCostsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: costs } = await supabase
    .from('fixed_costs_monthly')
    .select('*')
    .eq('account_id', user.id)
    .order('year_month', { ascending: false })

  const formatMoney = (val: number) => `R$ ${val.toFixed(2)}`

  return (
    <div className="space-y-8">
      {/* Formulário */}
      <SectionBlock title="Novo Lançamento Mensal" className="border-dashed bg-background/30">
        <form action={saveFixedCosts} className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4 items-end">
          <input type="hidden" name="account_id" value={user.id} />
          
          <div className="space-y-1">
            <label className="text-[10px] font-black uppercase text-text-muted tracking-widest">Mês</label>
            <input name="year_month" type="month" className="w-full bg-surface rounded-lg border-border text-sm focus:ring-accent/20 focus:border-accent outline-none px-3 py-2" required />
          </div>
          <div className="space-y-1">
            <label className="text-[10px] font-black uppercase text-text-muted tracking-widest">Contador</label>
            <input name="accounting_fees" type="number" step="0.01" className="w-full bg-surface rounded-lg border-border text-sm focus:ring-accent/20 focus:border-accent outline-none px-3 py-2" required />
          </div>
          <div className="space-y-1">
            <label className="text-[10px] font-black uppercase text-text-muted tracking-widest">Aluguel</label>
            <input name="rent" type="number" step="0.01" className="w-full bg-surface rounded-lg border-border text-sm focus:ring-accent/20 focus:border-accent outline-none px-3 py-2" required />
          </div>
          <div className="space-y-1">
            <label className="text-[10px] font-black uppercase text-text-muted tracking-widest">Amz Prime</label>
            <input name="amazon_prime" type="number" step="0.01" className="w-full bg-surface rounded-lg border-border text-sm focus:ring-accent/20 focus:border-accent outline-none px-3 py-2" required />
          </div>
          <div className="space-y-1">
            <label className="text-[10px] font-black uppercase text-text-muted tracking-widest">Outros</label>
            <input name="other_fixed_costs" type="number" step="0.01" className="w-full bg-surface rounded-lg border-border text-sm focus:ring-accent/20 focus:border-accent outline-none px-3 py-2" required />
          </div>
          <div>
            <SubmitButton label="Salvar" className="w-full h-[38px]" />
          </div>
        </form>
      </SectionBlock>

      {/* Grid de Meses */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {(costs as FixedCostsMonthly[] || []).map((month) => {
          const date = new Date(month.year_month + 'T12:00:00Z')
          const monthName = date.toLocaleString('pt-BR', { month: 'long', year: 'numeric' })
          
          return (
            <div key={month.id} className="bg-surface border border-border rounded-xl p-4 shadow-sm hover:shadow-card transition-all group">
              <header className="flex justify-between items-start mb-3">
                <h3 className="text-sm font-bold text-text-primary capitalize">{monthName}</h3>
                <div className="text-right">
                  <p className="text-[9px] font-black uppercase tracking-widest text-text-muted">Total</p>
                  <p className="text-lg font-black text-accent">{formatMoney(month.total_fixed_month || 0)}</p>
                </div>
              </header>

              <div className="space-y-1.5 pt-3 border-t border-border text-[11px] text-text-secondary">
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
