/**
 * Общие утилиты (аналог shared/lib в web-credit-management).
 */

const money = new Intl.NumberFormat("ru-RU", {
  style: "currency",
  currency: "RUB",
  maximumFractionDigits: 0,
});

export const formatMoney = (value: number) => money.format(value);

/** «Иванов Иван Иванович» → «Иванов И. И.» */
export const formatFio = (fio: string) => {
  const [last, first, middle] = fio.split(" ");
  if (!last || !first) return fio;
  return `${last} ${first[0]}.${middle ? ` ${middle[0]}.` : ""}`.trim();
};
