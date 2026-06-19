import { decompressRnc, isRncCompressed } from "./rnc.js";
import { decodeThemeHospitalSpriteSheet } from "./theme-graphics.js";

export { decompressRnc, getRncInputSize, getRncOutputSize, isRncCompressed } from "./rnc.js";
export {
    decodeThemeHospitalPalette,
    decodeThemeHospitalAnimationSet,
    decodeThemeHospitalAnimationSetFromBundle,
    decodeThemeHospitalSpriteSheet,
    decodeThemeHospitalSpriteSheetFromBundle,
    findFirstRenderableThemeHospitalAnimation,
    findFirstVisibleThemeHospitalSprite,
    renderThemeHospitalAnimationFrame,
    renderThemeHospitalMapScene,
    renderThemeHospitalSprite
} from "./theme-graphics.js";

export const REQUIRED_ASSET_DIRECTORIES = ["DATA", "LEVELS", "QDATA"];
export const REQUIRED_ASSET_FILES = ["HOSPITAL.CFG", "HOSPITAL.EXE"];
export const THEME_HOSPITAL_MAP_WIDTH = 128;
export const THEME_HOSPITAL_MAP_HEIGHT = 128;
export const THEME_HOSPITAL_MAP_FILE_SIZE = 163_948;
export function validateAssetPath(path) {
    const normalizedPath = normalizePath(path);
    if (!normalizedPath) {
        return { path, valid: false };
    }
    return { path, valid: true, normalizedPath };
}
export function decodeAssetImport(inputFiles) {
    const diagnostics = [];
    if (inputFiles.length === 0) {
        diagnostics.push({
            code: "no-files",
            severity: "error",
            message: "No files were selected for import.",
            hint: "Choose your original Theme Hospital game-data folder so required files and subfolders are included."
        });
        return {
            status: "invalid",
            diagnostics
        };
    }
    const normalizedRecords = [];
    const seenNormalizedPaths = new Map();
    let hasErrors = false;
    for (const file of inputFiles) {
        const normalizedPath = normalizePath(file.path);
        if (!normalizedPath) {
            diagnostics.push({
                code: "invalid-path",
                severity: "error",
                message: `Invalid asset path "${file.path}".`,
                path: file.path,
                hint: "Paths must be relative and cannot contain empty segments, '.' or '..'."
            });
            hasErrors = true;
            continue;
        }
        const dedupeKey = normalizedPath.toUpperCase();
        const previousPath = seenNormalizedPaths.get(dedupeKey);
        if (previousPath) {
            diagnostics.push({
                code: "duplicate-file",
                severity: "error",
                message: `Duplicate asset file path detected: "${file.path}" conflicts with "${previousPath}".`,
                path: file.path,
                hint: "Remove duplicate files so each path is unique (case-insensitive)."
            });
            hasErrors = true;
            continue;
        }
        seenNormalizedPaths.set(dedupeKey, file.path);
        normalizedRecords.push({
            originalPath: file.path,
            normalizedPath,
            segments: normalizedPath.split("/"),
            bytes: file.bytes
        });
    }
    const detectedRootPrefix = detectRootPrefix(normalizedRecords);
    if (detectedRootPrefix) {
        diagnostics.push({
            code: "detected-root-prefix",
            severity: "info",
            message: `Detected import folder prefix "${detectedRootPrefix}" and normalized paths to game-data root.`,
            hint: "Folder-prefix normalization is expected for browser directory uploads."
        });
    }
    const rootScopedRecords = createCanonicalAssetRecords(normalizedRecords, detectedRootPrefix);
    const ignoredRecordCount = normalizedRecords.length - rootScopedRecords.length;
    if (ignoredRecordCount > 0) {
        diagnostics.push({
            code: "ignored-outside-root",
            severity: "info",
            message: `Ignored ${ignoredRecordCount} file${ignoredRecordCount === 1 ? "" : "s"} outside the detected game-data root.`,
            hint: "This is expected when importing from a wrapped installer or app bundle."
        });
    }
    const canonicalRecords = [];
    const seenCanonicalPaths = new Map();
    for (const record of rootScopedRecords) {
        const dedupeKey = record.normalizedPath.toUpperCase();
        const previousPath = seenCanonicalPaths.get(dedupeKey);
        if (previousPath) {
            diagnostics.push({
                code: "duplicate-file",
                severity: "error",
                message: `Duplicate canonical asset path detected: "${record.originalPath}" conflicts with "${previousPath}".`,
                path: record.originalPath,
                hint: "Remove duplicate files so each game-data path is unique (case-insensitive)."
            });
            hasErrors = true;
            continue;
        }
        seenCanonicalPaths.set(dedupeKey, record.originalPath);
        canonicalRecords.push(record);
    }
    const topLevelDirectories = new Set();
    const topLevelFiles = new Map();
    for (const record of canonicalRecords) {
        const topLevelSegment = record.segments[0];
        if (!topLevelSegment) {
            diagnostics.push({
                code: "invalid-path",
                severity: "error",
                message: `Invalid normalized asset path "${record.normalizedPath}".`,
                path: record.originalPath,
                hint: "Paths must resolve to at least one segment."
            });
            hasErrors = true;
            continue;
        }
        if (record.segments.length > 1) {
            topLevelDirectories.add(topLevelSegment.toUpperCase());
            continue;
        }
        topLevelFiles.set(topLevelSegment.toUpperCase(), record);
    }
    for (const directory of REQUIRED_ASSET_DIRECTORIES) {
        if (!topLevelDirectories.has(directory)) {
            diagnostics.push({
                code: "missing-required-directory",
                severity: "error",
                message: `Missing required directory "${directory}".`,
                hint: `Include the "${directory}" directory from the original game data folder.`
            });
            hasErrors = true;
        }
    }
    for (const fileName of REQUIRED_ASSET_FILES) {
        const requiredFileRecord = topLevelFiles.get(fileName);
        if (!requiredFileRecord) {
            diagnostics.push({
                code: "missing-required-file",
                severity: "error",
                message: `Missing required file "${fileName}".`,
                hint: `Include "${fileName}" from the original game data folder root.`
            });
            hasErrors = true;
            continue;
        }
        if (requiredFileRecord.bytes.length === 0) {
            diagnostics.push({
                code: "empty-required-file",
                severity: "error",
                message: `Required file "${fileName}" is empty.`,
                path: requiredFileRecord.normalizedPath,
                hint: `Re-copy "${fileName}" from your original game installation and retry import.`
            });
            hasErrors = true;
        }
    }
    if (hasErrors) {
        return {
            status: "invalid",
            diagnostics
        };
    }
    const configSummary = summarizeConfig(topLevelFiles.get("HOSPITAL.CFG")?.bytes ?? new Uint8Array());
    const fileSummaries = canonicalRecords
        .map((record) => {
        const path = record.normalizedPath.toUpperCase();
        return {
            path,
            size: record.bytes.length,
            checksum: checksumFnv1a32(record.bytes)
        };
    })
        .sort((left, right) => left.path.localeCompare(right.path));
    diagnostics.push({
        code: "ready",
        severity: "info",
        message: "Import validation succeeded and transformed metadata is ready.",
        hint: "You can continue to start the game with imported assets."
    });
    return {
        status: "ready",
        diagnostics,
        manifest: {
            schemaVersion: 1,
            contract: "phase8.asset-import.v1",
            rootPrefix: detectedRootPrefix,
            importedFileCount: fileSummaries.length,
            requiredDirectories: [...REQUIRED_ASSET_DIRECTORIES],
            requiredFiles: [...REQUIRED_ASSET_FILES],
            files: fileSummaries,
            config: configSummary
        }
    };
}
export function createAssetBundle(inputFiles) {
    const result = decodeAssetImport(inputFiles);
    if (result.status !== "ready" || !result.manifest) {
        return {
            status: "invalid",
            diagnostics: result.diagnostics
        };
    }
    const filesByPath = new Map();
    const normalizedRecords = inputFiles
        .map((file) => {
        const normalizedPath = normalizePath(file.path);
        if (!normalizedPath) {
            return null;
        }
        return {
            originalPath: file.path,
            normalizedPath,
            segments: normalizedPath.split("/"),
            bytes: file.bytes
        };
    })
        .filter((record) => record !== null);
    for (const record of createCanonicalAssetRecords(normalizedRecords, result.manifest.rootPrefix)) {
        const canonicalPath = record.normalizedPath.toUpperCase();
        filesByPath.set(canonicalPath, {
            path: canonicalPath,
            size: record.bytes.length,
            checksum: checksumFnv1a32(record.bytes),
            bytes: new Uint8Array(record.bytes)
        });
    }
    const mapSummaries = summarizeThemeHospitalMapRecords(filesByPath);
    const qDataSpriteSheets = summarizeQDataSpriteSheets(filesByPath);
    const uiSpriteSheets = summarizeDataUiSpriteSheets(filesByPath);
    const languageSummary = summarizeThemeHospitalLanguage(filesByPath);
    const manifest = {
        ...result.manifest,
        mapSummaries,
        qDataSpriteSheets,
        uiSpriteSheets,
        ...(languageSummary ? { languageSummary } : {})
    };
    return {
        status: "ready",
        diagnostics: result.diagnostics,
        manifest,
        bundle: {
            contract: "phase8.asset-bundle.v1",
            manifest,
            filesByPath
        }
    };
}
export function hasAssetFile(bundle, path) {
    return getAssetRecord(bundle, path) !== null;
}
export function readAssetBytes(bundle, path) {
    const record = getAssetRecord(bundle, path);
    if (!record) {
        return null;
    }
    return new Uint8Array(record.bytes);
}
export function readAssetText(bundle, path, encoding = "utf-8") {
    const bytes = readAssetBytes(bundle, path);
    if (!bytes) {
        return null;
    }
    return new TextDecoder(encoding).decode(bytes);
}
export function decodeThemeHospitalMap(bytes, options = {}) {
    const input = bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes);
    const data = isRncCompressed(input) ? decompressRnc(input) : input;
    if (data.length < THEME_HOSPITAL_MAP_FILE_SIZE) {
        throw new Error(`Theme Hospital map is too short: expected at least ${THEME_HOSPITAL_MAP_FILE_SIZE} bytes, got ${data.length}`);
    }
    const width = THEME_HOSPITAL_MAP_WIDTH;
    const height = THEME_HOSPITAL_MAP_HEIGHT;
    const tiles = [];
    const objects = [];
    const parcelTileCounts = new Map();
    let parcelSlotCount = 1;
    const stats = {
        passableTileCount: 0,
        hospitalTileCount: 0,
        buildableTileCount: 0,
        objectCount: 0
    };
    for (let y = 0; y < height; y += 1) {
        for (let x = 0; x < width; x += 1) {
            const tileIndex = y * width + x;
            const recordOffset = THEME_HOSPITAL_MAP_TILE_OFFSET + tileIndex * THEME_HOSPITAL_MAP_TILE_RECORD_SIZE;
            const parcelOffset = THEME_HOSPITAL_MAP_PARCEL_OFFSET + tileIndex * 2;
            const tile = decodeThemeHospitalMapTile(data, recordOffset, parcelOffset, x, y, tiles);
            tiles.push(tile);
            parcelTileCounts.set(tile.parcelId, (parcelTileCounts.get(tile.parcelId) ?? 0) + 1);
            parcelSlotCount = Math.max(parcelSlotCount, tile.parcelId + 1);
            if (tile.flags.passable) {
                stats.passableTileCount += 1;
            }
            if (tile.flags.hospital) {
                stats.hospitalTileCount += 1;
            }
            if (tile.flags.buildable) {
                stats.buildableTileCount += 1;
            }
            if (tile.objectType !== 0) {
                objects.push({
                    x,
                    y,
                    type: tile.objectType,
                    flags: tile.objectFlags
                });
            }
        }
    }
    stats.objectCount = objects.length;
    const playerCount = clampInteger(data[0], 1, THEME_HOSPITAL_MAX_PLAYERS);
    return {
        contract: "theme-hospital-map.v1",
        width,
        height,
        tileCount: width * height,
        playerCount,
        parcelCount: parcelSlotCount - 1,
        cameras: readPlayerTileList(data, THEME_HOSPITAL_MAP_CAMERA_OFFSET, playerCount, width),
        heliports: readPlayerTileList(data, THEME_HOSPITAL_MAP_HELIPORT_OFFSET, playerCount, width),
        parcels: [...parcelTileCounts.entries()]
            .map(([id, tileCount]) => ({ id, tileCount }))
            .sort((left, right) => left.id - right.id),
        objects,
        stats,
        ...(options.includeTiles === false ? {} : { tiles })
    };
}
export function decodeThemeHospitalMapFromBundle(bundle, path, options = {}) {
    const bytes = readAssetBytes(bundle, path);
    if (!bytes) {
        return null;
    }
    return decodeThemeHospitalMap(bytes, options);
}
export function decodeThemeHospitalScenario(bytes, options = {}) {
    const input = bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes);
    const data = isRncCompressed(input) ? decompressRnc(input) : input;
    const text = new TextDecoder(options.encoding ?? "windows-1252").decode(data);
    const lines = text.split(/\r?\n/u);
    const title = lines.map((line) => line.trim()).find((line) => line.length > 0 && !line.startsWith("#")) ?? "";
    const winCriteria = [];
    const loseCriteria = [];
    const networkCriteria = [];
    const populationSchedule = [];
    const diseasePool = [];
    const staffLevels = [];
    const townSettings = [];
    const roomCosts = [];
    const staffSalaries = [];
    const objectAvailability = [];
    const admissionRules = {};
    const researchSettings = {};
    const trainingSettings = {};
    const epidemicSettings = {};
    const landSettings = {};
    const staffFatigueSettings = {};
    const patientBehaviorSettings = {};
    const salarySettings = {};
    const allocationSettings = {};
    const routingSettings = {};
    const eventSettings = {};
    const awardCriteria = {};
    const emergencySchedule = [];
    const quakeSchedule = [];
    const expertise = [];
    const scenarioOpponents = [];
    for (const line of lines) {
        const researchSetting = parseScenarioResearchSettingLine(line);
        if (researchSetting) {
            researchSettings[researchSetting.key] = researchSetting.value;
            continue;
        }
        const trainingSetting = parseScenarioTrainingSettingLine(line);
        if (trainingSetting) {
            if (trainingSetting.index === undefined) {
                trainingSettings[trainingSetting.key] = trainingSetting.value;
            }
            else if (trainingSetting.key === "abilityThreshold") {
                trainingSettings.abilityThresholds ??= [];
                trainingSettings.abilityThresholds.push(trainingSetting);
            }
            else {
                trainingSettings.trainingValues ??= [];
                trainingSettings.trainingValues.push(trainingSetting);
            }
            continue;
        }
        const epidemicSetting = parseScenarioEpidemicSettingLine(line);
        if (epidemicSetting) {
            epidemicSettings[epidemicSetting.key] = epidemicSetting.value;
            continue;
        }
        const landSetting = parseScenarioLandSettingLine(line);
        if (landSetting) {
            landSettings[landSetting.key] = landSetting.value;
            continue;
        }
        const staffFatigueSetting = parseScenarioStaffFatigueSettingLine(line);
        if (staffFatigueSetting) {
            staffFatigueSettings[staffFatigueSetting.key] = staffFatigueSetting.value;
            continue;
        }
        const patientBehaviorSetting = parseScenarioPatientBehaviorSettingLine(line);
        if (patientBehaviorSetting) {
            patientBehaviorSettings[patientBehaviorSetting.key] = patientBehaviorSetting.value;
            continue;
        }
        const salarySetting = parseScenarioSalarySettingLine(line);
        if (salarySetting) {
            if (salarySetting.key === "salaryAdd") {
                salarySettings.salaryAdds ??= [];
                salarySettings.salaryAdds.push(salarySetting);
            }
            else {
                salarySettings[salarySetting.key] = salarySetting.value;
            }
            continue;
        }
        const allocationSetting = parseScenarioAllocationSettingLine(line);
        if (allocationSetting) {
            allocationSettings[allocationSetting.key] = allocationSetting.value;
            continue;
        }
        const routingSetting = parseScenarioRoutingSettingLine(line);
        if (routingSetting) {
            routingSettings[routingSetting.key] = routingSetting.value;
            continue;
        }
        const eventSetting = parseScenarioEventSettingLine(line);
        if (eventSetting) {
            eventSettings[eventSetting.key] = eventSetting.value;
            continue;
        }
        const admissionRule = parseScenarioAdmissionRuleLine(line);
        if (admissionRule) {
            admissionRules[admissionRule.key] = admissionRule.value;
            continue;
        }
        const criterion = parseScenarioCriterionLine(line);
        if (criterion) {
            if (criterion.kind === "win") {
                winCriteria.push(criterion);
            }
            else {
                loseCriteria.push(criterion);
            }
            continue;
        }
        const networkCriterion = parseScenarioNetworkCriterionLine(line);
        if (networkCriterion) {
            networkCriteria.push(networkCriterion);
            continue;
        }
        const populationEntry = parseScenarioPopulationLine(line);
        if (populationEntry) {
            populationSchedule.push(populationEntry);
            continue;
        }
        const diseaseEntry = parseScenarioDiseaseLine(line);
        if (diseaseEntry) {
            diseasePool.push(diseaseEntry);
            continue;
        }
        const staffLevelEntry = parseScenarioStaffLevelLine(line);
        if (staffLevelEntry) {
            staffLevels.push(staffLevelEntry);
            continue;
        }
        const townEntry = parseScenarioTownLine(line);
        if (townEntry) {
            townSettings.push(townEntry);
            continue;
        }
        const roomCostEntry = parseScenarioRoomCostLine(line);
        if (roomCostEntry) {
            roomCosts.push(roomCostEntry);
            continue;
        }
        const staffSalaryEntry = parseScenarioStaffSalaryLine(line);
        if (staffSalaryEntry) {
            staffSalaries.push(staffSalaryEntry);
            continue;
        }
        const objectEntry = parseScenarioObjectLine(line);
        if (objectEntry) {
            objectAvailability.push(objectEntry);
            continue;
        }
        const awardCriterion = parseScenarioAwardCriterionLine(line);
        if (awardCriterion) {
            awardCriteria[awardCriterion.key] = awardCriterion.value;
            continue;
        }
        const emergencyEntry = parseScenarioEmergencyControlLine(line);
        if (emergencyEntry) {
            emergencySchedule.push(emergencyEntry);
            continue;
        }
        const quakeEntry = parseScenarioQuakeControlLine(line);
        if (quakeEntry) {
            quakeSchedule.push(quakeEntry);
            continue;
        }
        const expertiseEntry = parseScenarioExpertiseLine(line);
        if (expertiseEntry) {
            expertise.push(expertiseEntry);
            continue;
        }
        const opponentEntry = parseScenarioComputerLine(line);
        if (opponentEntry) {
            scenarioOpponents.push(opponentEntry);
        }
    }
    populationSchedule.sort((left, right) => left.month - right.month);
    staffLevels.sort((left, right) => left.month - right.month || left.index - right.index);
    townSettings.sort((left, right) => left.index - right.index);
    roomCosts.sort((left, right) => left.index - right.index);
    staffSalaries.sort((left, right) => left.index - right.index);
    emergencySchedule.sort((left, right) => left.startMonth - right.startMonth || left.index - right.index);
    quakeSchedule.sort((left, right) => left.startMonth - right.startMonth || left.index - right.index);
    expertise.sort((left, right) => left.index - right.index);
    scenarioOpponents.sort((left, right) => left.index - right.index);
    networkCriteria.sort((left, right) => left.month - right.month || left.index - right.index);
    return {
        contract: "theme-hospital-scenario.v1",
        title,
        winCriteria,
        loseCriteria,
        networkCriteria,
        populationSchedule,
        diseasePool,
        staffLevels,
        townSettings,
        roomCosts,
        staffSalaries,
        objectAvailability,
        admissionRules,
        researchSettings,
        trainingSettings,
        epidemicSettings,
        landSettings,
        staffFatigueSettings,
        patientBehaviorSettings,
        salarySettings,
        allocationSettings,
        routingSettings,
        eventSettings,
        awardCriteria,
        emergencySchedule,
        quakeSchedule,
        expertise,
        scenarioOpponents
    };
}
class IndexedDbAssetStoreImpl {
    indexedDbFactory;
    databaseName;
    manifestStoreName;
    fileStoreName;
    bundleId;
    openDatabasePromise;
    constructor(options) {
        this.indexedDbFactory = options.indexedDbFactory ?? defaultIndexedDbFactory();
        this.databaseName = options.databaseName ?? "corsixth-assets";
        this.manifestStoreName = options.manifestStoreName ?? "asset-manifests";
        this.fileStoreName = options.fileStoreName ?? "asset-files";
        this.bundleId = options.bundleId ?? "default";
    }
    async saveBundle(bundle) {
        const manifest = normalizeAssetManifest(bundle.manifest);
        const fileRecords = [];
        for (const [path, record] of bundle.filesByPath.entries()) {
            const normalizedPath = normalizeLookupPath(path);
            if (!normalizedPath) {
                throw new Error(`Invalid asset bundle path: ${path}`);
            }
            fileRecords.push({
                bundleId: this.bundleId,
                path: normalizedPath,
                size: record.bytes.length,
                checksum: checksumFnv1a32(record.bytes),
                bytes: new Uint8Array(record.bytes)
            });
        }
        await this.withStore(this.manifestStoreName, "readwrite", (store) => requestToPromise(store.put({
            bundleId: this.bundleId,
            manifest
        }, this.bundleId)));
        await this.deleteFileRecords();
        for (const record of fileRecords) {
            await this.withStore(this.fileStoreName, "readwrite", (store) => requestToPromise(store.put(record, fileRecordKey(this.bundleId, record.path))));
        }
    }
    async loadBundle() {
        const manifestRecord = await this.withStore(this.manifestStoreName, "readonly", (store) => requestToPromise(store.get(this.bundleId)));
        if (!isAssetManifestRecord(manifestRecord)) {
            return null;
        }
        const filesByPath = new Map();
        const fileRecords = await this.readFileRecords();
        for (const record of fileRecords) {
            filesByPath.set(record.path, {
                path: record.path,
                size: record.size,
                checksum: record.checksum,
                bytes: new Uint8Array(record.bytes)
            });
        }
        if (filesByPath.size !== manifestRecord.manifest.importedFileCount) {
            return null;
        }
        return {
            contract: "phase8.asset-bundle.v1",
            manifest: manifestRecord.manifest,
            filesByPath
        };
    }
    async deleteBundle() {
        await this.withStore(this.manifestStoreName, "readwrite", (store) => requestToPromise(store.delete(this.bundleId)));
        await this.deleteFileRecords();
    }
    async readFileRecords() {
        const values = await this.withStore(this.fileStoreName, "readonly", (store) => requestToPromise(store.getAll()));
        return values
            .filter((value) => isAssetFileRecord(value) && value.bundleId === this.bundleId)
            .sort((left, right) => left.path.localeCompare(right.path));
    }
    async deleteFileRecords() {
        const records = await this.readFileRecords();
        for (const record of records) {
            await this.withStore(this.fileStoreName, "readwrite", (store) => requestToPromise(store.delete(fileRecordKey(this.bundleId, record.path))));
        }
    }
    async withStore(storeName, mode, callback) {
        const database = await this.openDatabase();
        const transaction = database.transaction(storeName, mode);
        const store = transaction.objectStore(storeName);
        return callback(store);
    }
    async openDatabase() {
        if (this.openDatabasePromise) {
            return this.openDatabasePromise;
        }
        const request = this.indexedDbFactory.open(this.databaseName, 1);
        request.onupgradeneeded = () => {
            if (!request.result.objectStoreNames.contains(this.manifestStoreName)) {
                request.result.createObjectStore(this.manifestStoreName);
            }
            if (!request.result.objectStoreNames.contains(this.fileStoreName)) {
                request.result.createObjectStore(this.fileStoreName);
            }
        };
        this.openDatabasePromise = requestToPromise(request);
        return this.openDatabasePromise;
    }
}
export function createIndexedDbAssetStore(options = {}) {
    return new IndexedDbAssetStoreImpl(options);
}
function normalizePath(rawPath) {
    const trimmed = rawPath.trim().replaceAll("\\", "/");
    if (trimmed.length === 0) {
        return null;
    }
    let normalized = trimmed;
    while (normalized.startsWith("./")) {
        normalized = normalized.slice(2);
    }
    while (normalized.startsWith("/")) {
        normalized = normalized.slice(1);
    }
    if (normalized.length === 0) {
        return null;
    }
    const segments = normalized.split("/");
    for (const segment of segments) {
        if (segment.length === 0 || segment === "." || segment === "..") {
            return null;
        }
        if (segment.includes("\0")) {
            return null;
        }
    }
    return segments.join("/");
}
function normalizeLookupPath(path) {
    const normalizedPath = normalizePath(path);
    return normalizedPath ? normalizedPath.toUpperCase() : null;
}
function getAssetRecord(bundle, path) {
    const lookupPath = normalizeLookupPath(path);
    if (!lookupPath) {
        return null;
    }
    return bundle.filesByPath.get(lookupPath) ?? null;
}
function detectRootPrefix(records) {
    if (records.length === 0) {
        return null;
    }
    const candidates = new Set([""]);
    for (const record of records) {
        for (let prefixLength = 0; prefixLength < record.segments.length; prefixLength += 1) {
            candidates.add(record.segments.slice(0, prefixLength).join("/"));
        }
    }
    let bestCandidate = null;
    for (const candidate of candidates) {
        if (!candidateContainsThemeHospitalRoot(records, candidate)) {
            continue;
        }
        if (bestCandidate === null || pathSegmentCount(candidate) > pathSegmentCount(bestCandidate)) {
            bestCandidate = candidate;
        }
    }
    return bestCandidate === "" ? null : bestCandidate;
}
function candidateContainsThemeHospitalRoot(records, rootPrefix) {
    const topLevelDirectories = new Set();
    const topLevelFiles = new Set();
    for (const record of records) {
        if (!isPathInsideRoot(record.normalizedPath, rootPrefix)) {
            continue;
        }
        const canonicalPath = stripRootPrefix(record.normalizedPath, rootPrefix);
        const topLevelSegment = canonicalPath.split("/")[0];
        if (!topLevelSegment) {
            continue;
        }
        if (canonicalPath.includes("/")) {
            topLevelDirectories.add(topLevelSegment.toUpperCase());
        }
        else {
            topLevelFiles.add(topLevelSegment.toUpperCase());
        }
    }
    for (const directory of REQUIRED_ASSET_DIRECTORIES) {
        if (!topLevelDirectories.has(directory)) {
            return false;
        }
    }
    for (const fileName of REQUIRED_ASSET_FILES) {
        if (!topLevelFiles.has(fileName)) {
            return false;
        }
    }
    return true;
}
function createCanonicalAssetRecords(records, rootPrefix) {
    return records
        .filter((record) => isPathInsideRoot(record.normalizedPath, rootPrefix))
        .map((record) => {
        const normalizedPath = stripRootPrefix(record.normalizedPath, rootPrefix);
        return {
            originalPath: record.originalPath,
            normalizedPath,
            segments: normalizedPath.split("/"),
            bytes: record.bytes
        };
    });
}
function isPathInsideRoot(path, rootPrefix) {
    if (!rootPrefix) {
        return true;
    }
    return path.startsWith(`${rootPrefix}/`);
}
function pathSegmentCount(path) {
    if (!path) {
        return 0;
    }
    return path.split("/").length;
}
function stripRootPrefix(path, rootPrefix) {
    if (!rootPrefix) {
        return path;
    }
    if (path === rootPrefix) {
        return path;
    }
    if (!path.startsWith(`${rootPrefix}/`)) {
        return path;
    }
    return path.slice(rootPrefix.length + 1);
}
function summarizeConfig(bytes) {
    if (bytes.length === 0) {
        return {
            lineCount: 0,
            settingKeys: []
        };
    }
    const text = new TextDecoder().decode(bytes);
    const lines = text
        .split(/\r?\n/)
        .map((line) => line.trim())
        .filter((line) => line.length > 0 && !line.startsWith(";"));
    const settingKeys = new Set();
    for (const line of lines) {
        const equalsIndex = line.indexOf("=");
        if (equalsIndex <= 0) {
            continue;
        }
        const key = line.slice(0, equalsIndex).trim().toUpperCase();
        if (key.length > 0) {
            settingKeys.add(key);
        }
    }
    return {
        lineCount: lines.length,
        settingKeys: [...settingKeys]
    };
}
function checksumFnv1a32(bytes) {
    let hash = 0x811c9dc5;
    for (const byte of bytes) {
        hash ^= byte;
        hash = Math.imul(hash, 0x01000193) >>> 0;
    }
    return hash.toString(16).padStart(8, "0");
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
function normalizeAssetManifest(manifest) {
    if (!isAssetManifest(manifest)) {
        throw new Error("Invalid asset manifest");
    }
    return {
        ...manifest,
        files: manifest.files.map((file) => ({ ...file })),
        requiredDirectories: [...manifest.requiredDirectories],
        requiredFiles: [...manifest.requiredFiles],
        config: {
            lineCount: manifest.config.lineCount,
            settingKeys: [...manifest.config.settingKeys]
        },
        mapSummaries: (manifest.mapSummaries ?? []).map((summary) => ({
            ...summary,
            cameras: summary.cameras.map((camera) => ({ x: camera.x, y: camera.y })),
            heliports: summary.heliports.map((heliport) => ({ x: heliport.x, y: heliport.y })),
            ...(summary.scenario ? { scenario: cloneScenarioSummary(summary.scenario) } : {})
        })),
        qDataSpriteSheets: (manifest.qDataSpriteSheets ?? []).map((summary) => ({
            ...summary,
            ...(summary.firstVisibleSprite
                ? {
                    firstVisibleSprite: {
                        index: summary.firstVisibleSprite.index,
                        width: summary.firstVisibleSprite.width,
                        height: summary.firstVisibleSprite.height
                    }
                }
                : {})
        })),
        uiSpriteSheets: (manifest.uiSpriteSheets ?? []).map((summary) => ({
            ...summary,
            ...(summary.firstVisibleSprite
                ? {
                    firstVisibleSprite: {
                        index: summary.firstVisibleSprite.index,
                        width: summary.firstVisibleSprite.width,
                        height: summary.firstVisibleSprite.height
                    }
                }
                : {})
        })),
        ...(manifest.languageSummary
            ? {
                languageSummary: {
                    ...manifest.languageSummary,
                    staffRoles: { ...manifest.languageSummary.staffRoles },
                    objectNames: { ...(manifest.languageSummary.objectNames ?? {}) },
                    roomNames: { ...(manifest.languageSummary.roomNames ?? {}) },
                    patientStatusNames: { ...(manifest.languageSummary.patientStatusNames ?? {}) },
                    diseaseNames: { ...manifest.languageSummary.diseaseNames }
                }
            }
            : {})
    };
}
function isAssetManifest(value) {
    return (isRecord(value) &&
        value.schemaVersion === 1 &&
        value.contract === "phase8.asset-import.v1" &&
        Number.isInteger(value.importedFileCount) &&
        Array.isArray(value.files) &&
        Array.isArray(value.requiredDirectories) &&
        Array.isArray(value.requiredFiles) &&
        isRecord(value.config) &&
        Number.isInteger(value.config.lineCount) &&
        Array.isArray(value.config.settingKeys));
}
function isAssetManifestRecord(value) {
    return isRecord(value) && typeof value.bundleId === "string" && isAssetManifest(value.manifest);
}
function isAssetFileRecord(value) {
    return (isRecord(value) &&
        typeof value.bundleId === "string" &&
        typeof value.path === "string" &&
        Number.isInteger(value.size) &&
        typeof value.checksum === "string" &&
        value.bytes instanceof Uint8Array);
}
function fileRecordKey(bundleId, path) {
    return `${bundleId}\0${path}`;
}
function isRecord(value) {
    return typeof value === "object" && value !== null;
}
const THEME_HOSPITAL_MAX_PLAYERS = 4;
const THEME_HOSPITAL_MAP_TILE_OFFSET = 34;
const THEME_HOSPITAL_MAP_TILE_RECORD_SIZE = 8;
const THEME_HOSPITAL_MAP_PARCEL_OFFSET = 131_106;
const THEME_HOSPITAL_MAP_CAMERA_OFFSET = 163_876;
const THEME_HOSPITAL_MAP_HELIPORT_OFFSET = 163_884;
const THEME_HOSPITAL_DATA_UI_SPRITE_BASE_PATHS = [
    "DATA/MONEY01V",
    "DATA/MPOINTER",
    "DATA/PANEL02V",
    "DATA/PANEL04V",
    "DATA/PULLDV",
    "DATA/WATCH01V"
];
const THEME_HOSPITAL_MAP_BLOCK_LUT = [
    0x01, 0x02, 0x03, 0x04, 0x05, 0x06, 0x07, 0x08, 0x09, 0x0a, 0x0b, 0x0c,
    0x0d, 0x0e, 0x0f, 0x10, 0x11, 0x12, 0x13, 0x14, 0x15, 0x16, 0x17, 0x18,
    0x19, 0x1a, 0x1b, 0x1c, 0x1d, 0x1e, 0x1f, 0x20, 0x21, 0x22, 0x23, 0x24,
    0x25, 0x26, 0x27, 0x28, 0x29, 0x2a, 0x2b, 0x2c, 0x2d, 0x2e, 0x2f, 0x30,
    0x31, 0x32, 0x33, 0x34, 0x35, 0x36, 0x37, 0x38, 0x39, 0x3a, 0x3b, 0x3c,
    0x3d, 0x3e, 0x3f, 0x40, 0x41, 0x42, 0x43, 0x44, 0x45, 0x46, 0x47, 0x48,
    0x49, 0x4a, 0x4b, 0x4c, 0x4d, 0x4e, 0x4f, 0x50, 0x52, 0x53, 0x54, 0x55,
    0x56, 0x57, 0x58, 0x59, 0x5a, 0x5b, 0x5c, 0x5d, 0x5e, 0x5f, 0x60, 0x61,
    0x62, 0x63, 0x64, 0x65, 0x66, 0x67, 0x68, 0x69, 0x6a, 0x6b, 0x6c, 0x6d,
    0x6e, 0x6f, 0x70, 0x71, 0x72, 0x73, 0x74, 0x75, 0x76, 0x77, 0x78, 0x79,
    0x7a, 0x7b, 0x7c, 0x7d, 0x7e, 0x7f, 0x80, 0x81, 0x84, 0x85, 0x88, 0x89,
    0x8c, 0x8d, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x8e, 0x8f, 0x00, 0x00,
    0x00, 0x00, 0x8e, 0x8f, 0xd5, 0xd6, 0x9c, 0xcc, 0xcd, 0xce, 0xcf, 0xd0,
    0xd1, 0xd2, 0xd3, 0xd4, 0xb3, 0xaf, 0xb0, 0xb1, 0xb2, 0xb3, 0xb4, 0xb5,
    0xb6, 0xb7, 0xb8, 0xb9, 0xb3, 0xb3, 0xb4, 0xb4, 0xba, 0xbb, 0xbc, 0xbd,
    0xbe, 0xbf, 0xc0, 0xc1, 0xc2, 0xc3, 0xc4, 0xc5, 0xc6, 0xc7, 0xc8, 0xc9,
    0xca, 0xcb, 0x00, 0x82, 0x83, 0x86, 0x87, 0x8a, 0x8b, 0x92, 0x93, 0x94,
    0x95, 0x96, 0x97, 0x98, 0x99, 0x9a, 0x9b, 0x00, 0x9d, 0x9e, 0x9f, 0xa0,
    0xa1, 0xa2, 0xa3, 0xa4, 0xd7, 0xd8, 0xd9, 0xda, 0xdb, 0xdc, 0xdd, 0xde,
    0xdf, 0xe0, 0xe1, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
    0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
    0x00, 0x00, 0x00, 0x00
];
function summarizeQDataSpriteSheets(filesByPath) {
    const summaries = [];
    for (const [path, record] of filesByPath.entries()) {
        if (!/^QDATA\/.+\.TAB$/u.test(path)) {
            continue;
        }
        const basePath = path.slice(0, -4);
        const dataRecord = filesByPath.get(`${basePath}.DAT`);
        if (!dataRecord) {
            continue;
        }
        const spriteSheet = decodeQDataSpriteSheet(record.bytes, dataRecord.bytes);
        if (!spriteSheet) {
            continue;
        }
        const visibleSprites = spriteSheet.sprites.filter((sprite) => sprite.width > 0 && sprite.height > 0 && sprite.indices.length > 0);
        const firstVisibleSprite = visibleSprites[0] ?? null;
        summaries.push({
            path: basePath,
            spriteCount: spriteSheet.spriteCount,
            visibleSpriteCount: visibleSprites.length,
            ...(firstVisibleSprite
                ? {
                    firstVisibleSprite: {
                        index: firstVisibleSprite.index,
                        width: firstVisibleSprite.width,
                        height: firstVisibleSprite.height
                    }
                }
                : {})
        });
    }
    summaries.sort((left, right) => left.path.localeCompare(right.path));
    return summaries;
}
function summarizeDataUiSpriteSheets(filesByPath) {
    const summaries = [];
    for (const basePath of THEME_HOSPITAL_DATA_UI_SPRITE_BASE_PATHS) {
        const tableRecord = filesByPath.get(`${basePath}.TAB`);
        const dataRecord = filesByPath.get(`${basePath}.DAT`);
        if (!tableRecord || !dataRecord) {
            continue;
        }
        const spriteSheet = decodeQDataSpriteSheet(tableRecord.bytes, dataRecord.bytes);
        if (!spriteSheet) {
            continue;
        }
        const visibleSprites = spriteSheet.sprites.filter((sprite) => sprite.width > 0 && sprite.height > 0 && sprite.indices.length > 0);
        const firstVisibleSprite = visibleSprites[0] ?? null;
        summaries.push({
            path: basePath,
            spriteCount: spriteSheet.spriteCount,
            visibleSpriteCount: visibleSprites.length,
            ...(firstVisibleSprite
                ? {
                    firstVisibleSprite: {
                        index: firstVisibleSprite.index,
                        width: firstVisibleSprite.width,
                        height: firstVisibleSprite.height
                    }
                }
                : {})
        });
    }
    return summaries;
}
function decodeQDataSpriteSheet(tableBytes, chunkBytes) {
    try {
        return decodeThemeHospitalSpriteSheet(tableBytes, chunkBytes);
    }
    catch {
        try {
            return decodeThemeHospitalSpriteSheet(tableBytes, chunkBytes, { complex: true });
        }
        catch {
            return null;
        }
    }
}
function summarizeThemeHospitalLanguage(filesByPath) {
    const record = filesByPath.get("DATA/LANG-0.DAT");
    if (!record) {
        return null;
    }
    const entries = decodeThemeHospitalLanguageEntries(record.bytes);
    const diseaseNames = {};
    for (const [diseaseId, entryIndex] of THEME_HOSPITAL_LANGUAGE_DISEASE_INDEX_BY_ID.entries()) {
        const name = entries[entryIndex]?.trim();
        if (name) {
            diseaseNames[diseaseId] = name;
        }
    }
    return {
        path: record.path,
        entryCount: entries.length,
        staffRoles: {
            nurse: entries[0] ?? "Nurse",
            doctor: entries[1] ?? "Doctor",
            handyman: entries[2] ?? "Handyman",
            receptionist: entries[3] ?? "Receptionist"
        },
        objectNames: Object.fromEntries(entries.slice(0, 68).map((name, index) => [index, name])),
        roomNames: {
            diagnosis: entries[453] ?? "GP's Office",
            treatment: entries[455] ?? "Ward",
            pharmacy: entries[457] ?? "Pharmacy",
            specialist: entries[463] ?? "Inflation Room"
        },
        patientStatusNames: {
            queued: entries[2488] ?? "Queuing for %s",
            "walking-to-diagnosis": entries[2489] ?? "On my way to %s",
            diagnosing: entries[2494] ?? "Diagnosed: %s",
            diagnosed: entries[2494] ?? "Diagnosed: %s",
            "awaiting-treatment": entries[2487] ?? "Awaiting your decision",
            "walking-to-treatment": entries[2489] ?? "On my way to %s",
            treating: entries[2487] ?? "Awaiting your decision",
            discharged: entries[2490] ?? "Cured!",
            "sent-home": entries[2492] ?? "Sent Home"
        },
        diseaseNames
    };
}
export function decodeThemeHospitalLanguageEntries(bytes) {
    const data = isRncCompressed(bytes) ? decompressRnc(bytes) : bytes;
    if (data.length === 0) {
        return [];
    }
    const declaredCount = data.length >= 2 ? data[0] | (data[1] << 8) : 0;
    const tableEnd = declaredCount > 0 && declaredCount < 4096 && 2 + declaredCount * 2 < data.length
        ? 2 + declaredCount * 2
        : 0;
    const text = new TextDecoder("windows-1252").decode(data.subarray(tableEnd));
    return text.split("\0").map((entry) => entry.trim()).filter((entry) => entry.length > 0);
}
function summarizeThemeHospitalMapRecords(filesByPath) {
    const summaries = [];
    for (const [path, record] of filesByPath.entries()) {
        if (!isThemeHospitalMapPath(path)) {
            continue;
        }
        const decoded = decodeThemeHospitalMap(record.bytes, { includeTiles: false });
        const scenario = summarizeScenarioForMap(filesByPath, path);
        summaries.push({
            path,
            width: decoded.width,
            height: decoded.height,
            playerCount: decoded.playerCount,
            parcelCount: decoded.parcelCount,
            objectCount: decoded.stats.objectCount,
            passableTileCount: decoded.stats.passableTileCount,
            hospitalTileCount: decoded.stats.hospitalTileCount,
            buildableTileCount: decoded.stats.buildableTileCount,
            cameras: decoded.cameras,
            heliports: decoded.heliports,
            ...(scenario ? { scenario } : {})
        });
    }
    summaries.sort(compareThemeHospitalMapSummaries);
    return summaries;
}
function isThemeHospitalMapPath(path) {
    return path.endsWith(".MAP") || /^LEVELS\/LEVEL\.L\d+$/u.test(path);
}
function compareThemeHospitalMapSummaries(left, right) {
    const leftLevel = themeHospitalCampaignLevelNumber(left.path);
    const rightLevel = themeHospitalCampaignLevelNumber(right.path);
    if (leftLevel !== null && rightLevel !== null && leftLevel !== rightLevel) {
        return leftLevel - rightLevel;
    }
    if (leftLevel !== null && rightLevel === null) {
        return -1;
    }
    if (leftLevel === null && rightLevel !== null) {
        return 1;
    }
    return left.path.localeCompare(right.path);
}
function themeHospitalCampaignLevelNumber(path) {
    const match = /^LEVELS\/LEVEL\.L(\d+)$/u.exec(path);
    return match ? Number(match[1]) : null;
}
function summarizeScenarioForMap(filesByPath, mapPath) {
    const levelNumber = themeHospitalCampaignLevelNumber(mapPath);
    if (levelNumber === null) {
        return null;
    }
    for (const difficulty of ["FULL", "EASY", "HARD"]) {
        const scenarioPath = `LEVELS/${difficulty}${String(levelNumber).padStart(2, "0")}.SAM`;
        const record = filesByPath.get(scenarioPath);
        if (!record) {
            continue;
        }
        const decoded = decodeThemeHospitalScenario(record.bytes);
        const researchSettings = scenarioResearchSettingsForLevel(filesByPath, decoded, difficulty);
        const trainingSettings = scenarioTrainingSettingsForLevel(filesByPath, decoded, difficulty);
        const epidemicSettings = scenarioEpidemicSettingsForLevel(filesByPath, decoded, difficulty);
        const landSettings = scenarioLandSettingsForLevel(filesByPath, decoded, difficulty);
        const staffFatigueSettings = scenarioStaffFatigueSettingsForLevel(filesByPath, decoded, difficulty);
        const patientBehaviorSettings = scenarioPatientBehaviorSettingsForLevel(filesByPath, decoded, difficulty);
        const salarySettings = scenarioSalarySettingsForLevel(filesByPath, decoded, difficulty);
        const allocationSettings = scenarioAllocationSettingsForLevel(filesByPath, decoded, difficulty);
        const routingSettings = scenarioRoutingSettingsForLevel(filesByPath, decoded, difficulty);
        const eventSettings = scenarioEventSettingsForLevel(filesByPath, decoded, difficulty);
        const townSettings = scenarioTownSettingsForLevel(filesByPath, decoded, difficulty, levelNumber);
        const roomCosts = scenarioRoomCostsForLevel(filesByPath, decoded, difficulty);
        const staffSalaries = scenarioStaffSalariesForLevel(filesByPath, decoded, difficulty);
        const objectAvailability = scenarioObjectAvailabilityForLevel(filesByPath, decoded, difficulty);
        const awardCriteria = scenarioAwardCriteriaForLevel(filesByPath, decoded, difficulty);
        return {
            path: scenarioPath,
            difficulty: difficulty.toLowerCase(),
            levelNumber,
            title: decoded.title,
            winCriteria: decoded.winCriteria,
            loseCriteria: decoded.loseCriteria,
            networkCriteria: decoded.networkCriteria,
            populationSchedule: decoded.populationSchedule,
            diseasePool: decoded.diseasePool,
            staffLevels: decoded.staffLevels,
            townSettings,
            financialSettings: scenarioFinancialSettingsForLevel(townSettings, levelNumber),
            roomCosts,
            roomCostOverrides: scenarioRoomCostOverrides(roomCosts, objectAvailability),
            staffSalaries,
            staffWageOverrides: scenarioStaffWageOverrides(staffSalaries),
            objectAvailability,
            admissionRules: decoded.admissionRules,
            researchSettings,
            trainingSettings,
            epidemicSettings,
            landSettings,
            staffFatigueSettings,
            patientBehaviorSettings,
            salarySettings,
            allocationSettings,
            routingSettings,
            eventSettings,
            awardCriteria,
            emergencySchedule: decoded.emergencySchedule,
            quakeSchedule: decoded.quakeSchedule,
            expertise: decoded.expertise,
            scenarioOpponents: decoded.scenarioOpponents
        };
    }
    return null;
}
function scenarioResearchSettingsForLevel(filesByPath, decoded, difficulty) {
    const baseRecord = filesByPath.get(`LEVELS/${difficulty}00.SAM`);
    if (!baseRecord) {
        return decoded.researchSettings;
    }
    return {
        ...decodeThemeHospitalScenario(baseRecord.bytes).researchSettings,
        ...decoded.researchSettings
    };
}
function scenarioTrainingSettingsForLevel(filesByPath, decoded, difficulty) {
    const baseRecord = filesByPath.get(`LEVELS/${difficulty}00.SAM`);
    if (!baseRecord) {
        return cloneTrainingSettings(decoded.trainingSettings);
    }
    const base = decodeThemeHospitalScenario(baseRecord.bytes).trainingSettings;
    const trainingValues = decoded.trainingSettings.trainingValues ?? base.trainingValues;
    const abilityThresholdsByIndex = new Map();
    for (const entry of [...(base.abilityThresholds ?? []), ...(decoded.trainingSettings.abilityThresholds ?? [])]) {
        abilityThresholdsByIndex.set(entry.index, { ...entry });
    }
    const abilityThresholds = [...abilityThresholdsByIndex.values()].sort((left, right) => left.index - right.index);
    return {
        ...base,
        ...decoded.trainingSettings,
        ...(trainingValues ? { trainingValues: trainingValues.map((entry) => ({ ...entry })) } : {}),
        ...(abilityThresholds.length > 0 ? { abilityThresholds } : {})
    };
}
function scenarioEpidemicSettingsForLevel(filesByPath, decoded, difficulty) {
    const baseRecord = filesByPath.get(`LEVELS/${difficulty}00.SAM`);
    if (!baseRecord) {
        return decoded.epidemicSettings;
    }
    return {
        ...decodeThemeHospitalScenario(baseRecord.bytes).epidemicSettings,
        ...decoded.epidemicSettings
    };
}
function scenarioLandSettingsForLevel(filesByPath, decoded, difficulty) {
    const baseRecord = filesByPath.get(`LEVELS/${difficulty}00.SAM`);
    if (!baseRecord) {
        return decoded.landSettings;
    }
    return {
        ...decodeThemeHospitalScenario(baseRecord.bytes).landSettings,
        ...decoded.landSettings
    };
}
function scenarioStaffFatigueSettingsForLevel(filesByPath, decoded, difficulty) {
    const baseRecord = filesByPath.get(`LEVELS/${difficulty}00.SAM`);
    if (!baseRecord) {
        return decoded.staffFatigueSettings;
    }
    return {
        ...decodeThemeHospitalScenario(baseRecord.bytes).staffFatigueSettings,
        ...decoded.staffFatigueSettings
    };
}
function scenarioPatientBehaviorSettingsForLevel(filesByPath, decoded, difficulty) {
    const baseRecord = filesByPath.get(`LEVELS/${difficulty}00.SAM`);
    if (!baseRecord) {
        return decoded.patientBehaviorSettings;
    }
    return {
        ...decodeThemeHospitalScenario(baseRecord.bytes).patientBehaviorSettings,
        ...decoded.patientBehaviorSettings
    };
}
function scenarioSalarySettingsForLevel(filesByPath, decoded, difficulty) {
    const baseRecord = filesByPath.get(`LEVELS/${difficulty}00.SAM`);
    if (!baseRecord) {
        return cloneSalarySettings(decoded.salarySettings);
    }
    const base = decodeThemeHospitalScenario(baseRecord.bytes).salarySettings;
    const salaryAddsByIndex = new Map();
    for (const entry of [...(base.salaryAdds ?? []), ...(decoded.salarySettings.salaryAdds ?? [])]) {
        salaryAddsByIndex.set(entry.index, { ...entry });
    }
    const salaryAdds = [...salaryAddsByIndex.values()].sort((left, right) => left.index - right.index);
    return {
        ...base,
        ...decoded.salarySettings,
        ...(salaryAdds.length > 0 ? { salaryAdds } : {})
    };
}
function scenarioAllocationSettingsForLevel(filesByPath, decoded, difficulty) {
    const baseRecord = filesByPath.get(`LEVELS/${difficulty}00.SAM`);
    if (!baseRecord) {
        return decoded.allocationSettings;
    }
    return {
        ...decodeThemeHospitalScenario(baseRecord.bytes).allocationSettings,
        ...decoded.allocationSettings
    };
}
function scenarioRoutingSettingsForLevel(filesByPath, decoded, difficulty) {
    const baseRecord = filesByPath.get(`LEVELS/${difficulty}00.SAM`);
    if (!baseRecord) {
        return decoded.routingSettings;
    }
    return {
        ...decodeThemeHospitalScenario(baseRecord.bytes).routingSettings,
        ...decoded.routingSettings
    };
}
function scenarioEventSettingsForLevel(filesByPath, decoded, difficulty) {
    const baseRecord = filesByPath.get(`LEVELS/${difficulty}00.SAM`);
    if (!baseRecord) {
        return decoded.eventSettings;
    }
    return {
        ...decodeThemeHospitalScenario(baseRecord.bytes).eventSettings,
        ...decoded.eventSettings
    };
}
function scenarioAwardCriteriaForLevel(filesByPath, decoded, difficulty) {
    const baseRecord = filesByPath.get(`LEVELS/${difficulty}00.SAM`);
    if (!baseRecord) {
        return decoded.awardCriteria;
    }
    return {
        ...decodeThemeHospitalScenario(baseRecord.bytes).awardCriteria,
        ...decoded.awardCriteria
    };
}
function scenarioObjectAvailabilityForLevel(filesByPath, decoded, difficulty) {
    const baseRecord = filesByPath.get(`LEVELS/${difficulty}00.SAM`);
    if (!baseRecord) {
        return decoded.objectAvailability;
    }
    const byIndex = new Map();
    for (const entry of decodeThemeHospitalScenario(baseRecord.bytes).objectAvailability) {
        byIndex.set(entry.index, entry);
    }
    for (const entry of decoded.objectAvailability) {
        byIndex.set(entry.index, entry);
    }
    return [...byIndex.values()].sort((left, right) => left.index - right.index);
}
function scenarioTownSettingsForLevel(filesByPath, decoded, difficulty, levelNumber) {
    if (decoded.townSettings.length > 0) {
        return decoded.townSettings;
    }
    const baseRecord = filesByPath.get(`LEVELS/${difficulty}00.SAM`);
    if (!baseRecord) {
        return [];
    }
    return decodeThemeHospitalScenario(baseRecord.bytes).townSettings
        .filter((entry) => entry.index === 0 || entry.index === levelNumber);
}
function scenarioFinancialSettingsForLevel(townSettings, levelNumber) {
    return townSettings.find((entry) => entry.index === levelNumber) ?? townSettings.find((entry) => entry.index === 0) ?? null;
}
function scenarioRoomCostsForLevel(filesByPath, decoded, difficulty) {
    if (decoded.roomCosts.length > 0) {
        return decoded.roomCosts;
    }
    const baseRecord = filesByPath.get(`LEVELS/${difficulty}00.SAM`);
    if (!baseRecord) {
        return [];
    }
    return decodeThemeHospitalScenario(baseRecord.bytes).roomCosts;
}
function scenarioRoomCostOverrides(roomCosts, objectAvailability = []) {
    const overrides = {};
    for (const entry of roomCosts) {
        if (typeof entry.roomType === "string") {
            const current = overrides[entry.roomType];
            overrides[entry.roomType] = current === undefined ? entry.cost : Math.min(current, entry.cost);
        }
    }
    const equipmentCosts = scenarioObjectCostOverrides(objectAvailability);
    for (const [roomType, cost] of Object.entries(equipmentCosts)) {
        overrides[roomType] = (overrides[roomType] ?? 0) + cost;
    }
    return overrides;
}
function scenarioObjectCostOverrides(objectAvailability) {
    const overrides = {};
    for (const entry of objectAvailability) {
        if (entry.availableForLevel === false ||
            typeof entry.roomType !== "string" ||
            !Number.isInteger(entry.startCost) ||
            entry.startCost <= 0) {
            continue;
        }
        const current = overrides[entry.roomType];
        overrides[entry.roomType] = current === undefined ? entry.startCost : Math.min(current, entry.startCost);
    }
    return overrides;
}
function scenarioStaffSalariesForLevel(filesByPath, decoded, difficulty) {
    if (decoded.staffSalaries.length > 0) {
        return decoded.staffSalaries;
    }
    const baseRecord = filesByPath.get(`LEVELS/${difficulty}00.SAM`);
    if (!baseRecord) {
        return [];
    }
    return decodeThemeHospitalScenario(baseRecord.bytes).staffSalaries;
}
function scenarioStaffWageOverrides(staffSalaries) {
    const overrides = {};
    for (const entry of staffSalaries) {
        if (typeof entry.role === "string" && overrides[entry.role] === undefined) {
            overrides[entry.role] = Math.max(1, Math.round(entry.minimumSalary / 10));
        }
    }
    return overrides;
}
function parseScenarioCriterionLine(line) {
    const match = /^#(win|lose)_criteria\[(\d+)\]\.Criteria\.MaxMin\.Value\.Group\.Bound\s+(.+)$/u.exec(line.trim());
    if (!match) {
        return null;
    }
    const values = match[3]
        .trim()
        .split(/\s+/u)
        .slice(0, 5)
        .map((token) => Number(token));
    if (values.length < 5 || values.some((value) => !Number.isFinite(value))) {
        return null;
    }
    const [metricCode, maxMin, value, group, bound] = values;
    if (metricCode === 0) {
        return null;
    }
    return {
        kind: match[1],
        index: Number(match[2]),
        metricCode,
        metric: scenarioCriterionMetricName(metricCode),
        comparison: maxMin === 1 ? "at-least" : "at-most",
        value,
        group,
        bound
    };
}
function scenarioCriterionMetricName(metricCode) {
    switch (metricCode) {
        case 1:
            return "reputation";
        case 2:
            return "balance";
        case 3:
            return "percentage-treated";
        case 4:
            return "cures";
        case 5:
            return "deaths";
        case 6:
            return "hospital-value";
        default:
            return "unknown";
    }
}
function parseScenarioNetworkCriterionLine(line) {
    const match = /^#net_criteria\[(\d+)\]\.Criteria\.Value\.Month\.TimeToDo\s+(.+)$/u.exec(line.trim());
    if (!match) {
        return null;
    }
    const values = match[2]
        .trim()
        .split(/\s+/u)
        .slice(0, 4)
        .map((token) => Number(token));
    if (values.length < 4 || values.some((value) => !Number.isFinite(value))) {
        return null;
    }
    const [metricCode, value, month, timeToDo] = values;
    if (metricCode === 0) {
        return null;
    }
    return {
        index: Number(match[1]),
        metricCode,
        metric: scenarioNetworkCriterionMetricName(metricCode),
        value,
        month,
        timeToDo
    };
}
function scenarioNetworkCriterionMetricName(metricCode) {
    switch (metricCode) {
        case 1:
            return "survive-month";
        case 2:
            return "patients-cured";
        case 3:
            return "reputation";
        case 4:
            return "cures";
        case 5:
            return "balance";
        case 6:
            return "hospital-value";
        case 7:
            return "score";
        case 8:
            return "emergency";
        case 9:
            return "research";
        default:
            return "unknown";
    }
}
function parseScenarioPopulationLine(line) {
    const match = /^#popn\[(\d+)\]\.Month\.Change\s+(-?\d+)\s+(-?\d+)/u.exec(line.trim());
    if (!match) {
        return null;
    }
    return {
        index: Number(match[1]),
        month: Number(match[2]),
        change: Number(match[3])
    };
}
function parseScenarioAdmissionRuleLine(line) {
    const match = /^#gbv\.(HoldVisualMonths|HoldVisualPeepCount)\s+(-?\d+)/u.exec(line.trim());
    if (!match) {
        return null;
    }
    const key = match[1] === "HoldVisualMonths" ? "holdVisualMonths" : "holdVisualPeepCount";
    return {
        key,
        value: Math.max(0, Number(match[2]))
    };
}
function parseScenarioResearchSettingLine(line) {
    const match = /^#gbv\.(StartRating|ResearchPointsDivisor|StartCost|MinDrugCost|DrugImproveRate|MaxObjectStrength|ResearchIncrement|RschImproveCostPercent|RschImproveIncrementPercent)\s+(-?\d+)/u.exec(line.trim());
    if (!match) {
        return null;
    }
    const keys = {
        StartRating: "startRating",
        ResearchPointsDivisor: "researchPointsDivisor",
        StartCost: "startCost",
        MinDrugCost: "minDrugCost",
        DrugImproveRate: "drugImproveRate",
        MaxObjectStrength: "maxObjectStrength",
        ResearchIncrement: "researchIncrement",
        RschImproveCostPercent: "researchImproveCostPercent",
        RschImproveIncrementPercent: "researchImproveIncrementPercent"
    };
    const positiveKeys = new Set(["ResearchPointsDivisor", "DrugImproveRate", "MaxObjectStrength", "ResearchIncrement", "RschImproveCostPercent", "RschImproveIncrementPercent"]);
    return {
        key: keys[match[1]],
        value: Math.max(positiveKeys.has(match[1]) ? 1 : 0, Number(match[2]))
    };
}
function parseScenarioEpidemicSettingLine(line) {
    const match = /^#gbv\.(HowContagious|ContagiousSpreadFactor|ReduceContMonths|ReduceContPeepCount|ReduceContRate|EpidemicFine|EpidemicCompLo|EpidemicCompHi)\s+(-?\d+)/u.exec(line.trim());
    if (!match) {
        return null;
    }
    const keys = {
        HowContagious: "howContagious",
        ContagiousSpreadFactor: "contagiousSpreadFactor",
        ReduceContMonths: "reduceContagiousMonths",
        ReduceContPeepCount: "reduceContagiousPeepCount",
        ReduceContRate: "reduceContagiousRate",
        EpidemicFine: "fine",
        EpidemicCompLo: "compensationLow",
        EpidemicCompHi: "compensationHigh"
    };
    return {
        key: keys[match[1]],
        value: Math.max(match[1] === "HowContagious" ? 1 : 0, Number(match[2]))
    };
}
function parseScenarioLandSettingLine(line) {
    const match = /^#gbv\.LandCostPerTile\s+(-?\d+)/u.exec(line.trim());
    if (!match) {
        return null;
    }
    return {
        key: "landCostPerTile",
        value: Math.max(0, Number(match[1]))
    };
}
function parseScenarioStaffFatigueSettingLine(line) {
    const match = /^#gbv\.(RestStanding|RestSofa|RestGame|RestSnooker|WorkLight|ModifyFreq|NotTired|Tired|VeryTired|CrackUpTired|RecoveryFactor|RecoveryMinimum|ResignMax)\s+(-?\d+)/u.exec(line.trim());
    if (!match) {
        return null;
    }
    const keys = {
        RestStanding: "restStanding",
        RestSofa: "restSofa",
        RestGame: "restGame",
        RestSnooker: "restSnooker",
        WorkLight: "workLight",
        ModifyFreq: "modifyFrequency",
        NotTired: "notTired",
        Tired: "tired",
        VeryTired: "veryTired",
        CrackUpTired: "crackUpTired",
        RecoveryFactor: "recoveryFactor",
        RecoveryMinimum: "recoveryMinimum",
        ResignMax: "resignMax"
    };
    return {
        key: keys[match[1]],
        value: Math.max(0, Number(match[2]))
    };
}
function parseScenarioPatientBehaviorSettingLine(line) {
    const match = /^#gbv\.(LitterDrop|LeaveMax|Happy|Unhappy|VeryUnhappy|DrinkHappy|ToiletHappy|BowelFull|BowelOverflows|VomitLimit|LitterRandom)\s+(-?\d+)/u.exec(line.trim());
    if (!match) {
        return null;
    }
    const keys = {
        LitterDrop: "litterDrop",
        LeaveMax: "leaveMax",
        Happy: "happy",
        Unhappy: "unhappy",
        VeryUnhappy: "veryUnhappy",
        DrinkHappy: "drinkHappy",
        ToiletHappy: "toiletHappy",
        BowelFull: "bowelFull",
        BowelOverflows: "bowelOverflows",
        VomitLimit: "vomitLimit",
        LitterRandom: "litterRandom"
    };
    return {
        key: keys[match[1]],
        value: Math.max(0, Number(match[2]))
    };
}
function parseScenarioSalarySettingLine(line) {
    const salaryAddMatch = /^#gbv\.SalaryAdd\[(\d+)\]\s+(-?\d+)(?:\s+(.+))?/u.exec(line.trim());
    if (salaryAddMatch) {
        return {
            key: "salaryAdd",
            index: Number(salaryAddMatch[1]),
            value: Number(salaryAddMatch[2]),
            name: (salaryAddMatch[3] ?? "").trim()
        };
    }
    const scalarMatch = /^#gbv\.(SalaryAbilityDivisor|SalaryTooLow|SalaryTooHigh)\s+(-?\d+)/u.exec(line.trim());
    if (!scalarMatch) {
        return null;
    }
    const keys = {
        SalaryAbilityDivisor: "salaryAbilityDivisor",
        SalaryTooLow: "salaryTooLow",
        SalaryTooHigh: "salaryTooHigh"
    };
    return {
        key: keys[scalarMatch[1]],
        value: scalarMatch[1] === "SalaryAbilityDivisor" ? Math.max(1, Number(scalarMatch[2])) : Number(scalarMatch[2])
    };
}
function parseScenarioAllocationSettingLine(line) {
    const match = /^#gbv\.(AllocRand|AllocTotalRep|AllocIndRep|AllocDelay)\s+(-?\d+)/u.exec(line.trim());
    if (!match) {
        return null;
    }
    const keys = {
        AllocRand: "randomWeight",
        AllocTotalRep: "totalReputationWeight",
        AllocIndRep: "illnessReputationWeight",
        AllocDelay: "delayMonths"
    };
    return {
        key: keys[match[1]],
        value: Math.max(0, Number(match[2]))
    };
}
function parseScenarioRoutingSettingLine(line) {
    const match = /^#gbv\.(QPoints|DistPoints|NoStaffPoints)\s+(-?\d+)/u.exec(line.trim());
    if (!match) {
        return null;
    }
    const keys = {
        QPoints: "queuePoints",
        DistPoints: "distancePoints",
        NoStaffPoints: "noStaffPoints"
    };
    return {
        key: keys[match[1]],
        value: Math.max(0, Number(match[2]))
    };
}
function parseScenarioEventSettingLine(line) {
    const match = /^#gbv\.(ScoreMaxInc|VacCost|RemoveRatHoleChance|MinimumAbductTime|AbductionsPerYear|AutopsyRschPercent|AutopsyRepHitPercent|MayorLaunch|DisasterLaunch)\s+(-?\d+)/u.exec(line.trim());
    if (!match) {
        return null;
    }
    const keys = {
        ScoreMaxInc: "scoreMaxIncrease",
        VacCost: "vaccinationCost",
        RemoveRatHoleChance: "removeRatHoleChance",
        MinimumAbductTime: "minimumAbductionYears",
        AbductionsPerYear: "abductionsPerYear",
        AutopsyRschPercent: "autopsyResearchPercent",
        AutopsyRepHitPercent: "autopsyReputationHitPercent",
        MayorLaunch: "mayorLaunch",
        DisasterLaunch: "disasterLaunch"
    };
    return {
        key: keys[match[1]],
        value: Math.max(0, Number(match[2]))
    };
}
function parseScenarioTrainingSettingLine(line) {
    const rateMatch = /^#gbv\.TrainingRate\s+(-?\d+)/u.exec(line.trim());
    if (rateMatch) {
        return {
            key: "trainingRate",
            value: Math.max(1, Number(rateMatch[1]))
        };
    }
    const scalarMatch = /^#gbv\.(PromoDoc|PromoCon|DoctorThreshold|ConsultantThreshold)\s+(-?\d+)/u.exec(line.trim());
    if (scalarMatch) {
        const keys = {
            PromoDoc: "promotionDoctorMonths",
            PromoCon: "promotionConsultantMonths",
            DoctorThreshold: "doctorThreshold",
            ConsultantThreshold: "consultantThreshold"
        };
        return {
            key: keys[scalarMatch[1]],
            value: Math.max(1, Number(scalarMatch[2]))
        };
    }
    const abilityMatch = /^#gbv\.AbilityThreshold\[(\d+)\]\s+(-?\d+)(?:\s+(.+))?/u.exec(line.trim());
    if (abilityMatch) {
        return {
            key: "abilityThreshold",
            index: Number(abilityMatch[1]),
            value: Math.max(0, Number(abilityMatch[2])),
            name: (abilityMatch[3] ?? "").trim()
        };
    }
    const valueMatch = /^#gbv\.TrainingValue\[(\d+)\]\s+(-?\d+)(?:\s+(.+))?/u.exec(line.trim());
    if (!valueMatch) {
        return null;
    }
    return {
        key: "trainingValue",
        index: Number(valueMatch[1]),
        value: Math.max(0, Number(valueMatch[2])),
        name: (valueMatch[3] ?? "").trim()
    };
}
function parseScenarioAwardCriterionLine(line) {
    const match = /^#awards_trophies\.([A-Za-z0-9_]+)\s+(-?\d+)/u.exec(line.trim());
    if (!match) {
        return null;
    }
    return {
        key: scenarioSettingKey(match[1]),
        value: Number(match[2])
    };
}
function parseScenarioEmergencyControlLine(line) {
    const match = /^#emergency_control\[(\d+)\]\.StartMonth\.EndMonth\.Min\.Max\.Illness\.PercWin\.Bonus\s+(-?\d+)\s+(-?\d+)\s+(-?\d+)\s+(-?\d+)\s+(-?\d+)\s+(-?\d+)\s+(-?\d+)/u.exec(line.trim());
    if (!match) {
        return null;
    }
    const values = match.slice(2, 9).map((value) => Number(value));
    if (values.every((value) => value === 0)) {
        return null;
    }
    const illnessCode = Number(match[6]);
    const mapped = SCENARIO_ILLNESS_CODE_MAP.get(illnessCode);
    return {
        index: Number(match[1]),
        startMonth: Math.max(0, Number(match[2])),
        endMonth: Math.max(0, Number(match[3])),
        minPatients: Math.max(0, Number(match[4])),
        maxPatients: Math.max(0, Number(match[5])),
        illnessCode,
        percentToWin: Math.max(0, Number(match[7])),
        bonusCash: Math.max(0, Number(match[8])),
        ...(mapped ? { diseaseId: mapped.diseaseId, severity: mapped.severity } : {})
    };
}
function parseScenarioQuakeControlLine(line) {
    const match = /^#quake_control\[(\d+)\]\.StartMonth\.EndMonth\.Severity\s+(-?\d+)\s+(-?\d+)\s+(-?\d+)/u.exec(line.trim());
    if (!match) {
        return null;
    }
    const values = match.slice(2, 5).map((value) => Number(value));
    if (values.every((value) => value === 0)) {
        return null;
    }
    return {
        index: Number(match[1]),
        startMonth: Math.max(0, Number(match[2])),
        endMonth: Math.max(0, Number(match[3])),
        severity: Math.max(0, Number(match[4]))
    };
}
function parseScenarioExpertiseLine(line) {
    const match = /^#expertise\[(\d+)\]\.([^\s]+)\s+(.+)$/u.exec(line.trim());
    if (!match) {
        return null;
    }
    const fields = match[2].split(".");
    const startPriceFieldIndex = fields.indexOf("StartPrice");
    const contRateFieldIndex = fields.indexOf("ContRate");
    const knownFieldIndex = fields.indexOf("Known");
    const researchFieldIndex = knownFieldIndex + 1;
    if (knownFieldIndex < 0 || fields[researchFieldIndex] !== "RschReqd") {
        return null;
    }
    const tokens = match[3].trim().split(/\s+/u);
    if (tokens.length < fields.length + 1) {
        return null;
    }
    const values = tokens.slice(0, fields.length).map((token) => Number(token));
    if (values.some((value) => !Number.isFinite(value))) {
        return null;
    }
    const token = tokens[fields.length];
    const mapped = SCENARIO_DISEASE_MAP.get(`I_${token}`) ?? null;
    return {
        index: Number(match[1]),
        ...(startPriceFieldIndex >= 0 ? { startPrice: Math.max(0, values[startPriceFieldIndex]) } : {}),
        ...(contRateFieldIndex >= 0 ? { contagiousRate: Math.max(0, values[contRateFieldIndex]) } : {}),
        known: values[knownFieldIndex] === 1,
        researchRequired: Math.max(0, values[researchFieldIndex]),
        ...(fields.includes("MaxDiagDiff") ? { maxDiagDifficulty: Math.max(0, values[fields.indexOf("MaxDiagDiff")]) } : {}),
        token,
        ...(tokens.length > fields.length + 1 ? { category: tokens.slice(fields.length + 1).join(" ") } : {}),
        ...(mapped ? { diseaseId: mapped.diseaseId, severity: mapped.severity } : {})
    };
}
function parseScenarioComputerLine(line) {
    const match = /^#computer\[(\d+)\]\.Skill\.StaffLevels\.Luck\.Speed\.Comfort\.GuessAt\.Playing\s+(-?\d+)\s+(-?\d+)\s+(-?\d+)\s+(-?\d+)\s+(-?\d+)\s+(-?\d+)\s+(-?\d+)\s+(.+)$/u.exec(line.trim());
    if (!match) {
        return null;
    }
    return {
        index: Number(match[1]),
        skill: Math.max(0, Number(match[2])),
        staffLevels: Math.max(0, Number(match[3])),
        luck: Math.max(0, Number(match[4])),
        speed: Math.max(0, Number(match[5])),
        comfort: Math.max(0, Number(match[6])),
        guessAt: Math.max(0, Number(match[7])),
        playing: Number(match[8]) === 1,
        name: match[9].trim()
    };
}
function scenarioSettingKey(name) {
    const normalized = name.replace(/_+([a-zA-Z0-9])/gu, (_match, character) => character.toUpperCase());
    return normalized.length > 0 ? normalized[0].toLowerCase() + normalized.slice(1) : normalized;
}
function parseScenarioStaffLevelLine(line) {
    const match = /^#staff_levels\[(\d+)\]\.Month\.Nurses\.Doctors\.Handymen\.Receptionists\.Seed\.ShrkRate\.SurgRate\.RschRate\.ConsRate\.JrRate\s+(-?\d+)\s+(-?\d+)\s+(-?\d+)\s+(-?\d+)\s+(-?\d+)\s+(-?\d+)\s+(-?\d+)\s+(-?\d+)\s+(-?\d+)\s+(-?\d+)\s+(-?\d+)/u.exec(line.trim());
    if (!match) {
        return null;
    }
    return {
        index: Number(match[1]),
        month: Number(match[2]),
        nurses: Math.max(0, Number(match[3])),
        doctors: Math.max(0, Number(match[4])),
        handymen: Math.max(0, Number(match[5])),
        receptionists: Math.max(0, Number(match[6])),
        seed: Number(match[7]),
        shrinkRate: Math.max(0, Number(match[8])),
        surgeonRate: Math.max(0, Number(match[9])),
        researcherRate: Math.max(0, Number(match[10])),
        consultantRate: Math.max(0, Number(match[11])),
        juniorRate: Math.max(0, Number(match[12]))
    };
}
function parseScenarioTownLine(line) {
    const match = /^#towns\[(\d+)\]\.([^\s]+)\s+(.+)$/u.exec(line.trim());
    if (!match) {
        return null;
    }
    const fields = match[2].split(".");
    if (fields[0] !== "StartCash" || fields[1] !== "IllRate") {
        return null;
    }
    const tokens = match[3].trim().split(/\s+/u);
    if (tokens.length < fields.length) {
        return null;
    }
    const values = tokens.slice(0, fields.length).map((token) => Number(token));
    if (values.some((value) => !Number.isFinite(value))) {
        return null;
    }
    return {
        index: Number(match[1]),
        startCash: Math.max(0, values[0]),
        illnessRate: Math.max(0, values[1]),
        ...(fields.includes("InterestRate") ? { interestRate: Math.max(0, values[fields.indexOf("InterestRate")]) } : {}),
        name: tokens.slice(fields.length).join(" ").trim()
    };
}
const SCENARIO_ROOM_TYPE_BY_ROOM_ID = new Map([
    [7, "diagnosis"],
    [8, "specialist"],
    [9, "treatment"],
    [10, "specialist"],
    [11, "pharmacy"],
    [12, "diagnosis"],
    [13, "diagnosis"],
    [14, "diagnosis"],
    [15, "diagnosis"],
    [16, "diagnosis"],
    [17, "specialist"],
    [18, "specialist"],
    [19, "hair-restoration"],
    [20, "specialist"],
    [21, "fracture-clinic"],
    [23, "dna-fixer"],
    [24, "fracture-clinic"],
    [27, "diagnosis"],
    [30, "specialist"]
]);
function parseScenarioRoomCostLine(line) {
    const match = /^#rooms\[(\d+)\]\.Cost\s+(-?\d+)\s+(.+)$/u.exec(line.trim());
    if (!match) {
        return null;
    }
    const roomId = Number(match[1]);
    return {
        index: roomId,
        cost: Math.max(0, Number(match[2])),
        ...(SCENARIO_ROOM_TYPE_BY_ROOM_ID.has(roomId) ? { roomType: SCENARIO_ROOM_TYPE_BY_ROOM_ID.get(roomId) } : {}),
        name: match[3].trim()
    };
}
const SCENARIO_STAFF_ROLE_BY_STAFF_ID = new Map([
    [0, "nurse"],
    [1, "diagnostician"],
    [2, "handyman"],
    [3, "receptionist"]
]);
function parseScenarioStaffSalaryLine(line) {
    const match = /^#staff\[(\d+)\]\.MinSalary\s+(-?\d+)\s+(.+)$/u.exec(line.trim());
    if (!match) {
        return null;
    }
    const staffId = Number(match[1]);
    return {
        index: staffId,
        minimumSalary: Math.max(0, Number(match[2])),
        ...(SCENARIO_STAFF_ROLE_BY_STAFF_ID.has(staffId) ? { role: SCENARIO_STAFF_ROLE_BY_STAFF_ID.get(staffId) } : {}),
        name: match[3].trim()
    };
}
const SCENARIO_OBJECT_ROOM_MAP = new Map([
    [9, "specialist"],
    [13, "diagnosis"],
    [14, "diagnosis"],
    [22, "diagnosis"],
    [23, "dna-fixer"],
    [24, "fracture-clinic"],
    [25, "hair-restoration"],
    [26, "specialist"],
    [27, "diagnosis"],
    [30, "specialist"],
    [39, "pharmacy"],
    [46, "specialist"],
    [47, "specialist"],
    [54, "specialist"]
]);
function parseScenarioObjectLine(line) {
    const match = /^#objects\[(\d+)\]\.([^\s]+)\s+(.+)$/u.exec(line.trim());
    if (!match) {
        return null;
    }
    const fields = match[2].split(".");
    const tokens = match[3].trim().split(/\s+/u);
    if (tokens.length < fields.length) {
        return null;
    }
    const values = tokens.slice(0, fields.length).map((token) => Number(token));
    if (values.some((value) => !Number.isFinite(value))) {
        return null;
    }
    const objectId = Number(match[1]);
    const roomType = SCENARIO_OBJECT_ROOM_MAP.get(objectId) ?? null;
    const nameTokens = tokens.slice(fields.length);
    if (nameTokens.length > 0 && Number(nameTokens[0]) === objectId) {
        nameTokens.shift();
    }
    return {
        index: objectId,
        startAvailable: values[fields.indexOf("StartAvail")] === 1,
        whenAvailable: values[fields.indexOf("WhenAvail")] ?? 0,
        availableForLevel: values[fields.indexOf("AvailableForLevel")] === 1,
        ...(fields.includes("StartCost") ? { startCost: values[fields.indexOf("StartCost")] } : {}),
        ...(fields.includes("StartStrength") ? { startStrength: values[fields.indexOf("StartStrength")] } : {}),
        ...(roomType ? { roomType } : {}),
        name: nameTokens.join(" ").trim()
    };
}
const SCENARIO_DISEASE_MAP = new Map([
    ["I_UNCOMMON_COLD", { diseaseId: "mild-cold", severity: 1 }],
    ["I_INVIS", { diseaseId: "itchy-feet", severity: 1 }],
    ["I_TRANSPARENCY", { diseaseId: "transparency", severity: 1 }],
    ["I_SWEATY_PALMS", { diseaseId: "sweaty-palms", severity: 1 }],
    ["I_DISCRETE_ITCHING", { diseaseId: "discrete-itching", severity: 1 }],
    ["I_CHRONIC_NOSEHAIR", { diseaseId: "chronic-nosehair", severity: 2 }],
    ["I_MULTIPLE_TV_PERSONALITIES", { diseaseId: "gastric-grumble", severity: 2 }],
    ["I_ELVIS", { diseaseId: "king-complex", severity: 2 }],
    ["I_SPARE_RIBS", { diseaseId: "spare-ribs", severity: 2 }],
    ["I_KIDNEY_BEANS", { diseaseId: "kidney-beans", severity: 2 }],
    ["I_BROKEN_BONES", { diseaseId: "fractured-bones", severity: 2 }],
    ["I_CORRUGATED_ANKLES", { diseaseId: "corrugated-ankles", severity: 2 }],
    ["I_BALDNESS", { diseaseId: "baldness", severity: 2 }],
    ["I_BROKEN_WIND", { diseaseId: "broken-wind", severity: 2 }],
    ["I_GOLF_STONES", { diseaseId: "golf-stones", severity: 2 }],
    ["I_INFECTIOUS_LAUGHTER", { diseaseId: "infectious-laughter", severity: 2 }],
    ["I_GASTRIC_EJECTIONS", { diseaseId: "gastric-ejections", severity: 2 }],
    ["I_BROKEN_HEART", { diseaseId: "broken-heart", severity: 2 }],
    ["I_3RD_DEGREE_SIDEBURNS", { diseaseId: "sideburns", severity: 2 }],
    ["I_FAKE_BLOOD", { diseaseId: "fake-blood", severity: 2 }],
    ["I_PREGNANT", { diseaseId: "pregnancy", severity: 2 }],
    ["I_SLEEPING_ILLNESS", { diseaseId: "sleepy-bones", severity: 2 }],
    ["I_SLACK_TONGUE", { diseaseId: "slack-tongue", severity: 2 }],
    ["I_THE_SQUITS", { diseaseId: "sleepy-bones", severity: 2 }],
    ["I_BLOATY_HEAD", { diseaseId: "cranial-pressure", severity: 3 }],
    ["I_HEAPED_PILES", { diseaseId: "acute-sneezes", severity: 3 }],
    ["I_RADIATION", { diseaseId: "radiation", severity: 3 }],
    ["I_UNEXPECTED_SWELLING", { diseaseId: "unexpected-swelling", severity: 3 }],
    ["I_HAIRYITUS", { diseaseId: "hairyitis", severity: 2 }],
    ["I_JELLYITUS", { diseaseId: "jellyitis", severity: 3 }],
    ["I_ALIEN", { diseaseId: "alien-dna", severity: 3 }],
    ["I_IRON_LUNGS", { diseaseId: "iron-lungs", severity: 3 }],
    ["I_RUPTURED_NODULES", { diseaseId: "ruptured-nodules", severity: 3 }],
    ["I_GUT_ROT", { diseaseId: "gut-rot", severity: 3 }]
]);
const SCENARIO_ILLNESS_CODE_MAP = new Map([
    [2, { diseaseId: "cranial-pressure", severity: 3 }],
    [3, { diseaseId: "hairyitis", severity: 2 }],
    [5, { diseaseId: "itchy-feet", severity: 1 }],
    [6, { diseaseId: "radiation", severity: 3 }],
    [4, { diseaseId: "king-complex", severity: 2 }],
    [7, { diseaseId: "slack-tongue", severity: 2 }],
    [8, { diseaseId: "alien-dna", severity: 3 }],
    [9, { diseaseId: "fractured-bones", severity: 2 }],
    [10, { diseaseId: "baldness", severity: 2 }],
    [11, { diseaseId: "discrete-itching", severity: 1 }],
    [12, { diseaseId: "jellyitis", severity: 3 }],
    [13, { diseaseId: "sleepy-bones", severity: 2 }],
    [14, { diseaseId: "pregnancy", severity: 2 }],
    [15, { diseaseId: "transparency", severity: 1 }],
    [16, { diseaseId: "mild-cold", severity: 1 }],
    [17, { diseaseId: "broken-wind", severity: 2 }],
    [18, { diseaseId: "spare-ribs", severity: 2 }],
    [19, { diseaseId: "kidney-beans", severity: 2 }],
    [20, { diseaseId: "broken-heart", severity: 2 }],
    [21, { diseaseId: "ruptured-nodules", severity: 3 }],
    [22, { diseaseId: "gastric-grumble", severity: 2 }],
    [23, { diseaseId: "infectious-laughter", severity: 2 }],
    [24, { diseaseId: "corrugated-ankles", severity: 2 }],
    [25, { diseaseId: "chronic-nosehair", severity: 2 }],
    [26, { diseaseId: "sideburns", severity: 2 }],
    [27, { diseaseId: "fake-blood", severity: 2 }],
    [28, { diseaseId: "gastric-ejections", severity: 2 }],
    [29, { diseaseId: "sleepy-bones", severity: 2 }],
    [30, { diseaseId: "iron-lungs", severity: 3 }],
    [31, { diseaseId: "sweaty-palms", severity: 1 }],
    [32, { diseaseId: "acute-sneezes", severity: 3 }],
    [33, { diseaseId: "gut-rot", severity: 3 }],
    [34, { diseaseId: "golf-stones", severity: 2 }],
    [35, { diseaseId: "unexpected-swelling", severity: 3 }]
]);
const THEME_HOSPITAL_LANGUAGE_DISEASE_INDEX_BY_ID = new Map([
    ["cranial-pressure", 101],
    ["hairyitis", 102],
    ["king-complex", 103],
    ["itchy-feet", 104],
    ["radiation", 105],
    ["slack-tongue", 106],
    ["alien-dna", 107],
    ["fractured-bones", 108],
    ["baldness", 109],
    ["discrete-itching", 110],
    ["jellyitis", 111],
    ["sleepy-bones", 112],
    ["pregnancy", 113],
    ["transparency", 114],
    ["mild-cold", 115],
    ["broken-wind", 116],
    ["spare-ribs", 117],
    ["kidney-beans", 118],
    ["broken-heart", 119],
    ["ruptured-nodules", 120],
    ["gastric-grumble", 121],
    ["infectious-laughter", 122],
    ["corrugated-ankles", 123],
    ["chronic-nosehair", 124],
    ["sideburns", 125],
    ["fake-blood", 126],
    ["gastric-ejections", 127],
    ["iron-lungs", 129],
    ["sweaty-palms", 130],
    ["acute-sneezes", 131],
    ["gut-rot", 132],
    ["golf-stones", 133],
    ["unexpected-swelling", 134]
]);
function parseScenarioDiseaseLine(line) {
    const match = /^#(visuals|non_visuals|visuals_available)\[(\d+)\]\s+(-?\d+)\s+([A-Z0-9_]+)/u.exec(line.trim());
    if (!match) {
        return null;
    }
    const mapped = SCENARIO_DISEASE_MAP.get(match[4]);
    if (!mapped) {
        return null;
    }
    const amount = Number(match[3]);
    if (match[1] !== "visuals_available" && amount <= 0) {
        return null;
    }
    return {
        source: match[1],
        index: Number(match[2]),
        ...(match[1] === "visuals_available" ? { availableMonth: Math.max(0, amount) } : { weight: amount }),
        token: match[4],
        diseaseId: mapped.diseaseId,
        severity: mapped.severity
    };
}
function cloneScenarioSummary(summary) {
    return {
        ...summary,
        winCriteria: summary.winCriteria.map((criterion) => ({ ...criterion })),
        loseCriteria: summary.loseCriteria.map((criterion) => ({ ...criterion })),
        networkCriteria: (summary.networkCriteria ?? []).map((criterion) => ({ ...criterion })),
        populationSchedule: (summary.populationSchedule ?? []).map((entry) => ({ ...entry })),
        diseasePool: (summary.diseasePool ?? []).map((entry) => ({ ...entry })),
        staffLevels: (summary.staffLevels ?? []).map((entry) => ({ ...entry })),
        townSettings: (summary.townSettings ?? []).map((entry) => ({ ...entry })),
        financialSettings: summary.financialSettings ? { ...summary.financialSettings } : null,
        roomCosts: (summary.roomCosts ?? []).map((entry) => ({ ...entry })),
        roomCostOverrides: { ...(summary.roomCostOverrides ?? {}) },
        staffSalaries: (summary.staffSalaries ?? []).map((entry) => ({ ...entry })),
        staffWageOverrides: { ...(summary.staffWageOverrides ?? {}) },
        objectAvailability: (summary.objectAvailability ?? []).map((entry) => ({ ...entry })),
        admissionRules: { ...(summary.admissionRules ?? {}) },
        researchSettings: { ...(summary.researchSettings ?? {}) },
        trainingSettings: {
            ...(summary.trainingSettings ?? {}),
            ...((summary.trainingSettings?.trainingValues) ? { trainingValues: summary.trainingSettings.trainingValues.map((entry) => ({ ...entry })) } : {}),
            ...((summary.trainingSettings?.abilityThresholds) ? { abilityThresholds: summary.trainingSettings.abilityThresholds.map((entry) => ({ ...entry })) } : {})
        },
        salarySettings: cloneSalarySettings(summary.salarySettings ?? {}),
        allocationSettings: { ...(summary.allocationSettings ?? {}) },
        routingSettings: { ...(summary.routingSettings ?? {}) },
        eventSettings: { ...(summary.eventSettings ?? {}) },
        awardCriteria: { ...(summary.awardCriteria ?? {}) },
        emergencySchedule: (summary.emergencySchedule ?? []).map((entry) => ({ ...entry })),
        quakeSchedule: (summary.quakeSchedule ?? []).map((entry) => ({ ...entry })),
        expertise: (summary.expertise ?? []).map((entry) => ({ ...entry })),
        scenarioOpponents: (summary.scenarioOpponents ?? []).map((entry) => ({ ...entry }))
    };
}
function cloneTrainingSettings(trainingSettings) {
    return {
        ...trainingSettings,
        ...(trainingSettings.trainingValues ? { trainingValues: trainingSettings.trainingValues.map((entry) => ({ ...entry })) } : {}),
        ...(trainingSettings.abilityThresholds ? { abilityThresholds: trainingSettings.abilityThresholds.map((entry) => ({ ...entry })) } : {})
    };
}
function cloneSalarySettings(salarySettings) {
    return {
        ...salarySettings,
        ...(salarySettings.salaryAdds ? { salaryAdds: salarySettings.salaryAdds.map((entry) => ({ ...entry })) } : {})
    };
}
function decodeThemeHospitalMapTile(data, recordOffset, parcelOffset, x, y, previousTiles) {
    const rawObjectFlags = data[recordOffset] ?? 0;
    const objectType = data[recordOffset + 1] ?? 0;
    const groundRaw = data[recordOffset + 2] ?? 0;
    const northWallRaw = data[recordOffset + 3] ?? 0;
    const westWallRaw = data[recordOffset + 4] ?? 0;
    const flagsRaw = data[recordOffset + 5] ?? 0;
    const parcelId = readUint16Le(data, parcelOffset);
    const flags = {
        passable: false,
        canTravelN: y !== 0,
        canTravelE: x !== THEME_HOSPITAL_MAP_WIDTH - 1,
        canTravelS: y !== THEME_HOSPITAL_MAP_HEIGHT - 1,
        canTravelW: x !== 0,
        hospital: false,
        buildable: false,
        buildableN: false,
        buildableE: false,
        buildableS: false,
        buildableW: false
    };
    let ground = mapBlock(groundRaw);
    let northWall = 0;
    let westWall = 0;
    if (northWallRaw === 0 || isDividerWall(northWallRaw)) {
        if (ground >= 71 && ground <= 73) {
            northWall = ground;
            ground = 69;
        }
    }
    else {
        northWall = mapBlock(northWallRaw);
        flags.canTravelN = false;
        if (y !== 0) {
            previousTiles[(y - 1) * THEME_HOSPITAL_MAP_WIDTH + x].flags.canTravelS = false;
        }
    }
    if (westWallRaw === 0 || isDividerWall(westWallRaw)) {
        westWall = 0;
    }
    else {
        westWall = mapBlock(westWallRaw);
        flags.canTravelW = false;
        if (x !== 0) {
            previousTiles[y * THEME_HOSPITAL_MAP_WIDTH + x - 1].flags.canTravelE = false;
        }
    }
    if ((flagsRaw & 1) === 0) {
        flags.passable = true;
        if ((data[recordOffset + 7] & 16) === 0) {
            flags.hospital = true;
            flags.buildable = (flagsRaw & 2) === 0;
            flags.buildableN = (flagsRaw & 4) === 0 || objectType === 0;
            flags.buildableE = (flagsRaw & 8) === 0 || objectType === 0;
            flags.buildableS = (flagsRaw & 16) === 0 || objectType === 0;
            flags.buildableW = (flagsRaw & 32) === 0 || objectType === 0;
        }
    }
    return {
        x,
        y,
        ground,
        northWall,
        westWall,
        parcelId,
        objectType,
        objectFlags: rawObjectFlags,
        flags
    };
}
function mapBlock(raw) {
    return THEME_HOSPITAL_MAP_BLOCK_LUT[raw] ?? 0;
}
function isDividerWall(raw) {
    return (raw >> 1) === 70;
}
function readPlayerTileList(data, offset, count, width) {
    const tiles = [];
    for (let i = 0; i < count; i += 1) {
        const index = readUint16Le(data, offset + i * 2);
        tiles.push({
            x: index % width,
            y: Math.floor(index / width)
        });
    }
    return tiles;
}
function readUint16Le(data, offset) {
    return (data[offset] ?? 0) | ((data[offset + 1] ?? 0) << 8);
}
function clampInteger(value, min, max) {
    if (!Number.isInteger(value)) {
        return min;
    }
    if (value < min) {
        return min;
    }
    if (value > max) {
        return max;
    }
    return value;
}
