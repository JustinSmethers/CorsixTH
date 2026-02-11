import { validateAssetPath } from "../src/index";

describe("assets scaffold", () => {
  it("validates non-empty paths", () => {
    expect(validateAssetPath("/tmp/theme").valid).toBe(true);
    expect(validateAssetPath("").valid).toBe(false);
  });
});
