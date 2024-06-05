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
exports.OrderMessaging = void 0;
/* eslint-disable @typescript-eslint/no-non-null-assertion */
var ts_common_1 = require("ts-common");
var _ = require("lodash");
var order_messaging_base_1 = require("./order-messaging-base");
/**
 * Mogelijkheden:
 
Door klant gemaakt order:
 * reeds betaald => stuur confirmatie
  
Intern gemaakt:
 * reeds betaald (deposit>=paid, bv met gift) of geen betaling nodig (deposit=0)
    => stuur confirmatie
 * nog niet betaald:
 *
 
Different kinds of messages:

* deposit related (depost>0 AND deposit<=paid)
    send reminders to make deposit

* confirmation:
    when no deposit needed
    or when deposit was done (paid>=deposit)

* reminders:
    send reminders for reservation

* cancellation

 */
var OrderMessaging = /** @class */ (function (_super) {
    __extends(OrderMessaging, _super);
    function OrderMessaging(db) {
        return _super.call(this, db) || this;
    }
    OrderMessaging.prototype.doMessaging = function (order) {
        return __awaiter(this, void 0, void 0, function () {
            var now;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (!order)
                            return [2 /*return*/, new ts_common_1.ApiResult(order, ts_common_1.ApiStatus.error, 'No order supplied!')];
                        if (!(order.deposit > 0 && order.paid < order.deposit)) return [3 /*break*/, 2];
                        return [4 /*yield*/, this.depositMessaging(order)
                            // from here: deposit is OK => work on reminders, etc...
                        ];
                    case 1: return [2 /*return*/, _a.sent()
                        // from here: deposit is OK => work on reminders, etc...
                    ];
                    case 2:
                        now = new Date();
                        if (!(order.startDate > now)) return [3 /*break*/, 4];
                        return [4 /*yield*/, this.reminderMessaging(order)];
                    case 3: return [2 /*return*/, _a.sent()];
                    case 4: return [2 /*return*/, new ts_common_1.ApiResult(order, ts_common_1.ApiStatus.ok)];
                }
            });
        });
    };
    OrderMessaging.prototype.confirmationMessaging = function (order) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                if (order.deposit == 0 || order.paid >= order.deposit)
                    return [2 /*return*/, new ts_common_1.ApiResult(order, ts_common_1.ApiStatus.error, 'No deposit needed or deposit already paid!')];
                return [2 /*return*/, new ts_common_1.ApiResult(order, ts_common_1.ApiStatus.ok)];
            });
        });
    };
    OrderMessaging.prototype.depositMessaging = function (order) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                if (order.deposit == 0 || order.paid >= order.deposit)
                    return [2 /*return*/, new ts_common_1.ApiResult(order, ts_common_1.ApiStatus.error, 'No deposit needed or deposit already paid!')];
                return [2 /*return*/, new ts_common_1.ApiResult(order, ts_common_1.ApiStatus.ok)];
            });
        });
    };
    OrderMessaging.prototype.reminderMessaging = function (order) {
        return __awaiter(this, void 0, void 0, function () {
            var now, startDate, branch, reminders, futureReminders, futureRemindersExist, nextReminder, remindersToSent, alreadySent, remindersToSentExist, reminderTemplates;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        now = new Date();
                        startDate = order.startDate;
                        if (!startDate)
                            return [2 /*return*/, new ts_common_1.ApiResult(order, ts_common_1.ApiStatus.error, 'Order has no startdate!')];
                        if (startDate < now)
                            return [2 /*return*/, new ts_common_1.ApiResult(order, ts_common_1.ApiStatus.error, 'No reminders for past order!')];
                        return [4 /*yield*/, this.alteaDb.getBranch(order.branchId)];
                    case 1:
                        branch = _a.sent();
                        reminders = branch.reminders.map(function (reminderConfig) { return reminderConfig.toMsgInfo(startDate); });
                        reminders = _.orderBy(reminders, 'date');
                        futureReminders = reminders.filter(function (r) { return r.date > now; });
                        futureRemindersExist = ts_common_1.ArrayHelper.AtLeastOneItem(futureReminders);
                        if (futureRemindersExist) {
                            nextReminder = futureReminders[0];
                            order.msgOn = ts_common_1.DateHelper.yyyyMMddhhmmss(nextReminder.date);
                            order.msgCode = 'reminder';
                            order.m.setDirty('msgOn', 'msgCode');
                        }
                        remindersToSent = reminders.filter(function (r) { return r.date < now; });
                        if (!ts_common_1.ArrayHelper.AtLeastOneItem(remindersToSent))
                            return [2 /*return*/, new ts_common_1.ApiResult(order, ts_common_1.ApiStatus.ok, 'No reminders to sent!')];
                        return [4 /*yield*/, this.alteaDb.getMessages(order.branchId, order.id, 'reminder')];
                    case 2:
                        alreadySent = _a.sent();
                        remindersToSent = this.messagesToSent(remindersToSent, alreadySent, 'reminder');
                        remindersToSentExist = ts_common_1.ArrayHelper.AtLeastOneItem(remindersToSent);
                        if (!remindersToSentExist) {
                            return [2 /*return*/, new ts_common_1.ApiResult(order, ts_common_1.ApiStatus.ok, 'No reminders to sent! (all messages already sent)')];
                        }
                        return [4 /*yield*/, this.alteaDb.getTemplates(order.branchId, 'reminder')];
                    case 3:
                        reminderTemplates = _a.sent();
                        this.sendMessages(remindersToSent, 'reminder', reminderTemplates, order, branch);
                        // if (reminderTemplates)
                        /*
                        if (remindersToSent.length > 0) {
                
                            if (!order.remindLog)
                                order.remindLog = []
                
                            for (let reminder of remindersToSent) {
                
                                // get template
                                const template = reminderTemplates.find(t => t.channels.indexOf(reminder.type) >= 0)
                
                                if (template)
                                    this.orderMessaging.createMessage(reminder.type, template, order, branch)
                
                                order.remindLog.push(reminder)
                            }
                
                            order.m.setDirty('remindLog')
                        }
                        */
                        return [2 /*return*/, new ts_common_1.ApiResult(order, ts_common_1.ApiStatus.ok)];
                }
            });
        });
    };
    OrderMessaging.prototype.messagesToSent = function (messages, alreadySent, code) {
        var relevantMessages = messages.filter(function (m) { return m.code == code; });
        var types = relevantMessages.map(function (m) { return m.type; });
        types = _.uniq(types);
        var toSend = [];
        var _loop_1 = function (type) {
            var lastSentOn = this_1.lastSentDate(alreadySent, type, code);
            var toSendForType = relevantMessages.filter(function (m) { return m.type == type && m.date > lastSentOn; });
            if (ts_common_1.ArrayHelper.AtLeastOneItem(toSendForType)) {
                var ordered = _.orderBy(toSendForType, 'date', 'desc');
                toSend.push(ordered[0]);
            }
        };
        var this_1 = this;
        // type can be email, sms, ...
        for (var _i = 0, types_1 = types; _i < types_1.length; _i++) {
            var type = types_1[_i];
            _loop_1(type);
        }
        // messages.filter(m => alreadySent.findIndex(already => already.on == r.on && already.type == r.type) == -1)
        return toSend;
    };
    OrderMessaging.prototype.lastSentDate = function (alreadySent, type, code) {
        var alreadySentForType = alreadySent.filter(function (m) { return m.code == code && m.type == type; });
        var lastSentOn = new Date(1900, 0, 1);
        if (ts_common_1.ArrayHelper.AtLeastOneItem(alreadySentForType)) {
            alreadySentForType = _.orderBy(alreadySentForType, 'sent', 'desc');
            lastSentOn = alreadySentForType[0].sentDate();
        }
        return lastSentOn;
    };
    OrderMessaging.prototype.sendMessages = function (toSend, code, templates, order, branch) {
        return __awaiter(this, void 0, void 0, function () {
            var _loop_2, this_2, _i, toSend_1, msg;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _loop_2 = function (msg) {
                            var template;
                            return __generator(this, function (_b) {
                                switch (_b.label) {
                                    case 0:
                                        template = templates.find(function (t) { return t.channels.indexOf(msg.type) >= 0 && t.code == code; });
                                        if (!template) return [3 /*break*/, 2];
                                        return [4 /*yield*/, this_2.createMessage(msg.type, template, order, branch)];
                                    case 1:
                                        _b.sent();
                                        _b.label = 2;
                                    case 2: return [2 /*return*/];
                                }
                            });
                        };
                        this_2 = this;
                        _i = 0, toSend_1 = toSend;
                        _a.label = 1;
                    case 1:
                        if (!(_i < toSend_1.length)) return [3 /*break*/, 4];
                        msg = toSend_1[_i];
                        return [5 /*yield**/, _loop_2(msg)];
                    case 2:
                        _a.sent();
                        _a.label = 3;
                    case 3:
                        _i++;
                        return [3 /*break*/, 1];
                    case 4: return [2 /*return*/];
                }
            });
        });
    };
    return OrderMessaging;
}(order_messaging_base_1.OrderMessagingBase));
exports.OrderMessaging = OrderMessaging;
