"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.OffsetDuration = void 0;
var time_span_1 = require("./dates/time-span");
var OffsetDuration = /** @class */ (function () {
    function OffsetDuration() {
        this.offset = time_span_1.TimeSpan.zero;
        this.duration = time_span_1.TimeSpan.zero;
    }
    return OffsetDuration;
}());
exports.OffsetDuration = OffsetDuration;
