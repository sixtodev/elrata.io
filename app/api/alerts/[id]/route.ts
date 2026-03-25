import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { updateAlert, deleteAlert } from '@/lib/supabase/queries/alerts'

export async function PATCH(
  req: NextRequest,
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

    const body = await req.json()
    await updateAlert(supabase, id, body)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[alerts] PATCH error:', error)
    return NextResponse.json(
      { error: 'Failed to update alert' },
      { status: 500 }
    )
  }
}

export async function DELETE(
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

    await deleteAlert(supabase, id)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[alerts] DELETE error:', error)
    return NextResponse.json(
      { error: 'Failed to delete alert' },
      { status: 500 }
    )
  }
}
