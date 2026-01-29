# Flow v1 — AI Precheck → Clarification → Gatekeeper → Analysis

## Цель
Обеспечить запуск анализа только после:
1) AI-нормализации и выявления смысловых дыр,
2) прохождения детерминированного Gatekeeper,
3) блокировки анализа до ADMITTED.

---

## Сущности данных

### InputDraft (сырой ввод)
- problem: string
- goal: string
- region: string
- capital: string | number
- time_horizon: string (опционально для Gatekeeper v1, но может запрашиваться)
- responsibility_confirmed: boolean
- production_related: boolean

### AIPrecheckResult (ответ AI, строго JSON)
- normalized: { problem, goal, region, capital, time_horizon }
- reality: { verdict: "OK" | "SUSPECT" | "BULLSHIT", reasons: string[], confidence?: number }
- clarification: { required: boolean, questions: string[] }
- notes: string[]

### GatekeeperResult (детерминированный результат)
- decision: "ADMITTED" | "RETURN_WITH_CONDITIONS" | "HARD_FAIL"
- stage: "PROBLEM" | "GOAL" | "CONSTRAINTS" | "RESPONSIBILITY" | "REALITY" | "LEGALITY" | "RESOURCE_FIT"
- reason_codes: string[]
- missing_fields: string[]
- notes: string[]

---

## Роли модулей

### UI
- собирает InputDraft
- по кнопке запускает AI Precheck
- показывает вопросы Clarification
- запускает Gatekeeper только после успешного AI Precheck
- включает/выключает кнопку “Анализ”

UI не принимает решений.

### AI Precheck (LLM)
- нормализует ввод
- выявляет смысловые дырки
- выполняет reality-фильтр
- возвращает только JSON
AI не принимает решение о допуске.

### Clarification
- выводит вопросы
- собирает ответы
- запускает повторный AI Precheck
Clarification не анализирует и не решает.

### Gatekeeper
- детерминированный допуск/отказ
- единственный модуль, который выдаёт ADMITTED
Gatekeeper не анализирует рынок/экономику.

### Analysis
- доступен только после ADMITTED
- дорогой контур
- при нехватке данных останавливается

---

## UI состояния

### DRAFT
- “Проверка данных”: enabled
- “Анализ”: disabled

### AI_CHECK_RUNNING
- обе кнопки disabled
- loader

### AI_NEEDS_CLARIFICATION
Условия:
- clarification.required = true OR reality.verdict = "SUSPECT"
Поведение:
- показать questions
- “Проверка данных”: enabled
- “Анализ”: disabled

### AI_HARD_STOP
Условия:
- reality.verdict = "BULLSHIT"
Поведение:
- показать причины
- “Анализ”: disabled
- требуется изменить ввод

### GATEKEEPER_RUNNING
- loader

### GATEKEEPER_RETURN
decision = RETURN_WITH_CONDITIONS
- показать missing_fields + notes
- “Проверка данных”: enabled
- “Анализ”: disabled

### GATEKEEPER_HARD_FAIL
decision = HARD_FAIL
- показать reason_codes + notes
- “Анализ”: disabled
- требуется изменить условия

### ADMITTED_CLEAN (каноническое)
decision = ADMITTED, данные не менялись
- “Проверка данных”: disabled (сообщение “Данные готовы (ADMITTED)”)
- “Анализ”: enabled

### ADMITTED_DIRTY
Условие:
- после ADMITTED пользователь изменил любое поле
Поведение:
- “Анализ”: disabled (сообщение “Данные изменены — требуется повторная проверка”)
- “Проверка данных”: enabled

---

## Правило инвалидации допуска (вариант A)

Gatekeeper ADMITTED действует только на snapshot данных.
Любое изменение входных полей после ADMITTED:
- переводит состояние в ADMITTED_DIRTY
- блокирует Analysis
- разблокирует “Проверка данных”