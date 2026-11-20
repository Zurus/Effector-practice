import { describe, expect, it } from "vitest";
import { formatFio, formatMoney } from "./lib";

describe("formatFio", () => {
  it("«Фамилия Имя Отчество» → «Фамилия И. О.»", () => {
    expect(formatFio("Иванов Иван Иванович")).toBe("Иванов И. И.");
  });

  it("работает без отчества", () => {
    expect(formatFio("Петров Пётр")).toBe("Петров П.");
  });

  it("не разбирается — возвращает строку как есть", () => {
    expect(formatFio("Иванов")).toBe("Иванов");
  });
});

describe("formatMoney", () => {
  it("форматирует рубли без копеек", () => {
    const expected = new Intl.NumberFormat("ru-RU", {
      style: "currency",
      currency: "RUB",
      maximumFractionDigits: 0,
    }).format(1500);
    expect(formatMoney(1500)).toBe(expected);
    expect(formatMoney(1500)).toContain("₽");
    expect(formatMoney(0)).not.toContain(".");
  });
});
