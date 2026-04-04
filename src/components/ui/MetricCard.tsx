import React from 'react'

export interface MetricCardProps {
  label: string
  value: string | number | null
  unit?: 'R$' | '%' | 'none'
  trend?: 'up' | 'down' | 'neutral'
  trendValue?: string
  size?: 'sm' | 'md' | 'lg'
  tooltip?: string
  highlight?: boolean
}

export function MetricCard({
  label,
  value,
  unit = 'none',
  trend,
  trendValue,
  size = 'md',
  tooltip,
  highlight = false,
}: MetricCardProps) {
  // Tratamento de valor nulo/ausente
  const isNull = value === null || value === undefined
  const displayValue = isNull 
    ? '—' 
    : unit === 'R$' 
      ? `R$ ${value}` 
      : unit === '%' 
        ? `${value}%` 
        : value

  // Estilos de tamanho
  const sizeClasses = {
    sm: 'p-4',
    md: 'p-5',
    lg: 'p-6',
  }

  const valueSizeClasses = {
    sm: 'text-xl',
    md: 'text-2xl',
    lg: 'text-3xl',
  }

  // Cores semânticas base (Dark mode integrado)
  const baseBg = highlight
    ? 'bg-indigo-50/50 dark:bg-indigo-900/10 border-indigo-200 dark:border-indigo-800/50'
    : 'bg-white dark:bg-[#18181B] border-slate-200 dark:border-slate-800'

  const labelColor = highlight
    ? 'text-indigo-600 dark:text-indigo-400'
    : 'text-slate-500 dark:text-slate-400'

  const valueColor = isNull
    ? 'text-slate-400 dark:text-slate-600'
    : highlight
      ? 'text-indigo-950 dark:text-indigo-50'
      : 'text-slate-900 dark:text-slate-50'

  // Ícones e Cores de Tendência (Trend)
  const trendIcon = {
    up: (
      <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 10l7-7m0 0l7 7m-7-7v18" />
      </svg>
    ),
    down: (
      <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
      </svg>
    ),
    neutral: (
      <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 12h14" />
      </svg>
    ),
  }

  const trendColor = {
    up: 'text-green-700 dark:text-green-400 bg-green-100 dark:bg-green-900/30',
    down: 'text-red-700 dark:text-red-400 bg-red-100 dark:bg-red-900/30',
    neutral: 'text-slate-700 dark:text-slate-400 bg-slate-100 dark:bg-slate-800',
  }

  return (
    <div 
      className={`relative flex flex-col rounded-2xl border shadow-sm transition-all duration-300 hover:shadow-md ${baseBg} ${sizeClasses[size]}`} 
      title={tooltip}
      role="region"
      aria-label={label}
    >
      <div className="flex justify-between items-start mb-3">
        <span className={`text-xs font-bold uppercase tracking-wider ${labelColor}`}>
          {label}
        </span>
        {trend && trendValue && !isNull && (
          <div className={`flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[10px] font-bold tracking-wide ${trendColor[trend]}`}>
            {trendIcon[trend]}
            <span>{trendValue}</span>
          </div>
        )}
      </div>
      <div className={`font-black tracking-tight truncate ${valueColor} ${valueSizeClasses[size]}`}>
        {displayValue}
      </div>
    </div>
  )
}
