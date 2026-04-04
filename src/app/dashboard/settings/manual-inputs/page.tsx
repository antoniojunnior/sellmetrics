import { saveManualInputs } from '../actions'
import { createClient } from '@/lib/supabase/server'
import { PeriodManualInputs } from '@/lib/supabase/types'

export default async function ManualInputsPage() {
  const supabase = await createClient()
  const { data: inputs } = await supabase
    .from('period_manual_inputs')
    .select('*')
    .eq('account_id', 'default-account')
    .order('period_start_date', { ascending: false })

  return (
    <div className="p-6 space-y-8">
      <header>
        <h1 className="text-xl font-bold text-slate-800">Inputs Manuais de Período</h1>
        <p className="text-sm text-slate-500">Cadastre dados de cupons e outros ajustes financeiros.</p>
      </header>

      <section className="bg-slate-50 p-6 rounded-lg border border-slate-200">
        <h2 className="text-sm font-bold uppercase mb-4 text-slate-600">Novo Input por Período</h2>
        <form action={saveManualInputs} className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-7 gap-4 items-end">
          <input type="hidden" name="account_id" value="default-account" />
          
          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-500">Início</label>
            <input name="period_start_date" type="date" className="w-full rounded border-slate-300 text-sm" required />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-500">Fim</label>
            <input name="period_end_date" type="date" className="w-full rounded border-slate-300 text-sm" required />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-500">Venda Cupom</label>
            <input name="coupon_sales_value" type="number" step="0.01" className="w-full rounded border-slate-300 text-sm" required />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-500">Custo Cupom</label>
            <input name="coupon_cost_value" type="number" step="0.01" className="w-full rounded border-slate-300 text-sm" required />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-500">Distribuídos</label>
            <input name="coupon_distributed" type="number" className="w-full rounded border-slate-300 text-sm" required />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-500">Resgatados</label>
            <input name="coupon_redeemed" type="number" className="w-full rounded border-slate-300 text-sm" required />
          </div>
          <div className="md:col-span-full lg:col-span-1">
            <button type="submit" className="w-full bg-indigo-600 text-white py-2 px-4 rounded text-sm font-bold hover:bg-indigo-700 transition">
              Salvar
            </button>
          </div>
          <div className="md:col-span-full mt-2">
            <label className="text-xs font-semibold text-slate-500">Notas Adicionais</label>
            <textarea name="manual_notes" className="w-full rounded border-slate-300 text-sm h-12" placeholder="Opcional"></textarea>
          </div>
        </form>
      </section>

      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-slate-200">
          <thead className="bg-slate-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-bold text-slate-500 uppercase">Período</th>
              <th className="px-6 py-3 text-left text-xs font-bold text-slate-500 uppercase">Venda Cupom</th>
              <th className="px-6 py-3 text-left text-xs font-bold text-slate-500 uppercase">Custo Cupom</th>
              <th className="px-6 py-3 text-left text-xs font-bold text-slate-500 uppercase">Resgates</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-slate-200 text-sm">
            {(inputs as PeriodManualInputs[] || []).map((input) => (
              <tr key={input.id}>
                <td className="px-6 py-4 font-medium text-slate-900">{input.period_start_date} a {input.period_end_date}</td>
                <td className="px-6 py-4">R$ {input.coupon_sales_value.toFixed(2)}</td>
                <td className="px-6 py-4">R$ {input.coupon_cost_value.toFixed(2)}</td>
                <td className="px-6 py-4">{input.coupon_redeemed} / {input.coupon_distributed}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
