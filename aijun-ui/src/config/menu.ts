import type { LucideIcon } from 'lucide-react'
import {
  Bug,
  Calculator,
  ClipboardList,
  Code2,
  FileCheck2,
  FileText,
  LayoutGrid,
  ListChecks,
  MessageSquareCode,
  Network,
  ShieldAlert,
  Target,
} from 'lucide-react'

/** A tool the user can open. `view` is the route key handled by App; undefined = not built yet. */
export interface MenuTool {
  id: string
  label: string
  description: string
  icon: LucideIcon
  available: boolean
  /** View key opened on click (only when available). */
  view?: 'test-cases' | 'requirements-analysis'
}

export interface MenuCategory {
  id: string
  label: string
  description: string
  icon: LucideIcon
  available: boolean
  tools?: MenuTool[]
}

/**
 * AI JUN V2 main menu (v0.3 structure). Each tool maps to an agent. Working today:
 * «Написание документации» → «Анализ требований» and «Генерация тест-кейсов».
 * Everything else is on the roadmap.
 */
export const MENU: MenuCategory[] = [
  {
    id: 'processes',
    label: 'Построение процессов',
    description: 'Стратегия, планирование и оценка тестирования',
    icon: Network,
    available: false,
    tools: [
      {
        id: 'test-strategy',
        label: 'Тест-стратегия для проекта',
        description: 'Стратегия тестирования под проект',
        icon: Target,
        available: false,
      },
      {
        id: 'test-plan',
        label: 'Тест-план',
        description: 'Генерация по шаблону IEEE 829 / ISO 29119',
        icon: ClipboardList,
        available: false,
      },
      {
        id: 'coverage-matrix',
        label: 'Матрица покрытия требований',
        description: 'Трассируемость требований и тестов',
        icon: LayoutGrid,
        available: false,
      },
      {
        id: 'effort-estimation',
        label: 'Оценка трудозатрат на тестирование',
        description: 'Оценка объёма и сроков',
        icon: Calculator,
        available: false,
      },
    ],
  },
  {
    id: 'documentation',
    label: 'Написание документации',
    description: 'Анализ требований и генерация QA-документации',
    icon: FileText,
    available: true,
    tools: [
      {
        id: 'requirements-analysis',
        label: 'Анализ требований',
        description: 'Полнота, противоречия, неоднозначности, риски',
        icon: ShieldAlert,
        available: true,
        view: 'requirements-analysis',
      },
      {
        id: 'test-cases',
        label: 'Генерация тест-кейсов',
        description: 'Структурированные тест-кейсы по требованиям',
        icon: FileCheck2,
        available: true,
        view: 'test-cases',
      },
      {
        id: 'checklists',
        label: 'Генерация чек-листов',
        description: 'Краткие проверочные списки',
        icon: ListChecks,
        available: false,
      },
      {
        id: 'bug-reports',
        label: 'Генерация баг-репортов',
        description: 'Оформление дефектов по шаблону',
        icon: Bug,
        available: false,
      },
    ],
  },
  {
    id: 'engineering',
    label: 'Инжиниринг',
    description: 'Чат-ассистент общего назначения',
    icon: MessageSquareCode,
    available: false,
  },
  {
    id: 'coding',
    label: 'Коддинг',
    description: 'Работа с кодом',
    icon: Code2,
    available: false,
  },
]
