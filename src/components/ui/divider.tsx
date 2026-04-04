import React from 'react'

interface DividerProps {
  orientation?: 'horizontal' | 'vertical'
  className?: string
}

export function Divider({ orientation = 'horizontal', className = '' }: DividerProps) {
  if (orientation === 'vertical') {
    return <div className={`w-[1px] bg-border self-stretch ${className}`} />
  }
  return <div className={`h-[1px] w-full bg-border ${className}`} />
}
