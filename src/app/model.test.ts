/**
 * Тест URL-синхронизации (app/model).
 *
 * Окружение — node, поэтому window заменяем минимальным stub'ом
 * (модели нужны только location.hash и addEventListener).
 * Импортируем модель ПОСЛЕ установки stub'а: при импорте модель
 * регистрирует слушатель hashchange и инициализирует стор из hash.
 */
import { describe, expect, it, vi } from "vitest";

type Listener = () => void;
const listeners: Record<string, Listener[]> = {};
const location = { hash: "" };

vi.stubGlobal("window", {
  location,
  addEventListener: (name: string, fn: Listener) => {
    (listeners[name] ??= []).push(fn);
  },
});

const { $activePage, pageFromHash, selectPage } = await import("app/model");

describe("app/model: pageFromHash", () => {
  it("известный hash → ключ", () => {
    location.hash = "#history";
    expect(pageFromHash()).toBe("history");
    location.hash = "#claims";
    expect(pageFromHash()).toBe("claims");
  });

  it("пустой или неизвестный hash → 'claims'", () => {
    location.hash = "";
    expect(pageFromHash()).toBe("claims");
    location.hash = "#bogus";
    expect(pageFromHash()).toBe("claims");
  });
});

describe("app/model: стор ↔ hash", () => {
  it("selectPage обновляет стор и hash", () => {
    location.hash = "#claims";
    selectPage("history");
    expect($activePage.getState()).toBe("history");
    expect(location.hash).toBe("#history");
  });

  it("hashchange (назад/вперёд) обновляет стор", () => {
    location.hash = "#claims";
    listeners.hashchange.forEach((fn) => fn());
    expect($activePage.getState()).toBe("claims");
  });

  it("неизвестный hash в URL → fallback на 'claims' без краха", () => {
    location.hash = "#bogus";
    listeners.hashchange.forEach((fn) => fn());
    expect($activePage.getState()).toBe("claims");
  });
});
