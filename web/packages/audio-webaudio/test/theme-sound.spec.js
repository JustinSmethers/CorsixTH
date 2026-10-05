import { existsSync, readFileSync } from "node:fs";
import { createWebAudioMixer, decodePcmWave, decodeThemeHospitalSoundArchive } from "../src/index.js";

function wave(samples = [-32768, 0, 32767], { bits = 16, channels = 1 } = {}) {
    const bytes = new Uint8Array(44 + samples.length * bits / 8);
    const view = new DataView(bytes.buffer);
    const tag = (at, text) => [...text].forEach((c, i) => { bytes[at + i] = c.charCodeAt(0); });
    tag(0, "RIFF"); tag(8, "WAVE"); tag(12, "fmt "); tag(36, "data");
    view.setUint32(4, bytes.length - 8, true);
    view.setUint32(16, 16, true);
    view.setUint16(20, 1, true);
    view.setUint16(22, channels, true);
    view.setUint32(24, 22050, true);
    view.setUint32(28, 22050 * channels * bits / 8, true);
    view.setUint16(32, channels * bits / 8, true);
    view.setUint16(34, bits, true);
    view.setUint32(40, bytes.length - 44, true);
    samples.forEach((sample, i) => bits === 8
        ? view.setUint8(44 + i, sample)
        : view.setInt16(44 + i * 2, sample, true));
    return bytes;
}

function archive(name = "CASHREG.WAV", sample = wave()) {
    const table = sample.length;
    const header = table + 64;
    const bytes = new Uint8Array(header + 238);
    const view = new DataView(bytes.buffer);
    bytes.set(sample);
    [...name].forEach((c, i) => { bytes[table + 32 + i] = c.charCodeAt(0); });
    // Unnamed native sentinel intentionally contains an invalid sample length.
    view.setUint32(table + 26, 0xffffffff, true);
    view.setUint32(table + 32 + 18, 0, true);
    view.setUint32(table + 32 + 26, sample.length, true);
    view.setUint32(header + 50, table, true);
    view.setUint32(header + 58, 64, true);
    view.setUint32(bytes.length - 4, header, true);
    return bytes;
}

function context() {
    const sources = [];
    const buffers = [];
    const gains = [];
    const node = () => ({ connect: vi.fn(), disconnect: vi.fn() });
    return {
        currentTime: 7, destination: {}, sources, buffers, gains,
        resume: vi.fn(async () => {}), suspend: vi.fn(async () => {}), close: vi.fn(async () => {}),
        createGain: () => { const gain = { ...node(), gain: { value: 1 } }; gains.push(gain); return gain; },
        createOscillator: vi.fn(() => ({ ...node(), frequency: { value: 0 }, start: vi.fn(), stop: vi.fn() })),
        createBuffer: (channels, frames, rate) => {
            const samples = Array.from({ length: channels }, () => new Float32Array(frames));
            const buffer = { numberOfChannels: channels, length: frames, sampleRate: rate, getChannelData: (i) => samples[i] };
            buffers.push(buffer); return buffer;
        },
        createBufferSource: () => { const source = { ...node(), start: vi.fn(), stop: vi.fn() }; sources.push(source); return source; }
    };
}

describe("original Theme Hospital sound playback", () => {
    it("reads native archive entries case-insensitively and skips the unnamed sentinel", () => {
        const sounds = decodeThemeHospitalSoundArchive(archive("cashreg.wav"));
        expect([...sounds.keys()]).toEqual(["CASHREG.WAV"]);
        expect(sounds.get("CASHREG.WAV")).toEqual(wave());
        const truncated = archive();
        new DataView(truncated.buffer).setUint32(truncated.length - 4, 0xffffffff, true);
        expect(() => decodeThemeHospitalSoundArchive(truncated)).toThrow(/header/);
        const invalid = archive();
        new DataView(invalid.buffer).setUint32(wave().length + 32 + 26, invalid.length, true);
        expect(() => decodeThemeHospitalSoundArchive(invalid)).toThrow(/sample/);
    });

    it("converts signed 16-bit stereo and unsigned 8-bit PCM without mixing channels", () => {
        const pcm = decodePcmWave(wave([-32768, 32767, 0, -16384], { channels: 2 }));
        expect(pcm.sampleRate).toBe(22050);
        expect(pcm.frameCount).toBe(2);
        expect([...pcm.channels[0]]).toEqual([-1, 0]);
        expect([...pcm.channels[1]]).toEqual([32767 / 32768, -0.5]);
        expect([...decodePcmWave(wave([0, 128, 255], { bits: 8 })).channels[0]]).toEqual([-1, 0, 127 / 128]);
        expect(() => decodePcmWave(wave().subarray(0, 45))).toThrow(/Truncated/);
        const bad = wave();
        new DataView(bad.buffer).setUint16(32, 1, true);
        expect(() => decodePcmWave(bad)).toThrow(/PCM/);
    });

    it("plays imported audio only after a gesture, caches buffers, honors mute/pause and disposes", async () => {
        const audio = context();
        const mixer = createWebAudioMixer({ createAudioContext: () => audio,
            assetBundle: { filesByPath: new Map([["SOUND/DATA/SOUND-0.DAT", { bytes: archive() }]]) } });
        expect(mixer.status().nativeSampleCount).toBe(1);
        expect(mixer.trigger("patient.treated.success").played).toBe(false);
        expect(audio.sources).toHaveLength(0);
        await mixer.initializeFromGesture();
        expect(audio.sources).toHaveLength(1);
        expect(audio.sources[0].start).toHaveBeenCalledWith(7);
        expect(audio.sources[0].buffer.getChannelData(0)[0]).toBe(-1);
        expect(audio.createOscillator).not.toHaveBeenCalled();
        mixer.trigger("patient.treated.success");
        expect(audio.buffers).toHaveLength(1);
        mixer.setSoundMuted(true);
        expect(mixer.trigger("patient.treated.success").reason).toBe("muted");
        mixer.setSoundMuted(false);
        await mixer.setPaused(true);
        expect(mixer.trigger("patient.treated.success").reason).toBe("paused");
        await mixer.setPaused(false);
        audio.sources[0].onended();
        expect(audio.sources[0].disconnect).toHaveBeenCalled();
        mixer.dispose();
        expect(audio.sources[1].stop).toHaveBeenCalled();
        expect(audio.close).toHaveBeenCalled();
        expect(await mixer.initializeFromGesture()).toBe(false);
    });

    it("keeps synthesized fallback cues when imported samples are missing or corrupt", async () => {
        for (const bytes of [new Uint8Array(1), archive("CASHREG.WAV", new Uint8Array(12))]) {
            const audio = context();
            const mixer = createWebAudioMixer({ createAudioContext: () => audio,
                assetBundle: { filesByPath: new Map([["SOUND/DATA/SOUND-0.DAT", { bytes }]]) } });
            expect(await mixer.initializeFromGesture()).toBe(true);
            mixer.trigger("patient.treated.success");
            expect(audio.createOscillator).toHaveBeenCalledOnce();
            expect(mixer.status().nativeError).toBeTruthy();
        }
    });

    const localFile = new URL("../../../../GameData/Contents/Resources/game/SOUND/DATA/SOUND-0.DAT", import.meta.url);
    (existsSync(localFile) ? it : it.skip)("decodes actual GoG effects without redistributing audio", () => {
        const sounds = decodeThemeHospitalSoundArchive(readFileSync(localFile));
        expect(sounds.size).toBeGreaterThan(300);
        for (const name of ["SCLICK.WAV", "SELECTX.WAV", "WRONG2.WAV", "CASHREG.WAV", "BELL.WAV"]) {
            const pcm = decodePcmWave(sounds.get(name));
            expect(pcm.sampleRate).toBe(22050);
            expect(pcm.channels).toHaveLength(1);
            expect(pcm.channels[0].some((sample) => sample !== 0)).toBe(true);
        }
    });
});
