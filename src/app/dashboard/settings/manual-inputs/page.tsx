import { saveManualInputs } from '../actions'
import { createClient } from '@/lib/supabase/server'
import { PeriodManualInputs } from '@/lib/supabase/types'
import { SectionBlock } from '@/components/ui/section-block'
import { SubmitButton } from '../components/submit-button'

export default async function ManualInputsPage() {
  const supabase = await createClient()
  const { data: inputs } = await supabase
    .from('period_manual_inputs')
    .select('*')
    .eq('account_id', 'default-account')
    .order('period_start_date', { ascending: false })

  const formatMoney = (val: number) => `R$ ${val.toFixed(2)}`

  return (
    <div className="space-y-10">
      <header>
        <h1 className="text-2xl font-black text-text-primary tracking-tight">Inputs Manuais</h1>
        <p className="text-sm text-text-secondary mt-1">
          Lance dados que não vêm da API, como uso de cupons de desconto por período.
        </p>
      </header>

      {/* Formulário */}
      <SectionBlock title="Lançamento de Período" className="border-dashed">
        <form action={saveManualInputs} className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-8 gap-6 items-end">
          <input type="hidden" name="account_id" value="default-account" />
          
          <div className="space-y-1.5 lg:col-span-2">
            <label className="text-[10px] font-black uppercase text-text-muted tracking-widest">Início</label>
            <input name="period_start_date" type="date" className="w-full bg-surface rounded-xl border-border text-sm focus:ring-accent/20 focus:border-accent outline-none px-3 py-2" required />
          </div>
          <div className="space-y-1.5 lg:col-span-2">
            <label className="text-[10px] font-black uppercase text-text-muted tracking-widest">Fim</label>
            <input name="period_end_date" type="date" className="w-full bg-surface rounded-xl border-border text-sm focus:ring-accent/20 focus:border-accent outline-none px-3 py-2" required />
          </div>
          <div className="space-y-1.5 lg:col-span-2">
            <label className="text-[10px] font-black uppercase text-text-muted tracking-widest">Venda Cupom</label>
            <input name="coupon_sales_value" type="number" step="0.01" className="w-full bg-surface rounded-xl border-border text-sm focus:ring-accent/20 focus:border-accent outline-none px-3 py-2" required />
          </div>
          <div className="space-y-1.5 lg:col-span-2">
            <label className="text-[10px] font-black uppercase text-text-muted tracking-widest">Custo Cupom</label>
            <input name="coupon_cost_value" type="number" step="0.01" className="w-full bg-surface rounded-xl border-border text-sm focus:ring-accent/20 focus:border-accent outline-none px-3 py-2" required />
          </div>

          <div className="space-y-1.5 lg:col-span-2">
            <label className="text-[10px] font-black uppercase text-text-muted tracking-widest">Distribuídos</label>
            <input name="coupon_distributed" type="number" className="w-full bg-surface rounded-xl border-border text-sm focus:ring-accent/20 focus:border-accent outline-none px-3 py-2" required />
          </div>
          <div className="space-y-1.5 lg:col-span-2">
            <label className="text-[10px] font-black uppercase text-text-muted tracking-widest">Resgatados</label>
            <input name="coupon_redeemed" type="number" className="w-full bg-surface rounded-xl border-border text-sm focus:ring-accent/20 focus:border-accent outline-none px-3 py-2" required />
          </div>
          
          <div className="space-y-1.5 lg:col-span-3">
            <label className="text-[10px] font-black uppercase text-text-muted tracking-widest">Notas</label>
            <input name="manual_notes" type="text" className="w-full bg-surface rounded-xl border-border text-sm focus:ring-accent/20 focus:border-accent outline-none px-3 py-2" />
          </div>

          <div>
            <SubmitButton label="Gravar" className="w-full h-[38px]" />
          </div>
        </form>
      </SectionBlock>

      {/* Histórico */}
      <SectionBlock title="Lançamentos Históricos">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-border text-sm text-text-secondary">
            <thead>
              <tr className="text-[10px] font-black text-text-muted uppercase tracking-widest">
                <th className="px-4 py-3 text-left">Período</th>
                <th className="px-4 py-3 text-left">Vendas Cupom</th>
                <th className="px-4 py-3 text-left">Custo Cupom</th>
                <th className="px-4 py-3 text-left">Resgates</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/50">
              {(inputs as PeriodManualInputs[] || []).map((input) => (
                <tr key={input.id} className="hover:bg-background/50 transition-colors">
                  <td className="px-4 py-3 font-medium text-text-primary">{input.period_start_date} a {input.period_end_date}</td>
                  <td className="px-4 py-3 font-mono">{formatMoney(input.coupon_sales_value)}</td>
                  <td className="px-4 py-3 font-mono text-negative">{formatMoney(input.coupon_cost_value)}</td>
                  <td className="px-4 py-3 font-mono">{input.coupon_redeemed} / {input.coupon_distributed}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </SectionBlock>
    </div>
  )
}
