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
exports.ApiListResult = void 0;
var api_result_1 = require("./api-result");
var api_status_1 = require("./api-status");
var ApiListResult = /** @class */ (function (_super) {
    __extends(ApiListResult, _super);
    function ApiListResult(data, status, message) {
        if (data === void 0) { data = []; }
        if (status === void 0) { status = api_status_1.ApiStatus.ok; }
        if (message === void 0) { message = ""; }
        var _this = _super.call(this) || this;
        _this.data = data;
        _this.status = status;
        _this.message = message;
        return _this;
    }
    return ApiListResult;
}(api_result_1.ApiResultBase));
exports.ApiListResult = ApiListResult;
