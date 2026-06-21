import { createAssetBundle, decodeThemeHospitalLanguageEntries, hasAssetFile, readAssetBytes, readAssetText, validateAssetPath } from "../src/index";

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

describe("assets scaffold", () => {
    it("validates non-empty paths", () => {
        expect(validateAssetPath("/tmp/theme").valid).toBe(true);
        expect(validateAssetPath("").valid).toBe(false);
    });
    it("creates an addressable runtime bundle from imported game files", () => {
        const result = createAssetBundle([
            { path: "Hospital/DATA/SAMPLE.DAT", bytes: new Uint8Array([1, 2, 3]) },
            { path: "Hospital/LEVELS/LEVEL01.LEV", bytes: new TextEncoder().encode("level") },
            { path: "Hospital/QDATA/QUEUE.DAT", bytes: new Uint8Array([4]) },
            { path: "Hospital/HOSPITAL.CFG", bytes: new TextEncoder().encode("INSTALL_PATH=C:\\HOSPITAL\n") },
            { path: "Hospital/HOSPITAL.EXE", bytes: new Uint8Array([5, 6]) }
        ]);
        expect(result.status).toBe("ready");
        expect(result.bundle?.contract).toBe("phase8.asset-bundle.v1");
        expect(result.manifest?.importedFileCount).toBe(5);
        expect(hasAssetFile(result.bundle, "data/sample.dat")).toBe(true);
        expect(readAssetBytes(result.bundle, "DATA/SAMPLE.DAT")).toEqual(new Uint8Array([1, 2, 3]));
        expect(readAssetText(result.bundle, "hospital.cfg")).toContain("INSTALL_PATH");
    });
    it("summarizes QDATA sprite sheets from original UI table/data pairs", () => {
        const result = createAssetBundle([
            { path: "Hospital/DATA/SAMPLE.DAT", bytes: new Uint8Array([1, 2, 3]) },
            { path: "Hospital/LEVELS/LEVEL01.LEV", bytes: new TextEncoder().encode("level") },
            {
                path: "Hospital/QDATA/FONT00V.TAB",
                bytes: new Uint8Array([
                    ...spriteTableRecord(0, 4, 2),
                    ...spriteTableRecord(0, 0, 0)
                ])
            },
            {
                path: "Hospital/QDATA/FONT00V.DAT",
                bytes: new Uint8Array([2, 1, 2, 0, 4, 2, 1, 2, 1])
            },
            { path: "Hospital/HOSPITAL.CFG", bytes: new TextEncoder().encode("INSTALL_PATH=C:\\HOSPITAL\n") },
            { path: "Hospital/HOSPITAL.EXE", bytes: new Uint8Array([5, 6]) }
        ]);
        expect(result.status).toBe("ready");
        expect(result.manifest?.qDataSpriteSheets).toEqual([
            {
                path: "QDATA/FONT00V",
                spriteCount: 2,
                visibleSpriteCount: 1,
                firstVisibleSprite: {
                    index: 0,
                    width: 4,
                    height: 2
                }
            }
        ]);
    });
    it("summarizes original DATA UI sprite sheets from known table/data pairs", () => {
        const result = createAssetBundle([
            { path: "Hospital/DATA/SAMPLE.DAT", bytes: new Uint8Array([1, 2, 3]) },
            { path: "Hospital/LEVELS/LEVEL01.LEV", bytes: new TextEncoder().encode("level") },
            {
                path: "Hospital/DATA/PANEL02V.TAB",
                bytes: new Uint8Array([
                    ...spriteTableRecord(0, 4, 2),
                    ...spriteTableRecord(0, 0, 0)
                ])
            },
            {
                path: "Hospital/DATA/PANEL02V.DAT",
                bytes: new Uint8Array([2, 1, 2, 0, 4, 2, 1, 2, 1])
            },
            { path: "Hospital/QDATA/QUEUE.DAT", bytes: new Uint8Array([4]) },
            { path: "Hospital/HOSPITAL.CFG", bytes: new TextEncoder().encode("INSTALL_PATH=C:\\HOSPITAL\n") },
            { path: "Hospital/HOSPITAL.EXE", bytes: new Uint8Array([5, 6]) }
        ]);
        expect(result.status).toBe("ready");
        expect(result.manifest?.uiSpriteSheets).toEqual([
            {
                path: "DATA/PANEL02V",
                spriteCount: 2,
                visibleSpriteCount: 1,
                firstVisibleSprite: {
                    index: 0,
                    width: 4,
                    height: 2
                }
            }
        ]);
    });
    it("decodes original language strings and summarizes disease names", () => {
        const languageEntries = Array.from({ length: 116 }, (_, index) => `entry-${index}`);
        languageEntries[0] = "Nurse";
        languageEntries[1] = "Doctor";
        languageEntries[2] = "Handyman";
        languageEntries[3] = "Receptionist";
        languageEntries[101] = "Bloaty Head";
        languageEntries[115] = "Uncommon Cold";
        languageEntries[453] = "GP's Office";
        languageEntries[454] = "Psychiatry";
        languageEntries[455] = "Ward";
        languageEntries[457] = "Pharmacy";
        languageEntries[463] = "Inflation Room";
        languageEntries[465] = "Operating Theatre";
        languageEntries[466] = "Slack Tongue Clinic";
        languageEntries[468] = "Electrolysis";
        languageEntries[469] = "Jelly Vat";
        languageEntries[476] = "Decontamination";
        languageEntries[2488] = "Queuing for %s";
        languageEntries[2489] = "On my way to %s";
        languageEntries[2490] = "Cured!";
        const languageBytes = new TextEncoder().encode(`\0\0${languageEntries.join("\0")}\0`);
        expect(decodeThemeHospitalLanguageEntries(languageBytes).slice(0, 4)).toEqual(["Nurse", "Doctor", "Handyman", "Receptionist"]);
        const result = createAssetBundle([
            { path: "Hospital/DATA/LANG-0.DAT", bytes: languageBytes },
            { path: "Hospital/DATA/SAMPLE.DAT", bytes: new Uint8Array([1, 2, 3]) },
            { path: "Hospital/LEVELS/LEVEL01.LEV", bytes: new TextEncoder().encode("level") },
            { path: "Hospital/QDATA/QUEUE.DAT", bytes: new Uint8Array([4]) },
            { path: "Hospital/HOSPITAL.CFG", bytes: new TextEncoder().encode("INSTALL_PATH=C:\\HOSPITAL\n") },
            { path: "Hospital/HOSPITAL.EXE", bytes: new Uint8Array([5, 6]) }
        ]);
        expect(result.status).toBe("ready");
        expect(result.manifest?.languageSummary).toMatchObject({
            path: "DATA/LANG-0.DAT",
            staffRoles: {
                nurse: "Nurse",
                doctor: "Doctor",
                handyman: "Handyman",
                receptionist: "Receptionist"
            },
            objectNames: {
                0: "Nurse",
                1: "Doctor"
            },
            roomNames: {
                diagnosis: "GP's Office",
                treatment: "Ward",
                pharmacy: "Pharmacy",
                "operating-theatre": "Operating Theatre",
                specialist: "Specialist",
                psychiatry: "Psychiatry",
                "inflation-room": "Inflation Room",
                "slack-tongue-clinic": "Slack Tongue Clinic",
                electrolysis: "Electrolysis",
                "jelly-vat": "Jelly Vat",
                decontamination: "Decontamination"
            },
            patientStatusNames: {
                queued: "Queuing for %s",
                "walking-to-diagnosis": "On my way to %s",
                discharged: "Cured!"
            },
            diseaseNames: {
                "cranial-pressure": "Bloaty Head",
                "mild-cold": "Uncommon Cold"
            }
        });
    });
    it("detects the game-data root inside wrapped installer folders", () => {
        const result = createAssetBundle([
            { path: "GameData/Contents/Info.plist", bytes: new TextEncoder().encode("wrapper") },
            { path: "GameData/Contents/Resources/game/DATA/SAMPLE.DAT", bytes: new Uint8Array([1]) },
            { path: "GameData/Contents/Resources/game/LEVELS/FULL00.SAM", bytes: new TextEncoder().encode("level") },
            { path: "GameData/Contents/Resources/game/QDATA/TEXT.DAT", bytes: new Uint8Array([2]) },
            { path: "GameData/Contents/Resources/game/HOSPITAL.CFG", bytes: new TextEncoder().encode("INSTALL_PATH=C:\\HOSPITAL\n") },
            { path: "GameData/Contents/Resources/game/HOSPITAL.EXE", bytes: new Uint8Array([0x4d, 0x5a]) }
        ]);
        expect(result.status).toBe("ready");
        expect(result.manifest?.rootPrefix).toBe("GameData/Contents/Resources/game");
        expect(result.manifest?.importedFileCount).toBe(5);
        expect(result.diagnostics.some((diagnostic) => diagnostic.code === "ignored-outside-root")).toBe(true);
        expect(hasAssetFile(result.bundle, "DATA/SAMPLE.DAT")).toBe(true);
        expect(hasAssetFile(result.bundle, "Contents/Info.plist")).toBe(false);
    });
});
