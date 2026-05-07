'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

export default function LoginPage() {
  const [mode, setMode] = useState<'login' | 'signup'>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [signupDone, setSignupDone] = useState(false)
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const supabase = createClient()

      if (mode === 'login') {
        const { error } = await supabase.auth.signInWithPassword({ email, password })
        if (error) {
          setError(error.message)
          setLoading(false)
        } else {
          router.push('/dashboard/period')
          router.refresh()
        }
      } else {
        const { error } = await supabase.auth.signUp({ email, password })
        if (error) {
          setError(error.message)
          setLoading(false)
        } else {
          setSignupDone(true)
          setLoading(false)
        }
      }
    } catch {
      setError('Erro ao inicializar o cliente de autenticação. Verifique as configurações.')
      setLoading(false)
    }
  }

  const Spinner = () => (
    <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
    </svg>
  )

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-6">
      <div className="max-w-md w-full bg-surface p-8 rounded-2xl shadow-card border border-border">
        <header className="text-center mb-8">
          <div className="w-12 h-12 bg-accent rounded-xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-accent/20">
            <svg className="w-7 h-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
            </svg>
          </div>
          <h1 className="text-2xl font-black text-text-primary tracking-tight">Sellmetrics</h1>
          <p className="text-text-secondary text-sm mt-1">Cockpit financeiro para vendedores Amazon</p>
        </header>

        {/* Tab toggle */}
        <div className="flex rounded-xl border border-border overflow-hidden mb-6">
          <button
            type="button"
            onClick={() => { setMode('login'); setError(null); setSignupDone(false) }}
            className={`flex-1 py-2 text-sm font-bold transition-colors ${mode === 'login' ? 'bg-accent text-white' : 'bg-background text-text-secondary hover:text-text-primary'}`}
          >
            Entrar
          </button>
          <button
            type="button"
            onClick={() => { setMode('signup'); setError(null); setSignupDone(false) }}
            className={`flex-1 py-2 text-sm font-bold transition-colors ${mode === 'signup' ? 'bg-accent text-white' : 'bg-background text-text-secondary hover:text-text-primary'}`}
          >
            Criar conta
          </button>
        </div>

        {signupDone ? (
          <div className="p-4 bg-positive-light rounded-xl border border-positive/20 text-center space-y-2">
            <p className="text-sm font-bold text-positive">Conta criada!</p>
            <p className="text-xs text-text-secondary">Verifique seu e-mail para confirmar o cadastro e depois faça login para continuar o onboarding.</p>
            <button
              type="button"
              onClick={() => { setMode('login'); setSignupDone(false) }}
              className="mt-2 text-xs font-bold text-accent hover:underline"
            >
              Ir para login
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-1.5">
              <label className="block text-[10px] font-black uppercase text-text-muted tracking-widest">E-mail</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="seu@email.com"
                className="w-full px-4 py-2.5 rounded-xl border border-border bg-background/50 focus:ring-2 focus:ring-accent/20 focus:border-accent outline-none transition-all text-sm"
                required
              />
            </div>
            <div className="space-y-1.5">
              <label className="block text-[10px] font-black uppercase text-text-muted tracking-widest">Senha</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-4 py-2.5 rounded-xl border border-border bg-background/50 focus:ring-2 focus:ring-accent/20 focus:border-accent outline-none transition-all text-sm"
                required
              />
            </div>

            {error && (
              <div className="p-3 bg-negative-light rounded-lg border border-negative/10">
                <p className="text-xs text-negative font-semibold">{error}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-accent text-white py-3 rounded-xl font-bold hover:bg-accent-hover transition-all shadow-md shadow-accent/10 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? (
                <><Spinner /><span>{mode === 'login' ? 'Autenticando...' : 'Criando conta...'}</span></>
              ) : mode === 'login' ? 'Entrar no Cockpit' : 'Criar conta grátis'}
            </button>
          </form>
        )}
      </div>
    </div>
  )
}
