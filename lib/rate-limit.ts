/**
 * Rate limiting — in-memory fallback implementation.
 *
 * In production, swap with Upstash Redis for distributed rate limiting.
 * The interface stays the same so the migration is a drop-in replacement.
 */

interface RateLimitEntry {
  count: number
  resetAt: number
}

const store = new Map<string, RateLimitEntry>()

/** Clean up expired entries periodically. */
const CLEANUP_INTERVAL = 60_000 // 1 minute
let lastCleanup = Date.now()

function cleanup() {
  const now = Date.now()
  if (now - lastCleanup < CLEANUP_INTERVAL) return
  lastCleanup = now
  for (const [key, entry] of Array.from(store)) {
    if (now >= entry.resetAt) {
      store.delete(key)
    }
  }
}

export interface RateLimitConfig {
  /** Maximum number of requests allowed in the window. */
  maxRequests: number
  /** Time window in milliseconds. */
  windowMs: number
}

export interface RateLimitResult {
  /** Whether the request is allowed. */
  allowed: boolean
  /** Number of remaining requests in this window. */
  remaining: number
  /** Unix timestamp (ms) when the window resets. */
  resetAt: number
}

/**
 * Check if a request identified by `key` (typically IP) is rate-limited.
 *
 * Default: 10 requests per 60 seconds (matching the spec).
 */
export async function checkRateLimit(
  key: string,
  config: RateLimitConfig = { maxRequests: 10, windowMs: 60_000 }
): Promise<RateLimitResult> {
  cleanup()

  const now = Date.now()
  const entry = store.get(key)

  // New window
  if (!entry || now >= entry.resetAt) {
    const newEntry: RateLimitEntry = {
      count: 1,
      resetAt: now + config.windowMs,
    }
    store.set(key, newEntry)
    return {
      allowed: true,
      remaining: config.maxRequests - 1,
      resetAt: newEntry.resetAt,
    }
  }

  // Within existing window
  entry.count++
  const remaining = Math.max(0, config.maxRequests - entry.count)
  return {
    allowed: entry.count <= config.maxRequests,
    remaining,
    resetAt: entry.resetAt,
  }
}

/**
 * Extract a simple key for rate limiting from request info.
 * In production, use X-Forwarded-For or similar for real IP.
 */
export function getRateLimitKey(ip: string): string {
  return `rate-limit:${ip}`
}
