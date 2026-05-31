import { defineConfig } from "vite";
import { resolve } from "node:path";

const root = import.meta.dirname;

export default defineConfig({
  resolve: {
    alias: {
      "@corsixth/app": resolve(root, "packages/app/src/index.js"),
      "@corsixth/assets": resolve(root, "packages/assets/src/index.js"),
      "@corsixth/audio-webaudio": resolve(root, "packages/audio-webaudio/src/index.js"),
      "@corsixth/core": resolve(root, "packages/core/src/index.js"),
      "@corsixth/persistence": resolve(root, "packages/persistence/src/index.js"),
      "@corsixth/renderer-webgl": resolve(root, "packages/renderer-webgl/src/index.js"),
      "@corsixth/replay": resolve(root, "packages/replay/src/index.js"),
      "@corsixth/rules": resolve(root, "packages/rules/src/index.js"),
      "@corsixth/testkit": resolve(root, "packages/testkit/src/index.js")
    }
  }
});
