import { expect, test } from "@playwright/test";
import { importAssetsAndEnterPlayableShell } from "./helpers/phase8-import";
async function placeRoomOnFirstValidTile(page, buttonTestId) {
    await page.getByTestId(buttonTestId).click();
    const canvas = page.getByTestId("hospital-map-canvas");
    for (const y of [128, 160, 192, 224, 256, 288, 320]) {
        for (const x of [256, 288, 320, 352, 384, 416, 448, 480, 512]) {
            await canvas.hover({ position: { x, y } });
            const placement = (await page.getByTestId("hospital-placement-mode").textContent()) ?? "";
            if (!placement.includes("(valid)")) {
                continue;
            }
            await canvas.click({ position: { x, y } });
            return { x, y };
        }
    }
    throw new Error(`No valid placement found for ${buttonTestId}`);
}
test("phase 7 slice 2 player journey: recover stalled flow via staff lifecycle and room operations", async ({ page }) => {
    await importAssetsAndEnterPlayableShell(page);
    await page.getByTestId("pause-toggle").click();
    await expect(page.getByTestId("paused")).toHaveText("Paused: yes");
    await page.getByTestId("admission-severity").selectOption("1");
    await page.getByTestId("admit").click();
    await expect(page.getByTestId("queue-size")).toHaveText("Queue: 1");
    await page.getByTestId("staff-break-toggle").click();
    await expect(page.getByTestId("active-staff")).toHaveText("Active staff: 1");
    await expect(page.getByTestId("on-break-staff")).toHaveText("On-break staff: 1");
    await page.getByTestId("step").click();
    await page.getByTestId("step").click();
    await expect(page.getByTestId("queue-size")).toHaveText("Queue: 1");
    await expect(page.getByTestId("diagnosing-size")).toHaveText("Diagnosing: 0");
    await page.getByTestId("staff-break-toggle").click();
    await expect(page.getByTestId("active-staff")).toHaveText("Active staff: 2");
    await page.getByTestId("step").click();
    await expect(page.getByTestId("walking-to-diagnosis-size")).toHaveText("Walking to diagnosis: 1");
    await page.getByTestId("treatment-room-toggle").click();
    await expect(page.getByTestId("open-treatment-rooms")).toHaveText("Open treatment rooms: 0");
    for (let i = 0; i < 3; i += 1) {
        await page.getByTestId("step").click();
    }
    await expect(page.getByTestId("awaiting-treatment-size")).toHaveText("Awaiting treatment: 1");
    await page.getByTestId("step").click();
    await expect(page.getByTestId("awaiting-treatment-size")).toHaveText("Awaiting treatment: 1");
    await expect(page.getByTestId("treating-size")).toHaveText("Treating: 0");
    await page.getByTestId("treatment-room-toggle").click();
    await expect(page.getByTestId("open-treatment-rooms")).toHaveText("Open treatment rooms: 1");
    await page.getByTestId("step").click();
    await expect(page.getByTestId("walking-to-treatment-size")).toHaveText("Walking to treatment: 1");
    for (let i = 0; i < 5; i += 1) {
        await page.getByTestId("step").click();
    }
    await expect(page.getByTestId("discharged")).toHaveText("Discharged: 1");
    await expect(page.getByTestId("waiting")).toHaveText("Waiting: 0");
});
test("phase 7 slice 2 player journey: selected staff can be moved on the map", async ({ page }) => {
    await importAssetsAndEnterPlayableShell(page);
    await page.getByTestId("pause-toggle").click();
    const canvas = page.getByTestId("hospital-map-canvas");
    await expect(page.getByTestId("move-selected-staff")).toBeDisabled();
    await page.getByTestId("hire-nurse").click();
    await canvas.hover({ position: { x: 416, y: 176 } });
    await expect(page.getByTestId("hospital-placement-mode")).toContainText("(valid)");
    await canvas.click({ position: { x: 416, y: 176 } });
    await expect(page.getByTestId("action-status")).toHaveText("Action: staff hired");
    await expect(page.getByTestId("hospital-canvas-summary")).toContainText("staff 3");
    await canvas.click({ position: { x: 416, y: 176 } });
    await expect(page.getByTestId("selection-status")).toContainText("Selection: Nurse");
    await expect(page.getByTestId("move-selected-staff")).toBeEnabled();
    await page.getByTestId("move-selected-staff").click();
    await expect(page.getByTestId("hospital-placement-mode")).toHaveText("Placement: move Nurse");
    await canvas.hover({ position: { x: 448, y: 192 } });
    await expect(page.getByTestId("hospital-placement-mode")).toContainText("(valid)");
    await canvas.click({ position: { x: 448, y: 192 } });
    await expect(page.getByTestId("action-status")).toHaveText("Action: staff moved");
    await expect(page.getByTestId("last-event")).toHaveText("Last event: staff-moved");
    await canvas.click({ position: { x: 448, y: 192 } });
    await expect(page.getByTestId("selection-status")).toContainText("Selection: Nurse");
    await expect(page.getByTestId("train-selected-staff")).toBeEnabled();
    await expect(page.getByTestId("staff-training-status")).toHaveText("Training: 0 active, 0 started, 0 complete");
    await expect(page.getByTestId("staff-skill-status")).toHaveText("Staff skill: 0/9, trained 0, next 700/5 ticks");
    await page.getByTestId("train-selected-staff").click();
    await expect(page.getByTestId("action-status")).toHaveText("Action: staff training started");
    await expect(page.getByTestId("staff-training-status")).toHaveText("Training: 1 active, 1 started, 0 complete");
    await expect(page.getByTestId("selection-status")).toContainText("training 5");
    await expect(page.getByTestId("train-selected-staff")).toBeDisabled();
    for (let index = 0; index < 5; index += 1) {
        await page.getByTestId("step").click();
    }
    await expect(page.getByTestId("staff-training-status")).toHaveText("Training: 0 active, 1 started, 1 complete");
    await expect(page.getByTestId("staff-skill-status")).toHaveText("Staff skill: 1/9, trained 1, next 700/5 ticks");
    await expect(page.getByTestId("selection-status")).toContainText("skill 1");
    await expect(page.getByTestId("last-event")).toHaveText("Last event: staff-training-completed");
});
test("phase 7 slice 2 player journey: handyman hiring surfaces maintenance staffing", async ({ page }) => {
    await importAssetsAndEnterPlayableShell(page);
    await page.getByTestId("pause-toggle").click();
    await expect(page.getByTestId("maintenance-staff-status")).toHaveText("Handymen: 0/0, repairs 0, bonus 1 ticks");
    await placeRoomOnFirstValidTile(page, "hire-handyman");
    await expect(page.getByTestId("action-status")).toHaveText("Action: staff hired");
    await expect(page.getByTestId("maintenance-staff-status")).toHaveText("Handymen: 1/1, repairs 0, bonus 1 ticks");
    await expect(page.getByTestId("active-staff")).toHaveText("Active staff: 3");
    await expect(page.getByTestId("hospital-canvas-summary")).toContainText("staff 3");
});
test("phase 7 slice 2 player journey: specialized treatment rooms route matching diseases", async ({ page }) => {
    await importAssetsAndEnterPlayableShell(page);
    await page.getByTestId("pause-toggle").click();
    await expect(page.getByTestId("specialized-treatment-rooms")).toHaveText("Specialized rooms: pharmacy 0, specialist 0");
    await page.getByTestId("treatment-room-toggle").click();
    await expect(page.getByTestId("open-treatment-rooms")).toHaveText("Open treatment rooms: 0");
    await placeRoomOnFirstValidTile(page, "build-pharmacy-room");
    await expect(page.getByTestId("action-status")).toHaveText("Action: room built");
    await expect(page.getByTestId("specialized-treatment-rooms")).toHaveText("Specialized rooms: pharmacy 1, specialist 0");
    await expect(page.getByTestId("open-treatment-rooms")).toHaveText("Open treatment rooms: 1");
    await page.getByTestId("admission-severity").selectOption("2");
    await page.getByTestId("admit").click();
    for (let index = 0; index < 6; index += 1) {
        await page.getByTestId("step").click();
    }
    await expect(page.getByTestId("casebook-summary")).toContainText(">Pharmacy");
    for (let index = 0; index < 28; index += 1) {
        await page.getByTestId("step").click();
    }
    await expect(page.getByTestId("specialized-treatment-queue")).toHaveText("Specialty queue: 0");
    await expect(page.getByTestId("walking-to-treatment-size")).toHaveText("Walking to treatment: 1");
});
test("phase 7 slice 2 player journey: specialist rooms can be built from browser controls", async ({ page }) => {
    await importAssetsAndEnterPlayableShell(page);
    await page.getByTestId("pause-toggle").click();
    await expect(page.getByTestId("specialized-treatment-rooms")).toHaveText("Specialized rooms: pharmacy 0, specialist 0");
    await page.getByTestId("treatment-room-toggle").click();
    await expect(page.getByTestId("open-treatment-rooms")).toHaveText("Open treatment rooms: 0");
    await placeRoomOnFirstValidTile(page, "build-specialist-room");
    await expect(page.getByTestId("action-status")).toHaveText("Action: room built");
    await expect(page.getByTestId("specialized-treatment-rooms")).toHaveText("Specialized rooms: pharmacy 0, specialist 1");
    await expect(page.getByTestId("open-treatment-rooms")).toHaveText("Open treatment rooms: 1");
    await expect(page.getByTestId("hospital-canvas-summary")).toContainText("rooms 3");
});
