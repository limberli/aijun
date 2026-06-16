import type { ModeSchema, QaSelections } from '@/types/qa'
import { Panel } from '@/components/ui/Panel'
import { toggleSelection } from '@/lib/qaSettings'
import { cn } from '@/lib/cn'

interface TestCaseSettingsProps {
  mode: ModeSchema
  selections: QaSelections
  onSelectionsChange: (next: QaSelections) => void
}

/** Generation controls (case types, techniques, step detail) rendered from the mode schema. */
export function TestCaseSettings({ mode, selections, onSelectionsChange }: TestCaseSettingsProps) {
  return (
    <Panel title="Настройки генерации">
      <div className="flex flex-col gap-4">
        {mode.controls.map((control) => (
          <div key={control.id}>
            <div className="mb-1.5 text-[0.7rem] uppercase tracking-wide text-slate-500">
              {control.label}
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
                    {option.label}
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
