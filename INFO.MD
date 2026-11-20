# INFO — информация о проекте (для агента)

> Живой документ: переписывается под актуальное состояние в конце каждой сессии.
> Публичный обзор для человека — `README.md`. План развития и статус задач — `improvements.md`.
> Обновлено: 2026-11-20.

## 1. ПРОЕКТ — КРАТКО

- Что: effector-practice — тренажёр для изучения effector, мини-копия структуры
  реального проекта web-credit-management (слои app / pages / features / entities /
  widgets / shared, паттерн model/ui: логика в effector-сторах, React только читает).
- Сценарий: сотрудник выбирает кредитный продукт, сумму, срок; график платежей
  пересчитывается «с сервера»; заявку можно отправить («сервер» отклоняет сумму,
  кратную 7). Вторая страница — история статусов заявки.
- Сети НЕТ: фейковый «сервер» — `src/shared/fake-api.ts` (БД в памяти, задержки,
  детерминированные сбои, настраиваемый `fakeApiConfig`).
- Стек (версии из package.json, проверено): React 18.3, TypeScript 5.6 (strict),
  Vite 5.4.21, effector 22.7.0, effector-react 22.5.1 (API v22!).
  Версии подобраны 1-в-1 как в web-credit-management.
- Навигация: стор `$activePage` в синхроне с `location.hash` (`#claims`/`#history`),
  роутера нет.
- Репозиторий: `github.com/Zurus/Effector-practice`, ветка `main`;
  CI — GitHub Actions (`.github/workflows/ci.yml`: build → test → lint, Node 22).

## 2. КАРТА ПРОЕКТА

Корень:
- `index.html`                     — точка входа Vite (монтирует /src/main.tsx)
- `package.json`                   — scripts: dev / build / preview / test / lint /
                                     lint:fix / format / format:check
- `vite.config.ts`                 — @vitejs/plugin-react + алиасы импортов
- `vitest.config.ts`               — сливает vite.config.ts (алиасы работают в тестах);
                                     env: node; include: `src/**/*.test.{ts,tsx}`
- `tsconfig.json`                  — strict: true, target ES2022; paths повторяют алиасы
- `eslint.config.js`               — ESLint 9 flat: js + typescript-eslint + react + prettier
- `.prettierrc`                    — printWidth 100, двойные кавычки, trailingComma all
- `.github/workflows/ci.yml`       — CI: npm ci → build → test → lint (Node 22)
- `README.md`                      — публичный обзор + сравнение структуры с web-credit-management
- `INFO.MD`                        — этот файл: факты о проекте для агента
- `improvements.md`                — план развития (EX-*, IMP-*, статусы, антипаттерны)
- `EXERCISES.md`                   — индекс-ссылки на exercises/ (34 задачи, 5 уровней)
- `exercises/`                     — курс: 00-README, 01–05 по уровням, 06-self-check
                                     (решения в `<details>`)

src/:
- `main.tsx`                          — ReactDOM createRoot, StrictMode
- `app/index.tsx`                     — корневой App: навигация + текущая страница
- `app/model.ts`                      — PageKey, selectPage, $activePage (синхрон с
                                       location.hash), pageFromHash, hashChanged
                                       (заготовка упражнения 2.5)
- `app/model.test.ts`                 — тесты URL-синхронизации (node + stub window)
- `pages/index.ts`                    — routes: RouteItem[] (2 страницы)
- `pages/claims/index.tsx`            — страница «Заявка»: ClientCard + CreditForm + CreditSummary
- `pages/history/index.tsx`           — страница «История»: StatusHistory
- `entities/client/model.ts`          — fxLoadClient, $client = restore
                                       (заготовка упражнения 2.1)
- `entities/credit/model.ts`          — fxGetCreditProducts, $creditProducts,
                                       selectCreditProduct, $selectedProductId,
                                       $selectedProduct (combine)
- `entities/credit/model.test.ts`     — тесты: fork + allSettled (опция `params`!)
- `features/credit-form/common.ts`    — «API-слой»: тонкие эффекты поверх fakeApi
                                       (fxRefreshScheduleApi, fxSendClaimApi)
- `features/credit-form/constants.ts` — TERM_OPTIONS = [12,24,36,48,60,84]
- `features/credit-form/model/index.ts` — ГЛАВНАЯ МОДЕЛЬ: CreditFormGate, $amount/$term,
                                       $payload (combine, | null), attach-копии эффектов,
                                       $schedule, $errors (combine), sendClaim, $sending,
                                       $claimResult/$claimError
- `features/credit-form/ui/CreditForm.tsx` — форма (заготовка упражнения 2.2)
- `features/status-history/model.ts`  — StatusHistoryGate, fxLoadHistory, $statuses,
                                       refreshHistory; фильтр ГОТОВ: $statusFilter,
                                       $statusOptions, $visibleStatuses
- `features/status-history/ui/StatusHistory.tsx` — таблица + «Обновить»
                                       (заготовка упражнения 2.3)
- `widgets/client-card/index.tsx`     — карточка клиента (читает $client)
- `widgets/credit-summary/model.ts`   — CreditSummaryGate, $dti, $dtiOk
                                       (заготовка упражнения 2.4)
- `widgets/credit-summary/index.tsx`  — сводка: клиент, платёж, переплата, ПДН
- `shared/fake-api.ts`                — фейковый «сервер»: БД в памяти (клиент, 3 продукта,
                                       3 статуса), задержки 600/400/500/800/700 мс,
                                       правило отказа amount % 7, fakeApiConfig
- `shared/fake-api.test.ts`           — тесты: аннуитет, отказ %7, формат CLM
- `shared/lib.ts`                     — formatMoney (Intl ru-RU RUB), formatFio
- `shared/lib.test.ts`                — тесты formatFio/formatMoney
- `shared/messages.ts`                — Messages.* (функции, не строки)
- `shared/constants.ts`               — MIN_MONTHLY_INCOME=30000, MAX_DTI=50,
                                       CRITICAL_DTI=60, APP_NAME
- `shared/types.ts`                   — Client, CreditProduct, SendClaimPayload,
                                       PaymentSchedule, SendClaimResult, ClaimStatus
- `shared/ui/index.tsx`               — PageLayout, Button, Alert, PageNav
- `shared/styles.css`                 — все стили (216 строк, BEM-подобные классы)

## 3. КОМАНДЫ

Проверено 2026-11-19/20 (Node v22.23.2, npm 10.9.8):

| Команда                          | Назначение              | Статус                     |
| -------------------------------- | ----------------------- | -------------------------- |
| `npm ci`                         | установка               | OK (71 пакет + dev)        |
| `npm run dev`                    | dev-сервер              | OK, http://localhost:5173 (HTTP 200) |
| `npm run build`                  | типы + прод-сборка      | OK: `tsc --noEmit && vite build` |
| `npm test`                       | vitest                  | OK, 16/16 (2026-11-20)     |
| `npm run lint`                   | ESLint                  | OK, 0 ошибок (2026-11-20)  |
| `npm run format` / `format:check`| Prettier                | OK                         |
| `./node_modules/.bin/tsc --noEmit` | только типы           | OK                         |
| `npm run preview`                | превью прод-сборки      | **не проверено**           |

Node ≥ 18 (требование README; локально v22.23.2).

## 4. СОГЛАШЕНИЯ

- Только API v22: нет `fx.settled`, нет debounce из коробки, нет `Gate({component})`.
  Индикатор загрузки — `fx.pending` (стор-булево).
- Бизнес-логика — в model/; React (ui/) только `useStore` + отправка событий.
- Зависимости: `pages → features/widgets → entities → shared`. Никогда в обратную сторону.
- Gate: `createGate()` в model → `useGate(Gate)` в компоненте; страница рендерит САМ
  компонент (в v22 `<XGate/>` в JSX рендерит null).
- `attach({effect})` — только для существующих эффектов («API-слой» common.ts поверх
  fake-api); новая асинхронная функция — `createEffect`.
- «Поведение сервера» (данные, задержки, сбои) — только в `shared/fake-api.ts`;
  модели не содержат «серверной» логики.
- Импорты через алиасы: `app/*`, `pages/*`, `features/*`, `entities/*`, `widgets/*`,
  `shared/*` (vite.config.ts + tsconfig paths).
- После каждого изменения: `npm run build` + `npm test` + `npm run lint`.
- TODO в коде помечены «TODO (упражнение N.M)» — номера задач из `exercises/`.

## 5. ТЕКУЩЕЕ СОСТОЯНИЕ (2026-11-20)

- Работает всё: dev-сервер (HTTP 200), сборка, тесты 16/16, линт 0, push в GitHub.
- Не выполнено: 5 `TODO (упражнение 2.1–2.5)` в коде и учебные задачи EX-*
  (список — `improvements.md`); roadmap IMP — 6 из 28 пунктов.
- Первый CI-запуск на GitHub не проверен (на машине нет `gh`/токена).
- Нюанс типов: `$client` типирован как `Client`, но начальное значение `null`
  (`restore(fxLoadClient, null as unknown as Client)`) — UI проверяет `!client`.
  Решение о типе — в `improvements.md`, разд. «Открытые вопросы».

## 6. ГРАБЛИ (окружение и API)

1. **effector 22.7**: в `allSettled`/`launch` опция payload — **`params`**
   (не `parameters`/`payload` — это v23+). Проверено по `index.d.ts` и эмпирически.
   С неверной опцией `allSettled`/`launch` на простых событиях ведут себя странно
   (store получал внутренний объект scope).
2. `npx tsc` в этой среде подхватывает чужой deprecated-пакет `tsc@2.0.4` —
   **НЕ использовать**. Только `./node_modules/.bin/tsc --noEmit` или `npm run build`.
3. `vitest@5` требует Vite ≥ 6 → при Vite 5.4.21 установлен **vitest@3**.
4. `eslint-plugin-react` не поддерживает eslint 10 → зафиксирован **eslint@9** (flat-конфиг).
5. Коммиты: глобальный хук требует формат `[тег] [тег] сообщение`
   (например `[study] [task] …`; Merge-сообщения освобождаются).
6. Если vite/tsc «молчат» без ошибок — первым делом проверить пустые файлы:
   `find node_modules -type f -size 0`. Лечение: `rm -rf node_modules && npm ci`.
7. В git-bash нет `pkill`/`pgrep`: `netstat -ano | grep 5173` + `taskkill //F //PID <pid>`.

## 7. РЕШЕНИЯ

- Распределение файлов: `README.md` — публичный обзор; `INFO.MD` — факты для агента
  (этот файл); `improvements.md` — план развития. (Раньше накопления были в
  `agent007.txt`, переименован в INFO.MD 2026-11-20.)
- vitest — разрешён как новая зависимость.
- Заготовки упражнений 2.3/2.4 не трогать: там `eslint-disable
  @typescript-eslint/no-unused-vars` с пояснением — импорты намеренно «спящие»
  до выполнения задач.
- TODO в коде «упражнение N.M» — ссылки на файлы `exercises/*` НЕ обновлять.
- `agents.md` в проекте не используется.

## 8. ЖУРНАЛ (append-only, новые сверху)

### 2026-11-20
- `git init` + push на GitHub (`Zurus/Effector-practice`). Коммиты:

  | Коммит | Что |
  | ------ | --- |
  | `4534d3d` | IMP-1.1: baseline (тренажёр + exercises/ + improvements.md) |
  | `ddaf520` | [defect] `entities/credit`: `selectCreditProduct` не обновлял `$selectedProductId` — смена продукта в селекте не работала вообще (найдено тестом) |
  | `82e33dc` | IMP-1.2: vitest@3.2.7 + 4 файла тестов (16 тестов) |
  | `57592ea` | IMP-2.1: `shared/fake-api.ts` — данные, задержки и сбои в одном месте; модели — тонкие эффекты |
  | `36de552` | IMP-3.1: URL-синхронизация `$activePage ↔ location.hash`; tsconfig target ES2022 |
  | `5df5b87` | IMP-1.4 + 1.5: ESLint 9 flat + Prettier + CI workflow |
  | `b3257ec` | docs: README, этот файл, отметки ✅ в improvements.md |

- `agent007.txt` → `INFO.MD`; информация распределена: README / INFO.MD / improvements.md.

### 2026-11-19
- Разобран проект целиком (все файлы `src/`, конфиги, README, EXERCISES).
- Баг «проект не запускается»: `node_modules` повреждены — 2478 из 2534 файлов по 0 байт
  (в т.ч. `node_modules/vite/bin/vite.js`) → `rm -rf node_modules && npm ci`.
  Причина повреждения не установлена.
- `EXERCISES.md` (1586 строк, 34 задачи, 5 уровней) → разбит на `exercises/`
  (7 файлов, контент дословно, решения в `<details>`); оригинал заменён кратким индексом.
- Созданы `agent007.txt` (предшественник этого файла) и `improvements.md` (roadmap).
