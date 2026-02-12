import { TickScheduler } from "../src/deterministic";

describe("tick scheduler", () => {
  it("drains due entries in tick order, preserving insertion order per tick", () => {
    const scheduler = new TickScheduler<string>();
    scheduler.enqueue(3, "late-a");
    scheduler.enqueue(1, "early-a");
    scheduler.enqueue(1, "early-b");
    scheduler.enqueue(2, "mid-a");
    scheduler.enqueue(3, "late-b");

    expect(scheduler.drain(1)).toEqual(["early-a", "early-b"]);
    expect(scheduler.drain(2)).toEqual(["mid-a"]);
    expect(scheduler.drain(2)).toEqual([]);
    expect(scheduler.drain(3)).toEqual(["late-a", "late-b"]);
    expect(scheduler.size).toBe(0);
  });

  it("rejects non-positive or non-integer ticks", () => {
    const scheduler = new TickScheduler<string>();
    expect(() => scheduler.enqueue(0, "x")).toThrow(/tick/i);
    expect(() => scheduler.enqueue(1.5, "x")).toThrow(/tick/i);
  });
});
