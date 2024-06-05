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
exports.CancelOrder = exports.CancelOrderActions = exports.CancelOrderGiftAction = exports.CancelOrderAction = exports.CancelOrderActionType = exports.CancelOrderChecks = exports.CancelOrderRequest = exports.CancelOrderMessage = void 0;
/* eslint-disable @typescript-eslint/no-non-null-assertion */
var ts_common_1 = require("ts-common");
var ts_altea_model_1 = require("ts-altea-model");
var altea_db_1 = require("../general/altea-db");
var dateFns = require("date-fns");
var _ = require("lodash");
var CancelOrderMessage;
(function (CancelOrderMessage) {
    CancelOrderMessage["success"] = "success";
    CancelOrderMessage["alreadyCancelled"] = "alreadyCancelled";
    CancelOrderMessage["giftAlreadyUsed"] = "giftAlreadyUsed";
    CancelOrderMessage["subscriptionAlreadyUsed"] = "subscriptionAlreadyUsed";
    CancelOrderMessage["noMoreFreeCancel"] = "noMoreFreeCancel";
})(CancelOrderMessage || (exports.CancelOrderMessage = CancelOrderMessage = {}));
var CancelOrderRequest = /** @class */ (function () {
    function CancelOrderRequest() {
    }
    return CancelOrderRequest;
}());
exports.CancelOrderRequest = CancelOrderRequest;
var CancelOrderChecks = /** @class */ (function () {
    function CancelOrderChecks(message) {
        if (message === void 0) { message = CancelOrderMessage.success; }
        this.message = message;
        //totalActualPaid: number = 0
        this.hasSubsPayments = false;
        this.subsPayments = [];
    }
    CancelOrderChecks.prototype.hasProblems = function () {
        return (this.message != CancelOrderMessage.success);
    };
    Object.defineProperty(CancelOrderChecks, "success", {
        get: function () {
            return new CancelOrderChecks(CancelOrderMessage.success);
        },
        enumerable: false,
        configurable: true
    });
    return CancelOrderChecks;
}());
exports.CancelOrderChecks = CancelOrderChecks;
/** CancelOrderActions: keep track of actions performed by cancelling an order.
 *
 * Examples:
 *  - create a compensation gift
 *  - re-increment existing gift that were used as payments
 *
 */
var CancelOrderActionType;
(function (CancelOrderActionType) {
    CancelOrderActionType[CancelOrderActionType["newGiftOrder"] = 0] = "newGiftOrder";
    CancelOrderActionType[CancelOrderActionType["incrementUsedGift"] = 1] = "incrementUsedGift";
    CancelOrderActionType[CancelOrderActionType["createCompensationGift"] = 2] = "createCompensationGift";
})(CancelOrderActionType || (exports.CancelOrderActionType = CancelOrderActionType = {}));
var CancelOrderAction = /** @class */ (function () {
    function CancelOrderAction(type, objectId, ok) {
        if (ok === void 0) { ok = false; }
        this.type = type;
        this.objectId = objectId;
        this.ok = ok;
    }
    return CancelOrderAction;
}());
exports.CancelOrderAction = CancelOrderAction;
var CancelOrderGiftAction = /** @class */ (function (_super) {
    __extends(CancelOrderGiftAction, _super);
    function CancelOrderGiftAction(type, giftId, giftCode, value, ok, origUsed, newUsed) {
        if (origUsed === void 0) { origUsed = 0; }
        if (newUsed === void 0) { newUsed = 0; }
        var _this = _super.call(this, type, giftId, ok) || this;
        _this.giftId = giftId;
        _this.giftCode = giftCode;
        _this.value = value;
        _this.origUsed = origUsed;
        _this.newUsed = newUsed;
        return _this;
    }
    return CancelOrderGiftAction;
}(CancelOrderAction));
exports.CancelOrderGiftAction = CancelOrderGiftAction;
/** The various actions performed  */
var CancelOrderActions = /** @class */ (function () {
    function CancelOrderActions() {
        this.actions = [];
    }
    CancelOrderActions.prototype.add = function (action) {
        this.actions.push(action);
    };
    CancelOrderActions.prototype.getById = function (objectId) {
        var action = this.actions.find(function (a) { return a.objectId == objectId; });
        return action;
    };
    CancelOrderActions.prototype.isOk = function () {
        var notOkIdx = this.actions.findIndex(function (a) { return !a.ok; });
        return (notOkIdx == -1);
    };
    return CancelOrderActions;
}());
exports.CancelOrderActions = CancelOrderActions;
var CancelOrder = /** @class */ (function () {
    function CancelOrder(db) {
        if (db instanceof altea_db_1.AlteaDb)
            this.alteaDb = db;
        else
            this.alteaDb = new altea_db_1.AlteaDb(db);
    }
    CancelOrder.prototype.checks = function (order) {
        return __awaiter(this, void 0, void 0, function () {
            var checkResponse, cancelMinHours, freeCancelBefore, now, gift, subscriptions;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        checkResponse = new CancelOrderChecks();
                        if (order.state == ts_altea_model_1.OrderState.cancelled) {
                            checkResponse.message = CancelOrderMessage.alreadyCancelled;
                            return [2 /*return*/, checkResponse];
                        }
                        if (order.start && order.branch.cancel) {
                            cancelMinHours = order.cancelMinHours();
                            freeCancelBefore = dateFns.subHours(order.startDate, cancelMinHours);
                            now = new Date();
                            if (now > freeCancelBefore) {
                                checkResponse.message = CancelOrderMessage.noMoreFreeCancel;
                                checkResponse.freeCancelBefore = freeCancelBefore;
                                checkResponse.freeCancelMinHours = cancelMinHours;
                                return [2 /*return*/, checkResponse];
                            }
                        }
                        if (!order.gift) return [3 /*break*/, 2];
                        return [4 /*yield*/, this.alteaDb.getGiftByOrderId(order.id)];
                    case 1:
                        gift = _a.sent();
                        checkResponse.gift = gift;
                        if ((gift === null || gift === void 0 ? void 0 : gift.used) > 0) {
                            //  const response = new CancelOrderResponse(CancelOrderMessage.giftAlreadyUsed)
                            checkResponse.message = CancelOrderMessage.giftAlreadyUsed;
                            return [2 /*return*/, checkResponse];
                        }
                        _a.label = 2;
                    case 2: return [4 /*yield*/, this.alteaDb.getSubscriptionsByOrderId(order.id)];
                    case 3:
                        subscriptions = _a.sent();
                        checkResponse.subscriptions = subscriptions;
                        if (ts_common_1.ArrayHelper.AtLeastOneItem(subscriptions)) {
                            checkResponse.message = CancelOrderMessage.subscriptionAlreadyUsed;
                            return [2 /*return*/, checkResponse];
                        }
                        if (ts_common_1.ArrayHelper.AtLeastOneItem(order.payments)) {
                            /** Use of a subscription */
                            checkResponse.subsPayments = order.payments.filter(function (p) { return p.type == ts_altea_model_1.PaymentType.subs; });
                            if (ts_common_1.ArrayHelper.AtLeastOneItem(checkResponse.subsPayments)) {
                                checkResponse.hasSubsPayments = true;
                            }
                        }
                        return [2 /*return*/, checkResponse];
                }
            });
        });
    };
    CancelOrder.prototype.cancelOrder = function (order, orderCancel) {
        return __awaiter(this, void 0, void 0, function () {
            var compensateResult, subscriptionPayments, subscriptionIds, subscriptions, updateSubscriptionResult, plannings, _i, plannings_1, planning, saveOrderResult;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (!orderCancel.hasCompensation()) return [3 /*break*/, 2];
                        return [4 /*yield*/, this.compensateOrder(order, orderCancel.compensation)];
                    case 1:
                        compensateResult = _a.sent();
                        if (!compensateResult) {
                            console.warn(compensateResult);
                        }
                        _a.label = 2;
                    case 2:
                        if (!orderCancel.returnSubsPayments) return [3 /*break*/, 4];
                        subscriptionPayments = order.paymentsOfType(ts_altea_model_1.PaymentType.subs);
                        subscriptionIds = subscriptionPayments.map(function (pay) { return pay.subsId; });
                        return [4 /*yield*/, this.alteaDb.getSubscriptionsByIds(subscriptionIds)];
                    case 3:
                        subscriptions = _a.sent();
                        subscriptions.forEach(function (subscription) {
                            if (subscription.usedQty <= 0)
                                return;
                            subscription.usedQty = subscription.usedQty - 1;
                            // re-activate again if previously inactive (because it might have been completly used)
                            subscription.act = true;
                        });
                        updateSubscriptionResult = this.alteaDb.updateSubscriptions(subscriptions, ['usedQty', 'act']);
                        _a.label = 4;
                    case 4:
                        order.state = ts_altea_model_1.OrderState.cancelled;
                        order.act = false;
                        order.m.setDirty('state', 'act');
                        plannings = order.planning;
                        if (!ts_common_1.ArrayHelper.IsEmpty(plannings)) return [3 /*break*/, 6];
                        return [4 /*yield*/, this.alteaDb.getResourcePlanningsByOrderId(order.id)];
                    case 5:
                        plannings = _a.sent();
                        order.planning = plannings;
                        _a.label = 6;
                    case 6:
                        if (!ts_common_1.ArrayHelper.IsEmpty(plannings)) {
                            for (_i = 0, plannings_1 = plannings; _i < plannings_1.length; _i++) {
                                planning = plannings_1[_i];
                                planning.act = false;
                                planning.m.setDirty('act');
                            }
                        }
                        if (orderCancel.hasCompensation())
                            this.handlePayments(order, orderCancel.compensation);
                        return [4 /*yield*/, this.alteaDb.saveOrder(order)];
                    case 7:
                        saveOrderResult = _a.sent();
                        console.warn(saveOrderResult);
                        return [2 /*return*/, saveOrderResult
                            /*   OLD LOGIC
                    
                                    const checkResponse = await this.checks(order)
                            
                                    if (checkResponse.hasProblems())
                                        return checkResponse
                            
                            
                                    return checkResponse
                            
                                    await this.handlePayments(order)
                            
                                    return CancelOrderResponse.success
                                 */
                        ];
                }
            });
        });
    };
    CancelOrder.prototype.compensateOrder = function (order, amountToCompensate) {
        return __awaiter(this, void 0, void 0, function () {
            var cancelOrderActions, amountStillToCompensate, giftPaysNotDeclared, giftIds, gifts, giftsToUpdate, _loop_1, _i, giftPaysNotDeclared_1, giftPay, state_1, updateGiftResult, res;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        cancelOrderActions = new CancelOrderActions();
                        amountStillToCompensate = amountToCompensate;
                        giftPaysNotDeclared = order.payments.filter(function (p) { return p.type == ts_altea_model_1.PaymentType.gift && !p.decl && p.act && p.giftId; });
                        if (!ts_common_1.ArrayHelper.AtLeastOneItem(giftPaysNotDeclared)) return [3 /*break*/, 3];
                        // order by amount from highest to lowest
                        giftPaysNotDeclared = _.orderBy(giftPaysNotDeclared, ['amount'], ['desc']);
                        giftIds = giftPaysNotDeclared.map(function (gift) { return gift.id; });
                        return [4 /*yield*/, this.alteaDb.getGiftsByIds(giftIds)];
                    case 1:
                        gifts = _a.sent();
                        giftsToUpdate = [];
                        _loop_1 = function (giftPay) {
                            var gift = gifts.find(function (g) { return g.id == giftPay.giftId; });
                            if (!gift)
                                return "continue";
                            var origUsed = gift.used;
                            var freeGiftAmount = Math.min(giftPay.amount, amountStillToCompensate);
                            gift.free(freeGiftAmount);
                            giftsToUpdate.push(gift);
                            // keep track of this action
                            var giftAction = new CancelOrderGiftAction(CancelOrderActionType.incrementUsedGift, gift.id, gift.code, gift.value, false, origUsed, gift.used);
                            cancelOrderActions.add(giftAction);
                            amountStillToCompensate -= freeGiftAmount;
                            if (amountStillToCompensate <= 0)
                                return "break";
                        };
                        for (_i = 0, giftPaysNotDeclared_1 = giftPaysNotDeclared; _i < giftPaysNotDeclared_1.length; _i++) {
                            giftPay = giftPaysNotDeclared_1[_i];
                            state_1 = _loop_1(giftPay);
                            if (state_1 === "break")
                                break;
                        }
                        if (!ts_common_1.ArrayHelper.AtLeastOneItem(giftsToUpdate)) return [3 /*break*/, 3];
                        return [4 /*yield*/, this.alteaDb.updateGifts(giftsToUpdate, ['used', 'isConsumed'])];
                    case 2:
                        updateGiftResult = _a.sent();
                        console.warn(updateGiftResult);
                        if (updateGiftResult.isOk && ts_common_1.ArrayHelper.AtLeastOneItem(updateGiftResult.data)) {
                            updateGiftResult.data.forEach(function (gift) {
                                var cancelAction = cancelOrderActions.getById(gift.id);
                                cancelAction.ok = true;
                            });
                        }
                        _a.label = 3;
                    case 3:
                        if (!(amountStillToCompensate > 0)) return [3 /*break*/, 5];
                        return [4 /*yield*/, this.createCompensationGiftOrder(amountStillToCompensate, order)];
                    case 4:
                        res = _a.sent();
                        _a.label = 5;
                    case 5: return [2 /*return*/, cancelOrderActions];
                }
            });
        });
    };
    // to remove
    CancelOrder.prototype.handlePayments = function (order, amountToCompensate) {
        return __awaiter(this, void 0, void 0, function () {
            var giftsToRelease, subscriptionsToRelease, _i, _a, pay, giftId, already, cancelActions, line, pay, saveOrderResult;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        giftsToRelease = new Map();
                        subscriptionsToRelease = [];
                        //  let amountToCompensate = 0
                        for (_i = 0, _a = order.payments; _i < _a.length; _i++) {
                            pay = _a[_i];
                            switch (pay.type) {
                                case ts_altea_model_1.PaymentType.gift:
                                    if (!pay.giftId) // this type of payment should have a gift id specified
                                        break;
                                    giftId = pay.giftId;
                                    already = 0;
                                    if (giftsToRelease.has(giftId))
                                        already = giftsToRelease.get(giftId);
                                    giftsToRelease.set(giftId, already + pay.amount);
                                    break;
                                case ts_altea_model_1.PaymentType.subs:
                                    if (!pay.subsId) // this type of payment should have a subscription id specified
                                        break;
                                    subscriptionsToRelease.push(pay.subsId);
                                    break;
                                case ts_altea_model_1.PaymentType.cash:
                                case ts_altea_model_1.PaymentType.transfer:
                                case ts_altea_model_1.PaymentType.debit:
                                case ts_altea_model_1.PaymentType.credit:
                                case ts_altea_model_1.PaymentType.stripe:
                                    amountToCompensate += pay.amount;
                                    break;
                            }
                        }
                        if (!(amountToCompensate > 0)) return [3 /*break*/, 3];
                        return [4 /*yield*/, this.createCompensationGiftOrder(amountToCompensate, order)];
                    case 1:
                        cancelActions = _b.sent();
                        console.error(cancelActions);
                        if (!cancelActions.isOk())
                            return [2 /*return*/, cancelActions];
                        line = new ts_altea_model_1.OrderLine();
                        line.unit = -amountToCompensate;
                        line.descr = 'Move value to new order/gift';
                        line.vatPct = 0;
                        line.json = cancelActions;
                        order.addLine(line, false);
                        pay = new ts_altea_model_1.Payment();
                        pay.type = ts_altea_model_1.PaymentType.cash;
                        pay.amount = -amountToCompensate;
                        //pay.orderId = order.id
                        order.addPayment(pay);
                        return [4 /*yield*/, this.alteaDb.saveOrder(order)];
                    case 2:
                        saveOrderResult = _b.sent();
                        return [2 /*return*/, saveOrderResult];
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    CancelOrder.prototype.createCompensationGiftOrder = function (amount, origOrder) {
        return __awaiter(this, void 0, void 0, function () {
            var cancelOrderActions, branch, order, line, pay, saveOrderResult, savedOrder, cancelAction, newOrder, gift, createGiftResult, giftAction;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        cancelOrderActions = new CancelOrderActions();
                        branch = origOrder.branch;
                        order = new ts_altea_model_1.Order(branch.unique, true);
                        order.branchId = origOrder.branchId;
                        order.branch = origOrder.branch;
                        order.contactId = origOrder.contactId;
                        order.state = ts_altea_model_1.OrderState.finished;
                        line = new ts_altea_model_1.OrderLine();
                        line.unit = amount;
                        //  line.orderId = order.id
                        line.descr = 'Gift for canceled order';
                        line.vatPct = 0;
                        order.addLine(line, false);
                        pay = new ts_altea_model_1.Payment();
                        pay.type = ts_altea_model_1.PaymentType.cash;
                        pay.amount = amount;
                        //pay.orderId = order.id
                        order.payments.push(pay);
                        return [4 /*yield*/, this.alteaDb.saveOrder(order)];
                    case 1:
                        saveOrderResult = _a.sent();
                        savedOrder = saveOrderResult.object;
                        cancelAction = new CancelOrderAction(CancelOrderActionType.newGiftOrder, savedOrder.id, saveOrderResult.isOk);
                        cancelOrderActions.add(cancelAction);
                        if (!saveOrderResult.isOk)
                            return [2 /*return*/, cancelOrderActions];
                        newOrder = saveOrderResult.object;
                        gift = new ts_altea_model_1.Gift(true, true);
                        gift.toId = origOrder.contactId;
                        gift.branchId = origOrder.branchId;
                        gift.type = ts_altea_model_1.GiftType.amount;
                        gift.value = amount;
                        gift.orderId = newOrder.id;
                        if (origOrder.contact) {
                            gift.toName = origOrder.contact.name;
                            gift.toEmail = origOrder.contact.email;
                            gift.methods.emailTo = true;
                        }
                        return [4 /*yield*/, this.alteaDb.createGift(gift)];
                    case 2:
                        createGiftResult = _a.sent();
                        giftAction = new CancelOrderGiftAction(CancelOrderActionType.createCompensationGift, gift.id, gift.code, gift.value, createGiftResult.isOk);
                        cancelOrderActions.add(giftAction);
                        return [2 /*return*/, cancelOrderActions];
                }
            });
        });
    };
    return CancelOrder;
}());
exports.CancelOrder = CancelOrder;
