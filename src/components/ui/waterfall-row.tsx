import React from 'react'

export interface WaterfallRowProps {
  label: string
  value: number | null
  type?: 'revenue' | 'cost' | 'result' | 'separator'
  percentage?: number
}

export function WaterfallRow({
  label,
  value,
  type = 'revenue',
  percentage
}: WaterfallRowProps) {
  if (type === 'separator') {
    return <div className="my-3 border-t border-border" role="separator" />
  }

  const isNull = value === null || value === undefined
  const displayValue = isNull 
    ? '—' 
    : new Intl.NumberFormat('pt-BR', { 
        style: 'currency', 
        currency: 'BRL',
        signDisplay: type === 'cost' && value > 0 ? 'always' : 'auto' 
      }).format(type === 'cost' ? -value : value)

  const styles = {
    revenue: {
      text: 'text-text-primary',
      label: 'text-text-secondary font-medium',
      bar: 'bg-info-light/40',
    },
    cost: {
      text: 'text-negative',
      label: 'text-text-secondary',
      bar: 'bg-negative-light/40',
    },
    result: {
      text: 'text-accent',
      label: 'text-text-primary font-bold',
      bar: 'bg-accent-light',
    }
  }

  const currentStyle = styles[type as keyof typeof styles] || styles.revenue

  return (
    <div className="relative py-2.5 px-2 rounded-lg transition-colors hover:bg-background group">
      {percentage !== undefined && !isNull && (
        <div 
          className={`absolute left-0 top-1.5 bottom-1.5 rounded-md opacity-30 transition-all duration-700 ${currentStyle.bar}`}
          style={{ width: `${Math.min(Math.max(percentage, 0), 100)}%` }}
        />
      )}

      <div className="relative flex justify-between items-center text-sm">
        <span className={currentStyle.label}>{label}</span>
        <div className="flex items-center gap-3">
          {percentage !== undefined && !isNull && type !== 'result' && (
            <span className="text-[10px] font-bold text-text-muted">{percentage.toFixed(1)}%</span>
          )}
          <span className={`font-bold tabular-nums ${currentStyle.text}`}>{displayValue}</span>
        </div>
      </div>
    </div>
  )
}
