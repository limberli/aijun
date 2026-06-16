import { useRef, type ReactNode } from 'react'
import { Clock, Coins, FileText, Loader2, RotateCcw, Sparkles, Upload, Zap } from 'lucide-react'
import { Panel } from '@/components/ui/Panel'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { useRateLimit } from '@/lib/rateLimit'
import { useNavigate } from '@/lib/navigation'
import { ACTIVE_PLAN } from '@/config/plan'

interface RequirementsPanelProps {
  documentText: string
  onDocumentTextChange: (text: string) => void
  filename: string | null
  uploading: boolean
  onUpload: (file: File) => void
  loading: boolean
  onGenerate: () => void
  onCancel: () => void
  generateLabel: string
  /** Optional settings block rendered between the requirements field and the action button. */
  settings?: ReactNode
}

/** Shared left column: requirements text + .docx upload + optional settings slot + action button. */
export function RequirementsPanel(props: RequirementsPanelProps) {
  const {
    documentText,
    onDocumentTextChange,
    filename,
    uploading,
    onUpload,
    loading,
    onGenerate,
    onCancel,
    generateLabel,
    settings,
  } = props

  const fileInput = useRef<HTMLInputElement>(null)
  const rateLimit = useRateLimit()

  return (
    <div className="flex flex-col gap-4">
      <Panel
        icon={<FileText className="h-4 w-4" />}
        title="Требования"
        action={
          <button
            type="button"
            disabled={uploading}
            onClick={() => fileInput.current?.click()}
            className="inline-flex items-center gap-1.5 rounded-md border border-white/10 bg-white/[0.03] px-2.5 py-1 text-[0.7rem] text-slate-300 transition hover:border-brand-cyan/30 hover:text-brand-cyan disabled:opacity-50"
          >
            {uploading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Upload className="h-3.5 w-3.5" />}
            Загрузить .docx
          </button>
        }
      >
        <input
          ref={fileInput}
          type="file"
          accept=".docx"
          hidden
          onChange={(e) => {
            const file = e.target.files?.[0]
            if (file) onUpload(file)
            e.target.value = ''
          }}
        />

        {filename && (
          <div className="mb-2">
            <Badge tone="cyan">
              <Sparkles className="h-3 w-3" /> {filename}
            </Badge>
          </div>
        )}

        <textarea
          value={documentText}
          onChange={(e) => onDocumentTextChange(e.target.value)}
          placeholder="Вставьте требования или загрузите документ…"
          rows={12}
          className="w-full resize-y rounded-lg border border-white/10 bg-ink/60 px-3 py-2.5 font-mono text-xs leading-relaxed text-slate-200 outline-none placeholder:text-slate-600 focus:border-brand-cyan/40"
        />
      </Panel>

      {settings}

      {rateLimit.isLimited && <RateLimitNotice />}

      {loading ? (
        <Button variant="outline" onClick={onCancel} icon={<Loader2 className="h-4 w-4 animate-spin" />}>
          Генерация… Отменить
        </Button>
      ) : (
        <Button
          onClick={onGenerate}
          disabled={!documentText.trim() || rateLimit.isLimited}
          icon={<Sparkles className="h-4 w-4" />}
        >
          {rateLimit.isLimited ? 'Лимит исчерпан' : generateLabel}
        </Button>
      )}
    </div>
  )
}

/** Banner shown near the action button while generation is blocked (rate limit or agent outage). */
function RateLimitNotice() {
  const { remainingMs, exact, rateLimited, clear } = useRateLimit()
  const navigate = useNavigate()

  return (
    <div className="rounded-lg border border-amber-400/30 bg-amber-400/10 px-3 py-2.5 text-xs text-amber-200">
      <div className="flex items-center gap-2 font-medium">
        <Zap className="h-3.5 w-3.5" />
        {rateLimited ? `Исчерпан лимит тарифа ${ACTIVE_PLAN.label}` : 'Сервис временно недоступен'}
      </div>
      <div className="mt-1 flex items-center gap-1.5 text-amber-200/80">
        <Clock className="h-3.5 w-3.5" />
        {exact ? (
          <span>Доступно через {formatDuration(remainingMs)}</span>
        ) : (
          <span>
            {rateLimited ? 'Ориентировочно' : 'Повторить можно'} через {formatDuration(remainingMs)}
            {rateLimited && ' (точное время сброса недоступно)'}
          </span>
        )}
      </div>
      <div className="mt-2 flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={clear}
          className="inline-flex items-center gap-1 text-amber-100 underline-offset-2 hover:underline"
        >
          <RotateCcw className="h-3 w-3" /> Повторить сейчас
        </button>
        {rateLimited && ACTIVE_PLAN.billable && (
          <button
            type="button"
            onClick={() => navigate('billing')}
            className="inline-flex items-center gap-1 text-amber-100 underline-offset-2 hover:underline"
          >
            <Coins className="h-3 w-3" /> Купить токены
          </button>
        )}
      </div>
    </div>
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
