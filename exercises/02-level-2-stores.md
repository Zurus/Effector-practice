> Упражнения по effector · [Каталог курса](./00-README.md) — уровень 2 из 5 · решения в `<details` внутри файла.
# Уровень 2. Сторы и события

Все задачи уровня — «мелкие, но честные» изменения. Каждое — 10–40 минут.

### 2.1. `$clientShortName` (TODO в коде)

**Файлы:** `entities/client/model.ts`, `widgets/client-card/index.tsx`.
Добавь стор `$clientShortName` (через `map` + `formatFio` из `shared/lib`)
и выведи его в карточке клиента вместо полного ФИО.

<details>
<summary>Решение</summary>

```ts
// entities/client/model.ts
import { formatFio } from "shared/lib";

export const $clientShortName = $client.map((c) => (c ? formatFio(c.fio) : ""));
```

```tsx
// widgets/client-card/index.tsx
const shortName = useStore($clientShortName);
// <span className="client-card__fio">{shortName || client.fio}</span>
```

</details>

### 2.2. Срок из списка (TODO в коде)

**Файл:** `features/credit-form/ui/CreditForm.tsx`.
Замени `<input>` для «Срок» на `<select>` с вариантами из `TERM_OPTIONS`.
Модель не трогай.

<details>
<summary>Решение</summary>

```tsx
<select value={term} onChange={(e) => changeTerm(Number(e.target.value))}>
  {TERM_OPTIONS.map((m) => (
    <option key={m} value={m}>{m} мес.</option>
  ))}
</select>
```

Ключевой момент: `changeTerm` — то же событие, что и раньше. UI поменялся, модель нет —
в этом и смысл разделения model/ui.

</details>

### 2.3. Фильтр истории по статусу (TODO в коде)

**Файл:** `features/status-history/ui/StatusHistory.tsx`.
Модель уже готова: `$statusOptions`, `$statusFilter`, `setStatusFilter`, `$visibleStatuses`.
Добавь `<select>` с вариантом «Все» рядом с кнопкой «Обновить».

<details>
<summary>Решение</summary>

```tsx
<select value={filter} onChange={(e) => setStatusFilter(e.target.value)}>
  <option value="all">Все</option>
  {options.map((s) => (
    <option key={s} value={s}>{s}</option>
  ))}
</select>
```

Таблица уже читает `$visibleStatuses` — ничего ещё менять не нужно. Сила
декларативности: состояние описано один раз, UI — функция от него.

</details>

### 2.4. Критическое ПДН (TODO в коде)

**Файлы:** `widgets/credit-summary/model.ts`, `index.tsx`.
Добавь `$dtiCritical` (ПДН > `CRITICAL_DTI`) и красное предупреждение
«ПДН выше критического» под сводкой.

<details>
<summary>Решение</summary>

```ts
// model.ts
export const $dtiCritical = $dti.map((d) => d !== null && d > CRITICAL_DTI);
```

```tsx
// index.tsx
const dtiCritical = useStore($dtiCritical);
{dtiCritical && <Alert kind="error">ПДН выше критического — вероятен отказ</Alert>}
```

(импорт `Alert` — из `shared/ui`).

</details>

### 2.5. Страница «О приложении» (TODO в коде)

**Файлы:** `app/model.ts`, `pages/about/index.tsx` (новый), `pages/index.ts`.
Расширь `PageKey`, создай страницу, добавь маршрут. Навигация подхватит её сама.

<details>
<summary>Решение</summary>

```ts
// app/model.ts
export type PageKey = "claims" | "history" | "about";
```

```tsx
// pages/about/index.tsx
import React from "react";
import { PageLayout } from "shared/ui";

export const AboutPage: React.FC = () => (
  <PageLayout title="О приложении" subtitle="Тренажёр effector">
    <p>Мини-копия структуры web-credit-management для тренировки effector.</p>
  </PageLayout>
);
```

```ts
// pages/index.ts — в routes:
{ name: "О приложении", key: "about", path: "/about", component: AboutPage },
```

</details>

### 2.6. Кнопка «Сбросить»

**Файлы:** `shared/constants.ts`, `features/credit-form/model/index.ts`, `ui/CreditForm.tsx`.
Событие `resetForm` возвращает `$amount` и `$term` к значениям по умолчанию.
Подсказка: значения по умолчанию сейчас «запечены» в `createStore(300_000)` —
вынеси их в константы.

<details>
<summary>Решение</summary>

```ts
// shared/constants.ts
export const DEFAULT_AMOUNT = 300_000;
export const DEFAULT_TERM = 36;
```

```ts
// model/index.ts
export const resetForm = createEvent();
$amount.on(resetForm, () => DEFAULT_AMOUNT);
$term.on(resetForm, () => DEFAULT_TERM);
```

```tsx
// CreditForm.tsx — рядом с «Отправить заявку»
<Button onClick={() => resetForm()}>Сбросить</Button>
```

Обрати внимание: у редьюсера `.on` есть две формы — `(state, payload) => ...`
(событие с данными) и `() => ...` (событие без данных, только триггер).

</details>

### 2.7. Быстрые суммы

**Файлы:** `features/credit-form/model/index.ts`, `ui/CreditForm.tsx`.
Добавь событие `changeAmountBy` (дельта) и две кнопки «+10 000» / «+100 000».

Подсказка: второй аргумент редьюсера `.on(event, (current, payload) => ...)` —
это payload события.

<details>
<summary>Решение</summary>

```ts
// model/index.ts
export const changeAmountBy = createEvent<number>();
$amount.on(changeAmountBy, (current, delta) => current + delta);
```

```tsx
<Button onClick={() => changeAmountBy(10_000)}>+10 000</Button>
<Button onClick={() => changeAmountBy(100_000)}>+100 000</Button>
```

Проверь: два клика «+10 000» меняют сумму на 20 000. Редьюсер **не** перезаписывает
стор значением события — он принимает текущее состояние и payload.

</details>

### 2.8. «Недавно выбранные продукты»

**Файл:** `features/credit-form/model/index.ts` (+ вывод в `CreditForm`).
Стор `$recentProducts: string[]` — последние 3 имени выбранных продуктов
(без повторов, новое — первым). Выведи строкой под формой.

Подсказка: `sample` умеет брать **стор** как `clock` (срабатывает при каждом
изменении) и **стор** как `source` (значение передаётся в `fn`).

<details>
<summary>Решение</summary>

```ts
export const $recentProducts = createStore<string[]>([]);

sample({
  clock: $selectedProductId,
  source: combine($creditProducts, $recentProducts),
  fn: ([products, recent], id) => {
    const name = products.find((p) => p.id === id)?.name;
    if (!name) return recent; // список ещё не загружен
    return [name, ...recent.filter((n) => n !== name)].slice(0, 3);
  },
});
```

```tsx
// CreditForm
const recent = useStore($recentProducts);
{recent.length > 0 && <p className="muted">Недавно: {recent.join(" → ")}</p>}
```

Почему не `getState()` внутри `fn`? Событие/стор как `source` — каноничный способ
«подсмотреть актуальное значение»: так код остаётся реактивным и тестируемым.

</details>

### 2.9. Счётчик визитов по страницам

**Файлы:** `app/model.ts`, `app/index.tsx`.
`$pageVisits: Record<PageKey, number>` — сколько раз открывали каждую страницу.
Покажи счётчик текущей страницы в шапке (рядом с названием приложения).

<details>
<summary>Решение</summary>

```ts
// app/model.ts
export const $pageVisits = createStore<Record<PageKey, number>>({});
sample({
  clock: selectPage,
  source: $pageVisits,
  fn: (visits, key) => ({ ...visits, [key]: (visits[key] ?? 0) + 1 }),
});
```

```tsx
// app/index.tsx
const visits = useStore($pageVisits);
// в шапке:
{APP_NAME} · визит №{visits[activePage] ?? 0}
```

Заметь: `selectPage` — clock (когда), `$pageVisits` — source (что меняем).
Один и тот же стор и триггерит, и обновляется.

</details>

---

