"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CreateAvailabilityContext = void 0;
/* eslint-disable @typescript-eslint/no-non-null-asserted-optional-chain */
/* eslint-disable @typescript-eslint/no-non-null-assertion */
var ts_common_1 = require("ts-common");
var ts_altea_model_1 = require("ts-altea-model");
var altea_db_1 = require("../../general/altea-db");
var CreateAvailabilityContext = /** @class */ (function () {
    //  Next to do: load all active schedules in period (via scheduling)
    function CreateAvailabilityContext(db) {
        this.db = db;
        if (db instanceof altea_db_1.AlteaDb)
            this.alteaDb = db;
        else
            this.alteaDb = new altea_db_1.AlteaDb(db);
    }
    CreateAvailabilityContext.prototype.create = function (availabilityRequest) {
        return __awaiter(this, void 0, void 0, function () {
            var ctx, _a, _b, _c, resourcesWithCustomSchedules, resourceIdsWithCustomSchedules, _d;
            return __generator(this, function (_e) {
                switch (_e.label) {
                    case 0:
                        if (!availabilityRequest.order)
                            throw new Error("order expected!");
                        if (!availabilityRequest.order.branchId)
                            throw new Error("branch not specified on order: order.branchId");
                        console.error('CreateAvailabilityContext.create()', availabilityRequest);
                        ctx = new ts_altea_model_1.AvailabilityContext(availabilityRequest);
                        _a = ctx;
                        return [4 /*yield*/, this.attachProductsToOrderLines(ctx.order)];
                    case 1:
                        _a.products = _e.sent();
                        ctx.configResources = ctx.order.getProductResources();
                        ctx.branchId = ctx.order.branchId;
                        _b = ctx;
                        return [4 /*yield*/, this.loadResourceGroupsWithChildren(ctx.configResources, ctx.branchId)];
                    case 2:
                        _b.resourceGroups = _e.sent();
                        ctx.allResources = this.unionOfResources(ctx.resourceGroups, ctx.configResources);
                        ctx.allResourceIds = this.getResourceIds(ctx.configResources, true, ctx.resourceGroups);
                        // Every branch has also a corresponding resource (to manage holidays, opening hours, etc of the branch)       
                        ctx.allResourceIds.push(ctx.branchId);
                        _c = ctx;
                        return [4 /*yield*/, this.loadResourcePlannings(ctx.allResourceIds, availabilityRequest)
                            /* Load schedules of resources that have custom scheduling*/
                        ];
                    case 3:
                        _c.resourcePlannings = _e.sent();
                        resourcesWithCustomSchedules = ctx.allResources.filter(function (r) { return r.customSchedule; });
                        resourceIdsWithCustomSchedules = resourcesWithCustomSchedules.map(function (r) { return r.id; });
                        //resourceIdsWithCustomSchedules.push(ctx.branchId)
                        _d = ctx;
                        return [4 /*yield*/, this.loadSchedules(resourceIdsWithCustomSchedules, ctx.allResources)]; // this.alteaDb.schedules(ctx.allResourceIds)
                    case 4:
                        //resourceIdsWithCustomSchedules.push(ctx.branchId)
                        _d.schedules = _e.sent(); // this.alteaDb.schedules(ctx.allResourceIds)
                        ctx.scheduleDateRanges = this.createScheduleDateRanges(resourceIdsWithCustomSchedules, ctx.schedules, availabilityRequest.from, availabilityRequest.to, ctx.resourcePlannings);
                        return [2 /*return*/, ctx];
                }
            });
        });
    };
    /**
     * Create a new set containing all resources from both set1 and set2, including possible child resources
     * @param set1
     * @param set2
     * @returns
     */
    CreateAvailabilityContext.prototype.unionOfResources = function (set1, set2, includeChildResources) {
        var _this = this;
        if (includeChildResources === void 0) { includeChildResources = true; }
        var allResources = [];
        if (Array.isArray(set1) && set1.length > 0)
            allResources.push.apply(allResources, set1);
        if (includeChildResources)
            allResources.forEach(function (resource) { return _this.addChildResources(resource, allResources); });
        var _loop_1 = function (resource) {
            if (allResources.findIndex(function (r) { return r.id == resource.id; }) >= 0)
                return "continue";
            allResources.push(resource);
            if (includeChildResources)
                this_1.addChildResources(resource, allResources);
        };
        var this_1 = this;
        // if (Array.isArray(set2) && set2.length > 0)
        //     allResources.push(...set2)
        for (var _i = 0, set2_1 = set2; _i < set2_1.length; _i++) {
            var resource = set2_1[_i];
            _loop_1(resource);
        }
        //_.uniq(allResources)
        return allResources;
    };
    CreateAvailabilityContext.prototype.addChildResources = function (resource, addToList) {
        if (!resource || !Array.isArray(resource.children))
            return;
        var _loop_2 = function (resourceLink) {
            if (!resourceLink.child)
                return "continue";
            var childResource = resourceLink.child;
            if (addToList.findIndex(function (r) { return r.id == childResource.id; }) >= 0)
                return "continue";
            addToList.push(childResource);
        };
        for (var _i = 0, _a = resource.children; _i < _a.length; _i++) {
            var resourceLink = _a[_i];
            _loop_2(resourceLink);
        }
    };
    /**
     * Load schedules by given ids and attach (previously fetched) resources to these schedules
     *
     * @param resourceIds
     * @param resources
     * @returns
     */
    CreateAvailabilityContext.prototype.loadSchedules = function (resourceIds, resources) {
        return __awaiter(this, void 0, void 0, function () {
            var schedules;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.alteaDb.schedules(resourceIds)];
                    case 1:
                        schedules = _a.sent();
                        this.attachResourcesToSchedules(schedules, resources);
                        return [2 /*return*/, schedules];
                }
            });
        });
    };
    CreateAvailabilityContext.prototype.createScheduleDateRanges = function (resourceIds, schedules, from, to, resourcePlannings) {
        var index = new Map();
        if (!Array.isArray(resourceIds) || resourceIds.length == 0 || !Array.isArray(schedules) || schedules.length == 0)
            return index;
        var _loop_3 = function (resourceId) {
            // start with the default schedule
            var resourceSchedules = schedules.filter(function (s) { return s.resourceId == resourceId; });
            var defaultSchedule = resourceSchedules.find(function (s) { return s.default; });
            var dateRanges = defaultSchedule.toDateRangeSet(from, to, 'START', 'END');
            var otherSchedules = resourceSchedules.filter(function (s) { return !s.default; });
            for (var _a = 0, otherSchedules_1 = otherSchedules; _a < otherSchedules_1.length; _a++) {
                var otherSchedule = otherSchedules_1[_a];
                console.warn('OTHER SCHEDULE');
                // check if other schedule is active during period
                var otherSchedulePlannings = void 0;
                if (ts_common_1.ArrayHelper.AtLeastOneItem(otherSchedule.scheduleIds))
                    otherSchedulePlannings = resourcePlannings.filterBySchedulesDateRange2(otherSchedule.scheduleIds, from, to);
                else
                    otherSchedulePlannings = resourcePlannings.filterByScheduleDateRange(otherSchedule.id, from, to);
                if (otherSchedulePlannings.isEmpty())
                    continue;
                for (var _b = 0, _c = otherSchedulePlannings.plannings; _b < _c.length; _b++) {
                    var planning = _c[_b];
                    dateRanges = dateRanges.subtractByDates(planning.start, planning.end);
                    var otherSet = otherSchedule.toDateRangeSet(from, to, 'START', 'END');
                    dateRanges = dateRanges.add(otherSet);
                }
            }
            index.set(resourceId, dateRanges);
        };
        /*
                for (const schedule of schedules) {
        
                    const dateRangeSet = schedule.toDateRangeSet(from, to)
                    index.set(schedule.id!, dateRangeSet)
                }
                */
        for (var _i = 0, resourceIds_1 = resourceIds; _i < resourceIds_1.length; _i++) {
            var resourceId = resourceIds_1[_i];
            _loop_3(resourceId);
        }
        return index;
        // const branchDateRanges = branchSchedule?.toDateRangeSet(availabilityRequest.from, availabilityRequest.to)
    };
    CreateAvailabilityContext.prototype.attachResourcesToSchedules = function (schedules, resources) {
        if (!Array.isArray(resources) || resources.length == 0)
            return;
        if (Array.isArray(schedules) && schedules.length > 0) {
            var _loop_4 = function (schedule) {
                if (schedule.resourceId) {
                    var resource = resources.find(function (r) { return r.id == schedule.resourceId; });
                    schedule.resource = resource;
                }
            };
            for (var _i = 0, schedules_1 = schedules; _i < schedules_1.length; _i++) {
                var schedule = schedules_1[_i];
                _loop_4(schedule);
            }
        }
    };
    /** Load all products with resource data
     *  order.lines[x].product.resources[y].resource
     *  Returns all products
     */
    CreateAvailabilityContext.prototype.attachProductsToOrderLines = function (order) {
        return __awaiter(this, void 0, void 0, function () {
            var productIds, products, _loop_5, _i, _a, line;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        productIds = order.getProductIds();
                        if (productIds.length == 0)
                            return [2 /*return*/, []];
                        return [4 /*yield*/, this.alteaDb.getProducts(productIds, 'resources.resource')];
                    case 1:
                        products = _b.sent();
                        if (Array.isArray(products) && products.length > 0) {
                            _loop_5 = function (line) {
                                var product = products.find(function (p) { return p.id == line.productId; });
                                line.product = product;
                            };
                            for (_i = 0, _a = order.lines; _i < _a.length; _i++) {
                                line = _a[_i];
                                _loop_5(line);
                            }
                        }
                        return [2 /*return*/, products];
                }
            });
        });
    };
    /**
     * Fetch resource groups and all their containing resources
     *
     * @param resources only type='group' will be refetched from backend (with containing child resources)
     * @param loadExtraResourceIds used to fetch extra resources from backend in same API call (can be other resource type then 'group')
     * @returns
     */
    CreateAvailabilityContext.prototype.loadResourceGroupsWithChildren = function (resources) {
        var loadExtraResourceIds = [];
        for (var _i = 1; _i < arguments.length; _i++) {
            loadExtraResourceIds[_i - 1] = arguments[_i];
        }
        return __awaiter(this, void 0, void 0, function () {
            var resourceGroups, resourceGroupIds, resourceGroupsExtra;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        resourceGroups = resources.filter(function (r) { return r.isGroup; });
                        resourceGroupIds = resourceGroups.map(function (res) { return res.id; });
                        resourceGroupIds.push.apply(resourceGroupIds, loadExtraResourceIds);
                        return [4 /*yield*/, this.alteaDb.getResources(resourceGroupIds, 'children.child')];
                    case 1:
                        resourceGroupsExtra = _a.sent();
                        return [2 /*return*/, resourceGroupsExtra];
                }
            });
        });
    };
    CreateAvailabilityContext.prototype.getChildResources = function (resourceGroups) {
        if (!resourceGroups)
            return [];
        var resourceLinks = resourceGroups.flatMap(function (resGroup) { return resGroup.children; });
        var childResources = resourceLinks.flatMap(function (link) { return link === null || link === void 0 ? void 0 : link.child; });
        return childResources;
    };
    CreateAvailabilityContext.prototype.getChildResourceIds = function (resourceGroups) {
        var childResources = this.getChildResources(resourceGroups);
        if (!childResources)
            return [];
        var ids = childResources.map(function (res) { return res.id; });
        return ids;
    };
    CreateAvailabilityContext.prototype.getResourceIds = function (resources, includeChildResources, resourceGroups) {
        if (!resources)
            return [];
        var ids = resources.map(function (r) { return r.id; });
        if (includeChildResources) {
            var childResourceIds = this.getChildResourceIds(resourceGroups);
            ids.push.apply(ids, childResourceIds);
        }
        return ids;
    };
    CreateAvailabilityContext.prototype.loadResourcePlannings = function (resourceIds, availabilityRequest) {
        return __awaiter(this, void 0, void 0, function () {
            var resourcePlannings;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.alteaDb.resourcePlannings(availabilityRequest.from, availabilityRequest.to, resourceIds)];
                    case 1:
                        resourcePlannings = _a.sent();
                        return [2 /*return*/, new ts_altea_model_1.ResourcePlannings(resourcePlannings)];
                }
            });
        });
    };
    return CreateAvailabilityContext;
}());
exports.CreateAvailabilityContext = CreateAvailabilityContext;
