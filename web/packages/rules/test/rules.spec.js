import { PHASE7_SLICE1_RULESET, PHASE7_SLICE2_RULESET, PHASE7_SLICE3_RULESET, PHASE7_SLICE4_RULESET, DEFAULT_ROOM_BLUEPRINT, DEFAULT_STAFF_BLUEPRINT, DISEASE_CATALOG, PROGRESSION_MILESTONES, QUEUE_PRESSURE_HIGH_THRESHOLD, QUEUE_PRESSURE_REPUTATION_PENALTY_PER_TICK, TREATMENT_PRICING_POLICIES, diseaseForSeverity, emergencyWaveCashReward, emergencyWaveDurationTicks, emergencyWavePatientCount, emergencyWaveReputationReward, emergencyWaveSeverity, epidemicOutbreakCashPenalty, epidemicOutbreakCashReward, epidemicOutbreakDurationTicks, epidemicOutbreakMaxSpreadPatients, epidemicOutbreakPatientCount, epidemicOutbreakReputationPenalty, epidemicOutbreakReputationReward, epidemicOutbreakSeverity, epidemicOutbreakSpreadIntervalTicks, facilityRoomTypes, financeAuditCashRecovery, financeAuditCooldownTicks, hospitalAwardCashReward, hospitalAwardReputationReward, hospitalAwardTierForScore, hospitalRatingScoreForMetrics, insuranceContractCashPenalty, insuranceContractCashReward, insuranceContractDurationTicks, insuranceContractPatientCount, insuranceContractReputationPenalty, insuranceContractReputationReward, insuranceContractSeverity, maintenanceStaffRepairBonusTicks, nativeRoomDefinitionForType, nativeRoomMinimumSize, progressionIncomeBonusForUnlock, roomBuildCost, roomRepairCost, roomSellRefund, roomUpkeepCostPerTick, roomMaintenanceTicks, roomMaintenanceWearThreshold, staffHireCost, staffMaxSkillLevel, staffSkillDurationReductionForLevel, staffTrainingCost, staffTrainingTicks, staffWageCostPerTick, staffAutoBreakTicks, staffBurnoutTicks, diagnosisRoomTypes, diagnosisTicksForSeverity, patientSendHomeCashPenaltyForSeverity, patientSendHomeReputationPenaltyForSeverity, treatmentFailureCashPenaltyForSeverity, treatmentFailureReputationPenaltyForSeverity, treatmentResearchMaxLevel, treatmentResearchProjectCost, treatmentResearchProjectTicks, treatmentResearchSuccessBonusForLevel, treatmentRoomDurationReductionForDisease, treatmentRoomSuccessBonusForDisease, treatmentRoomTypeForDisease, treatmentRoomTypes, treatmentSucceedsForPatient, treatmentTicksForSeverity, dischargeCashRewardForSeverity, dischargeReputationRewardForSeverity, dischargeCashRewardForSeverityAndPricing, dischargeReputationRewardForSeverityAndPricing, loanChunkAmount, loanInterestPerTickForOutstanding, loanMaxOutstanding, marketingCampaignCost, marketingCampaignReputationGain, requiredStaffCountForRoom, requiredStaffRoleForRoom, requiredStaffSpecialtyForRoom, vipInspectionDurationTicks, vipInspectionMaxQueuePressure, vipInspectionMinReputation, vipInspectionPenaltyCash, vipInspectionPenaltyReputation, vipInspectionRewardCash, vipInspectionRewardReputation } from "../src/index";
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
        expect(diagnosisRoomTypes()).toEqual(["diagnosis", "cardiogram", "scanner", "ultrascan", "blood-machine", "x-ray", "general-diagnosis"]);
        expect(facilityRoomTypes()).toEqual(["training-room"]);
        expect(treatmentRoomTypes()).toEqual(["treatment", "ward", "pharmacy", "operating-theatre", "specialist", "psychiatry", "inflation-room", "slack-tongue-clinic", "fracture-clinic", "hair-restoration", "jelly-vat", "decontamination", "electrolysis", "dna-fixer"]);
        expect(treatmentRoomTypeForDisease("mild-cold")).toBe("treatment");
        expect(treatmentRoomTypeForDisease("gastric-grumble")).toBe("psychiatry");
        expect(treatmentRoomTypeForDisease("gut-rot")).toBe("pharmacy");
        expect(treatmentRoomTypeForDisease("pregnancy")).toBe("ward");
        expect(treatmentRoomTypeForDisease("kidney-beans")).toBe("ward");
        expect(treatmentRoomTypeForDisease("slack-tongue")).toBe("slack-tongue-clinic");
        expect(treatmentRoomTypeForDisease("cranial-pressure")).toBe("inflation-room");
        expect(treatmentRoomTypeForDisease("acute-sneezes")).toBe("pharmacy");
        expect(treatmentRoomTypeForDisease("king-complex")).toBe("psychiatry");
        expect(treatmentRoomTypeForDisease("spare-ribs")).toBe("operating-theatre");
        expect(treatmentRoomTypeForDisease("fractured-bones")).toBe("fracture-clinic");
        expect(treatmentRoomTypeForDisease("corrugated-ankles")).toBe("pharmacy");
        expect(treatmentRoomTypeForDisease("transparency")).toBe("pharmacy");
        expect(treatmentRoomTypeForDisease("baldness")).toBe("hair-restoration");
        expect(treatmentRoomTypeForDisease("broken-wind")).toBe("pharmacy");
        expect(treatmentRoomTypeForDisease("infectious-laughter")).toBe("psychiatry");
        expect(treatmentRoomTypeForDisease("radiation")).toBe("decontamination");
        expect(treatmentRoomTypeForDisease("sweaty-palms")).toBe("psychiatry");
        expect(treatmentRoomTypeForDisease("hairyitis")).toBe("electrolysis");
        expect(treatmentRoomTypeForDisease("jellyitis")).toBe("jelly-vat");
        expect(treatmentRoomTypeForDisease("discrete-itching")).toBe("pharmacy");
        expect(treatmentRoomTypeForDisease("sideburns")).toBe("psychiatry");
        expect(treatmentRoomTypeForDisease("alien-dna")).toBe("dna-fixer");
        expect(treatmentRoomTypeForDisease("chronic-nosehair")).toBe("pharmacy");
        expect(treatmentRoomTypeForDisease("fake-blood")).toBe("psychiatry");
        expect(treatmentRoomTypeForDisease("broken-heart")).toBe("operating-theatre");
        expect(treatmentRoomTypeForDisease("iron-lungs")).toBe("operating-theatre");
        expect(treatmentRoomTypeForDisease("pregnancy")).toBe("ward");
        expect(treatmentRoomTypeForDisease("ruptured-nodules")).toBe("operating-theatre");
        expect(treatmentRoomSuccessBonusForDisease("psychiatry", "gastric-grumble")).toBe(15);
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
        expect(requiredStaffRoleForRoom("cardiogram")).toBe("diagnostician");
        expect(requiredStaffRoleForRoom("scanner")).toBe("diagnostician");
        expect(requiredStaffRoleForRoom("ultrascan")).toBe("diagnostician");
        expect(requiredStaffRoleForRoom("blood-machine")).toBe("diagnostician");
        expect(requiredStaffRoleForRoom("x-ray")).toBe("diagnostician");
        expect(requiredStaffRoleForRoom("general-diagnosis")).toBe("diagnostician");
        expect(requiredStaffRoleForRoom("treatment")).toBe("nurse");
        expect(requiredStaffRoleForRoom("ward")).toBe("nurse");
        expect(requiredStaffRoleForRoom("pharmacy")).toBe("nurse");
        expect(requiredStaffRoleForRoom("operating-theatre")).toBe("diagnostician");
        expect(requiredStaffRoleForRoom("specialist")).toBe("diagnostician");
        expect(requiredStaffRoleForRoom("psychiatry")).toBe("diagnostician");
        expect(requiredStaffRoleForRoom("slack-tongue-clinic")).toBe("diagnostician");
        expect(requiredStaffRoleForRoom("fracture-clinic")).toBe("nurse");
        expect(requiredStaffRoleForRoom("hair-restoration")).toBe("diagnostician");
        expect(requiredStaffRoleForRoom("jelly-vat")).toBe("diagnostician");
        expect(requiredStaffRoleForRoom("decontamination")).toBe("diagnostician");
        expect(requiredStaffRoleForRoom("electrolysis")).toBe("diagnostician");
        expect(requiredStaffRoleForRoom("dna-fixer")).toBe("diagnostician");
        expect(requiredStaffSpecialtyForRoom("psychiatry")).toBe("psychiatrist");
        expect(requiredStaffSpecialtyForRoom("operating-theatre")).toBe("surgeon");
        expect(requiredStaffSpecialtyForRoom("specialist")).toBe("surgeon");
        expect(requiredStaffSpecialtyForRoom("dna-fixer")).toBe("researcher");
        expect(requiredStaffCountForRoom("operating-theatre")).toBe(2);
        expect(requiredStaffCountForRoom("specialist")).toBe(2);
        expect(requiredStaffCountForRoom("treatment")).toBe(1);
        expect(requiredStaffSpecialtyForRoom("slack-tongue-clinic")).toBeNull();
        expect(requiredStaffSpecialtyForRoom("fracture-clinic")).toBeNull();
        expect(requiredStaffSpecialtyForRoom("hair-restoration")).toBeNull();
        expect(requiredStaffSpecialtyForRoom("jelly-vat")).toBeNull();
        expect(requiredStaffSpecialtyForRoom("decontamination")).toBeNull();
        expect(requiredStaffSpecialtyForRoom("electrolysis")).toBeNull();
        expect(requiredStaffSpecialtyForRoom("pharmacy")).toBeNull();
        expect(DEFAULT_STAFF_BLUEPRINT).toEqual(["diagnostician", "nurse"]);
        expect(DEFAULT_ROOM_BLUEPRINT).toEqual(["diagnosis", "treatment"]);
    });
    it("exports native room metadata for imported room parity", () => {
        expect(nativeRoomDefinitionForType("psychiatry")).toEqual({
            nativeId: "psych",
            nativeClass: "PsychRoom",
            levelConfigId: 8,
            categories: {
                treatment: 1,
                diagnosis: 8
            },
            objectsNeeded: {
                screen: 1,
                couch: 1,
                comfortable_chair: 1
            },
            objectsAdditional: ["extinguisher", "radiator", "plant", "bin", "bookcase", "skeleton"],
            buildPreviewAnimation: 924,
            minimumSize: 5,
            wallType: "white",
            floorTile: 18,
            requiredStaff: {
                Psychiatrist: 1
            },
            specialTreatmentStepsByDisease: {
                "king-complex": ["couch", "screen"]
            },
            defaultTreatmentSteps: ["couch"],
            callSound: "reqd003.wav"
        });
        expect(nativeRoomMinimumSize("psychiatry")).toBe(5);
        expect(nativeRoomDefinitionForType("training-room")).toEqual({
            nativeId: "training",
            nativeClass: "TrainingRoom",
            levelConfigId: 22,
            categories: {
                facilities: 4
            },
            objectsNeeded: {
                lecture_chair: 1,
                projector: 1
            },
            objectsAdditional: ["extinguisher", "radiator", "plant", "bin", "lecture_chair", "bookcase", "skeleton"],
            buildPreviewAnimation: 5086,
            minimumSize: 4,
            wallType: "green",
            floorTile: 17,
            requiredStaff: {},
            specialTreatmentStepsByDisease: {},
            defaultTreatmentSteps: [],
            trainingFactorObjects: ["projector", "skeleton", "bookcase"],
            hasNoQueueDialog: true
        });
        expect(nativeRoomMinimumSize("training-room")).toBe(4);
        expect(nativeRoomDefinitionForType("pharmacy")).toEqual({
            nativeId: "pharmacy",
            nativeClass: "PharmacyRoom",
            levelConfigId: 11,
            categories: {
                treatment: 4
            },
            objectsNeeded: {
                pharmacy_cabinet: 1
            },
            objectsAdditional: ["extinguisher", "radiator", "plant", "bin"],
            buildPreviewAnimation: 5088,
            minimumSize: 4,
            wallType: "white",
            floorTile: 19,
            requiredStaff: {
                Nurse: 1
            },
            specialTreatmentStepsByDisease: {},
            defaultTreatmentSteps: ["pharmacy_cabinet"],
            callSound: "reqd012.wav"
        });
        expect(nativeRoomMinimumSize("pharmacy")).toBe(4);
        expect(nativeRoomDefinitionForType("cardiogram")).toMatchObject({
            nativeId: "cardiogram",
            nativeClass: "CardiogramRoom",
            levelConfigId: 12,
            categories: { diagnosis: 3 },
            objectsNeeded: { cardio: 1, screen: 1 },
            minimumSize: 4,
            wallType: "yellow",
            floorTile: 19,
            requiredStaff: { Doctor: 1 },
            buildPreviewAnimation: 918,
            callSound: "reqd001.wav",
            handymanCallSound: "maint010.wav"
        });
        expect(nativeRoomDefinitionForType("scanner")).toMatchObject({
            nativeId: "scanner",
            nativeClass: "ScannerRoom",
            levelConfigId: 13,
            categories: { diagnosis: 4 },
            objectsNeeded: { scanner: 1, console: 1, screen: 1 },
            minimumSize: 5,
            requiredStaff: { Doctor: 1 },
            buildPreviewAnimation: 920,
            callSound: "reqd002.wav"
        });
        expect(nativeRoomDefinitionForType("ultrascan")).toMatchObject({
            nativeId: "ultrascan",
            nativeClass: "UltrascanRoom",
            levelConfigId: 14,
            categories: { diagnosis: 5 },
            objectsNeeded: { ultrascanner: 1 },
            minimumSize: 4,
            requiredStaff: { Doctor: 1 },
            buildPreviewAnimation: 5068,
            callSound: "reqd007.wav",
            handymanCallSound: "maint016.wav"
        });
        expect(nativeRoomDefinitionForType("blood-machine")).toMatchObject({
            nativeId: "blood_machine",
            nativeClass: "BloodMachineRoom",
            levelConfigId: 15,
            categories: { diagnosis: 6 },
            objectsNeeded: { blood_machine: 1 },
            minimumSize: 4,
            requiredStaff: { Doctor: 1 },
            buildPreviewAnimation: 5094,
            callSound: "reqd006.wav",
            handymanCallSound: "maint015.wav"
        });
        expect(nativeRoomDefinitionForType("x-ray")).toMatchObject({
            nativeId: "x_ray",
            nativeClass: "XRayRoom",
            levelConfigId: 16,
            categories: { diagnosis: 7 },
            objectsNeeded: { x_ray: 1, radiation_shield: 1 },
            minimumSize: 6,
            requiredStaff: { Doctor: 1 },
            buildPreviewAnimation: 5076,
            callSound: "reqd013.wav",
            handymanCallSound: "maint005.wav"
        });
        expect(nativeRoomDefinitionForType("general-diagnosis")).toMatchObject({
            nativeId: "general_diag",
            nativeClass: "GeneralDiagRoom",
            levelConfigId: 27,
            categories: { diagnosis: 2 },
            objectsNeeded: { screen: 1, crash_trolley: 1 },
            minimumSize: 5,
            wallType: "green",
            floorTile: 21,
            requiredStaff: { Doctor: 1 },
            buildPreviewAnimation: 916,
            callSound: "reqd021.wav"
        });
        expect(nativeRoomDefinitionForType("fracture-clinic")).toMatchObject({
            nativeId: "fracture_clinic",
            nativeClass: "FractureRoom",
            levelConfigId: 21,
            categories: { clinics: 3 },
            objectsNeeded: { cast_remover: 1 },
            objectsAdditional: ["extinguisher", "radiator", "plant", "bin"],
            minimumSize: 4,
            wallType: "blue",
            floorTile: 17,
            requiredStaff: { Nurse: 1 },
            buildPreviewAnimation: 5072,
            defaultTreatmentSteps: ["cast_remover"],
            callSound: "reqd004.wav",
            handymanCallSound: "maint014.wav"
        });
        expect(nativeRoomMinimumSize("fracture-clinic")).toBe(4);
        expect(nativeRoomDefinitionForType("inflation-room")).toMatchObject({
            nativeId: "inflation",
            nativeClass: "InflationRoom",
            levelConfigId: 17,
            categories: { clinics: 1 },
            objectsNeeded: { inflator: 1 },
            minimumSize: 4,
            requiredStaff: { Doctor: 1 },
            buildPreviewAnimation: 908,
            defaultTreatmentSteps: ["inflator"],
            callSound: "reqd014.wav",
            handymanCallSound: "maint013.wav"
        });
        expect(nativeRoomDefinitionForType("slack-tongue-clinic")).toMatchObject({
            nativeId: "slack_tongue",
            nativeClass: "SlackTongueRoom",
            levelConfigId: 20,
            categories: { clinics: 2 },
            objectsNeeded: { slicer: 1 },
            minimumSize: 4,
            requiredStaff: { Doctor: 1 },
            buildPreviewAnimation: 932,
            defaultTreatmentSteps: ["slicer"],
            callSound: "reqd005.wav",
            handymanCallSound: "maint004.wav"
        });
        expect(nativeRoomDefinitionForType("hair-restoration")).toMatchObject({
            nativeId: "hair_restoration",
            nativeClass: "HairRestorationRoom",
            levelConfigId: 19,
            categories: { clinics: 4 },
            objectsNeeded: { hair_restorer: 1, console: 1 },
            minimumSize: 4,
            requiredStaff: { Doctor: 1 },
            buildPreviewAnimation: 5074,
            defaultTreatmentSteps: ["hair_restorer"],
            callSound: "reqd016.wav",
            handymanCallSound: "maint007.wav"
        });
        expect(nativeRoomDefinitionForType("jelly-vat")).toMatchObject({
            nativeId: "jelly_vat",
            nativeClass: "JellyVatRoom",
            levelConfigId: 24,
            categories: { clinics: 7 },
            objectsNeeded: { jelly_moulder: 1 },
            minimumSize: 4,
            requiredStaff: { Doctor: 1 },
            buildPreviewAnimation: 928,
            defaultTreatmentSteps: ["jelly_moulder"],
            callSound: "reqd020.wav",
            handymanCallSound: "maint009.wav"
        });
        expect(nativeRoomDefinitionForType("decontamination")).toMatchObject({
            nativeId: "decontamination",
            nativeClass: "DecontaminationRoom",
            levelConfigId: 30,
            categories: { clinics: 8 },
            objectsNeeded: { shower: 1, console: 1 },
            minimumSize: 5,
            floorTile: 19,
            requiredStaff: { Doctor: 1 },
            buildPreviewAnimation: 5100,
            defaultTreatmentSteps: ["shower"],
            callSound: "reqd024.wav",
            handymanCallSound: "maint012.wav"
        });
        expect(nativeRoomDefinitionForType("electrolysis")).toMatchObject({
            nativeId: "electrolysis",
            nativeClass: "ElectrolysisRoom",
            levelConfigId: 23,
            categories: { clinics: 5 },
            objectsNeeded: { electrolyser: 1, console: 1 },
            minimumSize: 5,
            floorTile: 17,
            requiredStaff: { Doctor: 1 },
            buildPreviewAnimation: 930,
            defaultTreatmentSteps: ["electrolyser"],
            callSound: "reqd019.wav",
            handymanCallSound: "maint008.wav"
        });
        expect(nativeRoomDefinitionForType("dna-fixer")).toMatchObject({
            nativeId: "dna_fixer",
            nativeClass: "DNAFixerRoom",
            levelConfigId: 23,
            categories: { clinics: 6 },
            objectsNeeded: { dna_fixer: 1, console: 1 },
            minimumSize: 5,
            swingDoors: true,
            requiredStaff: { Researcher: 1 },
            buildPreviewAnimation: 5070,
            defaultTreatmentSteps: ["dna_fixer"],
            callSound: "reqd015.wav",
            handymanCallSound: "maint006.wav"
        });
        expect(["decontamination", "electrolysis", "dna-fixer"].map(nativeRoomMinimumSize)).toEqual([5, 5, 5]);
        expect(["inflation-room", "slack-tongue-clinic", "hair-restoration", "jelly-vat"].map(nativeRoomMinimumSize)).toEqual([4, 4, 4, 4]);
        expect(["cardiogram", "scanner", "ultrascan", "blood-machine", "x-ray", "general-diagnosis"].map(nativeRoomMinimumSize)).toEqual([4, 5, 4, 4, 6, 5]);
        const mutableDefinition = nativeRoomDefinitionForType("psychiatry");
        const mutableTrainingDefinition = nativeRoomDefinitionForType("training-room");
        const mutablePharmacyDefinition = nativeRoomDefinitionForType("pharmacy");
        const mutableScannerDefinition = nativeRoomDefinitionForType("scanner");
        const mutableFractureDefinition = nativeRoomDefinitionForType("fracture-clinic");
        const mutableHairDefinition = nativeRoomDefinitionForType("hair-restoration");
        const mutableDnaFixerDefinition = nativeRoomDefinitionForType("dna-fixer");
        mutableDefinition.objectsNeeded.screen = 0;
        mutableDefinition.specialTreatmentStepsByDisease["king-complex"].push("bookcase");
        mutableTrainingDefinition.objectsNeeded.projector = 0;
        mutableTrainingDefinition.trainingFactorObjects.push("radiator");
        mutablePharmacyDefinition.objectsNeeded.pharmacy_cabinet = 0;
        mutablePharmacyDefinition.defaultTreatmentSteps.push("bin");
        mutableScannerDefinition.objectsNeeded.console = 0;
        mutableFractureDefinition.objectsNeeded.cast_remover = 0;
        mutableHairDefinition.objectsNeeded.console = 0;
        mutableDnaFixerDefinition.objectsNeeded.console = 0;
        expect(nativeRoomDefinitionForType("psychiatry")).toMatchObject({
            objectsNeeded: { screen: 1 },
            specialTreatmentStepsByDisease: { "king-complex": ["couch", "screen"] }
        });
        expect(nativeRoomDefinitionForType("training-room")).toMatchObject({
            objectsNeeded: { projector: 1 },
            trainingFactorObjects: ["projector", "skeleton", "bookcase"]
        });
        expect(nativeRoomDefinitionForType("pharmacy")).toMatchObject({
            objectsNeeded: { pharmacy_cabinet: 1 },
            defaultTreatmentSteps: ["pharmacy_cabinet"]
        });
        expect(nativeRoomDefinitionForType("scanner")).toMatchObject({
            objectsNeeded: { console: 1 }
        });
        expect(nativeRoomDefinitionForType("fracture-clinic")).toMatchObject({
            objectsNeeded: { cast_remover: 1 }
        });
        expect(nativeRoomDefinitionForType("hair-restoration")).toMatchObject({
            objectsNeeded: { console: 1 }
        });
        expect(nativeRoomDefinitionForType("dna-fixer")).toMatchObject({
            objectsNeeded: { console: 1 }
        });
        expect(nativeRoomDefinitionForType("treatment")).toBeNull();
        expect(nativeRoomMinimumSize("treatment")).toBeNull();
    });
    it("exports a versioned ruleset marker for economy/progression/events", () => {
        expect(PHASE7_SLICE3_RULESET.id).toBe("phase7-slice3-economy-progression-events.v1");
    });
    it("locks deterministic operating wages/upkeep costs and progression income bonuses", () => {
        expect(staffWageCostPerTick("diagnostician")).toBe(5);
        expect(staffWageCostPerTick("nurse")).toBe(4);
        expect(staffWageCostPerTick("handyman")).toBe(3);
        expect(roomUpkeepCostPerTick("diagnosis")).toBe(2);
        expect(roomUpkeepCostPerTick("cardiogram")).toBe(4);
        expect(roomUpkeepCostPerTick("scanner")).toBe(5);
        expect(roomUpkeepCostPerTick("ultrascan")).toBe(5);
        expect(roomUpkeepCostPerTick("blood-machine")).toBe(4);
        expect(roomUpkeepCostPerTick("x-ray")).toBe(5);
        expect(roomUpkeepCostPerTick("general-diagnosis")).toBe(4);
        expect(roomUpkeepCostPerTick("treatment")).toBe(3);
        expect(roomUpkeepCostPerTick("ward")).toBe(3);
        expect(roomUpkeepCostPerTick("pharmacy")).toBe(4);
        expect(roomUpkeepCostPerTick("operating-theatre")).toBe(5);
        expect(roomUpkeepCostPerTick("specialist")).toBe(5);
        expect(roomUpkeepCostPerTick("psychiatry")).toBe(5);
        expect(roomUpkeepCostPerTick("training-room")).toBe(3);
        expect(roomUpkeepCostPerTick("inflation-room")).toBe(5);
        expect(roomUpkeepCostPerTick("slack-tongue-clinic")).toBe(5);
        expect(roomUpkeepCostPerTick("jelly-vat")).toBe(6);
        expect(roomUpkeepCostPerTick("decontamination")).toBe(6);
        expect(roomUpkeepCostPerTick("electrolysis")).toBe(6);
        expect(roomUpkeepCostPerTick("dna-fixer")).toBe(6);
        expect(staffHireCost("diagnostician")).toBe(300);
        expect(staffHireCost("nurse")).toBe(250);
        expect(staffHireCost("handyman")).toBe(200);
        expect(roomBuildCost("diagnosis")).toBe(800);
        expect(roomBuildCost("cardiogram")).toBe(2000);
        expect(roomBuildCost("scanner")).toBe(4000);
        expect(roomBuildCost("ultrascan")).toBe(3000);
        expect(roomBuildCost("blood-machine")).toBe(3000);
        expect(roomBuildCost("x-ray")).toBe(4000);
        expect(roomBuildCost("general-diagnosis")).toBe(1500);
        expect(roomBuildCost("treatment")).toBe(1000);
        expect(roomBuildCost("ward")).toBe(1700);
        expect(roomBuildCost("pharmacy")).toBe(1200);
        expect(roomBuildCost("operating-theatre")).toBe(1600);
        expect(roomBuildCost("specialist")).toBe(1600);
        expect(roomBuildCost("psychiatry")).toBe(2500);
        expect(roomBuildCost("training-room")).toBe(2000);
        expect(roomBuildCost("inflation-room")).toBe(1600);
        expect(roomBuildCost("slack-tongue-clinic")).toBe(1600);
        expect(roomBuildCost("jelly-vat")).toBe(4500);
        expect(roomBuildCost("decontamination")).toBe(5500);
        expect(roomBuildCost("electrolysis")).toBe(500);
        expect(roomBuildCost("dna-fixer")).toBe(1800);
        expect(roomSellRefund("diagnosis")).toBe(400);
        expect(roomSellRefund("treatment")).toBe(500);
        expect(roomSellRefund("pharmacy")).toBe(600);
        expect(roomSellRefund("operating-theatre")).toBe(800);
        expect(roomSellRefund("specialist")).toBe(800);
        expect(roomSellRefund("psychiatry")).toBe(1250);
        expect(roomSellRefund("inflation-room")).toBe(800);
        expect(roomSellRefund("slack-tongue-clinic")).toBe(800);
        expect(roomSellRefund("jelly-vat")).toBe(2250);
        expect(roomSellRefund("decontamination")).toBe(2750);
        expect(roomSellRefund("electrolysis")).toBe(250);
        expect(roomSellRefund("dna-fixer")).toBe(900);
        expect(roomRepairCost("diagnosis")).toBe(120);
        expect(roomRepairCost("treatment")).toBe(150);
        expect(roomRepairCost("pharmacy")).toBe(170);
        expect(roomRepairCost("operating-theatre")).toBe(220);
        expect(roomRepairCost("specialist")).toBe(220);
        expect(roomRepairCost("psychiatry")).toBe(220);
        expect(roomRepairCost("training-room")).toBe(160);
        expect(roomRepairCost("slack-tongue-clinic")).toBe(220);
        expect(roomRepairCost("inflation-room")).toBe(220);
        expect(roomRepairCost("jelly-vat")).toBe(280);
        expect(roomRepairCost("decontamination")).toBe(300);
        expect(roomRepairCost("electrolysis")).toBe(260);
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
        expect(roomMaintenanceWearThreshold("operating-theatre")).toBe(8);
        expect(roomMaintenanceWearThreshold("specialist")).toBe(8);
        expect(roomMaintenanceWearThreshold("psychiatry")).toBe(8);
        expect(roomMaintenanceWearThreshold("training-room")).toBe(8);
        expect(roomMaintenanceWearThreshold("dna-fixer")).toBe(8);
        expect(roomMaintenanceTicks("diagnosis")).toBe(2);
        expect(roomMaintenanceTicks("treatment")).toBe(2);
        expect(roomMaintenanceTicks("pharmacy")).toBe(2);
        expect(roomMaintenanceTicks("operating-theatre")).toBe(3);
        expect(roomMaintenanceTicks("specialist")).toBe(3);
        expect(roomMaintenanceTicks("psychiatry")).toBe(3);
        expect(roomMaintenanceTicks("training-room")).toBe(2);
        expect(roomMaintenanceTicks("dna-fixer")).toBe(3);
        expect(maintenanceStaffRepairBonusTicks()).toBe(1);
    });
});
