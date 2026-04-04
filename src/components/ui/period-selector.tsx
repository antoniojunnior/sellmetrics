'use client'

import React from 'react'

export interface PeriodSelectorProps {
  startDate: string
  endDate: string
  sku?: string
}

export function PeriodSelector({ startDate, endDate, sku = '' }: PeriodSelectorProps) {
  const presets = [
    { label: '1D', days: 1 },
    { label: '7D', days: 7 },
    { label: '30D', days: 30 },
    { label: '90D', days: 90 },
  ]

  const handlePresetClick = (days: number) => {
    const end = new Date()
    const start = new Date()
    start.setDate(end.getDate() - (days - 1))
    
    const startStr = start.toISOString().split('T')[0]
    const endStr = end.toISOString().split('T')[0]

    const startInput = document.querySelector('input[name="startDate"]') as HTMLInputElement
    const endInput = document.querySelector('input[name="endDate"]') as HTMLInputElement
    const form = document.querySelector('#period-form') as HTMLFormElement

    if (startInput && endInput && form) {
      startInput.value = startStr
      endInput.value = endStr
      form.submit()
    }
  }

  return (
    <form id="period-form" method="GET" className="bg-surface border border-border rounded-xl p-3 flex flex-wrap items-center gap-4 shadow-card">
      <div className="flex items-center gap-1.5 p-1 bg-background rounded-lg border border-border/50">
        {presets.map((preset) => (
          <button
            key={preset.label}
            type="button"
            onClick={() => handlePresetClick(preset.days)}
            className="px-3 py-1.5 text-[11px] font-bold rounded-md hover:bg-surface hover:shadow-sm text-text-secondary hover:text-text-primary transition-all"
          >
            {preset.label}
          </button>
        ))}
      </div>

      <div className="h-8 w-[1px] bg-border mx-1 hidden sm:block" />

      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-black text-text-muted uppercase tracking-widest">Início</span>
          <input 
            type="date" 
            name="startDate" 
            defaultValue={startDate}
            className="bg-surface border border-border rounded-lg px-2 py-1.5 text-xs font-semibold text-text-primary focus:ring-2 focus:ring-accent/20 focus:border-accent outline-none"
          />
        </div>
        <span className="text-text-muted">—</span>
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-black text-text-muted uppercase tracking-widest">Fim</span>
          <input 
            type="date" 
            name="endDate" 
            defaultValue={endDate}
            className="bg-surface border border-border rounded-lg px-2 py-1.5 text-xs font-semibold text-text-primary focus:ring-2 focus:ring-accent/20 focus:border-accent outline-none"
          />
        </div>
      </div>

      <div className="flex items-center gap-2 ml-2">
        <span className="text-[10px] font-black text-text-muted uppercase tracking-widest">SKU</span>
        <input 
          type="text" 
          name="sku" 
          placeholder="Todos os produtos"
          defaultValue={sku}
          className="bg-surface border border-border rounded-lg px-3 py-1.5 text-xs font-semibold text-text-primary focus:ring-2 focus:ring-accent/20 focus:border-accent outline-none placeholder:text-text-muted w-40"
        />
      </div>

      <button 
        type="submit"
        className="ml-auto bg-accent text-white px-6 py-2 rounded-lg text-xs font-bold hover:bg-accent-hover transition-all shadow-sm active:scale-95"
      >
        Filtrar
      </button>
    </form>
  )
}
