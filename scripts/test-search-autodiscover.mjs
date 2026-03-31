/**
 * Research: ¿se puede autodescubrir el form de búsqueda desde el HTML estático?
 * Testea homepage SIN JavaScript (fetch simple) y CON ScraperAPI render=true
 * Uso: node --env-file=.env.local scripts/test-search-autodiscover.mjs
 */

const API_KEY = process.env.SCRAPERAPI_KEY

const SITES = [
  'https://www.falabella.cl',
  'https://www.elcorteingles.es',
  'https://www.paris.cl',
  'https://www.ripley.com',
  'https://www.exito.com',
  'https://www.fravega.com',
  'https://www.pccomponentes.com',
]

const UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'

function findSearchForm(html) {
  // Strategy 1: <form> with search-related action or role
  const formRegex = /<form([^>]*)>([\s\S]*?)<\/form>/gi
  let match
  while ((match = formRegex.exec(html)) !== null) {
    const attrs = match[1]
    const body = match[2]

    const isSearch =
      /action=["'][^"']*(?:search|buscar|busqueda|query|find|srch)/i.test(attrs) ||
      /role=["']search["']/i.test(attrs) ||
      /class=["'][^"']*search/i.test(attrs) ||
      /id=["'][^"']*search/i.test(attrs)

    if (!isSearch) continue

    // Extract action
    const actionMatch = attrs.match(/action=["']([^"']+)["']/)
    const action = actionMatch ? actionMatch[1] : null

    // Find input name (q, query, keyword, Ntt, s, term, etc.)
    const inputRegex = /<input([^>]*)>/gi
    let inputMatch
    let paramName = null
    while ((inputMatch = inputRegex.exec(body)) !== null) {
      const iAttrs = inputMatch[1]
      if (/type=["'](?:search|text)["']/i.test(iAttrs) || !/type=["']/i.test(iAttrs)) {
        const nameMatch = iAttrs.match(/name=["']([^"']+)["']/)
        if (nameMatch && !/hidden/i.test(iAttrs)) {
          paramName = nameMatch[1]
          break
        }
      }
    }

    if (action || paramName) {
      return { action, paramName, formAttrs: attrs.trim().slice(0, 100) }
    }
  }

  // Strategy 2: look for search input directly (some sites don't wrap in <form>)
  const inputSearch = html.match(/<input[^>]*type=["']search["'][^>]*>/i)
  if (inputSearch) {
    const nameMatch = inputSearch[0].match(/name=["']([^"']+)["']/)
    return { action: null, paramName: nameMatch?.[1] || null, formAttrs: 'input[type=search] (no form)', raw: inputSearch[0].slice(0, 150) }
  }

  return null
}

async function fetchHtml(url, useScraperApi = false) {
  const fetchUrl = useScraperApi && API_KEY
    ? `https://api.scraperapi.com?api_key=${API_KEY}&url=${encodeURIComponent(url)}&render=false`
    : url
  try {
    const res = await fetch(fetchUrl, {
      headers: { 'User-Agent': UA, 'Accept-Language': 'es-419,es;q=0.9' },
      signal: AbortSignal.timeout(15000),
      redirect: 'follow',
    })
    if (!res.ok) return { html: null, status: res.status }
    return { html: await res.text(), status: res.status }
  } catch (e) {
    return { html: null, status: 0, error: e.message }
  }
}

console.log('\n🔬 RESEARCH: Search Form Autodiscovery\n')
console.log('Testing direct fetch (no JS rendering) — simula el approach propuesto\n')

for (const site of SITES) {
  const domain = new URL(site).hostname.replace('www.', '')
  process.stdout.write(`━━━ ${domain} `)

  const { html, status, error } = await fetchHtml(site)

  if (!html) {
    console.log(`→ ❌ HTTP ${status} ${error || ''}`)
    continue
  }

  console.log(`→ ${status} OK (${Math.round(html.length / 1024)}KB)`)

  const result = findSearchForm(html)
  if (result) {
    console.log(`  ✅ Form encontrado`)
    console.log(`     action:    ${result.action || '(none/relative)'}`)
    console.log(`     paramName: ${result.paramName || '(not found)'}`)
    if (result.raw) console.log(`     raw:       ${result.raw}`)

    // Build search URL
    if (result.action && result.paramName) {
      const base = result.action.startsWith('http') ? result.action : `${site}${result.action}`
      const searchUrl = `${base}?${result.paramName}=zapatillas`
      console.log(`     → URL: ${searchUrl}`)
    }
  } else {
    console.log(`  ❌ No se encontró form de búsqueda en HTML estático`)
    // Quick check: does the HTML even have JS bundles? (SPA indicator)
    const hasReact = /react|__next|_nuxt|angular/i.test(html)
    const hasInlineSearch = /search|buscar/i.test(html.slice(0, 5000))
    console.log(`     SPA?: ${hasReact ? 'probablemente sí' : 'no claro'}`)
    console.log(`     Menciona search en head: ${hasInlineSearch}`)
  }
  console.log()
}
