import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Sidebar } from '@/components/ui/sidebar'

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
    <div className="flex h-screen bg-background font-sans overflow-hidden">
      <Sidebar userEmail={user.email || ''} navGroups={navGroups} />

      {/* Área de Conteúdo Principal - O preenchimento da esquerda é dinâmico via CSS mas aqui usamos uma abordagem simples de margem ou layout flexível */}
      <main className="flex-1 flex flex-col min-w-0 relative h-full">
        {/* Usamos um wrapper com padding-left que não conflite com a sidebar fixa */}
        <div className="flex-1 overflow-y-auto pl-[72px] md:pl-0 transition-all duration-300 ml-0 md:ml-[240px] group-[.is-collapsed]:md:ml-[72px]">
          <header className="h-14 bg-surface border-b border-border flex items-center justify-between px-8 sticky top-0 z-40">
            <div className="flex items-center gap-2 text-sm text-text-secondary font-medium">
              <span>App</span>
              <svg className="w-3 h-3 text-text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
              <span className="text-text-primary font-semibold">Dashboard</span>
            </div>
          </header>

          <div className="p-4 md:p-8">
            <div className="max-w-7xl mx-auto space-y-8">
              {children}
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
