import { DeterministicSimulation } from "../src/simulation";
function bootstrapPerformanceScenario(simulation) {
    for (let i = 0; i < 10; i += 1) {
        simulation.execute({
            type: "hire-staff",
            role: i % 2 === 0 ? "diagnostician" : "nurse"
        });
        simulation.execute({
            type: "open-room",
            roomType: i % 2 === 0 ? "diagnosis" : "treatment"
        });
    }
}
describe("phase 9 performance thresholds", () => {
    it("meets deterministic simulation throughput budget", () => {
        const simulation = new DeterministicSimulation(9901, { bounds: { width: 32, height: 32 } });
        bootstrapPerformanceScenario(simulation);
        const iterations = 600;
        const ticksPerIteration = 16;
        const totalTicks = iterations * ticksPerIteration;
        const start = performance.now();
        for (let i = 0; i < iterations; i += 1) {
            simulation.execute({
                type: "admit-patient",
                severity: ((i % 3) + 1),
                position: { x: (i * 5) % 32, y: (i * 9) % 32 }
            });
            if (i % 4 === 0) {
                simulation.execute({ type: "treat-patient" });
            }
            simulation.execute({ type: "tick", count: ticksPerIteration });
        }
        const elapsedMs = performance.now() - start;
        const ticksPerSecond = totalTicks / (elapsedMs / 1000);
        console.info(`[phase9-perf] tick-throughput ticks=${totalTicks} elapsed=${elapsedMs.toFixed(2)}ms throughput=${ticksPerSecond.toFixed(2)} ticks/sec`);
        expect(ticksPerSecond).toBeGreaterThanOrEqual(35_000);
        expect(simulation.getState().tick).toBe(totalTicks);
    });
    it("meets mixed command latency budget", () => {
        const simulation = new DeterministicSimulation(9902, { bounds: { width: 24, height: 24 } });
        bootstrapPerformanceScenario(simulation);
        const commandCount = 900;
        const start = performance.now();
        for (let i = 0; i < commandCount; i += 1) {
            if (i % 9 === 0) {
                simulation.execute({ type: "tick", count: 8 });
            }
            else if (i % 5 === 0) {
                simulation.execute({
                    type: "schedule-admit-patient",
                    delay: (i % 6) + 1,
                    severity: (((i + 1) % 3) + 1)
                });
            }
            else if (i % 4 === 0) {
                simulation.execute({ type: "treat-patient" });
            }
            else {
                simulation.execute({
                    type: "admit-patient",
                    severity: ((i % 3) + 1),
                    position: { x: (i * 3) % 24, y: (i * 7) % 24 }
                });
            }
        }
        const elapsedMs = performance.now() - start;
        const avgCommandMs = elapsedMs / commandCount;
        console.info(`[phase9-perf] command-latency commands=${commandCount} elapsed=${elapsedMs.toFixed(2)}ms avg=${avgCommandMs.toFixed(4)}ms`);
        expect(avgCommandMs).toBeLessThanOrEqual(0.45);
    });
});
