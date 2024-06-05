"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        if (typeof b !== "function" && b !== null)
            throw new TypeError("Class extends value " + String(b) + " is not a constructor or null");
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.Job = exports.ScriptLog = exports.JobStatus = void 0;
var action_1 = require("./action");
var script_1 = require("./script");
var JobStatus;
(function (JobStatus) {
    JobStatus["scheduled"] = "scheduled";
    JobStatus["error"] = "error";
    JobStatus["done"] = "done";
    JobStatus["ok"] = "ok";
})(JobStatus || (exports.JobStatus = JobStatus = {}));
var ScriptLog = /** @class */ (function () {
    function ScriptLog() {
        this.status = JobStatus.ok;
        this.actions = [];
    }
    ScriptLog.prototype.logAction = function (status, msg) {
        this.actions.push(new action_1.ActionLog(status, msg));
        if (status != action_1.ActionStatus.ok)
            this.status = JobStatus.error;
    };
    ScriptLog.prototype.log = function (actionLog) {
        this.actions.push(actionLog);
        if (actionLog.status != action_1.ActionStatus.ok)
            this.status = JobStatus.error;
    };
    return ScriptLog;
}());
exports.ScriptLog = ScriptLog;
var Job = /** @class */ (function (_super) {
    __extends(Job, _super);
    function Job(name, date, eventId, id) {
        var _this = _super.call(this, name, id) || this;
        _this.status = JobStatus.scheduled;
        _this.date = date;
        _this.eventId = eventId;
        return _this;
    }
    return Job;
}(script_1.Script));
exports.Job = Job;
