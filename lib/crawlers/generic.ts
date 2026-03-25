import * as cheerio from 'cheerio'
import type { SearchResult } from '@/types/search'

/**
 * Generic scraper: extracts products from ANY e-commerce URL.
 * Uses heuristics to find product names, prices, and links.
 * Works for most stores without a dedicated scraper.
 */
export async function scrapeGenericUrl(
  url: string,
  product: string,
  currency: string
): Promise<SearchResult[]> {
  const fullUrl = url.startsWith('http') ? url : `https://${url}`

  // Build search URL — try common patterns
  const searchUrl = buildSearchUrl(fullUrl, product)
  console.log(`[generic] Scraping: ${searchUrl}`)

  try {
    const response = await fetch(searchUrl, {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept-Language': 'es-419,es;q=0.9,en;q=0.8',
        Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      },
      redirect: 'follow',
    })

    if (!response.ok) {
      console.log(`[generic] HTTP ${response.status} for ${searchUrl}`)
      return []
    }

    const html = await response.text()
    const $ = cheerio.load(html)
    const storeName = extractStoreName(fullUrl)
    const results: SearchResult[] = []

    // Strategy 1: Look for structured product data (JSON-LD)
    $('script[type="application/ld+json"]').each((_, el) => {
      try {
        const data = JSON.parse($(el).html() || '')
        const items = Array.isArray(data) ? data : [data]
        for (const item of items) {
          if (item['@type'] === 'Product' && item.offers) {
            const offer = Array.isArray(item.offers) ? item.offers[0] : item.offers
            results.push({
              name: item.name || '',
              price: offer.price ? `$${offer.price}` : 'Ver precio',
              currency: offer.priceCurrency || currency,
              store: storeName,
              url: item.url || searchUrl,
              availability: offer.availability?.includes('InStock') ? 'in_stock' : 'unknown',
              source: 'crawlee',
              scraper_type: 'crawlee_generic',
            })
          }
        }
      } catch { /* ignore invalid JSON-LD */ }
    })

    // Strategy 2: Common CSS patterns for product cards
    if (results.length === 0) {
      const priceSelectors = [
        '[class*="price"]', '[class*="precio"]', '[class*="Price"]',
        '[data-price]', '.product-price', '.sale-price',
      ]

      const productSelectors = [
        '[class*="product-card"]', '[class*="product-item"]',
        '[class*="producto"]', '[class*="card-product"]',
        'article[class*="product"]', '.search-result',
        '[class*="grid-item"]', '[class*="catalog-item"]',
      ]

      // Try each product card selector
      for (const selector of productSelectors) {
        if (results.length > 0) break

        $(selector).each((_, el) => {
          const $el = $(el)
          const name = $el.find('h2, h3, h4, [class*="title"], [class*="name"], [class*="nombre"]').first().text().trim()
          if (!name || name.length < 5) return

          // Find price
          let price = ''
          for (const ps of priceSelectors) {
            const priceText = $el.find(ps).first().text().trim()
            const priceMatch = priceText.match(/[\$€£][\d.,]+|[\d.,]+\s*[\$€£]/)
            if (priceMatch) {
              price = priceMatch[0]
              break
            }
          }
          if (!price) return

          // Find link
          const link = $el.find('a').first().attr('href') || ''
          const productUrl = link.startsWith('http') ? link : link.startsWith('/') ? `${new URL(fullUrl).origin}${link}` : searchUrl

          results.push({
            name,
            price,
            currency,
            store: storeName,
            url: productUrl,
            availability: 'unknown',
            source: 'crawlee',
            scraper_type: 'crawlee_generic',
          })
        })
      }
    }

    // Strategy 3: Brute force — find any element with price pattern near a link
    if (results.length === 0) {
      const bodyText = $('body').text()
      const priceRegex = /[\$€£]\s*[\d.,]+/g
      const prices = bodyText.match(priceRegex)

      if (prices && prices.length > 0) {
        // Found prices but couldn't extract structured data
        // Return a single result pointing to the search page
        results.push({
          name: `Resultados de "${product}" en ${storeName}`,
          price: `${prices.length} precios encontrados`,
          currency,
          store: storeName,
          url: searchUrl,
          availability: 'unknown',
          source: 'crawlee',
          scraper_type: 'crawlee_generic',
          notes: `Rango: ${prices[0]} — ${prices[prices.length - 1]}`,
        })
      }
    }

    console.log(`[generic] Found ${results.length} results from ${storeName}`)
    return results.slice(0, 15)
  } catch (error) {
    console.error(`[generic] Scraping failed for ${searchUrl}:`, error)
    return []
  }
}

/**
 * Builds a search URL for a given store domain.
 * Tries common search URL patterns.
 */
function buildSearchUrl(baseUrl: string, product: string): string {
  const url = new URL(baseUrl)
  const domain = url.hostname.replace('www.', '')
  const encoded = encodeURIComponent(product)

  // Known patterns
  const patterns: Record<string, string> = {
    'pcfactory.cl': `/buscar?valor=${encoded}`,
    'paris.cl': `/search?q=${encoded}`,
    'ripley.com': `/search/${encoded}`,
    'sodimac.cl': `/search/?Ntt=${encoded}`,
    'easy.cl': `/search/?Ntt=${encoded}`,
    'lider.cl': `/search?Ntt=${encoded}`,
    'hites.com': `/search?q=${encoded}`,
    'abcdin.cl': `/search?q=${encoded}`,
    'pccomponentes.com': `/buscar/?query=${encoded}`,
    'mediamarkt.es': `/es/search.html?query=${encoded}`,
    'elcorteingles.es': `/search/?s=${encoded}`,
    'liverpool.com.mx': `/tienda?s=${encoded}`,
    'coppel.com': `/search?q=${encoded}`,
    'elektra.com.mx': `/busqueda?q=${encoded}`,
    'fravega.com': `/l/?keyword=${encoded}`,
    'musimundo.com': `/search?q=${encoded}`,
    'garbarino.com': `/q/${encoded}`,
    'exito.com': `/s?q=${encoded}`,
  }

  const pattern = patterns[domain]
  if (pattern) {
    return `${url.origin}${pattern}`
  }

  // Generic fallback: try ?q= , ?s= , ?search= , /search?q=
  return `${url.origin}/search?q=${encoded}`
}

function extractStoreName(url: string): string {
  try {
    return new URL(url).hostname.replace('www.', '')
  } catch {
    return url
  }
}
