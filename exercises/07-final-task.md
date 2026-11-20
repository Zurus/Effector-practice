> Упражнения по effector · [Каталог курса](./00-README.md) — финальная задача (5.7) · решение в `<details` внутри файла.
# Финальная задача. Полная страница «Раннее погашение» с нуля

Финал курса: ты сам собираешь страницу такого же типа, как в оригинальном
проекте (аналог — `features/early-loan-repayment`). Новых теоретических понятий
нет — всё из уровней 0–5, в первый раз собранное в целое:

| Что собираешь | Где этому учились |
| ------------- | ----------------- |
| «API-слой» фичи (`common.ts`) | 3.1, 3.7 |
| Валидация + `$canCheck` | 2.4, 4.2 |
| `attach` + `.pending` + `done`/`fail` | 3.1, 3.5, 3.7 |
| Модель-фабрика + сброс при открытии | 5.5 (эссе), 5.6 |
| `useUnit` в UI | 5.2 |
| Виджет, читающий состояние фичи | 4.4 |
| Страница + маршрут | 2.5 |
| Тесты с `fork`/`allSettled` (scope) | 5.3, 5.4 + один новый инструмент — `fork` |

**Оценка:** 2–4 часа. Единственная большая задача курса: застрять — нормально,
шаги расставлены, решение — в конце.

**Сценарий (что получится у пользователя):** новая страница «Раннее погашение»:
клиент вводит сумму раннего погашения и оставшийся срок кредита — «сервер»
(фейковый эффект с задержкой 700 мс) возвращает выгоду: сколько процентов
экономится и каков новый срок. «Сервер» отказывает при сумме **2 000 000 ₽ и выше**
— нужно видеть серверную ошибку. При повторном открытии страницы форма сбрасывается.

## Шаги

### Шаг 1. Типы — `shared/types.ts`

Два интерфейса:

- `EarlyRepaymentPayload { amount: number; term: number }` — сумма и оставшийся срок;
- `EarlyRepaymentResult { savedInterest: number; newTermMonths: number }` —
  сэкономленные проценты и новый срок.

### Шаг 2. «Сервер» — `features/early-loan-repayment/common.ts` (новый)

Эффект `fxCheckEarlyRepaymentApi(payload: EarlyRepaymentPayload): Promise<EarlyRepaymentResult>`:

- задержка 700 мс;
- `amount >= 2_000_000` → `reject(new Error("Сумма превышает лимит для раннего погашения (2 000 000 ₽)"))`;
- иначе `resolve({ savedInterest, newTermMonths })`:
  `savedInterest = Math.round(amount * 0.015 * (term / 12))` (экономия процентов),
  `newTermMonths = Math.max(0, term - 6)` (срок «коротчит»).

Формат — как в решениях 3.1 и 3.7: inline-проми́с в `common.ts`, в
`shared/fake-api.ts` ничего не меняем.

### Шаг 3. Модель-фабрика — `features/early-loan-repayment/model.ts` (новый)

Главный шаг. Фабрика `createEarlyRepaymentModel(gate)` создаёт и возвращает объектом:

- **форму:** `$amount` (0), `$term` (36), `changeAmount`, `changeTerm`;
- **валидацию:** `$errors` (`.map` по `$amount`): сумма < 10 000 ₽ —
  «Минимальная сумма раннего погашения — 10 000 ₽»; сумма > 3 000 000 ₽ —
  «Максимальная сумма раннего погашения — 3 000 000 ₽»;
- **копию API:** `fxCheck = attach({ effect: fxCheckEarlyRepaymentApi })` (паттерн 3.1);
- **запуск:** событие `check` («Проверить выгоду») и `sample`:
  `clock: check`, `source` — combine из `$amount`/`$term` (собирает payload),
  `target: fxCheck`;
- **состояния запроса:** `$checking = fxCheck.pending`,
  `$result` — `.on(fxCheck.done, (_, { result }) => result)` + очистка по `check`,
  `$error` — `.on(fxCheck.fail, (_, { error }) => error.message)` + очистка по `check`;
- **`$canCheck`** — combine из `$errors` и `$checking` (паттерн 4.2: нет ошибок
  и запрос не в полёте);
- **сброс при открытии:** по `gate.open` — форма и результат очищаются
  (то самое «бесплатно» из 5.5/5.6).

На стороне модуля: `EarlyRepaymentGate = createGate()` и **один** экземпляр
фабрики с переэкспортом единиц (ровно как в 5.6).

### Шаг 4. Форма — `features/early-loan-repayment/ui/` (новый)

`ui/EarlyLoanRepayment.tsx` + `ui/index.ts` + `index.ts` фичи. Компонент:

- `useGate(EarlyRepaymentGate)` — первой строкой;
- input суммы (`type="number"`) → `changeAmount`, селект срока
  (12/24/36/48/60 мес.) → `changeTerm`;
- список ошибок `$errors` (Alert kind="error" на каждую);
- кнопка «Проверить выгоду»: `disabled={!canCheck}`, при `$checking` —
  текст «Проверяем…»;
- серверная ошибка `$error` — Alert.

Все сторы подключи **одним `useUnit`** (5.2) — `useStore` здесь не должно быть.

### Шаг 5. Виджет — `widgets/repayment-summary/index.tsx` (новый)

Карточка «Выгода»: **свой** gate (как в 4.4), читает `$result` фичи
(виджет → фича — нормальное направление, 4.4). Результата нет — заглушка-текст.
Есть — «Проценты: N» (`formatMoney`) и «Новый срок: M мес.».

### Шаг 6. Страница и маршрут

- `pages/early-repayment/index.tsx` (новый): `PageLayout` с заголовком
  «Раннее погашение» и `.grid`, в ней `<EarlyLoanRepayment />` + `<RepaymentSummary />`;
- `pages/index.ts`: маршрут
  `{ name: "Раннее погашение", key: "earlyRepayment", path: "/early-repayment", component: EarlyRepaymentPage }`;
- `app/model.ts`: расширь `PageKey` и `PAGE_KEYS` на `"earlyRepayment"`.

Навигация подхватит страницу сама (`PageNav` читает `routes`) — как в 2.5.

### Шаг 7. Тесты с `fork` (scope) — `features/early-loan-repayment/model.test.ts` (новый)

Первый scope курса. Новых понятий — три, и только они:

- `fork()` — «параллельная вселенная» модели: изолированная копия состояний;
- `allSettled(unit, { scope, params })` — «выполни единицу **в этой** вселенной и
  дождись результата»; `params` — payload события (v22: именно `params`,
  не `parameters` и не `payload`);
- `scope.getState(store)` — значение стора **в этой** вселенной.

Три теста:

1. **Изоляция фабрики.** Две инстанции `createEarlyRepaymentModel(gate)`:
   `changeAmount(50_000)` в первой — во второй `$amount` остался 0.
   (fork не нужен — глобального мира достаточно.)
2. **Успешный проход.** Свежая `fork()`: `changeAmount(100_000)` и
   `changeTerm(24)` — каждое через `allSettled` с `params`; затем
   `allSettled(check, { scope })`. `$error` — null,
   `$result.savedInterest > 0` (читаем через `scope.getState`).
3. **Отказ «сервера».** Свежая `fork()`: `changeAmount(2_500_000)` —
   клиентская валидация пропускает (это в пределах 3 000 000),
   «сервер» отказывает. `allSettled(check, { scope })` →
   `$error` содержит «лимит».

**Итоговая проверка:** `npm run build` + `npm test` + `npm run lint`;
в браузере: страница видна в навигации, форма работает, сумма 2 500 000 —
серверная ошибка, ушёл с страницы и вернулся — форма сбросилась.

<details>
<summary>Полное решение</summary>

#### 1. `shared/types.ts` — добавить

```ts
/** Плат-лоад раннего погашения */
export interface EarlyRepaymentPayload {
  amount: number;
  /** Оставшийся срок кредита, мес. */
  term: number;
}

/** Результат проверки раннего погашения */
export interface EarlyRepaymentResult {
  /** Экономия процентов, ₽ */
  savedInterest: number;
  /** Оставшийся срок после пересчёта, мес. */
  newTermMonths: number;
}
```

#### 2. `features/early-loan-repayment/common.ts` (новый)

```ts
import { createEffect } from "effector";
import { EarlyRepaymentPayload, EarlyRepaymentResult } from "shared/types";

const delay = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

/**
 * «Сервер» проверяет раннее погашение.
 * Отказ: сумма >= 2_000_000 — лимит для раннего погашения.
 */
export const fxCheckEarlyRepaymentApi = createEffect(
  (payload: EarlyRepaymentPayload) =>
    new Promise<EarlyRepaymentResult>((resolve, reject) =>
      delay(700).then(() => {
        if (payload.amount >= 2_000_000) {
          reject(new Error("Сумма превышает лимит для раннего погашения (2 000 000 ₽)"));
        } else {
          resolve({
            savedInterest: Math.round(payload.amount * 0.015 * (payload.term / 12)),
            newTermMonths: Math.max(0, payload.term - 6),
          });
        }
      }),
    ),
);
```

#### 3. `features/early-loan-repayment/model.ts` (новый)

```ts
import { attach, combine, createEvent, createStore, sample } from "effector";
import { createGate, type Gate } from "effector-react";
import { EarlyRepaymentResult } from "shared/types";
import { fxCheckEarlyRepaymentApi } from "./common";

/** «Гнездо» фичи: на уровне модуля, известно странице и UI */
export const EarlyRepaymentGate = createGate();

/**
 * Фабрика модели (паттерн 5.5/5.6): все единицы фичи создаются
 * внутри функции и возвращаются. Gate приходит аргументом: фабрика
 * знает «жизненный цикл», но сама его не импортирует.
 */
export const createEarlyRepaymentModel = (gate: Gate) => {
  // Форма
  const $amount = createStore(0);
  const $term = createStore(36);
  const changeAmount = createEvent<number>();
  const changeTerm = createEvent<number>();
  $amount.on(changeAmount, (_, value) => value);
  $term.on(changeTerm, (_, value) => value);

  // Валидация: клиентская («сервер» добавит свой лимит — шаг 2)
  const $errors = $amount.map((amount): string[] => {
    const errors: string[] = [];
    if (amount < 10_000) errors.push("Минимальная сумма раннего погашения — 10 000 ₽");
    if (amount > 3_000_000) errors.push("Максимальная сумма раннего погашения — 3 000 000 ₽");
    return errors;
  });

  // Копия API (3.1): свои done/fail/pending, обработка — общая
  const fxCheck = attach({ effect: fxCheckEarlyRepaymentApi });
  const $checking = fxCheck.pending;
  const $result = createStore<EarlyRepaymentResult | null>(null);
  const $error = createStore<string | null>(null);

  const check = createEvent();
  sample({
    clock: check,
    source: combine($amount, $term, (amount, term) => ({ amount, term })),
    target: fxCheck,
  });

  $result.on(check, () => null).on(fxCheck.done, (_, { result }) => result);
  $error.on(check, () => null).on(fxCheck.fail, (_, { error }) => error.message);

  // «Можно отправить» (4.2): нет клиентских ошибок и запроса в полёте
  const $canCheck = combine($errors, $checking, (errors, checking) =>
    errors.length === 0 && !checking,
  );

  // «Бесплатно»: каждое открытие gate — форма и результат чистые
  const reset = createEvent();
  sample({ clock: gate.open, target: reset });
  $amount.on(reset, () => 0);
  $term.on(reset, () => 36);
  $result.on(reset, () => null);
  $error.on(reset, () => null);

  return {
    $amount,
    $term,
    changeAmount,
    changeTerm,
    $errors,
    $canCheck,
    $checking,
    $result,
    $error,
    check,
  };
};

/** Единственный экземпляр модуля: внешний API фичи */
export const {
  $amount,
  $term,
  changeAmount,
  changeTerm,
  $errors,
  $canCheck,
  $checking,
  $result,
  $error,
  check,
} = createEarlyRepaymentModel(EarlyRepaymentGate);
```

#### 4. `features/early-loan-repayment/ui/EarlyLoanRepayment.tsx` (новый)

```tsx
import React from "react";
import { useGate, useUnit } from "effector-react";
import { Alert, Button } from "shared/ui";
import {
  EarlyRepaymentGate,
  $amount,
  $term,
  changeAmount,
  changeTerm,
  $errors,
  $canCheck,
  $checking,
  $error,
  check,
} from "../model";

const TERM_OPTIONS = [12, 24, 36, 48, 60];

export const EarlyLoanRepayment: React.FC = () => {
  useGate(EarlyRepaymentGate);

  const { amount, term, errors, canCheck, checking, error } = useUnit({
    amount: $amount,
    term: $term,
    errors: $errors,
    canCheck: $canCheck,
    checking: $checking,
    error: $error,
  });

  return (
    <section className="card">
      <h2>Раннее погашение</h2>

      <label className="field">
        <span>Сумма раннего погашения</span>
        <input
          type="number"
          value={amount}
          onChange={(e) => changeAmount(Number(e.target.value))}
        />
      </label>

      <label className="field">
        <span>Оставшийся срок кредита</span>
        <select value={term} onChange={(e) => changeTerm(Number(e.target.value))}>
          {TERM_OPTIONS.map((m) => (
            <option key={m} value={m}>
              {m} мес.
            </option>
          ))}
        </select>
      </label>

      {errors.map((message) => (
        <Alert key={message} kind="error">
          {message}
        </Alert>
      ))}

      <Button onClick={() => check()} disabled={!canCheck}>
        {checking ? "Проверяем…" : "Проверить выгоду"}
      </Button>

      {error && <Alert kind="error">{error}</Alert>}
    </section>
  );
};
```

```ts
// features/early-loan-repayment/ui/index.ts
export { EarlyLoanRepayment } from "./EarlyLoanRepayment";
```

```ts
// features/early-loan-repayment/index.ts
export * from "./model";
export * from "./ui";
```

#### 5. `widgets/repayment-summary/index.tsx` (новый)

```tsx
import React from "react";
import { createGate, useGate, useStore } from "effector-react";
import { $result } from "features/early-loan-repayment";
import { formatMoney } from "shared/lib";

export const RepaymentSummaryGate = createGate();

/**
 * Виджет читает состояние фичи (4.4: widget → feature — нормально).
 * Заметь: это и есть «уязвимая точка» эссе 5.5 — виджет привязан
 * к модульному экземпляру модели.
 */
export const RepaymentSummary: React.FC = () => {
  useGate(RepaymentSummaryGate);
  const result = useStore($result);

  return (
    <section className="card">
      <h2>Выгода</h2>
      {result ? (
        <>
          <p>Проценты: {formatMoney(result.savedInterest)}</p>
          <p>Новый срок: {result.newTermMonths} мес.</p>
        </>
      ) : (
        <p className="muted">Введите сумму и нажмите «Проверить выгоду»</p>
      )}
    </section>
  );
};
```

#### 6. Страница и маршрут

```tsx
// pages/early-repayment/index.tsx (новый)
import React from "react";
import { PageLayout } from "shared/ui";
import { EarlyLoanRepayment } from "features/early-loan-repayment";
import { RepaymentSummary } from "widgets/repayment-summary";

export const EarlyRepaymentPage: React.FC = () => (
  <PageLayout title="Раннее погашение" subtitle="«Сервер» пересчитает кредит и покажет выгоду">
    <div className="grid">
      <EarlyLoanRepayment />
      <RepaymentSummary />
    </div>
  </PageLayout>
);
```

```ts
// pages/index.ts — импорт и запись в routes:
import { EarlyRepaymentPage } from "./early-repayment";

// в массиве routes:
{
  name: "Раннее погашение",
  key: "earlyRepayment",
  path: "/early-repayment",
  component: EarlyRepaymentPage,
},
```

```ts
// app/model.ts:
export type PageKey = "claims" | "history" | "earlyRepayment";
const PAGE_KEYS: readonly PageKey[] = ["claims", "history", "earlyRepayment"] as const;
```

#### 7. `features/early-loan-repayment/model.test.ts` (новый)

```ts
import { describe, expect, it } from "vitest";
import { allSettled, fork } from "effector";
import { EarlyRepaymentGate, createEarlyRepaymentModel } from "./model";

describe("early-loan-repayment: фабрика модели", () => {
  it("две инстанции фабрики изолированы", () => {
    const first = createEarlyRepaymentModel(EarlyRepaymentGate);
    const second = createEarlyRepaymentModel(EarlyRepaymentGate);

    first.changeAmount(50_000);

    expect(first.$amount.getState()).toBe(50_000);
    expect(second.$amount.getState()).toBe(0);
  });

  it("успешный проход: fork + allSettled, результат читаем из scope", async () => {
    const model = createEarlyRepaymentModel(EarlyRepaymentGate);
    const scope = fork();

    await allSettled(model.changeAmount, { scope, params: 100_000 });
    await allSettled(model.changeTerm, { scope, params: 24 });
    await allSettled(model.check, { scope });

    expect(scope.getState(model.$error)).toBeNull();
    expect(scope.getState(model.$result)?.savedInterest).toBeGreaterThan(0);
  });

  it("отказ «сервера»: ошибка в $error", async () => {
    const model = createEarlyRepaymentModel(EarlyRepaymentGate);
    const scope = fork();

    // 2 500 000 — клиентская валидация пропускает (в пределах 3 000 000),
    // «сервер» отказывает (лимит 2 000 000)
    await allSettled(model.changeAmount, { scope, params: 2_500_000 });
    await allSettled(model.check, { scope });

    expect(scope.getState(model.$error)).toContain("лимит");
  });
});
```

Почему `fork`, а не обычные вызовы (как в 5.3): фабрика создаёт новые
единицы, а `fork` + `scope.getState` — способ проверить модель в изолированной
«вселенной», не трогая «глобальное» состояние приложения (оно параллельно
живёт в браузере). Именно так в настоящем проекте тестируют модели фич
с изолированными состояниями.

</details>

---
