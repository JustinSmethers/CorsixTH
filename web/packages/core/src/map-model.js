function clonePosition(position) {
    return { x: position.x, y: position.y };
}
function assertValidTileDefinitions(tileDefinitions) {
    if (tileDefinitions.length === 0) {
        throw new Error("Tile definitions must not be empty");
    }
    const byId = new Map();
    for (const definition of tileDefinitions) {
        if (!Number.isInteger(definition.id) || definition.id < 0) {
            throw new Error(`Invalid tile definition id: ${definition.id}`);
        }
        if (byId.has(definition.id)) {
            throw new Error(`Duplicate tile definition id: ${definition.id}`);
        }
        if (typeof definition.name !== "string" || definition.name.length === 0) {
            throw new Error(`Invalid tile definition name for id: ${definition.id}`);
        }
        if (typeof definition.metadata.kind !== "string" || definition.metadata.kind.length === 0) {
            throw new Error(`Invalid tile kind for id: ${definition.id}`);
        }
        if (typeof definition.metadata.passable !== "boolean") {
            throw new Error(`Invalid tile passable flag for id: ${definition.id}`);
        }
        if (!Number.isInteger(definition.metadata.movementCost) || definition.metadata.movementCost <= 0) {
            throw new Error(`Invalid movementCost for id: ${definition.id}`);
        }
        byId.set(definition.id, {
            id: definition.id,
            name: definition.name,
            metadata: {
                kind: definition.metadata.kind,
                passable: definition.metadata.passable,
                movementCost: definition.metadata.movementCost,
                canTravelN: definition.metadata.canTravelN !== false,
                canTravelE: definition.metadata.canTravelE !== false,
                canTravelS: definition.metadata.canTravelS !== false,
                canTravelW: definition.metadata.canTravelW !== false
            }
        });
    }
    return byId;
}
function assertBounds(width, height) {
    if (!Number.isInteger(width) || width <= 0 || !Number.isInteger(height) || height <= 0) {
        throw new Error(`Invalid tile map bounds: ${width}x${height}`);
    }
}
export class TileMap {
    width;
    height;
    size;
    tileIds;
    definitionsById;
    constructor(options) {
        assertBounds(options.width, options.height);
        this.width = options.width;
        this.height = options.height;
        this.size = this.width * this.height;
        this.definitionsById = assertValidTileDefinitions(options.tileDefinitions);
        if (options.tileIds.length !== this.size) {
            throw new Error(`Tile id length ${options.tileIds.length} does not match map size ${this.size}`);
        }
        this.tileIds = new Int32Array(this.size);
        for (let i = 0; i < options.tileIds.length; i += 1) {
            const tileId = options.tileIds[i];
            if (tileId === undefined || !Number.isInteger(tileId)) {
                throw new Error(`Invalid tile id at index ${i}: ${tileId}`);
            }
            if (!this.definitionsById.has(tileId)) {
                throw new Error(`Missing tile definition for id ${tileId}`);
            }
            this.tileIds[i] = tileId;
        }
    }
    static fromRows(rows, tileDefinitions) {
        if (rows.length === 0) {
            throw new Error("Tile rows must not be empty");
        }
        const width = rows[0]?.length ?? 0;
        if (width === 0) {
            throw new Error("Tile rows must not be empty");
        }
        const tileIds = [];
        for (let y = 0; y < rows.length; y += 1) {
            const row = rows[y];
            if (!row) {
                throw new Error(`Missing row at y=${y}`);
            }
            if (row.length !== width) {
                throw new Error(`Inconsistent row width at y=${y}: expected ${width}, got ${row.length}`);
            }
            for (let x = 0; x < row.length; x += 1) {
                const tileId = row[x];
                if (tileId === undefined || !Number.isInteger(tileId)) {
                    throw new Error(`Non-integer tile id at (${x}, ${y})`);
                }
                tileIds.push(tileId);
            }
        }
        return new TileMap({
            width,
            height: rows.length,
            tileIds,
            tileDefinitions
        });
    }
    isInBounds(position) {
        return (Number.isInteger(position.x) &&
            Number.isInteger(position.y) &&
            position.x >= 0 &&
            position.y >= 0 &&
            position.x < this.width &&
            position.y < this.height);
    }
    toIndex(position) {
        if (!this.isInBounds(position)) {
            throw new Error(`Position out of bounds: (${position.x}, ${position.y})`);
        }
        return position.y * this.width + position.x;
    }
    toPosition(index) {
        if (!Number.isInteger(index) || index < 0 || index >= this.size) {
            throw new Error(`Tile index out of bounds: ${index}`);
        }
        const y = Math.floor(index / this.width);
        const x = index - y * this.width;
        return { x, y };
    }
    tileIdAt(position) {
        const index = this.toIndex(position);
        return this.tileIds[index] ?? 0;
    }
    metadataAt(position) {
        const tileId = this.tileIdAt(position);
        const definition = this.definitionsById.get(tileId);
        if (!definition) {
            throw new Error(`Missing tile definition for id ${tileId}`);
        }
        return {
            kind: definition.metadata.kind,
            passable: definition.metadata.passable,
            movementCost: definition.metadata.movementCost,
            canTravelN: definition.metadata.canTravelN,
            canTravelE: definition.metadata.canTravelE,
            canTravelS: definition.metadata.canTravelS,
            canTravelW: definition.metadata.canTravelW
        };
    }
    isPassable(position) {
        return this.metadataAt(position).passable;
    }
    movementCostAt(position) {
        return this.metadataAt(position).movementCost;
    }
    canTravel(from, to) {
        if (!this.isInBounds(from) || !this.isInBounds(to)) {
            return false;
        }
        const deltaX = to.x - from.x;
        const deltaY = to.y - from.y;
        if (Math.abs(deltaX) + Math.abs(deltaY) !== 1) {
            return false;
        }
        if (!this.isPassable(from) || !this.isPassable(to)) {
            return false;
        }
        const fromMetadata = this.metadataAt(from);
        const toMetadata = this.metadataAt(to);
        if (deltaY === -1) {
            return fromMetadata.canTravelN && toMetadata.canTravelS;
        }
        if (deltaX === 1) {
            return fromMetadata.canTravelE && toMetadata.canTravelW;
        }
        if (deltaY === 1) {
            return fromMetadata.canTravelS && toMetadata.canTravelN;
        }
        return fromMetadata.canTravelW && toMetadata.canTravelE;
    }
    clonePosition(position) {
        return clonePosition(position);
    }
}
