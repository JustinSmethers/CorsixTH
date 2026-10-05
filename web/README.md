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

`dev` starts the browser game at `http://127.0.0.1:5173/`. `build` writes the production browser bundle under `web/apps/game/dist/`. `serve` previews that built bundle at `http://127.0.0.1:4173/`. `check` runs the unit/replay/performance suite and production build. `test:e2e:dev-smoke` creates synthetic asset fixtures, starts Vite dev mode, and runs the smoke, playable-loop, first-time import rendering, and compatibility journeys. `test:e2e` runs the full Chromium browser journey suite against Vite dev mode, preferring `http://127.0.0.1:4173/` unless that port is occupied. `test:e2e:preview` builds first, then runs the same smoke/playable-loop/import/compatibility journeys against `vite preview` on the same fixed port. Set `CORSIXTH_WEB_PORT` to use a specific e2e port.
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
Browser audio reads the local `SOUND/DATA/SOUND-0.DAT` archive and plays its PCM WAV effects through WebAudio after a user gesture. Missing or malformed sound assets fall back to synthesized cues. Original XMI/MIDI music and the complete native announcement/event sound schedule are not yet implemented.
Browser rendering decodes original maps, tile draw flags, entrance animations, and directional humanoid animations with appearance layers and wall depth ordering. The deterministic browser shell is still an incremental parity runtime rather than a compiled Emscripten build of the C++/Lua executable.

## Gameplay Parity Work

Parity is assessed against the checked-in C++/Lua implementation and locally imported original assets. Passing browser tests verifies the covered journeys; it does not establish full native-game parity. Replay fixtures currently check browser determinism, not execution of the original game side by side.

Recent completed behavior includes:

- Surgical diseases visit the Ward before the Operating Theatre, retain visit progress through save/load and staff reassignment, and require two available surgeons for surgery.
- Failed cures bill treatment and count as patient deaths, affecting death-limit objectives, VIP inspections, and autopsy research.
- Automatic Pharmacy visits pay the imported scenario's initial medicine supplier cost after cures or deaths, with expenses preserved through save/load. Per-drug research cost changes remain unfinished.
- Implicit staff hires find valid tiles on imported maps; explicit player placement still rejects invalid tiles.
- Portable `.corsixth.json` saves preserve the hospital, map, camera zoom, pause state, staff specialties, and all five speed settings. Rejected imports preserve the running hospital and existing save slot. These files are browser saves, not original native save files.
- Original floor/wall alignment, entrance door animations, directional humanoid appearance, and PCM sound playback have regression coverage using synthetic fixtures and optional local GoG assets. Proprietary files stay outside git.

Known remaining work toward native parity includes:

- Diagnosis confidence, disease-specific secondary diagnosis, return visits to the GP, native Pharmacy routing for legacy generic treatment aliases, and a full bedside Ward with multiple occupied beds.
- Complete room construction and furnishing behavior, object footprints, doors/windows, staff movement/actions, and treatment animations.
- Disease-specific drug research, patient payment refusal, disease reputation/pricing, and native finance/calendar balancing.
- Continuous arrivals, emergencies, epidemics, rival hospitals, and all campaign objectives verified through ordinary hospital operation without manual admit/treat shortcuts.
- Original music and announcement scheduling, monthly autosaves, native save compatibility, original dialogs, bitmap fonts, shadows, and complex sprite overlap redraw.
- Full campaign playthroughs and browser/device coverage against original behavior. The automated Chromium suite alone does not establish these.
