"use strict";
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
exports.DateRangeSet = exports.DateRangeSets = exports.ResourceAvailabilitySets = exports.ResourceOccupationSets = void 0;
var date_range_1 = require("./date-range");
var _ = require("lodash");
var dateFns = require("date-fns");
var solution_1 = require("../solution");
var ts_common_1 = require("ts-common");
/**
 * This class focuses on pure DB data for a resource (coming from ResourcePlanning)
 * available = extra availabilities (outside schedule),
 * unAvailable = existing plannings from ResourcePlanning
 * overlapAllowed = existing preparation blocks from ResourcePlanning, where overlap is allowed
 */
var ResourceOccupationSets = /** @class */ (function () {
    function ResourceOccupationSets(available, unAvailable, overlapAllowed) {
        if (available === void 0) { available = DateRangeSet.empty; }
        if (unAvailable === void 0) { unAvailable = DateRangeSet.empty; }
        if (overlapAllowed === void 0) { overlapAllowed = DateRangeSet.empty; }
        this.available = available;
        this.unAvailable = unAvailable;
        this.overlapAllowed = overlapAllowed;
    }
    return ResourceOccupationSets;
}());
exports.ResourceOccupationSets = ResourceOccupationSets;
/**
 *  This class focuses on what is available for a resource: available = schedule - occupation
 */
var ResourceAvailabilitySets = /** @class */ (function () {
    function ResourceAvailabilitySets(available, overlapAllowed) {
        if (available === void 0) { available = DateRangeSet.empty; }
        if (overlapAllowed === void 0) { overlapAllowed = DateRangeSet.empty; }
        this.available = available;
        this.overlapAllowed = overlapAllowed;
    }
    return ResourceAvailabilitySets;
}());
exports.ResourceAvailabilitySets = ResourceAvailabilitySets;
var DateRangeSets = /** @class */ (function () {
    function DateRangeSets(sets) {
        if (sets === void 0) { sets = []; }
        this.sets = sets;
    }
    Object.defineProperty(DateRangeSets, "empty", {
        get: function () {
            return new DateRangeSets();
        },
        enumerable: false,
        configurable: true
    });
    DateRangeSets.prototype.isEmpty = function () {
        return (!Array.isArray(this.sets) || this.sets.length == 0);
    };
    DateRangeSets.prototype.addSet = function (set) {
        this.sets.push(set);
    };
    return DateRangeSets;
}());
exports.DateRangeSets = DateRangeSets;
/** A set contains multiple date ranges */
var DateRangeSet = /** @class */ (function () {
    /** optional: provide resourceId if date ranges are linked to specific resources */
    //resourceId?: string
    function DateRangeSet(ranges, resource) {
        if (ranges === void 0) { ranges = []; }
        this.ranges = ranges;
        this.resource = resource;
    }
    Object.defineProperty(DateRangeSet, "empty", {
        get: function () {
            return new DateRangeSet();
        },
        enumerable: false,
        configurable: true
    });
    DateRangeSet.prototype.isEmpty = function () {
        return (!Array.isArray(this.ranges) || this.ranges.length == 0);
    };
    DateRangeSet.prototype.clone = function () {
        if (this.isEmpty())
            return new DateRangeSet();
        var clones = this.ranges.map(function (r) { return r.clone(); });
        return new DateRangeSet(clones);
    };
    DateRangeSet.prototype.addRange = function (range) {
        this.ranges.push(range);
    };
    DateRangeSet.prototype.addRangeByDates = function (from, to, fromLabel, toLabel) {
        var range = new date_range_1.DateRange(from, to, [fromLabel], [toLabel]);
        this.addRange(range);
    };
    /** check if this.ranges contains at least 1 range that contains  */
    DateRangeSet.prototype.contains = function (range) {
        var idx = this.ranges.findIndex(function (r) { return range.from >= r.from && range.to <= r.to; }); //range.to > r.from && range.from < r.to
        return (idx >= 0);
    };
    DateRangeSet.prototype.fromDays = function () {
        var dates = this.ranges.map(function (r) { return new Date(r.from.getFullYear(), r.from.getMonth(), r.from.getDate()); });
        // console.error(dates)
        dates = _.uniq(dates);
        //  console.error(dates)
        return dates;
    };
    DateRangeSet.prototype.getRangesForDay = function (start) {
        var end = dateFns.addDays(start, 1);
        var ranges = this.ranges.filter(function (r) { return r.from >= start && r.from < end; });
        return ranges;
    };
    DateRangeSet.prototype.getDateBorders = function () {
        var dateBorders = [];
        if (!Array.isArray(dateBorders))
            return dateBorders;
        for (var _i = 0, _a = this.ranges; _i < _a.length; _i++) {
            var range = _a[_i];
            dateBorders.push.apply(dateBorders, range.getBorders());
        }
        return dateBorders;
    };
    DateRangeSet.prototype.getRangeWhereToEquals = function (to) {
        var match = this.ranges.find(function (r) { return dateFns.isEqual(r.to, to); });
        return match;
    };
    DateRangeSet.prototype.getRangeWhereFromEquals = function (from) {
        var match = this.ranges.find(function (r) { return dateFns.isEqual(r.from, from); });
        return match;
    };
    DateRangeSet.prototype.clip = function (insideRange) {
        if (this.isEmpty())
            return DateRangeSet.empty;
        var outsideRanges = insideRange.invert();
        //const result = new DateRangeSet()
        return this.subtract(outsideRanges);
    };
    DateRangeSet.prototype.minimum = function (minTime) {
        var minRanges = this.ranges.filter(function (r) { return r.duration.seconds >= minTime.seconds; });
        if (!Array.isArray(minRanges) || minRanges.length == 0)
            return DateRangeSet.empty;
        return new DateRangeSet(minRanges.map(function (r) { return r.clone(); }), this.resource);
    };
    DateRangeSet.prototype.add = function (set) {
        var allRanges = [];
        if (Array.isArray(this.ranges))
            allRanges.push.apply(allRanges, this.ranges);
        if (Array.isArray(set.ranges))
            allRanges.push.apply(allRanges, set.ranges);
        if (allRanges.length == 0)
            return DateRangeSet.empty;
        allRanges = _.orderBy(allRanges, ['from', 'to']);
        return new DateRangeSet(allRanges);
    };
    /** used for multi-instance resources (resource.qty > 1), then we know how many resources are free/occupied.
     * DataRange.qty is used to keep track of how many resources are occupied
    */
    DateRangeSet.prototype.sumUp = function () {
        // let rangesOrdered = _.orderBy(this.ranges, ['from', 'to'])
        var result = DateRangeSet.empty;
        var allFroms = this.ranges.map(function (r) { return r.from; });
        var allTos = this.ranges.map(function (r) { return r.to; });
        var allBorders = __spreadArray(__spreadArray([], allFroms, true), allTos, true);
        //   hier probleem !!! ...DateBorder  _.uniqBy(dates, 'getTime()')
        var times = allBorders.map(function (d) { return d.getTime(); });
        console.log(times);
        allBorders = _.uniqBy(allBorders, function (d) { return d.getTime(); }); // _.uniq(allBorders, )
        allBorders = allBorders.sort();
        var _loop_1 = function (i) {
            var from = allBorders[i];
            var to = allBorders[i + 1];
            var inRange = this_1.ranges.filter(function (range) { return range.from <= from && from < range.to; });
            var qtyInRange = inRange.length;
            var newRange = new date_range_1.DateRange(from, to);
            newRange.qty = qtyInRange;
            result.addRange(newRange);
        };
        var this_1 = this;
        for (var i = 0; i < allBorders.length - 1; i++) {
            _loop_1(i);
        }
        return result;
    };
    DateRangeSet.prototype.removeRangesWithQtyLowerThen = function (qty) {
        var ranges = this.ranges.filter(function (range) { return range.qty >= qty; });
        return new DateRangeSet(ranges);
    };
    DateRangeSet.prototype.removeRangesWithMinQty = function (qty) {
        var ranges = this.ranges.filter(function (range) { return range.qty < qty; });
        return new DateRangeSet(ranges);
    };
    DateRangeSet.prototype.union = function (set) {
        //to implement !!
        var allRanges = [];
        var result = [];
        if (Array.isArray(this.ranges))
            allRanges.push.apply(allRanges, this.ranges);
        if (Array.isArray(set.ranges))
            allRanges.push.apply(allRanges, set.ranges);
        if (allRanges.length == 0)
            return DateRangeSet.empty;
        allRanges = _.orderBy(allRanges, ['from', 'to']);
        var previousRange = allRanges[0];
        for (var i = 1; i < allRanges.length; i++) {
            var nextRange = allRanges[i];
            // remark, always TRUE: previousRange.from <= nextRange.from  (because ordered by from)
            if (nextRange.from > previousRange.to) {
                result.push(previousRange.clone());
                previousRange = nextRange;
            }
            else {
                var maxTo = nextRange.to > previousRange.to ? nextRange.to : previousRange.to;
                previousRange = new date_range_1.DateRange(previousRange.from, maxTo);
            }
        }
        result.push(previousRange.clone());
        // this.ranges = result
        return new DateRangeSet(result);
    };
    DateRangeSet.prototype.flatten = function () {
        return this;
    };
    DateRangeSet.prototype.subtractByDates = function (from, to) {
        var fromDate = from instanceof Date ? from : ts_common_1.DateHelper.parse(from);
        var toDate = to instanceof Date ? to : ts_common_1.DateHelper.parse(to);
        var range = new date_range_1.DateRange(fromDate, toDate);
        var set = new DateRangeSet([range]);
        return this.subtract(set);
    };
    DateRangeSet.prototype.subtract = function (toSubtract) {
        if (this.isEmpty())
            return DateRangeSet.empty;
        if (!toSubtract || toSubtract.isEmpty())
            return this.clone();
        var source = _.orderBy(this.ranges, ['from', 'to']);
        var substractFromRanges = [];
        for (var _i = 0, source_1 = source; _i < source_1.length; _i++) {
            var range = source_1[_i];
            substractFromRanges.push(range);
        }
        var toSubtractRanges = _.orderBy(toSubtract.ranges, ['from', 'to']);
        //while ()
        var subtractResults = [];
        var subtractFrom = substractFromRanges.pop();
        while (subtractFrom) {
            var overlappingRanges = toSubtractRanges.filter(function (toSubtract) { return subtractFrom.intersectsWith(toSubtract); });
            for (var _a = 0, overlappingRanges_1 = overlappingRanges; _a < overlappingRanges_1.length; _a++) {
                var overlappingRange = overlappingRanges_1[_a];
                var minusResults = date_range_1.DateRange.subtract(subtractFrom, overlappingRange);
                var nrOfResults = minusResults.length;
                if (nrOfResults == 1)
                    subtractFrom = minusResults[0];
                else if (nrOfResults == 0) { // there was a full overlap, no date range left over
                    subtractFrom = null;
                    break;
                }
                else // nrOfResults == 2 => subtractFrom was split in 2 
                 {
                    subtractResults.push(minusResults[0].clone());
                    // we assume no overlaps anymore with minusResults[0] -> the next possible overlappingRange will be more in the future (because they were ordered)
                    subtractFrom = minusResults[1];
                }
            }
            //  const res = subtractFrom?.subtract()
            if (subtractFrom)
                subtractResults.push(subtractFrom.clone());
            subtractFrom = substractFromRanges.pop();
        }
        return new DateRangeSet(subtractResults, this.resource);
    };
    /**
 *  Creates for each date range in this.ranges a solution
 *
 *  Was created for booking fixed block services (such as Wellness slots),
 *  then we typically have some possible intervals where it's possible (dateRanges),
 *  and for each interval we create a solution.
 *
 *  for compound orders (example a massage after a wellness), extra logic down the pipeline will consider each of these solutions
 *  and check if extra services (or resource plannings) can be added as extra solution items to each of the solutions.
 *
 * @param requestItem
 * @param dateRanges
 * @returns
 */
    DateRangeSet.prototype.toSolutions = function (request, requestItem, exactStart, resource) {
        if (this.isEmpty())
            return [];
        var solutions = this.ranges.map(function (range) {
            // we create a solution with 1 solutionItem, because this will be a starting solution where 
            // other solutionItems will be added later on
            var solutionItem = new solution_1.SolutionItem(requestItem, range, exactStart);
            if (resource)
                solutionItem.resources.push(resource);
            var solution = new solution_1.Solution(solutionItem);
            solution.offsetRefDate = range.from;
            return solution;
        });
        return solutions; //new SolutionSet(...solutionItems)
    };
    return DateRangeSet;
}());
exports.DateRangeSet = DateRangeSet;
