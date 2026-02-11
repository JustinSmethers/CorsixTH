import { defineConfig } from "vitest/config";
import { rewriteAliases } from "./vite.aliases.mjs";

export default defineConfig({
  resolve: {
    alias: rewriteAliases
  },
  test: {
    globals: true,
    include: ["packages/**/*.spec.ts"],
    coverage: {
      provider: "v8",
      reporter: ["text", "lcov"]
    }
  }
});
