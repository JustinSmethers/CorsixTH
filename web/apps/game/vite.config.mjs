import { defineConfig } from "vite";
import { fileURLToPath } from "node:url";
import { rewriteAliases } from "../../vite.aliases.mjs";

const root = fileURLToPath(new URL("./", import.meta.url));

export default defineConfig({
  root,
  resolve: {
    alias: rewriteAliases
  },
  build: {
    outDir: "dist"
  }
});
