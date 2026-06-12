import { normalizeKeyboardEvent, normalizeKeyboardReleaseEvent, normalizeMouseEvent, normalizeTouchEvent } from "../src/index";
describe("input normalization contract", () => {
    it("maps supported keyboard controls into deterministic app actions", () => {
        const pause = normalizeKeyboardEvent({ type: "keydown", code: "Space", repeat: false });
        const pauseOriginal = normalizeKeyboardEvent({ type: "keydown", code: "KeyP", repeat: false });
        const step = normalizeKeyboardEvent({ type: "keydown", code: "Period", repeat: false });
        const admit = normalizeKeyboardEvent({ type: "keydown", code: "KeyA", repeat: false });
        const speedSlowest = normalizeKeyboardEvent({ type: "keydown", code: "Digit1", repeat: false });
        const speedSlower = normalizeKeyboardEvent({ type: "keydown", code: "Digit2", repeat: false });
        const speedNormal = normalizeKeyboardEvent({ type: "keydown", code: "Digit3", repeat: false });
        const speedMax = normalizeKeyboardEvent({ type: "keydown", code: "Digit4", repeat: false });
        const speedThenSome = normalizeKeyboardEvent({ type: "keydown", code: "Digit5", repeat: false });
        const zoomIn = normalizeKeyboardEvent({ type: "keydown", code: "Equal", repeat: false });
        const zoomInMore = normalizeKeyboardEvent({ type: "keydown", code: "Equal", repeat: false, shiftKey: true });
        const zoomOut = normalizeKeyboardEvent({ type: "keydown", code: "Minus", repeat: false });
        const zoomOutMore = normalizeKeyboardEvent({ type: "keydown", code: "Minus", repeat: false, shiftKey: true });
        const zoomReset = normalizeKeyboardEvent({ type: "keydown", code: "Digit0", repeat: false });
        const transparentWallsHold = normalizeKeyboardEvent({ type: "keydown", code: "KeyX", repeat: false });
        const transparentWallsToggle = normalizeKeyboardEvent({ type: "keydown", code: "KeyX", repeat: false, shiftKey: true });
        const openMapAlt = normalizeKeyboardEvent({ type: "keydown", code: "KeyT", repeat: false });
        const sendHome = normalizeKeyboardEvent({ type: "keydown", code: "KeyH", repeat: false });
        const jukebox = normalizeKeyboardEvent({ type: "keydown", code: "KeyJ", repeat: false });
        const speedIncrease = normalizeKeyboardEvent({ type: "keydown", code: "KeyZ", repeat: false });
        const buildRoom = normalizeKeyboardEvent({ type: "keydown", code: "KeyF", repeat: false });
        const furnishCorridor = normalizeKeyboardEvent({ type: "keydown", code: "KeyG", repeat: false });
        const editRoom = normalizeKeyboardEvent({ type: "keydown", code: "KeyV", repeat: false });
        const openHireStaff = normalizeKeyboardEvent({ type: "keydown", code: "KeyB", repeat: false });
        const openCasebook = normalizeKeyboardEvent({ type: "keydown", code: "KeyC", repeat: false });
        const openBankManager = normalizeKeyboardEvent({ type: "keydown", code: "F1", repeat: false });
        const openBankStats = normalizeKeyboardEvent({ type: "keydown", code: "F2", repeat: false });
        const openStaff = normalizeKeyboardEvent({ type: "keydown", code: "F3", repeat: false });
        const openMap = normalizeKeyboardEvent({ type: "keydown", code: "F4", repeat: false });
        const openCasebookPanel = normalizeKeyboardEvent({ type: "keydown", code: "F5", repeat: false });
        const confirmAction = normalizeKeyboardEvent({ type: "keydown", code: "Enter", repeat: false });
        const confirmActionAlt = normalizeKeyboardEvent({ type: "keydown", code: "KeyE", repeat: false });
        const cancelAction = normalizeKeyboardEvent({ type: "keydown", code: "Escape", repeat: false });
        const cancelActionAlt = normalizeKeyboardEvent({ type: "keydown", code: "KeyQ", repeat: false });
        const save = normalizeKeyboardEvent({ type: "keydown", code: "KeyS", repeat: false });
        const load = normalizeKeyboardEvent({ type: "keydown", code: "KeyL", repeat: false });
        const openFirstMessage = normalizeKeyboardEvent({ type: "keydown", code: "KeyM", repeat: false });
        const researchAlt = normalizeKeyboardEvent({ type: "keydown", code: "KeyR", repeat: false });
        const saveMenu = normalizeKeyboardEvent({ type: "keydown", code: "KeyS", repeat: false, shiftKey: true });
        const loadMenu = normalizeKeyboardEvent({ type: "keydown", code: "KeyL", repeat: false, shiftKey: true });
        const quickSave = normalizeKeyboardEvent({ type: "keydown", code: "KeyS", repeat: false, altKey: true, shiftKey: true });
        const quickLoad = normalizeKeyboardEvent({ type: "keydown", code: "KeyL", repeat: false, altKey: true, shiftKey: true });
        const restartLevel = normalizeKeyboardEvent({ type: "keydown", code: "KeyR", repeat: false, shiftKey: true });
        const toggleAdvisor = normalizeKeyboardEvent({ type: "keydown", code: "KeyA", repeat: false, shiftKey: true });
        const openCasebookAlt = normalizeKeyboardEvent({ type: "keydown", code: "KeyC", repeat: false, shiftKey: true });
        const nextLevel = normalizeKeyboardEvent({ type: "keydown", code: "KeyN", repeat: false });
        const research = normalizeKeyboardEvent({ type: "keydown", code: "F6", repeat: false });
        const status = normalizeKeyboardEvent({ type: "keydown", code: "F7", repeat: false });
        const charts = normalizeKeyboardEvent({ type: "keydown", code: "F8", repeat: false });
        const policy = normalizeKeyboardEvent({ type: "keydown", code: "F9", repeat: false });
        const machineMenu = normalizeKeyboardEvent({ type: "keydown", code: "F10", repeat: false });
        const muteSounds = normalizeKeyboardEvent({ type: "keydown", code: "KeyS", repeat: false, altKey: true });
        const muteMusic = normalizeKeyboardEvent({ type: "keydown", code: "KeyM", repeat: false, altKey: true });
        const toggleAnnouncements = normalizeKeyboardEvent({ type: "keydown", code: "KeyA", repeat: false, altKey: true });
        const storeCameraSlot1 = normalizeKeyboardEvent({ type: "keydown", code: "Digit1", repeat: false, altKey: true });
        const storeCameraSlot0 = normalizeKeyboardEvent({ type: "keydown", code: "Digit0", repeat: false, altKey: true });
        const recallCameraSlot1 = normalizeKeyboardEvent({ type: "keydown", code: "Digit1", repeat: false, ctrlKey: true });
        const recallCameraSlot0 = normalizeKeyboardEvent({ type: "keydown", code: "Digit0", repeat: false, ctrlKey: true });
        const cameraWest = normalizeKeyboardEvent({ type: "keydown", code: "ArrowLeft", repeat: false });
        const cameraEast = normalizeKeyboardEvent({ type: "keydown", code: "ArrowRight", repeat: false });
        const cameraNorth = normalizeKeyboardEvent({ type: "keydown", code: "ArrowUp", repeat: false });
        const cameraSouth = normalizeKeyboardEvent({ type: "keydown", code: "ArrowDown", repeat: false });
        expect(pause).toEqual({ device: "keyboard", action: "pause-toggle", source: "Space" });
        expect(pauseOriginal).toEqual({ device: "keyboard", action: "pause-toggle", source: "KeyP" });
        expect(step).toEqual({ device: "keyboard", action: "step-tick", source: "Period" });
        expect(admit).toEqual({ device: "keyboard", action: "admit-patient", severity: 2, source: "KeyA" });
        expect(speedSlowest).toEqual({ device: "keyboard", action: "speed-set", speedMultiplier: 0.5, source: "Digit1" });
        expect(speedSlower).toEqual({ device: "keyboard", action: "speed-set", speedMultiplier: 1, source: "Digit2" });
        expect(speedNormal).toEqual({ device: "keyboard", action: "speed-set", speedMultiplier: 2, source: "Digit3" });
        expect(speedMax).toEqual({ device: "keyboard", action: "speed-set", speedMultiplier: 4, source: "Digit4" });
        expect(speedThenSome).toEqual({ device: "keyboard", action: "speed-set", speedMultiplier: 8, source: "Digit5" });
        expect(zoomIn).toEqual({ device: "keyboard", action: "zoom-in", source: "Equal" });
        expect(zoomInMore).toEqual({ device: "keyboard", action: "zoom-in-more", source: "Shift+Equal" });
        expect(zoomOut).toEqual({ device: "keyboard", action: "zoom-out", source: "Minus" });
        expect(zoomOutMore).toEqual({ device: "keyboard", action: "zoom-out-more", source: "Shift+Minus" });
        expect(zoomReset).toEqual({ device: "keyboard", action: "zoom-reset", source: "Digit0" });
        expect(transparentWallsHold).toEqual({ device: "keyboard", action: "transparent-walls-hold", source: "KeyX" });
        expect(transparentWallsToggle).toEqual({ device: "keyboard", action: "transparent-walls-toggle", source: "Shift+KeyX" });
        expect(openMapAlt).toEqual({ device: "keyboard", action: "open-map", source: "KeyT" });
        expect(sendHome).toEqual({ device: "keyboard", action: "send-patient-home", source: "KeyH" });
        expect(jukebox).toEqual({ device: "keyboard", action: "open-jukebox", source: "KeyJ" });
        expect(speedIncrease).toEqual({ device: "keyboard", action: "speed-increase", source: "KeyZ" });
        expect(buildRoom).toEqual({ device: "keyboard", action: "build-room", source: "KeyF" });
        expect(furnishCorridor).toEqual({ device: "keyboard", action: "open-furnish-corridor", source: "KeyG" });
        expect(editRoom).toEqual({ device: "keyboard", action: "open-edit-room", source: "KeyV" });
        expect(openHireStaff).toEqual({ device: "keyboard", action: "open-hire-staff", source: "KeyB" });
        expect(openCasebook).toEqual({ device: "keyboard", action: "open-casebook", source: "KeyC" });
        expect(openBankManager).toEqual({ device: "keyboard", action: "open-bank-manager", source: "F1" });
        expect(openBankStats).toEqual({ device: "keyboard", action: "open-bank-stats", source: "F2" });
        expect(openStaff).toEqual({ device: "keyboard", action: "open-staff", source: "F3" });
        expect(openMap).toEqual({ device: "keyboard", action: "open-map", source: "F4" });
        expect(openCasebookPanel).toEqual({ device: "keyboard", action: "open-casebook", source: "F5" });
        expect(confirmAction).toEqual({ device: "keyboard", action: "confirm-action", source: "Enter" });
        expect(confirmActionAlt).toEqual({ device: "keyboard", action: "confirm-action", source: "KeyE" });
        expect(cancelAction).toEqual({ device: "keyboard", action: "cancel-action", source: "Escape" });
        expect(cancelActionAlt).toEqual({ device: "keyboard", action: "cancel-action", source: "KeyQ" });
        expect(save).toEqual({ device: "keyboard", action: "save-game", source: "KeyS" });
        expect(load).toEqual({ device: "keyboard", action: "load-game", source: "KeyL" });
        expect(openFirstMessage).toEqual({ device: "keyboard", action: "open-first-message", source: "KeyM" });
        expect(researchAlt).toEqual({ device: "keyboard", action: "open-research", source: "KeyR" });
        expect(saveMenu).toEqual({ device: "keyboard", action: "save-game", source: "Shift+KeyS" });
        expect(loadMenu).toEqual({ device: "keyboard", action: "load-game", source: "Shift+KeyL" });
        expect(quickSave).toEqual({ device: "keyboard", action: "save-game", source: "Alt+Shift+KeyS" });
        expect(quickLoad).toEqual({ device: "keyboard", action: "load-game", source: "Alt+Shift+KeyL" });
        expect(restartLevel).toEqual({ device: "keyboard", action: "restart-level", source: "Shift+KeyR" });
        expect(toggleAdvisor).toEqual({ device: "keyboard", action: "advisor-toggle", source: "Shift+KeyA" });
        expect(openCasebookAlt).toEqual({ device: "keyboard", action: "open-casebook", source: "Shift+KeyC" });
        expect(nextLevel).toEqual({ device: "keyboard", action: "next-level", source: "KeyN" });
        expect(research).toEqual({ device: "keyboard", action: "open-research", source: "F6" });
        expect(status).toEqual({ device: "keyboard", action: "open-status", source: "F7" });
        expect(charts).toEqual({ device: "keyboard", action: "open-charts", source: "F8" });
        expect(policy).toEqual({ device: "keyboard", action: "open-policy", source: "F9" });
        expect(machineMenu).toEqual({ device: "keyboard", action: "open-machine-menu", source: "F10" });
        expect(muteSounds).toEqual({ device: "keyboard", action: "audio-mute-toggle", source: "Alt+KeyS" });
        expect(muteMusic).toEqual({ device: "keyboard", action: "audio-mute-toggle", source: "Alt+KeyM" });
        expect(toggleAnnouncements).toEqual({ device: "keyboard", action: "announcements-toggle", source: "Alt+KeyA" });
        expect(storeCameraSlot1).toEqual({ device: "keyboard", action: "camera-store-position", slot: 1, source: "Alt+Digit1" });
        expect(storeCameraSlot0).toEqual({ device: "keyboard", action: "camera-store-position", slot: 0, source: "Alt+Digit0" });
        expect(recallCameraSlot1).toEqual({ device: "keyboard", action: "camera-recall-position", slot: 1, source: "Ctrl+Digit1" });
        expect(recallCameraSlot0).toEqual({ device: "keyboard", action: "camera-recall-position", slot: 0, source: "Ctrl+Digit0" });
        expect(cameraWest).toEqual({ device: "keyboard", action: "camera-west", source: "ArrowLeft" });
        expect(cameraEast).toEqual({ device: "keyboard", action: "camera-east", source: "ArrowRight" });
        expect(cameraNorth).toEqual({ device: "keyboard", action: "camera-north", source: "ArrowUp" });
        expect(cameraSouth).toEqual({ device: "keyboard", action: "camera-south", source: "ArrowDown" });
    });
    it("ignores keyboard repeats, modifiers, and unsupported keys", () => {
        const repeated = { type: "keydown", code: "Space", repeat: true };
        const modified = { type: "keydown", code: "KeyT", ctrlKey: true };
        const quitLevelReserved = { type: "keydown", code: "KeyQ", shiftKey: true };
        const unsupported = { type: "keydown", code: "KeyO" };
        expect(normalizeKeyboardEvent(repeated)).toBeNull();
        expect(normalizeKeyboardEvent(modified)).toBeNull();
        expect(normalizeKeyboardEvent(quitLevelReserved)).toBeNull();
        expect(normalizeKeyboardEvent(unsupported)).toBeNull();
    });
    it("maps keyboard releases used by original hold-style controls", () => {
        expect(normalizeKeyboardReleaseEvent({ type: "keyup", code: "KeyX" })).toEqual({ device: "keyboard", action: "transparent-walls-release", source: "KeyX" });
        expect(normalizeKeyboardReleaseEvent({ type: "keyup", code: "KeyX", ctrlKey: true })).toBeNull();
        expect(normalizeKeyboardReleaseEvent({ type: "keydown", code: "KeyX" })).toBeNull();
        expect(normalizeKeyboardReleaseEvent({ type: "keyup", code: "KeyO" })).toBeNull();
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
