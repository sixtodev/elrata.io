import type { SearchResult } from '@/types/search'
import type { AIProviderConfig } from './types'

const API_URL = 'https://api.groq.com/openai/v1/chat/completions'
const MODEL = 'openai/gpt-oss-120b'

export const groqProvider: AIProviderConfig = {
  name: 'Groq',
  envKey: 'GROQ_API_KEY',

  async search(prompt: string): Promise<SearchResult[]> {
    const apiKey = process.env.GROQ_API_KEY
    if (!apiKey) throw new Error('GROQ_API_KEY not set')

    const res = await fetch(API_URL, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: MODEL,
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 4096,
        temperature: 0.3,
      }),
    })

    if (!res.ok) {
      const err = await res.text()
      console.error(`[groq] Error ${res.status}:`, err.slice(0, 200))
      throw new Error(`Groq ${res.status}`)
    }

    const data = await res.json()
    const content = data.choices?.[0]?.message?.content
    if (!content) return []

    return extractJSON(content)
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
