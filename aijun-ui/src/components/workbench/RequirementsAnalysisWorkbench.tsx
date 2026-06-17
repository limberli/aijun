import { useRef, useState } from 'react'
import type { RequirementsAnalysis } from '@/types/result'
import { extractText } from '@/lib/api/extractText'
import { analyze } from '@/lib/api/a2a'
import { AgentUnavailableError } from '@/lib/api/errors'
import { parseRequirementsAnalysis } from '@/lib/parseAggregated'
import { buildQaMetadata, defaultSelections } from '@/lib/qaSettings'
import { useRateLimit } from '@/lib/rateLimit'
import { useI18n } from '@/lib/i18n'
import { DEFAULT_MODES } from '@/config/modes'
import { RequirementsPanel } from '@/components/workbench/RequirementsPanel'
import { AnalysisReportPanel } from '@/components/workbench/AnalysisReportPanel'

/**
 * "Анализ требований" tool: sends the document with riskAnalysis=true and shows the analyst's
 * report (completeness, contradictions, ambiguity, risk matrix, testability, recommendations).
 *
 * Note: the orchestrator always runs the tester agent too, so test cases are generated but ignored
 * here. Eliminating that waste needs a backend change (Phase 2) — out of scope for now.
 */
export function RequirementsAnalysisWorkbench() {
  const { t, lang } = useI18n()
  const [documentText, setDocumentText] = useState('')
  const [filename, setFilename] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)

  const [loading, setLoading] = useState(false)
  const [report, setReport] = useState<RequirementsAnalysis | null>(null)
  const [error, setError] = useState<string | null>(null)
  const abortRef = useRef<AbortController | null>(null)
  const rateLimit = useRateLimit()

  async function handleUpload(file: File) {
    setUploading(true)
    setError(null)
    try {
      const extracted = await extractText(file)
      setDocumentText(extracted.text)
      setFilename(extracted.filename)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Не удалось загрузить файл')
    } finally {
      setUploading(false)
    }
  }

  async function handleGenerate() {
    if (!documentText.trim()) return
    const controller = new AbortController()
    abortRef.current = controller
    setLoading(true)
    setError(null)
    setReport(null)
    try {
      const metadata = buildQaMetadata('test-cases', defaultSelections(DEFAULT_MODES[0]), true, lang)
      const { aggregated } = await analyze(documentText, metadata, controller.signal)
      setReport(parseRequirementsAnalysis(aggregated))
    } catch (e) {
      if (controller.signal.aborted) return
      if (e instanceof AgentUnavailableError)
        rateLimit.trigger({ retryAfterMs: e.retryAfterMs, rateLimited: e.rateLimited })
      setError(e instanceof Error ? e.message : 'Ошибка анализа')
    } finally {
      setLoading(false)
      abortRef.current = null
    }
  }

  function handleCancel() {
    abortRef.current?.abort()
    setLoading(false)
  }

  return (
    <div className="relative">
      <div className="absolute inset-x-8 -top-6 bottom-0 -z-10 rounded-[2rem] bg-brand-blue/10 blur-[60px]" />
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[0.9fr_1.1fr]">
        <RequirementsPanel
          documentText={documentText}
          onDocumentTextChange={setDocumentText}
          filename={filename}
          uploading={uploading}
          onUpload={handleUpload}
          loading={loading}
          onGenerate={handleGenerate}
          onCancel={handleCancel}
          generateLabel={t('btn.analyze')}
        />
        <AnalysisReportPanel report={report} loading={loading} error={error} />
      </div>
    </div>
  )
}
