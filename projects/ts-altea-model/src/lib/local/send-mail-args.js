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
exports.SendMailArgs = void 0;
var action_1 = require("./action");
// { from: 'info@aquasense.be', to: 'frank@dvit.eu', subject: 'Wellness end', body: 'Einde van de wellness' }
var SendMailArgs = /** @class */ (function (_super) {
    __extends(SendMailArgs, _super);
    function SendMailArgs(from, to, subject, body) {
        var _this = _super.call(this) || this;
        _this.from = from;
        _this.to = to;
        _this.subject = subject;
        _this.body = body;
        return _this;
    }
    return SendMailArgs;
}(action_1.ActionArgs));
exports.SendMailArgs = SendMailArgs;
