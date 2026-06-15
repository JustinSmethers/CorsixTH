import { expect, test } from "@playwright/test";
import { importAssetsAndEnterPlayableShell } from "./helpers/phase8-import";

async function placeOnFirstValidTile(page, buttonTestId) {
  await page.getByTestId(buttonTestId).click();
  const canvas = page.getByTestId("hospital-map-canvas");
  for (const y of [128, 160, 192, 224, 256, 288, 320]) {
    for (const x of [256, 288, 320, 352, 384, 416, 448, 480, 512]) {
      await canvas.hover({ position: { x, y } });
      const placement =
        (await page.getByTestId("hospital-placement-mode").textContent()) ?? "";
      if (!placement.includes("(valid)")) {
        continue;
      }
      await canvas.click({ position: { x, y } });
      return { x, y };
    }
  }
  throw new Error(`No valid placement found for ${buttonTestId}`);
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

async function stepUntilDischarged(page, expectedDischarges, maxSteps) {
  for (let step = 0; step < maxSteps; step += 1) {
    if (
      (await page.getByTestId("discharged").textContent()) ===
      `Discharged: ${expectedDischarges}`
    ) {
      return;
    }
    await page.getByTestId("step").click();
  }
  await expect(page.getByTestId("discharged")).toHaveText(
    `Discharged: ${expectedDischarges}`,
  );
}

async function admitDiagnoseAndTreatOne(page, expectedDischarges) {
  await page.getByTestId("admit").click();
  await expect(page.getByTestId("reception-size")).toContainText(
    "Reception: 1",
  );
  await stepUntilText(page, "diagnosed-size", "Diagnosed: 1", 192);
  await page.getByTestId("treat").click();
  await stepUntilDischarged(page, expectedDischarges, 16);
  await expect(page.getByTestId("waiting")).toHaveText("Waiting: 0");
}

test("playable loop: build, hire, route, treat, save, and restore objective progress", async ({
  page,
}) => {
  await importAssetsAndEnterPlayableShell(page);
  await page.getByTestId("pause-toggle").click();
  await expect(page.getByTestId("paused")).toHaveText("Paused: yes");
  await expect(page.getByTestId("campaign-progress")).toHaveText(
    "Campaign: level 1/2",
  );
  await expect(page.getByTestId("hospital-canvas-summary")).toContainText(
    "LEVELS/EXAMPLE.MAP",
  );
  await expect(page.getByTestId("level-objective-status")).toHaveText(
    "Level status: running",
  );
  await expect(page.getByTestId("level-objective-progress")).toHaveText(
    "Objective: discharge 0/3",
  );

  await placeOnFirstValidTile(page, "build-diagnosis-room");
  await expect(page.getByTestId("action-status")).toHaveText(
    "Action: room built",
  );
  await expect(page.getByTestId("hospital-canvas-summary")).toContainText(
    "rooms 3",
  );
  await placeOnFirstValidTile(page, "hire-diagnostician");
  await expect(page.getByTestId("action-status")).toHaveText(
    "Action: staff hired",
  );
  await expect(page.getByTestId("hospital-canvas-summary")).toContainText(
    "staff 3",
  );
  await placeOnFirstValidTile(page, "hire-receptionist");
  await expect(page.getByTestId("action-status")).toHaveText(
    "Action: staff hired",
  );
  await expect(page.getByTestId("front-desk-status")).toHaveText(
    "Front desk: 1 active receptionists, capacity 4, intake cap 8",
  );
  await expect(page.getByTestId("reception-size")).toHaveText(
    "Reception: 0 waiting, 0 walking, 0 at desk",
  );

  await page.getByTestId("admission-severity").selectOption("1");
  await admitDiagnoseAndTreatOne(page, 1);
  await admitDiagnoseAndTreatOne(page, 2);
  await expect(page.getByTestId("level-objective-progress")).toHaveText(
    "Objective: discharge 2/3",
  );
  await expect(page.getByTestId("cash")).toContainText("Cash:");
  await expect(page.getByTestId("reputation")).toContainText("Reputation:");

  const restoredSummary =
    (await page.getByTestId("hospital-canvas-summary").textContent()) ?? "";
  const restoredObjective =
    (await page.getByTestId("level-objective-progress").textContent()) ?? "";
  const restoredCash = (await page.getByTestId("cash").textContent()) ?? "";
  const restoredReputation =
    (await page.getByTestId("reputation").textContent()) ?? "";
  const restoredDischarged =
    (await page.getByTestId("discharged").textContent()) ?? "";
  const saveSlot = `playable-loop-${Date.now()}`;
  await page.getByTestId("save-slot-name").fill(saveSlot);
  await page.getByTestId("save-game").click();
  await expect(page.getByTestId("save-status")).toContainText(`(${saveSlot})`);

  const extraNursePosition = await placeOnFirstValidTile(page, "hire-nurse");
  await expect(page.getByTestId("hospital-canvas-summary")).toContainText(
    "staff 5",
  );
  await page
    .getByTestId("hospital-map-canvas")
    .click({ position: extraNursePosition });
  await expect(page.getByTestId("selection-status")).toContainText(
    "Selection:",
  );
  await page.getByTestId("fire-selected-staff").click();
  await expect(page.getByTestId("action-status")).toHaveText(
    "Action: staff fired",
  );
  await expect(page.getByTestId("hospital-canvas-summary")).toContainText(
    "staff 4",
  );
  const extraRoomPosition = await placeOnFirstValidTile(
    page,
    "build-treatment-room",
  );
  await expect(page.getByTestId("hospital-canvas-summary")).toContainText(
    "rooms 4",
  );
  await page
    .getByTestId("hospital-map-canvas")
    .click({ position: extraRoomPosition });
  await expect(page.getByTestId("selection-status")).toContainText("room #");
  await page.getByTestId("sell-selected-room").click();
  await expect(page.getByTestId("action-status")).toHaveText(
    "Action: room sold",
  );
  await expect(page.getByTestId("hospital-canvas-summary")).toContainText(
    "rooms 3",
  );
  await page.getByTestId("admit").click();
  await expect(page.getByTestId("waiting")).toHaveText("Waiting: 1");
  await expect(page.getByTestId("reception-size")).toContainText(
    "Reception: 1",
  );

  await page.getByTestId("save-slot-name").fill(saveSlot);
  await page.getByTestId("load-game").click();
  await expect(page.getByTestId("save-status")).toContainText(
    "Save: loaded tick",
  );
  await expect(page.getByTestId("hospital-canvas-summary")).toHaveText(
    restoredSummary,
  );
  await expect(page.getByTestId("level-objective-progress")).toHaveText(
    restoredObjective,
  );
  await expect(page.getByTestId("cash")).toHaveText(restoredCash);
  await expect(page.getByTestId("reputation")).toHaveText(restoredReputation);
  await expect(page.getByTestId("discharged")).toHaveText(restoredDischarged);
  await expect(page.getByTestId("waiting")).toHaveText("Waiting: 0");

  await admitDiagnoseAndTreatOne(page, 3);
  await expect(page.getByTestId("level-objective-status")).toHaveText(
    "Level status: won",
  );
  await expect(page.getByTestId("next-level")).toBeEnabled();
});
