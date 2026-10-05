import { decodePcmWave, decodeThemeHospitalSoundArchive } from "./theme-sound.js";
export { decodePcmWave, decodeThemeHospitalSoundArchive } from "./theme-sound.js";

export const NATIVE_CUE_FILENAMES = {
    "ui.pause": "SCLICK.WAV",
    "ui.resume": "SCLICK.WAV",
    "ui.step": "SELECTX.WAV",
    "patient.admit": "BELL.WAV",
    "patient.treat.success": "CASHREG.WAV",
    "patient.treat.empty": "WRONG2.WAV"
};
export const AUDIO_TRIGGER_CONTRACT = {
    "app.paused": "ui.pause",
    "app.resumed": "ui.resume",
    "app.step": "ui.step",
    "patient.admitted": "patient.admit",
    "patient.treated.success": "patient.treat.success",
    "patient.treated.empty": "patient.treat.empty"
};
export const AUDIO_CUE_LIBRARY = {
    "ui.pause": { waveform: "triangle", frequencyHz: 220, durationMs: 120, gain: 0.18 },
    "ui.resume": { waveform: "triangle", frequencyHz: 330, durationMs: 90, gain: 0.16 },
    "ui.step": { waveform: "square", frequencyHz: 440, durationMs: 70, gain: 0.14 },
    "patient.admit": { waveform: "sawtooth", frequencyHz: 280, durationMs: 100, gain: 0.2 },
    "patient.treat.success": { waveform: "sine", frequencyHz: 520, durationMs: 180, gain: 0.22 },
    "patient.treat.empty": { waveform: "square", frequencyHz: 180, durationMs: 110, gain: 0.12 }
};
class WebAudioMixer {
    createAudioContext;
    triggerContract;
    cueLibrary;
    context;
    masterGainNode;
    sfxGainNode;
    nativeSounds = new Map();
    nativeBuffers = new Map();
    activeSources = new Set();
    disposed = false;
    state = {
        initialization: "waiting-for-user-gesture",
        soundMuted: false,
        musicMuted: false,
        paused: false,
        volume: 1,
        queuedCueIds: []
    };
    constructor(options = {}) {
        this.createAudioContext = options.createAudioContext ?? defaultAudioContextFactory;
        this.triggerContract = options.triggerContract ?? AUDIO_TRIGGER_CONTRACT;
        this.cueLibrary = options.cueLibrary ?? AUDIO_CUE_LIBRARY;
        const soundBytes = options.assetBundle?.filesByPath?.get("SOUND/DATA/SOUND-0.DAT")?.bytes;
        if (soundBytes) {
            try {
                this.nativeSounds = decodeThemeHospitalSoundArchive(soundBytes);
            }
            catch (error) {
                this.state.nativeError = stringifyError(error);
            }
        }
    }
    status() {
        return {
            initialization: this.state.initialization,
            muted: this.state.soundMuted && this.state.musicMuted,
            soundMuted: this.state.soundMuted,
            musicMuted: this.state.musicMuted,
            paused: this.state.paused,
            volume: this.state.volume,
            queuedCueCount: this.state.queuedCueIds.length,
            nativeSampleCount: this.nativeSounds.size,
            ...(this.state.nativeError ? { nativeError: this.state.nativeError } : {}),
            ...(this.state.lastError ? { lastError: this.state.lastError } : {})
        };
    }
    async initializeFromGesture() {
        if (this.disposed) return false;
        if (this.state.initialization === "unsupported") {
            return false;
        }
        if (!this.ensureContext()) {
            return false;
        }
        try {
            await this.context?.resume();
            this.state.initialization = "running";
            delete this.state.lastError;
            this.syncMasterGain();
            if (this.state.paused) {
                await this.context?.suspend();
            }
            else {
                this.flushQueuedCues();
            }
            return true;
        }
        catch (error) {
            this.state.lastError = stringifyError(error);
            this.state.initialization = isAutoplayPolicyError(error) ? "blocked-autoplay" : "unsupported";
            return false;
        }
    }
    trigger(event) {
        const cueId = this.triggerContract[event];
        if (!cueId) {
            return { played: false, reason: "unknown-event" };
        }
        if (this.state.initialization === "blocked-autoplay") {
            return { played: false, cueId, reason: "blocked-autoplay" };
        }
        if (this.state.initialization === "unsupported") {
            return { played: false, cueId, reason: "unsupported" };
        }
        if (this.state.initialization !== "running") {
            this.state.queuedCueIds.push(cueId);
            return { played: false, cueId, reason: "awaiting-user-gesture" };
        }
        if (this.state.paused) {
            return { played: false, cueId, reason: "paused" };
        }
        if (this.state.soundMuted) {
            return { played: false, cueId, reason: "muted" };
        }
        this.playCue(cueId);
        return { played: true, cueId, reason: "played" };
    }
    setMuted(muted) {
        this.state.soundMuted = muted;
        this.state.musicMuted = muted;
        this.syncMasterGain();
    }
    setSoundMuted(muted) {
        this.state.soundMuted = muted;
        this.syncMasterGain();
    }
    setMusicMuted(muted) {
        this.state.musicMuted = muted;
    }
    setVolume(volume) {
        this.state.volume = clamp(volume, 0, 1);
        this.syncMasterGain();
    }
    async setPaused(paused) {
        if (this.state.paused === paused) {
            return;
        }
        this.state.paused = paused;
        if (!this.context || this.state.initialization !== "running") {
            return;
        }
        try {
            if (paused) {
                await this.context.suspend();
                return;
            }
            await this.context.resume();
            this.flushQueuedCues();
        }
        catch (error) {
            this.state.lastError = stringifyError(error);
            if (isAutoplayPolicyError(error)) {
                this.state.initialization = "blocked-autoplay";
            }
        }
    }
    ensureContext() {
        if (this.context) {
            return true;
        }
        try {
            this.context = this.createAudioContext();
            this.masterGainNode = this.context.createGain();
            this.sfxGainNode = this.context.createGain();
            this.sfxGainNode.connect(this.masterGainNode);
            this.masterGainNode.connect(this.context.destination);
            this.syncMasterGain();
            return true;
        }
        catch (error) {
            this.state.lastError = stringifyError(error);
            this.state.initialization = "unsupported";
            return false;
        }
    }
    syncMasterGain() {
        if (!this.masterGainNode) {
            return;
        }
        this.masterGainNode.gain.value = this.state.soundMuted ? 0 : this.state.volume;
    }
    flushQueuedCues() {
        if (this.state.soundMuted || this.state.paused || this.state.initialization !== "running") {
            return;
        }
        const queued = [...this.state.queuedCueIds];
        this.state.queuedCueIds = [];
        for (const cueId of queued) {
            this.playCue(cueId);
        }
    }
    playCue(cueId) {
        if (!this.context || !this.sfxGainNode) {
            return;
        }
        const cue = this.cueLibrary[cueId];
        if (!cue) return;
        const cueGain = this.context.createGain();
        cueGain.gain.value = cue.gain;
        const nativeBuffer = this.nativeBufferForCue(cueId);
        if (nativeBuffer) {
            const source = this.context.createBufferSource();
            source.buffer = nativeBuffer;
            source.connect(cueGain);
            cueGain.connect(this.sfxGainNode);
            this.activeSources.add(source);
            source.onended = () => {
                this.activeSources.delete(source);
                source.disconnect();
                cueGain.disconnect();
            };
            source.start(this.context.currentTime);
            return;
        }
        const oscillator = this.context.createOscillator();
        oscillator.type = cue.waveform;
        oscillator.frequency.value = cue.frequencyHz;
        oscillator.connect(cueGain);
        cueGain.connect(this.sfxGainNode);
        this.activeSources.add(oscillator);
        oscillator.onended = () => {
            this.activeSources.delete(oscillator);
            oscillator.disconnect?.();
            cueGain.disconnect?.();
        };
        const startAt = this.context.currentTime;
        oscillator.start(startAt);
        oscillator.stop(startAt + cue.durationMs / 1000);
    }
    nativeBufferForCue(cueId) {
        const filename = NATIVE_CUE_FILENAMES[cueId];
        if (!filename || !this.nativeSounds.has(filename)) return null;
        if (this.nativeBuffers.has(filename)) return this.nativeBuffers.get(filename);
        try {
            const pcm = decodePcmWave(this.nativeSounds.get(filename));
            const buffer = this.context.createBuffer(pcm.channels.length, pcm.frameCount, pcm.sampleRate);
            pcm.channels.forEach((samples, index) => buffer.getChannelData(index).set(samples));
            this.nativeBuffers.set(filename, buffer);
            return buffer;
        }
        catch (error) {
            this.state.nativeError = stringifyError(error);
            this.nativeBuffers.set(filename, null);
            return null;
        }
    }
    dispose() {
        this.disposed = true;
        this.state.initialization = "unsupported";
        this.state.queuedCueIds = [];
        for (const source of this.activeSources) {
            try { source.stop(); } catch { /* Already finished. */ }
            source.disconnect?.();
        }
        this.activeSources.clear();
        this.nativeBuffers.clear();
        this.nativeSounds.clear();
        void this.context?.close?.().catch(() => {});
    }
}
export function createWebAudioMixer(options) {
    return new WebAudioMixer(options);
}
function defaultAudioContextFactory() {
    const constructorFn = globalThis
        .AudioContext ??
        globalThis.webkitAudioContext;
    if (!constructorFn) {
        throw new Error("WebAudio AudioContext is unavailable");
    }
    return new constructorFn();
}
function clamp(value, min, max) {
    if (!Number.isFinite(value)) {
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
function stringifyError(error) {
    if (error instanceof Error) {
        return `${error.name}: ${error.message}`;
    }
    return String(error);
}
function isAutoplayPolicyError(error) {
    if (error instanceof DOMException && error.name === "NotAllowedError") {
        return true;
    }
    if (!(error instanceof Error)) {
        return false;
    }
    return error.name === "NotAllowedError" || /autoplay/i.test(error.message);
}
