export const GAME_COMMAND_TYPES = [
    "tick",
    "admit-patient",
    "treat-patient",
    "send-patient-home",
    "prioritize-patient",
    "give-patient-drink",
    "send-patient-toilet",
    "shoot-rat",
    "water-plant",
    "schedule-admit-patient",
    "hire-staff",
    "fire-staff",
    "move-staff",
    "set-staff-status",
    "rest-staff",
    "open-room",
    "place-object",
    "remove-object",
    "remove-room",
    "set-room-status",
    "repair-room",
    "set-pricing-policy",
    "take-loan",
    "repay-loan",
    "run-finance-audit",
    "run-marketing-campaign",
    "start-insurance-contract",
    "run-awards-ceremony",
    "start-research",
    "start-emergency-wave",
    "start-epidemic-outbreak",
    "apply-earthquake",
    "apply-alien-abduction",
    "train-staff",
    "start-vip-inspection"
];
function isRecord(value) {
    return typeof value === "object" && value !== null;
}
function isGridPosition(value) {
    return (isRecord(value) &&
        Number.isInteger(value.x) &&
        Number.isInteger(value.y) &&
        value.x >= 0 &&
        value.y >= 0);
}
function isSeverity(value) {
    return value === 1 || value === 2 || value === 3;
}
function isStaffRole(value) {
    return value === "diagnostician" || value === "nurse" || value === "handyman" || value === "receptionist";
}
function isStaffSkillLevel(value) {
    return typeof value === "number" && Number.isInteger(value) && value >= 0 && value <= 3;
}
function isStaffSpecialty(value) {
    return value === "psychiatrist" || value === "surgeon" || value === "researcher";
}
function isStaffStatus(value) {
    return value === "active" || value === "on-break";
}
function isStaffRestType(value) {
    return value === "standing" || value === "sofa" || value === "game" || value === "snooker";
}
function isRoomType(value) {
    return value === "diagnosis" || value === "treatment" || value === "pharmacy" || value === "specialist";
}
function isRoomOperationalStatus(value) {
    return value === "open" || value === "closed";
}
function isTreatmentPricingPolicy(value) {
    return value === "discount" || value === "standard" || value === "premium";
}
function isPlacementOrientation(value) {
    return value === "north" || value === "east" || value === "south" || value === "west";
}
export function isGameCommand(value) {
    if (!isRecord(value) || typeof value.type !== "string") {
        return false;
    }
    if (!GAME_COMMAND_TYPES.includes(value.type)) {
        return false;
    }
    if (value.type === "tick") {
        return typeof value.count === "number" && Number.isInteger(value.count) && value.count > 0 && value.count <= 100_000;
    }
    if (value.type === "admit-patient") {
        return (isSeverity(value.severity) &&
            (value.diseaseId === undefined || typeof value.diseaseId === "string") &&
            (value.position === undefined || isGridPosition(value.position)));
    }
    if (value.type === "schedule-admit-patient") {
        return (typeof value.delay === "number" &&
            Number.isInteger(value.delay) &&
            value.delay > 0 &&
            value.delay <= 100_000 &&
            isSeverity(value.severity) &&
            (value.diseaseId === undefined || typeof value.diseaseId === "string") &&
            (value.position === undefined || isGridPosition(value.position)));
    }
    if (value.type === "treat-patient") {
        return (value.patientId === undefined ||
            (typeof value.patientId === "number" &&
                Number.isInteger(value.patientId) &&
                value.patientId > 0));
    }
    if (value.type === "send-patient-home") {
        return typeof value.patientId === "number" && Number.isInteger(value.patientId) && value.patientId > 0;
    }
    if (value.type === "prioritize-patient") {
        return typeof value.patientId === "number" && Number.isInteger(value.patientId) && value.patientId > 0;
    }
    if (value.type === "give-patient-drink" || value.type === "send-patient-toilet") {
        return typeof value.patientId === "number" && Number.isInteger(value.patientId) && value.patientId > 0;
    }
    if (value.type === "shoot-rat") {
        return value.hit === undefined || typeof value.hit === "boolean";
    }
    if (value.type === "water-plant") {
        return value.watered === undefined || typeof value.watered === "boolean";
    }
    if (value.type === "hire-staff") {
        return (isStaffRole(value.role) &&
            (value.position === undefined || isGridPosition(value.position)) &&
            (value.initialSkillLevel === undefined || isStaffSkillLevel(value.initialSkillLevel)) &&
            (value.initialSpecialties === undefined || (Array.isArray(value.initialSpecialties) && value.initialSpecialties.every(isStaffSpecialty))));
    }
    if (value.type === "set-staff-status") {
        return (typeof value.staffId === "number" &&
            Number.isInteger(value.staffId) &&
            value.staffId > 0 &&
            isStaffStatus(value.status));
    }
    if (value.type === "rest-staff") {
        return (typeof value.staffId === "number" &&
            Number.isInteger(value.staffId) &&
            value.staffId > 0 &&
            isStaffRestType(value.restType));
    }
    if (value.type === "fire-staff") {
        return typeof value.staffId === "number" && Number.isInteger(value.staffId) && value.staffId > 0;
    }
    if (value.type === "move-staff") {
        return (typeof value.staffId === "number" &&
            Number.isInteger(value.staffId) &&
            value.staffId > 0 &&
            isGridPosition(value.position));
    }
    if (value.type === "open-room") {
        return isRoomType(value.roomType) && (value.position === undefined || isGridPosition(value.position));
    }
    if (value.type === "place-object") {
        return (Number.isInteger(value.objectIndex) &&
            value.objectIndex >= 0 &&
            (value.name === undefined || typeof value.name === "string") &&
            (value.cost === undefined || (Number.isInteger(value.cost) && value.cost >= 0)) &&
            (value.orientation === undefined || isPlacementOrientation(value.orientation)) &&
            (value.position === undefined || isGridPosition(value.position)));
    }
    if (value.type === "remove-object") {
        return typeof value.objectId === "number" && Number.isInteger(value.objectId) && value.objectId > 0;
    }
    if (value.type === "remove-room") {
        return typeof value.roomId === "number" && Number.isInteger(value.roomId) && value.roomId > 0;
    }
    if (value.type === "set-room-status") {
        return (typeof value.roomId === "number" &&
            Number.isInteger(value.roomId) &&
            value.roomId > 0 &&
            isRoomOperationalStatus(value.status));
    }
    if (value.type === "repair-room") {
        return typeof value.roomId === "number" && Number.isInteger(value.roomId) && value.roomId > 0;
    }
    if (value.type === "set-pricing-policy") {
        return isTreatmentPricingPolicy(value.policy);
    }
    if (value.type === "take-loan" || value.type === "repay-loan") {
        return true;
    }
    if (value.type === "run-finance-audit") {
        return true;
    }
    if (value.type === "run-marketing-campaign") {
        return true;
    }
    if (value.type === "start-insurance-contract") {
        return true;
    }
    if (value.type === "run-awards-ceremony") {
        return ((value.cashReward === undefined || Number.isInteger(value.cashReward)) &&
            (value.reputationReward === undefined || Number.isInteger(value.reputationReward)));
    }
    if (value.type === "start-research") {
        return true;
    }
    if (value.type === "start-emergency-wave") {
        return value.emergencyIndex === undefined || (Number.isInteger(value.emergencyIndex) && value.emergencyIndex >= 0);
    }
    if (value.type === "start-epidemic-outbreak") {
        return true;
    }
    if (value.type === "apply-earthquake") {
        return (typeof value.severity === "number" &&
            Number.isInteger(value.severity) &&
            value.severity > 0 &&
            value.severity <= 99 &&
            (value.quakeIndex === undefined || (Number.isInteger(value.quakeIndex) && value.quakeIndex >= 0)));
    }
    if (value.type === "apply-alien-abduction") {
        return ((value.patientId === undefined ||
            (typeof value.patientId === "number" && Number.isInteger(value.patientId) && value.patientId > 0)) &&
            (value.abductionIndex === undefined || (Number.isInteger(value.abductionIndex) && value.abductionIndex >= 0)));
    }
    if (value.type === "train-staff") {
        return typeof value.staffId === "number" && Number.isInteger(value.staffId) && value.staffId > 0;
    }
    if (value.type === "start-vip-inspection") {
        return true;
    }
    return true;
}
export function assertGameCommand(value) {
    if (!isGameCommand(value)) {
        throw new Error(`Invalid game command: ${JSON.stringify(value)}`);
    }
}
