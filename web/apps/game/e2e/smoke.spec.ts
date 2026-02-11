import { test, expect } from "@playwright/test";

test("phase 0 app smoke renders deterministic status", async ({ page }) => {
  await page.goto("/");

  await expect(page.getByRole("heading", { name: "Phase 0 Smoke Scene" })).toBeVisible();
  await expect(page.getByTestId("seed")).toHaveText("Seed: 1234");
  await expect(page.getByTestId("tick")).toHaveText("Tick: 5");
  await expect(page.getByTestId("treated")).toHaveText("Treated: 1");
  await expect(page.getByTestId("hash")).toHaveText("State hash: 54a6d1b6");
});
