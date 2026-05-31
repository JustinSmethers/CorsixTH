import fixture from "../fixtures/phase7-slice1-core-hospital-loop.replay.json";
import { parseReplayFixtureV0, runReplayFixture } from "../src/index";
describe("phase 7 slice 1 replay parity fixture", () => {
    it("parses the locked replay fixture schema", () => {
        const parsed = parseReplayFixtureV0(fixture);
        expect(parsed.id).toBe("phase7-slice1-core-hospital-loop");
        expect(parsed.commands).toHaveLength(6);
    });
    it("validates deterministic state hashes for the slice 1 baseline scenario", () => {
        const result = runReplayFixture(fixture);
        expect(result.passed).toBe(true);
        expect(result.stepHashes).toEqual(fixture.expectedStepHashes);
    });
});
