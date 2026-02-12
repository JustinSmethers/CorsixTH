# Phase 2 Map, Occupancy, and Pathfinding Parity Scenarios

Date: 2026-02-12
Status: Locked for CP-2

## Scope

This catalog locks Phase 2 parity expectations for map metadata interpretation, occupancy transitions, and deterministic pathfinding behavior.

## Locked scenario coverage

| ID | Scenario | Fixture/Test anchor | Expected outcome |
|---|---|---|---|
| PAR-004A | Symmetric detour around static wall with deterministic tie behavior | `web/packages/core/test/fixtures/phase2-pathfinding-golden.json` scenario `tie-break-prefers-north-route` | Solver returns locked route with deterministic node ordering and total cost `6` |
| PAR-004B | Weighted terrain detour selection | `web/packages/core/test/fixtures/phase2-pathfinding-golden.json` scenario `weighted-cost-prefers-cheaper-detour` | Solver prefers lower total movement cost route (cost `8`) instead of shorter high-cost direct path |
| PAR-004C | Occupancy blocker detour | `web/packages/core/test/fixtures/phase2-pathfinding-golden.json` scenario `occupancy-blocker-forces-deterministic-detour` | Occupancy-constrained route avoids blocked tile and matches locked deterministic path (cost `8`) |
| PAR-004D | Unreachable destination | `web/packages/core/test/fixtures/phase2-pathfinding-golden.json` scenario `unreachable-goal` | Solver returns `found=false`, empty path, and cost `0` |
| PAR-005A | Occupancy placement/movement transition determinism | `web/packages/core/test/occupancy-map.spec.ts` | Identical transition streams produce identical state snapshots and revision counters |
| PAR-005B | Connectivity and impassable invariants | `web/packages/core/test/pathfinding-property.spec.ts` | Solver never routes through impassable endpoints and matches shortest-path reachability on randomized maps |

## Fixture and gate mapping

- Golden fixture source of truth:
  - `web/packages/core/test/fixtures/phase2-pathfinding-golden.json`
  - mirrored replay artifact: `web/packages/replay/fixtures/phase2-pathfinding-golden.json`
- Deterministic fixture validation:
  - `pnpm --dir web test:pathfinding`
  - `pnpm --dir web test:replay`

## Performance coverage

- Microbenchmark gate: `pnpm --dir web test:pathfinding-perf`
- Locked budgets:
  - `64x64` average solve <= `4.0 ms`
  - `128x128` average solve <= `12.0 ms`
