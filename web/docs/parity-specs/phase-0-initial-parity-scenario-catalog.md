# Phase 0 Initial Parity Scenario Catalog

Date: 2026-02-11
Status: Baseline established (pre-rewrite parity targets)

## Scope

This catalog defines the first set of parity scenarios to lock behavior before subsystem migration. Each scenario should be represented in replay fixtures, unit assertions, and e2e smoke coverage as phases advance.

## Scenario list

| ID | Scenario | Legacy behavior anchor | Observable parity assertions | Planned harness |
|---|---|---|---|---|
| PAR-001 | Bootstrap and deterministic idle ticks | `App:init()` load path and event loop bootstrap in current runtime | Same seed and command stream produce identical step hashes and final hash | Replay fixture + unit determinism tests |
| PAR-002 | Patient queue enters diagnosis/treatment loop | `World:onTick` queue processing path | Patient waiting count, treated count, and cash deltas follow deterministic scripted outcomes | Replay fixture + simulation unit tests |
| PAR-003 | Pause/resume event dispatch stability | SDL event dispatch + pause controls | Paused ticks do not advance simulation hash; resumed ticks continue deterministic hash chain | Replay + app integration tests |
| PAR-004 | Map navigation baseline path solve | Map and occupancy handling in Lua/native bridge | Fixed map fixtures return expected path route and tie-break order | Pathfinding golden tests (Phase 2) |
| PAR-005 | Core room operation loop | Room queue handling and treatment completion | Room processing transitions produce expected state transitions with no invalid occupancy states | Replay + slice-level unit tests |
| PAR-006 | Save/load roundtrip baseline | Persist module integration with runtime state | Save-load-save roundtrip preserves deterministic state hash and schema version | Persistence roundtrip tests (Phase 6) |

## Current runnable parity artifact (Phase 0)

- Fixture: `web/packages/replay/fixtures/phase0-trivial.replay.json`
- Schema: `replay.v0`
- Seed: `1234`
- Expected step hashes:
  - `633425fb`
  - `31762ea4`
  - `d98e686f`
  - `54a6d1b6`

## Notes

- PAR-001 and PAR-002 are partially implemented in Phase 0 as deterministic replay smoke.
- Remaining scenarios are cataloged now and become mandatory lock-tests before corresponding phase rewrites.
