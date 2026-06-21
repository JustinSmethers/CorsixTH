import { createDeterministicFallbackEnvelope, deserializeSaveEnvelope, serializeSaveEnvelope } from "@corsixth/persistence";
import { AppOrchestrator } from "../src/orchestrator";
import { createAppSaveEnvelope, exportSaveSlot, importOrchestratorFromSave, loadOrchestratorFromSlot, restoreOrchestratorFromSaveEnvelope, saveOrchestratorToSlot } from "../src/persistence";
class MemoryPersistenceAdapter {
    slots = new Map();
    async saveSlot(slot, envelope) {
        this.slots.set(slot, serializeSaveEnvelope(envelope));
    }
    async loadSlot(slot, options = {}) {
        const serialized = this.slots.get(slot);
        if (!serialized) {
            const reason = "missing-save-slot";
            return {
                status: "fallback",
                envelope: createDeterministicFallbackEnvelope({ ...options, reason }),
                issues: [reason]
            };
        }
        return deserializeSaveEnvelope(serialized, options);
    }
    async listSlots() {
        const slots = Array.from(this.slots.entries()).map(([slot, serialized]) => {
            const loaded = deserializeSaveEnvelope(serialized);
            return {
                slot,
                savedAtIso: loaded.envelope.savedAtIso,
                schemaVersion: loaded.envelope.schemaVersion
            };
        });
        slots.sort((left, right) => left.slot.localeCompare(right.slot));
        return slots;
    }
    async deleteSlot(slot) {
        this.slots.delete(slot);
    }
    async exportSlot(slot) {
        return this.slots.get(slot) ?? null;
    }
    async importSlot(slot, serialized, options = {}) {
        const imported = deserializeSaveEnvelope(serialized, options);
        this.slots.set(slot, serializeSaveEnvelope(imported.envelope));
        return imported;
    }
}
function createTerrain(width, height) {
    return {
        width,
        height,
        signature: `app-test-terrain:${width}x${height}`,
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
describe("app persistence integration", () => {
    it("creates save envelopes from orchestrator snapshots and restores equivalent telemetry", () => {
        const levelObjective = {
            requiredDischarges: 10,
            minimumCash: 1_000,
            minimumReputation: 300,
            minimumTreatmentPercentage: 40,
            minimumHospitalValue: 55_000,
            bankruptcyCashThreshold: -20_000,
            reputationFailureThreshold: 200,
            maximumDeaths: 50
        };
        const orchestrator = new AppOrchestrator({
            seed: 42,
            initialCash: 40_000,
            loanInterestPerChunk: 1,
            scenarioIllnessRate: 4,
            tickRateHz: 4,
            pointerTileSize: 8,
            bounds: { width: 128, height: 128 },
            levelObjective,
            populationSchedule: [
                { index: 0, month: 0, change: 3 },
                { index: 1, month: 1, change: 0 }
            ],
            diseasePool: [
                { source: "visuals", token: "I_BLOATY_HEAD", diseaseId: "cranial-pressure", severity: 3, weight: 5 }
            ],
            staffMarketSchedule: [
                { index: 0, month: 0, doctors: 8, nurses: 8, handymen: 3, receptionists: 5, shrinkRate: 3, surgeonRate: 0, researcherRate: 1, consultantRate: 2, juniorRate: 10 }
            ],
            roomAvailability: ["operating-theatre"],
            roomAvailabilitySchedule: [
                { index: 24, roomType: "operating-theatre", startAvailable: false, whenAvailable: 1, availableForLevel: true }
            ],
            roomCostOverrides: { diagnosis: 2_280, treatment: 1_700, pharmacy: 500, "operating-theatre": 1_500 },
            roomWearThresholdOverrides: { diagnosis: 12, "operating-theatre": 8 },
            staffWageOverrides: { diagnostician: 6, nurse: 5, handyman: 2 },
            admissionRules: { holdVisualMonths: 1, holdVisualPeepCount: 2 },
            researchSettings: { startRating: 95, researchPointsDivisor: 4, startCost: 100, minDrugCost: 50, drugImproveRate: 5, maxObjectStrength: 20, researchIncrement: 2, researchImproveCostPercent: 10, researchImproveIncrementPercent: 10 },
            trainingSettings: {
                trainingRate: 30,
                promotionDoctorMonths: 6,
                promotionConsultantMonths: 12,
                abilityThresholds: [{ index: 0, value: 75, name: "SURGEON" }],
                trainingValues: [{ index: 0, value: 10, name: "Projector" }],
                doctorThreshold: 250,
                consultantThreshold: 750
            },
            epidemicSettings: { howContagious: 25, contagiousSpreadFactor: 25, reduceContagiousMonths: 6, reduceContagiousPeepCount: 10, reduceContagiousRate: 0, fine: 2000, compensationLow: 1000, compensationHigh: 15000 },
            landSettings: { landCostPerTile: 25 },
            staffFatigueSettings: { restStanding: 3, restSofa: 8, restGame: 60, restSnooker: 30, workLight: 1, modifyFrequency: 16, crackUpTired: 800, recoveryMinimum: 3, resignMax: 150 },
            patientBehaviorSettings: { litterDrop: 25, leaveMax: 150, happy: 75, unhappy: 50, veryUnhappy: 25, bowelFull: 50, bowelOverflows: 75, vomitLimit: 50, litterRandom: 60 },
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
            },
            awardCriteria: { curesAward: 10, reputationAward: 600, hospValueAward: 60000 },
            emergencySchedule: [{ index: 0, startMonth: 4, endMonth: 5, minPatients: 2, maxPatients: 4, illnessCode: 16, percentToWin: 75, bonusCash: 400, diseaseId: "mild-cold", severity: 1 }],
            quakeSchedule: [{ index: 0, startMonth: 2, endMonth: 3, severity: 6 }],
            expertise: [{ index: 16, known: false, researchRequired: 10000, maxDiagDifficulty: 100, token: "UNCOMMON_COLD", diseaseId: "mild-cold", severity: 1 }],
            scenarioOpponents: [{ index: 0, skill: 3, staffLevels: 4, luck: 3, speed: 30, comfort: 7, guessAt: 90, playing: true, name: "ORAC" }],
            networkCriteria: [{ index: 0, metricCode: 3, metric: "reputation", value: 1, month: 2, timeToDo: 4 }]
        });
        orchestrator.dispatch({
            device: "ui",
            action: "build-room",
            roomType: "diagnosis",
            source: "ui:build-diagnosis-room",
            pointer: { x: 800, y: 832 }
        });
        orchestrator.dispatch({
            device: "ui",
            action: "hire-staff",
            role: "diagnostician",
            source: "ui:hire-diagnostician",
            pointer: { x: 800, y: 840 }
        });
        orchestrator.dispatch({ device: "keyboard", action: "admit-patient", severity: 2, source: "KeyA" });
        orchestrator.dispatch({
            device: "ui",
            action: "admission-policy-set",
            admissionPolicy: "conservative",
            source: "ui:admission-policy"
        });
        orchestrator.dispatch({
            device: "ui",
            action: "pricing-policy-set",
            pricingPolicy: "premium",
            source: "ui:pricing-policy"
        });
        orchestrator.advanceFrame(250);
        const envelope = createAppSaveEnvelope(orchestrator, {
            savedAtIso: "2026-02-12T13:00:00.000Z",
            mapView: { mapPath: "LEVELS/EXAMPLE.MAP", startX: 4, startY: 5 }
        });
        const restored = restoreOrchestratorFromSaveEnvelope(envelope);
        expect(envelope.schemaVersion).toBe(2);
        expect(envelope.payload.initialCash).toBe(40_000);
        expect(envelope.payload.loanInterestPerChunk).toBe(1);
        expect(envelope.payload.scenarioIllnessRate).toBe(4);
        expect(envelope.payload.bounds).toEqual({ width: 128, height: 128 });
        expect(envelope.payload.mapView).toEqual({ mapPath: "LEVELS/EXAMPLE.MAP", startX: 4, startY: 5 });
        expect(envelope.payload.levelObjective).toEqual(levelObjective);
        expect(envelope.payload.populationSchedule).toEqual([
            { index: 0, month: 0, change: 3 },
            { index: 1, month: 1, change: 0 }
        ]);
        expect(envelope.payload.diseasePool).toEqual([
            { source: "visuals", token: "I_BLOATY_HEAD", diseaseId: "cranial-pressure", severity: 3, weight: 5 }
        ]);
        expect(envelope.payload.staffMarketSchedule).toEqual([
            { index: 0, month: 0, doctors: 8, nurses: 8, handymen: 3, receptionists: 5, shrinkRate: 3, surgeonRate: 0, researcherRate: 1, consultantRate: 2, juniorRate: 10 }
        ]);
        expect(envelope.payload.roomAvailability).toEqual(["diagnosis", "treatment", "operating-theatre"]);
        expect(envelope.payload.roomAvailabilitySchedule).toEqual([
            { index: 24, roomType: "operating-theatre", startAvailable: false, whenAvailable: 1, availableForLevel: true }
        ]);
        expect(envelope.payload.roomCostOverrides).toEqual({ diagnosis: 2_280, treatment: 1_700, pharmacy: 500, "operating-theatre": 1_500 });
        expect(envelope.payload.roomWearThresholdOverrides).toEqual({ diagnosis: 12, "operating-theatre": 8 });
        expect(envelope.payload.staffWageOverrides).toEqual({ diagnostician: 6, nurse: 5, handyman: 2 });
        expect(envelope.payload.admissionRules).toEqual({ holdVisualMonths: 1, holdVisualPeepCount: 2 });
        expect(envelope.payload.researchSettings).toEqual({ startRating: 95, researchPointsDivisor: 4, startCost: 100, minDrugCost: 50, drugImproveRate: 5, maxObjectStrength: 20, researchIncrement: 2, researchImproveCostPercent: 10, researchImproveIncrementPercent: 10 });
        expect(envelope.payload.trainingSettings).toEqual({
            trainingRate: 30,
            promotionDoctorMonths: 6,
            promotionConsultantMonths: 12,
            abilityThresholds: [{ index: 0, value: 75, name: "SURGEON" }],
            trainingValues: [{ index: 0, value: 10, name: "Projector" }],
            doctorThreshold: 250,
            consultantThreshold: 750
        });
        expect(envelope.payload.epidemicSettings).toEqual({ howContagious: 25, contagiousSpreadFactor: 25, reduceContagiousMonths: 6, reduceContagiousPeepCount: 10, reduceContagiousRate: 0, fine: 2000, compensationLow: 1000, compensationHigh: 15000 });
        expect(envelope.payload.landSettings).toEqual({ landCostPerTile: 25 });
        expect(envelope.payload.staffFatigueSettings).toEqual({ restStanding: 3, restSofa: 8, restGame: 60, restSnooker: 30, workLight: 1, modifyFrequency: 16, crackUpTired: 800, recoveryMinimum: 3, resignMax: 150 });
        expect(envelope.payload.patientBehaviorSettings).toEqual({ litterDrop: 25, leaveMax: 150, happy: 75, unhappy: 50, veryUnhappy: 25, bowelFull: 50, bowelOverflows: 75, vomitLimit: 50, litterRandom: 60 });
        expect(envelope.payload.salarySettings).toEqual({
            salaryAdds: [
                { index: 3, value: -30, name: "Junior" },
                { index: 7, value: 100, name: "Consultant" }
            ],
            salaryAbilityDivisor: 10,
            salaryTooLow: -10,
            salaryTooHigh: 20
        });
        expect(envelope.payload.allocationSettings).toEqual({
            randomWeight: 4,
            totalReputationWeight: 1,
            illnessReputationWeight: 2,
            delayMonths: 3
        });
        expect(envelope.payload.routingSettings).toEqual({
            queuePoints: 15,
            distancePoints: 1,
            noStaffPoints: 20
        });
        expect(envelope.payload.eventSettings).toEqual({
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
        expect(envelope.payload.awardCriteria).toEqual({ curesAward: 10, reputationAward: 600, hospValueAward: 60000 });
        expect(envelope.payload.emergencySchedule).toEqual([{ index: 0, startMonth: 4, endMonth: 5, minPatients: 2, maxPatients: 4, illnessCode: 16, percentToWin: 75, bonusCash: 400, diseaseId: "mild-cold", severity: 1 }]);
        expect(envelope.payload.quakeSchedule).toEqual([{ index: 0, startMonth: 2, endMonth: 3, severity: 6 }]);
        expect(envelope.payload.expertise).toEqual([{ index: 16, known: false, researchRequired: 10000, maxDiagDifficulty: 100, token: "UNCOMMON_COLD", diseaseId: "mild-cold", severity: 1 }]);
        expect(envelope.payload.scenarioOpponents).toEqual([{ index: 0, skill: 3, staffLevels: 4, luck: 3, speed: 30, comfort: 7, guessAt: 90, playing: true, name: "ORAC" }]);
        expect(envelope.payload.networkCriteria).toEqual([{ index: 0, metricCode: 3, metric: "reputation", value: 1, month: 2, timeToDo: 4 }]);
        expect(envelope.payload.runtime.admissionPolicy).toBe("conservative");
        expect(envelope.payload.commandLog).toContainEqual({ type: "set-pricing-policy", policy: "premium" });
        expect(envelope.payload.commandLog).toContainEqual({
            type: "open-room",
            roomType: "diagnosis",
            position: { x: 100, y: 104 }
        });
        expect(envelope.payload.commandLog.length).toBeGreaterThan(0);
        expect(restored.telemetry()).toEqual(orchestrator.telemetry());
    });
    it("restores command logs against the active imported-map terrain", () => {
        const terrain = createTerrain(12, 12);
        setRect(terrain, 6, 7, 3, 3, { buildable: false });
        const orchestrator = new AppOrchestrator({
            seed: 43,
            tickRateHz: 4,
            pointerTileSize: 8,
            bounds: { width: 12, height: 12 },
            terrain
        });
        expect(orchestrator.dispatch({
            device: "ui",
            action: "build-room",
            roomType: "diagnosis",
            source: "ui:build-diagnosis-room",
            pointer: { x: 48, y: 56 }
        })).toEqual(["room.build-blocked"]);
        expect(orchestrator.dispatch({
            device: "ui",
            action: "build-room",
            roomType: "diagnosis",
            source: "ui:build-diagnosis-room",
            pointer: { x: 8, y: 56 }
        })).toEqual(["room.built"]);
        const envelope = createAppSaveEnvelope(orchestrator, {
            savedAtIso: "2026-02-12T13:03:00.000Z"
        });
        const restored = restoreOrchestratorFromSaveEnvelope(envelope, { terrain });
        expect(restored.telemetry()).toEqual(orchestrator.telemetry());
    });
    it("supports slot save/load/export/import flows through app orchestration helpers", async () => {
        const adapter = new MemoryPersistenceAdapter();
        const original = new AppOrchestrator({ seed: 400, tickRateHz: 4, pointerTileSize: 8 });
        original.dispatch({ device: "keyboard", action: "admit-patient", severity: 3, source: "KeyA" });
        original.advanceFrame(250);
        original.dispatch({ device: "keyboard", action: "pause-toggle", source: "Space" });
        await saveOrchestratorToSlot(adapter, "slot-a", original, {
            savedAtIso: "2026-02-12T13:05:00.000Z"
        });
        const loaded = await loadOrchestratorFromSlot(adapter, "slot-a");
        expect(loaded.status).toBe("exact");
        expect(loaded.orchestrator.telemetry()).toEqual(original.telemetry());
        const exported = await exportSaveSlot(adapter, "slot-a");
        expect(exported).toBeTruthy();
        const imported = await importOrchestratorFromSave(adapter, "slot-import", exported);
        expect(imported.status).toBe("exact");
        expect(imported.orchestrator.telemetry()).toEqual(original.telemetry());
        const missing = await loadOrchestratorFromSlot(adapter, "missing", {
            fallbackSeed: 7
        });
        expect(missing.status).toBe("fallback");
        expect(missing.orchestrator.telemetry()).toEqual(new AppOrchestrator({ seed: 7 }).telemetry());
    });
});
