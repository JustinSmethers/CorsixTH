import { AUDIO_TRIGGER_CONTRACT } from "../src/index";

describe("audio-webaudio scaffold", () => {
    it("defines deterministic trigger mappings for patient cues", () => {
        expect(AUDIO_TRIGGER_CONTRACT).toMatchObject({
            "patient.admitted": "patient.admit",
            "patient.treated.success": "patient.treat.success",
            "patient.treated.empty": "patient.treat.empty"
        });
    });
});
