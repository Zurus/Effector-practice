import { createEffect, restore } from "effector";
import { fakeApi } from "shared/fake-api";
import { Client } from "shared/types";

/**
 * Сущность «Клиент» (аналог entities/account в web-credit-management).
 *
 * Сущность владеет своими данными и отдаёт готовые сторы
 * фичам и виджетам. Правило: entity не зависит от features,
 * а features зависят от entity.
 */

/** «Запрос к API»: загрузка клиента (реализация — shared/fake-api) */
export const fxLoadClient = createEffect(() => fakeApi.getClient());

/** Данные клиента. null — до первого успешного запроса.
 * restore = «стор, заполняемый результатом эффекта» */
export const $client = restore(fxLoadClient, null as unknown as Client);

// TODO (упражнение 2.1): добавь рядом $clientShortName —
// $client.map((c) => formatFio(c.fio)), чтобы в ClientCard показывать «Иванов И. И.»
