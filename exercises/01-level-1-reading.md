> Упражнения по effector · [Каталог курса](./00-README.md) — уровень 1 из 5 · решения в `<details` внутри файла.
# Уровень 1. Чтение кода (код не писать)

Ответь письменно или вслух. Цель — чтобы каждый примитив в проекте перестал быть магией.

### 1.1. Проследи пересчёт графика

Возьми `features/credit-form/model/index.ts` и `ui/CreditForm.tsx` и расписал цепочку:
что происходит, когда ты меняешь сумму в инпуте? Назови **не менее 8 звеньев**.

Подсказка: стартуй от `onChange` в JSX и иди до перерисовки компонента.

<details>
<summary>Ответ</summary>

1. `onChange` → `changeAmount(Number(e.target.value))` — событие с пейлоадом;
2. `$amount.on(changeAmount, ...)` — стор суммы обновился;
3. `$payload` — `combine` из `$amount`, `$term`, `$selectedProduct` — пересобрал значение;
4. `sample({ source: $payload, filter, target: fxRefreshSchedule })` — пейлоад не null → эффект вызван;
5. `fxRefreshSchedule` (attach-копия `fxRefreshScheduleApi`) — «запрос» на 500 мс;
   пока выполняется, `fxRefreshSchedule.pending` = true;
6. `done` → `$schedule.on(fxRefreshSchedule.done, ...)` — новый график;
7. `pending` → false ( `$scheduleLoading` обновился сам);
8. `useStore($schedule)` в `CreditForm` — компонент перерисовался, виден новый платёж.

Параллельно: `$errors` пересчитан combine-ом (валидация), `$dti` в виджете-сводке.

</details>

### 1.2. `createEffect` vs `attach({ effect })`

Чем отличается `fxGetCreditProducts` (в `entities/credit`) от `fxRefreshSchedule`
(в `features/credit-form/model`)? Зачем модель делает «локальную копию» эффекта из `common.ts`?

<details>
<summary>Ответ</summary>

`createEffect` создаёт эффект с нуля. `attach({ effect: fx })` — «двойник» существующего
эффекта: свои подписчики (`done`/`fail`/`pending`) и изоляция вызовов, а обработка — та же.

В этом проекте `common.ts` — роль «API-слоя» (как сгенерированный OpenAPI-клиент в
оригинале), а модель подключает его эффекты локально. В оригинальном проекте тот же
приём нужен по-настоящему: эффекты приходят из **других приложений** через module
federation (`web_product_info/Account` и т.д.), и `attach({ effect: fxGetAccounts })`
делает их локальными, чтобы подписываться на их `done`/`fail`.

</details>

### 1.3. Зачем `$payload` может быть `null` и зачем `filter`

Почему combine возвращает `SendClaimPayload | null`, а не «что-нибудь валидное»?
Что произойдёт без `filter` в `sample`?

<details>
<summary>Ответ</summary>

Пока `$selectedProduct` не загружен (список продуктов приходит «с сервера»), данных
для запроса нет — честное состояние «не готово». Без `filter` эффект бы вызвался с
`null` и упал (в `calculate` обращение к `payload.amount` → TypeError), либо ушёл бы
бессмысленный «запрос». Бонус: `filter: (p): p is SendClaimPayload => p !== null`
— это type predicate: TypeScript сужает тип пейлоада эффекта до `SendClaimPayload`.

</details>

### 1.4. Что такое Gate в этом проекте

`createGate()` в модели + `useGate(Gate)` в компоненте. Что именно происходит,
когда gate закрыт? Модель при этом живёт? Где в модели привязаны события
к открытию gate? И почему страница рендерит сам компонент, а не `<XGate />`
(комментарий в `pages/claims/index.tsx`)?

<details>
<summary>Ответ</summary>

Gate — «компонент смонтирован / демонтирован». `useGate(XGate)` внутри компонента
открывает gate при монтировании и закрывает при размонтировании.

Ключевая деталь v22: компонент `<XGate />` в JSX **всегда** рендерит `null` —
gate не обёртка контента, а сигнал + носитель состояния (`Gate.state`). Поэтому
страница рендерит настоящий компонент (`<CreditForm />`), а тот сам открывает
gate через `useGate` — ровно как страницы оригинального проекта
(`useGate(XGate, {…})` прямо в компоненте страницы).

В этом проекте модель **всегда жива** (упрощение): сторы созданы при импорте модуля.
Привязка к gate есть одна — загрузка данных:
`sample({ clock: CreditFormGate.open, target: fxGetCreditProducts })` и аналогичные.

В оригинальном проекте модель создаётся фабрикой прямо в момент `Gate.open`
(`createEarlyLoanRepaymentModel(gate)`) — см. задание 5.5.

</details>

### 1.5. Почему `$selectedProduct` — это `combine`, а не `map`

Можно ли написать `$creditProducts.map((products) => products.find(...))`?
В чём разница?

<details>
<summary>Ответ</summary>

Нет. `map` преобразует **один** стор: функция не знает, какой id сейчас выбран —
`$selectedProductId` это отдельная единица. `combine($creditProducts, $selectedProductId, fn)`
пересобирает результат при изменении **любого** из источников. Попробуй в консоли:
`selectCreditProduct("mortgage")` — `map`-вариант бы не отреагировал, `combine` — да.

</details>

### 1.6. Правило зависимостей

`pages → features/widgets → entities → shared`. Почему `entities/credit` не может
импортировать из `features/*`? Что сломается, если нарушить?

<details>
<summary>Ответ</summary>

Сущность — «домен» (данные и их владение), фича — «кейс использования». Фича зависит
от сущности, и наоборот — цикл: TS/бандлер разрешат, но появится неразборчивая
связность: сущность начнёт знать детали конкретного UI-сценария и перестанет
использоваться в других фичах/виджетах. В оригинале это правило то же самое —
`entities/account` не знает, что с ним делает `features/early-loan-repayment`.

</details>

---

