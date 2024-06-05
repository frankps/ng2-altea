"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TimeBlock = void 0;
var TimeBlock = /** @class */ (function () {
    // from = new Date()
    // to = new Date()
    function TimeBlock(from, to) {
        if (from === void 0) { from = new Date(); }
        if (to === void 0) { to = new Date(); }
        this.from = from;
        this.to = to;
    }
    return TimeBlock;
}());
exports.TimeBlock = TimeBlock;
