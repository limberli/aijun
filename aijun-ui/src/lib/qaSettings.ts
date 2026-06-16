import type { ModeSchema, QaMetadata, QaSelections } from '@/types/qa'

/** Initial selections for a mode, taken from each control's `defaults`. */
export function defaultSelections(mode: ModeSchema): QaSelections {
  const selections: QaSelections = {}
  for (const control of mode.controls) {
    selections[control.id] = [...control.defaults]
  }
  return selections
}

/** Toggle an option for a control, respecting single- vs multi-select semantics. */
export function toggleSelection(
  selections: QaSelections,
  controlId: string,
  optionId: string,
  type: 'single' | 'multi',
): QaSelections {
  if (type === 'single') {
    return { ...selections, [controlId]: [optionId] }
  }
  const current = selections[controlId] ?? []
  const next = current.includes(optionId)
    ? current.filter((id) => id !== optionId)
    : [...current, optionId]
  return { ...selections, [controlId]: next }
}

/** Wraps chosen settings into the A2A metadata shape: { qa: { mode, selections }, riskAnalysis }. */
export function buildQaMetadata(
  modeId: string,
  selections: QaSelections,
  riskAnalysis: boolean,
): QaMetadata {
  return { qa: { mode: modeId, selections }, riskAnalysis }
}
