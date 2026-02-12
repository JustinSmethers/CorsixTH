export type RgbaColor = readonly [number, number, number, number];

const CLEAR_COLOR: RgbaColor = [0, 0, 0, 255];
const TILE_INSPECT_COLOR: RgbaColor = [220, 190, 64, 255];
const ENTITY_INSPECT_COLOR: RgbaColor = [64, 188, 196, 255];
const KIND_ORDER: Record<RenderCommandKind, number> = {
  tile: 0,
  sprite: 1,
  debug: 2
};

export interface AtlasSpriteDefinition {
  id: string;
  page: string;
  width: number;
  height: number;
  color: RgbaColor;
}

export interface TextureAtlasDefinition {
  sprites: ReadonlyArray<AtlasSpriteDefinition>;
}

export interface TextureAtlasSprite {
  id: string;
  page: string;
  width: number;
  height: number;
  color: RgbaColor;
}

export interface TextureAtlas {
  spritesById: ReadonlyMap<string, TextureAtlasSprite>;
  spriteIds: ReadonlyArray<string>;
}

export interface CameraState {
  scrollX: number;
  scrollY: number;
  zoom: number;
}

export interface SceneEntity {
  id: string;
  spriteId: string;
  x: number;
  y: number;
  zOffset?: number;
}

export interface TilePosition {
  x: number;
  y: number;
}

export interface DebugOverlayOptions {
  inspectTile?: TilePosition;
  inspectEntityId?: string;
}

export interface RenderSceneInput {
  atlas: TextureAtlas;
  viewportWidth: number;
  viewportHeight: number;
  tileSize: number;
  camera: CameraState;
  tiles: ReadonlyArray<ReadonlyArray<string>>;
  entities: ReadonlyArray<SceneEntity>;
  debug?: DebugOverlayOptions;
}

export type RenderCommandKind = "tile" | "sprite" | "debug";

export interface RenderCommand {
  id: string;
  kind: RenderCommandKind;
  page: string;
  spriteId: string;
  depth: number;
  worldX: number;
  worldY: number;
  worldWidth: number;
  worldHeight: number;
  screenX: number;
  screenY: number;
  screenWidth: number;
  screenHeight: number;
  color: RgbaColor;
  borderOnly: boolean;
}

export interface RenderBatch {
  page: string;
  commandIds: string[];
}

export interface DebugPrimitive {
  id: string;
  screenX: number;
  screenY: number;
  screenWidth: number;
  screenHeight: number;
  color: RgbaColor;
}

export interface DeterministicScene {
  commands: RenderCommand[];
  batches: RenderBatch[];
  debugPrimitives: DebugPrimitive[];
}

export interface RenderedFrame extends DeterministicScene {
  width: number;
  height: number;
  pixels: Uint8ClampedArray;
}

export interface VisualSnapshotScenario {
  id: string;
  viewport: { width: number; height: number };
  tileSize: number;
  camera: CameraState;
  tiles: string[][];
  entities: SceneEntity[];
  debug?: DebugOverlayOptions;
  baselineRows: string[];
  maxDiffPixels?: number;
}

export interface VisualSnapshotFixture {
  schemaVersion: "renderer-snapshot.v0";
  fixtureId: string;
  defaultMaxDiffPixels: number;
  palette: Record<string, RgbaColor>;
  atlas: TextureAtlasDefinition;
  scenarios: VisualSnapshotScenario[];
}

export interface VisualSnapshotScenarioResult {
  id: string;
  passed: boolean;
  changedPixels: number;
  maxDiffPixels: number;
  actualHash: string;
}

export interface VisualSnapshotRunResult {
  fixtureId: string;
  passed: boolean;
  scenarioResults: VisualSnapshotScenarioResult[];
}

export interface FrameProfileOptions {
  warmupFrames?: number;
  measuredFrames?: number;
  targetFps?: number;
  script?: (frameIndex: number, camera: CameraState) => CameraState;
}

export interface FrameProfileResult {
  warmupFrames: number;
  measuredFrames: number;
  targetFps: number;
  averageFrameMs: number;
  measuredFps: number;
  passed: boolean;
}

export interface PixelDiffResult {
  changedPixels: number;
}

export interface RenderFrame {
  sceneId: string;
  deterministicOrder: string[];
}

export function buildDeterministicFrame(sceneId: string, entities: string[]): RenderFrame {
  return {
    sceneId,
    deterministicOrder: [...entities].sort((left, right) => left.localeCompare(right))
  };
}

function assertFiniteNumber(value: number, label: string): void {
  if (!Number.isFinite(value)) {
    throw new Error(`${label} must be finite`);
  }
}

function assertPositiveInteger(value: number, label: string): void {
  if (!Number.isInteger(value) || value <= 0) {
    throw new Error(`${label} must be a positive integer`);
  }
}

function assertInteger(value: number, label: string): void {
  if (!Number.isInteger(value)) {
    throw new Error(`${label} must be an integer`);
  }
}

function cloneColor(color: RgbaColor): RgbaColor {
  return [color[0], color[1], color[2], color[3]];
}

function compareCommands(left: RenderCommand, right: RenderCommand): number {
  if (left.depth !== right.depth) {
    return left.depth - right.depth;
  }

  if (KIND_ORDER[left.kind] !== KIND_ORDER[right.kind]) {
    return KIND_ORDER[left.kind] - KIND_ORDER[right.kind];
  }

  if (left.worldY !== right.worldY) {
    return left.worldY - right.worldY;
  }

  if (left.worldX !== right.worldX) {
    return left.worldX - right.worldX;
  }

  if (left.page !== right.page) {
    return left.page.localeCompare(right.page);
  }

  return left.id.localeCompare(right.id);
}

function assertRectangularTiles(rows: ReadonlyArray<ReadonlyArray<string>>): void {
  if (rows.length === 0) {
    throw new Error("Tile rows must not be empty");
  }

  const width = rows[0]?.length ?? 0;
  if (width === 0) {
    throw new Error("Tile rows must not be empty");
  }

  for (let y = 0; y < rows.length; y += 1) {
    const row = rows[y];
    if (!row || row.length !== width) {
      throw new Error(`Inconsistent tile row width at row ${y}`);
    }
  }
}

function worldToScreen(position: number, scroll: number, zoom: number): number {
  return Math.round((position - scroll) * zoom);
}

function worldSizeToScreen(size: number, zoom: number): number {
  return Math.max(1, Math.round(size * zoom));
}

function intersectsViewport(command: RenderCommand, viewportWidth: number, viewportHeight: number): boolean {
  return (
    command.screenX < viewportWidth &&
    command.screenY < viewportHeight &&
    command.screenX + command.screenWidth > 0 &&
    command.screenY + command.screenHeight > 0
  );
}

function resolveSprite(atlas: TextureAtlas, spriteId: string): TextureAtlasSprite {
  const sprite = atlas.spritesById.get(spriteId);
  if (!sprite) {
    throw new Error(`Unknown atlas sprite: ${spriteId}`);
  }
  return sprite;
}

function createTileCommand(
  atlas: TextureAtlas,
  spriteId: string,
  tileX: number,
  tileY: number,
  tileSize: number,
  camera: CameraState
): RenderCommand {
  const sprite = resolveSprite(atlas, spriteId);
  const worldX = tileX * tileSize;
  const worldY = tileY * tileSize;
  const worldWidth = tileSize;
  const worldHeight = tileSize;

  return {
    id: `tile:${tileX}:${tileY}`,
    kind: "tile",
    page: sprite.page,
    spriteId: sprite.id,
    depth: worldY,
    worldX,
    worldY,
    worldWidth,
    worldHeight,
    screenX: worldToScreen(worldX, camera.scrollX, camera.zoom),
    screenY: worldToScreen(worldY, camera.scrollY, camera.zoom),
    screenWidth: worldSizeToScreen(worldWidth, camera.zoom),
    screenHeight: worldSizeToScreen(worldHeight, camera.zoom),
    color: cloneColor(sprite.color),
    borderOnly: false
  };
}

function createEntityCommand(
  atlas: TextureAtlas,
  entity: SceneEntity,
  tileSize: number,
  camera: CameraState
): RenderCommand {
  const sprite = resolveSprite(atlas, entity.spriteId);
  const worldX = entity.x * tileSize;
  const worldY = entity.y * tileSize;
  const worldWidth = sprite.width;
  const worldHeight = sprite.height;
  const zOffset = entity.zOffset ?? 0;

  return {
    id: entity.id,
    kind: "sprite",
    page: sprite.page,
    spriteId: sprite.id,
    depth: worldY + worldHeight + zOffset,
    worldX,
    worldY,
    worldWidth,
    worldHeight,
    screenX: worldToScreen(worldX, camera.scrollX, camera.zoom),
    screenY: worldToScreen(worldY, camera.scrollY, camera.zoom),
    screenWidth: worldSizeToScreen(worldWidth, camera.zoom),
    screenHeight: worldSizeToScreen(worldHeight, camera.zoom),
    color: cloneColor(sprite.color),
    borderOnly: false
  };
}

function createDebugPrimitives(
  input: RenderSceneInput,
  visibleCommands: ReadonlyArray<RenderCommand>
): DebugPrimitive[] {
  const primitives: DebugPrimitive[] = [];
  const options = input.debug;
  if (!options) {
    return primitives;
  }

  if (options.inspectTile) {
    const tileWorldX = options.inspectTile.x * input.tileSize;
    const tileWorldY = options.inspectTile.y * input.tileSize;
    primitives.push({
      id: `tile:${options.inspectTile.x}:${options.inspectTile.y}`,
      screenX: worldToScreen(tileWorldX, input.camera.scrollX, input.camera.zoom),
      screenY: worldToScreen(tileWorldY, input.camera.scrollY, input.camera.zoom),
      screenWidth: worldSizeToScreen(input.tileSize, input.camera.zoom),
      screenHeight: worldSizeToScreen(input.tileSize, input.camera.zoom),
      color: cloneColor(TILE_INSPECT_COLOR)
    });
  }

  if (options.inspectEntityId) {
    const inspected = visibleCommands.find((command) => command.kind === "sprite" && command.id === options.inspectEntityId);
    if (inspected) {
      primitives.push({
        id: `entity:${options.inspectEntityId}`,
        screenX: inspected.screenX,
        screenY: inspected.screenY,
        screenWidth: inspected.screenWidth,
        screenHeight: inspected.screenHeight,
        color: cloneColor(ENTITY_INSPECT_COLOR)
      });
    }
  }

  primitives.sort((left, right) => {
    const leftIsTile = left.id.startsWith("tile:");
    const rightIsTile = right.id.startsWith("tile:");
    if (leftIsTile !== rightIsTile) {
      return leftIsTile ? -1 : 1;
    }
    return left.id.localeCompare(right.id);
  });
  return primitives;
}

function debugPrimitiveToCommand(primitive: DebugPrimitive): RenderCommand {
  return {
    id: primitive.id,
    kind: "debug",
    page: "debug",
    spriteId: "debug",
    depth: Number.POSITIVE_INFINITY,
    worldX: primitive.screenX,
    worldY: primitive.screenY,
    worldWidth: primitive.screenWidth,
    worldHeight: primitive.screenHeight,
    screenX: primitive.screenX,
    screenY: primitive.screenY,
    screenWidth: primitive.screenWidth,
    screenHeight: primitive.screenHeight,
    color: cloneColor(primitive.color),
    borderOnly: true
  };
}

function buildBatches(commands: ReadonlyArray<RenderCommand>): RenderBatch[] {
  const drawCommands = commands.filter((command) => command.kind !== "debug");
  if (drawCommands.length === 0) {
    return [];
  }

  const batches: RenderBatch[] = [];
  let activeBatch: RenderBatch | null = null;

  for (const command of drawCommands) {
    if (!activeBatch || activeBatch.page !== command.page) {
      activeBatch = {
        page: command.page,
        commandIds: [command.id]
      };
      batches.push(activeBatch);
      continue;
    }

    activeBatch.commandIds.push(command.id);
  }

  return batches;
}

function drawSolidRect(
  pixels: Uint8ClampedArray,
  width: number,
  height: number,
  command: RenderCommand
): void {
  const x0 = Math.max(0, command.screenX);
  const y0 = Math.max(0, command.screenY);
  const x1 = Math.min(width, command.screenX + command.screenWidth);
  const y1 = Math.min(height, command.screenY + command.screenHeight);

  for (let y = y0; y < y1; y += 1) {
    for (let x = x0; x < x1; x += 1) {
      const isBorder =
        x === x0 || x === x1 - 1 || y === y0 || y === y1 - 1;

      if (command.borderOnly && !isBorder) {
        continue;
      }

      const offset = (y * width + x) * 4;
      pixels[offset] = command.color[0];
      pixels[offset + 1] = command.color[1];
      pixels[offset + 2] = command.color[2];
      pixels[offset + 3] = command.color[3];
    }
  }
}

function hashBytes(bytes: Uint8ClampedArray): string {
  let hash = 2166136261;
  for (let i = 0; i < bytes.length; i += 1) {
    hash ^= bytes[i] ?? 0;
    hash = Math.imul(hash, 16777619) >>> 0;
  }
  return hash.toString(16).padStart(8, "0");
}

function baselineRowsToPixels(
  rows: ReadonlyArray<string>,
  palette: Record<string, RgbaColor>,
  width: number,
  height: number
): Uint8ClampedArray {
  if (rows.length !== height) {
    throw new Error(`Baseline row count mismatch: expected ${height}, got ${rows.length}`);
  }

  const pixels = new Uint8ClampedArray(width * height * 4);
  for (let y = 0; y < height; y += 1) {
    const row = rows[y] ?? "";
    if (row.length !== width) {
      throw new Error(`Baseline row width mismatch at y=${y}: expected ${width}, got ${row.length}`);
    }

    for (let x = 0; x < width; x += 1) {
      const swatch = row.charAt(x);
      const color = palette[swatch];
      if (!color) {
        throw new Error(`Unknown baseline palette swatch '${swatch}' at (${x}, ${y})`);
      }
      const offset = (y * width + x) * 4;
      pixels[offset] = color[0];
      pixels[offset + 1] = color[1];
      pixels[offset + 2] = color[2];
      pixels[offset + 3] = color[3];
    }
  }
  return pixels;
}

export function createTextureAtlas(definition: TextureAtlasDefinition): TextureAtlas {
  if (definition.sprites.length === 0) {
    throw new Error("Texture atlas must include at least one sprite");
  }

  const spritesById = new Map<string, TextureAtlasSprite>();
  const spriteIds: string[] = [];

  for (const sprite of definition.sprites) {
    if (sprite.id.length === 0) {
      throw new Error("Atlas sprite id must be non-empty");
    }
    if (sprite.page.length === 0) {
      throw new Error(`Atlas sprite ${sprite.id} has empty page id`);
    }
    assertPositiveInteger(sprite.width, `Atlas sprite ${sprite.id} width`);
    assertPositiveInteger(sprite.height, `Atlas sprite ${sprite.id} height`);
    if (spritesById.has(sprite.id)) {
      throw new Error(`Duplicate atlas sprite id: ${sprite.id}`);
    }

    spritesById.set(sprite.id, {
      id: sprite.id,
      page: sprite.page,
      width: sprite.width,
      height: sprite.height,
      color: cloneColor(sprite.color)
    });
    spriteIds.push(sprite.id);
  }

  return {
    spritesById,
    spriteIds
  };
}

export function createCameraState(camera: CameraState): CameraState {
  assertFiniteNumber(camera.scrollX, "Camera scrollX");
  assertFiniteNumber(camera.scrollY, "Camera scrollY");
  assertFiniteNumber(camera.zoom, "Camera zoom");
  if (camera.zoom <= 0) {
    throw new Error("Camera zoom must be > 0");
  }
  return {
    scrollX: camera.scrollX,
    scrollY: camera.scrollY,
    zoom: camera.zoom
  };
}

export function buildDeterministicScene(input: RenderSceneInput): DeterministicScene {
  assertPositiveInteger(input.viewportWidth, "Viewport width");
  assertPositiveInteger(input.viewportHeight, "Viewport height");
  assertPositiveInteger(input.tileSize, "Tile size");
  assertRectangularTiles(input.tiles);

  const camera = createCameraState(input.camera);
  const rawCommands: RenderCommand[] = [];

  for (let y = 0; y < input.tiles.length; y += 1) {
    const row = input.tiles[y];
    if (!row) {
      continue;
    }
    for (let x = 0; x < row.length; x += 1) {
      const spriteId = row[x];
      if (!spriteId) {
        throw new Error(`Missing sprite id at tile (${x}, ${y})`);
      }
      rawCommands.push(createTileCommand(input.atlas, spriteId, x, y, input.tileSize, camera));
    }
  }

  for (const entity of input.entities) {
    if (entity.id.length === 0) {
      throw new Error("Entity id must be non-empty");
    }
    assertInteger(entity.x, `Entity ${entity.id} x`);
    assertInteger(entity.y, `Entity ${entity.id} y`);
    rawCommands.push(createEntityCommand(input.atlas, entity, input.tileSize, camera));
  }

  rawCommands.sort(compareCommands);
  const visibleCommands = rawCommands.filter((command) =>
    intersectsViewport(command, input.viewportWidth, input.viewportHeight)
  );
  const debugPrimitives = createDebugPrimitives(input, visibleCommands);
  const debugCommands = debugPrimitives.map((primitive) => debugPrimitiveToCommand(primitive));
  const commands = [...visibleCommands, ...debugCommands];
  const batches = buildBatches(commands);

  return {
    commands,
    batches,
    debugPrimitives
  };
}

export function renderSceneToFrame(input: RenderSceneInput): RenderedFrame {
  const scene = buildDeterministicScene(input);
  const width = input.viewportWidth;
  const height = input.viewportHeight;
  const pixels = new Uint8ClampedArray(width * height * 4);

  for (let i = 0; i < width * height; i += 1) {
    const offset = i * 4;
    pixels[offset] = CLEAR_COLOR[0];
    pixels[offset + 1] = CLEAR_COLOR[1];
    pixels[offset + 2] = CLEAR_COLOR[2];
    pixels[offset + 3] = CLEAR_COLOR[3];
  }

  for (const command of scene.commands) {
    drawSolidRect(pixels, width, height, command);
  }

  return {
    width,
    height,
    pixels,
    commands: scene.commands,
    batches: scene.batches,
    debugPrimitives: scene.debugPrimitives
  };
}

export function diffFramePixels(expected: RenderedFrame, actual: RenderedFrame): PixelDiffResult {
  if (expected.width !== actual.width || expected.height !== actual.height) {
    throw new Error(
      `Frame dimension mismatch expected ${expected.width}x${expected.height}, got ${actual.width}x${actual.height}`
    );
  }
  if (expected.pixels.length !== actual.pixels.length) {
    throw new Error("Frame pixel buffer length mismatch");
  }

  let changedPixels = 0;
  for (let i = 0; i < expected.pixels.length; i += 4) {
    if (
      expected.pixels[i] !== actual.pixels[i] ||
      expected.pixels[i + 1] !== actual.pixels[i + 1] ||
      expected.pixels[i + 2] !== actual.pixels[i + 2] ||
      expected.pixels[i + 3] !== actual.pixels[i + 3]
    ) {
      changedPixels += 1;
    }
  }
  return { changedPixels };
}

export function runVisualSnapshotFixture(fixture: VisualSnapshotFixture): VisualSnapshotRunResult {
  if (fixture.schemaVersion !== "renderer-snapshot.v0") {
    throw new Error(`Unsupported visual fixture schema ${fixture.schemaVersion}`);
  }

  const atlas = createTextureAtlas(fixture.atlas);
  const scenarioResults = fixture.scenarios.map((scenario) => {
    const camera = createCameraState(scenario.camera);
    const frameInput: RenderSceneInput = {
      atlas,
      viewportWidth: scenario.viewport.width,
      viewportHeight: scenario.viewport.height,
      tileSize: scenario.tileSize,
      camera,
      tiles: scenario.tiles,
      entities: scenario.entities
    };
    if (scenario.debug) {
      frameInput.debug = scenario.debug;
    }
    const frame = renderSceneToFrame(frameInput);

    const expectedPixels = baselineRowsToPixels(
      scenario.baselineRows,
      fixture.palette,
      scenario.viewport.width,
      scenario.viewport.height
    );
    const expectedFrame: RenderedFrame = {
      width: frame.width,
      height: frame.height,
      pixels: expectedPixels,
      commands: [],
      batches: [],
      debugPrimitives: []
    };

    const changedPixels = diffFramePixels(expectedFrame, frame).changedPixels;
    const maxDiffPixels = scenario.maxDiffPixels ?? fixture.defaultMaxDiffPixels;
    const passed = changedPixels <= maxDiffPixels;

    return {
      id: scenario.id,
      passed,
      changedPixels,
      maxDiffPixels,
      actualHash: hashBytes(frame.pixels)
    } satisfies VisualSnapshotScenarioResult;
  });

  return {
    fixtureId: fixture.fixtureId,
    passed: scenarioResults.every((scenario) => scenario.passed),
    scenarioResults
  };
}

export function runFrameProfile(input: RenderSceneInput, options: FrameProfileOptions = {}): FrameProfileResult {
  const warmupFrames = options.warmupFrames ?? 30;
  const measuredFrames = options.measuredFrames ?? 240;
  const targetFps = options.targetFps ?? 60;

  assertPositiveInteger(warmupFrames, "Profile warmup frames");
  assertPositiveInteger(measuredFrames, "Profile measured frames");
  assertFiniteNumber(targetFps, "Profile target FPS");
  if (targetFps <= 0) {
    throw new Error("Profile target FPS must be > 0");
  }

  let totalMeasuredMs = 0;
  let camera = createCameraState(input.camera);

  for (let frameIndex = 0; frameIndex < warmupFrames + measuredFrames; frameIndex += 1) {
    if (options.script) {
      camera = createCameraState(options.script(frameIndex, camera));
    }

    const start = performance.now();
    renderSceneToFrame({
      ...input,
      camera
    });
    const elapsedMs = performance.now() - start;

    if (frameIndex >= warmupFrames) {
      totalMeasuredMs += elapsedMs;
    }
  }

  const averageFrameMs = totalMeasuredMs / measuredFrames;
  const measuredFps = averageFrameMs > 0 ? 1000 / averageFrameMs : Number.POSITIVE_INFINITY;

  return {
    warmupFrames,
    measuredFrames,
    targetFps,
    averageFrameMs,
    measuredFps,
    passed: measuredFps >= targetFps
  };
}
