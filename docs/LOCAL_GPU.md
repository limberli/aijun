# Локальный запуск на GPU (NVIDIA RTX 4090)

Как поднять весь стек на локальной модели **Qwen2.5** через Ollama с ускорением на
видеокарте — без облачного API. Используется `docker-compose-qwen.yml`.

> Зачем локально: нет лимита токенов-в-минуту (в отличие от бесплатного Groq),
> бесплатно по токенам, данные не уходят в облако. Двухпроходный Planner здесь
> работает без задержек на rate-limit.

---

## 1. Требования

### Железо
| Компонент | Минимум | Рекомендуется |
|---|---|---|
| GPU | NVIDIA с 12+ ГБ VRAM | RTX 4090 (24 ГБ VRAM) |
| RAM | 16 ГБ | 32 ГБ |
| Диск | 20 ГБ свободно | 40 ГБ (модели + образы) |

### Софт
- **Docker** + **Docker Compose v2** (`docker compose`, не `docker-compose`).
- **Драйвер NVIDIA** (проверка: `nvidia-smi` должен показывать видеокарту).
- **NVIDIA Container Toolkit** — даёт контейнерам доступ к GPU.
  Установка: <https://docs.nvidia.com/datacenter/cloud-native/container-toolkit/latest/install-guide.html>

Проверка, что Docker видит GPU:
```bash
docker run --rm --gpus all nvidia/cuda:12.4.0-base-ubuntu22.04 nvidia-smi
```
Если выводится таблица с видеокартой — всё готово. Если ошибка — сначала почини
toolkit (см. раздел «Проблемы» ниже).

---

## 2. Запуск

Из корня репозитория:

```bash
# Модель по умолчанию — qwen2.5:14b (оптимум для 4090)
docker compose -f docker-compose-qwen.yml up --build
```

Первый запуск:
1. собирает образы агентов (Maven внутри контейнера, ~2–4 мин);
2. скачивает модель в том `ollama_data` (qwen2.5:14b ≈ 9 ГБ, зависит от сети);
3. поднимает Ollama → агентов → оркестратор → UI.

Когда всё поднимется — открой **<http://localhost:3000>**.

Остановить:
```bash
docker compose -f docker-compose-qwen.yml down
```
Модель остаётся в томе `ollama_data` — повторный запуск уже без скачивания.

### Выбор модели

Переопредели переменной `OLLAMA_MODEL`:

| Модель | VRAM (≈, Q4) | Когда |
|---|---|---|
| `qwen2.5:7b` | ~6 ГБ | слабее, для проверки на любой GPU |
| `qwen2.5:14b` | ~10 ГБ | **по умолчанию**, оптимум качество/скорость на 4090 |
| `qwen2.5:32b` | ~20 ГБ | сильнее, впритык влезает в 24 ГБ 4090 |

```bash
OLLAMA_MODEL=qwen2.5:32b docker compose -f docker-compose-qwen.yml up --build
```

> Та же переменная управляет и tester, и analyst, и скачиванием модели.

---

## 3. Проверка, что работает GPU, а не CPU

```bash
# загрузка видеокарты во время генерации
nvidia-smi

# в логах Ollama должно быть про offload слоёв на GPU
docker compose -f docker-compose-qwen.yml logs ollama | grep -i "gpu\|cuda\|offload"
```
Если генерация идёт минутами и `nvidia-smi` показывает 0% — модель крутится на CPU
(см. «GPU не используется» ниже).

---

## 4. Где смотреть логи

Каждый запуск пишет логи в `logs/local/`:

```
logs/local/
├── host-orchestrator.log
├── tester-agent.log
└── analyst-agent.log
```

Полезное (формат — JSON-строки):
```bash
# что происходит в тестере в реальном времени
tail -f logs/local/tester-agent.log

# режим генерации и длительности
grep -E "Two-pass|Single-pass|Planner|durationMs" logs/local/tester-agent.log

# только ошибки
grep '"level":"ERROR"' logs/local/*.log
```
Подробнее — в `logs/README.md` (таблица «что искать»).

---

## 5. Настройки двухпроходной генерации (Planner)

Можно задать через переменные окружения агента (`qa.planner.*` → `QA_PLANNER_*`):

| Переменная | По умолчанию | Что делает |
|---|---|---|
| `QA_PLANNER_ENABLED` | `true` | выключить = вернуться к одному проходу |
| `QA_PLANNER_BATCHSIZE` | `3` | функций на вызов; меньше = глубже, но больше вызовов |
| `QA_PLANNER_MINFEATURES` | `6` | ниже порога используется один проход |
| `QA_PLANNER_MAXFEATURES` | `30` | предохранитель от лавины вызовов |
| `QA_PLANNER_MAXRETRIESPERCALL` | `4` | попытки при rate-limit (локально не актуально) |

Пример: глубже, но больше вызовов (на локальной модели без TPM-лимита это бесплатно):
```bash
QA_PLANNER_BATCHSIZE=2 OLLAMA_MODEL=qwen2.5:14b \
  docker compose -f docker-compose-qwen.yml up --build
```

---

## 6. Топ проблем и решения

### GPU не используется (генерация на CPU, очень медленно)
- **Симптом:** ответ идёт минутами, `nvidia-smi` показывает 0% во время генерации.
- **Причина:** Docker не имеет доступа к GPU (нет NVIDIA Container Toolkit).
- **Решение:**
  1. Проверь `docker run --rm --gpus all nvidia/cuda:12.4.0-base-ubuntu22.04 nvidia-smi`.
  2. Если падает — установи/почини NVIDIA Container Toolkit, затем
     `sudo systemctl restart docker`.
  3. Перезапусти стек.

### Ошибка `could not select device driver "nvidia"` при старте
- **Причина:** в системе нет nvidia-runtime, а в compose есть блок `deploy: devices: nvidia`.
- **Решение:** либо установи Container Toolkit (правильный путь), либо для CPU-режима
  убери блок `deploy:` у сервиса `ollama` в `docker-compose-qwen.yml` (будет медленно).

### Скачивание модели зависает / таймаут
- **Симптом:** контейнер `ollama-model-init` падает по `--max-time`.
- **Причина:** медленная сеть, модель большая.
- **Решение:** запусти скачивание вручную (без таймаута), потом подними стек:
  ```bash
  docker compose -f docker-compose-qwen.yml up -d ollama
  docker exec -it ollama ollama pull qwen2.5:14b
  docker compose -f docker-compose-qwen.yml up --build
  ```

### Out of memory / CUDA out of memory
- **Симптом:** Ollama падает или модель не грузится; в логах `ollama` — нехватка VRAM.
- **Причина:** модель крупнее, чем влезает в видеокарту (например, `qwen2.5:32b` при
  занятой VRAM, или несколько моделей сразу).
- **Решение:** возьми модель поменьше (`OLLAMA_MODEL=qwen2.5:14b` или `:7b`); закрой
  другие приложения, занимающие VRAM; проверь `nvidia-smi`.

### Первый запрос очень долгий, последующие быстрые
- **Причина:** «холодная» загрузка модели в VRAM при первом обращении — это норма.
- **Решение:** ничего; прогрей запросом-пустышкой. Можно увеличить время удержания
  модели в памяти переменной у сервиса `ollama`: `OLLAMA_KEEP_ALIVE=30m`.

### `host-orchestrator` health = 503, компонент `ollama` DOWN
- **Причина:** косметика — health-индикатор оркестратора пингует Ollama по
  `localhost:11434`, но в Docker Ollama доступен по имени `ollama`. На работу не влияет.
- **Решение:** игнорировать; проверяй работоспособность через реальный запрос
  `POST /api/analyze` или через UI.

### Порт уже занят (8080/8081/8082/3000/11434)
- **Симптом:** `bind: address already in use` при старте.
- **Решение:** освободи порт или поменяй маппинг в `docker-compose-qwen.yml`
  (левая часть `"8080:8080"`), например `"18080:8080"`.

### UI не подключается к агенту / пустой список агентов
- **Причина:** оркестратор ещё не поднялся, либо UI собрался раньше времени.
- **Решение:** дождись `host-orchestrator` (healthy), затем обнови страницу
  <http://localhost:3000>. Проверь `docker compose -f docker-compose-qwen.yml ps`.

### `model 'qwen2.5:14b' not found`
- **Причина:** имя модели в `OLLAMA_MODEL` не совпало с тем, что скачал init-контейнер,
  или скачивание не завершилось.
- **Решение:** убедись, что один и тот же `OLLAMA_MODEL` использован при запуске; проверь
  наличие модели: `docker exec -it ollama ollama list`.

### Кейсов меньше, чем ожидалось (модель «схлопнула» покрытие)
- **Причина:** на одном проходе модель ограничивает суммарный объём.
  Локальная Qwen2.5 7b/14b слабее 70B по удержанию сложной инструкции.
- **Решение:** убедись, что Planner включён (`QA_PLANNER_ENABLED=true`); уменьши
  `QA_PLANNER_BATCHSIZE` до 2; возьми модель крупнее (`qwen2.5:32b`).

---

## 7. Сравнение с облачным режимом

| | Локально (`docker-compose-qwen.yml`) | Облако (`docker-compose-groq.yml`) |
|---|---|---|
| Модель | Qwen2.5 (7b/14b/32b) | Groq `llama-3.3-70b-versatile` |
| Стоимость | бесплатно (своё железо) | бесплатный тариф с лимитом TPM |
| Rate-limit | нет | 12k TPM (есть back-off) |
| Логи | `logs/local/` | `logs/cloud/` |
| Нужна видеокарта | да | нет |

Результаты прогонов для сравнения качества фиксируй в удобном формате вне
репозитория.
