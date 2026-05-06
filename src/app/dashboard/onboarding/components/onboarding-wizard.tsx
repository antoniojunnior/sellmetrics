'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Account } from '@/lib/supabase/types'
import { advanceOnboardingStep, startAmazonOAuth } from '../../account/actions'
import { runOnboardingIngestion } from '../actions'

const STEPS = [
  {
    number: 1,
    title: 'Conectar Amazon SP-API',
    description: 'Autorize o Sellmetrics a ler seus dados de vendas, pedidos e relatórios.',
    cta: 'Conectar Amazon',
  },
  {
    number: 2,
    title: 'Cadastrar custo do primeiro SKU',
    description: 'Informe COGS, prep, imposto e taxa Amazon para seu produto principal.',
    cta: 'Ir para Custos',
    href: '/dashboard/settings/costs',
  },
  {
    number: 3,
    title: 'Carregar histórico de 30 dias',
    description: 'Importamos suas vendas dos últimos 30 dias para o dashboard ficar pronto.',
    cta: 'Iniciar importação',
  },
  {
    number: 4,
    title: 'Ver seu P&L',
    description: 'Pronto! Veja seu lucro real, margem e ROAS no dashboard.',
    cta: 'Ver dashboard',
    href: '/dashboard/period',
  },
]

interface Props {
  account: Account
  userId: string
}

export default function OnboardingWizard({ account, userId }: Props) {
  const router = useRouter()
  const currentStep = account.onboarding_step
  const [loading, setLoading] = useState(false)
  const [ingestionError, setIngestionError] = useState<string | null>(null)

  async function handleStep3Ingestion() {
    setLoading(true)
    setIngestionError(null)

    const result = await runOnboardingIngestion(account.id)
    if (!result.ok) {
      setIngestionError(result.error ?? 'Erro ao importar dados')
    } else {
      router.refresh()
    }
    setLoading(false)
  }

  async function handleFinalStep() {
    await advanceOnboardingStep(account.id, 4)
    router.push('/dashboard/period')
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      {/* Progress bar */}
      <div className="h-1 bg-gray-100">
        <div
          className="h-full bg-indigo-600 transition-all duration-500"
          style={{ width: `${Math.min((currentStep / 4) * 100, 100)}%` }}
        />
      </div>

      <div className="p-6 space-y-4">
        {STEPS.map(step => {
          const done = currentStep > step.number
          const active = currentStep === step.number
          const locked = currentStep < step.number

          return (
            <div
              key={step.number}
              className={`flex gap-4 p-4 rounded-lg transition-colors ${
                active ? 'bg-indigo-50 border border-indigo-100' :
                done ? 'bg-gray-50' : 'opacity-40'
              }`}
            >
              <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                done ? 'bg-green-100 text-green-700' :
                active ? 'bg-indigo-600 text-white' :
                'bg-gray-200 text-gray-500'
              }`}>
                {done ? '✓' : step.number}
              </div>

              <div className="flex-1">
                <p className="font-medium text-gray-900 text-sm">{step.title}</p>
                <p className="text-xs text-gray-500 mt-0.5">{step.description}</p>

                {active && !locked && (
                  <div className="mt-3">
                    {step.number === 1 && (
                      <form action={startAmazonOAuth}>
                        <button
                          type="submit"
                          className="bg-indigo-600 text-white text-sm px-4 py-2 rounded-md hover:bg-indigo-700"
                        >
                          {step.cta}
                        </button>
                      </form>
                    )}

                    {step.number === 2 && step.href && (
                      <Link
                        href={step.href}
                        className="inline-block bg-indigo-600 text-white text-sm px-4 py-2 rounded-md hover:bg-indigo-700"
                      >
                        {step.cta}
                      </Link>
                    )}

                    {step.number === 3 && (
                      <div className="space-y-2">
                        <button
                          onClick={handleStep3Ingestion}
                          disabled={loading}
                          className="bg-indigo-600 text-white text-sm px-4 py-2 rounded-md hover:bg-indigo-700 disabled:opacity-50"
                        >
                          {loading ? 'Importando...' : step.cta}
                        </button>
                        {ingestionError && (
                          <p className="text-xs text-red-600">{ingestionError}</p>
                        )}
                      </div>
                    )}

                    {step.number === 4 && (
                      <button
                        onClick={handleFinalStep}
                        className="bg-green-600 text-white text-sm px-4 py-2 rounded-md hover:bg-green-700"
                      >
                        {step.cta}
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
