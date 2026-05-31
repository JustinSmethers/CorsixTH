import { assertGameCommand } from "@corsixth/core";
function isRecord(value) {
    return typeof value === "object" && value !== null;
}
export function parseReplayFixtureV0(value) {
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
    const commands = value.commands.map((command) => {
        assertGameCommand(command);
        return command;
    });
    if (!Array.isArray(value.expectedStepHashes) || value.expectedStepHashes.some((v) => typeof v !== "string")) {
        throw new Error("Replay fixture expectedStepHashes must be a string array");
    }
    if (value.expectedStepHashes.length !== commands.length) {
        throw new Error(`Replay fixture expectedStepHashes length (${value.expectedStepHashes.length}) must match command count (${commands.length})`);
    }
    return {
        schemaVersion: "replay.v0",
        id: value.id,
        seed,
        commands,
        expectedStepHashes: value.expectedStepHashes
    };
}
