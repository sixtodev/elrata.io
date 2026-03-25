import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'

/**
 * MercadoLibre OAuth2 callback.
 *
 * Flow:
 * 1. User authorizes app on MercadoLibre
 * 2. ML redirects here with ?code=TG-xxx
 * 3. We exchange code for access_token + refresh_token
 * 4. Store tokens in Supabase for persistence
 * 5. Redirect to dashboard
 */
export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get('code')

  if (!code) {
    return NextResponse.redirect(new URL('/dashboard?error=ml_no_code', request.url))
  }

  const clientId = process.env.ML_CLIENT_ID
  const clientSecret = process.env.ML_CLIENT_SECRET
  const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/mercadolibre/callback`

  if (!clientId || !clientSecret) {
    console.error('[ml-callback] ML_CLIENT_ID or ML_CLIENT_SECRET not configured')
    return NextResponse.redirect(new URL('/dashboard?error=ml_config', request.url))
  }

  try {
    // Exchange authorization code for tokens
    const tokenRes = await fetch('https://api.mercadolibre.com/oauth/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        client_id: clientId,
        client_secret: clientSecret,
        code,
        redirect_uri: redirectUri,
      }),
    })

    if (!tokenRes.ok) {
      const err = await tokenRes.text()
      console.error('[ml-callback] Token exchange failed:', err)
      return NextResponse.redirect(new URL('/dashboard?error=ml_token', request.url))
    }

    const tokens = await tokenRes.json()

    // Persist tokens in environment (runtime) for immediate use
    process.env.ML_ACCESS_TOKEN = tokens.access_token
    if (tokens.refresh_token) {
      process.env.ML_REFRESH_TOKEN = tokens.refresh_token
    }

    // Also persist in Supabase so tokens survive restarts
    const supabase = createServiceClient()
    await supabase.from('app_settings').upsert(
      {
        key: 'ml_tokens',
        value: {
          access_token: tokens.access_token,
          refresh_token: tokens.refresh_token,
          user_id: tokens.user_id,
          expires_in: tokens.expires_in,
          updated_at: new Date().toISOString(),
        },
      },
      { onConflict: 'key' }
    )

    console.log('[ml-callback] MercadoLibre tokens saved successfully')

    return NextResponse.redirect(new URL('/dashboard?ml=connected', request.url))
  } catch (error) {
    console.error('[ml-callback] Error:', error)
    return NextResponse.redirect(new URL('/dashboard?error=ml_error', request.url))
  }
}
