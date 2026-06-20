import { expect, test } from "@playwright/test";
import { phase8FixtureDirectory } from "./helpers/phase8-import";

const scenarioFixtureDirectory = phase8FixtureDirectory("phase8-scenario-valid");
const roomUnlockFixtureDirectory = phase8FixtureDirectory("phase8-scenario-room-unlock");
const objectAvailabilityFixtureDirectory = phase8FixtureDirectory("phase8-scenario-object-availability");
const roomCostFixtureDirectory = phase8FixtureDirectory("phase8-scenario-room-costs");
const objectiveCriteriaFixtureDirectory = phase8FixtureDirectory("phase8-scenario-objective-criteria");
const noCuresObjectiveFixtureDirectory = phase8FixtureDirectory("phase8-scenario-no-cures-objective");
const abductionFixtureDirectory = phase8FixtureDirectory("phase8-scenario-abduction");
const autopsyFixtureDirectory = phase8FixtureDirectory("phase8-scenario-autopsy");
const townEconomyFixtureDirectory = phase8FixtureDirectory("phase8-scenario-town-economy");
const opponentFixtureDirectory = phase8FixtureDirectory("phase8-scenario-opponents");
const emergencyControlFixtureDirectory = phase8FixtureDirectory("phase8-scenario-emergency-control");
const quakeControlFixtureDirectory = phase8FixtureDirectory("phase8-scenario-quake-control");
const staffMarketFixtureDirectory = phase8FixtureDirectory("phase8-scenario-staff-market");
const populationScheduleFixtureDirectory = phase8FixtureDirectory("phase8-scenario-population-schedule");
const epidemicSpreadFixtureDirectory = phase8FixtureDirectory("phase8-scenario-epidemic-spread");
const vaccinationCostFixtureDirectory = phase8FixtureDirectory("phase8-scenario-vaccination-cost");
const epidemicCompensationFixtureDirectory = phase8FixtureDirectory("phase8-scenario-epidemic-compensation");
const patientBehaviorFixtureDirectory = phase8FixtureDirectory("phase8-scenario-patient-behavior");
const ratHoleCleanupFixtureDirectory = phase8FixtureDirectory("phase8-scenario-rat-hole-cleanup");
const awardFixtureDirectory = phase8FixtureDirectory("phase8-scenario-award");
const scoreAwardFixtureDirectory = phase8FixtureDirectory("phase8-scenario-score-award");
const curesAwardFixtureDirectory = phase8FixtureDirectory("phase8-scenario-cures-award");
const deathsAwardFixtureDirectory = phase8FixtureDirectory("phase8-scenario-deaths-award");
const trophyCashAwardFixtureDirectory = phase8FixtureDirectory("phase8-scenario-trophy-cash-awards");
const hospitalValueAwardFixtureDirectory = phase8FixtureDirectory("phase8-scenario-hospital-value-award");
const reputationAwardFixtureDirectory = phase8FixtureDirectory("phase8-scenario-reputation-award");
const landCostFixtureDirectory = phase8FixtureDirectory("phase8-scenario-land-cost");
const researchFloorFixtureDirectory = phase8FixtureDirectory("phase8-scenario-research-floor");
const researchIncrementFixtureDirectory = phase8FixtureDirectory("phase8-scenario-research-increment");
const researchCostGrowthFixtureDirectory = phase8FixtureDirectory("phase8-scenario-research-cost-growth");
const expertiseStartPriceFixtureDirectory = phase8FixtureDirectory("phase8-scenario-expertise-start-price");
const machineStrengthFixtureDirectory = phase8FixtureDirectory("phase8-scenario-machine-strength");
const visualHoldFixtureDirectory = phase8FixtureDirectory("phase8-scenario-visual-hold");
const visualHoldPeepCountFixtureDirectory = phase8FixtureDirectory("phase8-scenario-visual-hold-peep-count");
const visualsAvailableFixtureDirectory = phase8FixtureDirectory("phase8-scenario-visuals-available");
const objectDiseaseGateFixtureDirectory = phase8FixtureDirectory("phase8-scenario-object-disease-gate");
const dnaFixerFixtureDirectory = phase8FixtureDirectory("phase8-scenario-dna-fixer");
const contagiousReducerFixtureDirectory = phase8FixtureDirectory("phase8-scenario-contagious-reducer");
const contagiousRateFixtureDirectory = phase8FixtureDirectory("phase8-scenario-contagious-rate");
const allocationDelayFixtureDirectory = phase8FixtureDirectory("phase8-scenario-allocation-delay");
const allocationWeightsFixtureDirectory = phase8FixtureDirectory("phase8-scenario-allocation-weights");
const routingDistanceFixtureDirectory = phase8FixtureDirectory("phase8-scenario-routing-distance");
const staffModifyFixtureDirectory = phase8FixtureDirectory("phase8-scenario-staff-modify");
const staffWorkLightFixtureDirectory = phase8FixtureDirectory("phase8-scenario-staff-work-light");
const staffResignFixtureDirectory = phase8FixtureDirectory("phase8-scenario-staff-resign");
const staffFatigueThresholdFixtureDirectory = phase8FixtureDirectory("phase8-scenario-staff-fatigue-threshold");
const staffRestStandingFixtureDirectory = phase8FixtureDirectory("phase8-scenario-staff-rest-standing");
const staffRecoveryFactorFixtureDirectory = phase8FixtureDirectory("phase8-scenario-staff-recovery-factor");
const staffWagesFixtureDirectory = phase8FixtureDirectory("phase8-scenario-staff-wages");
const staffRoomRestFixtureDirectory = phase8FixtureDirectory("phase8-scenario-staff-room-rest");
const trainingValuesFixtureDirectory = phase8FixtureDirectory("phase8-scenario-training-values");
const trainingPromotionFixtureDirectory = phase8FixtureDirectory("phase8-scenario-training-promotion");
const trainingThresholdFixtureDirectory = phase8FixtureDirectory("phase8-scenario-training-threshold");
const staffSpecialtyFixtureDirectory = phase8FixtureDirectory("phase8-scenario-staff-specialty");
const skilledSalaryFixtureDirectory = phase8FixtureDirectory("phase8-scenario-skilled-salary");
const customSalaryBandsFixtureDirectory = phase8FixtureDirectory("phase8-scenario-custom-salary-bands");
const salaryThresholdFixtureDirectory = phase8FixtureDirectory("phase8-scenario-salary-threshold");
const salaryTooLowFixtureDirectory = phase8FixtureDirectory("phase8-scenario-salary-too-low");
const cleanlinessAwardFixtureDirectory = phase8FixtureDirectory("phase8-scenario-cleanliness-award");
const peepHappinessAwardFixtureDirectory = phase8FixtureDirectory("phase8-scenario-peep-happiness-award");
const waitingTimesAwardFixtureDirectory = phase8FixtureDirectory("phase8-scenario-waiting-times-award");
const staffHappinessAwardFixtureDirectory = phase8FixtureDirectory("phase8-scenario-staff-happiness-award");
const wellKeptTechAwardFixtureDirectory = phase8FixtureDirectory("phase8-scenario-well-kept-tech-award");
const newTechAwardFixtureDirectory = phase8FixtureDirectory("phase8-scenario-new-tech-award");
const emergencyAwardFixtureDirectory = phase8FixtureDirectory("phase8-scenario-emergency-award");
const populationAwardFixtureDirectory = phase8FixtureDirectory("phase8-scenario-population-award");
const curesVDeathsAwardFixtureDirectory = phase8FixtureDirectory("phase8-scenario-cures-v-deaths-award");
const cansOfCokeAwardFixtureDirectory = phase8FixtureDirectory("phase8-scenario-cans-of-coke-award");
const ratAwardFixtureDirectory = phase8FixtureDirectory("phase8-scenario-rat-award");
const plantAwardFixtureDirectory = phase8FixtureDirectory("phase8-scenario-plant-award");
const mayorAwardFixtureDirectory = phase8FixtureDirectory("phase8-scenario-mayor-award");

async function importScenarioFixture(page, fixtureDirectory = scenarioFixtureDirectory) {
    await page.goto("/");
    await page.getByTestId("asset-import-picker").setInputFiles(fixtureDirectory);
    await expect(page.getByTestId("asset-import-status")).toHaveText("Ready to import. Diagnostics are clear.");
    await page.getByTestId("asset-import-confirm").click();
    await expect(page.getByRole("heading", { name: "CorsixTH Browser Hospital" })).toBeVisible();
}

function parseCash(raw) {
    const match = raw.match(/^Cash:\s*(-?\d+)(?:;.*)?$/u);
    if (!match) {
        throw new Error(`Unable to parse cash metric from: ${raw}`);
    }
    return Number(match[1]);
}

function parseReputation(raw) {
    const match = raw.match(/^Reputation:\s*(-?\d+)$/u);
    if (!match) {
        throw new Error(`Unable to parse reputation metric from: ${raw}`);
    }
    return Number(match[1]);
}

async function selectVisiblePatient(page) {
    const canvas = page.getByTestId("hospital-map-canvas");
    for (let index = 0; index < 16; index += 1) {
        await page.getByTestId("hospital-camera-west").click();
        await page.getByTestId("hospital-camera-north").click();
    }
    await canvas.click({ button: "right", position: { x: 384, y: 160 } });
    await expect(page.getByTestId("action-status")).toHaveText("Action: patient admitted");
    await canvas.click({ position: { x: 384, y: 160 } });
    if (((await page.getByTestId("selection-status").textContent()) ?? "").includes("Selection: patient #")) {
        return;
    }
    for (const y of [32, 48, 64, 80, 96, 112, 128, 144, 160, 176, 192, 208, 224, 240, 256, 272]) {
        for (const x of [128, 160, 192, 224, 256, 288, 320, 352, 384, 416, 448, 480, 512, 544, 576, 608]) {
            await canvas.click({ position: { x, y } });
            const selection = (await page.getByTestId("selection-status").textContent()) ?? "";
            if (selection.includes("Selection: patient #")) {
                return;
            }
        }
    }
    throw new Error("Unable to select visible patient on hospital canvas");
}

async function selectExistingVisiblePatient(page) {
    const canvas = page.getByTestId("hospital-map-canvas");
    for (const y of [32, 48, 64, 80, 96, 112, 128, 144, 160, 176, 192, 208, 224, 240, 256, 272]) {
        for (const x of [128, 160, 192, 224, 256, 288, 320, 352, 384, 416, 448, 480, 512, 544, 576, 608]) {
            await canvas.click({ position: { x, y } });
            const selection = (await page.getByTestId("selection-status").textContent()) ?? "";
            if (selection.includes("Selection: patient #")) {
                return;
            }
        }
    }
    throw new Error("Unable to select existing visible patient on hospital canvas");
}

async function selectVisibleStaff(page, expectedSelection) {
    const canvas = page.getByTestId("hospital-map-canvas");
    for (let index = 0; index < 16; index += 1) {
        await page.getByTestId("hospital-camera-west").click();
        await page.getByTestId("hospital-camera-north").click();
    }
    for (const y of [32, 48, 64, 80, 96, 112, 128, 144, 160, 176, 192, 208, 224, 240, 256, 272]) {
        for (const x of [128, 160, 192, 224, 256, 288, 320, 352, 384, 416, 448, 480, 512, 544, 576, 608]) {
            await canvas.click({ position: { x, y } });
            const selection = (await page.getByTestId("selection-status").textContent()) ?? "";
            if (selection.includes(expectedSelection)) {
                return;
            }
        }
    }
    throw new Error(`Unable to select visible staff: ${expectedSelection}`);
}

async function selectVisibleRoom(page, expectedSelection) {
    const canvas = page.getByTestId("hospital-map-canvas");
    for (let index = 0; index < 16; index += 1) {
        await page.getByTestId("hospital-camera-west").click();
        await page.getByTestId("hospital-camera-north").click();
    }
    for (const y of [32, 48, 64, 80, 96, 112, 128, 144, 160, 176, 192, 208, 224, 240, 256, 272]) {
        for (const x of [128, 160, 192, 224, 256, 288, 320, 352, 384, 416, 448, 480, 512, 544, 576, 608]) {
            await canvas.click({ position: { x, y } });
            const selection = (await page.getByTestId("selection-status").textContent()) ?? "";
            if (selection.includes(expectedSelection)) {
                return;
            }
        }
    }
    throw new Error(`Unable to select visible room: ${expectedSelection}`);
}

async function savedCommandLog(page, slotName) {
    const uniqueSlotName = await saveGameToUniqueSlot(page, slotName);
    return readSavedCommandLog(page, uniqueSlotName);
}

async function saveGameToUniqueSlot(page, slotName) {
    const uniqueSlotName = `${slotName}-${Date.now()}-${Math.floor(Math.random() * 1_000_000)}`;
    await page.getByTestId("save-slot-name").fill(uniqueSlotName);
    await page.getByTestId("save-game").click();
    await expect(page.getByTestId("save-status")).toContainText(uniqueSlotName);
    return uniqueSlotName;
}

async function readSavedCommandLog(page, uniqueSlotName) {
    return page.evaluate(async (slot) => {
        const database = await new Promise((resolve, reject) => {
            const request = window.indexedDB.open("corsixth-browser-runtime", 1);
            request.onerror = () => reject(request.error);
            request.onsuccess = () => resolve(request.result);
        });
        try {
            const record = await new Promise((resolve, reject) => {
                const transaction = database.transaction("save-slots", "readonly");
                const request = transaction.objectStore("save-slots").get(slot);
                request.onerror = () => reject(request.error);
                request.onsuccess = () => resolve(request.result);
            });
            const envelope = JSON.parse(record.serialized);
            return envelope.payload.commandLog;
        }
        finally {
            database.close();
        }
    }, uniqueSlotName);
}

async function savedAdmissionDiseaseIds(page, slotName) {
    return (await savedCommandLog(page, slotName))
        .filter((command) => command.type === "admit-patient" || command.type === "schedule-admit-patient")
        .map((command) => command.diseaseId)
        .filter((diseaseId) => typeof diseaseId === "string");
}

async function stepUntilMetricText(page, testId, expectedText, maxSteps) {
    const locator = page.getByTestId(testId);
    for (let index = 0; index < maxSteps; index += 1) {
        if ((await locator.textContent()) === expectedText) {
            return;
        }
        await page.getByTestId("step").click();
    }
    await expect(locator).toHaveText(expectedText);
}

async function stepUntilMetricContains(page, testId, expectedText, maxSteps) {
    const locator = page.getByTestId(testId);
    for (let index = 0; index < maxSteps; index += 1) {
        if (((await locator.textContent()) ?? "").includes(expectedText)) {
            return;
        }
        await page.getByTestId("step").click();
    }
    await expect(locator).toContainText(expectedText);
}

async function stepUntilMetricNumberAtLeast(page, testId, label, expectedMinimum, maxSteps) {
    const locator = page.getByTestId(testId);
    const pattern = new RegExp(`^${label}: (\\d+)`, "u");
    for (let index = 0; index < maxSteps; index += 1) {
        const match = ((await locator.textContent()) ?? "").match(pattern);
        if (match && Number(match[1]) >= expectedMinimum) {
            return;
        }
        await page.getByTestId("step").click();
    }
    const finalText = (await locator.textContent()) ?? "";
    const finalMatch = finalText.match(pattern);
    expect(finalMatch ? Number(finalMatch[1]) : Number.NaN).toBeGreaterThanOrEqual(expectedMinimum);
}

test("phase 8 scenario import: original SAM criteria drive browser level objectives", async ({ page }) => {
    await importScenarioFixture(page);
    await expect(page.getByTestId("hospital-map-select")).toHaveValue("LEVELS/LEVEL.L1");
    await expect(page.getByTestId("campaign-progress")).toHaveText("Campaign: level 1/2 (Scenario Level One)");
    await expect(page.getByTestId("level-objective-progress")).toHaveText(/^Objective: discharge 0\/10, cash \d+\/1000, reputation \d+\/300, treated \d+\/40%, value \d+\/55000$/u);
    await expect(page.getByTestId("level-objective-safety")).toContainText("cash > -20000");
    await expect(page.getByTestId("level-objective-safety")).toContainText("reputation >= 300");
    await expect(page.getByTestId("level-objective-safety")).toContainText("reputation > 200");
    await expect(page.getByTestId("level-objective-safety")).toContainText("target cash 1000");
    await expect(page.getByTestId("level-objective-safety")).toContainText("treated 100/40%");
    await expect(page.getByTestId("level-objective-safety")).toContainText("value ");
    await expect(page.getByTestId("level-objective-safety")).toContainText("/55000");
    await expect(page.getByTestId("level-objective-safety")).toContainText("deaths <= 50 (50 left)");
    await expect(page.getByTestId("staff-market-status")).toHaveText("Staff market: doctors 7, nurses 7, handymen 3, receptionists 8, consultants 0, juniors 10, psych 3, surgeons 0, researchers 0, receptionists target 8; scenario staff month 0, seed 4953");
    await expect(page.getByTestId("front-desk-status")).toHaveText("Front desk: 0 active receptionists, capacity 0, intake cap 0");
    await expect(page.getByTestId("room-availability")).toHaveText("Room availability: GP's Office, Ward, Inflation Room");
    await expect(page.getByTestId("maintenance-staff-status")).toHaveText("Handymen: 0/0, repairs 0, bonus 1 ticks; scenario wear Inflation Room 12, max default");
    await expect(page.getByTestId("loan-status")).toHaveText("Loan: 0/20000, chunk 5000, available 5000, repay 0");
    await expect(page.getByTestId("loan-interest")).toHaveText("Loan interest: 0 tick, 0 total; scenario 2/chunk");
    await expect(page.getByTestId("build-diagnosis-room")).toHaveText("Build GP's Office (2280)");
    await expect(page.getByTestId("build-treatment-room")).toHaveText("Build Ward (1700)");
    await expect(page.getByTestId("build-pharmacy-room")).toHaveText("Build Pharmacy (500)");
    await expect(page.getByTestId("build-inflation-room")).toHaveText("Build Inflation Room (1500)");
    await expect(page.getByTestId("hire-diagnostician")).toHaveText("Hire Doctor (300, wage 6)");
    await expect(page.getByTestId("hire-nurse")).toHaveText("Hire Nurse (250, wage 5)");
    await expect(page.getByTestId("hire-handyman")).toHaveText("Hire Handyman (200, wage 2)");
    await expect(page.getByTestId("hire-receptionist")).toHaveText("Hire Receptionist (150, wage 2)");
    await expect(page.getByTestId("cash")).toHaveText(/^Cash: \d+; scenario start 40000, land 25\/tile$/u);
    await expect(page.getByTestId("object-availability")).toHaveText("Object availability: 1/2 available, locked 0, disabled 0, research 1; available: Inflator Machine; research: Cardiogram");
    await expect(page.getByTestId("admission-rules")).toHaveText("Scenario holds: visual 0 months/2 patients");
    await expect(page.getByTestId("routing-rules")).toHaveText("Scenario routing: queue 15, distance 1, no-staff 20 (+0 ticks)");
    await expect(page.getByTestId("staff-training-status")).toHaveText("Training: 0 active, 0 started, 0 complete; scenario rate 40, values 2, abilities 3 (75/60/45), promo 6/12, thresholds 250/750");
    await expect(page.getByTestId("salary-pressure")).toHaveText("Salary pressure: underpaid 0, overpaid 0; scenario divisor 10, low -10, high 20, bands 3");
    await expect(page.getByTestId("patient-mood")).toHaveText("Mood: happy 0, unhappy 0, very 0, peep happy 100%; scenario mood 75/50/25, leave 150, litter 25/60, bowel 50/75, vomit 50, comfort 5/10");
    await expect(page.getByTestId("stressed-staff")).toHaveText("Stressed staff: 0, staff happy 100%; scenario work 1, modify 16, resign 150");
    await expect(page.getByTestId("tired-staff")).toHaveText("Tired staff: 0; scenario thresholds 300/600/700/800");
    await expect(page.getByTestId("very-tired-staff")).toHaveText("Very tired staff: 0; scenario rest 3/8/60/30, recovery 450/3");
    await expect(page.getByTestId("event-count")).toHaveText("Events: 1; scenario score 300, vacc 50, rats 3000, abduct 4y/2 (0 triggered), mayor 150, disaster 240");
    await expect(page.getByTestId("hospital-awards")).toContainText("scenario cures 10, reputation 600, value 55000, poor deaths 10");
    await expect(page.getByTestId("hospital-awards")).toContainText("poor thresholds deaths above 10");
    await expect(page.getByTestId("scenario-expertise")).toHaveText("Scenario expertise: 1/3 known, 2 research-required, diagnosable 3, capability 100, next research 10000 Uncommon Cold");
    await expect(page.getByTestId("scenario-opponents")).toHaveText("Scenario opponents: 2/2 active (ORAC, COLOSSUS)");
    await expect(page.getByTestId("scenario-opponent-progress")).toHaveText("Rival leader: COLOSSUS, 0 cures, value 1750, reputation 350; standings COLOSSUS 0/1750/350, ORAC 0/1700/360");
    await expect(page.getByTestId("scenario-network-criteria")).toHaveText(/^Network criteria: 2 \(reputation 1 by month 2; balance 10000 by month 21\); met 2, active 0, missed 0; reputation \d+\/1 met by month 6; balance \d+\/10000 met by month 25$/u);
    await expect(page.getByTestId("emergency-status")).toHaveText(/^Emergency: ready \([2-4] patients\/24 ticks, need [2-3] \/ 75%, Uncommon Cold\); scenario scheduled 1, active 0, disaster 240 ticks$/u);
    await expect(page.getByTestId("emergency-reward")).toHaveText("Emergency reward: 400 cash, +20 reputation, won 0/0, failed 0, saved 100%");
    await expect(page.getByTestId("epidemic-reward")).toHaveText("Epidemic terms: spread 6 ticks/2 max, vacc 50/0, reward 8000/+30, penalty 6000/-35, contained 0/0, failed 0; scenario contagious 25/25, reduce 6m/10/0, fine 2000, comp 1000-15000");
    await expect(page.getByTestId("vip-inspection-reward")).toHaveText("VIP terms: queue <= 2, reputation >= 450, reward 800/+25, penalty 300/-20, pass 0/0, fail 0; scenario mayor 150 ticks");
    await expect
        .poll(async () => page.evaluate(() => window.localStorage.getItem("corsixth.phase8.asset-import.v1") ?? ""))
        .toContain("slack-tongue");
    await expect
        .poll(async () => page.evaluate(() => window.localStorage.getItem("corsixth.phase8.asset-import.v1") ?? ""))
        .toContain("gut-rot");
    await page.getByTestId("save-slot-name").fill("scenario-objective");
    await page.getByTestId("save-game").click();
    await expect(page.getByTestId("save-status")).toContainText("Save: tick");
    await page.reload();
    await expect(page.getByRole("heading", { name: "CorsixTH Browser Hospital" })).toBeVisible();
    await page.getByTestId("save-slot-name").fill("scenario-objective");
    await page.getByTestId("load-game").click();
    await expect(page.getByTestId("save-status")).toContainText("Save: loaded tick");
    await expect(page.getByTestId("hospital-map-select")).toHaveValue("LEVELS/LEVEL.L1");
    await expect(page.getByTestId("campaign-progress")).toHaveText("Campaign: level 1/2 (Scenario Level One)");
    await expect(page.getByTestId("level-objective-progress")).toHaveText(/^Objective: discharge 0\/10, cash \d+\/1000, reputation \d+\/300, treated \d+\/40%, value \d+\/55000$/u);
    await expect(page.getByTestId("level-objective-safety")).toContainText("cash > -20000");
    await expect(page.getByTestId("level-objective-safety")).toContainText("reputation > 200");
    await expect(page.getByTestId("level-objective-safety")).toContainText("target cash 1000");
    await expect(page.getByTestId("level-objective-safety")).toContainText("deaths <= 50 (50 left)");
    await expect(page.getByTestId("scenario-network-criteria")).toHaveText(/^Network criteria: 2 \(reputation 1 by month 2; balance 10000 by month 21\); met 2, active 0, missed 0; reputation \d+\/1 met by month 6; balance \d+\/10000 met by month 25$/u);
    await page.getByTestId("admissions-toggle").click();
    await expect(page.getByTestId("next-admission")).toHaveText(/^Next arrival: \d+ ticks; scenario illness 2, pop 3, pool \d+\/2(?:, next [A-Za-z '-]+)?, allocation 4\/1\/2, delay 3m\/192 ticks, auto \d+ ticks\/cap \d+$/u);
    await page.getByTestId("admissions-toggle").click();

    for (let index = 0; index < 30; index += 1) {
        if ((await page.getByTestId("level-objective-status").textContent()) === "Level status: won") {
            break;
        }
        await page.getByTestId("admit").click();
        await page.getByTestId("treat").click();
    }

    await expect(page.getByTestId("level-objective-status")).toHaveText("Level status: won");
    await expect(page.getByTestId("next-level")).toBeEnabled();
    await page.getByTestId("next-level").click();
    await expect(page.getByTestId("hospital-map-select")).toHaveValue("LEVELS/LEVEL.L2");
    await expect(page.getByTestId("campaign-progress")).toHaveText("Campaign: level 2/2 (Scenario Level Two)");
    await expect(page.getByTestId("level-objective-progress")).toHaveText(/^Objective: discharge 0\/12, cash \d+\/2500, reputation \d+\/450, treated \d+\/50%, value \d+\/70000$/u);
    await expect(page.getByTestId("level-objective-safety")).toContainText("cash > -25000");
    await expect(page.getByTestId("level-objective-safety")).toContainText("reputation >= 450");
    await expect(page.getByTestId("level-objective-safety")).toContainText("reputation > 300");
    await expect(page.getByTestId("level-objective-safety")).toContainText("target cash 2500");
    await expect(page.getByTestId("level-objective-safety")).toContainText("/70000");
    await expect(page.getByTestId("level-objective-safety")).toContainText("deaths <= 40 (40 left)");
    await expect(page.getByTestId("research-effect")).toContainText("next 1500/24 ticks");
    await expect(page.getByTestId("research-effect")).toContainText("throughput 1x/0 researchers");
    await expect(page.getByTestId("research-effect")).toContainText("scenario rating 95, divisor 4");
    await expect(page.getByTestId("staff-training-status")).toHaveText("Training: 0 active, 0 started, 0 complete; scenario rate 40, values 2, abilities 3 (75/60/45), promo 6/12, thresholds 250/750");
    await expect(page.getByTestId("hospital-awards")).toContainText("scenario cures 12, reputation 600, value 70000, poor deaths 10");
    await expect(page.getByTestId("hospital-awards")).toContainText("poor thresholds deaths above 10");
    await expect(page.getByTestId("scenario-expertise")).toHaveText("Scenario expertise: 1/3 known, 2 research-required, diagnosable 3, capability 100, next research 10000 Uncommon Cold");
    await expect(page.getByTestId("scenario-opponents")).toHaveText("Scenario opponents: 2/2 active (ORAC, COLOSSUS)");
    await expect(page.getByTestId("scenario-opponent-progress")).toContainText("Rival leader:");
    await expect(page.getByTestId("scenario-network-criteria")).toHaveText(/^Network criteria: 2 \(reputation 1 by month 2; balance 10000 by month 21\); met 2, active 0, missed 0; reputation \d+\/1 met by month 6; balance \d+\/10000 met by month 25$/u);
    await expect(page.getByTestId("emergency-status")).toHaveText(/^Emergency: ready \([2-4] patients\/24 ticks, need [2-3] \/ 75%, Uncommon Cold\); scenario scheduled 1, active 0, disaster 240 ticks$/u);
});

test("phase 8 scenario import: browser hires use imported salary settings", async ({ page }) => {
    await importScenarioFixture(page);
    await page.getByTestId("pause-toggle").click();
    await expect(page.getByTestId("salary-pressure")).toHaveText("Salary pressure: underpaid 0, overpaid 0; scenario divisor 10, low -10, high 20, bands 3");
    await expect(page.getByTestId("staff-market-status")).toContainText("nurses 7");
    await page.getByTestId("hire-nurse").click();
    const canvas = page.getByTestId("hospital-map-canvas");
    await canvas.hover({ position: { x: 416, y: 176 } });
    await expect(page.getByTestId("hospital-placement-mode")).toContainText("(valid)");
    await canvas.click({ position: { x: 408, y: 184 } });
    await expect(page.getByTestId("action-status")).toHaveText("Action: staff hired");
    await expect(page.getByTestId("staff-market-status")).toContainText("nurses 6");
    await expect(page.getByTestId("salary-pressure")).toHaveText("Salary pressure: underpaid 0, overpaid 1; scenario divisor 10, low -10, high 20, bands 3");
    await expect(page.getByTestId("hospital-canvas-summary")).toContainText("staff 3");
    await canvas.click({ position: { x: 408, y: 184 } });
    await expect(page.getByTestId("selection-status")).toContainText("Selection: Nurse");
    await expect(page.getByTestId("selection-status")).toContainText("skill 1");
});

test("phase 8 scenario import: staff minimum salaries drive browser wages and expenses", async ({ page }) => {
    await importScenarioFixture(page, staffWagesFixtureDirectory);
    await page.getByTestId("pause-toggle").click();
    await expect(page.getByTestId("hire-diagnostician")).toHaveText("Hire Doctor (300, wage 8)");
    await expect(page.getByTestId("hire-nurse")).toHaveText("Hire Nurse (250, wage 7)");
    await expect(page.getByTestId("hire-handyman")).toHaveText("Hire Handyman (200, wage 9)");
    await expect(page.getByTestId("hire-receptionist")).toHaveText("Hire Receptionist (150, wage 8)");

    const canvas = page.getByTestId("hospital-map-canvas");
    await page.getByTestId("hire-handyman").click();
    await canvas.hover({ position: { x: 416, y: 176 } });
    await expect(page.getByTestId("hospital-placement-mode")).toContainText("(valid)");
    await canvas.click({ position: { x: 416, y: 176 } });
    await expect(page.getByTestId("action-status")).toHaveText("Action: staff hired");

    await page.getByTestId("hire-receptionist").click();
    await canvas.hover({ position: { x: 448, y: 176 } });
    await expect(page.getByTestId("hospital-placement-mode")).toContainText("(valid)");
    await canvas.click({ position: { x: 448, y: 176 } });
    await expect(page.getByTestId("action-status")).toHaveText("Action: staff hired");
    await expect(page.getByTestId("staff-market-status")).toContainText("handymen 2, receptionists 7");

    await page.getByTestId("step").click();
    await expect(page.getByTestId("cashflow-net")).toHaveText("Tick cashflow: 0 - 45 = -45 (negative)");
    await expect(page.getByTestId("cashflow-cumulative")).toHaveText("Cumulative cashflow: 0 - 415 = -415");
});

test("phase 8 scenario import: browser staff training uses imported training speed", async ({ page }) => {
    await importScenarioFixture(page);
    await page.getByTestId("pause-toggle").click();
    await page.getByTestId("hire-nurse").click();
    const canvas = page.getByTestId("hospital-map-canvas");
    await canvas.hover({ position: { x: 416, y: 176 } });
    await expect(page.getByTestId("hospital-placement-mode")).toContainText("(valid)");
    await canvas.click({ position: { x: 416, y: 176 } });
    await expect(page.getByTestId("action-status")).toHaveText("Action: staff hired");
    await canvas.click({ position: { x: 416, y: 176 } });
    await expect(page.getByTestId("selection-status")).toContainText("Selection: Nurse");
    await expect(page.getByTestId("selection-status")).toContainText("skill 1");
    await expect(page.getByTestId("staff-training-status")).toHaveText("Training: 0 active, 0 started, 0 complete; scenario rate 40, values 2, abilities 3 (75/60/45), promo 6/12, thresholds 250/750");
    await expect(page.getByTestId("staff-skill-status")).toHaveText("Staff skill: 1/9, trained 1, next 700/4 ticks");
    await expect(page.getByTestId("train-selected-staff")).toBeEnabled();
    await page.getByTestId("train-selected-staff").click();
    await expect(page.getByTestId("action-status")).toHaveText("Action: staff training started");
    await expect(page.getByTestId("staff-training-status")).toHaveText("Training: 1 active, 1 started, 0 complete; scenario rate 40, values 2, abilities 3 (75/60/45), promo 6/12, thresholds 250/750");
    await expect(page.getByTestId("selection-status")).toContainText("training 4");
    await expect(page.getByTestId("train-selected-staff")).toBeDisabled();
    for (let index = 0; index < 3; index += 1) {
        await page.getByTestId("step").click();
    }
    await expect(page.getByTestId("staff-training-status")).toHaveText("Training: 1 active, 1 started, 0 complete; scenario rate 40, values 2, abilities 3 (75/60/45), promo 6/12, thresholds 250/750");
    await expect(page.getByTestId("selection-status")).toContainText("training 1");
    await page.getByTestId("step").click();
    await expect(page.getByTestId("staff-training-status")).toHaveText("Training: 0 active, 1 started, 1 complete; scenario rate 40, values 2, abilities 3 (75/60/45), promo 6/12, thresholds 250/750");
    await expect(page.getByTestId("staff-skill-status")).toHaveText("Staff skill: 2/9, trained 1, next 700/4 ticks");
    await expect(page.getByTestId("selection-status")).toContainText("skill 2");
    await expect(page.getByTestId("last-event")).toHaveText("Last event: staff-training-completed");
});

test("phase 8 scenario import: minimum drug cost floors browser research spend", async ({ page }) => {
    await importScenarioFixture(page, researchFloorFixtureDirectory);
    await page.getByTestId("pause-toggle").click();
    await expect(page.getByTestId("research-effect")).toContainText("next 75/24 ticks");
    await expect(page.getByTestId("research-effect")).toContainText("scenario rating 100, divisor 4, start cost 40, min drug 75");
    await expect(page.getByTestId("research-status")).toContainText("Research: treatment 0/3, invested 0");
    const cashBefore = parseCash((await page.getByTestId("cash").textContent()) ?? "");

    await page.getByTestId("start-research").click();
    await expect(page.getByTestId("research-status")).toContainText("Research: treatment 0/3 (24 ticks), invested 75");
    await expect(page.getByTestId("cash")).toHaveText(new RegExp(`^Cash: ${cashBefore - 75}(?:;.*)?$`, "u"));
});

test("phase 8 scenario import: research increment percent improves browser treatment success", async ({ page }) => {
    await importScenarioFixture(page, researchIncrementFixtureDirectory);
    await page.getByTestId("pause-toggle").click();
    await expect(page.getByTestId("research-effect")).toContainText("Research effect: +25% success, next 100/6 ticks");
    await expect(page.getByTestId("research-effect")).toContainText("scenario rating 95, divisor 1, start cost 100, min drug default, improve default, improve cost default, improve increment 7");

    await page.getByTestId("start-research").click();
    await expect(page.getByTestId("research-status")).toContainText("Research: treatment 0/3 (6 ticks), invested 100");
    for (let index = 0; index < 6; index += 1) {
        await page.getByTestId("step").click();
    }
    await expect(page.getByTestId("research-status")).toContainText("Research: treatment 1/3, invested 100");
    await expect(page.getByTestId("research-effect")).toContainText("Research effect: +32% success, next 100/6 ticks");

    await page.getByTestId("start-research").click();
    await expect(page.getByTestId("research-status")).toContainText("Research: treatment 1/3 (6 ticks), invested 200");
    for (let index = 0; index < 6; index += 1) {
        await page.getByTestId("step").click();
    }
    await expect(page.getByTestId("research-status")).toContainText("Research: treatment 2/3, invested 200");
    await expect(page.getByTestId("research-effect")).toContainText("Research effect: +39% success, next 100/6 ticks");
});

test("phase 8 scenario import: research cost growth and drug improve rate affect browser projects", async ({ page }) => {
    await importScenarioFixture(page, researchCostGrowthFixtureDirectory);
    await page.getByTestId("pause-toggle").click();
    await expect(page.getByTestId("research-effect")).toContainText("Research effect: +25% success, next 100/6 ticks");
    await expect(page.getByTestId("research-effect")).toContainText("scenario rating 95, divisor 1, start cost 100, min drug default, improve 5, improve cost 25");

    await page.getByTestId("start-research").click();
    await expect(page.getByTestId("research-status")).toContainText("Research: treatment 0/3 (6 ticks), invested 100");
    for (let index = 0; index < 6; index += 1) {
        await page.getByTestId("step").click();
    }
    await expect(page.getByTestId("research-status")).toContainText("Research: treatment 1/3, invested 100");
    await expect(page.getByTestId("research-effect")).toContainText("Research effect: +30% success, next 125/6 ticks");

    await page.getByTestId("start-research").click();
    await expect(page.getByTestId("research-status")).toContainText("Research: treatment 1/3 (6 ticks), invested 225");
    for (let index = 0; index < 6; index += 1) {
        await page.getByTestId("step").click();
    }
    await expect(page.getByTestId("research-status")).toContainText("Research: treatment 2/3, invested 225");
    await expect(page.getByTestId("research-effect")).toContainText("Research effect: +35% success, next 150/6 ticks");
});

test("phase 8 scenario import: expertise start prices drive browser treatment income", async ({ page }) => {
    await importScenarioFixture(page, expertiseStartPriceFixtureDirectory);
    await page.getByTestId("pause-toggle").click();
    await expect(page.getByTestId("scenario-expertise")).toContainText("1/2 known");
    const cashBefore = parseCash((await page.getByTestId("cash").textContent()) ?? "");
    await page.getByTestId("admission-severity").selectOption("1");
    await page.getByTestId("admit").click();
    await expect(page.getByTestId("waiting")).toHaveText("Waiting: 1");
    await page.getByTestId("treat").click();
    await expect(page.getByTestId("action-status")).toHaveText("Action: patient treated");
    await expect(page.getByTestId("discharged")).toHaveText("Discharged: 1");
    await expect(page.getByTestId("cash")).toHaveText(new RegExp(`^Cash: ${cashBefore + 300}(?:;.*)?$`, "u"));
});

test("phase 8 scenario import: machine strength and max object strength drive browser maintenance", async ({ page }) => {
    await importScenarioFixture(page, machineStrengthFixtureDirectory);
    await page.getByTestId("pause-toggle").click();
    await expect(page.getByTestId("maintenance-staff-status")).toHaveText("Handymen: 0/0, repairs 0, bonus 1 ticks; scenario wear GP's Office 12, Inflation Room 14, max 14");
    await expect(page.getByTestId("research-effect")).toContainText("object strength 14/2");
    await page.getByTestId("start-research").click();
    for (let index = 0; index < 6; index += 1) {
        await page.getByTestId("step").click();
    }
    await expect(page.getByTestId("research-status")).toHaveText("Research: treatment 2/3, invested 1500");
    for (let index = 0; index < 57; index += 1) {
        await page.getByTestId("step").click();
    }
    await expect(page.getByTestId("tick")).toHaveText("Tick: 64");
    await expect(page.getByTestId("quake-status")).toHaveText("Quake: scheduled 2, active none, severity 0, triggered 1, next 1 months 2-2 severity 1");
    await expect(page.getByTestId("rooms-in-maintenance")).toHaveText("Rooms in maintenance: 1, worn 100%");
    for (let index = 0; index < 15; index += 1) {
        await page.getByTestId("hospital-camera-west").click();
        await page.getByTestId("hospital-camera-north").click();
    }
    const canvas = page.getByTestId("hospital-map-canvas");
    await canvas.click({ position: { x: 384, y: 66 } });
    await expect(page.getByTestId("selection-status")).toContainText("Selection: GP's Office room #1");
    await expect(page.getByTestId("selection-status")).toContainText("open");
    await expect(page.getByTestId("selection-status")).toContainText("wear 13");

    for (let index = 0; index < 64; index += 1) {
        await page.getByTestId("step").click();
    }
    await expect(page.getByTestId("tick")).toHaveText("Tick: 128");
    await expect(page.getByTestId("quake-status")).toHaveText("Quake: scheduled 2, active none, severity 0, triggered 2");
    await canvas.click({ position: { x: 384, y: 66 } });
    await expect(page.getByTestId("selection-status")).toContainText("Selection: GP's Office room #1");
    await expect(page.getByTestId("selection-status")).toContainText("closed");
    await expect(page.getByTestId("selection-status")).toContainText("wear 14");
});

test("phase 8 scenario import: training values drive browser training speed without rate", async ({ page }) => {
    await importScenarioFixture(page, trainingValuesFixtureDirectory);
    await page.getByTestId("pause-toggle").click();
    await expect(page.getByTestId("staff-training-status")).toHaveText("Training: 0 active, 0 started, 0 complete; scenario rate default, values 2, abilities 3 (75/60/45), promo 6/12, thresholds 250/750");
    await page.getByTestId("hire-nurse").click();
    const canvas = page.getByTestId("hospital-map-canvas");
    await canvas.hover({ position: { x: 416, y: 176 } });
    await expect(page.getByTestId("hospital-placement-mode")).toContainText("(valid)");
    await canvas.click({ position: { x: 416, y: 176 } });
    await expect(page.getByTestId("action-status")).toHaveText("Action: staff hired");
    await canvas.click({ position: { x: 416, y: 176 } });
    await expect(page.getByTestId("selection-status")).toContainText("Selection: Nurse");
    await expect(page.getByTestId("staff-skill-status")).toHaveText("Staff skill: 1/9, trained 1, next 700/2 ticks");

    await page.getByTestId("train-selected-staff").click();
    await expect(page.getByTestId("selection-status")).toContainText("training 2");
    await page.getByTestId("step").click();
    await expect(page.getByTestId("selection-status")).toContainText("training 1");
    await page.getByTestId("step").click();
    await expect(page.getByTestId("staff-training-status")).toHaveText("Training: 0 active, 1 started, 1 complete; scenario rate default, values 2, abilities 3 (75/60/45), promo 6/12, thresholds 250/750");
    await expect(page.getByTestId("staff-skill-status")).toHaveText("Staff skill: 2/9, trained 1, next 700/2 ticks");
});

test("phase 8 scenario import: promotion months drive browser training targets", async ({ page }) => {
    await importScenarioFixture(page, trainingPromotionFixtureDirectory);
    await page.getByTestId("pause-toggle").click();
    await expect(page.getByTestId("staff-training-status")).toHaveText("Training: 0 active, 0 started, 0 complete; scenario rate 40, values 2, abilities 3 (75/60/45), promo 1/4, thresholds 250/750");
    await page.getByTestId("hire-nurse").click();
    const canvas = page.getByTestId("hospital-map-canvas");
    await canvas.hover({ position: { x: 416, y: 176 } });
    await expect(page.getByTestId("hospital-placement-mode")).toContainText("(valid)");
    await canvas.click({ position: { x: 416, y: 176 } });
    await expect(page.getByTestId("action-status")).toHaveText("Action: staff hired");
    await canvas.click({ position: { x: 416, y: 176 } });
    await expect(page.getByTestId("selection-status")).toContainText("Selection: Nurse");
    await expect(page.getByTestId("staff-skill-status")).toHaveText("Staff skill: 1/9, trained 1, next 700/4 ticks");

    await page.getByTestId("train-selected-staff").click();
    await expect(page.getByTestId("selection-status")).toContainText("training 1");
    await page.getByTestId("step").click();
    await expect(page.getByTestId("selection-status")).toContainText("skill 2");
    await expect(page.getByTestId("staff-skill-status")).toHaveText("Staff skill: 2/9, trained 1, next 700/4 ticks");

    await page.getByTestId("train-selected-staff").click();
    await expect(page.getByTestId("selection-status")).toContainText("training 3");
    await page.getByTestId("step").click();
    await expect(page.getByTestId("selection-status")).toContainText("training 2");
    await page.getByTestId("step").click();
    await expect(page.getByTestId("selection-status")).toContainText("training 1");
    await page.getByTestId("step").click();
    await expect(page.getByTestId("selection-status")).toContainText("skill 3");
    await expect(page.getByTestId("staff-training-status")).toHaveText("Training: 0 active, 2 started, 2 complete; scenario rate 40, values 2, abilities 3 (75/60/45), promo 1/4, thresholds 250/750");
});

test("phase 8 scenario import: selected staff rest uses imported staff room values", async ({ page }) => {
    await importScenarioFixture(page);
    await page.getByTestId("pause-toggle").click();
    await expect(page.getByTestId("very-tired-staff")).toHaveText("Very tired staff: 0; scenario rest 3/8/60/30, recovery 450/3");
    for (let index = 0; index < 4; index += 1) {
        await page.getByTestId("admission-severity").selectOption("3");
        await page.getByTestId("admit").click();
    }
    for (let index = 0; index < 16; index += 1) {
        await page.getByTestId("step").click();
    }
    await expect(page.getByTestId("stressed-staff")).toContainText("scenario work 1, modify 16, resign 150");
    await selectVisibleStaff(page, "Selection: Doctor #1");
    await expect(page.getByTestId("rest-selected-staff")).toBeDisabled();
    await page.getByTestId("staff-break-toggle").click();
    await expect(page.getByTestId("selection-status")).toContainText("on-break");
    await expect(page.getByTestId("rest-selected-staff")).toBeEnabled();
    await page.getByTestId("rest-selected-staff").click();
    await expect(page.getByTestId("action-status")).toHaveText("Action: staff rested");
    await expect(page.getByTestId("last-event")).toHaveText("Last event: staff-rested");
    await expect(page.getByTestId("staff-recovery-events")).toHaveText("Staff recovery events: 1");
    await expect(page.getByTestId("rest-selected-staff")).toBeDisabled();
});

test("phase 8 scenario import: manual staff room rest uses imported low recovery values", async ({ page }) => {
    await importScenarioFixture(page, staffRoomRestFixtureDirectory);
    await page.getByTestId("pause-toggle").click();
    await expect(page.getByTestId("very-tired-staff")).toHaveText("Very tired staff: 0; scenario rest 1/2/3/4, recovery 450/3");
    await page.getByTestId("admission-severity").selectOption("3");
    for (let index = 0; index < 4; index += 1) {
        await page.getByTestId("admit").click();
    }
    for (let index = 0; index < 5; index += 1) {
        await page.getByTestId("step").click();
    }
    await expect(page.getByTestId("stressed-staff")).toContainText(/^Stressed staff: [1-9]\d*/u);
    await selectVisibleStaff(page, "Selection: Doctor #1");
    await page.getByTestId("staff-break-toggle").click();
    await expect(page.getByTestId("selection-status")).toContainText("on-break");
    await expect(page.getByTestId("rest-selected-staff")).toBeEnabled();
    await page.getByTestId("rest-selected-staff").click();
    await expect(page.getByTestId("staff-recovery-events")).toHaveText("Staff recovery events: 1");
    await expect(page.getByTestId("rest-selected-staff")).toBeEnabled();
    await page.getByTestId("rest-selected-staff").click();
    await expect(page.getByTestId("staff-recovery-events")).toHaveText("Staff recovery events: 2");
});

test("phase 8 scenario import: staff modify frequency delays browser burnout", async ({ page }) => {
    await importScenarioFixture(page, staffModifyFixtureDirectory);
    await page.getByTestId("pause-toggle").click();
    await expect(page.getByTestId("stressed-staff")).toHaveText("Stressed staff: 0, staff happy 100%; scenario work 1, modify 8, resign 150");
    await expect(page.getByTestId("tired-staff")).toHaveText("Tired staff: 0; scenario thresholds 300/600/700/100");
    await page.getByTestId("admission-severity").selectOption("3");
    for (let index = 0; index < 4; index += 1) {
        await page.getByTestId("admit").click();
    }
    for (let index = 0; index < 6; index += 1) {
        await page.getByTestId("step").click();
    }
    await expect(page.getByTestId("staff-burnout-events")).toHaveText("Staff burnout events: 0");
    for (let index = 0; index < 9; index += 1) {
        await page.getByTestId("admit").click();
        await page.getByTestId("step").click();
    }
    await expect(page.getByTestId("staff-burnout-events")).toHaveText(/^Staff burnout events: [1-9]\d*$/u);
});

test("phase 8 scenario import: staff work light accelerates browser burnout", async ({ page }) => {
    await importScenarioFixture(page, staffWorkLightFixtureDirectory);
    await page.getByTestId("pause-toggle").click();
    await expect(page.getByTestId("stressed-staff")).toHaveText("Stressed staff: 0, staff happy 100%; scenario work 2, modify 1, resign 150");
    await expect(page.getByTestId("tired-staff")).toHaveText("Tired staff: 0; scenario thresholds 300/600/700/400");
    await page.getByTestId("admission-severity").selectOption("3");
    for (let index = 0; index < 4; index += 1) {
        await page.getByTestId("admit").click();
    }
    for (let index = 0; index < 12; index += 1) {
        await page.getByTestId("step").click();
    }
    await expect(page.getByTestId("staff-burnout-events")).toHaveText(/^Staff burnout events: [1-9]\d*$/u);
});

test("phase 8 scenario import: staff resign max removes staff after repeated burnout", async ({ page }) => {
    await importScenarioFixture(page, staffResignFixtureDirectory);
    await page.getByTestId("pause-toggle").click();
    await expect(page.getByTestId("active-staff")).toHaveText("Active staff: 2");
    await expect(page.getByTestId("stressed-staff")).toHaveText("Stressed staff: 0, staff happy 100%; scenario work 10, modify 1, resign 150");
    await expect(page.getByTestId("very-tired-staff")).toHaveText("Very tired staff: 0; scenario rest 3/8/60/30, recovery 450/1");
    await page.getByTestId("admission-severity").selectOption("3");

    for (let index = 0; index < 24; index += 1) {
        if ((await page.getByTestId("active-staff").textContent()) === "Active staff: 1") {
            break;
        }
        await page.getByTestId("admit").click();
        await page.getByTestId("step").click();
    }

    await expect(page.getByTestId("active-staff")).toHaveText("Active staff: 1");
    await expect(page.getByTestId("staff-burnout-events")).toHaveText(/^Staff burnout events: [1-9]\d*$/u);
    await expect(page.getByTestId("recent-events")).toContainText("staff-resigned");
});

test("phase 8 scenario import: fatigue thresholds drive tired browser staff counts", async ({ page }) => {
    await importScenarioFixture(page, staffFatigueThresholdFixtureDirectory);
    await page.getByTestId("pause-toggle").click();
    await expect(page.getByTestId("tired-staff")).toHaveText("Tired staff: 0; scenario thresholds 50/100/200/9900");
    await expect(page.getByTestId("very-tired-staff")).toHaveText("Very tired staff: 0; scenario rest 3/8/60/30, recovery 450/3");
    await page.getByTestId("admission-severity").selectOption("3");
    for (let index = 0; index < 4; index += 1) {
        await page.getByTestId("admit").click();
    }
    for (let index = 0; index < 4; index += 1) {
        await page.getByTestId("step").click();
    }
    await expect(page.getByTestId("tired-staff")).toContainText(/^Tired staff: [1-9]\d*/u);
    await expect(page.getByTestId("very-tired-staff")).toContainText(/^Very tired staff: [1-9]\d*/u);
    await expect(page.getByTestId("staff-burnout-events")).toHaveText("Staff burnout events: 0");
});

test("phase 8 scenario import: standing rest recovers idle browser staff", async ({ page }) => {
    await importScenarioFixture(page, staffRestStandingFixtureDirectory);
    await page.getByTestId("pause-toggle").click();
    await expect(page.getByTestId("stressed-staff")).toHaveText("Stressed staff: 0, staff happy 100%; scenario work 10, modify 1, resign 150");
    await expect(page.getByTestId("very-tired-staff")).toHaveText("Very tired staff: 0; scenario rest 50/8/60/30, recovery 450/3");
    await page.getByTestId("admission-severity").selectOption("3");
    for (let index = 0; index < 4; index += 1) {
        await page.getByTestId("admit").click();
    }
    for (let index = 0; index < 4; index += 1) {
        await page.getByTestId("step").click();
    }
    await expect(page.getByTestId("stressed-staff")).toContainText(/^Stressed staff: [1-9]\d*/u);

    for (let index = 0; index < 12; index += 1) {
        await page.getByTestId("treat").click();
    }
    await page.getByTestId("step").click();
    await expect(page.getByTestId("waiting")).toHaveText("Waiting: 0");
    for (let index = 0; index < 3; index += 1) {
        await page.getByTestId("step").click();
    }
    await expect(page.getByTestId("stressed-staff")).toContainText("Stressed staff: 0");
});

test("phase 8 scenario import: recovery factor scales idle browser recovery", async ({ page }) => {
    await importScenarioFixture(page, staffRecoveryFactorFixtureDirectory);
    await page.getByTestId("pause-toggle").click();
    await expect(page.getByTestId("stressed-staff")).toHaveText("Stressed staff: 0, staff happy 100%; scenario work 10, modify 1, resign 150");
    await expect(page.getByTestId("very-tired-staff")).toHaveText("Very tired staff: 0; scenario rest 4/8/60/30, recovery 200/3");
    await page.getByTestId("admission-severity").selectOption("3");
    for (let index = 0; index < 4; index += 1) {
        await page.getByTestId("admit").click();
    }
    for (let index = 0; index < 4; index += 1) {
        await page.getByTestId("step").click();
    }
    await expect(page.getByTestId("stressed-staff")).toContainText(/^Stressed staff: [1-9]\d*/u);

    for (let index = 0; index < 12; index += 1) {
        await page.getByTestId("treat").click();
    }
    await page.getByTestId("step").click();
    await expect(page.getByTestId("waiting")).toHaveText("Waiting: 0");
    await page.getByTestId("step").click();
    await expect(page.getByTestId("stressed-staff")).toContainText(/^Stressed staff: [1-9]\d*/u);
});

test("phase 8 scenario import: browser hires use imported doctor ability thresholds", async ({ page }) => {
    await importScenarioFixture(page);
    await page.getByTestId("pause-toggle").click();
    await expect(page.getByTestId("research-effect")).toContainText("throughput 1x/0 researchers");
    await expect(page.getByTestId("staff-market-status")).toContainText("doctors 7");
    await page.getByTestId("hire-diagnostician").click();
    const canvas = page.getByTestId("hospital-map-canvas");
    await canvas.hover({ position: { x: 416, y: 176 } });
    await expect(page.getByTestId("hospital-placement-mode")).toContainText("(valid)");
    await canvas.click({ position: { x: 416, y: 176 } });
    await expect(page.getByTestId("action-status")).toHaveText("Action: staff hired");
    await expect(page.getByTestId("staff-market-status")).toContainText("doctors 6");
    await expect(page.getByTestId("research-effect")).toContainText("throughput 2x/1 researchers");
    await expect(page.getByTestId("hospital-canvas-summary")).toContainText("staff 3");
    await canvas.click({ position: { x: 416, y: 176 } });
    await expect(page.getByTestId("selection-status")).toContainText("Selection: Doctor");
    await expect(page.getByTestId("selection-status")).toContainText("skill 3");
});

test("phase 8 scenario import: custom doctor thresholds change browser hire quality", async ({ page }) => {
    await importScenarioFixture(page, trainingThresholdFixtureDirectory);
    await page.getByTestId("pause-toggle").click();
    await expect(page.getByTestId("staff-training-status")).toHaveText("Training: 0 active, 0 started, 0 complete; scenario rate 40, values 2, abilities 3 (75/60/45), promo 6/12, thresholds 2000/3000");
    await page.getByTestId("hire-diagnostician").click();
    const canvas = page.getByTestId("hospital-map-canvas");
    await canvas.hover({ position: { x: 416, y: 176 } });
    await expect(page.getByTestId("hospital-placement-mode")).toContainText("(valid)");
    await canvas.click({ position: { x: 416, y: 176 } });
    await expect(page.getByTestId("action-status")).toHaveText("Action: staff hired");
    await canvas.click({ position: { x: 416, y: 176 } });
    await expect(page.getByTestId("selection-status")).toContainText("Selection: Doctor");
    await expect(page.getByTestId("selection-status")).toContainText("skill 0");
});

test("phase 8 scenario import: staff market follows imported month schedule", async ({ page }) => {
    await importScenarioFixture(page);
    await page.getByTestId("pause-toggle").click();
    await expect(page.getByTestId("staff-market-status")).toHaveText("Staff market: doctors 7, nurses 7, handymen 3, receptionists 8, consultants 0, juniors 10, psych 3, surgeons 0, researchers 0, receptionists target 8; scenario staff month 0, seed 4953");
    for (let index = 0; index < 64; index += 1) {
        await page.getByTestId("step").click();
    }
    await expect(page.getByTestId("tick")).toHaveText("Tick: 65");
    await expect(page.getByTestId("staff-market-status")).toHaveText("Staff market: doctors 5, nurses 6, handymen 5, receptionists 6, consultants 0, juniors 10, psych 4, surgeons 0, researchers 0, receptionists target 6; scenario staff month 1, seed 8654");
    await page.getByTestId("hire-handyman").click();
    const canvas = page.getByTestId("hospital-map-canvas");
    await canvas.hover({ position: { x: 416, y: 176 } });
    await expect(page.getByTestId("hospital-placement-mode")).toContainText("(valid)");
    await canvas.click({ position: { x: 416, y: 176 } });
    await expect(page.getByTestId("action-status")).toHaveText("Action: staff hired");
    await expect(page.getByTestId("staff-market-status")).toHaveText("Staff market: doctors 5, nurses 6, handymen 4, receptionists 6, consultants 0, juniors 10, psych 4, surgeons 0, researchers 0, receptionists target 6; scenario staff month 1, seed 8654");
});

test("phase 8 scenario import: custom staff market rows change browser hiring pools", async ({ page }) => {
    await importScenarioFixture(page, staffMarketFixtureDirectory);
    await page.getByTestId("pause-toggle").click();
    await expect(page.getByTestId("staff-market-status")).toHaveText("Staff market: doctors 4, nurses 3, handymen 2, receptionists 3, consultants 50, juniors 60, psych 20, surgeons 30, researchers 40, receptionists target 3; scenario staff month 0, seed 1234");
    for (let index = 0; index < 64; index += 1) {
        await page.getByTestId("step").click();
    }
    await expect(page.getByTestId("tick")).toHaveText("Tick: 65");
    await expect(page.getByTestId("staff-market-status")).toHaveText("Staff market: doctors 2, nurses 1, handymen 1, receptionists 2, consultants 10, juniors 11, psych 7, surgeons 8, researchers 9, receptionists target 2; scenario staff month 1, seed 4321");
});

test("phase 8 scenario import: custom population schedule changes browser admission pacing", async ({ page }) => {
    await importScenarioFixture(page, populationScheduleFixtureDirectory);
    await page.getByTestId("pause-toggle").click();
    await page.getByTestId("hire-receptionist").click();
    await page.getByTestId("hospital-map-canvas").click({ position: { x: 416, y: 176 } });
    await expect(page.getByTestId("front-desk-status")).toHaveText("Front desk: 1 active receptionists, capacity 4, intake cap 4");
    await page.getByTestId("admissions-toggle").click();
    await expect(page.getByTestId("next-admission")).toHaveText(/^Next arrival: \d+ ticks; scenario illness 2, pop 10, pool \d+\/2(?:, next [A-Za-z '-]+)?, allocation 4\/1\/2, delay 0m\/0 ticks, auto 4 ticks\/cap 4$/u);

    for (let index = 0; index < 64; index += 1) {
        await page.getByTestId("step").click();
    }

    await expect(page.getByTestId("tick")).toHaveText("Tick: 65");
    await expect(page.getByTestId("next-admission")).toHaveText(/^Next arrival: \d+ ticks; scenario illness 2, pop -2, pool \d+\/2(?:, next [A-Za-z '-]+)?, allocation 4\/1\/2, delay 0m\/0 ticks, auto 20 ticks\/cap 4$/u);
});

test("phase 8 scenario import: staff market researcher rate creates browser researcher doctors", async ({ page }) => {
    await importScenarioFixture(page, staffSpecialtyFixtureDirectory);
    await page.getByTestId("pause-toggle").click();
    await expect(page.getByTestId("staff-market-status")).toHaveText("Staff market: doctors 2, nurses 7, handymen 3, receptionists 8, consultants 0, juniors 0, psych 0, surgeons 0, researchers 100, receptionists target 8; scenario staff month 0, seed 4953");
    await expect(page.getByTestId("research-effect")).toContainText("throughput 1x/0 researchers");
    await page.getByTestId("hire-diagnostician").click();
    const canvas = page.getByTestId("hospital-map-canvas");
    await canvas.hover({ position: { x: 416, y: 176 } });
    await expect(page.getByTestId("hospital-placement-mode")).toContainText("(valid)");
    await canvas.click({ position: { x: 416, y: 176 } });
    await expect(page.getByTestId("action-status")).toHaveText("Action: staff hired");
    await expect(page.getByTestId("staff-market-status")).toHaveText("Staff market: doctors 1, nurses 7, handymen 3, receptionists 8, consultants 0, juniors 0, psych 0, surgeons 0, researchers 100, receptionists target 8; scenario staff month 0, seed 4953");
    await expect(page.getByTestId("research-effect")).toContainText("throughput 2x/1 researchers");
    await page.getByTestId("start-research").click();
    await expect(page.getByTestId("research-status")).toContainText("Research: treatment 0/3 (6 ticks), invested 1500");

    const saveSlot = await saveGameToUniqueSlot(page, "staff-specialty-researcher");
    await page.reload();
    await expect(page.getByRole("heading", { name: "CorsixTH Browser Hospital" })).toBeVisible();
    await page.getByTestId("save-slot-name").fill(saveSlot);
    await page.getByTestId("load-game").click();
    await expect(page.getByTestId("save-status")).toContainText("Save: loaded tick");
    await expect(page.getByTestId("research-effect")).toContainText("throughput 2x/1 researchers");
});

test("phase 8 scenario import: skilled browser hires use imported salary bands", async ({ page }) => {
    await importScenarioFixture(page, skilledSalaryFixtureDirectory);
    await page.getByTestId("pause-toggle").click();
    await expect(page.getByTestId("staff-market-status")).toHaveText("Staff market: doctors 7, nurses 7, handymen 3, receptionists 8, consultants 100, juniors 0, psych 3, surgeons 0, researchers 0, receptionists target 8; scenario staff month 0, seed 4953");
    await expect(page.getByTestId("salary-pressure")).toHaveText("Salary pressure: underpaid 0, overpaid 0; scenario divisor 10, low -10, high 20, bands 3");
    await page.getByTestId("hire-diagnostician").click();
    const canvas = page.getByTestId("hospital-map-canvas");
    await canvas.hover({ position: { x: 416, y: 176 } });
    await expect(page.getByTestId("hospital-placement-mode")).toContainText("(valid)");
    await canvas.click({ position: { x: 416, y: 176 } });
    await expect(page.getByTestId("action-status")).toHaveText("Action: staff hired");
    await expect(page.getByTestId("staff-market-status")).toHaveText("Staff market: doctors 6, nurses 7, handymen 3, receptionists 8, consultants 100, juniors 0, psych 3, surgeons 0, researchers 0, receptionists target 8; scenario staff month 0, seed 4953");
    await expect(page.getByTestId("salary-pressure")).toHaveText("Salary pressure: underpaid 0, overpaid 1; scenario divisor 10, low -10, high 20, bands 3");
    await canvas.click({ position: { x: 416, y: 176 } });
    await expect(page.getByTestId("selection-status")).toContainText("Selection: Doctor");
    await expect(page.getByTestId("selection-status")).toContainText("skill 3");
    const cashBeforeTick = parseCash((await page.getByTestId("cash").textContent()) ?? "");
    await page.getByTestId("step").click();
    const cashAfterTick = parseCash((await page.getByTestId("cash").textContent()) ?? "");
    expect(cashAfterTick).toBeLessThan(cashBeforeTick - 20);
});

test("phase 8 scenario import: custom salary bands change browser skilled wages", async ({ page }) => {
    await importScenarioFixture(page, customSalaryBandsFixtureDirectory);
    await page.getByTestId("pause-toggle").click();
    await expect(page.getByTestId("salary-pressure")).toHaveText("Salary pressure: underpaid 0, overpaid 0; scenario divisor 5, low -10, high 20, bands 2");
    await page.getByTestId("hire-diagnostician").click();
    const canvas = page.getByTestId("hospital-map-canvas");
    await canvas.hover({ position: { x: 416, y: 176 } });
    await expect(page.getByTestId("hospital-placement-mode")).toContainText("(valid)");
    await canvas.click({ position: { x: 416, y: 176 } });
    await expect(page.getByTestId("action-status")).toHaveText("Action: staff hired");
    await expect(page.getByTestId("salary-pressure")).toHaveText("Salary pressure: underpaid 0, overpaid 1; scenario divisor 5, low -10, high 20, bands 2");
    await canvas.click({ position: { x: 416, y: 176 } });
    await expect(page.getByTestId("selection-status")).toContainText("Selection: Doctor");
    await expect(page.getByTestId("selection-status")).toContainText("skill 3");
    const cashBeforeTick = parseCash((await page.getByTestId("cash").textContent()) ?? "");
    await page.getByTestId("step").click();
    const cashAfterTick = parseCash((await page.getByTestId("cash").textContent()) ?? "");
    expect(cashAfterTick).toBe(cashBeforeTick - 42);
});

test("phase 8 scenario import: salary-too-high threshold controls browser overpaid pressure", async ({ page }) => {
    await importScenarioFixture(page, salaryThresholdFixtureDirectory);
    await page.getByTestId("pause-toggle").click();
    await expect(page.getByTestId("salary-pressure")).toHaveText("Salary pressure: underpaid 0, overpaid 0; scenario divisor 10, low -10, high 1000, bands 3");
    await page.getByTestId("hire-diagnostician").click();
    const canvas = page.getByTestId("hospital-map-canvas");
    await canvas.hover({ position: { x: 416, y: 176 } });
    await expect(page.getByTestId("hospital-placement-mode")).toContainText("(valid)");
    await canvas.click({ position: { x: 416, y: 176 } });
    await expect(page.getByTestId("action-status")).toHaveText("Action: staff hired");
    await canvas.click({ position: { x: 416, y: 176 } });
    await expect(page.getByTestId("selection-status")).toContainText("Selection: Doctor");
    await expect(page.getByTestId("selection-status")).toContainText("skill 3");
    await expect(page.getByTestId("salary-pressure")).toHaveText("Salary pressure: underpaid 0, overpaid 0; scenario divisor 10, low -10, high 1000, bands 3");
    await page.getByTestId("step").click();
    await expect(page.getByTestId("salary-pressure")).toHaveText("Salary pressure: underpaid 0, overpaid 0; scenario divisor 10, low -10, high 1000, bands 3");
});

test("phase 8 scenario import: salary-too-low threshold controls browser underpaid pressure", async ({ page }) => {
    await importScenarioFixture(page, salaryTooLowFixtureDirectory);
    await page.getByTestId("pause-toggle").click();
    await expect(page.getByTestId("salary-pressure")).toHaveText("Salary pressure: underpaid 2, overpaid 0; scenario divisor 10, low 0, high 20, bands 3");
    await page.getByTestId("hire-handyman").click();
    const canvas = page.getByTestId("hospital-map-canvas");
    await canvas.hover({ position: { x: 416, y: 176 } });
    await expect(page.getByTestId("hospital-placement-mode")).toContainText("(valid)");
    await canvas.click({ position: { x: 416, y: 176 } });
    await expect(page.getByTestId("action-status")).toHaveText("Action: staff hired");
    await expect(page.getByTestId("salary-pressure")).toHaveText("Salary pressure: underpaid 2, overpaid 1; scenario divisor 10, low 0, high 20, bands 3");
    await page.getByTestId("step").click();
    await expect(page.getByTestId("salary-pressure")).toHaveText("Salary pressure: underpaid 2, overpaid 1; scenario divisor 10, low 0, high 20, bands 3");
});

test("phase 8 scenario import: browser loans use imported interest", async ({ page }) => {
    await importScenarioFixture(page);
    await page.getByTestId("pause-toggle").click();
    await expect(page.getByTestId("loan-interest")).toHaveText("Loan interest: 0 tick, 0 total; scenario 2/chunk");
    const cashBefore = parseCash((await page.getByTestId("cash").textContent()) ?? "");
    await page.getByTestId("take-loan").click();
    await expect(page.getByTestId("action-status")).toHaveText("Action: loan taken");
    await expect(page.getByTestId("cash")).toHaveText(new RegExp(`^Cash: ${cashBefore + 5000}(?:;.*)?$`, "u"));
    await expect(page.getByTestId("loan-status")).toHaveText("Loan: 5000/20000, chunk 5000, available 5000, repay 5000");
    await expect(page.getByTestId("loan-interest")).toHaveText("Loan interest: 2 tick, 0 total; scenario 2/chunk");
    await page.getByTestId("step").click();
    await expect(page.getByTestId("loan-interest")).toHaveText("Loan interest: 2 tick, 2 total; scenario 2/chunk");
    await expect(page.getByTestId("last-event")).toHaveText("Last event: loan-taken");
});

test("phase 8 scenario import: town economy changes browser cash, loans, and admissions", async ({ page }) => {
    await importScenarioFixture(page, townEconomyFixtureDirectory);
    await page.getByTestId("pause-toggle").click();
    await expect(page.getByTestId("cash")).toHaveText(/^Cash: \d+; scenario start 12345, land 25\/tile$/u);
    await expect(page.getByTestId("loan-interest")).toHaveText("Loan interest: 0 tick, 0 total; scenario 3/chunk");
    const cashBefore = parseCash((await page.getByTestId("cash").textContent()) ?? "");
    await page.getByTestId("take-loan").click();
    await expect(page.getByTestId("cash")).toHaveText(new RegExp(`^Cash: ${cashBefore + 5000}(?:;.*)?$`, "u"));
    await expect(page.getByTestId("loan-interest")).toHaveText("Loan interest: 3 tick, 0 total; scenario 3/chunk");
    await page.getByTestId("step").click();
    await expect(page.getByTestId("loan-interest")).toHaveText("Loan interest: 3 tick, 3 total; scenario 3/chunk");
    await page.getByTestId("hire-receptionist").click();
    await page.getByTestId("hospital-map-canvas").click({ position: { x: 416, y: 176 } });
    await page.getByTestId("admissions-toggle").click();
    await expect(page.getByTestId("next-admission")).toHaveText(/^Next arrival: \d+ ticks; scenario illness 5, pop 3, pool \d+\/2(?:, next [A-Za-z '-]+)?, allocation 4\/1\/2, delay 3m\/192 ticks, auto \d+ ticks\/cap \d+$/u);
});

test("phase 8 scenario import: opponent metadata changes browser rival standings", async ({ page }) => {
    await importScenarioFixture(page, opponentFixtureDirectory);
    await page.getByTestId("pause-toggle").click();
    await expect(page.getByTestId("scenario-opponents")).toHaveText("Scenario opponents: 2/3 active (ASCLEPIUS, GALEN)");
    await expect(page.getByTestId("scenario-opponent-progress")).toHaveText("Rival leader: GALEN, 0 cures, value 2400, reputation 400; standings GALEN 0/2400/400, ASCLEPIUS 0/800/325");
});

test("phase 8 scenario import: browser room builds use imported room and land costs", async ({ page }) => {
    await importScenarioFixture(page);
    await page.getByTestId("pause-toggle").click();
    await expect(page.getByTestId("build-diagnosis-room")).toHaveText("Build GP's Office (2280)");
    await expect(page.getByTestId("cash")).toHaveText(/^Cash: \d+; scenario start 40000, land 25\/tile$/u);
    const cashBefore = parseCash((await page.getByTestId("cash").textContent()) ?? "");
    await page.getByTestId("build-diagnosis-room").click();
    const canvas = page.getByTestId("hospital-map-canvas");
    await canvas.hover({ position: { x: 416, y: 176 } });
    await expect(page.getByTestId("hospital-placement-mode")).toContainText("(valid)");
    await canvas.click({ position: { x: 416, y: 176 } });
    await expect(page.getByTestId("action-status")).toHaveText("Action: room built");
    await expect(page.getByTestId("cash")).toHaveText(new RegExp(`^Cash: ${cashBefore - 2505}(?:;.*)?$`, "u"));
    await expect(page.getByTestId("hospital-canvas-summary")).toContainText("rooms 3");
    await canvas.click({ position: { x: 416, y: 176 } });
    await expect(page.getByTestId("selection-status")).toContainText("Selection: GP's Office room");
    await expect(page.getByTestId("sell-selected-room")).toBeEnabled();
    await page.getByTestId("sell-selected-room").click();
    await expect(page.getByTestId("action-status")).toHaveText("Action: room sold");
    await expect(page.getByTestId("cash")).toHaveText(new RegExp(`^Cash: ${cashBefore - 1253}(?:;.*)?$`, "u"));
    await expect(page.getByTestId("hospital-canvas-summary")).toContainText("rooms 2");
});

test("phase 8 scenario import: custom room and object costs change browser build prices", async ({ page }) => {
    await importScenarioFixture(page, roomCostFixtureDirectory);
    await page.getByTestId("pause-toggle").click();
    await expect(page.getByTestId("build-diagnosis-room")).toHaveText("Build GP's Office (1111)");
    await expect(page.getByTestId("build-inflation-room")).toHaveText("Build Inflation Room (555)");
    const cashBefore = parseCash((await page.getByTestId("cash").textContent()) ?? "");
    await page.getByTestId("build-inflation-room").click();
    const canvas = page.getByTestId("hospital-map-canvas");
    await canvas.hover({ position: { x: 416, y: 176 } });
    await expect(page.getByTestId("hospital-placement-mode")).toContainText("(valid)");
    await canvas.click({ position: { x: 416, y: 176 } });
    await expect(page.getByTestId("action-status")).toHaveText("Action: room built");
    await expect(page.getByTestId("cash")).toHaveText(new RegExp(`^Cash: ${cashBefore - 780}(?:;.*)?$`, "u"));
});

test("phase 8 scenario import: custom objective criteria change browser win and loss thresholds", async ({ page }) => {
    await importScenarioFixture(page, objectiveCriteriaFixtureDirectory);
    await page.getByTestId("pause-toggle").click();
    await expect(page.getByTestId("level-objective-progress")).toHaveText(/^Objective: discharge 0\/2, cash \d+\/1234, reputation \d+\/333, treated \d+\/75%, value \d+\/22222$/u);
    await expect(page.getByTestId("level-objective-safety")).toContainText("cash > -123");
    await expect(page.getByTestId("level-objective-safety")).toContainText("reputation >= 333");
    await expect(page.getByTestId("level-objective-safety")).toContainText("target cash 1234");
    await expect(page.getByTestId("level-objective-safety")).toContainText("reputation > 111");
    await expect(page.getByTestId("level-objective-safety")).toContainText("treated 100/75%");
    await expect(page.getByTestId("level-objective-safety")).toContainText("/22222");
    await expect(page.getByTestId("level-objective-safety")).toContainText("deaths <= 0 (0 left)");
    await page.getByTestId("staff-break-toggle").click();
    await page.getByTestId("admission-severity").selectOption("3");
    await page.getByTestId("admit").click();
    for (let index = 0; index < 48; index += 1) {
        await page.getByTestId("step").click();
    }
    await expect(page.getByTestId("patient-deaths")).toContainText("Deaths: 1");
    await expect(page.getByTestId("level-objective-status")).toHaveText("Level status: lost (deaths)");
    await expect(page.getByTestId("last-event")).toHaveText("Last event: patient-died");
    await expect(page.getByTestId("admit")).toBeDisabled();
    await expect(page.getByTestId("treat")).toBeDisabled();
    await expect(page.getByTestId("build-diagnosis-room")).toBeDisabled();
    await expect(page.getByTestId("hire-receptionist")).toBeDisabled();
    await expect(page.getByTestId("take-loan")).toBeDisabled();
    await expect(page.getByTestId("repay-loan")).toBeDisabled();
    await expect(page.getByTestId("run-finance-audit")).toBeDisabled();
    await expect(page.getByTestId("start-research")).toBeDisabled();
    await expect(page.getByTestId("start-emergency-wave")).toBeDisabled();
    await expect(page.getByTestId("start-epidemic-outbreak")).toBeDisabled();
    await expect(page.getByTestId("start-vip-inspection")).toBeDisabled();
    await expect(page.getByTestId("run-marketing-campaign")).toBeDisabled();
    await expect(page.getByTestId("start-insurance-contract")).toBeDisabled();
    await expect(page.getByTestId("run-awards-ceremony")).toBeDisabled();
    await expect(page.getByTestId("shoot-rat")).toBeDisabled();
    await expect(page.getByTestId("water-plant")).toBeDisabled();
    await expect(page.getByTestId("restart-level")).toBeEnabled();
    await selectVisibleRoom(page, "Selection: GP's Office room");
    await expect(page.getByTestId("sell-selected-room")).toBeDisabled();
    await expect(page.getByTestId("treatment-room-toggle")).toBeDisabled();
    await selectVisibleStaff(page, "Selection: Nurse");
    await expect(page.getByTestId("fire-selected-staff")).toBeDisabled();
    await expect(page.getByTestId("staff-break-toggle")).toBeDisabled();
});

test("phase 8 scenario import: objectives without cures do not invent browser discharges", async ({ page }) => {
    await importScenarioFixture(page, noCuresObjectiveFixtureDirectory);
    await page.getByTestId("pause-toggle").click();
    await expect(page.getByTestId("level-objective-progress")).toHaveText(/^Objective: discharge 0\/0, cash \d+\/39000, reputation \d+\/1, value \d+\/1000$/u);
    await expect(page.getByTestId("level-objective-safety")).toContainText("reputation >= 1");
    await expect(page.getByTestId("level-objective-safety")).toContainText("target cash 39000");
    await expect(page.getByTestId("level-objective-safety")).toContainText("/1000");
    await expect(page.getByTestId("scenario-opponents")).toHaveText("Scenario opponents: 2/2 active (ORAC, COLOSSUS)");
    await expect(page.getByTestId("scenario-opponent-progress")).not.toContainText("objective rival");
    await expect(page.getByTestId("level-objective-status")).toHaveText("Level status: won");
});

test("phase 8 scenario import: custom land cost changes browser room purchases", async ({ page }) => {
    await importScenarioFixture(page, landCostFixtureDirectory);
    await page.getByTestId("pause-toggle").click();
    await expect(page.getByTestId("build-diagnosis-room")).toHaveText("Build GP's Office (2280)");
    await expect(page.getByTestId("cash")).toHaveText(/^Cash: \d+; scenario start 40000, land 40\/tile$/u);
    const cashBefore = parseCash((await page.getByTestId("cash").textContent()) ?? "");
    await page.getByTestId("build-diagnosis-room").click();
    const canvas = page.getByTestId("hospital-map-canvas");
    await canvas.hover({ position: { x: 416, y: 176 } });
    await expect(page.getByTestId("hospital-placement-mode")).toContainText("(valid)");
    await canvas.click({ position: { x: 416, y: 176 } });
    await expect(page.getByTestId("action-status")).toHaveText("Action: room built");
    await expect(page.getByTestId("cash")).toHaveText(new RegExp(`^Cash: ${cashBefore - 2640}(?:;.*)?$`, "u"));
    await expect(page.getByTestId("hospital-canvas-summary")).toContainText("rooms 3");
});

test("phase 8 scenario import: awards use imported scenario trophy payouts", async ({ page }) => {
    await importScenarioFixture(page, awardFixtureDirectory);
    await page.getByTestId("pause-toggle").click();
    await expect(page.getByTestId("hospital-awards")).toContainText("scenario cures 0, trophy reputation 500, reputation 500, value 0, staff happy 100%, poor deaths 10");
    await expect(page.getByTestId("hospital-awards")).toContainText("Awards: ready, reward 2000/+5");
    await expect(page.getByTestId("hospital-awards")).not.toContainText("pending");
    const cashBefore = parseCash((await page.getByTestId("cash").textContent()) ?? "");
    const reputationBefore = parseReputation((await page.getByTestId("reputation").textContent()) ?? "");
    await page.getByTestId("run-awards-ceremony").click();
    await expect(page.getByTestId("action-status")).toHaveText("Action: awards completed");
    await expect(page.getByTestId("hospital-awards")).toContainText("ceremonies 1, totals 2000/+5");
    await expect(page.getByTestId("cash")).toHaveText(new RegExp(`^Cash: ${cashBefore + 2000}(?:;.*)?$`, "u"));
    await expect(page.getByTestId("reputation")).toHaveText(`Reputation: ${Math.min(1000, reputationBefore + 5)}`);
    await expect(page.getByTestId("last-event")).toHaveText("Last event: hospital-award-granted");
});

test("phase 8 scenario import: score max increase caps award rating jumps", async ({ page }) => {
    await importScenarioFixture(page, scoreAwardFixtureDirectory);
    await page.getByTestId("pause-toggle").click();
    await expect(page.getByTestId("event-count")).toContainText("scenario score 10");
    await expect(page.getByTestId("hospital-rating")).toHaveText("Rating: 33/100 (none), award 0/+0");
    await page.getByTestId("run-awards-ceremony").click();
    await expect(page.getByTestId("hospital-awards")).toContainText("Awards: none 33/100");
    for (let index = 0; index < 3; index += 1) {
        await page.getByTestId("admit").click();
        await page.getByTestId("treat").click();
    }
    await expect(page.getByTestId("hospital-rating")).toHaveText("Rating: 43/100 (bronze), award 250/+5");
    const cashBeforeAward = parseCash((await page.getByTestId("cash").textContent()) ?? "");
    const reputationBeforeAward = parseReputation((await page.getByTestId("reputation").textContent()) ?? "");
    await page.getByTestId("run-awards-ceremony").click();
    await expect(page.getByTestId("action-status")).toHaveText("Action: awards completed");
    await expect(page.getByTestId("hospital-awards")).toContainText("Awards: bronze 43/100");
    await expect(page.getByTestId("hospital-awards")).toContainText("totals 250/+5");
    await expect(page.getByTestId("cash")).toHaveText(new RegExp(`^Cash: ${cashBeforeAward + 250}(?:;.*)?$`, "u"));
    await expect(page.getByTestId("reputation")).toHaveText(`Reputation: ${Math.min(1000, reputationBeforeAward + 5)}`);
});

test("phase 8 scenario import: cures awards apply imported poor penalty", async ({ page }) => {
    await importScenarioFixture(page, curesAwardFixtureDirectory);
    await page.getByTestId("pause-toggle").click();
    await expect(page.getByTestId("hospital-awards")).toContainText("scenario cures 2, reputation 0, value 0");
    await expect(page.getByTestId("hospital-awards")).toContainText("poor thresholds cures below 3, deaths above 10");
    await expect(page.getByTestId("hospital-awards")).toContainText("cures 0/2");
    await expect(page.getByTestId("run-awards-ceremony")).toBeDisabled();

    for (let index = 0; index < 2; index += 1) {
        await page.getByTestId("admit").click();
        await page.getByTestId("treat").click();
    }

    await expect(page.getByTestId("discharged")).toHaveText("Discharged: 2");
    await expect(page.getByTestId("hospital-awards")).toContainText("poor cures 2/3");
    const cashBeforePenalty = parseCash((await page.getByTestId("cash").textContent()) ?? "");
    await page.getByTestId("run-awards-ceremony").click();
    await expect(page.getByTestId("action-status")).toHaveText("Action: awards penalty applied");
    await expect(page.getByTestId("hospital-awards")).toContainText("totals -450/+0");
    await expect(page.getByTestId("cash")).toHaveText(new RegExp(`^Cash: ${cashBeforePenalty - 450}(?:;.*)?$`, "u"));
    await expect(page.getByTestId("last-event")).toHaveText("Last event: hospital-award-penalty");
});

test("phase 8 scenario import: cures awards apply imported bonus payout", async ({ page }) => {
    await importScenarioFixture(page, curesAwardFixtureDirectory);
    await page.getByTestId("pause-toggle").click();
    for (let index = 0; index < 3; index += 1) {
        await page.getByTestId("admit").click();
        await page.getByTestId("treat").click();
    }
    await expect(page.getByTestId("discharged")).toHaveText("Discharged: 3");
    await expect(page.getByTestId("hospital-awards")).toContainText("Awards: ready, reward 900/+0");
    const cashBeforeAward = parseCash((await page.getByTestId("cash").textContent()) ?? "");
    await page.getByTestId("run-awards-ceremony").click();
    await expect(page.getByTestId("action-status")).toHaveText("Action: awards completed");
    await expect(page.getByTestId("hospital-awards")).toContainText("totals 900/+0");
    await expect(page.getByTestId("cash")).toHaveText(new RegExp(`^Cash: ${cashBeforeAward + 900}(?:;.*)?$`, "u"));
});

test("phase 8 scenario import: deaths awards apply imported bonus payout", async ({ page }) => {
    await importScenarioFixture(page, deathsAwardFixtureDirectory);
    await page.getByTestId("pause-toggle").click();
    await expect(page.getByTestId("hospital-awards")).toContainText("scenario cures 0, reputation 0, value 0, deaths max 5, poor deaths 0");
    await expect(page.getByTestId("hospital-awards")).toContainText("poor thresholds deaths above 0");
    await expect(page.getByTestId("hospital-awards")).toContainText("Awards: ready, reward 700/+0");
    const cashBeforeAward = parseCash((await page.getByTestId("cash").textContent()) ?? "");
    await page.getByTestId("run-awards-ceremony").click();
    await expect(page.getByTestId("action-status")).toHaveText("Action: awards completed");
    await expect(page.getByTestId("hospital-awards")).toContainText("totals 700/+0");
    await expect(page.getByTestId("cash")).toHaveText(new RegExp(`^Cash: ${cashBeforeAward + 700}(?:;.*)?$`, "u"));
});

test("phase 8 scenario import: deaths awards apply imported poor penalty", async ({ page }) => {
    await importScenarioFixture(page, deathsAwardFixtureDirectory);
    await page.getByTestId("pause-toggle").click();
    await page.getByTestId("staff-break-toggle").click();
    await page.getByTestId("admission-severity").selectOption("3");
    await page.getByTestId("admit").click();
    for (let index = 0; index < 48; index += 1) {
        await page.getByTestId("step").click();
    }

    await expect(page.getByTestId("patient-deaths")).toContainText("Deaths: 1");
    await expect(page.getByTestId("hospital-awards")).toContainText("poor deaths 1/0");
    const cashBeforePenalty = parseCash((await page.getByTestId("cash").textContent()) ?? "");
    await page.getByTestId("run-awards-ceremony").click();
    await expect(page.getByTestId("action-status")).toHaveText("Action: awards penalty applied");
    await expect(page.getByTestId("hospital-awards")).toContainText("totals -350/+0");
    await expect(page.getByTestId("cash")).toHaveText(new RegExp(`^Cash: ${cashBeforePenalty - 350}(?:;.*)?$`, "u"));
    await expect(page.getByTestId("last-event")).toHaveText("Last event: hospital-award-penalty");
});

test("phase 8 scenario import: trophy cash bonuses use imported cures and death criteria", async ({ page }) => {
    await importScenarioFixture(page, trophyCashAwardFixtureDirectory);
    await page.getByTestId("pause-toggle").click();
    await expect(page.getByTestId("hospital-awards")).toContainText("scenario cures 0, reputation 0, value 0, deaths max 5");
    await expect(page.getByTestId("hospital-awards")).toContainText("Awards: ready, reward 1300/+0");
    const cashBeforeAward = parseCash((await page.getByTestId("cash").textContent()) ?? "");
    await page.getByTestId("run-awards-ceremony").click();
    await expect(page.getByTestId("action-status")).toHaveText("Action: awards completed");
    await expect(page.getByTestId("hospital-awards")).toContainText("totals 1300/+0");
    await expect(page.getByTestId("cash")).toHaveText(new RegExp(`^Cash: ${cashBeforeAward + 1300}(?:;.*)?$`, "u"));
});

test("phase 8 scenario import: hospital value awards apply imported poor penalty", async ({ page }) => {
    await importScenarioFixture(page, hospitalValueAwardFixtureDirectory);
    await page.getByTestId("pause-toggle").click();
    await expect(page.getByTestId("hospital-awards")).toContainText("scenario cures 0, reputation 0, value 10000");
    await expect(page.getByTestId("hospital-awards")).toContainText("poor thresholds value below 18000, deaths above 10");
    await expect(page.getByTestId("hospital-awards")).toContainText("poor value 15984/18000");
    const reputationBeforePenalty = parseReputation((await page.getByTestId("reputation").textContent()) ?? "");
    await page.getByTestId("run-awards-ceremony").click();
    await expect(page.getByTestId("action-status")).toHaveText("Action: awards penalty applied");
    await expect(page.getByTestId("hospital-awards")).toContainText("totals 0/-4");
    await expect(page.getByTestId("reputation")).toHaveText(`Reputation: ${reputationBeforePenalty - 4}`);
    await expect(page.getByTestId("last-event")).toHaveText("Last event: hospital-award-penalty");
});

test("phase 8 scenario import: hospital value awards apply imported bonus payout", async ({ page }) => {
    await importScenarioFixture(page, hospitalValueAwardFixtureDirectory);
    await page.getByTestId("pause-toggle").click();
    await page.getByTestId("build-diagnosis-room").click();
    const canvas = page.getByTestId("hospital-map-canvas");
    await canvas.hover({ position: { x: 416, y: 176 } });
    await expect(page.getByTestId("hospital-placement-mode")).toContainText("(valid)");
    await canvas.click({ position: { x: 416, y: 176 } });
    await expect(page.getByTestId("action-status")).toHaveText("Action: room built");
    await expect(page.getByTestId("hospital-awards")).toContainText("Awards: ready, reward 0/+9");
    const reputationBeforeAward = parseReputation((await page.getByTestId("reputation").textContent()) ?? "");
    await page.getByTestId("run-awards-ceremony").click();
    await expect(page.getByTestId("action-status")).toHaveText("Action: awards completed");
    await expect(page.getByTestId("hospital-awards")).toContainText("totals 0/+9");
    await expect(page.getByTestId("reputation")).toHaveText(`Reputation: ${Math.min(1000, reputationBeforeAward + 9)}`);
});

test("phase 8 scenario import: reputation awards apply imported cash bonus", async ({ page }) => {
    await importScenarioFixture(page, reputationAwardFixtureDirectory);
    await page.getByTestId("pause-toggle").click();
    await expect(page.getByTestId("hospital-awards")).toContainText("scenario cures 0, reputation 300, value 0");
    await expect(page.getByTestId("hospital-awards")).toContainText("poor thresholds reputation below 450, deaths above 10");
    await expect(page.getByTestId("hospital-awards")).toContainText("Awards: ready, reward 800/+0");
    const cashBeforeAward = parseCash((await page.getByTestId("cash").textContent()) ?? "");
    await page.getByTestId("run-awards-ceremony").click();
    await expect(page.getByTestId("action-status")).toHaveText("Action: awards completed");
    await expect(page.getByTestId("hospital-awards")).toContainText("totals 800/+0");
    await expect(page.getByTestId("cash")).toHaveText(new RegExp(`^Cash: ${cashBeforeAward + 800}(?:;.*)?$`, "u"));
});

test("phase 8 scenario import: reputation awards apply imported poor penalty", async ({ page }) => {
    await importScenarioFixture(page, reputationAwardFixtureDirectory);
    await page.getByTestId("pause-toggle").click();
    await page.getByTestId("staff-break-toggle").click();
    await page.getByTestId("admission-severity").selectOption("3");
    await page.getByTestId("admit").click();
    for (let index = 0; index < 48; index += 1) {
        await page.getByTestId("step").click();
    }

    await expect(page.getByTestId("hospital-awards")).toContainText(/poor reputation \d+\/450/u);
    const cashBeforePenalty = parseCash((await page.getByTestId("cash").textContent()) ?? "");
    await page.getByTestId("run-awards-ceremony").click();
    await expect(page.getByTestId("action-status")).toHaveText("Action: awards penalty applied");
    await expect(page.getByTestId("hospital-awards")).toContainText("totals -400/+0");
    await expect(page.getByTestId("cash")).toHaveText(new RegExp(`^Cash: ${cashBeforePenalty - 400}(?:;.*)?$`, "u"));
    await expect(page.getByTestId("last-event")).toHaveText("Last event: hospital-award-penalty");
});

test("phase 8 scenario import: cleanliness award thresholds use imported SAM values", async ({ page }) => {
    await importScenarioFixture(page, cleanlinessAwardFixtureDirectory);
    await page.getByTestId("pause-toggle").click();
    await page.getByTestId("staff-break-toggle").click();
    await expect(page.getByTestId("hospital-awards")).toContainText("scenario cures 0, reputation 0, value 0, litter <= 5%");
    await expect(page.getByTestId("hospital-awards")).toContainText("poor thresholds litter above 40%, deaths above 10");
    await expect(page.getByTestId("patient-litter")).toHaveText("Patient litter: 0, active 0, cleaned 0, cleanliness 0%");
    await expect(page.getByTestId("hospital-awards")).toContainText("Awards: ready, reward 0/+6");
    const reputationBefore = parseReputation((await page.getByTestId("reputation").textContent()) ?? "");
    await page.getByTestId("run-awards-ceremony").click();
    await expect(page.getByTestId("action-status")).toHaveText("Action: awards completed");
    await expect(page.getByTestId("hospital-awards")).toContainText("totals 0/+6");
    await expect(page.getByTestId("reputation")).toHaveText(`Reputation: ${Math.min(1000, reputationBefore + 6)}`);
    await expect(page.getByTestId("last-event")).toHaveText("Last event: hospital-award-granted");
    for (let index = 0; index < 4; index += 1) {
        await page.getByTestId("admit").click();
    }
    await page.getByTestId("step").click();
    await expect(page.getByTestId("patient-litter")).toHaveText("Patient litter: 4, active 4, cleaned 0, cleanliness 100%");
    await expect(page.getByTestId("hospital-awards")).toContainText("litter 100/5%");
    await expect(page.getByTestId("hospital-awards")).toContainText("poor litter 100/40%");
    await expect(page.getByTestId("run-awards-ceremony")).toBeDisabled();
    await expect(page.getByTestId("hospital-awards")).toContainText("totals 0/+6");
});

test("phase 8 scenario import: peep happiness awards use imported SAM values", async ({ page }) => {
    await importScenarioFixture(page, peepHappinessAwardFixtureDirectory);
    await page.getByTestId("pause-toggle").click();
    await expect(page.getByTestId("hospital-awards")).toContainText("scenario cures 0, reputation 0, value 0, peep happy 75%");
    await expect(page.getByTestId("hospital-awards")).toContainText("poor thresholds peep happy below 25%, deaths above 10");
    await expect(page.getByTestId("patient-mood")).toContainText("peep happy 100%");
    await expect(page.getByTestId("hospital-awards")).toContainText("Awards: ready, reward 0/+4");
    const reputationBefore = parseReputation((await page.getByTestId("reputation").textContent()) ?? "");
    await page.getByTestId("run-awards-ceremony").click();
    await expect(page.getByTestId("action-status")).toHaveText("Action: awards completed");
    await expect(page.getByTestId("hospital-awards")).toContainText("totals 0/+4");
    await expect(page.getByTestId("reputation")).toHaveText(`Reputation: ${Math.min(1000, reputationBefore + 4)}`);

    await page.getByTestId("staff-break-toggle").click();
    await page.getByTestId("admission-severity").selectOption("3");
    await page.getByTestId("admit").click();
    for (let index = 0; index < 46; index += 1) {
        await page.getByTestId("step").click();
    }
    await expect(page.getByTestId("patient-mood")).toContainText("peep happy 4%");
    await expect(page.getByTestId("hospital-awards")).toContainText("peep happy 4/75%");
    await expect(page.getByTestId("hospital-awards")).toContainText("poor peep happy 4/25%");
    await expect(page.getByTestId("run-awards-ceremony")).toBeDisabled();
    await expect(page.getByTestId("hospital-awards")).toContainText("totals 0/+4");
});

test("phase 8 scenario import: waiting times awards use imported SAM values", async ({ page }) => {
    await importScenarioFixture(page, waitingTimesAwardFixtureDirectory);
    await page.getByTestId("pause-toggle").click();
    await page.getByTestId("staff-break-toggle").click();
    await expect(page.getByTestId("hospital-awards")).toContainText("scenario cures 0, reputation 0, value 0, walkouts <= 25%");
    await expect(page.getByTestId("hospital-awards")).toContainText("poor thresholds walkouts above 75%, deaths above 10");
    await expect(page.getByTestId("patient-deaths")).toContainText("walkouts 0 (0%)");
    await expect(page.getByTestId("hospital-awards")).toContainText("Awards: ready, reward 0/+2");
    const reputationBefore = parseReputation((await page.getByTestId("reputation").textContent()) ?? "");
    await page.getByTestId("run-awards-ceremony").click();
    await expect(page.getByTestId("action-status")).toHaveText("Action: awards completed");
    await expect(page.getByTestId("hospital-awards")).toContainText("totals 0/+2");
    await expect(page.getByTestId("reputation")).toHaveText(`Reputation: ${Math.min(1000, reputationBefore + 2)}`);

    await page.getByTestId("admission-severity").selectOption("3");
    await page.getByTestId("admit").click();
    for (let index = 0; index < 3; index += 1) {
        await page.getByTestId("step").click();
    }
    await expect(page.getByTestId("waiting")).toHaveText("Waiting: 0");
    await expect(page.getByTestId("patient-deaths")).toContainText("walkouts 1 (100%)");
    await expect(page.getByTestId("hospital-awards")).toContainText("walkouts 100/25%");
    await expect(page.getByTestId("hospital-awards")).toContainText("poor walkouts 100/75%");
    await expect(page.getByTestId("run-awards-ceremony")).toBeDisabled();
    await expect(page.getByTestId("hospital-awards")).toContainText("totals 0/+2");
});

test("phase 8 scenario import: staff happiness awards use imported SAM values", async ({ page }) => {
    await importScenarioFixture(page, staffHappinessAwardFixtureDirectory);
    await page.getByTestId("pause-toggle").click();
    await expect(page.getByTestId("stressed-staff")).toHaveText("Stressed staff: 0, staff happy 100%; scenario work 10, modify 1, resign 150");
    await expect(page.getByTestId("hospital-awards")).toContainText("scenario cures 0, reputation 0, value 0, staff award happy 75%");
    await expect(page.getByTestId("hospital-awards")).toContainText("poor thresholds staff happy below 50%, deaths above 10");
    await expect(page.getByTestId("hospital-awards")).toContainText("Awards: ready, reward 0/+4");
    const reputationBefore = parseReputation((await page.getByTestId("reputation").textContent()) ?? "");
    await page.getByTestId("run-awards-ceremony").click();
    await expect(page.getByTestId("action-status")).toHaveText("Action: awards completed");
    await expect(page.getByTestId("hospital-awards")).toContainText("totals 0/+4");
    await expect(page.getByTestId("reputation")).toHaveText(`Reputation: ${Math.min(1000, reputationBefore + 4)}`);

    await page.getByTestId("build-diagnosis-room").click();
    await page.getByTestId("hospital-map-canvas").hover({ position: { x: 384, y: 160 } });
    await expect(page.getByTestId("hospital-placement-mode")).toContainText("(valid)");
    await page.getByTestId("hospital-map-canvas").click({ position: { x: 384, y: 160 } });
    await expect(page.getByTestId("action-status")).toHaveText("Action: room built");
    await page.getByTestId("hire-diagnostician").click();
    await page.getByTestId("hospital-map-canvas").hover({ position: { x: 416, y: 176 } });
    await expect(page.getByTestId("hospital-placement-mode")).toContainText("(valid)");
    await page.getByTestId("hospital-map-canvas").click({ position: { x: 416, y: 176 } });
    await expect(page.getByTestId("action-status")).toHaveText("Action: staff hired");

    await page.getByTestId("admission-severity").selectOption("3");
    for (let index = 0; index < 48; index += 1) {
        await page.getByTestId("admit").click();
        await page.getByTestId("step").click();
    }
    await expect(page.getByTestId("stressed-staff")).toContainText("staff happy 40%");
    await expect(page.getByTestId("hospital-awards")).toContainText("staff award happy 40/75%");
    await expect(page.getByTestId("hospital-awards")).toContainText("poor staff happy 40/50%");
    await expect(page.getByTestId("run-awards-ceremony")).toBeDisabled();
    await expect(page.getByTestId("hospital-awards")).toContainText("totals 0/+4");
});

test("phase 8 scenario import: well-kept tech awards use imported SAM values", async ({ page }) => {
    await importScenarioFixture(page, wellKeptTechAwardFixtureDirectory);
    await page.getByTestId("pause-toggle").click();
    await expect(page.getByTestId("rooms-in-maintenance")).toHaveText("Rooms in maintenance: 0, worn 0%");
    await expect(page.getByTestId("hospital-awards")).toContainText("scenario cures 0, reputation 0, value 0, worn tech <= 20%");
    await expect(page.getByTestId("hospital-awards")).toContainText("poor thresholds worn tech above 70%, deaths above 10");
    await expect(page.getByTestId("hospital-awards")).toContainText("Awards: ready, reward 0/+7");
    const reputationBefore = parseReputation((await page.getByTestId("reputation").textContent()) ?? "");
    await page.getByTestId("run-awards-ceremony").click();
    await expect(page.getByTestId("action-status")).toHaveText("Action: awards completed");
    await expect(page.getByTestId("hospital-awards")).toContainText("totals 0/+7");
    await expect(page.getByTestId("reputation")).toHaveText(`Reputation: ${Math.min(1000, reputationBefore + 7)}`);

    for (let index = 0; index < 63; index += 1) {
        await page.getByTestId("step").click();
    }
    await expect(page.getByTestId("tick")).toHaveText("Tick: 64");
    await expect(page.getByTestId("quake-status")).toHaveText("Quake: scheduled 1, active none, severity 0, triggered 1");
    await expect(page.getByTestId("rooms-in-maintenance")).toHaveText("Rooms in maintenance: 0, worn 100%");
    await expect(page.getByTestId("hospital-awards")).toContainText("worn tech 100/20%");
    await expect(page.getByTestId("hospital-awards")).toContainText("poor worn tech 100/70%");
    await expect(page.getByTestId("run-awards-ceremony")).toBeDisabled();
    await expect(page.getByTestId("hospital-awards")).toContainText("totals 0/+7");
});

test("phase 8 scenario import: new tech awards use imported SAM values", async ({ page }) => {
    await importScenarioFixture(page, newTechAwardFixtureDirectory);
    await page.getByTestId("pause-toggle").click();
    await expect(page.getByTestId("research-effect")).toContainText("next 1000/6 ticks");
    await expect(page.getByTestId("hospital-awards")).toContainText("scenario cures 0, reputation 0, value 0, research spend 2000");
    await expect(page.getByTestId("hospital-awards")).toContainText("poor thresholds research spend below 1500, deaths above 10");
    await expect(page.getByTestId("hospital-awards")).toContainText("research spend 0/2000");
    await expect(page.getByTestId("hospital-awards")).toContainText("poor research spend 0/1500");
    await expect(page.getByTestId("run-awards-ceremony")).toBeDisabled();

    await page.getByTestId("start-research").click();
    await expect(page.getByTestId("research-status")).toContainText("Research: treatment 0/3 (6 ticks), invested 1000");
    for (let index = 0; index < 6; index += 1) {
        await page.getByTestId("step").click();
    }
    await expect(page.getByTestId("research-status")).toContainText("Research: treatment 1/3, invested 1000");
    await expect(page.getByTestId("hospital-awards")).toContainText("research spend 1000/2000");
    await expect(page.getByTestId("hospital-awards")).toContainText("poor research spend 1000/1500");

    await page.getByTestId("start-research").click();
    await expect(page.getByTestId("research-status")).toContainText("Research: treatment 1/3 (6 ticks), invested 2000");
    for (let index = 0; index < 6; index += 1) {
        await page.getByTestId("step").click();
    }
    await expect(page.getByTestId("research-status")).toContainText("Research: treatment 2/3, invested 2000");
    await expect(page.getByTestId("hospital-awards")).toContainText("Awards: ready, reward 0/+5");
    await expect(page.getByTestId("hospital-awards")).not.toContainText("research spend 2000/2000");
    const reputationBefore = parseReputation((await page.getByTestId("reputation").textContent()) ?? "");
    await page.getByTestId("run-awards-ceremony").click();
    await expect(page.getByTestId("action-status")).toHaveText("Action: awards completed");
    await expect(page.getByTestId("hospital-awards")).toContainText("totals 0/+5");
    await expect(page.getByTestId("reputation")).toHaveText(`Reputation: ${Math.min(1000, reputationBefore + 5)}`);
});

test("phase 8 scenario import: emergency awards block on imported SAM values", async ({ page }) => {
    await importScenarioFixture(page, emergencyAwardFixtureDirectory);
    await page.getByTestId("pause-toggle").click();
    await expect(page.getByTestId("emergency-status")).toHaveText("Emergency: ready (4 patients/24 ticks, need 3 / 75%, Uncommon Cold); scenario scheduled 2, active 0, disaster 999 ticks");
    await expect(page.getByTestId("hospital-awards")).toContainText("scenario cures 0, reputation 0, value 0, emergency saved 90%");
    await expect(page.getByTestId("hospital-awards")).toContainText("poor thresholds emergency saved below 75%, deaths above 10");
    await expect(page.getByTestId("hospital-awards")).toContainText("emergencies 0/2");

    await page.getByTestId("start-emergency-wave").click();
    await expect(page.getByTestId("action-status")).toHaveText("Action: emergency started");
    await expect(page.getByTestId("waiting")).toHaveText("Waiting: 4");
    for (let index = 0; index < 4; index += 1) {
        await page.getByTestId("treat").click();
    }
    await expect(page.getByTestId("emergency-reward")).toContainText("won 1/1, failed 0, saved 100%");
    await expect(page.getByTestId("hospital-awards")).toContainText("emergencies 1/2");

    await page.getByTestId("treatment-room-toggle").click();
    await expect(page.getByTestId("open-treatment-rooms")).toHaveText("Open treatment rooms: 0");
    await page.getByTestId("start-emergency-wave").click();
    await expect(page.getByTestId("action-status")).toHaveText("Action: emergency started");
    for (let index = 0; index < 24; index += 1) {
        await page.getByTestId("step").click();
    }
    await expect(page.getByTestId("emergency-reward")).toContainText("won 1/2, failed 1, saved 50%");
    await expect(page.getByTestId("hospital-awards")).toContainText("emergency saved 50/90%");
    await expect(page.getByTestId("hospital-awards")).toContainText("poor emergency saved 50/75%");
    await expect(page.getByTestId("run-awards-ceremony")).toBeDisabled();
});

test("phase 8 scenario import: emergency awards grant imported SAM payout", async ({ page }) => {
    await importScenarioFixture(page, emergencyAwardFixtureDirectory);
    await page.getByTestId("pause-toggle").click();
    await expect(page.getByTestId("hospital-awards")).toContainText("scenario cures 0, reputation 0, value 0, emergency saved 90%");
    await page.getByTestId("start-emergency-wave").click();
    for (let index = 0; index < 4; index += 1) {
        await page.getByTestId("treat").click();
    }
    await page.getByTestId("start-emergency-wave").click();
    for (let index = 0; index < 4; index += 1) {
        await page.getByTestId("treat").click();
    }
    await expect(page.getByTestId("emergency-reward")).toContainText("won 2/2, failed 0, saved 100%");
    await expect(page.getByTestId("hospital-awards")).toContainText("Awards: ready, reward 0/+7");
    const reputationBefore = parseReputation((await page.getByTestId("reputation").textContent()) ?? "");
    await page.getByTestId("run-awards-ceremony").click();
    await expect(page.getByTestId("action-status")).toHaveText("Action: awards completed");
    await expect(page.getByTestId("hospital-awards")).toContainText("totals 0/+7");
    await expect(page.getByTestId("reputation")).toHaveText(`Reputation: ${Math.min(1000, reputationBefore + 7)}`);
});

test("phase 8 scenario import: population awards use imported SAM values", async ({ page }) => {
    await importScenarioFixture(page, populationAwardFixtureDirectory);
    await page.getByTestId("pause-toggle").click();
    await expect(page.getByTestId("hospital-awards")).toContainText("scenario cures 0, reputation 0, value 0, treated 75%");
    await expect(page.getByTestId("hospital-awards")).toContainText("poor thresholds treated below 50%, deaths above 10");

    for (let index = 0; index < 3; index += 1) {
        await page.getByTestId("admit").click();
    }
    await page.getByTestId("treat").click();
    await expect(page.getByTestId("level-objective-safety")).toContainText("treated 33/40%");
    await expect(page.getByTestId("hospital-awards")).toContainText("treated 33/75%");
    await expect(page.getByTestId("hospital-awards")).toContainText("poor treated 33/50%");
    await expect(page.getByTestId("run-awards-ceremony")).toBeDisabled();

    await page.getByTestId("treat").click();
    await page.getByTestId("treat").click();
    await expect(page.getByTestId("level-objective-safety")).toContainText("treated 100/40%");
    await expect(page.getByTestId("hospital-awards")).toContainText("Awards: ready, reward 0/+6");
    await expect(page.getByTestId("hospital-awards")).not.toContainText("treated 100/75%");
    const reputationBefore = parseReputation((await page.getByTestId("reputation").textContent()) ?? "");
    await page.getByTestId("run-awards-ceremony").click();
    await expect(page.getByTestId("action-status")).toHaveText("Action: awards completed");
    await expect(page.getByTestId("hospital-awards")).toContainText("totals 0/+6");
    await expect(page.getByTestId("reputation")).toHaveText(`Reputation: ${Math.min(1000, reputationBefore + 6)}`);
});

test("phase 8 scenario import: cures versus deaths awards apply imported poor penalty", async ({ page }) => {
    await importScenarioFixture(page, curesVDeathsAwardFixtureDirectory);
    await page.getByTestId("pause-toggle").click();
    await expect(page.getByTestId("hospital-awards")).toContainText("scenario cures 0, reputation 0, value 0, cures/deaths 0");
    await expect(page.getByTestId("hospital-awards")).toContainText("poor thresholds cures/deaths below 2, deaths above 10");
    await expect(page.getByTestId("hospital-awards")).toContainText("poor cures/deaths 0/2");
    const cashBeforePenalty = parseCash((await page.getByTestId("cash").textContent()) ?? "");
    await page.getByTestId("run-awards-ceremony").click();
    await expect(page.getByTestId("action-status")).toHaveText("Action: awards penalty applied");
    await expect(page.getByTestId("hospital-awards")).toContainText("totals -300/+0");
    await expect(page.getByTestId("cash")).toHaveText(new RegExp(`^Cash: ${cashBeforePenalty - 300}(?:;.*)?$`, "u"));
});

test("phase 8 scenario import: cures versus deaths awards apply imported bonus payout", async ({ page }) => {
    await importScenarioFixture(page, curesVDeathsAwardFixtureDirectory);
    await page.getByTestId("pause-toggle").click();
    for (let index = 0; index < 2; index += 1) {
        await page.getByTestId("admit").click();
        await page.getByTestId("treat").click();
    }
    await expect(page.getByTestId("discharged")).toHaveText("Discharged: 2");
    await expect(page.getByTestId("patient-deaths")).toContainText("Deaths: 0");
    await expect(page.getByTestId("hospital-awards")).toContainText("Awards: ready, reward 1200/+0");
    await expect(page.getByTestId("hospital-awards")).not.toContainText("poor cures/deaths 2/2");
    const cashBefore = parseCash((await page.getByTestId("cash").textContent()) ?? "");
    await page.getByTestId("run-awards-ceremony").click();
    await expect(page.getByTestId("action-status")).toHaveText("Action: awards completed");
    await expect(page.getByTestId("hospital-awards")).toContainText("totals 1200/+0");
    await expect(page.getByTestId("cash")).toHaveText(new RegExp(`^Cash: ${cashBefore + 1200}(?:;.*)?$`, "u"));
});

test("phase 8 scenario import: cans of coke awards use imported SAM values", async ({ page }) => {
    await importScenarioFixture(page, cansOfCokeAwardFixtureDirectory);
    await page.getByTestId("pause-toggle").click();
    await expect(page.getByTestId("hospital-awards")).toContainText("scenario cures 0, reputation 0, value 0, drinks 1");
    await expect(page.getByTestId("patient-drinks")).toHaveText("Drinks served: 0, award 0/1");
    await expect(page.getByTestId("hospital-awards")).toContainText("drinks 0/1");
    await expect(page.getByTestId("run-awards-ceremony")).toBeDisabled();

    await page.getByTestId("staff-break-toggle").click();
    await selectVisiblePatient(page);
    await expect(page.getByTestId("selection-status")).toContainText("Selection: patient #");
    await page.getByTestId("step").click();
    await expect(page.getByTestId("give-drink-selected-patient")).toBeEnabled();
    await page.getByTestId("give-drink-selected-patient").click();
    await expect(page.getByTestId("action-status")).toHaveText("Action: drink given");
    await expect(page.getByTestId("give-drink-selected-patient")).toBeDisabled();
    await expect(page.getByTestId("patient-drinks")).toHaveText("Drinks served: 1, award 1/1");
    await expect(page.getByTestId("hospital-awards")).toContainText("Awards: ready, reward 900/+0");
    const cashBefore = parseCash((await page.getByTestId("cash").textContent()) ?? "");
    await page.getByTestId("run-awards-ceremony").click();
    await expect(page.getByTestId("action-status")).toHaveText("Action: awards completed");
    await expect(page.getByTestId("hospital-awards")).toContainText("totals 900/+0");
    await expect(page.getByTestId("cash")).toHaveText(new RegExp(`^Cash: ${cashBefore + 900}(?:;.*)?$`, "u"));
});

test("phase 8 scenario import: rat awards use imported SAM values", async ({ page }) => {
    await importScenarioFixture(page, ratAwardFixtureDirectory);
    await page.getByTestId("pause-toggle").click();
    await expect(page.getByTestId("hospital-awards")).toContainText("scenario cures 0, reputation 0, value 0, rats 3, rat accuracy 75%");
    await expect(page.getByTestId("hospital-awards")).toContainText("rats 0/3, rats 0/2");
    await expect(page.getByTestId("run-awards-ceremony")).toBeDisabled();

    await page.getByTestId("shoot-rat").click();
    await expect(page.getByTestId("rat-control")).toHaveText("Rats: 1/1, accuracy 100%");
    await expect(page.getByTestId("hospital-awards")).toContainText("rats 1/3, rats 1/2");

    await page.getByTestId("shoot-rat").click();
    await page.getByTestId("shoot-rat").click();
    await expect(page.getByTestId("rat-control")).toHaveText("Rats: 3/3, accuracy 100%");
    await expect(page.getByTestId("hospital-awards")).toContainText("Awards: ready, reward 5000/+5");
    const cashBefore = parseCash((await page.getByTestId("cash").textContent()) ?? "");
    const reputationBefore = parseReputation((await page.getByTestId("reputation").textContent()) ?? "");
    await page.getByTestId("run-awards-ceremony").click();
    await expect(page.getByTestId("action-status")).toHaveText("Action: awards completed");
    await expect(page.getByTestId("hospital-awards")).toContainText("totals 5000/+5");
    await expect(page.getByTestId("cash")).toHaveText(new RegExp(`^Cash: ${cashBefore + 5000}(?:;.*)?$`, "u"));
    await expect(page.getByTestId("reputation")).toHaveText(`Reputation: ${Math.min(1000, reputationBefore + 5)}`);
});

test("phase 8 scenario import: plant awards use imported SAM values", async ({ page }) => {
    await importScenarioFixture(page, plantAwardFixtureDirectory);
    await page.getByTestId("pause-toggle").click();
    await expect(page.getByTestId("hospital-awards")).toContainText("scenario cures 0, reputation 0, value 0, plants watered 80%");
    await expect(page.getByTestId("plant-care")).toHaveText("Plants: 0/0, watered 0%");
    await expect(page.getByTestId("hospital-awards")).toContainText("plants watered 0/80%");
    await expect(page.getByTestId("run-awards-ceremony")).toBeDisabled();

    for (let index = 0; index < 4; index += 1) {
        await page.getByTestId("water-plant").click();
        await expect(page.getByTestId("action-status")).toHaveText("Action: plant watered");
    }
    await expect(page.getByTestId("plant-care")).toHaveText("Plants: 4/4, watered 100%");
    await expect(page.getByTestId("hospital-awards")).toContainText("Awards: ready, reward 0/+5");
    const reputationBefore = parseReputation((await page.getByTestId("reputation").textContent()) ?? "");
    await page.getByTestId("run-awards-ceremony").click();
    await expect(page.getByTestId("action-status")).toHaveText("Action: awards completed");
    await expect(page.getByTestId("hospital-awards")).toContainText("totals 0/+5");
    await expect(page.getByTestId("reputation")).toHaveText(`Reputation: ${Math.min(1000, reputationBefore + 5)}`);
});

test("phase 8 scenario import: mayor awards use imported SAM values", async ({ page }) => {
    await importScenarioFixture(page, mayorAwardFixtureDirectory);
    await page.getByTestId("pause-toggle").click();
    await expect(page.getByTestId("vip-inspection-reward")).toHaveText("VIP terms: queue <= 2, reputation >= 450, reward 800/+25, penalty 300/-20, pass 0/0, fail 0; scenario mayor 999 ticks");
    await expect(page.getByTestId("hospital-awards")).toContainText("scenario cures 0, reputation 0, value 0, mayor fail <= 0%");
    await expect(page.getByTestId("hospital-awards")).toContainText("mayor visits 0/2");
    await expect(page.getByTestId("run-awards-ceremony")).toBeDisabled();

    for (let visit = 1; visit <= 2; visit += 1) {
        await page.getByTestId("start-vip-inspection").click();
        await expect(page.getByTestId("action-status")).toHaveText("Action: VIP inspection started");
        await expect(page.getByTestId("vip-inspection-status")).toContainText(`VIP: visit ${visit}`);
        for (let tick = 0; tick < 8; tick += 1) {
            await page.getByTestId("step").click();
        }
    }
    await expect(page.getByTestId("vip-inspection-reward")).toContainText("pass 2/2, fail 0");
    await expect(page.getByTestId("hospital-awards")).toContainText("Awards: ready, reward 0/+8");
    const reputationBefore = parseReputation((await page.getByTestId("reputation").textContent()) ?? "");
    await page.getByTestId("run-awards-ceremony").click();
    await expect(page.getByTestId("action-status")).toHaveText("Action: awards completed");
    await expect(page.getByTestId("hospital-awards")).toContainText("totals 0/+8");
    await expect(page.getByTestId("reputation")).toHaveText(`Reputation: ${Math.min(1000, reputationBefore + 8)}`);
});

test("phase 8 scenario import: browser research unlocks scenario expertise", async ({ page }) => {
    await importScenarioFixture(page);
    await page.getByTestId("pause-toggle").click();
    await expect(page.getByTestId("object-availability")).toContainText("Object availability: 1/2 available, locked 0, disabled 0, research 1");
    await expect(page.getByTestId("scenario-expertise")).toHaveText("Scenario expertise: 1/3 known, 2 research-required, diagnosable 3, capability 100, next research 10000 Uncommon Cold");
    const cashBefore = Number(((await page.getByTestId("cash").textContent()) ?? "").match(/^Cash: (\d+)/u)?.[1] ?? "0");
    await page.getByTestId("start-research").click();
    await expect(page.getByTestId("action-status")).toHaveText("Action: research started");
    await expect(page.getByTestId("cash")).toHaveText(new RegExp(`^Cash: ${cashBefore - 1500}(?:;.*)?$`, "u"));
    await expect(page.getByTestId("research-status")).toContainText("Research: treatment 0/3 (6 ticks), invested 1500");
    for (let index = 0; index < 6; index += 1) {
        await page.getByTestId("step").click();
    }
    await expect(page.getByTestId("research-status")).toContainText("Research: treatment 1/3, invested 1500");
    await expect(page.getByTestId("scenario-expertise")).toHaveText("Scenario expertise: 2/3 known, 1 research-required, diagnosable 3, capability 100, next research 40000 D CARDIO");
    await expect(page.getByTestId("object-availability")).toContainText("Object availability: 1/2 available, locked 0, disabled 0, research 1");
    await expect(page.getByTestId("last-event")).toHaveText("Last event: research-completed");
});

test("phase 8 scenario import: object availability unlocks room builds by scenario month", async ({ page }) => {
    await importScenarioFixture(page, roomUnlockFixtureDirectory);
    await page.getByTestId("pause-toggle").click();
    await expect(page.getByTestId("room-availability")).toHaveText("Room availability: GP's Office, Ward");
    await expect(page.getByTestId("object-availability")).toContainText("Object availability: 0/2 available, locked 1, disabled 0, research 1");
    await page.getByTestId("build-inflation-room").click();
    const canvas = page.getByTestId("hospital-map-canvas");
    await canvas.hover({ position: { x: 416, y: 176 } });
    await expect(page.getByTestId("hospital-placement-mode")).toContainText("blocked: room unavailable in scenario");
    for (let index = 0; index < 64; index += 1) {
        await page.getByTestId("step").click();
    }
    await expect(page.getByTestId("tick")).toHaveText("Tick: 65");
    await expect(page.getByTestId("room-availability")).toHaveText("Room availability: GP's Office, Ward, Inflation Room");
    await expect(page.getByTestId("object-availability")).toContainText("Object availability: 1/2 available, locked 0, disabled 0, research 1");
    await canvas.hover({ position: { x: 416, y: 176 } });
    await expect(page.getByTestId("hospital-placement-mode")).toContainText("(valid)");
    await canvas.click({ position: { x: 416, y: 176 } });
    await expect(page.getByTestId("action-status")).toHaveText("Action: room built");
    await expect(page.getByTestId("hospital-canvas-summary")).toContainText("rooms 3");
});

test("phase 8 scenario import: disabled object availability blocks browser room builds", async ({ page }) => {
    await importScenarioFixture(page, objectAvailabilityFixtureDirectory);
    await page.getByTestId("pause-toggle").click();
    await expect(page.getByTestId("room-availability")).toHaveText("Room availability: GP's Office, Ward");
    await expect(page.getByTestId("object-availability")).toHaveText("Object availability: 1/2 available, locked 0, disabled 1, research 0; available: Cardiogram; disabled: Inflator Machine");
    await page.getByTestId("build-inflation-room").click();
    const canvas = page.getByTestId("hospital-map-canvas");
    await canvas.hover({ position: { x: 416, y: 176 } });
    await expect(page.getByTestId("hospital-placement-mode")).toContainText("blocked: room unavailable in scenario");
    for (let index = 0; index < 128; index += 1) {
        await page.getByTestId("step").click();
    }
    await expect(page.getByTestId("tick")).toHaveText("Tick: 129");
    await expect(page.getByTestId("room-availability")).toHaveText("Room availability: GP's Office, Ward");
    await expect(page.getByTestId("object-availability")).toHaveText("Object availability: 1/2 available, locked 0, disabled 1, research 0; available: Cardiogram; disabled: Inflator Machine");
});

test("phase 8 scenario import: scheduled quakes trigger in browser simulation time", async ({ page }) => {
    await importScenarioFixture(page);
    await page.getByTestId("pause-toggle").click();
    await expect(page.getByTestId("quake-status")).toHaveText("Quake: scheduled 1, active none, severity 0, triggered 0, next 0 months 1-1 severity 4");
    await expect(page.getByTestId("rooms-in-maintenance")).toHaveText("Rooms in maintenance: 0, worn 0%");
    for (let index = 0; index < 63; index += 1) {
        await page.getByTestId("step").click();
    }
    await expect(page.getByTestId("tick")).toHaveText("Tick: 64");
    await expect(page.getByTestId("quake-status")).toHaveText("Quake: scheduled 1, active none, severity 0, triggered 1");
    await expect(page.getByTestId("last-event")).toHaveText("Last event: earthquake-applied");
    await expect(page.getByTestId("rooms-in-maintenance")).toHaveText("Rooms in maintenance: 0, worn 100%");
    for (let index = 0; index < 15; index += 1) {
        await page.getByTestId("hospital-camera-west").click();
        await page.getByTestId("hospital-camera-north").click();
    }
    await page.getByTestId("hospital-map-canvas").click({ position: { x: 384, y: 66 } });
    await expect(page.getByTestId("selection-status")).toContainText("Selection: GP's Office room #1");
    await expect(page.getByTestId("selection-status")).toContainText("wear 4");
    await expect(page.getByTestId("repair-selected-room")).toBeEnabled();
    await page.getByTestId("repair-selected-room").click();
    await expect(page.getByTestId("action-status")).toHaveText("Action: room repaired");
    await expect(page.getByTestId("last-event")).toHaveText("Last event: room-repaired");
    await expect(page.getByTestId("selection-status")).toContainText("wear 0, maintenance 0");
});

test("phase 8 scenario import: quake control month and severity delay browser quakes", async ({ page }) => {
    await importScenarioFixture(page, quakeControlFixtureDirectory);
    await page.getByTestId("pause-toggle").click();
    await expect(page.getByTestId("quake-status")).toHaveText("Quake: scheduled 1, active none, severity 0, triggered 0, next 0 months 2-2 severity 7");
    for (let index = 0; index < 63; index += 1) {
        await page.getByTestId("step").click();
    }
    await expect(page.getByTestId("tick")).toHaveText("Tick: 64");
    await expect(page.getByTestId("quake-status")).toHaveText("Quake: scheduled 1, active none, severity 0, triggered 0, next 0 months 2-2 severity 7");
    for (let index = 0; index < 64; index += 1) {
        await page.getByTestId("step").click();
    }
    await expect(page.getByTestId("tick")).toHaveText("Tick: 128");
    await expect(page.getByTestId("quake-status")).toHaveText("Quake: scheduled 1, active none, severity 0, triggered 1");
    await expect(page.getByTestId("last-event")).toHaveText("Last event: earthquake-applied");
});

test("phase 8 scenario import: epidemic outbreak uses imported terms", async ({ page }) => {
    await importScenarioFixture(page);
    await page.getByTestId("pause-toggle").click();
    await expect(page.getByTestId("epidemic-status")).toHaveText("Epidemic: ready (3 patients/18 ticks)");
    await expect(page.getByTestId("epidemic-reward")).toHaveText("Epidemic terms: spread 6 ticks/2 max, vacc 50/0, reward 8000/+30, penalty 6000/-35, contained 0/0, failed 0; scenario contagious 25/25, reduce 6m/10/0, fine 2000, comp 1000-15000");
    await page.getByTestId("start-epidemic-outbreak").click();
    await expect(page.getByTestId("action-status")).toHaveText("Action: epidemic started");
    await expect(page.getByTestId("waiting")).toHaveText("Waiting: 3");
    await expect(page.getByTestId("epidemic-status")).toHaveText("Epidemic: outbreak 1 0/3 contained, failed 0, spread 0/0 (2 left, next 7) (18 ticks)");
    await expect(page.getByTestId("epidemic-reward")).toHaveText(/^Epidemic terms: spread 6 ticks\/2 max, vacc 50\/150, reward \d+\/\+30, penalty 6000\/-35, contained 0\/1, failed 0; scenario contagious 25\/25, reduce 6m\/10\/0, fine 2000, comp 1000-15000$/u);
    await expect(page.getByTestId("start-epidemic-outbreak")).toBeDisabled();
    await expect(page.getByTestId("last-event")).toHaveText("Last event: epidemic-started");
});

test("phase 8 scenario import: vaccination cost changes browser epidemic expense", async ({ page }) => {
    await importScenarioFixture(page, vaccinationCostFixtureDirectory);
    await page.getByTestId("pause-toggle").click();
    await expect(page.getByTestId("epidemic-reward")).toHaveText("Epidemic terms: spread 6 ticks/2 max, vacc 80/0, reward 8000/+30, penalty 6000/-35, contained 0/0, failed 0; scenario contagious 25/25, reduce 6m/10/0, fine 2000, comp 1000-15000");
    const cashBefore = parseCash((await page.getByTestId("cash").textContent()) ?? "");
    await page.getByTestId("start-epidemic-outbreak").click();
    await expect(page.getByTestId("action-status")).toHaveText("Action: epidemic started");
    await expect(page.getByTestId("cash")).toHaveText(new RegExp(`^Cash: ${cashBefore - 240}(?:;.*)?$`, "u"));
    await expect(page.getByTestId("epidemic-reward")).toHaveText(/^Epidemic terms: spread 6 ticks\/2 max, vacc 80\/240, reward \d+\/\+30, penalty 6000\/-35, contained 0\/1, failed 0; scenario contagious 25\/25, reduce 6m\/10\/0, fine 2000, comp 1000-15000$/u);
});

test("phase 8 scenario import: epidemic fine and compensation change browser terms", async ({ page }) => {
    await importScenarioFixture(page, epidemicCompensationFixtureDirectory);
    await page.getByTestId("pause-toggle").click();
    await expect(page.getByTestId("epidemic-reward")).toHaveText("Epidemic terms: spread 6 ticks/2 max, vacc 50/0, reward 2001/+30, penalty 3702/-35, contained 0/0, failed 0; scenario contagious 25/25, reduce 6m/10/0, fine 1234, comp 2000-2002");
    await page.getByTestId("start-epidemic-outbreak").click();
    await expect(page.getByTestId("action-status")).toHaveText("Action: epidemic started");
    await expect(page.getByTestId("epidemic-reward")).toHaveText(/^Epidemic terms: spread 6 ticks\/2 max, vacc 50\/150, reward 200[0-2]\/\+30, penalty 3702\/-35, contained 0\/1, failed 0; scenario contagious 25\/25, reduce 6m\/10\/0, fine 1234, comp 2000-2002$/u);
});

test("phase 8 scenario import: epidemic spread timing uses imported SAM values", async ({ page }) => {
    await importScenarioFixture(page, epidemicSpreadFixtureDirectory);
    await page.getByTestId("pause-toggle").click();
    await expect(page.getByTestId("epidemic-reward")).toHaveText("Epidemic terms: spread 2 ticks/5 max, vacc 50/0, reward 8000/+30, penalty 6000/-35, contained 0/0, failed 0; scenario contagious 75/100, reduce 6m/1/100, fine 2000, comp 1000-15000");
    await page.getByTestId("start-epidemic-outbreak").click();
    await expect(page.getByTestId("epidemic-status")).toHaveText("Epidemic: outbreak 1 0/3 contained, failed 0, spread 0/0 (5 left, next 3) (18 ticks)");
    await page.getByTestId("treat").click();
    await expect(page.getByTestId("epidemic-status")).toHaveText("Epidemic: outbreak 1 1/3 contained, failed 0, spread 0/0 (5 left, next 3) (18 ticks)");
    await page.getByTestId("step").click();
    await expect(page.getByTestId("epidemic-status")).toHaveText("Epidemic: outbreak 1 1/3 contained, failed 0, spread 0/0 (5 left, next 3) (17 ticks)");
    await page.getByTestId("step").click();
    await expect(page.getByTestId("epidemic-status")).toHaveText("Epidemic: outbreak 1 1/4 contained, failed 0, spread 1/1 (4 left, next 7) (16 ticks)");
    await expect(page.getByTestId("last-event")).toHaveText("Last event: epidemic-spread");
});

test("phase 8 scenario import: mayor launch starts automatic VIP inspection", async ({ page }) => {
    await importScenarioFixture(page);
    await page.getByTestId("pause-toggle").click();
    await expect(page.getByTestId("vip-inspection-status")).toHaveText("VIP: ready (8 ticks)");
    await expect(page.getByTestId("vip-inspection-reward")).toHaveText("VIP terms: queue <= 2, reputation >= 450, reward 800/+25, penalty 300/-20, pass 0/0, fail 0; scenario mayor 150 ticks");
    for (let index = 0; index < 149; index += 1) {
        await page.getByTestId("step").click();
    }
    await expect(page.getByTestId("tick")).toHaveText("Tick: 150");
    await expect(page.getByTestId("vip-inspection-status")).toHaveText("VIP: visit 1 (8 ticks), queue 0/2, rooms 2");
    await expect(page.getByTestId("start-vip-inspection")).toBeDisabled();
    await expect(page.getByTestId("last-event")).toHaveText("Last event: vip-inspection-started");
});

test("phase 8 scenario import: disaster launch starts automatic emergency wave", async ({ page }) => {
    await importScenarioFixture(page);
    await page.getByTestId("pause-toggle").click();
    await expect(page.getByTestId("emergency-status")).toHaveText("Emergency: ready (4 patients/24 ticks, need 3 / 75%, Uncommon Cold); scenario scheduled 1, active 0, disaster 240 ticks");
    for (let index = 0; index < 239; index += 1) {
        await page.getByTestId("step").click();
    }
    await expect(page.getByTestId("tick")).toHaveText("Tick: 240");
    await expect(page.getByTestId("emergency-status")).toHaveText("Emergency: wave 1 0/3 saved, need 3 (24 ticks, Uncommon Cold); scenario scheduled 1, active none, disaster 240 ticks");
    await expect(page.getByTestId("waiting")).toHaveText("Waiting: 3");
    await expect(page.getByTestId("last-event")).toHaveText("Last event: emergency-started");
});

test("phase 8 scenario import: emergency control values change browser waves", async ({ page }) => {
    await importScenarioFixture(page, emergencyControlFixtureDirectory);
    await page.getByTestId("pause-toggle").click();
    await expect(page.getByTestId("emergency-status")).toHaveText("Emergency: ready (3 patients/24 ticks, need 3 / 67%, Itchy Feet); scenario scheduled 1, active 0, disaster 999 ticks");
    await expect(page.getByTestId("emergency-reward")).toHaveText("Emergency reward: 1234 cash, +62 reputation, won 0/0, failed 0, saved 100%");
    await page.getByTestId("start-emergency-wave").click();
    await expect(page.getByTestId("action-status")).toHaveText("Action: emergency started");
    await expect(page.getByTestId("waiting")).toHaveText("Waiting: 3");
    await expect(page.getByTestId("emergency-status")).toHaveText("Emergency: wave 1 0/3 saved, need 3 (24 ticks, Itchy Feet); scenario scheduled 1, active none, disaster 999 ticks");
    await expect(page.getByTestId("emergency-reward")).toHaveText("Emergency reward: 1234 cash, +62 reputation, won 0/1, failed 0, saved 0%");
});

test("phase 8 scenario import: abduction timing removes waiting patients", async ({ page }) => {
    await importScenarioFixture(page, abductionFixtureDirectory);
    await page.getByTestId("pause-toggle").click();
    await expect(page.getByTestId("event-count")).toHaveText("Events: 1; scenario score 300, vacc 50, rats 3000, abduct 0y/768 (0 triggered), mayor 150, disaster 999");
    await page.getByTestId("admit").click();
    await expect(page.getByTestId("waiting")).toHaveText("Waiting: 1");
    await page.getByTestId("step").click();
    await expect(page.getByTestId("waiting")).toHaveText("Waiting: 0");
    await expect(page.getByTestId("patient-deaths")).toContainText("abductions 1");
    await expect(page.getByTestId("event-count")).toHaveText("Events: 2; scenario score 300, vacc 50, rats 3000, abduct 0y/768 (1 triggered), mayor 150, disaster 999");
    await expect(page.getByTestId("last-event")).toHaveText("Last event: patient-abducted");
});

test("phase 8 scenario import: autopsy settings advance research after patient death", async ({ page }) => {
    await importScenarioFixture(page, autopsyFixtureDirectory);
    await page.getByTestId("pause-toggle").click();
    await expect(page.getByTestId("research-effect")).toContainText("autopsy 25%/-10%, autopsy totals 0/0");
    await page.getByTestId("staff-break-toggle").click();
    await page.getByTestId("admission-severity").selectOption("3");
    await page.getByTestId("admit").click();
    await page.getByTestId("start-research").click();
    await expect(page.getByTestId("research-status")).toContainText("Research: treatment 0/3 (120 ticks), invested 1500");
    for (let i = 0; i < 48; i += 1) {
        await page.getByTestId("step").click();
    }
    await expect(page.getByTestId("patient-deaths")).toContainText("Deaths: 1");
    await expect(page.getByTestId("waiting")).toHaveText("Waiting: 0");
    await expect(page.getByTestId("research-status")).toContainText("Research: treatment 0/3 (42 ticks), invested 1500");
    await expect(page.getByTestId("research-effect")).toContainText("autopsy 25%/-10%, autopsy totals 30/47");
    await expect(page.getByTestId("last-event")).toHaveText("Last event: patient-died");
});

test("phase 8 scenario import: patient behavior settings drive browser care controls", async ({ page }) => {
    await importScenarioFixture(page, patientBehaviorFixtureDirectory);
    await page.getByTestId("pause-toggle").click();
    await page.getByTestId("staff-break-toggle").click();
    await expect(page.getByTestId("patient-mood")).toHaveText("Mood: happy 0, unhappy 0, very 0, peep happy 100%; scenario mood 75/50/25, leave 150, litter 3/1, bowel 2/4, vomit 62, comfort 3/4");
    await selectVisiblePatient(page);
    await expect(page.getByTestId("selection-status")).toContainText("Selection: patient #");
    for (let index = 0; index < 2; index += 1) {
        await page.getByTestId("step").click();
    }
    await expect(page.getByTestId("patients-needing-toilet")).toHaveText("Need toilet: 1, threshold 2");
    await expect(page.getByTestId("patient-bowel-overflows")).toHaveText("Bowel overflows: 0, threshold 4");
    await expect(page.getByTestId("give-drink-selected-patient")).toBeEnabled();
    await page.getByTestId("give-drink-selected-patient").click();
    await expect(page.getByTestId("action-status")).toHaveText("Action: drink given");
    await expect(page.getByTestId("give-drink-selected-patient")).toBeDisabled();
    await expect(page.getByTestId("patient-drinks")).toContainText("Drinks served: 1");
    await expect(page.getByTestId("send-selected-patient-toilet")).toBeEnabled();
    await page.getByTestId("send-selected-patient-toilet").click();
    await expect(page.getByTestId("action-status")).toHaveText("Action: toilet used");
    await expect(page.getByTestId("send-selected-patient-toilet")).toBeDisabled();
    await expect(page.getByTestId("patients-needing-toilet")).toHaveText("Need toilet: 0, threshold 2");
    for (let index = 0; index < 3; index += 1) {
        await page.getByTestId("step").click();
    }
    await expect(page.getByTestId("patient-bowel-overflows")).toHaveText("Bowel overflows: 0, threshold 4");
    await expect(page.getByTestId("patient-litter")).toHaveText("Patient litter: 1, active 1, cleaned 0, cleanliness 100%");
    await expect(page.getByTestId("patient-vomits")).toHaveText("Patient vomits: 0, limit 62");
});

test("phase 8 scenario import: rat-hole removal chance drives browser litter cleanup", async ({ page }) => {
    await importScenarioFixture(page, ratHoleCleanupFixtureDirectory);
    await page.getByTestId("pause-toggle").click();
    await page.getByTestId("hire-handyman").click();
    const canvas = page.getByTestId("hospital-map-canvas");
    await canvas.hover({ position: { x: 416, y: 176 } });
    await expect(page.getByTestId("hospital-placement-mode")).toContainText("(valid)");
    await canvas.click({ position: { x: 416, y: 176 } });
    await expect(page.getByTestId("action-status")).toHaveText("Action: staff hired");
    await page.getByTestId("admission-severity").selectOption("3");
    await page.getByTestId("admit").click();
    await expect(page.getByTestId("event-count")).toHaveText("Events: 1; scenario score 300, vacc 50, rats 10000, abduct 4y/0 (0 triggered), mayor 150, disaster 999");
    await page.getByTestId("step").click();
    await expect(page.getByTestId("patient-litter")).toHaveText("Patient litter: 1, active 0, cleaned 1, cleanliness 0%");
    await expect(page.getByTestId("last-event")).toHaveText("Last event: patient-litter-cleaned");
});

test("phase 8 scenario import: original SAM illness pool drives automatic admissions", async ({ page }) => {
    await importScenarioFixture(page);
    await page.getByTestId("pause-toggle").click();
    await expect(page.getByTestId("paused")).toHaveText("Paused: yes");
    await page.getByTestId("hire-receptionist").click();
    await page.getByTestId("hospital-map-canvas").click({ position: { x: 416, y: 176 } });
    await expect(page.getByTestId("staff-market-status")).toContainText("receptionists 7");
    await expect(page.getByTestId("front-desk-status")).toHaveText("Front desk: 1 active receptionists, capacity 4, intake cap 4");
    await page.getByTestId("admissions-toggle").click();
    await expect(page.getByTestId("next-admission")).toHaveText(/^Next arrival: \d+ ticks; scenario illness 2, pop 3, pool \d+\/2(?:, next [A-Za-z '-]+)?, allocation 4\/1\/2, delay 3m\/192 ticks, auto \d+ ticks\/cap \d+$/u);

    for (let index = 0; index < 260; index += 1) {
        const summary = await page.getByTestId("casebook-summary").textContent() ?? "";
        if (summary.includes("Itchy Feet") && summary.includes("On my way to Ward")) {
            break;
        }
        await page.getByTestId("step").click();
    }

    await expect(page.getByTestId("casebook-summary")).toContainText("Itchy Feet");
    await expect(page.getByTestId("casebook-summary")).toContainText("On my way to Ward");
});

test("phase 8 scenario import: allocation delay gates automatic browser admissions", async ({ page }) => {
    await importScenarioFixture(page, allocationDelayFixtureDirectory);
    await page.getByTestId("pause-toggle").click();
    await page.getByTestId("hire-receptionist").click();
    await page.getByTestId("hospital-map-canvas").click({ position: { x: 416, y: 176 } });
    await expect(page.getByTestId("front-desk-status")).toHaveText("Front desk: 1 active receptionists, capacity 4, intake cap 4");
    await page.getByTestId("admissions-toggle").click();
    await expect(page.getByTestId("next-admission")).toHaveText(/^Next arrival: \d+ ticks; scenario illness 2, pop 3, pool \d+\/2(?:, next [A-Za-z '-]+)?, allocation 4\/1\/2, delay 1m\/64 ticks, auto \d+ ticks\/cap 4$/u);

    for (let index = 0; index < 62; index += 1) {
        await page.getByTestId("step").click();
    }
    await expect(page.getByTestId("waiting")).toHaveText("Waiting: 0");
    await expect(page.getByTestId("next-admission")).toContainText("Next arrival: 1 ticks;");
    await page.getByTestId("step").click();
    await expect(page.getByTestId("waiting")).toHaveText("Waiting: 1");
});

test("phase 8 scenario import: no-staff routing pressure slows automatic browser admissions", async ({ page }) => {
    await importScenarioFixture(page);
    await page.getByTestId("pause-toggle").click();
    await expect(page.getByTestId("routing-rules")).toHaveText("Scenario routing: queue 15, distance 1, no-staff 20 (+0 ticks)");
    await selectVisibleStaff(page, "Selection: Doctor #1");
    await page.getByTestId("fire-selected-staff").click();
    await expect(page.getByTestId("action-status")).toHaveText("Action: staff fired");
    await expect(page.getByTestId("routing-rules")).toHaveText("Scenario routing: queue 15, distance 1, no-staff 20 (+4 ticks)");
    await page.getByTestId("hire-receptionist").click();
    await page.getByTestId("hospital-map-canvas").click({ position: { x: 416, y: 176 } });
    await expect(page.getByTestId("front-desk-status")).toHaveText("Front desk: 1 active receptionists, capacity 4, intake cap 4");
    await page.getByTestId("admissions-toggle").click();
    await expect(page.getByTestId("next-admission")).toHaveText(/^Next arrival: \d+ ticks; scenario illness 2, pop 3, pool \d+\/2(?:, next [A-Za-z '-]+)?, allocation 4\/1\/2, delay 3m\/192 ticks, auto 14 ticks\/cap 4$/u);
});

test("phase 8 scenario import: allocation weights shape automatic browser disease selection", async ({ page }) => {
    await importScenarioFixture(page, allocationWeightsFixtureDirectory);
    await page.getByTestId("pause-toggle").click();
    await page.getByTestId("hire-receptionist").click();
    await page.getByTestId("hospital-map-canvas").click({ position: { x: 416, y: 176 } });
    await page.getByTestId("admissions-toggle").click();
    await expect(page.getByTestId("next-admission")).toHaveText(/^Next arrival: \d+ ticks; scenario illness 2, pop 3, pool \d+\/2(?:, next [A-Za-z '-]+)?, allocation 1\/1\/3, delay 0m\/0 ticks, auto \d+ ticks\/cap 4$/u);

    for (let index = 0; index < 40; index += 1) {
        await page.getByTestId("step").click();
    }

    expect(await savedAdmissionDiseaseIds(page, "allocation-weights")).toEqual([
        "mild-cold",
        "mild-cold",
        "mild-cold",
        "mild-cold",
    ]);
});

test("phase 8 scenario import: distance routing assigns browser patients to nearer GP rooms", async ({ page }) => {
    await importScenarioFixture(page, routingDistanceFixtureDirectory);
    await page.getByTestId("pause-toggle").click();
    await expect(page.getByTestId("routing-rules")).toHaveText("Scenario routing: queue 15, distance 1, no-staff 20 (+0 ticks)");
    await page.getByTestId("build-diagnosis-room").click();
    const canvas = page.getByTestId("hospital-map-canvas");
    await canvas.hover({ position: { x: 416, y: 176 } });
    await expect(page.getByTestId("hospital-placement-mode")).toContainText("(valid)");
    await canvas.click({ position: { x: 416, y: 176 } });
    await expect(page.getByTestId("action-status")).toHaveText("Action: room built");
    await page.getByTestId("hire-diagnostician").click();
    await canvas.click({ position: { x: 464, y: 176 } });
    await expect(page.getByTestId("action-status")).toHaveText("Action: staff hired");
    await canvas.click({ button: "right", position: { x: 416, y: 176 } });
    await page.getByTestId("step").click();
    await canvas.click({ position: { x: 408, y: 184 } });
    await expect(page.getByTestId("selection-status")).toContainText("Selection: GP's Office room #3");
    await expect(page.getByTestId("selection-status")).toContainText("patients #");
});

test("phase 8 scenario import: visual illness holds delay automatic visual admissions", async ({ page }) => {
    await importScenarioFixture(page, visualHoldFixtureDirectory);
    await page.getByTestId("pause-toggle").click();
    await expect(page.getByTestId("admission-rules")).toHaveText("Scenario holds: visual 1 months/2 patients");
    await page.getByTestId("hire-receptionist").click();
    await page.getByTestId("hospital-map-canvas").click({ position: { x: 416, y: 176 } });
    await expect(page.getByTestId("front-desk-status")).toHaveText("Front desk: 1 active receptionists, capacity 4, intake cap 4");
    await page.getByTestId("admissions-toggle").click();

    for (let index = 0; index < 30; index += 1) {
        await page.getByTestId("step").click();
    }

    const earlyDiseaseIds = await savedAdmissionDiseaseIds(page, "visual-hold-early");
    expect(earlyDiseaseIds.length).toBeGreaterThan(0);
    expect(earlyDiseaseIds).toEqual(earlyDiseaseIds.map(() => "mild-cold"));

    for (let index = 0; index < 44; index += 1) {
        await page.getByTestId("step").click();
    }

    await expect(page.getByTestId("tick")).toHaveText("Tick: 75");
    expect(await savedAdmissionDiseaseIds(page, "visual-hold-late")).toContain("cranial-pressure");
});

test("phase 8 scenario import: visual hold peep count gates browser admissions", async ({ page }) => {
    await importScenarioFixture(page, visualHoldPeepCountFixtureDirectory);
    await page.getByTestId("pause-toggle").click();
    await expect(page.getByTestId("admission-rules")).toHaveText("Scenario holds: visual 0 months/4 patients");
    await page.getByTestId("hire-receptionist").click();
    await page.getByTestId("hospital-map-canvas").click({ position: { x: 416, y: 176 } });
    await page.getByTestId("admissions-toggle").click();

    for (let index = 0; index < 40; index += 1) {
        await page.getByTestId("step").click();
    }

    const earlyDiseaseIds = await savedAdmissionDiseaseIds(page, "visual-hold-count-early");
    expect(earlyDiseaseIds.length).toBeGreaterThanOrEqual(4);
    expect(earlyDiseaseIds).toEqual(earlyDiseaseIds.map(() => "mild-cold"));

    for (let index = 0; index < 20; index += 1) {
        await page.getByTestId("step").click();
    }

    expect(await savedAdmissionDiseaseIds(page, "visual-hold-count-late")).toContain("cranial-pressure");
});

test("phase 8 scenario import: visuals-available months gate automatic admissions", async ({ page }) => {
    await importScenarioFixture(page, visualsAvailableFixtureDirectory);
    await page.getByTestId("pause-toggle").click();
    await expect(page.getByTestId("admission-rules")).toHaveText("Scenario holds: visual 0 months/2 patients");
    await page.getByTestId("hire-receptionist").click();
    await page.getByTestId("hospital-map-canvas").click({ position: { x: 416, y: 176 } });
    await expect(page.getByTestId("front-desk-status")).toHaveText("Front desk: 1 active receptionists, capacity 4, intake cap 4");
    await page.getByTestId("admissions-toggle").click();

    for (let index = 0; index < 40; index += 1) {
        await page.getByTestId("step").click();
    }

    const earlyDiseaseIds = await savedAdmissionDiseaseIds(page, "visuals-available-early");
    expect(earlyDiseaseIds.length).toBeGreaterThan(0);
    expect(earlyDiseaseIds).toEqual(earlyDiseaseIds.map(() => "mild-cold"));

    for (let index = 0; index < 36; index += 1) {
        await page.getByTestId("step").click();
    }

    await expect(page.getByTestId("tick")).toHaveText("Tick: 77");
    expect(await savedAdmissionDiseaseIds(page, "visuals-available-late")).toContain("transparency");
});

test("phase 8 scenario import: locked object availability gates automatic disease admissions", async ({ page }) => {
    await importScenarioFixture(page, objectDiseaseGateFixtureDirectory);
    await page.getByTestId("pause-toggle").click();
    await expect(page.getByTestId("room-availability")).toHaveText("Room availability: GP's Office, Ward, Fracture Clinic");
    await expect(page.getByTestId("object-availability")).toHaveText("Object availability: 1/2 available, locked 1, disabled 0, research 0; available: Cast Remover; locked: Hair Restorer");
    await expect(page.getByTestId("build-fracture-clinic-room")).toHaveText("Build Fracture Clinic (1500)");
    await page.getByTestId("hire-receptionist").click();
    await page.getByTestId("hospital-map-canvas").click({ position: { x: 416, y: 176 } });
    await page.getByTestId("hire-receptionist").click();
    await page.getByTestId("hospital-map-canvas").click({ position: { x: 432, y: 176 } });
    await page.getByTestId("hire-receptionist").click();
    await page.getByTestId("hospital-map-canvas").click({ position: { x: 448, y: 176 } });
    await page.getByTestId("hire-receptionist").click();
    await page.getByTestId("hospital-map-canvas").click({ position: { x: 464, y: 176 } });
    await expect(page.getByTestId("front-desk-status")).toHaveText("Front desk: 4 active receptionists, capacity 16, intake cap 11");
    await page.getByTestId("admissions-toggle").click();

    for (let index = 0; index < 40; index += 1) {
        await page.getByTestId("step").click();
    }

    const earlyDiseaseIds = await savedAdmissionDiseaseIds(page, "object-disease-gate-early");
    expect(earlyDiseaseIds.length).toBeGreaterThan(0);
    expect(earlyDiseaseIds).toEqual(earlyDiseaseIds.map(() => "fractured-bones"));

    for (let index = 0; index < 36; index += 1) {
        await page.getByTestId("step").click();
    }

    await expect(page.getByTestId("tick")).toHaveText("Tick: 77");
    await expect(page.getByTestId("room-availability")).toHaveText("Room availability: GP's Office, Ward, Fracture Clinic, Hair Restoration");
    await expect(page.getByTestId("build-hair-restoration-room")).toHaveText("Build Hair Restoration (1600)");
    expect(await savedAdmissionDiseaseIds(page, "object-disease-gate-late")).toContain("baldness");
});

test("phase 8 scenario import: DNA Fixer availability admits Alien DNA patients", async ({ page }) => {
    await importScenarioFixture(page, dnaFixerFixtureDirectory);
    await page.getByTestId("pause-toggle").click();
    await expect(page.getByTestId("room-availability")).toContainText("DNA Fixer");
    await expect(page.getByTestId("object-availability")).toContainText("available: DNA Fixer");
    await expect(page.getByTestId("build-dna-fixer-room")).toHaveText("Build DNA Fixer (1800)");
    await expect(page.getByTestId("staff-market-status")).toContainText("researchers 100");

    const canvas = page.getByTestId("hospital-map-canvas");
    await page.getByTestId("build-dna-fixer-room").click();
    await canvas.hover({ position: { x: 384, y: 160 } });
    await expect(page.getByTestId("hospital-placement-mode")).toContainText("(valid)");
    await canvas.click({ position: { x: 384, y: 160 } });
    await expect(page.getByTestId("action-status")).toHaveText("Action: room built");
    await expect(page.getByTestId("specialized-treatment-rooms")).toHaveText("Specialized rooms: pharmacy 0, specialist 0, Psychiatry 0, Inflation Room 0, Slack Tongue Clinic 0, Fracture Clinic 0, Hair Restoration 0, Jelly Vat 0, Decontamination 0, Electrolysis 0, DNA Fixer 1");

    await page.getByTestId("hire-diagnostician").click();
    await canvas.click({ position: { x: 432, y: 176 } });
    await expect(page.getByTestId("action-status")).toHaveText("Action: staff hired");
    await expect(page.getByTestId("research-effect")).toContainText("throughput 2x/1 researchers");
    await page.getByTestId("hire-receptionist").click();
    await canvas.click({ position: { x: 416, y: 176 } });
    await page.getByTestId("admissions-toggle").click();

    for (let index = 0; index < 40; index += 1) {
        await page.getByTestId("step").click();
    }

    const diseaseIds = await savedAdmissionDiseaseIds(page, "dna-fixer-alien-dna");
    expect(diseaseIds.length).toBeGreaterThan(0);
    expect(diseaseIds).toEqual(diseaseIds.map(() => "alien-dna"));
    await stepUntilMetricContains(page, "casebook-summary", "DNA Fixer", 160);
    await stepUntilMetricNumberAtLeast(page, "discharged", "Discharged", 1, 160);
    await stepUntilMetricNumberAtLeast(page, "treated", "Treated", 1, 1);
    await expect(page.getByTestId("treatment-failures")).toContainText("Treatment failures: 0");
    await expect(page.getByTestId("level-objective-progress")).toHaveText(/Objective: discharge [1-9]\d*\/10/u);
    await stepUntilMetricContains(page, "specialized-treatment-rooms", "DNA Fixer 1", 1);
});

test("phase 8 scenario import: contagious reducers gate automatic disease admissions", async ({ page }) => {
    await importScenarioFixture(page, contagiousReducerFixtureDirectory);
    await page.getByTestId("pause-toggle").click();
    await expect(page.getByTestId("epidemic-reward")).toContainText("scenario contagious 25/25, reduce 1m/2/0");
    await page.getByTestId("hire-receptionist").click();
    await page.getByTestId("hospital-map-canvas").click({ position: { x: 416, y: 176 } });
    await expect(page.getByTestId("front-desk-status")).toHaveText("Front desk: 1 active receptionists, capacity 4, intake cap 4");
    await page.getByTestId("admissions-toggle").click();

    for (let index = 0; index < 40; index += 1) {
        await page.getByTestId("step").click();
    }

    const earlyDiseaseIds = await savedAdmissionDiseaseIds(page, "contagious-reducer-early");
    expect(earlyDiseaseIds.length).toBeGreaterThan(0);
    expect(earlyDiseaseIds).toEqual(earlyDiseaseIds.map(() => "mild-cold"));

    for (let index = 0; index < 36; index += 1) {
        await page.getByTestId("step").click();
    }

    await expect(page.getByTestId("tick")).toHaveText("Tick: 77");
    expect(await savedAdmissionDiseaseIds(page, "contagious-reducer-late")).toEqual(expect.arrayContaining(["mild-cold"]));
    expect(await savedAdmissionDiseaseIds(page, "contagious-reducer-late")).not.toContain("infectious-laughter");
});

test("phase 8 scenario import: contagious rate zero still respects treatment-room gating", async ({ page }) => {
    await importScenarioFixture(page, contagiousRateFixtureDirectory);
    await page.getByTestId("pause-toggle").click();
    await expect(page.getByTestId("epidemic-reward")).toContainText("scenario contagious 25/25, reduce 1m/2/0");
    await expect(page.getByTestId("scenario-expertise")).toHaveText("Scenario expertise: 1/2 known, 1 research-required, diagnosable 2, capability 100, next research 40000 D CARDIO");
    await page.getByTestId("hire-receptionist").click();
    await page.getByTestId("hospital-map-canvas").click({ position: { x: 416, y: 176 } });
    await expect(page.getByTestId("front-desk-status")).toHaveText("Front desk: 1 active receptionists, capacity 4, intake cap 4");
    await page.getByTestId("admissions-toggle").click();

    for (let index = 0; index < 40; index += 1) {
        await page.getByTestId("step").click();
    }

    const diseaseIds = await savedAdmissionDiseaseIds(page, "contagious-rate-zero");
    expect(diseaseIds).toEqual([]);
});
