import fixture from "../fixtures/phase0-trivial.replay.json";
import phase1LongRunFixture from "../fixtures/phase1-long-run.replay.json";
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

  it("covers a 1000+ tick deterministic replay scenario", () => {
    const parsed = parseReplayFixtureV0(phase1LongRunFixture);
    expect(parsed.commands).toEqual(expect.arrayContaining([{ type: "tick", count: 1200 }]));

    const result = runReplayFixture(parsed);
    expect(result.stepHashes).toEqual(parsed.expectedStepHashes);
    expect(result.passed).toBe(true);
  });
});
