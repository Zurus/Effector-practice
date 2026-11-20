import { afterEach, describe, expect, it, vi } from "vitest";
import { initDebug } from "./debug";

describe("debug: initDebug", () => {
  afterEach(() => vi.unstubAllEnvs());

  it("без флага — молчит (watchers не создаёт)", () => {
    const spy = vi.spyOn(console, "log").mockImplementation(() => {});
    initDebug();
    expect(spy).not.toHaveBeenCalled();
    spy.mockRestore();
  });

  it("с VITE_DEBUG=1 — включается", () => {
    vi.stubEnv("VITE_DEBUG", "1");
    const spy = vi.spyOn(console, "log").mockImplementation(() => {});
    initDebug();
    expect(spy).toHaveBeenCalledWith("[debug] createWatch включён (VITE_DEBUG=1)");
    spy.mockRestore();
  });
});
