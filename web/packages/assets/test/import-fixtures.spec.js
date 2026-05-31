import fixture from "./fixtures/phase8-import-variants.json";
import { decodeAssetImport } from "../src/index";
function toInput(entries) {
    return entries.map((entry) => ({
        path: entry.path,
        bytes: new TextEncoder().encode(entry.text)
    }));
}
describe("phase 8 import fixtures", () => {
    const variants = fixture.variants;
    for (const variant of variants) {
        it(`validates fixture ${variant.id}`, () => {
            const result = decodeAssetImport(toInput(variant.entries));
            const codes = new Set(result.diagnostics.map((diagnostic) => diagnostic.code));
            expect(result.status).toBe(variant.expectedStatus);
            for (const code of variant.expectedCodes) {
                expect(codes.has(code)).toBe(true);
            }
        });
    }
});
