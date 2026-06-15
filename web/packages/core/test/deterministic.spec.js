import { DeterministicSimulation } from "../src/simulation";
const scriptedCommands = [
    { type: "admit-patient", severity: 2, position: { x: 1, y: 1 } },
    { type: "schedule-admit-patient", delay: 2, severity: 1, position: { x: 2, y: 2 } },
    { type: "tick", count: 3 },
    { type: "treat-patient" },
    { type: "tick", count: 2 }
];
const slice2StaffRoomCommands = [
    { type: "set-staff-status", staffId: 1, status: "on-break" },
    { type: "admit-patient", severity: 2, position: { x: 1, y: 1 } },
    { type: "tick", count: 2 },
    { type: "set-staff-status", staffId: 1, status: "active" },
    { type: "open-room", roomType: "diagnosis" },
    { type: "hire-staff", role: "diagnostician" },
    { type: "tick", count: 2 },
    { type: "set-room-status", roomId: 2, status: "closed" },
    { type: "tick", count: 1 },
    { type: "set-room-status", roomId: 2, status: "open" },
    { type: "tick", count: 1 }
];
describe("deterministic simulation", () => {
    it("produces identical command-level and tick-level hashes for same seed and commands", () => {
        const left = new DeterministicSimulation(1234, { bounds: { width: 8, height: 8 } });
        const right = new DeterministicSimulation(1234, { bounds: { width: 8, height: 8 } });
        const leftHashes = scriptedCommands.map((command) => {
            left.execute(command);
            return left.currentHash();
        });
        const rightHashes = scriptedCommands.map((command) => {
            right.execute(command);
            return right.currentHash();
        });
        const leftTickHashes = [];
        const rightTickHashes = [];
        for (let i = 0; i < 50; i += 1) {
            left.execute({ type: "tick", count: 1 });
            right.execute({ type: "tick", count: 1 });
            leftTickHashes.push(left.currentHash());
            rightTickHashes.push(right.currentHash());
        }
        expect(leftHashes).toEqual(rightHashes);
        expect(leftTickHashes).toEqual(rightTickHashes);
        expect(leftHashes[leftHashes.length - 1]).toBe("1094db8a");
        expect(leftTickHashes[leftTickHashes.length - 1]).toBe("184debb6");
    });
    it("diverges for different seeds", () => {
        const left = new DeterministicSimulation(1, { bounds: { width: 8, height: 8 } });
        const right = new DeterministicSimulation(2, { bounds: { width: 8, height: 8 } });
        left.execute({ type: "tick", count: 5 });
        right.execute({ type: "tick", count: 5 });
        expect(left.currentHash()).not.toEqual(right.currentHash());
    });
    it("keeps deterministic hashes for identical slice 2 staff/room control streams", () => {
        const left = new DeterministicSimulation(7003, { bounds: { width: 8, height: 8 } });
        const right = new DeterministicSimulation(7003, { bounds: { width: 8, height: 8 } });
        const leftHashes = slice2StaffRoomCommands.map((command) => {
            left.execute(command);
            return left.currentHash();
        });
        const rightHashes = slice2StaffRoomCommands.map((command) => {
            right.execute(command);
            return right.currentHash();
        });
        expect(leftHashes).toEqual(rightHashes);
        expect(leftHashes[leftHashes.length - 1]).toMatch(/^[a-f0-9]{8}$/);
    });
});
