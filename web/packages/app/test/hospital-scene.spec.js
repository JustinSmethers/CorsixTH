import { createHospitalSceneEntities } from "../src/app-shell";

function scenePatient(diseaseId, id = 1, movement = null) {
    return { id, diseaseId, position: { x: 5, y: 6 }, movement };
}

describe("native hospital scene integration", () => {
    it("uses original visual disease appearances including imported invisibility", () => {
        const patients = ["cranial-pressure", "itchy-feet", "baldness", "slack-tongue", "transparency", "hairyitis", "king-complex", "alien-dna"].map((disease) => scenePatient(disease));
        const state = { tick: 7, entities: { staff: [], waitingPatients: patients } };
        const before = structuredClone(state);
        const entities = createHospitalSceneEntities(state);
        expect(entities.map((entity) => entity.humanoidType)).toEqual([
            "Standard Male Patient", "Invisible Patient", "Slack Male Patient", "Slack Male Patient",
            "Transparent Male Patient", "Chewbacca Patient", "Elvis Patient", "Alien Male Patient"
        ]);
        expect(entities[0].layers[0]).toBeGreaterThanOrEqual(12);
        expect(entities[1].layers).toEqual({ 0: 2, 1: 0, 2: 4, 3: 0, 4: 0 });
        expect(entities[2].layers).toEqual({ 0: 12 });
        expect(state).toEqual(before);
    });
    it("faces walking patients along their route and keeps staff and patient IDs distinct", () => {
        const state = {
            tick: 12,
            entities: {
                staff: [{ id: 1, role: "nurse", position: { x: 5, y: 6 } }],
                waitingPatients: [scenePatient("mild-cold", 1, {
                    pathIndex: 0, path: [{ x: 5, y: 6 }, { x: 4, y: 6 }]
                }), scenePatient("mild-cold", 2)]
            }
        };
        const entities = createHospitalSceneEntities(state);
        expect(entities[0]).toMatchObject({ id: "staff:1", humanoidType: "nurse", animationState: "idle" });
        expect(entities[1]).toMatchObject({ id: "patient:1", direction: "west", animationState: "walk", frameStep: 12 });
        expect(entities[2]).toMatchObject({ humanoidType: "Standard Female Patient", animationState: "idle" });
    });
});
