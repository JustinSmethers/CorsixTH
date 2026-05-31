import { spawn } from "node:child_process";
import { createServer } from "node:net";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const scriptDirectory = dirname(fileURLToPath(import.meta.url));
const workspaceRoot = dirname(scriptDirectory);
const host = "127.0.0.1";

async function main() {
  const port = process.env.CORSIXTH_WEB_PORT ?? String(await findFreePort());
  await run(process.execPath, [join("scripts", "create-e2e-fixtures.js")]);
  const playwrightExecutable = process.platform === "win32"
    ? join("node_modules", ".bin", "playwright.cmd")
    : join("node_modules", ".bin", "playwright");
  await run(playwrightExecutable, [
    "test",
    "--config",
    join("apps", "game", "playwright.config.js"),
    ...process.argv.slice(2)
  ], {
    ...process.env,
    CI: process.env.CI ?? "1",
    CORSIXTH_WEB_PORT: port
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
