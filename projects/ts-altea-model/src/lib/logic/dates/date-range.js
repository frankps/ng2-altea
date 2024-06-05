"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DateRange = exports.OverlapMode = void 0;
var dateFns = require("date-fns");
var date_border_1 = require("./date-border");
var ts_common_1 = require("ts-common");
var time_span_1 = require("./time-span");
var date_range_set_1 = require("./date-range-set");
// Source: https://github.com/gund/time-slots/blob/master/packages/time-slots/src/lib
var OverlapMode;
(function (OverlapMode) {
    OverlapMode[OverlapMode["noOverlap"] = 0] = "noOverlap";
    OverlapMode[OverlapMode["exact"] = 1] = "exact";
    OverlapMode[OverlapMode["otherOverlapsFull"] = 2] = "otherOverlapsFull";
    OverlapMode[OverlapMode["otherFullWithin"] = 3] = "otherFullWithin";
    OverlapMode[OverlapMode["otherOverlapsRight"] = 4] = "otherOverlapsRight";
    OverlapMode[OverlapMode["otherOverlapsLeft"] = 5] = "otherOverlapsLeft";
})(OverlapMode || (exports.OverlapMode = OverlapMode = {}));
var DateRange = /** @class */ (function () {
    function DateRange(from, to, fromLabels, toLabels) {
        if (fromLabels === void 0) { fromLabels = []; }
        if (toLabels === void 0) { toLabels = []; }
        this.from = from;
        this.to = to;
        this.fromLabels = fromLabels;
        this.toLabels = toLabels;
        /** quantity is used for resources with multiple instances (multi-cabine) */
        this.qty = 1;
        if (to < from) {
            throw new Error("DateRange: Date to is smaller than date from!\n      From: ".concat(from, "\n      To: ").concat(to));
        }
        /*         if (fromLabel)
                    this.fromLabels.push(fromLabel)
        
                if (toLabel)
                    this.toLabels.push(toLabel) */
    }
    /**
     * @param from ISO Date string
     * @param to ISO Date string
     */
    DateRange.fromStrings = function (from, to) {
        return this.fromDates(new Date(from), new Date(to));
    };
    DateRange.fromDates = function (from, to) {
        return new DateRange(from, to);
    };
    DateRange.fromDateRange = function (dateRange) {
        return dateRange.clone();
    };
    DateRange.fromNumbers = function (from, to) {
        var fromDate = ts_common_1.DateHelper.parse(from);
        var toDate = ts_common_1.DateHelper.parse(to);
        return new DateRange(fromDate, toDate);
    };
    DateRange.prototype.toString = function (format) {
        if (format === void 0) { format = 'HH:mm'; }
        return "[".concat(dateFns.format(this.from, format), "-").concat(dateFns.format(this.to, format), "]");
    };
    Object.defineProperty(DateRange.prototype, "duration", {
        get: function () {
            var dif = dateFns.differenceInSeconds(this.to, this.from);
            return new time_span_1.TimeSpan(dif);
        },
        enumerable: false,
        configurable: true
    });
    DateRange.prototype.seconds = function () {
        return this.duration.seconds;
    };
    // existingPrepBlockEqualOrLonger
    DateRange.prototype.isEqualOrLongerThen = function (other) {
        return (this.seconds() >= other.seconds());
    };
    /*     fromStartOfDay() {
            return dateFns.startOfDay(this.from)
        }
    
        fromStartOfDay() {
            return dateFns.startOfDay(this.from)
        } */
    DateRange.prototype.clone = function () {
        var _a, _b;
        var clone = new DateRange(new Date(this.from), new Date(this.to));
        (_a = clone.fromLabels).push.apply(_a, this.fromLabels);
        (_b = clone.toLabels).push.apply(_b, this.toLabels);
        return clone;
    };
    DateRange.prototype.invert = function () {
        var inverted = new date_range_set_1.DateRangeSet();
        inverted.addRange(new DateRange(ts_common_1.DateHelper.minDate, this.from));
        inverted.addRange(new DateRange(this.to, ts_common_1.DateHelper.maxDate));
        return inverted;
    };
    DateRange.prototype.fromToNum = function () {
        return ts_common_1.DateHelper.yyyyMMddhhmmss(this.from);
    };
    DateRange.prototype.toToNum = function () {
        return ts_common_1.DateHelper.yyyyMMddhhmmss(this.to);
    };
    DateRange.prototype.increaseToWithSeconds = function (seconds) {
        this.to = dateFns.addSeconds(this.to, seconds);
    };
    DateRange.prototype.getBorders = function () {
        var dateBorders = [];
        dateBorders.push(new date_border_1.DateBorder(this.from, true));
        dateBorders.push(new date_border_1.DateBorder(this.to, true));
        return dateBorders;
    };
    DateRange.prototype.containsLabels = function (fromLabel, toLabel) {
        var fromOk = fromLabel ? this.fromLabels.indexOf(fromLabel) >= 0 : true;
        var toOk = toLabel ? this.toLabels.indexOf(toLabel) >= 0 : true;
        return fromOk && toOk;
    };
    DateRange.prototype.containsToLabel = function (toLabel) {
        var toOk = toLabel ? this.toLabels.indexOf(toLabel) >= 0 : true;
        return toOk;
    };
    DateRange.prototype.containsFromLabel = function (fromLabel) {
        var fromOk = fromLabel ? this.fromLabels.indexOf(fromLabel) >= 0 : true;
        return fromOk;
    };
    /**
     * Returns array of days dates in the range
     */
    DateRange.prototype.takeDays = function () {
        var _this = this;
        return this.takeDates(function () { return dateFns.differenceInDays(_this.to, _this.from); }, function (i) { return dateFns.addDays(_this.from, i); });
    };
    /*
    intersectsWith(range: DateRange) {
        const ourFromTime = this.from.getTime();
        const ourToTime = this.to.getTime();
        const theirFromTime = range.from.getTime();
        const theirToTime = range.to.getTime();

        return (
            (ourFromTime <= theirFromTime && ourToTime >= theirFromTime) ||
            (ourFromTime >= theirFromTime && ourFromTime <= theirToTime)
        );
    }
    */
    DateRange.prototype.intersectsWith = function (range) {
        var ourFromTime = this.from.getTime();
        var ourToTime = this.to.getTime();
        var theirFromTime = range.from.getTime();
        var theirToTime = range.to.getTime();
        var notIntersect = theirToTime <= ourFromTime || theirFromTime >= ourToTime;
        return !notIntersect;
    };
    DateRange.prototype.takeDates = function (countExtractor, dateTaker) {
        var count = countExtractor();
        var dates = new Array(count + 1);
        for (var i = 0; i <= count; i++) {
            dates[i] = dateTaker(i);
        }
        return dates;
    };
    DateRange.prototype.isInsideOf = function (other) {
        return (this.from >= other.from && this.to <= other.to);
    };
    DateRange.prototype.contains = function (other) {
        return (this.from <= other.from && this.to >= other.to);
    };
    DateRange.prototype.containsSet = function (dateRanges) {
        if (dateRanges.isEmpty())
            return true;
        for (var _i = 0, _a = dateRanges.ranges; _i < _a.length; _i++) {
            var range = _a[_i];
            if (!this.contains(range))
                return false;
        }
        return true;
    };
    /**
     * How this date range overlaps a secondary date range
     * @param other
     * @returns
     */
    DateRange.prototype.overlapWith = function (other) {
        var overlapMode = OverlapMode.noOverlap;
        if (other.to <= this.from || other.from >= this.to)
            return OverlapMode.noOverlap;
        if (this.from.getTime() === other.from.getTime() && this.to.getTime() === other.to.getTime())
            return OverlapMode.exact;
        if (this.from < other.from && this.to > other.to)
            return OverlapMode.otherFullWithin;
        if (this.from > other.from && this.to < other.to)
            return OverlapMode.otherOverlapsFull;
        if (other.from <= this.from && other.to > this.from && other.to < this.to)
            return OverlapMode.otherOverlapsLeft;
        if (other.to >= this.to && other.from > this.from && other.from < this.to)
            return OverlapMode.otherOverlapsRight;
        throw new Error('overlapWith unforseen situation?');
    };
    DateRange.prototype.subtractSet = function (set) {
        var result = new date_range_set_1.DateRangeSet([this.clone()]);
        if (set.isEmpty())
            return result;
        result = result.subtract(set);
        return result;
    };
    DateRange.prototype.subtract = function (other) {
        return DateRange.subtract(this, other);
    };
    DateRange.subtract = function (source, other) {
        var overlapMode = source.overlapWith(other);
        var ranges = [];
        switch (overlapMode) {
            case OverlapMode.noOverlap: // nothing to subtract
                ranges = [source.clone()];
                break;
            case OverlapMode.otherOverlapsFull: // this range is full within the other range => nothing remains
            case OverlapMode.exact:
                ranges = [];
                break;
            case OverlapMode.otherFullWithin: // full overlap => the other range is within ours => this range will be cut into 2 pieces
                var left = new DateRange(source.from, other.from, source.fromLabels, other.fromLabels);
                var right = new DateRange(other.to, source.to, other.toLabels, source.toLabels);
                ranges = [left, right];
                break;
            case OverlapMode.otherOverlapsLeft: // this range overlaps the other at the end (of this range)
                var newRight = new DateRange(other.to, source.to, other.toLabels, source.toLabels);
                ranges = [newRight];
                break;
            case OverlapMode.otherOverlapsRight: // this range overlaps the other at the start (of this range)
                var newLeft = new DateRange(source.from, other.from, source.fromLabels, other.fromLabels);
                ranges = [newLeft];
                break;
        }
        return ranges;
    };
    DateRange.prototype.getDatesEvery = function (time) {
        if (time === void 0) { time = time_span_1.TimeSpan.minutes(15); }
        var dates = [];
        for (var date = this.from; date < this.to; date = time.addToDate(date)) {
            dates.push(date);
        }
        return dates;
    };
    return DateRange;
}());
exports.DateRange = DateRange;
