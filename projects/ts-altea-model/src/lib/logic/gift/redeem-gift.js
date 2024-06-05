"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RedeemGift = void 0;
/** There are 2 types of gifts: amount or specific
 *  An amount gift: users should select services/products themselves
 *  A specific gift: users can book the specific gift (mode='specific') OR they can select something else (mode='amount'))
 */
var RedeemGift = /** @class */ (function () {
    function RedeemGift(gift, mode) {
        this.gift = gift;
        this.mode = mode;
    }
    return RedeemGift;
}());
exports.RedeemGift = RedeemGift;
