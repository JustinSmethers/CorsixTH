export interface SaveEnvelopeV0 {
  version: "0";
  stateHash: string;
}

export function createSaveEnvelope(stateHash: string): SaveEnvelopeV0 {
  return {
    version: "0",
    stateHash
  };
}
