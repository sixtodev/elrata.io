/**
 * Test: verifica Option A (scrape) y Option B (site: search) para custom URLs
 * Uso: node --env-file=.env.local scripts/test-custom-url.mjs
 */

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

const TESTS = [
  { custom_url: 'https://www.falabella.cl', country: 'chile', label: 'Falabella CL (Option A — known store)' },
  { custom_url: 'https://www.elcorteingles.es', country: 'espana', label: 'El Corte Inglés (Option A — known store)' },
]

for (const { custom_url, country, label } of TESTS) {
  console.log(`\n━━━ ${label} ━━━`)
  console.log(`custom_url: ${custom_url}`)

  const res = await fetch(`${BASE_URL}/api/search`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      product: 'zapatillas running',
      country,
      city: '',
      purpose: 'uso diario',
      source: 'all',
      custom_url,
    }),
  })

  const data = await res.json()

  if (data.error) {
    console.error(`❌ Error: ${data.error}`)
    continue
  }

  const sources = data.sources_used || []
  const results = data.results || []
  console.log(`Sources: [${sources.join(', ')}]`)
  console.log(`Resultados: ${results.length}`)

  const leaked = sources.some(s => ['amazon', 'web search', 'crawlee'].includes(s.toLowerCase()))
  if (leaked) {
    console.error('❌ BUG: sources contienen fuentes externas')
  } else if (results.length === 0) {
    console.warn('⚠️  Sin resultados')
  } else {
    console.log('✅ Solo fuente custom')
  }

  results.slice(0, 3).forEach((r, i) => {
    console.log(`  ${i + 1}. ${r.name?.slice(0, 55)} | ${r.price} | ${r.store}`)
  })
}
