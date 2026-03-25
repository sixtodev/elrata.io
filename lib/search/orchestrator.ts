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
  const product = `${query.product}${query.brand ? ` ${query.brand}` : ''}`
  const source = query.source || 'all'
  const budget = query.budget
  const customUrl = query.custom_url
  const sources: string[] = []

  console.log(`[orchestrator] "${product}" in ${query.city}, ${query.country} [source=${source}]${customUrl ? ` [url=${customUrl}]` : ''}`)

  const tasks: Promise<{ results: SearchResult[]; name: string }>[] = []

  // ── CUSTOM URL → search ONLY in that site ──
  if (customUrl) {
    tasks.push(
      (async () => {
        try {
          const { scrapeGenericUrl } = await import('@/lib/crawlers/generic')
          const cc = getCountryCode(query.country)
          const currency = getCurrencyForCountry(cc)
          const results = await scrapeGenericUrl(customUrl, product, currency)
          return { results, name: customUrl }
        } catch (error) {
          console.error('[orchestrator] Custom URL failed:', error)
          return { results: [] as SearchResult[], name: customUrl }
        }
      })()
    )

    // Skip all other sources when custom URL is set
    const settled = await Promise.allSettled(tasks)
    const allResults: SearchResult[] = []
    for (const result of settled) {
      if (result.status === 'fulfilled') {
        const { results: r, name } = result.value
        if (r.length > 0) { allResults.push(...r); sources.push(name) }
      }
    }
    const merged = mergeAndSort(allResults, query.brand || undefined)
    console.log(`[orchestrator] ✓ ${merged.length} results from [${sources.join(', ')}] (custom URL only)`)
    return { results: merged.slice(0, 20), sources }
  }

  // ── CRAWLEE (MercadoLibre, Falabella) ──
  if (source === 'all' || source === 'mercadolibre') {
    tasks.push(
      (async () => {
        try {
          const { runCrawlers } = await import('@/lib/crawlers')
          const results = await runCrawlers(query)
          return { results, name: 'Crawlee' }
        } catch (error) {
          console.error('[orchestrator] Crawlee failed:', error)
          return { results: [] as SearchResult[], name: 'Crawlee' }
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
          const results = await searchWeb(product, query.country, query.city, budget)
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

  const merged = mergeAndSort(allResults, query.brand || undefined)
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
  return map[country.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')] || 'US'
}

function getCurrencyForCountry(cc: string): string {
  const map: Record<string, string> = {
    CL: 'CLP', AR: 'ARS', CO: 'COP', MX: 'MXN',
    PE: 'PEN', UY: 'UYU', US: 'USD', CA: 'CAD',
    ES: 'EUR', BR: 'BRL', EC: 'USD', VE: 'VES',
  }
  return map[cc] || 'USD'
}
