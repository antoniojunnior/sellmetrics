import React from 'react'

interface BadgeProps {
  variant?: 'positive' | 'negative' | 'warning' | 'info' | 'neutral'
  children: React.ReactNode
}

export function Badge({ variant = 'neutral', children }: BadgeProps) {
  const styles = {
    positive: 'bg-positive-light text-positive',
    negative: 'bg-negative-light text-negative',
    warning: 'bg-warning-light text-warning',
    info: 'bg-info-light text-info',
    neutral: 'bg-slate-100 text-text-secondary',
  }

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold tracking-wide ${styles[variant]}`}>
      {children}
    </span>
  )
}
