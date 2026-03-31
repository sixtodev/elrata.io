import type { SearchResult } from '@/types/search'

const SEARCH_URL = 'https://google.serper.dev/search'
const SHOPPING_URL = 'https://google.serper.dev/shopping'

interface SerperShoppingResult {
  title: string
  price: string
  link: string
  source: string
  imageUrl?: string
  rating?: number
  ratingCount?: number
  delivery?: string
}

interface SerperOrganicResult {
  title: string
  link: string
  snippet: string
  position: number
}

export async function searchSerper(
  query: string,
  country: string,
  city: string,
  budget?: string
): Promise<SearchResult[]> {
  const apiKey = process.env.SERPER_API_KEY
  if (!apiKey) return []

  const gl = getGoogleCountry(country)
  const currency = getCurrency(gl)
  const results: SearchResult[] = []

  // Run shopping + organic search in parallel for more results
  const [shoppingResults, organicResults] = await Promise.allSettled([
    fetchShopping(apiKey, query, city, country, gl, currency, budget),
    fetchOrganic(apiKey, query, city, country, gl, currency, budget),
  ])

  if (shoppingResults.status === 'fulfilled') {
    results.push(...shoppingResults.value)
  }
  if (organicResults.status === 'fulfilled') {
    results.push(...organicResults.value)
  }

  console.log(`[serper] Total: ${results.length} results`)
  return results
}

async function fetchShopping(
  apiKey: string,
  query: string,
  city: string,
  country: string,
  gl: string,
  currency: string,
  budget?: string
): Promise<SearchResult[]> {
  const results: SearchResult[] = []

  // Build budget hint for query
  const budgetHint = budget ? ` hasta ${budget}` : ''

  // Multiple query variations — country first to help Google Shopping prioritize local stores
  const queries = [
    `${query} tienda ${country}${city ? ` ${city}` : ''}${budgetHint}`,
    `comprar ${query} ${country} precio${budgetHint}`,
    `${query} venta ${country}`,
  ]

  for (const q of queries) {
    try {
      const res = await fetch(SHOPPING_URL, {
        method: 'POST',
        headers: { 'X-API-KEY': apiKey, 'Content-Type': 'application/json' },
        body: JSON.stringify({ q, gl, hl: 'es', num: 20 }),
      })

      if (!res.ok) continue

      const data = await res.json()
      const shopping = (data.shopping || []) as SerperShoppingResult[]

      for (const item of shopping) {
        // Avoid duplicates by URL
        if (results.some((r) => r.url === item.link)) continue

        results.push({
          name: item.title,
          price: item.price || 'Ver precio',
          currency: detectCurrencyFromPrice(item.price, currency),
          store: item.source || 'Tienda online',
          url: item.link,
          availability: 'online_only',
          source: 'crawlee',
          image: item.imageUrl || null,
          notes: [
            item.delivery || '',
            item.rating ? `${item.rating}★ (${item.ratingCount || 0})` : '',
          ].filter(Boolean).join(', ') || undefined,
        })
      }

      // If we got enough, stop
      if (results.length >= 10) break
    } catch {
      continue
    }
  }

  return results
}

async function fetchOrganic(
  apiKey: string,
  query: string,
  city: string,
  country: string,
  gl: string,
  currency: string,
  budget?: string
): Promise<SearchResult[]> {
  const results: SearchResult[] = []
  const budgetHint = budget ? ` hasta ${budget}` : ''

  try {
    const res = await fetch(SEARCH_URL, {
      method: 'POST',
      headers: { 'X-API-KEY': apiKey, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        q: `${query} venta precio${city ? ` ${city}` : ''} ${country}${budgetHint}`,
        gl,
        hl: 'es',
        num: 10,
      }),
    })

    if (!res.ok) return []

    const data = await res.json()
    const organic = (data.organic || []) as SerperOrganicResult[]

    for (const item of organic) {
      // Skip results that clearly aren't product pages
      const link = item.link.toLowerCase()
      if (link.includes('wikipedia') || link.includes('youtube') || link.includes('reddit')) continue

      // Extract price only if it has a thousands separator — avoids "Save $17" false positives
      // Matches: $17,077 | MX$14,990 | $1.299.990 | COP$250.000 | €1.299
      const priceMatch = item.snippet?.match(
        /(?:MX\$|US\$|COP\s*\$?|ARS\s*\$?|\$|€|£|R\$|S\/\.?\s*)\s*\d{1,3}(?:[.,]\d{3})+/
      )
      const price = priceMatch ? priceMatch[0].trim() : 'Ver precio'

      results.push({
        name: item.title,
        price,
        currency: price !== 'Ver precio' ? detectCurrencyFromPrice(price, currency) : currency,
        store: extractStoreName(item.link),
        url: item.link,
        availability: 'unknown',
        source: 'crawlee',
        notes: item.snippet?.slice(0, 120),
      })
    }
  } catch {
    // Ignore
  }

  return results
}

function extractStoreName(url: string): string {
  try {
    return new URL(url).hostname.replace('www.', '').replace('listado.', '')
  } catch {
    return 'Tienda online'
  }
}

function getGoogleCountry(country: string): string {
  const map: Record<string, string> = {
    chile: 'cl', argentina: 'ar', colombia: 'co', mexico: 'mx',
    peru: 'pe', uruguay: 'uy', ecuador: 'ec', venezuela: 've',
    'estados unidos': 'us', usa: 'us', espana: 'es', spain: 'es',
    brasil: 'br', brazil: 'br', canada: 'ca',
  }
  return map[country.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')] || 'us'
}

function getCurrency(gl: string): string {
  const map: Record<string, string> = {
    cl: 'CLP', ar: 'ARS', co: 'COP', mx: 'MXN',
    pe: 'PEN', uy: 'UYU', us: 'USD', es: 'EUR',
    br: 'BRL', ca: 'CAD', ec: 'USD', ve: 'VES',
  }
  return map[gl] || 'USD'
}

function detectCurrencyFromPrice(price: string, fallback: string): string {
  if (!price) return fallback
  if (price.includes('US$') || price.includes('USD')) return 'USD'
  if (price.includes('€')) return 'EUR'
  if (price.includes('£')) return 'GBP'
  if (price.includes('R$')) return 'BRL'
  if (price.includes('CAD')) return 'CAD'
  return fallback
}
