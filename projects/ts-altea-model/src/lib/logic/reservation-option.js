"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ReservationOptionSet = exports.ReservationOption = void 0;
var ts_common_1 = require("ts-common");
var solution_1 = require("./solution");
var dateFns = require("date-fns");
var ReservationOption = /** @class */ (function () {
    /**
     *
     * @param dateNum date number in format: yyyyMMddhhmmss
     */
    function ReservationOption(dateNum) {
        if (dateNum === void 0) { dateNum = 0; }
        this.dateNum = dateNum;
        /** a reservation option is originating from 1 or more solutions */
        this.solutionIds = [];
    }
    Object.defineProperty(ReservationOption.prototype, "date", {
        get: function () {
            return ts_common_1.DateHelper.parse(this.dateNum);
        },
        enumerable: false,
        configurable: true
    });
    ReservationOption.fromDate = function (start, solutionId) {
        var dateNum = ts_common_1.DateHelper.yyyyMMddhhmmss(start);
        var option = new ReservationOption(dateNum);
        if (solutionId)
            option.solutionIds.push(solutionId);
        return option;
    };
    return ReservationOption;
}());
exports.ReservationOption = ReservationOption;
var ReservationOptionSet = /** @class */ (function () {
    // options: ReservationOption[] = []
    function ReservationOptionSet(options, solutionSet) {
        if (options === void 0) { options = []; }
        if (solutionSet === void 0) { solutionSet = solution_1.SolutionSet.empty; }
        this.options = options;
        this.solutionSet = solutionSet;
    }
    Object.defineProperty(ReservationOptionSet, "empty", {
        get: function () {
            return new ReservationOptionSet();
        },
        enumerable: false,
        configurable: true
    });
    ReservationOptionSet.fromDates = function (dates, solutionId) {
        if (!Array.isArray(dates) || dates.length == 0)
            return ReservationOptionSet.empty;
        var options = dates.map(function (d) { return ReservationOption.fromDate(d, solutionId); });
        return new ReservationOptionSet(options);
    };
    ReservationOptionSet.prototype.add = function () {
        var _a;
        var options = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            options[_i] = arguments[_i];
        }
        if (!Array.isArray(this.options))
            this.options = [];
        (_a = this.options).push.apply(_a, options);
    };
    ReservationOptionSet.prototype.addSet = function (set) {
        if (!set)
            return;
        this.add.apply(this, set.options);
    };
    /** for UI testing: to have some options to click on */
    ReservationOptionSet.createDummy = function (date) {
        if (date === void 0) { date = new Date(); }
        var set = ReservationOptionSet.empty;
        var startOfDay = dateFns.startOfDay(date);
        for (var hour = 9; hour < 17; hour++) {
            var dateOption = dateFns.addHours(startOfDay, hour);
            var dateNum = ts_common_1.DateHelper.yyyyMMddhhmmss(dateOption);
            var option = new ReservationOption(dateNum);
            set.add(option);
        }
        return set;
    };
    return ReservationOptionSet;
}());
exports.ReservationOptionSet = ReservationOptionSet;
