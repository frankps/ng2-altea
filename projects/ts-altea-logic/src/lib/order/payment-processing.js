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
exports.PaymentProcessing = void 0;
//import { PrismaClient, Organisation as OrganisationModel, Prisma } from '@prisma/client'
var ts_common_1 = require("ts-common");
var ts_altea_model_1 = require("ts-altea-model");
var altea_db_1 = require("../general/altea-db");
var PaymentProcessing = /** @class */ (function () {
    function PaymentProcessing(db) {
        if (db instanceof altea_db_1.AlteaDb)
            this.alteaDb = db;
        else
            this.alteaDb = new altea_db_1.AlteaDb(db);
    }
    PaymentProcessing.prototype.doGiftPayments = function (payments) {
        return __awaiter(this, void 0, void 0, function () {
            var newPayments, newGiftPayments, giftIds, gifts, allOk, result, giftsToUpdate, _loop_1, _i, newGiftPayments_1, giftPayment, updateGiftResult;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        newPayments = [];
                        newPayments = payments.filter(function (pay) { var _a; return ((_a = pay === null || pay === void 0 ? void 0 : pay.m) === null || _a === void 0 ? void 0 : _a.n) === true; });
                        newGiftPayments = newPayments.filter(function (pay) { return pay.type == ts_altea_model_1.PaymentType.gift; });
                        if (newGiftPayments.length == 0)
                            return [2 /*return*/, new ts_common_1.ApiListResult([], ts_common_1.ApiStatus.ok, 'No gift payments to process!')];
                        giftIds = newGiftPayments.map(function (pay) { return pay.giftId; });
                        return [4 /*yield*/, this.alteaDb.getGiftsByIds(giftIds)];
                    case 1:
                        gifts = _a.sent();
                        console.info('gifts', gifts);
                        allOk = true;
                        result = new ts_common_1.ApiListResult();
                        result.status = ts_common_1.ApiStatus.ok;
                        giftsToUpdate = [];
                        if (newGiftPayments.length > 0) {
                            _loop_1 = function (giftPayment) {
                                var gift = gifts.find(function (g) { return g.id == giftPayment.giftId; });
                                var canUse = gift.canUse(giftPayment.amount);
                                result.data.push(canUse);
                                if (canUse.valid && canUse.amount > 0) {
                                    gift.use(canUse.amount);
                                    giftsToUpdate.push(gift);
                                }
                                else {
                                    result.status = ts_common_1.ApiStatus.error;
                                    result.message += canUse.msg + " ";
                                }
                            };
                            for (_i = 0, newGiftPayments_1 = newGiftPayments; _i < newGiftPayments_1.length; _i++) {
                                giftPayment = newGiftPayments_1[_i];
                                _loop_1(giftPayment);
                            }
                        }
                        if (!result.isOk || giftsToUpdate.length == 0) {
                            return [2 /*return*/, result];
                        }
                        return [4 /*yield*/, this.alteaDb.updateGifts(giftsToUpdate, ['used', 'isConsumed'])];
                    case 2:
                        updateGiftResult = _a.sent();
                        return [2 /*return*/, updateGiftResult];
                }
            });
        });
    };
    PaymentProcessing.prototype.doSubscriptionPayments = function (payments) {
        return __awaiter(this, void 0, void 0, function () {
            var newPayments, newSubscriptionPayments, subsIds, subs, subscriptionsToUpdate, _loop_2, _i, newSubscriptionPayments_1, subsPayment, updateGiftResult;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        newPayments = [];
                        newPayments = payments.filter(function (pay) { var _a; return ((_a = pay === null || pay === void 0 ? void 0 : pay.m) === null || _a === void 0 ? void 0 : _a.n) === true; });
                        newSubscriptionPayments = newPayments.filter(function (pay) { return pay.type == ts_altea_model_1.PaymentType.subs && pay.subsId; });
                        if (newSubscriptionPayments.length == 0)
                            return [2 /*return*/, new ts_common_1.ApiListResult([], ts_common_1.ApiStatus.ok, 'No subscription payments to process!')];
                        subsIds = newSubscriptionPayments.map(function (pay) { return pay.subsId; });
                        return [4 /*yield*/, this.alteaDb.getSubscriptionsByIds(subsIds)];
                    case 1:
                        subs = _a.sent();
                        subscriptionsToUpdate = [];
                        _loop_2 = function (subsPayment) {
                            var subscription = subs.find(function (s) { return s.id == subsPayment.subsId; });
                            if (subscription.act && subscription.usedQty < subscription.totalQty) {
                                subscription.usedQty++;
                                if (subscription.usedQty >= subscription.totalQty) {
                                    subscription.act = false;
                                }
                                subscriptionsToUpdate.push(subscription);
                            }
                        };
                        for (_i = 0, newSubscriptionPayments_1 = newSubscriptionPayments; _i < newSubscriptionPayments_1.length; _i++) {
                            subsPayment = newSubscriptionPayments_1[_i];
                            _loop_2(subsPayment);
                        }
                        return [4 /*yield*/, this.alteaDb.updateSubscriptions(subscriptionsToUpdate, ['usedQty', 'active'])];
                    case 2:
                        updateGiftResult = _a.sent();
                        return [2 /*return*/, updateGiftResult];
                }
            });
        });
    };
    return PaymentProcessing;
}());
exports.PaymentProcessing = PaymentProcessing;
