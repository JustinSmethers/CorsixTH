import { DeterministicSimulation } from "../src/simulation";
describe("phase 7 slice 2 staff lifecycle and room operations", () => {
    it("stalls diagnosis throughput when diagnostician is on break and resumes when reactivated", () => {
        const simulation = new DeterministicSimulation(7201, { bounds: { width: 8, height: 8 } });
        simulation.execute({ type: "admit-patient", severity: 2, position: { x: 1, y: 1 } });
        simulation.execute({ type: "set-staff-status", staffId: 1, status: "on-break" });
        simulation.execute({ type: "tick", count: 1 });
        const stalled = simulation.getState();
        expect(stalled.hospitalLoop.queuedPatients).toBe(1);
        expect(stalled.hospitalLoop.diagnosingPatients).toBe(0);
        expect(stalled.staffLifecycle.activeStaff).toBe(1);
        expect(stalled.staffLifecycle.onBreakStaff).toBe(1);
        simulation.execute({ type: "set-staff-status", staffId: 1, status: "active" });
        simulation.execute({ type: "tick", count: 1 });
        const recovered = simulation.getState();
        expect(recovered.hospitalLoop.queuedPatients).toBe(0);
        expect(recovered.hospitalLoop.walkingToDiagnosisPatients).toBe(1);
        expect(recovered.hospitalLoop.diagnosingPatients).toBe(0);
        expect(recovered.entities.waitingPatients[0]?.status).toBe("walking-to-diagnosis");
        simulation.execute({ type: "tick", count: 1 });
        const arrived = simulation.getState();
        expect(arrived.hospitalLoop.walkingToDiagnosisPatients).toBe(0);
        expect(arrived.hospitalLoop.diagnosingPatients).toBe(1);
        expect(arrived.entities.waitingPatients[0]?.status).toBe("diagnosing");
    });
    it("stalls treatment throughput when treatment room is closed and recovers when reopened", () => {
        const simulation = new DeterministicSimulation(7202, { bounds: { width: 8, height: 8 } });
        simulation.execute({ type: "admit-patient", severity: 1, position: { x: 2, y: 2 } });
        simulation.execute({ type: "tick", count: 1 });
        simulation.execute({ type: "set-room-status", roomId: 2, status: "closed" });
        simulation.execute({ type: "tick", count: 1 });
        const stalled = simulation.getState();
        expect(stalled.hospitalLoop.awaitingTreatmentPatients).toBe(1);
        expect(stalled.hospitalLoop.treatingPatients).toBe(0);
        expect(stalled.roomOperations.openTreatmentRooms).toBe(0);
        simulation.execute({ type: "set-room-status", roomId: 2, status: "open" });
        simulation.execute({ type: "tick", count: 1 });
        expect(simulation.getState().hospitalLoop.walkingToTreatmentPatients).toBe(1);
        simulation.execute({ type: "tick", count: 4 });
        const recovered = simulation.getState();
        expect(recovered.hospitalLoop.dischargedPatients).toBe(1);
        expect(recovered.patientsWaiting).toBe(0);
        expect(recovered.roomOperations.openTreatmentRooms).toBe(1);
    });
    it("scales deterministic throughput when additional staff and rooms are added", () => {
        const simulation = new DeterministicSimulation(7203, { bounds: { width: 8, height: 8 } });
        simulation.execute({ type: "hire-staff", role: "diagnostician" });
        simulation.execute({ type: "hire-staff", role: "nurse" });
        simulation.execute({ type: "open-room", roomType: "diagnosis" });
        simulation.execute({ type: "open-room", roomType: "treatment" });
        simulation.execute({ type: "admit-patient", severity: 3, position: { x: 1, y: 1 } });
        simulation.execute({ type: "admit-patient", severity: 3, position: { x: 2, y: 2 } });
        simulation.execute({ type: "admit-patient", severity: 3, position: { x: 3, y: 3 } });
        simulation.execute({ type: "admit-patient", severity: 3, position: { x: 4, y: 4 } });
        simulation.execute({ type: "tick", count: 1 });
        const state = simulation.getState();
        expect(state.hospitalLoop.walkingToDiagnosisPatients).toBe(2);
        expect(state.hospitalLoop.diagnosingPatients).toBe(0);
        expect(state.hospitalLoop.queuedPatients).toBe(2);
        expect(state.staffLifecycle.activeStaff).toBe(4);
        expect(state.roomOperations.openDiagnosisRooms).toBe(2);
        expect(state.roomOperations.openTreatmentRooms).toBe(2);
        expect(state.entities.staff).toHaveLength(4);
        expect(state.entities.rooms).toHaveLength(4);
    });
    it("places newly built rooms and hired staff on deterministic map tiles", () => {
        const simulation = new DeterministicSimulation(7205, { bounds: { width: 12, height: 12 } });
        simulation.execute({ type: "open-room", roomType: "diagnosis", position: { x: 6, y: 7 } });
        simulation.execute({ type: "hire-staff", role: "diagnostician", position: { x: 6, y: 8 } });
        const state = simulation.getState();
        expect(state.entities.rooms.find((room) => room.position.x === 6 && room.position.y === 7)).toMatchObject({
            roomType: "diagnosis",
            status: "open",
            footprint: { width: 3, height: 3 }
        });
        expect(state.entities.staff.find((staff) => staff.position.x === 6 && staff.position.y === 8)).toMatchObject({
            role: "diagnostician",
            status: "active"
        });
        const beforeDuplicate = state.entities.rooms.length;
        simulation.execute({ type: "open-room", roomType: "treatment", position: { x: 6, y: 7 } });
        expect(simulation.getState().entities.rooms).toHaveLength(beforeDuplicate);
        simulation.execute({ type: "open-room", roomType: "treatment", position: { x: 10, y: 10 } });
        expect(simulation.getState().entities.rooms).toHaveLength(beforeDuplicate);
        simulation.execute({ type: "open-room", roomType: "treatment", position: { x: 4, y: 7 } });
        expect(simulation.getState().entities.rooms).toHaveLength(beforeDuplicate);
        simulation.execute({ type: "open-room", roomType: "treatment", position: { x: 1, y: 7 } });
        const afterValidBuild = simulation.getState();
        expect(afterValidBuild.entities.rooms).toHaveLength(beforeDuplicate + 1);
        expect(afterValidBuild.entities.rooms[afterValidBuild.entities.rooms.length - 1]?.tiles).toHaveLength(9);
    });
    it("routes patients around unrelated built room footprints", () => {
        const simulation = new DeterministicSimulation(7206, { bounds: { width: 10, height: 10 } });
        simulation.execute({ type: "open-room", roomType: "diagnosis", position: { x: 2, y: 4 } });
        simulation.execute({ type: "admit-patient", severity: 2, position: { x: 2, y: 7 } });
        simulation.execute({ type: "tick", count: 1 });
        const patient = simulation.getState().entities.waitingPatients[0];
        const blockedFootprint = new Set(["2,4", "3,4", "4,4", "2,5", "3,5", "4,5", "2,6", "3,6", "4,6"]);
        expect(patient).toMatchObject({ status: "walking-to-diagnosis" });
        expect(patient?.movement?.path.some((tile) => blockedFootprint.has(`${tile.x},${tile.y}`))).toBe(false);
        expect(patient?.movement?.path).toContainEqual({ x: 1, y: 4 });
    });
    it("routes patients around placed corridor objects", () => {
        const simulation = new DeterministicSimulation(7207, { bounds: { width: 10, height: 10 } });
        simulation.execute({ type: "open-room", roomType: "diagnosis", position: { x: 2, y: 4 } });
        simulation.execute({ type: "place-object", objectIndex: 7, name: "Plant", position: { x: 1, y: 4 } });
        simulation.execute({ type: "admit-patient", severity: 2, position: { x: 2, y: 7 } });
        simulation.execute({ type: "tick", count: 1 });
        const patient = simulation.getState().entities.waitingPatients[0];
        expect(patient).toMatchObject({ status: "walking-to-diagnosis" });
        expect(patient?.movement?.path).not.toContainEqual({ x: 1, y: 4 });
        expect(patient?.movement?.path).toContainEqual({ x: 0, y: 4 });
    });
    it("blocks object placement on staff and patient positions", () => {
        const simulation = new DeterministicSimulation(7208, { bounds: { width: 12, height: 12 } });
        simulation.execute({ type: "hire-staff", role: "handyman", position: { x: 6, y: 6 } });
        simulation.execute({ type: "admit-patient", severity: 2, position: { x: 7, y: 7 } });
        expect(simulation.evaluateObjectPlacement(7, { x: 6, y: 6 })).toMatchObject({
            valid: false,
            reason: "occupied"
        });
        expect(simulation.evaluateObjectPlacement(8, { x: 7, y: 7 })).toMatchObject({
            valid: false,
            reason: "occupied"
        });
        simulation.execute({ type: "place-object", objectIndex: 7, name: "Plant", position: { x: 6, y: 6 } });
        simulation.execute({ type: "place-object", objectIndex: 8, name: "Bench", position: { x: 7, y: 7 } });
        expect(simulation.getState().entities.objects).toEqual([]);
    });
    it("blocks room placement over objects, staff, and patient positions", () => {
        const simulation = new DeterministicSimulation(7209, { bounds: { width: 14, height: 14 } });
        simulation.execute({ type: "place-object", objectIndex: 7, name: "Plant", position: { x: 6, y: 6 } });
        simulation.execute({ type: "hire-staff", role: "handyman", position: { x: 9, y: 6 } });
        simulation.execute({ type: "admit-patient", severity: 2, position: { x: 6, y: 9 } });
        expect(simulation.evaluateRoomPlacement("diagnosis", { x: 5, y: 5 })).toMatchObject({
            valid: false,
            reason: "occupied"
        });
        expect(simulation.evaluateRoomPlacement("diagnosis", { x: 8, y: 5 })).toMatchObject({
            valid: false,
            reason: "occupied"
        });
        expect(simulation.evaluateRoomPlacement("diagnosis", { x: 5, y: 8 })).toMatchObject({
            valid: false,
            reason: "occupied"
        });
        const beforeRooms = simulation.getState().entities.rooms.length;
        simulation.execute({ type: "open-room", roomType: "diagnosis", position: { x: 5, y: 5 } });
        simulation.execute({ type: "open-room", roomType: "diagnosis", position: { x: 8, y: 5 } });
        simulation.execute({ type: "open-room", roomType: "diagnosis", position: { x: 5, y: 8 } });
        expect(simulation.getState().entities.rooms).toHaveLength(beforeRooms);
    });
    it("snaps staff placement away from objects, staff, and patients", () => {
        const simulation = new DeterministicSimulation(7210, { bounds: { width: 14, height: 14 } });
        simulation.execute({ type: "place-object", objectIndex: 7, name: "Plant", position: { x: 6, y: 6 } });
        simulation.execute({ type: "hire-staff", role: "handyman", position: { x: 7, y: 6 } });
        simulation.execute({ type: "admit-patient", severity: 2, position: { x: 8, y: 6 } });
        expect(simulation.evaluateStaffPlacement("nurse", { x: 6, y: 6 })).toMatchObject({
            valid: true,
            reason: null,
            position: { x: 5, y: 5 }
        });
        expect(simulation.evaluateStaffPlacement("nurse", { x: 7, y: 6 })).toMatchObject({
            valid: true,
            reason: null,
            position: { x: 6, y: 5 }
        });
        expect(simulation.evaluateStaffPlacement("nurse", { x: 8, y: 6 })).toMatchObject({
            valid: true,
            reason: null,
            position: { x: 7, y: 5 }
        });
        const beforeStaff = simulation.getState().entities.staff.length;
        simulation.execute({ type: "hire-staff", role: "nurse", position: { x: 6, y: 6 } });
        const hiredNurse = simulation.getState().entities.staff[beforeStaff];
        expect(hiredNurse).toMatchObject({ role: "nurse", position: { x: 5, y: 5 } });
    });
    it("snaps staff moves away from occupied target tiles", () => {
        const simulation = new DeterministicSimulation(7211, { bounds: { width: 14, height: 14 } });
        simulation.execute({ type: "place-object", objectIndex: 7, name: "Plant", position: { x: 6, y: 6 } });
        simulation.execute({ type: "hire-staff", role: "handyman", position: { x: 7, y: 6 } });
        simulation.execute({ type: "hire-staff", role: "nurse", position: { x: 10, y: 10 } });
        simulation.execute({ type: "admit-patient", severity: 2, position: { x: 8, y: 6 } });
        const nurse = simulation.getState().entities.staff.find((staff) => staff.role === "nurse");
        expect(nurse).toBeTruthy();
        expect(simulation.evaluateStaffMove(nurse.id, nurse.position)).toMatchObject({
            valid: true,
            reason: null,
            position: nurse.position
        });
        expect(simulation.evaluateStaffMove(nurse.id, { x: 6, y: 6 })).toMatchObject({
            valid: true,
            reason: null,
            position: { x: 5, y: 5 }
        });
        expect(simulation.evaluateStaffMove(nurse.id, { x: 7, y: 6 })).toMatchObject({
            valid: true,
            reason: null,
            position: { x: 6, y: 5 }
        });
        expect(simulation.evaluateStaffMove(nurse.id, { x: 8, y: 6 })).toMatchObject({
            valid: true,
            reason: null,
            position: { x: 7, y: 5 }
        });
        simulation.execute({ type: "move-staff", staffId: nurse.id, position: { x: 6, y: 6 } });
        expect(simulation.getState().entities.staff.find((staff) => staff.id === nurse.id)).toMatchObject({
            position: { x: 5, y: 5 }
        });
    });
    it("uses imported routing distance points when choosing between open diagnosis rooms", () => {
        const weighted = new DeterministicSimulation(7212, {
            bounds: { width: 12, height: 12 },
            routingSettings: { queuePoints: 15, distancePoints: 1, noStaffPoints: 20 }
        });
        weighted.execute({ type: "open-room", roomType: "diagnosis", position: { x: 8, y: 7 } });
        weighted.execute({ type: "hire-staff", role: "diagnostician", position: { x: 7, y: 8 } });
        const nearDiagnosisRoom = weighted.getState().entities.rooms.find((room) => room.roomType === "diagnosis" && room.position.x === 8);
        expect(nearDiagnosisRoom).toBeTruthy();
        weighted.execute({ type: "admit-patient", severity: 2, position: { x: 11, y: 8 } });
        weighted.execute({ type: "tick", count: 1 });
        expect(weighted.getState().entities.waitingPatients[0]).toMatchObject({
            status: "walking-to-diagnosis",
            assignedRoomId: nearDiagnosisRoom.id
        });
        expect(weighted.getState().routingSettings).toEqual({
            queuePoints: 15,
            distancePoints: 1,
            noStaffPoints: 20
        });

        const unweighted = new DeterministicSimulation(7213, { bounds: { width: 12, height: 12 } });
        unweighted.execute({ type: "open-room", roomType: "diagnosis", position: { x: 8, y: 7 } });
        unweighted.execute({ type: "hire-staff", role: "diagnostician", position: { x: 7, y: 8 } });
        unweighted.execute({ type: "admit-patient", severity: 2, position: { x: 11, y: 8 } });
        unweighted.execute({ type: "tick", count: 1 });
        expect(unweighted.getState().entities.waitingPatients[0]).toMatchObject({
            status: "walking-to-diagnosis",
            assignedRoomId: 1
        });
    });
    it("fires staff and sells purchased rooms while cancelling active assignments", () => {
        const simulation = new DeterministicSimulation(7207, { bounds: { width: 12, height: 12 } });
        simulation.execute({ type: "hire-staff", role: "nurse", position: { x: 6, y: 8 } });
        const hiredNurse = simulation.getState().entities.staff.find((staff) => staff.position.x === 6 && staff.position.y === 8);
        expect(hiredNurse).toBeTruthy();
        const cashAfterHire = simulation.getState().cash;
        simulation.execute({ type: "fire-staff", staffId: hiredNurse.id });
        expect(simulation.getState().entities.staff.find((staff) => staff.id === hiredNurse.id)).toBeUndefined();
        expect(simulation.getState().cash).toBe(cashAfterHire);
        simulation.execute({ type: "open-room", roomType: "diagnosis", position: { x: 6, y: 7 } });
        const builtRoom = simulation.getState().entities.rooms.find((room) => room.position.x === 6 && room.position.y === 7);
        expect(builtRoom).toBeTruthy();
        const cashAfterBuild = simulation.getState().cash;
        simulation.execute({ type: "remove-room", roomId: builtRoom.id });
        expect(simulation.getState().entities.rooms.find((room) => room.id === builtRoom.id)).toBeUndefined();
        expect(simulation.getState().cash).toBe(cashAfterBuild + 400);
        simulation.execute({ type: "admit-patient", severity: 2, position: { x: 2, y: 2 } });
        simulation.execute({ type: "tick", count: 1 });
        expect(simulation.getState().entities.waitingPatients[0]).toMatchObject({
            status: "diagnosing",
            assignedStaffId: 1,
            assignedRoomId: 1
        });
        simulation.execute({ type: "fire-staff", staffId: 1 });
        expect(simulation.getState().entities.waitingPatients[0]).toMatchObject({
            status: "queued",
            assignedStaffId: null,
            assignedRoomId: null
        });
        simulation.execute({ type: "hire-staff", role: "diagnostician", position: { x: 6, y: 8 } });
        simulation.execute({ type: "tick", count: 1 });
        expect(simulation.getState().entities.waitingPatients[0]?.status).toBe("diagnosing");
        simulation.execute({ type: "remove-room", roomId: 1 });
        expect(simulation.getState().entities.waitingPatients[0]).toMatchObject({
            status: "queued",
            assignedStaffId: null,
            assignedRoomId: null
        });
    });
    it("moves selected staff to target tiles while cancelling active assignments", () => {
        const simulation = new DeterministicSimulation(7208, { bounds: { width: 12, height: 12 } });
        simulation.execute({ type: "admit-patient", severity: 2, position: { x: 2, y: 2 } });
        simulation.execute({ type: "tick", count: 1 });
        expect(simulation.getState().entities.waitingPatients[0]).toMatchObject({
            status: "diagnosing",
            assignedStaffId: 1,
            assignedRoomId: 1
        });
        simulation.execute({ type: "move-staff", staffId: 1, position: { x: 6, y: 8 } });
        const moved = simulation.getState();
        expect(moved.entities.staff.find((staff) => staff.id === 1)).toMatchObject({
            role: "diagnostician",
            position: { x: 6, y: 8 }
        });
        expect(moved.entities.waitingPatients[0]).toMatchObject({
            status: "queued",
            assignedStaffId: null,
            assignedRoomId: null
        });
        expect(moved.events.recent.map((event) => event.type)).toContain("staff-moved");
    });
    it("trains staff deterministically and reduces service durations", () => {
        const simulation = new DeterministicSimulation(7209, { bounds: { width: 8, height: 8 } });
        simulation.execute({ type: "train-staff", staffId: 1 });
        expect(simulation.getState()).toMatchObject({
            cash: 49_300,
            staffTraining: {
                activeTrainingStaff: 1,
                totalSkillLevel: 0,
                maxSkillLevel: 3,
                trainingCost: 700,
                trainingTicks: 5,
                trainingStarted: 1,
                trainingCompleted: 0
            }
        });
        expect(simulation.getState().entities.staff.find((staff) => staff.id === 1)).toMatchObject({
            status: "on-break",
            skillLevel: 0,
            trainingRemainingTicks: 5
        });
        simulation.execute({ type: "set-staff-status", staffId: 1, status: "active" });
        expect(simulation.getState().entities.staff.find((staff) => staff.id === 1)).toMatchObject({
            status: "on-break",
            trainingRemainingTicks: 5
        });
        simulation.execute({ type: "tick", count: 5 });
        expect(simulation.getState().entities.staff.find((staff) => staff.id === 1)).toMatchObject({
            status: "active",
            skillLevel: 1,
            trainingRemainingTicks: 0
        });
        expect(simulation.getState().staffTraining).toMatchObject({
            activeTrainingStaff: 0,
            trainedStaff: 1,
            totalSkillLevel: 1,
            trainingCompleted: 1
        });
        expect(simulation.getState().events.recent.map((event) => event.type)).toContain("staff-training-completed");
        simulation.execute({ type: "admit-patient", severity: 3, position: { x: 2, y: 2 } });
        simulation.execute({ type: "tick", count: 2 });
        expect(simulation.getState().entities.waitingPatients[0]).toMatchObject({
            diagnosisKnown: true,
            status: "awaiting-treatment"
        });
    });
    it("uses imported scenario training duration overrides", () => {
        const simulation = new DeterministicSimulation(72091, {
            bounds: { width: 8, height: 8 },
            staffTrainingTicks: 7
        });
        simulation.execute({ type: "train-staff", staffId: 1 });
        expect(simulation.getState()).toMatchObject({
            staffTraining: {
                activeTrainingStaff: 1,
                trainingTicks: 7,
                trainingStarted: 1,
                trainingCompleted: 0
            }
        });
        expect(simulation.getState().entities.staff.find((staff) => staff.id === 1)).toMatchObject({
            trainingRemainingTicks: 7
        });
        simulation.execute({ type: "tick", count: 6 });
        expect(simulation.getState().staffTraining).toMatchObject({
            activeTrainingStaff: 1,
            trainingCompleted: 0
        });
        simulation.execute({ type: "tick", count: 1 });
        expect(simulation.getState().staffTraining).toMatchObject({
            activeTrainingStaff: 0,
            trainingCompleted: 1
        });
    });
    it("uses imported promotion target durations for staff training", () => {
        const simulation = new DeterministicSimulation(72093, {
            bounds: { width: 8, height: 8 },
            staffTrainingTicks: 9,
            staffTrainingTicksByTargetLevel: { 1: 2, 3: 4 }
        });
        simulation.execute({ type: "train-staff", staffId: 1 });
        expect(simulation.getState().staffTraining.trainingTicksByTargetLevel).toEqual({ 1: 2, 3: 4 });
        expect(simulation.getState().entities.staff.find((staff) => staff.id === 1)).toMatchObject({
            skillLevel: 0,
            trainingRemainingTicks: 2
        });
        simulation.execute({ type: "tick", count: 2 });
        expect(simulation.getState().entities.staff.find((staff) => staff.id === 1)).toMatchObject({
            skillLevel: 1,
            trainingRemainingTicks: 0
        });
        simulation.execute({ type: "train-staff", staffId: 1 });
        expect(simulation.getState().entities.staff.find((staff) => staff.id === 1)).toMatchObject({
            skillLevel: 1,
            trainingRemainingTicks: 9
        });
        simulation.execute({ type: "tick", count: 9 });
        simulation.execute({ type: "train-staff", staffId: 1 });
        expect(simulation.getState().entities.staff.find((staff) => staff.id === 1)).toMatchObject({
            skillLevel: 2,
            trainingRemainingTicks: 4
        });
    });
    it("uses imported staff market quality as initial hired staff skill", () => {
        const simulation = new DeterministicSimulation(72092, { bounds: { width: 8, height: 8 } });
        simulation.execute({ type: "hire-staff", role: "nurse", initialSkillLevel: 3, position: { x: 6, y: 4 } });
        expect(simulation.getState().entities.staff.find((staff) => staff.role === "nurse" && staff.position.x === 6)).toMatchObject({
            skillLevel: 3,
            trainingRemainingTicks: 0
        });
        simulation.execute({ type: "train-staff", staffId: 4 });
        expect(simulation.getState().staffTraining.trainingStarted).toBe(0);
    });
    it("uses psychiatrist-qualified doctors for faster diagnosis", () => {
        const baseline = new DeterministicSimulation(72095, { bounds: { width: 8, height: 8 } });
        const specialized = new DeterministicSimulation(72095, { bounds: { width: 8, height: 8 } });
        baseline.execute({ type: "hire-staff", role: "diagnostician", position: { x: 6, y: 4 } });
        specialized.execute({ type: "hire-staff", role: "diagnostician", initialSpecialties: ["psychiatrist"], position: { x: 6, y: 4 } });
        baseline.execute({ type: "set-staff-status", staffId: 1, status: "on-break" });
        baseline.execute({ type: "admit-patient", severity: 3, position: { x: 1, y: 1 } });
        specialized.execute({ type: "set-staff-status", staffId: 1, status: "on-break" });
        specialized.execute({ type: "admit-patient", severity: 3, position: { x: 1, y: 1 } });
        let baselineDiagnosisTick = null;
        let specializedDiagnosisTick = null;
        for (let tick = 1; tick <= 8; tick += 1) {
            baseline.execute({ type: "tick", count: 1 });
            specialized.execute({ type: "tick", count: 1 });
            if (baselineDiagnosisTick === null && baseline.getState().entities.waitingPatients[0]?.diagnosisKnown) {
                baselineDiagnosisTick = tick;
            }
            if (specializedDiagnosisTick === null && specialized.getState().entities.waitingPatients[0]?.diagnosisKnown) {
                specializedDiagnosisTick = tick;
            }
        }
        expect(specializedDiagnosisTick).toBeLessThan(baselineDiagnosisTick);
        expect(baselineDiagnosisTick).toBeGreaterThan(0);
        expect(specialized.getState().entities.staff.find((staff) => staff.specialties?.includes("psychiatrist"))).toMatchObject({
            role: "diagnostician",
            specialties: ["psychiatrist"]
        });
    });
    it("requires surgeon-qualified doctors for specialist treatment", () => {
        const blocked = new DeterministicSimulation(72094, { bounds: { width: 12, height: 12 } });
        const specialized = new DeterministicSimulation(72094, { bounds: { width: 12, height: 12 } });
        blocked.execute({ type: "open-room", roomType: "specialist", position: { x: 1, y: 7 } });
        specialized.execute({ type: "open-room", roomType: "specialist", position: { x: 1, y: 7 } });
        specialized.execute({ type: "hire-staff", role: "diagnostician", initialSpecialties: ["surgeon"], position: { x: 8, y: 4 } });
        blocked.execute({ type: "admit-patient", severity: 3, diseaseId: "cranial-pressure", position: { x: 2, y: 4 } });
        specialized.execute({ type: "admit-patient", severity: 3, diseaseId: "cranial-pressure", position: { x: 2, y: 4 } });
        let specializedDischargeTick = null;
        for (let tick = 1; tick <= 16; tick += 1) {
            blocked.execute({ type: "tick", count: 1 });
            specialized.execute({ type: "tick", count: 1 });
            if (specializedDischargeTick === null && specialized.getState().hospitalLoop.dischargedPatients === 1) {
                specializedDischargeTick = tick;
            }
        }
        expect(blocked.getState().entities.waitingPatients[0]).toMatchObject({
            diseaseId: "cranial-pressure",
            preferredTreatmentRoomType: "specialist",
            status: "awaiting-treatment"
        });
        expect(blocked.getState().hospitalLoop.dischargedPatients).toBe(0);
        expect(specializedDischargeTick).toBeGreaterThan(0);
        expect(specialized.getState().hospitalLoop.dischargedPatients).toBe(1);
    });
    it("requires researcher-qualified doctors and DNA Fixer rooms for Alien DNA treatment", () => {
        const researcherTreatment = new DeterministicSimulation(72095, { bounds: { width: 12, height: 12 } });
        researcherTreatment.execute({ type: "open-room", roomType: "dna-fixer", position: { x: 1, y: 7 } });
        researcherTreatment.execute({ type: "hire-staff", role: "diagnostician", initialSpecialties: ["researcher"], position: { x: 8, y: 4 } });
        researcherTreatment.execute({ type: "admit-patient", severity: 3, diseaseId: "alien-dna", position: { x: 2, y: 4 } });
        let researcherDischargeTick = null;
        for (let tick = 1; tick <= 16; tick += 1) {
            researcherTreatment.execute({ type: "tick", count: 1 });
            if (researcherDischargeTick === null && researcherTreatment.getState().hospitalLoop.dischargedPatients === 1) {
                researcherDischargeTick = tick;
            }
        }
        const dnaFixer = researcherTreatment.getState().entities.rooms.find((room) => room.roomType === "dna-fixer");
        expect(dnaFixer).toBeTruthy();
        expect(researcherDischargeTick).toBeGreaterThan(0);
        expect(researcherTreatment.getState().hospitalLoop.dischargedPatients).toBe(1);
        const surgeonOnly = new DeterministicSimulation(72096, { bounds: { width: 12, height: 12 } });
        surgeonOnly.execute({ type: "open-room", roomType: "dna-fixer", position: { x: 1, y: 7 } });
        surgeonOnly.execute({ type: "hire-staff", role: "diagnostician", initialSpecialties: ["surgeon"], position: { x: 8, y: 4 } });
        surgeonOnly.execute({ type: "admit-patient", severity: 3, diseaseId: "alien-dna", position: { x: 2, y: 4 } });
        surgeonOnly.execute({ type: "tick", count: 8 });
        expect(surgeonOnly.getState().entities.waitingPatients[0]).toMatchObject({
            diseaseId: "alien-dna",
            preferredTreatmentRoomType: "dna-fixer",
            status: "awaiting-treatment"
        });
        const nurseOnly = new DeterministicSimulation(72097, { bounds: { width: 12, height: 12 } });
        nurseOnly.execute({ type: "open-room", roomType: "dna-fixer", position: { x: 1, y: 7 } });
        nurseOnly.execute({ type: "admit-patient", severity: 3, diseaseId: "alien-dna", position: { x: 2, y: 4 } });
        nurseOnly.execute({ type: "tick", count: 8 });
        expect(nurseOnly.getState().entities.waitingPatients[0]).toMatchObject({
            diseaseId: "alien-dna",
            preferredTreatmentRoomType: "dna-fixer",
            status: "awaiting-treatment"
        });
        const researcherOnlySpecialist = new DeterministicSimulation(72098, { bounds: { width: 12, height: 12 } });
        researcherOnlySpecialist.execute({ type: "open-room", roomType: "specialist", position: { x: 1, y: 7 } });
        researcherOnlySpecialist.execute({ type: "hire-staff", role: "diagnostician", initialSpecialties: ["researcher"], position: { x: 8, y: 4 } });
        researcherOnlySpecialist.execute({ type: "admit-patient", severity: 3, diseaseId: "cranial-pressure", position: { x: 2, y: 4 } });
        researcherOnlySpecialist.execute({ type: "tick", count: 8 });
        expect(researcherOnlySpecialist.getState().entities.waitingPatients[0]).toMatchObject({
            diseaseId: "cranial-pressure",
            preferredTreatmentRoomType: "specialist",
            status: "awaiting-treatment"
        });
    });
    it("requires disease-specific treatment rooms for pharmacy, fracture, hair, and specialist diseases", () => {
        const specialized = new DeterministicSimulation(7210, { bounds: { width: 12, height: 12 } });
        specialized.execute({ type: "open-room", roomType: "pharmacy", position: { x: 1, y: 7 } });
        const pharmacy = specialized.getState().entities.rooms.find((room) => room.roomType === "pharmacy");
        expect(pharmacy).toBeTruthy();
        specialized.execute({ type: "admit-patient", severity: 2, position: { x: 2, y: 4 } });
        specialized.execute({ type: "tick", count: 4 });
        expect(specialized.getState().entities.waitingPatients[0]).toMatchObject({
            diseaseId: "gastric-grumble",
            preferredTreatmentRoomType: "pharmacy",
            status: "walking-to-treatment",
            assignedRoomId: pharmacy.id
        });
        const fallback = new DeterministicSimulation(7211, { bounds: { width: 12, height: 12 } });
        fallback.execute({ type: "admit-patient", severity: 2, position: { x: 2, y: 4 } });
        fallback.execute({ type: "tick", count: 5 });
        expect(fallback.getState().entities.waitingPatients[0]).toMatchObject({
            diseaseId: "gastric-grumble",
            preferredTreatmentRoomType: "pharmacy",
            status: "awaiting-treatment"
        });
        expect(fallback.getState().entities.waitingPatients[0]?.assignedRoomId).toBeNull();
        const fracture = new DeterministicSimulation(7212, { bounds: { width: 12, height: 12 } });
        fracture.execute({ type: "open-room", roomType: "fracture-clinic", position: { x: 1, y: 7 } });
        const fractureClinic = fracture.getState().entities.rooms.find((room) => room.roomType === "fracture-clinic");
        expect(fractureClinic).toBeTruthy();
        fracture.execute({ type: "admit-patient", severity: 2, diseaseId: "fractured-bones", position: { x: 2, y: 4 } });
        fracture.execute({ type: "tick", count: 4 });
        expect(fracture.getState().entities.waitingPatients[0]).toMatchObject({
            diseaseId: "fractured-bones",
            preferredTreatmentRoomType: "fracture-clinic",
            status: "walking-to-treatment",
            assignedRoomId: fractureClinic.id
        });
        const missingSpecialist = new DeterministicSimulation(7213, { bounds: { width: 12, height: 12 } });
        missingSpecialist.execute({ type: "admit-patient", severity: 2, diseaseId: "fractured-bones", position: { x: 2, y: 4 } });
        missingSpecialist.execute({ type: "tick", count: 5 });
        expect(missingSpecialist.getState().entities.waitingPatients[0]).toMatchObject({
            diseaseId: "fractured-bones",
            preferredTreatmentRoomType: "fracture-clinic",
            status: "awaiting-treatment"
        });
        expect(missingSpecialist.getState().entities.waitingPatients[0]?.assignedRoomId).toBeNull();
        const hair = new DeterministicSimulation(72131, { bounds: { width: 12, height: 12 } });
        hair.execute({ type: "open-room", roomType: "hair-restoration", position: { x: 1, y: 7 } });
        const hairRestoration = hair.getState().entities.rooms.find((room) => room.roomType === "hair-restoration");
        expect(hairRestoration).toBeTruthy();
        hair.execute({ type: "admit-patient", severity: 2, diseaseId: "baldness", position: { x: 2, y: 4 } });
        hair.execute({ type: "tick", count: 4 });
        expect(hair.getState().entities.waitingPatients[0]).toMatchObject({
            diseaseId: "baldness",
            preferredTreatmentRoomType: "hair-restoration",
            status: "walking-to-treatment",
            assignedRoomId: hairRestoration.id
        });
        const missingHair = new DeterministicSimulation(72132, { bounds: { width: 12, height: 12 } });
        missingHair.execute({ type: "admit-patient", severity: 2, diseaseId: "baldness", position: { x: 2, y: 4 } });
        missingHair.execute({ type: "tick", count: 5 });
        expect(missingHair.getState().entities.waitingPatients[0]).toMatchObject({
            diseaseId: "baldness",
            preferredTreatmentRoomType: "hair-restoration",
            status: "awaiting-treatment"
        });
        expect(missingHair.getState().entities.waitingPatients[0]?.assignedRoomId).toBeNull();
    });
    it("keeps generic treatment rooms available for diseases that prefer treatment", () => {
        const simulation = new DeterministicSimulation(7214, { bounds: { width: 12, height: 12 } });
        simulation.execute({ type: "admit-patient", severity: 1, diseaseId: "mild-cold", position: { x: 2, y: 4 } });
        simulation.execute({ type: "tick", count: 4 });
        expect(simulation.getState().entities.waitingPatients[0]).toMatchObject({
            diseaseId: "mild-cold",
            preferredTreatmentRoomType: "treatment",
            status: "walking-to-treatment",
            assignedRoomId: 2
        });
    });
    it("does not let unstaffed specialist cases block staffed general treatment rooms", () => {
        const simulation = new DeterministicSimulation(7215, { bounds: { width: 12, height: 12 } });
        simulation.execute({ type: "open-room", roomType: "specialist", position: { x: 1, y: 7 } });
        simulation.execute({ type: "admit-patient", severity: 3, diseaseId: "cranial-pressure", position: { x: 2, y: 4 } });
        simulation.execute({ type: "admit-patient", severity: 1, diseaseId: "mild-cold", position: { x: 3, y: 4 } });
        simulation.execute({ type: "tick", count: 8 });
        const specialistPatient = simulation.getState().entities.waitingPatients.find((patient) => patient.diseaseId === "cranial-pressure");
        const generalPatient = simulation.getState().entities.waitingPatients.find((patient) => patient.diseaseId === "mild-cold");
        expect(specialistPatient).toMatchObject({
            preferredTreatmentRoomType: "specialist",
            status: "awaiting-treatment"
        });
        expect(generalPatient).toMatchObject({
            preferredTreatmentRoomType: "treatment",
            status: "walking-to-treatment",
            assignedRoomId: 2
        });
        expect(simulation.getState().hospitalLoop).toMatchObject({
            walkingToTreatmentPatients: 1,
            awaitingTreatmentPatients: 1
        });
    });
    it("does not over-assign a single nurse across multiple open treatment rooms", () => {
        const simulation = new DeterministicSimulation(7216, { bounds: { width: 12, height: 12 } });
        simulation.execute({ type: "open-room", roomType: "diagnosis", position: { x: 1, y: 7 } });
        simulation.execute({ type: "hire-staff", role: "diagnostician", position: { x: 8, y: 4 } });
        simulation.execute({ type: "open-room", roomType: "treatment", position: { x: 1, y: 7 } });
        simulation.execute({ type: "admit-patient", severity: 1, diseaseId: "mild-cold", position: { x: 2, y: 4 } });
        simulation.execute({ type: "admit-patient", severity: 1, diseaseId: "mild-cold", position: { x: 3, y: 4 } });
        simulation.execute({ type: "tick", count: 5 });
        expect(simulation.getState().hospitalLoop).toMatchObject({
            walkingToTreatmentPatients: 1,
            awaitingTreatmentPatients: 1
        });
        expect(simulation.getState().entities.waitingPatients.map((patient) => ({
            id: patient.id,
            status: patient.status,
            assignedStaffId: patient.assignedStaffId
        }))).toEqual([
            { id: 1, status: "walking-to-treatment", assignedStaffId: 2 },
            { id: 2, status: "awaiting-treatment", assignedStaffId: null }
        ]);
    });
    it("keeps deterministic hashes for identical staff/room command streams", () => {
        const commands = [
            { type: "train-staff", staffId: 1 },
            { type: "tick", count: 5 },
            { type: "set-staff-status", staffId: 1, status: "on-break" },
            { type: "admit-patient", severity: 2, position: { x: 3, y: 1 } },
            { type: "tick", count: 2 },
            { type: "set-staff-status", staffId: 1, status: "active" },
            { type: "open-room", roomType: "diagnosis" },
            { type: "hire-staff", role: "diagnostician" },
            { type: "tick", count: 3 },
            { type: "set-room-status", roomId: 2, status: "closed" },
            { type: "tick", count: 2 },
            { type: "set-room-status", roomId: 2, status: "open" },
            { type: "tick", count: 1 }
        ];
        const left = new DeterministicSimulation(7204, { bounds: { width: 8, height: 8 } });
        const right = new DeterministicSimulation(7204, { bounds: { width: 8, height: 8 } });
        const leftHashes = commands.map((command) => {
            left.execute(command);
            return left.currentHash();
        });
        const rightHashes = commands.map((command) => {
            right.execute(command);
            return right.currentHash();
        });
        expect(leftHashes).toEqual(rightHashes);
    });
});
