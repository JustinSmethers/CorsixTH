import { fileURLToPath } from "node:url";

export const rewriteAliases = {
  "@corsixth/core": fileURLToPath(new URL("./packages/core/src/index.ts", import.meta.url)),
  "@corsixth/rules": fileURLToPath(new URL("./packages/rules/src/index.ts", import.meta.url)),
  "@corsixth/renderer-webgl": fileURLToPath(new URL("./packages/renderer-webgl/src/index.ts", import.meta.url)),
  "@corsixth/audio-webaudio": fileURLToPath(new URL("./packages/audio-webaudio/src/index.ts", import.meta.url)),
  "@corsixth/assets": fileURLToPath(new URL("./packages/assets/src/index.ts", import.meta.url)),
  "@corsixth/persistence": fileURLToPath(new URL("./packages/persistence/src/index.ts", import.meta.url)),
  "@corsixth/app": fileURLToPath(new URL("./packages/app/src/index.ts", import.meta.url)),
  "@corsixth/replay": fileURLToPath(new URL("./packages/replay/src/index.ts", import.meta.url)),
  "@corsixth/testkit": fileURLToPath(new URL("./packages/testkit/src/index.ts", import.meta.url))
};
