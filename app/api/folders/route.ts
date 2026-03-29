import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { getFolders, createFolder, deleteFolder } from '@/lib/supabase/queries/folders'
import { folderSchema } from '@/lib/validators/folder.schema'
import { zodValidationError } from '@/lib/api/errors'

export async function GET() {
  try {
    const supabase = await createServerSupabaseClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const folders = await getFolders(supabase, user.id)
    return NextResponse.json(folders)
  } catch (error: unknown) {
    console.error('[folders] GET error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch folders' },
      { status: 500 }
    )
  }
}

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
    const result = folderSchema.safeParse(body)
    if (!result.success) {
      return zodValidationError(result.error)
    }
    const folder = await createFolder(supabase, user.id, result.data.name)

    return NextResponse.json(folder, { status: 201 })
  } catch (error: unknown) {
    console.error('[folders] POST error:', error)
    return NextResponse.json(
      { error: 'Failed to create folder' },
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
      return NextResponse.json(
        { error: 'Missing folder id' },
        { status: 400 }
      )
    }

    if (!z.uuid().safeParse(id).success) {
      return NextResponse.json({ error: 'Invalid id' }, { status: 400 })
    }

    // Verify ownership before deleting
    const { data: folder } = await supabase
      .from('folders')
      .select('user_id')
      .eq('id', id)
      .single()

    if (!folder || folder.user_id !== user.id) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }

    await deleteFolder(supabase, id)
    return NextResponse.json({ success: true })
  } catch (error: unknown) {
    console.error('[folders] DELETE error:', error)
    return NextResponse.json(
      { error: 'Failed to delete folder' },
      { status: 500 }
    )
  }
}
