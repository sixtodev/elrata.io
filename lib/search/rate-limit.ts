/**
 * Simple in-memory rate limiter for unauthenticated searches.
 * Tracks by IP address with a 24-hour window.
 * Limit: 10 searches per IP per day.
 */

const FREE_SEARCH_LIMIT = 5
const WINDOW_MS = 24 * 60 * 60 * 1000 // 24 hours

interface RateLimitEntry {
  count: number
  resetAt: number
}

const store = new Map<string, RateLimitEntry>()

// Clean up old entries every 10 minutes
setInterval(() => {
  const now = Date.now()
  for (const [key, entry] of store) {
    if (now > entry.resetAt) store.delete(key)
  }
}, 10 * 60 * 1000)

export function checkFreeSearchLimit(ip: string): {
  allowed: boolean
  remaining: number
  limit: number
} {
  const now = Date.now()
  const entry = store.get(ip)

  if (!entry || now > entry.resetAt) {
    store.set(ip, { count: 1, resetAt: now + WINDOW_MS })
    return { allowed: true, remaining: FREE_SEARCH_LIMIT - 1, limit: FREE_SEARCH_LIMIT }
  }

  if (entry.count >= FREE_SEARCH_LIMIT) {
    return { allowed: false, remaining: 0, limit: FREE_SEARCH_LIMIT }
  }

  entry.count++
  return {
    allowed: true,
    remaining: FREE_SEARCH_LIMIT - entry.count,
    limit: FREE_SEARCH_LIMIT,
  }
}
