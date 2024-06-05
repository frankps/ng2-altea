"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ResourceSet = void 0;
var _ = require("lodash");
var ResourceSet = /** @class */ (function () {
    function ResourceSet(resources) {
        if (resources === void 0) { resources = []; }
        this.resources = resources;
    }
    Object.defineProperty(ResourceSet, "empty", {
        get: function () {
            return new ResourceSet();
        },
        enumerable: false,
        configurable: true
    });
    ResourceSet.prototype.isEmpty = function () {
        return (!Array.isArray(this.resources) || this.resources.length === 0);
    };
    ResourceSet.prototype.clear = function () {
        this.resources = [];
    };
    ResourceSet.prototype.add = function () {
        var _a;
        var resources = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            resources[_i] = arguments[_i];
        }
        (_a = this.resources).push.apply(_a, resources);
    };
    ResourceSet.prototype.replaceGroupsByChildren = function () {
        if (!Array.isArray(this.resources) || this.resources.length == 0)
            return ResourceSet.empty;
        var result = ResourceSet.empty;
        for (var _i = 0, _a = this.resources; _i < _a.length; _i++) {
            var resource = _a[_i];
            if (!resource.isGroup)
                result.add(resource);
            else
                result.add.apply(result, resource.getChildResources());
        }
        return result;
    };
    ResourceSet.prototype.filterByType = function (type) {
        var filtered = this.resources.filter(function (r) { return r.type == type; });
        return new ResourceSet(filtered);
    };
    ResourceSet.intersectionMulti = function (sets) {
        return sets.reduce(function (a, b) { return ResourceSet.intersection(a, b); });
    };
    /** the intersection of resources between 2 sets */
    ResourceSet.intersection = function (set1, set2) {
        if (!set1 || !set2 || !Array.isArray(set1.resources) || !Array.isArray(set2.resources))
            return ResourceSet.empty;
        var intersection = _.intersectionBy(set1.resources, set2.resources, 'id');
        return new ResourceSet(intersection);
    };
    /** the intersection of resources between 2 sets */
    ResourceSet.intersectionOfArrays = function (set1, set2) {
        if (!Array.isArray(set1) || !Array.isArray(set2))
            return [];
        var intersection = _.intersectionBy(set1, set2, 'id');
        return intersection;
    };
    return ResourceSet;
}());
exports.ResourceSet = ResourceSet;
