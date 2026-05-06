export const runtime = 'edge'

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { encrypt } from '@/lib/utils/encryption'
import { accountRepository } from '@/lib/supabase/repositories/account-repository'

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl
  const spApiCode = searchParams.get('spapi_oauth_code')
  const state = searchParams.get('state')
  const error = searchParams.get('error')

  if (error) {
    return NextResponse.redirect(new URL('/dashboard/account?error=amazon_denied', request.url))
  }

  if (!spApiCode || !state) {
    return NextResponse.redirect(new URL('/dashboard/account?error=invalid_callback', request.url))
  }

  // Validate CSRF state from cookie
  const cookieState = request.cookies.get('amazon_oauth_state')?.value
  if (!cookieState || cookieState !== state) {
    return NextResponse.redirect(new URL('/dashboard/account?error=state_mismatch', request.url))
  }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  // Exchange code for tokens
  const tokenRes = await fetch('https://api.amazon.com/auth/o2/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'authorization_code',
      code: spApiCode,
      redirect_uri: `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/amazon/callback`,
      client_id: process.env.AMAZON_CLIENT_ID ?? '',
      client_secret: process.env.AMAZON_CLIENT_SECRET ?? '',
    }),
  })

  if (!tokenRes.ok) {
    const text = await tokenRes.text()
    console.error('[Amazon OAuth SP-API] Token exchange failed:', text)
    return NextResponse.redirect(new URL('/dashboard/account?error=token_exchange_failed', request.url))
  }

  const tokens = await tokenRes.json() as { refresh_token: string }

  // Find account for this user and save encrypted token
  const account = await accountRepository.getByUserId(user.id)
  if (!account) {
    return NextResponse.redirect(new URL('/dashboard/account?error=no_account', request.url))
  }

  const encrypted = await encrypt(tokens.refresh_token)
  await accountRepository.updateEncryptedTokens(account.id, { sp_api_refresh_token_enc: encrypted })

  // Advance onboarding to step 2 if still on step 1
  if (account.onboarding_step <= 1) {
    await accountRepository.advanceOnboarding(account.id, 2)
  }

  const response = NextResponse.redirect(new URL('/dashboard/account?success=amazon_connected', request.url))
  response.cookies.delete('amazon_oauth_state')
  return response
}
