import type { QaMetadata } from '@/types/qa'
import { backendUrl } from '@/lib/api/client'
import { AgentUnavailableError } from '@/lib/api/errors'

// Minimal A2A JSON-RPC client for the orchestrator's `message/send`. We build the request by hand
// (single method, full control) instead of pulling in the A2A SDK. The orchestrator returns a Task
// whose single artifact holds the aggregated markdown (test cases + optional risk analysis).

interface A2APart {
  kind: 'text'
  text: string
}

interface A2AArtifact {
  parts?: A2APart[]
}

interface A2ATask {
  id?: string
  contextId?: string
  artifacts?: A2AArtifact[]
}

interface A2AResponseEnvelope {
  result?: A2ATask
  error?: { code: number; message: string }
}

export interface AnalyzeResult {
  /** Aggregated markdown from the orchestrator (feed to parseAggregated). */
  aggregated: string
  conversationId?: string
}

/**
 * Sends the requirements document to the orchestrator via A2A `message/send`, carrying the QA
 * settings + risk toggle in `metadata`. Generation can take minutes on a local LLM — pass an
 * AbortSignal to allow cancellation; there is no streaming (agent capability is non-streaming).
 */
export async function analyze(
  documentText: string,
  metadata: QaMetadata,
  signal?: AbortSignal,
): Promise<AnalyzeResult> {
  const body = {
    jsonrpc: '2.0',
    id: crypto.randomUUID(),
    method: 'message/send',
    params: {
      message: {
        kind: 'message',
        role: 'user',
        messageId: crypto.randomUUID(),
        contextId: crypto.randomUUID(),
        parts: [{ kind: 'text', text: documentText }],
      },
      metadata,
    },
  }

  const response = await fetch(backendUrl('/'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
    signal,
  })

  if (!response.ok) {
    throw await describeError(response)
  }

  const envelope = (await response.json()) as A2AResponseEnvelope
  if (envelope.error) {
    throw new Error(envelope.error.message || 'Ошибка генерации')
  }

  const aggregated =
    envelope.result?.artifacts
      ?.flatMap((a) => a.parts ?? [])
      .filter((p) => p.kind === 'text')
      .map((p) => p.text)
      .join('\n\n') ?? ''

  if (!aggregated.trim()) {
    throw new Error('Пустой ответ от агента')
  }

  return { aggregated, conversationId: envelope.result?.id }
}

/**
 * Builds a typed error from a failed response. The orchestrator returns { code, message }
 * (e.g. AGENT_UNAVAILABLE when a downstream agent / LLM is down or rate-limited). A 503 → an
 * AgentUnavailableError so the UI can switch to the rate-limit/cooldown state.
 */
async function describeError(response: Response): Promise<Error> {
  let detail = ''
  let code = ''
  let retryAfterSeconds: number | undefined
  let rateLimitedFlag: boolean | undefined
  try {
    const body = (await response.json()) as {
      message?: string
      error?: string
      code?: string
      retryAfterSeconds?: number
      rateLimited?: boolean
    }
    detail = body.message || body.error || ''
    code = body.code || ''
    if (typeof body.retryAfterSeconds === 'number') retryAfterSeconds = body.retryAfterSeconds
    if (typeof body.rateLimited === 'boolean') rateLimitedFlag = body.rateLimited
  } catch {
    try {
      detail = await response.text()
    } catch {
      // ignore
    }
  }

  // Standard Retry-After header (seconds) takes precedence when present.
  const header = response.headers.get('retry-after')
  if (header && /^\d+$/.test(header.trim())) retryAfterSeconds = parseInt(header.trim(), 10)

  if (
    response.status === 503 ||
    response.status === 429 ||
    code === 'AGENT_UNAVAILABLE' ||
    code === 'RATE_LIMIT'
  ) {
    const retryAfterMs =
      retryAfterSeconds != null ? retryAfterSeconds * 1000 : parseRetryAfterMs(detail)
    const rateLimited = rateLimitedFlag ?? /limit|лимит|rate|token|quota|429/i.test(detail)
    const message = rateLimited
      ? 'Исчерпан лимит LLM-провайдера. Генерация временно недоступна.'
      : 'Агенты недоступны (упал агент или открыт circuit breaker). Попробуйте позже.'
    return new AgentUnavailableError(message, { retryAfterMs, rateLimited })
  }

  return new Error(detail || `Сервер вернул ошибку (HTTP ${response.status})`)
}

/**
 * Extracts a reset delay from a provider error like "Please try again in 26m53.952s" or
 * "retry-after: 120". Returns undefined when no usable time is present (the common case today,
 * since the backend does not yet propagate Groq's reset headers).
 */
function parseRetryAfterMs(detail: string): number | undefined {
  const tryAgain = detail.match(/try again in\s+(?:(\d+)\s*m)?\s*([\d.]+)?\s*s/i)
  if (tryAgain) {
    const minutes = tryAgain[1] ? parseInt(tryAgain[1], 10) : 0
    const seconds = tryAgain[2] ? parseFloat(tryAgain[2]) : 0
    const ms = Math.round((minutes * 60 + seconds) * 1000)
    if (ms > 0) return ms
  }
  const retryAfter = detail.match(/retry[- ]after[:\s]+(\d+)/i)
  if (retryAfter) return parseInt(retryAfter[1], 10) * 1000
  return undefined
}
