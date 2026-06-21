import { assertGameCommand } from "@corsixth/core";
export const LATEST_SAVE_SCHEMA_VERSION = 2;
const SAVE_FORMAT = "corsixth-save";
const FALLBACK_SAVED_AT_ISO = "1970-01-01T00:00:00.000Z";
const DEFAULT_FALLBACK_SEED = 1;
const DEFAULT_TICK_RATE_HZ = 4;
const DEFAULT_POINTER_TILE_SIZE = 16;
const DEFAULT_SPEED_MULTIPLIER = 1;
const ALLOWED_SPEED_MULTIPLIERS = [0.5, 1, 2, 4];
const DEFAULT_ADMISSION_POLICY = "standard";
const ALLOWED_ADMISSION_POLICIES = ["conservative", "standard", "aggressive"];
const ALLOWED_ROOM_TYPES = ["diagnosis", "blood-machine", "treatment", "pharmacy", "specialist", "psychiatry", "inflation-room", "slack-tongue-clinic", "fracture-clinic", "hair-restoration", "jelly-vat", "decontamination", "electrolysis", "dna-fixer"];
const ALLOWED_STAFF_ROLES = ["diagnostician", "nurse", "handyman"];
class IndexedDbPersistenceAdapterImpl {
    indexedDbFactory;
    databaseName;
    storeName;
    openDatabasePromise;
    constructor(options) {
        this.indexedDbFactory = options.indexedDbFactory ?? defaultIndexedDbFactory();
        this.databaseName = options.databaseName ?? "corsixth-persistence";
        this.storeName = options.storeName ?? "save-slots";
    }
    async saveSlot(slot, envelope) {
        assertSlotName(slot);
        const normalizedEnvelope = coerceV2Envelope(envelope);
        const record = {
            slot,
            serialized: serializeSaveEnvelope(normalizedEnvelope),
            savedAtIso: normalizedEnvelope.savedAtIso,
            schemaVersion: normalizedEnvelope.schemaVersion
        };
        await this.withStore("readwrite", (store) => requestToPromise(store.put(record, slot)));
    }
    async loadSlot(slot, options = {}) {
        assertSlotName(slot);
        const record = await this.readRecord(slot);
        if (!record) {
            const reason = "missing-save-slot";
            return {
                status: "fallback",
                envelope: createDeterministicFallbackEnvelope({ ...options, reason }),
                issues: [reason]
            };
        }
        return deserializeSaveEnvelope(record.serialized, options);
    }
    async listSlots() {
        const values = await this.withStore("readonly", (store) => requestToPromise(store.getAll()));
        const summaries = [];
        for (const value of values) {
            if (!isSaveSlotRecord(value)) {
                continue;
            }
            summaries.push({
                slot: value.slot,
                savedAtIso: value.savedAtIso,
                schemaVersion: value.schemaVersion
            });
        }
        summaries.sort((left, right) => left.slot.localeCompare(right.slot));
        return summaries;
    }
    async deleteSlot(slot) {
        assertSlotName(slot);
        await this.withStore("readwrite", (store) => requestToPromise(store.delete(slot)));
    }
    async exportSlot(slot) {
        assertSlotName(slot);
        const record = await this.readRecord(slot);
        if (!record) {
            return null;
        }
        return record.serialized;
    }
    async importSlot(slot, serialized, options = {}) {
        assertSlotName(slot);
        const migrated = deserializeSaveEnvelope(serialized, options);
        await this.saveSlot(slot, migrated.envelope);
        return migrated;
    }
    async readRecord(slot) {
        const value = await this.withStore("readonly", (store) => requestToPromise(store.get(slot)));
        if (value === undefined) {
            return null;
        }
        if (!isSaveSlotRecord(value)) {
            return {
                slot,
                serialized: "",
                savedAtIso: FALLBACK_SAVED_AT_ISO,
                schemaVersion: LATEST_SAVE_SCHEMA_VERSION
            };
        }
        return value;
    }
    async withStore(mode, callback) {
        const database = await this.openDatabase();
        const transaction = database.transaction(this.storeName, mode);
        const store = transaction.objectStore(this.storeName);
        return callback(store);
    }
    async openDatabase() {
        if (this.openDatabasePromise) {
            return this.openDatabasePromise;
        }
        const request = this.indexedDbFactory.open(this.databaseName, 1);
        request.onupgradeneeded = () => {
            if (!request.result.objectStoreNames.contains(this.storeName)) {
                request.result.createObjectStore(this.storeName);
            }
        };
        this.openDatabasePromise = requestToPromise(request);
        return this.openDatabasePromise;
    }
}
export function createIndexedDbPersistenceAdapter(options = {}) {
    return new IndexedDbPersistenceAdapterImpl(options);
}
export function createSaveEnvelope(snapshot, options = {}) {
    const normalizedSnapshot = normalizeSnapshot(snapshot);
    return {
        format: SAVE_FORMAT,
        schemaVersion: LATEST_SAVE_SCHEMA_VERSION,
        savedAtIso: normalizeIsoTimestamp(options.savedAtIso ?? new Date().toISOString()),
        payload: normalizedSnapshot
    };
}
export function serializeSaveEnvelope(envelope) {
    return JSON.stringify(coerceV2Envelope(envelope));
}
export function deserializeSaveEnvelope(serialized, options = {}) {
    if (typeof serialized !== "string") {
        const reason = "json-parse-failure";
        return {
            status: "fallback",
            envelope: createDeterministicFallbackEnvelope({ ...options, reason }),
            issues: [reason]
        };
    }
    try {
        const parsed = JSON.parse(serialized);
        return migrateSaveEnvelope(parsed, options);
    }
    catch {
        const reason = "json-parse-failure";
        return {
            status: "fallback",
            envelope: createDeterministicFallbackEnvelope({ ...options, reason }),
            issues: [reason]
        };
    }
}
export function migrateSaveEnvelope(input, options = {}) {
    try {
        const v2Envelope = coerceV2Envelope(input);
        return {
            status: "exact",
            envelope: v2Envelope,
            issues: []
        };
    }
    catch {
        // fall through
    }
    try {
        const v1Envelope = coerceV1Envelope(input);
        const migrated = {
            format: SAVE_FORMAT,
            schemaVersion: LATEST_SAVE_SCHEMA_VERSION,
            savedAtIso: v1Envelope.savedAtIso,
            payload: {
                seed: v1Envelope.payload.seed,
                tickRateHz: v1Envelope.payload.tickRateHz,
                pointerTileSize: v1Envelope.payload.pointerTileSize,
                commandLog: cloneCommandLog(v1Envelope.payload.commands),
                runtime: {
                    paused: false,
                    admissionsOpen: false,
                    speedMultiplier: DEFAULT_SPEED_MULTIPLIER,
                    admissionPolicy: DEFAULT_ADMISSION_POLICY,
                    tickAccumulatorMs: 0
                }
            }
        };
        return {
            status: "migrated",
            envelope: migrated,
            issues: ["migrated-schema-v1-to-v2"]
        };
    }
    catch {
        // fall through
    }
    if (isV0Envelope(input)) {
        const reason = "legacy-v0-envelope-missing-runtime-payload";
        return {
            status: "fallback",
            envelope: createDeterministicFallbackEnvelope({ ...options, reason }),
            issues: [reason]
        };
    }
    const reason = "invalid-v2-envelope";
    return {
        status: "fallback",
        envelope: createDeterministicFallbackEnvelope({ ...options, reason }),
        issues: [reason]
    };
}
export function createDeterministicFallbackEnvelope(options = {}) {
    const reason = options.reason;
    const fallback = {
        format: SAVE_FORMAT,
        schemaVersion: LATEST_SAVE_SCHEMA_VERSION,
        savedAtIso: FALLBACK_SAVED_AT_ISO,
        payload: {
            seed: normalizePositiveInteger(options.fallbackSeed ?? DEFAULT_FALLBACK_SEED, "fallbackSeed"),
            tickRateHz: normalizePositiveInteger(options.defaultTickRateHz ?? DEFAULT_TICK_RATE_HZ, "defaultTickRateHz"),
            pointerTileSize: normalizePositiveInteger(options.defaultPointerTileSize ?? DEFAULT_POINTER_TILE_SIZE, "defaultPointerTileSize"),
            commandLog: [],
            runtime: {
                paused: false,
                admissionsOpen: false,
                speedMultiplier: DEFAULT_SPEED_MULTIPLIER,
                admissionPolicy: DEFAULT_ADMISSION_POLICY,
                tickAccumulatorMs: 0
            }
        }
    };
    if (reason) {
        fallback.fallbackReason = reason;
    }
    return fallback;
}
function defaultIndexedDbFactory() {
    const factory = globalThis.indexedDB;
    if (!factory) {
        throw new Error("IndexedDB is unavailable in this environment");
    }
    return factory;
}
function requestToPromise(request) {
    return new Promise((resolve, reject) => {
        request.onsuccess = () => {
            resolve(request.result);
        };
        request.onerror = () => {
            reject(request.error ?? new Error("IndexedDB request failed"));
        };
    });
}
function normalizeSnapshot(snapshot) {
    if (!isRecord(snapshot)) {
        throw new Error("Invalid save snapshot");
    }
    const admissionPoints = normalizeGridPositions(snapshot.admissionPoints, "admissionPoints");
    const mapView = normalizeMapView(snapshot.mapView);
    const populationSchedule = normalizePopulationSchedule(snapshot.populationSchedule);
    const diseasePool = normalizeDiseasePool(snapshot.diseasePool);
    const staffMarketSchedule = normalizeStaffMarketSchedule(snapshot.staffMarketSchedule);
    const roomAvailability = normalizeRoomAvailability(snapshot.roomAvailability);
    const roomAvailabilitySchedule = normalizeRoomAvailabilitySchedule(snapshot.roomAvailabilitySchedule);
    const objectAvailability = normalizeObjectAvailability(snapshot.objectAvailability);
    const roomCostOverrides = normalizeRoomCostOverrides(snapshot.roomCostOverrides);
    const roomWearThresholdOverrides = normalizeRoomWearThresholdOverrides(snapshot.roomWearThresholdOverrides);
    const staffWageOverrides = normalizeStaffWageOverrides(snapshot.staffWageOverrides);
    const quakeSchedule = normalizeQuakeSchedule(snapshot.quakeSchedule);
    const admissionRules = normalizeAdmissionRules(snapshot.admissionRules);
    const researchSettings = normalizeResearchSettings(snapshot.researchSettings);
    const trainingSettings = normalizeTrainingSettings(snapshot.trainingSettings);
    const epidemicSettings = normalizeEpidemicSettings(snapshot.epidemicSettings);
    const landSettings = normalizeLandSettings(snapshot.landSettings);
    const staffFatigueSettings = normalizeStaffFatigueSettings(snapshot.staffFatigueSettings);
    const patientBehaviorSettings = normalizePatientBehaviorSettings(snapshot.patientBehaviorSettings);
    const salarySettings = normalizeSalarySettings(snapshot.salarySettings);
    const allocationSettings = normalizeAllocationSettings(snapshot.allocationSettings);
    const routingSettings = normalizeRoutingSettings(snapshot.routingSettings);
    const eventSettings = normalizeEventSettings(snapshot.eventSettings);
    const awardCriteria = normalizeAwardCriteria(snapshot.awardCriteria);
    const emergencySchedule = normalizeEmergencySchedule(snapshot.emergencySchedule);
    const expertise = normalizeExpertise(snapshot.expertise);
    const scenarioOpponents = normalizeScenarioOpponents(snapshot.scenarioOpponents);
    const networkCriteria = normalizeNetworkCriteria(snapshot.networkCriteria);
    return {
        seed: normalizePositiveInteger(snapshot.seed, "seed"),
        ...(snapshot.initialCash !== undefined ? { initialCash: normalizeFiniteNumber(snapshot.initialCash, "initialCash") } : {}),
        ...(snapshot.loanInterestPerChunk !== undefined ? { loanInterestPerChunk: normalizeNonNegativeInteger(snapshot.loanInterestPerChunk, "loanInterestPerChunk") } : {}),
        ...(snapshot.scenarioIllnessRate !== undefined ? { scenarioIllnessRate: normalizeNonNegativeInteger(snapshot.scenarioIllnessRate, "scenarioIllnessRate") } : {}),
        tickRateHz: normalizePositiveInteger(snapshot.tickRateHz, "tickRateHz"),
        pointerTileSize: normalizePositiveInteger(snapshot.pointerTileSize, "pointerTileSize"),
        ...(snapshot.bounds !== undefined ? { bounds: normalizeBounds(snapshot.bounds) } : {}),
        ...(admissionPoints.length > 0 ? { admissionPoints } : {}),
        ...(mapView ? { mapView } : {}),
        ...(snapshot.levelObjective !== undefined ? { levelObjective: normalizeLevelObjective(snapshot.levelObjective) } : {}),
        ...(populationSchedule.length > 0 ? { populationSchedule } : {}),
        ...(diseasePool.length > 0 ? { diseasePool } : {}),
        ...(staffMarketSchedule.length > 0 ? { staffMarketSchedule } : {}),
        ...(roomAvailability.length > 0 ? { roomAvailability } : {}),
        ...(roomAvailabilitySchedule.length > 0 ? { roomAvailabilitySchedule } : {}),
        ...(objectAvailability.length > 0 ? { objectAvailability } : {}),
        ...(Object.keys(roomCostOverrides).length > 0 ? { roomCostOverrides } : {}),
        ...(Object.keys(roomWearThresholdOverrides).length > 0 ? { roomWearThresholdOverrides } : {}),
        ...(Object.keys(staffWageOverrides).length > 0 ? { staffWageOverrides } : {}),
        ...(quakeSchedule.length > 0 ? { quakeSchedule } : {}),
        ...(Object.keys(admissionRules).length > 0 ? { admissionRules } : {}),
        ...(Object.keys(researchSettings).length > 0 ? { researchSettings } : {}),
        ...(Object.keys(trainingSettings).length > 0 ? { trainingSettings } : {}),
        ...(Object.keys(epidemicSettings).length > 0 ? { epidemicSettings } : {}),
        ...(Object.keys(landSettings).length > 0 ? { landSettings } : {}),
        ...(Object.keys(staffFatigueSettings).length > 0 ? { staffFatigueSettings } : {}),
        ...(Object.keys(patientBehaviorSettings).length > 0 ? { patientBehaviorSettings } : {}),
        ...(Object.keys(salarySettings).length > 0 ? { salarySettings } : {}),
        ...(Object.keys(allocationSettings).length > 0 ? { allocationSettings } : {}),
        ...(Object.keys(routingSettings).length > 0 ? { routingSettings } : {}),
        ...(Object.keys(eventSettings).length > 0 ? { eventSettings } : {}),
        ...(Object.keys(awardCriteria).length > 0 ? { awardCriteria } : {}),
        ...(emergencySchedule.length > 0 ? { emergencySchedule } : {}),
        ...(expertise.length > 0 ? { expertise } : {}),
        ...(scenarioOpponents.length > 0 ? { scenarioOpponents } : {}),
        ...(networkCriteria.length > 0 ? { networkCriteria } : {}),
        commandLog: cloneCommandLog(snapshot.commandLog),
        runtime: normalizeRuntime(snapshot.runtime)
    };
}
function normalizePopulationSchedule(schedule) {
    if (schedule === undefined) {
        return [];
    }
    if (!Array.isArray(schedule)) {
        throw new Error("Invalid save population schedule");
    }
    return schedule.map((entry, index) => {
        if (!isRecord(entry)) {
            throw new Error("Invalid save population schedule entry");
        }
        return {
            index: Number.isInteger(entry.index) ? entry.index : index,
            month: normalizeNonNegativeInteger(entry.month, "populationSchedule.month"),
            change: normalizeInteger(entry.change, "populationSchedule.change")
        };
    }).sort((left, right) => left.month - right.month || left.index - right.index);
}
function normalizeDiseasePool(diseasePool) {
    if (diseasePool === undefined) {
        return [];
    }
    if (!Array.isArray(diseasePool)) {
        throw new Error("Invalid save disease pool");
    }
    return diseasePool.map((entry) => {
        if (!isRecord(entry) || typeof entry.diseaseId !== "string" || entry.diseaseId.length === 0) {
            throw new Error("Invalid save disease pool entry");
        }
        const severity = normalizePositiveInteger(entry.severity, "diseasePool.severity");
        if (severity > 3) {
            throw new Error("diseasePool.severity must be 1, 2, or 3");
        }
        return {
            source: typeof entry.source === "string" ? entry.source : "scenario",
            token: typeof entry.token === "string" ? entry.token : entry.diseaseId,
            diseaseId: entry.diseaseId,
            severity,
            weight: entry.weight === undefined ? 1 : normalizePositiveInteger(entry.weight, "diseasePool.weight")
        };
    });
}
function normalizeStaffMarketSchedule(schedule) {
    if (schedule === undefined) {
        return [];
    }
    if (!Array.isArray(schedule)) {
        throw new Error("Invalid save staff market schedule");
    }
    return schedule.map((entry, index) => {
        if (!isRecord(entry)) {
            throw new Error("Invalid save staff market schedule entry");
        }
        return {
            index: Number.isInteger(entry.index) ? entry.index : index,
            month: normalizeNonNegativeInteger(entry.month, "staffMarketSchedule.month"),
            nurses: normalizeNonNegativeInteger(entry.nurses, "staffMarketSchedule.nurses"),
            doctors: normalizeNonNegativeInteger(entry.doctors, "staffMarketSchedule.doctors"),
            handymen: normalizeNonNegativeInteger(entry.handymen, "staffMarketSchedule.handymen"),
            receptionists: normalizeNonNegativeInteger(entry.receptionists, "staffMarketSchedule.receptionists"),
            ...normalizeStaffMarketRates(entry)
        };
    }).sort((left, right) => left.month - right.month || left.index - right.index);
}
function normalizeStaffMarketRates(entry) {
    const normalized = {};
    for (const key of ["shrinkRate", "surgeonRate", "researcherRate", "consultantRate", "juniorRate"]) {
        if (entry[key] === undefined) {
            continue;
        }
        normalized[key] = normalizeNonNegativeInteger(entry[key], `staffMarketSchedule.${key}`);
    }
    return normalized;
}
function normalizeRoomAvailability(roomAvailability) {
    if (roomAvailability === undefined) {
        return [];
    }
    if (!Array.isArray(roomAvailability)) {
        throw new Error("Invalid save room availability");
    }
    const normalized = [];
    for (const roomType of roomAvailability) {
        if (!ALLOWED_ROOM_TYPES.includes(roomType)) {
            throw new Error("Invalid save room availability entry");
        }
        if (!normalized.includes(roomType)) {
            normalized.push(roomType);
        }
    }
    return normalized;
}
function normalizeRoomAvailabilitySchedule(schedule) {
    if (schedule === undefined) {
        return [];
    }
    if (!Array.isArray(schedule)) {
        throw new Error("Invalid save room availability schedule");
    }
    return schedule.map((entry, index) => {
        if (!isRecord(entry) || !ALLOWED_ROOM_TYPES.includes(entry.roomType)) {
            throw new Error("Invalid save room availability schedule entry");
        }
        return {
            index: normalizeNonNegativeInteger(entry.index ?? index, "roomAvailabilitySchedule.index"),
            roomType: entry.roomType,
            startAvailable: entry.startAvailable === true,
            whenAvailable: normalizeNonNegativeInteger(entry.whenAvailable, "roomAvailabilitySchedule.whenAvailable"),
            availableForLevel: entry.availableForLevel !== false
        };
    });
}
function normalizeObjectAvailability(availability) {
    if (availability === undefined) {
        return [];
    }
    if (!Array.isArray(availability)) {
        throw new Error("Invalid save object availability");
    }
    return availability.map((entry, index) => {
        if (!isRecord(entry)) {
            throw new Error("Invalid save object availability entry");
        }
        const normalized = {
            index: normalizeNonNegativeInteger(entry.index ?? index, "objectAvailability.index"),
            startAvailable: entry.startAvailable === true,
            whenAvailable: normalizeNonNegativeInteger(entry.whenAvailable ?? 0, "objectAvailability.whenAvailable"),
            availableForLevel: entry.availableForLevel !== false
        };
        if (entry.startCost !== undefined) {
            normalized.startCost = normalizeNonNegativeInteger(entry.startCost, "objectAvailability.startCost");
        }
        if (entry.startStrength !== undefined) {
            normalized.startStrength = normalizeNonNegativeInteger(entry.startStrength, "objectAvailability.startStrength");
        }
        if (entry.roomType !== undefined) {
            if (typeof entry.roomType !== "string" || entry.roomType.length === 0 || !ALLOWED_ROOM_TYPES.includes(entry.roomType)) {
                throw new Error("Invalid save object availability room type");
            }
            normalized.roomType = entry.roomType;
        }
        if (entry.name !== undefined) {
            if (typeof entry.name !== "string" || entry.name.length === 0) {
                throw new Error("Invalid save object availability name");
            }
            normalized.name = entry.name;
        }
        if (entry.researchRequired !== undefined) {
            normalized.researchRequired = normalizeNonNegativeInteger(entry.researchRequired, "objectAvailability.researchRequired");
        }
        if (entry.expertiseCategory !== undefined) {
            if (typeof entry.expertiseCategory !== "string" || entry.expertiseCategory.length === 0) {
                throw new Error("Invalid save object availability expertise category");
            }
            normalized.expertiseCategory = entry.expertiseCategory;
        }
        return normalized;
    }).sort((left, right) => left.index - right.index);
}
function normalizeRoomCostOverrides(value) {
    if (value === undefined) {
        return {};
    }
    if (!isRecord(value)) {
        throw new Error("Invalid save room cost overrides");
    }
    const normalized = {};
    for (const roomType of ALLOWED_ROOM_TYPES) {
        const cost = value[roomType];
        if (cost === undefined) {
            continue;
        }
        normalized[roomType] = normalizeNonNegativeInteger(cost, `roomCostOverrides.${roomType}`);
    }
    return normalized;
}
function normalizeRoomWearThresholdOverrides(value) {
    if (value === undefined) {
        return {};
    }
    if (!isRecord(value)) {
        throw new Error("Invalid save room wear threshold overrides");
    }
    const normalized = {};
    for (const roomType of ALLOWED_ROOM_TYPES) {
        const threshold = value[roomType];
        if (threshold === undefined) {
            continue;
        }
        normalized[roomType] = normalizePositiveInteger(threshold, `roomWearThresholdOverrides.${roomType}`);
    }
    return normalized;
}
function normalizeStaffWageOverrides(value) {
    if (value === undefined) {
        return {};
    }
    if (!isRecord(value)) {
        throw new Error("Invalid save staff wage overrides");
    }
    const normalized = {};
    for (const role of ALLOWED_STAFF_ROLES) {
        const cost = value[role];
        if (cost === undefined) {
            continue;
        }
        normalized[role] = normalizeNonNegativeInteger(cost, `staffWageOverrides.${role}`);
    }
    return normalized;
}
function normalizeQuakeSchedule(schedule) {
    if (schedule === undefined) {
        return [];
    }
    if (!Array.isArray(schedule)) {
        throw new Error("Invalid save quake schedule");
    }
    return schedule.map((entry, index) => {
        if (!isRecord(entry)) {
            throw new Error("Invalid save quake schedule entry");
        }
        const severity = normalizeNonNegativeInteger(entry.severity, "quakeSchedule.severity");
        if (severity > 99) {
            throw new Error("quakeSchedule.severity must be 0 through 99");
        }
        return {
            index: Number.isInteger(entry.index) ? entry.index : index,
            startMonth: normalizeNonNegativeInteger(entry.startMonth, "quakeSchedule.startMonth"),
            endMonth: normalizeNonNegativeInteger(entry.endMonth, "quakeSchedule.endMonth"),
            severity
        };
    }).sort((left, right) => left.startMonth - right.startMonth || left.index - right.index);
}
function normalizeAdmissionRules(admissionRules) {
    if (admissionRules === undefined) {
        return {};
    }
    if (!isRecord(admissionRules)) {
        throw new Error("Invalid save admission rules");
    }
    const normalized = {};
    if (admissionRules.holdVisualMonths !== undefined) {
        normalized.holdVisualMonths = normalizeNonNegativeInteger(admissionRules.holdVisualMonths, "admissionRules.holdVisualMonths");
    }
    if (admissionRules.holdVisualPeepCount !== undefined) {
        normalized.holdVisualPeepCount = normalizeNonNegativeInteger(admissionRules.holdVisualPeepCount, "admissionRules.holdVisualPeepCount");
    }
    return normalized;
}
function normalizeResearchSettings(researchSettings) {
    if (researchSettings === undefined) {
        return {};
    }
    if (!isRecord(researchSettings)) {
        throw new Error("Invalid save research settings");
    }
    const normalized = {};
    if (researchSettings.startRating !== undefined) {
        normalized.startRating = normalizeNonNegativeInteger(researchSettings.startRating, "researchSettings.startRating");
    }
    if (researchSettings.researchPointsDivisor !== undefined) {
        normalized.researchPointsDivisor = normalizePositiveInteger(researchSettings.researchPointsDivisor, "researchSettings.researchPointsDivisor");
    }
    if (researchSettings.startCost !== undefined) {
        normalized.startCost = normalizeNonNegativeInteger(researchSettings.startCost, "researchSettings.startCost");
    }
    if (researchSettings.minDrugCost !== undefined) {
        normalized.minDrugCost = normalizeNonNegativeInteger(researchSettings.minDrugCost, "researchSettings.minDrugCost");
    }
    if (researchSettings.drugImproveRate !== undefined) {
        normalized.drugImproveRate = normalizePositiveInteger(researchSettings.drugImproveRate, "researchSettings.drugImproveRate");
    }
    for (const key of ["maxObjectStrength", "researchIncrement", "researchImproveCostPercent", "researchImproveIncrementPercent"]) {
        if (researchSettings[key] === undefined) {
            continue;
        }
        normalized[key] = normalizePositiveInteger(researchSettings[key], `researchSettings.${key}`);
    }
    return normalized;
}
function normalizeTrainingSettings(trainingSettings) {
    if (trainingSettings === undefined) {
        return {};
    }
    if (!isRecord(trainingSettings)) {
        throw new Error("Invalid save training settings");
    }
    const normalized = {};
    if (trainingSettings.trainingRate !== undefined) {
        normalized.trainingRate = normalizePositiveInteger(trainingSettings.trainingRate, "trainingSettings.trainingRate");
    }
    if (trainingSettings.trainingValues !== undefined) {
        if (!Array.isArray(trainingSettings.trainingValues)) {
            throw new Error("Invalid save training values");
        }
        normalized.trainingValues = trainingSettings.trainingValues.map((entry, index) => {
            if (!isRecord(entry)) {
                throw new Error(`Invalid save training value: ${index}`);
            }
            return {
                index: normalizeNonNegativeInteger(entry.index, `trainingSettings.trainingValues[${index}].index`),
                value: normalizeNonNegativeInteger(entry.value, `trainingSettings.trainingValues[${index}].value`),
                ...(typeof entry.name === "string" && entry.name.length > 0 ? { name: entry.name } : {})
            };
        });
    }
    for (const key of ["promotionDoctorMonths", "promotionConsultantMonths", "doctorThreshold", "consultantThreshold"]) {
        if (trainingSettings[key] === undefined) {
            continue;
        }
        normalized[key] = normalizePositiveInteger(trainingSettings[key], `trainingSettings.${key}`);
    }
    if (trainingSettings.abilityThresholds !== undefined) {
        if (!Array.isArray(trainingSettings.abilityThresholds)) {
            throw new Error("Invalid save ability thresholds");
        }
        normalized.abilityThresholds = trainingSettings.abilityThresholds.map((entry, index) => {
            if (!isRecord(entry)) {
                throw new Error("Invalid save ability threshold entry");
            }
            return {
                index: normalizeNonNegativeInteger(entry.index, `trainingSettings.abilityThresholds[${index}].index`),
                value: normalizeNonNegativeInteger(entry.value, `trainingSettings.abilityThresholds[${index}].value`),
                ...(typeof entry.name === "string" && entry.name.length > 0 ? { name: entry.name } : {})
            };
        });
    }
    return normalized;
}
function normalizeEpidemicSettings(epidemicSettings) {
    if (epidemicSettings === undefined) {
        return {};
    }
    if (!isRecord(epidemicSettings)) {
        throw new Error("Invalid save epidemic settings");
    }
    const normalized = {};
    if (epidemicSettings.howContagious !== undefined) {
        normalized.howContagious = normalizePositiveInteger(epidemicSettings.howContagious, "epidemicSettings.howContagious");
    }
    for (const key of ["contagiousSpreadFactor", "reduceContagiousMonths", "reduceContagiousPeepCount", "reduceContagiousRate"]) {
        if (epidemicSettings[key] === undefined) {
            continue;
        }
        normalized[key] = normalizeNonNegativeInteger(epidemicSettings[key], `epidemicSettings.${key}`);
    }
    if (epidemicSettings.fine !== undefined) {
        normalized.fine = normalizeNonNegativeInteger(epidemicSettings.fine, "epidemicSettings.fine");
    }
    if (epidemicSettings.compensationLow !== undefined) {
        normalized.compensationLow = normalizeNonNegativeInteger(epidemicSettings.compensationLow, "epidemicSettings.compensationLow");
    }
    if (epidemicSettings.compensationHigh !== undefined) {
        normalized.compensationHigh = normalizeNonNegativeInteger(epidemicSettings.compensationHigh, "epidemicSettings.compensationHigh");
    }
    return normalized;
}
function normalizeLandSettings(landSettings) {
    if (landSettings === undefined) {
        return {};
    }
    if (!isRecord(landSettings)) {
        throw new Error("Invalid save land settings");
    }
    const normalized = {};
    if (landSettings.landCostPerTile !== undefined) {
        normalized.landCostPerTile = normalizeNonNegativeInteger(landSettings.landCostPerTile, "landSettings.landCostPerTile");
    }
    return normalized;
}
function normalizeStaffFatigueSettings(staffFatigueSettings) {
    if (staffFatigueSettings === undefined) {
        return {};
    }
    if (!isRecord(staffFatigueSettings)) {
        throw new Error("Invalid save staff fatigue settings");
    }
    const normalized = {};
    for (const key of ["restStanding", "restSofa", "restGame", "restSnooker", "workLight", "modifyFrequency", "notTired", "tired", "veryTired", "crackUpTired", "recoveryFactor", "recoveryMinimum", "resignMax"]) {
        if (staffFatigueSettings[key] === undefined) {
            continue;
        }
        normalized[key] = normalizeNonNegativeInteger(staffFatigueSettings[key], `staffFatigueSettings.${key}`);
    }
    return normalized;
}
function normalizePatientBehaviorSettings(patientBehaviorSettings) {
    if (patientBehaviorSettings === undefined) {
        return {};
    }
    if (!isRecord(patientBehaviorSettings)) {
        throw new Error("Invalid save patient behavior settings");
    }
    const normalized = {};
    for (const key of ["litterDrop", "leaveMax", "happy", "unhappy", "veryUnhappy", "drinkHappy", "toiletHappy", "bowelFull", "bowelOverflows", "vomitLimit", "litterRandom"]) {
        if (patientBehaviorSettings[key] === undefined) {
            continue;
        }
        normalized[key] = normalizeNonNegativeInteger(patientBehaviorSettings[key], `patientBehaviorSettings.${key}`);
    }
    return normalized;
}
function normalizeSalarySettings(salarySettings) {
    if (salarySettings === undefined) {
        return {};
    }
    if (!isRecord(salarySettings)) {
        throw new Error("Invalid save salary settings");
    }
    const normalized = {};
    if (salarySettings.salaryAbilityDivisor !== undefined) {
        normalized.salaryAbilityDivisor = normalizePositiveInteger(salarySettings.salaryAbilityDivisor, "salarySettings.salaryAbilityDivisor");
    }
    if (salarySettings.salaryTooLow !== undefined) {
        normalized.salaryTooLow = normalizeInteger(salarySettings.salaryTooLow, "salarySettings.salaryTooLow");
    }
    if (salarySettings.salaryTooHigh !== undefined) {
        normalized.salaryTooHigh = normalizeInteger(salarySettings.salaryTooHigh, "salarySettings.salaryTooHigh");
    }
    if (salarySettings.salaryAdds !== undefined) {
        if (!Array.isArray(salarySettings.salaryAdds)) {
            throw new Error("Invalid save salary adds");
        }
        normalized.salaryAdds = salarySettings.salaryAdds.map((entry, index) => {
            if (!isRecord(entry)) {
                throw new Error("Invalid save salary add entry");
            }
            return {
                index: normalizeNonNegativeInteger(entry.index, `salarySettings.salaryAdds[${index}].index`),
                value: normalizeInteger(entry.value, `salarySettings.salaryAdds[${index}].value`),
                ...(typeof entry.name === "string" && entry.name.length > 0 ? { name: entry.name } : {})
            };
        });
    }
    return normalized;
}
function normalizeAllocationSettings(allocationSettings) {
    if (allocationSettings === undefined) {
        return {};
    }
    if (!isRecord(allocationSettings)) {
        throw new Error("Invalid save allocation settings");
    }
    const normalized = {};
    for (const key of ["randomWeight", "totalReputationWeight", "illnessReputationWeight", "delayMonths"]) {
        if (allocationSettings[key] === undefined) {
            continue;
        }
        normalized[key] = normalizeNonNegativeInteger(allocationSettings[key], `allocationSettings.${key}`);
    }
    return normalized;
}
function normalizeRoutingSettings(routingSettings) {
    if (routingSettings === undefined) {
        return {};
    }
    if (!isRecord(routingSettings)) {
        throw new Error("Invalid save routing settings");
    }
    const normalized = {};
    for (const key of ["queuePoints", "distancePoints", "noStaffPoints"]) {
        if (routingSettings[key] === undefined) {
            continue;
        }
        normalized[key] = normalizeNonNegativeInteger(routingSettings[key], `routingSettings.${key}`);
    }
    return normalized;
}
function normalizeEventSettings(eventSettings) {
    if (eventSettings === undefined) {
        return {};
    }
    if (!isRecord(eventSettings)) {
        throw new Error("Invalid save event settings");
    }
    const normalized = {};
    for (const key of ["scoreMaxIncrease", "vaccinationCost", "removeRatHoleChance", "minimumAbductionYears", "abductionsPerYear", "autopsyResearchPercent", "autopsyReputationHitPercent", "mayorLaunch", "disasterLaunch"]) {
        if (eventSettings[key] === undefined) {
            continue;
        }
        normalized[key] = normalizeNonNegativeInteger(eventSettings[key], `eventSettings.${key}`);
    }
    return normalized;
}
function normalizeAwardCriteria(awardCriteria) {
    if (awardCriteria === undefined) {
        return {};
    }
    if (!isRecord(awardCriteria)) {
        throw new Error("Invalid save award criteria");
    }
    const normalized = {};
    for (const [key, value] of Object.entries(awardCriteria)) {
        if (!/^[a-z][a-zA-Z0-9]*$/u.test(key)) {
            throw new Error("Invalid save award criteria key");
        }
        normalized[key] = key.endsWith("Penalty")
            ? normalizeInteger(value, `awardCriteria.${key}`)
            : normalizeNonNegativeInteger(value, `awardCriteria.${key}`);
    }
    return normalized;
}
function normalizeEmergencySchedule(schedule) {
    if (schedule === undefined) {
        return [];
    }
    if (!Array.isArray(schedule)) {
        throw new Error("Invalid save emergency schedule");
    }
    return schedule.map((entry, index) => {
        if (!isRecord(entry)) {
            throw new Error("Invalid save emergency schedule entry");
        }
        const normalized = {
            index: Number.isInteger(entry.index) ? entry.index : index,
            startMonth: normalizeNonNegativeInteger(entry.startMonth, "emergencySchedule.startMonth"),
            endMonth: normalizeNonNegativeInteger(entry.endMonth, "emergencySchedule.endMonth"),
            minPatients: normalizeNonNegativeInteger(entry.minPatients, "emergencySchedule.minPatients"),
            maxPatients: normalizeNonNegativeInteger(entry.maxPatients, "emergencySchedule.maxPatients"),
            illnessCode: normalizeNonNegativeInteger(entry.illnessCode, "emergencySchedule.illnessCode"),
            percentToWin: normalizeNonNegativeInteger(entry.percentToWin, "emergencySchedule.percentToWin"),
            bonusCash: normalizeNonNegativeInteger(entry.bonusCash, "emergencySchedule.bonusCash")
        };
        if (entry.diseaseId !== undefined) {
            if (typeof entry.diseaseId !== "string" || entry.diseaseId.length === 0) {
                throw new Error("Invalid save emergency schedule disease");
            }
            normalized.diseaseId = entry.diseaseId;
        }
        if (entry.severity !== undefined) {
            const severity = normalizePositiveInteger(entry.severity, "emergencySchedule.severity");
            if (severity > 3) {
                throw new Error("emergencySchedule.severity must be 1, 2, or 3");
            }
            normalized.severity = severity;
        }
        return normalized;
    }).sort((left, right) => left.startMonth - right.startMonth || left.index - right.index);
}
function normalizeExpertise(expertise) {
    if (expertise === undefined) {
        return [];
    }
    if (!Array.isArray(expertise)) {
        throw new Error("Invalid save expertise");
    }
    return expertise.map((entry, index) => {
        if (!isRecord(entry) || typeof entry.token !== "string" || entry.token.length === 0 || typeof entry.known !== "boolean") {
            throw new Error("Invalid save expertise entry");
        }
        const normalized = {
            index: Number.isInteger(entry.index) ? entry.index : index,
            known: entry.known,
            researchRequired: normalizeNonNegativeInteger(entry.researchRequired, "expertise.researchRequired"),
            token: entry.token
        };
        if (entry.maxDiagDifficulty !== undefined) {
            normalized.maxDiagDifficulty = normalizeNonNegativeInteger(entry.maxDiagDifficulty, "expertise.maxDiagDifficulty");
        }
        if (entry.category !== undefined) {
            if (typeof entry.category !== "string" || entry.category.length === 0) {
                throw new Error("Invalid save expertise category");
            }
            normalized.category = entry.category;
        }
        if (entry.diseaseId !== undefined) {
            if (typeof entry.diseaseId !== "string" || entry.diseaseId.length === 0) {
                throw new Error("Invalid save expertise disease");
            }
            normalized.diseaseId = entry.diseaseId;
        }
        if (entry.severity !== undefined) {
            const severity = normalizePositiveInteger(entry.severity, "expertise.severity");
            if (severity > 3) {
                throw new Error("expertise.severity must be 1, 2, or 3");
            }
            normalized.severity = severity;
        }
        return normalized;
    }).sort((left, right) => left.index - right.index);
}
function normalizeScenarioOpponents(opponents) {
    if (opponents === undefined) {
        return [];
    }
    if (!Array.isArray(opponents)) {
        throw new Error("Invalid save scenario opponents");
    }
    return opponents.map((entry, index) => {
        if (!isRecord(entry) || typeof entry.name !== "string" || entry.name.length === 0) {
            throw new Error("Invalid save scenario opponent entry");
        }
        return {
            index: Number.isInteger(entry.index) ? entry.index : index,
            skill: normalizeNonNegativeInteger(entry.skill, "scenarioOpponents.skill"),
            staffLevels: normalizeNonNegativeInteger(entry.staffLevels, "scenarioOpponents.staffLevels"),
            luck: normalizeNonNegativeInteger(entry.luck, "scenarioOpponents.luck"),
            speed: normalizeNonNegativeInteger(entry.speed, "scenarioOpponents.speed"),
            comfort: normalizeNonNegativeInteger(entry.comfort, "scenarioOpponents.comfort"),
            guessAt: normalizeNonNegativeInteger(entry.guessAt, "scenarioOpponents.guessAt"),
            playing: entry.playing === true,
            name: entry.name
        };
    }).sort((left, right) => left.index - right.index);
}
function normalizeNetworkCriteria(criteria) {
    if (criteria === undefined) {
        return [];
    }
    if (!Array.isArray(criteria)) {
        throw new Error("Invalid save network criteria");
    }
    return criteria.map((entry, index) => {
        if (!isRecord(entry) || typeof entry.metric !== "string" || entry.metric.length === 0) {
            throw new Error("Invalid save network criterion entry");
        }
        return {
            index: Number.isInteger(entry.index) ? entry.index : index,
            metricCode: normalizeFiniteNumber(entry.metricCode, "networkCriteria.metricCode"),
            metric: entry.metric,
            value: normalizeFiniteNumber(entry.value, "networkCriteria.value"),
            month: normalizeFiniteNumber(entry.month, "networkCriteria.month"),
            timeToDo: normalizeFiniteNumber(entry.timeToDo, "networkCriteria.timeToDo")
        };
    }).sort((left, right) => left.month - right.month || left.index - right.index);
}
function normalizeLevelObjective(objective) {
    if (!isRecord(objective)) {
        throw new Error("Invalid save level objective");
    }
    const normalized = {
        requiredDischarges: normalizeNonNegativeInteger(objective.requiredDischarges, "levelObjective.requiredDischarges"),
        minimumCash: normalizeFiniteNumber(objective.minimumCash, "levelObjective.minimumCash"),
        minimumReputation: normalizeNonNegativeInteger(objective.minimumReputation, "levelObjective.minimumReputation"),
        minimumTreatmentPercentage: normalizePercentage(objective.minimumTreatmentPercentage, "levelObjective.minimumTreatmentPercentage"),
        minimumHospitalValue: normalizeNonNegativeFiniteNumber(objective.minimumHospitalValue, "levelObjective.minimumHospitalValue"),
        bankruptcyCashThreshold: normalizeFiniteNumber(objective.bankruptcyCashThreshold, "levelObjective.bankruptcyCashThreshold"),
        reputationFailureThreshold: normalizeNonNegativeInteger(objective.reputationFailureThreshold ?? 0, "levelObjective.reputationFailureThreshold")
    };
    if (objective.maximumDeaths !== undefined) {
        normalized.maximumDeaths = normalizeNonNegativeInteger(objective.maximumDeaths, "levelObjective.maximumDeaths");
    }
    return normalized;
}
function normalizeBounds(bounds) {
    if (!isRecord(bounds)) {
        throw new Error("Invalid save bounds");
    }
    return {
        width: normalizePositiveInteger(bounds.width, "bounds.width"),
        height: normalizePositiveInteger(bounds.height, "bounds.height")
    };
}
function normalizeRuntime(runtime) {
    if (!isRecord(runtime) || typeof runtime.paused !== "boolean") {
        throw new Error("Invalid save runtime state");
    }
    if (runtime.admissionsOpen !== undefined && typeof runtime.admissionsOpen !== "boolean") {
        throw new Error("Invalid save admissions state");
    }
    return {
        paused: runtime.paused,
        admissionsOpen: runtime.admissionsOpen === true,
        speedMultiplier: normalizeSpeedMultiplier(runtime.speedMultiplier),
        admissionPolicy: normalizeAdmissionPolicy(runtime.admissionPolicy),
        tickAccumulatorMs: normalizeNonNegativeFiniteNumber(runtime.tickAccumulatorMs, "tickAccumulatorMs"),
        ...(runtime.levelOutcome !== undefined ? { levelOutcome: normalizeLevelOutcome(runtime.levelOutcome) } : {})
    };
}
function normalizeLevelOutcome(outcome) {
    if (!isRecord(outcome) || (outcome.status !== "won" && outcome.status !== "lost")) {
        throw new Error("Invalid save level outcome");
    }
    if (typeof outcome.reason !== "string" || outcome.reason.length === 0) {
        throw new Error("Invalid save level outcome reason");
    }
    return {
        status: outcome.status,
        reason: outcome.reason
    };
}
function normalizeSpeedMultiplier(value = DEFAULT_SPEED_MULTIPLIER) {
    if (!ALLOWED_SPEED_MULTIPLIERS.includes(value)) {
        throw new Error("Invalid save speed multiplier");
    }
    return value;
}
function normalizeAdmissionPolicy(value = DEFAULT_ADMISSION_POLICY) {
    if (!ALLOWED_ADMISSION_POLICIES.includes(value)) {
        throw new Error("Invalid save admission policy");
    }
    return value;
}
function normalizeGridPositions(value, label) {
    if (value === undefined) {
        return [];
    }
    if (!Array.isArray(value)) {
        throw new Error(`Invalid ${label}`);
    }
    return value.map((position, index) => {
        if (!isRecord(position) || !Number.isInteger(position.x) || !Number.isInteger(position.y) || position.x < 0 || position.y < 0) {
            throw new Error(`Invalid ${label}[${index}]`);
        }
        return { x: position.x, y: position.y };
    });
}
function normalizeMapView(value) {
    if (value === undefined) {
        return null;
    }
    if (!isRecord(value) ||
        typeof value.mapPath !== "string" ||
        value.mapPath.length === 0 ||
        !Number.isInteger(value.startX) ||
        !Number.isInteger(value.startY) ||
        value.startX < 0 ||
        value.startY < 0) {
        throw new Error("Invalid save map view");
    }
    return {
        mapPath: value.mapPath,
        startX: value.startX,
        startY: value.startY
    };
}
function coerceV1Envelope(input) {
    if (!isRecord(input)) {
        throw new Error("Invalid v1 envelope");
    }
    if (input.format !== SAVE_FORMAT || input.schemaVersion !== 1) {
        throw new Error("Not a v1 envelope");
    }
    if (typeof input.savedAtIso !== "string") {
        throw new Error("Invalid v1 savedAtIso");
    }
    if (!isRecord(input.payload)) {
        throw new Error("Invalid v1 payload");
    }
    return {
        format: SAVE_FORMAT,
        schemaVersion: 1,
        savedAtIso: normalizeIsoTimestamp(input.savedAtIso),
        payload: {
            seed: normalizePositiveInteger(input.payload.seed, "seed"),
            tickRateHz: normalizePositiveInteger(input.payload.tickRateHz, "tickRateHz"),
            pointerTileSize: normalizePositiveInteger(input.payload.pointerTileSize, "pointerTileSize"),
            commands: cloneCommandLog(input.payload.commands)
        }
    };
}
function coerceV2Envelope(input) {
    if (!isRecord(input)) {
        throw new Error("Invalid v2 envelope");
    }
    if (input.format !== SAVE_FORMAT || input.schemaVersion !== LATEST_SAVE_SCHEMA_VERSION) {
        throw new Error("Not a v2 envelope");
    }
    const payload = normalizeSnapshot(input.payload);
    const envelope = {
        format: SAVE_FORMAT,
        schemaVersion: LATEST_SAVE_SCHEMA_VERSION,
        savedAtIso: normalizeIsoTimestamp(input.savedAtIso),
        payload
    };
    if (typeof input.fallbackReason === "string" && input.fallbackReason.length > 0) {
        envelope.fallbackReason = input.fallbackReason;
    }
    return envelope;
}
function isV0Envelope(input) {
    return isRecord(input) && input.version === "0" && typeof input.stateHash === "string";
}
function isSaveSlotRecord(value) {
    return (isRecord(value) &&
        typeof value.slot === "string" &&
        typeof value.serialized === "string" &&
        typeof value.savedAtIso === "string" &&
        typeof value.schemaVersion === "number");
}
function cloneCommandLog(commands) {
    if (!Array.isArray(commands)) {
        throw new Error("Invalid command log");
    }
    const cloned = [];
    for (const command of commands) {
        assertGameCommand(command);
        cloned.push(cloneCommand(command));
    }
    return cloned;
}
function cloneCommand(command) {
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
        return { type: "run-awards-ceremony" };
    }
    if (command.type === "start-research") {
        return { type: "start-research" };
    }
    if (command.type === "start-emergency-wave") {
        return { type: "start-emergency-wave" };
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
function normalizePositiveInteger(value, label) {
    if (!Number.isInteger(value) || value <= 0) {
        throw new Error(`${label} must be a positive integer`);
    }
    return value;
}
function normalizeFiniteNumber(value, label) {
    if (typeof value !== "number" || !Number.isFinite(value)) {
        throw new Error(`${label} must be finite`);
    }
    return value;
}
function normalizeNonNegativeFiniteNumber(value, label) {
    const normalized = normalizeFiniteNumber(value, label);
    if (normalized < 0) {
        throw new Error(`${label} must be a finite non-negative number`);
    }
    return normalized;
}
function normalizeNonNegativeInteger(value, label) {
    if (!Number.isInteger(value) || value < 0) {
        throw new Error(`${label} must be a non-negative integer`);
    }
    return value;
}
function normalizeInteger(value, label) {
    if (!Number.isInteger(value)) {
        throw new Error(`${label} must be an integer`);
    }
    return value;
}
function normalizePercentage(value, label) {
    const normalized = normalizeNonNegativeFiniteNumber(value, label);
    if (normalized > 100) {
        throw new Error(`${label} must be between 0 and 100`);
    }
    return normalized;
}
function normalizeIsoTimestamp(value) {
    if (typeof value !== "string") {
        throw new Error("save timestamp must be a string");
    }
    const parsed = Date.parse(value);
    if (!Number.isFinite(parsed)) {
        throw new Error("Invalid ISO timestamp");
    }
    return new Date(parsed).toISOString();
}
function assertSlotName(slot) {
    if (typeof slot !== "string" || slot.trim().length === 0) {
        throw new Error("slot must be a non-empty string");
    }
}
function isRecord(value) {
    return typeof value === "object" && value !== null;
}
