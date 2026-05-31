import { DeterministicRng } from "../src/deterministic";
import { DeterministicSimulation } from "../src/simulation";
import { QUEUE_PRESSURE_HIGH_THRESHOLD } from "@corsixth/rules";
function assertInvariants(state) {
    expect(state.patientsWaiting).toBe(state.entities.waitingPatients.length);
    expect(state.staffLifecycle.activeStaff + state.staffLifecycle.onBreakStaff).toBe(state.entities.staff.length);
    expect(state.roomOperations.openDiagnosisRooms + state.roomOperations.closedDiagnosisRooms).toBe(state.entities.rooms.filter((room) => room.roomType === "diagnosis").length);
    expect(state.roomOperations.openTreatmentRooms + state.roomOperations.closedTreatmentRooms).toBe(state.entities.rooms.filter((room) => room.roomType === "treatment").length);
    expect(state.reputation).toBeGreaterThanOrEqual(0);
    expect(state.reputation).toBeLessThanOrEqual(1000);
    expect(state.cash).toBeGreaterThanOrEqual(-1_000_000);
    expect(state.cash).toBeLessThanOrEqual(10_000_000);
    expect(state.secondarySystems.queuePressure).toBeGreaterThanOrEqual(0);
    expect(state.secondarySystems.queuePressure).toBeLessThanOrEqual(state.patientsWaiting);
    if (state.secondarySystems.queuePressure >= QUEUE_PRESSURE_HIGH_THRESHOLD) {
        expect(state.secondarySystems.queuePressureStatus).toBe("high");
    }
    else {
        expect(state.secondarySystems.queuePressureStatus).toBe("normal");
    }
    expect(state.secondarySystems.autoBreakStaff).toBeLessThanOrEqual(state.staffLifecycle.onBreakStaff);
    expect(state.secondarySystems.roomsInMaintenance).toBeLessThanOrEqual(state.entities.rooms.length);
    expect(state.secondarySystems.criticalPatients).toBeLessThanOrEqual(state.patientsWaiting);
    expect(state.hospitalLoop.patientDeaths).toBe(state.counters.totalPatientDeaths);
    expect(state.hospitalLoop.treatmentFailures).toBe(state.counters.totalTreatmentFailures);
    expect(state.secondarySystems.patientDeaths).toBe(state.counters.totalPatientDeaths);
    for (const patient of state.entities.waitingPatients) {
        expect(patient.position.x).toBeGreaterThanOrEqual(0);
        expect(patient.position.y).toBeGreaterThanOrEqual(0);
        expect(patient.position.x).toBeLessThan(state.bounds.width);
        expect(patient.position.y).toBeLessThan(state.bounds.height);
        expect(patient.health).toBeGreaterThan(0);
        expect(patient.health).toBeLessThanOrEqual(patient.maxHealth);
        expect(typeof patient.diseaseId).toBe("string");
        expect(patient.diseaseId.length).toBeGreaterThan(0);
        expect(typeof patient.diseaseName).toBe("string");
        expect(patient.diseaseName.length).toBeGreaterThan(0);
        expect(typeof patient.diagnosisKnown).toBe("boolean");
        if (patient.status === "awaiting-treatment" || patient.status === "walking-to-treatment" || patient.status === "treating") {
            expect(patient.diagnosisKnown).toBe(true);
        }
    }
}
describe("simulation invariants", () => {
    it("rejects invalid positions", () => {
        const simulation = new DeterministicSimulation(1, { bounds: { width: 8, height: 8 } });
        expect(() => simulation.execute({ type: "admit-patient", severity: 2, position: { x: -1, y: 0 } })).toThrow(/position/i);
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
                        severity: rng.nextInt(1, 4),
                        position: { x: rng.nextInt(0, 12), y: rng.nextInt(0, 6) }
                    });
                }
                else if (roll < 0.35) {
                    simulation.execute({
                        type: "schedule-admit-patient",
                        delay: rng.nextInt(1, 5),
                        severity: rng.nextInt(1, 4)
                    });
                }
                else if (roll < 0.45) {
                    simulation.execute({ type: "treat-patient" });
                }
                else if (roll < 0.55) {
                    simulation.execute({
                        type: "set-staff-status",
                        staffId: 1,
                        status: rng.nextFloat() >= 0.5 ? "active" : "on-break"
                    });
                }
                else if (roll < 0.65) {
                    simulation.execute({
                        type: "set-room-status",
                        roomId: 2,
                        status: rng.nextFloat() >= 0.5 ? "open" : "closed"
                    });
                }
                else if (roll < 0.75) {
                    simulation.execute({
                        type: "hire-staff",
                        role: rng.nextFloat() >= 0.5 ? "diagnostician" : "nurse"
                    });
                }
                else if (roll < 0.85) {
                    simulation.execute({
                        type: "open-room",
                        roomType: rng.nextFloat() >= 0.5 ? "diagnosis" : "treatment"
                    });
                }
                else {
                    simulation.execute({ type: "tick", count: rng.nextInt(1, 4) });
                }
                const state = simulation.getState();
                assertInvariants(state);
                expect(state.tick).toBeGreaterThanOrEqual(previous.tick);
                expect(state.counters.totalAdmissions).toBeGreaterThanOrEqual(previous.counters.totalAdmissions);
                expect(state.counters.totalTreatments).toBeGreaterThanOrEqual(previous.counters.totalTreatments);
                expect(state.counters.totalPatientDeaths).toBeGreaterThanOrEqual(previous.counters.totalPatientDeaths);
                expect(state.counters.totalTreatmentFailures).toBeGreaterThanOrEqual(previous.counters.totalTreatmentFailures);
                expect(state.counters.nextEntityId).toBeGreaterThanOrEqual(previous.counters.nextEntityId);
                previous = state;
            }
        }
    }, 15_000);
});
