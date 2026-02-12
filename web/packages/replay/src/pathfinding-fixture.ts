import {
  DeterministicPathfindingService,
  OccupancyMap,
  TileMap,
  type GridPosition,
  type TileDefinition
} from "@corsixth/core";

export interface PathfindingFixtureScenario {
  id: string;
  rows: string[];
  start: GridPosition;
  goal: GridPosition;
  blockedPositions: GridPosition[];
  expectedFound: boolean;
  expectedTotalCost: number;
  expectedPath: GridPosition[];
}

export interface PathfindingFixtureV0 {
  schemaVersion: "pathfinding.v0";
  id: string;
  tileLegend: Record<string, number>;
  tileDefinitions: TileDefinition[];
  scenarios: PathfindingFixtureScenario[];
}

export interface PathfindingFixtureScenarioResult {
  id: string;
  passed: boolean;
  expectedFound: boolean;
  found: boolean;
  expectedTotalCost: number;
  totalCost: number;
  expectedPath: GridPosition[];
  path: GridPosition[];
}

export interface PathfindingFixtureRunResult {
  fixtureId: string;
  passed: boolean;
  scenarioResults: PathfindingFixtureScenarioResult[];
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function isGridPosition(value: unknown): value is GridPosition {
  return (
    isRecord(value) &&
    Number.isInteger(value.x) &&
    Number.isInteger(value.y) &&
    (value.x as number) >= 0 &&
    (value.y as number) >= 0
  );
}

function assertGridPosition(value: unknown, label: string): GridPosition {
  if (!isGridPosition(value)) {
    throw new Error(`Invalid grid position for ${label}`);
  }
  return { x: value.x, y: value.y };
}

function positionsEqual(left: GridPosition[], right: GridPosition[]): boolean {
  if (left.length !== right.length) {
    return false;
  }

  for (let i = 0; i < left.length; i += 1) {
    const leftPos = left[i];
    const rightPos = right[i];
    if (!leftPos || !rightPos) {
      return false;
    }
    if (leftPos.x !== rightPos.x || leftPos.y !== rightPos.y) {
      return false;
    }
  }

  return true;
}

function parseTileDefinition(value: unknown, index: number): TileDefinition {
  if (!isRecord(value)) {
    throw new Error(`Invalid tile definition at index ${index}`);
  }

  const metadata = value.metadata;
  if (
    !isRecord(metadata) ||
    typeof metadata.kind !== "string" ||
    typeof metadata.passable !== "boolean" ||
    !Number.isInteger(metadata.movementCost) ||
    (metadata.movementCost as number) <= 0
  ) {
    throw new Error(`Invalid tile metadata at index ${index}`);
  }

  if (!Number.isInteger(value.id) || (value.id as number) < 0 || typeof value.name !== "string" || value.name.length === 0) {
    throw new Error(`Invalid tile definition fields at index ${index}`);
  }
  const id = value.id as number;
  const name = value.name;
  const kind = metadata.kind;
  const passable = metadata.passable;
  const movementCost = metadata.movementCost as number;

  return {
    id,
    name,
    metadata: {
      kind,
      passable,
      movementCost
    }
  };
}

function parseScenario(value: unknown, index: number): PathfindingFixtureScenario {
  if (!isRecord(value)) {
    throw new Error(`Invalid scenario at index ${index}`);
  }

  if (typeof value.id !== "string" || value.id.length === 0) {
    throw new Error(`Scenario id must be a non-empty string at index ${index}`);
  }

  if (!Array.isArray(value.rows) || value.rows.length === 0 || value.rows.some((row) => typeof row !== "string")) {
    throw new Error(`Scenario rows must be a non-empty string array for ${value.id}`);
  }
  const rows = value.rows as string[];

  if (!Array.isArray(value.blockedPositions)) {
    throw new Error(`Scenario blockedPositions must be an array for ${value.id}`);
  }
  const blockedPositions = value.blockedPositions;

  if (!Array.isArray(value.expectedPath)) {
    throw new Error(`Scenario expectedPath must be an array for ${value.id}`);
  }
  const expectedPath = value.expectedPath;

  if (typeof value.expectedFound !== "boolean") {
    throw new Error(`Scenario expectedFound must be boolean for ${value.id}`);
  }

  if (!Number.isInteger(value.expectedTotalCost) || (value.expectedTotalCost as number) < 0) {
    throw new Error(`Scenario expectedTotalCost must be a non-negative integer for ${value.id}`);
  }
  const expectedTotalCost = value.expectedTotalCost as number;

  return {
    id: value.id,
    rows,
    start: assertGridPosition(value.start, `${value.id}.start`),
    goal: assertGridPosition(value.goal, `${value.id}.goal`),
    blockedPositions: blockedPositions.map((position, blockedIndex) =>
      assertGridPosition(position, `${value.id}.blockedPositions[${blockedIndex}]`)
    ),
    expectedFound: value.expectedFound,
    expectedTotalCost,
    expectedPath: expectedPath.map((position, pathIndex) =>
      assertGridPosition(position, `${value.id}.expectedPath[${pathIndex}]`)
    )
  };
}

export function parsePathfindingFixtureV0(value: unknown): PathfindingFixtureV0 {
  if (!isRecord(value)) {
    throw new Error("Pathfinding fixture must be an object");
  }

  if (value.schemaVersion !== "pathfinding.v0") {
    throw new Error(`Unsupported pathfinding fixture schema: ${String(value.schemaVersion)}`);
  }

  if (typeof value.id !== "string" || value.id.length === 0) {
    throw new Error("Pathfinding fixture id must be a non-empty string");
  }

  if (!isRecord(value.tileLegend)) {
    throw new Error("Pathfinding fixture tileLegend must be an object");
  }

  const tileLegend: Record<string, number> = {};
  for (const [symbol, tileId] of Object.entries(value.tileLegend)) {
    if (symbol.length !== 1 || typeof tileId !== "number" || !Number.isInteger(tileId) || tileId < 0) {
      throw new Error(`Invalid tile legend entry: ${symbol}`);
    }
    tileLegend[symbol] = tileId;
  }

  if (!Array.isArray(value.tileDefinitions) || value.tileDefinitions.length === 0) {
    throw new Error("Pathfinding fixture tileDefinitions must be a non-empty array");
  }

  if (!Array.isArray(value.scenarios) || value.scenarios.length === 0) {
    throw new Error("Pathfinding fixture scenarios must be a non-empty array");
  }

  const tileDefinitions = value.tileDefinitions.map((definition, index) => parseTileDefinition(definition, index));
  const scenarios = value.scenarios.map((scenario, index) => parseScenario(scenario, index));

  return {
    schemaVersion: "pathfinding.v0",
    id: value.id,
    tileLegend,
    tileDefinitions,
    scenarios
  };
}

function scenarioRowsToTileIds(rows: string[], tileLegend: Record<string, number>): number[] {
  const tileIds: number[] = [];

  for (let y = 0; y < rows.length; y += 1) {
    const row = rows[y] ?? "";
    for (let x = 0; x < row.length; x += 1) {
      const symbol = row.charAt(x);
      const tileId = tileLegend[symbol];
      if (tileId === undefined) {
        throw new Error(`Unknown tile legend symbol '${symbol}' at (${x}, ${y})`);
      }
      tileIds.push(tileId);
    }
  }

  return tileIds;
}

export function runPathfindingFixture(input: unknown): PathfindingFixtureRunResult {
  const fixture = parsePathfindingFixtureV0(input);

  const scenarioResults = fixture.scenarios.map((scenario) => {
    const width = scenario.rows[0]?.length ?? 0;
    for (const row of scenario.rows) {
      if (row.length !== width) {
        throw new Error(`Scenario ${scenario.id} has inconsistent row widths`);
      }
    }

    const tileMap = new TileMap({
      width,
      height: scenario.rows.length,
      tileIds: scenarioRowsToTileIds(scenario.rows, fixture.tileLegend),
      tileDefinitions: fixture.tileDefinitions
    });

    const occupancy = new OccupancyMap(tileMap);
    let blockerEntityId = 100_000;
    for (const blocker of scenario.blockedPositions) {
      const placed = occupancy.place(blockerEntityId, blocker);
      if (!placed.applied) {
        throw new Error(`Failed to place blocker ${blockerEntityId} for scenario ${scenario.id}: ${placed.reason}`);
      }
      blockerEntityId += 1;
    }

    const service = new DeterministicPathfindingService(tileMap, occupancy);
    const solved = service.solve({ start: scenario.start, goal: scenario.goal });

    const passed =
      solved.found === scenario.expectedFound &&
      solved.totalCost === scenario.expectedTotalCost &&
      positionsEqual(solved.path, scenario.expectedPath);

    return {
      id: scenario.id,
      passed,
      expectedFound: scenario.expectedFound,
      found: solved.found,
      expectedTotalCost: scenario.expectedTotalCost,
      totalCost: solved.totalCost,
      expectedPath: scenario.expectedPath,
      path: solved.path
    } satisfies PathfindingFixtureScenarioResult;
  });

  return {
    fixtureId: fixture.id,
    passed: scenarioResults.every((scenario) => scenario.passed),
    scenarioResults
  };
}
