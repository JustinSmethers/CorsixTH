import { createSaveEnvelope } from "@corsixth/persistence";
import { AppOrchestrator } from "./orchestrator";
export function createAppSaveEnvelope(orchestrator, options = {}) {
    const { mapView, ...envelopeOptions } = options;
    return createSaveEnvelope({
        ...orchestrator.createPersistenceSnapshot(),
        ...(mapView ? { mapView } : {})
    }, envelopeOptions);
}
export function restoreOrchestratorFromSaveEnvelope(envelope, options = {}) {
    return AppOrchestrator.fromPersistenceSnapshot(envelope.payload, options);
}
export async function saveOrchestratorToSlot(adapter, slot, orchestrator, options = {}) {
    const envelope = createAppSaveEnvelope(orchestrator, options);
    await adapter.saveSlot(slot, envelope);
    return envelope;
}
export async function loadOrchestratorFromSlot(adapter, slot, options = {}) {
    const { restoreOptions, ...loadOptions } = options;
    const loaded = await adapter.loadSlot(slot, loadOptions);
    return {
        ...loaded,
        orchestrator: restoreOrchestratorFromSaveEnvelope(loaded.envelope, restoreOptions)
    };
}
export async function importOrchestratorFromSave(adapter, slot, serialized, options = {}) {
    const { restoreOptions, ...importOptions } = options;
    const imported = await adapter.importSlot(slot, serialized, importOptions);
    return {
        ...imported,
        orchestrator: restoreOrchestratorFromSaveEnvelope(imported.envelope, restoreOptions)
    };
}
export function exportSaveSlot(adapter, slot) {
    return adapter.exportSlot(slot);
}
