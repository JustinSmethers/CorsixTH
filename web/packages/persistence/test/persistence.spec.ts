import { createSaveEnvelope } from "../src/index";

describe("persistence scaffold", () => {
  it("creates a versioned save envelope", () => {
    expect(createSaveEnvelope("abcd")).toEqual({ version: "0", stateHash: "abcd" });
  });
});
