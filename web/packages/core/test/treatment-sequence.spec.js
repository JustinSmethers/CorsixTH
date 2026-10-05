import { DeterministicSimulation, hashSimulationState } from "../src/simulation";
import { AppOrchestrator } from "../../app/src/orchestrator";
import { createAppSaveEnvelope, restoreOrchestratorFromSaveEnvelope } from "../../app/src/persistence";
import { deserializeSaveEnvelope, serializeSaveEnvelope } from "@corsixth/persistence";

function buildSurgeryHospital(simulation) {
    simulation.execute({ type: "open-room", roomType: "ward", position: { x: 8, y: 1 } });
    simulation.execute({ type: "open-room", roomType: "operating-theatre", position: { x: 1, y: 8 } });
    simulation.execute({ type: "hire-staff", role: "diagnostician", initialSpecialties: ["surgeon"], position: { x: 6, y: 4 } });
    simulation.execute({ type: "hire-staff", role: "diagnostician", initialSpecialties: ["surgeon"], position: { x: 7, y: 4 } });
}

function tickUntil(simulation, condition, limit = 40) {
    for (let tick = 0; tick < limit; tick += 1) {
        if (condition(simulation.getState())) return;
        simulation.execute({ type: "tick", count: 1 });
    }
    throw new Error("Patient did not reach expected treatment stage");
}

describe("native surgical treatment sequence", () => {
    it.each(["spare-ribs", "kidney-beans", "pregnancy"])("completes Ward before surgery and only credits the final cure for %s", (diseaseId) => {
        const simulation = new DeterministicSimulation(8120, { bounds: { width: 14, height: 14 } });
        buildSurgeryHospital(simulation);
        simulation.execute({ type: "admit-patient", severity: 2, diseaseId, position: { x: 2, y: 4 } });
        const ward = simulation.getState().entities.rooms.find((room) => room.roomType === "ward");
        const theatre = simulation.getState().entities.rooms.find((room) => room.roomType === "operating-theatre");
        tickUntil(simulation, (state) => state.entities.waitingPatients[0]?.assignedRoomId === ward.id);
        expect(simulation.getState().entities.waitingPatients[0]).toMatchObject({
            treatmentRoomSequence: ["ward", "operating-theatre"],
            treatmentStageIndex: 0,
            nextTreatmentRoomType: "ward"
        });
        expect(simulation.treatmentAssignments[0].staffIds).toEqual([2]);
        tickUntil(simulation, (state) => state.entities.waitingPatients[0]?.treatmentStageIndex === 1);
        const betweenVisits = simulation.getState();
        expect(betweenVisits.entities.waitingPatients[0]).toMatchObject({
            status: "awaiting-treatment", assignedRoomId: null, nextTreatmentRoomType: "operating-theatre"
        });
        expect(betweenVisits.hospitalLoop.dischargedPatients).toBe(0);
        expect(betweenVisits.counters.totalTreatments).toBe(0);
        expect(betweenVisits.events.recent).toContainEqual(expect.objectContaining({ type: "patient-treatment-stage-complete" }));
        tickUntil(simulation, (state) => state.entities.waitingPatients[0]?.assignedRoomId === theatre.id);
        expect(simulation.treatmentAssignments[0].staffIds).toHaveLength(2);
        tickUntil(simulation, (state) => state.entities.waitingPatients.length === 0);
        expect(simulation.getState().hospitalLoop.dischargedPatients + simulation.getState().hospitalLoop.treatmentFailures).toBe(1);
    });

    it("keeps completed Ward progress when the theatre closes and its surgeons are reassigned", () => {
        const simulation = new DeterministicSimulation(8121, { bounds: { width: 14, height: 14 } });
        buildSurgeryHospital(simulation);
        simulation.execute({ type: "admit-patient", severity: 2, diseaseId: "spare-ribs", position: { x: 2, y: 4 } });
        const theatre = simulation.getState().entities.rooms.find((room) => room.roomType === "operating-theatre");
        tickUntil(simulation, (state) => state.entities.waitingPatients[0]?.assignedRoomId === theatre.id);
        simulation.execute({ type: "set-room-status", roomId: theatre.id, status: "closed" });
        const surgeonId = simulation.treatmentAssignments[0].staffIds[0];
        simulation.execute({ type: "move-staff", staffId: surgeonId, position: { x: 13, y: 13 } });
        expect(simulation.getState().entities.waitingPatients[0]).toMatchObject({
            status: "awaiting-treatment", treatmentStageIndex: 1, nextTreatmentRoomType: "operating-theatre"
        });
        simulation.execute({ type: "tick", count: 2 });
        expect(simulation.getState().entities.waitingPatients[0]?.assignedRoomId).toBeNull();
        simulation.execute({ type: "set-room-status", roomId: theatre.id, status: "open" });
        simulation.execute({ type: "tick", count: 1 });
        expect(simulation.getState().entities.waitingPatients[0]?.assignedRoomId).toBe(theatre.id);
    });

    it("does not share either surgeon with a concurrent diagnosis assignment", () => {
        const simulation = new DeterministicSimulation(8122, { bounds: { width: 14, height: 14 } });
        buildSurgeryHospital(simulation);
        simulation.execute({ type: "admit-patient", severity: 2, diseaseId: "spare-ribs", position: { x: 2, y: 4 } });
        tickUntil(simulation, (state) => state.entities.waitingPatients[0]?.treatmentStageIndex === 1);
        // With the general doctor resting, diagnosis occupies one of the two surgeons.
        simulation.execute({ type: "set-staff-status", staffId: 1, status: "on-break" });
        simulation.execute({ type: "admit-patient", severity: 3, diseaseId: "cranial-pressure", position: { x: 2, y: 4 } });
        simulation.execute({ type: "tick", count: 1 });
        expect(simulation.diagnosisAssignments).toHaveLength(1);
        expect(simulation.treatmentAssignments).toHaveLength(0);
        tickUntil(simulation, () => simulation.treatmentAssignments.some((assignment) => assignment.patientId === 1));
        const surgeonIds = simulation.treatmentAssignments[0].staffIds;
        expect(surgeonIds).toHaveLength(2);
        simulation.execute({ type: "admit-patient", severity: 2, diseaseId: "spare-ribs", position: { x: 2, y: 4 } });
        simulation.execute({ type: "tick", count: 1 });
        expect(simulation.diagnosisAssignments).toHaveLength(0);
    });

    it("restores completed Ward progress through the actual save envelope and continues identically", () => {
        const original = new AppOrchestrator({ seed: 8123, bounds: { width: 14, height: 14 } });
        for (const command of [
            { type: "open-room", roomType: "ward", position: { x: 8, y: 1 } },
            { type: "open-room", roomType: "operating-theatre", position: { x: 1, y: 8 } },
            { type: "hire-staff", role: "diagnostician", initialSpecialties: ["surgeon"], position: { x: 6, y: 4 } },
            { type: "hire-staff", role: "diagnostician", initialSpecialties: ["surgeon"], position: { x: 7, y: 4 } },
            { type: "admit-patient", severity: 2, diseaseId: "spare-ribs", position: { x: 2, y: 4 } }
        ]) original.executeCommand(command);
        for (let tick = 0; tick < 30 && original.simulation.getState().entities.waitingPatients[0]?.treatmentStageIndex !== 1; tick += 1) {
            original.executeCommand({ type: "tick", count: 1 });
        }
        expect(original.simulation.getState().entities.waitingPatients[0]?.treatmentStageIndex).toBe(1);
        const serialized = serializeSaveEnvelope(createAppSaveEnvelope(original, { savedAtIso: "2026-10-04T00:00:00.000Z" }));
        const loaded = deserializeSaveEnvelope(serialized);
        expect(loaded.status).toBe("exact");
        const restored = restoreOrchestratorFromSaveEnvelope(loaded.envelope);
        expect(restored.simulation.getState()).toEqual(original.simulation.getState());
        const before = original.simulation.getState();
        const resetProgress = structuredClone(before);
        resetProgress.entities.waitingPatients[0].treatmentStageIndex = 0;
        expect(hashSimulationState(resetProgress)).not.toBe(hashSimulationState(before));
        for (let tick = 0; tick < 25; tick += 1) {
            original.executeCommand({ type: "tick", count: 1 });
            restored.executeCommand({ type: "tick", count: 1 });
            expect(restored.simulation.getState()).toEqual(original.simulation.getState());
        }
        expect(original.simulation.getState().patientsWaiting).toBe(0);
    });
});
