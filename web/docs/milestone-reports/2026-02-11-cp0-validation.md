# CP-0 Validation Evidence

Date: 2026-02-11
Checkpoint: CP-0
Status: Passed

## Commands and outcomes

| Command | Result | Notes |
|---|---|---|
| `pnpm --dir web run lint` | Passed | ESLint baseline wiring validated |
| `pnpm --dir web run typecheck` | Passed | TypeScript strict project references validated |
| `pnpm --dir web run test` | Passed | 10 test files / 15 tests green |
| `pnpm --dir web run test:replay` | Passed | Replay harness v0 fixture validated |
| `pnpm --dir web run test:e2e` | Passed | Playwright smoke scenario green |
| `pnpm --dir web run test:assets` | Passed | Canonical Theme Hospital fixture path preflight passed |
| `pnpm --dir web run phase0:check` | Passed | Aggregated gate script green |

## Replay evidence

- Fixture: `web/packages/replay/fixtures/phase0-trivial.replay.json`
- Final expected hash: `54a6d1b6`
- Replay command contract: `pnpm --dir web run replay`

## CI evidence

- Workflow: `.github/workflows/web-rewrite-phase0.yml`
- Required gates wired:
  - lint
  - typecheck
  - unit
  - replay subset
  - e2e smoke subset
  - asset preflight contract

## Constraints encountered

- Local sandbox cannot resolve npm registry DNS for fresh install (`ENOTFOUND`).
- Phase 0 command wiring resolves tools from `./node_modules/*` first, with `../node_modules/*` fallback for constrained local execution.
- CI workflow still performs standard `pnpm install --dir web` for networked runners.
