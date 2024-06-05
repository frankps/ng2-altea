"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TimeHelper = void 0;
var TimeHelper = /** @class */ (function () {
    function TimeHelper() {
    }
    TimeHelper.hhmmUTC = function (date) {
        if (date === void 0) { date = new Date(); }
        if (date == null)
            throw "Input is null or undefined";
        var hour = ("0" + (date.getUTCHours())).slice(-2);
        var min = ("0" + (date.getUTCMinutes())).slice(-2);
        // const hour = ("0" + (dateFns.getHours(date))).slice(-2)
        // const min = ("0" + (dateFns.getMinutes(date))).slice(-2)
        var res = "".concat(hour, ":").concat(min);
        return res;
    };
    TimeHelper.hhmmUTCToDate = function (hh_mm, date) {
        if (date === void 0) { date = new Date(); }
        var items = hh_mm.split(':');
        var hours = items[0];
        var mins = items[1];
        date.setUTCHours(+hours);
        date.setUTCMinutes(+mins);
        var res = new Date(date); // otherwise UI does not update
        return res;
    };
    return TimeHelper;
}());
exports.TimeHelper = TimeHelper;
