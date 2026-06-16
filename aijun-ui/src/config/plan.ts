// LLM plan / mode. Cloud plans (free/pro) have provider token limits and billing; `local` is for a
// self-hosted model (Ollama) — no limits, no payment, so the UI must not show any billing prompts.
// Set via VITE_PLAN=free|pro|local (use `local` for the docker-compose-qwen.yml stack).
//
// The real cloud limit lives on the backend (Groq account); this config only drives messaging and
// the *fallback* cooldown when the provider's exact reset time isn't propagated to the UI.

export type PlanId = 'free' | 'pro' | 'local'

export interface PlanConfig {
  id: PlanId
  label: string
  /** Daily token budget (TPD), or null for plans without a hard daily cap. */
  dailyTokenLimit: number | null
  /** Fallback cooldown (ms) applied when the exact provider reset time is unknown. */
  estimatedCooldownMs: number
  /** Whether this plan involves paid tokens (drives billing prompts). False for local models. */
  billable: boolean
}

export const PLANS: Record<PlanId, PlanConfig> = {
  free: {
    id: 'free',
    label: 'Free',
    dailyTokenLimit: 100_000,
    estimatedCooldownMs: 30 * 60_000, // ~30 min; Groq TPD reset is rolling and not exposed to UI
    billable: true,
  },
  pro: {
    id: 'pro',
    label: 'Pro',
    dailyTokenLimit: null,
    estimatedCooldownMs: 60_000, // short courtesy cooldown to avoid hammering
    billable: true,
  },
  local: {
    id: 'local',
    label: 'Local model',
    dailyTokenLimit: null,
    estimatedCooldownMs: 60_000,
    billable: false, // self-hosted — no tokens to buy, no limits
  },
}

function resolvePlan(): PlanConfig {
  const raw = (import.meta.env.VITE_PLAN as string | undefined)?.toLowerCase()
  if (raw === 'pro') return PLANS.pro
  if (raw === 'local') return PLANS.local
  return PLANS.free
}

export const ACTIVE_PLAN: PlanConfig = resolvePlan()
