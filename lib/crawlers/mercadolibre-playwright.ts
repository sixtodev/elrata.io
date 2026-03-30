import type { SearchResult } from '@/types/search'

const SITE_CODES: Record<string, string> = {
  CL: 'MLC', AR: 'MLA', CO: 'MCO', MX: 'MLM',
  PE: 'MPE', UY: 'MLU', EC: 'MEC', VE: 'MLV',
}

const CURRENCIES: Record<string, string> = {
  CL: 'CLP', AR: 'ARS', CO: 'COP', MX: 'MXN',
  PE: 'PEN', UY: 'UYU', EC: 'USD', VE: 'VES',
}

export async function searchMercadoLibrePlaywright(
  product: string,
  countryCode: string,
  budget?: string
): Promise<SearchResult[]> {
  const siteCode = SITE_CODES[countryCode]
  if (!siteCode) return []

  const apiKey = process.env.SCRAPERAPI_KEY
  if (!apiKey) {
    console.error('[ml-api] SCRAPERAPI_KEY not set')
    return []
  }

  const currency = CURRENCIES[countryCode] || 'USD'
  const store = `MercadoLibre ${countryCode}`

  const mlApiUrl = `https://api.mercadolibre.com/sites/${siteCode}/search?q=${encodeURIComponent(product)}&limit=20`

  console.log(`[ml-api] Fetching: ${mlApiUrl}`)

  try {
    // Try ML API directly first (fast, no proxy overhead)
    let res = await fetch(mlApiUrl, {
      headers: { 'User-Agent': 'Mozilla/5.0', 'Accept': 'application/json' },
      signal: AbortSignal.timeout(15000),
    }).catch(() => null)

    // If blocked (403/429), fall back to ScraperAPI
    if (!res || res.status === 403 || res.status === 429) {
      console.log(`[ml-api] Direct blocked (${res?.status ?? 'timeout'}), retrying via ScraperAPI...`)
      const scraperUrl = `https://api.scraperapi.com?api_key=${apiKey}&url=${encodeURIComponent(mlApiUrl)}`
      res = await fetch(scraperUrl, { signal: AbortSignal.timeout(50000) })
    }

    if (!res.ok) {
      console.error(`[ml-api] ScraperAPI error: ${res.status}`)
      return []
    }

    const data = await res.json()
    const mlResults = data?.results

    if (!Array.isArray(mlResults)) {
      console.warn('[ml-api] Unexpected response shape:', JSON.stringify(data).slice(0, 200))
      return []
    }

    console.log(`[ml-api] Raw items: ${mlResults.length}`)

    const priceMax = budget ? parseBudget(budget) : null

    const results: SearchResult[] = mlResults
      .filter((item: Record<string, unknown>) => item.title && item.permalink)
      .filter((item: Record<string, unknown>) => {
        if (!priceMax || !item.price) return true
        return (item.price as number) <= priceMax * 1.15
      })
      .map((item: Record<string, unknown>) => ({
        name: item.title as string,
        price: item.price ? `$${Number(item.price).toLocaleString('es-CL')}` : 'Precio no disponible',
        currency,
        store,
        store_id: undefined,
        url: item.permalink as string,
        availability: 'in_stock' as const,
        source: 'crawlee' as const,
        scraper_type: 'ml-api',
        image: (item.thumbnail as string) || null,
        notes: (item.shipping as Record<string, unknown>)?.free_shipping ? 'Envío gratis' : undefined,
      }))

    console.log(`[ml-api] ✓ ${results.length} results from ${store}`)
    return results
  } catch (error) {
    console.error('[ml-api] Error:', error)
    return []
  }
}

function parseBudget(budget: string): number | null {
  const cleaned = budget.replace(/[^0-9.,]/g, '')
  if (!cleaned) return null
  const dots = (cleaned.match(/\./g) || []).length
  const num = dots > 1
    ? parseFloat(cleaned.replace(/\./g, ''))
    : parseFloat(cleaned.replace(/,/g, ''))
  return isFinite(num) && num > 0 ? num : null
}
