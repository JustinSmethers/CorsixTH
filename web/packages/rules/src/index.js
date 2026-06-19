export const PHASE7_SLICE1_RULESET = {
    id: "phase7-slice1-hospital-loop.v1",
    description: "Deterministic core hospital loop for Phase 7 Slice 1 (spawn -> queue -> diagnose -> treat -> discharge)"
};
export const PHASE7_SLICE2_RULESET = {
    id: "phase7-slice2-staff-room-ops.v1",
    description: "Deterministic staff lifecycle and room operations for Phase 7 Slice 2 (staff availability + room throughput)"
};
export const PHASE7_SLICE3_RULESET = {
    id: "phase7-slice3-economy-progression-events.v1",
    description: "Deterministic economy/progression/event systems for Phase 7 Slice 3 (cashflow, milestone unlocks, event sequencing)"
};
export const PHASE7_SLICE4_RULESET = {
    id: "phase7-slice4-secondary-polish.v1",
    description: "Deterministic secondary systems and polish behaviors for Phase 7 Slice 4 (queue pressure, staff fatigue, room maintenance)"
};
const DIAGNOSIS_TICKS_BY_SEVERITY = {
    1: 1,
    2: 2,
    3: 3
};
const TREATMENT_TICKS_BY_SEVERITY = {
    1: 1,
    2: 2,
    3: 3
};
const DISCHARGE_CASH_REWARD_BY_SEVERITY = {
    1: 140,
    2: 180,
    3: 220
};
const DISCHARGE_REPUTATION_REWARD_BY_SEVERITY = {
    1: 2,
    2: 4,
    3: 6
};
const PATIENT_MAX_HEALTH_BY_SEVERITY = {
    1: 80,
    2: 64,
    3: 48
};
const PATIENT_DEATH_CASH_PENALTY_BY_SEVERITY = {
    1: 120,
    2: 180,
    3: 260
};
const PATIENT_DEATH_REPUTATION_PENALTY_BY_SEVERITY = {
    1: 12,
    2: 20,
    3: 30
};
const PATIENT_SEND_HOME_CASH_PENALTY_BY_SEVERITY = {
    1: 40,
    2: 70,
    3: 110
};
const PATIENT_SEND_HOME_REPUTATION_PENALTY_BY_SEVERITY = {
    1: 2,
    2: 4,
    3: 8
};
const TREATMENT_SUCCESS_RATE_BY_SEVERITY = {
    1: 100,
    2: 92,
    3: 70
};
const TREATMENT_RESEARCH_PROJECT_COST = 1_500;
const TREATMENT_RESEARCH_PROJECT_TICKS = 6;
const TREATMENT_RESEARCH_MAX_LEVEL = 3;
const TREATMENT_RESEARCH_SUCCESS_BONUS_PER_LEVEL = 20;
const TREATMENT_ROOM_MATCH_SUCCESS_BONUS = 15;
const TREATMENT_ROOM_MATCH_TICK_REDUCTION = 1;
const EMERGENCY_WAVE_PATIENT_COUNT = 4;
const EMERGENCY_WAVE_SEVERITY = 3;
const EMERGENCY_WAVE_DURATION_TICKS = 24;
const EMERGENCY_WAVE_CASH_REWARD = 900;
const EMERGENCY_WAVE_REPUTATION_REWARD = 45;
const EPIDEMIC_OUTBREAK_PATIENT_COUNT = 3;
const EPIDEMIC_OUTBREAK_SEVERITY = 2;
const EPIDEMIC_OUTBREAK_DURATION_TICKS = 18;
const EPIDEMIC_OUTBREAK_SPREAD_INTERVAL_TICKS = 6;
const EPIDEMIC_OUTBREAK_MAX_SPREAD_PATIENTS = 2;
const EPIDEMIC_OUTBREAK_CASH_REWARD = 700;
const EPIDEMIC_OUTBREAK_REPUTATION_REWARD = 30;
const EPIDEMIC_OUTBREAK_CASH_PENALTY = 500;
const EPIDEMIC_OUTBREAK_REPUTATION_PENALTY = 35;
const STAFF_TRAINING_COST = 700;
const STAFF_TRAINING_TICKS = 5;
const STAFF_MAX_SKILL_LEVEL = 3;
const STAFF_SKILL_DURATION_REDUCTION_PER_LEVEL = 1;
const VIP_INSPECTION_DURATION_TICKS = 8;
const VIP_INSPECTION_MAX_QUEUE_PRESSURE = 2;
const VIP_INSPECTION_MIN_REPUTATION = 450;
const VIP_INSPECTION_REWARD_CASH = 800;
const VIP_INSPECTION_REWARD_REPUTATION = 25;
const VIP_INSPECTION_PENALTY_CASH = 300;
const VIP_INSPECTION_PENALTY_REPUTATION = 20;
const TREATMENT_FAILURE_CASH_PENALTY_BY_SEVERITY = {
    1: 80,
    2: 130,
    3: 200
};
const TREATMENT_FAILURE_REPUTATION_PENALTY_BY_SEVERITY = {
    1: 4,
    2: 8,
    3: 14
};
export const TREATMENT_PRICING_POLICIES = ["discount", "standard", "premium"];
const TREATMENT_PRICING_CASH_MULTIPLIER_BY_POLICY = {
    discount: 0.75,
    standard: 1,
    premium: 1.35
};
const TREATMENT_PRICING_REPUTATION_DELTA_BY_POLICY = {
    discount: 2,
    standard: 0,
    premium: -3
};
const LOAN_CHUNK_AMOUNT = 5_000;
const LOAN_MAX_OUTSTANDING = 20_000;
const LOAN_INTEREST_PER_TICK_PER_CHUNK = 2;
const FINANCE_AUDIT_CASH_RECOVERY = 350;
const FINANCE_AUDIT_COOLDOWN_TICKS = 10;
const MARKETING_CAMPAIGN_COST = 600;
const MARKETING_CAMPAIGN_REPUTATION_GAIN = 35;
const INSURANCE_CONTRACT_PATIENT_COUNT = 2;
const INSURANCE_CONTRACT_SEVERITY = 2;
const INSURANCE_CONTRACT_DURATION_TICKS = 16;
const INSURANCE_CONTRACT_CASH_REWARD = 650;
const INSURANCE_CONTRACT_REPUTATION_REWARD = 15;
const INSURANCE_CONTRACT_CASH_PENALTY = 250;
const INSURANCE_CONTRACT_REPUTATION_PENALTY = 12;
const HOSPITAL_AWARD_CASH_REWARD_BY_TIER = {
    none: 0,
    bronze: 250,
    silver: 600,
    gold: 1000
};
const HOSPITAL_AWARD_REPUTATION_REWARD_BY_TIER = {
    none: 0,
    bronze: 5,
    silver: 15,
    gold: 30
};
export const DISEASE_CATALOG = [
    { id: "mild-cold", name: "Mild Cold", severity: 1 },
    { id: "itchy-feet", name: "Itchy Feet", severity: 1 },
    { id: "gastric-grumble", name: "Gastric Grumble", severity: 2 },
    { id: "sleepy-bones", name: "Sleepy Bones", severity: 2 },
    { id: "cranial-pressure", name: "Cranial Pressure", severity: 3 },
    { id: "acute-sneezes", name: "Acute Sneezes", severity: 3 },
    { id: "slack-tongue", name: "Slack Tongue", severity: 2 },
    { id: "gut-rot", name: "Gut Rot", severity: 3 },
    { id: "king-complex", name: "King Complex", severity: 2 },
    { id: "spare-ribs", name: "Spare Ribs", severity: 2 },
    { id: "kidney-beans", name: "Kidney Beans", severity: 2 },
    { id: "fractured-bones", name: "Fractured Bones", severity: 2 },
    { id: "corrugated-ankles", name: "Corrugated Ankles", severity: 2 },
    { id: "transparency", name: "Transparency", severity: 1 },
    { id: "baldness", name: "Baldness", severity: 2 },
    { id: "broken-wind", name: "Broken Wind", severity: 2 },
    { id: "golf-stones", name: "Golf Stones", severity: 2 },
    { id: "infectious-laughter", name: "Infectious Laughter", severity: 2 },
    { id: "radiation", name: "Radiation", severity: 3 },
    { id: "sweaty-palms", name: "Sweaty Palms", severity: 1 },
    { id: "unexpected-swelling", name: "Unexpected Swelling", severity: 3 },
    { id: "hairyitis", name: "Hairyitis", severity: 2 },
    { id: "jellyitis", name: "Jellyitis", severity: 3 },
    { id: "gastric-ejections", name: "Gastric Ejections", severity: 2 },
    { id: "discrete-itching", name: "Discrete Itching", severity: 1 },
    { id: "broken-heart", name: "Broken Heart", severity: 2 },
    { id: "sideburns", name: "Third Degree Sideburns", severity: 2 },
    { id: "alien-dna", name: "Alien DNA", severity: 3 },
    { id: "chronic-nosehair", name: "Chronic Nosehair", severity: 2 },
    { id: "fake-blood", name: "Fake Blood", severity: 2 },
    { id: "iron-lungs", name: "Iron Lungs", severity: 3 },
    { id: "pregnancy", name: "Pregnancy", severity: 2 },
    { id: "ruptured-nodules", name: "Ruptured Nodules", severity: 3 }
];
export const TREATMENT_ROOM_TYPES = ["treatment", "pharmacy", "specialist", "fracture-clinic", "hair-restoration", "dna-fixer"];
const TREATMENT_ROOM_TYPE_BY_DISEASE_ID = {
    "mild-cold": "treatment",
    "itchy-feet": "treatment",
    "gastric-grumble": "pharmacy",
    "sleepy-bones": "pharmacy",
    "slack-tongue": "specialist",
    "cranial-pressure": "specialist",
    "acute-sneezes": "specialist",
    "gut-rot": "pharmacy",
    "king-complex": "specialist",
    "spare-ribs": "specialist",
    "kidney-beans": "specialist",
    "fractured-bones": "fracture-clinic",
    "corrugated-ankles": "specialist",
    "transparency": "specialist",
    "baldness": "hair-restoration",
    "broken-wind": "pharmacy",
    "golf-stones": "specialist",
    "infectious-laughter": "treatment",
    "radiation": "specialist",
    "sweaty-palms": "treatment",
    "unexpected-swelling": "specialist",
    "hairyitis": "specialist",
    "jellyitis": "specialist",
    "gastric-ejections": "pharmacy",
    "discrete-itching": "treatment",
    "broken-heart": "treatment",
    "sideburns": "specialist",
    "alien-dna": "dna-fixer",
    "chronic-nosehair": "pharmacy",
    "fake-blood": "specialist",
    "iron-lungs": "treatment",
    "pregnancy": "treatment",
    "ruptured-nodules": "treatment"
};
const DEFAULT_DISEASE_IDS_BY_SEVERITY = {
    1: ["mild-cold", "itchy-feet"],
    2: ["gastric-grumble", "sleepy-bones"],
    3: ["cranial-pressure", "acute-sneezes"]
};
const STAFF_ROLE_BY_ROOM_TYPE = {
    diagnosis: "diagnostician",
    treatment: "nurse",
    pharmacy: "nurse",
    specialist: "nurse",
    "fracture-clinic": "nurse",
    "hair-restoration": "diagnostician",
    "dna-fixer": "diagnostician"
};
const STAFF_SPECIALTY_BY_ROOM_TYPE = {
    specialist: "surgeon",
    "dna-fixer": "researcher"
};
const STAFF_WAGE_COST_PER_TICK_BY_ROLE = {
    diagnostician: 5,
    nurse: 4,
    handyman: 3,
    receptionist: 2
};
const ROOM_UPKEEP_COST_PER_TICK_BY_TYPE = {
    diagnosis: 2,
    treatment: 3,
    pharmacy: 4,
    specialist: 5,
    "fracture-clinic": 5,
    "hair-restoration": 5,
    "dna-fixer": 6
};
const STAFF_HIRE_COST_BY_ROLE = {
    diagnostician: 300,
    nurse: 250,
    handyman: 200,
    receptionist: 150
};
const ROOM_BUILD_COST_BY_TYPE = {
    diagnosis: 800,
    treatment: 1000,
    pharmacy: 1200,
    specialist: 1600,
    "fracture-clinic": 1500,
    "hair-restoration": 1600,
    "dna-fixer": 1800
};
const ROOM_REPAIR_COST_BY_TYPE = {
    diagnosis: 120,
    treatment: 150,
    pharmacy: 170,
    specialist: 220,
    "fracture-clinic": 220,
    "hair-restoration": 220,
    "dna-fixer": 240
};
const STAFF_BURNOUT_TICKS_BY_ROLE = {
    diagnostician: 8,
    nurse: 8,
    handyman: 10,
    receptionist: 8
};
const STAFF_AUTO_BREAK_TICKS_BY_ROLE = {
    diagnostician: 2,
    nurse: 2,
    handyman: 2,
    receptionist: 2
};
const ROOM_MAINTENANCE_WEAR_THRESHOLD_BY_TYPE = {
    diagnosis: 8,
    treatment: 8,
    pharmacy: 8,
    specialist: 8,
    "fracture-clinic": 8,
    "hair-restoration": 8,
    "dna-fixer": 8
};
const ROOM_MAINTENANCE_TICKS_BY_TYPE = {
    diagnosis: 2,
    treatment: 2,
    pharmacy: 2,
    specialist: 3,
    "fracture-clinic": 3,
    "hair-restoration": 3,
    "dna-fixer": 3
};
const MAINTENANCE_STAFF_REPAIR_BONUS_TICKS = 1;
const PROGRESSION_INCOME_BONUS_BY_UNLOCK = {
    "unlock.finance-ledger": 2,
    "unlock.insurance-contracts": 4,
    "unlock.vip-clinic": 6
};
export const PROGRESSION_MILESTONES = [
    {
        id: "milestone.first-discharge",
        minimumDischarges: 1,
        unlock: "unlock.finance-ledger"
    },
    {
        id: "milestone.patient-flow",
        minimumDischarges: 3,
        unlock: "unlock.insurance-contracts"
    },
    {
        id: "milestone.community-trust",
        minimumDischarges: 5,
        unlock: "unlock.vip-clinic"
    }
];
export const DEFAULT_STAFF_BLUEPRINT = ["diagnostician", "nurse"];
export const DEFAULT_ROOM_BLUEPRINT = ["diagnosis", "treatment"];
export const OPERATING_COST_PER_ACTIVE_PATIENT_PER_TICK = 3;
export const QUEUE_PRESSURE_HIGH_THRESHOLD = 3;
export const QUEUE_PRESSURE_REPUTATION_PENALTY_PER_TICK = 2;
export const PATIENT_CRITICAL_HEALTH_THRESHOLD = 12;
export function diagnosisTicksForSeverity(severity) {
    return DIAGNOSIS_TICKS_BY_SEVERITY[severity];
}
export function treatmentTicksForSeverity(severity) {
    return TREATMENT_TICKS_BY_SEVERITY[severity];
}
export function dischargeCashRewardForSeverity(severity) {
    return DISCHARGE_CASH_REWARD_BY_SEVERITY[severity];
}
export function dischargeReputationRewardForSeverity(severity) {
    return DISCHARGE_REPUTATION_REWARD_BY_SEVERITY[severity];
}
export function dischargeCashRewardForSeverityAndPricing(severity, policy = "standard") {
    return Math.floor(dischargeCashRewardForSeverity(severity) * treatmentPricingCashMultiplier(policy));
}
export function dischargeReputationRewardForSeverityAndPricing(severity, policy = "standard") {
    return Math.max(0, dischargeReputationRewardForSeverity(severity) + treatmentPricingReputationDelta(policy));
}
export function treatmentPricingCashMultiplier(policy = "standard") {
    return TREATMENT_PRICING_CASH_MULTIPLIER_BY_POLICY[policy];
}
export function treatmentPricingReputationDelta(policy = "standard") {
    return TREATMENT_PRICING_REPUTATION_DELTA_BY_POLICY[policy];
}
export function patientMaxHealthForSeverity(severity) {
    return PATIENT_MAX_HEALTH_BY_SEVERITY[severity];
}
export function patientDeathCashPenaltyForSeverity(severity) {
    return PATIENT_DEATH_CASH_PENALTY_BY_SEVERITY[severity];
}
export function patientDeathReputationPenaltyForSeverity(severity) {
    return PATIENT_DEATH_REPUTATION_PENALTY_BY_SEVERITY[severity];
}
export function patientSendHomeCashPenaltyForSeverity(severity) {
    return PATIENT_SEND_HOME_CASH_PENALTY_BY_SEVERITY[severity];
}
export function patientSendHomeReputationPenaltyForSeverity(severity) {
    return PATIENT_SEND_HOME_REPUTATION_PENALTY_BY_SEVERITY[severity];
}
export function treatmentFailureCashPenaltyForSeverity(severity) {
    return TREATMENT_FAILURE_CASH_PENALTY_BY_SEVERITY[severity];
}
export function treatmentFailureReputationPenaltyForSeverity(severity) {
    return TREATMENT_FAILURE_REPUTATION_PENALTY_BY_SEVERITY[severity];
}
export function diseaseForSeverity(severity, admissionIndex = 0) {
    const defaultDiseaseIds = DEFAULT_DISEASE_IDS_BY_SEVERITY[severity] ?? [];
    const candidates = defaultDiseaseIds
        .map((diseaseId) => diseaseForId(diseaseId))
        .filter(Boolean);
    return candidates[Math.abs(admissionIndex) % candidates.length];
}
export function diseaseForId(diseaseId) {
    return DISEASE_CATALOG.find((disease) => disease.id === diseaseId) ?? null;
}
export function treatmentRoomTypes() {
    return [...TREATMENT_ROOM_TYPES];
}
export function isTreatmentRoomType(roomType) {
    return TREATMENT_ROOM_TYPES.includes(roomType);
}
export function treatmentRoomTypeForDisease(diseaseId) {
    return TREATMENT_ROOM_TYPE_BY_DISEASE_ID[diseaseId] ?? "treatment";
}
export function treatmentRoomSuccessBonusForDisease(roomType, diseaseId) {
    return roomType === treatmentRoomTypeForDisease(diseaseId) ? TREATMENT_ROOM_MATCH_SUCCESS_BONUS : 0;
}
export function treatmentRoomDurationReductionForDisease(roomType, diseaseId) {
    return roomType === treatmentRoomTypeForDisease(diseaseId) ? TREATMENT_ROOM_MATCH_TICK_REDUCTION : 0;
}
export function treatmentSucceedsForPatient(patient, researchLevel = 0, treatmentRoomType = "treatment", researchSuccessBonusOverride = undefined) {
    if (patient.diagnosisKnown !== true) {
        return false;
    }
    const disease = DISEASE_CATALOG.find((candidate) => candidate.id === patient.diseaseId);
    const diseaseIndex = Math.max(0, DISEASE_CATALOG.findIndex((candidate) => candidate.id === patient.diseaseId));
    const severity = disease?.severity ?? patient.severity;
    const roll = ((patient.id * 37) + (diseaseIndex * 23)) % 100;
    const researchSuccessBonus = Number.isFinite(researchSuccessBonusOverride)
        ? researchSuccessBonusOverride
        : treatmentResearchSuccessBonusForLevel(researchLevel);
    return roll < Math.min(100, TREATMENT_SUCCESS_RATE_BY_SEVERITY[severity] +
        researchSuccessBonus +
        treatmentRoomSuccessBonusForDisease(treatmentRoomType, patient.diseaseId));
}
export function requiredStaffRoleForRoom(roomType) {
    return STAFF_ROLE_BY_ROOM_TYPE[roomType];
}
export function requiredStaffSpecialtyForRoom(roomType) {
    return STAFF_SPECIALTY_BY_ROOM_TYPE[roomType] ?? null;
}
export function staffWageCostPerTick(role) {
    return STAFF_WAGE_COST_PER_TICK_BY_ROLE[role];
}
export function roomUpkeepCostPerTick(roomType) {
    return ROOM_UPKEEP_COST_PER_TICK_BY_TYPE[roomType];
}
export function staffHireCost(role) {
    return STAFF_HIRE_COST_BY_ROLE[role];
}
export function roomBuildCost(roomType) {
    return ROOM_BUILD_COST_BY_TYPE[roomType];
}
export function roomSellRefund(roomType) {
    return Math.floor(roomBuildCost(roomType) / 2);
}
export function roomRepairCost(roomType) {
    return ROOM_REPAIR_COST_BY_TYPE[roomType];
}
export function staffBurnoutTicks(role) {
    return STAFF_BURNOUT_TICKS_BY_ROLE[role];
}
export function staffAutoBreakTicks(role) {
    return STAFF_AUTO_BREAK_TICKS_BY_ROLE[role];
}
export function roomMaintenanceWearThreshold(roomType) {
    return ROOM_MAINTENANCE_WEAR_THRESHOLD_BY_TYPE[roomType];
}
export function roomMaintenanceTicks(roomType) {
    return ROOM_MAINTENANCE_TICKS_BY_TYPE[roomType];
}
export function maintenanceStaffRepairBonusTicks() {
    return MAINTENANCE_STAFF_REPAIR_BONUS_TICKS;
}
export function treatmentResearchProjectCost() {
    return TREATMENT_RESEARCH_PROJECT_COST;
}
export function treatmentResearchProjectTicks() {
    return TREATMENT_RESEARCH_PROJECT_TICKS;
}
export function treatmentResearchMaxLevel() {
    return TREATMENT_RESEARCH_MAX_LEVEL;
}
export function treatmentResearchSuccessBonusForLevel(level) {
    if (!Number.isFinite(level) || level <= 0) {
        return 0;
    }
    return Math.min(TREATMENT_RESEARCH_MAX_LEVEL, Math.floor(level)) * TREATMENT_RESEARCH_SUCCESS_BONUS_PER_LEVEL;
}
export function emergencyWavePatientCount() {
    return EMERGENCY_WAVE_PATIENT_COUNT;
}
export function emergencyWaveSeverity() {
    return EMERGENCY_WAVE_SEVERITY;
}
export function emergencyWaveDurationTicks() {
    return EMERGENCY_WAVE_DURATION_TICKS;
}
export function emergencyWaveCashReward() {
    return EMERGENCY_WAVE_CASH_REWARD;
}
export function emergencyWaveReputationReward() {
    return EMERGENCY_WAVE_REPUTATION_REWARD;
}
export function epidemicOutbreakPatientCount() {
    return EPIDEMIC_OUTBREAK_PATIENT_COUNT;
}
export function epidemicOutbreakSeverity() {
    return EPIDEMIC_OUTBREAK_SEVERITY;
}
export function epidemicOutbreakDurationTicks() {
    return EPIDEMIC_OUTBREAK_DURATION_TICKS;
}
export function epidemicOutbreakSpreadIntervalTicks() {
    return EPIDEMIC_OUTBREAK_SPREAD_INTERVAL_TICKS;
}
export function epidemicOutbreakMaxSpreadPatients() {
    return EPIDEMIC_OUTBREAK_MAX_SPREAD_PATIENTS;
}
export function epidemicOutbreakCashReward() {
    return EPIDEMIC_OUTBREAK_CASH_REWARD;
}
export function epidemicOutbreakReputationReward() {
    return EPIDEMIC_OUTBREAK_REPUTATION_REWARD;
}
export function epidemicOutbreakCashPenalty() {
    return EPIDEMIC_OUTBREAK_CASH_PENALTY;
}
export function epidemicOutbreakReputationPenalty() {
    return EPIDEMIC_OUTBREAK_REPUTATION_PENALTY;
}
export function staffTrainingCost() {
    return STAFF_TRAINING_COST;
}
export function staffTrainingTicks() {
    return STAFF_TRAINING_TICKS;
}
export function staffMaxSkillLevel() {
    return STAFF_MAX_SKILL_LEVEL;
}
export function staffSkillDurationReductionForLevel(level) {
    if (!Number.isFinite(level) || level <= 0) {
        return 0;
    }
    return Math.min(STAFF_MAX_SKILL_LEVEL, Math.floor(level)) * STAFF_SKILL_DURATION_REDUCTION_PER_LEVEL;
}
export function vipInspectionDurationTicks() {
    return VIP_INSPECTION_DURATION_TICKS;
}
export function vipInspectionMaxQueuePressure() {
    return VIP_INSPECTION_MAX_QUEUE_PRESSURE;
}
export function vipInspectionMinReputation() {
    return VIP_INSPECTION_MIN_REPUTATION;
}
export function vipInspectionRewardCash() {
    return VIP_INSPECTION_REWARD_CASH;
}
export function vipInspectionRewardReputation() {
    return VIP_INSPECTION_REWARD_REPUTATION;
}
export function vipInspectionPenaltyCash() {
    return VIP_INSPECTION_PENALTY_CASH;
}
export function vipInspectionPenaltyReputation() {
    return VIP_INSPECTION_PENALTY_REPUTATION;
}
export function progressionIncomeBonusForUnlock(unlock) {
    return PROGRESSION_INCOME_BONUS_BY_UNLOCK[unlock];
}
export function loanChunkAmount() {
    return LOAN_CHUNK_AMOUNT;
}
export function loanMaxOutstanding() {
    return LOAN_MAX_OUTSTANDING;
}
export function loanInterestPerTickForOutstanding(outstandingLoan) {
    if (!Number.isFinite(outstandingLoan) || outstandingLoan <= 0) {
        return 0;
    }
    return Math.ceil(outstandingLoan / LOAN_CHUNK_AMOUNT) * LOAN_INTEREST_PER_TICK_PER_CHUNK;
}
export function financeAuditCashRecovery() {
    return FINANCE_AUDIT_CASH_RECOVERY;
}
export function financeAuditCooldownTicks() {
    return FINANCE_AUDIT_COOLDOWN_TICKS;
}
export function marketingCampaignCost() {
    return MARKETING_CAMPAIGN_COST;
}
export function marketingCampaignReputationGain() {
    return MARKETING_CAMPAIGN_REPUTATION_GAIN;
}
export function insuranceContractPatientCount() {
    return INSURANCE_CONTRACT_PATIENT_COUNT;
}
export function insuranceContractSeverity() {
    return INSURANCE_CONTRACT_SEVERITY;
}
export function insuranceContractDurationTicks() {
    return INSURANCE_CONTRACT_DURATION_TICKS;
}
export function insuranceContractCashReward() {
    return INSURANCE_CONTRACT_CASH_REWARD;
}
export function insuranceContractReputationReward() {
    return INSURANCE_CONTRACT_REPUTATION_REWARD;
}
export function insuranceContractCashPenalty() {
    return INSURANCE_CONTRACT_CASH_PENALTY;
}
export function insuranceContractReputationPenalty() {
    return INSURANCE_CONTRACT_REPUTATION_PENALTY;
}
export function hospitalRatingScoreForMetrics(metrics) {
    const reputationScore = Math.floor((metrics.reputation ?? 0) / 20);
    const dischargeScore = (metrics.dischargedPatients ?? 0) * 10;
    const milestoneScore = (metrics.milestoneLevel ?? 0) * 12;
    const staffingScore = (metrics.activeStaff ?? 0) * 2;
    const roomScore = (metrics.openRooms ?? 0) * 2;
    const deathPenalty = (metrics.patientDeaths ?? 0) * 25;
    const failurePenalty = (metrics.treatmentFailures ?? 0) * 15;
    const queuePenalty = (metrics.queuePressure ?? 0) * 8;
    return Math.max(0, Math.min(100, reputationScore + dischargeScore + milestoneScore + staffingScore + roomScore - deathPenalty - failurePenalty - queuePenalty));
}
export function hospitalAwardTierForScore(score) {
    if (score >= 80) {
        return "gold";
    }
    if (score >= 60) {
        return "silver";
    }
    if (score >= 40) {
        return "bronze";
    }
    return "none";
}
export function hospitalAwardCashReward(tier) {
    return HOSPITAL_AWARD_CASH_REWARD_BY_TIER[tier] ?? 0;
}
export function hospitalAwardReputationReward(tier) {
    return HOSPITAL_AWARD_REPUTATION_REWARD_BY_TIER[tier] ?? 0;
}
