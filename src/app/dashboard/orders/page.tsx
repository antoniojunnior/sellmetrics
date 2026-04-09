export const runtime = "edge";
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { ordersRepository } from '@/lib/supabase/repositories/orders-repository'
import { SectionBlock, StatusBadge } from '@/components/ui/layout-components'
import { PeriodSelector } from '@/components/ui/period-selector'
import { Suspense } from 'react'
import { SkeletonTable } from '@/components/ui/skeleton-loader'

export default async function OrdersPage({ 
  searchParams 
}: { 
  searchParams: Promise<{ startDate?: string; endDate?: string; sku?: string }> 
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const params = await searchParams
  const today = new Date('2026-04-04')
  const defaultStart = new Date(today)
  defaultStart.setDate(today.getDate() - 7) // Padrão 7 dias para pedidos

  const startDate = params.startDate || defaultStart.toISOString().split('T')[0]
  const endDate = params.endDate || today.toISOString().split('T')[0]
  const sku = params.sku || ''

  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-2xl font-black text-text-primary tracking-tight">Pedidos Individuais</h1>
        <p className="text-sm text-text-secondary mt-1">
          Auditoria e checagem de transações registradas via API de Pedidos.
        </p>
      </header>

      <PeriodSelector startDate={startDate} endDate={endDate} sku={sku} />

      <Suspense fallback={<SkeletonTable />}>
        <OrdersContent accountId={user.id} startDate={startDate} endDate={endDate} sku={sku} />
      </Suspense>
    </div>
  )
}

async function OrdersContent({ accountId, startDate, endDate, sku }: { accountId: string, startDate: string, endDate: string, sku: string }) {
  const orders = await ordersRepository.getOrdersByPeriod(accountId, startDate, endDate, sku || undefined)

  const formatCurrency = (val: number) => 
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val)

  return (
    <SectionBlock title={`Listagem de Pedidos (${orders.length})`}>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-border">
          <thead>
            <tr className="text-[10px] font-black text-text-muted uppercase tracking-widest">
              <th className="px-4 py-3 text-left">Data do Pedido</th>
              <th className="px-4 py-3 text-left">Amazon Order ID</th>
              <th className="px-4 py-3 text-left">SKU</th>
              <th className="px-4 py-3 text-center">Qtd</th>
              <th className="px-4 py-3 text-right">Preço Item</th>
              <th className="px-4 py-3 text-center">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/50 text-sm text-text-secondary">
            {orders.length > 0 ? orders.map((order) => (
              <tr key={`${order.amazon_order_id}-${order.sku}`} className="hover:bg-background/30 transition-colors">
                <td className="px-4 py-3 whitespace-nowrap">
                  {new Date(order.purchase_date).toLocaleString('pt-BR')}
                </td>
                <td className="px-4 py-3 font-mono text-xs font-bold text-text-primary">
                  {order.amazon_order_id}
                </td>
                <td className="px-4 py-3 font-medium">{order.sku}</td>
                <td className="px-4 py-3 text-center">{order.quantity}</td>
                <td className="px-4 py-3 text-right font-mono">{formatCurrency(order.item_price)}</td>
                <td className="px-4 py-3 text-center">
                  <StatusBadge 
                    status={order.order_status === 'Shipped' ? 'ok' : 'warning'} 
                    label={order.order_status} 
                  />
                </td>
              </tr>
            )) : (
              <tr>
                <td colSpan={6} className="px-4 py-12 text-center text-text-muted italic">
                  Nenhum pedido encontrado para os filtros selecionados.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </SectionBlock>
  )
}
