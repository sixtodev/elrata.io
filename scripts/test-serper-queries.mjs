/**
 * Test: compara query viejo vs query nuevo de Serper Shopping
 * Uso: node --env-file=.env.local scripts/test-serper-queries.mjs
 */

const API_KEY = process.env.SERPER_API_KEY
if (!API_KEY) {
  console.error('❌ SERPER_API_KEY no encontrado. Ejecutá con: node --env-file=.env.local scripts/test-serper-queries.mjs')
  process.exit(1)
}

const SHOPPING_URL = 'https://google.serper.dev/shopping'

async function testQuery(label, payload) {
  const res = await fetch(SHOPPING_URL, {
    method: 'POST',
    headers: { 'X-API-KEY': API_KEY, 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
  const data = await res.json()
  const items = data.shopping || []
  console.log(`\n${'─'.repeat(60)}`)
  console.log(`📋 ${label}`)
  console.log(`   Query: "${payload.q}"`)
  console.log(`   gl: ${payload.gl} | location: ${payload.location || '(ninguno)'}`)
  console.log(`   Resultados: ${items.length}`)
  items.slice(0, 8).forEach((item, i) => {
    const store = item.source || '???'
    const price = item.price || 'Sin precio'
    console.log(`   ${i + 1}. [${store}] ${item.title?.slice(0, 50)}... → ${price}`)
  })
}

// Producto de prueba
const PRODUCTO = 'iPhone 15'
const PAIS = 'Colombia'
const MONEDA = 'COP'
const GL = 'co'
const LOCATION = 'Colombia'
const TLD = '.co'

console.log(`\n🧪 TEST SERPER SHOPPING — ${PRODUCTO} en ${PAIS}`)
console.log('Comparando formato viejo vs nuevo...\n')

await testQuery('VIEJO — sin moneda, sin location, sin site:', {
  q: `${PRODUCTO} tienda ${PAIS}`,
  gl: GL,
  hl: 'es',
  num: 10,
})

await testQuery('NUEVO 1 — fórmula base: precio + moneda + location', {
  q: `"${PRODUCTO}" precio ${PAIS} ${MONEDA}`,
  gl: GL,
  hl: 'es',
  location: LOCATION,
  num: 10,
})

await testQuery(`NUEVO 2 — con site:${TLD} + location`, {
  q: `${PRODUCTO} precio ${PAIS} ${MONEDA} site:${TLD}`,
  gl: GL,
  hl: 'es',
  location: LOCATION,
  num: 10,
})

await testQuery('NUEVO 3 — comprar intent + moneda + location', {
  q: `comprar ${PRODUCTO} ${PAIS} ${MONEDA}`,
  gl: GL,
  hl: 'es',
  location: LOCATION,
  num: 10,
})

console.log(`\n${'─'.repeat(60)}`)
console.log('✅ Test terminado. Revisá qué formato trae más tiendas locales (.co, colombianas).')
