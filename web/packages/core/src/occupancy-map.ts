import type { GridPosition } from "./command-contract";
import { TileMap } from "./map-model";

export type OccupancyFailureReason =
  | "out-of-bounds"
  | "impassable-tile"
  | "occupied"
  | "entity-missing"
  | "entity-already-placed"
  | "invalid-entity-id";

export interface OccupancyTransitionResult {
  applied: boolean;
  revision: number;
  reason?: OccupancyFailureReason;
  from?: GridPosition;
  to?: GridPosition;
}

export interface OccupancySnapshotEntity {
  entityId: number;
  position: GridPosition;
}

export interface OccupancySnapshot {
  revision: number;
  entities: OccupancySnapshotEntity[];
}

function clonePosition(position: GridPosition): GridPosition {
  return { x: position.x, y: position.y };
}

function isValidEntityId(entityId: number): boolean {
  return Number.isInteger(entityId) && entityId > 0;
}

export class OccupancyMap {
  readonly tileMap: TileMap;

  private readonly occupantByIndex: Int32Array;
  private readonly indexByEntity = new Map<number, number>();
  private stateRevision = 0;

  constructor(tileMap: TileMap) {
    this.tileMap = tileMap;
    this.occupantByIndex = new Int32Array(tileMap.size);
  }

  get revision(): number {
    return this.stateRevision;
  }

  isOccupied(position: GridPosition): boolean {
    return this.occupantAt(position) !== null;
  }

  occupantAt(position: GridPosition): number | null {
    if (!this.tileMap.isInBounds(position)) {
      return null;
    }
    const occupant = this.occupantByIndex[this.tileMap.toIndex(position)] ?? 0;
    return occupant > 0 ? occupant : null;
  }

  positionOf(entityId: number): GridPosition | null {
    const index = this.indexByEntity.get(entityId);
    if (index === undefined) {
      return null;
    }
    return this.tileMap.toPosition(index);
  }

  canEnter(position: GridPosition, movingEntityId?: number): boolean {
    if (!this.tileMap.isInBounds(position)) {
      return false;
    }

    if (!this.tileMap.isPassable(position)) {
      return false;
    }

    const occupant = this.occupantAt(position);
    if (occupant === null) {
      return true;
    }

    return movingEntityId !== undefined && occupant === movingEntityId;
  }

  place(entityId: number, position: GridPosition): OccupancyTransitionResult {
    if (!isValidEntityId(entityId)) {
      return { applied: false, reason: "invalid-entity-id", revision: this.stateRevision, to: clonePosition(position) };
    }

    if (this.indexByEntity.has(entityId)) {
      return {
        applied: false,
        reason: "entity-already-placed",
        revision: this.stateRevision,
        to: clonePosition(position)
      };
    }

    const check = this.checkDestination(position, entityId);
    if (check !== null) {
      return {
        applied: false,
        reason: check,
        revision: this.stateRevision,
        to: clonePosition(position)
      };
    }

    const destinationIndex = this.tileMap.toIndex(position);
    this.occupantByIndex[destinationIndex] = entityId;
    this.indexByEntity.set(entityId, destinationIndex);
    this.stateRevision += 1;

    return { applied: true, revision: this.stateRevision, to: clonePosition(position) };
  }

  move(entityId: number, destination: GridPosition): OccupancyTransitionResult {
    if (!isValidEntityId(entityId)) {
      return { applied: false, reason: "invalid-entity-id", revision: this.stateRevision, to: clonePosition(destination) };
    }

    const currentIndex = this.indexByEntity.get(entityId);
    if (currentIndex === undefined) {
      return {
        applied: false,
        reason: "entity-missing",
        revision: this.stateRevision,
        to: clonePosition(destination)
      };
    }

    const source = this.tileMap.toPosition(currentIndex);
    const check = this.checkDestination(destination, entityId);
    if (check !== null) {
      return {
        applied: false,
        reason: check,
        revision: this.stateRevision,
        from: source,
        to: clonePosition(destination)
      };
    }

    const destinationIndex = this.tileMap.toIndex(destination);
    if (destinationIndex === currentIndex) {
      return {
        applied: false,
        reason: "occupied",
        revision: this.stateRevision,
        from: source,
        to: clonePosition(destination)
      };
    }

    this.occupantByIndex[currentIndex] = 0;
    this.occupantByIndex[destinationIndex] = entityId;
    this.indexByEntity.set(entityId, destinationIndex);
    this.stateRevision += 1;

    return {
      applied: true,
      revision: this.stateRevision,
      from: source,
      to: clonePosition(destination)
    };
  }

  remove(entityId: number): OccupancyTransitionResult {
    if (!isValidEntityId(entityId)) {
      return { applied: false, reason: "invalid-entity-id", revision: this.stateRevision };
    }

    const index = this.indexByEntity.get(entityId);
    if (index === undefined) {
      return { applied: false, reason: "entity-missing", revision: this.stateRevision };
    }

    const source = this.tileMap.toPosition(index);
    this.occupantByIndex[index] = 0;
    this.indexByEntity.delete(entityId);
    this.stateRevision += 1;

    return {
      applied: true,
      revision: this.stateRevision,
      from: source
    };
  }

  snapshot(): OccupancySnapshot {
    const entities = Array.from(this.indexByEntity.entries())
      .sort((left, right) => left[0] - right[0])
      .map(([entityId, index]) => ({
        entityId,
        position: this.tileMap.toPosition(index)
      }));

    return {
      revision: this.stateRevision,
      entities
    };
  }

  private checkDestination(position: GridPosition, movingEntityId?: number): OccupancyFailureReason | null {
    if (!this.tileMap.isInBounds(position)) {
      return "out-of-bounds";
    }

    if (!this.tileMap.isPassable(position)) {
      return "impassable-tile";
    }

    const occupant = this.occupantAt(position);
    if (occupant !== null && occupant !== movingEntityId) {
      return "occupied";
    }

    return null;
  }
}
