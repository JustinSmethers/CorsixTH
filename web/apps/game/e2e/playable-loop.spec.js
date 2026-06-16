import { expect, test } from "@playwright/test";
import { importAssetsAndEnterPlayableShell } from "./helpers/phase8-import";

function parseCash(raw) {
  const match = raw.match(/^Cash: (-?\d+)/u);
  if (!match) {
    throw new Error(`Unable to parse cash from: ${raw}`);
  }
  return Number(match[1]);
}

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
  await expect(page.getByTestId("casebook-summary")).toContainText(
    /H\d+\/\d+/u,
  );
  await expect(page.getByTestId("critical-patients")).toHaveText(
    /^Critical patients: \d+, lowest health \d+$/u,
  );
  await expect(page.getByTestId("patient-mood")).toHaveText(
    /^Mood: happy \d+, unhappy \d+, very \d+, peep happy \d+%/u,
  );
  await page.getByTestId("treat").click();
  await stepUntilDischarged(page, expectedDischarges, 16);
  await expect(page.getByTestId("treatment-failures")).toContainText(
    "Treatment failures: 0",
  );
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

  const initialCash = parseCash(
    (await page.getByTestId("cash").textContent()) ?? "",
  );
  await placeOnFirstValidTile(page, "build-diagnosis-room");
  await expect(page.getByTestId("action-status")).toHaveText(
    "Action: room built",
  );
  await expect(page.getByTestId("hospital-canvas-summary")).toContainText(
    "rooms 3",
  );
  const cashAfterDiagnosisRoom = parseCash(
    (await page.getByTestId("cash").textContent()) ?? "",
  );
  expect(cashAfterDiagnosisRoom).toBeLessThan(initialCash);
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
    "Front desk: 1 active receptionists, capacity 4, intake cap 4",
  );
  await expect(page.getByTestId("reception-size")).toHaveText(
    "Reception: 0 waiting, 0 walking, 0 at desk",
  );
  const cashAfterStaffing = parseCash(
    (await page.getByTestId("cash").textContent()) ?? "",
  );
  expect(cashAfterStaffing).toBeLessThan(cashAfterDiagnosisRoom);

  await page.getByTestId("admission-severity").selectOption("1");
  const cashBeforeFirstTreatment = parseCash(
    (await page.getByTestId("cash").textContent()) ?? "",
  );
  await admitDiagnoseAndTreatOne(page, 1);
  const cashAfterFirstTreatment = parseCash(
    (await page.getByTestId("cash").textContent()) ?? "",
  );
  expect(cashAfterFirstTreatment).toBeGreaterThan(cashBeforeFirstTreatment);
  await admitDiagnoseAndTreatOne(page, 2);
  await expect(page.getByTestId("level-objective-progress")).toHaveText(
    "Objective: discharge 2/3",
  );
  await expect(page.getByTestId("cash")).toContainText("Cash:");
  await expect(page.getByTestId("reputation")).toContainText("Reputation:");

  await page.getByTestId("speed-select").selectOption("4");
  await expect(page.getByTestId("speed-status")).toHaveText("Speed: 4x");
  await page.getByTestId("admission-policy").selectOption("aggressive");
  await expect(page.getByTestId("admission-policy-status")).toHaveText(
    "Admission policy: aggressive",
  );
  await page.getByTestId("pricing-policy").selectOption("premium");
  await expect(page.getByTestId("pricing-policy-status")).toHaveText(
    "Pricing: premium, cash 135%, reputation -3/cure",
  );
  await page.getByTestId("admissions-toggle").click();
  await expect(page.getByTestId("admissions-status")).toHaveText(
    "Admissions: open",
  );
  await expect(page.getByTestId("admissions-toggle")).toHaveText(
    "Close Admissions",
  );

  const restoredSummary =
    (await page.getByTestId("hospital-canvas-summary").textContent()) ?? "";
  const restoredObjective =
    (await page.getByTestId("level-objective-progress").textContent()) ?? "";
  const restoredCash = (await page.getByTestId("cash").textContent()) ?? "";
  const restoredReputation =
    (await page.getByTestId("reputation").textContent()) ?? "";
  const restoredDischarged =
    (await page.getByTestId("discharged").textContent()) ?? "";
  const restoredPaused = (await page.getByTestId("paused").textContent()) ?? "";
  const restoredSpeed =
    (await page.getByTestId("speed-status").textContent()) ?? "";
  const restoredAdmissionPolicy =
    await page.getByTestId("admission-policy").inputValue();
  const restoredAdmissionPolicyStatus =
    (await page.getByTestId("admission-policy-status").textContent()) ?? "";
  const restoredPricingPolicy =
    await page.getByTestId("pricing-policy").inputValue();
  const restoredPricingPolicyStatus =
    (await page.getByTestId("pricing-policy-status").textContent()) ?? "";
  const restoredAdmissionsStatus =
    (await page.getByTestId("admissions-status").textContent()) ?? "";
  const restoredAdmissionsToggle =
    (await page.getByTestId("admissions-toggle").textContent()) ?? "";
  const restoredStateHash =
    (await page.getByTestId("hash").textContent()) ?? "";
  const saveSlot = `playable-loop-${Date.now()}`;
  await page.getByTestId("save-slot-name").fill(saveSlot);
  await page.getByTestId("save-game").click();
  await expect(page.getByTestId("save-status")).toContainText(`(${saveSlot})`);

  await page.getByTestId("speed-select").selectOption("1");
  await page.getByTestId("admission-policy").selectOption("conservative");
  await page.getByTestId("pricing-policy").selectOption("discount");
  await page.getByTestId("admissions-toggle").click();
  await expect(page.getByTestId("admissions-status")).toHaveText(
    "Admissions: closed",
  );
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
  await page.getByTestId("hospital-camera-east").click();
  await page.getByTestId("hospital-camera-south").click();
  await page.getByTestId("playfield").focus();
  await page.keyboard.press("Equal");
  await expect(page.getByTestId("hospital-canvas-summary")).toContainText(
    "zoom 150%",
  );
  expect(
    (await page.getByTestId("hospital-canvas-summary").textContent()) ?? "",
  ).not.toBe(restoredSummary);

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
  await expect(page.getByTestId("paused")).toHaveText(restoredPaused);
  await expect(page.getByTestId("speed-status")).toHaveText(restoredSpeed);
  await expect(page.getByTestId("admission-policy")).toHaveValue(
    restoredAdmissionPolicy,
  );
  await expect(page.getByTestId("admission-policy-status")).toHaveText(
    restoredAdmissionPolicyStatus,
  );
  await expect(page.getByTestId("pricing-policy")).toHaveValue(
    restoredPricingPolicy,
  );
  await expect(page.getByTestId("pricing-policy-status")).toHaveText(
    restoredPricingPolicyStatus,
  );
  await expect(page.getByTestId("admissions-status")).toHaveText(
    restoredAdmissionsStatus,
  );
  await expect(page.getByTestId("admissions-toggle")).toHaveText(
    restoredAdmissionsToggle,
  );
  await expect(page.getByTestId("hash")).toHaveText(restoredStateHash);
  await page.getByTestId("admissions-toggle").click();
  await expect(page.getByTestId("admissions-status")).toHaveText(
    "Admissions: closed",
  );

  await admitDiagnoseAndTreatOne(page, 3);
  await expect(page.getByTestId("level-objective-status")).toHaveText(
    "Level status: won",
  );
  await expect(page.getByTestId("admit")).toBeDisabled();
  await expect(page.getByTestId("treat")).toBeDisabled();
  await expect(page.getByTestId("build-diagnosis-room")).toBeDisabled();
  await expect(page.getByTestId("hire-receptionist")).toBeDisabled();
  await expect(page.getByTestId("take-loan")).toBeDisabled();
  await expect(page.getByTestId("start-research")).toBeDisabled();
  await expect(page.getByTestId("admissions-toggle")).toBeDisabled();
  await expect(page.getByTestId("admission-policy")).toBeDisabled();
  await expect(page.getByTestId("pricing-policy")).toBeDisabled();
  await expect(page.getByTestId("next-level")).toBeEnabled();
  await page.getByTestId("next-level").click();
  await expect(page.getByTestId("save-status")).toHaveText(
    "Save: next level LEVELS/SECOND.MAP",
  );
  await expect(page.getByTestId("hospital-map-select")).toHaveValue(
    "LEVELS/SECOND.MAP",
  );
  await expect(page.getByTestId("hospital-canvas-summary")).toContainText(
    "LEVELS/SECOND.MAP",
  );
  await expect(page.getByTestId("campaign-progress")).toHaveText(
    "Campaign: level 2/2",
  );
  await expect(page.getByTestId("level-objective-status")).toHaveText(
    "Level status: running",
  );
  await expect(page.getByTestId("level-objective-progress")).toHaveText(
    /^Objective: discharge 0\/4, cash \d+\/250, reputation \d+\/6$/u,
  );
  await expect(page.getByTestId("waiting")).toHaveText("Waiting: 0");
  await expect(page.getByTestId("next-level")).toBeDisabled();

  const secondLevelSlot = `playable-loop-second-${Date.now()}`;
  const secondLevelObjective =
    (await page.getByTestId("level-objective-progress").textContent()) ?? "";
  const secondLevelSummary =
    (await page.getByTestId("hospital-canvas-summary").textContent()) ?? "";
  await page.getByTestId("save-slot-name").fill(secondLevelSlot);
  await page.getByTestId("save-game").click();
  await expect(page.getByTestId("save-status")).toContainText(
    `(${secondLevelSlot})`,
  );
  await page.getByTestId("hospital-map-select").selectOption("LEVELS/EXAMPLE.MAP");
  await expect(page.getByTestId("campaign-progress")).toHaveText(
    "Campaign: level 1/2",
  );
  await page.getByTestId("save-slot-name").fill(secondLevelSlot);
  await page.getByTestId("load-game").click();
  await expect(page.getByTestId("save-status")).toContainText(
    "Save: loaded tick",
  );
  await expect(page.getByTestId("hospital-map-select")).toHaveValue(
    "LEVELS/SECOND.MAP",
  );
  await expect(page.getByTestId("campaign-progress")).toHaveText(
    "Campaign: level 2/2",
  );
  await expect(page.getByTestId("level-objective-progress")).toHaveText(
    secondLevelObjective,
  );
  await expect(page.getByTestId("hospital-canvas-summary")).toHaveText(
    secondLevelSummary,
  );
});

test("playable loop: front desk capacity blocks manual over-admission", async ({
  page,
}) => {
  await importAssetsAndEnterPlayableShell(page);
  await page.getByTestId("pause-toggle").click();
  await placeOnFirstValidTile(page, "hire-receptionist");
  await expect(page.getByTestId("front-desk-status")).toHaveText(
    "Front desk: 1 active receptionists, capacity 4, intake cap 4",
  );

  for (let index = 0; index < 4; index += 1) {
    await page.getByTestId("admit").click();
  }
  await expect(page.getByTestId("waiting")).toHaveText("Waiting: 4");
  await expect(page.getByTestId("reception-size")).toHaveText(
    "Reception: 4 waiting, 0 walking, 0 at desk",
  );

  await page.getByTestId("admit").click();
  await expect(page.getByTestId("action-status")).toHaveText(
    "Action: admission blocked",
  );
  await expect(page.getByTestId("waiting")).toHaveText("Waiting: 4");
});
