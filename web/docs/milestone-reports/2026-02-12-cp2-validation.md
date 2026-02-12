# CP-2 Validation Evidence

Date: 2026-02-12
Checkpoint: CP-2
Status: Passed

## Commands and outcomes

| Command | Result | Notes |
|---|---|---|
| `pnpm --dir web run lint` | Passed | ESLint clean with new Phase 2 modules/tests |
| `pnpm --dir web run typecheck` | Passed | Strict TypeScript checks passed for map/occupancy/pathfinding and fixture parser |
| `pnpm --dir web run test` | Passed | 19 files / 36 tests green including Phase 2 map + occupancy + pathfinding coverage |
| `pnpm --dir web run test:replay` | Passed | Replay harness validates Phase 0 + Phase 1 replay fixtures and new Phase 2 pathfinding fixture parity |
| `pnpm --dir web run test:pathfinding` | Passed | Golden routes + randomized property coverage + deterministic fixture parity all green |
| `pnpm --dir web run test:pathfinding-perf` | Passed | Average solve times below locked budgets for 64x64 and 128x128 maps |
| `pnpm --dir web run test:core-isolation` | Passed | No browser API dependencies in `packages/core/src` |
| `pnpm --dir web run phase2:check` | Passed | Aggregated Phase 2 quality gates green |

## Pathfinding correctness evidence

- Golden fixture file: `web/packages/core/test/fixtures/phase2-pathfinding-golden.json`
- Replay mirrored fixture: `web/packages/replay/fixtures/phase2-pathfinding-golden.json`
- Deterministic fixture runner: `web/packages/replay/src/pathfinding-fixture.ts`
- Core solver implementation: `web/packages/core/src/pathfinding.ts`
- Occupancy + map primitives:
  - `web/packages/core/src/map-model.ts`
  - `web/packages/core/src/occupancy-map.ts`

## Performance evidence

Captured from `pnpm --dir web run test:pathfinding-perf`:

- `64x64` average solve time: `0.119 ms` over `300` routes (budget: `<= 4.0 ms`)
- `128x128` average solve time: `0.179 ms` over `200` routes (budget: `<= 12.0 ms`)

## CI and gate wiring evidence

- Phase 2 gate script: `web/scripts/phase2-check.sh`
- Required gates dispatcher updated: `web/scripts/ci-required-gates.sh`
- New workflow: `.github/workflows/web-rewrite-phase2.yml`
- New package scripts:
  - `test:pathfinding`
  - `test:pathfinding-perf`
  - `phase2:check`

## Related design and parity docs

- Design notes: `web/docs/milestone-reports/2026-02-12-cp2-design-notes.md`
- Phase 2 parity scenarios: `web/docs/parity-specs/phase-2-map-occupancy-pathfinding-scenarios.md`
