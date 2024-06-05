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
exports.LuxomState = exports.LuxomGetState = void 0;
var ts_common_1 = require("ts-common");
var action_1 = require("./action");
var luxom_address_1 = require("./luxom-address");
var class_transformer_1 = require("class-transformer");
var LuxomGetState = function () {
    var _a;
    var _classSuper = action_1.ActionArgs;
    var _instanceExtraInitializers = [];
    var _addrs_decorators;
    var _addrs_initializers = [];
    return _a = /** @class */ (function (_super) {
            __extends(LuxomGetState, _super);
            function LuxomGetState(addrs) {
                var _this = _super.call(this) || this;
                _this.addrs = (__runInitializers(_this, _instanceExtraInitializers), __runInitializers(_this, _addrs_initializers, void 0));
                _this.addrs = addrs;
                return _this;
            }
            LuxomGetState.prototype.stringCommand = function () {
                if (ts_common_1.ArrayHelper.IsEmpty(this.addrs))
                    return undefined;
                var cmds = [];
                for (var _i = 0, _b = this.addrs; _i < _b.length; _i++) {
                    var addr = _b[_i];
                    var cmd_1 = "*P,0,".concat(addr.grp, ",").concat(addr.addr, ";");
                    cmds.push(cmd_1);
                }
                var cmd = cmds.join('');
                return cmd;
            };
            return LuxomGetState;
        }(_classSuper)),
        (function () {
            var _b;
            var _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create((_b = _classSuper[Symbol.metadata]) !== null && _b !== void 0 ? _b : null) : void 0;
            _addrs_decorators = [(0, class_transformer_1.Type)(function () { return luxom_address_1.LuxomAddress; })];
            __esDecorate(null, null, _addrs_decorators, { kind: "field", name: "addrs", static: false, private: false, access: { has: function (obj) { return "addrs" in obj; }, get: function (obj) { return obj.addrs; }, set: function (obj, value) { obj.addrs = value; } }, metadata: _metadata }, _addrs_initializers, _instanceExtraInitializers);
            if (_metadata) Object.defineProperty(_a, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        })(),
        _a;
}();
exports.LuxomGetState = LuxomGetState;
/**
 * Luxom Command
 */
var LuxomState = /** @class */ (function (_super) {
    __extends(LuxomState, _super);
    /**
     *
     * @param cmd (T)oggle or (S)et or (C)lear or (A)=Set Hexadecimal Value
     * @param grp the Luxom group
     * @param addr Luxom address
     * @param hex hexa decimal value (in case of dimming)
     */
    function LuxomState(cmd, addr, hex) {
        var _this = _super.call(this) || this;
        _this.cmd = cmd;
        _this.addr = addr;
        _this.hex = hex;
        return _this;
    }
    LuxomState.prototype.style = function () {
        switch (this.cmd) {
            case 'S':
                return 'success';
            case 'C':
                return 'danger';
            case 'A':
                if (this.getPct() > 0)
                    return 'warning';
        }
        return 'light';
    };
    LuxomState.set = function (luxAddr) {
        return new LuxomState('S', luxAddr);
    };
    LuxomState.clear = function (luxAddr) {
        return new LuxomState('C', luxAddr);
    };
    LuxomState.toggle = function (luxAddr) {
        return new LuxomState('T', luxAddr);
    };
    LuxomState.setHex = function (luxAddr, hex) {
        return new LuxomState('A', luxAddr, hex);
    };
    LuxomState.setPctg = function (luxAddr, pctg) {
        var temp = +pctg / 100 * 255;
        var hex = temp.toString(16);
        return this.setHex(luxAddr, hex);
    };
    LuxomState.prototype.getPct = function () {
        if (!this.hex)
            return 0;
        return parseInt(this.hex, 16);
    };
    /*
    .NET code    Pct > Hex
      string hexValue = ((int) (double.Parse(percentage) / 100.0 * (double) byte.MaxValue)).ToString("X");
      luxomSvcClient.SetHex(new LuxomAddress(luxomGroup, luxomAddress), hexValue);
    */
    LuxomState.prototype.stringCommand = function () {
        var suffix = '';
        if (this.cmd == 'A' && this.hex)
            suffix = "*Z,{args.hex};";
        var cmd = "*".concat(this.cmd, ",0,").concat(this.addr.grp, ",").concat(this.addr.addr, ";").concat(suffix);
        return cmd;
    };
    return LuxomState;
}(action_1.ActionArgs));
exports.LuxomState = LuxomState;
