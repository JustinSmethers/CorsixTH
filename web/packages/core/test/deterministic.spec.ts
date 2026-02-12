import { DeterministicSimulation } from "../src/simulation";

const scriptedCommands = [
  { type: "admit-patient", severity: 2, position: { x: 1, y: 1 } },
  { type: "schedule-admit-patient", delay: 2, severity: 1, position: { x: 2, y: 2 } },
  { type: "tick", count: 3 },
  { type: "treat-patient" },
  { type: "tick", count: 2 }
] as const;

describe("deterministic simulation", () => {
  it("produces identical command-level and tick-level hashes for same seed and commands", () => {
    const left = new DeterministicSimulation(1234, { bounds: { width: 8, height: 8 } });
    const right = new DeterministicSimulation(1234, { bounds: { width: 8, height: 8 } });

    const leftHashes = scriptedCommands.map((command) => {
      left.execute(command);
      return left.currentHash();
    });
    const rightHashes = scriptedCommands.map((command) => {
      right.execute(command);
      return right.currentHash();
    });

    const leftTickHashes: string[] = [];
    const rightTickHashes: string[] = [];
    for (let i = 0; i < 50; i += 1) {
      left.execute({ type: "tick", count: 1 });
      right.execute({ type: "tick", count: 1 });
      leftTickHashes.push(left.currentHash());
      rightTickHashes.push(right.currentHash());
    }

    expect(leftHashes).toEqual(rightHashes);
    expect(leftTickHashes).toEqual(rightTickHashes);
    expect(leftHashes[leftHashes.length - 1]).toBe("062db64a");
    expect(leftTickHashes[leftTickHashes.length - 1]).toBe("9e093c2a");
  });

  it("diverges for different seeds", () => {
    const left = new DeterministicSimulation(1, { bounds: { width: 8, height: 8 } });
    const right = new DeterministicSimulation(2, { bounds: { width: 8, height: 8 } });

    left.execute({ type: "tick", count: 5 });
    right.execute({ type: "tick", count: 5 });

    expect(left.currentHash()).not.toEqual(right.currentHash());
  });
});
