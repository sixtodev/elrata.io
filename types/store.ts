export type ScraperType = 'crawlee_dedicated' | 'crawlee_generic' | 'ai_only'
export type StoreStatus = 'active' | 'pending' | 'popular' | 'disabled'

export interface StoreCategory {
  id: string
  name: string
  icon: string
}

export interface StoreCatalog {
  id: string
  name: string
  base_url: string
  country: string
  categories: string[]
  is_multicat: boolean
  scraper_type: ScraperType
  status: StoreStatus
  is_official: boolean
  submitted_by: string | null
  usage_count: number
  last_scraped_at: string | null
  created_at: string
}

export interface UserStore {
  id: string
  user_id: string
  store_id: string
  is_default: boolean
  created_at: string
  store?: StoreCatalog
}

export interface SubmitStorePayload {
  name: string
  base_url: string
  country: string
  categories: string[]
  is_multicat: boolean
}
