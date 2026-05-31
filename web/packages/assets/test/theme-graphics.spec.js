import { existsSync, readFileSync } from "node:fs";
import {
    decodeThemeHospitalAnimationSet,
    decodeThemeHospitalPalette,
    decodeThemeHospitalSpriteSheet,
    findFirstRenderableThemeHospitalAnimation,
    findFirstVisibleThemeHospitalSprite,
    renderThemeHospitalAnimationFrame,
    renderThemeHospitalMapScene,
    renderThemeHospitalSprite
} from "../src/index";

function fixturePaletteBytes() {
    const bytes = new Uint8Array(256 * 3);
    bytes[1 * 3] = 63;
    bytes[2 * 3 + 1] = 63;
    bytes[255 * 3] = 63;
    bytes[255 * 3 + 2] = 63;
    return bytes;
}

function spriteTableRecord(position, width, height) {
    return new Uint8Array([
        position & 0xff,
        (position >> 8) & 0xff,
        (position >> 16) & 0xff,
        (position >> 24) & 0xff,
        width,
        height
    ]);
}

function syntheticAnimationFiles() {
    return {
        start: new Uint8Array([0, 0, 0, 0]),
        frame: new Uint8Array([0, 0, 0, 0, 0, 0, 0, 0, 0, 0]),
        list: new Uint8Array([0, 0, 0xff, 0xff]),
        element: new Uint8Array([0, 0, 141, 186, 0, 0])
    };
}

function syntheticTwoFrameAnimationFiles() {
    return {
        start: new Uint8Array([0, 0, 0, 0]),
        frame: new Uint8Array([
            0, 0, 0, 0, 0, 0, 0, 0, 1, 0,
            2, 0, 0, 0, 0, 0, 0, 0, 0, 0
        ]),
        list: new Uint8Array([0, 0, 0xff, 0xff, 1, 0, 0xff, 0xff]),
        element: new Uint8Array([0, 0, 141, 186, 0, 0, 6, 0, 141, 186, 0, 0])
    };
}

function decodedMapFixture() {
    return {
        contract: "theme-hospital-map.v1",
        width: 2,
        height: 2,
        tileCount: 4,
        playerCount: 1,
        parcelCount: 1,
        cameras: [{ x: 0, y: 0 }],
        heliports: [{ x: 0, y: 0 }],
        parcels: [{ id: 1, tileCount: 4 }],
        objects: [],
        stats: {
            passableTileCount: 4,
            hospitalTileCount: 4,
            buildableTileCount: 4,
            objectCount: 0
        },
        tiles: [
            { x: 0, y: 0, ground: 1, northWall: 0, westWall: 0, objectType: 0 },
            { x: 1, y: 0, ground: 2, northWall: 0, westWall: 0 },
            { x: 0, y: 1, ground: 1, northWall: 0, westWall: 0 },
            { x: 1, y: 1, ground: 2, northWall: 0, westWall: 0, objectType: 1 }
        ]
    };
}

describe("Theme Hospital graphics decoder", () => {
    it("decodes 6-bit palettes into browser RGBA colors", () => {
        const palette = decodeThemeHospitalPalette(fixturePaletteBytes());
        expect(palette.contract).toBe("theme-hospital-palette.v1");
        expect([...palette.colors.slice(4, 8)]).toEqual([255, 0, 0, 255]);
        expect([...palette.colors.slice(8, 12)]).toEqual([0, 255, 0, 255]);
        expect(palette.colors[255 * 4 + 3]).toBe(0);
    });
    it("decodes simple chunk sprite sheets and renders palette pixels", () => {
        const sheet = decodeThemeHospitalSpriteSheet(spriteTableRecord(0, 4, 2), new Uint8Array([2, 1, 2, 0, 4, 2, 1, 2, 1]));
        expect(sheet.spriteCount).toBe(1);
        expect([...sheet.sprites[0].indices]).toEqual([1, 2, 255, 255, 2, 1, 2, 1]);
        const palette = decodeThemeHospitalPalette(fixturePaletteBytes());
        const visible = findFirstVisibleThemeHospitalSprite(sheet, palette);
        expect(visible?.index).toBe(0);
        const image = renderThemeHospitalSprite(visible, palette);
        expect(image.width).toBe(4);
        expect(image.height).toBe(2);
        expect([...image.pixels.slice(0, 8)]).toEqual([255, 0, 0, 255, 0, 255, 0, 255]);
        expect(image.pixels[2 * 4 + 3]).toBe(0);
    });
    it("decodes animation metadata and composes a frame from sprite elements", () => {
        const animationFiles = syntheticAnimationFiles();
        const animations = decodeThemeHospitalAnimationSet(animationFiles.start, animationFiles.frame, animationFiles.list, animationFiles.element);
        const sheet = decodeThemeHospitalSpriteSheet(spriteTableRecord(0, 4, 2), new Uint8Array([2, 1, 2, 0, 4, 2, 1, 2, 1]));
        const palette = decodeThemeHospitalPalette(fixturePaletteBytes());
        expect(animations.animationCount).toBe(1);
        expect(animations.frameCount).toBe(1);
        expect(animations.elementCount).toBe(1);
        expect(findFirstRenderableThemeHospitalAnimation(animations, sheet, palette)).toBe(0);
        const image = renderThemeHospitalAnimationFrame(animations, sheet, palette, 0);
        expect(image.width).toBeGreaterThanOrEqual(4);
        expect(image.height).toBeGreaterThanOrEqual(2);
        expect(image.pixels.some((value, index) => index % 4 === 3 && value !== 0)).toBe(true);
    });
    it("advances animation frames through decoded next-frame links", () => {
        const animationFiles = syntheticTwoFrameAnimationFiles();
        const animations = decodeThemeHospitalAnimationSet(animationFiles.start, animationFiles.frame, animationFiles.list, animationFiles.element);
        const sheet = decodeThemeHospitalSpriteSheet(new Uint8Array([
            ...spriteTableRecord(0, 4, 2),
            ...spriteTableRecord(0, 4, 2)
        ]), new Uint8Array([2, 1, 2, 0, 4, 2, 1, 2, 1]));
        const palette = decodeThemeHospitalPalette(fixturePaletteBytes());
        expect(renderThemeHospitalAnimationFrame(animations, sheet, palette, 0).frameIndex).toBe(0);
        expect(renderThemeHospitalAnimationFrame(animations, sheet, palette, 0, { frameStep: 1 }).frameIndex).toBe(1);
        expect(renderThemeHospitalAnimationFrame(animations, sheet, palette, 0, { frameStep: 2 }).frameIndex).toBe(0);
    });
    it("composes block sprites and animation metadata into one map scene", () => {
        const palette = decodeThemeHospitalPalette(fixturePaletteBytes());
        const blockSheet = decodeThemeHospitalSpriteSheet(new Uint8Array([
            ...spriteTableRecord(0, 0, 0),
            ...spriteTableRecord(0, 4, 2),
            ...spriteTableRecord(0, 4, 2)
        ]), new Uint8Array([2, 1, 2, 0, 4, 2, 1, 2, 1]));
        const spriteSheet = decodeThemeHospitalSpriteSheet(new Uint8Array([
            ...spriteTableRecord(0, 4, 2),
            ...spriteTableRecord(0, 4, 2)
        ]), new Uint8Array([2, 1, 2, 0, 4, 2, 1, 2, 1]));
        const animationFiles = syntheticAnimationFiles();
        const animations = decodeThemeHospitalAnimationSet(animationFiles.start, animationFiles.frame, animationFiles.list, animationFiles.element);
        const scene = renderThemeHospitalMapScene({
            map: decodedMapFixture(),
            blockSheet,
            spriteSheet,
            animationSet: animations,
            palette,
            viewportWidth: 160,
            viewportHeight: 120,
            originX: 64,
            originY: 16,
            tileColumns: 2,
            tileRows: 2
        });
        expect(scene.contract).toBe("theme-hospital-map-scene.v1");
        expect(scene.stats.floorSpriteCount).toBe(4);
        expect(scene.stats.objectSpriteCount).toBe(1);
        expect(scene.stats.animation?.animationIndex).toBe(0);
        expect(scene.pixels.some((value, index) => index % 4 === 3 && value !== 0)).toBe(true);
    });
    it("uses the scene animation frame step for imported map animation overlays", () => {
        const palette = decodeThemeHospitalPalette(fixturePaletteBytes());
        const blockSheet = decodeThemeHospitalSpriteSheet(new Uint8Array([
            ...spriteTableRecord(0, 0, 0),
            ...spriteTableRecord(0, 4, 2),
            ...spriteTableRecord(0, 4, 2)
        ]), new Uint8Array([2, 1, 2, 0, 4, 2, 1, 2, 1]));
        const spriteSheet = decodeThemeHospitalSpriteSheet(new Uint8Array([
            ...spriteTableRecord(0, 4, 2),
            ...spriteTableRecord(0, 4, 2)
        ]), new Uint8Array([2, 1, 2, 0, 4, 2, 1, 2, 1]));
        const animationFiles = syntheticTwoFrameAnimationFiles();
        const animations = decodeThemeHospitalAnimationSet(animationFiles.start, animationFiles.frame, animationFiles.list, animationFiles.element);
        const scene = renderThemeHospitalMapScene({
            map: decodedMapFixture(),
            blockSheet,
            spriteSheet,
            animationSet: animations,
            palette,
            viewportWidth: 160,
            viewportHeight: 120,
            originX: 64,
            originY: 16,
            tileColumns: 2,
            tileRows: 2,
            animationFrameStep: 1
        });
        expect(scene.stats.animation?.frameIndex).toBe(1);
    });
    it("honors decoded map object flip flags in the original scene renderer", () => {
        const palette = decodeThemeHospitalPalette(fixturePaletteBytes());
        const blockSheet = decodeThemeHospitalSpriteSheet(new Uint8Array([
            ...spriteTableRecord(0, 0, 0),
            ...spriteTableRecord(0, 0, 0),
            ...spriteTableRecord(0, 0, 0)
        ]), new Uint8Array());
        const spriteSheet = decodeThemeHospitalSpriteSheet(new Uint8Array([
            ...spriteTableRecord(0, 0, 0),
            ...spriteTableRecord(0, 4, 2)
        ]), new Uint8Array([2, 1, 2, 0, 4, 2, 1, 2, 1]));
        const map = decodedMapFixture();
        map.tiles = map.tiles.map((tile) => ({ ...tile, ground: 0, objectType: 0, objectFlags: 0 }));
        map.tiles[0] = { ...map.tiles[0], objectType: 1, objectFlags: 1 };
        const scene = renderThemeHospitalMapScene({
            map,
            blockSheet,
            spriteSheet,
            palette,
            viewportWidth: 80,
            viewportHeight: 60,
            originX: 40,
            originY: 16,
            tileColumns: 1,
            tileRows: 1
        });
        const flippedGreenPixel = ((30 * scene.width) + 40) * 4;
        expect([...scene.pixels.slice(flippedGreenPixel, flippedGreenPixel + 4)]).toEqual([0, 255, 0, 255]);
        expect(scene.stats.objectSpriteCount).toBe(1);
    });
    const localDataRoot = new URL("../../../../GameData/Contents/Resources/game/DATA/", import.meta.url);
    const itWithLocalGameData = existsSync(new URL("VSPR-0.TAB", localDataRoot)) ? it : it.skip;
    itWithLocalGameData("decodes the local original VSPR sprite table", () => {
        const palette = decodeThemeHospitalPalette(readFileSync(new URL("MPALETTE.DAT", localDataRoot)));
        const sheet = decodeThemeHospitalSpriteSheet(readFileSync(new URL("VSPR-0.TAB", localDataRoot)), readFileSync(new URL("VSPR-0.DAT", localDataRoot)));
        expect(sheet.spriteCount).toBeGreaterThan(1000);
        const visible = findFirstVisibleThemeHospitalSprite(sheet, palette);
        expect(visible).not.toBeNull();
        const image = renderThemeHospitalSprite(visible, palette);
        expect(image.pixels.some((value, index) => index % 4 === 3 && value !== 0)).toBe(true);
    });
    itWithLocalGameData("decodes the local original animation files and composes a real animation frame", () => {
        const palette = decodeThemeHospitalPalette(readFileSync(new URL("MPALETTE.DAT", localDataRoot)));
        const sheet = decodeThemeHospitalSpriteSheet(readFileSync(new URL("VSPR-0.TAB", localDataRoot)), readFileSync(new URL("VSPR-0.DAT", localDataRoot)));
        const animations = decodeThemeHospitalAnimationSet(readFileSync(new URL("VSTART-1.ANI", localDataRoot)), readFileSync(new URL("VFRA-1.ANI", localDataRoot)), readFileSync(new URL("VLIST-1.ANI", localDataRoot)), readFileSync(new URL("VELE-1.ANI", localDataRoot)));
        expect(animations.animationCount).toBeGreaterThan(1000);
        expect(animations.frameCount).toBeGreaterThan(1000);
        expect(animations.elementCount).toBeGreaterThan(1000);
        const animationIndex = findFirstRenderableThemeHospitalAnimation(animations, sheet, palette);
        expect(animationIndex).not.toBeNull();
        const image = renderThemeHospitalAnimationFrame(animations, sheet, palette, animationIndex);
        expect(image.width).toBeGreaterThan(1);
        expect(image.height).toBeGreaterThan(1);
        expect(image.pixels.some((value, index) => index % 4 === 3 && value !== 0)).toBe(true);
    });
});
