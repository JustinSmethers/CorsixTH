import { expect, test } from "@playwright/test";
import { importAssetsAndEnterPlayableShell } from "./helpers/phase8-import";
function parseMetric(raw, label) {
    const match = raw.match(new RegExp(`^${label}:\\s*(-?\\d+)`));
    if (!match) {
        throw new Error(`Unable to parse ${label} metric from: ${raw}`);
    }
    return Number(match[1]);
}
test("phase 7 integrated player journey: slices 1-4 flow without critical regressions", async ({ page }) => {
    await importAssetsAndEnterPlayableShell(page);
    await page.getByTestId("pause-toggle").click();
    await expect(page.getByTestId("paused")).toHaveText("Paused: yes");
    await page.getByTestId("step").click();
    await expect(page.getByTestId("last-event")).toHaveText("Last event: cashflow-negative");
    await page.getByTestId("admit").click();
    await page.getByTestId("treat").click();
    await expect
        .poll(async () => parseMetric(await page.getByTestId("discharged").textContent().then((text) => text ?? ""), "Discharged"))
        .toBeGreaterThan(0);
    for (let i = 0; i < 2; i += 1) {
        await page.getByTestId("admit").click();
        await page.getByTestId("treat").click();
    }
    await page.getByTestId("staff-break-toggle").click();
    await expect(page.getByTestId("on-break-staff")).toHaveText("On-break staff: 1");
    await page.getByTestId("treatment-room-toggle").click();
    await expect(page.getByTestId("open-treatment-rooms")).toHaveText("Open treatment rooms: 0");
    for (let i = 0; i < 4; i += 1) {
        await page.getByTestId("admit").click();
    }
    for (let i = 0; i < 32; i += 1) {
        await page.getByTestId("step").click();
    }
    await expect(page.getByTestId("queue-pressure-status")).toHaveText("Queue pressure status: high, high >= 3, reputation -2/tick");
    await page.getByTestId("staff-break-toggle").click();
    await page.getByTestId("treatment-room-toggle").click();
    for (let i = 0; i < 120; i += 1) {
        await page.getByTestId("step").click();
    }
    await expect(page.getByTestId("queue-pressure-status")).toHaveText("Queue pressure status: normal, high >= 3, reputation -2/tick");
    await expect
        .poll(async () => parseMetric(await page.getByTestId("milestone-level").textContent().then((text) => text ?? ""), "Milestones"))
        .toBeGreaterThan(0);
    await expect
        .poll(async () => parseMetric(await page.getByTestId("room-maintenance-complete-events").textContent().then((text) => text ?? ""), "Room maintenance completes"))
        .toBeGreaterThan(0);
});
