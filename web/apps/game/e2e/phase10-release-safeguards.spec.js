import { expect, test } from "@playwright/test";
test("phase 10 release safeguards: dashboard exposes rollout status and telemetry routing", async ({ page }) => {
    await page.goto("/");
    await page.evaluate(() => window.localStorage.clear());
    await page.reload();
    await expect(page.getByTestId("phase10-release-dashboard")).toBeVisible();
    await expect(page.getByTestId("phase10-rollout-stage")).toHaveText("Rollout stage: canary");
    await expect(page.getByTestId("phase10-rollout-traffic")).toHaveText("Traffic allocation: 5%");
    await expect(page.getByTestId("phase10-error-count")).toHaveText("Errors: 0");
    await expect(page.getByTestId("phase10-alert-routes")).toHaveText("Last alert routes: none");
    await page.getByTestId("phase10-simulate-crash").click();
    await expect(page.getByTestId("phase10-error-count")).toHaveText("Errors: 1");
    await expect(page.getByTestId("phase10-critical-count")).toHaveText("Critical: 1");
    await expect(page.getByTestId("phase10-alert-routes")).toContainText("pagerduty");
});
test("phase 10 release safeguards: promote-stage control progresses canary to progressive", async ({ page }) => {
    await page.goto("/");
    await page.evaluate(() => window.localStorage.clear());
    await page.reload();
    await page.getByTestId("phase10-promote-stage").click();
    await expect(page.getByTestId("phase10-rollout-stage")).toHaveText("Rollout stage: progressive");
    await expect(page.getByTestId("phase10-rollout-traffic")).toHaveText("Traffic allocation: 50%");
    await expect(page.getByTestId("phase10-health-decision")).toContainText("eligible");
});
