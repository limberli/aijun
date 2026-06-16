import { motion } from 'framer-motion'
import { AlertTriangle, FileSearch, Loader2, ShieldAlert } from 'lucide-react'
import type { RequirementsAnalysis, RiskLevel } from '@/types/result'
import { Badge } from '@/components/ui/Badge'
import { Markdown } from '@/components/ui/Markdown'
import { fadeUp, staggerContainer } from '@/lib/motion'

interface AnalysisReportPanelProps {
  report: RequirementsAnalysis | null
  loading: boolean
  error: string | null
}

const RISK_TONE: Record<RiskLevel, 'rose' | 'amber' | 'emerald'> = {
  high: 'rose',
  medium: 'amber',
  low: 'emerald',
}
const RISK_LABEL: Record<RiskLevel, string> = {
  high: 'высокий',
  medium: 'средний',
  low: 'низкий',
}

export function AnalysisReportPanel({ report, loading, error }: AnalysisReportPanelProps) {
  return (
    <div className="overflow-hidden rounded-2xl border border-white/10 bg-surface/60 backdrop-blur-xl">
      <div className="flex items-center gap-2 border-b border-white/10 p-3.5 text-slate-300 sm:p-4">
        <span className="grid h-7 w-7 place-items-center rounded-lg bg-brand-cyan/10 text-brand-cyan">
          <ShieldAlert className="h-4 w-4" />
        </span>
        <h3 className="text-sm font-semibold text-white">Анализ требований</h3>
        {report && report.risks.length > 0 && (
          <Badge tone="rose" className="ml-auto">
            рисков: {report.risks.length}
          </Badge>
        )}
      </div>

      <div className="min-h-[20rem] p-3.5 sm:p-4">
        {loading && <LoadingState />}
        {!loading && error && <ErrorState message={error} />}
        {!loading && !error && !report && <EmptyState />}
        {!loading && !error && report && <Report report={report} />}
      </div>
    </div>
  )
}

function Report({ report }: { report: RequirementsAnalysis }) {
  if (report.sections.length === 0) {
    return (
      <div>
        <Badge tone="amber">
          <AlertTriangle className="h-3 w-3" /> Не удалось разобрать отчёт — показан исходный ответ
        </Badge>
        <pre className="mt-3 overflow-x-auto whitespace-pre-wrap rounded-lg bg-ink/60 p-3 font-mono text-[0.7rem] text-slate-300">
          {report.rawFallback}
        </pre>
      </div>
    )
  }

  return (
    <motion.div
      variants={staggerContainer}
      initial="hidden"
      animate="show"
      className="flex flex-col gap-3"
    >
      {report.risks.length > 0 && (
        <motion.div
          variants={fadeUp}
          className="rounded-xl border border-white/10 bg-white/[0.02] p-3.5"
        >
          <div className="mb-2 text-[0.7rem] uppercase tracking-wide text-slate-500">
            Выявленные риски
          </div>
          <ul className="flex flex-col gap-2">
            {report.risks.map((risk, i) => (
              <li
                key={i}
                className="flex items-center gap-2 rounded-lg bg-ink/50 px-3 py-2 text-xs text-slate-200 ring-1 ring-white/5"
              >
                <span className="flex-1">{risk.title}</span>
                <Badge tone={RISK_TONE[risk.level]}>{RISK_LABEL[risk.level]}</Badge>
              </li>
            ))}
          </ul>
        </motion.div>
      )}

      {report.sections.map((section) => (
        <motion.div
          key={section.id}
          variants={fadeUp}
          className="rounded-xl border border-white/10 bg-white/[0.02] p-3.5"
        >
          <h4 className="mb-2 text-sm font-semibold text-white">{section.title}</h4>
          {section.body ? (
            <Markdown>{section.body}</Markdown>
          ) : (
            <p className="text-xs text-slate-500">—</p>
          )}
        </motion.div>
      ))}
    </motion.div>
  )
}

function LoadingState() {
  return (
    <div className="flex h-72 flex-col items-center justify-center gap-3 text-slate-400">
      <Loader2 className="h-7 w-7 animate-spin text-brand-cyan" />
      <p className="text-sm">Анализ требований…</p>
      <p className="text-xs text-slate-600">Локальная модель может думать несколько минут</p>
    </div>
  )
}

function EmptyState() {
  return (
    <div className="flex h-72 flex-col items-center justify-center gap-3 text-center text-slate-500">
      <FileSearch className="h-8 w-8 text-slate-600" />
      <p className="text-sm">Введите требования и нажмите «Проанализировать»</p>
    </div>
  )
}

function ErrorState({ message }: { message: string }) {
  return (
    <div className="flex h-72 flex-col items-center justify-center gap-3 text-center">
      <AlertTriangle className="h-8 w-8 text-rose-400" />
      <p className="max-w-sm text-sm text-rose-300">{message}</p>
    </div>
  )
}
