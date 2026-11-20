import { describe, expect, it } from "vitest";
import { fakeApi, fakeApiConfig } from "./fake-api";

describe("fakeApi", () => {
  it("refreshSchedule: ставка 0 → платёж = сумма/срок, без переплаты", async () => {
    const s = await fakeApi.refreshSchedule({ amount: 120_000, term: 12, rate: 0 });
    expect(s).toEqual({ payment: 10_000, overpayment: 0, total: 120_000 });
  });

  it("refreshSchedule: со ставкой → переплата > 0", async () => {
    const s = await fakeApi.refreshSchedule({ amount: 300_000, term: 36, rate: 14.9 });
    expect(s.payment).toBeGreaterThan(300_000 / 36);
    expect(s.overpayment).toBeGreaterThan(0);
    // инвариант: переплата = сумма выплат − тело кредита (с точностью до округления)
    expect(Math.abs(s.overpayment - (s.total - 300_000))).toBeLessThanOrEqual(1);
  });

  it("sendClaim: сумма кратна 7 — «серверная» ошибка", async () => {
    await expect(fakeApi.sendClaim({ amount: 7000, term: 12, rate: 10 })).rejects.toThrow(
      "кратна 7",
    );
  });

  it("sendClaim: иначе — CLM-<номер> и дата", async () => {
    const res = await fakeApi.sendClaim({ amount: 1000, term: 12, rate: 10 });
    expect(res.claimId).toMatch(/^CLM-\d+$/);
    expect(res.date.length).toBeGreaterThan(0);
  });

  it("claimRejectWhen — правило, которое можно менять в конфиге", () => {
    expect(fakeApiConfig.claimRejectWhen({ amount: 14, term: 1, rate: 1 })).toBe(true);
    expect(fakeApiConfig.claimRejectWhen({ amount: 15, term: 1, rate: 1 })).toBe(false);
  });
});
