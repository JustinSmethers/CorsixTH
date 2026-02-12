import fixture from "./fixtures/phase2-pathfinding-golden.json";
import { DeterministicPathfindingService, PATHFINDING_TIE_BREAK_RULES } from "../src/pathfinding";
import { OccupancyMap } from "../src/occupancy-map";
import { TileMap, type TileDefinition } from "../src/map-model";

interface FixturePosition {
  x: number;
  y: number;
}

interface FixtureTileDefinition {
  id: number;
  name: string;
  metadata: {
    kind: string;
    passable: boolean;
    movementCost: number;
  };
}

interface FixtureScenario {
  id: string;
  rows: string[];
  start: FixturePosition;
  goal: FixturePosition;
  blockedPositions: FixturePosition[];
  expectedFound: boolean;
  expectedTotalCost: number;
  expectedPath: FixturePosition[];
}

interface PathfindingFixture {
  schemaVersion: "pathfinding.v0";
  id: string;
  tileLegend: Record<string, number>;
  tileDefinitions: FixtureTileDefinition[];
  scenarios: FixtureScenario[];
}

function parseFixture(): PathfindingFixture {
  const parsed = fixture as PathfindingFixture;
  expect(parsed.schemaVersion).toBe("pathfinding.v0");
  return parsed;
}

function mapFromScenario(scenario: FixtureScenario, parsed: PathfindingFixture): TileMap {
  const rows = scenario.rows.map((row, y) =>
    row.split("").map((symbol, x) => {
      const tileId = parsed.tileLegend[symbol];
      if (tileId === undefined) {
        throw new Error(`Unknown tile legend symbol '${symbol}' at (${x}, ${y})`);
      }
      return tileId;
    })
  );
  const definitions: TileDefinition[] = parsed.tileDefinitions.map((definition) => ({
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
});
