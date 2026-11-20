import js from "@eslint/js";
import prettier from "eslint-config-prettier";
import react from "eslint-plugin-react";
import tseslint from "typescript-eslint";

/**
 * Flat-конфиг ESLint 9: рекомендации JS + TypeScript + React,
 * последним — eslint-config-prettier (выключает правила,
 * конфликтующие с форматтером).
 */
export default tseslint.config(
  { ignores: ["dist", "node_modules"] },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ["**/*.{ts,tsx}"],
    plugins: { react },
    languageOptions: {
      parserOptions: { ecmaFeatures: { jsx: true } },
    },
    settings: { react: { version: "18.3" } },
    rules: {
      ...react.configs.flat.recommended.rules,
      "react/prop-types": "off", // типы — это TypeScript, а не prop-types
    },
  },
  {
    rules: {
      // подчёркивание = «нет, это осознанно неиспользуемый аргумент»
      "@typescript-eslint/no-unused-vars": [
        "error",
        { argsIgnorePattern: "^_", varsIgnorePattern: "^_" },
      ],
    },
  },
  prettier,
);
