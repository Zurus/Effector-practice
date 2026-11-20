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
```

Никакой сети не нужно: все «запросы к API» — фейковые `setTimeout`.
Нужен Node ≥ 18.

## Структура ↔ web-credit-management

| web-credit-management                          | effector-practice                        | что отрабатывает |
| ---------------------------------------------- | ---------------------------------------- | ---------------- |
| `@efr/web-scripts` (webpack + module federation) | `vite`                                    | сборка (MF намеренно убран) |
| `pages/index.ts` → `RouteItem[]` + react-router | `pages/index.ts` + стор `$activePage`    | реестр страниц |
| `entities/account` (стор + эффекты)            | `entities/client`, `entities/credit`     | сущность владеет данными |
| `features/early-loan-repayment` (model/ui, Gate) | `features/credit-form`, `features/status-history` | фича = model + ui |
| `web-forms` (`createForm`, `rules`)            | стор на поле + `$errors` через combine   | форма и валидация |
| OpenAPI → `shared/api`, `api-instances`        | `features/credit-form/common.ts` (фейковые эффекты) | API-слой |
| `widgets/`                                     | `widgets/credit-summary`, `client-card`  | составные UI-блоки |
| `shared/lib`, `messages`, `constants`, `types`, `ui` | то же самое                       | общий код |

Правило зависимостей (как в оригинале):
`pages → features/widgets → entities → shared`. Никогда в обратную сторону.

## С чего читать код

1. `src/app/model.ts` — 10 строк: `createEvent` + `createStore`.
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
| `createEffect`      | все базовые `fx*` в `entities/*` и `features/credit-form/common.ts`   |
| `attach({effect})`  | локальные копии эффектов в `features/credit-form/model` (как в оригинале) |
| `sample`            | пересчёт графика, отправка заявки, refreshHistory                     |
| `combine`           | `$selectedProduct`, `$payload`, `$errors`, `$dti`, `$visibleStatuses` |
| `.map`              | `$statusOptions`, `$dtiOk`                                            |
| `fx.pending`        | `$scheduleLoading`, `$sending`, `$historyLoading`                     |
| `createGate`        | `features/*/model`, `widgets/credit-summary/model`                    |
| `useGate` + `useStore` | `features/*/ui`, `widgets/*`                                   |

Полезно знать, хотя в проекте не используется: `useUnit` (подписка на событие
из компонента), `fork`/`launch` (тестирование моделей без React),
`effector/createWatch` (наблюдение за стором для отладки: `createWatch($schedule, console.log)`).


## Упражнения

Полный набор задач — в отдельном файле **[EXERCISES.md](./EXERCISES.md)**:
5 уровней, ~35 задач — от чтения кода до тестирования моделей и рефакторинга.

- В коде задачи помечены `TODO (упражнение N.M)`.
- Решения — в свёрнутых блоках `<details>` в том же файле. Не подглядывай.
- После каждого изменения проверяй: `npm run build` (типы + сборка).
