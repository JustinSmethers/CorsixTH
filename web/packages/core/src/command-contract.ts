export const GAME_COMMAND_TYPES = ["tick", "admit-patient", "treat-patient"] as const;

export type GameCommandType = (typeof GAME_COMMAND_TYPES)[number];

export type GameCommand =
  | { type: "tick"; count: number }
  | { type: "admit-patient"; severity: 1 | 2 | 3 }
  | { type: "treat-patient" };

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

export function isGameCommand(value: unknown): value is GameCommand {
  if (!isRecord(value) || typeof value.type !== "string") {
    return false;
  }

  if (!GAME_COMMAND_TYPES.includes(value.type as GameCommandType)) {
    return false;
  }

  if (value.type === "tick") {
    return typeof value.count === "number" && Number.isInteger(value.count) && value.count > 0 && value.count <= 10_000;
  }

  if (value.type === "admit-patient") {
    return value.severity === 1 || value.severity === 2 || value.severity === 3;
  }

  return true;
}

export function assertGameCommand(value: unknown): asserts value is GameCommand {
  if (!isGameCommand(value)) {
    throw new Error(`Invalid game command: ${JSON.stringify(value)}`);
  }
}
