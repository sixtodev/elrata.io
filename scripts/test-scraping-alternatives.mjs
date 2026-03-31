/**
 * Research: alternativas de scraping para custom URL search
 * Testea Jina AI Reader (gratis, sin API key) vs ScraperAPI actual
 * Uso: node --env-file=.env.local scripts/test-scraping-alternatives.mjs
 */

const SCRAPERAPI_KEY = process.env.SCRAPERAPI_KEY

const TESTS = [
  {
    label: 'Falabella Chile — zapatillas running',
    storeUrl: 'https://www.falabella.cl/falabella-cl/search?Ntt=zapatillas%20running',
    product: 'zapatillas running',
  },
  {
    label: 'El Corte Inglés — zapatillas running',
    storeUrl: 'https://www.elcorteingles.es/search/?s=zapatillas%20running',
    product: 'zapatillas running',
  },
]

// ── Jina AI Reader ──────────────────────────────────────────────
// Convierte cualquier URL a Markdown limpio. GRATIS, sin API key.
// Docs: https://jina.ai/reader/
async function testJina(url) {
  const jinaUrl = `https://r.jina.ai/${url}`
  const start = Date.now()
  try {
    const res = await fetch(jinaUrl, {
      headers: { 'Accept': 'text/plain' },
      signal: AbortSignal.timeout(30000),
    })
    const elapsed = Date.now() - start
    if (!res.ok) return { ok: false, elapsed, status: res.status }
    const text = await res.text()
    // Store full text for analysis
    return { ok: true, elapsed, length: text.length, preview: text, fullText: text }
  } catch (e) {
    return { ok: false, elapsed: Date.now() - start, error: e.message }
  }
}

// ── ScraperAPI render=true (actual) ─────────────────────────────
async function testScraperApi(url) {
  if (!SCRAPERAPI_KEY) return { ok: false, error: 'No SCRAPERAPI_KEY' }
  const scraperUrl = `https://api.scraperapi.com?api_key=${SCRAPERAPI_KEY}&url=${encodeURIComponent(url)}&render=true`
  const start = Date.now()
  try {
    const res = await fetch(scraperUrl, { signal: AbortSignal.timeout(60000) })
    const elapsed = Date.now() - start
    if (!res.ok) return { ok: false, elapsed, status: res.status }
    const html = await res.text()
    // Extract text content roughly (strip tags)
    const text = html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').slice(0, 800)
    return { ok: true, elapsed, length: html.length, preview: text }
  } catch (e) {
    return { ok: false, elapsed: Date.now() - start, error: e.message }
  }
}

// ── Helpers ──────────────────────────────────────────────────────
function extractPrices(text) {
  const matches = text.match(/(?:\$|€|£|CLP|ARS|COP|MXN|PEN|USD|EUR)\s*[\d.,]{3,}/g) || []
  // Also try number patterns that look like prices
  const numMatches = text.match(/\d{1,3}(?:[.,]\d{3})+(?:[.,]\d{2})?/g) || []
  return [...new Set([...matches, ...numMatches])].slice(0, 8)
}

function extractProductNames(text, product) {
  const lines = text.split('\n').filter(l => l.trim().length > 15 && l.trim().length < 200)
  const relevant = lines.filter(l =>
    product.split(' ').some(word => l.toLowerCase().includes(word.toLowerCase()))
  )
  return relevant.slice(0, 5)
}

// ── Run tests ────────────────────────────────────────────────────
for (const { label, storeUrl, product } of TESTS) {
  console.log(`\n${'━'.repeat(60)}`)
  console.log(`📦 ${label}`)
  console.log(`${'━'.repeat(60)}`)

  // Run in parallel
  console.log('\nRunning Jina + ScraperAPI en paralelo...')
  const [jina, scraper] = await Promise.all([
    testJina(storeUrl),
    testScraperApi(storeUrl),
  ])

  // Jina results
  console.log(`\n🔵 Jina AI Reader (r.jina.ai) — GRATIS, sin API key`)
  if (jina.ok) {
    console.log(`   ✅ ${jina.elapsed}ms | ${jina.length} chars`)
    const prices = extractPrices(jina.fullText)
    const names = extractProductNames(jina.fullText, product)
    console.log(`   Precios detectados (${prices.length}): ${prices.join(' | ') || '❌ ninguno'}`)
    console.log(`   Productos detectados (${names.length}):`)
    names.forEach(n => console.log(`     → ${n.trim().slice(0, 100)}`))
    // Show a slice from the middle where products usually are
    const mid = Math.floor(jina.length * 0.15)
    console.log(`   Contenido desde 15%:\n   ${jina.fullText.slice(mid, mid + 800).replace(/\n/g, '\n   ')}`)
  } else {
    console.log(`   ❌ Error: ${jina.error || `HTTP ${jina.status}`} (${jina.elapsed}ms)`)
  }

  // ScraperAPI results
  console.log(`\n🟡 ScraperAPI render=true (actual)`)
  if (scraper.ok) {
    console.log(`   ✅ ${scraper.elapsed}ms | ${scraper.length} chars HTML`)
    const prices = extractPrices(scraper.preview)
    console.log(`   Precios detectados: ${prices.length > 0 ? prices.join(' | ') : '❌ ninguno en preview'}`)
  } else {
    console.log(`   ❌ Error: ${scraper.error || `HTTP ${scraper.status}`} (${scraper.elapsed}ms)`)
  }
}

console.log('\n\n📊 RESUMEN DE VELOCIDAD:')
console.log('   Jina ideal: 3-8s | ScraperAPI render=true: 15-60s')
