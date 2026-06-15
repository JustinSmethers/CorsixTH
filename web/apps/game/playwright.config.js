import { defineConfig, devices } from "@playwright/test";

const port = Number(process.env.CORSIXTH_WEB_PORT ?? 4173);
const host = "127.0.0.1";
const baseURL = `http://${host}:${port}`;
const workspaceRoot = new URL("../..", import.meta.url).pathname;
const serverMode = process.env.CORSIXTH_E2E_SERVER === "preview" ? "preview" : "dev";
const webServerCommand = serverMode === "preview"
  ? `node_modules/.bin/vite preview apps/game --host ${host} --port ${port} --config vite.config.js`
  : `node_modules/.bin/vite apps/game --host ${host} --port ${port} --config vite.config.js`;

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
    command: webServerCommand,
    cwd: workspaceRoot,
    reuseExistingServer: !process.env.CI,
    timeout: 30_000,
    url: baseURL
  }
});
