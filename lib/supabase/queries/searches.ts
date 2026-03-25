import type { SupabaseClient } from '@supabase/supabase-js'
import type { SearchQuery, SearchResult } from '@/types/search'

interface SaveSearchData {
  userId: string
  folderId?: string
  queryData: SearchQuery
  results: SearchResult[]
  modelUsed: string
}

export async function saveSearch(supabase: SupabaseClient, data: SaveSearchData) {
  const { data: result, error } = await supabase
    .from('searches')
    .insert({
      user_id: data.userId,
      folder_id: data.folderId || null,
      query_data: data.queryData,
      results: data.results,
      model_used: data.modelUsed,
    })
    .select()
    .single()

  if (error) throw error
  return result
}

export async function getSearchesByFolder(
  supabase: SupabaseClient,
  folderId: string
) {
  const { data, error } = await supabase
    .from('searches')
    .select('*')
    .eq('folder_id', folderId)
    .order('created_at', { ascending: false })

  if (error) throw error
  return data
}

export async function getRecentSearches(
  supabase: SupabaseClient,
  userId: string,
  limit = 20
) {
  const { data, error } = await supabase
    .from('searches')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(limit)

  if (error) throw error
  return data
}

export async function deleteSearch(
  supabase: SupabaseClient,
  searchId: string,
  userId: string
) {
  const { error } = await supabase
    .from('searches')
    .delete()
    .eq('id', searchId)
    .eq('user_id', userId)

  if (error) throw error
}
