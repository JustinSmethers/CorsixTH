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
    if (event.altKey || event.ctrlKey || event.metaKey) {
        return null;
    }
    if (event.code === "Space") {
        return {
            device: "keyboard",
            action: "pause-toggle",
            source: "Space"
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
    if (event.code === "KeyT") {
        return {
            device: "keyboard",
            action: "treat-patient",
            source: "KeyT"
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
