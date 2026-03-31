/**
 * Test: verifica qué campos de precio devuelve ScraperAPI Amazon
 * Uso: node --env-file=.env.local scripts/test-amazon-prices.mjs
 */

const API_KEY = process.env.SCRAPERAPI_KEY
if (!API_KEY) {
  console.error('❌ SCRAPERAPI_KEY no encontrado.')
  process.exit(1)
}

const query = 'iPhone 15'
const tld = 'com.mx'
const country_code = 'mx'

const url = `https://api.scraperapi.com/structured/amazon/search?api_key=${API_KEY}&query=${encodeURIComponent(query)}&tld=${tld}&country_code=${country_code}`

console.log(`\n🧪 TEST AMAZON — "${query}" en amazon.${tld}\n`)

const res = await fetch(url, { signal: AbortSignal.timeout(30000) })
const data = await res.json()
const items = data?.results || []

console.log(`Total items: ${items.length}`)
console.log(`\nPrimeros 5 — campos de precio:\n`)

items.slice(0, 5).forEach((item, i) => {
  console.log(`${i + 1}. ${item.name?.slice(0, 60)}`)
  console.log(`   price        → ${JSON.stringify(item.price)}        (${typeof item.price})`)
  console.log(`   price_string → ${JSON.stringify(item.price_string)}`)
  console.log(`   price_symbol → ${JSON.stringify(item.price_symbol)}`)
  console.log(`   stars        → ${item.stars} | total_reviews → ${item.total_reviews}`)
  console.log(`   has_prime    → ${item.has_prime} | is_best_seller → ${item.is_best_seller}`)
  console.log()
})

console.log('─'.repeat(60))
console.log('Todas las keys del primer item:')
if (items[0]) console.log(Object.keys(items[0]).join(', '))
