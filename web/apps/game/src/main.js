import { createCrashTelemetryController, evaluateRolloutPromotion, mountAppShell, nextRolloutStage } from "@corsixth/app";
import {
    createAssetBundle,
    createIndexedDbAssetStore,
    decodeThemeHospitalAnimationSetFromBundle,
    decodeThemeHospitalPalette,
    decodeThemeHospitalMapFromBundle,
    decodeThemeHospitalSpriteSheetFromBundle,
    findFirstRenderableThemeHospitalAnimation,
    findFirstVisibleThemeHospitalSprite,
    renderThemeHospitalAnimationFrame,
    renderThemeHospitalSprite,
    REQUIRED_ASSET_DIRECTORIES,
    REQUIRED_ASSET_FILES
} from "@corsixth/assets";
import { buildThemeHospitalMapPreviewInput, renderSceneToFrame } from "@corsixth/renderer-webgl";
import { phase4SmokeScenarioCommands } from "@corsixth/testkit";
const ASSET_IMPORT_STORAGE_KEY = "corsixth.phase8.asset-import.v1";
const ROLLOUT_STAGE_STORAGE_KEY = "corsixth.phase10.rollout-stage.v1";
const ROLLOUT_TRAFFIC_PERCENT = {
    canary: 5,
    progressive: 50,
    full: 100
};
const appElement = document.querySelector("#app");
if (!appElement) {
    throw new Error("Missing #app element");
}
const assetStore = createIndexedDbAssetStore();
let rolloutStage = loadRolloutStage();
let phase10Dashboard = null;
const crashTelemetry = createCrashTelemetryController({
    environment: "staging",
    releaseStage: rolloutStage,
    onEvent: () => {
        phase10Dashboard?.render();
    }
});
crashTelemetry.bind(window);
phase10Dashboard = mountPhase10Dashboard(appElement, crashTelemetry, {
    getStage: () => rolloutStage,
    setStage: (stage) => {
        rolloutStage = stage;
        persistRolloutStage(stage);
        crashTelemetry.setReleaseStage(stage);
    }
});
phase10Dashboard.render();
void bootstrapFromStoredAssets();
async function bootstrapFromStoredAssets() {
    const storedBundle = await loadStoredAssetBundle();
    if (storedBundle) {
        persistManifest(storedBundle.manifest);
        mountPlayableShell(appElement, storedBundle);
        return;
    }
    clearStoredManifest();
    renderImportShell(appElement);
}
function mountPlayableShell(root, assetBundle) {
    const assetManifest = assetBundle?.manifest ?? null;
    const mounted = mountAppShell({
        root,
        seed: 1234,
        tickRateHz: 4,
        pointerTileSize: 16,
        scenarioCommands: phase4SmokeScenarioCommands(),
        assetBundle
    });
    const assetSummary = document.createElement("p");
    assetSummary.dataset.testid = "asset-runtime-summary";
    assetSummary.textContent = assetManifest
        ? `Asset files: ${assetManifest.importedFileCount}; Maps: ${assetManifest.mapSummaries?.length ?? 0}`
        : "Asset files: unavailable";
    const resetButton = document.createElement("button");
    resetButton.type = "button";
    resetButton.dataset.testid = "asset-import-reset";
    resetButton.textContent = "Re-import Assets";
    resetButton.style.marginBottom = "12px";
    resetButton.addEventListener("click", () => {
        mounted.dispose();
        void clearStoredAssets().finally(() => {
            renderImportShell(root);
        });
    });
    const diagnostics = document.createElement("section");
    diagnostics.dataset.testid = "asset-runtime-diagnostics";
    diagnostics.style.padding = "16px";
    diagnostics.style.background = "#f7f8f8";
    diagnostics.style.color = "#172126";
    diagnostics.style.fontFamily = "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif";
    diagnostics.append(resetButton, assetSummary);
    const mapPreview = createImportedMapPreview(assetBundle);
    if (mapPreview) {
        diagnostics.append(mapPreview);
    }
    const spritePreview = createImportedSpritePreview(assetBundle);
    if (spritePreview) {
        diagnostics.append(spritePreview);
    }
    const animationPreview = createImportedAnimationPreview(assetBundle);
    if (animationPreview) {
        diagnostics.append(animationPreview);
    }
    const qDataPreview = createImportedQDataSpritePreview(assetBundle);
    if (qDataPreview) {
        diagnostics.append(qDataPreview);
    }
    root.append(diagnostics);
}
function createImportedMapPreview(assetBundle) {
    const firstMap = assetBundle?.manifest.mapSummaries?.[0];
    if (!assetBundle || !firstMap) {
        return null;
    }
    const preview = document.createElement("section");
    preview.dataset.testid = "theme-map-preview";
    preview.style.marginBottom = "12px";
    const title = document.createElement("h2");
    title.textContent = "Imported Map Preview";
    const caption = document.createElement("p");
    caption.dataset.testid = "theme-map-preview-summary";
    caption.textContent = `${firstMap.path}: ${firstMap.width}x${firstMap.height}, parcels ${firstMap.parcelCount}, objects ${firstMap.objectCount}`;
    const canvas = document.createElement("canvas");
    canvas.dataset.testid = "theme-map-preview-canvas";
    canvas.width = 256;
    canvas.height = 256;
    canvas.style.width = "256px";
    canvas.style.height = "256px";
    canvas.style.imageRendering = "pixelated";
    canvas.style.border = "1px solid #444";
    canvas.style.display = "block";
    let blockCaption = null;
    let blockCanvas = null;
    try {
        const decoded = decodeThemeHospitalMapFromBundle(assetBundle, firstMap.path);
        if (!decoded) {
            return null;
        }
        const frame = renderSceneToFrame(buildThemeHospitalMapPreviewInput(decoded, {
            viewportWidth: canvas.width,
            viewportHeight: canvas.height,
            tileSize: 2
        }));
        const context = canvas.getContext("2d");
        if (!context) {
            return null;
        }
        context.putImageData(new ImageData(frame.pixels, frame.width, frame.height), 0, 0);
        blockCanvas = createImportedBlockMapCanvas(assetBundle, decoded);
        if (blockCanvas) {
            blockCaption = document.createElement("p");
            blockCaption.dataset.testid = "theme-block-map-preview-summary";
            blockCaption.textContent = "DATA/VBLK-0 tile preview rendered from original block sprites";
        }
    }
    catch (error) {
        caption.textContent = `Map preview unavailable: ${stringifyError(error)}`;
    }
    preview.append(title, caption, canvas);
    if (blockCaption && blockCanvas) {
        preview.append(blockCaption, blockCanvas);
    }
    return preview;
}
function createImportedBlockMapCanvas(assetBundle, decodedMap) {
    const paletteRecord = assetBundle.filesByPath.get("DATA/MPALETTE.DAT");
    if (!paletteRecord || !Array.isArray(decodedMap.tiles)) {
        return null;
    }
    const sheet = decodeThemeHospitalSpriteSheetFromBundle(assetBundle, "DATA/VBLK-0");
    if (!sheet) {
        return null;
    }
    const palette = decodeThemeHospitalPalette(paletteRecord.bytes);
    const canvas = document.createElement("canvas");
    canvas.dataset.testid = "theme-block-map-preview-canvas";
    canvas.width = 512;
    canvas.height = 320;
    canvas.style.width = "512px";
    canvas.style.maxWidth = "100%";
    canvas.style.height = "320px";
    canvas.style.imageRendering = "pixelated";
    canvas.style.border = "1px solid #444";
    canvas.style.display = "block";
    const pixels = new Uint8ClampedArray(canvas.width * canvas.height * 4);
    const originX = 256;
    const originY = 8;
    const tileColumns = Math.min(10, decodedMap.width);
    const tileRows = Math.min(10, decodedMap.height);
    for (let y = 0; y < tileRows; y += 1) {
        for (let x = 0; x < tileColumns; x += 1) {
            const tile = decodedMap.tiles[y * decodedMap.width + x];
            const sprite = sheet.sprites[tile.ground & 0xff];
            if (!sprite || sprite.width === 0 || sprite.height === 0) {
                continue;
            }
            const image = renderThemeHospitalSprite(sprite, palette);
            const screenX = Math.round(originX + (x - y) * 32);
            const screenY = Math.round(originY + (x + y) * 16 - image.height + 32);
            blitImage(pixels, canvas.width, canvas.height, image, screenX, screenY);
        }
    }
    const context = canvas.getContext("2d");
    if (!context) {
        return null;
    }
    context.putImageData(new ImageData(pixels, canvas.width, canvas.height), 0, 0);
    return canvas;
}
function createImportedSpritePreview(assetBundle) {
    if (!assetBundle) {
        return null;
    }
    const paletteRecord = assetBundle.filesByPath.get("DATA/MPALETTE.DAT");
    if (!paletteRecord) {
        return null;
    }
    const preview = document.createElement("section");
    preview.dataset.testid = "theme-sprite-preview";
    preview.style.marginBottom = "12px";
    const title = document.createElement("h2");
    title.textContent = "Imported Sprite Preview";
    const caption = document.createElement("p");
    caption.dataset.testid = "theme-sprite-preview-summary";
    const canvas = document.createElement("canvas");
    canvas.dataset.testid = "theme-sprite-preview-canvas";
    canvas.style.imageRendering = "pixelated";
    canvas.style.border = "1px solid #444";
    canvas.style.display = "block";
    try {
        const palette = decodeThemeHospitalPalette(paletteRecord.bytes);
        const sheet = decodeThemeHospitalSpriteSheetFromBundle(assetBundle, "DATA/VSPR-0");
        if (!sheet) {
            return null;
        }
        const sprite = findFirstVisibleThemeHospitalSprite(sheet, palette);
        if (!sprite) {
            return null;
        }
        const image = renderThemeHospitalSprite(sprite, palette);
        canvas.width = image.width;
        canvas.height = image.height;
        canvas.style.width = `${Math.max(64, image.width * 4)}px`;
        canvas.style.height = `${Math.max(32, image.height * 4)}px`;
        const context = canvas.getContext("2d");
        if (!context) {
            return null;
        }
        context.putImageData(new ImageData(image.pixels, image.width, image.height), 0, 0);
        caption.textContent = `DATA/VSPR-0: ${sheet.spriteCount} sprites; preview #${sprite.index} ${sprite.width}x${sprite.height}`;
    }
    catch (error) {
        caption.textContent = `Sprite preview unavailable: ${stringifyError(error)}`;
    }
    preview.append(title, caption, canvas);
    return preview;
}
function createImportedAnimationPreview(assetBundle) {
    if (!assetBundle) {
        return null;
    }
    const paletteRecord = assetBundle.filesByPath.get("DATA/MPALETTE.DAT");
    if (!paletteRecord) {
        return null;
    }
    const preview = document.createElement("section");
    preview.dataset.testid = "theme-animation-preview";
    preview.style.marginBottom = "12px";
    const title = document.createElement("h2");
    title.textContent = "Imported Animation Preview";
    const caption = document.createElement("p");
    caption.dataset.testid = "theme-animation-preview-summary";
    const canvas = document.createElement("canvas");
    canvas.dataset.testid = "theme-animation-preview-canvas";
    canvas.style.imageRendering = "pixelated";
    canvas.style.border = "1px solid #444";
    canvas.style.display = "block";
    try {
        const palette = decodeThemeHospitalPalette(paletteRecord.bytes);
        const sheet = decodeThemeHospitalSpriteSheetFromBundle(assetBundle, "DATA/VSPR-0");
        const animations = decodeThemeHospitalAnimationSetFromBundle(assetBundle);
        if (!sheet || !animations) {
            return null;
        }
        const animationIndex = findFirstRenderableThemeHospitalAnimation(animations, sheet, palette);
        if (animationIndex === null) {
            return null;
        }
        const image = renderThemeHospitalAnimationFrame(animations, sheet, palette, animationIndex);
        canvas.width = image.width;
        canvas.height = image.height;
        canvas.style.width = `${Math.max(64, image.width * 4)}px`;
        canvas.style.height = `${Math.max(32, image.height * 4)}px`;
        const context = canvas.getContext("2d");
        if (!context) {
            return null;
        }
        context.putImageData(new ImageData(image.pixels, image.width, image.height), 0, 0);
        caption.textContent = `DATA/V*.ANI: ${animations.animationCount} animations; preview #${animationIndex}, frame ${image.frameIndex}, elements ${image.elements.length}`;
    }
    catch (error) {
        caption.textContent = `Animation preview unavailable: ${stringifyError(error)}`;
    }
    preview.append(title, caption, canvas);
    return preview;
}
function createImportedQDataSpritePreview(assetBundle) {
    if (!assetBundle) {
        return null;
    }
    const summary = assetBundle.manifest.qDataSpriteSheets?.find((entry) => entry.visibleSpriteCount > 0);
    const paletteRecord = assetBundle.filesByPath.get("DATA/MPALETTE.DAT");
    if (!summary || !paletteRecord) {
        return null;
    }
    const preview = document.createElement("section");
    preview.dataset.testid = "theme-qdata-preview";
    preview.style.marginBottom = "12px";
    const title = document.createElement("h2");
    title.textContent = "Imported UI Sprite Preview";
    const caption = document.createElement("p");
    caption.dataset.testid = "theme-qdata-preview-summary";
    const canvas = document.createElement("canvas");
    canvas.dataset.testid = "theme-qdata-preview-canvas";
    canvas.style.imageRendering = "pixelated";
    canvas.style.border = "1px solid #444";
    canvas.style.display = "block";
    try {
        const palette = decodeThemeHospitalPalette(paletteRecord.bytes);
        const sheet = decodeThemeHospitalSpriteSheetFromBundle(assetBundle, summary.path);
        if (!sheet) {
            return null;
        }
        const sprite = findFirstVisibleThemeHospitalSprite(sheet, palette);
        if (!sprite) {
            return null;
        }
        const image = renderThemeHospitalSprite(sprite, palette);
        canvas.width = image.width;
        canvas.height = image.height;
        canvas.style.width = `${Math.max(64, image.width * 4)}px`;
        canvas.style.height = `${Math.max(32, image.height * 4)}px`;
        const context = canvas.getContext("2d");
        if (!context) {
            return null;
        }
        context.putImageData(new ImageData(image.pixels, image.width, image.height), 0, 0);
        caption.textContent = `${summary.path}: ${sheet.spriteCount} UI sprites; preview #${sprite.index} ${sprite.width}x${sprite.height}`;
    }
    catch (error) {
        caption.textContent = `UI sprite preview unavailable: ${stringifyError(error)}`;
    }
    preview.append(title, caption, canvas);
    return preview;
}
function blitImage(targetPixels, targetWidth, targetHeight, image, targetX, targetY) {
    for (let sourceY = 0; sourceY < image.height; sourceY += 1) {
        const y = targetY + sourceY;
        if (y < 0 || y >= targetHeight) {
            continue;
        }
        for (let sourceX = 0; sourceX < image.width; sourceX += 1) {
            const x = targetX + sourceX;
            if (x < 0 || x >= targetWidth) {
                continue;
            }
            const sourceOffset = (sourceY * image.width + sourceX) * 4;
            const alpha = image.pixels[sourceOffset + 3];
            if (alpha === 0) {
                continue;
            }
            const targetOffset = (y * targetWidth + x) * 4;
            targetPixels[targetOffset] = image.pixels[sourceOffset];
            targetPixels[targetOffset + 1] = image.pixels[sourceOffset + 1];
            targetPixels[targetOffset + 2] = image.pixels[sourceOffset + 2];
            targetPixels[targetOffset + 3] = alpha;
        }
    }
}
function renderImportShell(root) {
    root.innerHTML = `
    <section data-testid="phase8-import-shell" style="max-width: 720px;">
      <h1>Phase 8 Asset Import</h1>
      <p data-testid="asset-import-description">
        Import your legally-owned original game data folder to unlock playable web runtime content.
      </p>
      <h2>Required folders</h2>
      <ul data-testid="asset-import-required-directories">
        ${REQUIRED_ASSET_DIRECTORIES.map((directory) => `<li>${directory}</li>`).join("")}
      </ul>
      <h2>Required root files</h2>
      <ul data-testid="asset-import-required-files">
        ${REQUIRED_ASSET_FILES.map((fileName) => `<li>${fileName}</li>`).join("")}
      </ul>
      <label>
        Select game-data folder:
        <input type="file" webkitdirectory multiple data-testid="asset-import-picker" />
      </label>
      <div style="margin-top: 12px;">
        <button type="button" data-testid="asset-import-confirm" disabled>Import and Start</button>
      </div>
      <p data-testid="asset-import-status" style="margin-top: 12px;">Waiting for folder selection.</p>
      <ul data-testid="asset-import-diagnostics"></ul>
    </section>
  `;
    const picker = requiredElement(root, "[data-testid='asset-import-picker']");
    const confirmButton = requiredElement(root, "[data-testid='asset-import-confirm']");
    const status = requiredElement(root, "[data-testid='asset-import-status']");
    const diagnosticsList = requiredElement(root, "[data-testid='asset-import-diagnostics']");
    let manifestReadyForImport = null;
    let bundleReadyForImport = null;
    let validationSequence = 0;
    const renderDiagnostics = (diagnostics) => {
        diagnosticsList.innerHTML = diagnostics
            .map((diagnostic) => {
            const details = diagnostic.hint ? ` Hint: ${diagnostic.hint}` : "";
            return `<li>[${diagnostic.severity}] ${diagnostic.message}${details}</li>`;
        })
            .join("");
    };
    const validateSelection = async () => {
        manifestReadyForImport = null;
        bundleReadyForImport = null;
        confirmButton.disabled = true;
        const files = picker.files;
        if (!files || files.length === 0) {
            status.textContent = "Waiting for folder selection.";
            diagnosticsList.innerHTML = "";
            return;
        }
        validationSequence += 1;
        const currentValidation = validationSequence;
        status.textContent = "Validating selected assets...";
        const decodeInput = await filesToAssetInputs(files);
        const result = createAssetBundle(decodeInput);
        if (currentValidation !== validationSequence) {
            return;
        }
        renderDiagnostics(result.diagnostics);
        if (result.status === "ready" && result.manifest && result.bundle) {
            manifestReadyForImport = result.manifest;
            bundleReadyForImport = result.bundle;
            confirmButton.disabled = false;
            status.textContent = "Ready to import. Diagnostics are clear.";
            return;
        }
        status.textContent = "Import blocked. Fix diagnostics and select the game-data folder again.";
    };
    picker.addEventListener("change", () => {
        void validateSelection();
    });
    confirmButton.addEventListener("click", () => {
        if (!manifestReadyForImport || !bundleReadyForImport) {
            return;
        }
        status.textContent = "Importing transformed asset metadata...";
        confirmButton.disabled = true;
        void assetStore
            .saveBundle(bundleReadyForImport)
            .then(() => {
            persistManifest(manifestReadyForImport);
            status.textContent = "Import complete. Launching playable shell...";
            mountPlayableShell(root, bundleReadyForImport);
        })
            .catch((error) => {
            status.textContent = `Import failed while storing assets: ${stringifyError(error)}`;
            confirmButton.disabled = false;
        });
    });
}
function mountPhase10Dashboard(appRoot, telemetry, rolloutControl) {
    const dashboard = document.createElement("section");
    dashboard.dataset.testid = "phase10-release-dashboard";
    dashboard.style.marginBottom = "12px";
    dashboard.style.padding = "12px";
    dashboard.style.border = "1px solid #444";
    dashboard.style.borderRadius = "6px";
    dashboard.innerHTML = `
    <h2 style="margin-top: 0;">Phase 10 Release Safeguards</h2>
    <p data-testid="phase10-rollout-stage"></p>
    <p data-testid="phase10-rollout-traffic"></p>
    <p data-testid="phase10-health-decision"></p>
    <p data-testid="phase10-error-count"></p>
    <p data-testid="phase10-critical-count"></p>
    <p data-testid="phase10-alert-routes"></p>
    <div>
      <button type="button" data-testid="phase10-promote-stage">Promote Stage</button>
      <button type="button" data-testid="phase10-simulate-crash">Simulate Crash</button>
    </div>
  `;
    appRoot.before(dashboard);
    const elements = {
        stageMetric: requiredElement(dashboard, "[data-testid='phase10-rollout-stage']"),
        trafficMetric: requiredElement(dashboard, "[data-testid='phase10-rollout-traffic']"),
        healthMetric: requiredElement(dashboard, "[data-testid='phase10-health-decision']"),
        errorsMetric: requiredElement(dashboard, "[data-testid='phase10-error-count']"),
        criticalMetric: requiredElement(dashboard, "[data-testid='phase10-critical-count']"),
        routesMetric: requiredElement(dashboard, "[data-testid='phase10-alert-routes']"),
        promoteButton: requiredElement(dashboard, "[data-testid='phase10-promote-stage']"),
        simulateCrashButton: requiredElement(dashboard, "[data-testid='phase10-simulate-crash']")
    };
    const render = () => {
        const stage = rolloutControl.getStage();
        const snapshot = telemetry.snapshot();
        const lastRoutes = snapshot.lastAlertRoutes.length > 0 ? snapshot.lastAlertRoutes.join(", ") : "none";
        const healthDecision = evaluateRolloutPromotion(stage, {
            crashFreeSessionsPercent: Math.max(90, 100 - snapshot.totalCritical * 0.2 - snapshot.totalWarnings * 0.05),
            errorRatePercent: snapshot.totalEvents * 0.01,
            p95FrameTimeMs: 14 + snapshot.totalWarnings * 0.2 + snapshot.totalCritical * 0.4
        });
        const nextStage = nextRolloutStage(stage);
        elements.stageMetric.textContent = `Rollout stage: ${stage}`;
        elements.trafficMetric.textContent = `Traffic allocation: ${ROLLOUT_TRAFFIC_PERCENT[stage]}%`;
        elements.healthMetric.textContent = healthDecision.promote
            ? `Promotion health: eligible${nextStage ? ` for ${nextStage}` : " (already at full rollout)"}`
            : `Promotion health: blocked by ${healthDecision.blockingSignals.join(", ")}`;
        elements.errorsMetric.textContent = `Errors: ${snapshot.totalEvents}`;
        elements.criticalMetric.textContent = `Critical: ${snapshot.totalCritical}`;
        elements.routesMetric.textContent = `Last alert routes: ${lastRoutes}`;
        elements.promoteButton.disabled = nextStage === null;
    };
    elements.promoteButton.addEventListener("click", () => {
        const stage = rolloutControl.getStage();
        const nextStage = nextRolloutStage(stage);
        if (!nextStage) {
            return;
        }
        rolloutControl.setStage(nextStage);
        render();
    });
    elements.simulateCrashButton.addEventListener("click", () => {
        telemetry.captureManualEvent({
            source: "ui",
            message: "Simulated release drill crash",
            stack: "phase10.synthetic.stack"
        });
        render();
    });
    return { render };
}
async function filesToAssetInputs(files) {
    const buffers = await Promise.all(Array.from(files).map(async (file) => ({
        path: file.webkitRelativePath.length > 0 ? file.webkitRelativePath : file.name,
        bytes: new Uint8Array(await file.arrayBuffer())
    })));
    return buffers;
}
function loadStoredManifest() {
    const rawEnvelope = window.localStorage.getItem(ASSET_IMPORT_STORAGE_KEY);
    if (!rawEnvelope) {
        return null;
    }
    let parsed;
    try {
        parsed = JSON.parse(rawEnvelope);
    }
    catch {
        return null;
    }
    if (!isStoredEnvelope(parsed)) {
        return null;
    }
    if (!isValidManifest(parsed.manifest)) {
        return null;
    }
    return parsed.manifest;
}
function persistManifest(manifest) {
    const envelope = {
        schemaVersion: 1,
        manifest
    };
    window.localStorage.setItem(ASSET_IMPORT_STORAGE_KEY, JSON.stringify(envelope));
}
function clearStoredManifest() {
    window.localStorage.removeItem(ASSET_IMPORT_STORAGE_KEY);
}
async function loadStoredAssetBundle() {
    try {
        return await assetStore.loadBundle();
    }
    catch {
        return null;
    }
}
async function clearStoredAssets() {
    clearStoredManifest();
    try {
        await assetStore.deleteBundle();
    }
    catch {
        // localStorage is already clear; a failed IndexedDB cleanup should not block re-import.
    }
}
function loadRolloutStage() {
    const value = window.localStorage.getItem(ROLLOUT_STAGE_STORAGE_KEY);
    if (value === "canary" || value === "progressive" || value === "full") {
        return value;
    }
    return "canary";
}
function persistRolloutStage(stage) {
    window.localStorage.setItem(ROLLOUT_STAGE_STORAGE_KEY, stage);
}
function isStoredEnvelope(value) {
    if (!value || typeof value !== "object") {
        return false;
    }
    const envelope = value;
    return envelope.schemaVersion === 1 && envelope.manifest !== undefined;
}
function isValidManifest(value) {
    if (!value || typeof value !== "object") {
        return false;
    }
    const manifest = value;
    return manifest.schemaVersion === 1 && manifest.contract === "phase8.asset-import.v1";
}
function requiredElement(root, selector) {
    const element = root.querySelector(selector);
    if (!element) {
        throw new Error(`Missing required element: ${selector}`);
    }
    return element;
}
function stringifyError(error) {
    if (error instanceof Error) {
        return error.message;
    }
    return String(error);
}
