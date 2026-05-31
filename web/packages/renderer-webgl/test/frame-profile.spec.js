import { createCameraState, createTextureAtlas, runFrameProfile } from "../src/index";
describe("renderer frame-time profiling", () => {
    it("meets the baseline scene target of 60 FPS on desktop profile", () => {
        const atlas = createTextureAtlas({
            sprites: [
                { id: "grass", page: "terrain", width: 2, height: 2, color: [66, 142, 76, 255] },
                { id: "water", page: "terrain", width: 2, height: 2, color: [57, 106, 177, 255] },
                { id: "doctor", page: "entities", width: 2, height: 2, color: [200, 64, 64, 255] },
                { id: "patient", page: "entities", width: 2, height: 2, color: [64, 104, 208, 255] }
            ]
        });
        const rows = [];
        for (let y = 0; y < 32; y += 1) {
            const row = [];
            for (let x = 0; x < 32; x += 1) {
                row.push((x + y) % 5 === 0 ? "water" : "grass");
            }
            rows.push(row);
        }
        const entities = [];
        for (let i = 0; i < 120; i += 1) {
            entities.push({
                id: `entity-${i.toString().padStart(3, "0")}`,
                spriteId: i % 2 === 0 ? "doctor" : "patient",
                x: (i * 7) % 30,
                y: (i * 11) % 30
            });
        }
        const profile = runFrameProfile({
            atlas,
            viewportWidth: 128,
            viewportHeight: 96,
            tileSize: 2,
            camera: createCameraState({ scrollX: 0, scrollY: 0, zoom: 1 }),
            tiles: rows,
            entities
        }, {
            warmupFrames: 30,
            measuredFrames: 240,
            targetFps: 60,
            script: (frameIndex, camera) => ({
                ...camera,
                scrollX: frameIndex % 12,
                scrollY: (frameIndex * 2) % 16
            })
        });
        console.info(`[renderer-perf] avg=${profile.averageFrameMs.toFixed(3)}ms fps=${profile.measuredFps.toFixed(2)} target=${profile.targetFps}`);
        expect(profile.measuredFps).toBeGreaterThanOrEqual(60);
        expect(profile.averageFrameMs).toBeLessThanOrEqual(1000 / 60);
    });
});
