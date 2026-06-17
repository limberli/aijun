import type { ModeSchema, QaSelections } from '@/types/qa'
import { Panel } from '@/components/ui/Panel'
import { toggleSelection } from '@/lib/qaSettings'
import { useI18n } from '@/lib/i18n'
import { cn } from '@/lib/cn'

interface TestCaseSettingsProps {
  mode: ModeSchema
  selections: QaSelections
  onSelectionsChange: (next: QaSelections) => void
}

/** Generation controls (case types, techniques, step detail) rendered from the mode schema. */
export function TestCaseSettings({ mode, selections, onSelectionsChange }: TestCaseSettingsProps) {
  const { t } = useI18n()

  // Localize known control/option ids; fall back to the backend-provided label for anything new.
  const localized = (key: string, fallback: string): string => {
    const v = t(key)
    return v === key ? fallback : v
  }

  return (
    <Panel title={t('req.settings')}>
      <div className="flex flex-col gap-4">
        {mode.controls.map((control) => (
          <div key={control.id}>
            <div className="mb-1.5 text-[0.7rem] uppercase tracking-wide text-slate-500">
              {localized(`settings.control.${control.id}`, control.label)}
            </div>
            <div className="flex flex-wrap gap-1.5">
              {control.options.map((option) => {
                const active = (selections[control.id] ?? []).includes(option.id)
                return (
                  <button
                    key={option.id}
                    type="button"
                    onClick={() =>
                      onSelectionsChange(
                        toggleSelection(selections, control.id, option.id, control.type),
                      )
                    }
                    className={cn(
                      'rounded-full border px-2.5 py-1 text-[0.7rem] transition',
                      active
                        ? 'border-brand-cyan/40 bg-brand-cyan/10 text-brand-100'
                        : 'border-white/10 bg-white/[0.02] text-slate-400 hover:border-white/20',
                    )}
                  >
                    {localized(`settings.option.${option.id}`, option.label)}
                  </button>
                )
              })}
            </div>
          </div>
        ))}
      </div>
    </Panel>
  )
}
