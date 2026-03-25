import { redirect } from 'next/navigation'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { getFolders } from '@/lib/supabase/queries/folders'
import { getRecentSearches } from '@/lib/supabase/queries/searches'
import { DashboardNav } from '@/components/dashboard/DashboardNav'
import { DashboardClient } from '@/components/dashboard/DashboardClient'

export default async function DashboardPage() {
  const supabase = await createServerSupabaseClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const [folders, recentSearches] = await Promise.all([
    getFolders(supabase, user.id),
    getRecentSearches(supabase, user.id, 20),
  ])

  // Build search count per folder from recent searches
  const searchCounts: Record<string, number> = {}
  for (const s of recentSearches) {
    if (s.folder_id) {
      searchCounts[s.folder_id] = (searchCounts[s.folder_id] || 0) + 1
    }
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
        <h1
          style={{
            fontFamily: 'var(--font-title)',
            fontSize: '32px',
            color: '#fefeff',
            marginBottom: '32px',
            fontWeight: 400,
          }}
        >
          🐀 Mi Dashboard
        </h1>

        <DashboardClient
          folders={folders}
          searchCounts={searchCounts}
          recentSearchCount={recentSearches.length}
        />
      </main>
    </div>
  )
}
