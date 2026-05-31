import { DeterministicSimulation } from "@corsixth/core";
function buildPhase9StressCommands() {
    const commands = [];
    for (let wave = 0; wave < 120; wave += 1) {
        commands.push({
            type: "admit-patient",
            severity: ((wave % 3) + 1),
            position: {
                x: (wave * 7) % 24,
                y: (wave * 11) % 24
            }
        });
        if (wave % 2 === 0) {
            commands.push({
                type: "schedule-admit-patient",
                delay: (wave % 5) + 1,
                severity: (((wave + 1) % 3) + 1),
                position: {
                    x: (wave * 13) % 24,
                    y: (wave * 17) % 24
                }
            });
        }
        if (wave % 4 === 0) {
            commands.push({
                type: "hire-staff",
                role: wave % 8 === 0 ? "diagnostician" : "nurse"
            });
        }
        if (wave % 6 === 1) {
            commands.push({
                type: "open-room",
                roomType: wave % 12 === 1 ? "diagnosis" : "treatment"
            });
        }
        if (wave % 5 === 0) {
            commands.push({
                type: "set-staff-status",
                staffId: 1,
                status: wave % 10 === 0 ? "on-break" : "active"
            });
        }
        if (wave % 7 === 0) {
            commands.push({
                type: "set-room-status",
                roomId: 2,
                status: wave % 14 === 0 ? "closed" : "open"
            });
        }
        commands.push({ type: "tick", count: 6 + (wave % 4) });
        if (wave % 3 === 0) {
            commands.push({ type: "treat-patient" });
        }
    }
    commands.push({ type: "tick", count: 2_000 });
    return commands;
}
function runStressReplay(commands) {
    const simulation = new DeterministicSimulation(9009, { bounds: { width: 24, height: 24 } });
    const hashes = [];
    for (const command of commands) {
        simulation.execute(command);
        hashes.push(simulation.currentHash());
    }
    const finalState = simulation.getState();
    return {
        hashes,
        finalHash: hashes[hashes.length - 1] ?? "",
        finalTick: finalState.tick
    };
}
describe("phase 9 stress replay determinism", () => {
    it("locks stress replay checkpoint hashes", () => {
        const commands = buildPhase9StressCommands();
        expect(commands.length).toBe(433);
        const result = runStressReplay(commands);
        expect(result.finalTick).toBe(2_900);
        const checkpointHashes = [0, 43, 129, 259, 345, 432].map((index) => result.hashes[index]);
        expect(checkpointHashes).toEqual(["174f3581", "5a25043a", "c3551e02", "66328007", "2673b9c0", "edd4f64f"]);
        expect(result.finalHash).toBe("edd4f64f");
    });
    it("has zero hash drift for repeated stress runs", () => {
        const commands = buildPhase9StressCommands();
        const left = runStressReplay(commands);
        const right = runStressReplay(commands);
        expect(left.hashes).toEqual(right.hashes);
        expect(left.finalHash).toBe(right.finalHash);
    });
});
