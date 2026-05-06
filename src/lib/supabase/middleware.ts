import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

const ONBOARDING_EXEMPT = [
  '/dashboard/onboarding',
  '/dashboard/account',
  '/api/',
]

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL ?? '',
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? '',
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet: Array<{ name: string; value: string; options: CookieOptions }>) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()
  const { pathname } = request.nextUrl

  if (!user && pathname.startsWith('/dashboard')) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    return NextResponse.redirect(url)
  }

  // Onboarding gate: redirect to /dashboard/onboarding if not completed
  if (
    user &&
    pathname.startsWith('/dashboard') &&
    !ONBOARDING_EXEMPT.some(p => pathname.startsWith(p))
  ) {
    // Check via cookie to avoid DB query on every request
    const onboardingDone = request.cookies.get('sm_onboarding')?.value === 'done'
    if (!onboardingDone) {
      try {
        const { data: account } = await supabase
          .from('accounts')
          .select('onboarding_completed')
          .eq('owner_id', user.id)
          .maybeSingle()

        if (account && !account.onboarding_completed) {
          const url = request.nextUrl.clone()
          url.pathname = '/dashboard/onboarding'
          return NextResponse.redirect(url)
        }

        if (account?.onboarding_completed) {
          supabaseResponse.cookies.set('sm_onboarding', 'done', {
            httpOnly: false,
            maxAge: 60 * 60 * 24 * 30, // 30 days
            path: '/',
            sameSite: 'lax',
          })
        }
      } catch {
        // accounts table not yet created — skip onboarding gate
      }
    }
  }

  return supabaseResponse
}
