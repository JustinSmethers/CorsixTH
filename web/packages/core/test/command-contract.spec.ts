import { assertGameCommand, isGameCommand } from "../src/command-contract";

describe("command contract", () => {
  it("accepts valid commands", () => {
    expect(isGameCommand({ type: "tick", count: 1 })).toBe(true);
    expect(isGameCommand({ type: "admit-patient", severity: 2 })).toBe(true);
    expect(isGameCommand({ type: "treat-patient" })).toBe(true);
  });

  it("rejects invalid commands", () => {
    expect(isGameCommand({ type: "tick", count: 0 })).toBe(false);
    expect(isGameCommand({ type: "admit-patient", severity: 5 })).toBe(false);
    expect(isGameCommand({ type: "unknown" })).toBe(false);
  });

  it("throws on assertion failures", () => {
    expect(() => assertGameCommand({ type: "tick", count: -1 })).toThrow(/Invalid game command/);
  });
});
