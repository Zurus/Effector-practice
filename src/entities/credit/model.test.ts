import { allSettled, fork } from "effector";
import { describe, expect, it } from "vitest";
import {
  $creditProducts,
  $selectedProduct,
  $selectedProductId,
  fxGetCreditProducts,
  selectCreditProduct,
} from "./model";

/**
 * Тестирование модели без React: fork создаёт изолированный scope,
 * allSettled — «launch» в scope: дожидается выполнения эффекта/события.
 *
 * ВАЖНО (effector 22.7): опция вызова — `params` (не `parameters`/`payload`):
 *   await allSettled(unit, { scope, params })
 */
describe("entities/credit", () => {
  it("$selectedProduct = null, пока список продуктов не загружен", () => {
    const scope = fork();
    expect(scope.getState($selectedProduct)).toBeNull();
  });

  it("$selectedProduct следует за $selectedProductId после загрузки", async () => {
    const scope = fork();
    await allSettled(fxGetCreditProducts, { scope });

    const products = scope.getState($creditProducts);
    expect(products.length).toBeGreaterThan(0);

    // по умолчанию выбран "alpha"
    expect(scope.getState($selectedProductId)).toBe("alpha");
    expect(scope.getState($selectedProduct)?.id).toBe("alpha");

    // смена выбора пересобирает combine
    await allSettled(selectCreditProduct, { scope, params: "prime" });
    expect(scope.getState($selectedProduct)?.id).toBe("prime");

    // неизвестный id — null, а не крах
    await allSettled(selectCreditProduct, { scope, params: "nope" });
    expect(scope.getState($selectedProduct)).toBeNull();
  });
});
