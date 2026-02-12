import type { GridPosition } from "./command-contract";
import { TileMap } from "./map-model";
import type { OccupancyMap } from "./occupancy-map";

export const PATHFINDING_TIE_BREAK_RULES = [
  "lowest-f-score",
  "lowest-heuristic",
  "lowest-y-then-x",
  "lowest-open-insertion-order"
] as const;
const UNSEEN_DISCOVERY_ORDER = 2_147_483_647;

export interface PathfindingRequest {
  start: GridPosition;
  goal: GridPosition;
  movingEntityId?: number;
}

export interface PathfindingResult {
  found: boolean;
  path: GridPosition[];
  totalCost: number;
  visitedNodes: number;
  expandedNodes: number;
  tieBreakRules: readonly string[];
}

function manhattanDistance(left: GridPosition, right: GridPosition): number {
  return Math.abs(left.x - right.x) + Math.abs(left.y - right.y);
}

function isBetterOpenCandidate(
  leftIndex: number,
  rightIndex: number,
  fScore: Float64Array,
  hScore: Float64Array,
  discoveryOrder: Int32Array,
  width: number
): boolean {
  const leftF = fScore[leftIndex]!;
  const rightF = fScore[rightIndex]!;
  if (leftF !== rightF) {
    return leftF < rightF;
  }

  const leftH = hScore[leftIndex]!;
  const rightH = hScore[rightIndex]!;
  if (leftH !== rightH) {
    return leftH < rightH;
  }

  const leftY = Math.floor(leftIndex / width);
  const leftX = leftIndex - leftY * width;
  const rightY = Math.floor(rightIndex / width);
  const rightX = rightIndex - rightY * width;
  if (leftY !== rightY) {
    return leftY < rightY;
  }
  if (leftX !== rightX) {
    return leftX < rightX;
  }

  const leftOrder = discoveryOrder[leftIndex]!;
  const rightOrder = discoveryOrder[rightIndex]!;
  if (leftOrder !== rightOrder) {
    return leftOrder < rightOrder;
  }

  return leftIndex < rightIndex;
}

function isBetterParent(candidateParent: number, currentParent: number, width: number): boolean {
  if (currentParent < 0) {
    return true;
  }

  const candidateY = Math.floor(candidateParent / width);
  const candidateX = candidateParent - candidateY * width;
  const currentY = Math.floor(currentParent / width);
  const currentX = currentParent - currentY * width;

  if (candidateY !== currentY) {
    return candidateY < currentY;
  }
  if (candidateX !== currentX) {
    return candidateX < currentX;
  }

  return candidateParent < currentParent;
}

function samePosition(left: GridPosition, right: GridPosition): boolean {
  return left.x === right.x && left.y === right.y;
}

export class DeterministicPathfindingService {
  private readonly tileMap: TileMap;
  private readonly occupancy: OccupancyMap | null;

  constructor(tileMap: TileMap, occupancy?: OccupancyMap) {
    this.tileMap = tileMap;
    this.occupancy = occupancy ?? null;
  }

  solve(request: PathfindingRequest): PathfindingResult {
    const start = { x: request.start.x, y: request.start.y };
    const goal = { x: request.goal.x, y: request.goal.y };

    if (!this.tileMap.isInBounds(start) || !this.tileMap.isInBounds(goal)) {
      return this.emptyResult();
    }

    if (!this.isTraversable(start, request.movingEntityId, start) || !this.isTraversable(goal, request.movingEntityId, start)) {
      return this.emptyResult();
    }

    if (samePosition(start, goal)) {
      return {
        found: true,
        path: [start],
        totalCost: 0,
        visitedNodes: 1,
        expandedNodes: 1,
        tieBreakRules: PATHFINDING_TIE_BREAK_RULES
      };
    }

    const startIndex = this.tileMap.toIndex(start);
    const goalIndex = this.tileMap.toIndex(goal);
    const nodeCount = this.tileMap.size;

    const gScore = new Float64Array(nodeCount);
    const hScore = new Float64Array(nodeCount);
    const fScore = new Float64Array(nodeCount);
    const cameFrom = new Int32Array(nodeCount);
    const inOpenSet = new Uint8Array(nodeCount);
    const inClosedSet = new Uint8Array(nodeCount);
    const discoveryOrder = new Int32Array(nodeCount);

    for (let i = 0; i < nodeCount; i += 1) {
      gScore[i] = Number.POSITIVE_INFINITY;
      hScore[i] = Number.POSITIVE_INFINITY;
      fScore[i] = Number.POSITIVE_INFINITY;
      cameFrom[i] = -1;
      discoveryOrder[i] = UNSEEN_DISCOVERY_ORDER;
    }

    let discoveredCount = 1;
    let expandedNodes = 0;
    let nextDiscoveryOrder = 0;

    gScore[startIndex] = 0;
    hScore[startIndex] = manhattanDistance(start, goal);
    fScore[startIndex] = hScore[startIndex];
    discoveryOrder[startIndex] = nextDiscoveryOrder;
    nextDiscoveryOrder += 1;

    const openSet: number[] = [startIndex];
    inOpenSet[startIndex] = 1;

    while (openSet.length > 0) {
      let bestOpenSetPosition = 0;
      for (let i = 1; i < openSet.length; i += 1) {
        if (
          isBetterOpenCandidate(
            openSet[i] ?? 0,
            openSet[bestOpenSetPosition] ?? 0,
            fScore,
            hScore,
            discoveryOrder,
            this.tileMap.width
          )
        ) {
          bestOpenSetPosition = i;
        }
      }

      const currentIndex = openSet.splice(bestOpenSetPosition, 1)[0] ?? -1;
      if (currentIndex < 0) {
        break;
      }

      inOpenSet[currentIndex] = 0;
      inClosedSet[currentIndex] = 1;
      expandedNodes += 1;

      if (currentIndex === goalIndex) {
        const path = this.reconstructPath(cameFrom, currentIndex);
        return {
          found: true,
          path,
          totalCost: gScore[currentIndex]!,
          visitedNodes: discoveredCount,
          expandedNodes,
          tieBreakRules: PATHFINDING_TIE_BREAK_RULES
        };
      }

      const currentPosition = this.tileMap.toPosition(currentIndex);
      const currentScore = gScore[currentIndex]!;

      for (const neighbor of this.neighbors(currentPosition)) {
        const neighborIndex = this.tileMap.toIndex(neighbor);
        if (inClosedSet[neighborIndex] === 1) {
          continue;
        }

        if (!this.isTraversable(neighbor, request.movingEntityId, start)) {
          continue;
        }

        const tentativeG = currentScore + this.tileMap.movementCostAt(neighbor);
        const knownG = gScore[neighborIndex]!;
        const betterG = tentativeG < knownG;
        const equalGWithBetterParent =
          tentativeG === knownG && isBetterParent(currentIndex, cameFrom[neighborIndex] ?? -1, this.tileMap.width);

        if (!betterG && !equalGWithBetterParent) {
          continue;
        }

        if (!Number.isFinite(knownG)) {
          discoveredCount += 1;
        }

        cameFrom[neighborIndex] = currentIndex;
        gScore[neighborIndex] = tentativeG;
        hScore[neighborIndex] = manhattanDistance(neighbor, goal);
        fScore[neighborIndex] = tentativeG + hScore[neighborIndex];

        if (inOpenSet[neighborIndex] === 0) {
          openSet.push(neighborIndex);
          inOpenSet[neighborIndex] = 1;
          if (discoveryOrder[neighborIndex] === UNSEEN_DISCOVERY_ORDER) {
            discoveryOrder[neighborIndex] = nextDiscoveryOrder;
            nextDiscoveryOrder += 1;
          }
        }
      }
    }

    return {
      found: false,
      path: [],
      totalCost: 0,
      visitedNodes: discoveredCount,
      expandedNodes,
      tieBreakRules: PATHFINDING_TIE_BREAK_RULES
    };
  }

  private emptyResult(): PathfindingResult {
    return {
      found: false,
      path: [],
      totalCost: 0,
      visitedNodes: 0,
      expandedNodes: 0,
      tieBreakRules: PATHFINDING_TIE_BREAK_RULES
    };
  }

  private isTraversable(position: GridPosition, movingEntityId: number | undefined, start: GridPosition): boolean {
    if (!this.tileMap.isInBounds(position)) {
      return false;
    }

    if (!this.tileMap.isPassable(position)) {
      return false;
    }

    if (!this.occupancy) {
      return true;
    }

    if (samePosition(position, start)) {
      return true;
    }

    return this.occupancy.canEnter(position, movingEntityId);
  }

  private neighbors(position: GridPosition): GridPosition[] {
    const neighbors: GridPosition[] = [];

    const north = { x: position.x, y: position.y - 1 };
    if (this.tileMap.isInBounds(north)) {
      neighbors.push(north);
    }

    const west = { x: position.x - 1, y: position.y };
    if (this.tileMap.isInBounds(west)) {
      neighbors.push(west);
    }

    const east = { x: position.x + 1, y: position.y };
    if (this.tileMap.isInBounds(east)) {
      neighbors.push(east);
    }

    const south = { x: position.x, y: position.y + 1 };
    if (this.tileMap.isInBounds(south)) {
      neighbors.push(south);
    }

    return neighbors;
  }

  private reconstructPath(cameFrom: Int32Array, goalIndex: number): GridPosition[] {
    const pathIndices: number[] = [];
    let cursor = goalIndex;

    while (cursor >= 0) {
      pathIndices.push(cursor);
      cursor = cameFrom[cursor] ?? -1;
    }

    pathIndices.reverse();
    return pathIndices.map((index) => this.tileMap.toPosition(index));
  }
}
