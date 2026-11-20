> Упражнения по effector · [Каталог курса](./00-README.md) — уровень 4 · решения в `<details` внутри файла.
# Уровень 4. Архитектура

Задачи уровня: новые модули, слои, контракты между ними.

### 4.1. Новая сущность `entities/purpose`

**Файлы (новые):** [`src/entities/purpose/model.ts`](../src/entities/purpose/model.ts), [`src/entities/purpose/index.ts`](../src/entities/purpose/index.ts).
**Файлы (правка):** [`features/credit-form/model/index.ts`](../src/features/credit-form/model/index.ts), [`ui/CreditForm.tsx`](../src/features/credit-form/ui/CreditForm.tsx).

Создай сущность «Назначение кредита»: список из 3–4 позиций
(«Авто», «Образование», «Ремонт», «Отпуск»), загружаемый эффектом
(~600 мс). Сущность владеет: `fxGetPurposes`, `$purposes`, `selectPurpose`,
`$selectedPurposeId`, `$selectedPurpose` (combine).

В форме — селект «Назначение». Загрузка списка — при открытии `CreditFormGate`.

Подсказка: это копия `entities/credit` — сравнивай структуру построчно.

<details>
<summary>Решение</summary>

```ts
// src/entities/purpose/model.ts
import { combine, createEffect, createEvent, createStore, restore } from "effector";

export interface Purpose {
  id: string;
  name: string;
}

const PURPOSES: Purpose[] = [
  { id: "car", name: "Авто" },
  { id: "education", name: "Образование" },
  { id: "repair", name: "Ремонт" },
  { id: "vacation", name: "Отпуск" },
];

/** Фейковый «запрос к API»: список назначений */
export const fxGetPurposes = createEffect(() =>
  new Promise<Purpose[]>((resolve) => setTimeout(() => resolve(PURPOSES), 600))
);

export const $purposes = restore(fxGetPurposes, []);

export const selectPurpose = createEvent<string>();
export const $selectedPurposeId = createStore("car").on(selectPurpose, (_, id) => id);

export const $selectedPurpose = combine(
  $purposes,
  $selectedPurposeId,
  (list, id): Purpose | null => list.find((p) => p.id === id) ?? null
);
```

```ts
// src/entities/purpose/index.ts
export * from "./model";
```

```ts
// features/credit-form/model/index.ts
import { fxGetPurposes } from "entities/purpose";
sample({ clock: CreditFormGate.open, target: fxGetPurposes });
```

```tsx
// CreditForm.tsx — рядом с селектом продукта
const purposes = useStore($purposes);
const purpose = useStore($selectedPurpose);

<label className="field">
  <span>Назначение</span>
  <select
    value={purpose?.id ?? ""}
    onChange={(e) => selectPurpose(e.target.value)}
    disabled={!purposes.length}
  >
    {!purposes.length && <option value="">Загрузка…</option>}
    {purposes.map((p) => (
      <option key={p.id} value={p.id}>{p.name}</option>
    ))}
  </select>
</label>
```

Доведение до «оригинала»: добавь `$selectedPurpose` в плат-лоад (`purpose: id`)
и передавай в `fxSendClaimApi` — чтобы в «сервисе» видеть назначение.

</details>

### 4.2. Производный стор `$canSend`

Сейчас `disabled={sending || errors.length > 0}` — бизнес-правило живёт в JSX.
Вынеси его в модель: `$canSend: boolean` — можно ли отправлять заявку.
Усложни правило: заявка доступна только если **график уже рассчитан**
(нет «грязных» пересчётов и есть результат).

<details>
<summary>Решение</summary>

```ts
// model/index.ts
export const $canSend = combine(
  $errors,
  $schedule,
  $scheduleLoading,
  $sending,
  (errors, schedule, scheduleLoading, sending): boolean =>
    errors.length === 0 && schedule !== null && !scheduleLoading && !sending
);
```

```tsx
// CreditForm.tsx
const canSend = useStore($canSend);
<Button onClick={() => sendClaim()} disabled={!canSend}>
  {sending ? "Отправляем…" : "Отправить заявку"}
</Button>
```

Почему это важно: правило переехало из представления в модель — его можно
тестировать без React и менять в одном месте. В original те же «можно ли отправить»
живут в `canSend`/`isCanApply`-сторах моделей фич.

</details>

### 4.3. Раздели модель: вынеси валидацию

Модель кредитной формы растёт (задания 3.7–3.8 показали, что). Вынеси валидацию
в отдельный модуль `features/credit-form/model/validation.ts`, а из `model/index.ts`
переэкспортируй, чтобы **никто** (UI, тесты, другие фичи) не заметил переезда.

Подсказка: сначала попробуй «два файла» (validation ↔ index) и запусти проект —
потом посмотри, почему чистое решение требует третьего файла, `fields.ts`.

<details>
<summary>Решение</summary>

Важно: решение из двух файлов (validation импортирует из index, index
реэкспортирует из validation) — циклический импорт. На ES-модулях в браузере
оно обычно прощается, но в бандлах (esbuild/webpack → CJS) при цикле
`$amount` ещё не инициализирован и падает с `expect first argument be an object`.
Поэтому — три файла:

```ts
// features/credit-form/model/fields.ts — новые
import { createEvent, createStore } from "effector";

export const changeAmount = createEvent<number>();
export const changeTerm = createEvent<number>();

export const $amount = createStore(300_000).on(changeAmount, (_, value) => value);
export const $term = createStore(36).on(changeTerm, (_, value) => value);
```

```ts
// features/credit-form/model/validation.ts — новые
import { combine } from "effector";
import { $selectedProduct } from "entities/credit";
import { Messages } from "shared/messages";
import { $amount, $term } from "./fields";

/** Ошибки формы: пересчитываются при изменении любого из трёх сторов */
export const $errors = combine(
  $amount,
  $term,
  $selectedProduct,
  (amount, term, product): string[] => {
    if (!product) return [];
    const errors: string[] = [];
    if (amount < product.minAmount) errors.push(Messages.amountLessThanMin(product));
    if (amount > product.maxAmount) errors.push(Messages.amountGreaterThanMax(product));
    if (term > product.maxTermMonths) errors.push(Messages.termGreaterThanMax(product));
    return errors;
  }
);
```

```ts
// features/credit-form/model/index.ts
// удалить определения $amount/$term/changeAmount/changeTerm и блок с $errors;
// убрать импорт Messages; добавить:
import { changeAmount, changeTerm, $amount, $term } from "./fields";
import { $errors } from "./validation";

export * from "./fields";
export { $errors };
```

Проверка: `npm run build`; UI, `$canSend` (задание 4.2) и тест (5.2) работают
без правок — наружу ничего не изменилось.

Вопрос на подумать: почему нельзя «просто» сделать два файла (validation ↔ index)
и в чём разница между циклом в ES-модулях и в бандле CJS?

</details>

### 4.4. Виджет «Предпросмотр графика»

**Файлы (новые):** [`src/widgets/payment-preview/model.ts`](../src/widgets/payment-preview/model.ts), [`src/widgets/payment-preview/index.tsx`](../src/widgets/payment-preview/index.tsx).
**Файл (правка):** [`pages/claims/index.tsx`](../src/pages/claims/index.tsx).

Виджет со **своей** моделью: `$paymentPreview` — первые 3 строки графика
(месяц, платёж, остаток долга; остаток приближённо = `total - payment * month`).
Виджет живёт только на странице заявки (gate как в других).

Подсказка: «вход» виджета — `$schedule` из фичи; «выход» — свой производный стор.
Модель виджета не знает о форме: она подписана только на стор графика.

<details>
<summary>Решение</summary>

```ts
// src/widgets/payment-preview/model.ts
import { $schedule } from "features/credit-form";

export interface PreviewRow {
  month: number;
  payment: number;
  debt: number;
}

/** Первые 3 строки графика (остаток долга — приближённо, аннуитет не раскладываем) */
export const $paymentPreview = $schedule.map((schedule): PreviewRow[] => {
  if (!schedule) return [];
  return [1, 2, 3].map((month) => ({
    month,
    payment: schedule.payment,
    debt: Math.max(0, schedule.total - schedule.payment * month),
  }));
});
```

```tsx
// src/widgets/payment-preview/index.tsx
import React from "react";
import { createGate, useGate, useStore } from "effector-react";
import { formatMoney } from "shared/lib";
import { $paymentPreview } from "./model";

export const PaymentPreviewGate = createGate();

export const PaymentPreview: React.FC = () => {
  useGate(PaymentPreviewGate);
  const rows = useStore($paymentPreview);

  return (
    <section className="card">
      <h2>Первые три платежа</h2>
      {rows.length === 0 ? (
        <p className="muted">График ещё не рассчитан</p>
      ) : (
        <table className="table">
          <thead>
            <tr><th>Месяц</th><th>Платёж</th><th>Остаток долга</th></tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.month}>
                <td>{row.month}</td>
                <td>{formatMoney(row.payment)}</td>
                <td>{formatMoney(row.debt)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </section>
  );
};
```

```tsx
// pages/claims/index.tsx — компонент рендерится напрямую
// (gate он откроет сам через useGate)
import { PaymentPreview } from "widgets/payment-preview";
// под .grid:
<PaymentPreview />
```

Заметь направление зависимости: `widget → feature (стор)` — это нормально
(виджет потребляет готовое состояние). Если бы виджету пришлось **править**
состояние фичи — это был бы повод перенести логику в сущность.

</details>

### 4.5. Фича «Сравнение продуктов»

**Файлы (новые):** [`src/features/compare-products/model.ts`](../src/features/compare-products/model.ts),
[`src/features/compare-products/ui/CompareProducts.tsx`](../src/features/compare-products/ui/CompareProducts.tsx),
[`src/features/compare-products/ui/index.ts`](../src/features/compare-products/ui/index.ts), [`src/features/compare-products/index.ts`](../src/features/compare-products/index.ts).
**Файл (правка):** [`pages/claims/index.tsx`](../src/pages/claims/index.tsx).

Фича показывает таблицу «два продукта рядом»: первый — выбранный в форме
(`$selectedProduct` из сущности), второй — выбирается в этой фиче.
Данные (список продуктов) фиче **не принадлежат** — она читает `$creditProducts`.

Модель: `CompareProductsGate`, `selectSecondProduct`, `$secondProductId`
(по умолчанию — «prime»), `$secondProduct` (combine), `$comparison` — пара продуктов.

<details>
<summary>Решение</summary>

```ts
// src/features/compare-products/model.ts
import { combine, createEvent, createStore } from "effector";
import { createGate } from "effector-react";
import { $creditProducts, $selectedProduct } from "entities/credit";
import { CreditProduct } from "shared/types";

export const CompareProductsGate = createGate();

/** Второй продукт выбирается именно в этой фиче */
export const selectSecondProduct = createEvent<string>();
export const $secondProductId = createStore("prime");

export const $secondProduct = combine(
  $creditProducts,
  $secondProductId,
  (list, id): CreditProduct | null => list.find((p) => p.id === id) ?? null
);

/** Пара для таблицы: [из формы, выбранный здесь] */
export const $comparison = combine(
  $selectedProduct,
  $secondProduct,
  (first, second): [CreditProduct | null, CreditProduct | null] => [first, second]
);
```

```tsx
// src/features/compare-products/ui/CompareProducts.tsx
import React from "react";
import { useGate, useStore } from "effector-react";
import { formatMoney } from "shared/lib";
import {
  CompareProductsGate,
  $comparison,
  selectSecondProduct,
} from "../model";

export const CompareProducts: React.FC = () => {
  useGate(CompareProductsGate);
  const [first, second] = useStore($comparison);

  return (
    <section className="card">
      <h2>Сравнение продуктов</h2>

      <label className="field">
        <span>С чем сравнивать</span>
        <select
          value={second?.id ?? ""}
          onChange={(e) => selectSecondProduct(e.target.value)}
          disabled={!second}
        >
          {!second && <option value="">Загрузка…</option>}
          {second && (
            <option value={second.id}>{second.name}</option>
          )}
        </select>
      </label>

      <table className="table">
        <thead>
          <tr>
            <th></th>
            <th>{first?.name ?? "—"}</th>
            <th>{second?.name ?? "—"}</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Ставка</td>
            <td>{first ? `${first.rate}%` : "—"}</td>
            <td>{second ? `${second.rate}%` : "—"}</td>
          </tr>
          <tr>
            <td>От</td>
            <td>{first ? formatMoney(first.minAmount) : "—"}</td>
            <td>{second ? formatMoney(second.minAmount) : "—"}</td>
          </tr>
          <tr>
            <td>До</td>
            <td>{first ? formatMoney(first.maxAmount) : "—"}</td>
            <td>{second ? formatMoney(second.maxAmount) : "—"}</td>
          </tr>
          <tr>
            <td>Срок</td>
            <td>{first ? `${first.maxTermMonths} мес.` : "—"}</td>
            <td>{second ? `${second.maxTermMonths} мес.` : "—"}</td>
          </tr>
        </tbody>
      </table>
    </section>
  );
};
```

```ts
// src/features/compare-products/ui/index.ts
export { CompareProducts } from "./CompareProducts";
```

```ts
// src/features/compare-products/index.ts
export * from "./model";
export * from "./ui";
```

```tsx
// pages/claims/index.tsx
import { CompareProducts } from "features/compare-products";
// после PaymentPreview:
<CompareProducts />
```

Доведение: в селекте «с чем сравнивать» покажи **все** продукты, кроме выбранного
в форме (нужен `$creditProducts` + фильтрация в JSX — это UI-логика, не модель).

</details>

### 4.6. Два клиента

**Файлы (правка):** [`src/entities/client/model.ts`](../src/entities/client/model.ts), [`src/widgets/client-card/index.tsx`](../src/widgets/client-card/index.tsx),
[`src/features/credit-form/model/index.ts`](../src/features/credit-form/model/index.ts).

Сейчас сущность «клиент» грузит одного зашитого человека. Сделай так, как в реальном
банке: сущность владеет **списком** клиентов (3 штуки, один с доходом ниже
`MIN_MONTHLY_INCOME`) и выбранного.

- `fxLoadClients` (~600 мс) → `$clients` (restore);
- `selectClient`, `$clientId` (по умолчанию — 1);
- `$client` теперь **combine** из списка и id (не restore!);
- `$isEligible` — производный: доход клиента ≥ `MIN_MONTHLY_INCOME`.

В `ClientCard` — селект клиента и метка «доход достаточен / ниже минимума».
Триггер загрузки в `credit-form` меняется с `fxLoadClient` на `fxLoadClients`.

<details>
<summary>Решение</summary>

```ts
// src/entities/client/model.ts
import { combine, createEffect, createEvent, createStore, restore } from "effector";
import { MIN_MONTHLY_INCOME } from "shared/constants";
import { Client } from "shared/types";

const CLIENTS: Client[] = [
  { id: 1, fio: "Иванов Иван Иванович", monthlyIncome: 120_000 },
  { id: 2, fio: "Петрова Анна Сергеевна", monthlyIncome: 85_000 },
  { id: 3, fio: "Сидоров Павел Николаевич", monthlyIncome: 25_000 },
];

/** Фейковый «запрос к API»: список клиентов */
export const fxLoadClients = createEffect(() =>
  new Promise<Client[]>((resolve) => setTimeout(() => resolve(CLIENTS), 600))
);

export const $clients = restore(fxLoadClients, []);

export const selectClient = createEvent<number>();
export const $clientId = createStore(1).on(selectClient, (_, id) => id);

/** Выбранный клиент — combine (не restore: состояние собирается из двух источников) */
export const $client = combine(
  $clients,
  $clientId,
  (list, id): Client | null => list.find((c) => c.id === id) ?? null
);

/** Клиент подходит по доходу */
export const $isEligible = $client.map(
  (c) => c !== null && c.monthlyIncome >= MIN_MONTHLY_INCOME
);
```

```ts
// features/credit-form/model/index.ts — триггер при открытии gate:
sample({ clock: CreditFormGate.open, target: fxLoadClients });
```

```tsx
// widgets/client-card/index.tsx
const clients = useStore($clients);
const clientId = useStore($clientId);
const isEligible = useStore($isEligible);

<section className="card">
  {!clients.length ? (
    <p className="muted">Загружаем данных клиентов…</p>
  ) : (
    <>
      <select value={clientId} onChange={(e) => selectClient(Number(e.target.value))}>
        {clients.map((c) => (
          <option key={c.id} value={c.id}>{c.fio}</option>
        ))}
      </select>
      {client && <span className="muted">Доход: {formatMoney(client.monthlyIncome)}/мес</span>}
      {!isEligible && (
        <Alert kind="error">Доход ниже минимального для рассматривания</Alert>
      )}
    </>
  )}
</section>
```

Проверь: `$dti` в виджете-сводке **пересчитывается** при смене клиента —
никто, кроме сущности, об этом не знал. Это и есть контракт сущности:
«вот список, вот выбранный, вот пригодный» — и всё.

</details>

---

