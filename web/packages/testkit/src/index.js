export function phase0CommandSequence() {
    return [
        { type: "admit-patient", severity: 2 },
        { type: "tick", count: 3 },
        { type: "treat-patient" },
        { type: "tick", count: 2 }
    ];
}
export function phase4SmokeScenarioCommands() {
    return [{ type: "tick", count: 1 }];
}
