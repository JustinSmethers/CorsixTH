import { DeterministicSimulation } from "../src/simulation";
function bootstrapCapacity(simulation) {
    for (let i = 0; i < 8; i += 1) {
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
function runLongSession(simulation) {
    let maxWaitingPatients = 0;
    let maxSerializedStateBytes = 0;
    let maxRecentEvents = 0;
    const checkpointHashes = [];
    for (let cycle = 0; cycle < 1_800; cycle += 1) {
        for (let admitOffset = 0; admitOffset < 2; admitOffset += 1) {
            simulation.execute({
                type: "admit-patient",
                severity: (((cycle + admitOffset) % 3) + 1),
                position: {
                    x: (cycle * 5 + admitOffset * 3) % 32,
                    y: (cycle * 7 + admitOffset * 2) % 32
                }
            });
        }
        if (cycle % 4 === 0) {
            simulation.execute({
                type: "schedule-admit-patient",
                delay: (cycle % 6) + 1,
                severity: (((cycle + 1) % 3) + 1)
            });
        }
        if (cycle % 5 === 0) {
            simulation.execute({ type: "treat-patient" });
        }
        if (cycle % 13 === 0) {
            simulation.execute({
                type: "set-staff-status",
                staffId: 1,
                status: cycle % 26 === 0 ? "on-break" : "active"
            });
        }
        if (cycle % 17 === 0) {
            simulation.execute({
                type: "set-room-status",
                roomId: 2,
                status: cycle % 34 === 0 ? "closed" : "open"
            });
        }
        simulation.execute({ type: "tick", count: 12 });
        if (cycle % 3 === 0) {
            simulation.execute({ type: "treat-patient" });
        }
        const state = simulation.getState();
        maxWaitingPatients = Math.max(maxWaitingPatients, state.patientsWaiting);
        maxSerializedStateBytes = Math.max(maxSerializedStateBytes, JSON.stringify(state).length);
        maxRecentEvents = Math.max(maxRecentEvents, state.events.recent.length);
        if (cycle % 300 === 0) {
            checkpointHashes.push(simulation.currentHash());
        }
    }
    return {
        maxWaitingPatients,
        maxSerializedStateBytes,
        maxRecentEvents,
        checkpointHashes
    };
}
describe("phase 9 long-session memory guardrails", () => {
    it("keeps long-session state growth bounded", () => {
        const simulation = new DeterministicSimulation(9401, { bounds: { width: 32, height: 32 } });
        bootstrapCapacity(simulation);
        const telemetry = runLongSession(simulation);
        const finalState = simulation.getState();
        expect(finalState.tick).toBe(21_600);
        expect(finalState.counters.totalAdmissions).toBe(4_050);
        expect(finalState.events.recent).toHaveLength(24);
        expect(telemetry.maxRecentEvents).toBeLessThanOrEqual(24);
        expect(telemetry.maxWaitingPatients).toBeLessThanOrEqual(240);
        expect(telemetry.maxSerializedStateBytes).toBeLessThanOrEqual(55_000);
        expect(telemetry.checkpointHashes).toEqual([
            "4f88dc2f",
            "12ce6a55",
            "f91f2e4f",
            "d47188a2",
            "006c5bec",
            "f23e0bce"
        ]);
    });
});
