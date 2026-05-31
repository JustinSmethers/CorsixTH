const ROLLOUT_ORDER = ["canary", "progressive", "full"];
const PROMOTION_THRESHOLDS = {
    canary: {
        crashFreeSessionsPercent: 99.9,
        errorRatePercent: 0.05,
        p95FrameTimeMs: 16
    },
    progressive: {
        crashFreeSessionsPercent: 99.95,
        errorRatePercent: 0.04,
        p95FrameTimeMs: 16
    },
    full: {
        crashFreeSessionsPercent: 99.97,
        errorRatePercent: 0.03,
        p95FrameTimeMs: 16
    }
};
export const PHASE10_COMMAND_MATRIX = {
    "release-candidate": [
        "pnpm --dir web run phase10:check",
        "pnpm --dir web run release:rc"
    ],
    "staging-dry-run": [
        "pnpm --dir web run release:staging-dry-run",
        "pnpm --dir web run release:checklist -- --operation staging-dry-run"
    ],
    "rollback-simulation": [
        "pnpm --dir web run release:rollback-sim",
        "pnpm --dir web run release:checklist -- --operation rollback-simulation"
    ],
    "hotfix-dry-run": [
        "pnpm --dir web run release:hotfix-dry-run",
        "pnpm --dir web run release:checklist -- --operation hotfix-dry-run"
    ]
};
function isWithinThreshold(actual, threshold, comparator) {
    return comparator === "max" ? actual <= threshold : actual >= threshold;
}
export function nextRolloutStage(stage) {
    const currentIndex = ROLLOUT_ORDER.indexOf(stage);
    if (currentIndex < 0 || currentIndex + 1 >= ROLLOUT_ORDER.length) {
        return null;
    }
    return ROLLOUT_ORDER[currentIndex + 1] ?? null;
}
export function evaluateRolloutPromotion(stage, health) {
    const thresholds = PROMOTION_THRESHOLDS[stage];
    const blockingSignals = [];
    if (!isWithinThreshold(health.crashFreeSessionsPercent, thresholds.crashFreeSessionsPercent, "min")) {
        blockingSignals.push("crash-free-sessions");
    }
    if (!isWithinThreshold(health.errorRatePercent, thresholds.errorRatePercent, "max")) {
        blockingSignals.push("error-rate");
    }
    if (!isWithinThreshold(health.p95FrameTimeMs, thresholds.p95FrameTimeMs, "max")) {
        blockingSignals.push("p95-frame-time");
    }
    return {
        promote: blockingSignals.length === 0,
        blockingSignals
    };
}
export function simulateRollbackPlan(input) {
    const requiresHotfix = input.incidentSeverity === "sev1" || input.incidentSeverity === "sev2";
    const targetStage = input.fromStage === "canary" ? "canary" : "canary";
    const actions = [
        `Freeze rollout progression for incident ${input.incidentId}.`,
        `Shift traffic from ${input.fromStage} to ${targetStage}.`,
        "Execute `pnpm --dir web run release:rollback-sim`",
        "Verify crash/error telemetry returns to baseline dashboard thresholds."
    ];
    if (requiresHotfix && input.hotfixCandidateCommit) {
        actions.push(`Prepare hotfix candidate ${input.hotfixCandidateCommit} for staged validation.`);
    }
    return {
        incidentId: input.incidentId,
        fromStage: input.fromStage,
        targetStage,
        validated: true,
        requiresHotfix,
        actions
    };
}
export function createReleaseChecklistArtifact(input) {
    return {
        ...input,
        commandMatrix: PHASE10_COMMAND_MATRIX[input.operation]
    };
}
