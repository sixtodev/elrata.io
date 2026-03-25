import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'

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
  } catch (error) {
    console.error('[user-stores] GET error:', error)
    return NextResponse.json({ error: 'Failed' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { url, name } = await req.json()
    if (!url) return NextResponse.json({ error: 'URL required' }, { status: 400 })

    // Normalize: ensure https:// and clean domain
    const cleanUrl = url.replace(/^https?:\/\//, '').replace(/\/+$/, '')
    const fullUrl = `https://${cleanUrl}`

    // Validate URL
    try { new URL(fullUrl) } catch {
      return NextResponse.json({ error: 'URL inválida' }, { status: 400 })
    }

    const storeName = name || cleanUrl

    const { data, error } = await supabase
      .from('user_custom_urls')
      .upsert(
        { user_id: user.id, url: cleanUrl, name: storeName },
        { onConflict: 'user_id,url' }
      )
      .select()
      .single()

    if (error) throw error
    return NextResponse.json(data, { status: 201 })
  } catch (error) {
    console.error('[user-stores] POST error:', error)
    return NextResponse.json({ error: 'Failed to save' }, { status: 500 })
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

    const { error } = await supabase
      .from('user_custom_urls')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id)

    if (error) throw error
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[user-stores] DELETE error:', error)
    return NextResponse.json({ error: 'Failed' }, { status: 500 })
  }
}
