import type { SearchResult } from '@/types/search'

const ML_DOMAINS: Record<string, string> = {
  CL: 'mercadolibre.cl', AR: 'mercadolibre.com.ar', CO: 'mercadolibre.com.co',
  MX: 'mercadolibre.com.mx', PE: 'mercadolibre.com.pe', UY: 'mercadolibre.com.uy',
  EC: 'mercadolibre.com.ec', VE: 'mercadolibre.com.ve',
}

const CURRENCIES: Record<string, string> = {
  CL: 'CLP', AR: 'ARS', CO: 'COP', MX: 'MXN',
  PE: 'PEN', UY: 'UYU', EC: 'USD', VE: 'VES',
}

const GL_CODES: Record<string, string> = {
  CL: 'cl', AR: 'ar', CO: 'co', MX: 'mx',
  PE: 'pe', UY: 'uy', EC: 'ec', VE: 've',
}

/**
 * Searches MercadoLibre via Serper (Google site: filter).
 * ML blocks direct API calls and scraping from datacenter IPs.
 * Google indexes all ML listings and returns them reliably via Serper.
 */
export async function searchMercadoLibrePlaywright(
  product: string,
  countryCode: string,
  budget?: string
): Promise<SearchResult[]> {
  const domain = ML_DOMAINS[countryCode]
  if (!domain) return []

  const apiKey = process.env.SERPER_API_KEY
  if (!apiKey) {
    console.error('[ml-serper] SERPER_API_KEY not set')
    return []
  }

  const currency = CURRENCIES[countryCode] || 'USD'
  const gl = GL_CODES[countryCode] || 'us'
  const store = `MercadoLibre ${countryCode}`
  const query = `${product} site:${domain}`

  console.log(`[ml-serper] Searching via Serper: "${query}"`)

  try {
    const res = await fetch('https://google.serper.dev/search', {
      method: 'POST',
      headers: { 'X-API-KEY': apiKey, 'Content-Type': 'application/json' },
      body: JSON.stringify({ q: query, gl, hl: 'es', num: 20 }),
      signal: AbortSignal.timeout(15000),
    })

    if (!res.ok) {
      console.error(`[ml-serper] Serper error: ${res.status}`)
      return []
    }

    const data = await res.json()
    const organic = (data.organic || []) as Array<{
      title: string
      link: string
      snippet?: string
    }>

    // Filter to only ML links for the correct country
    const mlResults = organic.filter((r) =>
      r.link.includes(domain) && !r.link.includes('/vendedor/') && !r.link.includes('/tienda/')
    )

    console.log(`[ml-serper] Raw ML items: ${mlResults.length}`)

    const priceMax = budget ? parseBudget(budget) : null

    const results: SearchResult[] = mlResults.map((item) => {
      const priceMatch = item.snippet?.match(/\$\s?[\d.,]+/)
      const rawPrice = priceMatch ? priceMatch[0] : null
      const numericPrice = rawPrice ? parseFloat(rawPrice.replace(/[$.,]/g, '').replace(/\./g, '')) : null

      return {
        name: item.title.replace(/\s*-\s*Mercado Libre$/, '').trim(),
        price: rawPrice || 'Ver precio',
        currency,
        store,
        store_id: undefined,
        url: item.link,
        availability: 'in_stock' as const,
        source: 'crawlee' as const,
        scraper_type: 'serper-ml',
        image: null,
        notes: item.snippet?.slice(0, 100) || undefined,
      }
    }).filter((item) => {
      if (!priceMax) return true
      const num = parseFloat(item.price.replace(/[^0-9.]/g, ''))
      return isNaN(num) || num <= priceMax * 1.15
    })

    console.log(`[ml-serper] ✓ ${results.length} results from ${store}`)
    return results
  } catch (error) {
    console.error('[ml-serper] Error:', error)
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
