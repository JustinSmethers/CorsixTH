import { DeterministicSimulation } from "../src/simulation";

function createTerrain(width, height) {
    return {
        width,
        height,
        signature: `test-terrain:${width}x${height}`,
        tiles: Array.from({ length: width * height }, () => ({ passable: true, buildable: true }))
    };
}

function setTile(terrain, x, y, values) {
    terrain.tiles[y * terrain.width + x] = {
        ...terrain.tiles[y * terrain.width + x],
        ...values
    };
}

function setRect(terrain, left, top, width, height, values) {
    for (let y = top; y < top + height; y += 1) {
        for (let x = left; x < left + width; x += 1) {
            setTile(terrain, x, y, values);
        }
    }
}

describe("simulation terrain integration", () => {
    it("blocks room footprints on non-buildable terrain and allows valid footprints", () => {
        const terrain = createTerrain(12, 12);
        setRect(terrain, 6, 7, 3, 3, { buildable: false });
        const simulation = new DeterministicSimulation(7601, {
            bounds: { width: 12, height: 12 },
            terrain
        });
        expect(simulation.evaluateRoomPlacement("diagnosis", { x: 6, y: 7 }, { charge: true })).toMatchObject({
            valid: false,
            reason: "non-buildable",
            cost: 800,
            position: { x: 6, y: 7 },
            footprint: { width: 3, height: 3 }
        });
        expect(simulation.evaluateRoomPlacement("diagnosis", { x: 1, y: 7 }, { charge: true })).toMatchObject({
            valid: true,
            reason: null,
            cost: 800,
            tiles: expect.arrayContaining([{ x: 1, y: 7 }, { x: 3, y: 9 }])
        });
        const beforeBlocked = simulation.getState().entities.rooms.length;
        simulation.execute({ type: "open-room", roomType: "diagnosis", position: { x: 6, y: 7 } });
        expect(simulation.getState().entities.rooms).toHaveLength(beforeBlocked);
        simulation.execute({ type: "open-room", roomType: "diagnosis", position: { x: 1, y: 7 } });
        const afterValid = simulation.getState();
        expect(afterValid.entities.rooms).toHaveLength(beforeBlocked + 1);
        expect(afterValid.entities.rooms[afterValid.entities.rooms.length - 1]).toMatchObject({
            position: { x: 1, y: 7 },
            footprint: { width: 3, height: 3 }
        });
        expect(afterValid.terrain).toMatchObject({
            signature: "test-terrain:12x12",
            passableTileCount: 144,
            buildableTileCount: 135
        });
        expect(simulation.evaluateRoomPlacement("treatment", { x: 1, y: 7 }, { charge: true })).toMatchObject({
            valid: false,
            reason: "occupied"
        });
    });

    it("snaps admitted patients and hired staff away from impassable terrain", () => {
        const terrain = createTerrain(8, 8);
        setTile(terrain, 3, 4, { passable: false, buildable: false });
        const simulation = new DeterministicSimulation(7602, {
            bounds: { width: 8, height: 8 },
            terrain
        });
        simulation.execute({ type: "admit-patient", severity: 2, position: { x: 3, y: 4 } });
        simulation.execute({ type: "hire-staff", role: "nurse", position: { x: 3, y: 4 } });
        const state = simulation.getState();
        expect(state.entities.waitingPatients[0]?.position).not.toEqual({ x: 3, y: 4 });
        expect(state.entities.staff[state.entities.staff.length - 1]?.position).not.toEqual({ x: 3, y: 4 });
        expect(simulation.evaluateStaffPlacement("nurse", { x: 3, y: 4 }, { charge: true })).toMatchObject({
            valid: true,
            reason: null,
            cost: 250
        });
        expect(simulation.evaluateStaffPlacement("nurse", { x: 3, y: 4 }, { charge: true }).position).not.toEqual({ x: 3, y: 4 });
    });

    it("surfaces affordability in read-only placement evaluations", () => {
        const simulation = new DeterministicSimulation(7604, {
            bounds: { width: 8, height: 8 },
            initialCash: 100
        });
        expect(simulation.evaluateStaffPlacement("nurse", { x: 3, y: 4 }, { charge: true })).toMatchObject({
            valid: false,
            reason: "insufficient-cash",
            cost: 250,
            position: { x: 3, y: 4 }
        });
        expect(simulation.evaluateRoomPlacement("diagnosis", { x: 1, y: 4 }, { charge: true })).toMatchObject({
            valid: false,
            reason: "insufficient-cash",
            cost: 800
        });
    });

    it("includes non-default terrain signatures in deterministic hashes", () => {
        const leftTerrain = createTerrain(8, 8);
        const rightTerrain = {
            ...createTerrain(8, 8),
            signature: "test-terrain:8x8:variant"
        };
        const left = new DeterministicSimulation(7603, {
            bounds: { width: 8, height: 8 },
            terrain: leftTerrain
        });
        const right = new DeterministicSimulation(7603, {
            bounds: { width: 8, height: 8 },
            terrain: rightTerrain
        });
        expect(left.currentHash()).not.toBe(right.currentHash());
    });
});
