'use client'

import { useState } from 'react'
import { Account } from '@/lib/supabase/types'

const PLAN_LABELS: Record<string, { name: string; price: string; features: string[] }> = {
  free: {
    name: 'Free',
    price: 'Grátis',
    features: ['5 SKUs', '1 usuário', '30 dias de histórico'],
  },
  starter: {
    name: 'Starter',
    price: 'R$ 79/mês',
    features: ['30 SKUs', '2 usuários', '12 meses de histórico', 'P&L por SKU', 'Alertas básicos'],
  },
  pro: {
    name: 'Pro',
    price: 'R$ 149/mês',
    features: ['SKUs ilimitados', '5 usuários', 'Histórico completo', 'IA assistente', 'Search Terms'],
  },
}

export default function BillingPanel({ account }: { account: Account }) {
  const [loading, setLoading] = useState<string | null>(null)

  async function handleUpgrade(planId: string) {
    setLoading(planId)
    const res = await fetch('/api/checkout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ planId }),
    })
    const data = await res.json() as { url?: string; error?: string }
    if (data.url) {
      window.location.href = data.url
    } else {
      setLoading(null)
      alert(data.error ?? 'Erro ao iniciar checkout')
    }
  }

  const currentPlan = PLAN_LABELS[account.plan_id] ?? PLAN_LABELS.free

  const trialActive = account.trial_ends_at && new Date(account.trial_ends_at) > new Date()
  const trialDaysLeft = trialActive
    ? Math.ceil((new Date(account.trial_ends_at!).getTime() - Date.now()) / 86400000)
    : 0

  return (
    <section className="bg-white border border-gray-200 rounded-lg p-6">
      <h2 className="text-lg font-medium text-gray-900 mb-4">Plano e cobrança</h2>

      <div className="bg-gray-50 rounded-lg p-4 mb-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="font-medium text-gray-900">{currentPlan.name}</p>
            <p className="text-sm text-gray-500">{currentPlan.price}</p>
          </div>
          {trialActive && (
            <span className="text-xs font-medium text-indigo-700 bg-indigo-100 px-2 py-1 rounded-full">
              Trial — {trialDaysLeft} dia{trialDaysLeft !== 1 ? 's' : ''} restante{trialDaysLeft !== 1 ? 's' : ''}
            </span>
          )}
        </div>
        <ul className="mt-2 space-y-1">
          {currentPlan.features.map(f => (
            <li key={f} className="text-xs text-gray-600 flex items-center gap-1">
              <span className="text-green-500">✓</span> {f}
            </li>
          ))}
        </ul>
      </div>

      {account.plan_id === 'free' && (
        <div className="space-y-3">
          <p className="text-xs text-gray-500 flex items-center gap-2">
            Pagamento via
            <span className="font-semibold text-gray-700">PIX</span>·
            <span className="font-semibold text-gray-700">Boleto</span>·
            <span className="font-semibold text-gray-700">Cartão</span>
          </p>
          <div className="grid grid-cols-2 gap-3">
            {(['starter', 'pro'] as const).map(planId => {
              const plan = PLAN_LABELS[planId]
              return (
                <div key={planId} className="border border-gray-200 rounded-lg p-4">
                  <p className="font-medium text-gray-900">{plan.name}</p>
                  <p className="text-sm text-indigo-600 font-semibold mt-1">{plan.price}</p>
                  <ul className="mt-2 space-y-1 mb-3">
                    {plan.features.map(f => (
                      <li key={f} className="text-xs text-gray-500 flex items-center gap-1">
                        <span className="text-green-500">✓</span> {f}
                      </li>
                    ))}
                  </ul>
                  <button
                    onClick={() => handleUpgrade(planId)}
                    disabled={loading !== null}
                    className="w-full bg-indigo-600 text-white text-sm py-2 px-3 rounded-md hover:bg-indigo-700 disabled:opacity-50"
                  >
                    {loading === planId ? 'Redirecionando...' : 'Assinar'}
                  </button>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </section>
  )
}
