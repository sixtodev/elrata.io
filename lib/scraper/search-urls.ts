import type { SearchQuery } from '@/types/search'

interface SearchUrl {
  url: string
  source: string
  priority: number
}

/**
 * Generates search URLs based on the product, location, and country.
 * Uses correct URL formats verified with agent-browser.
 */
export function generateSearchUrls(query: SearchQuery): SearchUrl[] {
  const productRaw = `${query.product}${query.brand ? ` ${query.brand}` : ''}`
  const product = encodeURIComponent(productRaw)
  const location = encodeURIComponent(`${query.city} ${query.country}`)
  const urls: SearchUrl[] = []

  const countryLower = query.country.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')

  // DuckDuckGo region codes for local results
  const ddgRegions: Record<string, string> = {
    chile: 'xl-es', argentina: 'ar-es', colombia: 'co-es', mexico: 'mx-es',
    peru: 'pe-es', espana: 'es-es', spain: 'es-es',
    'estados unidos': 'us-en', usa: 'us-en', 'united states': 'us-en',
    canada: 'ca-en', brasil: 'br-pt', brazil: 'br-pt',
    'reino unido': 'uk-en', 'united kingdom': 'uk-en',
  }
  const region = ddgRegions[countryLower] || 'wt-wt'

  // DuckDuckGo Shopping — works perfectly with agent-browser, never blocks
  urls.push({
    url: `https://duckduckgo.com/?q=${product}+precio+${location}&ia=shopping&kl=${region}`,
    source: 'DuckDuckGo Shopping',
    priority: 0, // Highest priority
  })

  // Amazon domains — always works well with agent-browser
  const amazonDomains: Record<string, string> = {
    'estados unidos': 'amazon.com',
    usa: 'amazon.com',
    'united states': 'amazon.com',
    mexico: 'amazon.com.mx',
    espana: 'amazon.es',
    spain: 'amazon.es',
    alemania: 'amazon.de',
    germany: 'amazon.de',
    'reino unido': 'amazon.co.uk',
    'united kingdom': 'amazon.co.uk',
    francia: 'amazon.fr',
    france: 'amazon.fr',
    italia: 'amazon.it',
    italy: 'amazon.it',
    brasil: 'amazon.com.br',
    brazil: 'amazon.com.br',
    japon: 'amazon.co.jp',
    japan: 'amazon.co.jp',
    canada: 'amazon.ca',
  }

  const amazonDomain = amazonDomains[countryLower]
  if (amazonDomain) {
    urls.push({
      url: `https://${amazonDomain}/s?k=${product}`,
      source: 'Amazon',
      priority: 1,
    })
  }

  // MercadoLibre — use listado.mercadolibre format
  const mercadoLibreDomains: Record<string, string> = {
    argentina: 'listado.mercadolibre.com.ar',
    chile: 'listado.mercadolibre.cl',
    colombia: 'listado.mercadolibre.com.co',
    mexico: 'listado.mercadolibre.com.mx',
    uruguay: 'listado.mercadolibre.com.uy',
    peru: 'listado.mercadolibre.com.pe',
    venezuela: 'listado.mercadolibre.com.ve',
    ecuador: 'listado.mercadolibre.com.ec',
  }

  const mlDomain = mercadoLibreDomains[countryLower]
  if (mlDomain) {
    // MercadoLibre uses hyphens in search URL
    const mlQuery = productRaw.replace(/\s+/g, '-')
    urls.push({
      url: `https://${mlDomain}/${encodeURIComponent(mlQuery)}`,
      source: 'MercadoLibre',
      priority: 1,
    })
  }

  // Chile specific stores
  if (countryLower === 'chile') {
    urls.push(
      {
        url: `https://www.falabella.com/falabella-cl/search?Ntt=${product}`,
        source: 'Falabella',
        priority: 2,
      },
      {
        url: `https://www.paris.cl/search?q=${product}`,
        source: 'Paris',
        priority: 3,
      },
      {
        url: `https://simple.ripley.cl/search/${product}`,
        source: 'Ripley',
        priority: 3,
      }
    )
  }

  // Colombia specific
  if (countryLower === 'colombia') {
    urls.push(
      {
        url: `https://www.falabella.com.co/falabella-co/search?Ntt=${product}`,
        source: 'Falabella',
        priority: 2,
      },
      {
        url: `https://www.exito.com/s?q=${product}`,
        source: 'Éxito',
        priority: 2,
      }
    )
  }

  // Mexico specific
  if (countryLower === 'mexico') {
    urls.push(
      {
        url: `https://www.liverpool.com.mx/tienda?s=${product}`,
        source: 'Liverpool',
        priority: 2,
      },
      {
        url: `https://www.amazon.com.mx/s?k=${product}`,
        source: 'Amazon MX',
        priority: 1,
      }
    )
  }

  // Argentina specific
  if (countryLower === 'argentina') {
    urls.push({
      url: `https://www.fravega.com/l/?keyword=${product}`,
      source: 'Frávega',
      priority: 2,
    })
  }

  // Spain specific
  if (countryLower === 'espana' || countryLower === 'spain') {
    urls.push(
      {
        url: `https://www.pccomponentes.com/buscar/?query=${product}`,
        source: 'PcComponentes',
        priority: 2,
      },
      {
        url: `https://www.mediamarkt.es/es/search.html?query=${product}`,
        source: 'MediaMarkt',
        priority: 2,
      }
    )
  }

  // USA specific — add Best Buy, Walmart
  if (countryLower === 'estados unidos' || countryLower === 'usa' || countryLower === 'united states') {
    urls.push(
      {
        url: `https://www.bestbuy.com/site/searchpage.jsp?st=${product}`,
        source: 'Best Buy',
        priority: 2,
      },
      {
        url: `https://www.walmart.com/search?q=${product}`,
        source: 'Walmart',
        priority: 2,
      }
    )
  }

  // DuckDuckGo general search as additional source
  urls.push({
    url: `https://duckduckgo.com/?q=${product}+mejor+precio+${location}`,
    source: 'DuckDuckGo',
    priority: 5,
  })

  // Sort by priority (lower = higher priority)
  return urls.sort((a, b) => a.priority - b.priority)
}
