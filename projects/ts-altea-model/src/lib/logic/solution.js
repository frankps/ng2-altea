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
var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SolutionSet = exports.Solution = exports.SolutionItem = exports.SolutionNote = exports.SolutionNoteLevel = void 0;
var dates_1 = require("./dates");
var ts_common_1 = require("ts-common");
var SolutionNoteLevel;
(function (SolutionNoteLevel) {
    SolutionNoteLevel[SolutionNoteLevel["info"] = 0] = "info";
    SolutionNoteLevel[SolutionNoteLevel["blocking"] = 1] = "blocking";
})(SolutionNoteLevel || (exports.SolutionNoteLevel = SolutionNoteLevel = {}));
var SolutionNote = /** @class */ (function () {
    function SolutionNote(content, level) {
        if (level === void 0) { level = SolutionNoteLevel.info; }
        this.content = content;
        this.level = level;
    }
    return SolutionNote;
}());
exports.SolutionNote = SolutionNote;
/**
 * A solution item is a possible solution for a resource request item (request) => the requested resource is available during the date range
 * This can be an exact slot (if exactStart = true), or this can be a bigger (floating) slot during wich the resource is available.
 */
var SolutionItem = /** @class */ (function () {
    function SolutionItem(request, dateRange, exactStart) {
        if (exactStart === void 0) { exactStart = false; }
        var resources = [];
        for (var _i = 3; _i < arguments.length; _i++) {
            resources[_i - 3] = arguments[_i];
        }
        this.request = request;
        this.dateRange = dateRange;
        this.exactStart = exactStart;
        this.resources = [];
        this.valid = true;
        this.notes = [];
        if (Array.isArray(resources))
            this.resources = resources;
    }
    SolutionItem.prototype.clone = function () {
        var item = new (SolutionItem.bind.apply(SolutionItem, __spreadArray([void 0, this.request, this.dateRange.clone(), this.exactStart], this.resources, false)))();
        item.notes = this.notes;
        return item;
    };
    SolutionItem.prototype.addNote = function (content, level) {
        if (level === void 0) { level = SolutionNoteLevel.info; }
        var note = new SolutionNote(content, level);
        this.notes.push(note);
    };
    SolutionItem.prototype.addNotes = function (notes) {
        var _a;
        if (Array.isArray(notes) && notes.length > 0)
            (_a = this.notes).push.apply(_a, notes);
    };
    return SolutionItem;
}());
exports.SolutionItem = SolutionItem;
/** Short for reservation solution. */
var Solution = /** @class */ (function (_super) {
    __extends(Solution, _super);
    function Solution() {
        var _a;
        var items = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            items[_i] = arguments[_i];
        }
        var _this = _super.call(this) || this;
        _this.items = [];
        _this.valid = true;
        _this.notes = [];
        (_a = _this.items).push.apply(_a, items);
        return _this;
    }
    Solution.prototype.add = function (item) {
        if (!Array.isArray(this.items))
            this.items = [];
        this.items.push(item);
    };
    Solution.prototype.addNote = function (content, level) {
        if (level === void 0) { level = SolutionNoteLevel.info; }
        var note = new SolutionNote(content, level);
        this.notes.push(note);
    };
    Solution.prototype.addNotes = function (notes) {
        var _a;
        if (Array.isArray(notes) && notes.length > 0)
            (_a = this.notes).push.apply(_a, notes);
    };
    /** most likely the reference date is the start date of this solution, but there can be exceptions */
    Solution.prototype.referenceDate = function () {
        if (!Array.isArray(this.items) || this.items.length == 0)
            return undefined;
        return this.items[0].dateRange.from;
    };
    Solution.prototype.isEmpty = function () {
        return (!Array.isArray(this.items) || this.items.length == 0);
    };
    Solution.prototype.hasItems = function () {
        return (Array.isArray(this.items) && this.items.length > 0);
    };
    Solution.prototype.hasExactStart = function () {
        if (this.isEmpty())
            return false;
        return this.items[0].exactStart;
    };
    Solution.prototype.clone = function () {
        //    return ObjectHelper.clone(this, Solution) as Solution
        var clone = new (Solution.bind.apply(Solution, __spreadArray([void 0], this.items.map(function (item) { return item.clone(); }), false)))();
        clone.valid = this.valid;
        clone.notes = this.notes;
        clone.offsetRefDate = this.offsetRefDate;
        return clone;
    };
    /**
     * some solution items can have floating intervals (exactStart=false, then the service can start at any time within the interval)
     */
    Solution.prototype.toExactSolutions = function () {
        if (this.isEmpty())
            return [this];
        if (this.hasExactStart())
            return [this];
        var firstItem = this.items[0];
        var startDates = firstItem.dateRange.getDatesEvery(dates_1.TimeSpan.minutes(15));
        var exactSolutions = [];
        for (var _i = 0, startDates_1 = startDates; _i < startDates_1.length; _i++) {
            var startDate = startDates_1[_i];
            var newSolution = this.clone();
            var newFirstItem = newSolution.items[0];
            newFirstItem.dateRange.from = startDate;
            exactSolutions.push(newSolution);
        }
        /**
         
    findContinuousSlots(dateRange: DateRange, slots: SlotInfo[]) {

        const startDates = dateRange.getDatesEvery(TimeSpan.minutes(15))

        slots.push(...startDates.map(date => SlotInfo.fromDate(date)))

    }



        */
        // so we have a floating start => we split the given interval
        return exactSolutions;
    };
    return Solution;
}(ts_common_1.ObjectWithId));
exports.Solution = Solution;
var SolutionSet = /** @class */ (function () {
    function SolutionSet() {
        var _a;
        var solutions = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            solutions[_i] = arguments[_i];
        }
        this.solutions = [];
        (_a = this.solutions).push.apply(_a, solutions);
    }
    Object.defineProperty(SolutionSet, "empty", {
        get: function () {
            return new SolutionSet();
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(SolutionSet.prototype, "validSolutions", {
        get: function () {
            return this.solutions.filter(function (s) { return !s.isEmpty() && s.valid; });
        },
        enumerable: false,
        configurable: true
    });
    SolutionSet.prototype.add = function () {
        var _a;
        var solutions = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            solutions[_i] = arguments[_i];
        }
        if (!Array.isArray(this.solutions))
            this.solutions = [];
        (_a = this.solutions).push.apply(_a, solutions);
    };
    SolutionSet.prototype.getSolutionById = function (solutionId) {
        return this.solutions.find(function (s) { return s.id == solutionId; });
    };
    SolutionSet.prototype.isEmpty = function () {
        return (!Array.isArray(this.solutions) || this.solutions.length == 0);
    };
    SolutionSet.prototype.toExactSolutions = function () {
        if (this.isEmpty())
            return this;
        var exactSolutions = this.solutions.flatMap(function (s) { return s.toExactSolutions(); });
        return new (SolutionSet.bind.apply(SolutionSet, __spreadArray([void 0], exactSolutions, false)))();
    };
    return SolutionSet;
}());
exports.SolutionSet = SolutionSet;
