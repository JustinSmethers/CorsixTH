import { normalizeKeyboardEvent, normalizeMouseEvent, normalizeTouchEvent } from "../src/index";
describe("input normalization contract", () => {
    it("maps supported keyboard controls into deterministic app actions", () => {
        const pause = normalizeKeyboardEvent({ type: "keydown", code: "Space", repeat: false });
        const pauseOriginal = normalizeKeyboardEvent({ type: "keydown", code: "KeyP", repeat: false });
        const step = normalizeKeyboardEvent({ type: "keydown", code: "Period", repeat: false });
        const admit = normalizeKeyboardEvent({ type: "keydown", code: "KeyA", repeat: false });
        const admitSeverity1 = normalizeKeyboardEvent({ type: "keydown", code: "Digit1", repeat: false });
        const admitSeverity2 = normalizeKeyboardEvent({ type: "keydown", code: "Digit2", repeat: false });
        const admitSeverity3 = normalizeKeyboardEvent({ type: "keydown", code: "Digit3", repeat: false });
        const treat = normalizeKeyboardEvent({ type: "keydown", code: "KeyT", repeat: false });
        const sendHome = normalizeKeyboardEvent({ type: "keydown", code: "KeyH", repeat: false });
        const speedIncrease = normalizeKeyboardEvent({ type: "keydown", code: "KeyZ", repeat: false });
        const save = normalizeKeyboardEvent({ type: "keydown", code: "KeyS", repeat: false });
        const load = normalizeKeyboardEvent({ type: "keydown", code: "KeyL", repeat: false });
        const restart = normalizeKeyboardEvent({ type: "keydown", code: "KeyR", repeat: false });
        const nextLevel = normalizeKeyboardEvent({ type: "keydown", code: "KeyN", repeat: false });
        const research = normalizeKeyboardEvent({ type: "keydown", code: "F6", repeat: false });
        const cameraWest = normalizeKeyboardEvent({ type: "keydown", code: "ArrowLeft", repeat: false });
        const cameraEast = normalizeKeyboardEvent({ type: "keydown", code: "ArrowRight", repeat: false });
        const cameraNorth = normalizeKeyboardEvent({ type: "keydown", code: "ArrowUp", repeat: false });
        const cameraSouth = normalizeKeyboardEvent({ type: "keydown", code: "ArrowDown", repeat: false });
        expect(pause).toEqual({ device: "keyboard", action: "pause-toggle", source: "Space" });
        expect(pauseOriginal).toEqual({ device: "keyboard", action: "pause-toggle", source: "KeyP" });
        expect(step).toEqual({ device: "keyboard", action: "step-tick", source: "Period" });
        expect(admit).toEqual({ device: "keyboard", action: "admit-patient", severity: 2, source: "KeyA" });
        expect(admitSeverity1).toEqual({ device: "keyboard", action: "admit-patient", severity: 1, source: "Digit1" });
        expect(admitSeverity2).toEqual({ device: "keyboard", action: "admit-patient", severity: 2, source: "Digit2" });
        expect(admitSeverity3).toEqual({ device: "keyboard", action: "admit-patient", severity: 3, source: "Digit3" });
        expect(treat).toEqual({ device: "keyboard", action: "treat-patient", source: "KeyT" });
        expect(sendHome).toEqual({ device: "keyboard", action: "send-patient-home", source: "KeyH" });
        expect(speedIncrease).toEqual({ device: "keyboard", action: "speed-increase", source: "KeyZ" });
        expect(save).toEqual({ device: "keyboard", action: "save-game", source: "KeyS" });
        expect(load).toEqual({ device: "keyboard", action: "load-game", source: "KeyL" });
        expect(restart).toEqual({ device: "keyboard", action: "restart-level", source: "KeyR" });
        expect(nextLevel).toEqual({ device: "keyboard", action: "next-level", source: "KeyN" });
        expect(research).toEqual({ device: "keyboard", action: "start-research", source: "F6" });
        expect(cameraWest).toEqual({ device: "keyboard", action: "camera-west", source: "ArrowLeft" });
        expect(cameraEast).toEqual({ device: "keyboard", action: "camera-east", source: "ArrowRight" });
        expect(cameraNorth).toEqual({ device: "keyboard", action: "camera-north", source: "ArrowUp" });
        expect(cameraSouth).toEqual({ device: "keyboard", action: "camera-south", source: "ArrowDown" });
    });
    it("ignores keyboard repeats, modifiers, and unsupported keys", () => {
        const repeated = { type: "keydown", code: "Space", repeat: true };
        const modified = { type: "keydown", code: "KeyT", ctrlKey: true };
        const unsupported = { type: "keydown", code: "KeyQ" };
        expect(normalizeKeyboardEvent(repeated)).toBeNull();
        expect(normalizeKeyboardEvent(modified)).toBeNull();
        expect(normalizeKeyboardEvent(unsupported)).toBeNull();
    });
    it("maps mouse primary/secondary buttons with normalized coordinates", () => {
        const primary = { type: "mousedown", button: 0, clientX: 19.7, clientY: 32.2 };
        const secondary = { type: "mousedown", button: 2, clientX: 7.1, clientY: 8.9 };
        expect(normalizeMouseEvent(primary)).toEqual({
            device: "mouse",
            action: "treat-patient",
            source: "mouse:0",
            pointer: { x: 20, y: 32 }
        });
        expect(normalizeMouseEvent(secondary)).toEqual({
            device: "mouse",
            action: "admit-patient",
            severity: 1,
            source: "mouse:2",
            pointer: { x: 7, y: 9 }
        });
    });
    it("maps touchstart events to deterministic touch actions", () => {
        const touch = {
            type: "touchstart",
            touches: [{ clientX: 17.5, clientY: 5.2 }]
        };
        expect(normalizeTouchEvent(touch)).toEqual({
            device: "touch",
            action: "treat-patient",
            source: "touch:0",
            pointer: { x: 18, y: 5 }
        });
    });
});
