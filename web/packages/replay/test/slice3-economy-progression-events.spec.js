import fixture from "../fixtures/phase7-slice3-economy-progression-events.replay.json";
import { parseReplayFixtureV0, runReplayFixture } from "../src/index";
describe("phase 7 slice 3 replay parity fixture", () => {
    it("parses the locked replay fixture schema", () => {
        const parsed = parseReplayFixtureV0(fixture);
        expect(parsed.id).toBe("phase7-slice3-economy-progression-events");
        expect(parsed.commands).toHaveLength(9);
    });
    it("validates deterministic state hashes for the slice 3 baseline scenario", () => {
        const result = runReplayFixture(fixture);
        expect(result.passed).toBe(true);
        expect(result.stepHashes).toEqual(fixture.expectedStepHashes);
    });
});
