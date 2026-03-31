import type { SearchQuery, SearchResult } from '@/types/search'
import type { SearchAnalysis } from './analyzer'

/**
 * Search: SOLO scraping, sin IA.
 */
export async function runSearch(
  query: SearchQuery & { source?: string; custom_url?: string; budget?: string }
): Promise<{ results: SearchResult[]; sources: string[] }> {
  const { orchestrateSearch } = await import('@/lib/search/orchestrator')
  return orchestrateSearch(query)
}

/**
 * Analyze: IA analiza resultados ya scrapeados y da recomendaciones.
 */
export async function analyzeSearchResults(
  results: SearchResult[],
  product: string,
  purpose: string,
  budget: string | undefined,
  country: string
): Promise<SearchAnalysis | null> {
  const { analyzeResults } = await import('./analyzer')
  return analyzeResults({ results, product, purpose, budget, country })
}
