import { motion } from 'framer-motion'
import { Check, Coins, Cpu, FileText, ListChecks, Network, ShieldAlert, Sparkles, Wallet } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { ACTIVE_PLAN } from '@/config/plan'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { fadeUp, staggerContainer } from '@/lib/motion'
import { useI18n, type LocPair } from '@/lib/i18n'
import { cn } from '@/lib/cn'

interface CreditPack {
  id: string
  title: string
  credits: LocPair
  audience: LocPair
  benefits: LocPair[]
  example: LocPair
  cta: LocPair
  popular?: boolean
}

// User buys the *result* of AIJUN's work (credits → actions), not an abstract model resource.
// Real pricing + checkout arrive with the billing backend (Phase 2); purchases go through our service.
const PACKS: CreditPack[] = [
  {
    id: 'starter',
    title: 'Starter',
    credits: { ru: '500 кредитов', en: '500 credits' },
    audience: { ru: 'Для одного QA и пробных проектов', en: 'For a single QA and trial projects' },
    benefits: [
      { ru: 'до 50 анализов требований', en: 'up to 50 requirement analyses' },
      { ru: 'до 500 тест-кейсов', en: 'up to 500 test cases' },
      { ru: 'до 25 готовых документов', en: 'up to 25 finished documents' },
      { ru: 'кредиты не сгорают', en: 'credits never expire' },
    ],
    example: {
      ru: 'Разобрать требования модуля и собрать тест-кейсы на спринт.',
      en: 'Analyze a module’s requirements and build test cases for a sprint.',
    },
    cta: { ru: 'Выбрать Starter', en: 'Choose Starter' },
  },
  {
    id: 'standard',
    title: 'Standard',
    credits: { ru: '2 000 кредитов', en: '2,000 credits' },
    audience: { ru: 'Для команды на постоянном проекте', en: 'For a team on an ongoing project' },
    benefits: [
      { ru: 'до 200 анализов требований', en: 'up to 200 requirement analyses' },
      { ru: 'до 2 000 тест-кейсов', en: 'up to 2,000 test cases' },
      { ru: 'до 100 готовых документов', en: 'up to 100 finished documents' },
      { ru: 'матрица трассируемости и чек-листы', en: 'traceability matrix and checklists' },
    ],
    example: {
      ru: 'Полный цикл QA-документации по релизу среднего продукта.',
      en: 'Full QA documentation cycle for a mid-size product release.',
    },
    cta: { ru: 'Выбрать Standard', en: 'Choose Standard' },
    popular: true,
  },
  {
    id: 'pro',
    title: 'Pro',
    credits: { ru: '10 000 кредитов', en: '10,000 credits' },
    audience: {
      ru: 'Для интенсивной работы и больших продуктов',
      en: 'For heavy use and large products',
    },
    benefits: [
      { ru: 'до 1 000 анализов требований', en: 'up to 1,000 requirement analyses' },
      { ru: 'до 10 000 тест-кейсов', en: 'up to 10,000 test cases' },
      { ru: 'до 500 готовых документов', en: 'up to 500 finished documents' },
      { ru: 'приоритетная обработка', en: 'priority processing' },
    ],
    example: {
      ru: 'Несколько команд и продуктов на одном балансе.',
      en: 'Several teams and products on one balance.',
    },
    cta: { ru: 'Выбрать Pro', en: 'Choose Pro' },
  },
]

interface CostItem {
  icon: LucideIcon
  action: LocPair
  cost: LocPair
}

const COSTS: CostItem[] = [
  { icon: ShieldAlert, action: { ru: 'Анализ требований', en: 'Requirements analysis' }, cost: { ru: '10 кредитов', en: '10 credits' } },
  { icon: FileText, action: { ru: 'Генерация тест-кейсов', en: 'Test-case generation' }, cost: { ru: '1 кредит за кейс', en: '1 credit per case' } },
  { icon: ListChecks, action: { ru: 'Генерация чек-листа', en: 'Checklist generation' }, cost: { ru: '5 кредитов', en: '5 credits' } },
  { icon: Network, action: { ru: 'Матрица трассируемости', en: 'Traceability matrix' }, cost: { ru: '15 кредитов', en: '15 credits' } },
  { icon: FileText, action: { ru: 'Проверка документации', en: 'Documentation review' }, cost: { ru: '8 кредитов', en: '8 credits' } },
]

/** In-app credit balance / packs screen (placeholder). Replaces the external Groq billing link. */
export function BillingScreen() {
  const { t } = useI18n()

  // Local models have nothing to buy — no credits, no payment.
  if (!ACTIVE_PLAN.billable) {
    return (
      <div className="max-w-xl">
        <h1 className="font-display text-2xl font-bold sm:text-3xl">{t('billing.localTitle')}</h1>
        <div className="mt-6 flex items-center gap-3 rounded-xl border border-emerald-400/30 bg-emerald-400/[0.04] px-4 py-4 text-sm text-slate-300">
          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-emerald-400/15 text-emerald-300">
            <Cpu className="h-4 w-4" />
          </span>
          <span>{t('billing.localNote')}</span>
        </div>
      </div>
    )
  }

  return (
    <div>
      <div className="mb-6">
        <div className="flex items-center gap-2">
          <h1 className="font-display text-2xl font-bold sm:text-3xl">{t('billing.title')}</h1>
          <Badge tone="amber">{t('common.inDev')}</Badge>
        </div>
        <p className="mt-2 max-w-2xl text-sm text-slate-400">{t('billing.subtitle')}</p>
      </div>

      {/* Balance */}
      <div className="mb-6 flex items-center gap-3 rounded-xl border border-white/10 bg-white/[0.02] px-4 py-3">
        <span className="grid h-9 w-9 place-items-center rounded-lg bg-brand-cyan/10 text-brand-cyan">
          <Wallet className="h-4 w-4" />
        </span>
        <div>
          <div className="text-xs text-slate-500">{t('billing.balanceLabel')}</div>
          <div className="font-display text-sm text-slate-300">{t('billing.balanceValue')}</div>
        </div>
      </div>

      <motion.div
        variants={staggerContainer}
        initial="hidden"
        animate="show"
        className="grid grid-cols-1 gap-5 md:grid-cols-3"
      >
        {PACKS.map((pack) => (
          <PackCard key={pack.id} pack={pack} />
        ))}
      </motion.div>

      <CostBreakdown />
    </div>
  )
}

function PackCard({ pack }: { pack: CreditPack }) {
  const { t, loc } = useI18n()
  return (
    <motion.div
      variants={fadeUp}
      className={cn(
        'flex flex-col rounded-2xl border p-5 backdrop-blur-xl',
        pack.popular ? 'border-brand-cyan/40 bg-brand-cyan/[0.04]' : 'border-white/10 bg-surface/60',
      )}
    >
      <div className="flex items-center gap-2">
        <span className="grid h-9 w-9 place-items-center rounded-xl bg-brand-cyan/10 text-brand-cyan">
          <Coins className="h-4 w-4" />
        </span>
        <h2 className="font-display text-lg font-semibold text-white">{pack.title}</h2>
        {pack.popular && (
          <Badge tone="cyan" className="ml-auto">
            <Sparkles className="h-3 w-3" /> {t('billing.popular')}
          </Badge>
        )}
      </div>

      <div className="mt-4 font-display text-xl font-bold text-brand-cyan">{loc(pack.credits)}</div>
      <div className="mt-1 text-xs text-slate-500">{loc(pack.audience)}</div>

      <ul className="mt-4 flex flex-1 flex-col gap-2 text-sm text-slate-300">
        {pack.benefits.map((b, i) => (
          <Feature key={i}>{loc(b)}</Feature>
        ))}
      </ul>

      <p className="mt-3 rounded-lg bg-ink/50 px-3 py-2 text-xs text-slate-400 ring-1 ring-white/5">
        {loc(pack.example)}
      </p>

      <Button disabled className="mt-4 w-full" icon={<Coins className="h-4 w-4" />}>
        {loc(pack.cta)} · {t('common.soon')}
      </Button>
    </motion.div>
  )
}

function CostBreakdown() {
  const { t, loc } = useI18n()
  return (
    <div className="mt-8 rounded-2xl border border-white/10 bg-white/[0.02] p-5">
      <h3 className="font-display text-base font-semibold text-white">{t('billing.costTitle')}</h3>
      <p className="mt-1 text-xs text-slate-500">{t('billing.costSubtitle')}</p>
      <ul className="mt-4 flex flex-col divide-y divide-white/5">
        {COSTS.map(({ icon: Icon, action, cost }) => (
          <li key={action.en} className="flex items-center gap-3 py-2.5">
            <span className="grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-brand-cyan/10 text-brand-cyan">
              <Icon className="h-3.5 w-3.5" />
            </span>
            <span className="flex-1 text-sm text-slate-300">{loc(action)}</span>
            <span className="font-mono text-xs text-brand-100">{loc(cost)}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}

function Feature({ children }: { children: React.ReactNode }) {
  return (
    <li className="flex items-start gap-2">
      <Check className="mt-0.5 h-4 w-4 shrink-0 text-brand-cyan" />
      <span>{children}</span>
    </li>
  )
}
