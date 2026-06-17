import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { RateLimitProvider } from '@/lib/rateLimit'
import { I18nProvider } from '@/lib/i18n'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <I18nProvider>
      <RateLimitProvider>
        <App />
      </RateLimitProvider>
    </I18nProvider>
  </StrictMode>,
)
