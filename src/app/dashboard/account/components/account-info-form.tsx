'use client'

import { useActionState } from 'react'
import { saveAccountInfo } from '../actions'
import { Account } from '@/lib/supabase/types'
import { ActionResult } from '../../settings/types'
import { SubmitButton } from '../../settings/components/submit-button'

const MARKETPLACES = [
  { id: 'A2Q3Y263D00KWC', label: 'Amazon.com.br (BR)' },
  { id: 'ATVPDKIKX0DER', label: 'Amazon.com (US)' },
]

const TIMEZONES = [
  'America/Sao_Paulo',
  'America/Manaus',
  'America/Belem',
  'America/Fortaleza',
  'America/Recife',
  'America/Noronha',
]

export default function AccountInfoForm({ account }: { account: Account }) {
  const [state, action] = useActionState<ActionResult | null, FormData>(saveAccountInfo, null)

  return (
    <section className="bg-white border border-gray-200 rounded-lg p-6">
      <h2 className="text-lg font-medium text-gray-900 mb-4">Informações gerais</h2>
      <form action={action} className="space-y-4">
        <input type="hidden" name="account_id" value={account.id} />

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Nome da loja</label>
          <input
            name="name"
            defaultValue={account.name ?? ''}
            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            placeholder="Minha Loja Amazon"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Marketplace</label>
          <select
            name="marketplace_id"
            defaultValue={account.marketplace_id}
            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            {MARKETPLACES.map(m => (
              <option key={m.id} value={m.id}>{m.label}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Ads Profile ID</label>
          <input
            name="ads_profile_id"
            defaultValue={account.ads_profile_id}
            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            placeholder="Ex: 1234567890"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Fuso horário</label>
          <select
            name="timezone"
            defaultValue={account.timezone}
            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            {TIMEZONES.map(tz => (
              <option key={tz} value={tz}>{tz}</option>
            ))}
          </select>
        </div>

        {state?.error && (
          <p className="text-sm text-red-600">{state.error}</p>
        )}
        {state?.ok && (
          <p className="text-sm text-green-600">Salvo com sucesso.</p>
        )}

        <SubmitButton label="Salvar" loadingLabel="Salvando..." />
      </form>
    </section>
  )
}
