# CorsixTH Web Runtime

This workspace is an incremental browser-port scaffold for CorsixTH. It currently contains:

- Deterministic simulation, command, pathfinding, replay, persistence, audio, renderer, and asset-import packages.
- A Vite browser app that imports a legally owned Theme Hospital data folder, validates required files, and launches a playable deterministic shell.
- Unit, replay, browser e2e, performance, and release-safeguard checks.

## Commands

From the repository root:

```sh
npm --prefix web run dev
npm --prefix web run build
npm --prefix web run serve
npm --prefix web run check
npm --prefix web run test:e2e:dev-smoke
npm --prefix web run test:e2e
npm --prefix web run test:e2e:preview
npm --prefix web run inspect:game-data
```

`dev` starts the browser game at `http://127.0.0.1:5173/`. `build` writes the production browser bundle under `web/apps/game/dist/`. `serve` previews that built bundle at `http://127.0.0.1:4173/`. `check` runs the unit/replay/performance suite and production build. `test:e2e:dev-smoke` creates synthetic asset fixtures, starts Vite dev mode, and runs the smoke, first-time import rendering, and compatibility journeys. `test:e2e` runs the full Chromium browser journey suite against Vite dev mode, preferring `http://127.0.0.1:4173/` unless that port is occupied. `test:e2e:preview` builds first, then runs the same smoke/import/compatibility journeys against `vite preview` on the same fixed port. Set `CORSIXTH_WEB_PORT` to use a specific e2e port.
`inspect:game-data` validates the local Theme Hospital assets without writing or staging them; by default it discovers `GameData/Contents/Resources/game`.

If `pnpm` is available, the same scripts can be run with:

```sh
pnpm --dir web run check
pnpm --dir web run test:e2e
```

## Devcontainer

The repository includes a devcontainer with Node, pnpm, Playwright browsers, and the native build dependencies needed for comparing against the existing CorsixTH C++/Lua runtime.

## Native Build Boundary

The browser runtime lives under `web/` and does not replace the existing CMake/C++/Lua build. Native presets remain in `CMakePresets.json`; use those presets for desktop build validation when changing shared native code. Browser-only changes should not require CMake reconfiguration.

## Browser Runtime Notes

Real Theme Hospital data should stay outside git. Use the browser import flow for manual testing, or mount your local data folder into the container when you need decoder work against real assets.
The importer also accepts wrapped installer layouts such as `GameData/`; it detects the nested game-data root and ignores wrapper files outside it.
The browser import screen accepts either an original Theme Hospital installation folder containing `DATA`, `LEVELS`, `QDATA`, `HOSPITAL.CFG`, and `HOSPITAL.EXE`, the GOG `GameData/Contents/Resources/game` folder, or a wrapped folder containing one nested game-data root.
Imported assets and browser save slots are stored locally in IndexedDB. A small launch manifest and rollout-stage preference use `localStorage` when available; if `localStorage` is unavailable, the runtime still falls back to the import screen and IndexedDB-backed saves.
Current browser audio uses the WebAudio scaffold for event cues rather than the native SDL_mixer/MIDI path. Browser previews decode and render imported maps, sprites, and UI assets, but the deterministic browser shell is still an incremental parity runtime rather than a compiled Emscripten build of the C++/Lua executable.
