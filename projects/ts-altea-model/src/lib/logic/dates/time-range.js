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
exports.TimeRange = void 0;
var date_range_1 = require("./date-range");
// Source: https://github.com/gund/time-slots/blob/master/packages/time-slots/src/lib
var TimeRange = /** @class */ (function (_super) {
    __extends(TimeRange, _super);
    function TimeRange() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    /**
     * @param fromTime Time string in format `HH:mm:ss:ms`
     * @param toTime Time string in format `HH:mm:ss:ms`
     * @param date The day component of time range
     */
    TimeRange.fromTimeStrings = function (fromTime, toTime, date) {
        var _a = this.parseTimeStr(fromTime), fromHours = _a[0], fromMins = _a[1], fromSecs = _a[2], fromMs = _a[3];
        var _b = this.parseTimeStr(toTime), toHours = _b[0], toMins = _b[1], toSecs = _b[2], toMs = _b[3];
        return this.fromTimeDates(new Date(0, 0, 0, fromHours, fromMins, fromSecs, fromMs), new Date(0, 0, 0, toHours, toMins, toSecs, toMs), date);
    };
    /**
     * @param fromTime Time component of from range
     * @param toTime Time component of to range
     * @param date The date component of time range
     */
    TimeRange.fromTimeDates = function (fromTime, toTime, date) {
        if (date === void 0) { date = new Date(0, 0, 0); }
        return this.fromDates(new Date(date.getFullYear(), date.getMonth(), date.getDate(), fromTime.getHours(), fromTime.getMinutes(), fromTime.getSeconds(), fromTime.getMilliseconds()), new Date(date.getFullYear(), date.getMonth(), date.getDate(), toTime.getHours(), toTime.getMinutes(), toTime.getSeconds(), toTime.getMilliseconds()));
    };
    TimeRange.fromDates = function (from, to) {
        return new TimeRange(from, to);
    };
    TimeRange.fromTimeRange = function (timeRange) {
        return timeRange.clone();
    };
    /**
     * @param time Time string in format `HH:mm:ss:ms`
     */
    TimeRange.parseTimeStr = function (time) {
        var _a = time.split(':').map(Number), hours = _a[0], _b = _a[1], mins = _b === void 0 ? 0 : _b, _c = _a[2], secs = _c === void 0 ? 0 : _c, _d = _a[3], ms = _d === void 0 ? 0 : _d;
        return [hours, mins, secs, ms];
    };
    /**
     * Returns intervals for a day in the time range
     */
    TimeRange.prototype.createIntervalsFor = function (day, interval) {
        var _a;
        var intervalsCount = (_a = interval.takeIntervalsFrom(this)) !== null && _a !== void 0 ? _a : 0;
        var intervals = new Array(intervalsCount);
        for (var i = 0; i < intervalsCount; i++) {
            intervals[i] = TimeRange.fromTimeDates(interval.increment(this.from, i), interval.increment(this.from, i + 1, true), day);
        }
        return intervals;
    };
    return TimeRange;
}(date_range_1.DateRange));
exports.TimeRange = TimeRange;
