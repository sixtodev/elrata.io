/**
 * Test: diagnóstico del scraper genérico
 * Uso: node --env-file=.env.local scripts/test-generic-scraper.mjs
 */

const API_KEY = process.env.SCRAPERAPI_KEY
if (!API_KEY) { console.error('❌ SCRAPERAPI_KEY no encontrado'); process.exit(1) }

const TESTS = [
  { url: 'https://www.falabella.cl', product: 'zapatillas running', label: 'Falabella Chile' },
  { url: 'https://www.elcorteingles.es', product: 'zapatillas running', label: 'El Corte Inglés' },
]

// Replica buildSearchUrl de generic.ts
function buildSearchUrl(baseUrl, product) {
  const url = new URL(baseUrl)
  const domain = url.hostname.replace('www.', '')
  const encoded = encodeURIComponent(product)

  const patterns = {
    'pcfactory.cl': `/buscar?valor=${encoded}`,
    'paris.cl': `/search?q=${encoded}`,
    'ripley.com': `/search/${encoded}`,
    'sodimac.cl': `/search/?Ntt=${encoded}`,
    'easy.cl': `/search/?Ntt=${encoded}`,
    'lider.cl': `/search?Ntt=${encoded}`,
    'hites.com': `/search?q=${encoded}`,
    'abcdin.cl': `/search?q=${encoded}`,
    'pccomponentes.com': `/buscar/?query=${encoded}`,
    'mediamarkt.es': `/es/search.html?query=${encoded}`,
    'elcorteingles.es': `/search/?s=${encoded}`,
    'falabella.cl': `/falabella-cl/search?Ntt=${encoded}`,
    'liverpool.com.mx': `/tienda?s=${encoded}`,
    'coppel.com': `/search?q=${encoded}`,
    'elektra.com.mx': `/busqueda?q=${encoded}`,
    'fravega.com': `/l/?keyword=${encoded}`,
    'musimundo.com': `/search?q=${encoded}`,
    'garbarino.com': `/q/${encoded}`,
    'exito.com': `/s?q=${encoded}`,
  }

  const pattern = patterns[domain]
  if (pattern) return `${url.origin}${pattern}`
  return `${url.origin}/search?q=${encoded}`
}

for (const { url, product, label } of TESTS) {
  const searchUrl = buildSearchUrl(url, product)
  console.log(`\n━━━ ${label} ━━━`)
  console.log(`URL construida: ${searchUrl}`)

  const scraperUrl = `https://api.scraperapi.com?api_key=${API_KEY}&url=${encodeURIComponent(searchUrl)}&render=true`

  try {
    console.log('Fetching via ScraperAPI...')
    const res = await fetch(scraperUrl, { signal: AbortSignal.timeout(60000) })
    console.log(`Status: ${res.status}`)

    if (!res.ok) { console.log('❌ HTTP error'); continue }

    const html = await res.text()
    console.log(`HTML length: ${html.length} chars`)

    // Check for JSON-LD
    const jsonLdMatches = html.match(/<script[^>]*type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/g) || []
    console.log(`JSON-LD scripts: ${jsonLdMatches.length}`)

    let hasProductJsonLd = false
    for (const match of jsonLdMatches) {
      try {
        const content = match.replace(/<script[^>]*>/, '').replace('</script>', '')
        const data = JSON.parse(content)
        const items = Array.isArray(data) ? data : [data]
        for (const item of items) {
          if (item['@type'] === 'Product' || item['@type'] === 'ItemList') {
            hasProductJsonLd = true
            console.log(`  ✅ JSON-LD Product/ItemList encontrado: ${item.name?.slice(0, 50) || item['@type']}`)
          }
        }
      } catch { /* ignore */ }
    }
    if (!hasProductJsonLd) console.log('  ❌ Sin JSON-LD de productos')

    // Check CSS selectors
    const selectors = [
      'class*="product-card"', 'class*="product-item"', 'class*="producto"',
      'class*="grid-item"', 'class*="catalog-item"', 'class*="card-product"',
    ]
    console.log('CSS selector hints:')
    for (const sel of selectors) {
      const regex = new RegExp(`<[^>]*${sel.replace('*=', '[^"]*').replace('"', '')}[^>]*>`, 'i')
      if (regex.test(html)) console.log(`  ✅ [${sel}] encontrado`)
    }

    // Sample of HTML around price-related terms
    for (const term of ['precio', 'price', 'CLP', 'pod-price', 'Price']) {
      const idx = html.indexOf(term)
      if (idx > -1) {
        console.log(`Contexto "${term}": ...${html.slice(Math.max(0, idx-60), idx+160).replace(/\s+/g, ' ')}...`)
        break
      }
    }

    // Extract all unique class names that could be product containers
    const classMatches = html.match(/class="([^"]{5,80})"/g) || []
    const interesting = new Set()
    for (const m of classMatches) {
      const cls = m.replace(/class="/, '').replace(/"$/, '')
      if (/product|item|card|grid|catalog|article|result|tile|pod/i.test(cls)) {
        interesting.add(cls.trim().split(/\s+/)[0]) // first class only
      }
    }
    console.log(`Clases de contenedor encontradas (${interesting.size}):`)
    ;[...interesting].slice(0, 15).forEach(c => console.log(`  → ${c}`))

  } catch (err) {
    console.error(`❌ Error: ${err.message}`)
  }
}
