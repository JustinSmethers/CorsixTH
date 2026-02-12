export class DeterministicRng {
  private state: number;

  constructor(seed: number) {
    this.state = seed >>> 0;
  }

  nextUint32(): number {
    this.state = (Math.imul(1664525, this.state) + 1013904223) >>> 0;
    return this.state;
  }

  nextFloat(): number {
    return this.nextUint32() / 0x1_0000_0000;
  }

  nextInt(minInclusive: number, maxExclusive: number): number {
    if (!Number.isInteger(minInclusive) || !Number.isInteger(maxExclusive) || minInclusive >= maxExclusive) {
      throw new Error(`Invalid integer range [${minInclusive}, ${maxExclusive})`);
    }
    const span = maxExclusive - minInclusive;
    return minInclusive + Math.floor(this.nextFloat() * span);
  }

  next(): number {
    return this.nextFloat();
  }

  snapshot(): number {
    return this.state >>> 0;
  }

  restore(snapshot: number): void {
    if (!Number.isInteger(snapshot)) {
      throw new Error(`Invalid RNG snapshot: ${snapshot}`);
    }
    this.state = snapshot >>> 0;
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

  set(tick: number): number {
    if (!Number.isInteger(tick) || tick < 0) {
      throw new Error(`Invalid absolute tick: ${tick}`);
    }
    this.tickCount = tick;
    return this.tickCount;
  }
}

interface ScheduledEntry<T> {
  tick: number;
  order: number;
  value: T;
}

export class TickScheduler<T> {
  private readonly entries: ScheduledEntry<T>[] = [];
  private nextOrder = 0;

  enqueue(tick: number, value: T): number {
    if (!Number.isInteger(tick) || tick <= 0) {
      throw new Error(`Invalid scheduled tick: ${tick}`);
    }
    const order = this.nextOrder;
    this.nextOrder += 1;
    this.entries.push({ tick, order, value });
    return order;
  }

  drain(tick: number): T[] {
    if (!Number.isInteger(tick) || tick <= 0) {
      throw new Error(`Invalid drain tick: ${tick}`);
    }

    const due: ScheduledEntry<T>[] = [];
    const future: ScheduledEntry<T>[] = [];

    for (const entry of this.entries) {
      if (entry.tick <= tick) {
        due.push(entry);
      } else {
        future.push(entry);
      }
    }

    due.sort((left, right) => {
      if (left.tick !== right.tick) {
        return left.tick - right.tick;
      }
      return left.order - right.order;
    });

    this.entries.length = 0;
    this.entries.push(...future);

    return due.map((entry) => entry.value);
  }

  peekNextTick(): number | null {
    if (this.entries.length === 0) {
      return null;
    }

    let minTick = Number.POSITIVE_INFINITY;
    for (const entry of this.entries) {
      if (entry.tick < minTick) {
        minTick = entry.tick;
      }
    }
    return Number.isFinite(minTick) ? minTick : null;
  }

  get size(): number {
    return this.entries.length;
  }
}
