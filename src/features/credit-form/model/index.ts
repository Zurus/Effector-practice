import { attach, combine, createEvent, createStore, sample } from "effector";
import { createGate } from "effector-react";
import { fxLoadClient } from "entities/client";
import { $selectedProduct, fxGetCreditProducts } from "entities/credit";
import { Messages } from "shared/messages";
import { PaymentSchedule, SendClaimPayload, SendClaimResult } from "shared/types";
import { fxRefreshScheduleApi, fxSendClaimApi } from "../common";

/**
 * Модель формы заявки.
 *
 * Аналог features/early-loan-repayment/model в web-credit-management:
 * вся логика — здесь, React-компоненты в ui/ только читают сторы
 * и шлют события.
 */

// --- Gate ---------------------------------------------------------------------
// createGate в модели, useGate — в компоненте (точно как в оригинале).
// Пока gate открыт (компонент на странице) — «модель работает».
export const CreditFormGate = createGate();

// Открытие gate (монтирование компонента) → загрузка начальных данных
sample({ clock: CreditFormGate.open, target: fxGetCreditProducts });
sample({ clock: CreditFormGate.open, target: fxLoadClient });

// «Локальные» копии эффектов API-слоя — как
// `const fxGetCreditLocalCft = attach({ effect: fxGetCreditByNumberCft })`
// в web-credit-management
const fxRefreshSchedule = attach({ effect: fxRefreshScheduleApi });
const fxSendClaim = attach({ effect: fxSendClaimApi });

// --- Поля формы -------------------------------------------------------------
// В оригинале поля живут в web-forms (createForm). Здесь упрощено
// до «стор на поле + событие-изменение».

export const changeAmount = createEvent<number>();
export const changeTerm = createEvent<number>();

export const $amount = createStore(300_000).on(changeAmount, (_, value) => value);
export const $term = createStore(36).on(changeTerm, (_, value) => value);

// --- Пересчёт графика -------------------------------------------------------

/**
 * Плат-лоад для расчёта: поля формы + выбранный продукт.
 * combine пересобирает его при изменении ЛЮБОГО из трёх сторов.
 */
const $payload = combine(
  $amount,
  $term,
  $selectedProduct,
  (amount, term, product): SendClaimPayload | null => {
    if (!product) return null;
    return { amount, term, rate: product.rate };
  }
);

export const $schedule = createStore<PaymentSchedule | null>(null);
// .pending — стор: true, пока эффект выполняется (v22-паттерн, ровно такой же
// и в web-credit-management: $isLoading = fx.pending)
export const $scheduleLoading = fxRefreshSchedule.pending;

/** Ключевая связка: любое изменение $payload запускает эффект-«запрос» */
sample({
  source: $payload,
  filter: (payload): payload is SendClaimPayload => payload !== null,
  target: fxRefreshSchedule,
});

$schedule.on(fxRefreshSchedule.done, (_, { result }) => result);

// --- Валидация (аналог rules из web-forms) -----------------------------------

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

// --- Отправка заявки ----------------------------------------------------------

export const sendClaim = createEvent();

export const $claimResult = createStore<SendClaimResult | null>(null);
export const $claimError = createStore<string | null>(null);
export const $sending = fxSendClaim.pending;

/** Шлём только когда плат-лоад валиден (продукт выбран) */
sample({
  clock: sendClaim,
  source: $payload,
  filter: (payload): payload is SendClaimPayload => payload !== null,
  target: fxSendClaim,
});

$claimResult.on(sendClaim, () => null).on(fxSendClaim.done, (_, { result }) => result);
$claimError.on(fxSendClaim.fail, (_, { error }) => error.message);
