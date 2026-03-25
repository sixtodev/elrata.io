import type { SearchResult } from '@/types/search'

const API_URL = 'https://serpapi.com/search'

interface SerpAPIShoppingResult {
  title: string
  price: string
  extracted_price?: number
  link: string
  source: string
  thumbnail?: string
  reviews?: number
  rating?: number
}

export async function searchSerpAPI(
  query: string,
  country: string,
  city: string
): Promise<SearchResult[]> {
  const apiKey = process.env.SERPAPI_API_KEY
  if (!apiKey) return []

  const gl = getGoogleCountry(country)
  const currency = getCurrency(gl)
  const results: SearchResult[] = []

  // Try shopping + regular search
  const queries = [
    { engine: 'google_shopping', q: `${query} ${city} ${country}` },
    { engine: 'google_shopping', q: `comprar ${query} ${country}` },
  ]

  for (const { engine, q } of queries) {
    if (results.length >= 10) break

    try {
      const params = new URLSearchParams({
        engine,
        q,
        gl,
        hl: 'es',
        api_key: apiKey,
        num: '15',
      })

      const res = await fetch(`${API_URL}?${params}`)
      if (!res.ok) continue

      const data = await res.json()
      const shopping = (data.shopping_results || []) as SerpAPIShoppingResult[]

      for (const item of shopping) {
        if (results.some((r) => r.url === item.link)) continue

        results.push({
          name: item.title,
          price: item.price || `$${item.extracted_price || 0}`,
          currency,
          store: item.source || 'Tienda',
          url: item.link,
          availability: 'online_only',
          source: 'crawlee',
          image: item.thumbnail || null,
          notes: item.rating ? `${item.rating}★ (${item.reviews || 0})` : undefined,
        })
      }
    } catch {
      continue
    }
  }

  console.log(`[serpapi] Found ${results.length} results`)
  return results
}

function getGoogleCountry(country: string): string {
  const map: Record<string, string> = {
    chile: 'cl', argentina: 'ar', colombia: 'co', mexico: 'mx',
    peru: 'pe', espana: 'es', brasil: 'br', canada: 'ca',
    'estados unidos': 'us', usa: 'us',
  }
  return map[country.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')] || 'us'
}

function getCurrency(gl: string): string {
  const map: Record<string, string> = {
    cl: 'CLP', ar: 'ARS', co: 'COP', mx: 'MXN',
    pe: 'PEN', us: 'USD', es: 'EUR', br: 'BRL', ca: 'CAD',
  }
  return map[gl] || 'USD'
}
