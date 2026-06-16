import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { fileURLToPath, URL } from 'node:url'

// Orchestrator base URL. The browser cannot call the A2A endpoint directly (no CORS),
// so in dev we proxy everything under /a2a → the orchestrator. Backend is untouched.
const ORCHESTRATOR = process.env.ORCHESTRATOR_URL ?? 'http://localhost:8080'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  server: {
    proxy: {
      // POST /a2a/        → orchestrator A2A JSON-RPC (message/send)
      // GET  /a2a/api/... → orchestrator REST (modes, extract-text)
      '/a2a': {
        target: ORCHESTRATOR,
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/a2a/, ''),
      },
    },
  },
})
