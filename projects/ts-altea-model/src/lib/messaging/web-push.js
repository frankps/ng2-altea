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
exports.WebPushToUsers = exports.WebPushMessage = void 0;
var WebPushMessage = /** @class */ (function () {
    /*     title: string
        body: string */
    function WebPushMessage(title, body) {
        this.title = title;
        this.body = body;
    }
    return WebPushMessage;
}());
exports.WebPushMessage = WebPushMessage;
var WebPushToUsers = /** @class */ (function (_super) {
    __extends(WebPushToUsers, _super);
    function WebPushToUsers(title, body) {
        var _this = _super.call(this, title, body) || this;
        _this.userIds = [];
        return _this;
    }
    return WebPushToUsers;
}(WebPushMessage));
exports.WebPushToUsers = WebPushToUsers;
