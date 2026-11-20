import { defineConfig, mergeConfig } from "vitest/config";
import viteConfig from "./vite.config";

/**
 * Тесты моделей БЕЗ React: fork/launch + allSettled.
 * Алиасы импортов (app/, pages/, features/.../) наследуем из vite.config.ts.
 */
export default mergeConfig(
  viteConfig,
  defineConfig({
    test: {
      environment: "node",
      include: ["src/**/*.test.{ts,tsx}"],
    },
  })
);
