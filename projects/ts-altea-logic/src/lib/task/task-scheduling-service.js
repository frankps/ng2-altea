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
exports.TaskSchedulingService = void 0;
/* eslint-disable @typescript-eslint/no-non-null-assertion */
var ts_common_1 = require("ts-common");
var ts_altea_model_1 = require("ts-altea-model");
var altea_db_1 = require("../general/altea-db");
var dateFns = require("date-fns");
var _ = require("lodash");
var TaskSchedulingService = /** @class */ (function () {
    function TaskSchedulingService(db) {
        if (db instanceof altea_db_1.AlteaDb)
            this.alteaDb = db;
        else
            this.alteaDb = new altea_db_1.AlteaDb(db);
    }
    TaskSchedulingService.prototype.instantiateRecurringTasks = function (includeLessFrequentTasks) {
        if (includeLessFrequentTasks === void 0) { includeLessFrequentTasks = true; }
        return __awaiter(this, void 0, void 0, function () {
            var recurTasks, newRecurTaskInstances, newDayTasks, newTwiceAWeekTasks, newWeekTasks, newMonthTasks, newQuarterTasks, newTasks, dbNewTasks, res, error_1;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 9, , 10]);
                        console.error('instantiateRecurringTasks');
                        return [4 /*yield*/, this.alteaDb.getRecurringTasks()];
                    case 1:
                        recurTasks = _a.sent();
                        newRecurTaskInstances = [];
                        return [4 /*yield*/, this.tasksToPerformForPeriod(recurTasks, ts_altea_model_1.TaskSchedule.daily)];
                    case 2:
                        newDayTasks = _a.sent();
                        return [4 /*yield*/, this.tasksToPerformForPeriod(recurTasks, ts_altea_model_1.TaskSchedule.twiceAWeek)];
                    case 3:
                        newTwiceAWeekTasks = _a.sent();
                        newWeekTasks = [];
                        newMonthTasks = [];
                        newQuarterTasks = [];
                        if (!includeLessFrequentTasks) return [3 /*break*/, 7];
                        return [4 /*yield*/, this.tasksToPerformForPeriod(recurTasks, ts_altea_model_1.TaskSchedule.weekly)];
                    case 4:
                        newWeekTasks = _a.sent();
                        return [4 /*yield*/, this.tasksToPerformForPeriod(recurTasks, ts_altea_model_1.TaskSchedule.monthly)];
                    case 5:
                        newMonthTasks = _a.sent();
                        return [4 /*yield*/, this.tasksToPerformForPeriod(recurTasks, ts_altea_model_1.TaskSchedule.quarterly)];
                    case 6:
                        newQuarterTasks = _a.sent();
                        _a.label = 7;
                    case 7:
                        newRecurTaskInstances.push.apply(newRecurTaskInstances, __spreadArray(__spreadArray(__spreadArray(__spreadArray(__spreadArray([], newDayTasks, false), newTwiceAWeekTasks, false), newWeekTasks, false), newMonthTasks, false), newQuarterTasks, false));
                        // still to do: days, months
                        if (newRecurTaskInstances.length == 0) {
                            console.log("No new tasks!");
                            return [2 /*return*/, new ts_common_1.ApiListResult([], ts_common_1.ApiStatus.ok, 'No new tasks!')];
                        }
                        newTasks = this.makeConcreteTasks(newRecurTaskInstances);
                        dbNewTasks = new ts_common_1.DbObjectMultiCreate('task', ts_altea_model_1.Task, newTasks);
                        return [4 /*yield*/, this.alteaDb.db.createMany$(dbNewTasks)];
                    case 8:
                        res = _a.sent();
                        console.error(res);
                        return [2 /*return*/, res];
                    case 9:
                        error_1 = _a.sent();
                        console.error(error_1);
                        throw error_1;
                    case 10: return [2 /*return*/];
                }
            });
        });
    };
    TaskSchedulingService.prototype.makeConcreteTasks = function (recurTasks) {
        if (!Array.isArray(recurTasks))
            return [];
        var instances = recurTasks.map(function (rTask) { return rTask.toInstance(); });
        return instances;
    };
    TaskSchedulingService.prototype.tasksToPerformForPeriod = function (recurTasks, schedule) {
        return __awaiter(this, void 0, void 0, function () {
            var periodTasks, periodTaskIds, finishedAfter, tasksForPeriod, finishedTasks, finishedPeriodTaskIds, existingToDos, existingToDoIds, toDoPeriodTaskIds, toDo;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        periodTasks = recurTasks.filter(function (t) { return t.schedule == schedule; });
                        if (!Array.isArray(periodTasks) || periodTasks.length == 0)
                            return [2 /*return*/, []];
                        periodTaskIds = periodTasks.map(function (task) { return task.id; });
                        finishedAfter = new Date();
                        switch (schedule) {
                            case ts_altea_model_1.TaskSchedule.daily:
                                //finishedAfter = dateFns.addDays(finishedAfter, -1)
                                finishedAfter = dateFns.startOfDay(finishedAfter);
                                break;
                            case ts_altea_model_1.TaskSchedule.twiceAWeek:
                                finishedAfter = dateFns.addDays(finishedAfter, -3);
                                break;
                            case ts_altea_model_1.TaskSchedule.weekly:
                                finishedAfter = dateFns.addWeeks(finishedAfter, -1);
                                break;
                            case ts_altea_model_1.TaskSchedule.twiceAMonth:
                                finishedAfter = dateFns.addWeeks(finishedAfter, -2);
                                break;
                            case ts_altea_model_1.TaskSchedule.monthly:
                                finishedAfter = dateFns.addMonths(finishedAfter, -1);
                                break;
                            case ts_altea_model_1.TaskSchedule.quarterly:
                                finishedAfter = dateFns.addMonths(finishedAfter, -3);
                                break;
                            default:
                                return [2 /*return*/, []];
                        }
                        return [4 /*yield*/, this.alteaDb.getTasksToDoORFinishedAfter(periodTaskIds, finishedAfter)
                            // finished tasks within period (=> it's ok, task is finished for period => no need to recreate at this moment)
                        ];
                    case 1:
                        tasksForPeriod = _a.sent();
                        finishedTasks = tasksForPeriod.filter(function (t) { return t.status == ts_altea_model_1.TaskStatus.done || t.status == ts_altea_model_1.TaskStatus.skip; });
                        finishedPeriodTaskIds = finishedTasks.map(function (t) { return t.rTaskId; });
                        existingToDos = tasksForPeriod.filter(function (t) { return t.status == ts_altea_model_1.TaskStatus.todo || t.status == ts_altea_model_1.TaskStatus.progress; });
                        existingToDoIds = existingToDos.map(function (t) { return t.rTaskId; });
                        toDoPeriodTaskIds = _.difference(periodTaskIds, finishedPeriodTaskIds);
                        toDoPeriodTaskIds = _.difference(toDoPeriodTaskIds, existingToDoIds);
                        if (toDoPeriodTaskIds.length == 0)
                            return [2 /*return*/, []];
                        toDo = recurTasks.filter(function (t) { return toDoPeriodTaskIds.indexOf(t.id) >= 0; });
                        return [2 /*return*/, toDo];
                }
            });
        });
    };
    return TaskSchedulingService;
}());
exports.TaskSchedulingService = TaskSchedulingService;
