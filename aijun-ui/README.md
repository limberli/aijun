# aijun-ui

AI JUN **V2** workbench — a tool-style frontend for the QA analysis backend (host-orchestrator).
Replaces the previous A2A chat UI with a task-oriented UI: pick a tool from the main menu,
then work in a dedicated screen. (`aijun-ui` is now the only web interface in the repo.)

- **Stack:** Vite + React 19 + Tailwind v4 + framer-motion + lucide (mirrors `aijun-web` styling).
- **Colors:** AI JUN palette (`src/index.css` `@theme` tokens).

## Run

```bash
npm install
npm run dev        # http://localhost:5173, proxies /a2a → orchestrator (localhost:8080)
```

Point the proxy at another orchestrator:

```bash
ORCHESTRATOR_URL=http://my-host:8080 npm run dev
```

The orchestrator must be running (see the repo root `docker compose up`).

## Architecture

### Data contract (`src/types/result.ts`)
The whole UI is built against `AnalysisResult` (structured `cases[]`, `techniques[]`, `risks[]`).

### Adapter (`src/lib/parseAggregated.ts`) — temporary
The backend currently returns **one aggregated markdown blob** (test-case table + optional risk
section). `parseAggregated()` is the **only** place that knows about markdown; it converts that blob
into `AnalysisResult`.

**Phase 2:** when the backend returns `AnalysisResult` JSON directly (e.g. via an A2A `data` part),
delete `parseAggregated.ts` and its call in `Workbench.tsx` — nothing else changes.

### Transport (`src/lib/api/`)
- `a2a.ts` — `message/send` JSON-RPC to the orchestrator (carries QA settings + risk toggle in
  `metadata`). Non-streaming; generation can take minutes — calls are cancelable via `AbortSignal`.
- `extractText.ts` — `.docx` upload → orchestrator `POST /api/extract-text`.
- `getModes.ts` — generation-settings schema from `GET /api/modes` (falls back to `config/modes.ts`).

All calls go through the Vite dev proxy `/a2a` to avoid CORS without touching the backend. For
production deployment, serve the UI behind a reverse proxy that forwards `/a2a` to the orchestrator,
or enable CORS on the backend.

## Menu (`src/config/menu.ts`)
Main menu mirrors the V2 roadmap. Only **Написание документации → Генерация тест-кейсов** is wired
to a working agent; everything else is marked "в разработке". Add tools/agents here as they ship.
