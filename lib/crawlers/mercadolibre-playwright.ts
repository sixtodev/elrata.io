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

interface SerperShoppingItem {
  title: string
  link: string
  source?: string
  price?: string
  imageUrl?: string
  rating?: number
  ratingCount?: number
}

interface SerperOrganicItem {
  title: string
  link: string
  snippet?: string
}

/**
 * Searches MercadoLibre via Serper.
 * Runs /shopping + /search in parallel:
 *   - /shopping → structured prices (primary)
 *   - /search   → more URLs via site: filter (fallback for items not in shopping)
 * Results are merged by URL to avoid duplicates, shopping prices take priority.
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
  const siteQuery = `${product} site:${domain}`

  console.log(`[ml-serper] Searching via Serper shopping+organic: "${product}" on ${domain}`)

  const headers = { 'X-API-KEY': apiKey, 'Content-Type': 'application/json' }
  const timeout = AbortSignal.timeout(15000)

  const [shoppingRes, organicRes] = await Promise.allSettled([
    fetch('https://google.serper.dev/shopping', {
      method: 'POST',
      headers,
      body: JSON.stringify({ q: siteQuery, gl, hl: 'es', num: 20 }),
      signal: timeout,
    }),
    fetch('https://google.serper.dev/search', {
      method: 'POST',
      headers,
      body: JSON.stringify({ q: siteQuery, gl, hl: 'es', num: 20 }),
      signal: timeout,
    }),
  ])

  const priceMax = budget ? parseBudget(budget) : null

  // Map url → result, shopping results take priority (have real prices)
  const resultMap = new Map<string, SearchResult>()

  // ── Organic first (lower priority, no structured price) ──
  if (organicRes.status === 'fulfilled' && organicRes.value.ok) {
    const data = await organicRes.value.json()
    const organic = (data.organic || []) as SerperOrganicItem[]
    const mlItems = organic.filter((r) =>
      r.link.includes(domain) &&
      !r.link.includes('/vendedor/') &&
      !r.link.includes('/tienda/')
    )
    console.log(`[ml-serper] Organic ML items: ${mlItems.length}`)

    for (const item of mlItems) {
      const priceMatch = item.snippet?.match(/\$\s?[\d.,]+/)
      const rawPrice = priceMatch ? priceMatch[0].trim() : null

      resultMap.set(item.link, {
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
      })
    }
  }

  // ── Shopping (higher priority, structured price) ──
  if (shoppingRes.status === 'fulfilled' && shoppingRes.value.ok) {
    const data = await shoppingRes.value.json()
    const items = (data.shopping || []) as SerperShoppingItem[]
    const mlItems = items.filter((r) => r.link?.includes(domain))
    console.log(`[ml-serper] Shopping ML items: ${mlItems.length}`)

    for (const item of mlItems) {
      if (!item.link) continue
      resultMap.set(item.link, {
        name: item.title.replace(/\s*-\s*Mercado Libre$/, '').trim(),
        price: item.price || 'Ver precio',
        currency,
        store,
        store_id: undefined,
        url: item.link,
        availability: 'in_stock' as const,
        source: 'crawlee' as const,
        scraper_type: 'serper-ml-shopping',
        image: item.imageUrl || null,
        notes: item.rating ? `${item.rating}★ (${item.ratingCount || 0})` : undefined,
      })
    }
  }

  let results = Array.from(resultMap.values())

  if (priceMax) {
    results = results.filter((item) => {
      if (item.price === 'Ver precio') return true
      const num = parseFloat(item.price.replace(/[^0-9.]/g, ''))
      return isNaN(num) || num <= priceMax * 1.15
    })
  }

  console.log(`[ml-serper] ✓ ${results.length} results from ${store}`)
  return results
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
