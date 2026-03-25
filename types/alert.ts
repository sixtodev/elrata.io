import type { SearchQuery } from './search'

export type AlertStatus = 'active' | 'triggered' | 'paused' | 'deleted'

export interface PriceAlert {
  id: string
  user_id: string
  product_name: string
  query_data: SearchQuery
  target_price: number
  currency: string
  status: AlertStatus
  last_checked_at: string | null
  last_price: number | null
  notified_at: string | null
  created_at: string
}

export interface PriceHistory {
  id: string
  alert_id: string
  price: number
  store: string | null
  url: string | null
  checked_at: string
}

export interface CreateAlertPayload {
  product_name: string
  query_data: SearchQuery
  target_price: number
  currency: string
}
