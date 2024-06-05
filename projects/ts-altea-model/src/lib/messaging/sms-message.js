"use strict";
// message: string, toMobile: string, sender: string
Object.defineProperty(exports, "__esModule", { value: true });
exports.SmsMessage = void 0;
var SmsMessage = /** @class */ (function () {
    function SmsMessage(from, to, body) {
        this.from = from;
        this.to = to;
        this.body = body;
    }
    return SmsMessage;
}());
exports.SmsMessage = SmsMessage;
