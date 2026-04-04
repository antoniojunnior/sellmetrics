import { createClient } from '@/lib/supabase/server'
import { runIngestHistorical, runIngestYesterday } from './ingestion-actions'
import { SectionBlock, StatusBadge, DataTable } from '@/components/ui/LayoutComponents'
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

  const columns = [
    { 
      header: 'Data/Hora', 
      key: 'executed_at',
      className: 'font-mono text-slate-500',
      render: (val: string) => new Date(val).toLocaleString('pt-BR')
    },
    { 
      header: 'Operação', 
      key: 'type',
      className: 'font-bold capitalize'
    },
    { 
      header: 'Status', 
      key: 'status',
      render: (val: string) => <StatusBadge status={val === 'success' ? 'ok' : 'error'} label={val} />
    },
    { 
      header: 'Dias Proc.', 
      key: 'days_processed',
      className: 'text-center font-mono'
    },
    { 
      header: 'Detalhes', 
      key: 'error_message',
      className: 'max-w-[200px] truncate text-xs text-slate-400',
      render: (val: string) => val || '—'
    }
  ]

  return (
    <div className="p-8 space-y-10">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-slate-50 tracking-tight">Ingestão de Dados</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Controle a sincronização de dados entre a Amazon (SP-API e Ads API) e o banco de dados do Sellmetrics.
          </p>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* STATUS DOS SNAPSHOTS */}
        <div className="lg:col-span-1 space-y-8">
          <SectionBlock title="Status de Sincronização">
            <div className="space-y-6">
              <div className="p-4 bg-slate-50 dark:bg-slate-900/50 rounded-xl border border-slate-100 dark:border-slate-800 flex justify-between items-center">
                <div>
                  <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-1">Vendas (SP-API)</p>
                  <p className="text-lg font-bold text-slate-800 dark:text-slate-100">{lastSale?.snapshot_date || 'Nenhum dado'}</p>
                </div>
                <StatusBadge status={lastSale ? 'ok' : 'warning'} label={lastSale ? 'Atualizado' : 'Pendente'} />
              </div>
              <div className="p-4 bg-slate-50 dark:bg-slate-900/50 rounded-xl border border-slate-100 dark:border-slate-800 flex justify-between items-center">
                <div>
                  <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-1">Publicidade (ADS)</p>
                  <p className="text-lg font-bold text-slate-800 dark:text-slate-100">{lastAds?.snapshot_date || 'Nenhum dado'}</p>
                </div>
                <StatusBadge status={lastAds ? 'ok' : 'warning'} label={lastAds ? 'Atualizado' : 'Pendente'} />
              </div>
            </div>
          </SectionBlock>

          <SectionBlock title="Ação Rápida">
            <form action={runIngestYesterday.bind(null, accountId, marketplaceId, adsProfileId)}>
              <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">
                Sincroniza os dados consolidados de ontem (D-1). Ideal para uso diário.
              </p>
              <SubmitButton label="Atualizar Ontem (D-1)" className="w-full" />
            </form>
          </SectionBlock>
        </div>

        {/* CARGA HISTÓRICA & LOGS */}
        <div className="lg:col-span-2 space-y-8">
          <SectionBlock 
            title="Carga Histórica / Reprocessamento" 
            className="border-indigo-100 dark:border-indigo-900/30"
          >
            <form action={runIngestHistorical} className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-4 items-end">
              <input type="hidden" name="account_id" value={accountId} />
              <input type="hidden" name="marketplace_id" value={marketplaceId} />
              <input type="hidden" name="ads_profile_id" value={adsProfileId} />
              
              <div className="space-y-1.5 md:col-span-2">
                <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Data Início</label>
                <input name="startDate" type="date" className="w-full bg-white dark:bg-slate-900 rounded-xl border-slate-200 dark:border-slate-800 text-sm focus:ring-indigo-500 focus:border-indigo-500" required />
              </div>
              <div className="space-y-1.5 md:col-span-2">
                <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Data Fim</label>
                <input name="endDate" type="date" className="w-full bg-white dark:bg-slate-900 rounded-xl border-slate-200 dark:border-slate-800 text-sm focus:ring-indigo-500 focus:border-indigo-500" required />
              </div>
              <div className="md:col-span-full lg:col-span-1">
                <SubmitButton label="Executar" loadingLabel="Processando..." className="w-full bg-slate-900 dark:bg-white text-white dark:text-slate-900 hover:bg-slate-800 dark:hover:bg-slate-100" />
              </div>
              <p className="md:col-span-full text-xs text-amber-600 dark:text-amber-500 bg-amber-50 dark:bg-amber-900/20 p-3 rounded-lg mt-2">
                <strong>Atenção:</strong> Cargas históricas longas podem ser rate-limited pela Amazon. O sistema processa em lotes de 7 dias automaticamente.
              </p>
            </form>
          </SectionBlock>

          <SectionBlock title="Logs de Sincronização">
            <DataTable 
              columns={columns} 
              data={logs || []} 
              emptyMessage="Nenhuma operação de ingestão registrada."
            />
          </SectionBlock>
        </div>
      </div>
    </div>
  )
}
