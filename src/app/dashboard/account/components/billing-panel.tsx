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

function formatCpfCnpj(value: string): string {
  const digits = value.replace(/\D/g, '')
  if (digits.length <= 11) {
    return digits
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d{1,2})$/, '$1-$2')
  }
  return digits
    .replace(/(\d{2})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d)/, '$1/$2')
    .replace(/(\d{4})(\d{1,2})$/, '$1-$2')
}

export default function BillingPanel({ account }: { account: Account }) {
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null)
  const [cpfCnpj, setCpfCnpj] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleUpgrade(e: React.FormEvent) {
    e.preventDefault()
    if (!selectedPlan) return
    setLoading(true)

    const res = await fetch('/api/checkout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ planId: selectedPlan, cpfCnpj: cpfCnpj.replace(/\D/g, '') }),
    })
    const data = await res.json() as { url?: string; error?: string }
    if (data.url) {
      window.location.href = data.url
    } else {
      setLoading(false)
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
        <div className="space-y-4">
          <p className="text-xs text-gray-500">
            Pagamento via <span className="font-semibold text-gray-700">PIX</span> · <span className="font-semibold text-gray-700">Boleto</span> · <span className="font-semibold text-gray-700">Cartão</span>
          </p>

          {/* Plan selection */}
          <div className="grid grid-cols-2 gap-3">
            {(['starter', 'pro'] as const).map(planId => {
              const plan = PLAN_LABELS[planId]
              const selected = selectedPlan === planId
              return (
                <button
                  key={planId}
                  type="button"
                  onClick={() => setSelectedPlan(planId)}
                  className={`text-left border rounded-lg p-4 transition-colors ${selected ? 'border-indigo-500 bg-indigo-50' : 'border-gray-200 hover:border-gray-300'}`}
                >
                  <p className="font-medium text-gray-900">{plan.name}</p>
                  <p className="text-sm text-indigo-600 font-semibold mt-1">{plan.price}</p>
                  <ul className="mt-2 space-y-1">
                    {plan.features.map(f => (
                      <li key={f} className="text-xs text-gray-500 flex items-center gap-1">
                        <span className="text-green-500">✓</span> {f}
                      </li>
                    ))}
                  </ul>
                </button>
              )
            })}
          </div>

          {/* CPF/CNPJ + confirm */}
          {selectedPlan && (
            <form onSubmit={handleUpgrade} className="space-y-3 pt-2 border-t border-gray-100">
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">CPF ou CNPJ</label>
                <input
                  type="text"
                  value={cpfCnpj}
                  onChange={e => setCpfCnpj(formatCpfCnpj(e.target.value))}
                  placeholder="000.000.000-00 ou 00.000.000/0001-00"
                  maxLength={18}
                  required
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-400"
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-indigo-600 text-white text-sm py-2.5 rounded-md font-semibold hover:bg-indigo-700 disabled:opacity-50"
              >
                {loading ? 'Redirecionando...' : `Assinar ${PLAN_LABELS[selectedPlan].name}`}
              </button>
            </form>
          )}
        </div>
      )}
    </section>
  )
}
