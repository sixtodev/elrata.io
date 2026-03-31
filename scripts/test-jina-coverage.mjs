/**
 * Test: cobertura de Jina en e-commerces conocidos por país
 * Uso: node --env-file=.env.local scripts/test-jina-coverage.mjs
 */

const PRODUCT = 'zapatillas running'
const ENCODED = encodeURIComponent(PRODUCT)

// Sitios a testear con sus URLs de búsqueda
const SITES = [
  // Chile
  { label: 'Falabella CL',  url: `https://www.falabella.cl/falabella-cl/search?Ntt=${ENCODED}` },
  { label: 'Paris CL',      url: `https://www.paris.cl/search?q=${ENCODED}` },
  { label: 'Ripley CL',     url: `https://simple.ripley.cl/search?string=${ENCODED}` },
  { label: 'Sodimac CL',    url: `https://www.sodimac.cl/search/?Ntt=${ENCODED}` },
  // Argentina
  { label: 'Fravega AR',    url: `https://www.fravega.com/l/?keyword=${ENCODED}` },
  { label: 'Garbarino AR',  url: `https://www.garbarino.com/q/${ENCODED}` },
  { label: 'Musimundo AR',  url: `https://www.musimundo.com/search?q=${ENCODED}` },
  // Mexico
  { label: 'Liverpool MX',  url: `https://www.liverpool.com.mx/tienda?s=${ENCODED}` },
  { label: 'Coppel MX',     url: `https://www.coppel.com/search?q=${ENCODED}` },
  // Colombia
  { label: 'Exito CO',      url: `https://www.exito.com/s?q=${ENCODED}` },
  // España
  { label: 'PCComponentes ES', url: `https://www.pccomponentes.com/buscar/?query=${ENCODED}` },
  { label: 'MediaMarkt ES', url: `https://www.mediamarkt.es/es/search.html?query=${ENCODED}` },
  { label: 'El Corte Inglés ES', url: `https://www.elcorteingles.es/search/?s=${ENCODED}` },
]

// Regex para detectar productos en el markdown de Jina
const LINK_REGEX = /\[([^\[\]]{10,200})\]\((https?:\/\/[^\)]+\/(?:product|p\/|producto|item|pid|sku|cat)[^\)]*)\)/g
const PRICE_REGEX = /[\$€£][\d.,]{3,}|\d{1,3}(?:[.,]\d{3})+/

function countProducts(text, queryWords) {
  let count = 0
  let match
  const regex = new RegExp(LINK_REGEX.source, 'g')
  while ((match = regex.exec(text)) !== null) {
    const [, linkText] = match
    if (linkText.startsWith('!')) continue
    const hasPrice = PRICE_REGEX.test(linkText)
    const isRelevant = queryWords.some(w => linkText.toLowerCase().includes(w))
    if (hasPrice && isRelevant) count++
  }
  return count
}

const queryWords = PRODUCT.toLowerCase().split(/\s+/).filter(w => w.length > 2)

console.log(`\n🔬 Cobertura de Jina — "${PRODUCT}"\n`)
console.log(`${'Sitio'.padEnd(22)} ${'Status'.padEnd(8)} ${'Tiempo'.padEnd(8)} ${'Chars'.padEnd(8)} ${'Productos'}`)
console.log('─'.repeat(70))

// Run all in parallel
const results = await Promise.allSettled(
  SITES.map(async ({ label, url }) => {
    const start = Date.now()
    try {
      const res = await fetch(`https://r.jina.ai/${url}`, {
        headers: { 'Accept': 'text/plain' },
        signal: AbortSignal.timeout(20000),
      })
      const elapsed = Date.now() - start
      if (!res.ok) return { label, ok: false, status: res.status, elapsed, chars: 0, products: 0 }
      const text = await res.text()
      const products = text.length > 300 ? countProducts(text, queryWords) : 0
      return { label, ok: true, status: res.status, elapsed, chars: text.length, products, text }
    } catch (e) {
      return { label, ok: false, status: 0, elapsed: Date.now() - start, chars: 0, products: 0, error: e.message }
    }
  })
)

for (const r of results) {
  const d = r.status === 'fulfilled' ? r.value : { ...SITES[0], ok: false, status: 0, elapsed: 0, chars: 0, products: 0 }
  const statusIcon = d.ok && d.chars > 300 ? '✅' : d.ok ? '⚠️ ' : '❌'
  const resultLabel = d.products > 0 ? `${d.products} productos` : d.chars < 300 ? 'bloqueado' : 'sin match'
  console.log(
    `${d.label.padEnd(22)} ${statusIcon} ${String(d.status).padEnd(6)} ${(d.elapsed + 'ms').padEnd(8)} ${String(d.chars).padEnd(8)} ${resultLabel}`
  )
  // Show sample links from "sin match" sites with content
  if (d.products === 0 && d.chars > 5000 && d.text) {
    // Show first 5 links that have a price in the text
    const links = [...d.text.matchAll(/\[([^\[\]]{10,150})\]\((https?:\/\/[^\)]{10,150})\)/g)]
      .filter(([, txt]) => PRICE_REGEX.test(txt))
      .slice(0, 5)
    if (links.length > 0) {
      console.log(`     Links con precio encontrados:`)
      links.forEach(([, txt, url]) => {
        console.log(`       txt: ${txt.slice(0, 80)}`)
        console.log(`       url: ${url.slice(0, 90)}`)
      })
    } else {
      // Show any 3 links to understand structure
      const anyLinks = [...d.text.matchAll(/\[([^\[\]]{10,100})\]\((https?:\/\/[^\)]{20,120})\)/g)].slice(0, 3)
      console.log(`     Sin precios. Muestra de links:`)
      anyLinks.forEach(([, txt, url]) => console.log(`       ${url.slice(0, 90)}`))
    }
  }
}
