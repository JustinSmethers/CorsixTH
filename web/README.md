# CorsixTH Web Runtime

This workspace is an incremental browser-port scaffold for CorsixTH. It currently contains:

- Deterministic simulation, command, pathfinding, replay, persistence, audio, renderer, and asset-import packages.
- A Vite browser app that imports a legally owned Theme Hospital data folder, validates required files, and launches a playable deterministic shell.
- Unit, replay, browser e2e, performance, and release-safeguard checks.

## Commands

From the repository root:

```sh
npm --prefix web run dev
npm --prefix web run check
npm --prefix web run test:e2e
npm --prefix web run inspect:game-data
```

`dev` starts the browser game at `http://127.0.0.1:5173/`. `check` runs the unit/replay/performance suite and production build. `test:e2e` creates synthetic asset fixtures and runs the Chromium browser journey tests.
`inspect:game-data` validates the local Theme Hospital assets without writing or staging them; by default it discovers `GameData/Contents/Resources/game`.

If `pnpm` is available, the same scripts can be run with:

```sh
pnpm --dir web run check
pnpm --dir web run test:e2e
```

## Devcontainer

The repository includes a devcontainer with Node, pnpm, Playwright browsers, and the native build dependencies needed for comparing against the existing CorsixTH C++/Lua runtime.

Real Theme Hospital data should stay outside git. Use the browser import flow for manual testing, or mount your local data folder into the container when you need decoder work against real assets.
The importer also accepts wrapped installer layouts such as `GameData/`; it detects the nested game-data root and ignores wrapper files outside it.
The browser import screen accepts either an original Theme Hospital installation folder containing `DATA`, `LEVELS`, `QDATA`, `HOSPITAL.CFG`, and `HOSPITAL.EXE`, the GOG `GameData/Contents/Resources/game` folder, or a wrapped folder containing one nested game-data root.
