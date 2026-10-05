import { DeterministicSimulation } from "../src/simulation";
import { patientDeathReputationPenaltyForSeverity, roomUpkeepCostPerTick, staffWageCostPerTick } from "@corsixth/rules";
import { AppOrchestrator } from "../../app/src/orchestrator";
import { createAppSaveEnvelope, restoreOrchestratorFromSaveEnvelope } from "../../app/src/persistence";
import { deserializeSaveEnvelope, serializeSaveEnvelope } from "@corsixth/persistence";

const surgeryCommands = [
    { type: "open-room", roomType: "ward", position: { x: 8, y: 1 } },
    { type: "open-room", roomType: "operating-theatre", position: { x: 1, y: 8 } },
    { type: "hire-staff", role: "diagnostician", initialSpecialties: ["surgeon"], position: { x: 6, y: 4 } },
    { type: "hire-staff", role: "diagnostician", initialSpecialties: ["surgeon"], position: { x: 7, y: 4 } },
    // The first Unexpected Swelling patient deterministically fails the cure roll.
    { type: "admit-patient", severity: 3, diseaseId: "unexpected-swelling", position: { x: 2, y: 2 } }
];

function advanceToFinalTreatment(simulation, execute = (command) => simulation.execute(command)) {
    for (let tick = 0; tick < 40; tick += 1) {
        const patient = simulation.getState().entities.waitingPatients[0];
        const remainingMovement = patient?.movement ? patient.movement.path.length - patient.movement.pathIndex - 1 : 0;
        if (patient?.treatmentStageIndex === 1 && patient.assignedRoomId && remainingMovement <= 1) return;
        execute({ type: "tick", count: 1 });
    }
    throw new Error("Patient did not reach final surgical treatment");
}

describe("native failed-cure outcomes", () => {
    it.each([
        ["discount", 825], ["standard", 1100], ["premium", 1485]
    ])("bills %s treatment once and records one death without a failure expense", (policy, charge) => {
        const simulation = new DeterministicSimulation(8130, {
            bounds: { width: 14, height: 14 },
            diseaseTreatmentPrices: { "unexpected-swelling": 1100 }
        });
        simulation.execute({ type: "set-pricing-policy", policy });
        for (const command of surgeryCommands) simulation.execute(command);
        advanceToFinalTreatment(simulation);
        const before = simulation.getState();
        simulation.execute({ type: "tick", count: 1 });
        const failed = simulation.getState();
        expect(failed.hospitalLoop).toMatchObject({ patientDeaths: 1, treatmentFailures: 1, dischargedPatients: 0 });
        expect(failed.counters).toMatchObject({ totalPatientDeaths: 1, totalTreatmentFailures: 1, totalTreatments: 0 });
        expect(failed.patientsWaiting).toBe(0);
        expect(failed.hospitalLoop.activeTreatmentAssignments).toBe(0);
        expect(failed.economy.cumulativeIncome - before.economy.cumulativeIncome).toBe(charge);
        const operatingExpense = failed.entities.staff.filter((staff) => staff.status === "active")
            .reduce((sum, staff) => sum + staffWageCostPerTick(staff.role), 0) +
            failed.entities.rooms.filter((room) => room.status === "open")
                .reduce((sum, room) => sum + roomUpkeepCostPerTick(room.roomType), 0);
        expect(failed.economy.tickExpenses).toBe(operatingExpense);
        expect(failed.cash - before.cash).toBe(charge - operatingExpense);
        const deathPenalty = patientDeathReputationPenaltyForSeverity(3);
        expect(failed.reputation - before.reputation).toBeGreaterThanOrEqual(-deathPenalty - 1);
        expect(failed.reputation - before.reputation).toBeLessThanOrEqual(-deathPenalty + 1);
        expect(failed.events.recent.filter((event) => event.type === "patient-treatment-failed")).toHaveLength(1);
        expect(failed.events.recent.filter((event) => event.type === "patient-died")).toHaveLength(1);
        const stableHash = simulation.currentHash();
        expect(simulation.failTreatmentById(1)).toBe(false);
        expect(simulation.removeExpiredPatient(1)).toBe(false);
        expect(simulation.currentHash()).toBe(stableHash);
        simulation.execute({ type: "tick", count: 2 });
        expect(simulation.getState().counters).toMatchObject({ totalPatientDeaths: 1, totalTreatmentFailures: 1 });
    });

    it("uses severity-based billing for failed cures without a scenario price", () => {
        const simulation = new DeterministicSimulation(8131, { bounds: { width: 14, height: 14 } });
        for (const command of surgeryCommands) simulation.execute(command);
        simulation.execute({ type: "tick", count: 40 });
        expect(simulation.getState().economy.cumulativeIncome).toBe(220);
        expect(simulation.getState().hospitalLoop.patientDeaths).toBe(1);
    });

    it("includes a failed cure in the active VIP visit's death check", () => {
        const simulation = new DeterministicSimulation(8132, { bounds: { width: 14, height: 14 } });
        for (const command of surgeryCommands) simulation.execute(command);
        advanceToFinalTreatment(simulation);
        simulation.execute({ type: "start-vip-inspection" });
        simulation.execute({ type: "tick", count: 8 });
        const failed = simulation.getState();
        expect(failed.vipInspection).toMatchObject({ passedVisits: 0, failedVisits: 1 });
        expect(failed.events.recent).toContainEqual(expect.objectContaining({ type: "vip-inspection-failed", payload: expect.stringContaining("deaths:1") }));
    });

    it("uses the common death path to advance configured autopsy research exactly once", () => {
        const simulation = new DeterministicSimulation(8133, {
            bounds: { width: 14, height: 14 },
            researchProjectTicks: 100,
            autopsy: { researchPercent: 25, reputationHitPercent: 10 }
        });
        for (const command of surgeryCommands) simulation.execute(command);
        simulation.execute({ type: "open-room", roomType: "research", position: { x: 8, y: 8 } });
        advanceToFinalTreatment(simulation);
        simulation.execute({ type: "start-research" });
        const reputationBeforeDeath = simulation.getState().reputation;
        simulation.execute({ type: "tick", count: 1 });
        expect(simulation.getState().research).toMatchObject({
            autopsyResearchTicks: 25,
            autopsyReputationPenalty: Math.ceil((reputationBeforeDeath - patientDeathReputationPenaltyForSeverity(3)) * 0.1),
            remainingTicks: 74
        });
        simulation.failTreatmentById(1);
        expect(simulation.getState().research.autopsyResearchTicks).toBe(25);
    });

    it("fails a maximum-deaths objective after a failed cure and preserves it through save/load", () => {
        const orchestrator = new AppOrchestrator({
            seed: 8134,
            bounds: { width: 14, height: 14 },
            diseaseTreatmentPrices: { "unexpected-swelling": 1100 },
            levelObjective: { requiredDischarges: 100, maximumDeaths: 0 }
        });
        for (const command of surgeryCommands) orchestrator.executeCommand(command);
        advanceToFinalTreatment(orchestrator.simulation, (command) => orchestrator.executeCommand(command));
        orchestrator.executeCommand({ type: "tick", count: 1 });
        expect(orchestrator.telemetry()).toMatchObject({
            patientDeaths: 1, treatmentFailures: 1, levelObjectiveStatus: "lost", levelObjectiveReason: "deaths"
        });
        const loaded = deserializeSaveEnvelope(serializeSaveEnvelope(createAppSaveEnvelope(orchestrator, {
            savedAtIso: "2026-10-04T00:00:00.000Z"
        })));
        expect(loaded.status).toBe("exact");
        const restored = restoreOrchestratorFromSaveEnvelope(loaded.envelope);
        expect(restored.simulation.getState()).toEqual(orchestrator.simulation.getState());
        expect(restored.telemetry()).toEqual(orchestrator.telemetry());
    });
});
