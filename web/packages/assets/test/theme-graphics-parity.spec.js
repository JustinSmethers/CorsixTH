import { existsSync, readFileSync } from "node:fs";
import {
    decodeThemeHospitalAnimationSet,
    decodeThemeHospitalMap,
    decodeThemeHospitalPalette,
    decodeThemeHospitalSpriteSheet,
    renderThemeHospitalAnimationFrame,
    renderThemeHospitalMapScene
} from "../src/index.js";

const sprite = (width, height, indices) => ({
    width, height,
    indices: indices instanceof Array ? new Uint8Array(indices) : new Uint8Array(width * height).fill(indices)
});
const palette = { colors: new Uint8ClampedArray(1024) };
palette.colors.set([255, 0, 0, 255], 4);
palette.colors.set([0, 255, 0, 255], 8);
palette.colors.set([0, 0, 255, 255], 12);
const pixel = (image, x, y) => [...image.pixels.slice((y * image.width + x) * 4, (y * image.width + x) * 4 + 4)];
const tile = (changes = {}) => ({ ground: 1, northWall: 0, westWall: 0, objectType: 0, objectFlags: 0, ...changes });
function scene(tiles, changes = {}) {
    return renderThemeHospitalMapScene({
        map: { contract: "theme-hospital-map.v1", width: 1, height: tiles.length, tiles },
        blockSheet: { sprites: [sprite(0, 0, 0), sprite(64, 32, 1), sprite(64, 32, 2)] },
        palette,
        viewportWidth: 100, viewportHeight: 100,
        originX: 40, originY: 8,
        tileColumns: 1, tileRows: tiles.length,
        ...changes
    });
}
function doorAnimations() {
    const firstFrames = new Array(319).fill(0);
    firstFrames[318] = 1;
    firstFrames[312] = 1;
    return {
        animationCount: 319,
        firstFrames,
        frames: [{ listIndex: 0, nextFrame: 1 }, { listIndex: 2, nextFrame: 0 }],
        elementList: [0, 0xffff, 1, 0xffff],
        elements: [
            { spriteIndex: 0, x: -2, y: -3, layer: 0, layerId: 0, flags: 0 },
            { spriteIndex: 1, x: -2, y: -3, layer: 0, layerId: 0, flags: 0 }
        ]
    };
}

describe("Original Theme Hospital rendering parity", () => {
    it("aligns a 64px floor and its walls to the same native tile anchor", () => {
        const image = scene([tile()]);
        expect(pixel(image, 8, 8)).toEqual([255, 0, 0, 255]);
        expect(pixel(image, 71, 39)).toEqual([255, 0, 0, 255]);
        expect(pixel(image, 72, 39)).toEqual([0, 0, 0, 0]);
    });

    it("honors packed block horizontal flips and 75-percent transparency", () => {
        const flipped = scene([tile({ ground: 1 | (1 << 8) })], {
            blockSheet: { sprites: [sprite(0, 0, 0), sprite(2, 1, [1, 2])] }
        });
        expect(pixel(flipped, 8, 39)).toEqual([0, 255, 0, 255]);
        expect(pixel(flipped, 9, 39)).toEqual([255, 0, 0, 255]);
        const translucent = scene([tile({ northWall: 2 | (8 << 8) })]);
        expect(pixel(translucent, 8, 8)).toEqual([191, 64, 0, 255]);
        const hidden = scene([tile({ northWall: 2 | (12 << 8) })]);
        expect(pixel(hidden, 8, 8)).toEqual([255, 0, 0, 255]);
    });

    it("lets a nearer wall cover an object on an earlier scanline", () => {
        const image = scene([tile({ ground: 0, objectType: 1 }), tile({ ground: 0, northWall: 2 })], {
            blockSheet: { sprites: [sprite(0, 0, 0), sprite(0, 0, 0), sprite(64, 64, 2)] },
            spriteSheet: { sprites: [sprite(0, 0, 0), sprite(4, 20, 1)] }
        });
        expect(pixel(image, 38, 8)).toEqual([0, 255, 0, 255]);
    });

    it.each([58, 59])("renders THOB %i entrance doors by native animation and map orientation", (objectType) => {
        const spriteSheet = { sprites: [sprite(4, 4, 1), sprite(4, 4, 2)] };
        const animationSet = doorAnimations();
        const north = scene([tile({ ground: 0, objectType })], { spriteSheet, animationSet });
        const west = scene([tile({ ground: 0, objectType, objectFlags: 1 })], { spriteSheet, animationSet });
        expect(pixel(north, 38, 5)).toEqual([255, 0, 0, 255]);
        expect(pixel(west, 38, 5)).toEqual([0, 255, 0, 255]);
        expect(north.stats.objectSpriteCount).toBe(1);
        expect(north.stats.animation).toBeNull();
        // Door idle frames remain closed until occupant logic opens them.
        expect(pixel(scene([tile({ ground: 0, objectType })], {
            spriteSheet, animationSet, animationFrameStep: 5
        }), 38, 5)).toEqual([255, 0, 0, 255]);
    });

    it("selects animation appearance layers and retains the native draw origin", () => {
        const animationSet = doorAnimations();
        animationSet.elementList = [0, 1, 2, 0xffff];
        animationSet.elements = [
            { spriteIndex: 0, x: -2, y: -3, layer: 0, layerId: 0, flags: 0 },
            { spriteIndex: 1, x: -2, y: -3, layer: 5, layerId: 1, flags: 0 },
            { spriteIndex: 2, x: -2, y: -3, layer: 5, layerId: 2, flags: 0 }
        ];
        const sheet = { sprites: [sprite(4, 4, 1), sprite(4, 4, 2), sprite(4, 4, 3)] };
        const image = renderThemeHospitalAnimationFrame(animationSet, sheet, palette, 0, { layers: { 5: 1 } });
        expect(image.elements.map((element) => element.layerId)).toEqual([0, 1]);
        expect(pixel(image, 2, 2)).toEqual([0, 255, 0, 255]);
        expect([image.originX, image.originY]).toEqual([4, 5]);
        // Native doctor animations also use the W1 head for a selected W2 head.
        expect(renderThemeHospitalAnimationFrame(animationSet, sheet, palette, 0, {
            layers: { 5: 5 }
        }).elements.map((element) => element.layerId)).toEqual([0, 1]);
    });

    const localRoot = new URL("../../../../GameData/Contents/Resources/game/", import.meta.url);
    const localTest = existsSync(new URL("DATA/VSPR-0.TAB", localRoot)) ? it : it.skip;
    localTest("renders both real GoG entrance halves without a phantom preview entity", () => {
        const read = (path) => readFileSync(new URL(path, localRoot));
        const map = decodeThemeHospitalMap(read("LEVELS/LEVEL.L1"), { includeTiles: true });
        const localPalette = decodeThemeHospitalPalette(read("DATA/MPALETTE.DAT"));
        const blockSheet = decodeThemeHospitalSpriteSheet(read("DATA/VBLK-0.TAB"), read("DATA/VBLK-0.DAT"));
        const spriteSheet = decodeThemeHospitalSpriteSheet(read("DATA/VSPR-0.TAB"), read("DATA/VSPR-0.DAT"));
        const animationSet = decodeThemeHospitalAnimationSet(read("DATA/VSTART-1.ANI"), read("DATA/VFRA-1.ANI"), read("DATA/VLIST-1.ANI"), read("DATA/VELE-1.ANI"));
        const doors = map.tiles.filter((value) => value.objectType === 58 || value.objectType === 59);
        expect(doors.length).toBeGreaterThanOrEqual(2);
        for (const door of doors) {
            const image = renderThemeHospitalMapScene({
                map, blockSheet, spriteSheet, animationSet, palette: localPalette,
                viewportWidth: 160, viewportHeight: 140, originX: 80, originY: 90,
                startX: door.x, startY: door.y, tileColumns: 1, tileRows: 1
            });
            expect(image.stats.objectSpriteCount).toBe(1);
            expect(image.stats.animation).toBeNull();
            expect(image.pixels.some((value, index) => index % 4 === 3 && value > 0)).toBe(true);
        }
    });
});
