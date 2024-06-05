"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        if (typeof b !== "function" && b !== null)
            throw new TypeError("Class extends value " + String(b) + " is not a constructor or null");
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
var __esDecorate = (this && this.__esDecorate) || function (ctor, descriptorIn, decorators, contextIn, initializers, extraInitializers) {
    function accept(f) { if (f !== void 0 && typeof f !== "function") throw new TypeError("Function expected"); return f; }
    var kind = contextIn.kind, key = kind === "getter" ? "get" : kind === "setter" ? "set" : "value";
    var target = !descriptorIn && ctor ? contextIn["static"] ? ctor : ctor.prototype : null;
    var descriptor = descriptorIn || (target ? Object.getOwnPropertyDescriptor(target, contextIn.name) : {});
    var _, done = false;
    for (var i = decorators.length - 1; i >= 0; i--) {
        var context = {};
        for (var p in contextIn) context[p] = p === "access" ? {} : contextIn[p];
        for (var p in contextIn.access) context.access[p] = contextIn.access[p];
        context.addInitializer = function (f) { if (done) throw new TypeError("Cannot add initializers after decoration has completed"); extraInitializers.push(accept(f || null)); };
        var result = (0, decorators[i])(kind === "accessor" ? { get: descriptor.get, set: descriptor.set } : descriptor[key], context);
        if (kind === "accessor") {
            if (result === void 0) continue;
            if (result === null || typeof result !== "object") throw new TypeError("Object expected");
            if (_ = accept(result.get)) descriptor.get = _;
            if (_ = accept(result.set)) descriptor.set = _;
            if (_ = accept(result.init)) initializers.unshift(_);
        }
        else if (_ = accept(result)) {
            if (kind === "field") initializers.unshift(_);
            else descriptor[key] = _;
        }
    }
    if (target) Object.defineProperty(target, contextIn.name, descriptor);
    done = true;
};
var __runInitializers = (this && this.__runInitializers) || function (thisArg, initializers, value) {
    var useValue = arguments.length > 2;
    for (var i = 0; i < initializers.length; i++) {
        value = useValue ? initializers[i].call(thisArg, value) : initializers[i].call(thisArg);
    }
    return useValue ? value : void 0;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ObjectReference = exports.ObjectWithIdPlus = exports.ObjectWithId = exports.ManagedObject = exports.ObjectMgmt = exports.RemovedFromCollection = void 0;
var class_transformer_1 = require("class-transformer");
var object_helper_1 = require("./object-helper");
var RemovedFromCollection = /** @class */ (function () {
    function RemovedFromCollection(col, id) {
        this.col = col;
        this.id = id;
    }
    return RemovedFromCollection;
}());
exports.RemovedFromCollection = RemovedFromCollection;
var ObjectMgmt = /** @class */ (function () {
    function ObjectMgmt() {
    }
    ObjectMgmt.prototype.setDirty = function () {
        var _a;
        var fields = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            fields[_i] = arguments[_i];
        }
        if (!Array.isArray(fields) || fields.length == 0)
            return;
        this.u = true;
        if (!Array.isArray(this.f))
            this.f = [];
        (_a = this.f).push.apply(_a, fields);
    };
    return ObjectMgmt;
}());
exports.ObjectMgmt = ObjectMgmt;
/**
 *  A managed object has has an 'm' property that keeps track if it's status.
 *  This property has some sub-properties:
 *    n:new, u:updated (f:the updated fields), d:deleted
 */
var ManagedObject = function () {
    var _a;
    var _instanceExtraInitializers = [];
    var _m_decorators;
    var _m_initializers = [];
    return _a = /** @class */ (function () {
            function ManagedObject() {
                /** management property to manage object in back-end, not saved in db!  */
                this.m = (__runInitializers(this, _instanceExtraInitializers), __runInitializers(this, _m_initializers, new ObjectMgmt()));
            }
            ManagedObject.prototype.isNew = function () {
                var _b;
                return (((_b = this.m) === null || _b === void 0 ? void 0 : _b.n) == true);
            };
            ManagedObject.prototype.markAsNew = function () {
                if (!this.m)
                    this.m = new ObjectMgmt();
                this.m.n = true;
            };
            ManagedObject.prototype.markAsRemoved = function (collection, id) {
                if (!this.m)
                    this.m = new ObjectMgmt();
                if (!this.m.r)
                    this.m.r = {};
                if (!this.m.r[collection]) {
                    this.m.r[collection] = [id];
                    console.error(this.m.r);
                    return;
                }
                var ids = this.m.r[collection];
                ids.push(id);
                console.error(this.m.r);
            };
            ManagedObject.prototype.markAsUpdated = function () {
                var _this = this;
                var fields = [];
                for (var _i = 0; _i < arguments.length; _i++) {
                    fields[_i] = arguments[_i];
                }
                if (!this.m)
                    this.m = new ObjectMgmt();
                this.m.u = true;
                if (Array.isArray(fields) && fields.length > 0) {
                    if (!this.m.f)
                        this.m.f = [];
                    fields.forEach(function (f) {
                        if (_this.m.f && _this.m.f.indexOf(f) == -1)
                            _this.m.f.push(f);
                    });
                }
            };
            /**
             * if the management property (m) contains a list of fields (m.f), then return an object of only these fields
             * @param object
             * @returns
             */
            ManagedObject.getUpdatedPropertiesOnly = function (object) {
                var _b;
                if (!Array.isArray((_b = object === null || object === void 0 ? void 0 : object.m) === null || _b === void 0 ? void 0 : _b.f))
                    return undefined;
                var update = {};
                for (var _i = 0, _c = object.m.f; _i < _c.length; _i++) {
                    var property = _c[_i];
                    update[property] = object[property];
                }
                return update;
            };
            return ManagedObject;
        }()),
        (function () {
            var _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
            _m_decorators = [(0, class_transformer_1.Type)(function () { return ObjectMgmt; })];
            __esDecorate(null, null, _m_decorators, { kind: "field", name: "m", static: false, private: false, access: { has: function (obj) { return "m" in obj; }, get: function (obj) { return obj.m; }, set: function (obj, value) { obj.m = value; } }, metadata: _metadata }, _m_initializers, _instanceExtraInitializers);
            if (_metadata) Object.defineProperty(_a, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        })(),
        _a;
}();
exports.ManagedObject = ManagedObject;
var ObjectWithId = /** @class */ (function (_super) {
    __extends(ObjectWithId, _super);
    function ObjectWithId() {
        var _this = _super.call(this) || this;
        _this.id = object_helper_1.ObjectHelper.newGuid();
        return _this;
        /** declare this object as new */
        // this.m.n = true
    }
    return ObjectWithId;
}(ManagedObject));
exports.ObjectWithId = ObjectWithId;
var dateToClass = function () { return function (v) {
    console.error('dateToClass', v);
    return v.value ? new Date(v.value) : v.value;
}; };
var ObjectWithIdPlus = function () {
    var _a;
    var _classSuper = ObjectWithId;
    var _instanceExtraInitializers = [];
    var _upd_decorators;
    var _upd_initializers = [];
    var _cre_decorators;
    var _cre_initializers = [];
    return _a = /** @class */ (function (_super) {
            __extends(ObjectWithIdPlus, _super);
            function ObjectWithIdPlus() {
                var _this = _super !== null && _super.apply(this, arguments) || this;
                /** object is active */
                _this.act = (__runInitializers(_this, _instanceExtraInitializers), true);
                /** object is deleted */
                _this.del = false;
                /** object last updated at */
                _this.upd = __runInitializers(_this, _upd_initializers, new Date()
                /** object created at */
                );
                /** object created at */
                _this.cre = __runInitializers(_this, _cre_initializers, new Date());
                return _this;
            }
            return ObjectWithIdPlus;
        }(_classSuper)),
        (function () {
            var _b;
            var _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create((_b = _classSuper[Symbol.metadata]) !== null && _b !== void 0 ? _b : null) : void 0;
            _upd_decorators = [(0, class_transformer_1.Type)(function () { return Date; })];
            _cre_decorators = [(0, class_transformer_1.Type)(function () { return Date; })];
            __esDecorate(null, null, _upd_decorators, { kind: "field", name: "upd", static: false, private: false, access: { has: function (obj) { return "upd" in obj; }, get: function (obj) { return obj.upd; }, set: function (obj, value) { obj.upd = value; } }, metadata: _metadata }, _upd_initializers, _instanceExtraInitializers);
            __esDecorate(null, null, _cre_decorators, { kind: "field", name: "cre", static: false, private: false, access: { has: function (obj) { return "cre" in obj; }, get: function (obj) { return obj.cre; }, set: function (obj, value) { obj.cre = value; } }, metadata: _metadata }, _cre_initializers, _instanceExtraInitializers);
            if (_metadata) Object.defineProperty(_a, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        })(),
        _a;
}();
exports.ObjectWithIdPlus = ObjectWithIdPlus;
var ObjectReference = /** @class */ (function () {
    function ObjectReference() {
    }
    return ObjectReference;
}());
exports.ObjectReference = ObjectReference;
