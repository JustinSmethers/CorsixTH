import { decodeAssetImport, REQUIRED_ASSET_DIRECTORIES, REQUIRED_ASSET_FILES } from "../src/index";
function textBytes(value) {
    return new TextEncoder().encode(value);
}
function validEntries(prefix = "") {
    const scoped = (path) => (prefix.length > 0 ? `${prefix}/${path}` : path);
    return [
        { path: scoped("HOSPITAL.CFG"), bytes: textBytes("LANGUAGE=ENG\nMUSIC=ON\n") },
        { path: scoped("HOSPITAL.EXE"), bytes: textBytes("MZ-HEADER") },
        { path: scoped("DATA/ANIMS.DAT"), bytes: textBytes("anim-data") },
        { path: scoped("LEVELS/LEVEL01.LEV"), bytes: textBytes("level-data") },
        { path: scoped("QDATA/TEXT.DAT"), bytes: textBytes("qdata") }
    ];
}
describe("phase 8 asset import matrix", () => {
    it("accepts canonical import and emits a legality-safe transformed manifest", () => {
        const result = decodeAssetImport(validEntries());
        expect(result.status).toBe("ready");
        expect(result.manifest).toBeDefined();
        expect(result.manifest?.schemaVersion).toBe(1);
        expect(result.manifest?.contract).toBe("phase8.asset-import.v1");
        expect(result.manifest?.requiredDirectories).toEqual(REQUIRED_ASSET_DIRECTORIES);
        expect(result.manifest?.requiredFiles).toEqual(REQUIRED_ASSET_FILES);
        expect(result.manifest?.files).toHaveLength(5);
        expect(result.manifest?.files.every((file) => typeof file.checksum === "string" && file.checksum.length === 8)).toBe(true);
        expect(result.manifest?.config.settingKeys).toEqual(["LANGUAGE", "MUSIC"]);
        expect(result.diagnostics.some((diagnostic) => diagnostic.code === "ready")).toBe(true);
    });
    it("accepts a directory upload that includes one leading folder segment", () => {
        const result = decodeAssetImport(validEntries("Theme Hospital"));
        expect(result.status).toBe("ready");
        expect(result.manifest?.rootPrefix).toBe("Theme Hospital");
        expect(result.manifest?.files.map((file) => file.path)).toContain("HOSPITAL.CFG");
        expect(result.diagnostics.some((diagnostic) => diagnostic.code === "detected-root-prefix")).toBe(true);
    });
    it("fails with actionable diagnostics for missing required assets", () => {
        const result = decodeAssetImport([
            { path: "HOSPITAL.CFG", bytes: textBytes("LANGUAGE=ENG\nMUSIC=ON\n") },
            { path: "DATA/ANIMS.DAT", bytes: textBytes("anim-data") },
            { path: "LEVELS/LEVEL01.LEV", bytes: textBytes("level-data") }
        ]);
        expect(result.status).toBe("invalid");
        expect(result.manifest).toBeUndefined();
        expect(result.diagnostics.some((diagnostic) => diagnostic.code === "missing-required-file")).toBe(true);
        expect(result.diagnostics.some((diagnostic) => diagnostic.code === "missing-required-directory")).toBe(true);
        expect(result.diagnostics.some((diagnostic) => (diagnostic.hint ?? "").includes("HOSPITAL.EXE"))).toBe(true);
        expect(result.diagnostics.some((diagnostic) => (diagnostic.hint ?? "").includes("QDATA"))).toBe(true);
    });
    it("fails invalid traversal paths", () => {
        const result = decodeAssetImport([
            ...validEntries().slice(1),
            { path: "../HOSPITAL.CFG", bytes: textBytes("LANGUAGE=ENG\nMUSIC=ON\n") }
        ]);
        expect(result.status).toBe("invalid");
        expect(result.diagnostics.some((diagnostic) => diagnostic.code === "invalid-path")).toBe(true);
    });
    it("fails duplicate case-insensitive file paths", () => {
        const result = decodeAssetImport([
            ...validEntries(),
            { path: "data/anims.dat", bytes: textBytes("duplicate") }
        ]);
        expect(result.status).toBe("invalid");
        expect(result.diagnostics.some((diagnostic) => diagnostic.code === "duplicate-file")).toBe(true);
    });
    it("fails empty required files", () => {
        const result = decodeAssetImport([
            { path: "HOSPITAL.CFG", bytes: new Uint8Array() },
            ...validEntries().filter((entry) => entry.path !== "HOSPITAL.CFG")
        ]);
        expect(result.status).toBe("invalid");
        expect(result.diagnostics.some((diagnostic) => diagnostic.code === "empty-required-file")).toBe(true);
    });
});
