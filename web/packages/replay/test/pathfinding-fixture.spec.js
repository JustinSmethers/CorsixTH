import fixture from "../fixtures/phase2-pathfinding-golden.json";
import { parsePathfindingFixtureV0, runPathfindingFixture } from "../src/pathfinding-fixture";
describe("pathfinding fixture harness v0", () => {
    it("parses the locked Phase 2 fixture schema", () => {
        const parsed = parsePathfindingFixtureV0(fixture);
        expect(parsed.id).toBe("phase2-pathfinding-golden");
        expect(parsed.scenarios.length).toBeGreaterThan(0);
    });
    it("validates all deterministic golden routes", () => {
        const result = runPathfindingFixture(fixture);
        expect(result.passed).toBe(true);
        const failed = result.scenarioResults.filter((scenario) => !scenario.passed);
        expect(failed).toEqual([]);
    });
    it("detects parity drift in scenario expectations", () => {
        const broken = {
            ...fixture,
            scenarios: fixture.scenarios.map((scenario, index) => index === 0
                ? {
                    ...scenario,
                    expectedPath: [...scenario.expectedPath.slice(0, Math.max(0, scenario.expectedPath.length - 1))]
                }
                : scenario)
        };
        const result = runPathfindingFixture(broken);
        expect(result.passed).toBe(false);
        expect(result.scenarioResults.some((scenario) => !scenario.passed)).toBe(true);
    });
});
