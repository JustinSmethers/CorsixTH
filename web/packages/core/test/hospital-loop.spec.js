import { DeterministicSimulation } from "../src/simulation";
import { patientSendHomeCashPenaltyForSeverity } from "@corsixth/rules";
describe("phase 7 slice 1 hospital loop", () => {
    it("progresses admissions through queue, diagnosis, treatment, and discharge", () => {
        const simulation = new DeterministicSimulation(7001, { bounds: { width: 8, height: 8 } });
        simulation.execute({ type: "admit-patient", severity: 2, diseaseId: "itchy-feet", position: { x: 3, y: 4 } });
        expect(simulation.getState().hospitalLoop).toMatchObject({
            queuedPatients: 1,
            diagnosingPatients: 0,
            awaitingTreatmentPatients: 0,
            treatingPatients: 0,
            dischargedPatients: 0
        });
        expect(simulation.getState().entities.waitingPatients[0]?.status).toBe("queued");
        expect(simulation.getState().entities.waitingPatients[0]).toMatchObject({
            diseaseId: "itchy-feet",
            diseaseName: "Itchy Feet",
            diagnosisKnown: false
        });
        simulation.execute({ type: "tick", count: 1 });
        expect(simulation.getState().hospitalLoop).toMatchObject({
            queuedPatients: 0,
            walkingToDiagnosisPatients: 1,
            diagnosingPatients: 0,
            awaitingTreatmentPatients: 0,
            treatingPatients: 0,
            dischargedPatients: 0
        });
        expect(simulation.getState().entities.waitingPatients[0]).toMatchObject({
            status: "walking-to-diagnosis",
            position: { x: 3, y: 3 }
        });
        simulation.execute({ type: "tick", count: 2 });
        expect(simulation.getState().hospitalLoop).toMatchObject({
            queuedPatients: 0,
            walkingToDiagnosisPatients: 0,
            diagnosingPatients: 1,
            awaitingTreatmentPatients: 0,
            treatingPatients: 0,
            dischargedPatients: 0
        });
        expect(simulation.getState().entities.waitingPatients[0]).toMatchObject({
            status: "diagnosing",
            position: { x: 2, y: 2 }
        });
        simulation.execute({ type: "tick", count: 1 });
        expect(simulation.getState().hospitalLoop).toMatchObject({
            queuedPatients: 0,
            diagnosingPatients: 0,
            awaitingTreatmentPatients: 1,
            treatingPatients: 0,
            dischargedPatients: 0
        });
        expect(simulation.getState().entities.waitingPatients[0]?.status).toBe("awaiting-treatment");
        expect(simulation.getState().entities.waitingPatients[0]).toMatchObject({
            diseaseId: "itchy-feet",
            diseaseName: "Itchy Feet",
            diagnosisKnown: true
        });
        expect(simulation.getState().hospitalLoop.diagnosedPatients).toBe(1);
        expect(simulation.getState().events.recent.map((event) => event.type)).toContain("patient-diagnosed");
        simulation.execute({ type: "tick", count: 1 });
        expect(simulation.getState().hospitalLoop).toMatchObject({
            queuedPatients: 0,
            diagnosingPatients: 0,
            awaitingTreatmentPatients: 0,
            walkingToTreatmentPatients: 1,
            treatingPatients: 0,
            dischargedPatients: 0
        });
        expect(simulation.getState().entities.waitingPatients[0]?.status).toBe("walking-to-treatment");
        simulation.execute({ type: "tick", count: 2 });
        expect(simulation.getState().hospitalLoop).toMatchObject({
            queuedPatients: 0,
            awaitingTreatmentPatients: 0,
            walkingToTreatmentPatients: 1,
            treatingPatients: 0,
            dischargedPatients: 0
        });
        expect(simulation.getState().entities.waitingPatients[0]).toMatchObject({
            status: "walking-to-treatment",
            position: { x: 5, y: 2 }
        });
        simulation.execute({ type: "tick", count: 1 });
        const completed = simulation.getState();
        expect(completed.hospitalLoop).toMatchObject({
            queuedPatients: 0,
            diagnosingPatients: 0,
            awaitingTreatmentPatients: 0,
            treatingPatients: 0,
            dischargedPatients: 1,
            treatmentFailures: 0
        });
        expect(completed.entities.waitingPatients).toHaveLength(0);
        expect(completed.patientsWaiting).toBe(0);
        expect(completed.treatedPatients).toBe(1);
        expect(completed.counters.totalTreatments).toBe(1);
    });
    it("supports manual treatment command as a deterministic discharge override", () => {
        const simulation = new DeterministicSimulation(7002, { bounds: { width: 8, height: 8 } });
        simulation.execute({ type: "admit-patient", severity: 3, position: { x: 2, y: 2 } });
        simulation.execute({ type: "treat-patient" });
        const state = simulation.getState();
        expect(state.hospitalLoop).toMatchObject({
            queuedPatients: 0,
            diagnosingPatients: 0,
            awaitingTreatmentPatients: 0,
            treatingPatients: 0,
            dischargedPatients: 1
        });
        expect(state.entities.waitingPatients).toHaveLength(0);
        expect(state.treatedPatients).toBe(1);
        expect(state.cash).toBeGreaterThan(50_000);
    });
    it("routes new patients through active reception before diagnosis", () => {
        const simulation = new DeterministicSimulation(7003, { bounds: { width: 8, height: 8 } });
        simulation.execute({ type: "hire-staff", role: "receptionist", position: { x: 1, y: 4 } });
        simulation.execute({ type: "admit-patient", severity: 1, position: { x: 4, y: 4 } });
        expect(simulation.getState().hospitalLoop).toMatchObject({
            awaitingReceptionPatients: 1,
            walkingToReceptionPatients: 0,
            receptionPatients: 0,
            queuedPatients: 0
        });
        expect(simulation.getState().entities.waitingPatients[0]?.status).toBe("awaiting-reception");
        simulation.execute({ type: "tick", count: 1 });
        expect(simulation.getState().hospitalLoop).toMatchObject({
            awaitingReceptionPatients: 0,
            walkingToReceptionPatients: 0,
            receptionPatients: 1,
            queuedPatients: 0
        });
        simulation.execute({ type: "tick", count: 1 });
        expect(simulation.getState().hospitalLoop).toMatchObject({
            awaitingReceptionPatients: 0,
            walkingToReceptionPatients: 0,
            receptionPatients: 0,
            queuedPatients: 1
        });
        expect(simulation.getState().entities.waitingPatients[0]?.status).toBe("queued");
        expect(simulation.getState().events.recent.map((event) => event.type)).toContain("patient-reception-complete");
    });
    it("applies treatment pricing policy to discharge revenue and reputation", () => {
        const discount = new DeterministicSimulation(7008, { bounds: { width: 8, height: 8 } });
        discount.execute({ type: "set-pricing-policy", policy: "discount" });
        discount.execute({ type: "admit-patient", severity: 2, position: { x: 2, y: 2 } });
        discount.execute({ type: "treat-patient" });
        expect(discount.getState()).toMatchObject({
            cash: 50_135,
            reputation: 506,
            economy: {
                treatmentPricingPolicy: "discount"
            }
        });
        const premium = new DeterministicSimulation(7009, { bounds: { width: 8, height: 8 } });
        premium.execute({ type: "set-pricing-policy", policy: "premium" });
        expect(premium.getState().events.recent.map((event) => event.type)).toContain("pricing-policy-changed");
        premium.execute({ type: "admit-patient", severity: 2, position: { x: 2, y: 2 } });
        premium.execute({ type: "treat-patient" });
        expect(premium.getState()).toMatchObject({
            cash: 50_243,
            reputation: 501,
            economy: {
                treatmentPricingPolicy: "premium"
            }
        });
    });
    it("uses imported disease start prices for treatment revenue", () => {
        const simulation = new DeterministicSimulation(7010, {
            bounds: { width: 8, height: 8 },
            diseaseTreatmentPrices: { "mild-cold": 300 }
        });
        simulation.execute({ type: "set-pricing-policy", policy: "premium" });
        simulation.execute({ type: "admit-patient", severity: 1, diseaseId: "mild-cold", position: { x: 2, y: 2 } });
        simulation.execute({ type: "treat-patient" });
        expect(simulation.getState()).toMatchObject({
            cash: 50_405,
            reputation: 500
        });
    });
    it("targets manual treatment at a selected patient id", () => {
        const simulation = new DeterministicSimulation(7005, { bounds: { width: 8, height: 8 } });
        simulation.execute({ type: "admit-patient", severity: 1, position: { x: 2, y: 4 } });
        simulation.execute({ type: "admit-patient", severity: 2, position: { x: 3, y: 4 } });
        const patients = simulation.getState().entities.waitingPatients;
        expect(patients.map((patient) => patient.id)).toEqual([1, 2]);
        simulation.execute({ type: "treat-patient", patientId: 2 });
        const state = simulation.getState();
        expect(state.entities.waitingPatients.map((patient) => patient.id)).toEqual([1]);
        expect(state.hospitalLoop.dischargedPatients).toBe(1);
        expect(state.treatedPatients).toBe(1);
        simulation.execute({ type: "treat-patient", patientId: 99 });
        expect(simulation.getState().entities.waitingPatients.map((patient) => patient.id)).toEqual([1]);
        expect(simulation.getState().treatedPatients).toBe(1);
    });
    it("sends selected patients home with deterministic penalties and cleanup", () => {
        const simulation = new DeterministicSimulation(7006, { bounds: { width: 8, height: 8 } });
        simulation.execute({ type: "admit-patient", severity: 1, position: { x: 2, y: 4 } });
        simulation.execute({ type: "admit-patient", severity: 3, position: { x: 3, y: 4 } });
        simulation.execute({ type: "tick", count: 1 });
        const before = simulation.getState();
        expect(before.hospitalLoop.walkingToDiagnosisPatients).toBe(1);
        expect(before.hospitalLoop.queuedPatients).toBe(1);
        const cashBeforeSendHome = before.cash;
        const reputationBeforeSendHome = before.reputation;
        simulation.execute({ type: "send-patient-home", patientId: 1 });
        const after = simulation.getState();
        expect(after.entities.waitingPatients.map((patient) => patient.id)).toEqual([2]);
        expect(after.patientsWaiting).toBe(1);
        expect(after.hospitalLoop.walkingToDiagnosisPatients).toBe(0);
        expect(after.cash).toBe(cashBeforeSendHome - patientSendHomeCashPenaltyForSeverity(1));
        expect(after.reputation).toBeLessThan(reputationBeforeSendHome);
        expect(after.events.recent.map((event) => event.type)).toContain("patient-sent-home");
        simulation.execute({ type: "send-patient-home", patientId: 99 });
        expect(simulation.getState().entities.waitingPatients.map((patient) => patient.id)).toEqual([2]);
    });
    it("prioritizes queued selected patients before the next diagnosis assignment", () => {
        const simulation = new DeterministicSimulation(7007, { bounds: { width: 8, height: 8 } });
        simulation.execute({ type: "admit-patient", severity: 1, position: { x: 2, y: 4 } });
        simulation.execute({ type: "admit-patient", severity: 2, position: { x: 3, y: 4 } });
        simulation.execute({ type: "prioritize-patient", patientId: 2 });
        expect(simulation.getState().events.recent.map((event) => event.type)).toContain("patient-prioritized");
        simulation.execute({ type: "tick", count: 1 });
        const state = simulation.getState();
        expect(state.entities.waitingPatients.find((patient) => patient.id === 2)).toMatchObject({
            status: "walking-to-diagnosis"
        });
        expect(state.entities.waitingPatients.find((patient) => patient.id === 1)).toMatchObject({
            status: "queued"
        });
    });
    it("records deterministic treatment failures for difficult diagnosed diseases", () => {
        const simulation = new DeterministicSimulation(7004, { bounds: { width: 8, height: 8 } });
        simulation.execute({ type: "open-room", roomType: "specialist", position: { x: 1, y: 4 } });
        simulation.execute({ type: "hire-staff", role: "diagnostician", initialSpecialties: ["surgeon"], position: { x: 6, y: 4 } });
        simulation.execute({ type: "hire-staff", role: "diagnostician", initialSpecialties: ["surgeon"], position: { x: 7, y: 4 } });
        simulation.execute({ type: "admit-patient", severity: 3, diseaseId: "unexpected-swelling", position: { x: 2, y: 2 } });
        simulation.execute({ type: "admit-patient", severity: 3, diseaseId: "unexpected-swelling", position: { x: 2, y: 2 } });
        expect(simulation.getState().entities.waitingPatients.map((patient) => patient.diseaseId)).toEqual([
            "unexpected-swelling",
            "unexpected-swelling"
        ]);
        simulation.execute({ type: "tick", count: 64 });
        const state = simulation.getState();
        expect(state.entities.waitingPatients).toHaveLength(0);
        expect(state.hospitalLoop).toMatchObject({
            dischargedPatients: 1,
            treatmentFailures: 1
        });
        expect(state.counters.totalTreatments).toBe(1);
        expect(state.counters.totalTreatmentFailures).toBe(1);
        expect(state.events.recent.map((event) => event.type)).toContain("patient-treatment-failed");
    });
    it("accepts scenario-selected disease ids for admissions", () => {
        const simulation = new DeterministicSimulation(7005, { bounds: { width: 8, height: 8 } });
        simulation.execute({ type: "admit-patient", severity: 1, diseaseId: "cranial-pressure", position: { x: 2, y: 2 } });
        expect(simulation.getState().entities.waitingPatients[0]).toMatchObject({
            severity: 1,
            diseaseId: "cranial-pressure",
            diseaseName: "Cranial Pressure"
        });
    });
    it("uses configured admission points for default patient admissions", () => {
        const simulation = new DeterministicSimulation(7003, {
            bounds: { width: 8, height: 8 },
            admissionPoints: [{ x: 7, y: 6 }, { x: 6, y: 7 }]
        });
        simulation.execute({ type: "admit-patient", severity: 1 });
        simulation.execute({ type: "admit-patient", severity: 2 });
        expect(simulation.getState().admissionPoints).toEqual([{ x: 7, y: 6 }, { x: 6, y: 7 }]);
        expect(simulation.getState().entities.waitingPatients.map((patient) => patient.position)).toEqual([
            { x: 7, y: 6 },
            { x: 6, y: 7 }
        ]);
    });
});
