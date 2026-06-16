import type {
  AnalysisResult,
  ReportSection,
  RequirementsAnalysis,
  Risk,
  RiskLevel,
  TestCase,
} from '@/types/result'

// ─────────────────────────────────────────────────────────────────────────────
// ADAPTER (Phase 1). The orchestrator aggregates both agents into one markdown blob:
//
//   ## Test Cases
//   | ID | Техника-тест дизайна | Описание проверки | Шаг | Ожидаемый результат |
//   | TC-001 | Граничные значения | ... | 1. ... | ... |
//   |  |  |  | 2. ... | ... |
//   ---
//   ## Risk Analysis
//   <free text>
//
// This file is the ONLY place that knows about markdown. When the backend returns the
// AnalysisResult JSON directly (Phase 2), delete this file and the call site.
// ─────────────────────────────────────────────────────────────────────────────

/** Splits the aggregated response into the tester table section and the analyst section. */
function splitSections(aggregated: string): { testCases: string; risks: string | null } {
  // The orchestrator joins with "\n\n---\n\n## Risk Analysis\n\n".
  const riskMarker = /\n-{3,}\s*\n+#{1,6}\s*Risk Analysis\s*\n/i
  const match = aggregated.split(riskMarker)
  const testCases = stripHeading(match[0], 'Test Cases')
  const risks = match.length > 1 ? match.slice(1).join('\n').trim() : null
  return { testCases, risks }
}

function stripHeading(section: string, heading: string): string {
  const re = new RegExp(`^\\s*#{1,6}\\s*${heading}\\s*\\n`, 'i')
  return section.replace(re, '').trim()
}

/** "| a | b | c |" → ["a", "b", "c"] (outer empties from edge pipes removed). */
function splitRow(line: string): string[] {
  const cells = line.split('|').map((c) => c.trim())
  if (cells.length && cells[0] === '') cells.shift()
  if (cells.length && cells[cells.length - 1] === '') cells.pop()
  return cells
}

const CASE_ID = /^TC[-\s]?\d+$/i
const SEPARATOR_CELL = /^:?-{2,}:?$/

function isSeparatorRow(cells: string[]): boolean {
  const nonEmpty = cells.filter((c) => c !== '')
  return nonEmpty.length > 0 && nonEmpty.every((c) => SEPARATOR_CELL.test(c))
}

function isHeaderRow(cells: string[]): boolean {
  return cells[0]?.toLowerCase() === 'id'
}

/**
 * Parses the merged markdown table into TestCase[]. A case is a header row (first cell matches
 * TC-\d+) followed by continuation rows (empty first cell) that add further steps.
 */
function parseTable(markdown: string): TestCase[] {
  const cases: TestCase[] = []
  let current: TestCase | null = null

  for (const raw of markdown.split(/\r?\n/)) {
    const line = raw.trim()
    if (!line.startsWith('|')) continue
    const cells = splitRow(line)
    if (cells.length === 0) continue
    if (isHeaderRow(cells) || isSeparatorRow(cells)) continue

    const first = cells[0] ?? ''
    const isNewCase = CASE_ID.test(first)

    // Columns: ID | Техника | Описание | Шаг | Ожидаемый результат
    const technique = cells[1] ?? ''
    const title = cells[2] ?? ''
    const stepText = cells[3] ?? ''
    const expected = cells[4] ?? ''

    if (isNewCase) {
      current = {
        id: first.toUpperCase().replace(/\s+/, '-'),
        technique,
        title,
        steps: [],
      }
      cases.push(current)
      pushStep(current, stepText, expected)
    } else if (current) {
      // Continuation row: only step + expected are meaningful.
      pushStep(current, stepText, expected)
    }
  }

  return cases
}

function pushStep(tc: TestCase, action: string, expected: string): void {
  if (!action && !expected) return
  tc.steps.push({
    index: tc.steps.length + 1,
    action: stripStepNumber(action),
    expected,
  })
}

/** Drops a leading "1." / "2)" the model may put inside the step cell — we render our own index. */
function stripStepNumber(s: string): string {
  return s.replace(/^\s*\d+[.)]\s*/, '').trim()
}

const RISK_KEYWORDS: Record<RiskLevel, RegExp> = {
  high: /(высок|критич|critical|high|серьёзн|серьезн)/i,
  medium: /(средн|medium|умерен|moderate)/i,
  low: /(низк|low|незначит|minor)/i,
}

/**
 * Extracts risks from the analyst's report. The structured signal is the "Risk Matrix" table
 * (columns: ID | Description | Category | Severity | Likelihood | Mitigation), so we read its rows:
 * Description → title, Severity → level. Falls back to bullet lines only if no matrix is present.
 */
function parseRisks(markdown: string | null): Risk[] {
  if (!markdown) return []
  const fromMatrix = parseRiskMatrix(markdown)
  return fromMatrix.length > 0 ? fromMatrix : parseRiskBullets(markdown)
}

function parseRiskMatrix(markdown: string): Risk[] {
  const lines = markdown.split(/\r?\n/)
  const start = lines.findIndex((l) => /risk\s*matrix|матрица\s*риск/i.test(l))
  if (start === -1) return []

  const risks: Risk[] = []
  let descCol = 1 // ID | Description | Category | Severity | ...
  let sevCol = 3
  let headerSeen = false

  for (let i = start + 1; i < lines.length; i++) {
    const line = lines[i].trim()
    if (line.startsWith('#')) break // next section
    if (!line.startsWith('|')) {
      if (headerSeen) break // table ended
      continue
    }
    const cells = splitRow(line)
    if (isSeparatorRow(cells)) continue

    // Map columns from the header row, so we tolerate column-order variations.
    if (!headerSeen && /description|описан/i.test(line)) {
      const di = cells.findIndex((c) => /description|описан/i.test(c))
      const si = cells.findIndex((c) => /severity|критич|серьёзн|серьезн|уровень/i.test(c))
      if (di >= 0) descCol = di
      if (si >= 0) sevCol = si
      headerSeen = true
      continue
    }
    headerSeen = true

    const title = (cells[descCol] ?? '').replace(/\*\*/g, '').trim()
    const severity = cells[sevCol] ?? ''
    if (!title) continue
    risks.push({ title, level: detectLevel(severity || title) })
  }
  return risks
}

/** Fallback: treat top-level bullet/numbered lines under a risk-ish section as risks. */
function parseRiskBullets(markdown: string): Risk[] {
  const risks: Risk[] = []
  for (const raw of markdown.split(/\r?\n/)) {
    const line = raw.trim()
    const m = line.match(/^(?:[-*•]|\d+[.)])\s+(.*)$/)
    if (!m) continue
    const title = m[1].replace(/\*\*/g, '').trim()
    if (!title) continue
    risks.push({ title, level: detectLevel(title) })
  }
  return risks
}

function detectLevel(text: string): RiskLevel {
  if (RISK_KEYWORDS.high.test(text)) return 'high'
  if (RISK_KEYWORDS.low.test(text)) return 'low'
  return 'medium'
}

// ─── "Анализ требований" tool — parses the analyst report (## 1..6 sections) ──────────────────

const SECTION_LABELS: Array<{ id: string; match: RegExp; label: string }> = [
  { id: 'completeness', match: /completeness|полнот/i, label: 'Полнота требований' },
  { id: 'contradictions', match: /contradiction|противореч/i, label: 'Противоречия' },
  { id: 'ambiguity', match: /ambiguity|неоднознач|неясн/i, label: 'Неоднозначности' },
  { id: 'risk-matrix', match: /risk\s*matrix|матрица\s*риск/i, label: 'Матрица рисков' },
  { id: 'testability', match: /testability|тестопригодн|тестируем/i, label: 'Тестопригодность' },
  { id: 'recommendations', match: /recommendation|рекоменд/i, label: 'Рекомендации' },
]

function labelFor(rawTitle: string): { id: string; title: string } {
  const stripped = rawTitle.replace(/^\s*#{1,6}\s*/, '').replace(/^\d+[.)]\s*/, '').trim()
  const known = SECTION_LABELS.find((s) => s.match.test(stripped))
  return known ? { id: known.id, title: known.label } : { id: stripped.toLowerCase(), title: stripped }
}

/** Splits the analyst markdown into its `## N. Title` sections, preserving order. */
function splitReportSections(markdown: string): ReportSection[] {
  const lines = markdown.split(/\r?\n/)
  const sections: ReportSection[] = []
  let current: { title: string; body: string[] } | null = null

  for (const line of lines) {
    if (/^#{1,6}\s+\S/.test(line.trim())) {
      if (current) sections.push(finishSection(current))
      current = { title: line.trim(), body: [] }
    } else if (current) {
      current.body.push(line)
    }
  }
  if (current) sections.push(finishSection(current))
  return sections
}

function finishSection(s: { title: string; body: string[] }): ReportSection {
  const { id, title } = labelFor(s.title)
  return { id, title, body: s.body.join('\n').trim() }
}

/** Converts the orchestrator's aggregated markdown into the requirements-analysis contract. */
export function parseRequirementsAnalysis(aggregated: string): RequirementsAnalysis {
  const { risks: analystSection } = splitSections(aggregated)
  if (!analystSection) {
    return { sections: [], risks: [], rawFallback: aggregated.trim() }
  }
  const sections = splitReportSections(analystSection)
  return {
    sections,
    risks: parseRisks(analystSection),
    rawFallback: sections.length === 0 ? analystSection : undefined,
  }
}

/** Converts the orchestrator's aggregated markdown into the UI's JSON contract. */
export function parseAggregated(aggregated: string, riskAnalysisEnabled: boolean): AnalysisResult {
  const { testCases, risks } = splitSections(aggregated)
  const cases = parseTable(testCases)
  const techniques = [...new Set(cases.map((c) => c.technique).filter(Boolean))]

  return {
    cases,
    techniques,
    risks: riskAnalysisEnabled ? parseRisks(risks) : [],
    riskAnalysisEnabled,
    rawFallback: cases.length === 0 ? testCases : undefined,
  }
}
