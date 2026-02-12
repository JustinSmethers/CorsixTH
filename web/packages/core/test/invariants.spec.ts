import { DeterministicRng } from "../src/deterministic";
import { DeterministicSimulation, type SimulationState } from "../src/simulation";

function assertInvariants(state: SimulationState): void {
  expect(state.patientsWaiting).toBe(state.entities.waitingPatients.length);
  expect(state.reputation).toBeGreaterThanOrEqual(0);
  expect(state.reputation).toBeLessThanOrEqual(1000);
  expect(state.cash).toBeGreaterThanOrEqual(-1_000_000);
  expect(state.cash).toBeLessThanOrEqual(10_000_000);
  for (const patient of state.entities.waitingPatients) {
    expect(patient.position.x).toBeGreaterThanOrEqual(0);
    expect(patient.position.y).toBeGreaterThanOrEqual(0);
    expect(patient.position.x).toBeLessThan(state.bounds.width);
    expect(patient.position.y).toBeLessThan(state.bounds.height);
  }
}

describe("simulation invariants", () => {
  it("rejects invalid positions", () => {
    const simulation = new DeterministicSimulation(1, { bounds: { width: 8, height: 8 } });
    expect(() =>
      simulation.execute({ type: "admit-patient", severity: 2, position: { x: -1, y: 0 } })
    ).toThrow(/position/i);
  });

  it("keeps bounded values and monotonic counters under randomized command streams", () => {
    for (let seed = 1; seed <= 24; seed += 1) {
      const simulation = new DeterministicSimulation(seed, { bounds: { width: 12, height: 6 } });
      const rng = new DeterministicRng(seed ^ 0x9e37_79b9);

      let previous = simulation.getState();
      for (let step = 0; step < 250; step += 1) {
        const roll = rng.nextFloat();
        if (roll < 0.2) {
          simulation.execute({
            type: "admit-patient",
            severity: (rng.nextInt(1, 4) as 1 | 2 | 3),
            position: { x: rng.nextInt(0, 12), y: rng.nextInt(0, 6) }
          });
        } else if (roll < 0.35) {
          simulation.execute({
            type: "schedule-admit-patient",
            delay: rng.nextInt(1, 5),
            severity: (rng.nextInt(1, 4) as 1 | 2 | 3)
          });
        } else if (roll < 0.5) {
          simulation.execute({ type: "treat-patient" });
        } else {
          simulation.execute({ type: "tick", count: rng.nextInt(1, 4) });
        }

        const state = simulation.getState();
        assertInvariants(state);
        expect(state.tick).toBeGreaterThanOrEqual(previous.tick);
        expect(state.counters.totalAdmissions).toBeGreaterThanOrEqual(previous.counters.totalAdmissions);
        expect(state.counters.totalTreatments).toBeGreaterThanOrEqual(previous.counters.totalTreatments);
        expect(state.counters.nextEntityId).toBeGreaterThanOrEqual(previous.counters.nextEntityId);
        previous = state;
      }
    }
  });
});
