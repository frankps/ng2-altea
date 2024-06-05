"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ResourceAvailability2 = void 0;
/* eslint-disable @typescript-eslint/no-non-null-assertion */
var altea_schema_1 = require("../altea-schema");
var dates_1 = require("./dates");
var dateFns = require("date-fns");
var resource_availability_1 = require("./resource-availability");
var ResourceAvailability2 = /** @class */ (function () {
    function ResourceAvailability2(ctx) {
        this.ctx = ctx;
        /** availability indexed by resource id */
        this.availability = new Map();
        var resources = ctx.getAllNongGroupResources();
        for (var _i = 0, resources_1 = resources; _i < resources_1.length; _i++) {
            var resource = resources_1[_i];
            var resourceId = resource.id;
            /** get the outer boundaries for this resource */
            var normalScheduleRanges = void 0; //= ctx.scheduleDateRanges.get(resourceId)
            if (resource.customSchedule)
                normalScheduleRanges = ctx.scheduleDateRanges.get(resourceId);
            else
                normalScheduleRanges = ctx.scheduleDateRanges.get(ctx.branchId);
            if (!normalScheduleRanges) {
                console.error("No schedule date ranges found for ".concat(resource.name));
                continue;
            }
            // get both the available & un-available date ranges
            var resourceOccupation = ctx.getResourceOccupation2(resourceId);
            var extendedSchedule = normalScheduleRanges.union(resourceOccupation.available);
            var unavailable = resourceOccupation.unAvailable;
            if (resource.qty > 1) {
                console.warn('SUM UP Resource usage');
                unavailable = resourceOccupation.unAvailable.sumUp();
                // removeRangesWithQtyLowerThen => for these ranges there is at least 1 resource over
                unavailable = unavailable.removeRangesWithQtyLowerThen(resource.qty);
                console.error(unavailable);
            }
            var resourceStillAvailable = extendedSchedule.subtract(unavailable);
            resourceStillAvailable = resourceStillAvailable.subtract(resourceOccupation.overlapAllowed);
            var availability = new dates_1.ResourceAvailabilitySets(resourceStillAvailable, resourceOccupation.overlapAllowed);
            this.availability.set(resourceId, availability);
        }
    }
    ResourceAvailability2.prototype.getPreparationBlockJustBefore = function (resourceId, date) {
        var sets = this.availability.get(resourceId);
        var result = sets.overlapAllowed.getRangeWhereToEquals(date);
        return result;
    };
    ResourceAvailability2.prototype.getPreparationBlockJustAfter = function (resourceId, date) {
        var sets = this.availability.get(resourceId);
        var result = sets.overlapAllowed.getRangeWhereFromEquals(date);
        return result;
    };
    /** All availabilities of 1 resource are grouped within a DateRangeSet.
     *  Since this request is for multiple resources, we return DateRangeSets (plural)!
     */
    ResourceAvailability2.prototype.getAvailabilities = function (resources) {
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
    ResourceAvailability2.prototype.getAvailabilityOfResourcesInRange = function (resources, insideRange, minTime) {
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
    ResourceAvailability2.prototype.getAvailabilitiesForResource = function (resource, minTime) {
        if (!(resource === null || resource === void 0 ? void 0 : resource.id) || !this.availability) //  || !this.availability.has(resource.id)
            return dates_1.DateRangeSet.empty;
        // | undefined
        if (!this.availability.has(resource.id))
            return dates_1.DateRangeSet.empty;
        //        throw new Error(`resource ${resource.name} has NO availabilities!  ${resource.id}`)
        var availability = this.availability.get(resource.id);
        var set = availability.available;
        if (minTime)
            set = set.minimum(minTime);
        if (set) {
            // we clone, because other logic might make changes
            set = set.clone();
            set.resource = resource;
        }
        else
            set = dates_1.DateRangeSet.empty;
        return set;
    };
    ResourceAvailability2.prototype.getAvailableResourcesInRange = function (resources, dateRange, requestItem, stopWhenFound) {
        if (stopWhenFound === void 0) { stopWhenFound = true; }
        var isPrepTime = requestItem.isPrepTime;
        var result = new resource_availability_1.ResultWithSolutionNotes();
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
    return ResourceAvailability2;
}());
exports.ResourceAvailability2 = ResourceAvailability2;
