import { createWebAudioMixer } from "../src/index";
class FakeGainNode {
    gain = { value: 1 };
    connections = [];
    connect(destination) {
        this.connections.push(destination);
        return destination;
    }
}
class FakeOscillatorNode {
    type = "sine";
    frequency = { value: 0 };
    detune = { value: 0 };
    connections = [];
    startedAt = [];
    stoppedAt = [];
    connect(destination) {
        this.connections.push(destination);
        return destination;
    }
    start(when) {
        this.startedAt.push(when ?? 0);
    }
    stop(when) {
        this.stoppedAt.push(when ?? 0);
    }
}
class FakeAudioContext {
    state = "suspended";
    currentTime = 3;
    destination = new FakeGainNode();
    gainNodes = [];
    oscillators = [];
    resumeCalls = 0;
    suspendCalls = 0;
    resumeFailure = null;
    createGain() {
        const node = new FakeGainNode();
        this.gainNodes.push(node);
        return node;
    }
    createOscillator() {
        const node = new FakeOscillatorNode();
        this.oscillators.push(node);
        return node;
    }
    async resume() {
        this.resumeCalls += 1;
        if (this.resumeFailure) {
            throw this.resumeFailure;
        }
        this.state = "running";
    }
    async suspend() {
        this.suspendCalls += 1;
        this.state = "suspended";
    }
}
describe("audio playback controls", () => {
    it("applies deterministic mute and volume semantics", async () => {
        const context = new FakeAudioContext();
        const mixer = createWebAudioMixer({
            createAudioContext: () => context
        });
        await mixer.initializeFromGesture();
        mixer.setVolume(0.4);
        expect(mixer.status().volume).toBe(0.4);
        mixer.setMuted(true);
        expect(mixer.status().muted).toBe(true);
        expect(mixer.trigger("patient.admitted")).toEqual({
            played: false,
            cueId: "patient.admit",
            reason: "muted"
        });
        expect(context.oscillators).toHaveLength(0);
        mixer.setMuted(false);
        expect(mixer.status().muted).toBe(false);
        expect(mixer.trigger("patient.admitted").played).toBe(true);
        expect(context.oscillators).toHaveLength(1);
        mixer.setVolume(-2);
        expect(mixer.status().volume).toBe(0);
        mixer.setVolume(10);
        expect(mixer.status().volume).toBe(1);
    });
    it("suppresses playback while paused and resumes deterministically", async () => {
        const context = new FakeAudioContext();
        const mixer = createWebAudioMixer({
            createAudioContext: () => context
        });
        await mixer.initializeFromGesture();
        await mixer.setPaused(true);
        expect(context.suspendCalls).toBe(1);
        expect(mixer.status().paused).toBe(true);
        expect(mixer.trigger("app.step")).toEqual({
            played: false,
            cueId: "ui.step",
            reason: "paused"
        });
        expect(context.oscillators).toHaveLength(0);
        await mixer.setPaused(false);
        expect(context.resumeCalls).toBe(2);
        expect(mixer.status().paused).toBe(false);
        expect(mixer.trigger("app.step").played).toBe(true);
        expect(context.oscillators).toHaveLength(1);
    });
    it("surfaces autoplay-policy blocking explicitly", async () => {
        const context = new FakeAudioContext();
        const policyError = new DOMException("blocked", "NotAllowedError");
        context.resumeFailure = policyError;
        const mixer = createWebAudioMixer({
            createAudioContext: () => context
        });
        mixer.trigger("patient.admitted");
        const initialized = await mixer.initializeFromGesture();
        expect(initialized).toBe(false);
        expect(context.resumeCalls).toBe(1);
        expect(mixer.status().initialization).toBe("blocked-autoplay");
        expect(mixer.status().lastError).toContain("NotAllowedError");
        expect(mixer.status().queuedCueCount).toBe(1);
    });
});
