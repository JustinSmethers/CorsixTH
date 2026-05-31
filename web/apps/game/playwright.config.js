import { defineConfig, devices } from "@playwright/test";

const port = Number(process.env.CORSIXTH_WEB_PORT ?? 4173);
const host = "127.0.0.1";
const baseURL = `http://${host}:${port}`;
const workspaceRoot = new URL("../..", import.meta.url).pathname;

export default defineConfig({
  testDir: "./e2e",
  timeout: 15_000,
  expect: {
    timeout: 5_000
  },
  use: {
    baseURL,
    trace: "retain-on-failure"
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] }
    }
  ],
  webServer: {
    command: `node_modules/.bin/vite apps/game --host ${host} --port ${port} --config vite.config.js`,
    cwd: workspaceRoot,
    reuseExistingServer: !process.env.CI,
    timeout: 30_000,
    url: baseURL
  }
});
