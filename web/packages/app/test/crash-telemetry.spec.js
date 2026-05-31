import { createCrashTelemetryController } from "../src/crash-telemetry";
class FakeTelemetryTarget {
    handlers = new Map();
    addEventListener(type, listener) {
        const listeners = this.handlers.get(type) ?? new Set();
        listeners.add(listener);
        this.handlers.set(type, listeners);
    }
    removeEventListener(type, listener) {
        this.handlers.get(type)?.delete(listener);
    }
    emit(type, event) {
        for (const listener of this.handlers.get(type) ?? []) {
            listener(event);
        }
    }
}
describe("phase 10 crash telemetry", () => {
    it("captures global error/unhandled-rejection events and routes critical alerts", () => {
        const events = [];
        const target = new FakeTelemetryTarget();
        const controller = createCrashTelemetryController({
            environment: "staging",
            releaseStage: "canary",
            now: () => "2026-02-12T15:05:00.000Z",
            onEvent: (event) => {
                events.push(event);
            }
        });
        controller.bind(target);
        target.emit("error", {
            message: "Fatal renderer crash",
            error: new Error("GPU lost context")
        });
        target.emit("unhandledrejection", {
            reason: "fatal promise rejection"
        });
        const snapshot = controller.snapshot();
        expect(snapshot.totalEvents).toBe(2);
        expect(snapshot.totalCritical).toBe(2);
        expect(snapshot.lastAlertRoutes).toEqual(["dashboard", "slack-oncall", "pagerduty"]);
        expect(events.map((event) => event.releaseStage)).toEqual(["canary", "canary"]);
        controller.dispose();
    });
    it("keeps warning-level telemetry on dashboard and slack without pager escalation", () => {
        const target = new FakeTelemetryTarget();
        const controller = createCrashTelemetryController({
            environment: "production",
            releaseStage: "progressive",
            now: () => "2026-02-12T15:10:00.000Z"
        });
        controller.bind(target);
        target.emit("error", {
            message: "Network timeout while uploading telemetry",
            error: new Error("timeout")
        });
        const events = controller.events();
        expect(events).toHaveLength(1);
        expect(events[0]?.severity).toBe("warning");
        expect(events[0]?.alertRoutes).toEqual(["dashboard", "slack-oncall"]);
        const snapshot = controller.snapshot();
        expect(snapshot.totalWarnings).toBe(1);
        expect(snapshot.totalCritical).toBe(0);
    });
    it("supports explicit manual capture for simulated triage drills", () => {
        const controller = createCrashTelemetryController({
            environment: "staging",
            releaseStage: "canary",
            now: () => "2026-02-12T15:15:00.000Z"
        });
        const event = controller.captureManualEvent({
            source: "ui",
            message: "simulated release drill crash",
            stack: "stacktrace"
        });
        expect(event.severity).toBe("critical");
        expect(event.alertRoutes).toContain("pagerduty");
        expect(controller.snapshot().lastEventId).toBe(event.id);
    });
});
