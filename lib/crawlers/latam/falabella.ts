import * as cheerio from 'cheerio'
import type { SearchResult } from '@/types/search'

const FALABELLA_DOMAINS: Record<string, string> = {
  CL: 'www.falabella.com/falabella-cl',
  CO: 'www.falabella.com.co/falabella-co',
  PE: 'www.falabella.com.pe/falabella-pe',
}

const CURRENCIES: Record<string, string> = {
  CL: 'CLP', CO: 'COP', PE: 'PEN',
}

export async function scrapeFalabella(
  product: string,
  countryCode: string
): Promise<SearchResult[]> {
  const domain = FALABELLA_DOMAINS[countryCode]
  if (!domain) return []

  const currency = CURRENCIES[countryCode] || 'USD'
  const url = `https://${domain}/search?Ntt=${encodeURIComponent(product)}`
  const results: SearchResult[] = []

  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept-Language': 'es-419,es;q=0.9',
      },
    })

    if (!response.ok) {
      console.log(`[falabella] HTTP ${response.status} for ${countryCode}`)
      return []
    }

    const html = await response.text()
    const $ = cheerio.load(html)

    // Falabella product cards
    $('[class*="pod-card"], [class*="search-results-4-grid"] > div').each(
      (_, el) => {
        try {
          const $el = $(el)

          const name =
            $el.find('[class*="pod-title"], [class*="product-name"]').text().trim() ||
            $el.find('b.pod-subTitle').text().trim()

          if (!name || name.length < 5) return

          // Price — Falabella uses various price formats
          const priceText =
            $el.find('[class*="prices-0"] li:first-child [class*="copy"]').text().trim() ||
            $el.find('[class*="price"]').first().text().trim()

          const priceMatch = priceText.match(/[\d.,]+/)
          if (!priceMatch) return

          const productUrl =
            $el.find('a').first().attr('href') || '#'
          const fullUrl = productUrl.startsWith('http')
            ? productUrl
            : `https://${domain.split('/')[0]}${productUrl}`

          const image = $el.find('img').first().attr('src') || null

          results.push({
            name,
            price: `$${priceMatch[0]}`,
            currency,
            store: `Falabella ${countryCode}`,
            url: fullUrl,
            availability: 'online_only',
            source: 'crawlee',
            scraper_type: 'crawlee_dedicated',
            image,
          })
        } catch {
          // Skip
        }
      }
    )

    console.log(
      `[falabella] Found ${results.length} results for "${product}" in ${countryCode}`
    )
  } catch (error) {
    console.error(`[falabella] Scraping failed:`, error)
  }

  return results.slice(0, 15)
}
