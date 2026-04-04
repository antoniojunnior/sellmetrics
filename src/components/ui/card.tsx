import React from 'react'

interface CardProps {
  children: React.ReactNode
  className?: string
  title?: string
  subtitle?: string
  hoverable?: boolean
}

export function Card({ children, className = '', title, subtitle, hoverable = false }: CardProps) {
  return (
    <div className={`bg-surface border border-border rounded-xl shadow-card p-5 transition-all duration-150 ${hoverable ? 'hover:shadow-card-hover' : ''} ${className}`}>
      {(title || subtitle) && (
        <div className="mb-4">
          {title && <h3 className="text-base font-semibold text-text-primary">{title}</h3>}
          {subtitle && <p className="text-sm text-text-secondary">{subtitle}</p>}
        </div>
      )}
      {children}
    </div>
  )
}
