'use client'

import React from 'react'

export interface PeriodSelectorProps {
  startDate: string
  endDate: string
  sku?: string
  onUpdate?: (data: { startDate: string; endDate: string; sku: string }) => void
}

export function PeriodSelector({ startDate, endDate, sku = '' }: PeriodSelectorProps) {
  // Nota: Como estamos em Server Components no Dashboard, o form submit GET é a forma mais limpa.
  // Este componente renderiza o formulário que atualiza a URL.

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

    // Busca os inputs no DOM e atualiza seus valores
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
    <form id="period-form" method="GET" className="bg-white dark:bg-[#18181B] border border-slate-200 dark:border-slate-800 rounded-2xl p-4 flex flex-wrap items-center gap-4 shadow-sm">
      <div className="flex items-center gap-1 mr-2">
        {presets.map((preset) => (
          <button
            key={preset.label}
            type="button"
            onClick={() => handlePresetClick(preset.days)}
            className="px-2.5 py-1.5 text-[10px] font-black rounded-lg border border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-white/5 text-slate-500 dark:text-slate-400 transition-colors"
          >
            {preset.label}
          </button>
        ))}
      </div>

      <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-50 dark:bg-black/20 rounded-xl border border-slate-100 dark:border-slate-800">
        <span className="text-[10px] font-bold text-slate-400 uppercase">Período</span>
        <input 
          type="date" 
          name="startDate" 
          defaultValue={startDate}
          className="bg-transparent border-none text-xs font-bold text-slate-700 dark:text-slate-200 focus:ring-0 p-0"
        />
        <span className="text-slate-300 dark:text-slate-700">—</span>
        <input 
          type="date" 
          name="endDate" 
          defaultValue={endDate}
          className="bg-transparent border-none text-xs font-bold text-slate-700 dark:text-slate-200 focus:ring-0 p-0"
        />
      </div>

      <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-50 dark:bg-black/20 rounded-xl border border-slate-100 dark:border-slate-800">
        <span className="text-[10px] font-bold text-slate-400 uppercase">SKU</span>
        <input 
          type="text" 
          name="sku" 
          placeholder="Todos os produtos"
          defaultValue={sku}
          className="bg-transparent border-none text-xs font-bold text-slate-700 dark:text-slate-200 focus:ring-0 p-0 placeholder:text-slate-400 w-32"
        />
      </div>

      <button 
        type="submit"
        className="ml-auto bg-indigo-600 dark:bg-indigo-500 text-white px-5 py-2 rounded-xl text-xs font-bold hover:bg-indigo-700 dark:hover:bg-indigo-400 transition-all shadow-md shadow-indigo-200 dark:shadow-none active:scale-95"
      >
        Atualizar Dados
      </button>
    </form>
  )
}
