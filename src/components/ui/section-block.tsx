import React from 'react'
import { Card } from './card'

export interface SectionBlockProps {
  title: string
  subtitle?: string
  children: React.ReactNode
  className?: string
  rightAction?: React.ReactNode
}

export function SectionBlock({ title, subtitle, children, className = '', rightAction }: SectionBlockProps) {
  return (
    <Card className={`overflow-hidden ${className}`}>
      <header className="flex justify-between items-center mb-6">
        <div>
          <h3 className="text-sm font-bold text-text-primary uppercase tracking-widest">{title}</h3>
          {subtitle && <p className="text-xs text-text-secondary mt-1">{subtitle}</p>}
        </div>
        {rightAction && <div>{rightAction}</div>}
      </header>
      <div>
        {children}
      </div>
    </Card>
  )
}
