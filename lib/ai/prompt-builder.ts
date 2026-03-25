import type { SearchQuery } from '@/types/search'

export function buildSearchPrompt(query: SearchQuery): string {
  const parts = [
    `Find the best prices for "${query.product}"`,
    query.brand ? `specifically the brand "${query.brand}"` : '',
    `in ${query.city}, ${query.country}.`,
    `The user needs this for: ${query.purpose}.`,
    '',
    'Search the web for current prices. Return a JSON array of results.',
    'Each result must have: name, price (as string with currency symbol), currency (3-letter code), store, url, availability (in_stock|online_only|limited|unknown), notes (optional).',
    'Sort by price ascending. Include at least 5 results if available.',
    'Focus on stores that deliver to or are located in the specified city.',
    'Include both physical stores and online stores with delivery to that location.',
    'Return ONLY the JSON array, no other text.',
  ]
  return parts.filter(Boolean).join(' ')
}
