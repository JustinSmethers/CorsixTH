import { runBootstrapScript } from "../src/index";
describe("app bootstrap script", () => {
    it("reports deterministic status summary", () => {
        const result = runBootstrapScript(1234, [
            { type: "admit-patient", severity: 2 },
            { type: "tick", count: 3 },
            { type: "treat-patient" },
            { type: "tick", count: 2 }
        ]);
        expect(result).toEqual({
            hash: "2cb298a6",
            tick: 5,
            treatedPatients: 1
        });
    });
});
