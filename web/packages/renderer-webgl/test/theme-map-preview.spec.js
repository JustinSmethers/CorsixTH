import {
    buildDeterministicScene,
    buildThemeHospitalMapPreviewInput,
    createThemeHospitalMapPreviewAtlas,
    renderSceneToFrame
} from "../src/index";

function decodedMapFixture() {
    return {
        contract: "theme-hospital-map.v1",
        width: 3,
        height: 2,
        tileCount: 6,
        playerCount: 1,
        parcelCount: 1,
        cameras: [{ x: 0, y: 0 }],
        heliports: [{ x: 0, y: 0 }],
        parcels: [{ id: 1, tileCount: 6 }],
        objects: [{ x: 1, y: 1, type: 11, flags: 0 }],
        stats: {
            passableTileCount: 5,
            hospitalTileCount: 4,
            buildableTileCount: 2,
            objectCount: 1
        },
        tiles: [
            { x: 0, y: 0, northWall: 0, westWall: 0, flags: { passable: true, hospital: false, buildable: false } },
            { x: 1, y: 0, northWall: 0, westWall: 0, flags: { passable: true, hospital: true, buildable: true } },
            { x: 2, y: 0, northWall: 7, westWall: 0, flags: { passable: true, hospital: true, buildable: false } },
            { x: 0, y: 1, northWall: 0, westWall: 0, flags: { passable: false, hospital: false, buildable: false } },
            { x: 1, y: 1, northWall: 0, westWall: 0, flags: { passable: true, hospital: true, buildable: true } },
            { x: 2, y: 1, northWall: 0, westWall: 0, flags: { passable: true, hospital: true, buildable: false } }
        ]
    };
}
describe("Theme Hospital map preview scene", () => {
    it("maps decoded TH tiles and objects into renderer commands", () => {
        const input = buildThemeHospitalMapPreviewInput(decodedMapFixture(), {
            atlas: createThemeHospitalMapPreviewAtlas(),
            viewportWidth: 6,
            viewportHeight: 4,
            tileSize: 2
        });
        expect(input.tiles).toEqual([
            ["outside", "buildable", "wall"],
            ["blocked", "buildable", "hospital"]
        ]);
        const scene = buildDeterministicScene(input);
        expect(scene.commands.some((command) => command.id === "object:0:1:1")).toBe(true);
        const frame = renderSceneToFrame(input);
        expect(frame.pixels.some((value) => value !== 0)).toBe(true);
    });
});
