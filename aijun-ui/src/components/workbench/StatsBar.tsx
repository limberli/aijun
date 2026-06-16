import type { AnalysisResult } from '@/types/result'
import { Badge } from '@/components/ui/Badge'

/**
 * Footer stats under the test-case list:
 *  - number of cases generated in one run,
 *  - which boundary/design techniques were applied,
 *  - risk count (only when risk analysis was enabled).
 *
 * Note: a true coverage % is not provided by the backend yet (Phase 2). We intentionally do not
 * fabricate it — the meaningful, honest signals are shown instead.
 */
export function StatsBar({ result }: { result: AnalysisResult }) {
  const edgeTechniques = result.techniques.filter((t) => /(гранич|boundary)/i.test(t))

  return (
    <div className="flex flex-col gap-3 border-t border-white/10 bg-white/[0.03] px-4 py-3 sm:px-5">
      <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-xs">
        <span className="flex items-center gap-2 text-slate-300">
          <span className="font-display text-base font-bold text-brand-cyan">
            {result.cases.length}
          </span>
          кейсов за прогон
        </span>
        {result.riskAnalysisEnabled && (
          <span className="flex items-center gap-2 text-slate-400">
            <span className="font-display text-base font-bold text-white">
              {result.risks.length}
            </span>
            рисков
          </span>
        )}
      </div>

      {result.techniques.length > 0 && (
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-[0.7rem] text-slate-500">
            {edgeTechniques.length > 0 ? 'Граничные случаи и техники:' : 'Применённые техники:'}
          </span>
          {result.techniques.map((t) => (
            <Badge key={t} tone={/(гранич|boundary)/i.test(t) ? 'amber' : 'slate'}>
              {t}
            </Badge>
          ))}
        </div>
      )}
    </div>
  )
}
