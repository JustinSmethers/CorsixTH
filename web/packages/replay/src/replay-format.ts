import { assertGameCommand, type GameCommand } from "@corsixth/core";

export interface ReplayFixtureV0 {
  schemaVersion: "replay.v0";
  id: string;
  seed: number;
  commands: GameCommand[];
  expectedStepHashes: string[];
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

export function parseReplayFixtureV0(value: unknown): ReplayFixtureV0 {
  if (!isRecord(value)) {
    throw new Error("Replay fixture must be an object");
  }

  if (value.schemaVersion !== "replay.v0") {
    throw new Error(`Unsupported replay schema version: ${String(value.schemaVersion)}`);
  }

  if (typeof value.id !== "string" || value.id.length === 0) {
    throw new Error("Replay fixture id must be a non-empty string");
  }

  if (typeof value.seed !== "number" || !Number.isInteger(value.seed)) {
    throw new Error("Replay fixture seed must be an integer");
  }
  const seed = value.seed;

  if (!Array.isArray(value.commands)) {
    throw new Error("Replay fixture commands must be an array");
  }

  const commands: GameCommand[] = value.commands.map((command) => {
    assertGameCommand(command);
    return command;
  });

  if (!Array.isArray(value.expectedStepHashes) || value.expectedStepHashes.some((v) => typeof v !== "string")) {
    throw new Error("Replay fixture expectedStepHashes must be a string array");
  }

  return {
    schemaVersion: "replay.v0",
    id: value.id,
    seed,
    commands,
    expectedStepHashes: value.expectedStepHashes
  };
}
