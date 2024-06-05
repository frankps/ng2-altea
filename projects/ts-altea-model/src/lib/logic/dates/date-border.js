"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DateBorderSet = exports.DateBorderOverview = exports.DateBorderInfo = exports.DateBorder = void 0;
var _ = require("lodash");
/**
 * DateBorders are used to quickly find overlaps in DateRanges (DateRange).
 * A DateBorder typically represents DateRange.from or DateRange.to
 */
var DateBorder = /** @class */ (function () {
    function DateBorder(date, isStart) {
        this.date = date;
        this.isStart = isStart;
        this.resourceId = "";
    }
    return DateBorder;
}());
exports.DateBorder = DateBorder;
var DateBorderInfo = /** @class */ (function () {
    function DateBorderInfo(date, totalOpen, opened, closed) {
        if (totalOpen === void 0) { totalOpen = 1; }
        if (opened === void 0) { opened = 0; }
        if (closed === void 0) { closed = 0; }
        this.date = date;
        this.totalOpen = totalOpen;
        this.opened = opened;
        this.closed = closed;
    }
    return DateBorderInfo;
}());
exports.DateBorderInfo = DateBorderInfo;
var DateBorderOverview = /** @class */ (function () {
    function DateBorderOverview() {
        this.borders = [];
    }
    DateBorderOverview.prototype.add = function (borderInfo) {
        this.borders.push(borderInfo);
    };
    return DateBorderOverview;
}());
exports.DateBorderOverview = DateBorderOverview;
var DateBorderSet = /** @class */ (function () {
    function DateBorderSet() {
        var borders = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            borders[_i] = arguments[_i];
        }
        this.borders = [];
        this.borders = borders;
    }
    DateBorderSet.prototype.getBorderOverview = function () {
        var overview = new DateBorderOverview();
        if (!Array.isArray(this.borders))
            return overview;
        var totalOpen = 0;
        var borderOrdered = _.sortBy(this.borders, ['date', 'isStart']);
        var borderInfo = null;
        for (var _i = 0, borderOrdered_1 = borderOrdered; _i < borderOrdered_1.length; _i++) {
            var border = borderOrdered_1[_i];
            border.isStart ? totalOpen++ : totalOpen--;
            if (borderInfo != null && borderInfo.date == border.date) {
                borderInfo.totalOpen = totalOpen;
            }
            else {
                borderInfo = new DateBorderInfo(border.date, totalOpen);
            }
            if (border.isStart)
                borderInfo.opened++;
            else
                borderInfo.closed++;
            overview.add(borderInfo);
        }
        return overview;
        // this.borders.
    };
    return DateBorderSet;
}());
exports.DateBorderSet = DateBorderSet;
