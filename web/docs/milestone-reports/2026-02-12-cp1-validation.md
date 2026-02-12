# CP-1 Validation Evidence

Date: 2026-02-12  
Checkpoint: CP-1  
Status: Passed

## Commands and outcomes

| Command | Result | Notes |
|---|---|---|
| `pnpm --dir web run lint` | Passed | ESLint gate remained clean after Phase 1 core changes |
| `pnpm --dir web run typecheck` | Passed | Strict TS project references passed with scheduler/entity model additions |
| `pnpm --dir web run test` | Passed | 13 files / 23 tests green, including scheduler/RNG/invariant/determinism coverage |
| `pnpm --dir web run test:replay` | Passed | Replay harness validates Phase 0 fixture plus new Phase 1 `1200` tick deterministic fixture |
| `pnpm --dir web run test:core-isolation` | Passed | No DOM/WebGL/WebAudio/browser API dependencies found in `packages/core/src` |
| `pnpm --dir web run phase1:check` | Passed | Aggregated Phase 1 quality gates green |

## Determinism evidence

- Core deterministic long-run replay fixture: `web/packages/replay/fixtures/phase1-long-run.replay.json`
- Scenario length: `1240` ticks (`1200` + `40`) with scheduled admissions in tick loop
- Locked replay step hashes:
  - `5e24210b`
  - `d115accc`
  - `11a14bb9`
  - `51de52d3`
  - `99e592cc`
  - `38c3d603`
- Phase 0 fixture re-baselined after Phase 1 kernel model lock:
  - `e83adb53`, `f1c8125f`, `76dc6395`, `a33b2a56`

## Phase 1 implementation coverage

- Deterministic kernel world tick loop and scheduler model implemented in `web/packages/core/src/simulation.ts`.
- Seeded RNG, deterministic clock, and deterministic scheduler utility implemented in `web/packages/core/src/deterministic.ts`.
- Stable state hashing retained and strengthened via normalized stable serialization in `web/packages/core/src/simulation.ts` (`hashSimulationState`).
- Replay assertions consume state hashes through `runReplayFixture` in `web/packages/replay/src/replay-runner.ts`.

## CI and gate wiring evidence

- New workflow: `.github/workflows/web-rewrite-phase1.yml`
- New gate script: `web/scripts/phase1-check.sh`
- New isolation enforcement: `web/scripts/check-core-isolation.sh`
- Required gate command set:
  - lint
  - typecheck
  - unit
  - determinism replay
  - core isolation

## Browser/device matrix and performance budget lock references

- Matrix and budgets recorded in: `docs/architecture/typescript-web-rewrite-plan.md`
- Section: `Supported browser/device matrix and performance budgets (CP-1 lock)`
