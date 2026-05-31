import { DeterministicRng } from "../src/deterministic";
describe("deterministic rng", () => {
    it("produces identical float sequence for the same seed", () => {
        const left = new DeterministicRng(0xdead_beef);
        const right = new DeterministicRng(0xdead_beef);
        const leftValues = Array.from({ length: 16 }, () => left.nextFloat());
        const rightValues = Array.from({ length: 16 }, () => right.nextFloat());
        expect(leftValues).toEqual(rightValues);
    });
    it("restores exact sequence when rewound to a snapshot", () => {
        const rng = new DeterministicRng(123_456_789);
        rng.nextUint32();
        const snapshot = rng.snapshot();
        const expected = Array.from({ length: 8 }, () => rng.nextUint32());
        rng.restore(snapshot);
        const replayed = Array.from({ length: 8 }, () => rng.nextUint32());
        expect(replayed).toEqual(expected);
    });
    it("generates bounded integer ranges", () => {
        const rng = new DeterministicRng(42);
        for (let i = 0; i < 500; i += 1) {
            const value = rng.nextInt(5, 11);
            expect(value).toBeGreaterThanOrEqual(5);
            expect(value).toBeLessThan(11);
        }
    });
});
