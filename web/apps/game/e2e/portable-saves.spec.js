import { readFile } from "node:fs/promises";
import { expect, test } from "@playwright/test";
import { importAssetsAndEnterPlayableShell } from "./helpers/phase8-import";

async function exportCurrentSave(page) {
    const downloadPromise = page.waitForEvent("download");
    await page.getByTestId("export-save").click();
    const download = await downloadPromise;
    expect(download.suggestedFilename()).toMatch(/\.corsixth\.json$/);
    return readFile(await download.path(), "utf8");
}

async function importSave(page, serialized) {
    await page.getByTestId("import-save-picker").setInputFiles({
        name: "hospital.corsixth.json",
        mimeType: "application/json",
        buffer: Buffer.from(serialized)
    });
}

test("portable saves restore a hospital, camera, pause and 8x speed across browser sessions", async ({ page, browser }) => {
    await importAssetsAndEnterPlayableShell(page);
    await page.getByTestId("hospital-map-select").selectOption("LEVELS/SECOND.MAP");
    await page.getByTestId("pause-toggle").click();
    await expect(page.getByTestId("paused")).toHaveText("Paused: yes");
    await page.getByTestId("speed-select").selectOption("8");
    await page.getByTestId("take-loan").click();
    await page.getByTestId("step").click();
    await page.getByTestId("hospital-camera-east").click();
    await page.getByTestId("playfield").focus();
    await page.keyboard.press("Equal");
    const hash = await page.getByTestId("hash").textContent();
    const summary = await page.getByTestId("hospital-canvas-summary").textContent();
    const cash = await page.getByTestId("cash").textContent();
    const serialized = await exportCurrentSave(page);
    expect(JSON.parse(serialized).payload.runtime.speedMultiplier).toBe(8);
    expect(JSON.parse(serialized).payload.mapView.zoomIndex).toBe(3);

    const freshContext = await browser.newContext({ baseURL: new URL(page.url()).origin });
    try {
        const freshPage = await freshContext.newPage();
        await importAssetsAndEnterPlayableShell(freshPage);
        await freshPage.getByTestId("save-slot-name").fill("restored-hospital");
        await importSave(freshPage, serialized);
        await expect(freshPage.getByTestId("save-status")).toContainText("Save: imported tick");
        await expect(freshPage.getByTestId("hash")).toHaveText(hash);
        await expect(freshPage.getByTestId("cash")).toHaveText(cash);
        await expect(freshPage.getByTestId("hospital-canvas-summary")).toHaveText(summary);
        await expect(freshPage.getByTestId("paused")).toHaveText("Paused: yes");
        await expect(freshPage.getByTestId("speed-status")).toHaveText("Speed: 8x");
        await expect(freshPage.getByTestId("save-slot-select")).toHaveValue("restored-hospital");
        await freshPage.reload();
        await expect(freshPage.getByTestId("phase7-shell")).toBeVisible();
        await freshPage.getByTestId("save-slot-select").selectOption("restored-hospital");
        await freshPage.getByTestId("load-game").click();
        await expect(freshPage.getByTestId("save-status")).toContainText("Save: loaded tick");
        await expect(freshPage.getByTestId("hash")).toHaveText(hash);
        await expect(freshPage.getByTestId("hospital-canvas-summary")).toHaveText(summary);
    }
    finally {
        await freshContext.close();
    }
});

test("rejected portable saves preserve both the live hospital and existing slot", async ({ page }) => {
    await importAssetsAndEnterPlayableShell(page);
    await page.getByTestId("pause-toggle").click();
    await page.getByTestId("save-slot-name").fill("protected-hospital");
    await page.getByTestId("take-loan").click();
    await page.getByTestId("save-game").click();
    await expect(page.getByTestId("save-status")).toContainText("Save: tick");
    const hash = await page.getByTestId("hash").textContent();
    const summary = await page.getByTestId("hospital-canvas-summary").textContent();
    const valid = JSON.parse(await exportCurrentSave(page));
    const missingMap = structuredClone(valid);
    missingMap.payload.mapView.mapPath = "LEVELS/MISSING.MAP";
    const badZoom = structuredClone(valid);
    badZoom.payload.mapView.zoomIndex = 99;
    for (const serialized of ["not json", "{}", JSON.stringify(badZoom), JSON.stringify(missingMap)]) {
        await importSave(page, serialized);
        await expect(page.getByTestId("save-status")).toContainText("Import failed:");
        await expect(page.getByTestId("hash")).toHaveText(hash);
        await expect(page.getByTestId("hospital-canvas-summary")).toHaveText(summary);
        await expect(page.getByTestId("import-save-picker")).toBeEnabled();
    }
    await page.getByTestId("repay-loan").click();
    await expect(page.getByTestId("hash")).not.toHaveText(hash);
    await page.getByTestId("load-game").click();
    await expect(page.getByTestId("save-status")).toContainText("Save: loaded tick");
    await expect(page.getByTestId("hash")).toHaveText(hash);
});

test("a corrupt local save reports failure without replacing the running hospital", async ({ page }) => {
    await importAssetsAndEnterPlayableShell(page);
    await page.getByTestId("pause-toggle").click();
    await page.getByTestId("take-loan").click();
    const hash = await page.getByTestId("hash").textContent();
    const summary = await page.getByTestId("hospital-canvas-summary").textContent();
    await page.evaluate(() => new Promise((resolve, reject) => {
        const request = indexedDB.open("corsixth-browser-runtime", 1);
        request.onerror = () => reject(request.error);
        request.onsuccess = () => {
            const database = request.result;
            const transaction = database.transaction("save-slots", "readwrite");
            transaction.objectStore("save-slots").put({
                slot: "corrupt-hospital",
                serialized: "not a valid save",
                schemaVersion: 2,
                savedAtIso: new Date().toISOString()
            }, "corrupt-hospital");
            transaction.oncomplete = () => { database.close(); resolve(); };
            transaction.onerror = () => { database.close(); reject(transaction.error); };
        };
    }));
    await page.getByTestId("save-slot-name").fill("corrupt-hospital");
    await page.getByTestId("load-game").click();
    await expect(page.getByTestId("save-status")).toContainText("Load failed: invalid browser save");
    await expect(page.getByTestId("hash")).toHaveText(hash);
    await expect(page.getByTestId("hospital-canvas-summary")).toHaveText(summary);
});
