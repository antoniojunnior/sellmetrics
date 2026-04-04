import Link from 'next/link'

export default function SettingsLayout({ children }: { children: React.ReactNode }) {
  const tabs = [
    { name: 'Custos por SKU', href: '/dashboard/settings/costs' },
    { name: 'Custos Fixos', href: '/dashboard/settings/fixed-costs' },
    { name: 'Inputs Manuais', href: '/dashboard/settings/manual-inputs' },
  ]

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="border-b border-slate-200">
        <nav className="-mb-px flex space-x-8">
          {tabs.map((tab) => (
            <Link
              key={tab.name}
              href={tab.href}
              className="border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300 whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-all"
            >
              {tab.name}
            </Link>
          ))}
        </nav>
      </div>
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        {children}
      </div>
    </div>
  )
}
