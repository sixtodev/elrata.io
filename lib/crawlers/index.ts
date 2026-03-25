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
 * Runs crawlers for specific stores.
 * MercadoLibre: API oficial (si tiene token) → Cheerio scraper (fallback)
 * Falabella: Cheerio scraper (CL, CO, PE)
 */
export async function runCrawlers(
  query: SearchQuery
): Promise<SearchResult[]> {
  const cc = getCountryCode(query.country)
  const product = `${query.product}${query.brand ? ` ${query.brand}` : ''}`

  console.log(`[crawlers] Starting for "${product}" in ${cc}`)

  const tasks: Promise<SearchResult[]>[] = []

  // MercadoLibre — disponible en toda LATAM
  if (['CL', 'CO', 'MX', 'AR', 'PE', 'UY', 'EC', 'VE'].includes(cc)) {
    if (process.env.ML_ACCESS_TOKEN) {
      tasks.push(
        import('./apis/mercadolibre-api').then(m => m.searchMercadoLibreAPI(product, cc))
      )
    } else {
      tasks.push(
        import('./latam/mercadolibre').then(m => m.scrapeMercadoLibre(product, cc))
      )
    }
  }

  // Falabella — CL, CO, PE
  if (['CL', 'CO', 'PE'].includes(cc)) {
    tasks.push(
      import('./latam/falabella').then(m => m.scrapeFalabella(product, cc))
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
