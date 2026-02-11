export interface AssetValidationResult {
  path: string;
  valid: boolean;
}

export function validateAssetPath(path: string): AssetValidationResult {
  return { path, valid: path.length > 0 };
}
