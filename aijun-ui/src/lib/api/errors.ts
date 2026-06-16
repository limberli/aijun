/** Thrown when the orchestrator reports a downstream agent / LLM is unavailable (HTTP 503). */
export class AgentUnavailableError extends Error {
  /** Milliseconds until the provider limit resets, when known (else undefined). */
  retryAfterMs?: number
  /** True when the cause looks like a provider rate/token limit (vs a generic outage). */
  rateLimited: boolean

  constructor(message: string, opts?: { retryAfterMs?: number; rateLimited?: boolean }) {
    super(message)
    this.name = 'AgentUnavailableError'
    this.retryAfterMs = opts?.retryAfterMs
    this.rateLimited = opts?.rateLimited ?? false
  }
}
