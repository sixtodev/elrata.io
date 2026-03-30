import type { SearchResult } from '@/types/search'
import { chromium } from 'playwright-core'

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

  const currency = CURRENCIES[countryCode] || 'USD'
  const store = `MercadoLibre ${countryCode}`

  let browser = null

  try {
    console.log(`[ml-playwright] Launching browser for "${product}" in ${countryCode}`)

    // PLAYWRIGHT_BROWSERS_PATH env var tells playwright-core where to find Chromium
    // Set in Dockerfile: /app/.playwright
    browser = await chromium.launch({
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-gpu',
        '--no-first-run',
        '--disable-extensions',
      ],
    })

    const context = await browser.newContext({
      userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
      locale: 'es-CL',
      viewport: { width: 1280, height: 720 },
    })

    const page = await context.newPage()
    const searchUrl = `${baseUrl}/${encodeURIComponent(product)}`

    console.log(`[ml-playwright] → ${searchUrl}`)
    await page.goto(searchUrl, { waitUntil: 'domcontentloaded', timeout: 40000 })

    // ML renders products client-side — wait up to 25s for them to appear
    // The PoW challenge resolves automatically (browser executes JS natively)
    let selectorFound = false
    try {
      await page.waitForSelector('.poly-card, .ui-search-layout__item', { timeout: 25000 })
      selectorFound = true
      console.log('[ml-playwright] ✓ Products selector found')
    } catch {
      console.warn('[ml-playwright] Selector timeout — extracting anyway')
    }

    const pageTitle = await page.title()
    console.log(`[ml-playwright] Page title: "${pageTitle}", selectorFound: ${selectorFound}`)

    const items = await page.evaluate(() => {
      const cards = Array.from(
        document.querySelectorAll('.poly-card, .ui-search-layout__item')
      )
      return cards.slice(0, 20).map((card) => {
        const titleEl =
          card.querySelector('.poly-component__title') ||
          card.querySelector('.ui-search-item__title')
        const fractionEl = card.querySelector('.andes-money-amount__fraction')
        const linkEl = card.querySelector('a[href*="mercadolibre"]') as HTMLAnchorElement | null
        const imgEl = card.querySelector('img') as HTMLImageElement | null
        const freeShipping = !!card.querySelector('[class*="free"]')
        const conditionEl = card.querySelector('[class*="condition"], [class*="condicion"]')

        const raw = fractionEl?.textContent?.replace(/\./g, '').replace(',', '.') || ''

        return {
          title: titleEl?.textContent?.trim() || '',
          price: raw,
          url: linkEl?.href || '',
          image: imgEl?.src || imgEl?.getAttribute('data-src') || null,
          freeShipping,
          condition: conditionEl?.textContent?.trim() || '',
        }
      })
    })

    await browser.close()
    browser = null

    console.log(`[ml-playwright] Raw items: ${items.length}`)

    const priceMax = budget ? parseBudget(budget) : null

    const results: SearchResult[] = items
      .filter((item) => item.title && item.url)
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
        scraper_type: 'playwright',
        image: item.image,
        notes: [
          item.freeShipping ? 'Envío gratis' : '',
          item.condition ? item.condition : '',
        ].filter(Boolean).join(', ') || undefined,
      }))

    console.log(`[ml-playwright] ✓ ${results.length} results from ${store}`)
    return results
  } catch (error) {
    console.error('[ml-playwright] Fatal error:', error)
    if (browser) await browser.close().catch(() => {})
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
