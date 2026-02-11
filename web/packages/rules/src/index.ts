export interface RuleSetVersion {
  id: string;
  description: string;
}

export const DEFAULT_RULESET: RuleSetVersion = {
  id: "phase0-baseline",
  description: "Placeholder ruleset for deterministic replay harness v0"
};
