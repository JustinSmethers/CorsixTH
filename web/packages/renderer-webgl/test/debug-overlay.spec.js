import { createCameraState, createTextureAtlas, renderSceneToFrame } from "../src/index";
function pixelAt(frame, x, y) {
    const base = (y * frame.width + x) * 4;
    return [
        frame.pixels[base] ?? 0,
        frame.pixels[base + 1] ?? 0,
        frame.pixels[base + 2] ?? 0,
        frame.pixels[base + 3] ?? 0
    ];
}
describe("debug overlay rendering", () => {
    it("draws deterministic tile and entity inspection overlays", () => {
        const atlas = createTextureAtlas({
            sprites: [
                { id: "grass", page: "terrain", width: 2, height: 2, color: [66, 142, 76, 255] },
                { id: "doctor", page: "entities", width: 2, height: 2, color: [200, 64, 64, 255] },
                { id: "patient", page: "entities", width: 2, height: 2, color: [64, 104, 208, 255] }
            ]
        });
        const frame = renderSceneToFrame({
            atlas,
            viewportWidth: 8,
            viewportHeight: 8,
            tileSize: 2,
            camera: createCameraState({ scrollX: 0, scrollY: 0, zoom: 1 }),
            tiles: [
                ["grass", "grass", "grass", "grass"],
                ["grass", "grass", "grass", "grass"],
                ["grass", "grass", "grass", "grass"],
                ["grass", "grass", "grass", "grass"]
            ],
            entities: [
                { id: "entity-a", spriteId: "doctor", x: 1, y: 1 },
                { id: "entity-b", spriteId: "patient", x: 2, y: 1 }
            ],
            debug: {
                inspectTile: { x: 1, y: 1 },
                inspectEntityId: "entity-b"
            }
        });
        expect(frame.debugPrimitives.map((primitive) => primitive.id)).toEqual([
            "tile:1:1",
            "entity:entity-b"
        ]);
        expect(pixelAt(frame, 2, 2)).toEqual([220, 190, 64, 255]);
        expect(pixelAt(frame, 4, 2)).toEqual([64, 188, 196, 255]);
    });
});
