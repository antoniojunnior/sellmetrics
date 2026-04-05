import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function updateSession(request: NextRequest) {
  // Resposta padrão caso algo falhe ou variáveis sumam
  let supabaseResponse = NextResponse.next({
    request,
  })

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!url || !key) {
    return supabaseResponse
  }

  try {
    const supabase = createServerClient(url, key, {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet: { name: string; value: string; options: CookieOptions }[]) {
          cookiesToSet.forEach(({ name, value, options }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    })

    // IMPORTANTE: getUser() faz uma chamada de rede para validar o token.
    // Se a rede falhar ou as chaves estiverem erradas, isso pode gerar um 500 se não tratado.
    const { data: { user } } = await supabase.auth.getUser()

    const isLoginPath = request.nextUrl.pathname.startsWith('/login')
    const isDashboardPath = request.nextUrl.pathname.startsWith('/dashboard')

    if (!user && isDashboardPath) {
      const url = request.nextUrl.clone()
      url.pathname = '/login'
      return NextResponse.redirect(url)
    }

    if (user && isLoginPath) {
      const url = request.nextUrl.clone()
      url.pathname = '/dashboard/period'
      return NextResponse.redirect(url)
    }
  } catch (e) {
    console.error('SUPABASE_MIDDLEWARE_ERROR', e)
  }

  return supabaseResponse
}
