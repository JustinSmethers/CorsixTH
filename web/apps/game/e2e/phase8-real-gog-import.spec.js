import { expect, test } from "@playwright/test";
import { fileURLToPath } from "node:url";
import { expectCanvasNonBlank } from "./helpers/phase8-import";

const realGameDataDirectory = fileURLToPath(new URL("../../../../GameData", import.meta.url));

async function winCurrentLevel(page, maxCycles) {
    for (let index = 0; index < maxCycles; index += 1) {
        if ((await page.getByTestId("level-objective-status").textContent()) === "Level status: won") {
            break;
        }
        await page.getByTestId("admit").click();
        await page.getByTestId("treat").click();
    }
    await expect(page.getByTestId("level-objective-status")).toHaveText("Level status: won");
    await expect(page.getByTestId("next-level")).toBeEnabled();
}

async function stepTicks(page, count) {
    for (let index = 0; index < count; index += 1) {
        await page.getByTestId("step").click();
    }
}

async function expectHospitalCanvasForLevel(page, mapPath) {
    await expect(page.getByTestId("hospital-canvas-summary")).toContainText(mapPath);
    await expectCanvasNonBlank(page, "hospital-map-canvas");
}

test("phase 8 real GoG import: browser loads actual GameData into a playable scenario", async ({ page }) => {
    test.setTimeout(45_000);
    await page.goto("/");
    await expect(page.getByRole("heading", { name: "Phase 8 Asset Import" })).toBeVisible();
    await page.getByTestId("asset-import-picker").setInputFiles(realGameDataDirectory);
    await expect(page.getByTestId("asset-import-status")).toHaveText("Ready to import. Diagnostics are clear.");
    await expect(page.getByTestId("asset-import-diagnostics")).toContainText("Detected import folder prefix");
    await expect(page.getByTestId("asset-import-diagnostics")).toContainText("Import validation succeeded");

    await page.getByTestId("asset-import-confirm").click();
    await expect(page.getByRole("heading", { name: "CorsixTH Browser Hospital" })).toBeVisible();
    await expect(page.getByTestId("hospital-map-select")).toHaveValue("LEVELS/LEVEL.L1");
    await expectHospitalCanvasForLevel(page, "LEVELS/LEVEL.L1");
    await expect(page.getByTestId("campaign-progress")).toHaveText("Campaign: level 1/12 (Level One (19-02-97))");
    await expect(page.getByTestId("level-objective-progress")).toHaveText(/^Objective: discharge 0\/10, cash \d+\/1000, reputation \d+\/300, treated \d+\/40%, value \d+\/55000$/u);
    await expect(page.getByTestId("level-objective-safety")).toContainText("cash > -2000");
    await expect(page.getByTestId("level-objective-safety")).toContainText("reputation >= 300");
    await expect(page.getByTestId("cash")).toHaveText(/^Cash: \d+; scenario start 40000, land 25\/tile$/u);
    await expect(page.getByTestId("loan-interest")).toHaveText("Loan interest: 0 tick, 0 total; scenario 1/chunk");
    await expect(page.getByTestId("research-effect")).toContainText("scenario rating 100, divisor 5");
    await expect(page.getByTestId("research-effect")).toContainText("start cost 100, min drug 50, improve 5");
    await expect(page.getByTestId("research-effect")).toContainText("object strength 20/2, autopsy 33%/-25%");
    await expect(page.getByTestId("staff-training-status")).toHaveText("Training: 0 active, 0 started, 0 complete; scenario rate 40, values 3, abilities 3 (75/60/45), promo 6/12, thresholds 250/750");
    await expect(page.getByTestId("staff-market-status")).toHaveText("Staff market: doctors 7, nurses 7, handymen 3, receptionists 8, consultants 0, juniors 10, psych 3, surgeons 0, researchers 0, receptionists target 8; scenario staff month 0, seed 4953");
    await expect(page.getByTestId("room-availability")).toContainText("GP's Office");
    await expect(page.getByTestId("object-availability")).toContainText("available: Inflator Machine, Pharmacy Cabinet, Desk +");
    await expect(page.getByTestId("object-availability")).toContainText("disabled: Cardiogram, Scanner, Ultrascan +");
    await expect(page.getByTestId("scenario-expertise")).toHaveText("Scenario expertise: 2/7 known, 0 research-required, diagnosable 4, capability 100");
    await expect(page.getByTestId("scenario-opponents")).toHaveText("Scenario opponents: 3/3 active (ORAC, COLOSSUS, HAL)");
    await expect(page.getByTestId("scenario-network-criteria")).toHaveText("Network criteria: none");
    await expect(page.getByTestId("emergency-status")).toContainText("scenario disaster 200 ticks");
    await expect(page.getByTestId("epidemic-reward")).toContainText("scenario contagious 25/25, reduce 14m/20/0, fine 2000, comp 1000-15000");
    await expect(page.getByTestId("event-count")).toHaveText("Events: 1; scenario score 300, vacc 50, rats 3000, abduct 4y/2 (0 triggered), mayor 150, disaster 200");
    await expect(page.getByTestId("hospital-awards")).toContainText("scenario cures 10, trophy reputation 400, reputation 600, value 60000");
    await expect(page.getByTestId("hospital-awards")).toContainText("rats 10, rat accuracy 11%, plants watered 80%, mayor fail <= 5%, staff happy 85%");
    await expect(page.getByTestId("quake-status")).toHaveText("Quake: none");

    await page.getByTestId("save-slot-name").fill("real-gog-import");
    await page.getByTestId("save-game").click();
    await expect(page.getByTestId("save-status")).toContainText("Save: tick");
    await page.reload();
    await expect(page.getByRole("heading", { name: "CorsixTH Browser Hospital" })).toBeVisible();
    await page.getByTestId("save-slot-name").fill("real-gog-import");
    await page.getByTestId("load-game").click();
    await expect(page.getByTestId("save-status")).toContainText("Save: loaded tick");
    await expect(page.getByTestId("campaign-progress")).toHaveText("Campaign: level 1/12 (Level One (19-02-97))");
    await expectHospitalCanvasForLevel(page, "LEVELS/LEVEL.L1");
    await expect(page.getByTestId("level-objective-progress")).toHaveText(/^Objective: discharge 0\/10, cash \d+\/1000, reputation \d+\/300, treated \d+\/40%, value \d+\/55000$/u);
    await expect(page.getByTestId("scenario-opponents")).toHaveText("Scenario opponents: 3/3 active (ORAC, COLOSSUS, HAL)");
    await expect(page.getByTestId("event-count")).toHaveText("Events: 1; scenario score 300, vacc 50, rats 3000, abduct 4y/2 (0 triggered), mayor 150, disaster 200");

    await winCurrentLevel(page, 30);
    await page.getByTestId("next-level").click();
    await expect(page.getByTestId("hospital-map-select")).toHaveValue("LEVELS/LEVEL.L2");
    await expectHospitalCanvasForLevel(page, "LEVELS/LEVEL.L2");
    await expect(page.getByTestId("campaign-progress")).toHaveText("Campaign: level 2/12 (Level Two (19-02-97))");
    await expect(page.getByTestId("level-objective-progress")).toHaveText(/^Objective: discharge 0\/40, cash \d+\/10000, reputation \d+\/300, treated \d+\/40%, value \d+\/60000$/u);
    await expect(page.getByTestId("level-objective-safety")).toContainText("cash > -10000");
    await expect(page.getByTestId("level-objective-safety")).toContainText("target cash 10000");
    await expect(page.getByTestId("level-objective-safety")).toContainText("/60000");
    await expect(page.getByTestId("level-objective-safety")).toContainText("deaths <= 40 (40 left)");
    await expect(page.getByTestId("research-effect")).toContainText("scenario rating 95, divisor 4");
    await expect(page.getByTestId("scenario-expertise")).toHaveText("Scenario expertise: 3/14 known, 11 research-required, diagnosable 9, capability 100, next research 10000 Sleeping Illness");
    await expect(page.getByTestId("hospital-awards")).toContainText("scenario cures 50, trophy reputation 400, reputation 600, value 65000");
    await expect(page.getByTestId("hospital-awards")).toContainText("rats 10, rat accuracy 12%, plants watered 80%, mayor fail <= 10%, staff happy 85%");
    await expect(page.getByTestId("scenario-opponents")).toHaveText("Scenario opponents: 3/3 active (COLOSSUS, HAL, MULTIVAC)");
    await expect(page.getByTestId("scenario-network-criteria")).toHaveText("Network criteria: none");

    await page.getByTestId("save-slot-name").fill("real-gog-import-level-two");
    await page.getByTestId("save-game").click();
    await expect(page.getByTestId("save-status")).toContainText("Save: tick");
    await page.reload();
    await expect(page.getByRole("heading", { name: "CorsixTH Browser Hospital" })).toBeVisible();
    await page.getByTestId("save-slot-name").fill("real-gog-import-level-two");
    await page.getByTestId("load-game").click();
    await expect(page.getByTestId("save-status")).toContainText("Save: loaded tick");
    await expect(page.getByTestId("hospital-map-select")).toHaveValue("LEVELS/LEVEL.L2");
    await expectHospitalCanvasForLevel(page, "LEVELS/LEVEL.L2");
    await expect(page.getByTestId("campaign-progress")).toHaveText("Campaign: level 2/12 (Level Two (19-02-97))");
    await expect(page.getByTestId("level-objective-progress")).toHaveText(/^Objective: discharge 0\/40, cash \d+\/10000, reputation \d+\/300, treated \d+\/40%, value \d+\/60000$/u);

    await winCurrentLevel(page, 100);
    await page.getByTestId("next-level").click();
    await expect(page.getByTestId("hospital-map-select")).toHaveValue("LEVELS/LEVEL.L3");
    await expectHospitalCanvasForLevel(page, "LEVELS/LEVEL.L3");
    await expect(page.getByTestId("campaign-progress")).toHaveText("Campaign: level 3/12 (Level Three (19-02-97))");
    await expect(page.getByTestId("level-objective-progress")).toHaveText(/^Objective: discharge 0\/60, cash \d+\/20000, reputation \d+\/1, value \d+\/80000$/u);
    await expect(page.getByTestId("level-objective-safety")).toContainText("cash > -5000");
    await expect(page.getByTestId("level-objective-safety")).toContainText("target cash 20000");
    await expect(page.getByTestId("level-objective-safety")).toContainText("/80000");
    await expect(page.getByTestId("level-objective-safety")).toContainText("deaths <= 35 (35 left)");
    await expect(page.getByTestId("research-effect")).toContainText("scenario rating 95, divisor 5");
    await expect(page.getByTestId("scenario-opponents")).toHaveText("Scenario opponents: 3/3 active (HAL, MULTIVAC, HOLLY)");
    await expect(page.getByTestId("emergency-status")).toHaveText(/^Emergency: scheduled next 0 months 4-5 \(2-4 patients, need 75%, [A-Za-z '-]+\); scenario scheduled 19, active none, disaster 200 ticks$/u);
    await expect(page.getByTestId("quake-status")).toHaveText("Quake: none");

    await page.getByTestId("hospital-map-select").selectOption("LEVELS/LEVEL.L5");
    await expect(page.getByTestId("hospital-map-select")).toHaveValue("LEVELS/LEVEL.L5");
    await expectHospitalCanvasForLevel(page, "LEVELS/LEVEL.L5");
    await expect(page.getByTestId("campaign-progress")).toHaveText("Campaign: level 5/12 (Level Five (19-02-97))");
    await expect(page.getByTestId("level-objective-progress")).toHaveText(/^Objective: discharge 0\/200, cash \d+\/50000, reputation \d+\/400, treated \d+\/45%, value \d+\/120000$/u);
    await expect(page.getByTestId("level-objective-safety")).toContainText("cash > -20000");
    await expect(page.getByTestId("level-objective-safety")).toContainText("target cash 50000");
    await expect(page.getByTestId("level-objective-safety")).toContainText("/120000");
    await expect(page.getByTestId("staff-training-status")).toHaveText("Training: 0 active, 0 started, 0 complete; scenario rate 40, values 3, abilities 3 (60/45/30), promo 6/12, thresholds 250/750");
    await expect(page.getByTestId("staff-market-status")).toHaveText("Staff market: doctors 8, nurses 3, handymen 3, receptionists 5, consultants 255, juniors 2, psych 10, surgeons 10, researchers 10, receptionists target 5; scenario staff month 0, seed 68578");
    await expect(page.getByTestId("scenario-expertise")).toContainText("next research 10000");
    await expect(page.getByTestId("scenario-opponents")).toHaveText("Scenario opponents: 3/3 active (HOLLY, DEEP THOUGHT, ZEN)");
    await expect(page.getByTestId("emergency-status")).toHaveText(/^Emergency: scheduled next 0 months 6-8 \(4-6 patients, need 75%, [A-Za-z '-]+\); scenario scheduled 10, active none, disaster 200 ticks$/u);
    await expect(page.getByTestId("quake-status")).toHaveText("Quake: scheduled 7, active none, severity 0, triggered 0, next 0 months 6-12 severity 1");

    await page.getByTestId("pause-toggle").click();
    await stepTicks(page, 384);
    await expect(page.getByTestId("tick")).toHaveText("Tick: 385");
    await expectHospitalCanvasForLevel(page, "LEVELS/LEVEL.L5");
    await expect(page.getByTestId("staff-market-status")).toHaveText("Staff market: doctors 7, nurses 4, handymen 4, receptionists 4, consultants 255, juniors 1, psych 255, surgeons 255, researchers 255, receptionists target 4; scenario staff month 4, seed 83498");
    await expect(page.getByTestId("quake-status")).toHaveText("Quake: scheduled 7, active none, severity 0, triggered 1, next 1 months 18-24 severity 2");
    await expect(page.getByTestId("emergency-status")).toHaveText(/^Emergency: wave 1 0\/[4-6] saved, need [3-5] \(2[34] ticks, [A-Za-z '-]+\); scenario scheduled 10, active none, disaster 200 ticks$/u);
});
