import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { ACTIVE_PLAN } from '@/config/plan'

interface RateLimitValue {
  /** True while generation should be blocked. */
  isLimited: boolean
  /** Milliseconds left until the limit clears (0 when not limited). */
  remainingMs: number
  /** Whether `remainingMs` is the provider's exact reset time (vs a plan-based estimate). */
  exact: boolean
  /** True when the cause is a provider token/rate limit (vs a generic agent outage). */
  rateLimited: boolean
  /** Enter the limited state. Pass the provider's exact reset when known. */
  trigger: (opts?: { retryAfterMs?: number; rateLimited?: boolean }) => void
  /** Manually clear the limit (e.g. user taps "Повторить"). */
  clear: () => void
}

const RateLimitContext = createContext<RateLimitValue | null>(null)

/** App-wide LLM rate-limit state. The Groq limit is account-wide, so it blocks all tools at once. */
export function RateLimitProvider({ children }: { children: ReactNode }) {
  const [until, setUntil] = useState<number | null>(null)
  const [exact, setExact] = useState(false)
  const [rateLimited, setRateLimited] = useState(false)
  const [now, setNow] = useState(() => Date.now())

  // Tick once a second only while a limit is active.
  useEffect(() => {
    if (until === null) return
    const tick = () => setNow(Date.now())
    tick()
    const id = setInterval(tick, 1000)
    return () => clearInterval(id)
  }, [until])

  // Auto-clear when the window elapses.
  useEffect(() => {
    if (until !== null && now >= until) {
      setUntil(null)
      setExact(false)
    }
  }, [now, until])

  const value = useMemo<RateLimitValue>(() => {
    const remainingMs = until !== null ? Math.max(0, until - now) : 0
    return {
      isLimited: remainingMs > 0,
      remainingMs,
      exact,
      rateLimited,
      trigger: (opts) => {
        const ms = opts?.retryAfterMs ?? ACTIVE_PLAN.estimatedCooldownMs
        setExact(opts?.retryAfterMs != null)
        setRateLimited(opts?.rateLimited ?? false)
        setUntil(Date.now() + ms)
      },
      clear: () => {
        setUntil(null)
        setExact(false)
        setRateLimited(false)
      },
    }
  }, [until, now, exact, rateLimited])

  return <RateLimitContext.Provider value={value}>{children}</RateLimitContext.Provider>
}

export function useRateLimit(): RateLimitValue {
  const ctx = useContext(RateLimitContext)
  if (!ctx) throw new Error('useRateLimit must be used within RateLimitProvider')
  return ctx
}
