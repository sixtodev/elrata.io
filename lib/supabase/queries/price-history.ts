import type { SupabaseClient } from '@supabase/supabase-js'

interface AddPriceHistoryData {
  alertId: string
  price: number
  store?: string
  url?: string
}

export async function addPriceHistory(
  supabase: SupabaseClient,
  data: AddPriceHistoryData
) {
  const { error } = await supabase.from('price_history').insert({
    alert_id: data.alertId,
    price: data.price,
    store: data.store || null,
    url: data.url || null,
  })

  if (error) throw error
}

export async function getPriceHistory(
  supabase: SupabaseClient,
  alertId: string,
  limit = 168 // 7 days * 24 checks/day
) {
  const { data, error } = await supabase
    .from('price_history')
    .select('*')
    .eq('alert_id', alertId)
    .order('checked_at', { ascending: false })
    .limit(limit)

  if (error) throw error
  return data
}
