import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const fixtureRoot = new URL("../apps/game/e2e/fixtures/", import.meta.url);

function writeFixtureSet(name, includeExecutable) {
  const root = fixtureRoot.pathname;
  const base = join(root, name);
  for (const directory of ["DATA", "LEVELS", "QDATA"]) {
    mkdirSync(join(base, directory), { recursive: true });
    writeFileSync(join(base, directory, "PLACEHOLDER.DAT"), `${directory} fixture\n`);
  }
  writeFileSync(join(base, "DATA", "MPALETTE.DAT"), syntheticPaletteBytes());
  writeFileSync(join(base, "DATA", "VSPR-0.TAB"), syntheticSpriteTableBytes());
  writeFileSync(join(base, "DATA", "VSPR-0.DAT"), syntheticSpriteDataBytes());
  writeFileSync(join(base, "DATA", "VBLK-0.TAB"), syntheticBlockSpriteTableBytes());
  writeFileSync(join(base, "DATA", "VBLK-0.DAT"), syntheticSpriteDataBytes());
  writeFileSync(join(base, "DATA", "LANG-0.DAT"), syntheticLanguageBytes());
  writeFileSync(join(base, "DATA", "PANEL02V.TAB"), syntheticQDataSpriteTableBytes());
  writeFileSync(join(base, "DATA", "PANEL02V.DAT"), syntheticSpriteDataBytes());
  writeFileSync(join(base, "QDATA", "FONT00V.TAB"), syntheticQDataSpriteTableBytes());
  writeFileSync(join(base, "QDATA", "FONT00V.DAT"), syntheticSpriteDataBytes());
  const animationFiles = syntheticAnimationBytes();
  writeFileSync(join(base, "DATA", "VSTART-1.ANI"), animationFiles.start);
  writeFileSync(join(base, "DATA", "VFRA-1.ANI"), animationFiles.frame);
  writeFileSync(join(base, "DATA", "VLIST-1.ANI"), animationFiles.list);
  writeFileSync(join(base, "DATA", "VELE-1.ANI"), animationFiles.element);
  writeFileSync(join(base, "LEVELS", "EXAMPLE.MAP"), syntheticMapBytes());
  writeFileSync(join(base, "LEVELS", "SECOND.MAP"), syntheticMapBytes({
    camera: { x: 79, y: 81 },
    heliport: { x: 72, y: 86 },
  }));
  writeFileSync(join(base, "HOSPITAL.CFG"), "INSTALL_PATH=C:\\HOSPITAL\nLANGUAGE=ENG\n");
  if (includeExecutable) {
    writeFileSync(join(base, "HOSPITAL.EXE"), "synthetic browser-port fixture\n");
  }
}

function syntheticPaletteBytes() {
  const bytes = new Uint8Array(256 * 3);
  bytes[1 * 3] = 63;
  bytes[2 * 3 + 1] = 63;
  bytes[255 * 3] = 63;
  bytes[255 * 3 + 2] = 63;
  return bytes;
}

function syntheticSpriteTableBytes() {
  return new Uint8Array([0, 0, 0, 0, 4, 2]);
}

function syntheticBlockSpriteTableBytes() {
  return new Uint8Array([
    0, 0, 0, 0, 0, 0,
    0, 0, 0, 0, 4, 2,
    0, 0, 0, 0, 4, 2,
  ]);
}

function syntheticQDataSpriteTableBytes() {
  return new Uint8Array([
    0, 0, 0, 0, 4, 2,
    0, 0, 0, 0, 0, 0,
  ]);
}

function syntheticSpriteDataBytes() {
  return new Uint8Array([2, 1, 2, 0, 4, 2, 1, 2, 1]);
}

function syntheticLanguageBytes() {
  const entries = Array.from({ length: 2096 }, (_entry, index) => `Lang ${index}`);
  entries[0] = "Nurse";
  entries[1] = "Doctor";
  entries[2] = "Handyman";
  entries[3] = "Receptionist";
  entries[9] = "Inflator Machine";
  entries[13] = "Cardiogram";
  entries[24] = "Cast Remover";
  entries[101] = "Bloaty Head";
  entries[104] = "Itchy Feet";
  entries[112] = "Sleeping Illness";
  entries[115] = "Uncommon Cold";
  entries[453] = "GP's Office";
  entries[455] = "Ward";
  entries[457] = "Pharmacy";
  entries[463] = "Inflation Room";
  entries[2487] = "Awaiting your decision";
  entries[2488] = "Queuing for %s";
  entries[2489] = "On my way to %s";
  entries[2490] = "Cured!";
  entries[2492] = "Sent Home";
  entries[2494] = "Diagnosed: %s";
  return new TextEncoder().encode(`\0\0${entries.join("\0")}\0`);
}

function syntheticAnimationBytes() {
  return {
    start: new Uint8Array([0, 0, 0, 0]),
    frame: new Uint8Array([0, 0, 0, 0, 0, 0, 0, 0, 0, 0]),
    list: new Uint8Array([0, 0, 0xff, 0xff]),
    element: new Uint8Array([0, 0, 141, 186, 0, 0]),
  };
}

writeFixtureSet("phase8-valid", true);
writeFixtureSet("phase8-missing-exe", false);
writeScenarioFixtureSet();
writeScenarioRoomUnlockFixtureSet();
writeScenarioObjectAvailabilityFixtureSet();
writeScenarioRoomCostFixtureSet();
writeScenarioObjectiveCriteriaFixtureSet();
writeScenarioNoCuresObjectiveFixtureSet();
writeScenarioAbductionFixtureSet();
writeScenarioAutopsyFixtureSet();
writeScenarioTownEconomyFixtureSet();
writeScenarioOpponentFixtureSet();
writeScenarioEmergencyControlFixtureSet();
writeScenarioQuakeControlFixtureSet();
writeScenarioStaffMarketFixtureSet();
writeScenarioPopulationScheduleFixtureSet();
writeScenarioEpidemicSpreadFixtureSet();
writeScenarioVaccinationCostFixtureSet();
writeScenarioEpidemicCompensationFixtureSet();
writeScenarioPatientBehaviorFixtureSet();
writeScenarioRatHoleCleanupFixtureSet();
writeScenarioAwardFixtureSet();
writeScenarioScoreAwardFixtureSet();
writeScenarioCuresAwardFixtureSet();
writeScenarioDeathsAwardFixtureSet();
writeScenarioTrophyCashAwardFixtureSet();
writeScenarioHospitalValueAwardFixtureSet();
writeScenarioReputationAwardFixtureSet();
writeScenarioLandCostFixtureSet();
writeScenarioResearchFloorFixtureSet();
writeScenarioResearchIncrementFixtureSet();
writeScenarioResearchCostGrowthFixtureSet();
writeScenarioExpertiseStartPriceFixtureSet();
writeScenarioMachineStrengthFixtureSet();
writeScenarioVisualHoldFixtureSet();
writeScenarioVisualHoldPeepCountFixtureSet();
writeScenarioVisualsAvailableFixtureSet();
writeScenarioObjectDiseaseGateFixtureSet();
writeScenarioContagiousReducerFixtureSet();
writeScenarioContagiousRateFixtureSet();
writeScenarioAllocationDelayFixtureSet();
writeScenarioAllocationWeightsFixtureSet();
writeScenarioRoutingDistanceFixtureSet();
writeScenarioStaffModifyFixtureSet();
writeScenarioStaffWorkLightFixtureSet();
writeScenarioStaffResignFixtureSet();
writeScenarioStaffFatigueThresholdFixtureSet();
writeScenarioStaffRestStandingFixtureSet();
writeScenarioStaffRecoveryFactorFixtureSet();
writeScenarioStaffWagesFixtureSet();
writeScenarioStaffRoomRestFixtureSet();
writeScenarioTrainingValuesFixtureSet();
writeScenarioTrainingPromotionFixtureSet();
writeScenarioTrainingThresholdFixtureSet();
writeScenarioStaffSpecialtyFixtureSet();
writeScenarioSkilledSalaryFixtureSet();
writeScenarioCustomSalaryBandsFixtureSet();
writeScenarioSalaryThresholdFixtureSet();
writeScenarioSalaryTooLowFixtureSet();
writeScenarioCleanlinessAwardFixtureSet();
writeScenarioPeepHappinessAwardFixtureSet();
writeScenarioWaitingTimesAwardFixtureSet();
writeScenarioStaffHappinessAwardFixtureSet();
writeScenarioWellKeptTechAwardFixtureSet();
writeScenarioNewTechAwardFixtureSet();
writeScenarioEmergencyAwardFixtureSet();
writeScenarioPopulationAwardFixtureSet();
writeScenarioCuresVDeathsAwardFixtureSet();
writeScenarioCansOfCokeAwardFixtureSet();
writeScenarioRatAwardFixtureSet();
writeScenarioPlantAwardFixtureSet();
writeScenarioMayorAwardFixtureSet();

function writeScenarioFixtureSet() {
  writeFixtureSet("phase8-scenario-valid", true);
  const base = join(fixtureRoot.pathname, "phase8-scenario-valid");
  writeFileSync(join(base, "LEVELS", "LEVEL.L1"), syntheticMapBytes());
  writeFileSync(join(base, "LEVELS", "LEVEL.L2"), syntheticMapBytes({
    camera: { x: 79, y: 81 },
    heliport: { x: 72, y: 86 },
  }));
  writeFileSync(join(base, "LEVELS", "FULL01.SAM"), scenarioBytes({
    title: "Scenario Level One",
    reputation: 300,
    balance: 1000,
    treatedPercentage: 40,
    cures: 10,
    hospitalValue: 55000,
    bankruptcy: -20000,
    reputationFailure: 200,
    deaths: 50,
  }));
  writeFileSync(join(base, "LEVELS", "FULL02.SAM"), scenarioBytes({
    title: "Scenario Level Two",
    reputation: 450,
    balance: 2500,
    treatedPercentage: 50,
    cures: 12,
    hospitalValue: 70000,
    bankruptcy: -25000,
    reputationFailure: 300,
    deaths: 40,
    expandedDiseases: true,
  }));
}

function writeScenarioRoomUnlockFixtureSet() {
  writeFixtureSet("phase8-scenario-room-unlock", true);
  const base = join(fixtureRoot.pathname, "phase8-scenario-room-unlock");
  writeFileSync(join(base, "LEVELS", "LEVEL.L1"), syntheticMapBytes());
  writeFileSync(join(base, "LEVELS", "LEVEL.L2"), syntheticMapBytes({
    camera: { x: 79, y: 81 },
    heliport: { x: 72, y: 86 },
  }));
  writeFileSync(join(base, "LEVELS", "FULL01.SAM"), scenarioBytes({
    title: "Scenario Room Unlock",
    reputation: 300,
    balance: 1000,
    treatedPercentage: 40,
    cures: 10,
    hospitalValue: 55000,
    bankruptcy: -20000,
    reputationFailure: 200,
    deaths: 50,
    specialistStartAvailable: false,
    specialistWhenAvailable: 1,
    disasterLaunch: 999,
  }));
  writeFileSync(join(base, "LEVELS", "FULL02.SAM"), scenarioBytes({
    title: "Scenario Room Unlock Two",
    reputation: 450,
    balance: 2500,
    treatedPercentage: 50,
    cures: 12,
    hospitalValue: 70000,
    bankruptcy: -25000,
    reputationFailure: 300,
    deaths: 40,
    expandedDiseases: true,
    specialistStartAvailable: false,
    specialistWhenAvailable: 1,
    disasterLaunch: 999,
  }));
}

function writeScenarioObjectAvailabilityFixtureSet() {
  writeFixtureSet("phase8-scenario-object-availability", true);
  const base = join(fixtureRoot.pathname, "phase8-scenario-object-availability");
  writeFileSync(join(base, "LEVELS", "LEVEL.L1"), syntheticMapBytes());
  writeFileSync(join(base, "LEVELS", "LEVEL.L2"), syntheticMapBytes({
    camera: { x: 79, y: 81 },
    heliport: { x: 72, y: 86 },
  }));
  const options = {
    objectLines: [
      "#objects[9].StartAvail.WhenAvail.StartStrength.AvailableForLevel 1 0 12 0 9 Inflator Machine",
      "#objects[13].StartAvail.WhenAvail.StartStrength.AvailableForLevel 1 0 13 1 13 Cardiogram",
    ],
    minimumAbductionYears: 4,
    abductionsPerYear: 0,
    disasterLaunch: 999,
  };
  writeFileSync(join(base, "LEVELS", "FULL01.SAM"), scenarioBytes({
    title: "Scenario Object Availability",
    reputation: 300,
    balance: 1000,
    treatedPercentage: 40,
    cures: 10,
    hospitalValue: 55000,
    bankruptcy: -20000,
    reputationFailure: 200,
    deaths: 50,
    ...options,
  }));
  writeFileSync(join(base, "LEVELS", "FULL02.SAM"), scenarioBytes({
    title: "Scenario Object Availability Two",
    reputation: 450,
    balance: 2500,
    treatedPercentage: 50,
    cures: 12,
    hospitalValue: 70000,
    bankruptcy: -25000,
    reputationFailure: 300,
    deaths: 40,
    expandedDiseases: true,
    ...options,
  }));
}

function writeScenarioRoomCostFixtureSet() {
  writeFixtureSet("phase8-scenario-room-costs", true);
  const base = join(fixtureRoot.pathname, "phase8-scenario-room-costs");
  writeFileSync(join(base, "LEVELS", "LEVEL.L1"), syntheticMapBytes());
  writeFileSync(join(base, "LEVELS", "LEVEL.L2"), syntheticMapBytes({
    camera: { x: 79, y: 81 },
    heliport: { x: 72, y: 86 },
  }));
  const options = {
    roomLines: [
      "#rooms[7].Cost 1111 GP_OFFICE",
      "#rooms[9].Cost 1700 WARD",
      "#rooms[11].Cost 500 PHARMACY",
      "#rooms[17].Cost 333 INFLATOR",
    ],
    objectLines: [
      "#objects[9].StartCost.StartAvail.WhenAvail.StartStrength.AvailableForLevel 222 1 0 12 1 9 Inflator Machine",
      "#objects[13].StartAvail.WhenAvail.AvailableForLevel 0 0 1 13 Cardiogram",
    ],
    minimumAbductionYears: 4,
    abductionsPerYear: 0,
    disasterLaunch: 999,
  };
  writeFileSync(join(base, "LEVELS", "FULL01.SAM"), scenarioBytes({
    title: "Scenario Room Costs",
    reputation: 300,
    balance: 1000,
    treatedPercentage: 40,
    cures: 10,
    hospitalValue: 55000,
    bankruptcy: -20000,
    reputationFailure: 200,
    deaths: 50,
    ...options,
  }));
  writeFileSync(join(base, "LEVELS", "FULL02.SAM"), scenarioBytes({
    title: "Scenario Room Costs Two",
    reputation: 450,
    balance: 2500,
    treatedPercentage: 50,
    cures: 12,
    hospitalValue: 70000,
    bankruptcy: -25000,
    reputationFailure: 300,
    deaths: 40,
    expandedDiseases: true,
    ...options,
  }));
}

function writeScenarioObjectiveCriteriaFixtureSet() {
  writeFixtureSet("phase8-scenario-objective-criteria", true);
  const base = join(fixtureRoot.pathname, "phase8-scenario-objective-criteria");
  writeFileSync(join(base, "LEVELS", "LEVEL.L1"), syntheticMapBytes());
  writeFileSync(join(base, "LEVELS", "LEVEL.L2"), syntheticMapBytes({
    camera: { x: 79, y: 81 },
    heliport: { x: 72, y: 86 },
  }));
  const options = {
    winCriteriaLines: [
      "#win_criteria[0].Criteria.MaxMin.Value.Group.Bound 1 1 333 1 0",
      "#win_criteria[1].Criteria.MaxMin.Value.Group.Bound 2 1 1234 1 0",
      "#win_criteria[2].Criteria.MaxMin.Value.Group.Bound 3 1 75 1 0",
      "#win_criteria[3].Criteria.MaxMin.Value.Group.Bound 4 1 2 1 0",
      "#win_criteria[4].Criteria.MaxMin.Value.Group.Bound 6 1 22222 1 0",
    ],
    loseCriteriaLines: [
      "#lose_criteria[0].Criteria.MaxMin.Value.Group.Bound 2 0 -123 2 0",
      "#lose_criteria[1].Criteria.MaxMin.Value.Group.Bound 1 0 111 1 0",
      "#lose_criteria[2].Criteria.MaxMin.Value.Group.Bound 5 1 0 3 0",
    ],
    minimumAbductionYears: 4,
    abductionsPerYear: 0,
    disasterLaunch: 999,
  };
  writeFileSync(join(base, "LEVELS", "FULL01.SAM"), scenarioBytes({
    title: "Scenario Objective Criteria",
    reputation: 300,
    balance: 1000,
    treatedPercentage: 40,
    cures: 10,
    hospitalValue: 55000,
    bankruptcy: -20000,
    reputationFailure: 200,
    deaths: 50,
    ...options,
  }));
  writeFileSync(join(base, "LEVELS", "FULL02.SAM"), scenarioBytes({
    title: "Scenario Objective Criteria Two",
    reputation: 450,
    balance: 2500,
    treatedPercentage: 50,
    cures: 12,
    hospitalValue: 70000,
    bankruptcy: -25000,
    reputationFailure: 300,
    deaths: 40,
    expandedDiseases: true,
    ...options,
  }));
}

function writeScenarioNoCuresObjectiveFixtureSet() {
  writeFixtureSet("phase8-scenario-no-cures-objective", true);
  const base = join(fixtureRoot.pathname, "phase8-scenario-no-cures-objective");
  writeFileSync(join(base, "LEVELS", "LEVEL.L1"), syntheticMapBytes());
  writeFileSync(join(base, "LEVELS", "LEVEL.L2"), syntheticMapBytes({
    camera: { x: 79, y: 81 },
    heliport: { x: 72, y: 86 },
  }));
  const options = {
    winCriteriaLines: [
      "#win_criteria[0].Criteria.MaxMin.Value.Group.Bound 1 1 1 1 0",
      "#win_criteria[1].Criteria.MaxMin.Value.Group.Bound 2 1 39000 1 0",
      "#win_criteria[2].Criteria.MaxMin.Value.Group.Bound 6 1 1000 1 0",
    ],
    loseCriteriaLines: [
      "#lose_criteria[0].Criteria.MaxMin.Value.Group.Bound 2 0 -20000 2 0",
      "#lose_criteria[1].Criteria.MaxMin.Value.Group.Bound 1 0 0 1 0",
      "#lose_criteria[2].Criteria.MaxMin.Value.Group.Bound 5 1 50 3 0",
    ],
    opponentLines: [
      "#computer[0].Skill.StaffLevels.Luck.Speed.Comfort.GuessAt.Playing 3 4 3 30 7 90 1 ORAC",
      "#computer[1].Skill.StaffLevels.Luck.Speed.Comfort.GuessAt.Playing 2 5 2 50 5 75 1 COLOSSUS",
    ],
    awardCures: 0,
    awardReputation: 0,
    awardHospitalValue: 0,
    disasterLaunch: 999,
  };
  writeFileSync(join(base, "LEVELS", "FULL01.SAM"), scenarioBytes({
    title: "Scenario No Cures Objective",
    reputation: 1,
    balance: 39000,
    treatedPercentage: 0,
    cures: 10,
    hospitalValue: 1000,
    bankruptcy: -20000,
    reputationFailure: 0,
    deaths: 50,
    ...options,
  }));
  writeFileSync(join(base, "LEVELS", "FULL02.SAM"), scenarioBytes({
    title: "Scenario No Cures Objective Two",
    reputation: 1,
    balance: 39000,
    treatedPercentage: 0,
    cures: 12,
    hospitalValue: 1000,
    bankruptcy: -20000,
    reputationFailure: 0,
    deaths: 50,
    expandedDiseases: true,
    ...options,
  }));
}

function writeScenarioAbductionFixtureSet() {
  writeFixtureSet("phase8-scenario-abduction", true);
  const base = join(fixtureRoot.pathname, "phase8-scenario-abduction");
  writeFileSync(join(base, "LEVELS", "LEVEL.L1"), syntheticMapBytes());
  writeFileSync(join(base, "LEVELS", "LEVEL.L2"), syntheticMapBytes({
    camera: { x: 79, y: 81 },
    heliport: { x: 72, y: 86 },
  }));
  writeFileSync(join(base, "LEVELS", "FULL01.SAM"), scenarioBytes({
    title: "Scenario Abduction",
    reputation: 300,
    balance: 1000,
    treatedPercentage: 40,
    cures: 10,
    hospitalValue: 55000,
    bankruptcy: -20000,
    reputationFailure: 200,
    deaths: 50,
    minimumAbductionYears: 0,
    abductionsPerYear: 768,
    disasterLaunch: 999,
  }));
  writeFileSync(join(base, "LEVELS", "FULL02.SAM"), scenarioBytes({
    title: "Scenario Abduction Two",
    reputation: 450,
    balance: 2500,
    treatedPercentage: 50,
    cures: 12,
    hospitalValue: 70000,
    bankruptcy: -25000,
    reputationFailure: 300,
    deaths: 40,
    expandedDiseases: true,
    minimumAbductionYears: 0,
    abductionsPerYear: 768,
    disasterLaunch: 999,
  }));
}

function writeScenarioAutopsyFixtureSet() {
  writeFixtureSet("phase8-scenario-autopsy", true);
  const base = join(fixtureRoot.pathname, "phase8-scenario-autopsy");
  writeFileSync(join(base, "LEVELS", "LEVEL.L1"), syntheticMapBytes());
  writeFileSync(join(base, "LEVELS", "LEVEL.L2"), syntheticMapBytes({
    camera: { x: 79, y: 81 },
    heliport: { x: 72, y: 86 },
  }));
  writeFileSync(join(base, "LEVELS", "FULL01.SAM"), scenarioBytes({
    title: "Scenario Autopsy",
    reputation: 300,
    balance: 1000,
    treatedPercentage: 40,
    cures: 10,
    hospitalValue: 55000,
    bankruptcy: -20000,
    reputationFailure: 200,
    deaths: 50,
    researchPointsDivisor: 20,
    autopsyResearchPercent: 25,
    autopsyReputationHitPercent: 10,
    minimumAbductionYears: 4,
    abductionsPerYear: 0,
    disasterLaunch: 999,
  }));
  writeFileSync(join(base, "LEVELS", "FULL02.SAM"), scenarioBytes({
    title: "Scenario Autopsy Two",
    reputation: 450,
    balance: 2500,
    treatedPercentage: 50,
    cures: 12,
    hospitalValue: 70000,
    bankruptcy: -25000,
    reputationFailure: 300,
    deaths: 40,
    expandedDiseases: true,
    researchPointsDivisor: 20,
    autopsyResearchPercent: 25,
    autopsyReputationHitPercent: 10,
    minimumAbductionYears: 4,
    abductionsPerYear: 0,
    disasterLaunch: 999,
  }));
}

function writeScenarioTownEconomyFixtureSet() {
  writeFixtureSet("phase8-scenario-town-economy", true);
  const base = join(fixtureRoot.pathname, "phase8-scenario-town-economy");
  writeFileSync(join(base, "LEVELS", "LEVEL.L1"), syntheticMapBytes());
  writeFileSync(join(base, "LEVELS", "LEVEL.L2"), syntheticMapBytes({
    camera: { x: 79, y: 81 },
    heliport: { x: 72, y: 86 },
  }));
  const options = {
    startCash: 12345,
    illnessRate: 5,
    interestRate: 300,
    minimumAbductionYears: 4,
    abductionsPerYear: 0,
    disasterLaunch: 999,
  };
  writeFileSync(join(base, "LEVELS", "FULL01.SAM"), scenarioBytes({
    title: "Scenario Town Economy",
    reputation: 300,
    balance: 1000,
    treatedPercentage: 40,
    cures: 10,
    hospitalValue: 55000,
    bankruptcy: -20000,
    reputationFailure: 200,
    deaths: 50,
    ...options,
  }));
  writeFileSync(join(base, "LEVELS", "FULL02.SAM"), scenarioBytes({
    title: "Scenario Town Economy Two",
    reputation: 450,
    balance: 2500,
    treatedPercentage: 50,
    cures: 12,
    hospitalValue: 70000,
    bankruptcy: -25000,
    reputationFailure: 300,
    deaths: 40,
    expandedDiseases: true,
    ...options,
  }));
}

function writeScenarioOpponentFixtureSet() {
  writeFixtureSet("phase8-scenario-opponents", true);
  const base = join(fixtureRoot.pathname, "phase8-scenario-opponents");
  writeFileSync(join(base, "LEVELS", "LEVEL.L1"), syntheticMapBytes());
  writeFileSync(join(base, "LEVELS", "LEVEL.L2"), syntheticMapBytes({
    camera: { x: 79, y: 81 },
    heliport: { x: 72, y: 86 },
  }));
  const options = {
    opponentLines: [
      "#computer[0].Skill.StaffLevels.Luck.Speed.Comfort.GuessAt.Playing 1 2 1 20 3 60 1 ASCLEPIUS",
      "#computer[1].Skill.StaffLevels.Luck.Speed.Comfort.GuessAt.Playing 5 6 4 70 9 95 1 GALEN",
      "#computer[2].Skill.StaffLevels.Luck.Speed.Comfort.GuessAt.Playing 9 9 9 99 9 99 0 DORMANT",
    ],
    minimumAbductionYears: 4,
    abductionsPerYear: 0,
    disasterLaunch: 999,
  };
  writeFileSync(join(base, "LEVELS", "FULL01.SAM"), scenarioBytes({
    title: "Scenario Opponents",
    reputation: 300,
    balance: 1000,
    treatedPercentage: 40,
    cures: 10,
    hospitalValue: 55000,
    bankruptcy: -20000,
    reputationFailure: 200,
    deaths: 50,
    ...options,
  }));
  writeFileSync(join(base, "LEVELS", "FULL02.SAM"), scenarioBytes({
    title: "Scenario Opponents Two",
    reputation: 450,
    balance: 2500,
    treatedPercentage: 50,
    cures: 12,
    hospitalValue: 70000,
    bankruptcy: -25000,
    reputationFailure: 300,
    deaths: 40,
    expandedDiseases: true,
    ...options,
  }));
}

function writeScenarioEmergencyControlFixtureSet() {
  writeFixtureSet("phase8-scenario-emergency-control", true);
  const base = join(fixtureRoot.pathname, "phase8-scenario-emergency-control");
  writeFileSync(join(base, "LEVELS", "LEVEL.L1"), syntheticMapBytes());
  writeFileSync(join(base, "LEVELS", "LEVEL.L2"), syntheticMapBytes({
    camera: { x: 79, y: 81 },
    heliport: { x: 72, y: 86 },
  }));
  const options = {
    emergencyMinPatients: 3,
    emergencyMaxPatients: 3,
    emergencyIllnessCode: 5,
    emergencyPercentToWin: 67,
    emergencyBonusCash: 1234,
    minimumAbductionYears: 4,
    abductionsPerYear: 0,
    disasterLaunch: 999,
  };
  writeFileSync(join(base, "LEVELS", "FULL01.SAM"), scenarioBytes({
    title: "Scenario Emergency Control",
    reputation: 300,
    balance: 1000,
    treatedPercentage: 40,
    cures: 10,
    hospitalValue: 55000,
    bankruptcy: -20000,
    reputationFailure: 200,
    deaths: 50,
    ...options,
  }));
  writeFileSync(join(base, "LEVELS", "FULL02.SAM"), scenarioBytes({
    title: "Scenario Emergency Control Two",
    reputation: 450,
    balance: 2500,
    treatedPercentage: 50,
    cures: 12,
    hospitalValue: 70000,
    bankruptcy: -25000,
    reputationFailure: 300,
    deaths: 40,
    expandedDiseases: true,
    ...options,
  }));
}

function writeScenarioQuakeControlFixtureSet() {
  writeFixtureSet("phase8-scenario-quake-control", true);
  const base = join(fixtureRoot.pathname, "phase8-scenario-quake-control");
  writeFileSync(join(base, "LEVELS", "LEVEL.L1"), syntheticMapBytes());
  writeFileSync(join(base, "LEVELS", "LEVEL.L2"), syntheticMapBytes({
    camera: { x: 79, y: 81 },
    heliport: { x: 72, y: 86 },
  }));
  const options = {
    quakeStartMonth: 2,
    quakeEndMonth: 2,
    quakeSeverity: 7,
    minimumAbductionYears: 4,
    abductionsPerYear: 0,
    disasterLaunch: 999,
  };
  writeFileSync(join(base, "LEVELS", "FULL01.SAM"), scenarioBytes({
    title: "Scenario Quake Control",
    reputation: 300,
    balance: 1000,
    treatedPercentage: 40,
    cures: 10,
    hospitalValue: 55000,
    bankruptcy: -20000,
    reputationFailure: 200,
    deaths: 50,
    ...options,
  }));
  writeFileSync(join(base, "LEVELS", "FULL02.SAM"), scenarioBytes({
    title: "Scenario Quake Control Two",
    reputation: 450,
    balance: 2500,
    treatedPercentage: 50,
    cures: 12,
    hospitalValue: 70000,
    bankruptcy: -25000,
    reputationFailure: 300,
    deaths: 40,
    expandedDiseases: true,
    ...options,
  }));
}

function writeScenarioStaffMarketFixtureSet() {
  writeFixtureSet("phase8-scenario-staff-market", true);
  const base = join(fixtureRoot.pathname, "phase8-scenario-staff-market");
  writeFileSync(join(base, "LEVELS", "LEVEL.L1"), syntheticMapBytes());
  writeFileSync(join(base, "LEVELS", "LEVEL.L2"), syntheticMapBytes({
    camera: { x: 79, y: 81 },
    heliport: { x: 72, y: 86 },
  }));
  const options = {
    staffLevelLines: [
      "#staff_levels[0].Month.Nurses.Doctors.Handymen.Receptionists.Seed.ShrkRate.SurgRate.RschRate.ConsRate.JrRate 0 4 5 2 3 1234 20 30 40 50 60",
      "#staff_levels[1].Month.Nurses.Doctors.Handymen.Receptionists.Seed.ShrkRate.SurgRate.RschRate.ConsRate.JrRate 1 2 3 1 2 4321 7 8 9 10 11",
    ],
    minimumAbductionYears: 4,
    abductionsPerYear: 0,
    disasterLaunch: 999,
  };
  writeFileSync(join(base, "LEVELS", "FULL01.SAM"), scenarioBytes({
    title: "Scenario Staff Market",
    reputation: 300,
    balance: 1000,
    treatedPercentage: 40,
    cures: 10,
    hospitalValue: 55000,
    bankruptcy: -20000,
    reputationFailure: 200,
    deaths: 50,
    ...options,
  }));
  writeFileSync(join(base, "LEVELS", "FULL02.SAM"), scenarioBytes({
    title: "Scenario Staff Market Two",
    reputation: 450,
    balance: 2500,
    treatedPercentage: 50,
    cures: 12,
    hospitalValue: 70000,
    bankruptcy: -25000,
    reputationFailure: 300,
    deaths: 40,
    expandedDiseases: true,
    ...options,
  }));
}

function writeScenarioPopulationScheduleFixtureSet() {
  writeFixtureSet("phase8-scenario-population-schedule", true);
  const base = join(fixtureRoot.pathname, "phase8-scenario-population-schedule");
  writeFileSync(join(base, "LEVELS", "LEVEL.L1"), syntheticMapBytes());
  writeFileSync(join(base, "LEVELS", "LEVEL.L2"), syntheticMapBytes({
    camera: { x: 79, y: 81 },
    heliport: { x: 72, y: 86 },
  }));
  const options = {
    populationLines: [
      "#popn[0].Month.Change 0 10",
      "#popn[1].Month.Change 1 -2",
    ],
    allocationDelay: 0,
    routingNoStaffPoints: 0,
    minimumAbductionYears: 4,
    abductionsPerYear: 0,
    disasterLaunch: 999,
  };
  writeFileSync(join(base, "LEVELS", "FULL01.SAM"), scenarioBytes({
    title: "Scenario Population Schedule",
    reputation: 300,
    balance: 1000,
    treatedPercentage: 40,
    cures: 10,
    hospitalValue: 55000,
    bankruptcy: -20000,
    reputationFailure: 200,
    deaths: 50,
    ...options,
  }));
  writeFileSync(join(base, "LEVELS", "FULL02.SAM"), scenarioBytes({
    title: "Scenario Population Schedule Two",
    reputation: 450,
    balance: 2500,
    treatedPercentage: 50,
    cures: 12,
    hospitalValue: 70000,
    bankruptcy: -25000,
    reputationFailure: 300,
    deaths: 40,
    expandedDiseases: true,
    ...options,
  }));
}

function writeScenarioEpidemicSpreadFixtureSet() {
  writeFixtureSet("phase8-scenario-epidemic-spread", true);
  const base = join(fixtureRoot.pathname, "phase8-scenario-epidemic-spread");
  writeFileSync(join(base, "LEVELS", "LEVEL.L1"), syntheticMapBytes());
  writeFileSync(join(base, "LEVELS", "LEVEL.L2"), syntheticMapBytes({
    camera: { x: 79, y: 81 },
    heliport: { x: 72, y: 86 },
  }));
  writeFileSync(join(base, "LEVELS", "FULL01.SAM"), scenarioBytes({
    title: "Scenario Epidemic Spread",
    reputation: 300,
    balance: 1000,
    treatedPercentage: 40,
    cures: 10,
    hospitalValue: 55000,
    bankruptcy: -20000,
    reputationFailure: 200,
    deaths: 50,
    howContagious: 75,
    contagiousSpreadFactor: 100,
    reduceContagiousPeepCount: 1,
    reduceContagiousRate: 100,
    minimumAbductionYears: 4,
    abductionsPerYear: 0,
    disasterLaunch: 999,
  }));
  writeFileSync(join(base, "LEVELS", "FULL02.SAM"), scenarioBytes({
    title: "Scenario Epidemic Spread Two",
    reputation: 450,
    balance: 2500,
    treatedPercentage: 50,
    cures: 12,
    hospitalValue: 70000,
    bankruptcy: -25000,
    reputationFailure: 300,
    deaths: 40,
    expandedDiseases: true,
    howContagious: 75,
    contagiousSpreadFactor: 100,
    reduceContagiousPeepCount: 1,
    reduceContagiousRate: 100,
    minimumAbductionYears: 4,
    abductionsPerYear: 0,
    disasterLaunch: 999,
  }));
}

function writeScenarioVaccinationCostFixtureSet() {
  writeFixtureSet("phase8-scenario-vaccination-cost", true);
  const base = join(fixtureRoot.pathname, "phase8-scenario-vaccination-cost");
  writeFileSync(join(base, "LEVELS", "LEVEL.L1"), syntheticMapBytes());
  writeFileSync(join(base, "LEVELS", "LEVEL.L2"), syntheticMapBytes({
    camera: { x: 79, y: 81 },
    heliport: { x: 72, y: 86 },
  }));
  const options = {
    vaccinationCost: 80,
    minimumAbductionYears: 4,
    abductionsPerYear: 0,
    disasterLaunch: 999,
  };
  writeFileSync(join(base, "LEVELS", "FULL01.SAM"), scenarioBytes({
    title: "Scenario Vaccination Cost",
    reputation: 300,
    balance: 1000,
    treatedPercentage: 40,
    cures: 10,
    hospitalValue: 55000,
    bankruptcy: -20000,
    reputationFailure: 200,
    deaths: 50,
    ...options,
  }));
  writeFileSync(join(base, "LEVELS", "FULL02.SAM"), scenarioBytes({
    title: "Scenario Vaccination Cost Two",
    reputation: 450,
    balance: 2500,
    treatedPercentage: 50,
    cures: 12,
    hospitalValue: 70000,
    bankruptcy: -25000,
    reputationFailure: 300,
    deaths: 40,
    expandedDiseases: true,
    ...options,
  }));
}

function writeScenarioEpidemicCompensationFixtureSet() {
  writeFixtureSet("phase8-scenario-epidemic-compensation", true);
  const base = join(fixtureRoot.pathname, "phase8-scenario-epidemic-compensation");
  writeFileSync(join(base, "LEVELS", "LEVEL.L1"), syntheticMapBytes());
  writeFileSync(join(base, "LEVELS", "LEVEL.L2"), syntheticMapBytes({
    camera: { x: 79, y: 81 },
    heliport: { x: 72, y: 86 },
  }));
  const options = {
    epidemicFine: 1234,
    epidemicCompensationLow: 2000,
    epidemicCompensationHigh: 2002,
    minimumAbductionYears: 4,
    abductionsPerYear: 0,
    disasterLaunch: 999,
  };
  writeFileSync(join(base, "LEVELS", "FULL01.SAM"), scenarioBytes({
    title: "Scenario Epidemic Compensation",
    reputation: 300,
    balance: 1000,
    treatedPercentage: 40,
    cures: 10,
    hospitalValue: 55000,
    bankruptcy: -20000,
    reputationFailure: 200,
    deaths: 50,
    ...options,
  }));
  writeFileSync(join(base, "LEVELS", "FULL02.SAM"), scenarioBytes({
    title: "Scenario Epidemic Compensation Two",
    reputation: 450,
    balance: 2500,
    treatedPercentage: 50,
    cures: 12,
    hospitalValue: 70000,
    bankruptcy: -25000,
    reputationFailure: 300,
    deaths: 40,
    expandedDiseases: true,
    ...options,
  }));
}

function writeScenarioPatientBehaviorFixtureSet() {
  writeFixtureSet("phase8-scenario-patient-behavior", true);
  const base = join(fixtureRoot.pathname, "phase8-scenario-patient-behavior");
  writeFileSync(join(base, "LEVELS", "LEVEL.L1"), syntheticMapBytes());
  writeFileSync(join(base, "LEVELS", "LEVEL.L2"), syntheticMapBytes({
    camera: { x: 79, y: 81 },
    heliport: { x: 72, y: 86 },
  }));
  writeFileSync(join(base, "LEVELS", "FULL01.SAM"), scenarioBytes({
    title: "Scenario Patient Behavior",
    reputation: 300,
    balance: 1000,
    treatedPercentage: 40,
    cures: 10,
    hospitalValue: 55000,
    bankruptcy: -20000,
    reputationFailure: 200,
    deaths: 50,
    litterDrop: 3,
    litterRandom: 1,
    bowelFull: 2,
    bowelOverflows: 4,
    vomitLimit: 62,
    drinkHappy: 3,
    toiletHappy: 4,
    minimumAbductionYears: 4,
    abductionsPerYear: 0,
    disasterLaunch: 999,
  }));
  writeFileSync(join(base, "LEVELS", "FULL02.SAM"), scenarioBytes({
    title: "Scenario Patient Behavior Two",
    reputation: 450,
    balance: 2500,
    treatedPercentage: 50,
    cures: 12,
    hospitalValue: 70000,
    bankruptcy: -25000,
    reputationFailure: 300,
    deaths: 40,
    expandedDiseases: true,
    litterDrop: 3,
    litterRandom: 1,
    bowelFull: 2,
    bowelOverflows: 4,
    vomitLimit: 62,
    drinkHappy: 3,
    toiletHappy: 4,
    minimumAbductionYears: 4,
    abductionsPerYear: 0,
    disasterLaunch: 999,
  }));
}

function writeScenarioRatHoleCleanupFixtureSet() {
  writeFixtureSet("phase8-scenario-rat-hole-cleanup", true);
  const base = join(fixtureRoot.pathname, "phase8-scenario-rat-hole-cleanup");
  writeFileSync(join(base, "LEVELS", "LEVEL.L1"), syntheticMapBytes());
  writeFileSync(join(base, "LEVELS", "LEVEL.L2"), syntheticMapBytes({
    camera: { x: 79, y: 81 },
    heliport: { x: 72, y: 86 },
  }));
  const options = {
    litterDrop: 1,
    litterRandom: 1,
    removeRatHoleChance: 10000,
    minimumAbductionYears: 4,
    abductionsPerYear: 0,
    disasterLaunch: 999,
  };
  writeFileSync(join(base, "LEVELS", "FULL01.SAM"), scenarioBytes({
    title: "Scenario Rat Hole Cleanup",
    reputation: 300,
    balance: 1000,
    treatedPercentage: 40,
    cures: 10,
    hospitalValue: 55000,
    bankruptcy: -20000,
    reputationFailure: 200,
    deaths: 50,
    ...options,
  }));
  writeFileSync(join(base, "LEVELS", "FULL02.SAM"), scenarioBytes({
    title: "Scenario Rat Hole Cleanup Two",
    reputation: 450,
    balance: 2500,
    treatedPercentage: 50,
    cures: 12,
    hospitalValue: 70000,
    bankruptcy: -25000,
    reputationFailure: 300,
    deaths: 40,
    expandedDiseases: true,
    ...options,
  }));
}

function writeScenarioAwardFixtureSet() {
  writeFixtureSet("phase8-scenario-award", true);
  const base = join(fixtureRoot.pathname, "phase8-scenario-award");
  writeFileSync(join(base, "LEVELS", "LEVEL.L1"), syntheticMapBytes());
  writeFileSync(join(base, "LEVELS", "LEVEL.L2"), syntheticMapBytes({
    camera: { x: 79, y: 81 },
    heliport: { x: 72, y: 86 },
  }));
  writeFileSync(join(base, "LEVELS", "FULL01.SAM"), scenarioBytes({
    title: "Scenario Award",
    reputation: 300,
    balance: 1000,
    treatedPercentage: 40,
    cures: 10,
    hospitalValue: 55000,
    bankruptcy: -20000,
    reputationFailure: 200,
    deaths: 50,
    awardCures: 0,
    awardReputation: 500,
    awardHospitalValue: 0,
    trophyReputation: 500,
    trophyReputationBonus: 2000,
    trophyStaffHappiness: 100,
    trophyStaffHappinessBonus: 5,
    disasterLaunch: 999,
  }));
  writeFileSync(join(base, "LEVELS", "FULL02.SAM"), scenarioBytes({
    title: "Scenario Award Two",
    reputation: 450,
    balance: 2500,
    treatedPercentage: 50,
    cures: 12,
    hospitalValue: 70000,
    bankruptcy: -25000,
    reputationFailure: 300,
    deaths: 40,
    expandedDiseases: true,
    awardCures: 0,
    awardReputation: 500,
    awardHospitalValue: 0,
    trophyReputation: 500,
    trophyReputationBonus: 2000,
    trophyStaffHappiness: 100,
    trophyStaffHappinessBonus: 5,
    disasterLaunch: 999,
  }));
}

function writeScenarioScoreAwardFixtureSet() {
  writeFixtureSet("phase8-scenario-score-award", true);
  const base = join(fixtureRoot.pathname, "phase8-scenario-score-award");
  writeFileSync(join(base, "LEVELS", "LEVEL.L1"), syntheticMapBytes());
  writeFileSync(join(base, "LEVELS", "LEVEL.L2"), syntheticMapBytes({
    camera: { x: 79, y: 81 },
    heliport: { x: 72, y: 86 },
  }));
  writeFileSync(join(base, "LEVELS", "FULL01.SAM"), scenarioBytes({
    title: "Scenario Score Award",
    reputation: 300,
    balance: 1000,
    treatedPercentage: 40,
    cures: 10,
    hospitalValue: 55000,
    bankruptcy: -20000,
    reputationFailure: 200,
    deaths: 50,
    scoreMaxIncrease: 10,
    awardCures: 0,
    awardReputation: 0,
    awardHospitalValue: 0,
    disasterLaunch: 999,
  }));
  writeFileSync(join(base, "LEVELS", "FULL02.SAM"), scenarioBytes({
    title: "Scenario Score Award Two",
    reputation: 450,
    balance: 2500,
    treatedPercentage: 50,
    cures: 12,
    hospitalValue: 70000,
    bankruptcy: -25000,
    reputationFailure: 300,
    deaths: 40,
    expandedDiseases: true,
    scoreMaxIncrease: 10,
    awardCures: 0,
    awardReputation: 0,
    awardHospitalValue: 0,
    disasterLaunch: 999,
  }));
}

function writeScenarioCuresAwardFixtureSet() {
  writeFixtureSet("phase8-scenario-cures-award", true);
  const base = join(fixtureRoot.pathname, "phase8-scenario-cures-award");
  writeFileSync(join(base, "LEVELS", "LEVEL.L1"), syntheticMapBytes());
  writeFileSync(join(base, "LEVELS", "LEVEL.L2"), syntheticMapBytes({
    camera: { x: 79, y: 81 },
    heliport: { x: 72, y: 86 },
  }));
  const options = {
    awardCures: 2,
    awardReputation: 0,
    awardHospitalValue: 0,
    curesPoor: 3,
    curesBonus: 900,
    curesPenalty: -450,
    minimumAbductionYears: 4,
    abductionsPerYear: 0,
    disasterLaunch: 999,
  };
  writeFileSync(join(base, "LEVELS", "FULL01.SAM"), scenarioBytes({
    title: "Scenario Cures Award",
    reputation: 300,
    balance: 1000,
    treatedPercentage: 40,
    cures: 10,
    hospitalValue: 55000,
    bankruptcy: -20000,
    reputationFailure: 200,
    deaths: 50,
    ...options,
  }));
  writeFileSync(join(base, "LEVELS", "FULL02.SAM"), scenarioBytes({
    title: "Scenario Cures Award Two",
    reputation: 450,
    balance: 2500,
    treatedPercentage: 50,
    cures: 12,
    hospitalValue: 70000,
    bankruptcy: -25000,
    reputationFailure: 300,
    deaths: 40,
    expandedDiseases: true,
    ...options,
  }));
}

function writeScenarioDeathsAwardFixtureSet() {
  writeFixtureSet("phase8-scenario-deaths-award", true);
  const base = join(fixtureRoot.pathname, "phase8-scenario-deaths-award");
  writeFileSync(join(base, "LEVELS", "LEVEL.L1"), syntheticMapBytes());
  writeFileSync(join(base, "LEVELS", "LEVEL.L2"), syntheticMapBytes({
    camera: { x: 79, y: 81 },
    heliport: { x: 72, y: 86 },
  }));
  const options = {
    awardCures: 0,
    awardReputation: 0,
    awardHospitalValue: 0,
    deathsAward: 5,
    deathsPoor: 0,
    deathsBonus: 700,
    deathsPenalty: -350,
    minimumAbductionYears: 4,
    abductionsPerYear: 0,
    disasterLaunch: 999,
  };
  writeFileSync(join(base, "LEVELS", "FULL01.SAM"), scenarioBytes({
    title: "Scenario Deaths Award",
    reputation: 300,
    balance: 1000,
    treatedPercentage: 40,
    cures: 10,
    hospitalValue: 55000,
    bankruptcy: -20000,
    reputationFailure: 200,
    deaths: 50,
    ...options,
  }));
  writeFileSync(join(base, "LEVELS", "FULL02.SAM"), scenarioBytes({
    title: "Scenario Deaths Award Two",
    reputation: 450,
    balance: 2500,
    treatedPercentage: 50,
    cures: 12,
    hospitalValue: 70000,
    bankruptcy: -25000,
    reputationFailure: 300,
    deaths: 40,
    expandedDiseases: true,
    ...options,
  }));
}

function writeScenarioTrophyCashAwardFixtureSet() {
  writeFixtureSet("phase8-scenario-trophy-cash-awards", true);
  const base = join(fixtureRoot.pathname, "phase8-scenario-trophy-cash-awards");
  writeFileSync(join(base, "LEVELS", "LEVEL.L1"), syntheticMapBytes());
  writeFileSync(join(base, "LEVELS", "LEVEL.L2"), syntheticMapBytes({
    camera: { x: 79, y: 81 },
    heliport: { x: 72, y: 86 },
  }));
  writeFileSync(join(base, "LEVELS", "FULL01.SAM"), scenarioBytes({
    title: "Scenario Trophy Cash Award",
    reputation: 300,
    balance: 1000,
    treatedPercentage: 40,
    cures: 10,
    hospitalValue: 55000,
    bankruptcy: -20000,
    reputationFailure: 200,
    deaths: 50,
    awardCures: 0,
    awardReputation: 0,
    awardHospitalValue: 0,
    deathsAward: 5,
    trophyCuresBonus: 600,
    trophyDeathBonus: 700,
    disasterLaunch: 999,
  }));
  writeFileSync(join(base, "LEVELS", "FULL02.SAM"), scenarioBytes({
    title: "Scenario Trophy Cash Award Two",
    reputation: 450,
    balance: 2500,
    treatedPercentage: 50,
    cures: 12,
    hospitalValue: 70000,
    bankruptcy: -25000,
    reputationFailure: 300,
    deaths: 40,
    expandedDiseases: true,
    awardCures: 0,
    awardReputation: 0,
    awardHospitalValue: 0,
    deathsAward: 5,
    trophyCuresBonus: 600,
    trophyDeathBonus: 700,
    disasterLaunch: 999,
  }));
}

function writeScenarioHospitalValueAwardFixtureSet() {
  writeFixtureSet("phase8-scenario-hospital-value-award", true);
  const base = join(fixtureRoot.pathname, "phase8-scenario-hospital-value-award");
  writeFileSync(join(base, "LEVELS", "LEVEL.L1"), syntheticMapBytes());
  writeFileSync(join(base, "LEVELS", "LEVEL.L2"), syntheticMapBytes({
    camera: { x: 79, y: 81 },
    heliport: { x: 72, y: 86 },
  }));
  const options = {
    startCash: 4000,
    awardCures: 0,
    awardReputation: 0,
    awardHospitalValue: 10000,
    hospValuePoor: 18000,
    hospValueBonus: 9,
    hospValuePenalty: -4,
    minimumAbductionYears: 4,
    abductionsPerYear: 0,
    disasterLaunch: 999,
  };
  writeFileSync(join(base, "LEVELS", "FULL01.SAM"), scenarioBytes({
    title: "Scenario Hospital Value Award",
    reputation: 300,
    balance: 1000,
    treatedPercentage: 40,
    cures: 10,
    hospitalValue: 55000,
    bankruptcy: -20000,
    reputationFailure: 200,
    deaths: 50,
    ...options,
  }));
  writeFileSync(join(base, "LEVELS", "FULL02.SAM"), scenarioBytes({
    title: "Scenario Hospital Value Award Two",
    reputation: 450,
    balance: 2500,
    treatedPercentage: 50,
    cures: 12,
    hospitalValue: 70000,
    bankruptcy: -25000,
    reputationFailure: 300,
    deaths: 40,
    expandedDiseases: true,
    ...options,
  }));
}

function writeScenarioReputationAwardFixtureSet() {
  writeFixtureSet("phase8-scenario-reputation-award", true);
  const base = join(fixtureRoot.pathname, "phase8-scenario-reputation-award");
  writeFileSync(join(base, "LEVELS", "LEVEL.L1"), syntheticMapBytes());
  writeFileSync(join(base, "LEVELS", "LEVEL.L2"), syntheticMapBytes({
    camera: { x: 79, y: 81 },
    heliport: { x: 72, y: 86 },
  }));
  const options = {
    awardCures: 0,
    awardReputation: 300,
    awardHospitalValue: 0,
    reputationPoor: 450,
    awardReputationBonus: 800,
    awardReputationPenalty: -400,
    minimumAbductionYears: 4,
    abductionsPerYear: 0,
    disasterLaunch: 999,
  };
  writeFileSync(join(base, "LEVELS", "FULL01.SAM"), scenarioBytes({
    title: "Scenario Reputation Award",
    reputation: 300,
    balance: 1000,
    treatedPercentage: 40,
    cures: 10,
    hospitalValue: 55000,
    bankruptcy: -20000,
    reputationFailure: 200,
    deaths: 50,
    ...options,
  }));
  writeFileSync(join(base, "LEVELS", "FULL02.SAM"), scenarioBytes({
    title: "Scenario Reputation Award Two",
    reputation: 450,
    balance: 2500,
    treatedPercentage: 50,
    cures: 12,
    hospitalValue: 70000,
    bankruptcy: -25000,
    reputationFailure: 300,
    deaths: 40,
    expandedDiseases: true,
    ...options,
  }));
}

function writeScenarioLandCostFixtureSet() {
  writeFixtureSet("phase8-scenario-land-cost", true);
  const base = join(fixtureRoot.pathname, "phase8-scenario-land-cost");
  writeFileSync(join(base, "LEVELS", "LEVEL.L1"), syntheticMapBytes());
  writeFileSync(join(base, "LEVELS", "LEVEL.L2"), syntheticMapBytes({
    camera: { x: 79, y: 81 },
    heliport: { x: 72, y: 86 },
  }));
  const options = {
    landCostPerTile: 40,
    minimumAbductionYears: 4,
    abductionsPerYear: 0,
    disasterLaunch: 999,
  };
  writeFileSync(join(base, "LEVELS", "FULL01.SAM"), scenarioBytes({
    title: "Scenario Land Cost",
    reputation: 300,
    balance: 1000,
    treatedPercentage: 40,
    cures: 10,
    hospitalValue: 55000,
    bankruptcy: -20000,
    reputationFailure: 200,
    deaths: 50,
    ...options,
  }));
  writeFileSync(join(base, "LEVELS", "FULL02.SAM"), scenarioBytes({
    title: "Scenario Land Cost Two",
    reputation: 450,
    balance: 2500,
    treatedPercentage: 50,
    cures: 12,
    hospitalValue: 70000,
    bankruptcy: -25000,
    reputationFailure: 300,
    deaths: 40,
    expandedDiseases: true,
    ...options,
  }));
}

function writeScenarioResearchFloorFixtureSet() {
  writeFixtureSet("phase8-scenario-research-floor", true);
  const base = join(fixtureRoot.pathname, "phase8-scenario-research-floor");
  writeFileSync(join(base, "LEVELS", "LEVEL.L1"), syntheticMapBytes());
  writeFileSync(join(base, "LEVELS", "LEVEL.L2"), syntheticMapBytes({
    camera: { x: 79, y: 81 },
    heliport: { x: 72, y: 86 },
  }));
  writeFileSync(join(base, "LEVELS", "FULL01.SAM"), scenarioBytes({
    title: "Scenario Research Floor",
    reputation: 300,
    balance: 1000,
    treatedPercentage: 40,
    cures: 10,
    hospitalValue: 55000,
    bankruptcy: -20000,
    reputationFailure: 200,
    deaths: 50,
    researchPointsDivisor: 4,
    researchStartCost: 40,
    minDrugCost: 75,
    disasterLaunch: 999,
  }));
  writeFileSync(join(base, "LEVELS", "FULL02.SAM"), scenarioBytes({
    title: "Scenario Research Floor Two",
    reputation: 450,
    balance: 2500,
    treatedPercentage: 50,
    cures: 12,
    hospitalValue: 70000,
    bankruptcy: -25000,
    reputationFailure: 300,
    deaths: 40,
    expandedDiseases: true,
    researchStartCost: 40,
    minDrugCost: 75,
    disasterLaunch: 999,
  }));
}

function writeScenarioResearchIncrementFixtureSet() {
  writeFixtureSet("phase8-scenario-research-increment", true);
  const base = join(fixtureRoot.pathname, "phase8-scenario-research-increment");
  writeFileSync(join(base, "LEVELS", "LEVEL.L1"), syntheticMapBytes());
  writeFileSync(join(base, "LEVELS", "LEVEL.L2"), syntheticMapBytes({
    camera: { x: 79, y: 81 },
    heliport: { x: 72, y: 86 },
  }));
  writeFileSync(join(base, "LEVELS", "FULL01.SAM"), scenarioBytes({
    title: "Scenario Research Increment",
    reputation: 300,
    balance: 1000,
    treatedPercentage: 40,
    cures: 10,
    hospitalValue: 55000,
    bankruptcy: -20000,
    reputationFailure: 200,
    deaths: 50,
    researchStartRating: 95,
    researchStartCost: 100,
    researchImproveIncrementPercent: 7,
    disasterLaunch: 999,
  }));
  writeFileSync(join(base, "LEVELS", "FULL02.SAM"), scenarioBytes({
    title: "Scenario Research Increment Two",
    reputation: 450,
    balance: 2500,
    treatedPercentage: 50,
    cures: 12,
    hospitalValue: 70000,
    bankruptcy: -25000,
    reputationFailure: 300,
    deaths: 40,
    researchStartRating: 95,
    researchStartCost: 100,
    researchImproveIncrementPercent: 7,
    disasterLaunch: 999,
  }));
}

function writeScenarioResearchCostGrowthFixtureSet() {
  writeFixtureSet("phase8-scenario-research-cost-growth", true);
  const base = join(fixtureRoot.pathname, "phase8-scenario-research-cost-growth");
  writeFileSync(join(base, "LEVELS", "LEVEL.L1"), syntheticMapBytes());
  writeFileSync(join(base, "LEVELS", "LEVEL.L2"), syntheticMapBytes({
    camera: { x: 79, y: 81 },
    heliport: { x: 72, y: 86 },
  }));
  const options = {
    researchStartRating: 95,
    researchStartCost: 100,
    drugImproveRate: 5,
    researchImproveCostPercent: 25,
    disasterLaunch: 999,
  };
  writeFileSync(join(base, "LEVELS", "FULL01.SAM"), scenarioBytes({
    title: "Scenario Research Cost Growth",
    reputation: 300,
    balance: 1000,
    treatedPercentage: 40,
    cures: 10,
    hospitalValue: 55000,
    bankruptcy: -20000,
    reputationFailure: 200,
    deaths: 50,
    ...options,
  }));
  writeFileSync(join(base, "LEVELS", "FULL02.SAM"), scenarioBytes({
    title: "Scenario Research Cost Growth Two",
    reputation: 450,
    balance: 2500,
    treatedPercentage: 50,
    cures: 12,
    hospitalValue: 70000,
    bankruptcy: -25000,
    reputationFailure: 300,
    deaths: 40,
    expandedDiseases: true,
    ...options,
  }));
}

function writeScenarioExpertiseStartPriceFixtureSet() {
  writeFixtureSet("phase8-scenario-expertise-start-price", true);
  const base = join(fixtureRoot.pathname, "phase8-scenario-expertise-start-price");
  writeFileSync(join(base, "LEVELS", "LEVEL.L1"), syntheticMapBytes());
  writeFileSync(join(base, "LEVELS", "LEVEL.L2"), syntheticMapBytes({
    camera: { x: 79, y: 81 },
    heliport: { x: 72, y: 86 },
  }));
  const options = {
    expertiseLines: [
      "#expertise[16].StartPrice.ContRate.Known.RschReqd.MaxDiagDiff 300 0 1 0 100 UNCOMMON_COLD",
    ],
    diseaseLines: ["#non_visuals[0] 5 I_UNCOMMON_COLD"],
    holdVisualMonths: 0,
    holdVisualPeepCount: 0,
    minimumAbductionYears: 4,
    abductionsPerYear: 0,
    disasterLaunch: 999,
  };
  writeFileSync(join(base, "LEVELS", "FULL01.SAM"), scenarioBytes({
    title: "Scenario Expertise Start Price",
    reputation: 300,
    balance: 1000,
    treatedPercentage: 40,
    cures: 10,
    hospitalValue: 55000,
    bankruptcy: -20000,
    reputationFailure: 200,
    deaths: 50,
    ...options,
  }));
  writeFileSync(join(base, "LEVELS", "FULL02.SAM"), scenarioBytes({
    title: "Scenario Expertise Start Price Two",
    reputation: 450,
    balance: 2500,
    treatedPercentage: 50,
    cures: 12,
    hospitalValue: 70000,
    bankruptcy: -25000,
    reputationFailure: 300,
    deaths: 40,
    expandedDiseases: true,
    ...options,
  }));
}

function writeScenarioMachineStrengthFixtureSet() {
  writeFixtureSet("phase8-scenario-machine-strength", true);
  const base = join(fixtureRoot.pathname, "phase8-scenario-machine-strength");
  writeFileSync(join(base, "LEVELS", "LEVEL.L1"), syntheticMapBytes());
  writeFileSync(join(base, "LEVELS", "LEVEL.L2"), syntheticMapBytes({
    camera: { x: 79, y: 81 },
    heliport: { x: 72, y: 86 },
  }));
  const options = {
    researchIncrement: 2,
    maxObjectStrength: 14,
    diagnosisStartStrength: 12,
    specialistStartStrength: 20,
    quakeSeverity: 13,
    secondQuake: { startMonth: 2, endMonth: 2, severity: 1 },
    disasterLaunch: 999,
  };
  writeFileSync(join(base, "LEVELS", "FULL01.SAM"), scenarioBytes({
    title: "Scenario Machine Strength",
    reputation: 300,
    balance: 1000,
    treatedPercentage: 40,
    cures: 10,
    hospitalValue: 55000,
    bankruptcy: -20000,
    reputationFailure: 200,
    deaths: 50,
    ...options,
  }));
  writeFileSync(join(base, "LEVELS", "FULL02.SAM"), scenarioBytes({
    title: "Scenario Machine Strength Two",
    reputation: 450,
    balance: 2500,
    treatedPercentage: 50,
    cures: 12,
    hospitalValue: 70000,
    bankruptcy: -25000,
    reputationFailure: 300,
    deaths: 40,
    expandedDiseases: true,
    ...options,
  }));
}

function writeScenarioVisualHoldFixtureSet() {
  writeFixtureSet("phase8-scenario-visual-hold", true);
  const base = join(fixtureRoot.pathname, "phase8-scenario-visual-hold");
  writeFileSync(join(base, "LEVELS", "LEVEL.L1"), syntheticMapBytes());
  writeFileSync(join(base, "LEVELS", "LEVEL.L2"), syntheticMapBytes({
    camera: { x: 79, y: 81 },
    heliport: { x: 72, y: 86 },
  }));
  writeFileSync(join(base, "LEVELS", "FULL01.SAM"), scenarioBytes({
    title: "Scenario Visual Hold",
    reputation: 300,
    balance: 1000,
    treatedPercentage: 40,
    cures: 10,
    hospitalValue: 55000,
    bankruptcy: -20000,
    reputationFailure: 200,
    deaths: 50,
    holdVisualMonths: 1,
    allocationDelay: 0,
    knownScenarioDiseases: true,
    expandedDiseases: true,
    disasterLaunch: 999,
  }));
  writeFileSync(join(base, "LEVELS", "FULL02.SAM"), scenarioBytes({
    title: "Scenario Visual Hold Two",
    reputation: 450,
    balance: 2500,
    treatedPercentage: 50,
    cures: 12,
    hospitalValue: 70000,
    bankruptcy: -25000,
    reputationFailure: 300,
    deaths: 40,
    holdVisualMonths: 1,
    allocationDelay: 0,
    knownScenarioDiseases: true,
    expandedDiseases: true,
    disasterLaunch: 999,
  }));
}

function writeScenarioVisualHoldPeepCountFixtureSet() {
  writeFixtureSet("phase8-scenario-visual-hold-peep-count", true);
  const base = join(fixtureRoot.pathname, "phase8-scenario-visual-hold-peep-count");
  writeFileSync(join(base, "LEVELS", "LEVEL.L1"), syntheticMapBytes());
  writeFileSync(join(base, "LEVELS", "LEVEL.L2"), syntheticMapBytes({
    camera: { x: 79, y: 81 },
    heliport: { x: 72, y: 86 },
  }));
  const options = {
    holdVisualMonths: 0,
    holdVisualPeepCount: 4,
    allocationDelay: 0,
    knownScenarioDiseases: true,
    expandedDiseases: true,
    disasterLaunch: 999,
  };
  writeFileSync(join(base, "LEVELS", "FULL01.SAM"), scenarioBytes({
    title: "Scenario Visual Hold Peep Count",
    reputation: 300,
    balance: 1000,
    treatedPercentage: 40,
    cures: 10,
    hospitalValue: 55000,
    bankruptcy: -20000,
    reputationFailure: 200,
    deaths: 50,
    ...options,
  }));
  writeFileSync(join(base, "LEVELS", "FULL02.SAM"), scenarioBytes({
    title: "Scenario Visual Hold Peep Count Two",
    reputation: 450,
    balance: 2500,
    treatedPercentage: 50,
    cures: 12,
    hospitalValue: 70000,
    bankruptcy: -25000,
    reputationFailure: 300,
    deaths: 40,
    ...options,
  }));
}

function writeScenarioVisualsAvailableFixtureSet() {
  writeFixtureSet("phase8-scenario-visuals-available", true);
  const base = join(fixtureRoot.pathname, "phase8-scenario-visuals-available");
  writeFileSync(join(base, "LEVELS", "LEVEL.L1"), syntheticMapBytes());
  writeFileSync(join(base, "LEVELS", "LEVEL.L2"), syntheticMapBytes({
    camera: { x: 79, y: 81 },
    heliport: { x: 72, y: 86 },
  }));
  const diseaseLines = [
    "#visuals_available[13] 1 I_TRANSPARENCY",
    "#non_visuals[0] 5 I_UNCOMMON_COLD",
  ];
  const options = {
    allocationDelay: 0,
    knownScenarioDiseases: true,
    diseaseLines,
    disasterLaunch: 999,
  };
  writeFileSync(join(base, "LEVELS", "FULL01.SAM"), scenarioBytes({
    title: "Scenario Visuals Available",
    reputation: 300,
    balance: 1000,
    treatedPercentage: 40,
    cures: 10,
    hospitalValue: 55000,
    bankruptcy: -20000,
    reputationFailure: 200,
    deaths: 50,
    ...options,
  }));
  writeFileSync(join(base, "LEVELS", "FULL02.SAM"), scenarioBytes({
    title: "Scenario Visuals Available Two",
    reputation: 450,
    balance: 2500,
    treatedPercentage: 50,
    cures: 12,
    hospitalValue: 70000,
    bankruptcy: -25000,
    reputationFailure: 300,
    deaths: 40,
    expandedDiseases: true,
    ...options,
  }));
}

function writeScenarioObjectDiseaseGateFixtureSet() {
  writeFixtureSet("phase8-scenario-object-disease-gate", true);
  const base = join(fixtureRoot.pathname, "phase8-scenario-object-disease-gate");
  writeFileSync(join(base, "LEVELS", "LEVEL.L1"), syntheticMapBytes());
  writeFileSync(join(base, "LEVELS", "LEVEL.L2"), syntheticMapBytes({
    camera: { x: 79, y: 81 },
    heliport: { x: 72, y: 86 },
  }));
  const diseaseLines = [
    "#visuals[0] 9 I_BALDNESS",
    "#visuals[1] 1 I_BROKEN_BONES",
  ];
  const objectLines = [
    "#objects[24].StartAvail.WhenAvail.AvailableForLevel 1 0 1 24 Cast Remover",
    "#objects[25].StartAvail.WhenAvail.AvailableForLevel 0 1 1 25 Hair Restorer",
  ];
  const options = {
    allocationDelay: 0,
    diseaseLines,
    objectLines,
    knownScenarioDiseases: true,
    disasterLaunch: 999,
  };
  writeFileSync(join(base, "LEVELS", "FULL01.SAM"), scenarioBytes({
    title: "Scenario Object Disease Gate",
    reputation: 300,
    balance: 1000,
    treatedPercentage: 40,
    cures: 10,
    hospitalValue: 55000,
    bankruptcy: -20000,
    reputationFailure: 200,
    deaths: 50,
    ...options,
  }));
  writeFileSync(join(base, "LEVELS", "FULL02.SAM"), scenarioBytes({
    title: "Scenario Object Disease Gate Two",
    reputation: 450,
    balance: 2500,
    treatedPercentage: 50,
    cures: 12,
    hospitalValue: 70000,
    bankruptcy: -25000,
    reputationFailure: 300,
    deaths: 40,
    expandedDiseases: true,
    ...options,
  }));
}

function writeScenarioContagiousReducerFixtureSet() {
  writeFixtureSet("phase8-scenario-contagious-reducer", true);
  const base = join(fixtureRoot.pathname, "phase8-scenario-contagious-reducer");
  writeFileSync(join(base, "LEVELS", "LEVEL.L1"), syntheticMapBytes());
  writeFileSync(join(base, "LEVELS", "LEVEL.L2"), syntheticMapBytes({
    camera: { x: 79, y: 81 },
    heliport: { x: 72, y: 86 },
  }));
  const diseaseLines = [
    "#non_visuals[23] 9 I_INFECTIOUS_LAUGHTER",
    "#non_visuals[0] 1 I_UNCOMMON_COLD",
  ];
  const options = {
    allocationDelay: 0,
    diseaseLines,
    knownScenarioDiseases: true,
    reduceContagiousMonths: 1,
    reduceContagiousPeepCount: 2,
    reduceContagiousRate: 0,
    disasterLaunch: 999,
  };
  writeFileSync(join(base, "LEVELS", "FULL01.SAM"), scenarioBytes({
    title: "Scenario Contagious Reducer",
    reputation: 300,
    balance: 1000,
    treatedPercentage: 40,
    cures: 10,
    hospitalValue: 55000,
    bankruptcy: -20000,
    reputationFailure: 200,
    deaths: 50,
    ...options,
  }));
  writeFileSync(join(base, "LEVELS", "FULL02.SAM"), scenarioBytes({
    title: "Scenario Contagious Reducer Two",
    reputation: 450,
    balance: 2500,
    treatedPercentage: 50,
    cures: 12,
    hospitalValue: 70000,
    bankruptcy: -25000,
    reputationFailure: 300,
    deaths: 40,
    expandedDiseases: true,
    ...options,
  }));
}

function writeScenarioContagiousRateFixtureSet() {
  writeFixtureSet("phase8-scenario-contagious-rate", true);
  const base = join(fixtureRoot.pathname, "phase8-scenario-contagious-rate");
  writeFileSync(join(base, "LEVELS", "LEVEL.L1"), syntheticMapBytes());
  writeFileSync(join(base, "LEVELS", "LEVEL.L2"), syntheticMapBytes({
    camera: { x: 79, y: 81 },
    heliport: { x: 72, y: 86 },
  }));
  const diseaseLines = [
    "#non_visuals[23] 9 I_INFECTIOUS_LAUGHTER",
  ];
  const expertiseLines = [
    "#expertise[23].ContRate.Known.RschReqd 0 1 0 INFECTIOUS_LAUGHTER",
  ];
  const options = {
    allocationDelay: 0,
    diseaseLines,
    expertiseLines,
    reduceContagiousMonths: 1,
    reduceContagiousPeepCount: 2,
    reduceContagiousRate: 0,
    disasterLaunch: 999,
  };
  writeFileSync(join(base, "LEVELS", "FULL01.SAM"), scenarioBytes({
    title: "Scenario Contagious Rate",
    reputation: 300,
    balance: 1000,
    treatedPercentage: 40,
    cures: 10,
    hospitalValue: 55000,
    bankruptcy: -20000,
    reputationFailure: 200,
    deaths: 50,
    ...options,
  }));
  writeFileSync(join(base, "LEVELS", "FULL02.SAM"), scenarioBytes({
    title: "Scenario Contagious Rate Two",
    reputation: 450,
    balance: 2500,
    treatedPercentage: 50,
    cures: 12,
    hospitalValue: 70000,
    bankruptcy: -25000,
    reputationFailure: 300,
    deaths: 40,
    expandedDiseases: true,
    ...options,
  }));
}

function writeScenarioAllocationDelayFixtureSet() {
  writeFixtureSet("phase8-scenario-allocation-delay", true);
  const base = join(fixtureRoot.pathname, "phase8-scenario-allocation-delay");
  writeFileSync(join(base, "LEVELS", "LEVEL.L1"), syntheticMapBytes());
  writeFileSync(join(base, "LEVELS", "LEVEL.L2"), syntheticMapBytes({
    camera: { x: 79, y: 81 },
    heliport: { x: 72, y: 86 },
  }));
  const options = {
    allocationDelay: 1,
    knownScenarioDiseases: true,
    disasterLaunch: 999,
  };
  writeFileSync(join(base, "LEVELS", "FULL01.SAM"), scenarioBytes({
    title: "Scenario Allocation Delay",
    reputation: 300,
    balance: 1000,
    treatedPercentage: 40,
    cures: 10,
    hospitalValue: 55000,
    bankruptcy: -20000,
    reputationFailure: 200,
    deaths: 50,
    ...options,
  }));
  writeFileSync(join(base, "LEVELS", "FULL02.SAM"), scenarioBytes({
    title: "Scenario Allocation Delay Two",
    reputation: 450,
    balance: 2500,
    treatedPercentage: 50,
    cures: 12,
    hospitalValue: 70000,
    bankruptcy: -25000,
    reputationFailure: 300,
    deaths: 40,
    expandedDiseases: true,
    ...options,
  }));
}

function writeScenarioAllocationWeightsFixtureSet() {
  writeFixtureSet("phase8-scenario-allocation-weights", true);
  const base = join(fixtureRoot.pathname, "phase8-scenario-allocation-weights");
  writeFileSync(join(base, "LEVELS", "LEVEL.L1"), syntheticMapBytes());
  writeFileSync(join(base, "LEVELS", "LEVEL.L2"), syntheticMapBytes({
    camera: { x: 79, y: 81 },
    heliport: { x: 72, y: 86 },
  }));
  const options = {
    allocationRandomWeight: 1,
    allocationTotalReputationWeight: 1,
    allocationIllnessReputationWeight: 3,
    allocationDelay: 0,
    diseaseLines: [
      "#non_visuals[0] 1 I_UNCOMMON_COLD",
      "#non_visuals[17] 1 I_GUT_ROT",
    ],
    expertiseLines: [
      "#expertise[16].Known.RschReqd.MaxDiagDiff 1 10000 100 UNCOMMON_COLD",
      "#expertise[17].Known.RschReqd.MaxDiagDiff 1 10000 100 GUT_ROT",
    ],
    disasterLaunch: 999,
  };
  writeFileSync(join(base, "LEVELS", "FULL01.SAM"), scenarioBytes({
    title: "Scenario Allocation Weights",
    reputation: 300,
    balance: 1000,
    treatedPercentage: 40,
    cures: 10,
    hospitalValue: 55000,
    bankruptcy: -20000,
    reputationFailure: 200,
    deaths: 50,
    ...options,
  }));
  writeFileSync(join(base, "LEVELS", "FULL02.SAM"), scenarioBytes({
    title: "Scenario Allocation Weights Two",
    reputation: 450,
    balance: 2500,
    treatedPercentage: 50,
    cures: 12,
    hospitalValue: 70000,
    bankruptcy: -25000,
    reputationFailure: 300,
    deaths: 40,
    ...options,
  }));
}

function writeScenarioRoutingDistanceFixtureSet() {
  writeFixtureSet("phase8-scenario-routing-distance", true);
  const base = join(fixtureRoot.pathname, "phase8-scenario-routing-distance");
  writeFileSync(join(base, "LEVELS", "LEVEL.L1"), syntheticMapBytes());
  writeFileSync(join(base, "LEVELS", "LEVEL.L2"), syntheticMapBytes({
    camera: { x: 79, y: 81 },
    heliport: { x: 72, y: 86 },
  }));
  const options = {
    routingQueuePoints: 15,
    routingDistancePoints: 1,
    routingNoStaffPoints: 20,
    disasterLaunch: 999,
  };
  writeFileSync(join(base, "LEVELS", "FULL01.SAM"), scenarioBytes({
    title: "Scenario Routing Distance",
    reputation: 300,
    balance: 1000,
    treatedPercentage: 40,
    cures: 10,
    hospitalValue: 55000,
    bankruptcy: -20000,
    reputationFailure: 200,
    deaths: 50,
    ...options,
  }));
  writeFileSync(join(base, "LEVELS", "FULL02.SAM"), scenarioBytes({
    title: "Scenario Routing Distance Two",
    reputation: 450,
    balance: 2500,
    treatedPercentage: 50,
    cures: 12,
    hospitalValue: 70000,
    bankruptcy: -25000,
    reputationFailure: 300,
    deaths: 40,
    expandedDiseases: true,
    ...options,
  }));
}

function writeScenarioStaffModifyFixtureSet() {
  writeFixtureSet("phase8-scenario-staff-modify", true);
  const base = join(fixtureRoot.pathname, "phase8-scenario-staff-modify");
  writeFileSync(join(base, "LEVELS", "LEVEL.L1"), syntheticMapBytes());
  writeFileSync(join(base, "LEVELS", "LEVEL.L2"), syntheticMapBytes({
    camera: { x: 79, y: 81 },
    heliport: { x: 72, y: 86 },
  }));
  const options = {
    crackUpTired: 100,
    modifyFrequency: 8,
    disasterLaunch: 999,
  };
  writeFileSync(join(base, "LEVELS", "FULL01.SAM"), scenarioBytes({
    title: "Scenario Staff Modify",
    reputation: 300,
    balance: 1000,
    treatedPercentage: 40,
    cures: 10,
    hospitalValue: 55000,
    bankruptcy: -20000,
    reputationFailure: 200,
    deaths: 50,
    ...options,
  }));
  writeFileSync(join(base, "LEVELS", "FULL02.SAM"), scenarioBytes({
    title: "Scenario Staff Modify Two",
    reputation: 450,
    balance: 2500,
    treatedPercentage: 50,
    cures: 12,
    hospitalValue: 70000,
    bankruptcy: -25000,
    reputationFailure: 300,
    deaths: 40,
    expandedDiseases: true,
    ...options,
  }));
}

function writeScenarioStaffWorkLightFixtureSet() {
  writeFixtureSet("phase8-scenario-staff-work-light", true);
  const base = join(fixtureRoot.pathname, "phase8-scenario-staff-work-light");
  writeFileSync(join(base, "LEVELS", "LEVEL.L1"), syntheticMapBytes());
  writeFileSync(join(base, "LEVELS", "LEVEL.L2"), syntheticMapBytes({
    camera: { x: 79, y: 81 },
    heliport: { x: 72, y: 86 },
  }));
  const options = {
    crackUpTired: 400,
    workLight: 2,
    modifyFrequency: 1,
    disasterLaunch: 999,
  };
  writeFileSync(join(base, "LEVELS", "FULL01.SAM"), scenarioBytes({
    title: "Scenario Staff Work Light",
    reputation: 300,
    balance: 1000,
    treatedPercentage: 40,
    cures: 10,
    hospitalValue: 55000,
    bankruptcy: -20000,
    reputationFailure: 200,
    deaths: 50,
    ...options,
  }));
  writeFileSync(join(base, "LEVELS", "FULL02.SAM"), scenarioBytes({
    title: "Scenario Staff Work Light Two",
    reputation: 450,
    balance: 2500,
    treatedPercentage: 50,
    cures: 12,
    hospitalValue: 70000,
    bankruptcy: -25000,
    reputationFailure: 300,
    deaths: 40,
    expandedDiseases: true,
    ...options,
  }));
}

function writeScenarioStaffResignFixtureSet() {
  writeFixtureSet("phase8-scenario-staff-resign", true);
  const base = join(fixtureRoot.pathname, "phase8-scenario-staff-resign");
  writeFileSync(join(base, "LEVELS", "LEVEL.L1"), syntheticMapBytes());
  writeFileSync(join(base, "LEVELS", "LEVEL.L2"), syntheticMapBytes({
    camera: { x: 79, y: 81 },
    heliport: { x: 72, y: 86 },
  }));
  const options = {
    crackUpTired: 100,
    recoveryMinimum: 1,
    resignMax: 150,
    workLight: 10,
    modifyFrequency: 1,
    disasterLaunch: 999,
  };
  writeFileSync(join(base, "LEVELS", "FULL01.SAM"), scenarioBytes({
    title: "Scenario Staff Resign",
    reputation: 300,
    balance: 1000,
    treatedPercentage: 40,
    cures: 10,
    hospitalValue: 55000,
    bankruptcy: -20000,
    reputationFailure: 200,
    deaths: 50,
    ...options,
  }));
  writeFileSync(join(base, "LEVELS", "FULL02.SAM"), scenarioBytes({
    title: "Scenario Staff Resign Two",
    reputation: 450,
    balance: 2500,
    treatedPercentage: 50,
    cures: 12,
    hospitalValue: 70000,
    bankruptcy: -25000,
    reputationFailure: 300,
    deaths: 40,
    expandedDiseases: true,
    ...options,
  }));
}

function writeScenarioStaffFatigueThresholdFixtureSet() {
  writeFixtureSet("phase8-scenario-staff-fatigue-threshold", true);
  const base = join(fixtureRoot.pathname, "phase8-scenario-staff-fatigue-threshold");
  writeFileSync(join(base, "LEVELS", "LEVEL.L1"), syntheticMapBytes());
  writeFileSync(join(base, "LEVELS", "LEVEL.L2"), syntheticMapBytes({
    camera: { x: 79, y: 81 },
    heliport: { x: 72, y: 86 },
  }));
  const options = {
    notTired: 50,
    tired: 100,
    veryTired: 200,
    crackUpTired: 9900,
    workLight: 10,
    modifyFrequency: 1,
    disasterLaunch: 999,
  };
  writeFileSync(join(base, "LEVELS", "FULL01.SAM"), scenarioBytes({
    title: "Scenario Staff Fatigue Threshold",
    reputation: 300,
    balance: 1000,
    treatedPercentage: 40,
    cures: 10,
    hospitalValue: 55000,
    bankruptcy: -20000,
    reputationFailure: 200,
    deaths: 50,
    ...options,
  }));
  writeFileSync(join(base, "LEVELS", "FULL02.SAM"), scenarioBytes({
    title: "Scenario Staff Fatigue Threshold Two",
    reputation: 450,
    balance: 2500,
    treatedPercentage: 50,
    cures: 12,
    hospitalValue: 70000,
    bankruptcy: -25000,
    reputationFailure: 300,
    deaths: 40,
    expandedDiseases: true,
    ...options,
  }));
}

function writeScenarioStaffRestStandingFixtureSet() {
  writeFixtureSet("phase8-scenario-staff-rest-standing", true);
  const base = join(fixtureRoot.pathname, "phase8-scenario-staff-rest-standing");
  writeFileSync(join(base, "LEVELS", "LEVEL.L1"), syntheticMapBytes());
  writeFileSync(join(base, "LEVELS", "LEVEL.L2"), syntheticMapBytes({
    camera: { x: 79, y: 81 },
    heliport: { x: 72, y: 86 },
  }));
  const options = {
    crackUpTired: 9900,
    restStanding: 50,
    workLight: 10,
    modifyFrequency: 1,
    disasterLaunch: 999,
  };
  writeFileSync(join(base, "LEVELS", "FULL01.SAM"), scenarioBytes({
    title: "Scenario Staff Rest Standing",
    reputation: 300,
    balance: 1000,
    treatedPercentage: 40,
    cures: 10,
    hospitalValue: 55000,
    bankruptcy: -20000,
    reputationFailure: 200,
    deaths: 50,
    ...options,
  }));
  writeFileSync(join(base, "LEVELS", "FULL02.SAM"), scenarioBytes({
    title: "Scenario Staff Rest Standing Two",
    reputation: 450,
    balance: 2500,
    treatedPercentage: 50,
    cures: 12,
    hospitalValue: 70000,
    bankruptcy: -25000,
    reputationFailure: 300,
    deaths: 40,
    expandedDiseases: true,
    ...options,
  }));
}

function writeScenarioStaffRecoveryFactorFixtureSet() {
  writeFixtureSet("phase8-scenario-staff-recovery-factor", true);
  const base = join(fixtureRoot.pathname, "phase8-scenario-staff-recovery-factor");
  writeFileSync(join(base, "LEVELS", "LEVEL.L1"), syntheticMapBytes());
  writeFileSync(join(base, "LEVELS", "LEVEL.L2"), syntheticMapBytes({
    camera: { x: 79, y: 81 },
    heliport: { x: 72, y: 86 },
  }));
  const options = {
    crackUpTired: 9900,
    recoveryFactor: 200,
    restStanding: 4,
    workLight: 10,
    modifyFrequency: 1,
    disasterLaunch: 999,
  };
  writeFileSync(join(base, "LEVELS", "FULL01.SAM"), scenarioBytes({
    title: "Scenario Staff Recovery Factor",
    reputation: 300,
    balance: 1000,
    treatedPercentage: 40,
    cures: 10,
    hospitalValue: 55000,
    bankruptcy: -20000,
    reputationFailure: 200,
    deaths: 50,
    ...options,
  }));
  writeFileSync(join(base, "LEVELS", "FULL02.SAM"), scenarioBytes({
    title: "Scenario Staff Recovery Factor Two",
    reputation: 450,
    balance: 2500,
    treatedPercentage: 50,
    cures: 12,
    hospitalValue: 70000,
    bankruptcy: -25000,
    reputationFailure: 300,
    deaths: 40,
    expandedDiseases: true,
    ...options,
  }));
}

function writeScenarioTrainingValuesFixtureSet() {
  writeFixtureSet("phase8-scenario-training-values", true);
  const base = join(fixtureRoot.pathname, "phase8-scenario-training-values");
  writeFileSync(join(base, "LEVELS", "LEVEL.L1"), syntheticMapBytes());
  writeFileSync(join(base, "LEVELS", "LEVEL.L2"), syntheticMapBytes({
    camera: { x: 79, y: 81 },
    heliport: { x: 72, y: 86 },
  }));
  const trainingOptions = {
    omitTrainingRate: true,
    trainingValues: [
      { index: 0, value: 60, name: "Projector" },
      { index: 1, value: 60, name: "Skeleton" },
    ],
  };
  writeFileSync(join(base, "LEVELS", "FULL01.SAM"), scenarioBytes({
    title: "Scenario Training Values",
    reputation: 300,
    balance: 1000,
    treatedPercentage: 40,
    cures: 10,
    hospitalValue: 55000,
    bankruptcy: -20000,
    reputationFailure: 200,
    deaths: 50,
    disasterLaunch: 999,
    ...trainingOptions,
  }));
  writeFileSync(join(base, "LEVELS", "FULL02.SAM"), scenarioBytes({
    title: "Scenario Training Values Two",
    reputation: 450,
    balance: 2500,
    treatedPercentage: 50,
    cures: 12,
    hospitalValue: 70000,
    bankruptcy: -25000,
    reputationFailure: 300,
    deaths: 40,
    expandedDiseases: true,
    disasterLaunch: 999,
    ...trainingOptions,
  }));
}

function writeScenarioTrainingPromotionFixtureSet() {
  writeFixtureSet("phase8-scenario-training-promotion", true);
  const base = join(fixtureRoot.pathname, "phase8-scenario-training-promotion");
  writeFileSync(join(base, "LEVELS", "LEVEL.L1"), syntheticMapBytes());
  writeFileSync(join(base, "LEVELS", "LEVEL.L2"), syntheticMapBytes({
    camera: { x: 79, y: 81 },
    heliport: { x: 72, y: 86 },
  }));
  const options = {
    promotionDoctorMonths: 1,
    promotionConsultantMonths: 4,
    disasterLaunch: 999,
  };
  writeFileSync(join(base, "LEVELS", "FULL01.SAM"), scenarioBytes({
    title: "Scenario Training Promotion",
    reputation: 300,
    balance: 1000,
    treatedPercentage: 40,
    cures: 10,
    hospitalValue: 55000,
    bankruptcy: -20000,
    reputationFailure: 200,
    deaths: 50,
    ...options,
  }));
  writeFileSync(join(base, "LEVELS", "FULL02.SAM"), scenarioBytes({
    title: "Scenario Training Promotion Two",
    reputation: 450,
    balance: 2500,
    treatedPercentage: 50,
    cures: 12,
    hospitalValue: 70000,
    bankruptcy: -25000,
    reputationFailure: 300,
    deaths: 40,
    ...options,
  }));
}

function writeScenarioTrainingThresholdFixtureSet() {
  writeFixtureSet("phase8-scenario-training-threshold", true);
  const base = join(fixtureRoot.pathname, "phase8-scenario-training-threshold");
  writeFileSync(join(base, "LEVELS", "LEVEL.L1"), syntheticMapBytes());
  writeFileSync(join(base, "LEVELS", "LEVEL.L2"), syntheticMapBytes({
    camera: { x: 79, y: 81 },
    heliport: { x: 72, y: 86 },
  }));
  const options = {
    doctorThreshold: 2000,
    consultantThreshold: 3000,
    disasterLaunch: 999,
  };
  writeFileSync(join(base, "LEVELS", "FULL01.SAM"), scenarioBytes({
    title: "Scenario Training Threshold",
    reputation: 300,
    balance: 1000,
    treatedPercentage: 40,
    cures: 10,
    hospitalValue: 55000,
    bankruptcy: -20000,
    reputationFailure: 200,
    deaths: 50,
    ...options,
  }));
  writeFileSync(join(base, "LEVELS", "FULL02.SAM"), scenarioBytes({
    title: "Scenario Training Threshold Two",
    reputation: 450,
    balance: 2500,
    treatedPercentage: 50,
    cures: 12,
    hospitalValue: 70000,
    bankruptcy: -25000,
    reputationFailure: 300,
    deaths: 40,
    expandedDiseases: true,
    ...options,
  }));
}

function writeScenarioStaffSpecialtyFixtureSet() {
  writeFixtureSet("phase8-scenario-staff-specialty", true);
  const base = join(fixtureRoot.pathname, "phase8-scenario-staff-specialty");
  writeFileSync(join(base, "LEVELS", "LEVEL.L1"), syntheticMapBytes());
  writeFileSync(join(base, "LEVELS", "LEVEL.L2"), syntheticMapBytes({
    camera: { x: 79, y: 81 },
    heliport: { x: 72, y: 86 },
  }));
  writeFileSync(join(base, "LEVELS", "FULL01.SAM"), scenarioBytes({
    title: "Scenario Staff Specialty",
    reputation: 300,
    balance: 1000,
    treatedPercentage: 40,
    cures: 10,
    hospitalValue: 55000,
    bankruptcy: -20000,
    reputationFailure: 200,
    deaths: 50,
    omitAbilityThresholds: true,
    doctorCount: 3,
    shrinkRate: 0,
    surgeonRate: 0,
    researcherRate: 100,
    consultantRate: 0,
    juniorRate: 0,
    disasterLaunch: 999,
  }));
  writeFileSync(join(base, "LEVELS", "FULL02.SAM"), scenarioBytes({
    title: "Scenario Staff Specialty Two",
    reputation: 450,
    balance: 2500,
    treatedPercentage: 50,
    cures: 12,
    hospitalValue: 70000,
    bankruptcy: -25000,
    reputationFailure: 300,
    deaths: 40,
    omitAbilityThresholds: true,
    doctorCount: 3,
    shrinkRate: 0,
    surgeonRate: 0,
    researcherRate: 100,
    consultantRate: 0,
    juniorRate: 0,
    expandedDiseases: true,
    disasterLaunch: 999,
  }));
}

function writeScenarioSkilledSalaryFixtureSet() {
  writeFixtureSet("phase8-scenario-skilled-salary", true);
  const base = join(fixtureRoot.pathname, "phase8-scenario-skilled-salary");
  writeFileSync(join(base, "LEVELS", "LEVEL.L1"), syntheticMapBytes());
  writeFileSync(join(base, "LEVELS", "LEVEL.L2"), syntheticMapBytes({
    camera: { x: 79, y: 81 },
    heliport: { x: 72, y: 86 },
  }));
  writeFileSync(join(base, "LEVELS", "FULL01.SAM"), scenarioBytes({
    title: "Scenario Skilled Salary",
    reputation: 300,
    balance: 1000,
    treatedPercentage: 40,
    cures: 10,
    hospitalValue: 55000,
    bankruptcy: -20000,
    reputationFailure: 200,
    deaths: 50,
    consultantRate: 100,
    juniorRate: 0,
    disasterLaunch: 999,
  }));
  writeFileSync(join(base, "LEVELS", "FULL02.SAM"), scenarioBytes({
    title: "Scenario Skilled Salary Two",
    reputation: 450,
    balance: 2500,
    treatedPercentage: 50,
    cures: 12,
    hospitalValue: 70000,
    bankruptcy: -25000,
    reputationFailure: 300,
    deaths: 40,
    expandedDiseases: true,
    consultantRate: 100,
    juniorRate: 0,
    disasterLaunch: 999,
  }));
}

function writeScenarioCustomSalaryBandsFixtureSet() {
  writeFixtureSet("phase8-scenario-custom-salary-bands", true);
  const base = join(fixtureRoot.pathname, "phase8-scenario-custom-salary-bands");
  writeFileSync(join(base, "LEVELS", "LEVEL.L1"), syntheticMapBytes());
  writeFileSync(join(base, "LEVELS", "LEVEL.L2"), syntheticMapBytes({
    camera: { x: 79, y: 81 },
    heliport: { x: 72, y: 86 },
  }));
  const options = {
    consultantRate: 100,
    juniorRate: 0,
    salaryAbilityDivisor: 5,
    salaryAdds: [
      { index: 3, value: 20, name: "Junior" },
      { index: 7, value: 140, name: "Consultant" },
    ],
    disasterLaunch: 999,
  };
  writeFileSync(join(base, "LEVELS", "FULL01.SAM"), scenarioBytes({
    title: "Scenario Custom Salary Bands",
    reputation: 300,
    balance: 1000,
    treatedPercentage: 40,
    cures: 10,
    hospitalValue: 55000,
    bankruptcy: -20000,
    reputationFailure: 200,
    deaths: 50,
    ...options,
  }));
  writeFileSync(join(base, "LEVELS", "FULL02.SAM"), scenarioBytes({
    title: "Scenario Custom Salary Bands Two",
    reputation: 450,
    balance: 2500,
    treatedPercentage: 50,
    cures: 12,
    hospitalValue: 70000,
    bankruptcy: -25000,
    reputationFailure: 300,
    deaths: 40,
    expandedDiseases: true,
    ...options,
  }));
}

function writeScenarioStaffRoomRestFixtureSet() {
  writeFixtureSet("phase8-scenario-staff-room-rest", true);
  const base = join(fixtureRoot.pathname, "phase8-scenario-staff-room-rest");
  writeFileSync(join(base, "LEVELS", "LEVEL.L1"), syntheticMapBytes());
  writeFileSync(join(base, "LEVELS", "LEVEL.L2"), syntheticMapBytes({
    camera: { x: 79, y: 81 },
    heliport: { x: 72, y: 86 },
  }));
  const options = {
    crackUpTired: 9900,
    restStanding: 1,
    restSofa: 2,
    restGame: 3,
    restSnooker: 4,
    workLight: 10,
    modifyFrequency: 1,
    disasterLaunch: 999,
  };
  writeFileSync(join(base, "LEVELS", "FULL01.SAM"), scenarioBytes({
    title: "Scenario Staff Room Rest",
    reputation: 300,
    balance: 1000,
    treatedPercentage: 40,
    cures: 10,
    hospitalValue: 55000,
    bankruptcy: -20000,
    reputationFailure: 200,
    deaths: 50,
    ...options,
  }));
  writeFileSync(join(base, "LEVELS", "FULL02.SAM"), scenarioBytes({
    title: "Scenario Staff Room Rest Two",
    reputation: 450,
    balance: 2500,
    treatedPercentage: 50,
    cures: 12,
    hospitalValue: 70000,
    bankruptcy: -25000,
    reputationFailure: 300,
    deaths: 40,
    expandedDiseases: true,
    ...options,
  }));
}

function writeScenarioSalaryThresholdFixtureSet() {
  writeFixtureSet("phase8-scenario-salary-threshold", true);
  const base = join(fixtureRoot.pathname, "phase8-scenario-salary-threshold");
  writeFileSync(join(base, "LEVELS", "LEVEL.L1"), syntheticMapBytes());
  writeFileSync(join(base, "LEVELS", "LEVEL.L2"), syntheticMapBytes({
    camera: { x: 79, y: 81 },
    heliport: { x: 72, y: 86 },
  }));
  const options = {
    consultantRate: 100,
    juniorRate: 0,
    salaryTooHigh: 1000,
    disasterLaunch: 999,
  };
  writeFileSync(join(base, "LEVELS", "FULL01.SAM"), scenarioBytes({
    title: "Scenario Salary Threshold",
    reputation: 300,
    balance: 1000,
    treatedPercentage: 40,
    cures: 10,
    hospitalValue: 55000,
    bankruptcy: -20000,
    reputationFailure: 200,
    deaths: 50,
    ...options,
  }));
  writeFileSync(join(base, "LEVELS", "FULL02.SAM"), scenarioBytes({
    title: "Scenario Salary Threshold Two",
    reputation: 450,
    balance: 2500,
    treatedPercentage: 50,
    cures: 12,
    hospitalValue: 70000,
    bankruptcy: -25000,
    reputationFailure: 300,
    deaths: 40,
    expandedDiseases: true,
    ...options,
  }));
}

function writeScenarioSalaryTooLowFixtureSet() {
  writeFixtureSet("phase8-scenario-salary-too-low", true);
  const base = join(fixtureRoot.pathname, "phase8-scenario-salary-too-low");
  writeFileSync(join(base, "LEVELS", "LEVEL.L1"), syntheticMapBytes());
  writeFileSync(join(base, "LEVELS", "LEVEL.L2"), syntheticMapBytes({
    camera: { x: 79, y: 81 },
    heliport: { x: 72, y: 86 },
  }));
  const options = {
    salaryTooLow: 0,
    disasterLaunch: 999,
  };
  writeFileSync(join(base, "LEVELS", "FULL01.SAM"), scenarioBytes({
    title: "Scenario Salary Too Low",
    reputation: 300,
    balance: 1000,
    treatedPercentage: 40,
    cures: 10,
    hospitalValue: 55000,
    bankruptcy: -20000,
    reputationFailure: 200,
    deaths: 50,
    ...options,
  }));
  writeFileSync(join(base, "LEVELS", "FULL02.SAM"), scenarioBytes({
    title: "Scenario Salary Too Low Two",
    reputation: 450,
    balance: 2500,
    treatedPercentage: 50,
    cures: 12,
    hospitalValue: 70000,
    bankruptcy: -25000,
    reputationFailure: 300,
    deaths: 40,
    expandedDiseases: true,
    ...options,
  }));
}

function writeScenarioStaffWagesFixtureSet() {
  writeFixtureSet("phase8-scenario-staff-wages", true);
  const base = join(fixtureRoot.pathname, "phase8-scenario-staff-wages");
  writeFileSync(join(base, "LEVELS", "LEVEL.L1"), syntheticMapBytes());
  writeFileSync(join(base, "LEVELS", "LEVEL.L2"), syntheticMapBytes({
    camera: { x: 79, y: 81 },
    heliport: { x: 72, y: 86 },
  }));
  const staffMinimumSalaries = {
    nurse: 70,
    diagnostician: 80,
    handyman: 90,
    receptionist: 80,
  };
  writeFileSync(join(base, "LEVELS", "FULL01.SAM"), scenarioBytes({
    title: "Scenario Staff Wages",
    reputation: 300,
    balance: 1000,
    treatedPercentage: 40,
    cures: 10,
    hospitalValue: 55000,
    bankruptcy: -20000,
    reputationFailure: 200,
    deaths: 50,
    staffMinimumSalaries,
    disasterLaunch: 999,
  }));
  writeFileSync(join(base, "LEVELS", "FULL02.SAM"), scenarioBytes({
    title: "Scenario Staff Wages Two",
    reputation: 450,
    balance: 2500,
    treatedPercentage: 50,
    cures: 12,
    hospitalValue: 70000,
    bankruptcy: -25000,
    reputationFailure: 300,
    deaths: 40,
    expandedDiseases: true,
    staffMinimumSalaries,
    disasterLaunch: 999,
  }));
}

function writeScenarioCleanlinessAwardFixtureSet() {
  writeFixtureSet("phase8-scenario-cleanliness-award", true);
  const base = join(fixtureRoot.pathname, "phase8-scenario-cleanliness-award");
  writeFileSync(join(base, "LEVELS", "LEVEL.L1"), syntheticMapBytes());
  writeFileSync(join(base, "LEVELS", "LEVEL.L2"), syntheticMapBytes({
    camera: { x: 79, y: 81 },
    heliport: { x: 72, y: 86 },
  }));
  writeFileSync(join(base, "LEVELS", "FULL01.SAM"), scenarioBytes({
    title: "Scenario Cleanliness Award",
    reputation: 300,
    balance: 1000,
    treatedPercentage: 40,
    cures: 10,
    hospitalValue: 55000,
    bankruptcy: -20000,
    reputationFailure: 200,
    deaths: 50,
    litterDrop: 1,
    litterRandom: 1,
    cleanlinessAward: 5,
    cleanlinessPoor: 40,
    cleanlinessBonus: 6,
    cleanlinessPenalty: -3,
    awardCures: 0,
    awardReputation: 0,
    awardHospitalValue: 0,
    disasterLaunch: 999,
  }));
  writeFileSync(join(base, "LEVELS", "FULL02.SAM"), scenarioBytes({
    title: "Scenario Cleanliness Award Two",
    reputation: 450,
    balance: 2500,
    treatedPercentage: 50,
    cures: 12,
    hospitalValue: 70000,
    bankruptcy: -25000,
    reputationFailure: 300,
    deaths: 40,
    expandedDiseases: true,
    litterDrop: 1,
    litterRandom: 1,
    cleanlinessAward: 5,
    cleanlinessPoor: 40,
    cleanlinessBonus: 6,
    cleanlinessPenalty: -3,
    awardCures: 0,
    awardReputation: 0,
    awardHospitalValue: 0,
    disasterLaunch: 999,
  }));
}

function writeScenarioPeepHappinessAwardFixtureSet() {
  writeFixtureSet("phase8-scenario-peep-happiness-award", true);
  const base = join(fixtureRoot.pathname, "phase8-scenario-peep-happiness-award");
  writeFileSync(join(base, "LEVELS", "LEVEL.L1"), syntheticMapBytes());
  writeFileSync(join(base, "LEVELS", "LEVEL.L2"), syntheticMapBytes({
    camera: { x: 79, y: 81 },
    heliport: { x: 72, y: 86 },
  }));
  writeFileSync(join(base, "LEVELS", "FULL01.SAM"), scenarioBytes({
    title: "Scenario Peep Happiness Award",
    reputation: 300,
    balance: 1000,
    treatedPercentage: 40,
    cures: 10,
    hospitalValue: 55000,
    bankruptcy: -20000,
    reputationFailure: 200,
    deaths: 50,
    peepHappinessAward: 75,
    peepHappinessPoor: 25,
    peepHappinessBonus: 4,
    peepHappinessPenalty: -2,
    awardCures: 0,
    awardReputation: 0,
    awardHospitalValue: 0,
    disasterLaunch: 999,
  }));
  writeFileSync(join(base, "LEVELS", "FULL02.SAM"), scenarioBytes({
    title: "Scenario Peep Happiness Award Two",
    reputation: 450,
    balance: 2500,
    treatedPercentage: 50,
    cures: 12,
    hospitalValue: 70000,
    bankruptcy: -25000,
    reputationFailure: 300,
    deaths: 40,
    expandedDiseases: true,
    peepHappinessAward: 75,
    peepHappinessPoor: 25,
    peepHappinessBonus: 4,
    peepHappinessPenalty: -2,
    awardCures: 0,
    awardReputation: 0,
    awardHospitalValue: 0,
    disasterLaunch: 999,
  }));
}

function writeScenarioWaitingTimesAwardFixtureSet() {
  writeFixtureSet("phase8-scenario-waiting-times-award", true);
  const base = join(fixtureRoot.pathname, "phase8-scenario-waiting-times-award");
  writeFileSync(join(base, "LEVELS", "LEVEL.L1"), syntheticMapBytes());
  writeFileSync(join(base, "LEVELS", "LEVEL.L2"), syntheticMapBytes({
    camera: { x: 79, y: 81 },
    heliport: { x: 72, y: 86 },
  }));
  writeFileSync(join(base, "LEVELS", "FULL01.SAM"), scenarioBytes({
    title: "Scenario Waiting Times Award",
    reputation: 300,
    balance: 1000,
    treatedPercentage: 40,
    cures: 10,
    hospitalValue: 55000,
    bankruptcy: -20000,
    reputationFailure: 200,
    deaths: 50,
    leaveMax: 3,
    waitingTimesAward: 25,
    waitingTimesPoor: 75,
    waitingTimesBonus: 2,
    waitingTimesPenalty: -1,
    awardCures: 0,
    awardReputation: 0,
    awardHospitalValue: 0,
    disasterLaunch: 999,
  }));
  writeFileSync(join(base, "LEVELS", "FULL02.SAM"), scenarioBytes({
    title: "Scenario Waiting Times Award Two",
    reputation: 450,
    balance: 2500,
    treatedPercentage: 50,
    cures: 12,
    hospitalValue: 70000,
    bankruptcy: -25000,
    reputationFailure: 300,
    deaths: 40,
    expandedDiseases: true,
    leaveMax: 3,
    waitingTimesAward: 25,
    waitingTimesPoor: 75,
    waitingTimesBonus: 2,
    waitingTimesPenalty: -1,
    awardCures: 0,
    awardReputation: 0,
    awardHospitalValue: 0,
    disasterLaunch: 999,
  }));
}

function writeScenarioStaffHappinessAwardFixtureSet() {
  writeFixtureSet("phase8-scenario-staff-happiness-award", true);
  const base = join(fixtureRoot.pathname, "phase8-scenario-staff-happiness-award");
  writeFileSync(join(base, "LEVELS", "LEVEL.L1"), syntheticMapBytes());
  writeFileSync(join(base, "LEVELS", "LEVEL.L2"), syntheticMapBytes({
    camera: { x: 79, y: 81 },
    heliport: { x: 72, y: 86 },
  }));
  writeFileSync(join(base, "LEVELS", "FULL01.SAM"), scenarioBytes({
    title: "Scenario Staff Happiness Award",
    reputation: 300,
    balance: 1000,
    treatedPercentage: 40,
    cures: 10,
    hospitalValue: 55000,
    bankruptcy: -20000,
    reputationFailure: 200,
    deaths: 50,
    workLight: 10,
    modifyFrequency: 1,
    crackUpTired: 10000,
    staffHappinessAward: 75,
    staffHappinessPoor: 50,
    awardStaffHappinessBonus: 4,
    awardStaffHappinessPenalty: -2,
    awardCures: 0,
    awardReputation: 0,
    awardHospitalValue: 0,
    disasterLaunch: 999,
  }));
  writeFileSync(join(base, "LEVELS", "FULL02.SAM"), scenarioBytes({
    title: "Scenario Staff Happiness Award Two",
    reputation: 450,
    balance: 2500,
    treatedPercentage: 50,
    cures: 12,
    hospitalValue: 70000,
    bankruptcy: -25000,
    reputationFailure: 300,
    deaths: 40,
    expandedDiseases: true,
    workLight: 10,
    modifyFrequency: 1,
    crackUpTired: 10000,
    staffHappinessAward: 75,
    staffHappinessPoor: 50,
    awardStaffHappinessBonus: 4,
    awardStaffHappinessPenalty: -2,
    awardCures: 0,
    awardReputation: 0,
    awardHospitalValue: 0,
    disasterLaunch: 999,
  }));
}

function writeScenarioWellKeptTechAwardFixtureSet() {
  writeFixtureSet("phase8-scenario-well-kept-tech-award", true);
  const base = join(fixtureRoot.pathname, "phase8-scenario-well-kept-tech-award");
  writeFileSync(join(base, "LEVELS", "LEVEL.L1"), syntheticMapBytes());
  writeFileSync(join(base, "LEVELS", "LEVEL.L2"), syntheticMapBytes({
    camera: { x: 79, y: 81 },
    heliport: { x: 72, y: 86 },
  }));
  writeFileSync(join(base, "LEVELS", "FULL01.SAM"), scenarioBytes({
    title: "Scenario Well Kept Tech Award",
    reputation: 300,
    balance: 1000,
    treatedPercentage: 40,
    cures: 10,
    hospitalValue: 55000,
    bankruptcy: -20000,
    reputationFailure: 200,
    deaths: 50,
    wellKeptTechAward: 20,
    wellKeptTechPoor: 70,
    wellKeptTechBonus: 7,
    wellKeptTechPenalty: -3,
    awardCures: 0,
    awardReputation: 0,
    awardHospitalValue: 0,
    disasterLaunch: 999,
  }));
  writeFileSync(join(base, "LEVELS", "FULL02.SAM"), scenarioBytes({
    title: "Scenario Well Kept Tech Award Two",
    reputation: 450,
    balance: 2500,
    treatedPercentage: 50,
    cures: 12,
    hospitalValue: 70000,
    bankruptcy: -25000,
    reputationFailure: 300,
    deaths: 40,
    expandedDiseases: true,
    wellKeptTechAward: 20,
    wellKeptTechPoor: 70,
    wellKeptTechBonus: 7,
    wellKeptTechPenalty: -3,
    awardCures: 0,
    awardReputation: 0,
    awardHospitalValue: 0,
    disasterLaunch: 999,
  }));
}

function writeScenarioNewTechAwardFixtureSet() {
  writeFixtureSet("phase8-scenario-new-tech-award", true);
  const base = join(fixtureRoot.pathname, "phase8-scenario-new-tech-award");
  writeFileSync(join(base, "LEVELS", "LEVEL.L1"), syntheticMapBytes());
  writeFileSync(join(base, "LEVELS", "LEVEL.L2"), syntheticMapBytes({
    camera: { x: 79, y: 81 },
    heliport: { x: 72, y: 86 },
  }));
  writeFileSync(join(base, "LEVELS", "FULL01.SAM"), scenarioBytes({
    title: "Scenario New Tech Award",
    reputation: 300,
    balance: 1000,
    treatedPercentage: 40,
    cures: 10,
    hospitalValue: 55000,
    bankruptcy: -20000,
    reputationFailure: 200,
    deaths: 50,
    researchStartCost: 1000,
    newTechAward: 2000,
    newTechPoor: 1500,
    researchBonus: 5,
    researchPenalty: -2,
    awardCures: 0,
    awardReputation: 0,
    awardHospitalValue: 0,
    disasterLaunch: 999,
  }));
  writeFileSync(join(base, "LEVELS", "FULL02.SAM"), scenarioBytes({
    title: "Scenario New Tech Award Two",
    reputation: 450,
    balance: 2500,
    treatedPercentage: 50,
    cures: 12,
    hospitalValue: 70000,
    bankruptcy: -25000,
    reputationFailure: 300,
    deaths: 40,
    expandedDiseases: true,
    researchStartCost: 1000,
    newTechAward: 2000,
    newTechPoor: 1500,
    researchBonus: 5,
    researchPenalty: -2,
    awardCures: 0,
    awardReputation: 0,
    awardHospitalValue: 0,
    disasterLaunch: 999,
  }));
}

function writeScenarioEmergencyAwardFixtureSet() {
  writeFixtureSet("phase8-scenario-emergency-award", true);
  const base = join(fixtureRoot.pathname, "phase8-scenario-emergency-award");
  writeFileSync(join(base, "LEVELS", "LEVEL.L1"), syntheticMapBytes());
  writeFileSync(join(base, "LEVELS", "LEVEL.L2"), syntheticMapBytes({
    camera: { x: 79, y: 81 },
    heliport: { x: 72, y: 86 },
  }));
  writeFileSync(join(base, "LEVELS", "FULL01.SAM"), scenarioBytes({
    title: "Scenario Emergency Award",
    reputation: 300,
    balance: 1000,
    treatedPercentage: 40,
    cures: 10,
    hospitalValue: 55000,
    bankruptcy: -20000,
    reputationFailure: 200,
    deaths: 50,
    emergencyAward: 90,
    emergencyPoor: 75,
    emergencyBonus: 7,
    emergencyPenalty: -3,
    emergencyMinPatients: 4,
    emergencyMaxPatients: 4,
    emergencyPercentToWin: 75,
    secondEmergency: true,
    awardCures: 0,
    awardReputation: 0,
    awardHospitalValue: 0,
    disasterLaunch: 999,
  }));
  writeFileSync(join(base, "LEVELS", "FULL02.SAM"), scenarioBytes({
    title: "Scenario Emergency Award Two",
    reputation: 450,
    balance: 2500,
    treatedPercentage: 50,
    cures: 12,
    hospitalValue: 70000,
    bankruptcy: -25000,
    reputationFailure: 300,
    deaths: 40,
    expandedDiseases: true,
    emergencyAward: 90,
    emergencyPoor: 75,
    emergencyBonus: 7,
    emergencyPenalty: -3,
    emergencyMinPatients: 4,
    emergencyMaxPatients: 4,
    emergencyPercentToWin: 75,
    secondEmergency: true,
    awardCures: 0,
    awardReputation: 0,
    awardHospitalValue: 0,
    disasterLaunch: 999,
  }));
}

function writeScenarioPopulationAwardFixtureSet() {
  writeFixtureSet("phase8-scenario-population-award", true);
  const base = join(fixtureRoot.pathname, "phase8-scenario-population-award");
  writeFileSync(join(base, "LEVELS", "LEVEL.L1"), syntheticMapBytes());
  writeFileSync(join(base, "LEVELS", "LEVEL.L2"), syntheticMapBytes({
    camera: { x: 79, y: 81 },
    heliport: { x: 72, y: 86 },
  }));
  writeFileSync(join(base, "LEVELS", "FULL01.SAM"), scenarioBytes({
    title: "Scenario Population Award",
    reputation: 300,
    balance: 1000,
    treatedPercentage: 40,
    cures: 10,
    hospitalValue: 55000,
    bankruptcy: -20000,
    reputationFailure: 200,
    deaths: 50,
    populationPercentageAward: 75,
    populationPercentagePoor: 50,
    populationPercentageBonus: 6,
    populationPercentagePenalty: -3,
    awardCures: 0,
    awardReputation: 0,
    awardHospitalValue: 0,
    disasterLaunch: 999,
  }));
  writeFileSync(join(base, "LEVELS", "FULL02.SAM"), scenarioBytes({
    title: "Scenario Population Award Two",
    reputation: 450,
    balance: 2500,
    treatedPercentage: 50,
    cures: 12,
    hospitalValue: 70000,
    bankruptcy: -25000,
    reputationFailure: 300,
    deaths: 40,
    expandedDiseases: true,
    populationPercentageAward: 75,
    populationPercentagePoor: 50,
    populationPercentageBonus: 6,
    populationPercentagePenalty: -3,
    awardCures: 0,
    awardReputation: 0,
    awardHospitalValue: 0,
    disasterLaunch: 999,
  }));
}

function writeScenarioCuresVDeathsAwardFixtureSet() {
  writeFixtureSet("phase8-scenario-cures-v-deaths-award", true);
  const base = join(fixtureRoot.pathname, "phase8-scenario-cures-v-deaths-award");
  writeFileSync(join(base, "LEVELS", "LEVEL.L1"), syntheticMapBytes());
  writeFileSync(join(base, "LEVELS", "LEVEL.L2"), syntheticMapBytes({
    camera: { x: 79, y: 81 },
    heliport: { x: 72, y: 86 },
  }));
  writeFileSync(join(base, "LEVELS", "FULL01.SAM"), scenarioBytes({
    title: "Scenario Cures Deaths Award",
    reputation: 300,
    balance: 1000,
    treatedPercentage: 40,
    cures: 10,
    hospitalValue: 55000,
    bankruptcy: -20000,
    reputationFailure: 200,
    deaths: 50,
    curesVDeathsAward: 0,
    curesVDeathsPoor: 2,
    curesVDeathsBonus: 1200,
    curesVDeathsPenalty: -300,
    awardCures: 0,
    awardReputation: 0,
    awardHospitalValue: 0,
    disasterLaunch: 999,
  }));
  writeFileSync(join(base, "LEVELS", "FULL02.SAM"), scenarioBytes({
    title: "Scenario Cures Deaths Award Two",
    reputation: 450,
    balance: 2500,
    treatedPercentage: 50,
    cures: 12,
    hospitalValue: 70000,
    bankruptcy: -25000,
    reputationFailure: 300,
    deaths: 40,
    expandedDiseases: true,
    curesVDeathsAward: 0,
    curesVDeathsPoor: 2,
    curesVDeathsBonus: 1200,
    curesVDeathsPenalty: -300,
    awardCures: 0,
    awardReputation: 0,
    awardHospitalValue: 0,
    disasterLaunch: 999,
  }));
}

function writeScenarioCansOfCokeAwardFixtureSet() {
  writeFixtureSet("phase8-scenario-cans-of-coke-award", true);
  const base = join(fixtureRoot.pathname, "phase8-scenario-cans-of-coke-award");
  writeFileSync(join(base, "LEVELS", "LEVEL.L1"), syntheticMapBytes());
  writeFileSync(join(base, "LEVELS", "LEVEL.L2"), syntheticMapBytes({
    camera: { x: 79, y: 81 },
    heliport: { x: 72, y: 86 },
  }));
  writeFileSync(join(base, "LEVELS", "FULL01.SAM"), scenarioBytes({
    title: "Scenario Cans Of Coke Award",
    reputation: 300,
    balance: 1000,
    treatedPercentage: 40,
    cures: 10,
    hospitalValue: 55000,
    bankruptcy: -20000,
    reputationFailure: 200,
    deaths: 50,
    cansofCoke: 1,
    cansofCokeBonus: 900,
    drinkHappy: 3,
    awardCures: 0,
    awardReputation: 0,
    awardHospitalValue: 0,
    disasterLaunch: 999,
  }));
  writeFileSync(join(base, "LEVELS", "FULL02.SAM"), scenarioBytes({
    title: "Scenario Cans Of Coke Award Two",
    reputation: 450,
    balance: 2500,
    treatedPercentage: 50,
    cures: 12,
    hospitalValue: 70000,
    bankruptcy: -25000,
    reputationFailure: 300,
    deaths: 40,
    expandedDiseases: true,
    cansofCoke: 1,
    cansofCokeBonus: 900,
    drinkHappy: 3,
    awardCures: 0,
    awardReputation: 0,
    awardHospitalValue: 0,
    disasterLaunch: 999,
  }));
}

function writeScenarioRatAwardFixtureSet() {
  writeFixtureSet("phase8-scenario-rat-award", true);
  const base = join(fixtureRoot.pathname, "phase8-scenario-rat-award");
  writeFileSync(join(base, "LEVELS", "LEVEL.L1"), syntheticMapBytes());
  writeFileSync(join(base, "LEVELS", "LEVEL.L2"), syntheticMapBytes({
    camera: { x: 79, y: 81 },
    heliport: { x: 72, y: 86 },
  }));
  writeFileSync(join(base, "LEVELS", "FULL01.SAM"), scenarioBytes({
    title: "Scenario Rat Award",
    reputation: 300,
    balance: 1000,
    treatedPercentage: 40,
    cures: 10,
    hospitalValue: 55000,
    bankruptcy: -20000,
    reputationFailure: 200,
    deaths: 50,
    ratKillsAbsolute: 3,
    ratKillsPercentage: 75,
    ratKillsAbsoluteBonus: 5,
    ratKillsPercentageBonus: 5000,
    awardCures: 0,
    awardReputation: 0,
    awardHospitalValue: 0,
    disasterLaunch: 999,
  }));
  writeFileSync(join(base, "LEVELS", "FULL02.SAM"), scenarioBytes({
    title: "Scenario Rat Award Two",
    reputation: 450,
    balance: 2500,
    treatedPercentage: 50,
    cures: 12,
    hospitalValue: 70000,
    bankruptcy: -25000,
    reputationFailure: 300,
    deaths: 40,
    expandedDiseases: true,
    ratKillsAbsolute: 3,
    ratKillsPercentage: 75,
    ratKillsAbsoluteBonus: 5,
    ratKillsPercentageBonus: 5000,
    awardCures: 0,
    awardReputation: 0,
    awardHospitalValue: 0,
    disasterLaunch: 999,
  }));
}

function writeScenarioPlantAwardFixtureSet() {
  writeFixtureSet("phase8-scenario-plant-award", true);
  const base = join(fixtureRoot.pathname, "phase8-scenario-plant-award");
  writeFileSync(join(base, "LEVELS", "LEVEL.L1"), syntheticMapBytes());
  writeFileSync(join(base, "LEVELS", "LEVEL.L2"), syntheticMapBytes({
    camera: { x: 79, y: 81 },
    heliport: { x: 72, y: 86 },
  }));
  writeFileSync(join(base, "LEVELS", "FULL01.SAM"), scenarioBytes({
    title: "Scenario Plant Award",
    reputation: 300,
    balance: 1000,
    treatedPercentage: 40,
    cures: 10,
    hospitalValue: 55000,
    bankruptcy: -20000,
    reputationFailure: 200,
    deaths: 50,
    plant: 80,
    plantBonus: 5,
    awardCures: 0,
    awardReputation: 0,
    awardHospitalValue: 0,
    disasterLaunch: 999,
  }));
  writeFileSync(join(base, "LEVELS", "FULL02.SAM"), scenarioBytes({
    title: "Scenario Plant Award Two",
    reputation: 450,
    balance: 2500,
    treatedPercentage: 50,
    cures: 12,
    hospitalValue: 70000,
    bankruptcy: -25000,
    reputationFailure: 300,
    deaths: 40,
    expandedDiseases: true,
    plant: 80,
    plantBonus: 5,
    awardCures: 0,
    awardReputation: 0,
    awardHospitalValue: 0,
    disasterLaunch: 999,
  }));
}

function writeScenarioMayorAwardFixtureSet() {
  writeFixtureSet("phase8-scenario-mayor-award", true);
  const base = join(fixtureRoot.pathname, "phase8-scenario-mayor-award");
  writeFileSync(join(base, "LEVELS", "LEVEL.L1"), syntheticMapBytes());
  writeFileSync(join(base, "LEVELS", "LEVEL.L2"), syntheticMapBytes({
    camera: { x: 79, y: 81 },
    heliport: { x: 72, y: 86 },
  }));
  writeFileSync(join(base, "LEVELS", "FULL01.SAM"), scenarioBytes({
    title: "Scenario Mayor Award",
    reputation: 300,
    balance: 1000,
    treatedPercentage: 40,
    cures: 10,
    hospitalValue: 55000,
    bankruptcy: -20000,
    reputationFailure: 200,
    deaths: 50,
    trophyMayor: 0,
    trophyMayorBonus: 8,
    mayorLaunch: 999,
    awardCures: 0,
    awardReputation: 0,
    awardHospitalValue: 0,
    disasterLaunch: 999,
  }));
  writeFileSync(join(base, "LEVELS", "FULL02.SAM"), scenarioBytes({
    title: "Scenario Mayor Award Two",
    reputation: 450,
    balance: 2500,
    treatedPercentage: 50,
    cures: 12,
    hospitalValue: 70000,
    bankruptcy: -25000,
    reputationFailure: 300,
    deaths: 40,
    expandedDiseases: true,
    trophyMayor: 0,
    trophyMayorBonus: 8,
    mayorLaunch: 999,
    awardCures: 0,
    awardReputation: 0,
    awardHospitalValue: 0,
    disasterLaunch: 999,
  }));
}

function scenarioBytes(options) {
  const expandedVisualDiseases = options.expandedDiseases
    ? "#visuals[5] 3 I_SLACK_TONGUE\n#visuals[11] 3 I_SLEEPING_ILLNESS\n"
    : "";
  const expandedNonVisualDiseases = options.expandedDiseases
    ? "#non_visuals[17] 5 I_GUT_ROT\n"
    : "";
  const trainingValues = options.trainingValues ?? [
    { index: 0, value: 10, name: "Projector" },
    { index: 1, value: 15, name: "Skeleton" },
  ];
  const trainingValueLines = trainingValues
    .map((entry) => `#gbv.TrainingValue[${entry.index}] ${entry.value} ${entry.name}`)
    .join("\n");
  const opponentLines = options.opponentLines?.join("\n") ?? `#computer[0].Skill.StaffLevels.Luck.Speed.Comfort.GuessAt.Playing 3 4 3 30 7 90 1 ORAC
#computer[1].Skill.StaffLevels.Luck.Speed.Comfort.GuessAt.Playing 2 5 2 50 5 75 1 COLOSSUS`;
  const staffLevelLines = options.staffLevelLines?.join("\n") ?? `#staff_levels[0].Month.Nurses.Doctors.Handymen.Receptionists.Seed.ShrkRate.SurgRate.RschRate.ConsRate.JrRate 0 8 ${options.doctorCount ?? 8} 3 8 4953 ${options.shrinkRate ?? 3} ${options.surgeonRate ?? 0} ${options.researcherRate ?? 0} ${options.consultantRate ?? 0} ${options.juniorRate ?? 10}
#staff_levels[1].Month.Nurses.Doctors.Handymen.Receptionists.Seed.ShrkRate.SurgRate.RschRate.ConsRate.JrRate 1 7 6 5 6 8654 4 0 0 0 10`;
  const objectLines = options.objectLines?.join("\n") ?? `#objects[9].StartAvail.WhenAvail.StartStrength.AvailableForLevel ${options.specialistStartAvailable === false ? 0 : 1} ${options.specialistWhenAvailable ?? 0} ${options.specialistStartStrength ?? 12} 1 9 Inflator Machine
${options.diagnosisStartStrength !== undefined ? `#objects[13].StartAvail.WhenAvail.StartStrength.AvailableForLevel 0 0 ${options.diagnosisStartStrength} 1 13 Cardiogram` : "#objects[13].StartAvail.WhenAvail.AvailableForLevel 0 0 1 13 Cardiogram"}`;
  const roomLines = options.roomLines?.join("\n") ?? `#rooms[7].Cost 2280 GP_OFFICE
#rooms[9].Cost 1700 WARD
#rooms[11].Cost 500 PHARMACY
#rooms[17].Cost 1500 INFLATOR`;
  const winCriteriaLines = options.winCriteriaLines?.join("\n") ?? `#win_criteria[0].Criteria.MaxMin.Value.Group.Bound 1 1 ${options.reputation} 1 0
#win_criteria[1].Criteria.MaxMin.Value.Group.Bound 2 1 ${options.balance} 1 0
#win_criteria[2].Criteria.MaxMin.Value.Group.Bound 3 1 ${options.treatedPercentage} 1 0
#win_criteria[3].Criteria.MaxMin.Value.Group.Bound 4 1 ${options.cures} 1 0
#win_criteria[4].Criteria.MaxMin.Value.Group.Bound 6 1 ${options.hospitalValue} 1 0`;
  const loseCriteriaLines = options.loseCriteriaLines?.join("\n") ?? `#lose_criteria[0].Criteria.MaxMin.Value.Group.Bound 2 0 ${options.bankruptcy} 2 0
#lose_criteria[1].Criteria.MaxMin.Value.Group.Bound 1 0 ${options.reputationFailure} 1 0
#lose_criteria[2].Criteria.MaxMin.Value.Group.Bound 5 1 ${options.deaths} 3 0`;
  const networkCriteriaLines = options.networkCriteriaLines?.join("\n") ?? `#net_criteria[0].Criteria.Value.Month.TimeToDo 3 1 2 4
#net_criteria[1].Criteria.Value.Month.TimeToDo 5 10000 21 4`;
  const diseaseLines = options.diseaseLines?.join("\n") ?? `#visuals[0] 5 I_BLOATY_HEAD
${expandedVisualDiseases}#non_visuals[0] 5 I_UNCOMMON_COLD
${expandedNonVisualDiseases}`;
  const populationLines = options.populationLines?.join("\n") ?? `#popn[0].Month.Change 0 3
#popn[1].Month.Change 1 0`;
  const expertiseLines = options.expertiseLines?.join("\n") ?? `#expertise[5].Known.RschReqd.MaxDiagDiff 1 10000 1 INVIS
#expertise[16].Known.RschReqd.MaxDiagDiff ${options.knownScenarioDiseases ? 1 : 0} 10000 100 UNCOMMON_COLD
${options.knownScenarioDiseases ? "#expertise[22].Known.RschReqd.MaxDiagDiff 1 10000 100 BLOATY_HEAD\n#expertise[29].Known.RschReqd.MaxDiagDiff 1 10000 100 SLACK_TONGUE" : ""}`;
  return `${options.title}
#towns[0].StartCash.IllRate.InterestRate ${options.startCash ?? 40000} ${options.illnessRate ?? 2} ${options.interestRate ?? 200} Default Town
#towns[1].StartCash.IllRate.InterestRate ${options.startCash ?? 40000} ${options.illnessRate ?? 2} ${options.interestRate ?? 200} Scenario Town
#gbv.HoldVisualMonths ${options.holdVisualMonths ?? 0}
#gbv.HoldVisualPeepCount ${options.holdVisualPeepCount ?? 2}
${options.expandedDiseases || options.researchPointsDivisor || options.researchStartRating !== undefined ? `#gbv.StartRating ${options.researchStartRating ?? (options.expandedDiseases ? 95 : 100)}\n` : ""}\
${options.expandedDiseases || options.researchPointsDivisor ? `#gbv.ResearchPointsDivisor ${options.researchPointsDivisor ?? 4}\n` : ""}\
${options.researchStartCost !== undefined ? `#gbv.StartCost ${options.researchStartCost}\n` : ""}\
${options.minDrugCost !== undefined ? `#gbv.MinDrugCost ${options.minDrugCost}\n` : ""}\
${options.drugImproveRate !== undefined ? `#gbv.DrugImproveRate ${options.drugImproveRate}\n` : ""}\
${options.maxObjectStrength !== undefined ? `#gbv.MaxObjectStrength ${options.maxObjectStrength}\n` : ""}\
${options.researchIncrement !== undefined ? `#gbv.ResearchIncrement ${options.researchIncrement}\n` : ""}\
${options.researchImproveCostPercent !== undefined ? `#gbv.RschImproveCostPercent ${options.researchImproveCostPercent}\n` : ""}\
${options.researchImproveIncrementPercent !== undefined ? `#gbv.RschImproveIncrementPercent ${options.researchImproveIncrementPercent}\n` : ""}\
${expertiseLines}
#expertise[38].Known.RschReqd 0 40000 I_D_CARDIO DIAGNOSIS
${opponentLines}
${winCriteriaLines}
${loseCriteriaLines}
${networkCriteriaLines}
#awards_trophies.CuresAward ${options.awardCures ?? options.cures}
${options.curesPoor !== undefined ? `#awards_trophies.CuresPoor ${options.curesPoor}\n` : ""}\
${options.curesBonus !== undefined ? `#awards_trophies.CuresBonus ${options.curesBonus}\n` : ""}\
${options.curesPenalty !== undefined ? `#awards_trophies.CuresPenalty ${options.curesPenalty}\n` : ""}\
#awards_trophies.ReputationAward ${options.awardReputation ?? 600}
${options.reputationPoor !== undefined ? `#awards_trophies.ReputationPoor ${options.reputationPoor}\n` : ""}\
${options.awardReputationBonus !== undefined ? `#awards_trophies.AwardReputationBonus ${options.awardReputationBonus}\n` : ""}\
${options.awardReputationPenalty !== undefined ? `#awards_trophies.AwardReputationPenalty ${options.awardReputationPenalty}\n` : ""}\
#awards_trophies.HospValueAward ${options.awardHospitalValue ?? options.hospitalValue}
${options.hospValuePoor !== undefined ? `#awards_trophies.HospValuePoor ${options.hospValuePoor}\n` : ""}\
${options.hospValueBonus !== undefined ? `#awards_trophies.HospValueBonus ${options.hospValueBonus}\n` : ""}\
${options.hospValuePenalty !== undefined ? `#awards_trophies.HospValuePenalty ${options.hospValuePenalty}\n` : ""}\
${options.deathsAward !== undefined ? `#awards_trophies.DeathsAward ${options.deathsAward}\n` : ""}\
${options.deathsBonus !== undefined ? `#awards_trophies.DeathsBonus ${options.deathsBonus}\n` : ""}\
${options.deathsPenalty !== undefined ? `#awards_trophies.DeathsPenalty ${options.deathsPenalty}\n` : ""}\
#awards_trophies.DeathsPoor ${options.deathsPoor ?? 10}
${options.trophyDeathBonus !== undefined ? `#awards_trophies.TrophyDeathBonus ${options.trophyDeathBonus}\n` : ""}\
${options.trophyCuresBonus !== undefined ? `#awards_trophies.TrophyCuresBonus ${options.trophyCuresBonus}\n` : ""}\
${options.trophyReputation !== undefined ? `#awards_trophies.Reputation ${options.trophyReputation}\n` : ""}\
${options.trophyReputationBonus !== undefined ? `#awards_trophies.TrophyReputationBonus ${options.trophyReputationBonus}\n` : ""}\
${options.trophyStaffHappiness !== undefined ? `#awards_trophies.TrophyStaffHappiness ${options.trophyStaffHappiness}\n` : ""}\
${options.trophyStaffHappinessBonus !== undefined ? `#awards_trophies.TrophyStaffHappinessBonus ${options.trophyStaffHappinessBonus}\n` : ""}\
${options.trophyMayor !== undefined ? `#awards_trophies.TrophyMayor ${options.trophyMayor}\n` : ""}\
${options.trophyMayorBonus !== undefined ? `#awards_trophies.TrophyMayorBonus ${options.trophyMayorBonus}\n` : ""}\
${options.cleanlinessAward !== undefined ? `#awards_trophies.CleanlinessAward ${options.cleanlinessAward}\n` : ""}\
${options.cleanlinessPoor !== undefined ? `#awards_trophies.CleanlinessPoor ${options.cleanlinessPoor}\n` : ""}\
${options.cleanlinessBonus !== undefined ? `#awards_trophies.CleanlinessBonus ${options.cleanlinessBonus}\n` : ""}\
${options.cleanlinessPenalty !== undefined ? `#awards_trophies.CleanlinessPenalty ${options.cleanlinessPenalty}\n` : ""}\
${options.peepHappinessAward !== undefined ? `#awards_trophies.PeepHappinessAward ${options.peepHappinessAward}\n` : ""}\
${options.peepHappinessPoor !== undefined ? `#awards_trophies.PeepHappinessPoor ${options.peepHappinessPoor}\n` : ""}\
${options.peepHappinessBonus !== undefined ? `#awards_trophies.PeepHappinessBonus ${options.peepHappinessBonus}\n` : ""}\
${options.peepHappinessPenalty !== undefined ? `#awards_trophies.PeepHappinessPenalty ${options.peepHappinessPenalty}\n` : ""}\
${options.waitingTimesAward !== undefined ? `#awards_trophies.WaitingTimesAward ${options.waitingTimesAward}\n` : ""}\
${options.waitingTimesPoor !== undefined ? `#awards_trophies.WaitingTimesPoor ${options.waitingTimesPoor}\n` : ""}\
${options.waitingTimesBonus !== undefined ? `#awards_trophies.WaitingTimesBonus ${options.waitingTimesBonus}\n` : ""}\
${options.waitingTimesPenalty !== undefined ? `#awards_trophies.WaitingTimesPenalty ${options.waitingTimesPenalty}\n` : ""}\
${options.staffHappinessAward !== undefined ? `#awards_trophies.StaffHappinessAward ${options.staffHappinessAward}\n` : ""}\
${options.staffHappinessPoor !== undefined ? `#awards_trophies.StaffHappinessPoor ${options.staffHappinessPoor}\n` : ""}\
${options.awardStaffHappinessBonus !== undefined ? `#awards_trophies.AwardStaffHappinessBonus ${options.awardStaffHappinessBonus}\n` : ""}\
${options.awardStaffHappinessPenalty !== undefined ? `#awards_trophies.AwardStaffHappinessPenalty ${options.awardStaffHappinessPenalty}\n` : ""}\
${options.wellKeptTechAward !== undefined ? `#awards_trophies.WellKeptTechAward ${options.wellKeptTechAward}\n` : ""}\
${options.wellKeptTechPoor !== undefined ? `#awards_trophies.WellKeptTechPoor ${options.wellKeptTechPoor}\n` : ""}\
${options.wellKeptTechBonus !== undefined ? `#awards_trophies.WellKeptTechBonus ${options.wellKeptTechBonus}\n` : ""}\
${options.wellKeptTechPenalty !== undefined ? `#awards_trophies.WellKeptTechPenalty ${options.wellKeptTechPenalty}\n` : ""}\
${options.newTechAward !== undefined ? `#awards_trophies.NewTechAward ${options.newTechAward}\n` : ""}\
${options.newTechPoor !== undefined ? `#awards_trophies.NewTechPoor ${options.newTechPoor}\n` : ""}\
${options.researchBonus !== undefined ? `#awards_trophies.ResearchBonus ${options.researchBonus}\n` : ""}\
${options.researchPenalty !== undefined ? `#awards_trophies.ResearchPenalty ${options.researchPenalty}\n` : ""}\
${options.emergencyAward !== undefined ? `#awards_trophies.EmergencyAward ${options.emergencyAward}\n` : ""}\
${options.emergencyPoor !== undefined ? `#awards_trophies.EmergencyPoor ${options.emergencyPoor}\n` : ""}\
${options.emergencyBonus !== undefined ? `#awards_trophies.EmergencyBonus ${options.emergencyBonus}\n` : ""}\
${options.emergencyPenalty !== undefined ? `#awards_trophies.EmergencyPenalty ${options.emergencyPenalty}\n` : ""}\
${options.populationPercentageAward !== undefined ? `#awards_trophies.PopulationPercentageAward ${options.populationPercentageAward}\n` : ""}\
${options.populationPercentagePoor !== undefined ? `#awards_trophies.PopulationPercentagePoor ${options.populationPercentagePoor}\n` : ""}\
${options.populationPercentageBonus !== undefined ? `#awards_trophies.PopulationPercentageBonus ${options.populationPercentageBonus}\n` : ""}\
${options.populationPercentagePenalty !== undefined ? `#awards_trophies.PopulationPercentagePenalty ${options.populationPercentagePenalty}\n` : ""}\
${options.curesVDeathsAward !== undefined ? `#awards_trophies.CuresVDeathsAward ${options.curesVDeathsAward}\n` : ""}\
${options.curesVDeathsPoor !== undefined ? `#awards_trophies.CuresVDeathsPoor ${options.curesVDeathsPoor}\n` : ""}\
${options.curesVDeathsBonus !== undefined ? `#awards_trophies.CuresVDeathsBonus ${options.curesVDeathsBonus}\n` : ""}\
${options.curesVDeathsPenalty !== undefined ? `#awards_trophies.CuresVDeathsPenalty ${options.curesVDeathsPenalty}\n` : ""}\
${options.cansofCoke !== undefined ? `#awards_trophies.CansofCoke ${options.cansofCoke}\n` : ""}\
${options.cansofCokeBonus !== undefined ? `#awards_trophies.CansofCokeBonus ${options.cansofCokeBonus}\n` : ""}\
${options.ratKillsAbsolute !== undefined ? `#awards_trophies.RatKillsAbsolute ${options.ratKillsAbsolute}\n` : ""}\
${options.ratKillsPercentage !== undefined ? `#awards_trophies.RatKillsPercentage ${options.ratKillsPercentage}\n` : ""}\
${options.ratKillsAbsoluteBonus !== undefined ? `#awards_trophies.RatKillsAbsoluteBonus ${options.ratKillsAbsoluteBonus}\n` : ""}\
${options.ratKillsPercentageBonus !== undefined ? `#awards_trophies.RatKillsPercentageBonus ${options.ratKillsPercentageBonus}\n` : ""}\
${options.plant !== undefined ? `#awards_trophies.Plant ${options.plant}\n` : ""}\
${options.plantBonus !== undefined ? `#awards_trophies.PlantBonus ${options.plantBonus}\n` : ""}\
#emergency_control[0].StartMonth.EndMonth.Min.Max.Illness.PercWin.Bonus 0 5 ${options.emergencyMinPatients ?? 2} ${options.emergencyMaxPatients ?? 4} ${options.emergencyIllnessCode ?? 16} ${options.emergencyPercentToWin ?? 75} ${options.emergencyBonusCash ?? 400}
${options.secondEmergency ? `#emergency_control[1].StartMonth.EndMonth.Min.Max.Illness.PercWin.Bonus 0 5 ${options.emergencyMinPatients ?? 2} ${options.emergencyMaxPatients ?? 4} ${options.emergencyIllnessCode ?? 16} ${options.emergencyPercentToWin ?? 75} ${options.emergencyBonusCash ?? 400}\n` : ""}\
#quake_control[0].StartMonth.EndMonth.Severity ${options.quakeStartMonth ?? 1} ${options.quakeEndMonth ?? 1} ${options.quakeSeverity ?? 4}
${options.secondQuake ? `#quake_control[1].StartMonth.EndMonth.Severity ${options.secondQuake.startMonth} ${options.secondQuake.endMonth} ${options.secondQuake.severity}\n` : ""}\
#gbv.QPoints ${options.routingQueuePoints ?? 15}
#gbv.DistPoints ${options.routingDistancePoints ?? 1}
#gbv.NoStaffPoints ${options.routingNoStaffPoints ?? 20}
#gbv.AllocRand ${options.allocationRandomWeight ?? 4}
#gbv.AllocTotalRep ${options.allocationTotalReputationWeight ?? 1}
#gbv.AllocIndRep ${options.allocationIllnessReputationWeight ?? 2}
#gbv.AllocDelay ${options.allocationDelay ?? 3}
#gbv.ScoreMaxInc ${options.scoreMaxIncrease ?? 300}
#gbv.VacCost ${options.vaccinationCost ?? 50}
#gbv.RemoveRatHoleChance ${options.removeRatHoleChance ?? 3000}
#gbv.MinimumAbductTime ${options.minimumAbductionYears ?? 4}
#gbv.AbductionsPerYear ${options.abductionsPerYear ?? 2}
#gbv.AutopsyRschPercent ${options.autopsyResearchPercent ?? 33}
#gbv.AutopsyRepHitPercent ${options.autopsyReputationHitPercent ?? 20}
#gbv.MayorLaunch ${options.mayorLaunch ?? 150}
#gbv.DisasterLaunch ${options.disasterLaunch ?? 240}
#gbv.LandCostPerTile ${options.landCostPerTile ?? 25}
#gbv.HowContagious ${options.howContagious ?? 25}
#gbv.ContagiousSpreadFactor ${options.contagiousSpreadFactor ?? 25}
#gbv.ReduceContMonths ${options.reduceContagiousMonths ?? 6}
#gbv.ReduceContPeepCount ${options.reduceContagiousPeepCount ?? 10}
#gbv.ReduceContRate ${options.reduceContagiousRate ?? 0}
#gbv.EpidemicFine ${options.epidemicFine ?? 2000}
#gbv.EpidemicCompLo ${options.epidemicCompensationLow ?? 1000}
#gbv.EpidemicCompHi ${options.epidemicCompensationHigh ?? 15000}
${options.omitTrainingRate ? "" : "#gbv.TrainingRate 40\n"}\
#gbv.PromoDoc ${options.promotionDoctorMonths ?? 6}
#gbv.PromoCon ${options.promotionConsultantMonths ?? 12}
${options.omitAbilityThresholds ? "" : "#gbv.AbilityThreshold[0] 75 SURGEON\n#gbv.AbilityThreshold[1] 60 PSYCHO\n#gbv.AbilityThreshold[2] 45 RESEARCHER\n"}\
${trainingValueLines}
#gbv.DoctorThreshold ${options.doctorThreshold ?? 250}
#gbv.ConsultantThreshold ${options.consultantThreshold ?? 750}
${(options.salaryAdds ?? [
  { index: 3, value: -30, name: "Junior" },
  { index: 4, value: 30, name: "Doctor" },
  { index: 7, value: 100, name: "Consultant" },
]).map((entry) => `#gbv.SalaryAdd[${entry.index}] ${entry.value}${entry.name ? ` ${entry.name}` : ""}`).join("\n")}
#gbv.SalaryAbilityDivisor ${options.salaryAbilityDivisor ?? 10}
#gbv.SalaryTooLow ${options.salaryTooLow ?? -10}
#gbv.SalaryTooHigh ${options.salaryTooHigh ?? 20}
#gbv.RestStanding ${options.restStanding ?? 3}
#gbv.RestSofa ${options.restSofa ?? 8}
#gbv.RestGame ${options.restGame ?? 60}
#gbv.RestSnooker ${options.restSnooker ?? 30}
#gbv.WorkLight ${options.workLight ?? 1}
#gbv.ModifyFreq ${options.modifyFrequency ?? 16}
#gbv.NotTired ${options.notTired ?? 300}
#gbv.Tired ${options.tired ?? 600}
#gbv.VeryTired ${options.veryTired ?? 700}
#gbv.CrackUpTired ${options.crackUpTired ?? 800}
#gbv.RecoveryFactor ${options.recoveryFactor ?? 450}
#gbv.RecoveryMinimum ${options.recoveryMinimum ?? 3}
#gbv.ResignMax ${options.resignMax ?? 150}
#gbv.LitterDrop ${options.litterDrop ?? 25}
#gbv.LitterRandom ${options.litterRandom ?? 60}
#gbv.LeaveMax ${options.leaveMax ?? 150}
#gbv.Happy 75
#gbv.Unhappy 50
#gbv.VeryUnhappy 25
#gbv.BowelFull ${options.bowelFull ?? 50}
#gbv.BowelOverflows ${options.bowelOverflows ?? 75}
#gbv.VomitLimit ${options.vomitLimit ?? 50}
#gbv.DrinkHappy ${options.drinkHappy ?? 5}
#gbv.ToiletHappy ${options.toiletHappy ?? 10}
${populationLines}
${diseaseLines}
${roomLines}
#staff[0].MinSalary ${options.staffMinimumSalaries?.nurse ?? 50} Nurse
#staff[1].MinSalary ${options.staffMinimumSalaries?.diagnostician ?? 60} Doctor
#staff[2].MinSalary ${options.staffMinimumSalaries?.handyman ?? 20} Handyman
#staff[3].MinSalary ${options.staffMinimumSalaries?.receptionist ?? 15} Receptionist
${objectLines}
${staffLevelLines}
`;
}

function syntheticMapBytes(options = {}) {
  const bytes = new Uint8Array(163_948);
  bytes[0] = 1;
  for (let tileIndex = 0; tileIndex < 128 * 128; tileIndex += 1) {
    const recordOffset = 34 + tileIndex * 8;
    const parcelOffset = 131_106 + tileIndex * 2;
    bytes[recordOffset + 2] = tileIndex % 2;
    bytes[recordOffset + 5] = 0;
    bytes[parcelOffset] = 1;
    bytes[parcelOffset + 1] = 0;
  }
  const camera = options.camera ?? { x: 63, y: 63 };
  const heliport = options.heliport ?? { x: 0, y: 0 };
  const cameraIndex = camera.y * 128 + camera.x;
  bytes[163_876] = cameraIndex & 0xff;
  bytes[163_877] = cameraIndex >> 8;
  const heliportIndex = heliport.y * 128 + heliport.x;
  bytes[163_884] = heliportIndex & 0xff;
  bytes[163_885] = heliportIndex >> 8;
  return bytes;
}
