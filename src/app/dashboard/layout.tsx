import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const navGroups = [
    {
      label: 'ANÁLISE',
      items: [
        { name: 'Painel', href: '/dashboard/period', icon: (
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
        )},
      ]
    },
    {
      label: 'CONFIGURAÇÃO',
      items: [
        { name: 'Custos por SKU', href: '/dashboard/settings/costs', icon: (
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
          </svg>
        )},
        { name: 'Custos Fixos', href: '/dashboard/settings/fixed-costs', icon: (
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
        )},
        { name: 'Inputs Manuais', href: '/dashboard/settings/manual-inputs', icon: (
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
          </svg>
        )},
      ]
    },
    {
      label: 'SISTEMA',
      items: [
        { name: 'Ingestão de Dados', href: '/dashboard/ingestion', icon: (
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
          </svg>
        )},
      ]
    }
  ]

  return (
    <div className="flex h-screen bg-background font-sans">
      {/* Sidebar Desktop */}
      <aside className="w-[240px] bg-surface border-r border-border flex flex-col h-full fixed left-0 top-0 z-50">
        <header className="h-[72px] flex items-center px-6 mb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-accent rounded-lg flex items-center justify-center shadow-lg shadow-accent/20">
              <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
              </svg>
            </div>
            <h1 className="text-xl font-bold text-text-primary tracking-tight">Sellmetrics</h1>
          </div>
        </header>

        <nav className="flex-1 px-3 space-y-6 overflow-y-auto">
          {navGroups.map((group) => (
            <div key={group.label} className="space-y-1.5">
              <p className="px-3 text-[10px] font-bold text-text-muted uppercase tracking-[0.1em]">{group.label}</p>
              {group.items.map((item) => {
                // Lógica de "ativo" simplificada (em produção usaria usePathname)
                const isActive = false 
                
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all group ${
                      isActive 
                        ? 'bg-accent-light text-accent border-l-[3px] border-accent rounded-l-none -ml-3 pl-[15px]' 
                        : 'text-text-secondary hover:bg-slate-50 hover:text-text-primary'
                    }`}
                  >
                    <span className={`${isActive ? 'text-accent' : 'text-text-muted group-hover:text-text-primary'} transition-colors`}>
                      {item.icon}
                    </span>
                    {item.name}
                  </Link>
                )
              })}
            </div>
          ))}
        </nav>

        <footer className="p-4 border-t border-border mt-auto">
          <div className="flex items-center gap-3 px-2 py-2 bg-slate-50/50 rounded-xl border border-slate-100/50">
            <div className="w-9 h-9 rounded-full bg-accent-light text-accent flex items-center justify-center font-bold text-sm shadow-sm border border-accent/10 shrink-0">
              {user.email?.[0].toUpperCase()}
            </div>
            <div className="overflow-hidden flex-1">
              <p className="text-xs font-bold text-text-primary truncate leading-tight">{user.email?.split('@')[0]}</p>
              <p className="text-[10px] text-text-secondary truncate">{user.email}</p>
            </div>
            <form action="/auth/signout" method="POST">
              <button className="p-1.5 text-text-muted hover:text-negative hover:bg-negative-light/50 rounded-lg transition-colors">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
              </button>
            </form>
          </div>
        </footer>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col pl-[240px] min-w-0">
        <header className="h-14 bg-surface border-b border-border flex items-center justify-between px-8 sticky top-0 z-40">
          <div className="flex items-center gap-2 text-sm text-text-secondary font-medium">
            <span>App</span>
            <svg className="w-3 h-3 text-text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
            <span className="text-text-primary font-semibold">Dashboard</span>
          </div>
          <div className="flex items-center gap-4">
            {/* Espaço para ações globais */}
          </div>
        </header>

        <div className="flex-1 p-4 md:p-8 overflow-y-auto">
          <div className="max-w-7xl mx-auto space-y-8">
            {children}
          </div>
        </div>
      </main>
    </div>
  )
}
