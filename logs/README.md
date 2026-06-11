# Логи запусков

Сюда пишутся персистентные логи приложений, чтобы любой запуск (в том числе
не вами) оставлял след для последующего анализа проблем.

## Структура

```
logs/
├── cloud/   ← запуск через docker-compose-groq.yml  (облако: Groq, llama-3.3-70b)
│   ├── host-orchestrator.log
│   ├── tester-agent.log
│   └── analyst-agent.log
└── local/   ← запуск через docker-compose-qwen.yml  (локально: Ollama + Qwen2.5)
    ├── host-orchestrator.log
    ├── tester-agent.log
    └── analyst-agent.log
```

Файлы ротируются: `*.log` — текущий, архивы `*.YYYY-MM-DD.N.log.gz`
(до 20 МБ на файл, 14 дней, суммарно до 500 МБ на сервис).

## Формат

Каждая строка — JSON (logstash-encoder). Уровень `INFO` для пакета `limberli`
(детали работы) и `WARN+` для остального.

## Что искать при анализе

| Что | Где / по какому ключу |
|---|---|
| Какая модель/режим | `tester-agent.log`: `Two-pass generation` / `Single-pass generation` |
| План функций | `Planner extracted N features` |
| Батчи генерации | `Two-pass generation: N features in M batches` |
| Длительность LLM-вызова | `durationMs=` |
| Rate-limit (облако) | `Rate limited (attempt …)` / `429` |
| Анализ рисков вкл/выкл | `host-orchestrator.log`: `Orchestration started: … riskAnalysis=` |
| Ошибки агентов | `AGENT_UNAVAILABLE`, `level":"ERROR"` |

Быстрый просмотр:

```bash
# хвост лога тестера локального запуска
tail -f logs/local/tester-agent.log

# только ошибки облачного запуска (jq по желанию)
grep '"level":"ERROR"' logs/cloud/*.log

# длительности генерации
grep durationMs logs/local/tester-agent.log
```

> Сами `*.log`/`*.gz` в git не коммитятся (см. `.gitignore`), коммитятся только
> структура папок и этот README.
