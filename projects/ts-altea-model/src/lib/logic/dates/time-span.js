"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TimeSpan = void 0;
var dateFns = require("date-fns");
var altea_schema_1 = require("../../altea-schema");
/* export enum TimeUnit {
    hours,
    minutes,
    seconds
} */
/** A TimeSpan is internally represented in seconds */
var TimeSpan = /** @class */ (function () {
    function TimeSpan(time, unit) {
        if (time === void 0) { time = 0; }
        if (unit === void 0) { unit = altea_schema_1.TimeUnit.seconds; }
        this.seconds = 0;
        this.addTime(time, unit);
    }
    TimeSpan.prototype.clone = function () {
        return new TimeSpan(this.seconds);
    };
    TimeSpan.hours = function (hours, minutes, seconds) {
        if (minutes === void 0) { minutes = 0; }
        if (seconds === void 0) { seconds = 0; }
        return new TimeSpan(hours * 3600 + minutes * 60 + seconds);
    };
    TimeSpan.minutes = function (minutes, seconds) {
        if (seconds === void 0) { seconds = 0; }
        return new TimeSpan(minutes * 60 + seconds);
    };
    TimeSpan.prototype.add = function (timeSpan) {
        return new TimeSpan(this.seconds + timeSpan.seconds);
    };
    TimeSpan.prototype.addInternal = function (timeSpan) {
        this.seconds += timeSpan.seconds;
    };
    TimeSpan.prototype.addToDate = function (date) {
        return dateFns.addSeconds(date, this.seconds);
    };
    TimeSpan.prototype.addTime = function (time, unit) {
        if (unit === void 0) { unit = altea_schema_1.TimeUnit.seconds; }
        var secondsToAdd = 0;
        switch (unit) {
            case altea_schema_1.TimeUnit.hours:
                secondsToAdd = time * 3600;
                break;
            case altea_schema_1.TimeUnit.minutes:
                secondsToAdd = time * 60;
                break;
            case altea_schema_1.TimeUnit.seconds:
                secondsToAdd = time;
                break;
        }
        this.seconds += secondsToAdd;
    };
    TimeSpan.prototype.addMinutes = function (minutes) {
        if (minutes === void 0) { minutes = 0; }
        this.seconds += minutes * 60;
    };
    TimeSpan.prototype.toString = function () {
        var total = this.seconds;
        var sec = total % 60;
        total = (total - sec) / 60;
        var min = total % 60;
        total = (total - min) / 60;
        var hour = total % 60;
        total = (total - hour) / 60;
        return "".concat(hour, ":").concat(min, ":").concat(sec);
    };
    Object.defineProperty(TimeSpan, "zero", {
        get: function () {
            return new TimeSpan();
        },
        enumerable: false,
        configurable: true
    });
    return TimeSpan;
}());
exports.TimeSpan = TimeSpan;
