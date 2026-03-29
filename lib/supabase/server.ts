import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { createClient } from '@supabase/supabase-js'
import type { AppSettingsDatabase } from '@/types/database'

export async function createServerSupabaseClient() {
  const cookieStore = await cookies()

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {
            // Ignored in Server Components (read-only)
          }
        },
      },
    }
  )
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let _serviceClient: ReturnType<typeof createClient<any>> | null = null

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function createServiceClient(): ReturnType<typeof createClient<any>> {
  if (!_serviceClient) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    _serviceClient = createClient<any>(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )
  }
  return _serviceClient
}

let _settingsClient: ReturnType<typeof createClient<AppSettingsDatabase>> | null = null

/** Cliente tipado exclusivamente para operaciones sobre app_settings. */
export function createSettingsClient() {
  if (!_settingsClient) {
    _settingsClient = createClient<AppSettingsDatabase>(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )
  }
  return _settingsClient
}
