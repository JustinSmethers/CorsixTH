import { DEFAULT_RULESET } from "../src/index";

describe("rules package scaffold", () => {
  it("exports a baseline ruleset marker", () => {
    expect(DEFAULT_RULESET.id).toBe("phase0-baseline");
  });
});
