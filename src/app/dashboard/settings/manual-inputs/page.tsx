export const runtime = "edge";
import { saveCouponDaily } from '../actions'
import { createClient } from '@/lib/supabase/server'
import { CouponDaily } from '@/lib/supabase/types'
import { SectionBlock } from '@/components/ui/section-block'
import { SubmitButton } from '../components/submit-button'
import { ActionForm } from '../components/action-form'
import { redirect } from 'next/navigation'

export default async function ManualInputsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: rows } = await supabase
    .from('coupon_daily')
    .select('*')
    .eq('account_id', user.id)
    .order('snapshot_date', { ascending: false })
    .limit(60)

  const formatMoney = (val: number) => `R$ ${val.toFixed(2)}`

  return (
    <div className="space-y-8">
      {/* Formulário */}
      <SectionBlock title="Novo Lançamento de Cupons por Período" className="border-dashed bg-background/30">
        <ActionForm action={saveCouponDaily} className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-8 gap-4 items-end">
          <input type="hidden" name="account_id" value={user.id} />

          <div className="space-y-1 lg:col-span-2">
            <label className="text-[10px] font-black uppercase text-text-muted tracking-widest">Início</label>
            <input name="period_start_date" type="date" className="w-full bg-surface rounded-lg border-border text-sm focus:ring-accent/20 focus:border-accent outline-none px-3 py-2" required />
          </div>
          <div className="space-y-1 lg:col-span-2">
            <label className="text-[10px] font-black uppercase text-text-muted tracking-widest">Fim</label>
            <input name="period_end_date" type="date" className="w-full bg-surface rounded-lg border-border text-sm focus:ring-accent/20 focus:border-accent outline-none px-3 py-2" required />
          </div>
          <div className="space-y-1 lg:col-span-2">
            <label className="text-[10px] font-black uppercase text-text-muted tracking-widest">Venda Cupom</label>
            <input name="coupon_sales_value" type="number" step="0.01" className="w-full bg-surface rounded-lg border-border text-sm focus:ring-accent/20 focus:border-accent outline-none px-3 py-2" required />
          </div>
          <div className="space-y-1 lg:col-span-2">
            <label className="text-[10px] font-black uppercase text-text-muted tracking-widest">Custo Cupom</label>
            <input name="coupon_cost_value" type="number" step="0.01" className="w-full bg-surface rounded-lg border-border text-sm focus:ring-accent/20 focus:border-accent outline-none px-3 py-2" required />
          </div>

          <div className="space-y-1 lg:col-span-2">
            <label className="text-[10px] font-black uppercase text-text-muted tracking-widest">Distribuídos</label>
            <input name="coupon_distributed" type="number" className="w-full bg-surface rounded-lg border-border text-sm focus:ring-accent/20 focus:border-accent outline-none px-3 py-2" required />
          </div>
          <div className="space-y-1 lg:col-span-2">
            <label className="text-[10px] font-black uppercase text-text-muted tracking-widest">Resgatados</label>
            <input name="coupon_redeemed" type="number" className="w-full bg-surface rounded-lg border-border text-sm focus:ring-accent/20 focus:border-accent outline-none px-3 py-2" required />
          </div>

          <div>
            <SubmitButton label="Salvar" className="w-full h-[38px]" />
          </div>
        </ActionForm>
        <p className="text-[10px] text-text-muted mt-2">
          Os valores informados serão distribuídos proporcionalmente por dia no período selecionado.
        </p>
      </SectionBlock>

      {/* Histórico — últimos 60 dias */}
      <div className="border border-border rounded-xl overflow-hidden bg-surface">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-border text-sm text-text-secondary">
            <thead className="bg-slate-50/50">
              <tr className="text-[10px] font-black text-text-muted uppercase tracking-widest">
                <th className="px-4 py-3 text-left">Data</th>
                <th className="px-4 py-3 text-left">Vendas Cupom</th>
                <th className="px-4 py-3 text-left">Custo Cupom</th>
                <th className="px-4 py-3 text-left">Resgates</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/50">
              {(rows as CouponDaily[] || []).map((row) => (
                <tr key={row.id} className="hover:bg-background/30 transition-colors">
                  <td className="px-4 py-3 font-medium text-text-primary">{row.snapshot_date}</td>
                  <td className="px-4 py-3 font-mono">{formatMoney(row.coupon_sales_value)}</td>
                  <td className="px-4 py-3 font-mono text-negative">{formatMoney(row.coupon_cost_value)}</td>
                  <td className="px-4 py-3 font-mono">{row.coupon_redeemed} / {row.coupon_distributed}</td>
                </tr>
              ))}
              {(!rows || rows.length === 0) && (
                <tr>
                  <td colSpan={4} className="px-4 py-10 text-center text-xs text-text-muted italic">
                    Nenhum lançamento. Use o formulário acima para registrar cupons.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
