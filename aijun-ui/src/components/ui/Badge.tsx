import type { ReactNode } from 'react'
import { cn } from '@/lib/cn'

type Tone = 'cyan' | 'emerald' | 'amber' | 'rose' | 'slate'

const TONES: Record<Tone, string> = {
  cyan: 'text-brand-100 bg-brand-cyan/10 border-brand-cyan/30',
  emerald: 'text-emerald-300 bg-emerald-400/10 border-emerald-400/30',
  amber: 'text-amber-300 bg-amber-400/15 border-amber-400/30',
  rose: 'text-rose-300 bg-rose-500/15 border-rose-500/30',
  slate: 'text-slate-300 bg-white/[0.04] border-white/10',
}

interface BadgeProps {
  tone?: Tone
  className?: string
  children: ReactNode
}

export function Badge({ tone = 'slate', className, children }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[0.65rem] font-medium',
        TONES[tone],
        className,
      )}
    >
      {children}
    </span>
  )
}
