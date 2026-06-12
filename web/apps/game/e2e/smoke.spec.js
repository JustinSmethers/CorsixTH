import { expect, test } from "@playwright/test";
import { importAssetsAndEnterPlayableShell } from "./helpers/phase8-import";
function parseMetric(raw, label) {
    const match = raw.match(new RegExp(`^${label}:\\s*(-?\\d+)$`));
    if (!match) {
        throw new Error(`Unable to parse ${label} metric from: ${raw}`);
    }
    return Number(match[1]);
}
test("phase 7 app shell smoke flow: load, interact, pause, step, resume", async ({ page }) => {
    await importAssetsAndEnterPlayableShell(page);
    await expect(page.getByTestId("hospital-canvas-summary")).toContainText("patients 0");
    await page.keyboard.press("KeyQ");
    await expect(page.getByTestId("hospital-placement-mode")).toHaveText("Placement: none");
    await expect(page.getByTestId("hospital-canvas-summary")).toContainText("patients 0");
    await expectCanvasAlpha(page, "hospital-map-canvas");
    await expect(page.getByTestId("hospital-map-select")).toHaveValue("LEVELS/EXAMPLE.MAP");
    await page.getByTestId("hospital-map-select").selectOption("LEVELS/SECOND.MAP");
    await expect(page.getByTestId("hospital-canvas-summary")).toContainText("LEVELS/SECOND.MAP");
    await page.getByTestId("hospital-camera-east").click();
    await expect(page.getByTestId("hospital-canvas-summary")).toContainText("viewport 76,75");
    await page.keyboard.press("ArrowDown");
    await expect(page.getByTestId("hospital-canvas-summary")).toContainText("viewport 76,79");
    await page.getByTestId("save-game").click();
    await expect(page.getByTestId("save-status")).toContainText("Save: tick");
    await page.getByTestId("hospital-map-select").selectOption("LEVELS/EXAMPLE.MAP");
    await expect(page.getByTestId("hospital-canvas-summary")).toContainText("LEVELS/EXAMPLE.MAP");
    await page.getByTestId("load-game").click();
    await expect(page.getByTestId("save-status")).toContainText("Save: loaded tick");
    await expect(page.getByTestId("hospital-map-select")).toHaveValue("LEVELS/SECOND.MAP");
    await expect(page.getByTestId("hospital-canvas-summary")).toContainText("LEVELS/SECOND.MAP");
    await page.keyboard.press("KeyF");
    await expect(page.getByTestId("hospital-placement-mode")).toHaveText("Placement: build GP's Office");
    await page.keyboard.press("KeyQ");
    await expect(page.getByTestId("hospital-placement-mode")).toHaveText("Placement: none");
    await page.keyboard.press("KeyF");
    await expect(page.getByTestId("hospital-placement-mode")).toHaveText("Placement: build GP's Office");
    await page.getByTestId("hospital-map-canvas").hover({ position: { x: 384, y: 160 } });
    await expect(page.getByTestId("hospital-placement-mode")).toContainText("(valid)");
    await page.keyboard.press("Enter");
    await expect(page.getByTestId("action-status")).toHaveText("Action: room built");
    await expect(page.getByTestId("open-diagnosis-rooms")).toHaveText("Open diagnosis rooms: 2");
    await expect(page.getByTestId("hospital-canvas-summary")).toContainText("rooms 3");
    await page.getByTestId("hospital-map-canvas").click({ position: { x: 384, y: 160 } });
    await expect(page.getByTestId("selection-status")).toContainText("Selection: GP's Office room");
    await page.getByTestId("treatment-room-toggle").click();
    await expect(page.getByTestId("open-diagnosis-rooms")).toHaveText("Open diagnosis rooms: 1");
    await page.getByTestId("treatment-room-toggle").click();
    await expect(page.getByTestId("open-diagnosis-rooms")).toHaveText("Open diagnosis rooms: 2");
    await page.getByTestId("build-treatment-room").click();
    await page.getByTestId("playfield").focus();
    await page.keyboard.press("Enter");
    await expect(page.getByTestId("hospital-placement-mode")).toHaveText("Placement: build Ward");
    await page.getByTestId("hospital-map-canvas").hover({ position: { x: 384, y: 160 } });
    await expect(page.getByTestId("hospital-placement-mode")).toContainText("blocked: occupied");
    await page.keyboard.press("KeyE");
    await expect(page.getByTestId("action-status")).toHaveText("Action: room blocked: occupied");
    await expect(page.getByTestId("open-treatment-rooms")).toHaveText("Open treatment rooms: 1");
    await expect(page.getByTestId("hospital-canvas-summary")).toContainText("rooms 3");
    await page.getByTestId("hire-nurse").click();
    await expect(page.getByTestId("hospital-placement-mode")).toHaveText("Placement: hire Nurse");
    await page.getByTestId("hospital-map-canvas").hover({ position: { x: 416, y: 176 } });
    await expect(page.getByTestId("hospital-placement-mode")).toContainText("(valid)");
    await page.getByTestId("hospital-map-canvas").click({ position: { x: 416, y: 176 } });
    await expect(page.getByTestId("action-status")).toHaveText("Action: staff hired");
    await expect(page.getByTestId("active-staff")).toHaveText("Active staff: 3");
    await expect(page.getByTestId("hospital-canvas-summary")).toContainText("staff 3");
    await page.getByTestId("hospital-map-canvas").click({ position: { x: 416, y: 176 } });
    await expect(page.getByTestId("selection-status")).toContainText("Selection: Nurse");
    await page.getByTestId("staff-break-toggle").click();
    await expect(page.getByTestId("active-staff")).toHaveText("Active staff: 2");
    await expect(page.getByTestId("on-break-staff")).toHaveText("On-break staff: 1");
    await page.getByTestId("staff-break-toggle").click();
    await expect(page.getByTestId("active-staff")).toHaveText("Active staff: 3");
    await expect(page.getByTestId("on-break-staff")).toHaveText("On-break staff: 0");
    await expect(page.getByTestId("seed")).toHaveText("Seed: 1234");
    const tickMetric = page.getByTestId("tick");
    const treatedMetric = page.getByTestId("treated");
    const waitingMetric = page.getByTestId("waiting");
    const pauseToggle = page.getByTestId("pause-toggle");
    await expect
        .poll(async () => parseMetric(await tickMetric.textContent().then((text) => text ?? ""), "Tick"), {
        timeout: 3000
    })
        .toBeGreaterThan(0);
    await page.keyboard.press("KeyZ");
    await expect(page.getByTestId("speed-status")).toHaveText("Speed: 2x");
    await page.keyboard.press("KeyZ");
    await expect(page.getByTestId("speed-status")).toHaveText("Speed: 4x");
    await expect(page.getByTestId("action-status")).toHaveText("Action: speed changed");
    const tickAfterSpeedChange = parseMetric((await tickMetric.textContent()) ?? "", "Tick");
    await expect
        .poll(async () => parseMetric(await tickMetric.textContent().then((text) => text ?? ""), "Tick"), {
        timeout: 3000
    })
        .toBeGreaterThan(tickAfterSpeedChange + 2);
    await pauseToggle.click();
    await expect(page.getByTestId("paused")).toHaveText("Paused: yes");
    const tickAtPause = parseMetric((await tickMetric.textContent()) ?? "", "Tick");
    await page.waitForTimeout(600);
    const tickWhilePaused = parseMetric((await tickMetric.textContent()) ?? "", "Tick");
    expect(tickWhilePaused).toBe(tickAtPause);
    await page.getByTestId("step").click();
    await expect(tickMetric).toHaveText(`Tick: ${tickAtPause + 1}`);
    await page.getByTestId("save-slot-name").fill("slot-clean");
    await page.getByTestId("save-game").click();
    await expect(page.getByTestId("save-status")).toContainText("Save: tick");
    await page.getByTestId("hospital-map-canvas").click({ button: "right", position: { x: 384, y: 160 } });
    await expect(waitingMetric).toHaveText("Waiting: 1");
    await expect(page.getByTestId("hospital-canvas-summary")).toContainText("patients 1");
    await page.getByTestId("save-slot-name").fill("slot-dirty");
    await page.getByTestId("save-game").click();
    await expect(page.getByTestId("save-status")).toContainText("Save: tick");
    await page.getByTestId("refresh-save-slots").click();
    await expect(page.getByTestId("save-status")).toContainText("slots");
    await page.getByTestId("save-slot-select").selectOption("slot-clean");
    await expect(page.getByTestId("save-slot-name")).toHaveValue("slot-clean");
    await page.getByTestId("load-game").click();
    await expect(page.getByTestId("save-status")).toContainText("Save: loaded tick");
    await expect(tickMetric).toHaveText(`Tick: ${tickAtPause + 1}`);
    await expect(waitingMetric).toHaveText("Waiting: 0");
    await page.getByTestId("save-slot-name").fill("slot-dirty");
    await page.getByTestId("load-game").click();
    await expect(page.getByTestId("save-status")).toContainText("Save: loaded tick");
    await expect(waitingMetric).toHaveText("Waiting: 1");
    await page.getByTestId("delete-save-slot").click();
    await expect(page.getByTestId("save-status")).toHaveText("Save: deleted slot-dirty");
    await page.getByTestId("load-game").click();
    await expect(page.getByTestId("save-status")).toHaveText("Save: no slot");
    await page.getByTestId("save-slot-name").fill("slot-clean");
    await page.getByTestId("load-game").click();
    await expect(page.getByTestId("save-status")).toContainText("Save: loaded tick");
    await expect(waitingMetric).toHaveText("Waiting: 0");
    await expect(page.getByTestId("hospital-canvas-summary")).toContainText("rooms 3");
    await expect(page.getByTestId("hospital-canvas-summary")).toContainText("staff 3");
    await page.getByTestId("hospital-map-canvas").click({ button: "right", position: { x: 384, y: 160 } });
    await expect(waitingMetric).toHaveText("Waiting: 1");
    await page.getByTestId("hospital-map-canvas").click({ position: { x: 384, y: 160 } });
    await expect(page.getByTestId("selection-status")).toContainText("Selection: patient");
    await page.getByTestId("treat").click();
    await expect(waitingMetric).toHaveText("Waiting: 0");
    await expect(treatedMetric).toHaveText("Treated: 1");
    await page.getByTestId("hospital-map-canvas").click({ position: { x: 384, y: 160 } });
    await expect(page.getByTestId("selection-status")).toContainText("Selection: GP's Office room");
    await page.getByTestId("sell-selected-room").click();
    await expect(page.getByTestId("action-status")).toHaveText("Action: room sold");
    await expect(page.getByTestId("hospital-canvas-summary")).toContainText("rooms 2");
    await page.getByTestId("hospital-map-canvas").click({ position: { x: 416, y: 176 } });
    await expect(page.getByTestId("selection-status")).toContainText("Selection: Nurse");
    await page.getByTestId("fire-selected-staff").click();
    await expect(page.getByTestId("action-status")).toHaveText("Action: staff fired");
    await expect(page.getByTestId("hospital-canvas-summary")).toContainText("staff 2");
    const hashText = (await page.getByTestId("hash").textContent()) ?? "";
    expect(hashText).toMatch(/^State hash: [a-f0-9]{8}$/);
    await pauseToggle.click();
    await expect(page.getByTestId("paused")).toHaveText("Paused: no");
    await expect
        .poll(async () => parseMetric(await tickMetric.textContent().then((text) => text ?? ""), "Tick"), {
        timeout: 3000
    })
        .toBeGreaterThan(tickAtPause + 1);
});
test("phase 7 audio flow: gesture-safe init and no Chromium autoplay policy violations", async ({ page }) => {
    const autoplayViolations = [];
    page.on("console", (message) => {
        const text = message.text();
        if (/AudioContext was not allowed to start/i.test(text) || /autoplay/i.test(text)) {
            autoplayViolations.push(text);
        }
    });
    await importAssetsAndEnterPlayableShell(page);
    await expect(page.getByTestId("audio-status")).toHaveText("Audio: waiting-for-user-gesture");
    await page.getByTestId("admit").click();
    await expect(page.getByTestId("audio-status")).toHaveText("Audio: running");
    await expect(page.getByTestId("audio-volume-metric")).toHaveText("Audio volume: 100% (unmuted)");
    await page.getByTestId("playfield").focus();
    await page.keyboard.press("Alt+KeyS");
    await expect(page.getByTestId("audio-volume-metric")).toHaveText("Audio volume: 100% (muted)");
    await page.keyboard.press("Alt+KeyM");
    await expect(page.getByTestId("audio-volume-metric")).toHaveText("Audio volume: 100% (unmuted)");
    await expect.poll(() => autoplayViolations).toEqual([]);
});
test("phase 7 keyboard shortcuts admit explicit severities", async ({ page }) => {
    await importAssetsAndEnterPlayableShell(page);
    await page.getByTestId("pause-toggle").click();
    await page.keyboard.press("Digit3");
    await expect(page.getByTestId("queue-size")).toHaveText("Queue: 1");
    await expect(page.getByTestId("casebook-summary")).toContainText("H48/48");
});
test("phase 7 keyboard shortcuts save and load active slot", async ({ page }) => {
    await importAssetsAndEnterPlayableShell(page);
    await page.getByTestId("pause-toggle").click();
    await page.getByTestId("save-slot-name").fill("keyboard-save-load");
    await page.keyboard.press("KeyC");
    await expect(page.getByTestId("save-slot-name")).toHaveValue("keyboard-save-loadc");
    await page.getByTestId("save-slot-name").fill("keyboard-save-load");
    await page.keyboard.press("Shift+KeyC");
    await expect(page.getByTestId("save-slot-name")).toHaveValue("keyboard-save-loadC");
    await page.getByTestId("save-slot-name").fill("keyboard-save-load");
    await page.keyboard.press("F3");
    await expect(page.locator(":focus")).toHaveAttribute("data-testid", "save-slot-name");
    await page.keyboard.press("F4");
    await expect(page.locator(":focus")).toHaveAttribute("data-testid", "save-slot-name");
    await page.keyboard.press("F5");
    await expect(page.locator(":focus")).toHaveAttribute("data-testid", "save-slot-name");
    await page.keyboard.press("F7");
    await expect(page.locator(":focus")).toHaveAttribute("data-testid", "save-slot-name");
    await page.keyboard.press("F8");
    await expect(page.locator(":focus")).toHaveAttribute("data-testid", "save-slot-name");
    await page.keyboard.press("F9");
    await expect(page.locator(":focus")).toHaveAttribute("data-testid", "save-slot-name");
    await page.keyboard.press("KeyB");
    await expect(page.getByTestId("save-slot-name")).toHaveValue("keyboard-save-loadb");
    await page.getByTestId("save-slot-name").fill("keyboard-save-load");
    await page.getByTestId("playfield").focus();
    await page.keyboard.press("KeyB");
    await expect(page.locator(":focus")).toHaveAttribute("data-testid", "hire-diagnostician");
    await expect(page.getByTestId("hospital-placement-mode")).toHaveText("Placement: none");
    await page.getByTestId("playfield").focus();
    const cashBeforeStaffFocus = (await page.getByTestId("cash").textContent()) ?? "";
    const actionStatusBeforeStaffFocus = (await page.getByTestId("action-status").textContent()) ?? "";
    const activeStaffBeforeFocus = (await page.getByTestId("active-staff").textContent()) ?? "";
    await page.keyboard.press("F3");
    await expect(page.locator(":focus")).toHaveAttribute("data-testid", "active-staff");
    await expect(page.getByTestId("cash")).toHaveText(cashBeforeStaffFocus);
    await expect(page.getByTestId("action-status")).toHaveText(actionStatusBeforeStaffFocus);
    await expect(page.getByTestId("active-staff")).toHaveText(activeStaffBeforeFocus);
    await page.getByTestId("playfield").focus();
    const mapBeforeFocus = (await page.getByTestId("hospital-map-select").inputValue()) ?? "";
    await page.keyboard.press("F4");
    await expect(page.locator(":focus")).toHaveAttribute("data-testid", "hospital-map-select");
    await expect(page.getByTestId("hospital-map-select")).toHaveValue(mapBeforeFocus);
    await page.getByTestId("playfield").focus();
    await page.keyboard.press("KeyC");
    await expect(page.locator(":focus")).toHaveAttribute("data-testid", "casebook-summary");
    await page.getByTestId("playfield").focus();
    await page.keyboard.press("Shift+KeyC");
    await expect(page.locator(":focus")).toHaveAttribute("data-testid", "casebook-summary");
    await page.getByTestId("playfield").focus();
    await page.keyboard.press("F5");
    await expect(page.locator(":focus")).toHaveAttribute("data-testid", "casebook-summary");
    await page.getByTestId("playfield").focus();
    const cashBeforeResearchFocus = (await page.getByTestId("cash").textContent()) ?? "";
    const actionStatusBeforeResearchFocus = (await page.getByTestId("action-status").textContent()) ?? "";
    await page.keyboard.press("F6");
    await expect(page.locator(":focus")).toHaveAttribute("data-testid", "research-status");
    await expect(page.getByTestId("cash")).toHaveText(cashBeforeResearchFocus);
    await expect(page.getByTestId("action-status")).toHaveText(actionStatusBeforeResearchFocus);
    await page.getByTestId("playfield").focus();
    const cashBeforeStatusFocus = (await page.getByTestId("cash").textContent()) ?? "";
    const actionStatusBeforeStatusFocus = (await page.getByTestId("action-status").textContent()) ?? "";
    const levelObjectiveStatusBeforeFocus = (await page.getByTestId("level-objective-status").textContent()) ?? "";
    await page.keyboard.press("F7");
    await expect(page.locator(":focus")).toHaveAttribute("data-testid", "level-objective-status");
    await expect(page.getByTestId("cash")).toHaveText(cashBeforeStatusFocus);
    await expect(page.getByTestId("action-status")).toHaveText(actionStatusBeforeStatusFocus);
    await expect(page.getByTestId("level-objective-status")).toHaveText(levelObjectiveStatusBeforeFocus);
    await page.getByTestId("playfield").focus();
    const cashBeforeChartsFocus = (await page.getByTestId("cash").textContent()) ?? "";
    const actionStatusBeforeChartsFocus = (await page.getByTestId("action-status").textContent()) ?? "";
    const cashflowNetBeforeFocus = (await page.getByTestId("cashflow-net").textContent()) ?? "";
    await page.keyboard.press("F8");
    await expect(page.locator(":focus")).toHaveAttribute("data-testid", "cashflow-net");
    await expect(page.getByTestId("cash")).toHaveText(cashBeforeChartsFocus);
    await expect(page.getByTestId("action-status")).toHaveText(actionStatusBeforeChartsFocus);
    await expect(page.getByTestId("cashflow-net")).toHaveText(cashflowNetBeforeFocus);
    await page.getByTestId("playfield").focus();
    const admissionPolicyBeforeFocus = (await page.getByTestId("admission-policy-status").textContent()) ?? "";
    const pricingPolicyBeforeFocus = (await page.getByTestId("pricing-policy-status").textContent()) ?? "";
    await page.keyboard.press("F9");
    await expect(page.locator(":focus")).toHaveAttribute("data-testid", "admission-policy");
    await expect(page.getByTestId("admission-policy-status")).toHaveText(admissionPolicyBeforeFocus);
    await expect(page.getByTestId("pricing-policy-status")).toHaveText(pricingPolicyBeforeFocus);
    await page.getByTestId("pricing-policy").focus();
    await page.keyboard.press("F9");
    await expect(page.locator(":focus")).toHaveAttribute("data-testid", "pricing-policy");
    await expect(page.getByTestId("pricing-policy")).toHaveValue("standard");
    await page.getByTestId("playfield").focus();
    await page.keyboard.press("Shift+KeyS");
    await expect(page.getByTestId("save-status")).toContainText("keyboard-save-load");
    await page.keyboard.press("Digit1");
    await expect(page.getByTestId("waiting")).toHaveText("Waiting: 1");
    await page.keyboard.press("Shift+KeyL");
    await expect(page.getByTestId("save-status")).toContainText("Save: loaded tick");
    await expect(page.getByTestId("waiting")).toHaveText("Waiting: 0");
});

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
