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
exports.CheckDeposists = void 0;
var ts_altea_model_1 = require("ts-altea-model");
var altea_db_1 = require("../../general/altea-db");
var _ = require("lodash");
var task_hub_1 = require("../../tasks/task-hub");
var CheckDeposists = /** @class */ (function () {
    function CheckDeposists(db) {
        if (db instanceof altea_db_1.AlteaDb)
            this.alteaDb = db;
        else
            this.alteaDb = new altea_db_1.AlteaDb(db);
        this.taskHub = new task_hub_1.TaskHub(this.alteaDb);
    }
    CheckDeposists.prototype.cancelExpiredDeposists = function () {
        return __awaiter(this, void 0, void 0, function () {
            var orders, branchIds, templates, branches, _loop_1, this_1, _i, branches_1, branch;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.alteaDb.getExpiredDepositOrders()];
                    case 1:
                        orders = _a.sent();
                        console.warn(orders);
                        branchIds = _.uniqBy(orders, 'branchId').map(function (o) { return o.branchId; });
                        return [4 /*yield*/, this.alteaDb.getTemplatesForBranches(branchIds, ts_altea_model_1.OrderTemplate.noDepositCancel)];
                    case 2:
                        templates = _a.sent();
                        return [4 /*yield*/, this.alteaDb.getBranches(branchIds)];
                    case 3:
                        branches = _a.sent();
                        _loop_1 = function (branch) {
                            var branchOrders, branchTemplates, _b, branchOrders_1, order, _c, branchTemplates_1, template, msg;
                            return __generator(this, function (_d) {
                                switch (_d.label) {
                                    case 0:
                                        branchOrders = orders.filter(function (o) { return o.branchId == branch.id; });
                                        branchTemplates = templates.filter(function (t) { return t.branchId == branch.id; });
                                        if (!Array.isArray(branchTemplates) || branchTemplates.length == 0)
                                            return [2 /*return*/, "continue"];
                                        _b = 0, branchOrders_1 = branchOrders;
                                        _d.label = 1;
                                    case 1:
                                        if (!(_b < branchOrders_1.length)) return [3 /*break*/, 7];
                                        order = branchOrders_1[_b];
                                        _c = 0, branchTemplates_1 = branchTemplates;
                                        _d.label = 2;
                                    case 2:
                                        if (!(_c < branchTemplates_1.length)) return [3 /*break*/, 5];
                                        template = branchTemplates_1[_c];
                                        return [4 /*yield*/, this_1.taskHub.MessagingTasks.createEmailMessage(template, order, branch, true)];
                                    case 3:
                                        msg = _d.sent();
                                        console.warn(msg);
                                        _d.label = 4;
                                    case 4:
                                        _c++;
                                        return [3 /*break*/, 2];
                                    case 5:
                                        order.state = ts_altea_model_1.OrderState.noDepositCancel;
                                        order.m.setDirty('state');
                                        this_1.alteaDb.saveOrder(order);
                                        _d.label = 6;
                                    case 6:
                                        _b++;
                                        return [3 /*break*/, 1];
                                    case 7: return [2 /*return*/];
                                }
                            });
                        };
                        this_1 = this;
                        _i = 0, branches_1 = branches;
                        _a.label = 4;
                    case 4:
                        if (!(_i < branches_1.length)) return [3 /*break*/, 7];
                        branch = branches_1[_i];
                        return [5 /*yield**/, _loop_1(branch)];
                    case 5:
                        _a.sent();
                        _a.label = 6;
                    case 6:
                        _i++;
                        return [3 /*break*/, 4];
                    case 7: return [2 /*return*/];
                }
            });
        });
    };
    return CheckDeposists;
}());
exports.CheckDeposists = CheckDeposists;
