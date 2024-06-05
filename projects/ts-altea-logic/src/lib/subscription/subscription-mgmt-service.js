"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SubscriptionMgmtService = void 0;
var ts_altea_model_1 = require("ts-altea-model");
var altea_db_1 = require("../general/altea-db");
var SubscriptionMgmtService = /** @class */ (function () {
    function SubscriptionMgmtService(db) {
        if (db instanceof altea_db_1.AlteaDb)
            this.alteaDb = db;
        else
            this.alteaDb = new altea_db_1.AlteaDb(db);
    }
    /** Mostly only 1 subscription will be created, except if orderLine.qty > 1 or more subscription products (product item) in product */
    SubscriptionMgmtService.prototype.createSubscriptions = function (order, orderLine, saveToDb) {
        if (saveToDb === void 0) { saveToDb = true; }
        return __awaiter(this, void 0, void 0, function () {
            var subscriptions, prod, _i, _a, prodItem, i, sub, res, subscriptionIds, orderLineRes;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        if (!orderLine.product.isSubscription())
                            throw "Can't create subscription!";
                        subscriptions = [];
                        prod = orderLine.product;
                        for (_i = 0, _a = prod.items; _i < _a.length; _i++) {
                            prodItem = _a[_i];
                            for (i = 0; i < orderLine.qty; i++) {
                                sub = new ts_altea_model_1.Subscription();
                                sub.orgId = order.orgId;
                                sub.branchId = order.branchId;
                                sub.contactId = order.contactId;
                                sub.orderId = order.id;
                                sub.name = prod.name;
                                sub.subscriptionProductId = prod.id;
                                sub.unitProductId = prodItem.productId;
                                sub.totalQty = prodItem.qty;
                                sub.usedQty = 0;
                                subscriptions.push(sub);
                            }
                        }
                        if (!saveToDb) return [3 /*break*/, 3];
                        console.warn(subscriptions);
                        return [4 /*yield*/, this.alteaDb.createSubscriptions(subscriptions)];
                    case 1:
                        res = _b.sent();
                        console.error(res);
                        subscriptionIds = subscriptions.map(function (sub) { return sub.id; });
                        /** Update order line  */
                        if (!orderLine.json)
                            orderLine.json = {};
                        orderLine.json['subs'] = subscriptionIds;
                        return [4 /*yield*/, this.alteaDb.updateOrderline(orderLine, ['json'])];
                    case 2:
                        orderLineRes = _b.sent();
                        console.log(orderLineRes);
                        _b.label = 3;
                    case 3: return [2 /*return*/, subscriptions];
                }
            });
        });
    };
    return SubscriptionMgmtService;
}());
exports.SubscriptionMgmtService = SubscriptionMgmtService;
