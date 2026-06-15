import { spawn } from "node:child_process";
import { createServer } from "node:net";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const scriptDirectory = dirname(fileURLToPath(import.meta.url));
const workspaceRoot = dirname(scriptDirectory);
const host = "127.0.0.1";
const defaultPort = 4173;

async function main() {
  const options = parseRunnerOptions(process.argv.slice(2));
  const port = process.env.CORSIXTH_WEB_PORT ?? String(await selectWebPort(defaultPort));
  if (options.server === "preview") {
    await run(binaryPath("vite"), ["build", "apps/game", "--config", "vite.config.js"]);
  }
  await run(process.execPath, [join("scripts", "create-e2e-fixtures.js")]);
  await run(binaryPath("playwright"), [
    "test",
    "--config",
    join("apps", "game", "playwright.config.js"),
    ...options.playwrightArgs
  ], {
    ...process.env,
    CI: process.env.CI ?? "1",
    CORSIXTH_E2E_SERVER: options.server,
    CORSIXTH_WEB_PORT: port
  });
}

function parseRunnerOptions(args) {
  const playwrightArgs = [];
  let server = "dev";
  for (const arg of args) {
    if (arg === "--server=preview") {
      server = "preview";
      continue;
    }
    if (arg === "--server=dev") {
      server = "dev";
      continue;
    }
    playwrightArgs.push(arg);
  }
  return { server, playwrightArgs };
}

function binaryPath(name) {
  return process.platform === "win32"
    ? join("node_modules", ".bin", `${name}.cmd`)
    : join("node_modules", ".bin", name);
}

async function selectWebPort(preferredPort) {
  if (await canListenOnPort(preferredPort)) {
    return preferredPort;
  }
  return findFreePort();
}

function canListenOnPort(port) {
  return new Promise((resolve) => {
    const server = createServer();
    server.once("error", () => {
      resolve(false);
    });
    server.listen(port, host, () => {
      server.close(() => {
        resolve(true);
      });
    });
  });
}

function findFreePort() {
  return new Promise((resolve, reject) => {
    const server = createServer();
    server.once("error", reject);
    server.listen(0, host, () => {
      const address = server.address();
      server.close(() => {
        if (address && typeof address === "object") {
          resolve(address.port);
        }
        else {
          reject(new Error("Unable to allocate a free localhost port"));
        }
      });
    });
  });
}

function run(command, args, env = process.env) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      cwd: workspaceRoot,
      env,
      stdio: "inherit"
    });
    child.once("error", reject);
    child.once("exit", (code, signal) => {
      if (code === 0) {
        resolve();
        return;
      }
      reject(new Error(`${command} ${args.join(" ")} failed with ${signal ?? `exit code ${code}`}`));
    });
  });
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
