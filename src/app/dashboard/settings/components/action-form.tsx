'use client'

import { useActionState } from 'react'
import { ActionResult } from '../types'

export type { ActionResult }

interface ActionFormProps {
  action: (prev: ActionResult | null, data: FormData) => Promise<ActionResult>
  children: React.ReactNode
  className?: string
}

export function ActionForm({ action, children, className }: ActionFormProps) {
  const [state, formAction] = useActionState(action, null)

  return (
    <form action={formAction} className={className}>
      {state?.error && (
        <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2 mb-4">
          {state.error}
        </p>
      )}
      {state?.ok && !state.error && (
        <p className="text-sm text-green-700 bg-green-50 border border-green-200 rounded-lg px-3 py-2 mb-4">
          Salvo com sucesso
        </p>
      )}
      {children}
    </form>
  )
}
