"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SolutionPicker = void 0;
var ts_altea_model_1 = require("ts-altea-model");
var SolutionPicker = /** @class */ (function () {
    function SolutionPicker() {
    }
    Object.defineProperty(SolutionPicker, "I", {
        /** Returns instance of this class */
        get: function () {
            return SolutionPicker._I;
        },
        enumerable: false,
        configurable: true
    });
    SolutionPicker.prototype.pickAllBestSolutions = function (solutionSet, trackInvalidSolutions) {
        if (trackInvalidSolutions === void 0) { trackInvalidSolutions = false; }
        var result = new ts_altea_model_1.SolutionSet();
        for (var _i = 0, _a = solutionSet.solutions; _i < _a.length; _i++) {
            var solution = _a[_i];
            if (solution.isEmpty())
                continue;
            if (solution.valid) {
                var bestSolutions = this.pickBestSolutions(solution);
                result.add.apply(result, bestSolutions);
            }
            else {
                // an invalid solution: a solution becomes invalid when a certain resource request can not be fullfilled
                if (trackInvalidSolutions)
                    result.add(solution);
            }
        }
        return result;
    };
    SolutionPicker.prototype.pickBestSolutions = function (solution) {
        var resultSolutions = [];
        resultSolutions.push(solution);
        return resultSolutions;
    };
    SolutionPicker._I = new SolutionPicker();
    return SolutionPicker;
}());
exports.SolutionPicker = SolutionPicker;
