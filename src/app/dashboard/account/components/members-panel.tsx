'use client'

import { useState } from 'react'
import { Account, AccountMember } from '@/lib/supabase/types'
import { removeMember } from '../actions'

const ROLE_LABELS: Record<string, string> = {
  owner: 'Proprietário',
  member: 'Membro',
  viewer: 'Visualizador',
}

interface Props {
  account: Account
  members: AccountMember[]
  currentUserId: string
}

export default function MembersPanel({ account, members, currentUserId }: Props) {
  const [removing, setRemoving] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  async function handleRemove(userId: string) {
    setRemoving(userId)
    setError(null)
    const result = await removeMember(account.id, userId)
    if (!result.ok) setError(result.error ?? 'Erro ao remover')
    setRemoving(null)
  }

  return (
    <section className="bg-white border border-gray-200 rounded-lg p-6">
      <h2 className="text-lg font-medium text-gray-900 mb-4">Membros</h2>

      {error && <p className="text-sm text-red-600 mb-3">{error}</p>}

      <ul className="divide-y divide-gray-100">
        {members.map(m => (
          <li key={m.user_id} className="flex items-center justify-between py-3">
            <div>
              <p className="text-sm font-medium text-gray-900 font-mono">{m.user_id}</p>
              <p className="text-xs text-gray-500">{ROLE_LABELS[m.role] ?? m.role}</p>
            </div>
            {m.role !== 'owner' && m.user_id !== currentUserId && (
              <button
                onClick={() => handleRemove(m.user_id)}
                disabled={removing === m.user_id}
                className="text-sm text-red-600 hover:text-red-800 disabled:opacity-50"
              >
                {removing === m.user_id ? 'Removendo...' : 'Remover'}
              </button>
            )}
          </li>
        ))}
      </ul>

      <p className="text-xs text-gray-400 mt-4">
        Convite de membros por email disponível no plano Starter e Pro.
      </p>
    </section>
  )
}
