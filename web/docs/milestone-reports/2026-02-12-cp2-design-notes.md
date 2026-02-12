# CP-2 Design Notes: Tile Occupancy Boundaries and Deterministic Tie-Breaking

Date: 2026-02-12
Checkpoint: CP-2

## Occupancy boundaries

Implemented in:
- `web/packages/core/src/map-model.ts`
- `web/packages/core/src/occupancy-map.ts`

Boundary contract:
1. Tile coordinates must be integer grid positions within map bounds.
2. Traversal eligibility is controlled by tile metadata (`passable`, `movementCost`).
3. Occupancy transitions are deterministic and revisioned:
   - successful `place`, `move`, `remove` increment `revision` by `1`
   - rejected transitions do not mutate occupancy state or revision
4. Rejection reasons are explicit and stable (`out-of-bounds`, `impassable-tile`, `occupied`, `entity-missing`, `entity-already-placed`, `invalid-entity-id`).
5. Occupancy snapshots sort by entity id to guarantee stable parity comparisons.

## Deterministic tie-breaking behavior

Implemented in:
- `web/packages/core/src/pathfinding.ts`

Tie-break ordering is explicit and exported as `PATHFINDING_TIE_BREAK_RULES`:
1. `lowest-f-score`
2. `lowest-heuristic`
3. `lowest-y-then-x`
4. `lowest-open-insertion-order`

Additional deterministic controls:
- Fixed neighbor expansion order: north, west, east, south.
- Equal-cost parent rewrites use deterministic coordinate ordering.
- Occupancy-aware traversal allows start-tile occupancy while still blocking occupied destination tiles.

## Locked fixture coverage

- Golden fixture: `web/packages/core/test/fixtures/phase2-pathfinding-golden.json`
- Replay mirror: `web/packages/replay/fixtures/phase2-pathfinding-golden.json`
- Deterministic fixture runner: `web/packages/replay/src/pathfinding-fixture.ts`

## Validation tests

- Map model tests: `web/packages/core/test/map-model.spec.ts`
- Occupancy determinism tests: `web/packages/core/test/occupancy-map.spec.ts`
- Pathfinding golden tests: `web/packages/core/test/pathfinding-golden.spec.ts`
- Pathfinding property tests: `web/packages/core/test/pathfinding-property.spec.ts`
- Pathfinding perf tests: `web/packages/core/test/pathfinding-perf.spec.ts`
- Replay fixture parity tests: `web/packages/replay/test/pathfinding-fixture.spec.ts`
