import type { SupabaseClient } from '@supabase/supabase-js'
import type { CreateAlertPayload } from '@/types/alert'

export async function getAlerts(supabase: SupabaseClient, userId: string) {
  const { data, error } = await supabase
    .from('price_alerts')
    .select('*')
    .eq('user_id', userId)
    .neq('status', 'deleted')
    .order('created_at', { ascending: false })

  if (error) throw error
  return data
}

export async function getActiveAlerts(supabase: SupabaseClient) {
  const { data, error } = await supabase
    .from('price_alerts')
    .select('*, user:user_id(email)')
    .eq('status', 'active')

  if (error) throw error
  return data
}

export async function createAlert(
  supabase: SupabaseClient,
  userId: string,
  payload: CreateAlertPayload
) {
  const { data, error } = await supabase
    .from('price_alerts')
    .insert({
      user_id: userId,
      product_name: payload.product_name,
      query_data: payload.query_data,
      target_price: payload.target_price,
      currency: payload.currency,
    })
    .select()
    .single()

  if (error) throw error
  return data
}

export async function updateAlert(
  supabase: SupabaseClient,
  alertId: string,
  data: Record<string, unknown>
) {
  const { error } = await supabase
    .from('price_alerts')
    .update(data)
    .eq('id', alertId)

  if (error) throw error
}

export async function deleteAlert(supabase: SupabaseClient, alertId: string) {
  const { error } = await supabase
    .from('price_alerts')
    .update({ status: 'deleted' })
    .eq('id', alertId)

  if (error) throw error
}
