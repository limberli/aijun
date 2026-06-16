import { motion } from 'framer-motion'
import { AlertTriangle, CheckCircle2, FileSearch, Loader2 } from 'lucide-react'
import type { AnalysisResult } from '@/types/result'
import { Badge } from '@/components/ui/Badge'
import { TestCaseAccordion } from '@/components/workbench/TestCaseAccordion'
import { StatsBar } from '@/components/workbench/StatsBar'
import { staggerContainer } from '@/lib/motion'

interface ResultsPanelProps {
  result: AnalysisResult | null
  loading: boolean
  error: string | null
}

export function ResultsPanel({ result, loading, error }: ResultsPanelProps) {
  return (
    <div className="overflow-hidden rounded-2xl border border-white/10 bg-surface/60 backdrop-blur-xl">
      <div className="border-b border-white/10 p-3.5 sm:p-4">
        <div className="flex items-center gap-2 text-slate-300">
          <span className="grid h-7 w-7 place-items-center rounded-lg bg-brand-cyan/10 text-brand-cyan">
            <CheckCircle2 className="h-4 w-4" />
          </span>
          <h3 className="text-sm font-semibold text-white">Сгенерированные тест-кейсы</h3>
        </div>
      </div>

      <div className="min-h-[20rem] p-3.5 sm:p-4">
        {loading && <LoadingState />}
        {!loading && error && <ErrorState message={error} />}
        {!loading && !error && !result && <EmptyState />}
        {!loading && !error && result && <Results result={result} />}
      </div>

      {!loading && !error && result && result.cases.length > 0 && <StatsBar result={result} />}
    </div>
  )
}

function Results({ result }: { result: AnalysisResult }) {
  if (result.cases.length === 0) {
    return (
      <div>
        <Badge tone="amber">
          <AlertTriangle className="h-3 w-3" /> Не удалось разобрать таблицу — показан исходный ответ
        </Badge>
        <pre className="mt-3 overflow-x-auto whitespace-pre-wrap rounded-lg bg-ink/60 p-3 font-mono text-[0.7rem] text-slate-300">
          {result.rawFallback}
        </pre>
      </div>
    )
  }

  return (
    <motion.ul
      variants={staggerContainer}
      initial="hidden"
      animate="show"
      className="flex flex-col gap-2"
    >
      {result.cases.map((tc, i) => (
        <TestCaseAccordion key={tc.id || i} testCase={tc} index={i} />
      ))}
    </motion.ul>
  )
}

function LoadingState() {
  return (
    <div className="flex h-72 flex-col items-center justify-center gap-3 text-slate-400">
      <Loader2 className="h-7 w-7 animate-spin text-brand-cyan" />
      <p className="text-sm">Генерация тест-кейсов…</p>
      <p className="text-xs text-slate-600">Локальная модель может думать несколько минут</p>
    </div>
  )
}

function EmptyState() {
  return (
    <div className="flex h-72 flex-col items-center justify-center gap-3 text-center text-slate-500">
      <FileSearch className="h-8 w-8 text-slate-600" />
      <p className="text-sm">Введите требования и нажмите «Сгенерировать»</p>
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
