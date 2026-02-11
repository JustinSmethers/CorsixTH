import { DeterministicSimulation, type GameCommand } from "@corsixth/core";

export interface BootstrapResult {
  hash: string;
  tick: number;
  treatedPatients: number;
}

export function runBootstrapScript(seed: number, commands: GameCommand[]): BootstrapResult {
  const simulation = new DeterministicSimulation(seed);

  for (const command of commands) {
    simulation.execute(command);
  }

  const state = simulation.getState();
  return {
    hash: simulation.currentHash(),
    tick: state.tick,
    treatedPatients: state.treatedPatients
  };
}
