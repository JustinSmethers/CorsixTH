import { DeterministicRng } from "../src/deterministic";
import { DeterministicPathfindingService } from "../src/pathfinding";
import { TileMap } from "../src/map-model";
const tileDefinitions = [
    { id: 0, name: "floor", metadata: { kind: "floor", passable: true, movementCost: 1 } },
    { id: 1, name: "wall", metadata: { kind: "wall", passable: false, movementCost: 1 } }
];
function manhattanDistance(a, b) {
    return Math.abs(a.x - b.x) + Math.abs(a.y - b.y);
}
function neighborsOf(position, width, height) {
    const candidates = [
        { x: position.x, y: position.y - 1 },
        { x: position.x - 1, y: position.y },
        { x: position.x + 1, y: position.y },
        { x: position.x, y: position.y + 1 }
    ];
    return candidates.filter((candidate) => candidate.x >= 0 && candidate.y >= 0 && candidate.x < width && candidate.y < height);
}
function bfsShortestLength(map, start, goal) {
    if (!map.isPassable(start) || !map.isPassable(goal)) {
        return null;
    }
    const queue = [start];
    const distances = new Map();
    distances.set(`${start.x},${start.y}`, 0);
    for (let i = 0; i < queue.length; i += 1) {
        const current = queue[i];
        if (!current) {
            continue;
        }
        const key = `${current.x},${current.y}`;
        const distance = distances.get(key);
        if (distance === undefined) {
            continue;
        }
        if (current.x === goal.x && current.y === goal.y) {
            return distance + 1;
        }
        for (const next of neighborsOf(current, map.width, map.height)) {
            if (!map.canTravel(current, next)) {
                continue;
            }
            const nextKey = `${next.x},${next.y}`;
            if (distances.has(nextKey)) {
                continue;
            }
            distances.set(nextKey, distance + 1);
            queue.push(next);
        }
    }
    return null;
}
function assertPathIsValid(path, map, start, goal) {
    expect(path.length).toBeGreaterThan(0);
    const first = path[0];
    const last = path[path.length - 1];
    if (!first || !last) {
        throw new Error("Path is unexpectedly empty");
    }
    expect(first).toEqual(start);
    expect(last).toEqual(goal);
    for (let i = 0; i < path.length; i += 1) {
        const step = path[i];
        if (!step) {
            throw new Error(`Path step missing at index ${i}`);
        }
        expect(map.isPassable(step)).toBe(true);
        if (i > 0) {
            const prev = path[i - 1];
            if (!prev) {
                throw new Error(`Previous path step missing at index ${i - 1}`);
            }
            expect(manhattanDistance(prev, step)).toBe(1);
            expect(map.canTravel(prev, step)).toBe(true);
        }
    }
}
describe("pathfinding property coverage", () => {
    it("finds shortest routes on randomized passable/impassable maps", () => {
        for (let seed = 1; seed <= 24; seed += 1) {
            const rng = new DeterministicRng(seed ^ 0x9e37_79b9);
            const width = 16;
            const height = 12;
            const rows = [];
            for (let y = 0; y < height; y += 1) {
                const row = [];
                for (let x = 0; x < width; x += 1) {
                    row.push(rng.nextFloat() < 0.3 ? 1 : 0);
                }
                rows.push(row);
            }
            const map = TileMap.fromRows(rows, tileDefinitions);
            const service = new DeterministicPathfindingService(map);
            for (let trial = 0; trial < 20; trial += 1) {
                const start = { x: rng.nextInt(0, width), y: rng.nextInt(0, height) };
                const goal = { x: rng.nextInt(0, width), y: rng.nextInt(0, height) };
                const expectedLength = bfsShortestLength(map, start, goal);
                const result = service.solve({ start, goal });
                expect(result.found).toBe(expectedLength !== null);
                if (expectedLength !== null) {
                    assertPathIsValid(result.path, map, start, goal);
                    expect(result.path.length).toBe(expectedLength);
                }
                else {
                    expect(result.path).toEqual([]);
                    expect(result.totalCost).toBe(0);
                }
            }
        }
    });
    it("never routes through impassable endpoints", () => {
        const map = TileMap.fromRows([
            [0, 0, 0],
            [0, 1, 0],
            [0, 0, 0]
        ], tileDefinitions);
        const service = new DeterministicPathfindingService(map);
        expect(service.solve({ start: { x: 0, y: 0 }, goal: { x: 1, y: 1 } }).found).toBe(false);
        expect(service.solve({ start: { x: 1, y: 1 }, goal: { x: 2, y: 2 } }).found).toBe(false);
    });
});
