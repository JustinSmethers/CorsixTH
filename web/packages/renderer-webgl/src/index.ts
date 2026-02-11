export interface RenderFrame {
  sceneId: string;
  deterministicOrder: string[];
}

export function buildDeterministicFrame(sceneId: string, entities: string[]): RenderFrame {
  return {
    sceneId,
    deterministicOrder: [...entities].sort((a, b) => a.localeCompare(b))
  };
}
