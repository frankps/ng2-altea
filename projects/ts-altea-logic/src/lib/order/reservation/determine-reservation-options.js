"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DetermineReservationOptions = void 0;
var ts_altea_model_1 = require("ts-altea-model");
var _ = require("lodash");
var DetermineReservationOptions = /** @class */ (function () {
    function DetermineReservationOptions() {
    }
    Object.defineProperty(DetermineReservationOptions, "I", {
        /** Returns instance of this class */
        get: function () {
            return DetermineReservationOptions._I;
        },
        enumerable: false,
        configurable: true
    });
    DetermineReservationOptions.prototype.getAllReservationOptions = function (solutionSet) {
        var result = new ts_altea_model_1.ReservationOptionSet([], solutionSet);
        for (var _i = 0, _a = solutionSet.validSolutions; _i < _a.length; _i++) {
            var solution = _a[_i];
            if (solution.isEmpty())
                continue;
            if (solution.valid) {
                var reservationOptions = this.getReservationOptionsForSolution(solution);
                result.addSet(reservationOptions);
            }
        }
        var uniqResult = this.removeDuplicates(result);
        return uniqResult;
    };
    DetermineReservationOptions.prototype.getReservationOptionsForSolution = function (solution) {
        if (!solution || solution.isEmpty() || !solution.valid)
            return ts_altea_model_1.ReservationOptionSet.empty;
        var refItem = solution.items[0];
        var possibleStartDates = [];
        if (refItem.exactStart)
            possibleStartDates.push(solution.offsetRefDate);
        else
            possibleStartDates = refItem.dateRange.getDatesEvery(ts_altea_model_1.TimeSpan.minutes(15));
        //possibleStartDates = _.sortedUniq(possibleStartDates)   //_.orderBy(possibleStartDates)
        return ts_altea_model_1.ReservationOptionSet.fromDates(possibleStartDates, solution.id);
    };
    DetermineReservationOptions.prototype.removeDuplicates = function (optionSet) {
        /* to do: give a higher score if there are multiple options for a certain date
         also link back to the solution? => we can create the resourcePlannings much easier !
        */
        var uniqOptions = _.uniqBy(optionSet.options, 'dateNum');
        uniqOptions = _.orderBy(uniqOptions, 'dateNum');
        return new ts_altea_model_1.ReservationOptionSet(uniqOptions);
    };
    DetermineReservationOptions._I = new DetermineReservationOptions();
    return DetermineReservationOptions;
}());
exports.DetermineReservationOptions = DetermineReservationOptions;
