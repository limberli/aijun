// The JSON contract the whole UI is built against. Today it is produced client-side by the
// adapter in lib/parseAggregated.ts (which parses the orchestrator's markdown). In Phase 2 the
// backend will return this shape directly and the adapter is simply deleted — the UI is unchanged.

/** One step of a test case (a row in the expanded case table). */
export interface TestStep {
  index: number
  action: string
  expected: string
}

/** A single test case, reconstructed from its header row + continuation rows. */
export interface TestCase {
  id: string // e.g. "TC-001"
  technique: string // "Граничные значения", ...
  title: string // "Описание проверки"
  steps: TestStep[]
}

export type RiskLevel = 'high' | 'medium' | 'low'

export interface Risk {
  title: string
  level: RiskLevel
}

export interface AnalysisResult {
  cases: TestCase[]
  /** Distinct techniques actually present across the generated cases. */
  techniques: string[]
  /** Risks — present only when risk analysis was enabled. */
  risks: Risk[]
  riskAnalysisEnabled: boolean
  /** Raw markdown fallback when the table could not be parsed into cases. */
  rawFallback?: string
}

/** One `## N. Title` section of the analyst's requirements report. */
export interface ReportSection {
  id: string
  title: string // human label (translated where known)
  body: string // raw markdown body of the section
}

/** Structured result of the "Анализ требований" tool (the analyst agent's report). */
export interface RequirementsAnalysis {
  sections: ReportSection[]
  risks: Risk[]
  /** Raw markdown fallback when the report could not be split into sections. */
  rawFallback?: string
}
