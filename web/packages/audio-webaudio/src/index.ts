export interface AudioTrigger {
  event: string;
  cue: string;
}

export const AUDIO_TRIGGER_SMOKE: AudioTrigger = {
  event: "patient.treated",
  cue: "sfx/treat-success"
};
