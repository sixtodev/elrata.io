import { redirect } from 'next/navigation'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { getFolders } from '@/lib/supabase/queries/folders'
import { getSearchesByFolder } from '@/lib/supabase/queries/searches'
import { DashboardNav } from '@/components/dashboard/DashboardNav'
import { SearchHistory } from '@/components/dashboard/SearchHistory'

interface FolderDetailPageProps {
  params: Promise<{ folderId: string }>
}

export default async function FolderDetailPage({ params }: FolderDetailPageProps) {
  const { folderId } = await params

  const supabase = await createServerSupabaseClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const [folders, searches] = await Promise.all([
    getFolders(supabase, user.id),
    getSearchesByFolder(supabase, folderId),
  ])

  const folder = folders.find((f) => f.id === folderId)

  if (!folder) {
    redirect('/dashboard')
  }

  return (
    <div
      style={{
        minHeight: '100vh',
        backgroundColor: '#151518',
      }}
    >
      <DashboardNav email={user.email} />

      <main
        style={{
          maxWidth: '1100px',
          margin: '0 auto',
          padding: '100px 24px 60px',
        }}
      >
        {/* Back button + header */}
        <div style={{ marginBottom: '32px' }}>
          <a
            href="/dashboard"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              color: '#6b7280',
              fontSize: '14px',
              textDecoration: 'none',
              marginBottom: '16px',
              transition: 'color 0.2s',
            }}
          >
            ← Volver al Dashboard
          </a>
          <h1
            style={{
              fontFamily: 'var(--font-title)',
              fontSize: '28px',
              color: '#fefeff',
              margin: '0 0 8px 0',
              fontWeight: 400,
            }}
          >
            📁 {folder.name}
          </h1>
          <p style={{ color: '#6b7280', fontSize: '14px', margin: 0 }}>
            {searches.length} busqueda{searches.length !== 1 ? 's' : ''} guardada
            {searches.length !== 1 ? 's' : ''}
          </p>
        </div>

        <SearchHistory searches={searches} />
      </main>
    </div>
  )
}
