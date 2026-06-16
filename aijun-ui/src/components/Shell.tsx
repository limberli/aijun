import type { ReactNode } from 'react'
import { Cpu } from 'lucide-react'

interface ShellProps {
  /** Optional left slot in the header (e.g. a back button). */
  lead?: ReactNode
  /** Optional right-aligned slot in the header (e.g. the plan badge). */
  headerActions?: ReactNode
  children: ReactNode
}

/** App frame: ambient background + top bar. Shared by the menu and the workbench. */
export function Shell({ lead, headerActions, children }: ShellProps) {
  return (
    <div className="relative min-h-screen overflow-x-hidden">
      {/* Ambient brand glow */}
      <div className="pointer-events-none fixed inset-0 -z-10">
        <div className="absolute left-1/2 top-[-10%] h-[40rem] w-[40rem] -translate-x-1/2 rounded-full bg-brand-blue/10 blur-[120px]" />
        <div className="absolute right-[-10%] bottom-[-10%] h-[30rem] w-[30rem] rounded-full bg-brand-cyan/5 blur-[120px]" />
      </div>

      <header className="sticky top-0 z-20 border-b border-white/10 bg-ink/70 backdrop-blur-xl">
        <div className="mx-auto flex max-w-6xl items-center gap-3 px-4 py-3 sm:px-6">
          {lead}
          <div className="flex items-center gap-2">
            <span className="grid h-8 w-8 place-items-center rounded-lg bg-brand-cyan/10 text-brand-cyan">
              <Cpu className="h-4 w-4" />
            </span>
            <span className="font-display text-lg font-bold tracking-tight">
              AI <span className="text-brand-cyan">JUN</span>
            </span>
          </div>
          <span className="ml-2 hidden rounded-full border border-white/10 bg-white/[0.04] px-2.5 py-0.5 text-[0.65rem] font-medium text-slate-400 sm:inline">
            V2 · Workbench
          </span>
          {headerActions && <div className="ml-auto">{headerActions}</div>}
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6">{children}</main>
    </div>
  )
}
