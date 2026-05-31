import { expect, test } from "@playwright/test";
import { importAssetsAndEnterPlayableShell } from "./helpers/phase8-import";
async function resumeFromPausedState(page) {
    for (let attempt = 0; attempt < 3; attempt += 1) {
        const paused = (await page.getByTestId("paused").textContent())?.trim();
        if (paused === "Paused: no") {
            return;
        }
        await page.getByTestId("pause-toggle").click();
    }
    await expect(page.getByTestId("paused")).toHaveText("Paused: no");
}
test("phase 9 compatibility: import shell renders required onboarding UI", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("heading", { name: "Phase 8 Asset Import" })).toBeVisible();
    await expect(page.getByTestId("asset-import-required-directories")).toContainText("DATA");
    await expect(page.getByTestId("asset-import-required-files")).toContainText("HOSPITAL.CFG");
    await expect(page.getByTestId("asset-import-status")).toHaveText("Waiting for folder selection.");
});
test("phase 9 compatibility: import to playable shell and interact with controls", async ({ page }) => {
    await importAssetsAndEnterPlayableShell(page);
    await page.getByTestId("pause-toggle").click();
    await expect(page.getByTestId("paused")).toHaveText("Paused: yes");
    await page.getByTestId("step").click();
    await expect(page.getByTestId("tick")).toContainText("Tick:");
    await resumeFromPausedState(page);
});
