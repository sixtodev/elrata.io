export type AIProvider = 'claude-sonnet-4-6' | 'gpt-4o' | 'gemini-2.5-pro'

export interface SearchQuery {
  product: string
  brand?: string
  city: string
  country: string
  purpose: string
  model?: AIProvider
  budget?: string
  source?: 'all' | 'mercadolibre' | 'web' | 'amazon'
  categories?: string[]
  store_ids?: string[]
  /** Category-specific filters (ram, storage, processor, type, etc.) */
  specs?: Record<string, string>
}

export interface SearchResult {
  name: string
  price: string
  currency: string
  store: string
  store_id?: string
  url: string
  availability: 'in_stock' | 'online_only' | 'limited' | 'unknown'
  source: 'crawlee' | 'ai' | 'browser'
  scraper_type?: string
  image?: string | null
  notes?: string
}

export interface SearchResponse {
  results: SearchResult[]
  model_used: AIProvider | 'scraping'
  query: SearchQuery
  sources_used?: string[]
}
