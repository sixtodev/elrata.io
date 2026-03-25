import type { SearchQuery, SearchResult } from '@/types/search'
import { generateSearchUrls } from './search-urls'
import { scrapePageFull, closeBrowser } from './browser'
import { parseScrapedContent } from './parser'

const MAX_CONTENT_LENGTH = 25000

/**
 * Fast scraper: uses DuckDuckGo Shopping as primary source (never blocks bots,
 * returns real products with real URLs and prices).
 * Only scrapes 1-2 sources for speed. DuckDuckGo alone usually has 10+ results.
 */
export async function scrapeSearch(
  query: SearchQuery
): Promise<SearchResult[]> {
  const urls = generateSearchUrls(query)
  // DuckDuckGo Shopping is always priority 0, grab just that + 1 backup
  const topUrls = urls.slice(0, 2)

  console.log(
    `[scraper] Searching for "${query.product}" in ${query.city}, ${query.country}`
  )
  console.log(
    `[scraper] Sources: ${topUrls.map((u) => u.source).join(', ')}`
  )

  const allContent: { source: string; content: string; url: string }[] = []

  try {
    for (const { url, source } of topUrls) {
      try {
        console.log(`[scraper] Scraping ${source}...`)
        const content = await scrapePageFull(url)

        if (content && content.length > 200) {
          allContent.push({
            source,
            content:
              content.length > MAX_CONTENT_LENGTH
                ? content.slice(0, MAX_CONTENT_LENGTH) + '\n... (truncated)'
                : content,
            url,
          })
          console.log(`[scraper] ✓ ${content.length} chars from ${source}`)

          // If DuckDuckGo gave us good content, skip other sources for speed
          if (source === 'DuckDuckGo Shopping' && content.length > 1000) {
            console.log('[scraper] DuckDuckGo has enough data, skipping other sources')
            break
          }
        } else {
          console.log(`[scraper] ✗ No content from ${source}`)
        }
      } catch (error) {
        console.error(`[scraper] ✗ Failed ${source}:`, error)
      }
    }
  } finally {
    closeBrowser()
  }

  if (allContent.length === 0) {
    console.log('[scraper] No content from any source')
    return []
  }

  console.log('[scraper] Parsing with AI...')
  const results = await parseScrapedContent(query, allContent)
  console.log(`[scraper] ✓ ${results.length} products found`)
  return results
}
