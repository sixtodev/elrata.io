import { CheerioCrawler, type CheerioCrawlingContext } from 'crawlee'
import * as cheerio from 'cheerio'
import type { SearchResult } from '@/types/search'

/** MercadoLibre domains by country */
const ML_DOMAINS: Record<string, string> = {
  CL: 'listado.mercadolibre.cl',
  CO: 'listado.mercadolibre.com.co',
  MX: 'listado.mercadolibre.com.mx',
  AR: 'listado.mercadolibre.com.ar',
  PE: 'listado.mercadolibre.com.pe',
  UY: 'listado.mercadolibre.com.uy',
  EC: 'listado.mercadolibre.com.ec',
  VE: 'listado.mercadolibre.com.ve',
}

const CURRENCIES: Record<string, string> = {
  CL: 'CLP', CO: 'COP', MX: 'MXN', AR: 'ARS',
  PE: 'PEN', UY: 'UYU', EC: 'USD', VE: 'VES',
}

export function getMercadoLibreUrl(product: string, countryCode: string): string | null {
  const domain = ML_DOMAINS[countryCode]
  if (!domain) return null
  const query = product.replace(/\s+/g, '-')
  return `https://${domain}/${encodeURIComponent(query)}`
}

/**
 * Scrapes MercadoLibre search results using CheerioCrawler.
 * CheerioCrawler is fast (no browser needed) and MercadoLibre
 * serves HTML content without heavy JS rendering.
 */
export async function scrapeMercadoLibre(
  product: string,
  countryCode: string
): Promise<SearchResult[]> {
  const url = getMercadoLibreUrl(product, countryCode)
  if (!url) return []

  const currency = CURRENCIES[countryCode] || 'USD'
  const results: SearchResult[] = []

  try {
    // Direct fetch + cheerio parse (simpler than full CheerioCrawler for single page)
    const response = await fetch(url, {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept-Language': 'es-419,es;q=0.9',
      },
    })

    if (!response.ok) {
      console.log(`[mercadolibre] HTTP ${response.status} for ${countryCode}`)
      return []
    }

    const html = await response.text()
    const $ = cheerio.load(html)

    // MercadoLibre product cards
    $('li.ui-search-layout__item').each((_, el) => {
      try {
        const $el = $(el)

        // Product name
        const name =
          $el.find('.ui-search-item__title').text().trim() ||
          $el.find('h2.ui-search-item__title').text().trim() ||
          $el.find('a.ui-search-link__title-card').text().trim()

        if (!name) return

        // Price
        const priceInt =
          $el.find('.andes-money-amount__fraction').first().text().trim()
        const priceCents =
          $el.find('.andes-money-amount__cents').first().text().trim()

        if (!priceInt) return

        const priceStr = priceCents
          ? `$${priceInt},${priceCents}`
          : `$${priceInt}`

        // URL
        const productUrl =
          $el.find('a.ui-search-link').attr('href') ||
          $el.find('a.ui-search-link__title-card').attr('href') ||
          $el.find('a').first().attr('href') ||
          '#'

        // Image
        const image =
          $el.find('img.ui-search-result-image__element').attr('src') ||
          $el.find('img').first().attr('data-src') ||
          null

        // Shipping info
        const freeShipping = $el
          .find('.ui-search-item__shipping')
          .text()
          .toLowerCase()
          .includes('gratis')

        results.push({
          name,
          price: priceStr,
          currency,
          store: `MercadoLibre ${countryCode}`,
          url: productUrl,
          availability: 'online_only',
          source: 'crawlee',
          scraper_type: 'crawlee_dedicated',
          image,
          notes: freeShipping ? 'Envío gratis' : undefined,
        })
      } catch {
        // Skip malformed items
      }
    })

    console.log(
      `[mercadolibre] Found ${results.length} results for "${product}" in ${countryCode}`
    )
  } catch (error) {
    console.error(`[mercadolibre] Scraping failed:`, error)
  }

  return results.slice(0, 15)
}
