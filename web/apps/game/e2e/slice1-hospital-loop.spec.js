import { expect, test } from "@playwright/test";
import { importAssetsAndEnterPlayableShell } from "./helpers/phase8-import";
function parseNextArrival(raw) {
    const match = raw.match(/^Next arrival:\s*(\d+) ticks(?:;.*)?$/);
    if (!match) {
        throw new Error(`Unable to parse next-arrival metric from: ${raw}`);
    }
    return Number(match[1]);
}
function parseTick(raw) {
    const match = raw.match(/^Tick:\s*(\d+)$/);
    if (!match) {
        throw new Error(`Unable to parse tick metric from: ${raw}`);
    }
    return Number(match[1]);
}
function conservativeAdmissionMaxHealth(seed, tick) {
    const bucket = (seed + tick * 17) % 10;
    if (bucket < 7) {
        return 80;
    }
    if (bucket < 9) {
        return 64;
    }
    return 48;
}
async function stepUntilText(page, testId, expectedText, maxSteps) {
    const locator = page.getByTestId(testId);
    for (let step = 0; step < maxSteps; step += 1) {
        if ((await locator.textContent()) === expectedText) {
            return;
        }
        await page.getByTestId("step").click();
    }
    await expect(locator).toHaveText(expectedText);
}
test("phase 7 slice 1 player journey: spawn, queue, diagnose, treat, discharge", async ({ page }) => {
    await importAssetsAndEnterPlayableShell(page);
    await page.getByTestId("pause-toggle").click();
    await expect(page.getByTestId("paused")).toHaveText("Paused: yes");
    await page.getByTestId("admit").click();
    await page.getByTestId("admit").click();
    await expect(page.getByTestId("queue-size")).toHaveText("Queue: 2");
    await expect(page.getByTestId("discharged")).toHaveText("Discharged: 0");
    await expect(page.getByTestId("waiting")).toHaveText("Waiting: 2");
    await expect(page.getByTestId("casebook-summary")).toContainText("unknown disease");
    await page.getByTestId("step").click();
    await expect(page.getByTestId("queue-size")).toHaveText("Queue: 1");
    await expect(page.getByTestId("walking-to-diagnosis-size")).toHaveText("Walking to diagnosis: 1");
    await expect(page.getByTestId("diagnosing-size")).toHaveText("Diagnosing: 0");
    await expect(page.getByTestId("diagnosed-size")).toHaveText("Diagnosed: 0");
    await expect(page.getByTestId("treating-size")).toHaveText("Treating: 0");
    await stepUntilText(page, "diagnosed-size", "Diagnosed: 2", 32);
    await page.getByTestId("treat").click();
    await expect(page.getByTestId("discharged")).toHaveText("Discharged: 1");
    await expect(page.getByTestId("diagnosed-size")).toHaveText("Diagnosed: 1");
    await expect(page.getByTestId("treatment-failures")).toHaveText("Treatment failures: 0; penalties s1 80/-4, s2 130/-8, s3 200/-14");
    await expect(page.getByTestId("casebook-summary")).toContainText("Sleeping Illness");
    await page.getByTestId("treat").click();
    await expect(page.getByTestId("discharged")).toHaveText("Discharged: 2");
    await expect(page.getByTestId("queue-size")).toHaveText("Queue: 0");
    await expect(page.getByTestId("waiting")).toHaveText("Waiting: 0");
    await expect(page.getByTestId("casebook-summary")).toHaveText("Casebook: no active patients");
});
test("phase 7 slice 1 player journey: open admissions generates deterministic arrivals", async ({ page }) => {
    await importAssetsAndEnterPlayableShell(page);
    await page.getByTestId("pause-toggle").click();
    await expect(page.getByTestId("paused")).toHaveText("Paused: yes");
    await expect(page.getByTestId("admissions-status")).toHaveText("Admissions: closed");
    await expect(page.getByTestId("admission-policy-status")).toHaveText("Admission policy: standard");
    await page.getByTestId("admission-policy").selectOption("conservative");
    await expect(page.getByTestId("action-status")).toHaveText("Action: admission policy changed");
    await expect(page.getByTestId("admission-policy-status")).toHaveText("Admission policy: conservative");
    await page.getByTestId("admissions-toggle").click();
    await expect(page.getByTestId("action-status")).toHaveText("Action: admissions open");
    await expect(page.getByTestId("admissions-status")).toHaveText("Admissions: open");
    const currentTick = parseTick((await page.getByTestId("tick").textContent()) ?? "");
    const firstArrivalTicks = parseNextArrival((await page.getByTestId("next-admission").textContent()) ?? "");
    expect(firstArrivalTicks).toBeGreaterThan(0);
    expect(firstArrivalTicks).toBeLessThanOrEqual(16);
    for (let i = 0; i < firstArrivalTicks; i += 1) {
        await page.getByTestId("step").click();
    }
    await expect(page.getByTestId("waiting")).toHaveText("Waiting: 1");
    await expect(page.getByTestId("queue-size")).toHaveText("Queue: 1");
    const expectedMaxHealth = conservativeAdmissionMaxHealth(1234, currentTick + firstArrivalTicks);
    await expect(page.getByTestId("casebook-summary")).toContainText(`H${expectedMaxHealth}/${expectedMaxHealth}`);
    await expect(page.getByTestId("next-admission")).toHaveText(/^Next arrival: 16 ticks(?:;.*)?$/u);
    await page.getByTestId("admissions-toggle").click();
    await expect(page.getByTestId("action-status")).toHaveText("Action: admissions closed");
    await expect(page.getByTestId("admissions-status")).toHaveText("Admissions: closed");
    await expect(page.getByTestId("next-admission")).toHaveText(/^Next arrival: closed(?:;.*)?$/u);
});
test("phase 7 slice 1 player journey: manual severity controls explicit treatment outcomes", async ({ page }) => {
    await importAssetsAndEnterPlayableShell(page);
    await page.getByTestId("pause-toggle").click();
    await expect(page.getByTestId("paused")).toHaveText("Paused: yes");
    await page.getByTestId("admission-severity").selectOption("3");
    await page.getByTestId("admit").click();
    await page.getByTestId("admit").click();
    await expect(page.getByTestId("waiting")).toHaveText("Waiting: 2");
    await expect(page.getByTestId("queue-size")).toHaveText("Queue: 2");
    await stepUntilText(page, "diagnosed-size", "Diagnosed: 2", 80);
    await page.getByTestId("treat").click();
    await page.getByTestId("treat").click();
    await expect(page.getByTestId("waiting")).toHaveText("Waiting: 0");
    await expect(page.getByTestId("discharged")).toHaveText("Discharged: 2");
    await expect(page.getByTestId("treatment-failures")).toHaveText("Treatment failures: 0; penalties s1 80/-4, s2 130/-8, s3 200/-14");
    await expect(page.getByTestId("last-event")).toHaveText("Last event: milestone-unlocked");
});
test("phase 7 slice 1 player journey: selected treatment targets the selected patient", async ({ page }) => {
    await importAssetsAndEnterPlayableShell(page);
    await page.getByTestId("pause-toggle").click();
    const canvas = page.getByTestId("hospital-map-canvas");
    await canvas.click({ button: "right", position: { x: 384, y: 160 } });
    await canvas.click({ button: "right", position: { x: 416, y: 176 } });
    await expect(page.getByTestId("casebook-summary")).toContainText("#1");
    await expect(page.getByTestId("casebook-summary")).toContainText("#2");
    await page.getByTestId("playfield").focus();
    await page.keyboard.press("F5");
    await expect(page.getByTestId("casebook-panel")).toBeVisible();
    await expect(page.getByTestId("casebook-panel-row")).toHaveCount(2);
    const patientTwoRow = page.locator("[data-testid='casebook-panel-row'][data-patient-id='2']");
    await expect(patientTwoRow).toContainText("#2");
    await patientTwoRow.getByTestId("casebook-panel-select").click();
    await expect(page.getByTestId("action-status")).toHaveText("Action: selected patient");
    await expect(page.getByTestId("selection-status")).toContainText("Selection: patient #2");
    await page.getByTestId("casebook-panel-close").click();
    await expect(page.getByTestId("casebook-panel")).toBeHidden();
    await expect(page.getByTestId("send-selected-patient-home")).toBeEnabled();
    await canvas.click({ position: { x: 416, y: 176 } });
    await expect(page.getByTestId("action-status")).toHaveText("Action: selected patient");
    await expect(page.getByTestId("selection-status")).toContainText("Selection: patient #2");
    await expect(page.getByTestId("send-selected-patient-home")).toBeEnabled();
    await page.getByTestId("treat").click();
    await expect(page.getByTestId("action-status")).toHaveText("Action: patient treated");
    await expect(page.getByTestId("waiting")).toHaveText("Waiting: 1");
    await expect(page.getByTestId("casebook-summary")).toContainText("#1");
    await expect(page.getByTestId("casebook-summary")).not.toContainText("#2");
});
test("phase 7 slice 1 player journey: selected patients can be sent home", async ({ page }) => {
    await importAssetsAndEnterPlayableShell(page);
    await page.keyboard.press("KeyP");
    await expect(page.getByTestId("paused")).toHaveText("Paused: yes");
    const canvas = page.getByTestId("hospital-map-canvas");
    await canvas.click({ button: "right", position: { x: 384, y: 160 } });
    await canvas.click({ button: "right", position: { x: 416, y: 176 } });
    await expect(page.getByTestId("waiting")).toHaveText("Waiting: 2");
    await expect(page.getByTestId("send-selected-patient-home")).toBeDisabled();
    await canvas.click({ position: { x: 416, y: 176 } });
    await expect(page.getByTestId("selection-status")).toContainText("Selection: patient #2");
    await expect(page.getByTestId("send-selected-patient-home")).toBeEnabled();
    await page.keyboard.press("KeyH");
    await expect(page.getByTestId("action-status")).toHaveText("Action: patient sent home");
    await expect(page.getByTestId("last-event")).toHaveText("Last event: patient-sent-home");
    await expect(page.getByTestId("waiting")).toHaveText("Waiting: 1");
    await expect(page.getByTestId("casebook-summary")).toContainText("#1");
    await expect(page.getByTestId("casebook-summary")).not.toContainText("#2");
});
test("phase 7 slice 1 player journey: selected patients can be prioritized", async ({ page }) => {
    await importAssetsAndEnterPlayableShell(page);
    await page.getByTestId("pause-toggle").click();
    const canvas = page.getByTestId("hospital-map-canvas");
    await canvas.click({ button: "right", position: { x: 384, y: 160 } });
    await canvas.click({ button: "right", position: { x: 416, y: 176 } });
    await expect(page.getByTestId("prioritize-selected-patient")).toBeDisabled();
    await canvas.click({ position: { x: 416, y: 176 } });
    await expect(page.getByTestId("selection-status")).toContainText("Selection: patient #2");
    await expect(page.getByTestId("prioritize-selected-patient")).toBeEnabled();
    await page.getByTestId("prioritize-selected-patient").click();
    await expect(page.getByTestId("action-status")).toHaveText("Action: patient prioritized");
    await expect(page.getByTestId("last-event")).toHaveText("Last event: patient-prioritized");
    await page.getByTestId("step").click();
    await expect(page.getByTestId("casebook-summary")).toContainText("#1 Queuing for");
    await expect(page.getByTestId("casebook-summary")).toContainText("#2 On my way to");
});
