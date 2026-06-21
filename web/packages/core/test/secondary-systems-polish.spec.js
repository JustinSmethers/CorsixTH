import { PATIENT_CRITICAL_HEALTH_THRESHOLD, QUEUE_PRESSURE_REPUTATION_PENALTY_PER_TICK, patientDeathCashPenaltyForSeverity, patientMaxHealthForSeverity, roomRepairCost } from "@corsixth/rules";
import { DeterministicSimulation } from "../src/simulation";
describe("phase 7 slice 4 secondary systems and polish features", () => {
    it("tracks deterministic queue-pressure transitions and applies deterministic reputation pressure penalty", () => {
        const highPressure = new DeterministicSimulation(7401, { bounds: { width: 8, height: 8 } });
        const baseline = new DeterministicSimulation(7401, { bounds: { width: 8, height: 8 } });
        for (let i = 0; i < 4; i += 1) {
            highPressure.execute({ type: "admit-patient", severity: 3, diseaseId: "itchy-feet", position: { x: i, y: i } });
        }
        highPressure.execute({ type: "tick", count: 1 });
        baseline.execute({ type: "tick", count: 1 });
        const highState = highPressure.getState();
        const baselineState = baseline.getState();
        expect(highState.secondarySystems.queuePressureStatus).toBe("high");
        expect(highState.secondarySystems.queuePressureEvents).toBe(1);
        expect(highState.reputation).toBe(baselineState.reputation - QUEUE_PRESSURE_REPUTATION_PENALTY_PER_TICK);
        highPressure.execute({ type: "tick", count: 32 });
        const recovered = highPressure.getState();
        expect(recovered.secondarySystems.queuePressureStatus).toBe("normal");
        expect(recovered.secondarySystems.queuePressureEvents).toBeGreaterThanOrEqual(2);
    });
    it("applies deterministic staff burnout and auto-recovery under sustained throughput pressure", () => {
        const simulation = new DeterministicSimulation(7402, { bounds: { width: 8, height: 8 } });
        for (let i = 0; i < 8; i += 1) {
            simulation.execute({ type: "admit-patient", severity: 3, position: { x: i % 8, y: (i + 1) % 8 } });
        }
        simulation.execute({ type: "tick", count: 48 });
        const state = simulation.getState();
        expect(state.secondarySystems.staffBurnoutEvents).toBeGreaterThan(0);
        expect(state.secondarySystems.staffRecoveryEvents).toBeGreaterThan(0);
        expect(state.secondarySystems.autoBreakStaff).toBeGreaterThanOrEqual(0);
    });
    it("uses imported scenario staff fatigue settings for burnout and recovery timing", () => {
        const simulation = new DeterministicSimulation(7413, {
            bounds: { width: 8, height: 8 },
            staffFatigue: { burnoutTicks: 1, autoBreakTicks: 3 }
        });
        for (let i = 0; i < 4; i += 1) {
            simulation.execute({ type: "admit-patient", severity: 3, position: { x: i + 1, y: 1 } });
        }
        simulation.execute({ type: "tick", count: 8 });
        expect(simulation.getState().secondarySystems.staffBurnoutEvents).toBeGreaterThan(0);
        expect(simulation.getState().secondarySystems.autoBreakStaff).toBeGreaterThan(0);
        simulation.execute({ type: "tick", count: 3 });
        expect(simulation.getState().secondarySystems.staffRecoveryEvents).toBeGreaterThan(0);
    });
    it("uses imported scenario resign max as a repeated-burnout resignation threshold", () => {
        const simulation = new DeterministicSimulation(7428, {
            bounds: { width: 8, height: 8 },
            staffFatigue: { burnoutTicks: 1, autoBreakTicks: 1, resignBurnoutCount: 2 }
        });
        const startingStaff = simulation.getState().entities.staff.length;
        for (let index = 0; index < 12 && simulation.getState().entities.staff.length === startingStaff; index += 1) {
            simulation.execute({ type: "admit-patient", severity: 3, position: { x: (index % 6) + 1, y: 1 } });
            simulation.execute({ type: "tick", count: 2 });
        }
        const state = simulation.getState();
        expect(state.entities.staff.length).toBe(startingStaff - 1);
        expect(state.staffLifecycle.activeStaff + state.staffLifecycle.onBreakStaff).toBe(state.entities.staff.length);
        expect(state.events.recent.map((event) => event.type)).toContain("staff-resigned");
    });
    it("uses imported scenario staff fatigue modify frequency for stress timing", () => {
        const immediate = new DeterministicSimulation(7414, {
            bounds: { width: 8, height: 8 },
            staffFatigue: { burnoutTicks: 1, autoBreakTicks: 3 }
        });
        const delayed = new DeterministicSimulation(7414, {
            bounds: { width: 8, height: 8 },
            staffFatigue: { burnoutTicks: 1, autoBreakTicks: 3, modifyFrequency: 4 }
        });
        for (let i = 0; i < 4; i += 1) {
            immediate.execute({ type: "admit-patient", severity: 3, position: { x: i + 1, y: 1 } });
            delayed.execute({ type: "admit-patient", severity: 3, position: { x: i + 1, y: 1 } });
        }
        immediate.execute({ type: "tick", count: 3 });
        delayed.execute({ type: "tick", count: 3 });
        expect(immediate.getState().secondarySystems.staffBurnoutEvents).toBeGreaterThan(0);
        expect(delayed.getState().secondarySystems.staffBurnoutEvents).toBe(0);
        delayed.execute({ type: "tick", count: 1 });
        expect(delayed.getState().secondarySystems.staffBurnoutEvents).toBeGreaterThan(0);
    });
    it("uses imported scenario work light as staff work stress", () => {
        const defaultWork = new DeterministicSimulation(7416, {
            bounds: { width: 8, height: 8 },
            staffFatigue: { burnoutTicks: 3, autoBreakTicks: 3 }
        });
        const heavierWork = new DeterministicSimulation(7416, {
            bounds: { width: 8, height: 8 },
            staffFatigue: { burnoutTicks: 3, autoBreakTicks: 3, workStressTicks: 2 }
        });
        for (let i = 0; i < 4; i += 1) {
            defaultWork.execute({ type: "admit-patient", severity: 3, position: { x: i + 1, y: 1 } });
            heavierWork.execute({ type: "admit-patient", severity: 3, position: { x: i + 1, y: 1 } });
        }
        defaultWork.execute({ type: "tick", count: 3 });
        heavierWork.execute({ type: "tick", count: 3 });
        expect(defaultWork.getState().secondarySystems.staffBurnoutEvents).toBe(0);
        expect(heavierWork.getState().secondarySystems.staffBurnoutEvents).toBeGreaterThan(0);
    });
    it("uses imported scenario salary-too-low threshold as extra staff stress", () => {
        const baseline = new DeterministicSimulation(7426, {
            bounds: { width: 8, height: 8 },
            staffTrainingTicks: 1,
            staffTrainingCost: 0,
            staffFatigue: { burnoutTicks: 2, autoBreakTicks: 3 },
            staffSalary: {
                salaryAdds: [{ index: 0, value: -30 }],
                salaryTooLow: -10
            }
        });
        const tolerated = new DeterministicSimulation(7426, {
            bounds: { width: 8, height: 8 },
            staffTrainingTicks: 1,
            staffTrainingCost: 0,
            staffFatigue: { burnoutTicks: 2, autoBreakTicks: 3 },
            staffSalary: {
                salaryAdds: [{ index: 0, value: -30 }],
                salaryTooLow: -200
            }
        });
        baseline.execute({ type: "train-staff", staffId: 1 });
        tolerated.execute({ type: "train-staff", staffId: 1 });
        baseline.execute({ type: "tick", count: 2 });
        tolerated.execute({ type: "tick", count: 2 });
        expect(baseline.staffWorkStressTicks(baseline.staff[0])).toBe(2);
        expect(tolerated.staffWorkStressTicks(tolerated.staff[0])).toBe(1);
        expect(baseline.getState().secondarySystems.underpaidStaff).toBe(1);
        expect(tolerated.getState().secondarySystems.underpaidStaff).toBe(0);
    });
    it("uses imported scenario salary-too-high threshold to dampen staff work stress", () => {
        const baseline = new DeterministicSimulation(7427, {
            bounds: { width: 8, height: 8 },
            staffTrainingTicks: 1,
            staffTrainingCost: 0,
            staffFatigue: { burnoutTicks: 2, autoBreakTicks: 3, workStressTicks: 2 },
            staffSalary: {
                salaryAdds: [{ index: 0, value: 100 }],
                salaryTooHigh: 1000
            }
        });
        const generous = new DeterministicSimulation(7427, {
            bounds: { width: 8, height: 8 },
            staffTrainingTicks: 1,
            staffTrainingCost: 0,
            staffFatigue: { burnoutTicks: 2, autoBreakTicks: 3, workStressTicks: 2 },
            staffSalary: {
                salaryAdds: [{ index: 0, value: 100 }],
                salaryTooHigh: 20
            }
        });
        baseline.execute({ type: "train-staff", staffId: 1 });
        generous.execute({ type: "train-staff", staffId: 1 });
        baseline.execute({ type: "tick", count: 2 });
        generous.execute({ type: "tick", count: 2 });
        expect(baseline.staffWorkStressTicks(baseline.staff[0])).toBe(2);
        expect(generous.staffWorkStressTicks(generous.staff[0])).toBe(1);
        expect(baseline.getState().secondarySystems.overpaidStaff).toBe(0);
        expect(generous.getState().secondarySystems.overpaidStaff).toBe(1);
    });
    it("uses imported scenario standing rest as idle staff recovery", () => {
        const defaultRecovery = new DeterministicSimulation(7417, {
            bounds: { width: 8, height: 8 },
            staffFatigue: { burnoutTicks: 99, autoBreakTicks: 3, workStressTicks: 2 }
        });
        const fasterRecovery = new DeterministicSimulation(7417, {
            bounds: { width: 8, height: 8 },
            staffFatigue: { burnoutTicks: 99, autoBreakTicks: 3, workStressTicks: 2, idleRecoveryTicks: 3 }
        });
        for (let i = 0; i < 4; i += 1) {
            defaultRecovery.execute({ type: "admit-patient", severity: 3, position: { x: i + 1, y: 1 } });
            fasterRecovery.execute({ type: "admit-patient", severity: 3, position: { x: i + 1, y: 1 } });
        }
        defaultRecovery.execute({ type: "tick", count: 3 });
        fasterRecovery.execute({ type: "tick", count: 3 });
        const remainingPatientIds = defaultRecovery.getState().entities.waitingPatients.map((patient) => patient.id);
        for (const patientId of remainingPatientIds) {
            defaultRecovery.execute({ type: "send-patient-home", patientId });
            fasterRecovery.execute({ type: "send-patient-home", patientId });
        }
        defaultRecovery.execute({ type: "tick", count: 1 });
        fasterRecovery.execute({ type: "tick", count: 1 });
        const defaultStress = defaultRecovery.getState().entities.staff.reduce((sum, staff) => sum + staff.stress, 0);
        const fasterStress = fasterRecovery.getState().entities.staff.reduce((sum, staff) => sum + staff.stress, 0);
        expect(defaultStress).toBeGreaterThan(0);
        expect(fasterStress).toBeLessThan(defaultStress);
    });
    it("uses imported scenario staff room rest values for manual rest recovery", () => {
        const standingRest = new DeterministicSimulation(7424, {
            bounds: { width: 8, height: 8 },
            staffFatigue: { burnoutTicks: 99, autoBreakTicks: 3, workStressTicks: 2, restStandingTicks: 1, restSofaTicks: 4 }
        });
        const sofaRest = new DeterministicSimulation(7424, {
            bounds: { width: 8, height: 8 },
            staffFatigue: { burnoutTicks: 99, autoBreakTicks: 3, workStressTicks: 2, restStandingTicks: 1, restSofaTicks: 4 }
        });
        for (let i = 0; i < 4; i += 1) {
            standingRest.execute({ type: "admit-patient", severity: 3, position: { x: i + 1, y: 1 } });
            sofaRest.execute({ type: "admit-patient", severity: 3, position: { x: i + 1, y: 1 } });
        }
        standingRest.execute({ type: "tick", count: 3 });
        sofaRest.execute({ type: "tick", count: 3 });
        standingRest.execute({ type: "set-staff-status", staffId: 1, status: "on-break" });
        sofaRest.execute({ type: "set-staff-status", staffId: 1, status: "on-break" });
        const blockedSofaStress = sofaRest.getState().entities.staff.find((staff) => staff.id === 1).stress;
        sofaRest.execute({ type: "rest-staff", staffId: 1, restType: "sofa" });
        expect(sofaRest.getState().entities.staff.find((staff) => staff.id === 1).stress).toBe(blockedSofaStress);
        expect(sofaRest.getState().events.recent.map((event) => event.type)).not.toContain("staff-rested");
        sofaRest.execute({ type: "open-room", roomType: "staff-room", position: { x: 1, y: 4 } });
        standingRest.execute({ type: "rest-staff", staffId: 1, restType: "standing" });
        sofaRest.execute({ type: "rest-staff", staffId: 1, restType: "sofa" });
        const standingStress = standingRest.getState().entities.staff.find((staff) => staff.id === 1).stress;
        const sofaStress = sofaRest.getState().entities.staff.find((staff) => staff.id === 1).stress;
        expect(standingStress).toBeGreaterThan(sofaStress);
        expect(sofaRest.getState().events.recent.map((event) => event.type)).toContain("staff-rested");
    });
    it("uses imported scenario recovery factor to dampen high-stress rest", () => {
        const fixedRecovery = new DeterministicSimulation(7418, {
            bounds: { width: 8, height: 8 },
            staffFatigue: { burnoutTicks: 99, autoBreakTicks: 3, workStressTicks: 4, idleRecoveryTicks: 4 }
        });
        const scaledRecovery = new DeterministicSimulation(7418, {
            bounds: { width: 8, height: 8 },
            staffFatigue: { burnoutTicks: 99, autoBreakTicks: 3, workStressTicks: 4, idleRecoveryTicks: 4, recoveryFactorTicks: 2 }
        });
        for (let i = 0; i < 4; i += 1) {
            fixedRecovery.execute({ type: "admit-patient", severity: 3, position: { x: i + 1, y: 1 } });
            scaledRecovery.execute({ type: "admit-patient", severity: 3, position: { x: i + 1, y: 1 } });
        }
        fixedRecovery.execute({ type: "tick", count: 4 });
        scaledRecovery.execute({ type: "tick", count: 4 });
        const remainingPatientIds = fixedRecovery.getState().entities.waitingPatients.map((patient) => patient.id);
        for (const patientId of remainingPatientIds) {
            fixedRecovery.execute({ type: "send-patient-home", patientId });
            scaledRecovery.execute({ type: "send-patient-home", patientId });
        }
        fixedRecovery.execute({ type: "tick", count: 1 });
        scaledRecovery.execute({ type: "tick", count: 1 });
        const fixedStress = fixedRecovery.getState().entities.staff.reduce((sum, staff) => sum + staff.stress, 0);
        const scaledStress = scaledRecovery.getState().entities.staff.reduce((sum, staff) => sum + staff.stress, 0);
        expect(scaledStress).toBeGreaterThan(fixedStress);
    });
    it("uses imported scenario staff fatigue thresholds for tired staff counts", () => {
        const simulation = new DeterministicSimulation(7415, {
            bounds: { width: 8, height: 8 },
            staffFatigue: { burnoutTicks: 99, autoBreakTicks: 3, tiredTicks: 1, veryTiredTicks: 2 }
        });
        for (let i = 0; i < 4; i += 1) {
            simulation.execute({ type: "admit-patient", severity: 3, position: { x: i + 1, y: 1 } });
        }
        simulation.execute({ type: "tick", count: 3 });
        expect(simulation.getState().secondarySystems.tiredStaff).toBeGreaterThan(0);
        simulation.execute({ type: "tick", count: 1 });
        expect(simulation.getState().secondarySystems.veryTiredStaff).toBeGreaterThan(0);
    });
    it("applies deterministic room maintenance cycles under sustained room wear", () => {
        const simulation = new DeterministicSimulation(7403, { bounds: { width: 8, height: 8 } });
        simulation.execute({ type: "set-room-status", roomId: 2, status: "closed" });
        for (let i = 0; i < 8; i += 1) {
            simulation.execute({ type: "admit-patient", severity: 3, position: { x: i % 8, y: (i * 2) % 8 } });
        }
        simulation.execute({ type: "tick", count: 36 });
        const state = simulation.getState();
        expect(state.secondarySystems.roomMaintenanceStartEvents).toBeGreaterThan(0);
        expect(state.secondarySystems.roomMaintenanceCompleteEvents).toBeGreaterThan(0);
        expect(state.secondarySystems.roomsInMaintenance).toBeGreaterThanOrEqual(0);
    });
    it("applies earthquake room wear as a deterministic replayable event", () => {
        const simulation = new DeterministicSimulation(7411, { bounds: { width: 8, height: 8 } });
        simulation.execute({ type: "apply-earthquake", severity: 6, quakeIndex: 0 });
        const state = simulation.getState();
        expect(state.entities.rooms.some((room) => room.wear >= 6 || room.maintenanceRemainingTicks > 0)).toBe(true);
        expect(state.events.recent.map((event) => event.type)).toContain("earthquake-applied");
    });
    it("uses imported room wear threshold overrides for scenario machine strength", () => {
        const simulation = new DeterministicSimulation(7412, {
            bounds: { width: 8, height: 8 },
            roomWearThresholdOverrides: { diagnosis: 12 }
        });
        simulation.execute({ type: "set-room-status", roomId: 2, status: "closed" });
        simulation.execute({ type: "apply-earthquake", severity: 8, quakeIndex: 0 });
        expect(simulation.getState().entities.rooms.find((room) => room.id === 1)).toMatchObject({
            status: "open",
            wear: 8,
            maintenanceRemainingTicks: 0
        });
        simulation.execute({ type: "apply-earthquake", severity: 4, quakeIndex: 1 });
        expect(simulation.getState().entities.rooms.find((room) => room.id === 1)).toMatchObject({
            status: "closed",
            wear: 12,
            maintenanceRemainingTicks: 2
        });
    });
    it("raises imported room wear thresholds as treatment research improves object strength", () => {
        const simulation = new DeterministicSimulation(74121, {
            bounds: { width: 8, height: 8 },
            roomWearThresholdOverrides: { diagnosis: 12 },
            roomWearResearchMaxStrength: 14,
            researchProjectTicks: 1,
            researchLevelIncrement: 2
        });
        simulation.execute({ type: "start-research" });
        simulation.execute({ type: "tick", count: 1 });
        expect(simulation.getState().research.level).toBe(2);
        simulation.execute({ type: "set-room-status", roomId: 2, status: "closed" });
        simulation.execute({ type: "apply-earthquake", severity: 13, quakeIndex: 0 });
        expect(simulation.getState().entities.rooms.find((room) => room.id === 1)).toMatchObject({
            status: "open",
            wear: 13,
            maintenanceRemainingTicks: 0
        });
        simulation.execute({ type: "apply-earthquake", severity: 1, quakeIndex: 1 });
        expect(simulation.getState().entities.rooms.find((room) => room.id === 1)).toMatchObject({
            status: "closed",
            wear: 14,
            maintenanceRemainingTicks: 2
        });
    });
    it("uses hired handymen to accelerate deterministic room maintenance", () => {
        const simulation = new DeterministicSimulation(7407, { bounds: { width: 8, height: 8 } });
        simulation.execute({ type: "hire-staff", role: "handyman", position: { x: 6, y: 4 } });
        simulation.execute({ type: "set-room-status", roomId: 2, status: "closed" });
        for (let i = 0; i < 8; i += 1) {
            simulation.execute({ type: "admit-patient", severity: 1, position: { x: i % 8, y: 4 } });
        }
        for (let i = 0; i < 80 && simulation.getState().maintenanceStaff.totalRepairEvents === 0; i += 1) {
            simulation.execute({ type: "tick", count: 1 });
        }
        const state = simulation.getState();
        expect(state.maintenanceStaff).toMatchObject({
            activeHandymen: 1,
            totalHandymen: 1,
            repairBonusTicks: 1
        });
        expect(state.maintenanceStaff.totalRepairEvents).toBeGreaterThan(0);
        expect(state.events.recent.map((event) => event.type)).toContain("handyman-repair");
        expect(state.secondarySystems.roomMaintenanceCompleteEvents).toBeGreaterThan(0);
    });
    it("repairs selected rooms by clearing wear and active maintenance for a deterministic cost", () => {
        const simulation = new DeterministicSimulation(7406, { bounds: { width: 8, height: 8 } });
        simulation.execute({ type: "set-room-status", roomId: 2, status: "closed" });
        for (let i = 0; i < 8; i += 1) {
            simulation.execute({ type: "admit-patient", severity: 1, position: { x: i % 8, y: 4 } });
        }
        let maintenanceRoom = null;
        for (let i = 0; i < 80; i += 1) {
            simulation.execute({ type: "tick", count: 1 });
            maintenanceRoom = simulation.getState().entities.rooms.find((room) => room.id === 1 && room.maintenanceRemainingTicks > 0);
            if (maintenanceRoom) {
                break;
            }
        }
        expect(maintenanceRoom).toMatchObject({
            roomType: "diagnosis",
            status: "closed"
        });
        const cashBeforeRepair = simulation.getState().cash;
        simulation.execute({ type: "repair-room", roomId: 1 });
        const repaired = simulation.getState();
        expect(repaired.entities.rooms.find((room) => room.id === 1)).toMatchObject({
            status: "open",
            wear: 0,
            maintenanceRemainingTicks: 0
        });
        expect(repaired.cash).toBe(cashBeforeRepair - roomRepairCost("diagnosis"));
        expect(repaired.events.recent.map((event) => event.type)).toContain("room-repaired");
        simulation.execute({ type: "repair-room", roomId: 1 });
        expect(simulation.getState().cash).toBe(repaired.cash);
    });
    it("expires untreated patients with deterministic health, penalty, and death telemetry", () => {
        const simulation = new DeterministicSimulation(7405, { bounds: { width: 8, height: 8 } });
        simulation.execute({ type: "set-staff-status", staffId: 1, status: "on-break" });
        simulation.execute({ type: "admit-patient", severity: 3, position: { x: 2, y: 2 } });
        expect(simulation.getState().entities.waitingPatients[0]).toMatchObject({
            severity: 3,
            health: patientMaxHealthForSeverity(3),
            maxHealth: patientMaxHealthForSeverity(3)
        });
        simulation.execute({ type: "tick", count: patientMaxHealthForSeverity(3) - PATIENT_CRITICAL_HEALTH_THRESHOLD });
        const critical = simulation.getState();
        expect(critical.entities.waitingPatients[0]).toMatchObject({
            status: "queued",
            health: PATIENT_CRITICAL_HEALTH_THRESHOLD
        });
        expect(critical.secondarySystems.criticalPatients).toBe(1);
        const expensesBeforeDeath = critical.economy.cumulativeExpenses;
        const reputationBeforeDeath = critical.reputation;
        simulation.execute({ type: "tick", count: PATIENT_CRITICAL_HEALTH_THRESHOLD });
        const expired = simulation.getState();
        expect(expired.entities.waitingPatients).toHaveLength(0);
        expect(expired.hospitalLoop.patientDeaths).toBe(1);
        expect(expired.secondarySystems.patientDeaths).toBe(1);
        expect(expired.counters.totalPatientDeaths).toBe(1);
        expect(expired.secondarySystems.criticalPatients).toBe(0);
        expect(expired.economy.cumulativeExpenses).toBeGreaterThanOrEqual(expensesBeforeDeath + patientDeathCashPenaltyForSeverity(3));
        expect(expired.reputation).toBeLessThan(reputationBeforeDeath);
        expect(expired.events.recent.map((event) => event.type)).toContain("patient-died");
    });
    it("uses imported patient leave limits for deterministic walkouts before death", () => {
        const simulation = new DeterministicSimulation(7414, {
            bounds: { width: 8, height: 8 },
            patientBehavior: { leaveMax: 3 }
        });
        simulation.execute({ type: "set-staff-status", staffId: 1, status: "on-break" });
        simulation.execute({ type: "admit-patient", severity: 3, position: { x: 2, y: 2 } });
        simulation.execute({ type: "tick", count: 2 });
        expect(simulation.getState().patientsWaiting).toBe(1);
        simulation.execute({ type: "tick", count: 1 });
        const walkedOut = simulation.getState();
        expect(walkedOut.patientsWaiting).toBe(0);
        expect(walkedOut.hospitalLoop.patientWalkouts).toBe(1);
        expect(walkedOut.secondarySystems.patientWalkouts).toBe(1);
        expect(walkedOut.counters.totalPatientWalkouts).toBe(1);
        expect(walkedOut.patientBehavior).toEqual({ leaveMaxTicks: 3 });
        expect(walkedOut.events.recent.map((event) => event.type)).toContain("patient-left");
    });
    it("uses imported patient happiness thresholds for deterministic risk bands", () => {
        const simulation = new DeterministicSimulation(7415, {
            bounds: { width: 8, height: 8 },
            patientBehavior: { happy: 75, unhappy: 50, veryUnhappy: 50 }
        });
        simulation.execute({ type: "set-staff-status", staffId: 1, status: "on-break" });
        simulation.execute({ type: "admit-patient", severity: 3, position: { x: 2, y: 2 } });
        expect(simulation.getState().secondarySystems).toMatchObject({
            happyPatients: 1,
            unhappyPatients: 0,
            veryUnhappyPatients: 0
        });
        simulation.execute({ type: "tick", count: patientMaxHealthForSeverity(3) / 2 });
        const state = simulation.getState();
        expect(state.entities.waitingPatients[0]).toMatchObject({ health: 24 });
        expect(state.secondarySystems).toMatchObject({
            criticalPatients: 1,
            happyPatients: 0,
            unhappyPatients: 1,
            veryUnhappyPatients: 1
        });
        expect(state.patientBehavior).toEqual({ happy: 75, unhappy: 50, veryUnhappy: 50 });
    });
    it("uses imported patient vomit limits for deterministic low-health events", () => {
        const simulation = new DeterministicSimulation(7419, {
            bounds: { width: 8, height: 8 },
            patientBehavior: { vomitLimit: 50 }
        });
        simulation.execute({ type: "set-staff-status", staffId: 1, status: "on-break" });
        simulation.execute({ type: "admit-patient", severity: 3, position: { x: 1, y: 1 } });
        simulation.execute({ type: "tick", count: patientMaxHealthForSeverity(3) / 2 });
        const state = simulation.getState();
        expect(state.secondarySystems.patientVomits).toBe(1);
        expect(state.counters.totalPatientVomits).toBe(1);
        expect(state.entities.waitingPatients[0]).toMatchObject({ vomited: true });
        expect(state.events.recent.map((event) => event.type)).toContain("patient-vomited");
        simulation.execute({ type: "tick", count: 4 });
        expect(simulation.getState().secondarySystems.patientVomits).toBe(1);
    });
    it("applies deterministic alien abductions to active patients", () => {
        const simulation = new DeterministicSimulation(7425, { bounds: { width: 8, height: 8 } });
        simulation.execute({ type: "admit-patient", severity: 2, position: { x: 1, y: 1 } });
        const patientId = simulation.getState().entities.waitingPatients[0].id;
        simulation.execute({ type: "apply-alien-abduction", patientId, abductionIndex: 3 });
        expect(simulation.getState()).toMatchObject({
            patientsWaiting: 0,
            secondarySystems: { patientAbductions: 1 },
            counters: { totalPatientAbductions: 1 }
        });
        expect(simulation.getState().events.recent.at(-1)).toMatchObject({
            type: "patient-abducted",
            payload: `${patientId}|severity:2|abduction:3`
        });
    });
    it("uses imported patient litter drop timing for deterministic litter events", () => {
        const simulation = new DeterministicSimulation(7420, {
            bounds: { width: 8, height: 8 },
            patientBehavior: { litterDrop: 3 }
        });
        simulation.execute({ type: "set-staff-status", staffId: 1, status: "on-break" });
        simulation.execute({ type: "admit-patient", severity: 3, position: { x: 1, y: 1 } });
        simulation.execute({ type: "tick", count: 2 });
        expect(simulation.getState().secondarySystems.patientLitter).toBe(0);
        simulation.execute({ type: "tick", count: 1 });
        const state = simulation.getState();
        expect(state.secondarySystems.patientLitter).toBe(1);
        expect(state.counters.totalPatientLitter).toBe(1);
        expect(state.entities.waitingPatients[0]).toMatchObject({ droppedLitter: true });
        expect(state.events.recent.map((event) => event.type)).toContain("patient-litter-dropped");
        simulation.execute({ type: "tick", count: 4 });
        expect(simulation.getState().secondarySystems.patientLitter).toBe(1);
    });
    it("uses imported patient litter random as a deterministic retry gate", () => {
        const simulation = new DeterministicSimulation(7421, {
            bounds: { width: 8, height: 8 },
            patientBehavior: { litterDrop: 3, litterRandom: 2 }
        });
        let litterRolls = 0;
        simulation.rng.nextInt = () => {
            litterRolls += 1;
            return litterRolls === 1 ? 1 : 0;
        };
        simulation.execute({ type: "set-staff-status", staffId: 1, status: "on-break" });
        simulation.execute({ type: "admit-patient", severity: 3, position: { x: 1, y: 1 } });
        simulation.execute({ type: "tick", count: 3 });
        expect(simulation.getState().secondarySystems.patientLitter).toBe(0);
        simulation.execute({ type: "tick", count: 1 });
        const state = simulation.getState();
        expect(state.secondarySystems.patientLitter).toBe(1);
        expect(state.entities.waitingPatients[0]).toMatchObject({ droppedLitter: true });
        expect(litterRolls).toBe(2);
    });
    it("uses imported rat-hole removal chance for deterministic handyman litter cleanup", () => {
        const simulation = new DeterministicSimulation(7422, {
            bounds: { width: 8, height: 8 },
            patientBehavior: { litterDrop: 1, litterCleanupChance: 10_000 }
        });
        simulation.execute({ type: "hire-staff", role: "handyman", position: { x: 2, y: 2 } });
        simulation.execute({ type: "admit-patient", severity: 3, position: { x: 1, y: 1 } });
        simulation.execute({ type: "tick", count: 1 });
        const state = simulation.getState();
        expect(state.secondarySystems).toMatchObject({
            patientLitter: 1,
            currentPatientLitter: 0,
            patientLitterCleaned: 1
        });
        expect(state.counters.totalPatientLitterCleaned).toBe(1);
        expect(state.entities.waitingPatients[0]).not.toMatchObject({ droppedLitter: true });
        expect(state.events.recent.map((event) => event.type)).toContain("patient-litter-cleaned");
    });
    it("uses imported bowel thresholds for deterministic toilet need and overflow events", () => {
        const simulation = new DeterministicSimulation(7423, {
            bounds: { width: 8, height: 8 },
            patientBehavior: { bowelFull: 2, bowelOverflows: 4 }
        });
        simulation.execute({ type: "set-staff-status", staffId: 1, status: "on-break" });
        simulation.execute({ type: "admit-patient", severity: 3, position: { x: 1, y: 1 } });
        simulation.execute({ type: "tick", count: 2 });
        expect(simulation.getState()).toMatchObject({
            secondarySystems: {
                patientsNeedingToilet: 1,
                patientBowelOverflows: 0
            }
        });
        simulation.execute({ type: "tick", count: 2 });
        const state = simulation.getState();
        expect(state.secondarySystems.patientBowelOverflows).toBe(1);
        expect(state.counters.totalPatientBowelOverflows).toBe(1);
        expect(state.entities.waitingPatients[0]).toMatchObject({ needsToilet: true, bowelOverflowed: true });
        expect(state.events.recent.map((event) => event.type)).toEqual(expect.arrayContaining(["patient-needs-toilet", "patient-bowel-overflowed"]));
        simulation.execute({ type: "tick", count: 4 });
        expect(simulation.getState().secondarySystems.patientBowelOverflows).toBe(1);
    });
    it("uses imported drink and toilet happiness for selected patient service recovery", () => {
        const simulation = new DeterministicSimulation(7423, {
            bounds: { width: 8, height: 8 },
            patientBehavior: { drinkHappy: 3, toiletHappy: 4, bowelFull: 2, bowelOverflows: 4 }
        });
        simulation.execute({ type: "set-staff-status", staffId: 1, status: "on-break" });
        simulation.execute({ type: "admit-patient", severity: 3, position: { x: 1, y: 1 } });
        const patientId = simulation.getState().entities.waitingPatients[0].id;
        simulation.execute({ type: "tick", count: 2 });
        expect(simulation.getState().entities.waitingPatients[0]).toMatchObject({
            health: patientMaxHealthForSeverity(3) - 2,
            needsToilet: true
        });
        simulation.execute({ type: "give-patient-drink", patientId });
        expect(simulation.getState().entities.waitingPatients[0]).toMatchObject({
            health: patientMaxHealthForSeverity(3),
            drank: true
        });
        simulation.execute({ type: "send-patient-toilet", patientId });
        expect(simulation.getState().entities.waitingPatients[0]).toMatchObject({
            needsToilet: true
        });
        simulation.execute({ type: "open-room", roomType: "toilets", position: { x: 4, y: 4 } });
        const toiletRoom = simulation.getState().entities.rooms.find((room) => room.roomType === "toilets");
        simulation.execute({ type: "set-room-status", roomId: toiletRoom.id, status: "closed" });
        simulation.execute({ type: "send-patient-toilet", patientId });
        expect(simulation.getState().entities.waitingPatients[0]).toMatchObject({
            needsToilet: true
        });
        simulation.execute({ type: "set-room-status", roomId: toiletRoom.id, status: "open" });
        simulation.execute({ type: "send-patient-toilet", patientId });
        const servedPatient = simulation.getState().entities.waitingPatients[0];
        expect(servedPatient).toMatchObject({ usedToilet: true });
        expect(servedPatient).not.toHaveProperty("needsToilet");
        simulation.execute({ type: "tick", count: 3 });
        const state = simulation.getState();
        expect(state.secondarySystems.patientBowelOverflows).toBe(0);
        expect(state.secondarySystems.patientDrinks).toBe(1);
        expect(state.counters.totalPatientDrinks).toBe(1);
        expect(state.events.recent.map((event) => event.type)).toEqual(expect.arrayContaining(["patient-drank", "patient-used-toilet"]));
    });
    it("keeps deterministic hashes for identical slice 4 secondary/polish command streams", () => {
        const commands = [
            { type: "admit-patient", severity: 3, position: { x: 1, y: 1 } },
            { type: "admit-patient", severity: 3, position: { x: 2, y: 2 } },
            { type: "admit-patient", severity: 3, position: { x: 3, y: 3 } },
            { type: "admit-patient", severity: 3, position: { x: 4, y: 4 } },
            { type: "set-room-status", roomId: 2, status: "closed" },
            { type: "tick", count: 24 },
            { type: "set-room-status", roomId: 2, status: "open" },
            { type: "tick", count: 16 }
        ];
        const left = new DeterministicSimulation(7404, { bounds: { width: 8, height: 8 } });
        const right = new DeterministicSimulation(7404, { bounds: { width: 8, height: 8 } });
        const leftHashes = commands.map((command) => {
            left.execute(command);
            return left.currentHash();
        });
        const rightHashes = commands.map((command) => {
            right.execute(command);
            return right.currentHash();
        });
        expect(leftHashes).toEqual(rightHashes);
        expect(leftHashes[leftHashes.length - 1]).toMatch(/^[a-f0-9]{8}$/);
    });
});
