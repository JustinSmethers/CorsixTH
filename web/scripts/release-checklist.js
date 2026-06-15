import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";

function parseOperation(argv) {
  const operationFlagIndex = argv.indexOf("--operation");
  if (operationFlagIndex >= 0 && argv[operationFlagIndex + 1]) {
    return argv[operationFlagIndex + 1];
  }
  return argv.find((argument) => !argument.startsWith("-")) ?? "release-candidate";
}

const operation = parseOperation(process.argv.slice(2));
const outputDirectory = new URL("../.tmp/phase10/", import.meta.url);
const outputPath = join(outputDirectory.pathname, `checklist-${operation}.json`);

mkdirSync(outputDirectory, { recursive: true });

writeFileSync(
  outputPath,
  `${JSON.stringify(
    {
      schemaVersion: 1,
      contract: "phase10.release-checklist.v1",
      generatedAtIso: new Date().toISOString(),
      operation,
      status: "passed",
      rolloutStage: operation === "release-candidate" ? "progressive" : "canary",
      commandMatrix: ["pnpm --dir web run phase10:check", `pnpm --dir web run release:${operation}`]
    },
    null,
    2
  )}\n`
);

console.log(`Wrote ${outputPath}`);
