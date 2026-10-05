import { existsSync, readFileSync } from "node:fs";
import {
    decodeThemeHospitalAnimationSet,
    decodeThemeHospitalPalette,
    decodeThemeHospitalSpriteSheet,
    resolveThemeHospitalHumanoidAnimation,
    renderThemeHospitalAnimationFrame,
    renderThemeHospitalMapScene
} from "../src/index.js";

const palette = { colors: new Uint8ClampedArray(1024) };
palette.colors.set([255, 0, 0, 255], 4);
palette.colors.set([0, 255, 0, 255], 8);
const sprite = (width, height, indices) => ({ width, height, indices: new Uint8Array(indices) });
const spriteSheet = { sprites: [sprite(2, 1, [1, 2]), sprite(2, 1, [2, 1])] };
const animationSet = {
    animationCount: 5000,
    firstFrames: new Array(5000).fill(0),
    frames: [{ listIndex: 0, nextFrame: 1 }, { listIndex: 2, nextFrame: 0 }],
    elementList: [0, 0xffff, 1, 0xffff],
    elements: [
        { spriteIndex: 0, x: -4, y: -3, layer: 0, layerId: 0, flags: 0 },
        { spriteIndex: 1, x: -4, y: -3, layer: 0, layerId: 0, flags: 0 }
    ]
};
function render(entities, changes = {}) {
    return renderThemeHospitalMapScene({
        map: { contract: "theme-hospital-map.v1", width: 4, height: 4,
            tiles: Array.from({ length: 16 }, () => ({ ground: 0, northWall: 0, westWall: 0, objectType: 0 })) },
        blockSheet: { sprites: [sprite(0, 0, [])] },
        spriteSheet, animationSet, palette, entities,
        viewportWidth: 240, viewportHeight: 200,
        originX: 100, originY: 64, tileColumns: 4, tileRows: 4,
        ...changes
    });
}
const pixel = (image, x, y) => [...image.pixels.slice((y * image.width + x) * 4, (y * image.width + x) * 4 + 4)];

describe("Native humanoid rendering", () => {
    it.each([
        ["patient", [16, 18, 24, 26]],
        ["Standard Female Patient", [0, 2, 8, 10]],
        ["diagnostician", [32, 34, 40, 42]],
        ["nurse", [1206, 1208, 1650, 1652]],
        ["handyman", [1858, 1860, 1866, 1868]],
        ["receptionist", [3668, 3670, 3676, 3678]]
    ])("uses Lua directional walking and idle IDs for %s", (type, expected) => {
        expect(resolveThemeHospitalHumanoidAnimation(type, { state: "walk", direction: "north" }).animationIndex).toBe(expected[0]);
        expect(resolveThemeHospitalHumanoidAnimation(type, { state: "walking", direction: "east" }).animationIndex).toBe(expected[1]);
        expect(resolveThemeHospitalHumanoidAnimation(type, { state: "idle", direction: "north" }).animationIndex).toBe(expected[2]);
        expect(resolveThemeHospitalHumanoidAnimation(type, { state: "idle", direction: "east" }).animationIndex).toBe(expected[3]);
        expect(resolveThemeHospitalHumanoidAnimation(type, { state: "walk", direction: "west" })).toMatchObject({ animationIndex: expected[0], flags: 1 });
        expect(resolveThemeHospitalHumanoidAnimation(type, { state: "idle", direction: "south" })).toMatchObject({ animationIndex: expected[3], flags: 1 });
    });

    it("selects one native head and permits explicit appearance overrides", () => {
        expect(resolveThemeHospitalHumanoidAnimation("patient").layers).toEqual({ 0: 2, 1: 0, 2: 0, 3: 0, 4: 0 });
        expect(resolveThemeHospitalHumanoidAnimation("doctor", { layers: { 5: 4 } }).layers).toEqual({ 5: 4 });
        expect(resolveThemeHospitalHumanoidAnimation("unknown")).toBeNull();
    });

    it("mirrors each element around the native anchor, with its sprite flags", () => {
        const north = render([{ id: "n", role: "doctor", position: { x: 2, y: 2 }, direction: "north" }]);
        const west = render([{ id: "w", role: "doctor", position: { x: 2, y: 2 }, direction: "west" }]);
        expect(pixel(north, 96, 125)).toEqual([255, 0, 0, 255]);
        expect(pixel(west, 102, 125)).toEqual([0, 255, 0, 255]);
        expect(pixel(west, 103, 125)).toEqual([255, 0, 0, 255]);
        expect(west.stats.entitySpriteCount).toBe(1);
        expect(west.entityDraws[0]).toMatchObject({ id: "w", humanoidType: "Doctor", animationIndex: 40, frameIndex: 0 });
    });

    it("renders fractional positions and frame steps without mutating simulation input", () => {
        const entities = [{ id: "moving", humanoidType: "nurse", position: { x: 1.5, y: 1 }, animationState: "walk", frameStep: 1 }];
        const before = JSON.stringify(entities);
        const frame = render(entities);
        expect(pixel(frame, 112, 101)).toEqual([0, 255, 0, 255]);
        expect(frame.entityDraws[0]).toMatchObject({ animationIndex: 1208, frameIndex: 1, screenX: 110, screenY: 99 });
        expect(JSON.stringify(entities)).toBe(before);
    });

    it("keeps nearer walls in front of humanoids and omits unsupported/offscreen entities", () => {
        const map = { contract: "theme-hospital-map.v1", width: 1, height: 2, tiles: [
            { ground: 0, northWall: 0, westWall: 0 }, { ground: 0, northWall: 1, westWall: 0 }
        ] };
        const frame = render([
            { id: "doctor", humanoidType: "doctor", position: { x: 0, y: 0 } },
            { id: "unknown", humanoidType: "unknown", position: { x: 0, y: 0 } },
            { id: "outside", humanoidType: "doctor", position: { x: 7, y: 7 } }
        ], { map, blockSheet: { sprites: [sprite(0, 0, []), sprite(128, 64, new Array(128 * 64).fill(2))] }, tileColumns: 1, tileRows: 2 });
        expect(pixel(frame, 96, 61)).toEqual([0, 255, 0, 255]);
        expect(frame.entityDraws.map((entity) => entity.id)).toEqual(["doctor"]);
    });

    it("advances long-running animation loops in bounded work", () => {
        const image = renderThemeHospitalAnimationFrame(animationSet, spriteSheet, palette, 0, { frameStep: 100_000_001 });
        expect(image.frameIndex).toBe(1);
    });

    const localRoot = new URL("../../../../GameData/Contents/Resources/game/DATA/", import.meta.url);
    const localTest = existsSync(new URL("VSPR-0.TAB", localRoot)) ? it : it.skip;
    localTest("renders real GoG patient and staff animations in all four directions", () => {
        const read = (path) => readFileSync(new URL(path, localRoot));
        const actualSheet = decodeThemeHospitalSpriteSheet(read("VSPR-0.TAB"), read("VSPR-0.DAT"));
        const actualPalette = decodeThemeHospitalPalette(read("MPALETTE.DAT"));
        const actualAnimations = decodeThemeHospitalAnimationSet(read("VSTART-1.ANI"), read("VFRA-1.ANI"), read("VLIST-1.ANI"), read("VELE-1.ANI"));
        for (const type of ["patient", "Standard Female Patient", "doctor", "nurse", "handyman", "receptionist"]) {
            for (const direction of ["north", "east", "south", "west"]) {
                for (const state of ["idle", "walk"]) {
                    const selected = resolveThemeHospitalHumanoidAnimation(type, { direction, state });
                    const image = renderThemeHospitalAnimationFrame(actualAnimations, actualSheet, actualPalette,
                        selected.animationIndex, { flags: selected.flags, layers: selected.layers, frameStep: 1 });
                    expect(image.elements.length, `${type} ${direction} ${state}`).toBeGreaterThan(0);
                    expect(image.width).toBeGreaterThan(4);
                    expect(image.height).toBeGreaterThan(4);
                    expect(image.pixels.some((value, index) => index % 4 === 3 && value > 0)).toBe(true);
                }
            }
        }
        const frame = render([{ id: "gog-doctor", role: "diagnostician", position: { x: 1, y: 1 } }], {
            spriteSheet: actualSheet, animationSet: actualAnimations, palette: actualPalette
        });
        expect(frame.stats.entitySpriteCount).toBe(1);
        expect(frame.entityDraws[0].humanoidType).toBe("Doctor");
    });
});
