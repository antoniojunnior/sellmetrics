import React from 'react'

export interface SectionBlockProps {
  title: string
  subtitle?: string
  children: React.ReactNode
  className?: string
  rightAction?: React.ReactNode
}

export function SectionBlock({ title, subtitle, children, className = '', rightAction }: SectionBlockProps) {
  return (
    <section className={`bg-white dark:bg-[#18181B] border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm overflow-hidden ${className}`}>
      <header className="px-6 py-5 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center">
        <div>
          <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 uppercase tracking-widest">{title}</h3>
          {subtitle && <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{subtitle}</p>}
        </div>
        {rightAction && <div>{rightAction}</div>}
      </header>
      <div className="p-6">
        {children}
      </div>
    </section>
  )
}

// -----------------------------------------------------------------------------

export interface StatusBadgeProps {
  status: 'ok' | 'warning' | 'error' | 'pending'
  label: string
}

export function StatusBadge({ status, label }: StatusBadgeProps) {
  const configs = {
    ok: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
    warning: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
    error: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
    pending: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400',
  }

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide ${configs[status]}`}>
      <span className={`w-1.5 h-1.5 rounded-full mr-1.5 ${status === 'ok' ? 'bg-green-500' : status === 'warning' ? 'bg-amber-500' : status === 'error' ? 'bg-red-500' : 'bg-slate-400'}`} />
      {label}
    </span>
  )
}

// -----------------------------------------------------------------------------

export interface DataTableProps {
  columns: { header: string; key: string; className?: string; render?: (val: any, row: any) => React.ReactNode }[]
  data: any[]
  emptyMessage?: string
}

export function DataTable({ columns, data, emptyMessage = 'Nenhum registro encontrado.' }: DataTableProps) {
  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-800">
        <thead className="bg-slate-50 dark:bg-black/20">
          <tr>
            {columns.map((col) => (
              <th key={col.key} className={`px-6 py-3 text-left text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest ${col.className}`}>
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="bg-white dark:bg-transparent divide-y divide-slate-100 dark:divide-slate-800">
          {data.length === 0 ? (
            <tr>
              <td colSpan={columns.length} className="px-6 py-10 text-center text-sm text-slate-400 dark:text-slate-600 italic">
                {emptyMessage}
              </td>
            </tr>
          ) : (
            data.map((row, idx) => (
              <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-white/5 transition-colors">
                {columns.map((col) => (
                  <td key={col.key} className={`px-6 py-4 whitespace-nowrap text-sm text-slate-600 dark:text-slate-300 ${col.className}`}>
                    {col.render ? col.render(row[col.key], row) : row[col.key]}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  )
}
