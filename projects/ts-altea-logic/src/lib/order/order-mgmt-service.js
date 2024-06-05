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
exports.OrderMgmtService = void 0;
/* eslint-disable @typescript-eslint/no-non-null-assertion */
var ts_common_1 = require("ts-common");
var ts_altea_model_1 = require("ts-altea-model");
var altea_db_1 = require("../general/altea-db");
var dateFns = require("date-fns");
var order_messaging_1 = require("./messaging/order-messaging");
var OrderMgmtService = /** @class */ (function () {
    function OrderMgmtService(db) {
        if (db instanceof altea_db_1.AlteaDb)
            this.alteaDb = db;
        else
            this.alteaDb = new altea_db_1.AlteaDb(db);
    }
    OrderMgmtService.prototype.saveOrder = function (order) {
        return __awaiter(this, void 0, void 0, function () {
            var orderApiResult;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.alteaDb.saveOrder(order)];
                    case 1:
                        orderApiResult = _a.sent();
                        return [2 /*return*/, orderApiResult];
                }
            });
        });
    };
    OrderMgmtService.prototype.changeState = function (order, newState) {
        return __awaiter(this, void 0, void 0, function () {
            var msgSvc, _a, result;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        msgSvc = new order_messaging_1.OrderMessaging(this.alteaDb);
                        order.state = newState;
                        order.m.setDirty('state');
                        _a = newState;
                        switch (_a) {
                            case ts_altea_model_1.OrderState.created: return [3 /*break*/, 1];
                            case ts_altea_model_1.OrderState.confirmed: return [3 /*break*/, 4];
                            case ts_altea_model_1.OrderState.waitDeposit: return [3 /*break*/, 6];
                        }
                        return [3 /*break*/, 7];
                    case 1:
                        if (!(order.src == ts_altea_model_1.OrderSource.pos && order.deposit > 0 && order.paid < order.deposit)) return [3 /*break*/, 3];
                        return [4 /*yield*/, msgSvc.depositMessaging(order)];
                    case 2:
                        _b.sent();
                        order.state = ts_altea_model_1.OrderState.waitDeposit;
                        order.m.setDirty('state');
                        _b.label = 3;
                    case 3: return [3 /*break*/, 7];
                    case 4: return [4 /*yield*/, msgSvc.confirmationMessaging(order)];
                    case 5:
                        _b.sent();
                        order.state = ts_altea_model_1.OrderState.waitDeposit;
                        order.m.setDirty('state');
                        return [3 /*break*/, 7];
                    case 6:
                        order.depositBy = ts_common_1.DateHelper.yyyyMMddhhmmss();
                        order.m.setDirty('depositBy');
                        return [3 /*break*/, 7];
                    case 7:
                        console.warn(order);
                        return [4 /*yield*/, this.alteaDb.saveOrder(order)];
                    case 8:
                        result = _b.sent();
                        return [2 /*return*/, result];
                }
            });
        });
    };
    /**
     * Saves the order, calculates & saves the resource plannings based on previously determined calculated solution
     * @param order
     * @param reservationOption
     * @param solution
     * @returns
     */
    OrderMgmtService.prototype.confirmOrder = function (order, reservationOption, solution) {
        return __awaiter(this, void 0, void 0, function () {
            var response, orderApiResult, planningResult;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        order.start = reservationOption.dateNum;
                        order.m.setDirty('start');
                        response = new ts_altea_model_1.ConfirmOrderResponse();
                        response.plannings = this.createResourcePlanningsForNewOrder(order, reservationOption, solution);
                        console.info(response.plannings);
                        return [4 /*yield*/, this.alteaDb.saveOrder(order)];
                    case 1:
                        orderApiResult = _a.sent();
                        if (orderApiResult.status != ts_common_1.ApiStatus.ok) {
                            console.error(orderApiResult);
                            return [2 /*return*/, undefined];
                        }
                        response.order = orderApiResult.object;
                        return [4 /*yield*/, this.alteaDb.saveResourcePlannings(response.plannings)];
                    case 2:
                        planningResult = _a.sent();
                        return [2 /*return*/, response
                            /** Save all the resource plannings */
                        ];
                }
            });
        });
    };
    OrderMgmtService.prototype.createResourcePlanningsForNewOrder = function (order, reservationOption, solution) {
        var plannings = [];
        var refDate = reservationOption.date;
        for (var _i = 0, _a = solution.items; _i < _a.length; _i++) {
            var solItem = _a[_i];
            var requestItem = solItem.request;
            var startDate = dateFns.addSeconds(refDate, requestItem.offset.seconds);
            var endDate = dateFns.addSeconds(startDate, requestItem.duration.seconds);
            var productInfo = new ts_altea_model_1.PlanningProductInfo(requestItem.product.name);
            var contactInfo = new ts_altea_model_1.PlanningContactInfo();
            if (order.contact) {
                contactInfo.fst = order.contact.first;
                contactInfo.lst = order.contact.last;
            }
            /** Sometime we don't allocate the individual resource, but we allocate the resourcegroup  */
            var groupAlloc = requestItem.productResource.groupAlloc && requestItem.productResource.resource.isGroup;
            var resourceGroup = requestItem.productResource.resource;
            for (var i = 0; i < requestItem.qty; i++) {
                var resource = solItem.resources[i];
                var resPlan = new ts_altea_model_1.ResourcePlanning();
                resPlan.branchId = order.branchId;
                resPlan.start = ts_common_1.DateHelper.yyyyMMddhhmmss(startDate);
                resPlan.end = ts_common_1.DateHelper.yyyyMMddhhmmss(endDate);
                var resourceInfo = new ts_altea_model_1.PlanningResourceInfo(resource.name, resource.type);
                if (groupAlloc) {
                    resPlan.resourceGroupId = resourceGroup.id;
                    resPlan.resourceGroup = resourceGroup;
                    resourceInfo = new ts_altea_model_1.PlanningResourceInfo(resourceGroup.name, resource.type);
                }
                else {
                    resPlan.resourceId = resource.id;
                    resPlan.resource = resource;
                }
                /** info will be stored as json inside resourcePlanning */
                var info = new ts_altea_model_1.PlanningInfo(productInfo, contactInfo, resourceInfo);
                resPlan.info = info;
                resPlan.orderId = order.id;
                resPlan.orderLineId = requestItem.orderLine.id;
                resPlan.prep = requestItem.productResource.prep;
                resPlan.overlap = requestItem.productResource.prepOverlap;
                plannings.push(resPlan);
            }
            for (var _b = 0, _c = solItem.resources; _b < _c.length; _b++) {
                var resource = _c[_b];
            }
        }
        return plannings;
    };
    OrderMgmtService.prototype.calculateDeposit = function (order) {
        var _a, _b, _c;
        return __awaiter(this, void 0, void 0, function () {
            var branch, defaultDepositPct, deposit, _i, _d, line, depositPct, depositValue;
            return __generator(this, function (_e) {
                switch (_e.label) {
                    case 0:
                        if (!order || !order.hasLines())
                            return [2 /*return*/, 0];
                        branch = order.branch;
                        if (!!branch) return [3 /*break*/, 2];
                        if (!order.branchId)
                            throw new Error('order.branchId not specified');
                        return [4 /*yield*/, this.alteaDb.getBranch(order.branchId)];
                    case 1:
                        branch = _e.sent();
                        _e.label = 2;
                    case 2:
                        if (!branch)
                            throw new Error('branch not found for order!');
                        defaultDepositPct = (_a = branch.depositPct) !== null && _a !== void 0 ? _a : 0;
                        deposit = 0;
                        for (_i = 0, _d = order.lines; _i < _d.length; _i++) {
                            line = _d[_i];
                            depositPct = (_c = (_b = line === null || line === void 0 ? void 0 : line.product) === null || _b === void 0 ? void 0 : _b.depositPct) !== null && _c !== void 0 ? _c : defaultDepositPct;
                            if (depositPct == 0)
                                continue;
                            depositPct = depositPct / 100;
                            depositValue = line.incl * depositPct;
                            deposit += depositValue;
                        }
                        return [2 /*return*/, deposit];
                }
            });
        });
    };
    return OrderMgmtService;
}());
exports.OrderMgmtService = OrderMgmtService;
