import React from 'react'

export function SkeletonCard() {
  return (
    <div className="animate-pulse bg-white dark:bg-[#18181B] border border-slate-200 dark:border-slate-800 rounded-2xl p-6 space-y-4">
      <div className="h-3 w-24 bg-slate-100 dark:bg-slate-800 rounded" />
      <div className="h-8 w-32 bg-slate-200 dark:bg-slate-700 rounded" />
    </div>
  )
}

export function SkeletonTable() {
  return (
    <div className="animate-pulse space-y-4">
      <div className="h-10 w-full bg-slate-100 dark:bg-slate-800 rounded-t-xl" />
      {[...Array(5)].map((_, i) => (
        <div key={i} className="h-12 w-full bg-slate-50 dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800" />
      ))}
    </div>
  )
}

export function SkeletonBar() {
  return <div className="animate-pulse h-10 bg-slate-100 dark:bg-slate-800 rounded-lg w-full" />
}
