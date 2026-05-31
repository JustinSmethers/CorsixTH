import phase5TriggerFixture from "../fixtures/phase5-audio-trigger-contract.json";
import { AUDIO_CUE_LIBRARY, AUDIO_TRIGGER_CONTRACT, createWebAudioMixer } from "../src/index";
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
    currentTime = 5;
    destination = new FakeGainNode();
    gainNodes = [];
    oscillators = [];
    resumeCalls = 0;
    suspendCalls = 0;
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
        this.state = "running";
    }
    async suspend() {
        this.suspendCalls += 1;
        this.state = "suspended";
    }
}
describe("audio trigger contract", () => {
    it("locks phase 5 trigger and cue fixture contracts", () => {
        expect(AUDIO_TRIGGER_CONTRACT).toEqual(phase5TriggerFixture.triggers);
        expect(AUDIO_CUE_LIBRARY).toEqual(phase5TriggerFixture.cues);
    });
    it("routes events to deterministic cue playback calls", async () => {
        const context = new FakeAudioContext();
        const mixer = createWebAudioMixer({
            createAudioContext: () => context
        });
        const preGestureResult = mixer.trigger("patient.admitted");
        expect(preGestureResult).toEqual({
            played: false,
            cueId: "patient.admit",
            reason: "awaiting-user-gesture"
        });
        expect(mixer.status().queuedCueCount).toBe(1);
        expect(context.oscillators).toHaveLength(0);
        await mixer.initializeFromGesture();
        expect(context.resumeCalls).toBe(1);
        expect(mixer.status().initialization).toBe("running");
        expect(mixer.status().queuedCueCount).toBe(0);
        expect(context.oscillators).toHaveLength(1);
        const cueId = AUDIO_TRIGGER_CONTRACT["patient.admitted"];
        const cue = AUDIO_CUE_LIBRARY[cueId];
        const firstOscillator = context.oscillators[0];
        expect(firstOscillator).toBeDefined();
        expectCuePlayback(firstOscillator, cue);
        const postGestureResult = mixer.trigger("patient.treated.success");
        expect(postGestureResult).toEqual({
            played: true,
            cueId: "patient.treat.success",
            reason: "played"
        });
        expect(context.oscillators).toHaveLength(2);
        const secondOscillator = context.oscillators[1];
        expect(secondOscillator).toBeDefined();
        expectCuePlayback(secondOscillator, AUDIO_CUE_LIBRARY["patient.treat.success"]);
    });
});
function expectCuePlayback(node, cue) {
    expect(node.type).toBe(cue.waveform);
    expect(node.frequency.value).toBe(cue.frequencyHz);
    expect(node.startedAt).toEqual([5]);
    expect(node.stoppedAt).toEqual([5 + cue.durationMs / 1000]);
}
function ensureCueId(cueId) {
    if (!(cueId in AUDIO_CUE_LIBRARY)) {
        throw new Error(`Unknown cue ID in fixture: ${cueId}`);
    }
    return cueId;
}
for (const cueId of Object.values(phase5TriggerFixture.triggers)) {
    ensureCueId(cueId);
}
