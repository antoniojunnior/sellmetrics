import { createClient } from '@/lib/supabase/server'
import { runIngestHistorical, runIngestYesterday } from './ingestion-actions'
import { Suspense } from 'react'

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

  // 2. LOG DE INGESTÃO (Últimas 20)
  const { data: logs } = await supabase
    .from('ingestion_logs')
    .select('*')
    .eq('account_id', accountId)
    .order('executed_at', { ascending: false })
    .limit(20)

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-8">
      <header>
        <h1 className="text-2xl font-bold text-slate-800">Gestão de Ingestão de Dados</h1>
        <p className="text-slate-500">Controle a sincronização com as APIs da Amazon (SP-API e Ads API).</p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* STATUS DOS SNAPSHOTS */}
        <div className="lg:col-span-1 space-y-6">
          <section className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
            <h2 className="text-sm font-bold uppercase text-slate-500 mb-4 tracking-wider">Status dos Snapshots</h2>
            <div className="space-y-4">
              <div>
                <p className="text-xs text-slate-400">Última Venda Sincronizada</p>
                <p className="text-lg font-bold text-indigo-600">{lastSale?.snapshot_date || 'Nenhum dado'}</p>
              </div>
              <div>
                <p className="text-xs text-slate-400">Último ADS Sincronizado</p>
                <p className="text-lg font-bold text-indigo-600">{lastAds?.snapshot_date || 'Nenhum dado'}</p>
              </div>
            </div>
          </section>

          <section className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
            <h2 className="text-sm font-bold uppercase text-slate-500 mb-4 tracking-wider">Ações Rápidas</h2>
            <form action={runIngestYesterday.bind(null, accountId, marketplaceId, adsProfileId)}>
              <button 
                type="submit"
                className="w-full bg-indigo-600 text-white py-2 px-4 rounded-lg font-bold hover:bg-indigo-700 transition shadow-sm"
              >
                Atualizar D-1 (Incremental)
              </button>
            </form>
          </section>
        </div>

        {/* CARGA HISTÓRICA & LOGS */}
        <div className="lg:col-span-2 space-y-8">
          <section className="bg-slate-800 text-white p-6 rounded-xl shadow-lg">
            <h2 className="text-sm font-bold uppercase text-slate-400 mb-4 tracking-wider">Carga Histórica / Reprocessamento</h2>
            <form action={runIngestHistorical} className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
              <input type="hidden" name="account_id" value={accountId} />
              <input type="hidden" name="marketplace_id" value={marketplaceId} />
              <input type="hidden" name="ads_profile_id" value={adsProfileId} />
              
              <div className="space-y-1">
                <label className="text-xs text-slate-400">Data Início</label>
                <input name="startDate" type="date" className="w-full rounded bg-slate-700 border-slate-600 text-sm" required />
              </div>
              <div className="space-y-1">
                <label className="text-xs text-slate-400">Data Fim</label>
                <input name="endDate" type="date" className="w-full rounded bg-slate-700 border-slate-600 text-sm" required />
              </div>
              <button 
                type="submit"
                className="bg-amber-500 text-slate-900 py-2 px-4 rounded font-bold hover:bg-amber-400 transition"
              >
                Executar Carga
              </button>
              <p className="md:col-span-3 text-xs text-slate-500 italic mt-2">
                * Operações históricas podem levar alguns minutos devido aos rate limits da Amazon.
              </p>
            </form>
          </section>

          <section className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            <h2 className="text-sm font-bold uppercase text-slate-500 p-6 border-b border-slate-100 tracking-wider">Últimos Logs de Execução</h2>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-200">
                <thead className="bg-slate-50 text-xs font-bold text-slate-500 uppercase">
                  <tr>
                    <th className="px-6 py-3 text-left">Executado em</th>
                    <th className="px-6 py-3 text-left">Tipo</th>
                    <th className="px-6 py-3 text-left">Status</th>
                    <th className="px-6 py-3 text-left">Dias</th>
                    <th className="px-6 py-3 text-left">Detalhes</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-slate-100 text-sm">
                  {logs?.map((log) => (
                    <tr key={log.id}>
                      <td className="px-6 py-4 whitespace-nowrap text-slate-600">
                        {new Date(log.executed_at).toLocaleString('pt-BR')}
                      </td>
                      <td className="px-6 py-4 capitalize font-medium">{log.type}</td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase ${
                          log.status === 'success' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                        }`}>
                          {log.status}
                        </span>
                      </td>
                      <td className="px-6 py-4">{log.days_processed}</td>
                      <td className="px-6 py-4 text-xs text-slate-400 truncate max-w-[200px]">
                        {log.error_message || 'OK'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </div>
      </div>
    </div>
  )
}
