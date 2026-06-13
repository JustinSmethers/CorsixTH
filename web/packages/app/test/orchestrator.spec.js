import { AppOrchestrator } from "../src/index";
import { patientMaxHealthForSeverity, roomRepairCost } from "@corsixth/rules";
function stateHashAfterScript(seed, script) {
    const orchestrator = new AppOrchestrator({ seed, tickRateHz: 4, pointerTileSize: 8 });
    for (const action of script) {
        orchestrator.dispatch(action);
        orchestrator.advanceFrame(250);
    }
    return orchestrator.telemetry().stateHash;
}
function createTerrain(width, height) {
    return {
        width,
        height,
        signature: `orchestrator-test-terrain:${width}x${height}`,
        tiles: Array.from({ length: width * height }, () => ({ passable: true, buildable: true }))
    };
}
function setRect(terrain, left, top, width, height, values) {
    for (let y = top; y < top + height; y += 1) {
        for (let x = left; x < left + width; x += 1) {
            terrain.tiles[y * terrain.width + x] = {
                ...terrain.tiles[y * terrain.width + x],
                ...values
            };
        }
    }
}
describe("app orchestrator", () => {
    it("advances ticks deterministically from frame deltas", () => {
        const orchestrator = new AppOrchestrator({ seed: 777, tickRateHz: 4 });
        expect(orchestrator.telemetry().tick).toBe(0);
        expect(orchestrator.advanceFrame(249)).toBe(0);
        expect(orchestrator.telemetry().tick).toBe(0);
        expect(orchestrator.advanceFrame(1)).toBe(1);
        expect(orchestrator.telemetry().tick).toBe(1);
        expect(orchestrator.advanceFrame(750)).toBe(3);
        expect(orchestrator.telemetry().tick).toBe(4);
    });
    it("coalesces consecutive ticks in persistence command history for long browser sessions", () => {
        const orchestrator = new AppOrchestrator({
            seed: 778,
            tickRateHz: 4,
            pointerTileSize: 8,
            eventSettings: { mayorLaunch: 0, disasterLaunch: 0, minimumAbductionYears: 0, abductionsPerYear: 0 },
            admissionRules: { holdVisualPeepCount: 999 }
        });
        orchestrator.dispatch({ device: "ui", action: "pause-toggle", source: "ui:pause-toggle" });
        orchestrator.advanceSimulationTicks(14_400);
        const snapshot = orchestrator.createPersistenceSnapshot();
        expect(snapshot.commandLog).toEqual([
            { type: "tick", count: 14_400 }
        ]);
        expect(JSON.stringify(snapshot.commandLog).length).toBeLessThan(64);
        expect(AppOrchestrator.fromPersistenceSnapshot(snapshot).telemetry()).toEqual(orchestrator.telemetry());
    });
    it("supports pause, step, resume, and updates telemetry", () => {
        const orchestrator = new AppOrchestrator({ seed: 1234, tickRateHz: 2 });
        orchestrator.advanceFrame(500);
        const baselineTick = orchestrator.telemetry().tick;
        expect(orchestrator.dispatch({ device: "keyboard", action: "pause-toggle", source: "Space" })).toEqual(["app.paused"]);
        expect(orchestrator.telemetry().paused).toBe(true);
        expect(orchestrator.advanceFrame(2000)).toBe(0);
        expect(orchestrator.telemetry().tick).toBe(baselineTick);
        expect(orchestrator.dispatch({ device: "keyboard", action: "step-tick", source: "Period" })).toEqual(["app.step"]);
        expect(orchestrator.telemetry().tick).toBe(baselineTick + 1);
        expect(orchestrator.dispatch({ device: "keyboard", action: "pause-toggle", source: "Space" })).toEqual(["app.resumed"]);
        expect(orchestrator.telemetry().paused).toBe(false);
        expect(orchestrator.advanceFrame(500)).toBe(1);
        expect(orchestrator.telemetry().tick).toBe(baselineTick + 2);
    });
    it("routes normalized input actions to deterministic simulation commands", () => {
        const orchestrator = new AppOrchestrator({ seed: 55, pointerTileSize: 8 });
        expect(orchestrator.dispatch({
            device: "mouse",
            action: "admit-patient",
            severity: 3,
            source: "mouse:2",
            pointer: { x: 16, y: 24 }
        })).toEqual(["patient.admitted"]);
        expect(orchestrator.telemetry().patientsWaiting).toBe(1);
        expect(orchestrator.dispatch({
            device: "mouse",
            action: "treat-patient",
            source: "mouse:0",
            pointer: { x: 16, y: 24 }
        })).toEqual(["patient.treated.success"]);
        const telemetry = orchestrator.telemetry();
        expect(telemetry.patientsWaiting).toBe(0);
        expect(telemetry.treatedPatients).toBe(1);
        expect(telemetry.seed).toBe(55);
        expect(telemetry.stateHash).toMatch(/^[a-f0-9]{8}$/);
    });
    it("emits empty-treatment cue when no patient is waiting", () => {
        const orchestrator = new AppOrchestrator({ seed: 56, pointerTileSize: 8 });
        expect(orchestrator.dispatch({
            device: "mouse",
            action: "treat-patient",
            source: "mouse:0",
            pointer: { x: 16, y: 24 }
        })).toEqual(["patient.treated.empty"]);
        expect(orchestrator.telemetry().treatedPatients).toBe(0);
    });
    it("routes selected-patient treatment through command history and restore", () => {
        const orchestrator = new AppOrchestrator({ seed: 57, pointerTileSize: 8 });
        orchestrator.dispatch({ device: "ui", action: "admit-patient", severity: 1, source: "ui:admit" });
        orchestrator.dispatch({ device: "ui", action: "admit-patient", severity: 2, source: "ui:admit" });
        const selectedPatientId = orchestrator.getState().entities.waitingPatients[1].id;
        expect(orchestrator.dispatch({
            device: "ui",
            action: "treat-patient",
            patientId: selectedPatientId,
            source: "ui:treat"
        })).toEqual(["patient.treated.success"]);
        expect(orchestrator.getState().entities.waitingPatients.map((patient) => patient.id)).toEqual([1]);
        const snapshot = orchestrator.createPersistenceSnapshot();
        expect(snapshot.commandLog[snapshot.commandLog.length - 1]).toEqual({
            type: "treat-patient",
            patientId: selectedPatientId
        });
        expect(AppOrchestrator.fromPersistenceSnapshot(snapshot).telemetry()).toEqual(orchestrator.telemetry());
    });
    it("routes selected-patient send-home through command history and restore", () => {
        const orchestrator = new AppOrchestrator({ seed: 58, pointerTileSize: 8 });
        orchestrator.dispatch({ device: "ui", action: "admit-patient", severity: 1, source: "ui:admit" });
        orchestrator.dispatch({ device: "ui", action: "admit-patient", severity: 3, source: "ui:admit" });
        const selectedPatientId = orchestrator.getState().entities.waitingPatients[1].id;
        const cashBeforeSendHome = orchestrator.telemetry().cash;
        expect(orchestrator.dispatch({
            device: "ui",
            action: "send-patient-home",
            patientId: selectedPatientId,
            source: "ui:send-selected-patient-home"
        })).toEqual(["patient.sent-home"]);
        expect(orchestrator.getState().entities.waitingPatients.map((patient) => patient.id)).toEqual([1]);
        expect(orchestrator.telemetry().cash).toBeLessThan(cashBeforeSendHome);
        const snapshot = orchestrator.createPersistenceSnapshot();
        expect(snapshot.commandLog[snapshot.commandLog.length - 1]).toEqual({
            type: "send-patient-home",
            patientId: selectedPatientId
        });
        expect(AppOrchestrator.fromPersistenceSnapshot(snapshot).telemetry()).toEqual(orchestrator.telemetry());
        expect(orchestrator.dispatch({
            device: "ui",
            action: "send-patient-home",
            patientId: selectedPatientId,
            source: "ui:send-selected-patient-home"
        })).toEqual(["patient.send-home-empty"]);
    });
    it("routes selected-patient prioritization through command history and restore", () => {
        const orchestrator = new AppOrchestrator({ seed: 59, pointerTileSize: 8 });
        orchestrator.dispatch({ device: "ui", action: "pause-toggle", source: "ui:pause-toggle" });
        orchestrator.dispatch({ device: "ui", action: "admit-patient", severity: 1, source: "ui:admit" });
        orchestrator.dispatch({ device: "ui", action: "admit-patient", severity: 2, source: "ui:admit" });
        expect(orchestrator.dispatch({
            device: "ui",
            action: "prioritize-patient",
            patientId: 2,
            source: "ui:prioritize-selected-patient"
        })).toEqual(["patient.prioritized"]);
        orchestrator.dispatch({ device: "ui", action: "step-tick", source: "ui:step" });
        expect(orchestrator.getState().entities.waitingPatients.find((patient) => patient.id === 2)).toMatchObject({
            status: "walking-to-diagnosis"
        });
        expect(orchestrator.getState().entities.waitingPatients.find((patient) => patient.id === 1)).toMatchObject({
            status: "queued"
        });
        const snapshot = orchestrator.createPersistenceSnapshot();
        expect(snapshot.commandLog).toContainEqual({ type: "prioritize-patient", patientId: 2 });
        expect(AppOrchestrator.fromPersistenceSnapshot(snapshot).telemetry()).toEqual(orchestrator.telemetry());
        expect(orchestrator.dispatch({
            device: "ui",
            action: "prioritize-patient",
            patientId: 2,
            source: "ui:prioritize-selected-patient"
        })).toEqual(["patient.prioritize-empty"]);
    });
    it("emits no step cue while running and still preserves deterministic hashes", () => {
        const orchestrator = new AppOrchestrator({ seed: 100, tickRateHz: 4 });
        expect(orchestrator.dispatch({ device: "keyboard", action: "step-tick", source: "Period" })).toEqual([]);
        expect(orchestrator.telemetry().tick).toBe(0);
    });
    it("applies and persists deterministic runtime speed controls", () => {
        const orchestrator = new AppOrchestrator({ seed: 101, tickRateHz: 4 });
        expect(orchestrator.telemetry()).toMatchObject({
            speedMultiplier: 1,
            tick: 0
        });
        expect(orchestrator.dispatch({
            device: "ui",
            action: "speed-set",
            speedMultiplier: 8,
            source: "ui:speed-select"
        })).toEqual(["speed.changed"]);
        expect(orchestrator.advanceFrame(250)).toBe(8);
        expect(orchestrator.telemetry()).toMatchObject({
            speedMultiplier: 8,
            tick: 8
        });
        expect(orchestrator.dispatch({
            device: "ui",
            action: "speed-set",
            speedMultiplier: 0.5,
            source: "ui:speed-select"
        })).toEqual(["speed.changed"]);
        expect(orchestrator.advanceFrame(250)).toBe(0);
        expect(orchestrator.advanceFrame(250)).toBe(1);
        expect(orchestrator.telemetry()).toMatchObject({
            speedMultiplier: 0.5,
            tick: 9
        });
        const restored = AppOrchestrator.fromPersistenceSnapshot(orchestrator.createPersistenceSnapshot());
        expect(restored.telemetry()).toEqual(orchestrator.telemetry());
    });
    it("routes treatment pricing policy through deterministic command history and restore", () => {
        const orchestrator = new AppOrchestrator({ seed: 102, tickRateHz: 4, pointerTileSize: 8 });
        expect(orchestrator.telemetry().treatmentPricingPolicy).toBe("standard");
        expect(orchestrator.dispatch({
            device: "ui",
            action: "pricing-policy-set",
            pricingPolicy: "premium",
            source: "ui:pricing-policy"
        })).toEqual(["pricing-policy.changed"]);
        expect(orchestrator.telemetry().treatmentPricingPolicy).toBe("premium");
        orchestrator.dispatch({ device: "ui", action: "admit-patient", severity: 2, source: "ui:admit" });
        const cashBeforeTreatment = orchestrator.telemetry().cash;
        orchestrator.dispatch({ device: "ui", action: "treat-patient", source: "ui:treat" });
        expect(orchestrator.telemetry().cash).toBe(cashBeforeTreatment + 243);
        const snapshot = orchestrator.createPersistenceSnapshot();
        expect(snapshot.commandLog).toContainEqual({ type: "set-pricing-policy", policy: "premium" });
        expect(AppOrchestrator.fromPersistenceSnapshot(snapshot).telemetry()).toEqual(orchestrator.telemetry());
    });
    it("routes deterministic loans and repayment through command history and restore", () => {
        const orchestrator = new AppOrchestrator({
            seed: 103,
            tickRateHz: 4,
            pointerTileSize: 8
        });
        expect(orchestrator.dispatch({ device: "ui", action: "take-loan", source: "ui:take-loan" })).toEqual(["loan.taken"]);
        expect(orchestrator.telemetry()).toMatchObject({
            cash: 55_000,
            outstandingLoan: 5_000,
            loanInterestExpense: 2
        });
        orchestrator.advanceFrame(250);
        expect(orchestrator.telemetry()).toMatchObject({
            cash: 54_984,
            tickExpenses: 16,
            cumulativeLoanInterest: 2
        });
        expect(orchestrator.dispatch({ device: "ui", action: "repay-loan", source: "ui:repay-loan" })).toEqual(["loan.repaid"]);
        expect(orchestrator.telemetry()).toMatchObject({
            cash: 49_984,
            outstandingLoan: 0,
            loanInterestExpense: 0
        });
        const snapshot = orchestrator.createPersistenceSnapshot();
        expect(snapshot.commandLog).toEqual(expect.arrayContaining([{ type: "take-loan" }, { type: "repay-loan" }]));
        expect(AppOrchestrator.fromPersistenceSnapshot(snapshot).telemetry()).toEqual(orchestrator.telemetry());
    });
    it("uses imported scenario loan interest in economy telemetry and restore", () => {
        const orchestrator = new AppOrchestrator({
            seed: 1031,
            tickRateHz: 4,
            pointerTileSize: 8,
            initialCash: 1_000,
            loanInterestPerChunk: 1
        });
        expect(orchestrator.dispatch({ device: "ui", action: "take-loan", source: "ui:take-loan" })).toEqual(["loan.taken"]);
        expect(orchestrator.telemetry()).toMatchObject({
            outstandingLoan: 5_000,
            loanInterestExpense: 1,
            scenarioLoanInterestPerChunk: 1
        });
        orchestrator.advanceFrame(250);
        expect(orchestrator.telemetry()).toMatchObject({
            tickExpenses: 15,
            cumulativeLoanInterest: 1
        });
        const snapshot = orchestrator.createPersistenceSnapshot();
        expect(snapshot.loanInterestPerChunk).toBe(1);
        expect(AppOrchestrator.fromPersistenceSnapshot(snapshot).telemetry()).toEqual(orchestrator.telemetry());
    });
    it("routes finance audits through deterministic command history and restore", () => {
        const orchestrator = new AppOrchestrator({ seed: 111, tickRateHz: 4, pointerTileSize: 8 });
        expect(orchestrator.telemetry()).toMatchObject({
            financeLedgerUnlocked: false,
            financeAuditReady: false,
            financeAuditCashRecovery: 350,
            financeAuditCooldownTicks: 10,
            financeAuditCooldownRemainingTicks: 0,
            financeAuditsRun: 0,
            financeAuditTotalRecoveredCash: 0
        });
        expect(orchestrator.dispatch({
            device: "ui",
            action: "run-finance-audit",
            source: "ui:run-finance-audit"
        })).toEqual(["finance.audit-blocked"]);
        orchestrator.dispatch({ device: "ui", action: "admit-patient", severity: 1, source: "ui:admit" });
        orchestrator.dispatch({ device: "ui", action: "treat-patient", source: "ui:treat" });
        expect(orchestrator.telemetry()).toMatchObject({
            financeLedgerUnlocked: true,
            financeAuditReady: true
        });
        expect(orchestrator.dispatch({
            device: "ui",
            action: "run-finance-audit",
            source: "ui:run-finance-audit"
        })).toEqual(["finance.audit-run"]);
        expect(orchestrator.telemetry()).toMatchObject({
            cash: 50_490,
            financeAuditReady: false,
            financeAuditCooldownRemainingTicks: 10,
            financeAuditsRun: 1,
            financeAuditTotalRecoveredCash: 350,
            lastEventType: "finance-audit-run"
        });
        expect(orchestrator.dispatch({
            device: "ui",
            action: "run-finance-audit",
            source: "ui:run-finance-audit"
        })).toEqual(["finance.audit-blocked"]);
        const snapshot = orchestrator.createPersistenceSnapshot();
        expect(snapshot.commandLog).toContainEqual({ type: "run-finance-audit" });
        expect(AppOrchestrator.fromPersistenceSnapshot(snapshot).telemetry()).toEqual(orchestrator.telemetry());
    });
    it("routes marketing campaigns through deterministic command history and restore", () => {
        const orchestrator = new AppOrchestrator({ seed: 104, tickRateHz: 4, pointerTileSize: 8 });
        expect(orchestrator.telemetry()).toMatchObject({
            cash: 50_000,
            reputation: 500,
            marketingCampaignCost: 600,
            marketingCampaignReputationGain: 35
        });
        expect(orchestrator.dispatch({
            device: "ui",
            action: "run-marketing-campaign",
            source: "ui:run-marketing-campaign"
        })).toEqual(["marketing.launched"]);
        expect(orchestrator.telemetry()).toMatchObject({
            cash: 49_400,
            reputation: 535,
            lastEventType: "marketing-campaign-run"
        });
        const snapshot = orchestrator.createPersistenceSnapshot();
        expect(snapshot.commandLog).toContainEqual({ type: "run-marketing-campaign" });
        expect(AppOrchestrator.fromPersistenceSnapshot(snapshot).telemetry()).toEqual(orchestrator.telemetry());
    });
    it("routes insurance contracts through deterministic command history and restore", () => {
        const orchestrator = new AppOrchestrator({ seed: 110, tickRateHz: 4, pointerTileSize: 8 });
        expect(orchestrator.telemetry()).toMatchObject({
            insuranceContractUnlocked: false,
            insuranceContractActive: false,
            insuranceContractPatientCount: 2,
            insuranceContractSeverity: 2,
            insuranceContractDurationTicks: 16,
            insuranceContractRewardCash: 650,
            insuranceContractRewardReputation: 15,
            insuranceContractPenaltyCash: 250,
            insuranceContractPenaltyReputation: 12
        });
        expect(orchestrator.dispatch({
            device: "ui",
            action: "start-insurance-contract",
            source: "ui:start-insurance-contract"
        })).toEqual(["insurance.blocked"]);
        for (let index = 0; index < 3; index += 1) {
            orchestrator.dispatch({ device: "ui", action: "admit-patient", severity: 1, source: "ui:admit" });
            orchestrator.dispatch({ device: "ui", action: "treat-patient", source: "ui:treat" });
        }
        expect(orchestrator.telemetry()).toMatchObject({
            insuranceContractUnlocked: true,
            insuranceContractsStarted: 0
        });
        expect(orchestrator.dispatch({
            device: "ui",
            action: "start-insurance-contract",
            source: "ui:start-insurance-contract"
        })).toEqual(["insurance.started"]);
        expect(orchestrator.telemetry()).toMatchObject({
            patientsWaiting: 2,
            insuranceContractActive: true,
            insuranceContractId: 1,
            insuranceContractRemainingTicks: 16,
            insuranceContractTotalPatients: 2,
            insuranceContractRemainingPatients: 2,
            insuranceContractsStarted: 1,
            lastEventType: "insurance-contract-started"
        });
        expect(orchestrator.dispatch({
            device: "ui",
            action: "start-insurance-contract",
            source: "ui:start-insurance-contract"
        })).toEqual(["insurance.blocked"]);
        orchestrator.dispatch({ device: "ui", action: "treat-patient", source: "ui:treat" });
        orchestrator.dispatch({ device: "ui", action: "treat-patient", source: "ui:treat" });
        expect(orchestrator.telemetry()).toMatchObject({
            insuranceContractActive: false,
            insuranceContractsCompleted: 1,
            insuranceContractsFailed: 0,
            lastEventType: "insurance-contract-completed"
        });
        const snapshot = orchestrator.createPersistenceSnapshot();
        expect(snapshot.commandLog).toContainEqual({ type: "start-insurance-contract" });
        expect(AppOrchestrator.fromPersistenceSnapshot(snapshot).telemetry()).toEqual(orchestrator.telemetry());
    });
    it("routes award ceremonies through deterministic command history and restore", () => {
        const orchestrator = new AppOrchestrator({ seed: 109, tickRateHz: 4, pointerTileSize: 8 });
        expect(orchestrator.telemetry()).toMatchObject({
            hospitalRatingScore: 33,
            hospitalRatingTier: "none",
            hospitalAwardCeremoniesRun: 0
        });
        for (let index = 0; index < 3; index += 1) {
            orchestrator.dispatch({ device: "ui", action: "admit-patient", severity: 1, source: "ui:admit" });
            orchestrator.dispatch({ device: "ui", action: "treat-patient", source: "ui:treat" });
        }
        expect(orchestrator.telemetry()).toMatchObject({
            hospitalRatingTier: "gold",
            hospitalAwardRewardCash: 1000,
            hospitalAwardRewardReputation: 30
        });
        expect(orchestrator.dispatch({
            device: "ui",
            action: "run-awards-ceremony",
            source: "ui:run-awards-ceremony"
        })).toEqual(["awards.completed"]);
        expect(orchestrator.telemetry()).toMatchObject({
            hospitalAwardCeremoniesRun: 1,
            hospitalAwardLastTier: "gold",
            hospitalAwardLastScore: 87,
            hospitalAwardTotalCashReward: 1000,
            hospitalAwardTotalReputationReward: 30,
            lastEventType: "hospital-award-granted"
        });
        const snapshot = orchestrator.createPersistenceSnapshot();
        expect(snapshot.commandLog).toContainEqual({ type: "run-awards-ceremony" });
        expect(AppOrchestrator.fromPersistenceSnapshot(snapshot).telemetry()).toEqual(orchestrator.telemetry());
    });
    it("preserves imported scenario award thresholds in telemetry and restore", () => {
        const orchestrator = new AppOrchestrator({
            seed: 109,
            tickRateHz: 4,
            pointerTileSize: 8,
            awardCriteria: {
                curesAward: 10,
                reputationAward: 600,
                hospValueAward: 60000,
                deathsAward: 5,
                curesPoor: 2,
                reputationPoor: 600,
                hospValuePoor: 100000,
                deathsPoor: 10,
                curesPenalty: -3000
            }
        });
        expect(orchestrator.telemetry()).toMatchObject({
            scenarioAwardCriteria: {
                curesAward: 10,
                reputationAward: 600,
                hospValueAward: 60000,
                deathsAward: 5,
                curesPoor: 2,
                reputationPoor: 600,
                hospValuePoor: 100000,
                deathsPoor: 10,
                curesPenalty: -3000
            },
            scenarioAwardCriteriaSummary: "cures 10, reputation 600, value 60000, deaths max 5, poor deaths 10",
            scenarioAwardCriteriaMet: false,
            scenarioAwardCriteriaUnmetSummary: "cures 0/10, reputation 500/600",
            scenarioAwardPoorCriteriaSummary: "cures below 2, reputation below 600, value below 100000, deaths above 10",
            scenarioAwardPoorCriteriaTriggered: true,
            scenarioAwardPoorCriteriaTriggeredSummary: "cures 0/2, reputation 500/600, value 62000/100000"
        });
        expect(orchestrator.dispatch({
            device: "ui",
            action: "run-awards-ceremony",
            source: "ui:run-awards-ceremony"
        })).toEqual(["awards.blocked"]);
        expect(orchestrator.telemetry().hospitalAwardCeremoniesRun).toBe(0);
        const snapshot = orchestrator.createPersistenceSnapshot();
        expect(snapshot.awardCriteria).toEqual({
            curesAward: 10,
            reputationAward: 600,
            hospValueAward: 60000,
            deathsAward: 5,
            curesPoor: 2,
            reputationPoor: 600,
            hospValuePoor: 100000,
            deathsPoor: 10,
            curesPenalty: -3000
        });
        expect(AppOrchestrator.fromPersistenceSnapshot(snapshot).telemetry()).toEqual(orchestrator.telemetry());
    });
    it("allows scenario award ceremonies after imported thresholds are met", () => {
        const orchestrator = new AppOrchestrator({
            seed: 109,
            tickRateHz: 4,
            pointerTileSize: 8,
            awardCriteria: { curesAward: 3, reputationAward: 500, hospValueAward: 1000, deathsPoor: 0 }
        });
        for (let index = 0; index < 3; index += 1) {
            orchestrator.dispatch({ device: "ui", action: "admit-patient", severity: 1, source: "ui:admit" });
            orchestrator.dispatch({ device: "ui", action: "treat-patient", source: "ui:treat" });
        }
        expect(orchestrator.telemetry()).toMatchObject({
            scenarioAwardCriteriaMet: true,
            scenarioAwardCriteriaUnmetSummary: "none"
        });
        expect(orchestrator.dispatch({
            device: "ui",
            action: "run-awards-ceremony",
            source: "ui:run-awards-ceremony"
        })).toEqual(["awards.completed"]);
        expect(orchestrator.telemetry()).toMatchObject({
            hospitalAwardCeremoniesRun: 1,
            lastEventType: "hospital-award-granted"
        });
    });
    it("blocks scenario award ceremonies when original poor thresholds are triggered", () => {
        const orchestrator = new AppOrchestrator({
            seed: 1092,
            tickRateHz: 4,
            pointerTileSize: 8,
            awardCriteria: { curesAward: 0, reputationAward: 450, hospValueAward: 1000, curesPoor: 2 }
        });
        expect(orchestrator.telemetry()).toMatchObject({
            scenarioAwardCriteriaMet: true,
            scenarioAwardCriteriaUnmetSummary: "none",
            scenarioAwardPoorCriteriaTriggered: true,
            scenarioAwardPoorCriteriaTriggeredSummary: "cures 0/2"
        });
        expect(orchestrator.dispatch({
            device: "ui",
            action: "run-awards-ceremony",
            source: "ui:run-awards-ceremony"
        })).toEqual(["awards.poor-blocked"]);
        expect(orchestrator.telemetry()).toMatchObject({
            hospitalAwardCeremoniesRun: 0
        });
        for (let index = 0; index < 2; index += 1) {
            orchestrator.dispatch({ device: "ui", action: "admit-patient", severity: 1, source: "ui:admit" });
            orchestrator.dispatch({ device: "ui", action: "treat-patient", source: "ui:treat" });
        }
        expect(orchestrator.telemetry()).toMatchObject({
            scenarioAwardPoorCriteriaTriggered: false,
            scenarioAwardPoorCriteriaTriggeredSummary: "none"
        });
        expect(orchestrator.dispatch({
            device: "ui",
            action: "run-awards-ceremony",
            source: "ui:run-awards-ceremony"
        })).toEqual(["awards.completed"]);
    });
    it("applies imported poor award penalties during ceremony", () => {
        const orchestrator = new AppOrchestrator({
            seed: 1093,
            tickRateHz: 4,
            pointerTileSize: 8,
            awardCriteria: { curesAward: 0, reputationAward: 450, hospValueAward: 1000, curesPoor: 2, curesPenalty: -3000 }
        });
        const cashBeforeAward = orchestrator.telemetry().cash;
        expect(orchestrator.telemetry()).toMatchObject({
            scenarioAwardCriteriaMet: true,
            scenarioAwardPoorCriteriaTriggered: true,
            scenarioAwardPoorCriteriaTriggeredSummary: "cures 0/2"
        });
        expect(orchestrator.dispatch({
            device: "ui",
            action: "run-awards-ceremony",
            source: "ui:run-awards-ceremony"
        })).toEqual(["awards.penalty-applied"]);
        expect(orchestrator.telemetry()).toMatchObject({
            cash: cashBeforeAward - 3000,
            hospitalAwardCeremoniesRun: 1,
            hospitalAwardTotalCashReward: -3000,
            hospitalAwardTotalReputationReward: 0,
            lastEventType: "hospital-award-penalty"
        });
        expect(orchestrator.createPersistenceSnapshot().commandLog).toContainEqual({
            type: "run-awards-ceremony",
            cashReward: -3000,
            reputationReward: 0
        });
    });
    it("applies imported death poor award penalties without blocking on the poor threshold", () => {
        const orchestrator = new AppOrchestrator({
            seed: 1094,
            tickRateHz: 4,
            pointerTileSize: 8,
            awardCriteria: { curesAward: 0, reputationAward: 450, hospValueAward: 1000, deathsAward: 5, deathsPoor: 0, deathsPenalty: -350 }
        });
        orchestrator.dispatch({ device: "ui", action: "pause-toggle", source: "ui:pause-toggle" });
        orchestrator.dispatch({ device: "ui", action: "staff-break-toggle", source: "ui:staff-break-toggle" });
        orchestrator.dispatch({ device: "ui", action: "admit-patient", severity: 3, source: "ui:admit" });
        for (let index = 0; index < 48; index += 1) {
            orchestrator.dispatch({ device: "ui", action: "step-tick", source: "ui:step" });
        }
        const cashBeforeAward = orchestrator.telemetry().cash;
        expect(orchestrator.telemetry()).toMatchObject({
            patientDeaths: 1,
            scenarioAwardCriteriaMet: true,
            scenarioAwardCriteriaUnmetSummary: "none",
            scenarioAwardPoorCriteriaTriggered: true,
            scenarioAwardPoorCriteriaTriggeredSummary: "deaths 1/0"
        });
        expect(orchestrator.dispatch({
            device: "ui",
            action: "run-awards-ceremony",
            source: "ui:run-awards-ceremony"
        })).toEqual(["awards.penalty-applied"]);
        expect(orchestrator.telemetry()).toMatchObject({
            cash: cashBeforeAward - 350,
            hospitalAwardTotalCashReward: -350,
            lastEventType: "hospital-award-penalty"
        });
    });
    it("applies imported cures and death trophy cash bonuses from original criteria", () => {
        const orchestrator = new AppOrchestrator({
            seed: 1095,
            tickRateHz: 4,
            pointerTileSize: 8,
            awardCriteria: {
                curesAward: 0,
                deathsAward: 5,
                reputationAward: 450,
                hospValueAward: 1000,
                trophyCuresBonus: 600,
                trophyDeathBonus: 700
            }
        });
        const cashBeforeAward = orchestrator.telemetry().cash;
        expect(orchestrator.telemetry()).toMatchObject({
            scenarioAwardCriteriaMet: true,
            scenarioAwardCriteriaSummary: "cures 0, reputation 450, value 1000, deaths max 5",
            hospitalAwardRewardCash: 1300,
            hospitalAwardRewardReputation: 0
        });
        expect(orchestrator.dispatch({
            device: "ui",
            action: "run-awards-ceremony",
            source: "ui:run-awards-ceremony"
        })).toEqual(["awards.completed"]);
        expect(orchestrator.telemetry()).toMatchObject({
            cash: cashBeforeAward + 1300,
            hospitalAwardTotalCashReward: 1300,
            hospitalAwardTotalReputationReward: 0,
            lastEventType: "hospital-award-granted"
        });
    });
    it("blocks scenario award ceremonies when original death award threshold is missed", () => {
        const orchestrator = new AppOrchestrator({
            seed: 1091,
            tickRateHz: 4,
            pointerTileSize: 8,
            awardCriteria: { curesAward: 0, reputationAward: 450, hospValueAward: 1000, deathsAward: 0, deathsPoor: 10 }
        });
        orchestrator.dispatch({ device: "ui", action: "pause-toggle", source: "ui:pause-toggle" });
        orchestrator.dispatch({ device: "ui", action: "staff-break-toggle", source: "ui:staff-break-toggle" });
        orchestrator.dispatch({ device: "ui", action: "admit-patient", severity: 3, source: "ui:admit" });
        for (let index = 0; index < 48; index += 1) {
            orchestrator.dispatch({ device: "ui", action: "step-tick", source: "ui:step" });
        }
        expect(orchestrator.telemetry()).toMatchObject({
            patientDeaths: 1,
            scenarioAwardCriteriaMet: false,
            scenarioAwardCriteriaUnmetSummary: "deaths 1/0"
        });
        expect(orchestrator.dispatch({
            device: "ui",
            action: "run-awards-ceremony",
            source: "ui:run-awards-ceremony"
        })).toEqual(["awards.blocked"]);
    });
    it("uses imported cans-of-coke award criteria for drink service trophies", () => {
        const orchestrator = new AppOrchestrator({
            seed: 1093,
            tickRateHz: 4,
            pointerTileSize: 8,
            patientBehaviorSettings: { drinkHappy: 3 },
            awardCriteria: { cansofCoke: 1 }
        });
        expect(orchestrator.telemetry()).toMatchObject({
            patientDrinks: 0,
            scenarioAwardCriteriaSummary: "drinks 1",
            scenarioAwardCriteriaMet: false,
            scenarioAwardCriteriaUnmetSummary: "drinks 0/1"
        });
        expect(orchestrator.dispatch({
            device: "ui",
            action: "run-awards-ceremony",
            source: "ui:run-awards-ceremony"
        })).toEqual(["awards.blocked"]);
        orchestrator.dispatch({ device: "ui", action: "pause-toggle", source: "ui:pause-toggle" });
        orchestrator.dispatch({ device: "ui", action: "admit-patient", severity: 3, source: "ui:admit" });
        const patientId = orchestrator.getState().entities.waitingPatients[0].id;
        orchestrator.dispatch({ device: "ui", action: "step-tick", source: "ui:step" });
        expect(orchestrator.dispatch({
            device: "ui",
            action: "give-patient-drink",
            patientId,
            source: "ui:drink"
        })).toEqual(["patient.drink-given"]);
        expect(orchestrator.telemetry()).toMatchObject({
            patientDrinks: 1,
            scenarioAwardCriteriaMet: true,
            scenarioAwardCriteriaUnmetSummary: "none"
        });
        expect(orchestrator.dispatch({
            device: "ui",
            action: "run-awards-ceremony",
            source: "ui:run-awards-ceremony"
        })).toEqual(["awards.completed"]);
        const snapshot = orchestrator.createPersistenceSnapshot();
        expect(snapshot.awardCriteria).toEqual({ cansofCoke: 1 });
        expect(AppOrchestrator.fromPersistenceSnapshot(snapshot).telemetry()).toEqual(orchestrator.telemetry());
    });
    it("uses imported rat-kill award criteria for rat shooting trophies", () => {
        const orchestrator = new AppOrchestrator({
            seed: 10935,
            awardCriteria: { ratKillsAbsolute: 3, ratKillsPercentage: 75, ratKillsAbsoluteBonus: 5, ratKillsPercentageBonus: 5000 }
        });
        expect(orchestrator.telemetry()).toMatchObject({
            ratKills: 0,
            ratSightings: 0,
            ratKillPercentage: 0,
            hospitalAwardRewardCash: 5000,
            hospitalAwardRewardReputation: 5,
            scenarioAwardCriteriaSummary: "rats 3, rat accuracy 75%",
            scenarioAwardCriteriaMet: false,
            scenarioAwardCriteriaUnmetSummary: "rats 0/3, rats 0/2"
        });
        expect(orchestrator.dispatch({ device: "ui", action: "shoot-rat", hit: false, source: "ui:shoot-rat" })).toEqual(["rat.missed"]);
        expect(orchestrator.dispatch({ device: "ui", action: "shoot-rat", source: "ui:shoot-rat" })).toEqual(["rat.killed"]);
        expect(orchestrator.telemetry()).toMatchObject({
            ratKills: 1,
            ratSightings: 2,
            ratKillPercentage: 50,
            scenarioAwardCriteriaMet: false,
            scenarioAwardCriteriaUnmetSummary: "rats 1/3, rats 1/2"
        });
        orchestrator.dispatch({ device: "ui", action: "shoot-rat", source: "ui:shoot-rat" });
        orchestrator.dispatch({ device: "ui", action: "shoot-rat", source: "ui:shoot-rat" });
        expect(orchestrator.telemetry()).toMatchObject({
            ratKills: 3,
            ratSightings: 4,
            ratKillPercentage: 75,
            scenarioAwardCriteriaMet: true,
            scenarioAwardCriteriaUnmetSummary: "none"
        });
        const reputationBeforeAward = orchestrator.telemetry().reputation;
        expect(orchestrator.dispatch({
            device: "ui",
            action: "run-awards-ceremony",
            source: "ui:run-awards-ceremony"
        })).toEqual(["awards.completed"]);
        expect(orchestrator.telemetry()).toMatchObject({
            reputation: reputationBeforeAward + 5,
            hospitalAwardTotalCashReward: 5000,
            hospitalAwardTotalReputationReward: 5
        });
        const snapshot = orchestrator.createPersistenceSnapshot();
        expect(snapshot.commandLog).toContainEqual({ type: "shoot-rat", hit: false });
        expect(snapshot.commandLog).toContainEqual({ type: "shoot-rat" });
        expect(AppOrchestrator.fromPersistenceSnapshot(snapshot).telemetry()).toEqual(orchestrator.telemetry());
    });
    it("uses imported plant award criteria for plant watering trophies", () => {
        const orchestrator = new AppOrchestrator({
            seed: 10936,
            awardCriteria: { plant: 80, plantBonus: 5 }
        });
        expect(orchestrator.telemetry()).toMatchObject({
            plantWaterChecks: 0,
            plantsWatered: 0,
            plantWateredPercentage: 0,
            hospitalAwardRewardReputation: 5,
            scenarioAwardCriteriaSummary: "plants watered 80%",
            scenarioAwardCriteriaMet: false,
            scenarioAwardCriteriaUnmetSummary: "plants watered 0/80%"
        });
        expect(orchestrator.dispatch({ device: "ui", action: "water-plant", watered: false, source: "ui:water-plant" })).toEqual(["plant.neglected"]);
        for (let index = 0; index < 4; index += 1) {
            expect(orchestrator.dispatch({ device: "ui", action: "water-plant", source: "ui:water-plant" })).toEqual(["plant.watered"]);
        }
        expect(orchestrator.telemetry()).toMatchObject({
            plantWaterChecks: 5,
            plantsWatered: 4,
            plantWateredPercentage: 80,
            scenarioAwardCriteriaMet: true,
            scenarioAwardCriteriaUnmetSummary: "none"
        });
        const reputationBeforeAward = orchestrator.telemetry().reputation;
        expect(orchestrator.dispatch({
            device: "ui",
            action: "run-awards-ceremony",
            source: "ui:run-awards-ceremony"
        })).toEqual(["awards.completed"]);
        expect(orchestrator.telemetry()).toMatchObject({
            reputation: reputationBeforeAward + 5,
            hospitalAwardTotalReputationReward: 5
        });
        const snapshot = orchestrator.createPersistenceSnapshot();
        expect(snapshot.commandLog).toContainEqual({ type: "water-plant", watered: false });
        expect(snapshot.commandLog).toContainEqual({ type: "water-plant" });
        expect(AppOrchestrator.fromPersistenceSnapshot(snapshot).telemetry()).toEqual(orchestrator.telemetry());
    });
    it("uses imported mayor trophy criteria after at least two VIP inspections", () => {
        const orchestrator = new AppOrchestrator({
            seed: 1094,
            tickRateHz: 4,
            pointerTileSize: 8,
            awardCriteria: { trophyMayor: 0 }
        });
        expect(orchestrator.telemetry()).toMatchObject({
            scenarioAwardCriteriaSummary: "mayor fail <= 0%",
            scenarioAwardCriteriaMet: false,
            scenarioAwardCriteriaUnmetSummary: "mayor visits 0/2"
        });
        expect(orchestrator.dispatch({
            device: "ui",
            action: "run-awards-ceremony",
            source: "ui:run-awards-ceremony"
        })).toEqual(["awards.blocked"]);
        for (let visit = 0; visit < 2; visit += 1) {
            expect(orchestrator.dispatch({
                device: "ui",
                action: "start-vip-inspection",
                source: "ui:start-vip-inspection"
            })).toEqual(["vip.started"]);
            orchestrator.advanceFrame(6_000);
        }
        expect(orchestrator.telemetry()).toMatchObject({
            vipInspectionVisitsStarted: 2,
            vipInspectionPassedVisits: 2,
            vipInspectionFailedVisits: 0,
            scenarioAwardCriteriaMet: true,
            scenarioAwardCriteriaUnmetSummary: "none"
        });
        expect(orchestrator.dispatch({
            device: "ui",
            action: "run-awards-ceremony",
            source: "ui:run-awards-ceremony"
        })).toEqual(["awards.completed"]);
        const snapshot = orchestrator.createPersistenceSnapshot();
        expect(snapshot.awardCriteria).toEqual({ trophyMayor: 0 });
        expect(AppOrchestrator.fromPersistenceSnapshot(snapshot).telemetry()).toEqual(orchestrator.telemetry());
    });
    it("uses imported population percentage award and poor thresholds", () => {
        const orchestrator = new AppOrchestrator({
            seed: 1095,
            tickRateHz: 4,
            pointerTileSize: 8,
            awardCriteria: { populationPercentageAward: 75, populationPercentagePoor: 50 }
        });
        orchestrator.dispatch({ device: "ui", action: "admit-patient", severity: 1, source: "ui:admit" });
        orchestrator.dispatch({ device: "ui", action: "treat-patient", source: "ui:treat" });
        orchestrator.dispatch({ device: "ui", action: "admit-patient", severity: 1, source: "ui:admit" });
        orchestrator.dispatch({ device: "ui", action: "admit-patient", severity: 1, source: "ui:admit" });
        expect(orchestrator.telemetry()).toMatchObject({
            levelObjectiveCurrentTreatmentPercentage: 33,
            scenarioAwardCriteriaSummary: "treated 75%",
            scenarioAwardCriteriaMet: false,
            scenarioAwardCriteriaUnmetSummary: "treated 33/75%",
            scenarioAwardPoorCriteriaTriggered: true,
            scenarioAwardPoorCriteriaTriggeredSummary: "treated 33/50%"
        });
        expect(orchestrator.dispatch({
            device: "ui",
            action: "run-awards-ceremony",
            source: "ui:run-awards-ceremony"
        })).toEqual(["awards.blocked"]);
        orchestrator.dispatch({ device: "ui", action: "treat-patient", source: "ui:treat" });
        orchestrator.dispatch({ device: "ui", action: "treat-patient", source: "ui:treat" });
        expect(orchestrator.telemetry()).toMatchObject({
            levelObjectiveCurrentTreatmentPercentage: 100,
            scenarioAwardCriteriaMet: true,
            scenarioAwardCriteriaUnmetSummary: "none",
            scenarioAwardPoorCriteriaTriggered: false,
            scenarioAwardPoorCriteriaTriggeredSummary: "none"
        });
        expect(orchestrator.dispatch({
            device: "ui",
            action: "run-awards-ceremony",
            source: "ui:run-awards-ceremony"
        })).toEqual(["awards.completed"]);
        const snapshot = orchestrator.createPersistenceSnapshot();
        expect(snapshot.awardCriteria).toEqual({ populationPercentageAward: 75, populationPercentagePoor: 50 });
        expect(AppOrchestrator.fromPersistenceSnapshot(snapshot).telemetry()).toEqual(orchestrator.telemetry());
    });
    it("uses imported cures-versus-deaths award ratio", () => {
        const orchestrator = new AppOrchestrator({
            seed: 1096,
            tickRateHz: 4,
            pointerTileSize: 8,
            awardCriteria: { curesVDeathsAward: 2 }
        });
        expect(orchestrator.telemetry()).toMatchObject({
            scenarioAwardCriteriaSummary: "cures/deaths 2",
            scenarioAwardCriteriaMet: false,
            scenarioAwardCriteriaUnmetSummary: "cures/deaths 0/2"
        });
        expect(orchestrator.dispatch({
            device: "ui",
            action: "run-awards-ceremony",
            source: "ui:run-awards-ceremony"
        })).toEqual(["awards.blocked"]);
        for (let index = 0; index < 2; index += 1) {
            orchestrator.dispatch({ device: "ui", action: "admit-patient", severity: 1, source: "ui:admit" });
            orchestrator.dispatch({ device: "ui", action: "treat-patient", source: "ui:treat" });
        }
        expect(orchestrator.telemetry()).toMatchObject({
            dischargedPatients: 2,
            patientDeaths: 0,
            scenarioAwardCriteriaMet: true,
            scenarioAwardCriteriaUnmetSummary: "none"
        });
        expect(orchestrator.dispatch({
            device: "ui",
            action: "run-awards-ceremony",
            source: "ui:run-awards-ceremony"
        })).toEqual(["awards.completed"]);
        const snapshot = orchestrator.createPersistenceSnapshot();
        expect(snapshot.awardCriteria).toEqual({ curesVDeathsAward: 2 });
        expect(AppOrchestrator.fromPersistenceSnapshot(snapshot).telemetry()).toEqual(orchestrator.telemetry());
    });
    it("applies imported cures-versus-deaths poor award penalties", () => {
        const orchestrator = new AppOrchestrator({
            seed: 1097,
            tickRateHz: 4,
            pointerTileSize: 8,
            awardCriteria: { curesAward: 0, reputationAward: 450, hospValueAward: 1000, curesVDeathsAward: 0, curesVDeathsPoor: 2, curesVDeathsPenalty: -300 }
        });
        expect(orchestrator.telemetry()).toMatchObject({
            scenarioAwardCriteriaMet: true,
            scenarioAwardPoorCriteriaTriggered: true,
            scenarioAwardPoorCriteriaTriggeredSummary: "cures/deaths 0/2"
        });
        const cashBeforeAward = orchestrator.telemetry().cash;
        expect(orchestrator.dispatch({
            device: "ui",
            action: "run-awards-ceremony",
            source: "ui:run-awards-ceremony"
        })).toEqual(["awards.penalty-applied"]);
        expect(orchestrator.telemetry()).toMatchObject({
            cash: cashBeforeAward - 300,
            hospitalAwardTotalCashReward: -300,
            lastEventType: "hospital-award-penalty"
        });
    });
    it("uses imported staff happiness trophy criteria from staff stress", () => {
        const orchestrator = new AppOrchestrator({
            seed: 1097,
            tickRateHz: 4,
            pointerTileSize: 8,
            staffFatigueSettings: { crackUpTired: 10000, recoveryMinimum: 3, modifyFrequency: 1, workLight: 10 },
            awardCriteria: { trophyStaffHappiness: 100 }
        });
        expect(orchestrator.telemetry()).toMatchObject({
            staffHappinessPercent: 100,
            scenarioAwardCriteriaSummary: "staff happy 100%",
            scenarioAwardCriteriaMet: true,
            scenarioAwardCriteriaUnmetSummary: "none"
        });
        orchestrator.dispatch({ device: "ui", action: "pause-toggle", source: "ui:pause-toggle" });
        for (let index = 0; index < 4; index += 1) {
            orchestrator.dispatch({ device: "ui", action: "admit-patient", severity: 3, source: "ui:admit", pointer: { x: 16, y: 16 } });
        }
        orchestrator.dispatch({ device: "ui", action: "step-tick", source: "ui:step" });
        expect(orchestrator.telemetry()).toMatchObject({
            scenarioAwardCriteriaMet: false
        });
        expect(orchestrator.telemetry().staffHappinessPercent).toBeLessThan(100);
        expect(orchestrator.telemetry().scenarioAwardCriteriaUnmetSummary).toContain("staff happy");
        expect(orchestrator.dispatch({
            device: "ui",
            action: "run-awards-ceremony",
            source: "ui:run-awards-ceremony"
        })).toEqual(["awards.blocked"]);
        const snapshot = orchestrator.createPersistenceSnapshot();
        expect(snapshot.awardCriteria).toEqual({ trophyStaffHappiness: 100 });
        expect(AppOrchestrator.fromPersistenceSnapshot(snapshot).telemetry()).toEqual(orchestrator.telemetry());
    });
    it("uses imported staff happiness award and poor thresholds from staff stress", () => {
        const stressed = new AppOrchestrator({
            seed: 10971,
            tickRateHz: 4,
            pointerTileSize: 8,
            staffFatigueSettings: { crackUpTired: 10000, recoveryMinimum: 3, modifyFrequency: 1, workLight: 10 },
            awardCriteria: { staffHappinessAward: 75, staffHappinessPoor: 50, awardStaffHappinessBonus: 4 }
        });
        expect(stressed.telemetry()).toMatchObject({
            staffHappinessPercent: 100,
            hospitalAwardRewardReputation: 4,
            scenarioAwardCriteriaSummary: "staff award happy 75%",
            scenarioAwardCriteriaMet: true,
            scenarioAwardCriteriaUnmetSummary: "none",
            scenarioAwardPoorCriteriaSummary: "staff happy below 50%",
            scenarioAwardPoorCriteriaTriggered: false
        });
        stressed.dispatch({ device: "ui", action: "pause-toggle", source: "ui:pause-toggle" });
        for (let index = 0; index < 48; index += 1) {
            stressed.dispatch({ device: "ui", action: "admit-patient", severity: 1, source: "ui:admit", pointer: { x: 16, y: 16 } });
            stressed.dispatch({ device: "ui", action: "step-tick", source: "ui:step" });
        }
        expect(stressed.telemetry().staffHappinessPercent).toBeLessThan(50);
        expect(stressed.telemetry()).toMatchObject({
            scenarioAwardCriteriaMet: false,
            scenarioAwardPoorCriteriaTriggered: true
        });
        expect(stressed.telemetry().scenarioAwardCriteriaUnmetSummary).toContain("staff award happy");
        expect(stressed.telemetry().scenarioAwardPoorCriteriaTriggeredSummary).toContain("staff happy");
        expect(stressed.dispatch({
            device: "ui",
            action: "run-awards-ceremony",
            source: "ui:run-awards-ceremony"
        })).toEqual(["awards.blocked"]);
        const happy = new AppOrchestrator({
            seed: 10972,
            tickRateHz: 4,
            pointerTileSize: 8,
            awardCriteria: { staffHappinessAward: 75, staffHappinessPoor: 50, awardStaffHappinessBonus: 4 }
        });
        const reputationBeforeAward = happy.telemetry().reputation;
        expect(happy.dispatch({
            device: "ui",
            action: "run-awards-ceremony",
            source: "ui:run-awards-ceremony"
        })).toEqual(["awards.completed"]);
        expect(happy.telemetry()).toMatchObject({
            reputation: reputationBeforeAward + 4,
            hospitalAwardTotalReputationReward: 4
        });
        const snapshot = stressed.createPersistenceSnapshot();
        expect(snapshot.awardCriteria).toEqual({ staffHappinessAward: 75, staffHappinessPoor: 50, awardStaffHappinessBonus: 4 });
        expect(AppOrchestrator.fromPersistenceSnapshot(snapshot).telemetry()).toEqual(stressed.telemetry());
    });
    it("uses imported award bonus payouts for scenario trophy ceremonies", () => {
        const orchestrator = new AppOrchestrator({
            seed: 1098,
            tickRateHz: 4,
            pointerTileSize: 8,
            awardCriteria: {
                reputation: 500,
                trophyReputationBonus: 2000,
                trophyStaffHappiness: 100,
                trophyStaffHappinessBonus: 5
            }
        });
        expect(orchestrator.telemetry()).toMatchObject({
            cash: 50000,
            reputation: 500,
            hospitalAwardRewardCash: 2000,
            hospitalAwardRewardReputation: 5,
            scenarioAwardCriteriaSummary: "trophy reputation 500, staff happy 100%",
            scenarioAwardCriteriaMet: true,
            scenarioAwardCriteriaUnmetSummary: "none"
        });
        expect(orchestrator.dispatch({
            device: "ui",
            action: "run-awards-ceremony",
            source: "ui:run-awards-ceremony"
        })).toEqual(["awards.completed"]);
        expect(orchestrator.telemetry()).toMatchObject({
            cash: 52000,
            reputation: 505,
            hospitalAwardCeremoniesRun: 1,
            hospitalAwardTotalCashReward: 2000,
            hospitalAwardTotalReputationReward: 5,
            lastEventType: "hospital-award-granted"
        });
        const snapshot = orchestrator.createPersistenceSnapshot();
        expect(snapshot.awardCriteria).toEqual({
            reputation: 500,
            trophyReputationBonus: 2000,
            trophyStaffHappiness: 100,
            trophyStaffHappinessBonus: 5
        });
        expect(AppOrchestrator.fromPersistenceSnapshot(snapshot).telemetry()).toEqual(orchestrator.telemetry());
    });
    it("uses imported cleanliness award and poor thresholds from current litter", () => {
        const dirty = new AppOrchestrator({
            seed: 1099,
            tickRateHz: 4,
            pointerTileSize: 8,
            patientBehaviorSettings: { litterDrop: 1 },
            awardCriteria: { cleanlinessAward: 5, cleanlinessPoor: 40, cleanlinessBonus: 6 }
        });
        dirty.dispatch({ device: "ui", action: "pause-toggle", source: "ui:pause-toggle" });
        for (let index = 0; index < 4; index += 1) {
            dirty.dispatch({ device: "ui", action: "admit-patient", severity: 1, source: "ui:admit" });
        }
        dirty.dispatch({ device: "ui", action: "step-tick", source: "ui:step" });
        expect(dirty.telemetry()).toMatchObject({
            currentPatientLitter: 4,
            cleanlinessLitterPercent: 100,
            scenarioAwardCriteriaSummary: "litter <= 5%",
            scenarioAwardCriteriaMet: false,
            scenarioAwardCriteriaUnmetSummary: "litter 100/5%",
            scenarioAwardPoorCriteriaSummary: "litter above 40%",
            scenarioAwardPoorCriteriaTriggered: true,
            scenarioAwardPoorCriteriaTriggeredSummary: "litter 100/40%"
        });
        expect(dirty.dispatch({
            device: "ui",
            action: "run-awards-ceremony",
            source: "ui:run-awards-ceremony"
        })).toEqual(["awards.blocked"]);
        const clean = new AppOrchestrator({
            seed: 1100,
            tickRateHz: 4,
            pointerTileSize: 8,
            patientBehaviorSettings: { litterDrop: 1 },
            eventSettings: { removeRatHoleChance: 10000 },
            awardCriteria: { cleanlinessAward: 5, cleanlinessPoor: 40, cleanlinessBonus: 6 }
        });
        clean.dispatch({ device: "ui", action: "pause-toggle", source: "ui:pause-toggle" });
        expect(clean.dispatch({ device: "ui", action: "hire-staff", role: "handyman", source: "ui:hire-handyman" })).toEqual(["staff.hired"]);
        for (let index = 0; index < 4; index += 1) {
            clean.dispatch({ device: "ui", action: "admit-patient", severity: 1, source: "ui:admit" });
        }
        clean.dispatch({ device: "ui", action: "step-tick", source: "ui:step" });
        clean.dispatch({ device: "ui", action: "step-tick", source: "ui:step" });
        clean.dispatch({ device: "ui", action: "step-tick", source: "ui:step" });
        expect(clean.telemetry()).toMatchObject({
            currentPatientLitter: 0,
            cleanlinessLitterPercent: 0,
            hospitalAwardRewardReputation: 6,
            scenarioAwardCriteriaMet: true,
            scenarioAwardCriteriaUnmetSummary: "none",
            scenarioAwardPoorCriteriaTriggered: false,
            scenarioAwardPoorCriteriaTriggeredSummary: "none"
        });
        expect(clean.telemetry().patientLitterCleaned).toBeGreaterThanOrEqual(4);
        const reputationBeforeAward = clean.telemetry().reputation;
        expect(clean.dispatch({
            device: "ui",
            action: "run-awards-ceremony",
            source: "ui:run-awards-ceremony"
        })).toEqual(["awards.completed"]);
        expect(clean.telemetry()).toMatchObject({
            reputation: reputationBeforeAward + 6,
            hospitalAwardTotalReputationReward: 6
        });
        const snapshot = clean.createPersistenceSnapshot();
        expect(snapshot.awardCriteria).toEqual({ cleanlinessAward: 5, cleanlinessPoor: 40, cleanlinessBonus: 6 });
        expect(AppOrchestrator.fromPersistenceSnapshot(snapshot).telemetry()).toEqual(clean.telemetry());
    });
    it("uses imported peep happiness award and poor thresholds from patient mood", () => {
        const orchestrator = new AppOrchestrator({
            seed: 1101,
            tickRateHz: 4,
            pointerTileSize: 8,
            awardCriteria: { peepHappinessAward: 75, peepHappinessPoor: 25, peepHappinessBonus: 4 }
        });
        expect(orchestrator.telemetry()).toMatchObject({
            peepHappinessPercent: 100,
            hospitalAwardRewardReputation: 4,
            scenarioAwardCriteriaSummary: "peep happy 75%",
            scenarioAwardCriteriaMet: true,
            scenarioAwardCriteriaUnmetSummary: "none",
            scenarioAwardPoorCriteriaSummary: "peep happy below 25%",
            scenarioAwardPoorCriteriaTriggered: false,
            scenarioAwardPoorCriteriaTriggeredSummary: "none"
        });
        orchestrator.dispatch({ device: "ui", action: "pause-toggle", source: "ui:pause-toggle" });
        orchestrator.dispatch({ device: "ui", action: "staff-break-toggle", source: "ui:staff-break-toggle" });
        orchestrator.dispatch({ device: "ui", action: "admit-patient", severity: 3, source: "ui:admit" });
        for (let index = 0; index < 46; index += 1) {
            orchestrator.dispatch({ device: "ui", action: "step-tick", source: "ui:step" });
        }
        expect(orchestrator.telemetry().peepHappinessPercent).toBeLessThan(25);
        expect(orchestrator.telemetry()).toMatchObject({
            scenarioAwardCriteriaMet: false,
            scenarioAwardPoorCriteriaTriggered: true
        });
        expect(orchestrator.telemetry().scenarioAwardCriteriaUnmetSummary).toContain("peep happy");
        expect(orchestrator.telemetry().scenarioAwardPoorCriteriaTriggeredSummary).toContain("peep happy");
        expect(orchestrator.dispatch({
            device: "ui",
            action: "run-awards-ceremony",
            source: "ui:run-awards-ceremony"
        })).toEqual(["awards.blocked"]);
        const happy = new AppOrchestrator({
            seed: 1102,
            tickRateHz: 4,
            pointerTileSize: 8,
            awardCriteria: { peepHappinessAward: 75, peepHappinessPoor: 25, peepHappinessBonus: 4 }
        });
        const reputationBeforeAward = happy.telemetry().reputation;
        expect(happy.dispatch({
            device: "ui",
            action: "run-awards-ceremony",
            source: "ui:run-awards-ceremony"
        })).toEqual(["awards.completed"]);
        expect(happy.telemetry()).toMatchObject({
            reputation: reputationBeforeAward + 4,
            hospitalAwardTotalReputationReward: 4
        });
        const snapshot = orchestrator.createPersistenceSnapshot();
        expect(snapshot.awardCriteria).toEqual({ peepHappinessAward: 75, peepHappinessPoor: 25, peepHappinessBonus: 4 });
        expect(AppOrchestrator.fromPersistenceSnapshot(snapshot).telemetry()).toEqual(orchestrator.telemetry());
    });
    it("uses imported waiting times thresholds from patient walkouts", () => {
        const waiting = new AppOrchestrator({
            seed: 1103,
            tickRateHz: 4,
            pointerTileSize: 8,
            patientBehaviorSettings: { leaveMax: 3 },
            awardCriteria: { waitingTimesAward: 25, waitingTimesPoor: 75, waitingTimesBonus: 2 }
        });
        expect(waiting.telemetry()).toMatchObject({
            waitingTimesWalkoutPercent: 0,
            hospitalAwardRewardReputation: 2,
            scenarioAwardCriteriaSummary: "walkouts <= 25%",
            scenarioAwardCriteriaMet: true,
            scenarioAwardPoorCriteriaSummary: "walkouts above 75%",
            scenarioAwardPoorCriteriaTriggered: false
        });
        waiting.dispatch({ device: "ui", action: "pause-toggle", source: "ui:pause-toggle" });
        waiting.dispatch({ device: "ui", action: "staff-break-toggle", source: "ui:staff-break-toggle" });
        waiting.dispatch({ device: "ui", action: "admit-patient", severity: 3, source: "ui:admit" });
        for (let index = 0; index < 3; index += 1) {
            waiting.dispatch({ device: "ui", action: "step-tick", source: "ui:step" });
        }
        expect(waiting.telemetry()).toMatchObject({
            patientsWaiting: 0,
            patientWalkouts: 1,
            waitingTimesWalkoutPercent: 100,
            scenarioAwardCriteriaMet: false,
            scenarioAwardCriteriaUnmetSummary: "walkouts 100/25%",
            scenarioAwardPoorCriteriaTriggered: true,
            scenarioAwardPoorCriteriaTriggeredSummary: "walkouts 100/75%"
        });
        expect(waiting.dispatch({
            device: "ui",
            action: "run-awards-ceremony",
            source: "ui:run-awards-ceremony"
        })).toEqual(["awards.blocked"]);
        const fast = new AppOrchestrator({
            seed: 1104,
            tickRateHz: 4,
            pointerTileSize: 8,
            awardCriteria: { waitingTimesAward: 25, waitingTimesPoor: 75, waitingTimesBonus: 2 }
        });
        const reputationBeforeAward = fast.telemetry().reputation;
        expect(fast.dispatch({
            device: "ui",
            action: "run-awards-ceremony",
            source: "ui:run-awards-ceremony"
        })).toEqual(["awards.completed"]);
        expect(fast.telemetry()).toMatchObject({
            reputation: reputationBeforeAward + 2,
            hospitalAwardTotalReputationReward: 2
        });
        const snapshot = waiting.createPersistenceSnapshot();
        expect(snapshot.awardCriteria).toEqual({ waitingTimesAward: 25, waitingTimesPoor: 75, waitingTimesBonus: 2 });
        expect(AppOrchestrator.fromPersistenceSnapshot(snapshot).telemetry()).toEqual(waiting.telemetry());
    });
    it("uses imported emergency award thresholds after two emergency waves", () => {
        const mixed = new AppOrchestrator({
            seed: 1105,
            tickRateHz: 4,
            pointerTileSize: 8,
            awardCriteria: { emergencyAward: 90, emergencyPoor: 75, emergencyBonus: 7 }
        });
        expect(mixed.telemetry()).toMatchObject({
            emergencySuccessPercent: 100,
            hospitalAwardRewardReputation: 7,
            scenarioAwardCriteriaSummary: "emergency saved 90%",
            scenarioAwardCriteriaMet: false,
            scenarioAwardCriteriaUnmetSummary: "emergencies 0/2",
            scenarioAwardPoorCriteriaSummary: "emergency saved below 75%",
            scenarioAwardPoorCriteriaTriggered: false
        });
        expect(mixed.dispatch({ device: "ui", action: "start-emergency-wave", source: "ui:start-emergency-wave" })).toEqual(["emergency.started"]);
        for (let index = 0; index < 4; index += 1) {
            mixed.dispatch({ device: "ui", action: "treat-patient", source: "ui:treat" });
        }
        expect(mixed.telemetry()).toMatchObject({
            emergencyWavesStarted: 1,
            emergencySuccessfulWaves: 1,
            scenarioAwardCriteriaMet: false,
            scenarioAwardCriteriaUnmetSummary: "emergencies 1/2"
        });
        expect(mixed.dispatch({ device: "ui", action: "start-emergency-wave", source: "ui:start-emergency-wave" })).toEqual(["emergency.started"]);
        for (let index = 0; index < 4; index += 1) {
            const patientId = mixed.getState().entities.waitingPatients[0].id;
            mixed.dispatch({ device: "ui", action: "send-patient-home", patientId, source: "ui:send-home" });
        }
        expect(mixed.telemetry()).toMatchObject({
            emergencyWavesStarted: 2,
            emergencySuccessfulWaves: 1,
            emergencyFailedWaves: 1,
            emergencySuccessPercent: 50,
            scenarioAwardCriteriaMet: false,
            scenarioAwardCriteriaUnmetSummary: "emergency saved 50/90%",
            scenarioAwardPoorCriteriaTriggered: true,
            scenarioAwardPoorCriteriaTriggeredSummary: "emergency saved 50/75%"
        });
        expect(mixed.dispatch({
            device: "ui",
            action: "run-awards-ceremony",
            source: "ui:run-awards-ceremony"
        })).toEqual(["awards.blocked"]);
        const successful = new AppOrchestrator({
            seed: 1106,
            tickRateHz: 4,
            pointerTileSize: 8,
            awardCriteria: { emergencyAward: 90, emergencyPoor: 75, emergencyBonus: 7 }
        });
        expect(successful.dispatch({ device: "ui", action: "start-emergency-wave", source: "ui:start-emergency-wave" })).toEqual(["emergency.started"]);
        for (let index = 0; index < 4; index += 1) {
            successful.dispatch({ device: "ui", action: "treat-patient", source: "ui:treat" });
        }
        expect(successful.dispatch({ device: "ui", action: "start-emergency-wave", source: "ui:start-emergency-wave" })).toEqual(["emergency.started"]);
        for (let index = 0; index < 4; index += 1) {
            successful.dispatch({ device: "ui", action: "treat-patient", source: "ui:treat" });
        }
        expect(successful.telemetry()).toMatchObject({
            emergencyWavesStarted: 2,
            emergencySuccessfulWaves: 2,
            emergencySuccessPercent: 100,
            scenarioAwardCriteriaMet: true,
            scenarioAwardCriteriaUnmetSummary: "none",
            scenarioAwardPoorCriteriaTriggered: false,
            scenarioAwardPoorCriteriaTriggeredSummary: "none"
        });
        const reputationBeforeAward = successful.telemetry().reputation;
        expect(successful.dispatch({
            device: "ui",
            action: "run-awards-ceremony",
            source: "ui:run-awards-ceremony"
        })).toEqual(["awards.completed"]);
        expect(successful.telemetry()).toMatchObject({
            reputation: reputationBeforeAward + 7,
            hospitalAwardTotalReputationReward: 7
        });
        const snapshot = mixed.createPersistenceSnapshot();
        expect(snapshot.awardCriteria).toEqual({ emergencyAward: 90, emergencyPoor: 75, emergencyBonus: 7 });
        expect(AppOrchestrator.fromPersistenceSnapshot(snapshot).telemetry()).toEqual(mixed.telemetry());
    });
    it("uses imported well-kept tech thresholds from worn and maintained rooms", () => {
        const worn = new AppOrchestrator({
            seed: 1107,
            tickRateHz: 4,
            pointerTileSize: 8,
            awardCriteria: { wellKeptTechAward: 20, wellKeptTechPoor: 70, wellKeptTechBonus: 7 }
        });
        expect(worn.telemetry()).toMatchObject({
            wornRoomPercent: 0,
            hospitalAwardRewardReputation: 7,
            scenarioAwardCriteriaSummary: "worn tech <= 20%",
            scenarioAwardCriteriaMet: true,
            scenarioAwardCriteriaUnmetSummary: "none",
            scenarioAwardPoorCriteriaSummary: "worn tech above 70%",
            scenarioAwardPoorCriteriaTriggered: false
        });
        worn.executeCommand({ type: "apply-earthquake", severity: 99, quakeIndex: 0 });
        expect(worn.telemetry()).toMatchObject({
            wornRoomPercent: 100,
            roomsInMaintenance: 2,
            scenarioAwardCriteriaMet: false,
            scenarioAwardCriteriaUnmetSummary: "worn tech 100/20%",
            scenarioAwardPoorCriteriaTriggered: true,
            scenarioAwardPoorCriteriaTriggeredSummary: "worn tech 100/70%"
        });
        expect(worn.dispatch({
            device: "ui",
            action: "run-awards-ceremony",
            source: "ui:run-awards-ceremony"
        })).toEqual(["awards.blocked"]);
        const clean = new AppOrchestrator({
            seed: 1108,
            tickRateHz: 4,
            pointerTileSize: 8,
            awardCriteria: { wellKeptTechAward: 20, wellKeptTechPoor: 70, wellKeptTechBonus: 7 }
        });
        const reputationBeforeAward = clean.telemetry().reputation;
        expect(clean.dispatch({
            device: "ui",
            action: "run-awards-ceremony",
            source: "ui:run-awards-ceremony"
        })).toEqual(["awards.completed"]);
        expect(clean.telemetry()).toMatchObject({
            reputation: reputationBeforeAward + 7,
            hospitalAwardTotalReputationReward: 7
        });
        const snapshot = worn.createPersistenceSnapshot();
        expect(snapshot.awardCriteria).toEqual({ wellKeptTechAward: 20, wellKeptTechPoor: 70, wellKeptTechBonus: 7 });
        expect(AppOrchestrator.fromPersistenceSnapshot(snapshot).telemetry()).toEqual(worn.telemetry());
    });
    it("uses imported new tech award thresholds from completed research investment", () => {
        const researched = new AppOrchestrator({
            seed: 1109,
            tickRateHz: 4,
            pointerTileSize: 8,
            researchSettings: { startCost: 1000 },
            awardCriteria: { newTechAward: 2000, newTechPoor: 1500, researchBonus: 5 }
        });
        expect(researched.telemetry()).toMatchObject({
            treatmentResearchTotalInvestment: 0,
            hospitalAwardRewardReputation: 5,
            scenarioAwardCriteriaSummary: "research spend 2000",
            scenarioAwardCriteriaMet: false,
            scenarioAwardCriteriaUnmetSummary: "research spend 0/2000",
            scenarioAwardPoorCriteriaSummary: "research spend below 1500",
            scenarioAwardPoorCriteriaTriggered: true,
            scenarioAwardPoorCriteriaTriggeredSummary: "research spend 0/1500"
        });
        expect(researched.dispatch({
            device: "ui",
            action: "run-awards-ceremony",
            source: "ui:run-awards-ceremony"
        })).toEqual(["awards.blocked"]);
        expect(researched.dispatch({ device: "ui", action: "start-research", source: "ui:start-research" })).toEqual(["research.started"]);
        for (let index = 0; index < 6; index += 1) {
            researched.advanceFrame(250);
        }
        expect(researched.telemetry()).toMatchObject({
            treatmentResearchLevel: 1,
            treatmentResearchTotalInvestment: 1000,
            scenarioAwardCriteriaMet: false,
            scenarioAwardPoorCriteriaTriggered: true
        });
        expect(researched.dispatch({ device: "ui", action: "start-research", source: "ui:start-research" })).toEqual(["research.started"]);
        for (let index = 0; index < 6; index += 1) {
            researched.advanceFrame(250);
        }
        expect(researched.telemetry()).toMatchObject({
            treatmentResearchLevel: 2,
            treatmentResearchTotalInvestment: 2000,
            scenarioAwardCriteriaMet: true,
            scenarioAwardCriteriaUnmetSummary: "none",
            scenarioAwardPoorCriteriaTriggered: false,
            scenarioAwardPoorCriteriaTriggeredSummary: "none"
        });
        const reputationBeforeAward = researched.telemetry().reputation;
        expect(researched.dispatch({
            device: "ui",
            action: "run-awards-ceremony",
            source: "ui:run-awards-ceremony"
        })).toEqual(["awards.completed"]);
        expect(researched.telemetry()).toMatchObject({
            reputation: reputationBeforeAward + 5,
            hospitalAwardTotalReputationReward: 5
        });
        const snapshot = researched.createPersistenceSnapshot();
        expect(snapshot.awardCriteria).toEqual({ newTechAward: 2000, newTechPoor: 1500, researchBonus: 5 });
        expect(AppOrchestrator.fromPersistenceSnapshot(snapshot).telemetry()).toEqual(researched.telemetry());
    });
    it("routes treatment research through deterministic command history and restore", () => {
        const orchestrator = new AppOrchestrator({ seed: 105, tickRateHz: 4, pointerTileSize: 8 });
        expect(orchestrator.telemetry()).toMatchObject({
            treatmentResearchLevel: 0,
            treatmentResearchMaxLevel: 3,
            treatmentResearchActive: false,
            treatmentResearchProjectCost: 1_500,
            treatmentResearchProjectTicks: 6,
            treatmentResearchSuccessBonus: 0
        });
        expect(orchestrator.dispatch({
            device: "ui",
            action: "start-research",
            source: "ui:start-research"
        })).toEqual(["research.started"]);
        expect(orchestrator.telemetry()).toMatchObject({
            cash: 48_500,
            treatmentResearchActive: true,
            treatmentResearchRemainingTicks: 6
        });
        for (let index = 0; index < 6; index += 1) {
            orchestrator.advanceFrame(250);
        }
        expect(orchestrator.telemetry()).toMatchObject({
            treatmentResearchLevel: 1,
            treatmentResearchActive: false,
            treatmentResearchRemainingTicks: 0,
            treatmentResearchSuccessBonus: 20,
            lastEventType: "research-completed"
        });
        const snapshot = orchestrator.createPersistenceSnapshot();
        expect(snapshot.commandLog).toContainEqual({ type: "start-research" });
        expect(AppOrchestrator.fromPersistenceSnapshot(snapshot).telemetry()).toEqual(orchestrator.telemetry());
    });
    it("uses imported scenario research settings for project duration telemetry and restore", () => {
        const orchestrator = new AppOrchestrator({
            seed: 106,
            tickRateHz: 4,
            pointerTileSize: 8,
            researchSettings: { startRating: 95, researchPointsDivisor: 4, startCost: 100, minDrugCost: 50, drugImproveRate: 5, maxObjectStrength: 20, researchIncrement: 2, researchImproveCostPercent: 10, researchImproveIncrementPercent: 10 },
            expertise: [
                { index: 5, startPrice: 1400, known: true, researchRequired: 10000, maxDiagDifficulty: 1, token: "INVIS", diseaseId: "itchy-feet", severity: 1 },
                { index: 16, known: false, researchRequired: 10000, maxDiagDifficulty: 100, token: "UNCOMMON_COLD", diseaseId: "mild-cold", severity: 1 }
            ],
            scenarioOpponents: [
                { index: 0, skill: 3, staffLevels: 4, luck: 3, speed: 30, comfort: 7, guessAt: 90, playing: true, name: "ORAC" },
                { index: 1, skill: 2, staffLevels: 5, luck: 2, speed: 50, comfort: 5, guessAt: 75, playing: false, name: "COLOSSUS" }
            ]
        });
        expect(orchestrator.telemetry()).toMatchObject({
            treatmentResearchProjectCost: 100,
            treatmentResearchProjectTicks: 24,
            treatmentResearchSuccessBonus: 25,
            scenarioResearchStartRating: 95,
            scenarioResearchPointsDivisor: 4,
            scenarioResearchStartCost: 100,
            scenarioResearchMinDrugCost: 50,
            scenarioResearchDrugImproveRate: 5,
            scenarioResearchMaxObjectStrength: 20,
            scenarioResearchIncrement: 2,
            scenarioResearchImproveCostPercent: 10,
            scenarioResearchImproveIncrementPercent: 10,
            scenarioExpertiseCount: 2,
            scenarioKnownExpertiseCount: 1,
            scenarioResearchRequiredExpertiseCount: 1,
            scenarioNextResearchRequired: 10000,
            scenarioNextResearchToken: "UNCOMMON_COLD",
            scenarioNextResearchDiseaseId: "mild-cold",
            scenarioTreatmentPriceOverrideCount: 1,
            scenarioOpponentCount: 2,
            scenarioActiveOpponentCount: 1,
            scenarioOpponentNames: "ORAC",
            scenarioOpponentLeaderName: "ORAC",
            scenarioOpponentLeaderCures: 0,
            scenarioOpponentLeaderValue: 1700,
            scenarioOpponentLeaderReputation: 360
        });
        expect(orchestrator.dispatch({
            device: "ui",
            action: "start-research",
            source: "ui:start-research"
        })).toEqual(["research.started"]);
        expect(orchestrator.telemetry()).toMatchObject({
            cash: 49_900,
            treatmentResearchActive: true,
            treatmentResearchRemainingTicks: 24
        });
        for (let index = 0; index < 23; index += 1) {
            orchestrator.advanceFrame(250);
        }
        expect(orchestrator.telemetry()).toMatchObject({
            treatmentResearchActive: true,
            treatmentResearchLevel: 0,
            treatmentResearchRemainingTicks: 1
        });
        orchestrator.advanceFrame(250);
        expect(orchestrator.telemetry()).toMatchObject({
            treatmentResearchActive: false,
            treatmentResearchLevel: 2,
            treatmentResearchProjectCost: 120,
            treatmentResearchSuccessBonus: 35,
            scenarioKnownExpertiseCount: 2,
            scenarioResearchRequiredExpertiseCount: 0
        });
        const snapshot = orchestrator.createPersistenceSnapshot();
        expect(snapshot.researchSettings).toEqual({ startRating: 95, researchPointsDivisor: 4, startCost: 100, minDrugCost: 50, drugImproveRate: 5, maxObjectStrength: 20, researchIncrement: 2, researchImproveCostPercent: 10, researchImproveIncrementPercent: 10 });
        expect(snapshot.expertise).toEqual([
            { index: 5, known: true, researchRequired: 10000, token: "INVIS", startPrice: 1400, maxDiagDifficulty: 1, diseaseId: "itchy-feet", severity: 1 },
            { index: 16, known: false, researchRequired: 10000, maxDiagDifficulty: 100, token: "UNCOMMON_COLD", diseaseId: "mild-cold", severity: 1 }
        ]);
        expect(snapshot.scenarioOpponents).toEqual([
            { index: 0, skill: 3, staffLevels: 4, luck: 3, speed: 30, comfort: 7, guessAt: 90, playing: true, name: "ORAC" },
            { index: 1, skill: 2, staffLevels: 5, luck: 2, speed: 50, comfort: 5, guessAt: 75, playing: false, name: "COLOSSUS" }
        ]);
        expect(AppOrchestrator.fromPersistenceSnapshot(snapshot).telemetry()).toEqual(orchestrator.telemetry());
    });
    it("uses imported expertise start prices for scenario treatment income", () => {
        const orchestrator = new AppOrchestrator({
            seed: 1062,
            tickRateHz: 4,
            pointerTileSize: 8,
            diseasePool: [{ source: "non_visuals", index: 0, token: "I_UNCOMMON_COLD", diseaseId: "mild-cold", severity: 1, weight: 1 }],
            expertise: [{ index: 16, startPrice: 300, contagiousRate: 0, known: true, researchRequired: 0, maxDiagDifficulty: 100, token: "UNCOMMON_COLD", diseaseId: "mild-cold", severity: 1 }]
        });
        const cashBefore = orchestrator.telemetry().cash;
        expect(orchestrator.telemetry()).toMatchObject({
            scenarioTreatmentPriceOverrideCount: 1
        });
        orchestrator.dispatch({ device: "ui", action: "admit-patient", severity: 1, source: "ui:admit" });
        orchestrator.dispatch({ device: "ui", action: "treat-patient", source: "ui:treat" });
        expect(orchestrator.telemetry()).toMatchObject({
            cash: cashBefore + 300,
            dischargedPatients: 1
        });
    });
    it("uses imported research increment percent when no explicit drug improve rate is set", () => {
        const orchestrator = new AppOrchestrator({
            seed: 107,
            tickRateHz: 4,
            pointerTileSize: 8,
            researchSettings: { startRating: 95, startCost: 100, researchImproveIncrementPercent: 7 }
        });
        orchestrator.dispatch({ device: "ui", action: "start-research", source: "ui:start-research" });
        for (let index = 0; index < 6; index += 1) {
            orchestrator.advanceFrame(250);
        }
        orchestrator.dispatch({ device: "ui", action: "start-research", source: "ui:start-research" });
        for (let index = 0; index < 6; index += 1) {
            orchestrator.advanceFrame(250);
        }
        expect(orchestrator.telemetry()).toMatchObject({
            treatmentResearchLevel: 2,
            treatmentResearchSuccessBonus: 39,
            scenarioResearchImproveIncrementPercent: 7
        });
    });
    it("uses imported minimum drug cost as an app-level research project floor", () => {
        const orchestrator = new AppOrchestrator({
            seed: 1072,
            tickRateHz: 4,
            pointerTileSize: 8,
            researchSettings: { startCost: 40, minDrugCost: 75 }
        });
        expect(orchestrator.telemetry()).toMatchObject({
            treatmentResearchProjectCost: 75,
            scenarioResearchStartCost: 40,
            scenarioResearchMinDrugCost: 75
        });
        expect(orchestrator.dispatch({
            device: "ui",
            action: "start-research",
            source: "ui:start-research"
        })).toEqual(["research.started"]);
        expect(orchestrator.telemetry()).toMatchObject({
            cash: 49_925,
            treatmentResearchActive: true,
            treatmentResearchProjectCost: 75
        });
        const snapshot = orchestrator.createPersistenceSnapshot();
        expect(snapshot.researchSettings).toEqual({ startCost: 40, minDrugCost: 75 });
        expect(AppOrchestrator.fromPersistenceSnapshot(snapshot).telemetry()).toEqual(orchestrator.telemetry());
    });
    it("derives deterministic scenario opponent standings from imported computer metadata", () => {
        const orchestrator = new AppOrchestrator({
            seed: 109,
            tickRateHz: 4,
            pointerTileSize: 8,
            scenarioOpponents: [
                { index: 0, skill: 3, staffLevels: 4, luck: 3, speed: 30, comfort: 7, guessAt: 90, playing: true, name: "ORAC" },
                { index: 1, skill: 4, staffLevels: 5, luck: 2, speed: 50, comfort: 5, guessAt: 75, playing: true, name: "COLOSSUS" },
                { index: 2, skill: 1, staffLevels: 1, luck: 1, speed: 10, comfort: 1, guessAt: 60, playing: false, name: "DORMANT" }
            ]
        });
        expect(orchestrator.telemetry()).toMatchObject({
            scenarioOpponentCount: 3,
            scenarioActiveOpponentCount: 2,
            scenarioOpponentLeaderName: "COLOSSUS",
            scenarioOpponentLeaderCures: 0,
            scenarioOpponentLeaderValue: 1750
        });
        orchestrator.advanceFrame(16_000);
        expect(orchestrator.telemetry()).toMatchObject({
            scenarioOpponentLeaderName: "COLOSSUS",
            scenarioOpponentLeaderCures: 1,
            scenarioOpponentLeaderValue: 2750,
            scenarioOpponentLeaderReputation: 394
        });
        expect(orchestrator.telemetry().scenarioOpponentStandings).toEqual([
            { index: 1, name: "COLOSSUS", cures: 1, value: 2750, reputation: 394 },
            { index: 0, name: "ORAC", cures: 0, value: 1700, reputation: 360 }
        ]);
        const snapshot = orchestrator.createPersistenceSnapshot();
        expect(snapshot.scenarioOpponents).toEqual([
            { index: 0, skill: 3, staffLevels: 4, luck: 3, speed: 30, comfort: 7, guessAt: 90, playing: true, name: "ORAC" },
            { index: 1, skill: 4, staffLevels: 5, luck: 2, speed: 50, comfort: 5, guessAt: 75, playing: true, name: "COLOSSUS" },
            { index: 2, skill: 1, staffLevels: 1, luck: 1, speed: 10, comfort: 1, guessAt: 60, playing: false, name: "DORMANT" }
        ]);
        expect(AppOrchestrator.fromPersistenceSnapshot(snapshot).telemetry()).toEqual(orchestrator.telemetry());
    });
    it("loses the level when an imported rival reaches the scenario objectives first", () => {
        const orchestrator = new AppOrchestrator({
            seed: 110,
            tickRateHz: 4,
            pointerTileSize: 8,
            levelObjective: {
                requiredDischarges: 2,
                minimumCash: 0,
                minimumReputation: 300,
                minimumTreatmentPercentage: 0,
                minimumHospitalValue: 2_000,
                bankruptcyCashThreshold: -20_000,
                reputationFailureThreshold: 0
            },
            scenarioOpponents: [
                { index: 0, skill: 4, staffLevels: 5, luck: 2, speed: 50, comfort: 5, guessAt: 75, playing: true, name: "COLOSSUS" },
                { index: 1, skill: 1, staffLevels: 1, luck: 1, speed: 10, comfort: 1, guessAt: 60, playing: false, name: "DORMANT" }
            ]
        });
        expect(orchestrator.telemetry()).toMatchObject({
            levelObjectiveStatus: "running",
            scenarioOpponentObjectiveLeaderName: ""
        });
        orchestrator.advanceFrame(32_000);
        expect(orchestrator.telemetry()).toMatchObject({
            levelObjectiveStatus: "lost",
            levelObjectiveReason: "rival-objectives",
            scenarioOpponentObjectiveLeaderName: "COLOSSUS",
            scenarioOpponentLeaderCures: 2,
            scenarioOpponentLeaderValue: 3_750
        });
        const snapshot = orchestrator.createPersistenceSnapshot();
        expect(snapshot.runtime.levelOutcome).toEqual({ status: "lost", reason: "rival-objectives" });
        expect(AppOrchestrator.fromPersistenceSnapshot(snapshot).telemetry()).toEqual(orchestrator.telemetry());
    });
    it("does not let imported rivals satisfy objective criteria they do not model", () => {
        const cashObjective = new AppOrchestrator({
            seed: 1101,
            tickRateHz: 4,
            pointerTileSize: 8,
            levelObjective: {
                requiredDischarges: 0,
                minimumCash: 1_000_000,
                minimumReputation: 300,
                minimumTreatmentPercentage: 0,
                minimumHospitalValue: 1_000,
                bankruptcyCashThreshold: -20_000,
                reputationFailureThreshold: 0
            },
            scenarioOpponents: [
                { index: 0, skill: 4, staffLevels: 5, luck: 2, speed: 50, comfort: 5, guessAt: 75, playing: true, name: "COLOSSUS" }
            ]
        });
        cashObjective.advanceFrame(32_000);
        expect(cashObjective.telemetry()).toMatchObject({
            levelObjectiveStatus: "running",
            scenarioOpponentObjectiveLeaderName: ""
        });
        const treatmentObjective = new AppOrchestrator({
            seed: 1102,
            tickRateHz: 4,
            pointerTileSize: 8,
            levelObjective: {
                requiredDischarges: 2,
                minimumCash: 0,
                minimumReputation: 300,
                minimumTreatmentPercentage: 75,
                minimumHospitalValue: 1_000,
                bankruptcyCashThreshold: -20_000,
                reputationFailureThreshold: 0
            },
            scenarioOpponents: [
                { index: 0, skill: 4, staffLevels: 5, luck: 2, speed: 50, comfort: 5, guessAt: 75, playing: true, name: "COLOSSUS" }
            ]
        });
        treatmentObjective.advanceFrame(32_000);
        expect(treatmentObjective.telemetry()).toMatchObject({
            levelObjectiveStatus: "running",
            scenarioOpponentObjectiveLeaderName: ""
        });
    });
    it("holds scenario diseases behind expertise research before automatic admissions", () => {
        const orchestrator = new AppOrchestrator({
            seed: 9030,
            tickRateHz: 4,
            pointerTileSize: 8,
            populationSchedule: [{ index: 0, month: 0, change: 3 }],
            diseasePool: [
                { source: "non_visuals", token: "I_UNCOMMON_COLD", diseaseId: "mild-cold", severity: 1 },
                { source: "non_visuals", token: "I_GUT_ROT", diseaseId: "gut-rot", severity: 3 }
            ],
            expertise: [
                { index: 16, known: false, researchRequired: 10000, token: "UNCOMMON_COLD", diseaseId: "mild-cold", severity: 1 },
                { index: 33, known: true, researchRequired: 10000, token: "GUT_ROT", diseaseId: "gut-rot", severity: 3 }
            ]
        });
        orchestrator.dispatch({ device: "ui", action: "pause-toggle", source: "ui:pause-toggle" });
        orchestrator.dispatch({ device: "ui", action: "admissions-toggle", source: "ui:admissions-toggle" });
        for (let index = 0; index < 16; index += 1) {
            orchestrator.dispatch({ device: "ui", action: "step-tick", source: "ui:step" });
        }
        expect(orchestrator.createPersistenceSnapshot().commandLog
            .filter((command) => command.type === "admit-patient")
            .map((command) => command.diseaseId)).toEqual([
            "gut-rot"
        ]);
        expect(orchestrator.dispatch({
            device: "ui",
            action: "start-research",
            source: "ui:start-research"
        })).toEqual(["research.started"]);
        for (let index = 0; index < 6; index += 1) {
            orchestrator.dispatch({ device: "ui", action: "step-tick", source: "ui:step" });
        }
        expect(orchestrator.telemetry()).toMatchObject({
            treatmentResearchLevel: 1,
            scenarioKnownExpertiseCount: 2,
            scenarioResearchRequiredExpertiseCount: 0
        });
        for (let index = 0; index < 10; index += 1) {
            orchestrator.dispatch({ device: "ui", action: "step-tick", source: "ui:step" });
        }
        for (let index = 0; index < 32; index += 1) {
            orchestrator.dispatch({ device: "ui", action: "step-tick", source: "ui:step" });
        }
        expect(orchestrator.createPersistenceSnapshot().commandLog
            .filter((command) => command.type === "admit-patient")
            .map((command) => command.diseaseId)).toContain("mild-cold");
        const snapshot = orchestrator.createPersistenceSnapshot();
        expect(snapshot.expertise).toEqual([
            { index: 16, known: false, researchRequired: 10000, token: "UNCOMMON_COLD", diseaseId: "mild-cold", severity: 1 },
            { index: 33, known: true, researchRequired: 10000, token: "GUT_ROT", diseaseId: "gut-rot", severity: 3 }
        ]);
        expect(AppOrchestrator.fromPersistenceSnapshot(snapshot).telemetry()).toEqual(orchestrator.telemetry());
    });
    it("routes emergency waves through deterministic command history and restore", () => {
        const orchestrator = new AppOrchestrator({ seed: 106, tickRateHz: 4, pointerTileSize: 8 });
        expect(orchestrator.telemetry()).toMatchObject({
            emergencyActive: false,
            emergencyPatientCount: 4,
            emergencyDurationTicks: 24,
            emergencyRewardCash: 900,
            emergencyRewardReputation: 45,
            emergencyPercentToWin: 100,
            emergencyRequiredTreatedPatients: 4
        });
        expect(orchestrator.dispatch({
            device: "ui",
            action: "start-emergency-wave",
            source: "ui:start-emergency-wave"
        })).toEqual(["emergency.started"]);
        expect(orchestrator.telemetry()).toMatchObject({
            patientsWaiting: 4,
            emergencyActive: true,
            emergencyWaveId: 1,
            emergencyRemainingTicks: 24,
            emergencyTotalPatients: 4,
            emergencyRemainingPatients: 4,
            emergencyRequiredTreatedPatients: 4,
            emergencyWavesStarted: 1,
            lastEventType: "emergency-started"
        });
        expect(orchestrator.dispatch({
            device: "ui",
            action: "start-emergency-wave",
            source: "ui:start-emergency-wave"
        })).toEqual(["emergency.blocked"]);
        for (let index = 0; index < 4; index += 1) {
            orchestrator.dispatch({ device: "ui", action: "treat-patient", source: "ui:treat" });
        }
        expect(orchestrator.telemetry()).toMatchObject({
            emergencyActive: false,
            emergencySuccessfulWaves: 1,
            emergencyFailedWaves: 0,
            lastEventType: "emergency-succeeded"
        });
        const snapshot = orchestrator.createPersistenceSnapshot();
        expect(snapshot.commandLog).toContainEqual({ type: "start-emergency-wave" });
        expect(AppOrchestrator.fromPersistenceSnapshot(snapshot).telemetry()).toEqual(orchestrator.telemetry());
    });
    it("uses imported scenario emergency controls for active emergency waves", () => {
        const orchestrator = new AppOrchestrator({
            seed: 106,
            tickRateHz: 4,
            pointerTileSize: 8,
            emergencySchedule: [
                { index: 0, startMonth: 4, endMonth: 5, minPatients: 2, maxPatients: 4, illnessCode: 16, percentToWin: 75, bonusCash: 400, diseaseId: "mild-cold", severity: 1 }
            ]
        });
        orchestrator.advanceSimulationTicks(4 * 64);
        expect(orchestrator.telemetry()).toMatchObject({
            scenarioEmergencyScheduleSize: 1,
            scenarioEmergencyActiveIndex: 0,
            scenarioEmergencyActiveDiseaseId: "mild-cold",
            scenarioEmergencyActiveIllnessCode: 16,
            emergencyDiseaseId: "mild-cold",
            emergencyPatientCount: 4,
            emergencyRewardCash: 400,
            emergencyPercentToWin: 75,
            emergencyRequiredTreatedPatients: 3
        });
        expect(orchestrator.dispatch({
            device: "ui",
            action: "start-emergency-wave",
            source: "ui:start-emergency-wave"
        })).toEqual(["emergency.started"]);
        expect(orchestrator.telemetry()).toMatchObject({
            patientsWaiting: 4,
            emergencyActive: true,
            emergencyTotalPatients: 4,
            emergencyPatientCount: 4,
            emergencyRewardCash: 400,
            emergencyRewardReputation: 20,
            emergencyPercentToWin: 75,
            emergencyDiseaseId: "mild-cold",
            emergencyRequiredTreatedPatients: 3
        });
        expect(orchestrator.createPersistenceSnapshot().commandLog).toContainEqual({
            type: "start-emergency-wave",
            emergencyIndex: 0
        });
        for (let index = 0; index < 4; index += 1) {
            orchestrator.dispatch({ device: "ui", action: "treat-patient", source: "ui:treat" });
        }
        expect(orchestrator.dispatch({
            device: "ui",
            action: "start-emergency-wave",
            source: "ui:start-emergency-wave"
        })).toEqual(["emergency.blocked"]);
        const snapshot = orchestrator.createPersistenceSnapshot();
        expect(snapshot.emergencySchedule).toEqual([
            { index: 0, startMonth: 4, endMonth: 5, minPatients: 2, maxPatients: 4, illnessCode: 16, percentToWin: 75, bonusCash: 400, diseaseId: "mild-cold", severity: 1 }
        ]);
        expect(AppOrchestrator.fromPersistenceSnapshot(snapshot).telemetry()).toEqual(orchestrator.telemetry());
    });
    it("uses imported disaster launch timing for automatic scenario emergencies", () => {
        const orchestrator = new AppOrchestrator({
            seed: 1061,
            tickRateHz: 4,
            pointerTileSize: 8,
            emergencySchedule: [
                { index: 0, startMonth: 0, endMonth: 1, minPatients: 2, maxPatients: 4, illnessCode: 16, percentToWin: 75, bonusCash: 400, diseaseId: "mild-cold", severity: 1 }
            ],
            eventSettings: { disasterLaunch: 8 }
        });
        orchestrator.advanceSimulationTicks(7);
        expect(orchestrator.telemetry()).toMatchObject({
            emergencyActive: false,
            scenarioDisasterLaunch: 8
        });
        orchestrator.advanceSimulationTicks(1);
        expect(orchestrator.telemetry()).toMatchObject({
            emergencyActive: true,
            emergencyTotalPatients: 3,
            emergencyPatientCount: 3,
            emergencyRewardCash: 400,
            emergencyRewardReputation: 20,
            emergencyPercentToWin: 75,
            emergencyRequiredTreatedPatients: 3,
            lastEventType: "emergency-started"
        });
        for (let index = 0; index < 3; index += 1) {
            orchestrator.dispatch({ device: "ui", action: "treat-patient", source: "ui:treat" });
        }
        orchestrator.advanceSimulationTicks(8);
        expect(orchestrator.telemetry()).toMatchObject({
            emergencyActive: false,
            emergencyWavesStarted: 1
        });
        const snapshot = orchestrator.createPersistenceSnapshot();
        expect(snapshot.commandLog).toContainEqual({ type: "start-emergency-wave", emergencyIndex: 0 });
        expect(AppOrchestrator.fromPersistenceSnapshot(snapshot).telemetry()).toEqual(orchestrator.telemetry());
    });
    it("starts delayed scenario emergencies after disaster launch when their schedule opens", () => {
        const orchestrator = new AppOrchestrator({
            seed: 1061,
            tickRateHz: 4,
            pointerTileSize: 8,
            emergencySchedule: [
                { index: 0, startMonth: 4, endMonth: 5, minPatients: 2, maxPatients: 4, illnessCode: 16, percentToWin: 75, bonusCash: 400, diseaseId: "mild-cold", severity: 1 }
            ],
            eventSettings: { disasterLaunch: 200 }
        });
        orchestrator.advanceSimulationTicks(255);
        expect(orchestrator.telemetry()).toMatchObject({
            emergencyActive: false,
            scenarioEmergencyActiveIndex: null,
            scenarioNextEmergencyIndex: 0,
            scenarioNextEmergencyDiseaseId: "mild-cold",
            scenarioNextEmergencyIllnessCode: 16,
            scenarioDisasterLaunch: 200
        });
        orchestrator.advanceSimulationTicks(1);
        expect(orchestrator.telemetry()).toMatchObject({
            emergencyActive: true,
            scenarioEmergencyActiveIndex: null,
            emergencyTotalPatients: 2,
            emergencyRewardCash: 400,
            emergencyPercentToWin: 75,
            emergencyRequiredTreatedPatients: 2,
            lastEventType: "emergency-started"
        });
        expect(orchestrator.createPersistenceSnapshot().commandLog).toContainEqual({
            type: "start-emergency-wave",
            emergencyIndex: 0
        });
    });
    it("uses imported object availability to gate scenario emergency diseases", () => {
        const orchestrator = new AppOrchestrator({
            seed: 10611,
            tickRateHz: 4,
            pointerTileSize: 8,
            roomAvailability: [],
            roomAvailabilitySchedule: [
                { index: 24, roomType: "specialist", startAvailable: false, whenAvailable: 1, availableForLevel: true }
            ],
            emergencySchedule: [
                { index: 0, startMonth: 0, endMonth: 2, minPatients: 2, maxPatients: 2, illnessCode: 2, percentToWin: 50, bonusCash: 500, diseaseId: "cranial-pressure", severity: 3 }
            ],
            eventSettings: { disasterLaunch: 8 }
        });
        orchestrator.advanceSimulationTicks(16);
        expect(orchestrator.telemetry()).toMatchObject({
            emergencyActive: false,
            roomAvailabilityStatus: "diagnosis,treatment"
        });
        expect(orchestrator.createPersistenceSnapshot().commandLog
            .some((command) => command.type === "start-emergency-wave")).toBe(false);
        orchestrator.advanceSimulationTicks(48);
        expect(orchestrator.telemetry()).toMatchObject({
            emergencyActive: true,
            emergencyTotalPatients: 2,
            roomAvailabilityStatus: "diagnosis,treatment,specialist"
        });
        expect(orchestrator.createPersistenceSnapshot().commandLog).toContainEqual({
            type: "start-emergency-wave",
            emergencyIndex: 0
        });
        const snapshot = orchestrator.createPersistenceSnapshot();
        expect(snapshot.roomAvailabilitySchedule).toEqual([
            { index: 24, roomType: "specialist", startAvailable: false, whenAvailable: 1, availableForLevel: true }
        ]);
        expect(AppOrchestrator.fromPersistenceSnapshot(snapshot).telemetry()).toEqual(orchestrator.telemetry());
    });
    it("uses imported abduction timing for automatic patient abductions", () => {
        const orchestrator = new AppOrchestrator({
            seed: 1062,
            tickRateHz: 4,
            pointerTileSize: 8,
            eventSettings: { minimumAbductionYears: 0, abductionsPerYear: 768 }
        });
        orchestrator.dispatch({ device: "ui", action: "pause-toggle", source: "ui:pause-toggle" });
        orchestrator.dispatch({ device: "ui", action: "admit-patient", severity: 2, source: "ui:admit" });
        expect(orchestrator.telemetry()).toMatchObject({
            patientsWaiting: 1,
            scenarioMinimumAbductionYears: 0,
            scenarioAbductionsPerYear: 768,
            scenarioAbductionsTriggered: 0
        });
        orchestrator.advanceSimulationTicks(1);
        expect(orchestrator.telemetry()).toMatchObject({
            patientsWaiting: 0,
            patientAbductions: 1,
            scenarioAbductionsTriggered: 1,
            lastEventType: "patient-abducted"
        });
        const snapshot = orchestrator.createPersistenceSnapshot();
        expect(snapshot.commandLog).toContainEqual({ type: "apply-alien-abduction", abductionIndex: 1 });
        expect(AppOrchestrator.fromPersistenceSnapshot(snapshot).telemetry()).toEqual(orchestrator.telemetry());
    });
    it("routes epidemic outbreaks through deterministic command history and restore", () => {
        const orchestrator = new AppOrchestrator({ seed: 109, tickRateHz: 4, pointerTileSize: 8 });
        expect(orchestrator.telemetry()).toMatchObject({
            epidemicActive: false,
            epidemicPatientCount: 3,
            epidemicDurationTicks: 18,
            epidemicSpreadIntervalTicks: 6,
            epidemicMaxSpreadPatients: 2,
            epidemicRewardCash: 700,
            epidemicRewardReputation: 30,
            epidemicPenaltyCash: 500,
            epidemicPenaltyReputation: 35
        });
        expect(orchestrator.dispatch({
            device: "ui",
            action: "start-epidemic-outbreak",
            source: "ui:start-epidemic-outbreak"
        })).toEqual(["epidemic.started"]);
        expect(orchestrator.telemetry()).toMatchObject({
            patientsWaiting: 3,
            epidemicActive: true,
            epidemicOutbreakId: 1,
            epidemicRemainingTicks: 18,
            epidemicTotalPatients: 3,
            epidemicRemainingPatients: 3,
            epidemicOutbreaksStarted: 1,
            lastEventType: "epidemic-started"
        });
        expect(orchestrator.dispatch({
            device: "ui",
            action: "start-epidemic-outbreak",
            source: "ui:start-epidemic-outbreak"
        })).toEqual(["epidemic.blocked"]);
        for (let index = 0; index < 3; index += 1) {
            orchestrator.dispatch({ device: "ui", action: "treat-patient", source: "ui:treat" });
        }
        expect(orchestrator.telemetry()).toMatchObject({
            epidemicActive: false,
            epidemicContainedOutbreaks: 1,
            epidemicFailedOutbreaks: 0,
            lastEventType: "epidemic-contained"
        });
        const snapshot = orchestrator.createPersistenceSnapshot();
        expect(snapshot.commandLog).toContainEqual({ type: "start-epidemic-outbreak" });
        expect(AppOrchestrator.fromPersistenceSnapshot(snapshot).telemetry()).toEqual(orchestrator.telemetry());
    });
    it("uses imported scenario epidemic settings for outbreak spread and terms", () => {
        const orchestrator = new AppOrchestrator({
            seed: 1092,
            tickRateHz: 4,
            pointerTileSize: 8,
            epidemicSettings: {
                howContagious: 30,
                contagiousSpreadFactor: 25,
                reduceContagiousMonths: 6,
                reduceContagiousPeepCount: 10,
                reduceContagiousRate: 0,
                fine: 3000,
                compensationLow: 1000,
                compensationHigh: 10000
            },
            landSettings: { landCostPerTile: 25 },
            staffFatigueSettings: { restStanding: 3, restSofa: 8, restGame: 60, restSnooker: 30, workLight: 1, modifyFrequency: 16, notTired: 300, tired: 600, veryTired: 700, crackUpTired: 800, recoveryFactor: 450, recoveryMinimum: 3, resignMax: 150 },
            patientBehaviorSettings: { litterDrop: 25, litterRandom: 60, leaveMax: 150, happy: 75, unhappy: 50, veryUnhappy: 25, drinkHappy: 5, toiletHappy: 10, bowelFull: 50, bowelOverflows: 75, vomitLimit: 50 },
            salarySettings: {
                salaryAdds: [
                    { index: 3, value: -30, name: "Junior" },
                    { index: 7, value: 100, name: "Consultant" }
                ],
                salaryAbilityDivisor: 10,
                salaryTooLow: -10,
                salaryTooHigh: 20
            },
            allocationSettings: {
                randomWeight: 4,
                totalReputationWeight: 1,
                illnessReputationWeight: 2,
                delayMonths: 3
            },
            routingSettings: {
                queuePoints: 15,
                distancePoints: 1,
                noStaffPoints: 20
            },
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
            }
        });
        expect(orchestrator.telemetry()).toMatchObject({
            scenarioEpidemicHowContagious: 30,
            scenarioEpidemicContagiousSpreadFactor: 25,
            scenarioEpidemicReduceContagiousMonths: 6,
            scenarioEpidemicReduceContagiousPeepCount: 10,
            scenarioEpidemicReduceContagiousRate: 0,
            scenarioEpidemicFine: 3000,
            scenarioEpidemicCompensationLow: 1000,
            scenarioEpidemicCompensationHigh: 10000,
            scenarioLandCostPerTile: 25,
            scenarioStaffRestStanding: 3,
            scenarioStaffRestSofa: 8,
            scenarioStaffRestGame: 60,
            scenarioStaffRestSnooker: 30,
            scenarioStaffWorkLight: 1,
            scenarioStaffModifyFrequency: 16,
            scenarioStaffNotTired: 300,
            scenarioStaffTired: 600,
            scenarioStaffVeryTired: 700,
            scenarioStaffFatigueCrackUpTired: 800,
            scenarioStaffRecoveryFactor: 450,
            scenarioStaffFatigueRecoveryMinimum: 3,
            scenarioStaffResignMax: 150,
            scenarioPatientLeaveMax: 150,
            scenarioPatientHappy: 75,
            scenarioPatientUnhappy: 50,
            scenarioPatientVeryUnhappy: 25,
            scenarioPatientLitterDrop: 25,
            scenarioPatientLitterRandom: 60,
            scenarioPatientBowelFull: 50,
            scenarioPatientBowelOverflows: 75,
            scenarioPatientDrinkHappy: 5,
            scenarioPatientToiletHappy: 10,
            scenarioPatientVomitLimit: 50,
            scenarioSalaryAbilityDivisor: 10,
            scenarioSalaryTooLow: -10,
            scenarioSalaryTooHigh: 20,
            scenarioSalaryAddCount: 2,
            scenarioAllocationRandomWeight: 4,
            scenarioAllocationTotalReputationWeight: 1,
            scenarioAllocationIllnessReputationWeight: 2,
            scenarioAllocationDelayMonths: 3,
            scenarioAllocationDelayTicks: 192,
            scenarioRoutingQueuePoints: 15,
            scenarioRoutingDistancePoints: 1,
            scenarioRoutingNoStaffPoints: 20,
            scenarioScoreMaxIncrease: 300,
            scenarioVaccinationCost: 50,
            scenarioRemoveRatHoleChance: 3000,
            scenarioMinimumAbductionYears: 4,
            scenarioAbductionsPerYear: 2,
            scenarioAutopsyResearchPercent: 33,
            scenarioAutopsyReputationHitPercent: 20,
            scenarioMayorLaunch: 1,
            scenarioDisasterLaunch: 200,
            epidemicSpreadIntervalTicks: 5,
            epidemicMaxSpreadPatients: 2,
            epidemicSpreadChancePercent: 25,
            epidemicRewardCash: 5500,
            epidemicRewardCashMin: 1000,
            epidemicRewardCashMax: 10000,
            epidemicPenaltyCash: 9000,
            epidemicVaccinationCost: 50,
            epidemicTotalVaccinationCosts: 0
        });
        expect(orchestrator.getState().routingSettings).toEqual({
            queuePoints: 15,
            distancePoints: 1,
            noStaffPoints: 20
        });
        expect(orchestrator.getState().patientBehavior).toEqual({ leaveMaxTicks: 150, happy: 75, unhappy: 50, veryUnhappy: 25, vomitLimit: 50, litterDrop: 25, litterRandom: 60, litterCleanupChance: 3000, bowelFull: 50, bowelOverflows: 75, drinkHappy: 5, toiletHappy: 10 });
        expect(orchestrator.getState().research).toMatchObject({
            autopsyResearchPercent: 33,
            autopsyReputationHitPercent: 20
        });
        expect(orchestrator.dispatch({
            device: "ui",
            action: "start-epidemic-outbreak",
            source: "ui:start-epidemic-outbreak"
        })).toEqual(["epidemic.started"]);
        expect(orchestrator.telemetry()).toMatchObject({
            epidemicActive: true,
            epidemicRemainingTicks: 18,
            epidemicNextSpreadTick: 5,
            epidemicTotalPatients: 3,
            epidemicRewardCash: expect.any(Number),
            epidemicRewardCashMin: 1000,
            epidemicRewardCashMax: 10000,
            epidemicSpreadChancePercent: 25,
            epidemicVaccinationCost: 50,
            epidemicTotalVaccinationCosts: 150,
            epidemicSpreadSlowdownActive: false
        });
        expect(orchestrator.telemetry().epidemicRewardCash).toBeGreaterThanOrEqual(1000);
        expect(orchestrator.telemetry().epidemicRewardCash).toBeLessThanOrEqual(10000);
        const snapshot = orchestrator.createPersistenceSnapshot();
        expect(snapshot.epidemicSettings).toEqual({
            howContagious: 30,
            contagiousSpreadFactor: 25,
            reduceContagiousMonths: 6,
            reduceContagiousPeepCount: 10,
            reduceContagiousRate: 0,
            fine: 3000,
            compensationLow: 1000,
            compensationHigh: 10000
        });
        expect(snapshot.landSettings).toEqual({ landCostPerTile: 25 });
        expect(snapshot.staffFatigueSettings).toEqual({ restStanding: 3, restSofa: 8, restGame: 60, restSnooker: 30, workLight: 1, modifyFrequency: 16, notTired: 300, tired: 600, veryTired: 700, crackUpTired: 800, recoveryFactor: 450, recoveryMinimum: 3, resignMax: 150 });
        expect(snapshot.patientBehaviorSettings).toEqual({ litterDrop: 25, litterRandom: 60, leaveMax: 150, happy: 75, unhappy: 50, veryUnhappy: 25, drinkHappy: 5, toiletHappy: 10, bowelFull: 50, bowelOverflows: 75, vomitLimit: 50 });
        expect(snapshot.salarySettings).toEqual({
            salaryAdds: [
                { index: 3, value: -30, name: "Junior" },
                { index: 7, value: 100, name: "Consultant" }
            ],
            salaryAbilityDivisor: 10,
            salaryTooLow: -10,
            salaryTooHigh: 20
        });
        expect(snapshot.allocationSettings).toEqual({
            randomWeight: 4,
            totalReputationWeight: 1,
            illnessReputationWeight: 2,
            delayMonths: 3
        });
        expect(snapshot.routingSettings).toEqual({
            queuePoints: 15,
            distancePoints: 1,
            noStaffPoints: 20
        });
        expect(snapshot.eventSettings).toEqual({
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
        expect(AppOrchestrator.fromPersistenceSnapshot(snapshot).telemetry()).toEqual(orchestrator.telemetry());
    });
    it("applies imported epidemic reduction settings to app-level spread timing", () => {
        const orchestrator = new AppOrchestrator({
            seed: 1093,
            tickRateHz: 4,
            pointerTileSize: 8,
            epidemicSettings: {
                howContagious: 75,
                reduceContagiousPeepCount: 1,
                reduceContagiousRate: 100
            }
        });
        expect(orchestrator.dispatch({
            device: "ui",
            action: "start-epidemic-outbreak",
            source: "ui:start-epidemic-outbreak"
        })).toEqual(["epidemic.started"]);
        const patientId = orchestrator.getState().entities.waitingPatients.find((patient) => patient.epidemicOutbreakId === 1).id;
        orchestrator.dispatch({ device: "ui", action: "treat-patient", patientId, source: "ui:treat" });
        orchestrator.dispatch({ device: "ui", action: "pause-toggle", source: "ui:pause-toggle" });
        for (let index = 0; index < 2; index += 1) {
            orchestrator.dispatch({ device: "ui", action: "step-tick", source: "ui:step" });
        }
        expect(orchestrator.telemetry()).toMatchObject({
            scenarioEpidemicReduceContagiousPeepCount: 1,
            scenarioEpidemicReduceContagiousRate: 100,
            epidemicSpreadSlowdownActive: true,
            epidemicNextSpreadTick: 6,
            epidemicOutbreakSpreadPatients: 1
        });
    });
    it("applies imported epidemic contagious spread factor to app-level spread chance", () => {
        const blocked = new AppOrchestrator({
            seed: 1098,
            tickRateHz: 4,
            pointerTileSize: 8,
            epidemicSettings: { howContagious: 30, contagiousSpreadFactor: 0 }
        });
        const guaranteed = new AppOrchestrator({
            seed: 1098,
            tickRateHz: 4,
            pointerTileSize: 8,
            epidemicSettings: { howContagious: 30, contagiousSpreadFactor: 100 }
        });
        blocked.dispatch({ device: "ui", action: "start-epidemic-outbreak", source: "ui:start-epidemic-outbreak" });
        guaranteed.dispatch({ device: "ui", action: "start-epidemic-outbreak", source: "ui:start-epidemic-outbreak" });
        for (let index = 0; index < 10; index += 1) {
            blocked.advanceFrame(250);
            guaranteed.advanceFrame(250);
        }
        expect(blocked.telemetry()).toMatchObject({
            epidemicSpreadChancePercent: 0,
            epidemicOutbreakSpreadPatients: 0
        });
        expect(guaranteed.telemetry()).toMatchObject({
            epidemicSpreadChancePercent: 100,
            epidemicOutbreakSpreadPatients: 2
        });
    });
    it("routes VIP inspections through deterministic command history and restore", () => {
        const orchestrator = new AppOrchestrator({ seed: 108, tickRateHz: 4, pointerTileSize: 8 });
        expect(orchestrator.telemetry()).toMatchObject({
            vipInspectionActive: false,
            vipInspectionDurationTicks: 8,
            vipInspectionMaxQueuePressure: 2,
            vipInspectionMinReputation: 450,
            vipInspectionRewardCash: 800,
            vipInspectionRewardReputation: 25
        });
        expect(orchestrator.dispatch({
            device: "ui",
            action: "start-vip-inspection",
            source: "ui:start-vip-inspection"
        })).toEqual(["vip.started"]);
        expect(orchestrator.telemetry()).toMatchObject({
            vipInspectionActive: true,
            vipInspectionVisitId: 1,
            vipInspectionRemainingTicks: 8,
            vipInspectionVisitsStarted: 1,
            lastEventType: "vip-inspection-started"
        });
        expect(orchestrator.dispatch({
            device: "ui",
            action: "start-vip-inspection",
            source: "ui:start-vip-inspection"
        })).toEqual(["vip.blocked"]);
        for (let index = 0; index < 8; index += 1) {
            orchestrator.advanceFrame(250);
        }
        expect(orchestrator.telemetry()).toMatchObject({
            vipInspectionActive: false,
            vipInspectionPassedVisits: 1,
            vipInspectionFailedVisits: 0,
            lastEventType: "vip-inspection-passed"
        });
        const snapshot = orchestrator.createPersistenceSnapshot();
        expect(snapshot.commandLog).toContainEqual({ type: "start-vip-inspection" });
        expect(AppOrchestrator.fromPersistenceSnapshot(snapshot).telemetry()).toEqual(orchestrator.telemetry());
    });
    it("uses imported mayor launch timing for automatic VIP inspections", () => {
        const orchestrator = new AppOrchestrator({
            seed: 1081,
            tickRateHz: 4,
            pointerTileSize: 8,
            eventSettings: { mayorLaunch: 6 }
        });
        orchestrator.advanceSimulationTicks(5);
        expect(orchestrator.telemetry()).toMatchObject({
            vipInspectionActive: false,
            scenarioMayorLaunch: 6
        });
        orchestrator.advanceSimulationTicks(1);
        expect(orchestrator.telemetry()).toMatchObject({
            vipInspectionActive: true,
            vipInspectionVisitsStarted: 1,
            vipInspectionRemainingTicks: 8,
            lastEventType: "vip-inspection-started"
        });
        const snapshot = orchestrator.createPersistenceSnapshot();
        expect(snapshot.commandLog).toContainEqual({ type: "start-vip-inspection" });
        expect(AppOrchestrator.fromPersistenceSnapshot(snapshot).telemetry()).toEqual(orchestrator.telemetry());
    });
    it("routes selected staff training through deterministic command history and restore", () => {
        const orchestrator = new AppOrchestrator({ seed: 107, tickRateHz: 4, pointerTileSize: 8 });
        expect(orchestrator.telemetry()).toMatchObject({
            trainingStaff: 0,
            totalStaffSkillLevel: 0,
            maxStaffSkillLevel: 3,
            staffTrainingCost: 700,
            staffTrainingTicks: 5
        });
        expect(orchestrator.dispatch({
            device: "ui",
            action: "train-staff",
            staffId: 1,
            source: "ui:train-selected-staff"
        })).toEqual(["training.started"]);
        expect(orchestrator.telemetry()).toMatchObject({
            cash: 49_300,
            trainingStaff: 1,
            staffTrainingStarted: 1,
            staffTrainingCompleted: 0,
            lastEventType: "staff-training-started"
        });
        expect(orchestrator.dispatch({
            device: "ui",
            action: "train-staff",
            staffId: 1,
            source: "ui:train-selected-staff"
        })).toEqual(["training.blocked"]);
        for (let index = 0; index < 5; index += 1) {
            orchestrator.advanceFrame(250);
        }
        expect(orchestrator.telemetry()).toMatchObject({
            trainingStaff: 0,
            trainedStaff: 1,
            totalStaffSkillLevel: 1,
            staffTrainingCompleted: 1,
            lastEventType: "staff-training-completed"
        });
        const snapshot = orchestrator.createPersistenceSnapshot();
        expect(snapshot.commandLog).toContainEqual({ type: "train-staff", staffId: 1 });
        expect(AppOrchestrator.fromPersistenceSnapshot(snapshot).telemetry()).toEqual(orchestrator.telemetry());
    });
    it("uses imported scenario training rate for staff training duration and restore", () => {
        const orchestrator = new AppOrchestrator({
            seed: 1071,
            tickRateHz: 4,
            pointerTileSize: 8,
            trainingSettings: {
                promotionDoctorMonths: 6,
                promotionConsultantMonths: 12,
                abilityThresholds: [
                    { index: 0, value: 75, name: "SURGEON" },
                    { index: 1, value: 60, name: "PSYCHO" }
                ],
                trainingRate: 30,
                trainingValues: [
                    { index: 0, value: 10, name: "Projector" },
                    { index: 1, value: 15, name: "Skeleton" }
                ],
                doctorThreshold: 250,
                consultantThreshold: 750
            }
        });
        expect(orchestrator.telemetry()).toMatchObject({
            staffTrainingTicks: 4,
            scenarioTrainingRate: 30,
            scenarioTrainingValueCount: 2,
            scenarioTrainingAbilityThresholdCount: 2,
            scenarioPromotionDoctorMonths: 6,
            scenarioPromotionConsultantMonths: 12,
            scenarioDoctorThreshold: 250,
            scenarioConsultantThreshold: 750
        });
        expect(orchestrator.dispatch({
            device: "ui",
            action: "train-staff",
            staffId: 1,
            source: "ui:train-selected-staff"
        })).toEqual(["training.started"]);
        expect(orchestrator.telemetry()).toMatchObject({
            trainingStaff: 1,
            staffTrainingTicks: 4
        });
        expect(orchestrator.getState().staffTraining.trainingTicksByTargetLevel).toEqual({ 1: 5, 2: 5, 3: 9 });
        expect(orchestrator.getState().entities.staff.find((staff) => staff.id === 1)).toMatchObject({
            trainingRemainingTicks: 5
        });
        for (let index = 0; index < 4; index += 1) {
            orchestrator.advanceFrame(250);
        }
        expect(orchestrator.telemetry()).toMatchObject({
            trainingStaff: 1,
            staffTrainingCompleted: 0
        });
        orchestrator.advanceFrame(250);
        expect(orchestrator.telemetry()).toMatchObject({
            trainingStaff: 0,
            staffTrainingCompleted: 1
        });
        const snapshot = orchestrator.createPersistenceSnapshot();
        expect(snapshot.trainingSettings).toEqual({
            promotionDoctorMonths: 6,
            promotionConsultantMonths: 12,
            abilityThresholds: [
                { index: 0, value: 75, name: "SURGEON" },
                { index: 1, value: 60, name: "PSYCHO" }
            ],
            trainingRate: 30,
            trainingValues: [
                { index: 0, value: 10, name: "Projector" },
                { index: 1, value: 15, name: "Skeleton" }
            ],
            doctorThreshold: 250,
            consultantThreshold: 750
        });
        expect(AppOrchestrator.fromPersistenceSnapshot(snapshot).telemetry()).toEqual(orchestrator.telemetry());
    });
    it("uses imported training values as equipment-speed bonuses when no rate is set", () => {
        const orchestrator = new AppOrchestrator({
            seed: 1073,
            tickRateHz: 4,
            pointerTileSize: 8,
            trainingSettings: {
                trainingValues: [
                    { index: 0, value: 10, name: "Projector" },
                    { index: 1, value: 10, name: "Skeleton" }
                ]
            }
        });
        expect(orchestrator.telemetry()).toMatchObject({
            staffTrainingTicks: 4,
            scenarioTrainingRate: null,
            scenarioTrainingValueCount: 2
        });
        expect(orchestrator.dispatch({
            device: "ui",
            action: "train-staff",
            staffId: 1,
            source: "ui:train-selected-staff"
        })).toEqual(["training.started"]);
        for (let index = 0; index < 4; index += 1) {
            orchestrator.advanceFrame(250);
        }
        expect(orchestrator.telemetry()).toMatchObject({
            trainingStaff: 0,
            staffTrainingCompleted: 1
        });
    });
    it("keeps deterministic state hashes for identical normalized input scripts", () => {
        const script = [
            { device: "keyboard", action: "admit-patient", severity: 2, source: "KeyA" },
            { device: "keyboard", action: "pause-toggle", source: "Space" },
            { device: "keyboard", action: "step-tick", source: "Period" },
            { device: "keyboard", action: "pause-toggle", source: "Space" },
            { device: "keyboard", action: "treat-patient", source: "KeyT" }
        ];
        expect(stateHashAfterScript(99, script)).toBe(stateHashAfterScript(99, script));
    });
    it("exports and restores deterministic persistence snapshots", () => {
        const original = new AppOrchestrator({ seed: 8080, tickRateHz: 4, pointerTileSize: 8 });
        original.dispatch({ device: "keyboard", action: "admit-patient", severity: 2, source: "KeyA" });
        original.advanceFrame(125);
        original.dispatch({ device: "keyboard", action: "pause-toggle", source: "Space" });
        original.dispatch({ device: "keyboard", action: "step-tick", source: "Period" });
        const snapshot = original.createPersistenceSnapshot();
        const restored = AppOrchestrator.fromPersistenceSnapshot(snapshot);
        expect(restored.telemetry()).toEqual(original.telemetry());
        expect(restored.createPersistenceSnapshot()).toEqual(snapshot);
        restored.dispatch({ device: "keyboard", action: "pause-toggle", source: "Space" });
        original.dispatch({ device: "keyboard", action: "pause-toggle", source: "Space" });
        expect(restored.advanceFrame(125)).toBe(original.advanceFrame(125));
        expect(restored.telemetry().stateHash).toBe(original.telemetry().stateHash);
    });
    it("preserves imported network criteria in snapshots and telemetry", () => {
        const original = new AppOrchestrator({
            seed: 8082,
            tickRateHz: 4,
            pointerTileSize: 8,
            networkCriteria: [
                { index: 1, metricCode: 5, metric: "balance", value: 10000, month: 21, timeToDo: 4 },
                { index: 0, metricCode: 3, metric: "reputation", value: 1, month: 2, timeToDo: 4 }
            ]
        });
        expect(original.telemetry()).toMatchObject({
            scenarioNetworkCriteriaCount: 2,
            scenarioNetworkCriteriaSummary: "reputation 1 by month 2; balance 10000 by month 21",
            scenarioNetworkCriteriaMetCount: 2,
            scenarioNetworkCriteriaActiveCount: 0,
            scenarioNetworkCriteriaMissedCount: 0,
            scenarioNetworkCriteriaStatuses: [
                expect.objectContaining({ index: 0, metric: "reputation", currentValue: 500, value: 1, status: "met", deadlineMonth: 6 }),
                expect.objectContaining({ index: 1, metric: "balance", currentValue: 50_000, value: 10000, status: "met", deadlineMonth: 25 })
            ]
        });
        const snapshot = original.createPersistenceSnapshot();
        expect(snapshot.networkCriteria).toEqual([
            { index: 0, metricCode: 3, metric: "reputation", value: 1, month: 2, timeToDo: 4 },
            { index: 1, metricCode: 5, metric: "balance", value: 10000, month: 21, timeToDo: 4 }
        ]);
        expect(AppOrchestrator.fromPersistenceSnapshot(snapshot).telemetry()).toEqual(original.telemetry());
    });
    it("evaluates imported network criteria against current browser state and deadlines", () => {
        const orchestrator = new AppOrchestrator({
            seed: 8083,
            tickRateHz: 4,
            pointerTileSize: 8,
            networkCriteria: [
                { index: 0, metricCode: 5, metric: "balance", value: 100_000, month: 0, timeToDo: 0 },
                { index: 1, metricCode: 3, metric: "reputation", value: 1, month: 2, timeToDo: 4 }
            ]
        });
        expect(orchestrator.telemetry()).toMatchObject({
            scenarioNetworkCriteriaMetCount: 1,
            scenarioNetworkCriteriaActiveCount: 1,
            scenarioNetworkCriteriaMissedCount: 0,
            scenarioNetworkCriteriaStatuses: [
                expect.objectContaining({ metric: "balance", currentValue: 50_000, value: 100_000, status: "active", deadlineMonth: 0 }),
                expect.objectContaining({ metric: "reputation", currentValue: 500, value: 1, status: "met", deadlineMonth: 6 })
            ]
        });
        orchestrator.executeCommand({ type: "tick", count: 65 });
        expect(orchestrator.telemetry()).toMatchObject({
            scenarioNetworkCriteriaMetCount: 1,
            scenarioNetworkCriteriaActiveCount: 0,
            scenarioNetworkCriteriaMissedCount: 1,
            scenarioNetworkCriteriaStatuses: [
                expect.objectContaining({ metric: "balance", currentValue: expect.any(Number), value: 100_000, status: "missed", deadlineMonth: 0 }),
                expect.objectContaining({ metric: "reputation", currentValue: expect.any(Number), value: 1, status: "met", deadlineMonth: 6 })
            ]
        });
    });
    it("routes default admissions through configured map admission points and persists them", () => {
        const original = new AppOrchestrator({
            seed: 8081,
            tickRateHz: 4,
            pointerTileSize: 8,
            bounds: { width: 12, height: 12 },
            admissionPoints: [{ x: 10, y: 9 }, { x: 9, y: 10 }]
        });
        original.dispatch({ device: "ui", action: "admit-patient", severity: 2, source: "ui:admit" });
        original.dispatch({ device: "ui", action: "admit-patient", severity: 3, source: "ui:admit" });
        expect(original.getState().entities.waitingPatients.map((patient) => patient.position)).toEqual([
            { x: 10, y: 9 },
            { x: 9, y: 10 }
        ]);
        const snapshot = original.createPersistenceSnapshot();
        expect(snapshot.admissionPoints).toEqual([{ x: 10, y: 9 }, { x: 9, y: 10 }]);
        expect(AppOrchestrator.fromPersistenceSnapshot(snapshot).telemetry()).toEqual(original.telemetry());
    });
    it("supports slice 2 staff lifecycle and room-operation control actions", () => {
        const orchestrator = new AppOrchestrator({ seed: 9010, tickRateHz: 4, pointerTileSize: 8 });
        const baseline = orchestrator.telemetry();
        expect(baseline.activeStaff).toBe(2);
        expect(baseline.onBreakStaff).toBe(0);
        expect(baseline.openDiagnosisRooms).toBe(1);
        expect(baseline.openTreatmentRooms).toBe(1);
        expect(orchestrator.dispatch({
            device: "ui",
            action: "staff-break-toggle",
            source: "ui:staff-break-toggle"
        })).toEqual([]);
        expect(orchestrator.telemetry().onBreakStaff).toBe(1);
        expect(orchestrator.dispatch({
            device: "ui",
            action: "treatment-room-toggle",
            source: "ui:treatment-room-toggle"
        })).toEqual([]);
        expect(orchestrator.telemetry().openTreatmentRooms).toBe(0);
    });
    it("targets selected staff and rooms for lifecycle controls", () => {
        const orchestrator = new AppOrchestrator({ seed: 9017, tickRateHz: 4, pointerTileSize: 8 });
        const nurse = orchestrator.getState().entities.staff.find((staff) => staff.role === "nurse");
        const diagnosisRoom = orchestrator.getState().entities.rooms.find((room) => room.roomType === "diagnosis");
        expect(nurse).toBeTruthy();
        expect(diagnosisRoom).toBeTruthy();
        expect(orchestrator.dispatch({
            device: "ui",
            action: "staff-break-toggle",
            staffId: nurse.id,
            source: "ui:staff-break-toggle"
        })).toEqual([]);
        expect(orchestrator.getState().entities.staff.find((staff) => staff.id === nurse.id)).toMatchObject({
            role: "nurse",
            status: "on-break"
        });
        expect(orchestrator.dispatch({
            device: "ui",
            action: "treatment-room-toggle",
            roomId: diagnosisRoom.id,
            source: "ui:treatment-room-toggle"
        })).toEqual([]);
        expect(orchestrator.getState().entities.rooms.find((room) => room.id === diagnosisRoom.id)).toMatchObject({
            roomType: "diagnosis",
            status: "closed"
        });
    });
    it("fires selected staff and sells selected rooms through deterministic commands", () => {
        const orchestrator = new AppOrchestrator({ seed: 9018, tickRateHz: 4, pointerTileSize: 8 });
        orchestrator.dispatch({
            device: "ui",
            action: "hire-staff",
            role: "nurse",
            source: "ui:hire-nurse",
            pointer: { x: 48, y: 64 }
        });
        const nurse = orchestrator.getState().entities.staff.find((staff) => staff.position.x === 6 && staff.position.y === 8);
        expect(nurse).toBeTruthy();
        expect(orchestrator.dispatch({
            device: "ui",
            action: "fire-staff",
            staffId: nurse.id,
            source: "ui:fire-selected-staff"
        })).toEqual(["staff.fired"]);
        expect(orchestrator.getState().entities.staff.find((staff) => staff.id === nurse.id)).toBeUndefined();
        orchestrator.dispatch({
            device: "ui",
            action: "build-room",
            roomType: "diagnosis",
            source: "ui:build-diagnosis-room",
            pointer: { x: 48, y: 56 }
        });
        const room = orchestrator.getState().entities.rooms.find((candidate) => candidate.position.x === 6 && candidate.position.y === 7);
        expect(room).toBeTruthy();
        const cashAfterBuild = orchestrator.telemetry().cash;
        expect(orchestrator.dispatch({
            device: "ui",
            action: "sell-room",
            roomId: room.id,
            source: "ui:sell-selected-room"
        })).toEqual(["room.sold"]);
        expect(orchestrator.getState().entities.rooms.find((candidate) => candidate.id === room.id)).toBeUndefined();
        expect(orchestrator.telemetry().cash).toBe(cashAfterBuild + 400);
    });
    it("routes map placement actions into positioned room and staff commands", () => {
        const orchestrator = new AppOrchestrator({ seed: 9013, tickRateHz: 4, pointerTileSize: 8 });
        expect(orchestrator.dispatch({
            device: "ui",
            action: "build-room",
            roomType: "diagnosis",
            source: "ui:build-diagnosis-room",
            pointer: { x: 48, y: 56 }
        })).toEqual(["room.built"]);
        expect(orchestrator.dispatch({
            device: "ui",
            action: "hire-staff",
            role: "diagnostician",
            source: "ui:hire-diagnostician",
            pointer: { x: 48, y: 64 }
        })).toEqual(["staff.hired"]);
        const state = orchestrator.getState();
        expect(state.entities.rooms[state.entities.rooms.length - 1]).toMatchObject({
            roomType: "diagnosis",
            position: { x: 6, y: 7 }
        });
        expect(state.entities.staff[state.entities.staff.length - 1]).toMatchObject({
            role: "diagnostician",
            position: { x: 6, y: 8 }
        });
    });
    it("surfaces specialized treatment room placement and telemetry", () => {
        const orchestrator = new AppOrchestrator({
            seed: 9026,
            tickRateHz: 4,
            pointerTileSize: 8,
            bounds: { width: 12, height: 12 }
        });
        expect(orchestrator.evaluatePlacement({
            device: "ui",
            action: "build-room",
            roomType: "pharmacy",
            source: "ui:build-pharmacy-room",
            pointer: { x: 8, y: 56 }
        })).toMatchObject({
            action: "build-room",
            valid: true,
            cost: 1200,
            roomType: "pharmacy",
            position: { x: 1, y: 7 }
        });
        expect(orchestrator.dispatch({
            device: "ui",
            action: "build-room",
            roomType: "pharmacy",
            source: "ui:build-pharmacy-room",
            pointer: { x: 8, y: 56 }
        })).toEqual(["room.built"]);
        expect(orchestrator.dispatch({
            device: "ui",
            action: "build-room",
            roomType: "specialist",
            source: "ui:build-specialist-room",
            pointer: { x: 64, y: 56 }
        })).toEqual(["room.built"]);
        expect(orchestrator.telemetry()).toMatchObject({
            openTreatmentRooms: 3,
            openGeneralTreatmentRooms: 1,
            openPharmacyRooms: 1,
            openSpecialistRooms: 1,
            specializedTreatmentRooms: 2
        });
        orchestrator.dispatch({ device: "ui", action: "pause-toggle", source: "ui:pause-toggle" });
        orchestrator.dispatch({ device: "ui", action: "admit-patient", severity: 2, source: "ui:admit" });
        for (let index = 0; index < 4; index += 1) {
            orchestrator.dispatch({ device: "ui", action: "step-tick", source: "ui:step" });
        }
        const pharmacy = orchestrator.getState().entities.rooms.find((room) => room.roomType === "pharmacy");
        for (let index = 0; index < 8 && orchestrator.getState().entities.waitingPatients[0]?.assignedRoomId !== pharmacy.id; index += 1) {
            orchestrator.dispatch({ device: "ui", action: "step-tick", source: "ui:step" });
        }
        expect(orchestrator.getState().entities.waitingPatients[0]).toMatchObject({
            preferredTreatmentRoomType: "pharmacy",
            assignedRoomId: pharmacy.id
        });
        expect(orchestrator.telemetry().awaitingSpecializedTreatmentPatients).toBe(0);
        const snapshot = orchestrator.createPersistenceSnapshot();
        expect(snapshot.commandLog.some((command) => command.type === "open-room" && command.roomType === "pharmacy")).toBe(true);
        expect(AppOrchestrator.fromPersistenceSnapshot(snapshot).telemetry()).toEqual(orchestrator.telemetry());
    });
    it("uses imported scenario object availability to gate specialized room builds", () => {
        const orchestrator = new AppOrchestrator({
            seed: 9039,
            tickRateHz: 4,
            pointerTileSize: 8,
            bounds: { width: 12, height: 12 },
            roomAvailability: ["specialist"]
        });
        expect(orchestrator.telemetry().roomAvailabilityStatus).toBe("diagnosis,treatment,specialist");
        expect(orchestrator.evaluatePlacement({
            device: "ui",
            action: "build-room",
            roomType: "pharmacy",
            source: "ui:build-pharmacy-room",
            pointer: { x: 8, y: 56 }
        })).toMatchObject({
            valid: false,
            reason: "room-unavailable"
        });
        expect(orchestrator.dispatch({
            device: "ui",
            action: "build-room",
            roomType: "pharmacy",
            source: "ui:build-pharmacy-room",
            pointer: { x: 8, y: 56 }
        })).toEqual(["room.build-blocked"]);
        expect(orchestrator.dispatch({
            device: "ui",
            action: "build-room",
            roomType: "specialist",
            source: "ui:build-specialist-room",
            pointer: { x: 64, y: 56 }
        })).toEqual(["room.built"]);
        const snapshot = orchestrator.createPersistenceSnapshot();
        expect(snapshot.roomAvailability).toEqual(["diagnosis", "treatment", "specialist"]);
        expect(AppOrchestrator.fromPersistenceSnapshot(snapshot).telemetry()).toEqual(orchestrator.telemetry());
    });
    it("unlocks scenario object-gated rooms by scenario month", () => {
        const orchestrator = new AppOrchestrator({
            seed: 9029,
            tickRateHz: 4,
            pointerTileSize: 8,
            bounds: { width: 12, height: 12 },
            roomAvailability: [],
            roomAvailabilitySchedule: [
                { index: 13, roomType: "diagnosis", startAvailable: true, whenAvailable: 0, availableForLevel: true },
                { index: 24, roomType: "specialist", startAvailable: false, whenAvailable: 1, availableForLevel: true }
            ]
        });
        expect(orchestrator.telemetry().roomAvailabilityStatus).toBe("diagnosis,treatment");
        expect(orchestrator.telemetry()).toMatchObject({
            scenarioObjectAvailabilityCount: 2,
            scenarioObjectAvailableCount: 1,
            scenarioObjectLockedCount: 1,
            scenarioObjectDisabledCount: 0,
            scenarioObjectResearchLockedCount: 0
        });
        expect(orchestrator.evaluatePlacement({
            device: "ui",
            action: "build-room",
            roomType: "specialist",
            source: "ui:build-specialist-room",
            pointer: { x: 64, y: 56 }
        })).toMatchObject({
            valid: false,
            reason: "room-unavailable"
        });
        orchestrator.advanceFrame(16_000);
        expect(orchestrator.telemetry()).toMatchObject({
            roomAvailabilityStatus: "diagnosis,treatment,specialist",
            scenarioObjectAvailableCount: 2,
            scenarioObjectLockedCount: 0
        });
        expect(orchestrator.evaluatePlacement({
            device: "ui",
            action: "build-room",
            roomType: "specialist",
            source: "ui:build-specialist-room",
            pointer: { x: 64, y: 56 }
        })).toMatchObject({
            valid: true
        });
        const snapshot = orchestrator.createPersistenceSnapshot();
        expect(snapshot.roomAvailabilitySchedule).toEqual([
            { index: 13, roomType: "diagnosis", startAvailable: true, whenAvailable: 0, availableForLevel: true },
            { index: 24, roomType: "specialist", startAvailable: false, whenAvailable: 1, availableForLevel: true }
        ]);
        expect(AppOrchestrator.fromPersistenceSnapshot(snapshot).telemetry()).toEqual(orchestrator.telemetry());
    });
    it("unlocks scenario object-gated rooms through researched expertise categories", () => {
        const orchestrator = new AppOrchestrator({
            seed: 9030,
            tickRateHz: 4,
            pointerTileSize: 8,
            bounds: { width: 12, height: 12 },
            roomAvailability: [],
            roomAvailabilitySchedule: [
                { index: 24, roomType: "specialist", startAvailable: false, whenAvailable: 99, availableForLevel: true, researchRequired: 40000, expertiseCategory: "DIAGNOSIS" }
            ],
            expertise: [
                { index: 38, known: false, researchRequired: 40000, token: "I_D_CARDIO", category: "DIAGNOSIS" }
            ]
        });
        expect(orchestrator.telemetry().roomAvailabilityStatus).toBe("diagnosis,treatment");
        expect(orchestrator.telemetry()).toMatchObject({
            scenarioObjectAvailabilityCount: 1,
            scenarioObjectAvailableCount: 0,
            scenarioObjectLockedCount: 1,
            scenarioObjectResearchLockedCount: 1,
            scenarioObjectAvailableIndices: [],
            scenarioObjectLockedIndices: [24],
            scenarioObjectDisabledIndices: [],
            scenarioObjectResearchLockedIndices: [24]
        });
        expect(orchestrator.evaluatePlacement({
            device: "ui",
            action: "build-room",
            roomType: "specialist",
            source: "ui:build-specialist-room",
            pointer: { x: 64, y: 56 }
        })).toMatchObject({
            valid: false,
            reason: "room-unavailable"
        });
        expect(orchestrator.dispatch({ device: "ui", action: "start-research", source: "ui:start-research" })).toEqual(["research.started"]);
        for (let index = 0; index < 6; index += 1) {
            orchestrator.advanceFrame(250);
        }
        expect(orchestrator.telemetry()).toMatchObject({
            treatmentResearchLevel: 1,
            scenarioKnownExpertiseCount: 1,
            roomAvailabilityStatus: "diagnosis,treatment,specialist",
            scenarioObjectAvailableCount: 1,
            scenarioObjectLockedCount: 0,
            scenarioObjectResearchLockedCount: 0,
            scenarioObjectAvailableIndices: [24],
            scenarioObjectLockedIndices: [],
            scenarioObjectResearchLockedIndices: []
        });
        expect(orchestrator.evaluatePlacement({
            device: "ui",
            action: "build-room",
            roomType: "specialist",
            source: "ui:build-specialist-room",
            pointer: { x: 64, y: 56 }
        })).toMatchObject({
            valid: true
        });
        const snapshot = orchestrator.createPersistenceSnapshot();
        expect(snapshot.roomAvailabilitySchedule).toEqual([
            { index: 24, roomType: "specialist", startAvailable: false, whenAvailable: 99, availableForLevel: true, researchRequired: 40000, expertiseCategory: "DIAGNOSIS" }
        ]);
        expect(AppOrchestrator.fromPersistenceSnapshot(snapshot).telemetry()).toEqual(orchestrator.telemetry());
    });
    it("triggers scenario quakes once through deterministic commands", () => {
        const orchestrator = new AppOrchestrator({
            seed: 9031,
            tickRateHz: 4,
            pointerTileSize: 8,
            bounds: { width: 12, height: 12 },
            quakeSchedule: [
                { index: 0, startMonth: 1, endMonth: 1, severity: 6 }
            ]
        });
        expect(orchestrator.telemetry()).toMatchObject({
            scenarioQuakeScheduleSize: 1,
            scenarioQuakeActiveIndex: null,
            scenarioQuakesTriggered: 0
        });
        orchestrator.advanceFrame(16_000);
        expect(orchestrator.telemetry()).toMatchObject({
            scenarioQuakeActiveIndex: null,
            scenarioQuakeSeverity: 0,
            scenarioQuakesTriggered: 1,
            lastEventType: "earthquake-applied"
        });
        expect(orchestrator.createPersistenceSnapshot().commandLog.filter((command) => command.type === "apply-earthquake")).toEqual([
            { type: "apply-earthquake", severity: 6, quakeIndex: 0 }
        ]);
        orchestrator.advanceFrame(16_000);
        expect(orchestrator.createPersistenceSnapshot().commandLog.filter((command) => command.type === "apply-earthquake")).toHaveLength(1);
        const snapshot = orchestrator.createPersistenceSnapshot();
        expect(snapshot.quakeSchedule).toEqual([
            { index: 0, startMonth: 1, endMonth: 1, severity: 6 }
        ]);
        expect(AppOrchestrator.fromPersistenceSnapshot(snapshot).telemetry()).toEqual(orchestrator.telemetry());
    });
    it("starts and restores browser scenarios with imported scenario cash", () => {
        const orchestrator = new AppOrchestrator({
            seed: 9032,
            tickRateHz: 4,
            pointerTileSize: 8,
            bounds: { width: 12, height: 12 },
            initialCash: 40_000,
            scenarioLevelName: "Scenario Level One"
        });
        expect(orchestrator.telemetry()).toMatchObject({
            cash: 40_000,
            scenarioInitialCash: 40_000,
            scenarioLevelName: "Scenario Level One"
        });
        const snapshot = orchestrator.createPersistenceSnapshot();
        expect(snapshot.initialCash).toBe(40_000);
        expect(snapshot.scenarioLevelName).toBe("Scenario Level One");
        expect(AppOrchestrator.fromPersistenceSnapshot(snapshot).telemetry()).toEqual(orchestrator.telemetry());
    });
    it("uses imported scenario room costs in build previews, purchases, and restore", () => {
        const orchestrator = new AppOrchestrator({
            seed: 9033,
            tickRateHz: 4,
            pointerTileSize: 8,
            bounds: { width: 12, height: 12 },
            initialCash: 3_000,
            roomCostOverrides: { diagnosis: 2_280, pharmacy: 500 }
        });
        expect(orchestrator.evaluatePlacement({
            device: "ui",
            action: "build-room",
            roomType: "diagnosis",
            source: "ui:build-diagnosis-room",
            pointer: { x: 8, y: 56 }
        })).toMatchObject({
            valid: true,
            cost: 2_280
        });
        expect(orchestrator.dispatch({
            device: "ui",
            action: "build-room",
            roomType: "diagnosis",
            source: "ui:build-diagnosis-room",
            pointer: { x: 8, y: 56 }
        })).toEqual(["room.built"]);
        expect(orchestrator.telemetry()).toMatchObject({
            cash: 720,
            scenarioRoomCostOverrides: { diagnosis: 2_280, pharmacy: 500 }
        });
        const snapshot = orchestrator.createPersistenceSnapshot();
        expect(snapshot.roomCostOverrides).toEqual({ diagnosis: 2_280, pharmacy: 500 });
        expect(AppOrchestrator.fromPersistenceSnapshot(snapshot).telemetry()).toEqual(orchestrator.telemetry());
    });
    it("uses imported scenario land cost in build previews, purchases, and restore", () => {
        const orchestrator = new AppOrchestrator({
            seed: 90331,
            tickRateHz: 4,
            pointerTileSize: 8,
            bounds: { width: 12, height: 12 },
            initialCash: 3_000,
            landSettings: { landCostPerTile: 25 }
        });
        expect(orchestrator.evaluatePlacement({
            device: "ui",
            action: "build-room",
            roomType: "diagnosis",
            source: "ui:build-diagnosis-room",
            pointer: { x: 8, y: 56 }
        })).toMatchObject({
            valid: true,
            cost: 1_025
        });
        expect(orchestrator.dispatch({
            device: "ui",
            action: "build-room",
            roomType: "diagnosis",
            source: "ui:build-diagnosis-room",
            pointer: { x: 8, y: 56 }
        })).toEqual(["room.built"]);
        expect(orchestrator.telemetry()).toMatchObject({
            cash: 1_975,
            scenarioLandCostPerTile: 25
        });
        const snapshot = orchestrator.createPersistenceSnapshot();
        expect(snapshot.landSettings).toEqual({ landCostPerTile: 25 });
        expect(AppOrchestrator.fromPersistenceSnapshot(snapshot).telemetry()).toEqual(orchestrator.telemetry());
    });
    it("uses imported scenario room machine strength for maintenance thresholds and restore", () => {
        const orchestrator = new AppOrchestrator({
            seed: 90331,
            tickRateHz: 4,
            pointerTileSize: 8,
            bounds: { width: 12, height: 12 },
            roomWearThresholdOverrides: { diagnosis: 12 },
            researchSettings: { maxObjectStrength: 14, researchIncrement: 2 },
            staffMarketSchedule: [
                { index: 0, month: 0, doctors: 0, nurses: 1, handymen: 1, receptionists: 0 }
            ]
        });
        expect(orchestrator.dispatch({
            device: "ui",
            action: "start-research",
            source: "ui:start-research"
        })).toEqual(["research.started"]);
        for (let index = 0; index < 6; index += 1) {
            orchestrator.advanceFrame(250);
        }
        expect(orchestrator.telemetry().treatmentResearchLevel).toBe(2);
        orchestrator.executeCommand({ type: "set-room-status", roomId: 2, status: "closed" });
        orchestrator.executeCommand({ type: "apply-earthquake", severity: 13, quakeIndex: 0 });
        expect(orchestrator.getState().entities.rooms.find((room) => room.id === 1)).toMatchObject({
            status: "open",
            wear: 13,
            maintenanceRemainingTicks: 0
        });
        orchestrator.executeCommand({ type: "apply-earthquake", severity: 1, quakeIndex: 1 });
        expect(orchestrator.getState().entities.rooms.find((room) => room.id === 1)).toMatchObject({
            status: "closed",
            wear: 14,
            maintenanceRemainingTicks: 2
        });
        expect(orchestrator.telemetry()).toMatchObject({
            scenarioRoomWearThresholdOverrides: { diagnosis: 12 },
            scenarioRoomWearResearchMaxStrength: 14
        });
        const snapshot = orchestrator.createPersistenceSnapshot();
        expect(snapshot.roomWearThresholdOverrides).toEqual({ diagnosis: 12 });
        expect(snapshot.researchSettings).toEqual({ maxObjectStrength: 14, researchIncrement: 2 });
        expect(AppOrchestrator.fromPersistenceSnapshot(snapshot).telemetry()).toEqual(orchestrator.telemetry());
    });
    it("uses imported scenario staff wages in recurring expenses and restore", () => {
        const orchestrator = new AppOrchestrator({
            seed: 9034,
            tickRateHz: 4,
            pointerTileSize: 8,
            bounds: { width: 12, height: 12 },
            staffMarketSchedule: [
                { index: 0, month: 0, doctors: 8, nurses: 8, handymen: 3, receptionists: 1 }
            ],
            staffWageOverrides: { diagnostician: 6, nurse: 5, handyman: 2, receptionist: 2 }
        });
        orchestrator.dispatch({
            device: "ui",
            action: "hire-staff",
            role: "handyman",
            source: "ui:hire-handyman",
            pointer: { x: 48, y: 32 }
        });
        expect(orchestrator.dispatch({
            device: "ui",
            action: "hire-staff",
            role: "receptionist",
            source: "ui:hire-receptionist",
            pointer: { x: 16, y: 32 }
        })).toEqual(["staff.hired"]);
        orchestrator.advanceFrame(250);
        expect(orchestrator.telemetry()).toMatchObject({
            tickExpenses: 20,
            staffMarketReceptionistsAvailable: 0,
            scenarioStaffWageOverrides: { diagnostician: 6, nurse: 5, handyman: 2, receptionist: 2 }
        });
        const snapshot = orchestrator.createPersistenceSnapshot();
        expect(snapshot.commandLog).toContainEqual({
            type: "hire-staff",
            role: "receptionist",
            position: { x: 2, y: 4 }
        });
        expect(snapshot.staffWageOverrides).toEqual({ diagnostician: 6, nurse: 5, handyman: 2, receptionist: 2 });
        expect(AppOrchestrator.fromPersistenceSnapshot(snapshot).telemetry()).toEqual(orchestrator.telemetry());
    });
    it("uses only active hired receptionists for front-desk capacity", () => {
        const orchestrator = new AppOrchestrator({
            seed: 90341,
            tickRateHz: 4,
            pointerTileSize: 8,
            bounds: { width: 12, height: 12 },
            staffMarketSchedule: [
                { index: 0, month: 0, doctors: 8, nurses: 8, handymen: 3, receptionists: 2 }
            ]
        });
        expect(orchestrator.telemetry()).toMatchObject({
            staffMarketReceptionistsAvailable: 2,
            activeReceptionists: 0,
            frontDeskCapacity: 0,
            autoAdmissionWaitingCap: 0
        });
        expect(orchestrator.dispatch({
            device: "ui",
            action: "hire-staff",
            role: "receptionist",
            source: "ui:hire-receptionist",
            pointer: { x: 16, y: 32 }
        })).toEqual(["staff.hired"]);
        const receptionist = orchestrator.getState().entities.staff.find((staff) => staff.role === "receptionist");
        expect(receptionist).toBeTruthy();
        expect(orchestrator.telemetry()).toMatchObject({
            staffMarketReceptionistsAvailable: 1,
            activeReceptionists: 1,
            frontDeskCapacity: 4,
            autoAdmissionWaitingCap: 4
        });
        expect(orchestrator.dispatch({
            device: "ui",
            action: "staff-break-toggle",
            staffId: receptionist.id,
            source: "ui:staff-break-toggle"
        })).toEqual([]);
        expect(orchestrator.telemetry()).toMatchObject({
            activeReceptionists: 0,
            frontDeskCapacity: 0,
            autoAdmissionWaitingCap: 0
        });
        orchestrator.dispatch({
            device: "ui",
            action: "staff-break-toggle",
            staffId: receptionist.id,
            source: "ui:staff-break-toggle"
        });
        expect(orchestrator.dispatch({
            device: "ui",
            action: "fire-staff",
            staffId: receptionist.id,
            source: "ui:fire-selected-staff"
        })).toEqual(["staff.fired"]);
        expect(orchestrator.telemetry()).toMatchObject({
            staffMarketReceptionistsAvailable: 2,
            activeReceptionists: 0,
            frontDeskCapacity: 0,
            autoAdmissionWaitingCap: 0
        });
    });
    it("routes selected staff relocation through deterministic commands and restore", () => {
        const orchestrator = new AppOrchestrator({ seed: 9024, tickRateHz: 4, pointerTileSize: 8 });
        const nurse = orchestrator.getState().entities.staff.find((staff) => staff.role === "nurse");
        expect(nurse).toBeTruthy();
        expect(orchestrator.evaluatePlacement({
            device: "ui",
            action: "move-staff",
            staffId: nurse.id,
            source: "ui:move-selected-staff",
            pointer: { x: 56, y: 72 }
        })).toMatchObject({
            action: "move-staff",
            valid: true,
            cost: 0,
            role: "nurse",
            position: { x: 7, y: 9 }
        });
        expect(orchestrator.dispatch({
            device: "ui",
            action: "move-staff",
            staffId: nurse.id,
            source: "ui:move-selected-staff",
            pointer: { x: 56, y: 72 }
        })).toEqual(["staff.moved"]);
        expect(orchestrator.getState().entities.staff.find((staff) => staff.id === nurse.id)).toMatchObject({
            role: "nurse",
            position: { x: 7, y: 9 }
        });
        const snapshot = orchestrator.createPersistenceSnapshot();
        expect(snapshot.commandLog[snapshot.commandLog.length - 1]).toEqual({
            type: "move-staff",
            staffId: nurse.id,
            position: { x: 7, y: 9 }
        });
        expect(AppOrchestrator.fromPersistenceSnapshot(snapshot).telemetry()).toEqual(orchestrator.telemetry());
    });
    it("surfaces blocked hire actions when cash is insufficient", () => {
        const orchestrator = new AppOrchestrator({
            seed: 9014,
            tickRateHz: 4,
            pointerTileSize: 8,
            initialCash: 100
        });
        expect(orchestrator.dispatch({
            device: "ui",
            action: "hire-staff",
            role: "nurse",
            source: "ui:hire-nurse",
            pointer: { x: 48, y: 64 }
        })).toEqual(["staff.hire-blocked"]);
        expect(orchestrator.telemetry().activeStaff).toBe(2);
        expect(orchestrator.telemetry().cash).toBe(100);
    });
    it("routes handyman hiring through placement telemetry and restore", () => {
        const orchestrator = new AppOrchestrator({
            seed: 9039,
            tickRateHz: 4,
            pointerTileSize: 8,
            bounds: { width: 12, height: 12 }
        });
        expect(orchestrator.dispatch({
            device: "ui",
            action: "hire-staff",
            role: "handyman",
            source: "ui:hire-handyman",
            pointer: { x: 56, y: 72 }
        })).toEqual(["staff.hired"]);
        expect(orchestrator.getState().entities.staff.find((staff) => staff.role === "handyman")).toMatchObject({
            role: "handyman",
            status: "active",
            position: { x: 7, y: 9 }
        });
        expect(orchestrator.telemetry()).toMatchObject({
            activeStaff: 3,
            activeHandymen: 1,
            totalHandymen: 1,
            maintenanceStaffRepairBonusTicks: 1,
            maintenanceStaffRepairEvents: 0
        });
        const snapshot = orchestrator.createPersistenceSnapshot();
        expect(snapshot.commandLog).toContainEqual({
            type: "hire-staff",
            role: "handyman",
            position: { x: 7, y: 9 }
        });
        expect(AppOrchestrator.fromPersistenceSnapshot(snapshot).telemetry()).toEqual(orchestrator.telemetry());
    });
    it("evaluates placement previews without mutating simulation state", () => {
        const terrain = createTerrain(12, 12);
        setRect(terrain, 6, 7, 3, 3, { buildable: false });
        const orchestrator = new AppOrchestrator({
            seed: 9015,
            tickRateHz: 4,
            pointerTileSize: 8,
            bounds: { width: 12, height: 12 },
            terrain
        });
        const before = orchestrator.telemetry();
        expect(orchestrator.evaluatePlacement({
            device: "ui",
            action: "build-room",
            roomType: "diagnosis",
            source: "ui:build-diagnosis-room",
            pointer: { x: 8, y: 56 }
        })).toMatchObject({
            action: "build-room",
            valid: true,
            reason: null,
            cost: 800,
            position: { x: 1, y: 7 },
            tiles: expect.arrayContaining([{ x: 1, y: 7 }, { x: 3, y: 9 }])
        });
        expect(orchestrator.telemetry()).toEqual(before);
        expect(orchestrator.evaluatePlacement({
            device: "ui",
            action: "build-room",
            roomType: "treatment",
            source: "ui:build-treatment-room",
            pointer: { x: 48, y: 56 }
        })).toMatchObject({
            valid: false,
            reason: "non-buildable"
        });
        orchestrator.dispatch({
            device: "ui",
            action: "build-room",
            roomType: "diagnosis",
            source: "ui:build-diagnosis-room",
            pointer: { x: 8, y: 56 }
        });
        expect(orchestrator.evaluatePlacement({
            device: "ui",
            action: "build-room",
            roomType: "treatment",
            source: "ui:build-treatment-room",
            pointer: { x: 8, y: 56 }
        })).toMatchObject({
            valid: false,
            reason: "occupied"
        });
        const lowCash = new AppOrchestrator({
            seed: 9016,
            tickRateHz: 4,
            pointerTileSize: 8,
            initialCash: 100
        });
        expect(lowCash.evaluatePlacement({
            device: "ui",
            action: "hire-staff",
            role: "nurse",
            source: "ui:hire-nurse",
            pointer: { x: 48, y: 64 }
        })).toMatchObject({
            action: "hire-staff",
            valid: false,
            reason: "insufficient-cash",
            cost: 250
        });
    });
    it("surfaces slice 3 economy/progression/event telemetry deterministically", () => {
        const orchestrator = new AppOrchestrator({ seed: 9011, tickRateHz: 4, pointerTileSize: 8 });
        orchestrator.advanceFrame(250);
        const baseline = orchestrator.telemetry();
        expect(baseline.tickNetCashflow).toBeLessThan(0);
        expect(baseline.milestoneLevel).toBe(0);
        expect(baseline.unlockedSystems).toBe(0);
        expect(baseline.totalEvents).toBe(1);
        expect(baseline.lastEventType).toBe("cashflow-negative");
        expect(baseline.recentEventFeed).toBe("1:cashflow-negative");
        expect(baseline.advisorStatus).toBe("Advisor: stable");
        orchestrator.dispatch({
            device: "ui",
            action: "admit-patient",
            severity: 1,
            source: "ui:admit",
            pointer: { x: 16, y: 16 }
        });
        orchestrator.advanceFrame(1250);
        const unlocked = orchestrator.telemetry();
        expect(unlocked.milestoneLevel).toBe(1);
        expect(unlocked.unlockedSystems).toBe(1);
        expect(unlocked.lastEventType).toBe("cashflow-positive");
        expect(unlocked.recentEventFeed).toContain("milestone-unlocked");
        expect(unlocked.cash).toBeGreaterThan(50_000);
    });
    it("surfaces deterministic level objective status", () => {
        const orchestrator = new AppOrchestrator({ seed: 9019, tickRateHz: 4, pointerTileSize: 8 });
        expect(orchestrator.telemetry()).toMatchObject({
            levelObjectiveStatus: "running",
            levelObjectiveRequiredDischarges: 3,
            levelObjectiveRemainingDischarges: 3,
            levelObjectiveMinimumCash: 0,
            levelObjectiveMinimumReputation: 1
        });
        for (let index = 0; index < 3; index += 1) {
            orchestrator.dispatch({ device: "ui", action: "admit-patient", severity: 1, source: "ui:admit" });
            orchestrator.dispatch({ device: "ui", action: "treat-patient", source: "ui:treat" });
        }
        expect(orchestrator.telemetry()).toMatchObject({
            levelObjectiveStatus: "won",
            levelObjectiveReason: "objectives-complete",
            levelObjectiveRemainingDischarges: 0
        });
        const bankrupt = new AppOrchestrator({ seed: 9020, tickRateHz: 4, pointerTileSize: 8, initialCash: 0 });
        expect(bankrupt.telemetry()).toMatchObject({
            levelObjectiveStatus: "lost",
            levelObjectiveReason: "bankruptcy"
        });
        const reputationFailed = new AppOrchestrator({
            seed: 90201,
            tickRateHz: 4,
            pointerTileSize: 8,
            levelObjective: {
                requiredDischarges: 1,
                minimumCash: 0,
                minimumReputation: 300,
                reputationFailureThreshold: 500,
                bankruptcyCashThreshold: -20_000
            }
        });
        expect(reputationFailed.telemetry()).toMatchObject({
            levelObjectiveStatus: "lost",
            levelObjectiveReason: "reputation",
            levelObjectiveReputationFailureThreshold: 500
        });
    });
    it("latches terminal level outcomes until the level is restarted or reloaded", () => {
        const won = new AppOrchestrator({
            seed: 90201,
            tickRateHz: 4,
            pointerTileSize: 8,
            bounds: { width: 12, height: 12 },
            initialCash: 1_300,
            levelObjective: {
                requiredDischarges: 1,
                minimumCash: 0,
                minimumReputation: 1,
                bankruptcyCashThreshold: 700
            }
        });
        won.dispatch({ device: "ui", action: "admit-patient", severity: 1, source: "ui:admit" });
        won.dispatch({ device: "ui", action: "treat-patient", source: "ui:treat" });
        expect(won.telemetry()).toMatchObject({
            levelObjectiveStatus: "won",
            levelObjectiveReason: "objectives-complete"
        });
        won.executeCommand({ type: "open-room", roomType: "diagnosis", position: { x: 1, y: 7 } });
        won.executeCommand({ type: "open-room", roomType: "treatment", position: { x: 5, y: 7 } });
        expect(won.telemetry()).toMatchObject({
            cash: expect.any(Number),
            levelObjectiveStatus: "won",
            levelObjectiveReason: "objectives-complete"
        });
        expect(won.telemetry().cash).toBeLessThanOrEqual(700);
        const restoredWon = AppOrchestrator.fromPersistenceSnapshot(won.createPersistenceSnapshot());
        expect(restoredWon.telemetry()).toMatchObject({
            levelObjectiveStatus: "won",
            levelObjectiveReason: "objectives-complete"
        });
        const lost = new AppOrchestrator({ seed: 90202, tickRateHz: 4, pointerTileSize: 8, initialCash: 0 });
        expect(lost.telemetry()).toMatchObject({
            levelObjectiveStatus: "lost",
            levelObjectiveReason: "bankruptcy"
        });
        lost.executeCommand({ type: "take-loan" });
        expect(lost.telemetry()).toMatchObject({
            cash: 5_000,
            levelObjectiveStatus: "lost",
            levelObjectiveReason: "bankruptcy"
        });
    });
    it("requires original scenario cash, treatment percentage, and hospital value targets before winning", () => {
        const orchestrator = new AppOrchestrator({
            seed: 9021,
            tickRateHz: 4,
            pointerTileSize: 8,
            levelObjective: {
                requiredDischarges: 1,
                minimumCash: 50_000,
                minimumReputation: 1,
                minimumTreatmentPercentage: 50,
                minimumHospitalValue: 0,
                bankruptcyCashThreshold: -20_000,
                maximumDeaths: 50
            }
        });
        orchestrator.dispatch({ device: "ui", action: "admit-patient", severity: 1, source: "ui:admit" });
        orchestrator.dispatch({ device: "ui", action: "treat-patient", source: "ui:treat" });
        expect(orchestrator.telemetry()).toMatchObject({
            levelObjectiveStatus: "won",
            levelObjectiveReason: "objectives-complete",
            levelObjectiveMinimumCash: 50_000,
            levelObjectiveMinimumTreatmentPercentage: 50,
            levelObjectiveCurrentTreatmentPercentage: 100,
            levelObjectiveMinimumHospitalValue: 0,
            levelObjectiveBankruptcyCashThreshold: -20_000,
            levelObjectiveMaximumDeaths: 50
        });
        const blockedByCashTarget = new AppOrchestrator({
            seed: 9022,
            tickRateHz: 4,
            pointerTileSize: 8,
            levelObjective: {
                requiredDischarges: 1,
                minimumCash: 1_000_000,
                minimumReputation: 1,
                bankruptcyCashThreshold: -20_000
            }
        });
        blockedByCashTarget.dispatch({ device: "ui", action: "admit-patient", severity: 1, source: "ui:admit" });
        blockedByCashTarget.dispatch({ device: "ui", action: "treat-patient", source: "ui:treat" });
        expect(blockedByCashTarget.telemetry()).toMatchObject({
            levelObjectiveStatus: "running",
            levelObjectiveRemainingDischarges: 0
        });
        const blockedByHospitalValue = new AppOrchestrator({
            seed: 9023,
            tickRateHz: 4,
            pointerTileSize: 8,
            levelObjective: {
                requiredDischarges: 1,
                minimumCash: 0,
                minimumReputation: 1,
                minimumHospitalValue: 1_000_000,
                bankruptcyCashThreshold: -20_000
            }
        });
        blockedByHospitalValue.dispatch({ device: "ui", action: "admit-patient", severity: 1, source: "ui:admit" });
        blockedByHospitalValue.dispatch({ device: "ui", action: "treat-patient", source: "ui:treat" });
        expect(blockedByHospitalValue.telemetry()).toMatchObject({
            levelObjectiveStatus: "running",
            levelObjectiveRemainingDischarges: 0,
            levelObjectiveMinimumHospitalValue: 1_000_000
        });
    });
    it("allows imported scenario objectives with no cures criterion to complete without discharges", () => {
        const orchestrator = new AppOrchestrator({
            seed: 90231,
            tickRateHz: 4,
            pointerTileSize: 8,
            initialCash: 60_000,
            levelObjective: {
                requiredDischarges: 0,
                minimumCash: 50_000,
                minimumReputation: 1,
                minimumHospitalValue: 0,
                bankruptcyCashThreshold: -20_000
            }
        });
        expect(orchestrator.telemetry()).toMatchObject({
            levelObjectiveStatus: "won",
            levelObjectiveReason: "objectives-complete",
            levelObjectiveRequiredDischarges: 0,
            levelObjectiveRemainingDischarges: 0
        });
        expect(AppOrchestrator.fromPersistenceSnapshot(orchestrator.createPersistenceSnapshot()).telemetry()).toMatchObject({
            levelObjectiveStatus: "won",
            levelObjectiveRequiredDischarges: 0
        });
    });
    it("surfaces deterministic patient risk telemetry", () => {
        const orchestrator = new AppOrchestrator({
            seed: 9021,
            tickRateHz: 4,
            pointerTileSize: 8,
            patientBehaviorSettings: { happy: 75, unhappy: 50, veryUnhappy: 25 }
        });
        orchestrator.dispatch({ device: "ui", action: "pause-toggle", source: "ui:pause-toggle" });
        orchestrator.dispatch({ device: "ui", action: "staff-break-toggle", source: "ui:staff-break-toggle" });
        orchestrator.dispatch({ device: "ui", action: "admit-patient", severity: 3, source: "ui:admit" });
        expect(orchestrator.telemetry()).toMatchObject({
            patientDeaths: 0,
            criticalPatients: 0,
            lowestPatientHealth: 48,
            happyPatients: 1,
            unhappyPatients: 0,
            veryUnhappyPatients: 0
        });
        for (let index = 0; index < 36; index += 1) {
            orchestrator.dispatch({ device: "ui", action: "step-tick", source: "ui:step" });
        }
        expect(orchestrator.telemetry()).toMatchObject({
            patientDeaths: 0,
            criticalPatients: 1,
            lowestPatientHealth: 12,
            happyPatients: 0,
            unhappyPatients: 1,
            veryUnhappyPatients: 1,
            advisorStatus: "Advisor: 1 critical patient"
        });
        for (let index = 0; index < 12; index += 1) {
            orchestrator.dispatch({ device: "ui", action: "step-tick", source: "ui:step" });
        }
        expect(orchestrator.telemetry()).toMatchObject({
            patientsWaiting: 0,
            patientDeaths: 1,
            criticalPatients: 0,
            lowestPatientHealth: null,
            lastEventType: "patient-died"
        });
    });
    it("uses imported patient vomit limits in app-level patient telemetry", () => {
        const orchestrator = new AppOrchestrator({
            seed: 9038,
            tickRateHz: 4,
            pointerTileSize: 8,
            patientBehaviorSettings: { vomitLimit: 50 }
        });
        orchestrator.dispatch({ device: "ui", action: "pause-toggle", source: "ui:pause-toggle" });
        orchestrator.dispatch({ device: "ui", action: "staff-break-toggle", source: "ui:staff-break-toggle" });
        orchestrator.dispatch({ device: "ui", action: "admit-patient", severity: 3, source: "ui:admit" });
        for (let index = 0; index < 24; index += 1) {
            orchestrator.dispatch({ device: "ui", action: "step-tick", source: "ui:step" });
        }
        expect(orchestrator.telemetry()).toMatchObject({
            scenarioPatientVomitLimit: 50,
            patientVomits: 1,
            lastEventType: "patient-vomited"
        });
        expect(orchestrator.getState().entities.waitingPatients[0]).toMatchObject({ vomited: true });
        orchestrator.dispatch({ device: "ui", action: "step-tick", source: "ui:step" });
        expect(orchestrator.telemetry().patientVomits).toBe(1);
    });
    it("uses imported patient litter timing in app-level patient telemetry", () => {
        const orchestrator = new AppOrchestrator({
            seed: 9039,
            tickRateHz: 4,
            pointerTileSize: 8,
            patientBehaviorSettings: { litterDrop: 3, litterRandom: 1 }
        });
        orchestrator.dispatch({ device: "ui", action: "pause-toggle", source: "ui:pause-toggle" });
        orchestrator.dispatch({ device: "ui", action: "staff-break-toggle", source: "ui:staff-break-toggle" });
        orchestrator.dispatch({ device: "ui", action: "admit-patient", severity: 3, source: "ui:admit" });
        for (let index = 0; index < 2; index += 1) {
            orchestrator.dispatch({ device: "ui", action: "step-tick", source: "ui:step" });
        }
        expect(orchestrator.telemetry().patientLitter).toBe(0);
        orchestrator.dispatch({ device: "ui", action: "step-tick", source: "ui:step" });
        expect(orchestrator.telemetry()).toMatchObject({
            scenarioPatientLitterDrop: 3,
            scenarioPatientLitterRandom: 1,
            patientLitter: 1,
            lastEventType: "patient-litter-dropped"
        });
        expect(orchestrator.getState().entities.waitingPatients[0]).toMatchObject({ droppedLitter: true });
    });
    it("uses imported rat-hole removal chance in app-level patient telemetry", () => {
        const orchestrator = new AppOrchestrator({
            seed: 9040,
            tickRateHz: 4,
            pointerTileSize: 8,
            patientBehaviorSettings: { litterDrop: 1 },
            eventSettings: { removeRatHoleChance: 10_000 }
        });
        orchestrator.dispatch({ device: "ui", action: "pause-toggle", source: "ui:pause-toggle" });
        orchestrator.dispatch({ device: "ui", action: "hire-staff", role: "handyman", source: "ui:hire-handyman" });
        orchestrator.dispatch({ device: "ui", action: "admit-patient", severity: 3, source: "ui:admit" });
        orchestrator.dispatch({ device: "ui", action: "step-tick", source: "ui:step" });
        expect(orchestrator.telemetry()).toMatchObject({
            scenarioRemoveRatHoleChance: 10_000,
            patientLitter: 1,
            currentPatientLitter: 0,
            patientLitterCleaned: 1
        });
        expect(orchestrator.getState().entities.waitingPatients[0]).not.toMatchObject({ droppedLitter: true });
        expect(orchestrator.getState().events.recent.map((event) => event.type)).toContain("patient-litter-cleaned");
    });
    it("uses imported bowel thresholds in app-level patient telemetry", () => {
        const orchestrator = new AppOrchestrator({
            seed: 9041,
            tickRateHz: 4,
            pointerTileSize: 8,
            patientBehaviorSettings: { bowelFull: 2, bowelOverflows: 4 }
        });
        orchestrator.dispatch({ device: "ui", action: "pause-toggle", source: "ui:pause-toggle" });
        orchestrator.dispatch({ device: "ui", action: "staff-break-toggle", source: "ui:staff-break-toggle" });
        orchestrator.dispatch({ device: "ui", action: "admit-patient", severity: 3, source: "ui:admit" });
        for (let index = 0; index < 2; index += 1) {
            orchestrator.dispatch({ device: "ui", action: "step-tick", source: "ui:step" });
        }
        expect(orchestrator.telemetry()).toMatchObject({
            scenarioPatientBowelFull: 2,
            scenarioPatientBowelOverflows: 4,
            patientsNeedingToilet: 1,
            patientBowelOverflows: 0,
            lastEventType: "patient-needs-toilet"
        });
        for (let index = 0; index < 2; index += 1) {
            orchestrator.dispatch({ device: "ui", action: "step-tick", source: "ui:step" });
        }
        expect(orchestrator.telemetry()).toMatchObject({
            patientsNeedingToilet: 1,
            patientBowelOverflows: 1,
            lastEventType: "patient-bowel-overflowed"
        });
        expect(orchestrator.getState().entities.waitingPatients[0]).toMatchObject({ needsToilet: true, bowelOverflowed: true });
    });
    it("uses imported drink and toilet happiness in app-level patient service actions", () => {
        const orchestrator = new AppOrchestrator({
            seed: 9041,
            tickRateHz: 4,
            pointerTileSize: 8,
            patientBehaviorSettings: { drinkHappy: 3, toiletHappy: 4, bowelFull: 2, bowelOverflows: 4 }
        });
        orchestrator.dispatch({ device: "ui", action: "pause-toggle", source: "ui:pause-toggle" });
        orchestrator.dispatch({ device: "ui", action: "staff-break-toggle", source: "ui:staff-break-toggle" });
        orchestrator.dispatch({ device: "ui", action: "admit-patient", severity: 3, source: "ui:admit" });
        const patientId = orchestrator.getState().entities.waitingPatients[0].id;
        for (let index = 0; index < 2; index += 1) {
            orchestrator.dispatch({ device: "ui", action: "step-tick", source: "ui:step" });
        }
        expect(orchestrator.dispatch({ device: "ui", action: "give-patient-drink", patientId, source: "ui:drink" })).toEqual(["patient.drink-given"]);
        expect(orchestrator.dispatch({ device: "ui", action: "send-patient-toilet", patientId, source: "ui:toilet" })).toEqual(["patient.toilet-used"]);
        const patient = orchestrator.getState().entities.waitingPatients[0];
        expect(patient).toMatchObject({
            health: patientMaxHealthForSeverity(3),
            drank: true,
            usedToilet: true
        });
        expect(patient).not.toHaveProperty("needsToilet");
        for (let index = 0; index < 3; index += 1) {
            orchestrator.dispatch({ device: "ui", action: "step-tick", source: "ui:step" });
        }
        expect(orchestrator.telemetry()).toMatchObject({
            scenarioPatientDrinkHappy: 3,
            scenarioPatientToiletHappy: 4,
            patientBowelOverflows: 0,
            lastEventType: "patient-used-toilet"
        });
    });
    it("runs deterministic automatic admissions when admissions are open", () => {
        const orchestrator = new AppOrchestrator({ seed: 9022, tickRateHz: 4, pointerTileSize: 8 });
        orchestrator.dispatch({ device: "ui", action: "pause-toggle", source: "ui:pause-toggle" });
        expect(orchestrator.telemetry().admissionPolicy).toBe("standard");
        expect(orchestrator.dispatch({
            device: "ui",
            action: "admission-policy-set",
            admissionPolicy: "aggressive",
            source: "ui:admission-policy"
        })).toEqual(["admission-policy.changed"]);
        expect(orchestrator.dispatch({ device: "ui", action: "admissions-toggle", source: "ui:admissions-toggle" })).toEqual(["admissions.opened"]);
        expect(orchestrator.telemetry()).toMatchObject({
            admissionsOpen: true,
            admissionPolicy: "aggressive",
            nextAdmissionInTicks: 16,
            autoAdmissionIntervalTicks: 16,
            autoAdmissionWaitingCap: 8
        });
        for (let index = 0; index < 16; index += 1) {
            orchestrator.dispatch({ device: "ui", action: "step-tick", source: "ui:step" });
        }
        expect(orchestrator.getState().counters.totalAdmissions).toBe(1);
        expect(orchestrator.telemetry().patientsWaiting).toBe(1);
        expect(orchestrator.getState().entities.waitingPatients[0]).toMatchObject({
            severity: 2,
            maxHealth: 64
        });
        const snapshot = orchestrator.createPersistenceSnapshot();
        expect(snapshot.runtime.admissionPolicy).toBe("aggressive");
        const restored = AppOrchestrator.fromPersistenceSnapshot(snapshot);
        expect(restored.telemetry()).toEqual(orchestrator.telemetry());
        for (let index = 0; index < 16; index += 1) {
            restored.dispatch({ device: "ui", action: "step-tick", source: "ui:step" });
        }
        expect(restored.getState().counters.totalAdmissions).toBe(2);
        expect(restored.dispatch({ device: "ui", action: "admissions-toggle", source: "ui:admissions-toggle" })).toEqual(["admissions.closed"]);
        expect(restored.telemetry()).toMatchObject({
            admissionsOpen: false,
            nextAdmissionInTicks: null
        });
    });
    it("uses imported scenario population schedule for automatic admission pacing", () => {
        const orchestrator = new AppOrchestrator({
            seed: 9023,
            tickRateHz: 4,
            pointerTileSize: 8,
            populationSchedule: [
                { index: 0, month: 0, change: 3 },
                { index: 1, month: 1, change: 0 }
            ]
        });
        orchestrator.dispatch({ device: "ui", action: "pause-toggle", source: "ui:pause-toggle" });
        orchestrator.dispatch({ device: "ui", action: "admissions-toggle", source: "ui:admissions-toggle" });
        expect(orchestrator.telemetry()).toMatchObject({
            autoAdmissionIntervalTicks: 10,
            autoAdmissionWaitingCap: 11,
            scenarioPopulationChange: 3,
            nextAdmissionInTicks: 10
        });
        for (let index = 0; index < 10; index += 1) {
            orchestrator.dispatch({ device: "ui", action: "step-tick", source: "ui:step" });
        }
        expect(orchestrator.getState().counters.totalAdmissions).toBe(1);
        const snapshot = orchestrator.createPersistenceSnapshot();
        expect(snapshot.populationSchedule).toEqual([
            { index: 0, month: 0, change: 3 },
            { index: 1, month: 1, change: 0 }
        ]);
        expect(AppOrchestrator.fromPersistenceSnapshot(snapshot).telemetry()).toEqual(orchestrator.telemetry());
        for (let index = 0; index < 54; index += 1) {
            orchestrator.dispatch({ device: "ui", action: "step-tick", source: "ui:step" });
        }
        expect(orchestrator.telemetry()).toMatchObject({
            autoAdmissionIntervalTicks: 16,
            autoAdmissionWaitingCap: 8,
            scenarioPopulationChange: 0
        });
    });
    it("uses imported scenario illness rate for automatic admission pressure", () => {
        const orchestrator = new AppOrchestrator({
            seed: 90231,
            tickRateHz: 4,
            pointerTileSize: 8,
            scenarioIllnessRate: 4
        });
        orchestrator.dispatch({ device: "ui", action: "pause-toggle", source: "ui:pause-toggle" });
        orchestrator.dispatch({ device: "ui", action: "admissions-toggle", source: "ui:admissions-toggle" });
        expect(orchestrator.telemetry()).toMatchObject({
            autoAdmissionIntervalTicks: 12,
            autoAdmissionWaitingCap: 10,
            scenarioIllnessRate: 4,
            nextAdmissionInTicks: 12
        });
        for (let index = 0; index < 12; index += 1) {
            orchestrator.dispatch({ device: "ui", action: "step-tick", source: "ui:step" });
        }
        expect(orchestrator.getState().counters.totalAdmissions).toBe(1);
        const snapshot = orchestrator.createPersistenceSnapshot();
        expect(snapshot.scenarioIllnessRate).toBe(4);
        expect(AppOrchestrator.fromPersistenceSnapshot(snapshot).telemetry()).toEqual(orchestrator.telemetry());
    });
    it("uses imported no-staff routing pressure to slow automatic admissions without active diagnosticians", () => {
        const orchestrator = new AppOrchestrator({
            seed: 90235,
            tickRateHz: 4,
            pointerTileSize: 8,
            routingSettings: { noStaffPoints: 20 }
        });
        const doctorId = orchestrator.getState().entities.staff.find((staff) => staff.role === "diagnostician").id;
        expect(orchestrator.dispatch({
            device: "ui",
            action: "fire-staff",
            staffId: doctorId,
            source: "ui:fire-staff"
        })).toEqual(["staff.fired"]);
        orchestrator.dispatch({ device: "ui", action: "pause-toggle", source: "ui:pause-toggle" });
        orchestrator.dispatch({ device: "ui", action: "admissions-toggle", source: "ui:admissions-toggle" });
        expect(orchestrator.telemetry()).toMatchObject({
            scenarioRoutingNoStaffPoints: 20,
            scenarioRoutingNoStaffAdmissionPenaltyTicks: 4,
            autoAdmissionIntervalTicks: 20,
            nextAdmissionInTicks: 20
        });
        for (let index = 0; index < 19; index += 1) {
            orchestrator.dispatch({ device: "ui", action: "step-tick", source: "ui:step" });
        }
        expect(orchestrator.getState().counters.totalAdmissions).toBe(0);
        orchestrator.dispatch({ device: "ui", action: "step-tick", source: "ui:step" });
        expect(orchestrator.getState().counters.totalAdmissions).toBe(1);
        const snapshot = orchestrator.createPersistenceSnapshot();
        expect(snapshot.routingSettings).toEqual({ noStaffPoints: 20 });
        expect(AppOrchestrator.fromPersistenceSnapshot(snapshot).telemetry()).toEqual(orchestrator.telemetry());
    });
    it("uses imported allocation delay before automatic admissions start", () => {
        const orchestrator = new AppOrchestrator({
            seed: 90232,
            tickRateHz: 4,
            pointerTileSize: 8,
            populationSchedule: [{ index: 0, month: 0, change: 3 }],
            allocationSettings: { delayMonths: 1 }
        });
        orchestrator.dispatch({ device: "ui", action: "pause-toggle", source: "ui:pause-toggle" });
        orchestrator.dispatch({ device: "ui", action: "admissions-toggle", source: "ui:admissions-toggle" });
        expect(orchestrator.telemetry()).toMatchObject({
            scenarioAllocationDelayMonths: 1,
            scenarioAllocationDelayTicks: 64,
            nextAdmissionInTicks: 64
        });
        for (let index = 0; index < 63; index += 1) {
            orchestrator.dispatch({ device: "ui", action: "step-tick", source: "ui:step" });
        }
        expect(orchestrator.getState().counters.totalAdmissions).toBe(0);
        expect(orchestrator.telemetry().nextAdmissionInTicks).toBe(1);
        orchestrator.dispatch({ device: "ui", action: "step-tick", source: "ui:step" });
        expect(orchestrator.getState().counters.totalAdmissions).toBe(1);
        const snapshot = orchestrator.createPersistenceSnapshot();
        expect(snapshot.allocationSettings).toEqual({ delayMonths: 1 });
        expect(AppOrchestrator.fromPersistenceSnapshot(snapshot).telemetry()).toEqual(orchestrator.telemetry());
    });
    it("uses imported scenario disease pools for automatic admissions", () => {
        const orchestrator = new AppOrchestrator({
            seed: 9024,
            tickRateHz: 4,
            pointerTileSize: 8,
            populationSchedule: [{ index: 0, month: 0, change: 3 }],
            diseasePool: [
                { source: "visuals", token: "I_BLOATY_HEAD", diseaseId: "cranial-pressure", severity: 3, weight: 2 },
                { source: "non_visuals", token: "I_UNCOMMON_COLD", diseaseId: "mild-cold", severity: 1, weight: 1 }
            ]
        });
        orchestrator.dispatch({ device: "ui", action: "pause-toggle", source: "ui:pause-toggle" });
        orchestrator.dispatch({ device: "ui", action: "admissions-toggle", source: "ui:admissions-toggle" });
        expect(orchestrator.telemetry().scenarioDiseasePoolSize).toBe(2);
        for (let index = 0; index < 20; index += 1) {
            orchestrator.dispatch({ device: "ui", action: "step-tick", source: "ui:step" });
        }
        expect(orchestrator.getState().entities.waitingPatients.map((patient) => patient.diseaseId)).toEqual([
            "cranial-pressure",
            "cranial-pressure"
        ]);
        expect(orchestrator.createPersistenceSnapshot().diseasePool).toEqual([
            { source: "visuals", token: "I_BLOATY_HEAD", diseaseId: "cranial-pressure", severity: 3, weight: 2 },
            { source: "non_visuals", token: "I_UNCOMMON_COLD", diseaseId: "mild-cold", severity: 1, weight: 1 }
        ]);
    });
    it("uses imported scenario disease weights for deterministic admissions", () => {
        const orchestrator = new AppOrchestrator({
            seed: 90241,
            tickRateHz: 4,
            pointerTileSize: 8,
            populationSchedule: [{ index: 0, month: 0, change: 10 }],
            diseasePool: [
                { source: "non_visuals", token: "I_UNCOMMON_COLD", diseaseId: "mild-cold", severity: 1, weight: 3 },
                { source: "non_visuals", token: "I_GUT_ROT", diseaseId: "gut-rot", severity: 3, weight: 1 }
            ]
        });
        orchestrator.dispatch({ device: "ui", action: "pause-toggle", source: "ui:pause-toggle" });
        orchestrator.dispatch({ device: "ui", action: "admissions-toggle", source: "ui:admissions-toggle" });
        for (let index = 0; index < 16; index += 1) {
            orchestrator.dispatch({ device: "ui", action: "step-tick", source: "ui:step" });
        }
        expect(orchestrator.createPersistenceSnapshot().commandLog
            .filter((command) => command.type === "admit-patient")
            .map((command) => command.diseaseId)).toEqual([
            "mild-cold",
            "mild-cold",
            "mild-cold",
            "gut-rot"
        ]);
    });
    it("uses imported allocation weights when selecting scenario diseases", () => {
        const orchestrator = new AppOrchestrator({
            seed: 90242,
            tickRateHz: 4,
            pointerTileSize: 8,
            populationSchedule: [{ index: 0, month: 0, change: 10 }],
            allocationSettings: {
                randomWeight: 1,
                totalReputationWeight: 1,
                illnessReputationWeight: 3
            },
            diseasePool: [
                { source: "non_visuals", token: "I_UNCOMMON_COLD", diseaseId: "mild-cold", severity: 1, weight: 1 },
                { source: "non_visuals", token: "I_GUT_ROT", diseaseId: "gut-rot", severity: 3, weight: 1 }
            ]
        });
        orchestrator.dispatch({ device: "ui", action: "pause-toggle", source: "ui:pause-toggle" });
        orchestrator.dispatch({ device: "ui", action: "admissions-toggle", source: "ui:admissions-toggle" });
        for (let index = 0; index < 16; index += 1) {
            orchestrator.dispatch({ device: "ui", action: "step-tick", source: "ui:step" });
        }
        expect(orchestrator.createPersistenceSnapshot().commandLog
            .filter((command) => command.type === "admit-patient")
            .map((command) => command.diseaseId)).toEqual([
            "mild-cold",
            "mild-cold",
            "mild-cold",
            "mild-cold"
        ]);
        for (let index = 0; index < 20; index += 1) {
            orchestrator.dispatch({ device: "ui", action: "step-tick", source: "ui:step" });
        }
        expect(orchestrator.createPersistenceSnapshot().commandLog
            .filter((command) => command.type === "admit-patient")
            .map((command) => command.diseaseId)).toEqual([
            "mild-cold",
            "mild-cold",
            "mild-cold",
            "mild-cold",
            "mild-cold",
            "mild-cold",
            "mild-cold",
            "mild-cold",
            "mild-cold"
        ]);
        for (let index = 0; index < 4; index += 1) {
            orchestrator.dispatch({ device: "ui", action: "step-tick", source: "ui:step" });
        }
        expect(orchestrator.createPersistenceSnapshot().commandLog
            .filter((command) => command.type === "admit-patient")
            .map((command) => command.diseaseId)).toContain("gut-rot");
    });
    it("uses imported scenario disease pools for manual admissions", () => {
        const orchestrator = new AppOrchestrator({
            seed: 9031,
            tickRateHz: 4,
            pointerTileSize: 8,
            diseasePool: [
                { source: "non_visuals", token: "I_UNCOMMON_COLD", diseaseId: "mild-cold", severity: 1 },
                { source: "non_visuals", token: "I_GUT_ROT", diseaseId: "gut-rot", severity: 3 }
            ]
        });
        expect(orchestrator.dispatch({
            device: "ui",
            action: "admit-patient",
            severity: 2,
            source: "ui:admit"
        })).toEqual(["patient.admitted"]);
        expect(orchestrator.dispatch({
            device: "ui",
            action: "admit-patient",
            severity: 2,
            source: "ui:admit"
        })).toEqual(["patient.admitted"]);
        expect(orchestrator.createPersistenceSnapshot().commandLog
            .filter((command) => command.type === "admit-patient")
            .map((command) => ({ severity: command.severity, diseaseId: command.diseaseId }))).toEqual([
            { severity: 1, diseaseId: "mild-cold" },
            { severity: 3, diseaseId: "gut-rot" }
        ]);
    });
    it("uses imported expertise diagnosis difficulty to gate scenario disease admissions", () => {
        const orchestrator = new AppOrchestrator({
            seed: 90311,
            tickRateHz: 4,
            pointerTileSize: 8,
            trainingSettings: { trainingRate: 200 },
            diseasePool: [
                { source: "non_visuals", token: "I_UNCOMMON_COLD", diseaseId: "mild-cold", severity: 1 },
                { source: "non_visuals", token: "I_GUT_ROT", diseaseId: "gut-rot", severity: 3 }
            ],
            expertise: [
                { index: 16, known: true, researchRequired: 0, contagiousRate: 4, maxDiagDifficulty: 100, token: "UNCOMMON_COLD", diseaseId: "mild-cold", severity: 1 },
                { index: 33, known: true, researchRequired: 0, maxDiagDifficulty: 200, token: "GUT_ROT", diseaseId: "gut-rot", severity: 3 }
            ]
        });
        expect(orchestrator.telemetry()).toMatchObject({
            scenarioDiagnosisCapability: 100,
            scenarioDiagnosableExpertiseCount: 1
        });
        expect(orchestrator.dispatch({
            device: "ui",
            action: "admit-patient",
            severity: 2,
            source: "ui:admit"
        })).toEqual(["patient.admitted"]);
        expect(orchestrator.createPersistenceSnapshot().commandLog
            .filter((command) => command.type === "admit-patient")
            .map((command) => command.diseaseId)).toEqual(["mild-cold"]);
        expect(orchestrator.dispatch({
            device: "ui",
            action: "train-staff",
            staffId: 1,
            source: "ui:train-selected-staff"
        })).toEqual(["training.started"]);
        orchestrator.advanceFrame(250);
        expect(orchestrator.telemetry()).toMatchObject({
            scenarioDiagnosisCapability: 200,
            scenarioDiagnosableExpertiseCount: 2
        });
        expect(orchestrator.dispatch({
            device: "ui",
            action: "admit-patient",
            severity: 2,
            source: "ui:admit"
        })).toEqual(["patient.admitted"]);
        expect(orchestrator.createPersistenceSnapshot().commandLog
            .filter((command) => command.type === "admit-patient")
            .map((command) => command.diseaseId)).toEqual(["mild-cold", "gut-rot"]);
        const snapshot = orchestrator.createPersistenceSnapshot();
        expect(snapshot.expertise[0]).toMatchObject({
            contagiousRate: 4,
            diseaseId: "mild-cold"
        });
        expect(AppOrchestrator.fromPersistenceSnapshot(snapshot).telemetry()).toEqual(orchestrator.telemetry());
    });
    it("uses imported scenario visual-illness hold rules for automatic admissions", () => {
        const orchestrator = new AppOrchestrator({
            seed: 9028,
            tickRateHz: 4,
            pointerTileSize: 8,
            populationSchedule: [{ index: 0, month: 0, change: 3 }],
            admissionRules: { holdVisualMonths: 1, holdVisualPeepCount: 2 },
            diseasePool: [
                { source: "visuals", token: "I_BLOATY_HEAD", diseaseId: "cranial-pressure", severity: 3 },
                { source: "non_visuals", token: "I_UNCOMMON_COLD", diseaseId: "mild-cold", severity: 1 },
                { source: "visuals", token: "I_SLACK_TONGUE", diseaseId: "slack-tongue", severity: 2 }
            ]
        });
        orchestrator.dispatch({ device: "ui", action: "pause-toggle", source: "ui:pause-toggle" });
        orchestrator.dispatch({ device: "ui", action: "admissions-toggle", source: "ui:admissions-toggle" });
        expect(orchestrator.telemetry()).toMatchObject({
            scenarioHoldVisualMonths: 1,
            scenarioHoldVisualPeepCount: 2
        });
        for (let index = 0; index < 30; index += 1) {
            orchestrator.dispatch({ device: "ui", action: "step-tick", source: "ui:step" });
        }
        expect(orchestrator.createPersistenceSnapshot().commandLog
            .filter((command) => command.type === "admit-patient")
            .map((command) => command.diseaseId)).toEqual([
            "mild-cold",
            "mild-cold",
            "mild-cold"
        ]);
        for (let index = 0; index < 44; index += 1) {
            orchestrator.dispatch({ device: "ui", action: "step-tick", source: "ui:step" });
        }
        expect(orchestrator.createPersistenceSnapshot().commandLog
            .filter((command) => command.type === "admit-patient")
            .map((command) => command.diseaseId)).toContain("cranial-pressure");
        const snapshot = orchestrator.createPersistenceSnapshot();
        expect(snapshot.admissionRules).toEqual({ holdVisualMonths: 1, holdVisualPeepCount: 2 });
        expect(AppOrchestrator.fromPersistenceSnapshot(snapshot).telemetry()).toEqual(orchestrator.telemetry());
    });
    it("uses imported visuals-available months for automatic admissions", () => {
        const orchestrator = new AppOrchestrator({
            seed: 90282,
            tickRateHz: 4,
            pointerTileSize: 8,
            populationSchedule: [{ index: 0, month: 0, change: 10 }],
            diseasePool: [
                { source: "visuals_available", index: 13, availableMonth: 1, token: "I_TRANSPARENCY", diseaseId: "transparency", severity: 1 },
                { source: "non_visuals", token: "I_UNCOMMON_COLD", diseaseId: "mild-cold", severity: 1 }
            ]
        });
        orchestrator.dispatch({ device: "ui", action: "pause-toggle", source: "ui:pause-toggle" });
        orchestrator.dispatch({ device: "ui", action: "admissions-toggle", source: "ui:admissions-toggle" });
        for (let index = 0; index < 40; index += 1) {
            orchestrator.dispatch({ device: "ui", action: "step-tick", source: "ui:step" });
        }
        const earlyDiseaseIds = orchestrator.createPersistenceSnapshot().commandLog
            .filter((command) => command.type === "admit-patient")
            .map((command) => command.diseaseId);
        expect(earlyDiseaseIds.length).toBeGreaterThan(0);
        expect(earlyDiseaseIds).toEqual(earlyDiseaseIds.map(() => "mild-cold"));
        for (let index = 0; index < 36; index += 1) {
            orchestrator.dispatch({ device: "ui", action: "step-tick", source: "ui:step" });
        }
        expect(orchestrator.createPersistenceSnapshot().commandLog
            .filter((command) => command.type === "admit-patient")
            .map((command) => command.diseaseId)).toContain("transparency");
        expect(orchestrator.createPersistenceSnapshot().diseasePool).toEqual([
            { index: 13, source: "visuals_available", token: "I_TRANSPARENCY", diseaseId: "transparency", severity: 1, weight: 1, availableMonth: 1 },
            { source: "non_visuals", token: "I_UNCOMMON_COLD", diseaseId: "mild-cold", severity: 1, weight: 1 }
        ]);
    });
    it("uses imported scenario object availability to gate disease admissions", () => {
        const orchestrator = new AppOrchestrator({
            seed: 90283,
            tickRateHz: 4,
            pointerTileSize: 8,
            populationSchedule: [{ index: 0, month: 0, change: 10 }],
            roomAvailability: [],
            roomAvailabilitySchedule: [
                { index: 24, roomType: "specialist", startAvailable: false, whenAvailable: 1, availableForLevel: true }
            ],
            diseasePool: [
                { source: "non_visuals", token: "I_BROKEN_BONES", diseaseId: "fractured-bones", severity: 2, weight: 9 },
                { source: "non_visuals", token: "I_UNCOMMON_COLD", diseaseId: "mild-cold", severity: 1, weight: 1 }
            ]
        });
        orchestrator.dispatch({ device: "ui", action: "pause-toggle", source: "ui:pause-toggle" });
        orchestrator.dispatch({ device: "ui", action: "admissions-toggle", source: "ui:admissions-toggle" });
        for (let index = 0; index < 40; index += 1) {
            orchestrator.dispatch({ device: "ui", action: "step-tick", source: "ui:step" });
        }
        const earlyDiseaseIds = orchestrator.createPersistenceSnapshot().commandLog
            .filter((command) => command.type === "admit-patient")
            .map((command) => command.diseaseId);
        expect(earlyDiseaseIds.length).toBeGreaterThan(0);
        expect(earlyDiseaseIds).toEqual(earlyDiseaseIds.map(() => "mild-cold"));
        for (let index = 0; index < 36; index += 1) {
            orchestrator.dispatch({ device: "ui", action: "step-tick", source: "ui:step" });
        }
        expect(orchestrator.createPersistenceSnapshot().commandLog
            .filter((command) => command.type === "admit-patient")
            .map((command) => command.diseaseId)).toContain("fractured-bones");
        const snapshot = orchestrator.createPersistenceSnapshot();
        expect(snapshot.roomAvailabilitySchedule).toEqual([
            { index: 24, roomType: "specialist", startAvailable: false, whenAvailable: 1, availableForLevel: true }
        ]);
        expect(AppOrchestrator.fromPersistenceSnapshot(snapshot).telemetry()).toEqual(orchestrator.telemetry());
    });
    it("uses imported equipment availability to avoid unlocking unrelated specialist diseases", () => {
        const orchestrator = new AppOrchestrator({
            seed: 90284,
            tickRateHz: 4,
            pointerTileSize: 8,
            populationSchedule: [{ index: 0, month: 0, change: 10 }],
            roomAvailability: [],
            roomAvailabilitySchedule: [
                { index: 24, roomType: "specialist", startAvailable: true, whenAvailable: 0, availableForLevel: true },
                { index: 25, roomType: "specialist", startAvailable: false, whenAvailable: 1, availableForLevel: true }
            ],
            diseasePool: [
                { source: "non_visuals", token: "I_BALDNESS", diseaseId: "baldness", severity: 2, weight: 9 },
                { source: "non_visuals", token: "I_BROKEN_BONES", diseaseId: "fractured-bones", severity: 2, weight: 1 }
            ]
        });
        orchestrator.dispatch({ device: "ui", action: "pause-toggle", source: "ui:pause-toggle" });
        orchestrator.dispatch({ device: "ui", action: "admissions-toggle", source: "ui:admissions-toggle" });
        for (let index = 0; index < 40; index += 1) {
            orchestrator.dispatch({ device: "ui", action: "step-tick", source: "ui:step" });
        }
        const earlyDiseaseIds = orchestrator.createPersistenceSnapshot().commandLog
            .filter((command) => command.type === "admit-patient")
            .map((command) => command.diseaseId);
        expect(earlyDiseaseIds.length).toBeGreaterThan(0);
        expect(earlyDiseaseIds).toEqual(earlyDiseaseIds.map(() => "fractured-bones"));
        for (let index = 0; index < 36; index += 1) {
            orchestrator.dispatch({ device: "ui", action: "step-tick", source: "ui:step" });
        }
        expect(orchestrator.createPersistenceSnapshot().commandLog
            .filter((command) => command.type === "admit-patient")
            .map((command) => command.diseaseId)).toContain("baldness");
    });
    it("uses imported contagious illness reducers for automatic admissions", () => {
        const orchestrator = new AppOrchestrator({
            seed: 90281,
            tickRateHz: 4,
            pointerTileSize: 8,
            populationSchedule: [{ index: 0, month: 0, change: 10 }],
            epidemicSettings: {
                reduceContagiousMonths: 1,
                reduceContagiousPeepCount: 2,
                reduceContagiousRate: 0
            },
            diseasePool: [
                { source: "non_visuals", token: "I_INFECTIOUS_LAUGHTER", diseaseId: "infectious-laughter", severity: 2, weight: 9 },
                { source: "non_visuals", token: "I_UNCOMMON_COLD", diseaseId: "mild-cold", severity: 1, weight: 1 }
            ]
        });
        orchestrator.dispatch({ device: "ui", action: "pause-toggle", source: "ui:pause-toggle" });
        orchestrator.dispatch({ device: "ui", action: "admissions-toggle", source: "ui:admissions-toggle" });
        for (let index = 0; index < 40; index += 1) {
            orchestrator.dispatch({ device: "ui", action: "step-tick", source: "ui:step" });
        }
        const earlyDiseaseIds = orchestrator.createPersistenceSnapshot().commandLog
            .filter((command) => command.type === "admit-patient")
            .map((command) => command.diseaseId);
        expect(earlyDiseaseIds.length).toBeGreaterThan(0);
        expect(earlyDiseaseIds).toEqual(earlyDiseaseIds.map(() => "mild-cold"));
        for (let index = 0; index < 36; index += 1) {
            orchestrator.dispatch({ device: "ui", action: "step-tick", source: "ui:step" });
        }
        expect(orchestrator.createPersistenceSnapshot().commandLog
            .filter((command) => command.type === "admit-patient")
            .map((command) => command.diseaseId)).toContain("infectious-laughter");
        const snapshot = orchestrator.createPersistenceSnapshot();
        expect(snapshot.epidemicSettings).toEqual({
            reduceContagiousMonths: 1,
            reduceContagiousPeepCount: 2,
            reduceContagiousRate: 0
        });
        expect(AppOrchestrator.fromPersistenceSnapshot(snapshot).telemetry()).toEqual(orchestrator.telemetry());
    });
    it("uses imported contagious rates to classify contagious automatic admissions", () => {
        const contagiousFromRate = new AppOrchestrator({
            seed: 90282,
            tickRateHz: 4,
            pointerTileSize: 8,
            populationSchedule: [{ index: 0, month: 0, change: 10 }],
            epidemicSettings: {
                reduceContagiousMonths: 1,
                reduceContagiousPeepCount: 2,
                reduceContagiousRate: 0
            },
            expertise: [
                { index: 22, known: true, researchRequired: 0, contagiousRate: 5, token: "BLOATY_HEAD", diseaseId: "cranial-pressure", severity: 3 }
            ],
            diseasePool: [
                { source: "non_visuals", token: "I_BLOATY_HEAD", diseaseId: "cranial-pressure", severity: 3, weight: 9 },
                { source: "non_visuals", token: "I_UNCOMMON_COLD", diseaseId: "mild-cold", severity: 1, weight: 1 }
            ]
        });
        contagiousFromRate.dispatch({ device: "ui", action: "pause-toggle", source: "ui:pause-toggle" });
        contagiousFromRate.dispatch({ device: "ui", action: "admissions-toggle", source: "ui:admissions-toggle" });
        for (let index = 0; index < 40; index += 1) {
            contagiousFromRate.dispatch({ device: "ui", action: "step-tick", source: "ui:step" });
        }
        const earlyRateDiseaseIds = contagiousFromRate.createPersistenceSnapshot().commandLog
            .filter((command) => command.type === "admit-patient")
            .map((command) => command.diseaseId);
        expect(earlyRateDiseaseIds.length).toBeGreaterThan(0);
        expect(earlyRateDiseaseIds).toEqual(earlyRateDiseaseIds.map(() => "mild-cold"));

        const nonContagiousFromRate = new AppOrchestrator({
            seed: 90283,
            tickRateHz: 4,
            pointerTileSize: 8,
            populationSchedule: [{ index: 0, month: 0, change: 10 }],
            epidemicSettings: {
                reduceContagiousMonths: 1,
                reduceContagiousPeepCount: 2,
                reduceContagiousRate: 0
            },
            expertise: [
                { index: 29, known: true, researchRequired: 0, contagiousRate: 0, token: "INFECTIOUS_LAUGHTER", diseaseId: "infectious-laughter", severity: 2 }
            ],
            diseasePool: [
                { source: "non_visuals", token: "I_INFECTIOUS_LAUGHTER", diseaseId: "infectious-laughter", severity: 2, weight: 9 }
            ]
        });
        nonContagiousFromRate.dispatch({ device: "ui", action: "pause-toggle", source: "ui:pause-toggle" });
        nonContagiousFromRate.dispatch({ device: "ui", action: "admissions-toggle", source: "ui:admissions-toggle" });
        for (let index = 0; index < 40; index += 1) {
            nonContagiousFromRate.dispatch({ device: "ui", action: "step-tick", source: "ui:step" });
        }
        const earlyZeroRateDiseaseIds = nonContagiousFromRate.createPersistenceSnapshot().commandLog
            .filter((command) => command.type === "admit-patient")
            .map((command) => command.diseaseId);
        expect(earlyZeroRateDiseaseIds.length).toBeGreaterThan(0);
        expect(earlyZeroRateDiseaseIds).toEqual(earlyZeroRateDiseaseIds.map(() => "infectious-laughter"));
    });
    it("uses imported scenario staff levels as the browser hiring market", () => {
        const orchestrator = new AppOrchestrator({
            seed: 9025,
            tickRateHz: 4,
            pointerTileSize: 8,
            staffMarketSchedule: [
                { index: 0, month: 0, doctors: 1, nurses: 1, handymen: 1, receptionists: 2, seed: 4953, shrinkRate: 3, surgeonRate: 0, researcherRate: 1, consultantRate: 2, juniorRate: 10 },
                { index: 1, month: 1, doctors: 2, nurses: 1, handymen: 0, receptionists: 1, seed: 5001, shrinkRate: 4, surgeonRate: 1, researcherRate: 2, consultantRate: 3, juniorRate: 9 }
            ]
        });
        expect(orchestrator.telemetry()).toMatchObject({
            staffMarketDoctorsAvailable: 0,
            staffMarketNursesAvailable: 0,
            staffMarketHandymenAvailable: 1,
            staffMarketReceptionistsAvailable: 2,
            scenarioStaffMarketMonth: 0,
            scenarioStaffMarketReceptionists: 2,
            scenarioStaffMarketSeed: 4953,
            scenarioStaffMarketShrinkRate: 3,
            scenarioStaffMarketSurgeonRate: 0,
            scenarioStaffMarketResearcherRate: 1,
            scenarioStaffMarketConsultantRate: 2,
            scenarioStaffMarketJuniorRate: 10
        });
        expect(orchestrator.evaluatePlacement({
            device: "ui",
            action: "hire-staff",
            role: "diagnostician",
            source: "ui:hire-diagnostician",
            pointer: { x: 80, y: 80 }
        })).toMatchObject({
            valid: false,
            reason: "staff-market-empty"
        });
        expect(orchestrator.dispatch({
            device: "ui",
            action: "hire-staff",
            role: "diagnostician",
            source: "ui:hire-diagnostician",
            pointer: { x: 80, y: 80 }
        })).toEqual(["staff.hire-blocked"]);
        expect(orchestrator.dispatch({
            device: "ui",
            action: "hire-staff",
            role: "handyman",
            source: "ui:hire-handyman",
            pointer: { x: 80, y: 80 }
        })).toEqual(["staff.hired"]);
        expect(orchestrator.telemetry().staffMarketHandymenAvailable).toBe(0);
        expect(orchestrator.getState().entities.staff.find((staff) => staff.role === "handyman" && staff.position.x === 10)).toMatchObject({
            skillLevel: 1
        });
        const snapshot = orchestrator.createPersistenceSnapshot();
        expect(snapshot.commandLog).toContainEqual({
            type: "hire-staff",
            role: "handyman",
            initialSkillLevel: 1,
            position: { x: 10, y: 10 }
        });
        expect(snapshot.staffMarketSchedule).toEqual([
            { index: 0, month: 0, doctors: 1, nurses: 1, handymen: 1, receptionists: 2, seed: 4953, shrinkRate: 3, surgeonRate: 0, researcherRate: 1, consultantRate: 2, juniorRate: 10 },
            { index: 1, month: 1, doctors: 2, nurses: 1, handymen: 0, receptionists: 1, seed: 5001, shrinkRate: 4, surgeonRate: 1, researcherRate: 2, consultantRate: 3, juniorRate: 9 }
        ]);
        expect(AppOrchestrator.fromPersistenceSnapshot(snapshot).telemetry()).toEqual(orchestrator.telemetry());
    });
    it("uses imported staff market seeds for deterministic doctor specialty rolls", () => {
        const seededSpecialty = new AppOrchestrator({
            seed: 90250,
            tickRateHz: 4,
            pointerTileSize: 8,
            staffMarketSchedule: [
                { index: 0, month: 0, doctors: 3, nurses: 1, handymen: 1, receptionists: 1, seed: 0, shrinkRate: 50, surgeonRate: 0, researcherRate: 0 }
            ]
        });
        expect(seededSpecialty.dispatch({
            device: "ui",
            action: "hire-staff",
            role: "diagnostician",
            source: "ui:hire-diagnostician",
            pointer: { x: 80, y: 80 }
        })).toEqual(["staff.hired"]);
        expect(seededSpecialty.telemetry().scenarioStaffMarketSeed).toBe(0);
        expect(seededSpecialty.getState().entities.staff.find((staff) => staff.specialties?.includes("psychiatrist"))).toMatchObject({
            role: "diagnostician",
            specialties: ["psychiatrist"]
        });
        expect(seededSpecialty.createPersistenceSnapshot().commandLog).toContainEqual({
            type: "hire-staff",
            role: "diagnostician",
            initialSpecialties: ["psychiatrist"],
            position: { x: 10, y: 10 }
        });
        const unseededSpecialty = new AppOrchestrator({
            seed: 90250,
            tickRateHz: 4,
            pointerTileSize: 8,
            staffMarketSchedule: [
                { index: 0, month: 0, doctors: 3, nurses: 1, handymen: 1, receptionists: 1, seed: 1, shrinkRate: 50, surgeonRate: 0, researcherRate: 0 }
            ]
        });
        expect(unseededSpecialty.dispatch({
            device: "ui",
            action: "hire-staff",
            role: "diagnostician",
            source: "ui:hire-diagnostician",
            pointer: { x: 80, y: 80 }
        })).toEqual(["staff.hired"]);
        expect(unseededSpecialty.telemetry().scenarioStaffMarketSeed).toBe(1);
        expect(unseededSpecialty.createPersistenceSnapshot().commandLog).toContainEqual({
            type: "hire-staff",
            role: "diagnostician",
            position: { x: 10, y: 10 }
        });
    });
    it("uses hired receptionists from imported staff levels as automatic admission front-desk capacity", () => {
        const blocked = new AppOrchestrator({
            seed: 90250,
            tickRateHz: 4,
            pointerTileSize: 8,
            populationSchedule: [{ index: 0, month: 0, change: 10 }],
            staffMarketSchedule: [
                { index: 0, month: 0, doctors: 1, nurses: 1, handymen: 1, receptionists: 0 }
            ]
        });
        blocked.dispatch({ device: "ui", action: "pause-toggle", source: "ui:pause-toggle" });
        blocked.dispatch({ device: "ui", action: "admissions-toggle", source: "ui:admissions-toggle" });
        expect(blocked.telemetry()).toMatchObject({
            autoAdmissionWaitingCap: 0,
            staffMarketReceptionistsAvailable: 0,
            scenarioStaffMarketReceptionists: 0
        });
        for (let index = 0; index < 20; index += 1) {
            blocked.dispatch({ device: "ui", action: "step-tick", source: "ui:step" });
        }
        expect(blocked.createPersistenceSnapshot().commandLog
            .filter((command) => command.type === "admit-patient")).toHaveLength(0);
        const staffed = new AppOrchestrator({
            seed: 90250,
            tickRateHz: 4,
            pointerTileSize: 8,
            populationSchedule: [{ index: 0, month: 0, change: 10 }],
            staffMarketSchedule: [
                { index: 0, month: 0, doctors: 1, nurses: 1, handymen: 1, receptionists: 1 }
            ]
        });
        staffed.dispatch({ device: "ui", action: "pause-toggle", source: "ui:pause-toggle" });
        staffed.dispatch({ device: "ui", action: "admissions-toggle", source: "ui:admissions-toggle" });
        expect(staffed.telemetry()).toMatchObject({
            autoAdmissionWaitingCap: 0,
            staffMarketReceptionistsAvailable: 1,
            scenarioStaffMarketReceptionists: 1
        });
        expect(staffed.dispatch({
            device: "ui",
            action: "hire-staff",
            role: "receptionist",
            source: "ui:hire-receptionist",
            pointer: { x: 16, y: 32 }
        })).toEqual(["staff.hired"]);
        expect(staffed.telemetry()).toMatchObject({
            autoAdmissionWaitingCap: 4,
            staffMarketReceptionistsAvailable: 0,
            scenarioStaffMarketReceptionists: 1
        });
        for (let index = 0; index < 20; index += 1) {
            staffed.dispatch({ device: "ui", action: "step-tick", source: "ui:step" });
        }
        expect(staffed.createPersistenceSnapshot().commandLog
            .filter((command) => command.type === "admit-patient").length).toBeGreaterThan(0);
    });
    it("uses imported researcher staff market rate for hired doctor research speed", () => {
        const orchestrator = new AppOrchestrator({
            seed: 90251,
            tickRateHz: 4,
            pointerTileSize: 8,
            staffMarketSchedule: [
                { index: 0, month: 0, doctors: 2, nurses: 1, handymen: 1, receptionists: 0, shrinkRate: 0, surgeonRate: 0, researcherRate: 100, consultantRate: 0, juniorRate: 0 }
            ]
        });
        expect(orchestrator.dispatch({
            device: "ui",
            action: "hire-staff",
            role: "diagnostician",
            source: "ui:hire-diagnostician",
            pointer: { x: 80, y: 80 }
        })).toEqual(["staff.hired"]);
        const researcher = orchestrator.getState().entities.staff.find((staff) => staff.specialties?.includes("researcher"));
        expect(researcher).toMatchObject({
            role: "diagnostician",
            specialties: ["researcher"]
        });
        expect(orchestrator.dispatch({
            device: "ui",
            action: "start-research",
            source: "ui:start-research"
        })).toEqual(["research.started"]);
        expect(orchestrator.telemetry()).toMatchObject({
            scenarioStaffMarketResearcherRate: 100,
            treatmentResearchActiveResearchers: 1,
            treatmentResearchTicksPerTick: 2,
            treatmentResearchRemainingTicks: 6
        });
        for (let index = 0; index < 3; index += 1) {
            orchestrator.advanceFrame(250);
        }
        expect(orchestrator.telemetry()).toMatchObject({
            treatmentResearchLevel: 1,
            treatmentResearchActive: false,
            treatmentResearchRemainingTicks: 0
        });
        expect(orchestrator.createPersistenceSnapshot().commandLog).toContainEqual({
            type: "hire-staff",
            role: "diagnostician",
            initialSkillLevel: 1,
            initialSpecialties: ["researcher"],
            position: { x: 10, y: 10 }
        });
    });
    it("combines imported ability thresholds with staff market specialty rates for hired doctors", () => {
        const orchestrator = new AppOrchestrator({
            seed: 90251,
            tickRateHz: 4,
            pointerTileSize: 8,
            trainingSettings: {
                doctorThreshold: 250,
                consultantThreshold: 750,
                abilityThresholds: [
                    { index: 0, value: 75, name: "SURGEON" },
                    { index: 1, value: 60, name: "PSYCHO" },
                    { index: 2, value: 45, name: "RESEARCHER" }
                ]
            },
            staffMarketSchedule: [
                { index: 0, month: 0, doctors: 2, nurses: 1, handymen: 1, receptionists: 0, seed: 4953, shrinkRate: 0, surgeonRate: 0, researcherRate: 100, consultantRate: 0, juniorRate: 0 }
            ]
        });
        expect(orchestrator.dispatch({
            device: "ui",
            action: "hire-staff",
            role: "diagnostician",
            source: "ui:hire-diagnostician",
            pointer: { x: 80, y: 80 }
        })).toEqual(["staff.hired"]);
        expect(orchestrator.getState().entities.staff.find((staff) => staff.specialties?.includes("researcher"))).toMatchObject({
            role: "diagnostician",
            specialties: expect.arrayContaining(["researcher"])
        });
        expect(orchestrator.createPersistenceSnapshot().commandLog).toContainEqual(expect.objectContaining({
            type: "hire-staff",
            role: "diagnostician",
            initialSpecialties: expect.arrayContaining(["researcher"])
        }));
        expect(AppOrchestrator.fromPersistenceSnapshot(orchestrator.createPersistenceSnapshot()).telemetry()).toMatchObject({
            treatmentResearchActiveResearchers: 1,
            treatmentResearchTicksPerTick: 2
        });
    });
    it("uses imported surgeon staff market rate for hired doctor specialties", () => {
        const orchestrator = new AppOrchestrator({
            seed: 90252,
            tickRateHz: 4,
            pointerTileSize: 8,
            staffMarketSchedule: [
                { index: 0, month: 0, doctors: 2, nurses: 1, handymen: 1, receptionists: 0, shrinkRate: 0, surgeonRate: 100, researcherRate: 0, consultantRate: 0, juniorRate: 0 }
            ]
        });
        expect(orchestrator.dispatch({
            device: "ui",
            action: "hire-staff",
            role: "diagnostician",
            source: "ui:hire-diagnostician",
            pointer: { x: 80, y: 80 }
        })).toEqual(["staff.hired"]);
        expect(orchestrator.getState().entities.staff.find((staff) => staff.specialties?.includes("surgeon"))).toMatchObject({
            role: "diagnostician",
            specialties: ["surgeon"]
        });
        expect(orchestrator.createPersistenceSnapshot().commandLog).toContainEqual({
            type: "hire-staff",
            role: "diagnostician",
            initialSkillLevel: 1,
            initialSpecialties: ["surgeon"],
            position: { x: 10, y: 10 }
        });
    });
    it("uses imported shrink staff market rate for hired doctor specialties", () => {
        const orchestrator = new AppOrchestrator({
            seed: 90253,
            tickRateHz: 4,
            pointerTileSize: 8,
            staffMarketSchedule: [
                { index: 0, month: 0, doctors: 2, nurses: 1, handymen: 1, receptionists: 0, shrinkRate: 100, surgeonRate: 0, researcherRate: 0, consultantRate: 0, juniorRate: 0 }
            ]
        });
        expect(orchestrator.dispatch({
            device: "ui",
            action: "hire-staff",
            role: "diagnostician",
            source: "ui:hire-diagnostician",
            pointer: { x: 80, y: 80 }
        })).toEqual(["staff.hired"]);
        expect(orchestrator.telemetry()).toMatchObject({
            scenarioStaffMarketShrinkRate: 100
        });
        expect(orchestrator.getState().entities.staff.find((staff) => staff.specialties?.includes("psychiatrist"))).toMatchObject({
            role: "diagnostician",
            specialties: ["psychiatrist"]
        });
        expect(orchestrator.createPersistenceSnapshot().commandLog).toContainEqual({
            type: "hire-staff",
            role: "diagnostician",
            initialSkillLevel: 1,
            initialSpecialties: ["psychiatrist"],
            position: { x: 10, y: 10 }
        });
    });
    it("applies imported training thresholds to browser staff hiring quality", () => {
        const orchestrator = new AppOrchestrator({
            seed: 9039,
            tickRateHz: 4,
            pointerTileSize: 8,
            staffMarketSchedule: [
                { index: 0, month: 0, doctors: 2, nurses: 2, handymen: 1, receptionists: 0 }
            ],
            trainingSettings: {
                doctorThreshold: 500,
                consultantThreshold: 900
            }
        });
        expect(orchestrator.dispatch({
            device: "ui",
            action: "hire-staff",
            role: "diagnostician",
            source: "ui:hire-diagnostician",
            pointer: { x: 80, y: 80 }
        })).toEqual(["staff.hired"]);
        const hiredDoctor = orchestrator.getState().entities.staff
            .filter((staff) => staff.role === "diagnostician")
            .sort((left, right) => right.id - left.id)[0];
        expect(hiredDoctor).toMatchObject({
            skillLevel: 3
        });
        const snapshot = orchestrator.createPersistenceSnapshot();
        expect(snapshot.commandLog).toContainEqual({
            type: "hire-staff",
            role: "diagnostician",
            initialSkillLevel: 3,
            position: { x: 10, y: 10 }
        });
        expect(AppOrchestrator.fromPersistenceSnapshot(snapshot).telemetry()).toEqual(orchestrator.telemetry());
    });
    it("applies imported ability thresholds to browser doctor specialties", () => {
        const orchestrator = new AppOrchestrator({
            seed: 1,
            tickRateHz: 4,
            pointerTileSize: 8,
            staffMarketSchedule: [
                { index: 0, month: 0, doctors: 2, nurses: 1, handymen: 1, receptionists: 0 }
            ],
            trainingSettings: {
                abilityThresholds: [
                    { index: 0, value: 500, name: "SURGEON" },
                    { index: 1, value: 600, name: "PSYCHO" },
                    { index: 2, value: 400, name: "RESEARCHER" }
                ]
            }
        });
        expect(orchestrator.dispatch({
            device: "ui",
            action: "hire-staff",
            role: "diagnostician",
            source: "ui:hire-diagnostician",
            pointer: { x: 80, y: 80 }
        })).toEqual(["staff.hired"]);
        const hiredDoctor = orchestrator.getState().entities.staff
            .filter((staff) => staff.role === "diagnostician")
            .sort((left, right) => right.id - left.id)[0];
        expect(hiredDoctor.specialties).toEqual(["surgeon", "researcher"]);
        expect(orchestrator.telemetry()).toMatchObject({
            scenarioTrainingAbilityThresholdCount: 3
        });
        const snapshot = orchestrator.createPersistenceSnapshot();
        expect(snapshot.commandLog).toContainEqual({
            type: "hire-staff",
            role: "diagnostician",
            initialSpecialties: ["surgeon", "researcher"],
            position: { x: 10, y: 10 }
        });
        expect(AppOrchestrator.fromPersistenceSnapshot(snapshot).telemetry()).toEqual(orchestrator.telemetry());
    });
    it("applies imported salary settings to skilled staff hired from the browser market", () => {
        const orchestrator = new AppOrchestrator({
            seed: 9026,
            tickRateHz: 4,
            pointerTileSize: 8,
            staffMarketSchedule: [
                { index: 0, month: 0, doctors: 2, nurses: 2, handymen: 1, receptionists: 0, consultantRate: 100, juniorRate: 0 }
            ],
            salarySettings: {
                salaryAbilityDivisor: 10,
                salaryTooHigh: 20,
                salaryAdds: [
                    { index: 3, value: -30, name: "Junior" },
                    { index: 7, value: 100, name: "Consultant" }
                ]
            }
        });
        expect(orchestrator.dispatch({
            device: "ui",
            action: "hire-staff",
            role: "nurse",
            source: "ui:hire-nurse",
            pointer: { x: 80, y: 80 }
        })).toEqual(["staff.hired"]);
        expect(orchestrator.getState().entities.staff.find((staff) => staff.role === "nurse" && staff.position.x === 10)).toMatchObject({
            skillLevel: 3,
            wageCostPerTick: 17
        });
        expect(orchestrator.telemetry()).toMatchObject({
            underpaidStaff: 0,
            overpaidStaff: 1
        });
        orchestrator.dispatch({ device: "ui", action: "pause-toggle", source: "ui:pause-toggle" });
        orchestrator.dispatch({ device: "ui", action: "step-tick", source: "ui:step" });
        expect(orchestrator.telemetry().tickExpenses).toBeGreaterThan(20);
        const snapshot = orchestrator.createPersistenceSnapshot();
        expect(snapshot.commandLog).toContainEqual({
            type: "hire-staff",
            role: "nurse",
            initialSkillLevel: 3,
            position: { x: 10, y: 10 }
        });
        expect(AppOrchestrator.fromPersistenceSnapshot(snapshot).telemetry()).toEqual(orchestrator.telemetry());
    });
    it("surfaces slice 4 secondary-system telemetry deterministically", () => {
        const orchestrator = new AppOrchestrator({ seed: 9012, tickRateHz: 4, pointerTileSize: 8 });
        orchestrator.dispatch({ device: "ui", action: "pause-toggle", source: "ui:pause-toggle" });
        for (let i = 0; i < 4; i += 1) {
            orchestrator.dispatch({
                device: "ui",
                action: "admit-patient",
                severity: 3,
                source: "ui:admit",
                pointer: { x: 16, y: 16 }
            });
        }
        for (let i = 0; i < 96; i += 1) {
            orchestrator.dispatch({ device: "ui", action: "step-tick", source: "ui:step" });
        }
        const telemetry = orchestrator.telemetry();
        expect(telemetry.queuePressureStatus).toBe("normal");
        expect(telemetry.queuePressureEvents).toBeGreaterThanOrEqual(2);
        expect(telemetry.staffBurnoutEvents).toBeGreaterThan(0);
        expect(telemetry.staffRecoveryEvents).toBeGreaterThan(0);
        expect(telemetry.roomMaintenanceStartEvents).toBeGreaterThan(0);
        expect(telemetry.roomMaintenanceCompleteEvents).toBeGreaterThan(0);
    });
    it("applies imported staff modify frequency to app-level burnout timing", () => {
        const immediate = new AppOrchestrator({
            seed: 9013,
            tickRateHz: 4,
            pointerTileSize: 8,
            staffFatigueSettings: { crackUpTired: 100, recoveryMinimum: 3 }
        });
        const delayed = new AppOrchestrator({
            seed: 9013,
            tickRateHz: 4,
            pointerTileSize: 8,
            staffFatigueSettings: { crackUpTired: 100, recoveryMinimum: 3, modifyFrequency: 4 }
        });
        immediate.dispatch({ device: "ui", action: "pause-toggle", source: "ui:pause-toggle" });
        delayed.dispatch({ device: "ui", action: "pause-toggle", source: "ui:pause-toggle" });
        for (let i = 0; i < 4; i += 1) {
            immediate.dispatch({ device: "ui", action: "admit-patient", severity: 3, source: "ui:admit", pointer: { x: 16, y: 16 } });
            delayed.dispatch({ device: "ui", action: "admit-patient", severity: 3, source: "ui:admit", pointer: { x: 16, y: 16 } });
        }
        for (let i = 0; i < 3; i += 1) {
            immediate.dispatch({ device: "ui", action: "step-tick", source: "ui:step" });
            delayed.dispatch({ device: "ui", action: "step-tick", source: "ui:step" });
        }
        expect(immediate.telemetry().staffBurnoutEvents).toBeGreaterThan(0);
        expect(delayed.telemetry().staffBurnoutEvents).toBe(0);
        delayed.dispatch({ device: "ui", action: "step-tick", source: "ui:step" });
        expect(delayed.telemetry().staffBurnoutEvents).toBeGreaterThan(0);
    });
    it("applies imported staff work light to app-level burnout timing", () => {
        const defaultWork = new AppOrchestrator({
            seed: 9015,
            tickRateHz: 4,
            pointerTileSize: 8,
            staffFatigueSettings: { crackUpTired: 400, recoveryMinimum: 3 }
        });
        const heavierWork = new AppOrchestrator({
            seed: 9015,
            tickRateHz: 4,
            pointerTileSize: 8,
            staffFatigueSettings: { crackUpTired: 400, recoveryMinimum: 3, workLight: 2 }
        });
        defaultWork.dispatch({ device: "ui", action: "pause-toggle", source: "ui:pause-toggle" });
        heavierWork.dispatch({ device: "ui", action: "pause-toggle", source: "ui:pause-toggle" });
        for (let i = 0; i < 4; i += 1) {
            defaultWork.dispatch({ device: "ui", action: "admit-patient", severity: 3, source: "ui:admit", pointer: { x: 16, y: 16 } });
            heavierWork.dispatch({ device: "ui", action: "admit-patient", severity: 3, source: "ui:admit", pointer: { x: 16, y: 16 } });
        }
        for (let i = 0; i < 3; i += 1) {
            defaultWork.dispatch({ device: "ui", action: "step-tick", source: "ui:step" });
            heavierWork.dispatch({ device: "ui", action: "step-tick", source: "ui:step" });
        }
        expect(defaultWork.telemetry().staffBurnoutEvents).toBe(0);
        expect(heavierWork.telemetry().staffBurnoutEvents).toBeGreaterThan(0);
    });
    it("applies imported staff resign max to app-level repeated burnout resignations", () => {
        const orchestrator = new AppOrchestrator({
            seed: 9053,
            tickRateHz: 4,
            pointerTileSize: 8,
            staffFatigueSettings: { crackUpTired: 100, recoveryMinimum: 1, resignMax: 150 }
        });
        orchestrator.dispatch({ device: "ui", action: "pause-toggle", source: "ui:pause-toggle" });
        const startingStaff = orchestrator.getState().entities.staff.length;
        for (let index = 0; index < 12 && orchestrator.getState().entities.staff.length === startingStaff; index += 1) {
            orchestrator.dispatch({ device: "ui", action: "admit-patient", severity: 3, source: "ui:admit", pointer: { x: 16, y: 16 } });
            orchestrator.dispatch({ device: "ui", action: "step-tick", source: "ui:step" });
            orchestrator.dispatch({ device: "ui", action: "step-tick", source: "ui:step" });
        }
        expect(orchestrator.getState().entities.staff.length).toBe(startingStaff - 1);
        expect(orchestrator.telemetry()).toMatchObject({
            scenarioStaffResignMax: 150,
            lastEventType: "staff-resigned"
        });
    });
    it("applies imported standing rest to app-level idle staff recovery", () => {
        const defaultRecovery = new AppOrchestrator({
            seed: 9016,
            tickRateHz: 4,
            pointerTileSize: 8,
            staffFatigueSettings: { crackUpTired: 9900, recoveryMinimum: 3, workLight: 2 }
        });
        const fasterRecovery = new AppOrchestrator({
            seed: 9016,
            tickRateHz: 4,
            pointerTileSize: 8,
            staffFatigueSettings: { crackUpTired: 9900, recoveryMinimum: 3, workLight: 2, restStanding: 3 }
        });
        defaultRecovery.dispatch({ device: "ui", action: "pause-toggle", source: "ui:pause-toggle" });
        fasterRecovery.dispatch({ device: "ui", action: "pause-toggle", source: "ui:pause-toggle" });
        for (let i = 0; i < 4; i += 1) {
            defaultRecovery.dispatch({ device: "ui", action: "admit-patient", severity: 3, source: "ui:admit", pointer: { x: 16, y: 16 } });
            fasterRecovery.dispatch({ device: "ui", action: "admit-patient", severity: 3, source: "ui:admit", pointer: { x: 16, y: 16 } });
        }
        for (let i = 0; i < 3; i += 1) {
            defaultRecovery.dispatch({ device: "ui", action: "step-tick", source: "ui:step" });
            fasterRecovery.dispatch({ device: "ui", action: "step-tick", source: "ui:step" });
        }
        const patientIds = defaultRecovery.getState().entities.waitingPatients.map((patient) => patient.id);
        for (const patientId of patientIds) {
            defaultRecovery.dispatch({ device: "ui", action: "send-patient-home", patientId, source: "ui:send-home" });
            fasterRecovery.dispatch({ device: "ui", action: "send-patient-home", patientId, source: "ui:send-home" });
        }
        defaultRecovery.dispatch({ device: "ui", action: "step-tick", source: "ui:step" });
        fasterRecovery.dispatch({ device: "ui", action: "step-tick", source: "ui:step" });
        const defaultStress = defaultRecovery.getState().entities.staff.reduce((sum, staff) => sum + staff.stress, 0);
        const fasterStress = fasterRecovery.getState().entities.staff.reduce((sum, staff) => sum + staff.stress, 0);
        expect(defaultStress).toBeGreaterThan(0);
        expect(fasterStress).toBeLessThan(defaultStress);
    });
    it("applies imported staff room rest values to app-level manual staff recovery", () => {
        const orchestrator = new AppOrchestrator({
            seed: 9042,
            tickRateHz: 4,
            pointerTileSize: 8,
            staffFatigueSettings: { crackUpTired: 9900, recoveryMinimum: 3, workLight: 2, restStanding: 1, restSofa: 4, restGame: 8, restSnooker: 12 }
        });
        orchestrator.dispatch({ device: "ui", action: "pause-toggle", source: "ui:pause-toggle" });
        for (let i = 0; i < 4; i += 1) {
            orchestrator.dispatch({ device: "ui", action: "admit-patient", severity: 3, source: "ui:admit", pointer: { x: 16, y: 16 } });
        }
        for (let i = 0; i < 3; i += 1) {
            orchestrator.dispatch({ device: "ui", action: "step-tick", source: "ui:step" });
        }
        const before = orchestrator.getState().entities.staff.find((staff) => staff.id === 1).stress;
        orchestrator.dispatch({ device: "ui", action: "staff-break-toggle", staffId: 1, source: "ui:break" });
        expect(orchestrator.dispatch({ device: "ui", action: "rest-staff", staffId: 1, restType: "snooker", source: "ui:rest" })).toEqual(["staff.rested"]);
        const after = orchestrator.getState().entities.staff.find((staff) => staff.id === 1).stress;
        expect(after).toBe(Math.max(0, before - 12));
        expect(orchestrator.telemetry()).toMatchObject({
            scenarioStaffRestStanding: 1,
            scenarioStaffRestSofa: 4,
            scenarioStaffRestGame: 8,
            scenarioStaffRestSnooker: 12,
            lastEventType: "staff-rested"
        });
    });
    it("applies imported score max increase to app-level award rating jumps", () => {
        const orchestrator = new AppOrchestrator({
            seed: 9043,
            tickRateHz: 4,
            pointerTileSize: 8,
            eventSettings: { scoreMaxIncrease: 10 }
        });
        expect(orchestrator.dispatch({ device: "ui", action: "run-awards-ceremony", source: "ui:awards" })).toEqual(["awards.completed"]);
        expect(orchestrator.telemetry().hospitalAwardLastScore).toBe(33);
        for (let index = 0; index < 3; index += 1) {
            orchestrator.dispatch({ device: "ui", action: "admit-patient", severity: 1, source: "ui:admit" });
            orchestrator.dispatch({ device: "ui", action: "treat-patient", source: "ui:treat" });
        }
        expect(orchestrator.telemetry()).toMatchObject({
            scenarioScoreMaxIncrease: 10,
            hospitalRatingScore: 43,
            hospitalRatingTier: "bronze",
            hospitalAwardRewardCash: 250,
            hospitalAwardRewardReputation: 5
        });
        expect(orchestrator.dispatch({ device: "ui", action: "run-awards-ceremony", source: "ui:awards" })).toEqual(["awards.completed"]);
        expect(orchestrator.telemetry()).toMatchObject({
            hospitalAwardLastTier: "bronze",
            hospitalAwardLastScore: 43,
            hospitalAwardTotalCashReward: 250,
            hospitalAwardTotalReputationReward: 5
        });
    });
    it("applies imported recovery factor to app-level idle staff recovery", () => {
        const fixedRecovery = new AppOrchestrator({
            seed: 9017,
            tickRateHz: 4,
            pointerTileSize: 8,
            staffFatigueSettings: { crackUpTired: 9900, recoveryMinimum: 3, workLight: 4, restStanding: 4 }
        });
        const scaledRecovery = new AppOrchestrator({
            seed: 9017,
            tickRateHz: 4,
            pointerTileSize: 8,
            staffFatigueSettings: { crackUpTired: 9900, recoveryMinimum: 3, workLight: 4, restStanding: 4, recoveryFactor: 200 }
        });
        fixedRecovery.dispatch({ device: "ui", action: "pause-toggle", source: "ui:pause-toggle" });
        scaledRecovery.dispatch({ device: "ui", action: "pause-toggle", source: "ui:pause-toggle" });
        for (let i = 0; i < 4; i += 1) {
            fixedRecovery.dispatch({ device: "ui", action: "admit-patient", severity: 3, source: "ui:admit", pointer: { x: 16, y: 16 } });
            scaledRecovery.dispatch({ device: "ui", action: "admit-patient", severity: 3, source: "ui:admit", pointer: { x: 16, y: 16 } });
        }
        for (let i = 0; i < 4; i += 1) {
            fixedRecovery.dispatch({ device: "ui", action: "step-tick", source: "ui:step" });
            scaledRecovery.dispatch({ device: "ui", action: "step-tick", source: "ui:step" });
        }
        const patientIds = fixedRecovery.getState().entities.waitingPatients.map((patient) => patient.id);
        for (const patientId of patientIds) {
            fixedRecovery.dispatch({ device: "ui", action: "send-patient-home", patientId, source: "ui:send-home" });
            scaledRecovery.dispatch({ device: "ui", action: "send-patient-home", patientId, source: "ui:send-home" });
        }
        fixedRecovery.dispatch({ device: "ui", action: "step-tick", source: "ui:step" });
        scaledRecovery.dispatch({ device: "ui", action: "step-tick", source: "ui:step" });
        const fixedStress = fixedRecovery.getState().entities.staff.reduce((sum, staff) => sum + staff.stress, 0);
        const scaledStress = scaledRecovery.getState().entities.staff.reduce((sum, staff) => sum + staff.stress, 0);
        expect(scaledStress).toBeGreaterThan(fixedStress);
    });
    it("surfaces imported staff fatigue thresholds in app telemetry", () => {
        const orchestrator = new AppOrchestrator({
            seed: 9014,
            tickRateHz: 4,
            pointerTileSize: 8,
            staffFatigueSettings: { crackUpTired: 9900, tired: 100, veryTired: 200 }
        });
        orchestrator.dispatch({ device: "ui", action: "pause-toggle", source: "ui:pause-toggle" });
        for (let i = 0; i < 4; i += 1) {
            orchestrator.dispatch({ device: "ui", action: "admit-patient", severity: 3, source: "ui:admit", pointer: { x: 16, y: 16 } });
        }
        for (let i = 0; i < 4; i += 1) {
            orchestrator.dispatch({ device: "ui", action: "step-tick", source: "ui:step" });
        }
        expect(orchestrator.telemetry()).toMatchObject({
            scenarioStaffTired: 100,
            scenarioStaffVeryTired: 200,
            tiredStaff: expect.any(Number),
            veryTiredStaff: expect.any(Number)
        });
        expect(orchestrator.telemetry().tiredStaff).toBeGreaterThan(0);
        expect(orchestrator.telemetry().veryTiredStaff).toBeGreaterThan(0);
    });
    it("routes selected-room repair through deterministic command history and restore", () => {
        const orchestrator = new AppOrchestrator({ seed: 9023, tickRateHz: 4, pointerTileSize: 8 });
        orchestrator.dispatch({ device: "ui", action: "pause-toggle", source: "ui:pause-toggle" });
        orchestrator.dispatch({ device: "ui", action: "treatment-room-toggle", source: "ui:treatment-room-toggle" });
        for (let i = 0; i < 8; i += 1) {
            orchestrator.dispatch({ device: "ui", action: "admit-patient", severity: 1, source: "ui:admit" });
        }
        let maintenanceRoom = null;
        for (let index = 0; index < 80; index += 1) {
            orchestrator.dispatch({ device: "ui", action: "step-tick", source: "ui:step" });
            maintenanceRoom = orchestrator.getState().entities.rooms.find((room) => room.id === 1 && room.maintenanceRemainingTicks > 0);
            if (maintenanceRoom) {
                break;
            }
        }
        expect(maintenanceRoom).toBeTruthy();
        const cashBeforeRepair = orchestrator.telemetry().cash;
        expect(orchestrator.dispatch({
            device: "ui",
            action: "repair-room",
            roomId: 1,
            source: "ui:repair-selected-room"
        })).toEqual(["room.repaired"]);
        expect(orchestrator.getState().entities.rooms.find((room) => room.id === 1)).toMatchObject({
            status: "open",
            wear: 0,
            maintenanceRemainingTicks: 0
        });
        expect(orchestrator.telemetry().cash).toBe(cashBeforeRepair - roomRepairCost("diagnosis"));
        const snapshot = orchestrator.createPersistenceSnapshot();
        expect(snapshot.commandLog[snapshot.commandLog.length - 1]).toEqual({ type: "repair-room", roomId: 1 });
        expect(AppOrchestrator.fromPersistenceSnapshot(snapshot).telemetry()).toEqual(orchestrator.telemetry());
        expect(orchestrator.dispatch({
            device: "ui",
            action: "repair-room",
            roomId: 1,
            source: "ui:repair-selected-room"
        })).toEqual(["room.repair-blocked"]);
    });
    it("places corridor objects through deterministic command history and restore", () => {
        const orchestrator = new AppOrchestrator({ seed: 9024, tickRateHz: 4, pointerTileSize: 8 });
        const cashBeforePlacement = orchestrator.telemetry().cash;
        expect(orchestrator.evaluatePlacement({
            device: "ui",
            action: "place-object",
            objectIndex: 4,
            objectName: "Bench",
            cost: 125,
            source: "ui:furnish-corridor",
            pointer: { x: 16, y: 16 }
        })).toMatchObject({
            action: "place-object",
            type: "object",
            valid: true,
            cost: 125,
            position: { x: 2, y: 2 }
        });
        expect(orchestrator.dispatch({
            device: "ui",
            action: "place-object",
            objectIndex: 4,
            objectName: "Bench",
            cost: 125,
            source: "ui:furnish-corridor",
            pointer: { x: 16, y: 16 }
        })).toEqual(["object.placed"]);
        expect(orchestrator.getState().entities.objects).toEqual([
            expect.objectContaining({
                id: 1,
                objectIndex: 4,
                name: "Bench",
                cost: 125,
                position: { x: 2, y: 2 }
            })
        ]);
        expect(orchestrator.telemetry().cash).toBe(cashBeforePlacement - 125);
        const snapshot = orchestrator.createPersistenceSnapshot();
        expect(snapshot.commandLog[snapshot.commandLog.length - 1]).toEqual({
            type: "place-object",
            objectIndex: 4,
            name: "Bench",
            cost: 125,
            position: { x: 2, y: 2 }
        });
        expect(AppOrchestrator.fromPersistenceSnapshot(snapshot).telemetry()).toEqual(orchestrator.telemetry());
    });
});
