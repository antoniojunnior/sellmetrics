import React from 'react'

export function SkeletonCard() {
  return (
    <div className="animate-pulse bg-surface border border-border rounded-xl p-6 space-y-4 shadow-card">
      <div className="h-3 w-24 bg-slate-100 rounded" />
      <div className="h-8 w-32 bg-slate-200 rounded" />
    </div>
  )
}

export function SkeletonBar() {
  return <div className="animate-pulse h-10 bg-slate-100 rounded-lg w-full mb-3" />
}

export function SkeletonTable() {
  return (
    <div className="animate-pulse space-y-4">
      <div className="h-10 w-full bg-slate-100 rounded-t-xl" />
      {[...Array(5)].map((_, i) => (
        <div key={i} className="h-12 w-full bg-surface border-b border-border" />
      ))}
    </div>
  )
}
