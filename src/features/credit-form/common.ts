import { createEffect } from "effector";
import { fakeApi } from "shared/fake-api";
import { SendClaimPayload } from "shared/types";

/**
 * «API-слой» фичи.
 *
 * Аналог shared/api + shared/api-instances в web-credit-management:
 * там эффекты строятся поверх сгенерированного OpenAPI-клиента,
 * здесь — поверх фейкового «сервера» в shared/fake-api.
 *
 * Всё «поведение сервера» (данные, задержки, отказы) — в fake-api;
 * здесь только эффекты-обёртки. Это базовые эффекты; в model
 * к ним применяются attach (как в оригинале:
 * attach({ effect: fxGetCreditByNumberCft })).
 */

/** Пересчёт графика платежей */
export const fxRefreshScheduleApi = createEffect((payload: SendClaimPayload) =>
  fakeApi.refreshSchedule(payload)
);

/**
 * Отправка заявки.
 * Шутка-подстава для тренировки обработки ошибок:
 * сумма, кратная 7, «падает» на сервере (правило — fakeApiConfig.claimRejectWhen).
 */
export const fxSendClaimApi = createEffect((payload: SendClaimPayload) =>
  fakeApi.sendClaim(payload)
);
