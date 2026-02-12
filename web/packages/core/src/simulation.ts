import { assertGameCommand, type GameCommand, type GridPosition } from "./command-contract";
import { DeterministicRng, SimulationClock, TickScheduler } from "./deterministic";

export interface WorldBounds {
  width: number;
  height: number;
}

export interface PatientEntity {
  id: number;
  severity: 1 | 2 | 3;
  position: GridPosition;
  admittedTick: number;
}

export interface SimulationCounters {
  totalAdmissions: number;
  totalTreatments: number;
  nextEntityId: number;
}

export interface SimulationEntities {
  waitingPatients: PatientEntity[];
}

export interface SimulationState {
  tick: number;
  patientsWaiting: number;
  treatedPatients: number;
  cash: number;
  reputation: number;
  rngState: number;
  bounds: WorldBounds;
  entities: SimulationEntities;
  counters: SimulationCounters;
  scheduledAdmissions: number;
}

export interface DeterministicSimulationOptions {
  bounds?: WorldBounds;
  initialCash?: number;
  initialReputation?: number;
}

interface ScheduledAdmission {
  severity: 1 | 2 | 3;
  position?: GridPosition;
}

const INITIAL_CASH = 50_000;
const INITIAL_REPUTATION = 500;
const DEFAULT_BOUNDS: WorldBounds = { width: 64, height: 64 };
const CASH_MIN = -1_000_000;
const CASH_MAX = 10_000_000;
const REPUTATION_MIN = 0;
const REPUTATION_MAX = 1000;

function clamp(value: number, min: number, max: number): number {
  if (value < min) {
    return min;
  }
  if (value > max) {
    return max;
  }
  return value;
}

function assertBounds(bounds: WorldBounds): void {
  if (!Number.isInteger(bounds.width) || bounds.width <= 0 || !Number.isInteger(bounds.height) || bounds.height <= 0) {
    throw new Error(`Invalid world bounds: ${JSON.stringify(bounds)}`);
  }
}

function fnv1a32(value: string): string {
  let hash = 2166136261;
  for (let i = 0; i < value.length; i += 1) {
    hash ^= value.charCodeAt(i);
    hash = Math.imul(hash, 16777619) >>> 0;
  }
  return hash.toString(16).padStart(8, "0");
}

function stableStringify(value: unknown): string {
  if (value === null || typeof value !== "object") {
    return JSON.stringify(value);
  }

  if (Array.isArray(value)) {
    return `[${value.map((entry) => stableStringify(entry)).join(",")}]`;
  }

  const record = value as Record<string, unknown>;
  const keys = Object.keys(record).sort();
  return `{${keys.map((key) => `${JSON.stringify(key)}:${stableStringify(record[key])}`).join(",")}}`;
}

function isPositionInBounds(position: GridPosition, bounds: WorldBounds): boolean {
  return (
    Number.isInteger(position.x) &&
    Number.isInteger(position.y) &&
    position.x >= 0 &&
    position.y >= 0 &&
    position.x < bounds.width &&
    position.y < bounds.height
  );
}

export function hashSimulationState(state: SimulationState): string {
  const normalized = {
    tick: state.tick,
    patientsWaiting: state.patientsWaiting,
    treatedPatients: state.treatedPatients,
    cash: state.cash,
    reputation: state.reputation,
    rngState: state.rngState,
    bounds: state.bounds,
    counters: state.counters,
    scheduledAdmissions: state.scheduledAdmissions,
    entities: {
      waitingPatients: [...state.entities.waitingPatients]
        .sort((left, right) => left.id - right.id)
        .map((patient) => ({
          id: patient.id,
          severity: patient.severity,
          admittedTick: patient.admittedTick,
          position: patient.position
        }))
    }
  };
  return fnv1a32(stableStringify(normalized));
}

export class DeterministicSimulation {
  private readonly rng: DeterministicRng;
  private readonly clock = new SimulationClock();
  private readonly scheduler = new TickScheduler<ScheduledAdmission>();
  private readonly waitingPatients: PatientEntity[] = [];
  private readonly bounds: WorldBounds;

  private totalAdmissions = 0;
  private totalTreatments = 0;
  private nextEntityId = 1;
  private cash: number;
  private reputation: number;

  constructor(seed: number, options: DeterministicSimulationOptions = {}) {
    this.rng = new DeterministicRng(seed);
    this.bounds = options.bounds ?? DEFAULT_BOUNDS;
    this.cash = options.initialCash ?? INITIAL_CASH;
    this.reputation = options.initialReputation ?? INITIAL_REPUTATION;

    assertBounds(this.bounds);
    this.cash = clamp(this.cash, CASH_MIN, CASH_MAX);
    this.reputation = clamp(this.reputation, REPUTATION_MIN, REPUTATION_MAX);
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
      this.admitPatient(command.severity, command.position);
      return this.getState();
    }

    if (command.type === "schedule-admit-patient") {
      const scheduledTick = this.clock.now() + command.delay;
      const admission: ScheduledAdmission = { severity: command.severity };
      if (command.position) {
        admission.position = command.position;
      }
      this.scheduler.enqueue(scheduledTick, admission);
      return this.getState();
    }

    this.treatPatient();
    return this.getState();
  }

  getState(): SimulationState {
    const waitingPatients = this.waitingPatients.map((patient) => ({
      id: patient.id,
      severity: patient.severity,
      admittedTick: patient.admittedTick,
      position: { x: patient.position.x, y: patient.position.y }
    }));

    return {
      tick: this.clock.now(),
      patientsWaiting: waitingPatients.length,
      treatedPatients: this.totalTreatments,
      cash: this.cash,
      reputation: this.reputation,
      rngState: this.rng.snapshot(),
      bounds: { width: this.bounds.width, height: this.bounds.height },
      entities: { waitingPatients },
      counters: {
        totalAdmissions: this.totalAdmissions,
        totalTreatments: this.totalTreatments,
        nextEntityId: this.nextEntityId
      },
      scheduledAdmissions: this.scheduler.size
    };
  }

  currentHash(): string {
    return hashSimulationState(this.getState());
  }

  private runTick(): void {
    const tick = this.clock.tick();
    const dueAdmissions = this.scheduler.drain(tick);
    for (const admission of dueAdmissions) {
      this.admitPatient(admission.severity, admission.position);
    }

    const reputationDelta = this.rng.nextFloat() >= 0.5 ? 1 : -1;
    this.reputation = clamp(this.reputation + reputationDelta, REPUTATION_MIN, REPUTATION_MAX);
    this.cash = clamp(this.cash - this.waitingPatients.length * 3, CASH_MIN, CASH_MAX);
  }

  private admitPatient(severity: 1 | 2 | 3, position?: GridPosition): void {
    const resolvedPosition = position ?? {
      x: this.rng.nextInt(0, this.bounds.width),
      y: this.rng.nextInt(0, this.bounds.height)
    };

    if (!isPositionInBounds(resolvedPosition, this.bounds)) {
      throw new Error(`Invalid patient position: ${JSON.stringify(resolvedPosition)}`);
    }

    this.waitingPatients.push({
      id: this.nextEntityId,
      severity,
      position: { x: resolvedPosition.x, y: resolvedPosition.y },
      admittedTick: this.clock.now()
    });
    this.nextEntityId += 1;
    this.totalAdmissions += 1;
  }

  private treatPatient(): void {
    const patient = this.waitingPatients.shift();
    if (!patient) {
      return;
    }

    this.totalTreatments += 1;
    this.cash = clamp(this.cash + 80 + patient.severity * 40, CASH_MIN, CASH_MAX);
    this.reputation = clamp(this.reputation + patient.severity * 2, REPUTATION_MIN, REPUTATION_MAX);
  }
}
