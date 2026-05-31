import { PHASE10_COMMAND_MATRIX, createReleaseChecklistArtifact, evaluateRolloutPromotion, nextRolloutStage, simulateRollbackPlan } from "../src/release-safeguards";
describe("phase 10 release safeguards", () => {
    it("locks command matrix coverage for release, rollback, and hotfix operations", () => {
        expect(Object.keys(PHASE10_COMMAND_MATRIX)).toEqual([
            "release-candidate",
            "staging-dry-run",
            "rollback-simulation",
            "hotfix-dry-run"
        ]);
        expect(PHASE10_COMMAND_MATRIX["release-candidate"]).toContain("pnpm --dir web run phase10:check");
        expect(PHASE10_COMMAND_MATRIX["staging-dry-run"]).toContain("pnpm --dir web run release:staging-dry-run");
        expect(PHASE10_COMMAND_MATRIX["rollback-simulation"]).toContain("pnpm --dir web run release:rollback-sim");
        expect(PHASE10_COMMAND_MATRIX["hotfix-dry-run"]).toContain("pnpm --dir web run release:hotfix-dry-run");
    });
    it("advances rollout stages in deterministic order", () => {
        expect(nextRolloutStage("canary")).toBe("progressive");
        expect(nextRolloutStage("progressive")).toBe("full");
        expect(nextRolloutStage("full")).toBeNull();
    });
    it("blocks rollout promotion when live health signals exceed thresholds", () => {
        const stage = "canary";
        const healthy = evaluateRolloutPromotion(stage, {
            crashFreeSessionsPercent: 99.96,
            errorRatePercent: 0.02,
            p95FrameTimeMs: 14
        });
        expect(healthy.promote).toBe(true);
        expect(healthy.blockingSignals).toEqual([]);
        const unhealthy = evaluateRolloutPromotion(stage, {
            crashFreeSessionsPercent: 99.1,
            errorRatePercent: 0.11,
            p95FrameTimeMs: 20
        });
        expect(unhealthy.promote).toBe(false);
        expect(unhealthy.blockingSignals).toEqual([
            "crash-free-sessions",
            "error-rate",
            "p95-frame-time"
        ]);
    });
    it("produces a rollback simulation plan with a validated path", () => {
        const plan = simulateRollbackPlan({
            fromStage: "progressive",
            incidentId: "INC-2026-0212-001",
            incidentSeverity: "sev1",
            hotfixCandidateCommit: "abc1234"
        });
        expect(plan.validated).toBe(true);
        expect(plan.targetStage).toBe("canary");
        expect(plan.requiresHotfix).toBe(true);
        expect(plan.actions[0]).toContain("Freeze rollout progression");
        expect(plan.actions).toContain("Execute `pnpm --dir web run release:rollback-sim`");
    });
    it("captures checklist artifact rows for launch ownership and sign-off", () => {
        const checklist = createReleaseChecklistArtifact({
            operation: "staging-dry-run",
            status: "passed",
            generatedAtIso: "2026-02-12T15:00:00.000Z",
            rolloutStage: "canary",
            signoffs: {
                releaseManager: "approved",
                qa: "approved",
                onCallPrimary: "approved"
            }
        });
        expect(checklist.operation).toBe("staging-dry-run");
        expect(checklist.status).toBe("passed");
        expect(checklist.commandMatrix).toEqual(PHASE10_COMMAND_MATRIX["staging-dry-run"]);
        expect(checklist.signoffs.releaseManager).toBe("approved");
        expect(checklist.signoffs.onCallPrimary).toBe("approved");
    });
});
