import { motion } from 'framer-motion'
import { Check, Clock, Coins, Cpu, Crown, ShieldCheck, Zap } from 'lucide-react'
import { ACTIVE_PLAN, PLANS, type PlanConfig } from '@/config/plan'
import { useRateLimit } from '@/lib/rateLimit'
import { useNavigate } from '@/lib/navigation'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { fadeUp, staggerContainer } from '@/lib/motion'
import { cn } from '@/lib/cn'

const ORDER: PlanConfig[] = [PLANS.free, PLANS.pro]

/** "Тариф / Лимиты" screen: current plan, free↔pro comparison, live limit status, upgrade link.
 * For a local model there are no limits or billing — a single reassuring card is shown instead. */
export function PlanScreen() {
  const { isLimited, remainingMs, exact, rateLimited } = useRateLimit()

  if (ACTIVE_PLAN.id === 'local') {
    return <LocalPlanInfo />
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="font-display text-2xl font-bold sm:text-3xl">Тариф и лимиты</h1>
        <p className="mt-2 text-sm text-slate-400">
          Лимиты задаёт LLM-провайдер (Groq) на стороне аккаунта. Текущий тариф приложения —{' '}
          <span className="text-brand-100">{ACTIVE_PLAN.label}</span>.
        </p>
      </div>

      {/* Live limit status */}
      {isLimited && (
        <div className="mb-6 flex flex-wrap items-center gap-2 rounded-xl border border-amber-400/30 bg-amber-400/10 px-4 py-3 text-sm text-amber-200">
          <Clock className="h-4 w-4" />
          {rateLimited ? 'Лимит исчерпан.' : 'Сервис временно недоступен.'}{' '}
          {exact ? 'Доступно через' : 'Повтор через'} {formatDuration(remainingMs)}
          {rateLimited && !exact && ' (оценка)'}
        </div>
      )}

      <motion.div
        variants={staggerContainer}
        initial="hidden"
        animate="show"
        className="grid grid-cols-1 gap-5 md:grid-cols-2"
      >
        {ORDER.map((plan) => (
          <PlanCard key={plan.id} plan={plan} active={plan.id === ACTIVE_PLAN.id} />
        ))}
      </motion.div>

      <p className="mt-6 text-xs text-slate-500">
        Остаток токенов и точное время сброса появятся здесь в Phase 2, когда бэкенд начнёт
        пробрасывать заголовки лимитов провайдера. Сейчас при исчерпании лимита время сброса
        показывается из ответа об ошибке.
      </p>
    </div>
  )
}

/** Shown when the app runs against a self-hosted model — no limits, no payment. */
function LocalPlanInfo() {
  return (
    <div>
      <div className="mb-8">
        <h1 className="font-display text-2xl font-bold sm:text-3xl">Локальная модель</h1>
        <p className="mt-2 text-sm text-slate-400">
          Приложение работает на самостоятельно развёрнутой модели. Оплата и лимиты токенов не
          применяются.
        </p>
      </div>

      <motion.div
        variants={fadeUp}
        initial="hidden"
        animate="show"
        className="max-w-xl rounded-2xl border border-emerald-400/30 bg-emerald-400/[0.04] p-5"
      >
        <div className="flex items-center gap-2">
          <span className="grid h-9 w-9 place-items-center rounded-xl bg-emerald-400/15 text-emerald-300">
            <Cpu className="h-4 w-4" />
          </span>
          <h2 className="font-display text-lg font-semibold text-white">Local model</h2>
          <Badge tone="emerald" className="ml-auto">текущий режим</Badge>
        </div>

        <ul className="mt-4 flex flex-col gap-2 text-sm text-slate-300">
          <Feature>Без оплаты и покупки токенов</Feature>
          <Feature>Без дневных лимитов провайдера</Feature>
          <Feature>
            <span className="inline-flex items-center gap-1.5">
              <ShieldCheck className="h-4 w-4 text-emerald-300" /> Данные не уходят во внешний облачный сервис
            </span>
          </Feature>
        </ul>
      </motion.div>
    </div>
  )
}

function PlanCard({ plan, active }: { plan: PlanConfig; active: boolean }) {
  const isPro = plan.id === 'pro'
  const navigate = useNavigate()
  return (
    <motion.div
      variants={fadeUp}
      className={cn(
        'rounded-2xl border p-5 backdrop-blur-xl',
        active
          ? 'border-brand-cyan/40 bg-brand-cyan/[0.04] shadow-[0_20px_60px_-30px_rgba(0,229,255,0.5)]'
          : 'border-white/10 bg-surface/60',
      )}
    >
      <div className="flex items-center gap-2">
        <span
          className={cn(
            'grid h-9 w-9 place-items-center rounded-xl',
            isPro ? 'bg-amber-400/15 text-amber-300' : 'bg-brand-cyan/10 text-brand-cyan',
          )}
        >
          {isPro ? <Crown className="h-4 w-4" /> : <Zap className="h-4 w-4" />}
        </span>
        <h2 className="font-display text-lg font-semibold text-white">{plan.label}</h2>
        {active && <Badge tone="cyan" className="ml-auto">текущий</Badge>}
      </div>

      <ul className="mt-4 flex flex-col gap-2 text-sm text-slate-300">
        <Feature>
          {plan.dailyTokenLimit
            ? `Дневной лимит токенов: ${plan.dailyTokenLimit.toLocaleString('ru-RU')}`
            : 'Без жёсткого дневного лимита токенов'}
        </Feature>
        <Feature>
          {plan.dailyTokenLimit
            ? 'При исчерпании — пауза до сброса лимита провайдера'
            : 'Кулдаун только как защита от частых запросов'}
        </Feature>
        <Feature>
          {isPro ? 'Приоритетная пропускная способность провайдера' : 'Базовая пропускная способность'}
        </Feature>
      </ul>

      {isPro && !active && (
        <Button
          onClick={() => navigate('billing')}
          icon={<Coins className="h-4 w-4" />}
          className="mt-5 w-full"
        >
          Купить токены
        </Button>
      )}
      {!isPro && active && (
        <Button
          variant="outline"
          onClick={() => navigate('billing')}
          icon={<Coins className="h-4 w-4" />}
          className="mt-5 w-full"
        >
          Пополнить баланс токенов
        </Button>
      )}
    </motion.div>
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

/** "2:05" / "1ч 03м" */
function formatDuration(ms: number): string {
  const total = Math.ceil(ms / 1000)
  const h = Math.floor(total / 3600)
  const m = Math.floor((total % 3600) / 60)
  const s = total % 60
  if (h > 0) return `${h}ч ${String(m).padStart(2, '0')}м`
  return `${m}:${String(s).padStart(2, '0')}`
}
