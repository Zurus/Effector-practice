import { combine, createEffect, createEvent, createStore, restore } from "effector";
import { CreditProduct } from "shared/types";

/**
 * Сущность «Кредитные продукты» (аналог entities/account:
 * $accountOptions строился из данных web_product_info/Account).
 */

const PRODUCTS: CreditProduct[] = [
  {
    id: "alpha",
    name: "Потребительский «Альфа»",
    rate: 14.9,
    minAmount: 50_000,
    maxAmount: 1_000_000,
    maxTermMonths: 60,
  },
  {
    id: "prime",
    name: "Кредит «Прима»",
    rate: 12.5,
    minAmount: 100_000,
    maxAmount: 3_000_000,
    maxTermMonths: 84,
  },
  {
    id: "mortgage",
    name: "Ипотека",
    rate: 19.2,
    minAmount: 500_000,
    maxAmount: 15_000_000,
    maxTermMonths: 240,
  },
];

/** Фейковый «запрос к API»: список продуктов */
export const fxGetCreditProducts = createEffect(() =>
  new Promise<CreditProduct[]>((resolve) => setTimeout(() => resolve(PRODUCTS), 400))
);

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
