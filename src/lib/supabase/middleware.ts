import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function updateSession(request: NextRequest) {
  try {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

    // Resposta padrão
    let supabaseResponse = NextResponse.next({ request })

    // Se as variáveis não existirem, não tentamos nada e apenas retornamos a página
    // Isso evita o erro 500 e permite que a aplicação mostre o erro no cliente
    if (!url || !key) {
      return supabaseResponse
    }

    const supabase = createServerClient(url, key, {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet: { name: string; value: string; options: CookieOptions }[]) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    })

    // getUser é seguro, se falhar ou o token for inválido, user será null
    const { data: { user } } = await supabase.auth.getUser()

    const isLoginPath = request.nextUrl.pathname.startsWith('/login')
    const isAuthPath = request.nextUrl.pathname.startsWith('/auth')
    const isDashboardPath = request.nextUrl.pathname.startsWith('/dashboard')

    if (!user && isDashboardPath) {
      const redirectUrl = request.nextUrl.clone()
      redirectUrl.pathname = '/login'
      return NextResponse.redirect(redirectUrl)
    }

    if (user && isLoginPath) {
      const redirectUrl = request.nextUrl.clone()
      redirectUrl.pathname = '/dashboard/period'
      return NextResponse.redirect(redirectUrl)
    }

    return supabaseResponse
  } catch (error) {
    // CAPTURA QUALQUER ERRO para evitar 500 Internal Server Error
    console.error('CRITICAL MIDDLEWARE ERROR:', error)
    return NextResponse.next({ request })
  }
}
