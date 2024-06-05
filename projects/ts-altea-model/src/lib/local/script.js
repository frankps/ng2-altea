"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Script = void 0;
var action_1 = require("./action");
var ts_common_1 = require("ts-common");
var job_1 = require("./job");
var dateFns = require("date-fns");
var Script = /** @class */ (function () {
    function Script(name, id) {
        this.actions = [];
        this.name = name;
        if (!id)
            this.id = ts_common_1.ObjectHelper.newGuid();
    }
    Script.prototype.addAction = function (type, args) {
        var action = new action_1.Action(type, args);
        this.actions.push(action);
    };
    Script.prototype.hasActions = function () {
        return ts_common_1.ArrayHelper.AtLeastOneItem(this.actions);
    };
    Script.prototype.hasActionType = function (type) {
        if (!this.hasActions())
            return false;
        var idx = this.actions.findIndex(function (a) { return a.type == type; });
        return idx >= 0;
    };
    Script.prototype.makeJob = function (date, eventId, offsetMinutes) {
        if (offsetMinutes === void 0) { offsetMinutes = 0; }
        var jobDate = dateFns.addMinutes(date, offsetMinutes);
        var job = new job_1.Job(this.name, date, eventId);
        job.actions = this.actions;
        return job;
    };
    return Script;
}());
exports.Script = Script;
