import React from 'react'

export interface StatusBadgeProps {
  status: 'ok' | 'warning' | 'error' | 'pending'
  label: string
}

export function StatusBadge({ status, label }: StatusBadgeProps) {
  const configs = {
    ok: 'bg-positive-light text-positive',
    warning: 'bg-warning-light text-warning',
    error: 'bg-negative-light text-negative',
    pending: 'bg-slate-100 text-text-secondary',
  }

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide ${configs[status]}`}>
      <span className={`w-1.5 h-1.5 rounded-full mr-1.5 ${
        status === 'ok' ? 'bg-positive' : 
        status === 'warning' ? 'bg-warning' : 
        status === 'error' ? 'bg-negative' : 
        'bg-text-muted'
      }`} />
      {label}
    </span>
  )
}
