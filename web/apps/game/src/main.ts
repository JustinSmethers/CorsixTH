import { runBootstrapScript } from "@corsixth/app";
import { phase0CommandSequence } from "@corsixth/testkit";

const appElement = document.querySelector<HTMLDivElement>("#app");

if (!appElement) {
  throw new Error("Missing #app element");
}

const seed = 1234;
const result = runBootstrapScript(seed, phase0CommandSequence());

appElement.innerHTML = `
  <section>
    <h1>Phase 0 Smoke Scene</h1>
    <p data-testid="seed">Seed: ${seed}</p>
    <p data-testid="tick">Tick: ${result.tick}</p>
    <p data-testid="treated">Treated: ${result.treatedPatients}</p>
    <p data-testid="hash">State hash: ${result.hash}</p>
  </section>
`;
