import { expect, test } from "@playwright/test";
import { importAssetsAndEnterPlayableShell } from "./helpers/phase8-import";
function parseCash(raw) {
    const match = raw.match(/^Cash:\s*(-?\d+)(?:;.*)?$/);
    if (!match) {
        throw new Error(`Unable to parse cash metric from: ${raw}`);
    }
    return Number(match[1]);
}
function parseReputation(raw) {
    const match = raw.match(/^Reputation:\s*(\d+)$/);
    if (!match) {
        throw new Error(`Unable to parse reputation metric from: ${raw}`);
    }
    return Number(match[1]);
}
test("phase 7 slice 3 player journey: progress economy milestones and deterministic event flow", async ({ page }) => {
    await importAssetsAndEnterPlayableShell(page);
    await page.getByTestId("pause-toggle").click();
    await expect(page.getByTestId("paused")).toHaveText("Paused: yes");
    await expect(page.getByTestId("campaign-progress")).toHaveText("Campaign: level 1/2");
    await expect(page.getByTestId("level-objective-status")).toHaveText("Level status: running");
    await expect(page.getByTestId("level-objective-progress")).toHaveText("Objective: discharge 0/3");
    await expect(page.getByTestId("level-objective-safety")).toHaveText("Safety: cash > 0, reputation >= 1");
    await expect(page.getByTestId("restart-level")).toBeEnabled();
    await expect(page.getByTestId("next-level")).toBeDisabled();
    await page.getByTestId("step").click();
    await expect(page.getByTestId("cashflow-net")).toContainText("-");
    await expect(page.getByTestId("cashflow-cumulative")).toHaveText("Cumulative cashflow: 0 - 28 = -28");
    await expect(page.getByTestId("last-event")).toHaveText("Last event: cashflow-negative");
    await expect(page.getByTestId("event-count")).toHaveText("Events: 1");
    await expect(page.getByTestId("recent-events")).toHaveText("Recent events: 1:cashflow-negative");
    await expect(page.getByTestId("advisor-status")).toHaveText("Advisor: stable");
    for (let i = 0; i < 3; i += 1) {
        await page.getByTestId("admit").click();
        await page.getByTestId("treat").click();
    }
    await expect(page.getByTestId("milestone-level")).toHaveText("Milestones: 2, next milestone.community-trust in 2 discharges");
    await expect(page.getByTestId("unlocks")).toHaveText("Unlocks: 2 (unlock.finance-ledger,unlock.insurance-contracts), income +6, next unlock in 2 discharges");
    await expect(page.getByTestId("event-count")).toHaveText("Events: 3");
    await expect(page.getByTestId("last-event")).toHaveText("Last event: milestone-unlocked");
    await expect(page.getByTestId("recent-events")).toContainText("milestone-unlocked");
    await expect(page.getByTestId("advisor-status")).toHaveText("Advisor: milestone unlocked");
    await expect(page.getByTestId("level-objective-status")).toHaveText("Level status: won");
    await expect(page.getByTestId("level-objective-progress")).toHaveText("Objective: discharge 3/3");
    await expect(page.getByTestId("next-level")).toBeEnabled();
    await page.keyboard.press("KeyN");
    await expect(page.getByTestId("save-status")).toHaveText("Save: next level LEVELS/SECOND.MAP");
    await expect(page.getByTestId("hospital-map-select")).toHaveValue("LEVELS/SECOND.MAP");
    await expect(page.getByTestId("hospital-canvas-summary")).toContainText("LEVELS/SECOND.MAP");
    await expect(page.getByTestId("campaign-progress")).toHaveText("Campaign: level 2/2");
    await expect(page.getByTestId("level-objective-status")).toHaveText("Level status: running");
    await expect(page.getByTestId("level-objective-progress")).toHaveText(/^Objective: discharge 0\/4, cash \d+\/250, reputation \d+\/6$/u);
    await expect(page.getByTestId("level-objective-safety")).toHaveText("Safety: cash > 0, reputation >= 6, target cash 250");
    await expect(page.getByTestId("next-level")).toBeDisabled();
    await page.keyboard.press("Shift+KeyR");
    await expect(page.getByTestId("save-status")).toHaveText("Save: restarted LEVELS/SECOND.MAP");
    await expect(page.getByTestId("level-objective-progress")).toHaveText(/^Objective: discharge 0\/4, cash \d+\/250, reputation \d+\/6$/u);
    await expect(page.getByTestId("cash")).toContainText("Cash:");
});
test("phase 7 slice 3 player journey: pricing policy changes treatment revenue", async ({ page }) => {
    await importAssetsAndEnterPlayableShell(page);
    await page.getByTestId("pause-toggle").click();
    await expect(page.getByTestId("pricing-policy-status")).toHaveText("Pricing: standard, cash 100%, reputation +0/cure");
    await page.getByTestId("pricing-policy").selectOption("premium");
    await expect(page.getByTestId("action-status")).toHaveText("Action: pricing policy changed");
    await expect(page.getByTestId("pricing-policy-status")).toHaveText("Pricing: premium, cash 135%, reputation -3/cure");
    const cashBefore = parseCash((await page.getByTestId("cash").textContent()) ?? "");
    await page.getByTestId("admit").click();
    await page.getByTestId("treat").click();
    await expect(page.getByTestId("action-status")).toHaveText("Action: patient treated");
    await expect(page.getByTestId("cash")).toHaveText(`Cash: ${cashBefore + 243}`);
});
test("phase 7 slice 3 player journey: loans bridge cashflow and can be repaid", async ({ page }) => {
    await importAssetsAndEnterPlayableShell(page);
    await page.getByTestId("pause-toggle").click();
    await expect(page.getByTestId("loan-status")).toHaveText("Loan: 0/20000, chunk 5000, available 5000, repay 0");
    await expect(page.getByTestId("loan-interest")).toHaveText("Loan interest: 0 tick, 0 total");
    await expect(page.getByTestId("repay-loan")).toBeDisabled();
    const cashBefore = parseCash((await page.getByTestId("cash").textContent()) ?? "");
    await page.getByTestId("take-loan").click();
    await expect(page.getByTestId("action-status")).toHaveText("Action: loan taken");
    await expect(page.getByTestId("cash")).toHaveText(`Cash: ${cashBefore + 5000}`);
    await expect(page.getByTestId("loan-status")).toHaveText("Loan: 5000/20000, chunk 5000, available 5000, repay 5000");
    await expect(page.getByTestId("loan-interest")).toHaveText("Loan interest: 2 tick, 0 total");
    await page.getByTestId("step").click();
    await expect(page.getByTestId("cashflow-net")).toHaveText("Tick cashflow: 0 - 16 = -16 (negative)");
    await expect(page.getByTestId("cashflow-cumulative")).toHaveText("Cumulative cashflow: 0 - 30 = -30");
    await expect(page.getByTestId("loan-interest")).toHaveText("Loan interest: 2 tick, 2 total");
    await page.getByTestId("repay-loan").click();
    await expect(page.getByTestId("action-status")).toHaveText("Action: loan repaid");
    await expect(page.getByTestId("loan-status")).toHaveText("Loan: 0/20000, chunk 5000, available 5000, repay 0");
});
test("phase 7 slice 3 player journey: finance ledger unlocks recoverable audits", async ({ page }) => {
    await importAssetsAndEnterPlayableShell(page);
    await page.getByTestId("pause-toggle").click();
    await expect(page.getByTestId("finance-ledger")).toHaveText("Finance ledger: locked");
    await expect(page.getByTestId("finance-audit")).toHaveText("Finance audit: recover 350 cash, cooldown 10 ticks, recovered 0/0");
    await expect(page.getByTestId("run-finance-audit")).toBeDisabled();
    await page.getByTestId("admit").click();
    await page.getByTestId("treat").click();
    await expect(page.getByTestId("milestone-level")).toHaveText("Milestones: 1, next milestone.patient-flow in 2 discharges");
    await expect(page.getByTestId("finance-ledger")).toHaveText("Finance ledger: audit ready, audits 0, recovered 0");
    await expect(page.getByTestId("run-finance-audit")).toBeEnabled();
    const cashBefore = parseCash((await page.getByTestId("cash").textContent()) ?? "");
    await page.getByTestId("playfield").focus();
    await page.keyboard.press("F2");
    await expect(page.getByTestId("bank-stats-panel")).toBeVisible();
    await expect(page.getByTestId("bank-stats-ledger")).toHaveText("Finance ledger: audit ready, audits 0, recovered 0");
    await expect(page.getByTestId("bank-stats-run-audit")).toBeEnabled();
    await page.getByTestId("bank-stats-run-audit").click();
    await expect(page.getByTestId("action-status")).toHaveText("Action: finance audit run");
    await expect(page.getByTestId("bank-stats-ledger")).toHaveText("Finance ledger: audit cooldown 10 ticks, audits 1, recovered 350");
    await expect(page.getByTestId("bank-stats-audit")).toHaveText("Finance audit: recover 350 cash, cooldown 10 ticks, recovered 350/1");
    await expect(page.getByTestId("finance-ledger")).toHaveText("Finance ledger: audit cooldown 10 ticks, audits 1, recovered 350");
    await expect(page.getByTestId("finance-audit")).toHaveText("Finance audit: recover 350 cash, cooldown 10 ticks, recovered 350/1");
    await expect(page.getByTestId("cash")).toHaveText(`Cash: ${cashBefore + 350}`);
    await expect(page.getByTestId("run-finance-audit")).toBeDisabled();
    for (let index = 0; index < 10; index += 1) {
        await page.getByTestId("step").click();
    }
    await expect(page.getByTestId("finance-ledger")).toHaveText("Finance ledger: audit ready, audits 1, recovered 350");
    await expect(page.getByTestId("run-finance-audit")).toBeEnabled();
});
test("phase 7 slice 3 player journey: marketing campaign recovers reputation", async ({ page }) => {
    await importAssetsAndEnterPlayableShell(page);
    await page.getByTestId("pause-toggle").click();
    const cashBefore = parseCash((await page.getByTestId("cash").textContent()) ?? "");
    const reputationBefore = parseReputation((await page.getByTestId("reputation").textContent()) ?? "");
    await expect(page.getByTestId("marketing-campaign")).toHaveText(`Marketing: 600 => +35 reputation (${reputationBefore}->${Math.min(1000, reputationBefore + 35)}), ready`);
    await page.getByTestId("run-marketing-campaign").click();
    await expect(page.getByTestId("action-status")).toHaveText("Action: marketing campaign launched");
    await expect(page.getByTestId("cash")).toHaveText(`Cash: ${cashBefore - 600}`);
    await expect(page.getByTestId("reputation")).toHaveText(`Reputation: ${Math.min(1000, reputationBefore + 35)}`);
    await expect(page.getByTestId("marketing-campaign")).toHaveText(`Marketing: 600 => +35 reputation (${Math.min(1000, reputationBefore + 35)}->${Math.min(1000, reputationBefore + 70)}), ready`);
    await expect(page.getByTestId("last-event")).toHaveText("Last event: marketing-campaign-run");
});
test("phase 7 slice 3 player journey: insurance contracts unlock and pay claims", async ({ page }) => {
    await importAssetsAndEnterPlayableShell(page);
    await page.getByTestId("pause-toggle").click();
    await expect(page.getByTestId("insurance-contract-status")).toHaveText("Insurance: locked");
    await expect(page.getByTestId("insurance-contract-reward")).toHaveText("Insurance terms: severity 2, reward 650/+15, penalty 250/-12, completed 0/0, failed 0");
    await expect(page.getByTestId("start-insurance-contract")).toBeDisabled();
    for (let index = 0; index < 3; index += 1) {
        await page.getByTestId("admit").click();
        await page.getByTestId("treat").click();
    }
    await expect(page.getByTestId("insurance-contract-status")).toHaveText("Insurance: ready (2 patients/16 ticks)");
    await expect(page.getByTestId("start-insurance-contract")).toBeEnabled();
    const cashBefore = parseCash((await page.getByTestId("cash").textContent()) ?? "");
    const reputationBefore = parseReputation((await page.getByTestId("reputation").textContent()) ?? "");
    await page.getByTestId("start-insurance-contract").click();
    await expect(page.getByTestId("action-status")).toHaveText("Action: insurance contract started");
    await expect(page.getByTestId("waiting")).toHaveText("Waiting: 2");
    await expect(page.getByTestId("insurance-contract-status")).toHaveText("Insurance: contract 1 0/2 claims, failed 0, remaining 2 (16 ticks)");
    await expect(page.getByTestId("start-insurance-contract")).toBeDisabled();
    await page.getByTestId("treat").click();
    await page.getByTestId("treat").click();
    await expect(page.getByTestId("insurance-contract-status")).toHaveText("Insurance: ready (2 patients/16 ticks)");
    await expect(page.getByTestId("insurance-contract-reward")).toHaveText("Insurance terms: severity 2, reward 650/+15, penalty 250/-12, completed 1/1, failed 0");
    await expect(page.getByTestId("last-event")).toHaveText("Last event: insurance-contract-completed");
    await expect(page.getByTestId("cash")).toHaveText(`Cash: ${cashBefore + 1010}`);
    await expect(page.getByTestId("reputation")).toHaveText(`Reputation: ${Math.min(1000, reputationBefore + 23)}`);
});
test("phase 7 slice 3 player journey: hospital awards reward strong ratings", async ({ page }) => {
    await importAssetsAndEnterPlayableShell(page);
    await page.getByTestId("pause-toggle").click();
    await expect(page.getByTestId("hospital-awards")).toContainText("Awards: ready");
    for (let index = 0; index < 3; index += 1) {
        await page.getByTestId("admission-severity").selectOption("1");
        await page.getByTestId("admit").click();
        await page.getByTestId("treat").click();
    }
    await expect(page.getByTestId("hospital-rating")).toHaveText("Rating: 87/100 (gold), award 1000/+30");
    const cashBefore = parseCash((await page.getByTestId("cash").textContent()) ?? "");
    const reputationBefore = parseReputation((await page.getByTestId("reputation").textContent()) ?? "");
    await page.getByTestId("run-awards-ceremony").click();
    await expect(page.getByTestId("action-status")).toHaveText("Action: awards completed");
    await expect(page.getByTestId("hospital-awards")).toHaveText("Awards: gold 87/100, ceremonies 1, totals 1000/+30");
    await expect(page.getByTestId("last-event")).toHaveText("Last event: hospital-award-granted");
    await expect(page.getByTestId("cash")).toHaveText(`Cash: ${cashBefore + 1000}`);
    await expect(page.getByTestId("reputation")).toHaveText(`Reputation: ${Math.min(1000, reputationBefore + 30)}`);
});
test("phase 7 slice 3 player journey: treatment research improves success bonus", async ({ page }) => {
    await importAssetsAndEnterPlayableShell(page);
    await page.getByTestId("pause-toggle").click();
    await expect(page.getByTestId("research-status")).toHaveText("Research: treatment 0/3, invested 0");
    await expect(page.getByTestId("research-effect")).toHaveText("Research effect: +0% success, next 1500/6 ticks, throughput 1x/0 researchers");
    const cashBefore = parseCash((await page.getByTestId("cash").textContent()) ?? "");
    await page.getByTestId("start-research").click();
    await expect(page.getByTestId("action-status")).toHaveText("Action: research started");
    await expect(page.getByTestId("cash")).toHaveText(`Cash: ${cashBefore - 1500}`);
    await expect(page.getByTestId("research-status")).toHaveText("Research: treatment 0/3 (6 ticks), invested 1500");
    await expect(page.getByTestId("start-research")).toBeDisabled();
    for (let i = 0; i < 6; i += 1) {
        await page.getByTestId("step").click();
    }
    await expect(page.getByTestId("research-status")).toHaveText("Research: treatment 1/3, invested 1500");
    await expect(page.getByTestId("research-effect")).toHaveText("Research effect: +20% success, next 1500/6 ticks, throughput 1x/0 researchers");
    await expect(page.getByTestId("last-event")).toHaveText("Last event: research-completed");
});
test("phase 7 slice 3 player journey: emergency wave rewards fast treatment", async ({ page }) => {
    await importAssetsAndEnterPlayableShell(page);
    await page.getByTestId("pause-toggle").click();
    await expect(page.getByTestId("emergency-status")).toHaveText("Emergency: ready (4 patients/24 ticks, need 4 / 100%)");
    await expect(page.getByTestId("emergency-reward")).toHaveText("Emergency reward: 900 cash, +45 reputation, won 0/0, failed 0, saved 100%");
    const cashBefore = parseCash((await page.getByTestId("cash").textContent()) ?? "");
    const reputationBefore = parseReputation((await page.getByTestId("reputation").textContent()) ?? "");
    await page.getByTestId("start-emergency-wave").click();
    await expect(page.getByTestId("action-status")).toHaveText("Action: emergency started");
    await expect(page.getByTestId("waiting")).toHaveText("Waiting: 4");
    await expect(page.getByTestId("emergency-status")).toHaveText("Emergency: wave 1 0/4 saved, need 4 (24 ticks)");
    await expect(page.getByTestId("start-emergency-wave")).toBeDisabled();
    for (let index = 0; index < 4; index += 1) {
        await page.getByTestId("treat").click();
    }
    await expect(page.getByTestId("emergency-status")).toHaveText("Emergency: ready (4 patients/24 ticks, need 4 / 100%)");
    await expect(page.getByTestId("emergency-reward")).toHaveText("Emergency reward: 900 cash, +45 reputation, won 1/1, failed 0, saved 100%");
    await expect(page.getByTestId("last-event")).toHaveText("Last event: emergency-succeeded");
    await expect(page.getByTestId("cash")).toHaveText(`Cash: ${cashBefore + 1780}`);
    await expect(page.getByTestId("reputation")).toHaveText(`Reputation: ${Math.min(1000, reputationBefore + 69)}`);
});
test("phase 7 slice 3 player journey: epidemic outbreak rewards containment", async ({ page }) => {
    await importAssetsAndEnterPlayableShell(page);
    await page.getByTestId("pause-toggle").click();
    await expect(page.getByTestId("epidemic-status")).toHaveText("Epidemic: ready (3 patients/18 ticks)");
    await expect(page.getByTestId("epidemic-reward")).toHaveText("Epidemic terms: spread 6 ticks/2 max, vacc 0/0, reward 700/+30, penalty 500/-35, contained 0/0, failed 0");
    const cashBefore = parseCash((await page.getByTestId("cash").textContent()) ?? "");
    const reputationBefore = parseReputation((await page.getByTestId("reputation").textContent()) ?? "");
    await page.getByTestId("start-epidemic-outbreak").click();
    await expect(page.getByTestId("action-status")).toHaveText("Action: epidemic started");
    await expect(page.getByTestId("waiting")).toHaveText("Waiting: 3");
    await expect(page.getByTestId("epidemic-status")).toHaveText("Epidemic: outbreak 1 0/3 contained, failed 0, spread 0/0 (2 left, next 7) (18 ticks)");
    await expect(page.getByTestId("start-epidemic-outbreak")).toBeDisabled();
    for (let index = 0; index < 3; index += 1) {
        await page.getByTestId("treat").click();
    }
    await expect(page.getByTestId("epidemic-status")).toHaveText("Epidemic: ready (3 patients/18 ticks)");
    await expect(page.getByTestId("epidemic-reward")).toHaveText("Epidemic terms: spread 6 ticks/2 max, vacc 0/0, reward 700/+30, penalty 500/-35, contained 1/1, failed 0");
    await expect(page.getByTestId("last-event")).toHaveText("Last event: epidemic-contained");
    await expect(page.getByTestId("cash")).toHaveText(`Cash: ${cashBefore + 1240}`);
    await expect(page.getByTestId("reputation")).toHaveText(`Reputation: ${Math.min(1000, reputationBefore + 42)}`);
});
test("phase 7 slice 3 player journey: VIP inspection scores hospital quality", async ({ page }) => {
    await importAssetsAndEnterPlayableShell(page);
    await page.getByTestId("pause-toggle").click();
    await expect(page.getByTestId("vip-inspection-status")).toHaveText("VIP: ready (8 ticks)");
    await expect(page.getByTestId("vip-inspection-reward")).toHaveText("VIP terms: queue <= 2, reputation >= 450, reward 800/+25, penalty 300/-20, pass 0/0, fail 0");
    const cashBefore = parseCash((await page.getByTestId("cash").textContent()) ?? "");
    const reputationBefore = parseReputation((await page.getByTestId("reputation").textContent()) ?? "");
    await page.getByTestId("start-vip-inspection").click();
    await expect(page.getByTestId("action-status")).toHaveText("Action: VIP inspection started");
    await expect(page.getByTestId("vip-inspection-status")).toHaveText("VIP: visit 1 (8 ticks), queue 0/2, rooms 2");
    await expect(page.getByTestId("start-vip-inspection")).toBeDisabled();
    for (let index = 0; index < 8; index += 1) {
        await page.getByTestId("step").click();
    }
    await expect(page.getByTestId("vip-inspection-status")).toHaveText("VIP: ready (8 ticks)");
    await expect(page.getByTestId("vip-inspection-reward")).toHaveText("VIP terms: queue <= 2, reputation >= 450, reward 800/+25, penalty 300/-20, pass 1/1, fail 0");
    await expect(page.getByTestId("last-event")).toHaveText("Last event: vip-inspection-passed");
    await expect(page.getByTestId("cash")).toHaveText(`Cash: ${cashBefore + 688}`);
    expect(parseReputation((await page.getByTestId("reputation").textContent()) ?? "")).toBeGreaterThan(reputationBefore);
});
