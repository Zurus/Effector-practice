> Упражнения по effector · [Каталог курса](./00-README.md) — уровень 0 · решения в `<details` внутри файла.
# Уровень 0. Первые шаги

Уровень для тех, кто ещё не трогал effector. Теории и вопросов нет — три задачи
по 15 минут, у каждой сразу видимый результат в браузере. После них `createStore`,
`createEvent`, `combine` и `sample` перестают быть магией.

Уже знаешь основы? → сразу [уровень 2](./02-level-2-stores.md).

### 0.1. Первый стор и событие

**Файлы:** [`entities/client/model.ts`](../src/entities/client/model.ts), [`widgets/client-card/index.tsx`](../src/widgets/client-card/index.tsx).

Добавь в карточку клиента кнопку «Поздороваться»: после нажатия под данными
клиента появится строка текста. Состояние — за сущностью (как `$client`):

- стор `$greeting: string | null` — начальное значение `null`;
- событие `greetClient` — без payload;
- по событию стор получает текст «Привет! Добро пожаловать в effector»;
- кнопка (компонент `Button` из `shared/ui`) вызывает событие из `onClick`.

<details>
<summary>Решение</summary>

```ts
// entities/client/model.ts — допиши в существующий импорт из "effector"
// createEvent и createStore, в конец файла:

export const $greeting = createStore<string | null>(null);
export const greetClient = createEvent();

// Редьюсер без payload: событие — просто «триггер»
$greeting.on(greetClient, () => "Привет! Добро пожаловать в effector");
```

```tsx
// widgets/client-card/index.tsx
import { $client, $greeting, greetClient } from "entities/client";
import { Button } from "shared/ui";

export const ClientCard: React.FC = () => {
  const client = useStore($client);
  const greeting = useStore($greeting);

  return (
    <section className="card">
      {!client ? (
        <p className="muted">Загружаем данные клиента…</p>
      ) : (
        <>
          <span className="client-card__fio">{client.fio}</span>
          <span className="muted">Доход: {formatMoney(client.monthlyIncome)}/мес</span>
          <Button onClick={() => greetClient()}>Поздороваться</Button>
        </>
      )}
      {greeting && <p className="muted">{greeting}</p>}
    </section>
  );
};
```

**Проверка:** `npm run dev` → на карточке клиента кнопка «Поздороваться» →
после нажатия под карточкой появляется строка.

</details>

**Почему это работает** (прочитай после выполнения):

- `createStore` — «переменная вне React» с текущим значением;
- `createEvent` — «кнопка», которую можно нажать откуда угодно: UI, модель, тест;
- `.on(event, reducer)` — подписка: «когда событие сработало — обнови стор»;
- `useStore` — единственный мост из стора в React: значение изменилось → перерисовка;
- состояние живёт в `model/`, а не в компоненте — первое правило проекта.

### 0.2. Первый `combine`

**Файлы:** те же два файла, что в 0.1.

Приветствие сейчас не знает, кто клиент. Добавь стор `$greetingLine` через
`combine($client, $greeting, fn)`:

- приветствие есть — `Привет, Иванов И. И.!` (краткое ФИО — `formatFio` из
  `shared/lib`; имя берём из `$client`, не хардкодим);
- приветствия нет — `null`.

В `ClientCard` покажи `$greetingLine` вместо `$greeting`.

<details>
<summary>Решение</summary>

```ts
// entities/client/model.ts — допиши в импорт из "effector" combine,
// добавь импорт formatFio:
import { formatFio } from "shared/lib";

export const $greetingLine = combine($client, $greeting, (client, greeting) => {
  if (!greeting) return null;
  return `Привет, ${formatFio(client.fio)}!`;
});
```

```tsx
// widgets/client-card/index.tsx
// useStore($greeting) → useStore($greetingLine),
// {greeting && ...} → {greetingLine && ...}:
const greetingLine = useStore($greetingLine);
{greetingLine && <p className="muted">{greetingLine}</p>}
```

**Проверка:** нажми «Поздороваться» — строка появляется с именем клиента:
`Привет, Иванов И. И.!` — а не с захардкоженным текстом из 0.1. Имя пришло
из `$client` — стор «собрал» значение из другого стора.

</details>

**Почему это работает:** `combine` — «собранный из других» стор: он пересобирается,
когда меняется **любой** из источников. Нажимаешь кнопку — изменился `$greeting` →
`$greetingLine` пересчитался сам. Дальше `combine` будет делать большую
часть работы во всех моделях.

### 0.3. Первый `sample`

**Файл:** [`entities/client/model.ts`](../src/entities/client/model.ts). UI в этой задаче не меняется!

Сделай приветствие автоматическим: как только клиент пришёл
(`fxLoadClient.done`), `$greeting` заполняется сам — текстом «Клиент загружен».
Кнопка из 0.1 остаётся как «ручной» триггер.

Подсказка: `sample({ clock, fn, target })`; `clock` — «когда», `target` —
«куда писать» (стор тоже может быть целью: в него попадает результат `fn`).

<details>
<summary>Решение</summary>

```ts
// entities/client/model.ts — допиши в импорт из "effector" sample:

sample({
  clock: fxLoadClient.done, // «когда»: эффект закончился успешно
  fn: () => "Клиент загружен",
  target: $greeting,        // «куда»: результат fn попадает в стор
});
```

**Проверка:** F5 в браузере — через ~600 мс строка появляется сама, без клика
(и через `combine` из 0.2 показывается с именем клиента).

</details>

**Почему это работает:** `sample` — «клей» effector: берёт момент (`clock`),
при желании значения (`source`), преобразует (`fn`) и передаёт результат
в другую единицу (`target`). Теперь `$greeting` обновляют две единицы —
событие `greetClient` (через `.on`) и этот `sample` — они не конфликтуют:
действует последний сработавший. Открой `features/credit-form/model/index.ts`
и посчитай там `sample` — это базовая механика всего проекта.

Вперёд — [уровень 2](./02-level-2-stores.md).

---
