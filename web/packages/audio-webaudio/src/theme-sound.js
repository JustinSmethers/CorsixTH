// Archive offsets follow CorsixTH/Src/th_sound.cpp. No original audio is bundled.
export function decodeThemeHospitalSoundArchive(input) {
    const bytes = asBytes(input);
    if (bytes.length < 238) throw new Error("Truncated Theme Hospital sound archive");
    const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
    const header = view.getUint32(bytes.length - 4, true);
    if (header + 234 > bytes.length - 4) throw new Error("Invalid sound archive header");
    const table = view.getUint32(header + 50, true);
    const tableLength = view.getUint32(header + 58, true);
    if (tableLength % 32 !== 0 || table + tableLength > bytes.length - 4) {
        throw new Error("Invalid sound archive table");
    }
    const sounds = new Map();
    for (let offset = table; offset < table + tableLength; offset += 32) {
        let name = "";
        for (let index = 0; index < 18 && bytes[offset + index] !== 0; index += 1) {
            name += String.fromCharCode(bytes[offset + index]);
        }
        // Entry zero is an unnamed archive sentinel, not an audio sample.
        if (!name) continue;
        const start = view.getUint32(offset + 18, true);
        const length = view.getUint32(offset + 26, true);
        if (start + length > bytes.length - 4) throw new Error(`Invalid sound archive sample: ${name}`);
        sounds.set(name.toUpperCase(), bytes.subarray(start, start + length));
    }
    return sounds;
}

export function decodePcmWave(input) {
    const bytes = asBytes(input);
    const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
    const tag = (offset) => String.fromCharCode(...bytes.subarray(offset, offset + 4));
    if (bytes.length < 12 || tag(0) !== "RIFF" || tag(8) !== "WAVE") throw new Error("Invalid WAVE sample");
    const end = view.getUint32(4, true) + 8;
    if (end > bytes.length || end < 12) throw new Error("Truncated WAVE sample");
    let format = null;
    let data = null;
    for (let offset = 12; offset + 8 <= end;) {
        const size = view.getUint32(offset + 4, true);
        const start = offset + 8;
        if (start + size > end) throw new Error("Truncated WAVE chunk");
        if (tag(offset) === "fmt ") {
            if (size < 16) throw new Error("Invalid WAVE format");
            format = {
                encoding: view.getUint16(start, true),
                channels: view.getUint16(start + 2, true),
                sampleRate: view.getUint32(start + 4, true),
                blockAlign: view.getUint16(start + 12, true),
                bits: view.getUint16(start + 14, true)
            };
        }
        if (tag(offset) === "data") data = { start, size };
        offset = start + size + (size & 1);
    }
    if (!format || !data || format.encoding !== 1 || ![8, 16].includes(format.bits) ||
        format.channels < 1 || format.channels > 2 || format.sampleRate < 1 ||
        format.blockAlign !== format.channels * format.bits / 8 || data.size % format.blockAlign !== 0) {
        throw new Error("Unsupported or invalid PCM WAVE format");
    }
    const frameCount = data.size / format.blockAlign;
    if (frameCount === 0) throw new Error("Empty WAVE sample");
    const channels = Array.from({ length: format.channels }, () => new Float32Array(frameCount));
    for (let frame = 0; frame < frameCount; frame += 1) {
        for (let channel = 0; channel < channels.length; channel += 1) {
            const offset = data.start + frame * format.blockAlign + channel * format.bits / 8;
            channels[channel][frame] = format.bits === 8
                ? (view.getUint8(offset) - 128) / 128
                : view.getInt16(offset, true) / 32768;
        }
    }
    return { sampleRate: format.sampleRate, frameCount, channels };
}

function asBytes(input) {
    if (input instanceof Uint8Array) return input;
    if (input instanceof ArrayBuffer) return new Uint8Array(input);
    throw new Error("Expected sound bytes");
}
