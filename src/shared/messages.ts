import { CreditProduct } from "shared/types";
import { formatMoney } from "shared/lib";

/**
 * Тексты сообщений (аналог shared/messages в web-credit-management).
 * Храним не строки, а функции — чтобы подставлять данные.
 */
export const Messages = {
  amountLessThanMin: (p: CreditProduct) =>
    `Сумма меньше минимальной для «${p.name}» — ${formatMoney(p.minAmount)}`,
  amountGreaterThanMax: (p: CreditProduct) =>
    `Сумма больше максимальной для «${p.name}» — ${formatMoney(p.maxAmount)}`,
  termGreaterThanMax: (p: CreditProduct) =>
    `Срок больше максимального для «${p.name}» — ${p.maxTermMonths} мес.`,
} as const;
