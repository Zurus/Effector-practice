> Упражнения по effector · [Каталог курса](./00-README.md) — уровень 5 из 5 · решения в `<details` внутри файла.
# Уровень 5. Тестирование и инструменты

### 5.1. `createWatch` — отладка без devtools

**Файл:** `src/main.tsx`.
Подключи `createWatch` на `$schedule`, `$errors` и `$scheduleLoading`.
Печатая сумму в форме, посмотри в консоли порядок событий и объясни своими словами:
почему «Пересчёт…» мигает, и когда `$errors` меняется **без** пересчёта графика.

<details>
<summary>Решение</summary>

```ts
// src/main.tsx
import { createWatch } from "effector";
import { $schedule, $errors, $scheduleLoading } from "features/credit-form";

createWatch({ unit: $schedule, fn: (v) => console.log("[schedule]", v) });
createWatch({ unit: $errors, fn: (v) => console.log("[errors]", v) });
createWatch({ unit: $scheduleLoading, fn: (v) => console.log("[loading]", v) });
```

Что наблюдать:
- каждое изменение суммы/срока: `[loading] true` → (500 мс) → `[loading] false` + `[schedule] {…}`;
- смена **срока** на 84 мес. у «Альфы» (макс. 60): `[errors]` появляется **тут же**,
  а `[schedule]` — только после «запроса» — валидация синхронна, расчёт «асинхронен».

Почему `createWatch`, а не `store.watch`? `createWatch` — «вечный» наблюдатель
(подписку нельзя снять), созданный именно для отладки; `store.watch` возвращает
функцию отписки. В продакшене эти строки, конечно, удаляешь.

</details>

### 5.2. Рефакторинг: один `useUnit` вместо десяти `useStore`

**Файл:** `src/features/credit-form/ui/CreditForm.tsx`.
Замени все `useStore` на **один** `useUnit({ … })`. JSX при этом должен остаться
почти без изменений (ключи объекта — это имена переменных в компоненте).

<details>
<summary>Решение</summary>

```tsx
import { useGate, useUnit } from "effector-react";

export const CreditForm: React.FC = () => {
  useGate(CreditFormGate);

  const {
    products,
    product,
    amount,
    term,
    errors,
    schedule,
    scheduleLoading,
    sending,
    claimResult,
    claimError,
  } = useUnit({
    products: $creditProducts,
    product: $selectedProduct,
    amount: $amount,
    term: $term,
    errors: $errors,
    schedule: $schedule,
    scheduleLoading: $scheduleLoading,
    sending: $sending,
    claimResult: $claimResult,
    claimError: $claimError,
  });

  // …остальной JSX не меняется
};
```

Почему это «по-взрослому»: одна точка подписки, легко добавить/убрать поле,
и события можно передать тем же способом (`onClick: sendClaim`) — без стрелок.

</details>

### 5.3. Тесты: сущность (vitest)

**Шаги:**
1. `npm i -D vitest`;
2. в `package.json` скрипт `"test": "vitest run"`;
3. файл `src/entities/credit/model.test.ts`.

Напиши тест: эффект `fxGetCreditProducts` грузит 3 продукта, по умолчанию выбран
«alpha»; после `selectCreditProduct("mortgage")` выбранный — «mortgage».

Подсказка: ждать завершение эффекта помогает

```ts
const waitFor = (unit: { watch: (fn: () => void) => void }) =>
  new Promise<void>((resolve) => unit.watch(resolve));
```

<details>
<summary>Решение</summary>

```ts
// src/entities/credit/model.test.ts
import { describe, expect, it } from "vitest";
import {
  fxGetCreditProducts,
  selectCreditProduct,
  $creditProducts,
  $selectedProduct,
} from "./model";

const waitFor = (unit: { watch: (fn: () => void) => void }) =>
  new Promise<void>((resolve) => unit.watch(resolve));

describe("entities/credit", () => {
  it("загружает продукты и переключает выбор", async () => {
    fxGetCreditProducts();
    await waitFor(fxGetCreditProducts.done);

    expect($creditProducts.getState()).toHaveLength(3);
    expect($selectedProduct.getState()?.id).toBe("alpha");

    selectCreditProduct("mortgage");
    expect($selectedProduct.getState()?.id).toBe("mortgage");
  });
});
```

Почему это работает:
- vitest читает **vite.config.ts**, поэтому алиасы (`shared/types`) разрешаются сами;
- модель — глобальный синглтон (создаётся при импорте модуля): тесты в файле
  исполняются последовательно и делят состояние — для «сквозных» проверок это ок,
  но про это стоит помнить, когда допишешь тестов много;
- `unit.watch` существует у **любой** единицы: события, эффекты (и их `done`/`fail`),
  сторов. Это главный инструмент «дождись, когда effector сделало своё дело».

Запуск: `npm test`.

</details>

### 5.4. Тесты: валидация формы

**Файл (новый):** `src/features/credit-form/model/index.test.ts`.

Тест: после загрузки продуктов `changeAmount(1_000)` даёт ровно одну ошибку
(«меньше минимальной»); `changeAmount(300_000)` — ноль ошибок.

<details>
<summary>Решение</summary>

```ts
// src/features/credit-form/model/index.test.ts
import { describe, expect, it } from "vitest";
import { fxGetCreditProducts } from "entities/credit";
import { changeAmount, $errors } from "./index";

const waitFor = (unit: { watch: (fn: () => void) => void }) =>
  new Promise<void>((resolve) => unit.watch(resolve));

describe("credit-form: валидация", () => {
  it("показывает и снимает ошибку по сумме", async () => {
    fxGetCreditProducts();
    await waitFor(fxGetCreditProducts.done);

    changeAmount(1_000);
    expect($errors.getState()).toHaveLength(1);
    expect($errors.getState()[0]).toContain("меньше минимальной");

    changeAmount(300_000);
    expect($errors.getState()).toHaveLength(0);
  });
});
```

Видишь, ради чего вся эта архитектура: тест **не знает** про React, про JSX,
про инпуты — он знает только «событие → состояние». UI здесь — последняя миля.

</details>

### 5.5. Эссе: «модель на каждом gate» (фактории моделей)

В оригинальном проекте модель создаётся **в момент открытия gate**:

```tsx
const EarlyLoanRepaymentGate = createGate();
const { model, component } = createEarlyLoanRepaymentModel(EarlyLoanRepaymentGate);
```

Функция-фабрика принимает gate и **возвращает** сторы/события, созданные внутри
тела функции. Напиши эссе на 10–20 предложений:

1. Что изменится в **этом** проекте, если перенести модели фич на фабричный паттерн?
2. Что мы получим «бесплатно» (подсказка: «сброс» состояния при повторном открытии)?
3. Что **сломается** у нас (подсказка: `widgets/credit-summary` читает `$schedule`
   из модели фичи — а чья это будет модель, если её создают на каждом открытии)?
4. Зачем в original это оправдано (несколько параллельных «процессов» одного типа,
   изоляция, scope) и чем это стоит.

Критерии: упомянуты scope/фабрика, изоляция состояний, проблема доступа
виджетов к состоянию фичи, честная оценка цены паттерна. Решение «в голове» —
нет; это задача про осознанность выбора.

---

