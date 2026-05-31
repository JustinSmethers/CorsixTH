#!/usr/bin/env node

import { readdir, readFile, stat } from "node:fs/promises";
import path from "node:path";
import {
    createAssetBundle,
    decodeThemeHospitalAnimationSetFromBundle,
    decodeThemeHospitalPalette,
    decodeThemeHospitalSpriteSheetFromBundle,
    findFirstRenderableThemeHospitalAnimation,
    findFirstVisibleThemeHospitalSprite
} from "../packages/assets/src/index.js";

const selectedRoot = await resolveSelectedRoot(process.argv[2]);
const selectedParent = path.dirname(selectedRoot);
const filePaths = await collectFiles(selectedRoot);
const inputFiles = [];

for (const filePath of filePaths) {
    inputFiles.push({
        path: toPosix(path.relative(selectedParent, filePath)),
        bytes: await readFile(filePath)
    });
}

const result = createAssetBundle(inputFiles);
console.log(`Selected root: ${selectedRoot}`);
console.log(`Input files: ${inputFiles.length}`);
console.log(`Status: ${result.status}`);

for (const diagnostic of result.diagnostics) {
    console.log(`${diagnostic.severity}: ${diagnostic.code}: ${diagnostic.message}`);
}

if (result.status !== "ready" || !result.manifest) {
    process.exitCode = 1;
}
else {
    console.log(`Normalized root prefix: ${result.manifest.rootPrefix ?? "(none)"}`);
    console.log(`Imported game files: ${result.manifest.importedFileCount}`);
    console.log(`Map summaries: ${result.manifest.mapSummaries?.length ?? 0}`);
    const qDataSpriteSheets = result.manifest.qDataSpriteSheets ?? [];
    console.log(`QDATA sprite sheets: ${qDataSpriteSheets.length}`);
    const firstQDataSpriteSheet = qDataSpriteSheets[0];
    if (firstQDataSpriteSheet) {
        const firstSprite = firstQDataSpriteSheet.firstVisibleSprite;
        console.log(`First QDATA sprite sheet: ${firstQDataSpriteSheet.path}, sprites=${firstQDataSpriteSheet.spriteCount}, visible=${firstQDataSpriteSheet.visibleSpriteCount}`);
        if (firstSprite) {
            console.log(`First QDATA visible sprite: #${firstSprite.index} ${firstSprite.width}x${firstSprite.height}`);
        }
    }
    const uiSpriteSheets = result.manifest.uiSpriteSheets ?? [];
    console.log(`DATA UI sprite sheets: ${uiSpriteSheets.length}`);
    const firstUiSpriteSheet = uiSpriteSheets[0];
    if (firstUiSpriteSheet) {
        const firstSprite = firstUiSpriteSheet.firstVisibleSprite;
        console.log(`First DATA UI sprite sheet: ${firstUiSpriteSheet.path}, sprites=${firstUiSpriteSheet.spriteCount}, visible=${firstUiSpriteSheet.visibleSpriteCount}`);
        if (firstSprite) {
            console.log(`First DATA UI visible sprite: #${firstSprite.index} ${firstSprite.width}x${firstSprite.height}`);
        }
    }
    const languageSummary = result.manifest.languageSummary;
    if (languageSummary) {
        console.log(`Language strings: ${languageSummary.path}, entries=${languageSummary.entryCount}`);
        console.log(`Language disease names: mild-cold=${languageSummary.diseaseNames["mild-cold"] ?? "(none)"}, cranial-pressure=${languageSummary.diseaseNames["cranial-pressure"] ?? "(none)"}`);
    }
    const scenarioSummaries = (result.manifest.mapSummaries ?? []).filter((summary) => summary.scenario);
    console.log(`Scenario summaries: ${scenarioSummaries.length}`);
    if (scenarioSummaries.length > 0) {
        const diseaseEntries = scenarioSummaries.flatMap((summary) => summary.scenario?.diseasePool ?? []);
        const expertiseEntries = scenarioSummaries.flatMap((summary) => summary.scenario?.expertise ?? []);
        const objectEntries = scenarioSummaries.flatMap((summary) => summary.scenario?.objectAvailability ?? []);
        const roomCostEntries = scenarioSummaries.flatMap((summary) => summary.scenario?.roomCosts ?? []);
        const staffSalaryEntries = scenarioSummaries.flatMap((summary) => summary.scenario?.staffSalaries ?? []);
        const emergencyEntries = scenarioSummaries.flatMap((summary) => summary.scenario?.emergencySchedule ?? []);
        const quakeEntries = scenarioSummaries.flatMap((summary) => summary.scenario?.quakeSchedule ?? []);
        const opponentEntries = scenarioSummaries.flatMap((summary) => summary.scenario?.scenarioOpponents ?? []);
        const financialEntries = scenarioSummaries.map((summary) => summary.scenario?.financialSettings).filter(Boolean);
        const trainingSettings = scenarioSummaries.map((summary) => summary.scenario?.trainingSettings).filter((settings) => settings && Object.keys(settings).length > 0);
        const epidemicSettings = scenarioSummaries.map((summary) => summary.scenario?.epidemicSettings).filter((settings) => settings && Object.keys(settings).length > 0);
        const landSettings = scenarioSummaries.map((summary) => summary.scenario?.landSettings).filter((settings) => settings && Object.keys(settings).length > 0);
        const staffFatigueSettings = scenarioSummaries.map((summary) => summary.scenario?.staffFatigueSettings).filter((settings) => settings && Object.keys(settings).length > 0);
        const patientBehaviorSettings = scenarioSummaries.map((summary) => summary.scenario?.patientBehaviorSettings).filter((settings) => settings && Object.keys(settings).length > 0);
        const salarySettings = scenarioSummaries.map((summary) => summary.scenario?.salarySettings).filter((settings) => settings && Object.keys(settings).length > 0);
        const allocationSettings = scenarioSummaries.map((summary) => summary.scenario?.allocationSettings).filter((settings) => settings && Object.keys(settings).length > 0);
        const routingSettings = scenarioSummaries.map((summary) => summary.scenario?.routingSettings).filter((settings) => settings && Object.keys(settings).length > 0);
        const eventSettings = scenarioSummaries.map((summary) => summary.scenario?.eventSettings).filter((settings) => settings && Object.keys(settings).length > 0);
        const awardSettingCount = scenarioSummaries.reduce((sum, summary) => sum + Object.keys(summary.scenario?.awardCriteria ?? {}).length, 0);
        console.log(`Scenario disease entries: ${diseaseEntries.length}, unique=${new Set(diseaseEntries.map((entry) => entry.token)).size}`);
        console.log(`Scenario expertise entries: ${expertiseEntries.length}, research-required=${expertiseEntries.filter((entry) => !entry.known && entry.researchRequired > 0).length}`);
        console.log(`Scenario object entries: ${objectEntries.length}`);
        console.log(`Scenario room cost entries: ${roomCostEntries.length}`);
        console.log(`Scenario staff salary entries: ${staffSalaryEntries.length}`);
        console.log(`Scenario emergency entries: ${emergencyEntries.length}`);
        console.log(`Scenario quake entries: ${quakeEntries.length}`);
        console.log(`Scenario opponent entries: ${opponentEntries.length}, active=${opponentEntries.filter((entry) => entry.playing).length}`);
        console.log(`Scenario financial settings: ${financialEntries.length}`);
        console.log(`Scenario training settings: ${trainingSettings.length}`);
        console.log(`Scenario epidemic settings: ${epidemicSettings.length}`);
        console.log(`Scenario land settings: ${landSettings.length}`);
        console.log(`Scenario staff fatigue settings: ${staffFatigueSettings.length}`);
        console.log(`Scenario patient behavior settings: ${patientBehaviorSettings.length}`);
        console.log(`Scenario salary settings: ${salarySettings.length}`);
        console.log(`Scenario allocation settings: ${allocationSettings.length}`);
        console.log(`Scenario routing settings: ${routingSettings.length}`);
        console.log(`Scenario event settings: ${eventSettings.length}`);
        console.log(`Scenario award settings: ${awardSettingCount}`);
    }
    const firstMap = result.manifest.mapSummaries?.[0];
    if (firstMap) {
        console.log(`First map: ${firstMap.path} ${firstMap.width}x${firstMap.height}, parcels=${firstMap.parcelCount}, objects=${firstMap.objectCount}`);
        if (firstMap.scenario) {
            console.log(`First scenario: ${firstMap.scenario.path} (${firstMap.scenario.difficulty}), win=${firstMap.scenario.winCriteria.length}, lose=${firstMap.scenario.loseCriteria.length}`);
            const cureCriterion = firstMap.scenario.winCriteria.find((criterion) => criterion.metric === "cures");
            if (cureCriterion) {
                console.log(`First scenario cure target: ${cureCriterion.value}`);
            }
            if (firstMap.scenario.financialSettings) {
                console.log(`First scenario start cash: ${firstMap.scenario.financialSettings.startCash}`);
                console.log(`First scenario interest rate: ${firstMap.scenario.financialSettings.interestRate ?? "(none)"}`);
            }
            if (firstMap.scenario.researchSettings) {
                console.log(`First scenario research start cost: ${firstMap.scenario.researchSettings.startCost ?? "(none)"}`);
                console.log(`First scenario research min drug cost: ${firstMap.scenario.researchSettings.minDrugCost ?? "(none)"}`);
                console.log(`First scenario research drug improve rate: ${firstMap.scenario.researchSettings.drugImproveRate ?? "(none)"}`);
                console.log(`First scenario research object strength: ${firstMap.scenario.researchSettings.maxObjectStrength ?? "(none)"}/${firstMap.scenario.researchSettings.researchIncrement ?? "(none)"}`);
            }
            if (firstMap.scenario.trainingSettings) {
                console.log(`First scenario training rate: ${firstMap.scenario.trainingSettings.trainingRate ?? "(none)"}`);
                console.log(`First scenario ability thresholds: ${firstMap.scenario.trainingSettings.abilityThresholds?.length ?? 0}`);
                console.log(`First scenario promotion months: ${firstMap.scenario.trainingSettings.promotionDoctorMonths ?? "(none)"}/${firstMap.scenario.trainingSettings.promotionConsultantMonths ?? "(none)"}`);
            }
            if (firstMap.scenario.epidemicSettings) {
                console.log(`First scenario epidemic contagiousness: ${firstMap.scenario.epidemicSettings.howContagious ?? "(none)"}`);
                console.log(`First scenario contagious reduction: ${firstMap.scenario.epidemicSettings.reduceContagiousMonths ?? "(none)"}/${firstMap.scenario.epidemicSettings.reduceContagiousPeepCount ?? "(none)"}/${firstMap.scenario.epidemicSettings.reduceContagiousRate ?? "(none)"}`);
                console.log(`First scenario epidemic fine: ${firstMap.scenario.epidemicSettings.fine ?? "(none)"}`);
            }
            if (firstMap.scenario.landSettings) {
                console.log(`First scenario land cost per tile: ${firstMap.scenario.landSettings.landCostPerTile ?? "(none)"}`);
            }
            if (firstMap.scenario.staffFatigueSettings) {
                console.log(`First scenario staff rest values: ${firstMap.scenario.staffFatigueSettings.restStanding ?? "(none)"}/${firstMap.scenario.staffFatigueSettings.restSofa ?? "(none)"}/${firstMap.scenario.staffFatigueSettings.restGame ?? "(none)"}/${firstMap.scenario.staffFatigueSettings.restSnooker ?? "(none)"}`);
                console.log(`First scenario staff work/modify/resign: ${firstMap.scenario.staffFatigueSettings.workLight ?? "(none)"}/${firstMap.scenario.staffFatigueSettings.modifyFrequency ?? "(none)"}/${firstMap.scenario.staffFatigueSettings.resignMax ?? "(none)"}`);
                console.log(`First scenario staff crack-up tiredness: ${firstMap.scenario.staffFatigueSettings.crackUpTired ?? "(none)"}`);
                console.log(`First scenario staff recovery minimum: ${firstMap.scenario.staffFatigueSettings.recoveryMinimum ?? "(none)"}`);
            }
            if (firstMap.scenario.patientBehaviorSettings) {
                console.log(`First scenario patient leave max: ${firstMap.scenario.patientBehaviorSettings.leaveMax ?? "(none)"}`);
                console.log(`First scenario patient litter drop: ${firstMap.scenario.patientBehaviorSettings.litterDrop ?? "(none)"}`);
            }
            if (firstMap.scenario.salarySettings) {
                console.log(`First scenario salary ability divisor: ${firstMap.scenario.salarySettings.salaryAbilityDivisor ?? "(none)"}`);
                console.log(`First scenario salary add count: ${firstMap.scenario.salarySettings.salaryAdds?.length ?? 0}`);
            }
            if (firstMap.scenario.allocationSettings) {
                console.log(`First scenario allocation random weight: ${firstMap.scenario.allocationSettings.randomWeight ?? "(none)"}`);
                console.log(`First scenario allocation delay months: ${firstMap.scenario.allocationSettings.delayMonths ?? "(none)"}`);
            }
            if (firstMap.scenario.routingSettings) {
                console.log(`First scenario routing weights: ${firstMap.scenario.routingSettings.queuePoints ?? "(none)"}/${firstMap.scenario.routingSettings.distancePoints ?? "(none)"}/${firstMap.scenario.routingSettings.noStaffPoints ?? "(none)"}`);
            }
            if (firstMap.scenario.eventSettings) {
                console.log(`First scenario event vaccination cost: ${firstMap.scenario.eventSettings.vaccinationCost ?? "(none)"}`);
                console.log(`First scenario event mayor/disaster launch: ${firstMap.scenario.eventSettings.mayorLaunch ?? "(none)"}/${firstMap.scenario.eventSettings.disasterLaunch ?? "(none)"}`);
            }
            if (firstMap.scenario.awardCriteria) {
                console.log(`First scenario award settings: ${Object.keys(firstMap.scenario.awardCriteria).length}`);
            }
            if (firstMap.scenario.diseasePool?.length > 0) {
                console.log(`First scenario disease pool: ${firstMap.scenario.diseasePool.length}`);
                const firstDisease = firstMap.scenario.diseasePool[0];
                console.log(`First scenario disease: ${firstDisease.token} -> ${firstDisease.diseaseId}`);
            }
        }
    }
    const paletteRecord = result.bundle?.filesByPath.get("DATA/MPALETTE.DAT");
    const spriteSheet = result.bundle ? decodeThemeHospitalSpriteSheetFromBundle(result.bundle, "DATA/VSPR-0") : null;
    if (paletteRecord && spriteSheet) {
        const palette = decodeThemeHospitalPalette(paletteRecord.bytes);
        const firstVisibleSprite = findFirstVisibleThemeHospitalSprite(spriteSheet, palette);
        console.log(`VSPR sprites: ${spriteSheet.spriteCount}`);
        if (firstVisibleSprite) {
            console.log(`First visible VSPR sprite: #${firstVisibleSprite.index} ${firstVisibleSprite.width}x${firstVisibleSprite.height}`);
        }
        const blockSheet = result.bundle ? decodeThemeHospitalSpriteSheetFromBundle(result.bundle, "DATA/VBLK-0") : null;
        const firstVisibleBlock = blockSheet ? findFirstVisibleThemeHospitalSprite(blockSheet, palette) : null;
        if (blockSheet) {
            console.log(`VBLK sprites: ${blockSheet.spriteCount}`);
        }
        if (firstVisibleBlock) {
            console.log(`First visible VBLK sprite: #${firstVisibleBlock.index} ${firstVisibleBlock.width}x${firstVisibleBlock.height}`);
        }
        const animations = result.bundle ? decodeThemeHospitalAnimationSetFromBundle(result.bundle) : null;
        const firstRenderableAnimation = animations ? findFirstRenderableThemeHospitalAnimation(animations, spriteSheet, palette) : null;
        if (animations) {
            console.log(`Animations: ${animations.animationCount}, frames=${animations.frameCount}, elements=${animations.elementCount}`);
        }
        if (firstRenderableAnimation !== null) {
            console.log(`First renderable animation: #${firstRenderableAnimation}`);
        }
    }
}

async function resolveSelectedRoot(argumentPath) {
    if (argumentPath) {
        const candidates = [
            path.resolve(process.cwd(), argumentPath),
            path.resolve(process.cwd(), "..", argumentPath)
        ];
        for (const candidate of candidates) {
            try {
                const candidateStat = await stat(candidate);
                if (candidateStat.isDirectory()) {
                    return candidate;
                }
            }
            catch {
                // Try the next likely invocation root.
            }
        }
        return candidates[0];
    }
    const candidates = [
        path.resolve(process.cwd(), "GameData", "Contents", "Resources", "game"),
        path.resolve(process.cwd(), "..", "GameData", "Contents", "Resources", "game"),
        path.resolve(process.cwd(), "GameData"),
        path.resolve(process.cwd(), "..", "GameData")
    ];
    for (const candidate of candidates) {
        try {
            const candidateStat = await stat(candidate);
            if (candidateStat.isDirectory()) {
                return candidate;
            }
        }
        catch {
            // Try the next conventional local path.
        }
    }
    throw new Error("Could not find GameData. Pass a Theme Hospital data folder path as the first argument.");
}

async function collectFiles(root) {
    const rootStat = await stat(root);
    if (!rootStat.isDirectory()) {
        throw new Error(`Expected a directory: ${root}`);
    }
    const results = [];
    const entries = await readdir(root, { withFileTypes: true });
    entries.sort((left, right) => left.name.localeCompare(right.name));
    for (const entry of entries) {
        const entryPath = path.join(root, entry.name);
        if (entry.isDirectory()) {
            results.push(...await collectFiles(entryPath));
        }
        else if (entry.isFile()) {
            results.push(entryPath);
        }
    }
    return results;
}

function toPosix(filePath) {
    return filePath.split(path.sep).join("/");
}
