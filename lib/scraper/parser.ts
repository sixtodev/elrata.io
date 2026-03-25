import type { SearchQuery, SearchResult } from '@/types/search'

/**
 * Currency codes by country
 */
const CURRENCY_MAP: Record<string, string> = {
  chile: 'CLP', argentina: 'ARS', colombia: 'COP', mexico: 'MXN',
  peru: 'PEN', uruguay: 'UYU', ecuador: 'USD', venezuela: 'VES',
  'estados unidos': 'USD', usa: 'USD', 'united states': 'USD',
  canada: 'CAD', espana: 'EUR', spain: 'EUR', alemania: 'EUR',
  germany: 'EUR', francia: 'EUR', france: 'EUR', italia: 'EUR',
  italy: 'EUR', 'reino unido': 'GBP', 'united kingdom': 'GBP',
  brasil: 'BRL', brazil: 'BRL', japon: 'JPY', japan: 'JPY',
}

interface ScrapedData {
  source: string
  content: string
  url: string
}

/**
 * FAST parser — extracts products directly from DuckDuckGo/Amazon snapshots
 * using pattern matching. No AI needed, instant.
 */
export async function parseScrapedContent(
  query: SearchQuery,
  scrapedData: ScrapedData[]
): Promise<SearchResult[]> {
  const country = query.country.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
  const currency = CURRENCY_MAP[country] || 'USD'
  const results: SearchResult[] = []

  for (const { content, source } of scrapedData) {
    if (source.includes('DuckDuckGo')) {
      results.push(...parseDuckDuckGoSnapshot(content, currency))
    } else if (source.includes('Amazon')) {
      results.push(...parseAmazonSnapshot(content, currency))
    }
  }

  // Filter by relevance
  const terms = query.product.toLowerCase().split(/\s+/)
  const filtered = results.filter((r) => {
    const name = r.name.toLowerCase()
    return terms.some((t) => name.includes(t))
  })

  // Sort by price
  filtered.sort((a, b) => {
    const pa = parseFloat(a.price.replace(/[^0-9.]/g, '')) || Infinity
    const pb = parseFloat(b.price.replace(/[^0-9.]/g, '')) || Infinity
    return pa - pb
  })

  return filtered.slice(0, 15)
}

function parseDuckDuckGoSnapshot(snapshot: string, currency: string): SearchResult[] {
  const results: SearchResult[] = []
  const linkRegex = /- link "(.+?)" \[ref=(e\d+)\]/g
  let match

  while ((match = linkRegex.exec(snapshot)) !== null) {
    const text = match[1]
    if (!text.match(/\$[\d,.]+/) || text.length < 20) continue

    const priceMatches = [...text.matchAll(/\$[\d,.]+/g)]
    if (priceMatches.length === 0) continue

    const price = priceMatches[0][0]
    const priceIdx = priceMatches[0].index!

    let name = text.slice(0, priceIdx).replace(/Free shipping\s*/gi, '').trim()

    // Deduplicate name (DDG doubles it)
    const half = Math.floor(name.length / 2)
    if (half > 15 && name.slice(0, half).trim() === name.slice(half).trim()) {
      name = name.slice(0, half).trim()
    }

    const lastPrice = priceMatches[priceMatches.length - 1]
    const store = text.slice(lastPrice.index! + lastPrice[0].length).trim() || 'Tienda'

    if (!name || name.length < 5) continue

    const hasDiscount = priceMatches.length >= 2
    const freeShipping = /free shipping/i.test(text)
    const notes = [
      hasDiscount ? `Antes: ${priceMatches[1][0]}` : '',
      freeShipping ? 'Envío gratis' : '',
    ].filter(Boolean).join(', ')

    results.push({
      name,
      price,
      currency: detectCurrency(store, currency),
      store,
      url: '#',
      availability: 'online_only',
      source: 'browser',
      notes: notes || undefined,
    })
  }

  return results
}

function parseAmazonSnapshot(snapshot: string, currency: string): SearchResult[] {
  const results: SearchResult[] = []
  const lines = snapshot.split('\n')

  for (let i = 0; i < lines.length; i++) {
    const hm = lines[i].match(/heading "(.+?)" \[level=2/)
    if (!hm || hm[1].length < 15 || /skip|keyboard|sort/i.test(hm[1])) continue

    for (let j = i + 1; j < Math.min(i + 8, lines.length); j++) {
      const pm = lines[j].match(/link "(?:CAD |USD |\$|US\$|€|£)?([\d,.]+)/)
      if (pm) {
        const prefix = lines[j].includes('CAD') ? 'CAD ' : '$'
        results.push({
          name: hm[1],
          price: `${prefix}${pm[1]}`,
          currency: lines[j].includes('CAD') ? 'CAD' : currency,
          store: 'Amazon',
          url: '#',
          availability: 'online_only',
          source: 'browser',
        })
        break
      }
    }
  }

  return results
}

function detectCurrency(store: string, fallback: string): string {
  const s = store.toLowerCase()
  if (s.includes(' ca') || s.includes('canada')) return 'CAD'
  if (s.includes('ebay') || s.includes('amazon.com') || s.includes('poshmark')) return 'USD'
  if (s.includes(' uk') || s.includes('amazon.co.uk')) return 'GBP'
  return fallback
}
