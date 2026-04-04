import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  return (
    <div className="flex h-screen bg-slate-50 dark:bg-[#0F0F11] font-sans selection:bg-indigo-100 selection:text-indigo-900">
      {/* Sidebar Desktop */}
      <aside className="hidden md:flex w-64 bg-slate-900 dark:bg-black flex-col h-full border-r border-slate-800">
        <header className="p-6 flex items-center gap-3">
          <div className="w-8 h-8 bg-indigo-500 rounded-lg flex items-center justify-center shadow-lg shadow-indigo-500/20">
            <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
            </svg>
          </div>
          <div>
            <h1 className="text-lg font-black text-white tracking-tight">Sellmetrics</h1>
            <p className="text-[9px] uppercase font-bold text-slate-500 tracking-widest">Cockpit v1.0</p>
          </div>
        </header>

        <nav className="flex-1 px-4 space-y-8 overflow-y-auto mt-4">
          <div>
            <p className="px-3 text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2">Análise</p>
            <Link href="/dashboard/period" className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-slate-300 hover:bg-white/10 hover:text-white transition-colors">
              <svg className="w-4 h-4 opacity-70" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" /></svg>
              Painel Geral
            </Link>
          </div>

          <div>
            <p className="px-3 text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2">Configuração</p>
            <div className="space-y-1">
              <Link href="/dashboard/settings/costs" className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-slate-300 hover:bg-white/10 hover:text-white transition-colors">
                <svg className="w-4 h-4 opacity-70" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" /></svg>
                Custos por SKU
              </Link>
              <Link href="/dashboard/settings/fixed-costs" className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-slate-300 hover:bg-white/10 hover:text-white transition-colors">
                <svg className="w-4 h-4 opacity-70" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>
                Custos Fixos
              </Link>
              <Link href="/dashboard/settings/manual-inputs" className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-slate-300 hover:bg-white/10 hover:text-white transition-colors">
                <svg className="w-4 h-4 opacity-70" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                Inputs Manuais
              </Link>
            </div>
          </div>

          <div>
            <p className="px-3 text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2">Sistema</p>
            <Link href="/dashboard/ingestion" className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-slate-300 hover:bg-white/10 hover:text-white transition-colors">
              <svg className="w-4 h-4 opacity-70" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>
              Ingestão de Dados
            </Link>
          </div>
        </nav>

        <footer className="p-4 border-t border-slate-800 mt-auto">
          <div className="flex items-center gap-3 px-2 py-2">
            <div className="w-8 h-8 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center font-bold text-xs uppercase text-slate-300">
              {user.email?.[0]}
            </div>
            <div className="overflow-hidden flex-1">
              <p className="text-xs font-bold text-slate-200 truncate">{user.email}</p>
              <form action="/auth/signout" method="POST">
                <button className="text-[10px] text-slate-500 hover:text-red-400 uppercase font-bold tracking-widest transition-colors mt-0.5">Sair da conta</button>
              </form>
            </div>
          </div>
        </footer>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Mobile Header (simplificado) */}
        <header className="md:hidden bg-slate-900 text-white h-16 border-b border-slate-800 flex items-center justify-between px-4 shrink-0">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-indigo-500 rounded flex items-center justify-center">
              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" /></svg>
            </div>
            <h1 className="text-sm font-black tracking-tight">Sellmetrics</h1>
          </div>
          {/* Implementação de menu mobile (hamburger) seria feita com JS client-side ou Checkbox hack, omitido aqui por foco no desktop */}
        </header>

        <div className="flex-1 overflow-y-auto">
          {children}
        </div>
      </main>
    </div>
  )
}
