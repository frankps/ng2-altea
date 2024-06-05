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
exports.SlotFinderBlocks = exports.SlotSearchDirection = void 0;
/* eslint-disable @typescript-eslint/no-non-null-assertion */
var ts_altea_model_1 = require("ts-altea-model");
var dateFns = require("date-fns");
var SlotSearchDirection;
(function (SlotSearchDirection) {
    SlotSearchDirection[SlotSearchDirection["forward"] = 0] = "forward";
    SlotSearchDirection[SlotSearchDirection["backward"] = 1] = "backward";
})(SlotSearchDirection || (exports.SlotSearchDirection = SlotSearchDirection = {}));
var SlotFinderBlocks = /** @class */ (function () {
    function SlotFinderBlocks() {
    }
    Object.defineProperty(SlotFinderBlocks, "I", {
        /** Returns instance of this class */
        get: function () {
            return SlotFinderBlocks._I;
        },
        enumerable: false,
        configurable: true
    });
    SlotFinderBlocks.prototype.createInitialSolutions = function (availability, ctx, resourceRequest) {
        /*
        Work in progress: just added labels START & END to date ranges

        */
        var solutionSet = new ts_altea_model_1.SolutionSet();
        var firstRequestItem = resourceRequest.items[0];
        var product = firstRequestItem.product;
        // most likely there is only 1 resource, example: Wellness
        for (var _i = 0, _a = firstRequestItem.resources; _i < _a.length; _i++) {
            var resource = _a[_i];
            var availabilities = availability.getAvailabilitiesForResource(resource, firstRequestItem.duration);
            console.warn(availabilities);
            for (var _b = 0, _c = availabilities.ranges; _b < _c.length; _b++) {
                var availableRange = _c[_b];
                // const availableRange = range.clone()
                var possibleDateRanges = ts_altea_model_1.DateRangeSet.empty;
                var scheduleIsEmpty = availableRange.containsLabels('START', 'END');
                var searchForward = false; // by default we work backwards to fill an availableRange
                var fromScheduleStart = availableRange.containsFromLabel('START');
                /*
                    fromScheduleStart = true => availableRange starts at beginning of schedule

                */
                if (!fromScheduleStart) // => there is already a booking to the left of availableRange
                    searchForward = true; // => because we want to work forward from an existing booking (to reduce empty spaces in calendar)
                // if the range has no occupations yet
                if (scheduleIsEmpty) {
                    possibleDateRanges = this.getFullDayStartDates(product, availableRange, ctx);
                    var solutions = possibleDateRanges.toSolutions(resourceRequest, firstRequestItem, true, resource);
                    solutionSet.add.apply(solutionSet, solutions);
                }
                else {
                    var solutions = this.findSlotsInRange(searchForward, resource, availableRange, firstRequestItem, resourceRequest, availability, ctx);
                    solutionSet.add.apply(solutionSet, solutions);
                }
            }
        }
        firstRequestItem.isProcessed = true;
        return solutionSet;
    };
    SlotFinderBlocks.prototype.findSlotsInRange = function (searchForward, resource, availableRange, resReqItem, resourceRequest, availability, ctx) {
        //const solutionSet = new SolutionSet()
        var solutions = [];
        var currentSolution;
        //  let searchDirection = SlotSearchDirection.forward
        /*
        There can exist multiple resource requests for same resource, example (in chronological order):
            Wellness preparation: 15min     (Preparation, Overlap allowed)
            Wellness session: 2h
            Wellness cleanup: 30min         (Preparation, Overlap allowed)

        */
        var sortOrder = 'asc';
        if (!searchForward)
            sortOrder = 'desc';
        var requestItemsSameResource = resourceRequest.getItemsForResource(resource.id, sortOrder);
        var firstRequestItem = requestItemsSameResource[0];
        var offsetRefDate = searchForward ? availableRange.from : availableRange.to;
        var isFirstLoop = true;
        /** get the active schedule -> in order to know block size  */
        // we try to find slots until we reach end of availableRange
        while ((searchForward && offsetRefDate < availableRange.to)
            || (!searchForward && offsetRefDate >= availableRange.from)) {
            currentSolution = new ts_altea_model_1.Solution();
            currentSolution.offsetRefDate = offsetRefDate;
            solutions.push(currentSolution);
            var firstRequestProcessed = false;
            if (isFirstLoop && firstRequestItem.isPrepTime && firstRequestItem.prepOverlap) {
                var solutionItem = this.handlePreparationRequestItem(searchForward, resource, firstRequestItem, availableRange, availability, ctx);
                // set the reference date for this solution
                offsetRefDate = dateFns.addSeconds(solutionItem.dateRange.from, -firstRequestItem.offset.seconds);
                currentSolution.offsetRefDate = offsetRefDate;
                //  solutionSet.add(new Solution(solutionItem))
                currentSolution.add(solutionItem);
                firstRequestProcessed = true;
                //firstRequestItem.isProcessed = true
            }
            var requestItemsToProcess = __spreadArray([], requestItemsSameResource, true); //.splice(0, 1)
            if (firstRequestProcessed)
                requestItemsToProcess.splice(0, 1);
            this.handleBasicRequestItems(true, resource, requestItemsToProcess, offsetRefDate, availableRange, currentSolution, availability, ctx);
            isFirstLoop = false;
            /**
             * retrieve block definition (series) in order to know the default space between reservations
             */
            var series = ctx.getBlockSeries(resReqItem.product, offsetRefDate);
            if (!series)
                throw "Block definition NOT found";
            var durationEmptyBlock = series.durationEmptyBlock();
            if (searchForward)
                offsetRefDate = dateFns.addMinutes(offsetRefDate, durationEmptyBlock);
            else
                offsetRefDate = dateFns.addMinutes(offsetRefDate, -durationEmptyBlock);
        }
        console.error(requestItemsSameResource);
        // we mark all request items as processed
        requestItemsSameResource.forEach(function (requestItem) { return requestItem.isProcessed = true; });
        return solutions;
    };
    SlotFinderBlocks.prototype.handlePreparationRequestItem = function (searchForward, resource, firstRequestItem, availableRange, availability, ctx) {
        // this is a preparation block that can overlap with existing (preparations) => try to find one
        var existingPrepBlock;
        if (searchForward)
            existingPrepBlock = availability.getPreparationBlockJustBefore(resource.id, availableRange.from);
        else
            existingPrepBlock = availability.getPreparationBlockJustAfter(resource.id, availableRange.to);
        var prepFrom, prepTo;
        console.log(existingPrepBlock);
        if (existingPrepBlock) {
            var existingPrepBlockLonger = existingPrepBlock.seconds() >= firstRequestItem.seconds();
            if (searchForward) {
                if (existingPrepBlockLonger) {
                    // the requested time block fits into the existing one
                    prepTo = existingPrepBlock.to; // same as availableRange.from
                    prepFrom = dateFns.addSeconds(prepTo, -firstRequestItem.seconds());
                }
                else {
                    prepFrom = existingPrepBlock.from;
                    prepTo = dateFns.addSeconds(prepFrom, firstRequestItem.seconds());
                }
            }
            else { // search backward
                if (existingPrepBlockLonger) {
                    // the requested time block fits into the existing one
                    prepFrom = existingPrepBlock.from;
                    prepTo = dateFns.addSeconds(prepFrom, firstRequestItem.seconds());
                    /* prepTo = existingPrepBlock.to   // same as availableRange.from
                    prepFrom = dateFns.addSeconds(prepTo, -firstRequestItem.seconds()) */
                }
                else {
                    prepTo = existingPrepBlock.to;
                    prepFrom = dateFns.addSeconds(prepTo, -firstRequestItem.seconds());
                    /* prepFrom = existingPrepBlock.from
                    prepTo = dateFns.addSeconds(prepFrom, firstRequestItem.seconds()) */
                }
            }
        }
        else {
            // there is no existing preparation block where we can overlap with => create inside the available range
            prepFrom = availableRange.from;
            if (availableRange.containsFromLabel('START')) {
                // get the current schedule in order to see if preparations can be done outside schedule
                var schedule = ctx.getScheduleOnDate(resource.id, prepFrom);
                if (!schedule)
                    throw new Error("No schedule found");
                // check if preparations can be done outside schedule
                if (!schedule.prepIncl)
                    prepFrom = dateFns.addSeconds(availableRange.from, -firstRequestItem.seconds());
            }
            prepTo = dateFns.addSeconds(prepFrom, firstRequestItem.seconds());
        }
        var newPreparationRange = new ts_altea_model_1.DateRange(prepFrom, prepTo);
        var solutionItem = new ts_altea_model_1.SolutionItem(firstRequestItem, newPreparationRange, true, resource);
        return solutionItem;
    };
    SlotFinderBlocks.prototype.handleBasicRequestItems = function (searchForward, resource, requestItemsSameResource, startDate, availableRange, solution, availability, ctx) {
        for (var i = 0; i < requestItemsSameResource.length; i++) {
            var requestItem = requestItemsSameResource[i];
            var solutionItem = this.handleBasicRequestItem(searchForward, resource, requestItem, startDate, availableRange, availability, ctx);
            solution.add(solutionItem);
            if (!solutionItem.valid) {
                solution.valid = false;
                break; // we don't continue with current solution
            }
        }
    };
    SlotFinderBlocks.prototype.handleBasicRequestItem = function (searchForward, resource, requestItem, startDate, availableRange, availability, ctx) {
        var requestFrom = dateFns.addSeconds(startDate, requestItem.offset.seconds);
        var requestTo = dateFns.addSeconds(requestFrom, requestItem.duration.seconds);
        var requestRange = new ts_altea_model_1.DateRange(requestFrom, requestTo);
        // if requestRange is still within available range: then all is still ok
        var outsideOfRange = !requestRange.isInsideOf(availableRange);
        var solutionItem = new ts_altea_model_1.SolutionItem(requestItem, requestRange, true, resource);
        if (outsideOfRange) {
            solutionItem.valid = false;
            // then maybe check if preparation outside or overlapping with other preparation time if allowed 
            if (requestItem.isPrepTime) {
                // check if outside 
                solutionItem = this.handlePreparationRequestItem2(searchForward, resource, requestItem, requestRange, availableRange, availability, ctx);
            }
            if (!solutionItem.valid)
                solutionItem.addNote("".concat(requestRange.toString(), " not in available range ").concat(availableRange.toString()));
        }
        return solutionItem;
    };
    SlotFinderBlocks.prototype.handlePreparationRequestItem2 = function (searchForward, resource, requestItem, requestRange, availableRange, availability, ctx) {
        var solutionItem = new ts_altea_model_1.SolutionItem(requestItem, requestRange, true, resource);
        solutionItem.valid = false;
        // check if preparations can be done outside schedule
        var schedule = ctx.getScheduleOnDate(resource.id, requestRange.from);
        if (!schedule)
            throw new Error("No schedule found ".concat(resource.name));
        if (!schedule.prepIncl) { // meaning: preparations outside schedule are allowed
            // outsideSchedule = partially or fully outside schedule
            var outsideSchedule = !schedule.isInsideSchedule(requestRange);
            if (outsideSchedule && searchForward) {
                // 2 options: 
                //    1) requestRange is completly outside schedule 
                //    2) requestRange is partially outside schedule => investigate if part inside schedule is available!
                var rangesOutsideSchedule = schedule.outsideSchedule(requestRange);
                if (rangesOutsideSchedule.contains(requestRange)) {
                    solutionItem.valid = true;
                    solutionItem.addNote("".concat(requestRange.toString(), " is preparation time AND is completely outside schedule, but this is allowed!"), ts_altea_model_1.SolutionNoteLevel.info);
                    return solutionItem;
                }
                else {
                    // preparation partially outside schedule
                    var rangesInsideSchedule = schedule.insideSchedule(requestRange);
                    if (availableRange.containsSet(rangesInsideSchedule)) {
                        solutionItem.valid = true;
                        solutionItem.addNote("".concat(requestRange.toString(), " is preparation time AND is partially outside schedule, but this is allowed!"), ts_altea_model_1.SolutionNoteLevel.info);
                        return solutionItem;
                    }
                }
                // check if we are outside schedule
                console.warn('NOW WE NEED TO LOOK OUTSIDE SCHEDULE');
            }
        }
        if (searchForward) {
            /* handle case that preparation at the end can overlap preparation at the beginning
            */
            var existingPrepBlock = availability.getPreparationBlockJustAfter(resource.id, requestRange.from);
            if (existingPrepBlock === null || existingPrepBlock === void 0 ? void 0 : existingPrepBlock.isEqualOrLongerThen(requestRange)) {
                solutionItem.valid = true;
                return solutionItem;
            }
        }
        else { // search backward (but currently not used?)
            var existingPrepBlock = availability.getPreparationBlockJustBefore(resource.id, requestRange.to);
            if (existingPrepBlock === null || existingPrepBlock === void 0 ? void 0 : existingPrepBlock.isEqualOrLongerThen(requestRange)) {
                solutionItem.valid = true;
                return solutionItem;
            }
        }
        return solutionItem;
    };
    SlotFinderBlocks.prototype.findSlots = function (resReqItem, inDateRange, ctx, availability) {
        if (!Array.isArray(resReqItem.resources) || resReqItem.resources.length != 1) {
            throw new Error("SlotFinderBlocks");
        }
        // let resource = resReqItem.resources[0]
        var availabilities = availability.getAvailabilityOfResourcesInRange(resReqItem.resources, inDateRange, resReqItem.duration);
        console.error(availabilities);
        var product = resReqItem.product;
        // then we get initial slots from product.plan
        var dateRanges = this.getFullDayStartDates(product, inDateRange, ctx);
        /*
        if (this.isFullDay(inDateRange, ctx)) {   // this means there are no reservations yet

        } else {
            throw new Error('Not implemented yet!')
        }*/
        return dateRanges;
    };
    SlotFinderBlocks.prototype.getFullDayStartDates = function (product, dateRange, ctx) {
        /** Mostly there is only 1 branch schedule (the default operational mode) active in a given dateRange (can be 1 day for instance),
         *  but exceptionally there can be more branch schedules in a given period (example: normal operations, later followed by holiday period)
         *
         *  We need the schedules to determine the block series (just because these can vary by schedule)
         *
         **/
        var schedules = ctx.getBranchSchedules(dateRange);
        var resultBlocks = new ts_altea_model_1.DateRangeSet();
        for (var i = 0; i < schedules.byDate.length - 1; i++) { // -1 because last item is alwas dateRange.to
            var schedule = schedules.byDate[i];
            var nextSchedule = schedules.byDate[i + 1];
            var dateRangeSameSchedule = new ts_altea_model_1.DateRange(schedule.start, nextSchedule.start);
            //  ctx.resourcePlannings.
            // get definitions for block series for current schedule (= operational mode)
            var blockSeries = product.getBlockSeries(schedule.schedule.id);
            if (Array.isArray(blockSeries)) {
                // convert to actual dates
                var dateRangeSet = this.getActualBlocks(blockSeries, dateRangeSameSchedule);
                resultBlocks = resultBlocks.add(dateRangeSet);
            }
        }
        return resultBlocks;
    };
    /**
 *
 * @param blockSeries the series definied on product.plan (when product.planMode=block)
 * @param dateRange
 * @returns
 */
    SlotFinderBlocks.prototype.getActualBlocks = function (blockSeries, dateRange) {
        var result = new ts_altea_model_1.DateRangeSet();
        for (var _i = 0, blockSeries_1 = blockSeries; _i < blockSeries_1.length; _i++) {
            var series = blockSeries_1[_i];
            var dateRangeSet = series.makeBlocks(dateRange);
            result = result.add(dateRangeSet);
        }
        return result;
    };
    SlotFinderBlocks._I = new SlotFinderBlocks();
    return SlotFinderBlocks;
}());
exports.SlotFinderBlocks = SlotFinderBlocks;
