import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react'

export type Lang = 'ru' | 'en'

/** Inline bilingual value for data arrays (menu items, credit packs, …). */
export interface LocPair {
  ru: string
  en: string
}

const STORAGE_KEY = 'aijun.lang'

function initialLang(): Lang {
  const saved = typeof localStorage !== 'undefined' ? localStorage.getItem(STORAGE_KEY) : null
  if (saved === 'ru' || saved === 'en') return saved
  // Fall back to the browser language, default ru.
  const nav = typeof navigator !== 'undefined' ? navigator.language.toLowerCase() : 'ru'
  return nav.startsWith('en') ? 'en' : 'ru'
}

// ── UI chrome strings. Data arrays (menu/packs/costs) carry their own {ru,en} pairs. ──────────
const DICT: Record<Lang, Record<string, string>> = {
  ru: {
    'header.badge': 'V2 · Workbench',
    'nav.menu': 'Меню',
    'plan.badgePrefix': 'Тариф:',
    'common.inDev': 'в разработке',
    'common.soon': 'скоро',

    'menu.title': 'Выберите, над чем будете работать',
    'menu.subtitle': 'AIJUN — инструмент QA-инженера. Часть модулей в разработке.',

    'req.title': 'Требования',
    'req.upload': 'Загрузить .docx',
    'req.placeholder': 'Вставьте требования или загрузите документ…',
    'req.settings': 'Настройки генерации',

    // Generation-settings controls/options (keyed by backend id; fall back to backend label).
    'settings.control.caseTypes': 'Тип тест-кейса',
    'settings.control.techniques': 'Техника тест-дизайна',
    'settings.control.stepDetail': 'Детализация шагов',
    'settings.option.ui': 'UI',
    'settings.option.api': 'API',
    'settings.option.db': 'БД',
    'settings.option.combined': 'Комбинированный',
    'settings.option.equivalence': 'Эквивалентное разбиение',
    'settings.option.boundary': 'Граничные значения',
    'settings.option.decision-table': 'Таблица решений',
    'settings.option.pairwise': 'Pairwise',
    'settings.option.state-transition': 'Переходы состояний',
    'settings.option.positive-negative': 'Позитив/негатив',
    'settings.option.short': 'Короткая (3–5)',
    'settings.option.medium': 'Средняя (6–10)',
    'settings.option.detailed': 'Подробная (10+)',

    'btn.generateTests': 'Сгенерировать тест-кейсы',
    'btn.analyze': 'Проанализировать требования',
    'btn.generatingCancel': 'Генерация… Отменить',
    'btn.limited': 'Лимит исчерпан',

    'rl.limitReached': 'Исчерпан лимит тарифа {plan}',
    'rl.unavailable': 'Сервис временно недоступен',
    'rl.availableIn': 'Доступно через',
    'rl.retryIn': 'Повторить можно через',
    'rl.estimateNote': ' (точное время сброса недоступно)',
    'rl.retryNow': 'Повторить сейчас',
    'rl.topUp': 'Пополнить баланс',

    'results.title': 'Сгенерированные тест-кейсы',
    'results.parseFail': 'Не удалось разобрать таблицу — показан исходный ответ',
    'results.loading': 'Генерация тест-кейсов…',
    'results.loadingHint': 'Локальная модель может думать несколько минут',
    'results.empty': 'Введите требования и нажмите «Сгенерировать»',

    'tc.edge': 'граничный',
    'tc.copy': 'Копировать',
    'tc.copied': 'Скопировано',
    'tc.untitled': 'Без названия',
    'tc.colStep': 'Шаг',
    'tc.colExpected': 'Ожидаемый результат',
    'tc.technique': 'Техника',

    'stats.casesPerRun': 'кейсов за прогон',
    'stats.risks': 'рисков',
    'stats.edgeTechniques': 'Граничные случаи и техники:',
    'stats.techniques': 'Применённые техники:',

    'ar.title': 'Анализ требований',
    'ar.risksCount': 'рисков:',
    'ar.parseFail': 'Не удалось разобрать отчёт — показан исходный ответ',
    'ar.foundRisks': 'Выявленные риски',
    'ar.loading': 'Анализ требований…',
    'ar.empty': 'Введите требования и нажмите «Проанализировать»',
    'risk.high': 'высокий',
    'risk.medium': 'средний',
    'risk.low': 'низкий',
    'report.completeness': 'Полнота требований',
    'report.contradictions': 'Противоречия',
    'report.ambiguity': 'Неоднозначности',
    'report.risk-matrix': 'Матрица рисков',
    'report.testability': 'Тестопригодность',
    'report.recommendations': 'Рекомендации',

    'plan.title': 'Тариф и лимиты',
    'plan.subtitle': 'Лимиты задаёт LLM-провайдер (Groq) на стороне аккаунта. Текущий тариф приложения — {plan}.',
    'plan.limitReached': 'Лимит исчерпан.',
    'plan.unavailable': 'Сервис временно недоступен.',
    'plan.availableIn': 'Доступно через',
    'plan.retryIn': 'Повтор через',
    'plan.estimate': ' (оценка)',
    'plan.current': 'текущий',
    'plan.card.limited': 'Ограниченный дневной объём (бесплатный тариф)',
    'plan.card.unlimited': 'Без жёсткого дневного лимита',
    'plan.card.pauseOnLimit': 'При исчерпании — пауза до сброса лимита провайдера',
    'plan.card.cooldownOnly': 'Кулдаун только как защита от частых запросов',
    'plan.card.priority': 'Приоритетная пропускная способность провайдера',
    'plan.card.basic': 'Базовая пропускная способность',
    'plan.buyCredits': 'Купить кредиты',
    'plan.topUp': 'Пополнить баланс',
    'plan.phase2': 'Остаток кредитов и точное время сброса появятся здесь в Phase 2, когда бэкенд начнёт пробрасывать заголовки лимитов провайдера. Сейчас при исчерпании лимита время сброса показывается из ответа об ошибке.',
    'plan.localTitle': 'Локальная модель',
    'plan.localSubtitle': 'Приложение работает на самостоятельно развёрнутой модели. Оплата и лимиты не применяются.',
    'plan.localMode': 'текущий режим',
    'plan.local.f1': 'Без оплаты и покупки кредитов',
    'plan.local.f2': 'Без дневных лимитов провайдера',
    'plan.local.f3': 'Данные не уходят во внешний облачный сервис',

    'billing.localTitle': 'Кредиты',
    'billing.localNote': 'Вы используете локальную модель — кредиты и оплата не нужны.',
    'billing.title': 'Пополнить баланс',
    'billing.subtitle': 'Кредиты — единая валюта AIJUN. Тратятся на анализ требований, генерацию тест-кейсов, чек-листов и документов. Платите за результат, а не за работу модели.',
    'billing.balanceLabel': 'Текущий баланс',
    'billing.balanceValue': 'появится после подключения биллинга',
    'billing.popular': 'популярный',
    'billing.costTitle': 'Как расходуются кредиты?',
    'billing.costSubtitle': 'Кредиты списываются за готовый артефакт, а не за объём работы модели.',
  },
  en: {
    'header.badge': 'V2 · Workbench',
    'nav.menu': 'Menu',
    'plan.badgePrefix': 'Plan:',
    'common.inDev': 'in development',
    'common.soon': 'soon',

    'menu.title': "Choose what you'll work on",
    'menu.subtitle': 'AIJUN is a QA engineer’s tool. Some modules are still in development.',

    'req.title': 'Requirements',
    'req.upload': 'Upload .docx',
    'req.placeholder': 'Paste requirements or upload a document…',
    'req.settings': 'Generation settings',

    'settings.control.caseTypes': 'Test case type',
    'settings.control.techniques': 'Test design technique',
    'settings.control.stepDetail': 'Step detail',
    'settings.option.ui': 'UI',
    'settings.option.api': 'API',
    'settings.option.db': 'DB',
    'settings.option.combined': 'Combined',
    'settings.option.equivalence': 'Equivalence partitioning',
    'settings.option.boundary': 'Boundary values',
    'settings.option.decision-table': 'Decision table',
    'settings.option.pairwise': 'Pairwise',
    'settings.option.state-transition': 'State transitions',
    'settings.option.positive-negative': 'Positive/negative',
    'settings.option.short': 'Short (3–5)',
    'settings.option.medium': 'Medium (6–10)',
    'settings.option.detailed': 'Detailed (10+)',

    'btn.generateTests': 'Generate test cases',
    'btn.analyze': 'Analyze requirements',
    'btn.generatingCancel': 'Generating… Cancel',
    'btn.limited': 'Limit reached',

    'rl.limitReached': '{plan} plan limit reached',
    'rl.unavailable': 'Service temporarily unavailable',
    'rl.availableIn': 'Available in',
    'rl.retryIn': 'Retry in',
    'rl.estimateNote': ' (exact reset time unknown)',
    'rl.retryNow': 'Retry now',
    'rl.topUp': 'Top up balance',

    'results.title': 'Generated test cases',
    'results.parseFail': 'Couldn’t parse the table — showing raw output',
    'results.loading': 'Generating test cases…',
    'results.loadingHint': 'A local model may take a few minutes',
    'results.empty': 'Enter requirements and click Generate',

    'tc.edge': 'edge',
    'tc.copy': 'Copy',
    'tc.copied': 'Copied',
    'tc.untitled': 'Untitled',
    'tc.colStep': 'Step',
    'tc.colExpected': 'Expected result',
    'tc.technique': 'Technique',

    'stats.casesPerRun': 'cases per run',
    'stats.risks': 'risks',
    'stats.edgeTechniques': 'Edge cases & techniques:',
    'stats.techniques': 'Applied techniques:',

    'ar.title': 'Requirements analysis',
    'ar.risksCount': 'risks:',
    'ar.parseFail': 'Couldn’t parse the report — showing raw output',
    'ar.foundRisks': 'Identified risks',
    'ar.loading': 'Analyzing requirements…',
    'ar.empty': 'Enter requirements and click Analyze',
    'risk.high': 'high',
    'risk.medium': 'medium',
    'risk.low': 'low',
    'report.completeness': 'Completeness',
    'report.contradictions': 'Contradictions',
    'report.ambiguity': 'Ambiguities',
    'report.risk-matrix': 'Risk matrix',
    'report.testability': 'Testability',
    'report.recommendations': 'Recommendations',

    'plan.title': 'Plan & limits',
    'plan.subtitle': 'Limits are set by the LLM provider (Groq) on the account side. Current app plan — {plan}.',
    'plan.limitReached': 'Limit reached.',
    'plan.unavailable': 'Service temporarily unavailable.',
    'plan.availableIn': 'Available in',
    'plan.retryIn': 'Retry in',
    'plan.estimate': ' (estimate)',
    'plan.current': 'current',
    'plan.card.limited': 'Limited daily volume (free tier)',
    'plan.card.unlimited': 'No hard daily limit',
    'plan.card.pauseOnLimit': 'On limit — paused until the provider resets',
    'plan.card.cooldownOnly': 'Cooldown only, to prevent hammering',
    'plan.card.priority': 'Priority provider throughput',
    'plan.card.basic': 'Basic throughput',
    'plan.buyCredits': 'Buy credits',
    'plan.topUp': 'Top up balance',
    'plan.phase2': 'Credit balance and exact reset time will appear here in Phase 2, once the backend forwards the provider’s rate-limit headers. For now the reset time comes from the error response.',
    'plan.localTitle': 'Local model',
    'plan.localSubtitle': 'The app runs on a self-hosted model. No payment or limits apply.',
    'plan.localMode': 'current mode',
    'plan.local.f1': 'No payment or buying credits',
    'plan.local.f2': 'No provider daily limits',
    'plan.local.f3': 'Data never leaves for an external cloud',

    'billing.localTitle': 'Credits',
    'billing.localNote': 'You’re on a local model — no credits or payment needed.',
    'billing.title': 'Top up balance',
    'billing.subtitle': 'Credits are AIJUN’s single currency. Spent on requirements analysis, test-case, checklist and document generation. You pay for the result, not for model usage.',
    'billing.balanceLabel': 'Current balance',
    'billing.balanceValue': 'available after billing is connected',
    'billing.popular': 'popular',
    'billing.costTitle': 'How are credits spent?',
    'billing.costSubtitle': 'Credits are charged per finished artifact, not per model usage.',
  },
}

interface I18nValue {
  lang: Lang
  setLang: (l: Lang) => void
  /** Translate a chrome key; supports {var} interpolation. Falls back to the key if missing. */
  t: (key: string, vars?: Record<string, string>) => string
  /** Pick the active-language side of an inline bilingual value. */
  loc: (pair: LocPair) => string
}

const I18nContext = createContext<I18nValue | null>(null)

export function I18nProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>(initialLang)

  const setLang = useCallback((l: Lang) => {
    setLangState(l)
    try {
      localStorage.setItem(STORAGE_KEY, l)
    } catch {
      // ignore storage failures
    }
  }, [])

  const t = useCallback(
    (key: string, vars?: Record<string, string>): string => {
      let str = DICT[lang][key] ?? DICT.ru[key] ?? key
      if (vars) {
        for (const [k, v] of Object.entries(vars)) {
          str = str.replace(`{${k}}`, v)
        }
      }
      return str
    },
    [lang],
  )

  const loc = useCallback((pair: LocPair) => pair[lang], [lang])

  const value = useMemo<I18nValue>(() => ({ lang, setLang, t, loc }), [lang, setLang, t, loc])
  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>
}

export function useI18n(): I18nValue {
  const ctx = useContext(I18nContext)
  if (!ctx) throw new Error('useI18n must be used within I18nProvider')
  return ctx
}
