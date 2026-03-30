import type { SearchQuery, SearchResult } from '@/types/search'

const COUNTRY_CODES: Record<string, string> = {
  chile: 'CL', argentina: 'AR', colombia: 'CO', mexico: 'MX',
  peru: 'PE', uruguay: 'UY', ecuador: 'EC', venezuela: 'VE',
  'estados unidos': 'US', usa: 'US', 'united states': 'US',
  canada: 'CA', espana: 'ES', spain: 'ES', brasil: 'BR', brazil: 'BR',
}


function getCountryCode(country: string): string {
  return COUNTRY_CODES[
    country.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
  ] || 'ALL'
}

/**
 * Runs crawlers for a search query.
 *
 * - MercadoLibre: API oficial (si hay token), sino scraper genérico
 * - Demás tiendas del país: scraper genérico
 * - Todas en paralelo
 */
export async function runCrawlers(
  query: SearchQuery & { source?: string }
): Promise<SearchResult[]> {
  const cc = getCountryCode(query.country)
  // query.product already includes brand (added by buildQuery in the UI)
  const product = query.product
  const source = query.source || 'all'

  console.log(`[crawlers] Starting for "${product}" in ${cc} [source=${source}]`)

  const tasks: Promise<SearchResult[]>[] = []

  // MercadoLibre — Playwright scraper (bypasses CloudFront TLS fingerprint block)
  const mlCountries = ['CL', 'CO', 'MX', 'AR', 'PE', 'UY', 'EC', 'VE']
  if (mlCountries.includes(cc)) {
    tasks.push(
      import('./mercadolibre-playwright').then(m => m.searchMercadoLibrePlaywright(product, cc, query.budget))
    )
  }

  const settled = await Promise.allSettled(tasks)
  const results: SearchResult[] = []

  for (const r of settled) {
    if (r.status === 'fulfilled') results.push(...r.value)
  }

  console.log(`[crawlers] Total: ${results.length} results`)
  return results
}
