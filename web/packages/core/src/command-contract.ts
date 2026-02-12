export const GAME_COMMAND_TYPES = ["tick", "admit-patient", "treat-patient", "schedule-admit-patient"] as const;

export type GameCommandType = (typeof GAME_COMMAND_TYPES)[number];

export interface GridPosition {
  x: number;
  y: number;
}

export type GameCommand =
  | { type: "tick"; count: number }
  | { type: "admit-patient"; severity: 1 | 2 | 3; position?: GridPosition }
  | { type: "schedule-admit-patient"; delay: number; severity: 1 | 2 | 3; position?: GridPosition }
  | { type: "treat-patient" };

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

function isSeverity(value: unknown): value is 1 | 2 | 3 {
  return value === 1 || value === 2 || value === 3;
}

export function isGameCommand(value: unknown): value is GameCommand {
  if (!isRecord(value) || typeof value.type !== "string") {
    return false;
  }

  if (!GAME_COMMAND_TYPES.includes(value.type as GameCommandType)) {
    return false;
  }

  if (value.type === "tick") {
    return typeof value.count === "number" && Number.isInteger(value.count) && value.count > 0 && value.count <= 100_000;
  }

  if (value.type === "admit-patient") {
    return isSeverity(value.severity) && (value.position === undefined || isGridPosition(value.position));
  }

  if (value.type === "schedule-admit-patient") {
    return (
      typeof value.delay === "number" &&
      Number.isInteger(value.delay) &&
      value.delay > 0 &&
      value.delay <= 100_000 &&
      isSeverity(value.severity) &&
      (value.position === undefined || isGridPosition(value.position))
    );
  }

  return true;
}

export function assertGameCommand(value: unknown): asserts value is GameCommand {
  if (!isGameCommand(value)) {
    throw new Error(`Invalid game command: ${JSON.stringify(value)}`);
  }
}
