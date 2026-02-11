import { phase0CommandSequence } from "../src/index";

describe("testkit scaffold", () => {
  it("exports a deterministic command script", () => {
    expect(phase0CommandSequence()).toHaveLength(4);
  });
});
