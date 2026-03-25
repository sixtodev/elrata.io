import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { saveSearch, deleteSearch } from '@/lib/supabase/queries/searches'

export async function POST(req: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const { folder_id, query_data, results, model_used } = body

    if (!query_data || !results || !model_used) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    const search = await saveSearch(supabase, {
      userId: user.id,
      folderId: folder_id,
      queryData: query_data,
      results,
      modelUsed: model_used,
    })

    return NextResponse.json(search, { status: 201 })
  } catch (error) {
    console.error('[searches] POST error:', error)
    return NextResponse.json(
      { error: 'Failed to save search' },
      { status: 500 }
    )
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ error: 'Missing search id' }, { status: 400 })
    }

    await deleteSearch(supabase, id, user.id)
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[searches] DELETE error:', error)
    return NextResponse.json(
      { error: 'Failed to delete search' },
      { status: 500 }
    )
  }
}
