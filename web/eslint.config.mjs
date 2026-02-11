import { defineConfig } from "eslint/config";

export default defineConfig([
  {
    name: "phase0-ignores",
    ignores: ["dist/**", "coverage/**", "playwright-report/**", "test-results/**", "**/*.d.ts"]
  },
  {
    name: "phase0-js-rules",
    files: ["**/*.mjs", "**/*.js", "**/*.cjs"],
    languageOptions: {
      ecmaVersion: "latest",
      sourceType: "module"
    },
    rules: {
      "no-var": "error",
      "prefer-const": "error"
    }
  }
]);
