import * as cheerio from 'cheerio'
import type { SearchResult } from '@/types/search'

/** Min pages to always scrape */
const MIN_PAGES = 1
/** Max pages to scrape */
const MAX_PAGES = 3
/** If page 1 has >= this many results, fetch more pages */
const FETCH_MORE_THRESHOLD = 8

/**
 * Generic scraper: extracts products from ANY e-commerce URL.
 * Uses heuristics to find product names, prices, and links.
 *
 * Scraping dinámico:
 * - Siempre scrapea la página 1
 * - Si encuentra >= 8 resultados, scrapea páginas 2 y 3 en paralelo
 * - Si encuentra pocos resultados, no pierde tiempo en más páginas
 */
export async function scrapeGenericUrl(
  url: string,
  product: string,
  currency: string
): Promise<SearchResult[]> {
  const fullUrl = url.startsWith('http') ? url : `https://${url}`
  const searchUrl = buildSearchUrl(fullUrl, product)
  const storeName = extractStoreName(fullUrl)

  console.log(`[generic] Scraping: ${searchUrl}`)

  // Step 1: Fetch page 1
  const firstPageHtml = await fetchPage(searchUrl)
  if (!firstPageHtml) return []

  const results = parseGenericPage(firstPageHtml, product, currency, storeName, searchUrl, fullUrl)

  // Step 2: If page 1 has enough results, fetch more pages in parallel
  if (results.length >= FETCH_MORE_THRESHOLD) {
    const extraPages = Array.from(
      { length: MAX_PAGES - MIN_PAGES },
      (_, i) => appendPage(searchUrl, i + 2)
    )

    console.log(`[generic] Page 1 had ${results.length} results, fetching ${extraPages.length} more pages`)

    const morePages = await Promise.allSettled(
      extraPages.map(pageUrl => fetchPage(pageUrl))
    )

    for (const page of morePages) {
      if (page.status === 'fulfilled' && page.value) {
        results.push(...parseGenericPage(page.value, product, currency, storeName, searchUrl, fullUrl))
      }
    }
  }

  console.log(`[generic] Found ${results.length} results from ${storeName}`)
  return results
}

async function fetchPage(url: string): Promise<string | null> {
  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept-Language': 'es-419,es;q=0.9,en;q=0.8',
        Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      },
      redirect: 'follow',
    })

    if (!response.ok) {
      console.log(`[generic] HTTP ${response.status} for ${url}`)
      return null
    }

    return await response.text()
  } catch (error) {
    console.error(`[generic] Fetch failed for ${url}:`, error)
    return null
  }
}

function parseGenericPage(
  html: string,
  product: string,
  currency: string,
  storeName: string,
  searchUrl: string,
  fullUrl: string
): SearchResult[] {
  const $ = cheerio.load(html)
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

    for (const selector of productSelectors) {
      if (results.length > 0) break

      $(selector).each((_, el) => {
        const $el = $(el)
        const name = $el.find('h2, h3, h4, [class*="title"], [class*="name"], [class*="nombre"]').first().text().trim()
        if (!name || name.length < 5) return

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

  // Strategy 3: Brute force — intentionally disabled.
  // Returning a single fake "X precios encontrados" entry is misleading (no real name, no product URL).
  // If strategies 1 and 2 fail, we return nothing rather than garbage.

  return results
}

/**
 * Appends page number to a search URL using common pagination patterns.
 */
function appendPage(searchUrl: string, page: number): string {
  const url = new URL(searchUrl)

  // If URL already has a page param, update it
  if (url.searchParams.has('page')) {
    url.searchParams.set('page', String(page))
    return url.toString()
  }
  if (url.searchParams.has('p')) {
    url.searchParams.set('p', String(page))
    return url.toString()
  }

  // Default: add &page=N
  url.searchParams.set('page', String(page))
  return url.toString()
}

/**
 * Builds a search URL for a given store domain.
 */
function buildSearchUrl(baseUrl: string, product: string): string {
  const url = new URL(baseUrl)
  const domain = url.hostname.replace('www.', '')
  const encoded = encodeURIComponent(product)

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

  return `${url.origin}/search?q=${encoded}`
}

function extractStoreName(url: string): string {
  try {
    return new URL(url).hostname.replace('www.', '')
  } catch {
    return url
  }
}
