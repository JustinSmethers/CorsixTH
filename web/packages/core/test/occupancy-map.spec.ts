import { OccupancyMap } from "../src/occupancy-map";
import { TileMap, type TileDefinition } from "../src/map-model";

const tileDefinitions: TileDefinition[] = [
  { id: 0, name: "floor", metadata: { kind: "floor", passable: true, movementCost: 1 } },
  { id: 1, name: "wall", metadata: { kind: "wall", passable: false, movementCost: 1 } }
];

function createMap(): TileMap {
  return TileMap.fromRows(
    [
      [0, 0, 0],
      [0, 1, 0],
      [0, 0, 0]
    ],
    tileDefinitions
  );
}

describe("occupancy map", () => {
  it("applies deterministic placement and movement transitions", () => {
    const occupancy = new OccupancyMap(createMap());

    expect(occupancy.place(100, { x: 0, y: 0 })).toEqual({
      applied: true,
      revision: 1,
      to: { x: 0, y: 0 }
    });

    expect(occupancy.place(200, { x: 0, y: 0 })).toEqual({
      applied: false,
      reason: "occupied",
      revision: 1,
      to: { x: 0, y: 0 }
    });

    expect(occupancy.move(100, { x: 1, y: 0 })).toEqual({
      applied: true,
      revision: 2,
      from: { x: 0, y: 0 },
      to: { x: 1, y: 0 }
    });

    expect(occupancy.move(100, { x: 1, y: 1 })).toEqual({
      applied: false,
      reason: "impassable-tile",
      revision: 2,
      from: { x: 1, y: 0 },
      to: { x: 1, y: 1 }
    });

    expect(occupancy.remove(100)).toEqual({
      applied: true,
      revision: 3,
      from: { x: 1, y: 0 }
    });

    expect(occupancy.remove(100)).toEqual({
      applied: false,
      reason: "entity-missing",
      revision: 3
    });

    expect(occupancy.snapshot()).toEqual({ revision: 3, entities: [] });
  });

  it("produces identical snapshots for identical transition streams", () => {
    const left = new OccupancyMap(createMap());
    const right = new OccupancyMap(createMap());

    const runScript = (target: OccupancyMap): string[] => {
      const snapshots: string[] = [];
      const operations = [
        () => target.place(1, { x: 0, y: 0 }),
        () => target.place(2, { x: 2, y: 2 }),
        () => target.move(2, { x: 2, y: 1 }),
        () => target.move(1, { x: 0, y: 1 }),
        () => target.move(2, { x: 1, y: 1 }),
        () => target.remove(1)
      ];

      for (const operation of operations) {
        operation();
        snapshots.push(JSON.stringify(target.snapshot()));
      }
      return snapshots;
    };

    expect(runScript(left)).toEqual(runScript(right));
  });
});
