'use client'

import { startAmazonOAuth, startAdsOAuth } from '../actions'
import { Account } from '@/lib/supabase/types'

function StatusBadge({ connected }: { connected: boolean }) {
  return connected ? (
    <span className="inline-flex items-center gap-1 text-xs font-medium text-green-700 bg-green-100 px-2 py-0.5 rounded-full">
      <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
      Conectado
    </span>
  ) : (
    <span className="inline-flex items-center gap-1 text-xs font-medium text-yellow-700 bg-yellow-100 px-2 py-0.5 rounded-full">
      <span className="w-1.5 h-1.5 rounded-full bg-yellow-500" />
      Não conectado
    </span>
  )
}

export default function ConnectionStatus({ account }: { account: Account }) {
  const spConnected = !!account.sp_api_refresh_token_enc
  const adsConnected = !!account.ads_refresh_token_enc

  return (
    <section className="bg-white border border-gray-200 rounded-lg p-6">
      <h2 className="text-lg font-medium text-gray-900 mb-4">Conexão Amazon</h2>
      <div className="space-y-4">

        <div className="flex items-center justify-between py-3 border-b border-gray-100">
          <div>
            <p className="text-sm font-medium text-gray-900">SP-API (Selling Partner)</p>
            <p className="text-xs text-gray-500">Vendas, pedidos, relatórios, estoque FBA</p>
          </div>
          <div className="flex items-center gap-3">
            <StatusBadge connected={spConnected} />
            <form action={startAmazonOAuth}>
              <button
                type="submit"
                className="text-sm text-indigo-600 hover:text-indigo-800 font-medium"
              >
                {spConnected ? 'Reconectar' : 'Conectar'}
              </button>
            </form>
          </div>
        </div>

        <div className="flex items-center justify-between py-3">
          <div>
            <p className="text-sm font-medium text-gray-900">Ads API</p>
            <p className="text-xs text-gray-500">ACOS, TACOS, campanhas Sponsored Products</p>
          </div>
          <div className="flex items-center gap-3">
            <StatusBadge connected={adsConnected} />
            <form action={startAdsOAuth}>
              <button
                type="submit"
                className="text-sm text-indigo-600 hover:text-indigo-800 font-medium"
              >
                {adsConnected ? 'Reconectar' : 'Conectar'}
              </button>
            </form>
          </div>
        </div>
      </div>
    </section>
  )
}
