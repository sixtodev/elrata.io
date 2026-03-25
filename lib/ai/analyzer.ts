import type { SearchResult } from '@/types/search'

interface AnalysisRequest {
  results: SearchResult[]
  product: string
  purpose: string
  budget?: string
  country: string
}

export interface ProductRecommendation {
  type: 'best_value' | 'best_for_purpose' | 'cheapest' | 'premium'
  label: string
  productIndex: number
  reason: string
}

export interface SearchAnalysis {
  summary: string
  recommendations: ProductRecommendation[]
  priceRange: { min: string; max: string; average: string }
  tip: string
}

/**
 * Uses AI to analyze REAL scraped products and recommend based on purpose.
 * Calls providers directly for raw text response (not roundRobinSearch).
 */
export async function analyzeResults(
  req: AnalysisRequest
): Promise<SearchAnalysis | null> {
  if (req.results.length === 0) return null

  const productsText = req.results
    .map(
      (r, i) =>
        `[${i}] ${r.name} — ${r.price} ${r.currency} en ${r.store}${r.notes ? ` (${r.notes})` : ''}`
    )
    .join('\n')

  const prompt = `Eres un asesor de compras de ElRata.io. Analiza estos productos REALES y da recomendaciones.

PRODUCTOS:
${productsText}

USUARIO BUSCA: "${req.product}"
PROPÓSITO: "${req.purpose}"
${req.budget ? `PRESUPUESTO: ${req.budget}` : ''}
PAÍS: ${req.country}

Responde SOLO este JSON (sin markdown, sin backticks, sin explicación fuera del JSON):
{"summary":"Resumen breve","recommendations":[{"type":"cheapest","label":"🏷️ Más económico","productIndex":0,"reason":"..."},{"type":"best_for_purpose","label":"🎯 Mejor para tu propósito","productIndex":1,"reason":"..."},{"type":"best_value","label":"⭐ Mejor calidad/precio","productIndex":2,"reason":"..."}],"priceRange":{"min":"$X","max":"$Y","average":"$Z"},"tip":"Consejo específico"}`

  const response = await getRawAIResponse(prompt)
  if (!response) return null

  try {
    const jsonMatch = response.match(/\{[\s\S]*\}/)
    if (!jsonMatch) return null

    const analysis = JSON.parse(jsonMatch[0]) as SearchAnalysis

    if (analysis.recommendations) {
      analysis.recommendations = analysis.recommendations.filter(
        (r) => r.productIndex >= 0 && r.productIndex < req.results.length
      )
    }

    return analysis
  } catch (error) {
    console.error('[analyzer] JSON parse failed:', error)
    return null
  }
}

/**
 * Gets raw text from AI providers directly. Tries each until one works.
 * Much faster than roundRobinSearch because it doesn't try to parse as SearchResult[].
 */
async function getRawAIResponse(prompt: string): Promise<string | null> {
  // Try Groq first — fastest inference
  if (process.env.GROQ_API_KEY) {
    const result = await callProvider(
      'https://api.groq.com/openai/v1/chat/completions',
      process.env.GROQ_API_KEY,
      'llama-3.1-8b-instant',
      prompt
    )
    if (result) return result
  }

  // Then Cerebras — also very fast
  if (process.env.CEREBRAS_API_KEY) {
    const result = await callProvider(
      'https://api.cerebras.ai/v1/chat/completions',
      process.env.CEREBRAS_API_KEY,
      'llama3.1-8b',
      prompt
    )
    if (result) return result
  }

  // Then OpenRouter free models
  if (process.env.OPEN_ROUTE_API_KEY) {
    const models = [
      'meta-llama/llama-3.3-70b-instruct:free',
      'nvidia/nemotron-3-super-120b-a12b:free',
      'mistralai/mistral-small-3.1-24b-instruct:free',
    ]
    for (const model of models) {
      const result = await callProvider(
        'https://openrouter.ai/api/v1/chat/completions',
        process.env.OPEN_ROUTE_API_KEY,
        model,
        prompt,
        {
          'HTTP-Referer': process.env.NEXT_PUBLIC_APP_URL || 'https://elrata.io',
          'X-OpenRouter-Title': 'ElRata.io',
        }
      )
      if (result) return result
    }
  }

  return null
}

async function callProvider(
  url: string,
  apiKey: string,
  model: string,
  prompt: string,
  extraHeaders?: Record<string, string>
): Promise<string | null> {
  try {
    console.log(`[analyzer] Trying ${model}...`)

    const res = await fetch(url, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        ...extraHeaders,
      },
      body: JSON.stringify({
        model,
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 1024,
        temperature: 0.3,
      }),
    })

    if (res.status === 429 || res.status === 404) {
      console.log(`[analyzer] ${model}: ${res.status}, skipping`)
      return null
    }

    if (!res.ok) return null

    const data = await res.json()
    const content = data.choices?.[0]?.message?.content
    if (content) {
      console.log(`[analyzer] ✓ Got response from ${model}`)
      return content
    }
  } catch (error) {
    console.error(`[analyzer] ${model} failed:`, error)
  }

  return null
}
