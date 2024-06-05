"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CollectionChangeTracker = exports.CollectionChangeTrackerParams = void 0;
var lib_1 = require("../lib");
var api_batch_1 = require("./api-batch");
var _ = require("lodash");
var CollectionChangeTrackerParams = /** @class */ (function () {
    function CollectionChangeTrackerParams() {
        /** columns that make up id */
        this.idProperties = ['id'];
        this.propsToUpdate = [];
        this.propsToRemove = [];
        this.orderByProps = [];
        // enableCancel?= false
    }
    return CollectionChangeTrackerParams;
}());
exports.CollectionChangeTrackerParams = CollectionChangeTrackerParams;
var CollectionChangeTracker = /** @class */ (function () {
    function CollectionChangeTracker(col, type, params) {
        if (params === void 0) { params = new CollectionChangeTrackerParams(); }
        var _this = this;
        this.col = col;
        this.type = type;
        this.params = params;
        this.updateIds = [];
        this.createIds = [];
        this.deleteIds = [];
        /** collection with original objects: used when user cancels operation */
        this.colOrig = [];
        if (!col)
            col = [];
        this.colOrig = col.map(function (obj) { return lib_1.ObjectHelper.clone(obj, _this.type); });
        console.log(col);
        // if (params.enableCancel) {
        // }
    }
    CollectionChangeTracker.prototype.orderedCol = function () {
        if (Array.isArray(this.params.orderByProps) && this.params.orderByProps.length > 0) {
            var col = _.orderBy(this.col, this.params.orderByProps);
            return col;
        }
        return this.col;
    };
    CollectionChangeTracker.prototype.cancel = function () {
        var _this = this;
        this.reset();
        /** we want to keep same array */
        this.col.splice(0, this.col.length);
        this.colOrig.forEach(function (obj) {
            var orig = lib_1.ObjectHelper.clone(obj, _this.type);
            _this.col.push(orig);
        });
    };
    CollectionChangeTracker.prototype.reset = function () {
        this.updateIds = [];
        this.createIds = [];
        this.deleteIds = [];
    };
    CollectionChangeTracker.prototype.hasChanges = function () {
        return (this.updateIds.length > 0 || this.createIds.length > 0 || this.deleteIds.length > 0);
    };
    CollectionChangeTracker.prototype.updateId = function (id) {
        if (!id)
            return;
        // if we update newly created objects, then it doesn't count as an update
        if (this.createIds.indexOf(id) >= 0)
            return;
        this.updateIds.push(id);
    };
    CollectionChangeTracker.prototype.update = function (object) {
        this.updateId(object.id);
    };
    CollectionChangeTracker.prototype.add = function (object) {
        if (!object.id)
            return;
        this.col.push(object);
        this.createId(object.id);
    };
    CollectionChangeTracker.prototype.createId = function (id) {
        if (!id)
            return;
        this.createIds.push(id);
    };
    CollectionChangeTracker.prototype.delete = function (object) {
        this.deleteId(object.id);
    };
    Object.defineProperty(CollectionChangeTracker.prototype, "length", {
        get: function () {
            if (this.col)
                return this.col.length;
            else
                return 0;
        },
        enumerable: false,
        configurable: true
    });
    /** Checks the maximum value of a certain property in the collection. If no elements in collection, then initialMaxValue is returned.  */
    CollectionChangeTracker.prototype.maxValue = function (property, initialMaxValue) {
        if (property === void 0) { property = 'idx'; }
        if (initialMaxValue === void 0) { initialMaxValue = 0; }
        if (!this.col)
            return initialMaxValue;
        var maxObj = _.maxBy(this.col, property);
        if (maxObj)
            return maxObj[property];
        else
            return initialMaxValue;
    };
    CollectionChangeTracker.prototype.hasPropertyValue = function (property, value) {
        if (property === void 0) { property = 'idx'; }
        if (!this.col)
            return false;
        var idx = this.col.findIndex(function (item) { return item[property] == value; });
        return idx >= 0;
    };
    /** For most types, we just transfer list of id's to the back-end, but for objects without an id (a link table for instance),
     *  we transfer small objects that represents a unique record in the table
     */
    CollectionChangeTracker.prototype.deleteId = function (id) {
        if (!id || !this.col)
            return;
        var removedObjects = _.remove(this.col, function (obj) { return obj.id === id; });
        if (!removedObjects || removedObjects.length == 0)
            return;
        var removed = removedObjects[0];
        // if object was just created (and not saved in back-end) => no need to remove back-end
        var justCreated = _.remove(this.createIds, function (idCreate) { return idCreate === id; });
        if (justCreated && justCreated.length > 0)
            return;
        // if object will be deleted, we can forget updates
        _.remove(this.updateIds, function (idUpdate) { return idUpdate === id; });
        if (this.params.idProperties && this.params.idProperties.length > 0 && this.params.idProperties[0] != 'id') {
            var objToRemove_1 = {};
            this.params.idProperties.forEach(function (idProp) { return objToRemove_1[idProp] = removed[idProp]; });
            this.deleteIds.push(objToRemove_1);
        }
        else
            this.deleteIds.push(id);
    };
    CollectionChangeTracker.prototype.createPartialObjectForUpdate = function (obj, propsToUpdate) {
        if (!Array.isArray(propsToUpdate) || propsToUpdate.length == 0)
            return obj;
        var sub = {};
        sub['id'] = obj.id;
        var origObject = this.colOrig.find(function (orig) { return orig.id == obj.id; });
        var nrOfPropsToUpdate = 0;
        propsToUpdate.forEach(function (prop) {
            var objHasProperty = Object.prototype.hasOwnProperty.call(obj, prop);
            var isSame = origObject && _.isEqual(origObject[prop], obj[prop]);
            if (objHasProperty && !isSame) {
                sub[prop] = obj[prop];
                nrOfPropsToUpdate++;
            }
        });
        return nrOfPropsToUpdate === 0 ? null : sub;
    };
    CollectionChangeTracker.prototype.createPartialObjectByRemovingProps = function (obj, propsToRemove) {
        if (!Array.isArray(propsToRemove) || propsToRemove.length == 0)
            return obj;
        var clone = lib_1.ObjectHelper.clone(obj, this.type);
        propsToRemove.forEach(function (prop) {
            delete clone[prop];
        });
        return clone;
    };
    // Remove props based on
    //   propsToRemove 
    // for doing inserts
    CollectionChangeTracker.prototype.getApiBatch = function (updateAll, onlyId) {
        var _this = this;
        var _a, _b, _c, _d;
        if (updateAll === void 0) { updateAll = false; }
        console.warn(this.col);
        var batch = new api_batch_1.ApiBatchProcess();
        var objectsToUpdate = [];
        if (updateAll)
            objectsToUpdate = (_a = this.col) === null || _a === void 0 ? void 0 : _a.filter(function (i) { return i.id ? _this.createIds.indexOf(i.id) == -1 : false; });
        else if (onlyId) {
            objectsToUpdate = (_b = this.col) === null || _b === void 0 ? void 0 : _b.filter(function (i) { return i.id === onlyId; });
        }
        else
            objectsToUpdate = (_c = this.col) === null || _c === void 0 ? void 0 : _c.filter(function (i) { return i.id ? _this.updateIds.indexOf(i.id) >= 0 && _this.createIds.indexOf(i.id) == -1 : false; });
        if (this.params.propsToUpdate && this.params.propsToUpdate.length > 0)
            batch.update = objectsToUpdate.map(function (obj) { return _this.createPartialObjectForUpdate(obj, _this.params.propsToUpdate); }).filter(function (obj) { return obj != null; });
        else {
            /*
            */
            batch.update = objectsToUpdate.map(function (obj) { return _this.createPartialObjectByRemovingProps(obj, _this.params.propsToRemove); });
        }
        // if (this.params.propsToRemove && this.params.propsToRemove.length > 0)
        //   batch.update = batch.update.map(obj => this.createPartialObjectByRemovingProps(obj, this.params.propsToRemove))
        batch.delete = this.deleteIds;
        batch.create = (_d = this.col) === null || _d === void 0 ? void 0 : _d.filter(function (i) { return i.id ? _this.createIds.indexOf(i.id) >= 0 : false; });
        batch.create = batch.create.map(function (obj) { return _this.createPartialObjectByRemovingProps(obj, _this.params.propsToRemove); });
        return batch;
    };
    return CollectionChangeTracker;
}());
exports.CollectionChangeTracker = CollectionChangeTracker;
