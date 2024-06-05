"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LuxomAddress = void 0;
var ts_common_1 = require("ts-common");
var luxom_cmd_1 = require("./luxom-cmd");
var LuxomAddress = /** @class */ (function () {
    function LuxomAddress(grp, addr, info) {
        this.grp = grp;
        this.addr = addr;
        this.info = info;
    }
    Object.defineProperty(LuxomAddress, "spotsKelder", {
        get: function () { return new LuxomAddress('1', '34', 'Spots kelder'); },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(LuxomAddress, "wandTrapInkom", {
        get: function () { return new LuxomAddress('2', '12', 'Wand trap inkom'); },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(LuxomAddress, "gogglesTrapWellness", {
        get: function () { return new LuxomAddress('2', '0C', 'Goggles trap wellness'); },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(LuxomAddress, "vloerTrapWellness", {
        get: function () { return new LuxomAddress('1', '1A', 'Vloer trap wellness'); },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(LuxomAddress, "wellnessTL", {
        get: function () { return new LuxomAddress('3', '00', 'Wellness TL'); },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(LuxomAddress, "zwembadTL", {
        get: function () { return new LuxomAddress('2', '04', 'Zwembad TL'); },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(LuxomAddress, "zwembadLampen", {
        get: function () { return new LuxomAddress('0', '0B', 'ZwembadLampen'); },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(LuxomAddress, "spotsJacuzzi", {
        get: function () { return new LuxomAddress('2', '08', 'Spots jacuzzi'); },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(LuxomAddress, "spotsStraat", {
        get: function () { return new LuxomAddress('2', '07', 'Spots straat'); },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(LuxomAddress, "jacuzziLamp", {
        get: function () { return new LuxomAddress('0', 'OE', 'Jacuzzi lamp'); },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(LuxomAddress, "toiletWellness", {
        get: function () { return new LuxomAddress('2', '0D', 'Toilet wellness'); },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(LuxomAddress, "jacuzziTL", {
        get: function () { return new LuxomAddress('2', '06', 'Jacuzzi TL'); },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(LuxomAddress, "tuinTL", {
        get: function () { return new LuxomAddress('2', '05', 'Tuin TL'); },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(LuxomAddress, "saunaStoombad", {
        get: function () { return new LuxomAddress('5', '20', 'Sauna & Stoombad'); },
        enumerable: false,
        configurable: true
    });
    LuxomAddress.getAllAddresses = function () {
        if (ts_common_1.ArrayHelper.IsEmpty(LuxomAddress.all))
            LuxomAddress.init();
        return this.all;
    };
    LuxomAddress.getAllAddressStates = function () {
        var addresses = this.getAllAddresses();
        return addresses.map(function (a) { return new luxom_cmd_1.LuxomState(undefined, a); });
    };
    LuxomAddress.init = function () {
        var all = LuxomAddress.all = [];
        all.push(LuxomAddress.spotsKelder);
        all.push(LuxomAddress.wandTrapInkom);
        all.push(LuxomAddress.gogglesTrapWellness);
        all.push(LuxomAddress.vloerTrapWellness);
        all.push(LuxomAddress.wellnessTL);
        all.push(LuxomAddress.zwembadTL);
        all.push(LuxomAddress.zwembadLampen);
        all.push(LuxomAddress.spotsJacuzzi);
        all.push(LuxomAddress.spotsStraat);
        all.push(LuxomAddress.jacuzziLamp);
        all.push(LuxomAddress.toiletWellness);
        all.push(LuxomAddress.jacuzziTL);
        all.push(LuxomAddress.tuinTL);
        all.push(LuxomAddress.saunaStoombad);
        return all;
    };
    return LuxomAddress;
}());
exports.LuxomAddress = LuxomAddress;
