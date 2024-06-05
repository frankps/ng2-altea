"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ResourceRequest = exports.ResourceRequestItem = void 0;
var time_span_1 = require("./dates/time-span");
var _ = require("lodash");
var ResourceRequestItem = /** @class */ (function () {
    /** the availability after applying all rules: schedules, resourcePlannings, etc ... */
    // availability: DateRangeSet = DateRangeSet.empty
    function ResourceRequestItem(orderLine, product, resourceType) {
        this.orderLine = orderLine;
        this.product = product;
        this.resourceType = resourceType;
        this.resources = [];
        this.offset = time_span_1.TimeSpan.zero;
        this.duration = time_span_1.TimeSpan.zero;
        /** the number of resources that should be allocated from the resourceGroup (or from resources) */
        this.qty = 1;
        /** is preparation time => no actual treatment, but preparations or cleaning */
        this.isPrepTime = false;
        this.prepOverlap = false;
        // set to true when processed
        this.isProcessed = false;
    }
    Object.defineProperty(ResourceRequestItem.prototype, "endsAt", {
        get: function () {
            return this.offset.add(this.duration);
        },
        enumerable: false,
        configurable: true
    });
    //offsetDuration: OffsetDuration = new OffsetDuration()
    ResourceRequestItem.prototype.seconds = function () {
        return this.duration.seconds;
    };
    ResourceRequestItem.prototype.addResource = function (resource) {
        this.resources.push(resource);
    };
    ResourceRequestItem.prototype.addResources = function (resources) {
        var _a;
        (_a = this.resources).push.apply(_a, resources);
    };
    /** check if this request has resources (optionally: of a certain type) */
    ResourceRequestItem.prototype.hasResources = function (type) {
        if (!type)
            return Array.isArray(this.resources) && this.resources.length > 0;
        else
            return Array.isArray(this.resources) && this.resources.filter(function (r) { return r.type === type; }).length > 0;
    };
    ResourceRequestItem.prototype.resourceNames = function (separator) {
        if (separator === void 0) { separator = ', '; }
        var allNames = this.resources.map(function (r) { return r.shortOrName(); }).join(separator);
        return allNames;
    };
    ResourceRequestItem.prototype.hasResourceGroups = function () {
        return Array.isArray(this.resources) && this.resources.filter(function (r) { return r.isGroup; }).length > 0;
    };
    ResourceRequestItem.prototype.clone = function () {
        var _a;
        var clone = new ResourceRequestItem(this.orderLine, this.product, this.resourceType);
        clone.resourceGroup = this.resourceGroup;
        (_a = clone.resources).push.apply(_a, this.resources);
        clone.personId = this.personId;
        clone.orderLine = this.orderLine;
        clone.product = this.product;
        clone.offset = this.offset.clone();
        clone.duration = this.duration.clone();
        return clone;
    };
    return ResourceRequestItem;
}());
exports.ResourceRequestItem = ResourceRequestItem;
var ResourceRequest = /** @class */ (function () {
    function ResourceRequest(info) {
        if (info === void 0) { info = ""; }
        this.info = info;
        this.persons = [];
        this.items = [];
    }
    ResourceRequest.prototype.clone = function (clonePersons, cloneItems) {
        if (clonePersons === void 0) { clonePersons = true; }
        if (cloneItems === void 0) { cloneItems = true; }
        var clone = new ResourceRequest();
        clone.schedule = this.schedule;
        if (clonePersons)
            clone.persons = this.persons.map(function (p) { return p.clone(); });
        if (cloneItems)
            clone.items = this.items.map(function (i) { return i.clone(); });
        return clone;
    };
    ResourceRequest.prototype.add = function () {
        var _a;
        var items = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            items[_i] = arguments[_i];
        }
        (_a = this.items).push.apply(_a, items);
    };
    ResourceRequest.prototype.isEmpty = function () {
        return (!Array.isArray(this.items) || this.items.length === 0);
    };
    ResourceRequest.prototype.hasItemsToProcess = function () {
        if (this.isEmpty())
            return false;
        return (this.items.findIndex(function (i) { return !i.isProcessed; }) >= 0);
    };
    ResourceRequest.prototype.nextItemToProcess = function () {
        if (this.isEmpty())
            return undefined;
        return this.items.find(function (i) { return !i.isProcessed; });
    };
    ResourceRequest.prototype.itemsNotYetProcessed = function () {
        if (this.isEmpty())
            return [];
        return this.items.filter(function (i) { return !i.isProcessed; });
    };
    ResourceRequest.prototype.getAllResources = function () {
        var allResources = this.items.flatMap(function (item) { return item.resources; });
        var resourceIds = allResources.filter(function (r) { return r === null || r === void 0 ? void 0 : r.id; }).map(function (res) { return res.id; });
        return resourceIds;
    };
    ResourceRequest.prototype.getItemsForResource = function (resourceId, sortOrder) {
        if (sortOrder === void 0) { sortOrder = 'asc'; }
        var items = this.items.filter(function (i) { return i.resources.findIndex(function (r) { return r.id == resourceId; }) >= 0; });
        return _.orderBy(items, 'offset.seconds', sortOrder);
    };
    return ResourceRequest;
}());
exports.ResourceRequest = ResourceRequest;
