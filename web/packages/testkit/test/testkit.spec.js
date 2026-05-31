import { phase0CommandSequence, phase4SmokeScenarioCommands } from "../src/index";
describe("testkit scaffold", () => {
    it("exports a deterministic command script", () => {
        expect(phase0CommandSequence()).toHaveLength(4);
    });
    it("exports the phase 4 smoke scenario bootstrap script", () => {
        expect(phase4SmokeScenarioCommands()).toEqual([{ type: "tick", count: 1 }]);
    });
});
