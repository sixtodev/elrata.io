import type { SearchResult } from '@/types/search'
import { createSettingsClient } from '@/lib/supabase/server'

/**
 * MercadoLibre API oficial.
 *
 * Site IDs:
 *   MLA = Argentina, MLC = Chile, MCO = Colombia, MLM = México
 *   MPE = Perú, MLU = Uruguay, MEC = Ecuador, MLV = Venezuela
 *
 * NOTE: The public search endpoint works WITHOUT auth.
 * Auth only adds: price filters, higher rate limits.
 * We try with auth first, fall back to public search.
 */

const SITE_IDS: Record<string, string> = {
  CL: 'MLC', AR: 'MLA', CO: 'MCO', MX: 'MLM',
  PE: 'MPE', UY: 'MLU', EC: 'MEC', VE: 'MLV',
}

const CURRENCIES: Record<string, string> = {
  CL: 'CLP', AR: 'ARS', CO: 'COP', MX: 'MXN',
  PE: 'PEN', UY: 'UYU', EC: 'USD', VE: 'VES',
}

export async function searchMercadoLibreAPI(
  product: string,
  countryCode: string,
  budget?: string
): Promise<SearchResult[]> {
  const siteId = SITE_IDS[countryCode]
  if (!siteId) return []

  const currency = CURRENCIES[countryCode] || 'USD'

  // Load token if not in env
  if (!process.env.ML_ACCESS_TOKEN) {
    await loadMLTokensFromDB()
  }

  const token = process.env.ML_ACCESS_TOKEN
  const priceMax = budget ? parseBudgetToNumber(budget) : null
  const priceParam = priceMax && token ? `&price_max=${Math.round(priceMax * 1.15)}` : ''
  const baseUrl = `https://api.mercadolibre.com/sites/${siteId}/search?q=${encodeURIComponent(product)}&limit=20`

  // ── Try 1: authenticated (gives price filter + higher rate limits) ──
  if (token) {
    try {
      const res = await fetch(`${baseUrl}${priceParam}`, {
        headers: { Authorization: `Bearer ${token}` },
      })

      if (res.ok) {
        const data = await res.json()
        const results = mapMLResults(data.results || [], currency, countryCode)
        console.log(`[ml-api] ✓ ${results.length} results from ML ${siteId} (auth)`)
        return results
      }

      const errText = await res.text().catch(() => '')
      console.error(`[ml-api] Auth failed HTTP ${res.status}:`, errText.slice(0, 300))

      // On 401: refresh token and retry once
      if (res.status === 401) {
        process.env.ML_ACCESS_TOKEN = ''
        await refreshMLToken()
        const newToken = process.env.ML_ACCESS_TOKEN
        if (newToken) {
          const retry = await fetch(`${baseUrl}${priceParam}`, {
            headers: { Authorization: `Bearer ${newToken}` },
          })
          if (retry.ok) {
            const data = await retry.json()
            const results = mapMLResults(data.results || [], currency, countryCode)
            console.log(`[ml-api] ✓ ${results.length} results from ML ${siteId} (auth after refresh)`)
            return results
          }
          const retryErr = await retry.text().catch(() => '')
          console.error(`[ml-api] Retry after refresh failed HTTP ${retry.status}:`, retryErr.slice(0, 200))
        }
      }
    } catch (error) {
      console.error('[ml-api] Auth request exception:', error)
    }
  }

  // ── Try 2: public search — no auth, always works for product search ──
  try {
    console.log(`[ml-api] Falling back to public search for ML ${siteId}`)
    const res = await fetch(baseUrl)
    if (res.ok) {
      const data = await res.json()
      const results = mapMLResults(data.results || [], currency, countryCode)
      console.log(`[ml-api] ✓ ${results.length} results from ML ${siteId} (public)`)
      return results
    }
    const errText = await res.text().catch(() => '')
    console.error(`[ml-api] Public search failed HTTP ${res.status}:`, errText.slice(0, 200))
  } catch (error) {
    console.error('[ml-api] Public search exception:', error)
  }

  return []
}

// ── Token management ──────────────────────────────────────────────────────────

async function loadMLTokensFromDB(): Promise<void> {
  try {
    const supabase = createSettingsClient()
    const { data } = await supabase
      .from('app_settings')
      .select('value')
      .eq('key', 'ml_tokens')
      .single()

    if (data?.value) {
      const tokens = data.value as { access_token?: string; refresh_token?: string }
      if (tokens.access_token) process.env.ML_ACCESS_TOKEN = tokens.access_token
      if (tokens.refresh_token) process.env.ML_REFRESH_TOKEN = tokens.refresh_token
      console.log('[ml-api] Tokens loaded from Supabase')
      return
    }
  } catch (error) {
    console.error('[ml-api] Failed to load tokens from DB:', error)
  }

  await requestClientCredentialsToken()
}

async function persistMLTokensToDB(accessToken: string, refreshToken?: string): Promise<void> {
  try {
    const supabase = createSettingsClient()
    await supabase.from('app_settings').upsert(
      {
        key: 'ml_tokens',
        value: { access_token: accessToken, refresh_token: refreshToken, updated_at: new Date().toISOString() },
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'key' }
    )
  } catch (error) {
    console.error('[ml-api] Failed to persist tokens to DB:', error)
  }
}

async function refreshMLToken(): Promise<void> {
  const clientId = process.env.ML_CLIENT_ID
  const clientSecret = process.env.ML_CLIENT_SECRET
  if (!clientId || !clientSecret) {
    console.error('[ml-api] Missing ML_CLIENT_ID or ML_CLIENT_SECRET for refresh')
    return
  }

  const refreshToken = process.env.ML_REFRESH_TOKEN
  if (refreshToken) {
    try {
      const res = await fetch('https://api.mercadolibre.com/oauth/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          grant_type: 'refresh_token',
          client_id: clientId,
          client_secret: clientSecret,
          refresh_token: refreshToken,
        }),
      })
      if (res.ok) {
        const data = await res.json()
        process.env.ML_ACCESS_TOKEN = data.access_token
        if (data.refresh_token) process.env.ML_REFRESH_TOKEN = data.refresh_token
        await persistMLTokensToDB(data.access_token, data.refresh_token)
        console.log('[ml-api] Token refreshed via refresh_token')
        return
      }
      const err = await res.text().catch(() => '')
      console.error('[ml-api] refresh_token failed:', res.status, err.slice(0, 200))
    } catch (error) {
      console.error('[ml-api] refresh_token exception:', error)
    }
  }

  await requestClientCredentialsToken()
}

async function requestClientCredentialsToken(): Promise<void> {
  const clientId = process.env.ML_CLIENT_ID
  const clientSecret = process.env.ML_CLIENT_SECRET
  if (!clientId || !clientSecret) {
    console.log('[ml-api] No ML_CLIENT_ID/ML_CLIENT_SECRET — skipping token generation')
    return
  }

  try {
    const res = await fetch('https://api.mercadolibre.com/oauth/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type: 'client_credentials',
        client_id: clientId,
        client_secret: clientSecret,
      }),
    })

    if (res.ok) {
      const data = await res.json()
      process.env.ML_ACCESS_TOKEN = data.access_token
      await persistMLTokensToDB(data.access_token)
      console.log('[ml-api] Token obtained via client_credentials')
    } else {
      const err = await res.text().catch(() => '')
      console.error('[ml-api] client_credentials failed:', res.status, err.slice(0, 200))
    }
  } catch (error) {
    console.error('[ml-api] client_credentials exception:', error)
  }
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function mapMLResults(items: MLItem[], currency: string, countryCode: string): SearchResult[] {
  return items.map((item) => ({
    name: item.title,
    price: `$${item.price.toLocaleString('es-CL')}`,
    currency: item.currency_id || currency,
    store: `MercadoLibre ${countryCode}`,
    store_id: undefined,
    url: item.permalink,
    availability: item.available_quantity > 0 ? 'in_stock' as const : 'limited' as const,
    source: 'crawlee' as const,
    scraper_type: 'crawlee_dedicated',
    image: item.thumbnail || null,
    notes: [
      item.shipping?.free_shipping ? 'Envío gratis' : '',
      item.condition === 'new' ? 'Nuevo' : item.condition === 'used' ? 'Usado' : '',
    ].filter(Boolean).join(', ') || undefined,
  }))
}

function parseBudgetToNumber(budget: string): number | null {
  const cleaned = budget.replace(/[^0-9.,]/g, '')
  if (!cleaned) return null
  const dots = (cleaned.match(/\./g) || []).length
  let num: number
  if (dots > 1) {
    num = parseFloat(cleaned.replace(/\./g, ''))
  } else {
    num = parseFloat(cleaned.replace(/,/g, ''))
  }
  return isFinite(num) && num > 0 ? num : null
}

interface MLItem {
  title: string
  price: number
  currency_id: string
  permalink: string
  thumbnail: string | null
  condition: string
  available_quantity: number
  shipping?: { free_shipping?: boolean }
}
