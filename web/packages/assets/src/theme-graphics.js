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
        if (firstFrame >= frameCount) {
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

/** Native walking/standing animation and appearance selection from
 * Lua/entities/humanoid.lua and Lua/humanoid_actions/{walk,idle}.lua.
 * Returns null for unsupported humanoids so callers can provide a fallback.
 */
export function resolveThemeHospitalHumanoidAnimation(humanoidType, options = {}) {
    const type = THEME_HOSPITAL_HUMANOID_ALIASES[humanoidType] ?? humanoidType;
    const animations = THEME_HOSPITAL_HUMANOID_ANIMATIONS[type];
    if (!animations) return null;
    const direction = options.direction ?? "east";
    if (!["north", "east", "south", "west"].includes(direction)) {
        throw new Error(`Unsupported humanoid direction: ${direction}`);
    }
    const state = options.state ?? "idle";
    if (!["idle", "walk", "walking"].includes(state)) {
        throw new Error(`Unsupported humanoid animation state: ${state}`);
    }
    const walking = state !== "idle";
    const north = direction === "north" || direction === "west";
    const animationIndex = animations[(walking ? 0 : 2) + (north ? 0 : 1)];
    const flags = direction === "west" || direction === "south" ? 1 : 0;
    const layers = type.includes("Patient") ? { 0: 2, 1: 0, 2: 0, 3: 0, 4: 0 } : { 5: 2 };
    return { humanoidType: type, animationIndex, flags, layers: { ...layers, ...options.layers } };
}

export function renderThemeHospitalAnimationFrame(animationSet, spriteSheet, palette, animationIndex, options = {}) {
    const frame = animationFrameElements(animationSet, animationIndex, options.frameStep ?? 0);
    const drawableElements = frame.elements
        .filter((element) => element.layerId === 0 ||
            (options.layers?.[element.layer] ?? 0) === element.layerId ||
            (element.layer === 5 && (options.layers?.[5] ?? 0) - 4 === element.layerId))
        .map((element) => {
            const sprite = spriteSheet.sprites[element.spriteIndex];
            const mirrored = ((options.flags ?? 0) & THEME_HOSPITAL_DRAW_FLAG_FLIP_HORIZONTAL) !== 0;
            return {
                element,
                sprite,
                x: mirrored && sprite ? -element.x - sprite.width : element.x,
                flags: element.flags ^ (mirrored ? THEME_HOSPITAL_DRAW_FLAG_FLIP_HORIZONTAL : 0)
            };
        })
        .filter((entry) => entry.sprite && entry.sprite.width > 0 && entry.sprite.height > 0 && isThemeHospitalSpriteVisible(entry.sprite, palette));
    if (drawableElements.length === 0) {
        return {
            width: 1,
            height: 1,
            pixels: new Uint8ClampedArray(4),
            frameIndex: frame.frameIndex,
            originX: 0,
            originY: 0,
            elements: []
        };
    }
    let minX = Number.POSITIVE_INFINITY;
    let minY = Number.POSITIVE_INFINITY;
    let maxX = Number.NEGATIVE_INFINITY;
    let maxY = Number.NEGATIVE_INFINITY;
    for (const { element, sprite, x } of drawableElements) {
        minX = Math.min(minX, x);
        minY = Math.min(minY, element.y);
        maxX = Math.max(maxX, x + sprite.width);
        maxY = Math.max(maxY, element.y + sprite.height);
    }
    const padding = 2;
    const width = Math.max(1, Math.ceil(maxX - minX + padding * 2));
    const height = Math.max(1, Math.ceil(maxY - minY + padding * 2));
    const pixels = new Uint8ClampedArray(width * height * 4);
    for (const { element, sprite, x, flags } of drawableElements) {
        const image = renderThemeHospitalSprite(sprite, palette);
        blitImage(pixels, width, height, image, Math.round(x - minX + padding), Math.round(element.y - minY + padding), flags | ((options.flags ?? 0) & 12));
    }
    return {
        width,
        height,
        pixels,
        frameIndex: frame.frameIndex,
        originX: padding - minX,
        originY: padding - minY,
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
            tileDraws.push({ tile, baseX, baseY, mapX, mapY });
            const floor = input.blockSheet.sprites[tile.ground & 0xff];
            if (floor && floor.width > 0 && floor.height > 0) {
                blitImage(pixels, width, height, renderThemeHospitalSprite(floor, input.palette), baseX - 32, baseY - floor.height + 32, tile.ground >>> 8);
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
    let objectSpriteCount = 0;
    // Native map rendering uses two passes per diagonal scanline: north walls
    // right to left, then west walls and entities left to right.
    const scanlines = new Map();
    for (const draw of orderedTileDraws) {
        if (!scanlines.has(draw.baseY)) scanlines.set(draw.baseY, []);
        scanlines.get(draw.baseY).push(draw);
    }
    const drawWall = (draw, layer) => {
        const spriteIndex = draw.tile[layer] & 0xff;
        if (spriteIndex === 0) return;
        const sprite = input.blockSheet.sprites[spriteIndex];
        if (!sprite || sprite.width === 0 || sprite.height === 0) return;
        const image = renderThemeHospitalSprite(sprite, input.palette);
        blitImage(pixels, width, height, image, draw.baseX - 32,
            draw.baseY - image.height + 32, draw.tile[layer] >>> 8,
            { opacity: input.wallAlpha ?? 1 });
        wallSpriteCount += 1;
    };
    const drawObject = (draw) => {
        if (!input.spriteSheet) return;
        const objectType = draw.tile.objectType & 0xff;
        if (objectType === 0) return;
        if (input.animationSet) {
            // These are the two map-created object types supported by native
            // World:createMapObject and Lua/objects/doors/entrance_*.lua. THOB
            // values are object types, never offsets into the raw sprite table.
            const animationIds = THEME_HOSPITAL_MAP_OBJECT_ANIMATIONS[objectType];
            if (!animationIds) return;
            const animationIndex = animationIds[(draw.tile.objectFlags ?? 0) & 1];
            if (animationIndex >= input.animationSet.animationCount) return;
            const image = renderThemeHospitalAnimationFrame(input.animationSet,
                input.spriteSheet, input.palette, animationIndex);
            if (image.elements.length === 0) return;
            blitImage(pixels, width, height, image,
                Math.round(draw.baseX - image.originX),
                Math.round(draw.baseY - image.originY));
            objectSpriteCount += 1;
            return;
        }
        // Retain the raw sprite preview for bundles without animation metadata.
        const sprite = input.spriteSheet.sprites[objectType];
        if (!sprite || sprite.width === 0 || sprite.height === 0) return;
        const image = renderThemeHospitalSprite(sprite, input.palette);
        blitImage(pixels, width, height, image, draw.baseX - Math.floor(image.width / 2),
            draw.baseY - image.height + 16, draw.tile.objectFlags);
        objectSpriteCount += 1;
    };
    const entityDraws = [];
    const entitiesByTile = new Map();
    if (input.animationSet && input.spriteSheet) {
        for (const entity of input.entities ?? []) {
            const position = entity.position ?? entity;
            if (!Number.isFinite(position.x) || !Number.isFinite(position.y)) {
                throw new Error(`Invalid native entity position: ${entity.id}`);
            }
            if (Math.floor(position.x) < startX || Math.floor(position.x) >= startX + tileColumns ||
                Math.floor(position.y) < startY || Math.floor(position.y) >= startY + tileRows) continue;
            const appearance = entity.animationIndex === undefined
                ? resolveThemeHospitalHumanoidAnimation(entity.humanoidType ?? entity.role ?? "patient", {
                    direction: entity.direction,
                    state: entity.animationState,
                    layers: entity.layers
                })
                : { humanoidType: entity.humanoidType ?? null, animationIndex: entity.animationIndex,
                    flags: entity.flags ?? 0, layers: entity.layers ?? {} };
            if (!appearance || appearance.animationIndex >= input.animationSet.animationCount) continue;
            const image = renderThemeHospitalAnimationFrame(input.animationSet, input.spriteSheet,
                input.palette, appearance.animationIndex, {
                    flags: appearance.flags,
                    layers: appearance.layers,
                    frameStep: entity.frameStep ?? input.animationFrameStep ?? 0
                });
            if (image.elements.length === 0) continue;
            const key = `${Math.floor(position.x)}:${Math.floor(position.y)}`;
            if (!entitiesByTile.has(key)) entitiesByTile.set(key, []);
            const localX = position.x - startX;
            const localY = position.y - startY;
            const screenX = Math.round(originX + (localX - localY) * 32 - image.originX);
            const screenY = Math.round(originY + (localX + localY) * 16 - image.originY);
            entitiesByTile.get(key).push({ entity, image, appearance, screenX, screenY });
        }
    }
    const drawEntities = (draw) => {
        const key = `${draw.mapX}:${draw.mapY}`;
        const entities = entitiesByTile.get(key) ?? [];
        entities.sort((left, right) => left.screenY + left.image.originY - right.screenY - right.image.originY ||
            String(left.entity.id).localeCompare(String(right.entity.id)));
        for (const entry of entities) {
            const { entity, image, appearance, screenX, screenY } = entry;
            if (screenX + image.width <= 0 || screenX >= width || screenY + image.height <= 0 || screenY >= height) continue;
            blitImage(pixels, width, height, image, screenX, screenY);
            entityDraws.push({ id: entity.id, humanoidType: appearance.humanoidType,
                animationIndex: appearance.animationIndex, frameIndex: image.frameIndex,
                screenX, screenY, width: image.width, height: image.height });
        }
    };
    for (const draws of scanlines.values()) {
        for (const draw of draws) drawWall(draw, "northWall");
        for (let index = draws.length - 1; index >= 0; index -= 1) {
            drawWall(draws[index], "westWall");
            drawObject(draws[index]);
            drawEntities(draws[index]);
        }
    }
    let animation = null;
    if (input.animationSet && input.spriteSheet && input.animationIndex !== undefined) {
        const animationIndex = input.animationIndex;
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
        entityDraws,
        stats: {
            entitySpriteCount: entityDraws.length,
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
    const visitedFrames = new Map();
    for (let step = 0; step < steps; step += 1) {
        const priorStep = visitedFrames.get(frameIndex);
        if (priorStep !== undefined) {
            const cycleLength = step - priorStep;
            const cycles = Math.floor((steps - step) / cycleLength);
            if (cycles > 0) {
                step += cycles * cycleLength;
                if (step === steps) break;
            }
        }
        else {
            visitedFrames.set(frameIndex, step);
        }
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

function blitImage(targetPixels, targetWidth, targetHeight, image, targetX, targetY, flags = 0, options = {}) {
    const flipHorizontal = (flags & THEME_HOSPITAL_DRAW_FLAG_FLIP_HORIZONTAL) !== 0;
    const flipVertical = (flags & THEME_HOSPITAL_DRAW_FLAG_FLIP_VERTICAL) !== 0;
    const alphaFlags = flags & 12;
    if (alphaFlags === 12) return;
    const flagOpacity = alphaFlags === 4 ? 128 / 255 : alphaFlags === 8 ? 64 / 255 : 1;
    const opacity = Math.max(0, Math.min(1, options.opacity ?? 1)) * flagOpacity;
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
            const effectiveAlpha = Math.round(alpha * opacity);
            if (effectiveAlpha === 0) {
                continue;
            }
            const targetOffset = (y * targetWidth + x) * 4;
            if (effectiveAlpha === 255) {
                targetPixels[targetOffset] = image.pixels[sourceOffset];
                targetPixels[targetOffset + 1] = image.pixels[sourceOffset + 1];
                targetPixels[targetOffset + 2] = image.pixels[sourceOffset + 2];
                targetPixels[targetOffset + 3] = effectiveAlpha;
                continue;
            }
            const sourceWeight = effectiveAlpha / 255;
            const targetAlpha = targetPixels[targetOffset + 3] ?? 0;
            const targetWeight = (targetAlpha / 255) * (1 - sourceWeight);
            const outputWeight = sourceWeight + targetWeight;
            targetPixels[targetOffset] = outputWeight === 0 ? 0 : Math.round(((image.pixels[sourceOffset] * sourceWeight) + (targetPixels[targetOffset] * targetWeight)) / outputWeight);
            targetPixels[targetOffset + 1] = outputWeight === 0 ? 0 : Math.round(((image.pixels[sourceOffset + 1] * sourceWeight) + (targetPixels[targetOffset + 1] * targetWeight)) / outputWeight);
            targetPixels[targetOffset + 2] = outputWeight === 0 ? 0 : Math.round(((image.pixels[sourceOffset + 2] * sourceWeight) + (targetPixels[targetOffset + 2] * targetWeight)) / outputWeight);
            targetPixels[targetOffset + 3] = Math.round(outputWeight * 255);
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

// Indexed by THOB, then the map direction flag parity (north / west).
const THEME_HOSPITAL_MAP_OBJECT_ANIMATIONS = {
    58: [316, 318],
    59: [308, 312]
};

// walk north, walk east, idle north, idle east. These IDs index VSTART-1.ANI.
const THEME_HOSPITAL_HUMANOID_ANIMATIONS = {
    "Standard Male Patient": [16, 18, 24, 26],
    "Standard Female Patient": [0, 2, 8, 10],
    "Slack Male Patient": [1484, 1486, 1492, 1494],
    "Slack Female Patient": [0, 2, 8, 10],
    "Alternate Male Patient": [2704, 2706, 2712, 2714],
    "Gowned Male Patient": [406, 408, 414, 416],
    "Gowned Female Patient": [2876, 2878, 2884, 2886],
    "Stripped Male Patient": [818, 820, 826, 828],
    "Stripped Female Patient": [834, 836, 842, 844],
    "Transparent Male Patient": [1064, 1066, 1072, 1074],
    "Transparent Female Patient": [3012, 3014, 3020, 3022],
    "Chewbacca Patient": [858, 860, 866, 868],
    "Elvis Patient": [978, 980, 986, 988],
    "Invisible Patient": [1642, 1644, 1840, 1842],
    "Alien Male Patient": [3598, 3600, 3606, 3608],
    "Alien Female Patient": [3598, 3600, 3606, 3608],
    Doctor: [32, 34, 40, 42],
    Surgeon: [2288, 2290, 2296, 2298],
    Nurse: [1206, 1208, 1650, 1652],
    Handyman: [1858, 1860, 1866, 1868],
    Receptionist: [3668, 3670, 3676, 3678],
    VIP: [266, 268, 274, 276],
    Inspector: [266, 268, 274, 276],
    "Grim Reaper": [994, 996, 1002, 1004]
};
const THEME_HOSPITAL_HUMANOID_ALIASES = {
    patient: "Standard Male Patient", doctor: "Doctor", diagnostician: "Doctor",
    nurse: "Nurse", handyman: "Handyman", receptionist: "Receptionist", surgeon: "Surgeon"
};
