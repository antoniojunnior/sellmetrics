'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

export default function SettingsLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  
  const tabs = [
    { name: 'Custos por SKU', href: '/dashboard/settings/costs' },
    { name: 'Custos Fixos', href: '/dashboard/settings/fixed-costs' },
    { name: 'Inputs Manuais', href: '/dashboard/settings/manual-inputs' },
  ]

  return (
    <div className="space-y-6">
      <div className="bg-surface border border-border rounded-xl shadow-card overflow-hidden">
        <nav className="flex border-b border-border bg-slate-50/50">
          {tabs.map((tab) => {
            const isActive = pathname === tab.href
            
            return (
              <Link
                key={tab.name}
                href={tab.href}
                className={`px-6 py-4 text-sm font-semibold transition-all border-b-2 ${
                  isActive 
                    ? 'border-accent text-accent bg-surface' 
                    : 'border-transparent text-text-secondary hover:text-text-primary hover:bg-surface/50'
                }`}
              >
                {tab.name}
              </Link>
            )
          })}
        </nav>
        <div className="p-6 md:p-8">
          {children}
        </div>
      </div>
    </div>
  )
}
