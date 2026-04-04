import { createClient } from '@/lib/supabase/server'
import { runIngestHistorical, runIngestYesterday } from './ingestion-actions'
import { SectionBlock } from '@/components/ui/section-block'
import { StatusBadge } from '@/components/ui/status-badge'
import { SubmitButton } from '../settings/components/submit-button'

export default async function IngestionManagementPage() {
  const supabase = await createClient()
  const accountId = 'default-account'
  const marketplaceId = 'ATVPDKIKX0DER'
  const adsProfileId = 'profile-1'

  // 1. STATUS DOS SNAPSHOTS
  const { data: lastSale } = await supabase
    .from('daily_sales_snapshot')
    .select('snapshot_date')
    .eq('account_id', accountId)
    .order('snapshot_date', { ascending: false })
    .limit(1)
    .single()

  const { data: lastAds } = await supabase
    .from('daily_ads_snapshot')
    .select('snapshot_date')
    .eq('account_id', accountId)
    .order('snapshot_date', { ascending: false })
    .limit(1)
    .single()

  // 2. LOG DE INGESTÃO
  const { data: logs } = await supabase
    .from('ingestion_logs')
    .select('*')
    .eq('account_id', accountId)
    .order('executed_at', { ascending: false })
    .limit(20)

  return (
    <div className="space-y-10">
      <header>
        <h1 className="text-2xl font-black text-text-primary tracking-tight">Ingestão de Dados</h1>
        <p className="text-sm text-text-secondary mt-1">
          Controle a sincronização de dados entre a Amazon e o Sellmetrics.
        </p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-1 space-y-8">
          <SectionBlock title="Status">
            <div className="space-y-4">
              <div className="flex justify-between items-center p-3 bg-background rounded-lg border border-border">
                <div><p className="text-[10px] font-black text-text-muted uppercase tracking-widest">Vendas</p><p className="text-sm font-bold text-text-primary">{lastSale?.snapshot_date || '—'}</p></div>
                <StatusBadge status={lastSale ? 'ok' : 'warning'} label={lastSale ? 'OK' : 'Vazio'} />
              </div>
              <div className="flex justify-between items-center p-3 bg-background rounded-lg border border-border">
                <div><p className="text-[10px] font-black text-text-muted uppercase tracking-widest">Publicidade</p><p className="text-sm font-bold text-text-primary">{lastAds?.snapshot_date || '—'}</p></div>
                <StatusBadge status={lastAds ? 'ok' : 'warning'} label={lastAds ? 'OK' : 'Vazio'} />
              </div>
            </div>
          </SectionBlock>

          <SectionBlock title="Ação Rápida">
            <form action={runIngestYesterday.bind(null, accountId, marketplaceId, adsProfileId)}>
              <p className="text-xs text-text-secondary mb-4">Sincroniza os dados consolidados de ontem.</p>
              <SubmitButton label="Atualizar D-1" className="w-full" />
            </form>
          </SectionBlock>
        </div>

        <div className="lg:col-span-2 space-y-8">
          <SectionBlock title="Carga Histórica">
            <form action={runIngestHistorical} className="grid grid-cols-1 md:grid-cols-5 gap-4 items-end">
              <input type="hidden" name="account_id" value={accountId} />
              <input type="hidden" name="marketplace_id" value={marketplaceId} />
              <input type="hidden" name="ads_profile_id" value={adsProfileId} />
              
              <div className="md:col-span-2 space-y-1.5">
                <label className="text-[10px] font-black uppercase text-text-muted">Início</label>
                <input name="startDate" type="date" className="w-full bg-surface rounded-xl border-border text-sm px-3 py-2" required />
              </div>
              <div className="md:col-span-2 space-y-1.5">
                <label className="text-[10px] font-black uppercase text-text-muted">Fim</label>
                <input name="endDate" type="date" className="w-full bg-surface rounded-xl border-border text-sm px-3 py-2" required />
              </div>
              <SubmitButton label="Executar" className="w-full h-[38px] bg-text-primary text-white" />
            </form>
          </SectionBlock>

          <SectionBlock title="Logs">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-border text-sm text-text-secondary">
                <thead>
                  <tr className="text-[10px] font-black text-text-muted uppercase tracking-widest">
                    <th className="px-4 py-3 text-left">Data</th>
                    <th className="px-4 py-3 text-left">Tipo</th>
                    <th className="px-4 py-3 text-left">Status</th>
                    <th className="px-4 py-3 text-left">Dias</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/50">
                  {logs?.map((log) => (
                    <tr key={log.id} className="hover:bg-background/50 transition-colors">
                      <td className="px-4 py-3 text-xs">{new Date(log.executed_at).toLocaleString('pt-BR')}</td>
                      <td className="px-4 py-3 capitalize font-medium text-text-primary">{log.type}</td>
                      <td className="px-4 py-3"><StatusBadge status={log.status === 'success' ? 'ok' : 'error'} label={log.status} /></td>
                      <td className="px-4 py-3 font-mono">{log.days_processed}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </SectionBlock>
        </div>
      </div>
    </div>
  )
}
