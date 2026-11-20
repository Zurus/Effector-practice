# effector-practice

Тренажёр для изучения **effector** на мини-копии структуры реального проекта
`web-credit-management`: те же слои (`app / pages / features / entities / widgets / shared`),
тот же паттерн **model/ui** (логика в effector-сторах, React только читает их),
но без BPM, module federation, web-forms и внутреннего фреймворка EFR.

Сценарий: сотрудник выбирает кредитный продукт, вводит сумму и срок,
график платежей пересчитывается «с сервера», заявку можно отправить.
Вторая страница — история статусов заявки.

Стек — те же версии, что в web-credit-management (по его yarn.lock):
**effector 22.7.0 + effector-react 22.5.1**, React 18, TypeScript 5, Vite.
Значит паттерны `createGate`/`useGate`, `attach({effect})`, `fx.pending`
читаются один в один в обоих проектах.

## Запуск

```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # проверка типов + прод-сборка
npm test         # vitest: тесты моделей (fork/allSettled)
npm run lint     # ESLint
npm run format   # Prettier: применить форматирование
```

Никакой сети не нужно: все «запросы к API» — фейковый «сервер» в
`src/shared/fake-api.ts` (данные, задержки, детерминированные сбои).
Нужен Node ≥ 18.

Страницы синхронизированы с URL (hash-роутинг, без роутера):
`#claims` (заявка), `#history` (статусы). Кнопки «назад»/«вперёд» работают.

## Структура ↔ web-credit-management

| web-credit-management                          | effector-practice                        | что отрабатывает |
| ---------------------------------------------- | ---------------------------------------- | ---------------- |
| `@efr/web-scripts` (webpack + module federation) | `vite`                                    | сборка (MF намеренно убран) |
| `pages/index.ts` → `RouteItem[]` + react-router | `pages/index.ts` + стор `$activePage` (синхрон с `location.hash`) | реестр страниц |
| `entities/account` (стор + эффекты)            | `entities/client`, `entities/credit`     | сущность владеет данными |
| `features/early-loan-repayment` (model/ui, Gate) | `features/credit-form`, `features/status-history` | фича = model + ui |
| `web-forms` (`createForm`, `rules`)            | стор на поле + `$errors` через combine   | форма и валидация |
| OpenAPI → `shared/api`, `api-instances`        | `shared/fake-api.ts` («сервер») + тонкие эффекты в `features/credit-form/common.ts` | API-слой |
| `widgets/`                                     | `widgets/credit-summary`, `client-card`  | составные UI-блоки |
| `shared/lib`, `messages`, `constants`, `types`, `ui` | то же самое                       | общий код |

Правило зависимостей (как в оригинале):
`pages → features/widgets → entities → shared`. Никогда в обратную сторону.

## С чего читать код

1. `src/app/model.ts` — `createEvent` + `createStore` + синхрон с `location.hash`.
2. `src/entities/credit/model.ts` — `restore`, `combine`, производный стор.
3. `src/features/credit-form/model/index.ts` — **главный файл**:
   `createGate`, `attach`, `sample`, `filter`, `done`/`fail`, `.pending`.
4. `src/features/credit-form/ui/CreditForm.tsx` — как UI читает сторы (`useStore`)
   и шлёт события.
5. `src/features/status-history/*` — вторая фича попроще.
6. `src/widgets/credit-summary/model.ts` — производные сторы в виджете.

## Шпаргалка по тому, где что используется

| Примитив            | Где в проекте                                                        |
| ------------------- | -------------------------------------------------------------------- |
| `createEvent`       | `app/model.ts`, `entities/credit` (selectCreditProduct), `features/*` |
| `createStore` + `.on` | `app/model.ts`, поля формы в `features/credit-form/model`          |
| `restore`           | `$client`, `$creditProducts`, `$statuses`                            |
| `createEffect`      | все базовые `fx*` в `entities/*`, `features/credit-form/common.ts`, `features/status-history`   |
| `attach({effect})`  | локальные копии эффектов в `features/credit-form/model` (как в оригинале) |
| `sample`            | пересчёт графика, отправка заявки, refreshHistory                     |
| `combine`           | `$selectedProduct`, `$payload`, `$errors`, `$dti`, `$visibleStatuses` |
| `.map`              | `$statusOptions`, `$dtiOk`                                            |
| `fx.pending`        | `$scheduleLoading`, `$sending`, `$historyLoading`                     |
| `createGate`        | `features/*/model`, `widgets/credit-summary/model`                    |
| `useGate` + `useStore` | `features/*/ui`, `widgets/*`                                   |

Полезно знать, хотя в app-коде не используется: `useUnit` (подписка на событие
из компонента), `effector/createWatch` (наблюдение за стором для отладки:
`createWatch($schedule, console.log)`). `fork`/`allSettled` уже используются в
тестах моделей — см. `src/**/*.test.ts` (важный нюанс v22.7: опция — `params`,
не `payload`/`parameters`).


## Упражнения

Полный набор задач — в отдельном файле **[EXERCISES.md](./EXERCISES.md)**:
5 уровней, 34 задачи — от чтения кода до тестирования моделей и рефакторинга.

- В коде задачи помечены `TODO (упражнение N.M)`.
- Решения — в свёрнутых блоках `<details>` в файлах `exercises/`. Не подглядывай.
- После каждого изменения проверяй: `npm run build` (типы + сборка),
  `npm test` и `npm run lint`.
