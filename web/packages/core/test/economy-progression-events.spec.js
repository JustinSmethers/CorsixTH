import { patientMaxHealthForSeverity } from "@corsixth/rules";
import { DeterministicSimulation } from "../src/simulation";
describe("phase 7 slice 3 economy/progression/events", () => {
    it("tracks deterministic per-tick and cumulative cashflow", () => {
        const simulation = new DeterministicSimulation(7301, { bounds: { width: 8, height: 8 } });
        simulation.execute({ type: "tick", count: 1 });
        const baselineTick = simulation.getState();
        expect(baselineTick.economy).toMatchObject({
            tickIncome: 0,
            tickExpenses: 14,
            tickNet: -14,
            cumulativeIncome: 0,
            cumulativeExpenses: 14,
            cumulativeNet: -14
        });
        expect(baselineTick.events.totalEmitted).toBe(1);
        expect(baselineTick.events.recent[0]?.type).toBe("cashflow-negative");
        simulation.execute({ type: "admit-patient", severity: 1, position: { x: 2, y: 2 } });
        simulation.execute({ type: "tick", count: 5 });
        const positiveTick = simulation.getState();
        expect(positiveTick.hospitalLoop.dischargedPatients).toBe(1);
        expect(positiveTick.economy.tickIncome).toBe(142);
        expect(positiveTick.economy.tickExpenses).toBe(14);
        expect(positiveTick.economy.tickNet).toBe(128);
        expect(positiveTick.economy.cumulativeIncome).toBeGreaterThan(0);
        expect(positiveTick.events.recent.map((event) => event.type)).toContain("cashflow-positive");
    });
    it("unlocks deterministic milestones and recurring progression income bonuses", () => {
        const simulation = new DeterministicSimulation(7302, { bounds: { width: 8, height: 8 } });
        for (let i = 0; i < 5; i += 1) {
            simulation.execute({ type: "admit-patient", severity: 1, position: { x: 2, y: 2 } });
            simulation.execute({ type: "tick", count: 5 });
        }
        const state = simulation.getState();
        expect(state.hospitalLoop.dischargedPatients).toBe(5);
        expect(state.progression).toEqual({
            milestoneLevel: 3,
            unlockedMilestones: ["milestone.first-discharge", "milestone.patient-flow", "milestone.community-trust"],
            unlockedUnlocks: ["unlock.finance-ledger", "unlock.insurance-contracts", "unlock.vip-clinic"],
            recurringIncomeBonus: 12,
            nextMilestone: null,
            remainingDischargesToNextMilestone: 0
        });
        const milestoneEvents = state.events.recent.filter((event) => event.type === "milestone-unlocked");
        expect(milestoneEvents).toHaveLength(3);
        expect(milestoneEvents.map((event) => event.payload)).toEqual([
            "milestone.first-discharge|unlock.finance-ledger",
            "milestone.patient-flow|unlock.insurance-contracts",
            "milestone.community-trust|unlock.vip-clinic"
        ]);
    });
    it("charges deterministic capital costs for explicit hiring and room builds", () => {
        const simulation = new DeterministicSimulation(7305, {
            bounds: { width: 12, height: 12 },
            initialCash: 1_500
        });
        const baseline = simulation.getState();
        expect(baseline.cash).toBe(1_500);
        expect(baseline.economy.cumulativeExpenses).toBe(0);
        simulation.execute({ type: "hire-staff", role: "nurse", position: { x: 6, y: 8 } });
        simulation.execute({ type: "open-room", roomType: "diagnosis", position: { x: 1, y: 7 } });
        const purchased = simulation.getState();
        expect(purchased.entities.staff).toHaveLength(baseline.entities.staff.length + 1);
        expect(purchased.entities.rooms).toHaveLength(baseline.entities.rooms.length + 1);
        expect(purchased.cash).toBe(450);
        expect(purchased.economy.tickExpenses).toBe(0);
        expect(purchased.economy.cumulativeExpenses).toBe(1_050);
        simulation.execute({ type: "open-room", roomType: "treatment", position: { x: 9, y: 7 } });
        const blocked = simulation.getState();
        expect(blocked.entities.rooms).toHaveLength(purchased.entities.rooms.length);
        expect(blocked.cash).toBe(450);
        expect(blocked.economy.cumulativeExpenses).toBe(1_050);
    });
    it("uses imported scenario room cost overrides for placement, purchase, and refunds", () => {
        const simulation = new DeterministicSimulation(73051, {
            bounds: { width: 12, height: 12 },
            initialCash: 3_000,
            roomCostOverrides: { diagnosis: 2_280, pharmacy: 500 }
        });
        expect(simulation.evaluateRoomPlacement("diagnosis", { x: 1, y: 7 }, { charge: true })).toMatchObject({
            valid: true,
            cost: 2_280
        });
        expect(simulation.evaluateRoomPlacement("pharmacy", { x: 9, y: 7 }, { charge: true })).toMatchObject({
            valid: true,
            cost: 500
        });
        simulation.execute({ type: "open-room", roomType: "diagnosis", position: { x: 1, y: 7 } });
        const room = simulation.getState().entities.rooms.find((candidate) => candidate.roomType === "diagnosis" && candidate.position.x === 1 && candidate.position.y === 7);
        expect(room).toBeTruthy();
        expect(simulation.getState().cash).toBe(720);
        simulation.execute({ type: "remove-room", roomId: room.id });
        expect(simulation.getState().cash).toBe(1_860);
    });
    it("uses imported land cost per tile in room placement and purchase costs", () => {
        const simulation = new DeterministicSimulation(73053, {
            bounds: { width: 12, height: 12 },
            initialCash: 3_000,
            landCostPerTile: 25
        });
        expect(simulation.evaluateRoomPlacement("diagnosis", { x: 1, y: 7 }, { charge: true })).toMatchObject({
            valid: true,
            cost: 1_025
        });
        simulation.execute({ type: "open-room", roomType: "diagnosis", position: { x: 1, y: 7 } });
        expect(simulation.getState().cash).toBe(1_975);
    });
    it("uses imported scenario staff wage overrides for recurring expenses", () => {
        const simulation = new DeterministicSimulation(73052, {
            bounds: { width: 8, height: 8 },
            staffWageOverrides: { diagnostician: 6, nurse: 5, handyman: 2, receptionist: 2 }
        });
        simulation.execute({ type: "hire-staff", role: "handyman", position: { x: 6, y: 4 } });
        simulation.execute({ type: "hire-staff", role: "receptionist", position: { x: 2, y: 4 } });
        simulation.execute({ type: "tick", count: 1 });
        expect(simulation.getState().economy).toMatchObject({
            tickExpenses: 20,
            cumulativeExpenses: 370
        });
    });
    it("uses imported scenario salary settings for skilled staff wages", () => {
        const baseline = new DeterministicSimulation(73054, { bounds: { width: 8, height: 8 } });
        const salaried = new DeterministicSimulation(73054, {
            bounds: { width: 8, height: 8 },
            staffSalary: {
                salaryAbilityDivisor: 10,
                salaryAdds: [
                    { index: 3, value: -30 },
                    { index: 7, value: 100 }
                ]
            }
        });
        baseline.execute({ type: "hire-staff", role: "nurse", initialSkillLevel: 3, position: { x: 6, y: 4 } });
        salaried.execute({ type: "hire-staff", role: "nurse", initialSkillLevel: 3, position: { x: 6, y: 4 } });
        expect(salaried.getState().entities.staff.find((staff) => staff.role === "nurse" && staff.position.x === 6)).toMatchObject({
            skillLevel: 3,
            wageCostPerTick: 17
        });
        baseline.execute({ type: "tick", count: 1 });
        salaried.execute({ type: "tick", count: 1 });
        expect(salaried.getState().economy.tickExpenses - baseline.getState().economy.tickExpenses).toBe(13);
    });
    it("supports deterministic loans, repayment, and interest expenses", () => {
        const simulation = new DeterministicSimulation(7306, {
            bounds: { width: 8, height: 8 },
            initialCash: 1_000
        });
        simulation.execute({ type: "take-loan" });
        expect(simulation.getState()).toMatchObject({
            cash: 6_000,
            economy: {
                outstandingLoan: 5_000,
                loanInterestExpense: 2,
                cumulativeLoanInterest: 0,
                loanChunkAmount: 5_000,
                loanMaxOutstanding: 20_000
            }
        });
        simulation.execute({ type: "tick", count: 1 });
        expect(simulation.getState()).toMatchObject({
            cash: 5_984,
            economy: {
                tickExpenses: 16,
                outstandingLoan: 5_000,
                loanInterestExpense: 2,
                cumulativeLoanInterest: 2
            }
        });
        simulation.execute({ type: "repay-loan" });
        expect(simulation.getState()).toMatchObject({
            cash: 984,
            economy: {
                outstandingLoan: 0,
                loanInterestExpense: 0,
                cumulativeLoanInterest: 2
            }
        });
        simulation.execute({ type: "repay-loan" });
        expect(simulation.getState().cash).toBe(984);
    });
    it("uses imported scenario loan interest overrides for recurring interest", () => {
        const simulation = new DeterministicSimulation(73061, {
            bounds: { width: 8, height: 8 },
            initialCash: 1_000,
            loanInterestPerChunk: 1
        });
        simulation.execute({ type: "take-loan" });
        expect(simulation.getState().economy).toMatchObject({
            outstandingLoan: 5_000,
            loanInterestExpense: 1
        });
        simulation.execute({ type: "tick", count: 1 });
        expect(simulation.getState().economy).toMatchObject({
            tickExpenses: 15,
            cumulativeLoanInterest: 1
        });
    });
    it("runs progression-gated finance audits with deterministic cooldown", () => {
        const simulation = new DeterministicSimulation(7318, { bounds: { width: 8, height: 8 } });
        expect(simulation.getState().financeLedger).toMatchObject({
            unlocked: false,
            ready: false,
            cooldownRemainingTicks: 0,
            auditsRun: 0,
            totalRecoveredCash: 0,
            cashRecovery: 350,
            cooldownTicks: 10
        });
        simulation.execute({ type: "run-finance-audit" });
        expect(simulation.getState()).toMatchObject({
            cash: 50_000,
            financeLedger: {
                unlocked: false,
                auditsRun: 0
            }
        });
        simulation.execute({ type: "admit-patient", severity: 1, position: { x: 2, y: 2 } });
        simulation.execute({ type: "treat-patient" });
        expect(simulation.getState().financeLedger).toMatchObject({
            unlocked: true,
            ready: true
        });
        simulation.execute({ type: "run-finance-audit" });
        expect(simulation.getState()).toMatchObject({
            cash: 50_490,
            financeLedger: {
                ready: false,
                cooldownRemainingTicks: 10,
                auditsRun: 1,
                totalRecoveredCash: 350
            }
        });
        expect(simulation.getState().events.recent.at(-1)?.type).toBe("finance-audit-run");
        simulation.execute({ type: "run-finance-audit" });
        expect(simulation.getState()).toMatchObject({
            cash: 50_490,
            financeLedger: {
                auditsRun: 1,
                totalRecoveredCash: 350
            }
        });
        simulation.execute({ type: "tick", count: 10 });
        expect(simulation.getState().financeLedger).toMatchObject({
            ready: true,
            cooldownRemainingTicks: 0
        });
    });
    it("runs deterministic marketing campaigns for reputation recovery", () => {
        const simulation = new DeterministicSimulation(7307, {
            bounds: { width: 8, height: 8 },
            initialCash: 1_000,
            initialReputation: 100
        });
        expect(simulation.getState().economy).toMatchObject({
            marketingCampaignCost: 600,
            marketingCampaignReputationGain: 35
        });
        simulation.execute({ type: "run-marketing-campaign" });
        expect(simulation.getState()).toMatchObject({
            cash: 400,
            reputation: 135,
            economy: {
                cumulativeExpenses: 600
            }
        });
        expect(simulation.getState().events.recent.map((event) => event.type)).toContain("marketing-campaign-run");
        simulation.execute({ type: "run-marketing-campaign" });
        expect(simulation.getState()).toMatchObject({
            cash: 400,
            reputation: 135
        });
        const capped = new DeterministicSimulation(7308, {
            bounds: { width: 8, height: 8 },
            initialReputation: 990
        });
        capped.execute({ type: "run-marketing-campaign" });
        expect(capped.getState()).toMatchObject({
            cash: 49_400,
            reputation: 1000
        });
        capped.execute({ type: "run-marketing-campaign" });
        expect(capped.getState()).toMatchObject({
            cash: 49_400,
            reputation: 1000
        });
    });
    it("runs progression-gated insurance contracts with completion rewards", () => {
        const simulation = new DeterministicSimulation(7316, { bounds: { width: 8, height: 8 } });
        expect(simulation.getState().insurance).toMatchObject({
            unlocked: false,
            active: false,
            contractsStarted: 0,
            completedContracts: 0,
            failedContracts: 0,
            patientCount: 2,
            severity: 2,
            durationTicks: 16,
            rewardCash: 650,
            rewardReputation: 15,
            penaltyCash: 250,
            penaltyReputation: 12
        });
        simulation.execute({ type: "start-insurance-contract" });
        expect(simulation.getState()).toMatchObject({
            patientsWaiting: 0,
            insurance: {
                active: false,
                contractsStarted: 0
            }
        });
        for (let index = 0; index < 3; index += 1) {
            simulation.execute({ type: "admit-patient", severity: 1, position: { x: 2, y: 2 } });
            simulation.execute({ type: "treat-patient" });
        }
        expect(simulation.getState().insurance.unlocked).toBe(true);
        simulation.execute({ type: "start-insurance-contract" });
        expect(simulation.getState()).toMatchObject({
            patientsWaiting: 2,
            insurance: {
                active: true,
                contractId: 1,
                remainingTicks: 16,
                totalPatients: 2,
                remainingPatients: 2,
                completedPatients: 0,
                contractsStarted: 1
            }
        });
        expect(simulation.getState().entities.waitingPatients.every((patient) => patient.insuranceContractId === 1)).toBe(true);
        simulation.execute({ type: "treat-patient" });
        simulation.execute({ type: "treat-patient" });
        expect(simulation.getState()).toMatchObject({
            patientsWaiting: 0,
            cash: 51_430,
            reputation: 529,
            insurance: {
                active: false,
                contractsStarted: 1,
                completedContracts: 1,
                failedContracts: 0,
                totalCashReward: 650,
                totalReputationReward: 15
            }
        });
        expect(simulation.getState().events.recent.map((event) => event.type)).toContain("insurance-contract-completed");
    });
    it("fails active insurance contracts at the deadline when patients remain untreated", () => {
        const simulation = new DeterministicSimulation(7317, { bounds: { width: 8, height: 8 } });
        for (let index = 0; index < 3; index += 1) {
            simulation.execute({ type: "admit-patient", severity: 1, position: { x: 2, y: 2 } });
            simulation.execute({ type: "treat-patient" });
        }
        const diagnosisRoom = simulation.getState().entities.rooms.find((room) => room.roomType === "diagnosis");
        simulation.execute({ type: "set-room-status", roomId: diagnosisRoom.id, status: "closed" });
        simulation.execute({ type: "start-insurance-contract" });
        simulation.execute({ type: "tick", count: 16 });
        expect(simulation.getState()).toMatchObject({
            insurance: {
                active: false,
                contractsStarted: 1,
                completedContracts: 0,
                failedContracts: 1
            }
        });
        expect(simulation.getState().entities.waitingPatients).toHaveLength(2);
        expect(simulation.getState().entities.waitingPatients.every((patient) => patient.insuranceContractId === undefined)).toBe(true);
        expect(simulation.getState().events.recent.at(-1)?.type).toBe("insurance-contract-failed");
    });
    it("runs deterministic hospital award ceremonies from current rating", () => {
        const baseline = new DeterministicSimulation(7314, { bounds: { width: 8, height: 8 } });
        expect(baseline.getState().awards).toMatchObject({
            currentScore: 33,
            currentTier: "none",
            currentRewardCash: 0,
            currentRewardReputation: 0,
            ceremoniesRun: 0
        });
        baseline.execute({ type: "run-awards-ceremony" });
        expect(baseline.getState()).toMatchObject({
            cash: 50_000,
            reputation: 500,
            awards: {
                ceremoniesRun: 1,
                lastTier: "none",
                lastScore: 33,
                totalCashReward: 0,
                totalReputationReward: 0
            }
        });
        expect(baseline.getState().events.recent.at(-1)?.type).toBe("hospital-award-withheld");
        const successful = new DeterministicSimulation(7315, { bounds: { width: 8, height: 8 } });
        for (let index = 0; index < 3; index += 1) {
            successful.execute({ type: "admit-patient", severity: 1, position: { x: 2, y: 2 } });
            successful.execute({ type: "treat-patient" });
        }
        expect(successful.getState().awards).toMatchObject({
            currentScore: 87,
            currentTier: "gold",
            currentRewardCash: 1000,
            currentRewardReputation: 30
        });
        successful.execute({ type: "run-awards-ceremony" });
        expect(successful.getState()).toMatchObject({
            cash: 51_420,
            reputation: 536,
            awards: {
                ceremoniesRun: 1,
                lastTier: "gold",
                lastScore: 87,
                totalCashReward: 1000,
                totalReputationReward: 30
            }
        });
        expect(successful.getState().events.recent.at(-1)?.type).toBe("hospital-award-granted");
    });
    it("uses imported scenario score max increase to cap award rating jumps", () => {
        const simulation = new DeterministicSimulation(73151, {
            bounds: { width: 8, height: 8 },
            awardScoreMaxIncrease: 10
        });
        simulation.execute({ type: "run-awards-ceremony" });
        expect(simulation.getState().awards.lastScore).toBe(33);
        for (let index = 0; index < 3; index += 1) {
            simulation.execute({ type: "admit-patient", severity: 1, position: { x: 2, y: 2 } });
            simulation.execute({ type: "treat-patient" });
        }
        expect(simulation.getState().awards).toMatchObject({
            currentScore: 43,
            uncappedScore: 87,
            scoreMaxIncrease: 10,
            currentTier: "bronze",
            currentRewardCash: 250,
            currentRewardReputation: 5
        });
        simulation.execute({ type: "run-awards-ceremony" });
        expect(simulation.getState()).toMatchObject({
            cash: 50_670,
            reputation: 511,
            awards: {
                lastTier: "bronze",
                lastScore: 43,
                totalCashReward: 250,
                totalReputationReward: 5
            }
        });
    });
    it("funds treatment research that improves deterministic treatment outcomes", () => {
        const simulation = new DeterministicSimulation(7309, { bounds: { width: 8, height: 8 } });
        simulation.execute({ type: "start-research" });
        expect(simulation.getState()).toMatchObject({
            cash: 48_500,
            research: {
                level: 0,
                active: true,
                remainingTicks: 6,
                projectCost: 1_500,
                projectTicks: 6,
                successBonus: 0
            }
        });
        simulation.execute({ type: "tick", count: 6 });
        expect(simulation.getState()).toMatchObject({
            research: {
                level: 1,
                active: false,
                remainingTicks: 0,
                successBonus: 20
            }
        });
        expect(simulation.getState().events.recent.map((event) => event.type)).toContain("research-completed");
        simulation.execute({ type: "open-room", roomType: "specialist", position: { x: 1, y: 4 } });
        simulation.execute({ type: "hire-staff", role: "diagnostician", initialSpecialties: ["surgeon"], position: { x: 6, y: 4 } });
        simulation.execute({ type: "admit-patient", severity: 3, diseaseId: "acute-sneezes", position: { x: 2, y: 2 } });
        simulation.execute({ type: "admit-patient", severity: 3, diseaseId: "acute-sneezes", position: { x: 2, y: 2 } });
        simulation.execute({ type: "tick", count: 64 });
        expect(simulation.getState().hospitalLoop).toMatchObject({
            dischargedPatients: 2,
            treatmentFailures: 0
        });
        expect(simulation.getState().entities.waitingPatients).toHaveLength(0);
    });
    it("uses researcher-qualified doctors to accelerate treatment research", () => {
        const simulation = new DeterministicSimulation(73092, { bounds: { width: 8, height: 8 } });
        simulation.execute({ type: "hire-staff", role: "diagnostician", initialSpecialties: ["researcher"], position: { x: 6, y: 4 } });
        const researcher = simulation.getState().entities.staff.find((staff) => staff.specialties?.includes("researcher"));
        expect(researcher).toMatchObject({
            role: "diagnostician",
            status: "active",
            specialties: ["researcher"]
        });
        simulation.execute({ type: "start-research" });
        expect(simulation.getState().research).toMatchObject({
            active: true,
            remainingTicks: 6,
            activeResearchers: 1,
            ticksPerTick: 2
        });
        simulation.execute({ type: "tick", count: 3 });
        expect(simulation.getState().research).toMatchObject({
            level: 1,
            active: false,
            remainingTicks: 0
        });
    });
    it("uses imported scenario research start cost for project funding", () => {
        const simulation = new DeterministicSimulation(73091, {
            bounds: { width: 8, height: 8 },
            initialCash: 500,
            researchProjectCost: 100
        });
        expect(simulation.getState().research.projectCost).toBe(100);
        simulation.execute({ type: "start-research" });
        expect(simulation.getState()).toMatchObject({
            cash: 400,
            research: {
                active: true,
                projectCost: 100
            },
            economy: {
                cumulativeExpenses: 100
            }
        });
    });
    it("uses imported scenario minimum drug cost as a research project floor", () => {
        const simulation = new DeterministicSimulation(73092, {
            bounds: { width: 8, height: 8 },
            initialCash: 500,
            researchProjectCost: 40,
            researchProjectMinCost: 75
        });
        expect(simulation.getState().research.projectCost).toBe(75);
        simulation.execute({ type: "start-research" });
        expect(simulation.getState()).toMatchObject({
            cash: 425,
            research: {
                active: true,
                projectCost: 75
            },
            economy: {
                cumulativeExpenses: 75
            }
        });
    });
    it("supports scenario-scaled treatment research duration", () => {
        const simulation = new DeterministicSimulation(7310, { bounds: { width: 8, height: 8 }, researchProjectTicks: 12 });
        simulation.execute({ type: "start-research" });
        expect(simulation.getState().research).toMatchObject({
            active: true,
            remainingTicks: 12,
            projectTicks: 12
        });
        simulation.execute({ type: "tick", count: 11 });
        expect(simulation.getState().research).toMatchObject({
            active: true,
            remainingTicks: 1,
            level: 0
        });
        simulation.execute({ type: "tick", count: 1 });
        expect(simulation.getState().research).toMatchObject({
            active: false,
            remainingTicks: 0,
            level: 1
        });
    });
    it("uses imported scenario research increment for project completion", () => {
        const simulation = new DeterministicSimulation(73104, {
            bounds: { width: 8, height: 8 },
            researchProjectTicks: 1,
            researchLevelIncrement: 2
        });
        simulation.execute({ type: "start-research" });
        simulation.execute({ type: "tick", count: 1 });
        expect(simulation.getState().research).toMatchObject({
            active: false,
            level: 2
        });
        simulation.execute({ type: "start-research" });
        simulation.execute({ type: "tick", count: 1 });
        expect(simulation.getState().research).toMatchObject({
            level: 3,
            maxLevel: 3
        });
    });
    it("uses imported autopsy settings to advance active research after patient death", () => {
        const simulation = new DeterministicSimulation(73102, {
            bounds: { width: 8, height: 8 },
            researchProjectTicks: 100,
            autopsy: { researchPercent: 25, reputationHitPercent: 10 }
        });
        simulation.execute({ type: "set-staff-status", staffId: 1, status: "on-break" });
        simulation.execute({ type: "admit-patient", severity: 3, position: { x: 2, y: 2 } });
        simulation.execute({ type: "start-research" });
        simulation.execute({ type: "tick", count: patientMaxHealthForSeverity(3) });
        const state = simulation.getState();
        expect(state.hospitalLoop.patientDeaths).toBe(1);
        expect(state.research).toMatchObject({
            active: true,
            projectTicks: 100,
            autopsyResearchPercent: 25,
            autopsyReputationHitPercent: 10,
            autopsyResearchTicks: 25
        });
        expect(state.research.remainingTicks).toBe(100 - patientMaxHealthForSeverity(3) - 25);
        expect(state.research.autopsyReputationPenalty).toBeGreaterThan(0);
    });
    it("uses imported scenario drug rating as baseline treatment research strength", () => {
        const simulation = new DeterministicSimulation(73101, {
            bounds: { width: 8, height: 8 },
            researchStartRating: 95,
            researchImproveRate: 5
        });
        expect(simulation.getState().research.successBonus).toBe(25);
        simulation.execute({ type: "start-research" });
        simulation.execute({ type: "tick", count: 6 });
        expect(simulation.getState().research).toMatchObject({
            level: 1,
            successBonus: 30
        });
        simulation.execute({ type: "start-research" });
        simulation.execute({ type: "tick", count: 6 });
        expect(simulation.getState().research).toMatchObject({
            level: 2,
            successBonus: 35
        });
    });
    it("uses imported scenario research cost increases for later projects", () => {
        const simulation = new DeterministicSimulation(73103, {
            bounds: { width: 8, height: 8 },
            initialCash: 1_000,
            researchProjectCost: 100,
            researchImproveCostPercent: 25
        });
        expect(simulation.getState().research.projectCost).toBe(100);
        simulation.execute({ type: "start-research" });
        expect(simulation.getState().cash).toBe(900);
        simulation.execute({ type: "tick", count: 6 });
        expect(simulation.getState().research).toMatchObject({
            level: 1,
            projectCost: 125
        });
        const cashBeforeSecondProject = simulation.getState().cash;
        simulation.execute({ type: "start-research" });
        expect(simulation.getState().cash).toBe(cashBeforeSecondProject - 125);
    });
    it("runs deterministic emergency waves with completion rewards", () => {
        const simulation = new DeterministicSimulation(7310, { bounds: { width: 8, height: 8 } });
        simulation.execute({ type: "start-emergency-wave" });
        expect(simulation.getState()).toMatchObject({
            patientsWaiting: 4,
            emergency: {
                active: true,
                waveId: 1,
                remainingTicks: 24,
                totalPatients: 4,
                remainingPatients: 4,
                treatedPatients: 0,
                wavesStarted: 1,
                successfulWaves: 0,
                failedWaves: 0,
                patientCount: 4,
                severity: 3,
                durationTicks: 24,
                rewardCash: 900,
                rewardReputation: 45,
                percentToWin: 100,
                requiredTreatedPatients: 4
            }
        });
        expect(simulation.getState().entities.waitingPatients.every((patient) => patient.emergencyWaveId === 1)).toBe(true);
        for (let index = 0; index < 4; index += 1) {
            simulation.execute({ type: "treat-patient" });
        }
        expect(simulation.getState()).toMatchObject({
            patientsWaiting: 0,
            cash: 51_780,
            reputation: 569,
            emergency: {
                active: false,
                wavesStarted: 1,
                successfulWaves: 1,
                failedWaves: 0
            }
        });
        expect(simulation.getState().events.recent.map((event) => event.type)).toContain("emergency-succeeded");
    });
    it("supports scenario emergency wave config without changing default commands", () => {
        const simulation = new DeterministicSimulation(7312, {
            bounds: { width: 8, height: 8 },
            emergencyWave: {
                patientCount: 2,
                severity: 1,
                diseaseId: "mild-cold",
                durationTicks: 12,
                rewardCash: 400,
                rewardReputation: 20,
                percentToWin: 100,
                requiredTreatedPatients: 2
            }
        });
        simulation.execute({ type: "start-emergency-wave" });
        expect(simulation.getState()).toMatchObject({
            patientsWaiting: 2,
            emergency: {
                active: true,
                remainingTicks: 12,
                totalPatients: 2,
                patientCount: 2,
                severity: 1,
                diseaseId: "mild-cold",
                durationTicks: 12,
                rewardCash: 400,
                rewardReputation: 20
            }
        });
        expect(simulation.getState().entities.waitingPatients.every((patient) => patient.diseaseId === "mild-cold")).toBe(true);
        simulation.execute({ type: "treat-patient" });
        simulation.execute({ type: "treat-patient" });
        expect(simulation.getState()).toMatchObject({
            cash: 50_680,
            reputation: 524,
            emergency: {
                active: false,
                successfulWaves: 1
            }
        });
    });
    it("uses scenario emergency percent-to-win thresholds instead of all-or-nothing completion", () => {
        const simulation = new DeterministicSimulation(73121, {
            bounds: { width: 8, height: 8 },
            emergencyWave: {
                patientCount: 4,
                severity: 1,
                durationTicks: 12,
                rewardCash: 400,
                rewardReputation: 20,
                percentToWin: 50
            }
        });
        simulation.execute({ type: "start-emergency-wave" });
        expect(simulation.getState().emergency).toMatchObject({
            active: true,
            totalPatients: 4,
            percentToWin: 50,
            requiredTreatedPatients: 2
        });
        simulation.execute({ type: "send-patient-home", patientId: 1 });
        expect(simulation.getState().emergency).toMatchObject({
            active: true,
            failedPatients: 1,
            treatedPatients: 0
        });
        simulation.execute({ type: "treat-patient" });
        simulation.execute({ type: "treat-patient" });
        expect(simulation.getState()).toMatchObject({
            emergency: {
                active: false,
                successfulWaves: 1,
                failedWaves: 0
            }
        });
        expect(simulation.getState().events.recent.at(-1)?.type).toBe("emergency-succeeded");
    });
    it("fails active emergency waves at the deadline when patients remain untreated", () => {
        const simulation = new DeterministicSimulation(7311, { bounds: { width: 8, height: 8 } });
        const diagnosisRoom = simulation.getState().entities.rooms.find((room) => room.roomType === "diagnosis");
        simulation.execute({ type: "set-room-status", roomId: diagnosisRoom.id, status: "closed" });
        simulation.execute({ type: "start-emergency-wave" });
        simulation.execute({ type: "tick", count: 24 });
        expect(simulation.getState()).toMatchObject({
            emergency: {
                active: false,
                wavesStarted: 1,
                successfulWaves: 0,
                failedWaves: 1
            }
        });
        expect(simulation.getState().entities.waitingPatients).toHaveLength(4);
        expect(simulation.getState().entities.waitingPatients.every((patient) => patient.emergencyWaveId === undefined)).toBe(true);
        expect(simulation.getState().events.recent.at(-1)?.type).toBe("emergency-failed");
    });
    it("contains deterministic epidemic outbreaks before they spread", () => {
        const simulation = new DeterministicSimulation(7314, { bounds: { width: 8, height: 8 } });
        simulation.execute({ type: "start-epidemic-outbreak" });
        expect(simulation.getState()).toMatchObject({
            patientsWaiting: 3,
            epidemic: {
                active: true,
                outbreakId: 1,
                remainingTicks: 18,
                totalPatients: 3,
                remainingPatients: 3,
                treatedPatients: 0,
                outbreaksStarted: 1,
                containedOutbreaks: 0,
                failedOutbreaks: 0,
                spreadPatients: 0,
                patientCount: 3,
                severity: 2,
                durationTicks: 18,
                spreadIntervalTicks: 6,
                maxSpreadPatients: 2,
                rewardCash: 700,
                rewardReputation: 30,
                penaltyCash: 500,
                penaltyReputation: 35
            }
        });
        expect(simulation.getState().entities.waitingPatients.every((patient) => patient.epidemicOutbreakId === 1)).toBe(true);
        for (let index = 0; index < 3; index += 1) {
            simulation.execute({ type: "treat-patient" });
        }
        expect(simulation.getState()).toMatchObject({
            patientsWaiting: 0,
            cash: 51_240,
            reputation: 542,
            epidemic: {
                active: false,
                outbreaksStarted: 1,
                containedOutbreaks: 1,
                failedOutbreaks: 0,
                spreadPatients: 0
            }
        });
        expect(simulation.getState().events.recent.map((event) => event.type)).toContain("epidemic-contained");
    });
    it("uses imported vaccination cost as an epidemic start expense", () => {
        const simulation = new DeterministicSimulation(73141, {
            bounds: { width: 8, height: 8 },
            epidemicOutbreak: { patientCount: 3, vaccinationCost: 50 }
        });
        const cashBefore = simulation.getState().cash;
        simulation.execute({ type: "start-epidemic-outbreak" });
        const state = simulation.getState();
        expect(state.cash).toBe(cashBefore - 150);
        expect(state.economy.tickExpenses).toBe(150);
        expect(state.epidemic).toMatchObject({
            active: true,
            vaccinationCost: 50,
            totalVaccinationCosts: 150
        });
    });
    it("uses imported epidemic compensation ranges as deterministic outbreak rewards", () => {
        const simulation = new DeterministicSimulation(73143, {
            bounds: { width: 8, height: 8 },
            epidemicOutbreak: { patientCount: 1, rewardCashMin: 1000, rewardCashMax: 1002 }
        });
        expect(simulation.getState().epidemic).toMatchObject({
            active: false,
            rewardCash: 1001,
            rewardCashMin: 1000,
            rewardCashMax: 1002
        });
        simulation.execute({ type: "start-epidemic-outbreak" });
        const activeReward = simulation.getState().epidemic.rewardCash;
        expect(activeReward).toBeGreaterThanOrEqual(1000);
        expect(activeReward).toBeLessThanOrEqual(1002);
        for (let index = 0; index < 1; index += 1) {
            simulation.execute({ type: "treat-patient" });
        }
        expect(simulation.getState().events.recent.map((event) => event.type)).toContain("epidemic-contained");
        expect(simulation.getState().epidemic.rewardCash).toBe(1001);
    });
    it("uses imported epidemic reduction settings to slow later spread", () => {
        const simulation = new DeterministicSimulation(73142, {
            bounds: { width: 8, height: 8 },
            epidemicOutbreak: {
                patientCount: 1,
                spreadIntervalTicks: 2,
                maxSpreadPatients: 3,
                spreadSlowdownTicks: 2,
                spreadSlowdownRatePercent: 100
            }
        });
        simulation.execute({ type: "start-epidemic-outbreak" });
        simulation.execute({ type: "tick", count: 2 });
        expect(simulation.getState().epidemic).toMatchObject({
            active: true,
            outbreakSpreadPatients: 1,
            spreadSlowdownActive: true,
            nextSpreadTick: 6
        });
        simulation.execute({ type: "tick", count: 3 });
        expect(simulation.getState().epidemic.outbreakSpreadPatients).toBe(1);
        simulation.execute({ type: "tick", count: 1 });
        expect(simulation.getState().epidemic.outbreakSpreadPatients).toBe(2);
    });
    it("uses imported epidemic spread chance to gate interval spread", () => {
        const blocked = new DeterministicSimulation(73143, {
            bounds: { width: 8, height: 8 },
            epidemicOutbreak: {
                patientCount: 1,
                spreadIntervalTicks: 2,
                maxSpreadPatients: 3,
                spreadChancePercent: 0
            }
        });
        const guaranteed = new DeterministicSimulation(73143, {
            bounds: { width: 8, height: 8 },
            epidemicOutbreak: {
                patientCount: 1,
                spreadIntervalTicks: 2,
                maxSpreadPatients: 3,
                spreadChancePercent: 100
            }
        });
        blocked.execute({ type: "start-epidemic-outbreak" });
        guaranteed.execute({ type: "start-epidemic-outbreak" });
        blocked.execute({ type: "tick", count: 6 });
        guaranteed.execute({ type: "tick", count: 6 });
        expect(blocked.getState().epidemic).toMatchObject({
            spreadChancePercent: 0,
            outbreakSpreadPatients: 0,
            remainingSpreadPatients: 3
        });
        expect(guaranteed.getState().epidemic).toMatchObject({
            spreadChancePercent: 100,
            outbreakSpreadPatients: 3,
            remainingSpreadPatients: 0
        });
    });
    it("spreads and fails active epidemic outbreaks at the deadline", () => {
        const simulation = new DeterministicSimulation(7315, { bounds: { width: 8, height: 8 } });
        const diagnosisRoom = simulation.getState().entities.rooms.find((room) => room.roomType === "diagnosis");
        simulation.execute({ type: "set-room-status", roomId: diagnosisRoom.id, status: "closed" });
        simulation.execute({ type: "start-epidemic-outbreak" });
        simulation.execute({ type: "tick", count: 18 });
        expect(simulation.getState()).toMatchObject({
            epidemic: {
                active: false,
                outbreaksStarted: 1,
                containedOutbreaks: 0,
                failedOutbreaks: 1,
                spreadPatients: 2
            }
        });
        expect(simulation.getState().entities.waitingPatients).toHaveLength(5);
        expect(simulation.getState().entities.waitingPatients.every((patient) => patient.epidemicOutbreakId === undefined)).toBe(true);
        expect(simulation.getState().events.recent.map((event) => event.type)).toContain("epidemic-spread");
        expect(simulation.getState().events.recent.at(-1)?.type).toBe("epidemic-failed");
    });
    it("resolves VIP inspections from deterministic hospital quality", () => {
        const simulation = new DeterministicSimulation(7312, { bounds: { width: 8, height: 8 } });
        simulation.execute({ type: "start-vip-inspection" });
        expect(simulation.getState()).toMatchObject({
            vipInspection: {
                active: true,
                visitId: 1,
                remainingTicks: 8,
                visitsStarted: 1,
                passedVisits: 0,
                failedVisits: 0,
                durationTicks: 8,
                maxQueuePressure: 2,
                minReputation: 450,
                rewardCash: 800,
                rewardReputation: 25,
                penaltyCash: 300,
                penaltyReputation: 20
            }
        });
        simulation.execute({ type: "tick", count: 8 });
        expect(simulation.getState()).toMatchObject({
            cash: 50_688,
            vipInspection: {
                active: false,
                visitsStarted: 1,
                passedVisits: 1,
                failedVisits: 0
            }
        });
        expect(simulation.getState().reputation).toBeGreaterThan(500);
        expect(simulation.getState().events.recent.at(-1)?.type).toBe("vip-inspection-passed");
    });
    it("fails VIP inspections when the hospital is overloaded or under-equipped", () => {
        const simulation = new DeterministicSimulation(7313, { bounds: { width: 8, height: 8 } });
        const diagnosisRoom = simulation.getState().entities.rooms.find((room) => room.roomType === "diagnosis");
        simulation.execute({ type: "set-room-status", roomId: diagnosisRoom.id, status: "closed" });
        simulation.execute({ type: "start-vip-inspection" });
        simulation.execute({ type: "admit-patient", severity: 2, position: { x: 2, y: 2 } });
        simulation.execute({ type: "admit-patient", severity: 2, position: { x: 2, y: 2 } });
        simulation.execute({ type: "admit-patient", severity: 2, position: { x: 2, y: 2 } });
        simulation.execute({ type: "tick", count: 8 });
        expect(simulation.getState()).toMatchObject({
            vipInspection: {
                active: false,
                visitsStarted: 1,
                passedVisits: 0,
                failedVisits: 1
            }
        });
        expect(simulation.getState().events.recent.at(-1)?.type).toBe("vip-inspection-failed");
    });
    it("keeps deterministic hashes for identical slice 3 economy/progression/event command streams", () => {
        const commands = [
            { type: "tick", count: 1 },
            { type: "start-vip-inspection" },
            { type: "run-awards-ceremony" },
            { type: "admit-patient", severity: 1, position: { x: 1, y: 1 } },
            { type: "tick", count: 2 },
            { type: "start-insurance-contract" },
            { type: "start-emergency-wave" },
            { type: "start-epidemic-outbreak" },
            { type: "treat-patient" },
            { type: "treat-patient" },
            { type: "admit-patient", severity: 2, position: { x: 2, y: 2 } },
            { type: "tick", count: 3 },
            { type: "admit-patient", severity: 3, position: { x: 3, y: 3 } },
            { type: "tick", count: 4 }
        ];
        const left = new DeterministicSimulation(7303, { bounds: { width: 8, height: 8 } });
        const right = new DeterministicSimulation(7303, { bounds: { width: 8, height: 8 } });
        const leftHashes = commands.map((command) => {
            left.execute(command);
            return left.currentHash();
        });
        const rightHashes = commands.map((command) => {
            right.execute(command);
            return right.currentHash();
        });
        expect(leftHashes).toEqual(rightHashes);
        expect(leftHashes[leftHashes.length - 1]).toMatch(/^[a-f0-9]{8}$/);
    });
});
