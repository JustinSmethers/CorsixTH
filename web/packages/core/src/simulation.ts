import { assertGameCommand, type GameCommand } from "./command-contract";
import { DeterministicRng, SimulationClock } from "./deterministic";

export interface SimulationState {
  tick: number;
  patientsWaiting: number;
  treatedPatients: number;
  cash: number;
  reputation: number;
  rngState: number;
}

const INITIAL_CASH = 50_000;

function hashString(value: string): string {
  let hash = 2166136261;
  for (let i = 0; i < value.length; i += 1) {
    hash ^= value.charCodeAt(i);
    hash = Math.imul(hash, 16777619) >>> 0;
  }
  return hash.toString(16).padStart(8, "0");
}

export function hashSimulationState(state: SimulationState): string {
  const stable = [
    state.tick,
    state.patientsWaiting,
    state.treatedPatients,
    state.cash,
    state.reputation,
    state.rngState
  ].join("|");
  return hashString(stable);
}

export class DeterministicSimulation {
  private readonly rng: DeterministicRng;
  private readonly clock = new SimulationClock();
  private state: SimulationState;

  constructor(seed: number) {
    this.rng = new DeterministicRng(seed);
    this.state = {
      tick: 0,
      patientsWaiting: 0,
      treatedPatients: 0,
      cash: INITIAL_CASH,
      reputation: 500,
      rngState: this.rng.snapshot()
    };
  }

  execute(input: unknown): SimulationState {
    assertGameCommand(input);
    const command = input as GameCommand;

    if (command.type === "tick") {
      for (let i = 0; i < command.count; i += 1) {
        this.runTick();
      }
      return this.getState();
    }

    if (command.type === "admit-patient") {
      this.state.patientsWaiting += command.severity;
      return this.getState();
    }

    if (this.state.patientsWaiting > 0) {
      this.state.patientsWaiting -= 1;
      this.state.treatedPatients += 1;
      this.state.cash += 100;
      this.state.reputation += 2;
    }

    return this.getState();
  }

  getState(): SimulationState {
    return {
      ...this.state,
      rngState: this.rng.snapshot()
    };
  }

  currentHash(): string {
    return hashSimulationState(this.getState());
  }

  private runTick(): void {
    this.state.tick = this.clock.tick();
    const noise = this.rng.next();
    const reputationDelta = noise >= 0.5 ? 1 : -1;
    this.state.reputation += reputationDelta;
    this.state.cash -= this.state.patientsWaiting * 5;
    this.state.rngState = this.rng.snapshot();
  }
}
