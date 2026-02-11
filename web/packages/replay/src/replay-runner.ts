import { DeterministicSimulation } from "@corsixth/core";
import { parseReplayFixtureV0, type ReplayFixtureV0 } from "./replay-format";

export interface ReplayRunResult {
  fixtureId: string;
  stepHashes: string[];
  passed: boolean;
}

export function runReplayFixture(input: unknown): ReplayRunResult {
  const fixture = parseReplayFixtureV0(input);
  return runReplayFixtureV0(fixture);
}

export function runReplayFixtureV0(fixture: ReplayFixtureV0): ReplayRunResult {
  const simulation = new DeterministicSimulation(fixture.seed);

  const stepHashes = fixture.commands.map((command) => {
    simulation.execute(command);
    return simulation.currentHash();
  });

  return {
    fixtureId: fixture.id,
    stepHashes,
    passed: arraysEqual(stepHashes, fixture.expectedStepHashes)
  };
}

function arraysEqual(left: string[], right: string[]): boolean {
  if (left.length !== right.length) {
    return false;
  }

  for (let i = 0; i < left.length; i += 1) {
    if (left[i] !== right[i]) {
      return false;
    }
  }

  return true;
}
