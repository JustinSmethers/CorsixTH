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
