import { existsSync, readFileSync } from "node:fs";
import {
    decodeThemeHospitalAnimationSet,
    decodeThemeHospitalPalette,
    decodeThemeHospitalSpriteSheet,
    resolveThemeHospitalObjectAnimation,
    renderThemeHospitalMapScene
} from "../src/index.js";

const palette = { colors: new Uint8ClampedArray(1024) };
palette.colors.set([255, 0, 0, 255], 4);
palette.colors.set([0, 255, 0, 255], 8);
const sprite = (width, height, indices) => ({ width, height, indices: new Uint8Array(indices) });
const spriteSheet = { sprites: [sprite(2, 1, [1, 2]), sprite(2, 1, [2, 1])] };
const animationSet = {
    animationCount: 5200,
    firstFrames: new Array(5200).fill(0),
    frames: [{ listIndex: 0, nextFrame: 1 }, { listIndex: 2, nextFrame: 0 }],
    elementList: [0, 0xffff, 1, 0xffff],
    elements: [
        { spriteIndex: 0, x: -4, y: -3, layer: 0, layerId: 0, flags: 0 },
        { spriteIndex: 1, x: -4, y: -3, layer: 0, layerId: 0, flags: 0 }
    ]
};
function render(objects, changes = {}) {
    return renderThemeHospitalMapScene({
        map: { contract: "theme-hospital-map.v1", width: 4, height: 4,
            tiles: Array.from({ length: 16 }, () => ({ ground: 0, northWall: 0, westWall: 0, objectType: 0 })) },
        blockSheet: { sprites: [sprite(0, 0, [])] },
        spriteSheet, animationSet, palette, objects,
        viewportWidth: 240, viewportHeight: 200,
        originX: 100, originY: 64, tileColumns: 4, tileRows: 4,
        ...changes
    });
}
const pixel = (image, x, y) => [...image.pixels.slice((y * image.width + x) * 4, (y * image.width + x) * 4 + 4)];

describe("Native placed furniture and equipment", () => {
    it.each([
        [1, "desk", 48], [4, "bench", 112], [7, "drinks_machine", 174],
        [9, "inflator", 572], [11, "reception_desk", 2062],
        [39, "pharmacy_cabinet", 1578], [43, "extinguisher", 178],
        [44, "radiator", 750], [45, "plant", 1950], [50, "bin", 1752]
    ])("maps scenario THOB %i to the checked-in %s idle animation", (index, type, animationIndex) => {
        expect(resolveThemeHospitalObjectAnimation(index)).toMatchObject({ objectIndex: index, objectType: type, animationIndex, flags: 0 });
    });

    it("uses explicit native orientations and mirrored fallbacks", () => {
        expect(resolveThemeHospitalObjectAnimation(4, { orientation: "east" })).toMatchObject({ animationIndex: 114, flags: 0 });
        expect(resolveThemeHospitalObjectAnimation(4, { orientation: "west" })).toMatchObject({ animationIndex: 112, flags: 1 });
        expect(resolveThemeHospitalObjectAnimation(4, { orientation: "south" })).toMatchObject({ animationIndex: 114, flags: 1 });
        expect(resolveThemeHospitalObjectAnimation(7, { orientation: "west" })).toMatchObject({ animationIndex: 172, flags: 0 });
        expect(resolveThemeHospitalObjectAnimation(50, { orientation: "east" })).toMatchObject({ animationIndex: 1752, flags: 1, drawingLayer: 2 });
        // Native machines often permit only two orientations.
        expect(resolveThemeHospitalObjectAnimation(9, { orientation: "west" })).toBeNull();
        expect(resolveThemeHospitalObjectAnimation(999)).toBeNull();
    });

    it("uses normalized native solid-cell anchors and separate attachment tiles", () => {
        expect(resolveThemeHospitalObjectAnimation(1)).toMatchObject({ anchorOffset: [1, 0], attachOffset: [1, -1] });
        const frame = render([{ id: 3, objectIndex: 1, position: { x: 2, y: 2 }, orientation: "north" }]);
        expect(pixel(frame, 128, 141)).toEqual([255, 0, 0, 255]);
        expect(frame.objectDraws[0]).toMatchObject({ id: 3, objectType: "desk", screenX: 126, screenY: 139, width: 6, height: 5 });
    });

    it("keeps idle furniture still and returns separate bounds for shared humanoid IDs", () => {
        const object = { id: 1, objectIndex: 4, position: { x: 2, y: 2 }, orientation: "north" };
        const before = JSON.stringify(object);
        const frame = render([object], { animationFrameStep: 1,
            entities: [{ id: 1, role: "doctor", position: { x: 1, y: 1 } }] });
        expect(frame.objectDraws[0].frameIndex).toBe(0);
        expect(frame.entityDraws[0].frameIndex).toBe(1);
        expect(frame.stats.placedObjectSpriteCount).toBe(1);
        expect(frame.stats.entitySpriteCount).toBe(1);
        expect(frame.stats.objectSpriteCount).toBe(0);
        expect(JSON.stringify(object)).toBe(before);
    });

    it("renders linked native equipment components with union selection bounds", () => {
        const resolved = resolveThemeHospitalObjectAnimation(28);
        expect(resolved.components.map((part) => part.objectType)).toEqual(["radiation_shield", "radiation_shield_b"]);
        expect(resolved.components.map((part) => part.animationIndex)).toEqual([794, 1968]);
        const frame = render([{ id: 9, objectIndex: 28, position: { x: 2, y: 1 } }]);
        expect(frame.objectDraws[0]).toMatchObject({ id: 9, objectType: "radiation_shield", componentCount: 2 });
        expect(frame.objectDraws[0].width).toBeGreaterThan(6);
        expect(frame.objectDraws[0].height).toBeGreaterThan(5);
        expect(frame.stats.placedObjectSpriteCount).toBe(1);
    });

    it("orders side furnishings around humanoids deterministically", () => {
        const firstFrames = [...animationSet.firstFrames];
        firstFrames[178] = 1;
        firstFrames[470] = 1;
        const human = { id: "person", animationIndex: 0, position: { x: 2, y: 2 } };
        const object = { id: "side", objectIndex: 43, position: { x: 2, y: 2 }, orientation: "north" };
        const north = render([object], { animationSet: { ...animationSet, firstFrames }, entities: [human] });
        expect(pixel(north, 96, 125)).toEqual([255, 0, 0, 255]);
        const south = render([{ ...object, orientation: "south" }], { animationSet: { ...animationSet, firstFrames }, entities: [human] });
        expect(pixel(south, 96, 125)).toEqual([0, 255, 0, 255]);
        const objects = [object, { ...object, id: "bench", objectIndex: 4 }];
        expect(render(objects).pixels).toEqual(render([...objects].reverse()).pixels);
    });

    it("draws native early-list furnishings before the tile west wall", () => {
        const map = { contract: "theme-hospital-map.v1", width: 4, height: 4,
            tiles: Array.from({ length: 16 }, () => ({ ground: 0, northWall: 0, westWall: 0 })) };
        map.tiles[3 * 4 + 2].westWall = 1;
        const frame = render([{ id: "bed", objectIndex: 8, position: { x: 2, y: 2 }, orientation: "north" }], {
            map, blockSheet: { sprites: [sprite(0, 0, []), sprite(128, 64, new Array(128 * 64).fill(2))] }
        });
        expect(pixel(frame, 64, 141)).toEqual([0, 255, 0, 255]);
        expect(frame.objectDraws[0].objectType).toBe("bed");
    });

    it("renders a visible furnishing whose native attachment falls beyond the tile window", () => {
        const frame = render([{ id: 4, objectIndex: 1, position: { x: 0, y: 0 } }], { tileColumns: 1, tileRows: 1 });
        expect(frame.objectDraws[0]).toMatchObject({ id: 4, objectType: "desk" });
        expect(pixel(frame, 128, 77)).toEqual([255, 0, 0, 255]);
    });

    const localRoot = new URL("../../../../GameData/Contents/Resources/game/DATA/", import.meta.url);
    const localTest = existsSync(new URL("VSPR-0.TAB", localRoot)) ? it : it.skip;
    localTest("renders representative real GoG furnishings and equipment by original animation", () => {
        const read = (path) => readFileSync(new URL(path, localRoot));
        const actualSheet = decodeThemeHospitalSpriteSheet(read("VSPR-0.TAB"), read("VSPR-0.DAT"));
        const actualPalette = decodeThemeHospitalPalette(read("MPALETTE.DAT"));
        const actualAnimations = decodeThemeHospitalAnimationSet(read("VSTART-1.ANI"), read("VFRA-1.ANI"), read("VLIST-1.ANI"), read("VELE-1.ANI"));
        for (const objectIndex of [1, 4, 7, 9, 11, 21, 27, 28, 30, 39, 43, 44, 45, 50]) {
            for (const orientation of ["north", "east"]) {
                const frame = render([{ id: objectIndex, objectIndex, orientation, position: { x: 2, y: 1 } }], {
                    spriteSheet: actualSheet, animationSet: actualAnimations, palette: actualPalette,
                    viewportWidth: 400, viewportHeight: 300, originX: 180, originY: 140
                });
                expect(frame.stats.placedObjectSpriteCount, `THOB ${objectIndex} ${orientation}`).toBe(1);
                const bounds = frame.objectDraws[0];
                expect(bounds.animationIndex).toBe(resolveThemeHospitalObjectAnimation(objectIndex, { orientation }).animationIndex);
                expect(bounds.width).toBeGreaterThan(4);
                expect(bounds.height).toBeGreaterThan(4);
                expect(frame.pixels.some((value, index) => index % 4 === 3 && value > 0)).toBe(true);
            }
        }
    });
});
