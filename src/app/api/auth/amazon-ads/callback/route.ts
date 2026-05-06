import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { encrypt } from '@/lib/utils/encryption'
import { accountRepository } from '@/lib/supabase/repositories/account-repository'

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl
  const code = searchParams.get('code')
  const state = searchParams.get('state')
  const error = searchParams.get('error')

  if (error) {
    return NextResponse.redirect(new URL('/dashboard/account?error=ads_denied', request.url))
  }

  if (!code || !state) {
    return NextResponse.redirect(new URL('/dashboard/account?error=invalid_callback', request.url))
  }

  const cookieState = request.cookies.get('amazon_ads_oauth_state')?.value
  if (!cookieState || cookieState !== state) {
    return NextResponse.redirect(new URL('/dashboard/account?error=state_mismatch', request.url))
  }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  // Ads API uses the same LWA token endpoint
  const tokenRes = await fetch('https://api.amazon.com/auth/o2/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'authorization_code',
      code,
      redirect_uri: `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/amazon-ads/callback`,
      client_id: process.env.AMAZON_ADS_CLIENT_ID ?? '',
      client_secret: process.env.AMAZON_ADS_CLIENT_SECRET ?? '',
    }),
  })

  if (!tokenRes.ok) {
    const text = await tokenRes.text()
    console.error('[Amazon OAuth Ads] Token exchange failed:', text)
    return NextResponse.redirect(new URL('/dashboard/account?error=ads_token_failed', request.url))
  }

  const tokens = await tokenRes.json() as { refresh_token: string }

  const account = await accountRepository.getByUserId(user.id)
  if (!account) {
    return NextResponse.redirect(new URL('/dashboard/account?error=no_account', request.url))
  }

  const encrypted = encrypt(tokens.refresh_token)
  await accountRepository.updateEncryptedTokens(account.id, { ads_refresh_token_enc: encrypted })

  const response = NextResponse.redirect(new URL('/dashboard/account?success=ads_connected', request.url))
  response.cookies.delete('amazon_ads_oauth_state')
  return response
}
