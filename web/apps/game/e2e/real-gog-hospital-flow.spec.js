import { existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { expect, test } from "@playwright/test";

const gameDirectory = fileURLToPath(new URL("../../../../GameData/Contents/Resources/game", import.meta.url));

async function placeOnValidTile(page, button, expectedAction) {
    await page.getByTestId(button).click();
    const canvas = page.getByTestId("hospital-map-canvas");
    for (const y of [128, 160, 192, 224, 256, 288, 320, 352]) {
        for (const x of [192, 224, 256, 288, 320, 352, 384, 416, 448, 480, 512, 544, 576]) {
            await canvas.hover({ position: { x, y } });
            if (!(await page.getByTestId("hospital-placement-mode").textContent()).includes("(valid)")) continue;
            await canvas.click({ position: { x, y } });
            await expect(page.getByTestId("action-status")).toHaveText(expectedAction);
            return;
        }
    }
    throw new Error(`No legal placement found for ${button}`);
}

test("real GoG patient completes staffed diagnosis and discharge without manual treatment", async ({ page }) => {
    test.skip(!existsSync(gameDirectory), "Requires locally owned GoG assets");
    test.setTimeout(60_000);
    await page.goto("/");
    await page.getByTestId("asset-import-picker").setInputFiles(gameDirectory);
    await expect(page.getByTestId("asset-import-status")).toHaveText("Ready to import. Diagnostics are clear.");
    await page.getByTestId("asset-import-confirm").click();
    await expect(page.getByTestId("phase7-shell")).toBeVisible();
    await page.getByTestId("pause-toggle").click();
    await expect(page.getByTestId("paused")).toHaveText("Paused: yes");
    await placeOnValidTile(page, "build-inflation-room", "Action: room built");
    await placeOnValidTile(page, "hire-diagnostician", "Action: staff hired");
    await page.getByTestId("admission-severity").selectOption("3");
    await page.getByTestId("admit").click();
    await expect(page.getByTestId("waiting")).toHaveText("Waiting: 1");
    let sawDiagnosis = false;
    let sawTreatment = false;
    for (let tick = 0; tick < 96; tick += 1) {
        await page.getByTestId("step").click();
        const diagnosed = await page.getByTestId("diagnosed-size").textContent();
        const walking = await page.getByTestId("walking-to-treatment-size").textContent();
        const treating = await page.getByTestId("treating-size").textContent();
        if (diagnosed === "Diagnosed: 1" && !sawDiagnosis) {
            // Imported campaign pools override the manual severity picker. The
            // first available Level One admission is Uncommon Cold.
            await expect(page.getByTestId("casebook-summary")).toContainText("Uncommon Cold");
        }
        sawDiagnosis ||= diagnosed === "Diagnosed: 1";
        sawTreatment ||= walking === "Walking to treatment: 1" || treating === "Treating: 1";
        if ((await page.getByTestId("discharged").textContent()) === "Discharged: 1") break;
        if ((await page.getByTestId("waiting").textContent()) === "Waiting: 0") break;
    }
    expect(sawDiagnosis).toBe(true);
    expect(sawTreatment).toBe(true);
    await expect(page.getByTestId("discharged")).toHaveText("Discharged: 1");
    await expect(page.getByTestId("waiting")).toHaveText("Waiting: 0");
    await expect(page.getByTestId("treatment-failures")).toContainText("Treatment failures: 0;");
});
