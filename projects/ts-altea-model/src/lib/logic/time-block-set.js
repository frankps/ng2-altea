"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TimeBlockSet = void 0;
var time_block_1 = require("./time-block");
var TimeBlockSet = /** @class */ (function () {
    function TimeBlockSet() {
        this.blocks = [];
    }
    TimeBlockSet.prototype.addBlock = function (block) {
        this.blocks.push(block);
    };
    TimeBlockSet.prototype.addBlockByDates = function (from, to) {
        var block = new time_block_1.TimeBlock(from, to);
        this.addBlock(block);
    };
    return TimeBlockSet;
}());
exports.TimeBlockSet = TimeBlockSet;
