import { DeterministicSimulation, hashSimulationState } from "../src/simulation";
import { roomUpkeepCostPerTick, staffWageCostPerTick } from "@corsixth/rules";
import { AppOrchestrator } from "../../app/src/orchestrator";
import { createAppSaveEnvelope, restoreOrchestratorFromSaveEnvelope } from "../../app/src/persistence";
import { deserializeSaveEnvelope, serializeSaveEnvelope } from "@corsixth/persistence";

function advanceToCompletion(simulation, execute = (command) => simulation.execute(command)) {
    let before = simulation.getState();
    for (let tick = 0; tick < 35; tick += 1) {
        execute({ type: "tick", count: 1 });
        const state = simulation.getState();
        if (state.patientsWaiting === 0) return { before, completed: state };
        expect(state.economy.cumulativeMedicineSupplierExpense ?? 0).toBe(0);
        before = state;
    }
    throw new Error("Pharmacy treatment did not complete");
}

describe("native Pharmacy medicine supplier accounting", () => {
    it.each([
        ["acute-sneezes", 1, 0],
        ["gut-rot", 0, 1]
    ])("pays the scenario supplier once after automatic %s treatment", (diseaseId, cures, deaths) => {
        const simulation = new DeterministicSimulation(8140, {
            bounds: { width: 12, height: 12 }, medicineSupplierCost: 100
        });
        simulation.execute({ type: "open-room", roomType: "pharmacy", position: { x: 1, y: 7 } });
        simulation.execute({ type: "admit-patient", severity: 3, diseaseId, position: { x: 2, y: 2 } });
        const { before, completed } = advanceToCompletion(simulation);
        expect(completed.hospitalLoop).toMatchObject({ dischargedPatients: cures, patientDeaths: deaths });
        expect(completed.economy).toMatchObject({ medicineSupplierCost: 100, cumulativeMedicineSupplierExpense: 100 });
        expect(completed.economy.tickIncome).toBe(220 + completed.progression.recurringIncomeBonus);
        const operatingExpense = completed.entities.staff.filter((staff) => staff.status === "active")
            .reduce((sum, staff) => sum + staffWageCostPerTick(staff.role), 0) +
            completed.entities.rooms.filter((room) => room.status === "open")
                .reduce((sum, room) => sum + roomUpkeepCostPerTick(room.roomType), 0);
        expect(completed.economy.tickExpenses).toBe(operatingExpense + 100);
        expect(completed.cash - before.cash).toBe(220 + completed.progression.recurringIncomeBonus - operatingExpense - 100);
        const stableHash = simulation.currentHash();
        expect(simulation.completeTreatmentById(1)).toBe(false);
        expect(simulation.currentHash()).toBe(stableHash);
        simulation.execute({ type: "tick", count: 3 });
        expect(simulation.getState().economy.cumulativeMedicineSupplierExpense).toBe(100);
    });

    it("does not charge supplier costs for manual debug cures or non-Pharmacy treatment", () => {
        const manual = new DeterministicSimulation(8141, { bounds: { width: 12, height: 12 }, medicineSupplierCost: 100 });
        manual.execute({ type: "admit-patient", severity: 3, diseaseId: "gut-rot", position: { x: 2, y: 2 } });
        manual.execute({ type: "treat-patient" });
        expect(manual.getState().economy.cumulativeMedicineSupplierExpense).toBe(0);
        const machine = new DeterministicSimulation(8141, { bounds: { width: 12, height: 12 }, medicineSupplierCost: 100 });
        machine.execute({ type: "open-room", roomType: "inflation-room", position: { x: 1, y: 7 } });
        machine.execute({ type: "admit-patient", severity: 3, diseaseId: "cranial-pressure", position: { x: 2, y: 2 } });
        const { completed } = advanceToCompletion(machine);
        expect(completed.hospitalLoop.dischargedPatients).toBe(1);
        expect(completed.economy.cumulativeMedicineSupplierExpense).toBe(0);
    });

    it("preserves synthetic accounting when no imported supplier cost is configured", () => {
        const simulation = new DeterministicSimulation(8142, { bounds: { width: 12, height: 12 } });
        simulation.execute({ type: "open-room", roomType: "pharmacy", position: { x: 1, y: 7 } });
        simulation.execute({ type: "admit-patient", severity: 3, diseaseId: "acute-sneezes", position: { x: 2, y: 2 } });
        const { completed } = advanceToCompletion(simulation);
        expect(completed.economy).not.toHaveProperty("medicineSupplierCost");
        expect(completed.economy).not.toHaveProperty("cumulativeMedicineSupplierExpense");
    });

    it("validates supplier costs, accepts free medicine, and hashes configured accounting", () => {
        for (const medicineSupplierCost of [-1, 0.5, "100"]) {
            expect(() => new DeterministicSimulation(8143, { medicineSupplierCost })).toThrow(/medicineSupplierCost/);
        }
        const free = new DeterministicSimulation(8143, { bounds: { width: 12, height: 12 }, medicineSupplierCost: 0 });
        const paid = new DeterministicSimulation(8143, { bounds: { width: 12, height: 12 }, medicineSupplierCost: 100 });
        expect(free.currentHash()).not.toBe(paid.currentHash());
        free.execute({ type: "open-room", roomType: "pharmacy", position: { x: 1, y: 7 } });
        free.execute({ type: "admit-patient", severity: 3, diseaseId: "acute-sneezes", position: { x: 2, y: 2 } });
        const { completed } = advanceToCompletion(free);
        expect(completed.economy.cumulativeMedicineSupplierExpense).toBe(0);
        const changedExpense = structuredClone(completed);
        changedExpense.economy.cumulativeMedicineSupplierExpense = 1;
        expect(hashSimulationState(changedExpense)).not.toBe(hashSimulationState(completed));
    });

    it("restores imported StartCost through existing scenario save settings without applying the research floor", () => {
        const original = new AppOrchestrator({
            seed: 8144,
            bounds: { width: 12, height: 12 },
            researchSettings: { startCost: 40, minDrugCost: 75 }
        });
        original.executeCommand({ type: "open-room", roomType: "pharmacy", position: { x: 1, y: 7 } });
        original.executeCommand({ type: "admit-patient", severity: 3, diseaseId: "gut-rot", position: { x: 2, y: 2 } });
        original.executeCommand({ type: "tick", count: 4 });
        const saved = createAppSaveEnvelope(original, { savedAtIso: "2026-10-04T00:00:00.000Z" });
        expect(saved.payload.researchSettings).toEqual({ startCost: 40, minDrugCost: 75 });
        const loaded = deserializeSaveEnvelope(serializeSaveEnvelope(saved));
        expect(loaded.status).toBe("exact");
        const restored = restoreOrchestratorFromSaveEnvelope(loaded.envelope);
        expect(restored.simulation.getState()).toEqual(original.simulation.getState());
        const { completed } = advanceToCompletion(original.simulation, (command) => {
            original.executeCommand(command);
            restored.executeCommand(command);
            expect(restored.simulation.getState()).toEqual(original.simulation.getState());
        });
        expect(completed.hospitalLoop.patientDeaths).toBe(1);
        expect(completed.economy).toMatchObject({ medicineSupplierCost: 40, cumulativeMedicineSupplierExpense: 40 });
    });
});
