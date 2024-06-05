"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AvailabilityContext = exports.BranchSchedules = exports.BranchSchedule = void 0;
/* eslint-disable @typescript-eslint/no-non-null-assertion */
var altea_schema_1 = require("../altea-schema");
var _ = require("lodash");
var dates_1 = require("./dates");
var BranchSchedule = /** @class */ (function () {
    function BranchSchedule(start, schedule) {
        this.start = start;
        this.schedule = schedule;
    }
    return BranchSchedule;
}());
exports.BranchSchedule = BranchSchedule;
var BranchSchedules = /** @class */ (function () {
    function BranchSchedules() {
        this.byDate = [];
    }
    return BranchSchedules;
}());
exports.BranchSchedules = BranchSchedules;
var AvailabilityContext = /** @class */ (function () {
    function AvailabilityContext(availabilityRequest) {
        this.branchId = "";
        this.allResourceIds = [];
        /** all resources that are used in order.lines[x].product.resources[y].resource */
        this.configResources = [];
        /** A resource group is a special resource: it contains other 'real' resources, child resources are loaded into resource.children. */
        this.resourceGroups = [];
        /** all resources combined: union of configResources and resourceGroups */
        this.allResources = [];
        /** current planning of all the resources (during interval [request.from, request.to] ) */
        this.resourcePlannings = new altea_schema_1.ResourcePlannings(); // empty set
        /** every resource can have 0, 1 or more schedules: a schedule defines when a resource is available for specific days of the week (for instance on mondays from 9:00 till 17:00, ...),
         * these schedules are Date independent (monday, tuesday, ... are OK, but not 04/12/2022)
         */
        this.schedules = [];
        /** Schedules converted to specific dates monday 09:00 till 17:00 -> [04/12/2022 09:00, 04/12/2022 17:00]. Map is indexed by resourceId.   */
        this.scheduleDateRanges = new Map();
        this.timeUnite = altea_schema_1.TimeUnit.minutes;
        this.products = [];
        this.productIds = [];
        this.productResources = [];
        this.request = availabilityRequest;
        this.order = availabilityRequest.order;
    }
    AvailabilityContext.prototype.test = function () {
        this.scheduleDateRanges.keys();
        var ranges = this.scheduleDateRanges.get('123');
        for (var _i = 0, _a = ranges.ranges; _i < _a.length; _i++) {
            var range = _a[_i];
            range.from;
        }
    };
    // implemented to fix: NG0100: ExpressionChangedAfterItHasBeenCheckedError: Expression has changed after it was checked.
    AvailabilityContext.prototype.scheduleDateRangeKeys = function () {
        if (!this.scheduleDateRanges)
            return [];
        if (!this._scheduleDateRangeKeys || this._scheduleDateRangeKeys.length != this.scheduleDateRanges.size)
            this._scheduleDateRangeKeys = Array.from(this.scheduleDateRanges.keys());
        return this._scheduleDateRangeKeys;
    };
    AvailabilityContext.prototype.getProduct = function (productId) {
        return this.products.find(function (p) { return p.id == productId; });
    };
    AvailabilityContext.prototype.productIdsWithPlanning = function () {
        var productIds = this.productResources.map(function (pr) { return pr.productId; });
        productIds = _.uniq(productIds);
        return productIds;
    };
    AvailabilityContext.prototype.getResource = function (resourceId) {
        return this.allResources.find(function (r) { return r.id == resourceId; });
    };
    /** Get all resources that are NOT a group (of other resources). So, these are the real resources: human, room, device */
    AvailabilityContext.prototype.getAllNongGroupResources = function () {
        if (!Array.isArray(this.allResources) || this.allResources.length == 0)
            return [];
        return this.allResources.filter(function (r) { return !r.isGroup; });
    };
    AvailabilityContext.prototype.productsWithPlanning = function () {
        var productIdsWithPlanning = this.productIdsWithPlanning();
        // productIdsWithPlanning.findIndex(id => prod.id === id) >= 0
        return this.products.filter(function (prod) { return _.includes(productIdsWithPlanning, prod.id); });
    };
    /** Not every orderLine requires plannings, only returns those orderLines that have resources linked to the product 5viq ProductResource-
     *
     */
    AvailabilityContext.prototype.orderlinesWithPlanning = function () {
        var _a, _b, _c;
        if (!((_a = this.order) === null || _a === void 0 ? void 0 : _a.lines) || this.order.lines.length == 0)
            return [];
        //    const productIdsWithPlanning = this.productIdsWithPlanning()
        //    const orderlinesWithPlanning = this.order?.lines?.filter(ol => _.includes(productIdsWithPlanning, ol.productId))
        var orderlinesWithPlanning = (_c = (_b = this.order) === null || _b === void 0 ? void 0 : _b.lines) === null || _c === void 0 ? void 0 : _c.filter(function (ol) { var _a; return (_a = ol.product) === null || _a === void 0 ? void 0 : _a.hasResources(); });
        return orderlinesWithPlanning;
    };
    AvailabilityContext.prototype.productResourcesForOrderLine = function (ol) {
        return this.productResources.filter(function (pr) { return pr.productId = ol.productId; });
    };
    AvailabilityContext.prototype.getBranchScheduleOnDate = function (date) {
        var _this = this;
        // every branch is also a resource, containing the branch opening hours (schedules)
        var branchSchedules = this.schedules.filter(function (sched) { return sched.resourceId == _this.branchId; });
        var branchScheduleIds = branchSchedules.map(function (sched) { return sched.id; });
        var planning = this.resourcePlannings.filterBySchedulesDate(branchScheduleIds, date);
        if (planning) {
            var branchSchedule = branchSchedules.find(function (s) { return s.id == planning.scheduleId; });
            return branchSchedule;
        }
        return this.getDefaultSchedule(this.branchId);
    };
    /** returns all the schedules ordered per date within requested dateRange, starting with the schedule on dateRange.from, and ending with the schedule on dateRange.to.
     * So the array contains at least 2 items.
    */
    AvailabilityContext.prototype.getBranchSchedules = function (dateRange) {
        var _this = this;
        var result = new BranchSchedules();
        // every branch is also a resource, containing the branch opening hours (schedules)
        var branchSchedules = this.schedules.filter(function (sched) { return sched.resourceId == _this.branchId; });
        // get the default opening hours of the branch 
        var defaultSchedule = branchSchedules.find(function (s) { return s.default; });
        if (!defaultSchedule)
            throw new Error("No default schedule availble for ".concat(this.branchId));
        // get the exceptional schedules that might occur during the requested date range 
        var branchScheduleIds = branchSchedules.map(function (sched) { return sched.id; });
        var schedulePlannings = this.resourcePlannings.filterBySchedulesDateRange(branchScheduleIds, dateRange);
        // TO DO: solve overlaps
        if (schedulePlannings.isEmpty()) {
            result.byDate.push(new BranchSchedule(dateRange.from, defaultSchedule));
            result.byDate.push(new BranchSchedule(dateRange.to, defaultSchedule));
        }
        else {
            var nrOfPlannings = schedulePlannings.plannings.length;
            var _loop_1 = function (i) {
                var curPlanning = schedulePlannings.plannings[i];
                var nextDate = null; // = new Date(2100, 1, 1)
                if (i < nrOfPlannings - 1) {
                    var nextPlanning = schedulePlannings.plannings[i + 1];
                    nextDate = nextPlanning.startDate;
                }
                var curSchedule = branchSchedules.find(function (s) { return s.id == curPlanning.scheduleId; });
                if (i == 0) {
                    if (curPlanning.startDate <= dateRange.from) {
                        result.byDate.push(new BranchSchedule(dateRange.from, curSchedule));
                    }
                    else {
                        result.byDate.push(new BranchSchedule(dateRange.from, defaultSchedule));
                        result.byDate.push(new BranchSchedule(curPlanning.startDate, curSchedule));
                    }
                }
                else if (i < nrOfPlannings - 1) {
                    result.byDate.push(new BranchSchedule(curPlanning.startDate, curSchedule));
                }
                if (nextDate && nextDate > curPlanning.endDate)
                    result.byDate.push(new BranchSchedule(curPlanning.endDate, defaultSchedule));
                if (i == (nrOfPlannings - 1)) {
                    if (curPlanning.endDate < dateRange.to)
                        result.byDate.push(new BranchSchedule(dateRange.to, defaultSchedule));
                    else
                        result.byDate.push(new BranchSchedule(dateRange.to, curSchedule));
                }
            };
            for (var i = 0; i < nrOfPlannings; i++) {
                _loop_1(i);
            }
            // for (const schedulePlanning of schedulePlannings.plannings) {
            //     const schedule = branchSchedules.find(s => s.id == schedulePlanning.scheduleId)
            //     if (schedule)
            //         result.byDate.push(new BranchSchedule(schedulePlanning.startDate, schedule))
            //     else
            //         throw new Error(`schedule could not be retrieved`)
            // }
        }
        return result;
    };
    AvailabilityContext.prototype.getSchedule = function (scheduleId) {
        return this.schedules.find(function (s) { return s.id == scheduleId; });
    };
    AvailabilityContext.prototype.getSchedules = function (resourceId) {
        if (!Array.isArray(this.schedules) || this.schedules.length == 0)
            return [];
        return this.schedules.filter(function (s) { return s.resourceId === resourceId; });
    };
    AvailabilityContext.prototype.getDefaultSchedule = function (resourceId) {
        if (!Array.isArray(this.schedules) || this.schedules.length == 0)
            return undefined;
        return this.schedules.find(function (s) { return s.resourceId === resourceId && s.default; });
    };
    /**
     *  Only for products with planning mode block  (product.planMode == PlanningMode.block)
     */
    AvailabilityContext.prototype.getBlockSeries = function (product, onDate) {
        if ((product === null || product === void 0 ? void 0 : product.planMode) != altea_schema_1.PlanningMode.block)
            throw "getBlockSeries(...) only for planMode=block";
        var schedule = this.getBranchScheduleOnDate(onDate);
        if (!schedule)
            throw "no branch schedule found on date";
        var blockSeries = product.getBlockSeries(schedule.id);
        /**
         * needs more fine-tuning!
         */
        if (Array.isArray(blockSeries) && blockSeries.length > 0)
            return blockSeries[0];
        return undefined;
    };
    /**
     * A resource can have 0 or more schedules.
     * There is most likely 1 default schedule and optionally 1 or more custom schedules that are only active during certain periods (defined via resource planning)
     * @param resourceId
     * @param date
     * @returns
     */
    AvailabilityContext.prototype.getScheduleOnDate = function (resourceId, date) {
        if (!Array.isArray(this.schedules) || this.schedules.length == 0)
            return undefined;
        var schedules = this.schedules.filter(function (s) { return s.resourceId === resourceId; });
        var scheduleIds = schedules.map(function (s) { return s.id; });
        // look for schedules active on given date
        var plannings = this.resourcePlannings.filterBySchedulesDateRange2(scheduleIds, date, date);
        // if not found, return default schedule
        if (plannings.isEmpty()) {
            var defaultSchedule = schedules.find(function (s) { return s.default; });
            return defaultSchedule;
        }
        // planning is found for a schedule => then return that schedule
        var planning = plannings.plannings[0];
        var scheduleId = planning.scheduleId;
        var schedule = this.schedules.find(function (s) { return s.id == scheduleId; });
        return schedule;
    };
    AvailabilityContext.prototype.getResourceOccupation = function (resourceId) {
        var exclusivePlannings = this.resourcePlannings.filterByResourceOverlapAllowed(resourceId, false);
        if (exclusivePlannings.isEmpty())
            return new dates_1.ResourceOccupationSets();
        var availablePlannings = exclusivePlannings.filterByAvailable();
        var unavailable = exclusivePlannings.filterByAvailable(false);
        var result = new dates_1.ResourceOccupationSets(availablePlannings.toDateRangeSet(), unavailable.toDateRangeSet());
        return result;
    };
    AvailabilityContext.prototype.getResourceOccupation2 = function (resourceId) {
        var exclusivePlannings = this.resourcePlannings.filterByResourceOverlapAllowed(resourceId, false);
        // some plannings can overlap: preparations of next block might overlap with cleanup of previous block
        var overlapAllowedPlannings = this.resourcePlannings.filterByResourceOverlapAllowed(resourceId, true);
        if (exclusivePlannings.isEmpty() && overlapAllowedPlannings.isEmpty())
            return new dates_1.ResourceOccupationSets();
        var availablePlannings = exclusivePlannings.filterByAvailable();
        var unavailable = exclusivePlannings.filterByAvailable(false);
        var result = new dates_1.ResourceOccupationSets(availablePlannings.toDateRangeSet(), unavailable.toDateRangeSet(), overlapAllowedPlannings.toDateRangeSet());
        console.warn('AVAILABILITY', result);
        return result;
    };
    return AvailabilityContext;
}());
exports.AvailabilityContext = AvailabilityContext;
