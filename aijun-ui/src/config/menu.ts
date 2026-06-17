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
import type { LocPair } from '@/lib/i18n'

/** A tool the user can open. `view` is the route key handled by App; undefined = not built yet. */
export interface MenuTool {
  id: string
  label: LocPair
  description: LocPair
  icon: LucideIcon
  available: boolean
  /** View key opened on click (only when available). */
  view?: 'test-cases' | 'requirements-analysis'
}

export interface MenuCategory {
  id: string
  label: LocPair
  description: LocPair
  icon: LucideIcon
  available: boolean
  tools?: MenuTool[]
}

/**
 * AI JUN V2 main menu (v0.3 structure). Each tool maps to an agent. Working today:
 * Documentation → Requirements analysis and Test-case generation. Everything else is on the roadmap.
 */
export const MENU: MenuCategory[] = [
  {
    id: 'processes',
    label: { ru: 'Построение процессов', en: 'Process building' },
    description: {
      ru: 'Стратегия, планирование и оценка тестирования',
      en: 'Test strategy, planning and estimation',
    },
    icon: Network,
    available: false,
    tools: [
      {
        id: 'test-strategy',
        label: { ru: 'Тест-стратегия для проекта', en: 'Project test strategy' },
        description: { ru: 'Стратегия тестирования под проект', en: 'Testing strategy for the project' },
        icon: Target,
        available: false,
      },
      {
        id: 'test-plan',
        label: { ru: 'Тест-план', en: 'Test plan' },
        description: {
          ru: 'Генерация по шаблону IEEE 829 / ISO 29119',
          en: 'Generated from IEEE 829 / ISO 29119 template',
        },
        icon: ClipboardList,
        available: false,
      },
      {
        id: 'coverage-matrix',
        label: { ru: 'Матрица покрытия требований', en: 'Requirements coverage matrix' },
        description: { ru: 'Трассируемость требований и тестов', en: 'Requirements-to-tests traceability' },
        icon: LayoutGrid,
        available: false,
      },
      {
        id: 'effort-estimation',
        label: { ru: 'Оценка трудозатрат на тестирование', en: 'Testing effort estimation' },
        description: { ru: 'Оценка объёма и сроков', en: 'Estimate scope and timelines' },
        icon: Calculator,
        available: false,
      },
    ],
  },
  {
    id: 'documentation',
    label: { ru: 'Написание документации', en: 'Documentation' },
    description: {
      ru: 'Анализ требований и генерация QA-документации',
      en: 'Requirements analysis and QA documentation',
    },
    icon: FileText,
    available: true,
    tools: [
      {
        id: 'requirements-analysis',
        label: { ru: 'Анализ требований', en: 'Requirements analysis' },
        description: {
          ru: 'Полнота, противоречия, неоднозначности, риски',
          en: 'Completeness, contradictions, ambiguities, risks',
        },
        icon: ShieldAlert,
        available: true,
        view: 'requirements-analysis',
      },
      {
        id: 'test-cases',
        label: { ru: 'Генерация тест-кейсов', en: 'Test-case generation' },
        description: {
          ru: 'Структурированные тест-кейсы по требованиям',
          en: 'Structured test cases from requirements',
        },
        icon: FileCheck2,
        available: true,
        view: 'test-cases',
      },
      {
        id: 'checklists',
        label: { ru: 'Генерация чек-листов', en: 'Checklist generation' },
        description: { ru: 'Краткие проверочные списки', en: 'Concise verification checklists' },
        icon: ListChecks,
        available: false,
      },
      {
        id: 'bug-reports',
        label: { ru: 'Генерация баг-репортов', en: 'Bug-report generation' },
        description: { ru: 'Оформление дефектов по шаблону', en: 'Defect write-ups from a template' },
        icon: Bug,
        available: false,
      },
    ],
  },
  {
    id: 'engineering',
    label: { ru: 'Инжиниринг', en: 'Engineering' },
    description: { ru: 'Чат-ассистент общего назначения', en: 'General-purpose chat assistant' },
    icon: MessageSquareCode,
    available: false,
  },
  {
    id: 'coding',
    label: { ru: 'Коддинг', en: 'Coding' },
    description: { ru: 'Работа с кодом', en: 'Working with code' },
    icon: Code2,
    available: false,
  },
]
