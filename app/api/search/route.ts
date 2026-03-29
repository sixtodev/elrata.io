import { NextRequest, NextResponse } from 'next/server'
import { searchSchema } from '@/lib/validators/search.schema'
import { runSearch } from '@/lib/ai'
import { checkFreeSearchLimit } from '@/lib/search/rate-limit'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import type { SearchResponse } from '@/types/search'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const result = searchSchema.safeParse(body)
    if (!result.success) {
      return NextResponse.json({ error: result.error.issues }, { status: 400 })
    }
    const parsed = result.data

    // Check auth
    let isAuthenticated = false
    try {
      const supabase = await createServerSupabaseClient()
      const { data: { user } } = await supabase.auth.getUser()
      isAuthenticated = !!user
    } catch (_e: unknown) { /* not auth */ }

    // Rate limit for free users
    if (!isAuthenticated) {
      const ip =
        req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
        req.headers.get('x-real-ip') ||
        'unknown'

      const { allowed, remaining } = checkFreeSearchLimit(ip)

      if (!allowed) {
        return NextResponse.json(
          {
            error: '🐀 ¡Llegaste al límite! Para seguir rateando, crea una cuenta gratis.',
            code: 'RATE_LIMIT',
          },
          { status: 429 }
        )
      }

      // Search — max 10 results for free users
      const { results, sources } = await runSearch(parsed)

      const response: SearchResponse = {
        results: results.slice(0, 10),
        model_used: 'scraping',
        query: parsed,
        sources_used: sources,
      }

      const res = NextResponse.json(response)
      res.headers.set('X-Searches-Remaining', String(remaining))
      return res
    }

    // Authenticated — no limit, up to 20 results
    const { results, sources } = await runSearch(parsed)

    const response: SearchResponse = {
      results: results.slice(0, 20),
      model_used: 'scraping',
      query: parsed,
      sources_used: sources,
    }

    return NextResponse.json(response)
  } catch (error: unknown) {
    console.error('[search] Error:', error)
    return NextResponse.json({ error: 'Search failed. Try again.' }, { status: 500 })
  }
}
