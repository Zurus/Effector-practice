import { combine, createEffect, createEvent, createStore, restore } from "effector";
import { fakeApi } from "shared/fake-api";
import { CreditProduct } from "shared/types";

/**
 * Сущность «Кредитные продукты» (аналог entities/account:
 * $accountOptions строился из данных web_product_info/Account).
 */

/** «Запрос к API»: список продуктов (реализация — shared/fake-api) */
export const fxGetCreditProducts = createEffect(() => fakeApi.getCreditProducts());

/** Все загруженные продукты */
export const $creditProducts = restore(fxGetCreditProducts, []);

/** Событие: пользователь выбрал продукт в селекте */
export const selectCreditProduct = createEvent<string>();

/** Выбранный id продукта */
export const $selectedProductId = createStore("alpha").on(selectCreditProduct, (_, id) => id);

/**
 * Выбранный продукт — производный стор через combine:
 * пересчитывается при смене любого из двух сторов.
 * null, пока список не загружен.
 */
export const $selectedProduct = combine(
  $creditProducts,
  $selectedProductId,
  (products, id): CreditProduct | null => products.find((p) => p.id === id) ?? null
);
