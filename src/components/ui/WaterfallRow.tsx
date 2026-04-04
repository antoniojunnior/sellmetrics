import React from 'react'

export interface WaterfallRowProps {
  label: string
  value: number | null
  type?: 'revenue' | 'cost' | 'result' | 'separator'
  percentage?: number // 0 a 100
}

export function WaterfallRow({
  label,
  value,
  type = 'revenue',
  percentage
}: WaterfallRowProps) {
  if (type === 'separator') {
    return <div className="my-2 border-t border-slate-200 dark:border-slate-800" role="separator" />
  }

  const isNull = value === null || value === undefined
  const displayValue = isNull 
    ? '—' 
    : new Intl.NumberFormat('pt-BR', { 
        style: 'currency', 
        currency: 'BRL',
        signDisplay: type === 'cost' && value > 0 ? 'always' : 'auto' 
      }).format(type === 'cost' ? -value : value)

  // Estilos baseados no tipo
  const styles = {
    revenue: {
      text: 'text-slate-900 dark:text-slate-100',
      label: 'text-slate-600 dark:text-slate-400',
      bar: 'bg-indigo-100 dark:bg-indigo-900/30',
      font: 'font-medium'
    },
    cost: {
      text: 'text-red-600 dark:text-red-400',
      label: 'text-slate-500 dark:text-slate-400',
      bar: 'bg-red-50 dark:bg-red-900/20',
      font: 'font-normal'
    },
    result: {
      text: 'text-indigo-600 dark:text-indigo-400',
      label: 'text-slate-900 dark:text-slate-100',
      bar: 'bg-indigo-200/50 dark:bg-indigo-900/50',
      font: 'font-bold'
    }
  }

  const currentStyle = styles[type as keyof typeof styles] || styles.revenue

  return (
    <div className="relative group py-2 px-1 rounded-lg transition-colors hover:bg-slate-50 dark:hover:bg-white/5">
      {/* Barra Proporcional de Fundo (se percentage for fornecido) */}
      {percentage !== undefined && !isNull && (
        <div 
          className={`absolute left-0 top-1 bottom-1 rounded-sm opacity-40 transition-all duration-500 ${currentStyle.bar}`}
          style={{ width: `${Math.min(Math.max(percentage, 0), 100)}%` }}
        />
      )}

      <div className="relative flex justify-between items-center text-sm">
        <span className={`${currentStyle.label} ${currentStyle.font}`}>
          {label}
        </span>
        <div className="flex items-center gap-2">
          {percentage !== undefined && !isNull && type !== 'result' && (
            <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500">
              {percentage.toFixed(1)}%
            </span>
          )}
          <span className={`font-mono tracking-tight ${currentStyle.text} ${currentStyle.font}`}>
            {displayValue}
          </span>
        </div>
      </div>
    </div>
  )
}
