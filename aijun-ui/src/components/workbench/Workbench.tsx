import { useEffect, useMemo, useRef, useState } from 'react'
import type { AnalysisResult } from '@/types/result'
import type { ModeSchema, QaSelections } from '@/types/qa'
import { DEFAULT_MODES } from '@/config/modes'
import { getModes } from '@/lib/api/getModes'
import { extractText } from '@/lib/api/extractText'
import { analyze } from '@/lib/api/a2a'
import { AgentUnavailableError } from '@/lib/api/errors'
import { parseAggregated } from '@/lib/parseAggregated'
import { buildQaMetadata, defaultSelections } from '@/lib/qaSettings'
import { useRateLimit } from '@/lib/rateLimit'
import { useI18n } from '@/lib/i18n'
import { RequirementsPanel } from '@/components/workbench/RequirementsPanel'
import { TestCaseSettings } from '@/components/workbench/TestCaseSettings'
import { ResultsPanel } from '@/components/workbench/ResultsPanel'

const MODE_ID = 'test-cases'

/** Test-case generation tool: left = requirements + settings, right = parsed cases + stats. */
export function Workbench() {
  const { t } = useI18n()
  const [modes, setModes] = useState<ModeSchema[]>(DEFAULT_MODES)
  const mode = useMemo(
    () => modes.find((m) => m.id === MODE_ID) ?? modes[0] ?? DEFAULT_MODES[0],
    [modes],
  )

  const [documentText, setDocumentText] = useState('')
  const [selections, setSelections] = useState<QaSelections>(() => defaultSelections(DEFAULT_MODES[0]))

  const [filename, setFilename] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)

  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<AnalysisResult | null>(null)
  const [error, setError] = useState<string | null>(null)
  const abortRef = useRef<AbortController | null>(null)
  const rateLimit = useRateLimit()

  // Load the real settings schema from the backend; fall back to DEFAULT_MODES.
  useEffect(() => {
    let cancelled = false
    getModes().then((fetched) => {
      if (cancelled || !fetched) return
      setModes(fetched)
      const next = fetched.find((m) => m.id === MODE_ID) ?? fetched[0]
      if (next) setSelections(defaultSelections(next))
    })
    return () => {
      cancelled = true
    }
  }, [])

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
    setResult(null)
    try {
      // Risk analysis is a separate tool now → never request it here.
      const metadata = buildQaMetadata(mode.id, selections, false)
      const { aggregated } = await analyze(documentText, metadata, controller.signal)
      setResult(parseAggregated(aggregated, false))
    } catch (e) {
      if (controller.signal.aborted) return
      if (e instanceof AgentUnavailableError)
        rateLimit.trigger({ retryAfterMs: e.retryAfterMs, rateLimited: e.rateLimited })
      setError(e instanceof Error ? e.message : 'Ошибка генерации')
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
          generateLabel={t('btn.generateTests')}
          settings={
            <TestCaseSettings mode={mode} selections={selections} onSelectionsChange={setSelections} />
          }
        />
        <ResultsPanel result={result} loading={loading} error={error} />
      </div>
    </div>
  )
}
