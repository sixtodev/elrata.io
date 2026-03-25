import type { SupabaseClient } from '@supabase/supabase-js'

export async function getFolders(supabase: SupabaseClient, userId: string) {
  const { data, error } = await supabase
    .from('folders')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })

  if (error) throw error
  return data
}

export async function createFolder(
  supabase: SupabaseClient,
  userId: string,
  name: string
) {
  const { data, error } = await supabase
    .from('folders')
    .insert({ user_id: userId, name })
    .select()
    .single()

  if (error) throw error
  return data
}

export async function deleteFolder(
  supabase: SupabaseClient,
  folderId: string
) {
  const { error } = await supabase.from('folders').delete().eq('id', folderId)
  if (error) throw error
}
