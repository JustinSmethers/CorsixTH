// Native THOB IDs and idle animations from the checked-in Lua definitions.
// Attachment geometry follows Object.processTypeDefinition in entities/object.lua.
// Keys are canonical Lua IDs; radiation_shield_b shares its master THOB.
export const THEME_HOSPITAL_OBJECT_DEFINITIONS = {
    // CorsixTH/Lua/objects/analyser.lua
    "analyser": {"objectIndex": 41, "animations": {"north": 2134, "south": 2134}, "orientations": {"north": {"anchor": [0, 1], "attach": [0, 1]}, "east": {"anchor": [0, 1], "attach": [0, 1]}}},
    // CorsixTH/Lua/objects/autopsy.lua
    "autopsy": {"objectIndex": 55, "animations": {"north": 2146, "south": 2146}, "orientations": {"north": {"anchor": [0, 0], "attach": [0, 0], "early": true}, "east": {"anchor": [0, 0], "attach": [-1, 0]}}},
    // CorsixTH/Lua/objects/bed.lua
    "bed": {"objectIndex": 8, "animations": {"north": 2644, "east": 2646}, "orientations": {"north": {"anchor": [0, 1], "attach": [0, 1], "early": true}, "east": {"anchor": [0, 0], "attach": [0, 0], "early": true}, "south": {"anchor": [0, 0], "attach": [-2, 0]}, "west": {"anchor": [1, 0], "attach": [1, 0]}}},
    // CorsixTH/Lua/objects/bench.lua
    "bench": {"objectIndex": 4, "animations": {"north": 112, "east": 114}, "orientations": {"north": {"anchor": [0, 0], "attach": [0, 0]}, "east": {"anchor": [0, 0], "attach": [0, 0]}, "south": {"anchor": [0, 0], "attach": [0, 0]}, "west": {"anchor": [0, 0], "attach": [0, 0]}}},
    // CorsixTH/Lua/objects/bin.lua
    "bin": {"objectIndex": 50, "animations": {"north": 1752, "south": 1752}, "orientations": {"north": {"anchor": [0, 0], "attach": [0, 0]}, "east": {"anchor": [0, 0], "attach": [0, 0]}}, "side": true},
    // CorsixTH/Lua/objects/bookcase.lua
    "bookcase": {"objectIndex": 56, "animations": {"north": 2406, "south": 2406}, "orientations": {"north": {"anchor": [0, 0], "attach": [0, 0]}, "east": {"anchor": [0, 0], "attach": [0, 0]}}},
    // CorsixTH/Lua/objects/cabinet.lua
    "cabinet": {"objectIndex": 2, "animations": {"north": 80, "east": 82}, "orientations": {"north": {"anchor": [0, 0], "attach": [0, 0]}, "east": {"anchor": [0, 0], "attach": [0, 0]}, "south": {"anchor": [0, 0], "attach": [0, 0]}, "west": {"anchor": [0, 0], "attach": [0, 0]}}},
    // CorsixTH/Lua/objects/chair.lua
    "chair": {"objectIndex": 6, "animations": {"north": 686, "east": 688}, "orientations": {"north": {"anchor": [0, 0], "attach": [0, 0]}, "east": {"anchor": [0, 0], "attach": [0, 0]}, "south": {"anchor": [0, 0], "attach": [0, 0]}, "west": {"anchor": [0, 0], "attach": [0, 0]}}},
    // CorsixTH/Lua/objects/comfortable_chair.lua
    "comfortable_chair": {"objectIndex": 61, "animations": {"north": 2524, "south": 2524}, "orientations": {"north": {"anchor": [0, 0], "attach": [0, 0]}, "east": {"anchor": [0, 0], "attach": [0, 0]}}},
    // CorsixTH/Lua/objects/computer.lua
    "computer": {"objectIndex": 40, "animations": {"north": 2094, "south": 2094}, "orientations": {"north": {"anchor": [0, 0], "attach": [0, 0]}, "east": {"anchor": [0, 0], "attach": [0, 0]}}},
    // CorsixTH/Lua/objects/console.lua
    "console": {"objectIndex": 15, "animations": {"north": 794, "south": 794}, "orientations": {"north": {"anchor": [1, 0], "attach": [1, -1]}, "east": {"anchor": [1, 0], "attach": [0, 0]}}},
    // CorsixTH/Lua/objects/couch.lua
    "couch": {"objectIndex": 18, "animations": {"north": 2540, "south": 2540}, "orientations": {"north": {"anchor": [1, 0], "attach": [0, 0]}, "east": {"anchor": [0, 1], "attach": [0, 1]}}},
    // CorsixTH/Lua/objects/crash_trolley.lua
    "crash_trolley": {"objectIndex": 20, "animations": {"north": 3838, "south": 3838}, "orientations": {"north": {"anchor": [1, 0], "attach": [1, 0], "bottom": true}, "east": {"anchor": [0, 1], "attach": [0, 1], "bottom": true}}},
    // CorsixTH/Lua/objects/desk.lua
    "desk": {"objectIndex": 1, "animations": {"north": 48, "east": 50}, "orientations": {"north": {"anchor": [1, 0], "attach": [1, -1]}, "east": {"anchor": [1, 1], "attach": [1, 0]}, "south": {"anchor": [1, 1], "attach": [-1, 1]}, "west": {"anchor": [0, 1], "attach": [-1, 1]}}},
    // CorsixTH/Lua/objects/door.lua
    "door": {"objectIndex": 3, "animations": {"north": 104, "west": 106}, "orientations": {}},
    // CorsixTH/Lua/objects/doors/entrance_left_door.lua
    "entrance_left_door": {"objectIndex": 58, "animations": {"north": 316, "west": 318}, "orientations": {}},
    // CorsixTH/Lua/objects/doors/entrance_right_door.lua
    "entrance_right_door": {"objectIndex": 59, "animations": {"north": 308, "west": 312}, "orientations": {}},
    // CorsixTH/Lua/objects/doors/swing_door_left.lua
    "swing_door_left": {"objectIndex": 52, "animations": {"north": 1996, "west": 1998}, "orientations": {}},
    // CorsixTH/Lua/objects/doors/swing_door_right.lua
    "swing_door_right": {"objectIndex": 53, "animations": {"north": 2006}, "orientations": {}},
    // CorsixTH/Lua/objects/drinks_machine.lua
    "drinks_machine": {"objectIndex": 7, "animations": {"south": 170, "west": 172, "north": 174, "east": 176}, "orientations": {"north": {"anchor": [0, 0], "attach": [0, 0]}, "east": {"anchor": [0, 0], "attach": [0, 0]}, "south": {"anchor": [0, 0], "attach": [0, 0]}, "west": {"anchor": [0, 0], "attach": [0, 0]}}},
    // CorsixTH/Lua/objects/fire_extinguisher.lua
    "extinguisher": {"objectIndex": 43, "animations": {"north": 178, "east": 468, "south": 470}, "orientations": {"north": {"anchor": [0, 0], "attach": [0, 0]}, "east": {"anchor": [0, 0], "attach": [0, 0]}, "south": {"anchor": [0, 0], "attach": [0, 0]}, "west": {"anchor": [0, 0], "attach": [0, 0]}}, "side": true},
    // CorsixTH/Lua/objects/lecture_chair.lua
    "lecture_chair": {"objectIndex": 36, "animations": {"north": 2626, "south": 2626}, "orientations": {"north": {"anchor": [0, 0], "attach": [0, 0], "early": true}, "east": {"anchor": [0, 0], "attach": [0, 0]}}},
    // CorsixTH/Lua/objects/loo.lua
    "loo": {"objectIndex": 51, "animations": {"north": 1760, "south": 1760}, "orientations": {"north": {"anchor": [0, 0], "attach": [0, 0]}, "east": {"anchor": [0, 0], "attach": [0, 0]}}},
    // CorsixTH/Lua/objects/machines/blood_machine.lua
    "blood_machine": {"objectIndex": 42, "animations": {"north": 2228, "south": 2228}, "orientations": {"north": {"anchor": [0, 0], "attach": [0, 0]}, "east": {"anchor": [0, 0], "attach": [0, 0]}}},
    // CorsixTH/Lua/objects/machines/cardio.lua
    "cardio": {"objectIndex": 13, "animations": {"north": 648, "south": 648}, "orientations": {"north": {"anchor": [0, 1], "attach": [-1, 1]}, "east": {"anchor": [1, 0], "attach": [1, -1]}}},
    // CorsixTH/Lua/objects/machines/cast_remover.lua
    "cast_remover": {"objectIndex": 24, "animations": {"north": 2492, "south": 2492}, "orientations": {"north": {"anchor": [1, 0], "attach": [0, 1], "bottom": true}, "east": {"anchor": [0, 1], "attach": [0, 1], "early": true, "bottom": true}}},
    // CorsixTH/Lua/objects/machines/dna_fixer.lua
    "dna_fixer": {"objectIndex": 23, "animations": {"north": 3840, "south": 3840}, "orientations": {"north": {"anchor": [1, 0], "attach": [1, 0], "early": true}, "east": {"anchor": [0, 1], "attach": [0, 1]}}},
    // CorsixTH/Lua/objects/machines/electrolyser.lua
    "electrolyser": {"objectIndex": 46, "animations": {"north": 1262, "south": 1262}, "orientations": {"north": {"anchor": [1, 0], "attach": [0, -1]}, "east": {"anchor": [0, 1], "attach": [-1, 0]}}},
    // CorsixTH/Lua/objects/machines/hair_restorer.lua
    "hair_restorer": {"objectIndex": 25, "animations": {"north": 2070, "south": 2070}, "orientations": {"north": {"anchor": [0, 0], "attach": [0, 0]}, "east": {"anchor": [0, 0], "attach": [0, 0]}}},
    // CorsixTH/Lua/objects/machines/inflator.lua
    "inflator": {"objectIndex": 9, "animations": {"north": 572, "south": 572}, "orientations": {"north": {"anchor": [0, 0], "attach": [0, 0]}, "east": {"anchor": [0, 0], "attach": [0, 0]}}},
    // CorsixTH/Lua/objects/machines/jelly_moulder.lua
    "jelly_moulder": {"objectIndex": 47, "animations": {"north": 1302, "south": 1302}, "orientations": {"north": {"anchor": [1, 0], "attach": [1, -1]}, "east": {"anchor": [0, 1], "attach": [-1, 1]}}},
    // CorsixTH/Lua/objects/machines/operating_table.lua
    "operating_table": {"objectIndex": 30, "animations": {"north": 2314, "south": 2314}, "orientations": {"north": {"anchor": [1, 1], "attach": [1, 0], "slavePosition": [2, 0]}, "east": {"anchor": [1, 1], "attach": [0, 1], "slavePosition": [0, 2]}}, "slaveId": "operating_table_b"},
    // CorsixTH/Lua/objects/machines/operating_table_b.lua
    "operating_table_b": {"objectIndex": 12, "animations": {"north": 2310, "south": 2310}, "orientations": {"north": {"anchor": [0, 0], "attach": [0, 0]}, "east": {"anchor": [0, 0], "attach": [0, 0]}}},
    // CorsixTH/Lua/objects/machines/scanner.lua
    "scanner": {"objectIndex": 14, "animations": {"north": 1398, "south": 1398}, "orientations": {"north": {"anchor": [0, 1], "attach": [0, 0]}, "east": {"anchor": [0, 1], "attach": [-1, 1]}}},
    // CorsixTH/Lua/objects/machines/shower.lua
    "shower": {"objectIndex": 54, "animations": {"north": 2014, "south": 2014}, "orientations": {"north": {"anchor": [1, 0], "attach": [0, 0]}, "east": {"anchor": [0, 1], "attach": [-1, 1]}}},
    // CorsixTH/Lua/objects/machines/slicer.lua
    "slicer": {"objectIndex": 26, "animations": {"north": 1386, "south": 1386}, "orientations": {"north": {"anchor": [1, 0], "attach": [1, 0], "bottom": true}, "east": {"anchor": [0, 1], "attach": [0, 1], "early": true, "bottom": true}}},
    // CorsixTH/Lua/objects/machines/ultrascanner.lua
    "ultrascanner": {"objectIndex": 22, "animations": {"north": 1556, "south": 1556}, "orientations": {"north": {"anchor": [1, 1], "attach": [1, 1]}, "east": {"anchor": [1, 1], "attach": [1, 1], "bottom": true}}},
    // CorsixTH/Lua/objects/machines/x_ray.lua
    "x_ray": {"objectIndex": 27, "animations": {"north": 1988, "south": 1988}, "orientations": {"north": {"anchor": [0, 1], "attach": [-1, 0]}, "east": {"anchor": [1, 0], "attach": [0, -1]}}},
    // CorsixTH/Lua/objects/op_sink1.lua
    "op_sink1": {"objectIndex": 33, "animations": {"north": 2354, "south": 2354}, "orientations": {"north": {"anchor": [0, 0], "attach": [0, 0], "slavePosition": [0, -1]}, "east": {"anchor": [0, 0], "attach": [0, 0], "slavePosition": [-1, 0]}}, "slaveId": "op_sink2"},
    // CorsixTH/Lua/objects/op_sink2.lua
    "op_sink2": {"objectIndex": 34, "animations": {"north": 2358, "south": 2358}, "orientations": {"north": {"anchor": [0, 0], "attach": [0, 0]}, "east": {"anchor": [0, 0], "attach": [0, 0]}}},
    // CorsixTH/Lua/objects/pharmacy_cabinet.lua
    "pharmacy_cabinet": {"objectIndex": 39, "animations": {"north": 1578, "south": 1578}, "orientations": {"north": {"anchor": [0, 0], "attach": [0, 0]}, "east": {"anchor": [0, 0], "attach": [0, 0]}}},
    // CorsixTH/Lua/objects/plant.lua
    "plant": {"objectIndex": 45, "animations": {"north": 1950, "south": 1950, "east": 1950, "west": 1950}, "orientations": {"north": {"anchor": [0, 0], "attach": [0, 0]}, "east": {"anchor": [0, 0], "attach": [0, 0]}, "south": {"anchor": [0, 0], "attach": [0, 0]}, "west": {"anchor": [0, 0], "attach": [0, 0]}}},
    // CorsixTH/Lua/objects/pool_table.lua
    "pool_table": {"objectIndex": 10, "animations": {"north": 2130, "south": 2130}, "orientations": {"north": {"anchor": [0, 1], "attach": [-1, 1]}, "east": {"anchor": [1, 0], "attach": [1, -1]}}},
    // CorsixTH/Lua/objects/projector.lua
    "projector": {"objectIndex": 37, "animations": {"north": 2586, "south": 2586}, "orientations": {"north": {"anchor": [0, -1], "attach": [0, -1]}, "east": {"anchor": [0, 1], "attach": [0, 1]}}},
    // CorsixTH/Lua/objects/radiation_shield.lua
    "radiation_shield": {"objectIndex": 28, "animations": {"north": 794, "south": 794}, "orientations": {"north": {"anchor": [0, 1], "attach": [0, 0]}, "east": {"anchor": [0, 1], "attach": [0, 0]}}, "slaveId": "radiation_shield_b"},
    // CorsixTH/Lua/objects/radiation_shield_b.lua
    "radiation_shield_b": {"objectIndex": 28, "animations": {"east": 1968, "west": 1968}, "orientations": {"north": {"anchor": [0, 2], "attach": [0, 2]}, "east": {"anchor": [1, 1], "attach": [1, 1]}}},
    // CorsixTH/Lua/objects/radiator.lua
    "radiator": {"objectIndex": 44, "animations": {"north": 750, "east": 752}, "orientations": {"north": {"anchor": [0, 0], "attach": [0, 0]}, "east": {"anchor": [0, 0], "attach": [0, 0]}, "south": {"anchor": [0, 0], "attach": [0, 0]}, "west": {"anchor": [0, 0], "attach": [0, 0]}}, "side": true},
    // CorsixTH/Lua/objects/reception_desk.lua
    "reception_desk": {"objectIndex": 11, "animations": {"north": 2062, "east": 2064}, "orientations": {"north": {"anchor": [0, 0], "attach": [0, 0]}, "east": {"anchor": [0, 0], "attach": [0, 0]}, "south": {"anchor": [0, 0], "attach": [0, 0]}, "west": {"anchor": [0, 0], "attach": [0, 0]}}},
    // CorsixTH/Lua/objects/screen.lua
    "screen": {"objectIndex": 16, "animations": {"north": 1022}, "orientations": {"north": {"anchor": [1, 0], "attach": [0, 0]}}},
    // CorsixTH/Lua/objects/sink.lua
    "sink": {"objectIndex": 32, "animations": {"north": 1748, "south": 1748}, "orientations": {"north": {"anchor": [0, 0], "attach": [0, 0]}, "east": {"anchor": [0, 0], "attach": [0, 0]}}},
    // CorsixTH/Lua/objects/skeleton.lua
    "skeleton": {"objectIndex": 60, "animations": {"north": 2402, "south": 2402}, "orientations": {"north": {"anchor": [0, 0], "attach": [0, 0]}, "east": {"anchor": [0, 0], "attach": [0, 0]}}},
    // CorsixTH/Lua/objects/sofa.lua
    "sofa": {"objectIndex": 19, "animations": {"north": 2122, "east": 2124}, "orientations": {"north": {"anchor": [1, 0], "attach": [0, 0]}, "east": {"anchor": [0, 1], "attach": [0, 1]}, "south": {"anchor": [1, 0], "attach": [1, 0]}, "west": {"anchor": [0, 1], "attach": [0, 1]}}},
    // CorsixTH/Lua/objects/surgeon_screen.lua
    "surgeon_screen": {"objectIndex": 35, "animations": {"north": 2772}, "orientations": {"north": {"anchor": [1, 0], "attach": [0, 0]}}},
    // CorsixTH/Lua/objects/tv.lua
    "tv": {"objectIndex": 21, "animations": {"north": 396, "east": 398}, "orientations": {"north": {"anchor": [0, 0], "attach": [0, 0]}, "east": {"anchor": [0, 0], "attach": [0, 0]}, "south": {"anchor": [0, 0], "attach": [0, 0]}, "west": {"anchor": [0, 0], "attach": [0, 0]}}},
    // CorsixTH/Lua/objects/video_game.lua
    "video_game": {"objectIndex": 57, "animations": {"north": 3696, "south": 3696}, "orientations": {"north": {"anchor": [0, 0], "attach": [0, 0]}, "east": {"anchor": [0, 0], "attach": [0, 0]}}},
    // CorsixTH/Lua/objects/x_ray_viewer.lua
    "x_ray_viewer": {"objectIndex": 29, "animations": {"north": 2390, "south": 2390}, "orientations": {"north": {"anchor": [0, 0], "attach": [0, 0], "bottom": true}, "east": {"anchor": [0, 0], "attach": [0, 0], "early": true, "bottom": true}}},
};
