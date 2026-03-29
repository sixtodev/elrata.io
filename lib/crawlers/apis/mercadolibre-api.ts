import type { SearchResult } from '@/types/search'
import { createSettingsClient } from '@/lib/supabase/server'

/**
 * MercadoLibre API oficial.
 *
 * SETUP:
 * 1. Crear app en https://developers.mercadolibre.com.ar/devcenter
 * 2. Obtener CLIENT_ID y CLIENT_SECRET
 * 3. Generar access token con OAuth2
 * 4. Guardar en .env.local:
 *    ML_CLIENT_ID=...
 *    ML_CLIENT_SECRET=...
 *    ML_ACCESS_TOKEN=...
 *
 * Site IDs:
 *   MLA = Argentina, MLC = Chile, MCO = Colombia, MLM = México
 *   MPE = Perú, MLU = Uruguay, MEC = Ecuador, MLV = Venezuela
 */

const SITE_IDS: Record<string, string> = {
  CL: 'MLC', AR: 'MLA', CO: 'MCO', MX: 'MLM',
  PE: 'MPE', UY: 'MLU', EC: 'MEC', VE: 'MLV',
}

const CURRENCIES: Record<string, string> = {
  CL: 'CLP', AR: 'ARS', CO: 'COP', MX: 'MXN',
  PE: 'PEN', UY: 'UYU', EC: 'USD', VE: 'VES',
}

/**
 * Carga tokens de ML desde Supabase. Si no hay tokens almacenados,
 * intenta generar uno nuevo via client_credentials (si hay credenciales).
 */
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

  // No hay tokens en DB — intentar generar uno con client_credentials
  await requestClientCredentialsToken()
}

/**
 * Persiste tokens de ML en Supabase para sobrevivir restarts.
 */
async function persistMLTokensToDB(accessToken: string, refreshToken?: string): Promise<void> {
  try {
    const supabase = createSettingsClient()
    await supabase.from('app_settings').upsert(
      {
        key: 'ml_tokens',
        value: {
          access_token: accessToken,
          refresh_token: refreshToken,
          updated_at: new Date().toISOString(),
        },
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'key' }
    )
  } catch (error) {
    console.error('[ml-api] Failed to persist tokens to DB:', error)
  }
}

export async function searchMercadoLibreAPI(
  product: string,
  countryCode: string,
  budget?: string
): Promise<SearchResult[]> {
  if (!process.env.ML_ACCESS_TOKEN) {
    await loadMLTokensFromDB()
  }

  const token = process.env.ML_ACCESS_TOKEN
  if (!token) {
    console.log('[ml-api] ML_ACCESS_TOKEN not set, skipping')
    return []
  }

  const siteId = SITE_IDS[countryCode]
  if (!siteId) return []

  const currency = CURRENCIES[countryCode] || 'USD'

  try {
    const priceMax = budget ? parsebudgetToNumber(budget) : null
    const priceParam = priceMax ? `&price_max=${Math.round(priceMax * 1.15)}` : ''
    const url = `https://api.mercadolibre.com/sites/${siteId}/search?q=${encodeURIComponent(product)}&limit=20${priceParam}`

    const res = await fetch(url, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })

    if (!res.ok) {
      console.error(`[ml-api] HTTP ${res.status}`)
      // Token might be expired — try refreshing
      if (res.status === 401) {
        await refreshMLToken()
        // Retry once
        return searchMercadoLibreAPI(product, countryCode)
      }
      return []
    }

    const data = await res.json()

    return (data.results || []).map((item: MLItem) => ({
      name: item.title,
      price: `$${item.price.toLocaleString()}`,
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
  } catch (error) {
    console.error('[ml-api] Failed:', error)
    return []
  }
}

async function refreshMLToken(): Promise<void> {
  const clientId = process.env.ML_CLIENT_ID
  const clientSecret = process.env.ML_CLIENT_SECRET
  const refreshToken = process.env.ML_REFRESH_TOKEN

  if (!clientId || !clientSecret) {
    console.error('[ml-api] Missing ML_CLIENT_ID or ML_CLIENT_SECRET')
    return
  }

  // Prefer refresh_token flow, fall back to client_credentials
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
    } catch (error) {
      console.error('[ml-api] refresh_token flow failed:', error)
    }
  }

  // Fallback: client_credentials (app-level, no user scope)
  await requestClientCredentialsToken()
}

async function requestClientCredentialsToken(): Promise<void> {
  const clientId = process.env.ML_CLIENT_ID
  const clientSecret = process.env.ML_CLIENT_SECRET

  if (!clientId || !clientSecret) {
    console.log('[ml-api] No ML_CLIENT_ID/ML_CLIENT_SECRET configured, skipping')
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
      const err = await res.json().catch(() => ({}))
      console.error('[ml-api] client_credentials failed:', res.status, err)
    }
  } catch (error) {
    console.error('[ml-api] client_credentials request failed:', error)
  }
}

function parsebudgetToNumber(budget: string): number | null {
  const cleaned = budget.replace(/[^0-9.,]/g, '')
  if (!cleaned) return null
  // Handle thousands separator (dot in CLP: $1.500.000 → 1500000)
  const dots = (cleaned.match(/\./g) || []).length
  const commas = (cleaned.match(/,/g) || []).length
  let num: number
  if (dots > 1) {
    num = parseFloat(cleaned.replace(/\./g, ''))
  } else if (commas > 0 && dots === 0) {
    num = parseFloat(cleaned.replace(/,/g, ''))
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
