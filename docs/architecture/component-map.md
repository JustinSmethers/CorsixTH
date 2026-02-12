# Component Map

## Repository component diagram

```mermaid
flowchart TB
  Root[Repository Root]

  Root --> CoreGame[`CorsixTH/` Main game project]
  Root --> Libs[`libs/` Shared native libs]
  Root --> Tools[`tools/` CLI helpers]
  Root --> AnimView[`AnimView/` Animation viewer]
  Root --> LevelEdit[`LevelEdit/` Java level editor]
  Root --> SpriteEnc[`SpriteEncoder/` Sprite encoder toolchain]
  Root --> Installer[`WindowsInstaller/` NSIS packaging]
  Root --> BuildInfra[`CMake/` + presets + vcpkg]
  Root --> DocsGen[`DoxyGen/` + `LDocGen/`]
  Root --> Scripts[`scripts/` lint/check/utility scripts]

  CoreGame --> Lua[`CorsixTH/Lua/` gameplay & UI logic]
  CoreGame --> Native[`CorsixTH/Src/` native runtime + bridges]
  CoreGame --> Entry[`CorsixTH/SrcUnshared/` process entrypoint]
  CoreGame --> TestsCpp[`CorsixTH/CppTest/` C++ unit tests]
  CoreGame --> TestsLua[`CorsixTH/Luatest/` Lua tests]
  CoreGame --> Data[`Campaigns/`, `Levels/`, `Bitmap/` data]
```

## Component purposes

- `CorsixTH/Lua`: Primary domain logic (world simulation, entities, rooms, diseases, UI/dialogs, localization).
- `CorsixTH/Src`: Native support layer exposed to Lua (`TH`, `sdl`, `persist`, `rnc`) plus engine primitives.
- `CorsixTH/SrcUnshared`: OS-level executable entrypoint and Lua lifecycle management.
- `libs/rnc`: RNC decompression library used by game/runtime/tools.
- `libs/whereami`: Executable path discovery (used when searching local data dirs).
- `tools/rnc`: Standalone `rnc_decode` utility.
- `AnimView`: wxWidgets-based animation/resource viewer utility.
- `LevelEdit`: Java GUI for `.level` authoring.
- `SpriteEncoder`: Separate parser/encoder pipeline for sprite resource work.
- `WindowsInstaller`: NSIS scripts and language strings for packaging on Windows.

## Lua module topology

```mermaid
flowchart LR
  App[`app.lua`]
  App --> Core[Core modules\n`filesystem` `graphics` `audio` `strings` `map` `world` `ui`]
  Core --> Domain[Domain content modules\n`rooms/*` `objects/*` `diseases/*` `diagnosis/*`]
  Core --> Actors[Actor behavior\n`entities/*` `humanoid_actions/*`]
  Core --> UX[UI modules\n`dialogs/*` `game_ui.lua`]
  Core --> Lang[`languages/*`]
```

### Lua profile snapshot

- `objects/*`: `60` files
- `dialogs/*`: `60` files
- Root Lua modules: `36` files
- `diseases/*`: `34` files
- `humanoid_actions/*`: `32` files
- `languages/*`: `24` files

These counts reinforce the architectural intent: most gameplay behavior and content variation is data/module-driven in Lua.

