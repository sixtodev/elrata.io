import type { SearchResult } from '@/types/search'

// Amazon TLD by country code
const AMAZON_TLD: Record<string, string> = {
  US: 'com', CA: 'ca', MX: 'com.mx', BR: 'com.br',
  ES: 'es', DE: 'de', FR: 'fr', IT: 'it', GB: 'co.uk',
  // LATAM without local Amazon → use .com
  CL: 'com', AR: 'com', CO: 'com', PE: 'com',
  UY: 'com', EC: 'com', VE: 'com',
}

const CURRENCIES: Record<string, string> = {
  US: 'USD', CA: 'CAD', MX: 'MXN', BR: 'BRL',
  ES: 'EUR', DE: 'EUR', FR: 'EUR', IT: 'EUR', GB: 'GBP',
  CL: 'USD', AR: 'USD', CO: 'USD', PE: 'USD',
  UY: 'USD', EC: 'USD', VE: 'USD',
}

interface AmazonItem {
  name?: string
  url?: string
  image?: string
  // Price fields per ScraperAPI docs
  price?: number        // numeric value  e.g. 17077
  price_string?: string // formatted      e.g. "MX$17,077"
  price_symbol?: string // symbol only    e.g. "$"
  // Badges
  has_prime?: boolean
  is_best_seller?: boolean
  is_amazon_choice?: boolean
  is_limited_deal?: boolean
  // Ratings
  stars?: number
  total_reviews?: number
}

export async function searchAmazon(
  product: string,
  countryCode: string,
  budget?: string
): Promise<SearchResult[]> {
  const apiKey = process.env.SCRAPERAPI_KEY
  if (!apiKey) {
    console.error('[amazon] SCRAPERAPI_KEY not set')
    return []
  }

  const tld = AMAZON_TLD[countryCode] || 'com'
  const currency = CURRENCIES[countryCode] || 'USD'

  const url = `https://api.scraperapi.com/structured/amazon/search?api_key=${apiKey}&query=${encodeURIComponent(product)}&tld=${tld}&country_code=${countryCode.toLowerCase()}`

  console.log(`[amazon] Searching: "${product}" on amazon.${tld}`)

  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(30000) })

    if (!res.ok) {
      console.error(`[amazon] ScraperAPI error: ${res.status}`)
      return []
    }

    const data = await res.json()
    const items: AmazonItem[] = data?.results || []

    console.log(`[amazon] Raw items: ${items.length}`)

    const priceMax = budget ? parseBudget(budget) : null

    const results: SearchResult[] = items
      .filter((item) => item.name && item.url)
      .filter((item) => {
        // price field is unreliable (ScraperAPI divides by 1000 in some markets)
        // parse price_string directly for accurate budget comparison
        if (!priceMax || !item.price_string) return true
        const num = parseNumericPrice(item.price_string)
        return isNaN(num) || num <= priceMax * 1.15
      })
      .slice(0, 10)
      .map((item) => {
        // price_string is the formatted price with currency symbol (e.g. "MX$17,077")
        // Fall back to numeric price only if price_string is missing
        const price = item.price_string || (item.price != null ? String(item.price) : 'Ver precio')
        return {
          name: item.name!,
          price,
          currency,
          store: `Amazon ${countryCode}`,
          store_id: undefined,
          url: item.url!,
          availability: 'in_stock' as const,
          source: 'crawlee' as const,
          scraper_type: 'amazon-structured',
          image: item.image || null,
          notes: [
            item.has_prime ? 'Prime' : '',
            item.is_best_seller ? 'Best Seller' : '',
            item.is_amazon_choice ? "Amazon's Choice" : '',
            item.is_limited_deal ? 'Oferta limitada' : '',
            item.stars ? `${item.stars}★ (${item.total_reviews || 0})` : '',
          ].filter(Boolean).join(' · ') || undefined,
        }
      })

    console.log(`[amazon] ✓ ${results.length} results`)
    return results
  } catch (error) {
    console.error('[amazon] Error:', error)
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

/** Parse a formatted price string like "$8,124.00" or "MX$17,077" into a number */
function parseNumericPrice(priceStr: string): number {
  const cleaned = priceStr.replace(/[^0-9.,]/g, '')
  if (!cleaned) return NaN
  const dots = (cleaned.match(/\./g) || []).length
  const commas = (cleaned.match(/,/g) || []).length
  // Both separators: determine which is decimal
  if (dots === 1 && commas === 1) {
    return cleaned.indexOf('.') < cleaned.indexOf(',')
      ? parseFloat(cleaned.replace('.', '').replace(',', '.')) // European: 1.234,56
      : parseFloat(cleaned.replace(',', ''))                   // US: 8,124.00
  }
  if (dots > 1) return parseFloat(cleaned.replace(/\./g, ''))  // 1.299.990
  if (commas > 1) return parseFloat(cleaned.replace(/,/g, '')) // 1,299,990
  if (commas === 1) {
    const after = cleaned.split(',')[1] ?? ''
    return after.length === 3
      ? parseFloat(cleaned.replace(',', ''))   // thousands: 8,124
      : parseFloat(cleaned.replace(',', '.'))  // decimal: 8,12
  }
  return parseFloat(cleaned)
}
