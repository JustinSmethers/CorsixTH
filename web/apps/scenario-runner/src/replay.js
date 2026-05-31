import fixture from "../../../packages/replay/fixtures/phase0-trivial.replay.json" with { type: "json" };
import { runReplayFixture } from "@corsixth/replay";
const result = runReplayFixture(fixture);
if (!result.passed) {
    console.error(`[replay] FAILED ${result.fixtureId}`);
    console.error(`[replay] expected hashes: ${fixture.expectedStepHashes.join(",")}`);
    console.error(`[replay] actual hashes:   ${result.stepHashes.join(",")}`);
    throw new Error("Replay parity mismatch");
}
else {
    console.log(`[replay] PASSED ${result.fixtureId}`);
    console.log(`[replay] hashes: ${result.stepHashes.join(",")}`);
}
