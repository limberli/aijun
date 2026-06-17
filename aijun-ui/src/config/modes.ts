import type { ModeSchema } from '@/types/qa'

/**
 * Fallback generation-settings schema, used when GET /api/modes is unavailable. Mirrors the
 * tester-agent's qa-prompts.yml (option ids MUST match). The backend is the source of truth;
 * this keeps the settings panel functional offline and documents the contract.
 */
export const DEFAULT_MODES: ModeSchema[] = [
  {
    id: 'test-cases',
    label: 'Тест-кейсы',
    controls: [
      {
        id: 'caseTypes',
        label: 'Тип тест-кейса',
        type: 'multi',
        defaults: ['ui'],
        options: [
          { id: 'ui', label: 'UI' },
          { id: 'api', label: 'API' },
          { id: 'db', label: 'БД' },
          { id: 'combined', label: 'Комбинированный' },
        ],
      },
      {
        id: 'techniques',
        label: 'Техника тест-дизайна',
        type: 'multi',
        defaults: ['boundary', 'positive-negative'],
        options: [
          { id: 'equivalence', label: 'Эквивалентное разбиение' },
          { id: 'boundary', label: 'Граничные значения' },
          { id: 'decision-table', label: 'Таблица решений' },
          { id: 'pairwise', label: 'Pairwise' },
          { id: 'state-transition', label: 'Переходы состояний' },
          { id: 'positive-negative', label: 'Позитив/негатив' },
        ],
      },
      {
        id: 'stepDetail',
        label: 'Детализация шагов',
        type: 'single',
        defaults: ['medium'],
        options: [
          { id: 'short', label: 'Короткая (3–5)' },
          { id: 'medium', label: 'Средняя (6–10)' },
          { id: 'detailed', label: 'Подробная (10+)' },
        ],
      },
    ],
  },
]
