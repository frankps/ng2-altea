"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ResourceAvailability = exports.ResultWithSolutionNotes = void 0;
/* eslint-disable @typescript-eslint/no-non-null-assertion */
var altea_schema_1 = require("../altea-schema");
var dates_1 = require("./dates");
var solution_1 = require("./solution");
var dateFns = require("date-fns");
var ResultWithSolutionNotes = /** @class */ (function () {
    function ResultWithSolutionNotes() {
        this.notes = [];
    }
    ResultWithSolutionNotes.prototype.addNote = function (content, level) {
        if (level === void 0) { level = solution_1.SolutionNoteLevel.info; }
        var note = new solution_1.SolutionNote(content, level);
        this.notes.push(note);
    };
    return ResultWithSolutionNotes;
}());
exports.ResultWithSolutionNotes = ResultWithSolutionNotes;
var ResourceAvailability = /** @class */ (function () {
    function ResourceAvailability(ctx) {
        this.ctx = ctx;
        this.availability = new Map();
        var resources = ctx.getAllNongGroupResources();
        for (var _i = 0, resources_1 = resources; _i < resources_1.length; _i++) {
            var resource = resources_1[_i];
            var resourceId = resource.id;
            /*             const defaultSchedule = ctx.getDefaultSchedule(resourceId)
            
                        if (!defaultSchedule) {
                            console.error(`No default schedule found for ${resource.name}`)
                            continue
                        } */
            var resourceActive = ctx.scheduleDateRanges.get(resourceId);
            if (!resourceActive) {
                console.error("No schedule date ranges found for ".concat(resource.name));
                continue;
            }
            var resourceOccupation = ctx.getResourceOccupation(resourceId);
            var resourceActiveExtended = resourceActive.union(resourceOccupation.available);
            var resourceStillAvailable = resourceActiveExtended.subtract(resourceOccupation.unAvailable);
            this.availability.set(resourceId, resourceStillAvailable);
        }
    }
    ResourceAvailability.prototype.getAvailabilitiesForResource = function (resource) {
        if (!(resource === null || resource === void 0 ? void 0 : resource.id) || !this.availability) //  || !this.availability.has(resource.id)
            return dates_1.DateRangeSet.empty;
        var set;
        if (resource.customSchedule)
            set = this.availability.get(resource.id);
        else
            set = this.availability.get(this.ctx.branchId); // otherwise we fall back to the default schedule (of the branch)
        if (set) {
            // we clone, because other logic might make changes
            set = set.clone();
            set.resource = resource;
        }
        else
            set = dates_1.DateRangeSet.empty;
        return set;
    };
    /** All availabilities of 1 resource are grouped within a DateRangeSet.
     *  Since this request is for multiple resources, we return DateRangeSets (plural)!
     */
    ResourceAvailability.prototype.getAvailabilities = function (resources) {
        if (!Array.isArray(resources) || resources.length == 0)
            return dates_1.DateRangeSets.empty;
        var allSets = new dates_1.DateRangeSets();
        for (var _i = 0, resources_2 = resources; _i < resources_2.length; _i++) {
            var resource = resources_2[_i];
            if (!resource.isGroup) {
                var set = this.getAvailabilitiesForResource(resource);
                if (!set.isEmpty())
                    allSets.addSet(set); //return 
            }
            else { // resource.type = group
                //  let result: DateRangeSet = new DateRangeSet()
                for (var _a = 0, _b = resource.getChildResources(); _a < _b.length; _a++) {
                    var childResource = _b[_a];
                    var set = this.getAvailabilitiesForResource(childResource);
                    if (!set.isEmpty())
                        allSets.addSet(set);
                    // const childAvailability = this.getAvailability(childResource)
                    // result = result.add(childAvailability)
                }
            }
        }
        return allSets;
    };
    /** check the availability of given resources inside range (insideRange), only return blocks > minTime */
    ResourceAvailability.prototype.getAvailabilityOfResourcesInRange = function (resources, insideRange, minTime) {
        if (!Array.isArray(resources) || resources.length == 0)
            return dates_1.DateRangeSets.empty;
        var allSets = new dates_1.DateRangeSets();
        for (var _i = 0, resources_3 = resources; _i < resources_3.length; _i++) {
            var resource = resources_3[_i];
            var availabilitiesForResource = this.getAvailabilitiesForResource(resource);
            availabilitiesForResource = availabilitiesForResource.clip(insideRange);
            availabilitiesForResource = availabilitiesForResource.minimum(minTime);
            allSets.addSet(availabilitiesForResource);
        }
        return allSets;
    };
    ResourceAvailability.prototype.getAvailableResourcesInRange = function (resources, dateRange, requestItem, stopWhenFound) {
        if (stopWhenFound === void 0) { stopWhenFound = true; }
        var isPrepTime = requestItem.isPrepTime;
        var result = new ResultWithSolutionNotes();
        result.result = [];
        if (!Array.isArray(resources) || resources.length == 0)
            return result;
        var availableResources = [];
        for (var _i = 0, resources_4 = resources; _i < resources_4.length; _i++) {
            var resource = resources_4[_i];
            if (resource.isGroup)
                continue;
            if (stopWhenFound && availableResources.length >= requestItem.qty)
                break;
            /**
             * getAvailabilitiesForResource: will only check inside the schedule of the resource
             * (sometimes we allow that preparations are done outside schedule -> this is covered later)
             * todo: sometimes preparations wan overlap (before/after)
             */
            var set = this.getAvailabilitiesForResource(resource);
            if (set.contains(dateRange)) {
                availableResources.push(resource);
                continue;
            }
            /*
            If the schedule of the resource allows planning preparation blocks (not actual treatments) outside the schedule,
            then check if resource is available
            */
            if (isPrepTime && resource.type == altea_schema_1.ResourceType.location) { // 
                var activeSchedule = this.ctx.getScheduleOnDate(resource.id, dateRange.from);
                if (!activeSchedule)
                    continue;
                var insideSchedule = activeSchedule.isInsideSchedule(dateRange);
                var outsideSchedule = !insideSchedule;
                var preparationsOutsideScheduleOk = !activeSchedule.prepIncl;
                // check if preparations can be done outside schedule
                if (outsideSchedule) {
                    // remark: inside schedule was already covered above: this.getAvailabilitiesForResource(resource)
                    if (preparationsOutsideScheduleOk) {
                        var existingPlannings = this.ctx.resourcePlannings.filterByResourceDateRange(resource.id, dateRange.from, dateRange.to);
                        if (existingPlannings.isFullAvailable()) {
                            availableResources.push(resource);
                            result.addNote("Preparation time outside schedule for ".concat(resource.name, " at ").concat(dateFns.format(dateRange.from, 'dd/MM HH:mm'), " allowed!"));
                            continue;
                        }
                    }
                    else {
                        result.addNote("Preparation time outside schedule for ".concat(resource.name, " NOT allowed!"));
                    }
                }
                // if we are inside a working schedule and overlap of preparations is allowed
                if (insideSchedule && requestItem.prepOverlap) {
                    var existingPlannings = this.ctx.resourcePlannings.filterByResourceDateRange(resource.id, dateRange.from, dateRange.to);
                    if (existingPlannings.isPrepTimeOnly()) {
                        availableResources.push(resource);
                        result.addNote("Overlapping prepartions allowed for '".concat(resource.name, "' at ").concat(dateFns.format(dateRange.from, 'dd/MM HH:mm'), " allowed!"));
                        continue;
                    }
                }
            }
        }
        result.result = availableResources;
        return result;
    };
    ResourceAvailability.prototype.getAvailability = function (resource) {
        if (!resource)
            return dates_1.DateRangeSet.empty;
        if (!resource.isGroup)
            return this.getAvailabilitiesForResource(resource);
        else { // resource.type = group
            var result = new dates_1.DateRangeSet();
            for (var _i = 0, _a = resource.getChildResources(); _i < _a.length; _i++) {
                var childResource = _a[_i];
                var childAvailability = this.getAvailability(childResource);
                result = result.add(childAvailability);
            }
            return result;
        }
    };
    return ResourceAvailability;
}());
exports.ResourceAvailability = ResourceAvailability;
