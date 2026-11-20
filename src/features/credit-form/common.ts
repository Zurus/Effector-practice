import { createEffect } from "effector";
import { PaymentSchedule, SendClaimPayload, SendClaimResult } from "shared/types";

/**
 * «API-слой» фичи.
 *
 * Аналог shared/api + shared/api-instances в web-credit-management:
 * там там эффекты строятся поверх сгенерированного OpenAPI-клиента,
 * здесь — фейковые обещания с задержкой, чтобы было что наблюдать.
 *
 * Это базовые эффекты; в model к ним применяются attach
 * (как в оригинале: attach({ effect: fxGetCreditByNumberCft })).
 */

/** Расчёт аннуитета (погашение платежа) */
const calculate = ({ amount, term, rate }: SendClaimPayload): PaymentSchedule => {
  const k = rate / 100 / 12;
  const payment = k === 0 ? amount / term : (amount * k) / (1 - Math.pow(1 + k, -term));
  const rounded = Math.round(payment);
  return {
    payment: rounded,
    overpayment: Math.round(payment * term - amount),
    total: Math.round(payment * term),
  };
};

/** Пересчёт графика платежей (~500 мс, как настоящий запрос) */
export const fxRefreshScheduleApi = createEffect((payload: SendClaimPayload) =>
  new Promise<PaymentSchedule>((resolve) =>
    setTimeout(() => resolve(calculate(payload)), 500)
  )
);

/**
 * Отправка заявки.
 * Шутка-подстава для тренировки обработки ошибок:
 * сумма, кратная 7, «падает» на сервере.
 */
export const fxSendClaimApi = createEffect((payload: SendClaimPayload) =>
  new Promise<SendClaimResult>((resolve, reject) =>
    setTimeout(() => {
      if (payload.amount % 7 === 0) {
        reject(
          new Error("Сервис временно недоступен (сумма кратна 7). Попробуйте другую сумму.")
        );
      } else {
        resolve({
          claimId: `CLM-${Math.floor(Math.random() * 9000 + 1000)}`,
          date: new Date().toLocaleString("ru-RU"),
        });
      }
    }, 800)
  )
);
