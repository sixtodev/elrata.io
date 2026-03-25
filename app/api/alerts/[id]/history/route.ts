import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { getPriceHistory } from '@/lib/supabase/queries/price-history'

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createServerSupabaseClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params

    // Verify ownership
    const { data: alert } = await supabase
      .from('price_alerts')
      .select('user_id')
      .eq('id', id)
      .single()

    if (!alert || alert.user_id !== user.id) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }

    const history = await getPriceHistory(supabase, id)
    return NextResponse.json(history)
  } catch (error) {
    console.error('[alerts] GET history error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch price history' },
      { status: 500 }
    )
  }
}
