import type { ModeSchema } from '@/types/qa'
import { backendUrl } from '@/lib/api/client'

/**
 * Fetches the generation-settings schema from the orchestrator's GET /api/modes.
 * Returns null if unavailable — the caller falls back to DEFAULT_MODES.
 */
export async function getModes(signal?: AbortSignal): Promise<ModeSchema[] | null> {
  try {
    const response = await fetch(backendUrl('/api/modes'), { signal })
    if (!response.ok) return null
    const modes = (await response.json()) as ModeSchema[]
    return Array.isArray(modes) && modes.length > 0 ? modes : null
  } catch {
    return null
  }
}
