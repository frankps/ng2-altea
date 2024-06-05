"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SlotFinderContinuous = void 0;
/* eslint-disable @typescript-eslint/no-non-null-assertion */
var ts_altea_model_1 = require("ts-altea-model");
var SlotFinderContinuous = /** @class */ (function () {
    function SlotFinderContinuous() {
    }
    Object.defineProperty(SlotFinderContinuous, "I", {
        /** Returns instance of this class */
        get: function () {
            return SlotFinderContinuous._I;
        },
        enumerable: false,
        configurable: true
    });
    SlotFinderContinuous.prototype.findSlots = function (resReqItem, inDateRange, ctx) {
        var product = resReqItem.product;
        // then we get initial slots from product.plan
        return ts_altea_model_1.DateRangeSet.empty;
    };
    SlotFinderContinuous._I = new SlotFinderContinuous();
    return SlotFinderContinuous;
}());
exports.SlotFinderContinuous = SlotFinderContinuous;
