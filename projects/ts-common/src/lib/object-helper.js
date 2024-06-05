"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ObjectHelper = exports.ArrayHelper = void 0;
var class_transformer_1 = require("class-transformer");
var _ = require("lodash");
var ArrayHelper = /** @class */ (function () {
    function ArrayHelper() {
    }
    ArrayHelper.AtLeastOneItem = function (array) {
        return (Array.isArray(array) && array.length > 0);
    };
    ArrayHelper.IsEmpty = function (array) {
        return (!Array.isArray(array) || array.length == 0);
    };
    return ArrayHelper;
}());
exports.ArrayHelper = ArrayHelper;
var ObjectHelper = /** @class */ (function () {
    function ObjectHelper() {
    }
    /**
     *
     * @param original
     * @param type
     */
    ObjectHelper.clone = function (original, type) {
        var unTypedClone = (0, class_transformer_1.instanceToPlain)(original);
        var typedClone = (0, class_transformer_1.plainToClass)(type, unTypedClone);
        return typedClone;
    };
    /** before saving to the backend we want to remove linked objects (propsToRemove), we don't want to this on the original objects, but on a clone
     * => the original objects still have the linked objects
     */
    ObjectHelper.unType = function (objects, propsToRemove) {
        if (!Array.isArray(objects))
            return [];
        var unTypedObjects = objects.map(function (obj) {
            var unTyped = (0, class_transformer_1.instanceToPlain)(obj);
            propsToRemove.forEach(function (prop) {
                if (unTyped[prop])
                    delete unTyped[prop];
            });
            return unTyped;
        });
        return unTypedObjects;
    };
    ObjectHelper.newSmallGuid = function (nrOfDigits) {
        if (nrOfDigits === void 0) { nrOfDigits = -1; }
        var pattern = '';
        if (nrOfDigits <= 0)
            pattern = 'xxxx-yxxx';
        else {
            for (var idx = 0; idx < nrOfDigits; idx++) {
                pattern += 'x';
            }
        }
        return pattern.replace(/[xy]/g, function (c) {
            var r = Math.random() * 16 | 0, v = c === 'x' ? r : (r & 0x3 | 0x8);
            return v.toString(16);
        });
    };
    ObjectHelper.newGuid = function () {
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
            var r = Math.random() * 16 | 0, v = c === 'x' ? r : (r & 0x3 | 0x8);
            return v.toString(16);
        });
    };
    ObjectHelper.createRandomString = function (length, chars) {
        if (chars === void 0) { chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789"; }
        // const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789"  // "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
        var result = "";
        var randomArray = new Uint8Array(length);
        crypto.getRandomValues(randomArray);
        randomArray.forEach(function (number) {
            result += chars[number % chars.length];
        });
        return result;
    };
    /**
     * Firestore can't save objects with properties that have the value undefined. This method will replace undefined by null.
     * @param data The object to be checked for undefined values
     * @param template A template object can be passed: when undefined is found in data object, the corresponding value of the template object will be used as the new value
     * @param replaceUndefined
     * @param isRecursion
     */
    ObjectHelper.replaceUndefinedProperties = function (data, template) {
        var _this = this;
        if (template === void 0) { template = null; }
        if (!data)
            return data;
        Object.keys(data).forEach(function (key) {
            var value = data[key];
            if (typeof value === 'undefined') {
                if (template && template[key])
                    data[key] = template[key];
                else
                    data[key] = null;
                return;
            }
            if (value && value instanceof Object)
                _this.replaceUndefinedProperties(value, template);
        });
        return data;
    };
    ObjectHelper.extractArrayProperties = function (objects, properties) {
        var _this = this;
        if (!Array.isArray(objects) || objects.length == 0)
            return [];
        return objects.map(function (obj) { return _this.extractObjectProperties(obj, properties); });
    };
    /** Return a sub object with only the specified properties */
    ObjectHelper.extractObjectProperties = function (obj, properties) {
        if (!obj)
            return obj;
        if (!Array.isArray(properties) || properties.length == 0)
            return [];
        var newObj = {};
        for (var _i = 0, properties_1 = properties; _i < properties_1.length; _i++) {
            var prop = properties_1[_i];
            newObj[prop] = obj[prop];
        }
        return newObj;
    };
    /**
     * Removes a certain property in obj and in all sub-objects
     * @param obj
     * @param propToRemove
     * @returns
     */
    ObjectHelper.removeProperty = function (obj, propToRemove, recursive) {
        var _this = this;
        if (recursive === void 0) { recursive = true; }
        if (!obj)
            return obj;
        if (obj[propToRemove])
            delete obj[propToRemove];
        Object.entries(obj).forEach(function (_a) {
            var key = _a[0], value = _a[1];
            if (!value)
                return;
            if (recursive) {
                if (value instanceof Object)
                    _this.removeProperty(value, propToRemove);
                if (Array.isArray(value))
                    value.forEach(function (sub) { return _this.removeProperty(sub, propToRemove); });
            }
        });
        return obj;
    };
    ObjectHelper.nextIdx = function (collection, idxProperty, idxStep) {
        if (idxProperty === void 0) { idxProperty = 'idx'; }
        if (idxStep === void 0) { idxStep = 100; }
        if (ArrayHelper.IsEmpty(collection))
            return idxStep;
        var maxObject = _.maxBy(collection, idxProperty);
        return maxObject[idxProperty] + idxStep;
    };
    return ObjectHelper;
}());
exports.ObjectHelper = ObjectHelper;
