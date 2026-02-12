import { TileMap, type TileDefinition } from "../src/map-model";

const tileDefinitions: TileDefinition[] = [
  { id: 0, name: "floor", metadata: { kind: "floor", passable: true, movementCost: 1 } },
  { id: 1, name: "wall", metadata: { kind: "wall", passable: false, movementCost: 1 } },
  { id: 2, name: "slow", metadata: { kind: "slow", passable: true, movementCost: 3 } }
];

describe("tile map model", () => {
  it("builds a map with metadata lookup and deterministic index mapping", () => {
    const map = TileMap.fromRows(
      [
        [0, 1, 0],
        [2, 0, 0]
      ],
      tileDefinitions
    );

    expect(map.width).toBe(3);
    expect(map.height).toBe(2);
    expect(map.size).toBe(6);

    expect(map.tileIdAt({ x: 1, y: 0 })).toBe(1);
    expect(map.metadataAt({ x: 0, y: 1 })).toEqual({ kind: "slow", passable: true, movementCost: 3 });
    expect(map.isPassable({ x: 1, y: 0 })).toBe(false);
    expect(map.movementCostAt({ x: 0, y: 1 })).toBe(3);

    const index = map.toIndex({ x: 2, y: 1 });
    expect(index).toBe(5);
    expect(map.toPosition(index)).toEqual({ x: 2, y: 1 });
  });

  it("rejects malformed map and tile metadata inputs", () => {
    expect(() =>
      TileMap.fromRows(
        [
          [0, 1],
          [0]
        ],
        tileDefinitions
      )
    ).toThrow(/row/i);

    expect(() => TileMap.fromRows([[0, 9]], tileDefinitions)).toThrow(/tile definition/i);

    expect(() =>
      TileMap.fromRows([[0]], [{ id: 0, name: "bad", metadata: { kind: "bad", passable: true, movementCost: 0 } }])
    ).toThrow(/movementCost/i);
  });
});
