import {
  buildDeterministicScene,
  createCameraState,
  createTextureAtlas,
  renderSceneToFrame,
  type RenderSceneInput
} from "../src/index";

const atlas = createTextureAtlas({
  sprites: [
    { id: "grass", page: "terrain", width: 2, height: 2, color: [66, 142, 76, 255] },
    { id: "water", page: "terrain", width: 2, height: 2, color: [57, 106, 177, 255] },
    { id: "doctor", page: "entities", width: 2, height: 2, color: [200, 64, 64, 255] },
    { id: "patient", page: "entities", width: 2, height: 2, color: [64, 104, 208, 255] }
  ]
});

const baseScene: Omit<RenderSceneInput, "camera"> = {
  atlas,
  viewportWidth: 8,
  viewportHeight: 8,
  tileSize: 2,
  tiles: [
    ["grass", "grass", "grass", "grass"],
    ["grass", "water", "water", "grass"],
    ["grass", "water", "water", "grass"],
    ["grass", "grass", "grass", "grass"]
  ],
  entities: [
    { id: "entity-z", spriteId: "patient", x: 2, y: 1 },
    { id: "entity-a", spriteId: "doctor", x: 1, y: 1 }
  ]
};

function pixelAt(frame: ReturnType<typeof renderSceneToFrame>, x: number, y: number): [number, number, number, number] {
  const base = (y * frame.width + x) * 4;
  return [
    frame.pixels[base] ?? 0,
    frame.pixels[base + 1] ?? 0,
    frame.pixels[base + 2] ?? 0,
    frame.pixels[base + 3] ?? 0
  ];
}

describe("renderer scene build", () => {
  it("builds deterministic draw order with stable depth sorting", () => {
    const scene = buildDeterministicScene({
      ...baseScene,
      camera: createCameraState({ scrollX: 0, scrollY: 0, zoom: 1 })
    });

    const spriteCommands = scene.commands.filter((command) => command.kind === "sprite");
    expect(spriteCommands.map((command) => command.id)).toEqual(["entity-a", "entity-z"]);

    const depthValues = scene.commands.map((command) => command.depth);
    const sortedDepth = [...depthValues].sort((left, right) => left - right);
    expect(depthValues).toEqual(sortedDepth);
  });

  it("applies camera scroll and zoom deterministically", () => {
    const frame = renderSceneToFrame({
      ...baseScene,
      camera: createCameraState({ scrollX: 2, scrollY: 2, zoom: 1 })
    });

    expect(pixelAt(frame, 0, 0)).toEqual([200, 64, 64, 255]);
    expect(pixelAt(frame, 2, 0)).toEqual([64, 104, 208, 255]);
    expect(pixelAt(frame, 7, 7)).toEqual([0, 0, 0, 255]);
  });
});
