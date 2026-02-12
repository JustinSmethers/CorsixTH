# Runtime Flow Architecture

## Startup and bootstrap sequence

```mermaid
sequenceDiagram
  participant OS as OS/Launcher
  participant EXE as `main()` (C++)
  participant LUA as Lua VM
  participant M as `main.cpp` bridge
  participant B as `CorsixTH.lua`
  participant A as `App:init()` / `App:run()`
  participant SDL as SDL mainloop

  OS->>EXE: Launch `CorsixTH`
  EXE->>LUA: Create Lua state + open libs
  EXE->>M: Call `lua_main` with argv
  M->>LUA: Preload native packages (`TH`, `sdl`, `persist`, `rnc`)
  M->>B: `loadfile(CorsixTH.lua)` and execute
  B->>A: Construct `App`, parse command line, call `init`
  A->>A: Load config, graphics, audio, strings, map/world/UI modules
  A->>SDL: Enter event loop through coroutine dispatcher
  SDL-->>A: Dispatch events (`timer`, `frame`, input, audio/movie callbacks)
  A-->>SDL: Return repaint decisions and handler results
```

## Component purposes in the startup path

- `main()` in `CorsixTH/SrcUnshared/main.cpp`: Creates Lua runtime, runs protected call to Lua entrypoint, and supports restart loop via `_RESTART` registry flag.
- `lua_main` in `CorsixTH/Src/main.cpp`: Validates Lua runtime compatibility, preloads native modules, locates `CorsixTH.lua`, and executes it.
- `CorsixTH.lua`: Runtime bootstrap contract between native executable and Lua game framework.
- `App:init()` in `CorsixTH/Lua/app.lua`: Initializes data paths, video/audio, resources, module graph, and initial UI state.
- `SDL.mainloop` in `CorsixTH/Src/sdl_core.cpp`: Converts SDL events into Lua dispatch calls.

## Runtime event architecture

```mermaid
flowchart TD
  SDL[SDL event queue] --> Loop[sdl.mainloop dispatcher]
  Loop -->|event type + args| Dispatch[App:dispatch]

  Dispatch --> Tick[onTick]
  Dispatch --> Frame[drawFrame]
  Dispatch --> Input[Keyboard/Mouse/Text handlers]
  Dispatch --> Window[Window focus/resize handlers]
  Dispatch --> AudioEv[Music/Sound completion handlers]
  Dispatch --> MovieEv[Movie completion handler]

  Tick --> World[World:onTick]
  Tick --> UI[UI:onTick]
  Frame --> UI
  UI --> Render[TH.surface + draw operations]
  AudioEv --> Audio[Audio subsystem]
  MovieEv --> Movie[MoviePlayer subsystem]
```

## Why this design works

- Keeps gameplay logic in Lua where iteration is fast.
- Keeps rendering/map/pathfinding/audio primitives in C++ for performance and binary format handling.
- Uses a coroutine-aware event loop to preserve Lua stack traces and improve error recovery behavior.

