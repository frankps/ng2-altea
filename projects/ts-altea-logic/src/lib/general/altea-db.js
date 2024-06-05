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
var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AlteaDb = void 0;
var ts_common_1 = require("ts-common");
var ts_altea_model_1 = require("ts-altea-model");
var AlteaDb = /** @class */ (function () {
    function AlteaDb(db, branchId) {
        this.db = db;
        this.branchId = branchId;
    }
    AlteaDb.prototype.testApi = function () {
        return __awaiter(this, void 0, void 0, function () {
            var org, res;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        org = new ts_altea_model_1.Organisation();
                        org.name = 'demo 1';
                        return [4 /*yield*/, this.db.create$(org.asDbObject())];
                    case 1:
                        res = _a.sent();
                        console.warn(res);
                        return [2 /*return*/, res];
                }
            });
        });
    };
    AlteaDb.prototype.saveOrder = function (order) {
        var _a;
        return __awaiter(this, void 0, void 0, function () {
            var orderClone, res;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        orderClone = order.clone();
                        delete orderClone['branch'];
                        delete orderClone['contact'];
                        (_a = orderClone.lines) === null || _a === void 0 ? void 0 : _a.forEach(function (l) {
                            delete l['product'];
                            delete l['orderId'];
                            //l.product = undefinedf
                        });
                        /*         orderClone.info = undefined
                                orderClone.persons = undefined
                         */
                        console.log(orderClone);
                        return [4 /*yield*/, this.db.saveOrder$(orderClone)];
                    case 1:
                        res = _b.sent();
                        console.warn(res);
                        return [2 /*return*/, res];
                }
            });
        });
    };
    AlteaDb.prototype.getBranch = function (branchId) {
        return __awaiter(this, void 0, void 0, function () {
            var qry, branch;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (!branchId)
                            return [2 /*return*/, undefined];
                        qry = new ts_common_1.DbQueryTyped('branch', ts_altea_model_1.Branch);
                        qry.and('id', ts_common_1.QueryOperator.equals, branchId);
                        return [4 /*yield*/, this.db.queryFirst$(qry)];
                    case 1:
                        branch = _a.sent();
                        return [2 /*return*/, branch];
                }
            });
        });
    };
    AlteaDb.prototype.getBranches = function (branchIds) {
        return __awaiter(this, void 0, void 0, function () {
            var qry, branches;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (!Array.isArray(branchIds) || branchIds.length == 0)
                            return [2 /*return*/, []];
                        qry = new ts_common_1.DbQueryTyped('branch', ts_altea_model_1.Branch);
                        qry.and('id', ts_common_1.QueryOperator.in, branchIds);
                        return [4 /*yield*/, this.db.query$(qry)];
                    case 1:
                        branches = _a.sent();
                        return [2 /*return*/, branches];
                }
            });
        });
    };
    AlteaDb.prototype.getExpiredDepositOrders = function () {
        return __awaiter(this, void 0, void 0, function () {
            var now, qry, templates;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        now = ts_common_1.DateHelper.yyyyMMddhhmmss();
                        qry = new ts_common_1.DbQueryTyped('order', ts_altea_model_1.Order);
                        qry.and('state', ts_common_1.QueryOperator.equals, ts_altea_model_1.OrderState.waitDeposit);
                        qry.and('depositBy', ts_common_1.QueryOperator.lessThan, now);
                        qry.include('contact', 'lines');
                        return [4 /*yield*/, this.db.query$(qry)];
                    case 1:
                        templates = _a.sent();
                        return [2 /*return*/, templates];
                }
            });
        });
    };
    AlteaDb.prototype.getOrders = function (state) {
        return __awaiter(this, void 0, void 0, function () {
            var qry, templates;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        qry = new ts_common_1.DbQueryTyped('order', ts_altea_model_1.Order);
                        // qry.and('branchId', QueryOperator.equals, branchId)
                        qry.and('state', ts_common_1.QueryOperator.equals, state);
                        return [4 /*yield*/, this.db.query$(qry)];
                    case 1:
                        templates = _a.sent();
                        return [2 /*return*/, templates];
                }
            });
        });
    };
    AlteaDb.prototype.getTemplatesForBranches = function (branchIds, code) {
        return __awaiter(this, void 0, void 0, function () {
            var qry, templates;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        qry = new ts_common_1.DbQueryTyped('template', ts_altea_model_1.Template);
                        qry.and('branchId', ts_common_1.QueryOperator.in, branchIds);
                        qry.and('code', ts_common_1.QueryOperator.equals, code);
                        return [4 /*yield*/, this.db.query$(qry)];
                    case 1:
                        templates = _a.sent();
                        return [2 /*return*/, templates];
                }
            });
        });
    };
    AlteaDb.prototype.getTemplates = function (branchId, code) {
        return __awaiter(this, void 0, void 0, function () {
            var qry, templates;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        qry = new ts_common_1.DbQueryTyped('template', ts_altea_model_1.Template);
                        qry.and('branchId', ts_common_1.QueryOperator.equals, branchId);
                        qry.and('code', ts_common_1.QueryOperator.equals, code);
                        return [4 /*yield*/, this.db.query$(qry)];
                    case 1:
                        templates = _a.sent();
                        return [2 /*return*/, templates];
                }
            });
        });
    };
    AlteaDb.prototype.getMessages = function (branchId, orderId, code, fields) {
        return __awaiter(this, void 0, void 0, function () {
            var qry, messages;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        qry = new ts_common_1.DbQueryTyped('message', ts_altea_model_1.Message);
                        if (fields)
                            qry.select.apply(qry, fields);
                        qry.and('branchId', ts_common_1.QueryOperator.equals, branchId);
                        qry.and('orderId', ts_common_1.QueryOperator.equals, orderId);
                        qry.and('code', ts_common_1.QueryOperator.equals, code);
                        return [4 /*yield*/, this.db.query$(qry)];
                    case 1:
                        messages = _a.sent();
                        return [2 /*return*/, messages];
                }
            });
        });
    };
    AlteaDb.prototype.getProducts = function (productIds) {
        var includes = [];
        for (var _i = 1; _i < arguments.length; _i++) {
            includes[_i - 1] = arguments[_i];
        }
        return __awaiter(this, void 0, void 0, function () {
            var qry, products;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        qry = new ts_common_1.DbQueryTyped('product', ts_altea_model_1.Product);
                        qry.and('id', ts_common_1.QueryOperator.in, productIds);
                        if (Array.isArray(includes) && includes.length > 0)
                            qry.include.apply(qry, includes);
                        return [4 /*yield*/, this.db.query$(qry)];
                    case 1:
                        products = _a.sent();
                        return [2 /*return*/, products];
                }
            });
        });
    };
    AlteaDb.prototype.getResources = function (resourceIds) {
        var includes = [];
        for (var _i = 1; _i < arguments.length; _i++) {
            includes[_i - 1] = arguments[_i];
        }
        return __awaiter(this, void 0, void 0, function () {
            var qry, resources;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        qry = new ts_common_1.DbQueryTyped('resource', ts_altea_model_1.Resource);
                        qry.and('id', ts_common_1.QueryOperator.in, resourceIds);
                        if (Array.isArray(includes) && includes.length > 0)
                            qry.include.apply(qry, includes);
                        return [4 /*yield*/, this.db.query$(qry)];
                    case 1:
                        resources = _a.sent();
                        return [2 /*return*/, resources];
                }
            });
        });
    };
    AlteaDb.prototype.scheduleGetDefault = function (branchId) {
        return __awaiter(this, void 0, void 0, function () {
            var defaultScheduleQry, defaultSchedule;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        defaultScheduleQry = new ts_common_1.DbQueryTyped('schedule', ts_altea_model_1.Schedule);
                        /* Every branch has a resource with the same id
                        */
                        defaultScheduleQry.and('resourceId', ts_common_1.QueryOperator.equals, branchId);
                        defaultScheduleQry.and('default', ts_common_1.QueryOperator.equals, true);
                        return [4 /*yield*/, this.db.queryFirst$(defaultScheduleQry)];
                    case 1:
                        defaultSchedule = _a.sent();
                        return [2 /*return*/, defaultSchedule];
                }
            });
        });
    };
    AlteaDb.prototype.branchSchedules = function (branchId) {
        return __awaiter(this, void 0, void 0, function () {
            var scheduleQry, defaultSchedule;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (!branchId)
                            branchId = this.branchId;
                        scheduleQry = new ts_common_1.DbQueryTyped('schedule', ts_altea_model_1.Schedule);
                        scheduleQry.select('id', 'name');
                        /* Every branch has a resource with the same id
                        */
                        scheduleQry.and('branchId', ts_common_1.QueryOperator.equals, branchId);
                        scheduleQry.and('resourceId', ts_common_1.QueryOperator.equals, branchId);
                        scheduleQry.orderBy('idx');
                        return [4 /*yield*/, this.db.query$(scheduleQry)];
                    case 1:
                        defaultSchedule = _a.sent();
                        return [2 /*return*/, defaultSchedule];
                }
            });
        });
    };
    AlteaDb.prototype.resourcePlannings = function (from, to, resourceIds) {
        return __awaiter(this, void 0, void 0, function () {
            var qry, resourcePlannings;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        console.warn('Loading resource plannings ... ');
                        qry = new ts_common_1.DbQueryTyped('resourcePlanning', ts_altea_model_1.ResourcePlanning);
                        qry.and('end', ts_common_1.QueryOperator.greaterThanOrEqual, from);
                        qry.and('start', ts_common_1.QueryOperator.lessThanOrEqual, to);
                        qry.and('act', ts_common_1.QueryOperator.equals, true);
                        qry.and('resourceId', ts_common_1.QueryOperator.in, resourceIds);
                        return [4 /*yield*/, this.db.query$(qry)];
                    case 1:
                        resourcePlannings = _a.sent();
                        return [2 /*return*/, resourcePlannings];
                }
            });
        });
    };
    AlteaDb.prototype.schedules = function (resourceIds) {
        var includes = [];
        for (var _i = 1; _i < arguments.length; _i++) {
            includes[_i - 1] = arguments[_i];
        }
        return __awaiter(this, void 0, void 0, function () {
            var qry, schedules;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        qry = new ts_common_1.DbQueryTyped('schedule', ts_altea_model_1.Schedule);
                        qry.and('act', ts_common_1.QueryOperator.equals, true);
                        qry.or('resourceId', ts_common_1.QueryOperator.in, resourceIds);
                        // qry.or('default', QueryOperator.equals, true)
                        if (Array.isArray(includes) && includes.length > 0)
                            qry.include.apply(qry, includes);
                        return [4 /*yield*/, this.db.query$(qry)];
                    case 1:
                        schedules = _a.sent();
                        return [2 /*return*/, schedules];
                }
            });
        });
    };
    AlteaDb.prototype.getRecurringTasks = function () {
        return __awaiter(this, void 0, void 0, function () {
            var qry, tasks;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        qry = new ts_common_1.DbQueryTyped('task', ts_altea_model_1.Task);
                        qry.and('schedule', ts_common_1.QueryOperator.not, ts_altea_model_1.TaskSchedule.once);
                        qry.and('act', ts_common_1.QueryOperator.equals, true);
                        console.error(qry);
                        return [4 /*yield*/, this.db.query$(qry)];
                    case 1:
                        tasks = _a.sent();
                        console.error(tasks);
                        return [2 /*return*/, tasks];
                }
            });
        });
    };
    AlteaDb.prototype.getTasksToDoORFinishedAfter = function (recurringTaskIds, finishedAfter) {
        return __awaiter(this, void 0, void 0, function () {
            var qry, tasks;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        qry = new ts_common_1.DbQueryTyped('task', ts_altea_model_1.Task);
                        qry.select('id', 'rTaskId', 'status', 'finishedAt');
                        qry.and('rTaskId', ts_common_1.QueryOperator.in, recurringTaskIds);
                        //  qry.and('finishedAt', QueryOperator.greaterThan, finishedAfter)
                        qry.or('status', ts_common_1.QueryOperator.in, [ts_altea_model_1.TaskStatus.todo, ts_altea_model_1.TaskStatus.progress]);
                        qry.or('finishedAt', ts_common_1.QueryOperator.greaterThan, finishedAfter);
                        return [4 /*yield*/, this.db.query$(qry)];
                    case 1:
                        tasks = _a.sent();
                        return [2 /*return*/, tasks];
                }
            });
        });
    };
    /** Generic methods
     *
     *  important: generate the specific methods with the generator, use (replace typeName):
    
        {
        "type": "dbMethods",
        "typeName": "gift",
        "plural": null
        }

    */
    AlteaDb.prototype.getObjectById$ = function (typeName, type, id) {
        return __awaiter(this, void 0, void 0, function () {
            var qry, object;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        qry = new ts_common_1.DbQueryTyped(typeName, type);
                        qry.and('id', ts_common_1.QueryOperator.equals, id);
                        return [4 /*yield*/, this.db.queryFirst$(qry)];
                    case 1:
                        object = _a.sent();
                        return [2 /*return*/, object];
                }
            });
        });
    };
    AlteaDb.prototype.getObjectsByIds = function (typeName, type, ids) {
        return __awaiter(this, void 0, void 0, function () {
            var qry, objects;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (!Array.isArray(ids) || ids.length == 0)
                            return [2 /*return*/, []];
                        qry = new ts_common_1.DbQueryTyped(typeName, type);
                        qry.and('id', ts_common_1.QueryOperator.in, ids);
                        return [4 /*yield*/, this.db.query$(qry)];
                    case 1:
                        objects = _a.sent();
                        return [2 /*return*/, objects];
                }
            });
        });
    };
    AlteaDb.prototype.updateObject = function (typeName, type, object, propertiesToUpdate) {
        return __awaiter(this, void 0, void 0, function () {
            var objectToUpdate, dbObject, updateResult;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (!object)
                            return [2 /*return*/, new ts_common_1.ApiResult(null, ts_common_1.ApiStatus.error, 'No object supplied to update!')];
                        objectToUpdate = ts_common_1.ObjectHelper.extractObjectProperties(object, __spreadArray(['id'], propertiesToUpdate, true));
                        dbObject = new ts_common_1.DbObject(typeName, type, objectToUpdate);
                        return [4 /*yield*/, this.db.update$(dbObject)];
                    case 1:
                        updateResult = _a.sent();
                        return [2 /*return*/, updateResult];
                }
            });
        });
    };
    AlteaDb.prototype.updateObjects = function (typeName, type, objects, propertiesToUpdate) {
        return __awaiter(this, void 0, void 0, function () {
            var objectsToUpdate, dbObjectMany, updateResult;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (!Array.isArray(objects) || objects.length == 0)
                            return [2 /*return*/, new ts_common_1.ApiListResult([], ts_common_1.ApiStatus.ok)];
                        objectsToUpdate = ts_common_1.ObjectHelper.extractArrayProperties(objects, __spreadArray(['id'], propertiesToUpdate, true));
                        dbObjectMany = new ts_common_1.DbObjectMulti(typeName, type, objectsToUpdate);
                        return [4 /*yield*/, this.db.updateMany$(dbObjectMany)];
                    case 1:
                        updateResult = _a.sent();
                        return [2 /*return*/, updateResult];
                }
            });
        });
    };
    AlteaDb.prototype.createObject = function (typeName, type, object) {
        return __awaiter(this, void 0, void 0, function () {
            var dbObject, createResult;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        dbObject = new ts_common_1.DbObjectCreate(typeName, type, object);
                        return [4 /*yield*/, this.db.create$(dbObject)];
                    case 1:
                        createResult = _a.sent();
                        return [2 /*return*/, createResult];
                }
            });
        });
    };
    AlteaDb.prototype.createObjects = function (typeName, type, objects) {
        return __awaiter(this, void 0, void 0, function () {
            var batch, createResult;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (!Array.isArray(objects) || objects.length == 0)
                            return [2 /*return*/, new ts_common_1.ApiListResult([], ts_common_1.ApiStatus.ok)];
                        batch = new ts_common_1.DbObjectMultiCreate(typeName, type, objects);
                        return [4 /*yield*/, this.db.createMany$(batch)];
                    case 1:
                        createResult = _a.sent();
                        return [2 /*return*/, createResult];
                }
            });
        });
    };
    /** Gifts */
    AlteaDb.prototype.getGiftByOrderId = function (orderId) {
        return __awaiter(this, void 0, void 0, function () {
            var qry, object;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        qry = new ts_common_1.DbQueryTyped('gift', ts_altea_model_1.Gift);
                        qry.and('orderId', ts_common_1.QueryOperator.equals, orderId);
                        return [4 /*yield*/, this.db.queryFirst$(qry)];
                    case 1:
                        object = _a.sent();
                        return [2 /*return*/, object];
                }
            });
        });
    };
    AlteaDb.prototype.getGiftById = function (id) {
        return __awaiter(this, void 0, void 0, function () {
            var object;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.getObjectById$('gift', ts_altea_model_1.Gift, id)];
                    case 1:
                        object = _a.sent();
                        return [2 /*return*/, object];
                }
            });
        });
    };
    AlteaDb.prototype.getGiftsByIds = function (ids) {
        return __awaiter(this, void 0, void 0, function () {
            var objects;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.getObjectsByIds('gift', ts_altea_model_1.Gift, ids)];
                    case 1:
                        objects = _a.sent();
                        return [2 /*return*/, objects];
                }
            });
        });
    };
    AlteaDb.prototype.createGift = function (gift) {
        return __awaiter(this, void 0, void 0, function () {
            var createResult;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.createObject('gift', ts_altea_model_1.Gift, gift)];
                    case 1:
                        createResult = _a.sent();
                        return [2 /*return*/, createResult];
                }
            });
        });
    };
    AlteaDb.prototype.createGifts = function (gifts) {
        return __awaiter(this, void 0, void 0, function () {
            var createResult;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.createObjects('gift', ts_altea_model_1.Gift, gifts)];
                    case 1:
                        createResult = _a.sent();
                        return [2 /*return*/, createResult];
                }
            });
        });
    };
    AlteaDb.prototype.updateGift = function (gift, propertiesToUpdate) {
        return __awaiter(this, void 0, void 0, function () {
            var updateResult;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.updateObject('gift', ts_altea_model_1.Gift, gift, propertiesToUpdate)];
                    case 1:
                        updateResult = _a.sent();
                        return [2 /*return*/, updateResult];
                }
            });
        });
    };
    AlteaDb.prototype.updateGifts = function (gifts, propertiesToUpdate) {
        return __awaiter(this, void 0, void 0, function () {
            var updateResult;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.updateObjects('gift', ts_altea_model_1.Gift, gifts, propertiesToUpdate)];
                    case 1:
                        updateResult = _a.sent();
                        return [2 /*return*/, updateResult];
                }
            });
        });
    };
    /** Subscriptions */
    AlteaDb.prototype.getSubscriptionsByOrderId = function (orderId) {
        return __awaiter(this, void 0, void 0, function () {
            var qry, objects;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        qry = new ts_common_1.DbQueryTyped('subscription', ts_altea_model_1.Subscription);
                        qry.and('orderId', ts_common_1.QueryOperator.equals, orderId);
                        qry.and('act', ts_common_1.QueryOperator.equals, true);
                        qry.and('usedQty', ts_common_1.QueryOperator.greaterThan, 0);
                        return [4 /*yield*/, this.db.query$(qry)];
                    case 1:
                        objects = _a.sent();
                        return [2 /*return*/, objects];
                }
            });
        });
    };
    AlteaDb.prototype.getSubscriptionsByIds = function (ids) {
        return __awaiter(this, void 0, void 0, function () {
            var objects;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.getObjectsByIds('subscription', ts_altea_model_1.Subscription, ids)];
                    case 1:
                        objects = _a.sent();
                        return [2 /*return*/, objects];
                }
            });
        });
    };
    AlteaDb.prototype.createSubscriptions = function (subscriptions) {
        return __awaiter(this, void 0, void 0, function () {
            var createResult;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.createObjects('subscription', ts_altea_model_1.Subscription, subscriptions)];
                    case 1:
                        createResult = _a.sent();
                        return [2 /*return*/, createResult];
                }
            });
        });
    };
    AlteaDb.prototype.updateSubscription = function (subscription, propertiesToUpdate) {
        return __awaiter(this, void 0, void 0, function () {
            var updateResult;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.updateObject('subscription', ts_altea_model_1.Subscription, subscription, propertiesToUpdate)];
                    case 1:
                        updateResult = _a.sent();
                        return [2 /*return*/, updateResult];
                }
            });
        });
    };
    AlteaDb.prototype.updateSubscriptions = function (subscriptions, propertiesToUpdate) {
        return __awaiter(this, void 0, void 0, function () {
            var updateResult;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.updateObjects('subscription', ts_altea_model_1.Subscription, subscriptions, propertiesToUpdate)];
                    case 1:
                        updateResult = _a.sent();
                        return [2 /*return*/, updateResult];
                }
            });
        });
    };
    /** Orderline */
    AlteaDb.prototype.getOrderlinesByIds = function (ids) {
        return __awaiter(this, void 0, void 0, function () {
            var objects;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.getObjectsByIds('orderLine', ts_altea_model_1.OrderLine, ids)];
                    case 1:
                        objects = _a.sent();
                        return [2 /*return*/, objects];
                }
            });
        });
    };
    AlteaDb.prototype.createOrderlines = function (orderLines) {
        return __awaiter(this, void 0, void 0, function () {
            var createResult;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.createObjects('orderLine', ts_altea_model_1.OrderLine, orderLines)];
                    case 1:
                        createResult = _a.sent();
                        return [2 /*return*/, createResult];
                }
            });
        });
    };
    AlteaDb.prototype.updateOrderline = function (orderLine, propertiesToUpdate) {
        return __awaiter(this, void 0, void 0, function () {
            var updateResult;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.updateObject('orderLine', ts_altea_model_1.OrderLine, orderLine, propertiesToUpdate)];
                    case 1:
                        updateResult = _a.sent();
                        return [2 /*return*/, updateResult];
                }
            });
        });
    };
    AlteaDb.prototype.updateOrderlines = function (orderLines, propertiesToUpdate) {
        return __awaiter(this, void 0, void 0, function () {
            var updateResult;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.updateObjects('orderLine', ts_altea_model_1.OrderLine, orderLines, propertiesToUpdate)];
                    case 1:
                        updateResult = _a.sent();
                        return [2 /*return*/, updateResult];
                }
            });
        });
    };
    /** BankTransaction */
    AlteaDb.prototype.getBankTransactionsByIds = function (ids) {
        return __awaiter(this, void 0, void 0, function () {
            var objects;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.getObjectsByIds('bankTransaction', ts_altea_model_1.BankTransaction, ids)];
                    case 1:
                        objects = _a.sent();
                        return [2 /*return*/, objects];
                }
            });
        });
    };
    AlteaDb.prototype.createBankTransactions = function (bankTransactions) {
        return __awaiter(this, void 0, void 0, function () {
            var createResult;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.createObjects('bankTransaction', ts_altea_model_1.BankTransaction, bankTransactions)];
                    case 1:
                        createResult = _a.sent();
                        return [2 /*return*/, createResult];
                }
            });
        });
    };
    AlteaDb.prototype.updateBankTransaction = function (bankTransaction, propertiesToUpdate) {
        return __awaiter(this, void 0, void 0, function () {
            var updateResult;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.updateObject('bankTransaction', ts_altea_model_1.BankTransaction, bankTransaction, propertiesToUpdate)];
                    case 1:
                        updateResult = _a.sent();
                        return [2 /*return*/, updateResult];
                }
            });
        });
    };
    AlteaDb.prototype.updateBankTransactions = function (bankTransactions, propertiesToUpdate) {
        return __awaiter(this, void 0, void 0, function () {
            var updateResult;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.updateObjects('bankTransaction', ts_altea_model_1.BankTransaction, bankTransactions, propertiesToUpdate)];
                    case 1:
                        updateResult = _a.sent();
                        return [2 /*return*/, updateResult];
                }
            });
        });
    };
    /** ResourcePlanning */
    /** original (not-generated) method */
    AlteaDb.prototype.saveResourcePlannings = function (plannings) {
        return __awaiter(this, void 0, void 0, function () {
            var planningsForDb, dbPlannings, res;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        console.error('saveResourcePlannings', plannings);
                        planningsForDb = ts_common_1.ObjectHelper.unType(plannings, ['resource', 'resourceGroup', 'schedule', 'orderLine']);
                        dbPlannings = new ts_common_1.DbObjectMultiCreate('resourcePlanning', ts_altea_model_1.ResourcePlanning, planningsForDb);
                        return [4 /*yield*/, this.db.createMany$(dbPlannings)];
                    case 1:
                        res = _a.sent();
                        return [2 /*return*/, res];
                }
            });
        });
    };
    AlteaDb.prototype.getResourcePlanningsByOrderId = function (orderId) {
        return __awaiter(this, void 0, void 0, function () {
            var qry, objects;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        qry = new ts_common_1.DbQueryTyped('resourcePlanning', ts_altea_model_1.ResourcePlanning);
                        qry.and('orderId', ts_common_1.QueryOperator.equals, orderId);
                        return [4 /*yield*/, this.db.query$(qry)];
                    case 1:
                        objects = _a.sent();
                        return [2 /*return*/, objects];
                }
            });
        });
    };
    AlteaDb.prototype.getResourcePlanningById = function (id) {
        return __awaiter(this, void 0, void 0, function () {
            var object;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.getObjectById$('resourcePlanning', ts_altea_model_1.ResourcePlanning, id)];
                    case 1:
                        object = _a.sent();
                        return [2 /*return*/, object];
                }
            });
        });
    };
    AlteaDb.prototype.getResourcePlanningsByIds = function (ids) {
        return __awaiter(this, void 0, void 0, function () {
            var objects;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.getObjectsByIds('resourcePlanning', ts_altea_model_1.ResourcePlanning, ids)];
                    case 1:
                        objects = _a.sent();
                        return [2 /*return*/, objects];
                }
            });
        });
    };
    AlteaDb.prototype.createResourcePlannings = function (resourcePlannings) {
        return __awaiter(this, void 0, void 0, function () {
            var createResult;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.createObjects('resourcePlanning', ts_altea_model_1.ResourcePlanning, resourcePlannings)];
                    case 1:
                        createResult = _a.sent();
                        return [2 /*return*/, createResult];
                }
            });
        });
    };
    AlteaDb.prototype.updateResourcePlanning = function (resourcePlanning, propertiesToUpdate) {
        return __awaiter(this, void 0, void 0, function () {
            var updateResult;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.updateObject('resourcePlanning', ts_altea_model_1.ResourcePlanning, resourcePlanning, propertiesToUpdate)];
                    case 1:
                        updateResult = _a.sent();
                        return [2 /*return*/, updateResult];
                }
            });
        });
    };
    AlteaDb.prototype.updateResourcePlannings = function (resourcePlannings, propertiesToUpdate) {
        return __awaiter(this, void 0, void 0, function () {
            var updateResult;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.updateObjects('resourcePlanning', ts_altea_model_1.ResourcePlanning, resourcePlannings, propertiesToUpdate)];
                    case 1:
                        updateResult = _a.sent();
                        return [2 /*return*/, updateResult];
                }
            });
        });
    };
    AlteaDb.prototype.getLoyaltyCards = function (contactId) {
        return __awaiter(this, void 0, void 0, function () {
            var qry, cards;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (!contactId)
                            contactId = this.branchId;
                        qry = new ts_common_1.DbQueryTyped('loyaltyCard', ts_altea_model_1.LoyaltyCard);
                        qry.and('contactId', ts_common_1.QueryOperator.equals, contactId);
                        return [4 /*yield*/, this.db.query$(qry)];
                    case 1:
                        cards = _a.sent();
                        return [2 /*return*/, cards];
                }
            });
        });
    };
    AlteaDb.prototype.getLoyaltyCardById = function (id) {
        return __awaiter(this, void 0, void 0, function () {
            var object;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.getObjectById$('loyaltyCard', ts_altea_model_1.LoyaltyCard, id)];
                    case 1:
                        object = _a.sent();
                        return [2 /*return*/, object];
                }
            });
        });
    };
    AlteaDb.prototype.getLoyaltyCardsByIds = function (ids) {
        return __awaiter(this, void 0, void 0, function () {
            var objects;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.getObjectsByIds('loyaltyCard', ts_altea_model_1.LoyaltyCard, ids)];
                    case 1:
                        objects = _a.sent();
                        return [2 /*return*/, objects];
                }
            });
        });
    };
    AlteaDb.prototype.createLoyaltyCards = function (loyaltyCards) {
        return __awaiter(this, void 0, void 0, function () {
            var createResult;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.createObjects('loyaltyCard', ts_altea_model_1.LoyaltyCard, loyaltyCards)];
                    case 1:
                        createResult = _a.sent();
                        return [2 /*return*/, createResult];
                }
            });
        });
    };
    AlteaDb.prototype.updateLoyaltyCard = function (loyaltyCard, propertiesToUpdate) {
        return __awaiter(this, void 0, void 0, function () {
            var updateResult;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.updateObject('loyaltyCard', ts_altea_model_1.LoyaltyCard, loyaltyCard, propertiesToUpdate)];
                    case 1:
                        updateResult = _a.sent();
                        return [2 /*return*/, updateResult];
                }
            });
        });
    };
    AlteaDb.prototype.updateLoyaltyCards = function (loyaltyCards, propertiesToUpdate) {
        return __awaiter(this, void 0, void 0, function () {
            var updateResult;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.updateObjects('loyaltyCard', ts_altea_model_1.LoyaltyCard, loyaltyCards, propertiesToUpdate)];
                    case 1:
                        updateResult = _a.sent();
                        return [2 /*return*/, updateResult];
                }
            });
        });
    };
    AlteaDb.prototype.getLoyaltyPrograms = function (branchId) {
        return __awaiter(this, void 0, void 0, function () {
            var qry, progs;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (!branchId)
                            branchId = this.branchId;
                        qry = new ts_common_1.DbQueryTyped('loyaltyProgram', ts_altea_model_1.LoyaltyProgram);
                        qry.and('branchId', ts_common_1.QueryOperator.equals, branchId);
                        qry.orderBy('idx');
                        return [4 /*yield*/, this.db.query$(qry)];
                    case 1:
                        progs = _a.sent();
                        return [2 /*return*/, progs];
                }
            });
        });
    };
    AlteaDb.prototype.getLoyaltyProgramById = function (id) {
        return __awaiter(this, void 0, void 0, function () {
            var object;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.getObjectById$('loyaltyProgram', ts_altea_model_1.LoyaltyProgram, id)];
                    case 1:
                        object = _a.sent();
                        return [2 /*return*/, object];
                }
            });
        });
    };
    AlteaDb.prototype.getLoyaltyProgramsByIds = function (ids) {
        return __awaiter(this, void 0, void 0, function () {
            var objects;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.getObjectsByIds('loyaltyProgram', ts_altea_model_1.LoyaltyProgram, ids)];
                    case 1:
                        objects = _a.sent();
                        return [2 /*return*/, objects];
                }
            });
        });
    };
    AlteaDb.prototype.createLoyaltyPrograms = function (loyaltyPrograms) {
        return __awaiter(this, void 0, void 0, function () {
            var createResult;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.createObjects('loyaltyProgram', ts_altea_model_1.LoyaltyProgram, loyaltyPrograms)];
                    case 1:
                        createResult = _a.sent();
                        return [2 /*return*/, createResult];
                }
            });
        });
    };
    AlteaDb.prototype.updateLoyaltyProgram = function (loyaltyProgram, propertiesToUpdate) {
        return __awaiter(this, void 0, void 0, function () {
            var updateResult;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.updateObject('loyaltyProgram', ts_altea_model_1.LoyaltyProgram, loyaltyProgram, propertiesToUpdate)];
                    case 1:
                        updateResult = _a.sent();
                        return [2 /*return*/, updateResult];
                }
            });
        });
    };
    AlteaDb.prototype.updateLoyaltyPrograms = function (loyaltyPrograms, propertiesToUpdate) {
        return __awaiter(this, void 0, void 0, function () {
            var updateResult;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.updateObjects('loyaltyProgram', ts_altea_model_1.LoyaltyProgram, loyaltyPrograms, propertiesToUpdate)];
                    case 1:
                        updateResult = _a.sent();
                        return [2 /*return*/, updateResult];
                }
            });
        });
    };
    return AlteaDb;
}());
exports.AlteaDb = AlteaDb;
