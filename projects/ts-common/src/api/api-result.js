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
exports.ApiResult = exports.ApiMultiResult = exports.ApiResultBase = void 0;
var api_status_1 = require("./api-status");
var ApiResultBase = /** @class */ (function () {
    function ApiResultBase() {
        this.status = api_status_1.ApiStatus.notProcessed;
    }
    Object.defineProperty(ApiResultBase.prototype, "isOk", {
        get: function () {
            return this.status == api_status_1.ApiStatus.ok;
        },
        enumerable: false,
        configurable: true
    });
    return ApiResultBase;
}());
exports.ApiResultBase = ApiResultBase;
var ApiMultiResult = /** @class */ (function (_super) {
    __extends(ApiMultiResult, _super);
    function ApiMultiResult() {
        var results = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            results[_i] = arguments[_i];
        }
        var _this = _super.call(this) || this;
        _this.results = [];
        _this.add.apply(_this, results);
        return _this;
    }
    ApiMultiResult.prototype.addSingle = function (result) {
        if (!result)
            return;
        if (this.results.length == 0)
            this.status = result.status;
        else {
            if (result.status != api_status_1.ApiStatus.ok)
                this.status = result.status;
        }
        this.results.push(result);
    };
    ApiMultiResult.prototype.add = function () {
        var _this = this;
        var results = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            results[_i] = arguments[_i];
        }
        results.forEach(function (res) { return _this.addSingle(res); });
    };
    return ApiMultiResult;
}(ApiResultBase));
exports.ApiMultiResult = ApiMultiResult;
var ApiResult = /** @class */ (function (_super) {
    __extends(ApiResult, _super);
    function ApiResult(obj, status, message) {
        if (status === void 0) { status = api_status_1.ApiStatus.ok; }
        var _this = _super.call(this) || this;
        _this.object = obj;
        _this.status = status;
        _this.message = message;
        return _this;
    }
    return ApiResult;
}(ApiResultBase));
exports.ApiResult = ApiResult;
