import { AUDIO_TRIGGER_SMOKE } from "../src/index";

describe("audio-webaudio scaffold", () => {
  it("defines a deterministic trigger mapping placeholder", () => {
    expect(AUDIO_TRIGGER_SMOKE).toEqual({
      event: "patient.treated",
      cue: "sfx/treat-success"
    });
  });
});
