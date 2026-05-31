function resolveSeverity(message) {
    const normalized = message.toLowerCase();
    if (normalized.includes("timeout") || normalized.includes("network")) {
        return "warning";
    }
    return "critical";
}
function resolveAlertRoutes(severity) {
    if (severity === "warning") {
        return ["dashboard", "slack-oncall"];
    }
    return ["dashboard", "slack-oncall", "pagerduty"];
}
function resolveMessage(reason) {
    if (typeof reason === "string" && reason.length > 0) {
        return reason;
    }
    if (reason instanceof Error) {
        return reason.message;
    }
    return "Unhandled rejection";
}
function resolveStack(errorLike) {
    if (errorLike instanceof Error && typeof errorLike.stack === "string" && errorLike.stack.length > 0) {
        return errorLike.stack;
    }
    return null;
}
function createSnapshot(events) {
    const totalWarnings = events.filter((event) => event.severity === "warning").length;
    const totalCritical = events.filter((event) => event.severity === "critical").length;
    const last = events[events.length - 1];
    return {
        totalEvents: events.length,
        totalWarnings,
        totalCritical,
        lastEventId: last?.id ?? null,
        lastAlertRoutes: [...(last?.alertRoutes ?? [])]
    };
}
export function createCrashTelemetryController(options) {
    let sequence = 0;
    let releaseStage = options.releaseStage;
    let boundTarget = null;
    const emittedEvents = [];
    const now = options.now ?? (() => new Date().toISOString());
    const pushEvent = (source, message, stack) => {
        sequence += 1;
        const severity = resolveSeverity(message);
        const event = {
            id: `phase10-${String(sequence).padStart(4, "0")}`,
            occurredAtIso: now(),
            environment: options.environment,
            releaseStage,
            source,
            message,
            stack,
            severity,
            alertRoutes: resolveAlertRoutes(severity)
        };
        emittedEvents.push(event);
        options.onEvent?.(event);
        return event;
    };
    const onError = (event) => {
        const message = event.message ?? "Unhandled window error";
        pushEvent("window.error", message, resolveStack(event.error));
    };
    const onUnhandledRejection = (event) => {
        pushEvent("window.unhandledrejection", resolveMessage(event.reason), resolveStack(event.reason));
    };
    return {
        bind(target) {
            if (boundTarget === target) {
                return;
            }
            if (boundTarget) {
                boundTarget.removeEventListener("error", onError);
                boundTarget.removeEventListener("unhandledrejection", onUnhandledRejection);
            }
            boundTarget = target;
            boundTarget.addEventListener("error", onError);
            boundTarget.addEventListener("unhandledrejection", onUnhandledRejection);
        },
        dispose() {
            if (!boundTarget) {
                return;
            }
            boundTarget.removeEventListener("error", onError);
            boundTarget.removeEventListener("unhandledrejection", onUnhandledRejection);
            boundTarget = null;
        },
        events() {
            return emittedEvents.map((event) => ({
                ...event,
                alertRoutes: [...event.alertRoutes]
            }));
        },
        snapshot() {
            return createSnapshot(emittedEvents);
        },
        setReleaseStage(stage) {
            releaseStage = stage;
        },
        captureManualEvent(input) {
            return pushEvent(input.source, input.message, input.stack ?? null);
        }
    };
}
