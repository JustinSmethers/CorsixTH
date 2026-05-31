const RNC_HEADER_SIZE = 18;
const RNC_SIGNATURE = [0x52, 0x4e, 0x43, 0x01];

const RNC_CRC_TABLE = [
    0x0000, 0xc0c1, 0xc181, 0x0140, 0xc301, 0x03c0, 0x0280, 0xc241,
    0xc601, 0x06c0, 0x0780, 0xc741, 0x0500, 0xc5c1, 0xc481, 0x0440,
    0xcc01, 0x0cc0, 0x0d80, 0xcd41, 0x0f00, 0xcfc1, 0xce81, 0x0e40,
    0x0a00, 0xcac1, 0xcb81, 0x0b40, 0xc901, 0x09c0, 0x0880, 0xc841,
    0xd801, 0x18c0, 0x1980, 0xd941, 0x1b00, 0xdbc1, 0xda81, 0x1a40,
    0x1e00, 0xdec1, 0xdf81, 0x1f40, 0xdd01, 0x1dc0, 0x1c80, 0xdc41,
    0x1400, 0xd4c1, 0xd581, 0x1540, 0xd701, 0x17c0, 0x1680, 0xd641,
    0xd201, 0x12c0, 0x1380, 0xd341, 0x1100, 0xd1c1, 0xd081, 0x1040,
    0xf001, 0x30c0, 0x3180, 0xf141, 0x3300, 0xf3c1, 0xf281, 0x3240,
    0x3600, 0xf6c1, 0xf781, 0x3740, 0xf501, 0x35c0, 0x3480, 0xf441,
    0x3c00, 0xfcc1, 0xfd81, 0x3d40, 0xff01, 0x3fc0, 0x3e80, 0xfe41,
    0xfa01, 0x3ac0, 0x3b80, 0xfb41, 0x3900, 0xf9c1, 0xf881, 0x3840,
    0x2800, 0xe8c1, 0xe981, 0x2940, 0xeb01, 0x2bc0, 0x2a80, 0xea41,
    0xee01, 0x2ec0, 0x2f80, 0xef41, 0x2d00, 0xedc1, 0xec81, 0x2c40,
    0xe401, 0x24c0, 0x2580, 0xe541, 0x2700, 0xe7c1, 0xe681, 0x2640,
    0x2200, 0xe2c1, 0xe381, 0x2340, 0xe101, 0x21c0, 0x2080, 0xe041,
    0xa001, 0x60c0, 0x6180, 0xa141, 0x6300, 0xa3c1, 0xa281, 0x6240,
    0x6600, 0xa6c1, 0xa781, 0x6740, 0xa501, 0x65c0, 0x6480, 0xa441,
    0x6c00, 0xacc1, 0xad81, 0x6d40, 0xaf01, 0x6fc0, 0x6e80, 0xae41,
    0xaa01, 0x6ac0, 0x6b80, 0xab41, 0x6900, 0xa9c1, 0xa881, 0x6840,
    0x7800, 0xb8c1, 0xb981, 0x7940, 0xbb01, 0x7bc0, 0x7a80, 0xba41,
    0xbe01, 0x7ec0, 0x7f80, 0xbf41, 0x7d00, 0xbdc1, 0xbc81, 0x7c40,
    0xb401, 0x74c0, 0x7580, 0xb541, 0x7700, 0xb7c1, 0xb681, 0x7640,
    0x7200, 0xb2c1, 0xb381, 0x7340, 0xb101, 0x71c0, 0x7080, 0xb041,
    0x5000, 0x90c1, 0x9181, 0x5140, 0x9301, 0x53c0, 0x5280, 0x9241,
    0x9601, 0x56c0, 0x5780, 0x9741, 0x5500, 0x95c1, 0x9481, 0x5440,
    0x9c01, 0x5cc0, 0x5d80, 0x9d41, 0x5f00, 0x9fc1, 0x9e81, 0x5e40,
    0x5a00, 0x9ac1, 0x9b81, 0x5b40, 0x9901, 0x59c0, 0x5880, 0x9841,
    0x8801, 0x48c0, 0x4980, 0x8941, 0x4b00, 0x8bc1, 0x8a81, 0x4a40,
    0x4e00, 0x8ec1, 0x8f81, 0x4f40, 0x8d01, 0x4dc0, 0x4c80, 0x8c41,
    0x4400, 0x84c1, 0x8581, 0x4540, 0x8701, 0x47c0, 0x4680, 0x8641,
    0x8201, 0x42c0, 0x4380, 0x8341, 0x4100, 0x81c1, 0x8081, 0x4040
];

export function isRncCompressed(bytes) {
    const data = toUint8Array(bytes);
    return (data.length >= 4 &&
        data[0] === RNC_SIGNATURE[0] &&
        data[1] === RNC_SIGNATURE[1] &&
        data[2] === RNC_SIGNATURE[2] &&
        data[3] === RNC_SIGNATURE[3]);
}

export function getRncOutputSize(bytes) {
    const data = assertRncHeader(bytes);
    return readUint32Be(data, 4);
}

export function getRncInputSize(bytes) {
    const data = assertRncHeader(bytes);
    return readUint32Be(data, 8) + RNC_HEADER_SIZE;
}

export function decompressRnc(bytes) {
    const data = assertRncHeader(bytes);
    const outputLength = readUint32Be(data, 4);
    const packedLength = readUint32Be(data, 8);
    const inputLength = packedLength + RNC_HEADER_SIZE;
    if (data.length !== inputLength) {
        throw new Error(`RNC input size mismatch: expected ${inputLength} bytes, got ${data.length}`);
    }
    const inputStart = RNC_HEADER_SIZE;
    const inputEnd = inputStart + packedLength;
    if (rncCrc(data, inputStart, packedLength) !== readUint16Be(data, 14)) {
        throw new Error("RNC packed CRC mismatch");
    }
    const expectedOutputCrc = readUint16Be(data, 12);
    const output = new Uint8Array(outputLength);
    let outputOffset = 0;
    const bitStream = new RncBitStream(data, inputStart, inputEnd);
    bitStream.advance(2);
    while (outputOffset < outputLength) {
        const raw = readHuffmanTable(bitStream);
        const distance = readHuffmanTable(bitStream);
        const lengthTable = readHuffmanTable(bitStream);
        let chunkCount = bitStream.read(0xffff, 16);
        while (true) {
            let literalLength = readHuffmanValue(raw, bitStream);
            if (literalLength > 0) {
                while (literalLength > 0) {
                    if (bitStream.position >= inputEnd) {
                        throw new Error("RNC literal copy overran packed input");
                    }
                    if (outputOffset >= outputLength) {
                        throw new Error("RNC literal copy overran output");
                    }
                    output[outputOffset] = data[bitStream.position];
                    outputOffset += 1;
                    bitStream.position += 1;
                    literalLength -= 1;
                }
                bitStream.fixAfterLiteralCopy();
            }
            chunkCount -= 1;
            if (chunkCount <= 0) {
                break;
            }
            const copyDistance = readHuffmanValue(distance, bitStream) + 1;
            let copyLength = readHuffmanValue(lengthTable, bitStream) + 2;
            while (copyLength > 0) {
                const sourceOffset = outputOffset - copyDistance;
                if (sourceOffset < 0) {
                    throw new Error("RNC back-reference before output start");
                }
                if (outputOffset >= outputLength) {
                    throw new Error("RNC back-reference overran output");
                }
                output[outputOffset] = output[sourceOffset];
                outputOffset += 1;
                copyLength -= 1;
            }
        }
    }
    if (rncCrc(output, 0, outputLength) !== expectedOutputCrc) {
        throw new Error("RNC unpacked CRC mismatch");
    }
    return output;
}

function toUint8Array(bytes) {
    return bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes);
}

function assertRncHeader(bytes) {
    const data = toUint8Array(bytes);
    if (data.length < RNC_HEADER_SIZE || !isRncCompressed(data)) {
        throw new Error("Input is not RNC compressed data");
    }
    return data;
}

function rncCrc(data, offset, length) {
    let value = 0;
    for (let index = 0; index < length; index += 1) {
        value ^= data[offset + index] ?? 0;
        value = ((value >>> 8) ^ RNC_CRC_TABLE[value & 0xff]) & 0xffff;
    }
    return value;
}

function readUint32Be(data, offset) {
    return (((data[offset] ?? 0) * 0x1000000) +
        ((data[offset + 1] ?? 0) << 16) +
        ((data[offset + 2] ?? 0) << 8) +
        (data[offset + 3] ?? 0)) >>> 0;
}

function readUint16Be(data, offset) {
    return ((data[offset] ?? 0) << 8) | (data[offset + 1] ?? 0);
}

function readUint16Le(data, offset) {
    return (data[offset] ?? 0) | ((data[offset + 1] ?? 0) << 8);
}

function mirrorBits(value, bitCount) {
    let top = 1 << (bitCount - 1);
    let bottom = 1;
    let mirrored = value;
    while (top > bottom) {
        const mask = top | bottom;
        const masked = mirrored & mask;
        if (masked !== 0 && masked !== mask) {
            mirrored ^= mask;
        }
        top >>= 1;
        bottom <<= 1;
    }
    return mirrored;
}

class RncBitStream {
    constructor(data, position, endPosition) {
        this.data = data;
        this.position = position;
        this.endPosition = endPosition;
        this.bitbuf = readUint16Le(data, position);
        this.bitcount = 16;
    }
    fixAfterLiteralCopy() {
        this.bitcount -= 16;
        if (this.bitcount <= 0) {
            this.bitcount = 0;
        }
        this.bitbuf = (this.bitbuf & ((1 << this.bitcount) - 1)) >>> 0;
        this.fill();
    }
    peek(mask) {
        return this.bitbuf & mask;
    }
    advance(bitCount) {
        if (bitCount < 0 || bitCount > 16) {
            throw new Error(`RNC bit advance out of range: ${bitCount}`);
        }
        this.bitbuf >>>= bitCount;
        this.bitcount -= bitCount;
        if (this.bitcount < 16) {
            this.position += 2;
            this.fill();
        }
    }
    read(mask, bitCount) {
        const value = this.peek(mask);
        this.advance(bitCount);
        return value;
    }
    fill() {
        if (this.position < this.endPosition - 1) {
            this.bitbuf = (this.bitbuf | ((readUint16Le(this.data, this.position) << this.bitcount) >>> 0)) >>> 0;
            this.bitcount += 16;
        }
        else if (this.position < this.endPosition) {
            this.bitbuf = (this.bitbuf | (((this.data[this.position] ?? 0) << this.bitcount) >>> 0)) >>> 0;
            this.bitcount += 16;
        }
    }
}

function readHuffmanTable(bitStream) {
    const encodedLeafCount = bitStream.read(0x1f, 5);
    const nodes = [];
    if (encodedLeafCount === 0) {
        return nodes;
    }
    const leafLengths = [];
    let maxLeafLength = 1;
    for (let index = 0; index < encodedLeafCount; index += 1) {
        const leafLength = bitStream.read(0x0f, 4);
        leafLengths.push(leafLength);
        if (maxLeafLength < leafLength) {
            maxLeafLength = leafLength;
        }
    }
    let bigEndianCode = 0;
    for (let bitLength = 1; bitLength <= maxLeafLength; bitLength += 1) {
        for (let index = 0; index < encodedLeafCount; index += 1) {
            if (leafLengths[index] === bitLength) {
                nodes.push({
                    code: mirrorBits(bigEndianCode, bitLength),
                    codeLength: bitLength,
                    value: index
                });
                bigEndianCode += 1;
            }
        }
        bigEndianCode <<= 1;
    }
    return nodes;
}

function readHuffmanValue(nodes, bitStream) {
    for (const node of nodes) {
        const mask = (1 << node.codeLength) - 1;
        if (bitStream.peek(mask) === node.code) {
            bitStream.advance(node.codeLength);
            if (node.value < 2) {
                return node.value;
            }
            const baseValue = 1 << (node.value - 1);
            return baseValue | bitStream.read(baseValue - 1, node.value - 1);
        }
    }
    throw new Error("RNC Huffman decoding error");
}
