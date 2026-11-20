import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { fileURLToPath } from "node:url";

const r = (p: string) => fileURLToPath(new URL(p, import.meta.url));

// Псевдонимы повторяют «плоские» импорты оригинального проекта:
// `entities/credit`, `shared/lib`, `features/credit-form` и т.д.
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      app: r("./src/app"),
      pages: r("./src/pages"),
      features: r("./src/features"),
      entities: r("./src/entities"),
      widgets: r("./src/widgets"),
      shared: r("./src/shared"),
    },
  },
});
