import type { GameCommand } from "@corsixth/core";

export function phase0CommandSequence(): GameCommand[] {
  return [
    { type: "admit-patient", severity: 2 },
    { type: "tick", count: 3 },
    { type: "treat-patient" },
    { type: "tick", count: 2 }
  ];
}
