import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { userStoreSchema } from '@/lib/validators/user-store.schema'
import { zodValidationError } from '@/lib/api/errors'

export async function GET() {
  try {
    const supabase = await createServerSupabaseClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { data, error } = await supabase
      .from('user_custom_urls')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    if (error) throw error
    return NextResponse.json(data)
  } catch (error: unknown) {
    console.error('[user-stores] GET error:', error)
    return NextResponse.json({ error: 'Failed to fetch custom URLs' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await req.json()
    const result = userStoreSchema.safeParse(body)
    if (!result.success) {
      return zodValidationError(result.error)
    }

    const { url, name } = result.data

    // Normalize to HTTPS — http:// URLs are intentionally upgraded.
    // cleanUrl (no protocol) is used as display name fallback; fullUrl is what gets stored.
    const cleanUrl = url.replace(/^https?:\/\//, '').replace(/\/+$/, '')
    const fullUrl = `https://${cleanUrl}`

    const storeName = name || cleanUrl

    const { data, error } = await supabase
      .from('user_custom_urls')
      .upsert(
        { user_id: user.id, url: fullUrl, name: storeName },
        { onConflict: 'user_id,url' }
      )
      .select()
      .single()

    if (error) throw error
    return NextResponse.json(data, { status: 201 })
  } catch (error: unknown) {
    console.error('[user-stores] POST error:', error)
    return NextResponse.json({ error: 'Failed to save custom URL' }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { searchParams } = new URL(req.url)
    const id = searchParams.get('id')
    if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 })

    if (!z.uuid().safeParse(id).success) {
      return NextResponse.json({ error: 'Invalid id' }, { status: 400 })
    }

    const { error } = await supabase
      .from('user_custom_urls')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id)

    if (error) throw error
    return NextResponse.json({ success: true })
  } catch (error: unknown) {
    console.error('[user-stores] DELETE error:', error)
    return NextResponse.json({ error: 'Failed to delete custom URL' }, { status: 500 })
  }
}
