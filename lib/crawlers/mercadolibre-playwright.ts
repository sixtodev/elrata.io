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

const STORE_LABELS: Record<string, string> = {
  CL: 'MercadoLibre CL', AR: 'MercadoLibre AR', CO: 'MercadoLibre CO',
  MX: 'MercadoLibre MX', PE: 'MercadoLibre PE', UY: 'MercadoLibre UY',
  EC: 'MercadoLibre EC', VE: 'MercadoLibre VE',
}

export async function searchMercadoLibrePlaywright(
  product: string,
  countryCode: string,
  budget?: string
): Promise<SearchResult[]> {
  const baseUrl = SITE_URLS[countryCode]
  if (!baseUrl) return []

  const currency = CURRENCIES[countryCode] || 'USD'
  const store = STORE_LABELS[countryCode] || `MercadoLibre ${countryCode}`

  // Path for system Chromium (Docker Alpine) or local dev
  const executablePath =
    process.env.CHROMIUM_PATH ||
    process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH ||
    undefined // let playwright-core find it in dev

  let browser = null

  try {
    browser = await chromium.launch({
      executablePath,
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-gpu',
        '--no-first-run',
        '--no-zygote',
        '--single-process',
      ],
    })

    const context = await browser.newContext({
      userAgent:
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      locale: 'es-CL',
      viewport: { width: 1280, height: 720 },
    })

    const page = await context.newPage()

    // Build search URL
    const searchUrl = `${baseUrl}/${encodeURIComponent(product)}`
    console.log(`[ml-playwright] Navigating to ${searchUrl}`)

    await page.goto(searchUrl, { waitUntil: 'domcontentloaded', timeout: 30000 })

    // Wait for products — ML renders .poly-card items
    // The PoW challenge resolves automatically (browser executes JS)
    try {
      await page.waitForSelector('.poly-card, .ui-search-layout__item', {
        timeout: 20000,
      })
    } catch {
      console.warn('[ml-playwright] Timeout waiting for products, trying anyway')
    }

    // Extract products from DOM
    const items = await page.evaluate(() => {
      const cards = Array.from(
        document.querySelectorAll('.poly-card, .ui-search-layout__item')
      )

      return cards.slice(0, 20).map((card) => {
        const titleEl =
          card.querySelector('.poly-component__title') ||
          card.querySelector('.ui-search-item__title')
        const fractionEl = card.querySelector('.andes-money-amount__fraction')
        const centsEl = card.querySelector('.andes-money-amount__cents')
        const linkEl = card.querySelector('a[href*="mercadolibre"]') as HTMLAnchorElement | null
        const imgEl = card.querySelector('img') as HTMLImageElement | null
        const freeShipping = !!card.querySelector(
          '[class*="free-shipping"], [class*="envio-gratis"], [data-testid*="free"]'
        )
        const condition = card.querySelector('[class*="condition"], [class*="condicion"]')?.textContent?.trim() || ''

        const priceText = fractionEl ? fractionEl.textContent?.replace(/\./g, '').replace(',', '.') || '' : ''
        const cents = centsEl ? centsEl.textContent?.trim() || '' : ''
        const fullPrice = cents ? `${priceText}.${cents}` : priceText

        return {
          title: titleEl?.textContent?.trim() || '',
          price: fullPrice,
          url: linkEl?.href || '',
          image: imgEl?.src || imgEl?.getAttribute('data-src') || null,
          freeShipping,
          condition,
        }
      })
    })

    await browser.close()
    browser = null

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
          item.condition === 'Nuevo' ? 'Nuevo' : item.condition === 'Usado' ? 'Usado' : '',
        ]
          .filter(Boolean)
          .join(', ') || undefined,
      }))

    console.log(`[ml-playwright] ✓ ${results.length} results from ${store}`)
    return results
  } catch (error) {
    console.error('[ml-playwright] Error:', error)
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
