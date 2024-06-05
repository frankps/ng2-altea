"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ResourceRequestOptimizer = void 0;
/* eslint-disable @typescript-eslint/no-non-null-assertion */
var ts_altea_model_1 = require("ts-altea-model");
var _ = require("lodash");
/** If an order contains multiple treatments for the same customer, then we will try to allocate same resources
 * (staff & room) for this customer.  */
var ResourceRequestOptimizer = /** @class */ (function () {
    function ResourceRequestOptimizer() {
    }
    Object.defineProperty(ResourceRequestOptimizer, "I", {
        /** Returns instance of this class */
        get: function () {
            return ResourceRequestOptimizer._I;
        },
        enumerable: false,
        configurable: true
    });
    /*
    replaceResourceGroupsByChildren(...resourceRequests: ResourceRequest[]): ResourceRequest[] {

        const expandedRequests = []

        for (const resourceRequest of resourceRequests) {

            const expandedRequest = this.replaceResourceGroupsByChildrenIndividual(resourceRequest)
            expandedRequests.push(expandedRequest)

        }

        return expandedRequests
    }
    */
    ResourceRequestOptimizer.prototype.optimize = function () {
        var resourceRequests = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            resourceRequests[_i] = arguments[_i];
        }
        var optimizedRequests = [];
        for (var _a = 0, resourceRequests_1 = resourceRequests; _a < resourceRequests_1.length; _a++) {
            var resourceRequest = resourceRequests_1[_a];
            var optimizedRequest = this.optimizeIndividual(resourceRequest);
            if (optimizedRequest)
                optimizedRequests.push(optimizedRequest);
        }
        return optimizedRequests;
    };
    ResourceRequestOptimizer.prototype.optimizeIndividual = function (resourceRequest) {
        var optimizedRequest = new ts_altea_model_1.ResourceRequest("Optimized resource request");
        var _loop_1 = function (person) {
            // we only consider the resource request items for this person=customer
            var itemsPerson = resourceRequest.items.filter(function (rr) { return rr.personId == person.id; });
            // get the distinct resource types needed (human, room, device)
            var resourceTypesForPerson = _.uniq(itemsPerson.map(function (item) { return item.resourceType; }));
            var _loop_2 = function (resourceType) {
                // only the resource request items for current PERSON and current RESOURCE TYPE
                var itemsPersonResourceType = itemsPerson.filter(function (rr) { return rr.resourceType == resourceType; });
                var resourcesPerRequest = itemsPersonResourceType.map(function (item) { return new ts_altea_model_1.ResourceSet(item.resources); });
                var preferredResources = this_1.findPreferredResources(resourcesPerRequest, resourceType);
                if (preferredResources.length > 0) {
                    var mergedItems = this_1.mergeResourceRequestItems(itemsPersonResourceType, preferredResources);
                    optimizedRequest.add.apply(optimizedRequest, mergedItems);
                }
            };
            for (var _b = 0, resourceTypesForPerson_1 = resourceTypesForPerson; _b < resourceTypesForPerson_1.length; _b++) {
                var resourceType = resourceTypesForPerson_1[_b];
                _loop_2(resourceType);
            }
        };
        var this_1 = this;
        // review the requests per person (most often there will be only 1 person = 1 client/customer per order)
        for (var _i = 0, _a = resourceRequest.persons; _i < _a.length; _i++) {
            var person = _a[_i];
            _loop_1(person);
        }
        return optimizedRequest;
    };
    ResourceRequestOptimizer.prototype.replaceResourceGroupsByChildren = function () {
        var resourceRequests = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            resourceRequests[_i] = arguments[_i];
        }
        var expandedRequests = [];
        for (var _a = 0, resourceRequests_2 = resourceRequests; _a < resourceRequests_2.length; _a++) {
            var resourceRequest = resourceRequests_2[_a];
            var expandedRequest = this.replaceResourceGroupsByChildrenIndividual(resourceRequest);
            expandedRequests.push(expandedRequest);
        }
        return expandedRequests;
    };
    ResourceRequestOptimizer.prototype.replaceResourceGroupsByChildrenIndividual = function (resourceRequest) {
        if (resourceRequest.isEmpty())
            return resourceRequest;
        var expandedRequest = resourceRequest.clone(true, false);
        expandedRequest.info = "Groups replaced by child resources";
        for (var _i = 0, _a = resourceRequest.items; _i < _a.length; _i++) {
            var item = _a[_i];
            var newItem = item.clone();
            if (item.hasResourceGroups()) {
                var resourceSet = new ts_altea_model_1.ResourceSet(item.resources);
                var expandedResourceSet = resourceSet.replaceGroupsByChildren();
                newItem.resources = expandedResourceSet.resources;
            }
            expandedRequest.items.push(newItem);
        }
        return expandedRequest;
    };
    /** If a customer has more treatments in an order:
        1/ then we prefer that the same staff member performs all treatment
        2/ we prefer that the same room is used */
    ResourceRequestOptimizer.prototype.findPreferredResources = function (resourcesPerRequest, type) {
        if (!Array.isArray(resourcesPerRequest))
            return [];
        // replace all groups resources by their actual members
        var realResourcesPerRequest = resourcesPerRequest.map(function (resourceSet) { return resourceSet.replaceGroupsByChildren(); });
        // only consider the requested resourceType (staff or room or device ....)
        var resourceScope = realResourcesPerRequest.map(function (resourceSet) { return resourceSet.filterByType(type); });
        // remove empty resource sets => the non-human sets => rooms etc..
        resourceScope = resourceScope.filter(function (rs) { return !rs.isEmpty(); });
        var intersection = ts_altea_model_1.ResourceSet.intersectionMulti(resourceScope);
        return intersection.resources;
    };
    /**
     *
     * @param resourceRequestItems only contains items for a certain PERSON and for a certain RESOURCE TYPE
     * @param preferredResources already pre-calculated preferred resources
     * @returns
     */
    ResourceRequestOptimizer.prototype.mergeResourceRequestItems = function (resourceRequestItems, preferredResources) {
        if (!Array.isArray(resourceRequestItems) || resourceRequestItems.length == 0)
            return [];
        // we should only merge if intervals are next to each other
        // replace resource by best resource 
        var mergedItems = [];
        var previousItem;
        for (var _i = 0, resourceRequestItems_1 = resourceRequestItems; _i < resourceRequestItems_1.length; _i++) {
            var item = resourceRequestItems_1[_i];
            if (!previousItem) {
                previousItem = item.clone();
                previousItem.resources = preferredResources;
            }
            else {
                if (previousItem.endsAt.seconds == item.offset.seconds) {
                    previousItem.duration = previousItem.duration.add(item.duration);
                }
                else {
                    mergedItems.push(previousItem);
                    previousItem = undefined;
                }
            }
            // this should be optional, because we already calculated before: preferredResources is subset of item.resources
            // const overlappingResources = ResourceSet.intersectionOfArrays(item.resources, preferredResources)
            // if (overlappingResources.length > 0) {
            //     const newItem = item.clone()
            //     newItem.resources = overlappingResources
            //     mergedItems.push(newItem)
            // } else {
            //     mergedItems.push(item)
            // }
        }
        if (previousItem)
            mergedItems.push(previousItem);
        return mergedItems;
    };
    /** Items will only be merged if there is an overlap between item.resources and newResources */
    ResourceRequestOptimizer.prototype.mergeResourceRequestItemsOld = function (resourceRequestItems, newResources) {
        if (!Array.isArray(resourceRequestItems) || resourceRequestItems.length == 0)
            return [];
        var mergedItems = [];
        var toMerge = [];
        var overlappingResources = [];
        for (var _i = 0, resourceRequestItems_2 = resourceRequestItems; _i < resourceRequestItems_2.length; _i++) {
            var item = resourceRequestItems_2[_i];
            // item.resources contains a group => NO OVERLAP
            overlappingResources = ts_altea_model_1.ResourceSet.intersectionOfArrays(item.resources, newResources);
            if (overlappingResources.length > 0) {
                toMerge.push(item);
            }
            else {
                // we have an item with no resource-verlap => we merge previously collected
                if (toMerge.length > 0) {
                    var merged = this.merge(toMerge, overlappingResources);
                    mergedItems.push(merged);
                }
                // add the item that could not be merged
                mergedItems.push(item.clone());
            }
        }
        if (toMerge.length > 0) {
            var merged = this.merge(toMerge, overlappingResources);
            mergedItems.push(merged);
        }
        return mergedItems;
    };
    ResourceRequestOptimizer.prototype.merge = function (items, resources) {
        if (!Array.isArray(items) || items.length == 0)
            throw new Error("At least 1 item are required for a merge");
        var item = new ts_altea_model_1.ResourceRequestItem(items[0].orderLine, items[0].product, items[0].resourceType);
        item.resources = resources;
        item.offset = items[0].offset;
        var seconds = _.sumBy(items, 'duration.seconds');
        item.duration = new ts_altea_model_1.TimeSpan(seconds);
        return item;
    };
    ResourceRequestOptimizer._I = new ResourceRequestOptimizer();
    return ResourceRequestOptimizer;
}());
exports.ResourceRequestOptimizer = ResourceRequestOptimizer;
