export class DeterministicRng {
    state;
    constructor(seed) {
        this.state = seed >>> 0;
    }
    nextUint32() {
        this.state = (Math.imul(1664525, this.state) + 1013904223) >>> 0;
        return this.state;
    }
    nextFloat() {
        return this.nextUint32() / 0x1_0000_0000;
    }
    nextInt(minInclusive, maxExclusive) {
        if (!Number.isInteger(minInclusive) || !Number.isInteger(maxExclusive) || minInclusive >= maxExclusive) {
            throw new Error(`Invalid integer range [${minInclusive}, ${maxExclusive})`);
        }
        const span = maxExclusive - minInclusive;
        return minInclusive + Math.floor(this.nextFloat() * span);
    }
    next() {
        return this.nextFloat();
    }
    snapshot() {
        return this.state >>> 0;
    }
    restore(snapshot) {
        if (!Number.isInteger(snapshot)) {
            throw new Error(`Invalid RNG snapshot: ${snapshot}`);
        }
        this.state = snapshot >>> 0;
    }
}
export class SimulationClock {
    tickCount = 0;
    tick(times = 1) {
        if (!Number.isInteger(times) || times <= 0) {
            throw new Error(`Invalid tick count: ${times}`);
        }
        this.tickCount += times;
        return this.tickCount;
    }
    now() {
        return this.tickCount;
    }
    set(tick) {
        if (!Number.isInteger(tick) || tick < 0) {
            throw new Error(`Invalid absolute tick: ${tick}`);
        }
        this.tickCount = tick;
        return this.tickCount;
    }
}
export class TickScheduler {
    entries = [];
    nextOrder = 0;
    enqueue(tick, value) {
        if (!Number.isInteger(tick) || tick <= 0) {
            throw new Error(`Invalid scheduled tick: ${tick}`);
        }
        const order = this.nextOrder;
        this.nextOrder += 1;
        this.entries.push({ tick, order, value });
        return order;
    }
    drain(tick) {
        if (!Number.isInteger(tick) || tick <= 0) {
            throw new Error(`Invalid drain tick: ${tick}`);
        }
        const due = [];
        const future = [];
        for (const entry of this.entries) {
            if (entry.tick <= tick) {
                due.push(entry);
            }
            else {
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
    peekNextTick() {
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
    get size() {
        return this.entries.length;
    }
}
