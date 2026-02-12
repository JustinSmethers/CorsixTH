# CP-3 Validation Evidence

Date: 2026-02-12  
Checkpoint: CP-3  
Status: Passed

## Commands and outcomes

| Command | Result | Notes |
|---|---|---|
| `pnpm --dir web run lint` | Passed | ESLint clean with renderer pipeline, fixtures, and new tests |
| `pnpm --dir web run typecheck` | Passed | Strict TypeScript checks passed for renderer scene/atlas/camera/snapshot/profile contracts |
| `pnpm --dir web run test` | Passed | 23 files / 42 tests green including all Phase 3 renderer suites |
| `pnpm --dir web run test:replay` | Passed | Replay determinism fixtures (Phase 0/1/2) unchanged and green |
| `pnpm --dir web run test:pathfinding` | Passed | Phase 2 correctness suites remain green |
| `pnpm --dir web run test:pathfinding-perf` | Passed | `64x64`: `0.091 ms`; `128x128`: `0.202 ms` average solve times |
| `pnpm --dir web run test:core-isolation` | Passed | No browser API dependencies in `packages/core/src` |
| `pnpm --dir web run test:visual` | Passed | Locked visual fixture scenarios all passed with `0` changed pixels |
| `pnpm --dir web run test:renderer-perf` | Passed | Scripted baseline rendered at `0.155 ms` average frame (`6449.81 FPS`) vs target `60 FPS` |
| `pnpm --dir web run phase3:check` | Passed | Aggregated Phase 3 quality gates green |

## Visual snapshot evidence

- Fixture source: `web/packages/renderer-webgl/fixtures/phase3-visual-snapshots.json`
- Snapshot test gate: `web/packages/renderer-webgl/test/renderer-visual.spec.ts`
- Locked scenario outcomes:
  - `camera-origin-depth-order`: `0` changed pixels (threshold `0`)
  - `camera-scroll`: `0` changed pixels (threshold `0`)
  - `debug-overlays`: `0` changed pixels (threshold `0`)
- Drift sentinel:
  - Baseline mutation test in `renderer-visual.spec.ts` fails as expected when drift exceeds threshold.

## Renderer performance evidence

- Profile test: `web/packages/renderer-webgl/test/frame-profile.spec.ts`
- Scripted baseline characteristics:
  - viewport `128x96`, tile size `2`, map `32x32`, entities `120`
  - scripted camera motion (`scrollX`, `scrollY`) per frame
- Locked CP-3 budget:
  - target `>= 60 FPS` (`<= 16.67 ms` average frame)
- Measured result:
  - `0.155 ms` average frame (`6449.81 FPS`)

## CI and gate wiring evidence

- Phase 3 gate script: `web/scripts/phase3-check.sh`
- Required gates dispatcher updated: `web/scripts/ci-required-gates.sh`
- New workflow: `.github/workflows/web-rewrite-phase3.yml`
- New package scripts:
  - `test:renderer-perf`
  - `phase3:check`

## Related design and parity docs

- Design notes: `web/docs/milestone-reports/2026-02-12-cp3-design-notes.md`
- Phase 3 parity scenarios: `web/docs/parity-specs/phase-3-rendering-webgl-scenarios.md`
