import * as cheerio from 'cheerio'
import type { SearchResult } from '@/types/search'

const SITE_URLS: Record<string, string> = {
  CL: 'https://listado.mercadolibre.cl',
  AR: 'https://listado.mercadolibre.com.ar',
  CO: 'https://listado.mercadolibre.com.co',
  MX: 'https://listado.mercadolibre.com.mx',
  PE: 'https://listado.mercadolibre.com.pe',
  UY: 'https://listado.mercadolibre.com.uy',
  EC: 'https://listado.mercadolibre.com.ec',
  VE: 'https://listado.mercadolibre.com.ve',
}

const CURRENCIES: Record<string, string> = {
  CL: 'CLP', AR: 'ARS', CO: 'COP', MX: 'MXN',
  PE: 'PEN', UY: 'UYU', EC: 'USD', VE: 'VES',
}

export async function searchMercadoLibrePlaywright(
  product: string,
  countryCode: string,
  budget?: string
): Promise<SearchResult[]> {
  const baseUrl = SITE_URLS[countryCode]
  if (!baseUrl) return []

  const apiKey = process.env.SCRAPERAPI_KEY
  if (!apiKey) {
    console.error('[ml-scraper] SCRAPERAPI_KEY not set')
    return []
  }

  const currency = CURRENCIES[countryCode] || 'USD'
  const store = `MercadoLibre ${countryCode}`
  const slug = product.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')
  const mlUrl = `${baseUrl}/${slug}`

  // wait=8000 gives React time to render products; wait_for_selector waits for cards
  const scraperUrl = `https://api.scraperapi.com?api_key=${apiKey}&url=${encodeURIComponent(mlUrl)}&render=true&wait=8000`

  console.log(`[ml-scraper] Fetching via ScraperAPI: ${mlUrl}`)

  try {
    const res = await fetch(scraperUrl, { signal: AbortSignal.timeout(60000) })

    if (!res.ok) {
      console.error(`[ml-scraper] ScraperAPI error: ${res.status}`)
      return []
    }

    const html = await res.text()
    const $ = cheerio.load(html)

    const title = $('title').text()
    console.log(`[ml-scraper] Page title: "${title}"`)
    // Log body snippet to check if products rendered
    const bodyMatch = html.match(/<body[^>]*>([\s\S]{0,2000})/)
    console.log(`[ml-scraper] Body snippet: ${(bodyMatch?.[1] || html.slice(0, 2000)).replace(/\s+/g, ' ').slice(0, 1000)}`)

    const items: { title: string; price: string; url: string; image: string | null; freeShipping: boolean }[] = []

    // Try poly-card format (new ML)
    $('.poly-card').each((_, el) => {
      const title = $(el).find('.poly-component__title').text().trim()
      const priceRaw = $(el).find('.andes-money-amount__fraction').first().text().replace(/\./g, '').replace(',', '.')
      const url = $(el).find('a[href*="mercadolibre"]').attr('href') || ''
      const image = $(el).find('img').attr('src') || $(el).find('img').attr('data-src') || null
      const freeShipping = $(el).find('[class*="free"], [class*="gratis"]').length > 0
      if (title && url) items.push({ title, price: priceRaw, url, image, freeShipping })
    })

    // Fallback: old ML format
    if (items.length === 0) {
      $('.ui-search-layout__item').each((_, el) => {
        const title = $(el).find('.ui-search-item__title').text().trim()
        const priceRaw = $(el).find('.andes-money-amount__fraction').first().text().replace(/\./g, '').replace(',', '.')
        const url = $(el).find('a').attr('href') || ''
        const image = $(el).find('img').attr('src') || $(el).find('img').attr('data-src') || null
        const freeShipping = $(el).find('[class*="free"]').length > 0
        if (title && url) items.push({ title, price: priceRaw, url, image, freeShipping })
      })
    }

    console.log(`[ml-scraper] Raw items: ${items.length}`)

    const priceMax = budget ? parseBudget(budget) : null

    const results: SearchResult[] = items
      .slice(0, 20)
      .filter((item) => {
        if (!priceMax || !item.price) return true
        const num = parseFloat(item.price)
        return isNaN(num) || num <= priceMax * 1.15
      })
      .map((item) => ({
        name: item.title,
        price: item.price ? `$${Number(item.price).toLocaleString('es-CL')}` : 'Precio no disponible',
        currency,
        store,
        store_id: undefined,
        url: item.url,
        availability: 'in_stock' as const,
        source: 'crawlee' as const,
        scraper_type: 'scraperapi',
        image: item.image,
        notes: item.freeShipping ? 'Envío gratis' : undefined,
      }))

    console.log(`[ml-scraper] ✓ ${results.length} results from ${store}`)
    return results
  } catch (error) {
    console.error('[ml-scraper] Error:', error)
    return []
  }
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
