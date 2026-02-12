# CorsixTH Architecture Documentation

This directory documents the architecture of the local `CorsixTH` checkout, based on repository profiling and source inspection.

## Document map

- `docs/architecture/README.md`: High-level architecture and system boundaries.
- `docs/architecture/runtime-flow.md`: Startup path, event loop, and core runtime control flow.
- `docs/architecture/component-map.md`: Component-level ownership map of major source directories.
- `docs/architecture/build-and-tooling.md`: Build graph, tests, CI, and auxiliary tooling architecture.
- `docs/architecture/typescript-web-rewrite-plan.md`: Detailed step-by-step rewrite execution plan with checkpoints, decision log, and verification gates.

## High-level system diagram

```mermaid
flowchart LR
  User[Player] --> Bin[C++ executable\n`CorsixTH`]
  Bin --> LuaBoot[`CorsixTH.lua` bootstrap]
  LuaBoot --> App[`Lua App` runtime]

  App <--> THBridge[`TH` Lua module\n(C++ bindings)]
  App <--> SDLBridge[`sdl` Lua module\n(SDL event/audio/window)]
  App <--> Persist[`persist` + save/load layer]
  App --> Scripts[Lua gameplay content\nrooms, diseases, entities, dialogs]

  THBridge --> NativeCore[C++ engine core\nmap/gfx/audio/pathfinding/movie]
  SDLBridge --> SDL[SDL2 + SDL_mixer]
  NativeCore --> Assets[Theme Hospital data\n+ CorsixTH assets]
  Persist --> Saves[Config/hotkeys/save files]
```

## Diagram component purposes

- `C++ executable`: Initializes Lua state, preloads native Lua modules, starts interpreter script, and handles fatal bootstrap errors.
- `CorsixTH.lua bootstrap`: Sets up Lua module loading strategy (`corsixth.require`), strict mode, and constructs `App`.
- `Lua App runtime`: Owns game initialization sequence, module loading order, world/UI lifecycle, and event dispatch.
- `TH Lua module`: Primary native bridge exposing rendering, map, pathfinding, strings, movie, and compile options.
- `sdl Lua module`: Wraps SDL initialization and the event-driven main loop used by Lua coroutine dispatch.
- `Lua gameplay content`: Most gameplay rules and content definitions (diseases, room logic, humanoid actions, dialogs).
- `C++ engine core`: Performance-sensitive primitives and binary resource handling used by Lua gameplay code.
- `persist/save layer`: Serialization support and save/load state continuity.

## Project profile summary

- Total tracked files in this checkout: `620`
- Dominant implementation languages: `Lua (326 files)`, `C++ (49 .cpp files + headers)`
- Main game logic location: `CorsixTH/Lua/`
- Native runtime location: `CorsixTH/Src/`
