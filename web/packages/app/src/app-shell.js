import {
    decodeThemeHospitalAnimationSetFromBundle,
    decodeThemeHospitalMapFromBundle,
    decodeThemeHospitalPalette,
    decodeThemeHospitalSpriteSheetFromBundle,
    renderThemeHospitalMapScene,
    renderThemeHospitalSprite
} from "@corsixth/assets";
import { createWebAudioMixer } from "@corsixth/audio-webaudio";
import { createIndexedDbPersistenceAdapter } from "@corsixth/persistence";
import { patientDeathCashPenaltyForSeverity, patientDeathReputationPenaltyForSeverity, patientSendHomeCashPenaltyForSeverity, patientSendHomeReputationPenaltyForSeverity, QUEUE_PRESSURE_HIGH_THRESHOLD, QUEUE_PRESSURE_REPUTATION_PENALTY_PER_TICK, roomBuildCost, roomRepairCost, staffHireCost, staffWageCostPerTick, treatmentFailureCashPenaltyForSeverity, treatmentFailureReputationPenaltyForSeverity, treatmentPricingCashMultiplier, treatmentPricingReputationDelta } from "@corsixth/rules";
import { normalizeKeyboardEvent, normalizeKeyboardReleaseEvent, normalizeMouseEvent, normalizeTouchEvent } from "./input-normalization";
import { AppOrchestrator } from "./orchestrator";
import { restoreOrchestratorFromSaveEnvelope, saveOrchestratorToSlot } from "./persistence";
const HOSPITAL_CANVAS_WIDTH = 768;
const HOSPITAL_CANVAS_HEIGHT = 480;
const DEFAULT_TICK_RATE_HZ = 4;
const DEFAULT_POINTER_TILE_SIZE = 16;
const HOSPITAL_TILE_COLUMNS = 14;
const HOSPITAL_TILE_ROWS = 12;
const HOSPITAL_CAMERA_STEP = 4;
const HOSPITAL_DEFAULT_ZOOM_INDEX = 2;
const HOSPITAL_ZOOM_LEVELS = [
    { label: "50%", tileColumns: 22, tileRows: 18 },
    { label: "75%", tileColumns: 18, tileRows: 14 },
    { label: "100%", tileColumns: HOSPITAL_TILE_COLUMNS, tileRows: HOSPITAL_TILE_ROWS },
    { label: "150%", tileColumns: 10, tileRows: 8 },
    { label: "200%", tileColumns: 8, tileRows: 6 }
];
const DEFAULT_SAVE_SLOT = "browser-autosave";
const SPEED_MULTIPLIER_STEPS = [0.5, 1, 2, 4, 8];
const HOSPITAL_ISO_TILE_HALF_WIDTH = 32;
const HOSPITAL_ISO_TILE_HALF_HEIGHT = 16;
const PATIENT_STATUS_COLORS = {
    queued: "#f3c74f",
    "walking-to-diagnosis": "#c9e36a",
    diagnosing: "#58a6ff",
    "awaiting-treatment": "#ff8c42",
    "walking-to-treatment": "#f0a05d",
    treating: "#66d17a"
};
const ROOM_TYPE_COLORS = {
    diagnosis: "#5fb3c8",
    treatment: "#79c66a",
    pharmacy: "#b894f6",
    specialist: "#f08e67"
};
const STAFF_ROLE_COLORS = {
    diagnostician: "#d8b55a",
    nurse: "#d96c75",
    handyman: "#7acb87",
    receptionist: "#8fb7ff"
};
const PLACEMENT_REASON_LABELS = {
    "missing-position": "choose a tile",
    "missing-staff": "staff unavailable",
    "out-of-bounds": "out of bounds",
    "invalid-terrain": "invalid terrain",
    "non-buildable": "not buildable",
    occupied: "occupied",
    "insufficient-cash": "not enough cash",
    "no-traversable-position": "no clear path",
    "staff-market-empty": "no scenario staff available",
    "room-unavailable": "room unavailable in scenario",
    "object-unavailable": "object unavailable in scenario"
};
const ACTION_STATUS_LABELS = {
    "app.paused": "Action: paused",
    "app.resumed": "Action: resumed",
    "app.step": "Action: step",
    "admissions.opened": "Action: admissions open",
    "admissions.closed": "Action: admissions closed",
    "speed.changed": "Action: speed changed",
    "cancel-action-blocked": "Action: cancel blocked",
    "confirm-action-blocked": "Action: confirm blocked",
    "camera.unavailable": "Action: camera unavailable",
    "camera-position.unavailable": "Action: camera position unavailable",
    "placement.rotate-blocked": "Action: placement rotation blocked",
    "transparent-walls.unavailable": "Action: transparent walls unavailable",
    "zoom.unavailable": "Action: zoom unavailable",
    "admission-policy.changed": "Action: admission policy changed",
    "pricing-policy.changed": "Action: pricing policy changed",
    "pricing-policy.unchanged": "Action: pricing policy unchanged",
    "loan.taken": "Action: loan taken",
    "loan.take-blocked": "Action: loan blocked",
    "loan.repaid": "Action: loan repaid",
    "loan.repay-blocked": "Action: loan repayment blocked",
    "finance.audit-run": "Action: finance audit run",
    "finance.audit-blocked": "Action: finance audit blocked",
    "marketing.launched": "Action: marketing campaign launched",
    "marketing.blocked": "Action: marketing campaign blocked",
    "insurance.started": "Action: insurance contract started",
    "insurance.blocked": "Action: insurance contract blocked",
    "awards.completed": "Action: awards completed",
    "awards.blocked": "Action: awards blocked",
    "awards.poor-blocked": "Action: awards poor criteria blocked",
    "awards.penalty-applied": "Action: awards penalty applied",
    "rat.killed": "Action: rat killed",
    "rat.missed": "Action: rat missed",
    "rat.blocked": "Action: rat blocked",
    "plant.watered": "Action: plant watered",
    "plant.neglected": "Action: plant neglected",
    "plant.blocked": "Action: plant blocked",
    "research.started": "Action: research started",
    "research.blocked": "Action: research blocked",
    "emergency.started": "Action: emergency started",
    "emergency.blocked": "Action: emergency blocked",
    "epidemic.started": "Action: epidemic started",
    "epidemic.blocked": "Action: epidemic blocked",
    "training.started": "Action: staff training started",
    "training.blocked": "Action: staff training blocked",
    "vip.started": "Action: VIP inspection started",
    "vip.blocked": "Action: VIP inspection blocked",
    "room.built": "Action: room built",
    "room.build-blocked": "Action: room blocked",
    "room.sold": "Action: room sold",
    "room.sell-blocked": "Action: room sale blocked",
    "room.repaired": "Action: room repaired",
    "room.repair-blocked": "Action: room repair blocked",
    "object.placed": "Action: object placed",
    "object.place-blocked": "Action: object placement blocked",
    "object.sold": "Action: object sold",
    "object.sell-blocked": "Action: object sale blocked",
    "staff.hired": "Action: staff hired",
    "staff.hire-blocked": "Action: staff blocked",
    "staff.fired": "Action: staff fired",
    "staff.fire-blocked": "Action: staff fire blocked",
    "staff.moved": "Action: staff moved",
    "staff.move-blocked": "Action: staff move blocked",
    "staff.rested": "Action: staff rested",
    "staff.rest-blocked": "Action: staff rest blocked",
    "staff.break-blocked": "Action: staff break blocked",
    "treatment-room.toggle-blocked": "Action: treatment room toggle blocked",
    "patient.admitted": "Action: patient admitted",
    "patient.prioritized": "Action: patient prioritized",
    "patient.prioritize-empty": "Action: patient cannot be prioritized",
    "patient.sent-home": "Action: patient sent home",
    "patient.send-home-empty": "Action: no patient selected",
    "patient.treated.success": "Action: patient treated",
    "patient.treated.empty": "Action: no patient selected",
    "patient.drink-given": "Action: drink given",
    "patient.drink-blocked": "Action: drink blocked",
    "patient.toilet-used": "Action: toilet used",
    "patient.toilet-blocked": "Action: toilet blocked"
};
function browserFrameClock() {
    return {
        requestFrame: (callback) => window.requestAnimationFrame(callback),
        cancelFrame: (handle) => window.cancelAnimationFrame(handle),
        now: () => window.performance.now()
    };
}
function requiredElement(root, selector) {
    const element = root.querySelector(selector);
    if (!element) {
        throw new Error(`Missing required app-shell element: ${selector}`);
    }
    return element;
}
export function formatScenarioResearchDetails(telemetry) {
    const hasScenarioResearchDetails = telemetry.scenarioResearchStartRating !== null ||
        telemetry.scenarioResearchPointsDivisor !== 1 ||
        telemetry.scenarioResearchStartCost !== null ||
        telemetry.scenarioResearchMinDrugCost !== null ||
        telemetry.scenarioResearchDrugImproveRate !== null ||
        telemetry.scenarioResearchImproveCostPercent !== null ||
        telemetry.scenarioResearchImproveIncrementPercent !== null ||
        telemetry.scenarioResearchMaxObjectStrength !== null ||
        telemetry.scenarioResearchIncrement !== null ||
        telemetry.scenarioAutopsyResearchPercent !== null ||
        telemetry.scenarioAutopsyReputationHitPercent !== null ||
        telemetry.treatmentResearchAutopsyTicks > 0 ||
        telemetry.treatmentResearchAutopsyReputationPenalty > 0;
    if (!hasScenarioResearchDetails) {
        return "";
    }
    return `, scenario rating ${telemetry.scenarioResearchStartRating ?? "default"}, divisor ${telemetry.scenarioResearchPointsDivisor}, start cost ${telemetry.scenarioResearchStartCost ?? "default"}, min drug ${telemetry.scenarioResearchMinDrugCost ?? "default"}, improve ${telemetry.scenarioResearchDrugImproveRate ?? "default"}, improve cost ${telemetry.scenarioResearchImproveCostPercent ?? "default"}, improve increment ${telemetry.scenarioResearchImproveIncrementPercent ?? "default"}, object strength ${telemetry.scenarioResearchMaxObjectStrength ?? "default"}/${telemetry.scenarioResearchIncrement ?? "default"}, autopsy ${telemetry.scenarioAutopsyResearchPercent ?? "default"}%/-${telemetry.scenarioAutopsyReputationHitPercent ?? "default"}%, autopsy totals ${telemetry.treatmentResearchAutopsyTicks}/${telemetry.treatmentResearchAutopsyReputationPenalty}`;
}
export function formatResearchEffectStatus(telemetry) {
    return `Research effect: +${telemetry.treatmentResearchSuccessBonus}% success, next ${telemetry.treatmentResearchProjectCost}/${telemetry.treatmentResearchProjectTicks} ticks, throughput ${telemetry.treatmentResearchTicksPerTick}x/${telemetry.treatmentResearchActiveResearchers} researchers${formatScenarioResearchDetails(telemetry)}`;
}
export function formatSeedStatus(telemetry) {
    return `Seed: ${telemetry.seed}`;
}
export function formatTickStatus(telemetry) {
    return `Tick: ${telemetry.tick}`;
}
export function formatSpeedStatus(telemetry) {
    return `Speed: ${telemetry.speedMultiplier}x`;
}
export function nextSpeedMultiplier(currentSpeedMultiplier) {
    const currentIndex = SPEED_MULTIPLIER_STEPS.indexOf(currentSpeedMultiplier);
    if (currentIndex === -1) {
        return 1;
    }
    return SPEED_MULTIPLIER_STEPS[Math.min(currentIndex + 1, SPEED_MULTIPLIER_STEPS.length - 1)];
}
export function formatPausedStatus(telemetry) {
    return `Paused: ${telemetry.paused ? "yes" : "no"}`;
}
export function formatAudioStatus(audioStatus) {
    return `Audio: ${audioStatus.initialization}`;
}
export function formatAudioVolumeStatus(audioStatus) {
    const sound = audioStatus.soundMuted ? "sound off" : "sound on";
    const music = audioStatus.musicMuted ? "music off" : "music on";
    return `Audio volume: ${Math.round(audioStatus.volume * 100)}% (${sound}, ${music})`;
}
export function formatAudioMasterMuteLabel(muted) {
    return muted ? "Unmute" : "Mute";
}
export function formatAudioChannelMuteLabel(channel, muted) {
    return `${channel} ${muted ? "On" : "Off"}`;
}
export function formatStateHashStatus(telemetry) {
    return `State hash: ${telemetry.stateHash}`;
}
export function formatPauseToggleLabel(telemetry) {
    return telemetry.paused ? "Resume" : "Pause";
}
export function formatAdmissionsToggleLabel(telemetry) {
    return telemetry.admissionsOpen ? "Close Admissions" : "Open Admissions";
}
export function formatStaffBreakToggleLabel(telemetry) {
    return telemetry.onBreakStaff > 0 ? "Set Diagnostician Active" : "Set Diagnostician On Break";
}
export function formatSelectedStaffBreakToggleLabel(staff) {
    return staff.status === "active" ? "Set Selected Staff On Break" : "Set Selected Staff Active";
}
export function formatTreatmentRoomToggleLabel(telemetry) {
    return telemetry.openTreatmentRooms > 0 ? "Close Treatment Room" : "Open Treatment Room";
}
export function formatSelectedRoomToggleLabel(room) {
    return room.status === "open" ? "Close Selected Room" : "Open Selected Room";
}
export function formatMuteToggleLabel(audioStatus) {
    return audioStatus.muted ? "Unmute" : "Mute";
}
function renderTelemetry(elements, orchestrator, audioMixer, languageSummary = null, scenario = null) {
    const telemetry = orchestrator.telemetry();
    const audioStatus = audioMixer.status();
    elements.pauseToggleButton.textContent = formatPauseToggleLabel(telemetry);
    elements.speedSelect.value = String(telemetry.speedMultiplier);
    elements.admissionPolicySelect.value = telemetry.admissionPolicy;
    elements.pricingPolicySelect.value = telemetry.treatmentPricingPolicy;
    elements.admissionsToggleButton.textContent = formatAdmissionsToggleLabel(telemetry);
    elements.staffBreakToggleButton.textContent = formatStaffBreakToggleLabel(telemetry);
    elements.treatmentRoomToggleButton.textContent = formatTreatmentRoomToggleLabel(telemetry);
    elements.muteToggleButton.textContent = formatMuteToggleLabel(audioStatus);
    elements.volumeSlider.value = String(Math.round(audioStatus.volume * 100));
    elements.takeLoanButton.disabled = !canTakeLoanFromTelemetry(telemetry);
    elements.repayLoanButton.disabled = !canRepayLoanFromTelemetry(telemetry);
    elements.financeAuditButton.disabled = !canRunFinanceAuditFromTelemetry(telemetry);
    elements.marketingCampaignButton.disabled = !canRunMarketingCampaignFromTelemetry(telemetry);
    elements.insuranceContractButton.disabled = !canStartInsuranceContractFromTelemetry(telemetry);
    elements.awardsButton.disabled = !canRunAwardsFromTelemetry(telemetry);
    elements.researchButton.disabled = !canStartResearchFromTelemetry(telemetry);
    elements.emergencyButton.disabled = !canStartEmergencyFromTelemetry(telemetry);
    elements.epidemicButton.disabled = !canStartEpidemicFromTelemetry(telemetry);
    elements.vipInspectionButton.disabled = !canStartVipInspectionFromTelemetry(telemetry);
    elements.seedMetric.textContent = formatSeedStatus(telemetry);
    elements.tickMetric.textContent = formatTickStatus(telemetry);
    elements.speedStatusMetric.textContent = formatSpeedStatus(telemetry);
    elements.treatedMetric.textContent = formatTreatedPatientsStatus(telemetry);
    elements.waitingMetric.textContent = formatWaitingPatientsStatus(telemetry);
    elements.receptionMetric.textContent = formatReceptionPatientsStatus(telemetry);
    elements.queueMetric.textContent = formatQueuedPatientsStatus(telemetry);
    elements.walkingToDiagnosisMetric.textContent = formatWalkingToDiagnosisPatientsStatus(telemetry);
    elements.diagnosingMetric.textContent = formatDiagnosingPatientsStatus(telemetry);
    elements.diagnosedMetric.textContent = formatDiagnosedPatientsStatus(telemetry);
    elements.awaitingTreatmentMetric.textContent = formatAwaitingTreatmentPatientsStatus(telemetry);
    elements.walkingToTreatmentMetric.textContent = formatWalkingToTreatmentPatientsStatus(telemetry);
    elements.treatingMetric.textContent = formatTreatingPatientsStatus(telemetry);
    elements.dischargedMetric.textContent = formatDischargedPatientsStatus(telemetry);
    elements.treatmentFailuresMetric.textContent = formatTreatmentFailuresStatus(telemetry);
    elements.researchStatusMetric.textContent = formatResearchStatus(telemetry);
    elements.researchEffectMetric.textContent = formatResearchEffectStatus(telemetry);
    elements.scenarioExpertiseMetric.textContent = formatScenarioExpertiseStatus(telemetry, languageSummary);
    elements.scenarioOpponentsMetric.textContent = formatScenarioOpponentsStatus(telemetry);
    elements.scenarioOpponentProgressMetric.textContent = formatScenarioOpponentProgressStatus(telemetry);
    elements.scenarioNetworkCriteriaMetric.textContent = formatScenarioNetworkCriteriaStatus(telemetry);
    elements.quakeStatusMetric.textContent = formatQuakeStatus(telemetry);
    elements.emergencyStatusMetric.textContent = formatEmergencyStatus(telemetry, languageSummary);
    elements.emergencyRewardMetric.textContent = formatEmergencyRewardStatus(telemetry);
    elements.epidemicStatusMetric.textContent = formatEpidemicStatus(telemetry);
    elements.epidemicRewardMetric.textContent = formatEpidemicTermsStatus(telemetry);
    elements.vipInspectionStatusMetric.textContent = formatVipInspectionStatus(telemetry);
    elements.vipInspectionRewardMetric.textContent = formatVipInspectionTermsStatus(telemetry);
    elements.patientDeathsMetric.textContent = formatPatientDeathsStatus(telemetry);
    elements.patientVomitsMetric.textContent = formatPatientVomitsStatus(telemetry);
    elements.patientLitterMetric.textContent = formatPatientLitterStatus(telemetry);
    elements.patientDrinksMetric.textContent = formatPatientDrinksStatus(telemetry);
    elements.ratControlMetric.textContent = formatRatControlStatus(telemetry);
    elements.plantCareMetric.textContent = formatPlantCareStatus(telemetry);
    elements.patientsNeedingToiletMetric.textContent = formatPatientsNeedingToiletStatus(telemetry);
    elements.patientBowelOverflowsMetric.textContent = formatPatientBowelOverflowStatus(telemetry);
    elements.criticalPatientsMetric.textContent = formatCriticalPatientsStatus(telemetry);
    elements.patientMoodMetric.textContent = formatPatientMoodStatus(telemetry);
    elements.admissionsStatusMetric.textContent = formatAdmissionsStatus(telemetry);
    elements.admissionPolicyStatusMetric.textContent = formatAdmissionPolicyStatus(telemetry);
    elements.nextAdmissionMetric.textContent = formatNextAdmissionStatus(telemetry, languageSummary);
    elements.admissionRulesMetric.textContent = formatAdmissionRulesStatus(telemetry);
    elements.routingRulesMetric.textContent = formatRoutingRulesStatus(telemetry);
    elements.frontDeskStatusMetric.textContent = formatFrontDeskStatus(telemetry);
    elements.activeStaffMetric.textContent = formatActiveStaffStatus(telemetry);
    elements.onBreakStaffMetric.textContent = formatOnBreakStaffStatus(telemetry);
    elements.staffTrainingStatusMetric.textContent = formatStaffTrainingStatus(telemetry);
    elements.staffSkillStatusMetric.textContent = formatStaffSkillStatus(telemetry);
    elements.staffMarketStatusMetric.textContent = formatStaffMarketStatus(telemetry);
    elements.maintenanceStaffStatusMetric.textContent = formatMaintenanceStaffStatus(telemetry, languageSummary);
    elements.openDiagnosisRoomsMetric.textContent = formatOpenDiagnosisRoomsStatus(telemetry);
    elements.openTreatmentRoomsMetric.textContent = formatOpenTreatmentRoomsStatus(telemetry);
    elements.specializedTreatmentRoomsMetric.textContent = formatSpecializedTreatmentRoomsStatus(telemetry);
    elements.roomAvailabilityMetric.textContent = formatRoomAvailabilityHudStatus(telemetry, languageSummary);
    elements.objectAvailabilityMetric.textContent = formatObjectAvailabilityStatus(telemetry, scenario, languageSummary);
    elements.specializedTreatmentQueueMetric.textContent = formatSpecializedTreatmentQueueStatus(telemetry);
    elements.cashMetric.textContent = formatCashStatus(telemetry);
    elements.reputationMetric.textContent = formatReputationStatus(telemetry);
    elements.pricingPolicyStatusMetric.textContent = formatPricingPolicyStatus(telemetry);
    elements.loanStatusMetric.textContent = formatLoanStatus(telemetry);
    elements.loanInterestMetric.textContent = formatLoanInterestStatus(telemetry);
    elements.financeLedgerMetric.textContent = formatFinanceLedgerStatus(telemetry);
    elements.financeAuditMetric.textContent = formatFinanceAuditStatus(telemetry);
    elements.marketingCampaignMetric.textContent = formatMarketingCampaignStatus(telemetry);
    elements.insuranceContractStatusMetric.textContent = formatInsuranceContractStatus(telemetry);
    elements.insuranceContractRewardMetric.textContent = formatInsuranceTermsStatus(telemetry);
    elements.hospitalRatingMetric.textContent = formatHospitalRatingStatus(telemetry);
    elements.hospitalAwardMetric.textContent = formatHospitalAwardStatus(telemetry);
    elements.tickCashflowMetric.textContent = formatTickCashflowStatus(telemetry);
    elements.cumulativeCashflowMetric.textContent = formatCumulativeCashflowStatus(telemetry);
    elements.milestoneLevelMetric.textContent = formatMilestoneStatus(telemetry);
    elements.unlocksMetric.textContent = formatUnlockStatus(telemetry);
    elements.levelObjectiveStatusMetric.textContent = formatLevelObjectiveStatus(telemetry);
    elements.levelObjectiveProgressMetric.textContent = formatLevelObjectiveProgress(telemetry);
    elements.levelObjectiveSafetyMetric.textContent = formatLevelObjectiveSafety(telemetry);
    elements.eventsMetric.textContent = formatEventRulesStatus(telemetry);
    elements.lastEventMetric.textContent = formatLastEventStatus(telemetry);
    elements.advisorStatusMetric.textContent = telemetry.advisorStatus;
    elements.recentEventsMetric.textContent = formatRecentEventsStatus(telemetry);
    elements.queuePressureMetric.textContent = formatQueuePressureValueStatus(telemetry);
    elements.queuePressureStatusMetric.textContent = formatQueuePressureStatus(telemetry);
    elements.stressedStaffMetric.textContent = formatStressedStaffStatus(telemetry);
    elements.tiredStaffMetric.textContent = formatTiredStaffStatus(telemetry);
    elements.veryTiredStaffMetric.textContent = formatVeryTiredStaffStatus(telemetry);
    elements.salaryPressureMetric.textContent = formatSalaryPressureStatus(telemetry);
    elements.autoBreakStaffMetric.textContent = formatAutoBreakStaffStatus(telemetry);
    elements.roomsInMaintenanceMetric.textContent = formatRoomMaintenanceStatus(telemetry);
    elements.queuePressureEventsMetric.textContent = formatQueuePressureEventsStatus(telemetry);
    elements.staffBurnoutEventsMetric.textContent = formatStaffBurnoutEventsStatus(telemetry);
    elements.staffRecoveryEventsMetric.textContent = formatStaffRecoveryEventsStatus(telemetry);
    elements.roomMaintenanceStartEventsMetric.textContent = formatRoomMaintenanceStartEventsStatus(telemetry);
    elements.roomMaintenanceCompleteEventsMetric.textContent = formatRoomMaintenanceCompleteEventsStatus(telemetry);
    elements.hashMetric.textContent = formatStateHashStatus(telemetry);
    elements.pausedMetric.textContent = formatPausedStatus(telemetry);
    elements.audioStatusMetric.textContent = formatAudioStatus(audioStatus);
    elements.audioVolumeMetric.textContent = formatAudioVolumeStatus(audioStatus);
}
function requestAudioInitialization(audioMixer, orchestrator, elements, afterRender) {
    void audioMixer.initializeFromGesture().finally(() => {
        afterRender?.();
    });
}
function dispatchAndRender(orchestrator, elements, audioMixer, action, afterRender) {
    if (!action) {
        return [];
    }
    requestAudioInitialization(audioMixer, orchestrator, elements, afterRender);
    const audioEvents = orchestrator.dispatch(action);
    const paused = orchestrator.telemetry().paused;
    if (!paused) {
        void audioMixer.setPaused(false).finally(() => {
            afterRender?.();
        });
    }
    for (const event of audioEvents) {
        audioMixer.trigger(event);
    }
    if (paused) {
        void audioMixer.setPaused(true).finally(() => {
            afterRender?.();
        });
    }
    afterRender?.();
    return audioEvents;
}
function clamp(value, min, max) {
    if (!Number.isFinite(value)) {
        return min;
    }
    if (value < min) {
        return min;
    }
    if (value > max) {
        return max;
    }
    return value;
}
function safeDecode(callback) {
    try {
        return callback();
    }
    catch {
        return null;
    }
}
function hashText32(value) {
    let hash = 2166136261;
    for (let index = 0; index < value.length; index += 1) {
        hash ^= value.charCodeAt(index);
        hash = Math.imul(hash, 16777619) >>> 0;
    }
    return hash.toString(16).padStart(8, "0");
}
function stringifyError(error) {
    if (error instanceof Error) {
        return error.message;
    }
    return String(error);
}
function escapeHtml(value) {
    return String(value)
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;");
}
function placementReasonLabel(reason) {
    return PLACEMENT_REASON_LABELS[reason] ?? reason ?? "blocked";
}
const PLACEMENT_ORIENTATIONS = Object.freeze(["north", "east", "south", "west"]);
function nextPlacementOrientation(orientation = "north") {
    const index = PLACEMENT_ORIENTATIONS.indexOf(orientation);
    return PLACEMENT_ORIENTATIONS[(index + 1 + PLACEMENT_ORIENTATIONS.length) % PLACEMENT_ORIENTATIONS.length];
}
export function formatPlacementMode(placementAction, placementPreview) {
    if (!placementAction) {
        return "Placement: none";
    }
    const orientation = placementAction.orientation && placementAction.orientation !== "north" ? ` facing ${placementAction.orientation}` : "";
    if (!placementPreview) {
        return `Placement: ${placementAction.label}${orientation}`;
    }
    const position = placementPreview.requestedPosition ?? placementPreview.position;
    const location = position ? ` at ${position.x},${position.y}` : "";
    if (placementPreview.valid) {
        return `Placement: ${placementAction.label}${orientation}${location} (valid)`;
    }
    return `Placement: ${placementAction.label}${orientation}${location} blocked: ${placementReasonLabel(placementPreview.reason)}`;
}
export function formatActionStatus(events, placementEvaluation) {
    const event = typeof events === "string" ? events : events?.[0];
    const base = ACTION_STATUS_LABELS[event];
    if (!base) {
        return null;
    }
    if ((event === "room.build-blocked" || event === "staff.hire-blocked" || event === "staff.move-blocked" || event === "object.place-blocked") && placementEvaluation?.reason) {
        return `${base}: ${placementReasonLabel(placementEvaluation.reason)}`;
    }
    return base;
}
export function formatChoosePlacementActionStatus() {
    return "Action: choose placement";
}
export function formatIdleActionStatus() {
    return "Action: idle";
}
export function formatSelectedEntityActionStatus(entityType) {
    return `Action: selected ${entityType}`;
}
export function formatVisibilityActionStatus(subject, visible) {
    return `Action: ${subject} ${visible ? "shown" : "hidden"}`;
}
export function formatTransparentWallsActionStatus(state) {
    return `Action: transparent walls ${state}`;
}
export function formatNoMessagesActionStatus() {
    return "Action: no messages";
}
export function formatInformationStatus(visible) {
    return `Info: ${visible ? "shown" : "hidden"}`;
}
export function formatAppTitleLabel() {
    return "CorsixTH Browser Hospital";
}
export function formatPanelActionStatus(panel, action) {
    return `Action: ${panel} ${action}`;
}
export function formatPanelCloseButtonLabel() {
    return "Close";
}
export function formatPanelTitleLabel(panel) {
    const labels = {
        "bank-manager": "Bank Manager",
        "bank-stats": "Bank Stats",
        staff: "Staff",
        research: "Research",
        status: "Status",
        charts: "Charts",
        map: "Map",
        policy: "Policy",
        "machine-menu": "Machine Menu",
        casebook: "Casebook",
        messages: "Messages",
        jukebox: "Jukebox",
        "furnish-corridor": "Furnish Corridor",
        "edit-room": "Edit Room"
    };
    return labels[panel] ?? "";
}
export function formatPolicyOptionLabel(policy) {
    const labels = {
        conservative: "Conservative",
        standard: "Standard",
        aggressive: "Aggressive",
        discount: "Discount",
        premium: "Premium"
    };
    return labels[policy] ?? "";
}
export function formatFieldLabel(field) {
    const labels = {
        speed: "Speed",
        policy: "Policy",
        pricing: "Pricing",
        severity: "Severity",
        slot: "Slot",
        volume: "Volume",
        level: "Level",
        admission: "Admission",
        map: "Map"
    };
    return labels[field] ?? "";
}
export function formatSelectAriaLabel(select) {
    const labels = {
        speed: "Simulation speed",
        "admission-policy": "Automatic admission policy",
        "pricing-policy": "Treatment pricing policy",
        "admission-severity": "Manual admission severity",
        "save-slots": "Saved slots",
        "town-map-level": "Town map panel level",
        "policy-panel-admission": "Policy panel admission policy",
        "policy-panel-pricing": "Policy panel pricing policy"
    };
    return labels[select] ?? "";
}
export function formatGameplayActionButtonLabel(action) {
    const labels = {
        step: "Step",
        admit: "Admit",
        treat: "Treat",
        "restart-level": "Restart Level",
        "next-level": "Next Level"
    };
    return labels[action] ?? "";
}
export function formatCameraDirectionButtonLabel(direction, includeSubject = false) {
    const labels = {
        west: "West",
        east: "East",
        north: "North",
        south: "South"
    };
    const label = labels[direction] ?? "";
    return includeSubject && label ? `Camera ${label}` : label;
}
export function formatOriginalUiStripControlLabel(control) {
    const labels = {
        "pause-toggle": "Pause",
        step: formatGameplayActionButtonLabel("step"),
        "build-diagnosis-room": "Build GP",
        "build-treatment-room": "Build Ward",
        "build-pharmacy-room": "Build Pharmacy",
        "build-specialist-room": "Build Specialist",
        "hire-diagnostician": "Hire Doctor",
        "hire-nurse": "Hire Nurse",
        "hire-handyman": "Hire Handyman",
        "hire-receptionist": "Hire Receptionist",
        admit: formatGameplayActionButtonLabel("admit"),
        treat: formatGameplayActionButtonLabel("treat"),
        "staff-break-toggle": "Staff Break",
        "treatment-room-toggle": "Treatment Room",
        "open-jukebox": "Jukebox",
        "open-furnish-corridor": "Furnish Corridor",
        "open-edit-room": "Edit Room",
        "open-first-message": "Messages",
        "open-casebook": "Casebook",
        "open-map": "Map",
        "open-staff": "Staff",
        "open-research": "Research Panel",
        "open-policy": "Policy",
        "open-machine-menu": "Machine Menu",
        "take-loan": "Take Loan",
        "repay-loan": "Repay Loan",
        "start-research": "Research",
        "run-finance-audit": "Audit",
        "run-marketing-campaign": "Marketing",
        "start-insurance-contract": "Insurance",
        "run-awards-ceremony": "Awards",
        "start-emergency-wave": "Emergency",
        "start-epidemic-outbreak": "Epidemic",
        "start-vip-inspection": "VIP",
        "save-game": "Save",
        "load-game": "Load",
        "refresh-save-slots": "Refresh Saves",
        "delete-save-slot": "Delete Save",
        "restart-level": formatGameplayActionButtonLabel("restart-level"),
        "quit-level": "Quit Level",
        "next-level": formatGameplayActionButtonLabel("next-level"),
        "hospital-camera-west": formatCameraDirectionButtonLabel("west", true),
        "hospital-camera-east": formatCameraDirectionButtonLabel("east", true),
        "hospital-camera-north": formatCameraDirectionButtonLabel("north", true),
        "hospital-camera-south": formatCameraDirectionButtonLabel("south", true)
    };
    return labels[control] ?? "";
}
export function formatMenuBarShownActionStatus() {
    return "Action: menu bar shown";
}
export function formatMenuButtonLabel(menu) {
    const labels = {
        file: "File",
        options: "Options",
        help: "Help"
    };
    return labels[menu] ?? "";
}
export function formatPlacementRotatedActionStatus(orientation) {
    return `Action: placement rotated ${orientation}`;
}
export function formatQuitLevelActionStatus(action) {
    return `Action: quit level ${action}`;
}
export function formatQuitLevelPromptLabel() {
    return "Quit level and return to the browser main menu?";
}
export function formatQuitLevelButtonLabel(action) {
    if (action === "confirm") {
        return "Quit Level";
    }
    return "Stay";
}
export function formatSaveSlotsStatus(slotCount) {
    return slotCount > 0 ? `Save: ${slotCount} slot${slotCount === 1 ? "" : "s"}` : "Save: no slots";
}
export function formatSaveLifecycleStatus(status) {
    return `Save: ${status}`;
}
export function formatSaveActionButtonLabel(action) {
    if (action === "load") {
        return "Load";
    }
    if (action === "refresh-slots") {
        return "Refresh Slots";
    }
    if (action === "delete-slot") {
        return "Delete Slot";
    }
    return "Save";
}
export function formatSaveSlotOptionsHtml(slots, activeSlot) {
    const values = new Set(slots.map((slot) => slot.slot));
    values.add(activeSlot);
    return Array.from(values)
        .sort((left, right) => left.localeCompare(right))
        .map((slot) => `<option value="${escapeHtml(slot)}">${escapeHtml(slot)}</option>`)
        .join("");
}
export function formatNoImportedMapOptionLabel() {
    return "No imported map";
}
export function formatHospitalMapOptionsHtml(hospitalView) {
    if (!hospitalView) {
        return `<option value="">${formatNoImportedMapOptionLabel()}</option>`;
    }
    return hospitalView.mapSummaries
        .map((summary) => `<option value="${escapeHtml(summary.path)}">${escapeHtml(summary.path)}</option>`)
        .join("");
}
export function formatMapPanelCurrentStatus(mapPath) {
    return mapPath ? `Map: ${mapPath}` : "Map: unavailable";
}
export function formatMapPanelLandStatus(landCostPerTile) {
    return landCostPerTile == null ? "Land: unavailable" : `Land: ${landCostPerTile}/tile`;
}
export function formatMapPanelDetailsStatus(mapSummary) {
    return mapSummary
        ? `Map details: ${mapSummary.width}x${mapSummary.height}, parcels ${mapSummary.parcelCount}, buildable ${mapSummary.buildableTileCount}, objects ${mapSummary.objectCount}`
        : "Map details: unavailable";
}
export function formatSaveFailureStatus(action, message) {
    return `${action} failed: ${message}`;
}
export function formatSaveTickStatus(tick, slot) {
    return `Save: tick ${tick} (${slot})`;
}
export function formatLoadResultStatus(status, tick, slot) {
    return status === "exact" ? `Save: loaded tick ${tick} (${slot})` : `Save: ${status}`;
}
export function formatMissingMapLoadStatus(mapPath) {
    return `Load failed: missing map ${mapPath}`;
}
export function formatDeletedSaveSlotStatus(slot) {
    return `Save: deleted ${slot}`;
}
export function formatNewMapStatus(mapPath) {
    return `Save: new map ${mapPath}`;
}
export function formatRestartedLevelStatus(mapPath) {
    return `Save: restarted ${mapPath}`;
}
export function formatRestartLevelUnavailableStatus() {
    return "Save: restart unavailable";
}
export function formatNextLevelStatus(mapPath) {
    return `Save: next level ${mapPath}`;
}
export function formatNextLevelUnavailableStatus() {
    return "Save: next level unavailable";
}
export function formatCampaignCompleteStatus() {
    return "Save: campaign complete";
}
function titleCase(value) {
    return `${value.slice(0, 1).toUpperCase()}${value.slice(1)}`;
}
function sameTile(left, right) {
    return left.x === right.x && left.y === right.y;
}
function roomContainsTile(room, tile) {
    return (room.tiles ?? [room.position]).some((roomTile) => sameTile(roomTile, tile));
}
function patientPosition(patient) {
    return patientRenderPosition(patient);
}
function findSelectableEntityAtTile(state, tile) {
    const patient = state.entities.waitingPatients.find((candidate) => sameTile(patientPosition(candidate), tile));
    if (patient) {
        return { type: "patient", id: patient.id };
    }
    const staff = state.entities.staff.find((candidate) => sameTile(candidate.position, tile));
    if (staff) {
        return { type: "staff", id: staff.id };
    }
    const object = [...(state.entities.objects ?? [])].reverse().find((candidate) => sameTile(candidate.position, tile));
    if (object) {
        return { type: "object", id: object.id };
    }
    const rooms = [...state.entities.rooms].reverse();
    const room = rooms.find((candidate) => roomContainsTile(candidate, tile));
    if (room) {
        return { type: "room", id: room.id };
    }
    return null;
}
function selectedEntityFromState(state, selectedEntity) {
    if (!selectedEntity) {
        return null;
    }
    if (selectedEntity.type === "staff") {
        const staff = state.entities.staff.find((candidate) => candidate.id === selectedEntity.id);
        return staff ? { type: "staff", value: staff } : null;
    }
    if (selectedEntity.type === "room") {
        const room = state.entities.rooms.find((candidate) => candidate.id === selectedEntity.id);
        return room ? { type: "room", value: room } : null;
    }
    if (selectedEntity.type === "object") {
        const object = state.entities.objects?.find((candidate) => candidate.id === selectedEntity.id);
        return object ? { type: "object", value: object } : null;
    }
    const patient = state.entities.waitingPatients.find((candidate) => candidate.id === selectedEntity.id);
    return patient ? { type: "patient", value: patient } : null;
}
function formatSelectionStatus(state, selectedEntity) {
    return formatSelectionStatusWithLanguage(state, selectedEntity);
}
export function formatSelectionStatusWithLanguage(state, selectedEntity, languageSummary = null) {
    const resolved = selectedEntityFromState(state, selectedEntity);
    if (!resolved) {
        return formatNoSelectionStatus();
    }
    if (resolved.type === "staff") {
        const training = resolved.value.trainingRemainingTicks > 0 ? `, training ${resolved.value.trainingRemainingTicks}` : "";
        return `Selection: ${staffRoleDisplayName(resolved.value.role, languageSummary)} #${resolved.value.id} (${resolved.value.status}, skill ${resolved.value.skillLevel}${training})`;
    }
    if (resolved.type === "room") {
        const assignedPatients = state.entities.waitingPatients
            .filter((patient) => patient.assignedRoomId === resolved.value.id)
            .map((patient) => `#${patient.id}`)
            .join("/");
        const patientDetail = assignedPatients ? `, patients ${assignedPatients}` : "";
        return `Selection: ${roomTypeDisplayName(resolved.value.roomType, languageSummary)} room #${resolved.value.id} (${resolved.value.status}, wear ${resolved.value.wear}, maintenance ${resolved.value.maintenanceRemainingTicks}${patientDetail})`;
    }
    if (resolved.type === "object") {
        const strength = Number.isInteger(resolved.value.strength) ? `, strength ${resolved.value.strength}` : "";
        return `Selection: ${resolved.value.name ?? `object ${resolved.value.objectIndex}`} #${resolved.value.id} (tile ${resolved.value.position.x},${resolved.value.position.y}, facing ${resolved.value.orientation ?? "north"}, value ${resolved.value.cost}${strength})`;
    }
    const disease = resolved.value.diagnosisKnown ? patientDiseaseDisplayName(resolved.value, languageSummary) : "unknown disease";
    const status = patientStatusDisplayName(resolved.value, languageSummary);
    const treatmentNeed = resolved.value.diagnosisKnown && resolved.value.preferredTreatmentRoomType
        ? `, needs ${roomTypeDisplayName(resolved.value.preferredTreatmentRoomType, languageSummary)}`
        : "";
    const assignment = resolved.value.assignedRoomId !== null && resolved.value.assignedRoomId !== undefined
        ? `, room #${resolved.value.assignedRoomId}`
        : "";
    const conditions = patientConditionLabels(resolved.value);
    const conditionDetail = conditions.length > 0 ? `, ${conditions.join(", ")}` : "";
    const prefix = Number.isInteger(resolved.value.emergencyWaveId)
        ? "emergency "
        : Number.isInteger(resolved.value.epidemicOutbreakId)
            ? "epidemic "
            : Number.isInteger(resolved.value.insuranceContractId)
                ? "insurance "
                : "";
    return `Selection: ${prefix}patient #${resolved.value.id} (${status}, ${disease}${treatmentNeed}${assignment}${conditionDetail}, health ${resolved.value.health}/${resolved.value.maxHealth})`;
}
export function formatNoSelectionStatus() {
    return "Selection: none";
}
function firstEditableRoomEntityFromState(state) {
    const room = Array.isArray(state?.entities?.rooms)
        ? [...state.entities.rooms].sort((left, right) => left.id - right.id)[0]
        : null;
    return room ? { type: "room", id: room.id } : null;
}
export function formatEditRoomPanelSummary(state, selectedEntity, languageSummary = null) {
    const resolved = selectedEntityFromState(state, selectedEntity);
    if (resolved?.type !== "room") {
        const roomCount = Array.isArray(state?.entities?.rooms) ? state.entities.rooms.length : 0;
        return roomCount > 0
            ? `Edit room: ${roomCount} room${roomCount === 1 ? "" : "s"} available, none selected`
            : "Edit room: no rooms built";
    }
    const room = resolved.value;
    const name = roomTypeDisplayName(room.roomType, languageSummary);
    const size = room.footprint ? `, ${room.footprint.width}x${room.footprint.height}` : "";
    return `Edit room: ${name} room #${room.id} (${room.status}, wear ${room.wear}, maintenance ${room.maintenanceRemainingTicks}${size})`;
}
function formatCasebook(state) {
    return formatCasebookWithLanguage(state);
}
export function formatCasebookPanelEmptyStatus() {
    return "Casebook: no active patients";
}
export function formatCasebookPanelActionLabel(action) {
    if (action === "prioritize") {
        return "Prioritize";
    }
    if (action === "send-home") {
        return "Send Home";
    }
    return "Select";
}
export function formatCasebookPanelHeaderLabel(column) {
    const labels = {
        patient: "Patient",
        status: "Status",
        disease: "Disease",
        need: "Need",
        room: "Room",
        flags: "Flags",
        health: "Health",
        action: "Action"
    };
    return labels[column] ?? "";
}
export function formatCasebookWithLanguage(state, languageSummary = null) {
    const patients = state.entities.waitingPatients;
    if (patients.length === 0) {
        return formatCasebookPanelEmptyStatus();
    }
    return `Casebook: ${patients.slice(0, 4).map((patient) => {
        const disease = patient.diagnosisKnown ? patientDiseaseDisplayName(patient, languageSummary) : "unknown disease";
        const status = patientStatusDisplayName(patient, languageSummary);
        const treatmentNeed = patient.diagnosisKnown && patient.preferredTreatmentRoomType
            ? `>${roomTypeDisplayName(patient.preferredTreatmentRoomType, languageSummary)}`
            : "";
        const conditions = patientConditionLabels(patient);
        const conditionDetail = conditions.length > 0 ? ` ${conditions.join("/")}` : "";
        const prefix = Number.isInteger(patient.emergencyWaveId)
            ? "E"
            : Number.isInteger(patient.epidemicOutbreakId)
                ? "P"
                : Number.isInteger(patient.insuranceContractId)
                    ? "I"
                    : "#";
        return `${prefix}${patient.id} ${status} ${disease}${treatmentNeed}${conditionDetail} H${patient.health}/${patient.maxHealth}`;
    }).join("; ")}`;
}
export function formatCasebookRowsHtml(state, languageSummary = null) {
    const patients = state.entities.waitingPatients;
    if (patients.length === 0) {
        return `<p data-testid="casebook-panel-empty" style="margin:0 0 8px; font-size:13px;">${formatCasebookPanelEmptyStatus()}</p>`;
    }
    const rows = patients.map((patient) => {
        const disease = patient.diagnosisKnown ? patientDiseaseDisplayName(patient, languageSummary) : "unknown disease";
        const status = patientStatusDisplayName(patient, languageSummary);
        const need = patient.diagnosisKnown && patient.preferredTreatmentRoomType
            ? roomTypeDisplayName(patient.preferredTreatmentRoomType, languageSummary)
            : "";
        const assignment = patient.assignedRoomId !== null && patient.assignedRoomId !== undefined ? `#${patient.assignedRoomId}` : "";
        const conditions = patientConditionLabels(patient).join(", ");
        return `
          <tr data-testid="casebook-panel-row" data-patient-id="${patient.id}">
            <td style="padding:2px 4px;">#${patient.id}</td>
            <td style="padding:2px 4px;">${escapeHtml(status)}</td>
            <td style="padding:2px 4px;">${escapeHtml(disease)}</td>
            <td style="padding:2px 4px;">${escapeHtml(need)}</td>
            <td style="padding:2px 4px;">${escapeHtml(assignment)}</td>
            <td style="padding:2px 4px;">${escapeHtml(conditions)}</td>
            <td style="padding:2px 4px; text-align:right;">${patient.health}/${patient.maxHealth}</td>
            <td style="padding:2px 4px;">
              <button type="button" data-testid="casebook-panel-select" data-casebook-action="select" data-patient-id="${patient.id}">${formatCasebookPanelActionLabel("select")}</button>
              <button type="button" data-testid="casebook-panel-prioritize" data-casebook-action="prioritize" data-patient-id="${patient.id}"${canPrioritizePatient(patient) ? "" : " disabled"}>${formatCasebookPanelActionLabel("prioritize")}</button>
              <button type="button" data-testid="casebook-panel-send-home" data-casebook-action="send-home" data-patient-id="${patient.id}">${formatCasebookPanelActionLabel("send-home")}</button>
            </td>
          </tr>`;
    }).join("");
    return `
        <table data-testid="casebook-panel-table" style="width:100%; border-collapse:collapse; margin:0 0 8px; font-size:13px;">
          <thead>
            <tr>
              <th style="padding:2px 4px; text-align:left;">${formatCasebookPanelHeaderLabel("patient")}</th>
              <th style="padding:2px 4px; text-align:left;">${formatCasebookPanelHeaderLabel("status")}</th>
              <th style="padding:2px 4px; text-align:left;">${formatCasebookPanelHeaderLabel("disease")}</th>
              <th style="padding:2px 4px; text-align:left;">${formatCasebookPanelHeaderLabel("need")}</th>
              <th style="padding:2px 4px; text-align:left;">${formatCasebookPanelHeaderLabel("room")}</th>
              <th style="padding:2px 4px; text-align:left;">${formatCasebookPanelHeaderLabel("flags")}</th>
              <th style="padding:2px 4px; text-align:right;">${formatCasebookPanelHeaderLabel("health")}</th>
              <th style="padding:2px 4px; text-align:left;">${formatCasebookPanelHeaderLabel("action")}</th>
            </tr>
          </thead>
          <tbody>${rows}
          </tbody>
        </table>`;
}
function patientDiseaseDisplayName(patient, languageSummary) {
    const importedName = languageSummary?.diseaseNames?.[patient.diseaseId];
    return typeof importedName === "string" && importedName.length > 0 ? importedName : patient.diseaseName;
}
export function patientConditionLabels(patient) {
    const labels = [];
    if (patient?.vomited === true) {
        labels.push("vomited");
    }
    if (patient?.droppedLitter === true) {
        labels.push("litter");
    }
    if (patient?.bowelOverflowed === true) {
        labels.push("bowel overflow");
    }
    else if (patient?.needsToilet === true) {
        labels.push("needs toilet");
    }
    if (patient?.drank === true) {
        labels.push("drank");
    }
    if (patient?.usedToilet === true) {
        labels.push("used toilet");
    }
    return labels;
}
function staffRoleDisplayName(role, languageSummary) {
    if (role === "diagnostician") {
        return languageSummary?.staffRoles?.doctor ?? "Diagnostician";
    }
    const importedName = languageSummary?.staffRoles?.[role];
    return typeof importedName === "string" && importedName.length > 0 ? importedName : titleCase(role);
}
function roomTypeDisplayName(roomType, languageSummary) {
    const importedName = languageSummary?.roomNames?.[roomType];
    return typeof importedName === "string" && importedName.length > 0 ? importedName : titleCase(roomType);
}
export function formatBuildRoomButtonLabel(roomType, telemetry = null, languageSummary = null) {
    const name = roomTypeDisplayName(roomType, languageSummary);
    const cost = telemetry?.scenarioRoomCostOverrides?.[roomType] ?? roomBuildCost(roomType);
    return `Build ${name} (${cost})`;
}
export function formatHireStaffButtonLabel(role, telemetry = null, languageSummary = null) {
    const name = staffRoleDisplayName(role, languageSummary);
    const hireCost = staffHireCost(role);
    const wage = telemetry?.scenarioStaffWageOverrides?.[role] ?? staffWageCostPerTick(role);
    return `Hire ${name} (${hireCost}, wage ${wage})`;
}
export function formatFinanceActionButtonLabel(action) {
    if (action === "repay-loan") {
        return "Repay Loan";
    }
    if (action === "run-audit") {
        return "Run Audit";
    }
    return "Take Loan";
}
export function formatSelectedPatientActionButtonLabel(action) {
    if (action === "send-home") {
        return "Send Home";
    }
    if (action === "give-drink") {
        return "Give Drink";
    }
    if (action === "send-toilet") {
        return "Toilet";
    }
    return "Prioritize";
}
export function formatCareActionButtonLabel(action) {
    if (action === "water-plant") {
        return "Water Plant";
    }
    return "Shoot Rat";
}
export function formatSelectedStaffRoomActionButtonLabel(action) {
    const labels = {
        "move-staff": "Move Staff",
        "rest-staff": "Rest Staff",
        "train-staff": "Train Staff",
        "fire-staff": "Fire Staff",
        "sell-room": "Sell Room",
        "sell-object": "Sell Object",
        "repair-room": "Repair Room"
    };
    return labels[action] ?? "";
}
export function formatCampaignActionButtonLabel(action) {
    const labels = {
        research: "Fund Research",
        emergency: "Emergency",
        epidemic: "Epidemic",
        vip: "VIP Visit",
        marketing: "Run Marketing",
        insurance: "Insurance",
        awards: "Awards"
    };
    return labels[action] ?? "";
}
export function canBuildRoomFromTelemetry(roomType, telemetry = null) {
    if (!telemetry) {
        return true;
    }
    const cost = telemetry.scenarioRoomCostOverrides?.[roomType] ?? roomBuildCost(roomType);
    return telemetry.cash >= cost;
}
function staffMarketRemainingForTelemetryRole(role, telemetry) {
    if (!telemetry) {
        return Number.POSITIVE_INFINITY;
    }
    if (role === "diagnostician") {
        return telemetry.staffMarketDoctorsAvailable;
    }
    if (role === "nurse") {
        return telemetry.staffMarketNursesAvailable;
    }
    if (role === "handyman") {
        return telemetry.staffMarketHandymenAvailable;
    }
    if (role === "receptionist") {
        return telemetry.staffMarketReceptionistsAvailable;
    }
    return Number.POSITIVE_INFINITY;
}
export function canHireStaffFromTelemetry(role, telemetry = null) {
    if (!telemetry) {
        return true;
    }
    return telemetry.cash >= staffHireCost(role) && staffMarketRemainingForTelemetryRole(role, telemetry) > 0;
}
export function canTakeLoanFromTelemetry(telemetry = null) {
    return Boolean(telemetry && telemetry.outstandingLoan < telemetry.loanMaxOutstanding);
}
export function canRepayLoanFromTelemetry(telemetry = null) {
    if (!telemetry) {
        return false;
    }
    return telemetry.outstandingLoan > 0 && telemetry.cash >= Math.min(telemetry.loanChunkAmount, telemetry.outstandingLoan);
}
export function canRunFinanceAuditFromTelemetry(telemetry = null) {
    return Boolean(telemetry && telemetry.financeLedgerUnlocked && telemetry.financeAuditReady);
}
export function canRunMarketingCampaignFromTelemetry(telemetry = null) {
    return Boolean(telemetry && telemetry.cash >= telemetry.marketingCampaignCost && telemetry.reputation < 1000);
}
export function canStartInsuranceContractFromTelemetry(telemetry = null) {
    return Boolean(telemetry && telemetry.insuranceContractUnlocked && !telemetry.insuranceContractActive);
}
export function canStartResearchFromTelemetry(telemetry = null) {
    return Boolean(telemetry &&
        !telemetry.treatmentResearchActive &&
        telemetry.treatmentResearchLevel < telemetry.treatmentResearchMaxLevel &&
        telemetry.cash >= telemetry.treatmentResearchProjectCost);
}
export function canRepairRoomFromTelemetry(room, telemetry = null) {
    if (!room || !telemetry) {
        return false;
    }
    const needsRepair = room.wear > 0 || room.maintenanceRemainingTicks > 0;
    return needsRepair && telemetry.cash >= roomRepairCost(room.roomType);
}
export function canRestStaffFromTelemetry(staff = null) {
    return Boolean(staff && staff.status === "on-break" && staff.trainingRemainingTicks === 0 && staff.stress > 0);
}
export function canTrainStaffFromTelemetry(staff = null, telemetry = null) {
    if (!staff || !telemetry) {
        return false;
    }
    return staff.trainingRemainingTicks === 0 &&
        staff.skillLevel < telemetry.maxStaffSkillLevel &&
        telemetry.cash >= telemetry.staffTrainingCost;
}
export function canFireStaff(staff = null) {
    return Boolean(staff);
}
export function canSellRoom(room = null) {
    return Boolean(room);
}
function defaultStaffBreakTargetFromState(state = null) {
    if (!Array.isArray(state?.entities?.staff)) {
        return null;
    }
    return state.entities.staff
        .filter((staff) => staff.role === "diagnostician")
        .sort((left, right) => left.id - right.id)[0] ?? null;
}
function defaultTreatmentRoomToggleTargetFromState(state = null) {
    if (!Array.isArray(state?.entities?.rooms)) {
        return null;
    }
    return state.entities.rooms
        .filter((room) => room.roomType === "treatment")
        .sort((left, right) => left.id - right.id)[0] ?? null;
}
export function canToggleStaffBreakFromState(state = null, selectedStaff = null) {
    return Boolean(selectedStaff ?? defaultStaffBreakTargetFromState(state));
}
export function canToggleTreatmentRoomFromState(state = null, selectedRoom = null) {
    return Boolean(selectedRoom ?? defaultTreatmentRoomToggleTargetFromState(state));
}
export function canPrioritizePatient(patient = null) {
    return Boolean(patient && (patient.status === "queued" || patient.status === "awaiting-treatment"));
}
export function canStartEmergencyFromTelemetry(telemetry = null) {
    if (!telemetry || telemetry.emergencyActive) {
        return false;
    }
    if ((telemetry.scenarioEmergencyScheduleSize ?? 0) === 0) {
        return true;
    }
    return telemetry.scenarioEmergencyActiveIndex !== null && telemetry.scenarioEmergencyActiveIndex !== undefined;
}
export function canRunAwardsFromTelemetry(telemetry = null) {
    return telemetry?.scenarioAwardCriteriaMet !== false;
}
export function canStartEpidemicFromTelemetry(telemetry = null) {
    return Boolean(telemetry && !telemetry.epidemicActive);
}
export function canStartVipInspectionFromTelemetry(telemetry = null) {
    return Boolean(telemetry && !telemetry.vipInspectionActive);
}
export function canGiveDrinkToPatient(patient = null, telemetry = null) {
    const drinkHappy = telemetry?.scenarioPatientDrinkHappy;
    return Boolean(patient &&
        patient.drank !== true &&
        Number.isInteger(drinkHappy) &&
        drinkHappy > 0 &&
        Number.isInteger(patient.health) &&
        Number.isInteger(patient.maxHealth) &&
        patient.health > 0 &&
        patient.health < patient.maxHealth);
}
export function canSendPatientToilet(patient = null, telemetry = null) {
    const toiletHappy = telemetry?.scenarioPatientToiletHappy;
    return Boolean(patient &&
        patient.usedToilet !== true &&
        Number.isInteger(patient.health) &&
        patient.health > 0 &&
        (patient.needsToilet === true || Number.isInteger(toiletHappy)));
}
export function formatMaintenanceStaffStatus(telemetry, languageSummary = null) {
    const base = `Handymen: ${telemetry.activeHandymen}/${telemetry.totalHandymen}, repairs ${telemetry.maintenanceStaffRepairEvents}, bonus ${telemetry.maintenanceStaffRepairBonusTicks} ticks`;
    const thresholds = telemetry.scenarioRoomWearThresholdOverrides ?? {};
    const thresholdEntries = Object.entries(thresholds);
    if (thresholdEntries.length === 0 && telemetry.scenarioRoomWearResearchMaxStrength === null) {
        return base;
    }
    const thresholdText = thresholdEntries.length > 0
        ? thresholdEntries
            .sort(([left], [right]) => left.localeCompare(right))
            .map(([roomType, value]) => `${roomTypeDisplayName(roomType, languageSummary)} ${value}`)
            .join(", ")
        : "none";
    return `${base}; scenario wear ${thresholdText}, max ${telemetry.scenarioRoomWearResearchMaxStrength ?? "default"}`;
}
export function formatStaffTrainingStatus(telemetry) {
    const base = `Training: ${telemetry.trainingStaff} active, ${telemetry.staffTrainingStarted} started, ${telemetry.staffTrainingCompleted} complete`;
    const hasScenarioTrainingDetails = telemetry.scenarioTrainingRate !== null ||
        telemetry.scenarioTrainingValueCount > 0 ||
        telemetry.scenarioTrainingAbilityThresholdCount > 0 ||
        telemetry.scenarioPromotionDoctorMonths !== null ||
        telemetry.scenarioPromotionConsultantMonths !== null ||
        telemetry.scenarioDoctorThreshold !== null ||
        telemetry.scenarioConsultantThreshold !== null;
    if (!hasScenarioTrainingDetails) {
        return base;
    }
    const abilityThresholds = telemetry.scenarioTrainingAbilityThresholds
        ? ` (${telemetry.scenarioTrainingAbilityThresholds})`
        : "";
    return `${base}; scenario rate ${telemetry.scenarioTrainingRate ?? "default"}, values ${telemetry.scenarioTrainingValueCount}, abilities ${telemetry.scenarioTrainingAbilityThresholdCount}${abilityThresholds}, promo ${telemetry.scenarioPromotionDoctorMonths ?? "default"}/${telemetry.scenarioPromotionConsultantMonths ?? "default"}, thresholds ${telemetry.scenarioDoctorThreshold ?? "default"}/${telemetry.scenarioConsultantThreshold ?? "default"}`;
}
export function formatStaffSkillStatus(telemetry) {
    const staffCapacity = telemetry.maxStaffSkillLevel * Math.max(1, telemetry.activeStaff + telemetry.onBreakStaff);
    return `Staff skill: ${telemetry.totalStaffSkillLevel}/${staffCapacity}, trained ${telemetry.trainedStaff}, next ${telemetry.staffTrainingCost}/${telemetry.staffTrainingTicks} ticks`;
}
export function formatResearchStatus(telemetry) {
    const active = telemetry.treatmentResearchActive ? ` (${telemetry.treatmentResearchRemainingTicks} ticks)` : "";
    return `Research: treatment ${telemetry.treatmentResearchLevel}/${telemetry.treatmentResearchMaxLevel}${active}, invested ${telemetry.treatmentResearchTotalInvestment}`;
}
export function formatCumulativeCashflowStatus(telemetry) {
    return `Cumulative cashflow: ${telemetry.cumulativeIncome} - ${telemetry.cumulativeExpenses} = ${telemetry.cumulativeNetCashflow}`;
}
export function formatTickCashflowStatus(telemetry) {
    const polarity = telemetry.tickNetCashflow > 0
        ? "positive"
        : telemetry.tickNetCashflow < 0
            ? "negative"
            : "balanced";
    return `Tick cashflow: ${telemetry.tickIncome} - ${telemetry.tickExpenses} = ${telemetry.tickNetCashflow} (${polarity})`;
}
export function formatMilestoneStatus(telemetry) {
    return `Milestones: ${telemetry.milestoneLevel}${telemetry.nextMilestone ? `, next ${telemetry.nextMilestone} in ${telemetry.remainingDischargesToNextMilestone} discharges` : ", complete"}`;
}
export function formatUnlockStatus(telemetry) {
    const unlockedIds = telemetry.unlockedSystemIds ? ` (${telemetry.unlockedSystemIds})` : "";
    const nextUnlock = telemetry.nextMilestone
        ? `, next unlock in ${telemetry.remainingDischargesToNextMilestone} discharges`
        : ", all milestones complete";
    return `Unlocks: ${telemetry.unlockedSystems}${unlockedIds}, income +${telemetry.recurringIncomeBonus ?? 0}${nextUnlock}`;
}
export function formatEmergencyStatus(telemetry, languageSummary = null) {
    const waitingForScenarioEmergency = !telemetry.emergencyActive &&
        telemetry.scenarioEmergencyScheduleSize > 0 &&
        telemetry.scenarioEmergencyActiveIndex === null &&
        telemetry.scenarioNextEmergencyIndex !== null;
    const nextEmergencyDisease = formatScenarioEmergencyDisease(telemetry.scenarioNextEmergencyDiseaseId, telemetry.scenarioNextEmergencyIllnessCode, languageSummary);
    const readyEmergencyDisease = formatScenarioEmergencyDisease(telemetry.scenarioEmergencyActiveDiseaseId || telemetry.emergencyDiseaseId, telemetry.scenarioEmergencyActiveIllnessCode, languageSummary);
    const activeEmergencyDisease = formatScenarioEmergencyDisease(telemetry.emergencyDiseaseId, null, languageSummary);
    const base = waitingForScenarioEmergency
        ? `Emergency: scheduled next ${telemetry.scenarioNextEmergencyIndex} months ${telemetry.scenarioNextEmergencyStartMonth}-${telemetry.scenarioNextEmergencyEndMonth} (${telemetry.scenarioNextEmergencyMinPatients}-${telemetry.scenarioNextEmergencyMaxPatients} patients, need ${telemetry.scenarioNextEmergencyPercentToWin}%${nextEmergencyDisease})`
        : telemetry.emergencyActive
        ? `Emergency: wave ${telemetry.emergencyWaveId} ${telemetry.emergencyTreatedPatients}/${telemetry.emergencyTotalPatients} saved, need ${telemetry.emergencyRequiredTreatedPatients} (${telemetry.emergencyRemainingTicks} ticks${activeEmergencyDisease})`
        : `Emergency: ready (${telemetry.emergencyPatientCount} patients/${telemetry.emergencyDurationTicks} ticks, need ${telemetry.emergencyRequiredTreatedPatients} / ${telemetry.emergencyPercentToWin}%${readyEmergencyDisease})`;
    const scenarioParts = [];
    if (telemetry.scenarioEmergencyScheduleSize > 0) {
        scenarioParts.push(`scheduled ${telemetry.scenarioEmergencyScheduleSize}`);
        scenarioParts.push(`active ${telemetry.scenarioEmergencyActiveIndex ?? "none"}`);
    }
    if (telemetry.scenarioDisasterLaunch !== null) {
        scenarioParts.push(`disaster ${telemetry.scenarioDisasterLaunch} ticks`);
    }
    return scenarioParts.length > 0
        ? `${base}; scenario ${scenarioParts.join(", ")}`
        : base;
}
function formatScenarioEmergencyDisease(diseaseId, illnessCode, languageSummary) {
    const diseaseName = diseaseId
        ? languageSummary?.diseaseNames?.[diseaseId]
        : null;
    if (typeof diseaseName === "string" && diseaseName.length > 0) {
        return `, ${diseaseName}`;
    }
    if (diseaseId) {
        return `, ${diseaseId}`;
    }
    if (Number.isInteger(illnessCode)) {
        return `, illness ${illnessCode}`;
    }
    return "";
}
export function formatEmergencyRewardStatus(telemetry) {
    const activeFailures = telemetry.emergencyActive && telemetry.emergencyFailedPatients > 0
        ? `, failed patients ${telemetry.emergencyFailedPatients}`
        : "";
    return `Emergency reward: ${telemetry.emergencyRewardCash} cash, +${telemetry.emergencyRewardReputation} reputation, won ${telemetry.emergencySuccessfulWaves}/${telemetry.emergencyWavesStarted}, failed ${telemetry.emergencyFailedWaves}, saved ${telemetry.emergencySuccessPercent ?? 100}%${activeFailures}`;
}
export function formatScenarioExpertiseStatus(telemetry, languageSummary = null) {
    const base = `Scenario expertise: ${telemetry.scenarioKnownExpertiseCount}/${telemetry.scenarioExpertiseCount} known, ${telemetry.scenarioResearchRequiredExpertiseCount} research-required`;
    const details = telemetry.scenarioDiagnosisCapability === null || telemetry.scenarioDiagnosableExpertiseCount === null
        ? base
        : `${base}, diagnosable ${telemetry.scenarioDiagnosableExpertiseCount}, capability ${telemetry.scenarioDiagnosisCapability}`;
    return telemetry.scenarioNextResearchRequired === null || telemetry.scenarioNextResearchRequired === undefined
        ? details
        : `${details}, next research ${telemetry.scenarioNextResearchRequired}${formatScenarioNextResearchTarget(telemetry, languageSummary)}`;
}
function formatScenarioNextResearchTarget(telemetry, languageSummary) {
    const diseaseName = telemetry.scenarioNextResearchDiseaseId
        ? languageSummary?.diseaseNames?.[telemetry.scenarioNextResearchDiseaseId]
        : null;
    if (typeof diseaseName === "string" && diseaseName.length > 0) {
        return ` ${diseaseName}`;
    }
    if (telemetry.scenarioNextResearchToken) {
        return ` ${telemetry.scenarioNextResearchToken.replace(/^I_/u, "").replace(/_/gu, " ")}`;
    }
    if (telemetry.scenarioNextResearchCategory) {
        return ` ${telemetry.scenarioNextResearchCategory}`;
    }
    return "";
}
export function formatScenarioOpponentsStatus(telemetry) {
    const names = telemetry.scenarioOpponentNames ? ` (${telemetry.scenarioOpponentNames})` : "";
    return `Scenario opponents: ${telemetry.scenarioActiveOpponentCount}/${telemetry.scenarioOpponentCount} active${names}`;
}
export function formatScenarioOpponentProgressStatus(telemetry) {
    if (!telemetry.scenarioOpponentLeaderName) {
        return "Rival leader: none";
    }
    const objectiveLeader = telemetry.scenarioOpponentObjectiveLeaderName
        ? `; objective rival ${telemetry.scenarioOpponentObjectiveLeaderName}`
        : "";
    const standings = Array.isArray(telemetry.scenarioOpponentStandings) && telemetry.scenarioOpponentStandings.length > 0
        ? `; standings ${telemetry.scenarioOpponentStandings.slice(0, 3).map((entry) => `${entry.name} ${entry.cures}/${entry.value}/${entry.reputation}`).join(", ")}`
        : "";
    return `Rival leader: ${telemetry.scenarioOpponentLeaderName}, ${telemetry.scenarioOpponentLeaderCures} cures, value ${telemetry.scenarioOpponentLeaderValue}, reputation ${telemetry.scenarioOpponentLeaderReputation}${objectiveLeader}${standings}`;
}
export function formatScenarioNetworkCriteriaStatus(telemetry) {
    if ((telemetry.scenarioNetworkCriteriaCount ?? 0) <= 0) {
        return "Network criteria: none";
    }
    const statusCounts = telemetry.scenarioNetworkCriteriaMetCount !== undefined
        ? `; met ${telemetry.scenarioNetworkCriteriaMetCount}, active ${telemetry.scenarioNetworkCriteriaActiveCount ?? 0}, missed ${telemetry.scenarioNetworkCriteriaMissedCount ?? 0}`
        : "";
    const statusDetails = formatScenarioNetworkCriteriaStatusDetails(telemetry.scenarioNetworkCriteriaStatuses);
    return `Network criteria: ${telemetry.scenarioNetworkCriteriaCount} (${telemetry.scenarioNetworkCriteriaSummary})${statusCounts}${statusDetails}`;
}
function formatScenarioNetworkCriteriaStatusDetails(statuses) {
    if (!Array.isArray(statuses) || statuses.length === 0) {
        return "";
    }
    return `; ${statuses.map((criterion) => `${criterion.metric} ${criterion.currentValue}/${criterion.value} ${criterion.status} by month ${criterion.deadlineMonth}`).join("; ")}`;
}
export function formatQuakeStatus(telemetry) {
    if ((telemetry.scenarioQuakeScheduleSize ?? 0) <= 0) {
        return "Quake: none";
    }
    const next = telemetry.scenarioQuakeActiveIndex === null && telemetry.scenarioNextQuakeIndex !== null
        ? `, next ${telemetry.scenarioNextQuakeIndex} months ${telemetry.scenarioNextQuakeStartMonth}-${telemetry.scenarioNextQuakeEndMonth} severity ${telemetry.scenarioNextQuakeSeverity}`
        : "";
    return `Quake: scheduled ${telemetry.scenarioQuakeScheduleSize}, active ${telemetry.scenarioQuakeActiveIndex ?? "none"}, severity ${telemetry.scenarioQuakeSeverity}, triggered ${telemetry.scenarioQuakesTriggered}${next}`;
}
export function formatEpidemicTermsStatus(telemetry) {
    const base = `Epidemic terms: spread ${telemetry.epidemicSpreadIntervalTicks} ticks/${telemetry.epidemicMaxSpreadPatients} max, vacc ${telemetry.epidemicVaccinationCost}/${telemetry.epidemicTotalVaccinationCosts}, reward ${telemetry.epidemicRewardCash}/+${telemetry.epidemicRewardReputation}, penalty ${telemetry.epidemicPenaltyCash}/-${telemetry.epidemicPenaltyReputation}, contained ${telemetry.epidemicContainedOutbreaks}/${telemetry.epidemicOutbreaksStarted}, failed ${telemetry.epidemicFailedOutbreaks}`;
    const hasScenarioEpidemicDetails = telemetry.scenarioEpidemicHowContagious !== null ||
        telemetry.scenarioEpidemicContagiousSpreadFactor !== null ||
        telemetry.scenarioEpidemicReduceContagiousMonths !== null ||
        telemetry.scenarioEpidemicReduceContagiousPeepCount !== null ||
        telemetry.scenarioEpidemicReduceContagiousRate !== null ||
        telemetry.scenarioEpidemicFine !== null ||
        telemetry.scenarioEpidemicCompensationLow !== null ||
        telemetry.scenarioEpidemicCompensationHigh !== null;
    if (!hasScenarioEpidemicDetails) {
        return base;
    }
    return `${base}; scenario contagious ${telemetry.scenarioEpidemicHowContagious ?? "default"}/${telemetry.scenarioEpidemicContagiousSpreadFactor ?? "default"}, reduce ${telemetry.scenarioEpidemicReduceContagiousMonths ?? "default"}m/${telemetry.scenarioEpidemicReduceContagiousPeepCount ?? "default"}/${telemetry.scenarioEpidemicReduceContagiousRate ?? "default"}, fine ${telemetry.scenarioEpidemicFine ?? "default"}, comp ${telemetry.scenarioEpidemicCompensationLow ?? "default"}-${telemetry.scenarioEpidemicCompensationHigh ?? "default"}`;
}
export function formatEpidemicStatus(telemetry) {
    if (!telemetry.epidemicActive) {
        return `Epidemic: ready (${telemetry.epidemicPatientCount} patients/${telemetry.epidemicDurationTicks} ticks)`;
    }
    const nextSpread = telemetry.epidemicNextSpreadTick === null || telemetry.epidemicNextSpreadTick === undefined
        ? "none"
        : telemetry.epidemicNextSpreadTick;
    return `Epidemic: outbreak ${telemetry.epidemicOutbreakId} ${telemetry.epidemicTreatedPatients}/${telemetry.epidemicTotalPatients} contained, failed ${telemetry.epidemicFailedPatients}, spread ${telemetry.epidemicSpreadPatients}/${telemetry.epidemicOutbreakSpreadPatients} (${telemetry.epidemicRemainingSpreadPatients} left, next ${nextSpread}) (${telemetry.epidemicRemainingTicks} ticks)`;
}
export function formatVipInspectionTermsStatus(telemetry) {
    const base = `VIP terms: queue <= ${telemetry.vipInspectionMaxQueuePressure}, reputation >= ${telemetry.vipInspectionMinReputation}, reward ${telemetry.vipInspectionRewardCash}/+${telemetry.vipInspectionRewardReputation}, penalty ${telemetry.vipInspectionPenaltyCash}/-${telemetry.vipInspectionPenaltyReputation}, pass ${telemetry.vipInspectionPassedVisits}/${telemetry.vipInspectionVisitsStarted}, fail ${telemetry.vipInspectionFailedVisits}`;
    return telemetry.scenarioMayorLaunch === null
        ? base
        : `${base}; scenario mayor ${telemetry.scenarioMayorLaunch} ticks`;
}
export function formatVipInspectionStatus(telemetry) {
    if (!telemetry.vipInspectionActive) {
        return `VIP: ready (${telemetry.vipInspectionDurationTicks} ticks)`;
    }
    return `VIP: visit ${telemetry.vipInspectionVisitId} (${telemetry.vipInspectionRemainingTicks} ticks), queue ${telemetry.vipInspectionCurrentQueuePressure}/${telemetry.vipInspectionMaxQueuePressure}, rooms ${telemetry.vipInspectionCurrentOpenRooms}`;
}
export function formatSalaryPressureStatus(telemetry) {
    const base = `Salary pressure: underpaid ${telemetry.underpaidStaff}, overpaid ${telemetry.overpaidStaff}`;
    const hasScenarioSalaryDetails = telemetry.scenarioSalaryAbilityDivisor !== null ||
        telemetry.scenarioSalaryTooLow !== null ||
        telemetry.scenarioSalaryTooHigh !== null ||
        telemetry.scenarioSalaryAddCount > 0;
    if (!hasScenarioSalaryDetails) {
        return base;
    }
    return `${base}; scenario divisor ${telemetry.scenarioSalaryAbilityDivisor ?? "default"}, low ${telemetry.scenarioSalaryTooLow ?? "default"}, high ${telemetry.scenarioSalaryTooHigh ?? "default"}, bands ${telemetry.scenarioSalaryAddCount}`;
}
export function formatPatientMoodStatus(telemetry) {
    const base = `Mood: happy ${telemetry.happyPatients}, unhappy ${telemetry.unhappyPatients}, very ${telemetry.veryUnhappyPatients}, peep happy ${telemetry.peepHappinessPercent ?? 100}%`;
    const hasScenarioPatientDetails = telemetry.scenarioPatientHappy !== null ||
        telemetry.scenarioPatientUnhappy !== null ||
        telemetry.scenarioPatientVeryUnhappy !== null ||
        telemetry.scenarioPatientLeaveMax !== null ||
        telemetry.scenarioPatientLitterDrop !== null ||
        telemetry.scenarioPatientLitterRandom !== null ||
        telemetry.scenarioPatientBowelFull !== null ||
        telemetry.scenarioPatientBowelOverflows !== null ||
        telemetry.scenarioPatientVomitLimit !== null ||
        telemetry.scenarioPatientDrinkHappy !== null ||
        telemetry.scenarioPatientToiletHappy !== null;
    if (!hasScenarioPatientDetails) {
        return base;
    }
    return `${base}; scenario mood ${telemetry.scenarioPatientHappy ?? "default"}/${telemetry.scenarioPatientUnhappy ?? "default"}/${telemetry.scenarioPatientVeryUnhappy ?? "default"}, leave ${telemetry.scenarioPatientLeaveMax ?? "default"}, litter ${telemetry.scenarioPatientLitterDrop ?? "default"}/${telemetry.scenarioPatientLitterRandom ?? "default"}, bowel ${telemetry.scenarioPatientBowelFull ?? "default"}/${telemetry.scenarioPatientBowelOverflows ?? "default"}, vomit ${telemetry.scenarioPatientVomitLimit ?? "default"}, comfort ${telemetry.scenarioPatientDrinkHappy ?? "default"}/${telemetry.scenarioPatientToiletHappy ?? "default"}`;
}
export function formatTreatedPatientsStatus(telemetry) {
    return `Treated: ${telemetry.treatedPatients}`;
}
export function formatWaitingPatientsStatus(telemetry) {
    return `Waiting: ${telemetry.patientsWaiting}`;
}
export function formatReceptionPatientsStatus(telemetry) {
    return `Reception: ${telemetry.awaitingReceptionPatients ?? 0} waiting, ${telemetry.walkingToReceptionPatients ?? 0} walking, ${telemetry.receptionPatients ?? 0} at desk`;
}
export function formatQueuedPatientsStatus(telemetry) {
    return `Queue: ${telemetry.queuedPatients}`;
}
export function formatWalkingToDiagnosisPatientsStatus(telemetry) {
    return `Walking to diagnosis: ${telemetry.walkingToDiagnosisPatients}`;
}
export function formatDiagnosingPatientsStatus(telemetry) {
    return `Diagnosing: ${telemetry.diagnosingPatients}`;
}
export function formatDiagnosedPatientsStatus(telemetry) {
    return `Diagnosed: ${telemetry.diagnosedPatients}`;
}
export function formatAwaitingTreatmentPatientsStatus(telemetry) {
    return `Awaiting treatment: ${telemetry.awaitingTreatmentPatients}`;
}
export function formatWalkingToTreatmentPatientsStatus(telemetry) {
    return `Walking to treatment: ${telemetry.walkingToTreatmentPatients}`;
}
export function formatTreatingPatientsStatus(telemetry) {
    return `Treating: ${telemetry.treatingPatients}`;
}
export function formatDischargedPatientsStatus(telemetry) {
    return `Discharged: ${telemetry.dischargedPatients}`;
}
export function formatPatientLitterStatus(telemetry) {
    return `Patient litter: ${telemetry.patientLitter}, active ${telemetry.currentPatientLitter ?? 0}, cleaned ${telemetry.patientLitterCleaned ?? 0}, cleanliness ${telemetry.cleanlinessLitterPercent ?? 0}%`;
}
export function formatPatientDrinksStatus(telemetry) {
    const drinkTarget = telemetry.scenarioAwardCriteria?.cansofCoke;
    const awardProgress = Number.isFinite(drinkTarget)
        ? `, award ${telemetry.patientDrinks}/${drinkTarget}`
        : "";
    return `Drinks served: ${telemetry.patientDrinks}${awardProgress}`;
}
export function formatPatientVomitsStatus(telemetry) {
    const limit = telemetry.scenarioPatientVomitLimit === null || telemetry.scenarioPatientVomitLimit === undefined
        ? "default"
        : telemetry.scenarioPatientVomitLimit;
    return `Patient vomits: ${telemetry.patientVomits}, limit ${limit}`;
}
export function formatPatientsNeedingToiletStatus(telemetry) {
    const threshold = telemetry.scenarioPatientBowelFull === null || telemetry.scenarioPatientBowelFull === undefined
        ? "default"
        : telemetry.scenarioPatientBowelFull;
    return `Need toilet: ${telemetry.patientsNeedingToilet}, threshold ${threshold}`;
}
export function formatPatientBowelOverflowStatus(telemetry) {
    const threshold = telemetry.scenarioPatientBowelOverflows === null || telemetry.scenarioPatientBowelOverflows === undefined
        ? "default"
        : telemetry.scenarioPatientBowelOverflows;
    return `Bowel overflows: ${telemetry.patientBowelOverflows}, threshold ${threshold}`;
}
export function formatRatControlStatus(telemetry) {
    return `Rats: ${telemetry.ratKills}/${telemetry.ratSightings}, accuracy ${telemetry.ratKillPercentage}%`;
}
export function formatPlantCareStatus(telemetry) {
    return `Plants: ${telemetry.plantsWatered}/${telemetry.plantWaterChecks}, watered ${telemetry.plantWateredPercentage}%`;
}
export function formatCriticalPatientsStatus(telemetry) {
    const lowestHealth = telemetry.lowestPatientHealth === null || telemetry.lowestPatientHealth === undefined
        ? "none"
        : telemetry.lowestPatientHealth;
    return `Critical patients: ${telemetry.criticalPatients}, lowest health ${lowestHealth}`;
}
function formatSeverityPenaltyTable(cashForSeverity, reputationForSeverity) {
    return [1, 2, 3]
        .map((severity) => `s${severity} ${cashForSeverity(severity)}/-${reputationForSeverity(severity)}`)
        .join(", ");
}
export function formatPatientDeathsStatus(telemetry) {
    const deathPenalties = formatSeverityPenaltyTable(patientDeathCashPenaltyForSeverity, patientDeathReputationPenaltyForSeverity);
    const sendHomePenalties = formatSeverityPenaltyTable(patientSendHomeCashPenaltyForSeverity, patientSendHomeReputationPenaltyForSeverity);
    return `Deaths: ${telemetry.patientDeaths}, walkouts ${telemetry.patientWalkouts} (${telemetry.waitingTimesWalkoutPercent}%), abductions ${telemetry.patientAbductions}; death penalties ${deathPenalties}; send-home ${sendHomePenalties}`;
}
export function formatTreatmentFailuresStatus(telemetry) {
    const failurePenalties = formatSeverityPenaltyTable(treatmentFailureCashPenaltyForSeverity, treatmentFailureReputationPenaltyForSeverity);
    return `Treatment failures: ${telemetry.treatmentFailures}; penalties ${failurePenalties}`;
}
export function formatQueuePressureStatus(telemetry) {
    return `Queue pressure status: ${telemetry.queuePressureStatus}, high >= ${QUEUE_PRESSURE_HIGH_THRESHOLD}, reputation -${QUEUE_PRESSURE_REPUTATION_PENALTY_PER_TICK}/tick`;
}
export function formatQueuePressureValueStatus(telemetry) {
    return `Queue pressure: ${telemetry.queuePressure}`;
}
export function formatQueuePressureEventsStatus(telemetry) {
    return `Queue pressure events: ${telemetry.queuePressureEvents}`;
}
export function formatRoomMaintenanceStatus(telemetry) {
    return `Rooms in maintenance: ${telemetry.roomsInMaintenance}, worn ${telemetry.wornRoomPercent ?? 0}%`;
}
export function formatRoomMaintenanceStartEventsStatus(telemetry) {
    return `Room maintenance starts: ${telemetry.roomMaintenanceStartEvents}`;
}
export function formatRoomMaintenanceCompleteEventsStatus(telemetry) {
    return `Room maintenance completes: ${telemetry.roomMaintenanceCompleteEvents}`;
}
export function formatOpenDiagnosisRoomsStatus(telemetry) {
    return `Open diagnosis rooms: ${telemetry.openDiagnosisRooms}`;
}
export function formatOpenTreatmentRoomsStatus(telemetry) {
    return `Open treatment rooms: ${telemetry.openTreatmentRooms}`;
}
export function formatSpecializedTreatmentRoomsStatus(telemetry) {
    return `Specialized rooms: pharmacy ${telemetry.openPharmacyRooms}, specialist ${telemetry.openSpecialistRooms}`;
}
export function formatSpecializedTreatmentQueueStatus(telemetry) {
    return `Specialty queue: ${telemetry.awaitingSpecializedTreatmentPatients}`;
}
export function formatStressedStaffStatus(telemetry) {
    const base = `Stressed staff: ${telemetry.stressedStaff}, staff happy ${telemetry.staffHappinessPercent ?? 100}%`;
    if (telemetry.scenarioStaffWorkLight === null && telemetry.scenarioStaffModifyFrequency === null && telemetry.scenarioStaffResignMax === null) {
        return base;
    }
    return `${base}; scenario work ${telemetry.scenarioStaffWorkLight ?? "default"}, modify ${telemetry.scenarioStaffModifyFrequency ?? "default"}, resign ${telemetry.scenarioStaffResignMax ?? "default"}`;
}
export function formatStaffBurnoutEventsStatus(telemetry) {
    return `Staff burnout events: ${telemetry.staffBurnoutEvents}`;
}
export function formatStaffRecoveryEventsStatus(telemetry) {
    return `Staff recovery events: ${telemetry.staffRecoveryEvents}`;
}
export function formatAutoBreakStaffStatus(telemetry) {
    return `Auto-break staff: ${telemetry.autoBreakStaff}`;
}
export function formatActiveStaffStatus(telemetry) {
    return `Active staff: ${telemetry.activeStaff}`;
}
export function formatOnBreakStaffStatus(telemetry) {
    return `On-break staff: ${telemetry.onBreakStaff}`;
}
export function formatTiredStaffStatus(telemetry) {
    const base = `Tired staff: ${telemetry.tiredStaff}`;
    if (telemetry.scenarioStaffNotTired === null && telemetry.scenarioStaffTired === null && telemetry.scenarioStaffVeryTired === null && telemetry.scenarioStaffFatigueCrackUpTired === null) {
        return base;
    }
    return `${base}; scenario thresholds ${telemetry.scenarioStaffNotTired ?? "default"}/${telemetry.scenarioStaffTired ?? "default"}/${telemetry.scenarioStaffVeryTired ?? "default"}/${telemetry.scenarioStaffFatigueCrackUpTired ?? "default"}`;
}
export function formatVeryTiredStaffStatus(telemetry) {
    const base = `Very tired staff: ${telemetry.veryTiredStaff}`;
    if (telemetry.scenarioStaffRestStanding === null &&
        telemetry.scenarioStaffRestSofa === null &&
        telemetry.scenarioStaffRestGame === null &&
        telemetry.scenarioStaffRestSnooker === null &&
        telemetry.scenarioStaffRecoveryFactor === null &&
        telemetry.scenarioStaffFatigueRecoveryMinimum === null) {
        return base;
    }
    return `${base}; scenario rest ${telemetry.scenarioStaffRestStanding ?? "default"}/${telemetry.scenarioStaffRestSofa ?? "default"}/${telemetry.scenarioStaffRestGame ?? "default"}/${telemetry.scenarioStaffRestSnooker ?? "default"}, recovery ${telemetry.scenarioStaffRecoveryFactor ?? "default"}/${telemetry.scenarioStaffFatigueRecoveryMinimum ?? "default"}`;
}
export function formatNextAdmissionStatus(telemetry, languageSummary = null) {
    const base = telemetry.nextAdmissionInTicks === null
        ? "Next arrival: closed"
        : `Next arrival: ${telemetry.nextAdmissionInTicks} ticks`;
    const hasScenarioAllocationDetails = telemetry.scenarioIllnessRate !== null ||
        telemetry.scenarioPopulationChange !== 0 ||
        (telemetry.scenarioDiseasePoolSize ?? 0) > 0 ||
        telemetry.scenarioAllocationRandomWeight !== null ||
        telemetry.scenarioAllocationTotalReputationWeight !== null ||
        telemetry.scenarioAllocationIllnessReputationWeight !== null ||
        telemetry.scenarioAllocationDelayMonths !== null ||
        telemetry.autoAdmissionIntervalTicks !== null ||
        telemetry.autoAdmissionWaitingCap !== null;
    if (!hasScenarioAllocationDetails) {
        return base;
    }
    const diseaseAvailability = telemetry.scenarioAvailableDiseaseCount === undefined
        ? `${telemetry.scenarioDiseasePoolSize ?? 0}`
        : `${telemetry.scenarioAvailableDiseaseCount}/${telemetry.scenarioDiseasePoolSize ?? 0}`;
    const nextDiseaseName = scenarioNextDiseaseDisplayName(telemetry, languageSummary);
    const nextDisease = nextDiseaseName ? `, next ${nextDiseaseName}` : "";
    return `${base}; scenario illness ${telemetry.scenarioIllnessRate ?? "default"}, pop ${telemetry.scenarioPopulationChange}, pool ${diseaseAvailability}${nextDisease}, allocation ${telemetry.scenarioAllocationRandomWeight ?? "default"}/${telemetry.scenarioAllocationTotalReputationWeight ?? "default"}/${telemetry.scenarioAllocationIllnessReputationWeight ?? "default"}, delay ${telemetry.scenarioAllocationDelayMonths ?? "default"}m/${telemetry.scenarioAllocationDelayTicks} ticks, auto ${telemetry.autoAdmissionIntervalTicks ?? "default"} ticks/cap ${telemetry.autoAdmissionWaitingCap ?? "default"}`;
}
function scenarioNextDiseaseDisplayName(telemetry, languageSummary) {
    if (!telemetry.scenarioNextDiseaseId) {
        return "";
    }
    const importedName = languageSummary?.diseaseNames?.[telemetry.scenarioNextDiseaseId];
    return typeof importedName === "string" && importedName.length > 0
        ? importedName
        : telemetry.scenarioNextDiseaseId;
}
export function formatAdmissionsStatus(telemetry) {
    return `Admissions: ${telemetry.admissionsOpen ? "open" : "closed"}`;
}
export function formatAdmissionPolicyStatus(telemetry) {
    return `Admission policy: ${telemetry.admissionPolicy}`;
}
export function formatAdmissionRulesStatus(telemetry) {
    return `Scenario holds: visual ${telemetry.scenarioHoldVisualMonths} months/${telemetry.scenarioHoldVisualPeepCount} patients`;
}
export function formatRoutingRulesStatus(telemetry) {
    return `Scenario routing: queue ${telemetry.scenarioRoutingQueuePoints ?? 0}, distance ${telemetry.scenarioRoutingDistancePoints ?? 0}, no-staff ${telemetry.scenarioRoutingNoStaffPoints ?? 0} (+${telemetry.scenarioRoutingNoStaffAdmissionPenaltyTicks} ticks)`;
}
export function formatFrontDeskStatus(telemetry) {
    return `Front desk: ${telemetry.activeReceptionists} active receptionists, capacity ${telemetry.frontDeskCapacity}, intake cap ${telemetry.autoAdmissionWaitingCap ?? "default"}`;
}
export function formatEventRulesStatus(telemetry) {
    const base = `Events: ${telemetry.totalEvents}`;
    const hasScenarioEventDetails = telemetry.scenarioScoreMaxIncrease !== null ||
        telemetry.scenarioVaccinationCost !== null ||
        telemetry.scenarioRemoveRatHoleChance !== null ||
        telemetry.scenarioMinimumAbductionYears !== null ||
        telemetry.scenarioAbductionsPerYear !== null ||
        telemetry.scenarioMayorLaunch !== null ||
        telemetry.scenarioDisasterLaunch !== null;
    if (!hasScenarioEventDetails) {
        return base;
    }
    return `${base}; scenario score ${telemetry.scenarioScoreMaxIncrease ?? "default"}, vacc ${telemetry.scenarioVaccinationCost ?? "default"}, rats ${telemetry.scenarioRemoveRatHoleChance ?? "default"}, abduct ${telemetry.scenarioMinimumAbductionYears ?? "default"}y/${telemetry.scenarioAbductionsPerYear ?? "default"} (${telemetry.scenarioAbductionsTriggered ?? 0} triggered), mayor ${telemetry.scenarioMayorLaunch ?? "default"}, disaster ${telemetry.scenarioDisasterLaunch ?? "default"}`;
}
export function formatLastEventStatus(telemetry) {
    return `Last event: ${telemetry.lastEventType ?? "none"}`;
}
export function formatRecentEventsStatus(telemetry) {
    return `Recent events: ${telemetry.recentEventFeed || "none"}`;
}
export function formatLoanInterestStatus(telemetry) {
    const base = `Loan interest: ${telemetry.loanInterestExpense} tick, ${telemetry.cumulativeLoanInterest} total`;
    return telemetry.scenarioLoanInterestPerChunk === null
        ? base
        : `${base}; scenario ${telemetry.scenarioLoanInterestPerChunk}/chunk`;
}
export function formatLoanStatus(telemetry) {
    const nextLoanAmount = Math.max(0, Math.min(telemetry.loanChunkAmount, telemetry.loanMaxOutstanding - telemetry.outstandingLoan));
    const nextRepaymentAmount = Math.max(0, Math.min(telemetry.loanChunkAmount, telemetry.outstandingLoan, telemetry.cash));
    return `Loan: ${telemetry.outstandingLoan}/${telemetry.loanMaxOutstanding}, chunk ${telemetry.loanChunkAmount}, available ${nextLoanAmount}, repay ${nextRepaymentAmount}`;
}
export function formatFinanceLedgerStatus(telemetry) {
    if (!telemetry.financeLedgerUnlocked) {
        return "Finance ledger: locked";
    }
    const auditStatus = !telemetry.financeAuditReady && telemetry.financeAuditCooldownRemainingTicks > 0
        ? `audit cooldown ${telemetry.financeAuditCooldownRemainingTicks} ticks`
        : telemetry.financeAuditReady
            ? "audit ready"
            : "audit unavailable";
    return `Finance ledger: ${auditStatus}, audits ${telemetry.financeAuditsRun}, recovered ${telemetry.financeAuditTotalRecoveredCash}`;
}
export function formatFinanceAuditStatus(telemetry) {
    return `Finance audit: recover ${telemetry.financeAuditCashRecovery} cash, cooldown ${telemetry.financeAuditCooldownTicks} ticks, recovered ${telemetry.financeAuditTotalRecoveredCash}/${telemetry.financeAuditsRun}`;
}
export function formatPricingPolicyStatus(telemetry) {
    const multiplierPercent = Math.round(treatmentPricingCashMultiplier(telemetry.treatmentPricingPolicy) * 100);
    const reputationDelta = treatmentPricingReputationDelta(telemetry.treatmentPricingPolicy);
    const reputationText = reputationDelta >= 0 ? `+${reputationDelta}` : `${reputationDelta}`;
    return `Pricing: ${telemetry.treatmentPricingPolicy}, cash ${multiplierPercent}%, reputation ${reputationText}/cure`;
}
export function formatReputationStatus(telemetry) {
    return `Reputation: ${telemetry.reputation}`;
}
export function formatInsuranceTermsStatus(telemetry) {
    return `Insurance terms: severity ${telemetry.insuranceContractSeverity}, reward ${telemetry.insuranceContractRewardCash}/+${telemetry.insuranceContractRewardReputation}, penalty ${telemetry.insuranceContractPenaltyCash}/-${telemetry.insuranceContractPenaltyReputation}, completed ${telemetry.insuranceContractsCompleted}/${telemetry.insuranceContractsStarted}, failed ${telemetry.insuranceContractsFailed}`;
}
export function formatInsuranceContractStatus(telemetry) {
    if (!telemetry.insuranceContractUnlocked) {
        return "Insurance: locked";
    }
    if (!telemetry.insuranceContractActive) {
        return `Insurance: ready (${telemetry.insuranceContractPatientCount} patients/${telemetry.insuranceContractDurationTicks} ticks)`;
    }
    return `Insurance: contract ${telemetry.insuranceContractId} ${telemetry.insuranceContractCompletedPatients}/${telemetry.insuranceContractTotalPatients} claims, failed ${telemetry.insuranceContractFailedPatients}, remaining ${telemetry.insuranceContractRemainingPatients} (${telemetry.insuranceContractRemainingTicks} ticks)`;
}
export function formatMarketingCampaignStatus(telemetry) {
    const projectedReputation = Math.min(1000, telemetry.reputation + telemetry.marketingCampaignReputationGain);
    const status = telemetry.reputation >= 1000
        ? "blocked max reputation"
        : telemetry.cash < telemetry.marketingCampaignCost
            ? `blocked need ${telemetry.marketingCampaignCost - telemetry.cash} cash`
            : "ready";
    return `Marketing: ${telemetry.marketingCampaignCost} => +${telemetry.marketingCampaignReputationGain} reputation (${telemetry.reputation}->${projectedReputation}), ${status}`;
}
export function formatHospitalRatingStatus(telemetry) {
    return `Rating: ${telemetry.hospitalRatingScore}/100 (${telemetry.hospitalRatingTier}), award ${telemetry.hospitalAwardRewardCash}/+${telemetry.hospitalAwardRewardReputation}`;
}
export function formatHospitalAwardStatus(telemetry) {
    const totalReputation = telemetry.hospitalAwardTotalReputationReward >= 0
        ? `+${telemetry.hospitalAwardTotalReputationReward}`
        : `${telemetry.hospitalAwardTotalReputationReward}`;
    const totals = `, totals ${telemetry.hospitalAwardTotalCashReward}/${totalReputation}`;
    return telemetry.hospitalAwardLastTier
        ? `Awards: ${telemetry.hospitalAwardLastTier} ${telemetry.hospitalAwardLastScore}/100, ceremonies ${telemetry.hospitalAwardCeremoniesRun}${totals}${formatScenarioAwardSuffix(telemetry)}`
        : `Awards: ready, reward ${telemetry.hospitalAwardRewardCash}/+${telemetry.hospitalAwardRewardReputation}${totals}${formatScenarioAwardSuffix(telemetry)}`;
}
export function formatCashStatus(telemetry) {
    const scenarioParts = [];
    if (telemetry.scenarioInitialCash !== null && telemetry.scenarioInitialCash !== undefined) {
        scenarioParts.push(`start ${telemetry.scenarioInitialCash}`);
    }
    if (telemetry.scenarioLandCostPerTile !== null && telemetry.scenarioLandCostPerTile !== undefined) {
        scenarioParts.push(`land ${telemetry.scenarioLandCostPerTile}/tile`);
    }
    return scenarioParts.length === 0
        ? `Cash: ${telemetry.cash}`
        : `Cash: ${telemetry.cash}; scenario ${scenarioParts.join(", ")}`;
}
function patientStatusDisplayName(patient, languageSummary) {
    const importedName = languageSummary?.patientStatusNames?.[patient.status];
    if (typeof importedName !== "string" || importedName.length === 0) {
        return patient.status;
    }
    if (importedName.includes("%s")) {
        const target = patient.diagnosisKnown && patient.preferredTreatmentRoomType
            ? roomTypeDisplayName(patient.preferredTreatmentRoomType, languageSummary)
            : "";
        return importedName.replace("%s", target).trim();
    }
    return importedName;
}
function createImportedHospitalView(assetBundle) {
    const mapSummaries = createCampaignMapSummaries(assetBundle?.manifest?.mapSummaries ?? []);
    if (!assetBundle || mapSummaries.length === 0) {
        return null;
    }
    const paletteRecord = assetBundle.filesByPath.get("DATA/MPALETTE.DAT");
    if (!paletteRecord) {
        return null;
    }
    const palette = safeDecode(() => decodeThemeHospitalPalette(paletteRecord.bytes));
    const blockSheet = safeDecode(() => decodeThemeHospitalSpriteSheetFromBundle(assetBundle, "DATA/VBLK-0"));
    if (!palette || !blockSheet) {
        return null;
    }
    const spriteSheet = safeDecode(() => decodeThemeHospitalSpriteSheetFromBundle(assetBundle, "DATA/VSPR-0"));
    const animationSet = spriteSheet ? safeDecode(() => decodeThemeHospitalAnimationSetFromBundle(assetBundle)) : null;
    const originalUiSpriteSheetSummary = selectOriginalUiSpriteSheetSummary(assetBundle?.manifest?.uiSpriteSheets ?? [], assetBundle?.manifest?.qDataSpriteSheets ?? []);
    const originalUiSpriteSheet = safeDecode(() => originalUiSpriteSheetSummary ? decodeThemeHospitalSpriteSheetFromBundle(assetBundle, originalUiSpriteSheetSummary.path) : null);
    const view = {
        assetBundle,
        mapSummaries,
        palette,
        blockSheet,
        spriteSheet,
        animationSet,
        originalUiSpriteSheet,
        originalUiSpriteSheetPath: originalUiSpriteSheetSummary?.path ?? "",
        languageSummary: assetBundle.manifest.languageSummary ?? null,
        mapPath: "",
        map: null,
        startX: 0,
        startY: 0,
        tileColumns: HOSPITAL_TILE_COLUMNS,
        tileRows: HOSPITAL_TILE_ROWS,
        zoomIndex: HOSPITAL_DEFAULT_ZOOM_INDEX,
        transparentWalls: false,
        originX: Math.floor(HOSPITAL_CANVAS_WIDTH / 2),
        originY: 18
    };
    return setHospitalViewMap(view, mapSummaries[0].path) ? view : null;
}
const ORIGINAL_UI_SPRITE_SHEET_PREFERENCE = [
    "DATA/PANEL02V",
    "DATA/PANEL04V",
    "DATA/MONEY01V",
    "DATA/WATCH01V",
    "DATA/PULLDV",
    "DATA/MPOINTER"
];
const ORIGINAL_UI_STRIP_CONTROLS = [
    { id: "pause-toggle", label: formatOriginalUiStripControlLabel("pause-toggle") },
    { id: "step", label: formatOriginalUiStripControlLabel("step") },
    { id: "build-diagnosis-room", label: formatOriginalUiStripControlLabel("build-diagnosis-room") },
    { id: "build-treatment-room", label: formatOriginalUiStripControlLabel("build-treatment-room") },
    { id: "build-pharmacy-room", label: formatOriginalUiStripControlLabel("build-pharmacy-room") },
    { id: "build-specialist-room", label: formatOriginalUiStripControlLabel("build-specialist-room") },
    { id: "hire-diagnostician", label: formatOriginalUiStripControlLabel("hire-diagnostician") },
    { id: "hire-nurse", label: formatOriginalUiStripControlLabel("hire-nurse") },
    { id: "hire-handyman", label: formatOriginalUiStripControlLabel("hire-handyman") },
    { id: "hire-receptionist", label: formatOriginalUiStripControlLabel("hire-receptionist") },
    { id: "admit", label: formatOriginalUiStripControlLabel("admit") },
    { id: "treat", label: formatOriginalUiStripControlLabel("treat") },
    { id: "staff-break-toggle", label: formatOriginalUiStripControlLabel("staff-break-toggle") },
    { id: "treatment-room-toggle", label: formatOriginalUiStripControlLabel("treatment-room-toggle") },
    { id: "open-jukebox", label: formatOriginalUiStripControlLabel("open-jukebox") },
    { id: "open-furnish-corridor", label: formatOriginalUiStripControlLabel("open-furnish-corridor") },
    { id: "open-edit-room", label: formatOriginalUiStripControlLabel("open-edit-room") },
    { id: "open-first-message", label: formatOriginalUiStripControlLabel("open-first-message") },
    { id: "open-casebook", label: formatOriginalUiStripControlLabel("open-casebook") },
    { id: "open-map", label: formatOriginalUiStripControlLabel("open-map") },
    { id: "open-staff", label: formatOriginalUiStripControlLabel("open-staff") },
    { id: "open-research", label: formatOriginalUiStripControlLabel("open-research") },
    { id: "open-policy", label: formatOriginalUiStripControlLabel("open-policy") },
    { id: "open-machine-menu", label: formatOriginalUiStripControlLabel("open-machine-menu") },
    { id: "take-loan", label: formatOriginalUiStripControlLabel("take-loan") },
    { id: "repay-loan", label: formatOriginalUiStripControlLabel("repay-loan") },
    { id: "start-research", label: formatOriginalUiStripControlLabel("start-research") },
    { id: "run-finance-audit", label: formatOriginalUiStripControlLabel("run-finance-audit") },
    { id: "run-marketing-campaign", label: formatOriginalUiStripControlLabel("run-marketing-campaign") },
    { id: "start-insurance-contract", label: formatOriginalUiStripControlLabel("start-insurance-contract") },
    { id: "run-awards-ceremony", label: formatOriginalUiStripControlLabel("run-awards-ceremony") },
    { id: "start-emergency-wave", label: formatOriginalUiStripControlLabel("start-emergency-wave") },
    { id: "start-epidemic-outbreak", label: formatOriginalUiStripControlLabel("start-epidemic-outbreak") },
    { id: "start-vip-inspection", label: formatOriginalUiStripControlLabel("start-vip-inspection") },
    { id: "save-game", label: formatOriginalUiStripControlLabel("save-game") },
    { id: "load-game", label: formatOriginalUiStripControlLabel("load-game") },
    { id: "refresh-save-slots", label: formatOriginalUiStripControlLabel("refresh-save-slots") },
    { id: "delete-save-slot", label: formatOriginalUiStripControlLabel("delete-save-slot") },
    { id: "restart-level", label: formatOriginalUiStripControlLabel("restart-level") },
    { id: "quit-level", label: formatOriginalUiStripControlLabel("quit-level") },
    { id: "next-level", label: formatOriginalUiStripControlLabel("next-level") },
    { id: "hospital-camera-west", label: formatOriginalUiStripControlLabel("hospital-camera-west") },
    { id: "hospital-camera-east", label: formatOriginalUiStripControlLabel("hospital-camera-east") },
    { id: "hospital-camera-north", label: formatOriginalUiStripControlLabel("hospital-camera-north") },
    { id: "hospital-camera-south", label: formatOriginalUiStripControlLabel("hospital-camera-south") }
];
export function selectOriginalUiSpriteSheetSummary(uiSpriteSheets, qDataSpriteSheets) {
    const visibleUiSheets = Array.isArray(uiSpriteSheets)
        ? uiSpriteSheets.filter((summary) => summary?.visibleSpriteCount > 0)
        : [];
    for (const preferredPath of ORIGINAL_UI_SPRITE_SHEET_PREFERENCE) {
        const summary = visibleUiSheets.find((candidate) => candidate.path === preferredPath);
        if (summary) {
            return summary;
        }
    }
    return visibleUiSheets[0] ?? selectQDataUiSpriteSheetSummary(qDataSpriteSheets);
}
export function selectQDataUiSpriteSheetSummary(qDataSpriteSheets) {
    if (!Array.isArray(qDataSpriteSheets)) {
        return null;
    }
    return qDataSpriteSheets.find((summary) => summary?.visibleSpriteCount > 0) ?? null;
}
export function createCampaignMapSummaries(mapSummaries) {
    if (!Array.isArray(mapSummaries)) {
        return [];
    }
    const scenarioMaps = mapSummaries.filter((summary) => summary?.scenario);
    return scenarioMaps.length > 0 ? scenarioMaps : mapSummaries;
}
function currentHospitalViewCenter(view) {
    return {
        x: view.startX + view.tileColumns / 2,
        y: view.startY + view.tileRows / 2
    };
}
function clampHospitalViewCamera(view) {
    if (!view?.map) {
        return;
    }
    view.startX = clamp(view.startX, 0, Math.max(0, view.map.width - view.tileColumns));
    view.startY = clamp(view.startY, 0, Math.max(0, view.map.height - view.tileRows));
}
function applyHospitalViewZoom(view, zoomIndex, options = {}) {
    if (!view) {
        return false;
    }
    const nextZoomIndex = clamp(Math.trunc(zoomIndex), 0, HOSPITAL_ZOOM_LEVELS.length - 1);
    const nextZoom = HOSPITAL_ZOOM_LEVELS[nextZoomIndex] ?? HOSPITAL_ZOOM_LEVELS[HOSPITAL_DEFAULT_ZOOM_INDEX];
    const center = view.map && options.preserveCenter !== false ? currentHospitalViewCenter(view) : null;
    view.zoomIndex = nextZoomIndex;
    view.tileColumns = nextZoom.tileColumns;
    view.tileRows = nextZoom.tileRows;
    if (center) {
        view.startX = Math.round(center.x - view.tileColumns / 2);
        view.startY = Math.round(center.y - view.tileRows / 2);
    }
    clampHospitalViewCamera(view);
    return true;
}
function formatHospitalZoomLevel(view) {
    const zoom = HOSPITAL_ZOOM_LEVELS[view?.zoomIndex ?? HOSPITAL_DEFAULT_ZOOM_INDEX] ?? HOSPITAL_ZOOM_LEVELS[HOSPITAL_DEFAULT_ZOOM_INDEX];
    return zoom.label;
}
export function formatCameraPositionStoredStatus(slot) {
    return `Action: camera position ${slot} stored`;
}
export function formatCameraPositionEmptyStatus(slot) {
    return `Action: camera position ${slot} empty`;
}
export function formatCameraPositionUnavailableStatus(slot) {
    return `Action: camera position ${slot} unavailable`;
}
export function formatCameraPositionRecalledStatus(slot) {
    return `Action: camera position ${slot} recalled`;
}
export function formatZoomActionStatus(view) {
    return `Action: zoom ${formatHospitalZoomLevel(view)}`;
}
function setHospitalViewMap(view, mapPath) {
    const decodedMap = safeDecode(() => decodeThemeHospitalMapFromBundle(view.assetBundle, mapPath));
    if (!decodedMap || !Array.isArray(decodedMap.tiles)) {
        return false;
    }
    view.mapPath = mapPath;
    view.map = decodedMap;
    applyHospitalViewZoom(view, view.zoomIndex ?? HOSPITAL_DEFAULT_ZOOM_INDEX, { preserveCenter: false });
    const camera = decodedMap.cameras?.[0] ?? { x: 0, y: 0 };
    view.startX = clamp(Math.floor(camera.x - view.tileColumns / 2), 0, Math.max(0, decodedMap.width - view.tileColumns));
    view.startY = clamp(Math.floor(camera.y - view.tileRows / 2), 0, Math.max(0, decodedMap.height - view.tileRows));
    return true;
}
function createSimulationTerrainFromHospitalView(view) {
    if (!view?.map || !Array.isArray(view.map.tiles)) {
        return undefined;
    }
    let passableTileCount = 0;
    let buildableTileCount = 0;
    let travelMaskInput = "";
    const tiles = view.map.tiles.map((tile) => {
        const flags = tile.flags ?? {};
        const buildable = flags.hospital === true && flags.buildable === true;
        const passable = flags.passable === true || buildable;
        const travelMask = passable
            ? ((flags.canTravelN !== false ? 1 : 0) |
                (flags.canTravelE !== false ? 2 : 0) |
                (flags.canTravelS !== false ? 4 : 0) |
                (flags.canTravelW !== false ? 8 : 0))
            : 0;
        passableTileCount += passable ? 1 : 0;
        buildableTileCount += buildable ? 1 : 0;
        travelMaskInput += travelMask.toString(16);
        return {
            passable,
            buildable,
            canTravelN: flags.canTravelN !== false,
            canTravelE: flags.canTravelE !== false,
            canTravelS: flags.canTravelS !== false,
            canTravelW: flags.canTravelW !== false
        };
    });
    return {
        width: view.map.width,
        height: view.map.height,
        signature: `${view.mapPath}:${view.map.width}x${view.map.height}:p${passableTileCount}:b${buildableTileCount}:t${hashText32(travelMaskInput)}`,
        tiles
    };
}
function createAdmissionPointsFromHospitalView(view) {
    if (!view?.map) {
        return undefined;
    }
    const seen = new Set();
    const points = [];
    for (const heliport of view.map.heliports ?? []) {
        if (!Number.isInteger(heliport.x) ||
            !Number.isInteger(heliport.y) ||
            (heliport.x === 0 && heliport.y === 0) ||
            heliport.x < 0 ||
            heliport.y < 0 ||
            heliport.x >= view.map.width ||
            heliport.y >= view.map.height) {
            continue;
        }
        const key = `${heliport.x},${heliport.y}`;
        if (seen.has(key)) {
            continue;
        }
        seen.add(key);
        points.push({ x: heliport.x, y: heliport.y });
    }
    return points.length > 0 ? points : undefined;
}
function createHospitalMapViewSnapshot(view) {
    if (!view?.mapPath) {
        return undefined;
    }
    return {
        mapPath: view.mapPath,
        startX: view.startX,
        startY: view.startY,
        zoomIndex: view.zoomIndex ?? HOSPITAL_DEFAULT_ZOOM_INDEX
    };
}
function restoreHospitalMapViewSnapshot(view, mapView) {
    if (!view || !mapView) {
        return true;
    }
    if (!setHospitalViewMap(view, mapView.mapPath)) {
        return false;
    }
    applyHospitalViewZoom(view, mapView.zoomIndex ?? HOSPITAL_DEFAULT_ZOOM_INDEX, { preserveCenter: false });
    view.startX = clamp(mapView.startX, 0, Math.max(0, view.map.width - view.tileColumns));
    view.startY = clamp(mapView.startY, 0, Math.max(0, view.map.height - view.tileRows));
    return true;
}
function restoreHospitalCameraSnapshot(view, mapView) {
    if (!view?.map || !mapView || mapView.mapPath !== view.mapPath) {
        return false;
    }
    applyHospitalViewZoom(view, mapView.zoomIndex ?? HOSPITAL_DEFAULT_ZOOM_INDEX, { preserveCenter: false });
    view.startX = clamp(mapView.startX, 0, Math.max(0, view.map.width - view.tileColumns));
    view.startY = clamp(mapView.startY, 0, Math.max(0, view.map.height - view.tileRows));
    return true;
}
function nextHospitalMapPath(view) {
    if (!view?.mapPath || !Array.isArray(view.mapSummaries) || view.mapSummaries.length === 0) {
        return null;
    }
    const index = view.mapSummaries.findIndex((summary) => summary.path === view.mapPath);
    if (index < 0 || index + 1 >= view.mapSummaries.length) {
        return null;
    }
    return view.mapSummaries[index + 1].path;
}
export function canRestartLevelFromHospitalView(view = null) {
    return Boolean(view?.map);
}
export function canAdvanceToNextLevelFromTelemetry(view = null, telemetry = null) {
    return Boolean(telemetry?.levelObjectiveStatus === "won" && nextHospitalMapPath(view) !== null);
}
function campaignLevelIndex(view) {
    if (!view?.mapPath || !Array.isArray(view.mapSummaries) || view.mapSummaries.length === 0) {
        return 0;
    }
    const index = view.mapSummaries.findIndex((summary) => summary.path === view.mapPath);
    return index >= 0 ? index : 0;
}
function campaignMapSummaryAt(view, index) {
    if (!Array.isArray(view?.mapSummaries) || view.mapSummaries.length === 0) {
        return null;
    }
    return view.mapSummaries[Math.max(0, Math.min(view.mapSummaries.length - 1, index))] ?? null;
}
function positiveDelta(current, baseline, key) {
    const currentValue = current?.[key];
    const baselineValue = baseline?.[key];
    if (!Number.isFinite(currentValue) || !Number.isFinite(baselineValue)) {
        return 0;
    }
    return Math.max(0, currentValue - baselineValue);
}
export function createCampaignLevelObjectiveFromHospitalView(view) {
    const index = campaignLevelIndex(view);
    const currentMap = campaignMapSummaryAt(view, index);
    const scenarioObjective = createScenarioLevelObjective(currentMap?.scenario);
    if (scenarioObjective) {
        return scenarioObjective;
    }
    const firstMap = campaignMapSummaryAt(view, 0) ?? currentMap;
    const parcelDelta = positiveDelta(currentMap, firstMap, "parcelCount");
    const objectDelta = positiveDelta(currentMap, firstMap, "objectCount");
    const buildableDelta = positiveDelta(currentMap, firstMap, "buildableTileCount");
    const complexityDischarges = Math.min(6, Math.floor(parcelDelta / 2) + Math.floor(objectDelta / 25) + Math.floor(buildableDelta / 1200));
    const complexityCash = (parcelDelta * 100) + (Math.floor(objectDelta / 5) * 50) + (Math.floor(buildableDelta / 1000) * 250);
    const complexityReputation = (parcelDelta * 2) + (Math.floor(objectDelta / 25) * 3) + (Math.floor(buildableDelta / 1500) * 2);
    return {
        requiredDischarges: 3 + Math.min(7, index) + complexityDischarges,
        minimumCash: Math.min(10_000, (index * 250) + complexityCash),
        minimumReputation: 1 + Math.min(300, (index * 5) + complexityReputation)
    };
}
function createScenarioLevelObjective(scenario) {
    if (!scenario || !Array.isArray(scenario.winCriteria)) {
        return null;
    }
    const requiredDischarges = scenarioWinCriterionValue(scenario, "cures");
    const minimumCash = scenarioWinCriterionValue(scenario, "balance");
    const minimumReputation = scenarioWinCriterionValue(scenario, "reputation");
    const minimumTreatmentPercentage = scenarioWinCriterionValue(scenario, "percentage-treated");
    const minimumHospitalValue = scenarioWinCriterionValue(scenario, "hospital-value");
    const bankruptcyCashThreshold = scenarioLoseCriterionValue(scenario, "balance");
    const reputationFailureThreshold = scenarioLoseCriterionValue(scenario, "reputation");
    const maximumDeaths = scenarioLoseCriterionValue(scenario, "deaths");
    if (requiredDischarges === null &&
        minimumCash === null &&
        minimumReputation === null &&
        minimumTreatmentPercentage === null &&
        minimumHospitalValue === null &&
        bankruptcyCashThreshold === null &&
        reputationFailureThreshold === null &&
        maximumDeaths === null) {
        return null;
    }
    return {
        requiredDischarges: Math.max(0, requiredDischarges ?? 0),
        minimumCash: Math.max(0, minimumCash ?? 0),
        minimumReputation: Math.max(1, minimumReputation ?? 1),
        minimumTreatmentPercentage: clamp(minimumTreatmentPercentage ?? 0, 0, 100),
        minimumHospitalValue: Math.max(0, minimumHospitalValue ?? 0),
        bankruptcyCashThreshold: bankruptcyCashThreshold ?? 0,
        reputationFailureThreshold: Math.max(0, reputationFailureThreshold ?? 0),
        maximumDeaths: maximumDeaths ?? Number.POSITIVE_INFINITY
    };
}
function scenarioWinCriterionValue(scenario, metric) {
    const criterion = scenario.winCriteria.find((entry) => entry.metric === metric && entry.comparison === "at-least");
    return Number.isFinite(criterion?.value) ? criterion.value : null;
}
function scenarioLoseCriterionValue(scenario, metric) {
    const criterion = scenario.loseCriteria.find((entry) => entry.metric === metric);
    return Number.isFinite(criterion?.value) ? criterion.value : null;
}
export function formatLevelObjectiveSafety(telemetry) {
    const parts = [
        `cash > ${telemetry.levelObjectiveBankruptcyCashThreshold ?? telemetry.levelObjectiveMinimumCash}`,
        `reputation >= ${telemetry.levelObjectiveMinimumReputation}`
    ];
    if ((telemetry.levelObjectiveMinimumCash ?? 0) > 0) {
        parts.push(`target cash ${telemetry.levelObjectiveMinimumCash}`);
    }
    if ((telemetry.levelObjectiveReputationFailureThreshold ?? 0) > 0) {
        parts.push(`reputation > ${telemetry.levelObjectiveReputationFailureThreshold}`);
    }
    if ((telemetry.levelObjectiveMinimumTreatmentPercentage ?? 0) > 0) {
        parts.push(`treated ${telemetry.levelObjectiveCurrentTreatmentPercentage}/${telemetry.levelObjectiveMinimumTreatmentPercentage}%`);
    }
    if ((telemetry.levelObjectiveMinimumHospitalValue ?? 0) > 0) {
        parts.push(`value ${telemetry.levelObjectiveCurrentHospitalValue}/${telemetry.levelObjectiveMinimumHospitalValue}`);
    }
    if (Number.isFinite(telemetry.levelObjectiveMaximumDeaths)) {
        parts.push(`deaths <= ${telemetry.levelObjectiveMaximumDeaths} (${telemetry.levelObjectiveRemainingDeaths} left)`);
    }
    return `Safety: ${parts.join(", ")}`;
}
export function formatLevelObjectiveStatus(telemetry) {
    return `Level status: ${telemetry.levelObjectiveStatus}`;
}
export function formatLevelObjectiveProgress(telemetry) {
    const completedDischarges = Math.max(0, telemetry.levelObjectiveRequiredDischarges - telemetry.levelObjectiveRemainingDischarges);
    const parts = [`discharge ${completedDischarges}/${telemetry.levelObjectiveRequiredDischarges}`];
    if ((telemetry.levelObjectiveMinimumCash ?? 0) > 0) {
        parts.push(`cash ${telemetry.cash}/${telemetry.levelObjectiveMinimumCash}`);
    }
    if ((telemetry.levelObjectiveMinimumReputation ?? 0) > 1 || telemetry.scenarioInitialCash !== null && telemetry.scenarioInitialCash !== undefined) {
        parts.push(`reputation ${telemetry.reputation}/${telemetry.levelObjectiveMinimumReputation}`);
    }
    if ((telemetry.levelObjectiveMinimumTreatmentPercentage ?? 0) > 0) {
        parts.push(`treated ${telemetry.levelObjectiveCurrentTreatmentPercentage}/${telemetry.levelObjectiveMinimumTreatmentPercentage}%`);
    }
    if ((telemetry.levelObjectiveMinimumHospitalValue ?? 0) > 0) {
        parts.push(`value ${telemetry.levelObjectiveCurrentHospitalValue}/${telemetry.levelObjectiveMinimumHospitalValue}`);
    }
    return `Objective: ${parts.join(", ")}`;
}
function formatStaffMarketCount(value) {
    return value === Number.POSITIVE_INFINITY ? "unlimited" : String(value);
}
export function formatStaffMarketStatus(telemetry) {
    const doctorMix = telemetry.scenarioStaffMarketConsultantRate !== null || telemetry.scenarioStaffMarketJuniorRate !== null
        ? `, consultants ${telemetry.scenarioStaffMarketConsultantRate ?? "n/a"}, juniors ${telemetry.scenarioStaffMarketJuniorRate ?? "n/a"}`
        : "";
    const receptionistMix = telemetry.staffMarketReceptionistsAvailable !== Number.POSITIVE_INFINITY
        ? `, receptionists ${formatStaffMarketCount(telemetry.staffMarketReceptionistsAvailable)}`
        : "";
    const specialtyMix = telemetry.scenarioStaffMarketShrinkRate !== null || telemetry.scenarioStaffMarketSurgeonRate !== null || telemetry.scenarioStaffMarketResearcherRate !== null
        ? `, psych ${telemetry.scenarioStaffMarketShrinkRate ?? "n/a"}, surgeons ${telemetry.scenarioStaffMarketSurgeonRate ?? "n/a"}, researchers ${telemetry.scenarioStaffMarketResearcherRate ?? "n/a"}`
        : "";
    const scenarioSchedule = telemetry.scenarioStaffMarketMonth !== null || telemetry.scenarioStaffMarketSeed !== null
        ? `; scenario staff month ${telemetry.scenarioStaffMarketMonth ?? "default"}, seed ${telemetry.scenarioStaffMarketSeed ?? "default"}`
        : "";
    const scenarioReceptionists = telemetry.scenarioStaffMarketReceptionists !== null && telemetry.scenarioStaffMarketReceptionists !== undefined
        ? `, receptionists target ${telemetry.scenarioStaffMarketReceptionists}`
        : "";
    return `Staff market: doctors ${formatStaffMarketCount(telemetry.staffMarketDoctorsAvailable)}, nurses ${formatStaffMarketCount(telemetry.staffMarketNursesAvailable)}, handymen ${formatStaffMarketCount(telemetry.staffMarketHandymenAvailable)}${receptionistMix}${doctorMix}${specialtyMix}${scenarioReceptionists}${scenarioSchedule}`;
}
export function formatRoomAvailabilityStatus(value, languageSummary = null) {
    if (value === "unrestricted") {
        return "unrestricted";
    }
    return value.split(",").map((roomType) => roomTypeDisplayName(roomType.trim(), languageSummary)).join(", ");
}
export function formatRoomAvailabilityHudStatus(telemetry, languageSummary = null) {
    return `Room availability: ${formatRoomAvailabilityStatus(telemetry.roomAvailabilityStatus, languageSummary)}`;
}
export function formatObjectAvailabilityStatus(telemetry, scenario = null, languageSummary = null) {
    const base = `Object availability: ${telemetry.scenarioObjectAvailableCount}/${telemetry.scenarioObjectAvailabilityCount} available, locked ${telemetry.scenarioObjectLockedCount}, disabled ${telemetry.scenarioObjectDisabledCount}, research ${telemetry.scenarioObjectResearchLockedCount}`;
    const details = scenarioObjectAvailabilityDetails(scenario, languageSummary, telemetry);
    return details ? `${base}; ${details}` : base;
}
function scenarioObjectAvailabilityDetails(scenario, languageSummary, telemetry = {}) {
    const objectAvailability = scenario?.objectAvailability;
    if (!Array.isArray(objectAvailability) || objectAvailability.length === 0) {
        return "";
    }
    const available = [];
    const locked = [];
    const research = [];
    const disabled = [];
    const diagnosisResearchRequired = scenarioDiagnosisResearchRequired(scenario);
    const showResearchLocked = (telemetry.scenarioObjectResearchLockedCount ?? 0) > 0;
    const availableIndices = scenarioObjectIndexSet(telemetry.scenarioObjectAvailableIndices);
    const lockedIndices = scenarioObjectIndexSet(telemetry.scenarioObjectLockedIndices);
    const disabledIndices = scenarioObjectIndexSet(telemetry.scenarioObjectDisabledIndices);
    const researchLockedIndices = scenarioObjectIndexSet(telemetry.scenarioObjectResearchLockedIndices);
    const hasTelemetryBuckets = availableIndices !== null || lockedIndices !== null || disabledIndices !== null || researchLockedIndices !== null;
    const orderedObjects = [
        ...objectAvailability.filter((object) => typeof object.roomType === "string" && object.roomType.length > 0),
        ...objectAvailability.filter((object) => !(typeof object.roomType === "string" && object.roomType.length > 0))
    ];
    for (const object of orderedObjects) {
        const name = scenarioObjectDisplayName(object, languageSummary);
        if (hasTelemetryBuckets && disabledIndices?.has(object.index)) {
            disabled.push(name);
        }
        else if (hasTelemetryBuckets && availableIndices?.has(object.index)) {
            available.push(name);
        }
        else if (hasTelemetryBuckets && researchLockedIndices?.has(object.index)) {
            research.push(name);
        }
        else if (hasTelemetryBuckets && lockedIndices?.has(object.index)) {
            locked.push(name);
        }
        else if (object.availableForLevel === false) {
            disabled.push(name);
        }
        else if (object.startAvailable === true) {
            available.push(name);
        }
        else if (showResearchLocked &&
            object.roomType === "diagnosis" &&
            diagnosisResearchRequired !== null) {
            research.push(name);
        }
        else {
            locked.push(name);
        }
    }
    return [
        objectAvailabilityNameList("available", available),
        objectAvailabilityNameList("locked", locked),
        objectAvailabilityNameList("research", research),
        objectAvailabilityNameList("disabled", disabled)
    ].filter(Boolean).join("; ");
}
function scenarioObjectIndexSet(indices) {
    if (!Array.isArray(indices)) {
        return null;
    }
    return new Set(indices.filter((index) => Number.isInteger(index)));
}
function objectAvailabilityNameList(label, names) {
    if (names.length === 0) {
        return "";
    }
    const visibleNames = names.slice(0, 3).join(", ");
    const remaining = names.length > 3 ? ` +${names.length - 3}` : "";
    return `${label}: ${visibleNames}${remaining}`;
}
function scenarioObjectDisplayName(object, languageSummary) {
    if (typeof object?.name === "string" && object.name.length > 0) {
        return object.name;
    }
    const importedName = Number.isInteger(object?.index) ? languageSummary?.objectNames?.[object.index] : null;
    if (typeof importedName === "string" && importedName.length > 0) {
        return importedName;
    }
    return Number.isInteger(object?.index) ? `object ${object.index}` : "object";
}
function scenarioObjectAvailabilityBucket(object, telemetry = {}, scenario = null) {
    const availableIndices = scenarioObjectIndexSet(telemetry.scenarioObjectAvailableIndices);
    const lockedIndices = scenarioObjectIndexSet(telemetry.scenarioObjectLockedIndices);
    const disabledIndices = scenarioObjectIndexSet(telemetry.scenarioObjectDisabledIndices);
    const researchLockedIndices = scenarioObjectIndexSet(telemetry.scenarioObjectResearchLockedIndices);
    if (disabledIndices?.has(object.index)) {
        return "disabled";
    }
    if (availableIndices?.has(object.index)) {
        return "available";
    }
    if (researchLockedIndices?.has(object.index)) {
        return "research";
    }
    if (lockedIndices?.has(object.index)) {
        return "locked";
    }
    const diagnosisResearchRequired = scenarioDiagnosisResearchRequired(scenario);
    if (object.availableForLevel === false) {
        return "disabled";
    }
    if (object.startAvailable === true) {
        return "available";
    }
    if (object.roomType === "diagnosis" && diagnosisResearchRequired !== null) {
        return "research";
    }
    return "locked";
}
function scenarioCorridorObjects(scenario) {
    const objectAvailability = scenario?.objectAvailability;
    if (!Array.isArray(objectAvailability) || objectAvailability.length === 0) {
        return [];
    }
    return objectAvailability.filter((object) => typeof object.roomType !== "string" || object.roomType.length === 0);
}
export function formatFurnishCorridorPanelEmptyStatus() {
    return "No corridor objects imported for this level.";
}
export function formatFurnishCorridorRowsHtml(scenario, telemetry = {}, languageSummary = null) {
    const corridorObjects = scenarioCorridorObjects(scenario);
    if (corridorObjects.length === 0) {
        return `<p data-testid="furnish-corridor-panel-empty" style="margin:0 0 8px; font-size:13px;">${formatFurnishCorridorPanelEmptyStatus()}</p>`;
    }
    return corridorObjects
        .map((object) => {
        const name = scenarioObjectDisplayName(object, languageSummary);
        const bucket = scenarioObjectAvailabilityBucket(object, telemetry, scenario);
        const cost = Number.isFinite(object.startCost) ? ` - ${object.startCost}` : "";
        const strength = Number.isFinite(object.startStrength) ? object.startStrength : 0;
        return `<button type="button" data-testid="furnish-corridor-object" data-object-index="${escapeHtml(String(object.index ?? ""))}" data-object-name="${escapeHtml(name)}" data-object-cost="${escapeHtml(String(Number.isFinite(object.startCost) ? object.startCost : 0))}" data-object-strength="${escapeHtml(String(strength))}" data-object-status="${escapeHtml(bucket)}" ${bucket === "available" ? "" : "disabled"} style="display:block; width:100%; margin:0 0 6px; text-align:left;">${escapeHtml(name)}${escapeHtml(cost)} (${escapeHtml(bucket)})</button>`;
    })
        .join("");
}
export function formatFurnishCorridorSummary(scenario, telemetry = {}) {
    const corridorObjects = scenarioCorridorObjects(scenario);
    if (corridorObjects.length === 0) {
        return "Corridor objects: none imported";
    }
    const counts = corridorObjects.reduce((accumulator, object) => {
        const bucket = scenarioObjectAvailabilityBucket(object, telemetry, scenario);
        accumulator[bucket] = (accumulator[bucket] ?? 0) + 1;
        return accumulator;
    }, {});
    return `Corridor objects: ${counts.available ?? 0}/${corridorObjects.length} available, locked ${counts.locked ?? 0}, research ${counts.research ?? 0}, disabled ${counts.disabled ?? 0}`;
}
function formatScenarioAwardSuffix(telemetry) {
    if (!telemetry.scenarioAwardCriteriaSummary || telemetry.scenarioAwardCriteriaSummary === "none") {
        return "";
    }
    const pending = telemetry.scenarioAwardCriteriaMet ? "" : `, pending ${telemetry.scenarioAwardCriteriaUnmetSummary}`;
    const poorThresholds = telemetry.scenarioAwardPoorCriteriaSummary && telemetry.scenarioAwardPoorCriteriaSummary !== "none"
        ? `, poor thresholds ${telemetry.scenarioAwardPoorCriteriaSummary}`
        : "";
    const poor = telemetry.scenarioAwardPoorCriteriaTriggered
        ? `, poor ${telemetry.scenarioAwardPoorCriteriaTriggeredSummary}`
        : "";
    return `, scenario ${telemetry.scenarioAwardCriteriaSummary}${pending}${poorThresholds}${poor}`;
}
function formatCampaignProgress(view, telemetry = null) {
    const total = Array.isArray(view?.mapSummaries) && view.mapSummaries.length > 0 ? view.mapSummaries.length : 1;
    const scenarioName = telemetry?.scenarioLevelName ? ` (${telemetry.scenarioLevelName})` : "";
    return `Campaign: level ${campaignLevelIndex(view) + 1}/${total}${scenarioName}`;
}
function bestStaffRestType(telemetry) {
    const options = [
        ["snooker", telemetry.scenarioStaffRestSnooker],
        ["game", telemetry.scenarioStaffRestGame],
        ["sofa", telemetry.scenarioStaffRestSofa],
        ["standing", telemetry.scenarioStaffRestStanding]
    ];
    return options.find(([, value]) => Number.isInteger(value) && value > 0)?.[0] ?? "standing";
}
function createInitialCashFromScenario(scenario) {
    const startCash = scenario?.financialSettings?.startCash;
    return Number.isFinite(startCash) ? startCash : null;
}
function createScenarioLevelNameFromScenario(scenario) {
    const title = scenario?.title;
    if (typeof title === "string" && title.trim().length > 0) {
        return title.trim();
    }
    const name = scenario?.financialSettings?.name;
    return typeof name === "string" && name.trim().length > 0 ? name.trim() : null;
}
function createLoanInterestPerChunkFromScenario(scenario) {
    const interestRate = scenario?.financialSettings?.interestRate;
    return Number.isFinite(interestRate) ? Math.max(0, Math.round(interestRate / 100)) : null;
}
function createScenarioIllnessRateFromScenario(scenario) {
    const illnessRate = scenario?.financialSettings?.illnessRate;
    return Number.isFinite(illnessRate) ? illnessRate : null;
}
function createRestoreOptionsFromHospitalView(view) {
    const terrain = createSimulationTerrainFromHospitalView(view);
    const admissionPoints = createAdmissionPointsFromHospitalView(view);
    const currentMap = campaignMapSummaryAt(view, campaignLevelIndex(view));
    const initialCash = createInitialCashFromScenario(currentMap?.scenario);
    const scenarioLevelName = createScenarioLevelNameFromScenario(currentMap?.scenario);
    const loanInterestPerChunk = createLoanInterestPerChunkFromScenario(currentMap?.scenario);
    const scenarioIllnessRate = createScenarioIllnessRateFromScenario(currentMap?.scenario);
    const populationSchedule = currentMap?.scenario?.populationSchedule;
    const diseasePool = currentMap?.scenario?.diseasePool;
    const staffMarketSchedule = currentMap?.scenario?.staffLevels;
    const roomAvailability = createRoomAvailabilityFromScenario(currentMap?.scenario);
    const roomAvailabilitySchedule = createRoomAvailabilityScheduleFromScenario(currentMap?.scenario);
    const objectAvailability = currentMap?.scenario?.objectAvailability;
    const roomCostOverrides = currentMap?.scenario?.roomCostOverrides;
    const roomWearThresholdOverrides = createRoomWearThresholdOverridesFromScenario(currentMap?.scenario);
    const staffWageOverrides = currentMap?.scenario?.staffWageOverrides;
    const admissionRules = currentMap?.scenario?.admissionRules;
    const researchSettings = currentMap?.scenario?.researchSettings;
    const trainingSettings = currentMap?.scenario?.trainingSettings;
    const epidemicSettings = currentMap?.scenario?.epidemicSettings;
    const landSettings = currentMap?.scenario?.landSettings;
    const staffFatigueSettings = currentMap?.scenario?.staffFatigueSettings;
    const patientBehaviorSettings = currentMap?.scenario?.patientBehaviorSettings;
    const salarySettings = currentMap?.scenario?.salarySettings;
    const allocationSettings = currentMap?.scenario?.allocationSettings;
    const routingSettings = currentMap?.scenario?.routingSettings;
    const eventSettings = currentMap?.scenario?.eventSettings;
    const awardCriteria = currentMap?.scenario?.awardCriteria;
    const emergencySchedule = currentMap?.scenario?.emergencySchedule;
    const quakeSchedule = currentMap?.scenario?.quakeSchedule;
    const expertise = currentMap?.scenario?.expertise;
    const scenarioOpponents = currentMap?.scenario?.scenarioOpponents;
    const networkCriteria = currentMap?.scenario?.networkCriteria;
    return {
        ...(terrain ? { terrain } : {}),
        ...(admissionPoints ? { admissionPoints } : {}),
        ...(initialCash !== null ? { initialCash } : {}),
        ...(scenarioLevelName !== null ? { scenarioLevelName } : {}),
        ...(loanInterestPerChunk !== null ? { loanInterestPerChunk } : {}),
        ...(scenarioIllnessRate !== null ? { scenarioIllnessRate } : {}),
        levelObjective: createCampaignLevelObjectiveFromHospitalView(view),
        ...(Array.isArray(populationSchedule) && populationSchedule.length > 0 ? { populationSchedule } : {}),
        ...(Array.isArray(diseasePool) && diseasePool.length > 0 ? { diseasePool } : {}),
        ...(Array.isArray(staffMarketSchedule) && staffMarketSchedule.length > 0 ? { staffMarketSchedule } : {}),
        ...(Array.isArray(roomAvailability) && roomAvailability.length > 0 ? { roomAvailability } : {}),
        ...(Array.isArray(roomAvailabilitySchedule) && roomAvailabilitySchedule.length > 0 ? { roomAvailabilitySchedule } : {}),
        ...(Array.isArray(objectAvailability) && objectAvailability.length > 0 ? { objectAvailability } : {}),
        ...(roomCostOverrides && Object.keys(roomCostOverrides).length > 0 ? { roomCostOverrides } : {}),
        ...(roomWearThresholdOverrides && Object.keys(roomWearThresholdOverrides).length > 0 ? { roomWearThresholdOverrides } : {}),
        ...(staffWageOverrides && Object.keys(staffWageOverrides).length > 0 ? { staffWageOverrides } : {}),
        ...(admissionRules && Object.keys(admissionRules).length > 0 ? { admissionRules } : {}),
        ...(researchSettings && Object.keys(researchSettings).length > 0 ? { researchSettings } : {}),
        ...(trainingSettings && Object.keys(trainingSettings).length > 0 ? { trainingSettings } : {}),
        ...(epidemicSettings && Object.keys(epidemicSettings).length > 0 ? { epidemicSettings } : {}),
        ...(landSettings && Object.keys(landSettings).length > 0 ? { landSettings } : {}),
        ...(staffFatigueSettings && Object.keys(staffFatigueSettings).length > 0 ? { staffFatigueSettings } : {}),
        ...(patientBehaviorSettings && Object.keys(patientBehaviorSettings).length > 0 ? { patientBehaviorSettings } : {}),
        ...(salarySettings && Object.keys(salarySettings).length > 0 ? { salarySettings } : {}),
        ...(allocationSettings && Object.keys(allocationSettings).length > 0 ? { allocationSettings } : {}),
        ...(routingSettings && Object.keys(routingSettings).length > 0 ? { routingSettings } : {}),
        ...(eventSettings && Object.keys(eventSettings).length > 0 ? { eventSettings } : {}),
        ...(awardCriteria && Object.keys(awardCriteria).length > 0 ? { awardCriteria } : {}),
        ...(Array.isArray(emergencySchedule) && emergencySchedule.length > 0 ? { emergencySchedule } : {}),
        ...(Array.isArray(quakeSchedule) && quakeSchedule.length > 0 ? { quakeSchedule } : {}),
        ...(Array.isArray(expertise) && expertise.length > 0 ? { expertise } : {}),
        ...(Array.isArray(scenarioOpponents) && scenarioOpponents.length > 0 ? { scenarioOpponents } : {}),
        ...(Array.isArray(networkCriteria) && networkCriteria.length > 0 ? { networkCriteria } : {})
    };
}
export function createRoomAvailabilityFromScenario(scenario) {
    const objectAvailability = scenario?.objectAvailability;
    if (!Array.isArray(objectAvailability) || objectAvailability.length === 0) {
        return null;
    }
    const roomTypes = [];
    for (const object of objectAvailability) {
        if (object.availableForLevel !== false && object.startAvailable === true && typeof object.roomType === "string" && !roomTypes.includes(object.roomType)) {
            roomTypes.push(object.roomType);
        }
    }
    return roomTypes;
}
export function createRoomAvailabilityScheduleFromScenario(scenario) {
    const objectAvailability = scenario?.objectAvailability;
    if (!Array.isArray(objectAvailability) || objectAvailability.length === 0) {
        return [];
    }
    const diagnosisResearchRequired = scenarioDiagnosisResearchRequired(scenario);
    return objectAvailability
        .filter((object) => typeof object.roomType === "string")
        .map((object) => ({
        index: object.index,
        roomType: object.roomType,
        startAvailable: object.startAvailable === true,
        whenAvailable: Number.isInteger(object.whenAvailable) ? object.whenAvailable : 0,
        availableForLevel: object.availableForLevel !== false,
        ...(object.roomType === "diagnosis" && object.startAvailable !== true && diagnosisResearchRequired !== null
            ? { researchRequired: diagnosisResearchRequired, expertiseCategory: "DIAGNOSIS" }
            : {})
    }));
}
function scenarioDiagnosisResearchRequired(scenario) {
    const expertise = scenario?.expertise;
    if (!Array.isArray(expertise)) {
        return null;
    }
    const requirements = expertise
        .filter((entry) => entry.category === "DIAGNOSIS" && entry.known !== true && Number.isInteger(entry.researchRequired) && entry.researchRequired > 0)
        .map((entry) => entry.researchRequired);
    return requirements.length === 0 ? null : Math.min(...requirements);
}
export function createRoomWearThresholdOverridesFromScenario(scenario) {
    const objectAvailability = scenario?.objectAvailability;
    if (!Array.isArray(objectAvailability) || objectAvailability.length === 0) {
        return {};
    }
    const maxObjectStrength = scenario?.researchSettings?.maxObjectStrength;
    const overrides = {};
    for (const object of objectAvailability) {
        if (object.availableForLevel === false || typeof object.roomType !== "string" || !Number.isInteger(object.startStrength) || object.startStrength <= 0) {
            continue;
        }
        const strength = Number.isInteger(maxObjectStrength) && maxObjectStrength > 0
            ? Math.min(object.startStrength, maxObjectStrength)
            : object.startStrength;
        const current = overrides[object.roomType];
        overrides[object.roomType] = current === undefined ? strength : Math.min(current, strength);
    }
    return overrides;
}
function moveHospitalCamera(view, deltaX, deltaY) {
    if (!view?.map) {
        return;
    }
    view.startX = clamp(view.startX + deltaX, 0, Math.max(0, view.map.width - view.tileColumns));
    view.startY = clamp(view.startY + deltaY, 0, Math.max(0, view.map.height - view.tileRows));
}
function tileToHospitalScreen(view, tile) {
    const localX = tile.x - view.startX;
    const localY = tile.y - view.startY;
    return {
        x: Math.round(view.originX + (localX - localY) * HOSPITAL_ISO_TILE_HALF_WIDTH),
        y: Math.round(view.originY + (localX + localY) * HOSPITAL_ISO_TILE_HALF_HEIGHT + HOSPITAL_ISO_TILE_HALF_HEIGHT)
    };
}
function isTileVisible(view, tile) {
    return (tile.x >= view.startX &&
        tile.y >= view.startY &&
        tile.x < view.startX + view.tileColumns &&
        tile.y < view.startY + view.tileRows);
}
function resolveHospitalTileFromCanvasPoint(view, point) {
    if (!view?.map) {
        return null;
    }
    const isoX = (point.x - view.originX) / HOSPITAL_ISO_TILE_HALF_WIDTH;
    const isoY = (point.y - view.originY) / HOSPITAL_ISO_TILE_HALF_HEIGHT;
    const localX = Math.floor((isoY + isoX) / 2);
    const localY = Math.floor((isoY - isoX) / 2);
    const x = clamp(view.startX + localX, 0, view.map.width - 1);
    const y = clamp(view.startY + localY, 0, view.map.height - 1);
    return { x, y };
}
function canvasPointerFromEvent(event, canvas) {
    const rect = canvas.getBoundingClientRect();
    return {
        x: Math.round((event.clientX - rect.left) * canvas.width / rect.width),
        y: Math.round((event.clientY - rect.top) * canvas.height / rect.height)
    };
}
function isTextEditingKeyboardTarget(target) {
    if (!target) {
        return false;
    }
    const tagName = target.tagName;
    return target.isContentEditable === true ||
        tagName === "INPUT" ||
        tagName === "TEXTAREA";
}
function isSelectKeyboardTarget(target) {
    return target?.tagName === "SELECT";
}
function shouldSuppressAppShortcut(event, action) {
    if (isTextEditingKeyboardTarget(event.target)) {
        return true;
    }
    if (!isSelectKeyboardTarget(event.target)) {
        return false;
    }
    if (!action) {
        return true;
    }
    if (action.action === "pause-toggle" && action.source === "Space") {
        return true;
    }
    return action.action === "camera-west" ||
        action.action === "camera-east" ||
        action.action === "camera-north" ||
        action.action === "camera-south";
}
function drawDiamond(context, center, color) {
    context.save();
    context.strokeStyle = color;
    context.lineWidth = 2;
    context.beginPath();
    context.moveTo(center.x, center.y - HOSPITAL_ISO_TILE_HALF_HEIGHT);
    context.lineTo(center.x + HOSPITAL_ISO_TILE_HALF_WIDTH, center.y);
    context.lineTo(center.x, center.y + HOSPITAL_ISO_TILE_HALF_HEIGHT);
    context.lineTo(center.x - HOSPITAL_ISO_TILE_HALF_WIDTH, center.y);
    context.closePath();
    context.stroke();
    context.restore();
}
function drawIsoTileOverlay(context, center, color, fillAlpha = 0.26) {
    context.save();
    context.fillStyle = color;
    context.strokeStyle = color;
    context.globalAlpha = fillAlpha;
    context.beginPath();
    context.moveTo(center.x, center.y - HOSPITAL_ISO_TILE_HALF_HEIGHT);
    context.lineTo(center.x + HOSPITAL_ISO_TILE_HALF_WIDTH, center.y);
    context.lineTo(center.x, center.y + HOSPITAL_ISO_TILE_HALF_HEIGHT);
    context.lineTo(center.x - HOSPITAL_ISO_TILE_HALF_WIDTH, center.y);
    context.closePath();
    context.fill();
    context.globalAlpha = 0.95;
    context.lineWidth = 2;
    context.stroke();
    context.restore();
}
function drawPlacementPreview(context, placementPreview, view) {
    if (!placementPreview) {
        return;
    }
    const color = placementPreview.valid ? "#57d68d" : "#e46161";
    const tiles = placementPreview.tiles?.length
        ? placementPreview.tiles
        : placementPreview.position
            ? [placementPreview.position]
            : [];
    for (const tile of tiles) {
        if (!isTileVisible(view, tile)) {
            continue;
        }
        drawIsoTileOverlay(context, tileToHospitalScreen(view, tile), color, placementPreview.valid ? 0.24 : 0.32);
    }
    if ((placementPreview.action === "hire-staff" || placementPreview.action === "move-staff") &&
        placementPreview.position &&
        isTileVisible(view, placementPreview.position)) {
        drawStaffMarker(context, {
            role: placementPreview.role,
            status: placementPreview.valid ? "active" : "blocked"
        }, tileToHospitalScreen(view, placementPreview.position));
    }
    if (placementPreview.action === "place-object" &&
        placementPreview.position &&
        isTileVisible(view, placementPreview.position)) {
        drawObjectMarker(context, {
            objectIndex: placementPreview.objectIndex,
            orientation: placementPreview.orientation
        }, tileToHospitalScreen(view, placementPreview.position));
    }
}
function drawSelectionOverlay(context, selectedEntity, state, view) {
    const resolved = selectedEntityFromState(state, selectedEntity);
    if (!resolved) {
        return;
    }
    if (resolved.type === "room") {
        for (const tile of resolved.value.tiles ?? [resolved.value.position]) {
            if (!isTileVisible(view, tile)) {
                continue;
            }
            drawIsoTileOverlay(context, tileToHospitalScreen(view, tile), "#f5f0a3", 0.12);
        }
        return;
    }
    if (resolved.type === "object") {
        if (isTileVisible(view, resolved.value.position)) {
            drawDiamond(context, tileToHospitalScreen(view, resolved.value.position), "#f5f0a3");
        }
        return;
    }
    const position = resolved.type === "staff" ? resolved.value.position : patientPosition(resolved.value);
    if (isTileVisible(view, position)) {
        drawDiamond(context, tileToHospitalScreen(view, position), "#f5f0a3");
    }
}
function drawPatientMarker(context, patient, center) {
    const color = PATIENT_STATUS_COLORS[patient.status] ?? "#ffffff";
    const critical = Number.isFinite(patient.health) && Number.isFinite(patient.maxHealth) && patient.health <= Math.max(1, Math.floor(patient.maxHealth * 0.25));
    const emergency = Number.isInteger(patient.emergencyWaveId);
    const epidemic = Number.isInteger(patient.epidemicOutbreakId);
    const insurance = Number.isInteger(patient.insuranceContractId);
    context.save();
    context.fillStyle = color;
    context.strokeStyle = emergency ? "#ffdf5d" : epidemic ? "#72f2c2" : insurance ? "#7eb6ff" : critical ? "#ff4f5e" : "#102027";
    context.lineWidth = emergency || epidemic || insurance || critical ? 3 : 2;
    context.beginPath();
    context.arc(center.x, center.y - 14, 7, 0, Math.PI * 2);
    context.fill();
    context.stroke();
    context.fillStyle = "#ffffff";
    context.font = "11px system-ui, sans-serif";
    context.textAlign = "center";
    context.textBaseline = "middle";
    context.fillText(String(patient.severity), center.x, center.y - 14);
    context.restore();
}
function drawPatientRoute(context, patient, view) {
    const path = patient.movement?.path ?? [];
    if (path.length < 2) {
        return;
    }
    context.save();
    context.strokeStyle = PATIENT_STATUS_COLORS[patient.status] ?? "#ffffff";
    context.globalAlpha = 0.72;
    context.lineWidth = 2;
    context.beginPath();
    path.forEach((tile, index) => {
        const center = tileToHospitalScreen(view, tile);
        if (index === 0) {
            context.moveTo(center.x, center.y - 14);
            return;
        }
        context.lineTo(center.x, center.y - 14);
    });
    context.stroke();
    context.restore();
}
function drawRoomMarker(context, room, view) {
    const color = ROOM_TYPE_COLORS[room.roomType] ?? "#ffffff";
    context.save();
    context.globalAlpha = room.status === "open" ? 0.72 : 0.36;
    context.fillStyle = color;
    context.strokeStyle = room.status === "open" ? "#ffffff" : "#8c969a";
    context.lineWidth = 2;
    for (const tile of room.tiles ?? [room.position]) {
        if (!isTileVisible(view, tile)) {
            continue;
        }
        const center = tileToHospitalScreen(view, tile);
        context.beginPath();
        context.moveTo(center.x, center.y - HOSPITAL_ISO_TILE_HALF_HEIGHT);
        context.lineTo(center.x + HOSPITAL_ISO_TILE_HALF_WIDTH, center.y);
        context.lineTo(center.x, center.y + HOSPITAL_ISO_TILE_HALF_HEIGHT);
        context.lineTo(center.x - HOSPITAL_ISO_TILE_HALF_WIDTH, center.y);
        context.closePath();
        context.fill();
        context.stroke();
    }
    context.restore();
}
function drawStaffMarker(context, staff, center) {
    const color = staffRoleMarkerColor(staff.role);
    context.save();
    context.fillStyle = color;
    context.strokeStyle = staff.trainingRemainingTicks > 0 ? "#ffdf5d" : staff.status === "active" ? "#102027" : "#9b3131";
    context.lineWidth = staff.trainingRemainingTicks > 0 ? 3 : 2;
    context.beginPath();
    context.rect(center.x - 6, center.y - 30, 12, 12);
    context.fill();
    context.stroke();
    context.restore();
}
export function staffRoleMarkerColor(role) {
    return STAFF_ROLE_COLORS[role] ?? "#ffffff";
}
function drawObjectMarker(context, object, center) {
    const orientation = object.orientation ?? "north";
    const direction = {
        north: { x: 0, y: -1 },
        east: { x: 1, y: 0 },
        south: { x: 0, y: 1 },
        west: { x: -1, y: 0 }
    }[orientation] ?? { x: 0, y: -1 };
    context.save();
    context.fillStyle = "#d7c27a";
    context.strokeStyle = "#102027";
    context.lineWidth = 2;
    context.beginPath();
    context.rect(center.x - 5, center.y - 17, 10, 10);
    context.fill();
    context.stroke();
    context.fillStyle = "#102027";
    context.beginPath();
    context.arc(center.x + direction.x * 8, center.y - 12 + direction.y * 8, 2.5, 0, Math.PI * 2);
    context.fill();
    context.fillStyle = "#102027";
    context.font = "9px system-ui, sans-serif";
    context.textAlign = "center";
    context.textBaseline = "middle";
    context.fillText(String(object.objectIndex ?? "?"), center.x, center.y - 12);
    context.restore();
}
function patientRenderPosition(patient) {
    return patient.position;
}
export function formatHospitalCanvasSummary(view, state, frameStats) {
    const placedObjects = state.entities.objects?.length ?? 0;
    return `${view.mapPath} viewport ${view.startX},${view.startY}; zoom ${formatHospitalZoomLevel(view)}; transparent walls ${view.transparentWalls ? "yes" : "no"}; patients ${state.patientsWaiting}; rooms ${state.entities.rooms.length}; staff ${state.entities.staff.length}; floor ${frameStats.floorSpriteCount}; walls ${frameStats.wallSpriteCount}; objects ${frameStats.objectSpriteCount}; placed objects ${placedObjects}`;
}
export function formatOriginalUiStripSummary(view, visibleSpriteCount, controls = []) {
    const sheetPath = view.originalUiSpriteSheetPath || "imported sheet";
    const controlSummary = controls.length > 0
        ? `; controls ${controls.map((control) => control.label).join(", ")}`
        : "";
    if (visibleSpriteCount === 0) {
        return `Original UI: ${sheetPath} ${view.originalUiSpriteSheet.spriteCount} sprites, none visible`;
    }
    return `Original UI: ${sheetPath} ${view.originalUiSpriteSheet.spriteCount} sprites, showing ${visibleSpriteCount}${controlSummary}`;
}
export function formatCanvasUnavailableStatus() {
    return "Canvas unavailable";
}
export function formatImportedMapUnavailableStatus() {
    return "Imported map renderer unavailable";
}
export function formatOriginalUiCanvasUnavailableStatus() {
    return "Original UI: canvas unavailable";
}
export function formatOriginalUiNoSpritesStatus() {
    return "Original UI: no imported sprites";
}
function renderHospitalCanvas(canvas, view, orchestrator, selectedTile, placementPreview, selectedEntity) {
    const context = canvas.getContext("2d");
    if (!context) {
        return formatCanvasUnavailableStatus();
    }
    context.clearRect(0, 0, canvas.width, canvas.height);
    if (!view?.map) {
        context.fillStyle = "#1f2a2e";
        context.fillRect(0, 0, canvas.width, canvas.height);
        return formatImportedMapUnavailableStatus();
    }
    const state = orchestrator.getState();
    const frame = renderThemeHospitalMapScene({
        map: view.map,
        palette: view.palette,
        blockSheet: view.blockSheet,
        ...(view.spriteSheet ? { spriteSheet: view.spriteSheet } : {}),
        ...(view.animationSet ? { animationSet: view.animationSet } : {}),
        viewportWidth: canvas.width,
        viewportHeight: canvas.height,
        originX: view.originX,
        originY: view.originY,
        startX: view.startX,
        startY: view.startY,
        tileColumns: view.tileColumns,
        tileRows: view.tileRows,
        wallAlpha: view.transparentWalls ? 0.42 : 1,
        animationFrameStep: state.tick
    });
    context.putImageData(new ImageData(frame.pixels, frame.width, frame.height), 0, 0);
    if (selectedTile && isTileVisible(view, selectedTile)) {
        drawDiamond(context, tileToHospitalScreen(view, selectedTile), "#f3c74f");
    }
    for (const room of state.entities.rooms) {
        drawRoomMarker(context, room, view);
    }
    drawPlacementPreview(context, placementPreview, view);
    for (const staff of state.entities.staff) {
        if (!isTileVisible(view, staff.position)) {
            continue;
        }
        drawStaffMarker(context, staff, tileToHospitalScreen(view, staff.position));
    }
    for (const object of state.entities.objects ?? []) {
        if (!isTileVisible(view, object.position)) {
            continue;
        }
        drawObjectMarker(context, object, tileToHospitalScreen(view, object.position));
    }
    for (const patient of state.entities.waitingPatients) {
        drawPatientRoute(context, patient, view);
        const position = patientRenderPosition(patient);
        if (!isTileVisible(view, position)) {
            continue;
        }
        drawPatientMarker(context, patient, tileToHospitalScreen(view, position));
    }
    drawSelectionOverlay(context, selectedEntity, state, view);
    return formatHospitalCanvasSummary(view, state, frame.stats);
}
function renderOriginalUiStrip(canvas, view) {
    canvas.__originalUiControlZones = [];
    canvas.style.cursor = "default";
    const context = canvas.getContext("2d");
    if (!context) {
        return formatOriginalUiCanvasUnavailableStatus();
    }
    context.clearRect(0, 0, canvas.width, canvas.height);
    context.fillStyle = "#050708";
    context.fillRect(0, 0, canvas.width, canvas.height);
    if (!view?.originalUiSpriteSheet) {
        return formatOriginalUiNoSpritesStatus();
    }
    const visibleSprites = view.originalUiSpriteSheet.sprites
        .filter((sprite) => sprite.width > 0 && sprite.height > 0 && sprite.indices.length > 0)
        .slice(0, ORIGINAL_UI_STRIP_CONTROLS.length);
    if (visibleSprites.length === 0) {
        return formatOriginalUiStripSummary(view, 0);
    }
    const controlZones = createOriginalUiStripControlZones(view, canvas.width, canvas.height);
    canvas.__originalUiControlZones = controlZones;
    canvas.style.cursor = controlZones.length > 0 ? "pointer" : "default";
    const pixels = new Uint8ClampedArray(canvas.width * canvas.height * 4);
    let targetX = 6;
    for (const sprite of visibleSprites) {
        const image = renderThemeHospitalSprite(sprite, view.palette);
        const targetY = Math.max(0, Math.floor((canvas.height - image.height) / 2));
        blitSpriteImage(pixels, canvas.width, canvas.height, image, targetX, targetY);
        targetX += image.width + 6;
        if (targetX >= canvas.width) {
            break;
        }
    }
    context.putImageData(new ImageData(pixels, canvas.width, canvas.height), 0, 0);
    return formatOriginalUiStripSummary(view, visibleSprites.length, controlZones);
}
export function createOriginalUiStripControlZones(view, canvasWidth = 320, canvasHeight = 40) {
    if (!view?.originalUiSpriteSheet) {
        return [];
    }
    const visibleSprites = view.originalUiSpriteSheet.sprites
        .filter((sprite) => sprite.width > 0 && sprite.height > 0 && sprite.indices.length > 0)
        .slice(0, ORIGINAL_UI_STRIP_CONTROLS.length);
    const zones = [];
    let targetX = 6;
    for (let index = 0; index < visibleSprites.length; index += 1) {
        const sprite = visibleSprites[index];
        if (targetX >= canvasWidth) {
            break;
        }
        const targetY = Math.max(0, Math.floor((canvasHeight - sprite.height) / 2));
        zones.push({
            ...ORIGINAL_UI_STRIP_CONTROLS[index],
            left: targetX,
            top: targetY,
            width: Math.min(sprite.width, Math.max(0, canvasWidth - targetX)),
            height: Math.min(sprite.height, canvasHeight - targetY)
        });
        targetX += sprite.width + 6;
    }
    return zones;
}
function originalUiControlZoneAt(canvas, event) {
    const zones = Array.isArray(canvas.__originalUiControlZones) ? canvas.__originalUiControlZones : [];
    if (zones.length === 0) {
        return null;
    }
    const point = canvasPointerFromEvent(event, canvas);
    return zones.find((zone) => point.x >= zone.left &&
        point.x < zone.left + zone.width &&
        point.y >= zone.top &&
        point.y < zone.top + zone.height) ?? null;
}
function blitSpriteImage(targetPixels, targetWidth, targetHeight, image, targetX, targetY) {
    for (let sourceY = 0; sourceY < image.height; sourceY += 1) {
        const y = targetY + sourceY;
        if (y < 0 || y >= targetHeight) {
            continue;
        }
        for (let sourceX = 0; sourceX < image.width; sourceX += 1) {
            const x = targetX + sourceX;
            if (x < 0 || x >= targetWidth) {
                continue;
            }
            const sourceOffset = (sourceY * image.width + sourceX) * 4;
            const alpha = image.pixels[sourceOffset + 3];
            if (alpha === 0) {
                continue;
            }
            const targetOffset = (y * targetWidth + x) * 4;
            targetPixels[targetOffset] = image.pixels[sourceOffset];
            targetPixels[targetOffset + 1] = image.pixels[sourceOffset + 1];
            targetPixels[targetOffset + 2] = image.pixels[sourceOffset + 2];
            targetPixels[targetOffset + 3] = alpha;
        }
    }
}
export function mountAppShell(options) {
    const frameClock = options.frameClock ?? browserFrameClock();
    const audioMixer = options.audioMixer ?? createWebAudioMixer();
    const hospitalView = createImportedHospitalView(options.assetBundle);
    const mapOptions = formatHospitalMapOptionsHtml(hospitalView);
    options.root.innerHTML = `
    <section
      data-testid="phase7-shell"
      style="font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; color: #e7edf0; background: #11181b; min-height: 100vh; padding: 16px; box-sizing: border-box;"
    >
      <header style="display:flex; align-items:flex-start; justify-content:space-between; gap:16px; margin-bottom:12px;">
        <div>
          <h1 style="font-size:24px; line-height:1.2; margin:0 0 4px;">${formatAppTitleLabel()}</h1>
          <p data-testid="hospital-canvas-summary" style="margin:0; color:#a9b7bd; font-size:13px;"></p>
          <p data-testid="hospital-placement-mode" style="margin:2px 0 0; color:#d3c16a; font-size:13px;">${formatPlacementMode(null, null)}</p>
        </div>
        <div data-testid="controls" style="display:flex; flex-wrap:wrap; gap:8px; justify-content:flex-end;">
          <button type="button" data-testid="pause-toggle">${formatPauseToggleLabel({ paused: false })}</button>
          <button type="button" data-testid="step">${formatGameplayActionButtonLabel("step")}</button>
          <label style="display:flex; align-items:center; gap:6px; color:#c8d2d7; font-size:13px;">
            ${formatFieldLabel("speed")}
            <select data-testid="speed-select" aria-label="${formatSelectAriaLabel("speed")}">
              <option value="0.5">0.5x</option>
              <option value="1">1x</option>
              <option value="2">2x</option>
              <option value="4">4x</option>
              <option value="8">8x</option>
            </select>
          </label>
          <button type="button" data-testid="admissions-toggle">${formatAdmissionsToggleLabel({ admissionsOpen: false })}</button>
          <label style="display:flex; align-items:center; gap:6px; color:#c8d2d7; font-size:13px;">
            ${formatFieldLabel("policy")}
            <select data-testid="admission-policy" aria-label="${formatSelectAriaLabel("admission-policy")}">
              <option value="conservative">${formatPolicyOptionLabel("conservative")}</option>
              <option value="standard" selected>${formatPolicyOptionLabel("standard")}</option>
              <option value="aggressive">${formatPolicyOptionLabel("aggressive")}</option>
            </select>
          </label>
          <label style="display:flex; align-items:center; gap:6px; color:#c8d2d7; font-size:13px;">
            ${formatFieldLabel("pricing")}
            <select data-testid="pricing-policy" aria-label="${formatSelectAriaLabel("pricing-policy")}">
              <option value="discount">${formatPolicyOptionLabel("discount")}</option>
              <option value="standard" selected>${formatPolicyOptionLabel("standard")}</option>
              <option value="premium">${formatPolicyOptionLabel("premium")}</option>
            </select>
          </label>
          <label style="display:flex; align-items:center; gap:6px; color:#c8d2d7; font-size:13px;">
            ${formatFieldLabel("severity")}
            <select data-testid="admission-severity" aria-label="${formatSelectAriaLabel("admission-severity")}">
              <option value="1">1</option>
              <option value="2" selected>2</option>
              <option value="3">3</option>
            </select>
          </label>
          <button type="button" data-testid="admit">${formatGameplayActionButtonLabel("admit")}</button>
          <button type="button" data-testid="treat">${formatGameplayActionButtonLabel("treat")}</button>
          <button type="button" data-testid="start-research">${formatCampaignActionButtonLabel("research")}</button>
          <button type="button" data-testid="start-emergency-wave">${formatCampaignActionButtonLabel("emergency")}</button>
          <button type="button" data-testid="start-epidemic-outbreak">${formatCampaignActionButtonLabel("epidemic")}</button>
          <button type="button" data-testid="start-vip-inspection">${formatCampaignActionButtonLabel("vip")}</button>
          <button type="button" data-testid="run-marketing-campaign">${formatCampaignActionButtonLabel("marketing")}</button>
          <button type="button" data-testid="start-insurance-contract">${formatCampaignActionButtonLabel("insurance")}</button>
          <button type="button" data-testid="run-awards-ceremony">${formatCampaignActionButtonLabel("awards")}</button>
          <button type="button" data-testid="run-finance-audit">${formatFinanceActionButtonLabel("run-audit")}</button>
          <button type="button" data-testid="take-loan">${formatFinanceActionButtonLabel("take-loan")}</button>
          <button type="button" data-testid="repay-loan">${formatFinanceActionButtonLabel("repay-loan")}</button>
          <button type="button" data-testid="prioritize-selected-patient">${formatSelectedPatientActionButtonLabel("prioritize")}</button>
          <button type="button" data-testid="send-selected-patient-home">${formatSelectedPatientActionButtonLabel("send-home")}</button>
          <button type="button" data-testid="give-drink-selected-patient">${formatSelectedPatientActionButtonLabel("give-drink")}</button>
          <button type="button" data-testid="send-selected-patient-toilet">${formatSelectedPatientActionButtonLabel("send-toilet")}</button>
          <button type="button" data-testid="shoot-rat">${formatCareActionButtonLabel("shoot-rat")}</button>
          <button type="button" data-testid="water-plant">${formatCareActionButtonLabel("water-plant")}</button>
          <button type="button" data-testid="staff-break-toggle">${formatStaffBreakToggleLabel({ onBreakStaff: 0 })}</button>
          <button type="button" data-testid="treatment-room-toggle">${formatTreatmentRoomToggleLabel({ openTreatmentRooms: 1 })}</button>
          <button type="button" data-testid="move-selected-staff">${formatSelectedStaffRoomActionButtonLabel("move-staff")}</button>
          <button type="button" data-testid="rest-selected-staff">${formatSelectedStaffRoomActionButtonLabel("rest-staff")}</button>
          <button type="button" data-testid="train-selected-staff">${formatSelectedStaffRoomActionButtonLabel("train-staff")}</button>
          <button type="button" data-testid="fire-selected-staff">${formatSelectedStaffRoomActionButtonLabel("fire-staff")}</button>
          <button type="button" data-testid="sell-selected-room">${formatSelectedStaffRoomActionButtonLabel("sell-room")}</button>
          <button type="button" data-testid="sell-selected-object">${formatSelectedStaffRoomActionButtonLabel("sell-object")}</button>
          <button type="button" data-testid="repair-selected-room">${formatSelectedStaffRoomActionButtonLabel("repair-room")}</button>
          <button type="button" data-testid="build-diagnosis-room">${formatBuildRoomButtonLabel("diagnosis")}</button>
          <button type="button" data-testid="build-treatment-room">${formatBuildRoomButtonLabel("treatment")}</button>
          <button type="button" data-testid="build-pharmacy-room">${formatBuildRoomButtonLabel("pharmacy")}</button>
          <button type="button" data-testid="build-specialist-room">${formatBuildRoomButtonLabel("specialist")}</button>
          <button type="button" data-testid="hire-diagnostician">${formatHireStaffButtonLabel("diagnostician")}</button>
          <button type="button" data-testid="hire-nurse">${formatHireStaffButtonLabel("nurse")}</button>
          <button type="button" data-testid="hire-handyman">${formatHireStaffButtonLabel("handyman")}</button>
          <button type="button" data-testid="hire-receptionist">${formatHireStaffButtonLabel("receptionist")}</button>
          <label style="display:flex; align-items:center; gap:6px; color:#c8d2d7; font-size:13px;">
            ${formatFieldLabel("slot")}
            <input
              type="text"
              value="${DEFAULT_SAVE_SLOT}"
              data-testid="save-slot-name"
              style="width:150px;"
            />
          </label>
          <select data-testid="save-slot-select" aria-label="${formatSelectAriaLabel("save-slots")}">
            <option value="${DEFAULT_SAVE_SLOT}">${DEFAULT_SAVE_SLOT}</option>
          </select>
          <button type="button" data-testid="save-game">${formatSaveActionButtonLabel("save")}</button>
          <button type="button" data-testid="load-game">${formatSaveActionButtonLabel("load")}</button>
          <button type="button" data-testid="refresh-save-slots">${formatSaveActionButtonLabel("refresh-slots")}</button>
          <button type="button" data-testid="delete-save-slot">${formatSaveActionButtonLabel("delete-slot")}</button>
          <button type="button" data-testid="audio-mute-toggle">${formatMuteToggleLabel({ muted: false })}</button>
          <label style="display:flex; align-items:center; gap:6px; color:#c8d2d7; font-size:13px;">
            ${formatFieldLabel("volume")}
          <input type="range" min="0" max="100" step="1" value="100" data-testid="audio-volume" />
          </label>
          <span data-testid="save-status" style="min-width:120px; color:#a9b7bd; font-size:13px;">${formatSaveLifecycleStatus("idle")}</span>
          <span data-testid="action-status" style="min-width:120px; color:#a9b7bd; font-size:13px;">${formatIdleActionStatus()}</span>
          <span data-testid="information-status" tabindex="-1" style="min-width:110px; color:#d7cfa6; font-size:13px;">${formatInformationStatus(false)}</span>
          <span data-testid="selection-status" style="min-width:160px; color:#d8dca5; font-size:13px;">${formatNoSelectionStatus()}</span>
        </div>
      </header>
      <nav
        data-testid="game-menu-bar"
        hidden
        style="margin:0 0 10px; padding:8px; border:1px solid #40545b; background:#182326;"
      >
        <button type="button" data-testid="game-menu-file">${formatMenuButtonLabel("file")}</button>
        <button type="button" data-testid="game-menu-options">${formatMenuButtonLabel("options")}</button>
        <button type="button" data-testid="game-menu-help">${formatMenuButtonLabel("help")}</button>
      </nav>
      <section
        data-testid="quit-level-confirmation"
        hidden
        style="margin:0 0 10px; padding:10px; border:1px solid #6f5d2d; background:#211d13; color:#f1e6c0;"
      >
        <p style="margin:0 0 8px; font-size:13px;">${formatQuitLevelPromptLabel()}</p>
        <button type="button" data-testid="quit-level-confirm">${formatQuitLevelButtonLabel("confirm")}</button>
        <button type="button" data-testid="quit-level-cancel">${formatQuitLevelButtonLabel("cancel")}</button>
      </section>
      <section
        data-testid="bank-manager-panel"
        hidden
        role="dialog"
        aria-label="${formatPanelTitleLabel("bank-manager")}"
        style="margin:0 0 10px; padding:10px; border:1px solid #40545b; background:#172126; color:#e7edf0;"
      >
        <h2 style="margin:0 0 8px; font-size:16px; line-height:1.2;">${formatPanelTitleLabel("bank-manager")}</h2>
        <p data-testid="bank-manager-loan" style="margin:0 0 4px; font-size:13px;"></p>
        <p data-testid="bank-manager-interest" style="margin:0 0 4px; font-size:13px;"></p>
        <p data-testid="bank-manager-cashflow" style="margin:0 0 4px; font-size:13px;"></p>
        <p data-testid="bank-manager-cumulative" style="margin:0 0 8px; font-size:13px;"></p>
        <button type="button" data-testid="bank-manager-take-loan">${formatFinanceActionButtonLabel("take-loan")}</button>
        <button type="button" data-testid="bank-manager-repay-loan">${formatFinanceActionButtonLabel("repay-loan")}</button>
        <button type="button" data-testid="bank-manager-close">${formatPanelCloseButtonLabel()}</button>
      </section>
      <section
        data-testid="bank-stats-panel"
        hidden
        role="dialog"
        aria-label="${formatPanelTitleLabel("bank-stats")}"
        style="margin:0 0 10px; padding:10px; border:1px solid #40545b; background:#172126; color:#e7edf0;"
      >
        <h2 style="margin:0 0 8px; font-size:16px; line-height:1.2;">${formatPanelTitleLabel("bank-stats")}</h2>
        <p data-testid="bank-stats-ledger" style="margin:0 0 4px; font-size:13px;"></p>
        <p data-testid="bank-stats-audit" style="margin:0 0 4px; font-size:13px;"></p>
        <p data-testid="bank-stats-cashflow" style="margin:0 0 4px; font-size:13px;"></p>
        <p data-testid="bank-stats-cumulative" style="margin:0 0 8px; font-size:13px;"></p>
        <button type="button" data-testid="bank-stats-run-audit">${formatFinanceActionButtonLabel("run-audit")}</button>
        <button type="button" data-testid="bank-stats-close">${formatPanelCloseButtonLabel()}</button>
      </section>
      <section
        data-testid="staff-panel"
        hidden
        role="dialog"
        aria-label="${formatPanelTitleLabel("staff")}"
        style="margin:0 0 10px; padding:10px; border:1px solid #40545b; background:#172126; color:#e7edf0;"
      >
        <h2 style="margin:0 0 8px; font-size:16px; line-height:1.2;">${formatPanelTitleLabel("staff")}</h2>
        <p data-testid="staff-panel-active" style="margin:0 0 4px; font-size:13px;"></p>
        <p data-testid="staff-panel-break" style="margin:0 0 4px; font-size:13px;"></p>
        <p data-testid="staff-panel-training" style="margin:0 0 4px; font-size:13px;"></p>
        <p data-testid="staff-panel-skill" style="margin:0 0 4px; font-size:13px;"></p>
        <p data-testid="staff-panel-market" style="margin:0 0 8px; font-size:13px;"></p>
        <button type="button" data-testid="staff-panel-hire-diagnostician">${formatHireStaffButtonLabel("diagnostician")}</button>
        <button type="button" data-testid="staff-panel-hire-nurse">${formatHireStaffButtonLabel("nurse")}</button>
        <button type="button" data-testid="staff-panel-hire-handyman">${formatHireStaffButtonLabel("handyman")}</button>
        <button type="button" data-testid="staff-panel-hire-receptionist">${formatHireStaffButtonLabel("receptionist")}</button>
        <button type="button" data-testid="staff-panel-close">${formatPanelCloseButtonLabel()}</button>
      </section>
      <section
        data-testid="research-panel"
        hidden
        role="dialog"
        aria-label="${formatPanelTitleLabel("research")}"
        style="margin:0 0 10px; padding:10px; border:1px solid #40545b; background:#172126; color:#e7edf0;"
      >
        <h2 style="margin:0 0 8px; font-size:16px; line-height:1.2;">${formatPanelTitleLabel("research")}</h2>
        <p data-testid="research-panel-status" style="margin:0 0 4px; font-size:13px;"></p>
        <p data-testid="research-panel-effect" style="margin:0 0 4px; font-size:13px;"></p>
        <p data-testid="research-panel-expertise" style="margin:0 0 4px; font-size:13px;"></p>
        <p data-testid="research-panel-objects" style="margin:0 0 8px; font-size:13px;"></p>
        <button type="button" data-testid="research-panel-start">${formatCampaignActionButtonLabel("research")}</button>
        <button type="button" data-testid="research-panel-close">${formatPanelCloseButtonLabel()}</button>
      </section>
      <section
        data-testid="status-panel"
        hidden
        role="dialog"
        aria-label="${formatPanelTitleLabel("status")}"
        style="margin:0 0 10px; padding:10px; border:1px solid #40545b; background:#172126; color:#e7edf0;"
      >
        <h2 style="margin:0 0 8px; font-size:16px; line-height:1.2;">${formatPanelTitleLabel("status")}</h2>
        <p data-testid="status-panel-campaign" style="margin:0 0 4px; font-size:13px;"></p>
        <p data-testid="status-panel-objective-status" style="margin:0 0 4px; font-size:13px;"></p>
        <p data-testid="status-panel-objective-progress" style="margin:0 0 4px; font-size:13px;"></p>
        <p data-testid="status-panel-objective-safety" style="margin:0 0 4px; font-size:13px;"></p>
        <p data-testid="status-panel-rating" style="margin:0 0 4px; font-size:13px;"></p>
        <p data-testid="status-panel-awards" style="margin:0 0 4px; font-size:13px;"></p>
        <p data-testid="status-panel-reputation" style="margin:0 0 4px; font-size:13px;"></p>
        <p data-testid="status-panel-cash" style="margin:0 0 4px; font-size:13px;"></p>
        <p data-testid="status-panel-milestone" style="margin:0 0 4px; font-size:13px;"></p>
        <p data-testid="status-panel-unlocks" style="margin:0 0 8px; font-size:13px;"></p>
        <button type="button" data-testid="status-panel-close">${formatPanelCloseButtonLabel()}</button>
      </section>
      <section
        data-testid="charts-panel"
        hidden
        role="dialog"
        aria-label="${formatPanelTitleLabel("charts")}"
        style="margin:0 0 10px; padding:10px; border:1px solid #40545b; background:#172126; color:#e7edf0;"
      >
        <h2 style="margin:0 0 8px; font-size:16px; line-height:1.2;">${formatPanelTitleLabel("charts")}</h2>
        <p data-testid="charts-panel-cash" style="margin:0 0 4px; font-size:13px;"></p>
        <p data-testid="charts-panel-reputation" style="margin:0 0 4px; font-size:13px;"></p>
        <p data-testid="charts-panel-cashflow" style="margin:0 0 4px; font-size:13px;"></p>
        <p data-testid="charts-panel-cumulative" style="margin:0 0 4px; font-size:13px;"></p>
        <p data-testid="charts-panel-loan" style="margin:0 0 4px; font-size:13px;"></p>
        <p data-testid="charts-panel-interest" style="margin:0 0 4px; font-size:13px;"></p>
        <p data-testid="charts-panel-ledger" style="margin:0 0 4px; font-size:13px;"></p>
        <p data-testid="charts-panel-audit" style="margin:0 0 4px; font-size:13px;"></p>
        <p data-testid="charts-panel-marketing" style="margin:0 0 4px; font-size:13px;"></p>
        <p data-testid="charts-panel-insurance" style="margin:0 0 8px; font-size:13px;"></p>
        <button type="button" data-testid="charts-panel-close">${formatPanelCloseButtonLabel()}</button>
      </section>
      <section
        data-testid="town-map-panel"
        hidden
        role="dialog"
        aria-label="${formatPanelTitleLabel("map")}"
        style="margin:0 0 10px; padding:10px; border:1px solid #40545b; background:#172126; color:#e7edf0;"
      >
        <h2 style="margin:0 0 8px; font-size:16px; line-height:1.2;">${formatPanelTitleLabel("map")}</h2>
        <p data-testid="town-map-panel-current" style="margin:0 0 4px; font-size:13px;"></p>
        <p data-testid="town-map-panel-campaign" style="margin:0 0 4px; font-size:13px;"></p>
        <p data-testid="town-map-panel-objective" style="margin:0 0 8px; font-size:13px;"></p>
        <p data-testid="town-map-panel-cash" style="margin:0 0 4px; font-size:13px;"></p>
        <p data-testid="town-map-panel-land" style="margin:0 0 4px; font-size:13px;"></p>
        <p data-testid="town-map-panel-details" style="margin:0 0 8px; font-size:13px;"></p>
        <label style="display:flex; align-items:center; gap:6px; margin:0 0 8px; color:#c8d2d7; font-size:13px;">
          ${formatFieldLabel("level")}
          <select data-testid="town-map-panel-select" aria-label="${formatSelectAriaLabel("town-map-level")}">${mapOptions}</select>
        </label>
        <button type="button" data-testid="town-map-panel-close">${formatPanelCloseButtonLabel()}</button>
      </section>
      <section
        data-testid="policy-panel"
        hidden
        role="dialog"
        aria-label="${formatPanelTitleLabel("policy")}"
        style="margin:0 0 10px; padding:10px; border:1px solid #40545b; background:#172126; color:#e7edf0;"
      >
        <h2 style="margin:0 0 8px; font-size:16px; line-height:1.2;">${formatPanelTitleLabel("policy")}</h2>
        <p data-testid="policy-panel-admissions" style="margin:0 0 4px; font-size:13px;"></p>
        <p data-testid="policy-panel-admission-status" style="margin:0 0 4px; font-size:13px;"></p>
        <p data-testid="policy-panel-pricing-status" style="margin:0 0 4px; font-size:13px;"></p>
        <p data-testid="policy-panel-admission-rules" style="margin:0 0 4px; font-size:13px;"></p>
        <p data-testid="policy-panel-routing-rules" style="margin:0 0 8px; font-size:13px;"></p>
        <label style="display:flex; align-items:center; gap:6px; margin:0 0 6px; color:#c8d2d7; font-size:13px;">
          ${formatFieldLabel("admission")}
          <select data-testid="policy-panel-admission-policy" aria-label="${formatSelectAriaLabel("policy-panel-admission")}">
            <option value="conservative">${formatPolicyOptionLabel("conservative")}</option>
            <option value="standard" selected>${formatPolicyOptionLabel("standard")}</option>
            <option value="aggressive">${formatPolicyOptionLabel("aggressive")}</option>
          </select>
        </label>
        <label style="display:flex; align-items:center; gap:6px; margin:0 0 8px; color:#c8d2d7; font-size:13px;">
          ${formatFieldLabel("pricing")}
          <select data-testid="policy-panel-pricing-policy" aria-label="${formatSelectAriaLabel("policy-panel-pricing")}">
            <option value="discount">${formatPolicyOptionLabel("discount")}</option>
            <option value="standard" selected>${formatPolicyOptionLabel("standard")}</option>
            <option value="premium">${formatPolicyOptionLabel("premium")}</option>
          </select>
        </label>
        <button type="button" data-testid="policy-panel-close">${formatPanelCloseButtonLabel()}</button>
      </section>
      <section
        data-testid="machine-menu-panel"
        hidden
        role="dialog"
        aria-label="${formatPanelTitleLabel("machine-menu")}"
        style="margin:0 0 10px; padding:10px; border:1px solid #40545b; background:#172126; color:#e7edf0;"
      >
        <h2 style="margin:0 0 8px; font-size:16px; line-height:1.2;">${formatPanelTitleLabel("machine-menu")}</h2>
        <p data-testid="machine-menu-maintenance" style="margin:0 0 4px; font-size:13px;"></p>
        <p data-testid="machine-menu-staff" style="margin:0 0 4px; font-size:13px;"></p>
        <p data-testid="machine-menu-starts" style="margin:0 0 4px; font-size:13px;"></p>
        <p data-testid="machine-menu-completes" style="margin:0 0 4px; font-size:13px;"></p>
        <p data-testid="machine-menu-rooms" style="margin:0 0 4px; font-size:13px;"></p>
        <p data-testid="machine-menu-objects" style="margin:0 0 8px; font-size:13px;"></p>
        <button type="button" data-testid="machine-menu-repair-selected-room">${formatSelectedStaffRoomActionButtonLabel("repair-room")}</button>
        <button type="button" data-testid="machine-menu-close">${formatPanelCloseButtonLabel()}</button>
      </section>
      <section
        data-testid="casebook-panel"
        hidden
        role="dialog"
        aria-label="${formatPanelTitleLabel("casebook")}"
        style="margin:0 0 10px; padding:10px; border:1px solid #40545b; background:#172126; color:#e7edf0;"
      >
        <h2 style="margin:0 0 8px; font-size:16px; line-height:1.2;">${formatPanelTitleLabel("casebook")}</h2>
        <p data-testid="casebook-panel-summary" style="margin:0 0 8px; font-size:13px;"></p>
        <div data-testid="casebook-panel-rows"></div>
        <button type="button" data-testid="casebook-panel-close">${formatPanelCloseButtonLabel()}</button>
      </section>
      <section
        data-testid="message-panel"
        hidden
        role="dialog"
        aria-label="${formatPanelTitleLabel("messages")}"
        style="margin:0 0 10px; padding:10px; border:1px solid #40545b; background:#172126; color:#e7edf0;"
      >
        <h2 style="margin:0 0 8px; font-size:16px; line-height:1.2;">${formatPanelTitleLabel("messages")}</h2>
        <p data-testid="message-panel-advisor" style="margin:0 0 4px; font-size:13px;"></p>
        <p data-testid="message-panel-count" style="margin:0 0 4px; font-size:13px;"></p>
        <p data-testid="message-panel-last" style="margin:0 0 4px; font-size:13px;"></p>
        <p data-testid="message-panel-recent" style="margin:0 0 8px; font-size:13px;"></p>
        <button type="button" data-testid="message-panel-close">${formatPanelCloseButtonLabel()}</button>
      </section>
      <section
        data-testid="jukebox-panel"
        hidden
        role="dialog"
        aria-label="${formatPanelTitleLabel("jukebox")}"
        style="margin:0 0 10px; padding:10px; border:1px solid #40545b; background:#172126; color:#e7edf0;"
      >
        <h2 style="margin:0 0 8px; font-size:16px; line-height:1.2;">${formatPanelTitleLabel("jukebox")}</h2>
        <p data-testid="jukebox-panel-status" style="margin:0 0 4px; font-size:13px;"></p>
        <p data-testid="jukebox-panel-volume-status" style="margin:0 0 8px; font-size:13px;"></p>
        <label style="display:flex; align-items:center; gap:6px; margin:0 0 8px; color:#c8d2d7; font-size:13px;">
          ${formatFieldLabel("volume")}
          <input type="range" min="0" max="100" step="1" value="100" data-testid="jukebox-panel-volume" />
        </label>
        <button type="button" data-testid="jukebox-panel-master-mute">${formatAudioMasterMuteLabel(false)}</button>
        <button type="button" data-testid="jukebox-panel-sound-mute">${formatAudioChannelMuteLabel("Sound", true)}</button>
        <button type="button" data-testid="jukebox-panel-music-mute">${formatAudioChannelMuteLabel("Music", true)}</button>
        <button type="button" data-testid="jukebox-panel-close">${formatPanelCloseButtonLabel()}</button>
      </section>
      <section
        data-testid="furnish-corridor-panel"
        hidden
        role="dialog"
        aria-label="${formatPanelTitleLabel("furnish-corridor")}"
        style="margin:0 0 10px; padding:10px; border:1px solid #40545b; background:#172126; color:#e7edf0;"
      >
        <h2 style="margin:0 0 8px; font-size:16px; line-height:1.2;">${formatPanelTitleLabel("furnish-corridor")}</h2>
        <p data-testid="furnish-corridor-panel-summary" style="margin:0 0 8px; font-size:13px;"></p>
        <div data-testid="furnish-corridor-panel-rows"></div>
        <button type="button" data-testid="furnish-corridor-panel-close">${formatPanelCloseButtonLabel()}</button>
      </section>
      <section
        data-testid="edit-room-panel"
        hidden
        role="dialog"
        aria-label="${formatPanelTitleLabel("edit-room")}"
        style="margin:0 0 10px; padding:10px; border:1px solid #40545b; background:#172126; color:#e7edf0;"
      >
        <h2 style="margin:0 0 8px; font-size:16px; line-height:1.2;">${formatPanelTitleLabel("edit-room")}</h2>
        <p data-testid="edit-room-panel-summary" style="margin:0 0 4px; font-size:13px;"></p>
        <p data-testid="edit-room-panel-availability" style="margin:0 0 8px; font-size:13px;"></p>
        <button type="button" data-testid="edit-room-panel-toggle">${formatSelectedRoomToggleLabel({ status: "closed" })}</button>
        <button type="button" data-testid="edit-room-panel-repair">${formatSelectedStaffRoomActionButtonLabel("repair-room")}</button>
        <button type="button" data-testid="edit-room-panel-sell">${formatSelectedStaffRoomActionButtonLabel("sell-room")}</button>
        <button type="button" data-testid="edit-room-panel-close">${formatPanelCloseButtonLabel()}</button>
      </section>
      <p data-testid="casebook-summary" tabindex="-1" style="margin:0 0 10px; color:#d8dca5; font-size:13px; line-height:1.35;">${formatCasebookPanelEmptyStatus()}</p>
      <div style="display:grid; grid-template-columns:minmax(0, 1fr) 320px; gap:14px; align-items:start;">
        <section>
          <canvas
            data-testid="original-ui-strip-canvas"
            width="320"
            height="40"
            style="display:block; width:320px; max-width:100%; height:40px; margin:0 0 8px; image-rendering:pixelated; border:1px solid #2f444b; background:#050708;"
          ></canvas>
          <p data-testid="original-ui-strip-summary" style="margin:0 0 8px; color:#a9b7bd; font-size:13px;"></p>
          <div
            data-testid="playfield"
            tabindex="0"
            style="background:#050708; border:1px solid #2f444b; width:100%; max-width:${HOSPITAL_CANVAS_WIDTH}px; user-select:none; overflow:hidden;"
          >
            <canvas
              data-testid="hospital-map-canvas"
              width="${HOSPITAL_CANVAS_WIDTH}"
              height="${HOSPITAL_CANVAS_HEIGHT}"
              style="display:block; width:100%; height:auto; image-rendering:pixelated;"
            ></canvas>
          </div>
          <div style="display:flex; flex-wrap:wrap; gap:8px; align-items:center; margin-top:10px;">
            <label style="display:flex; align-items:center; gap:6px; color:#c8d2d7; font-size:13px;">
              ${formatFieldLabel("map")}
              <select data-testid="hospital-map-select">${mapOptions}</select>
            </label>
            <button type="button" data-testid="hospital-camera-west">${formatCameraDirectionButtonLabel("west")}</button>
            <button type="button" data-testid="hospital-camera-east">${formatCameraDirectionButtonLabel("east")}</button>
            <button type="button" data-testid="hospital-camera-north">${formatCameraDirectionButtonLabel("north")}</button>
            <button type="button" data-testid="hospital-camera-south">${formatCameraDirectionButtonLabel("south")}</button>
          </div>
        </section>
        <section data-testid="telemetry" style="display:grid; grid-template-columns:1fr 1fr; gap:2px 10px; align-content:start; font-size:13px;">
          <p data-testid="seed" style="margin:0;"></p>
          <p data-testid="tick" style="margin:0;"></p>
          <p data-testid="speed-status" style="margin:0;"></p>
          <p data-testid="treated" style="margin:0;"></p>
          <p data-testid="waiting" style="margin:0;"></p>
          <p data-testid="reception-size" style="margin:0; grid-column:1 / -1;"></p>
          <p data-testid="queue-size" style="margin:0;"></p>
          <p data-testid="walking-to-diagnosis-size" style="margin:0;"></p>
          <p data-testid="diagnosing-size" style="margin:0;"></p>
          <p data-testid="diagnosed-size" style="margin:0;"></p>
          <p data-testid="awaiting-treatment-size" style="margin:0;"></p>
          <p data-testid="walking-to-treatment-size" style="margin:0;"></p>
          <p data-testid="treating-size" style="margin:0;"></p>
          <p data-testid="discharged" style="margin:0;"></p>
          <p data-testid="treatment-failures" style="margin:0;"></p>
          <p data-testid="research-status" tabindex="-1" style="margin:0;"></p>
          <p data-testid="research-effect" style="margin:0;"></p>
          <p data-testid="scenario-expertise" style="margin:0; grid-column:1 / -1;"></p>
          <p data-testid="scenario-opponents" style="margin:0; grid-column:1 / -1;"></p>
          <p data-testid="scenario-opponent-progress" style="margin:0; grid-column:1 / -1;"></p>
          <p data-testid="scenario-network-criteria" style="margin:0; grid-column:1 / -1;"></p>
          <p data-testid="quake-status" style="margin:0;"></p>
          <p data-testid="emergency-status" style="margin:0;"></p>
          <p data-testid="emergency-reward" style="margin:0;"></p>
          <p data-testid="epidemic-status" style="margin:0;"></p>
          <p data-testid="epidemic-reward" style="margin:0; grid-column:1 / -1;"></p>
          <p data-testid="vip-inspection-status" style="margin:0;"></p>
          <p data-testid="vip-inspection-reward" style="margin:0; grid-column:1 / -1;"></p>
          <p data-testid="patient-deaths" style="margin:0;"></p>
          <p data-testid="patient-vomits" style="margin:0;"></p>
          <p data-testid="patient-litter" style="margin:0;"></p>
          <p data-testid="patient-drinks" style="margin:0;"></p>
          <p data-testid="rat-control" style="margin:0;"></p>
          <p data-testid="plant-care" style="margin:0;"></p>
          <p data-testid="patients-needing-toilet" style="margin:0;"></p>
          <p data-testid="patient-bowel-overflows" style="margin:0;"></p>
          <p data-testid="critical-patients" style="margin:0;"></p>
          <p data-testid="patient-mood" style="margin:0;"></p>
          <p data-testid="admissions-status" style="margin:0;"></p>
          <p data-testid="admission-policy-status" style="margin:0;"></p>
          <p data-testid="next-admission" style="margin:0;"></p>
          <p data-testid="admission-rules" style="margin:0; grid-column:1 / -1;"></p>
          <p data-testid="routing-rules" style="margin:0; grid-column:1 / -1;"></p>
          <p data-testid="front-desk-status" style="margin:0; grid-column:1 / -1;"></p>
          <p data-testid="active-staff" tabindex="-1" style="margin:0;"></p>
          <p data-testid="on-break-staff" style="margin:0;"></p>
          <p data-testid="staff-training-status" style="margin:0;"></p>
          <p data-testid="staff-skill-status" style="margin:0;"></p>
          <p data-testid="staff-market-status" style="margin:0; grid-column:1 / -1;"></p>
          <p data-testid="maintenance-staff-status" style="margin:0;"></p>
          <p data-testid="open-diagnosis-rooms" style="margin:0;"></p>
          <p data-testid="open-treatment-rooms" style="margin:0;"></p>
          <p data-testid="specialized-treatment-rooms" style="margin:0; grid-column:1 / -1;"></p>
          <p data-testid="room-availability" tabindex="-1" style="margin:0; grid-column:1 / -1;"></p>
          <p data-testid="object-availability" tabindex="-1" style="margin:0; grid-column:1 / -1;"></p>
          <p data-testid="specialized-treatment-queue" style="margin:0;"></p>
          <p data-testid="cash" style="margin:0;"></p>
          <p data-testid="reputation" style="margin:0;"></p>
          <p data-testid="pricing-policy-status" style="margin:0;"></p>
          <p data-testid="loan-status" tabindex="-1" style="margin:0;"></p>
          <p data-testid="loan-interest" style="margin:0;"></p>
          <p data-testid="finance-ledger" tabindex="-1" style="margin:0;"></p>
          <p data-testid="finance-audit" style="margin:0; grid-column:1 / -1;"></p>
          <p data-testid="marketing-campaign" style="margin:0; grid-column:1 / -1;"></p>
          <p data-testid="insurance-contract-status" style="margin:0;"></p>
          <p data-testid="insurance-contract-reward" style="margin:0; grid-column:1 / -1;"></p>
          <p data-testid="hospital-rating" style="margin:0;"></p>
          <p data-testid="hospital-awards" style="margin:0;"></p>
          <p data-testid="cashflow-net" tabindex="-1" style="margin:0;"></p>
          <p data-testid="cashflow-cumulative" style="margin:0;"></p>
          <p data-testid="milestone-level" style="margin:0;"></p>
          <p data-testid="unlocks" style="margin:0;"></p>
          <p data-testid="campaign-progress" style="margin:0;"></p>
          <p data-testid="level-objective-status" tabindex="-1" style="margin:0;"></p>
          <p data-testid="level-objective-progress" style="margin:0;"></p>
          <p data-testid="level-objective-safety" style="margin:0; grid-column:1 / -1;"></p>
          <div style="grid-column:1 / -1; display:flex; gap:8px; flex-wrap:wrap; margin:2px 0;">
            <button type="button" data-testid="restart-level">${formatGameplayActionButtonLabel("restart-level")}</button>
            <button type="button" data-testid="next-level">${formatGameplayActionButtonLabel("next-level")}</button>
          </div>
          <p data-testid="event-count" style="margin:0;"></p>
          <p data-testid="last-event" tabindex="-1" style="margin:0;"></p>
          <p data-testid="advisor-status" style="margin:0; grid-column:1 / -1;"></p>
          <p data-testid="recent-events" tabindex="-1" style="margin:0; grid-column:1 / -1;"></p>
          <p data-testid="queue-pressure" style="margin:0;"></p>
          <p data-testid="queue-pressure-status" style="margin:0;"></p>
          <p data-testid="stressed-staff" style="margin:0;"></p>
          <p data-testid="tired-staff" style="margin:0;"></p>
          <p data-testid="very-tired-staff" style="margin:0;"></p>
          <p data-testid="salary-pressure" style="margin:0;"></p>
          <p data-testid="auto-break-staff" style="margin:0;"></p>
          <p data-testid="rooms-in-maintenance" tabindex="-1" style="margin:0;"></p>
          <p data-testid="queue-pressure-events" style="margin:0;"></p>
          <p data-testid="staff-burnout-events" style="margin:0;"></p>
          <p data-testid="staff-recovery-events" style="margin:0;"></p>
          <p data-testid="room-maintenance-start-events" style="margin:0;"></p>
          <p data-testid="room-maintenance-complete-events" style="margin:0;"></p>
          <p data-testid="hash" style="margin:0; grid-column:1 / -1;"></p>
          <p data-testid="paused" style="margin:0;"></p>
          <p data-testid="audio-status" style="margin:0;"></p>
          <p data-testid="audio-volume-metric" style="margin:0; grid-column:1 / -1;"></p>
        </section>
      </div>
    </section>
  `;
    const telemetryElements = {
        pauseToggleButton: requiredElement(options.root, "[data-testid='pause-toggle']"),
        speedSelect: requiredElement(options.root, "[data-testid='speed-select']"),
        admissionPolicySelect: requiredElement(options.root, "[data-testid='admission-policy']"),
        pricingPolicySelect: requiredElement(options.root, "[data-testid='pricing-policy']"),
        admissionsToggleButton: requiredElement(options.root, "[data-testid='admissions-toggle']"),
        staffBreakToggleButton: requiredElement(options.root, "[data-testid='staff-break-toggle']"),
        treatmentRoomToggleButton: requiredElement(options.root, "[data-testid='treatment-room-toggle']"),
        muteToggleButton: requiredElement(options.root, "[data-testid='audio-mute-toggle']"),
        volumeSlider: requiredElement(options.root, "[data-testid='audio-volume']"),
        takeLoanButton: requiredElement(options.root, "[data-testid='take-loan']"),
        repayLoanButton: requiredElement(options.root, "[data-testid='repay-loan']"),
        financeAuditButton: requiredElement(options.root, "[data-testid='run-finance-audit']"),
        marketingCampaignButton: requiredElement(options.root, "[data-testid='run-marketing-campaign']"),
        insuranceContractButton: requiredElement(options.root, "[data-testid='start-insurance-contract']"),
        awardsButton: requiredElement(options.root, "[data-testid='run-awards-ceremony']"),
        researchButton: requiredElement(options.root, "[data-testid='start-research']"),
        emergencyButton: requiredElement(options.root, "[data-testid='start-emergency-wave']"),
        epidemicButton: requiredElement(options.root, "[data-testid='start-epidemic-outbreak']"),
        vipInspectionButton: requiredElement(options.root, "[data-testid='start-vip-inspection']"),
        seedMetric: requiredElement(options.root, "[data-testid='seed']"),
        tickMetric: requiredElement(options.root, "[data-testid='tick']"),
        speedStatusMetric: requiredElement(options.root, "[data-testid='speed-status']"),
        treatedMetric: requiredElement(options.root, "[data-testid='treated']"),
        waitingMetric: requiredElement(options.root, "[data-testid='waiting']"),
        receptionMetric: requiredElement(options.root, "[data-testid='reception-size']"),
        queueMetric: requiredElement(options.root, "[data-testid='queue-size']"),
        walkingToDiagnosisMetric: requiredElement(options.root, "[data-testid='walking-to-diagnosis-size']"),
        diagnosingMetric: requiredElement(options.root, "[data-testid='diagnosing-size']"),
        diagnosedMetric: requiredElement(options.root, "[data-testid='diagnosed-size']"),
        awaitingTreatmentMetric: requiredElement(options.root, "[data-testid='awaiting-treatment-size']"),
        walkingToTreatmentMetric: requiredElement(options.root, "[data-testid='walking-to-treatment-size']"),
        treatingMetric: requiredElement(options.root, "[data-testid='treating-size']"),
        dischargedMetric: requiredElement(options.root, "[data-testid='discharged']"),
        treatmentFailuresMetric: requiredElement(options.root, "[data-testid='treatment-failures']"),
        researchStatusMetric: requiredElement(options.root, "[data-testid='research-status']"),
        researchEffectMetric: requiredElement(options.root, "[data-testid='research-effect']"),
        scenarioExpertiseMetric: requiredElement(options.root, "[data-testid='scenario-expertise']"),
        scenarioOpponentsMetric: requiredElement(options.root, "[data-testid='scenario-opponents']"),
        scenarioOpponentProgressMetric: requiredElement(options.root, "[data-testid='scenario-opponent-progress']"),
        scenarioNetworkCriteriaMetric: requiredElement(options.root, "[data-testid='scenario-network-criteria']"),
        quakeStatusMetric: requiredElement(options.root, "[data-testid='quake-status']"),
        emergencyStatusMetric: requiredElement(options.root, "[data-testid='emergency-status']"),
        emergencyRewardMetric: requiredElement(options.root, "[data-testid='emergency-reward']"),
        epidemicStatusMetric: requiredElement(options.root, "[data-testid='epidemic-status']"),
        epidemicRewardMetric: requiredElement(options.root, "[data-testid='epidemic-reward']"),
        vipInspectionStatusMetric: requiredElement(options.root, "[data-testid='vip-inspection-status']"),
        vipInspectionRewardMetric: requiredElement(options.root, "[data-testid='vip-inspection-reward']"),
        patientDeathsMetric: requiredElement(options.root, "[data-testid='patient-deaths']"),
        patientVomitsMetric: requiredElement(options.root, "[data-testid='patient-vomits']"),
        patientLitterMetric: requiredElement(options.root, "[data-testid='patient-litter']"),
        patientDrinksMetric: requiredElement(options.root, "[data-testid='patient-drinks']"),
        ratControlMetric: requiredElement(options.root, "[data-testid='rat-control']"),
        plantCareMetric: requiredElement(options.root, "[data-testid='plant-care']"),
        patientsNeedingToiletMetric: requiredElement(options.root, "[data-testid='patients-needing-toilet']"),
        patientBowelOverflowsMetric: requiredElement(options.root, "[data-testid='patient-bowel-overflows']"),
        criticalPatientsMetric: requiredElement(options.root, "[data-testid='critical-patients']"),
        patientMoodMetric: requiredElement(options.root, "[data-testid='patient-mood']"),
        admissionsStatusMetric: requiredElement(options.root, "[data-testid='admissions-status']"),
        admissionPolicyStatusMetric: requiredElement(options.root, "[data-testid='admission-policy-status']"),
        nextAdmissionMetric: requiredElement(options.root, "[data-testid='next-admission']"),
        admissionRulesMetric: requiredElement(options.root, "[data-testid='admission-rules']"),
        routingRulesMetric: requiredElement(options.root, "[data-testid='routing-rules']"),
        frontDeskStatusMetric: requiredElement(options.root, "[data-testid='front-desk-status']"),
        activeStaffMetric: requiredElement(options.root, "[data-testid='active-staff']"),
        onBreakStaffMetric: requiredElement(options.root, "[data-testid='on-break-staff']"),
        staffTrainingStatusMetric: requiredElement(options.root, "[data-testid='staff-training-status']"),
        staffSkillStatusMetric: requiredElement(options.root, "[data-testid='staff-skill-status']"),
        staffMarketStatusMetric: requiredElement(options.root, "[data-testid='staff-market-status']"),
        maintenanceStaffStatusMetric: requiredElement(options.root, "[data-testid='maintenance-staff-status']"),
        openDiagnosisRoomsMetric: requiredElement(options.root, "[data-testid='open-diagnosis-rooms']"),
        openTreatmentRoomsMetric: requiredElement(options.root, "[data-testid='open-treatment-rooms']"),
        specializedTreatmentRoomsMetric: requiredElement(options.root, "[data-testid='specialized-treatment-rooms']"),
        roomAvailabilityMetric: requiredElement(options.root, "[data-testid='room-availability']"),
        objectAvailabilityMetric: requiredElement(options.root, "[data-testid='object-availability']"),
        specializedTreatmentQueueMetric: requiredElement(options.root, "[data-testid='specialized-treatment-queue']"),
        cashMetric: requiredElement(options.root, "[data-testid='cash']"),
        reputationMetric: requiredElement(options.root, "[data-testid='reputation']"),
        pricingPolicyStatusMetric: requiredElement(options.root, "[data-testid='pricing-policy-status']"),
        loanStatusMetric: requiredElement(options.root, "[data-testid='loan-status']"),
        loanInterestMetric: requiredElement(options.root, "[data-testid='loan-interest']"),
        financeLedgerMetric: requiredElement(options.root, "[data-testid='finance-ledger']"),
        financeAuditMetric: requiredElement(options.root, "[data-testid='finance-audit']"),
        marketingCampaignMetric: requiredElement(options.root, "[data-testid='marketing-campaign']"),
        insuranceContractStatusMetric: requiredElement(options.root, "[data-testid='insurance-contract-status']"),
        insuranceContractRewardMetric: requiredElement(options.root, "[data-testid='insurance-contract-reward']"),
        hospitalRatingMetric: requiredElement(options.root, "[data-testid='hospital-rating']"),
        hospitalAwardMetric: requiredElement(options.root, "[data-testid='hospital-awards']"),
        tickCashflowMetric: requiredElement(options.root, "[data-testid='cashflow-net']"),
        cumulativeCashflowMetric: requiredElement(options.root, "[data-testid='cashflow-cumulative']"),
        milestoneLevelMetric: requiredElement(options.root, "[data-testid='milestone-level']"),
        unlocksMetric: requiredElement(options.root, "[data-testid='unlocks']"),
        campaignProgressMetric: requiredElement(options.root, "[data-testid='campaign-progress']"),
        levelObjectiveStatusMetric: requiredElement(options.root, "[data-testid='level-objective-status']"),
        levelObjectiveProgressMetric: requiredElement(options.root, "[data-testid='level-objective-progress']"),
        levelObjectiveSafetyMetric: requiredElement(options.root, "[data-testid='level-objective-safety']"),
        eventsMetric: requiredElement(options.root, "[data-testid='event-count']"),
        lastEventMetric: requiredElement(options.root, "[data-testid='last-event']"),
        advisorStatusMetric: requiredElement(options.root, "[data-testid='advisor-status']"),
        recentEventsMetric: requiredElement(options.root, "[data-testid='recent-events']"),
        queuePressureMetric: requiredElement(options.root, "[data-testid='queue-pressure']"),
        queuePressureStatusMetric: requiredElement(options.root, "[data-testid='queue-pressure-status']"),
        stressedStaffMetric: requiredElement(options.root, "[data-testid='stressed-staff']"),
        tiredStaffMetric: requiredElement(options.root, "[data-testid='tired-staff']"),
        veryTiredStaffMetric: requiredElement(options.root, "[data-testid='very-tired-staff']"),
        salaryPressureMetric: requiredElement(options.root, "[data-testid='salary-pressure']"),
        autoBreakStaffMetric: requiredElement(options.root, "[data-testid='auto-break-staff']"),
        roomsInMaintenanceMetric: requiredElement(options.root, "[data-testid='rooms-in-maintenance']"),
        queuePressureEventsMetric: requiredElement(options.root, "[data-testid='queue-pressure-events']"),
        staffBurnoutEventsMetric: requiredElement(options.root, "[data-testid='staff-burnout-events']"),
        staffRecoveryEventsMetric: requiredElement(options.root, "[data-testid='staff-recovery-events']"),
        roomMaintenanceStartEventsMetric: requiredElement(options.root, "[data-testid='room-maintenance-start-events']"),
        roomMaintenanceCompleteEventsMetric: requiredElement(options.root, "[data-testid='room-maintenance-complete-events']"),
        hashMetric: requiredElement(options.root, "[data-testid='hash']"),
        pausedMetric: requiredElement(options.root, "[data-testid='paused']"),
        audioStatusMetric: requiredElement(options.root, "[data-testid='audio-status']"),
        audioVolumeMetric: requiredElement(options.root, "[data-testid='audio-volume-metric']")
    };
    const playfield = requiredElement(options.root, "[data-testid='playfield']");
    const hospitalCanvas = requiredElement(options.root, "[data-testid='hospital-map-canvas']");
    const hospitalCanvasSummary = requiredElement(options.root, "[data-testid='hospital-canvas-summary']");
    const hospitalPlacementMode = requiredElement(options.root, "[data-testid='hospital-placement-mode']");
    const originalUiStripCanvas = requiredElement(options.root, "[data-testid='original-ui-strip-canvas']");
    const originalUiStripSummary = requiredElement(options.root, "[data-testid='original-ui-strip-summary']");
    const hospitalMapSelect = requiredElement(options.root, "[data-testid='hospital-map-select']");
    const cameraWestButton = requiredElement(options.root, "[data-testid='hospital-camera-west']");
    const cameraEastButton = requiredElement(options.root, "[data-testid='hospital-camera-east']");
    const cameraNorthButton = requiredElement(options.root, "[data-testid='hospital-camera-north']");
    const cameraSouthButton = requiredElement(options.root, "[data-testid='hospital-camera-south']");
    const restartLevelButton = requiredElement(options.root, "[data-testid='restart-level']");
    const nextLevelButton = requiredElement(options.root, "[data-testid='next-level']");
    const stepButton = requiredElement(options.root, "[data-testid='step']");
    const admitButton = requiredElement(options.root, "[data-testid='admit']");
    const admissionSeveritySelect = requiredElement(options.root, "[data-testid='admission-severity']");
    const treatButton = requiredElement(options.root, "[data-testid='treat']");
    const researchButton = requiredElement(options.root, "[data-testid='start-research']");
    const emergencyButton = requiredElement(options.root, "[data-testid='start-emergency-wave']");
    const epidemicButton = requiredElement(options.root, "[data-testid='start-epidemic-outbreak']");
    const vipInspectionButton = requiredElement(options.root, "[data-testid='start-vip-inspection']");
    const marketingCampaignButton = requiredElement(options.root, "[data-testid='run-marketing-campaign']");
    const insuranceContractButton = requiredElement(options.root, "[data-testid='start-insurance-contract']");
    const awardsButton = requiredElement(options.root, "[data-testid='run-awards-ceremony']");
    const financeAuditButton = requiredElement(options.root, "[data-testid='run-finance-audit']");
    const takeLoanButton = requiredElement(options.root, "[data-testid='take-loan']");
    const repayLoanButton = requiredElement(options.root, "[data-testid='repay-loan']");
    const prioritizeSelectedPatientButton = requiredElement(options.root, "[data-testid='prioritize-selected-patient']");
    const sendSelectedPatientHomeButton = requiredElement(options.root, "[data-testid='send-selected-patient-home']");
    const giveDrinkSelectedPatientButton = requiredElement(options.root, "[data-testid='give-drink-selected-patient']");
    const sendSelectedPatientToiletButton = requiredElement(options.root, "[data-testid='send-selected-patient-toilet']");
    const shootRatButton = requiredElement(options.root, "[data-testid='shoot-rat']");
    const waterPlantButton = requiredElement(options.root, "[data-testid='water-plant']");
    const moveSelectedStaffButton = requiredElement(options.root, "[data-testid='move-selected-staff']");
    const restSelectedStaffButton = requiredElement(options.root, "[data-testid='rest-selected-staff']");
    const trainSelectedStaffButton = requiredElement(options.root, "[data-testid='train-selected-staff']");
    const fireSelectedStaffButton = requiredElement(options.root, "[data-testid='fire-selected-staff']");
    const sellSelectedRoomButton = requiredElement(options.root, "[data-testid='sell-selected-room']");
    const sellSelectedObjectButton = requiredElement(options.root, "[data-testid='sell-selected-object']");
    const repairSelectedRoomButton = requiredElement(options.root, "[data-testid='repair-selected-room']");
    const buildDiagnosisRoomButton = requiredElement(options.root, "[data-testid='build-diagnosis-room']");
    const buildTreatmentRoomButton = requiredElement(options.root, "[data-testid='build-treatment-room']");
    const buildPharmacyRoomButton = requiredElement(options.root, "[data-testid='build-pharmacy-room']");
    const buildSpecialistRoomButton = requiredElement(options.root, "[data-testid='build-specialist-room']");
    const hireDiagnosticianButton = requiredElement(options.root, "[data-testid='hire-diagnostician']");
    const hireNurseButton = requiredElement(options.root, "[data-testid='hire-nurse']");
    const hireHandymanButton = requiredElement(options.root, "[data-testid='hire-handyman']");
    const hireReceptionistButton = requiredElement(options.root, "[data-testid='hire-receptionist']");
    const hireStaffButtons = [
        hireDiagnosticianButton,
        hireNurseButton,
        hireHandymanButton,
        hireReceptionistButton
    ];
    const saveSlotNameInput = requiredElement(options.root, "[data-testid='save-slot-name']");
    const saveSlotSelect = requiredElement(options.root, "[data-testid='save-slot-select']");
    const saveGameButton = requiredElement(options.root, "[data-testid='save-game']");
    const loadGameButton = requiredElement(options.root, "[data-testid='load-game']");
    const refreshSaveSlotsButton = requiredElement(options.root, "[data-testid='refresh-save-slots']");
    const deleteSaveSlotButton = requiredElement(options.root, "[data-testid='delete-save-slot']");
    const gameMenuBar = requiredElement(options.root, "[data-testid='game-menu-bar']");
    const gameMenuFileButton = requiredElement(options.root, "[data-testid='game-menu-file']");
    const quitLevelConfirmation = requiredElement(options.root, "[data-testid='quit-level-confirmation']");
    const quitLevelConfirmButton = requiredElement(options.root, "[data-testid='quit-level-confirm']");
    const quitLevelCancelButton = requiredElement(options.root, "[data-testid='quit-level-cancel']");
    const bankManagerPanel = requiredElement(options.root, "[data-testid='bank-manager-panel']");
    const bankManagerLoanMetric = requiredElement(options.root, "[data-testid='bank-manager-loan']");
    const bankManagerInterestMetric = requiredElement(options.root, "[data-testid='bank-manager-interest']");
    const bankManagerCashflowMetric = requiredElement(options.root, "[data-testid='bank-manager-cashflow']");
    const bankManagerCumulativeMetric = requiredElement(options.root, "[data-testid='bank-manager-cumulative']");
    const bankManagerTakeLoanButton = requiredElement(options.root, "[data-testid='bank-manager-take-loan']");
    const bankManagerRepayLoanButton = requiredElement(options.root, "[data-testid='bank-manager-repay-loan']");
    const bankManagerCloseButton = requiredElement(options.root, "[data-testid='bank-manager-close']");
    const bankStatsPanel = requiredElement(options.root, "[data-testid='bank-stats-panel']");
    const bankStatsLedgerMetric = requiredElement(options.root, "[data-testid='bank-stats-ledger']");
    const bankStatsAuditMetric = requiredElement(options.root, "[data-testid='bank-stats-audit']");
    const bankStatsCashflowMetric = requiredElement(options.root, "[data-testid='bank-stats-cashflow']");
    const bankStatsCumulativeMetric = requiredElement(options.root, "[data-testid='bank-stats-cumulative']");
    const bankStatsRunAuditButton = requiredElement(options.root, "[data-testid='bank-stats-run-audit']");
    const bankStatsCloseButton = requiredElement(options.root, "[data-testid='bank-stats-close']");
    const staffPanel = requiredElement(options.root, "[data-testid='staff-panel']");
    const staffPanelActiveMetric = requiredElement(options.root, "[data-testid='staff-panel-active']");
    const staffPanelBreakMetric = requiredElement(options.root, "[data-testid='staff-panel-break']");
    const staffPanelTrainingMetric = requiredElement(options.root, "[data-testid='staff-panel-training']");
    const staffPanelSkillMetric = requiredElement(options.root, "[data-testid='staff-panel-skill']");
    const staffPanelMarketMetric = requiredElement(options.root, "[data-testid='staff-panel-market']");
    const staffPanelHireDiagnosticianButton = requiredElement(options.root, "[data-testid='staff-panel-hire-diagnostician']");
    const staffPanelHireNurseButton = requiredElement(options.root, "[data-testid='staff-panel-hire-nurse']");
    const staffPanelHireHandymanButton = requiredElement(options.root, "[data-testid='staff-panel-hire-handyman']");
    const staffPanelHireReceptionistButton = requiredElement(options.root, "[data-testid='staff-panel-hire-receptionist']");
    const staffPanelCloseButton = requiredElement(options.root, "[data-testid='staff-panel-close']");
    const staffPanelHireButtons = [
        staffPanelHireDiagnosticianButton,
        staffPanelHireNurseButton,
        staffPanelHireHandymanButton,
        staffPanelHireReceptionistButton
    ];
    const researchPanel = requiredElement(options.root, "[data-testid='research-panel']");
    const researchPanelStatusMetric = requiredElement(options.root, "[data-testid='research-panel-status']");
    const researchPanelEffectMetric = requiredElement(options.root, "[data-testid='research-panel-effect']");
    const researchPanelExpertiseMetric = requiredElement(options.root, "[data-testid='research-panel-expertise']");
    const researchPanelObjectsMetric = requiredElement(options.root, "[data-testid='research-panel-objects']");
    const researchPanelStartButton = requiredElement(options.root, "[data-testid='research-panel-start']");
    const researchPanelCloseButton = requiredElement(options.root, "[data-testid='research-panel-close']");
    const statusPanel = requiredElement(options.root, "[data-testid='status-panel']");
    const statusPanelCampaignMetric = requiredElement(options.root, "[data-testid='status-panel-campaign']");
    const statusPanelObjectiveStatusMetric = requiredElement(options.root, "[data-testid='status-panel-objective-status']");
    const statusPanelObjectiveProgressMetric = requiredElement(options.root, "[data-testid='status-panel-objective-progress']");
    const statusPanelObjectiveSafetyMetric = requiredElement(options.root, "[data-testid='status-panel-objective-safety']");
    const statusPanelRatingMetric = requiredElement(options.root, "[data-testid='status-panel-rating']");
    const statusPanelAwardsMetric = requiredElement(options.root, "[data-testid='status-panel-awards']");
    const statusPanelReputationMetric = requiredElement(options.root, "[data-testid='status-panel-reputation']");
    const statusPanelCashMetric = requiredElement(options.root, "[data-testid='status-panel-cash']");
    const statusPanelMilestoneMetric = requiredElement(options.root, "[data-testid='status-panel-milestone']");
    const statusPanelUnlocksMetric = requiredElement(options.root, "[data-testid='status-panel-unlocks']");
    const statusPanelCloseButton = requiredElement(options.root, "[data-testid='status-panel-close']");
    const chartsPanel = requiredElement(options.root, "[data-testid='charts-panel']");
    const chartsPanelCashMetric = requiredElement(options.root, "[data-testid='charts-panel-cash']");
    const chartsPanelReputationMetric = requiredElement(options.root, "[data-testid='charts-panel-reputation']");
    const chartsPanelCashflowMetric = requiredElement(options.root, "[data-testid='charts-panel-cashflow']");
    const chartsPanelCumulativeMetric = requiredElement(options.root, "[data-testid='charts-panel-cumulative']");
    const chartsPanelLoanMetric = requiredElement(options.root, "[data-testid='charts-panel-loan']");
    const chartsPanelInterestMetric = requiredElement(options.root, "[data-testid='charts-panel-interest']");
    const chartsPanelLedgerMetric = requiredElement(options.root, "[data-testid='charts-panel-ledger']");
    const chartsPanelAuditMetric = requiredElement(options.root, "[data-testid='charts-panel-audit']");
    const chartsPanelMarketingMetric = requiredElement(options.root, "[data-testid='charts-panel-marketing']");
    const chartsPanelInsuranceMetric = requiredElement(options.root, "[data-testid='charts-panel-insurance']");
    const chartsPanelCloseButton = requiredElement(options.root, "[data-testid='charts-panel-close']");
    const mapPanel = requiredElement(options.root, "[data-testid='town-map-panel']");
    const mapPanelCurrentMetric = requiredElement(options.root, "[data-testid='town-map-panel-current']");
    const mapPanelCampaignMetric = requiredElement(options.root, "[data-testid='town-map-panel-campaign']");
    const mapPanelObjectiveMetric = requiredElement(options.root, "[data-testid='town-map-panel-objective']");
    const mapPanelCashMetric = requiredElement(options.root, "[data-testid='town-map-panel-cash']");
    const mapPanelLandMetric = requiredElement(options.root, "[data-testid='town-map-panel-land']");
    const mapPanelDetailsMetric = requiredElement(options.root, "[data-testid='town-map-panel-details']");
    const mapPanelSelect = requiredElement(options.root, "[data-testid='town-map-panel-select']");
    const mapPanelCloseButton = requiredElement(options.root, "[data-testid='town-map-panel-close']");
    const policyPanel = requiredElement(options.root, "[data-testid='policy-panel']");
    const policyPanelAdmissionsMetric = requiredElement(options.root, "[data-testid='policy-panel-admissions']");
    const policyPanelAdmissionStatusMetric = requiredElement(options.root, "[data-testid='policy-panel-admission-status']");
    const policyPanelPricingStatusMetric = requiredElement(options.root, "[data-testid='policy-panel-pricing-status']");
    const policyPanelAdmissionRulesMetric = requiredElement(options.root, "[data-testid='policy-panel-admission-rules']");
    const policyPanelRoutingRulesMetric = requiredElement(options.root, "[data-testid='policy-panel-routing-rules']");
    const policyPanelAdmissionPolicySelect = requiredElement(options.root, "[data-testid='policy-panel-admission-policy']");
    const policyPanelPricingPolicySelect = requiredElement(options.root, "[data-testid='policy-panel-pricing-policy']");
    const policyPanelCloseButton = requiredElement(options.root, "[data-testid='policy-panel-close']");
    const machineMenuPanel = requiredElement(options.root, "[data-testid='machine-menu-panel']");
    const machineMenuMaintenanceMetric = requiredElement(options.root, "[data-testid='machine-menu-maintenance']");
    const machineMenuStaffMetric = requiredElement(options.root, "[data-testid='machine-menu-staff']");
    const machineMenuStartsMetric = requiredElement(options.root, "[data-testid='machine-menu-starts']");
    const machineMenuCompletesMetric = requiredElement(options.root, "[data-testid='machine-menu-completes']");
    const machineMenuRoomsMetric = requiredElement(options.root, "[data-testid='machine-menu-rooms']");
    const machineMenuObjectsMetric = requiredElement(options.root, "[data-testid='machine-menu-objects']");
    const machineMenuRepairSelectedRoomButton = requiredElement(options.root, "[data-testid='machine-menu-repair-selected-room']");
    const machineMenuCloseButton = requiredElement(options.root, "[data-testid='machine-menu-close']");
    const casebookPanel = requiredElement(options.root, "[data-testid='casebook-panel']");
    const casebookPanelSummary = requiredElement(options.root, "[data-testid='casebook-panel-summary']");
    const casebookPanelRows = requiredElement(options.root, "[data-testid='casebook-panel-rows']");
    const casebookPanelCloseButton = requiredElement(options.root, "[data-testid='casebook-panel-close']");
    const messagePanel = requiredElement(options.root, "[data-testid='message-panel']");
    const messagePanelAdvisorMetric = requiredElement(options.root, "[data-testid='message-panel-advisor']");
    const messagePanelCountMetric = requiredElement(options.root, "[data-testid='message-panel-count']");
    const messagePanelLastMetric = requiredElement(options.root, "[data-testid='message-panel-last']");
    const messagePanelRecentMetric = requiredElement(options.root, "[data-testid='message-panel-recent']");
    const messagePanelCloseButton = requiredElement(options.root, "[data-testid='message-panel-close']");
    const jukeboxPanel = requiredElement(options.root, "[data-testid='jukebox-panel']");
    const jukeboxPanelStatusMetric = requiredElement(options.root, "[data-testid='jukebox-panel-status']");
    const jukeboxPanelVolumeStatusMetric = requiredElement(options.root, "[data-testid='jukebox-panel-volume-status']");
    const jukeboxPanelVolumeSlider = requiredElement(options.root, "[data-testid='jukebox-panel-volume']");
    const jukeboxPanelMasterMuteButton = requiredElement(options.root, "[data-testid='jukebox-panel-master-mute']");
    const jukeboxPanelSoundMuteButton = requiredElement(options.root, "[data-testid='jukebox-panel-sound-mute']");
    const jukeboxPanelMusicMuteButton = requiredElement(options.root, "[data-testid='jukebox-panel-music-mute']");
    const jukeboxPanelCloseButton = requiredElement(options.root, "[data-testid='jukebox-panel-close']");
    const furnishCorridorPanel = requiredElement(options.root, "[data-testid='furnish-corridor-panel']");
    const furnishCorridorPanelSummary = requiredElement(options.root, "[data-testid='furnish-corridor-panel-summary']");
    const furnishCorridorPanelRows = requiredElement(options.root, "[data-testid='furnish-corridor-panel-rows']");
    const furnishCorridorPanelCloseButton = requiredElement(options.root, "[data-testid='furnish-corridor-panel-close']");
    const editRoomPanel = requiredElement(options.root, "[data-testid='edit-room-panel']");
    const editRoomPanelSummary = requiredElement(options.root, "[data-testid='edit-room-panel-summary']");
    const editRoomPanelAvailabilityMetric = requiredElement(options.root, "[data-testid='edit-room-panel-availability']");
    const editRoomPanelToggleButton = requiredElement(options.root, "[data-testid='edit-room-panel-toggle']");
    const editRoomPanelRepairButton = requiredElement(options.root, "[data-testid='edit-room-panel-repair']");
    const editRoomPanelSellButton = requiredElement(options.root, "[data-testid='edit-room-panel-sell']");
    const editRoomPanelCloseButton = requiredElement(options.root, "[data-testid='edit-room-panel-close']");
    const saveStatus = requiredElement(options.root, "[data-testid='save-status']");
    const actionStatus = requiredElement(options.root, "[data-testid='action-status']");
    const informationStatus = requiredElement(options.root, "[data-testid='information-status']");
    const selectionStatus = requiredElement(options.root, "[data-testid='selection-status']");
    const casebookSummary = requiredElement(options.root, "[data-testid='casebook-summary']");
    const createOrchestratorOptions = () => {
        const restoreOptions = createRestoreOptionsFromHospitalView(hospitalView);
        return {
            seed: options.seed,
            ...(options.tickRateHz !== undefined ? { tickRateHz: options.tickRateHz } : {}),
            ...(options.pointerTileSize !== undefined ? { pointerTileSize: options.pointerTileSize } : {}),
            ...(hospitalView?.map ? { bounds: { width: hospitalView.map.width, height: hospitalView.map.height } } : {}),
            ...restoreOptions,
            ...(options.scenarioCommands !== undefined ? { bootstrapCommands: options.scenarioCommands } : {})
        };
    };
    const persistenceAdapter = options.persistenceAdapter ?? createIndexedDbPersistenceAdapter({
        databaseName: "corsixth-browser-runtime",
        storeName: "save-slots"
    });
    let orchestrator = new AppOrchestrator(createOrchestratorOptions());
    let selectedTile = null;
    let selectedEntity = null;
    let placementAction = null;
    let placementPreview = null;
    let lastPlacementEvaluation = null;
    const cameraMemorySlots = new Map();
    const resetInteractionState = () => {
        selectedTile = null;
        selectedEntity = null;
        placementAction = null;
        placementPreview = null;
        lastPlacementEvaluation = null;
    };
    const resetOrchestratorForActiveMap = () => {
        orchestrator = new AppOrchestrator(createOrchestratorOptions());
        resetInteractionState();
    };
    const renderHospital = () => {
        hospitalCanvasSummary.textContent = renderHospitalCanvas(hospitalCanvas, hospitalView, orchestrator, selectedTile, placementPreview, selectedEntity);
        hospitalPlacementMode.textContent = formatPlacementMode(placementAction, placementPreview);
    };
    const renderCasebook = () => {
        casebookSummary.textContent = formatCasebookWithLanguage(orchestrator.getState(), hospitalView?.languageSummary ?? null);
        casebookPanelSummary.textContent = casebookSummary.textContent;
        casebookPanelRows.innerHTML = formatCasebookRowsHtml(orchestrator.getState(), hospitalView?.languageSummary ?? null);
    };
    const renderLevelControls = () => {
        const telemetry = orchestrator.telemetry();
        const currentMap = campaignMapSummaryAt(hospitalView, campaignLevelIndex(hospitalView));
        telemetryElements.campaignProgressMetric.textContent = formatCampaignProgress(hospitalView, telemetry);
        mapPanelCurrentMetric.textContent = formatMapPanelCurrentStatus(hospitalView?.mapPath ?? "");
        mapPanelCampaignMetric.textContent = telemetryElements.campaignProgressMetric.textContent;
        mapPanelObjectiveMetric.textContent = formatLevelObjectiveStatus(telemetry);
        mapPanelCashMetric.textContent = formatCashStatus(telemetry);
        mapPanelLandMetric.textContent = formatMapPanelLandStatus(telemetry.scenarioLandCostPerTile);
        mapPanelDetailsMetric.textContent = formatMapPanelDetailsStatus(currentMap);
        mapPanelSelect.value = hospitalView?.mapPath ?? "";
        restartLevelButton.disabled = !canRestartLevelFromHospitalView(hospitalView);
        nextLevelButton.disabled = !canAdvanceToNextLevelFromTelemetry(hospitalView, telemetry);
    };
    const renderSelectionControls = () => {
        const state = orchestrator.getState();
        const resolved = selectedEntityFromState(state, selectedEntity);
        selectionStatus.textContent = formatSelectionStatusWithLanguage(state, selectedEntity, hospitalView?.languageSummary ?? null);
        if (selectedEntity && !resolved) {
            selectedEntity = null;
            selectionStatus.textContent = formatNoSelectionStatus();
        }
        prioritizeSelectedPatientButton.disabled = !(resolved?.type === "patient" && canPrioritizePatient(resolved.value));
        sendSelectedPatientHomeButton.disabled = resolved?.type !== "patient";
        const telemetry = orchestrator.telemetry();
        giveDrinkSelectedPatientButton.disabled = !(resolved?.type === "patient" && canGiveDrinkToPatient(resolved.value, telemetry));
        sendSelectedPatientToiletButton.disabled = !(resolved?.type === "patient" && canSendPatientToilet(resolved.value, telemetry));
        moveSelectedStaffButton.disabled = resolved?.type !== "staff";
        restSelectedStaffButton.disabled = !(resolved?.type === "staff" && canRestStaffFromTelemetry(resolved.value));
        trainSelectedStaffButton.disabled = !(resolved?.type === "staff" && canTrainStaffFromTelemetry(resolved.value, telemetry));
        fireSelectedStaffButton.disabled = !(resolved?.type === "staff" && canFireStaff(resolved.value));
        sellSelectedRoomButton.disabled = !(resolved?.type === "room" && canSellRoom(resolved.value));
        sellSelectedObjectButton.disabled = resolved?.type !== "object";
        repairSelectedRoomButton.disabled = !(resolved?.type === "room" && canRepairRoomFromTelemetry(resolved.value, telemetry));
        machineMenuRepairSelectedRoomButton.disabled = repairSelectedRoomButton.disabled;
        editRoomPanelSummary.textContent = formatEditRoomPanelSummary(state, selectedEntity, hospitalView?.languageSummary ?? null);
        editRoomPanelAvailabilityMetric.textContent = formatRoomAvailabilityHudStatus(telemetry, hospitalView?.languageSummary ?? null);
        editRoomPanelToggleButton.disabled = !canToggleTreatmentRoomFromState(state, resolved?.type === "room" ? resolved.value : null);
        editRoomPanelRepairButton.disabled = repairSelectedRoomButton.disabled;
        editRoomPanelSellButton.disabled = sellSelectedRoomButton.disabled;
        if (resolved?.type === "staff") {
            telemetryElements.staffBreakToggleButton.textContent = formatSelectedStaffBreakToggleLabel(resolved.value);
        }
        if (resolved?.type === "room") {
            telemetryElements.treatmentRoomToggleButton.textContent = formatSelectedRoomToggleLabel(resolved.value);
            editRoomPanelToggleButton.textContent = formatSelectedRoomToggleLabel(resolved.value);
        }
        else {
            editRoomPanelToggleButton.textContent = formatTreatmentRoomToggleLabel(telemetry);
        }
        telemetryElements.staffBreakToggleButton.disabled = !canToggleStaffBreakFromState(state, resolved?.type === "staff" ? resolved.value : null);
        telemetryElements.treatmentRoomToggleButton.disabled = !canToggleTreatmentRoomFromState(state, resolved?.type === "room" ? resolved.value : null);
    };
    const renderRuntime = () => {
        const currentMap = campaignMapSummaryAt(hospitalView, campaignLevelIndex(hospitalView));
        renderTelemetry(telemetryElements, orchestrator, audioMixer, hospitalView?.languageSummary ?? null, currentMap?.scenario ?? null);
        const telemetry = orchestrator.telemetry();
        const audioStatus = audioMixer.status();
        jukeboxPanelStatusMetric.textContent = formatAudioStatus(audioStatus);
        jukeboxPanelVolumeStatusMetric.textContent = formatAudioVolumeStatus(audioStatus);
        jukeboxPanelVolumeSlider.value = String(Math.round(audioStatus.volume * 100));
        jukeboxPanelMasterMuteButton.textContent = formatMuteToggleLabel(audioStatus);
        jukeboxPanelSoundMuteButton.textContent = formatAudioChannelMuteLabel("Sound", audioStatus.soundMuted);
        jukeboxPanelMusicMuteButton.textContent = formatAudioChannelMuteLabel("Music", audioStatus.musicMuted);
        furnishCorridorPanelSummary.textContent = formatFurnishCorridorSummary(currentMap?.scenario ?? null, telemetry);
        furnishCorridorPanelRows.innerHTML = formatFurnishCorridorRowsHtml(currentMap?.scenario ?? null, telemetry, hospitalView?.languageSummary ?? null);
        bankManagerLoanMetric.textContent = formatLoanStatus(telemetry);
        bankManagerInterestMetric.textContent = formatLoanInterestStatus(telemetry);
        bankManagerCashflowMetric.textContent = formatTickCashflowStatus(telemetry);
        bankManagerCumulativeMetric.textContent = formatCumulativeCashflowStatus(telemetry);
        bankManagerTakeLoanButton.disabled = !canTakeLoanFromTelemetry(telemetry);
        bankManagerRepayLoanButton.disabled = !canRepayLoanFromTelemetry(telemetry);
        bankStatsLedgerMetric.textContent = formatFinanceLedgerStatus(telemetry);
        bankStatsAuditMetric.textContent = formatFinanceAuditStatus(telemetry);
        bankStatsCashflowMetric.textContent = formatTickCashflowStatus(telemetry);
        bankStatsCumulativeMetric.textContent = formatCumulativeCashflowStatus(telemetry);
        bankStatsRunAuditButton.disabled = !canRunFinanceAuditFromTelemetry(telemetry);
        staffPanelActiveMetric.textContent = formatActiveStaffStatus(telemetry);
        staffPanelBreakMetric.textContent = formatOnBreakStaffStatus(telemetry);
        staffPanelTrainingMetric.textContent = formatStaffTrainingStatus(telemetry);
        staffPanelSkillMetric.textContent = formatStaffSkillStatus(telemetry);
        staffPanelMarketMetric.textContent = formatStaffMarketStatus(telemetry);
        researchPanelStatusMetric.textContent = formatResearchStatus(telemetry);
        researchPanelEffectMetric.textContent = formatResearchEffectStatus(telemetry);
        researchPanelExpertiseMetric.textContent = formatScenarioExpertiseStatus(telemetry, hospitalView?.languageSummary ?? null);
        researchPanelObjectsMetric.textContent = formatObjectAvailabilityStatus(telemetry, currentMap?.scenario ?? null, hospitalView?.languageSummary ?? null);
        researchPanelStartButton.disabled = !canStartResearchFromTelemetry(telemetry);
        statusPanelCampaignMetric.textContent = formatCampaignProgress(hospitalView, telemetry);
        statusPanelObjectiveStatusMetric.textContent = formatLevelObjectiveStatus(telemetry);
        statusPanelObjectiveProgressMetric.textContent = formatLevelObjectiveProgress(telemetry);
        statusPanelObjectiveSafetyMetric.textContent = formatLevelObjectiveSafety(telemetry);
        statusPanelRatingMetric.textContent = formatHospitalRatingStatus(telemetry);
        statusPanelAwardsMetric.textContent = formatHospitalAwardStatus(telemetry);
        statusPanelReputationMetric.textContent = formatReputationStatus(telemetry);
        statusPanelCashMetric.textContent = formatCashStatus(telemetry);
        statusPanelMilestoneMetric.textContent = formatMilestoneStatus(telemetry);
        statusPanelUnlocksMetric.textContent = formatUnlockStatus(telemetry);
        chartsPanelCashMetric.textContent = formatCashStatus(telemetry);
        chartsPanelReputationMetric.textContent = formatReputationStatus(telemetry);
        chartsPanelCashflowMetric.textContent = formatTickCashflowStatus(telemetry);
        chartsPanelCumulativeMetric.textContent = formatCumulativeCashflowStatus(telemetry);
        chartsPanelLoanMetric.textContent = formatLoanStatus(telemetry);
        chartsPanelInterestMetric.textContent = formatLoanInterestStatus(telemetry);
        chartsPanelLedgerMetric.textContent = formatFinanceLedgerStatus(telemetry);
        chartsPanelAuditMetric.textContent = formatFinanceAuditStatus(telemetry);
        chartsPanelMarketingMetric.textContent = formatMarketingCampaignStatus(telemetry);
        chartsPanelInsuranceMetric.textContent = formatInsuranceContractStatus(telemetry);
        policyPanelAdmissionsMetric.textContent = formatAdmissionsStatus(telemetry);
        policyPanelAdmissionStatusMetric.textContent = formatAdmissionPolicyStatus(telemetry);
        policyPanelPricingStatusMetric.textContent = formatPricingPolicyStatus(telemetry);
        policyPanelAdmissionRulesMetric.textContent = formatAdmissionRulesStatus(telemetry);
        policyPanelRoutingRulesMetric.textContent = formatRoutingRulesStatus(telemetry);
        policyPanelAdmissionPolicySelect.value = telemetry.admissionPolicy;
        policyPanelPricingPolicySelect.value = telemetry.treatmentPricingPolicy;
        messagePanelAdvisorMetric.textContent = telemetry.advisorStatus;
        messagePanelCountMetric.textContent = formatEventRulesStatus(telemetry);
        messagePanelLastMetric.textContent = formatLastEventStatus(telemetry);
        messagePanelRecentMetric.textContent = formatRecentEventsStatus(telemetry);
        machineMenuMaintenanceMetric.textContent = formatRoomMaintenanceStatus(telemetry);
        machineMenuStaffMetric.textContent = formatMaintenanceStaffStatus(telemetry, hospitalView?.languageSummary ?? null);
        machineMenuStartsMetric.textContent = formatRoomMaintenanceStartEventsStatus(telemetry);
        machineMenuCompletesMetric.textContent = formatRoomMaintenanceCompleteEventsStatus(telemetry);
        machineMenuRoomsMetric.textContent = formatRoomAvailabilityHudStatus(telemetry, hospitalView?.languageSummary ?? null);
        machineMenuObjectsMetric.textContent = formatObjectAvailabilityStatus(telemetry, currentMap?.scenario ?? null, hospitalView?.languageSummary ?? null);
        buildDiagnosisRoomButton.textContent = formatBuildRoomButtonLabel("diagnosis", telemetry, hospitalView?.languageSummary ?? null);
        buildTreatmentRoomButton.textContent = formatBuildRoomButtonLabel("treatment", telemetry, hospitalView?.languageSummary ?? null);
        buildPharmacyRoomButton.textContent = formatBuildRoomButtonLabel("pharmacy", telemetry, hospitalView?.languageSummary ?? null);
        buildSpecialistRoomButton.textContent = formatBuildRoomButtonLabel("specialist", telemetry, hospitalView?.languageSummary ?? null);
        hireDiagnosticianButton.textContent = formatHireStaffButtonLabel("diagnostician", telemetry, hospitalView?.languageSummary ?? null);
        hireNurseButton.textContent = formatHireStaffButtonLabel("nurse", telemetry, hospitalView?.languageSummary ?? null);
        hireHandymanButton.textContent = formatHireStaffButtonLabel("handyman", telemetry, hospitalView?.languageSummary ?? null);
        hireReceptionistButton.textContent = formatHireStaffButtonLabel("receptionist", telemetry, hospitalView?.languageSummary ?? null);
        buildDiagnosisRoomButton.disabled = !canBuildRoomFromTelemetry("diagnosis", telemetry);
        buildTreatmentRoomButton.disabled = !canBuildRoomFromTelemetry("treatment", telemetry);
        buildPharmacyRoomButton.disabled = !canBuildRoomFromTelemetry("pharmacy", telemetry);
        buildSpecialistRoomButton.disabled = !canBuildRoomFromTelemetry("specialist", telemetry);
        hireDiagnosticianButton.disabled = !canHireStaffFromTelemetry("diagnostician", telemetry);
        hireNurseButton.disabled = !canHireStaffFromTelemetry("nurse", telemetry);
        hireHandymanButton.disabled = !canHireStaffFromTelemetry("handyman", telemetry);
        hireReceptionistButton.disabled = !canHireStaffFromTelemetry("receptionist", telemetry);
        staffPanelHireDiagnosticianButton.textContent = hireDiagnosticianButton.textContent;
        staffPanelHireNurseButton.textContent = hireNurseButton.textContent;
        staffPanelHireHandymanButton.textContent = hireHandymanButton.textContent;
        staffPanelHireReceptionistButton.textContent = hireReceptionistButton.textContent;
        staffPanelHireDiagnosticianButton.disabled = hireDiagnosticianButton.disabled;
        staffPanelHireNurseButton.disabled = hireNurseButton.disabled;
        staffPanelHireHandymanButton.disabled = hireHandymanButton.disabled;
        staffPanelHireReceptionistButton.disabled = hireReceptionistButton.disabled;
        renderHospital();
        renderSelectionControls();
        renderLevelControls();
        renderCasebook();
    };
    const createPlacementDispatchAction = (placement, tile) => ({
        device: "ui",
        action: placement.action,
        source: placement.source,
        pointer: {
            x: tile.x * orchestrator.pointerTileSize,
            y: tile.y * orchestrator.pointerTileSize
        },
        ...(placement.roomType ? { roomType: placement.roomType } : {}),
        ...(Number.isInteger(placement.objectIndex) ? { objectIndex: placement.objectIndex } : {}),
        ...(placement.objectName ? { objectName: placement.objectName } : {}),
        ...(Number.isInteger(placement.cost) ? { cost: placement.cost } : {}),
        ...(placement.orientation ? { orientation: placement.orientation } : {}),
        ...(placement.role ? { role: placement.role } : {}),
        ...(placement.staffId ? { staffId: placement.staffId } : {})
    });
    const updatePlacementPreviewForPoint = (point) => {
        if (!placementAction || !hospitalView || !point) {
            placementPreview = null;
            renderHospital();
            return null;
        }
        const tile = resolveHospitalTileFromCanvasPoint(hospitalView, point);
        if (!tile) {
            placementPreview = null;
            renderHospital();
            return null;
        }
        selectedTile = tile;
        placementPreview = orchestrator.evaluatePlacement(createPlacementDispatchAction(placementAction, tile));
        renderHospital();
        return tile;
    };
    const updateActionStatus = (events, placementEvaluation = null) => {
        const nextStatus = formatActionStatus(events, placementEvaluation);
        if (nextStatus) {
            actionStatus.textContent = nextStatus;
        }
    };
    const onCancelAction = (source = "") => {
        if (!quitLevelConfirmation.hidden) {
            quitLevelConfirmation.hidden = true;
            actionStatus.textContent = formatQuitLevelActionStatus("cancelled");
            playfield.focus();
            return true;
        }
        if (!bankManagerPanel.hidden) {
            bankManagerPanel.hidden = true;
            actionStatus.textContent = formatPanelActionStatus("bank manager", "closed");
            playfield.focus();
            return true;
        }
        if (!bankStatsPanel.hidden) {
            bankStatsPanel.hidden = true;
            actionStatus.textContent = formatPanelActionStatus("bank stats", "closed");
            playfield.focus();
            return true;
        }
        if (!staffPanel.hidden) {
            staffPanel.hidden = true;
            actionStatus.textContent = formatPanelActionStatus("staff panel", "closed");
            playfield.focus();
            return true;
        }
        if (!researchPanel.hidden) {
            researchPanel.hidden = true;
            actionStatus.textContent = formatPanelActionStatus("research panel", "closed");
            playfield.focus();
            return true;
        }
        if (!statusPanel.hidden) {
            statusPanel.hidden = true;
            actionStatus.textContent = formatPanelActionStatus("status panel", "closed");
            playfield.focus();
            return true;
        }
        if (!chartsPanel.hidden) {
            chartsPanel.hidden = true;
            actionStatus.textContent = formatPanelActionStatus("charts panel", "closed");
            playfield.focus();
            return true;
        }
        if (!mapPanel.hidden) {
            mapPanel.hidden = true;
            actionStatus.textContent = formatPanelActionStatus("town map", "closed");
            playfield.focus();
            return true;
        }
        if (!policyPanel.hidden) {
            policyPanel.hidden = true;
            actionStatus.textContent = formatPanelActionStatus("policy panel", "closed");
            playfield.focus();
            return true;
        }
        if (!machineMenuPanel.hidden) {
            machineMenuPanel.hidden = true;
            actionStatus.textContent = formatPanelActionStatus("machine menu", "closed");
            playfield.focus();
            return true;
        }
        if (!casebookPanel.hidden) {
            casebookPanel.hidden = true;
            actionStatus.textContent = formatPanelActionStatus("casebook", "closed");
            playfield.focus();
            return true;
        }
        if (!messagePanel.hidden) {
            messagePanel.hidden = true;
            actionStatus.textContent = formatPanelActionStatus("message", "closed");
            playfield.focus();
            return true;
        }
        if (!jukeboxPanel.hidden) {
            jukeboxPanel.hidden = true;
            actionStatus.textContent = formatPanelActionStatus("jukebox", "closed");
            playfield.focus();
            return true;
        }
        if (!furnishCorridorPanel.hidden) {
            furnishCorridorPanel.hidden = true;
            actionStatus.textContent = formatPanelActionStatus("furnish corridor", "closed");
            playfield.focus();
            return true;
        }
        if (!editRoomPanel.hidden) {
            editRoomPanel.hidden = true;
            actionStatus.textContent = formatPanelActionStatus("edit room", "closed");
            playfield.focus();
            return true;
        }
        if (!placementAction) {
            if (source !== "Escape") {
                actionStatus.textContent = formatActionStatus("cancel-action-blocked");
                renderRuntime();
                return true;
            }
            gameMenuBar.hidden = false;
            gameMenuFileButton.focus();
            actionStatus.textContent = formatMenuBarShownActionStatus();
            return true;
        }
        placementAction = null;
        placementPreview = null;
        selectedTile = null;
        renderRuntime();
        return true;
    };
    const onRotatePlacement = () => {
        if (!placementAction || (placementAction.action !== "build-room" && placementAction.action !== "place-object")) {
            actionStatus.textContent = formatActionStatus("placement.rotate-blocked");
            renderRuntime();
            return true;
        }
        placementAction = {
            ...placementAction,
            orientation: nextPlacementOrientation(placementAction.orientation)
        };
        if (selectedTile) {
            placementPreview = orchestrator.evaluatePlacement(createPlacementDispatchAction(placementAction, selectedTile));
        }
        actionStatus.textContent = formatPlacementRotatedActionStatus(placementAction.orientation);
        renderRuntime();
        return true;
    };
    const onOpenQuitLevelConfirmation = () => {
        placementAction = null;
        placementPreview = null;
        selectedTile = null;
        quitLevelConfirmation.hidden = false;
        quitLevelCancelButton.focus();
        actionStatus.textContent = formatQuitLevelActionStatus("confirmation");
        renderRuntime();
        return true;
    };
    const onCancelQuitLevel = () => {
        quitLevelConfirmation.hidden = true;
        actionStatus.textContent = formatQuitLevelActionStatus("cancelled");
        playfield.focus();
    };
    const onConfirmQuitLevel = () => {
        quitLevelConfirmation.hidden = true;
        if (typeof options.onQuitLevel === "function") {
            options.onQuitLevel();
            return;
        }
        resetOrchestratorForActiveMap();
        saveStatus.textContent = formatRestartedLevelStatus(hospitalView?.mapPath ?? "");
        actionStatus.textContent = formatQuitLevelActionStatus("confirmed");
        renderRuntime();
        playfield.focus();
    };
    const onConfirmAction = () => {
        lastPlacementEvaluation = null;
        if (!placementAction || !placementPreview || !selectedTile) {
            actionStatus.textContent = formatActionStatus("confirm-action-blocked");
            renderRuntime();
            return true;
        }
        const nextAction = createPlacementDispatchAction(placementAction, selectedTile);
        lastPlacementEvaluation = orchestrator.evaluatePlacement(nextAction);
        placementAction = null;
        placementPreview = null;
        selectedEntity = null;
        const events = dispatchAndRender(orchestrator, telemetryElements, audioMixer, nextAction, renderRuntime);
        updateActionStatus(events, lastPlacementEvaluation);
        return true;
    };
    const activeSaveSlot = () => {
        const slot = saveSlotNameInput.value.trim();
        return slot.length > 0 ? slot : DEFAULT_SAVE_SLOT;
    };
    const renderSaveSlots = (slots) => {
        const active = activeSaveSlot();
        saveSlotSelect.innerHTML = formatSaveSlotOptionsHtml(slots, active);
        saveSlotSelect.value = active;
    };
    const refreshSaveSlots = (refreshOptions = {}) => persistenceAdapter
        .listSlots()
        .then((slots) => {
        renderSaveSlots(slots);
        if (!refreshOptions.silent) {
            saveStatus.textContent = formatSaveSlotsStatus(slots.length);
        }
        return slots;
    })
        .catch((error) => {
        if (!refreshOptions.silent) {
            saveStatus.textContent = formatSaveFailureStatus("Slots", stringifyError(error));
        }
        return [];
    });
    renderRuntime();
    const onPauseToggle = () => dispatchAndRender(orchestrator, telemetryElements, audioMixer, {
        device: "ui",
        action: "pause-toggle",
        source: "ui:pause-toggle"
    }, renderRuntime);
    const onAdmissionsToggle = () => {
        const events = dispatchAndRender(orchestrator, telemetryElements, audioMixer, {
            device: "ui",
            action: "admissions-toggle",
            source: "ui:admissions-toggle"
        }, renderRuntime);
        updateActionStatus(events);
    };
    const onSpeedSelect = () => {
        const events = dispatchAndRender(orchestrator, telemetryElements, audioMixer, {
            device: "ui",
            action: "speed-set",
            source: "ui:speed-select",
            speedMultiplier: Number(telemetryElements.speedSelect.value)
        }, renderRuntime);
        updateActionStatus(events);
    };
    const onSpeedIncrease = () => {
        const events = dispatchAndRender(orchestrator, telemetryElements, audioMixer, {
            device: "keyboard",
            action: "speed-set",
            source: "KeyZ",
            speedMultiplier: nextSpeedMultiplier(orchestrator.telemetry().speedMultiplier)
        }, renderRuntime);
        updateActionStatus(events);
    };
    const onSpeedSet = (speedMultiplier, source) => {
        const events = dispatchAndRender(orchestrator, telemetryElements, audioMixer, {
            device: "keyboard",
            action: "speed-set",
            source,
            speedMultiplier
        }, renderRuntime);
        updateActionStatus(events);
    };
    const setAdmissionPolicy = (admissionPolicy, source) => {
        const events = dispatchAndRender(orchestrator, telemetryElements, audioMixer, {
            device: "ui",
            action: "admission-policy-set",
            source,
            admissionPolicy
        }, renderRuntime);
        updateActionStatus(events);
    };
    const onAdmissionPolicySelect = () => {
        setAdmissionPolicy(telemetryElements.admissionPolicySelect.value, "ui:admission-policy");
    };
    const onPolicyPanelAdmissionPolicySelect = () => {
        setAdmissionPolicy(policyPanelAdmissionPolicySelect.value, "ui:policy-panel-admission-policy");
    };
    const setPricingPolicy = (pricingPolicy, source) => {
        const events = dispatchAndRender(orchestrator, telemetryElements, audioMixer, {
            device: "ui",
            action: "pricing-policy-set",
            source,
            pricingPolicy
        }, renderRuntime);
        updateActionStatus(events);
    };
    const onPricingPolicySelect = () => {
        setPricingPolicy(telemetryElements.pricingPolicySelect.value, "ui:pricing-policy");
    };
    const onPolicyPanelPricingPolicySelect = () => {
        setPricingPolicy(policyPanelPricingPolicySelect.value, "ui:policy-panel-pricing-policy");
    };
    const onTakeLoan = () => {
        if (!canTakeLoanFromTelemetry(orchestrator.telemetry())) {
            actionStatus.textContent = formatActionStatus("loan.take-blocked");
            renderRuntime();
            return;
        }
        const events = dispatchAndRender(orchestrator, telemetryElements, audioMixer, {
            device: "ui",
            action: "take-loan",
            source: "ui:take-loan"
        }, renderRuntime);
        updateActionStatus(events);
    };
    const onRepayLoan = () => {
        if (!canRepayLoanFromTelemetry(orchestrator.telemetry())) {
            actionStatus.textContent = formatActionStatus("loan.repay-blocked");
            renderRuntime();
            return;
        }
        const events = dispatchAndRender(orchestrator, telemetryElements, audioMixer, {
            device: "ui",
            action: "repay-loan",
            source: "ui:repay-loan"
        }, renderRuntime);
        updateActionStatus(events);
    };
    const onMarketingCampaign = () => {
        if (!canRunMarketingCampaignFromTelemetry(orchestrator.telemetry())) {
            actionStatus.textContent = formatActionStatus("marketing.blocked");
            renderRuntime();
            return;
        }
        const events = dispatchAndRender(orchestrator, telemetryElements, audioMixer, {
            device: "ui",
            action: "run-marketing-campaign",
            source: "ui:run-marketing-campaign"
        }, renderRuntime);
        updateActionStatus(events);
    };
    const onFinanceAudit = () => {
        if (!canRunFinanceAuditFromTelemetry(orchestrator.telemetry())) {
            actionStatus.textContent = formatActionStatus("finance.audit-blocked");
            renderRuntime();
            return;
        }
        const events = dispatchAndRender(orchestrator, telemetryElements, audioMixer, {
            device: "ui",
            action: "run-finance-audit",
            source: "ui:run-finance-audit"
        }, renderRuntime);
        updateActionStatus(events);
    };
    const onStartInsuranceContract = () => {
        if (!canStartInsuranceContractFromTelemetry(orchestrator.telemetry())) {
            actionStatus.textContent = formatActionStatus("insurance.blocked");
            renderRuntime();
            return;
        }
        const events = dispatchAndRender(orchestrator, telemetryElements, audioMixer, {
            device: "ui",
            action: "start-insurance-contract",
            source: "ui:start-insurance-contract"
        }, renderRuntime);
        updateActionStatus(events);
    };
    const onAwardsCeremony = () => {
        if (!canRunAwardsFromTelemetry(orchestrator.telemetry())) {
            actionStatus.textContent = formatActionStatus("awards.blocked");
            renderRuntime();
            return;
        }
        const events = dispatchAndRender(orchestrator, telemetryElements, audioMixer, {
            device: "ui",
            action: "run-awards-ceremony",
            source: "ui:run-awards-ceremony"
        }, renderRuntime);
        updateActionStatus(events);
    };
    const onStartResearch = () => {
        if (!canStartResearchFromTelemetry(orchestrator.telemetry())) {
            actionStatus.textContent = formatActionStatus("research.blocked");
            renderRuntime();
            return;
        }
        const events = dispatchAndRender(orchestrator, telemetryElements, audioMixer, {
            device: "ui",
            action: "start-research",
            source: "ui:start-research"
        }, renderRuntime);
        updateActionStatus(events);
    };
    const onStartEmergency = () => {
        if (!canStartEmergencyFromTelemetry(orchestrator.telemetry())) {
            actionStatus.textContent = formatActionStatus("emergency.blocked");
            renderRuntime();
            return;
        }
        const events = dispatchAndRender(orchestrator, telemetryElements, audioMixer, {
            device: "ui",
            action: "start-emergency-wave",
            source: "ui:start-emergency-wave"
        }, renderRuntime);
        updateActionStatus(events);
    };
    const onStartEpidemic = () => {
        if (!canStartEpidemicFromTelemetry(orchestrator.telemetry())) {
            actionStatus.textContent = formatActionStatus("epidemic.blocked");
            renderRuntime();
            return;
        }
        const events = dispatchAndRender(orchestrator, telemetryElements, audioMixer, {
            device: "ui",
            action: "start-epidemic-outbreak",
            source: "ui:start-epidemic-outbreak"
        }, renderRuntime);
        updateActionStatus(events);
    };
    const onStartVipInspection = () => {
        if (!canStartVipInspectionFromTelemetry(orchestrator.telemetry())) {
            actionStatus.textContent = formatActionStatus("vip.blocked");
            renderRuntime();
            return;
        }
        const events = dispatchAndRender(orchestrator, telemetryElements, audioMixer, {
            device: "ui",
            action: "start-vip-inspection",
            source: "ui:start-vip-inspection"
        }, renderRuntime);
        updateActionStatus(events);
    };
    const onStep = () => dispatchAndRender(orchestrator, telemetryElements, audioMixer, {
        device: "ui",
        action: "step-tick",
        source: "ui:step"
    }, renderRuntime);
    const onAdmit = () => dispatchAndRender(orchestrator, telemetryElements, audioMixer, {
        device: "ui",
        action: "admit-patient",
        severity: Number(admissionSeveritySelect.value),
        source: "ui:admit"
    }, renderRuntime);
    const onTreat = () => {
        const resolved = selectedEntityFromState(orchestrator.getState(), selectedEntity);
        const events = dispatchAndRender(orchestrator, telemetryElements, audioMixer, {
            device: "ui",
            action: "treat-patient",
            ...(resolved?.type === "patient" ? { patientId: resolved.value.id } : {}),
            source: "ui:treat"
        }, renderRuntime);
        if (resolved?.type === "patient") {
            selectedEntity = null;
        }
        updateActionStatus(events);
        renderRuntime();
    };
    const onSendSelectedPatientHome = () => {
        const resolved = selectedEntityFromState(orchestrator.getState(), selectedEntity);
        if (resolved?.type !== "patient") {
            actionStatus.textContent = formatActionStatus("patient.send-home-empty");
            renderRuntime();
            return;
        }
        const events = dispatchAndRender(orchestrator, telemetryElements, audioMixer, {
            device: "ui",
            action: "send-patient-home",
            patientId: resolved.value.id,
            source: "ui:send-selected-patient-home"
        }, renderRuntime);
        selectedEntity = null;
        updateActionStatus(events);
        renderRuntime();
    };
    const onPrioritizeSelectedPatient = () => {
        const resolved = selectedEntityFromState(orchestrator.getState(), selectedEntity);
        if (resolved?.type !== "patient" || !canPrioritizePatient(resolved.value)) {
            actionStatus.textContent = formatActionStatus("patient.prioritize-empty");
            renderRuntime();
            return;
        }
        const events = dispatchAndRender(orchestrator, telemetryElements, audioMixer, {
            device: "ui",
            action: "prioritize-patient",
            patientId: resolved.value.id,
            source: "ui:prioritize-selected-patient"
        }, renderRuntime);
        updateActionStatus(events);
    };
    const onGiveDrinkSelectedPatient = () => {
        const resolved = selectedEntityFromState(orchestrator.getState(), selectedEntity);
        if (resolved?.type !== "patient" || !canGiveDrinkToPatient(resolved.value, orchestrator.telemetry())) {
            actionStatus.textContent = formatActionStatus("patient.drink-blocked");
            renderRuntime();
            return;
        }
        const events = dispatchAndRender(orchestrator, telemetryElements, audioMixer, {
            device: "ui",
            action: "give-patient-drink",
            patientId: resolved.value.id,
            source: "ui:give-drink-selected-patient"
        }, renderRuntime);
        updateActionStatus(events);
        renderRuntime();
    };
    const onSendSelectedPatientToilet = () => {
        const resolved = selectedEntityFromState(orchestrator.getState(), selectedEntity);
        if (resolved?.type !== "patient" || !canSendPatientToilet(resolved.value, orchestrator.telemetry())) {
            actionStatus.textContent = formatActionStatus("patient.toilet-blocked");
            renderRuntime();
            return;
        }
        const events = dispatchAndRender(orchestrator, telemetryElements, audioMixer, {
            device: "ui",
            action: "send-patient-toilet",
            patientId: resolved.value.id,
            source: "ui:send-selected-patient-toilet"
        }, renderRuntime);
        updateActionStatus(events);
        renderRuntime();
    };
    const selectCasebookPatient = (patientId) => {
        const patient = orchestrator.getState().entities.waitingPatients.find((candidate) => candidate.id === patientId);
        if (!patient) {
            return false;
        }
        selectedEntity = { type: "patient", id: patientId };
        selectedTile = patientPosition(patient);
        placementPreview = null;
        actionStatus.textContent = formatSelectedEntityActionStatus("patient");
        renderRuntime();
        return true;
    };
    const onCasebookPanelRowsClick = (event) => {
        const button = event.target.closest("[data-casebook-action]");
        if (!button) {
            return;
        }
        const patientId = Number(button.dataset.patientId);
        if (!selectCasebookPatient(patientId)) {
            return;
        }
        if (button.dataset.casebookAction === "prioritize") {
            onPrioritizeSelectedPatient();
        }
        if (button.dataset.casebookAction === "send-home") {
            onSendSelectedPatientHome();
        }
    };
    const onShootRat = () => {
        const events = dispatchAndRender(orchestrator, telemetryElements, audioMixer, {
            device: "ui",
            action: "shoot-rat",
            source: "ui:shoot-rat"
        }, renderRuntime);
        updateActionStatus(events);
        renderRuntime();
    };
    const onWaterPlant = () => {
        const events = dispatchAndRender(orchestrator, telemetryElements, audioMixer, {
            device: "ui",
            action: "water-plant",
            source: "ui:water-plant"
        }, renderRuntime);
        updateActionStatus(events);
        renderRuntime();
    };
    const onMoveSelectedStaff = () => {
        const resolved = selectedEntityFromState(orchestrator.getState(), selectedEntity);
        if (resolved?.type !== "staff") {
            actionStatus.textContent = formatActionStatus("staff.move-blocked");
            renderRuntime();
            return;
        }
        placementAction = {
            action: "move-staff",
            staffId: resolved.value.id,
            role: resolved.value.role,
            source: "ui:move-selected-staff",
            label: `move ${staffRoleDisplayName(resolved.value.role, hospitalView?.languageSummary ?? null)}`
        };
        placementPreview = null;
        actionStatus.textContent = formatChoosePlacementActionStatus();
        renderRuntime();
    };
    const onRestSelectedStaff = () => {
        const resolved = selectedEntityFromState(orchestrator.getState(), selectedEntity);
        if (resolved?.type !== "staff" || !canRestStaffFromTelemetry(resolved.value)) {
            actionStatus.textContent = formatActionStatus("staff.rest-blocked");
            renderRuntime();
            return;
        }
        const events = dispatchAndRender(orchestrator, telemetryElements, audioMixer, {
            device: "ui",
            action: "rest-staff",
            staffId: resolved.value.id,
            restType: bestStaffRestType(orchestrator.telemetry()),
            source: "ui:rest-selected-staff"
        }, renderRuntime);
        updateActionStatus(events);
        renderRuntime();
    };
    const onTrainSelectedStaff = () => {
        const resolved = selectedEntityFromState(orchestrator.getState(), selectedEntity);
        if (resolved?.type !== "staff" || !canTrainStaffFromTelemetry(resolved.value, orchestrator.telemetry())) {
            actionStatus.textContent = formatActionStatus("training.blocked");
            renderRuntime();
            return;
        }
        const events = dispatchAndRender(orchestrator, telemetryElements, audioMixer, {
            device: "ui",
            action: "train-staff",
            staffId: resolved.value.id,
            source: "ui:train-selected-staff"
        }, renderRuntime);
        updateActionStatus(events);
        renderRuntime();
    };
    const onFireSelectedStaff = () => {
        const resolved = selectedEntityFromState(orchestrator.getState(), selectedEntity);
        if (resolved?.type !== "staff" || !canFireStaff(resolved.value)) {
            actionStatus.textContent = formatActionStatus("staff.fire-blocked");
            renderRuntime();
            return;
        }
        const events = dispatchAndRender(orchestrator, telemetryElements, audioMixer, {
            device: "ui",
            action: "fire-staff",
            staffId: resolved.value.id,
            source: "ui:fire-selected-staff"
        }, renderRuntime);
        selectedEntity = null;
        updateActionStatus(events);
        renderRuntime();
    };
    const onSellSelectedRoom = () => {
        const resolved = selectedEntityFromState(orchestrator.getState(), selectedEntity);
        if (resolved?.type !== "room" || !canSellRoom(resolved.value)) {
            actionStatus.textContent = formatActionStatus("room.sell-blocked");
            renderRuntime();
            return;
        }
        const events = dispatchAndRender(orchestrator, telemetryElements, audioMixer, {
            device: "ui",
            action: "sell-room",
            roomId: resolved.value.id,
            source: "ui:sell-selected-room"
        }, renderRuntime);
        selectedEntity = null;
        updateActionStatus(events);
        renderRuntime();
    };
    const onSellSelectedObject = () => {
        const resolved = selectedEntityFromState(orchestrator.getState(), selectedEntity);
        if (resolved?.type !== "object") {
            actionStatus.textContent = formatActionStatus("object.sell-blocked");
            renderRuntime();
            return;
        }
        const events = dispatchAndRender(orchestrator, telemetryElements, audioMixer, {
            device: "ui",
            action: "sell-object",
            objectId: resolved.value.id,
            source: "ui:sell-selected-object"
        }, renderRuntime);
        selectedEntity = null;
        updateActionStatus(events);
        renderRuntime();
    };
    const onRepairSelectedRoom = () => {
        const resolved = selectedEntityFromState(orchestrator.getState(), selectedEntity);
        if (resolved?.type !== "room") {
            actionStatus.textContent = formatActionStatus("room.repair-blocked");
            renderRuntime();
            return;
        }
        if (!canRepairRoomFromTelemetry(resolved.value, orchestrator.telemetry())) {
            actionStatus.textContent = formatActionStatus("room.repair-blocked");
            renderRuntime();
            return;
        }
        const events = dispatchAndRender(orchestrator, telemetryElements, audioMixer, {
            device: "ui",
            action: "repair-room",
            roomId: resolved.value.id,
            source: "ui:repair-selected-room"
        }, renderRuntime);
        updateActionStatus(events);
    };
    const onStaffBreakToggle = () => {
        const state = orchestrator.getState();
        const resolved = selectedEntityFromState(state, selectedEntity);
        const staff = resolved?.type === "staff" ? resolved.value : defaultStaffBreakTargetFromState(state);
        if (!canToggleStaffBreakFromState(state, staff)) {
            actionStatus.textContent = formatActionStatus("staff.break-blocked");
            renderRuntime();
            return;
        }
        dispatchAndRender(orchestrator, telemetryElements, audioMixer, {
            device: "ui",
            action: "staff-break-toggle",
            source: "ui:staff-break-toggle",
            ...(resolved?.type === "staff" ? { staffId: staff.id } : {})
        }, renderRuntime);
    };
    const onTreatmentRoomToggle = () => {
        const state = orchestrator.getState();
        const resolved = selectedEntityFromState(state, selectedEntity);
        const room = resolved?.type === "room" ? resolved.value : defaultTreatmentRoomToggleTargetFromState(state);
        if (!canToggleTreatmentRoomFromState(state, room)) {
            actionStatus.textContent = formatActionStatus("treatment-room.toggle-blocked");
            renderRuntime();
            return;
        }
        dispatchAndRender(orchestrator, telemetryElements, audioMixer, {
            device: "ui",
            action: "treatment-room-toggle",
            source: "ui:treatment-room-toggle",
            ...(resolved?.type === "room" ? { roomId: room.id } : {})
        }, renderRuntime);
    };
    const onBuildDiagnosisRoom = () => {
        if (!canBuildRoomFromTelemetry("diagnosis", orchestrator.telemetry())) {
            actionStatus.textContent = formatActionStatus("room.build-blocked");
            renderRuntime();
            return;
        }
        placementAction = {
            action: "build-room",
            roomType: "diagnosis",
            orientation: "north",
            source: "ui:build-diagnosis-room",
            label: `build ${roomTypeDisplayName("diagnosis", hospitalView?.languageSummary ?? null)}`
        };
        placementPreview = null;
        selectedEntity = null;
        actionStatus.textContent = formatChoosePlacementActionStatus();
        renderRuntime();
    };
    const onBuildTreatmentRoom = () => {
        if (!canBuildRoomFromTelemetry("treatment", orchestrator.telemetry())) {
            actionStatus.textContent = formatActionStatus("room.build-blocked");
            renderRuntime();
            return;
        }
        placementAction = {
            action: "build-room",
            roomType: "treatment",
            orientation: "north",
            source: "ui:build-treatment-room",
            label: `build ${roomTypeDisplayName("treatment", hospitalView?.languageSummary ?? null)}`
        };
        placementPreview = null;
        selectedEntity = null;
        actionStatus.textContent = formatChoosePlacementActionStatus();
        renderRuntime();
    };
    const onBuildPharmacyRoom = () => {
        if (!canBuildRoomFromTelemetry("pharmacy", orchestrator.telemetry())) {
            actionStatus.textContent = formatActionStatus("room.build-blocked");
            renderRuntime();
            return;
        }
        placementAction = {
            action: "build-room",
            roomType: "pharmacy",
            orientation: "north",
            source: "ui:build-pharmacy-room",
            label: `build ${roomTypeDisplayName("pharmacy", hospitalView?.languageSummary ?? null)}`
        };
        placementPreview = null;
        selectedEntity = null;
        actionStatus.textContent = formatChoosePlacementActionStatus();
        renderRuntime();
    };
    const onBuildSpecialistRoom = () => {
        if (!canBuildRoomFromTelemetry("specialist", orchestrator.telemetry())) {
            actionStatus.textContent = formatActionStatus("room.build-blocked");
            renderRuntime();
            return;
        }
        placementAction = {
            action: "build-room",
            roomType: "specialist",
            orientation: "north",
            source: "ui:build-specialist-room",
            label: `build ${roomTypeDisplayName("specialist", hospitalView?.languageSummary ?? null)}`
        };
        placementPreview = null;
        selectedEntity = null;
        actionStatus.textContent = formatChoosePlacementActionStatus();
        renderRuntime();
    };
    const onHireDiagnostician = () => {
        if (!canHireStaffFromTelemetry("diagnostician", orchestrator.telemetry())) {
            actionStatus.textContent = formatActionStatus("staff.hire-blocked");
            renderRuntime();
            return;
        }
        placementAction = {
            action: "hire-staff",
            role: "diagnostician",
            source: "ui:hire-diagnostician",
            label: `hire ${staffRoleDisplayName("diagnostician", hospitalView?.languageSummary ?? null)}`
        };
        placementPreview = null;
        selectedEntity = null;
        actionStatus.textContent = formatChoosePlacementActionStatus();
        renderRuntime();
    };
    const onHireNurse = () => {
        if (!canHireStaffFromTelemetry("nurse", orchestrator.telemetry())) {
            actionStatus.textContent = formatActionStatus("staff.hire-blocked");
            renderRuntime();
            return;
        }
        placementAction = {
            action: "hire-staff",
            role: "nurse",
            source: "ui:hire-nurse",
            label: `hire ${staffRoleDisplayName("nurse", hospitalView?.languageSummary ?? null)}`
        };
        placementPreview = null;
        selectedEntity = null;
        actionStatus.textContent = formatChoosePlacementActionStatus();
        renderRuntime();
    };
    const onHireHandyman = () => {
        if (!canHireStaffFromTelemetry("handyman", orchestrator.telemetry())) {
            actionStatus.textContent = formatActionStatus("staff.hire-blocked");
            renderRuntime();
            return;
        }
        placementAction = {
            action: "hire-staff",
            role: "handyman",
            source: "ui:hire-handyman",
            label: `hire ${staffRoleDisplayName("handyman", hospitalView?.languageSummary ?? null)}`
        };
        placementPreview = null;
        selectedEntity = null;
        actionStatus.textContent = formatChoosePlacementActionStatus();
        renderRuntime();
    };
    const onHireReceptionist = () => {
        if (!canHireStaffFromTelemetry("receptionist", orchestrator.telemetry())) {
            actionStatus.textContent = formatActionStatus("staff.hire-blocked");
            renderRuntime();
            return;
        }
        placementAction = {
            action: "hire-staff",
            role: "receptionist",
            source: "ui:hire-receptionist",
            label: `hire ${staffRoleDisplayName("receptionist", hospitalView?.languageSummary ?? null)}`
        };
        placementPreview = null;
        selectedEntity = null;
        actionStatus.textContent = formatChoosePlacementActionStatus();
        renderRuntime();
    };
    const closeStaffPanelForPlacement = () => {
        if (placementAction?.action === "hire-staff") {
            staffPanel.hidden = true;
        }
    };
    const onStaffPanelHireDiagnostician = () => {
        onHireDiagnostician();
        closeStaffPanelForPlacement();
    };
    const onStaffPanelHireNurse = () => {
        onHireNurse();
        closeStaffPanelForPlacement();
    };
    const onStaffPanelHireHandyman = () => {
        onHireHandyman();
        closeStaffPanelForPlacement();
    };
    const onStaffPanelHireReceptionist = () => {
        onHireReceptionist();
        closeStaffPanelForPlacement();
    };
    const onSaveGame = () => {
        const slot = activeSaveSlot();
        saveSlotNameInput.value = slot;
        saveStatus.textContent = formatSaveLifecycleStatus("saving");
        void saveOrchestratorToSlot(persistenceAdapter, slot, orchestrator, {
            mapView: createHospitalMapViewSnapshot(hospitalView)
        })
            .then(() => {
            saveStatus.textContent = formatSaveTickStatus(orchestrator.telemetry().tick, slot);
            return refreshSaveSlots({ silent: true });
        })
            .catch((error) => {
            saveStatus.textContent = formatSaveFailureStatus("Save", stringifyError(error));
        });
    };
    const onLoadGame = () => {
        const slot = activeSaveSlot();
        saveSlotNameInput.value = slot;
        saveStatus.textContent = formatSaveLifecycleStatus("loading");
        void persistenceAdapter.loadSlot(slot, {
            fallbackSeed: options.seed,
            defaultTickRateHz: options.tickRateHz ?? DEFAULT_TICK_RATE_HZ,
            defaultPointerTileSize: options.pointerTileSize ?? DEFAULT_POINTER_TILE_SIZE
        })
            .then((loaded) => {
            if (loaded.status === "fallback" && loaded.issues.includes("missing-save-slot")) {
                saveStatus.textContent = formatSaveLifecycleStatus("no slot");
                return;
            }
            const mapRestored = restoreHospitalMapViewSnapshot(hospitalView, loaded.envelope.payload.mapView);
            if (!mapRestored) {
                saveStatus.textContent = formatMissingMapLoadStatus(loaded.envelope.payload.mapView.mapPath);
                return;
            }
            hospitalMapSelect.value = hospitalView?.mapPath ?? "";
            orchestrator = restoreOrchestratorFromSaveEnvelope(loaded.envelope, createRestoreOptionsFromHospitalView(hospitalView));
            resetInteractionState();
            saveStatus.textContent = formatLoadResultStatus(loaded.status, orchestrator.telemetry().tick, slot);
            renderRuntime();
        })
            .catch((error) => {
            saveStatus.textContent = formatSaveFailureStatus("Load", stringifyError(error));
        });
    };
    const onRefreshSaveSlots = () => {
        void refreshSaveSlots();
    };
    const onDeleteSaveSlot = () => {
        const slot = activeSaveSlot();
        saveSlotNameInput.value = slot;
        saveStatus.textContent = formatSaveLifecycleStatus("deleting");
        void persistenceAdapter
            .deleteSlot(slot)
            .then(() => refreshSaveSlots({ silent: true }))
            .then(() => {
            saveStatus.textContent = formatDeletedSaveSlotStatus(slot);
        })
            .catch((error) => {
            saveStatus.textContent = formatSaveFailureStatus("Delete", stringifyError(error));
        });
    };
    const onSaveSlotSelectChange = () => {
        saveSlotNameInput.value = saveSlotSelect.value || DEFAULT_SAVE_SLOT;
    };
    const onMuteToggle = () => {
        requestAudioInitialization(audioMixer, orchestrator, telemetryElements, renderRuntime);
        audioMixer.setMuted(!audioMixer.status().muted);
        renderRuntime();
    };
    const onSoundMuteToggle = () => {
        requestAudioInitialization(audioMixer, orchestrator, telemetryElements, renderRuntime);
        audioMixer.setSoundMuted(!audioMixer.status().soundMuted);
        renderRuntime();
    };
    const onMusicMuteToggle = () => {
        requestAudioInitialization(audioMixer, orchestrator, telemetryElements, renderRuntime);
        audioMixer.setMusicMuted(!audioMixer.status().musicMuted);
        renderRuntime();
    };
    const setAudioVolumePercent = (volumePercent) => {
        requestAudioInitialization(audioMixer, orchestrator, telemetryElements, renderRuntime);
        audioMixer.setVolume(volumePercent / 100);
        renderRuntime();
    };
    const onVolumeInput = () => {
        setAudioVolumePercent(clamp(Number(telemetryElements.volumeSlider.value), 0, 100));
    };
    const onJukeboxPanelVolumeInput = () => {
        setAudioVolumePercent(clamp(Number(jukeboxPanelVolumeSlider.value), 0, 100));
    };
    const onOpenJukebox = () => {
        casebookPanel.hidden = true;
        bankManagerPanel.hidden = true;
        bankStatsPanel.hidden = true;
        staffPanel.hidden = true;
        researchPanel.hidden = true;
        statusPanel.hidden = true;
        chartsPanel.hidden = true;
        mapPanel.hidden = true;
        policyPanel.hidden = true;
        machineMenuPanel.hidden = true;
        messagePanel.hidden = true;
        jukeboxPanel.hidden = false;
        furnishCorridorPanel.hidden = true;
        editRoomPanel.hidden = true;
        actionStatus.textContent = formatPanelActionStatus("jukebox", "opened");
        renderRuntime();
        jukeboxPanelVolumeSlider.focus();
        return true;
    };
    const onCloseJukeboxPanel = () => {
        jukeboxPanel.hidden = true;
        actionStatus.textContent = formatPanelActionStatus("jukebox", "closed");
        playfield.focus();
    };
    const onOpenHireStaff = () => {
        const firstEnabledHireButton = hireStaffButtons.find((button) => !button.disabled);
        if (!firstEnabledHireButton) {
            actionStatus.textContent = formatActionStatus("staff.hire-blocked");
            renderRuntime();
            return true;
        }
        firstEnabledHireButton.focus();
        return true;
    };
    const onOpenCasebook = () => {
        bankManagerPanel.hidden = true;
        bankStatsPanel.hidden = true;
        staffPanel.hidden = true;
        researchPanel.hidden = true;
        statusPanel.hidden = true;
        chartsPanel.hidden = true;
        mapPanel.hidden = true;
        policyPanel.hidden = true;
        machineMenuPanel.hidden = true;
        messagePanel.hidden = true;
        jukeboxPanel.hidden = true;
        furnishCorridorPanel.hidden = true;
        editRoomPanel.hidden = true;
        casebookPanel.hidden = false;
        actionStatus.textContent = formatPanelActionStatus("casebook", "opened");
        renderRuntime();
        const firstCasebookButton = casebookPanelRows.querySelector("button");
        (firstCasebookButton ?? casebookPanelCloseButton).focus();
        return true;
    };
    const onCloseCasebookPanel = () => {
        casebookPanel.hidden = true;
        actionStatus.textContent = formatPanelActionStatus("casebook", "closed");
        playfield.focus();
    };
    const onOpenBankManager = () => {
        casebookPanel.hidden = true;
        bankStatsPanel.hidden = true;
        staffPanel.hidden = true;
        researchPanel.hidden = true;
        statusPanel.hidden = true;
        chartsPanel.hidden = true;
        mapPanel.hidden = true;
        policyPanel.hidden = true;
        machineMenuPanel.hidden = true;
        messagePanel.hidden = true;
        jukeboxPanel.hidden = true;
        furnishCorridorPanel.hidden = true;
        editRoomPanel.hidden = true;
        bankManagerPanel.hidden = false;
        actionStatus.textContent = formatPanelActionStatus("bank manager", "opened");
        renderRuntime();
        const firstEnabledBankButton = [bankManagerTakeLoanButton, bankManagerRepayLoanButton].find((button) => !button.disabled);
        (firstEnabledBankButton ?? bankManagerCloseButton).focus();
        return true;
    };
    const onCloseBankManager = () => {
        bankManagerPanel.hidden = true;
        actionStatus.textContent = formatPanelActionStatus("bank manager", "closed");
        playfield.focus();
    };
    const onOpenBankStats = () => {
        casebookPanel.hidden = true;
        bankManagerPanel.hidden = true;
        staffPanel.hidden = true;
        researchPanel.hidden = true;
        statusPanel.hidden = true;
        chartsPanel.hidden = true;
        mapPanel.hidden = true;
        policyPanel.hidden = true;
        machineMenuPanel.hidden = true;
        messagePanel.hidden = true;
        jukeboxPanel.hidden = true;
        furnishCorridorPanel.hidden = true;
        editRoomPanel.hidden = true;
        bankStatsPanel.hidden = false;
        actionStatus.textContent = formatPanelActionStatus("bank stats", "opened");
        renderRuntime();
        (bankStatsRunAuditButton.disabled ? bankStatsCloseButton : bankStatsRunAuditButton).focus();
        return true;
    };
    const onCloseBankStats = () => {
        bankStatsPanel.hidden = true;
        actionStatus.textContent = formatPanelActionStatus("bank stats", "closed");
        playfield.focus();
    };
    const onOpenStaff = () => {
        casebookPanel.hidden = true;
        bankManagerPanel.hidden = true;
        bankStatsPanel.hidden = true;
        researchPanel.hidden = true;
        statusPanel.hidden = true;
        chartsPanel.hidden = true;
        mapPanel.hidden = true;
        policyPanel.hidden = true;
        machineMenuPanel.hidden = true;
        messagePanel.hidden = true;
        jukeboxPanel.hidden = true;
        furnishCorridorPanel.hidden = true;
        editRoomPanel.hidden = true;
        staffPanel.hidden = false;
        actionStatus.textContent = formatPanelActionStatus("staff panel", "opened");
        renderRuntime();
        const firstEnabledStaffButton = staffPanelHireButtons.find((button) => !button.disabled);
        (firstEnabledStaffButton ?? staffPanelCloseButton).focus();
        return true;
    };
    const onCloseStaffPanel = () => {
        staffPanel.hidden = true;
        actionStatus.textContent = formatPanelActionStatus("staff panel", "closed");
        playfield.focus();
    };
    const onOpenFurnishCorridor = () => {
        casebookPanel.hidden = true;
        bankManagerPanel.hidden = true;
        bankStatsPanel.hidden = true;
        staffPanel.hidden = true;
        researchPanel.hidden = true;
        statusPanel.hidden = true;
        chartsPanel.hidden = true;
        mapPanel.hidden = true;
        policyPanel.hidden = true;
        machineMenuPanel.hidden = true;
        messagePanel.hidden = true;
        jukeboxPanel.hidden = true;
        furnishCorridorPanel.hidden = false;
        editRoomPanel.hidden = true;
        actionStatus.textContent = formatPanelActionStatus("furnish corridor", "opened");
        renderRuntime();
        const firstFurnishButton = furnishCorridorPanelRows.querySelector("button:not(:disabled)");
        (firstFurnishButton ?? furnishCorridorPanelCloseButton).focus();
        return true;
    };
    const onCloseFurnishCorridorPanel = () => {
        furnishCorridorPanel.hidden = true;
        actionStatus.textContent = formatPanelActionStatus("furnish corridor", "closed");
        playfield.focus();
    };
    const onFurnishCorridorPanelRowsClick = (event) => {
        const button = event.target instanceof Element ? event.target.closest("[data-testid='furnish-corridor-object']") : null;
        if (!button || button.disabled) {
            return;
        }
        const objectIndex = Number(button.getAttribute("data-object-index"));
        if (!Number.isInteger(objectIndex) || objectIndex < 0) {
            return;
        }
        const objectName = button.getAttribute("data-object-name") || `object ${objectIndex}`;
        const cost = Number(button.getAttribute("data-object-cost") ?? "0");
        const strength = Number(button.getAttribute("data-object-strength") ?? "0");
        placementAction = {
            action: "place-object",
            objectIndex,
            objectName,
            cost: Number.isInteger(cost) && cost > 0 ? cost : 0,
            ...(Number.isInteger(strength) && strength > 0 ? { strength } : {}),
            source: "ui:furnish-corridor",
            label: `place ${objectName}`,
            orientation: "north"
        };
        placementPreview = null;
        selectedEntity = null;
        furnishCorridorPanel.hidden = true;
        actionStatus.textContent = formatChoosePlacementActionStatus();
        renderRuntime();
        playfield.focus();
    };
    const onOpenEditRoom = () => {
        const state = orchestrator.getState();
        const resolved = selectedEntityFromState(state, selectedEntity);
        if (resolved?.type !== "room") {
            selectedEntity = firstEditableRoomEntityFromState(state);
        }
        casebookPanel.hidden = true;
        bankManagerPanel.hidden = true;
        bankStatsPanel.hidden = true;
        staffPanel.hidden = true;
        researchPanel.hidden = true;
        statusPanel.hidden = true;
        chartsPanel.hidden = true;
        mapPanel.hidden = true;
        policyPanel.hidden = true;
        machineMenuPanel.hidden = true;
        messagePanel.hidden = true;
        jukeboxPanel.hidden = true;
        furnishCorridorPanel.hidden = true;
        editRoomPanel.hidden = false;
        actionStatus.textContent = formatPanelActionStatus("edit room", "opened");
        renderRuntime();
        const firstEnabledEditButton = [editRoomPanelToggleButton, editRoomPanelRepairButton, editRoomPanelSellButton].find((button) => !button.disabled);
        (firstEnabledEditButton ?? editRoomPanelCloseButton).focus();
        return true;
    };
    const onCloseEditRoomPanel = () => {
        editRoomPanel.hidden = true;
        actionStatus.textContent = formatPanelActionStatus("edit room", "closed");
        playfield.focus();
    };
    const onOpenResearch = () => {
        casebookPanel.hidden = true;
        bankManagerPanel.hidden = true;
        bankStatsPanel.hidden = true;
        staffPanel.hidden = true;
        statusPanel.hidden = true;
        chartsPanel.hidden = true;
        mapPanel.hidden = true;
        policyPanel.hidden = true;
        machineMenuPanel.hidden = true;
        messagePanel.hidden = true;
        jukeboxPanel.hidden = true;
        furnishCorridorPanel.hidden = true;
        editRoomPanel.hidden = true;
        researchPanel.hidden = false;
        actionStatus.textContent = formatPanelActionStatus("research panel", "opened");
        renderRuntime();
        (researchPanelStartButton.disabled ? researchPanelCloseButton : researchPanelStartButton).focus();
        return true;
    };
    const onCloseResearchPanel = () => {
        researchPanel.hidden = true;
        actionStatus.textContent = formatPanelActionStatus("research panel", "closed");
        playfield.focus();
    };
    const onOpenStatus = () => {
        casebookPanel.hidden = true;
        bankManagerPanel.hidden = true;
        bankStatsPanel.hidden = true;
        staffPanel.hidden = true;
        researchPanel.hidden = true;
        chartsPanel.hidden = true;
        mapPanel.hidden = true;
        policyPanel.hidden = true;
        machineMenuPanel.hidden = true;
        messagePanel.hidden = true;
        jukeboxPanel.hidden = true;
        furnishCorridorPanel.hidden = true;
        editRoomPanel.hidden = true;
        statusPanel.hidden = false;
        actionStatus.textContent = formatPanelActionStatus("status panel", "opened");
        renderRuntime();
        statusPanelCloseButton.focus();
        return true;
    };
    const onCloseStatusPanel = () => {
        statusPanel.hidden = true;
        actionStatus.textContent = formatPanelActionStatus("status panel", "closed");
        playfield.focus();
    };
    const onOpenCharts = () => {
        casebookPanel.hidden = true;
        bankManagerPanel.hidden = true;
        bankStatsPanel.hidden = true;
        staffPanel.hidden = true;
        researchPanel.hidden = true;
        statusPanel.hidden = true;
        mapPanel.hidden = true;
        policyPanel.hidden = true;
        machineMenuPanel.hidden = true;
        messagePanel.hidden = true;
        jukeboxPanel.hidden = true;
        furnishCorridorPanel.hidden = true;
        editRoomPanel.hidden = true;
        chartsPanel.hidden = false;
        actionStatus.textContent = formatPanelActionStatus("charts panel", "opened");
        renderRuntime();
        chartsPanelCloseButton.focus();
        return true;
    };
    const onCloseChartsPanel = () => {
        chartsPanel.hidden = true;
        actionStatus.textContent = formatPanelActionStatus("charts panel", "closed");
        playfield.focus();
    };
    const onOpenMap = () => {
        casebookPanel.hidden = true;
        bankManagerPanel.hidden = true;
        bankStatsPanel.hidden = true;
        staffPanel.hidden = true;
        researchPanel.hidden = true;
        statusPanel.hidden = true;
        chartsPanel.hidden = true;
        policyPanel.hidden = true;
        machineMenuPanel.hidden = true;
        messagePanel.hidden = true;
        jukeboxPanel.hidden = true;
        furnishCorridorPanel.hidden = true;
        editRoomPanel.hidden = true;
        mapPanel.hidden = false;
        mapPanelSelect.value = hospitalView?.mapPath ?? "";
        actionStatus.textContent = formatPanelActionStatus("town map", "opened");
        renderRuntime();
        mapPanelSelect.focus();
        return true;
    };
    const onCloseMapPanel = () => {
        mapPanel.hidden = true;
        actionStatus.textContent = formatPanelActionStatus("town map", "closed");
        playfield.focus();
    };
    const onOpenPolicy = () => {
        casebookPanel.hidden = true;
        bankManagerPanel.hidden = true;
        bankStatsPanel.hidden = true;
        staffPanel.hidden = true;
        researchPanel.hidden = true;
        statusPanel.hidden = true;
        chartsPanel.hidden = true;
        mapPanel.hidden = true;
        machineMenuPanel.hidden = true;
        messagePanel.hidden = true;
        jukeboxPanel.hidden = true;
        furnishCorridorPanel.hidden = true;
        editRoomPanel.hidden = true;
        policyPanel.hidden = false;
        actionStatus.textContent = formatPanelActionStatus("policy panel", "opened");
        renderRuntime();
        policyPanelAdmissionPolicySelect.focus();
        return true;
    };
    const onClosePolicyPanel = () => {
        policyPanel.hidden = true;
        actionStatus.textContent = formatPanelActionStatus("policy panel", "closed");
        playfield.focus();
    };
    const onOpenMachineMenu = () => {
        casebookPanel.hidden = true;
        bankManagerPanel.hidden = true;
        bankStatsPanel.hidden = true;
        staffPanel.hidden = true;
        researchPanel.hidden = true;
        statusPanel.hidden = true;
        chartsPanel.hidden = true;
        mapPanel.hidden = true;
        policyPanel.hidden = true;
        messagePanel.hidden = true;
        jukeboxPanel.hidden = true;
        furnishCorridorPanel.hidden = true;
        editRoomPanel.hidden = true;
        machineMenuPanel.hidden = false;
        actionStatus.textContent = formatPanelActionStatus("machine menu", "opened");
        renderRuntime();
        (machineMenuRepairSelectedRoomButton.disabled ? machineMenuCloseButton : machineMenuRepairSelectedRoomButton).focus();
        return true;
    };
    const onCloseMachineMenu = () => {
        machineMenuPanel.hidden = true;
        actionStatus.textContent = formatPanelActionStatus("machine menu", "closed");
        playfield.focus();
    };
    const onOpenFirstMessage = () => {
        const telemetry = orchestrator.telemetry();
        casebookPanel.hidden = true;
        bankManagerPanel.hidden = true;
        bankStatsPanel.hidden = true;
        staffPanel.hidden = true;
        researchPanel.hidden = true;
        statusPanel.hidden = true;
        chartsPanel.hidden = true;
        mapPanel.hidden = true;
        policyPanel.hidden = true;
        machineMenuPanel.hidden = true;
        jukeboxPanel.hidden = true;
        furnishCorridorPanel.hidden = true;
        editRoomPanel.hidden = true;
        messagePanel.hidden = false;
        actionStatus.textContent = telemetry.lastEventType ? formatPanelActionStatus("message", "opened") : formatNoMessagesActionStatus();
        renderRuntime();
        messagePanelCloseButton.focus();
        return true;
    };
    const onCloseMessagePanel = () => {
        messagePanel.hidden = true;
        actionStatus.textContent = formatPanelActionStatus("message", "closed");
        playfield.focus();
    };
    let advisorVisible = true;
    let announcementsVisible = true;
    let informationVisible = false;
    let transparentWallsHeld = false;
    let transparentWallsToggled = false;
    const setAdvisorVisible = (visible) => {
        advisorVisible = visible;
        telemetryElements.advisorStatusMetric.hidden = !advisorVisible;
    };
    const setAnnouncementsVisible = (visible) => {
        announcementsVisible = visible;
        telemetryElements.eventsMetric.hidden = !announcementsVisible;
        telemetryElements.lastEventMetric.hidden = !announcementsVisible;
        telemetryElements.recentEventsMetric.hidden = !announcementsVisible;
    };
    const onToggleInformation = () => {
        informationVisible = !informationVisible;
        informationStatus.textContent = formatInformationStatus(informationVisible);
        informationStatus.focus();
        actionStatus.textContent = formatVisibilityActionStatus("information", informationVisible);
        return true;
    };
    const setTransparentWallsVisible = (visible) => {
        if (!hospitalView) {
            return;
        }
        hospitalView.transparentWalls = visible;
    };
    const reportTransparentWallsUnavailable = () => {
        actionStatus.textContent = formatActionStatus("transparent-walls.unavailable");
        renderRuntime();
        return true;
    };
    const updateTransparentWalls = () => {
        setTransparentWallsVisible(transparentWallsHeld || transparentWallsToggled);
        renderHospital();
    };
    const onToggleAdvisor = () => {
        setAdvisorVisible(!advisorVisible);
        actionStatus.textContent = formatVisibilityActionStatus("advisor", advisorVisible);
        return true;
    };
    const onToggleAnnouncements = () => {
        setAnnouncementsVisible(!announcementsVisible);
        actionStatus.textContent = formatVisibilityActionStatus("announcements", announcementsVisible);
        return true;
    };
    const onHoldTransparentWalls = () => {
        if (!hospitalView?.map) {
            return reportTransparentWallsUnavailable();
        }
        transparentWallsHeld = true;
        updateTransparentWalls();
        actionStatus.textContent = formatTransparentWallsActionStatus("held");
        return true;
    };
    const onReleaseTransparentWalls = () => {
        if (!transparentWallsHeld) {
            return false;
        }
        transparentWallsHeld = false;
        updateTransparentWalls();
        actionStatus.textContent = formatTransparentWallsActionStatus(hospitalView?.transparentWalls ? "shown" : "released");
        return true;
    };
    const onToggleTransparentWalls = () => {
        if (!hospitalView?.map) {
            return reportTransparentWallsUnavailable();
        }
        transparentWallsToggled = !transparentWallsToggled;
        updateTransparentWalls();
        actionStatus.textContent = formatTransparentWallsActionStatus(hospitalView?.transparentWalls ? "shown" : "hidden");
        return true;
    };
    const actionForHospitalPointer = (action, point) => {
        lastPlacementEvaluation = null;
        if (!action || !hospitalView || !point) {
            return action;
        }
        const tile = resolveHospitalTileFromCanvasPoint(hospitalView, point);
        if (!tile) {
            return action;
        }
        selectedTile = tile;
        if (placementAction && action.action === "treat-patient") {
            const nextAction = createPlacementDispatchAction(placementAction, tile);
            lastPlacementEvaluation = orchestrator.evaluatePlacement(nextAction);
            placementAction = null;
            placementPreview = null;
            selectedEntity = null;
            return nextAction;
        }
        if (placementAction) {
            placementPreview = orchestrator.evaluatePlacement(createPlacementDispatchAction(placementAction, tile));
        }
        if (!placementAction && action.action === "treat-patient") {
            const target = findSelectableEntityAtTile(orchestrator.getState(), tile);
            if (target?.type === "staff" || target?.type === "room") {
                selectedEntity = target;
                actionStatus.textContent = formatSelectedEntityActionStatus(target.type);
                return null;
            }
            if (target?.type === "patient") {
                selectedEntity = target;
                actionStatus.textContent = formatSelectedEntityActionStatus(target.type);
                return null;
            }
            selectedEntity = null;
        }
        return {
            ...action,
            pointer: {
                x: tile.x * orchestrator.pointerTileSize,
                y: tile.y * orchestrator.pointerTileSize
            }
        };
    };
    const onMouseDown = (event) => {
        const action = normalizeMouseEvent({
            type: event.type,
            button: event.button,
            clientX: event.clientX,
            clientY: event.clientY
        });
        const nextAction = actionForHospitalPointer(action, canvasPointerFromEvent(event, hospitalCanvas));
        const events = dispatchAndRender(orchestrator, telemetryElements, audioMixer, nextAction, renderRuntime);
        if (!nextAction) {
            renderRuntime();
        }
        updateActionStatus(events, lastPlacementEvaluation);
    };
    const onMouseMove = (event) => {
        if (!placementAction) {
            return;
        }
        updatePlacementPreviewForPoint(canvasPointerFromEvent(event, hospitalCanvas));
    };
    const onMouseLeave = () => {
        if (!placementAction || !placementPreview) {
            return;
        }
        placementPreview = null;
        renderHospital();
    };
    const onTouchStart = (event) => {
        const touches = Array.from(event.touches).map((touch) => ({
            clientX: touch.clientX,
            clientY: touch.clientY
        }));
        const action = normalizeTouchEvent({
            type: event.type,
            touches
        });
        const firstTouch = event.touches[0];
        const point = firstTouch ? canvasPointerFromEvent(firstTouch, hospitalCanvas) : null;
        const nextAction = actionForHospitalPointer(action, point);
        const events = dispatchAndRender(orchestrator, telemetryElements, audioMixer, nextAction, renderRuntime);
        if (!nextAction) {
            renderRuntime();
        }
        updateActionStatus(events, lastPlacementEvaluation);
    };
    const onKeyDown = (event) => {
        const action = normalizeKeyboardEvent({
            type: event.type,
            code: event.code,
            repeat: event.repeat,
            altKey: event.altKey,
            ctrlKey: event.ctrlKey,
            metaKey: event.metaKey,
            shiftKey: event.shiftKey
        });
        if (shouldSuppressAppShortcut(event, action)) {
            return;
        }
        if (action?.action === "camera-west") {
            event.preventDefault();
            onCameraWest();
            return;
        }
        if (action?.action === "camera-east") {
            event.preventDefault();
            onCameraEast();
            return;
        }
        if (action?.action === "camera-north") {
            event.preventDefault();
            onCameraNorth();
            return;
        }
        if (action?.action === "camera-south") {
            event.preventDefault();
            onCameraSouth();
            return;
        }
        if (action?.action === "camera-store-position") {
            if (onStoreCameraPosition(action.slot)) {
                event.preventDefault();
            }
            return;
        }
        if (action?.action === "camera-recall-position") {
            if (onRecallCameraPosition(action.slot)) {
                event.preventDefault();
            }
            return;
        }
        if (action?.action === "pause-toggle" && placementAction) {
            if (onRotatePlacement()) {
                event.preventDefault();
            }
            return;
        }
        if (action?.action === "pause-toggle") {
            event.preventDefault();
        }
        if (action?.action === "send-patient-home") {
            event.preventDefault();
            onSendSelectedPatientHome();
            return;
        }
        if (action?.action === "speed-increase") {
            event.preventDefault();
            onSpeedIncrease();
            return;
        }
        if (action?.action === "speed-set") {
            event.preventDefault();
            onSpeedSet(action.speedMultiplier, action.source);
            return;
        }
        if (action?.action === "zoom-in") {
            event.preventDefault();
            onZoomHospitalView(1);
            return;
        }
        if (action?.action === "zoom-in-more") {
            event.preventDefault();
            onZoomHospitalView(2);
            return;
        }
        if (action?.action === "zoom-out") {
            event.preventDefault();
            onZoomHospitalView(-1);
            return;
        }
        if (action?.action === "zoom-out-more") {
            event.preventDefault();
            onZoomHospitalView(-2);
            return;
        }
        if (action?.action === "zoom-reset") {
            event.preventDefault();
            onResetHospitalZoom();
            return;
        }
        if (action?.action === "transparent-walls-hold") {
            if (onHoldTransparentWalls()) {
                event.preventDefault();
            }
            return;
        }
        if (action?.action === "transparent-walls-toggle") {
            if (onToggleTransparentWalls()) {
                event.preventDefault();
            }
            return;
        }
        if (action?.action === "advisor-toggle") {
            if (onToggleAdvisor()) {
                event.preventDefault();
            }
            return;
        }
        if (action?.action === "announcements-toggle") {
            if (onToggleAnnouncements()) {
                event.preventDefault();
            }
            return;
        }
        if (action?.action === "build-room") {
            event.preventDefault();
            onBuildDiagnosisRoom();
            return;
        }
        if (action?.action === "open-hire-staff") {
            if (onOpenHireStaff()) {
                event.preventDefault();
            }
            return;
        }
        if (action?.action === "open-casebook") {
            if (onOpenCasebook()) {
                event.preventDefault();
            }
            return;
        }
        if (action?.action === "open-bank-manager") {
            if (onOpenBankManager()) {
                event.preventDefault();
            }
            return;
        }
        if (action?.action === "open-bank-stats") {
            if (onOpenBankStats()) {
                event.preventDefault();
            }
            return;
        }
        if (action?.action === "open-staff") {
            if (onOpenStaff()) {
                event.preventDefault();
            }
            return;
        }
        if (action?.action === "open-furnish-corridor") {
            if (onOpenFurnishCorridor()) {
                event.preventDefault();
            }
            return;
        }
        if (action?.action === "open-edit-room") {
            if (onOpenEditRoom()) {
                event.preventDefault();
            }
            return;
        }
        if (action?.action === "open-map") {
            if (onOpenMap()) {
                event.preventDefault();
            }
            return;
        }
        if (action?.action === "open-research") {
            if (onOpenResearch()) {
                event.preventDefault();
            }
            return;
        }
        if (action?.action === "open-status") {
            if (onOpenStatus()) {
                event.preventDefault();
            }
            return;
        }
        if (action?.action === "open-charts") {
            if (onOpenCharts()) {
                event.preventDefault();
            }
            return;
        }
        if (action?.action === "open-policy") {
            if (onOpenPolicy()) {
                event.preventDefault();
            }
            return;
        }
        if (action?.action === "open-machine-menu") {
            if (onOpenMachineMenu()) {
                event.preventDefault();
            }
            return;
        }
        if (action?.action === "open-first-message") {
            if (onOpenFirstMessage()) {
                event.preventDefault();
            }
            return;
        }
        if (action?.action === "information-toggle") {
            if (onToggleInformation()) {
                event.preventDefault();
            }
            return;
        }
        if (action?.action === "cancel-action") {
            if (onCancelAction(action.source)) {
                event.preventDefault();
            }
            return;
        }
        if (action?.action === "confirm-action") {
            if (onConfirmAction()) {
                event.preventDefault();
            }
            return;
        }
        if (action?.action === "save-game") {
            event.preventDefault();
            onSaveGame();
            return;
        }
        if (action?.action === "load-game") {
            event.preventDefault();
            onLoadGame();
            return;
        }
        if (action?.action === "restart-level") {
            event.preventDefault();
            onRestartLevel();
            return;
        }
        if (action?.action === "quit-level") {
            event.preventDefault();
            onOpenQuitLevelConfirmation();
            return;
        }
        if (action?.action === "next-level") {
            event.preventDefault();
            onNextLevel();
            return;
        }
        if (action?.action === "audio-mute-toggle") {
            event.preventDefault();
            onMuteToggle();
            return;
        }
        if (action?.action === "sound-mute-toggle") {
            event.preventDefault();
            onSoundMuteToggle();
            return;
        }
        if (action?.action === "music-mute-toggle") {
            event.preventDefault();
            onMusicMuteToggle();
            return;
        }
        if (action?.action === "open-jukebox") {
            if (onOpenJukebox()) {
                event.preventDefault();
            }
            return;
        }
        dispatchAndRender(orchestrator, telemetryElements, audioMixer, action, renderRuntime);
    };
    const onKeyUp = (event) => {
        const action = normalizeKeyboardReleaseEvent({
            type: event.type,
            code: event.code,
            altKey: event.altKey,
            ctrlKey: event.ctrlKey,
            metaKey: event.metaKey,
            shiftKey: event.shiftKey
        });
        if (shouldSuppressAppShortcut(event, action)) {
            return;
        }
        if (action?.action === "transparent-walls-release") {
            if (onReleaseTransparentWalls()) {
                event.preventDefault();
            }
        }
    };
    const onContextMenu = (event) => {
        event.preventDefault();
    };
    const changeActiveMap = (mapPath) => {
        if (!hospitalView) {
            return false;
        }
        if (setHospitalViewMap(hospitalView, mapPath)) {
            hospitalMapSelect.value = hospitalView.mapPath;
            mapPanelSelect.value = hospitalView.mapPath;
            resetOrchestratorForActiveMap();
            saveStatus.textContent = formatNewMapStatus(hospitalView.mapPath);
            renderRuntime();
            return true;
        }
        return false;
    };
    const onMapSelectChange = () => {
        changeActiveMap(hospitalMapSelect.value);
    };
    const onMapPanelSelectChange = () => {
        changeActiveMap(mapPanelSelect.value);
    };
    const onRestartLevel = () => {
        if (!canRestartLevelFromHospitalView(hospitalView)) {
            saveStatus.textContent = formatRestartLevelUnavailableStatus();
            renderRuntime();
            return;
        }
        resetOrchestratorForActiveMap();
        saveStatus.textContent = formatRestartedLevelStatus(hospitalView.mapPath);
        renderRuntime();
    };
    const onNextLevel = () => {
        if (!canAdvanceToNextLevelFromTelemetry(hospitalView, orchestrator.telemetry())) {
            saveStatus.textContent = formatNextLevelUnavailableStatus();
            renderRuntime();
            return;
        }
        const nextMapPath = nextHospitalMapPath(hospitalView);
        if (!nextMapPath || !setHospitalViewMap(hospitalView, nextMapPath)) {
            saveStatus.textContent = formatCampaignCompleteStatus();
            renderRuntime();
            return;
        }
        hospitalMapSelect.value = hospitalView.mapPath;
        resetOrchestratorForActiveMap();
        saveStatus.textContent = formatNextLevelStatus(hospitalView.mapPath);
        renderRuntime();
    };
    const onStoreCameraPosition = (slot) => {
        const snapshot = createHospitalMapViewSnapshot(hospitalView);
        if (!snapshot || !Number.isInteger(slot)) {
            actionStatus.textContent = formatActionStatus("camera-position.unavailable");
            renderRuntime();
            return true;
        }
        cameraMemorySlots.set(slot, snapshot);
        actionStatus.textContent = formatCameraPositionStoredStatus(slot);
        return true;
    };
    const onRecallCameraPosition = (slot) => {
        if (!Number.isInteger(slot)) {
            return false;
        }
        const snapshot = cameraMemorySlots.get(slot);
        if (!snapshot) {
            actionStatus.textContent = formatCameraPositionEmptyStatus(slot);
            return true;
        }
        if (!restoreHospitalCameraSnapshot(hospitalView, snapshot)) {
            actionStatus.textContent = formatCameraPositionUnavailableStatus(slot);
            return true;
        }
        placementPreview = null;
        actionStatus.textContent = formatCameraPositionRecalledStatus(slot);
        renderHospital();
        return true;
    };
    const onZoomHospitalView = (delta) => {
        if (!hospitalView) {
            actionStatus.textContent = formatActionStatus("zoom.unavailable");
            renderRuntime();
            return;
        }
        const currentZoomIndex = hospitalView.zoomIndex ?? HOSPITAL_DEFAULT_ZOOM_INDEX;
        applyHospitalViewZoom(hospitalView, currentZoomIndex + delta);
        placementPreview = null;
        actionStatus.textContent = formatZoomActionStatus(hospitalView);
        renderHospital();
    };
    const onResetHospitalZoom = () => {
        if (!hospitalView) {
            actionStatus.textContent = formatActionStatus("zoom.unavailable");
            renderRuntime();
            return;
        }
        applyHospitalViewZoom(hospitalView, HOSPITAL_DEFAULT_ZOOM_INDEX);
        placementPreview = null;
        actionStatus.textContent = formatZoomActionStatus(hospitalView);
        renderHospital();
    };
    const onCameraWest = () => {
        if (!hospitalView?.map) {
            actionStatus.textContent = formatActionStatus("camera.unavailable");
            renderRuntime();
            return;
        }
        moveHospitalCamera(hospitalView, -HOSPITAL_CAMERA_STEP, 0);
        placementPreview = null;
        renderHospital();
    };
    const onCameraEast = () => {
        if (!hospitalView?.map) {
            actionStatus.textContent = formatActionStatus("camera.unavailable");
            renderRuntime();
            return;
        }
        moveHospitalCamera(hospitalView, HOSPITAL_CAMERA_STEP, 0);
        placementPreview = null;
        renderHospital();
    };
    const onCameraNorth = () => {
        if (!hospitalView?.map) {
            actionStatus.textContent = formatActionStatus("camera.unavailable");
            renderRuntime();
            return;
        }
        moveHospitalCamera(hospitalView, 0, -HOSPITAL_CAMERA_STEP);
        placementPreview = null;
        renderHospital();
    };
    const onCameraSouth = () => {
        if (!hospitalView?.map) {
            actionStatus.textContent = formatActionStatus("camera.unavailable");
            renderRuntime();
            return;
        }
        moveHospitalCamera(hospitalView, 0, HOSPITAL_CAMERA_STEP);
        placementPreview = null;
        renderHospital();
    };
    const originalUiControlHandlers = new Map([
        ["pause-toggle", onPauseToggle],
        ["step", onStep],
        ["build-diagnosis-room", onBuildDiagnosisRoom],
        ["build-treatment-room", onBuildTreatmentRoom],
        ["build-pharmacy-room", onBuildPharmacyRoom],
        ["build-specialist-room", onBuildSpecialistRoom],
        ["hire-diagnostician", onHireDiagnostician],
        ["hire-nurse", onHireNurse],
        ["hire-handyman", onHireHandyman],
        ["hire-receptionist", onHireReceptionist],
        ["admit", onAdmit],
        ["treat", onTreat],
        ["staff-break-toggle", onStaffBreakToggle],
        ["treatment-room-toggle", onTreatmentRoomToggle],
        ["open-jukebox", onOpenJukebox],
        ["open-furnish-corridor", onOpenFurnishCorridor],
        ["open-edit-room", onOpenEditRoom],
        ["open-first-message", onOpenFirstMessage],
        ["open-casebook", onOpenCasebook],
        ["open-map", onOpenMap],
        ["open-staff", onOpenStaff],
        ["open-research", onOpenResearch],
        ["open-policy", onOpenPolicy],
        ["open-machine-menu", onOpenMachineMenu],
        ["take-loan", onTakeLoan],
        ["repay-loan", onRepayLoan],
        ["start-research", onStartResearch],
        ["run-finance-audit", onFinanceAudit],
        ["run-marketing-campaign", onMarketingCampaign],
        ["start-insurance-contract", onStartInsuranceContract],
        ["run-awards-ceremony", onAwardsCeremony],
        ["start-emergency-wave", onStartEmergency],
        ["start-epidemic-outbreak", onStartEpidemic],
        ["start-vip-inspection", onStartVipInspection],
        ["save-game", onSaveGame],
        ["load-game", onLoadGame],
        ["refresh-save-slots", onRefreshSaveSlots],
        ["delete-save-slot", onDeleteSaveSlot],
        ["restart-level", onRestartLevel],
        ["quit-level", onOpenQuitLevelConfirmation],
        ["next-level", onNextLevel],
        ["hospital-camera-west", onCameraWest],
        ["hospital-camera-east", onCameraEast],
        ["hospital-camera-north", onCameraNorth],
        ["hospital-camera-south", onCameraSouth]
    ]);
    const onOriginalUiStripClick = (event) => {
        const zone = originalUiControlZoneAt(originalUiStripCanvas, event);
        if (!zone) {
            return;
        }
        originalUiControlHandlers.get(zone.id)?.();
    };
    if (!hospitalView) {
        hospitalMapSelect.disabled = true;
        cameraWestButton.disabled = true;
        cameraEastButton.disabled = true;
        cameraNorthButton.disabled = true;
        cameraSouthButton.disabled = true;
    }
    telemetryElements.pauseToggleButton.addEventListener("click", onPauseToggle);
    telemetryElements.speedSelect.addEventListener("change", onSpeedSelect);
    telemetryElements.admissionPolicySelect.addEventListener("change", onAdmissionPolicySelect);
    telemetryElements.pricingPolicySelect.addEventListener("change", onPricingPolicySelect);
    policyPanelAdmissionPolicySelect.addEventListener("change", onPolicyPanelAdmissionPolicySelect);
    policyPanelPricingPolicySelect.addEventListener("change", onPolicyPanelPricingPolicySelect);
    telemetryElements.admissionsToggleButton.addEventListener("click", onAdmissionsToggle);
    telemetryElements.muteToggleButton.addEventListener("click", onMuteToggle);
    telemetryElements.volumeSlider.addEventListener("input", onVolumeInput);
    jukeboxPanelMasterMuteButton.addEventListener("click", onMuteToggle);
    jukeboxPanelSoundMuteButton.addEventListener("click", onSoundMuteToggle);
    jukeboxPanelMusicMuteButton.addEventListener("click", onMusicMuteToggle);
    jukeboxPanelVolumeSlider.addEventListener("input", onJukeboxPanelVolumeInput);
    stepButton.addEventListener("click", onStep);
    admitButton.addEventListener("click", onAdmit);
    treatButton.addEventListener("click", onTreat);
    researchButton.addEventListener("click", onStartResearch);
    emergencyButton.addEventListener("click", onStartEmergency);
    epidemicButton.addEventListener("click", onStartEpidemic);
    vipInspectionButton.addEventListener("click", onStartVipInspection);
    marketingCampaignButton.addEventListener("click", onMarketingCampaign);
    financeAuditButton.addEventListener("click", onFinanceAudit);
    insuranceContractButton.addEventListener("click", onStartInsuranceContract);
    awardsButton.addEventListener("click", onAwardsCeremony);
    takeLoanButton.addEventListener("click", onTakeLoan);
    repayLoanButton.addEventListener("click", onRepayLoan);
    prioritizeSelectedPatientButton.addEventListener("click", onPrioritizeSelectedPatient);
    sendSelectedPatientHomeButton.addEventListener("click", onSendSelectedPatientHome);
    giveDrinkSelectedPatientButton.addEventListener("click", onGiveDrinkSelectedPatient);
    sendSelectedPatientToiletButton.addEventListener("click", onSendSelectedPatientToilet);
    shootRatButton.addEventListener("click", onShootRat);
    waterPlantButton.addEventListener("click", onWaterPlant);
    moveSelectedStaffButton.addEventListener("click", onMoveSelectedStaff);
    restSelectedStaffButton.addEventListener("click", onRestSelectedStaff);
    trainSelectedStaffButton.addEventListener("click", onTrainSelectedStaff);
    fireSelectedStaffButton.addEventListener("click", onFireSelectedStaff);
    sellSelectedRoomButton.addEventListener("click", onSellSelectedRoom);
    sellSelectedObjectButton.addEventListener("click", onSellSelectedObject);
    repairSelectedRoomButton.addEventListener("click", onRepairSelectedRoom);
    buildDiagnosisRoomButton.addEventListener("click", onBuildDiagnosisRoom);
    buildTreatmentRoomButton.addEventListener("click", onBuildTreatmentRoom);
    buildPharmacyRoomButton.addEventListener("click", onBuildPharmacyRoom);
    buildSpecialistRoomButton.addEventListener("click", onBuildSpecialistRoom);
    hireDiagnosticianButton.addEventListener("click", onHireDiagnostician);
    hireNurseButton.addEventListener("click", onHireNurse);
    hireHandymanButton.addEventListener("click", onHireHandyman);
    hireReceptionistButton.addEventListener("click", onHireReceptionist);
    saveSlotSelect.addEventListener("change", onSaveSlotSelectChange);
    saveGameButton.addEventListener("click", onSaveGame);
    loadGameButton.addEventListener("click", onLoadGame);
    refreshSaveSlotsButton.addEventListener("click", onRefreshSaveSlots);
    deleteSaveSlotButton.addEventListener("click", onDeleteSaveSlot);
    quitLevelConfirmButton.addEventListener("click", onConfirmQuitLevel);
    quitLevelCancelButton.addEventListener("click", onCancelQuitLevel);
    bankManagerTakeLoanButton.addEventListener("click", onTakeLoan);
    bankManagerRepayLoanButton.addEventListener("click", onRepayLoan);
    bankManagerCloseButton.addEventListener("click", onCloseBankManager);
    bankStatsRunAuditButton.addEventListener("click", onFinanceAudit);
    bankStatsCloseButton.addEventListener("click", onCloseBankStats);
    staffPanelHireDiagnosticianButton.addEventListener("click", onStaffPanelHireDiagnostician);
    staffPanelHireNurseButton.addEventListener("click", onStaffPanelHireNurse);
    staffPanelHireHandymanButton.addEventListener("click", onStaffPanelHireHandyman);
    staffPanelHireReceptionistButton.addEventListener("click", onStaffPanelHireReceptionist);
    staffPanelCloseButton.addEventListener("click", onCloseStaffPanel);
    researchPanelStartButton.addEventListener("click", onStartResearch);
    researchPanelCloseButton.addEventListener("click", onCloseResearchPanel);
    statusPanelCloseButton.addEventListener("click", onCloseStatusPanel);
    chartsPanelCloseButton.addEventListener("click", onCloseChartsPanel);
    mapPanelSelect.addEventListener("change", onMapPanelSelectChange);
    mapPanelCloseButton.addEventListener("click", onCloseMapPanel);
    policyPanelCloseButton.addEventListener("click", onClosePolicyPanel);
    machineMenuRepairSelectedRoomButton.addEventListener("click", onRepairSelectedRoom);
    machineMenuCloseButton.addEventListener("click", onCloseMachineMenu);
    casebookPanelRows.addEventListener("click", onCasebookPanelRowsClick);
    casebookPanelCloseButton.addEventListener("click", onCloseCasebookPanel);
    messagePanelCloseButton.addEventListener("click", onCloseMessagePanel);
    jukeboxPanelCloseButton.addEventListener("click", onCloseJukeboxPanel);
    furnishCorridorPanelRows.addEventListener("click", onFurnishCorridorPanelRowsClick);
    furnishCorridorPanelCloseButton.addEventListener("click", onCloseFurnishCorridorPanel);
    editRoomPanelToggleButton.addEventListener("click", onTreatmentRoomToggle);
    editRoomPanelRepairButton.addEventListener("click", onRepairSelectedRoom);
    editRoomPanelSellButton.addEventListener("click", onSellSelectedRoom);
    editRoomPanelCloseButton.addEventListener("click", onCloseEditRoomPanel);
    telemetryElements.staffBreakToggleButton.addEventListener("click", onStaffBreakToggle);
    telemetryElements.treatmentRoomToggleButton.addEventListener("click", onTreatmentRoomToggle);
    originalUiStripCanvas.addEventListener("click", onOriginalUiStripClick);
    playfield.addEventListener("mousedown", onMouseDown);
    playfield.addEventListener("mousemove", onMouseMove);
    playfield.addEventListener("mouseleave", onMouseLeave);
    playfield.addEventListener("touchstart", onTouchStart);
    playfield.addEventListener("contextmenu", onContextMenu);
    hospitalMapSelect.addEventListener("change", onMapSelectChange);
    restartLevelButton.addEventListener("click", onRestartLevel);
    nextLevelButton.addEventListener("click", onNextLevel);
    cameraWestButton.addEventListener("click", onCameraWest);
    cameraEastButton.addEventListener("click", onCameraEast);
    cameraNorthButton.addEventListener("click", onCameraNorth);
    cameraSouthButton.addEventListener("click", onCameraSouth);
    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);
    void refreshSaveSlots({ silent: true });
    originalUiStripSummary.textContent = renderOriginalUiStrip(originalUiStripCanvas, hospitalView);
    let lastTimestamp = frameClock.now();
    let animationFrameHandle = 0;
    const onFrame = (timestamp) => {
        const elapsedMs = Math.max(0, timestamp - lastTimestamp);
        lastTimestamp = timestamp;
        const advancedTicks = orchestrator.advanceFrame(elapsedMs);
        if (advancedTicks > 0) {
            renderRuntime();
        }
        animationFrameHandle = frameClock.requestFrame(onFrame);
    };
    animationFrameHandle = frameClock.requestFrame(onFrame);
    return {
        orchestrator,
        render: () => {
            renderRuntime();
        },
        dispose: () => {
            frameClock.cancelFrame(animationFrameHandle);
            telemetryElements.pauseToggleButton.removeEventListener("click", onPauseToggle);
            telemetryElements.speedSelect.removeEventListener("change", onSpeedSelect);
            telemetryElements.admissionPolicySelect.removeEventListener("change", onAdmissionPolicySelect);
            telemetryElements.pricingPolicySelect.removeEventListener("change", onPricingPolicySelect);
            policyPanelAdmissionPolicySelect.removeEventListener("change", onPolicyPanelAdmissionPolicySelect);
            policyPanelPricingPolicySelect.removeEventListener("change", onPolicyPanelPricingPolicySelect);
            telemetryElements.admissionsToggleButton.removeEventListener("click", onAdmissionsToggle);
            telemetryElements.muteToggleButton.removeEventListener("click", onMuteToggle);
            telemetryElements.volumeSlider.removeEventListener("input", onVolumeInput);
            jukeboxPanelMasterMuteButton.removeEventListener("click", onMuteToggle);
            jukeboxPanelSoundMuteButton.removeEventListener("click", onSoundMuteToggle);
            jukeboxPanelMusicMuteButton.removeEventListener("click", onMusicMuteToggle);
            jukeboxPanelVolumeSlider.removeEventListener("input", onJukeboxPanelVolumeInput);
            stepButton.removeEventListener("click", onStep);
            admitButton.removeEventListener("click", onAdmit);
            treatButton.removeEventListener("click", onTreat);
            researchButton.removeEventListener("click", onStartResearch);
            emergencyButton.removeEventListener("click", onStartEmergency);
            epidemicButton.removeEventListener("click", onStartEpidemic);
            vipInspectionButton.removeEventListener("click", onStartVipInspection);
            marketingCampaignButton.removeEventListener("click", onMarketingCampaign);
            financeAuditButton.removeEventListener("click", onFinanceAudit);
            insuranceContractButton.removeEventListener("click", onStartInsuranceContract);
            awardsButton.removeEventListener("click", onAwardsCeremony);
            takeLoanButton.removeEventListener("click", onTakeLoan);
            repayLoanButton.removeEventListener("click", onRepayLoan);
            prioritizeSelectedPatientButton.removeEventListener("click", onPrioritizeSelectedPatient);
            sendSelectedPatientHomeButton.removeEventListener("click", onSendSelectedPatientHome);
            giveDrinkSelectedPatientButton.removeEventListener("click", onGiveDrinkSelectedPatient);
            sendSelectedPatientToiletButton.removeEventListener("click", onSendSelectedPatientToilet);
            shootRatButton.removeEventListener("click", onShootRat);
            waterPlantButton.removeEventListener("click", onWaterPlant);
            moveSelectedStaffButton.removeEventListener("click", onMoveSelectedStaff);
            restSelectedStaffButton.removeEventListener("click", onRestSelectedStaff);
            trainSelectedStaffButton.removeEventListener("click", onTrainSelectedStaff);
            fireSelectedStaffButton.removeEventListener("click", onFireSelectedStaff);
            sellSelectedRoomButton.removeEventListener("click", onSellSelectedRoom);
            sellSelectedObjectButton.removeEventListener("click", onSellSelectedObject);
            repairSelectedRoomButton.removeEventListener("click", onRepairSelectedRoom);
            buildDiagnosisRoomButton.removeEventListener("click", onBuildDiagnosisRoom);
            buildTreatmentRoomButton.removeEventListener("click", onBuildTreatmentRoom);
            buildPharmacyRoomButton.removeEventListener("click", onBuildPharmacyRoom);
            buildSpecialistRoomButton.removeEventListener("click", onBuildSpecialistRoom);
            hireDiagnosticianButton.removeEventListener("click", onHireDiagnostician);
            hireNurseButton.removeEventListener("click", onHireNurse);
            hireHandymanButton.removeEventListener("click", onHireHandyman);
            hireReceptionistButton.removeEventListener("click", onHireReceptionist);
            saveSlotSelect.removeEventListener("change", onSaveSlotSelectChange);
            saveGameButton.removeEventListener("click", onSaveGame);
            loadGameButton.removeEventListener("click", onLoadGame);
            refreshSaveSlotsButton.removeEventListener("click", onRefreshSaveSlots);
            deleteSaveSlotButton.removeEventListener("click", onDeleteSaveSlot);
            quitLevelConfirmButton.removeEventListener("click", onConfirmQuitLevel);
            quitLevelCancelButton.removeEventListener("click", onCancelQuitLevel);
            bankManagerTakeLoanButton.removeEventListener("click", onTakeLoan);
            bankManagerRepayLoanButton.removeEventListener("click", onRepayLoan);
            bankManagerCloseButton.removeEventListener("click", onCloseBankManager);
            bankStatsRunAuditButton.removeEventListener("click", onFinanceAudit);
            bankStatsCloseButton.removeEventListener("click", onCloseBankStats);
            staffPanelHireDiagnosticianButton.removeEventListener("click", onStaffPanelHireDiagnostician);
            staffPanelHireNurseButton.removeEventListener("click", onStaffPanelHireNurse);
            staffPanelHireHandymanButton.removeEventListener("click", onStaffPanelHireHandyman);
            staffPanelHireReceptionistButton.removeEventListener("click", onStaffPanelHireReceptionist);
            staffPanelCloseButton.removeEventListener("click", onCloseStaffPanel);
            researchPanelStartButton.removeEventListener("click", onStartResearch);
            researchPanelCloseButton.removeEventListener("click", onCloseResearchPanel);
            statusPanelCloseButton.removeEventListener("click", onCloseStatusPanel);
            chartsPanelCloseButton.removeEventListener("click", onCloseChartsPanel);
            mapPanelSelect.removeEventListener("change", onMapPanelSelectChange);
            mapPanelCloseButton.removeEventListener("click", onCloseMapPanel);
            policyPanelCloseButton.removeEventListener("click", onClosePolicyPanel);
            machineMenuRepairSelectedRoomButton.removeEventListener("click", onRepairSelectedRoom);
            machineMenuCloseButton.removeEventListener("click", onCloseMachineMenu);
            casebookPanelRows.removeEventListener("click", onCasebookPanelRowsClick);
            casebookPanelCloseButton.removeEventListener("click", onCloseCasebookPanel);
            messagePanelCloseButton.removeEventListener("click", onCloseMessagePanel);
            jukeboxPanelCloseButton.removeEventListener("click", onCloseJukeboxPanel);
            furnishCorridorPanelRows.removeEventListener("click", onFurnishCorridorPanelRowsClick);
            furnishCorridorPanelCloseButton.removeEventListener("click", onCloseFurnishCorridorPanel);
            editRoomPanelToggleButton.removeEventListener("click", onTreatmentRoomToggle);
            editRoomPanelRepairButton.removeEventListener("click", onRepairSelectedRoom);
            editRoomPanelSellButton.removeEventListener("click", onSellSelectedRoom);
            editRoomPanelCloseButton.removeEventListener("click", onCloseEditRoomPanel);
            telemetryElements.staffBreakToggleButton.removeEventListener("click", onStaffBreakToggle);
            telemetryElements.treatmentRoomToggleButton.removeEventListener("click", onTreatmentRoomToggle);
            originalUiStripCanvas.removeEventListener("click", onOriginalUiStripClick);
            playfield.removeEventListener("mousedown", onMouseDown);
            playfield.removeEventListener("mousemove", onMouseMove);
            playfield.removeEventListener("mouseleave", onMouseLeave);
            playfield.removeEventListener("touchstart", onTouchStart);
            playfield.removeEventListener("contextmenu", onContextMenu);
            hospitalMapSelect.removeEventListener("change", onMapSelectChange);
            restartLevelButton.removeEventListener("click", onRestartLevel);
            nextLevelButton.removeEventListener("click", onNextLevel);
            cameraWestButton.removeEventListener("click", onCameraWest);
            cameraEastButton.removeEventListener("click", onCameraEast);
            cameraNorthButton.removeEventListener("click", onCameraNorth);
            cameraSouthButton.removeEventListener("click", onCameraSouth);
            window.removeEventListener("keydown", onKeyDown);
            window.removeEventListener("keyup", onKeyUp);
        }
    };
}
