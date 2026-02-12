# Phase 3 Rendering (WebGL Pipeline) Parity Scenarios

Date: 2026-02-12  
Status: Locked for CP-3

## Scope

This catalog locks Phase 3 parity expectations for deterministic scene build order, camera behavior, tile/entity rendering, debug overlays, visual pixel thresholds, and frame-time budget enforcement.

## Locked scenario coverage

| ID | Scenario | Fixture/Test anchor | Expected outcome |
|---|---|---|---|
| PAR-006A | Deterministic depth-ordered scene build at camera origin | `web/packages/renderer-webgl/fixtures/phase3-visual-snapshots.json` scenario `camera-origin-depth-order`; `web/packages/renderer-webgl/test/scene-build.spec.ts` | Stable tile-first depth ordering with entity tie-break by id (`entity-a` before `entity-z`) |
| PAR-006B | Camera scroll + viewport culling behavior | `web/packages/renderer-webgl/fixtures/phase3-visual-snapshots.json` scenario `camera-scroll`; `web/packages/renderer-webgl/test/scene-build.spec.ts` | Pixel output translates correctly with deterministic black clear regions outside map bounds |
| PAR-006C | Texture-atlas page batching contract | `web/packages/renderer-webgl/test/atlas-batching.spec.ts` | Render commands batch into deterministic contiguous page groups (`terrain`, `actors`, `props`, `terrain`) |
| PAR-006D | Debug tile/entity inspection overlays | `web/packages/renderer-webgl/fixtures/phase3-visual-snapshots.json` scenario `debug-overlays`; `web/packages/renderer-webgl/test/debug-overlay.spec.ts` | Overlay primitives are deterministic (`tile:*` then `entity:*`) and overwrite inspected regions with locked colors |
| PAR-006E | Visual snapshot threshold enforcement | `web/packages/renderer-webgl/test/renderer-visual.spec.ts` | Locked scenarios must render with `0` changed pixels; drift mutation test must fail threshold |
| PAR-006F | Scripted renderer frame-time budget | `web/packages/renderer-webgl/test/frame-profile.spec.ts` | Baseline scripted scene holds `>= 60 FPS` (`<= 16.67 ms` average frame time) |

## Fixture and gate mapping

- Visual fixture source of truth:
  - `web/packages/renderer-webgl/fixtures/phase3-visual-snapshots.json`
- Deterministic visual diff gate:
  - `pnpm --dir web test:visual`
- Renderer performance gate:
  - `pnpm --dir web test:renderer-perf`
- Aggregate Phase 3 gate:
  - `pnpm --dir web phase3:check`

## Pixel-diff threshold policy (CP-3 lock)

- Default threshold for locked Phase 3 scenarios: `0` changed pixels.
- Per-scenario threshold override: optional `maxDiffPixels` in fixture, currently unset for all locked scenes.
- Gate behavior:
  - `changedPixels <= maxDiffPixels` => pass
  - `changedPixels > maxDiffPixels` => fail

This threshold contract is intentionally strict because CP-3 currently uses a deterministic software reference path for renderer verification. Any threshold relaxation must be approved in checkpoint review and logged as a decision update.
