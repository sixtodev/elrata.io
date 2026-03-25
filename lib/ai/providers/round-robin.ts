import type { SearchResult } from '@/types/search'
import type { AIProviderConfig } from './types'
import { openrouterProvider } from './openrouter'
import { cerebrasProvider } from './cerebras'
import { groqProvider } from './groq'

/**
 * All providers in rotation order.
 * Each request goes to the next provider.
 * If one fails, it tries the next until all are exhausted.
 */
const ALL_PROVIDERS: AIProviderConfig[] = [
  openrouterProvider,
  cerebrasProvider,
  groqProvider,
]

/** Rotates across requests in the same server process */
let roundRobinIndex = 0

/**
 * Returns only providers that have their API key configured.
 */
function getAvailableProviders(): AIProviderConfig[] {
  return ALL_PROVIDERS.filter((p) => !!process.env[p.envKey])
}

/**
 * Round-robin search across all configured providers.
 * Each call starts with the next provider in rotation.
 * If it fails, tries the remaining providers before giving up.
 */
export async function roundRobinSearch(
  prompt: string
): Promise<{ results: SearchResult[]; provider: string }> {
  const providers = getAvailableProviders()

  if (providers.length === 0) {
    throw new Error(
      'No AI providers configured. Set at least one of: OPEN_ROUTE_API_KEY, CEREBRAS_API_KEY, GROQ_API_KEY'
    )
  }

  const startIdx = roundRobinIndex % providers.length
  roundRobinIndex++

  // Try each provider starting from the current round-robin position
  for (let i = 0; i < providers.length; i++) {
    const idx = (startIdx + i) % providers.length
    const provider = providers[idx]

    console.log(`[round-robin] Trying ${provider.name}...`)

    try {
      const results = await provider.search(prompt)

      if (results.length > 0) {
        console.log(`[round-robin] ✓ ${results.length} results from ${provider.name}`)
        return { results, provider: provider.name }
      }

      console.log(`[round-robin] ${provider.name} returned 0 results, trying next...`)
    } catch (error) {
      console.error(`[round-robin] ${provider.name} failed:`, error)
    }
  }

  console.error('[round-robin] All providers exhausted')
  return { results: [], provider: 'none' }
}

/**
 * Get info about configured providers (for debugging / UI).
 */
export function getProviderStatus(): Array<{ name: string; configured: boolean }> {
  return ALL_PROVIDERS.map((p) => ({
    name: p.name,
    configured: !!process.env[p.envKey],
  }))
}
