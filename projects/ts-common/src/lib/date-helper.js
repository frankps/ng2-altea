"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DateConverter = exports.DateObject = exports.DateHelper = void 0;
var dateFns = require("date-fns");
var DateHelper = /** @class */ (function () {
    function DateHelper() {
    }
    Object.defineProperty(DateHelper, "minDate", {
        get: function () {
            return new Date(2000, 0, 1);
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(DateHelper, "maxDate", {
        get: function () {
            return new Date(2100, 0, 1);
        },
        enumerable: false,
        configurable: true
    });
    DateHelper.isDate = function (input) {
        return input instanceof Date;
    };
    DateHelper.getUtcDate = function (date) {
        if (date === void 0) { date = new Date(); }
        var utcDate = new Date(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate(), date.getUTCHours(), date.getUTCMinutes());
        return utcDate;
    };
    DateHelper.getYearMonths = function (from, to) {
        var yearMonths = [];
        var startOfMonth = dateFns.startOfMonth(from);
        for (var date = startOfMonth; date <= to; date = dateFns.addMonths(date, 1)) {
            var yearMonth = DateHelper.yyyyMM(date);
            yearMonths.push(yearMonth);
        }
        return yearMonths;
    };
    DateHelper.getDayName = function (day) {
        switch (day) {
            case 0: return 'Su';
            case 1: return 'Mo';
            case 2: return 'Tu';
            case 3: return 'We';
            case 4: return 'Th';
            case 5: return 'Fr';
            case 6: return 'Sa';
        }
        return '??';
    };
    DateHelper.getDayOfWeekNames = function (days) {
        if (!days || days.length == 0)
            return [];
        var res = [];
        days.forEach(function (day) {
            res.push(DateHelper.getDayName(day));
        });
        return res;
    };
    /** return a number with components:
     *   yyyy: the last 2 digits of the current year
     *   MM: the month
     *   dd: the day
     *   hh: hour
     *   mm: minutes
     *   ss
     */
    DateHelper.yyyyMMddhhmmssiii = function (date) {
        if (date === void 0) { date = new Date(); }
        if (!date)
            throw "Input is null or undefined";
        var year = dateFns.getYear(date);
        var month = ("0" + (dateFns.getMonth(date) + 1)).slice(-2);
        var day = ("0" + (dateFns.getDate(date))).slice(-2);
        var hour = ("0" + (dateFns.getHours(date))).slice(-2);
        var min = ("0" + (dateFns.getMinutes(date))).slice(-2);
        var sec = ("0" + (dateFns.getSeconds(date))).slice(-2);
        var milli = ("00" + (dateFns.getMilliseconds(date))).slice(-3);
        var res = "".concat(year).concat(month).concat(day).concat(hour).concat(min).concat(sec).concat(milli);
        return Number(res);
    };
    DateHelper.yyyyMMddhhmmss = function (date) {
        if (date === void 0) { date = new Date(); }
        if (!date)
            throw "Input is null or undefined";
        var year = dateFns.getYear(date);
        var month = ("0" + (dateFns.getMonth(date) + 1)).slice(-2);
        var day = ("0" + (dateFns.getDate(date))).slice(-2);
        var hour = ("0" + (dateFns.getHours(date))).slice(-2);
        var min = ("0" + (dateFns.getMinutes(date))).slice(-2);
        var sec = ("0" + (dateFns.getSeconds(date))).slice(-2);
        //  const milli = ("00" + (dateFns.getMilliseconds(date))).slice(-3)
        var res = "".concat(year).concat(month).concat(day).concat(hour).concat(min).concat(sec);
        return Number(res);
    };
    DateHelper.yyyyMMdd000000 = function (date) {
        if (date === void 0) { date = new Date(); }
        if (!date)
            throw "Input is null or undefined";
        var year = dateFns.getYear(date);
        var month = ("0" + (dateFns.getMonth(date) + 1)).slice(-2);
        var day = ("0" + (dateFns.getDate(date))).slice(-2);
        //  const milli = ("00" + (dateFns.getMilliseconds(date))).slice(-3)
        var res = "".concat(year).concat(month).concat(day, "000000");
        return Number(res);
    };
    DateHelper.yyyyMMddhhmm = function (date) {
        if (date === void 0) { date = new Date(); }
        if (!date)
            throw "Input is null or undefined";
        var year = dateFns.getYear(date);
        var month = ("0" + (dateFns.getMonth(date) + 1)).slice(-2);
        var day = ("0" + (dateFns.getDate(date))).slice(-2);
        var hour = ("0" + (dateFns.getHours(date))).slice(-2);
        var min = ("0" + (dateFns.getMinutes(date))).slice(-2);
        var res = "".concat(year).concat(month).concat(day).concat(hour).concat(min);
        return Number(res);
    };
    DateHelper.yyyyMMdd = function (date) {
        if (date === void 0) { date = new Date(); }
        if (!date)
            throw "Input is null or undefined";
        var year = dateFns.getYear(date);
        var month = ("0" + (dateFns.getMonth(date) + 1)).slice(-2);
        var day = ("0" + (dateFns.getDate(date))).slice(-2);
        var res = "".concat(year).concat(month).concat(day);
        return Number(res);
    };
    DateHelper.yyyyMM = function (date) {
        if (date === void 0) { date = new Date(); }
        if (!date)
            throw "Input is null or undefined";
        var year = dateFns.getYear(date);
        var month = ("0" + (dateFns.getMonth(date) + 1)).slice(-2);
        var res = "".concat(year).concat(month);
        return Number(res);
    };
    DateHelper.yyyyWW = function (date) {
        if (date === void 0) { date = new Date(); }
        if (!date)
            throw "Input is null or undefined";
        var year = dateFns.getYear(date);
        var week = ("0" + dateFns.getWeek(date)).slice(-2);
        var res = "".concat(year).concat(week);
        return Number(res);
    };
    /*
      wk.weekOfYear = dateFns.getWeek(weekDate)
      wk.month = dateFns.getMonth(weekDate) + 1
      wk.year = dateFns.getYear(weekDate)

      wk.id = wk.year * 100 + wk.weekOfYear
     */
    /** convert string or number in formats yyyyMMdd,yyyyMMddHHmm, yyyyMMddHHmmss to a date */
    DateHelper.parse = function (input) {
        if (!input)
            return undefined; //throw `Input is null or undefined`
        var stringDate = input;
        if (Number.isInteger(input))
            stringDate = "" + input;
        var date = null;
        switch (stringDate.length) {
            case 8:
                date = dateFns.parse(stringDate, 'yyyyMMdd', new Date());
                break;
            case 12:
                date = dateFns.parse(stringDate, 'yyyyMMddHHmm', new Date());
                break;
            case 14:
                date = dateFns.parse(stringDate, 'yyyyMMddHHmmss', new Date());
                break;
        }
        if (!date)
            throw "Could not parse date ".concat(input);
        return date;
    };
    DateHelper.yearWeek = function (date, startOfWeek) {
        if (startOfWeek === void 0) { startOfWeek = 0; }
        var weekOfYear = dateFns.getWeek(date, { weekStartsOn: startOfWeek });
        var year = dateFns.getYear(date);
        return year * 100 + weekOfYear;
        /*
            wk.weekOfYear = dateFns.getWeek(weekDate)
            wk.month = dateFns.getMonth(weekDate) + 1
            wk.year = dateFns.getYear(weekDate)
        */
    };
    /**
 * converts a date in number format 202106121030 (12 digits) into string format 2021-06-12T10:30
 * @param yyyyMMddHHmm
 * @param suffix
 * @returns
 */
    DateHelper.toDateTimeString = function (yyyyMMddHHmm, suffix) {
        if (suffix === void 0) { suffix = 'Z'; }
        if (!yyyyMMddHHmm)
            throw "Input is null or undefined";
        var str = '' + yyyyMMddHHmm;
        if (str.length != 12) {
            var msg = "Only possible for date strings with 12 digits ".concat(yyyyMMddHHmm);
            throw msg;
        }
        var year = str.slice(0, 4);
        var month = str.slice(4, 6);
        var day = str.slice(6, 8);
        var hour = str.slice(8, 10);
        var minute = str.slice(10, 12);
        var result = "".concat(year, "-").concat(month, "-").concat(day, "T").concat(hour, ":").concat(minute).concat(suffix);
        return result;
    };
    /** Format needed for Facebook interface */
    DateHelper.unixTimestampSeconds = function (yyyyMMddHHmm, suffix) {
        if (suffix === void 0) { suffix = 'Z'; }
        var utcString = DateHelper.toDateTimeString(yyyyMMddHHmm);
        var unixSeconds = Date.parse(utcString) / 1000;
        return unixSeconds;
    };
    DateHelper.dummy = 5;
    return DateHelper;
}());
exports.DateHelper = DateHelper;
var DateObject = /** @class */ (function () {
    function DateObject() {
        this.year = 0;
        this.month = 0;
        this.day = 0;
    }
    DateObject.now = function () {
        var date = new Date();
        var now = new DateObject();
        now.setDate(date);
        return now;
    };
    Object.defineProperty(DateObject, "zero", {
        get: function () {
            return new DateObject();
        },
        enumerable: false,
        configurable: true
    });
    DateObject.prototype.clone = function () {
        var clone = new DateObject();
        clone.year = this.year;
        clone.month = this.month;
        clone.day = this.day;
        return clone;
    };
    DateObject.prototype.setDate = function (date) {
        this.year = date.getFullYear();
        this.month = date.getMonth() + 1;
        this.day = date.getDate(); // getUTCDate()
    };
    DateObject.fromDate = function (date) {
        var dateObj = new DateObject();
        dateObj.setDate(date);
        return dateObj;
    };
    DateObject.fromObject = function (obj) {
        var dateObj = new DateObject();
        dateObj.year = obj.year;
        dateObj.month = obj.month;
        dateObj.day = obj.day;
        return dateObj;
    };
    DateObject.fromNumber = function (numDate) {
        if (!numDate)
            return DateObject.zero;
        var str = numDate.toString();
        if (str.length !== 8)
            return DateObject.zero;
        var objDate = DateObject.create(+str.substring(0, 4), +str.substring(4, 6), +str.substring(6, 8));
        return objDate;
    };
    DateObject.create = function (year, month, day) {
        var date = new DateObject();
        date.year = year;
        date.month = month;
        date.day = day;
        return date;
    };
    DateObject.prototype.toString = function () {
        return "".concat(this.day, "/").concat(this.month, "/").concat(this.year.toString().slice(-2));
    };
    DateObject.prototype.toIso = function () {
        return "".concat(this.year.toString(), "-").concat(("0" + this.month).slice(-2), "-").concat(("0" + this.day).slice(-2));
    };
    DateObject.prototype.toNumber = function () {
        var str = this.year.toString() + ("0" + this.month).slice(-2) + ("0" + this.day).slice(-2);
        return +str;
    };
    DateObject.prototype.toDate = function () {
        var date = new Date(this.year, this.month - 1, this.day);
        return date;
    };
    DateObject.prototype.addDays = function (amount) {
        var newDate = dateFns.addDays(this.toDate(), amount);
        this.setDate(newDate);
        return this;
    };
    DateObject.prototype.addMonths = function (amount) {
        var newDate = dateFns.addMonths(this.toDate(), amount);
        return DateObject.fromDate(newDate);
    };
    /**  option { weekStartsOn: 0 }    index of first day of the week (0 = Sunday)
    */
    DateObject.prototype.startOfWeek = function (options) {
        if (options === void 0) { options = null; }
        var newDate = dateFns.startOfWeek(this.toDate(), options);
        this.setDate(newDate);
        return this;
    };
    /**  option { weekStartsOn: 0 }    index of first day of the week (0 = Sunday)
    */
    DateObject.prototype.endOfWeek = function (options) {
        if (options === void 0) { options = null; }
        var newDate = dateFns.endOfWeek(this.toDate(), options);
        this.setDate(newDate);
        return this;
    };
    return DateObject;
}());
exports.DateObject = DateObject;
var DateConverter = /** @class */ (function () {
    function DateConverter() {
    }
    DateConverter.intToObject = function (intDate) {
        return DateObject.fromNumber(intDate);
    };
    DateConverter.objectToInt = function (obj) {
        var objDate = DateObject.fromObject(obj);
        return objDate.toNumber();
    };
    return DateConverter;
}());
exports.DateConverter = DateConverter;
