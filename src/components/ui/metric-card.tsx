import React from 'react'
import { Card } from './card'

interface MetricCardProps {
  label: string
  value: string | number | null
  unit?: string
  trend?: 'up' | 'down' | 'neutral'
  trendValue?: string
  highlight?: boolean
  className?: string
}

export function MetricCard({
  label,
  value,
  unit,
  trend,
  trendValue,
  highlight = false,
  className = ''
}: MetricCardProps) {
  const isPositive = trend === 'up'
  const isNegative = trend === 'down'

  return (
    <Card className={`${highlight ? 'border-l-[3px] border-l-accent' : ''} ${className}`}>
      <p className="text-[11px] font-medium text-text-secondary uppercase tracking-wider mb-1.5">{label}</p>
      <div className="flex items-baseline gap-1">
        <h4 className="text-2xl font-bold text-text-primary tracking-tight">
          {unit && <span className="text-sm font-medium mr-0.5">{unit}</span>}
          {value !== null ? value : '—'}
        </h4>
        
        {trend && trendValue && (
          <span className={`ml-2 inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] font-bold ${
            isPositive ? 'bg-positive-light text-positive' : 
            isNegative ? 'bg-negative-light text-negative' : 
            'bg-slate-100 text-text-secondary'
          }`}>
            {isPositive ? '↑' : isNegative ? '↓' : '→'} {trendValue}
          </span>
        )}
      </div>
    </Card>
  )
}
