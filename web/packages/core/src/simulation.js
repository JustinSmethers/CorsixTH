import { diagnosisTicksForSeverity, dischargeCashRewardForSeverityAndPricing, dischargeReputationRewardForSeverityAndPricing, diseaseForId, diseaseForSeverity, emergencyWaveCashReward, emergencyWaveDurationTicks, emergencyWavePatientCount, emergencyWaveReputationReward, emergencyWaveSeverity, epidemicOutbreakCashPenalty, epidemicOutbreakCashReward, epidemicOutbreakDurationTicks, epidemicOutbreakMaxSpreadPatients, epidemicOutbreakPatientCount, epidemicOutbreakReputationPenalty, epidemicOutbreakReputationReward, epidemicOutbreakSeverity, epidemicOutbreakSpreadIntervalTicks, financeAuditCashRecovery, financeAuditCooldownTicks, hospitalAwardCashReward, hospitalAwardReputationReward, hospitalAwardTierForScore, hospitalRatingScoreForMetrics, insuranceContractCashPenalty, insuranceContractCashReward, insuranceContractDurationTicks, insuranceContractPatientCount, insuranceContractReputationPenalty, insuranceContractReputationReward, insuranceContractSeverity, isTreatmentRoomType, loanChunkAmount, loanInterestPerTickForOutstanding, loanMaxOutstanding, maintenanceStaffRepairBonusTicks, marketingCampaignCost, marketingCampaignReputationGain, OPERATING_COST_PER_ACTIVE_PATIENT_PER_TICK, PATIENT_CRITICAL_HEALTH_THRESHOLD, PROGRESSION_MILESTONES, QUEUE_PRESSURE_HIGH_THRESHOLD, QUEUE_PRESSURE_REPUTATION_PENALTY_PER_TICK, patientDeathCashPenaltyForSeverity, patientDeathReputationPenaltyForSeverity, patientMaxHealthForSeverity, patientSendHomeCashPenaltyForSeverity, patientSendHomeReputationPenaltyForSeverity, roomBuildCost, roomMaintenanceTicks, roomMaintenanceWearThreshold, roomRepairCost, roomSellRefund, treatmentFailureCashPenaltyForSeverity, treatmentFailureReputationPenaltyForSeverity, treatmentPricingCashMultiplier, treatmentResearchMaxLevel, treatmentResearchProjectCost, treatmentResearchProjectTicks, treatmentResearchSuccessBonusForLevel, treatmentRoomDurationReductionForDisease, treatmentRoomTypeForDisease, treatmentSucceedsForPatient, treatmentTicksForSeverity, DEFAULT_ROOM_BLUEPRINT, DEFAULT_STAFF_BLUEPRINT, progressionIncomeBonusForUnlock, roomUpkeepCostPerTick, staffAutoBreakTicks, staffBurnoutTicks, staffHireCost, staffMaxSkillLevel, staffSkillDurationReductionForLevel, staffTrainingCost, staffTrainingTicks, staffWageCostPerTick, vipInspectionDurationTicks, vipInspectionMaxQueuePressure, vipInspectionMinReputation, vipInspectionPenaltyCash, vipInspectionPenaltyReputation, vipInspectionRewardCash, vipInspectionRewardReputation } from "@corsixth/rules";
import { assertGameCommand } from "./command-contract";
import { DeterministicRng, SimulationClock, TickScheduler } from "./deterministic";
import { TileMap } from "./map-model";
import { DeterministicPathfindingService } from "./pathfinding";
const INITIAL_CASH = 50_000;
const INITIAL_REPUTATION = 500;
const DEFAULT_BOUNDS = { width: 64, height: 64 };
const CASH_MIN = -1_000_000;
const CASH_MAX = 10_000_000;
const REPUTATION_MIN = 0;
const REPUTATION_MAX = 1000;
const MAX_RECENT_EVENTS = 24;
const DEFAULT_TREATMENT_PRICING_POLICY = "standard";
const ROOM_FOOTPRINTS = {
    diagnosis: { width: 3, height: 3 },
    treatment: { width: 3, height: 3 },
    pharmacy: { width: 3, height: 3 },
    specialist: { width: 3, height: 3 }
};
const ROOM_TYPES = Object.freeze(Object.keys(ROOM_FOOTPRINTS));
const STAFF_ROLES = Object.freeze(["diagnostician", "nurse", "handyman", "receptionist"]);
const STAFF_REST_TYPES = Object.freeze(["standing", "sofa", "game", "snooker"]);
const DEFAULT_TERRAIN_SIGNATURE = "open-floor";
const ROUTING_TILE_DEFINITIONS = [
    {
        id: 0,
        name: "blocked",
        metadata: { kind: "blocked", passable: false, movementCost: 1 }
    }
];
for (let mask = 0; mask < 16; mask += 1) {
    ROUTING_TILE_DEFINITIONS.push({
        id: mask + 1,
        name: `hospital-floor-${mask.toString(16)}`,
        metadata: {
            kind: "floor",
            passable: true,
            movementCost: 1,
            canTravelN: (mask & 1) !== 0,
            canTravelE: (mask & 2) !== 0,
            canTravelS: (mask & 4) !== 0,
            canTravelW: (mask & 8) !== 0
        }
    });
}
function clamp(value, min, max) {
    if (value < min) {
        return min;
    }
    if (value > max) {
        return max;
    }
    return value;
}
function assertBounds(bounds) {
    if (!Number.isInteger(bounds.width) || bounds.width <= 0 || !Number.isInteger(bounds.height) || bounds.height <= 0) {
        throw new Error(`Invalid world bounds: ${JSON.stringify(bounds)}`);
    }
}
function fnv1a32(value) {
    let hash = 2166136261;
    for (let i = 0; i < value.length; i += 1) {
        hash ^= value.charCodeAt(i);
        hash = Math.imul(hash, 16777619) >>> 0;
    }
    return hash.toString(16).padStart(8, "0");
}
function stableStringify(value) {
    if (value === null || typeof value !== "object") {
        return JSON.stringify(value);
    }
    if (Array.isArray(value)) {
        return `[${value.map((entry) => stableStringify(entry)).join(",")}]`;
    }
    const record = value;
    const keys = Object.keys(record).sort();
    return `{${keys.map((key) => `${JSON.stringify(key)}:${stableStringify(record[key])}`).join(",")}}`;
}
function requiredEmergencyTreatmentsForWin(totalPatients, percentToWin) {
    return Math.max(0, Math.ceil(totalPatients * percentToWin / 100));
}
function isRecord(value) {
    return typeof value === "object" && value !== null;
}
function normalizeRoomCostOverrides(value = {}) {
    if (value === undefined) {
        return {};
    }
    if (!isRecord(value)) {
        throw new Error("roomCostOverrides must be an object");
    }
    const normalized = {};
    for (const roomType of ROOM_TYPES) {
        const cost = value[roomType];
        if (cost === undefined) {
            continue;
        }
        if (!Number.isInteger(cost) || cost < 0) {
            throw new Error(`roomCostOverrides.${roomType} must be a non-negative integer`);
        }
        normalized[roomType] = cost;
    }
    return normalized;
}
function normalizeRoomWearThresholdOverrides(value = {}) {
    if (value === undefined) {
        return {};
    }
    if (!isRecord(value)) {
        throw new Error("roomWearThresholdOverrides must be an object");
    }
    const normalized = {};
    for (const roomType of ROOM_TYPES) {
        const threshold = value[roomType];
        if (threshold === undefined) {
            continue;
        }
        if (!Number.isInteger(threshold) || threshold <= 0) {
            throw new Error(`roomWearThresholdOverrides.${roomType} must be a positive integer`);
        }
        normalized[roomType] = threshold;
    }
    return normalized;
}
function normalizeRoomWearResearchMaxStrength(value) {
    if (value === undefined || value === null) {
        return null;
    }
    if (!Number.isInteger(value) || value <= 0) {
        throw new Error("roomWearResearchMaxStrength must be a positive integer");
    }
    return value;
}
function normalizeStaffWageOverrides(value = {}) {
    if (value === undefined) {
        return {};
    }
    if (!isRecord(value)) {
        throw new Error("staffWageOverrides must be an object");
    }
    const normalized = {};
    for (const role of STAFF_ROLES) {
        const cost = value[role];
        if (cost === undefined) {
            continue;
        }
        if (!Number.isInteger(cost) || cost < 0) {
            throw new Error(`staffWageOverrides.${role} must be a non-negative integer`);
        }
        normalized[role] = cost;
    }
    return normalized;
}
function normalizeStaffSalaryConfig(value = {}) {
    if (value === undefined) {
        return {};
    }
    if (!isRecord(value)) {
        throw new Error("staffSalary must be an object");
    }
    const normalized = {};
    if (value.salaryAbilityDivisor !== undefined) {
        if (!Number.isInteger(value.salaryAbilityDivisor) || value.salaryAbilityDivisor <= 0) {
            throw new Error("staffSalary.salaryAbilityDivisor must be a positive integer");
        }
        normalized.salaryAbilityDivisor = value.salaryAbilityDivisor;
    }
    if (value.salaryAdds !== undefined) {
        if (!Array.isArray(value.salaryAdds)) {
            throw new Error("staffSalary.salaryAdds must be an array");
        }
        normalized.salaryAdds = value.salaryAdds.map((entry, index) => {
            if (!Number.isInteger(entry.index) || entry.index < 0) {
                throw new Error(`staffSalary.salaryAdds[${index}].index must be a non-negative integer`);
            }
            if (!Number.isInteger(entry.value)) {
                throw new Error(`staffSalary.salaryAdds[${index}].value must be an integer`);
            }
            return { index: entry.index, value: entry.value };
        }).sort((left, right) => left.index - right.index);
    }
    for (const key of ["salaryTooLow", "salaryTooHigh"]) {
        if (value[key] === undefined) {
            continue;
        }
        if (!Number.isInteger(value[key])) {
            throw new Error(`staffSalary.${key} must be an integer`);
        }
        normalized[key] = value[key];
    }
    return normalized;
}
function normalizeLandCostPerTile(value) {
    if (value === undefined || value === null) {
        return null;
    }
    if (!Number.isInteger(value) || value < 0) {
        throw new Error("landCostPerTile must be a non-negative integer");
    }
    return value;
}
function normalizeRoutingConfig(value = {}) {
    if (value === undefined) {
        return {};
    }
    if (!isRecord(value)) {
        throw new Error("routingSettings must be an object");
    }
    const normalized = {};
    for (const key of ["queuePoints", "distancePoints", "noStaffPoints"]) {
        const setting = value[key];
        if (setting === undefined) {
            continue;
        }
        if (!Number.isInteger(setting) || setting < 0) {
            throw new Error(`routingSettings.${key} must be a non-negative integer`);
        }
        normalized[key] = setting;
    }
    return normalized;
}
function normalizePatientBehaviorConfig(value = {}) {
    if (value === undefined) {
        return {};
    }
    if (!isRecord(value)) {
        throw new Error("patientBehavior must be an object");
    }
    const normalized = {};
    if (value.leaveMax !== undefined) {
        if (!Number.isInteger(value.leaveMax) || value.leaveMax < 0) {
            throw new Error("patientBehavior.leaveMax must be a non-negative integer");
        }
        normalized.leaveMaxTicks = value.leaveMax;
    }
    for (const key of ["happy", "unhappy", "veryUnhappy", "vomitLimit", "litterDrop", "litterRandom", "litterCleanupChance", "bowelFull", "bowelOverflows", "drinkHappy", "toiletHappy"]) {
        if (value[key] === undefined) {
            continue;
        }
        if (!Number.isInteger(value[key]) || value[key] < 0) {
            throw new Error(`patientBehavior.${key} must be a non-negative integer`);
        }
        normalized[key] = value[key];
    }
    return normalized;
}
function normalizeAutopsyConfig(value = {}) {
    if (value === undefined) {
        return {};
    }
    if (!isRecord(value)) {
        throw new Error("autopsy must be an object");
    }
    const normalized = {};
    for (const key of ["researchPercent", "reputationHitPercent"]) {
        if (value[key] === undefined) {
            continue;
        }
        if (!Number.isInteger(value[key]) || value[key] < 0) {
            throw new Error(`autopsy.${key} must be a non-negative integer`);
        }
        normalized[key] = value[key];
    }
    return normalized;
}
function normalizeLoanInterestPerChunk(value) {
    if (value === undefined) {
        return null;
    }
    if (!Number.isInteger(value) || value < 0) {
        throw new Error("loanInterestPerChunk must be a non-negative integer");
    }
    return value;
}
function normalizeTreatmentResearchProjectCost(value) {
    if (value === undefined) {
        return treatmentResearchProjectCost();
    }
    if (!Number.isInteger(value) || value < 0) {
        throw new Error("researchProjectCost must be a non-negative integer");
    }
    return value;
}
function normalizeTreatmentResearchProjectMinCost(value) {
    if (value === undefined) {
        return 0;
    }
    if (!Number.isInteger(value) || value < 0) {
        throw new Error("researchProjectMinCost must be a non-negative integer");
    }
    return value;
}
function isPositionInBounds(position, bounds) {
    return (Number.isInteger(position.x) &&
        Number.isInteger(position.y) &&
        position.x >= 0 &&
        position.y >= 0 &&
        position.x < bounds.width &&
        position.y < bounds.height);
}
function samePosition(left, right) {
    return left.x === right.x && left.y === right.y;
}
function cloneFootprint(footprint) {
    return { width: footprint.width, height: footprint.height };
}
function clonePosition(position) {
    return { x: position.x, y: position.y };
}
function normalizeAdmissionPoints(bounds, admissionPoints) {
    if (admissionPoints === undefined) {
        return [];
    }
    if (!Array.isArray(admissionPoints)) {
        throw new Error("Invalid admission points");
    }
    const normalized = [];
    const seen = new Set();
    for (const point of admissionPoints) {
        if (!isPositionInBounds(point, bounds)) {
            throw new Error(`Invalid admission point: ${JSON.stringify(point)}`);
        }
        const key = `${point.x},${point.y}`;
        if (seen.has(key)) {
            continue;
        }
        seen.add(key);
        normalized.push(clonePosition(point));
    }
    return normalized;
}
function normalizeTreatmentResearchProjectTicks(value) {
    if (value === undefined) {
        return treatmentResearchProjectTicks();
    }
    if (!Number.isInteger(value) || value <= 0) {
        throw new Error("researchProjectTicks must be a positive integer");
    }
    return value;
}
function normalizeTreatmentResearchStartRating(value) {
    if (value === undefined) {
        return null;
    }
    if (!Number.isInteger(value) || value < 0) {
        throw new Error("researchStartRating must be a non-negative integer");
    }
    return value;
}
function normalizeTreatmentResearchImproveRate(value) {
    if (value === undefined) {
        return null;
    }
    if (!Number.isInteger(value) || value <= 0) {
        throw new Error("researchImproveRate must be a positive integer");
    }
    return value;
}
function normalizeTreatmentResearchLevelIncrement(value) {
    if (value === undefined) {
        return 1;
    }
    if (!Number.isInteger(value) || value <= 0) {
        throw new Error("researchLevelIncrement must be a positive integer");
    }
    return value;
}
function normalizeTreatmentResearchImproveCostPercent(value) {
    if (value === undefined) {
        return 0;
    }
    if (!Number.isInteger(value) || value < 0) {
        throw new Error("researchImproveCostPercent must be a non-negative integer");
    }
    return value;
}
function normalizeAwardScoreMaxIncrease(value) {
    if (value === undefined) {
        return null;
    }
    if (!Number.isInteger(value) || value < 0) {
        throw new Error("awardScoreMaxIncrease must be a non-negative integer");
    }
    return value;
}
function normalizeAwardRewardOverrides(value) {
    if (value === undefined) {
        return null;
    }
    if (!isRecord(value)) {
        throw new Error("awardRewardOverrides must be an object");
    }
    const normalized = {};
    for (const key of ["cash", "reputation"]) {
        if (value[key] === undefined) {
            continue;
        }
        if (!Number.isInteger(value[key]) || value[key] < 0) {
            throw new Error(`awardRewardOverrides.${key} must be a non-negative integer`);
        }
        normalized[key] = value[key];
    }
    return Object.keys(normalized).length > 0 ? normalized : null;
}
function normalizeStaffTrainingCostValue(value) {
    if (value === undefined) {
        return staffTrainingCost();
    }
    if (!Number.isInteger(value) || value < 0) {
        throw new Error("staffTrainingCost must be a non-negative integer");
    }
    return value;
}
function normalizeStaffTrainingTicksValue(value) {
    if (value === undefined) {
        return staffTrainingTicks();
    }
    if (!Number.isInteger(value) || value <= 0) {
        throw new Error("staffTrainingTicks must be a positive integer");
    }
    return value;
}
function normalizeStaffTrainingTicksByTargetLevel(value = {}) {
    if (value === undefined) {
        return {};
    }
    if (!isRecord(value)) {
        throw new Error("staffTrainingTicksByTargetLevel must be an object");
    }
    const normalized = {};
    for (const [targetLevel, ticks] of Object.entries(value)) {
        const level = Number(targetLevel);
        if (!Number.isInteger(level) || level <= 0) {
            throw new Error("staffTrainingTicksByTargetLevel keys must be positive integer levels");
        }
        if (!Number.isInteger(ticks) || ticks <= 0) {
            throw new Error(`staffTrainingTicksByTargetLevel.${targetLevel} must be a positive integer`);
        }
        normalized[level] = ticks;
    }
    return normalized;
}
function normalizeInitialStaffSkillLevel(value = 0) {
    if (value === undefined) {
        return 0;
    }
    if (!Number.isInteger(value) || value < 0) {
        throw new Error("initialSkillLevel must be a non-negative integer");
    }
    return Math.min(staffMaxSkillLevel(), value);
}
function normalizeInitialStaffSpecialties(value = []) {
    if (value === undefined) {
        return [];
    }
    if (!Array.isArray(value)) {
        throw new Error("initialSpecialties must be an array");
    }
    const allowed = new Set(["psychiatrist", "surgeon", "researcher"]);
    const normalized = [];
    for (const specialty of value) {
        if (!allowed.has(specialty)) {
            throw new Error(`Unsupported staff specialty: ${specialty}`);
        }
        if (!normalized.includes(specialty)) {
            normalized.push(specialty);
        }
    }
    return normalized;
}
function normalizeStaffFatigueConfig(config = {}) {
    const normalized = {
        burnoutTicksByRole: Object.fromEntries(STAFF_ROLES.map((role) => [role, staffBurnoutTicks(role)])),
        autoBreakTicksByRole: Object.fromEntries(STAFF_ROLES.map((role) => [role, staffAutoBreakTicks(role)])),
        modifyFrequency: 1,
        workStressTicks: 1,
        idleRecoveryTicks: 1,
        restRecoveryTicksByType: Object.fromEntries(STAFF_REST_TYPES.map((restType) => [restType, 1]))
    };
    if (config.burnoutTicks !== undefined) {
        const value = normalizeStaffFatigueTickValue(config.burnoutTicks, "staffFatigue.burnoutTicks");
        for (const role of STAFF_ROLES) {
            normalized.burnoutTicksByRole[role] = value;
        }
    }
    if (config.autoBreakTicks !== undefined) {
        const value = normalizeStaffFatigueTickValue(config.autoBreakTicks, "staffFatigue.autoBreakTicks");
        for (const role of STAFF_ROLES) {
            normalized.autoBreakTicksByRole[role] = value;
        }
    }
    if (config.modifyFrequency !== undefined) {
        normalized.modifyFrequency = normalizeStaffFatigueTickValue(config.modifyFrequency, "staffFatigue.modifyFrequency");
    }
    if (config.workStressTicks !== undefined) {
        normalized.workStressTicks = normalizeStaffFatigueNonNegativeInteger(config.workStressTicks, "staffFatigue.workStressTicks");
    }
    if (config.idleRecoveryTicks !== undefined) {
        normalized.idleRecoveryTicks = normalizeStaffFatigueNonNegativeInteger(config.idleRecoveryTicks, "staffFatigue.idleRecoveryTicks");
        normalized.restRecoveryTicksByType.standing = normalized.idleRecoveryTicks;
    }
    for (const [configKey, restType] of [
        ["restStandingTicks", "standing"],
        ["restSofaTicks", "sofa"],
        ["restGameTicks", "game"],
        ["restSnookerTicks", "snooker"]
    ]) {
        if (config[configKey] !== undefined) {
            normalized.restRecoveryTicksByType[restType] = normalizeStaffFatigueNonNegativeInteger(config[configKey], `staffFatigue.${configKey}`);
        }
    }
    if (config.recoveryFactorTicks !== undefined) {
        normalized.recoveryFactorTicks = normalizeStaffFatigueTickValue(config.recoveryFactorTicks, "staffFatigue.recoveryFactorTicks");
    }
    if (config.resignBurnoutCount !== undefined) {
        normalized.resignBurnoutCount = normalizeStaffFatigueTickValue(config.resignBurnoutCount, "staffFatigue.resignBurnoutCount");
    }
    for (const key of ["notTiredTicks", "tiredTicks", "veryTiredTicks"]) {
        if (config[key] !== undefined) {
            normalized[key] = normalizeStaffFatigueTickValue(config[key], `staffFatigue.${key}`);
        }
    }
    return normalized;
}
function normalizeStaffFatigueTickValue(value, label) {
    if (!Number.isInteger(value) || value <= 0) {
        throw new Error(`${label} must be a positive integer`);
    }
    return value;
}
function normalizeStaffFatigueNonNegativeInteger(value, label) {
    if (!Number.isInteger(value) || value < 0) {
        throw new Error(`${label} must be a non-negative integer`);
    }
    return value;
}
function normalizeEmergencyWaveConfig(config = {}) {
    const normalized = {
        patientCount: emergencyWavePatientCount(),
        severity: emergencyWaveSeverity(),
        durationTicks: emergencyWaveDurationTicks(),
        rewardCash: emergencyWaveCashReward(),
        rewardReputation: emergencyWaveReputationReward(),
        percentToWin: 100,
        diseaseId: undefined
    };
    if (config.patientCount !== undefined) {
        if (!Number.isInteger(config.patientCount) || config.patientCount <= 0) {
            throw new Error("emergencyWave.patientCount must be a positive integer");
        }
        normalized.patientCount = config.patientCount;
    }
    if (config.severity !== undefined) {
        if (![1, 2, 3].includes(config.severity)) {
            throw new Error("emergencyWave.severity must be 1, 2, or 3");
        }
        normalized.severity = config.severity;
    }
    if (config.durationTicks !== undefined) {
        if (!Number.isInteger(config.durationTicks) || config.durationTicks <= 0) {
            throw new Error("emergencyWave.durationTicks must be a positive integer");
        }
        normalized.durationTicks = config.durationTicks;
    }
    if (config.rewardCash !== undefined) {
        if (!Number.isInteger(config.rewardCash) || config.rewardCash < 0) {
            throw new Error("emergencyWave.rewardCash must be a non-negative integer");
        }
        normalized.rewardCash = config.rewardCash;
    }
    if (config.rewardReputation !== undefined) {
        if (!Number.isInteger(config.rewardReputation) || config.rewardReputation < 0) {
            throw new Error("emergencyWave.rewardReputation must be a non-negative integer");
        }
        normalized.rewardReputation = config.rewardReputation;
    }
    if (config.percentToWin !== undefined) {
        if (!Number.isInteger(config.percentToWin) || config.percentToWin < 0 || config.percentToWin > 100) {
            throw new Error("emergencyWave.percentToWin must be an integer from 0 to 100");
        }
        normalized.percentToWin = config.percentToWin;
    }
    if (config.diseaseId !== undefined) {
        if (typeof config.diseaseId !== "string" || config.diseaseId.length === 0) {
            throw new Error("emergencyWave.diseaseId must be a non-empty string");
        }
        normalized.diseaseId = config.diseaseId;
    }
    return normalized;
}
function normalizeDiseaseTreatmentPrices(config = {}) {
    const normalized = {};
    if (config === undefined) {
        return normalized;
    }
    if (config === null || typeof config !== "object" || Array.isArray(config)) {
        throw new Error("diseaseTreatmentPrices must be an object");
    }
    for (const [diseaseId, price] of Object.entries(config)) {
        if (typeof diseaseId !== "string" || diseaseId.length === 0) {
            throw new Error("diseaseTreatmentPrices keys must be non-empty disease ids");
        }
        if (!Number.isInteger(price) || price < 0) {
            throw new Error(`diseaseTreatmentPrices.${diseaseId} must be a non-negative integer`);
        }
        normalized[diseaseId] = price;
    }
    return normalized;
}
function normalizeEpidemicOutbreakConfig(config = {}) {
    const normalized = {
        patientCount: epidemicOutbreakPatientCount(),
        severity: epidemicOutbreakSeverity(),
        durationTicks: epidemicOutbreakDurationTicks(),
        spreadIntervalTicks: epidemicOutbreakSpreadIntervalTicks(),
        maxSpreadPatients: epidemicOutbreakMaxSpreadPatients(),
        rewardCash: epidemicOutbreakCashReward(),
        rewardReputation: epidemicOutbreakReputationReward(),
        penaltyCash: epidemicOutbreakCashPenalty(),
        penaltyReputation: epidemicOutbreakReputationPenalty(),
        spreadChancePercent: 100,
        vaccinationCost: 0
    };
    if (config.patientCount !== undefined) {
        if (!Number.isInteger(config.patientCount) || config.patientCount <= 0) {
            throw new Error("epidemicOutbreak.patientCount must be a positive integer");
        }
        normalized.patientCount = config.patientCount;
    }
    if (config.severity !== undefined) {
        if (![1, 2, 3].includes(config.severity)) {
            throw new Error("epidemicOutbreak.severity must be 1, 2, or 3");
        }
        normalized.severity = config.severity;
    }
    for (const key of ["durationTicks", "spreadIntervalTicks", "maxSpreadPatients"]) {
        if (config[key] !== undefined) {
            if (!Number.isInteger(config[key]) || config[key] <= 0) {
                throw new Error(`epidemicOutbreak.${key} must be a positive integer`);
            }
            normalized[key] = config[key];
        }
    }
    for (const key of ["spreadSlowdownTicks", "spreadSlowdownPatientCount", "spreadSlowdownRatePercent"]) {
        if (config[key] !== undefined) {
            if (!Number.isInteger(config[key]) || config[key] < 0) {
                throw new Error(`epidemicOutbreak.${key} must be a non-negative integer`);
            }
            normalized[key] = config[key];
        }
    }
    if (config.spreadChancePercent !== undefined) {
        if (!Number.isInteger(config.spreadChancePercent) || config.spreadChancePercent < 0 || config.spreadChancePercent > 100) {
            throw new Error("epidemicOutbreak.spreadChancePercent must be an integer from 0 to 100");
        }
        normalized.spreadChancePercent = config.spreadChancePercent;
    }
    for (const key of ["rewardCash", "rewardReputation", "penaltyCash", "penaltyReputation", "vaccinationCost"]) {
        if (config[key] !== undefined) {
            if (!Number.isInteger(config[key]) || config[key] < 0) {
                throw new Error(`epidemicOutbreak.${key} must be a non-negative integer`);
            }
            normalized[key] = config[key];
        }
    }
    if (config.rewardCashMin !== undefined || config.rewardCashMax !== undefined) {
        const min = config.rewardCashMin ?? config.rewardCashMax;
        const max = config.rewardCashMax ?? config.rewardCashMin;
        if (!Number.isInteger(min) || min < 0) {
            throw new Error("epidemicOutbreak.rewardCashMin must be a non-negative integer");
        }
        if (!Number.isInteger(max) || max < min) {
            throw new Error("epidemicOutbreak.rewardCashMax must be an integer greater than or equal to rewardCashMin");
        }
        normalized.rewardCashMin = min;
        normalized.rewardCashMax = max;
        normalized.rewardCash = Math.round((min + max) / 2);
    }
    return normalized;
}
function cloneEmergencyWaveConfig(config) {
    return {
        patientCount: config.patientCount,
        severity: config.severity,
        durationTicks: config.durationTicks,
        rewardCash: config.rewardCash,
        rewardReputation: config.rewardReputation,
        percentToWin: config.percentToWin,
        ...(config.diseaseId ? { diseaseId: config.diseaseId } : {})
    };
}
function clonePatientMovement(movement) {
    if (!movement) {
        return null;
    }
    return {
        stage: movement.stage,
        destination: clonePosition(movement.destination),
        pathIndex: movement.pathIndex,
        remainingSteps: Math.max(0, movement.path.length - 1 - movement.pathIndex),
        path: movement.path.map((position) => clonePosition(position))
    };
}
function clonePlacementEvaluation(evaluation) {
    return {
        ...evaluation,
        ...(evaluation.position ? { position: clonePosition(evaluation.position) } : {}),
        ...(evaluation.requestedPosition ? { requestedPosition: clonePosition(evaluation.requestedPosition) } : {}),
        ...(evaluation.footprint ? { footprint: cloneFootprint(evaluation.footprint) } : {}),
        ...(evaluation.tiles ? { tiles: evaluation.tiles.map((tile) => clonePosition(tile)) } : {})
    };
}
function normalizePatientMovementForHash(movement) {
    if (!movement) {
        return null;
    }
    return {
        stage: movement.stage,
        destination: movement.destination,
        pathIndex: movement.pathIndex,
        remainingSteps: movement.remainingSteps ?? Math.max(0, movement.path.length - 1 - movement.pathIndex)
    };
}
function normalizeTerrain(bounds, terrain) {
    const size = bounds.width * bounds.height;
    const passableTiles = new Uint8Array(size);
    const buildableTiles = new Uint8Array(size);
    const routingTileIds = new Array(size);
    if (terrain === undefined) {
        passableTiles.fill(1);
        buildableTiles.fill(1);
        routingTileIds.fill(16);
        return {
            signature: DEFAULT_TERRAIN_SIGNATURE,
            passableTiles,
            buildableTiles,
            routingTileIds,
            passableTileCount: size,
            buildableTileCount: size
        };
    }
    if (!isRecord(terrain) || terrain.width !== bounds.width || terrain.height !== bounds.height || !Array.isArray(terrain.tiles) || terrain.tiles.length !== size) {
        throw new Error("Invalid simulation terrain");
    }
    let passableTileCount = 0;
    let buildableTileCount = 0;
    let signatureInput = `${bounds.width}x${bounds.height}:`;
    for (let index = 0; index < terrain.tiles.length; index += 1) {
        const tile = terrain.tiles[index];
        let passable = false;
        let buildable = false;
        let travelMask = 0;
        if (typeof tile === "boolean") {
            passable = tile;
            buildable = tile;
            travelMask = passable ? 15 : 0;
        }
        else if (isRecord(tile)) {
            passable = tile.passable === true;
            buildable = tile.buildable === undefined ? passable : tile.buildable === true;
            travelMask = passable
                ? ((tile.canTravelN !== false ? 1 : 0) |
                    (tile.canTravelE !== false ? 2 : 0) |
                    (tile.canTravelS !== false ? 4 : 0) |
                    (tile.canTravelW !== false ? 8 : 0))
                : 0;
        }
        else {
            throw new Error(`Invalid simulation terrain tile at index ${index}`);
        }
        passableTiles[index] = passable ? 1 : 0;
        buildableTiles[index] = buildable ? 1 : 0;
        routingTileIds[index] = passable ? travelMask + 1 : 0;
        passableTileCount += passable ? 1 : 0;
        buildableTileCount += buildable ? 1 : 0;
        signatureInput += passable ? "1" : "0";
        signatureInput += buildable ? "1" : "0";
        signatureInput += travelMask.toString(16);
    }
    return {
        signature: typeof terrain.signature === "string" && terrain.signature.length > 0 ? terrain.signature : fnv1a32(signatureInput),
        passableTiles,
        buildableTiles,
        routingTileIds,
        passableTileCount,
        buildableTileCount
    };
}
function createRoutingMap(bounds, terrain) {
    return new TileMap({
        width: bounds.width,
        height: bounds.height,
        tileIds: terrain.routingTileIds,
        tileDefinitions: ROUTING_TILE_DEFINITIONS
    });
}
function removeFromQueue(queue, patientId) {
    const index = queue.indexOf(patientId);
    if (index >= 0) {
        queue.splice(index, 1);
    }
}
function countUniqueAssignments(assignments, key) {
    return new Set(assignments.map((assignment) => assignment[key])).size;
}
export function hashSimulationState(state) {
    const economy = { ...state.economy };
    if (economy.treatmentPricingPolicy === DEFAULT_TREATMENT_PRICING_POLICY) {
        delete economy.treatmentPricingPolicy;
    }
    if (economy.outstandingLoan === 0) {
        delete economy.outstandingLoan;
    }
    if (economy.loanInterestExpense === 0) {
        delete economy.loanInterestExpense;
    }
    if (economy.cumulativeLoanInterest === 0) {
        delete economy.cumulativeLoanInterest;
    }
    delete economy.loanChunkAmount;
    delete economy.loanMaxOutstanding;
    delete economy.financeAuditCashRecovery;
    delete economy.financeAuditCooldownTicks;
    delete economy.marketingCampaignCost;
    delete economy.marketingCampaignReputationGain;
    const includeResearch = state.research.level > 0 || state.research.active === true;
    const includeEmergency = state.emergency.active === true ||
        state.emergency.wavesStarted > 0 ||
        state.emergency.successfulWaves > 0 ||
        state.emergency.failedWaves > 0;
    const includeEpidemic = state.epidemic.active === true ||
        state.epidemic.outbreaksStarted > 0 ||
        state.epidemic.containedOutbreaks > 0 ||
        state.epidemic.failedOutbreaks > 0 ||
        state.epidemic.spreadPatients > 0;
    const includeInsurance = state.insurance.active === true ||
        state.insurance.contractsStarted > 0 ||
        state.insurance.completedContracts > 0 ||
        state.insurance.failedContracts > 0;
    const includeFinanceLedger = state.financeLedger.auditsRun > 0 ||
        state.financeLedger.cooldownRemainingTicks > 0 ||
        state.financeLedger.totalRecoveredCash > 0;
    const includeStaffTraining = state.staffTraining.activeTrainingStaff > 0 ||
        state.staffTraining.totalSkillLevel > 0 ||
        state.staffTraining.trainingStarted > 0 ||
        state.staffTraining.trainingCompleted > 0;
    const includeVipInspection = state.vipInspection.active === true ||
        state.vipInspection.visitsStarted > 0 ||
        state.vipInspection.passedVisits > 0 ||
        state.vipInspection.failedVisits > 0;
    const includeMaintenanceStaff = state.maintenanceStaff.activeHandymen > 0 ||
        state.maintenanceStaff.totalRepairEvents > 0;
    const includeAwards = state.awards.ceremoniesRun > 0;
    const objects = [...(state.entities.objects ?? [])]
        .sort((left, right) => left.id - right.id)
        .map((object) => ({
        id: object.id,
        objectIndex: object.objectIndex,
        name: object.name,
        cost: object.cost,
        ...(Number.isInteger(object.strength) ? { strength: object.strength } : {}),
        ...(object.orientation && object.orientation !== "north" ? { orientation: object.orientation } : {}),
        position: object.position
    }));
    const counters = {
        ...state.counters
    };
    if (objects.length === 0 && state.counters.nextObjectId === 1) {
        delete counters.nextObjectId;
    }
    const normalized = {
        tick: state.tick,
        patientsWaiting: state.patientsWaiting,
        treatedPatients: state.treatedPatients,
        cash: state.cash,
        reputation: state.reputation,
        rngState: state.rngState,
        bounds: state.bounds,
        counters,
        scheduledAdmissions: state.scheduledAdmissions,
        hospitalLoop: state.hospitalLoop,
        staffLifecycle: state.staffLifecycle,
        roomOperations: state.roomOperations,
        economy,
        progression: state.progression,
        events: state.events,
        ...(includeResearch ? { research: state.research } : {}),
        ...(includeEmergency ? { emergency: state.emergency } : {}),
        ...(includeEpidemic ? { epidemic: state.epidemic } : {}),
        ...(includeInsurance ? { insurance: state.insurance } : {}),
        ...(includeFinanceLedger ? { financeLedger: state.financeLedger } : {}),
        ...(includeStaffTraining ? { staffTraining: state.staffTraining } : {}),
        ...(includeVipInspection ? { vipInspection: state.vipInspection } : {}),
        ...(includeMaintenanceStaff ? { maintenanceStaff: state.maintenanceStaff } : {}),
        ...(includeAwards ? { awards: state.awards } : {}),
        secondarySystems: state.secondarySystems,
        entities: {
            waitingPatients: [...state.entities.waitingPatients]
                .sort((left, right) => left.id - right.id)
                .map((patient) => ({
                id: patient.id,
                severity: patient.severity,
                diseaseId: patient.diseaseId,
                diagnosisKnown: patient.diagnosisKnown,
                health: patient.health,
                maxHealth: patient.maxHealth,
                admittedTick: patient.admittedTick,
                status: patient.status,
                position: patient.position,
                movement: normalizePatientMovementForHash(patient.movement),
                assignedStaffId: patient.assignedStaffId,
                assignedRoomId: patient.assignedRoomId,
                ...(patient.vomited ? { vomited: true } : {}),
                ...(patient.droppedLitter ? { droppedLitter: true } : {}),
                ...(patient.needsToilet ? { needsToilet: true } : {}),
                ...(patient.bowelOverflowed ? { bowelOverflowed: true } : {}),
                ...(patient.drank ? { drank: true } : {}),
                ...(patient.usedToilet ? { usedToilet: true } : {}),
                ...(patient.emergencyWaveId ? { emergencyWaveId: patient.emergencyWaveId } : {}),
                ...(patient.epidemicOutbreakId ? { epidemicOutbreakId: patient.epidemicOutbreakId } : {}),
                ...(patient.insuranceContractId ? { insuranceContractId: patient.insuranceContractId } : {})
            })),
            staff: [...state.entities.staff]
                .sort((left, right) => left.id - right.id)
                .map((staff) => ({
                id: staff.id,
                role: staff.role,
                status: staff.status,
                stress: staff.stress,
                autoBreakRemainingTicks: staff.autoBreakRemainingTicks,
                ...(staff.wageCostPerTick !== undefined ? { wageCostPerTick: staff.wageCostPerTick } : {}),
                ...(staff.skillLevel > 0 ? { skillLevel: staff.skillLevel } : {}),
                ...(staff.burnoutCount > 0 ? { burnoutCount: staff.burnoutCount } : {}),
                ...(staff.trainingRemainingTicks > 0 ? { trainingRemainingTicks: staff.trainingRemainingTicks } : {})
            })),
            rooms: [...state.entities.rooms]
                .sort((left, right) => left.id - right.id)
                .map((room) => ({
                id: room.id,
                roomType: room.roomType,
                status: room.status,
                wear: room.wear,
                maintenanceRemainingTicks: room.maintenanceRemainingTicks,
                position: room.position,
                footprint: room.footprint
            })),
            ...(objects.length > 0 ? { objects } : {})
        }
    };
    if (state.terrain.signature !== DEFAULT_TERRAIN_SIGNATURE) {
        normalized.terrain = state.terrain;
    }
    if (state.admissionPoints.length > 0) {
        normalized.admissionPoints = state.admissionPoints;
    }
    return fnv1a32(stableStringify(normalized));
}
export class DeterministicSimulation {
    rng;
    clock = new SimulationClock();
    scheduler = new TickScheduler();
    waitingPatients = [];
    staff = [];
    rooms = [];
    objects = [];
    bounds;
    roomCostOverrides;
    roomWearThresholdOverrides;
    roomWearResearchMaxStrength;
    staffWageOverrides;
    staffSalaryConfig;
    landCostPerTile;
    routingSettings;
    patientBehavior;
    autopsyConfig;
    diagnosisQueue = [];
    treatmentQueue = [];
    diagnosisAssignments = [];
    treatmentAssignments = [];
    terrain;
    routingMap;
    pathfinding;
    admissionPoints;
    totalAdmissions = 0;
    totalTreatments = 0;
    totalDischarges = 0;
    totalPatientDeaths = 0;
    totalPatientWalkouts = 0;
    totalPatientAbductions = 0;
    totalPatientVomits = 0;
    totalPatientLitter = 0;
    totalPatientLitterCleaned = 0;
    totalPatientBowelOverflows = 0;
    totalPatientDrinks = 0;
    totalRatsSighted = 0;
    totalRatsKilled = 0;
    totalPlantWaterChecks = 0;
    totalPlantsWatered = 0;
    totalTreatmentFailures = 0;
    nextEntityId = 1;
    nextStaffId = 1;
    nextRoomId = 1;
    nextObjectId = 1;
    nextEventId = 1;
    cash;
    reputation;
    totalIncome = 0;
    totalExpenses = 0;
    tickIncome = 0;
    tickExpenses = 0;
    unlockedMilestones = [];
    unlockedUnlocks = [];
    recurringIncomeBonus = 0;
    treatmentPricingPolicy = DEFAULT_TREATMENT_PRICING_POLICY;
    diseaseTreatmentPrices = {};
    loanInterestPerChunk;
    outstandingLoan = 0;
    totalLoanInterest = 0;
    financeAuditCooldownRemainingTicks = 0;
    totalFinanceAudits = 0;
    totalFinanceAuditRecoveredCash = 0;
    treatmentResearchLevel = 0;
    activeTreatmentResearchRemainingTicks = 0;
    totalTreatmentResearchInvestment = 0;
    treatmentResearchProjectCostValue = treatmentResearchProjectCost();
    treatmentResearchProjectMinCostValue = 0;
    treatmentResearchProjectTicksValue = treatmentResearchProjectTicks();
    treatmentResearchStartRating = null;
    treatmentResearchImproveRate = null;
    treatmentResearchLevelIncrement = 1;
    treatmentResearchImproveCostPercent = 0;
    emergencyWaveConfig = normalizeEmergencyWaveConfig();
    epidemicOutbreakConfig = normalizeEpidemicOutbreakConfig();
    activeEmergencyWave = null;
    nextEmergencyWaveId = 1;
    totalEmergencyWaves = 0;
    totalEmergencySuccesses = 0;
    totalEmergencyFailures = 0;
    activeEpidemicOutbreak = null;
    nextEpidemicOutbreakId = 1;
    totalEpidemicOutbreaks = 0;
    totalEpidemicContained = 0;
    totalEpidemicFailed = 0;
    totalEpidemicSpreadPatients = 0;
    totalEpidemicVaccinationCosts = 0;
    totalAutopsyResearchTicks = 0;
    totalAutopsyReputationPenalty = 0;
    activeInsuranceContract = null;
    nextInsuranceContractId = 1;
    totalInsuranceContracts = 0;
    totalInsuranceCompleted = 0;
    totalInsuranceFailed = 0;
    totalInsuranceCashRewards = 0;
    totalInsuranceReputationRewards = 0;
    totalStaffTrainingStarted = 0;
    totalStaffTrainingCompleted = 0;
    staffTrainingCostValue = staffTrainingCost();
    staffTrainingTicksValue = staffTrainingTicks();
    staffFatigueConfig = normalizeStaffFatigueConfig();
    activeVipInspection = null;
    nextVipInspectionId = 1;
    totalVipInspections = 0;
    totalVipInspectionPasses = 0;
    totalVipInspectionFailures = 0;
    totalAwardCeremonies = 0;
    totalAwardCashRewards = 0;
    totalAwardReputationRewards = 0;
    lastAwardTier = null;
    lastAwardScore = null;
    awardScoreMaxIncrease = null;
    awardRewardOverrides = null;
    recentEvents = [];
    totalEventsEmitted = 0;
    lastTickEvents = 0;
    cashflowPolarity = "none";
    queuePressureStatus = "normal";
    queuePressureEvents = 0;
    staffBurnoutEvents = 0;
    staffRecoveryEvents = 0;
    roomMaintenanceStartEvents = 0;
    roomMaintenanceCompleteEvents = 0;
    maintenanceStaffRepairEvents = 0;
    constructor(seed, options = {}) {
        this.rng = new DeterministicRng(seed);
        this.bounds = options.bounds ?? DEFAULT_BOUNDS;
        this.roomCostOverrides = normalizeRoomCostOverrides(options.roomCostOverrides);
        this.roomWearThresholdOverrides = normalizeRoomWearThresholdOverrides(options.roomWearThresholdOverrides);
        this.roomWearResearchMaxStrength = normalizeRoomWearResearchMaxStrength(options.roomWearResearchMaxStrength);
        this.staffWageOverrides = normalizeStaffWageOverrides(options.staffWageOverrides);
        this.staffSalaryConfig = normalizeStaffSalaryConfig(options.staffSalary);
        this.landCostPerTile = normalizeLandCostPerTile(options.landCostPerTile);
        this.routingSettings = normalizeRoutingConfig(options.routingSettings);
        this.patientBehavior = normalizePatientBehaviorConfig(options.patientBehavior);
        this.autopsyConfig = normalizeAutopsyConfig(options.autopsy);
        this.loanInterestPerChunk = normalizeLoanInterestPerChunk(options.loanInterestPerChunk);
        this.cash = options.initialCash ?? INITIAL_CASH;
        this.reputation = options.initialReputation ?? INITIAL_REPUTATION;
        this.treatmentResearchProjectCostValue = normalizeTreatmentResearchProjectCost(options.researchProjectCost);
        this.treatmentResearchProjectMinCostValue = normalizeTreatmentResearchProjectMinCost(options.researchProjectMinCost);
        this.treatmentResearchProjectTicksValue = normalizeTreatmentResearchProjectTicks(options.researchProjectTicks);
        this.treatmentResearchStartRating = normalizeTreatmentResearchStartRating(options.researchStartRating);
        this.treatmentResearchImproveRate = normalizeTreatmentResearchImproveRate(options.researchImproveRate);
        this.treatmentResearchLevelIncrement = normalizeTreatmentResearchLevelIncrement(options.researchLevelIncrement);
        this.treatmentResearchImproveCostPercent = normalizeTreatmentResearchImproveCostPercent(options.researchImproveCostPercent);
        this.diseaseTreatmentPrices = normalizeDiseaseTreatmentPrices(options.diseaseTreatmentPrices);
        this.awardScoreMaxIncrease = normalizeAwardScoreMaxIncrease(options.awardScoreMaxIncrease);
        this.awardRewardOverrides = normalizeAwardRewardOverrides(options.awardRewardOverrides);
        this.staffTrainingCostValue = normalizeStaffTrainingCostValue(options.staffTrainingCost);
        this.staffTrainingTicksValue = normalizeStaffTrainingTicksValue(options.staffTrainingTicks);
        this.staffTrainingTicksByTargetLevel = normalizeStaffTrainingTicksByTargetLevel(options.staffTrainingTicksByTargetLevel);
        this.staffFatigueConfig = normalizeStaffFatigueConfig(options.staffFatigue);
        this.emergencyWaveConfig = normalizeEmergencyWaveConfig(options.emergencyWave);
        this.epidemicOutbreakConfig = normalizeEpidemicOutbreakConfig(options.epidemicOutbreak);
        assertBounds(this.bounds);
        this.cash = clamp(this.cash, CASH_MIN, CASH_MAX);
        this.reputation = clamp(this.reputation, REPUTATION_MIN, REPUTATION_MAX);
        this.terrain = normalizeTerrain(this.bounds, options.terrain);
        this.routingMap = createRoutingMap(this.bounds, this.terrain);
        this.pathfinding = new DeterministicPathfindingService(this.routingMap);
        this.admissionPoints = normalizeAdmissionPoints(this.bounds, options.admissionPoints);
        for (const role of DEFAULT_STAFF_BLUEPRINT) {
            this.hireStaff(role);
        }
        for (const roomType of DEFAULT_ROOM_BLUEPRINT) {
            this.openRoom(roomType);
        }
    }
    execute(input) {
        assertGameCommand(input);
        const command = input;
        this.lastTickEvents = 0;
        if (command.type === "tick") {
            for (let i = 0; i < command.count; i += 1) {
                this.runTick();
            }
            return this.getState();
        }
        if (command.type === "admit-patient") {
            this.admitPatient(command.severity, command.position, { diseaseId: command.diseaseId });
            return this.getState();
        }
        if (command.type === "send-patient-home") {
            this.sendPatientHome(command.patientId);
            return this.getState();
        }
        if (command.type === "prioritize-patient") {
            this.prioritizePatient(command.patientId);
            return this.getState();
        }
        if (command.type === "give-patient-drink") {
            this.givePatientDrink(command.patientId);
            return this.getState();
        }
        if (command.type === "send-patient-toilet") {
            this.sendPatientToilet(command.patientId);
            return this.getState();
        }
        if (command.type === "shoot-rat") {
            this.shootRat(command.hit);
            return this.getState();
        }
        if (command.type === "water-plant") {
            this.waterPlant(command.watered);
            return this.getState();
        }
        if (command.type === "schedule-admit-patient") {
            const scheduledTick = this.clock.now() + command.delay;
            const admission = { severity: command.severity };
            if (command.diseaseId) {
                admission.diseaseId = command.diseaseId;
            }
            if (command.position) {
                admission.position = command.position;
            }
            this.scheduler.enqueue(scheduledTick, admission);
            return this.getState();
        }
        if (command.type === "hire-staff") {
            this.hireStaff(command.role, command.position, { charge: true, initialSkillLevel: command.initialSkillLevel, initialSpecialties: command.initialSpecialties });
            return this.getState();
        }
        if (command.type === "fire-staff") {
            this.fireStaff(command.staffId);
            return this.getState();
        }
        if (command.type === "move-staff") {
            this.moveStaff(command.staffId, command.position);
            return this.getState();
        }
        if (command.type === "set-staff-status") {
            this.setStaffStatus(command.staffId, command.status);
            return this.getState();
        }
        if (command.type === "rest-staff") {
            this.restStaff(command.staffId, command.restType);
            return this.getState();
        }
        if (command.type === "open-room") {
            this.openRoom(command.roomType, command.position, { charge: true });
            return this.getState();
        }
        if (command.type === "place-object") {
            this.placeObject(command.objectIndex, command.position, {
                charge: true,
                cost: command.cost,
                name: command.name,
                strength: command.strength,
                orientation: command.orientation
            });
            return this.getState();
        }
        if (command.type === "remove-object") {
            this.removeObject(command.objectId, { refund: true });
            return this.getState();
        }
        if (command.type === "remove-room") {
            this.removeRoom(command.roomId, { refund: true });
            return this.getState();
        }
        if (command.type === "set-room-status") {
            this.setRoomStatus(command.roomId, command.status);
            return this.getState();
        }
        if (command.type === "repair-room") {
            this.repairRoom(command.roomId, { charge: true });
            return this.getState();
        }
        if (command.type === "set-pricing-policy") {
            this.setTreatmentPricingPolicy(command.policy);
            return this.getState();
        }
        if (command.type === "take-loan") {
            this.takeLoan();
            return this.getState();
        }
        if (command.type === "repay-loan") {
            this.repayLoan();
            return this.getState();
        }
        if (command.type === "run-finance-audit") {
            this.runFinanceAudit();
            return this.getState();
        }
        if (command.type === "run-marketing-campaign") {
            this.runMarketingCampaign();
            return this.getState();
        }
        if (command.type === "start-insurance-contract") {
            this.startInsuranceContract();
            return this.getState();
        }
        if (command.type === "run-awards-ceremony") {
            this.runAwardsCeremony(command);
            return this.getState();
        }
        if (command.type === "start-research") {
            this.startTreatmentResearch();
            return this.getState();
        }
        if (command.type === "start-emergency-wave") {
            this.startEmergencyWave();
            return this.getState();
        }
        if (command.type === "start-epidemic-outbreak") {
            this.startEpidemicOutbreak();
            return this.getState();
        }
        if (command.type === "apply-earthquake") {
            this.applyEarthquake(command.severity, command.quakeIndex);
            return this.getState();
        }
        if (command.type === "apply-alien-abduction") {
            this.applyAlienAbduction(command.patientId, command.abductionIndex);
            return this.getState();
        }
        if (command.type === "train-staff") {
            this.startStaffTraining(command.staffId);
            return this.getState();
        }
        if (command.type === "start-vip-inspection") {
            this.startVipInspection();
            return this.getState();
        }
        this.manualTreatPatient(command.patientId);
        return this.getState();
    }
    getState() {
        const waitingPatients = this.waitingPatients.map((patient) => ({
            id: patient.id,
            severity: patient.severity,
            diseaseId: patient.diseaseId,
            diseaseName: patient.diseaseName,
            preferredTreatmentRoomType: treatmentRoomTypeForDisease(patient.diseaseId),
            diagnosisKnown: patient.diagnosisKnown,
            health: patient.health,
            maxHealth: patient.maxHealth,
            admittedTick: patient.admittedTick,
            status: patient.status,
            position: { x: patient.position.x, y: patient.position.y },
            movement: clonePatientMovement(patient.movement),
            assignedStaffId: patient.assignedStaffId,
            assignedRoomId: patient.assignedRoomId,
            ...(patient.vomited ? { vomited: true } : {}),
            ...(patient.droppedLitter ? { droppedLitter: true } : {}),
            ...(patient.needsToilet ? { needsToilet: true } : {}),
            ...(patient.bowelOverflowed ? { bowelOverflowed: true } : {}),
            ...(patient.drank ? { drank: true } : {}),
            ...(patient.usedToilet ? { usedToilet: true } : {}),
            ...(patient.emergencyWaveId ? { emergencyWaveId: patient.emergencyWaveId } : {}),
            ...(patient.epidemicOutbreakId ? { epidemicOutbreakId: patient.epidemicOutbreakId } : {}),
            ...(patient.insuranceContractId ? { insuranceContractId: patient.insuranceContractId } : {})
        }));
        const staff = this.staff.map((member) => ({
            id: member.id,
            role: member.role,
            status: member.status,
            stress: member.stress,
            autoBreakRemainingTicks: member.autoBreakRemainingTicks,
            skillLevel: member.skillLevel,
            burnoutCount: member.burnoutCount ?? 0,
            trainingRemainingTicks: member.trainingRemainingTicks,
            ...(member.specialties?.length > 0 ? { specialties: [...member.specialties] } : {}),
            ...(member.wageCostPerTick !== undefined ? { wageCostPerTick: member.wageCostPerTick } : {}),
            position: { x: member.position.x, y: member.position.y }
        }));
        const rooms = this.rooms.map((room) => ({
            id: room.id,
            roomType: room.roomType,
            status: room.status,
            wear: room.wear,
            maintenanceRemainingTicks: room.maintenanceRemainingTicks,
            position: { x: room.position.x, y: room.position.y },
            footprint: cloneFootprint(room.footprint),
            tiles: this.roomFootprintTiles(room.position, room.footprint)
        }));
        const objects = this.objects.map((object) => ({
            id: object.id,
            objectIndex: object.objectIndex,
            name: object.name,
            cost: object.cost,
            ...(Number.isInteger(object.strength) ? { strength: object.strength } : {}),
            orientation: object.orientation,
            position: { x: object.position.x, y: object.position.y }
        }));
        let queuedPatients = 0;
        let walkingToDiagnosisPatients = 0;
        let diagnosingPatients = 0;
        let diagnosedPatients = 0;
        let awaitingTreatmentPatients = 0;
        let walkingToTreatmentPatients = 0;
        let treatingPatients = 0;
        let criticalPatients = 0;
        let lowestPatientHealth = null;
        let currentPatientLitter = 0;
        let patientsNeedingToilet = 0;
        let happyPatients = 0;
        let unhappyPatients = 0;
        let veryUnhappyPatients = 0;
        const hasPatientMoodThresholds = this.hasPatientMoodThresholds();
        for (const patient of waitingPatients) {
            if (patient.status === "queued") {
                queuedPatients += 1;
            }
            if (patient.status === "walking-to-diagnosis") {
                walkingToDiagnosisPatients += 1;
            }
            if (patient.status === "diagnosing") {
                diagnosingPatients += 1;
            }
            if (patient.diagnosisKnown) {
                diagnosedPatients += 1;
            }
            if (patient.status === "awaiting-treatment") {
                awaitingTreatmentPatients += 1;
            }
            if (patient.status === "walking-to-treatment") {
                walkingToTreatmentPatients += 1;
            }
            if (patient.status === "treating") {
                treatingPatients += 1;
            }
            if (this.isPatientCritical(patient)) {
                criticalPatients += 1;
            }
            lowestPatientHealth = lowestPatientHealth === null ? patient.health : Math.min(lowestPatientHealth, patient.health);
            if (patient.droppedLitter) {
                currentPatientLitter += 1;
            }
            if (patient.needsToilet) {
                patientsNeedingToilet += 1;
            }
            if (hasPatientMoodThresholds) {
                if (this.isPatientAtOrAboveMoodThreshold(patient, "happy")) {
                    happyPatients += 1;
                }
                if (this.isPatientAtOrBelowMoodThreshold(patient, "unhappy")) {
                    unhappyPatients += 1;
                }
                if (this.isPatientAtOrBelowMoodThreshold(patient, "veryUnhappy")) {
                    veryUnhappyPatients += 1;
                }
            }
        }
        let activeStaff = 0;
        let onBreakStaff = 0;
        let activeTrainingStaff = 0;
        let trainedStaff = 0;
        let totalSkillLevel = 0;
        let activeHandymen = 0;
        let totalHandymen = 0;
        let stressedStaff = 0;
        let tiredStaff = 0;
        let veryTiredStaff = 0;
        let underpaidStaff = 0;
        let overpaidStaff = 0;
        let autoBreakStaff = 0;
        const hasStaffFatigueThresholds = this.hasStaffFatigueThresholds();
        const hasStaffSalaryThresholds = this.hasStaffSalaryThresholds();
        for (const member of staff) {
            if (member.status === "active") {
                activeStaff += 1;
            }
            if (member.status === "on-break") {
                onBreakStaff += 1;
            }
            if (member.trainingRemainingTicks > 0) {
                activeTrainingStaff += 1;
            }
            if (member.skillLevel > 0) {
                trainedStaff += 1;
            }
            totalSkillLevel += member.skillLevel;
            if (member.role === "handyman") {
                totalHandymen += 1;
                if (member.status === "active") {
                    activeHandymen += 1;
                }
            }
            if (member.stress > 0) {
                stressedStaff += 1;
            }
            if (hasStaffFatigueThresholds) {
                if (this.isStaffAtOrAboveFatigueThreshold(member, "tiredTicks")) {
                    tiredStaff += 1;
                }
                if (this.isStaffAtOrAboveFatigueThreshold(member, "veryTiredTicks")) {
                    veryTiredStaff += 1;
                }
            }
            if (hasStaffSalaryThresholds) {
                if (this.isStaffAtOrBelowSalaryThreshold(member, "salaryTooLow")) {
                    underpaidStaff += 1;
                }
                if (this.isStaffAtOrAboveSalaryThreshold(member, "salaryTooHigh")) {
                    overpaidStaff += 1;
                }
            }
            if (member.status === "on-break" && member.autoBreakRemainingTicks > 0) {
                autoBreakStaff += 1;
            }
        }
        let openDiagnosisRooms = 0;
        let closedDiagnosisRooms = 0;
        let openTreatmentRooms = 0;
        let closedTreatmentRooms = 0;
        let roomsInMaintenance = 0;
        for (const room of rooms) {
            if (room.roomType === "diagnosis") {
                if (room.status === "open") {
                    openDiagnosisRooms += 1;
                }
                else if (room.status === "closed") {
                    closedDiagnosisRooms += 1;
                }
            }
            if (isTreatmentRoomType(room.roomType)) {
                if (room.status === "open") {
                    openTreatmentRooms += 1;
                }
                else if (room.status === "closed") {
                    closedTreatmentRooms += 1;
                }
            }
            if (room.maintenanceRemainingTicks > 0) {
                roomsInMaintenance += 1;
            }
        }
        const hospitalLoop = {
            queuedPatients,
            walkingToDiagnosisPatients,
            diagnosingPatients,
            diagnosedPatients,
            awaitingTreatmentPatients,
            walkingToTreatmentPatients,
            treatingPatients,
            dischargedPatients: this.totalDischarges,
            patientDeaths: this.totalPatientDeaths,
            treatmentFailures: this.totalTreatmentFailures,
            activeDiagnosisAssignments: this.diagnosisAssignments.length,
            activeTreatmentAssignments: this.treatmentAssignments.length,
            ...(this.totalPatientWalkouts > 0 ? { patientWalkouts: this.totalPatientWalkouts } : {})
        };
        const roomOperations = {
            openDiagnosisRooms,
            closedDiagnosisRooms,
            openTreatmentRooms,
            closedTreatmentRooms,
            activeDiagnosisRooms: countUniqueAssignments(this.diagnosisAssignments, "roomId"),
            activeTreatmentRooms: countUniqueAssignments(this.treatmentAssignments, "roomId")
        };
        const staffLifecycle = {
            activeStaff,
            onBreakStaff,
            diagnosingStaff: countUniqueAssignments(this.diagnosisAssignments, "staffId"),
            treatingStaff: countUniqueAssignments(this.treatmentAssignments, "staffId")
        };
        const staffTraining = {
            activeTrainingStaff,
            trainedStaff,
            totalSkillLevel,
            maxSkillLevel: staffMaxSkillLevel(),
            trainingCost: this.staffTrainingCostValue,
            trainingTicks: this.staffTrainingTicksValue,
            trainingTicksByTargetLevel: { ...this.staffTrainingTicksByTargetLevel },
            trainingStarted: this.totalStaffTrainingStarted,
            trainingCompleted: this.totalStaffTrainingCompleted
        };
        const maintenanceStaff = {
            activeHandymen,
            totalHandymen,
            repairBonusTicks: maintenanceStaffRepairBonusTicks(),
            totalRepairEvents: this.maintenanceStaffRepairEvents
        };
        const nextMilestone = PROGRESSION_MILESTONES.find((milestone) => !this.unlockedMilestones.includes(milestone.id));
        const progression = {
            milestoneLevel: this.unlockedMilestones.length,
            unlockedMilestones: [...this.unlockedMilestones],
            unlockedUnlocks: [...this.unlockedUnlocks],
            recurringIncomeBonus: this.recurringIncomeBonus,
            nextMilestone: nextMilestone?.id ?? null,
            remainingDischargesToNextMilestone: nextMilestone ? Math.max(0, nextMilestone.minimumDischarges - this.totalDischarges) : 0
        };
        const economy = {
            tickIncome: this.tickIncome,
            tickExpenses: this.tickExpenses,
            tickNet: this.tickIncome - this.tickExpenses,
            cumulativeIncome: this.totalIncome,
            cumulativeExpenses: this.totalExpenses,
            cumulativeNet: this.totalIncome - this.totalExpenses,
            treatmentPricingPolicy: this.treatmentPricingPolicy,
            outstandingLoan: this.outstandingLoan,
            loanInterestExpense: this.loanInterestForOutstanding(this.outstandingLoan),
            cumulativeLoanInterest: this.totalLoanInterest,
            loanChunkAmount: loanChunkAmount(),
            loanMaxOutstanding: loanMaxOutstanding(),
            financeAuditCashRecovery: financeAuditCashRecovery(),
            financeAuditCooldownTicks: financeAuditCooldownTicks(),
            marketingCampaignCost: marketingCampaignCost(),
            marketingCampaignReputationGain: marketingCampaignReputationGain()
        };
        const events = {
            totalEmitted: this.totalEventsEmitted,
            lastTickEvents: this.lastTickEvents,
            recent: this.recentEvents.map((event) => ({
                id: event.id,
                tick: event.tick,
                type: event.type,
                payload: event.payload
            }))
        };
        const research = {
            level: this.treatmentResearchLevel,
            maxLevel: treatmentResearchMaxLevel(),
            active: this.activeTreatmentResearchRemainingTicks > 0,
            remainingTicks: this.activeTreatmentResearchRemainingTicks,
            projectCost: this.treatmentResearchProjectCostForCurrentLevel(),
            projectTicks: this.treatmentResearchProjectTicksValue,
            totalInvestment: this.totalTreatmentResearchInvestment,
            activeResearchers: this.activeResearcherStaffCount(),
            ticksPerTick: this.treatmentResearchTicksPerTick(),
            successBonus: this.treatmentResearchSuccessBonus(),
            ...(Object.keys(this.autopsyConfig).length > 0 ? {
                autopsyResearchPercent: this.autopsyConfig.researchPercent ?? 0,
                autopsyReputationHitPercent: this.autopsyConfig.reputationHitPercent ?? 0,
                autopsyResearchTicks: this.totalAutopsyResearchTicks,
                autopsyReputationPenalty: this.totalAutopsyReputationPenalty
            } : {})
        };
        const emergency = this.createEmergencyState();
        const epidemic = this.createEpidemicState();
        const insurance = this.createInsuranceContractState();
        const financeLedger = this.createFinanceLedgerState();
        const vipInspection = this.createVipInspectionState(hospitalLoop, roomOperations);
        const secondarySystems = {
            queuePressure: hospitalLoop.queuedPatients + hospitalLoop.awaitingTreatmentPatients,
            queuePressureStatus: hospitalLoop.queuedPatients + hospitalLoop.awaitingTreatmentPatients >= QUEUE_PRESSURE_HIGH_THRESHOLD ? "high" : "normal",
            criticalPatients,
            lowestPatientHealth,
            patientDeaths: this.totalPatientDeaths,
            ...(this.totalPatientAbductions > 0 ? { patientAbductions: this.totalPatientAbductions } : {}),
            ...(this.patientBehavior.vomitLimit !== undefined ? { patientVomits: this.totalPatientVomits } : {}),
            ...(this.patientBehavior.litterDrop !== undefined || this.patientBehavior.litterCleanupChance !== undefined ? {
                patientLitter: this.totalPatientLitter,
                currentPatientLitter,
                patientLitterCleaned: this.totalPatientLitterCleaned
            } : {}),
            ...(this.patientBehavior.bowelFull !== undefined ? { patientsNeedingToilet } : {}),
            ...(this.patientBehavior.bowelOverflows !== undefined ? { patientBowelOverflows: this.totalPatientBowelOverflows } : {}),
            ...(this.totalPatientDrinks > 0 ? { patientDrinks: this.totalPatientDrinks } : {}),
            ...(this.totalRatsSighted > 0 ? {
                ratsSighted: this.totalRatsSighted,
                ratsKilled: this.totalRatsKilled,
                ratKillPercentage: Math.floor((this.totalRatsKilled / this.totalRatsSighted) * 100)
            } : {}),
            ...(this.totalPlantWaterChecks > 0 ? {
                plantWaterChecks: this.totalPlantWaterChecks,
                plantsWatered: this.totalPlantsWatered,
                plantWateredPercentage: Math.floor((this.totalPlantsWatered / this.totalPlantWaterChecks) * 100)
            } : {}),
            ...(hasPatientMoodThresholds ? {
                happyPatients,
                unhappyPatients,
                veryUnhappyPatients
            } : {}),
            stressedStaff,
            ...(hasStaffFatigueThresholds ? {
                tiredStaff,
                veryTiredStaff
            } : {}),
            ...(hasStaffSalaryThresholds ? {
                underpaidStaff,
                overpaidStaff
            } : {}),
            autoBreakStaff,
            roomsInMaintenance,
            queuePressureEvents: this.queuePressureEvents,
            staffBurnoutEvents: this.staffBurnoutEvents,
            staffRecoveryEvents: this.staffRecoveryEvents,
            roomMaintenanceStartEvents: this.roomMaintenanceStartEvents,
            roomMaintenanceCompleteEvents: this.roomMaintenanceCompleteEvents,
            ...(this.totalPatientWalkouts > 0 ? { patientWalkouts: this.totalPatientWalkouts } : {})
        };
        const awards = this.createAwardsState(hospitalLoop, roomOperations, staffLifecycle, secondarySystems);
        return {
            tick: this.clock.now(),
            patientsWaiting: waitingPatients.length,
            treatedPatients: this.totalTreatments,
            cash: this.cash,
            reputation: this.reputation,
            rngState: this.rng.snapshot(),
            bounds: { width: this.bounds.width, height: this.bounds.height },
            terrain: {
                signature: this.terrain.signature,
                passableTileCount: this.terrain.passableTileCount,
                buildableTileCount: this.terrain.buildableTileCount
            },
            admissionPoints: this.admissionPoints.map((point) => clonePosition(point)),
            routingSettings: { ...this.routingSettings },
            ...(Object.keys(this.patientBehavior).length > 0 ? { patientBehavior: { ...this.patientBehavior } } : {}),
            entities: { waitingPatients, staff, rooms, objects },
            counters: {
                totalAdmissions: this.totalAdmissions,
                totalTreatments: this.totalTreatments,
                totalDischarges: this.totalDischarges,
                totalPatientDeaths: this.totalPatientDeaths,
                totalTreatmentFailures: this.totalTreatmentFailures,
                nextEntityId: this.nextEntityId,
                nextStaffId: this.nextStaffId,
                nextRoomId: this.nextRoomId,
                nextObjectId: this.nextObjectId,
                nextEventId: this.nextEventId,
                ...(this.totalPatientWalkouts > 0 ? { totalPatientWalkouts: this.totalPatientWalkouts } : {}),
                ...(this.totalPatientAbductions > 0 ? { totalPatientAbductions: this.totalPatientAbductions } : {}),
                ...(this.totalPatientVomits > 0 ? { totalPatientVomits: this.totalPatientVomits } : {}),
                ...(this.totalPatientLitter > 0 ? { totalPatientLitter: this.totalPatientLitter } : {}),
                ...(this.totalPatientLitterCleaned > 0 ? { totalPatientLitterCleaned: this.totalPatientLitterCleaned } : {}),
                ...(this.totalPatientBowelOverflows > 0 ? { totalPatientBowelOverflows: this.totalPatientBowelOverflows } : {}),
                ...(this.totalPatientDrinks > 0 ? { totalPatientDrinks: this.totalPatientDrinks } : {}),
                ...(this.totalRatsSighted > 0 ? {
                    totalRatsSighted: this.totalRatsSighted,
                    totalRatsKilled: this.totalRatsKilled
                } : {}),
                ...(this.totalPlantWaterChecks > 0 ? {
                    totalPlantWaterChecks: this.totalPlantWaterChecks,
                    totalPlantsWatered: this.totalPlantsWatered
                } : {})
            },
            scheduledAdmissions: this.scheduler.size,
            hospitalLoop,
            staffLifecycle,
            staffTraining,
            maintenanceStaff,
            roomOperations,
            economy,
            progression,
            research,
            emergency,
            epidemic,
            insurance,
            financeLedger,
            vipInspection,
            awards,
            events,
            secondarySystems
        };
    }
    currentHash() {
        return hashSimulationState(this.getState());
    }
    hasPatientMoodThresholds() {
        return this.patientBehavior.happy !== undefined ||
            this.patientBehavior.unhappy !== undefined ||
            this.patientBehavior.veryUnhappy !== undefined;
    }
    isPatientCritical(patient) {
        const threshold = this.patientBehavior.veryUnhappy !== undefined
            ? Math.max(1, Math.ceil(patient.maxHealth * this.patientBehavior.veryUnhappy / 100))
            : PATIENT_CRITICAL_HEALTH_THRESHOLD;
        return patient.health <= threshold;
    }
    isPatientAtOrBelowMoodThreshold(patient, key) {
        const thresholdPercent = this.patientBehavior[key];
        if (thresholdPercent === undefined) {
            return false;
        }
        const threshold = Math.max(1, Math.ceil(patient.maxHealth * thresholdPercent / 100));
        return patient.health <= threshold;
    }
    isPatientAtOrAboveMoodThreshold(patient, key) {
        const thresholdPercent = this.patientBehavior[key];
        if (thresholdPercent === undefined) {
            return false;
        }
        const threshold = Math.max(1, Math.ceil(patient.maxHealth * thresholdPercent / 100));
        return patient.health >= threshold;
    }
    hasStaffFatigueThresholds() {
        return this.staffFatigueConfig.notTiredTicks !== undefined ||
            this.staffFatigueConfig.tiredTicks !== undefined ||
            this.staffFatigueConfig.veryTiredTicks !== undefined;
    }
    isStaffAtOrAboveFatigueThreshold(staff, key) {
        const threshold = this.staffFatigueConfig[key];
        if (threshold === undefined) {
            return false;
        }
        return staff.stress >= threshold;
    }
    createEmergencyState() {
        if (!this.activeEmergencyWave) {
            return {
                active: false,
                waveId: null,
                deadlineTick: null,
                remainingTicks: 0,
                totalPatients: 0,
                remainingPatients: 0,
                treatedPatients: 0,
                failedPatients: 0,
                wavesStarted: this.totalEmergencyWaves,
                successfulWaves: this.totalEmergencySuccesses,
                failedWaves: this.totalEmergencyFailures,
                patientCount: this.emergencyWaveConfig.patientCount,
                severity: this.emergencyWaveConfig.severity,
                durationTicks: this.emergencyWaveConfig.durationTicks,
                rewardCash: this.emergencyWaveConfig.rewardCash,
                rewardReputation: this.emergencyWaveConfig.rewardReputation,
                percentToWin: this.emergencyWaveConfig.percentToWin,
                requiredTreatedPatients: requiredEmergencyTreatmentsForWin(this.emergencyWaveConfig.patientCount, this.emergencyWaveConfig.percentToWin),
                ...(this.emergencyWaveConfig.diseaseId ? { diseaseId: this.emergencyWaveConfig.diseaseId } : {})
            };
        }
        const wave = this.activeEmergencyWave;
        const config = wave.config ?? this.emergencyWaveConfig;
        const remainingPatients = wave.patientIds.filter((patientId) => {
            const patient = this.getPatientById(patientId);
            return patient?.emergencyWaveId === wave.id;
        }).length;
        return {
            active: true,
            waveId: wave.id,
            deadlineTick: wave.deadlineTick,
            remainingTicks: Math.max(0, wave.deadlineTick - this.clock.now()),
            totalPatients: wave.patientIds.length,
            remainingPatients,
            treatedPatients: wave.treatedPatientIds.length,
            failedPatients: wave.failedPatientIds.length,
            wavesStarted: this.totalEmergencyWaves,
            successfulWaves: this.totalEmergencySuccesses,
            failedWaves: this.totalEmergencyFailures,
            patientCount: config.patientCount,
            severity: config.severity,
            durationTicks: config.durationTicks,
            rewardCash: config.rewardCash,
            rewardReputation: config.rewardReputation,
            percentToWin: config.percentToWin,
            requiredTreatedPatients: requiredEmergencyTreatmentsForWin(wave.patientIds.length, config.percentToWin),
            ...(config.diseaseId ? { diseaseId: config.diseaseId } : {})
        };
    }
    createEpidemicState() {
        const config = this.epidemicOutbreakConfig;
        const base = {
            outbreaksStarted: this.totalEpidemicOutbreaks,
            containedOutbreaks: this.totalEpidemicContained,
            failedOutbreaks: this.totalEpidemicFailed,
            spreadPatients: this.totalEpidemicSpreadPatients,
            patientCount: config.patientCount,
            severity: config.severity,
            durationTicks: config.durationTicks,
            spreadIntervalTicks: config.spreadIntervalTicks,
            maxSpreadPatients: config.maxSpreadPatients,
            spreadChancePercent: config.spreadChancePercent,
            rewardCash: this.activeEpidemicOutbreak?.rewardCash ?? config.rewardCash,
            ...(config.rewardCashMin !== undefined ? { rewardCashMin: config.rewardCashMin } : {}),
            ...(config.rewardCashMax !== undefined ? { rewardCashMax: config.rewardCashMax } : {}),
            rewardReputation: config.rewardReputation,
            penaltyCash: config.penaltyCash,
            penaltyReputation: config.penaltyReputation,
            ...(config.vaccinationCost > 0 ? {
                vaccinationCost: config.vaccinationCost,
                totalVaccinationCosts: this.totalEpidemicVaccinationCosts
            } : {})
        };
        if (!this.activeEpidemicOutbreak) {
            return {
                active: false,
                outbreakId: null,
                deadlineTick: null,
                nextSpreadTick: null,
                remainingTicks: 0,
                totalPatients: 0,
                remainingPatients: 0,
                treatedPatients: 0,
                failedPatients: 0,
                outbreakSpreadPatients: 0,
                remainingSpreadPatients: config.maxSpreadPatients,
                ...base
            };
        }
        const outbreak = this.activeEpidemicOutbreak;
        const remainingPatients = outbreak.patientIds.filter((patientId) => {
            const patient = this.getPatientById(patientId);
            return patient?.epidemicOutbreakId === outbreak.id;
        }).length;
        return {
            active: true,
            outbreakId: outbreak.id,
            deadlineTick: outbreak.deadlineTick,
            nextSpreadTick: outbreak.nextSpreadTick,
            remainingTicks: Math.max(0, outbreak.deadlineTick - this.clock.now()),
            totalPatients: outbreak.patientIds.length,
            remainingPatients,
            treatedPatients: outbreak.treatedPatientIds.length,
            failedPatients: outbreak.failedPatientIds.length,
            outbreakSpreadPatients: outbreak.spreadPatientIds.length,
            remainingSpreadPatients: Math.max(0, config.maxSpreadPatients - outbreak.spreadPatientIds.length),
            spreadSlowdownActive: this.isEpidemicSpreadSlowdownActive(outbreak),
            ...base
        };
    }
    createInsuranceContractState() {
        const base = {
            unlocked: this.unlockedUnlocks.includes("unlock.insurance-contracts"),
            contractsStarted: this.totalInsuranceContracts,
            completedContracts: this.totalInsuranceCompleted,
            failedContracts: this.totalInsuranceFailed,
            totalCashReward: this.totalInsuranceCashRewards,
            totalReputationReward: this.totalInsuranceReputationRewards,
            patientCount: insuranceContractPatientCount(),
            severity: insuranceContractSeverity(),
            durationTicks: insuranceContractDurationTicks(),
            rewardCash: insuranceContractCashReward(),
            rewardReputation: insuranceContractReputationReward(),
            penaltyCash: insuranceContractCashPenalty(),
            penaltyReputation: insuranceContractReputationPenalty()
        };
        if (!this.activeInsuranceContract) {
            return {
                active: false,
                contractId: null,
                deadlineTick: null,
                remainingTicks: 0,
                totalPatients: 0,
                remainingPatients: 0,
                completedPatients: 0,
                failedPatients: 0,
                ...base
            };
        }
        const contract = this.activeInsuranceContract;
        const remainingPatients = contract.patientIds.filter((patientId) => {
            const patient = this.getPatientById(patientId);
            return patient?.insuranceContractId === contract.id;
        }).length;
        return {
            active: true,
            contractId: contract.id,
            deadlineTick: contract.deadlineTick,
            remainingTicks: Math.max(0, contract.deadlineTick - this.clock.now()),
            totalPatients: contract.patientIds.length,
            remainingPatients,
            completedPatients: contract.completedPatientIds.length,
            failedPatients: contract.failedPatientIds.length,
            ...base
        };
    }
    createFinanceLedgerState() {
        const unlocked = this.unlockedUnlocks.includes("unlock.finance-ledger");
        return {
            unlocked,
            ready: unlocked && this.financeAuditCooldownRemainingTicks <= 0,
            cooldownRemainingTicks: this.financeAuditCooldownRemainingTicks,
            auditsRun: this.totalFinanceAudits,
            totalRecoveredCash: this.totalFinanceAuditRecoveredCash,
            cashRecovery: financeAuditCashRecovery(),
            cooldownTicks: financeAuditCooldownTicks()
        };
    }
    createVipInspectionState(hospitalLoop, roomOperations) {
        const base = {
            visitsStarted: this.totalVipInspections,
            passedVisits: this.totalVipInspectionPasses,
            failedVisits: this.totalVipInspectionFailures,
            durationTicks: vipInspectionDurationTicks(),
            maxQueuePressure: vipInspectionMaxQueuePressure(),
            minReputation: vipInspectionMinReputation(),
            rewardCash: vipInspectionRewardCash(),
            rewardReputation: vipInspectionRewardReputation(),
            penaltyCash: vipInspectionPenaltyCash(),
            penaltyReputation: vipInspectionPenaltyReputation(),
            currentQueuePressure: hospitalLoop.queuedPatients + hospitalLoop.awaitingTreatmentPatients,
            currentOpenRooms: roomOperations.openDiagnosisRooms + roomOperations.openTreatmentRooms
        };
        if (!this.activeVipInspection) {
            return {
                active: false,
                visitId: null,
                deadlineTick: null,
                remainingTicks: 0,
                startingDeaths: null,
                ...base
            };
        }
        return {
            active: true,
            visitId: this.activeVipInspection.id,
            deadlineTick: this.activeVipInspection.deadlineTick,
            remainingTicks: Math.max(0, this.activeVipInspection.deadlineTick - this.clock.now()),
            startingDeaths: this.activeVipInspection.startingDeaths,
            ...base
        };
    }
    createAwardsState(hospitalLoop, roomOperations, staffLifecycle, secondarySystems) {
        const rawScore = hospitalRatingScoreForMetrics({
            reputation: this.reputation,
            dischargedPatients: hospitalLoop.dischargedPatients,
            patientDeaths: hospitalLoop.patientDeaths,
            treatmentFailures: hospitalLoop.treatmentFailures,
            queuePressure: secondarySystems.queuePressure,
            milestoneLevel: this.unlockedMilestones.length,
            activeStaff: staffLifecycle.activeStaff,
            openRooms: roomOperations.openDiagnosisRooms + roomOperations.openTreatmentRooms
        });
        const currentScore = this.lastAwardScore !== null && this.awardScoreMaxIncrease !== null
            ? Math.min(rawScore, this.lastAwardScore + this.awardScoreMaxIncrease)
            : rawScore;
        const currentTier = hospitalAwardTierForScore(currentScore);
        return {
            currentScore,
            ...(currentScore !== rawScore ? { uncappedScore: rawScore, scoreMaxIncrease: this.awardScoreMaxIncrease } : {}),
            currentTier,
            currentRewardCash: this.awardRewardOverrides?.cash ?? hospitalAwardCashReward(currentTier),
            currentRewardReputation: this.awardRewardOverrides?.reputation ?? hospitalAwardReputationReward(currentTier),
            ...(this.awardRewardOverrides ? { rewardOverrides: this.awardRewardOverrides } : {}),
            ceremoniesRun: this.totalAwardCeremonies,
            totalCashReward: this.totalAwardCashRewards,
            totalReputationReward: this.totalAwardReputationRewards,
            lastTier: this.lastAwardTier,
            lastScore: this.lastAwardScore
        };
    }
    runTick() {
        const tick = this.clock.tick();
        this.tickIncome = 0;
        this.tickExpenses = 0;
        this.lastTickEvents = 0;
        const utilizedStaffIds = new Set();
        const utilizedRoomIds = new Set();
        const dueAdmissions = this.scheduler.drain(tick);
        for (const admission of dueAdmissions) {
            this.admitPatient(admission.severity, admission.position, { diseaseId: admission.diseaseId });
        }
        this.startDiagnosisAssignments();
        this.startTreatmentAssignments();
        this.progressPatientMovement();
        this.progressDiagnosisAssignments(utilizedStaffIds, utilizedRoomIds);
        this.progressTreatmentAssignments(utilizedStaffIds, utilizedRoomIds);
        this.applyPatientPatience();
        this.applyPatientHealthDecay();
        this.applyLitterCleanup();
        this.applyStaffFatigue(utilizedStaffIds);
        this.applyRoomWear(utilizedRoomIds);
        this.applyQueuePressure();
        const reputationDelta = this.rng.nextFloat() >= 0.5 ? 1 : -1;
        this.reputation = clamp(this.reputation + reputationDelta, REPUTATION_MIN, REPUTATION_MAX);
        if (this.recurringIncomeBonus > 0) {
            this.creditIncome(this.recurringIncomeBonus);
        }
        const patientOperatingCost = this.waitingPatients.length * OPERATING_COST_PER_ACTIVE_PATIENT_PER_TICK;
        const staffWages = this.staff
            .filter((staff) => staff.status === "active")
            .reduce((sum, staff) => sum + this.staffWageCostForStaff(staff), 0);
        const roomUpkeep = this.rooms
            .filter((room) => room.status === "open")
            .reduce((sum, room) => sum + roomUpkeepCostPerTick(room.roomType), 0);
        this.debitExpense(patientOperatingCost + staffWages + roomUpkeep);
        this.applyLoanInterest();
        this.emitCashflowTransitionEvent();
        this.progressFinanceAuditCooldown();
        this.progressStaffAutoBreakRecovery();
        this.progressStaffTraining();
        this.progressRoomMaintenanceRecovery();
        this.progressTreatmentResearch();
        this.evaluateEmergencyWaveDeadline();
        this.progressEpidemicOutbreakSpread();
        this.evaluateEpidemicOutbreakDeadline();
        this.evaluateInsuranceContractDeadline();
        this.evaluateVipInspectionDeadline();
    }
    admitPatient(severity, position, options = {}) {
        const preferredPosition = position ?? this.defaultPatientPosition();
        if (!isPositionInBounds(preferredPosition, this.bounds)) {
            throw new Error(`Invalid patient position: ${JSON.stringify(preferredPosition)}`);
        }
        const resolvedPosition = this.findNearestTraversablePosition(preferredPosition);
        if (!resolvedPosition) {
            return null;
        }
        const patientId = this.nextEntityId;
        const maxHealth = patientMaxHealthForSeverity(severity);
        const disease = options.diseaseId ? diseaseForId(options.diseaseId) : diseaseForSeverity(severity, this.totalAdmissions);
        if (!disease) {
            throw new Error(`Unknown disease: ${options.diseaseId}`);
        }
        this.waitingPatients.push({
            id: patientId,
            severity,
            diseaseId: disease.id,
            diseaseName: disease.name,
            diagnosisKnown: false,
            health: maxHealth,
            maxHealth,
            position: { x: resolvedPosition.x, y: resolvedPosition.y },
            admittedTick: this.clock.now(),
            status: "queued",
            movement: null,
            assignedStaffId: null,
            assignedRoomId: null,
            vomited: false,
            droppedLitter: false,
            needsToilet: false,
            bowelOverflowed: false,
            drank: false,
            usedToilet: false,
            emergencyWaveId: Number.isInteger(options.emergencyWaveId) ? options.emergencyWaveId : null,
            epidemicOutbreakId: Number.isInteger(options.epidemicOutbreakId) ? options.epidemicOutbreakId : null,
            insuranceContractId: Number.isInteger(options.insuranceContractId) ? options.insuranceContractId : null
        });
        this.diagnosisQueue.push(patientId);
        this.nextEntityId += 1;
        this.totalAdmissions += 1;
        return patientId;
    }
    hireStaff(role, position, options = {}) {
        const preferredPosition = position ?? this.defaultStaffPosition(role);
        if (!isPositionInBounds(preferredPosition, this.bounds)) {
            throw new Error(`Invalid staff position: ${JSON.stringify(preferredPosition)}`);
        }
        const placement = this.evaluateStaffPlacement(role, preferredPosition, { charge: options.charge === true });
        const resolvedPosition = placement.position;
        if (!placement.valid || !resolvedPosition) {
            return;
        }
        this.debitPurchase(placement.cost);
        const skillLevel = normalizeInitialStaffSkillLevel(options.initialSkillLevel);
        const specialties = normalizeInitialStaffSpecialties(options.initialSpecialties);
        const wageCostPerTick = this.staffWageCostForRoleAndSkill(role, skillLevel);
        this.staff.push({
            id: this.nextStaffId,
            role,
            status: "active",
            stress: 0,
            autoBreakRemainingTicks: 0,
            burnoutCount: 0,
            skillLevel,
            trainingRemainingTicks: 0,
            ...(specialties.length > 0 ? { specialties } : {}),
            ...(wageCostPerTick !== this.staffWageCostForRole(role) ? { wageCostPerTick } : {}),
            position: { x: resolvedPosition.x, y: resolvedPosition.y }
        });
        this.nextStaffId += 1;
    }
    setStaffStatus(staffId, status) {
        const staff = this.getStaffById(staffId);
        if (!staff) {
            return;
        }
        if (staff.trainingRemainingTicks > 0) {
            return;
        }
        staff.status = status;
        staff.autoBreakRemainingTicks = 0;
    }
    restStaff(staffId, restType) {
        const staff = this.getStaffById(staffId);
        if (!staff || staff.status !== "on-break" || staff.trainingRemainingTicks > 0 || staff.stress <= 0) {
            return false;
        }
        const recoveryTicks = this.staffFatigueConfig.restRecoveryTicksByType[restType] ?? this.staffFatigueConfig.idleRecoveryTicks;
        const previousStress = staff.stress;
        staff.stress = Math.max(0, staff.stress - recoveryTicks);
        this.staffRecoveryEvents += 1;
        this.emitEvent("staff-rested", `${staff.id}|${restType}|${previousStress}->${staff.stress}`);
        return true;
    }
    fireStaff(staffId) {
        const staffIndex = this.staff.findIndex((staff) => staff.id === staffId);
        if (staffIndex < 0) {
            return;
        }
        this.cancelAssignmentsForStaff(staffId);
        this.staff.splice(staffIndex, 1);
    }
    moveStaff(staffId, position) {
        const preferredPosition = position;
        if (!isPositionInBounds(preferredPosition, this.bounds)) {
            throw new Error(`Invalid staff move position: ${JSON.stringify(preferredPosition)}`);
        }
        const placement = this.evaluateStaffMove(staffId, preferredPosition);
        const resolvedPosition = placement.position;
        if (!placement.valid || !resolvedPosition) {
            return false;
        }
        const staff = this.getStaffById(staffId);
        if (!staff) {
            return false;
        }
        this.cancelAssignmentsForStaff(staffId);
        staff.position = { x: resolvedPosition.x, y: resolvedPosition.y };
        this.emitEvent("staff-moved", `${staff.id}|${staff.position.x},${staff.position.y}`);
        return true;
    }
    openRoom(roomType, position, options = {}) {
        const footprint = cloneFootprint(ROOM_FOOTPRINTS[roomType]);
        const placement = position
            ? this.evaluateRoomPlacement(roomType, position, { charge: options.charge === true })
            : null;
        const resolvedPosition = position
            ? (placement?.valid === true ? position : null)
            : this.findAvailableRoomPosition(this.defaultRoomPosition(roomType, footprint), footprint);
        if (!resolvedPosition) {
            return;
        }
        if (!this.isRoomFootprintInBounds(resolvedPosition, footprint)) {
            throw new Error(`Invalid room position: ${JSON.stringify(resolvedPosition)}`);
        }
        const purchaseCost = options.charge === true ? this.roomPlacementCostForType(roomType, footprint) : 0;
        if (!this.canAffordPurchase(purchaseCost)) {
            return;
        }
        this.debitPurchase(purchaseCost);
        this.rooms.push({
            id: this.nextRoomId,
            roomType,
            status: "open",
            wear: 0,
            maintenanceRemainingTicks: 0,
            position: { x: resolvedPosition.x, y: resolvedPosition.y },
            footprint,
            blocksRouting: position !== undefined,
            purchaseCost
        });
        this.nextRoomId += 1;
    }
    placeObject(objectIndex, position, options = {}) {
        const placement = this.evaluateObjectPlacement(objectIndex, position, options);
        if (!placement.valid || !placement.position) {
            return false;
        }
        const cost = options.charge === true ? placement.cost : 0;
        if (!this.canAffordPurchase(cost)) {
            return false;
        }
        this.debitPurchase(cost);
        this.objects.push({
            id: this.nextObjectId,
            objectIndex,
            name: typeof options.name === "string" && options.name.length > 0 ? options.name : `object ${objectIndex}`,
            cost,
            ...(Number.isInteger(options.strength) && options.strength >= 0 ? { strength: options.strength } : {}),
            orientation: typeof options.orientation === "string" ? options.orientation : "north",
            position: { x: placement.position.x, y: placement.position.y }
        });
        this.nextObjectId += 1;
        this.emitEvent("object-placed", `${objectIndex}|${placement.position.x},${placement.position.y}`);
        return true;
    }
    evaluateObjectPlacement(objectIndex, position, options = {}) {
        const requestedPosition = { x: position?.x, y: position?.y };
        const hasIntegerPosition = Number.isInteger(requestedPosition.x) && Number.isInteger(requestedPosition.y);
        const cost = options.charge === true && Number.isInteger(options.cost) && options.cost > 0 ? options.cost : 0;
        const base = {
            type: "object",
            objectIndex,
            valid: false,
            reason: null,
            cost,
            position: hasIntegerPosition ? requestedPosition : null,
            requestedPosition: hasIntegerPosition ? requestedPosition : null,
            tiles: hasIntegerPosition ? [requestedPosition] : []
        };
        if (!hasIntegerPosition) {
            return { ...base, reason: "missing-position" };
        }
        if (!isPositionInBounds(requestedPosition, this.bounds)) {
            return { ...base, reason: "out-of-bounds" };
        }
        if (!this.isBuildablePosition(requestedPosition)) {
            return { ...base, reason: "non-buildable" };
        }
        if (this.isObjectPositionOccupied(requestedPosition)) {
            return { ...base, reason: "occupied" };
        }
        if (!this.canAffordPurchase(cost)) {
            return { ...base, reason: "insufficient-cash" };
        }
        return { ...base, valid: true };
    }
    evaluateRoomPlacement(roomType, position, options = {}) {
        const footprint = cloneFootprint(ROOM_FOOTPRINTS[roomType]);
        const cost = options.charge === true ? this.roomPlacementCostForType(roomType, footprint) : 0;
        const requestedPosition = { x: position?.x, y: position?.y };
        const hasIntegerPosition = Number.isInteger(requestedPosition.x) && Number.isInteger(requestedPosition.y);
        const tiles = hasIntegerPosition ? this.roomFootprintTiles(requestedPosition, footprint) : [];
        const base = {
            type: "room",
            roomType,
            valid: false,
            reason: "out-of-bounds",
            cost,
            position: hasIntegerPosition ? requestedPosition : null,
            requestedPosition: hasIntegerPosition ? requestedPosition : null,
            footprint,
            tiles
        };
        if (!hasIntegerPosition || !this.isRoomFootprintInBounds(requestedPosition, footprint)) {
            return clonePlacementEvaluation(base);
        }
        if (!this.isRoomFootprintBuildable(requestedPosition, footprint)) {
            return clonePlacementEvaluation({ ...base, reason: "non-buildable" });
        }
        if (this.isRoomFootprintOccupied(requestedPosition, footprint)) {
            return clonePlacementEvaluation({ ...base, reason: "occupied" });
        }
        if (!this.canAffordPurchase(cost)) {
            return clonePlacementEvaluation({ ...base, reason: "insufficient-cash" });
        }
        return clonePlacementEvaluation({ ...base, valid: true, reason: null });
    }
    evaluateStaffPlacement(role, position, options = {}) {
        const cost = options.charge === true ? staffHireCost(role) : 0;
        const requestedPosition = { x: position?.x, y: position?.y };
        const hasIntegerPosition = Number.isInteger(requestedPosition.x) && Number.isInteger(requestedPosition.y);
        const base = {
            type: "staff",
            role,
            valid: false,
            reason: "out-of-bounds",
            cost,
            position: null,
            requestedPosition: hasIntegerPosition ? requestedPosition : null,
            tiles: hasIntegerPosition ? [requestedPosition] : []
        };
        if (!hasIntegerPosition || !isPositionInBounds(requestedPosition, this.bounds)) {
            return clonePlacementEvaluation(base);
        }
        const resolvedPosition = this.findNearestTraversablePosition(requestedPosition);
        if (!resolvedPosition) {
            return clonePlacementEvaluation({ ...base, reason: "no-traversable-position" });
        }
        if (!this.canAffordPurchase(cost)) {
            return clonePlacementEvaluation({
                ...base,
                reason: "insufficient-cash",
                position: resolvedPosition,
                tiles: [resolvedPosition]
            });
        }
        return clonePlacementEvaluation({
            ...base,
            valid: true,
            reason: null,
            position: resolvedPosition,
            tiles: [resolvedPosition]
        });
    }
    evaluateStaffMove(staffId, position) {
        const staff = this.getStaffById(staffId);
        const requestedPosition = { x: position?.x, y: position?.y };
        const hasIntegerPosition = Number.isInteger(requestedPosition.x) && Number.isInteger(requestedPosition.y);
        const base = {
            type: "staff",
            role: staff?.role ?? "diagnostician",
            staffId,
            valid: false,
            reason: staff ? "out-of-bounds" : "missing-staff",
            cost: 0,
            position: null,
            requestedPosition: hasIntegerPosition ? requestedPosition : null,
            tiles: hasIntegerPosition ? [requestedPosition] : []
        };
        if (!staff) {
            return clonePlacementEvaluation(base);
        }
        if (!hasIntegerPosition || !isPositionInBounds(requestedPosition, this.bounds)) {
            return clonePlacementEvaluation(base);
        }
        const resolvedPosition = this.findNearestTraversablePosition(requestedPosition);
        if (!resolvedPosition) {
            return clonePlacementEvaluation({ ...base, reason: "no-traversable-position" });
        }
        return clonePlacementEvaluation({
            ...base,
            valid: true,
            reason: null,
            position: resolvedPosition,
            tiles: [resolvedPosition]
        });
    }
    setRoomStatus(roomId, status) {
        const room = this.getRoomById(roomId);
        if (!room) {
            return;
        }
        if (room.maintenanceRemainingTicks > 0 && status === "open") {
            return;
        }
        room.status = status;
    }
    removeRoom(roomId, options = {}) {
        const roomIndex = this.rooms.findIndex((room) => room.id === roomId);
        if (roomIndex < 0) {
            return;
        }
        const room = this.rooms[roomIndex];
        this.cancelAssignmentsForRoom(roomId);
        this.rooms.splice(roomIndex, 1);
        if (options.refund === true) {
            const refund = Number.isFinite(room.purchaseCost) ? Math.floor(room.purchaseCost / 2) : roomSellRefund(room.roomType);
            this.creditPurchaseRefund(refund);
        }
    }
    removeObject(objectId, options = {}) {
        const objectIndex = this.objects.findIndex((object) => object.id === objectId);
        if (objectIndex < 0) {
            return;
        }
        const object = this.objects[objectIndex];
        this.objects.splice(objectIndex, 1);
        if (options.refund === true) {
            this.creditPurchaseRefund(Math.floor((object.cost ?? 0) / 2));
        }
        this.emitEvent("object-removed", `${object.id}|${object.objectIndex}`);
    }
    roomBuildCostForType(roomType) {
        return this.roomCostOverrides[roomType] ?? roomBuildCost(roomType);
    }
    roomPlacementCostForType(roomType, footprint) {
        return this.roomBuildCostForType(roomType) + this.roomLandCostForFootprint(footprint);
    }
    roomLandCostForFootprint(footprint) {
        return (this.landCostPerTile ?? 0) * footprint.width * footprint.height;
    }
    roomWearThresholdForType(roomType) {
        const threshold = this.roomWearThresholdOverrides[roomType] ?? roomMaintenanceWearThreshold(roomType);
        if (this.roomWearResearchMaxStrength === null) {
            return threshold;
        }
        return Math.min(this.roomWearResearchMaxStrength, threshold + this.treatmentResearchLevel);
    }
    staffWageCostForRole(role) {
        return this.staffWageOverrides[role] ?? staffWageCostPerTick(role);
    }
    staffWageCostForStaff(staff) {
        return staff.wageCostPerTick ?? this.staffWageCostForRole(staff.role);
    }
    staffWageCostForRoleAndSkill(role, skillLevel) {
        const baseWage = this.staffWageCostForRole(role);
        if (skillLevel <= 0) {
            return baseWage;
        }
        const salaryAdd = this.staffSalaryAddForSkillLevel(skillLevel);
        const salaryAddAdjustment = salaryAdd === null ? 0 : Math.round(salaryAdd.value / 10);
        const abilityAdjustment = this.staffSalaryConfig.salaryAbilityDivisor === undefined
            ? 0
            : Math.floor(skillLevel * 10 / this.staffSalaryConfig.salaryAbilityDivisor);
        return Math.max(1, baseWage + salaryAddAdjustment + abilityAdjustment);
    }
    staffSalarySatisfactionPercent(staff) {
        const baseWage = this.staffWageCostForRole(staff.role);
        if (baseWage <= 0) {
            return 0;
        }
        const actualWage = this.staffWageCostForStaff(staff);
        return Math.round((actualWage - baseWage) * 100 / baseWage);
    }
    hasStaffSalaryThresholds() {
        return this.staffSalaryConfig.salaryTooLow !== undefined || this.staffSalaryConfig.salaryTooHigh !== undefined;
    }
    isStaffAtOrBelowSalaryThreshold(staff, key) {
        const threshold = this.staffSalaryConfig[key];
        return threshold !== undefined && this.staffSalarySatisfactionPercent(staff) <= threshold;
    }
    isStaffAtOrAboveSalaryThreshold(staff, key) {
        const threshold = this.staffSalaryConfig[key];
        return threshold !== undefined && this.staffSalarySatisfactionPercent(staff) >= threshold;
    }
    staffWorkStressTicks(staff) {
        const salaryDeltaPercent = this.staffSalarySatisfactionPercent(staff);
        let stressTicks = this.staffFatigueConfig.workStressTicks;
        if (this.staffSalaryConfig.salaryTooLow !== undefined && salaryDeltaPercent <= this.staffSalaryConfig.salaryTooLow) {
            stressTicks += 1;
        }
        if (this.staffSalaryConfig.salaryTooHigh !== undefined && salaryDeltaPercent >= this.staffSalaryConfig.salaryTooHigh) {
            stressTicks = Math.max(0, stressTicks - 1);
        }
        return stressTicks;
    }
    staffSalaryAddForSkillLevel(skillLevel) {
        const salaryAdds = this.staffSalaryConfig.salaryAdds ?? [];
        if (salaryAdds.length === 0) {
            return null;
        }
        const first = salaryAdds[0];
        const last = salaryAdds[salaryAdds.length - 1];
        if (skillLevel >= staffMaxSkillLevel()) {
            return last;
        }
        const scaledIndex = first.index + Math.round((last.index - first.index) * skillLevel / staffMaxSkillLevel());
        let selected = first;
        for (const entry of salaryAdds) {
            if (entry.index > scaledIndex) {
                break;
            }
            selected = entry;
        }
        return selected;
    }
    loanInterestForOutstanding(outstandingLoan) {
        if (this.loanInterestPerChunk === null) {
            return loanInterestPerTickForOutstanding(outstandingLoan);
        }
        if (!Number.isFinite(outstandingLoan) || outstandingLoan <= 0) {
            return 0;
        }
        return Math.ceil(outstandingLoan / loanChunkAmount()) * this.loanInterestPerChunk;
    }
    repairRoom(roomId, options = {}) {
        const room = this.getRoomById(roomId);
        if (!room) {
            return false;
        }
        if (room.wear <= 0 && room.maintenanceRemainingTicks <= 0) {
            return false;
        }
        const repairCost = options.charge === true ? roomRepairCost(room.roomType) : 0;
        if (!this.canAffordPurchase(repairCost)) {
            return false;
        }
        this.debitPurchase(repairCost);
        room.wear = 0;
        room.maintenanceRemainingTicks = 0;
        room.status = "open";
        this.emitEvent("room-repaired", `${room.id}|${room.roomType}`);
        return true;
    }
    setTreatmentPricingPolicy(policy) {
        if (this.treatmentPricingPolicy === policy) {
            return false;
        }
        this.treatmentPricingPolicy = policy;
        this.emitEvent("pricing-policy-changed", policy);
        return true;
    }
    takeLoan() {
        const amount = loanChunkAmount();
        if (this.outstandingLoan + amount > loanMaxOutstanding()) {
            return false;
        }
        this.outstandingLoan += amount;
        this.cash = clamp(this.cash + amount, CASH_MIN, CASH_MAX);
        this.emitEvent("loan-taken", `${this.outstandingLoan}`);
        return true;
    }
    repayLoan() {
        if (this.outstandingLoan <= 0) {
            return false;
        }
        const amount = Math.min(loanChunkAmount(), this.outstandingLoan);
        if (this.cash < amount) {
            return false;
        }
        this.cash = clamp(this.cash - amount, CASH_MIN, CASH_MAX);
        this.outstandingLoan -= amount;
        this.emitEvent("loan-repaid", `${this.outstandingLoan}`);
        return true;
    }
    runMarketingCampaign() {
        const cost = marketingCampaignCost();
        if (!this.canAffordPurchase(cost) || this.reputation >= REPUTATION_MAX) {
            return false;
        }
        this.debitPurchase(cost);
        const previousReputation = this.reputation;
        this.reputation = clamp(this.reputation + marketingCampaignReputationGain(), REPUTATION_MIN, REPUTATION_MAX);
        this.emitEvent("marketing-campaign-run", `${previousReputation}->${this.reputation}`);
        return true;
    }
    runFinanceAudit() {
        if (!this.unlockedUnlocks.includes("unlock.finance-ledger") || this.financeAuditCooldownRemainingTicks > 0) {
            return false;
        }
        const recoveredCash = financeAuditCashRecovery();
        this.creditIncome(recoveredCash);
        this.financeAuditCooldownRemainingTicks = financeAuditCooldownTicks();
        this.totalFinanceAudits += 1;
        this.totalFinanceAuditRecoveredCash += recoveredCash;
        this.emitEvent("finance-audit-run", `cash:${recoveredCash}|cooldown:${this.financeAuditCooldownRemainingTicks}`);
        return true;
    }
    startInsuranceContract() {
        if (this.activeInsuranceContract || !this.unlockedUnlocks.includes("unlock.insurance-contracts")) {
            return false;
        }
        const contractId = this.nextInsuranceContractId;
        const deadlineTick = this.clock.now() + insuranceContractDurationTicks();
        const contract = {
            id: contractId,
            deadlineTick,
            patientIds: [],
            completedPatientIds: [],
            failedPatientIds: []
        };
        this.activeInsuranceContract = contract;
        this.nextInsuranceContractId += 1;
        this.totalInsuranceContracts += 1;
        for (let index = 0; index < insuranceContractPatientCount(); index += 1) {
            const patientId = this.admitPatient(insuranceContractSeverity(), undefined, { insuranceContractId: contractId });
            if (patientId !== null) {
                contract.patientIds.push(patientId);
            }
        }
        if (contract.patientIds.length === 0) {
            this.finishInsuranceContract("failed", `${contract.id}|no-admissions`);
            return false;
        }
        this.emitEvent("insurance-contract-started", `${contract.id}|patients:${contract.patientIds.length}|deadline:${deadlineTick}`);
        return true;
    }
    runAwardsCeremony(options = {}) {
        const award = this.getState().awards;
        this.totalAwardCeremonies += 1;
        this.lastAwardTier = award.currentTier;
        this.lastAwardScore = award.currentScore;
        const cashReward = options.cashReward ?? award.currentRewardCash;
        const reputationReward = options.reputationReward ?? award.currentRewardReputation;
        if (cashReward > 0) {
            this.creditIncome(cashReward);
            this.totalAwardCashRewards += cashReward;
        }
        else if (cashReward < 0) {
            this.debitExpense(Math.abs(cashReward));
            this.totalAwardCashRewards += cashReward;
        }
        if (reputationReward > 0) {
            this.reputation = clamp(this.reputation + reputationReward, REPUTATION_MIN, REPUTATION_MAX);
            this.totalAwardReputationRewards += reputationReward;
        }
        else if (reputationReward < 0) {
            this.reputation = clamp(this.reputation + reputationReward, REPUTATION_MIN, REPUTATION_MAX);
            this.totalAwardReputationRewards += reputationReward;
        }
        const payload = `${award.currentTier}|score:${award.currentScore}|cash:${cashReward}|reputation:${reputationReward}`;
        this.emitEvent(cashReward < 0 || reputationReward < 0 ? "hospital-award-penalty" : cashReward > 0 || reputationReward > 0 ? "hospital-award-granted" : "hospital-award-withheld", payload);
        return true;
    }
    startTreatmentResearch() {
        if (this.treatmentResearchLevel >= treatmentResearchMaxLevel() || this.activeTreatmentResearchRemainingTicks > 0) {
            return false;
        }
        const cost = this.treatmentResearchProjectCostForCurrentLevel();
        if (!this.canAffordPurchase(cost)) {
            return false;
        }
        this.debitPurchase(cost);
        this.totalTreatmentResearchInvestment += cost;
        this.activeTreatmentResearchRemainingTicks = this.treatmentResearchProjectTicksValue;
        this.emitEvent("research-started", `treatment|level:${this.treatmentResearchLevel + 1}`);
        return true;
    }
    startEmergencyWave(configOverride) {
        if (this.activeEmergencyWave) {
            return false;
        }
        const config = normalizeEmergencyWaveConfig(configOverride ?? this.emergencyWaveConfig);
        const waveId = this.nextEmergencyWaveId;
        const deadlineTick = this.clock.now() + config.durationTicks;
        const wave = {
            id: waveId,
            deadlineTick,
            patientIds: [],
            treatedPatientIds: [],
            failedPatientIds: [],
            config: cloneEmergencyWaveConfig(config)
        };
        this.activeEmergencyWave = wave;
        this.nextEmergencyWaveId += 1;
        this.totalEmergencyWaves += 1;
        for (let index = 0; index < config.patientCount; index += 1) {
            const patientId = this.admitPatient(config.severity, undefined, { emergencyWaveId: waveId, diseaseId: config.diseaseId });
            if (patientId !== null) {
                wave.patientIds.push(patientId);
            }
        }
        if (wave.patientIds.length === 0) {
            this.finishEmergencyWave("failed", `${wave.id}|no-admissions`);
            return false;
        }
        this.emitEvent("emergency-started", `${wave.id}|patients:${wave.patientIds.length}|deadline:${deadlineTick}`);
        return true;
    }
    startEpidemicOutbreak() {
        if (this.activeEpidemicOutbreak) {
            return false;
        }
        const config = this.epidemicOutbreakConfig;
        const outbreakId = this.nextEpidemicOutbreakId;
        const deadlineTick = this.clock.now() + config.durationTicks;
        const outbreak = {
            id: outbreakId,
            startTick: this.clock.now(),
            deadlineTick,
            nextSpreadTick: this.clock.now() + config.spreadIntervalTicks,
            rewardCash: this.epidemicRewardCashForOutbreak(config),
            patientIds: [],
            treatedPatientIds: [],
            failedPatientIds: [],
            spreadPatientIds: []
        };
        this.activeEpidemicOutbreak = outbreak;
        this.nextEpidemicOutbreakId += 1;
        this.totalEpidemicOutbreaks += 1;
        for (let index = 0; index < config.patientCount; index += 1) {
            const patientId = this.admitPatient(config.severity, undefined, { epidemicOutbreakId: outbreakId });
            if (patientId !== null) {
                outbreak.patientIds.push(patientId);
            }
        }
        if (config.vaccinationCost > 0 && outbreak.patientIds.length > 0) {
            const cost = config.vaccinationCost * outbreak.patientIds.length;
            this.debitExpense(cost);
            this.totalEpidemicVaccinationCosts += cost;
        }
        if (outbreak.patientIds.length === 0) {
            this.finishEpidemicOutbreak("failed", `${outbreak.id}|no-admissions`);
            return false;
        }
        this.emitEvent("epidemic-started", `${outbreak.id}|patients:${outbreak.patientIds.length}|deadline:${deadlineTick}`);
        return true;
    }
    epidemicRewardCashForOutbreak(config) {
        if (config.rewardCashMin === undefined || config.rewardCashMax === undefined || config.rewardCashMin === config.rewardCashMax) {
            return config.rewardCash;
        }
        return this.rng.nextInt(config.rewardCashMin, config.rewardCashMax + 1);
    }
    startStaffTraining(staffId) {
        const staff = this.getStaffById(staffId);
        if (!staff || staff.trainingRemainingTicks > 0 || staff.skillLevel >= staffMaxSkillLevel()) {
            return false;
        }
        const cost = this.staffTrainingCostValue;
        if (!this.canAffordPurchase(cost)) {
            return false;
        }
        this.cancelAssignmentsForStaff(staff.id);
        this.debitPurchase(cost);
        staff.status = "on-break";
        staff.autoBreakRemainingTicks = 0;
        staff.trainingRemainingTicks = this.staffTrainingTicksForTargetLevel(staff.skillLevel + 1);
        this.totalStaffTrainingStarted += 1;
        this.emitEvent("staff-training-started", `${staff.id}|${staff.role}|level:${staff.skillLevel + 1}`);
        return true;
    }
    startVipInspection() {
        if (this.activeVipInspection) {
            return false;
        }
        const visitId = this.nextVipInspectionId;
        const deadlineTick = this.clock.now() + vipInspectionDurationTicks();
        this.activeVipInspection = {
            id: visitId,
            deadlineTick,
            startingDeaths: this.totalPatientDeaths
        };
        this.nextVipInspectionId += 1;
        this.totalVipInspections += 1;
        this.emitEvent("vip-inspection-started", `${visitId}|deadline:${deadlineTick}`);
        return true;
    }
    defaultStaffPosition(role) {
        const staffOffset = this.nextStaffId - 1;
        const base = role === "diagnostician" ? { x: 2, y: 3 } : role === "handyman" ? { x: 6, y: 4 } : role === "receptionist" ? { x: 1, y: 4 } : { x: 4, y: 3 };
        return {
            x: clamp(base.x + staffOffset, 0, this.bounds.width - 1),
            y: clamp(base.y, 0, this.bounds.height - 1)
        };
    }
    defaultPatientPosition() {
        if (this.admissionPoints.length > 0) {
            return clonePosition(this.admissionPoints[this.totalAdmissions % this.admissionPoints.length]);
        }
        return {
            x: clamp(1 + this.rng.nextInt(0, 3), 0, this.bounds.width - 1),
            y: clamp(4, 0, this.bounds.height - 1)
        };
    }
    defaultRoomPosition(roomType, footprint) {
        const base = roomType === "diagnosis" ? { x: 1, y: 1 } : { x: 5, y: 1 };
        return {
            x: clamp(base.x, 0, Math.max(0, this.bounds.width - footprint.width)),
            y: clamp(base.y, 0, Math.max(0, this.bounds.height - footprint.height))
        };
    }
    findAvailableRoomPosition(preferred, footprint) {
        if (!this.isRoomFootprintInBounds(preferred, footprint)) {
            return null;
        }
        if (this.canPlaceRoomFootprint(preferred, footprint)) {
            return preferred;
        }
        for (let radius = 1; radius < Math.max(this.bounds.width, this.bounds.height); radius += 1) {
            for (let y = Math.max(0, preferred.y - radius); y <= Math.min(this.bounds.height - 1, preferred.y + radius); y += 1) {
                for (let x = Math.max(0, preferred.x - radius); x <= Math.min(this.bounds.width - 1, preferred.x + radius); x += 1) {
                    const candidate = { x, y };
                    if (this.canPlaceRoomFootprint(candidate, footprint)) {
                        return candidate;
                    }
                }
            }
        }
        return null;
    }
    canPlaceRoomFootprint(position, footprint) {
        return this.isRoomFootprintInBounds(position, footprint) && this.isRoomFootprintBuildable(position, footprint) && !this.isRoomFootprintOccupied(position, footprint);
    }
    isRoomFootprintInBounds(position, footprint) {
        return (isPositionInBounds(position, this.bounds) &&
            Number.isInteger(footprint.width) &&
            Number.isInteger(footprint.height) &&
            footprint.width > 0 &&
            footprint.height > 0 &&
            position.x + footprint.width <= this.bounds.width &&
            position.y + footprint.height <= this.bounds.height);
    }
    isRoomFootprintOccupied(position, footprint) {
        const requestedTiles = this.roomFootprintTiles(position, footprint);
        return this.rooms.some((room) => {
            const occupiedTiles = this.roomFootprintTiles(room.position, room.footprint);
            return requestedTiles.some((requestedTile) => occupiedTiles.some((occupiedTile) => samePosition(requestedTile, occupiedTile)));
        });
    }
    isObjectPositionOccupied(position) {
        return this.rooms.some((room) => this.roomFootprintTiles(room.position, room.footprint).some((tile) => samePosition(tile, position))) ||
            this.objects.some((object) => samePosition(object.position, position));
    }
    isRoomFootprintBuildable(position, footprint) {
        return this.roomFootprintTiles(position, footprint).every((tile) => this.isBuildablePosition(tile));
    }
    isBuildablePosition(position) {
        if (!isPositionInBounds(position, this.bounds)) {
            return false;
        }
        return this.terrain.buildableTiles[position.y * this.bounds.width + position.x] === 1;
    }
    isTraversablePosition(position) {
        if (!isPositionInBounds(position, this.bounds)) {
            return false;
        }
        return this.terrain.passableTiles[position.y * this.bounds.width + position.x] === 1;
    }
    findNearestTraversablePosition(preferred) {
        return this.findNearestPosition(preferred, (position) => this.isTraversablePosition(position));
    }
    findNearestPosition(preferred, predicate) {
        if (predicate(preferred)) {
            return preferred;
        }
        for (let radius = 1; radius < Math.max(this.bounds.width, this.bounds.height); radius += 1) {
            for (let y = Math.max(0, preferred.y - radius); y <= Math.min(this.bounds.height - 1, preferred.y + radius); y += 1) {
                for (let x = Math.max(0, preferred.x - radius); x <= Math.min(this.bounds.width - 1, preferred.x + radius); x += 1) {
                    const candidate = { x, y };
                    if (predicate(candidate)) {
                        return candidate;
                    }
                }
            }
        }
        return null;
    }
    roomFootprintTiles(position, footprint) {
        const tiles = [];
        for (let y = 0; y < footprint.height; y += 1) {
            for (let x = 0; x < footprint.width; x += 1) {
                tiles.push({ x: position.x + x, y: position.y + y });
            }
        }
        return tiles;
    }
    startDiagnosisAssignments() {
        const availableStaffIds = this.availableStaffIds("diagnostician", this.diagnosisAssignments);
        const availableRoomIds = this.availableRoomIds("diagnosis", this.diagnosisAssignments);
        const slots = Math.min(availableStaffIds.length, availableRoomIds.length);
        for (let i = 0; i < slots; i += 1) {
            const patient = this.dequeuePatientForStage(this.diagnosisQueue, "queued");
            if (!patient) {
                return;
            }
            const staffId = availableStaffIds[i];
            const roomId = this.selectDiagnosisRoomIdForPatient(patient, availableRoomIds);
            if (roomId === null) {
                this.diagnosisQueue.unshift(patient.id);
                return;
            }
            const assignment = this.createPatientAssignment(patient, staffId, roomId, "diagnosis", this.diagnosisTicksForStaff(patient.severity, staffId));
            if (!assignment) {
                this.diagnosisQueue.unshift(patient.id);
                return;
            }
            this.diagnosisAssignments.push(assignment);
            const roomIndex = availableRoomIds.indexOf(roomId);
            if (roomIndex >= 0) {
                availableRoomIds.splice(roomIndex, 1);
            }
        }
    }
    startTreatmentAssignments() {
        while (true) {
            const availableRoomIds = this.availableTreatmentRoomIds(this.treatmentAssignments)
                .filter((roomId) => this.availableTreatmentStaffIds(roomId, this.treatmentAssignments).length > 0);
            if (availableRoomIds.length === 0) {
                return;
            }
            const matched = this.dequeueTreatmentPatientForRooms(availableRoomIds);
            if (!matched) {
                return;
            }
            const availableStaffIds = this.availableTreatmentStaffIds(matched.roomId, this.treatmentAssignments);
            if (availableStaffIds.length === 0) {
                this.treatmentQueue.unshift(matched.patient.id);
                return;
            }
            const staffId = availableStaffIds[0];
            const assignment = this.createPatientAssignment(matched.patient, staffId, matched.roomId, "treatment", this.treatmentTicksForStaff(matched.patient, staffId, matched.roomId));
            if (!assignment) {
                this.treatmentQueue.unshift(matched.patient.id);
                return;
            }
            this.treatmentAssignments.push(assignment);
            const roomIndex = availableRoomIds.indexOf(matched.roomId);
            if (roomIndex >= 0) {
                availableRoomIds.splice(roomIndex, 1);
            }
        }
    }
    createPatientAssignment(patient, staffId, roomId, stage, remainingTicks) {
        const room = this.getRoomById(roomId);
        if (!room) {
            return null;
        }
        const destination = this.roomServicePosition(room);
        const movement = this.createPatientMovement(patient.position, destination, stage, room);
        if (!movement) {
            return null;
        }
        patient.assignedStaffId = staffId;
        patient.assignedRoomId = roomId;
        patient.movement = movement.path.length > 1 ? movement : null;
        patient.status = movement.path.length > 1
            ? (stage === "diagnosis" ? "walking-to-diagnosis" : "walking-to-treatment")
            : (stage === "diagnosis" ? "diagnosing" : "treating");
        return {
            patientId: patient.id,
            staffId,
            roomId,
            remainingTicks
        };
    }
    diagnosisTicksForStaff(severity, staffId) {
        const staff = this.getStaffById(staffId);
        const psychiatristReduction = severity >= 2 && staff?.specialties?.includes("psychiatrist") ? 1 : 0;
        return Math.max(1, diagnosisTicksForSeverity(severity) - staffSkillDurationReductionForLevel(staff?.skillLevel ?? 0) - psychiatristReduction);
    }
    treatmentTicksForStaff(patient, staffId, roomId) {
        const staff = this.getStaffById(staffId);
        const room = this.getRoomById(roomId);
        const roomReduction = room ? treatmentRoomDurationReductionForDisease(room.roomType, patient.diseaseId) : 0;
        const surgeonReduction = room?.roomType === "specialist" && staff?.specialties?.includes("surgeon") ? 1 : 0;
        return Math.max(1, treatmentTicksForSeverity(patient.severity) - staffSkillDurationReductionForLevel(staff?.skillLevel ?? 0) - roomReduction - surgeonReduction);
    }
    createPatientMovement(start, destination, stage, destinationRoom = null) {
        const routeAccess = this.createRoomRouteAccess(start, destinationRoom);
        let result = this.pathfinding.solve({
            start,
            goal: destination,
            blockedPositions: routeAccess.blockedPositions,
            allowedPositions: routeAccess.allowedPositions
        });
        if (!result.found && routeAccess.blockedPositions.length > 0) {
            result = this.pathfinding.solve({ start, goal: destination });
        }
        if (!result.found) {
            return null;
        }
        return {
            stage,
            destination: clonePosition(destination),
            pathIndex: 0,
            path: result.path.map((position) => clonePosition(position))
        };
    }
    roomServicePosition(room) {
        return {
            x: room.position.x + Math.floor(room.footprint.width / 2),
            y: room.position.y + Math.floor(room.footprint.height / 2)
        };
    }
    createRoomRouteAccess(start, destinationRoom) {
        const blockedPositions = [];
        const allowedPositions = [];
        const sourceRoom = this.roomAtPosition(start);
        for (const room of this.rooms) {
            if (room.blocksRouting !== true) {
                continue;
            }
            const tiles = this.roomFootprintTiles(room.position, room.footprint);
            blockedPositions.push(...tiles);
            if (room === sourceRoom || room === destinationRoom) {
                allowedPositions.push(...tiles);
            }
        }
        return { blockedPositions, allowedPositions };
    }
    roomAtPosition(position) {
        return this.rooms.find((room) => this.roomFootprintTiles(room.position, room.footprint).some((tile) => samePosition(tile, position))) ?? null;
    }
    progressPatientMovement() {
        for (const patient of this.waitingPatients) {
            if (!patient.movement) {
                continue;
            }
            const nextIndex = Math.min(patient.movement.pathIndex + 1, patient.movement.path.length - 1);
            const nextPosition = patient.movement.path[nextIndex];
            if (!nextPosition) {
                patient.movement = null;
                continue;
            }
            patient.position = clonePosition(nextPosition);
            patient.movement.pathIndex = nextIndex;
            if (nextIndex < patient.movement.path.length - 1) {
                continue;
            }
            const stage = patient.movement.stage;
            patient.movement = null;
            patient.status = stage === "diagnosis" ? "diagnosing" : "treating";
        }
    }
    progressDiagnosisAssignments(utilizedStaffIds, utilizedRoomIds) {
        const activeAssignments = [];
        for (const assignment of this.diagnosisAssignments) {
            const patient = this.getPatientById(assignment.patientId);
            if (!patient) {
                continue;
            }
            if (patient.status === "walking-to-diagnosis") {
                activeAssignments.push(assignment);
                continue;
            }
            if (!this.isAssignmentOperational(assignment, "diagnostician", "diagnosis")) {
                activeAssignments.push(assignment);
                continue;
            }
            utilizedStaffIds.add(assignment.staffId);
            utilizedRoomIds.add(assignment.roomId);
            assignment.remainingTicks -= 1;
            if (assignment.remainingTicks > 0) {
                activeAssignments.push(assignment);
                continue;
            }
            patient.diagnosisKnown = true;
            patient.status = "awaiting-treatment";
            patient.movement = null;
            patient.assignedStaffId = null;
            patient.assignedRoomId = null;
            this.emitEvent("patient-diagnosed", `${patient.id}|${patient.diseaseId}`);
            this.treatmentQueue.push(patient.id);
        }
        this.diagnosisAssignments = activeAssignments;
    }
    progressTreatmentAssignments(utilizedStaffIds, utilizedRoomIds) {
        const activeAssignments = [];
        for (const assignment of this.treatmentAssignments) {
            const patient = this.getPatientById(assignment.patientId);
            if (!patient) {
                continue;
            }
            if (patient.status === "walking-to-treatment") {
                activeAssignments.push(assignment);
                continue;
            }
            if (!this.isAssignmentOperational(assignment, "nurse", "treatment") && !this.isSurgeonTreatmentAssignmentOperational(assignment)) {
                activeAssignments.push(assignment);
                continue;
            }
            utilizedStaffIds.add(assignment.staffId);
            utilizedRoomIds.add(assignment.roomId);
            assignment.remainingTicks -= 1;
            if (assignment.remainingTicks > 0) {
                activeAssignments.push(assignment);
                continue;
            }
            this.completeTreatmentById(patient.id);
        }
        this.treatmentAssignments = activeAssignments;
    }
    completeTreatmentById(patientId) {
        const patient = this.getPatientById(patientId);
        if (!patient) {
            return false;
        }
        const room = patient.assignedRoomId ? this.getRoomById(patient.assignedRoomId) : null;
        if (treatmentSucceedsForPatient(patient, this.treatmentResearchLevel, room?.roomType ?? "treatment", this.treatmentResearchSuccessBonus())) {
            return this.dischargePatientById(patient.id);
        }
        return this.failTreatmentById(patient.id);
    }
    treatmentResearchSuccessBonus() {
        if (this.treatmentResearchStartRating === null) {
            return treatmentResearchSuccessBonusForLevel(this.treatmentResearchLevel);
        }
        const startBonus = Math.max(0, this.treatmentResearchStartRating - 70);
        const improveRate = this.treatmentResearchImproveRate ?? 0;
        return Math.min(100, startBonus + this.treatmentResearchLevel * improveRate);
    }
    treatmentResearchProjectCostForCurrentLevel() {
        let cost = this.treatmentResearchProjectCostValue;
        if (this.treatmentResearchImproveCostPercent <= 0 || this.treatmentResearchLevel <= 0) {
            return Math.max(this.treatmentResearchProjectMinCostValue, cost);
        }
        cost = Math.round(this.treatmentResearchProjectCostValue * (100 + this.treatmentResearchLevel * this.treatmentResearchImproveCostPercent) / 100);
        return Math.max(this.treatmentResearchProjectMinCostValue, cost);
    }
    applyPatientHealthDecay() {
        const expiredPatientIds = [];
        for (const patient of this.waitingPatients) {
            patient.health = Math.max(0, patient.health - 1);
            this.applyPatientVomit(patient);
            this.applyPatientLitter(patient);
            this.applyPatientBowelNeed(patient);
            if (patient.health === 0) {
                expiredPatientIds.push(patient.id);
            }
        }
        for (const patientId of expiredPatientIds) {
            this.removeExpiredPatient(patientId);
        }
    }
    applyPatientVomit(patient) {
        if (patient.vomited || this.patientBehavior.vomitLimit === undefined || patient.health <= 0) {
            return;
        }
        if (!this.isPatientAtOrBelowMoodThreshold(patient, "vomitLimit")) {
            return;
        }
        patient.vomited = true;
        this.totalPatientVomits += 1;
        this.emitEvent("patient-vomited", `${patient.id}|health:${patient.health}`);
    }
    applyPatientLitter(patient) {
        const litterDropTicks = this.patientBehavior.litterDrop;
        if (patient.droppedLitter || !Number.isInteger(litterDropTicks) || litterDropTicks <= 0) {
            return;
        }
        if (this.clock.now() - patient.admittedTick < litterDropTicks) {
            return;
        }
        const litterRandom = this.patientBehavior.litterRandom;
        if (Number.isInteger(litterRandom) && litterRandom > 1 && this.rng.nextInt(0, litterRandom) !== 0) {
            return;
        }
        patient.droppedLitter = true;
        this.totalPatientLitter += 1;
        this.emitEvent("patient-litter-dropped", `${patient.id}|tick:${this.clock.now()}`);
    }
    applyLitterCleanup() {
        const cleanupChance = this.patientBehavior.litterCleanupChance;
        if (!Number.isInteger(cleanupChance) || cleanupChance <= 0) {
            return;
        }
        const activeHandymanIds = this.staff
            .filter((staff) => staff.role === "handyman" && staff.status === "active")
            .map((staff) => staff.id);
        if (activeHandymanIds.length === 0) {
            return;
        }
        let handymanIndex = 0;
        for (const patient of this.waitingPatients) {
            if (!patient.droppedLitter) {
                continue;
            }
            const handymanId = activeHandymanIds[handymanIndex % activeHandymanIds.length];
            handymanIndex += 1;
            const roll = (this.clock.now() * 31 + patient.id * 17 + handymanId * 13) % 10_000;
            if (roll >= Math.min(10_000, cleanupChance)) {
                continue;
            }
            patient.droppedLitter = false;
            this.totalPatientLitterCleaned += 1;
            this.emitEvent("patient-litter-cleaned", `${patient.id}|handyman:${handymanId}`);
        }
    }
    applyPatientBowelNeed(patient) {
        const ageTicks = this.clock.now() - patient.admittedTick;
        const bowelFullTicks = this.patientBehavior.bowelFull;
        if (!patient.usedToilet && !patient.needsToilet && Number.isInteger(bowelFullTicks) && bowelFullTicks > 0 && ageTicks >= bowelFullTicks) {
            patient.needsToilet = true;
            this.emitEvent("patient-needs-toilet", `${patient.id}|tick:${this.clock.now()}`);
        }
        const bowelOverflowTicks = this.patientBehavior.bowelOverflows;
        if (patient.usedToilet || patient.bowelOverflowed || !Number.isInteger(bowelOverflowTicks) || bowelOverflowTicks <= 0 || ageTicks < bowelOverflowTicks) {
            return;
        }
        patient.needsToilet = true;
        patient.bowelOverflowed = true;
        this.totalPatientBowelOverflows += 1;
        this.emitEvent("patient-bowel-overflowed", `${patient.id}|tick:${this.clock.now()}`);
    }
    removeExpiredPatient(patientId) {
        const patientIndex = this.waitingPatients.findIndex((patient) => patient.id === patientId);
        if (patientIndex < 0) {
            return false;
        }
        const patient = this.waitingPatients[patientIndex];
        if (!patient) {
            return false;
        }
        removeFromQueue(this.diagnosisQueue, patientId);
        removeFromQueue(this.treatmentQueue, patientId);
        this.removeAssignmentsForPatient(patientId);
        this.waitingPatients.splice(patientIndex, 1);
        this.totalPatientDeaths += 1;
        this.debitExpense(patientDeathCashPenaltyForSeverity(patient.severity));
        this.reputation = clamp(this.reputation - patientDeathReputationPenaltyForSeverity(patient.severity), REPUTATION_MIN, REPUTATION_MAX);
        this.applyAutopsyForPatientDeath(patient);
        this.emitEvent("patient-died", `${patient.id}|severity:${patient.severity}`);
        this.markEmergencyPatientResolved(patient, "failed");
        this.markEpidemicPatientResolved(patient, "failed");
        this.markInsuranceContractPatientResolved(patient, "failed");
        return true;
    }
    applyAutopsyForPatientDeath(patient) {
        const researchPercent = this.autopsyConfig.researchPercent ?? 0;
        if (researchPercent > 0 && this.activeTreatmentResearchRemainingTicks > 0) {
            const researchTicks = Math.min(this.activeTreatmentResearchRemainingTicks, Math.max(1, Math.ceil(this.treatmentResearchProjectTicksValue * researchPercent / 100)));
            this.activeTreatmentResearchRemainingTicks -= researchTicks;
            this.totalAutopsyResearchTicks += researchTicks;
            if (this.activeTreatmentResearchRemainingTicks === 0) {
                this.treatmentResearchLevel = Math.min(treatmentResearchMaxLevel(), this.treatmentResearchLevel + 1);
                this.emitEvent("research-completed", `treatment|level:${this.treatmentResearchLevel}|autopsy:${patient.id}`);
            }
        }
        const reputationHitPercent = this.autopsyConfig.reputationHitPercent ?? 0;
        if (reputationHitPercent > 0) {
            const penalty = Math.max(1, Math.ceil(this.reputation * reputationHitPercent / 100));
            this.reputation = clamp(this.reputation - penalty, REPUTATION_MIN, REPUTATION_MAX);
            this.totalAutopsyReputationPenalty += penalty;
        }
    }
    applyPatientPatience() {
        const leaveMaxTicks = this.patientBehavior.leaveMaxTicks;
        if (!Number.isInteger(leaveMaxTicks) || leaveMaxTicks <= 0) {
            return;
        }
        const walkoutPatientIds = this.waitingPatients
            .filter((patient) => (patient.status === "queued" || patient.status === "awaiting-treatment") && this.clock.now() - patient.admittedTick >= leaveMaxTicks)
            .map((patient) => patient.id);
        for (const patientId of walkoutPatientIds) {
            this.removeImpatientPatient(patientId);
        }
    }
    removeImpatientPatient(patientId) {
        const patientIndex = this.waitingPatients.findIndex((patient) => patient.id === patientId);
        if (patientIndex < 0) {
            return false;
        }
        const patient = this.waitingPatients[patientIndex];
        if (!patient) {
            return false;
        }
        removeFromQueue(this.diagnosisQueue, patientId);
        removeFromQueue(this.treatmentQueue, patientId);
        this.removeAssignmentsForPatient(patientId);
        this.waitingPatients.splice(patientIndex, 1);
        this.totalPatientWalkouts += 1;
        this.debitExpense(patientSendHomeCashPenaltyForSeverity(patient.severity));
        this.reputation = clamp(this.reputation - patientSendHomeReputationPenaltyForSeverity(patient.severity), REPUTATION_MIN, REPUTATION_MAX);
        this.emitEvent("patient-left", `${patient.id}|severity:${patient.severity}`);
        this.markEmergencyPatientResolved(patient, "failed");
        this.markEpidemicPatientResolved(patient, "failed");
        this.markInsuranceContractPatientResolved(patient, "failed");
        return true;
    }
    sendPatientHome(patientId) {
        const patientIndex = this.waitingPatients.findIndex((patient) => patient.id === patientId);
        if (patientIndex < 0) {
            return false;
        }
        const patient = this.waitingPatients[patientIndex];
        if (!patient) {
            return false;
        }
        removeFromQueue(this.diagnosisQueue, patientId);
        removeFromQueue(this.treatmentQueue, patientId);
        this.removeAssignmentsForPatient(patientId);
        this.waitingPatients.splice(patientIndex, 1);
        this.debitExpense(patientSendHomeCashPenaltyForSeverity(patient.severity));
        this.reputation = clamp(this.reputation - patientSendHomeReputationPenaltyForSeverity(patient.severity), REPUTATION_MIN, REPUTATION_MAX);
        this.emitEvent("patient-sent-home", `${patient.id}|severity:${patient.severity}`);
        this.markEmergencyPatientResolved(patient, "failed");
        this.markEpidemicPatientResolved(patient, "failed");
        this.markInsuranceContractPatientResolved(patient, "failed");
        return true;
    }
    applyAlienAbduction(patientId, abductionIndex) {
        const patientIndex = Number.isInteger(patientId)
            ? this.waitingPatients.findIndex((patient) => patient.id === patientId)
            : 0;
        if (patientIndex < 0 || patientIndex >= this.waitingPatients.length) {
            return false;
        }
        const patient = this.waitingPatients[patientIndex];
        if (!patient) {
            return false;
        }
        removeFromQueue(this.diagnosisQueue, patient.id);
        removeFromQueue(this.treatmentQueue, patient.id);
        this.removeAssignmentsForPatient(patient.id);
        this.waitingPatients.splice(patientIndex, 1);
        this.totalPatientAbductions += 1;
        this.reputation = clamp(this.reputation - patientSendHomeReputationPenaltyForSeverity(patient.severity), REPUTATION_MIN, REPUTATION_MAX);
        this.emitEvent("patient-abducted", `${patient.id}|severity:${patient.severity}${Number.isInteger(abductionIndex) ? `|abduction:${abductionIndex}` : ""}`);
        this.markEmergencyPatientResolved(patient, "failed");
        this.markEpidemicPatientResolved(patient, "failed");
        this.markInsuranceContractPatientResolved(patient, "failed");
        return true;
    }
    prioritizePatient(patientId) {
        const patient = this.getPatientById(patientId);
        if (!patient) {
            return false;
        }
        if (patient.status === "queued") {
            removeFromQueue(this.diagnosisQueue, patientId);
            this.diagnosisQueue.unshift(patientId);
            this.emitEvent("patient-prioritized", `${patient.id}|diagnosis`);
            return true;
        }
        if (patient.status === "awaiting-treatment") {
            removeFromQueue(this.treatmentQueue, patientId);
            this.treatmentQueue.unshift(patientId);
            this.emitEvent("patient-prioritized", `${patient.id}|treatment`);
            return true;
        }
        return false;
    }
    givePatientDrink(patientId) {
        const patient = this.getPatientById(patientId);
        const drinkHappy = this.patientBehavior.drinkHappy;
        if (!patient || patient.drank || !Number.isInteger(drinkHappy) || drinkHappy <= 0 || patient.health <= 0 || patient.health >= patient.maxHealth) {
            return false;
        }
        patient.health = Math.min(patient.maxHealth, patient.health + drinkHappy);
        patient.drank = true;
        this.totalPatientDrinks += 1;
        this.emitEvent("patient-drank", `${patient.id}|health:${patient.health}`);
        return true;
    }
    sendPatientToilet(patientId) {
        const patient = this.getPatientById(patientId);
        const toiletHappy = this.patientBehavior.toiletHappy;
        if (!patient || patient.usedToilet || patient.health <= 0 || (!patient.needsToilet && !Number.isInteger(toiletHappy))) {
            return false;
        }
        if (Number.isInteger(toiletHappy) && toiletHappy > 0) {
            patient.health = Math.min(patient.maxHealth, patient.health + toiletHappy);
        }
        patient.needsToilet = false;
        patient.usedToilet = true;
        this.emitEvent("patient-used-toilet", `${patient.id}|health:${patient.health}`);
        return true;
    }
    shootRat(hit = true) {
        this.totalRatsSighted += 1;
        if (hit !== false) {
            this.totalRatsKilled += 1;
        }
        this.emitEvent(hit === false ? "rat-shot-missed" : "rat-killed", `rats:${this.totalRatsKilled}/${this.totalRatsSighted}`);
        return true;
    }
    waterPlant(watered = true) {
        this.totalPlantWaterChecks += 1;
        if (watered !== false) {
            this.totalPlantsWatered += 1;
        }
        this.emitEvent(watered === false ? "plant-neglected" : "plant-watered", `plants:${this.totalPlantsWatered}/${this.totalPlantWaterChecks}`);
        return true;
    }
    failTreatmentById(patientId) {
        const patientIndex = this.waitingPatients.findIndex((patient) => patient.id === patientId);
        if (patientIndex < 0) {
            return false;
        }
        const patient = this.waitingPatients[patientIndex];
        if (!patient) {
            return false;
        }
        removeFromQueue(this.diagnosisQueue, patientId);
        removeFromQueue(this.treatmentQueue, patientId);
        this.removeAssignmentsForPatient(patientId);
        this.waitingPatients.splice(patientIndex, 1);
        this.totalTreatmentFailures += 1;
        this.debitExpense(treatmentFailureCashPenaltyForSeverity(patient.severity));
        this.reputation = clamp(this.reputation - treatmentFailureReputationPenaltyForSeverity(patient.severity), REPUTATION_MIN, REPUTATION_MAX);
        this.emitEvent("patient-treatment-failed", `${patient.id}|${patient.diseaseId}`);
        this.markEmergencyPatientResolved(patient, "failed");
        this.markEpidemicPatientResolved(patient, "failed");
        this.markInsuranceContractPatientResolved(patient, "failed");
        return true;
    }
    manualTreatPatient(patientId) {
        if (this.waitingPatients.length === 0) {
            return false;
        }
        const candidate = patientId ??
            this.treatmentAssignments[0]?.patientId ??
            this.treatmentQueue[0] ??
            this.diagnosisAssignments[0]?.patientId ??
            this.diagnosisQueue[0] ??
            null;
        if (candidate === null || candidate === undefined) {
            return false;
        }
        if (!this.getPatientById(candidate)) {
            return false;
        }
        removeFromQueue(this.treatmentQueue, candidate);
        removeFromQueue(this.diagnosisQueue, candidate);
        this.removeAssignmentsForPatient(candidate);
        return this.dischargePatientById(candidate);
    }
    dischargePatientById(patientId) {
        const patientIndex = this.waitingPatients.findIndex((patient) => patient.id === patientId);
        if (patientIndex < 0) {
            return false;
        }
        const patient = this.waitingPatients[patientIndex];
        if (!patient) {
            return false;
        }
        removeFromQueue(this.diagnosisQueue, patientId);
        removeFromQueue(this.treatmentQueue, patientId);
        this.removeAssignmentsForPatient(patientId);
        this.waitingPatients.splice(patientIndex, 1);
        this.totalTreatments += 1;
        this.totalDischarges += 1;
        this.creditIncome(this.dischargeCashRewardForPatient(patient));
        this.reputation = clamp(this.reputation + dischargeReputationRewardForSeverityAndPricing(patient.severity, this.treatmentPricingPolicy), REPUTATION_MIN, REPUTATION_MAX);
        this.refreshProgression();
        this.markEmergencyPatientResolved(patient, "treated");
        this.markEpidemicPatientResolved(patient, "treated");
        this.markInsuranceContractPatientResolved(patient, "treated");
        return true;
    }
    dischargeCashRewardForPatient(patient) {
        const startPrice = this.diseaseTreatmentPrices[patient.diseaseId];
        if (startPrice === undefined) {
            return dischargeCashRewardForSeverityAndPricing(patient.severity, this.treatmentPricingPolicy);
        }
        return Math.floor(startPrice * treatmentPricingCashMultiplier(this.treatmentPricingPolicy));
    }
    dequeuePatientForStage(queue, stage) {
        while (queue.length > 0) {
            const patientId = queue.shift();
            if (patientId === undefined) {
                return null;
            }
            const patient = this.getPatientById(patientId);
            if (!patient || patient.status !== stage) {
                continue;
            }
            return patient;
        }
        return null;
    }
    availableStaffIds(role, assignments) {
        const busyStaffIds = new Set(assignments.map((assignment) => assignment.staffId));
        return this.staff
            .filter((staff) => staff.role === role && staff.status === "active" && !busyStaffIds.has(staff.id))
            .map((staff) => staff.id)
            .sort((left, right) => left - right);
    }
    availableTreatmentStaffIds(roomId, assignments) {
        const room = this.getRoomById(roomId);
        const busyStaffIds = new Set(assignments.map((assignment) => assignment.staffId));
        const requiresSurgeon = room?.roomType === "specialist";
        return this.staff
            .filter((staff) => staff.status === "active" && !busyStaffIds.has(staff.id) &&
            (requiresSurgeon
                ? staff.role === "diagnostician" && staff.specialties?.includes("surgeon")
                : staff.role === "nurse"))
            .map((staff) => staff.id)
            .sort((left, right) => {
            const leftStaff = this.getStaffById(left);
            const rightStaff = this.getStaffById(right);
            const leftPriority = leftStaff?.role === "diagnostician" ? 0 : 1;
            const rightPriority = rightStaff?.role === "diagnostician" ? 0 : 1;
            return leftPriority - rightPriority || left - right;
        });
    }
    availableRoomIds(roomType, assignments) {
        const busyRoomIds = new Set(assignments.map((assignment) => assignment.roomId));
        return this.rooms
            .filter((room) => room.roomType === roomType && room.status === "open" && !busyRoomIds.has(room.id))
            .map((room) => room.id)
            .sort((left, right) => left - right);
    }
    availableTreatmentRoomIds(assignments) {
        const busyRoomIds = new Set(assignments.map((assignment) => assignment.roomId));
        return this.rooms
            .filter((room) => isTreatmentRoomType(room.roomType) && room.status === "open" && !busyRoomIds.has(room.id))
            .map((room) => room.id)
            .sort((left, right) => left - right);
    }
    dequeueTreatmentPatientForRooms(availableRoomIds) {
        for (let index = 0; index < this.treatmentQueue.length; index += 1) {
            const patientId = this.treatmentQueue[index];
            const patient = this.getPatientById(patientId);
            if (!patient || patient.status !== "awaiting-treatment") {
                this.treatmentQueue.splice(index, 1);
                index -= 1;
                continue;
            }
            const roomId = this.selectTreatmentRoomIdForPatient(patient, availableRoomIds);
            if (roomId === null) {
                continue;
            }
            this.treatmentQueue.splice(index, 1);
            return { patient, roomId };
        }
        return null;
    }
    selectDiagnosisRoomIdForPatient(patient, availableRoomIds) {
        const availableRooms = availableRoomIds
            .map((roomId) => this.getRoomById(roomId))
            .filter((room) => room && room.roomType === "diagnosis");
        return this.selectBestRoutedRoomForPatient(patient, availableRooms, "diagnosis")?.id ?? null;
    }
    selectTreatmentRoomIdForPatient(patient, availableRoomIds) {
        const availableRooms = availableRoomIds
            .map((roomId) => this.getRoomById(roomId))
            .filter((room) => room && isTreatmentRoomType(room.roomType));
        const preferredRoomType = treatmentRoomTypeForDisease(patient.diseaseId);
        const preferred = this.selectBestRoutedRoomForPatient(patient, availableRooms.filter((room) => room.roomType === preferredRoomType), "treatment");
        if (preferred) {
            return preferred.id;
        }
        if (preferredRoomType !== "treatment") {
            return null;
        }
        const general = this.selectBestRoutedRoomForPatient(patient, availableRooms.filter((room) => room.roomType === "treatment"), "treatment");
        return general?.id ?? null;
    }
    selectBestRoutedRoomForPatient(patient, rooms, stage) {
        if (rooms.length === 0) {
            return null;
        }
        const queuePoints = this.routingSettings.queuePoints ?? 0;
        const distancePoints = this.routingSettings.distancePoints ?? 0;
        const noStaffPoints = this.routingSettings.noStaffPoints ?? 0;
        let best = null;
        for (const room of rooms) {
            const distance = distancePoints > 0 ? this.routeDistanceForPatientRoom(patient, room, stage) : 0;
            if (distance === null) {
                continue;
            }
            const score = queuePoints * this.activeAssignmentCountForRoom(room.id) +
                distancePoints * distance +
                noStaffPoints * this.noStaffPenaltyForRoom(room.roomType);
            if (!best || score < best.score || (score === best.score && room.id < best.room.id)) {
                best = { room, score };
            }
        }
        return best?.room ?? null;
    }
    routeDistanceForPatientRoom(patient, room, stage) {
        const movement = this.createPatientMovement(patient.position, this.roomServicePosition(room), stage, room);
        if (!movement) {
            return null;
        }
        return Math.max(0, movement.path.length - 1);
    }
    activeAssignmentCountForRoom(roomId) {
        return this.diagnosisAssignments.filter((assignment) => assignment.roomId === roomId).length +
            this.treatmentAssignments.filter((assignment) => assignment.roomId === roomId).length;
    }
    noStaffPenaltyForRoom(roomType) {
        const role = roomType === "diagnosis" ? "diagnostician" : "nurse";
        return this.staff.some((member) => member.role === role && member.status === "active") ? 0 : 1;
    }
    isAssignmentOperational(assignment, staffRole, roomType) {
        const staff = this.getStaffById(assignment.staffId);
        const room = this.getRoomById(assignment.roomId);
        const roomMatchesStage = roomType === "treatment" ? isTreatmentRoomType(room?.roomType) : room?.roomType === roomType;
        return Boolean(staff && room && staff.role === staffRole && staff.status === "active" && roomMatchesStage && room.status === "open");
    }
    isSurgeonTreatmentAssignmentOperational(assignment) {
        const staff = this.getStaffById(assignment.staffId);
        const room = this.getRoomById(assignment.roomId);
        return Boolean(staff && room && staff.role === "diagnostician" && staff.status === "active" && staff.specialties?.includes("surgeon") && room.roomType === "specialist" && room.status === "open");
    }
    removeAssignmentsForPatient(patientId) {
        this.diagnosisAssignments = this.diagnosisAssignments.filter((assignment) => assignment.patientId !== patientId);
        this.treatmentAssignments = this.treatmentAssignments.filter((assignment) => assignment.patientId !== patientId);
    }
    cancelAssignmentsForStaff(staffId) {
        const diagnosisAssignments = this.diagnosisAssignments.filter((assignment) => assignment.staffId === staffId);
        const treatmentAssignments = this.treatmentAssignments.filter((assignment) => assignment.staffId === staffId);
        for (const assignment of diagnosisAssignments) {
            this.cancelAssignment(assignment, "diagnosis");
        }
        for (const assignment of treatmentAssignments) {
            this.cancelAssignment(assignment, "treatment");
        }
        this.diagnosisAssignments = this.diagnosisAssignments.filter((assignment) => assignment.staffId !== staffId);
        this.treatmentAssignments = this.treatmentAssignments.filter((assignment) => assignment.staffId !== staffId);
    }
    cancelAssignmentsForRoom(roomId) {
        const diagnosisAssignments = this.diagnosisAssignments.filter((assignment) => assignment.roomId === roomId);
        const treatmentAssignments = this.treatmentAssignments.filter((assignment) => assignment.roomId === roomId);
        for (const assignment of diagnosisAssignments) {
            this.cancelAssignment(assignment, "diagnosis");
        }
        for (const assignment of treatmentAssignments) {
            this.cancelAssignment(assignment, "treatment");
        }
        this.diagnosisAssignments = this.diagnosisAssignments.filter((assignment) => assignment.roomId !== roomId);
        this.treatmentAssignments = this.treatmentAssignments.filter((assignment) => assignment.roomId !== roomId);
    }
    cancelAssignment(assignment, stage) {
        const patient = this.getPatientById(assignment.patientId);
        if (!patient) {
            return;
        }
        patient.movement = null;
        patient.assignedStaffId = null;
        patient.assignedRoomId = null;
        if (stage === "diagnosis") {
            patient.status = "queued";
            this.enqueueUnique(this.diagnosisQueue, patient.id);
            return;
        }
        patient.status = "awaiting-treatment";
        this.enqueueUnique(this.treatmentQueue, patient.id);
    }
    enqueueUnique(queue, patientId) {
        if (!queue.includes(patientId)) {
            queue.push(patientId);
        }
    }
    refreshProgression() {
        for (const milestone of PROGRESSION_MILESTONES) {
            if (this.unlockedMilestones.includes(milestone.id)) {
                continue;
            }
            if (this.totalDischarges < milestone.minimumDischarges) {
                return;
            }
            this.unlockedMilestones.push(milestone.id);
            this.unlockedUnlocks.push(milestone.unlock);
            this.recurringIncomeBonus += progressionIncomeBonusForUnlock(milestone.unlock);
            this.emitEvent("milestone-unlocked", `${milestone.id}|${milestone.unlock}`);
        }
    }
    applyQueuePressure() {
        const pressure = this.waitingPatients.filter((patient) => patient.status === "queued" || patient.status === "awaiting-treatment").length;
        const nextStatus = pressure >= QUEUE_PRESSURE_HIGH_THRESHOLD ? "high" : "normal";
        if (nextStatus !== this.queuePressureStatus) {
            this.queuePressureStatus = nextStatus;
            this.queuePressureEvents += 1;
            this.emitEvent(nextStatus === "high" ? "queue-pressure-high" : "queue-pressure-normal", String(pressure));
        }
        if (nextStatus === "high") {
            this.reputation = clamp(this.reputation - QUEUE_PRESSURE_REPUTATION_PENALTY_PER_TICK, REPUTATION_MIN, REPUTATION_MAX);
        }
    }
    applyStaffFatigue(utilizedStaffIds) {
        if (!this.shouldApplyStaffFatigueThisTick()) {
            return;
        }
        for (const staff of this.staff) {
            if (staff.status !== "active") {
                continue;
            }
            if (utilizedStaffIds.has(staff.id)) {
                const nextStress = staff.stress + this.staffWorkStressTicks(staff);
                if (nextStress >= this.staffBurnoutTicksForRole(staff.role)) {
                    staff.burnoutCount = (staff.burnoutCount ?? 0) + 1;
                    if (this.staffShouldResignAfterBurnout(staff)) {
                        this.resignStaff(staff);
                        continue;
                    }
                    staff.stress = 0;
                    staff.status = "on-break";
                    staff.autoBreakRemainingTicks = this.staffAutoBreakTicksForRole(staff.role);
                    this.staffBurnoutEvents += 1;
                    this.emitEvent("staff-burnout", `${staff.id}|${staff.role}`);
                    continue;
                }
                staff.stress = nextStress;
                continue;
            }
            staff.stress = Math.max(0, staff.stress - this.staffIdleRecoveryTicks(staff));
        }
    }
    staffShouldResignAfterBurnout(staff) {
        return this.staffFatigueConfig.resignBurnoutCount !== undefined &&
            staff.burnoutCount >= this.staffFatigueConfig.resignBurnoutCount;
    }
    resignStaff(staff) {
        this.cancelAssignmentsForStaff(staff.id);
        this.staff = this.staff.filter((member) => member.id !== staff.id);
        this.staffBurnoutEvents += 1;
        this.emitEvent("staff-resigned", `${staff.id}|${staff.role}|burnouts:${staff.burnoutCount}`);
    }
    staffIdleRecoveryTicks(staff) {
        if (this.staffFatigueConfig.recoveryFactorTicks === undefined || staff.stress <= 0) {
            return this.staffFatigueConfig.idleRecoveryTicks;
        }
        return Math.max(1, Math.floor(this.staffFatigueConfig.idleRecoveryTicks * this.staffFatigueConfig.recoveryFactorTicks / staff.stress));
    }
    shouldApplyStaffFatigueThisTick() {
        return this.clock.now() % this.staffFatigueConfig.modifyFrequency === 0;
    }
    progressStaffAutoBreakRecovery() {
        for (const staff of this.staff) {
            if (staff.status !== "on-break" || staff.trainingRemainingTicks > 0 || staff.autoBreakRemainingTicks <= 0) {
                continue;
            }
            staff.autoBreakRemainingTicks -= 1;
            if (staff.autoBreakRemainingTicks > 0) {
                continue;
            }
            staff.status = "active";
            this.staffRecoveryEvents += 1;
            this.emitEvent("staff-recovered", `${staff.id}|${staff.role}`);
        }
    }
    staffBurnoutTicksForRole(role) {
        return this.staffFatigueConfig.burnoutTicksByRole[role] ?? staffBurnoutTicks(role);
    }
    staffAutoBreakTicksForRole(role) {
        return this.staffFatigueConfig.autoBreakTicksByRole[role] ?? staffAutoBreakTicks(role);
    }
    staffTrainingTicksForTargetLevel(targetLevel) {
        return this.staffTrainingTicksByTargetLevel[targetLevel] ?? this.staffTrainingTicksValue;
    }
    progressStaffTraining() {
        for (const staff of this.staff) {
            if (staff.trainingRemainingTicks <= 0) {
                continue;
            }
            staff.trainingRemainingTicks -= 1;
            if (staff.trainingRemainingTicks > 0) {
                continue;
            }
            staff.skillLevel = Math.min(staffMaxSkillLevel(), staff.skillLevel + 1);
            const wageCostPerTick = this.staffWageCostForRoleAndSkill(staff.role, staff.skillLevel);
            if (wageCostPerTick === this.staffWageCostForRole(staff.role)) {
                delete staff.wageCostPerTick;
            }
            else {
                staff.wageCostPerTick = wageCostPerTick;
            }
            staff.status = "active";
            staff.autoBreakRemainingTicks = 0;
            this.totalStaffTrainingCompleted += 1;
            this.emitEvent("staff-training-completed", `${staff.id}|${staff.role}|level:${staff.skillLevel}`);
        }
    }
    applyRoomWear(utilizedRoomIds) {
        for (const roomId of utilizedRoomIds) {
            const room = this.getRoomById(roomId);
            if (!room || room.status !== "open" || room.maintenanceRemainingTicks > 0) {
                continue;
            }
            room.wear += 1;
            if (room.wear < this.roomWearThresholdForType(room.roomType)) {
                continue;
            }
            room.status = "closed";
            room.maintenanceRemainingTicks = roomMaintenanceTicks(room.roomType);
            this.roomMaintenanceStartEvents += 1;
            this.emitEvent("room-maintenance-started", `${room.id}|${room.roomType}`);
        }
    }
    applyEarthquake(severity, quakeIndex = null) {
        let affectedRooms = 0;
        for (const room of this.rooms) {
            if (room.status !== "open" || room.maintenanceRemainingTicks > 0) {
                continue;
            }
            room.wear += severity;
            affectedRooms += 1;
            if (room.wear < this.roomWearThresholdForType(room.roomType)) {
                continue;
            }
            room.status = "closed";
            room.maintenanceRemainingTicks = roomMaintenanceTicks(room.roomType);
            this.roomMaintenanceStartEvents += 1;
            this.emitEvent("room-maintenance-started", `${room.id}|${room.roomType}|earthquake`);
        }
        this.emitEvent("earthquake-applied", `severity:${severity}|rooms:${affectedRooms}${Number.isInteger(quakeIndex) ? `|quake:${quakeIndex}` : ""}`);
    }
    progressRoomMaintenanceRecovery() {
        let availableHandymanIds = null;
        let handymanIndex = 0;
        for (const room of this.rooms) {
            if (room.maintenanceRemainingTicks <= 0) {
                continue;
            }
            room.maintenanceRemainingTicks -= 1;
            if (room.maintenanceRemainingTicks > 0) {
                availableHandymanIds ??= this.availableMaintenanceStaffIds();
            }
            if (room.maintenanceRemainingTicks > 0 && handymanIndex < availableHandymanIds.length) {
                const staffId = availableHandymanIds[handymanIndex];
                handymanIndex += 1;
                room.maintenanceRemainingTicks = Math.max(0, room.maintenanceRemainingTicks - maintenanceStaffRepairBonusTicks());
                this.maintenanceStaffRepairEvents += 1;
                this.emitEvent("handyman-repair", `${staffId}|room:${room.id}`);
            }
            if (room.maintenanceRemainingTicks > 0) {
                continue;
            }
            room.wear = 0;
            room.status = "open";
            this.roomMaintenanceCompleteEvents += 1;
            this.emitEvent("room-maintenance-complete", `${room.id}|${room.roomType}`);
        }
    }
    availableMaintenanceStaffIds() {
        return this.staff
            .filter((staff) => staff.role === "handyman" && staff.status === "active")
            .map((staff) => staff.id)
            .sort((left, right) => left - right);
    }
    creditIncome(amount) {
        if (amount <= 0) {
            return;
        }
        this.cash = clamp(this.cash + amount, CASH_MIN, CASH_MAX);
        this.tickIncome += amount;
        this.totalIncome += amount;
    }
    debitExpense(amount) {
        if (amount <= 0) {
            return;
        }
        this.cash = clamp(this.cash - amount, CASH_MIN, CASH_MAX);
        this.tickExpenses += amount;
        this.totalExpenses += amount;
    }
    applyLoanInterest() {
        const interest = this.loanInterestForOutstanding(this.outstandingLoan);
        if (interest <= 0) {
            return;
        }
        this.debitExpense(interest);
        this.totalLoanInterest += interest;
    }
    progressTreatmentResearch() {
        if (this.activeTreatmentResearchRemainingTicks <= 0) {
            return;
        }
        this.activeTreatmentResearchRemainingTicks = Math.max(0, this.activeTreatmentResearchRemainingTicks - this.treatmentResearchTicksPerTick());
        if (this.activeTreatmentResearchRemainingTicks > 0) {
            return;
        }
        this.treatmentResearchLevel = Math.min(treatmentResearchMaxLevel(), this.treatmentResearchLevel + this.treatmentResearchLevelIncrement);
        this.emitEvent("research-completed", `treatment|level:${this.treatmentResearchLevel}`);
    }
    activeResearcherStaffCount() {
        return this.staff.filter((staff) => staff.role === "diagnostician" && staff.status === "active" && staff.specialties?.includes("researcher")).length;
    }
    treatmentResearchTicksPerTick() {
        return 1 + this.activeResearcherStaffCount();
    }
    progressFinanceAuditCooldown() {
        if (this.financeAuditCooldownRemainingTicks <= 0) {
            return;
        }
        this.financeAuditCooldownRemainingTicks -= 1;
    }
    markEmergencyPatientResolved(patient, outcome) {
        const wave = this.activeEmergencyWave;
        if (!wave || patient.emergencyWaveId !== wave.id) {
            return;
        }
        const resolvedIds = outcome === "treated" ? wave.treatedPatientIds : wave.failedPatientIds;
        if (!resolvedIds.includes(patient.id)) {
            resolvedIds.push(patient.id);
        }
        patient.emergencyWaveId = null;
        this.evaluateEmergencyWaveOutcome();
    }
    evaluateEmergencyWaveOutcome() {
        const wave = this.activeEmergencyWave;
        if (!wave) {
            return;
        }
        const config = wave.config ?? this.emergencyWaveConfig;
        const requiredTreatedPatients = requiredEmergencyTreatmentsForWin(wave.patientIds.length, config.percentToWin);
        if (wave.treatedPatientIds.length >= requiredTreatedPatients) {
            this.finishEmergencyWave("succeeded", `${wave.id}|saved:${wave.treatedPatientIds.length}|required:${requiredTreatedPatients}`);
            return;
        }
        const possibleTreatedPatients = wave.patientIds.length - wave.failedPatientIds.length;
        if (possibleTreatedPatients < requiredTreatedPatients) {
            this.finishEmergencyWave("failed", `${wave.id}|failed:${wave.failedPatientIds.length}|required:${requiredTreatedPatients}`);
        }
    }
    evaluateEmergencyWaveDeadline() {
        const wave = this.activeEmergencyWave;
        if (!wave || this.clock.now() < wave.deadlineTick) {
            return;
        }
        const remainingPatients = wave.patientIds.filter((patientId) => {
            const patient = this.getPatientById(patientId);
            return patient?.emergencyWaveId === wave.id;
        }).length;
        const config = wave.config ?? this.emergencyWaveConfig;
        const requiredTreatedPatients = requiredEmergencyTreatmentsForWin(wave.patientIds.length, config.percentToWin);
        if (wave.treatedPatientIds.length >= requiredTreatedPatients) {
            this.finishEmergencyWave("succeeded", `${wave.id}|saved:${wave.treatedPatientIds.length}|required:${requiredTreatedPatients}|timeout`);
            return;
        }
        if (remainingPatients > 0) {
            this.finishEmergencyWave("failed", `${wave.id}|timeout:${remainingPatients}|required:${requiredTreatedPatients}`);
        }
    }
    finishEmergencyWave(outcome, payload) {
        const wave = this.activeEmergencyWave;
        if (!wave) {
            return false;
        }
        for (const patient of this.waitingPatients) {
            if (patient.emergencyWaveId === wave.id) {
                patient.emergencyWaveId = null;
            }
        }
        this.activeEmergencyWave = null;
        if (outcome === "succeeded") {
            const config = wave.config ?? this.emergencyWaveConfig;
            this.totalEmergencySuccesses += 1;
            this.creditIncome(config.rewardCash);
            this.reputation = clamp(this.reputation + config.rewardReputation, REPUTATION_MIN, REPUTATION_MAX);
            this.emitEvent("emergency-succeeded", payload);
            return true;
        }
        this.totalEmergencyFailures += 1;
        this.emitEvent("emergency-failed", payload);
        return true;
    }
    markEpidemicPatientResolved(patient, outcome) {
        const outbreak = this.activeEpidemicOutbreak;
        if (!outbreak || patient.epidemicOutbreakId !== outbreak.id) {
            return;
        }
        const resolvedIds = outcome === "treated" ? outbreak.treatedPatientIds : outbreak.failedPatientIds;
        if (!resolvedIds.includes(patient.id)) {
            resolvedIds.push(patient.id);
        }
        patient.epidemicOutbreakId = null;
        this.evaluateEpidemicOutbreakOutcome();
    }
    evaluateEpidemicOutbreakOutcome() {
        const outbreak = this.activeEpidemicOutbreak;
        if (!outbreak) {
            return;
        }
        if (outbreak.failedPatientIds.length > 0) {
            this.finishEpidemicOutbreak("failed", `${outbreak.id}|failed:${outbreak.failedPatientIds.length}`);
            return;
        }
        if (outbreak.patientIds.length > 0 && outbreak.treatedPatientIds.length >= outbreak.patientIds.length) {
            this.finishEpidemicOutbreak("contained", `${outbreak.id}|contained:${outbreak.treatedPatientIds.length}`);
        }
    }
    progressEpidemicOutbreakSpread() {
        const outbreak = this.activeEpidemicOutbreak;
        const config = this.epidemicOutbreakConfig;
        if (!outbreak ||
            outbreak.nextSpreadTick === null ||
            this.clock.now() < outbreak.nextSpreadTick ||
            this.clock.now() >= outbreak.deadlineTick ||
            outbreak.spreadPatientIds.length >= config.maxSpreadPatients) {
            return;
        }
        if (!this.shouldEpidemicSpreadThisTick(outbreak)) {
            outbreak.nextSpreadTick = this.clock.now() + this.epidemicSpreadIntervalTicksForOutbreak(outbreak);
            return;
        }
        const patientId = this.admitPatient(config.severity, undefined, { epidemicOutbreakId: outbreak.id });
        if (patientId !== null) {
            outbreak.patientIds.push(patientId);
            outbreak.spreadPatientIds.push(patientId);
            this.totalEpidemicSpreadPatients += 1;
            this.emitEvent("epidemic-spread", `${outbreak.id}|patient:${patientId}|spread:${outbreak.spreadPatientIds.length}`);
        }
        outbreak.nextSpreadTick =
            outbreak.spreadPatientIds.length >= config.maxSpreadPatients
                ? null
                : this.clock.now() + this.epidemicSpreadIntervalTicksForOutbreak(outbreak);
    }
    shouldEpidemicSpreadThisTick(outbreak) {
        const chance = this.epidemicOutbreakConfig.spreadChancePercent;
        if (chance >= 100) {
            return true;
        }
        if (chance <= 0) {
            return false;
        }
        const roll = (this.clock.now() * 31 + outbreak.id * 17 + outbreak.spreadPatientIds.length * 13) % 100;
        return roll < chance;
    }
    epidemicSpreadIntervalTicksForOutbreak(outbreak) {
        const baseInterval = this.epidemicOutbreakConfig.spreadIntervalTicks;
        if (!this.isEpidemicSpreadSlowdownActive(outbreak)) {
            return baseInterval;
        }
        const rate = this.epidemicOutbreakConfig.spreadSlowdownRatePercent ?? 0;
        return Math.max(1, baseInterval + Math.ceil(baseInterval * rate / 100));
    }
    isEpidemicSpreadSlowdownActive(outbreak) {
        const rate = this.epidemicOutbreakConfig.spreadSlowdownRatePercent ?? 0;
        if (rate <= 0) {
            return false;
        }
        const patientCount = this.epidemicOutbreakConfig.spreadSlowdownPatientCount ?? 0;
        if (patientCount > 0 && outbreak.treatedPatientIds.length >= patientCount) {
            return true;
        }
        const ticks = this.epidemicOutbreakConfig.spreadSlowdownTicks ?? 0;
        return ticks > 0 && this.clock.now() - outbreak.startTick >= ticks;
    }
    evaluateEpidemicOutbreakDeadline() {
        const outbreak = this.activeEpidemicOutbreak;
        if (!outbreak || this.clock.now() < outbreak.deadlineTick) {
            return;
        }
        const remainingPatients = outbreak.patientIds.filter((patientId) => {
            const patient = this.getPatientById(patientId);
            return patient?.epidemicOutbreakId === outbreak.id;
        }).length;
        if (remainingPatients > 0) {
            this.finishEpidemicOutbreak("failed", `${outbreak.id}|timeout:${remainingPatients}`);
        }
    }
    finishEpidemicOutbreak(outcome, payload) {
        const outbreak = this.activeEpidemicOutbreak;
        if (!outbreak) {
            return false;
        }
        for (const patient of this.waitingPatients) {
            if (patient.epidemicOutbreakId === outbreak.id) {
                patient.epidemicOutbreakId = null;
            }
        }
        this.activeEpidemicOutbreak = null;
        if (outcome === "contained") {
            this.totalEpidemicContained += 1;
            this.creditIncome(outbreak.rewardCash ?? this.epidemicOutbreakConfig.rewardCash);
            this.reputation = clamp(this.reputation + this.epidemicOutbreakConfig.rewardReputation, REPUTATION_MIN, REPUTATION_MAX);
            this.emitEvent("epidemic-contained", payload);
            return true;
        }
        this.totalEpidemicFailed += 1;
        this.debitExpense(this.epidemicOutbreakConfig.penaltyCash);
        this.reputation = clamp(this.reputation - this.epidemicOutbreakConfig.penaltyReputation, REPUTATION_MIN, REPUTATION_MAX);
        this.emitEvent("epidemic-failed", payload);
        return true;
    }
    markInsuranceContractPatientResolved(patient, outcome) {
        const contract = this.activeInsuranceContract;
        if (!contract || patient.insuranceContractId !== contract.id) {
            return;
        }
        const resolvedIds = outcome === "treated" ? contract.completedPatientIds : contract.failedPatientIds;
        if (!resolvedIds.includes(patient.id)) {
            resolvedIds.push(patient.id);
        }
        patient.insuranceContractId = null;
        this.evaluateInsuranceContractOutcome();
    }
    evaluateInsuranceContractOutcome() {
        const contract = this.activeInsuranceContract;
        if (!contract) {
            return;
        }
        if (contract.failedPatientIds.length > 0) {
            this.finishInsuranceContract("failed", `${contract.id}|failed:${contract.failedPatientIds.length}`);
            return;
        }
        if (contract.patientIds.length > 0 && contract.completedPatientIds.length >= contract.patientIds.length) {
            this.finishInsuranceContract("completed", `${contract.id}|completed:${contract.completedPatientIds.length}`);
        }
    }
    evaluateInsuranceContractDeadline() {
        const contract = this.activeInsuranceContract;
        if (!contract || this.clock.now() < contract.deadlineTick) {
            return;
        }
        const remainingPatients = contract.patientIds.filter((patientId) => {
            const patient = this.getPatientById(patientId);
            return patient?.insuranceContractId === contract.id;
        }).length;
        if (remainingPatients > 0) {
            this.finishInsuranceContract("failed", `${contract.id}|timeout:${remainingPatients}`);
        }
    }
    finishInsuranceContract(outcome, payload) {
        const contract = this.activeInsuranceContract;
        if (!contract) {
            return false;
        }
        for (const patient of this.waitingPatients) {
            if (patient.insuranceContractId === contract.id) {
                patient.insuranceContractId = null;
            }
        }
        this.activeInsuranceContract = null;
        if (outcome === "completed") {
            this.totalInsuranceCompleted += 1;
            this.creditIncome(insuranceContractCashReward());
            this.totalInsuranceCashRewards += insuranceContractCashReward();
            this.reputation = clamp(this.reputation + insuranceContractReputationReward(), REPUTATION_MIN, REPUTATION_MAX);
            this.totalInsuranceReputationRewards += insuranceContractReputationReward();
            this.emitEvent("insurance-contract-completed", payload);
            return true;
        }
        this.totalInsuranceFailed += 1;
        this.debitExpense(insuranceContractCashPenalty());
        this.reputation = clamp(this.reputation - insuranceContractReputationPenalty(), REPUTATION_MIN, REPUTATION_MAX);
        this.emitEvent("insurance-contract-failed", payload);
        return true;
    }
    evaluateVipInspectionDeadline() {
        const inspection = this.activeVipInspection;
        if (!inspection || this.clock.now() < inspection.deadlineTick) {
            return;
        }
        const state = this.getState();
        const queuePressure = state.vipInspection.currentQueuePressure;
        const openRooms = state.vipInspection.currentOpenRooms;
        const noNewDeaths = this.totalPatientDeaths === inspection.startingDeaths;
        const passed = queuePressure <= vipInspectionMaxQueuePressure() &&
            this.reputation >= vipInspectionMinReputation() &&
            openRooms >= 2 &&
            noNewDeaths;
        this.activeVipInspection = null;
        if (passed) {
            this.totalVipInspectionPasses += 1;
            this.creditIncome(vipInspectionRewardCash());
            this.reputation = clamp(this.reputation + vipInspectionRewardReputation(), REPUTATION_MIN, REPUTATION_MAX);
            this.emitEvent("vip-inspection-passed", `${inspection.id}|queue:${queuePressure}|rooms:${openRooms}`);
            return;
        }
        this.totalVipInspectionFailures += 1;
        this.debitExpense(vipInspectionPenaltyCash());
        this.reputation = clamp(this.reputation - vipInspectionPenaltyReputation(), REPUTATION_MIN, REPUTATION_MAX);
        this.emitEvent("vip-inspection-failed", `${inspection.id}|queue:${queuePressure}|rooms:${openRooms}|deaths:${this.totalPatientDeaths - inspection.startingDeaths}`);
    }
    canAffordPurchase(amount) {
        return amount <= 0 || this.cash >= amount;
    }
    debitPurchase(amount) {
        if (amount <= 0) {
            return;
        }
        this.cash = clamp(this.cash - amount, CASH_MIN, CASH_MAX);
        this.totalExpenses += amount;
    }
    creditPurchaseRefund(amount) {
        if (amount <= 0) {
            return;
        }
        this.cash = clamp(this.cash + amount, CASH_MIN, CASH_MAX);
        this.totalIncome += amount;
    }
    emitCashflowTransitionEvent() {
        const tickNet = this.tickIncome - this.tickExpenses;
        const nextPolarity = tickNet < 0 ? "negative" : "non-negative";
        if (nextPolarity === "negative" && this.cashflowPolarity !== "negative") {
            this.emitEvent("cashflow-negative", String(tickNet));
        }
        else if (nextPolarity === "non-negative" && this.cashflowPolarity === "negative") {
            this.emitEvent("cashflow-positive", String(tickNet));
        }
        this.cashflowPolarity = nextPolarity;
    }
    emitEvent(type, payload) {
        this.recentEvents.push({
            id: this.nextEventId,
            tick: this.clock.now(),
            type,
            payload
        });
        this.nextEventId += 1;
        this.totalEventsEmitted += 1;
        this.lastTickEvents += 1;
        if (this.recentEvents.length > MAX_RECENT_EVENTS) {
            this.recentEvents.shift();
        }
    }
    getPatientById(patientId) {
        return this.waitingPatients.find((patient) => patient.id === patientId);
    }
    getStaffById(staffId) {
        return this.staff.find((staff) => staff.id === staffId);
    }
    getRoomById(roomId) {
        return this.rooms.find((room) => room.id === roomId);
    }
}
