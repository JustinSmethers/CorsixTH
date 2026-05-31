import { DeterministicRng } from "../src/deterministic";
import { DeterministicPathfindingService } from "../src/pathfinding";
import { TileMap } from "../src/map-model";
const tileDefinitions = [
    { id: 0, name: "floor", metadata: { kind: "floor", passable: true, movementCost: 1 } },
    { id: 1, name: "wall", metadata: { kind: "wall", passable: false, movementCost: 1 } }
];
function createBenchMap(width, height, seed) {
    const rng = new DeterministicRng(seed);
    const rows = [];
    for (let y = 0; y < height; y += 1) {
        const row = [];
        for (let x = 0; x < width; x += 1) {
            const border = x === 0 || y === 0 || x === width - 1 || y === height - 1;
            if (border) {
                row.push(0);
            }
            else {
                row.push(rng.nextFloat() < 0.17 ? 1 : 0);
            }
        }
        rows.push(row);
    }
    for (let y = 0; y < height; y += 1) {
        const row = rows[y];
        if (!row) {
            throw new Error(`Missing generated row ${y}`);
        }
        row[Math.floor(width / 2)] = 0;
    }
    const centerRow = rows[Math.floor(height / 2)];
    if (!centerRow) {
        throw new Error("Missing generated center row");
    }
    for (let x = 0; x < width; x += 1) {
        centerRow[x] = 0;
    }
    return TileMap.fromRows(rows, tileDefinitions);
}
function createQueries(width, height, count, seed) {
    const rng = new DeterministicRng(seed);
    const queries = [];
    for (let i = 0; i < count; i += 1) {
        queries.push({
            start: { x: rng.nextInt(0, width), y: rng.nextInt(0, height) },
            goal: { x: rng.nextInt(0, width), y: rng.nextInt(0, height) }
        });
    }
    return queries;
}
function measureAverageSolveTimeMs(service, queries) {
    const startTime = performance.now();
    for (const query of queries) {
        service.solve(query);
    }
    const elapsedMs = performance.now() - startTime;
    return elapsedMs / queries.length;
}
describe("pathfinding performance budgets", () => {
    it("stays within solve-time budget for 64x64 maps", () => {
        const map = createBenchMap(64, 64, 0x0bad_f00d);
        const service = new DeterministicPathfindingService(map);
        const queries = createQueries(64, 64, 300, 0x1234_5678);
        const averageMs = measureAverageSolveTimeMs(service, queries);
        console.info(`[pathfinding-perf] 64x64 average solve ${averageMs.toFixed(3)} ms over ${queries.length} routes`);
        expect(averageMs).toBeLessThanOrEqual(4.0);
    });
    it("stays within solve-time budget for 128x128 maps", () => {
        const map = createBenchMap(128, 128, 0xdead_beef);
        const service = new DeterministicPathfindingService(map);
        const queries = createQueries(128, 128, 200, 0x4242_0001);
        const averageMs = measureAverageSolveTimeMs(service, queries);
        console.info(`[pathfinding-perf] 128x128 average solve ${averageMs.toFixed(3)} ms over ${queries.length} routes`);
        expect(averageMs).toBeLessThanOrEqual(12.0);
    });
});
