import type { SearchResult } from '@/types/search'

/**
 * Google Custom Search JSON API
 * 100 búsquedas/día gratis.
 * https://programmablesearchengine.google.com/
 *
 * Setup:
 * 1. Crear Custom Search Engine en https://programmablesearchengine.google.com/
 *    - "Search the entire web" = ON
 * 2. Obtener API key en https://console.cloud.google.com/apis/credentials
 *    - Enable "Custom Search API"
 * 3. Guardar CX (Search Engine ID) y API Key
 */

const API_URL = 'https://www.googleapis.com/customsearch/v1'

interface GoogleCSEItem {
  title: string
  link: string
  snippet: string
  pagemap?: {
    offer?: Array<{ price?: string; pricecurrency?: string }>
    product?: Array<{ name?: string }>
  }
}

export async function searchGoogleCustom(
  query: string,
  country: string,
  city: string
): Promise<SearchResult[]> {
  const apiKey = process.env.GOOGLE_CSE_API_KEY
  const cx = process.env.GOOGLE_CSE_CX

  if (!apiKey || !cx) return []

  const gl = getGoogleCountry(country)
  const results: SearchResult[] = []

  try {
    const params = new URLSearchParams({
      key: apiKey,
      cx,
      q: `${query} precio comprar${city ? ` ${city}` : ''} ${country}`,
      gl,
      hl: 'es',
      num: '10',
    })

    const res = await fetch(`${API_URL}?${params}`)

    if (!res.ok) {
      console.error(`[google-cse] HTTP ${res.status}`)
      return []
    }

    const data = await res.json()
    const items = (data.items || []) as GoogleCSEItem[]

    for (const item of items) {
      // Try to extract price from structured data or snippet
      let price = 'Ver precio'
      let currency = detectCurrency(gl)

      if (item.pagemap?.offer?.[0]?.price) {
        price = String(item.pagemap.offer[0].price)
        if (item.pagemap.offer[0].pricecurrency) {
          currency = item.pagemap.offer[0].pricecurrency
        }
      }

      const hostname = new URL(item.link).hostname.replace('www.', '')

      results.push({
        name: item.pagemap?.product?.[0]?.name || item.title,
        price,
        currency,
        store: hostname,
        url: item.link,
        availability: 'unknown',
        source: 'crawlee',
        notes: item.snippet.slice(0, 120),
      })
    }

    console.log(`[google-cse] Found ${results.length} results`)
  } catch (error) {
    console.error('[google-cse] Failed:', error)
  }

  return results
}

function getGoogleCountry(country: string): string {
  const map: Record<string, string> = {
    chile: 'cl', argentina: 'ar', colombia: 'co', mexico: 'mx',
    peru: 'pe', espana: 'es', brasil: 'br', canada: 'ca',
    'estados unidos': 'us', usa: 'us',
  }
  return map[country.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')] || 'us'
}

function detectCurrency(gl: string): string {
  const map: Record<string, string> = {
    cl: 'CLP', ar: 'ARS', co: 'COP', mx: 'MXN',
    pe: 'PEN', us: 'USD', es: 'EUR', br: 'BRL', ca: 'CAD',
  }
  return map[gl] || 'USD'
}
