import type { SearchQuery, SearchResult } from '@/types/search'
import { mergeAndSort } from './merger'

/**
 * SearchOrchestrator v4 — SOLO SCRAPING, SIN IA
 *
 * La IA se usa DESPUÉS para analizar los resultados,
 * no para buscar productos.
 *
 * Sources:
 * - "all"          → Crawlee (ML + Falabella) + Web Search (Serper/SerpAPI/CSE)
 * - "mercadolibre" → Solo MercadoLibre del país
 * - "web"          → Solo Web Search APIs (Serper → SerpAPI → Google CSE)
 */
export async function orchestrateSearch(
  query: SearchQuery & { source?: string; budget?: string; custom_url?: string }
): Promise<{ results: SearchResult[]; sources: string[] }> {
  const source = query.source || 'all'
  const budget = query.budget
  const customUrl = query.custom_url
  const specs = query.specs || {}
  const sources: string[] = []

  // Lean query for ML API (text search): product + brand + type only
  const mlParts = [query.product, query.brand]
  if (specs.type && !query.product.toLowerCase().includes(specs.type.toLowerCase())) {
    mlParts.push(specs.type)
  }
  const mlProduct = mlParts.filter(Boolean).join(' ')

  // Full query for web search: add specs that appear in product titles
  const webParts = [query.product, query.brand]
  if (specs.type) webParts.push(specs.type)
  if (specs.ram) webParts.push(specs.ram)
  if (specs.storage) webParts.push(specs.storage)
  if (specs.processor) webParts.push(specs.processor)
  if (specs.platform) webParts.push(specs.platform)
  if (specs.engine) webParts.push(specs.engine)
  const webProduct = webParts.filter(Boolean).join(' ')

  console.log(`[orchestrator] ML:"${mlProduct}" WEB:"${webProduct}" in ${query.city}, ${query.country} [source=${source}]${customUrl ? ` [url=${customUrl}]` : ''}`)

  const tasks: Promise<{ results: SearchResult[]; name: string }>[] = []

  // ── CUSTOM URL → additional source alongside others ──
  if (customUrl) {
    tasks.push(
      (async () => {
        try {
          const { scrapeGenericUrl } = await import('@/lib/crawlers/generic')
          const cc = getCountryCode(query.country)
          const currency = getCurrencyForCountry(cc)
          const scraperApiKey = process.env.SCRAPERAPI_KEY
          const results = await scrapeGenericUrl(customUrl, webProduct, currency, scraperApiKey)
          const label = new URL(customUrl).hostname.replace(/^www\./, '')
          return { results, name: label }
        } catch (error) {
          console.error('[orchestrator] Custom URL failed:', error)
          return { results: [] as SearchResult[], name: customUrl }
        }
      })()
    )
  }

  // ── CRAWLEE (MercadoLibre + country stores) ──
  if (source === 'all' || source === 'mercadolibre') {
    tasks.push(
      (async () => {
        try {
          const { runCrawlers } = await import('@/lib/crawlers')
          // Pass lean query for ML API text search
          const results = await runCrawlers({ ...query, product: mlProduct })
          return { results, name: 'Crawlee' }
        } catch (error) {
          console.error('[orchestrator] Crawlee failed:', error)
          return { results: [] as SearchResult[], name: 'Crawlee' }
        }
      })()
    )
  }

  // ── AMAZON (ScraperAPI structured endpoint) ──
  if (source === 'all' || source === 'amazon') {
    tasks.push(
      (async () => {
        try {
          const cc = getCountryCode(query.country)
          const { searchAmazon } = await import('@/lib/crawlers/amazon')
          const results = await searchAmazon(webProduct, cc, budget)
          return { results, name: 'Amazon' }
        } catch (error) {
          console.error('[orchestrator] Amazon failed:', error)
          return { results: [] as SearchResult[], name: 'Amazon' }
        }
      })()
    )
  }

  // ── WEB SEARCH (Serper → SerpAPI → Google CSE) ──
  if (source === 'all' || source === 'web') {
    tasks.push(
      (async () => {
        try {
          const { searchWeb } = await import('./web')
          // Pass full query with specs for better web search precision
          const results = await searchWeb(webProduct, query.country, query.city ?? '', budget)
          return { results, name: 'Web Search' }
        } catch (error) {
          console.error('[orchestrator] Web search failed:', error)
          return { results: [] as SearchResult[], name: 'Web Search' }
        }
      })()
    )
  }

  // Run all in parallel
  const settled = await Promise.allSettled(tasks)
  const allResults: SearchResult[] = []

  for (const result of settled) {
    if (result.status === 'fulfilled') {
      const { results: r, name } = result.value
      if (r.length > 0) {
        allResults.push(...r)
        sources.push(name)
      }
    }
  }

  const merged = mergeAndSort(allResults, query.brand || undefined, specs, budget)
  console.log(`[orchestrator] ✓ ${merged.length} results from [${sources.join(', ')}]`)

  return { results: merged.slice(0, 20), sources }
}

function getCountryCode(country: string): string {
  const map: Record<string, string> = {
    chile: 'CL', argentina: 'AR', colombia: 'CO', mexico: 'MX',
    peru: 'PE', uruguay: 'UY', ecuador: 'EC', venezuela: 'VE',
    'estados unidos': 'US', usa: 'US', canada: 'CA',
    espana: 'ES', spain: 'ES', brasil: 'BR', brazil: 'BR',
  }
  const code = map[country.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')]
  if (!code) console.warn(`[orchestrator] Unknown country "${country}", defaulting to US`)
  return code || 'US'
}

function getCurrencyForCountry(cc: string): string {
  const map: Record<string, string> = {
    CL: 'CLP', AR: 'ARS', CO: 'COP', MX: 'MXN',
    PE: 'PEN', UY: 'UYU', US: 'USD', CA: 'CAD',
    ES: 'EUR', BR: 'BRL', EC: 'USD', VE: 'VES',
  }
  return map[cc] || 'USD'
}
