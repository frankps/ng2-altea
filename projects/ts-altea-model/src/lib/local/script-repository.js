"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ScriptRepository = void 0;
var action_1 = require("./action");
var script_1 = require("./script");
var luxom_address_1 = require("./luxom-address");
var luxom_cmd_1 = require("./luxom-cmd");
var ts_common_1 = require("ts-common");
var ScriptRepository = /** @class */ (function () {
    function ScriptRepository() {
    }
    ScriptRepository.init = function () {
        var all = ScriptRepository.all = [];
        all.push(ScriptRepository.wellness_start_min15);
        all.push(ScriptRepository.wellness_start_min4);
        all.push(ScriptRepository.wellness_start_min2);
        all.push(ScriptRepository.wellness_end_min10);
        all.push(ScriptRepository.wellness_end_plus2);
        return all;
    };
    ScriptRepository.getById = function (scriptId) {
        if (ts_common_1.ArrayHelper.IsEmpty(ScriptRepository.all))
            ScriptRepository.init();
        var script = ScriptRepository.all.find(function (s) { return s.id == scriptId; });
        return script;
    };
    Object.defineProperty(ScriptRepository, "wellness_start_min15", {
        get: function () {
            var script = new script_1.Script("Wellness Start -15", "wellness_start_min15");
            // -15 mins
            script.addAction(action_1.ActionType.luxom, luxom_cmd_1.LuxomState.set(luxom_address_1.LuxomAddress.spotsKelder));
            script.addAction(action_1.ActionType.luxom, luxom_cmd_1.LuxomState.set(luxom_address_1.LuxomAddress.wandTrapInkom));
            script.addAction(action_1.ActionType.luxom, luxom_cmd_1.LuxomState.setPctg(luxom_address_1.LuxomAddress.gogglesTrapWellness, "25"));
            script.addAction(action_1.ActionType.luxom, luxom_cmd_1.LuxomState.set(luxom_address_1.LuxomAddress.vloerTrapWellness));
            return script;
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(ScriptRepository, "wellness_start_min4", {
        get: function () {
            var script = new script_1.Script("Wellness Start -4", "wellness_start_min4");
            // -4
            script.addAction(action_1.ActionType.luxom, luxom_cmd_1.LuxomState.setPctg(luxom_address_1.LuxomAddress.zwembadTL, "15"));
            script.addAction(action_1.ActionType.luxom, luxom_cmd_1.LuxomState.set(luxom_address_1.LuxomAddress.zwembadLampen));
            script.addAction(action_1.ActionType.luxom, luxom_cmd_1.LuxomState.setPctg(luxom_address_1.LuxomAddress.spotsJacuzzi, "40"));
            script.addAction(action_1.ActionType.luxom, luxom_cmd_1.LuxomState.setPctg(luxom_address_1.LuxomAddress.spotsStraat, "40"));
            script.addAction(action_1.ActionType.luxom, luxom_cmd_1.LuxomState.set(luxom_address_1.LuxomAddress.jacuzziLamp));
            script.addAction(action_1.ActionType.luxom, luxom_cmd_1.LuxomState.set(luxom_address_1.LuxomAddress.toiletWellness));
            script.addAction(action_1.ActionType.luxom, luxom_cmd_1.LuxomState.setPctg(luxom_address_1.LuxomAddress.jacuzziTL, "0"));
            script.addAction(action_1.ActionType.luxom, luxom_cmd_1.LuxomState.setPctg(luxom_address_1.LuxomAddress.tuinTL, "0"));
            return script;
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(ScriptRepository, "wellness_start_min2", {
        get: function () {
            var script = new script_1.Script("Wellness Start -2", "wellness_start_min2");
            // -2
            script.addAction(action_1.ActionType.luxom, luxom_cmd_1.LuxomState.toggle(luxom_address_1.LuxomAddress.saunaStoombad));
            return script;
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(ScriptRepository, "wellness_end_min10", {
        get: function () {
            var script = new script_1.Script("Wellness End -10", "wellness_end_min10");
            // -10 mins
            script.addAction(action_1.ActionType.luxom, luxom_cmd_1.LuxomState.set(luxom_address_1.LuxomAddress.wandTrapInkom));
            script.addAction(action_1.ActionType.luxom, luxom_cmd_1.LuxomState.setPctg(luxom_address_1.LuxomAddress.jacuzziTL, "40"));
            script.addAction(action_1.ActionType.luxom, luxom_cmd_1.LuxomState.setPctg(luxom_address_1.LuxomAddress.tuinTL, "40"));
            script.addAction(action_1.ActionType.luxom, luxom_cmd_1.LuxomState.setPctg(luxom_address_1.LuxomAddress.zwembadTL, "30"));
            return script;
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(ScriptRepository, "wellness_end_plus2", {
        get: function () {
            var script = new script_1.Script("Wellness End +2", "wellness_end_plus2");
            // 2 mins
            script.addAction(action_1.ActionType.luxom, luxom_cmd_1.LuxomState.clear(luxom_address_1.LuxomAddress.spotsJacuzzi));
            script.addAction(action_1.ActionType.luxom, luxom_cmd_1.LuxomState.clear(luxom_address_1.LuxomAddress.spotsStraat));
            script.addAction(action_1.ActionType.luxom, luxom_cmd_1.LuxomState.toggle(luxom_address_1.LuxomAddress.saunaStoombad));
            script.addAction(action_1.ActionType.luxom, luxom_cmd_1.LuxomState.clear(luxom_address_1.LuxomAddress.zwembadLampen));
            script.addAction(action_1.ActionType.luxom, luxom_cmd_1.LuxomState.clear(luxom_address_1.LuxomAddress.jacuzziLamp));
            return script;
        },
        enumerable: false,
        configurable: true
    });
    return ScriptRepository;
}());
exports.ScriptRepository = ScriptRepository;
