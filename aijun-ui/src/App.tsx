import { useState } from 'react'
import { ArrowLeft, Cpu, Crown } from 'lucide-react'
import { Shell } from '@/components/Shell'
import { MainMenu } from '@/components/MainMenu'
import { Workbench } from '@/components/workbench/Workbench'
import { RequirementsAnalysisWorkbench } from '@/components/workbench/RequirementsAnalysisWorkbench'
import { PlanScreen } from '@/components/PlanScreen'
import { BillingScreen } from '@/components/BillingScreen'
import { ACTIVE_PLAN } from '@/config/plan'
import { NavigationProvider, type View } from '@/lib/navigation'
import { useI18n } from '@/lib/i18n'

/** Lightweight state-based router: start menu ↔ tool views ↔ plan / billing screens. */
export default function App() {
  const { t } = useI18n()
  const [view, setView] = useState<View>('menu')

  const lead =
    view !== 'menu' ? (
      <button
        type="button"
        onClick={() => setView('menu')}
        className="inline-flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/[0.03] px-2.5 py-1.5 text-xs text-slate-300 transition hover:border-brand-cyan/30 hover:text-brand-cyan"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        {t('nav.menu')}
      </button>
    ) : undefined

  const isLocal = ACTIVE_PLAN.id === 'local'
  const planBadge =
    view !== 'plan' ? (
      <button
        type="button"
        onClick={() => setView('plan')}
        className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.04] px-2.5 py-1 text-[0.7rem] font-medium text-slate-300 transition hover:border-brand-cyan/30 hover:text-brand-cyan"
      >
        {isLocal ? (
          <Cpu className="h-3.5 w-3.5 text-emerald-400" />
        ) : (
          <Crown className="h-3.5 w-3.5 text-brand-cyan" />
        )}
        {isLocal ? ACTIVE_PLAN.label : `${t('plan.badgePrefix')} ${ACTIVE_PLAN.label}`}
      </button>
    ) : undefined

  return (
    <NavigationProvider navigate={setView}>
      <Shell lead={lead} headerActions={planBadge}>
        {view === 'menu' && <MainMenu onOpenTool={setView} />}
        {view === 'test-cases' && <Workbench />}
        {view === 'requirements-analysis' && <RequirementsAnalysisWorkbench />}
        {view === 'plan' && <PlanScreen />}
        {view === 'billing' && <BillingScreen />}
      </Shell>
    </NavigationProvider>
  )
}
