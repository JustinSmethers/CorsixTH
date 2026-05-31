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
    state = {
        initialization: "waiting-for-user-gesture",
        muted: false,
        paused: false,
        volume: 1,
        queuedCueIds: []
    };
    constructor(options = {}) {
        this.createAudioContext = options.createAudioContext ?? defaultAudioContextFactory;
        this.triggerContract = options.triggerContract ?? AUDIO_TRIGGER_CONTRACT;
        this.cueLibrary = options.cueLibrary ?? AUDIO_CUE_LIBRARY;
    }
    status() {
        return {
            initialization: this.state.initialization,
            muted: this.state.muted,
            paused: this.state.paused,
            volume: this.state.volume,
            queuedCueCount: this.state.queuedCueIds.length,
            ...(this.state.lastError ? { lastError: this.state.lastError } : {})
        };
    }
    async initializeFromGesture() {
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
        if (this.state.muted) {
            return { played: false, cueId, reason: "muted" };
        }
        this.playCue(cueId);
        return { played: true, cueId, reason: "played" };
    }
    setMuted(muted) {
        this.state.muted = muted;
        this.syncMasterGain();
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
        this.masterGainNode.gain.value = this.state.muted ? 0 : this.state.volume;
    }
    flushQueuedCues() {
        if (this.state.muted || this.state.paused || this.state.initialization !== "running") {
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
        const cueGain = this.context.createGain();
        cueGain.gain.value = cue.gain;
        const oscillator = this.context.createOscillator();
        oscillator.type = cue.waveform;
        oscillator.frequency.value = cue.frequencyHz;
        oscillator.connect(cueGain);
        cueGain.connect(this.sfxGainNode);
        const startAt = this.context.currentTime;
        oscillator.start(startAt);
        oscillator.stop(startAt + cue.durationMs / 1000);
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
