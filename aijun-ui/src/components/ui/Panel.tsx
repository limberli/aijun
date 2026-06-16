import type { ReactNode } from 'react'
import { cn } from '@/lib/cn'

interface PanelProps {
  icon?: ReactNode
  title?: string
  action?: ReactNode
  className?: string
  bodyClassName?: string
  children: ReactNode
}

/** Glass panel matching the AI JUN product surface. */
export function Panel({ icon, title, action, className, bodyClassName, children }: PanelProps) {
  return (
    <div
      className={cn(
        'rounded-xl border border-white/10 bg-white/[0.02] p-3.5 sm:p-4',
        className,
      )}
    >
      {(title || action) && (
        <div className="mb-3 flex items-center gap-2 text-slate-300">
          {icon && (
            <span className="grid h-7 w-7 place-items-center rounded-lg bg-brand-cyan/10 text-brand-cyan">
              {icon}
            </span>
          )}
          {title && <h3 className="text-sm font-semibold text-white">{title}</h3>}
          {action && <div className="ml-auto">{action}</div>}
        </div>
      )}
      <div className={bodyClassName}>{children}</div>
    </div>
  )
}
