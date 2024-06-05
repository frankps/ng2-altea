"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ActionLog = exports.ActionStatus = exports.Action = exports.ActionArgs = exports.ActionType = void 0;
var ActionType;
(function (ActionType) {
    ActionType["sendMail"] = "sendMail";
    ActionType["luxom"] = "luxom";
    ActionType["luxomState"] = "luxomState";
    ActionType["script"] = "script";
})(ActionType || (exports.ActionType = ActionType = {}));
var ActionArgs = /** @class */ (function () {
    function ActionArgs() {
    }
    return ActionArgs;
}());
exports.ActionArgs = ActionArgs;
var Action = /** @class */ (function () {
    function Action(type, args) {
        this.type = type;
        this.args = args;
    }
    return Action;
}());
exports.Action = Action;
var ActionStatus;
(function (ActionStatus) {
    ActionStatus["ok"] = "ok";
    ActionStatus["error"] = "error";
})(ActionStatus || (exports.ActionStatus = ActionStatus = {}));
var ActionLog = /** @class */ (function () {
    function ActionLog(status, msg) {
        this.status = status;
        this.msg = msg;
    }
    return ActionLog;
}());
exports.ActionLog = ActionLog;
