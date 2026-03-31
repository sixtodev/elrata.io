/**
 * Test: Jina con X-Timeout para sitios lentos
 * Uso: node --env-file=.env.local scripts/test-jina-timeout.mjs
 */

const TESTS = [
  { url: 'https://www.elcorteingles.es/search/?s=zapatillas%20running', label: 'El Corte Inglés' },
  { url: 'https://www.falabella.cl/falabella-cl/search?Ntt=zapatillas%20running', label: 'Falabella (parse demo)' },
]

// Regex para extraer productos del markdown de Jina
// Formato: [MARCA ### Nombre Producto RATING $PRECIO -X% $PRECIO_ORIGINAL](URL)
function parseJinaMarkdown(text) {
  const products = []
  const linkRegex = /\[([^\[\]]{10,200})\]\((https?:\/\/[^\)]+\/(?:product|p|producto|item)\/[^\)]+)\)/g
  let match

  while ((match = linkRegex.exec(text)) !== null) {
    const [, linkText, url] = match

    // Skip obvious non-products (images, navigation)
    if (linkText.startsWith('!') || linkText.startsWith('Image')) continue
    if (/^(ver más|ver todo|see all|siguiente|anterior)/i.test(linkText)) continue

    // Extract price
    const priceMatch = linkText.match(/\$[\d.,]{3,}/)
    if (!priceMatch) continue
    const price = priceMatch[0]

    // Extract name — after ### if present, otherwise use full text
    let name = linkText
    if (linkText.includes('###')) {
      const parts = linkText.split('###')
      name = parts[1]?.trim() || linkText
    }
    // Clean up name: remove price, rating, discount patterns
    name = name
      .replace(/\$[\d.,]+/g, '')
      .replace(/-\d+%/g, '')
      .replace(/\d+\.\d+\s/g, '') // rating like "4.9 "
      .replace(/Patrocinado/gi, '')
      .trim()
      .replace(/\s+/g, ' ')
      .slice(0, 120)

    if (name.length < 5) continue

    products.push({ name, price, url })
  }

  return products
}

for (const { url, label } of TESTS) {
  console.log(`\n━━━ ${label} ━━━`)

  // Test with timeout header
  const start = Date.now()
  const res = await fetch(`https://r.jina.ai/${url}`, {
    headers: {
      'Accept': 'text/plain',
      'X-Timeout': '20',  // 20 seconds wait for JS rendering
    },
    signal: AbortSignal.timeout(35000),
  })
  const elapsed = Date.now() - start
  console.log(`Status: ${res.status} | Time: ${elapsed}ms`)

  if (!res.ok) { console.log(`❌ HTTP ${res.status}`); continue }

  const text = await res.text()
  console.log(`Content: ${text.length} chars`)

  if (text.length < 200) {
    console.log(`⚠️  Contenido muy corto:\n${text.slice(0, 300)}`)
    continue
  }

  const products = parseJinaMarkdown(text)
  console.log(`\n✅ Productos parseados: ${products.length}`)
  products.slice(0, 5).forEach((p, i) => {
    console.log(`  ${i+1}. ${p.name.slice(0, 70)}`)
    console.log(`     Precio: ${p.price} | URL: ${p.url.slice(0, 60)}...`)
  })
}
