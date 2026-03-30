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
  price?: string
  image?: string
  url?: string
  rating?: string
  review_count?: string
  prime?: boolean
  best_seller?: boolean
  amazons_choice?: boolean
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
        if (!priceMax || !item.price) return true
        const priceStr = String(item.price)
        const num = parseFloat(priceStr.replace(/[^0-9.]/g, ''))
        return isNaN(num) || num <= priceMax * 1.15
      })
      .slice(0, 10)
      .map((item) => ({
        name: item.name!,
        price: item.price != null ? String(item.price) : 'Ver precio',
        currency,
        store: `Amazon ${countryCode}`,
        store_id: undefined,
        url: item.url!,
        availability: 'in_stock' as const,
        source: 'crawlee' as const,
        scraper_type: 'amazon-structured',
        image: item.image || null,
        notes: [
          item.prime ? 'Prime' : '',
          item.best_seller ? 'Best Seller' : '',
          item.amazons_choice ? "Amazon's Choice" : '',
          item.rating ? `${item.rating}★ (${item.review_count || 0})` : '',
        ].filter(Boolean).join(' · ') || undefined,
      }))

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
