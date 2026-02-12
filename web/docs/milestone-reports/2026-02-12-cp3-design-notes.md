# CP-3 Design Notes: Deterministic Rendering Pipeline Contracts

Date: 2026-02-12  
Checkpoint: CP-3

## Deterministic scene build order

Implemented in:
- `web/packages/renderer-webgl/src/index.ts`

Contract:
1. Tile commands are created from a rectangular map and assigned deterministic ids (`tile:x:y`).
2. Entity commands include explicit world positions and optional `zOffset` but always sort deterministically.
3. Draw command ordering is stable by:
   - depth (ascending)
   - kind (`tile` before `sprite` before `debug`)
   - world position (`y`, then `x`)
   - page id
   - command id

## Camera model and culling

Implemented in:
- `web/packages/renderer-webgl/src/index.ts`
- `web/packages/renderer-webgl/test/scene-build.spec.ts`

Contract:
1. Camera is defined by `scrollX`, `scrollY`, and `zoom`.
2. `world -> screen` transform is deterministic: `round((world - scroll) * zoom)`.
3. Command visibility is clipped against viewport bounds before batching and rasterization.
4. Clear color is locked to opaque black (`[0,0,0,255]`) for stable snapshots.

## Atlas handling and batching

Implemented in:
- `web/packages/renderer-webgl/src/index.ts`
- `web/packages/renderer-webgl/test/atlas-batching.spec.ts`

Contract:
1. Atlas sprites lock `id`, `page`, dimensions, and color swatch.
2. Unknown or duplicate sprite ids fail fast.
3. Batches are formed by contiguous page runs after deterministic depth sorting.
4. Batch ids and command membership are deterministic for identical scene inputs.

## Debug overlays

Implemented in:
- `web/packages/renderer-webgl/src/index.ts`
- `web/packages/renderer-webgl/test/debug-overlay.spec.ts`

Contract:
1. Tile inspection and entity inspection overlays are explicit debug primitives.
2. Overlay primitive order is deterministic (`tile:*` before `entity:*`).
3. Overlay primitives render as border-only passes after base scene rendering.

## Visual and performance verification hooks

Implemented in:
- `web/packages/renderer-webgl/fixtures/phase3-visual-snapshots.json`
- `web/packages/renderer-webgl/test/renderer-visual.spec.ts`
- `web/packages/renderer-webgl/test/frame-profile.spec.ts`

Contract:
1. Fixture schema `renderer-snapshot.v0` defines palette, atlas, scenes, camera states, and baseline rows.
2. Pixel-diff threshold defaults to `0` changed pixels for all locked scenarios.
3. Frame-time profile uses scripted camera motion and enforces `>= 60 FPS`.
