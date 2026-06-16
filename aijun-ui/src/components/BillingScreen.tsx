import { motion } from 'framer-motion'
import { Check, Coins, Cpu, Sparkles, Wallet } from 'lucide-react'
import { ACTIVE_PLAN } from '@/config/plan'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { fadeUp, staggerContainer } from '@/lib/motion'
import { cn } from '@/lib/cn'

interface TokenPack {
  id: string
  title: string
  tokens: string
  note: string
  popular?: boolean
}

// Placeholder packages. Real pricing + checkout arrive with the billing backend (Phase 2);
// purchases will go through our service (Groq capacity behind the scenes), not an external link.
const PACKS: TokenPack[] = [
  { id: 'starter', title: 'Starter', tokens: '500K токенов', note: 'для разовых задач' },
  { id: 'standard', title: 'Standard', tokens: '2M токенов', note: 'оптимально для команды', popular: true },
  { id: 'pro', title: 'Pro', tokens: '10M токенов', note: 'для интенсивной работы' },
]

/** In-app token purchase screen (placeholder). Replaces the external Groq billing link. */
export function BillingScreen() {
  // Local models have nothing to buy — never show packages/payment.
  if (!ACTIVE_PLAN.billable) {
    return (
      <div className="max-w-xl">
        <h1 className="font-display text-2xl font-bold sm:text-3xl">Покупка токенов</h1>
        <div className="mt-6 flex items-center gap-3 rounded-xl border border-emerald-400/30 bg-emerald-400/[0.04] px-4 py-4 text-sm text-slate-300">
          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-emerald-400/15 text-emerald-300">
            <Cpu className="h-4 w-4" />
          </span>
          <span>
            Вы используете локальную модель — токены покупать не нужно, оплата не взимается.
          </span>
        </div>
      </div>
    )
  }

  return (
    <div>
      <div className="mb-6">
        <div className="flex items-center gap-2">
          <h1 className="font-display text-2xl font-bold sm:text-3xl">Покупка токенов</h1>
          <Badge tone="amber">в разработке</Badge>
        </div>
        <p className="mt-2 max-w-2xl text-sm text-slate-400">
          Токены расходуются на генерацию. Пополнение баланса будет происходить прямо здесь, через
          наш сервис — отдельный аккаунт у провайдера не нужен.
        </p>
      </div>

      {/* Balance placeholder */}
      <div className="mb-6 flex items-center gap-3 rounded-xl border border-white/10 bg-white/[0.02] px-4 py-3">
        <span className="grid h-9 w-9 place-items-center rounded-lg bg-brand-cyan/10 text-brand-cyan">
          <Wallet className="h-4 w-4" />
        </span>
        <div>
          <div className="text-xs text-slate-500">Текущий баланс</div>
          <div className="font-display text-sm text-slate-300">появится после интеграции биллинга</div>
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

      <p className="mt-6 max-w-2xl text-xs text-slate-500">
        Дальше: интеграция платёжного провайдера, учёт баланса и списание токенов на стороне
        бэкенда. Все покупки будут совершаться через наш сервис.
      </p>
    </div>
  )
}

function PackCard({ pack }: { pack: TokenPack }) {
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
            <Sparkles className="h-3 w-3" /> популярный
          </Badge>
        )}
      </div>

      <div className="mt-4 font-display text-xl font-bold text-brand-cyan">{pack.tokens}</div>
      <div className="mt-1 text-xs text-slate-500">{pack.note}</div>

      <ul className="mt-4 flex flex-1 flex-col gap-2 text-sm text-slate-300">
        <Feature>Списываются по мере генерации</Feature>
        <Feature>Без срока сгорания</Feature>
      </ul>

      <Button disabled className="mt-5 w-full" icon={<Coins className="h-4 w-4" />}>
        Оформить (скоро)
      </Button>
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
