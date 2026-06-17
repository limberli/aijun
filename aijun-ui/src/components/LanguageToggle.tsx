import { useI18n, type Lang } from '@/lib/i18n'
import { cn } from '@/lib/cn'

const LANGS: Lang[] = ['ru', 'en']

/** Compact RU/EN segmented switch for the header. */
export function LanguageToggle() {
  const { lang, setLang } = useI18n()
  return (
    <div className="inline-flex items-center rounded-full border border-white/10 bg-white/[0.04] p-0.5 text-[0.65rem] font-medium">
      {LANGS.map((l) => (
        <button
          key={l}
          type="button"
          onClick={() => setLang(l)}
          className={cn(
            'rounded-full px-2 py-0.5 uppercase transition',
            lang === l ? 'bg-brand-cyan/15 text-brand-100' : 'text-slate-400 hover:text-slate-200',
          )}
        >
          {l}
        </button>
      ))}
    </div>
  )
}
