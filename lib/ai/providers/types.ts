import type { SearchResult } from '@/types/search'

export interface AIProviderConfig {
  name: string
  envKey: string
  search(prompt: string): Promise<SearchResult[]>
}
