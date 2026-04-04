import { saveFixedCosts } from '../actions'
import { createClient } from '@/lib/supabase/server'
import { FixedCostsMonthly } from '@/lib/supabase/types'

export default async function FixedCostsPage() {
  const supabase = await createClient()
  const { data: costs } = await supabase
    .from('fixed_costs_monthly')
    .select('*')
    .eq('account_id', 'default-account')
    .order('year_month', { ascending: false })

  return (
    <div className="p-6 space-y-8">
      <header>
        <h1 className="text-xl font-bold text-slate-800">Custos Fixos Mensais</h1>
        <p className="text-sm text-slate-500">Cadastre custos que não dependem do volume de vendas.</p>
      </header>

      <section className="bg-slate-50 p-6 rounded-lg border border-slate-200">
        <h2 className="text-sm font-bold uppercase mb-4 text-slate-600">Novo Lançamento Mensal</h2>
        <form action={saveFixedCosts} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 items-end">
          <input type="hidden" name="account_id" value="default-account" />
          
          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-500">Mês</label>
            <input name="year_month" type="month" className="w-full rounded border-slate-300 text-sm" required />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-500">Contador</label>
            <input name="accounting_fees" type="number" step="0.01" className="w-full rounded border-slate-300 text-sm" required />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-500">Aluguel</label>
            <input name="rent" type="number" step="0.01" className="w-full rounded border-slate-300 text-sm" required />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-500">Amazon Prime</label>
            <input name="amazon_prime" type="number" step="0.01" className="w-full rounded border-slate-300 text-sm" required />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-500">Outros</label>
            <input name="other_fixed_costs" type="number" step="0.01" className="w-full rounded border-slate-300 text-sm" required />
          </div>
          <div className="md:col-span-full lg:col-span-1">
            <SubmitButton label="Salvar" className="w-full" />
          </div>
        </form>
      </section>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {(costs as FixedCostsMonthly[] || []).map((month) => (
          <div key={month.id} className="p-4 bg-white border border-slate-200 rounded-lg flex justify-between items-center">
            <div>
              <p className="text-sm font-bold text-slate-800">{month.year_month.substring(0, 7)}</p>
              <p className="text-xs text-slate-500">
                Fixos: R$ {(month.total_fixed_month || 0).toFixed(2)}
              </p>
            </div>
            <div className="text-right text-xs text-slate-400 space-y-1">
              <p>Rent: {month.rent}</p>
              <p>Accounting: {month.accounting_fees}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
