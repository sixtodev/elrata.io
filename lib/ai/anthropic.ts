import Anthropic from '@anthropic-ai/sdk'
import type { SearchQuery, SearchResult } from '@/types/search'
import { buildSearchPrompt } from './prompt-builder'

let _client: Anthropic | null = null
function getClient() {
  if (!_client) _client = new Anthropic()
  return _client
}

export async function searchWithClaude(
  query: SearchQuery
): Promise<SearchResult[]> {
  const client = getClient()
  const prompt = buildSearchPrompt(query)

  const response = await client.messages.create({
    model: 'claude-sonnet-4-6-20250514',
    max_tokens: 4096,
    tools: [
      {
        type: 'web_search',
        name: 'web_search',
        max_uses: 5,
      } as unknown as Anthropic.Messages.Tool,
    ],
    messages: [{ role: 'user', content: prompt }],
  })

  const textBlock = response.content.find((block) => block.type === 'text')
  if (!textBlock || textBlock.type !== 'text') return []

  try {
    const jsonMatch = textBlock.text.match(/\[[\s\S]*\]/)
    if (!jsonMatch) return []
    return JSON.parse(jsonMatch[0]) as SearchResult[]
  } catch {
    return []
  }
}
