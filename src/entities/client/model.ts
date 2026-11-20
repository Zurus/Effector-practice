import { createEffect, restore } from "effector";
import { Client } from "shared/types";

/**
 * Сущность «Клиент» (аналог entities/account в web-credit-management).
 *
 * Сущность владеет своими данными и отдаёт готовые сторы
 * фичам и виджетам. Правило: entity не зависит от features,
 * а features зависят от entity.
 */

/** Фейковый «запрос к API»: загрузка клиента */
export const fxLoadClient = createEffect(() =>
  new Promise<Client>((resolve) => {
    setTimeout(
      () => resolve({ id: 1, fio: "Иванов Иван Иванович", monthlyIncome: 120_000 }),
      600
    );
  })
);

/** Данные клиента. null — до первого успешного запроса.
 * restore = «стор, заполняемый результатом эффекта» */
export const $client = restore(fxLoadClient, null as unknown as Client);

// TODO (упражнение 2.1): добавь рядом $clientShortName —
// $client.map((c) => formatFio(c.fio)), чтобы в ClientCard показывать «Иванов И. И.»
