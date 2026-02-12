import { buildDeterministicScene, createCameraState, createTextureAtlas } from "../src/index";

describe("atlas and batching", () => {
  it("groups contiguous commands by atlas page for deterministic sprite batches", () => {
    const atlas = createTextureAtlas({
      sprites: [
        { id: "ground", page: "terrain", width: 2, height: 2, color: [66, 142, 76, 255] },
        { id: "nurse", page: "actors", width: 2, height: 2, color: [220, 140, 80, 255] },
        { id: "patient", page: "actors", width: 2, height: 2, color: [64, 104, 208, 255] },
        { id: "monitor", page: "props", width: 2, height: 2, color: [180, 180, 180, 255] }
      ]
    });

    const scene = buildDeterministicScene({
      atlas,
      viewportWidth: 8,
      viewportHeight: 8,
      tileSize: 2,
      camera: createCameraState({ scrollX: 0, scrollY: 0, zoom: 1 }),
      tiles: [
        ["ground", "ground", "ground", "ground"],
        ["ground", "ground", "ground", "ground"],
        ["ground", "ground", "ground", "ground"],
        ["ground", "ground", "ground", "ground"]
      ],
      entities: [
        { id: "entity-a", spriteId: "nurse", x: 1, y: 1 },
        { id: "entity-b", spriteId: "patient", x: 2, y: 1 },
        { id: "entity-c", spriteId: "monitor", x: 3, y: 1 }
      ]
    });

    expect(scene.batches.map((batch) => [batch.page, batch.commandIds.length])).toEqual([
      ["terrain", 12],
      ["actors", 2],
      ["props", 1],
      ["terrain", 4]
    ]);
  });
});
