"use strict";
var _a, _b;
Object.defineProperty(exports, "__esModule", { value: true });
exports.TimeInterval = exports.TimeIntervalType = void 0;
var dateFns = require("date-fns");
var TimeIntervalType;
(function (TimeIntervalType) {
    TimeIntervalType[TimeIntervalType["hours"] = 0] = "hours";
    TimeIntervalType[TimeIntervalType["mins"] = 1] = "mins";
    TimeIntervalType[TimeIntervalType["secs"] = 2] = "secs";
    TimeIntervalType[TimeIntervalType["ms"] = 3] = "ms";
})(TimeIntervalType || (exports.TimeIntervalType = TimeIntervalType = {}));
var TimeInterval = /** @class */ (function () {
    function TimeInterval(interval, type, difference, differenceType) {
        if (difference === void 0) { difference = 1; }
        if (differenceType === void 0) { differenceType = TimeIntervalType.secs; }
        this.interval = interval;
        this.type = type;
        this.difference = difference;
        this.differenceType = differenceType;
        this.addToDate = TimeInterval.incrementMap[this.type]();
        this.removeDifference = TimeInterval.decrementMap[this.differenceType]();
    }
    TimeInterval.hours = function (hours, difference, differenceType) {
        return new TimeInterval(hours, TimeIntervalType.hours, difference, differenceType);
    };
    TimeInterval.minutes = function (minutes, difference, differenceType) {
        return new TimeInterval(minutes, TimeIntervalType.mins, difference, differenceType);
    };
    TimeInterval.seconds = function (seconds, difference, differenceType) {
        return new TimeInterval(seconds, TimeIntervalType.secs, difference, differenceType);
    };
    TimeInterval.milliseconds = function (ms, difference, differenceType) {
        return new TimeInterval(ms, TimeIntervalType.ms, difference, differenceType);
    };
    /**
     * Returns the number of intervals possible withing the range
     */
    TimeInterval.prototype.takeIntervalsFrom = function (range) {
        var difference = this.takeDifferenceFrom(range);
        return Math.floor(difference / this.interval);
    };
    /**
     * Returns the interval difference between range
     */
    TimeInterval.prototype.takeDifferenceFrom = function (range) {
        switch (this.type) {
            case TimeIntervalType.hours:
                return dateFns.differenceInHours(range.to, range.from);
            case TimeIntervalType.mins:
                return dateFns.differenceInMinutes(range.to, range.from);
            case TimeIntervalType.secs:
                return dateFns.differenceInSeconds(range.to, range.from);
            case TimeIntervalType.ms:
                return dateFns.differenceInMilliseconds(range.to, range.from);
        }
    };
    /**
     * Returns incremented date of few times by the interval
     */
    TimeInterval.prototype.increment = function (date, times, withoutDifference) {
        if (times === void 0) { times = 1; }
        if (withoutDifference === void 0) { withoutDifference = false; }
        var amount = times * this.interval;
        var newDate = this.addToDate(date, amount);
        return withoutDifference
            ? this.removeDifference(newDate, this.difference)
            : newDate;
    };
    TimeInterval.incrementMap = (_a = {},
        _a[TimeIntervalType.hours] = function () { return dateFns.addHours; },
        _a[TimeIntervalType.mins] = function () { return dateFns.addMinutes; },
        _a[TimeIntervalType.secs] = function () { return dateFns.addSeconds; },
        _a[TimeIntervalType.ms] = function () { return dateFns.addMilliseconds; },
        _a);
    TimeInterval.decrementMap = (_b = {},
        _b[TimeIntervalType.hours] = function () { return dateFns.subHours; },
        _b[TimeIntervalType.mins] = function () { return dateFns.subMinutes; },
        _b[TimeIntervalType.secs] = function () { return dateFns.subSeconds; },
        _b[TimeIntervalType.ms] = function () { return dateFns.subMilliseconds; },
        _b);
    return TimeInterval;
}());
exports.TimeInterval = TimeInterval;
