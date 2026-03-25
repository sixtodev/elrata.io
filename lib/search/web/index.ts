import type { SearchResult } from '@/types/search'
import { searchSerper } from './serper'
import { searchSerpAPI } from './serpapi'
import { searchGoogleCustom } from './google-custom'

/**
 * Web search with fallback chain.
 * Budget is passed to improve query relevance.
 */
export async function searchWeb(
  product: string,
  country: string,
  city: string,
  budget?: string
): Promise<SearchResult[]> {
  // 1. Serper.dev
  if (process.env.SERPER_API_KEY) {
    console.log('[web-search] Trying Serper.dev...')
    try {
      const results = await searchSerper(product, country, city, budget)
      if (results.length > 0) {
        console.log(`[web-search] ✓ Serper: ${results.length} results`)
        return results
      }
    } catch (error) {
      console.error('[web-search] Serper failed:', error)
    }
  }

  // 2. SerpAPI
  if (process.env.SERPAPI_API_KEY) {
    console.log('[web-search] Trying SerpAPI...')
    try {
      const results = await searchSerpAPI(product, country, city)
      if (results.length > 0) {
        console.log(`[web-search] ✓ SerpAPI: ${results.length} results`)
        return results
      }
    } catch (error) {
      console.error('[web-search] SerpAPI failed:', error)
    }
  }

  // 3. Google Custom Search
  if (process.env.GOOGLE_CSE_API_KEY && process.env.GOOGLE_CSE_CX) {
    console.log('[web-search] Trying Google Custom Search...')
    try {
      const results = await searchGoogleCustom(product, country, city)
      if (results.length > 0) {
        console.log(`[web-search] ✓ Google CSE: ${results.length} results`)
        return results
      }
    } catch (error) {
      console.error('[web-search] Google CSE failed:', error)
    }
  }

  console.log('[web-search] No providers returned results')
  return []
}
