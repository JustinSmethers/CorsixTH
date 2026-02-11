import { buildDeterministicFrame } from "../src/index";

describe("renderer-webgl scaffold", () => {
  it("builds deterministic draw order", () => {
    const frame = buildDeterministicFrame("smoke", ["entity-2", "entity-1"]);
    expect(frame.deterministicOrder).toEqual(["entity-1", "entity-2"]);
  });
});
