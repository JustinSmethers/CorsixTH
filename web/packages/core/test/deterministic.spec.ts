import { DeterministicSimulation } from "../src/simulation";

const scriptedCommands = [
  { type: "admit-patient", severity: 2 },
  { type: "tick", count: 3 },
  { type: "treat-patient" },
  { type: "tick", count: 2 }
] as const;

describe("deterministic simulation", () => {
  it("produces identical hashes for same seed and commands", () => {
    const left = new DeterministicSimulation(1234);
    const right = new DeterministicSimulation(1234);

    const leftHashes = scriptedCommands.map((command) => {
      left.execute(command);
      return left.currentHash();
    });
    const rightHashes = scriptedCommands.map((command) => {
      right.execute(command);
      return right.currentHash();
    });

    expect(leftHashes).toEqual(rightHashes);
    expect(leftHashes[leftHashes.length - 1]).toBe("54a6d1b6");
  });

  it("diverges for different seeds", () => {
    const left = new DeterministicSimulation(1);
    const right = new DeterministicSimulation(2);

    left.execute({ type: "tick", count: 5 });
    right.execute({ type: "tick", count: 5 });

    expect(left.currentHash()).not.toEqual(right.currentHash());
  });
});
