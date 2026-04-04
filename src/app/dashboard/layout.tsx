import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const menuItems = [
    { name: 'Painel Geral', href: '/dashboard/period', icon: '📊' },
    { name: 'Ingestão de Dados', href: '/dashboard/ingestion', icon: '📥' },
    { name: 'Custos por SKU', href: '/dashboard/settings/costs', icon: '🏷️' },
    { name: 'Custos Fixos', href: '/dashboard/settings/fixed-costs', icon: '🏢' },
    { name: 'Inputs Manuais', href: '/dashboard/settings/manual-inputs', icon: '⌨️' },
  ]

  return (
    <div className="flex h-screen bg-slate-50">
      {/* Sidebar */}
      <aside className="w-64 bg-slate-900 text-white flex flex-col h-full shadow-2xl">
        <header className="p-6 border-b border-slate-800">
          <h1 className="text-xl font-black text-indigo-400">Sellmetrics</h1>
          <p className="text-[10px] uppercase font-bold text-slate-500 tracking-tighter">Amazon Cockpit</p>
        </header>

        <nav className="flex-1 p-4 space-y-1">
          {menuItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium text-slate-400 hover:bg-slate-800 hover:text-white transition-all"
            >
              <span>{item.icon}</span>
              {item.name}
            </Link>
          ))}
        </nav>

        <footer className="p-4 border-t border-slate-800">
          <div className="flex items-center gap-3 px-4 py-3">
            <div className="w-8 h-8 rounded-full bg-indigo-500 flex items-center justify-center font-bold text-xs uppercase">
              {user.email?.[0]}
            </div>
            <div className="overflow-hidden">
              <p className="text-xs font-bold truncate">{user.email}</p>
              <form action="/auth/signout" method="POST">
                <button className="text-[10px] text-slate-500 hover:text-red-400 uppercase font-bold tracking-wider">Sair</button>
              </form>
            </div>
          </div>
        </footer>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto">
        <header className="bg-white h-16 border-b border-slate-200 flex items-center justify-between px-8 sticky top-0 z-10">
          <h2 className="text-sm font-bold text-slate-500 uppercase tracking-widest">Dashboard</h2>
          <div className="flex items-center gap-4">
            <span className="text-xs font-bold text-slate-400 bg-slate-100 px-2 py-1 rounded">v1.0.0</span>
          </div>
        </header>
        <div className="p-0">
          {children}
        </div>
      </main>
    </div>
  )
}
