import { DeterministicSimulation } from "@corsixth/core";
import { parseReplayFixtureV0 } from "./replay-format";
export function runReplayFixture(input) {
    const fixture = parseReplayFixtureV0(input);
    return runReplayFixtureV0(fixture);
}
export function runReplayFixtureV0(fixture) {
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
function arraysEqual(left, right) {
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
