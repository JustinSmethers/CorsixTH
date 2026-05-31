import { expect, test } from "@playwright/test";
import { phase8FixtureDirectory } from "./helpers/phase8-import";
const invalidFixtureDirectory = phase8FixtureDirectory("phase8-missing-exe");
const validFixtureDirectory = phase8FixtureDirectory("phase8-valid");
test("phase 8 first-time journey: import diagnostics guide fixes and successful import reaches playable state", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("heading", { name: "Phase 8 Asset Import" })).toBeVisible();
    await page.getByTestId("asset-import-picker").setInputFiles(invalidFixtureDirectory);
    await expect(page.getByTestId("asset-import-status")).toContainText("Import blocked");
    await expect(page.getByTestId("asset-import-diagnostics")).toContainText("Missing required file \"HOSPITAL.EXE\"");
    await page.getByTestId("asset-import-picker").setInputFiles(validFixtureDirectory);
    await expect(page.getByTestId("asset-import-status")).toHaveText("Ready to import. Diagnostics are clear.");
    await page.getByTestId("asset-import-confirm").click();
    await expect(page.getByRole("heading", { name: "CorsixTH Browser Hospital" })).toBeVisible();
    await expect(page.getByTestId("asset-runtime-summary")).toHaveText("Asset files: 21; Maps: 2");
    await expectHospitalCanvasNonBlank(page);
    await expectOriginalUiStripNonBlank(page);
    await expectMapPreviewNonBlank(page);
    await expectBlockMapPreviewNonBlank(page);
    await expectSpritePreviewNonBlank(page);
    await expectAnimationPreviewNonBlank(page);
    await expectQDataPreviewNonBlank(page);
    await expect
        .poll(async () => page.evaluate(() => window.localStorage.getItem("corsixth.phase8.asset-import.v1") ?? ""))
        .toContain("\"contract\":\"phase8.asset-import.v1\"");
    await page.evaluate(() => window.localStorage.removeItem("corsixth.phase8.asset-import.v1"));
    await page.reload();
    await expect(page.getByRole("heading", { name: "CorsixTH Browser Hospital" })).toBeVisible();
    await expect(page.getByTestId("asset-runtime-summary")).toHaveText("Asset files: 21; Maps: 2");
    await expectHospitalCanvasNonBlank(page);
    await expectOriginalUiStripNonBlank(page);
    await expectMapPreviewNonBlank(page);
    await expectBlockMapPreviewNonBlank(page);
    await expectSpritePreviewNonBlank(page);
    await expectAnimationPreviewNonBlank(page);
    await expectQDataPreviewNonBlank(page);
});

async function expectHospitalCanvasNonBlank(page) {
    await expect(page.getByTestId("hospital-canvas-summary")).toContainText("LEVELS/EXAMPLE.MAP");
    await expect(page.getByTestId("hospital-map-canvas")).toBeVisible();
    await expectCanvasAlpha(page, "hospital-map-canvas");
}

async function expectOriginalUiStripNonBlank(page) {
    await expect(page.getByTestId("original-ui-strip-summary")).toContainText("Original UI:");
    await expect(page.getByTestId("original-ui-strip-summary")).toContainText("DATA/PANEL02V");
    await expect(page.getByTestId("original-ui-strip-canvas")).toBeVisible();
    await expectCanvasAlpha(page, "original-ui-strip-canvas");
}

async function expectMapPreviewNonBlank(page) {
    await expect(page.getByTestId("theme-map-preview-summary")).toContainText("LEVELS/EXAMPLE.MAP");
    await expect(page.getByTestId("theme-map-preview-canvas")).toBeVisible();
    await expect
        .poll(async () => page.getByTestId("theme-map-preview-canvas").evaluate((canvas) => {
        const context = canvas.getContext("2d");
        if (!context) {
            return false;
        }
        const pixels = context.getImageData(0, 0, canvas.width, canvas.height).data;
        for (let index = 0; index < pixels.length; index += 4) {
            if (pixels[index] !== 0 || pixels[index + 1] !== 0 || pixels[index + 2] !== 0) {
                return true;
            }
        }
        return false;
    }))
        .toBe(true);
}

async function expectBlockMapPreviewNonBlank(page) {
    await expect(page.getByTestId("theme-block-map-preview-summary")).toContainText("DATA/VBLK-0");
    await expect(page.getByTestId("theme-block-map-preview-canvas")).toBeVisible();
    await expectCanvasAlpha(page, "theme-block-map-preview-canvas");
}

async function expectSpritePreviewNonBlank(page) {
    await expect(page.getByTestId("theme-sprite-preview-summary")).toContainText("DATA/VSPR-0");
    await expect(page.getByTestId("theme-sprite-preview-canvas")).toBeVisible();
    await expectCanvasAlpha(page, "theme-sprite-preview-canvas");
}

async function expectAnimationPreviewNonBlank(page) {
    await expect(page.getByTestId("theme-animation-preview-summary")).toContainText("DATA/V*.ANI");
    await expect(page.getByTestId("theme-animation-preview-canvas")).toBeVisible();
    await expectCanvasAlpha(page, "theme-animation-preview-canvas");
}

async function expectQDataPreviewNonBlank(page) {
    await expect(page.getByTestId("theme-qdata-preview-summary")).toContainText("QDATA/FONT00V");
    await expect(page.getByTestId("theme-qdata-preview-canvas")).toBeVisible();
    await expectCanvasAlpha(page, "theme-qdata-preview-canvas");
}

async function expectCanvasAlpha(page, testId) {
    await expect
        .poll(async () => page.getByTestId(testId).evaluate((canvas) => {
        const context = canvas.getContext("2d");
        if (!context) {
            return false;
        }
        const pixels = context.getImageData(0, 0, canvas.width, canvas.height).data;
        for (let index = 0; index < pixels.length; index += 4) {
            if (pixels[index + 3] !== 0) {
                return true;
            }
        }
        return false;
    }))
        .toBe(true);
}
