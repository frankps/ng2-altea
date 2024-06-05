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
exports.SlotFinder = void 0;
/* eslint-disable @typescript-eslint/no-non-null-assertion */
var ts_altea_model_1 = require("ts-altea-model");
var _ = require("lodash");
var dateFns = require("date-fns");
var slot_finder_blocks_1 = require("./slot-finder-blocks");
var ts_altea_model_2 = require("ts-altea-model");
// (resourceRequest: ResourceRequest, availability: ResourceAvailability):
var SlotFinder = /** @class */ (function () {
    function SlotFinder() {
    }
    Object.defineProperty(SlotFinder, "I", {
        /** Returns instance of this class */
        get: function () {
            return SlotFinder._I;
        },
        enumerable: false,
        configurable: true
    });
    /**
     *  There can be multiple resourceRequests: for instance different requests per branch schedule
     */
    SlotFinder.prototype.findSlots = function (availability2, ctx) {
        var resourceRequests = [];
        for (var _i = 2; _i < arguments.length; _i++) {
            resourceRequests[_i - 2] = arguments[_i];
        }
        var resourceRequest = resourceRequests[0];
        // availability,
        var solutions = this.findSlotsInternal(availability2, ctx, resourceRequest);
        var exactSolutions = solutions; //.toExactSolutions()
        return exactSolutions;
    };
    // availability: ResourceAvailability,
    SlotFinder.prototype.findSlotsInternal = function (availability2, ctx, resourceRequest) {
        console.error('Start findSlots()');
        if (!resourceRequest)
            throw new Error("resourceRequest not specified!");
        /**
         *  First create intial solutions = availability for the first resource request item
         *
         *  To do: also do non-block resources ...
         */
        var solutionSet = this.createInitialSolutions(availability2, ctx, resourceRequest);
        if (resourceRequest.items.length == 1)
            return solutionSet;
        /**
         *  Given the initial solution, we need to check availabilities for other resource request items
         */
        while (resourceRequest.hasItemsToProcess()) {
            var requestItem = resourceRequest.nextItemToProcess();
            solutionSet = this.handleResourceRequestItem(requestItem, solutionSet, availability2);
        }
        return solutionSet;
    };
    SlotFinder.prototype.createInitialSolutions = function (availability2, ctx, resourceRequest) {
        var solutionSet = new ts_altea_model_2.SolutionSet();
        var firstRequestItem = resourceRequest.items[0];
        var product = firstRequestItem.product;
        // PlanningMode = BLOCK
        // ====================
        if (product.planMode == ts_altea_model_1.PlanningMode.block) {
            var solutionSet_1 = slot_finder_blocks_1.SlotFinderBlocks.I.createInitialSolutions(availability2, ctx, resourceRequest);
            return solutionSet_1;
        }
        // PlanningMode = CONTINOUS
        // ========================
        var firstItemAvailabilities = availability2.getAvailabilities(firstRequestItem.resources);
        /** a set typically contains the availability for 1 resource */
        for (var _i = 0, _a = firstItemAvailabilities.sets; _i < _a.length; _i++) {
            var set = _a[_i];
            for (var _b = 0, _c = set.ranges; _b < _c.length; _b++) {
                var range = _c[_b];
                var availableRange = range.clone();
                var possibleDateRanges = ts_altea_model_1.DateRangeSet.empty;
                // we reduce by the duration because we want interval with possible start dates
                availableRange.increaseToWithSeconds(-firstRequestItem.duration.seconds);
                possibleDateRanges.addRange(availableRange);
                var solutions = possibleDateRanges.toSolutions(resourceRequest, firstRequestItem, false, set.resource);
                solutionSet.add.apply(solutionSet, solutions);
            }
        }
        firstRequestItem.isProcessed = true;
        return solutionSet;
    };
    /**
     * evaluates each solution from existing solutionSet, and tries to fulfill the next requestItem. If fulfilled, a new corresponding solution item is added to the soltion.
     * If not fulfilled, solution becomes invalid.
     *
     * @param requestItem
     * @param solutionSet
     */
    SlotFinder.prototype.handleResourceRequestItem = function (requestItem, solutionSet, availability, trackInvalidSolutions) {
        if (trackInvalidSolutions === void 0) { trackInvalidSolutions = true; }
        /**
         * One solution can end up in:
         *  - no solution
         *  - more then 1 solutions
         */
        var resultSolutions = new ts_altea_model_2.SolutionSet();
        /**
         * We continue to build further upon existing solutions (solutionSet)
         */
        for (var _i = 0, _a = solutionSet.solutions; _i < _a.length; _i++) {
            var solution = _a[_i];
            if (!solution.valid) {
                resultSolutions.add(solution);
                continue;
            }
            //const refDate = solution.referenceDate()
            var referenceSolutionItem = solution.items[0];
            if (referenceSolutionItem.exactStart) {
                /* exactStart = true !!! => the first item in the solution has exact start and end */
                if (!solution.offsetRefDate)
                    throw new Error("solution.offsetRefDate not set!");
                var from = dateFns.addSeconds(solution.offsetRefDate, requestItem.offset.seconds);
                var to = dateFns.addSeconds(from, requestItem.duration.seconds);
                var range = new ts_altea_model_1.DateRange(from, to);
                // the notes are for extra debug info
                var resourcesWithNotes = availability.getAvailableResourcesInRange(requestItem.resources, range, requestItem);
                var availableResources = resourcesWithNotes.result;
                solution.addNotes(resourcesWithNotes.notes);
                if (availableResources.length >= requestItem.qty) {
                    var solutionItem = new (ts_altea_model_1.SolutionItem.bind.apply(ts_altea_model_1.SolutionItem, __spreadArray([void 0, requestItem, range.clone(), true], availableResources, false)))();
                    solution.add(solutionItem);
                    resultSolutions.add(solution.clone());
                }
                else {
                    solution.valid = false;
                    var interval = "[".concat(dateFns.format(from, 'dd/MM HH:mm'), ", ").concat(dateFns.format(to, 'dd/MM HH:mm'), "]");
                    var onlyAvailable = '/';
                    if (availableResources.length > 0) {
                        onlyAvailable = availableResources.map(function (r) { return r.shortOrName(); }).join(', ');
                    }
                    if (requestItem.resourceGroup) {
                        var resourceName = requestItem.resourceGroup.name;
                        solution.addNote("Not enough recources for '".concat(resourceName, "': ").concat(availableResources.length, "/").concat(requestItem.qty, ", ").concat(interval, ", available: ").concat(onlyAvailable));
                    }
                    else if (requestItem.hasResources()) {
                        solution.addNote("No availability found for '".concat(requestItem.resourceNames(), "': ").concat(availableResources.length, "/").concat(requestItem.qty, ", ").concat(interval, ", available: ").concat(onlyAvailable));
                    }
                    if (trackInvalidSolutions)
                        resultSolutions.add(solution.clone());
                }
            }
            else {
                /* exactStart=false => the reference solution item (first item in solution) is not an exact start, but rather an interval where-in the first request item can start
                It can START in the range [referenceSolutionItem.dateRange.from, referenceSolutionItem.dateRange.to]
                => we need to check the availability of the new requestItem relativly to the above range (see what is possible)
                */
                // IMPORTANT: maybe convert refFrom to solution.offsetRefDate (same as done in if then statement above)
                var refFrom = referenceSolutionItem.dateRange.from;
                var refTo = referenceSolutionItem.dateRange.to;
                if (!refFrom)
                    throw new Error("No reference (start) date available");
                var startFrom = dateFns.addSeconds(refFrom, requestItem.offset.seconds);
                var startTo = dateFns.addSeconds(refTo, requestItem.offset.seconds);
                var endsOn = dateFns.addSeconds(startTo, requestItem.duration.seconds);
                // const startRange = new DateRange(startFrom, startTo)
                var checkInRange = new ts_altea_model_1.DateRange(startFrom, endsOn);
                var availableResources = availability.getAvailabilityOfResourcesInRange(requestItem.resources, checkInRange, requestItem.duration);
                // if we have no availabilities for the new requestItem, then we are on a dead-end for this solution
                if (availableResources.isEmpty()) {
                    solution.valid = false;
                    if (trackInvalidSolutions)
                        resultSolutions.add(solution);
                    continue;
                }
                /* Create a new solution for each possible availability
                */
                for (var _b = 0, _c = availableResources.sets; _b < _c.length; _b++) {
                    var availabilitiesForResource = _c[_b];
                    var resources = [];
                    if (availabilitiesForResource.resource)
                        resources.push(availabilitiesForResource.resource);
                    for (var _d = 0, _e = availabilitiesForResource.ranges; _d < _e.length; _d++) {
                        var availabilityForResource = _e[_d];
                        var newSolution = solution.clone();
                        var solutionItem = new (ts_altea_model_1.SolutionItem.bind.apply(ts_altea_model_1.SolutionItem, __spreadArray([void 0, requestItem, availabilityForResource.clone(), false], resources, false)))();
                        newSolution.add(solutionItem);
                        resultSolutions.add(newSolution);
                    }
                }
                console.warn(availableResources);
                //availability.getAvailability()
            }
        }
        requestItem.isProcessed = true;
        return resultSolutions;
    };
    SlotFinder.prototype.findContinuousSlots = function (dateRange, slots) {
        var startDates = dateRange.getDatesEvery(ts_altea_model_1.TimeSpan.minutes(15));
        slots.push.apply(slots, startDates.map(function (date) { return ts_altea_model_1.SlotInfo.fromDate(date); }));
    };
    SlotFinder.prototype.isFullDay = function (dateRange, ctx) {
        return true;
    };
    /** remove doubles or slots that are too close */
    SlotFinder.prototype.cleanSlots = function (slots) {
        slots = _.sortBy(slots, 'start');
        slots = _.uniqBy(slots, 'start');
        return slots;
    };
    SlotFinder._I = new SlotFinder();
    return SlotFinder;
}());
exports.SlotFinder = SlotFinder;
