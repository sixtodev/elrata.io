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
    <div
      style={{
        minHeight: '100vh',
        background: '#151518',
        color: '#fefeff',
      }}
    >
      <div style={{ maxWidth: '800px', margin: '0 auto', padding: '48px 24px' }}>
        <h1
          style={{
            fontSize: '32px',
            fontWeight: 700,
            marginBottom: '8px',
            fontFamily: 'var(--font-title)',
          }}
          className="font-[family-name:var(--font-title)]"
        >
          🔔 Mis Alertas
        </h1>
        <p style={{ color: '#6b7280', fontSize: '15px', marginBottom: '32px' }}>
          Monitorea precios y recibe notificaciones cuando bajen.
        </p>

        <AlertList initialAlerts={alerts} />
      </div>
    </div>
  )
}
