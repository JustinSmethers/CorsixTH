import fixture from "../fixtures/phase0-trivial.replay.json";
import { parseReplayFixtureV0, runReplayFixture } from "../src/index";

describe("replay harness v0", () => {
  it("parses replay fixture v0", () => {
    const parsed = parseReplayFixtureV0(fixture);
    expect(parsed.id).toBe("phase0-trivial");
    expect(parsed.commands).toHaveLength(4);
  });

  it("runs a deterministic fixture and validates all hashes", () => {
    const result = runReplayFixture(fixture);
    expect(result.passed).toBe(true);
    expect(result.stepHashes).toEqual(fixture.expectedStepHashes);
  });

  it("fails parity if a hash diverges", () => {
    const broken = {
      ...fixture,
      expectedStepHashes: [...fixture.expectedStepHashes.slice(0, 3), "deadbeef"]
    };
    const result = runReplayFixture(broken);
    expect(result.passed).toBe(false);
  });
});
