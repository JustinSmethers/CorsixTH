import fixture from "./fixtures/phase2-pathfinding-golden.json";
import { DeterministicPathfindingService, PATHFINDING_TIE_BREAK_RULES } from "../src/pathfinding";
import { OccupancyMap } from "../src/occupancy-map";
import { TileMap } from "../src/map-model";
function parseFixture() {
    const parsed = fixture;
    expect(parsed.schemaVersion).toBe("pathfinding.v0");
    return parsed;
}
function mapFromScenario(scenario, parsed) {
    const rows = scenario.rows.map((row, y) => row.split("").map((symbol, x) => {
        const tileId = parsed.tileLegend[symbol];
        if (tileId === undefined) {
            throw new Error(`Unknown tile legend symbol '${symbol}' at (${x}, ${y})`);
        }
        return tileId;
    }));
    const definitions = parsed.tileDefinitions.map((definition) => ({
        id: definition.id,
        name: definition.name,
        metadata: {
            kind: definition.metadata.kind,
            passable: definition.metadata.passable,
            movementCost: definition.metadata.movementCost
        }
    }));
    return TileMap.fromRows(rows, definitions);
}
describe("pathfinding golden fixtures", () => {
    it("keeps tie-break ordering explicit and locked", () => {
        expect(PATHFINDING_TIE_BREAK_RULES).toEqual([
            "lowest-f-score",
            "lowest-heuristic",
            "lowest-y-then-x",
            "lowest-open-insertion-order"
        ]);
    });
    it("matches locked Phase 2 golden routes", () => {
        const parsed = parseFixture();
        for (const scenario of parsed.scenarios) {
            const map = mapFromScenario(scenario, parsed);
            const occupancy = new OccupancyMap(map);
            let blockerId = 10_000;
            for (const blocker of scenario.blockedPositions) {
                const placed = occupancy.place(blockerId, blocker);
                expect(placed.applied).toBe(true);
                blockerId += 1;
            }
            const service = new DeterministicPathfindingService(map, occupancy);
            const first = service.solve({ start: scenario.start, goal: scenario.goal });
            const second = service.solve({ start: scenario.start, goal: scenario.goal });
            expect(first).toEqual(second);
            expect(first.found).toBe(scenario.expectedFound);
            expect(first.totalCost).toBe(scenario.expectedTotalCost);
            expect(first.path).toEqual(scenario.expectedPath);
            expect(first.tieBreakRules).toEqual(PATHFINDING_TIE_BREAK_RULES);
        }
    });
    it("does not cross directional wall metadata", () => {
        const map = TileMap.fromRows([
            [0, 1, 0],
            [0, 0, 0]
        ], [
            { id: 0, name: "floor", metadata: { kind: "floor", passable: true, movementCost: 1 } },
            {
                id: 1,
                name: "east-wall",
                metadata: {
                    kind: "floor",
                    passable: true,
                    movementCost: 1,
                    canTravelE: false
                }
            }
        ]);
        const service = new DeterministicPathfindingService(map);
        const result = service.solve({ start: { x: 0, y: 0 }, goal: { x: 2, y: 0 } });
        expect(result.found).toBe(true);
        expect(result.path).toEqual([
            { x: 0, y: 0 },
            { x: 1, y: 0 },
            { x: 1, y: 1 },
            { x: 2, y: 1 },
            { x: 2, y: 0 }
        ]);
    });
    it("honors per-request blocked and allowed route positions", () => {
        const map = TileMap.fromRows([
            [0, 0, 0, 0, 0],
            [0, 0, 0, 0, 0],
            [0, 0, 0, 0, 0]
        ], [
            { id: 0, name: "floor", metadata: { kind: "floor", passable: true, movementCost: 1 } }
        ]);
        const service = new DeterministicPathfindingService(map);
        const detour = service.solve({
            start: { x: 0, y: 1 },
            goal: { x: 4, y: 1 },
            blockedPositions: [{ x: 1, y: 1 }, { x: 2, y: 1 }, { x: 3, y: 1 }]
        });
        expect(detour.found).toBe(true);
        expect(detour.path).toEqual([
            { x: 0, y: 1 },
            { x: 0, y: 0 },
            { x: 1, y: 0 },
            { x: 2, y: 0 },
            { x: 3, y: 0 },
            { x: 4, y: 0 },
            { x: 4, y: 1 }
        ]);
        const allowedGoal = service.solve({
            start: { x: 0, y: 1 },
            goal: { x: 2, y: 1 },
            blockedPositions: [{ x: 1, y: 1 }, { x: 2, y: 1 }],
            allowedPositions: [{ x: 2, y: 1 }]
        });
        expect(allowedGoal.found).toBe(true);
        expect(allowedGoal.path[allowedGoal.path.length - 1]).toEqual({ x: 2, y: 1 });
        expect(allowedGoal.path).not.toContainEqual({ x: 1, y: 1 });
    });
});
