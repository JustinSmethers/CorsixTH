import { canAdvanceToNextLevelFromTelemetry, canBuildRoomFromTelemetry, canFireStaff, canGiveDrinkToPatient, canHireStaffFromTelemetry, canPrioritizePatient, canRepayLoanFromTelemetry, canRepairRoomFromTelemetry, canRestartLevelFromHospitalView, canRestStaffFromTelemetry, canRunFinanceAuditFromTelemetry, canRunMarketingCampaignFromTelemetry, canRunAwardsFromTelemetry, canSellRoom, canSendPatientToilet, canStartInsuranceContractFromTelemetry, canStartEpidemicFromTelemetry, canStartEmergencyFromTelemetry, canStartResearchFromTelemetry, canStartVipInspectionFromTelemetry, canTakeLoanFromTelemetry, canToggleStaffBreakFromState, canToggleTreatmentRoomFromState, canTrainStaffFromTelemetry, createCampaignLevelObjectiveFromHospitalView, createCampaignMapSummaries, createOriginalUiStripControlZones, createRoomAvailabilityFromScenario, createRoomAvailabilityScheduleFromScenario, createRoomWearThresholdOverridesFromScenario, formatActionStatus, formatActiveStaffStatus, formatAdmissionPolicyStatus, formatAdmissionRulesStatus, formatAdmissionsStatus, formatAdmissionsToggleLabel, formatAppTitleLabel, formatAudioChannelMuteLabel, formatAudioMasterMuteLabel, formatAudioStatus, formatAudioVolumeStatus, formatAutoBreakStaffStatus, formatAwaitingTreatmentPatientsStatus, formatBuildRoomButtonLabel, formatCampaignCompleteStatus, formatCameraPositionEmptyStatus, formatCameraPositionRecalledStatus, formatCameraPositionStoredStatus, formatCameraPositionUnavailableStatus, formatCampaignActionButtonLabel, formatCameraDirectionButtonLabel, formatCanvasUnavailableStatus, formatCareActionButtonLabel, formatCasebookPanelActionLabel, formatCasebookPanelEmptyStatus, formatCasebookPanelHeaderLabel, formatCasebookRowsHtml, formatCasebookWithLanguage, formatCashStatus, formatChoosePlacementActionStatus, formatCriticalPatientsStatus, formatCumulativeCashflowStatus, formatDeletedSaveSlotStatus, formatDiagnosedPatientsStatus, formatDiagnosingPatientsStatus, formatDischargedPatientsStatus, formatEmergencyRewardStatus, formatEmergencyStatus, formatEpidemicStatus, formatEpidemicTermsStatus, formatEventRulesStatus, formatFieldLabel, formatFinanceActionButtonLabel, formatFinanceAuditStatus, formatFinanceLedgerStatus, formatFrontDeskStatus, formatGameplayActionButtonLabel, formatFurnishCorridorPanelEmptyStatus, formatFurnishCorridorRowsHtml, formatHireStaffButtonLabel, formatHospitalAwardStatus, formatHospitalCanvasSummary, formatHospitalMapOptionsHtml, formatHospitalRatingStatus, formatIdleActionStatus, formatImportedMapUnavailableStatus, formatInformationStatus, formatInsuranceContractStatus, formatInsuranceTermsStatus, formatLastEventStatus, formatLevelObjectiveProgress, formatLevelObjectiveSafety, formatLevelObjectiveStatus, formatLoadResultStatus, formatLoanInterestStatus, formatLoanStatus, formatMaintenanceStaffStatus, formatMapPanelCurrentStatus, formatMapPanelDetailsStatus, formatMapPanelLandStatus, formatMarketingCampaignStatus, formatMilestoneStatus, formatMissingMapLoadStatus, formatMuteToggleLabel, formatNoImportedMapOptionLabel, formatNoMessagesActionStatus, formatNoSelectionStatus, formatNewMapStatus, formatNextAdmissionStatus, formatNextLevelStatus, formatObjectAvailabilityStatus, formatOnBreakStaffStatus, formatOpenDiagnosisRoomsStatus, formatOpenTreatmentRoomsStatus, formatOriginalUiCanvasUnavailableStatus, formatOriginalUiNoSpritesStatus, formatOriginalUiStripControlLabel, formatOriginalUiStripSummary, formatMenuBarShownActionStatus, formatMenuButtonLabel, formatPanelActionStatus, formatPanelCloseButtonLabel, formatPanelTitleLabel, formatPolicyOptionLabel, formatPatientBowelOverflowStatus, formatPatientDeathsStatus, formatPatientDrinksStatus, formatPatientLitterStatus, formatPatientMoodStatus, formatPatientsNeedingToiletStatus, formatPatientVomitsStatus, formatPausedStatus, formatPauseToggleLabel, formatPlacementMode, formatPlacementRotatedActionStatus, formatPlantCareStatus, formatPricingPolicyStatus, formatQuakeStatus, formatQuitLevelActionStatus, formatQuitLevelButtonLabel, formatQuitLevelPromptLabel, formatQueuedPatientsStatus, formatQueuePressureEventsStatus, formatQueuePressureStatus, formatQueuePressureValueStatus, formatRatControlStatus, formatRecentEventsStatus, formatReceptionPatientsStatus, formatReputationStatus, formatResearchEffectStatus, formatResearchStatus, formatRestartedLevelStatus, formatRoomAvailabilityHudStatus, formatRoomAvailabilityStatus, formatRoomMaintenanceCompleteEventsStatus, formatRoomMaintenanceStartEventsStatus, formatRoomMaintenanceStatus, formatRoutingRulesStatus, formatSalaryPressureStatus, formatSaveActionButtonLabel, formatSaveFailureStatus, formatSaveLifecycleStatus, formatSaveSlotOptionsHtml, formatSaveSlotsStatus, formatSelectAriaLabel, formatSaveTickStatus, formatScenarioExpertiseStatus, formatScenarioNetworkCriteriaStatus, formatScenarioOpponentProgressStatus, formatScenarioOpponentsStatus, formatScenarioResearchDetails, formatSeedStatus, formatSelectedEntityActionStatus, formatSelectedPatientActionButtonLabel, formatSelectedRoomToggleLabel, formatSelectedStaffRoomActionButtonLabel, formatSelectedStaffBreakToggleLabel, formatSelectionStatusWithLanguage, formatSpecializedTreatmentQueueStatus, formatSpecializedTreatmentRoomsStatus, formatSpeedStatus, formatStaffBreakToggleLabel, formatStaffBurnoutEventsStatus, formatStaffMarketStatus, formatStaffRecoveryEventsStatus, formatStaffSkillStatus, formatStaffTrainingStatus, formatStateHashStatus, formatStressedStaffStatus, formatTickCashflowStatus, formatTickStatus, formatTiredStaffStatus, formatTreatedPatientsStatus, formatTreatingPatientsStatus, formatTreatmentFailuresStatus, formatTransparentWallsActionStatus, formatTreatmentRoomToggleLabel, formatUnlockStatus, formatVeryTiredStaffStatus, formatVipInspectionStatus, formatVisibilityActionStatus, formatVipInspectionTermsStatus, formatWaitingPatientsStatus, formatWalkingToDiagnosisPatientsStatus, formatWalkingToTreatmentPatientsStatus, formatZoomActionStatus, nextSpeedMultiplier, selectOriginalUiSpriteSheetSummary, selectQDataUiSpriteSheetSummary } from "../src/app-shell";

import { staffRoleMarkerColor } from "../src/app-shell";
import { patientConditionLabels } from "../src/app-shell";
import { formatNextLevelUnavailableStatus, formatRestartLevelUnavailableStatus } from "../src/app-shell";
import { canSendPatientHome } from "../src/app-shell";
import { canSellObject } from "../src/app-shell";
import { canShootRatFromTelemetry, canWaterPlantFromTelemetry } from "../src/app-shell";

describe("app shell campaign objectives", () => {
    it("selects the first visible original QDATA sheet for the playable UI strip", () => {
        expect(selectQDataUiSpriteSheetSummary([
            { path: "QDATA/EMPTY", spriteCount: 4, visibleSpriteCount: 0 },
            { path: "QDATA/FONT00V", spriteCount: 2, visibleSpriteCount: 1 }
        ])).toEqual({ path: "QDATA/FONT00V", spriteCount: 2, visibleSpriteCount: 1 });
        expect(selectQDataUiSpriteSheetSummary([])).toBeNull();
    });
    it("prefers original DATA panel sheets for the playable UI strip", () => {
        expect(selectOriginalUiSpriteSheetSummary([
            { path: "DATA/MONEY01V", spriteCount: 2, visibleSpriteCount: 1 },
            { path: "DATA/PANEL02V", spriteCount: 3, visibleSpriteCount: 2 }
        ], [
            { path: "QDATA/FONT00V", spriteCount: 2, visibleSpriteCount: 1 }
        ])).toEqual({ path: "DATA/PANEL02V", spriteCount: 3, visibleSpriteCount: 2 });
        expect(selectOriginalUiSpriteSheetSummary([], [
            { path: "QDATA/FONT00V", spriteCount: 2, visibleSpriteCount: 1 }
        ])).toEqual({ path: "QDATA/FONT00V", spriteCount: 2, visibleSpriteCount: 1 });
    });
    it("formats imported map and original UI canvas summaries", () => {
        expect(formatCanvasUnavailableStatus()).toBe("Canvas unavailable");
        expect(formatImportedMapUnavailableStatus()).toBe("Imported map renderer unavailable");
        expect(formatOriginalUiCanvasUnavailableStatus()).toBe("Original UI: canvas unavailable");
        expect(formatOriginalUiNoSpritesStatus()).toBe("Original UI: no imported sprites");
        expect(formatNoImportedMapOptionLabel()).toBe("No imported map");
        expect(formatHospitalMapOptionsHtml(null)).toBe('<option value="">No imported map</option>');
        expect(formatHospitalMapOptionsHtml({
            mapSummaries: [
                { path: "LEVELS/EXAMPLE.MAP" },
                { path: "LEVELS/<SECOND>&.MAP" }
            ]
        })).toBe('<option value="LEVELS/EXAMPLE.MAP">LEVELS/EXAMPLE.MAP</option><option value="LEVELS/&lt;SECOND&gt;&amp;.MAP">LEVELS/&lt;SECOND&gt;&amp;.MAP</option>');
        expect(formatMapPanelCurrentStatus("LEVELS/EXAMPLE.MAP")).toBe("Map: LEVELS/EXAMPLE.MAP");
        expect(formatMapPanelCurrentStatus("")).toBe("Map: unavailable");
        expect(formatMapPanelLandStatus(25)).toBe("Land: 25/tile");
        expect(formatMapPanelLandStatus(null)).toBe("Land: unavailable");
        expect(formatMapPanelDetailsStatus({
            width: 64,
            height: 32,
            parcelCount: 3,
            buildableTileCount: 10,
            objectCount: 7
        })).toBe("Map details: 64x32, parcels 3, buildable 10, objects 7");
        expect(formatMapPanelDetailsStatus(null)).toBe("Map details: unavailable");
        expect(formatHospitalCanvasSummary({
            mapPath: "LEVELS/EXAMPLE.MAP",
            startX: 4,
            startY: 5,
            zoomIndex: 2,
            transparentWalls: true
        }, {
            patientsWaiting: 3,
            entities: {
                rooms: [{ id: 1 }, { id: 2 }],
                staff: [{ id: 1 }],
                objects: [{ id: 1 }]
            }
        }, {
            floorSpriteCount: 20,
            wallSpriteCount: 8,
            objectSpriteCount: 5
        })).toBe("LEVELS/EXAMPLE.MAP viewport 4,5; zoom 100%; transparent walls yes; patients 3; rooms 2; staff 1; floor 20; walls 8; objects 5; placed objects 1");
        expect(formatOriginalUiStripSummary({
            originalUiSpriteSheetPath: "DATA/PANEL02V",
            originalUiSpriteSheet: { spriteCount: 11 }
        }, 4)).toBe("Original UI: DATA/PANEL02V 11 sprites, showing 4");
        expect(formatOriginalUiStripSummary({
            originalUiSpriteSheetPath: "",
            originalUiSpriteSheet: { spriteCount: 2 }
        }, 0)).toBe("Original UI: imported sheet 2 sprites, none visible");
        expect(formatOriginalUiStripSummary({
            originalUiSpriteSheetPath: "DATA/PANEL02V",
            originalUiSpriteSheet: { spriteCount: 11 }
        }, 4, [
            { label: "Pause" },
            { label: "Step" }
        ])).toBe("Original UI: DATA/PANEL02V 11 sprites, showing 4; controls Pause, Step");
        expect(["pause-toggle", "build-diagnosis-room", "build-psychiatry-room", "build-staff-room", "build-research-room", "build-toilets", "build-inflation-room", "build-slack-tongue-clinic", "build-hair-restoration-room", "build-jelly-vat-room", "build-decontamination-room", "build-electrolysis-room", "build-dna-fixer-room", "open-research", "save-game", "refresh-save-slots", "quit-level", "hospital-camera-west"].map(formatOriginalUiStripControlLabel)).toEqual([
            "Pause",
            "Build GP",
            "Build Psych",
            "Build Staff Room",
            "Build Research",
            "Build Toilets",
            "Build Inflation",
            "Build Tongue",
            "Build Hair",
            "Build Jelly",
            "Build Decon",
            "Build Electro",
            "Build DNA Fixer",
            "Research Panel",
            "Save",
            "Refresh Saves",
            "Quit Level",
            "Camera West"
        ]);
        expect(formatAppTitleLabel()).toBe("CorsixTH Browser Hospital");
        expect(formatCameraPositionStoredStatus(2)).toBe("Action: camera position 2 stored");
        expect(formatCameraPositionEmptyStatus(2)).toBe("Action: camera position 2 empty");
        expect(formatCameraPositionUnavailableStatus(2)).toBe("Action: camera position 2 unavailable");
        expect(formatCameraPositionRecalledStatus(2)).toBe("Action: camera position 2 recalled");
        expect(["west", "east", "north", "south"].map((direction) => formatCameraDirectionButtonLabel(direction))).toEqual(["West", "East", "North", "South"]);
        expect(formatCameraDirectionButtonLabel("west", true)).toBe("Camera West");
        expect(formatZoomActionStatus({ zoomIndex: 3 })).toBe("Action: zoom 150%");
        expect(formatPanelActionStatus("bank manager", "opened")).toBe("Action: bank manager opened");
        expect(formatPanelActionStatus("machine menu", "closed")).toBe("Action: machine menu closed");
        expect(formatPanelCloseButtonLabel()).toBe("Close");
        expect(["bank-manager", "bank-stats", "machine-menu", "furnish-corridor", "edit-room"].map(formatPanelTitleLabel)).toEqual([
            "Bank Manager",
            "Bank Stats",
            "Machine Menu",
            "Furnish Corridor",
            "Edit Room"
        ]);
        expect(["conservative", "standard", "aggressive", "discount", "premium"].map(formatPolicyOptionLabel)).toEqual([
            "Conservative",
            "Standard",
            "Aggressive",
            "Discount",
            "Premium"
        ]);
        expect(["speed", "policy", "pricing", "severity", "slot", "volume", "level", "admission", "map"].map(formatFieldLabel)).toEqual([
            "Speed",
            "Policy",
            "Pricing",
            "Severity",
            "Slot",
            "Volume",
            "Level",
            "Admission",
            "Map"
        ]);
        expect(["speed", "admission-policy", "pricing-policy", "admission-severity", "save-slots", "town-map-level", "policy-panel-admission", "policy-panel-pricing"].map(formatSelectAriaLabel)).toEqual([
            "Simulation speed",
            "Automatic admission policy",
            "Treatment pricing policy",
            "Manual admission severity",
            "Saved slots",
            "Town map panel level",
            "Policy panel admission policy",
            "Policy panel pricing policy"
        ]);
        expect(["step", "admit", "treat", "restart-level", "next-level"].map(formatGameplayActionButtonLabel)).toEqual([
            "Step",
            "Admit",
            "Treat",
            "Restart Level",
            "Next Level"
        ]);
        expect(formatMenuBarShownActionStatus()).toBe("Action: menu bar shown");
        expect(["file", "options", "help"].map(formatMenuButtonLabel)).toEqual(["File", "Options", "Help"]);
        expect(formatPlacementRotatedActionStatus("south")).toBe("Action: placement rotated south");
        expect(formatQuitLevelActionStatus("confirmed")).toBe("Action: quit level confirmed");
        expect(formatQuitLevelPromptLabel()).toBe("Quit level and return to the browser main menu?");
        expect(formatQuitLevelButtonLabel("confirm")).toBe("Quit Level");
        expect(formatQuitLevelButtonLabel("cancel")).toBe("Stay");
    });
    it("maps original UI strip sprites to stable playable control zones", () => {
        expect(createOriginalUiStripControlZones({
            originalUiSpriteSheet: {
                sprites: [
                    { width: 10, height: 12, indices: [1] },
                    { width: 0, height: 8, indices: [1] },
                    { width: 14, height: 18, indices: [1] },
                    { width: 20, height: 10, indices: [] },
                    { width: 30, height: 40, indices: [1] },
                    { width: 50, height: 12, indices: [1] }
                ]
            }
        }, 70, 40)).toEqual([
            { id: "pause-toggle", label: "Pause", left: 6, top: 14, width: 10, height: 12 },
            { id: "step", label: "Step", left: 22, top: 11, width: 14, height: 18 },
            { id: "build-diagnosis-room", label: "Build GP", left: 42, top: 0, width: 28, height: 40 }
        ]);
        expect(createOriginalUiStripControlZones({
            originalUiSpriteSheet: {
                sprites: Array.from({ length: 8 }, () => ({ width: 10, height: 10, indices: [1] }))
            }
        }, 140, 40).map((zone) => zone.id)).toEqual([
            "pause-toggle",
            "step",
            "build-diagnosis-room",
            "build-cardiogram-room",
            "build-scanner-room",
            "build-ultrascan-room",
            "build-blood-machine-room",
            "build-x-ray-room",
        ]);
        expect(createOriginalUiStripControlZones({
            originalUiSpriteSheet: {
                sprites: Array.from({ length: 10 }, () => ({ width: 10, height: 10, indices: [1] }))
            }
        }, 180, 40).map((zone) => zone.id)).toEqual([
            "pause-toggle",
            "step",
            "build-diagnosis-room",
            "build-cardiogram-room",
            "build-scanner-room",
            "build-ultrascan-room",
            "build-blood-machine-room",
            "build-x-ray-room",
            "build-general-diagnosis-room",
            "build-treatment-room",
        ]);
        expect(createOriginalUiStripControlZones({
            originalUiSpriteSheet: {
                sprites: Array.from({ length: 14 }, () => ({ width: 10, height: 10, indices: [1] }))
            }
        }, 244, 40).map((zone) => zone.id)).toEqual([
            "pause-toggle",
            "step",
            "build-diagnosis-room",
            "build-cardiogram-room",
            "build-scanner-room",
            "build-ultrascan-room",
            "build-blood-machine-room",
            "build-x-ray-room",
            "build-general-diagnosis-room",
            "build-treatment-room",
            "build-ward-room",
            "build-pharmacy-room",
            "build-operating-theatre-room",
            "build-specialist-room",
        ]);
        expect(createOriginalUiStripControlZones({
            originalUiSpriteSheet: {
                sprites: Array.from({ length: 15 }, () => ({ width: 10, height: 10, indices: [1] }))
            }
        }, 260, 40).map((zone) => zone.id)).toEqual([
            "pause-toggle",
            "step",
            "build-diagnosis-room",
            "build-cardiogram-room",
            "build-scanner-room",
            "build-ultrascan-room",
            "build-blood-machine-room",
            "build-x-ray-room",
            "build-general-diagnosis-room",
            "build-treatment-room",
            "build-ward-room",
            "build-pharmacy-room",
            "build-operating-theatre-room",
            "build-specialist-room",
            "build-psychiatry-room",
        ]);
        expect(createOriginalUiStripControlZones({
            originalUiSpriteSheet: {
                sprites: Array.from({ length: 28 }, () => ({ width: 10, height: 10, indices: [1] }))
            }
        }, 452, 40).map((zone) => zone.id)).toEqual([
            "pause-toggle",
            "step",
            "build-diagnosis-room",
            "build-cardiogram-room",
            "build-scanner-room",
            "build-ultrascan-room",
            "build-blood-machine-room",
            "build-x-ray-room",
            "build-general-diagnosis-room",
            "build-treatment-room",
            "build-ward-room",
            "build-pharmacy-room",
            "build-operating-theatre-room",
            "build-specialist-room",
            "build-psychiatry-room",
            "build-staff-room",
            "build-research-room",
            "build-toilets",
            "build-training-room",
            "build-inflation-room",
            "build-slack-tongue-clinic",
            "build-fracture-clinic-room",
            "build-hair-restoration-room",
            "build-jelly-vat-room",
            "build-decontamination-room",
            "build-electrolysis-room",
            "build-dna-fixer-room",
            "hire-diagnostician",
        ]);
        expect(createOriginalUiStripControlZones({
            originalUiSpriteSheet: {
                sprites: Array.from({ length: 38 }, () => ({ width: 10, height: 10, indices: [1] }))
            }
        }, 612, 40).map((zone) => zone.id)).toEqual([
            "pause-toggle",
            "step",
            "build-diagnosis-room",
            "build-cardiogram-room",
            "build-scanner-room",
            "build-ultrascan-room",
            "build-blood-machine-room",
            "build-x-ray-room",
            "build-general-diagnosis-room",
            "build-treatment-room",
            "build-ward-room",
            "build-pharmacy-room",
            "build-operating-theatre-room",
            "build-specialist-room",
            "build-psychiatry-room",
            "build-staff-room",
            "build-research-room",
            "build-toilets",
            "build-training-room",
            "build-inflation-room",
            "build-slack-tongue-clinic",
            "build-fracture-clinic-room",
            "build-hair-restoration-room",
            "build-jelly-vat-room",
            "build-decontamination-room",
            "build-electrolysis-room",
            "build-dna-fixer-room",
            "hire-diagnostician",
            "hire-nurse",
            "hire-handyman",
            "hire-receptionist",
            "admit",
            "treat",
            "staff-break-toggle",
            "treatment-room-toggle",
            "open-jukebox",
            "open-furnish-corridor",
            "open-edit-room",
        ]);
        expect(createOriginalUiStripControlZones({
            originalUiSpriteSheet: {
                sprites: Array.from({ length: 49 }, () => ({ width: 10, height: 10, indices: [1] }))
            }
        }, 788, 40).map((zone) => zone.id).slice(43)).toEqual([
            "open-policy",
            "open-machine-menu",
            "take-loan",
            "repay-loan",
            "start-research",
            "run-finance-audit"
        ]);
    });
    it("uses imported original language names in the patient casebook", () => {
        expect(formatCasebookWithLanguage({
            entities: {
                waitingPatients: [
                    {
                        id: 1,
                        status: "queued",
                        diagnosisKnown: true,
                        diseaseId: "mild-cold",
                        diseaseName: "Mild Cold",
                        preferredTreatmentRoomType: "pharmacy",
                        needsToilet: true,
                        health: 40,
                        maxHealth: 40
                    }
                ]
            }
        }, {
            diseaseNames: {
                "mild-cold": "Uncommon Cold"
            },
            roomNames: {
                pharmacy: "Pharmacy"
            },
            patientStatusNames: {
                queued: "Queuing for %s"
            }
        })).toContain("Queuing for Pharmacy Uncommon Cold>Pharmacy needs toilet H40/40");
    });
    it("renders expanded casebook rows with patient actions", () => {
        const html = formatCasebookRowsHtml({
            entities: {
                waitingPatients: [
                    {
                        id: 2,
                        status: "queued",
                        diagnosisKnown: true,
                        diseaseId: "mild-cold",
                        diseaseName: "Mild Cold",
                        preferredTreatmentRoomType: "pharmacy",
                        assignedRoomId: 5,
                        vomited: true,
                        droppedLitter: true,
                        health: 35,
                        maxHealth: 40
                    }
                ]
            }
        }, {
            diseaseNames: {
                "mild-cold": "Uncommon Cold"
            },
            roomNames: {
                pharmacy: "Pharmacy"
            },
            patientStatusNames: {
                queued: "Queuing for %s"
            }
        });
        expect(html).toContain("data-testid=\"casebook-panel-table\"");
        expect(html).toContain("data-patient-id=\"2\"");
        expect(html).toContain("Uncommon Cold");
        expect(html).toContain("Flags");
        expect(html).toContain("vomited, litter");
        expect(html).toContain("35/40");
        expect(html).toContain("data-casebook-action=\"send-home\"");
        const terminalHtml = formatCasebookRowsHtml({
            entities: {
                waitingPatients: [
                    {
                        id: 2,
                        status: "queued",
                        diagnosisKnown: false,
                        health: 35,
                        maxHealth: 40
                    }
                ]
            }
        }, null, { levelObjectiveStatus: "won" });
        expect(terminalHtml).toContain("data-casebook-action=\"prioritize\" data-patient-id=\"2\" disabled");
        expect(terminalHtml).toContain("data-casebook-action=\"send-home\" data-patient-id=\"2\" disabled");
        expect(formatCasebookPanelEmptyStatus()).toBe("Casebook: no active patients");
        expect(formatCasebookPanelActionLabel("select")).toBe("Select");
        expect(formatCasebookPanelActionLabel("prioritize")).toBe("Prioritize");
        expect(formatCasebookPanelActionLabel("send-home")).toBe("Send Home");
        expect(["patient", "status", "disease", "need", "room", "flags", "health", "action"].map(formatCasebookPanelHeaderLabel)).toEqual([
            "Patient",
            "Status",
            "Disease",
            "Need",
            "Room",
            "Flags",
            "Health",
            "Action"
        ]);
        expect(formatCasebookRowsHtml({ entities: { waitingPatients: [] } })).toContain(formatCasebookPanelEmptyStatus());
    });
    it("formats patient condition flags for browser status surfaces", () => {
        expect(patientConditionLabels({
            vomited: true,
            droppedLitter: true,
            needsToilet: true,
            bowelOverflowed: true,
            drank: true,
            usedToilet: true
        })).toEqual(["vomited", "litter", "bowel overflow", "drank", "used toilet"]);
        expect(patientConditionLabels({ needsToilet: true })).toEqual(["needs toilet"]);
        expect(patientConditionLabels(null)).toEqual([]);
    });
    it("uses imported original staff role names in selection text", () => {
        expect(formatNoSelectionStatus()).toBe("Selection: none");
        expect(formatSelectionStatusWithLanguage({
            entities: {
                staff: [
                    {
                        id: 4,
                        role: "diagnostician",
                        status: "active",
                        skillLevel: 2,
                        trainingRemainingTicks: 0
                    }
                ],
                rooms: [],
                objects: [],
                waitingPatients: []
            }
        }, { type: "staff", id: 4 }, {
            staffRoles: {
                doctor: "Doctor"
            }
        })).toContain("Selection: Doctor #4");
        expect(formatSelectionStatusWithLanguage({
            entities: {
                staff: [],
                rooms: [],
                objects: [
                    {
                        id: 3,
                        objectIndex: 11,
                        name: "Radiator",
                        cost: 101,
                        strength: 9,
                        orientation: "west",
                        position: { x: 4, y: 5 }
                    }
                ],
                waitingPatients: []
            }
        }, { type: "object", id: 3 })).toBe("Selection: Radiator #3 (tile 4,5, facing west, value 101, strength 9)");
        expect(formatSelectionStatusWithLanguage({
            entities: {
                staff: [],
                rooms: [],
                objects: [],
                waitingPatients: [
                    {
                        id: 5,
                        status: "awaiting-treatment",
                        diagnosisKnown: true,
                        diseaseId: "mild-cold",
                        diseaseName: "Mild Cold",
                        preferredTreatmentRoomType: "pharmacy",
                        assignedRoomId: 7,
                        needsToilet: true,
                        drank: true,
                        health: 9,
                        maxHealth: 40
                    }
                ]
            }
        }, { type: "patient", id: 5 }, {
            diseaseNames: {
                "mild-cold": "Uncommon Cold"
            },
            roomNames: {
                pharmacy: "Pharmacy"
            },
            patientStatusNames: {
                "awaiting-treatment": "Waiting for %s"
            }
        })).toBe("Selection: patient #5 (Waiting for Pharmacy, Uncommon Cold, needs Pharmacy, room #7, needs toilet, drank, health 9/40)");
    });
    it("uses distinct marker colors for playable staff roles", () => {
        const colors = ["diagnostician", "nurse", "handyman", "receptionist"].map(staffRoleMarkerColor);

        expect(new Set(colors).size).toBe(colors.length);
        expect(colors).not.toContain("#ffffff");
        expect(staffRoleMarkerColor("unknown")).toBe("#ffffff");
    });
    it("uses imported original room names in room availability text", () => {
        expect(formatRoomAvailabilityStatus("diagnosis,treatment,specialist", {
            roomNames: {
                diagnosis: "GP's Office",
                treatment: "Ward",
                specialist: "Inflation Room"
            }
        })).toBe("GP's Office, Ward, Inflation Room");
        expect(formatRoomAvailabilityHudStatus({
            roomAvailabilityStatus: "diagnosis,treatment,specialist"
        }, {
            roomNames: {
                diagnosis: "GP's Office",
                treatment: "Ward",
                specialist: "Inflation Room"
            }
        })).toBe("Room availability: GP's Office, Ward, Inflation Room");
        expect(formatRoomAvailabilityHudStatus({
            roomAvailabilityStatus: "unrestricted"
        })).toBe("Room availability: unrestricted");
    });
    it("uses imported room names and scenario costs in build labels", () => {
        expect(["diagnosis", "cardiogram", "scanner", "ultrascan", "blood-machine", "x-ray", "general-diagnosis", "treatment", "ward", "pharmacy", "operating-theatre", "specialist", "psychiatry", "staff-room", "research", "toilets", "training-room", "inflation-room", "slack-tongue-clinic", "fracture-clinic", "hair-restoration", "jelly-vat", "decontamination", "electrolysis", "dna-fixer"].map((roomType) => formatBuildRoomButtonLabel(roomType).replace(/\s+\(\d+\)$/, ""))).toEqual([
            "Build Diagnosis",
            "Build Cardiogram",
            "Build Scanner",
            "Build Ultrascan",
            "Build Blood Machine",
            "Build X-Ray",
            "Build General Diagnosis",
            "Build Treatment",
            "Build Ward",
            "Build Pharmacy",
            "Build Operating Theatre",
            "Build Specialist",
            "Build Psychiatry",
            "Build Staff Room",
            "Build Research",
            "Build Toilets",
            "Build Training Room",
            "Build Inflation Room",
            "Build Slack Tongue Clinic",
            "Build Fracture Clinic",
            "Build Hair Restoration",
            "Build Jelly Vat",
            "Build Decontamination",
            "Build Electrolysis",
            "Build DNA Fixer"
        ]);
        expect(formatBuildRoomButtonLabel("diagnosis", {
            scenarioRoomCostOverrides: { diagnosis: 2280 }
        }, {
            roomNames: { diagnosis: "GP's Office" }
        })).toBe("Build GP's Office (2280)");
        expect(formatBuildRoomButtonLabel("dna-fixer", {
            scenarioRoomCostOverrides: { "dna-fixer": 1750 }
        }, {
            roomNames: { "dna-fixer": "DNA Fixer" }
        })).toBe("Build DNA Fixer (1750)");
    });
    it("keeps room build controls available for placement feedback unless unaffordable", () => {
        expect(canBuildRoomFromTelemetry("diagnosis", {
            cash: 2_500,
            roomAvailabilityStatus: "diagnosis,treatment",
            scenarioRoomCostOverrides: { diagnosis: 2_280, specialist: 1_500 }
        })).toBe(true);
        expect(canBuildRoomFromTelemetry("specialist", {
            cash: 2_500,
            roomAvailabilityStatus: "diagnosis,treatment",
            scenarioRoomCostOverrides: { specialist: 1_500 }
        })).toBe(true);
        expect(canBuildRoomFromTelemetry("diagnosis", {
            cash: 500,
            roomAvailabilityStatus: "unrestricted",
            scenarioRoomCostOverrides: { diagnosis: 2_280 }
        })).toBe(false);
        expect(canBuildRoomFromTelemetry("diagnosis", {
            cash: 2_500,
            levelObjectiveStatus: "lost",
            roomAvailabilityStatus: "unrestricted",
            scenarioRoomCostOverrides: { diagnosis: 2_280 }
        })).toBe(false);
        expect(canBuildRoomFromTelemetry("diagnosis", {
            cash: 2_500,
            levelObjectiveStatus: "won",
            roomAvailabilityStatus: "unrestricted",
            scenarioRoomCostOverrides: { diagnosis: 2_280 }
        })).toBe(false);
    });
    it("uses imported staff role names and scenario wages in hire labels", () => {
        expect(["diagnostician", "nurse", "handyman", "receptionist"].map((role) => formatHireStaffButtonLabel(role).replace(/\s+\(\d+, wage \d+\)$/, ""))).toEqual([
            "Hire Diagnostician",
            "Hire Nurse",
            "Hire Handyman",
            "Hire Receptionist"
        ]);
        expect(formatHireStaffButtonLabel("diagnostician", {
            scenarioStaffWageOverrides: { diagnostician: 6 }
        }, {
            staffRoles: { doctor: "Doctor" }
        })).toBe("Hire Doctor (300, wage 6)");
    });
    it("blocks unaffordable staff or exhausted staff-market controls before placement", () => {
        expect(canHireStaffFromTelemetry("diagnostician", {
            cash: 500,
            staffMarketDoctorsAvailable: 1
        })).toBe(true);
        expect(canHireStaffFromTelemetry("diagnostician", {
            cash: 500,
            staffMarketDoctorsAvailable: 0
        })).toBe(false);
        expect(canHireStaffFromTelemetry("nurse", {
            cash: 100,
            staffMarketNursesAvailable: Number.POSITIVE_INFINITY
        })).toBe(false);
        expect(canHireStaffFromTelemetry("receptionist", {
            cash: 500,
            levelObjectiveStatus: "lost",
            staffMarketReceptionistsAvailable: 1
        })).toBe(false);
        expect(canHireStaffFromTelemetry("receptionist", {
            cash: 500,
            levelObjectiveStatus: "won",
            staffMarketReceptionistsAvailable: 1
        })).toBe(false);
    });
    it("blocks unavailable finance and campaign controls before dispatch", () => {
        expect(formatFinanceActionButtonLabel("take-loan")).toBe("Take Loan");
        expect(formatFinanceActionButtonLabel("repay-loan")).toBe("Repay Loan");
        expect(formatFinanceActionButtonLabel("run-audit")).toBe("Run Audit");
        expect(["research", "emergency", "epidemic", "vip", "marketing", "insurance", "awards"].map(formatCampaignActionButtonLabel)).toEqual([
            "Fund Research",
            "Emergency",
            "Epidemic",
            "VIP Visit",
            "Run Marketing",
            "Insurance",
            "Awards"
        ]);
        expect(canTakeLoanFromTelemetry({
            outstandingLoan: 0,
            loanMaxOutstanding: 6_000
        })).toBe(true);
        expect(canTakeLoanFromTelemetry({
            outstandingLoan: 6_000,
            loanMaxOutstanding: 6_000
        })).toBe(false);
        expect(canTakeLoanFromTelemetry({
            outstandingLoan: 0,
            loanMaxOutstanding: 6_000,
            levelObjectiveStatus: "lost"
        })).toBe(false);
        expect(canTakeLoanFromTelemetry({
            outstandingLoan: 0,
            loanMaxOutstanding: 6_000,
            levelObjectiveStatus: "won"
        })).toBe(false);
        expect(canRepayLoanFromTelemetry({
            outstandingLoan: 1_000,
            loanChunkAmount: 500,
            cash: 500
        })).toBe(true);
        expect(canRepayLoanFromTelemetry({
            outstandingLoan: 1_000,
            loanChunkAmount: 500,
            cash: 499
        })).toBe(false);
        expect(canRepayLoanFromTelemetry({
            outstandingLoan: 1_000,
            loanChunkAmount: 500,
            cash: 500,
            levelObjectiveStatus: "lost"
        })).toBe(false);
        expect(canRunFinanceAuditFromTelemetry({
            financeLedgerUnlocked: true,
            financeAuditReady: true
        })).toBe(true);
        expect(canRunFinanceAuditFromTelemetry({
            financeLedgerUnlocked: true,
            financeAuditReady: false
        })).toBe(false);
        expect(canRunFinanceAuditFromTelemetry({
            financeLedgerUnlocked: true,
            financeAuditReady: true,
            levelObjectiveStatus: "lost"
        })).toBe(false);
        expect(canRunMarketingCampaignFromTelemetry({
            cash: 600,
            marketingCampaignCost: 600,
            reputation: 999
        })).toBe(true);
        expect(canRunMarketingCampaignFromTelemetry({
            cash: 599,
            marketingCampaignCost: 600,
            reputation: 999
        })).toBe(false);
        expect(canRunMarketingCampaignFromTelemetry({
            cash: 600,
            marketingCampaignCost: 600,
            reputation: 1000
        })).toBe(false);
        expect(canRunMarketingCampaignFromTelemetry({
            cash: 600,
            marketingCampaignCost: 600,
            reputation: 999,
            levelObjectiveStatus: "lost"
        })).toBe(false);
        expect(canStartInsuranceContractFromTelemetry({
            insuranceContractUnlocked: true,
            insuranceContractActive: false
        })).toBe(true);
        expect(canStartInsuranceContractFromTelemetry({
            insuranceContractUnlocked: true,
            insuranceContractActive: true
        })).toBe(false);
        expect(canStartInsuranceContractFromTelemetry({
            insuranceContractUnlocked: true,
            insuranceContractActive: false,
            levelObjectiveStatus: "lost"
        })).toBe(false);
        expect(canStartResearchFromTelemetry({
            treatmentResearchActive: false,
            treatmentResearchLevel: 1,
            treatmentResearchMaxLevel: 3,
            treatmentResearchProjectCost: 1_000,
            cash: 1_000
        })).toBe(true);
        expect(canStartResearchFromTelemetry({
            treatmentResearchActive: true,
            treatmentResearchLevel: 1,
            treatmentResearchMaxLevel: 3,
            treatmentResearchProjectCost: 1_000,
            cash: 1_000
        })).toBe(false);
        expect(canStartResearchFromTelemetry({
            treatmentResearchActive: false,
            treatmentResearchLevel: 1,
            treatmentResearchMaxLevel: 3,
            treatmentResearchProjectCost: 1_000,
            cash: 1_000,
            levelObjectiveStatus: "lost"
        })).toBe(false);
        expect(canStartResearchFromTelemetry({
            treatmentResearchActive: false,
            treatmentResearchLevel: 1,
            treatmentResearchMaxLevel: 3,
            treatmentResearchProjectCost: 1_000,
            cash: 1_000,
            levelObjectiveStatus: "won"
        })).toBe(false);
    });
    it("blocks unavailable level navigation controls before dispatch", () => {
        const view = {
            map: { width: 64, height: 64 },
            mapPath: "LEVELS/FIRST.MAP",
            mapSummaries: [
                { path: "LEVELS/FIRST.MAP" },
                { path: "LEVELS/SECOND.MAP" }
            ]
        };
        expect(canRestartLevelFromHospitalView(view)).toBe(true);
        expect(canRestartLevelFromHospitalView({ map: null })).toBe(false);
        expect(canAdvanceToNextLevelFromTelemetry(view, {
            levelObjectiveStatus: "won"
        })).toBe(true);
        expect(canAdvanceToNextLevelFromTelemetry(view, {
            levelObjectiveStatus: "in-progress"
        })).toBe(false);
        expect(canAdvanceToNextLevelFromTelemetry({
            ...view,
            mapPath: "LEVELS/SECOND.MAP"
        }, {
            levelObjectiveStatus: "won"
        })).toBe(false);
    });
    it("blocks unavailable staff and room toggles before dispatch", () => {
        const state = {
            entities: {
                staff: [
                    { id: 7, role: "nurse" },
                    { id: 3, role: "diagnostician" }
                ],
                rooms: [
                    { id: 4, roomType: "diagnosis" },
                    { id: 2, roomType: "treatment" }
                ]
            }
        };
        expect(canToggleStaffBreakFromState(state)).toBe(true);
        expect(canToggleTreatmentRoomFromState(state)).toBe(true);
        expect(canToggleStaffBreakFromState({ entities: { staff: [{ id: 7, role: "nurse" }] } })).toBe(false);
        expect(canToggleTreatmentRoomFromState({ entities: { rooms: [{ id: 4, roomType: "diagnosis" }] } })).toBe(false);
        expect(canToggleStaffBreakFromState({ entities: { staff: [] } }, { id: 9, role: "handyman" })).toBe(true);
        expect(canToggleTreatmentRoomFromState({ entities: { rooms: [] } }, { id: 8, roomType: "pharmacy" })).toBe(true);
        expect(canToggleStaffBreakFromState(state, null, {
            levelObjectiveStatus: "lost"
        })).toBe(false);
        expect(canToggleTreatmentRoomFromState(state, null, {
            levelObjectiveStatus: "lost"
        })).toBe(false);
        expect(canToggleStaffBreakFromState(state, null, {
            levelObjectiveStatus: "won"
        })).toBe(false);
        expect(canToggleTreatmentRoomFromState(state, null, {
            levelObjectiveStatus: "won"
        })).toBe(false);
    });
    it("blocks pristine or unaffordable selected-room repairs before dispatch", () => {
        expect(canRepairRoomFromTelemetry({
            roomType: "diagnosis",
            wear: 0,
            maintenanceRemainingTicks: 0
        }, { cash: 1_000 })).toBe(false);
        expect(canRepairRoomFromTelemetry({
            roomType: "diagnosis",
            wear: 2,
            maintenanceRemainingTicks: 0
        }, { cash: 1_000 })).toBe(true);
        expect(canRepairRoomFromTelemetry({
            roomType: "diagnosis",
            wear: 2,
            maintenanceRemainingTicks: 1
        }, { cash: 10 })).toBe(false);
        expect(canRepairRoomFromTelemetry({
            roomType: "diagnosis",
            wear: 2,
            maintenanceRemainingTicks: 0
        }, {
            cash: 1_000,
            levelObjectiveStatus: "lost"
        })).toBe(false);
    });
    it("blocks unavailable selected-staff rest and training before dispatch", () => {
        expect(canRestStaffFromTelemetry({
            status: "on-break",
            trainingRemainingTicks: 0,
            stress: 4
        })).toBe(true);
        expect(canRestStaffFromTelemetry({
            status: "active",
            trainingRemainingTicks: 0,
            stress: 4
        })).toBe(false);
        expect(canRestStaffFromTelemetry({
            status: "on-break",
            trainingRemainingTicks: 1,
            stress: 4
        })).toBe(false);
        expect(canRestStaffFromTelemetry({
            status: "on-break",
            trainingRemainingTicks: 0,
            stress: 4
        }, {
            levelObjectiveStatus: "lost"
        })).toBe(false);
        expect(canTrainStaffFromTelemetry({
            trainingRemainingTicks: 0,
            skillLevel: 1
        }, {
            maxStaffSkillLevel: 3,
            staffTrainingCost: 400,
            cash: 500
        })).toBe(true);
        expect(canTrainStaffFromTelemetry({
            trainingRemainingTicks: 1,
            skillLevel: 1
        }, {
            maxStaffSkillLevel: 3,
            staffTrainingCost: 400,
            cash: 500
        })).toBe(false);
        expect(canTrainStaffFromTelemetry({
            trainingRemainingTicks: 0,
            skillLevel: 3
        }, {
            maxStaffSkillLevel: 3,
            staffTrainingCost: 400,
            cash: 500
        })).toBe(false);
        expect(canTrainStaffFromTelemetry({
            trainingRemainingTicks: 0,
            skillLevel: 1
        }, {
            maxStaffSkillLevel: 3,
            staffTrainingCost: 400,
            cash: 100
        })).toBe(false);
        expect(canTrainStaffFromTelemetry({
            trainingRemainingTicks: 0,
            skillLevel: 1
        }, {
            maxStaffSkillLevel: 3,
            staffTrainingCost: 400,
            cash: 500,
            levelObjectiveStatus: "lost"
        })).toBe(false);
    });
    it("blocks selected-patient prioritization outside queueable states", () => {
        expect(canPrioritizePatient({
            status: "queued"
        })).toBe(true);
        expect(canPrioritizePatient({
            status: "awaiting-treatment"
        })).toBe(true);
        expect(canPrioritizePatient({
            status: "queued"
        }, {
            levelObjectiveStatus: "won"
        })).toBe(false);
        expect(canSendPatientHome({
            status: "queued"
        })).toBe(true);
        expect(canSendPatientHome({
            status: "queued"
        }, {
            levelObjectiveStatus: "lost"
        })).toBe(false);
        expect(canPrioritizePatient({
            status: "walking-to-diagnosis"
        })).toBe(false);
        expect(canPrioritizePatient({
            status: "diagnosing"
        })).toBe(false);
        expect(canPrioritizePatient(null)).toBe(false);
        expect(canSendPatientHome(null)).toBe(false);
    });
    it("blocks stale selected staff and room destructive controls before dispatch", () => {
        expect(["move-staff", "rest-staff", "train-staff", "fire-staff", "sell-room", "sell-object", "repair-room"].map(formatSelectedStaffRoomActionButtonLabel)).toEqual([
            "Move Staff",
            "Rest Staff",
            "Train Staff",
            "Fire Staff",
            "Sell Room",
            "Sell Object",
            "Repair Room"
        ]);
        expect(canFireStaff({ id: 3 })).toBe(true);
        expect(canFireStaff(null)).toBe(false);
        expect(canFireStaff({ id: 3 }, {
            levelObjectiveStatus: "lost"
        })).toBe(false);
        expect(canFireStaff({ id: 3 }, {
            levelObjectiveStatus: "won"
        })).toBe(false);
        expect(canSellRoom({ id: 4 })).toBe(true);
        expect(canSellRoom(null)).toBe(false);
        expect(canSellRoom({ id: 4 }, {
            levelObjectiveStatus: "lost"
        })).toBe(false);
        expect(canSellRoom({ id: 4 }, {
            levelObjectiveStatus: "won"
        })).toBe(false);
        expect(canSellObject({ id: 5 })).toBe(true);
        expect(canSellObject(null)).toBe(false);
        expect(canSellObject({ id: 5 }, {
            levelObjectiveStatus: "lost"
        })).toBe(false);
        expect(canSellObject({ id: 5 }, {
            levelObjectiveStatus: "won"
        })).toBe(false);
    });
    it("blocks scheduled emergency controls outside the active scenario window", () => {
        expect(canStartEmergencyFromTelemetry({
            emergencyActive: false,
            scenarioEmergencyScheduleSize: 0
        })).toBe(true);
        expect(canStartEmergencyFromTelemetry({
            emergencyActive: true,
            scenarioEmergencyScheduleSize: 0
        })).toBe(false);
        expect(canStartEmergencyFromTelemetry({
            emergencyActive: false,
            scenarioEmergencyScheduleSize: 2,
            scenarioEmergencyActiveIndex: null,
            scenarioNextEmergencyIndex: 0
        })).toBe(false);
        expect(canStartEmergencyFromTelemetry({
            emergencyActive: false,
            scenarioEmergencyScheduleSize: 2,
            scenarioEmergencyActiveIndex: 1,
            scenarioNextEmergencyIndex: null
        })).toBe(true);
        expect(canStartEmergencyFromTelemetry({
            emergencyActive: false,
            scenarioEmergencyScheduleSize: 0,
            levelObjectiveStatus: "lost"
        })).toBe(false);
        expect(canStartEmergencyFromTelemetry({
            emergencyActive: false,
            scenarioEmergencyScheduleSize: 0,
            levelObjectiveStatus: "won"
        })).toBe(false);
    });
    it("blocks award ceremonies until imported award criteria are met", () => {
        expect(canRunAwardsFromTelemetry({
            scenarioAwardCriteriaMet: true
        })).toBe(true);
        expect(canRunAwardsFromTelemetry({
            scenarioAwardCriteriaMet: false
        })).toBe(false);
        expect(canRunAwardsFromTelemetry({})).toBe(true);
        expect(canRunAwardsFromTelemetry({
            scenarioAwardCriteriaMet: true,
            levelObjectiveStatus: "lost"
        })).toBe(false);
    });
    it("blocks active epidemic and VIP event controls before dispatch", () => {
        expect(canStartEpidemicFromTelemetry({
            epidemicActive: false
        })).toBe(true);
        expect(canStartEpidemicFromTelemetry({
            epidemicActive: true
        })).toBe(false);
        expect(canStartEpidemicFromTelemetry({
            epidemicActive: false,
            levelObjectiveStatus: "lost"
        })).toBe(false);
        expect(canStartEpidemicFromTelemetry(null)).toBe(false);
        expect(canStartVipInspectionFromTelemetry({
            vipInspectionActive: false
        })).toBe(true);
        expect(canStartVipInspectionFromTelemetry({
            vipInspectionActive: true
        })).toBe(false);
        expect(canStartVipInspectionFromTelemetry({
            vipInspectionActive: false,
            levelObjectiveStatus: "lost"
        })).toBe(false);
        expect(canStartVipInspectionFromTelemetry(null)).toBe(false);
    });
    it("blocks selected-patient comfort controls when the core command would fail", () => {
        expect(formatSelectedPatientActionButtonLabel("prioritize")).toBe("Prioritize");
        expect(formatSelectedPatientActionButtonLabel("send-home")).toBe("Send Home");
        expect(formatSelectedPatientActionButtonLabel("give-drink")).toBe("Give Drink");
        expect(formatSelectedPatientActionButtonLabel("send-toilet")).toBe("Toilet");
        expect(canGiveDrinkToPatient({
            health: 8,
            maxHealth: 10,
            drank: false
        }, { scenarioPatientDrinkHappy: 3 })).toBe(true);
        expect(canGiveDrinkToPatient({
            health: 10,
            maxHealth: 10,
            drank: false
        }, { scenarioPatientDrinkHappy: 3 })).toBe(false);
        expect(canGiveDrinkToPatient({
            health: 8,
            maxHealth: 10,
            drank: true
        }, { scenarioPatientDrinkHappy: 3 })).toBe(false);
        expect(canGiveDrinkToPatient({
            health: 8,
            maxHealth: 10,
            drank: false
        }, { scenarioPatientDrinkHappy: 3, levelObjectiveStatus: "won" })).toBe(false);
        expect(canGiveDrinkToPatient({
            health: 8,
            maxHealth: 10,
            drank: false
        }, { scenarioPatientDrinkHappy: null })).toBe(false);
        expect(canSendPatientToilet({
            health: 8,
            usedToilet: false,
            needsToilet: false
        }, { scenarioPatientToiletHappy: 4 })).toBe(true);
        expect(canSendPatientToilet({
            health: 8,
            usedToilet: false,
            needsToilet: true
        }, { scenarioPatientToiletHappy: null })).toBe(true);
        expect(canSendPatientToilet({
            health: 8,
            usedToilet: true
        }, { scenarioPatientToiletHappy: 4 })).toBe(false);
        expect(canSendPatientToilet({
            health: 8,
            usedToilet: false,
            needsToilet: false
        }, { scenarioPatientToiletHappy: 4, levelObjectiveStatus: "lost" })).toBe(false);
        expect(canSendPatientToilet({
            health: 0,
            usedToilet: false
        }, { scenarioPatientToiletHappy: 4 })).toBe(false);
        expect(canSendPatientToilet({
            health: 8,
            usedToilet: false,
            needsToilet: false
        }, { scenarioPatientToiletHappy: null })).toBe(false);
    });
    it("formats placement previews and action feedback for the browser status bar", () => {
        expect(formatPlacementMode(null, null)).toBe("Placement: none");
        expect(formatPlacementMode({ label: "build GP's Office" }, null)).toBe("Placement: build GP's Office");
        expect(formatPlacementMode({ label: "build GP's Office", orientation: "east" }, null)).toBe("Placement: build GP's Office facing east");
        expect(formatPlacementMode({ label: "build GP's Office" }, {
            valid: true,
            requestedPosition: { x: 6, y: 4 }
        })).toBe("Placement: build GP's Office at 6,4 (valid)");
        expect(formatPlacementMode({ label: "build GP's Office", orientation: "south" }, {
            valid: true,
            requestedPosition: { x: 6, y: 4 }
        })).toBe("Placement: build GP's Office facing south at 6,4 (valid)");
        expect(formatPlacementMode({ label: "hire Nurse" }, {
            valid: false,
            position: { x: 1, y: 2 },
            reason: "occupied"
        })).toBe("Placement: hire Nurse at 1,2 blocked: occupied");
        expect(formatPlacementMode({ label: "move Doctor" }, {
            valid: false,
            reason: "unknown-rule"
        })).toBe("Placement: move Doctor blocked: unknown-rule");
        expect(formatPlacementMode({ label: "move Doctor" }, {
            valid: false,
            reason: "missing-staff"
        })).toBe("Placement: move Doctor blocked: staff unavailable");
        expect(formatPlacementMode({ label: "place Plant" }, {
            valid: false,
            requestedPosition: { x: 4, y: 4 },
            reason: "object-unavailable"
        })).toBe("Placement: place Plant at 4,4 blocked: object unavailable in scenario");
        expect(formatActionStatus(["room.built"], null)).toBe("Action: room built");
        expect(formatActionStatus("app.paused")).toBe("Action: paused");
        expect(formatActionStatus("app.resumed")).toBe("Action: resumed");
        expect(formatActionStatus("app.step")).toBe("Action: step");
        expect(formatActionStatus("admissions.opened")).toBe("Action: admissions open");
        expect(formatActionStatus("admissions.closed")).toBe("Action: admissions closed");
        expect(formatActionStatus("admissions.blocked")).toBe("Action: admissions blocked");
        expect(formatActionStatus("speed.changed")).toBe("Action: speed changed");
        expect(formatActionStatus("cancel-action-blocked")).toBe("Action: cancel blocked");
        expect(formatActionStatus("camera.unavailable")).toBe("Action: camera unavailable");
        expect(formatActionStatus("camera-position.unavailable")).toBe("Action: camera position unavailable");
        expect(formatActionStatus("confirm-action-blocked")).toBe("Action: confirm blocked");
        expect(formatActionStatus("placement.rotate-blocked")).toBe("Action: placement rotation blocked");
        expect(formatActionStatus("transparent-walls.unavailable")).toBe("Action: transparent walls unavailable");
        expect(formatActionStatus("zoom.unavailable")).toBe("Action: zoom unavailable");
        expect(formatActionStatus("admission-policy.changed")).toBe("Action: admission policy changed");
        expect(formatActionStatus("admission-policy.blocked")).toBe("Action: admission policy blocked");
        expect(formatActionStatus("pricing-policy.changed")).toBe("Action: pricing policy changed");
        expect(formatActionStatus("pricing-policy.unchanged")).toBe("Action: pricing policy unchanged");
        expect(formatActionStatus("loan.taken")).toBe("Action: loan taken");
        expect(formatActionStatus("loan.take-blocked")).toBe("Action: loan blocked");
        expect(formatActionStatus("loan.repaid")).toBe("Action: loan repaid");
        expect(formatActionStatus("loan.repay-blocked")).toBe("Action: loan repayment blocked");
        expect(formatActionStatus("finance.audit-run")).toBe("Action: finance audit run");
        expect(formatActionStatus("marketing.blocked")).toBe("Action: marketing campaign blocked");
        expect(formatActionStatus("marketing.launched")).toBe("Action: marketing campaign launched");
        expect(formatActionStatus("finance.audit-blocked")).toBe("Action: finance audit blocked");
        expect(formatActionStatus("insurance.started")).toBe("Action: insurance contract started");
        expect(formatActionStatus("insurance.blocked")).toBe("Action: insurance contract blocked");
        expect(formatActionStatus("awards.completed")).toBe("Action: awards completed");
        expect(formatActionStatus("awards.blocked")).toBe("Action: awards blocked");
        expect(formatActionStatus("awards.poor-blocked")).toBe("Action: awards poor criteria blocked");
        expect(formatActionStatus("awards.penalty-applied")).toBe("Action: awards penalty applied");
        expect(formatActionStatus("research.started")).toBe("Action: research started");
        expect(formatActionStatus("research.blocked")).toBe("Action: research blocked");
        expect(formatActionStatus("emergency.started")).toBe("Action: emergency started");
        expect(formatActionStatus("emergency.blocked")).toBe("Action: emergency blocked");
        expect(formatActionStatus("epidemic.started")).toBe("Action: epidemic started");
        expect(formatActionStatus("epidemic.blocked")).toBe("Action: epidemic blocked");
        expect(formatActionStatus("vip.started")).toBe("Action: VIP inspection started");
        expect(formatActionStatus("vip.blocked")).toBe("Action: VIP inspection blocked");
        expect(formatActionStatus("rat.killed")).toBe("Action: rat killed");
        expect(formatActionStatus("rat.missed")).toBe("Action: rat missed");
        expect(formatActionStatus("rat.blocked")).toBe("Action: rat blocked");
        expect(formatActionStatus("plant.watered")).toBe("Action: plant watered");
        expect(formatActionStatus("plant.neglected")).toBe("Action: plant neglected");
        expect(formatActionStatus("plant.blocked")).toBe("Action: plant blocked");
        expect(formatActionStatus("room.build-blocked")).toBe("Action: room blocked");
        expect(formatActionStatus(["room.build-blocked"], { reason: "occupied" })).toBe("Action: room blocked: occupied");
        expect(formatActionStatus("staff.hired")).toBe("Action: staff hired");
        expect(formatActionStatus("staff.hire-blocked", { reason: "staff-market-empty" })).toBe("Action: staff blocked: no scenario staff available");
        expect(formatActionStatus("staff.moved")).toBe("Action: staff moved");
        expect(formatActionStatus(["staff.move-blocked"], { reason: "invalid-terrain" })).toBe("Action: staff move blocked: invalid terrain");
        expect(formatActionStatus(["staff.move-blocked"], { reason: "missing-staff" })).toBe("Action: staff move blocked: staff unavailable");
        expect(formatActionStatus("room.sold")).toBe("Action: room sold");
        expect(formatActionStatus("room.sell-blocked")).toBe("Action: room sale blocked");
        expect(formatActionStatus("object.placed")).toBe("Action: object placed");
        expect(formatActionStatus("object.sold")).toBe("Action: object sold");
        expect(formatActionStatus("object.sell-blocked")).toBe("Action: object sale blocked");
        expect(formatActionStatus("staff.fired")).toBe("Action: staff fired");
        expect(formatActionStatus("staff.fire-blocked")).toBe("Action: staff fire blocked");
        expect(formatActionStatus("room.repaired")).toBe("Action: room repaired");
        expect(formatActionStatus("room.repair-blocked")).toBe("Action: room repair blocked");
        expect(formatActionStatus("staff.rested")).toBe("Action: staff rested");
        expect(formatActionStatus("staff.rest-blocked")).toBe("Action: staff rest blocked");
        expect(formatActionStatus("staff.break-blocked")).toBe("Action: staff break blocked");
        expect(formatActionStatus("training.started")).toBe("Action: staff training started");
        expect(formatActionStatus("training.blocked")).toBe("Action: staff training blocked");
        expect(formatActionStatus("treatment-room.toggle-blocked")).toBe("Action: treatment room toggle blocked");
        expect(formatActionStatus("patient.admitted")).toBe("Action: patient admitted");
        expect(formatActionStatus("patient.admit-blocked")).toBe("Action: admission blocked");
        expect(formatActionStatus("patient.prioritized")).toBe("Action: patient prioritized");
        expect(formatActionStatus("patient.prioritize-empty")).toBe("Action: patient cannot be prioritized");
        expect(formatActionStatus("patient.sent-home")).toBe("Action: patient sent home");
        expect(formatActionStatus("patient.send-home-empty")).toBe("Action: no patient selected");
        expect(formatActionStatus("patient.treated.success")).toBe("Action: patient treated");
        expect(formatActionStatus("patient.treated.empty")).toBe("Action: no patient selected");
        expect(formatActionStatus(["object.place-blocked"], { reason: "object-unavailable" })).toBe("Action: object placement blocked: object unavailable in scenario");
        expect(formatActionStatus("patient.drink-given")).toBe("Action: drink given");
        expect(formatActionStatus("patient.drink-blocked")).toBe("Action: drink blocked");
        expect(formatActionStatus("patient.toilet-used")).toBe("Action: toilet used");
        expect(formatActionStatus("patient.toilet-blocked")).toBe("Action: toilet blocked");
        expect(formatActionStatus(["not-a-player-event"], null)).toBeNull();
        expect(formatActionStatus([], null)).toBeNull();
        expect(formatChoosePlacementActionStatus()).toBe("Action: choose placement");
        expect(formatIdleActionStatus()).toBe("Action: idle");
        expect(formatSelectedEntityActionStatus("patient")).toBe("Action: selected patient");
        expect(formatSelectedEntityActionStatus("staff")).toBe("Action: selected staff");
        expect(formatSelectedEntityActionStatus("room")).toBe("Action: selected room");
        expect(formatVisibilityActionStatus("advisor", true)).toBe("Action: advisor shown");
        expect(formatVisibilityActionStatus("information", false)).toBe("Action: information hidden");
        expect(formatTransparentWallsActionStatus("held")).toBe("Action: transparent walls held");
        expect(formatTransparentWallsActionStatus("released")).toBe("Action: transparent walls released");
        expect(formatNoMessagesActionStatus()).toBe("Action: no messages");
        expect(formatInformationStatus(true)).toBe("Info: shown");
        expect(formatInformationStatus(false)).toBe("Info: hidden");
    });
    it("formats save/load feedback for the browser status bar", () => {
        expect(formatSaveActionButtonLabel("save")).toBe("Save");
        expect(formatSaveActionButtonLabel("load")).toBe("Load");
        expect(formatSaveActionButtonLabel("refresh-slots")).toBe("Refresh Slots");
        expect(formatSaveActionButtonLabel("delete-slot")).toBe("Delete Slot");
        expect(formatSaveSlotsStatus(0)).toBe("Save: no slots");
        expect(formatSaveSlotsStatus(1)).toBe("Save: 1 slot");
        expect(formatSaveSlotsStatus(2)).toBe("Save: 2 slots");
        expect(formatSaveLifecycleStatus("saving")).toBe("Save: saving");
        expect(formatSaveLifecycleStatus("loading")).toBe("Save: loading");
        expect(formatSaveLifecycleStatus("no slot")).toBe("Save: no slot");
        expect(formatSaveLifecycleStatus("deleting")).toBe("Save: deleting");
        expect(formatSaveSlotOptionsHtml([
            { slot: "slot-b" },
            { slot: "slot-a" },
            { slot: "slot-b" },
            { slot: "slot<&>" }
        ], "browser-autosave")).toBe('<option value="browser-autosave">browser-autosave</option><option value="slot-a">slot-a</option><option value="slot-b">slot-b</option><option value="slot&lt;&amp;&gt;">slot&lt;&amp;&gt;</option>');
        expect(formatSaveTickStatus(12, "slot-a")).toBe("Save: tick 12 (slot-a)");
        expect(formatLoadResultStatus("exact", 12, "slot-a")).toBe("Save: loaded tick 12 (slot-a)");
        expect(formatLoadResultStatus("fallback", 0, "slot-a")).toBe("Save: fallback");
        expect(formatMissingMapLoadStatus("LEVELS/MISSING.MAP")).toBe("Load failed: missing map LEVELS/MISSING.MAP");
        expect(formatDeletedSaveSlotStatus("slot-a")).toBe("Save: deleted slot-a");
        expect(formatSaveFailureStatus("Load", "bad envelope")).toBe("Load failed: bad envelope");
        expect(formatNewMapStatus("LEVELS/EXAMPLE.MAP")).toBe("Save: new map LEVELS/EXAMPLE.MAP");
        expect(formatRestartedLevelStatus("LEVELS/SECOND.MAP")).toBe("Save: restarted LEVELS/SECOND.MAP");
        expect(formatRestartLevelUnavailableStatus()).toBe("Save: restart unavailable");
        expect(formatNextLevelStatus("LEVELS/SECOND.MAP")).toBe("Save: next level LEVELS/SECOND.MAP");
        expect(formatNextLevelUnavailableStatus()).toBe("Save: next level unavailable");
        expect(formatCampaignCompleteStatus()).toBe("Save: campaign complete");
    });
    it("formats gameplay control labels for the browser toolbar", () => {
        expect(formatPauseToggleLabel({ paused: false })).toBe("Pause");
        expect(formatPauseToggleLabel({ paused: true })).toBe("Resume");
        expect(formatAdmissionsToggleLabel({ admissionsOpen: false })).toBe("Open Admissions");
        expect(formatAdmissionsToggleLabel({ admissionsOpen: true })).toBe("Close Admissions");
        expect(formatStaffBreakToggleLabel({ onBreakStaff: 0 })).toBe("Set Diagnostician On Break");
        expect(formatStaffBreakToggleLabel({ onBreakStaff: 1 })).toBe("Set Diagnostician Active");
        expect(formatSelectedStaffBreakToggleLabel({ status: "active" })).toBe("Set Selected Staff On Break");
        expect(formatSelectedStaffBreakToggleLabel({ status: "on-break" })).toBe("Set Selected Staff Active");
        expect(formatTreatmentRoomToggleLabel({ openTreatmentRooms: 0 })).toBe("Open Treatment Room");
        expect(formatTreatmentRoomToggleLabel({ openTreatmentRooms: 1 })).toBe("Close Treatment Room");
        expect(formatSelectedRoomToggleLabel({ status: "open" })).toBe("Close Selected Room");
        expect(formatSelectedRoomToggleLabel({ status: "closed" })).toBe("Open Selected Room");
        expect(formatMuteToggleLabel({ muted: false })).toBe("Mute");
        expect(formatMuteToggleLabel({ muted: true })).toBe("Unmute");
    });
    it("formats imported staff market schedule details for the browser HUD", () => {
        expect(formatStaffMarketStatus({
            staffMarketDoctorsAvailable: 7,
            staffMarketNursesAvailable: 8,
            staffMarketHandymenAvailable: 3,
            staffMarketReceptionistsAvailable: 5,
            scenarioStaffMarketConsultantRate: 2,
            scenarioStaffMarketJuniorRate: 10,
            scenarioStaffMarketShrinkRate: 3,
            scenarioStaffMarketSurgeonRate: 0,
            scenarioStaffMarketResearcherRate: 1,
            scenarioStaffMarketReceptionists: 6,
            scenarioStaffMarketMonth: 0,
            scenarioStaffMarketSeed: 4953
        })).toBe("Staff market: doctors 7, nurses 8, handymen 3, receptionists 5, consultants 2, juniors 10, psych 3, surgeons 0, researchers 1, receptionists target 6; scenario staff month 0, seed 4953");
    });
    it("formats imported room wear thresholds for the browser HUD", () => {
        expect(formatMaintenanceStaffStatus({
            activeHandymen: 1,
            totalHandymen: 2,
            maintenanceStaffRepairBonusTicks: 2,
            maintenanceStaffRepairEvents: 3,
            scenarioRoomWearThresholdOverrides: {
                specialist: 12,
                diagnosis: 8
            },
            scenarioRoomWearResearchMaxStrength: 20
        }, {
            roomNames: {
                diagnosis: "GP's Office",
                specialist: "Inflation Room"
            }
        })).toBe("Handymen: 1/2, repairs 3, bonus 2 ticks; scenario wear GP's Office 8, Inflation Room 12, max 20");
    });
    it("formats imported staff training rules for the browser HUD", () => {
        expect(formatStaffTrainingStatus({
            trainingStaff: 1,
            staffTrainingStarted: 3,
            staffTrainingCompleted: 2,
            scenarioTrainingRate: 40,
            scenarioTrainingValueCount: 2,
            scenarioTrainingAbilityThresholdCount: 3,
            scenarioTrainingAbilityThresholds: "75/60/45",
            scenarioPromotionDoctorMonths: 6,
            scenarioPromotionConsultantMonths: 12,
            scenarioDoctorThreshold: 250,
            scenarioConsultantThreshold: 750
        })).toBe("Training: 1 active, 3 started, 2 complete; scenario rate 40, values 2, abilities 3 (75/60/45), promo 6/12, thresholds 250/750");
    });
    it("formats trained staff skill totals for the browser HUD", () => {
        expect(formatStaffSkillStatus({
            totalStaffSkillLevel: 2,
            maxStaffSkillLevel: 3,
            activeStaff: 2,
            onBreakStaff: 1,
            trainedStaff: 2,
            staffTrainingCost: 700,
            staffTrainingTicks: 5
        })).toBe("Staff skill: 2/9, trained 2, next 700/5 ticks");
    });
    it("formats treatment research progress and total investment for the browser HUD", () => {
        expect(formatSeedStatus({ seed: 1234 })).toBe("Seed: 1234");
        expect(formatTickStatus({ tick: 42 })).toBe("Tick: 42");
        expect(formatSpeedStatus({ speedMultiplier: 8 })).toBe("Speed: 8x");
        expect(nextSpeedMultiplier(0.5)).toBe(1);
        expect(nextSpeedMultiplier(1)).toBe(2);
        expect(nextSpeedMultiplier(2)).toBe(4);
        expect(nextSpeedMultiplier(4)).toBe(8);
        expect(nextSpeedMultiplier(8)).toBe(8);
        expect(nextSpeedMultiplier(99)).toBe(1);
        expect(formatPausedStatus({ paused: true })).toBe("Paused: yes");
        expect(formatPausedStatus({ paused: false })).toBe("Paused: no");
        expect(formatAudioStatus({ initialization: "waiting-for-user-gesture" })).toBe("Audio: waiting-for-user-gesture");
        expect(formatAudioVolumeStatus({ volume: 0.6, soundMuted: false, musicMuted: false })).toBe("Audio volume: 60% (sound on, music on)");
        expect(formatAudioVolumeStatus({ volume: 0.25, soundMuted: true, musicMuted: false })).toBe("Audio volume: 25% (sound off, music on)");
        expect(formatAudioVolumeStatus({ volume: 0.25, soundMuted: true, musicMuted: true })).toBe("Audio volume: 25% (sound off, music off)");
        expect(formatAudioMasterMuteLabel(false)).toBe("Mute");
        expect(formatAudioMasterMuteLabel(true)).toBe("Unmute");
        expect(formatAudioChannelMuteLabel("Sound", true)).toBe("Sound On");
        expect(formatAudioChannelMuteLabel("Music", false)).toBe("Music Off");
        expect(formatStateHashStatus({ stateHash: "abc123" })).toBe("State hash: abc123");
        expect(formatResearchStatus({
            treatmentResearchLevel: 0,
            treatmentResearchMaxLevel: 3,
            treatmentResearchActive: false,
            treatmentResearchRemainingTicks: 0,
            treatmentResearchTotalInvestment: 0
        })).toBe("Research: treatment 0/3, invested 0");
        expect(formatResearchStatus({
            treatmentResearchLevel: 0,
            treatmentResearchMaxLevel: 3,
            treatmentResearchActive: true,
            treatmentResearchRemainingTicks: 6,
            treatmentResearchTotalInvestment: 1500
        })).toBe("Research: treatment 0/3 (6 ticks), invested 1500");
        expect(formatResearchEffectStatus({
            treatmentResearchSuccessBonus: 20,
            treatmentResearchProjectCost: 1500,
            treatmentResearchProjectTicks: 6,
            treatmentResearchTicksPerTick: 1,
            treatmentResearchActiveResearchers: 0,
            scenarioResearchStartRating: null,
            scenarioResearchPointsDivisor: 1,
            scenarioResearchStartCost: null,
            scenarioResearchMinDrugCost: null,
            scenarioResearchDrugImproveRate: null,
            scenarioResearchImproveCostPercent: null,
            scenarioResearchImproveIncrementPercent: null,
            scenarioResearchMaxObjectStrength: null,
            scenarioResearchIncrement: null,
            scenarioAutopsyResearchPercent: null,
            scenarioAutopsyReputationHitPercent: null,
            treatmentResearchAutopsyTicks: 0,
            treatmentResearchAutopsyReputationPenalty: 0
        })).toBe("Research effect: +20% success, next 1500/6 ticks, throughput 1x/0 researchers");
    });
    it("formats imported emergency schedule details for the browser HUD", () => {
        expect(formatEmergencyStatus({
            emergencyActive: false,
            emergencyPatientCount: 4,
            emergencyDurationTicks: 24,
            emergencyRequiredTreatedPatients: 3,
            emergencyPercentToWin: 75,
            scenarioEmergencyScheduleSize: 2,
            scenarioEmergencyActiveIndex: 1,
            scenarioEmergencyActiveDiseaseId: "mild-cold",
            scenarioDisasterLaunch: 200
        }, {
            diseaseNames: { "mild-cold": "Uncommon Cold" }
        })).toBe("Emergency: ready (4 patients/24 ticks, need 3 / 75%, Uncommon Cold); scenario scheduled 2, active 1, disaster 200 ticks");
        expect(formatEmergencyStatus({
            emergencyActive: false,
            emergencyPatientCount: 4,
            emergencyDurationTicks: 24,
            emergencyRequiredTreatedPatients: 4,
            emergencyPercentToWin: 100,
            scenarioEmergencyScheduleSize: 19,
            scenarioEmergencyActiveIndex: null,
            scenarioNextEmergencyIndex: 0,
            scenarioNextEmergencyStartMonth: 4,
            scenarioNextEmergencyEndMonth: 5,
            scenarioNextEmergencyMinPatients: 2,
            scenarioNextEmergencyMaxPatients: 4,
            scenarioNextEmergencyPercentToWin: 75,
            scenarioNextEmergencyDiseaseId: "mild-cold",
            scenarioDisasterLaunch: 200
        }, {
            diseaseNames: { "mild-cold": "Uncommon Cold" }
        })).toBe("Emergency: scheduled next 0 months 4-5 (2-4 patients, need 75%, Uncommon Cold); scenario scheduled 19, active none, disaster 200 ticks");
        expect(formatEmergencyRewardStatus({
            emergencyRewardCash: 900,
            emergencyRewardReputation: 45,
            emergencySuccessfulWaves: 1,
            emergencyWavesStarted: 3,
            emergencyFailedWaves: 2,
            emergencySuccessPercent: 33,
            emergencyActive: false,
            emergencyFailedPatients: 0
        })).toBe("Emergency reward: 900 cash, +45 reputation, won 1/3, failed 2, saved 33%");
        expect(formatEmergencyRewardStatus({
            emergencyRewardCash: 400,
            emergencyRewardReputation: 20,
            emergencySuccessfulWaves: 0,
            emergencyWavesStarted: 1,
            emergencyFailedWaves: 0,
            emergencySuccessPercent: 0,
            emergencyActive: true,
            emergencyFailedPatients: 1
        })).toBe("Emergency reward: 400 cash, +20 reputation, won 0/1, failed 0, saved 0%, failed patients 1");
    });
    it("formats imported diagnosis expertise details for the browser HUD", () => {
        expect(formatScenarioExpertiseStatus({
            scenarioKnownExpertiseCount: 1,
            scenarioExpertiseCount: 3,
            scenarioResearchRequiredExpertiseCount: 2,
            scenarioDiagnosableExpertiseCount: 2,
            scenarioDiagnosisCapability: 100,
            scenarioNextResearchRequired: 10000,
            scenarioNextResearchDiseaseId: "mild-cold",
            scenarioNextResearchToken: "UNCOMMON_COLD"
        }, {
            diseaseNames: {
                "mild-cold": "Uncommon Cold"
            }
        })).toBe("Scenario expertise: 1/3 known, 2 research-required, diagnosable 2, capability 100, next research 10000 Uncommon Cold");
        expect(formatScenarioOpponentsStatus({
            scenarioActiveOpponentCount: 2,
            scenarioOpponentCount: 3,
            scenarioOpponentNames: "ORAC, COLOSSUS"
        })).toBe("Scenario opponents: 2/3 active (ORAC, COLOSSUS)");
        expect(formatScenarioOpponentsStatus({
            scenarioActiveOpponentCount: 0,
            scenarioOpponentCount: 0,
            scenarioOpponentNames: ""
        })).toBe("Scenario opponents: 0/0 active");
        expect(formatScenarioNetworkCriteriaStatus({
            scenarioNetworkCriteriaCount: 2,
            scenarioNetworkCriteriaSummary: "reputation 1 by month 2; balance 10000 by month 21"
        })).toBe("Network criteria: 2 (reputation 1 by month 2; balance 10000 by month 21)");
        expect(formatScenarioNetworkCriteriaStatus({
            scenarioNetworkCriteriaCount: 2,
            scenarioNetworkCriteriaSummary: "reputation 1 by month 2; balance 10000 by month 21",
            scenarioNetworkCriteriaMetCount: 1,
            scenarioNetworkCriteriaActiveCount: 1,
            scenarioNetworkCriteriaMissedCount: 0,
            scenarioNetworkCriteriaStatuses: [
                { metric: "reputation", currentValue: 500, value: 1, status: "met", deadlineMonth: 6 },
                { metric: "balance", currentValue: 9000, value: 10000, status: "active", deadlineMonth: 25 }
            ]
        })).toBe("Network criteria: 2 (reputation 1 by month 2; balance 10000 by month 21); met 1, active 1, missed 0; reputation 500/1 met by month 6; balance 9000/10000 active by month 25");
        expect(formatScenarioNetworkCriteriaStatus({
            scenarioNetworkCriteriaCount: 0,
            scenarioNetworkCriteriaSummary: "none"
        })).toBe("Network criteria: none");
        expect(formatScenarioOpponentProgressStatus({
            scenarioOpponentLeaderName: "ORAC",
            scenarioOpponentLeaderCures: 6,
            scenarioOpponentLeaderValue: 1200,
            scenarioOpponentLeaderReputation: 700,
            scenarioOpponentObjectiveLeaderName: "COLOSSUS",
            scenarioOpponentStandings: [
                { name: "ORAC", cures: 6, value: 1200, reputation: 700 },
                { name: "COLOSSUS", cures: 5, value: 1100, reputation: 650 },
                { name: "BOB", cures: 4, value: 1000, reputation: 600 },
                { name: "ALICE", cures: 3, value: 900, reputation: 550 }
            ]
        })).toBe("Rival leader: ORAC, 6 cures, value 1200, reputation 700; objective rival COLOSSUS; standings ORAC 6/1200/700, COLOSSUS 5/1100/650, BOB 4/1000/600");
        expect(formatScenarioOpponentProgressStatus({
            scenarioOpponentLeaderName: "",
            scenarioOpponentStandings: []
        })).toBe("Rival leader: none");
        expect(formatQuakeStatus({
            scenarioQuakeScheduleSize: 2,
            scenarioQuakeActiveIndex: null,
            scenarioQuakeSeverity: 4,
            scenarioQuakesTriggered: 1,
            scenarioNextQuakeIndex: 1,
            scenarioNextQuakeStartMonth: 18,
            scenarioNextQuakeEndMonth: 24,
            scenarioNextQuakeSeverity: 2
        })).toBe("Quake: scheduled 2, active none, severity 4, triggered 1, next 1 months 18-24 severity 2");
        expect(formatQuakeStatus({
            scenarioQuakeScheduleSize: 2,
            scenarioQuakeActiveIndex: 0,
            scenarioQuakeSeverity: 1,
            scenarioQuakesTriggered: 0,
            scenarioNextQuakeIndex: null
        })).toBe("Quake: scheduled 2, active 0, severity 1, triggered 0");
        expect(formatQuakeStatus({
            scenarioQuakeScheduleSize: 0
        })).toBe("Quake: none");
    });
    it("formats imported epidemic settings for the browser HUD", () => {
        expect(formatEpidemicStatus({
            epidemicActive: false,
            epidemicPatientCount: 3,
            epidemicDurationTicks: 18
        })).toBe("Epidemic: ready (3 patients/18 ticks)");
        expect(formatEpidemicStatus({
            epidemicActive: true,
            epidemicOutbreakId: 2,
            epidemicTreatedPatients: 1,
            epidemicTotalPatients: 4,
            epidemicFailedPatients: 1,
            epidemicSpreadPatients: 2,
            epidemicOutbreakSpreadPatients: 4,
            epidemicRemainingSpreadPatients: 2,
            epidemicNextSpreadTick: 9,
            epidemicRemainingTicks: 12
        })).toBe("Epidemic: outbreak 2 1/4 contained, failed 1, spread 2/4 (2 left, next 9) (12 ticks)");
        expect(formatEpidemicTermsStatus({
            epidemicSpreadIntervalTicks: 6,
            epidemicMaxSpreadPatients: 2,
            epidemicVaccinationCost: 50,
            epidemicTotalVaccinationCosts: 0,
            epidemicRewardCash: 700,
            epidemicRewardReputation: 30,
            epidemicPenaltyCash: 500,
            epidemicPenaltyReputation: 35,
            epidemicContainedOutbreaks: 0,
            epidemicOutbreaksStarted: 0,
            epidemicFailedOutbreaks: 2,
            scenarioEpidemicHowContagious: 25,
            scenarioEpidemicContagiousSpreadFactor: 25,
            scenarioEpidemicReduceContagiousMonths: 6,
            scenarioEpidemicReduceContagiousPeepCount: 10,
            scenarioEpidemicReduceContagiousRate: 0,
            scenarioEpidemicFine: 2000,
            scenarioEpidemicCompensationLow: 1000,
            scenarioEpidemicCompensationHigh: 15000
        })).toBe("Epidemic terms: spread 6 ticks/2 max, vacc 50/0, reward 700/+30, penalty 500/-35, contained 0/0, failed 2; scenario contagious 25/25, reduce 6m/10/0, fine 2000, comp 1000-15000");
    });
    it("formats imported mayor visit timing for the browser HUD", () => {
        expect(formatVipInspectionStatus({
            vipInspectionActive: false,
            vipInspectionDurationTicks: 8
        })).toBe("VIP: ready (8 ticks)");
        expect(formatVipInspectionStatus({
            vipInspectionActive: true,
            vipInspectionVisitId: 2,
            vipInspectionRemainingTicks: 5,
            vipInspectionCurrentQueuePressure: 1,
            vipInspectionMaxQueuePressure: 2,
            vipInspectionCurrentOpenRooms: 3
        })).toBe("VIP: visit 2 (5 ticks), queue 1/2, rooms 3");
        expect(formatVipInspectionTermsStatus({
            vipInspectionMaxQueuePressure: 2,
            vipInspectionMinReputation: 450,
            vipInspectionRewardCash: 800,
            vipInspectionRewardReputation: 25,
            vipInspectionPenaltyCash: 300,
            vipInspectionPenaltyReputation: 20,
            vipInspectionPassedVisits: 1,
            vipInspectionVisitsStarted: 3,
            vipInspectionFailedVisits: 2,
            scenarioMayorLaunch: 150
        })).toBe("VIP terms: queue <= 2, reputation >= 450, reward 800/+25, penalty 300/-20, pass 1/3, fail 2; scenario mayor 150 ticks");
    });
    it("formats imported salary pressure rules for the browser HUD", () => {
        expect(formatSalaryPressureStatus({
            underpaidStaff: 1,
            overpaidStaff: 2,
            scenarioSalaryAbilityDivisor: 10,
            scenarioSalaryTooLow: -10,
            scenarioSalaryTooHigh: 20,
            scenarioSalaryAddCount: 3
        })).toBe("Salary pressure: underpaid 1, overpaid 2; scenario divisor 10, low -10, high 20, bands 3");
    });
    it("formats imported patient behavior rules for the browser HUD", () => {
        expect(formatTreatedPatientsStatus({ treatedPatients: 2 })).toBe("Treated: 2");
        expect(formatWaitingPatientsStatus({ patientsWaiting: 3 })).toBe("Waiting: 3");
        expect(formatReceptionPatientsStatus({
            awaitingReceptionPatients: 1,
            walkingToReceptionPatients: 2,
            receptionPatients: 3
        })).toBe("Reception: 1 waiting, 2 walking, 3 at desk");
        expect(formatQueuedPatientsStatus({ queuedPatients: 4 })).toBe("Queue: 4");
        expect(formatWalkingToDiagnosisPatientsStatus({
            walkingToDiagnosisPatients: 1
        })).toBe("Walking to diagnosis: 1");
        expect(formatDiagnosingPatientsStatus({ diagnosingPatients: 2 })).toBe("Diagnosing: 2");
        expect(formatDiagnosedPatientsStatus({ diagnosedPatients: 3 })).toBe("Diagnosed: 3");
        expect(formatAwaitingTreatmentPatientsStatus({
            awaitingTreatmentPatients: 4
        })).toBe("Awaiting treatment: 4");
        expect(formatWalkingToTreatmentPatientsStatus({
            walkingToTreatmentPatients: 5
        })).toBe("Walking to treatment: 5");
        expect(formatTreatingPatientsStatus({ treatingPatients: 6 })).toBe("Treating: 6");
        expect(formatDischargedPatientsStatus({ dischargedPatients: 7 })).toBe("Discharged: 7");
        expect(formatPatientMoodStatus({
            happyPatients: 3,
            unhappyPatients: 2,
            veryUnhappyPatients: 1,
            peepHappinessPercent: 50,
            scenarioPatientHappy: 75,
            scenarioPatientUnhappy: 50,
            scenarioPatientVeryUnhappy: 25,
            scenarioPatientLeaveMax: 150,
            scenarioPatientLitterDrop: 25,
            scenarioPatientLitterRandom: 60,
            scenarioPatientBowelFull: 50,
            scenarioPatientBowelOverflows: 75,
            scenarioPatientVomitLimit: 50,
            scenarioPatientDrinkHappy: 5,
            scenarioPatientToiletHappy: 10
        })).toBe("Mood: happy 3, unhappy 2, very 1, peep happy 50%; scenario mood 75/50/25, leave 150, litter 25/60, bowel 50/75, vomit 50, comfort 5/10");
        expect(formatPatientLitterStatus({
            patientLitter: 4,
            currentPatientLitter: 2,
            patientLitterCleaned: 2,
            cleanlinessLitterPercent: 50
        })).toBe("Patient litter: 4, active 2, cleaned 2, cleanliness 50%");
        expect(formatPatientDrinksStatus({
            patientDrinks: 1,
            scenarioAwardCriteria: { cansofCoke: 3 }
        })).toBe("Drinks served: 1, award 1/3");
        expect(formatPatientDrinksStatus({
            patientDrinks: 2,
            scenarioAwardCriteria: {}
        })).toBe("Drinks served: 2");
        expect(formatPatientVomitsStatus({
            patientVomits: 2,
            scenarioPatientVomitLimit: 50
        })).toBe("Patient vomits: 2, limit 50");
        expect(formatPatientVomitsStatus({
            patientVomits: 0,
            scenarioPatientVomitLimit: null
        })).toBe("Patient vomits: 0, limit default");
        expect(formatPatientsNeedingToiletStatus({
            patientsNeedingToilet: 2,
            scenarioPatientBowelFull: 50
        })).toBe("Need toilet: 2, threshold 50");
        expect(formatPatientBowelOverflowStatus({
            patientBowelOverflows: 1,
            scenarioPatientBowelOverflows: 75
        })).toBe("Bowel overflows: 1, threshold 75");
    });
    it("formats patient triage risk for the browser HUD", () => {
        expect(formatCriticalPatientsStatus({
            criticalPatients: 0,
            lowestPatientHealth: null
        })).toBe("Critical patients: 0, lowest health none");
        expect(formatCriticalPatientsStatus({
            criticalPatients: 2,
            lowestPatientHealth: 9
        })).toBe("Critical patients: 2, lowest health 9");
    });
    it("formats patient outcome penalties for the browser HUD", () => {
        expect(formatPatientDeathsStatus({
            patientDeaths: 1,
            patientWalkouts: 2,
            waitingTimesWalkoutPercent: 25,
            patientAbductions: 3
        })).toBe("Deaths: 1, walkouts 2 (25%), abductions 3; death penalties s1 120/-12, s2 180/-20, s3 260/-30; send-home s1 40/-2, s2 70/-4, s3 110/-8");
        expect(formatTreatmentFailuresStatus({
            treatmentFailures: 2
        })).toBe("Treatment failures: 2; penalties s1 80/-4, s2 130/-8, s3 200/-14");
        expect(formatCareActionButtonLabel("shoot-rat")).toBe("Shoot Rat");
        expect(formatCareActionButtonLabel("water-plant")).toBe("Water Plant");
        expect(canShootRatFromTelemetry({ levelObjectiveStatus: "running" })).toBe(true);
        expect(canShootRatFromTelemetry({ levelObjectiveStatus: "lost" })).toBe(false);
        expect(canShootRatFromTelemetry({ levelObjectiveStatus: "won" })).toBe(false);
        expect(canWaterPlantFromTelemetry({ levelObjectiveStatus: "running" })).toBe(true);
        expect(canWaterPlantFromTelemetry({ levelObjectiveStatus: "lost" })).toBe(false);
        expect(canWaterPlantFromTelemetry({ levelObjectiveStatus: "won" })).toBe(false);
        expect(formatRatControlStatus({
            ratKills: 3,
            ratSightings: 4,
            ratKillPercentage: 75
        })).toBe("Rats: 3/4, accuracy 75%");
        expect(formatPlantCareStatus({
            plantsWatered: 4,
            plantWaterChecks: 5,
            plantWateredPercentage: 80
        })).toBe("Plants: 4/5, watered 80%");
    });
    it("formats queue pressure thresholds and penalties for the browser HUD", () => {
        expect(formatQueuePressureValueStatus({
            queuePressure: 4
        })).toBe("Queue pressure: 4");
        expect(formatQueuePressureStatus({
            queuePressureStatus: "high"
        })).toBe("Queue pressure status: high, high >= 3, reputation -2/tick");
        expect(formatQueuePressureEventsStatus({
            queuePressureEvents: 4
        })).toBe("Queue pressure events: 4");
        expect(formatRoomMaintenanceStatus({
            roomsInMaintenance: 2,
            wornRoomPercent: 40
        })).toBe("Rooms in maintenance: 2, worn 40%");
        expect(formatRoomMaintenanceStartEventsStatus({
            roomMaintenanceStartEvents: 3
        })).toBe("Room maintenance starts: 3");
        expect(formatRoomMaintenanceCompleteEventsStatus({
            roomMaintenanceCompleteEvents: 2
        })).toBe("Room maintenance completes: 2");
        expect(formatOpenDiagnosisRoomsStatus({
            openDiagnosisRooms: 1
        })).toBe("Open diagnosis rooms: 1");
        expect(formatOpenTreatmentRoomsStatus({
            openTreatmentRooms: 2
        })).toBe("Open treatment rooms: 2");
        expect(formatSpecializedTreatmentRoomsStatus({
            openPharmacyRooms: 1,
            openOperatingTheatreRooms: 4,
            openSpecialistRooms: 2,
            openPsychiatryRooms: 1,
            openInflationRooms: 1,
            openSlackTongueClinicRooms: 1,
            openFractureClinicRooms: 1,
            openHairRestorationRooms: 1,
            openJellyVatRooms: 1,
            openDecontaminationRooms: 1,
            openElectrolysisRooms: 1,
            openDnaFixerRooms: 3
        })).toBe("Specialized rooms: pharmacy 1, Operating Theatre 4, specialist 2, Psychiatry 1, Training Room 0, Inflation Room 1, Slack Tongue Clinic 1, Fracture Clinic 1, Hair Restoration 1, Jelly Vat 1, Decontamination 1, Electrolysis 1, DNA Fixer 3");
        expect(formatSpecializedTreatmentQueueStatus({
            awaitingSpecializedTreatmentPatients: 3
        })).toBe("Specialty queue: 3");
    });
    it("formats imported staff fatigue rules for the browser HUD", () => {
        expect(formatActiveStaffStatus({
            activeStaff: 2
        })).toBe("Active staff: 2");
        expect(formatOnBreakStaffStatus({
            onBreakStaff: 1
        })).toBe("On-break staff: 1");
        expect(formatStressedStaffStatus({
            stressedStaff: 1,
            staffHappinessPercent: 75,
            scenarioStaffWorkLight: 1,
            scenarioStaffModifyFrequency: 16,
            scenarioStaffResignMax: 150
        })).toBe("Stressed staff: 1, staff happy 75%; scenario work 1, modify 16, resign 150");
        expect(formatStaffBurnoutEventsStatus({
            staffBurnoutEvents: 2
        })).toBe("Staff burnout events: 2");
        expect(formatStaffRecoveryEventsStatus({
            staffRecoveryEvents: 3
        })).toBe("Staff recovery events: 3");
        expect(formatAutoBreakStaffStatus({
            autoBreakStaff: 1
        })).toBe("Auto-break staff: 1");
        expect(formatTiredStaffStatus({
            tiredStaff: 2,
            scenarioStaffNotTired: 300,
            scenarioStaffTired: 600,
            scenarioStaffVeryTired: 700,
            scenarioStaffFatigueCrackUpTired: 800
        })).toBe("Tired staff: 2; scenario thresholds 300/600/700/800");
        expect(formatVeryTiredStaffStatus({
            veryTiredStaff: 3,
            scenarioStaffRestStanding: 3,
            scenarioStaffRestSofa: 8,
            scenarioStaffRestGame: 60,
            scenarioStaffRestSnooker: 30,
            scenarioStaffRecoveryFactor: 450,
            scenarioStaffFatigueRecoveryMinimum: 3
        })).toBe("Very tired staff: 3; scenario rest 3/8/60/30, recovery 450/3");
    });
    it("formats imported allocation rules for the browser HUD", () => {
        expect(formatAdmissionsStatus({
            admissionsOpen: false
        })).toBe("Admissions: closed");
        expect(formatAdmissionsStatus({
            admissionsOpen: true
        })).toBe("Admissions: open");
        expect(formatAdmissionPolicyStatus({
            admissionPolicy: "conservative"
        })).toBe("Admission policy: conservative");
        expect(formatNextAdmissionStatus({
            nextAdmissionInTicks: 8,
            scenarioIllnessRate: 2,
            scenarioPopulationChange: 3,
            scenarioAllocationRandomWeight: 4,
            scenarioAllocationTotalReputationWeight: 1,
            scenarioAllocationIllnessReputationWeight: 2,
            scenarioAllocationDelayMonths: 3,
            scenarioAllocationDelayTicks: 72,
            scenarioDiseasePoolSize: 5,
            scenarioAvailableDiseaseCount: 3,
            scenarioNextDiseaseId: "hairyitis",
            autoAdmissionIntervalTicks: 12,
            autoAdmissionWaitingCap: 10
        })).toBe("Next arrival: 8 ticks; scenario illness 2, pop 3, pool 3/5, next hairyitis, allocation 4/1/2, delay 3m/72 ticks, auto 12 ticks/cap 10");
        expect(formatNextAdmissionStatus({
            nextAdmissionInTicks: 8,
            scenarioIllnessRate: 2,
            scenarioPopulationChange: 3,
            scenarioAllocationRandomWeight: 4,
            scenarioAllocationTotalReputationWeight: 1,
            scenarioAllocationIllnessReputationWeight: 2,
            scenarioAllocationDelayMonths: 3,
            scenarioAllocationDelayTicks: 72,
            scenarioDiseasePoolSize: 5,
            scenarioAvailableDiseaseCount: 3,
            scenarioNextDiseaseId: "hairyitis",
            autoAdmissionIntervalTicks: 12,
            autoAdmissionWaitingCap: 10
        }, {
            diseaseNames: {
                hairyitis: "Hairyitis"
            }
        })).toBe("Next arrival: 8 ticks; scenario illness 2, pop 3, pool 3/5, next Hairyitis, allocation 4/1/2, delay 3m/72 ticks, auto 12 ticks/cap 10");
    });
    it("formats imported admission hold and routing rules for the browser HUD", () => {
        expect(formatAdmissionRulesStatus({
            scenarioHoldVisualMonths: 2,
            scenarioHoldVisualPeepCount: 5
        })).toBe("Scenario holds: visual 2 months/5 patients");
        expect(formatRoutingRulesStatus({
            scenarioRoutingQueuePoints: 15,
            scenarioRoutingDistancePoints: 1,
            scenarioRoutingNoStaffPoints: 20,
            scenarioRoutingNoStaffAdmissionPenaltyTicks: 4
        })).toBe("Scenario routing: queue 15, distance 1, no-staff 20 (+4 ticks)");
        expect(formatRoutingRulesStatus({
            scenarioRoutingQueuePoints: null,
            scenarioRoutingDistancePoints: null,
            scenarioRoutingNoStaffPoints: null,
            scenarioRoutingNoStaffAdmissionPenaltyTicks: 0
        })).toBe("Scenario routing: queue 0, distance 0, no-staff 0 (+0 ticks)");
    });
    it("formats front-desk intake capacity for the browser HUD", () => {
        expect(formatFrontDeskStatus({
            activeReceptionists: 2,
            frontDeskCapacity: 8,
            autoAdmissionWaitingCap: 6
        })).toBe("Front desk: 2 active receptionists, capacity 8, intake cap 6");
    });
    it("formats imported event rules for the browser HUD", () => {
        expect(formatEventRulesStatus({
            totalEvents: 4,
            scenarioScoreMaxIncrease: 300,
            scenarioVaccinationCost: 50,
            scenarioRemoveRatHoleChance: 3000,
            scenarioMinimumAbductionYears: 4,
            scenarioAbductionsPerYear: 2,
            scenarioAbductionsTriggered: 1,
            scenarioMayorLaunch: 150,
            scenarioDisasterLaunch: 200
        })).toBe("Events: 4; scenario score 300, vacc 50, rats 3000, abduct 4y/2 (1 triggered), mayor 150, disaster 200");
        expect(formatLastEventStatus({
            lastEventType: "cashflow-negative"
        })).toBe("Last event: cashflow-negative");
        expect(formatLastEventStatus({
            lastEventType: null
        })).toBe("Last event: none");
        expect(formatRecentEventsStatus({
            recentEventFeed: "1:cashflow-negative,2:milestone-unlocked"
        })).toBe("Recent events: 1:cashflow-negative,2:milestone-unlocked");
        expect(formatRecentEventsStatus({
            recentEventFeed: ""
        })).toBe("Recent events: none");
    });
    it("formats imported loan interest for the browser HUD", () => {
        expect(formatLoanInterestStatus({
            loanInterestExpense: 2,
            cumulativeLoanInterest: 12,
            scenarioLoanInterestPerChunk: 3
        })).toBe("Loan interest: 2 tick, 12 total; scenario 3/chunk");
    });
    it("formats loan chunk availability and repayment capacity for the browser HUD", () => {
        expect(formatLoanStatus({
            cash: 4200,
            outstandingLoan: 5000,
            loanChunkAmount: 5000,
            loanMaxOutstanding: 20000
        })).toBe("Loan: 5000/20000, chunk 5000, available 5000, repay 4200");
        expect(formatLoanStatus({
            cash: 99999,
            outstandingLoan: 20000,
            loanChunkAmount: 5000,
            loanMaxOutstanding: 20000
        })).toBe("Loan: 20000/20000, chunk 5000, available 0, repay 5000");
    });
    it("formats gross and net cumulative cashflow for the browser HUD", () => {
        expect(formatTickCashflowStatus({
            tickIncome: 0,
            tickExpenses: 16,
            tickNetCashflow: -16
        })).toBe("Tick cashflow: 0 - 16 = -16 (negative)");
        expect(formatTickCashflowStatus({
            tickIncome: 40,
            tickExpenses: 16,
            tickNetCashflow: 24
        })).toBe("Tick cashflow: 40 - 16 = 24 (positive)");
        expect(formatTickCashflowStatus({
            tickIncome: 16,
            tickExpenses: 16,
            tickNetCashflow: 0
        })).toBe("Tick cashflow: 16 - 16 = 0 (balanced)");
        expect(formatCumulativeCashflowStatus({
            cumulativeIncome: 1200,
            cumulativeExpenses: 450,
            cumulativeNetCashflow: 750
        })).toBe("Cumulative cashflow: 1200 - 450 = 750");
    });
    it("formats campaign milestone and unlock progression for the browser HUD", () => {
        expect(formatMilestoneStatus({
            milestoneLevel: 2,
            nextMilestone: "milestone.community-trust",
            remainingDischargesToNextMilestone: 2
        })).toBe("Milestones: 2, next milestone.community-trust in 2 discharges");
        expect(formatMilestoneStatus({
            milestoneLevel: 3,
            nextMilestone: "",
            remainingDischargesToNextMilestone: 0
        })).toBe("Milestones: 3, complete");
        expect(formatUnlockStatus({
            unlockedSystems: 2,
            unlockedSystemIds: "unlock.finance-ledger,unlock.insurance-contracts",
            recurringIncomeBonus: 6,
            nextMilestone: "milestone.community-trust",
            remainingDischargesToNextMilestone: 2
        })).toBe("Unlocks: 2 (unlock.finance-ledger,unlock.insurance-contracts), income +6, next unlock in 2 discharges");
        expect(formatUnlockStatus({
            unlockedSystems: 3,
            unlockedSystemIds: "unlock.finance-ledger,unlock.insurance-contracts,unlock.vip-clinic",
            recurringIncomeBonus: 10,
            nextMilestone: "",
            remainingDischargesToNextMilestone: 0
        })).toBe("Unlocks: 3 (unlock.finance-ledger,unlock.insurance-contracts,unlock.vip-clinic), income +10, all milestones complete");
    });
    it("formats finance ledger readiness and recovered audit totals for the browser HUD", () => {
        expect(formatFinanceLedgerStatus({
            financeLedgerUnlocked: false
        })).toBe("Finance ledger: locked");
        expect(formatFinanceLedgerStatus({
            financeLedgerUnlocked: true,
            financeAuditReady: true,
            financeAuditCooldownRemainingTicks: 0,
            financeAuditsRun: 1,
            financeAuditTotalRecoveredCash: 350
        })).toBe("Finance ledger: audit ready, audits 1, recovered 350");
        expect(formatFinanceLedgerStatus({
            financeLedgerUnlocked: true,
            financeAuditReady: false,
            financeAuditCooldownRemainingTicks: 7,
            financeAuditsRun: 2,
            financeAuditTotalRecoveredCash: 700
        })).toBe("Finance ledger: audit cooldown 7 ticks, audits 2, recovered 700");
        expect(formatFinanceAuditStatus({
            financeAuditCashRecovery: 350,
            financeAuditCooldownTicks: 10,
            financeAuditTotalRecoveredCash: 700,
            financeAuditsRun: 2
        })).toBe("Finance audit: recover 350 cash, cooldown 10 ticks, recovered 700/2");
    });
    it("formats treatment pricing tradeoffs for the browser HUD", () => {
        expect(formatReputationStatus({ reputation: 450 })).toBe("Reputation: 450");
        expect(formatPricingPolicyStatus({ treatmentPricingPolicy: "standard" })).toBe("Pricing: standard, cash 100%, reputation +0/cure");
        expect(formatPricingPolicyStatus({ treatmentPricingPolicy: "discount" })).toBe("Pricing: discount, cash 75%, reputation +2/cure");
        expect(formatPricingPolicyStatus({ treatmentPricingPolicy: "premium" })).toBe("Pricing: premium, cash 135%, reputation -3/cure");
    });
    it("formats cumulative insurance contract outcomes for the browser HUD", () => {
        expect(formatInsuranceContractStatus({
            insuranceContractUnlocked: false
        })).toBe("Insurance: locked");
        expect(formatInsuranceContractStatus({
            insuranceContractUnlocked: true,
            insuranceContractActive: false,
            insuranceContractPatientCount: 2,
            insuranceContractDurationTicks: 16
        })).toBe("Insurance: ready (2 patients/16 ticks)");
        expect(formatInsuranceContractStatus({
            insuranceContractUnlocked: true,
            insuranceContractActive: true,
            insuranceContractId: 4,
            insuranceContractCompletedPatients: 1,
            insuranceContractTotalPatients: 3,
            insuranceContractFailedPatients: 1,
            insuranceContractRemainingPatients: 1,
            insuranceContractRemainingTicks: 9
        })).toBe("Insurance: contract 4 1/3 claims, failed 1, remaining 1 (9 ticks)");
        expect(formatInsuranceTermsStatus({
            insuranceContractSeverity: 2,
            insuranceContractRewardCash: 650,
            insuranceContractRewardReputation: 15,
            insuranceContractPenaltyCash: 250,
            insuranceContractPenaltyReputation: 12,
            insuranceContractsCompleted: 1,
            insuranceContractsStarted: 3,
            insuranceContractsFailed: 2
        })).toBe("Insurance terms: severity 2, reward 650/+15, penalty 250/-12, completed 1/3, failed 2");
    });
    it("formats marketing campaign affordability and reputation cap for the browser HUD", () => {
        expect(formatMarketingCampaignStatus({
            cash: 40000,
            reputation: 450,
            marketingCampaignCost: 600,
            marketingCampaignReputationGain: 35
        })).toBe("Marketing: 600 => +35 reputation (450->485), ready");
        expect(formatMarketingCampaignStatus({
            cash: 200,
            reputation: 450,
            marketingCampaignCost: 600,
            marketingCampaignReputationGain: 35
        })).toBe("Marketing: 600 => +35 reputation (450->485), blocked need 400 cash");
        expect(formatMarketingCampaignStatus({
            cash: 40000,
            reputation: 1000,
            marketingCampaignCost: 600,
            marketingCampaignReputationGain: 35
        })).toBe("Marketing: 600 => +35 reputation (1000->1000), blocked max reputation");
    });
    it("formats cumulative hospital award payouts for the browser HUD", () => {
        expect(formatHospitalRatingStatus({
            hospitalRatingScore: 87,
            hospitalRatingTier: "gold",
            hospitalAwardRewardCash: 1000,
            hospitalAwardRewardReputation: 30
        })).toBe("Rating: 87/100 (gold), award 1000/+30");
        expect(formatHospitalAwardStatus({
            hospitalAwardLastTier: null,
            hospitalAwardRewardCash: 1000,
            hospitalAwardRewardReputation: 30,
            hospitalAwardTotalCashReward: 0,
            hospitalAwardTotalReputationReward: 0,
            scenarioAwardCriteriaSummary: "none"
        })).toBe("Awards: ready, reward 1000/+30, totals 0/+0");
        expect(formatHospitalAwardStatus({
            hospitalAwardLastTier: "gold",
            hospitalAwardLastScore: 87,
            hospitalAwardCeremoniesRun: 2,
            hospitalAwardTotalCashReward: 2000,
            hospitalAwardTotalReputationReward: 60,
            scenarioAwardCriteriaSummary: "none"
        })).toBe("Awards: gold 87/100, ceremonies 2, totals 2000/+60");
        expect(formatHospitalAwardStatus({
            hospitalAwardLastTier: "none",
            hospitalAwardLastScore: 33,
            hospitalAwardCeremoniesRun: 1,
            hospitalAwardTotalCashReward: 0,
            hospitalAwardTotalReputationReward: -4,
            scenarioAwardCriteriaSummary: "none"
        })).toBe("Awards: none 33/100, ceremonies 1, totals 0/-4");
    });
    it("formats imported land cost for the browser HUD", () => {
        expect(formatCashStatus({
            cash: 40000,
            scenarioInitialCash: 40000,
            scenarioLandCostPerTile: 25
        })).toBe("Cash: 40000; scenario start 40000, land 25/tile");
    });
    it("uses imported original object names in object availability text", () => {
        expect(formatObjectAvailabilityStatus({
            scenarioObjectAvailableCount: 1,
            scenarioObjectAvailabilityCount: 3,
            scenarioObjectLockedCount: 1,
            scenarioObjectDisabledCount: 1,
            scenarioObjectResearchLockedCount: 1
        }, {
            objectAvailability: [
                { index: 1, name: "Desk", startAvailable: true, availableForLevel: true },
                { index: 9, name: "Inflator Machine", roomType: "inflation-room", startAvailable: true, availableForLevel: true },
                { index: 13, name: "Cardiogram", roomType: "diagnosis", startAvailable: false, availableForLevel: true },
                { index: 24, name: "Cast Remover", roomType: "fracture-clinic", startAvailable: true, availableForLevel: false }
            ],
            expertise: [{ category: "DIAGNOSIS", known: false, researchRequired: 10000 }]
        }, {
            objectNames: {
                13: "Cardio Machine"
            }
        })).toBe("Object availability: 1/3 available, locked 1, disabled 1, research 1; available: Inflator Machine, Desk; research: Cardiogram; disabled: Cast Remover");
    });
    it("uses orchestrator object availability buckets for exact HUD details", () => {
        expect(formatObjectAvailabilityStatus({
            scenarioObjectAvailableCount: 1,
            scenarioObjectAvailabilityCount: 3,
            scenarioObjectLockedCount: 1,
            scenarioObjectDisabledCount: 0,
            scenarioObjectResearchLockedCount: 1,
            scenarioObjectAvailableIndices: [9],
            scenarioObjectLockedIndices: [24],
            scenarioObjectDisabledIndices: [],
            scenarioObjectResearchLockedIndices: [13]
        }, {
            objectAvailability: [
                { index: 9, name: "Inflator Machine", roomType: "inflation-room", startAvailable: true, availableForLevel: true },
                { index: 13, name: "Cardiogram", roomType: "diagnosis", startAvailable: false, availableForLevel: true },
                { index: 24, name: "Cast Remover", roomType: "fracture-clinic", startAvailable: false, availableForLevel: true }
            ],
            expertise: [{ category: "DIAGNOSIS", known: false, researchRequired: 10000 }]
        })).toBe("Object availability: 1/3 available, locked 1, disabled 0, research 1; available: Inflator Machine; locked: Cast Remover; research: Cardiogram");
    });
    it("uses scenario-backed original campaign maps before standalone imported maps", () => {
        const mapSummaries = [
            { path: "LEVELS/LEVEL.L1", scenario: { path: "LEVELS/FULL01.SAM" } },
            { path: "LEVELS/LEVEL.L2", scenario: { path: "LEVELS/FULL02.SAM" } },
            { path: "LEVELS/MULTI01.MAP" }
        ];
        expect(createCampaignMapSummaries(mapSummaries)).toEqual([
            { path: "LEVELS/LEVEL.L1", scenario: { path: "LEVELS/FULL01.SAM" } },
            { path: "LEVELS/LEVEL.L2", scenario: { path: "LEVELS/FULL02.SAM" } }
        ]);
    });
    it("keeps standalone map imports playable when no scenario maps are present", () => {
        const mapSummaries = [
            { path: "LEVELS/FIRST.MAP" },
            { path: "LEVELS/SECOND.MAP" }
        ];
        expect(createCampaignMapSummaries(mapSummaries)).toEqual(mapSummaries);
    });
    it("derives deterministic objective scaling from imported map order", () => {
        const mapSummaries = [
            { path: "LEVELS/FIRST.MAP" },
            { path: "LEVELS/SECOND.MAP" },
            { path: "LEVELS/THIRD.MAP" }
        ];
        expect(createCampaignLevelObjectiveFromHospitalView({
            mapPath: "LEVELS/FIRST.MAP",
            mapSummaries
        })).toEqual({
            requiredDischarges: 3,
            minimumCash: 0,
            minimumReputation: 1
        });
        expect(createCampaignLevelObjectiveFromHospitalView({
            mapPath: "LEVELS/SECOND.MAP",
            mapSummaries
        })).toEqual({
            requiredDischarges: 4,
            minimumCash: 250,
            minimumReputation: 6
        });
    });
    it("adds deterministic objective pressure from imported map complexity", () => {
        const mapSummaries = [
            {
                path: "LEVELS/FIRST.MAP",
                parcelCount: 1,
                objectCount: 2,
                buildableTileCount: 2_000
            },
            {
                path: "LEVELS/SECOND.MAP",
                parcelCount: 4,
                objectCount: 57,
                buildableTileCount: 5_600
            }
        ];
        expect(createCampaignLevelObjectiveFromHospitalView({
            mapPath: "LEVELS/SECOND.MAP",
            mapSummaries
        })).toEqual({
            requiredDischarges: 10,
            minimumCash: 1_850,
            minimumReputation: 22
        });
    });
    it("uses imported original scenario criteria when present", () => {
        const mapSummaries = [
            {
                path: "LEVELS/LEVEL.L1",
                scenario: {
                    path: "LEVELS/FULL01.SAM",
                    winCriteria: [
                        { metric: "reputation", comparison: "at-least", value: 300 },
                        { metric: "balance", comparison: "at-least", value: 1000 },
                        { metric: "percentage-treated", comparison: "at-least", value: 40 },
                        { metric: "cures", comparison: "at-least", value: 10 },
                        { metric: "hospital-value", comparison: "at-least", value: 55_000 }
                    ],
                    loseCriteria: []
                }
            }
        ];
        expect(createCampaignLevelObjectiveFromHospitalView({
            mapPath: "LEVELS/LEVEL.L1",
            mapSummaries
        })).toEqual({
            requiredDischarges: 10,
            minimumCash: 1000,
            minimumReputation: 300,
            minimumTreatmentPercentage: 40,
            minimumHospitalValue: 55_000,
            bankruptcyCashThreshold: 0,
            reputationFailureThreshold: 0,
            maximumDeaths: Number.POSITIVE_INFINITY
        });
    });
    it("does not invent a cure objective when imported scenario criteria omit cures", () => {
        const mapSummaries = [
            {
                path: "LEVELS/LEVEL.L1",
                scenario: {
                    path: "LEVELS/FULL04.SAM",
                    winCriteria: [
                        { metric: "reputation", comparison: "at-least", value: 500 },
                        { metric: "balance", comparison: "at-least", value: 50_000 },
                        { metric: "hospital-value", comparison: "at-least", value: 100_000 }
                    ],
                    loseCriteria: []
                }
            }
        ];
        expect(createCampaignLevelObjectiveFromHospitalView({
            mapPath: "LEVELS/LEVEL.L1",
            mapSummaries
        })).toEqual({
            requiredDischarges: 0,
            minimumCash: 50_000,
            minimumReputation: 500,
            minimumTreatmentPercentage: 0,
            minimumHospitalValue: 100_000,
            bankruptcyCashThreshold: 0,
            reputationFailureThreshold: 0,
            maximumDeaths: Number.POSITIVE_INFINITY
        });
    });
    it("uses imported original lose criteria for browser failure thresholds", () => {
        const mapSummaries = [
            {
                path: "LEVELS/LEVEL.L1",
                scenario: {
                    path: "LEVELS/FULL01.SAM",
                    winCriteria: [{ metric: "cures", comparison: "at-least", value: 10 }],
                    loseCriteria: [
                        { metric: "balance", comparison: "at-most", value: -20_000 },
                        { metric: "reputation", comparison: "at-most", value: 200 },
                        { metric: "deaths", comparison: "at-least", value: 50 }
                    ]
                }
            }
        ];
        expect(createCampaignLevelObjectiveFromHospitalView({
            mapPath: "LEVELS/LEVEL.L1",
            mapSummaries
        })).toMatchObject({
            requiredDischarges: 10,
            bankruptcyCashThreshold: -20_000,
            reputationFailureThreshold: 200,
            maximumDeaths: 50
        });
    });
    it("formats remaining level failure allowance for the browser HUD", () => {
        expect(formatLevelObjectiveStatus({
            levelObjectiveStatus: "running"
        })).toBe("Level status: running");
        expect(formatLevelObjectiveStatus({
            levelObjectiveStatus: "won"
        })).toBe("Level status: won");
        expect(formatLevelObjectiveStatus({
            levelObjectiveStatus: "lost",
            levelObjectiveReason: "deaths"
        })).toBe("Level status: lost (deaths)");
        expect(formatLevelObjectiveProgress({
            levelObjectiveRequiredDischarges: 10,
            levelObjectiveRemainingDischarges: 7,
            cash: 1200,
            reputation: 450,
            levelObjectiveMinimumCash: 1000,
            levelObjectiveMinimumReputation: 300,
            levelObjectiveMinimumTreatmentPercentage: 40,
            levelObjectiveCurrentTreatmentPercentage: 75,
            levelObjectiveMinimumHospitalValue: 55_000,
            levelObjectiveCurrentHospitalValue: 62_000
        })).toBe("Objective: discharge 3/10, cash 1200/1000, reputation 450/300, treated 75/40%, value 62000/55000");
        expect(formatLevelObjectiveProgress({
            levelObjectiveRequiredDischarges: 10,
            levelObjectiveRemainingDischarges: 12
        })).toBe("Objective: discharge 0/10");
        expect(formatLevelObjectiveSafety({
            levelObjectiveBankruptcyCashThreshold: -20_000,
            levelObjectiveMinimumCash: 1000,
            levelObjectiveMinimumReputation: 300,
            levelObjectiveReputationFailureThreshold: 200,
            levelObjectiveMinimumTreatmentPercentage: 40,
            levelObjectiveCurrentTreatmentPercentage: 75,
            levelObjectiveMinimumHospitalValue: 55_000,
            levelObjectiveCurrentHospitalValue: 62_000,
            levelObjectiveMaximumDeaths: 50,
            levelObjectiveRemainingDeaths: 42
        })).toBe("Safety: cash > -20000, reputation >= 300, target cash 1000, reputation > 200, treated 75/40%, value 62000/55000, deaths <= 50 (42 left)");
    });
});
describe("app shell scenario research telemetry", () => {
    it("formats imported research cost and increment percentages for the browser HUD", () => {
        expect(formatScenarioResearchDetails({
            scenarioResearchStartRating: null,
            scenarioResearchPointsDivisor: 1,
            scenarioResearchStartCost: null,
            scenarioResearchMinDrugCost: null,
            scenarioResearchDrugImproveRate: null,
            scenarioResearchImproveCostPercent: null,
            scenarioResearchImproveIncrementPercent: null,
            scenarioResearchMaxObjectStrength: null,
            scenarioResearchIncrement: null,
            scenarioAutopsyResearchPercent: null,
            scenarioAutopsyReputationHitPercent: null,
            treatmentResearchAutopsyTicks: 0,
            treatmentResearchAutopsyReputationPenalty: 0
        })).toBe("");
        expect(formatScenarioResearchDetails({
            scenarioResearchStartRating: 95,
            scenarioResearchPointsDivisor: 4,
            scenarioResearchStartCost: 100,
            scenarioResearchMinDrugCost: 50,
            scenarioResearchDrugImproveRate: null,
            scenarioResearchImproveCostPercent: 10,
            scenarioResearchImproveIncrementPercent: 7,
            scenarioResearchMaxObjectStrength: 20,
            scenarioResearchIncrement: 2,
            scenarioAutopsyResearchPercent: null,
            scenarioAutopsyReputationHitPercent: null,
            treatmentResearchAutopsyTicks: 0,
            treatmentResearchAutopsyReputationPenalty: 0
        })).toContain("improve cost 10, improve increment 7");
    });
    it("formats imported autopsy research and reputation tradeoffs for the browser HUD", () => {
        expect(formatScenarioResearchDetails({
            scenarioResearchStartRating: null,
            scenarioResearchPointsDivisor: 1,
            scenarioResearchStartCost: null,
            scenarioResearchMinDrugCost: null,
            scenarioResearchDrugImproveRate: null,
            scenarioResearchImproveCostPercent: null,
            scenarioResearchImproveIncrementPercent: null,
            scenarioResearchMaxObjectStrength: null,
            scenarioResearchIncrement: null,
            scenarioAutopsyResearchPercent: 33,
            scenarioAutopsyReputationHitPercent: 20,
            treatmentResearchAutopsyTicks: 12,
            treatmentResearchAutopsyReputationPenalty: 80
        })).toContain("autopsy 33%/-20%, autopsy totals 12/80");
    });
});
describe("app shell scenario room availability", () => {
    it("derives room availability from original object rows that are available for the level", () => {
        const scenario = {
            objectAvailability: [
                { index: 9, roomType: "inflation-room", startAvailable: true, whenAvailable: 0, startStrength: 8, availableForLevel: false },
                { index: 13, roomType: "diagnosis", startAvailable: true, whenAvailable: 0, startStrength: 13, availableForLevel: true },
                { index: 14, roomType: "diagnosis", startAvailable: false, whenAvailable: 1, startStrength: 12, availableForLevel: true },
                { index: 24, roomType: "fracture-clinic", startAvailable: false, whenAvailable: 2, startStrength: 11, availableForLevel: true }
            ],
            expertise: [
                { index: 38, known: false, researchRequired: 40000, token: "I_D_CARDIO", category: "DIAGNOSIS" }
            ]
        };
        expect(createRoomAvailabilityFromScenario(scenario)).toEqual(["diagnosis"]);
        expect(createRoomAvailabilityScheduleFromScenario(scenario)).toEqual([
            { index: 9, roomType: "inflation-room", startAvailable: true, whenAvailable: 0, availableForLevel: false },
            { index: 13, roomType: "diagnosis", startAvailable: true, whenAvailable: 0, availableForLevel: true },
            { index: 14, roomType: "diagnosis", startAvailable: false, whenAvailable: 1, availableForLevel: true, researchRequired: 40000, expertiseCategory: "DIAGNOSIS" },
            { index: 24, roomType: "fracture-clinic", startAvailable: false, whenAvailable: 2, availableForLevel: true }
        ]);
        expect(createRoomWearThresholdOverridesFromScenario(scenario)).toEqual({
            diagnosis: 12,
            "fracture-clinic": 11
        });
        expect(createRoomWearThresholdOverridesFromScenario({
            ...scenario,
            researchSettings: { maxObjectStrength: 10 }
        })).toEqual({
            diagnosis: 10,
            "fracture-clinic": 10
        });
    });
    it("includes imported corridor object strength in furnish actions", () => {
        expect(formatFurnishCorridorPanelEmptyStatus()).toBe("No corridor objects imported for this level.");
        expect(formatFurnishCorridorRowsHtml({ objectAvailability: [] })).toContain(formatFurnishCorridorPanelEmptyStatus());
        const html = formatFurnishCorridorRowsHtml({
            objectAvailability: [
                { index: 5, name: "Plant", startCost: 100, startStrength: 7, startAvailable: true, availableForLevel: true }
            ]
        });
        expect(html).toContain("data-object-index=\"5\"");
        expect(html).toContain("data-object-cost=\"100\"");
        expect(html).toContain("data-object-strength=\"7\"");
    });
});
