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
exports.ApiBatchResult = exports.ApiBatchItemResult = exports.ApiBatchProcess = void 0;
var api_result_1 = require("./api-result");
var api_status_1 = require("./api-status");
var ApiBatchProcess = /** @class */ (function () {
    function ApiBatchProcess() {
        this.create = [];
        this.update = [];
        this.delete = []; // list of ids or list of objects with key identifiers (example: many-many relations)
    }
    ApiBatchProcess.prototype.hasChanges = function () {
        if (this.create && this.create.length > 0)
            return true;
        if (this.update && this.update.length > 0)
            return true;
        if (this.delete && this.delete.length > 0)
            return true;
        return false;
    };
    return ApiBatchProcess;
}());
exports.ApiBatchProcess = ApiBatchProcess;
var ApiBatchItemResult = /** @class */ (function (_super) {
    __extends(ApiBatchItemResult, _super);
    function ApiBatchItemResult(obj, status, message) {
        if (status === void 0) { status = api_status_1.ApiStatus.ok; }
        var _this = _super.call(this) || this;
        _this.object = obj;
        _this.status = status;
        _this.message = message;
        return _this;
    }
    return ApiBatchItemResult;
}(api_result_1.ApiResultBase));
exports.ApiBatchItemResult = ApiBatchItemResult;
var ApiBatchResult = /** @class */ (function (_super) {
    __extends(ApiBatchResult, _super);
    function ApiBatchResult() {
        var _this = _super !== null && _super.apply(this, arguments) || this;
        _this.update = [];
        _this.create = [];
        _this.delete = [];
        // status: ApiStatus = ApiStatus.notProcessed
        // message?: string
        /** Number of errors */
        _this.errors = 0;
        return _this;
    }
    return ApiBatchResult;
}(api_result_1.ApiResultBase));
exports.ApiBatchResult = ApiBatchResult;
