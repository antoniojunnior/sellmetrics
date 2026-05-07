import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { createClient as createAdminClient } from '@supabase/supabase-js'
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
    const onboardingDone = request.cookies.get('sm_onboarding')?.value === 'done'
    if (!onboardingDone) {
      try {
        // Use service role to bypass RLS — avoids redirect loop when policies block the query
        const admin = createAdminClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL ?? '',
          process.env.SUPABASE_SERVICE_ROLE_KEY ?? '',
        )

        const { data: account } = await admin
          .from('accounts')
          .select('onboarding_completed')
          .or(`owner_id.eq.${user.id},id.eq.${user.id}`)
          .maybeSingle()

        if (account && !account.onboarding_completed) {
          const url = request.nextUrl.clone()
          url.pathname = '/dashboard/onboarding'
          return NextResponse.redirect(url)
        }

        if (!account) {
          // No account yet — send to onboarding to create one
          const url = request.nextUrl.clone()
          url.pathname = '/dashboard/onboarding'
          return NextResponse.redirect(url)
        }

        // account.onboarding_completed = true — cache in cookie
        supabaseResponse.cookies.set('sm_onboarding', 'done', {
          httpOnly: false,
          maxAge: 60 * 60 * 24 * 30,
          path: '/',
          sameSite: 'lax',
        })
      } catch {
        // DB unavailable — allow through, page handles it
      }
    }
  }

  return supabaseResponse
}
