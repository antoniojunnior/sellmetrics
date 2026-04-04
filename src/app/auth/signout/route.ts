import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  const supabase = await createClient()

  // Encerra a sessão no Supabase
  const { error } = await supabase.auth.signOut()

  if (error) {
    console.error('Error signing out:', error.message)
  }

  // Redireciona para a página de login
  const url = new URL(request.url)
  return NextResponse.redirect(new URL('/login', url.origin), {
    status: 302,
  })
}
