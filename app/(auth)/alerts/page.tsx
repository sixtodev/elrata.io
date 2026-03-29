import { createServerSupabaseClient } from '@/lib/supabase/server'
import { getAlerts } from '@/lib/supabase/queries/alerts'
import { AlertList } from '@/components/alerts/AlertList'
import type { PriceAlert } from '@/types/alert'

export const metadata = {
  title: 'Mis Alertas | ElRata',
}

export default async function AlertsPage() {
  const supabase = await createServerSupabaseClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  // Auth layout already redirects if no user, but just in case
  const alerts = user ? ((await getAlerts(supabase, user.id)) as PriceAlert[]) : []

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="max-w-[800px] mx-auto py-12 px-6">
        <h1 className="font-title text-[32px] font-bold mb-2">
          🔔 Mis Alertas
        </h1>
        <p className="text-muted text-[15px] mb-8">
          Monitorea precios y recibe notificaciones cuando bajen.
        </p>

        <AlertList initialAlerts={alerts} />
      </div>
    </div>
  )
}
