import { redirect } from 'next/navigation'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { getFolders } from '@/lib/supabase/queries/folders'
import { getRecentSearches } from '@/lib/supabase/queries/searches'
import { DashboardNav } from '@/components/dashboard/DashboardNav'
import { DashboardClient } from '@/components/dashboard/DashboardClient'
import { AnonymousBanner } from '@/components/dashboard/AnonymousBanner'

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

  const isAnonymous = user.is_anonymous ?? false

  return (
    <div className="min-h-screen bg-background">
      <DashboardNav email={user.email} isAnonymous={isAnonymous} />

      <main className="max-w-[1100px] mx-auto px-6 pt-[100px] pb-[60px]">
        {isAnonymous && <AnonymousBanner />}

        <h1 className="font-title text-[32px] text-foreground mb-8 font-normal">
          Mi <span className="text-green">Rata</span> Dashboard
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
