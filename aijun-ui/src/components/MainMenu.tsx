import { motion } from 'framer-motion'
import { ArrowRight, Lock } from 'lucide-react'
import { MENU, type MenuCategory, type MenuTool } from '@/config/menu'
import { Badge } from '@/components/ui/Badge'
import { fadeUp, staggerContainer } from '@/lib/motion'
import { useI18n } from '@/lib/i18n'
import { cn } from '@/lib/cn'

interface MainMenuProps {
  onOpenTool: (view: NonNullable<MenuTool['view']>) => void
}

/** AI JUN V2 start screen: pick a domain, then a tool. Only built tools are clickable. */
export function MainMenu({ onOpenTool }: MainMenuProps) {
  const { t } = useI18n()
  return (
    <div>
      <div className="mb-10 text-center">
        <h1 className="font-display text-3xl font-bold sm:text-4xl">{t('menu.title')}</h1>
        <p className="mt-3 text-sm text-slate-400">{t('menu.subtitle')}</p>
      </div>

      <motion.div
        variants={staggerContainer}
        initial="hidden"
        animate="show"
        className="grid grid-cols-1 gap-5 md:grid-cols-2"
      >
        {MENU.map((category) => (
          <CategoryCard key={category.id} category={category} onOpenTool={onOpenTool} />
        ))}
      </motion.div>
    </div>
  )
}

function CategoryCard({
  category,
  onOpenTool,
}: {
  category: MenuCategory
  onOpenTool: MainMenuProps['onOpenTool']
}) {
  const { t, loc } = useI18n()
  const Icon = category.icon
  const hasTools = !!category.tools?.length

  return (
    <motion.div
      variants={fadeUp}
      className={cn(
        'rounded-2xl border border-white/10 bg-surface/60 p-5 backdrop-blur-xl',
        !category.available && !hasTools && 'opacity-60',
      )}
    >
      <div className="flex items-start gap-3">
        <span className="grid h-11 w-11 place-items-center rounded-xl bg-brand-cyan/10 text-brand-cyan">
          <Icon className="h-5 w-5" />
        </span>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h2 className="font-display text-lg font-semibold text-white">{loc(category.label)}</h2>
            {!category.available && !hasTools && (
              <Badge tone="slate">
                <Lock className="h-3 w-3" /> {t('common.inDev')}
              </Badge>
            )}
          </div>
          <p className="mt-1 text-xs text-slate-400">{loc(category.description)}</p>
        </div>
      </div>

      {hasTools && (
        <ul className="mt-4 flex flex-col gap-2">
          {category.tools!.map((tool) => (
            <ToolRow key={tool.id} tool={tool} onOpenTool={onOpenTool} />
          ))}
        </ul>
      )}
    </motion.div>
  )
}

function ToolRow({
  tool,
  onOpenTool,
}: {
  tool: MenuTool
  onOpenTool: MainMenuProps['onOpenTool']
}) {
  const { t, loc } = useI18n()
  const Icon = tool.icon
  const clickable = tool.available && tool.view

  return (
    <li>
      <button
        type="button"
        disabled={!clickable}
        onClick={() => clickable && onOpenTool(tool.view!)}
        className={cn(
          'group flex w-full items-center gap-3 rounded-lg border px-3 py-2.5 text-left transition',
          clickable
            ? 'border-white/5 bg-ink/50 ring-1 ring-white/5 hover:border-brand-cyan/30 hover:bg-brand-cyan/[0.04]'
            : 'cursor-not-allowed border-transparent bg-ink/30 opacity-55',
        )}
      >
        <Icon className="h-4 w-4 shrink-0 text-brand-cyan" />
        <span className="flex-1">
          <span className="block text-sm text-slate-100">{loc(tool.label)}</span>
          <span className="block text-[0.7rem] text-slate-500">{loc(tool.description)}</span>
        </span>
        {clickable ? (
          <ArrowRight className="h-4 w-4 text-slate-500 transition group-hover:translate-x-0.5 group-hover:text-brand-cyan" />
        ) : (
          <Badge tone="slate">
            <Lock className="h-3 w-3" /> {t('common.soon')}
          </Badge>
        )}
      </button>
    </li>
  )
}
