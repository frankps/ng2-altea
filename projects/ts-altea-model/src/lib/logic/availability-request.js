"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AvailabilityResponse = exports.SlotInfo = exports.PossibleSlots = exports.AvailabilityDebugInfo = exports.AvailabilityRequest = void 0;
var ts_common_1 = require("ts-common");
var _ = require("lodash");
var dateFns = require("date-fns");
var AvailabilityRequest = /** @class */ (function () {
    function AvailabilityRequest(order) {
        /** search for possibilities in the interval [from, to] */
        this.from = 0; // format: yyyyMMddHHmmss
        this.to = 0; // format: yyyyMMddHHmmss
        this.debug = false;
        /** if preferred staff members: supply id's */
        this.staffIds = [];
        this.order = order;
        this.from = order.start;
        this.to = order.start;
    }
    return AvailabilityRequest;
}());
exports.AvailabilityRequest = AvailabilityRequest;
var AvailabilityDebugInfo = /** @class */ (function () {
    function AvailabilityDebugInfo() {
        this.resourceRequests = [];
    }
    return AvailabilityDebugInfo;
}());
exports.AvailabilityDebugInfo = AvailabilityDebugInfo;
var PossibleSlots = /** @class */ (function () {
    function PossibleSlots(slots) {
        if (slots === void 0) { slots = []; }
        this.slots = [];
        this.slots = slots;
    }
    Object.defineProperty(PossibleSlots, "empty", {
        get: function () {
            return new PossibleSlots();
        },
        enumerable: false,
        configurable: true
    });
    PossibleSlots.prototype.isEmpty = function () {
        return (!Array.isArray(this.slots) || this.slots.length === 0);
    };
    PossibleSlots.prototype.hasSlots = function () {
        return (Array.isArray(this.slots) && this.slots.length > 0);
    };
    PossibleSlots.prototype.startDays = function () {
        //  console.error('startDays')
        var dates = this.slots.map(function (slot) {
            var startDate = slot.startDate;
            startDate.getTime();
            startDate.getMilliseconds;
            return new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate());
        });
        //     dates = _.uniqBy(dates, {d => dateFns.getTime()} )
        dates = _.uniqBy(dates, 'getTime()');
        //  console.error(dates)
        return dates;
    };
    PossibleSlots.prototype.getSlotsForDay = function (start) {
        var end = dateFns.addDays(start, 1);
        var startNum = ts_common_1.DateHelper.yyyyMMddhhmmss(start);
        var endNum = ts_common_1.DateHelper.yyyyMMddhhmmss(end);
        var slots = this.slots.filter(function (slot) { return slot.start >= startNum && slot.start < endNum; });
        return slots;
    };
    return PossibleSlots;
}());
exports.PossibleSlots = PossibleSlots;
var SlotInfo = /** @class */ (function () {
    function SlotInfo() {
        this.start = 0;
    }
    // constructor() {
    // }
    SlotInfo.fromDate = function (date) {
        var slotInfo = new SlotInfo();
        slotInfo.start = ts_common_1.DateHelper.yyyyMMddhhmmss(date);
        return slotInfo;
    };
    SlotInfo.fromDateRange = function (dateRange) {
        var slotInfo = new SlotInfo();
        slotInfo.start = ts_common_1.DateHelper.yyyyMMddhhmmss(dateRange.from);
        return slotInfo;
    };
    Object.defineProperty(SlotInfo.prototype, "startDate", {
        get: function () {
            return ts_common_1.DateHelper.parse(this.start);
        },
        enumerable: false,
        configurable: true
    });
    return SlotInfo;
}());
exports.SlotInfo = SlotInfo;
var AvailabilityResponse = /** @class */ (function () {
    function AvailabilityResponse(orders) {
        if (orders === void 0) { orders = []; }
        this.orders = [];
        this.debug = new AvailabilityDebugInfo();
        this.orders = orders;
    }
    return AvailabilityResponse;
}());
exports.AvailabilityResponse = AvailabilityResponse;
