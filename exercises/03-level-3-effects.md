> Упражнения по effector · [Каталог курса](./00-README.md) — уровень 3 · решения в `<details` внутри файла.
# Уровень 3. Эффекты и асинхронность

Здесь начинается «настоящий» effector: эффекты, их события (`done`/`fail`/`pending`),
гонки, повторные попытки, кэширование.

### 3.1. Ставка из «сервера»

**Файлы:** `features/credit-form/common.ts`, `model/index.ts`, `ui/CreditForm.tsx`.
Сейчас ставка берётся из `$selectedProduct.rate` и уходит в плат-лоад напрямую.
Сделай так, как в реальном приложении: эффект `fxGetRateApi` «спрашивает сервер»
(возвращает число, ~300 мс), а модель хранит его в `$rate` и подставляет в плат-лоад
вместо `product.rate`. Запрашивай ставку при открытии gate.

Подсказка: `attach` для «локальной копии», `$rate` — обычный `createStore<number | null>`.

<details>
<summary>Решение</summary>

```ts
// common.ts
/** Ставка по продукту «с сервера» */
export const fxGetRateApi = createEffect(() =>
  new Promise<number>((resolve) => setTimeout(() => resolve(14.9), 300))
);
```

```ts
// model/index.ts
const fxGetRate = attach({ effect: fxGetRateApi });
export const $rate = createStore<number | null>(null);
export const $rateLoading = fxGetRate.pending;

sample({ clock: CreditFormGate.open, target: fxGetRate });
$rate.on(fxGetRate.done, (_, { result }) => result);

// в $payload — rate из стора, а не из продукта:
const $payload = combine(
  $amount,
  $term,
  $rate,
  (amount, term, rate): SendClaimPayload | null =>
    rate === null ? null : { amount, term, rate }
);
```

```tsx
// CreditForm.tsx — в блоке графика:
{rateLoading && <span className="muted">Запрашиваем ставку…</span>}
```

Заметь: теперь плат-лоад зависит **от четырёх** сторов (вместо трёх) — и пока ставка
не пришла, `$payload === null`, фильтр не пропускает запрос. Это и есть «собираем
данные, потом шлём» — ровно та же механика, что в original для `$loanRepaymentParams`.

</details>

### 3.2. Кэш продуктов: не дёргай «сервер» повторно

Сейчас `fxGetCreditProducts` дёргается **каждый** раз при открытии gate
(уходишь на «Историю» и возвращаешься — снова 400 мс «Загрузка…»).
Добавь `$productsLoaded` и запрос только если список ещё не загружен.

<details>
<summary>Решение</summary>

```ts
// model/index.ts
const $productsLoaded = createStore(false);

sample({
  clock: CreditFormGate.open,
  source: $productsLoaded,
  filter: (loaded) => !loaded,
  target: fxGetCreditProducts,
});
$productsLoaded.on(fxGetCreditProducts.done, () => true);
```

Проверка: открой страницу → «История статусов» → обратно. Спиннера «Загрузка…» больше нет.

Куда докрутить: «освежить данные» — событие `forceRefreshProducts`, которое обнуляет
`$productsLoaded` перед вызовом эффекта.

</details>

### 3.3. Гонка запросов (race)

Пользователь быстро меняет сумму/срок/продукт. Запросы `fxRefreshSchedule`
«летят» один за другим, а приходят — в произвольном порядке: **последний пришедший**
может отвечать не на **последний отправленный**, и график отрисовывается по старым
параметрам.

Запомни «отпечаток» последнего отправленного плат-лоада и применяй результат
`fxRefreshSchedule.done` **только если** отпечаток с тех пор не менялся.

Подсказка: `done` приходит с `{ result, params }` — `params` это тот плат-лоад,
с которым эффект вызывался. Отпечаток — строка из полей плат-лоада.

<details>
<summary>Решение</summary>

```ts
// «отпечаток» плат-лоада: всё, что влияет на расчёт
const fingerprint = ({ amount, term, rate }: SendClaimPayload) =>
  `${amount}:${term}:${rate}`;

// отпечаток последнего отправленного запроса
const $lastRequestFingerprint = createStore("");
$lastRequestFingerprint.on(fxRefreshSchedule, (_fp, payload) =>
  fingerprint(payload)
);

// применяем результат только если с момента запроса параметры не менялись
$schedule.on(fxRefreshSchedule.done, (_, { result, params }) =>
  fingerprint(params) === $lastRequestFingerprint.getState()
    ? result
    : $schedule.getState()
);
```

Проверка: быстро трижды поменяй сумму — «чужой» (просроченный) результат
в график не попадёт: `$schedule` сохранит предыдущее актуальное значение,
пока не дойдёт свежий запрос.

Почему `getState()` здесь допустимо, хотя в effector от него обычно стараются
отказаться? В редьюсере `.on` мы принимаем решение «принять / отбросить» — это
проверка, а не источник данных; сам поток данных по-прежнему идёт через `sample`.
Хранить отпечаток отдельным стором (как здесь) — практичный компромисс;
полностью декларативный вариант — через `sample` с `filter` — громоздче.

</details>

### 3.4. Дебаунс «вручную»

Каждое нажатие клавиши в инпуте суммы → новый `fxRefreshSchedule`.
Сделай так, чтобы эффект срабатывал только после **400 мс тишины**.
Библиотеки не использовать.

Подсказка: `sample` на `$payload` (стор как `clock`), внутри — `setTimeout` +
`clearTimeout` в модульной переменной; результат пиши в промежуточный стор
`$debouncedPayload`, который уже целью идёт в эффект.

<details>
<summary>Решение</summary>

```ts
// model/index.ts
// Важно: в TS v22 стор нельзя вызывать как событие — нужен отдельный ивент.
const $debouncedPayload = createStore<SendClaimPayload | null>(null);
const setDebouncedPayload = createEvent<SendClaimPayload | null>();
$debouncedPayload.on(setDebouncedPayload, (_, p) => p);
let timer: ReturnType<typeof setTimeout> | null = null;

sample({
  clock: $payload,
  filter: (payload): payload is SendClaimPayload => payload !== null,
  fn: (payload) => {
    if (timer) clearTimeout(timer);
    timer = setTimeout(() => setDebouncedPayload(payload), 400);
  },
});

// старую связку «$payload → fxRefreshSchedule» заменяем:
sample({
  source: $debouncedPayload,
  filter: (payload): payload is SendClaimPayload => payload !== null,
  target: fxRefreshSchedule,
});
```

Проверка: набери сумму за три клавиши — эффект вызвался один раз.

Почему «вручную», если в effector v23 есть встроенный `debounce`?
Проект сознательно на v22 — тех же версиях, что оригинальный проект;
к тому же «ручной» дебаунс заставляет понять, что `sample` умеет работать
с **стором как clock** (срабатывает на любое изменение значения).

</details>

### 3.5. Автоповтор при ошибке

`fxSendClaim` падает, когда сумма кратна 7 (см. `common.ts`).
Сделай **одну** автоматическую повторную попытку: первый `fail` → ещё один вызов
с тем же плат-лоадом; второй `fail` → показываем ошибку пользователю.

Подсказка: счётчик `$attempts` (инкремент на `fail`, сброс на `done` и на `sendClaim`);
`sample` с `clock: fxSendClaim.fail`, а плат-лоад бери из `source`.

<details>
<summary>Решение</summary>

```ts
const $attempts = createStore(0)
  .on(sendClaim, () => 0)
  .on(fxSendClaim.done, () => 0)
  .on(fxSendClaim.fail, (n) => n + 1);

sample({
  clock: fxSendClaim.fail,
  source: $payload,
  filter: (payload): payload is SendClaimPayload =>
    payload !== null && $attempts.getState() === 1,
  target: fxSendClaim,
});
```

Как это работает: `fail` → счётчик стал 1 → `sample` пропускает плат-лоад →
повторный вызов эффекта. Если повтор тоже упал — счётчик 2, фильтр не пускает,
остался только редьюсер `$claimError` (он есть). Если повтор удался — `done`
сбрасывает счётчик.

Проверка: отправь заявку с суммой 7 000 — эффект вызвался **два** раза
(видно по `createWatch`), а пользователь увидел одну ошибку.

</details>

### 3.6. Журнал изменений

Добавь стор `$changesLog: string[]` — последние **5** изменений формы
(«Сумма: 1 000 ₽», «Срок: 48 мес.»), которые показываются под формой мелким текстом.

Подсказка: `.on(changeAmount, ...)` и `.on(changeTerm, ...)` на одном сторе;
`.slice(0, 5)` — новое в начало.

<details>
<summary>Решение</summary>

```ts
// model/index.ts
import { formatMoney } from "shared/lib";

export const $changesLog = createStore<string[]>([]);

const pushLog = (log: string[], entry: string) => [entry, ...log].slice(0, 5);

$changesLog
  .on(changeAmount, (log, v) => pushLog(log, `Сумма: ${formatMoney(v)}`))
  .on(changeTerm, (log, v) => pushLog(log, `Срок: ${v} мес.`));
```

```tsx
// CreditForm.tsx
const changesLog = useStore($changesLog);
{changesLog.length > 0 && (
  <div className="muted" style={{ marginTop: 8 }}>
    {changesLog.map((line) => (
      <div key={line}>{line}</div>
    ))}
  </div>
)}
```

Заметь: два `.on` на одном сторе — редьюсеры не конфликтуют, каждый
просто свой «слушатель» своего события.

</details>

### 3.7. Промокод

Полный цикл: поле «Промокод» + кнопка «Применить». Эффект `fxCheckPromoApi(code)`
«проверяет» код (~500 мс): код `EFFECTOR` (регистр не важен) → скидка 1,5 п.п.;
иначе → `reject(new Error("Промокод не найден"))`.
Скидка уменьшается ставку в плат-лоаде (`rate - discount`), график пересчитывается.

<details>
<summary>Решение</summary>

```ts
// common.ts
export const fxCheckPromoApi = createEffect((code: string) =>
  new Promise<number>((resolve, reject) =>
    setTimeout(() => {
      if (code.trim().toUpperCase() === "EFFECTOR") resolve(1.5);
      else reject(new Error("Промокод не найден"));
    }, 500)
  )
);
```

```ts
// model/index.ts
export const $promoCode = createStore("");
export const changePromoCode = createEvent<string>();
$promoCode.on(changePromoCode, (_, code) => code);

const fxCheckPromo = attach({ effect: fxCheckPromoApi });
export const $promoDiscount = createStore(0);
export const $promoError = createStore<string | null>(null);
export const $promoChecking = fxCheckPromo.pending;

export const applyPromo = createEvent();

sample({
  clock: applyPromo,
  source: $promoCode,
  filter: (code) => code.trim().length > 0,
  target: fxCheckPromo,
});
$promoDiscount.on(applyPromo, () => 0).on(fxCheckPromo.done, (_, { result }) => result);
$promoError.on(applyPromo, () => null).on(fxCheckPromo.fail, (_, { error }) => error.message);

// в combine плат-лоада добавляем $promoDiscount:
const $payload = combine(
  $amount,
  $term,
  $selectedProduct,
  $promoDiscount,
  (amount, term, product, discount): SendClaimPayload | null => {
    if (!product) return null;
    return { amount, term, rate: product.rate - discount };
  }
);
```

```tsx
// CreditForm.tsx
const promoCode = useStore($promoCode);
const promoError = useStore($promoError);
const promoChecking = useStore($promoChecking);

<label className="field">
  <span>Промокод</span>
  <input value={promoCode} onChange={(e) => changePromoCode(e.target.value)} />
</label>
<Button onClick={() => applyPromo()} disabled={promoChecking}>
  {promoChecking ? "Проверяем…" : "Применить"}
</Button>
{promoError && <Alert kind="error">{promoError}</Alert>}
```

Это маленькая, но **целая** фича: поле → событие → эффект → результат →
производный стор → пересчёт графика. Всё — без единого `setState`.

</details>

### 3.8. Страхование: переключатель, влияющий на плат-лоад

Добавь чекбокс «Оформить страхование». Если включён — к сумме в плат-лоаде
прибавляется 3% (`amount * 1.03`, округление до рубля). Валидация при этом
проверяет **исходную** сумму, а не увеличенную.

<details>
<summary>Решение</summary>

```ts
// model/index.ts
export const $insurance = createStore(false);
export const toggleInsurance = createEvent();
$insurance.on(toggleInsurance, (v) => !v);

// плат-лоад: amount уже «с страховкой»
const $payload = combine(
  $amount,
  $term,
  $selectedProduct,
  $insurance,
  (amount, term, product, insurance): SendClaimPayload | null => {
    if (!product) return null;
    const total = insurance ? Math.round(amount * 1.03) : amount;
    return { amount: total, term, rate: product.rate };
  }
);
```

```tsx
// CreditForm.tsx
const insurance = useStore($insurance);
<label className="field">
  <input type="checkbox" checked={insurance} onChange={() => toggleInsurance()} />
  <span>Оформить страхование (+3% к сумме)</span>
</label>
```

Вопрос на подумать: почему `$errors` не должен видеть увеличенную сумму?
(Если страховка «зашкаливает» за максимум продукта — это не ошибка пользователя,
а особенность продукта; спорно, но зафиксировали поведение.)

</details>

---

