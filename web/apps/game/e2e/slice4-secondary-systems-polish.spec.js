import { expect, test } from "@playwright/test";
import { importAssetsAndEnterPlayableShell } from "./helpers/phase8-import";
function parseMetric(raw, label) {
    const match = raw.match(new RegExp(`^${label}:\\s*(-?\\d+)$`));
    if (!match) {
        throw new Error(`Unable to parse ${label} metric from: ${raw}`);
    }
    return Number(match[1]);
}
function parseServedMetric(raw, label) {
    const match = raw.match(new RegExp(`^${label}:\\s*(\\d+)(?:,.*)?$`));
    if (!match) {
        throw new Error(`Unable to parse ${label} served metric from: ${raw}`);
    }
    return Number(match[1]);
}
function parseRatioMetric(raw, label) {
    const match = raw.match(new RegExp(`^${label}:\\s*(\\d+)\\/(\\d+),.*$`));
    if (!match) {
        throw new Error(`Unable to parse ${label} ratio metric from: ${raw}`);
    }
    return {
        numerator: Number(match[1]),
        denominator: Number(match[2])
    };
}
test("phase 7 slice 4 player journey: secondary systems and polish counters are deterministic", async ({ page }) => {
    await importAssetsAndEnterPlayableShell(page);
    await page.getByTestId("pause-toggle").click();
    await expect(page.getByTestId("paused")).toHaveText("Paused: yes");
    for (let i = 0; i < 4; i += 1) {
        await page.getByTestId("admit").click();
    }
    await page.getByTestId("step").click();
    await expect(page.getByTestId("queue-pressure-status")).toHaveText("Queue pressure status: high, high >= 3, reputation -2/tick");
    for (let i = 0; i < 96; i += 1) {
        await page.getByTestId("step").click();
    }
    await expect(page.getByTestId("queue-pressure-status")).toHaveText("Queue pressure status: normal, high >= 3, reputation -2/tick");
    await expect(page.getByTestId("tired-staff")).toHaveText(/Tired staff: \d+/u);
    await expect(page.getByTestId("very-tired-staff")).toHaveText(/Very tired staff: \d+/u);
    await expect(page.getByTestId("rat-control")).toHaveText(/Rats: \d+\/\d+, accuracy \d+%/u);
    await expect(page.getByTestId("plant-care")).toHaveText(/Plants: \d+\/\d+, watered \d+%/u);
    await expect
        .poll(async () => parseMetric(await page.getByTestId("queue-pressure-events").textContent().then((text) => text ?? ""), "Queue pressure events"))
        .toBeGreaterThanOrEqual(2);
    await expect
        .poll(async () => parseMetric(await page.getByTestId("room-maintenance-start-events").textContent().then((text) => text ?? ""), "Room maintenance starts"))
        .toBeGreaterThan(0);
    await expect(page.getByTestId("rooms-in-maintenance")).toHaveText(/Rooms in maintenance: \d+, worn \d+%/u);
});
test("phase 7 slice 4 player journey: manual patient and environment care controls report deterministic outcomes", async ({ page }) => {
    await importAssetsAndEnterPlayableShell(page);
    await page.getByTestId("pause-toggle").click();
    await page.getByTestId("staff-break-toggle").click();
    const canvas = page.getByTestId("hospital-map-canvas");
    await canvas.click({ button: "right", position: { x: 384, y: 160 } });
    await expect(page.getByTestId("give-drink-selected-patient")).toBeDisabled();
    await expect(page.getByTestId("send-selected-patient-toilet")).toBeDisabled();
    await canvas.click({ position: { x: 384, y: 160 } });
    await expect(page.getByTestId("selection-status")).toContainText("Selection: patient #1");
    await expect(page.getByTestId("give-drink-selected-patient")).toBeEnabled();
    await expect(page.getByTestId("send-selected-patient-toilet")).toBeEnabled();
    for (let i = 0; i < 6; i += 1) {
        await page.getByTestId("step").click();
    }
    const drinksBefore = parseServedMetric((await page.getByTestId("patient-drinks").textContent()) ?? "", "Drinks served");
    await page.getByTestId("give-drink-selected-patient").click();
    await expect(page.getByTestId("action-status")).toHaveText("Action: drink blocked");
    expect(parseServedMetric((await page.getByTestId("patient-drinks").textContent()) ?? "", "Drinks served")).toBe(drinksBefore);
    await page.getByTestId("send-selected-patient-toilet").click();
    await expect(page.getByTestId("action-status")).toHaveText("Action: toilet blocked");
    const ratsBefore = parseRatioMetric((await page.getByTestId("rat-control").textContent()) ?? "", "Rats");
    await page.getByTestId("shoot-rat").click();
    await expect(page.getByTestId("action-status")).toHaveText("Action: rat killed");
    await expect(page.getByTestId("last-event")).toHaveText("Last event: rat-killed");
    await expect
        .poll(async () => parseRatioMetric((await page.getByTestId("rat-control").textContent()) ?? "", "Rats"))
        .toEqual({
            numerator: ratsBefore.numerator + 1,
            denominator: ratsBefore.denominator + 1
        });
    const plantsBefore = parseRatioMetric((await page.getByTestId("plant-care").textContent()) ?? "", "Plants");
    await page.getByTestId("water-plant").click();
    await expect(page.getByTestId("action-status")).toHaveText("Action: plant watered");
    await expect(page.getByTestId("last-event")).toHaveText("Last event: plant-watered");
    await expect
        .poll(async () => parseRatioMetric((await page.getByTestId("plant-care").textContent()) ?? "", "Plants"))
        .toEqual({
            numerator: plantsBefore.numerator + 1,
            denominator: plantsBefore.denominator + 1
        });
});
test("phase 7 slice 4 player journey: untreated patients become critical and can die", async ({ page }) => {
    await importAssetsAndEnterPlayableShell(page);
    await page.getByTestId("pause-toggle").click();
    await page.getByTestId("staff-break-toggle").click();
    await page.getByTestId("admit").click();
    await expect(page.getByTestId("patient-deaths")).toHaveText("Deaths: 0, walkouts 0 (0%), abductions 0; death penalties s1 120/-12, s2 180/-20, s3 260/-30; send-home s1 40/-2, s2 70/-4, s3 110/-8");
    await expect(page.getByTestId("critical-patients")).toHaveText("Critical patients: 0, lowest health 64");
    for (let i = 0; i < 52; i += 1) {
        await page.getByTestId("step").click();
    }
    await expect(page.getByTestId("patient-vomits")).toHaveText(/Patient vomits: \d+, limit (?:\d+|default)/u);
    await expect(page.getByTestId("patient-litter")).toHaveText(/Patient litter: \d+, active \d+, cleaned \d+, cleanliness \d+%/u);
    await expect(page.getByTestId("patient-drinks")).toHaveText(/Drinks served: \d+(?:, award \d+\/\d+)?/u);
    await expect(page.getByTestId("patients-needing-toilet")).toHaveText(/Need toilet: \d+, threshold (?:\d+|default)/u);
    await expect(page.getByTestId("patient-bowel-overflows")).toHaveText(/Bowel overflows: \d+, threshold (?:\d+|default)/u);
    await expect(page.getByTestId("critical-patients")).toHaveText("Critical patients: 1, lowest health 12");
    for (let i = 0; i < 12; i += 1) {
        await page.getByTestId("step").click();
    }
    await expect(page.getByTestId("patient-deaths")).toHaveText("Deaths: 1, walkouts 0 (0%), abductions 0; death penalties s1 120/-12, s2 180/-20, s3 260/-30; send-home s1 40/-2, s2 70/-4, s3 110/-8");
    await expect(page.getByTestId("waiting")).toHaveText("Waiting: 0");
    await expect(page.getByTestId("last-event")).toHaveText("Last event: patient-died");
});
test("phase 7 slice 4 player journey: selected rooms can be manually repaired", async ({ page }) => {
    await importAssetsAndEnterPlayableShell(page);
    await page.getByTestId("pause-toggle").click();
    await expect(page.getByTestId("repair-selected-room")).toBeDisabled();
    await page.getByTestId("treatment-room-toggle").click();
    await page.getByTestId("admission-severity").selectOption("1");
    for (let i = 0; i < 8; i += 1) {
        await page.getByTestId("admit").click();
    }
    let maintenanceStarts = 0;
    for (let i = 0; i < 80; i += 1) {
        await page.getByTestId("step").click();
        maintenanceStarts = parseMetric((await page.getByTestId("room-maintenance-start-events").textContent()) ?? "", "Room maintenance starts");
        if (maintenanceStarts > 0) {
            break;
        }
    }
    expect(maintenanceStarts).toBeGreaterThan(0);
    for (let i = 0; i < 15; i += 1) {
        await page.getByTestId("hospital-camera-west").click();
        await page.getByTestId("hospital-camera-north").click();
    }
    await page.getByTestId("hospital-map-canvas").click({ position: { x: 384, y: 66 } });
    await expect(page.getByTestId("selection-status")).toContainText("Selection: GP's Office room #1");
    await expect(page.getByTestId("selection-status")).toContainText("maintenance 1");
    await expect(page.getByTestId("repair-selected-room")).toBeEnabled();
    await page.getByTestId("repair-selected-room").click();
    await expect(page.getByTestId("action-status")).toHaveText("Action: room repaired");
    await expect(page.getByTestId("last-event")).toHaveText("Last event: room-repaired");
    await expect(page.getByTestId("selection-status")).toContainText("wear 0, maintenance 0");
    await expect(page.getByTestId("open-diagnosis-rooms")).toHaveText("Open diagnosis rooms: 1");
});
