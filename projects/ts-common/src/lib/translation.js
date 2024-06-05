"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Translation = void 0;
var Translation = /** @class */ (function () {
    function Translation(key, trans) {
        if (key === void 0) { key = ''; }
        if (trans === void 0) { trans = ''; }
        this.key = key;
        this.trans = trans;
        /** can be used to associate values to enum items */
        this.value = 0;
        this.help = '';
    }
    return Translation;
}());
exports.Translation = Translation;
