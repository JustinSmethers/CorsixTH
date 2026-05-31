import { decompressRnc, isRncCompressed } from "./rnc.js";

export function decodeThemeHospitalPalette(bytes, options = {}) {
    const data = maybeDecompress(bytes);
    if (data.length !== 256 * 3 && data.length !== 256 * 4) {
        throw new Error(`Invalid Theme Hospital palette length: expected 768 or 1024 bytes, got ${data.length}`);
    }
    const stride = data.length / 256;
    const colors = new Uint8ClampedArray(256 * 4);
    for (let index = 0; index < 256; index += 1) {
        const offset = index * stride;
        const red = options.is8Bit ? data[offset] : convert6BitTo8Bit(data[offset]);
        const green = options.is8Bit ? data[offset + 1] : convert6BitTo8Bit(data[offset + 1]);
        const blue = options.is8Bit ? data[offset + 2] : convert6BitTo8Bit(data[offset + 2]);
        let alpha = stride === 4 ? data[offset + 3] : 0xff;
        if ((red === 0xff && green === 0 && blue === 0xff) || (options.transparentIndex255 && index === 255)) {
            alpha = 0;
        }
        const colorOffset = index * 4;
        colors[colorOffset] = red;
        colors[colorOffset + 1] = green;
        colors[colorOffset + 2] = blue;
        colors[colorOffset + 3] = alpha;
    }
    return {
        contract: "theme-hospital-palette.v1",
        colors,
        stride,
        is8Bit: options.is8Bit === true
    };
}

export function decodeThemeHospitalSpriteSheet(tableBytes, chunkBytes, options = {}) {
    const table = maybeDecompress(tableBytes);
    const chunks = maybeDecompress(chunkBytes);
    const spriteCount = Math.floor(table.length / THEME_HOSPITAL_SPRITE_TABLE_RECORD_SIZE);
    const sprites = [];
    for (let index = 0; index < spriteCount; index += 1) {
        const recordOffset = index * THEME_HOSPITAL_SPRITE_TABLE_RECORD_SIZE;
        const position = readUint32Le(table, recordOffset);
        const width = table[recordOffset + 4] ?? 0;
        const height = table[recordOffset + 5] ?? 0;
        const indices = width === 0 || height === 0
            ? new Uint8Array()
            : decodeThemeHospitalSpriteChunks(chunks.subarray(Math.min(position, chunks.length)), width, height, options.complex === true);
        sprites.push({
            index,
            position,
            width,
            height,
            indices
        });
    }
    return {
        contract: "theme-hospital-sprite-sheet.v1",
        spriteCount,
        sprites
    };
}

export function decodeThemeHospitalSpriteSheetFromBundle(bundle, basePath, options = {}) {
    const table = readBundleBytes(bundle, `${basePath}.TAB`);
    const chunks = readBundleBytes(bundle, `${basePath}.DAT`);
    if (!table || !chunks) {
        return null;
    }
    return decodeThemeHospitalSpriteSheet(table, chunks, options);
}

export function decodeThemeHospitalAnimationSet(startBytes, frameBytes, listBytes, elementBytes) {
    const startData = maybeDecompress(startBytes);
    const frameData = maybeDecompress(frameBytes);
    const listData = maybeDecompress(listBytes);
    const elementData = maybeDecompress(elementBytes);
    const animationCount = Math.floor(startData.length / THEME_HOSPITAL_ANIMATION_START_RECORD_SIZE);
    const frameCount = Math.floor(frameData.length / THEME_HOSPITAL_ANIMATION_FRAME_RECORD_SIZE);
    const listCount = Math.floor(listData.length / 2);
    const elementCount = Math.floor(elementData.length / THEME_HOSPITAL_ANIMATION_ELEMENT_RECORD_SIZE);
    if (animationCount === 0 || frameCount === 0 || listCount === 0 || elementCount === 0) {
        throw new Error("Theme Hospital animation set is empty or incomplete");
    }
    const firstFrames = [];
    for (let index = 0; index < animationCount; index += 1) {
        let firstFrame = readUint16Le(startData, index * THEME_HOSPITAL_ANIMATION_START_RECORD_SIZE);
        if (firstFrame > frameCount) {
            firstFrame = 0;
        }
        firstFrames.push(firstFrame);
    }
    const frames = [];
    for (let index = 0; index < frameCount; index += 1) {
        const offset = index * THEME_HOSPITAL_ANIMATION_FRAME_RECORD_SIZE;
        const listIndex = readUint32Le(frameData, offset);
        const nextFrame = readUint16Le(frameData, offset + 8);
        frames.push({
            index,
            listIndex: listIndex < listCount ? listIndex : 0,
            sound: frameData[offset + 6] ?? 0,
            flags: frameData[offset + 7] ?? 0,
            nextFrame: nextFrame < frameCount ? nextFrame : 0
        });
    }
    const elementList = [];
    for (let index = 0; index < listCount; index += 1) {
        const elementIndex = readUint16Le(listData, index * 2);
        elementList.push(elementIndex >= elementCount ? THEME_HOSPITAL_ANIMATION_LIST_SENTINEL : elementIndex);
    }
    elementList.push(THEME_HOSPITAL_ANIMATION_LIST_SENTINEL);
    const elements = [];
    for (let index = 0; index < elementCount; index += 1) {
        const offset = index * THEME_HOSPITAL_ANIMATION_ELEMENT_RECORD_SIZE;
        const tablePosition = readUint16Le(elementData, offset);
        const layerAndFlags = elementData[offset + 4] ?? 0;
        elements.push({
            index,
            spriteIndex: Math.floor(tablePosition / THEME_HOSPITAL_SPRITE_TABLE_RECORD_SIZE),
            x: (elementData[offset + 2] ?? 0) - 141,
            y: (elementData[offset + 3] ?? 0) - 186,
            layer: layerAndFlags >> 4,
            flags: layerAndFlags & 0x0f,
            layerId: elementData[offset + 5] ?? 0
        });
    }
    return {
        contract: "theme-hospital-animation-set.v1",
        animationCount,
        frameCount,
        listCount,
        elementCount,
        firstFrames,
        frames,
        elementList,
        elements
    };
}

export function decodeThemeHospitalAnimationSetFromBundle(bundle, prefix = "DATA/V") {
    const start = readBundleBytes(bundle, `${prefix}START-1.ANI`);
    const frames = readBundleBytes(bundle, `${prefix}FRA-1.ANI`);
    const list = readBundleBytes(bundle, `${prefix}LIST-1.ANI`);
    const elements = readBundleBytes(bundle, `${prefix}ELE-1.ANI`);
    if (!start || !frames || !list || !elements) {
        return null;
    }
    return decodeThemeHospitalAnimationSet(start, frames, list, elements);
}

export function findFirstRenderableThemeHospitalAnimation(animationSet, spriteSheet, palette) {
    for (let animationIndex = 0; animationIndex < animationSet.animationCount; animationIndex += 1) {
        const frame = animationFrameElements(animationSet, animationIndex);
        if (frame.elements.some((element) => {
            const sprite = spriteSheet.sprites[element.spriteIndex];
            return sprite ? isThemeHospitalSpriteVisible(sprite, palette) : false;
        })) {
            return animationIndex;
        }
    }
    return null;
}

export function renderThemeHospitalAnimationFrame(animationSet, spriteSheet, palette, animationIndex, options = {}) {
    const frame = animationFrameElements(animationSet, animationIndex, options.frameStep ?? 0);
    const drawableElements = frame.elements
        .map((element) => ({ element, sprite: spriteSheet.sprites[element.spriteIndex] }))
        .filter((entry) => entry.sprite && entry.sprite.width > 0 && entry.sprite.height > 0 && isThemeHospitalSpriteVisible(entry.sprite, palette));
    if (drawableElements.length === 0) {
        return {
            width: 1,
            height: 1,
            pixels: new Uint8ClampedArray(4),
            frameIndex: frame.frameIndex,
            elements: []
        };
    }
    let minX = Number.POSITIVE_INFINITY;
    let minY = Number.POSITIVE_INFINITY;
    let maxX = Number.NEGATIVE_INFINITY;
    let maxY = Number.NEGATIVE_INFINITY;
    for (const { element, sprite } of drawableElements) {
        minX = Math.min(minX, element.x);
        minY = Math.min(minY, element.y);
        maxX = Math.max(maxX, element.x + sprite.width);
        maxY = Math.max(maxY, element.y + sprite.height);
    }
    const padding = 2;
    const width = Math.max(1, Math.ceil(maxX - minX + padding * 2));
    const height = Math.max(1, Math.ceil(maxY - minY + padding * 2));
    const pixels = new Uint8ClampedArray(width * height * 4);
    for (const { element, sprite } of drawableElements) {
        const image = renderThemeHospitalSprite(sprite, palette);
        blitImage(pixels, width, height, image, Math.round(element.x - minX + padding), Math.round(element.y - minY + padding), element.flags);
    }
    return {
        width,
        height,
        pixels,
        frameIndex: frame.frameIndex,
        elements: drawableElements.map(({ element }) => element)
    };
}

export function renderThemeHospitalMapScene(input) {
    const map = input.map;
    if (map.contract !== "theme-hospital-map.v1" || !Array.isArray(map.tiles)) {
        throw new Error("Theme Hospital scene rendering requires decoded map tiles");
    }
    const width = input.viewportWidth ?? 512;
    const height = input.viewportHeight ?? 320;
    const pixels = new Uint8ClampedArray(width * height * 4);
    const originX = input.originX ?? Math.floor(width / 2);
    const originY = input.originY ?? 8;
    const startX = input.startX ?? 0;
    const startY = input.startY ?? 0;
    const tileColumns = Math.min(input.tileColumns ?? 10, map.width - startX);
    const tileRows = Math.min(input.tileRows ?? 10, map.height - startY);
    const tileDraws = [];
    let floorSpriteCount = 0;
    let wallSpriteCount = 0;
    for (let y = 0; y < tileRows; y += 1) {
        for (let x = 0; x < tileColumns; x += 1) {
            const mapX = startX + x;
            const mapY = startY + y;
            const tile = map.tiles[mapY * map.width + mapX];
            if (!tile) {
                continue;
            }
            const baseX = Math.round(originX + (x - y) * 32);
            const baseY = Math.round(originY + (x + y) * 16);
            tileDraws.push({ tile, baseX, baseY });
            const floor = input.blockSheet.sprites[tile.ground & 0xff];
            if (floor && floor.width > 0 && floor.height > 0) {
                blitImage(pixels, width, height, renderThemeHospitalSprite(floor, input.palette), baseX, baseY - floor.height + 32);
                floorSpriteCount += 1;
            }
        }
    }
    const orderedTileDraws = [...tileDraws].sort((left, right) => {
        if (left.baseY !== right.baseY) {
            return left.baseY - right.baseY;
        }
        return right.baseX - left.baseX;
    });
    for (const draw of orderedTileDraws) {
        for (const layer of ["northWall", "westWall"]) {
            const spriteIndex = draw.tile[layer] & 0xff;
            if (spriteIndex === 0) {
                continue;
            }
            const sprite = input.blockSheet.sprites[spriteIndex];
            if (!sprite || sprite.width === 0 || sprite.height === 0) {
                continue;
            }
            const image = renderThemeHospitalSprite(sprite, input.palette);
            const xOffset = layer === "westWall" ? -32 : -32;
            blitImage(pixels, width, height, image, draw.baseX + xOffset, draw.baseY - image.height + 32);
            wallSpriteCount += 1;
        }
    }
    let objectSpriteCount = 0;
    if (input.spriteSheet) {
        for (const draw of orderedTileDraws) {
            const spriteIndex = draw.tile.objectType & 0xff;
            if (spriteIndex === 0) {
                continue;
            }
            const sprite = input.spriteSheet.sprites[spriteIndex];
            if (!sprite || sprite.width === 0 || sprite.height === 0) {
                continue;
            }
            const image = renderThemeHospitalSprite(sprite, input.palette);
            blitImage(pixels, width, height, image, draw.baseX - Math.floor(image.width / 2), draw.baseY - image.height + 16, draw.tile.objectFlags);
            objectSpriteCount += 1;
        }
    }
    let animation = null;
    if (input.animationSet && input.spriteSheet) {
        const animationIndex = input.animationIndex ?? findFirstRenderableThemeHospitalAnimation(input.animationSet, input.spriteSheet, input.palette);
        if (animationIndex !== null) {
            const image = renderThemeHospitalAnimationFrame(input.animationSet, input.spriteSheet, input.palette, animationIndex, {
                frameStep: input.animationFrameStep ?? 0
            });
            const targetTile = orderedTileDraws[Math.min(orderedTileDraws.length - 1, Math.floor(orderedTileDraws.length / 2))];
            if (targetTile && image.width > 1 && image.height > 1) {
                blitImage(pixels, width, height, image, targetTile.baseX - Math.floor(image.width / 2), targetTile.baseY - image.height + 16);
                animation = {
                    animationIndex,
                    frameIndex: image.frameIndex,
                    elementCount: image.elements.length
                };
            }
        }
    }
    return {
        contract: "theme-hospital-map-scene.v1",
        width,
        height,
        pixels,
        stats: {
            floorSpriteCount,
            wallSpriteCount,
            objectSpriteCount,
            animation
        }
    };
}

export function renderThemeHospitalSprite(sprite, palette) {
    const pixels = new Uint8ClampedArray(sprite.width * sprite.height * 4);
    for (let index = 0; index < sprite.indices.length; index += 1) {
        const paletteIndex = sprite.indices[index] ?? 255;
        const sourceOffset = paletteIndex * 4;
        const targetOffset = index * 4;
        pixels[targetOffset] = palette.colors[sourceOffset] ?? 0;
        pixels[targetOffset + 1] = palette.colors[sourceOffset + 1] ?? 0;
        pixels[targetOffset + 2] = palette.colors[sourceOffset + 2] ?? 0;
        pixels[targetOffset + 3] = palette.colors[sourceOffset + 3] ?? 0;
    }
    return {
        width: sprite.width,
        height: sprite.height,
        pixels
    };
}

export function findFirstVisibleThemeHospitalSprite(sheet, palette) {
    for (const sprite of sheet.sprites) {
        if (isThemeHospitalSpriteVisible(sprite, palette)) {
            return sprite;
        }
    }
    return null;
}

function isThemeHospitalSpriteVisible(sprite, palette) {
    for (const paletteIndex of sprite.indices) {
        if ((palette.colors[paletteIndex * 4 + 3] ?? 0) !== 0) {
            return true;
        }
    }
    return false;
}

function animationFrameElements(animationSet, animationIndex, frameStep = 0) {
    if (!Number.isInteger(animationIndex) || animationIndex < 0 || animationIndex >= animationSet.animationCount) {
        throw new Error(`Animation index out of bounds: ${animationIndex}`);
    }
    let frameIndex = animationSet.firstFrames[animationIndex] ?? 0;
    const steps = Number.isInteger(frameStep) && frameStep > 0 ? frameStep : 0;
    for (let step = 0; step < steps; step += 1) {
        const frame = animationSet.frames[frameIndex];
        if (!frame || frame.nextFrame === frameIndex) {
            break;
        }
        frameIndex = frame.nextFrame;
    }
    const frame = animationSet.frames[frameIndex];
    if (!frame) {
        return { frameIndex: 0, elements: [] };
    }
    const elements = [];
    for (let listIndex = frame.listIndex; listIndex < animationSet.elementList.length; listIndex += 1) {
        const elementIndex = animationSet.elementList[listIndex];
        if (elementIndex === THEME_HOSPITAL_ANIMATION_LIST_SENTINEL || elementIndex >= animationSet.elements.length) {
            break;
        }
        elements.push(animationSet.elements[elementIndex]);
    }
    return { frameIndex, elements };
}

function blitImage(targetPixels, targetWidth, targetHeight, image, targetX, targetY, flags = 0) {
    const flipHorizontal = (flags & THEME_HOSPITAL_DRAW_FLAG_FLIP_HORIZONTAL) !== 0;
    const flipVertical = (flags & THEME_HOSPITAL_DRAW_FLAG_FLIP_VERTICAL) !== 0;
    for (let sourceY = 0; sourceY < image.height; sourceY += 1) {
        const readY = flipVertical ? image.height - 1 - sourceY : sourceY;
        const y = targetY + sourceY;
        if (y < 0 || y >= targetHeight) {
            continue;
        }
        for (let sourceX = 0; sourceX < image.width; sourceX += 1) {
            const readX = flipHorizontal ? image.width - 1 - sourceX : sourceX;
            const x = targetX + sourceX;
            if (x < 0 || x >= targetWidth) {
                continue;
            }
            const sourceOffset = (readY * image.width + readX) * 4;
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

function decodeThemeHospitalSpriteChunks(data, width, height, complex) {
    const output = new Uint8Array(width * height);
    let outputOffset = 0;
    let x = 0;
    let inputOffset = 0;
    let skipEndOfLine = false;
    const incrementPosition = (pixelCount) => {
        outputOffset += pixelCount;
        x += pixelCount;
        x %= width;
        skipEndOfLine = true;
    };
    const fill = (pixelCount, value) => {
        const clampedCount = Math.max(0, Math.min(pixelCount, output.length - outputOffset));
        if (clampedCount > 0) {
            output.fill(value, outputOffset, outputOffset + clampedCount);
            incrementPosition(clampedCount);
        }
    };
    const copy = (pixelCount) => {
        const clampedCount = Math.max(0, Math.min(pixelCount, output.length - outputOffset, data.length - inputOffset));
        if (clampedCount > 0) {
            output.set(data.subarray(inputOffset, inputOffset + clampedCount), outputOffset);
            inputOffset += clampedCount;
            incrementPosition(clampedCount);
        }
    };
    const fillToEndOfLine = () => {
        if (x !== 0 || !skipEndOfLine) {
            fill(width - x, THEME_HOSPITAL_TRANSPARENT_INDEX);
        }
        skipEndOfLine = false;
    };
    while (outputOffset < output.length && inputOffset < data.length) {
        const byte = data[inputOffset] ?? 0;
        inputOffset += 1;
        if (complex) {
            if (byte === 0) {
                fillToEndOfLine();
            }
            else if (byte < 0x40) {
                copy(byte);
            }
            else if ((byte & 0xc0) === 0x80) {
                fill(byte - 0x80, THEME_HOSPITAL_TRANSPARENT_INDEX);
            }
            else if (byte === 0xff) {
                if (inputOffset + 2 > data.length) {
                    break;
                }
                const amount = data[inputOffset] ?? 0;
                const color = data[inputOffset + 1] ?? 0;
                inputOffset += 2;
                fill(amount, color);
            }
            else {
                const amount = byte - 60 - ((byte & 0x80) >> 1);
                const color = data[inputOffset] ?? 0;
                inputOffset += inputOffset < data.length ? 1 : 0;
                fill(amount, color);
            }
        }
        else if (byte === 0) {
            fillToEndOfLine();
        }
        else if (byte < 0x80) {
            copy(byte);
        }
        else {
            fill(0x100 - byte, THEME_HOSPITAL_TRANSPARENT_INDEX);
        }
    }
    fill(output.length - outputOffset, THEME_HOSPITAL_TRANSPARENT_INDEX);
    return output;
}

function maybeDecompress(bytes) {
    const data = bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes);
    return isRncCompressed(data) ? decompressRnc(data) : data;
}

function convert6BitTo8Bit(value) {
    return Math.round(((value ?? 0) & 0x3f) * 0xff / 0x3f);
}

function readBundleBytes(bundle, path) {
    const normalized = path.toUpperCase();
    const record = bundle.filesByPath.get(normalized);
    return record ? new Uint8Array(record.bytes) : null;
}

function readUint32Le(data, offset) {
    return ((data[offset] ?? 0) |
        ((data[offset + 1] ?? 0) << 8) |
        ((data[offset + 2] ?? 0) << 16) |
        ((data[offset + 3] ?? 0) << 24)) >>> 0;
}

function readUint16Le(data, offset) {
    return (data[offset] ?? 0) | ((data[offset + 1] ?? 0) << 8);
}

const THEME_HOSPITAL_SPRITE_TABLE_RECORD_SIZE = 6;
const THEME_HOSPITAL_TRANSPARENT_INDEX = 0xff;
const THEME_HOSPITAL_ANIMATION_START_RECORD_SIZE = 4;
const THEME_HOSPITAL_ANIMATION_FRAME_RECORD_SIZE = 10;
const THEME_HOSPITAL_ANIMATION_ELEMENT_RECORD_SIZE = 6;
const THEME_HOSPITAL_ANIMATION_LIST_SENTINEL = 0xffff;
const THEME_HOSPITAL_DRAW_FLAG_FLIP_HORIZONTAL = 1;
const THEME_HOSPITAL_DRAW_FLAG_FLIP_VERTICAL = 2;
