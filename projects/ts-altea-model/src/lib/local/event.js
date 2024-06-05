"use strict";
var __runInitializers = (this && this.__runInitializers) || function (thisArg, initializers, value) {
    var useValue = arguments.length > 2;
    for (var i = 0; i < initializers.length; i++) {
        value = useValue ? initializers[i].call(thisArg, value) : initializers[i].call(thisArg);
    }
    return useValue ? value : void 0;
};
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
Object.defineProperty(exports, "__esModule", { value: true });
exports.Events = exports.Event = exports.EventType = void 0;
var ts_common_1 = require("ts-common");
var job_1 = require("./job");
var class_transformer_1 = require("class-transformer");
var EventType;
(function (EventType) {
    EventType["wellness_start"] = "wellness_start";
    EventType["wellness_end"] = "wellness_end";
})(EventType || (exports.EventType = EventType = {}));
var Event = function () {
    var _a;
    var _instanceExtraInitializers = [];
    var _jobs_decorators;
    var _jobs_initializers = [];
    return _a = /** @class */ (function () {
            function Event(type, date, resourceId, id) {
                this.id = (__runInitializers(this, _instanceExtraInitializers), void 0);
                this.jobs = __runInitializers(this, _jobs_initializers, void 0);
                if (id)
                    this.id = id;
                else
                    this.id = ts_common_1.ObjectHelper.newGuid();
                this.type = type;
                this.date = date;
                this.resourceId = resourceId;
            }
            Event.prototype.jsDate = function () {
                if (!this.date)
                    return undefined;
                return ts_common_1.DateHelper.parse(this.date);
            };
            return Event;
        }()),
        (function () {
            var _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
            _jobs_decorators = [(0, class_transformer_1.Type)(function () { return job_1.Job; })];
            __esDecorate(null, null, _jobs_decorators, { kind: "field", name: "jobs", static: false, private: false, access: { has: function (obj) { return "jobs" in obj; }, get: function (obj) { return obj.jobs; }, set: function (obj, value) { obj.jobs = value; } }, metadata: _metadata }, _jobs_initializers, _instanceExtraInitializers);
            if (_metadata) Object.defineProperty(_a, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        })(),
        _a;
}();
exports.Event = Event;
var Events = /** @class */ (function () {
    function Events(events) {
        this.events = events;
    }
    //find(wellnessResourceId, 'start', planning.start) 
    Events.prototype.find = function (resourceId, type, date) {
        var ev = this.events.find(function (e) { return e.resourceId == resourceId && e.type == type && e.date == date; });
        return ev;
    };
    return Events;
}());
exports.Events = Events;
