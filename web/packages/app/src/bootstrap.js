import { DeterministicSimulation } from "@corsixth/core";
export function runBootstrapScript(seed, commands) {
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
