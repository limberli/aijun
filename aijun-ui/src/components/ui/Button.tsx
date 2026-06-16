import type { ButtonHTMLAttributes, ReactNode } from 'react'
import { cn } from '@/lib/cn'

type Variant = 'primary' | 'ghost' | 'outline'

const VARIANTS: Record<Variant, string> = {
  primary:
    'bg-gradient-to-r from-brand-cyan to-brand-blue text-ink font-semibold shadow-[0_8px_30px_-8px_rgba(0,153,255,0.6)] hover:brightness-110',
  ghost: 'text-slate-300 hover:bg-white/[0.05]',
  outline: 'border border-white/15 text-slate-200 hover:bg-white/[0.04]',
}

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant
  icon?: ReactNode
}

export function Button({ variant = 'primary', icon, className, children, ...rest }: ButtonProps) {
  return (
    <button
      className={cn(
        'inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm transition',
        'disabled:cursor-not-allowed disabled:opacity-50',
        VARIANTS[variant],
        className,
      )}
      {...rest}
    >
      {icon}
      {children}
    </button>
  )
}
