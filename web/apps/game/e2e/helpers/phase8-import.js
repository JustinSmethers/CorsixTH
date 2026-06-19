import { expect } from "@playwright/test";
const fixturesRoot = "apps/game/e2e/fixtures";
const validFixtureDirectory = `${fixturesRoot}/phase8-valid`;
export async function importAssetsAndEnterPlayableShell(page) {
    await page.goto("/");
    await expect(page.getByRole("heading", { name: "Phase 8 Asset Import" })).toBeVisible();
    await page.getByTestId("asset-import-picker").setInputFiles(validFixtureDirectory);
    await expect(page.getByTestId("asset-import-status")).toHaveText("Ready to import. Diagnostics are clear.");
    await page.getByTestId("asset-import-confirm").click();
    await expect(page.getByRole("heading", { name: "CorsixTH Browser Hospital" })).toBeVisible();
}
export function phase8FixtureDirectory(relativePath) {
    return `${fixturesRoot}/${relativePath}`;
}
export async function expectCanvasNonBlank(page, testId, { mode = "alpha" } = {}) {
    await expect(page.getByTestId(testId)).toBeVisible();
    await expect
        .poll(async () => page.getByTestId(testId).evaluate((canvas, checkMode) => {
        const context = canvas.getContext("2d");
        if (!context) {
            return false;
        }
        const pixels = context.getImageData(0, 0, canvas.width, canvas.height).data;
        for (let index = 0; index < pixels.length; index += 4) {
            if (checkMode === "rgb") {
                if (pixels[index] !== 0 || pixels[index + 1] !== 0 || pixels[index + 2] !== 0) {
                    return true;
                }
            }
            else if (pixels[index + 3] !== 0) {
                return true;
            }
        }
        return false;
    }, mode))
        .toBe(true);
}
