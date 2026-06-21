import { existsSync, readFileSync } from "node:fs";
import {
    createAssetBundle,
    decodeThemeHospitalScenario,
    decodeThemeHospitalMap,
    getRncOutputSize,
    isRncCompressed,
    THEME_HOSPITAL_MAP_FILE_SIZE
} from "../src/index";

function syntheticMapBytes() {
    const bytes = new Uint8Array(THEME_HOSPITAL_MAP_FILE_SIZE);
    bytes[0] = 1;
    for (let tileIndex = 0; tileIndex < 128 * 128; tileIndex += 1) {
        const recordOffset = 34 + tileIndex * 8;
        const parcelOffset = 131_106 + tileIndex * 2;
        bytes[recordOffset + 2] = tileIndex % 2;
        bytes[recordOffset + 5] = 0;
        bytes[parcelOffset] = 1;
        bytes[parcelOffset + 1] = 0;
    }
    const cameraIndex = 63 * 128 + 63;
    bytes[163_876] = cameraIndex & 0xff;
    bytes[163_877] = cameraIndex >> 8;
    return bytes;
}

describe("Theme Hospital map decoder", () => {
    it("decodes fixed-size original map files into browser map state", () => {
        const bytes = readFileSync(new URL("../../../../CorsixTH/Levels/Example.map", import.meta.url));
        const decoded = decodeThemeHospitalMap(bytes);
        expect(decoded.contract).toBe("theme-hospital-map.v1");
        expect(decoded.width).toBe(128);
        expect(decoded.height).toBe(128);
        expect(decoded.tileCount).toBe(16_384);
        expect(decoded.playerCount).toBe(1);
        expect(decoded.tiles).toHaveLength(16_384);
        expect(decoded.tiles[0]).toMatchObject({
            x: 0,
            y: 0,
            ground: 2,
            northWall: 0,
            westWall: 0
        });
        expect(decoded.stats.hospitalTileCount).toBeGreaterThan(0);
        expect(decoded.parcelCount).toBeGreaterThan(0);
    });
    it("summarizes imported .MAP files in the asset bundle manifest", () => {
        const result = createAssetBundle([
            { path: "HOSPITAL.CFG", bytes: new TextEncoder().encode("LANGUAGE=ENG\n") },
            { path: "HOSPITAL.EXE", bytes: new TextEncoder().encode("MZ") },
            { path: "DATA/ANIMS.DAT", bytes: new Uint8Array([1]) },
            { path: "LEVELS/EXAMPLE.MAP", bytes: syntheticMapBytes() },
            { path: "QDATA/TEXT.DAT", bytes: new Uint8Array([2]) }
        ]);
        expect(result.status).toBe("ready");
        expect(result.manifest?.mapSummaries).toHaveLength(1);
        expect(result.manifest?.mapSummaries[0]).toMatchObject({
            path: "LEVELS/EXAMPLE.MAP",
            width: 128,
            height: 128,
            playerCount: 1,
            parcelCount: 1,
            passableTileCount: 16_384
        });
    });
    it("summarizes original campaign LEVEL.L files as map assets", () => {
        const result = createAssetBundle([
            { path: "HOSPITAL.CFG", bytes: new TextEncoder().encode("LANGUAGE=ENG\n") },
            { path: "HOSPITAL.EXE", bytes: new TextEncoder().encode("MZ") },
            { path: "DATA/ANIMS.DAT", bytes: new Uint8Array([1]) },
            { path: "LEVELS/LEVEL.L1", bytes: syntheticMapBytes() },
            { path: "QDATA/TEXT.DAT", bytes: new Uint8Array([2]) }
        ]);
        expect(result.status).toBe("ready");
        expect(result.manifest?.mapSummaries).toHaveLength(1);
        expect(result.manifest?.mapSummaries[0]?.path).toBe("LEVELS/LEVEL.L1");
    });
    it("orders original campaign LEVEL.L files by numeric level for browser progression", () => {
        const result = createAssetBundle([
            { path: "HOSPITAL.CFG", bytes: new TextEncoder().encode("LANGUAGE=ENG\n") },
            { path: "HOSPITAL.EXE", bytes: new TextEncoder().encode("MZ") },
            { path: "DATA/ANIMS.DAT", bytes: new Uint8Array([1]) },
            { path: "LEVELS/LEVEL.L10", bytes: syntheticMapBytes() },
            { path: "LEVELS/LEVEL.L2", bytes: syntheticMapBytes() },
            { path: "LEVELS/LEVEL.L1", bytes: syntheticMapBytes() },
            { path: "LEVELS/EXAMPLE.MAP", bytes: syntheticMapBytes() },
            { path: "QDATA/TEXT.DAT", bytes: new Uint8Array([2]) }
        ]);
        expect(result.status).toBe("ready");
        expect(result.manifest?.mapSummaries.map((summary) => summary.path)).toEqual([
            "LEVELS/LEVEL.L1",
            "LEVELS/LEVEL.L2",
            "LEVELS/LEVEL.L10",
            "LEVELS/EXAMPLE.MAP"
        ]);
    });
    it("parses original scenario win and lose criteria for browser objectives", () => {
        const scenario = decodeThemeHospitalScenario(new TextEncoder().encode(`
Level One
#gbv.HoldVisualMonths 2
#gbv.HoldVisualPeepCount 4
#gbv.StartRating 95
#gbv.ResearchPointsDivisor 4
#gbv.StartCost 100
#gbv.MinDrugCost 50
#gbv.DrugImproveRate 5
#gbv.MaxObjectStrength 20
#gbv.ResearchIncrement 2
#gbv.RschImproveCostPercent 10
#gbv.RschImproveIncrementPercent 10
#gbv.TrainingRate 40
#gbv.PromoDoc 6
#gbv.PromoCon 12
#gbv.AbilityThreshold[0] 75 SURGEON
#gbv.AbilityThreshold[1] 60 PSYCHO
#gbv.AbilityThreshold[2] 45 RESEARCHER
#gbv.TrainingValue[0] 10 Projector
#gbv.TrainingValue[1] 15 Skeleton
#gbv.DoctorThreshold 250
#gbv.ConsultantThreshold 750
#gbv.HowContagious 25
#gbv.ContagiousSpreadFactor 25
#gbv.ReduceContMonths 6
#gbv.ReduceContPeepCount 10
#gbv.ReduceContRate 0
#gbv.EpidemicFine 2000
#gbv.EpidemicCompLo 1000
#gbv.EpidemicCompHi 15000
#gbv.ScoreMaxInc 300
#gbv.VacCost 50
#gbv.RemoveRatHoleChance 3000
#gbv.MinimumAbductTime 4
#gbv.AbductionsPerYear 2
#gbv.AutopsyRschPercent 33
#gbv.AutopsyRepHitPercent 20
#gbv.MayorLaunch 1
#gbv.DisasterLaunch 200
#gbv.LandCostPerTile 25
#gbv.QPoints 15
#gbv.DistPoints 1
#gbv.NoStaffPoints 20
#gbv.RestStanding 3
#gbv.RestSofa 8
#gbv.RestGame 60
#gbv.RestSnooker 30
#gbv.WorkLight 1
#gbv.ModifyFreq 16
#gbv.NotTired 300
#gbv.Tired 600
#gbv.VeryTired 700
#gbv.CrackUpTired 800
#gbv.RecoveryFactor 450
#gbv.RecoveryMinimum 3
#gbv.LitterDrop 25
#gbv.LeaveMax 150
#gbv.ResignMax 150
#gbv.Happy 75
#gbv.Unhappy 50
#gbv.VeryUnhappy 25
#gbv.DrinkHappy 5
#gbv.ToiletHappy 10
#gbv.BowelFull 50
#gbv.BowelOverflows 75
#gbv.VomitLimit 50
#gbv.LitterRandom 60
#gbv.SalaryAdd[3] -30 Junior
#gbv.SalaryAdd[4] 30 Doctor
#gbv.SalaryAdd[7] 100 Consultant
#gbv.SalaryAbilityDivisor 10
#gbv.SalaryTooLow -10
#gbv.SalaryTooHigh 20
#gbv.AllocRand 4
#gbv.AllocTotalRep 1
#gbv.AllocIndRep 2
#gbv.AllocDelay 3
#towns[1].StartCash.IllRate.InterestRate 40000 2 100 Level 1
#rooms[7].Cost 2280 GP_OFFICE
#rooms[8].Cost 2270 PSYCH
#rooms[9].Cost 1700 WARD
#rooms[11].Cost 500 PHARMACY
#rooms[12].Cost 470 CARDIO
#rooms[13].Cost 4000 SCANNER
#rooms[14].Cost 3000 ULTRASCAN
#rooms[15].Cost 3200 BLOOD_MACHINE
#rooms[16].Cost 4000 X_RAY
#rooms[17].Cost 1500 INFLATOR
#rooms[19].Cost 500 HAIR_RESTORE
#rooms[21].Cost 500 FRACTURE
#rooms[23].Cost 1800 DNA_FIXER
#rooms[23].Cost 500 ELECTRO
#rooms[24].Cost 4500 JELLY_VAT
#rooms[27].Cost 1500 GENERAL_DIAG
#rooms[30].Cost 5500 DECON_SHOWER
#staff[0].MinSalary 45 Nurse
#staff[1].MinSalary 60 Doctor
#staff[2].MinSalary 20 Handyman
#staff[3].MinSalary 15 Receptionist
#win_criteria[0].Criteria.MaxMin.Value.Group.Bound 1 1 300 1 250
#win_criteria[1].Criteria.MaxMin.Value.Group.Bound 2 1 1000 1 0
#win_criteria[2].Criteria.MaxMin.Value.Group.Bound 3 1 40 1 0
#win_criteria[3].Criteria.MaxMin.Value.Group.Bound 4 1 10 1 0
#lose_criteria[0].Criteria.MaxMin.Value.Group.Bound 5 1 50 3 40
#awards_trophies.CuresAward 10
#awards_trophies.ReputationAward 600
#awards_trophies.HospValuePoor 40000
#awards_trophies.CuresPenalty -3000
#emergency_control[0].StartMonth.EndMonth.Min.Max.Illness.PercWin.Bonus 4 5 2 4 16 75 400
#emergency_control[1].StartMonth.EndMonth.Min.Max.Illness.PercWin.Bonus 0 0 0 0 0 0 0
#quake_control[0].StartMonth.EndMonth.Severity 6 8 4
#quake_control[1].StartMonth.EndMonth.Severity 0 0 0
#expertise[16].StartPrice.ContRate.Known.RschReqd.MaxDiagDiff 300 4 0 10000 100 UNCOMMON_COLD
#expertise[38].ContRate.Known.RschReqd 0 0 40000 I_D_CARDIO DIAGNOSIS
#computer[0].Skill.StaffLevels.Luck.Speed.Comfort.GuessAt.Playing 3 4 3 30 7 90 1 ORAC
#popn[0].Month.Change 0 3
#popn[1].Month.Change 2 1
#visuals[0] 5 I_BLOATY_HEAD
#visuals[2] 3 I_ELVIS
#visuals[5] 3 I_SLACK_TONGUE
#visuals[6] 0 I_ALIEN
#visuals[8] 4 I_BALDNESS
#visuals[10] 4 I_JELLYITUS
#visuals[12] 2 I_PREGNANT
#visuals_available[13] 6 I_TRANSPARENCY
#non_visuals[0] 5 I_UNCOMMON_COLD
#non_visuals[2] 4 I_SPARE_RIBS
#non_visuals[3] 4 I_KIDNEY_BEANS
#non_visuals[5] 2 I_RUPTURED_NODULES
#non_visuals[7] 3 I_INFECTIOUS_LAUGHTER
#non_visuals[9] 2 I_CHRONIC_NOSEHAIR
#non_visuals[11] 2 I_FAKE_BLOOD
#non_visuals[12] 4 I_GASTRIC_EJECTIONS
#non_visuals[14] 2 I_IRON_LUNGS
#non_visuals[17] 5 I_GUT_ROT
#objects[9].StartCost.StartAvail.WhenAvail.StartStrength.AvailableForLevel 2500 1 0 12 1 9 Inflator Machine
#objects[13].StartCost.StartAvail.WhenAvail.AvailableForLevel 1000 0 0 1 13 Cardiogram
#objects[14].StartCost.StartAvail.WhenAvail.StartStrength.AvailableForLevel 4000 0 3 12 1 14 Scanner
#objects[16].StartCost.StartAvail.WhenAvail.AvailableForLevel 500 1 0 1 16 Screen
#objects[18].StartCost.StartAvail.WhenAvail.AvailableForLevel 800 1 0 1 18 Couch
#objects[22].StartCost.StartAvail.WhenAvail.StartStrength.AvailableForLevel 3000 0 2 12 1 22 Ultrascan
#objects[23].StartCost.StartAvail.WhenAvail.AvailableForLevel 1800 1 0 1 23 DNA Fixer
#objects[24].StartCost.StartAvail.WhenAvail.AvailableForLevel 2000 1 0 1 24 Cast Remover
#objects[42].StartCost.StartAvail.WhenAvail.StartStrength.AvailableForLevel 3000 0 4 12 1 42 Blood Machine
#objects[46].StartCost.StartAvail.WhenAvail.StartStrength.AvailableForLevel 3500 1 0 10 1 46 Electrolysis Machine
#objects[47].StartCost.StartAvail.WhenAvail.StartStrength.AvailableForLevel 6500 1 0 7 1 47 Jellyitus Moulding Machine
#objects[27].StartCost.StartAvail.WhenAvail.AvailableForLevel 4000 0 0 1 27 X-Ray
#objects[54].StartCost.StartAvail.WhenAvail.StartStrength.AvailableForLevel 6500 1 0 10 1 54 Decontamination Shower
#objects[56].StartCost.StartAvail.WhenAvail.AvailableForLevel 700 1 0 1 56 Bookcase
#objects[61].StartCost.StartAvail.WhenAvail.AvailableForLevel 300 1 0 1 61 Comfortable Chair
#staff_levels[0].Month.Nurses.Doctors.Handymen.Receptionists.Seed.ShrkRate.SurgRate.RschRate.ConsRate.JrRate 0 8 7 3 5 4953 3 0 1 2 10
`));
        expect(scenario.title).toBe("Level One");
        expect(scenario.winCriteria).toContainEqual({
            kind: "win",
            index: 3,
            metricCode: 4,
            metric: "cures",
            comparison: "at-least",
            value: 10,
            group: 1,
            bound: 0
        });
        expect(scenario.loseCriteria).toContainEqual({
            kind: "lose",
            index: 0,
            metricCode: 5,
            metric: "deaths",
            comparison: "at-least",
            value: 50,
            group: 3,
            bound: 40
        });
        expect(scenario.populationSchedule).toEqual([
            { index: 0, month: 0, change: 3 },
            { index: 1, month: 2, change: 1 }
        ]);
        expect(scenario.admissionRules).toEqual({
            holdVisualMonths: 2,
            holdVisualPeepCount: 4
        });
        expect(scenario.researchSettings).toEqual({
            startRating: 95,
            researchPointsDivisor: 4,
            startCost: 100,
            minDrugCost: 50,
            drugImproveRate: 5,
            maxObjectStrength: 20,
            researchIncrement: 2,
            researchImproveCostPercent: 10,
            researchImproveIncrementPercent: 10
        });
        expect(scenario.trainingSettings).toEqual({
            trainingRate: 40,
            promotionDoctorMonths: 6,
            promotionConsultantMonths: 12,
            abilityThresholds: [
                { key: "abilityThreshold", index: 0, value: 75, name: "SURGEON" },
                { key: "abilityThreshold", index: 1, value: 60, name: "PSYCHO" },
                { key: "abilityThreshold", index: 2, value: 45, name: "RESEARCHER" }
            ],
            trainingValues: [
                { key: "trainingValue", index: 0, value: 10, name: "Projector" },
                { key: "trainingValue", index: 1, value: 15, name: "Skeleton" }
            ],
            doctorThreshold: 250,
            consultantThreshold: 750
        });
        expect(scenario.epidemicSettings).toEqual({
            howContagious: 25,
            contagiousSpreadFactor: 25,
            reduceContagiousMonths: 6,
            reduceContagiousPeepCount: 10,
            reduceContagiousRate: 0,
            fine: 2000,
            compensationLow: 1000,
            compensationHigh: 15000
        });
        expect(scenario.landSettings).toEqual({
            landCostPerTile: 25
        });
        expect(scenario.eventSettings).toEqual({
            scoreMaxIncrease: 300,
            vaccinationCost: 50,
            removeRatHoleChance: 3000,
            minimumAbductionYears: 4,
            abductionsPerYear: 2,
            autopsyResearchPercent: 33,
            autopsyReputationHitPercent: 20,
            mayorLaunch: 1,
            disasterLaunch: 200
        });
        expect(scenario.staffFatigueSettings).toEqual({
            restStanding: 3,
            restSofa: 8,
            restGame: 60,
            restSnooker: 30,
            workLight: 1,
            modifyFrequency: 16,
            notTired: 300,
            tired: 600,
            veryTired: 700,
            crackUpTired: 800,
            recoveryFactor: 450,
            recoveryMinimum: 3,
            resignMax: 150
        });
        expect(scenario.patientBehaviorSettings).toEqual({
            litterDrop: 25,
            leaveMax: 150,
            happy: 75,
            unhappy: 50,
            veryUnhappy: 25,
            drinkHappy: 5,
            toiletHappy: 10,
            bowelFull: 50,
            bowelOverflows: 75,
            vomitLimit: 50,
            litterRandom: 60
        });
        expect(scenario.salarySettings).toEqual({
            salaryAdds: [
                { key: "salaryAdd", index: 3, value: -30, name: "Junior" },
                { key: "salaryAdd", index: 4, value: 30, name: "Doctor" },
                { key: "salaryAdd", index: 7, value: 100, name: "Consultant" }
            ],
            salaryAbilityDivisor: 10,
            salaryTooLow: -10,
            salaryTooHigh: 20
        });
        expect(scenario.allocationSettings).toEqual({
            randomWeight: 4,
            totalReputationWeight: 1,
            illnessReputationWeight: 2,
            delayMonths: 3
        });
        expect(scenario.routingSettings).toEqual({
            queuePoints: 15,
            distancePoints: 1,
            noStaffPoints: 20
        });
        expect(scenario.awardCriteria).toEqual({
            curesAward: 10,
            reputationAward: 600,
            hospValuePoor: 40000,
            curesPenalty: -3000
        });
        expect(scenario.emergencySchedule).toEqual([
            {
                index: 0,
                startMonth: 4,
                endMonth: 5,
                minPatients: 2,
                maxPatients: 4,
                illnessCode: 16,
                percentToWin: 75,
                bonusCash: 400,
                diseaseId: "mild-cold",
                severity: 1
            }
        ]);
        const emergencyIllnessMappings = decodeThemeHospitalScenario(new TextEncoder().encode(`
Emergency Mappings
#emergency_control[0].StartMonth.EndMonth.Min.Max.Illness.PercWin.Bonus 0 1 1 1 2 75 100
#emergency_control[1].StartMonth.EndMonth.Min.Max.Illness.PercWin.Bonus 0 1 1 1 5 75 100
`));
        expect(emergencyIllnessMappings.emergencySchedule).toEqual([
            expect.objectContaining({ illnessCode: 2, diseaseId: "cranial-pressure", severity: 3 }),
            expect.objectContaining({ illnessCode: 5, diseaseId: "itchy-feet", severity: 1 })
        ]);
        expect(scenario.quakeSchedule).toEqual([
            { index: 0, startMonth: 6, endMonth: 8, severity: 4 }
        ]);
        expect(scenario.townSettings).toEqual([
            { index: 1, startCash: 40000, illnessRate: 2, interestRate: 100, name: "Level 1" }
        ]);
        expect(scenario.roomCosts).toEqual([
            { index: 7, cost: 2280, roomType: "diagnosis", name: "GP_OFFICE" },
            { index: 8, cost: 2270, roomType: "psychiatry", name: "PSYCH" },
            { index: 9, cost: 1700, roomType: "ward", name: "WARD" },
            { index: 11, cost: 500, roomType: "pharmacy", name: "PHARMACY" },
            { index: 12, cost: 470, roomType: "cardiogram", name: "CARDIO" },
            { index: 13, cost: 4000, roomType: "scanner", name: "SCANNER" },
            { index: 14, cost: 3000, roomType: "ultrascan", name: "ULTRASCAN" },
            { index: 15, cost: 3200, roomType: "blood-machine", name: "BLOOD_MACHINE" },
            { index: 16, cost: 4000, roomType: "x-ray", name: "X_RAY" },
            { index: 17, cost: 1500, roomType: "inflation-room", name: "INFLATOR" },
            { index: 19, cost: 500, roomType: "hair-restoration", name: "HAIR_RESTORE" },
            { index: 21, cost: 500, roomType: "fracture-clinic", name: "FRACTURE" },
            { index: 23, cost: 1800, roomType: "dna-fixer", name: "DNA_FIXER" },
            { index: 23, cost: 500, roomType: "electrolysis", name: "ELECTRO" },
            { index: 24, cost: 4500, roomType: "jelly-vat", name: "JELLY_VAT" },
            { index: 27, cost: 1500, roomType: "general-diagnosis", name: "GENERAL_DIAG" },
            { index: 30, cost: 5500, roomType: "decontamination", name: "DECON_SHOWER" }
        ]);
        expect(scenario.staffSalaries).toEqual([
            { index: 0, minimumSalary: 45, role: "nurse", name: "Nurse" },
            { index: 1, minimumSalary: 60, role: "diagnostician", name: "Doctor" },
            { index: 2, minimumSalary: 20, role: "handyman", name: "Handyman" },
            { index: 3, minimumSalary: 15, role: "receptionist", name: "Receptionist" }
        ]);
        expect(scenario.expertise).toEqual([
            {
                index: 16,
                startPrice: 300,
                contagiousRate: 4,
                known: false,
                researchRequired: 10000,
                maxDiagDifficulty: 100,
                token: "UNCOMMON_COLD",
                diseaseId: "mild-cold",
                severity: 1
            },
            {
                index: 38,
                contagiousRate: 0,
                known: false,
                researchRequired: 40000,
                token: "I_D_CARDIO",
                category: "DIAGNOSIS"
            }
        ]);
        expect(scenario.scenarioOpponents).toEqual([
            {
                index: 0,
                skill: 3,
                staffLevels: 4,
                luck: 3,
                speed: 30,
                comfort: 7,
                guessAt: 90,
                playing: true,
                name: "ORAC"
            }
        ]);
        expect(decodeThemeHospitalScenario(new TextEncoder().encode(`
Network Level
#net_criteria[0].Criteria.Value.Month.TimeToDo 3 1 2 4
#net_criteria[1].Criteria.Value.Month.TimeToDo 5 10000 21 4
#net_criteria[2].Criteria.Value.Month.TimeToDo 0 0 0 0
`)).networkCriteria).toEqual([
            { index: 0, metricCode: 3, metric: "reputation", value: 1, month: 2, timeToDo: 4 },
            { index: 1, metricCode: 5, metric: "balance", value: 10000, month: 21, timeToDo: 4 }
        ]);
        expect(scenario.diseasePool).toEqual([
            { source: "visuals", index: 0, weight: 5, token: "I_BLOATY_HEAD", diseaseId: "cranial-pressure", severity: 3 },
            { source: "visuals", index: 2, weight: 3, token: "I_ELVIS", diseaseId: "king-complex", severity: 2 },
            { source: "visuals", index: 5, weight: 3, token: "I_SLACK_TONGUE", diseaseId: "slack-tongue", severity: 2 },
            { source: "visuals", index: 8, weight: 4, token: "I_BALDNESS", diseaseId: "baldness", severity: 2 },
            { source: "visuals", index: 10, weight: 4, token: "I_JELLYITUS", diseaseId: "jellyitis", severity: 3 },
            { source: "visuals", index: 12, weight: 2, token: "I_PREGNANT", diseaseId: "pregnancy", severity: 2 },
            { source: "visuals_available", index: 13, availableMonth: 6, token: "I_TRANSPARENCY", diseaseId: "transparency", severity: 1 },
            { source: "non_visuals", index: 0, weight: 5, token: "I_UNCOMMON_COLD", diseaseId: "mild-cold", severity: 1 },
            { source: "non_visuals", index: 2, weight: 4, token: "I_SPARE_RIBS", diseaseId: "spare-ribs", severity: 2 },
            { source: "non_visuals", index: 3, weight: 4, token: "I_KIDNEY_BEANS", diseaseId: "kidney-beans", severity: 2 },
            { source: "non_visuals", index: 5, weight: 2, token: "I_RUPTURED_NODULES", diseaseId: "ruptured-nodules", severity: 3 },
            { source: "non_visuals", index: 7, weight: 3, token: "I_INFECTIOUS_LAUGHTER", diseaseId: "infectious-laughter", severity: 2 },
            { source: "non_visuals", index: 9, weight: 2, token: "I_CHRONIC_NOSEHAIR", diseaseId: "chronic-nosehair", severity: 2 },
            { source: "non_visuals", index: 11, weight: 2, token: "I_FAKE_BLOOD", diseaseId: "fake-blood", severity: 2 },
            { source: "non_visuals", index: 12, weight: 4, token: "I_GASTRIC_EJECTIONS", diseaseId: "gastric-ejections", severity: 2 },
            { source: "non_visuals", index: 14, weight: 2, token: "I_IRON_LUNGS", diseaseId: "iron-lungs", severity: 3 },
            { source: "non_visuals", index: 17, weight: 5, token: "I_GUT_ROT", diseaseId: "gut-rot", severity: 3 }
        ]);
        expect(scenario.staffLevels).toEqual([
            {
                index: 0,
                month: 0,
                nurses: 8,
                doctors: 7,
                handymen: 3,
                receptionists: 5,
                seed: 4953,
                shrinkRate: 3,
                surgeonRate: 0,
                researcherRate: 1,
                consultantRate: 2,
                juniorRate: 10
            }
        ]);
        expect(scenario.objectAvailability).toEqual([
            {
                index: 9,
                startCost: 2500,
                startAvailable: true,
                whenAvailable: 0,
                startStrength: 12,
                availableForLevel: true,
                roomType: "inflation-room",
                name: "Inflator Machine"
            },
            {
                index: 13,
                startCost: 1000,
                startAvailable: false,
                whenAvailable: 0,
                availableForLevel: true,
                roomType: "cardiogram",
                name: "Cardiogram"
            },
            {
                index: 14,
                startCost: 4000,
                startAvailable: false,
                whenAvailable: 3,
                startStrength: 12,
                availableForLevel: true,
                roomType: "scanner",
                name: "Scanner"
            },
            {
                index: 16,
                startCost: 500,
                startAvailable: true,
                whenAvailable: 0,
                availableForLevel: true,
                roomType: "psychiatry",
                name: "Screen"
            },
            {
                index: 18,
                startCost: 800,
                startAvailable: true,
                whenAvailable: 0,
                availableForLevel: true,
                roomType: "psychiatry",
                name: "Couch"
            },
            {
                index: 22,
                startCost: 3000,
                startAvailable: false,
                whenAvailable: 2,
                startStrength: 12,
                availableForLevel: true,
                roomType: "ultrascan",
                name: "Ultrascan"
            },
            {
                index: 23,
                startCost: 1800,
                startAvailable: true,
                whenAvailable: 0,
                availableForLevel: true,
                roomType: "dna-fixer",
                name: "DNA Fixer"
            },
            {
                index: 24,
                startCost: 2000,
                startAvailable: true,
                whenAvailable: 0,
                availableForLevel: true,
                roomType: "fracture-clinic",
                name: "Cast Remover"
            },
            {
                index: 42,
                startCost: 3000,
                startAvailable: false,
                whenAvailable: 4,
                startStrength: 12,
                availableForLevel: true,
                roomType: "blood-machine",
                name: "Blood Machine"
            },
            {
                index: 46,
                startCost: 3500,
                startAvailable: true,
                whenAvailable: 0,
                startStrength: 10,
                availableForLevel: true,
                roomType: "electrolysis",
                name: "Electrolysis Machine"
            },
            {
                index: 47,
                startCost: 6500,
                startAvailable: true,
                whenAvailable: 0,
                startStrength: 7,
                availableForLevel: true,
                roomType: "jelly-vat",
                name: "Jellyitus Moulding Machine"
            },
            {
                index: 27,
                startCost: 4000,
                startAvailable: false,
                whenAvailable: 0,
                availableForLevel: true,
                roomType: "x-ray",
                name: "X-Ray"
            },
            {
                index: 54,
                startCost: 6500,
                startAvailable: true,
                whenAvailable: 0,
                startStrength: 10,
                availableForLevel: true,
                roomType: "decontamination",
                name: "Decontamination Shower"
            },
            {
                index: 56,
                startCost: 700,
                startAvailable: true,
                whenAvailable: 0,
                availableForLevel: true,
                roomType: "psychiatry",
                name: "Bookcase"
            },
            {
                index: 61,
                startCost: 300,
                startAvailable: true,
                whenAvailable: 0,
                availableForLevel: true,
                roomType: "psychiatry",
                name: "Comfortable Chair"
            }
        ]);
    });
    it("attaches matching FULL scenario data to campaign map summaries", () => {
        const result = createAssetBundle([
            { path: "HOSPITAL.CFG", bytes: new TextEncoder().encode("LANGUAGE=ENG\n") },
            { path: "HOSPITAL.EXE", bytes: new TextEncoder().encode("MZ") },
            { path: "DATA/ANIMS.DAT", bytes: new Uint8Array([1]) },
            { path: "LEVELS/LEVEL.L1", bytes: syntheticMapBytes() },
            {
                path: "LEVELS/FULL00.SAM",
                bytes: new TextEncoder().encode("#towns[0].StartCash.IllRate.InterestRate 0 0 100 Level 0\n#towns[1].StartCash.IllRate.InterestRate 40000 2 100 Level 1\n#rooms[7].Cost 2280 GP_OFFICE\n#rooms[8].Cost 2270 PSYCH\n#rooms[9].Cost 1700 WARD\n#rooms[11].Cost 500 PHARMACY\n#rooms[12].Cost 470 CARDIO\n#rooms[17].Cost 1500 INFLATOR\n#rooms[19].Cost 500 HAIR_RESTORE\n#rooms[21].Cost 500 FRACTURE\n#rooms[23].Cost 1800 DNA_FIXER\n#staff[0].MinSalary 45 Nurse\n#staff[1].MinSalary 60 Doctor\n#staff[2].MinSalary 20 Handyman\n#staff[3].MinSalary 15 Receptionist\n#objects[9].StartCost.StartAvail.WhenAvail.StartStrength.AvailableForLevel 2500 0 0 8 0 9 Inflator Machine\n#objects[13].StartCost.StartAvail.WhenAvail.StartStrength.AvailableForLevel 1000 0 2 13 1 13 Cardiogram\n#objects[23].StartCost.StartAvail.WhenAvail.AvailableForLevel 1800 1 0 1 23 DNA Fixer\n#gbv.StartRating 100\n#gbv.MinDrugCost 50\n#gbv.MaxObjectStrength 20\n#gbv.ResearchIncrement 2\n#gbv.RschImproveCostPercent 10\n#gbv.RschImproveIncrementPercent 10\n#gbv.DrugImproveRate 5\n#gbv.TrainingRate 30\n#gbv.PromoDoc 6\n#gbv.PromoCon 12\n#gbv.AbilityThreshold[0] 75 SURGEON\n#gbv.AbilityThreshold[1] 60 PSYCHO\n#gbv.AbilityThreshold[2] 45 RESEARCHER\n#gbv.TrainingValue[0] 10 Projector\n#gbv.TrainingValue[1] 15 Skeleton\n#gbv.DoctorThreshold 250\n#gbv.ConsultantThreshold 750\n#gbv.HowContagious 25\n#gbv.ContagiousSpreadFactor 25\n#gbv.ReduceContMonths 6\n#gbv.ReduceContPeepCount 10\n#gbv.ReduceContRate 0\n#gbv.EpidemicFine 2000\n#gbv.EpidemicCompLo 1000\n#gbv.EpidemicCompHi 15000\n#gbv.ScoreMaxInc 300\n#gbv.VacCost 50\n#gbv.RemoveRatHoleChance 3000\n#gbv.MinimumAbductTime 4\n#gbv.AbductionsPerYear 2\n#gbv.AutopsyRschPercent 33\n#gbv.AutopsyRepHitPercent 20\n#gbv.MayorLaunch 1\n#gbv.DisasterLaunch 200\n#gbv.LandCostPerTile 25\n#gbv.QPoints 15\n#gbv.DistPoints 1\n#gbv.NoStaffPoints 20\n#gbv.RestStanding 3\n#gbv.RestSofa 8\n#gbv.RestGame 60\n#gbv.RestSnooker 30\n#gbv.WorkLight 1\n#gbv.ModifyFreq 16\n#gbv.CrackUpTired 800\n#gbv.RecoveryMinimum 3\n#gbv.LitterDrop 25\n#gbv.LeaveMax 150\n#gbv.ResignMax 150\n#gbv.Happy 75\n#gbv.Unhappy 50\n#gbv.VeryUnhappy 25\n#gbv.BowelFull 50\n#gbv.BowelOverflows 75\n#gbv.VomitLimit 50\n#gbv.LitterRandom 60\n#gbv.SalaryAdd[3] -30 Junior\n#gbv.SalaryAdd[4] 30 Doctor\n#gbv.SalaryAdd[7] 100 Consultant\n#gbv.SalaryAbilityDivisor 10\n#gbv.SalaryTooLow -10\n#gbv.SalaryTooHigh 20\n#gbv.AllocRand 4\n#gbv.AllocTotalRep 1\n#gbv.AllocIndRep 2\n#gbv.AllocDelay 3\n#awards_trophies.CuresAward 50\n#awards_trophies.DeathsPoor 25\n")
            },
            {
                path: "LEVELS/FULL01.SAM",
                bytes: new TextEncoder().encode("#gbv.HoldVisualPeepCount 2\n#gbv.ResearchPointsDivisor 4\n#gbv.StartCost 100\n#gbv.AbilityThreshold[0] 80 SURGEON\n#gbv.SalaryAdd[7] 110 Consultant\n#gbv.SalaryTooHigh 25\n#gbv.AllocRand 5\n#awards_trophies.CuresAward 10\n#awards_trophies.ReputationAward 600\n#emergency_control[0].StartMonth.EndMonth.Min.Max.Illness.PercWin.Bonus 4 5 2 4 16 75 400\n#expertise[16].Known.RschReqd.MaxDiagDiff 0 10000 100 UNCOMMON_COLD\n#computer[0].Skill.StaffLevels.Luck.Speed.Comfort.GuessAt.Playing 3 4 3 30 7 90 1 ORAC\n#win_criteria[0].Criteria.MaxMin.Value.Group.Bound 4 1 10 1 0\n#popn[0].Month.Change 0 3\n#visuals[0] 5 I_BLOATY_HEAD\n#objects[9].StartCost.StartAvail.WhenAvail.StartStrength.AvailableForLevel 2500 1 0 12 1 9 Inflator Machine\n#staff_levels[0].Month.Nurses.Doctors.Handymen.Receptionists.Seed.ShrkRate.SurgRate.RschRate.ConsRate.JrRate 0 8 7 3 5 4953 3 0 1 2 10\n")
            },
            { path: "QDATA/TEXT.DAT", bytes: new Uint8Array([2]) }
        ]);
        expect(result.status).toBe("ready");
        expect(result.manifest?.mapSummaries[0]?.scenario).toMatchObject({
            path: "LEVELS/FULL01.SAM",
            difficulty: "full",
            levelNumber: 1,
            winCriteria: [
                {
                    metric: "cures",
                    value: 10
                }
            ],
            populationSchedule: [{ index: 0, month: 0, change: 3 }],
            diseasePool: [{ source: "visuals", index: 0, weight: 5, token: "I_BLOATY_HEAD", diseaseId: "cranial-pressure", severity: 3 }],
            staffLevels: [{ month: 0, nurses: 8, doctors: 7, handymen: 3, receptionists: 5 }],
            financialSettings: { index: 1, startCash: 40000, illnessRate: 2, interestRate: 100, name: "Level 1" },
            roomCostOverrides: { diagnosis: 2280, cardiogram: 1470, psychiatry: 2270, ward: 1700, pharmacy: 500, "inflation-room": 4000, "hair-restoration": 500, "fracture-clinic": 500, "dna-fixer": 3600 },
            staffWageOverrides: { nurse: 5, diagnostician: 6, handyman: 2, receptionist: 2 },
            objectAvailability: [
                { index: 9, startCost: 2500, startAvailable: true, roomType: "inflation-room" },
                { index: 13, startCost: 1000, startAvailable: false, whenAvailable: 2, roomType: "cardiogram" },
                { index: 23, startCost: 1800, startAvailable: true, roomType: "dna-fixer" }
            ],
            admissionRules: { holdVisualPeepCount: 2 },
            researchSettings: { startRating: 100, researchPointsDivisor: 4, startCost: 100, minDrugCost: 50, drugImproveRate: 5, maxObjectStrength: 20, researchIncrement: 2, researchImproveCostPercent: 10, researchImproveIncrementPercent: 10 },
            trainingSettings: {
                trainingRate: 30,
                promotionDoctorMonths: 6,
                promotionConsultantMonths: 12,
                abilityThresholds: [
                    { index: 0, value: 80, name: "SURGEON" },
                    { index: 1, value: 60, name: "PSYCHO" },
                    { index: 2, value: 45, name: "RESEARCHER" }
                ],
                trainingValues: [
                    { index: 0, value: 10, name: "Projector" },
                    { index: 1, value: 15, name: "Skeleton" }
                ],
                doctorThreshold: 250,
                consultantThreshold: 750
            },
            epidemicSettings: {
                howContagious: 25,
                contagiousSpreadFactor: 25,
                reduceContagiousMonths: 6,
                reduceContagiousPeepCount: 10,
                reduceContagiousRate: 0,
                fine: 2000,
                compensationLow: 1000,
                compensationHigh: 15000
            },
            landSettings: { landCostPerTile: 25 },
            eventSettings: {
                scoreMaxIncrease: 300,
                vaccinationCost: 50,
                removeRatHoleChance: 3000,
                minimumAbductionYears: 4,
                abductionsPerYear: 2,
                autopsyResearchPercent: 33,
                autopsyReputationHitPercent: 20,
                mayorLaunch: 1,
                disasterLaunch: 200
            },
            staffFatigueSettings: { restStanding: 3, restSofa: 8, restGame: 60, restSnooker: 30, workLight: 1, modifyFrequency: 16, crackUpTired: 800, recoveryMinimum: 3, resignMax: 150 },
            patientBehaviorSettings: { litterDrop: 25, leaveMax: 150, happy: 75, unhappy: 50, veryUnhappy: 25, bowelFull: 50, bowelOverflows: 75, vomitLimit: 50, litterRandom: 60 },
            salarySettings: {
                salaryAdds: [
                    { index: 3, value: -30, name: "Junior" },
                    { index: 4, value: 30, name: "Doctor" },
                    { index: 7, value: 110, name: "Consultant" }
                ],
                salaryAbilityDivisor: 10,
                salaryTooLow: -10,
                salaryTooHigh: 25
            },
            allocationSettings: {
                randomWeight: 5,
                totalReputationWeight: 1,
                illnessReputationWeight: 2,
                delayMonths: 3
            },
            routingSettings: { queuePoints: 15, distancePoints: 1, noStaffPoints: 20 },
            awardCriteria: { curesAward: 10, reputationAward: 600, deathsPoor: 25 },
            emergencySchedule: [{ startMonth: 4, endMonth: 5, minPatients: 2, diseaseId: "mild-cold" }],
            expertise: [{ index: 16, token: "UNCOMMON_COLD", diseaseId: "mild-cold", known: false }],
            scenarioOpponents: [{ index: 0, name: "ORAC", playing: true }]
        });
    });
    const localLevelUrl = new URL("../../../../GameData/Contents/Resources/game/LEVELS/LEVEL.L1", import.meta.url);
    const itWithLocalGameData = existsSync(localLevelUrl) ? it : it.skip;
    itWithLocalGameData("decompresses and decodes the local Theme Hospital campaign level", () => {
        const bytes = readFileSync(localLevelUrl);
        expect(isRncCompressed(bytes)).toBe(true);
        expect(getRncOutputSize(bytes)).toBe(THEME_HOSPITAL_MAP_FILE_SIZE);
        const decoded = decodeThemeHospitalMap(bytes);
        expect(decoded.width).toBe(128);
        expect(decoded.height).toBe(128);
        expect(decoded.stats.hospitalTileCount).toBeGreaterThan(0);
        expect(decoded.parcelCount).toBeGreaterThan(0);
    });
    it("rejects truncated map data before reading tile records", () => {
        expect(() => decodeThemeHospitalMap(new Uint8Array(32))).toThrow(/too short/);
    });
});
