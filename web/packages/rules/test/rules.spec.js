import { PHASE7_SLICE1_RULESET, PHASE7_SLICE2_RULESET, PHASE7_SLICE3_RULESET, PHASE7_SLICE4_RULESET, DEFAULT_ROOM_BLUEPRINT, DEFAULT_STAFF_BLUEPRINT, DISEASE_CATALOG, PROGRESSION_MILESTONES, QUEUE_PRESSURE_HIGH_THRESHOLD, QUEUE_PRESSURE_REPUTATION_PENALTY_PER_TICK, TREATMENT_PRICING_POLICIES, diseaseForSeverity, emergencyWaveCashReward, emergencyWaveDurationTicks, emergencyWavePatientCount, emergencyWaveReputationReward, emergencyWaveSeverity, epidemicOutbreakCashPenalty, epidemicOutbreakCashReward, epidemicOutbreakDurationTicks, epidemicOutbreakMaxSpreadPatients, epidemicOutbreakPatientCount, epidemicOutbreakReputationPenalty, epidemicOutbreakReputationReward, epidemicOutbreakSeverity, epidemicOutbreakSpreadIntervalTicks, financeAuditCashRecovery, financeAuditCooldownTicks, hospitalAwardCashReward, hospitalAwardReputationReward, hospitalAwardTierForScore, hospitalRatingScoreForMetrics, insuranceContractCashPenalty, insuranceContractCashReward, insuranceContractDurationTicks, insuranceContractPatientCount, insuranceContractReputationPenalty, insuranceContractReputationReward, insuranceContractSeverity, maintenanceStaffRepairBonusTicks, progressionIncomeBonusForUnlock, roomBuildCost, roomRepairCost, roomSellRefund, roomUpkeepCostPerTick, roomMaintenanceTicks, roomMaintenanceWearThreshold, staffHireCost, staffMaxSkillLevel, staffSkillDurationReductionForLevel, staffTrainingCost, staffTrainingTicks, staffWageCostPerTick, staffAutoBreakTicks, staffBurnoutTicks, diagnosisTicksForSeverity, patientSendHomeCashPenaltyForSeverity, patientSendHomeReputationPenaltyForSeverity, treatmentFailureCashPenaltyForSeverity, treatmentFailureReputationPenaltyForSeverity, treatmentResearchMaxLevel, treatmentResearchProjectCost, treatmentResearchProjectTicks, treatmentResearchSuccessBonusForLevel, treatmentRoomDurationReductionForDisease, treatmentRoomSuccessBonusForDisease, treatmentRoomTypeForDisease, treatmentRoomTypes, treatmentSucceedsForPatient, treatmentTicksForSeverity, dischargeCashRewardForSeverity, dischargeReputationRewardForSeverity, dischargeCashRewardForSeverityAndPricing, dischargeReputationRewardForSeverityAndPricing, loanChunkAmount, loanInterestPerTickForOutstanding, loanMaxOutstanding, marketingCampaignCost, marketingCampaignReputationGain, requiredStaffRoleForRoom, requiredStaffSpecialtyForRoom, vipInspectionDurationTicks, vipInspectionMaxQueuePressure, vipInspectionMinReputation, vipInspectionPenaltyCash, vipInspectionPenaltyReputation, vipInspectionRewardCash, vipInspectionRewardReputation } from "../src/index";
describe("phase 7 slice 1 gameplay rules", () => {
    it("exports a versioned ruleset marker for the core hospital loop slice", () => {
        expect(PHASE7_SLICE1_RULESET.id).toBe("phase7-slice1-hospital-loop.v1");
    });
    it("locks deterministic diagnosis and treatment durations by severity", () => {
        expect(diagnosisTicksForSeverity(1)).toBe(1);
        expect(diagnosisTicksForSeverity(2)).toBe(2);
        expect(diagnosisTicksForSeverity(3)).toBe(3);
        expect(treatmentTicksForSeverity(1)).toBe(1);
        expect(treatmentTicksForSeverity(2)).toBe(2);
        expect(treatmentTicksForSeverity(3)).toBe(3);
    });
    it("locks deterministic discharge rewards by severity", () => {
        expect(dischargeCashRewardForSeverity(1)).toBe(140);
        expect(dischargeCashRewardForSeverity(2)).toBe(180);
        expect(dischargeCashRewardForSeverity(3)).toBe(220);
        expect(dischargeReputationRewardForSeverity(1)).toBe(2);
        expect(dischargeReputationRewardForSeverity(2)).toBe(4);
        expect(dischargeReputationRewardForSeverity(3)).toBe(6);
    });
    it("locks deterministic treatment pricing policy tradeoffs", () => {
        expect(TREATMENT_PRICING_POLICIES).toEqual(["discount", "standard", "premium"]);
        expect(dischargeCashRewardForSeverityAndPricing(2, "discount")).toBe(135);
        expect(dischargeCashRewardForSeverityAndPricing(2, "standard")).toBe(180);
        expect(dischargeCashRewardForSeverityAndPricing(2, "premium")).toBe(243);
        expect(dischargeReputationRewardForSeverityAndPricing(2, "discount")).toBe(6);
        expect(dischargeReputationRewardForSeverityAndPricing(2, "standard")).toBe(4);
        expect(dischargeReputationRewardForSeverityAndPricing(2, "premium")).toBe(1);
    });
    it("locks deterministic disease catalog selection by severity and admission order", () => {
        expect(DISEASE_CATALOG).toHaveLength(33);
        expect(diseaseForSeverity(1, 0)).toMatchObject({ id: "mild-cold", name: "Mild Cold", severity: 1 });
        expect(diseaseForSeverity(1, 1)).toMatchObject({ id: "itchy-feet", name: "Itchy Feet", severity: 1 });
        expect(diseaseForSeverity(2, 0)).toMatchObject({ id: "gastric-grumble", name: "Gastric Grumble", severity: 2 });
        expect(diseaseForSeverity(2, 2)).toMatchObject({ id: "gastric-grumble", name: "Gastric Grumble", severity: 2 });
        expect(diseaseForSeverity(3, 1)).toMatchObject({ id: "acute-sneezes", name: "Acute Sneezes", severity: 3 });
        expect(diseaseForSeverity(3, 2)).toMatchObject({ id: "cranial-pressure", name: "Cranial Pressure", severity: 3 });
    });
    it("locks deterministic disease-to-treatment-room mapping and specialty bonuses", () => {
        expect(treatmentRoomTypes()).toEqual(["treatment", "pharmacy", "specialist", "inflation-room", "fracture-clinic", "hair-restoration", "dna-fixer"]);
        expect(treatmentRoomTypeForDisease("mild-cold")).toBe("treatment");
        expect(treatmentRoomTypeForDisease("gastric-grumble")).toBe("pharmacy");
        expect(treatmentRoomTypeForDisease("gut-rot")).toBe("pharmacy");
        expect(treatmentRoomTypeForDisease("slack-tongue")).toBe("specialist");
        expect(treatmentRoomTypeForDisease("cranial-pressure")).toBe("inflation-room");
        expect(treatmentRoomTypeForDisease("king-complex")).toBe("specialist");
        expect(treatmentRoomTypeForDisease("spare-ribs")).toBe("specialist");
        expect(treatmentRoomTypeForDisease("fractured-bones")).toBe("fracture-clinic");
        expect(treatmentRoomTypeForDisease("corrugated-ankles")).toBe("specialist");
        expect(treatmentRoomTypeForDisease("baldness")).toBe("hair-restoration");
        expect(treatmentRoomTypeForDisease("broken-wind")).toBe("pharmacy");
        expect(treatmentRoomTypeForDisease("radiation")).toBe("specialist");
        expect(treatmentRoomTypeForDisease("discrete-itching")).toBe("treatment");
        expect(treatmentRoomTypeForDisease("alien-dna")).toBe("dna-fixer");
        expect(treatmentRoomTypeForDisease("chronic-nosehair")).toBe("pharmacy");
        expect(treatmentRoomTypeForDisease("iron-lungs")).toBe("treatment");
        expect(treatmentRoomTypeForDisease("ruptured-nodules")).toBe("treatment");
        expect(treatmentRoomSuccessBonusForDisease("pharmacy", "gastric-grumble")).toBe(15);
        expect(treatmentRoomSuccessBonusForDisease("treatment", "gastric-grumble")).toBe(0);
        expect(treatmentRoomDurationReductionForDisease("inflation-room", "cranial-pressure")).toBe(1);
        expect(treatmentRoomSuccessBonusForDisease("dna-fixer", "alien-dna")).toBe(15);
        expect(treatmentRoomSuccessBonusForDisease("specialist", "alien-dna")).toBe(0);
        expect(treatmentRoomDurationReductionForDisease("dna-fixer", "alien-dna")).toBe(1);
    });
    it("locks deterministic treatment outcomes and failure penalties", () => {
        expect(treatmentSucceedsForPatient({
            id: 1,
            severity: 3,
            diseaseId: "cranial-pressure",
            diagnosisKnown: true
        })).toBe(true);
        expect(treatmentSucceedsForPatient({
            id: 2,
            severity: 3,
            diseaseId: "acute-sneezes",
            diagnosisKnown: true
        })).toBe(false);
        expect(treatmentSucceedsForPatient({
            id: 2,
            severity: 3,
            diseaseId: "acute-sneezes",
            diagnosisKnown: true
        }, 1)).toBe(true);
        expect(treatmentSucceedsForPatient({
            id: 5,
            severity: 3,
            diseaseId: "cranial-pressure",
            diagnosisKnown: true
        }, 0, "treatment")).toBe(false);
        expect(treatmentSucceedsForPatient({
            id: 5,
            severity: 3,
            diseaseId: "cranial-pressure",
            diagnosisKnown: true
        }, 0, "inflation-room")).toBe(true);
        expect(treatmentSucceedsForPatient({
            id: 1,
            severity: 1,
            diseaseId: "mild-cold",
            diagnosisKnown: false
        })).toBe(false);
        expect(treatmentFailureCashPenaltyForSeverity(3)).toBe(200);
        expect(treatmentFailureReputationPenaltyForSeverity(3)).toBe(14);
        expect(patientSendHomeCashPenaltyForSeverity(1)).toBe(40);
        expect(patientSendHomeCashPenaltyForSeverity(3)).toBe(110);
        expect(patientSendHomeReputationPenaltyForSeverity(1)).toBe(2);
        expect(patientSendHomeReputationPenaltyForSeverity(3)).toBe(8);
    });
    it("locks deterministic treatment research terms", () => {
        expect(treatmentResearchProjectCost()).toBe(1_500);
        expect(treatmentResearchProjectTicks()).toBe(6);
        expect(treatmentResearchMaxLevel()).toBe(3);
        expect(treatmentResearchSuccessBonusForLevel(0)).toBe(0);
        expect(treatmentResearchSuccessBonusForLevel(1)).toBe(20);
        expect(treatmentResearchSuccessBonusForLevel(99)).toBe(60);
    });
    it("locks deterministic emergency wave terms", () => {
        expect(emergencyWavePatientCount()).toBe(4);
        expect(emergencyWaveSeverity()).toBe(3);
        expect(emergencyWaveDurationTicks()).toBe(24);
        expect(emergencyWaveCashReward()).toBe(900);
        expect(emergencyWaveReputationReward()).toBe(45);
    });
    it("locks deterministic epidemic outbreak terms", () => {
        expect(epidemicOutbreakPatientCount()).toBe(3);
        expect(epidemicOutbreakSeverity()).toBe(2);
        expect(epidemicOutbreakDurationTicks()).toBe(18);
        expect(epidemicOutbreakSpreadIntervalTicks()).toBe(6);
        expect(epidemicOutbreakMaxSpreadPatients()).toBe(2);
        expect(epidemicOutbreakCashReward()).toBe(700);
        expect(epidemicOutbreakReputationReward()).toBe(30);
        expect(epidemicOutbreakCashPenalty()).toBe(500);
        expect(epidemicOutbreakReputationPenalty()).toBe(35);
    });
    it("locks deterministic staff training terms", () => {
        expect(staffTrainingCost()).toBe(700);
        expect(staffTrainingTicks()).toBe(5);
        expect(staffMaxSkillLevel()).toBe(3);
        expect(staffSkillDurationReductionForLevel(0)).toBe(0);
        expect(staffSkillDurationReductionForLevel(1)).toBe(1);
        expect(staffSkillDurationReductionForLevel(99)).toBe(3);
    });
    it("locks deterministic VIP inspection terms", () => {
        expect(vipInspectionDurationTicks()).toBe(8);
        expect(vipInspectionMaxQueuePressure()).toBe(2);
        expect(vipInspectionMinReputation()).toBe(450);
        expect(vipInspectionRewardCash()).toBe(800);
        expect(vipInspectionRewardReputation()).toBe(25);
        expect(vipInspectionPenaltyCash()).toBe(300);
        expect(vipInspectionPenaltyReputation()).toBe(20);
    });
    it("locks deterministic insurance contract terms", () => {
        expect(insuranceContractPatientCount()).toBe(2);
        expect(insuranceContractSeverity()).toBe(2);
        expect(insuranceContractDurationTicks()).toBe(16);
        expect(insuranceContractCashReward()).toBe(650);
        expect(insuranceContractReputationReward()).toBe(15);
        expect(insuranceContractCashPenalty()).toBe(250);
        expect(insuranceContractReputationPenalty()).toBe(12);
    });
    it("exports a versioned ruleset marker for staff lifecycle and room operations", () => {
        expect(PHASE7_SLICE2_RULESET.id).toBe("phase7-slice2-staff-room-ops.v1");
    });
    it("locks deterministic room-to-staff role mappings and default staffing blueprints", () => {
        expect(requiredStaffRoleForRoom("diagnosis")).toBe("diagnostician");
        expect(requiredStaffRoleForRoom("treatment")).toBe("nurse");
        expect(requiredStaffRoleForRoom("pharmacy")).toBe("nurse");
        expect(requiredStaffRoleForRoom("specialist")).toBe("nurse");
        expect(requiredStaffRoleForRoom("fracture-clinic")).toBe("nurse");
        expect(requiredStaffRoleForRoom("hair-restoration")).toBe("diagnostician");
        expect(requiredStaffRoleForRoom("dna-fixer")).toBe("diagnostician");
        expect(requiredStaffSpecialtyForRoom("specialist")).toBe("surgeon");
        expect(requiredStaffSpecialtyForRoom("dna-fixer")).toBe("researcher");
        expect(requiredStaffSpecialtyForRoom("fracture-clinic")).toBeNull();
        expect(requiredStaffSpecialtyForRoom("hair-restoration")).toBeNull();
        expect(requiredStaffSpecialtyForRoom("pharmacy")).toBeNull();
        expect(DEFAULT_STAFF_BLUEPRINT).toEqual(["diagnostician", "nurse"]);
        expect(DEFAULT_ROOM_BLUEPRINT).toEqual(["diagnosis", "treatment"]);
    });
    it("exports a versioned ruleset marker for economy/progression/events", () => {
        expect(PHASE7_SLICE3_RULESET.id).toBe("phase7-slice3-economy-progression-events.v1");
    });
    it("locks deterministic operating wages/upkeep costs and progression income bonuses", () => {
        expect(staffWageCostPerTick("diagnostician")).toBe(5);
        expect(staffWageCostPerTick("nurse")).toBe(4);
        expect(staffWageCostPerTick("handyman")).toBe(3);
        expect(roomUpkeepCostPerTick("diagnosis")).toBe(2);
        expect(roomUpkeepCostPerTick("treatment")).toBe(3);
        expect(roomUpkeepCostPerTick("pharmacy")).toBe(4);
        expect(roomUpkeepCostPerTick("specialist")).toBe(5);
        expect(roomUpkeepCostPerTick("inflation-room")).toBe(5);
        expect(roomUpkeepCostPerTick("dna-fixer")).toBe(6);
        expect(staffHireCost("diagnostician")).toBe(300);
        expect(staffHireCost("nurse")).toBe(250);
        expect(staffHireCost("handyman")).toBe(200);
        expect(roomBuildCost("diagnosis")).toBe(800);
        expect(roomBuildCost("treatment")).toBe(1000);
        expect(roomBuildCost("pharmacy")).toBe(1200);
        expect(roomBuildCost("specialist")).toBe(1600);
        expect(roomBuildCost("inflation-room")).toBe(1600);
        expect(roomBuildCost("dna-fixer")).toBe(1800);
        expect(roomSellRefund("diagnosis")).toBe(400);
        expect(roomSellRefund("treatment")).toBe(500);
        expect(roomSellRefund("pharmacy")).toBe(600);
        expect(roomSellRefund("specialist")).toBe(800);
        expect(roomSellRefund("inflation-room")).toBe(800);
        expect(roomSellRefund("dna-fixer")).toBe(900);
        expect(roomRepairCost("diagnosis")).toBe(120);
        expect(roomRepairCost("treatment")).toBe(150);
        expect(roomRepairCost("pharmacy")).toBe(170);
        expect(roomRepairCost("specialist")).toBe(220);
        expect(roomRepairCost("inflation-room")).toBe(220);
        expect(roomRepairCost("dna-fixer")).toBe(240);
        expect(progressionIncomeBonusForUnlock("unlock.finance-ledger")).toBe(2);
        expect(progressionIncomeBonusForUnlock("unlock.insurance-contracts")).toBe(4);
        expect(progressionIncomeBonusForUnlock("unlock.vip-clinic")).toBe(6);
    });
    it("locks deterministic loan financing terms", () => {
        expect(loanChunkAmount()).toBe(5_000);
        expect(loanMaxOutstanding()).toBe(20_000);
        expect(loanInterestPerTickForOutstanding(0)).toBe(0);
        expect(loanInterestPerTickForOutstanding(5_000)).toBe(2);
        expect(loanInterestPerTickForOutstanding(15_000)).toBe(6);
    });
    it("locks deterministic finance audit terms", () => {
        expect(financeAuditCashRecovery()).toBe(350);
        expect(financeAuditCooldownTicks()).toBe(10);
    });
    it("locks deterministic marketing campaign terms", () => {
        expect(marketingCampaignCost()).toBe(600);
        expect(marketingCampaignReputationGain()).toBe(35);
    });
    it("locks deterministic hospital rating and award terms", () => {
        expect(hospitalRatingScoreForMetrics({
            reputation: 500,
            dischargedPatients: 0,
            milestoneLevel: 0,
            activeStaff: 2,
            openRooms: 2,
            queuePressure: 0,
            patientDeaths: 0,
            treatmentFailures: 0
        })).toBe(33);
        expect(hospitalRatingScoreForMetrics({
            reputation: 512,
            dischargedPatients: 3,
            milestoneLevel: 2,
            activeStaff: 2,
            openRooms: 2,
            queuePressure: 0,
            patientDeaths: 0,
            treatmentFailures: 0
        })).toBe(87);
        expect(hospitalAwardTierForScore(39)).toBe("none");
        expect(hospitalAwardTierForScore(40)).toBe("bronze");
        expect(hospitalAwardTierForScore(60)).toBe("silver");
        expect(hospitalAwardTierForScore(80)).toBe("gold");
        expect(hospitalAwardCashReward("gold")).toBe(1000);
        expect(hospitalAwardReputationReward("gold")).toBe(30);
        expect(hospitalAwardCashReward("none")).toBe(0);
    });
    it("locks deterministic progression milestone thresholds and unlock ordering", () => {
        expect(PROGRESSION_MILESTONES).toEqual([
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
        ]);
    });
    it("exports a versioned ruleset marker for secondary systems and polish features", () => {
        expect(PHASE7_SLICE4_RULESET.id).toBe("phase7-slice4-secondary-polish.v1");
    });
    it("locks deterministic secondary-system thresholds for queue pressure, staff fatigue, and room maintenance", () => {
        expect(QUEUE_PRESSURE_HIGH_THRESHOLD).toBe(3);
        expect(QUEUE_PRESSURE_REPUTATION_PENALTY_PER_TICK).toBe(2);
        expect(staffBurnoutTicks("diagnostician")).toBe(8);
        expect(staffBurnoutTicks("nurse")).toBe(8);
        expect(staffBurnoutTicks("handyman")).toBe(10);
        expect(staffAutoBreakTicks("diagnostician")).toBe(2);
        expect(staffAutoBreakTicks("nurse")).toBe(2);
        expect(staffAutoBreakTicks("handyman")).toBe(2);
        expect(roomMaintenanceWearThreshold("diagnosis")).toBe(8);
        expect(roomMaintenanceWearThreshold("treatment")).toBe(8);
        expect(roomMaintenanceWearThreshold("pharmacy")).toBe(8);
        expect(roomMaintenanceWearThreshold("specialist")).toBe(8);
        expect(roomMaintenanceWearThreshold("dna-fixer")).toBe(8);
        expect(roomMaintenanceTicks("diagnosis")).toBe(2);
        expect(roomMaintenanceTicks("treatment")).toBe(2);
        expect(roomMaintenanceTicks("pharmacy")).toBe(2);
        expect(roomMaintenanceTicks("specialist")).toBe(3);
        expect(roomMaintenanceTicks("dna-fixer")).toBe(3);
        expect(maintenanceStaffRepairBonusTicks()).toBe(1);
    });
});
