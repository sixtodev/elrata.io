import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { runSearch } from '@/lib/ai'
import { sendPriceAlert } from '@/lib/email/resend'
import { extractNumericPrice } from '@/lib/search/merger'
import type { SearchResult } from '@/types/search'

interface AlertRow {
  id: string
  product_name: string
  query_data: import('@/types/search').SearchQuery
  target_price: number
  currency: string
  notified_at: string | null
  user: { email: string }
}

export async function GET(req: NextRequest) {
  const secret = req.headers.get('x-cron-secret')
  console.log('[cron] secret received:', secret?.slice(0, 6), '| env set:', !!process.env.CRON_SECRET)
  if (secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = createServiceClient()
  const results = { checked: 0, triggered: 0, errors: 0 }

  const { data, error } = await supabase
    .from('price_alerts')
    .select('*, user:user_id(email)')
    .eq('status', 'active')
  const alerts = data as AlertRow[] | null

  if (error) {
    console.error('[cron] Error fetching alerts:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  for (const alert of alerts ?? []) {
    try {
      results.checked++

      const { results: searchResults } = await runSearch(alert.query_data)
      const lowestPrice = parseLowestPrice(searchResults)

      if (lowestPrice.numericPrice === Infinity) continue

      await supabase.from('price_history').insert({
        alert_id: alert.id,
        price: lowestPrice.numericPrice,
        store: lowestPrice.store,
        url: lowestPrice.url,
      })

      await supabase.from('price_alerts').update({
        last_price: lowestPrice.numericPrice,
        last_checked_at: new Date().toISOString(),
      }).eq('id', alert.id)

      const shouldNotify =
        lowestPrice.numericPrice <= alert.target_price &&
        !wasRecentlyNotified(alert.notified_at)

      if (shouldNotify) {
        results.triggered++

        await sendPriceAlert({
          to: alert.user.email,
          productName: alert.product_name,
          targetPrice: alert.target_price,
          currentPrice: lowestPrice.numericPrice,
          currency: alert.currency,
          store: lowestPrice.store || 'Tienda',
          url: lowestPrice.url || '#',
        })

        await supabase.from('price_alerts').update({
          status: 'triggered',
          notified_at: new Date().toISOString(),
        }).eq('id', alert.id)
      }
    } catch (err) {
      results.errors++
      console.error(`[cron] Error processing alert ${alert.id}:`, err)
    }
  }

  console.log('[cron] Done:', results)
  return NextResponse.json(results)
}

function parseLowestPrice(results: SearchResult[]) {
  const withPrices = results
    .map((r) => ({
      ...r,
      numericPrice: extractNumericPrice(r.price),
    }))
    .filter((r) => isFinite(r.numericPrice))
    .sort((a, b) => a.numericPrice - b.numericPrice)

  return withPrices[0] ?? { numericPrice: Infinity, store: '', url: '' }
}

function wasRecentlyNotified(notifiedAt: string | null): boolean {
  if (!notifiedAt) return false
  const hoursSince =
    (Date.now() - new Date(notifiedAt).getTime()) / 1000 / 3600
  return hoursSince < 24
}
