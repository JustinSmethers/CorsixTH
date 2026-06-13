import { LATEST_SAVE_SCHEMA_VERSION, createIndexedDbPersistenceAdapter, createSaveEnvelope, createDeterministicFallbackEnvelope, deserializeSaveEnvelope, migrateSaveEnvelope, serializeSaveEnvelope } from "../src/index";
class FakeRequest {
    result;
    error = null;
    onsuccess = null;
    onerror = null;
    succeed(result) {
        this.result = result;
        queueMicrotask(() => {
            this.onsuccess?.();
        });
    }
    fail(error) {
        this.error = error;
        queueMicrotask(() => {
            this.onerror?.();
        });
    }
}
class FakeOpenRequest extends FakeRequest {
    onupgradeneeded = null;
    succeedWithOptionalUpgrade(database, needsUpgrade) {
        this.result = database;
        queueMicrotask(() => {
            if (needsUpgrade) {
                this.onupgradeneeded?.();
            }
            this.onsuccess?.();
        });
    }
}
class FakeObjectStore {
    records;
    constructor(records) {
        this.records = records;
    }
    put(value, key) {
        const request = new FakeRequest();
        this.records.set(key, value);
        request.succeed(value);
        return request;
    }
    get(key) {
        const request = new FakeRequest();
        request.succeed(this.records.get(key));
        return request;
    }
    getAll() {
        const request = new FakeRequest();
        request.succeed(Array.from(this.records.values()));
        return request;
    }
    delete(key) {
        const request = new FakeRequest();
        this.records.delete(key);
        request.succeed(undefined);
        return request;
    }
}
class FakeTransaction {
    stores;
    constructor(stores) {
        this.stores = stores;
    }
    objectStore(name) {
        const records = this.stores.get(name);
        if (!records) {
            throw new Error(`Missing store: ${name}`);
        }
        return new FakeObjectStore(records);
    }
}
class FakeDatabase {
    stores = new Map();
    objectStoreNames = {
        contains: (name) => this.stores.has(name)
    };
    createObjectStore(name) {
        if (!this.stores.has(name)) {
            this.stores.set(name, new Map());
        }
        return new FakeObjectStore(this.stores.get(name));
    }
    transaction(name, _mode) {
        return new FakeTransaction(this.stores);
    }
    seedRecord(storeName, slot, value) {
        if (!this.stores.has(storeName)) {
            this.stores.set(storeName, new Map());
        }
        this.stores.get(storeName).set(slot, value);
    }
}
class FakeIndexedDbFactory {
    databases = new Map();
    open(name, _version) {
        const request = new FakeOpenRequest();
        const existing = this.databases.get(name);
        if (existing) {
            request.succeedWithOptionalUpgrade(existing, false);
            return request;
        }
        const database = new FakeDatabase();
        this.databases.set(name, database);
        request.succeedWithOptionalUpgrade(database, true);
        return request;
    }
    database(name) {
        const database = this.databases.get(name);
        if (!database) {
            throw new Error(`Missing database: ${name}`);
        }
        return database;
    }
}
function sampleCommandLog() {
    return [
        { type: "admit-patient", severity: 3, position: { x: 5, y: 7 } },
        { type: "open-room", roomType: "diagnosis", position: { x: 8, y: 9 } },
        { type: "hire-staff", role: "diagnostician", initialSkillLevel: 3, position: { x: 8, y: 10 } },
        { type: "fire-staff", staffId: 3 },
        { type: "move-staff", staffId: 2, position: { x: 9, y: 11 } },
        { type: "remove-room", roomId: 3 },
        { type: "set-room-status", roomId: 2, status: "closed" },
        { type: "repair-room", roomId: 2 },
        { type: "set-pricing-policy", policy: "premium" },
        { type: "take-loan" },
        { type: "repay-loan" },
        { type: "run-finance-audit" },
        { type: "run-marketing-campaign" },
        { type: "start-insurance-contract" },
        { type: "run-awards-ceremony" },
        { type: "start-research" },
        { type: "start-emergency-wave" },
        { type: "start-epidemic-outbreak" },
        { type: "train-staff", staffId: 1 },
        { type: "start-vip-inspection" },
        { type: "tick", count: 4 },
        { type: "treat-patient", patientId: 2 },
        { type: "send-patient-home", patientId: 4 },
        { type: "prioritize-patient", patientId: 5 }
    ];
}
function sampleSnapshot() {
    return {
        seed: 9001,
        tickRateHz: 4,
        pointerTileSize: 16,
        bounds: { width: 128, height: 128 },
        admissionPoints: [{ x: 45, y: 62 }],
        mapView: { mapPath: "LEVELS/EXAMPLE.MAP", startX: 50, startY: 57 },
        diseasePool: [{ source: "visuals", token: "I_BLOATY_HEAD", diseaseId: "cranial-pressure", severity: 3, weight: 5 }],
        staffMarketSchedule: [{ index: 0, month: 0, doctors: 8, nurses: 8, handymen: 3, receptionists: 5 }],
        roomAvailability: ["diagnosis", "treatment", "specialist"],
        objectAvailability: [
            { index: 5, name: "Plant", startCost: 100, startStrength: 7, startAvailable: true, whenAvailable: 0, availableForLevel: true },
            { index: 13, name: "Cardiogram", roomType: "diagnosis", startCost: 1000, startStrength: 12, startAvailable: false, whenAvailable: 1, availableForLevel: true, researchRequired: 40000, expertiseCategory: "DIAGNOSIS" }
        ],
        roomWearThresholdOverrides: { diagnosis: 12, specialist: 8 },
        admissionRules: { holdVisualMonths: 1, holdVisualPeepCount: 2 },
        researchSettings: { startRating: 95, researchPointsDivisor: 4, drugImproveRate: 5 },
        trainingSettings: { trainingRate: 30, trainingValues: [{ index: 0, value: 10, name: "Projector" }] },
        awardCriteria: { curesAward: 10, reputationAward: 600, hospValuePoor: 40000, curesPenalty: -3000 },
        emergencySchedule: [{ index: 0, startMonth: 4, endMonth: 5, minPatients: 2, maxPatients: 4, illnessCode: 16, percentToWin: 75, bonusCash: 400, diseaseId: "mild-cold", severity: 1 }],
        expertise: [{ index: 16, known: false, researchRequired: 10000, maxDiagDifficulty: 100, token: "UNCOMMON_COLD", diseaseId: "mild-cold", severity: 1 }],
        scenarioOpponents: [{ index: 0, skill: 3, staffLevels: 4, luck: 3, speed: 30, comfort: 7, guessAt: 90, playing: true, name: "ORAC" }],
        networkCriteria: [{ index: 0, metricCode: 3, metric: "reputation", value: 1, month: 2, timeToDo: 4 }],
        commandLog: sampleCommandLog(),
        runtime: {
            paused: true,
            admissionsOpen: true,
            speedMultiplier: 2,
            admissionPolicy: "aggressive",
            tickAccumulatorMs: 33
        }
    };
}
describe("persistence schema and migration", () => {
    it("locks v2 schema and supports save serialization roundtrip", () => {
        const envelope = createSaveEnvelope(sampleSnapshot(), {
            savedAtIso: "2026-02-12T12:00:00.000Z"
        });
        expect(envelope.schemaVersion).toBe(LATEST_SAVE_SCHEMA_VERSION);
        expect(envelope.format).toBe("corsixth-save");
        const serialized = serializeSaveEnvelope(envelope);
        const reloaded = deserializeSaveEnvelope(serialized);
        expect(reloaded.status).toBe("exact");
        expect(reloaded.issues).toEqual([]);
        expect(reloaded.envelope).toEqual(envelope);
        expect(envelope.payload.objectAvailability).toEqual([
            { index: 5, startAvailable: true, whenAvailable: 0, availableForLevel: true, startCost: 100, startStrength: 7, name: "Plant" },
            { index: 13, startAvailable: false, whenAvailable: 1, availableForLevel: true, startCost: 1000, startStrength: 12, roomType: "diagnosis", name: "Cardiogram", researchRequired: 40000, expertiseCategory: "DIAGNOSIS" }
        ]);
    });
    it("accepts imported no-cures level objectives in save snapshots", () => {
        const envelope = createSaveEnvelope({
            ...sampleSnapshot(),
            levelObjective: {
                requiredDischarges: 0,
                minimumCash: 0,
                minimumReputation: 1,
                minimumTreatmentPercentage: 0,
                minimumHospitalValue: 0,
                bankruptcyCashThreshold: -20_000,
                reputationFailureThreshold: 0
            }
        }, {
            savedAtIso: "2026-02-12T12:00:00.000Z"
        });
        expect(envelope.payload.levelObjective.requiredDischarges).toBe(0);
        expect(envelope.payload.networkCriteria).toEqual([{ index: 0, metricCode: 3, metric: "reputation", value: 1, month: 2, timeToDo: 4 }]);
    });
    it("migrates v1 saves to the v2 schema", () => {
        const v1Envelope = {
            format: "corsixth-save",
            schemaVersion: 1,
            savedAtIso: "2026-02-12T11:59:00.000Z",
            payload: {
                seed: 700,
                tickRateHz: 5,
                pointerTileSize: 10,
                commands: sampleCommandLog()
            }
        };
        const migrated = migrateSaveEnvelope(v1Envelope);
        expect(migrated.status).toBe("migrated");
        expect(migrated.issues).toEqual(["migrated-schema-v1-to-v2"]);
        expect(migrated.envelope.schemaVersion).toBe(2);
        expect(migrated.envelope.payload.commandLog).toEqual(v1Envelope.payload.commands);
        expect(migrated.envelope.payload.runtime).toEqual({
            paused: false,
            admissionsOpen: false,
            speedMultiplier: 1,
            admissionPolicy: "standard",
            tickAccumulatorMs: 0
        });
    });
    it("deterministically falls back for legacy v0 envelope payloads", () => {
        const v0Envelope = {
            version: "0",
            stateHash: "deadbeef"
        };
        const migrated = migrateSaveEnvelope(v0Envelope, {
            fallbackSeed: 1234,
            defaultTickRateHz: 6,
            defaultPointerTileSize: 24
        });
        expect(migrated.status).toBe("fallback");
        expect(migrated.issues).toEqual(["legacy-v0-envelope-missing-runtime-payload"]);
        expect(migrated.envelope).toEqual(createDeterministicFallbackEnvelope({
            fallbackSeed: 1234,
            defaultTickRateHz: 6,
            defaultPointerTileSize: 24,
            reason: "legacy-v0-envelope-missing-runtime-payload"
        }));
    });
    it("deterministically falls back for malformed or partial saves", () => {
        const malformed = deserializeSaveEnvelope("{bad-json");
        const partial = migrateSaveEnvelope({
            format: "corsixth-save",
            schemaVersion: 2,
            savedAtIso: "2026-02-12T12:00:00.000Z",
            payload: {
                seed: 9,
                tickRateHz: 4
            }
        });
        expect(malformed.status).toBe("fallback");
        expect(partial.status).toBe("fallback");
        expect(malformed.envelope).toEqual(createDeterministicFallbackEnvelope({ reason: "json-parse-failure" }));
        expect(partial.envelope).toEqual(createDeterministicFallbackEnvelope({ reason: "invalid-v2-envelope" }));
    });
});
describe("indexeddb persistence adapter", () => {
    it("supports slot save/load/list/delete", async () => {
        const indexedDbFactory = new FakeIndexedDbFactory();
        const adapter = createIndexedDbPersistenceAdapter({
            indexedDbFactory,
            databaseName: "phase6-test-db",
            storeName: "phase6-saves"
        });
        const envelope = createSaveEnvelope(sampleSnapshot(), {
            savedAtIso: "2026-02-12T12:30:00.000Z"
        });
        await adapter.saveSlot("slot-a", envelope);
        const listAfterSave = await adapter.listSlots();
        expect(listAfterSave).toEqual([{ slot: "slot-a", savedAtIso: "2026-02-12T12:30:00.000Z", schemaVersion: 2 }]);
        const loaded = await adapter.loadSlot("slot-a");
        expect(loaded.status).toBe("exact");
        expect(loaded.envelope).toEqual(envelope);
        await adapter.deleteSlot("slot-a");
        const listAfterDelete = await adapter.listSlots();
        expect(listAfterDelete).toEqual([]);
    });
    it("supports export/import with migration on import and deterministic fallback on corrupted records", async () => {
        const indexedDbFactory = new FakeIndexedDbFactory();
        const adapter = createIndexedDbPersistenceAdapter({
            indexedDbFactory,
            databaseName: "phase6-export-db",
            storeName: "phase6-saves"
        });
        const v1Envelope = {
            format: "corsixth-save",
            schemaVersion: 1,
            savedAtIso: "2026-02-12T10:00:00.000Z",
            payload: {
                seed: 17,
                tickRateHz: 4,
                pointerTileSize: 16,
                commands: sampleCommandLog()
            }
        };
        const importResult = await adapter.importSlot("slot-import", JSON.stringify(v1Envelope));
        expect(importResult.status).toBe("migrated");
        expect(importResult.envelope.schemaVersion).toBe(2);
        const exported = await adapter.exportSlot("slot-import");
        expect(exported).toBeTruthy();
        const parsedExport = deserializeSaveEnvelope(exported);
        expect(parsedExport.status).toBe("exact");
        indexedDbFactory
            .database("phase6-export-db")
            .seedRecord("phase6-saves", "slot-corrupt", { slot: "slot-corrupt", serialized: "{broken-json" });
        const corrupted = await adapter.loadSlot("slot-corrupt");
        expect(corrupted.status).toBe("fallback");
        expect(corrupted.envelope).toEqual(createDeterministicFallbackEnvelope({ reason: "json-parse-failure" }));
        const missing = await adapter.loadSlot("missing-slot");
        expect(missing.status).toBe("fallback");
        expect(missing.issues).toEqual(["missing-save-slot"]);
    });
});
