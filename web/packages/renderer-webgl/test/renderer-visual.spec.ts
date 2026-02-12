import fixture from "../fixtures/phase3-visual-snapshots.json";
import { runVisualSnapshotFixture, type VisualSnapshotFixture } from "../src/index";

function parseFixture(): VisualSnapshotFixture {
  const parsed = fixture as unknown as VisualSnapshotFixture;
  expect(parsed.schemaVersion).toBe("renderer-snapshot.v0");
  return parsed;
}

describe("renderer visual snapshots", () => {
  it("matches locked fixed scenes and camera states under configured pixel thresholds", () => {
    const parsed = parseFixture();
    const result = runVisualSnapshotFixture(parsed);

    expect(result.passed).toBe(true);
    expect(result.scenarioResults.every((scenario) => scenario.passed)).toBe(true);
    expect(result.scenarioResults.map((scenario) => scenario.changedPixels)).toEqual([0, 0, 0]);
  });

  it("fails when baseline drift exceeds max pixel-diff threshold", () => {
    const parsed = parseFixture();
    const broken = {
      ...parsed,
      scenarios: parsed.scenarios.map((scenario, index) =>
        index !== 0
          ? scenario
          : {
              ...scenario,
              baselineRows: scenario.baselineRows.map((row, rowIndex) =>
                rowIndex === 0 ? `w${row.slice(1)}` : row
              )
            }
      )
    };

    const result = runVisualSnapshotFixture(broken);
    expect(result.passed).toBe(false);
    expect(result.scenarioResults.some((scenario) => !scenario.passed)).toBe(true);
  });
});
