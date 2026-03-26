import type { SearchQuery, SearchResult } from '@/types/search'

const COUNTRY_CODES: Record<string, string> = {
  chile: 'CL', argentina: 'AR', colombia: 'CO', mexico: 'MX',
  peru: 'PE', uruguay: 'UY', ecuador: 'EC', venezuela: 'VE',
  'estados unidos': 'US', usa: 'US', 'united states': 'US',
  canada: 'CA', espana: 'ES', spain: 'ES', brasil: 'BR', brazil: 'BR',
}

const CURRENCIES: Record<string, string> = {
  CL: 'CLP', AR: 'ARS', CO: 'COP', MX: 'MXN',
  PE: 'PEN', UY: 'UYU', EC: 'USD', VE: 'VES',
  US: 'USD', CA: 'CAD', ES: 'EUR', BR: 'BRL',
}

/** Stores to scrape by country (besides MercadoLibre API) */
const STORES_BY_COUNTRY: Record<string, string[]> = {
  CL: ['https://www.falabella.com/falabella-cl', 'https://www.sodimac.cl', 'https://www.pcfactory.cl', 'https://www.paris.cl'],
  CO: ['https://www.falabella.com.co/falabella-co', 'https://www.exito.com'],
  PE: ['https://www.falabella.com.pe/falabella-pe'],
  MX: ['https://www.liverpool.com.mx', 'https://www.coppel.com'],
  AR: ['https://www.fravega.com', 'https://www.garbarino.com'],
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
  query: SearchQuery
): Promise<SearchResult[]> {
  const cc = getCountryCode(query.country)
  const product = `${query.product}${query.brand ? ` ${query.brand}` : ''}`
  const currency = CURRENCIES[cc] || 'USD'

  console.log(`[crawlers] Starting for "${product}" in ${cc}`)

  const tasks: Promise<SearchResult[]>[] = []

  // MercadoLibre — API oficial si hay token
  const mlCountries = ['CL', 'CO', 'MX', 'AR', 'PE', 'UY', 'EC', 'VE']
  if (mlCountries.includes(cc)) {
    if (process.env.ML_ACCESS_TOKEN) {
      tasks.push(
        import('./apis/mercadolibre-api').then(m => m.searchMercadoLibreAPI(product, cc))
      )
    } else {
      // Fallback: scraper genérico en MercadoLibre
      const mlDomains: Record<string, string> = {
        CL: 'https://listado.mercadolibre.cl',
        CO: 'https://listado.mercadolibre.com.co',
        MX: 'https://listado.mercadolibre.com.mx',
        AR: 'https://listado.mercadolibre.com.ar',
        PE: 'https://listado.mercadolibre.com.pe',
        UY: 'https://listado.mercadolibre.com.uy',
        EC: 'https://listado.mercadolibre.com.ec',
        VE: 'https://listado.mercadolibre.com.ve',
      }
      const mlUrl = mlDomains[cc]
      if (mlUrl) {
        tasks.push(
          import('./generic').then(m => m.scrapeGenericUrl(mlUrl, product, currency))
        )
      }
    }
  }

  // Other stores for this country — all through generic scraper
  const stores = STORES_BY_COUNTRY[cc] || []
  for (const storeUrl of stores) {
    tasks.push(
      import('./generic').then(m => m.scrapeGenericUrl(storeUrl, product, currency))
    )
  }

  const settled = await Promise.allSettled(tasks)
  const results: SearchResult[] = []

  for (const r of settled) {
    if (r.status === 'fulfilled') results.push(...r.value)
  }

  console.log(`[crawlers] Total: ${results.length} results from ${1 + stores.length} stores`)
  return results
}
