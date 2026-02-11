export class DeterministicRng {
  private state: number;

  constructor(seed: number) {
    this.state = seed >>> 0;
  }

  next(): number {
    this.state = (Math.imul(1664525, this.state) + 1013904223) >>> 0;
    return this.state / 0x1_0000_0000;
  }

  snapshot(): number {
    return this.state >>> 0;
  }
}

export class SimulationClock {
  private tickCount = 0;

  tick(times = 1): number {
    if (!Number.isInteger(times) || times <= 0) {
      throw new Error(`Invalid tick count: ${times}`);
    }
    this.tickCount += times;
    return this.tickCount;
  }

  now(): number {
    return this.tickCount;
  }
}
