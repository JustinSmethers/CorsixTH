import { mkdir } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { expect, test } from "@playwright/test";

const gameDataDirectory = fileURLToPath(new URL("../../../../GameData", import.meta.url));

async function placeOnVisibleTile(page, expectedAction) {
    const canvas = page.getByTestId("hospital-map-canvas");
    for (const y of [128, 160, 192, 224, 256, 288, 320]) {
        for (const x of [256, 288, 320, 352, 384, 416, 448, 480, 512]) {
            await canvas.hover({ position: { x, y } });
            if (!((await page.getByTestId("hospital-placement-mode").textContent()) ?? "").includes("(valid)")) continue;
            await canvas.click({ position: { x, y } });
            await expect(page.getByTestId("action-status")).toHaveText(expectedAction);
            return { x, y };
        }
    }
    throw new Error(`Unable to place on a visible tile: ${expectedAction}`);
}

test("actual GoG assets render native humanoids and play original sound samples", async ({ page }) => {
    test.setTimeout(45_000);
    await page.addInitScript(() => {
        window.nativeSoundStarts = [];
        window.syntheticSoundStarts = 0;
        window.audioContextCloses = 0;
        const startBuffer = AudioBufferSourceNode.prototype.start;
        AudioBufferSourceNode.prototype.start = function (...args) {
            window.nativeSoundStarts.push({
                sampleRate: this.buffer?.sampleRate,
                duration: this.buffer?.duration,
                channels: this.buffer?.numberOfChannels
            });
            return startBuffer.apply(this, args);
        };
        const startOscillator = OscillatorNode.prototype.start;
        OscillatorNode.prototype.start = function (...args) {
            window.syntheticSoundStarts += 1;
            return startOscillator.apply(this, args);
        };
        const closeContext = AudioContext.prototype.close;
        AudioContext.prototype.close = function (...args) {
            window.audioContextCloses += 1;
            return closeContext.apply(this, args);
        };
    });
    await page.goto("/");
    await page.getByTestId("asset-import-picker").setInputFiles(gameDataDirectory);
    await expect(page.getByTestId("asset-import-status")).toHaveText("Ready to import. Diagnostics are clear.");
    await page.getByTestId("asset-import-confirm").click();
    await expect(page.getByTestId("phase7-shell")).toBeVisible();
    await page.getByTestId("pause-toggle").click();
    await expect(page.getByTestId("paused")).toHaveText("Paused: yes");
    await page.getByTestId("pause-toggle").click();
    await expect.poll(() => page.evaluate(() => window.nativeSoundStarts.length)).toBeGreaterThan(0);
    expect(await page.evaluate(() => window.syntheticSoundStarts)).toBe(0);
    const sample = await page.evaluate(() => window.nativeSoundStarts[0]);
    expect(sample).toEqual({
        sampleRate: expect.any(Number), duration: expect.any(Number), channels: expect.any(Number)
    });
    expect(sample.sampleRate).toBeGreaterThan(0);
    expect(sample.duration).toBeGreaterThan(0);
    await page.getByTestId("pause-toggle").click();
    for (const role of ["diagnostician", "nurse", "handyman", "receptionist"]) {
        await page.getByTestId(`hire-${role}`).click();
        await placeOnVisibleTile(page, "Action: staff hired");
    }
    const canvas = page.getByTestId("hospital-map-canvas");
    await canvas.click({ button: "right", position: { x: 384, y: 160 } });
    await expect(page.getByTestId("action-status")).toHaveText("Action: patient admitted");
    await expect.poll(() => canvas.evaluate((element) => Number(element.dataset.nativeEntityCount))).toBeGreaterThanOrEqual(5);
    const types = await canvas.evaluate((element) => JSON.parse(element.dataset.nativeEntityTypes));
    for (const type of ["Doctor", "Nurse", "Handyman", "Receptionist", "Standard Male Patient"]) {
        expect(types).toContain(type);
    }
    await page.getByTestId("playfield").focus();
    await page.keyboard.press("KeyG");
    await page.locator('[data-testid="furnish-corridor-object"][data-object-index="4"]').click();
    const benchPosition = await placeOnVisibleTile(page, "Action: object placed");
    await expect(canvas).toHaveAttribute("data-native-object-count", "1");
    await canvas.scrollIntoViewIfNeeded();
    await mkdir(".tmp", { recursive: true });
    await canvas.screenshot({ path: ".tmp/parity-hospital.png" });
    await canvas.click({ position: benchPosition });
    await expect(page.getByTestId("selection-status")).toContainText("Bench #");
    await page.getByTestId("sell-selected-object").click();
    await expect(page.getByTestId("action-status")).toHaveText("Action: object sold");
    await expect(canvas).toHaveAttribute("data-native-object-count", "0");
    await page.getByTestId("asset-import-reset").click();
    await expect(page.getByTestId("phase8-import-shell")).toBeVisible();
    expect(await page.evaluate(() => window.audioContextCloses)).toBe(1);
});
