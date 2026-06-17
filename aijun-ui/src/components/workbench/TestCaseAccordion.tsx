import { useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Check, ChevronDown, Copy } from 'lucide-react'
import type { TestCase } from '@/types/result'
import { Badge } from '@/components/ui/Badge'
import { useI18n } from '@/lib/i18n'
import { cn } from '@/lib/cn'

const EDGE_RE = /(гранич|boundary)/i

/** Collapsed row "| TC-01 | Название |"; expands into a step table with a copy button. */
export function TestCaseAccordion({ testCase, index }: { testCase: TestCase; index: number }) {
  const { t } = useI18n()
  const [open, setOpen] = useState(false)
  const [copied, setCopied] = useState(false)
  const isEdge = EDGE_RE.test(testCase.technique)

  async function copy(e: React.MouseEvent) {
    e.stopPropagation()
    try {
      await navigator.clipboard.writeText(toPlainText(testCase))
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // clipboard unavailable — ignore
    }
  }

  return (
    <li className="overflow-hidden rounded-lg bg-ink/50 ring-1 ring-white/5">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center gap-3 px-3 py-2.5 text-left transition hover:bg-white/[0.03]"
      >
        <span className="font-mono text-[0.65rem] text-slate-500">
          {testCase.id || `TC-${String(index + 1).padStart(2, '0')}`}
        </span>
        <span className="flex-1 text-xs text-slate-200">{testCase.title || t('tc.untitled')}</span>
        {isEdge && <Badge tone="amber">{t('tc.edge')}</Badge>}
        <ChevronDown
          className={cn('h-4 w-4 shrink-0 text-slate-500 transition', open && 'rotate-180')}
        />
      </button>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
            className="overflow-hidden"
          >
            <div className="border-t border-white/5 px-3 py-3">
              <div className="mb-2 flex flex-wrap items-center gap-2">
                {testCase.technique && <Badge tone="cyan">{testCase.technique}</Badge>}
                <button
                  type="button"
                  onClick={copy}
                  className="ml-auto inline-flex items-center gap-1.5 rounded-md border border-white/10 bg-white/[0.03] px-2.5 py-1 text-[0.7rem] text-slate-300 transition hover:border-brand-cyan/30 hover:text-brand-cyan"
                >
                  {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                  {copied ? t('tc.copied') : t('tc.copy')}
                </button>
              </div>

              <div className="overflow-hidden rounded-lg border border-white/10">
                <table className="w-full border-collapse text-left text-xs">
                  <thead>
                    <tr className="bg-white/[0.04] text-slate-400">
                      <th className="w-10 px-2.5 py-1.5 font-medium">#</th>
                      <th className="px-2.5 py-1.5 font-medium">{t('tc.colStep')}</th>
                      <th className="px-2.5 py-1.5 font-medium">{t('tc.colExpected')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {testCase.steps.map((step) => (
                      <tr key={step.index} className="border-t border-white/5 align-top">
                        <td className="px-2.5 py-1.5 font-mono text-slate-500">{step.index}</td>
                        <td className="px-2.5 py-1.5 text-slate-200">{step.action}</td>
                        <td className="px-2.5 py-1.5 text-slate-400">{step.expected}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </li>
  )
}

/** Human-readable plain-text export for the clipboard. */
function toPlainText(tc: TestCase): string {
  const head = `${tc.id} — ${tc.title}\nТехника: ${tc.technique}`
  const steps = tc.steps
    .map((s) => `${s.index}. ${s.action}  →  ${s.expected}`)
    .join('\n')
  return `${head}\n\n${steps}`
}
