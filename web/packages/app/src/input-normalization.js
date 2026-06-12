function isFiniteNumber(value) {
    return typeof value === "number" && Number.isFinite(value);
}
function roundPointerCoordinates(x, y) {
    return {
        x: Math.round(x),
        y: Math.round(y)
    };
}
export function normalizeKeyboardEvent(event) {
    if (event.type !== "keydown") {
        return null;
    }
    if (event.repeat) {
        return null;
    }
    if (!event.ctrlKey && !event.metaKey && !event.shiftKey && event.altKey && event.code === "KeyS") {
        return {
            device: "keyboard",
            action: "audio-mute-toggle",
            source: "Alt+KeyS"
        };
    }
    if (!event.ctrlKey && !event.metaKey && !event.shiftKey && event.altKey && event.code === "KeyM") {
        return {
            device: "keyboard",
            action: "audio-mute-toggle",
            source: "Alt+KeyM"
        };
    }
    if (event.altKey || event.ctrlKey || event.metaKey) {
        return null;
    }
    if (event.shiftKey && event.code === "KeyS") {
        return {
            device: "keyboard",
            action: "save-game",
            source: "Shift+KeyS"
        };
    }
    if (event.shiftKey && event.code === "KeyL") {
        return {
            device: "keyboard",
            action: "load-game",
            source: "Shift+KeyL"
        };
    }
    if (event.shiftKey && event.code === "KeyR") {
        return {
            device: "keyboard",
            action: "restart-level",
            source: "Shift+KeyR"
        };
    }
    if (event.shiftKey && event.code === "KeyC") {
        return {
            device: "keyboard",
            action: "open-casebook",
            source: "Shift+KeyC"
        };
    }
    if (event.shiftKey && event.code === "KeyQ") {
        return null;
    }
    if (event.code === "Space") {
        return {
            device: "keyboard",
            action: "pause-toggle",
            source: "Space"
        };
    }
    if (event.code === "KeyP") {
        return {
            device: "keyboard",
            action: "pause-toggle",
            source: "KeyP"
        };
    }
    if (event.code === "Period") {
        return {
            device: "keyboard",
            action: "step-tick",
            source: "Period"
        };
    }
    if (event.code === "KeyA") {
        return {
            device: "keyboard",
            action: "admit-patient",
            severity: 2,
            source: "KeyA"
        };
    }
    if (event.code === "Digit1" || event.code === "Digit2" || event.code === "Digit3") {
        return {
            device: "keyboard",
            action: "admit-patient",
            severity: Number(event.code.slice(-1)),
            source: event.code
        };
    }
    if (event.code === "KeyT") {
        return {
            device: "keyboard",
            action: "treat-patient",
            source: "KeyT"
        };
    }
    if (event.code === "KeyH") {
        return {
            device: "keyboard",
            action: "send-patient-home",
            source: "KeyH"
        };
    }
    if (event.code === "KeyZ") {
        return {
            device: "keyboard",
            action: "speed-increase",
            source: "KeyZ"
        };
    }
    if (event.code === "KeyF") {
        return {
            device: "keyboard",
            action: "build-room",
            source: "KeyF"
        };
    }
    if (event.code === "KeyG") {
        return {
            device: "keyboard",
            action: "open-furnish-corridor",
            source: "KeyG"
        };
    }
    if (event.code === "KeyV") {
        return {
            device: "keyboard",
            action: "open-edit-room",
            source: "KeyV"
        };
    }
    if (event.code === "KeyB") {
        return {
            device: "keyboard",
            action: "open-hire-staff",
            source: "KeyB"
        };
    }
    if (event.code === "KeyC") {
        return {
            device: "keyboard",
            action: "open-casebook",
            source: "KeyC"
        };
    }
    if (event.code === "F1") {
        return {
            device: "keyboard",
            action: "open-bank-manager",
            source: "F1"
        };
    }
    if (event.code === "F2") {
        return {
            device: "keyboard",
            action: "open-bank-stats",
            source: "F2"
        };
    }
    if (event.code === "F3") {
        return {
            device: "keyboard",
            action: "open-staff",
            source: "F3"
        };
    }
    if (event.code === "F4") {
        return {
            device: "keyboard",
            action: "open-map",
            source: "F4"
        };
    }
    if (event.code === "F5") {
        return {
            device: "keyboard",
            action: "open-casebook",
            source: "F5"
        };
    }
    if (event.code === "Enter") {
        return {
            device: "keyboard",
            action: "confirm-action",
            source: "Enter"
        };
    }
    if (event.code === "KeyE") {
        return {
            device: "keyboard",
            action: "confirm-action",
            source: "KeyE"
        };
    }
    if (event.code === "Escape") {
        return {
            device: "keyboard",
            action: "cancel-action",
            source: "Escape"
        };
    }
    if (event.code === "KeyQ") {
        return {
            device: "keyboard",
            action: "cancel-action",
            source: "KeyQ"
        };
    }
    if (event.code === "KeyS") {
        return {
            device: "keyboard",
            action: "save-game",
            source: "KeyS"
        };
    }
    if (event.code === "KeyL") {
        return {
            device: "keyboard",
            action: "load-game",
            source: "KeyL"
        };
    }
    if (event.code === "KeyR") {
        return {
            device: "keyboard",
            action: "open-research",
            source: "KeyR"
        };
    }
    if (event.code === "KeyN") {
        return {
            device: "keyboard",
            action: "next-level",
            source: "KeyN"
        };
    }
    if (event.code === "F6") {
        return {
            device: "keyboard",
            action: "open-research",
            source: "F6"
        };
    }
    if (event.code === "F7") {
        return {
            device: "keyboard",
            action: "open-status",
            source: "F7"
        };
    }
    if (event.code === "F8") {
        return {
            device: "keyboard",
            action: "open-charts",
            source: "F8"
        };
    }
    if (event.code === "F9") {
        return {
            device: "keyboard",
            action: "open-policy",
            source: "F9"
        };
    }
    if (event.code === "F10") {
        return {
            device: "keyboard",
            action: "open-machine-menu",
            source: "F10"
        };
    }
    if (event.code === "ArrowLeft") {
        return {
            device: "keyboard",
            action: "camera-west",
            source: "ArrowLeft"
        };
    }
    if (event.code === "ArrowRight") {
        return {
            device: "keyboard",
            action: "camera-east",
            source: "ArrowRight"
        };
    }
    if (event.code === "ArrowUp") {
        return {
            device: "keyboard",
            action: "camera-north",
            source: "ArrowUp"
        };
    }
    if (event.code === "ArrowDown") {
        return {
            device: "keyboard",
            action: "camera-south",
            source: "ArrowDown"
        };
    }
    return null;
}
export function normalizeMouseEvent(event) {
    if (event.type !== "mousedown") {
        return null;
    }
    if (!isFiniteNumber(event.clientX) || !isFiniteNumber(event.clientY)) {
        return null;
    }
    const pointer = roundPointerCoordinates(event.clientX, event.clientY);
    if (event.button === 0) {
        return {
            device: "mouse",
            action: "treat-patient",
            source: "mouse:0",
            pointer
        };
    }
    if (event.button === 2) {
        return {
            device: "mouse",
            action: "admit-patient",
            severity: 1,
            source: "mouse:2",
            pointer
        };
    }
    return null;
}
export function normalizeTouchEvent(event) {
    if (event.type !== "touchstart") {
        return null;
    }
    const firstTouch = event.touches[0];
    if (!firstTouch) {
        return null;
    }
    if (!isFiniteNumber(firstTouch.clientX) || !isFiniteNumber(firstTouch.clientY)) {
        return null;
    }
    return {
        device: "touch",
        action: "treat-patient",
        source: "touch:0",
        pointer: roundPointerCoordinates(firstTouch.clientX, firstTouch.clientY)
    };
}
