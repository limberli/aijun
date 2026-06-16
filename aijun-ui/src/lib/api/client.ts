// All backend calls go through the Vite dev proxy at /a2a → orchestrator (avoids CORS, no
// backend change). Override the base for other deployments via VITE_A2A_BASE.
export const A2A_BASE: string = import.meta.env.VITE_A2A_BASE ?? '/a2a'

/** Orchestrator REST/A2A URL builder. */
export function backendUrl(path: string): string {
  return `${A2A_BASE.replace(/\/$/, '')}${path}`
}
