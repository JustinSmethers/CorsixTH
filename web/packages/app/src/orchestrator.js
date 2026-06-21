import { DeterministicSimulation } from "@corsixth/core";
import { treatmentRoomTypeForDisease } from "@corsixth/rules";
const DEFAULT_TICK_RATE_HZ = 4;
const DEFAULT_POINTER_TILE_SIZE = 16;
const DEFAULT_LEVEL_OBJECTIVE = {
    requiredDischarges: 3,
    minimumCash: 0,
    minimumReputation: 1,
    minimumTreatmentPercentage: 0,
    minimumHospitalValue: 0,
    bankruptcyCashThreshold: 0,
    reputationFailureThreshold: 0,
    maximumDeaths: Number.POSITIVE_INFINITY
};
const DEFAULT_SPEED_MULTIPLIER = 1;
const ALLOWED_SPEED_MULTIPLIERS = [0.5, 1, 2, 4, 8];
const DEFAULT_ADMISSION_POLICY = "standard";
const ALLOWED_ADMISSION_POLICIES = ["conservative", "standard", "aggressive"];
const AUTO_ADMISSION_INTERVAL_TICKS = 16;
const AUTO_ADMISSION_WAITING_CAP = 8;
const SCENARIO_MONTH_TICKS = 64;
const SCENARIO_YEAR_TICKS = SCENARIO_MONTH_TICKS * 12;
const DEFAULT_RESEARCH_PROJECT_TICKS = 6;
const BASE_AVAILABLE_ROOM_TYPES = ["diagnosis", "treatment"];
const ALLOWED_ROOM_TYPES = ["diagnosis", "cardiogram", "scanner", "ultrascan", "blood-machine", "x-ray", "general-diagnosis", "treatment", "ward", "pharmacy", "operating-theatre", "specialist", "psychiatry", "inflation-room", "slack-tongue-clinic", "fracture-clinic", "hair-restoration", "jelly-vat", "decontamination", "electrolysis", "dna-fixer"];
const ALLOWED_STAFF_ROLES = ["diagnostician", "nurse", "handyman", "receptionist"];
const LOST_LEVEL_DISPATCH_BLOCK_EVENTS = new Map([
    ["admissions-toggle", ["admissions.blocked"]],
    ["admission-policy-set", ["admission-policy.blocked"]],
    ["pricing-policy-set", ["pricing-policy.unchanged"]],
    ["take-loan", ["loan.take-blocked"]],
    ["repay-loan", ["loan.repay-blocked"]],
    ["run-finance-audit", ["finance.audit-blocked"]],
    ["run-marketing-campaign", ["marketing.blocked"]],
    ["start-insurance-contract", ["insurance.blocked"]],
    ["run-awards-ceremony", ["awards.blocked"]],
    ["start-research", ["research.blocked"]],
    ["start-emergency-wave", ["emergency.blocked"]],
    ["start-epidemic-outbreak", ["epidemic.blocked"]],
    ["train-staff", ["training.blocked"]],
    ["start-vip-inspection", ["vip.blocked"]],
    ["shoot-rat", ["rat.blocked"]],
    ["water-plant", ["plant.blocked"]],
    ["step-tick", []],
    ["treat-patient", ["patient.treated.empty"]],
    ["send-patient-home", ["patient.send-home-empty"]],
    ["prioritize-patient", ["patient.prioritize-empty"]],
    ["give-patient-drink", ["patient.drink-blocked"]],
    ["send-patient-toilet", ["patient.toilet-blocked"]],
    ["staff-break-toggle", ["staff.break-blocked"]],
    ["treatment-room-toggle", ["treatment-room.toggle-blocked"]],
    ["fire-staff", ["staff.fire-blocked"]],
    ["sell-room", ["room.sell-blocked"]],
    ["sell-object", ["object.sell-blocked"]],
    ["repair-room", ["room.repair-blocked"]],
    ["move-staff", ["staff.move-blocked"]],
    ["rest-staff", ["staff.rest-blocked"]],
    ["build-room", ["room.build-blocked"]],
    ["place-object", ["object.place-blocked"]],
    ["hire-staff", ["staff.hire-blocked"]],
    ["admit-patient", ["patient.admit-blocked"]]
]);
const SCENARIO_DISEASE_REQUIRED_OBJECTS = new Map([
    ["cranial-pressure", [9]],
    ["alien-dna", [23]],
    ["fractured-bones", [24]],
    ["baldness", [25]],
    ["slack-tongue", [26]],
    ["spare-ribs", [30]],
    ["kidney-beans", [30]],
    ["golf-stones", [30]],
    ["unexpected-swelling", [30]],
    ["broken-heart", [30]],
    ["iron-lungs", [30]],
    ["pregnancy", [30]],
    ["ruptured-nodules", [30]],
    ["gastric-grumble", [39]],
    ["sleepy-bones", [39]],
    ["gut-rot", [39]],
    ["broken-wind", [39]],
    ["gastric-ejections", [39]],
    ["chronic-nosehair", [39]],
    ["hairyitis", [46]],
    ["jellyitis", [47]],
    ["radiation", [54]]
]);
function scenarioTreatmentRoomTypeForDisease(diseaseId) {
    return treatmentRoomTypeForDisease(diseaseId);
}
function assertFinitePositive(value, label) {
    if (!Number.isFinite(value) || value <= 0) {
        throw new Error(`${label} must be a finite positive number`);
    }
}
function assertFiniteNonNegative(value, label) {
    if (!Number.isFinite(value) || value < 0) {
        throw new Error(`${label} must be a finite non-negative number`);
    }
}
function normalizeSpeedMultiplier(value = DEFAULT_SPEED_MULTIPLIER) {
    if (!ALLOWED_SPEED_MULTIPLIERS.includes(value)) {
        throw new Error(`speedMultiplier must be one of ${ALLOWED_SPEED_MULTIPLIERS.join(", ")}`);
    }
    return value;
}
function normalizeAdmissionPolicy(value = DEFAULT_ADMISSION_POLICY) {
    if (!ALLOWED_ADMISSION_POLICIES.includes(value)) {
        throw new Error(`admissionPolicy must be one of ${ALLOWED_ADMISSION_POLICIES.join(", ")}`);
    }
    return value;
}
function normalizePopulationSchedule(schedule = []) {
    if (schedule === undefined) {
        return [];
    }
    if (!Array.isArray(schedule)) {
        throw new Error("populationSchedule must be an array");
    }
    return schedule
        .map((entry, index) => {
        if (!Number.isInteger(entry.month) || entry.month < 0) {
            throw new Error(`populationSchedule[${index}].month must be a non-negative integer`);
        }
        if (!Number.isInteger(entry.change)) {
            throw new Error(`populationSchedule[${index}].change must be an integer`);
        }
        return {
            index: Number.isInteger(entry.index) ? entry.index : index,
            month: entry.month,
            change: entry.change
        };
    })
        .sort((left, right) => left.month - right.month || left.index - right.index);
}
function normalizeDiseasePool(diseasePool = []) {
    if (diseasePool === undefined) {
        return [];
    }
    if (!Array.isArray(diseasePool)) {
        throw new Error("diseasePool must be an array");
    }
    return diseasePool.map((entry, index) => {
        if (typeof entry.diseaseId !== "string" || entry.diseaseId.length === 0) {
            throw new Error(`diseasePool[${index}].diseaseId must be a non-empty string`);
        }
        if (![1, 2, 3].includes(entry.severity)) {
            throw new Error(`diseasePool[${index}].severity must be 1, 2, or 3`);
        }
        return {
            ...(Number.isInteger(entry.index) ? { index: entry.index } : {}),
            source: typeof entry.source === "string" ? entry.source : "scenario",
            token: typeof entry.token === "string" ? entry.token : entry.diseaseId,
            diseaseId: entry.diseaseId,
            severity: entry.severity,
            weight: Number.isInteger(entry.weight) && entry.weight > 0 ? entry.weight : 1,
            ...(Number.isInteger(entry.startPrice) && entry.startPrice >= 0 ? { startPrice: entry.startPrice } : {}),
            ...(Number.isInteger(entry.availableMonth) && entry.availableMonth >= 0 ? { availableMonth: entry.availableMonth } : {})
        };
    });
}
function normalizeStaffMarketSchedule(schedule = []) {
    if (schedule === undefined) {
        return [];
    }
    if (!Array.isArray(schedule)) {
        throw new Error("staffMarketSchedule must be an array");
    }
    return schedule
        .map((entry, index) => {
        if (!Number.isInteger(entry.month) || entry.month < 0) {
            throw new Error(`staffMarketSchedule[${index}].month must be a non-negative integer`);
        }
        return {
            index: Number.isInteger(entry.index) ? entry.index : index,
            month: entry.month,
            nurses: normalizeStaffMarketCount(entry.nurses, `staffMarketSchedule[${index}].nurses`),
            doctors: normalizeStaffMarketCount(entry.doctors, `staffMarketSchedule[${index}].doctors`),
            handymen: normalizeStaffMarketCount(entry.handymen, `staffMarketSchedule[${index}].handymen`),
            receptionists: normalizeStaffMarketCount(entry.receptionists, `staffMarketSchedule[${index}].receptionists`),
            ...(entry.seed !== undefined ? { seed: normalizeStaffMarketCount(entry.seed, `staffMarketSchedule[${index}].seed`) } : {}),
            ...normalizeStaffMarketRates(entry, index)
        };
    })
        .sort((left, right) => left.month - right.month || left.index - right.index);
}
function normalizeStaffMarketRates(entry, index) {
    const normalized = {};
    for (const key of ["shrinkRate", "surgeonRate", "researcherRate", "consultantRate", "juniorRate"]) {
        if (entry[key] === undefined) {
            continue;
        }
        normalized[key] = normalizeStaffMarketCount(entry[key], `staffMarketSchedule[${index}].${key}`);
    }
    return normalized;
}
function normalizeStaffMarketCount(value, label) {
    if (!Number.isInteger(value) || value < 0) {
        throw new Error(`${label} must be a non-negative integer`);
    }
    return value;
}
function normalizeRoomAvailability(roomAvailability) {
    if (roomAvailability === undefined) {
        return null;
    }
    if (!Array.isArray(roomAvailability)) {
        throw new Error("roomAvailability must be an array");
    }
    const normalized = [...BASE_AVAILABLE_ROOM_TYPES];
    for (const roomType of roomAvailability) {
        if (!ALLOWED_ROOM_TYPES.includes(roomType)) {
            throw new Error(`roomAvailability contains unsupported room type: ${roomType}`);
        }
        if (!normalized.includes(roomType)) {
            normalized.push(roomType);
        }
    }
    return normalized;
}
function normalizeRoomAvailabilitySchedule(schedule = []) {
    if (schedule === undefined) {
        return [];
    }
    if (!Array.isArray(schedule)) {
        throw new Error("roomAvailabilitySchedule must be an array");
    }
    return schedule
        .map((entry, index) => {
        if (!ALLOWED_ROOM_TYPES.includes(entry.roomType)) {
            throw new Error(`roomAvailabilitySchedule[${index}].roomType must be a supported room type`);
        }
        if (!Number.isInteger(entry.whenAvailable) || entry.whenAvailable < 0) {
            throw new Error(`roomAvailabilitySchedule[${index}].whenAvailable must be a non-negative integer`);
        }
        return {
            index: Number.isInteger(entry.index) ? entry.index : index,
            roomType: entry.roomType,
            startAvailable: entry.startAvailable === true,
            whenAvailable: entry.whenAvailable,
            availableForLevel: entry.availableForLevel !== false,
            ...(Number.isInteger(entry.researchRequired) && entry.researchRequired > 0 ? { researchRequired: entry.researchRequired } : {}),
            ...(typeof entry.expertiseCategory === "string" && entry.expertiseCategory.length > 0 ? { expertiseCategory: entry.expertiseCategory } : {})
        };
    })
        .sort((left, right) => left.whenAvailable - right.whenAvailable || left.index - right.index);
}
function normalizeObjectAvailability(availability = []) {
    if (availability === undefined) {
        return [];
    }
    if (!Array.isArray(availability)) {
        throw new Error("objectAvailability must be an array");
    }
    return availability
        .map((entry, index) => {
        if (!Number.isInteger(entry.index) || entry.index < 0) {
            throw new Error(`objectAvailability[${index}].index must be a non-negative integer`);
        }
        const normalized = {
            index: entry.index,
            startAvailable: entry.startAvailable === true,
            whenAvailable: Number.isInteger(entry.whenAvailable) && entry.whenAvailable >= 0 ? entry.whenAvailable : 0,
            availableForLevel: entry.availableForLevel !== false
        };
        if (entry.startCost !== undefined) {
            if (!Number.isInteger(entry.startCost) || entry.startCost < 0) {
                throw new Error(`objectAvailability[${index}].startCost must be a non-negative integer`);
            }
            normalized.startCost = entry.startCost;
        }
        if (entry.startStrength !== undefined) {
            if (!Number.isInteger(entry.startStrength) || entry.startStrength < 0) {
                throw new Error(`objectAvailability[${index}].startStrength must be a non-negative integer`);
            }
            normalized.startStrength = entry.startStrength;
        }
        if (typeof entry.roomType === "string" && entry.roomType.length > 0) {
            if (!ALLOWED_ROOM_TYPES.includes(entry.roomType)) {
                throw new Error(`objectAvailability[${index}].roomType must be a supported room type`);
            }
            normalized.roomType = entry.roomType;
        }
        if (typeof entry.name === "string" && entry.name.length > 0) {
            normalized.name = entry.name;
        }
        if (Number.isInteger(entry.researchRequired) && entry.researchRequired > 0) {
            normalized.researchRequired = entry.researchRequired;
        }
        if (typeof entry.expertiseCategory === "string" && entry.expertiseCategory.length > 0) {
            normalized.expertiseCategory = entry.expertiseCategory;
        }
        return normalized;
    })
        .sort((left, right) => left.index - right.index);
}
function normalizeRoomCostOverrides(value = {}) {
    if (value === undefined) {
        return {};
    }
    if (typeof value !== "object" || value === null || Array.isArray(value)) {
        throw new Error("roomCostOverrides must be an object");
    }
    const normalized = {};
    for (const roomType of ALLOWED_ROOM_TYPES) {
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
    if (typeof value !== "object" || value === null || Array.isArray(value)) {
        throw new Error("roomWearThresholdOverrides must be an object");
    }
    const normalized = {};
    for (const roomType of ALLOWED_ROOM_TYPES) {
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
function normalizeStaffWageOverrides(value = {}) {
    if (value === undefined) {
        return {};
    }
    if (typeof value !== "object" || value === null || Array.isArray(value)) {
        throw new Error("staffWageOverrides must be an object");
    }
    const normalized = {};
    for (const role of ALLOWED_STAFF_ROLES) {
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
function normalizeLoanInterestPerChunk(value) {
    if (value === undefined || value === null) {
        return null;
    }
    if (!Number.isInteger(value) || value < 0) {
        throw new Error("loanInterestPerChunk must be a non-negative integer");
    }
    return value;
}
function normalizeScenarioLevelName(value) {
    if (value === undefined || value === null) {
        return null;
    }
    if (typeof value !== "string") {
        throw new Error("scenarioLevelName must be a string");
    }
    const trimmed = value.trim();
    return trimmed.length > 0 ? trimmed : null;
}
function normalizeScenarioIllnessRate(value) {
    if (value === undefined || value === null) {
        return null;
    }
    if (!Number.isInteger(value) || value < 0) {
        throw new Error("scenarioIllnessRate must be a non-negative integer");
    }
    return value;
}
function normalizeQuakeSchedule(schedule = []) {
    if (schedule === undefined) {
        return [];
    }
    if (!Array.isArray(schedule)) {
        throw new Error("quakeSchedule must be an array");
    }
    return schedule
        .map((entry, index) => {
        if (!Number.isInteger(entry.startMonth) || entry.startMonth < 0) {
            throw new Error(`quakeSchedule[${index}].startMonth must be a non-negative integer`);
        }
        if (!Number.isInteger(entry.endMonth) || entry.endMonth < 0) {
            throw new Error(`quakeSchedule[${index}].endMonth must be a non-negative integer`);
        }
        if (!Number.isInteger(entry.severity) || entry.severity < 0 || entry.severity > 99) {
            throw new Error(`quakeSchedule[${index}].severity must be an integer from 0 to 99`);
        }
        return {
            index: Number.isInteger(entry.index) ? entry.index : index,
            startMonth: entry.startMonth,
            endMonth: entry.endMonth,
            severity: entry.severity
        };
    })
        .sort((left, right) => left.startMonth - right.startMonth || left.index - right.index);
}
function normalizeAdmissionRules(admissionRules = {}) {
    if (admissionRules === undefined) {
        return {};
    }
    const normalized = {};
    if (admissionRules.holdVisualMonths !== undefined) {
        if (!Number.isInteger(admissionRules.holdVisualMonths) || admissionRules.holdVisualMonths < 0) {
            throw new Error("admissionRules.holdVisualMonths must be a non-negative integer");
        }
        normalized.holdVisualMonths = admissionRules.holdVisualMonths;
    }
    if (admissionRules.holdVisualPeepCount !== undefined) {
        if (!Number.isInteger(admissionRules.holdVisualPeepCount) || admissionRules.holdVisualPeepCount < 0) {
            throw new Error("admissionRules.holdVisualPeepCount must be a non-negative integer");
        }
        normalized.holdVisualPeepCount = admissionRules.holdVisualPeepCount;
    }
    return normalized;
}
function normalizeResearchSettings(researchSettings = {}) {
    if (researchSettings === undefined) {
        return {};
    }
    const normalized = {};
    if (researchSettings.startRating !== undefined) {
        if (!Number.isInteger(researchSettings.startRating) || researchSettings.startRating < 0) {
            throw new Error("researchSettings.startRating must be a non-negative integer");
        }
        normalized.startRating = researchSettings.startRating;
    }
    if (researchSettings.researchPointsDivisor !== undefined) {
        if (!Number.isInteger(researchSettings.researchPointsDivisor) || researchSettings.researchPointsDivisor <= 0) {
            throw new Error("researchSettings.researchPointsDivisor must be a positive integer");
        }
        normalized.researchPointsDivisor = researchSettings.researchPointsDivisor;
    }
    if (researchSettings.startCost !== undefined) {
        if (!Number.isInteger(researchSettings.startCost) || researchSettings.startCost < 0) {
            throw new Error("researchSettings.startCost must be a non-negative integer");
        }
        normalized.startCost = researchSettings.startCost;
    }
    if (researchSettings.minDrugCost !== undefined) {
        if (!Number.isInteger(researchSettings.minDrugCost) || researchSettings.minDrugCost < 0) {
            throw new Error("researchSettings.minDrugCost must be a non-negative integer");
        }
        normalized.minDrugCost = researchSettings.minDrugCost;
    }
    if (researchSettings.drugImproveRate !== undefined) {
        if (!Number.isInteger(researchSettings.drugImproveRate) || researchSettings.drugImproveRate <= 0) {
            throw new Error("researchSettings.drugImproveRate must be a positive integer");
        }
        normalized.drugImproveRate = researchSettings.drugImproveRate;
    }
    for (const key of ["maxObjectStrength", "researchIncrement", "researchImproveCostPercent", "researchImproveIncrementPercent"]) {
        if (researchSettings[key] === undefined) {
            continue;
        }
        if (!Number.isInteger(researchSettings[key]) || researchSettings[key] <= 0) {
            throw new Error(`researchSettings.${key} must be a positive integer`);
        }
        normalized[key] = researchSettings[key];
    }
    return normalized;
}
function normalizeTrainingSettings(trainingSettings = {}) {
    if (trainingSettings === undefined) {
        return {};
    }
    const normalized = {};
    if (trainingSettings.trainingRate !== undefined) {
        if (!Number.isInteger(trainingSettings.trainingRate) || trainingSettings.trainingRate <= 0) {
            throw new Error("trainingSettings.trainingRate must be a positive integer");
        }
        normalized.trainingRate = trainingSettings.trainingRate;
    }
    if (trainingSettings.trainingValues !== undefined) {
        if (!Array.isArray(trainingSettings.trainingValues)) {
            throw new Error("trainingSettings.trainingValues must be an array");
        }
        normalized.trainingValues = trainingSettings.trainingValues.map((entry, index) => {
            if (!Number.isInteger(entry.index) || entry.index < 0) {
                throw new Error(`trainingSettings.trainingValues[${index}].index must be a non-negative integer`);
            }
            if (!Number.isInteger(entry.value) || entry.value < 0) {
                throw new Error(`trainingSettings.trainingValues[${index}].value must be a non-negative integer`);
            }
            return {
                index: entry.index,
                value: entry.value,
                ...(typeof entry.name === "string" && entry.name.length > 0 ? { name: entry.name } : {})
            };
        });
    }
    for (const key of ["promotionDoctorMonths", "promotionConsultantMonths", "doctorThreshold", "consultantThreshold"]) {
        if (trainingSettings[key] === undefined) {
            continue;
        }
        if (!Number.isInteger(trainingSettings[key]) || trainingSettings[key] <= 0) {
            throw new Error(`trainingSettings.${key} must be a positive integer`);
        }
        normalized[key] = trainingSettings[key];
    }
    if (trainingSettings.abilityThresholds !== undefined) {
        if (!Array.isArray(trainingSettings.abilityThresholds)) {
            throw new Error("trainingSettings.abilityThresholds must be an array");
        }
        normalized.abilityThresholds = trainingSettings.abilityThresholds.map((entry, index) => {
            if (!Number.isInteger(entry.index) || entry.index < 0) {
                throw new Error(`trainingSettings.abilityThresholds[${index}].index must be a non-negative integer`);
            }
            if (!Number.isInteger(entry.value) || entry.value < 0) {
                throw new Error(`trainingSettings.abilityThresholds[${index}].value must be a non-negative integer`);
            }
            return {
                index: entry.index,
                value: entry.value,
                ...(typeof entry.name === "string" && entry.name.length > 0 ? { name: entry.name } : {})
            };
        });
    }
    return normalized;
}
function staffSpecialtyForAbilityThresholdName(name) {
    const normalizedName = String(name ?? "").trim().toUpperCase();
    if (normalizedName === "SURGEON") {
        return "surgeon";
    }
    if (normalizedName === "PSYCHO" || normalizedName === "PSYCHIATRIST") {
        return "psychiatrist";
    }
    if (normalizedName === "RESEARCHER") {
        return "researcher";
    }
    return null;
}
function normalizeEpidemicSettings(epidemicSettings = {}) {
    if (epidemicSettings === undefined) {
        return {};
    }
    const normalized = {};
    for (const [key, value] of Object.entries(epidemicSettings)) {
        if (!["howContagious", "contagiousSpreadFactor", "reduceContagiousMonths", "reduceContagiousPeepCount", "reduceContagiousRate", "fine", "compensationLow", "compensationHigh"].includes(key)) {
            throw new Error(`epidemicSettings.${key} is not supported`);
        }
        if (!Number.isInteger(value) || value < (key === "howContagious" ? 1 : 0)) {
            throw new Error(`epidemicSettings.${key} must be a ${key === "howContagious" ? "positive" : "non-negative"} integer`);
        }
        normalized[key] = value;
    }
    return normalized;
}
function normalizeLandSettings(landSettings = {}) {
    if (landSettings === undefined) {
        return {};
    }
    const normalized = {};
    if (landSettings.landCostPerTile !== undefined) {
        if (!Number.isInteger(landSettings.landCostPerTile) || landSettings.landCostPerTile < 0) {
            throw new Error("landSettings.landCostPerTile must be a non-negative integer");
        }
        normalized.landCostPerTile = landSettings.landCostPerTile;
    }
    return normalized;
}
function normalizeStaffFatigueSettings(staffFatigueSettings = {}) {
    if (staffFatigueSettings === undefined) {
        return {};
    }
    const normalized = {};
    for (const [key, value] of Object.entries(staffFatigueSettings)) {
        if (!["restStanding", "restSofa", "restGame", "restSnooker", "workLight", "modifyFrequency", "notTired", "tired", "veryTired", "crackUpTired", "recoveryFactor", "recoveryMinimum", "resignMax"].includes(key)) {
            throw new Error(`staffFatigueSettings.${key} is not supported`);
        }
        if (!Number.isInteger(value) || value < 0) {
            throw new Error(`staffFatigueSettings.${key} must be a non-negative integer`);
        }
        normalized[key] = value;
    }
    return normalized;
}
function normalizePatientBehaviorSettings(patientBehaviorSettings = {}) {
    if (patientBehaviorSettings === undefined) {
        return {};
    }
    const normalized = {};
    for (const [key, value] of Object.entries(patientBehaviorSettings)) {
        if (!["litterDrop", "leaveMax", "happy", "unhappy", "veryUnhappy", "drinkHappy", "toiletHappy", "bowelFull", "bowelOverflows", "vomitLimit", "litterRandom"].includes(key)) {
            throw new Error(`patientBehaviorSettings.${key} is not supported`);
        }
        if (!Number.isInteger(value) || value < 0) {
            throw new Error(`patientBehaviorSettings.${key} must be a non-negative integer`);
        }
        normalized[key] = value;
    }
    return normalized;
}
function normalizeSalarySettings(salarySettings = {}) {
    if (salarySettings === undefined) {
        return {};
    }
    const normalized = {};
    for (const [key, value] of Object.entries(salarySettings)) {
        if (!["salaryAdds", "salaryAbilityDivisor", "salaryTooLow", "salaryTooHigh"].includes(key)) {
            throw new Error(`salarySettings.${key} is not supported`);
        }
        if (key === "salaryAdds") {
            if (!Array.isArray(value)) {
                throw new Error("salarySettings.salaryAdds must be an array");
            }
            normalized.salaryAdds = value.map((entry, index) => {
                if (!Number.isInteger(entry.index) || entry.index < 0) {
                    throw new Error(`salarySettings.salaryAdds[${index}].index must be a non-negative integer`);
                }
                if (!Number.isInteger(entry.value)) {
                    throw new Error(`salarySettings.salaryAdds[${index}].value must be an integer`);
                }
                return {
                    index: entry.index,
                    value: entry.value,
                    ...(typeof entry.name === "string" && entry.name.length > 0 ? { name: entry.name } : {})
                };
            });
            continue;
        }
        if (!Number.isInteger(value) || (key === "salaryAbilityDivisor" && value <= 0)) {
            throw new Error(`salarySettings.${key} must be a ${key === "salaryAbilityDivisor" ? "positive " : ""}integer`);
        }
        normalized[key] = value;
    }
    return normalized;
}
function normalizeAllocationSettings(allocationSettings = {}) {
    if (allocationSettings === undefined) {
        return {};
    }
    const normalized = {};
    for (const [key, value] of Object.entries(allocationSettings)) {
        if (!["randomWeight", "totalReputationWeight", "illnessReputationWeight", "delayMonths"].includes(key)) {
            throw new Error(`allocationSettings.${key} is not supported`);
        }
        if (!Number.isInteger(value) || value < 0) {
            throw new Error(`allocationSettings.${key} must be a non-negative integer`);
        }
        normalized[key] = value;
    }
    return normalized;
}
function normalizeRoutingSettings(routingSettings = {}) {
    if (routingSettings === undefined) {
        return {};
    }
    const normalized = {};
    for (const [key, value] of Object.entries(routingSettings)) {
        if (!["queuePoints", "distancePoints", "noStaffPoints"].includes(key)) {
            throw new Error(`routingSettings.${key} is not supported`);
        }
        if (!Number.isInteger(value) || value < 0) {
            throw new Error(`routingSettings.${key} must be a non-negative integer`);
        }
        normalized[key] = value;
    }
    return normalized;
}
function normalizeEventSettings(eventSettings = {}) {
    if (eventSettings === undefined) {
        return {};
    }
    const normalized = {};
    for (const [key, value] of Object.entries(eventSettings)) {
        if (!["scoreMaxIncrease", "vaccinationCost", "removeRatHoleChance", "minimumAbductionYears", "abductionsPerYear", "autopsyResearchPercent", "autopsyReputationHitPercent", "mayorLaunch", "disasterLaunch"].includes(key)) {
            throw new Error(`eventSettings.${key} is not supported`);
        }
        if (!Number.isInteger(value) || value < 0) {
            throw new Error(`eventSettings.${key} must be a non-negative integer`);
        }
        normalized[key] = value;
    }
    return normalized;
}
function normalizeAwardCriteria(awardCriteria = {}) {
    if (awardCriteria === undefined) {
        return {};
    }
    const normalized = {};
    for (const [key, value] of Object.entries(awardCriteria)) {
        if (!/^[a-z][a-zA-Z0-9]*$/u.test(key)) {
            throw new Error("awardCriteria keys must be lower camel-case identifiers");
        }
        if (!Number.isInteger(value) || (!key.endsWith("Penalty") && value < 0)) {
            throw new Error(`awardCriteria.${key} must be ${key.endsWith("Penalty") ? "an integer" : "a non-negative integer"}`);
        }
        normalized[key] = value;
    }
    return normalized;
}
function normalizeEmergencySchedule(schedule = []) {
    if (schedule === undefined) {
        return [];
    }
    if (!Array.isArray(schedule)) {
        throw new Error("emergencySchedule must be an array");
    }
    return schedule
        .map((entry, index) => {
        for (const key of ["startMonth", "endMonth", "minPatients", "maxPatients", "illnessCode", "percentToWin", "bonusCash"]) {
            if (!Number.isInteger(entry[key]) || entry[key] < 0) {
                throw new Error(`emergencySchedule[${index}].${key} must be a non-negative integer`);
            }
        }
        if (entry.severity !== undefined && ![1, 2, 3].includes(entry.severity)) {
            throw new Error(`emergencySchedule[${index}].severity must be 1, 2, or 3`);
        }
        if (entry.diseaseId !== undefined && (typeof entry.diseaseId !== "string" || entry.diseaseId.length === 0)) {
            throw new Error(`emergencySchedule[${index}].diseaseId must be a non-empty string`);
        }
        return {
            index: Number.isInteger(entry.index) ? entry.index : index,
            startMonth: entry.startMonth,
            endMonth: entry.endMonth,
            minPatients: entry.minPatients,
            maxPatients: entry.maxPatients,
            illnessCode: entry.illnessCode,
            percentToWin: entry.percentToWin,
            bonusCash: entry.bonusCash,
            ...(entry.diseaseId ? { diseaseId: entry.diseaseId } : {}),
            ...(entry.severity ? { severity: entry.severity } : {})
        };
    })
        .sort((left, right) => left.startMonth - right.startMonth || left.index - right.index);
}
function normalizeExpertise(expertise = []) {
    if (expertise === undefined) {
        return [];
    }
    if (!Array.isArray(expertise)) {
        throw new Error("expertise must be an array");
    }
    return expertise
        .map((entry, index) => {
        if (typeof entry.token !== "string" || entry.token.length === 0 || typeof entry.known !== "boolean") {
            throw new Error(`expertise[${index}] must include token and known`);
        }
        if (!Number.isInteger(entry.researchRequired) || entry.researchRequired < 0) {
            throw new Error(`expertise[${index}].researchRequired must be a non-negative integer`);
        }
        if (entry.maxDiagDifficulty !== undefined && (!Number.isInteger(entry.maxDiagDifficulty) || entry.maxDiagDifficulty < 0)) {
            throw new Error(`expertise[${index}].maxDiagDifficulty must be a non-negative integer`);
        }
        if (entry.contagiousRate !== undefined && (!Number.isInteger(entry.contagiousRate) || entry.contagiousRate < 0)) {
            throw new Error(`expertise[${index}].contagiousRate must be a non-negative integer`);
        }
        if (entry.startPrice !== undefined && (!Number.isInteger(entry.startPrice) || entry.startPrice < 0)) {
            throw new Error(`expertise[${index}].startPrice must be a non-negative integer`);
        }
        if (entry.severity !== undefined && ![1, 2, 3].includes(entry.severity)) {
            throw new Error(`expertise[${index}].severity must be 1, 2, or 3`);
        }
        return {
            index: Number.isInteger(entry.index) ? entry.index : index,
            known: entry.known,
            researchRequired: entry.researchRequired,
            token: entry.token,
            ...(entry.startPrice !== undefined ? { startPrice: entry.startPrice } : {}),
            ...(entry.contagiousRate !== undefined ? { contagiousRate: entry.contagiousRate } : {}),
            ...(entry.maxDiagDifficulty !== undefined ? { maxDiagDifficulty: entry.maxDiagDifficulty } : {}),
            ...(typeof entry.category === "string" && entry.category.length > 0 ? { category: entry.category } : {}),
            ...(typeof entry.diseaseId === "string" && entry.diseaseId.length > 0 ? { diseaseId: entry.diseaseId } : {}),
            ...(entry.severity ? { severity: entry.severity } : {})
        };
    })
        .sort((left, right) => left.index - right.index);
}
function normalizeScenarioOpponents(opponents = []) {
    if (opponents === undefined) {
        return [];
    }
    if (!Array.isArray(opponents)) {
        throw new Error("scenarioOpponents must be an array");
    }
    return opponents
        .map((entry, index) => {
        if (typeof entry.name !== "string" || entry.name.length === 0) {
            throw new Error(`scenarioOpponents[${index}].name must be a non-empty string`);
        }
        for (const key of ["skill", "staffLevels", "luck", "speed", "comfort", "guessAt"]) {
            if (!Number.isInteger(entry[key]) || entry[key] < 0) {
                throw new Error(`scenarioOpponents[${index}].${key} must be a non-negative integer`);
            }
        }
        return {
            index: Number.isInteger(entry.index) ? entry.index : index,
            skill: entry.skill,
            staffLevels: entry.staffLevels,
            luck: entry.luck,
            speed: entry.speed,
            comfort: entry.comfort,
            guessAt: entry.guessAt,
            playing: entry.playing === true,
            name: entry.name
        };
    })
        .sort((left, right) => left.index - right.index);
}
function normalizeNetworkCriteria(criteria = []) {
    if (criteria === undefined) {
        return [];
    }
    if (!Array.isArray(criteria)) {
        throw new Error("networkCriteria must be an array");
    }
    return criteria
        .map((entry, index) => {
        if (typeof entry.metric !== "string" || entry.metric.length === 0) {
            throw new Error(`networkCriteria[${index}].metric must be a non-empty string`);
        }
        for (const key of ["metricCode", "value", "month", "timeToDo"]) {
            if (!Number.isFinite(entry[key])) {
                throw new Error(`networkCriteria[${index}].${key} must be finite`);
            }
        }
        return {
            index: Number.isInteger(entry.index) ? entry.index : index,
            metricCode: entry.metricCode,
            metric: entry.metric,
            value: entry.value,
            month: entry.month,
            timeToDo: entry.timeToDo
        };
    })
        .sort((left, right) => left.month - right.month || left.index - right.index);
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
function normalizeLevelObjective(objective = DEFAULT_LEVEL_OBJECTIVE) {
    const requiredDischarges = objective.requiredDischarges ?? DEFAULT_LEVEL_OBJECTIVE.requiredDischarges;
    const minimumCash = objective.minimumCash ?? DEFAULT_LEVEL_OBJECTIVE.minimumCash;
    const minimumReputation = objective.minimumReputation ?? DEFAULT_LEVEL_OBJECTIVE.minimumReputation;
    const minimumTreatmentPercentage = objective.minimumTreatmentPercentage ?? DEFAULT_LEVEL_OBJECTIVE.minimumTreatmentPercentage;
    const minimumHospitalValue = objective.minimumHospitalValue ?? DEFAULT_LEVEL_OBJECTIVE.minimumHospitalValue;
    const bankruptcyCashThreshold = objective.bankruptcyCashThreshold ?? DEFAULT_LEVEL_OBJECTIVE.bankruptcyCashThreshold;
    const reputationFailureThreshold = objective.reputationFailureThreshold ?? DEFAULT_LEVEL_OBJECTIVE.reputationFailureThreshold;
    const maximumDeaths = objective.maximumDeaths ?? DEFAULT_LEVEL_OBJECTIVE.maximumDeaths;
    if (!Number.isInteger(requiredDischarges) || requiredDischarges < 0) {
        throw new Error("requiredDischarges must be a non-negative integer");
    }
    if (!Number.isFinite(minimumCash)) {
        throw new Error("minimumCash must be finite");
    }
    if (!Number.isInteger(minimumReputation) || minimumReputation < 0) {
        throw new Error("minimumReputation must be a non-negative integer");
    }
    if (!Number.isFinite(minimumTreatmentPercentage) || minimumTreatmentPercentage < 0 || minimumTreatmentPercentage > 100) {
        throw new Error("minimumTreatmentPercentage must be between 0 and 100");
    }
    if (!Number.isFinite(minimumHospitalValue) || minimumHospitalValue < 0) {
        throw new Error("minimumHospitalValue must be a finite non-negative number");
    }
    if (!Number.isFinite(bankruptcyCashThreshold)) {
        throw new Error("bankruptcyCashThreshold must be finite");
    }
    if (!Number.isInteger(reputationFailureThreshold) || reputationFailureThreshold < 0) {
        throw new Error("reputationFailureThreshold must be a non-negative integer");
    }
    if (!(maximumDeaths === Number.POSITIVE_INFINITY || (Number.isInteger(maximumDeaths) && maximumDeaths >= 0))) {
        throw new Error("maximumDeaths must be a non-negative integer or Infinity");
    }
    return {
        requiredDischarges,
        minimumCash,
        minimumReputation,
        minimumTreatmentPercentage,
        minimumHospitalValue,
        bankruptcyCashThreshold,
        reputationFailureThreshold,
        maximumDeaths
    };
}
function cloneLevelObjective(objective) {
    const cloned = {
        requiredDischarges: objective.requiredDischarges,
        minimumCash: objective.minimumCash,
        minimumReputation: objective.minimumReputation,
        minimumTreatmentPercentage: objective.minimumTreatmentPercentage,
        minimumHospitalValue: objective.minimumHospitalValue,
        bankruptcyCashThreshold: objective.bankruptcyCashThreshold,
        reputationFailureThreshold: objective.reputationFailureThreshold
    };
    if (Number.isFinite(objective.maximumDeaths)) {
        cloned.maximumDeaths = objective.maximumDeaths;
    }
    return cloned;
}
function normalizeLevelOutcome(outcome) {
    if (outcome === undefined || outcome === null) {
        return null;
    }
    if (outcome.status !== "won" && outcome.status !== "lost") {
        throw new Error("levelOutcome.status must be won or lost");
    }
    if (typeof outcome.reason !== "string" || outcome.reason.length === 0) {
        throw new Error("levelOutcome.reason must be a non-empty string");
    }
    return {
        status: outcome.status,
        reason: outcome.reason
    };
}
function cloneLevelOutcome(outcome) {
    return outcome ? { status: outcome.status, reason: outcome.reason } : null;
}
function clonePopulationSchedule(schedule) {
    return schedule.map((entry) => ({ index: entry.index, month: entry.month, change: entry.change }));
}
function cloneDiseasePool(diseasePool) {
    return diseasePool.map((entry) => ({
        ...(entry.index !== undefined ? { index: entry.index } : {}),
        source: entry.source,
        token: entry.token,
        diseaseId: entry.diseaseId,
        severity: entry.severity,
        weight: entry.weight,
        ...(entry.startPrice !== undefined ? { startPrice: entry.startPrice } : {}),
        ...(entry.availableMonth !== undefined ? { availableMonth: entry.availableMonth } : {})
    }));
}
function cloneStaffMarketSchedule(schedule) {
    return schedule.map((entry) => ({
        index: entry.index,
        month: entry.month,
        nurses: entry.nurses,
        doctors: entry.doctors,
        handymen: entry.handymen,
        receptionists: entry.receptionists,
        ...(entry.seed !== undefined ? { seed: entry.seed } : {}),
        ...(entry.shrinkRate !== undefined ? { shrinkRate: entry.shrinkRate } : {}),
        ...(entry.surgeonRate !== undefined ? { surgeonRate: entry.surgeonRate } : {}),
        ...(entry.researcherRate !== undefined ? { researcherRate: entry.researcherRate } : {}),
        ...(entry.consultantRate !== undefined ? { consultantRate: entry.consultantRate } : {}),
        ...(entry.juniorRate !== undefined ? { juniorRate: entry.juniorRate } : {})
    }));
}
function cloneRoomAvailability(roomAvailability) {
    return roomAvailability === null ? null : [...roomAvailability];
}
function cloneRoomAvailabilitySchedule(schedule) {
    return schedule.map((entry) => ({ ...entry }));
}
function cloneObjectAvailability(availability) {
    return availability.map((entry) => ({ ...entry }));
}
function cloneRoomCostOverrides(overrides) {
    return { ...overrides };
}
function cloneRoomWearThresholdOverrides(overrides) {
    return { ...overrides };
}
function cloneStaffWageOverrides(overrides) {
    return { ...overrides };
}
function cloneQuakeSchedule(schedule) {
    return schedule.map((entry) => ({ ...entry }));
}
function cloneAdmissionRules(admissionRules) {
    return { ...admissionRules };
}
function cloneResearchSettings(researchSettings) {
    return { ...researchSettings };
}
function cloneTrainingSettings(trainingSettings) {
    return {
        ...trainingSettings,
        ...(trainingSettings.trainingValues ? { trainingValues: trainingSettings.trainingValues.map((entry) => ({ ...entry })) } : {}),
        ...(trainingSettings.abilityThresholds ? { abilityThresholds: trainingSettings.abilityThresholds.map((entry) => ({ ...entry })) } : {})
    };
}
function formatTrainingAbilityThresholds(trainingSettings) {
    return (trainingSettings.abilityThresholds ?? [])
        .slice()
        .sort((left, right) => left.index - right.index)
        .map((entry) => entry.value)
        .join("/");
}
function cloneEpidemicSettings(epidemicSettings) {
    return { ...epidemicSettings };
}
function cloneLandSettings(landSettings) {
    return { ...landSettings };
}
function cloneStaffFatigueSettings(staffFatigueSettings) {
    return { ...staffFatigueSettings };
}
function clonePatientBehaviorSettings(patientBehaviorSettings) {
    return { ...patientBehaviorSettings };
}
function cloneSalarySettings(salarySettings) {
    return {
        ...salarySettings,
        ...(salarySettings.salaryAdds ? { salaryAdds: salarySettings.salaryAdds.map((entry) => ({ ...entry })) } : {})
    };
}
function cloneAllocationSettings(allocationSettings) {
    return { ...allocationSettings };
}
function cloneRoutingSettings(routingSettings) {
    return { ...routingSettings };
}
function cloneEventSettings(eventSettings) {
    return { ...eventSettings };
}
function cloneAwardCriteria(awardCriteria) {
    return { ...awardCriteria };
}
function awardCriteriaHas(criteria, key) {
    return criteria[key] !== undefined;
}
function addAwardBonusIfPresent(criteria, total, bonusKey, ...criteriaKeys) {
    if (criteria[bonusKey] === undefined || !criteriaKeys.some((key) => awardCriteriaHas(criteria, key))) {
        return total;
    }
    return total + criteria[bonusKey];
}
function addAwardPenaltyIfTriggered(criteria, total, penaltyKey, triggeredKeys, ...criteriaKeys) {
    if (criteria[penaltyKey] === undefined || !criteriaKeys.some((key) => triggeredKeys.includes(key))) {
        return total;
    }
    return total + criteria[penaltyKey];
}
function createAwardRewardOverridesFromCriteria(awardCriteria) {
    let cash = 0;
    cash = addAwardBonusIfPresent(awardCriteria, cash, "cansofCokeBonus", "cansofCoke");
    cash = addAwardBonusIfPresent(awardCriteria, cash, "trophyReputationBonus", "reputation");
    cash = addAwardBonusIfPresent(awardCriteria, cash, "ratKillsPercentageBonus", "ratKillsPercentage");
    cash = addAwardBonusIfPresent(awardCriteria, cash, "trophyDeathBonus", "deathsAward");
    cash = addAwardBonusIfPresent(awardCriteria, cash, "trophyCuresBonus", "curesAward");
    cash = addAwardBonusIfPresent(awardCriteria, cash, "curesBonus", "curesAward");
    cash = addAwardBonusIfPresent(awardCriteria, cash, "deathsBonus", "deathsAward");
    cash = addAwardBonusIfPresent(awardCriteria, cash, "curesVDeathsBonus", "curesVDeathsAward");
    cash = addAwardBonusIfPresent(awardCriteria, cash, "awardReputationBonus", "reputationAward");
    let reputation = 0;
    reputation = addAwardBonusIfPresent(awardCriteria, reputation, "ratKillsAbsoluteBonus", "ratKillsAbsolute");
    reputation = addAwardBonusIfPresent(awardCriteria, reputation, "plantBonus", "plant");
    reputation = addAwardBonusIfPresent(awardCriteria, reputation, "trophyStaffHappinessBonus", "trophyStaffHappiness");
    reputation = addAwardBonusIfPresent(awardCriteria, reputation, "awardStaffHappinessBonus", "staffHappinessAward");
    reputation = addAwardBonusIfPresent(awardCriteria, reputation, "trophyMayorBonus", "trophyMayor");
    reputation = addAwardBonusIfPresent(awardCriteria, reputation, "populationPercentageBonus", "populationPercentageAward");
    reputation = addAwardBonusIfPresent(awardCriteria, reputation, "hospValueBonus", "hospValueAward");
    reputation = addAwardBonusIfPresent(awardCriteria, reputation, "cleanlinessBonus", "cleanlinessAward");
    reputation = addAwardBonusIfPresent(awardCriteria, reputation, "peepHappinessBonus", "peepHappinessAward");
    reputation = addAwardBonusIfPresent(awardCriteria, reputation, "waitingTimesBonus", "waitingTimesAward");
    reputation = addAwardBonusIfPresent(awardCriteria, reputation, "emergencyBonus", "emergencyAward");
    reputation = addAwardBonusIfPresent(awardCriteria, reputation, "wellKeptTechBonus", "wellKeptTechAward");
    reputation = addAwardBonusIfPresent(awardCriteria, reputation, "researchBonus", "newTechAward");
    return cash > 0 || reputation > 0 ? { cash, reputation } : null;
}
function createAwardPenaltyOverridesFromCriteria(awardCriteria, triggeredKeys) {
    let cashReward = 0;
    cashReward = addAwardPenaltyIfTriggered(awardCriteria, cashReward, "curesPenalty", triggeredKeys, "curesPoor");
    cashReward = addAwardPenaltyIfTriggered(awardCriteria, cashReward, "deathsPenalty", triggeredKeys, "deathsPoor");
    cashReward = addAwardPenaltyIfTriggered(awardCriteria, cashReward, "curesVDeathsPenalty", triggeredKeys, "curesVDeathsPoor");
    cashReward = addAwardPenaltyIfTriggered(awardCriteria, cashReward, "awardReputationPenalty", triggeredKeys, "reputationPoor");
    let reputationReward = 0;
    reputationReward = addAwardPenaltyIfTriggered(awardCriteria, reputationReward, "populationPercentagePenalty", triggeredKeys, "populationPercentagePoor");
    reputationReward = addAwardPenaltyIfTriggered(awardCriteria, reputationReward, "hospValuePenalty", triggeredKeys, "hospValuePoor");
    reputationReward = addAwardPenaltyIfTriggered(awardCriteria, reputationReward, "cleanlinessPenalty", triggeredKeys, "cleanlinessPoor");
    reputationReward = addAwardPenaltyIfTriggered(awardCriteria, reputationReward, "emergencyPenalty", triggeredKeys, "emergencyPoor");
    reputationReward = addAwardPenaltyIfTriggered(awardCriteria, reputationReward, "awardStaffHappinessPenalty", triggeredKeys, "staffHappinessPoor");
    reputationReward = addAwardPenaltyIfTriggered(awardCriteria, reputationReward, "peepHappinessPenalty", triggeredKeys, "peepHappinessPoor");
    reputationReward = addAwardPenaltyIfTriggered(awardCriteria, reputationReward, "waitingTimesPenalty", triggeredKeys, "waitingTimesPoor");
    reputationReward = addAwardPenaltyIfTriggered(awardCriteria, reputationReward, "wellKeptTechPenalty", triggeredKeys, "wellKeptTechPoor");
    reputationReward = addAwardPenaltyIfTriggered(awardCriteria, reputationReward, "researchPenalty", triggeredKeys, "newTechPoor");
    return cashReward < 0 || reputationReward < 0 ? { cashReward, reputationReward } : null;
}
function cloneEmergencySchedule(schedule) {
    return schedule.map((entry) => ({ ...entry }));
}
function cloneExpertise(expertise) {
    return expertise.map((entry) => ({ ...entry }));
}
function createDiseaseTreatmentPricesFromExpertise(expertise) {
    const prices = {};
    for (const entry of expertise) {
        if (typeof entry.diseaseId !== "string" || !Number.isInteger(entry.startPrice) || entry.startPrice <= 0) {
            continue;
        }
        prices[entry.diseaseId] = entry.startPrice;
    }
    return prices;
}
function cloneScenarioOpponents(opponents) {
    return opponents.map((entry) => ({ ...entry }));
}
function cloneNetworkCriteria(criteria) {
    return criteria.map((entry) => ({ ...entry }));
}
function effectiveScenarioExpertise(expertise, researchLevel) {
    const unlockable = expertise
        .filter((entry) => !entry.known && entry.researchRequired > 0)
        .sort((left, right) => left.researchRequired - right.researchRequired || left.index - right.index);
    const researchedIndexes = new Set(unlockable.slice(0, Math.max(0, researchLevel)).map((entry) => entry.index));
    return expertise.map((entry) => researchedIndexes.has(entry.index) ? { ...entry, known: true, unlockedByResearch: true } : entry);
}
function nextScenarioResearchRequired(effectiveExpertise) {
    return nextScenarioResearchEntry(effectiveExpertise)?.researchRequired ?? null;
}
function nextScenarioResearchEntry(effectiveExpertise) {
    return effectiveExpertise
        .filter((entry) => !entry.known && entry.researchRequired > 0)
        .sort((left, right) => left.researchRequired - right.researchRequired || left.index - right.index)[0] ?? null;
}
function scenarioDiseaseKnownForExpertise(diseaseId, expertise) {
    const diseaseExpertise = expertise.filter((entry) => entry.diseaseId === diseaseId);
    if (diseaseExpertise.length === 0) {
        return true;
    }
    return diseaseExpertise.some((entry) => entry.known || entry.researchRequired === 0);
}
function scenarioDiseaseDiagnosableForExpertise(diseaseId, expertise, diagnosisCapability) {
    const diseaseExpertise = expertise.filter((entry) => entry.diseaseId === diseaseId);
    if (diseaseExpertise.length === 0) {
        return true;
    }
    return diseaseExpertise.some((entry) => (entry.known || entry.researchRequired === 0) &&
        (entry.maxDiagDifficulty === undefined || entry.maxDiagDifficulty <= diagnosisCapability));
}
function scenarioDiseaseContagiousForExpertise(disease, expertise) {
    const diseaseExpertise = expertise.filter((entry) => entry.diseaseId === disease.diseaseId && entry.contagiousRate !== undefined);
    if (diseaseExpertise.length === 0) {
        return isScenarioDiseaseContagious(disease);
    }
    return diseaseExpertise.some((entry) => entry.contagiousRate > 0);
}
function scenarioOpponentProgress(opponent, tick) {
    const interval = Math.max(16, 128 - opponent.speed - opponent.skill * 4 - opponent.staffLevels * 2 - opponent.luck);
    const cures = Math.floor(Math.max(0, tick) / interval);
    const value = cures * 1_000 + opponent.comfort * 100 + opponent.staffLevels * 250;
    const reputation = clamp(300 + cures * 4 + opponent.skill * 20 + opponent.luck * 5 - Math.max(0, opponent.guessAt - 75), 0, 1_000);
    return {
        ...opponent,
        interval,
        cures,
        value,
        reputation
    };
}
function scenarioOpponentStandings(opponents, tick) {
    return opponents
        .filter((entry) => entry.playing)
        .map((entry) => scenarioOpponentProgress(entry, tick))
        .sort((left, right) => right.cures - left.cures || right.value - left.value || left.index - right.index);
}
function treatmentPercentageForState(state) {
    return state.counters.totalAdmissions === 0
        ? 100
        : Math.floor((state.hospitalLoop.dischargedPatients / state.counters.totalAdmissions) * 100);
}
function curesVersusDeathsRatioForState(state) {
    if (state.hospitalLoop.dischargedPatients <= 0) {
        return 0;
    }
    if (state.hospitalLoop.patientDeaths <= 0) {
        return state.hospitalLoop.dischargedPatients;
    }
    return Math.floor(state.hospitalLoop.dischargedPatients / state.hospitalLoop.patientDeaths);
}
function staffHappinessPercentForState(state) {
    const staff = state.entities.staff;
    if (staff.length === 0) {
        return 100;
    }
    const averageStress = staff.reduce((sum, member) => sum + member.stress, 0) / staff.length;
    const burnoutPenalty = (state.secondarySystems.staffBurnoutEvents ?? 0) * 30;
    return clamp(Math.floor(100 - averageStress - burnoutPenalty), 0, 100);
}
function cleanlinessLitterPercentForState(state) {
    const admissions = state.counters.totalAdmissions;
    if (admissions <= 0) {
        return 0;
    }
    return clamp(Math.floor(((state.secondarySystems.currentPatientLitter ?? 0) / admissions) * 100), 0, 100);
}
function peepHappinessPercentForState(state) {
    const patients = state.entities.waitingPatients;
    if (patients.length === 0) {
        return 100;
    }
    const average = patients.reduce((sum, patient) => sum + (patient.health / patient.maxHealth) * 100, 0) / patients.length;
    return clamp(Math.floor(average), 0, 100);
}
function waitingTimesWalkoutPercentForState(state) {
    const admissions = state.counters.totalAdmissions;
    if (admissions <= 0) {
        return 0;
    }
    return clamp(Math.floor(((state.hospitalLoop.patientWalkouts ?? 0) / admissions) * 100), 0, 100);
}
function emergencySuccessPercentForState(state) {
    const wavesStarted = state.emergency.wavesStarted ?? 0;
    if (wavesStarted <= 0) {
        return 100;
    }
    return clamp(Math.floor(((state.emergency.successfulWaves ?? 0) / wavesStarted) * 100), 0, 100);
}
function ratKillsAbsoluteForState(state) {
    return state.secondarySystems.ratsKilled ?? 0;
}
function ratKillsPercentageForState(state) {
    return state.secondarySystems.ratKillPercentage ?? 0;
}
function plantWateredPercentageForState(state) {
    return state.secondarySystems.plantWateredPercentage ?? 0;
}
function wornRoomPercentForState(state) {
    const rooms = state.entities.rooms;
    if (rooms.length === 0) {
        return 0;
    }
    const wornRooms = rooms.filter((room) => room.wear > 0 || room.maintenanceRemainingTicks > 0 || room.status === "closed").length;
    return clamp(Math.floor((wornRooms / rooms.length) * 100), 0, 100);
}
function isScenarioDiseaseContagious(disease) {
    const marker = `${disease.token ?? ""} ${disease.diseaseId ?? ""}`.toLowerCase();
    return marker.includes("infectious") || marker.includes("contagious");
}
function scenarioOpponentObjectiveLeader(opponents, tick, objective) {
    if ((objective.minimumCash ?? 0) > 0 || (objective.minimumTreatmentPercentage ?? 0) > 0) {
        return null;
    }
    return scenarioOpponentStandings(opponents, tick)
        .find((entry) => entry.cures >= objective.requiredDischarges &&
        entry.reputation >= objective.minimumReputation &&
        entry.value >= objective.minimumHospitalValue) ?? null;
}
function formatScenarioAwardCriteria(awardCriteria) {
    const parts = [];
    if (awardCriteria.curesAward !== undefined) {
        parts.push(`cures ${awardCriteria.curesAward}`);
    }
    if (awardCriteria.reputation !== undefined) {
        parts.push(`trophy reputation ${awardCriteria.reputation}`);
    }
    if (awardCriteria.reputationAward !== undefined) {
        parts.push(`reputation ${awardCriteria.reputationAward}`);
    }
    if (awardCriteria.hospValueAward !== undefined) {
        parts.push(`value ${awardCriteria.hospValueAward}`);
    }
    if (awardCriteria.deathsAward !== undefined) {
        parts.push(`deaths max ${awardCriteria.deathsAward}`);
    }
    if (awardCriteria.populationPercentageAward !== undefined) {
        parts.push(`treated ${awardCriteria.populationPercentageAward}%`);
    }
    if (awardCriteria.curesVDeathsAward !== undefined) {
        parts.push(`cures/deaths ${awardCriteria.curesVDeathsAward}`);
    }
    if (awardCriteria.cansofCoke !== undefined) {
        parts.push(`drinks ${awardCriteria.cansofCoke}`);
    }
    if (awardCriteria.ratKillsAbsolute !== undefined) {
        parts.push(`rats ${awardCriteria.ratKillsAbsolute}`);
    }
    if (awardCriteria.ratKillsPercentage !== undefined) {
        parts.push(`rat accuracy ${awardCriteria.ratKillsPercentage}%`);
    }
    if (awardCriteria.plant !== undefined) {
        parts.push(`plants watered ${awardCriteria.plant}%`);
    }
    if (awardCriteria.trophyMayor !== undefined) {
        parts.push(`mayor fail <= ${awardCriteria.trophyMayor}%`);
    }
    if (awardCriteria.trophyStaffHappiness !== undefined) {
        parts.push(`staff happy ${awardCriteria.trophyStaffHappiness}%`);
    }
    if (awardCriteria.staffHappinessAward !== undefined) {
        parts.push(`staff award happy ${awardCriteria.staffHappinessAward}%`);
    }
    if (awardCriteria.cleanlinessAward !== undefined) {
        parts.push(`litter <= ${awardCriteria.cleanlinessAward}%`);
    }
    if (awardCriteria.peepHappinessAward !== undefined) {
        parts.push(`peep happy ${awardCriteria.peepHappinessAward}%`);
    }
    if (awardCriteria.waitingTimesAward !== undefined) {
        parts.push(`walkouts <= ${awardCriteria.waitingTimesAward}%`);
    }
    if (awardCriteria.emergencyAward !== undefined) {
        parts.push(`emergency saved ${awardCriteria.emergencyAward}%`);
    }
    if (awardCriteria.wellKeptTechAward !== undefined) {
        parts.push(`worn tech <= ${awardCriteria.wellKeptTechAward}%`);
    }
    if (awardCriteria.newTechAward !== undefined) {
        parts.push(`research spend ${awardCriteria.newTechAward}`);
    }
    if (awardCriteria.deathsPoor !== undefined) {
        parts.push(`poor deaths ${awardCriteria.deathsPoor}`);
    }
    return parts.length > 0 ? parts.join(", ") : "none";
}
function formatScenarioAwardPoorCriteria(awardCriteria) {
    const parts = [];
    if (awardCriteria.curesPoor !== undefined) {
        parts.push(`cures below ${awardCriteria.curesPoor}`);
    }
    if (awardCriteria.reputationPoor !== undefined) {
        parts.push(`reputation below ${awardCriteria.reputationPoor}`);
    }
    if (awardCriteria.hospValuePoor !== undefined) {
        parts.push(`value below ${awardCriteria.hospValuePoor}`);
    }
    if (awardCriteria.populationPercentagePoor !== undefined) {
        parts.push(`treated below ${awardCriteria.populationPercentagePoor}%`);
    }
    if (awardCriteria.curesVDeathsPoor !== undefined) {
        parts.push(`cures/deaths below ${awardCriteria.curesVDeathsPoor}`);
    }
    if (awardCriteria.cleanlinessPoor !== undefined) {
        parts.push(`litter above ${awardCriteria.cleanlinessPoor}%`);
    }
    if (awardCriteria.peepHappinessPoor !== undefined) {
        parts.push(`peep happy below ${awardCriteria.peepHappinessPoor}%`);
    }
    if (awardCriteria.staffHappinessPoor !== undefined) {
        parts.push(`staff happy below ${awardCriteria.staffHappinessPoor}%`);
    }
    if (awardCriteria.waitingTimesPoor !== undefined) {
        parts.push(`walkouts above ${awardCriteria.waitingTimesPoor}%`);
    }
    if (awardCriteria.emergencyPoor !== undefined) {
        parts.push(`emergency saved below ${awardCriteria.emergencyPoor}%`);
    }
    if (awardCriteria.wellKeptTechPoor !== undefined) {
        parts.push(`worn tech above ${awardCriteria.wellKeptTechPoor}%`);
    }
    if (awardCriteria.newTechPoor !== undefined) {
        parts.push(`research spend below ${awardCriteria.newTechPoor}`);
    }
    if (awardCriteria.deathsPoor !== undefined) {
        parts.push(`deaths above ${awardCriteria.deathsPoor}`);
    }
    return parts.length > 0 ? parts.join(", ") : "none";
}
function evaluateScenarioAwardCriteria(awardCriteria, state) {
    const unmet = [];
    if (awardCriteria.curesAward !== undefined && state.hospitalLoop.dischargedPatients < awardCriteria.curesAward) {
        unmet.push(`cures ${state.hospitalLoop.dischargedPatients}/${awardCriteria.curesAward}`);
    }
    if (awardCriteria.reputation !== undefined && state.reputation < awardCriteria.reputation) {
        unmet.push(`trophy reputation ${state.reputation}/${awardCriteria.reputation}`);
    }
    if (awardCriteria.reputationAward !== undefined && state.reputation < awardCriteria.reputationAward) {
        unmet.push(`reputation ${state.reputation}/${awardCriteria.reputationAward}`);
    }
    if (awardCriteria.hospValueAward !== undefined) {
        const hospitalValue = estimateHospitalValue(state);
        if (hospitalValue < awardCriteria.hospValueAward) {
            unmet.push(`value ${hospitalValue}/${awardCriteria.hospValueAward}`);
        }
    }
    if (awardCriteria.deathsAward !== undefined && state.hospitalLoop.patientDeaths > awardCriteria.deathsAward) {
        unmet.push(`deaths ${state.hospitalLoop.patientDeaths}/${awardCriteria.deathsAward}`);
    }
    if (awardCriteria.populationPercentageAward !== undefined && treatmentPercentageForState(state) < awardCriteria.populationPercentageAward) {
        unmet.push(`treated ${treatmentPercentageForState(state)}/${awardCriteria.populationPercentageAward}%`);
    }
    if (awardCriteria.curesVDeathsAward !== undefined && curesVersusDeathsRatioForState(state) < awardCriteria.curesVDeathsAward) {
        unmet.push(`cures/deaths ${curesVersusDeathsRatioForState(state)}/${awardCriteria.curesVDeathsAward}`);
    }
    if (awardCriteria.cansofCoke !== undefined && (state.secondarySystems.patientDrinks ?? 0) < awardCriteria.cansofCoke) {
        unmet.push(`drinks ${state.secondarySystems.patientDrinks ?? 0}/${awardCriteria.cansofCoke}`);
    }
    if (awardCriteria.ratKillsAbsolute !== undefined && ratKillsAbsoluteForState(state) < awardCriteria.ratKillsAbsolute) {
        unmet.push(`rats ${ratKillsAbsoluteForState(state)}/${awardCriteria.ratKillsAbsolute}`);
    }
    if (awardCriteria.ratKillsPercentage !== undefined) {
        const minimumKills = awardCriteria.ratKillsAbsolute !== undefined ? Math.ceil(awardCriteria.ratKillsAbsolute / 2) : 1;
        if (ratKillsAbsoluteForState(state) < minimumKills) {
            unmet.push(`rats ${ratKillsAbsoluteForState(state)}/${minimumKills}`);
        }
        else if (ratKillsPercentageForState(state) < awardCriteria.ratKillsPercentage) {
            unmet.push(`rat accuracy ${ratKillsPercentageForState(state)}/${awardCriteria.ratKillsPercentage}%`);
        }
    }
    if (awardCriteria.plant !== undefined && plantWateredPercentageForState(state) < awardCriteria.plant) {
        unmet.push(`plants watered ${plantWateredPercentageForState(state)}/${awardCriteria.plant}%`);
    }
    if (awardCriteria.trophyMayor !== undefined) {
        const visitsStarted = state.vipInspection.visitsStarted ?? 0;
        if (visitsStarted < 2) {
            unmet.push(`mayor visits ${visitsStarted}/2`);
        }
        else {
            const failurePercent = Math.floor(((state.vipInspection.failedVisits ?? 0) / visitsStarted) * 100);
            if (failurePercent > awardCriteria.trophyMayor) {
                unmet.push(`mayor failed ${failurePercent}/${awardCriteria.trophyMayor}%`);
            }
        }
    }
    if (awardCriteria.trophyStaffHappiness !== undefined && staffHappinessPercentForState(state) < awardCriteria.trophyStaffHappiness) {
        unmet.push(`staff happy ${staffHappinessPercentForState(state)}/${awardCriteria.trophyStaffHappiness}%`);
    }
    if (awardCriteria.staffHappinessAward !== undefined && staffHappinessPercentForState(state) < awardCriteria.staffHappinessAward) {
        unmet.push(`staff award happy ${staffHappinessPercentForState(state)}/${awardCriteria.staffHappinessAward}%`);
    }
    if (awardCriteria.cleanlinessAward !== undefined && cleanlinessLitterPercentForState(state) > awardCriteria.cleanlinessAward) {
        unmet.push(`litter ${cleanlinessLitterPercentForState(state)}/${awardCriteria.cleanlinessAward}%`);
    }
    if (awardCriteria.peepHappinessAward !== undefined && peepHappinessPercentForState(state) < awardCriteria.peepHappinessAward) {
        unmet.push(`peep happy ${peepHappinessPercentForState(state)}/${awardCriteria.peepHappinessAward}%`);
    }
    if (awardCriteria.waitingTimesAward !== undefined && waitingTimesWalkoutPercentForState(state) > awardCriteria.waitingTimesAward) {
        unmet.push(`walkouts ${waitingTimesWalkoutPercentForState(state)}/${awardCriteria.waitingTimesAward}%`);
    }
    if (awardCriteria.emergencyAward !== undefined) {
        const wavesStarted = state.emergency.wavesStarted ?? 0;
        if (wavesStarted < 2) {
            unmet.push(`emergencies ${wavesStarted}/2`);
        }
        else if (emergencySuccessPercentForState(state) < awardCriteria.emergencyAward) {
            unmet.push(`emergency saved ${emergencySuccessPercentForState(state)}/${awardCriteria.emergencyAward}%`);
        }
    }
    if (awardCriteria.wellKeptTechAward !== undefined && wornRoomPercentForState(state) > awardCriteria.wellKeptTechAward) {
        unmet.push(`worn tech ${wornRoomPercentForState(state)}/${awardCriteria.wellKeptTechAward}%`);
    }
    if (awardCriteria.newTechAward !== undefined && (state.research.totalInvestment ?? 0) < awardCriteria.newTechAward) {
        unmet.push(`research spend ${state.research.totalInvestment ?? 0}/${awardCriteria.newTechAward}`);
    }
    return {
        met: unmet.length === 0,
        unmetSummary: unmet.length > 0 ? unmet.join(", ") : "none"
    };
}
function evaluateScenarioAwardPoorCriteria(awardCriteria, state) {
    const triggered = [];
    const triggeredKeys = [];
    if (awardCriteria.curesPoor !== undefined && state.hospitalLoop.dischargedPatients < awardCriteria.curesPoor) {
        triggered.push(`cures ${state.hospitalLoop.dischargedPatients}/${awardCriteria.curesPoor}`);
        triggeredKeys.push("curesPoor");
    }
    if (awardCriteria.reputationPoor !== undefined && state.reputation < awardCriteria.reputationPoor) {
        triggered.push(`reputation ${state.reputation}/${awardCriteria.reputationPoor}`);
        triggeredKeys.push("reputationPoor");
    }
    if (awardCriteria.hospValuePoor !== undefined) {
        const hospitalValue = estimateHospitalValue(state);
        if (hospitalValue < awardCriteria.hospValuePoor) {
            triggered.push(`value ${hospitalValue}/${awardCriteria.hospValuePoor}`);
            triggeredKeys.push("hospValuePoor");
        }
    }
    if (awardCriteria.populationPercentagePoor !== undefined && treatmentPercentageForState(state) < awardCriteria.populationPercentagePoor) {
        triggered.push(`treated ${treatmentPercentageForState(state)}/${awardCriteria.populationPercentagePoor}%`);
        triggeredKeys.push("populationPercentagePoor");
    }
    if (awardCriteria.curesVDeathsPoor !== undefined && curesVersusDeathsRatioForState(state) < awardCriteria.curesVDeathsPoor) {
        triggered.push(`cures/deaths ${curesVersusDeathsRatioForState(state)}/${awardCriteria.curesVDeathsPoor}`);
        triggeredKeys.push("curesVDeathsPoor");
    }
    if (awardCriteria.cleanlinessPoor !== undefined && cleanlinessLitterPercentForState(state) > awardCriteria.cleanlinessPoor) {
        triggered.push(`litter ${cleanlinessLitterPercentForState(state)}/${awardCriteria.cleanlinessPoor}%`);
        triggeredKeys.push("cleanlinessPoor");
    }
    if (awardCriteria.peepHappinessPoor !== undefined && peepHappinessPercentForState(state) < awardCriteria.peepHappinessPoor) {
        triggered.push(`peep happy ${peepHappinessPercentForState(state)}/${awardCriteria.peepHappinessPoor}%`);
        triggeredKeys.push("peepHappinessPoor");
    }
    if (awardCriteria.staffHappinessPoor !== undefined && staffHappinessPercentForState(state) < awardCriteria.staffHappinessPoor) {
        triggered.push(`staff happy ${staffHappinessPercentForState(state)}/${awardCriteria.staffHappinessPoor}%`);
        triggeredKeys.push("staffHappinessPoor");
    }
    if (awardCriteria.waitingTimesPoor !== undefined && waitingTimesWalkoutPercentForState(state) > awardCriteria.waitingTimesPoor) {
        triggered.push(`walkouts ${waitingTimesWalkoutPercentForState(state)}/${awardCriteria.waitingTimesPoor}%`);
        triggeredKeys.push("waitingTimesPoor");
    }
    if (awardCriteria.emergencyPoor !== undefined && (state.emergency.wavesStarted ?? 0) >= 2 && emergencySuccessPercentForState(state) < awardCriteria.emergencyPoor) {
        triggered.push(`emergency saved ${emergencySuccessPercentForState(state)}/${awardCriteria.emergencyPoor}%`);
        triggeredKeys.push("emergencyPoor");
    }
    if (awardCriteria.wellKeptTechPoor !== undefined && wornRoomPercentForState(state) > awardCriteria.wellKeptTechPoor) {
        triggered.push(`worn tech ${wornRoomPercentForState(state)}/${awardCriteria.wellKeptTechPoor}%`);
        triggeredKeys.push("wellKeptTechPoor");
    }
    if (awardCriteria.newTechPoor !== undefined && (state.research.totalInvestment ?? 0) < awardCriteria.newTechPoor) {
        triggered.push(`research spend ${state.research.totalInvestment ?? 0}/${awardCriteria.newTechPoor}`);
        triggeredKeys.push("newTechPoor");
    }
    if (awardCriteria.deathsPoor !== undefined && state.hospitalLoop.patientDeaths > awardCriteria.deathsPoor) {
        triggered.push(`deaths ${state.hospitalLoop.patientDeaths}/${awardCriteria.deathsPoor}`);
        triggeredKeys.push("deathsPoor");
    }
    return {
        triggered: triggered.length > 0,
        triggeredSummary: triggered.length > 0 ? triggered.join(", ") : "none",
        triggeredKeys
    };
}
function createEpidemicOutbreakConfigFromSettings(epidemicSettings, eventSettings = {}) {
    if (Object.keys(epidemicSettings).length === 0 && eventSettings.vaccinationCost === undefined) {
        return null;
    }
    const config = {};
    if (epidemicSettings.howContagious !== undefined) {
        config.spreadIntervalTicks = Math.max(1, Math.ceil(150 / epidemicSettings.howContagious));
        config.maxSpreadPatients = Math.max(1, Math.ceil(epidemicSettings.howContagious / 15));
    }
    if (epidemicSettings.contagiousSpreadFactor !== undefined) {
        config.spreadChancePercent = Math.min(100, epidemicSettings.contagiousSpreadFactor);
    }
    if (epidemicSettings.reduceContagiousMonths !== undefined) {
        config.spreadSlowdownTicks = epidemicSettings.reduceContagiousMonths * SCENARIO_MONTH_TICKS;
    }
    if (epidemicSettings.reduceContagiousPeepCount !== undefined) {
        config.spreadSlowdownPatientCount = epidemicSettings.reduceContagiousPeepCount;
    }
    if (epidemicSettings.reduceContagiousRate !== undefined) {
        config.spreadSlowdownRatePercent = epidemicSettings.reduceContagiousRate;
    }
    if (epidemicSettings.fine !== undefined) {
        config.penaltyCash = epidemicSettings.fine * 3;
    }
    if (epidemicSettings.compensationLow !== undefined || epidemicSettings.compensationHigh !== undefined) {
        const low = epidemicSettings.compensationLow ?? epidemicSettings.compensationHigh ?? 0;
        const high = epidemicSettings.compensationHigh ?? epidemicSettings.compensationLow ?? 0;
        config.rewardCashMin = Math.min(low, high);
        config.rewardCashMax = Math.max(low, high);
    }
    if (eventSettings.vaccinationCost !== undefined) {
        config.vaccinationCost = eventSettings.vaccinationCost;
    }
    return config;
}
function createStaffFatigueConfigFromSettings(staffFatigueSettings) {
    if (Object.keys(staffFatigueSettings).length === 0) {
        return null;
    }
    const config = {};
    if (staffFatigueSettings.crackUpTired !== undefined) {
        config.burnoutTicks = Math.max(1, Math.ceil(staffFatigueSettings.crackUpTired / 100));
    }
    if (staffFatigueSettings.recoveryMinimum !== undefined) {
        config.autoBreakTicks = Math.max(1, staffFatigueSettings.recoveryMinimum);
    }
    if (staffFatigueSettings.resignMax !== undefined) {
        config.resignBurnoutCount = Math.max(1, Math.ceil(staffFatigueSettings.resignMax / 100));
    }
    if (staffFatigueSettings.modifyFrequency !== undefined) {
        config.modifyFrequency = Math.max(1, staffFatigueSettings.modifyFrequency);
    }
    if (staffFatigueSettings.workLight !== undefined) {
        config.workStressTicks = staffFatigueSettings.workLight;
    }
    if (staffFatigueSettings.restStanding !== undefined) {
        config.idleRecoveryTicks = staffFatigueSettings.restStanding;
        config.restStandingTicks = staffFatigueSettings.restStanding;
    }
    if (staffFatigueSettings.restSofa !== undefined) {
        config.restSofaTicks = staffFatigueSettings.restSofa;
    }
    if (staffFatigueSettings.restGame !== undefined) {
        config.restGameTicks = staffFatigueSettings.restGame;
    }
    if (staffFatigueSettings.restSnooker !== undefined) {
        config.restSnookerTicks = staffFatigueSettings.restSnooker;
    }
    if (staffFatigueSettings.recoveryFactor !== undefined) {
        config.recoveryFactorTicks = Math.max(1, Math.ceil(staffFatigueSettings.recoveryFactor / 100));
    }
    if (staffFatigueSettings.notTired !== undefined) {
        config.notTiredTicks = Math.max(1, Math.ceil(staffFatigueSettings.notTired / 100));
    }
    if (staffFatigueSettings.tired !== undefined) {
        config.tiredTicks = Math.max(1, Math.ceil(staffFatigueSettings.tired / 100));
    }
    if (staffFatigueSettings.veryTired !== undefined) {
        config.veryTiredTicks = Math.max(1, Math.ceil(staffFatigueSettings.veryTired / 100));
    }
    return config;
}
function createPatientBehaviorConfigFromSettings(patientBehaviorSettings, eventSettings = {}) {
    if (Object.keys(patientBehaviorSettings).length === 0 && eventSettings.removeRatHoleChance === undefined) {
        return null;
    }
    const config = {};
    if (patientBehaviorSettings.leaveMax !== undefined) {
        config.leaveMax = patientBehaviorSettings.leaveMax;
    }
    for (const key of ["happy", "unhappy", "veryUnhappy", "vomitLimit", "litterDrop", "litterRandom", "bowelFull", "bowelOverflows", "drinkHappy", "toiletHappy"]) {
        if (patientBehaviorSettings[key] !== undefined) {
            config[key] = patientBehaviorSettings[key];
        }
    }
    if (eventSettings.removeRatHoleChance !== undefined) {
        config.litterCleanupChance = eventSettings.removeRatHoleChance;
    }
    return Object.keys(config).length > 0 ? config : null;
}
function createAutopsyConfigFromEventSettings(eventSettings) {
    const config = {};
    if (eventSettings.autopsyResearchPercent !== undefined) {
        config.researchPercent = eventSettings.autopsyResearchPercent;
    }
    if (eventSettings.autopsyReputationHitPercent !== undefined) {
        config.reputationHitPercent = eventSettings.autopsyReputationHitPercent;
    }
    return Object.keys(config).length > 0 ? config : null;
}
function createAwardScoreMaxIncreaseFromEventSettings(eventSettings) {
    return eventSettings.scoreMaxIncrease !== undefined ? eventSettings.scoreMaxIncrease : null;
}
function staffMarketKeyForRole(role) {
    if (role === "diagnostician") {
        return "doctors";
    }
    if (role === "nurse") {
        return "nurses";
    }
    if (role === "handyman") {
        return "handymen";
    }
    if (role === "receptionist") {
        return "receptionists";
    }
    return null;
}
function formatRecentEvent(event) {
    if (!event) {
        return null;
    }
    return `${event.tick}:${event.type}`;
}
function createRecentEventFeed(events) {
    const recent = events.recent.slice(-5).map(formatRecentEvent).filter(Boolean);
    return recent.length > 0 ? recent.join("; ") : "none";
}
function createAdvisorStatus(state, levelObjective) {
    if (levelObjective.status === "lost") {
        return `Advisor: level lost (${levelObjective.reason})`;
    }
    if (state.secondarySystems.criticalPatients > 0) {
        return `Advisor: ${state.secondarySystems.criticalPatients} critical patient${state.secondarySystems.criticalPatients === 1 ? "" : "s"}`;
    }
    if (state.secondarySystems.queuePressureStatus === "high") {
        return `Advisor: queue pressure high (${state.secondarySystems.queuePressure})`;
    }
    if (state.secondarySystems.roomsInMaintenance > 0) {
        return `Advisor: ${state.secondarySystems.roomsInMaintenance} room${state.secondarySystems.roomsInMaintenance === 1 ? "" : "s"} in maintenance`;
    }
    const lastEventType = state.events.recent[state.events.recent.length - 1]?.type ?? null;
    if (lastEventType === "milestone-unlocked") {
        return "Advisor: milestone unlocked";
    }
    if (levelObjective.status === "won") {
        return "Advisor: level complete";
    }
    return "Advisor: stable";
}
function estimateHospitalValue(state) {
    const roomValue = state.entities.rooms.length * 5_000;
    const staffValue = state.entities.staff.length * 1_000;
    const objectValue = (state.entities.objects ?? []).reduce((sum, object) => sum + (Number.isInteger(object.cost) ? object.cost : 0), 0);
    return Math.max(0, state.cash + roomValue + staffValue + objectValue);
}
function networkCriterionValueForState(criterion, state) {
    switch (criterion.metric) {
        case "survive-month":
            return Math.floor(state.tick / SCENARIO_MONTH_TICKS);
        case "patients-cured":
        case "cures":
            return state.hospitalLoop.dischargedPatients;
        case "reputation":
            return state.reputation;
        case "balance":
            return state.cash;
        case "hospital-value":
            return estimateHospitalValue(state);
        case "score":
            return state.awards.currentScore;
        case "emergency":
            return state.emergency.successfulWaves;
        case "research":
            return state.research.level;
        default:
            return 0;
    }
}
function evaluateNetworkCriterion(criterion, state) {
    const currentMonth = Math.floor(state.tick / SCENARIO_MONTH_TICKS);
    const deadlineMonth = criterion.month + Math.max(0, criterion.timeToDo);
    const currentValue = networkCriterionValueForState(criterion, state);
    const met = currentValue >= criterion.value;
    const status = met
        ? "met"
        : currentMonth < criterion.month
            ? "pending"
            : currentMonth <= deadlineMonth
                ? "active"
                : "missed";
    return {
        index: criterion.index,
        metric: criterion.metric,
        value: criterion.value,
        month: criterion.month,
        timeToDo: criterion.timeToDo,
        deadlineMonth,
        currentValue,
        status
    };
}
function evaluateNetworkCriteria(criteria, state) {
    return criteria.map((criterion) => evaluateNetworkCriterion(criterion, state));
}
export class AppOrchestrator {
    simulation;
    tickIntervalMs;
    pointerTileSize;
    tickRateHz;
    seed;
    initialCash;
    scenarioLevelName;
    terrain;
    admissionPoints;
    populationSchedule;
    diseasePool;
    staffMarketSchedule;
    roomAvailability;
    roomAvailabilitySchedule;
    objectAvailability;
    roomCostOverrides;
    roomWearThresholdOverrides;
    staffWageOverrides;
    loanInterestPerChunk;
    scenarioIllnessRate;
    quakeSchedule;
    admissionRules;
    researchSettings;
    trainingSettings;
    epidemicSettings;
    landSettings;
    staffFatigueSettings;
    patientBehaviorSettings;
    salarySettings;
    allocationSettings;
    routingSettings;
    eventSettings;
    awardCriteria;
    emergencySchedule;
    expertise;
    scenarioOpponents;
    networkCriteria;
    levelObjective;
    levelOutcome = null;
    paused = false;
    admissionsOpen = false;
    speedMultiplier = DEFAULT_SPEED_MULTIPLIER;
    admissionPolicy = DEFAULT_ADMISSION_POLICY;
    tickAccumulatorMs = 0;
    commandHistory = [];
    constructor(options) {
        assertFinitePositive(options.seed, "seed");
        this.seed = options.seed;
        this.initialCash = options.initialCash ?? null;
        if (this.initialCash !== null && !Number.isFinite(this.initialCash)) {
            throw new Error("initialCash must be finite");
        }
        this.scenarioLevelName = normalizeScenarioLevelName(options.scenarioLevelName);
        this.tickRateHz = options.tickRateHz ?? DEFAULT_TICK_RATE_HZ;
        this.tickIntervalMs = 1000 / this.tickRateHz;
        this.pointerTileSize = options.pointerTileSize ?? DEFAULT_POINTER_TILE_SIZE;
        assertFinitePositive(this.tickRateHz, "tickRateHz");
        assertFinitePositive(this.tickIntervalMs, "tick interval");
        assertFinitePositive(this.pointerTileSize, "pointerTileSize");
        this.terrain = options.terrain;
        this.levelObjective = normalizeLevelObjective(options.levelObjective);
        this.levelOutcome = normalizeLevelOutcome(options.levelOutcome);
        this.populationSchedule = normalizePopulationSchedule(options.populationSchedule);
        this.diseasePool = normalizeDiseasePool(options.diseasePool);
        this.staffMarketSchedule = normalizeStaffMarketSchedule(options.staffMarketSchedule);
        this.roomAvailability = normalizeRoomAvailability(options.roomAvailability);
        this.objectAvailability = normalizeObjectAvailability(options.objectAvailability);
        this.roomAvailabilitySchedule = normalizeRoomAvailabilitySchedule(options.roomAvailabilitySchedule ??
            this.objectAvailability
                .filter((object) => typeof object.roomType === "string")
                .map((object) => ({
                index: object.index,
                roomType: object.roomType,
                startAvailable: object.startAvailable,
                whenAvailable: object.whenAvailable,
                availableForLevel: object.availableForLevel,
                ...(Number.isInteger(object.researchRequired) ? { researchRequired: object.researchRequired } : {}),
                ...(object.expertiseCategory ? { expertiseCategory: object.expertiseCategory } : {})
            })));
        this.roomCostOverrides = normalizeRoomCostOverrides(options.roomCostOverrides);
        this.roomWearThresholdOverrides = normalizeRoomWearThresholdOverrides(options.roomWearThresholdOverrides);
        this.staffWageOverrides = normalizeStaffWageOverrides(options.staffWageOverrides);
        this.loanInterestPerChunk = normalizeLoanInterestPerChunk(options.loanInterestPerChunk);
        this.scenarioIllnessRate = normalizeScenarioIllnessRate(options.scenarioIllnessRate);
        this.quakeSchedule = normalizeQuakeSchedule(options.quakeSchedule);
        this.admissionRules = normalizeAdmissionRules(options.admissionRules);
        this.researchSettings = normalizeResearchSettings(options.researchSettings);
        this.trainingSettings = normalizeTrainingSettings(options.trainingSettings);
        this.epidemicSettings = normalizeEpidemicSettings(options.epidemicSettings);
        this.landSettings = normalizeLandSettings(options.landSettings);
        this.staffFatigueSettings = normalizeStaffFatigueSettings(options.staffFatigueSettings);
        this.patientBehaviorSettings = normalizePatientBehaviorSettings(options.patientBehaviorSettings);
        this.salarySettings = normalizeSalarySettings(options.salarySettings);
        this.allocationSettings = normalizeAllocationSettings(options.allocationSettings);
        this.routingSettings = normalizeRoutingSettings(options.routingSettings);
        this.eventSettings = normalizeEventSettings(options.eventSettings);
        this.awardCriteria = normalizeAwardCriteria(options.awardCriteria);
        this.emergencySchedule = normalizeEmergencySchedule(options.emergencySchedule);
        this.expertise = normalizeExpertise(options.expertise);
        this.scenarioOpponents = normalizeScenarioOpponents(options.scenarioOpponents);
        this.networkCriteria = normalizeNetworkCriteria(options.networkCriteria);
        const epidemicOutbreak = createEpidemicOutbreakConfigFromSettings(this.epidemicSettings, this.eventSettings);
        const staffFatigue = createStaffFatigueConfigFromSettings(this.staffFatigueSettings);
        const patientBehavior = createPatientBehaviorConfigFromSettings(this.patientBehaviorSettings, this.eventSettings);
        const autopsy = createAutopsyConfigFromEventSettings(this.eventSettings);
        const awardScoreMaxIncrease = createAwardScoreMaxIncreaseFromEventSettings(this.eventSettings);
        const awardRewardOverrides = createAwardRewardOverridesFromCriteria(this.awardCriteria);
        const diseaseTreatmentPrices = createDiseaseTreatmentPricesFromExpertise(this.expertise);
        this.simulation = new DeterministicSimulation(options.seed, {
            ...(options.bounds ? { bounds: options.bounds } : {}),
            ...(options.terrain ? { terrain: options.terrain } : {}),
            ...(options.admissionPoints ? { admissionPoints: options.admissionPoints } : {}),
            ...(Object.keys(this.roomCostOverrides).length > 0 ? { roomCostOverrides: this.roomCostOverrides } : {}),
            ...(Object.keys(this.roomWearThresholdOverrides).length > 0 ? { roomWearThresholdOverrides: this.roomWearThresholdOverrides } : {}),
            ...(this.researchSettings.maxObjectStrength !== undefined ? { roomWearResearchMaxStrength: this.researchSettings.maxObjectStrength } : {}),
            ...(Object.keys(this.staffWageOverrides).length > 0 ? { staffWageOverrides: this.staffWageOverrides } : {}),
            ...(Object.keys(this.salarySettings).length > 0 ? { staffSalary: this.salarySettings } : {}),
            ...(this.landSettings.landCostPerTile !== undefined ? { landCostPerTile: this.landSettings.landCostPerTile } : {}),
            ...(Object.keys(this.routingSettings).length > 0 ? { routingSettings: this.routingSettings } : {}),
            ...(this.loanInterestPerChunk !== null ? { loanInterestPerChunk: this.loanInterestPerChunk } : {}),
            ...(this.scenarioIllnessRate !== null ? { scenarioIllnessRate: this.scenarioIllnessRate } : {}),
            ...(this.researchProjectTicks() !== DEFAULT_RESEARCH_PROJECT_TICKS ? { researchProjectTicks: this.researchProjectTicks() } : {}),
            ...(this.researchProjectCost() !== null ? { researchProjectCost: this.researchProjectCost() } : {}),
            ...(this.researchSettings.minDrugCost !== undefined ? { researchProjectMinCost: this.researchSettings.minDrugCost } : {}),
            ...(this.researchStartRating() !== null ? { researchStartRating: this.researchStartRating() } : {}),
            ...(this.researchImproveRate() !== null ? { researchImproveRate: this.researchImproveRate() } : {}),
            ...(this.researchSettings.researchIncrement !== undefined ? { researchLevelIncrement: this.researchSettings.researchIncrement } : {}),
            ...(this.researchSettings.researchImproveCostPercent !== undefined ? { researchImproveCostPercent: this.researchSettings.researchImproveCostPercent } : {}),
            ...(this.staffTrainingTicks() !== null ? { staffTrainingTicks: this.staffTrainingTicks() } : {}),
            ...(Object.keys(this.staffTrainingTicksByTargetLevel()).length > 0 ? { staffTrainingTicksByTargetLevel: this.staffTrainingTicksByTargetLevel() } : {}),
            ...(epidemicOutbreak ? { epidemicOutbreak } : {}),
            ...(staffFatigue ? { staffFatigue } : {}),
            ...(patientBehavior ? { patientBehavior } : {}),
            ...(autopsy ? { autopsy } : {}),
            ...(awardScoreMaxIncrease !== null ? { awardScoreMaxIncrease } : {}),
            ...(awardRewardOverrides ? { awardRewardOverrides } : {}),
            ...(Object.keys(diseaseTreatmentPrices).length > 0 ? { diseaseTreatmentPrices } : {}),
            ...(this.initialCash !== null ? { initialCash: this.initialCash } : {})
        });
        this.admissionPoints = this.simulation.getState().admissionPoints.map((point) => ({ x: point.x, y: point.y }));
        for (const command of options.bootstrapCommands ?? []) {
            this.executeCommand(this.enrichBootstrapCommand(command));
        }
        if (options.restoredRuntime) {
            this.paused = options.restoredRuntime.paused;
            this.admissionsOpen = options.restoredRuntime.admissionsOpen ?? false;
            this.speedMultiplier = normalizeSpeedMultiplier(options.restoredRuntime.speedMultiplier ?? DEFAULT_SPEED_MULTIPLIER);
            this.admissionPolicy = normalizeAdmissionPolicy(options.restoredRuntime.admissionPolicy ?? DEFAULT_ADMISSION_POLICY);
            this.tickAccumulatorMs = options.restoredRuntime.tickAccumulatorMs;
            this.levelOutcome = normalizeLevelOutcome(options.restoredRuntime.levelOutcome ?? this.levelOutcome);
            assertFiniteNonNegative(this.tickAccumulatorMs, "tickAccumulatorMs");
        }
        else {
            this.admissionsOpen = options.admissionsOpen ?? false;
            this.speedMultiplier = normalizeSpeedMultiplier(options.speedMultiplier ?? DEFAULT_SPEED_MULTIPLIER);
            this.admissionPolicy = normalizeAdmissionPolicy(options.admissionPolicy ?? DEFAULT_ADMISSION_POLICY);
        }
    }
    static fromPersistenceSnapshot(snapshot, options = {}) {
        assertFinitePositive(snapshot.seed, "seed");
        assertFinitePositive(snapshot.tickRateHz, "tickRateHz");
        assertFinitePositive(snapshot.pointerTileSize, "pointerTileSize");
        const commandLog = snapshot.commandLog.map((command) => cloneGameCommand(command));
        const runtime = {
            paused: snapshot.runtime.paused,
            admissionsOpen: snapshot.runtime.admissionsOpen ?? false,
            speedMultiplier: snapshot.runtime.speedMultiplier ?? DEFAULT_SPEED_MULTIPLIER,
            admissionPolicy: snapshot.runtime.admissionPolicy ?? DEFAULT_ADMISSION_POLICY,
            tickAccumulatorMs: snapshot.runtime.tickAccumulatorMs
        };
        if (snapshot.runtime.levelOutcome !== undefined) {
            runtime.levelOutcome = snapshot.runtime.levelOutcome;
        }
        if (typeof runtime.paused !== "boolean") {
            throw new Error("runtime.paused must be boolean");
        }
        assertFiniteNonNegative(runtime.tickAccumulatorMs, "runtime.tickAccumulatorMs");
        return new AppOrchestrator({
            seed: snapshot.seed,
            tickRateHz: snapshot.tickRateHz,
            pointerTileSize: snapshot.pointerTileSize,
            ...(snapshot.bounds ? { bounds: snapshot.bounds } : {}),
            ...(options.initialCash !== undefined ? { initialCash: options.initialCash } : snapshot.initialCash !== undefined ? { initialCash: snapshot.initialCash } : {}),
            ...(options.scenarioLevelName !== undefined ? { scenarioLevelName: options.scenarioLevelName } : snapshot.scenarioLevelName !== undefined ? { scenarioLevelName: snapshot.scenarioLevelName } : {}),
            ...(options.terrain ? { terrain: options.terrain } : {}),
            ...(snapshot.admissionPoints ? { admissionPoints: snapshot.admissionPoints } : options.admissionPoints ? { admissionPoints: options.admissionPoints } : {}),
            ...(options.levelObjective ? { levelObjective: options.levelObjective } : snapshot.levelObjective ? { levelObjective: snapshot.levelObjective } : {}),
            ...(options.populationSchedule ? { populationSchedule: options.populationSchedule } : snapshot.populationSchedule ? { populationSchedule: snapshot.populationSchedule } : {}),
            ...(options.diseasePool ? { diseasePool: options.diseasePool } : snapshot.diseasePool ? { diseasePool: snapshot.diseasePool } : {}),
            ...(options.staffMarketSchedule ? { staffMarketSchedule: options.staffMarketSchedule } : snapshot.staffMarketSchedule ? { staffMarketSchedule: snapshot.staffMarketSchedule } : {}),
            ...(options.roomAvailability ? { roomAvailability: options.roomAvailability } : snapshot.roomAvailability ? { roomAvailability: snapshot.roomAvailability } : {}),
            ...(options.roomAvailabilitySchedule ? { roomAvailabilitySchedule: options.roomAvailabilitySchedule } : snapshot.roomAvailabilitySchedule ? { roomAvailabilitySchedule: snapshot.roomAvailabilitySchedule } : {}),
            ...(options.objectAvailability ? { objectAvailability: options.objectAvailability } : snapshot.objectAvailability ? { objectAvailability: snapshot.objectAvailability } : {}),
            ...(options.roomCostOverrides ? { roomCostOverrides: options.roomCostOverrides } : snapshot.roomCostOverrides ? { roomCostOverrides: snapshot.roomCostOverrides } : {}),
            ...(options.roomWearThresholdOverrides ? { roomWearThresholdOverrides: options.roomWearThresholdOverrides } : snapshot.roomWearThresholdOverrides ? { roomWearThresholdOverrides: snapshot.roomWearThresholdOverrides } : {}),
            ...(options.staffWageOverrides ? { staffWageOverrides: options.staffWageOverrides } : snapshot.staffWageOverrides ? { staffWageOverrides: snapshot.staffWageOverrides } : {}),
            ...(options.loanInterestPerChunk !== undefined ? { loanInterestPerChunk: options.loanInterestPerChunk } : snapshot.loanInterestPerChunk !== undefined ? { loanInterestPerChunk: snapshot.loanInterestPerChunk } : {}),
            ...(options.scenarioIllnessRate !== undefined ? { scenarioIllnessRate: options.scenarioIllnessRate } : snapshot.scenarioIllnessRate !== undefined ? { scenarioIllnessRate: snapshot.scenarioIllnessRate } : {}),
            ...(options.quakeSchedule ? { quakeSchedule: options.quakeSchedule } : snapshot.quakeSchedule ? { quakeSchedule: snapshot.quakeSchedule } : {}),
            ...(options.admissionRules ? { admissionRules: options.admissionRules } : snapshot.admissionRules ? { admissionRules: snapshot.admissionRules } : {}),
            ...(options.researchSettings ? { researchSettings: options.researchSettings } : snapshot.researchSettings ? { researchSettings: snapshot.researchSettings } : {}),
            ...(options.trainingSettings ? { trainingSettings: options.trainingSettings } : snapshot.trainingSettings ? { trainingSettings: snapshot.trainingSettings } : {}),
            ...(options.epidemicSettings ? { epidemicSettings: options.epidemicSettings } : snapshot.epidemicSettings ? { epidemicSettings: snapshot.epidemicSettings } : {}),
            ...(options.landSettings ? { landSettings: options.landSettings } : snapshot.landSettings ? { landSettings: snapshot.landSettings } : {}),
            ...(options.staffFatigueSettings ? { staffFatigueSettings: options.staffFatigueSettings } : snapshot.staffFatigueSettings ? { staffFatigueSettings: snapshot.staffFatigueSettings } : {}),
            ...(options.patientBehaviorSettings ? { patientBehaviorSettings: options.patientBehaviorSettings } : snapshot.patientBehaviorSettings ? { patientBehaviorSettings: snapshot.patientBehaviorSettings } : {}),
            ...(options.salarySettings ? { salarySettings: options.salarySettings } : snapshot.salarySettings ? { salarySettings: snapshot.salarySettings } : {}),
            ...(options.allocationSettings ? { allocationSettings: options.allocationSettings } : snapshot.allocationSettings ? { allocationSettings: snapshot.allocationSettings } : {}),
            ...(options.routingSettings ? { routingSettings: options.routingSettings } : snapshot.routingSettings ? { routingSettings: snapshot.routingSettings } : {}),
            ...(options.eventSettings ? { eventSettings: options.eventSettings } : snapshot.eventSettings ? { eventSettings: snapshot.eventSettings } : {}),
            ...(options.awardCriteria ? { awardCriteria: options.awardCriteria } : snapshot.awardCriteria ? { awardCriteria: snapshot.awardCriteria } : {}),
            ...(options.emergencySchedule ? { emergencySchedule: options.emergencySchedule } : snapshot.emergencySchedule ? { emergencySchedule: snapshot.emergencySchedule } : {}),
            ...(options.expertise ? { expertise: options.expertise } : snapshot.expertise ? { expertise: snapshot.expertise } : {}),
            ...(options.scenarioOpponents ? { scenarioOpponents: options.scenarioOpponents } : snapshot.scenarioOpponents ? { scenarioOpponents: snapshot.scenarioOpponents } : {}),
            ...(options.networkCriteria ? { networkCriteria: options.networkCriteria } : snapshot.networkCriteria ? { networkCriteria: snapshot.networkCriteria } : {}),
            bootstrapCommands: commandLog,
            restoredRuntime: runtime
        });
    }
    createPersistenceSnapshot() {
        return {
            seed: this.seed,
            ...(this.initialCash !== null ? { initialCash: this.initialCash } : {}),
            ...(this.scenarioLevelName !== null ? { scenarioLevelName: this.scenarioLevelName } : {}),
            tickRateHz: this.tickRateHz,
            pointerTileSize: this.pointerTileSize,
            bounds: this.simulation.getState().bounds,
            ...(this.admissionPoints.length > 0 ? { admissionPoints: this.admissionPoints.map((point) => ({ x: point.x, y: point.y })) } : {}),
            levelObjective: cloneLevelObjective(this.levelObjective),
            ...(this.populationSchedule.length > 0 ? { populationSchedule: clonePopulationSchedule(this.populationSchedule) } : {}),
            ...(this.diseasePool.length > 0 ? { diseasePool: cloneDiseasePool(this.diseasePool) } : {}),
            ...(this.staffMarketSchedule.length > 0 ? { staffMarketSchedule: cloneStaffMarketSchedule(this.staffMarketSchedule) } : {}),
            ...(this.roomAvailability !== null ? { roomAvailability: cloneRoomAvailability(this.roomAvailability) } : {}),
            ...(this.roomAvailabilitySchedule.length > 0 ? { roomAvailabilitySchedule: cloneRoomAvailabilitySchedule(this.roomAvailabilitySchedule) } : {}),
            ...(this.objectAvailability.length > 0 ? { objectAvailability: cloneObjectAvailability(this.objectAvailability) } : {}),
            ...(Object.keys(this.roomCostOverrides).length > 0 ? { roomCostOverrides: cloneRoomCostOverrides(this.roomCostOverrides) } : {}),
            ...(Object.keys(this.roomWearThresholdOverrides).length > 0 ? { roomWearThresholdOverrides: cloneRoomWearThresholdOverrides(this.roomWearThresholdOverrides) } : {}),
            ...(Object.keys(this.staffWageOverrides).length > 0 ? { staffWageOverrides: cloneStaffWageOverrides(this.staffWageOverrides) } : {}),
            ...(this.loanInterestPerChunk !== null ? { loanInterestPerChunk: this.loanInterestPerChunk } : {}),
            ...(this.scenarioIllnessRate !== null ? { scenarioIllnessRate: this.scenarioIllnessRate } : {}),
            ...(this.quakeSchedule.length > 0 ? { quakeSchedule: cloneQuakeSchedule(this.quakeSchedule) } : {}),
            ...(Object.keys(this.admissionRules).length > 0 ? { admissionRules: cloneAdmissionRules(this.admissionRules) } : {}),
            ...(Object.keys(this.researchSettings).length > 0 ? { researchSettings: cloneResearchSettings(this.researchSettings) } : {}),
            ...(Object.keys(this.trainingSettings).length > 0 ? { trainingSettings: cloneTrainingSettings(this.trainingSettings) } : {}),
            ...(Object.keys(this.epidemicSettings).length > 0 ? { epidemicSettings: cloneEpidemicSettings(this.epidemicSettings) } : {}),
            ...(Object.keys(this.landSettings).length > 0 ? { landSettings: cloneLandSettings(this.landSettings) } : {}),
            ...(Object.keys(this.staffFatigueSettings).length > 0 ? { staffFatigueSettings: cloneStaffFatigueSettings(this.staffFatigueSettings) } : {}),
            ...(Object.keys(this.patientBehaviorSettings).length > 0 ? { patientBehaviorSettings: clonePatientBehaviorSettings(this.patientBehaviorSettings) } : {}),
            ...(Object.keys(this.salarySettings).length > 0 ? { salarySettings: cloneSalarySettings(this.salarySettings) } : {}),
            ...(Object.keys(this.allocationSettings).length > 0 ? { allocationSettings: cloneAllocationSettings(this.allocationSettings) } : {}),
            ...(Object.keys(this.routingSettings).length > 0 ? { routingSettings: cloneRoutingSettings(this.routingSettings) } : {}),
            ...(Object.keys(this.eventSettings).length > 0 ? { eventSettings: cloneEventSettings(this.eventSettings) } : {}),
            ...(Object.keys(this.awardCriteria).length > 0 ? { awardCriteria: cloneAwardCriteria(this.awardCriteria) } : {}),
            ...(this.emergencySchedule.length > 0 ? { emergencySchedule: cloneEmergencySchedule(this.emergencySchedule) } : {}),
            ...(this.expertise.length > 0 ? { expertise: cloneExpertise(this.expertise) } : {}),
            ...(this.scenarioOpponents.length > 0 ? { scenarioOpponents: cloneScenarioOpponents(this.scenarioOpponents) } : {}),
            ...(this.networkCriteria.length > 0 ? { networkCriteria: cloneNetworkCriteria(this.networkCriteria) } : {}),
            commandLog: cloneCommandHistoryForPersistence(this.commandHistory, this.simulation.getState()),
            runtime: {
                paused: this.paused,
                admissionsOpen: this.admissionsOpen,
                speedMultiplier: this.speedMultiplier,
                admissionPolicy: this.admissionPolicy,
                tickAccumulatorMs: this.tickAccumulatorMs,
                ...(this.levelOutcome ? { levelOutcome: cloneLevelOutcome(this.levelOutcome) } : {})
            }
        };
    }
    advanceFrame(elapsedMs) {
        if (!Number.isFinite(elapsedMs) || elapsedMs < 0) {
            throw new Error("elapsedMs must be a finite non-negative number");
        }
        if (this.paused || elapsedMs === 0) {
            return 0;
        }
        this.tickAccumulatorMs += elapsedMs * this.speedMultiplier;
        const ticks = Math.floor(this.tickAccumulatorMs / this.tickIntervalMs);
        if (ticks <= 0) {
            return 0;
        }
        this.tickAccumulatorMs -= ticks * this.tickIntervalMs;
        this.advanceSimulationTicks(ticks);
        return ticks;
    }
    dispatch(action) {
        if (action.action === "pause-toggle") {
            this.paused = !this.paused;
            return [this.paused ? "app.paused" : "app.resumed"];
        }
        if (action.action === "speed-set") {
            this.speedMultiplier = normalizeSpeedMultiplier(action.speedMultiplier);
            return ["speed.changed"];
        }
        if (this.isLostLevel()) {
            const blockedEvents = LOST_LEVEL_DISPATCH_BLOCK_EVENTS.get(action.action);
            return blockedEvents ? [...blockedEvents] : ["patient.admit-blocked"];
        }
        if (action.action === "admissions-toggle") {
            this.admissionsOpen = !this.admissionsOpen;
            return [this.admissionsOpen ? "admissions.opened" : "admissions.closed"];
        }
        if (action.action === "admission-policy-set") {
            this.admissionPolicy = normalizeAdmissionPolicy(action.admissionPolicy);
            return ["admission-policy.changed"];
        }
        if (action.action === "pricing-policy-set") {
            const pricingPolicyBefore = this.simulation.getState().economy.treatmentPricingPolicy;
            this.executeCommand({ type: "set-pricing-policy", policy: action.pricingPolicy });
            const pricingPolicyAfter = this.simulation.getState().economy.treatmentPricingPolicy;
            return [pricingPolicyAfter !== pricingPolicyBefore ? "pricing-policy.changed" : "pricing-policy.unchanged"];
        }
        if (action.action === "take-loan") {
            const loanBefore = this.simulation.getState().economy.outstandingLoan;
            this.executeCommand({ type: "take-loan" });
            const loanAfter = this.simulation.getState().economy.outstandingLoan;
            return [loanAfter > loanBefore ? "loan.taken" : "loan.take-blocked"];
        }
        if (action.action === "repay-loan") {
            const loanBefore = this.simulation.getState().economy.outstandingLoan;
            this.executeCommand({ type: "repay-loan" });
            const loanAfter = this.simulation.getState().economy.outstandingLoan;
            return [loanAfter < loanBefore ? "loan.repaid" : "loan.repay-blocked"];
        }
        if (action.action === "run-finance-audit") {
            const auditsBefore = this.simulation.getState().financeLedger.auditsRun;
            this.executeCommand({ type: "run-finance-audit" });
            const auditsAfter = this.simulation.getState().financeLedger.auditsRun;
            return [auditsAfter > auditsBefore ? "finance.audit-run" : "finance.audit-blocked"];
        }
        if (action.action === "run-marketing-campaign") {
            const eventCountBefore = this.simulation.getState().events.totalEmitted;
            this.executeCommand({ type: "run-marketing-campaign" });
            const eventCountAfter = this.simulation.getState().events.totalEmitted;
            return [eventCountAfter > eventCountBefore ? "marketing.launched" : "marketing.blocked"];
        }
        if (action.action === "start-insurance-contract") {
            const stateBefore = this.simulation.getState();
            this.executeCommand({ type: "start-insurance-contract" });
            const stateAfter = this.simulation.getState();
            return [!stateBefore.insurance.active && stateAfter.insurance.active ? "insurance.started" : "insurance.blocked"];
        }
        if (action.action === "run-awards-ceremony") {
            const stateBefore = this.simulation.getState();
            if (!evaluateScenarioAwardCriteria(this.awardCriteria, stateBefore).met) {
                return ["awards.blocked"];
            }
            const poorStatus = evaluateScenarioAwardPoorCriteria(this.awardCriteria, stateBefore);
            if (poorStatus.triggered) {
                const penalty = createAwardPenaltyOverridesFromCriteria(this.awardCriteria, poorStatus.triggeredKeys);
                if (!penalty) {
                    return ["awards.poor-blocked"];
                }
                const ceremoniesBefore = stateBefore.awards.ceremoniesRun;
                this.executeCommand({ type: "run-awards-ceremony", ...penalty });
                const ceremoniesAfter = this.simulation.getState().awards.ceremoniesRun;
                return [ceremoniesAfter > ceremoniesBefore ? "awards.penalty-applied" : "awards.poor-blocked"];
            }
            const ceremoniesBefore = this.simulation.getState().awards.ceremoniesRun;
            this.executeCommand({ type: "run-awards-ceremony" });
            const ceremoniesAfter = this.simulation.getState().awards.ceremoniesRun;
            return [ceremoniesAfter > ceremoniesBefore ? "awards.completed" : "awards.blocked"];
        }
        if (action.action === "start-research") {
            const eventCountBefore = this.simulation.getState().events.totalEmitted;
            this.executeCommand({ type: "start-research" });
            const eventCountAfter = this.simulation.getState().events.totalEmitted;
            return [eventCountAfter > eventCountBefore ? "research.started" : "research.blocked"];
        }
        if (action.action === "start-emergency-wave") {
            const emergencyEntry = this.scenarioEmergencyEntryForTick(this.simulation.getState().tick);
            if (this.emergencySchedule.length > 0 && !emergencyEntry) {
                return ["emergency.blocked"];
            }
            const stateBefore = this.simulation.getState();
            this.executeCommand({
                type: "start-emergency-wave",
                ...(emergencyEntry ? { emergencyIndex: emergencyEntry.index } : {})
            });
            const stateAfter = this.simulation.getState();
            return [!stateBefore.emergency.active && stateAfter.emergency.active ? "emergency.started" : "emergency.blocked"];
        }
        if (action.action === "start-epidemic-outbreak") {
            const stateBefore = this.simulation.getState();
            this.executeCommand({ type: "start-epidemic-outbreak" });
            const stateAfter = this.simulation.getState();
            return [!stateBefore.epidemic.active && stateAfter.epidemic.active ? "epidemic.started" : "epidemic.blocked"];
        }
        if (action.action === "train-staff") {
            const staffBefore = this.simulation.getState().entities.staff.find((staff) => staff.id === action.staffId);
            this.executeCommand({ type: "train-staff", staffId: action.staffId });
            const staffAfter = this.simulation.getState().entities.staff.find((staff) => staff.id === action.staffId);
            return [staffBefore && staffAfter && staffAfter.trainingRemainingTicks > staffBefore.trainingRemainingTicks ? "training.started" : "training.blocked"];
        }
        if (action.action === "start-vip-inspection") {
            const stateBefore = this.simulation.getState();
            this.executeCommand({ type: "start-vip-inspection" });
            const stateAfter = this.simulation.getState();
            return [!stateBefore.vipInspection.active && stateAfter.vipInspection.active ? "vip.started" : "vip.blocked"];
        }
        if (action.action === "shoot-rat") {
            const ratsBefore = this.simulation.getState().secondarySystems.ratsSighted ?? 0;
            this.executeCommand({ type: "shoot-rat", ...(typeof action.hit === "boolean" ? { hit: action.hit } : {}) });
            const ratsAfter = this.simulation.getState().secondarySystems.ratsSighted ?? 0;
            return [ratsAfter > ratsBefore ? (action.hit === false ? "rat.missed" : "rat.killed") : "rat.blocked"];
        }
        if (action.action === "water-plant") {
            const checksBefore = this.simulation.getState().secondarySystems.plantWaterChecks ?? 0;
            this.executeCommand({ type: "water-plant", ...(typeof action.watered === "boolean" ? { watered: action.watered } : {}) });
            const checksAfter = this.simulation.getState().secondarySystems.plantWaterChecks ?? 0;
            return [checksAfter > checksBefore ? (action.watered === false ? "plant.neglected" : "plant.watered") : "plant.blocked"];
        }
        if (action.action === "step-tick") {
            if (this.paused) {
                this.advanceSimulationTicks(1);
                return ["app.step"];
            }
            return [];
        }
        if (action.action === "treat-patient") {
            const treatedBefore = this.simulation.getState().treatedPatients;
            this.executeCommand({
                type: "treat-patient",
                ...(action.patientId ? { patientId: action.patientId } : {})
            });
            const treatedAfter = this.simulation.getState().treatedPatients;
            return [treatedAfter > treatedBefore ? "patient.treated.success" : "patient.treated.empty"];
        }
        if (action.action === "send-patient-home") {
            const waitingBefore = this.simulation.getState().patientsWaiting;
            this.executeCommand({ type: "send-patient-home", patientId: action.patientId });
            const waitingAfter = this.simulation.getState().patientsWaiting;
            return [waitingAfter < waitingBefore ? "patient.sent-home" : "patient.send-home-empty"];
        }
        if (action.action === "prioritize-patient") {
            const eventCountBefore = this.simulation.getState().events.totalEmitted;
            this.executeCommand({ type: "prioritize-patient", patientId: action.patientId });
            const eventCountAfter = this.simulation.getState().events.totalEmitted;
            return [eventCountAfter > eventCountBefore ? "patient.prioritized" : "patient.prioritize-empty"];
        }
        if (action.action === "give-patient-drink") {
            const eventCountBefore = this.simulation.getState().events.totalEmitted;
            this.executeCommand({ type: "give-patient-drink", patientId: action.patientId });
            const eventCountAfter = this.simulation.getState().events.totalEmitted;
            return [eventCountAfter > eventCountBefore ? "patient.drink-given" : "patient.drink-blocked"];
        }
        if (action.action === "send-patient-toilet") {
            const eventCountBefore = this.simulation.getState().events.totalEmitted;
            this.executeCommand({ type: "send-patient-toilet", patientId: action.patientId });
            const eventCountAfter = this.simulation.getState().events.totalEmitted;
            return [eventCountAfter > eventCountBefore ? "patient.toilet-used" : "patient.toilet-blocked"];
        }
        if (action.action === "staff-break-toggle") {
            this.toggleStaffBreak(action.staffId);
            return [];
        }
        if (action.action === "treatment-room-toggle") {
            this.toggleRoom(action.roomId);
            return [];
        }
        if (action.action === "fire-staff") {
            const staffBefore = this.simulation.getState().entities.staff.length;
            this.executeCommand({ type: "fire-staff", staffId: action.staffId });
            const staffAfter = this.simulation.getState().entities.staff.length;
            return [staffAfter < staffBefore ? "staff.fired" : "staff.fire-blocked"];
        }
        if (action.action === "sell-room") {
            const roomsBefore = this.simulation.getState().entities.rooms.length;
            this.executeCommand({ type: "remove-room", roomId: action.roomId });
            const roomsAfter = this.simulation.getState().entities.rooms.length;
            return [roomsAfter < roomsBefore ? "room.sold" : "room.sell-blocked"];
        }
        if (action.action === "sell-object") {
            const objectsBefore = this.simulation.getState().entities.objects?.length ?? 0;
            this.executeCommand({ type: "remove-object", objectId: action.objectId });
            const objectsAfter = this.simulation.getState().entities.objects?.length ?? 0;
            return [objectsAfter < objectsBefore ? "object.sold" : "object.sell-blocked"];
        }
        if (action.action === "repair-room") {
            const roomBefore = this.simulation.getState().entities.rooms.find((room) => room.id === action.roomId);
            const needsRepair = Boolean(roomBefore && (roomBefore.wear > 0 || roomBefore.maintenanceRemainingTicks > 0));
            this.executeCommand({ type: "repair-room", roomId: action.roomId });
            const roomAfter = this.simulation.getState().entities.rooms.find((room) => room.id === action.roomId);
            const repaired = Boolean(needsRepair && roomAfter && roomAfter.wear === 0 && roomAfter.maintenanceRemainingTicks === 0 && roomAfter.status === "open");
            return [repaired ? "room.repaired" : "room.repair-blocked"];
        }
        if (action.action === "move-staff") {
            const position = this.resolveGridPosition(action.pointer);
            if (!position) {
                return ["staff.move-blocked"];
            }
            const staffBefore = this.simulation.getState().entities.staff.find((staff) => staff.id === action.staffId);
            this.executeCommand({ type: "move-staff", staffId: action.staffId, position });
            const staffAfter = this.simulation.getState().entities.staff.find((staff) => staff.id === action.staffId);
            const moved = Boolean(staffBefore && staffAfter && (staffAfter.position.x !== staffBefore.position.x || staffAfter.position.y !== staffBefore.position.y));
            return [moved ? "staff.moved" : "staff.move-blocked"];
        }
        if (action.action === "rest-staff") {
            const staffBefore = this.simulation.getState().entities.staff.find((staff) => staff.id === action.staffId);
            this.executeCommand({ type: "rest-staff", staffId: action.staffId, restType: action.restType });
            const staffAfter = this.simulation.getState().entities.staff.find((staff) => staff.id === action.staffId);
            const rested = Boolean(staffBefore && staffAfter && staffAfter.stress < staffBefore.stress);
            return [rested ? "staff.rested" : "staff.rest-blocked"];
        }
        if (action.action === "build-room") {
            if (!this.isRoomTypeAvailable(action.roomType)) {
                return ["room.build-blocked"];
            }
            const roomsBefore = this.simulation.getState().entities.rooms.length;
            const command = {
                type: "open-room",
                roomType: action.roomType
            };
            const position = this.resolveGridPosition(action.pointer);
            if (position) {
                command.position = position;
            }
            this.executeCommand(command);
            const roomsAfter = this.simulation.getState().entities.rooms.length;
            return [roomsAfter > roomsBefore ? "room.built" : "room.build-blocked"];
        }
        if (action.action === "place-object") {
            if (!this.isObjectAvailableForTick(action.objectIndex, this.simulation.getState().tick)) {
                return ["object.place-blocked"];
            }
            const objectsBefore = this.simulation.getState().entities.objects?.length ?? 0;
            const command = {
                type: "place-object",
                objectIndex: action.objectIndex,
                ...(action.objectName ? { name: action.objectName } : {}),
                ...(Number.isInteger(action.cost) ? { cost: action.cost } : {}),
                ...(Number.isInteger(action.strength) ? { strength: action.strength } : {}),
                ...(action.orientation ? { orientation: action.orientation } : {})
            };
            const position = this.resolveGridPosition(action.pointer);
            if (position) {
                command.position = position;
            }
            this.executeCommand(command);
            const objectsAfter = this.simulation.getState().entities.objects?.length ?? 0;
            return [objectsAfter > objectsBefore ? "object.placed" : "object.place-blocked"];
        }
        if (action.action === "hire-staff") {
            if (!this.isStaffRoleAvailable(action.role)) {
                return ["staff.hire-blocked"];
            }
            const stateBeforeHire = this.simulation.getState();
            const staffBefore = stateBeforeHire.entities.staff.length;
            const command = {
                type: "hire-staff",
                role: action.role
            };
            const initialSkillLevel = this.initialStaffSkillLevelForHire(action.role, stateBeforeHire);
            if (initialSkillLevel !== null) {
                command.initialSkillLevel = initialSkillLevel;
            }
            const initialSpecialties = this.initialStaffSpecialtiesForHire(action.role, stateBeforeHire);
            if (initialSpecialties.length > 0) {
                command.initialSpecialties = initialSpecialties;
            }
            const position = this.resolveGridPosition(action.pointer);
            if (position) {
                command.position = position;
            }
            this.executeCommand(command);
            const staffAfter = this.simulation.getState().entities.staff.length;
            return [staffAfter > staffBefore ? "staff.hired" : "staff.hire-blocked"];
        }
        if (this.manualAdmissionCapacityReached()) {
            return ["patient.admit-blocked"];
        }
        const admissionProfile = this.manualAdmissionProfile(action.severity ?? 2);
        const command = {
            type: "admit-patient",
            ...admissionProfile
        };
        const position = this.resolveGridPosition(action.pointer);
        if (position) {
            command.position = position;
        }
        this.executeCommand(command);
        return ["patient.admitted"];
    }
    telemetry() {
        const state = this.simulation.getState();
        const levelObjective = this.evaluateLevelObjective(state);
        const scenarioAwardStatus = evaluateScenarioAwardCriteria(this.awardCriteria, state);
        const scenarioAwardPoorStatus = evaluateScenarioAwardPoorCriteria(this.awardCriteria, state);
        const scenarioEmergencyConfig = state.emergency.active ? undefined : this.scenarioEmergencyWaveConfigForTick(state.tick);
        const scenarioQuakeEntry = this.scenarioQuakeEntryForTick(state.tick);
        const scenarioNextQuakeEntry = scenarioQuakeEntry ? null : this.scenarioNextQuakeEntryForTick(state.tick);
        const scenarioEmergencyEntry = this.scenarioEmergencyEntryForTick(state.tick);
        const scenarioNextEmergencyEntry = scenarioEmergencyEntry ? null : this.scenarioNextEmergencyEntryForTick(state.tick);
        const effectiveExpertise = effectiveScenarioExpertise(this.expertise, state.research.level);
        const scenarioNextResearchEntry = nextScenarioResearchEntry(effectiveExpertise);
        const opponentStandings = scenarioOpponentStandings(this.scenarioOpponents, state.tick);
        const leadingOpponent = opponentStandings[0] ?? null;
        const objectiveOpponent = scenarioOpponentObjectiveLeader(this.scenarioOpponents, state.tick, this.levelObjective);
        const currentStaffMarket = this.currentStaffMarket(state.tick);
        const openGeneralTreatmentRooms = state.entities.rooms.filter((room) => room.roomType === "treatment" && room.status === "open").length;
        const openPharmacyRooms = state.entities.rooms.filter((room) => room.roomType === "pharmacy" && room.status === "open").length;
        const openOperatingTheatreRooms = state.entities.rooms.filter((room) => room.roomType === "operating-theatre" && room.status === "open").length;
        const openSpecialistRooms = state.entities.rooms.filter((room) => room.roomType === "specialist" && room.status === "open").length;
        const openPsychiatryRooms = state.entities.rooms.filter((room) => room.roomType === "psychiatry" && room.status === "open").length;
        const openInflationRooms = state.entities.rooms.filter((room) => room.roomType === "inflation-room" && room.status === "open").length;
        const openSlackTongueClinicRooms = state.entities.rooms.filter((room) => room.roomType === "slack-tongue-clinic" && room.status === "open").length;
        const openFractureClinicRooms = state.entities.rooms.filter((room) => room.roomType === "fracture-clinic" && room.status === "open").length;
        const openHairRestorationRooms = state.entities.rooms.filter((room) => room.roomType === "hair-restoration" && room.status === "open").length;
        const openJellyVatRooms = state.entities.rooms.filter((room) => room.roomType === "jelly-vat" && room.status === "open").length;
        const openDecontaminationRooms = state.entities.rooms.filter((room) => room.roomType === "decontamination" && room.status === "open").length;
        const openElectrolysisRooms = state.entities.rooms.filter((room) => room.roomType === "electrolysis" && room.status === "open").length;
        const openDnaFixerRooms = state.entities.rooms.filter((room) => room.roomType === "dna-fixer" && room.status === "open").length;
        const scenarioObjectAvailability = this.scenarioObjectAvailabilityForTick(state.tick);
        const scenarioAvailableDiseases = this.scenarioAvailableDiseases(state);
        const scenarioNextDisease = this.scenarioDiseaseForAdmission(state, scenarioAvailableDiseases);
        const scenarioNetworkCriterionStatuses = evaluateNetworkCriteria(this.networkCriteria, state);
        const awaitingSpecializedTreatmentPatients = state.entities.waitingPatients.filter((patient) => patient.status === "awaiting-treatment" &&
            patient.preferredTreatmentRoomType !== undefined &&
            patient.preferredTreatmentRoomType !== "treatment").length;
        return {
            seed: this.seed,
            scenarioInitialCash: this.initialCash,
            scenarioLevelName: this.scenarioLevelName,
            tick: state.tick,
            stateHash: this.simulation.currentHash(),
            paused: this.paused,
            speedMultiplier: this.speedMultiplier,
            admissionPolicy: this.admissionPolicy,
            patientsWaiting: state.patientsWaiting,
            treatedPatients: state.treatedPatients,
            awaitingReceptionPatients: state.hospitalLoop.awaitingReceptionPatients,
            walkingToReceptionPatients: state.hospitalLoop.walkingToReceptionPatients,
            receptionPatients: state.hospitalLoop.receptionPatients,
            queuedPatients: state.hospitalLoop.queuedPatients,
            walkingToDiagnosisPatients: state.hospitalLoop.walkingToDiagnosisPatients,
            diagnosingPatients: state.hospitalLoop.diagnosingPatients,
            diagnosedPatients: state.hospitalLoop.diagnosedPatients,
            awaitingTreatmentPatients: state.hospitalLoop.awaitingTreatmentPatients,
            walkingToTreatmentPatients: state.hospitalLoop.walkingToTreatmentPatients,
            treatingPatients: state.hospitalLoop.treatingPatients,
            dischargedPatients: state.hospitalLoop.dischargedPatients,
            patientDeaths: state.hospitalLoop.patientDeaths,
            patientWalkouts: state.hospitalLoop.patientWalkouts ?? 0,
            waitingTimesWalkoutPercent: waitingTimesWalkoutPercentForState(state),
            patientAbductions: state.secondarySystems.patientAbductions ?? 0,
            treatmentFailures: state.hospitalLoop.treatmentFailures,
            treatmentResearchLevel: state.research.level,
            treatmentResearchMaxLevel: state.research.maxLevel,
            treatmentResearchActive: state.research.active,
            treatmentResearchRemainingTicks: state.research.remainingTicks,
            treatmentResearchProjectCost: state.research.projectCost,
            treatmentResearchProjectTicks: state.research.projectTicks,
            treatmentResearchTotalInvestment: state.research.totalInvestment ?? 0,
            treatmentResearchActiveResearchers: state.research.activeResearchers,
            treatmentResearchTicksPerTick: state.research.ticksPerTick,
            treatmentResearchSuccessBonus: state.research.successBonus,
            ratSightings: state.secondarySystems.ratsSighted ?? 0,
            ratKills: state.secondarySystems.ratsKilled ?? 0,
            ratKillPercentage: state.secondarySystems.ratKillPercentage ?? 0,
            plantWaterChecks: state.secondarySystems.plantWaterChecks ?? 0,
            plantsWatered: state.secondarySystems.plantsWatered ?? 0,
            plantWateredPercentage: state.secondarySystems.plantWateredPercentage ?? 0,
            treatmentResearchAutopsyTicks: state.research.autopsyResearchTicks ?? 0,
            treatmentResearchAutopsyReputationPenalty: state.research.autopsyReputationPenalty ?? 0,
            scenarioResearchStartRating: this.researchSettings.startRating ?? null,
            scenarioResearchPointsDivisor: this.researchSettings.researchPointsDivisor ?? 1,
            scenarioResearchStartCost: this.researchSettings.startCost ?? null,
            scenarioResearchMinDrugCost: this.researchSettings.minDrugCost ?? null,
            scenarioResearchDrugImproveRate: this.researchSettings.drugImproveRate ?? null,
            scenarioResearchMaxObjectStrength: this.researchSettings.maxObjectStrength ?? null,
            scenarioResearchIncrement: this.researchSettings.researchIncrement ?? null,
            scenarioResearchImproveCostPercent: this.researchSettings.researchImproveCostPercent ?? null,
            scenarioResearchImproveIncrementPercent: this.researchSettings.researchImproveIncrementPercent ?? null,
            scenarioTrainingRate: this.trainingSettings.trainingRate ?? null,
            scenarioTrainingValueCount: this.trainingSettings.trainingValues?.length ?? 0,
            scenarioTrainingAbilityThresholdCount: this.trainingSettings.abilityThresholds?.length ?? 0,
            scenarioTrainingAbilityThresholds: formatTrainingAbilityThresholds(this.trainingSettings),
            scenarioPromotionDoctorMonths: this.trainingSettings.promotionDoctorMonths ?? null,
            scenarioPromotionConsultantMonths: this.trainingSettings.promotionConsultantMonths ?? null,
            scenarioDoctorThreshold: this.trainingSettings.doctorThreshold ?? null,
            scenarioConsultantThreshold: this.trainingSettings.consultantThreshold ?? null,
            scenarioEpidemicHowContagious: this.epidemicSettings.howContagious ?? null,
            scenarioEpidemicContagiousSpreadFactor: this.epidemicSettings.contagiousSpreadFactor ?? null,
            scenarioEpidemicReduceContagiousMonths: this.epidemicSettings.reduceContagiousMonths ?? null,
            scenarioEpidemicReduceContagiousPeepCount: this.epidemicSettings.reduceContagiousPeepCount ?? null,
            scenarioEpidemicReduceContagiousRate: this.epidemicSettings.reduceContagiousRate ?? null,
            scenarioEpidemicFine: this.epidemicSettings.fine ?? null,
            scenarioEpidemicCompensationLow: this.epidemicSettings.compensationLow ?? null,
            scenarioEpidemicCompensationHigh: this.epidemicSettings.compensationHigh ?? null,
            scenarioLandCostPerTile: this.landSettings.landCostPerTile ?? null,
            scenarioStaffRestStanding: this.staffFatigueSettings.restStanding ?? null,
            scenarioStaffRestSofa: this.staffFatigueSettings.restSofa ?? null,
            scenarioStaffRestGame: this.staffFatigueSettings.restGame ?? null,
            scenarioStaffRestSnooker: this.staffFatigueSettings.restSnooker ?? null,
            scenarioStaffWorkLight: this.staffFatigueSettings.workLight ?? null,
            scenarioStaffModifyFrequency: this.staffFatigueSettings.modifyFrequency ?? null,
            scenarioStaffNotTired: this.staffFatigueSettings.notTired ?? null,
            scenarioStaffTired: this.staffFatigueSettings.tired ?? null,
            scenarioStaffVeryTired: this.staffFatigueSettings.veryTired ?? null,
            scenarioStaffFatigueCrackUpTired: this.staffFatigueSettings.crackUpTired ?? null,
            scenarioStaffRecoveryFactor: this.staffFatigueSettings.recoveryFactor ?? null,
            scenarioStaffFatigueRecoveryMinimum: this.staffFatigueSettings.recoveryMinimum ?? null,
            scenarioStaffResignMax: this.staffFatigueSettings.resignMax ?? null,
            scenarioPatientLeaveMax: this.patientBehaviorSettings.leaveMax ?? null,
            scenarioPatientHappy: this.patientBehaviorSettings.happy ?? null,
            scenarioPatientUnhappy: this.patientBehaviorSettings.unhappy ?? null,
            scenarioPatientVeryUnhappy: this.patientBehaviorSettings.veryUnhappy ?? null,
            scenarioPatientLitterDrop: this.patientBehaviorSettings.litterDrop ?? null,
            scenarioPatientLitterRandom: this.patientBehaviorSettings.litterRandom ?? null,
            scenarioPatientBowelFull: this.patientBehaviorSettings.bowelFull ?? null,
            scenarioPatientBowelOverflows: this.patientBehaviorSettings.bowelOverflows ?? null,
            scenarioPatientDrinkHappy: this.patientBehaviorSettings.drinkHappy ?? null,
            scenarioPatientToiletHappy: this.patientBehaviorSettings.toiletHappy ?? null,
            scenarioPatientVomitLimit: this.patientBehaviorSettings.vomitLimit ?? null,
            scenarioSalaryAbilityDivisor: this.salarySettings.salaryAbilityDivisor ?? null,
            scenarioSalaryTooLow: this.salarySettings.salaryTooLow ?? null,
            scenarioSalaryTooHigh: this.salarySettings.salaryTooHigh ?? null,
            scenarioSalaryAddCount: this.salarySettings.salaryAdds?.length ?? 0,
            scenarioAllocationRandomWeight: this.allocationSettings.randomWeight ?? null,
            scenarioAllocationTotalReputationWeight: this.allocationSettings.totalReputationWeight ?? null,
            scenarioAllocationIllnessReputationWeight: this.allocationSettings.illnessReputationWeight ?? null,
            scenarioAllocationDelayMonths: this.allocationSettings.delayMonths ?? null,
            scenarioAllocationDelayTicks: this.autoAdmissionDelayTicks(),
            scenarioRoutingQueuePoints: this.routingSettings.queuePoints ?? null,
            scenarioRoutingDistancePoints: this.routingSettings.distancePoints ?? null,
            scenarioRoutingNoStaffPoints: this.routingSettings.noStaffPoints ?? null,
            scenarioRoutingNoStaffAdmissionPenaltyTicks: this.autoAdmissionNoStaffPenaltyTicks(state),
            scenarioScoreMaxIncrease: this.eventSettings.scoreMaxIncrease ?? null,
            scenarioVaccinationCost: this.eventSettings.vaccinationCost ?? null,
            scenarioRemoveRatHoleChance: this.eventSettings.removeRatHoleChance ?? null,
            scenarioMinimumAbductionYears: this.eventSettings.minimumAbductionYears ?? null,
            scenarioAbductionsPerYear: this.eventSettings.abductionsPerYear ?? null,
            scenarioAutopsyResearchPercent: this.eventSettings.autopsyResearchPercent ?? null,
            scenarioAutopsyReputationHitPercent: this.eventSettings.autopsyReputationHitPercent ?? null,
            scenarioMayorLaunch: this.eventSettings.mayorLaunch ?? null,
            scenarioDisasterLaunch: this.eventSettings.disasterLaunch ?? null,
            scenarioExpertiseCount: this.expertise.length,
            scenarioKnownExpertiseCount: effectiveExpertise.filter((entry) => entry.known).length,
            scenarioResearchRequiredExpertiseCount: effectiveExpertise.filter((entry) => !entry.known && entry.researchRequired > 0).length,
            scenarioNextResearchRequired: scenarioNextResearchEntry?.researchRequired ?? null,
            scenarioNextResearchToken: scenarioNextResearchEntry?.token ?? "",
            scenarioNextResearchDiseaseId: scenarioNextResearchEntry?.diseaseId ?? "",
            scenarioNextResearchCategory: scenarioNextResearchEntry?.category ?? "",
            scenarioTreatmentPriceOverrideCount: Object.keys(createDiseaseTreatmentPricesFromExpertise(this.expertise)).length,
            scenarioDiagnosisCapability: this.scenarioDiagnosisCapability(state),
            scenarioDiagnosableExpertiseCount: effectiveExpertise.filter((entry) => entry.maxDiagDifficulty === undefined || entry.maxDiagDifficulty <= this.scenarioDiagnosisCapability(state)).length,
            scenarioOpponentCount: this.scenarioOpponents.length,
            scenarioActiveOpponentCount: this.scenarioOpponents.filter((entry) => entry.playing).length,
            scenarioOpponentNames: this.scenarioOpponents.filter((entry) => entry.playing).map((entry) => entry.name).join(", "),
            scenarioOpponentLeaderName: leadingOpponent?.name ?? "",
            scenarioOpponentLeaderCures: leadingOpponent?.cures ?? 0,
            scenarioOpponentLeaderValue: leadingOpponent?.value ?? 0,
            scenarioOpponentLeaderReputation: leadingOpponent?.reputation ?? 0,
            scenarioOpponentObjectiveLeaderName: objectiveOpponent?.name ?? "",
            scenarioOpponentStandings: opponentStandings.map((entry) => ({
                index: entry.index,
                name: entry.name,
                cures: entry.cures,
                value: entry.value,
                reputation: entry.reputation
            })),
            emergencyActive: state.emergency.active,
            emergencyWaveId: state.emergency.waveId,
            emergencyRemainingTicks: state.emergency.remainingTicks,
            emergencyTotalPatients: state.emergency.totalPatients,
            emergencyRemainingPatients: state.emergency.remainingPatients,
            emergencyTreatedPatients: state.emergency.treatedPatients,
            emergencyFailedPatients: state.emergency.failedPatients,
            emergencyWavesStarted: state.emergency.wavesStarted,
            emergencySuccessfulWaves: state.emergency.successfulWaves,
            emergencyFailedWaves: state.emergency.failedWaves,
            emergencySuccessPercent: emergencySuccessPercentForState(state),
            emergencyPatientCount: scenarioEmergencyConfig?.patientCount ?? state.emergency.patientCount,
            emergencyDurationTicks: scenarioEmergencyConfig?.durationTicks ?? state.emergency.durationTicks,
            emergencyRewardCash: scenarioEmergencyConfig?.rewardCash ?? state.emergency.rewardCash,
            emergencyRewardReputation: scenarioEmergencyConfig?.rewardReputation ?? state.emergency.rewardReputation,
            emergencyPercentToWin: scenarioEmergencyConfig?.percentToWin ?? state.emergency.percentToWin,
            emergencyDiseaseId: scenarioEmergencyConfig?.diseaseId ?? state.emergency.diseaseId ?? "",
            emergencyRequiredTreatedPatients: state.emergency.active
                ? state.emergency.requiredTreatedPatients
                : Math.max(0, Math.ceil((scenarioEmergencyConfig?.patientCount ?? state.emergency.patientCount) * (scenarioEmergencyConfig?.percentToWin ?? state.emergency.percentToWin) / 100)),
            epidemicActive: state.epidemic.active,
            epidemicOutbreakId: state.epidemic.outbreakId,
            epidemicRemainingTicks: state.epidemic.remainingTicks,
            epidemicTotalPatients: state.epidemic.totalPatients,
            epidemicRemainingPatients: state.epidemic.remainingPatients,
            epidemicTreatedPatients: state.epidemic.treatedPatients,
            epidemicFailedPatients: state.epidemic.failedPatients,
            epidemicOutbreaksStarted: state.epidemic.outbreaksStarted,
            epidemicContainedOutbreaks: state.epidemic.containedOutbreaks,
            epidemicFailedOutbreaks: state.epidemic.failedOutbreaks,
            epidemicSpreadPatients: state.epidemic.spreadPatients,
            epidemicOutbreakSpreadPatients: state.epidemic.outbreakSpreadPatients,
            epidemicRemainingSpreadPatients: state.epidemic.remainingSpreadPatients,
            epidemicNextSpreadTick: state.epidemic.nextSpreadTick,
            epidemicSpreadSlowdownActive: state.epidemic.spreadSlowdownActive ?? false,
            epidemicPatientCount: state.epidemic.patientCount,
            epidemicSeverity: state.epidemic.severity,
            epidemicDurationTicks: state.epidemic.durationTicks,
            epidemicSpreadIntervalTicks: state.epidemic.spreadIntervalTicks,
            epidemicMaxSpreadPatients: state.epidemic.maxSpreadPatients,
            epidemicSpreadChancePercent: state.epidemic.spreadChancePercent,
            epidemicRewardCash: state.epidemic.rewardCash,
            epidemicRewardCashMin: state.epidemic.rewardCashMin ?? state.epidemic.rewardCash,
            epidemicRewardCashMax: state.epidemic.rewardCashMax ?? state.epidemic.rewardCash,
            epidemicRewardReputation: state.epidemic.rewardReputation,
            epidemicPenaltyCash: state.epidemic.penaltyCash,
            epidemicPenaltyReputation: state.epidemic.penaltyReputation,
            epidemicVaccinationCost: state.epidemic.vaccinationCost ?? 0,
            epidemicTotalVaccinationCosts: state.epidemic.totalVaccinationCosts ?? 0,
            vipInspectionActive: state.vipInspection.active,
            vipInspectionVisitId: state.vipInspection.visitId,
            vipInspectionRemainingTicks: state.vipInspection.remainingTicks,
            vipInspectionVisitsStarted: state.vipInspection.visitsStarted,
            vipInspectionPassedVisits: state.vipInspection.passedVisits,
            vipInspectionFailedVisits: state.vipInspection.failedVisits,
            vipInspectionDurationTicks: state.vipInspection.durationTicks,
            vipInspectionMaxQueuePressure: state.vipInspection.maxQueuePressure,
            vipInspectionMinReputation: state.vipInspection.minReputation,
            vipInspectionRewardCash: state.vipInspection.rewardCash,
            vipInspectionRewardReputation: state.vipInspection.rewardReputation,
            vipInspectionPenaltyCash: state.vipInspection.penaltyCash,
            vipInspectionPenaltyReputation: state.vipInspection.penaltyReputation,
            vipInspectionCurrentQueuePressure: state.vipInspection.currentQueuePressure,
            vipInspectionCurrentOpenRooms: state.vipInspection.currentOpenRooms,
            admissionsOpen: this.admissionsOpen,
            nextAdmissionInTicks: this.nextAutoAdmissionInTicks(state.tick),
            autoAdmissionIntervalTicks: this.autoAdmissionIntervalTicks(state.tick),
            autoAdmissionWaitingCap: this.autoAdmissionWaitingCap(state.tick),
            scenarioIllnessRate: this.scenarioIllnessRate,
            scenarioPopulationChange: this.scenarioPopulationChangeForTick(state.tick),
            scenarioDiseasePoolSize: this.diseasePool.length,
            scenarioAvailableDiseaseCount: scenarioAvailableDiseases.length,
            scenarioNextDiseaseId: scenarioNextDisease?.diseaseId ?? "",
            scenarioNextDiseaseToken: scenarioNextDisease?.token ?? "",
            scenarioHoldVisualMonths: this.admissionRules.holdVisualMonths ?? 0,
            scenarioHoldVisualPeepCount: this.admissionRules.holdVisualPeepCount ?? 0,
            scenarioRoomCostOverrides: cloneRoomCostOverrides(this.roomCostOverrides),
            scenarioRoomWearThresholdOverrides: cloneRoomWearThresholdOverrides(this.roomWearThresholdOverrides),
            scenarioRoomWearResearchMaxStrength: this.researchSettings.maxObjectStrength ?? null,
            scenarioObjectAvailabilityCount: scenarioObjectAvailability.total,
            scenarioObjectAvailableCount: scenarioObjectAvailability.available,
            scenarioObjectLockedCount: scenarioObjectAvailability.locked,
            scenarioObjectDisabledCount: scenarioObjectAvailability.disabled,
            scenarioObjectResearchLockedCount: scenarioObjectAvailability.researchLocked,
            scenarioObjectAvailableIndices: [...scenarioObjectAvailability.availableIndices],
            scenarioObjectLockedIndices: [...scenarioObjectAvailability.lockedIndices],
            scenarioObjectDisabledIndices: [...scenarioObjectAvailability.disabledIndices],
            scenarioObjectResearchLockedIndices: [...scenarioObjectAvailability.researchLockedIndices],
            scenarioStaffWageOverrides: cloneStaffWageOverrides(this.staffWageOverrides),
            staffMarketDoctorsAvailable: this.staffMarketRemainingForRole("diagnostician", state),
            staffMarketNursesAvailable: this.staffMarketRemainingForRole("nurse", state),
            staffMarketHandymenAvailable: this.staffMarketRemainingForRole("handyman", state),
            staffMarketReceptionistsAvailable: this.staffMarketRemainingForRole("receptionist", state),
            activeReceptionists: this.activeReceptionistCount(state),
            frontDeskCapacity: this.frontDeskCapacity(state),
            scenarioStaffMarketMonth: currentStaffMarket?.month ?? null,
            scenarioStaffMarketReceptionists: currentStaffMarket?.receptionists ?? null,
            scenarioStaffMarketSeed: currentStaffMarket?.seed ?? null,
            scenarioStaffMarketShrinkRate: currentStaffMarket?.shrinkRate ?? null,
            scenarioStaffMarketSurgeonRate: currentStaffMarket?.surgeonRate ?? null,
            scenarioStaffMarketResearcherRate: currentStaffMarket?.researcherRate ?? null,
            scenarioStaffMarketConsultantRate: currentStaffMarket?.consultantRate ?? null,
            scenarioStaffMarketJuniorRate: currentStaffMarket?.juniorRate ?? null,
            roomAvailabilityStatus: this.availableRoomTypesForTick(state.tick).join(","),
            activeStaff: state.staffLifecycle.activeStaff,
            onBreakStaff: state.staffLifecycle.onBreakStaff,
            trainingStaff: state.staffTraining.activeTrainingStaff,
            trainedStaff: state.staffTraining.trainedStaff,
            totalStaffSkillLevel: state.staffTraining.totalSkillLevel,
            maxStaffSkillLevel: state.staffTraining.maxSkillLevel,
            staffTrainingCost: state.staffTraining.trainingCost,
            staffTrainingTicks: state.staffTraining.trainingTicks,
            staffTrainingStarted: state.staffTraining.trainingStarted,
            staffTrainingCompleted: state.staffTraining.trainingCompleted,
            activeHandymen: state.maintenanceStaff.activeHandymen,
            totalHandymen: state.maintenanceStaff.totalHandymen,
            maintenanceStaffRepairBonusTicks: state.maintenanceStaff.repairBonusTicks,
            maintenanceStaffRepairEvents: state.maintenanceStaff.totalRepairEvents,
            openDiagnosisRooms: state.roomOperations.openDiagnosisRooms,
            openTreatmentRooms: state.roomOperations.openTreatmentRooms,
            openGeneralTreatmentRooms,
            openPharmacyRooms,
            openOperatingTheatreRooms,
            openSpecialistRooms,
            openPsychiatryRooms,
            openInflationRooms,
            openSlackTongueClinicRooms,
            openFractureClinicRooms,
            openHairRestorationRooms,
            openJellyVatRooms,
            openDecontaminationRooms,
            openElectrolysisRooms,
            openDnaFixerRooms,
            specializedTreatmentRooms: openPharmacyRooms + openOperatingTheatreRooms + openSpecialistRooms + openPsychiatryRooms + openInflationRooms + openSlackTongueClinicRooms + openFractureClinicRooms + openHairRestorationRooms + openJellyVatRooms + openDecontaminationRooms + openElectrolysisRooms + openDnaFixerRooms,
            awaitingSpecializedTreatmentPatients,
            cash: state.cash,
            reputation: state.reputation,
            tickIncome: state.economy.tickIncome,
            tickExpenses: state.economy.tickExpenses,
            tickNetCashflow: state.economy.tickNet,
            cumulativeIncome: state.economy.cumulativeIncome,
            cumulativeExpenses: state.economy.cumulativeExpenses,
            cumulativeNetCashflow: state.economy.cumulativeNet,
            treatmentPricingPolicy: state.economy.treatmentPricingPolicy,
            outstandingLoan: state.economy.outstandingLoan,
            loanInterestExpense: state.economy.loanInterestExpense,
            cumulativeLoanInterest: state.economy.cumulativeLoanInterest,
            loanChunkAmount: state.economy.loanChunkAmount,
            loanMaxOutstanding: state.economy.loanMaxOutstanding,
            scenarioLoanInterestPerChunk: this.loanInterestPerChunk,
            financeAuditCashRecovery: state.economy.financeAuditCashRecovery,
            financeAuditCooldownTicks: state.economy.financeAuditCooldownTicks,
            financeLedgerUnlocked: state.financeLedger.unlocked,
            financeAuditReady: state.financeLedger.ready,
            financeAuditCooldownRemainingTicks: state.financeLedger.cooldownRemainingTicks,
            financeAuditsRun: state.financeLedger.auditsRun,
            financeAuditTotalRecoveredCash: state.financeLedger.totalRecoveredCash,
            marketingCampaignCost: state.economy.marketingCampaignCost,
            marketingCampaignReputationGain: state.economy.marketingCampaignReputationGain,
            insuranceContractUnlocked: state.insurance.unlocked,
            insuranceContractActive: state.insurance.active,
            insuranceContractId: state.insurance.contractId,
            insuranceContractRemainingTicks: state.insurance.remainingTicks,
            insuranceContractTotalPatients: state.insurance.totalPatients,
            insuranceContractRemainingPatients: state.insurance.remainingPatients,
            insuranceContractCompletedPatients: state.insurance.completedPatients,
            insuranceContractFailedPatients: state.insurance.failedPatients,
            insuranceContractsStarted: state.insurance.contractsStarted,
            insuranceContractsCompleted: state.insurance.completedContracts,
            insuranceContractsFailed: state.insurance.failedContracts,
            insuranceContractPatientCount: state.insurance.patientCount,
            insuranceContractSeverity: state.insurance.severity,
            insuranceContractDurationTicks: state.insurance.durationTicks,
            insuranceContractRewardCash: state.insurance.rewardCash,
            insuranceContractRewardReputation: state.insurance.rewardReputation,
            insuranceContractPenaltyCash: state.insurance.penaltyCash,
            insuranceContractPenaltyReputation: state.insurance.penaltyReputation,
            hospitalRatingScore: state.awards.currentScore,
            hospitalRatingTier: state.awards.currentTier,
            hospitalAwardRewardCash: state.awards.currentRewardCash,
            hospitalAwardRewardReputation: state.awards.currentRewardReputation,
            hospitalAwardCeremoniesRun: state.awards.ceremoniesRun,
            hospitalAwardTotalCashReward: state.awards.totalCashReward,
            hospitalAwardTotalReputationReward: state.awards.totalReputationReward,
            hospitalAwardLastTier: state.awards.lastTier,
            hospitalAwardLastScore: state.awards.lastScore,
            scenarioAwardCriteria: cloneAwardCriteria(this.awardCriteria),
            scenarioAwardCriteriaSummary: formatScenarioAwardCriteria(this.awardCriteria),
            scenarioAwardCriteriaMet: scenarioAwardStatus.met,
            scenarioAwardCriteriaUnmetSummary: scenarioAwardStatus.unmetSummary,
            scenarioAwardPoorCriteriaSummary: formatScenarioAwardPoorCriteria(this.awardCriteria),
            scenarioAwardPoorCriteriaTriggered: scenarioAwardPoorStatus.triggered,
            scenarioAwardPoorCriteriaTriggeredSummary: scenarioAwardPoorStatus.triggeredSummary,
            scenarioEmergencyScheduleSize: this.emergencySchedule.length,
            scenarioEmergencyActiveIndex: scenarioEmergencyEntry?.index ?? null,
            scenarioEmergencyActiveDiseaseId: scenarioEmergencyEntry?.diseaseId ?? "",
            scenarioEmergencyActiveIllnessCode: scenarioEmergencyEntry?.illnessCode ?? null,
            scenarioNextEmergencyIndex: scenarioNextEmergencyEntry?.index ?? null,
            scenarioNextEmergencyStartMonth: scenarioNextEmergencyEntry?.startMonth ?? null,
            scenarioNextEmergencyEndMonth: scenarioNextEmergencyEntry?.endMonth ?? null,
            scenarioNextEmergencyMinPatients: scenarioNextEmergencyEntry?.minPatients ?? null,
            scenarioNextEmergencyMaxPatients: scenarioNextEmergencyEntry?.maxPatients ?? null,
            scenarioNextEmergencyPercentToWin: scenarioNextEmergencyEntry?.percentToWin ?? null,
            scenarioNextEmergencyDiseaseId: scenarioNextEmergencyEntry?.diseaseId ?? "",
            scenarioNextEmergencyIllnessCode: scenarioNextEmergencyEntry?.illnessCode ?? null,
            scenarioQuakeScheduleSize: this.quakeSchedule.length,
            scenarioQuakeActiveIndex: scenarioQuakeEntry?.index ?? null,
            scenarioQuakeSeverity: scenarioQuakeEntry?.severity ?? 0,
            scenarioNextQuakeIndex: scenarioNextQuakeEntry?.index ?? null,
            scenarioNextQuakeStartMonth: scenarioNextQuakeEntry?.startMonth ?? null,
            scenarioNextQuakeEndMonth: scenarioNextQuakeEntry?.endMonth ?? null,
            scenarioNextQuakeSeverity: scenarioNextQuakeEntry?.severity ?? null,
            scenarioQuakesTriggered: this.commandHistory.filter((command) => command.type === "apply-earthquake").length,
            scenarioAbductionsTriggered: this.commandHistory.filter((command) => command.type === "apply-alien-abduction").length,
            scenarioNetworkCriteria: cloneNetworkCriteria(this.networkCriteria),
            scenarioNetworkCriteriaCount: this.networkCriteria.length,
            scenarioNetworkCriteriaSummary: this.networkCriteria.length > 0
                ? this.networkCriteria.map((criterion) => `${criterion.metric} ${criterion.value} by month ${criterion.month}`).join("; ")
                : "none",
            scenarioNetworkCriteriaStatuses: scenarioNetworkCriterionStatuses,
            scenarioNetworkCriteriaMetCount: scenarioNetworkCriterionStatuses.filter((criterion) => criterion.status === "met").length,
            scenarioNetworkCriteriaActiveCount: scenarioNetworkCriterionStatuses.filter((criterion) => criterion.status === "active").length,
            scenarioNetworkCriteriaMissedCount: scenarioNetworkCriterionStatuses.filter((criterion) => criterion.status === "missed").length,
            milestoneLevel: state.progression.milestoneLevel,
            unlockedSystems: state.progression.unlockedUnlocks.length,
            unlockedSystemIds: state.progression.unlockedUnlocks.join(","),
            nextMilestone: state.progression.nextMilestone ?? "",
            remainingDischargesToNextMilestone: state.progression.remainingDischargesToNextMilestone,
            recurringIncomeBonus: state.progression.recurringIncomeBonus,
            totalEvents: state.events.totalEmitted,
            lastEventType: state.events.recent[state.events.recent.length - 1]?.type ?? null,
            recentEventFeed: createRecentEventFeed(state.events),
            advisorStatus: createAdvisorStatus(state, levelObjective),
            queuePressure: state.secondarySystems.queuePressure,
            queuePressureStatus: state.secondarySystems.queuePressureStatus,
            criticalPatients: state.secondarySystems.criticalPatients,
            lowestPatientHealth: state.secondarySystems.lowestPatientHealth,
            happyPatients: state.secondarySystems.happyPatients ?? 0,
            unhappyPatients: state.secondarySystems.unhappyPatients ?? 0,
            veryUnhappyPatients: state.secondarySystems.veryUnhappyPatients ?? 0,
            peepHappinessPercent: peepHappinessPercentForState(state),
            patientVomits: state.secondarySystems.patientVomits ?? 0,
            patientLitter: state.secondarySystems.patientLitter ?? 0,
            currentPatientLitter: state.secondarySystems.currentPatientLitter ?? 0,
            patientLitterCleaned: state.secondarySystems.patientLitterCleaned ?? 0,
            cleanlinessLitterPercent: cleanlinessLitterPercentForState(state),
            patientsNeedingToilet: state.secondarySystems.patientsNeedingToilet ?? 0,
            patientBowelOverflows: state.secondarySystems.patientBowelOverflows ?? 0,
            patientDrinks: state.secondarySystems.patientDrinks ?? 0,
            staffHappinessPercent: staffHappinessPercentForState(state),
            stressedStaff: state.secondarySystems.stressedStaff,
            tiredStaff: state.secondarySystems.tiredStaff ?? 0,
            veryTiredStaff: state.secondarySystems.veryTiredStaff ?? 0,
            underpaidStaff: state.secondarySystems.underpaidStaff ?? 0,
            overpaidStaff: state.secondarySystems.overpaidStaff ?? 0,
            autoBreakStaff: state.secondarySystems.autoBreakStaff,
            roomsInMaintenance: state.secondarySystems.roomsInMaintenance,
            wornRoomPercent: wornRoomPercentForState(state),
            queuePressureEvents: state.secondarySystems.queuePressureEvents,
            staffBurnoutEvents: state.secondarySystems.staffBurnoutEvents,
            staffRecoveryEvents: state.secondarySystems.staffRecoveryEvents,
            roomMaintenanceStartEvents: state.secondarySystems.roomMaintenanceStartEvents,
            roomMaintenanceCompleteEvents: state.secondarySystems.roomMaintenanceCompleteEvents,
            levelObjectiveStatus: levelObjective.status,
            levelObjectiveReason: levelObjective.reason,
            levelObjectiveRequiredDischarges: levelObjective.requiredDischarges,
            levelObjectiveRemainingDischarges: levelObjective.remainingDischarges,
            levelObjectiveMinimumCash: levelObjective.minimumCash,
            levelObjectiveMinimumReputation: levelObjective.minimumReputation,
            levelObjectiveMinimumTreatmentPercentage: levelObjective.minimumTreatmentPercentage,
            levelObjectiveCurrentTreatmentPercentage: levelObjective.currentTreatmentPercentage,
            levelObjectiveMinimumHospitalValue: levelObjective.minimumHospitalValue,
            levelObjectiveCurrentHospitalValue: levelObjective.currentHospitalValue,
            levelObjectiveBankruptcyCashThreshold: levelObjective.bankruptcyCashThreshold,
            levelObjectiveReputationFailureThreshold: levelObjective.reputationFailureThreshold,
            levelObjectiveMaximumDeaths: levelObjective.maximumDeaths,
            levelObjectiveRemainingDeaths: levelObjective.remainingDeaths
        };
    }
    isLostLevel() {
        return this.evaluateLevelObjective(this.simulation.getState()).status === "lost";
    }
    evaluateLevelObjective(state) {
        const remainingDischarges = Math.max(0, this.levelObjective.requiredDischarges - state.hospitalLoop.dischargedPatients);
        const treatmentPercentage = state.counters.totalAdmissions === 0
            ? 100
            : Math.floor((state.hospitalLoop.dischargedPatients / state.counters.totalAdmissions) * 100);
        const hospitalValue = estimateHospitalValue(state);
        const remainingDeaths = this.levelObjective.maximumDeaths === Number.POSITIVE_INFINITY
            ? Number.POSITIVE_INFINITY
            : Math.max(0, this.levelObjective.maximumDeaths - state.hospitalLoop.patientDeaths);
        const details = {
            ...this.levelObjective,
            remainingDischarges,
            currentTreatmentPercentage: treatmentPercentage,
            currentHospitalValue: hospitalValue,
            remainingDeaths
        };
        if (this.levelOutcome) {
            return {
                ...details,
                status: this.levelOutcome.status,
                reason: this.levelOutcome.reason
            };
        }
        if (state.cash <= this.levelObjective.bankruptcyCashThreshold) {
            this.levelOutcome = { status: "lost", reason: "bankruptcy" };
            return {
                ...details,
                status: "lost",
                reason: "bankruptcy"
            };
        }
        if (state.reputation <= this.levelObjective.reputationFailureThreshold) {
            this.levelOutcome = { status: "lost", reason: "reputation" };
            return {
                ...details,
                status: "lost",
                reason: "reputation"
            };
        }
        if (state.hospitalLoop.patientDeaths > this.levelObjective.maximumDeaths) {
            this.levelOutcome = { status: "lost", reason: "deaths" };
            return {
                ...details,
                status: "lost",
                reason: "deaths"
            };
        }
        const objectiveOpponent = scenarioOpponentObjectiveLeader(this.scenarioOpponents, state.tick, this.levelObjective);
        if (objectiveOpponent) {
            this.levelOutcome = { status: "lost", reason: "rival-objectives" };
            return {
                ...details,
                status: "lost",
                reason: "rival-objectives"
            };
        }
        if (remainingDischarges === 0 &&
            state.cash >= this.levelObjective.minimumCash &&
            state.reputation >= this.levelObjective.minimumReputation &&
            treatmentPercentage >= this.levelObjective.minimumTreatmentPercentage &&
            hospitalValue >= this.levelObjective.minimumHospitalValue) {
            this.levelOutcome = { status: "won", reason: "objectives-complete" };
            return {
                ...details,
                status: "won",
                reason: "objectives-complete"
            };
        }
        return {
            ...details,
            status: "running",
            reason: null
        };
    }
    getState() {
        return this.simulation.getState();
    }
    evaluatePlacement(action) {
        const position = this.resolveGridPosition(action.pointer);
        if (!position) {
            return {
                action: action.action,
                valid: false,
                reason: "missing-position",
                cost: 0,
                position: null,
                requestedPosition: null,
                tiles: []
            };
        }
        if (action.action === "build-room") {
            if (!this.isRoomTypeAvailable(action.roomType)) {
                return {
                    action: "build-room",
                    type: "room",
                    roomType: action.roomType,
                    valid: false,
                    reason: "room-unavailable",
                    cost: 0,
                    position,
                    requestedPosition: position,
                    tiles: [position]
                };
            }
            return {
                action: "build-room",
                ...this.simulation.evaluateRoomPlacement(action.roomType, position, { charge: true })
            };
        }
        if (action.action === "place-object") {
            if (!this.isObjectAvailableForTick(action.objectIndex, this.simulation.getState().tick)) {
                const position = this.resolveGridPosition(action.pointer);
                return {
                    action: "place-object",
                    type: "object",
                    objectIndex: action.objectIndex,
                    valid: false,
                    reason: "object-unavailable",
                    cost: Number.isInteger(action.cost) && action.cost > 0 ? action.cost : 0,
                    ...(action.orientation ? { orientation: action.orientation } : {}),
                    position,
                    requestedPosition: position,
                    tiles: position ? [position] : []
                };
            }
            return {
                action: "place-object",
                ...(action.orientation ? { orientation: action.orientation } : {}),
                ...this.simulation.evaluateObjectPlacement(action.objectIndex, position, {
                    charge: true,
                    cost: action.cost
                })
            };
        }
        if (action.action === "hire-staff") {
            if (!this.isStaffRoleAvailable(action.role)) {
                return {
                    action: "hire-staff",
                    type: "staff",
                    role: action.role,
                    valid: false,
                    reason: "staff-market-empty",
                    cost: 0,
                    position,
                    requestedPosition: position,
                    tiles: [position]
                };
            }
            return {
                action: "hire-staff",
                ...this.simulation.evaluateStaffPlacement(action.role, position, { charge: true })
            };
        }
        if (action.action === "move-staff") {
            return {
                action: "move-staff",
                ...this.simulation.evaluateStaffMove(action.staffId, position)
            };
        }
        return {
            action: action.action,
            valid: true,
            reason: null,
            cost: 0,
            position,
            requestedPosition: position,
            tiles: [position]
        };
    }
    executeCommand(command) {
        if (command.type === "start-emergency-wave") {
            this.simulation.startEmergencyWave(this.emergencyWaveConfigForCommand(command));
        }
        else {
            this.simulation.execute(command);
        }
        this.recordCommand(command);
    }
    recordCommand(command) {
        const cloned = cloneGameCommand(command);
        const previous = this.commandHistory[this.commandHistory.length - 1];
        if (cloned.type === "tick" && previous?.type === "tick") {
            previous.count += cloned.count;
            return;
        }
        this.commandHistory.push(cloned);
    }
    enrichBootstrapCommand(command) {
        if (command.type !== "hire-staff") {
            return command;
        }
        const enriched = cloneGameCommand(command);
        const stateBeforeHire = this.simulation.getState();
        if (enriched.initialSkillLevel === undefined) {
            const initialSkillLevel = this.initialStaffSkillLevelForHire(command.role, stateBeforeHire);
            if (initialSkillLevel !== null) {
                enriched.initialSkillLevel = initialSkillLevel;
            }
        }
        if ((enriched.initialSpecialties?.length ?? 0) === 0) {
            const initialSpecialties = this.initialStaffSpecialtiesForHire(command.role, stateBeforeHire);
            if (initialSpecialties.length > 0) {
                enriched.initialSpecialties = initialSpecialties;
            }
        }
        return enriched;
    }
    advanceSimulationTicks(count) {
        for (let index = 0; index < count; index += 1) {
            this.executeCommand({ type: "tick", count: 1 });
            this.maybeRunScenarioQuake();
            this.maybeRunScenarioEmergency();
            this.maybeRunMayorInspection();
            this.maybeRunAlienAbduction();
            this.maybeRunAutoAdmission();
        }
    }
    maybeRunAlienAbduction() {
        const abductionsPerYear = this.eventSettings.abductionsPerYear;
        if (!Number.isInteger(abductionsPerYear) || abductionsPerYear <= 0) {
            return;
        }
        const state = this.simulation.getState();
        const firstAbductionTick = (this.eventSettings.minimumAbductionYears ?? 0) * SCENARIO_YEAR_TICKS;
        if (state.tick <= 0 || state.tick < firstAbductionTick || state.patientsWaiting <= 0) {
            return;
        }
        const intervalTicks = Math.max(1, Math.floor(SCENARIO_YEAR_TICKS / abductionsPerYear));
        if ((state.tick - firstAbductionTick) % intervalTicks !== 0) {
            return;
        }
        const abductionIndex = Math.floor((state.tick - firstAbductionTick) / intervalTicks);
        if (this.hasTriggeredAlienAbduction(abductionIndex)) {
            return;
        }
        this.executeCommand({ type: "apply-alien-abduction", abductionIndex });
    }
    maybeRunMayorInspection() {
        const mayorLaunch = this.eventSettings.mayorLaunch;
        if (!Number.isInteger(mayorLaunch) || mayorLaunch <= 0) {
            return;
        }
        const state = this.simulation.getState();
        if (state.vipInspection.active || state.tick <= 0 || state.tick % mayorLaunch !== 0) {
            return;
        }
        this.executeCommand({ type: "start-vip-inspection" });
    }
    maybeRunScenarioEmergency() {
        const disasterLaunch = this.eventSettings.disasterLaunch;
        if (!Number.isInteger(disasterLaunch) || disasterLaunch <= 0) {
            return;
        }
        const state = this.simulation.getState();
        if (state.emergency.active || state.tick < disasterLaunch) {
            return;
        }
        const emergencyEntry = this.scenarioEmergencyEntryForTick(state.tick);
        if (!emergencyEntry) {
            return;
        }
        this.executeCommand({ type: "start-emergency-wave", emergencyIndex: emergencyEntry.index });
    }
    maybeRunScenarioQuake() {
        const entry = this.scenarioQuakeEntryForTick(this.simulation.getState().tick);
        if (!entry || this.hasTriggeredScenarioQuake(entry.index)) {
            return;
        }
        this.executeCommand({
            type: "apply-earthquake",
            severity: Math.max(1, entry.severity),
            quakeIndex: entry.index
        });
    }
    maybeRunAutoAdmission() {
        const state = this.simulation.getState();
        const delayTicks = this.autoAdmissionDelayTicks();
        if (!this.admissionsOpen ||
            state.tick <= 0 ||
            state.tick < delayTicks ||
            (state.tick !== delayTicks && state.tick % this.autoAdmissionIntervalTicks(state.tick) !== 0) ||
            state.patientsWaiting >= this.autoAdmissionWaitingCap(state.tick)) {
            return;
        }
        this.executeCommand({
            type: "admit-patient",
            ...this.autoAdmissionProfile(state.tick)
        });
    }
    autoAdmissionProfile(tick) {
        const disease = this.scenarioDiseaseForAdmission();
        if (disease) {
            return { severity: disease.severity, diseaseId: disease.diseaseId };
        }
        return { severity: this.autoAdmissionSeverity(tick) };
    }
    manualAdmissionProfile(severity) {
        const disease = this.scenarioDiseaseForAdmission();
        if (disease) {
            return { severity: disease.severity, diseaseId: disease.diseaseId };
        }
        return { severity };
    }
    scenarioAvailableDiseases(state = this.simulation.getState()) {
        if (this.diseasePool.length === 0) {
            return [];
        }
        return this.diseasePool.filter((candidate) => this.isScenarioDiseaseAvailable(candidate, state));
    }
    scenarioDiseaseForAdmission(state = this.simulation.getState(), candidates = this.scenarioAvailableDiseases(state)) {
        if (candidates.length === 0) {
            return null;
        }
        const weightedCandidates = candidates.map((candidate) => ({
            disease: candidate,
            weight: this.scenarioDiseaseAllocationWeight(candidate, state)
        }));
        const totalWeight = weightedCandidates.reduce((sum, candidate) => sum + candidate.weight, 0);
        let slot = state.counters.totalAdmissions % totalWeight;
        for (const candidate of weightedCandidates) {
            if (slot < candidate.weight) {
                return candidate.disease;
            }
            slot -= candidate.weight;
        }
        return candidates[0];
    }
    scenarioDiseaseAllocationWeight(disease, state) {
        const hasImportedAllocationWeights = this.allocationSettings.randomWeight !== undefined ||
            this.allocationSettings.totalReputationWeight !== undefined ||
            this.allocationSettings.illnessReputationWeight !== undefined;
        if (!hasImportedAllocationWeights) {
            return disease.weight;
        }
        const randomWeight = this.allocationSettings.randomWeight ?? 1;
        const totalReputationWeight = this.allocationSettings.totalReputationWeight ?? 0;
        const illnessReputationWeight = this.allocationSettings.illnessReputationWeight ?? 0;
        const reputationBucket = Math.max(0, Math.floor(state.reputation / 100));
        return Math.max(1, disease.weight * Math.max(1, randomWeight) +
            reputationBucket * totalReputationWeight +
            disease.severity * illnessReputationWeight);
    }
    isScenarioDiseaseAvailable(disease, state) {
        const effectiveExpertise = effectiveScenarioExpertise(this.expertise, state.research.level);
        if (!scenarioDiseaseKnownForExpertise(disease.diseaseId, effectiveExpertise)) {
            return false;
        }
        if (!scenarioDiseaseDiagnosableForExpertise(disease.diseaseId, effectiveExpertise, this.scenarioDiagnosisCapability(state))) {
            return false;
        }
        if (!this.isContagiousScenarioDiseaseAdmissionAllowed(disease, state)) {
            return false;
        }
        if (disease.source === "visuals_available" && disease.availableMonth !== undefined) {
            const currentMonth = Math.floor(state.tick / SCENARIO_MONTH_TICKS);
            if (currentMonth < disease.availableMonth) {
                return false;
            }
        }
        const treatmentRoomType = scenarioTreatmentRoomTypeForDisease(disease.diseaseId);
        if (!this.availableRoomTypesForTick(state.tick).includes(treatmentRoomType)) {
            return false;
        }
        if (!this.isScenarioDiseaseRequiredObjectAvailable(disease.diseaseId, state.tick)) {
            return false;
        }
        if (disease.source !== "visuals" && disease.source !== "visuals_available") {
            return true;
        }
        const holdVisualMonths = this.admissionRules.holdVisualMonths ?? 0;
        const holdVisualPeepCount = this.admissionRules.holdVisualPeepCount ?? 0;
        const currentMonth = Math.floor(state.tick / SCENARIO_MONTH_TICKS);
        return currentMonth >= holdVisualMonths && state.counters.totalAdmissions >= holdVisualPeepCount;
    }
    isScenarioDiseaseRequiredObjectAvailable(diseaseId, tick) {
        const requiredObjectIndices = SCENARIO_DISEASE_REQUIRED_OBJECTS.get(diseaseId);
        if (!requiredObjectIndices) {
            return true;
        }
        const relevantEntries = this.roomAvailabilitySchedule.filter((entry) => requiredObjectIndices.includes(entry.index));
        if (relevantEntries.length === 0) {
            return true;
        }
        return relevantEntries.some((entry) => this.isRoomAvailabilityEntryUnlockedForTick(entry, tick));
    }
    isContagiousScenarioDiseaseAdmissionAllowed(disease, state) {
        const effectiveExpertise = effectiveScenarioExpertise(this.expertise, state.research.level);
        if (!scenarioDiseaseContagiousForExpertise(disease, effectiveExpertise)) {
            return true;
        }
        const reduceMonths = this.epidemicSettings.reduceContagiousMonths;
        const reducePeepCount = this.epidemicSettings.reduceContagiousPeepCount;
        const reduceRate = this.epidemicSettings.reduceContagiousRate;
        if (reduceMonths === undefined && reducePeepCount === undefined && reduceRate === undefined) {
            return true;
        }
        const currentMonth = Math.floor(state.tick / SCENARIO_MONTH_TICKS);
        const withinMonthReduction = reduceMonths !== undefined && currentMonth < reduceMonths;
        const withinPeepReduction = reducePeepCount !== undefined && state.counters.totalAdmissions < reducePeepCount;
        if (!withinMonthReduction && !withinPeepReduction) {
            return true;
        }
        if (reduceRate === undefined) {
            return false;
        }
        const rate = clamp(reduceRate, 0, 100);
        if (rate <= 0) {
            return false;
        }
        const index = Number.isInteger(disease.index) ? disease.index : disease.diseaseId.length;
        const roll = (this.seed + state.counters.totalAdmissions * 31 + index * 17) % 100;
        return roll < rate;
    }
    autoAdmissionSeverity(tick) {
        const bucket = (this.seed + tick * 17) % 10;
        if (this.admissionPolicy === "conservative") {
            if (bucket < 7) {
                return 1;
            }
            if (bucket < 9) {
                return 2;
            }
            return 3;
        }
        if (this.admissionPolicy === "aggressive") {
            if (bucket < 2) {
                return 1;
            }
            if (bucket < 6) {
                return 2;
            }
            return 3;
        }
        if (bucket < 5) {
            return 1;
        }
        if (bucket < 8) {
            return 2;
        }
        return 3;
    }
    nextAutoAdmissionInTicks(tick) {
        if (!this.admissionsOpen) {
            return null;
        }
        const delayTicks = this.autoAdmissionDelayTicks();
        if (tick < delayTicks) {
            return delayTicks - tick;
        }
        const interval = this.autoAdmissionIntervalTicks(tick);
        const remainder = tick % interval;
        return remainder === 0 ? interval : interval - remainder;
    }
    autoAdmissionDelayTicks() {
        return (this.allocationSettings.delayMonths ?? 0) * SCENARIO_MONTH_TICKS;
    }
    autoAdmissionIntervalTicks(tick) {
        const change = this.scenarioPopulationChangeForTick(tick);
        const populationAdjustment = change === null ? 0 : change * 2;
        const illnessAdjustment = (this.scenarioIllnessRate ?? 2) - 2;
        const noStaffAdjustment = this.autoAdmissionNoStaffPenaltyTicks();
        return clamp(AUTO_ADMISSION_INTERVAL_TICKS - populationAdjustment - illnessAdjustment * 2 + noStaffAdjustment, 4, AUTO_ADMISSION_INTERVAL_TICKS + 16);
    }
    autoAdmissionNoStaffPenaltyTicks(state = this.simulation.getState()) {
        const noStaffPoints = this.routingSettings.noStaffPoints ?? 0;
        if (noStaffPoints <= 0) {
            return 0;
        }
        const activeDiagnosticians = state.entities.staff.filter((staff) => staff.role === "diagnostician" && staff.status === "active").length;
        return activeDiagnosticians > 0 ? 0 : Math.min(8, Math.ceil(noStaffPoints / 5));
    }
    autoAdmissionWaitingCap(tick) {
        const change = this.scenarioPopulationChangeForTick(tick);
        const populationAdjustment = change === null ? 0 : change;
        const illnessAdjustment = (this.scenarioIllnessRate ?? 2) - 2;
        const baseCap = clamp(AUTO_ADMISSION_WAITING_CAP + populationAdjustment + illnessAdjustment, 2, 16);
        const receptionists = this.currentStaffMarket(tick)?.receptionists;
        const frontDeskCapacity = this.frontDeskCapacity();
        if (frontDeskCapacity > 0) {
            return Math.min(baseCap, frontDeskCapacity);
        }
        if (receptionists === undefined) {
            return baseCap;
        }
        return 0;
    }
    activeReceptionistCount(state = this.simulation.getState()) {
        return state.entities.staff.filter((staff) => staff.role === "receptionist" && staff.status === "active").length;
    }
    frontDeskCapacity(state = this.simulation.getState()) {
        return this.activeReceptionistCount(state) * 4;
    }
    manualAdmissionCapacityReached(state = this.simulation.getState()) {
        if (this.frontDeskCapacity(state) <= 0) {
            return false;
        }
        return state.patientsWaiting >= this.autoAdmissionWaitingCap(state.tick);
    }
    scenarioDiagnosisCapability(state = this.simulation.getState()) {
        const bestDoctorSkill = state.entities.staff
            .filter((staff) => staff.role === "diagnostician")
            .reduce((best, staff) => Math.max(best, staff.skillLevel ?? 0), 0);
        return 100 + bestDoctorSkill * 100;
    }
    scenarioPopulationChangeForTick(tick) {
        if (this.populationSchedule.length === 0) {
            return null;
        }
        const month = Math.floor(tick / SCENARIO_MONTH_TICKS);
        let active = this.populationSchedule[0];
        for (const entry of this.populationSchedule) {
            if (entry.month > month) {
                break;
            }
            active = entry;
        }
        return active.change;
    }
    currentStaffMarket(tick) {
        if (this.staffMarketSchedule.length === 0) {
            return null;
        }
        const month = Math.max(0, Math.floor(tick / SCENARIO_MONTH_TICKS));
        let active = this.staffMarketSchedule[0];
        for (const entry of this.staffMarketSchedule) {
            if (entry.month > month) {
                break;
            }
            active = entry;
        }
        return active;
    }
    staffMarketRemainingForRole(role, state = this.simulation.getState()) {
        const key = staffMarketKeyForRole(role);
        const market = this.currentStaffMarket(state.tick);
        if (!key || !market) {
            return Number.POSITIVE_INFINITY;
        }
        const hired = state.entities.staff.filter((staff) => staff.role === role).length;
        return Math.max(0, market[key] - hired);
    }
    isStaffRoleAvailable(role) {
        return this.staffMarketRemainingForRole(role) > 0;
    }
    initialStaffSkillLevelForHire(role, state = this.simulation.getState()) {
        const market = this.currentStaffMarket(state.tick);
        if (!market ||
            (market.juniorRate === undefined &&
                market.consultantRate === undefined &&
                this.trainingSettings.doctorThreshold === undefined &&
                this.trainingSettings.consultantThreshold === undefined)) {
            return null;
        }
        const rollSeed = this.initialStaffRollSeedForHire(role, market, state);
        const abilityScore = this.initialStaffAbilityScoreForHire(role, market, state);
        if (this.trainingSettings.doctorThreshold !== undefined || this.trainingSettings.consultantThreshold !== undefined) {
            const consultantThreshold = this.trainingSettings.consultantThreshold ?? Number.POSITIVE_INFINITY;
            const doctorThreshold = this.trainingSettings.doctorThreshold ?? consultantThreshold;
            if (abilityScore >= consultantThreshold) {
                return 3;
            }
            if (abilityScore >= doctorThreshold) {
                return 1;
            }
            return 0;
        }
        const roll = rollSeed % 100;
        const consultantRate = market.consultantRate ?? 0;
        const juniorRate = market.juniorRate ?? 0;
        if (roll < consultantRate) {
            return 3;
        }
        if (roll >= 100 - juniorRate) {
            return 0;
        }
        return 1;
    }
    initialStaffRollSeedForHire(role, market = this.currentStaffMarket(this.simulation.getState().tick), state = this.simulation.getState()) {
        const hired = state.entities.staff.filter((staff) => staff.role === role).length;
        const roleOffset = role === "diagnostician" ? 11 : role === "nurse" ? 37 : role === "receptionist" ? 83 : 59;
        return (market?.seed ?? this.seed) + state.tick + hired * 29 + roleOffset;
    }
    initialStaffAbilityScoreForHire(role, market = this.currentStaffMarket(this.simulation.getState().tick), state = this.simulation.getState()) {
        return (this.initialStaffRollSeedForHire(role, market, state) * 37) % 1_000;
    }
    initialStaffSpecialtiesForHire(role, state = this.simulation.getState()) {
        const market = this.currentStaffMarket(state.tick);
        if (role !== "diagnostician" || !market) {
            return [];
        }
        const specialties = [];
        if ((this.trainingSettings.abilityThresholds ?? []).length > 0) {
            const abilityScore = this.initialStaffAbilityScoreForHire(role, market, state);
            specialties.push(...this.trainingSettings.abilityThresholds
                    .filter((threshold) => abilityScore >= threshold.value)
                    .map((threshold) => staffSpecialtyForAbilityThresholdName(threshold.name))
                    .filter((specialty) => specialty !== null));
        }
        const hired = state.entities.staff.filter((staff) => staff.role === role).length;
        const rollSeed = (market.seed ?? this.seed) + state.tick + hired * 29 + 11;
        const roll = (rollSeed * 53) % 100;
        const shrinkRate = market.shrinkRate ?? 0;
        const surgeonRate = market.surgeonRate ?? 0;
        const researcherRate = market.researcherRate ?? 0;
        if (roll < shrinkRate) {
            specialties.push("psychiatrist");
        }
        else if (roll < shrinkRate + surgeonRate) {
            specialties.push("surgeon");
        }
        else if (roll < shrinkRate + surgeonRate + researcherRate) {
            specialties.push("researcher");
        }
        return [...new Set(specialties)];
    }
    isRoomTypeAvailable(roomType) {
        return this.availableRoomTypesForTick(this.simulation.getState().tick).includes(roomType);
    }
    isObjectAvailableForTick(objectIndex, tick) {
        if (!Number.isInteger(objectIndex) || objectIndex < 0 || this.objectAvailability.length === 0) {
            return this.objectAvailability.length === 0;
        }
        const entry = this.objectAvailability.find((candidate) => candidate.index === objectIndex);
        return entry ? this.isRoomAvailabilityEntryUnlockedForTick(this.availabilityEntryForObject(entry), tick) : false;
    }
    scenarioObjectAvailabilityForTick(tick) {
        const entries = this.objectAvailability.length > 0 ? this.objectAvailability : this.roomAvailabilitySchedule;
        const summary = {
            total: entries.length,
            available: 0,
            locked: 0,
            disabled: 0,
            researchLocked: 0,
            availableIndices: [],
            lockedIndices: [],
            disabledIndices: [],
            researchLockedIndices: []
        };
        for (const entry of entries) {
            if (!entry.availableForLevel) {
                summary.disabled += 1;
                summary.disabledIndices.push(entry.index);
                continue;
            }
            const availabilityEntry = this.availabilityEntryForObject(entry);
            if (this.isRoomAvailabilityEntryUnlockedForTick(availabilityEntry, tick)) {
                summary.available += 1;
                summary.availableIndices.push(entry.index);
                continue;
            }
            if (this.isRoomAvailabilityEntryResearchLocked(availabilityEntry)) {
                summary.researchLocked += 1;
                summary.researchLockedIndices.push(entry.index);
                continue;
            }
            summary.locked += 1;
            summary.lockedIndices.push(entry.index);
        }
        return summary;
    }
    availabilityEntryForObject(entry) {
        if (!entry || typeof entry.roomType !== "string") {
            return entry;
        }
        return this.roomAvailabilitySchedule.find((candidate) => candidate.index === entry.index &&
            candidate.roomType === entry.roomType) ?? entry;
    }
    isRoomAvailabilityEntryResearchLocked(entry) {
        return Boolean(entry?.expertiseCategory && Number.isInteger(entry.researchRequired) && entry.researchRequired > 0);
    }
    availableRoomTypesForTick(tick) {
        if (this.roomAvailability === null && this.roomAvailabilitySchedule.length === 0) {
            return [...ALLOWED_ROOM_TYPES];
        }
        const available = normalizeRoomAvailability(this.roomAvailability ?? []);
        for (const entry of this.roomAvailabilitySchedule) {
            if (this.isRoomAvailabilityEntryUnlockedForTick(entry, tick)) {
                if (!available.includes(entry.roomType)) {
                    available.push(entry.roomType);
                }
            }
        }
        return available;
    }
    isRoomAvailabilityEntryUnlockedForTick(entry, tick) {
        if (!entry.availableForLevel) {
            return false;
        }
        const currentMonth = Math.floor(tick / SCENARIO_MONTH_TICKS);
        return entry.startAvailable ||
            (entry.whenAvailable > 0 && currentMonth >= entry.whenAvailable) ||
            this.isRoomAvailabilityResearchUnlocked(entry);
    }
    isRoomAvailabilityResearchUnlocked(entry) {
        if (!entry.expertiseCategory || !Number.isInteger(entry.researchRequired) || entry.researchRequired <= 0) {
            return false;
        }
        const state = this.simulation.getState();
        return effectiveScenarioExpertise(this.expertise, state.research.level)
            .some((expertise) => expertise.category === entry.expertiseCategory &&
            (expertise.known || expertise.researchRequired === 0) &&
            expertise.researchRequired <= entry.researchRequired);
    }
    researchProjectTicks() {
        return DEFAULT_RESEARCH_PROJECT_TICKS * (this.researchSettings.researchPointsDivisor ?? 1);
    }
    researchProjectCost() {
        return this.researchSettings.startCost ?? null;
    }
    researchStartRating() {
        return this.researchSettings.startRating ?? null;
    }
    researchImproveRate() {
        return this.researchSettings.drugImproveRate ?? this.researchSettings.researchImproveIncrementPercent ?? null;
    }
    staffTrainingTicks() {
        const trainingValueBonus = (this.trainingSettings.trainingValues ?? []).reduce((sum, entry) => sum + entry.value, 0);
        if (this.trainingSettings.trainingRate === undefined && trainingValueBonus <= 0) {
            return null;
        }
        const effectiveTrainingRate = (this.trainingSettings.trainingRate ?? 40) + trainingValueBonus;
        return Math.max(1, Math.ceil(5 * 40 / effectiveTrainingRate));
    }
    staffTrainingTicksForMonths(months) {
        const trainingValueBonus = (this.trainingSettings.trainingValues ?? []).reduce((sum, entry) => sum + entry.value, 0);
        const effectiveTrainingRate = (this.trainingSettings.trainingRate ?? 40) + trainingValueBonus;
        return Math.max(1, Math.ceil(months * 40 / effectiveTrainingRate));
    }
    staffTrainingTicksByTargetLevel() {
        const ticksByTargetLevel = {};
        if (this.trainingSettings.promotionDoctorMonths !== undefined) {
            ticksByTargetLevel[1] = this.staffTrainingTicksForMonths(this.trainingSettings.promotionDoctorMonths);
            ticksByTargetLevel[2] = this.staffTrainingTicksForMonths(this.trainingSettings.promotionDoctorMonths);
        }
        if (this.trainingSettings.promotionConsultantMonths !== undefined) {
            ticksByTargetLevel[3] = this.staffTrainingTicksForMonths(this.trainingSettings.promotionConsultantMonths);
        }
        return ticksByTargetLevel;
    }
    scenarioEmergencyEntryForTick(tick) {
        if (this.emergencySchedule.length === 0) {
            return null;
        }
        const month = Math.floor(tick / SCENARIO_MONTH_TICKS);
        return this.emergencySchedule.find((entry) => month >= entry.startMonth &&
            month <= entry.endMonth &&
            this.isScenarioEmergencyEntryAvailable(entry, tick) &&
            !this.hasTriggeredScenarioEmergency(entry.index)) ?? null;
    }
    scenarioNextEmergencyEntryForTick(tick) {
        if (this.emergencySchedule.length === 0) {
            return null;
        }
        const month = Math.floor(tick / SCENARIO_MONTH_TICKS);
        return this.emergencySchedule.find((entry) => entry.endMonth >= month &&
            !this.hasTriggeredScenarioEmergency(entry.index)) ?? null;
    }
    isScenarioEmergencyEntryAvailable(entry, tick) {
        if (!entry.diseaseId) {
            return true;
        }
        const treatmentRoomType = scenarioTreatmentRoomTypeForDisease(entry.diseaseId);
        return this.availableRoomTypesForTick(tick).includes(treatmentRoomType);
    }
    scenarioEmergencyEntryForIndex(index) {
        return this.emergencySchedule.find((entry) => entry.index === index) ?? null;
    }
    emergencyWaveConfigForCommand(command) {
        if (Number.isInteger(command.emergencyIndex)) {
            const entry = this.scenarioEmergencyEntryForIndex(command.emergencyIndex);
            return entry ? this.scenarioEmergencyWaveConfigForEntry(entry, this.simulation.getState().tick) : undefined;
        }
        return this.scenarioEmergencyWaveConfigForTick(this.simulation.getState().tick);
    }
    scenarioEmergencyWaveConfigForTick(tick) {
        const entry = this.scenarioEmergencyEntryForTick(tick);
        if (!entry) {
            return undefined;
        }
        return this.scenarioEmergencyWaveConfigForEntry(entry, tick);
    }
    scenarioEmergencyWaveConfigForEntry(entry, tick) {
        return {
            patientCount: this.scenarioEmergencyPatientCount(entry, tick),
            severity: entry.severity ?? 3,
            durationTicks: 24,
            rewardCash: entry.bonusCash,
            rewardReputation: Math.round(entry.bonusCash / 20),
            percentToWin: entry.percentToWin,
            ...(entry.diseaseId ? { diseaseId: entry.diseaseId } : {})
        };
    }
    scenarioEmergencyPatientCount(entry, tick) {
        const minPatients = Math.max(1, entry.minPatients);
        const maxPatients = Math.max(minPatients, entry.maxPatients);
        const span = maxPatients - minPatients + 1;
        if (span <= 1) {
            return minPatients;
        }
        return minPatients + ((this.seed + tick + entry.index * 17) % span);
    }
    scenarioQuakeEntryForTick(tick) {
        if (this.quakeSchedule.length === 0) {
            return null;
        }
        const month = Math.floor(tick / SCENARIO_MONTH_TICKS);
        return this.quakeSchedule.find((entry) => entry.severity > 0 &&
            month >= entry.startMonth &&
            month <= entry.endMonth &&
            !this.hasTriggeredScenarioQuake(entry.index)) ?? null;
    }
    scenarioNextQuakeEntryForTick(tick) {
        if (this.quakeSchedule.length === 0) {
            return null;
        }
        const month = Math.floor(tick / SCENARIO_MONTH_TICKS);
        return this.quakeSchedule.find((entry) => entry.severity > 0 &&
            entry.endMonth >= month &&
            !this.hasTriggeredScenarioQuake(entry.index)) ?? null;
    }
    hasTriggeredScenarioQuake(index) {
        return this.commandHistory.some((command) => command.type === "apply-earthquake" && command.quakeIndex === index);
    }
    hasTriggeredScenarioEmergency(index) {
        return this.commandHistory.some((command) => command.type === "start-emergency-wave" && command.emergencyIndex === index);
    }
    hasTriggeredAlienAbduction(index) {
        return this.commandHistory.some((command) => command.type === "apply-alien-abduction" && command.abductionIndex === index);
    }
    resolveGridPosition(pointer) {
        if (!pointer) {
            return undefined;
        }
        const state = this.simulation.getState();
        const x = clamp(Math.floor(pointer.x / this.pointerTileSize), 0, state.bounds.width - 1);
        const y = clamp(Math.floor(pointer.y / this.pointerTileSize), 0, state.bounds.height - 1);
        return { x, y };
    }
    toggleStaffBreak(staffId) {
        const staff = staffId === undefined
            ? this.simulation
                .getState()
                .entities.staff.filter((member) => member.role === "diagnostician")
                .sort((left, right) => left.id - right.id)[0]
            : this.simulation.getState().entities.staff.find((member) => member.id === staffId);
        if (!staff) {
            return;
        }
        this.executeCommand({
            type: "set-staff-status",
            staffId: staff.id,
            status: staff.status === "active" ? "on-break" : "active"
        });
    }
    toggleRoom(roomId) {
        const room = roomId === undefined
            ? this.simulation
                .getState()
                .entities.rooms.filter((candidate) => candidate.roomType === "treatment")
                .sort((left, right) => left.id - right.id)[0]
            : this.simulation.getState().entities.rooms.find((candidate) => candidate.id === roomId);
        if (!room) {
            return;
        }
        this.executeCommand({
            type: "set-room-status",
            roomId: room.id,
            status: room.status === "open" ? "closed" : "open"
        });
    }
}
function cloneGameCommand(command) {
    if (command.type === "tick") {
        return { type: "tick", count: command.count };
    }
    if (command.type === "treat-patient") {
        return {
            type: "treat-patient",
            ...(command.patientId ? { patientId: command.patientId } : {})
        };
    }
    if (command.type === "send-patient-home") {
        return { type: "send-patient-home", patientId: command.patientId };
    }
    if (command.type === "prioritize-patient") {
        return { type: "prioritize-patient", patientId: command.patientId };
    }
    if (command.type === "give-patient-drink") {
        return { type: "give-patient-drink", patientId: command.patientId };
    }
    if (command.type === "send-patient-toilet") {
        return { type: "send-patient-toilet", patientId: command.patientId };
    }
    if (command.type === "shoot-rat") {
        return {
            type: "shoot-rat",
            ...(typeof command.hit === "boolean" ? { hit: command.hit } : {})
        };
    }
    if (command.type === "water-plant") {
        return {
            type: "water-plant",
            ...(typeof command.watered === "boolean" ? { watered: command.watered } : {})
        };
    }
    if (command.type === "admit-patient") {
        return {
            type: "admit-patient",
            severity: command.severity,
            ...(command.diseaseId ? { diseaseId: command.diseaseId } : {}),
            ...(command.position ? { position: { x: command.position.x, y: command.position.y } } : {})
        };
    }
    if (command.type === "schedule-admit-patient") {
        return {
            type: "schedule-admit-patient",
            delay: command.delay,
            severity: command.severity,
            ...(command.diseaseId ? { diseaseId: command.diseaseId } : {}),
            ...(command.position ? { position: { x: command.position.x, y: command.position.y } } : {})
        };
    }
    if (command.type === "hire-staff") {
        return {
            type: "hire-staff",
            role: command.role,
            ...(command.initialSkillLevel !== undefined ? { initialSkillLevel: command.initialSkillLevel } : {}),
            ...(command.initialSpecialties?.length > 0 ? { initialSpecialties: [...command.initialSpecialties] } : {}),
            ...(command.position ? { position: { x: command.position.x, y: command.position.y } } : {})
        };
    }
    if (command.type === "fire-staff") {
        return { type: "fire-staff", staffId: command.staffId };
    }
    if (command.type === "move-staff") {
        return { type: "move-staff", staffId: command.staffId, position: { x: command.position.x, y: command.position.y } };
    }
    if (command.type === "set-staff-status") {
        return { type: "set-staff-status", staffId: command.staffId, status: command.status };
    }
    if (command.type === "rest-staff") {
        return { type: "rest-staff", staffId: command.staffId, restType: command.restType };
    }
    if (command.type === "open-room") {
        return {
            type: "open-room",
            roomType: command.roomType,
            ...(command.position ? { position: { x: command.position.x, y: command.position.y } } : {})
        };
    }
    if (command.type === "place-object") {
        return {
            type: "place-object",
            objectIndex: command.objectIndex,
            ...(command.name ? { name: command.name } : {}),
            ...(Number.isInteger(command.cost) ? { cost: command.cost } : {}),
            ...(Number.isInteger(command.strength) ? { strength: command.strength } : {}),
            ...(command.orientation ? { orientation: command.orientation } : {}),
            ...(command.position ? { position: { x: command.position.x, y: command.position.y } } : {})
        };
    }
    if (command.type === "remove-object") {
        return { type: "remove-object", objectId: command.objectId };
    }
    if (command.type === "remove-room") {
        return { type: "remove-room", roomId: command.roomId };
    }
    if (command.type === "repair-room") {
        return { type: "repair-room", roomId: command.roomId };
    }
    if (command.type === "set-pricing-policy") {
        return { type: "set-pricing-policy", policy: command.policy };
    }
    if (command.type === "take-loan" || command.type === "repay-loan") {
        return { type: command.type };
    }
    if (command.type === "run-finance-audit") {
        return { type: "run-finance-audit" };
    }
    if (command.type === "run-marketing-campaign") {
        return { type: "run-marketing-campaign" };
    }
    if (command.type === "start-insurance-contract") {
        return { type: "start-insurance-contract" };
    }
    if (command.type === "run-awards-ceremony") {
        return {
            type: "run-awards-ceremony",
            ...(Number.isInteger(command.cashReward) ? { cashReward: command.cashReward } : {}),
            ...(Number.isInteger(command.reputationReward) ? { reputationReward: command.reputationReward } : {})
        };
    }
    if (command.type === "start-research") {
        return { type: "start-research" };
    }
    if (command.type === "start-emergency-wave") {
        return {
            type: "start-emergency-wave",
            ...(command.emergencyIndex !== undefined ? { emergencyIndex: command.emergencyIndex } : {})
        };
    }
    if (command.type === "start-epidemic-outbreak") {
        return { type: "start-epidemic-outbreak" };
    }
    if (command.type === "apply-earthquake") {
        return {
            type: "apply-earthquake",
            severity: command.severity,
            ...(command.quakeIndex !== undefined ? { quakeIndex: command.quakeIndex } : {})
        };
    }
    if (command.type === "apply-alien-abduction") {
        return {
            type: "apply-alien-abduction",
            ...(command.patientId !== undefined ? { patientId: command.patientId } : {}),
            ...(command.abductionIndex !== undefined ? { abductionIndex: command.abductionIndex } : {})
        };
    }
    if (command.type === "train-staff") {
        return { type: "train-staff", staffId: command.staffId };
    }
    if (command.type === "start-vip-inspection") {
        return { type: "start-vip-inspection" };
    }
    return { type: "set-room-status", roomId: command.roomId, status: command.status };
}
function cloneCommandHistoryForPersistence(commandHistory, state) {
    const hireCountsByRole = new Map();
    for (const command of commandHistory) {
        if (command.type === "hire-staff") {
            hireCountsByRole.set(command.role, (hireCountsByRole.get(command.role) ?? 0) + 1);
        }
    }
    const hiredStaffByRole = new Map();
    for (const [role, count] of hireCountsByRole) {
        hiredStaffByRole.set(role, state.entities.staff
            .filter((staff) => staff.role === role)
            .sort((left, right) => left.id - right.id)
            .slice(-count));
    }
    const hireIndexesByRole = new Map();
    return commandHistory.map((command) => {
        const cloned = cloneGameCommand(command);
        if (command.type !== "hire-staff") {
            return cloned;
        }
        const roleIndex = hireIndexesByRole.get(command.role) ?? 0;
        hireIndexesByRole.set(command.role, roleIndex + 1);
        const hiredStaff = hiredStaffByRole.get(command.role)?.[roleIndex];
        if (!hiredStaff) {
            return cloned;
        }
        if (cloned.initialSkillLevel === undefined && Number.isInteger(hiredStaff.skillLevel) && hiredStaff.skillLevel > 0) {
            cloned.initialSkillLevel = hiredStaff.skillLevel;
        }
        if ((cloned.initialSpecialties?.length ?? 0) === 0 && hiredStaff.specialties?.length > 0) {
            cloned.initialSpecialties = [...hiredStaff.specialties];
        }
        return cloned;
    });
}
