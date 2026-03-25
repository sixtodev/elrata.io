import type { SearchResult } from '@/types/search'
import type { AIProviderConfig } from './types'

const API_URL = 'https://openrouter.ai/api/v1/chat/completions'

const MODELS = [
  'meta-llama/llama-3.3-70b-instruct:free',
  'nvidia/nemotron-3-super-120b-a12b:free',
  'nousresearch/hermes-3-llama-3.1-405b:free',
  'qwen/qwen3-next-80b-a3b-instruct:free',
  'openai/gpt-oss-120b:free',
  'openai/gpt-oss-20b:free',
  'mistralai/mistral-small-3.1-24b-instruct:free',
  'google/gemma-3-27b-it:free',
  'stepfun/step-3.5-flash:free',
  'nvidia/nemotron-3-nano-30b-a3b:free',
]

let modelIdx = 0

export const openrouterProvider: AIProviderConfig = {
  name: 'OpenRouter',
  envKey: 'OPEN_ROUTE_API_KEY',

  async search(prompt: string): Promise<SearchResult[]> {
    const apiKey = process.env.OPEN_ROUTE_API_KEY
    if (!apiKey) throw new Error('OPEN_ROUTE_API_KEY not set')

    // Try up to 4 models
    for (let i = 0; i < 4; i++) {
      const model = MODELS[modelIdx % MODELS.length]
      modelIdx++

      try {
        const res = await fetch(API_URL, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
            'HTTP-Referer': process.env.NEXT_PUBLIC_APP_URL || 'https://elrata.io',
            'X-OpenRouter-Title': 'ElRata.io',
          },
          body: JSON.stringify({
            model,
            messages: [{ role: 'user', content: prompt }],
            max_tokens: 4096,
            temperature: 0.3,
          }),
        })

        if (res.status === 429 || res.status === 404) continue
        if (!res.ok) continue

        const data = await res.json()
        const content = data.choices?.[0]?.message?.content
        if (!content) continue

        const results = extractJSON(content)
        if (results.length > 0) {
          console.log(`[openrouter] ✓ ${results.length} results from ${model}`)
          return results
        }
      } catch {
        continue
      }
    }

    return []
  },
}

function extractJSON(text: string): SearchResult[] {
  try {
    let t = text.trim()
    if (!t.startsWith('[')) t = '[' + t
    const match = t.match(/\[[\s\S]*\]/)
    if (!match) return []
    const parsed = JSON.parse(match[0]) as SearchResult[]
    return parsed.filter(
      (r) => r && typeof r.name === 'string' && typeof r.price === 'string' && r.name.length > 0
    )
  } catch {
    return []
  }
}
