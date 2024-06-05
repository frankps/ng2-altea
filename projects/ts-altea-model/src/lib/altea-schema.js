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
var __runInitializers = (this && this.__runInitializers) || function (thisArg, initializers, value) {
    var useValue = arguments.length > 2;
    for (var i = 0; i < initializers.length; i++) {
        value = useValue ? initializers[i].call(thisArg, value) : initializers[i].call(thisArg);
    }
    return useValue ? value : void 0;
};
var __esDecorate = (this && this.__esDecorate) || function (ctor, descriptorIn, decorators, contextIn, initializers, extraInitializers) {
    function accept(f) { if (f !== void 0 && typeof f !== "function") throw new TypeError("Function expected"); return f; }
    var kind = contextIn.kind, key = kind === "getter" ? "get" : kind === "setter" ? "set" : "value";
    var target = !descriptorIn && ctor ? contextIn["static"] ? ctor : ctor.prototype : null;
    var descriptor = descriptorIn || (target ? Object.getOwnPropertyDescriptor(target, contextIn.name) : {});
    var _, done = false;
    for (var i = decorators.length - 1; i >= 0; i--) {
        var context = {};
        for (var p in contextIn) context[p] = p === "access" ? {} : contextIn[p];
        for (var p in contextIn.access) context.access[p] = contextIn.access[p];
        context.addInitializer = function (f) { if (done) throw new TypeError("Cannot add initializers after decoration has completed"); extraInitializers.push(accept(f || null)); };
        var result = (0, decorators[i])(kind === "accessor" ? { get: descriptor.get, set: descriptor.set } : descriptor[key], context);
        if (kind === "accessor") {
            if (result === void 0) continue;
            if (result === null || typeof result !== "object") throw new TypeError("Object expected");
            if (_ = accept(result.get)) descriptor.get = _;
            if (_ = accept(result.set)) descriptor.set = _;
            if (_ = accept(result.init)) initializers.unshift(_);
        }
        else if (_ = accept(result)) {
            if (kind === "field") initializers.unshift(_);
            else descriptor[key] = _;
        }
    }
    if (target) Object.defineProperty(target, contextIn.name, descriptor);
    done = true;
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
exports.ResourceLink = exports.Resource = exports.ResourceTypeCircleIcons = exports.ResourceTypeIcons = exports.ResourceType = exports.Branch = exports.GiftConfig = exports.GiftInvoicing = exports.GiftVatPct = exports.GiftPriceSetting = exports.GiftExpiration = exports.GiftTypes = exports.GiftConfigMethods = exports.MsgInfo = exports.ReminderConfig = exports.Message = exports.MessageState = exports.IEmail = exports.MsgType = exports.DepositTerm = exports.Organisation = exports.Price = exports.PriceMode = exports.OptionPrice = exports.ProductItem = exports.ProductItemOption = exports.ProductItemOptionValue = exports.Product = exports.PlanningBlockSeries = exports.PlanningMode = exports.ProductRule = exports.ProductRuleType = exports.Schedule = exports.Contact = exports.User = exports.WeekSchedule = exports.DaySchedule = exports.ScheduleTimeBlock = exports.HourMinute = exports.ProductOnlineIcons = exports.ProductTypeIcons = exports.OnlineMode = exports.Gender = exports.TimeUnitHelper = exports.Country = exports.TimeUnit = exports.DaysOfWeekShort = exports.Currency = exports.Language = exports.PrismaObjectProperty = void 0;
exports.CanUseGiftMsg = exports.GiftLine = exports.GiftMethods = exports.GiftCertificate = exports.GiftType = exports.Template = exports.TemplateChannel = exports.TemplateRecipient = exports.orderTemplates = exports.OrderTemplate = exports.TemplateType = exports.OrderType = exports.SchedulingType = exports.DurationReference = exports.DurationMode = exports.PriceType = exports.ProductSubType = exports.ProductType = exports.ResourcePlanning = exports.PlanningInfo = exports.PlanningResourceInfo = exports.PlanningContactInfo = exports.PlanningProductInfo = exports.PlanningProductOptionInfo = exports.ResourcePlannings = exports.PlanningType = exports.OrderLine = exports.OrderLineOptionValue = exports.GiftLineOptionValue = exports.OrderLineOption = exports.GiftLineOption = exports.Order = exports.OrderCancel = exports.OrderSource = exports.OrderCancelCompensate = exports.OrderCancelBy = exports.InternalCancelReasons = exports.CustomerCancelReasons = exports.CancelBy = exports.ResourcePreferences = exports.VatLine = exports.OrderState = exports.OrderPerson = exports.Subscription = exports.Invoice = exports.InvoiceState = exports.ProductOptionValue = exports.ProductOption = exports.FormulaTerm = exports.ProductResource = void 0;
exports.TypeInfo = exports.ObjectLog = exports.ObjectLogAction = exports.CustomJson = exports.Task = exports.TaskPriority = exports.TaskStatus = exports.TaskSchedule = exports.LoyaltyCard = exports.LoyaltyCardChange = exports.LoyaltyLine = exports.RegisterLoyalty = exports.LoyaltyProgram = exports.LoyaltyUnit = exports.LoyaltyReward = exports.LoyaltyRewardProduct = exports.LoyaltyRewardOption = exports.LoyaltyRewardOptionValue = exports.LoyaltyOptionCondition = exports.LoyaltyRewardType = exports.LoyaltyProduct = exports.LoyaltyProductMode = exports.Payment = exports.PaymentType = exports.Gift = exports.CanUseGift = void 0;
/* eslint-disable @typescript-eslint/no-non-null-assertion */
var class_transformer_1 = require("class-transformer");
require("reflect-metadata");
var ts_common_1 = require("ts-common");
var _ = require("lodash");
var person_line_1 = require("./person-line");
var logic_1 = require("./logic");
var dateFns = require("date-fns");
var Handlebars = require("handlebars");
var sc = require("stringcase");
var order_person_mgr_1 = require("./order-person-mgr");
function TransformToNumber() {
    return (0, class_transformer_1.Transform)(function (_a) {
        var value = _a.value;
        console.error(value, +value);
        return +value;
    }, {}); //toClassOnly: true
}
var PrismaObjectProperty = /** @class */ (function () {
    function PrismaObjectProperty() {
        this.updateMany = {
            data: []
        };
    }
    return PrismaObjectProperty;
}());
exports.PrismaObjectProperty = PrismaObjectProperty;
/*
        "language": {
          "nl": "Nederlands",
          "en": "English",
          "fr": "French",
          "sp": "Español"
        },*/
var Language;
(function (Language) {
    Language["nl"] = "nl";
    Language["en"] = "en";
    Language["fr"] = "fr";
    Language["sp"] = "sp";
})(Language || (exports.Language = Language = {}));
var Currency;
(function (Currency) {
    Currency["AUD"] = "AUD";
    Currency["CAD"] = "CAD";
    Currency["CHF"] = "CHF";
    Currency["CNY"] = "CNY";
    Currency["EUR"] = "EUR";
    Currency["GBP"] = "GBP";
    Currency["HKD"] = "HKD";
    Currency["JPY"] = "JPY";
    Currency["NZD"] = "NZD";
    Currency["USD"] = "USD";
})(Currency || (exports.Currency = Currency = {}));
var DaysOfWeekShort;
(function (DaysOfWeekShort) {
    DaysOfWeekShort[DaysOfWeekShort["mo"] = 1] = "mo";
    DaysOfWeekShort[DaysOfWeekShort["tu"] = 2] = "tu";
    DaysOfWeekShort[DaysOfWeekShort["we"] = 3] = "we";
    DaysOfWeekShort[DaysOfWeekShort["th"] = 4] = "th";
    DaysOfWeekShort[DaysOfWeekShort["fr"] = 5] = "fr";
    DaysOfWeekShort[DaysOfWeekShort["sa"] = 6] = "sa";
    DaysOfWeekShort[DaysOfWeekShort["su"] = 7] = "su";
})(DaysOfWeekShort || (exports.DaysOfWeekShort = DaysOfWeekShort = {}));
var TimeUnit;
(function (TimeUnit) {
    TimeUnit["seconds"] = "s";
    TimeUnit["minutes"] = "m";
    TimeUnit["hours"] = "h";
    TimeUnit["days"] = "d";
    TimeUnit["weeks"] = "w";
    TimeUnit["months"] = "M";
})(TimeUnit || (exports.TimeUnit = TimeUnit = {}));
/*
"country": {
  "BEL": "België",
  "GBR": "Groot Britanië",
  "NLD": "Nederland",
  "USA": "Verenigde Staten"
},
*/
var Country;
(function (Country) {
    Country["BEL"] = "BEL";
    Country["NLD"] = "NLD";
    Country["USA"] = "USA";
})(Country || (exports.Country = Country = {}));
var TimeUnitHelper = /** @class */ (function () {
    function TimeUnitHelper() {
    }
    TimeUnitHelper.numberOfSeconds = function (unit) {
        switch (unit) {
            case TimeUnit.seconds: return 1;
            case TimeUnit.minutes: return 60;
            case TimeUnit.hours: return 3600;
            case TimeUnit.days: return 86400;
            case TimeUnit.weeks: return 604800;
            case TimeUnit.months: return 18144000;
            default: throw "Can not convert ".concat(unit, " to seconds");
        }
    };
    return TimeUnitHelper;
}());
exports.TimeUnitHelper = TimeUnitHelper;
var Gender;
(function (Gender) {
    Gender["unknown"] = "unknown";
    Gender["female"] = "female";
    Gender["male"] = "male";
    Gender["unisex"] = "unisex";
})(Gender || (exports.Gender = Gender = {}));
var OnlineMode;
(function (OnlineMode) {
    //order = 'order',
    OnlineMode["reserve"] = "reserve";
    OnlineMode["visible"] = "visible";
    OnlineMode["invisible"] = "invisible";
})(OnlineMode || (exports.OnlineMode = OnlineMode = {}));
var ProductTypeIcons;
(function (ProductTypeIcons) {
    ProductTypeIcons["prod"] = "fa-duotone fa-box";
    ProductTypeIcons["svc"] = "fa-duotone fa-person-dress";
    /** category */
    ProductTypeIcons["cat"] = "fa-duotone fa-folder-open";
    ProductTypeIcons["prod_bundle"] = "fa-duotone fa-boxes-stacked";
    ProductTypeIcons["svc_bundle"] = "fa-duotone fa-people-dress";
    ProductTypeIcons["prod_subs"] = "fa-duotone fa-id-card";
    ProductTypeIcons["svc_subs"] = "fa-duotone fa-id-card";
})(ProductTypeIcons || (exports.ProductTypeIcons = ProductTypeIcons = {}));
var ProductOnlineIcons;
(function (ProductOnlineIcons) {
    ProductOnlineIcons["reserve"] = "fa-solid fa-cart-shopping";
    ProductOnlineIcons["visible"] = "fa-solid fa-eye";
    ProductOnlineIcons["invisible"] = "fa-sharp fa-solid fa-eye-slash";
})(ProductOnlineIcons || (exports.ProductOnlineIcons = ProductOnlineIcons = {}));
var HourMinute = /** @class */ (function () {
    function HourMinute() {
        this.hour = 0;
        this.minute = 0;
    }
    HourMinute.parse = function (time) {
        var hm = new HourMinute();
        var items = time.split(':');
        hm.hour = Number(items[0]);
        hm.minute = Number(items[1]);
        return hm;
    };
    return HourMinute;
}());
exports.HourMinute = HourMinute;
var ScheduleTimeBlock = /** @class */ (function () {
    function ScheduleTimeBlock() {
        this.from = '09:00'; // format HH:mm
        this.to = '17:00';
    }
    ScheduleTimeBlock.prototype.clone = function () {
        var block = new ScheduleTimeBlock();
        block.from = this.from;
        block.to = this.to;
        return block;
    };
    ScheduleTimeBlock.prototype.fromParse = function () {
        return HourMinute.parse(this.from);
    };
    ScheduleTimeBlock.prototype.toParse = function () {
        return HourMinute.parse(this.to);
    };
    return ScheduleTimeBlock;
}());
exports.ScheduleTimeBlock = ScheduleTimeBlock;
var DaySchedule = function () {
    var _a;
    var _instanceExtraInitializers = [];
    var _blocks_decorators;
    var _blocks_initializers = [];
    return _a = /** @class */ (function () {
            function DaySchedule(day, idx, on) {
                if (day === void 0) { day = DaysOfWeekShort.mo; }
                if (idx === void 0) { idx = 0; }
                if (on === void 0) { on = true; }
                this.idx = (__runInitializers(this, _instanceExtraInitializers), -1);
                this.on = true; // equals is active  
                this.day = DaysOfWeekShort.mo;
                this.blocks = __runInitializers(this, _blocks_initializers, []);
                this.day = day;
                this.idx = idx;
                this.on = on;
            }
            DaySchedule.prototype.removeBlock = function (block) {
                if (!block)
                    return;
                if (this.blocks)
                    _.remove(this.blocks, function (b) { return b.from == block.from && b.to == block.to; });
            };
            return DaySchedule;
        }()),
        (function () {
            var _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
            _blocks_decorators = [(0, class_transformer_1.Type)(function () { return ScheduleTimeBlock; })];
            __esDecorate(null, null, _blocks_decorators, { kind: "field", name: "blocks", static: false, private: false, access: { has: function (obj) { return "blocks" in obj; }, get: function (obj) { return obj.blocks; }, set: function (obj, value) { obj.blocks = value; } }, metadata: _metadata }, _blocks_initializers, _instanceExtraInitializers);
            if (_metadata) Object.defineProperty(_a, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        })(),
        _a;
}();
exports.DaySchedule = DaySchedule;
var WeekSchedule = function () {
    var _a;
    var _instanceExtraInitializers = [];
    var _days_decorators;
    var _days_initializers = [];
    return _a = /** @class */ (function () {
            function WeekSchedule(weekIdx, startAtDayIdx) {
                if (startAtDayIdx === void 0) { startAtDayIdx = 1; }
                this.idx = (__runInitializers(this, _instanceExtraInitializers), -1);
                this.days = __runInitializers(this, _days_initializers, []);
                this.idx = weekIdx;
                var days = Object.values(DaysOfWeekShort);
                var dayIdx = startAtDayIdx;
                var active = true;
                // monday=1, sunday=7
                for (var day = 1; day <= 7; day++) {
                    if (day == DaysOfWeekShort.sa)
                        active = false;
                    var daySchedule = new DaySchedule(day, dayIdx, active);
                    if (active)
                        daySchedule.blocks.push(new ScheduleTimeBlock());
                    this.days.push(daySchedule);
                    dayIdx++;
                }
            }
            /**
             *
             * @param dayOfWeek 0=sunday ... 6=saturday
             */
            // getDay(dayOfWeek: number) {
            // }
            WeekSchedule.prototype.getDaySchedule = function (dayOfWeek) {
                if (!Array.isArray(this.days))
                    return undefined;
                var dayOfWeekEnum = this.getDaysOfWeekShort(dayOfWeek);
                return this.days.find(function (d) { return d.day == dayOfWeekEnum; });
            };
            /**
             *
             * @param dayOfWeek 0=sunday ... 6=saturday
             */
            WeekSchedule.prototype.getDaysOfWeekShort = function (dayOfWeek) {
                switch (dayOfWeek) {
                    case 0: return DaysOfWeekShort.su;
                    case 1: return DaysOfWeekShort.mo;
                    case 2: return DaysOfWeekShort.tu;
                    case 3: return DaysOfWeekShort.we;
                    case 4: return DaysOfWeekShort.th;
                    case 5: return DaysOfWeekShort.fr;
                    case 6: return DaysOfWeekShort.sa;
                }
                return DaysOfWeekShort.su;
            };
            return WeekSchedule;
        }()),
        (function () {
            var _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
            _days_decorators = [(0, class_transformer_1.Type)(function () { return DaySchedule; })];
            __esDecorate(null, null, _days_decorators, { kind: "field", name: "days", static: false, private: false, access: { has: function (obj) { return "days" in obj; }, get: function (obj) { return obj.days; }, set: function (obj, value) { obj.days = value; } }, metadata: _metadata }, _days_initializers, _instanceExtraInitializers);
            if (_metadata) Object.defineProperty(_a, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        })(),
        _a;
}();
exports.WeekSchedule = WeekSchedule;
var User = /** @class */ (function (_super) {
    __extends(User, _super);
    function User() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    return User;
}(ts_common_1.ObjectWithIdPlus));
exports.User = User;
var Contact = function () {
    var _a;
    var _classSuper = ts_common_1.ObjectWithId;
    var _instanceExtraInitializers = [];
    var _orders_decorators;
    var _orders_initializers = [];
    var _subscriptions_decorators;
    var _subscriptions_initializers = [];
    var _giftsOut_decorators;
    var _giftsOut_initializers = [];
    var _giftsIn_decorators;
    var _giftsIn_initializers = [];
    var _cards_decorators;
    var _cards_initializers = [];
    return _a = /** @class */ (function (_super) {
            __extends(Contact, _super);
            function Contact() {
                var _this = _super !== null && _super.apply(this, arguments) || this;
                //@Type(() => Organisation)
                _this.organisation = (__runInitializers(_this, _instanceExtraInitializers), void 0);
                _this.orders = __runInitializers(_this, _orders_initializers, void 0);
                _this.gender = Gender.unknown;
                /** Email address confirmed */
                _this.emailConf = false;
                /** Mobile number confirmed */
                _this.mobileConf = false;
                /** Allowed messaging for communication (valid strings: see enum MsgTyp) */
                _this.msg = ['email', 'wa'];
                _this.news = false;
                _this.rules = false;
                /*   active = true
                  deleted = false
                  deletedAt?: Date; */
                _this.subscriptions = __runInitializers(_this, _subscriptions_initializers, void 0);
                /** gifts given by this contact to others */
                _this.giftsOut = __runInitializers(_this, _giftsOut_initializers, void 0);
                /** received gifts (can also be gifts created by system for cancellations) */
                _this.giftsIn = __runInitializers(_this, _giftsIn_initializers, void 0);
                _this.cards = __runInitializers(_this, _cards_initializers, void 0);
                return _this;
            }
            /** Is the given message type selected? */
            Contact.prototype.msgTypeSelected = function (type) {
                if (!type || ts_common_1.ArrayHelper.IsEmpty(this.msg))
                    return false;
                return this.msg.indexOf(type) >= 0;
            };
            Contact.prototype.selectMsgType = function (msgType, selected) {
                console.log(msgType, selected);
                if (!this.msg)
                    this.msg = [];
                if (selected) {
                    if (!this.msgTypeSelected(msgType))
                        this.msg.push(msgType);
                }
                else {
                    var idx = this.msg.indexOf(msgType);
                    if (idx >= 0)
                        this.msg.splice(idx, 1);
                }
            };
            Contact.prototype.setName = function () {
                var components = [];
                if (this.first) {
                    this.first = sc.capitalcase(this.first);
                    components.push(this.first);
                }
                if (this.last) {
                    this.last = sc.capitalcase(this.last);
                    components.push(this.last);
                }
                if (components.length == 0 && this.company)
                    components.push(this.company);
                this.name = components.join(' ');
            };
            return Contact;
        }(_classSuper)),
        (function () {
            var _b;
            var _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create((_b = _classSuper[Symbol.metadata]) !== null && _b !== void 0 ? _b : null) : void 0;
            _orders_decorators = [(0, class_transformer_1.Type)(function () { return Order; })];
            _subscriptions_decorators = [(0, class_transformer_1.Type)(function () { return Subscription; })];
            _giftsOut_decorators = [(0, class_transformer_1.Type)(function () { return Gift; })];
            _giftsIn_decorators = [(0, class_transformer_1.Type)(function () { return Gift; })];
            _cards_decorators = [(0, class_transformer_1.Type)(function () { return LoyaltyCard; })];
            __esDecorate(null, null, _orders_decorators, { kind: "field", name: "orders", static: false, private: false, access: { has: function (obj) { return "orders" in obj; }, get: function (obj) { return obj.orders; }, set: function (obj, value) { obj.orders = value; } }, metadata: _metadata }, _orders_initializers, _instanceExtraInitializers);
            __esDecorate(null, null, _subscriptions_decorators, { kind: "field", name: "subscriptions", static: false, private: false, access: { has: function (obj) { return "subscriptions" in obj; }, get: function (obj) { return obj.subscriptions; }, set: function (obj, value) { obj.subscriptions = value; } }, metadata: _metadata }, _subscriptions_initializers, _instanceExtraInitializers);
            __esDecorate(null, null, _giftsOut_decorators, { kind: "field", name: "giftsOut", static: false, private: false, access: { has: function (obj) { return "giftsOut" in obj; }, get: function (obj) { return obj.giftsOut; }, set: function (obj, value) { obj.giftsOut = value; } }, metadata: _metadata }, _giftsOut_initializers, _instanceExtraInitializers);
            __esDecorate(null, null, _giftsIn_decorators, { kind: "field", name: "giftsIn", static: false, private: false, access: { has: function (obj) { return "giftsIn" in obj; }, get: function (obj) { return obj.giftsIn; }, set: function (obj, value) { obj.giftsIn = value; } }, metadata: _metadata }, _giftsIn_initializers, _instanceExtraInitializers);
            __esDecorate(null, null, _cards_decorators, { kind: "field", name: "cards", static: false, private: false, access: { has: function (obj) { return "cards" in obj; }, get: function (obj) { return obj.cards; }, set: function (obj, value) { obj.cards = value; } }, metadata: _metadata }, _cards_initializers, _instanceExtraInitializers);
            if (_metadata) Object.defineProperty(_a, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        })(),
        _a;
}();
exports.Contact = Contact;
// export class ScheduleLine extends ObjectWithId {
//   schedule?: Schedule;
//   schedId?: string;
//   wk?: number;
//   dow?: number;
//   from?: Date;
//   to?: Date;
// }
var Schedule = function () {
    var _a;
    var _classSuper = ts_common_1.ObjectWithIdPlus;
    var _instanceExtraInitializers = [];
    var _planning_decorators;
    var _planning_initializers = [];
    var _weeks_decorators;
    var _weeks_initializers = [];
    return _a = /** @class */ (function (_super) {
            __extends(Schedule, _super);
            function Schedule() {
                var _this = _super !== null && _super.apply(this, arguments) || this;
                _this.idx = (__runInitializers(_this, _instanceExtraInitializers), 0);
                _this.default = false;
                // @Type(() => ScheduleLine)
                // lines?: ScheduleLine[];
                _this.planning = __runInitializers(_this, _planning_initializers, void 0);
                /** re-use the plannings from these branch schedule ids  */
                _this.scheduleIds = [];
                _this.weeks = __runInitializers(_this, _weeks_initializers, []
                /** Includes preparation time: extra work needed before & after actual booking such as prepartions before booking or cleaning time after is included in this schedule (=> system can not go outside given timings for preparations).
                 *  If true: possible preparations (defined via ProductResource, prep=true) must fall within this schedule
                 */
                );
                /** Includes preparation time: extra work needed before & after actual booking such as prepartions before booking or cleaning time after is included in this schedule (=> system can not go outside given timings for preparations).
                 *  If true: possible preparations (defined via ProductResource, prep=true) must fall within this schedule
                 */
                _this.prepIncl = true;
                return _this;
            }
            /*
            set startDate(value: Date) {
              this.start = DateHelper.yyyyMMdd(value)
              console.warn(this.start)
            }
          */
            Schedule.prototype.startDate = function () {
                return ts_common_1.DateHelper.parse(this.start);
            };
            Schedule.prototype.isInsideSchedule = function (dateRange) {
                var start = dateFns.startOfDay(dateRange.from);
                var end = dateFns.endOfDay(dateRange.to);
                var scheduleRanges = this.toDateRangeSet(start, end);
                var contains = scheduleRanges.contains(dateRange);
                return contains;
            };
            /** returns the date ranges of the given dateRange that are outside schedule */
            Schedule.prototype.outsideSchedule = function (dateRange) {
                var start = dateFns.startOfDay(dateRange.from);
                var end = dateFns.endOfDay(dateRange.to);
                var scheduleRanges = this.toDateRangeSet(start, end);
                var outside = dateRange.subtractSet(scheduleRanges);
                return outside;
            };
            /** returns the date ranges of the given dateRange outside schedule */
            Schedule.prototype.insideSchedule = function (dateRange) {
                return logic_1.DateRangeSet.empty;
            };
            Schedule.prototype.getDaySchedule = function (day) {
                var daySchedule = new DaySchedule();
                daySchedule.blocks.push(new ScheduleTimeBlock());
                return daySchedule;
            };
            Schedule.prototype.toDateRangeSet = function (from, to, fromLabel, toLabel) {
                // 
                var dateRangeSet = new logic_1.DateRangeSet();
                if (!this.weeks || this.weeks.length == 0)
                    return dateRangeSet;
                var fromDate, toDate;
                if (ts_common_1.DateHelper.isDate(from))
                    fromDate = from;
                else
                    fromDate = ts_common_1.DateHelper.parse(from);
                if (ts_common_1.DateHelper.isDate(to))
                    toDate = to;
                else
                    toDate = ts_common_1.DateHelper.parse(to);
                var days = dateFns.eachDayOfInterval({ start: fromDate, end: toDate });
                var currentWeekIdx = 0;
                var nrOfWeeks = this.weeks.length;
                /**
                 * if a multi week schedule, then calculate the current week inside this multi-week schedule (currentWeekIdx)
                 */
                if (this.weeks.length > 1) {
                    var startOfWeekSchedule = this.startDate();
                    var weekDif = dateFns.differenceInWeeks(fromDate, startOfWeekSchedule);
                    console.warn(weekDif);
                    if (fromDate >= startOfWeekSchedule && weekDif >= 0)
                        currentWeekIdx = weekDif % nrOfWeeks;
                    else { // if fromDate is before startOfWeekSchedule
                        weekDif = Math.abs(weekDif) % nrOfWeeks;
                        currentWeekIdx = nrOfWeeks - 1 - weekDif;
                    }
                }
                var toDateMillis = toDate.getTime();
                for (var _i = 0, days_1 = days; _i < days_1.length; _i++) {
                    var dayDate = days_1[_i];
                    if (dayDate.getTime() == toDateMillis) // if toDate is start of new day, then we're not interested in that day
                        break;
                    var weekSchedule = this.weeks[currentWeekIdx];
                    var dayOfWeek = dayDate.getDay();
                    var daySchedule = weekSchedule.getDaySchedule(dayOfWeek);
                    if ((daySchedule === null || daySchedule === void 0 ? void 0 : daySchedule.on) && Array.isArray(daySchedule.blocks)) {
                        for (var _b = 0, _c = daySchedule.blocks; _b < _c.length; _b++) {
                            var block = _c[_b];
                            var from_1 = block.fromParse();
                            var fromDate_1 = dateFns.addHours(dayDate, from_1.hour);
                            fromDate_1 = dateFns.addMinutes(fromDate_1, from_1.minute);
                            var to_1 = block.toParse();
                            var toDate_1 = dateFns.addHours(dayDate, to_1.hour);
                            toDate_1 = dateFns.addMinutes(toDate_1, to_1.minute);
                            dateRangeSet.addRangeByDates(fromDate_1, toDate_1, fromLabel, toLabel);
                        }
                    }
                    // if sunday
                    if (nrOfWeeks > 1 && (dayOfWeek % 7) == 0) {
                        currentWeekIdx = (currentWeekIdx + 1) % nrOfWeeks;
                    }
                    // daySchedule?.blocks
                }
                return dateRangeSet;
            };
            return Schedule;
        }(_classSuper)),
        (function () {
            var _b;
            var _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create((_b = _classSuper[Symbol.metadata]) !== null && _b !== void 0 ? _b : null) : void 0;
            _planning_decorators = [(0, class_transformer_1.Type)(function () { return ResourcePlanning; })];
            _weeks_decorators = [(0, class_transformer_1.Type)(function () { return WeekSchedule; })];
            __esDecorate(null, null, _planning_decorators, { kind: "field", name: "planning", static: false, private: false, access: { has: function (obj) { return "planning" in obj; }, get: function (obj) { return obj.planning; }, set: function (obj, value) { obj.planning = value; } }, metadata: _metadata }, _planning_initializers, _instanceExtraInitializers);
            __esDecorate(null, null, _weeks_decorators, { kind: "field", name: "weeks", static: false, private: false, access: { has: function (obj) { return "weeks" in obj; }, get: function (obj) { return obj.weeks; }, set: function (obj, value) { obj.weeks = value; } }, metadata: _metadata }, _weeks_initializers, _instanceExtraInitializers);
            if (_metadata) Object.defineProperty(_a, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        })(),
        _a;
}();
exports.Schedule = Schedule;
/*
export class Scheduling extends ObjectWithId {

  idx = 0
  schedule?: Schedule;
  schedId?: string;
  resource?: Resource;
  resourceId?: string;
  type = SchedulingType.active

  //  @Type(() => Date)
  start?: number;

  // @Type(() => Date)
  end?: number;
  prio = 0
  available = true
  default = true

  get startUtc() {
    const start = DateHelper.parse(this.start)
    return TimeHelper.hhmmUTC(start)
  }

  set startUtc(val: string) {
    const start = TimeHelper.hhmmUTCToDate(val)
    this.start = DateHelper.yyyyMMdd000000(start)

  }

  get startDate() {
    console.warn(this.start)
    return DateHelper.parse(this.start)
  }

  get endDate() {
    return DateHelper.parse(this.end)
  }
}
*/
var ProductRuleType;
(function (ProductRuleType) {
    ProductRuleType["startAt"] = "startAt";
    ProductRuleType["prePost"] = "prePost";
})(ProductRuleType || (exports.ProductRuleType = ProductRuleType = {}));
/*
Product rules:
1. startAt: start Wellness at certain times for certain schedules (= operational modes on branch level)
2. prePost: adapt pre & post times based on certain condition (ex nr of persons > 5)
*/
var ProductRule = /** @class */ (function () {
    function ProductRule() {
        this.idx = 0;
    }
    return ProductRule;
}());
exports.ProductRule = ProductRule;
var PlanningMode;
(function (PlanningMode) {
    PlanningMode["none"] = "none";
    PlanningMode["continuous"] = "continuous";
    PlanningMode["block"] = "block";
})(PlanningMode || (exports.PlanningMode = PlanningMode = {}));
var PlanningBlockSeries = /** @class */ (function () {
    function PlanningBlockSeries() {
        this.start = "09:00";
        /** default duration of 1 block */
        this.dur = 60;
        /** absolute minimum time for 1 block */
        this.min = 60;
        /** time between 2 blocks */
        this.post = 15;
        /** number of blocks in series */
        this.count = 1;
        /** deviations from series allowed */
        this.dev = true;
        this.scheduleIds = [];
    }
    /** equals duration of default space + post (time between 2 blocks) */
    PlanningBlockSeries.prototype.durationEmptyBlock = function () {
        return this.dur + this.post;
    };
    /** apply this series definition within given date range (inRange) */
    PlanningBlockSeries.prototype.makeBlocks = function (inRange) {
        console.error('makeBlocks', inRange, this);
        var start = dateFns.parse(this.start, 'HH:mm', inRange.from);
        var result = logic_1.DateRangeSet.empty;
        var loop = start;
        var count = 0;
        while (loop < inRange.to && (!this.count || count < this.count)) {
            var end = dateFns.addMinutes(loop, this.dur);
            if (loop >= inRange.from && end <= inRange.to) {
                var range = new logic_1.DateRange(loop, end);
                result.addRange(range);
            }
            loop = dateFns.addMinutes(end, this.post);
            count++;
        }
        return result;
    };
    return PlanningBlockSeries;
}());
exports.PlanningBlockSeries = PlanningBlockSeries;
var Product = function () {
    var _a;
    var _classSuper = ts_common_1.ObjectWithIdPlus;
    var _instanceExtraInitializers = [];
    var _prices_decorators;
    var _prices_initializers = [];
    var _options_decorators;
    var _options_initializers = [];
    var _resources_decorators;
    var _resources_initializers = [];
    var _items_decorators;
    var _items_initializers = [];
    var _usedIn_decorators;
    var _usedIn_initializers = [];
    var _plan_decorators;
    var _plan_initializers = [];
    var _rules_decorators;
    var _rules_initializers = [];
    var _deletedAt_decorators;
    var _deletedAt_initializers = [];
    var _salesPrice_decorators;
    var _salesPrice_initializers = [];
    return _a = /** @class */ (function (_super) {
            __extends(Product, _super);
            function Product() {
                var _this = _super !== null && _super.apply(this, arguments) || this;
                // new
                _this.customers = (__runInitializers(_this, _instanceExtraInitializers), void 0);
                //  isCategory = false
                _this.prices = __runInitializers(_this, _prices_initializers, void 0);
                _this.options = __runInitializers(_this, _options_initializers, void 0);
                _this.resources = __runInitializers(_this, _resources_initializers, void 0);
                //  bundle: boolean = false
                _this.items = __runInitializers(_this, _items_initializers, void 0);
                _this.usedIn = __runInitializers(_this, _usedIn_initializers, void 0);
                _this.type = ProductType.prod;
                /** Product sub type */
                _this.sub = ProductSubType.basic;
                _this.showPrice = true;
                _this.showDuration = true;
                _this.showPos = true;
                _this.planMode = PlanningMode.continuous;
                /** specification of blocks if planMode==block */
                _this.plan = __runInitializers(_this, _plan_initializers, void 0);
                _this.rules = __runInitializers(_this, _rules_initializers, void 0);
                _this.duration = 0;
                _this.hasPre = false; // has preparation time
                _this.preTime = 15; // preparation time (before actual treatment)
                _this.preMaxGap = 0; // max gap between preparation (preTime) and actual treatment
                _this.hasPost = false; // has cleanup time
                _this.postTime = 15; // cleanup time (after actual treatment)
                _this.postMaxGap = 0; // max gap between actual treatment and cleanup
                _this.stock = 0;
                _this.minStock = 0;
                //advance = 0
                _this.vatPct = 0;
                _this.personSelect = true; // if order is for multiple persons, then customer can specify for each orderLine the person
                _this.staffSelect = true; // customer can specify which staffmember 
                /*   active?: boolean;
                  deleted?: boolean; */
                _this.deletedAt = __runInitializers(_this, _deletedAt_initializers, void 0);
                //@TransformToNumber()
                _this.salesPrice = __runInitializers(_this, _salesPrice_initializers, 0);
                _this.advPricing = false;
                return _this;
            }
            Product.prototype.salesPricing = function (onDate) {
                if (onDate === void 0) { onDate = new Date(); }
                if (ts_common_1.ArrayHelper.IsEmpty(this.prices))
                    return this.salesPrice;
                var onDateNum = ts_common_1.DateHelper.yyyyMMddhhmmss(onDate);
                var specialPrice = this.prices.find(function (p) { return p.start <= onDateNum && onDateNum < p.end; });
                if (!specialPrice)
                    specialPrice = this.prices.find(function (p) { return p.start <= onDateNum && !p.end; });
                if (!specialPrice)
                    return this.salesPrice;
                console.warn("");
                switch (specialPrice.mode) {
                    case PriceMode.abs:
                        return specialPrice.value;
                    case PriceMode.pct: {
                        var newPrice = this.salesPrice * (1 - specialPrice.value / 100);
                        return newPrice;
                    }
                }
                return this.salesPrice;
            };
            Product.prototype.getIcon = function () {
                if (this.isCategory())
                    return ProductTypeIcons.cat;
                else if (this.sub == ProductSubType.basic)
                    return ProductTypeIcons[this.type];
                else
                    return ProductTypeIcons["".concat(this.type, "_").concat(this.sub)];
            };
            Product.prototype.isCategory = function () {
                return this.sub == ProductSubType.cat;
            };
            Product.prototype.isBundle = function () {
                return this.sub == ProductSubType.bundle;
            };
            Product.prototype.isSubscription = function () {
                return this.sub == ProductSubType.subs;
            };
            Product.prototype.getOnlineIcon = function () {
                if (this.online)
                    return ProductOnlineIcons[this.online];
                return '';
            };
            Product.prototype.hasOptions = function () {
                return (this.options && this.options.length > 0);
            };
            Product.prototype.hasItems = function () {
                return (this.items && this.items.length > 0);
            };
            Product.prototype.hasResources = function () {
                return (this.resources && this.resources.length > 0);
            };
            Product.prototype.hasRules = function () {
                return (this.rules && this.rules.length > 0);
            };
            Product.prototype.getResourcesForSchedule = function (scheduleId) {
                if (!this.resources || this.resources.length == 0)
                    return [];
                var prodResArray = this.resources.filter(function (r) { return (r.scheduleIds && r.scheduleIds.indexOf(scheduleId) >= 0) || !r.scheduleIds || r.scheduleIds.length == 0; });
                return prodResArray;
            };
            Product.prototype.getBlockSeries = function (scheduleId) {
                var _b, _c;
                var series = (_b = this.plan) === null || _b === void 0 ? void 0 : _b.filter(function (blockSeries) { return Array.isArray(blockSeries.scheduleIds) && blockSeries.scheduleIds.indexOf(scheduleId) >= 0; });
                if (!Array.isArray(series) || series.length == 0)
                    series = (_c = this.plan) === null || _c === void 0 ? void 0 : _c.filter(function (blockSeries) { return !Array.isArray(blockSeries.scheduleIds) || blockSeries.scheduleIds.length == 0; });
                return series;
            };
            Product.prototype.getOptionValues = function (optionId) {
                if (!this.hasOptions())
                    return [];
                var option = this.options.find(function (o) { return o.id == optionId; });
                if (!option || !option.values)
                    return [];
                return option.values;
            };
            return Product;
        }(_classSuper)),
        (function () {
            var _b;
            var _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create((_b = _classSuper[Symbol.metadata]) !== null && _b !== void 0 ? _b : null) : void 0;
            _prices_decorators = [(0, class_transformer_1.Type)(function () { return Price; })];
            _options_decorators = [(0, class_transformer_1.Type)(function () { return ProductOption; })];
            _resources_decorators = [(0, class_transformer_1.Type)(function () { return ProductResource; })];
            _items_decorators = [(0, class_transformer_1.Type)(function () { return ProductItem; })];
            _usedIn_decorators = [(0, class_transformer_1.Type)(function () { return ProductItem; })];
            _plan_decorators = [(0, class_transformer_1.Type)(function () { return PlanningBlockSeries; })];
            _rules_decorators = [(0, class_transformer_1.Type)(function () { return ProductRule; })];
            _deletedAt_decorators = [(0, class_transformer_1.Type)(function () { return Date; })];
            _salesPrice_decorators = [(0, class_transformer_1.Type)(function () { return Number; })];
            __esDecorate(null, null, _prices_decorators, { kind: "field", name: "prices", static: false, private: false, access: { has: function (obj) { return "prices" in obj; }, get: function (obj) { return obj.prices; }, set: function (obj, value) { obj.prices = value; } }, metadata: _metadata }, _prices_initializers, _instanceExtraInitializers);
            __esDecorate(null, null, _options_decorators, { kind: "field", name: "options", static: false, private: false, access: { has: function (obj) { return "options" in obj; }, get: function (obj) { return obj.options; }, set: function (obj, value) { obj.options = value; } }, metadata: _metadata }, _options_initializers, _instanceExtraInitializers);
            __esDecorate(null, null, _resources_decorators, { kind: "field", name: "resources", static: false, private: false, access: { has: function (obj) { return "resources" in obj; }, get: function (obj) { return obj.resources; }, set: function (obj, value) { obj.resources = value; } }, metadata: _metadata }, _resources_initializers, _instanceExtraInitializers);
            __esDecorate(null, null, _items_decorators, { kind: "field", name: "items", static: false, private: false, access: { has: function (obj) { return "items" in obj; }, get: function (obj) { return obj.items; }, set: function (obj, value) { obj.items = value; } }, metadata: _metadata }, _items_initializers, _instanceExtraInitializers);
            __esDecorate(null, null, _usedIn_decorators, { kind: "field", name: "usedIn", static: false, private: false, access: { has: function (obj) { return "usedIn" in obj; }, get: function (obj) { return obj.usedIn; }, set: function (obj, value) { obj.usedIn = value; } }, metadata: _metadata }, _usedIn_initializers, _instanceExtraInitializers);
            __esDecorate(null, null, _plan_decorators, { kind: "field", name: "plan", static: false, private: false, access: { has: function (obj) { return "plan" in obj; }, get: function (obj) { return obj.plan; }, set: function (obj, value) { obj.plan = value; } }, metadata: _metadata }, _plan_initializers, _instanceExtraInitializers);
            __esDecorate(null, null, _rules_decorators, { kind: "field", name: "rules", static: false, private: false, access: { has: function (obj) { return "rules" in obj; }, get: function (obj) { return obj.rules; }, set: function (obj, value) { obj.rules = value; } }, metadata: _metadata }, _rules_initializers, _instanceExtraInitializers);
            __esDecorate(null, null, _deletedAt_decorators, { kind: "field", name: "deletedAt", static: false, private: false, access: { has: function (obj) { return "deletedAt" in obj; }, get: function (obj) { return obj.deletedAt; }, set: function (obj, value) { obj.deletedAt = value; } }, metadata: _metadata }, _deletedAt_initializers, _instanceExtraInitializers);
            __esDecorate(null, null, _salesPrice_decorators, { kind: "field", name: "salesPrice", static: false, private: false, access: { has: function (obj) { return "salesPrice" in obj; }, get: function (obj) { return obj.salesPrice; }, set: function (obj, value) { obj.salesPrice = value; } }, metadata: _metadata }, _salesPrice_initializers, _instanceExtraInitializers);
            if (_metadata) Object.defineProperty(_a, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        })(),
        _a;
}();
exports.Product = Product;
var ProductItemOptionValue = /** @class */ (function () {
    //value?: any
    function ProductItemOptionValue(prodOptionValue) {
        if (!prodOptionValue)
            return;
        this.id = prodOptionValue.id;
        this.name = prodOptionValue.name;
        // this.value = prodOptionValue.value
    }
    return ProductItemOptionValue;
}());
exports.ProductItemOptionValue = ProductItemOptionValue;
var ProductItemOption = function () {
    var _a;
    var _instanceExtraInitializers = [];
    var _values_decorators;
    var _values_initializers = [];
    return _a = /** @class */ (function () {
            function ProductItemOption(productOption) {
                this.id = (__runInitializers(this, _instanceExtraInitializers), void 0);
                this.values = __runInitializers(this, _values_initializers, []);
                if (!productOption)
                    return;
                this.id = productOption.id;
                this.name = productOption.name;
            }
            ProductItemOption.prototype.hasValue = function () {
                if (Array.isArray(this.values) && this.values.length > 0) {
                    return true;
                }
                //else {
                //   if (this.values?.value && this.values?.value != 0)
                //     return true
                // }
                return false;
            };
            return ProductItemOption;
        }()),
        (function () {
            var _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
            _values_decorators = [(0, class_transformer_1.Type)(function () { return ProductItemOptionValue; })];
            __esDecorate(null, null, _values_decorators, { kind: "field", name: "values", static: false, private: false, access: { has: function (obj) { return "values" in obj; }, get: function (obj) { return obj.values; }, set: function (obj, value) { obj.values = value; } }, metadata: _metadata }, _values_initializers, _instanceExtraInitializers);
            if (_metadata) Object.defineProperty(_a, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        })(),
        _a;
}();
exports.ProductItemOption = ProductItemOption;
var ProductItem = function () {
    var _a;
    var _classSuper = ts_common_1.ObjectWithIdPlus;
    var _instanceExtraInitializers = [];
    var _options_decorators;
    var _options_initializers = [];
    return _a = /** @class */ (function (_super) {
            __extends(ProductItem, _super);
            function ProductItem() {
                var _this = _super !== null && _super.apply(this, arguments) || this;
                _this.parentId = (__runInitializers(_this, _instanceExtraInitializers), void 0);
                _this.idx = 0;
                _this.qty = 1;
                _this.options = __runInitializers(_this, _options_initializers, []);
                return _this;
            }
            Object.defineProperty(ProductItem.prototype, "optionsWithValues", {
                get: function () {
                    var _b;
                    if (!this.options)
                        return [];
                    return (_b = this.options) === null || _b === void 0 ? void 0 : _b.filter(function (o) { return o.hasValue(); });
                },
                enumerable: false,
                configurable: true
            });
            ProductItem.prototype.getOption = function (productOption, createIfNotExisting) {
                if (createIfNotExisting === void 0) { createIfNotExisting = true; }
                if (!this.options)
                    this.options = [];
                var productItemOption = this.options.find(function (o) { return o.id == productOption.id; });
                if ((productItemOption === null || productItemOption === void 0 ? void 0 : productItemOption.name) == 'Duur wellness') {
                    console.error(this.options);
                    console.error(productItemOption);
                }
                if (!productItemOption) { // && createIfNotExisting)
                    productItemOption = new ProductItemOption(productOption);
                    productItemOption.id = productOption.id;
                    productItemOption.name = productOption.name;
                    productItemOption.values = [];
                    if (productOption.values && productOption.values.length > 0) {
                        var defaultValues = productOption.values.filter(function (v) { return v.default === true; }).map(function (v) { return new ProductItemOptionValue(v); });
                        if (defaultValues && defaultValues.length > 0) {
                            if (productOption.multiSelect)
                                productItemOption.values = defaultValues;
                            else
                                productItemOption.values = [defaultValues[0]];
                        }
                    }
                    // if (productOption.multiSelect)
                    // if (productOption.values && productOption.values.length > 0)
                    //   option.values = productOption.values[0]
                    this.options.push(productItemOption);
                }
                return productItemOption;
            };
            return ProductItem;
        }(_classSuper)),
        (function () {
            var _b;
            var _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create((_b = _classSuper[Symbol.metadata]) !== null && _b !== void 0 ? _b : null) : void 0;
            _options_decorators = [(0, class_transformer_1.Type)(function () { return ProductItemOption; })];
            __esDecorate(null, null, _options_decorators, { kind: "field", name: "options", static: false, private: false, access: { has: function (obj) { return "options" in obj; }, get: function (obj) { return obj.options; }, set: function (obj, value) { obj.options = value; } }, metadata: _metadata }, _options_initializers, _instanceExtraInitializers);
            if (_metadata) Object.defineProperty(_a, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        })(),
        _a;
}();
exports.ProductItem = ProductItem;
/* export enum OptionPriceMode {
  abs = 'abs', // absolute price
  pct = 'pct'  // percentage price change
} */
/**
 * Used in price.options
 */
var OptionPrice = function () {
    var _a;
    var _instanceExtraInitializers = [];
    var _value_decorators;
    var _value_initializers = [];
    return _a = /** @class */ (function () {
            function OptionPrice() {
                this.optionId = (__runInitializers(this, _instanceExtraInitializers), void 0);
                /** this value (price or percentage) is valid for all option values */
                this.allValues = true;
                this.values = []; // array of {id, name} objects
                /** value is percentage, otherwise it's an absolute price */
                this.isPct = false;
                //mode: OptionPriceMode = OptionPriceMode.abs
                /** The price change */
                this.value = __runInitializers(this, _value_initializers, 0);
            }
            return OptionPrice;
        }()),
        (function () {
            var _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
            _value_decorators = [(0, class_transformer_1.Type)(function () { return Number; })];
            __esDecorate(null, null, _value_decorators, { kind: "field", name: "value", static: false, private: false, access: { has: function (obj) { return "value" in obj; }, get: function (obj) { return obj.value; }, set: function (obj, value) { obj.value = value; } }, metadata: _metadata }, _value_initializers, _instanceExtraInitializers);
            if (_metadata) Object.defineProperty(_a, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        })(),
        _a;
}();
exports.OptionPrice = OptionPrice;
var PriceMode;
(function (PriceMode) {
    PriceMode["same"] = "same";
    PriceMode["abs"] = "abs";
    PriceMode["pct"] = "pct"; // percentage price change
})(PriceMode || (exports.PriceMode = PriceMode = {}));
/*
isPromo Boolean @default(false) // not every price is a promotion, can also be more expensive price
title   String?
descr   String?
*/
var Price = function () {
    var _a;
    var _classSuper = ts_common_1.ObjectWithIdPlus;
    var _instanceExtraInitializers = [];
    var _value_decorators;
    var _value_initializers = [];
    var __startDate_decorators;
    var __startDate_initializers = [];
    var __endDate_decorators;
    var __endDate_initializers = [];
    return _a = /** @class */ (function (_super) {
            __extends(Price, _super);
            function Price(productId, title) {
                var _this = _super.call(this) || this;
                _this.productId = (__runInitializers(_this, _instanceExtraInitializers), void 0);
                /*   productOptionValueId?: string;
                  productOptionValue?: ProductOptionValue; */
                _this.type = PriceType.sales;
                _this.isPromo = false;
                _this.mode = PriceMode.pct;
                _this.value = __runInitializers(_this, _value_initializers, 0
                //  @Type(() => Date)
                );
                _this.qty = 1;
                _this.isQty = false;
                _this.isDay = false;
                _this.days = [];
                _this.isTime = false;
                _this.isExtraQty = false;
                _this.extraQty = 0;
                _this.hasOptions = false; // true if this price also has option specific price changes
                _this.options = [];
                _this.idx = 0;
                _this._startDate = __runInitializers(_this, __startDate_initializers, null);
                _this._endDate = __runInitializers(_this, __endDate_initializers, null);
                _this.productId = productId;
                _this.title = title;
                _this.initDays();
                return _this;
                // this.start = new Date()
                // this.end = new Date()
            }
            Price.prototype.initDays = function () {
                if (!this.days)
                    this.days = [];
                for (var i = this.days.length; i <= 6; i++) {
                    this.days.push(false);
                }
            };
            Object.defineProperty(Price.prototype, "startDate", {
                get: function () {
                    if (!this.start)
                        return null;
                    if (this._startDate && ts_common_1.DateHelper.yyyyMMddhhmmss(this._startDate) === this.start)
                        return this._startDate;
                    this._startDate = ts_common_1.DateHelper.parse(this.start);
                    return this._startDate;
                },
                set: function (value) {
                    if (value) {
                        this.start = ts_common_1.DateHelper.yyyyMMdd(value) * 1000000; // * 1000000 because we don't care about hhmmss
                        this._startDate = null;
                    }
                    else
                        this.start = null;
                },
                enumerable: false,
                configurable: true
            });
            Object.defineProperty(Price.prototype, "sameBasePrice", {
                get: function () {
                    return this.mode == PriceMode.same;
                },
                set: function (value) {
                    this.mode = value ? PriceMode.same : PriceMode.pct;
                },
                enumerable: false,
                configurable: true
            });
            Object.defineProperty(Price.prototype, "isAbsolute", {
                get: function () {
                    return this.mode == PriceMode.abs;
                },
                set: function (value) {
                    this.mode = value ? PriceMode.abs : PriceMode.same;
                },
                enumerable: false,
                configurable: true
            });
            Object.defineProperty(Price.prototype, "isPercentage", {
                get: function () {
                    return this.mode == PriceMode.pct;
                },
                set: function (value) {
                    this.mode = value ? PriceMode.pct : PriceMode.same;
                },
                enumerable: false,
                configurable: true
            });
            Object.defineProperty(Price.prototype, "endDate", {
                get: function () {
                    if (!this.end)
                        return null;
                    if (this._endDate && ts_common_1.DateHelper.yyyyMMddhhmmss(this._endDate) === this.end)
                        return this._endDate;
                    this._endDate = ts_common_1.DateHelper.parse(this.end);
                    return this._endDate;
                },
                set: function (value) {
                    if (value) {
                        this.end = ts_common_1.DateHelper.yyyyMMdd(value) * 1000000;
                        this._endDate = null;
                    }
                    else
                        this.end = null;
                },
                enumerable: false,
                configurable: true
            });
            return Price;
        }(_classSuper)),
        (function () {
            var _b;
            var _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create((_b = _classSuper[Symbol.metadata]) !== null && _b !== void 0 ? _b : null) : void 0;
            _value_decorators = [(0, class_transformer_1.Type)(function () { return Number; })];
            __startDate_decorators = [(0, class_transformer_1.Exclude)()];
            __endDate_decorators = [(0, class_transformer_1.Exclude)()];
            __esDecorate(null, null, _value_decorators, { kind: "field", name: "value", static: false, private: false, access: { has: function (obj) { return "value" in obj; }, get: function (obj) { return obj.value; }, set: function (obj, value) { obj.value = value; } }, metadata: _metadata }, _value_initializers, _instanceExtraInitializers);
            __esDecorate(null, null, __startDate_decorators, { kind: "field", name: "_startDate", static: false, private: false, access: { has: function (obj) { return "_startDate" in obj; }, get: function (obj) { return obj._startDate; }, set: function (obj, value) { obj._startDate = value; } }, metadata: _metadata }, __startDate_initializers, _instanceExtraInitializers);
            __esDecorate(null, null, __endDate_decorators, { kind: "field", name: "_endDate", static: false, private: false, access: { has: function (obj) { return "_endDate" in obj; }, get: function (obj) { return obj._endDate; }, set: function (obj, value) { obj._endDate = value; } }, metadata: _metadata }, __endDate_initializers, _instanceExtraInitializers);
            if (_metadata) Object.defineProperty(_a, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        })(),
        _a;
}();
exports.Price = Price;
var Organisation = /** @class */ (function (_super) {
    __extends(Organisation, _super);
    function Organisation() {
        var _this = _super !== null && _super.apply(this, arguments) || this;
        _this.idx = 0;
        _this.multiBranch = false;
        _this.agreeTerms = false;
        _this.optInNews = false;
        return _this;
    }
    Organisation.prototype.asDbObject = function () {
        return new ts_common_1.DbObjectCreate('organisation', Organisation, this);
    };
    return Organisation;
}(ts_common_1.ObjectWithIdPlus));
exports.Organisation = Organisation;
/** DepositTerms define how much time a customer has to pay for a reservation (pt=payment term)
 * based on how long the booking was made upfront (bt=before time)   */
var DepositTerm = /** @class */ (function () {
    function DepositTerm() {
        /** before time: time between reservation made and effective date of reservation */
        this.bt = 0;
        /** before time unit: (d)ays, (h)ours, (m)inutes */
        this.btu = 'd';
        /** payment term: the time a customer has to pay for his reservation */
        this.pt = 0;
        /** payment term unit: (d)ays, (h)ours, (m)inutes */
        this.ptu = 'h';
    }
    return DepositTerm;
}());
exports.DepositTerm = DepositTerm;
/** Message Types */
var MsgType;
(function (MsgType) {
    //unknown = 'unknown',
    MsgType["email"] = "email";
    /** WhatsApp */
    MsgType["wa"] = "wa";
    MsgType["sms"] = "sms";
})(MsgType || (exports.MsgType = MsgType = {}));
/*
model Message {
  id String @id(map: "newtable_pk") @default(dbgenerated("gen_random_uuid()")) @db.Uuid

  type String?  // email, sms

  from String?
  to String[]
  cc String[]
  bcc String[]

  subject String?
  body String?
}
*/
var IEmail = /** @class */ (function () {
    function IEmail() {
    }
    return IEmail;
}());
exports.IEmail = IEmail;
var MessageState;
(function (MessageState) {
    MessageState[MessageState["notSent"] = 0] = "notSent";
    MessageState[MessageState["error"] = 1] = "error";
    MessageState[MessageState["sent"] = 2] = "sent";
})(MessageState || (exports.MessageState = MessageState = {}));
var Message = /** @class */ (function (_super) {
    __extends(Message, _super);
    function Message() {
        var _this = _super !== null && _super.apply(this, arguments) || this;
        _this.type = MsgType.email;
        _this.to = [];
        _this.cc = [];
        _this.bcc = [];
        return _this;
    }
    Message.prototype.sentDate = function () {
        if (!this.sent)
            return null;
        var date = ts_common_1.DateHelper.parse(this.sent);
        return date;
    };
    Message.prototype.sentAt = function (value) {
        this.sent = ts_common_1.DateHelper.yyyyMMddhhmmss(value);
    };
    return Message;
}(ts_common_1.ObjectWithIdPlus));
exports.Message = Message;
var ReminderConfig = /** @class */ (function () {
    function ReminderConfig() {
        this.type = MsgType.email;
        this.dur = 1;
        this.unit = TimeUnit.days;
    }
    ReminderConfig.prototype.seconds = function () {
        return TimeUnitHelper.numberOfSeconds(this.unit) * this.dur;
    };
    ReminderConfig.prototype.toMsgInfo = function (appointmentDate) {
        var seconds = this.seconds();
        var remindeOn = dateFns.addSeconds(appointmentDate, -seconds);
        var reminder = new MsgInfo(remindeOn, this.type, 'reminder');
        return reminder;
    };
    return ReminderConfig;
}());
exports.ReminderConfig = ReminderConfig;
var MsgInfo = function () {
    var _a;
    var _instanceExtraInitializers = [];
    var _date_decorators;
    var _date_initializers = [];
    return _a = /** @class */ (function () {
            //tags: string[]
            function MsgInfo(date, type, code) {
                if (type === void 0) { type = MsgType.email; }
                this.date = (__runInitializers(this, _instanceExtraInitializers), __runInitializers(this, _date_initializers, void 0));
                this.date = date;
                this.on = ts_common_1.DateHelper.yyyyMMddhhmmss(date);
                this.type = type;
                this.code = code;
            }
            return MsgInfo;
        }()),
        (function () {
            var _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
            _date_decorators = [(0, class_transformer_1.Exclude)()];
            __esDecorate(null, null, _date_decorators, { kind: "field", name: "date", static: false, private: false, access: { has: function (obj) { return "date" in obj; }, get: function (obj) { return obj.date; }, set: function (obj, value) { obj.date = value; } }, metadata: _metadata }, _date_initializers, _instanceExtraInitializers);
            if (_metadata) Object.defineProperty(_a, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        })(),
        _a;
}();
exports.MsgInfo = MsgInfo;
var GiftConfigMethods = /** @class */ (function () {
    function GiftConfigMethods() {
        this.email = true;
        this.postal = false;
        this.pos = true;
        this.app = false;
    }
    return GiftConfigMethods;
}());
exports.GiftConfigMethods = GiftConfigMethods;
var GiftTypes = /** @class */ (function () {
    function GiftTypes() {
        // an amount can be gifted
        this.amount = true;
        // specific services can be gifted
        this.svc = true;
        // specific products can be gifted
        this.prod = false;
    }
    return GiftTypes;
}());
exports.GiftTypes = GiftTypes;
var GiftExpiration = /** @class */ (function () {
    function GiftExpiration() {
        /** gift expiration is enabled */
        this.on = true;
        /** how long is gift voucher valid */
        this.after = 12;
        this.unit = TimeUnit.months;
    }
    return GiftExpiration;
}());
exports.GiftExpiration = GiftExpiration;
var GiftPriceSetting = /** @class */ (function () {
    function GiftPriceSetting() {
        /** If true, possible new prices will be charged to customer (=> old gift voucher might not be enough).
         * If false, customer can always use gift voucher for this product  */
        this.new = false;
        /** if new=true, new prices will only be charged after time period (in units)   */
        this.newAfter = 12;
        this.unit = TimeUnit.months;
        /** if branch.gift.methods.postal = true, cost that will be charged to send gift via post. */
        this.postal = 0;
    }
    return GiftPriceSetting;
}());
exports.GiftPriceSetting = GiftPriceSetting;
var GiftVatPct = /** @class */ (function () {
    function GiftVatPct() {
        this.on = false;
        this.pct = 0;
        this.descr = '';
    }
    return GiftVatPct;
}());
exports.GiftVatPct = GiftVatPct;
var GiftInvoicing = /** @class */ (function () {
    function GiftInvoicing() {
        /** gift invoicing is enabled: customer can request invoice for gift */
        this.on = false;
        /** when customer gifts an amount (no specific product) and requests an invoice, then he should select a VAT% (category).
         * Here we specify which percentages can be selected and give them a name.  */
        this.vatPcts = [];
    }
    return GiftInvoicing;
}());
exports.GiftInvoicing = GiftInvoicing;
var GiftConfig = function () {
    var _a;
    var _instanceExtraInitializers = [];
    var _methods_decorators;
    var _methods_initializers = [];
    var _types_decorators;
    var _types_initializers = [];
    var _expire_decorators;
    var _expire_initializers = [];
    var _price_decorators;
    var _price_initializers = [];
    var _invoice_decorators;
    var _invoice_initializers = [];
    return _a = /** @class */ (function () {
            function GiftConfig() {
                this.methods = (__runInitializers(this, _instanceExtraInitializers), __runInitializers(this, _methods_initializers, new GiftConfigMethods()));
                this.types = __runInitializers(this, _types_initializers, new GiftTypes());
                this.expire = __runInitializers(this, _expire_initializers, new GiftExpiration());
                this.price = __runInitializers(this, _price_initializers, new GiftPriceSetting());
                this.invoice = __runInitializers(this, _invoice_initializers, new GiftInvoicing());
            }
            return GiftConfig;
        }()),
        (function () {
            var _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
            _methods_decorators = [(0, class_transformer_1.Type)(function () { return GiftConfigMethods; })];
            _types_decorators = [(0, class_transformer_1.Type)(function () { return GiftTypes; })];
            _expire_decorators = [(0, class_transformer_1.Type)(function () { return GiftExpiration; })];
            _price_decorators = [(0, class_transformer_1.Type)(function () { return GiftPriceSetting; })];
            _invoice_decorators = [(0, class_transformer_1.Type)(function () { return GiftInvoicing; })];
            __esDecorate(null, null, _methods_decorators, { kind: "field", name: "methods", static: false, private: false, access: { has: function (obj) { return "methods" in obj; }, get: function (obj) { return obj.methods; }, set: function (obj, value) { obj.methods = value; } }, metadata: _metadata }, _methods_initializers, _instanceExtraInitializers);
            __esDecorate(null, null, _types_decorators, { kind: "field", name: "types", static: false, private: false, access: { has: function (obj) { return "types" in obj; }, get: function (obj) { return obj.types; }, set: function (obj, value) { obj.types = value; } }, metadata: _metadata }, _types_initializers, _instanceExtraInitializers);
            __esDecorate(null, null, _expire_decorators, { kind: "field", name: "expire", static: false, private: false, access: { has: function (obj) { return "expire" in obj; }, get: function (obj) { return obj.expire; }, set: function (obj, value) { obj.expire = value; } }, metadata: _metadata }, _expire_initializers, _instanceExtraInitializers);
            __esDecorate(null, null, _price_decorators, { kind: "field", name: "price", static: false, private: false, access: { has: function (obj) { return "price" in obj; }, get: function (obj) { return obj.price; }, set: function (obj, value) { obj.price = value; } }, metadata: _metadata }, _price_initializers, _instanceExtraInitializers);
            __esDecorate(null, null, _invoice_decorators, { kind: "field", name: "invoice", static: false, private: false, access: { has: function (obj) { return "invoice" in obj; }, get: function (obj) { return obj.invoice; }, set: function (obj, value) { obj.invoice = value; } }, metadata: _metadata }, _invoice_initializers, _instanceExtraInitializers);
            if (_metadata) Object.defineProperty(_a, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        })(),
        _a;
}();
exports.GiftConfig = GiftConfig;
var Branch = function () {
    var _a;
    var _classSuper = ts_common_1.ObjectWithIdPlus;
    var _instanceExtraInitializers = [];
    var _depositTerms_decorators;
    var _depositTerms_initializers = [];
    var _reminders_decorators;
    var _reminders_initializers = [];
    var _gift_decorators;
    var _gift_initializers = [];
    return _a = /** @class */ (function (_super) {
            __extends(Branch, _super);
            function Branch() {
                var _this = _super !== null && _super.apply(this, arguments) || this;
                _this.orders = (__runInitializers(_this, _instanceExtraInitializers), void 0);
                _this.idx = 0;
                /** currency */
                _this.cur = 'EUR';
                _this.vatIncl = true;
                _this.vatPct = 0;
                _this.smsOn = false;
                /** min number of hours before reservation for free cancel (0 = always free cancel, 24 = 1 day upfront for free cancel, ...) */
                _this.cancel = 0;
                _this.depositTerms = __runInitializers(_this, _depositTerms_initializers, void 0);
                _this.reminders = __runInitializers(_this, _reminders_initializers, void 0);
                /** this branch uses the gift functionality */
                _this.giftOn = false;
                _this.gift = __runInitializers(_this, _gift_initializers, void 0);
                return _this;
            }
            Object.defineProperty(Branch.prototype, "sameDayTerm", {
                get: function () { return this.getDepositTerm(0); },
                set: function (value) { this.setDepositTerm(0, value); },
                enumerable: false,
                configurable: true
            });
            Object.defineProperty(Branch.prototype, "nextDayTerm", {
                get: function () { return this.getDepositTerm(1); },
                set: function (value) { this.setDepositTerm(1, value); },
                enumerable: false,
                configurable: true
            });
            Object.defineProperty(Branch.prototype, "nextWeekTerm", {
                get: function () { return this.getDepositTerm(7); },
                set: function (value) { this.setDepositTerm(7, value); },
                enumerable: false,
                configurable: true
            });
            Object.defineProperty(Branch.prototype, "nextMonthTerm", {
                get: function () { return this.getDepositTerm(30); },
                set: function (value) { this.setDepositTerm(30, value); },
                enumerable: false,
                configurable: true
            });
            // 
            //nextDayTerm: number = 5
            Branch.prototype.hasReminders = function () {
                return (Array.isArray(this.reminders) && this.reminders.length > 0);
            };
            Branch.prototype.getDepositTerm = function (beforeTime, beforeUnit) {
                if (beforeUnit === void 0) { beforeUnit = 'd'; }
                if (!Array.isArray(this === null || this === void 0 ? void 0 : this.depositTerms))
                    return null;
                var term = this === null || this === void 0 ? void 0 : this.depositTerms.find(function (dt) { return dt.bt == beforeTime && dt.btu == beforeUnit; });
                if (!term)
                    return null;
                else
                    return term.pt;
            };
            Branch.prototype.setDepositTerm = function (beforeTime, depositTerm, beforeUnit) {
                if (beforeUnit === void 0) { beforeUnit = 'd'; }
                if (!Array.isArray(this === null || this === void 0 ? void 0 : this.depositTerms))
                    this.depositTerms = [];
                if (!depositTerm) {
                    _.remove(this === null || this === void 0 ? void 0 : this.depositTerms, function (t) { return t.bt == beforeTime && t.btu == beforeUnit; });
                    console.warn(this === null || this === void 0 ? void 0 : this.depositTerms);
                    return;
                }
                var term = this === null || this === void 0 ? void 0 : this.depositTerms.find(function (dt) { return dt.bt == beforeTime && dt.btu == beforeUnit; });
                if (term) {
                    term.pt = depositTerm;
                }
                else {
                    term = new DepositTerm();
                    term.bt = beforeTime;
                    term.btu = beforeUnit;
                    term.pt = depositTerm;
                    this.depositTerms.push(term);
                }
                console.error(term);
                console.warn(this === null || this === void 0 ? void 0 : this.depositTerms);
            };
            return Branch;
        }(_classSuper)),
        (function () {
            var _b;
            var _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create((_b = _classSuper[Symbol.metadata]) !== null && _b !== void 0 ? _b : null) : void 0;
            _depositTerms_decorators = [(0, class_transformer_1.Type)(function () { return DepositTerm; })];
            _reminders_decorators = [(0, class_transformer_1.Type)(function () { return ReminderConfig; })];
            _gift_decorators = [(0, class_transformer_1.Type)(function () { return GiftConfig; })];
            __esDecorate(null, null, _depositTerms_decorators, { kind: "field", name: "depositTerms", static: false, private: false, access: { has: function (obj) { return "depositTerms" in obj; }, get: function (obj) { return obj.depositTerms; }, set: function (obj, value) { obj.depositTerms = value; } }, metadata: _metadata }, _depositTerms_initializers, _instanceExtraInitializers);
            __esDecorate(null, null, _reminders_decorators, { kind: "field", name: "reminders", static: false, private: false, access: { has: function (obj) { return "reminders" in obj; }, get: function (obj) { return obj.reminders; }, set: function (obj, value) { obj.reminders = value; } }, metadata: _metadata }, _reminders_initializers, _instanceExtraInitializers);
            __esDecorate(null, null, _gift_decorators, { kind: "field", name: "gift", static: false, private: false, access: { has: function (obj) { return "gift" in obj; }, get: function (obj) { return obj.gift; }, set: function (obj, value) { obj.gift = value; } }, metadata: _metadata }, _gift_initializers, _instanceExtraInitializers);
            if (_metadata) Object.defineProperty(_a, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        })(),
        _a;
}();
exports.Branch = Branch;
var ResourceType;
(function (ResourceType) {
    ResourceType["human"] = "human";
    // do NOT use anymore, use location instead!
    //room = 'room',
    ResourceType["location"] = "location";
    ResourceType["device"] = "device";
    //  group = 'group',
})(ResourceType || (exports.ResourceType = ResourceType = {}));
var ResourceTypeIcons;
(function (ResourceTypeIcons) {
    ResourceTypeIcons["human"] = "fa-duotone fa-person-dress";
    ResourceTypeIcons["room"] = "fa-duotone fa-house";
    ResourceTypeIcons["device"] = "fa-duotone fa-computer-classic";
    ResourceTypeIcons["group"] = "fa-duotone fa-user-group";
})(ResourceTypeIcons || (exports.ResourceTypeIcons = ResourceTypeIcons = {}));
var ResourceTypeCircleIcons;
(function (ResourceTypeCircleIcons) {
    ResourceTypeCircleIcons["human"] = "fa-solid fa-circle-user";
    ResourceTypeCircleIcons["room"] = "fa-duotone fa-house";
    ResourceTypeCircleIcons["device"] = "fa-duotone fa-tablet-rugged";
    ResourceTypeCircleIcons["group"] = "fa-duotone fa-user-group";
})(ResourceTypeCircleIcons || (exports.ResourceTypeCircleIcons = ResourceTypeCircleIcons = {}));
var Resource = function () {
    var _a;
    var _classSuper = ts_common_1.ObjectWithIdPlus;
    var _instanceExtraInitializers = [];
    var _groups_decorators;
    var _groups_initializers = [];
    var _children_decorators;
    var _children_initializers = [];
    var _products_decorators;
    var _products_initializers = [];
    var _schedules_decorators;
    var _schedules_initializers = [];
    var __startDate_decorators;
    var __startDate_initializers = [];
    var __endDate_decorators;
    var __endDate_initializers = [];
    return _a = /** @class */ (function (_super) {
            __extends(Resource, _super);
            function Resource() {
                var _this = _super !== null && _super.apply(this, arguments) || this;
                _this.groups = (__runInitializers(_this, _instanceExtraInitializers), __runInitializers(_this, _groups_initializers, void 0));
                _this.children = __runInitializers(_this, _children_initializers, void 0);
                _this.products = __runInitializers(_this, _products_initializers, void 0);
                /*   @Type(() => Scheduling)
                  scheduling?: Scheduling[]; */
                _this.schedules = __runInitializers(_this, _schedules_initializers, void 0);
                _this.qty = 1;
                _this.isGroup = false;
                /*   active?: boolean;
                  deleted?: boolean;
                  deletedAt?: Date; */
                /** Most resources use the schedule (opening hours) of the branch, but a custom schedule can be specified per resource  */
                _this.customSchedule = false;
                _this._startDate = __runInitializers(_this, __startDate_initializers, null);
                _this._endDate = __runInitializers(_this, __endDate_initializers, null);
                return _this;
            }
            Resource.prototype.shortOrName = function () {
                return (this.short) ? this.short : this.name;
            };
            Resource.prototype.canChangeQty = function () {
                return (this.type == ResourceType.device || this.type == ResourceType.location);
            };
            Resource.prototype.getChildResources = function () {
                if (!Array.isArray(this.children))
                    return [];
                var childResources = this.children.filter(function (resourceLink) { return resourceLink === null || resourceLink === void 0 ? void 0 : resourceLink.child; }).map(function (resourceLink) { return resourceLink.child; });
                return childResources;
                /*
                const childResources: Resource[] = []
            
                if (!Array.isArray(this.children))
                  return childResources
            
                for (const resourceLink of this.children!) {
            
                  if (resourceLink.child)
                    childResources.push(resourceLink.child)
                }
            
                return childResources
                */
            };
            Object.defineProperty(Resource.prototype, "startDate", {
                get: function () {
                    if (!this.start)
                        return null;
                    if (this._startDate && ts_common_1.DateHelper.yyyyMMddhhmmss(this._startDate) === this.start)
                        return this._startDate;
                    this._startDate = ts_common_1.DateHelper.parse(this.start);
                    return this._startDate;
                },
                set: function (value) {
                    if (value) {
                        this.start = ts_common_1.DateHelper.yyyyMMdd(value) * 1000000; // * 1000000 because we don't care about hhmmss
                        this._startDate = null;
                    }
                    else
                        this.start = null;
                },
                enumerable: false,
                configurable: true
            });
            Object.defineProperty(Resource.prototype, "endDate", {
                get: function () {
                    if (!this.end)
                        return null;
                    if (this._endDate && ts_common_1.DateHelper.yyyyMMddhhmmss(this._endDate) === this.end)
                        return this._endDate;
                    this._endDate = ts_common_1.DateHelper.parse(this.end);
                    return this._endDate;
                },
                set: function (value) {
                    if (value) {
                        this.end = ts_common_1.DateHelper.yyyyMMdd(value) * 1000000;
                        this._endDate = null;
                    }
                    else
                        this.end = null;
                },
                enumerable: false,
                configurable: true
            });
            Object.defineProperty(Resource.prototype, "hasStart", {
                get: function () {
                    return (this.start !== undefined && this.start !== null);
                },
                set: function (value) {
                    if (value) {
                        var now = new Date();
                        this.start = ts_common_1.DateHelper.yyyyMMddhhmmss(now);
                        //  this.start = new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate(),6))
                    }
                    else
                        this.start = null;
                },
                enumerable: false,
                configurable: true
            });
            Object.defineProperty(Resource.prototype, "hasEnd", {
                get: function () {
                    return (this.end !== undefined && this.end !== null);
                },
                set: function (value) {
                    if (value) {
                        var now = new Date();
                        this.end = ts_common_1.DateHelper.yyyyMMddhhmmss(now);
                        // this.end = new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate(),21))
                    }
                    else
                        this.end = null;
                },
                enumerable: false,
                configurable: true
            });
            return Resource;
        }(_classSuper)),
        (function () {
            var _b;
            var _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create((_b = _classSuper[Symbol.metadata]) !== null && _b !== void 0 ? _b : null) : void 0;
            _groups_decorators = [(0, class_transformer_1.Type)(function () { return ResourceLink; })];
            _children_decorators = [(0, class_transformer_1.Type)(function () { return ResourceLink; })];
            _products_decorators = [(0, class_transformer_1.Type)(function () { return ProductResource; })];
            _schedules_decorators = [(0, class_transformer_1.Type)(function () { return Schedule; })];
            __startDate_decorators = [(0, class_transformer_1.Exclude)()];
            __endDate_decorators = [(0, class_transformer_1.Exclude)()];
            __esDecorate(null, null, _groups_decorators, { kind: "field", name: "groups", static: false, private: false, access: { has: function (obj) { return "groups" in obj; }, get: function (obj) { return obj.groups; }, set: function (obj, value) { obj.groups = value; } }, metadata: _metadata }, _groups_initializers, _instanceExtraInitializers);
            __esDecorate(null, null, _children_decorators, { kind: "field", name: "children", static: false, private: false, access: { has: function (obj) { return "children" in obj; }, get: function (obj) { return obj.children; }, set: function (obj, value) { obj.children = value; } }, metadata: _metadata }, _children_initializers, _instanceExtraInitializers);
            __esDecorate(null, null, _products_decorators, { kind: "field", name: "products", static: false, private: false, access: { has: function (obj) { return "products" in obj; }, get: function (obj) { return obj.products; }, set: function (obj, value) { obj.products = value; } }, metadata: _metadata }, _products_initializers, _instanceExtraInitializers);
            __esDecorate(null, null, _schedules_decorators, { kind: "field", name: "schedules", static: false, private: false, access: { has: function (obj) { return "schedules" in obj; }, get: function (obj) { return obj.schedules; }, set: function (obj, value) { obj.schedules = value; } }, metadata: _metadata }, _schedules_initializers, _instanceExtraInitializers);
            __esDecorate(null, null, __startDate_decorators, { kind: "field", name: "_startDate", static: false, private: false, access: { has: function (obj) { return "_startDate" in obj; }, get: function (obj) { return obj._startDate; }, set: function (obj, value) { obj._startDate = value; } }, metadata: _metadata }, __startDate_initializers, _instanceExtraInitializers);
            __esDecorate(null, null, __endDate_decorators, { kind: "field", name: "_endDate", static: false, private: false, access: { has: function (obj) { return "_endDate" in obj; }, get: function (obj) { return obj._endDate; }, set: function (obj, value) { obj._endDate = value; } }, metadata: _metadata }, __endDate_initializers, _instanceExtraInitializers);
            if (_metadata) Object.defineProperty(_a, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        })(),
        _a;
}();
exports.Resource = Resource;
var ResourceLink = function () {
    var _a;
    var _classSuper = ts_common_1.ManagedObject;
    var _instanceExtraInitializers = [];
    var _get_id_decorators;
    var _group_decorators;
    var _group_initializers = [];
    var _child_decorators;
    var _child_initializers = [];
    var _upd_decorators;
    var _upd_initializers = [];
    return _a = /** @class */ (function (_super) {
            __extends(ResourceLink, _super);
            function ResourceLink() {
                var _this = _super !== null && _super.apply(this, arguments) || this;
                _this.groupId = (__runInitializers(_this, _instanceExtraInitializers), void 0);
                _this.group = __runInitializers(_this, _group_initializers, void 0);
                _this.child = __runInitializers(_this, _child_initializers, void 0);
                /** preference */
                _this.pref = 0;
                /** object is active */
                _this.act = true;
                /** object is deleted */
                _this.del = true;
                /** last update performed on object (starting with creation and ending with soft delete => del=true) */
                _this.upd = __runInitializers(_this, _upd_initializers, new Date());
                return _this;
            }
            Object.defineProperty(ResourceLink.prototype, "id", {
                get: function () {
                    return "".concat(this.groupId, "_").concat(this.childId);
                },
                enumerable: false,
                configurable: true
            });
            return ResourceLink;
        }(_classSuper)),
        (function () {
            var _b;
            var _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create((_b = _classSuper[Symbol.metadata]) !== null && _b !== void 0 ? _b : null) : void 0;
            _get_id_decorators = [(0, class_transformer_1.Exclude)()];
            _group_decorators = [(0, class_transformer_1.Type)(function () { return Resource; })];
            _child_decorators = [(0, class_transformer_1.Type)(function () { return Resource; })];
            _upd_decorators = [(0, class_transformer_1.Type)(function () { return Date; })];
            __esDecorate(_a, null, _get_id_decorators, { kind: "getter", name: "id", static: false, private: false, access: { has: function (obj) { return "id" in obj; }, get: function (obj) { return obj.id; } }, metadata: _metadata }, null, _instanceExtraInitializers);
            __esDecorate(null, null, _group_decorators, { kind: "field", name: "group", static: false, private: false, access: { has: function (obj) { return "group" in obj; }, get: function (obj) { return obj.group; }, set: function (obj, value) { obj.group = value; } }, metadata: _metadata }, _group_initializers, _instanceExtraInitializers);
            __esDecorate(null, null, _child_decorators, { kind: "field", name: "child", static: false, private: false, access: { has: function (obj) { return "child" in obj; }, get: function (obj) { return obj.child; }, set: function (obj, value) { obj.child = value; } }, metadata: _metadata }, _child_initializers, _instanceExtraInitializers);
            __esDecorate(null, null, _upd_decorators, { kind: "field", name: "upd", static: false, private: false, access: { has: function (obj) { return "upd" in obj; }, get: function (obj) { return obj.upd; }, set: function (obj, value) { obj.upd = value; } }, metadata: _metadata }, _upd_initializers, _instanceExtraInitializers);
            if (_metadata) Object.defineProperty(_a, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        })(),
        _a;
}();
exports.ResourceLink = ResourceLink;
var ProductResource = function () {
    var _a;
    var _classSuper = ts_common_1.ObjectWithIdPlus;
    var _instanceExtraInitializers = [];
    var _product_decorators;
    var _product_initializers = [];
    var _resource_decorators;
    var _resource_initializers = [];
    return _a = /** @class */ (function (_super) {
            __extends(ProductResource, _super);
            function ProductResource() {
                var _this = _super.call(this) || this;
                _this.productId = (__runInitializers(_this, _instanceExtraInitializers), void 0);
                _this.product = __runInitializers(_this, _product_initializers, void 0);
                _this.resource = __runInitializers(_this, _resource_initializers, void 0);
                _this.durationMode = DurationMode.custom;
                _this.reference = DurationReference.start;
                _this.offset = 0;
                _this.duration = 0;
                /** if resource is group => how many resources from group do we need to reserve */
                _this.groupQty = 1;
                /** group allocation = instead of allocating a specific resource (person,...), we allocate on resource group => make sure at least 1 resource stays available */
                _this.groupAlloc = false;
                /** if rule only applies for certain schedules (typically branch schedules) */
                _this.scheduleIds = [];
                /** is preperation time (before or after actual treatment) */
                _this.prep = false;
                /** the preparation time after a booking/treatment can overlap with prep time before next booking (the max of before/after will be used) */
                _this.prepOverlap = false;
                return _this;
            }
            return ProductResource;
        }(_classSuper)),
        (function () {
            var _b;
            var _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create((_b = _classSuper[Symbol.metadata]) !== null && _b !== void 0 ? _b : null) : void 0;
            _product_decorators = [(0, class_transformer_1.Type)(function () { return Product; })];
            _resource_decorators = [(0, class_transformer_1.Type)(function () { return Resource; })];
            __esDecorate(null, null, _product_decorators, { kind: "field", name: "product", static: false, private: false, access: { has: function (obj) { return "product" in obj; }, get: function (obj) { return obj.product; }, set: function (obj, value) { obj.product = value; } }, metadata: _metadata }, _product_initializers, _instanceExtraInitializers);
            __esDecorate(null, null, _resource_decorators, { kind: "field", name: "resource", static: false, private: false, access: { has: function (obj) { return "resource" in obj; }, get: function (obj) { return obj.resource; }, set: function (obj, value) { obj.resource = value; } }, metadata: _metadata }, _resource_initializers, _instanceExtraInitializers);
            if (_metadata) Object.defineProperty(_a, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        })(),
        _a;
}();
exports.ProductResource = ProductResource;
/**
 *  A formula term
 */
var FormulaTerm = /** @class */ (function () {
    function FormulaTerm() {
        this.factor = 1;
        this.value = true;
    }
    return FormulaTerm;
}());
exports.FormulaTerm = FormulaTerm;
var ProductOption = function () {
    var _a;
    var _classSuper = ts_common_1.ObjectWithIdPlus;
    var _instanceExtraInitializers = [];
    var _values_decorators;
    var _values_initializers = [];
    var _formula_decorators;
    var _formula_initializers = [];
    return _a = /** @class */ (function (_super) {
            __extends(ProductOption, _super);
            function ProductOption() {
                var _this = _super !== null && _super.apply(this, arguments) || this;
                _this.productId = (__runInitializers(_this, _instanceExtraInitializers), void 0);
                _this.values = __runInitializers(_this, _values_initializers, void 0);
                _this.idx = 0;
                _this.public = true;
                _this.required = true;
                _this.multiSelect = false;
                _this.hasDuration = false;
                _this.hasPrice = false;
                _this.hasValue = false;
                _this.hasFormula = false;
                /** Sum of 1 or more formula terms */
                _this.formula = __runInitializers(_this, _formula_initializers, []
                /** private option: customers can't select, only internally */
                );
                /** private option: customers can't select, only internally */
                _this.pvt = false;
                return _this;
            }
            /** the property providing the value*/
            //factorOptionProp?: string
            ProductOption.prototype.hasValues = function () {
                return (Array.isArray(this.values) && this.values.length > 0);
            };
            ProductOption.prototype.getDefaultValues = function () {
                if (!this.values || this.values.length == 0)
                    return undefined;
                return this.values.filter(function (v) { return v.default; });
            };
            ProductOption.prototype.getValues = function (ids) {
                if (!Array.isArray(this.values) || !Array.isArray(ids))
                    return [];
                var values = this.values.filter(function (v) { return ids.indexOf(v.id) >= 0; });
                return values;
            };
            ProductOption.prototype.toProductItemOptionValues = function () {
                if (!this.values)
                    return [];
                return this.values.map(function (v) { return new ProductItemOptionValue(v); });
            };
            return ProductOption;
        }(_classSuper)),
        (function () {
            var _b;
            var _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create((_b = _classSuper[Symbol.metadata]) !== null && _b !== void 0 ? _b : null) : void 0;
            _values_decorators = [(0, class_transformer_1.Type)(function () { return ProductOptionValue; })];
            _formula_decorators = [(0, class_transformer_1.Type)(function () { return FormulaTerm; })];
            __esDecorate(null, null, _values_decorators, { kind: "field", name: "values", static: false, private: false, access: { has: function (obj) { return "values" in obj; }, get: function (obj) { return obj.values; }, set: function (obj, value) { obj.values = value; } }, metadata: _metadata }, _values_initializers, _instanceExtraInitializers);
            __esDecorate(null, null, _formula_decorators, { kind: "field", name: "formula", static: false, private: false, access: { has: function (obj) { return "formula" in obj; }, get: function (obj) { return obj.formula; }, set: function (obj, value) { obj.formula = value; } }, metadata: _metadata }, _formula_initializers, _instanceExtraInitializers);
            if (_metadata) Object.defineProperty(_a, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        })(),
        _a;
}();
exports.ProductOption = ProductOption;
var ProductOptionValue = function () {
    var _a;
    var _classSuper = ts_common_1.ObjectWithIdPlus;
    var _instanceExtraInitializers = [];
    var _duration_decorators;
    var _duration_initializers = [];
    var _price_decorators;
    var _price_initializers = [];
    var _value_decorators;
    var _value_initializers = [];
    return _a = /** @class */ (function (_super) {
            __extends(ProductOptionValue, _super);
            function ProductOptionValue() {
                var _this = _super !== null && _super.apply(this, arguments) || this;
                _this.optionId = (__runInitializers(_this, _instanceExtraInitializers), void 0);
                _this.idx = 0;
                _this.duration = __runInitializers(_this, _duration_initializers, 0
                // @TransformToNumber()
                );
                // @TransformToNumber()
                _this.price = __runInitializers(_this, _price_initializers, 0);
                _this.value = __runInitializers(_this, _value_initializers, 0
                /*
                @Type(() => Number)
                factor = 0 */
                /** private option value: customers can't select specific value, only internally */
                );
                /*
                @Type(() => Number)
                factor = 0 */
                /** private option value: customers can't select specific value, only internally */
                _this.pvt = false;
                _this.default = false;
                return _this;
            }
            Object.defineProperty(ProductOptionValue.prototype, "namePrice", {
                get: function () {
                    return this.name;
                    if (!this.price || this.price == 0)
                        return this.name;
                    else
                        return "".concat(this.name, " (+").concat(this.price, ")");
                },
                enumerable: false,
                configurable: true
            });
            return ProductOptionValue;
        }(_classSuper)),
        (function () {
            var _b;
            var _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create((_b = _classSuper[Symbol.metadata]) !== null && _b !== void 0 ? _b : null) : void 0;
            _duration_decorators = [(0, class_transformer_1.Type)(function () { return Number; })];
            _price_decorators = [(0, class_transformer_1.Type)(function () { return Number; })];
            _value_decorators = [(0, class_transformer_1.Type)(function () { return Number; })];
            __esDecorate(null, null, _duration_decorators, { kind: "field", name: "duration", static: false, private: false, access: { has: function (obj) { return "duration" in obj; }, get: function (obj) { return obj.duration; }, set: function (obj, value) { obj.duration = value; } }, metadata: _metadata }, _duration_initializers, _instanceExtraInitializers);
            __esDecorate(null, null, _price_decorators, { kind: "field", name: "price", static: false, private: false, access: { has: function (obj) { return "price" in obj; }, get: function (obj) { return obj.price; }, set: function (obj, value) { obj.price = value; } }, metadata: _metadata }, _price_initializers, _instanceExtraInitializers);
            __esDecorate(null, null, _value_decorators, { kind: "field", name: "value", static: false, private: false, access: { has: function (obj) { return "value" in obj; }, get: function (obj) { return obj.value; }, set: function (obj, value) { obj.value = value; } }, metadata: _metadata }, _value_initializers, _instanceExtraInitializers);
            if (_metadata) Object.defineProperty(_a, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        })(),
        _a;
}();
exports.ProductOptionValue = ProductOptionValue;
var InvoiceState;
(function (InvoiceState) {
    InvoiceState["toInvoice"] = "toInvoice";
    InvoiceState["invoiced"] = "invoiced";
    InvoiceState["onHold"] = "onHold";
})(InvoiceState || (exports.InvoiceState = InvoiceState = {}));
var Invoice = function () {
    var _a;
    var _classSuper = ts_common_1.ObjectWithIdPlus;
    var _instanceExtraInitializers = [];
    var _to_decorators;
    var _to_initializers = [];
    return _a = /** @class */ (function (_super) {
            __extends(Invoice, _super);
            function Invoice() {
                var _this = _super !== null && _super.apply(this, arguments) || this;
                _this.orders = (__runInitializers(_this, _instanceExtraInitializers), void 0);
                _this.state = InvoiceState.toInvoice;
                _this.to = __runInitializers(_this, _to_initializers, void 0);
                _this.country = 'BEL';
                return _this;
            }
            return Invoice;
        }(_classSuper)),
        (function () {
            var _b;
            var _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create((_b = _classSuper[Symbol.metadata]) !== null && _b !== void 0 ? _b : null) : void 0;
            _to_decorators = [(0, class_transformer_1.Type)(function () { return Contact; })];
            __esDecorate(null, null, _to_decorators, { kind: "field", name: "to", static: false, private: false, access: { has: function (obj) { return "to" in obj; }, get: function (obj) { return obj.to; }, set: function (obj, value) { obj.to = value; } }, metadata: _metadata }, _to_initializers, _instanceExtraInitializers);
            if (_metadata) Object.defineProperty(_a, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        })(),
        _a;
}();
exports.Invoice = Invoice;
var Subscription = function () {
    var _a;
    var _classSuper = ts_common_1.ObjectWithIdPlus;
    var _instanceExtraInitializers = [];
    var _contact_decorators;
    var _contact_initializers = [];
    var _subscriptionProduct_decorators;
    var _subscriptionProduct_initializers = [];
    var _unitProduct_decorators;
    var _unitProduct_initializers = [];
    var _crea_decorators;
    var _crea_initializers = [];
    return _a = /** @class */ (function (_super) {
            __extends(Subscription, _super);
            function Subscription() {
                var _this = _super !== null && _super.apply(this, arguments) || this;
                _this.orgId = (__runInitializers(_this, _instanceExtraInitializers), void 0);
                _this.contact = __runInitializers(_this, _contact_initializers, void 0);
                _this.subscriptionProduct = __runInitializers(_this, _subscriptionProduct_initializers, void 0);
                _this.unitProduct = __runInitializers(_this, _unitProduct_initializers, void 0);
                _this.totalQty = 0;
                _this.usedQty = 0;
                /** created at */
                _this.crea = __runInitializers(_this, _crea_initializers, new Date());
                return _this;
            }
            return Subscription;
        }(_classSuper)),
        (function () {
            var _b;
            var _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create((_b = _classSuper[Symbol.metadata]) !== null && _b !== void 0 ? _b : null) : void 0;
            _contact_decorators = [(0, class_transformer_1.Type)(function () { return Contact; })];
            _subscriptionProduct_decorators = [(0, class_transformer_1.Type)(function () { return Product; })];
            _unitProduct_decorators = [(0, class_transformer_1.Type)(function () { return Product; })];
            _crea_decorators = [(0, class_transformer_1.Type)(function () { return Date; })];
            __esDecorate(null, null, _contact_decorators, { kind: "field", name: "contact", static: false, private: false, access: { has: function (obj) { return "contact" in obj; }, get: function (obj) { return obj.contact; }, set: function (obj, value) { obj.contact = value; } }, metadata: _metadata }, _contact_initializers, _instanceExtraInitializers);
            __esDecorate(null, null, _subscriptionProduct_decorators, { kind: "field", name: "subscriptionProduct", static: false, private: false, access: { has: function (obj) { return "subscriptionProduct" in obj; }, get: function (obj) { return obj.subscriptionProduct; }, set: function (obj, value) { obj.subscriptionProduct = value; } }, metadata: _metadata }, _subscriptionProduct_initializers, _instanceExtraInitializers);
            __esDecorate(null, null, _unitProduct_decorators, { kind: "field", name: "unitProduct", static: false, private: false, access: { has: function (obj) { return "unitProduct" in obj; }, get: function (obj) { return obj.unitProduct; }, set: function (obj, value) { obj.unitProduct = value; } }, metadata: _metadata }, _unitProduct_initializers, _instanceExtraInitializers);
            __esDecorate(null, null, _crea_decorators, { kind: "field", name: "crea", static: false, private: false, access: { has: function (obj) { return "crea" in obj; }, get: function (obj) { return obj.crea; }, set: function (obj, value) { obj.crea = value; } }, metadata: _metadata }, _crea_initializers, _instanceExtraInitializers);
            if (_metadata) Object.defineProperty(_a, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        })(),
        _a;
}();
exports.Subscription = Subscription;
var OrderPerson = /** @class */ (function (_super) {
    __extends(OrderPerson, _super);
    function OrderPerson(id, name) {
        var _this = _super.call(this) || this;
        _this.id = id;
        _this.name = name;
        return _this;
    }
    OrderPerson.prototype.clone = function () {
        var clone = new OrderPerson(this.id, this.name);
        return clone;
    };
    return OrderPerson;
}(ts_common_1.ObjectWithId));
exports.OrderPerson = OrderPerson;
// export const orderTemplates = ['wait-deposit', 'confirmation', 'no-deposit-cancel', 'in-time-cancel', 'late-cancel', 'reminder', 'no-show', 'satisfaction']
var OrderState;
(function (OrderState) {
    /** during creation: products/services are added, linked to contact, ... */
    OrderState["creation"] = "creation";
    /** when creation has finished */
    OrderState["created"] = "created";
    OrderState["waitDeposit"] = "waitDeposit";
    OrderState["confirmed"] = "confirmed";
    OrderState["cancelled"] = "cancelled";
    OrderState["noDepositCancel"] = "noDepositCancel";
    OrderState["inTimeCancel"] = "inTimeCancel";
    OrderState["lateCancel"] = "lateCancel";
    OrderState["arrived"] = "arrived";
    OrderState["noShow"] = "noShow";
    OrderState["finished"] = "finished";
    OrderState["inProgress"] = "inProgress";
    //  confirmed = 'confirmed',
    //  canceled = 'canceled',
    OrderState["timedOut"] = "timedOut";
})(OrderState || (exports.OrderState = OrderState = {}));
var VatLine = /** @class */ (function () {
    function VatLine(pct, vat, excl, incl) {
        this.pct = pct;
        this.vat = vat;
        this.excl = excl;
        this.incl = incl;
    }
    return VatLine;
}());
exports.VatLine = VatLine;
/** Resource preferences */
var ResourcePreferences = /** @class */ (function () {
    function ResourcePreferences() {
        /** list of preferred human resource ids */
        this.humIds = [];
        /** list of preferred location resource ids */
        this.locIds = [];
    }
    return ResourcePreferences;
}());
exports.ResourcePreferences = ResourcePreferences;
/*
    "cancel-by": {
      "cust": "Klant",
      "int": "Intern"
    }, */
var CancelBy;
(function (CancelBy) {
    /** Booking cancelled by customer */
    CancelBy["cust"] = "cust";
    /** Booking cancelled internally */
    CancelBy["int"] = "int";
})(CancelBy || (exports.CancelBy = CancelBy = {}));
var CustomerCancelReasons;
(function (CustomerCancelReasons) {
    CustomerCancelReasons["sick"] = "sick";
    CustomerCancelReasons["decease"] = "decease";
    CustomerCancelReasons["traffic"] = "traffic";
    CustomerCancelReasons["work"] = "work";
    CustomerCancelReasons["noShow"] = "noShow";
    CustomerCancelReasons["other"] = "other";
})(CustomerCancelReasons || (exports.CustomerCancelReasons = CustomerCancelReasons = {}));
var InternalCancelReasons;
(function (InternalCancelReasons) {
    InternalCancelReasons["absence"] = "absence";
    InternalCancelReasons["techProblem"] = "techProblem";
    InternalCancelReasons["planProblem"] = "planProblem";
    InternalCancelReasons["other"] = "other";
})(InternalCancelReasons || (exports.InternalCancelReasons = InternalCancelReasons = {}));
var OrderCancelBy;
(function (OrderCancelBy) {
    /** customer cancelled order */
    OrderCancelBy["cust"] = "cust";
    /** order cancelled internally*/
    OrderCancelBy["int"] = "int";
})(OrderCancelBy || (exports.OrderCancelBy = OrderCancelBy = {}));
var OrderCancelCompensate;
(function (OrderCancelCompensate) {
    OrderCancelCompensate["none"] = "none";
    OrderCancelCompensate["gift"] = "gift";
})(OrderCancelCompensate || (exports.OrderCancelCompensate = OrderCancelCompensate = {}));
/** The device/location where app was created (needed for deposit handling) */
var OrderSource;
(function (OrderSource) {
    OrderSource["pos"] = "pos";
    OrderSource["ngApp"] = "ngApp";
})(OrderSource || (exports.OrderSource = OrderSource = {}));
var OrderCancel = /** @class */ (function () {
    function OrderCancel() {
        this.compensate = OrderCancelCompensate.none;
        this.compensation = 0;
        /** return the subscription turns/payments back to customer (if there are any)  */
        this.returnSubsPayments = false;
    }
    Object.defineProperty(OrderCancel.prototype, "gift", {
        set: function (value) {
            this.compensate = value ? OrderCancelCompensate.gift : OrderCancelCompensate.none;
        },
        enumerable: false,
        configurable: true
    });
    OrderCancel.prototype.hasCompensation = function () {
        return this.compensate != OrderCancelCompensate.none;
    };
    return OrderCancel;
}());
exports.OrderCancel = OrderCancel;
var Order = function () {
    var _a;
    var _classSuper = ts_common_1.ObjectWithIdPlus;
    var _instanceExtraInitializers = [];
    var _contact_decorators;
    var _contact_initializers = [];
    var _invoice_decorators;
    var _invoice_initializers = [];
    var _lines_decorators;
    var _lines_initializers = [];
    var _payments_decorators;
    var _payments_initializers = [];
    var _subscriptions_decorators;
    var _subscriptions_initializers = [];
    var _planning_decorators;
    var _planning_initializers = [];
    var _excl_decorators;
    var _excl_initializers = [];
    var _vat_decorators;
    var _vat_initializers = [];
    var _vatLines_decorators;
    var _vatLines_initializers = [];
    var _incl_decorators;
    var _incl_initializers = [];
    var _deposit_decorators;
    var _deposit_initializers = [];
    var _paid_decorators;
    var _paid_initializers = [];
    var _persons_decorators;
    var _persons_initializers = [];
    var _cancel_decorators;
    var _cancel_initializers = [];
    var _resPrefs_decorators;
    var _resPrefs_initializers = [];
    return _a = /** @class */ (function (_super) {
            __extends(Order, _super);
            function Order(codePrefix, markAsNew) {
                if (markAsNew === void 0) { markAsNew = false; }
                var _this = _super.call(this) || this;
                _this.organisation = (__runInitializers(_this, _instanceExtraInitializers), void 0);
                _this.contact = __runInitializers(_this, _contact_initializers, void 0);
                _this.invoice = __runInitializers(_this, _invoice_initializers, void 0);
                _this.lines = __runInitializers(_this, _lines_initializers, []);
                _this.payments = __runInitializers(_this, _payments_initializers, []);
                _this.subscriptions = __runInitializers(_this, _subscriptions_initializers, void 0);
                // satisfaction?: Satisfaction;
                _this.planning = __runInitializers(_this, _planning_initializers, void 0);
                _this.appointment = false;
                _this.type = OrderType.sales;
                _this.excl = __runInitializers(_this, _excl_initializers, 0);
                _this.vat = __runInitializers(_this, _vat_initializers, 0);
                _this.vatLines = __runInitializers(_this, _vatLines_initializers, []);
                _this.incl = __runInitializers(_this, _incl_initializers, 0);
                _this.deposit = __runInitializers(_this, _deposit_initializers, 0);
                /** number of minutes within deposit needs to be paid */
                _this.depositMins = 60;
                _this.paid = __runInitializers(_this, _paid_initializers, 0);
                _this.nrOfPersons = 1;
                _this.persons = __runInitializers(_this, _persons_initializers, []);
                _this.toInvoice = false;
                _this.invoiced = false;
                _this.state = OrderState.creation;
                /** extra info about order: to reduce joins */
                _this.info = '';
                /** public note => customer can see */
                _this.pubNote = undefined;
                /** private note => only visible internally  */
                _this.privNote = undefined;
                /** unique public code visible to customer */
                _this.code = undefined;
                /** this order is a gift purchase (gift voucher) */
                _this.gift = false;
                /** messaging (email,sms) to customer enabled */
                _this.msg = true;
                _this.cancel = __runInitializers(_this, _cancel_initializers, void 0);
                /** The device/location where app was created (needed for deposit handling) */
                _this.src = OrderSource.pos;
                //msgLog: MsgInfo[] = []
                // to remove: use msgOn, msgLog
                /*
                remindOn?: number  // format: yyyyMMddHHmmss
                remindLog?: MsgInfo[]
              <i class="fa-solid fa-circle-plus"></i>
              <i class="fa-solid fa-credit-card"></i>
              <i class="fa-solid fa-circle-check"></i>
              <i class="fa-solid fa-pen-circle"></i>
              */
                /** resource preferences for order */
                _this.resPrefs = __runInitializers(_this, _resPrefs_initializers, void 0);
                var date = dateFns.format(new Date(), 'yyMMdd');
                if ((codePrefix === null || codePrefix === void 0 ? void 0 : codePrefix.length) >= 2) {
                    codePrefix = codePrefix.substring(0, 2).toUpperCase();
                }
                else
                    codePrefix = '';
                var subId = _this.id.substring(_this.id.length - 5).toUpperCase();
                _this.code = "".concat(codePrefix, "-").concat(date, "-").concat(subId);
                if (markAsNew)
                    _this.m.n = true;
                return _this;
                //delete this.id //= undefined
            }
            Object.defineProperty(Order.prototype, "startDate", {
                get: function () {
                    if (!this.start)
                        return undefined;
                    return ts_common_1.DateHelper.parse(this.start);
                },
                enumerable: false,
                configurable: true
            });
            Order.prototype.stateIcon = function () {
                switch (this === null || this === void 0 ? void 0 : this.state) {
                    case OrderState.cancelled: return "fa-solid fa-circle-xmark";
                    case OrderState.creation: return "fa-solid fa-pen-circle";
                    case OrderState.waitDeposit: return "fa-solid fa-credit-card";
                    case OrderState.confirmed: return "fa-solid fa-circle-check";
                    default: return undefined;
                }
            };
            Order.prototype.stateColor = function () {
                switch (this === null || this === void 0 ? void 0 : this.state) {
                    case OrderState.cancelled: return "red";
                    case OrderState.creation: return "blue";
                    default: return "green";
                }
            };
            Order.prototype.depositByDate = function () {
                // Thu Apr 18 2024 10:10:46 GMT+0200 (Central European Summer Time)
                // Thu Apr 18 2024 10:19:21 GMT+0200 (Central European Summer Time)
                if (_.isNumber(this.depositMins))
                    return dateFns.addMinutes(this.cre, this.depositMins);
                return this.cre;
            };
            Order.prototype.setDepositBy = function () {
                this.depositBy = ts_common_1.DateHelper.yyyyMMddhhmmss(this.depositByDate());
            };
            Order.prototype.asDbObject = function () {
                return new ts_common_1.DbObjectCreate('order', _a, this);
            };
            Order.prototype.clone = function () {
                return ts_common_1.ObjectHelper.clone(this, _a);
            };
            Order.prototype.isEmpty = function () {
                return !this.hasLines();
            };
            Order.prototype.totalPaidNotOfType = function () {
                var exclusive = [];
                for (var _i = 0; _i < arguments.length; _i++) {
                    exclusive[_i] = arguments[_i];
                }
                if (ts_common_1.ArrayHelper.IsEmpty(this.payments))
                    return 0;
                // we do not return on gift payments or subscriptions
                var actualPayments = this.payments.filter(function (p) { return exclusive.indexOf(p.type) == -1; });
                if (ts_common_1.ArrayHelper.IsEmpty(actualPayments))
                    return 0;
                var totalPaid = _.sum(actualPayments.map(function (p) { return p.amount; }));
                return totalPaid;
            };
            Order.prototype.paymentsOfType = function () {
                var types = [];
                for (var _i = 0; _i < arguments.length; _i++) {
                    types[_i] = arguments[_i];
                }
                if (ts_common_1.ArrayHelper.IsEmpty(this.payments))
                    return [];
                var payments = this.payments.filter(function (p) { return types.indexOf(p.type) >= 0; });
                return payments;
            };
            Order.prototype.hasServices = function () {
                if (!this.hasLines())
                    return false;
                var firstSvc = this.lines.findIndex(function (l) { var _b; return ((_b = l.product) === null || _b === void 0 ? void 0 : _b.type) == ProductType.svc; });
                return firstSvc >= 0;
            };
            Order.prototype.hasPersons = function () {
                return (Array.isArray(this.persons) && this.persons.length > 0);
            };
            Order.prototype.hasLines = function () {
                return (Array.isArray(this.lines) && this.lines.length > 0);
            };
            Order.prototype.hasPlanningLines = function () {
                if (!this.hasLines())
                    return false;
                return this.lines.findIndex(function (l) { var _b; return ((_b = l.product) === null || _b === void 0 ? void 0 : _b.type) == ProductType.svc; }) >= 0;
            };
            Order.prototype.nrOfLines = function () {
                if (!Array.isArray(this.lines))
                    return 0;
                return this.lines.length;
            };
            Order.prototype.getLine = function (orderLineId) {
                var _b;
                return (_b = this.lines) === null || _b === void 0 ? void 0 : _b.find(function (l) { return l.id == orderLineId; });
            };
            Order.prototype.getLineByProduct = function (productId) {
                var _b;
                return (_b = this.lines) === null || _b === void 0 ? void 0 : _b.find(function (l) { return l.productId == productId; });
            };
            /**
             * The default cancel time is defined on branch (branch.cancel in hours = number of hours before start of booking where free cancellation is not allowed anymore)
             * Products can optionally specify another minimum interval
             *
             * @returns
             */
            Order.prototype.cancelMinHours = function () {
                var _b;
                var products = this.getProducts();
                if (ts_common_1.ArrayHelper.IsEmpty(products))
                    return 0;
                var defaultBranchCancel = (_b = this.branch.cancel) !== null && _b !== void 0 ? _b : 0;
                var allCancelHours = products.map(function (p) { var _b; return (_b = p === null || p === void 0 ? void 0 : p.cancel) !== null && _b !== void 0 ? _b : defaultBranchCancel; });
                var cancelHours = _.max(allCancelHours);
                return cancelHours;
            };
            Order.prototype.addPayment = function (payment) {
                if (!payment)
                    return;
                if (!this.payments)
                    this.payments = [];
                payment.idx = this.nextPaymentIdx();
                this.payments.push(payment);
                payment.markAsNew();
                this.makePayTotals();
            };
            Order.prototype.hasPayments = function () {
                return (Array.isArray(this.payments) && this.payments.length > 0);
            };
            Order.prototype.makePayTotals = function () {
                var totalPaid = 0;
                console.warn(this.payments);
                if (Array.isArray(this.payments))
                    totalPaid = _.sumBy(this.payments, 'amount');
                console.error(totalPaid);
                if (totalPaid != this.paid) {
                    this.paid = totalPaid;
                    this.markAsUpdated('paid');
                }
            };
            Order.prototype.nextPaymentIdx = function () {
                return ts_common_1.ObjectHelper.nextIdx(this.payments);
            };
            Order.prototype.nextOrderLineIdx = function () {
                return ts_common_1.ObjectHelper.nextIdx(this.lines);
            };
            Order.prototype.addLine = function (orderLine, setUnitPrice) {
                if (setUnitPrice === void 0) { setUnitPrice = true; }
                orderLine.idx = this.nextOrderLineIdx();
                if (!this.lines)
                    this.lines = [];
                if (setUnitPrice)
                    orderLine.setUnitPrice();
                this.lines.push(orderLine);
                orderLine.markAsNew();
                this.calculateAll();
            };
            Order.prototype.calculateAll = function () {
                console.warn('calculateAll');
                this.makeLineTotals();
                this.calculateVat();
                this.calculateDeposit();
            };
            Order.prototype.calculateDeposit = function () {
                var _b, _c, _d, _e;
                console.error('calculateDeposit');
                if (!this.hasLines() || this.incl == 0)
                    return 0;
                if (!this.branch)
                    throw new Error('branch not found on order (order.branch missing)!');
                if (this.gift)
                    return this.incl;
                var defaultDepositPct = (_b = this.branch.depositPct) !== null && _b !== void 0 ? _b : 0;
                var deposit = 0;
                for (var _i = 0, _f = this.lines; _i < _f.length; _i++) {
                    var line = _f[_i];
                    var depositPct = 100;
                    if (((_c = line === null || line === void 0 ? void 0 : line.product) === null || _c === void 0 ? void 0 : _c.type) == ProductType.svc)
                        depositPct = (_e = (_d = line === null || line === void 0 ? void 0 : line.product) === null || _d === void 0 ? void 0 : _d.depositPct) !== null && _e !== void 0 ? _e : defaultDepositPct;
                    if (depositPct == 0)
                        continue;
                    depositPct = depositPct / 100;
                    var depositValue = line.incl * depositPct;
                    deposit += depositValue;
                }
                deposit = Math.round(deposit);
                if (deposit != this.deposit) {
                    this.deposit = deposit;
                    this.markAsUpdated('deposit');
                }
                return deposit;
            };
            Order.prototype.hasVatLines = function () {
                return (Array.isArray(this.vatLines) && this.vatLines.length > 0);
            };
            Order.prototype.calculateVat = function () {
                if (!this.hasLines())
                    this.vatLines = [];
                var vatMap = new Map();
                for (var _i = 0, _b = this.lines; _i < _b.length; _i++) {
                    var orderLine = _b[_i];
                    if (!orderLine || !orderLine.vatPct || orderLine.vatPct === 0)
                        continue;
                    var vatLine = void 0;
                    if (vatMap.has(orderLine.vatPct))
                        vatLine = vatMap.get(orderLine.vatPct);
                    else {
                        vatLine = new VatLine(orderLine.vatPct, 0, 0, 0);
                        vatMap.set(orderLine.vatPct, vatLine);
                    }
                    vatLine.vat += orderLine.vat;
                    vatLine.excl += orderLine.excl;
                    vatLine.incl += orderLine.incl;
                }
                var calculatedVatLines = Array.from(vatMap.values());
                calculatedVatLines = _.sortBy(calculatedVatLines, 'pct');
                if (!this.vatLinesSame(this.vatLines, calculatedVatLines)) {
                    this.vatLines = calculatedVatLines;
                    this.markAsUpdated('vatLines');
                }
            };
            Order.prototype.vatLinesSame = function (vatLinesA, vatLinesB) {
                var lengthA = !Array.isArray(vatLinesA) ? 0 : vatLinesA.length;
                var lengthB = !Array.isArray(vatLinesB) ? 0 : vatLinesB.length;
                if (lengthA != lengthB)
                    return false;
                return _.isEqual(vatLinesA, vatLinesB);
            };
            Order.prototype.makeLineTotals = function () {
                if (!this.lines)
                    return 0;
                var incl = 0, excl = 0, vat = 0;
                for (var _i = 0, _b = this.lines; _i < _b.length; _i++) {
                    var line = _b[_i];
                    line.calculateInclThenExcl();
                    vat += line.vat;
                    incl += line.incl;
                    excl += line.excl;
                }
                if (incl != this.incl) {
                    this.incl = incl;
                    this.markAsUpdated('incl');
                }
                if (vat != this.vat) {
                    this.vat = vat;
                    this.markAsUpdated('vat');
                }
                if (excl != this.excl) {
                    this.excl = excl;
                    this.markAsUpdated('excl');
                }
                return this.incl;
            };
            Order.prototype.deletePayment = function (payment) {
                if (!this.payments || !payment)
                    return false;
                var removed = _.remove(this.payments, function (l) { return l.id == payment.id; });
                if (Array.isArray(removed) && removed.length > 0 && !payment.m.n) // orderLine.m.n = it was a new line not yet saved in backend
                 {
                    this.markAsRemoved('payments', payment.id);
                }
                this.makePayTotals();
                return (Array.isArray(removed) && removed.length > 0);
            };
            Order.prototype.deleteLine = function (orderLine) {
                if (!this.lines || !orderLine)
                    return false;
                var removed = _.remove(this.lines, function (l) { return l.id == orderLine.id; });
                if (Array.isArray(removed) && removed.length > 0 && !orderLine.m.n) // orderLine.m.n = it was a new line not yet saved in backend
                    this.markAsRemoved('lines', orderLine.id);
                this.calculateAll();
                return (Array.isArray(removed) && removed.length > 0);
            };
            Order.prototype.getProductIds = function () {
                if (!this.hasLines())
                    return [];
                var productIds = this.lines.filter(function (l) { return l.productId; }).map(function (l) { return l.productId; });
                return productIds;
            };
            Order.prototype.getProducts = function () {
                if (!this.hasLines())
                    return [];
                var products = this.lines.map(function (l) { return l.product; }).filter(function (p) { return p; });
                return products;
            };
            /** Gets the resources that are defined in the configuration for all products (used in this order)
             *
             *      order.lines[x].product.resources[y].resource
             *
             * */
            Order.prototype.getProductResources = function () {
                var resources = [];
                if (!this.lines)
                    return [];
                for (var _i = 0, _b = this.lines; _i < _b.length; _i++) {
                    var line = _b[_i];
                    if (!line.product || !line.product.resources)
                        continue;
                    for (var _c = 0, _d = line.product.resources; _c < _d.length; _c++) {
                        var productResource = _d[_c];
                        //if (resource.is)
                        if (!productResource.resource)
                            continue;
                        var resource = productResource.resource;
                        resources.push(resource);
                    }
                }
                return resources;
            };
            /** Gets the resources that are defined in the configuration for all products (used in this order)
           *
           *      order.lines[x].product.resources[y].resource
           *
           * */
            Order.prototype.getConfigResourceGroups = function () {
                var configResources = this.getProductResources();
                return configResources.filter(function (r) { return r.isGroup; });
            };
            Order.prototype.getResources = function () {
                if (!this.lines)
                    return [];
                var resources = [];
                for (var _i = 0, _b = this.lines; _i < _b.length; _i++) {
                    var orderLine = _b[_i];
                    if (!orderLine.planning)
                        continue;
                    var _loop_1 = function (planning) {
                        if (!(planning.resource))
                            return "continue";
                        if (resources.findIndex(function (r) { var _b; return r.id == ((_b = planning.resource) === null || _b === void 0 ? void 0 : _b.id); }) >= 0)
                            return "continue";
                        resources.push(planning.resource);
                    };
                    for (var _c = 0, _d = orderLine.planning; _c < _d.length; _c++) {
                        var planning = _d[_c];
                        _loop_1(planning);
                    }
                }
                resources = _.orderBy(resources, 'type'); //this.resources.sort()
                return resources;
            };
            Order.prototype.getOrderLinesWithPersonSelect = function () {
                if (!this.lines || this.lines.length == 0)
                    return [];
                var linesWithMissingProduct = this.lines.filter(function (ol) { return !ol.product; });
                if (linesWithMissingProduct && linesWithMissingProduct.length > 0) {
                    console.error('Products not attached to orderlines!');
                    console.error(this, linesWithMissingProduct);
                }
                var linesWithPersonSelect = this.lines.filter(function (ol) { var _b; return ((_b = ol.product) === null || _b === void 0 ? void 0 : _b.personSelect) === true; });
                return linesWithPersonSelect;
            };
            /**
             * If order is for more then 1 person, then we need to assign order lines to specific persons.
             * @returns
             */
            Order.prototype.getPersonLines = function () {
                var orderLines = this.getOrderLinesWithPersonSelect();
                if (!orderLines)
                    return [];
                var personLines = [];
                for (var _i = 0, orderLines_1 = orderLines; _i < orderLines_1.length; _i++) {
                    var ol = orderLines_1[_i];
                    for (var i = 0; i < ol.qty; i++) {
                        var personLine = new person_line_1.PersonLine();
                        personLine.orderLineId = ol.id;
                        personLine.descr = ol.descr;
                        personLine.orderLine = ol;
                        var personId = null;
                        if (ol.persons && ol.persons.length > i)
                            personId = ol.persons[i];
                        // else if (this.order && this.order.persons.length > 0) {
                        //     let person = personHelper.getPerson(ol, i);
                        //     personId = person.id; //   this.order.persons[0].id;
                        // }
                        if (personId != null)
                            personLine.personId = personId;
                        personLines.push(personLine);
                    }
                }
                return personLines;
            };
            /**
             * if this.nrOfPersons is out of sync with this.persons
             * then update this.persons
             */
            Order.prototype.updatePersons = function () {
                if (!this.persons)
                    this.persons = [];
                if (this.persons.length != this.nrOfPersons) {
                    var mgr = new order_person_mgr_1.OrderPersonMgr(this.persons);
                    mgr.checkPersons(this.nrOfPersons);
                }
            };
            /** if an order contains multiple services, then this order can be for 1 person or for more then 1 person => we will ask user
             *  This info is essential for the planning that will be performed later on.
             *  Remark: some services do not require this person selection (example: rental of wellness)
             */
            Order.prototype.needsPersonSelect = function () {
                var _b;
                if (this.gift || !this.hasLines())
                    return false;
                var personSelectLines = (_b = this.lines) === null || _b === void 0 ? void 0 : _b.filter(function (ol) { var _b, _c; return ((_b = ol.product) === null || _b === void 0 ? void 0 : _b.type) == ProductType.svc && ((_c = ol.product) === null || _c === void 0 ? void 0 : _c.personSelect); });
                // ol.qty
                var total = _.sumBy(personSelectLines, 'qty');
                return (total > 1);
            };
            Order.prototype.needsStaffSelect = function () {
                var _b;
                if (this.gift || !this.hasLines())
                    return false;
                var staffSelectLine = (_b = this.lines) === null || _b === void 0 ? void 0 : _b.find(function (ol) { var _b; return (_b = ol.product) === null || _b === void 0 ? void 0 : _b.staffSelect; });
                return staffSelectLine ? true : false;
            };
            Order.prototype.needsPlanning = function () {
                var _b;
                console.warn('needsPlanning');
                if (this.gift || !this.hasLines())
                    return false;
                // try to find an order line with resources
                var planningLine = (_b = this.lines) === null || _b === void 0 ? void 0 : _b.find(function (ol) { var _b; return ((_b = ol.product) === null || _b === void 0 ? void 0 : _b.planMode) != PlanningMode.none; }); // .hasResources()
                return planningLine ? true : false;
            };
            Order.prototype.linesWithPlanning = function () {
                var _b;
                if (!this.lines || this.lines.length == 0)
                    return [];
                var orderlinesWithPlanning = (_b = this.lines) === null || _b === void 0 ? void 0 : _b.filter(function (ol) { var _b; return ((_b = ol.product) === null || _b === void 0 ? void 0 : _b.planMode) != PlanningMode.none; }); // .hasResources()
                return orderlinesWithPlanning;
            };
            return Order;
        }(_classSuper)),
        (function () {
            var _b;
            var _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create((_b = _classSuper[Symbol.metadata]) !== null && _b !== void 0 ? _b : null) : void 0;
            _contact_decorators = [(0, class_transformer_1.Type)(function () { return Contact; })];
            _invoice_decorators = [(0, class_transformer_1.Type)(function () { return Invoice; })];
            _lines_decorators = [(0, class_transformer_1.Type)(function () { return OrderLine; })];
            _payments_decorators = [(0, class_transformer_1.Type)(function () { return Payment; })];
            _subscriptions_decorators = [(0, class_transformer_1.Type)(function () { return Subscription; })];
            _planning_decorators = [(0, class_transformer_1.Type)(function () { return ResourcePlanning; })];
            _excl_decorators = [(0, class_transformer_1.Type)(function () { return Number; })];
            _vat_decorators = [(0, class_transformer_1.Type)(function () { return Number; })];
            _vatLines_decorators = [(0, class_transformer_1.Type)(function () { return VatLine; })];
            _incl_decorators = [(0, class_transformer_1.Type)(function () { return Number; })];
            _deposit_decorators = [(0, class_transformer_1.Type)(function () { return Number; })];
            _paid_decorators = [(0, class_transformer_1.Type)(function () { return Number; })];
            _persons_decorators = [(0, class_transformer_1.Type)(function () { return OrderPerson; })];
            _cancel_decorators = [(0, class_transformer_1.Type)(function () { return OrderCancel; })];
            _resPrefs_decorators = [(0, class_transformer_1.Type)(function () { return ResourcePreferences; })];
            __esDecorate(null, null, _contact_decorators, { kind: "field", name: "contact", static: false, private: false, access: { has: function (obj) { return "contact" in obj; }, get: function (obj) { return obj.contact; }, set: function (obj, value) { obj.contact = value; } }, metadata: _metadata }, _contact_initializers, _instanceExtraInitializers);
            __esDecorate(null, null, _invoice_decorators, { kind: "field", name: "invoice", static: false, private: false, access: { has: function (obj) { return "invoice" in obj; }, get: function (obj) { return obj.invoice; }, set: function (obj, value) { obj.invoice = value; } }, metadata: _metadata }, _invoice_initializers, _instanceExtraInitializers);
            __esDecorate(null, null, _lines_decorators, { kind: "field", name: "lines", static: false, private: false, access: { has: function (obj) { return "lines" in obj; }, get: function (obj) { return obj.lines; }, set: function (obj, value) { obj.lines = value; } }, metadata: _metadata }, _lines_initializers, _instanceExtraInitializers);
            __esDecorate(null, null, _payments_decorators, { kind: "field", name: "payments", static: false, private: false, access: { has: function (obj) { return "payments" in obj; }, get: function (obj) { return obj.payments; }, set: function (obj, value) { obj.payments = value; } }, metadata: _metadata }, _payments_initializers, _instanceExtraInitializers);
            __esDecorate(null, null, _subscriptions_decorators, { kind: "field", name: "subscriptions", static: false, private: false, access: { has: function (obj) { return "subscriptions" in obj; }, get: function (obj) { return obj.subscriptions; }, set: function (obj, value) { obj.subscriptions = value; } }, metadata: _metadata }, _subscriptions_initializers, _instanceExtraInitializers);
            __esDecorate(null, null, _planning_decorators, { kind: "field", name: "planning", static: false, private: false, access: { has: function (obj) { return "planning" in obj; }, get: function (obj) { return obj.planning; }, set: function (obj, value) { obj.planning = value; } }, metadata: _metadata }, _planning_initializers, _instanceExtraInitializers);
            __esDecorate(null, null, _excl_decorators, { kind: "field", name: "excl", static: false, private: false, access: { has: function (obj) { return "excl" in obj; }, get: function (obj) { return obj.excl; }, set: function (obj, value) { obj.excl = value; } }, metadata: _metadata }, _excl_initializers, _instanceExtraInitializers);
            __esDecorate(null, null, _vat_decorators, { kind: "field", name: "vat", static: false, private: false, access: { has: function (obj) { return "vat" in obj; }, get: function (obj) { return obj.vat; }, set: function (obj, value) { obj.vat = value; } }, metadata: _metadata }, _vat_initializers, _instanceExtraInitializers);
            __esDecorate(null, null, _vatLines_decorators, { kind: "field", name: "vatLines", static: false, private: false, access: { has: function (obj) { return "vatLines" in obj; }, get: function (obj) { return obj.vatLines; }, set: function (obj, value) { obj.vatLines = value; } }, metadata: _metadata }, _vatLines_initializers, _instanceExtraInitializers);
            __esDecorate(null, null, _incl_decorators, { kind: "field", name: "incl", static: false, private: false, access: { has: function (obj) { return "incl" in obj; }, get: function (obj) { return obj.incl; }, set: function (obj, value) { obj.incl = value; } }, metadata: _metadata }, _incl_initializers, _instanceExtraInitializers);
            __esDecorate(null, null, _deposit_decorators, { kind: "field", name: "deposit", static: false, private: false, access: { has: function (obj) { return "deposit" in obj; }, get: function (obj) { return obj.deposit; }, set: function (obj, value) { obj.deposit = value; } }, metadata: _metadata }, _deposit_initializers, _instanceExtraInitializers);
            __esDecorate(null, null, _paid_decorators, { kind: "field", name: "paid", static: false, private: false, access: { has: function (obj) { return "paid" in obj; }, get: function (obj) { return obj.paid; }, set: function (obj, value) { obj.paid = value; } }, metadata: _metadata }, _paid_initializers, _instanceExtraInitializers);
            __esDecorate(null, null, _persons_decorators, { kind: "field", name: "persons", static: false, private: false, access: { has: function (obj) { return "persons" in obj; }, get: function (obj) { return obj.persons; }, set: function (obj, value) { obj.persons = value; } }, metadata: _metadata }, _persons_initializers, _instanceExtraInitializers);
            __esDecorate(null, null, _cancel_decorators, { kind: "field", name: "cancel", static: false, private: false, access: { has: function (obj) { return "cancel" in obj; }, get: function (obj) { return obj.cancel; }, set: function (obj, value) { obj.cancel = value; } }, metadata: _metadata }, _cancel_initializers, _instanceExtraInitializers);
            __esDecorate(null, null, _resPrefs_decorators, { kind: "field", name: "resPrefs", static: false, private: false, access: { has: function (obj) { return "resPrefs" in obj; }, get: function (obj) { return obj.resPrefs; }, set: function (obj, value) { obj.resPrefs = value; } }, metadata: _metadata }, _resPrefs_initializers, _instanceExtraInitializers);
            if (_metadata) Object.defineProperty(_a, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        })(),
        _a.jsonProps = ['vatLines', 'persons', 'info'],
        _a;
}();
exports.Order = Order;
/*
order   Order  @relation(fields: [orderId], references: [id])
orderId String @db.Uuid

product   Product @relation(fields: [productId], references: [id])
productId String  @db.Uuid

planning ResourcePlanning[]
*/
var GiftLineOption = function () {
    var _a;
    var _instanceExtraInitializers = [];
    var _vals_decorators;
    var _vals_initializers = [];
    return _a = /** @class */ (function () {
            function GiftLineOption() {
                this.id = (__runInitializers(this, _instanceExtraInitializers), void 0);
                this.vals = __runInitializers(this, _vals_initializers, []);
            }
            return GiftLineOption;
        }()),
        (function () {
            var _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
            _vals_decorators = [(0, class_transformer_1.Type)(function () { return GiftLineOptionValue; })];
            __esDecorate(null, null, _vals_decorators, { kind: "field", name: "vals", static: false, private: false, access: { has: function (obj) { return "vals" in obj; }, get: function (obj) { return obj.vals; }, set: function (obj, value) { obj.vals = value; } }, metadata: _metadata }, _vals_initializers, _instanceExtraInitializers);
            if (_metadata) Object.defineProperty(_a, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        })(),
        _a;
}();
exports.GiftLineOption = GiftLineOption;
var OrderLineOption = function () {
    var _a;
    var _classSuper = ts_common_1.ObjectWithId;
    var _instanceExtraInitializers = [];
    var _values_decorators;
    var _values_initializers = [];
    var _formula_decorators;
    var _formula_initializers = [];
    return _a = /** @class */ (function (_super) {
            __extends(OrderLineOption, _super);
            function OrderLineOption(productOption) {
                var _b;
                var productOptionValues = [];
                for (var _i = 1; _i < arguments.length; _i++) {
                    productOptionValues[_i - 1] = arguments[_i];
                }
                var _this = _super.call(this) || this;
                _this.name = (__runInitializers(_this, _instanceExtraInitializers), void 0);
                _this.values = __runInitializers(_this, _values_initializers, []
                /** Sum of 1 or more formula terms */
                );
                /** Sum of 1 or more formula terms */
                _this.formula = __runInitializers(_this, _formula_initializers, void 0);
                delete _this.id;
                if (!productOption)
                    return _this;
                _this.id = productOption.id;
                _this.name = productOption.name;
                if (productOption.hasFormula && productOption.formula && productOption.formula.length > 0)
                    _this.formula = productOption.formula;
                if (Array.isArray(productOptionValues) && productOptionValues.length > 0) {
                    var lineOptionVals = productOptionValues.map(function (prodVal) { return new OrderLineOptionValue(prodVal); });
                    (_b = _this.values).push.apply(_b, lineOptionVals);
                }
                return _this;
            }
            OrderLineOption.fromProductOption = function (prodOption) {
                var olOption = new _a();
                olOption.id = prodOption.id;
                olOption.name = prodOption.name;
                if (prodOption.values && prodOption.values.length > 0) {
                    olOption.values = prodOption.values.map(function (value) { return OrderLineOptionValue.fromProductOptionValue(value); });
                }
                return olOption;
            };
            OrderLineOption.prototype.hasFormula = function () {
                return Array.isArray(this.formula) && this.formula.length > 0;
            };
            OrderLineOption.prototype.getValue = function (value) {
                var olOptionValue = this.values.find(function (o) { return o.id == value.id; });
                if (!olOptionValue) {
                    var clone = ts_common_1.ObjectHelper.clone(value, OrderLineOptionValue);
                    this.values.push(clone);
                    olOptionValue = clone;
                }
                return olOptionValue;
            };
            OrderLineOption.prototype.getValueById = function (valueId) {
                return this.values.find(function (o) { return o.id == valueId; });
            };
            OrderLineOption.prototype.removeValueById = function (valueId) {
                _.remove(this.values, function (v) { return v.id === valueId; });
            };
            return OrderLineOption;
        }(_classSuper)),
        (function () {
            var _b;
            var _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create((_b = _classSuper[Symbol.metadata]) !== null && _b !== void 0 ? _b : null) : void 0;
            _values_decorators = [(0, class_transformer_1.Type)(function () { return OrderLineOptionValue; })];
            _formula_decorators = [(0, class_transformer_1.Type)(function () { return FormulaTerm; })];
            __esDecorate(null, null, _values_decorators, { kind: "field", name: "values", static: false, private: false, access: { has: function (obj) { return "values" in obj; }, get: function (obj) { return obj.values; }, set: function (obj, value) { obj.values = value; } }, metadata: _metadata }, _values_initializers, _instanceExtraInitializers);
            __esDecorate(null, null, _formula_decorators, { kind: "field", name: "formula", static: false, private: false, access: { has: function (obj) { return "formula" in obj; }, get: function (obj) { return obj.formula; }, set: function (obj, value) { obj.formula = value; } }, metadata: _metadata }, _formula_initializers, _instanceExtraInitializers);
            if (_metadata) Object.defineProperty(_a, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        })(),
        _a;
}();
exports.OrderLineOption = OrderLineOption;
var GiftLineOptionValue = /** @class */ (function () {
    function GiftLineOptionValue() {
        this.prc = 0;
    }
    return GiftLineOptionValue;
}());
exports.GiftLineOptionValue = GiftLineOptionValue;
var OrderLineOptionValue = function () {
    var _a;
    var _classSuper = ts_common_1.ObjectWithId;
    var _instanceExtraInitializers = [];
    var _dur_decorators;
    var _dur_initializers = [];
    var _prc_decorators;
    var _prc_initializers = [];
    var _val_decorators;
    var _val_initializers = [];
    return _a = /** @class */ (function (_super) {
            __extends(OrderLineOptionValue, _super);
            // @Type(() => Number)
            // factor = 0
            function OrderLineOptionValue(productOptionValue) {
                var _this = _super.call(this) || this;
                _this.name = (__runInitializers(_this, _instanceExtraInitializers), void 0);
                _this.dur = __runInitializers(_this, _dur_initializers, 0);
                _this.prc = __runInitializers(_this, _prc_initializers, 0);
                _this.val = __runInitializers(_this, _val_initializers, 0
                // @Type(() => Number)
                // factor = 0
                );
                if (!productOptionValue)
                    return _this;
                _this.id = productOptionValue.id;
                _this.name = productOptionValue.name;
                _this.dur = productOptionValue.duration;
                _this.val = productOptionValue.value;
                _this.prc = productOptionValue.price;
                return _this;
                //this.factor = productOptionValue.factor
            }
            OrderLineOptionValue.fromProductOptionValue = function (prodOptionValue) {
                var olOptionValue = new _a();
                olOptionValue.id = prodOptionValue.id;
                olOptionValue.name = prodOptionValue.name;
                olOptionValue.dur = prodOptionValue.duration;
                olOptionValue.val = prodOptionValue.value;
                olOptionValue.prc = prodOptionValue.price;
                //olOptionValue.factor = prodOptionValue.factor
                return olOptionValue;
            };
            OrderLineOptionValue.prototype.getPrice = function (formula, options) {
                if (!formula)
                    return this.prc;
                else { // if (formula && options)
                    var sum = 0;
                    var _loop_2 = function (formulaTerm) {
                        var term = formulaTerm.factor;
                        if (formulaTerm.value)
                            term *= this_1.val;
                        if (formulaTerm.optionId && options) {
                            var formulaOption = options.find(function (o) { return o.id == formulaTerm.optionId; });
                            if (formulaOption && formulaOption.values.length > 0) {
                                term *= formulaOption.values[0].val;
                            }
                        }
                        sum += term;
                    };
                    var this_1 = this;
                    for (var _i = 0, formula_1 = formula; _i < formula_1.length; _i++) {
                        var formulaTerm = formula_1[_i];
                        _loop_2(formulaTerm);
                    }
                    return sum;
                }
                return 0;
                // if (!factorOption || !factorOption.values)
                //   return this.price
                // else {
                //   let extraTerms = 0
                //   factorOption.values.forEach(val => {
                //     extraTerms += this.factor * val.value
                //   })
                //   return this.price + extraTerms
                // }
            };
            OrderLineOptionValue.prototype.isVisible = function () {
                var _b;
                return ((_b = this.name) === null || _b === void 0 ? void 0 : _b.trim()) != "0";
            };
            return OrderLineOptionValue;
        }(_classSuper)),
        (function () {
            var _b;
            var _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create((_b = _classSuper[Symbol.metadata]) !== null && _b !== void 0 ? _b : null) : void 0;
            _dur_decorators = [(0, class_transformer_1.Type)(function () { return Number; })];
            _prc_decorators = [(0, class_transformer_1.Type)(function () { return Number; })];
            _val_decorators = [(0, class_transformer_1.Type)(function () { return Number; })];
            __esDecorate(null, null, _dur_decorators, { kind: "field", name: "dur", static: false, private: false, access: { has: function (obj) { return "dur" in obj; }, get: function (obj) { return obj.dur; }, set: function (obj, value) { obj.dur = value; } }, metadata: _metadata }, _dur_initializers, _instanceExtraInitializers);
            __esDecorate(null, null, _prc_decorators, { kind: "field", name: "prc", static: false, private: false, access: { has: function (obj) { return "prc" in obj; }, get: function (obj) { return obj.prc; }, set: function (obj, value) { obj.prc = value; } }, metadata: _metadata }, _prc_initializers, _instanceExtraInitializers);
            __esDecorate(null, null, _val_decorators, { kind: "field", name: "val", static: false, private: false, access: { has: function (obj) { return "val" in obj; }, get: function (obj) { return obj.val; }, set: function (obj, value) { obj.val = value; } }, metadata: _metadata }, _val_initializers, _instanceExtraInitializers);
            if (_metadata) Object.defineProperty(_a, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        })(),
        _a;
}();
exports.OrderLineOptionValue = OrderLineOptionValue;
var OrderLine = function () {
    var _a;
    var _classSuper = ts_common_1.ObjectWithIdPlus;
    var _instanceExtraInitializers = [];
    var _order_decorators;
    var _order_initializers = [];
    var _product_decorators;
    var _product_initializers = [];
    var _planning_decorators;
    var _planning_initializers = [];
    var _options_decorators;
    var _options_initializers = [];
    var _qty_decorators;
    var _qty_initializers = [];
    var _base_decorators;
    var _base_initializers = [];
    var _unit_decorators;
    var _unit_initializers = [];
    var _excl_decorators;
    var _excl_initializers = [];
    var _vat_decorators;
    var _vat_initializers = [];
    var _vatPct_decorators;
    var _vatPct_initializers = [];
    var _incl_decorators;
    var _incl_initializers = [];
    return _a = /** @class */ (function (_super) {
            __extends(OrderLine, _super);
            function OrderLine(product, qty, initOptionValues) {
                if (qty === void 0) { qty = 1; }
                var _this = _super.call(this) || this;
                _this.idx = (__runInitializers(_this, _instanceExtraInitializers), 0);
                _this.order = __runInitializers(_this, _order_initializers, void 0);
                /** custom orderlines (such as gifts) may have no associated products */
                _this.product = __runInitializers(_this, _product_initializers, void 0);
                _this.planning = __runInitializers(_this, _planning_initializers, void 0);
                _this.options = __runInitializers(_this, _options_initializers, []);
                _this.qty = __runInitializers(_this, _qty_initializers, 1);
                /** (unit) base price = price excluding options, only set when there are options */
                _this.base = __runInitializers(_this, _base_initializers, 0);
                /** unit price = base price + all option prices */
                _this.unit = __runInitializers(_this, _unit_initializers, 0);
                _this.excl = __runInitializers(_this, _excl_initializers, 0);
                _this.vat = __runInitializers(_this, _vat_initializers, 0);
                _this.vatPct = __runInitializers(_this, _vatPct_initializers, 0);
                _this.incl = __runInitializers(_this, _incl_initializers, 0);
                _this.qty = qty;
                if (!product)
                    return _this;
                _this.descr = product.name;
                _this.base = product.salesPricing();
                //this.incl = product.salesPrice
                _this.vatPct = product.vatPct;
                _this.productId = product.id;
                _this.product = product;
                if (!product.options)
                    return _this;
                for (var _i = 0, _b = product.options; _i < _b.length; _i++) {
                    var option = _b[_i];
                    var optionValues = void 0;
                    if (initOptionValues && initOptionValues.has(option.id)) {
                        var valueIds = initOptionValues.get(option.id);
                        if (Array.isArray(valueIds) && valueIds.length > 0) {
                            optionValues = option.getValues(valueIds);
                        }
                    }
                    if (!Array.isArray(optionValues) || optionValues.length == 0)
                        optionValues = option.getDefaultValues();
                    if (optionValues) {
                        var orderLineOption = new (OrderLineOption.bind.apply(OrderLineOption, __spreadArray([void 0, option], optionValues, false)))();
                        _this.options.push(orderLineOption);
                    }
                }
                _this.calculateAll();
                console.error(_this.incl);
                return _this;
            }
            OrderLine.custom = function (descr, unit, vatPct) {
                var line = new _a();
                line.descr = descr;
                line.unit = unit;
                line.vatPct = vatPct;
                line.calculateInclThenExcl();
                return line;
            };
            OrderLine.prototype.hasPersons = function () {
                return (Array.isArray(this.persons) && this.persons.length > 0);
            };
            /** sum of product duration and all options */
            OrderLine.prototype.totalDuration = function () {
                if (!this.product)
                    return null;
                var duration = this.product.duration;
                if (!this.options)
                    return duration;
                for (var _i = 0, _b = this.options; _i < _b.length; _i++) {
                    var option = _b[_i];
                    if (!option.values || option.values.length == 0)
                        continue;
                    for (var _c = 0, _d = option.values; _c < _d.length; _c++) {
                        var value = _d[_c];
                        if (Number.isFinite(value.dur))
                            duration += value.dur;
                    }
                }
                return duration;
            };
            OrderLine.prototype.calculateAll = function () {
                this.setUnitPrice();
                this.calculateInclThenExcl();
            };
            /**
             *
             * @returns this.incl
             */
            OrderLine.prototype.calculateInclThenExcl = function () {
                // this.product.prices
                var previousIncl = this.incl;
                var previousExcl = this.excl;
                var previousVat = this.vat;
                this.incl = this.unit * this.qty;
                if (this.vatPct) {
                    var vatFactor = (1 + this.vatPct / 100);
                    this.excl = this.incl / vatFactor;
                    this.vat = this.incl - this.excl;
                }
                else
                    this.excl = this.incl;
                if (previousIncl != this.incl)
                    this.markAsUpdated('incl');
                if (previousExcl != this.excl)
                    this.markAsUpdated('excl');
                if (previousVat != this.vat)
                    this.markAsUpdated('vat');
                return this.incl;
            };
            OrderLine.prototype.setUnitPrice = function () {
                console.warn('makeTotals');
                var unitPrice = this.base;
                //let totalDuration = 0
                if (ts_common_1.ArrayHelper.IsEmpty(this.options)) {
                    this.unit = unitPrice;
                    return;
                }
                for (var _i = 0, _b = this.options; _i < _b.length; _i++) {
                    var option = _b[_i];
                    if (!option.values)
                        continue;
                    // let factorOption = null
                    // if (option.factorOptionId) {
                    //   factorOption = this.options.find(o => o.id == option.factorOptionId)
                    // }
                    for (var _c = 0, _d = option.values; _c < _d.length; _c++) {
                        var orderLineOptionValue = _d[_c];
                        unitPrice += orderLineOptionValue.getPrice(option.formula, this.options);
                        // totalDuration += value.duration
                    }
                }
                this.unit = unitPrice;
                //this.incl = unitPrice * this.qty
            };
            OrderLine.prototype.visibleOptions = function () {
                return this.options.filter(function (o) { return o.values && o.values.findIndex(function (v) { return v.isVisible(); }) >= 0; });
            };
            OrderLine.prototype.getOption = function (option) {
                var olOption = this.options.find(function (o) { return o.id == option.id; });
                if (!olOption) {
                    var clone = ts_common_1.ObjectHelper.clone(option, OrderLineOption);
                    clone.values = [];
                    this.options.push(clone);
                    olOption = clone;
                }
                return olOption;
            };
            OrderLine.prototype.optionValueSelected = function (option, valueId) {
                var olOption = this.getOption(option);
                var value = olOption.getValueById(valueId);
                return value ? true : false;
            };
            OrderLine.prototype.allOptionValues = function () {
                if (!this.options)
                    return [];
                var optionValues = [];
                for (var _i = 0, _b = this.options; _i < _b.length; _i++) {
                    var option = _b[_i];
                    if (option.values && option.values.length > 0)
                        optionValues.push.apply(optionValues, option.values);
                }
                return optionValues;
            };
            /**
             * When subscriptions
             * @returns
             */
            OrderLine.prototype.subscriptionsCreated = function () {
                if (!this.json)
                    return false;
                if (this.json['subs'])
                    return true;
                else
                    return false;
            };
            return OrderLine;
        }(_classSuper)),
        (function () {
            var _b;
            var _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create((_b = _classSuper[Symbol.metadata]) !== null && _b !== void 0 ? _b : null) : void 0;
            _order_decorators = [(0, class_transformer_1.Type)(function () { return Order; })];
            _product_decorators = [(0, class_transformer_1.Type)(function () { return Product; })];
            _planning_decorators = [(0, class_transformer_1.Type)(function () { return ResourcePlanning; })];
            _options_decorators = [(0, class_transformer_1.Type)(function () { return OrderLineOption; })];
            _qty_decorators = [(0, class_transformer_1.Type)(function () { return Number; })];
            _base_decorators = [(0, class_transformer_1.Type)(function () { return Number; })];
            _unit_decorators = [(0, class_transformer_1.Type)(function () { return Number; })];
            _excl_decorators = [(0, class_transformer_1.Type)(function () { return Number; })];
            _vat_decorators = [(0, class_transformer_1.Type)(function () { return Number; })];
            _vatPct_decorators = [(0, class_transformer_1.Type)(function () { return Number; })];
            _incl_decorators = [(0, class_transformer_1.Type)(function () { return Number; })];
            __esDecorate(null, null, _order_decorators, { kind: "field", name: "order", static: false, private: false, access: { has: function (obj) { return "order" in obj; }, get: function (obj) { return obj.order; }, set: function (obj, value) { obj.order = value; } }, metadata: _metadata }, _order_initializers, _instanceExtraInitializers);
            __esDecorate(null, null, _product_decorators, { kind: "field", name: "product", static: false, private: false, access: { has: function (obj) { return "product" in obj; }, get: function (obj) { return obj.product; }, set: function (obj, value) { obj.product = value; } }, metadata: _metadata }, _product_initializers, _instanceExtraInitializers);
            __esDecorate(null, null, _planning_decorators, { kind: "field", name: "planning", static: false, private: false, access: { has: function (obj) { return "planning" in obj; }, get: function (obj) { return obj.planning; }, set: function (obj, value) { obj.planning = value; } }, metadata: _metadata }, _planning_initializers, _instanceExtraInitializers);
            __esDecorate(null, null, _options_decorators, { kind: "field", name: "options", static: false, private: false, access: { has: function (obj) { return "options" in obj; }, get: function (obj) { return obj.options; }, set: function (obj, value) { obj.options = value; } }, metadata: _metadata }, _options_initializers, _instanceExtraInitializers);
            __esDecorate(null, null, _qty_decorators, { kind: "field", name: "qty", static: false, private: false, access: { has: function (obj) { return "qty" in obj; }, get: function (obj) { return obj.qty; }, set: function (obj, value) { obj.qty = value; } }, metadata: _metadata }, _qty_initializers, _instanceExtraInitializers);
            __esDecorate(null, null, _base_decorators, { kind: "field", name: "base", static: false, private: false, access: { has: function (obj) { return "base" in obj; }, get: function (obj) { return obj.base; }, set: function (obj, value) { obj.base = value; } }, metadata: _metadata }, _base_initializers, _instanceExtraInitializers);
            __esDecorate(null, null, _unit_decorators, { kind: "field", name: "unit", static: false, private: false, access: { has: function (obj) { return "unit" in obj; }, get: function (obj) { return obj.unit; }, set: function (obj, value) { obj.unit = value; } }, metadata: _metadata }, _unit_initializers, _instanceExtraInitializers);
            __esDecorate(null, null, _excl_decorators, { kind: "field", name: "excl", static: false, private: false, access: { has: function (obj) { return "excl" in obj; }, get: function (obj) { return obj.excl; }, set: function (obj, value) { obj.excl = value; } }, metadata: _metadata }, _excl_initializers, _instanceExtraInitializers);
            __esDecorate(null, null, _vat_decorators, { kind: "field", name: "vat", static: false, private: false, access: { has: function (obj) { return "vat" in obj; }, get: function (obj) { return obj.vat; }, set: function (obj, value) { obj.vat = value; } }, metadata: _metadata }, _vat_initializers, _instanceExtraInitializers);
            __esDecorate(null, null, _vatPct_decorators, { kind: "field", name: "vatPct", static: false, private: false, access: { has: function (obj) { return "vatPct" in obj; }, get: function (obj) { return obj.vatPct; }, set: function (obj, value) { obj.vatPct = value; } }, metadata: _metadata }, _vatPct_initializers, _instanceExtraInitializers);
            __esDecorate(null, null, _incl_decorators, { kind: "field", name: "incl", static: false, private: false, access: { has: function (obj) { return "incl" in obj; }, get: function (obj) { return obj.incl; }, set: function (obj, value) { obj.incl = value; } }, metadata: _metadata }, _incl_initializers, _instanceExtraInitializers);
            if (_metadata) Object.defineProperty(_a, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        })(),
        _a;
}();
exports.OrderLine = OrderLine;
// feestdag, klein verlet
var PlanningType;
(function (PlanningType) {
    /** occupied */
    PlanningType["occ"] = "occ";
    PlanningType["hol"] = "hol";
    PlanningType["bnk"] = "bnk";
    PlanningType["ill"] = "ill";
    PlanningType["abs"] = "abs";
    PlanningType["edu"] = "edu";
    PlanningType["avl"] = "avl";
    PlanningType["sch"] = "sch"; // planning schedule
})(PlanningType || (exports.PlanningType = PlanningType = {}));
/*



enum PlanningType {
  occ
  res   // reserved
  hol
  ill
  edu
  off
}



*/
/** Manage multiple ResourcePlanning's  */
var ResourcePlannings = /** @class */ (function () {
    function ResourcePlannings(plannings) {
        if (plannings === void 0) { plannings = []; }
        this.plannings = plannings;
    }
    ResourcePlannings.prototype.isEmpty = function () {
        return (!Array.isArray(this.plannings) || this.plannings.length === 0);
    };
    ResourcePlannings.prototype.filterByResource = function (resourceId) {
        var planningsForResource = this.plannings.filter(function (rp) { return rp.resourceId == resourceId; });
        if (!Array.isArray(planningsForResource))
            return new ResourcePlannings();
        return new ResourcePlannings(planningsForResource);
    };
    ResourcePlannings.prototype.filterByResourceOverlapAllowed = function (resourceId, overlap) {
        if (overlap === void 0) { overlap = false; }
        var planningsForResource = this.plannings.filter(function (rp) { return rp.resourceId == resourceId && rp.overlap == overlap && !rp.scheduleId; });
        if (!Array.isArray(planningsForResource))
            return new ResourcePlannings();
        return new ResourcePlannings(planningsForResource);
    };
    ResourcePlannings.prototype.filterByResourceDateRange = function (resourceId, from, to) {
        var fromNum = from instanceof Date ? ts_common_1.DateHelper.yyyyMMddhhmmss(from) : from;
        var toNum = to instanceof Date ? ts_common_1.DateHelper.yyyyMMddhhmmss(to) : to;
        var planningsForResource = this.plannings.filter(function (rp) { return rp.resourceId == resourceId && rp.end > fromNum && rp.start < toNum; });
        if (!Array.isArray(planningsForResource))
            return new ResourcePlannings();
        return new ResourcePlannings(planningsForResource);
    };
    ResourcePlannings.prototype.filterByScheduleDateRange = function (scheduleId, from, to) {
        var fromNum = from instanceof Date ? ts_common_1.DateHelper.yyyyMMddhhmmss(from) : from;
        var toNum = to instanceof Date ? ts_common_1.DateHelper.yyyyMMddhhmmss(to) : to;
        var plannings = this.plannings.filter(function (rp) { return rp.scheduleId == scheduleId && rp.end > fromNum && rp.start < toNum; });
        return new ResourcePlannings(plannings);
    };
    ResourcePlannings.prototype.filterBySchedulesDateRange2 = function (scheduleIds, from, to) {
        var fromNum = from instanceof Date ? ts_common_1.DateHelper.yyyyMMddhhmmss(from) : from;
        var toNum = to instanceof Date ? ts_common_1.DateHelper.yyyyMMddhhmmss(to) : to;
        var plannings = this.plannings.filter(function (rp) { return rp.scheduleId && scheduleIds.indexOf(rp.scheduleId) >= 0 && rp.end > fromNum && rp.start < toNum; });
        return new ResourcePlannings(plannings);
    };
    /**
     *  example use: given all schedules for a branch (default opening hours, holidays, special openings,... -> defined by scheduleIds), return only
     *  those (resource plannings=schedules & their date-ranges) during a certain interval
     * @param scheduleIds
     * @param dateRange
     * @returns
     */
    ResourcePlannings.prototype.filterBySchedulesDateRange = function (scheduleIds, dateRange) {
        if (!Array.isArray(scheduleIds) || scheduleIds.length == 0)
            return new ResourcePlannings();
        var fromNum = dateRange.fromToNum();
        var toNum = dateRange.toToNum();
        var planningsForSchedules = this.plannings.filter(function (rp) { return rp.scheduleId && scheduleIds.indexOf(rp.scheduleId) >= 0
            && rp.end && rp.end > fromNum && rp.start && rp.start < toNum; });
        if (!Array.isArray(planningsForSchedules))
            return new ResourcePlannings();
        planningsForSchedules = _.orderBy(planningsForSchedules, 'start');
        return new ResourcePlannings(planningsForSchedules);
    };
    ResourcePlannings.prototype.filterBySchedulesDate = function (scheduleIds, date) {
        if (!Array.isArray(scheduleIds) || scheduleIds.length == 0)
            return undefined;
        var dateNum = ts_common_1.DateHelper.yyyyMMddhhmmss(date); //dateRange.fromToNum()
        var planningsForSchedules = this.plannings.filter(function (rp) { return rp.scheduleId && scheduleIds.indexOf(rp.scheduleId) >= 0
            && rp.start && rp.end && rp.start <= dateNum && dateNum < rp.end; });
        if (!Array.isArray(planningsForSchedules) || planningsForSchedules.length == 0)
            return undefined;
        return planningsForSchedules[0];
    };
    ResourcePlannings.prototype.isFullAvailable = function () {
        var unavailable = this.plannings.find(function (rp) { return rp.act && !rp.available && !rp.scheduleId; });
        return unavailable ? false : true;
    };
    ResourcePlannings.prototype.isPrepTimeOnly = function () {
        // try to find a planning that is NOT a preparation
        var nonPrep = this.plannings.find(function (rp) { return rp.act && !rp.prep; });
        return nonPrep ? false : true;
    };
    ResourcePlannings.prototype.filterByAvailable = function (available) {
        if (available === void 0) { available = true; }
        var result = this.plannings.filter(function (rp) { return rp.available == available && !rp.scheduleId; });
        if (!Array.isArray(result))
            return new ResourcePlannings();
        return new ResourcePlannings(result);
    };
    ResourcePlannings.prototype.toDateRangeSet = function () {
        var dateRanges = this.plannings.map(function (rp) { return rp.toDateRange(); });
        var set = new logic_1.DateRangeSet(dateRanges);
        return set;
    };
    ResourcePlannings.prototype.groupByResource = function () {
        // const map = new Map<Resource, ResourcePlanning[]>()
        var map = _.groupBy(this.plannings, 'resourceId');
        return map;
    };
    return ResourcePlannings;
}());
exports.ResourcePlannings = ResourcePlannings;
var PlanningProductOptionInfo = /** @class */ (function () {
    function PlanningProductOptionInfo() {
    }
    return PlanningProductOptionInfo;
}());
exports.PlanningProductOptionInfo = PlanningProductOptionInfo;
var PlanningProductInfo = function () {
    var _a;
    var _instanceExtraInitializers = [];
    var _options_decorators;
    var _options_initializers = [];
    return _a = /** @class */ (function () {
            function PlanningProductInfo(productName) {
                /** name */
                this.nm = (__runInitializers(this, _instanceExtraInitializers), void 0);
                this.options = __runInitializers(this, _options_initializers, []);
                this.nm = productName;
            }
            return PlanningProductInfo;
        }()),
        (function () {
            var _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
            _options_decorators = [(0, class_transformer_1.Type)(function () { return PlanningProductOptionInfo; })];
            __esDecorate(null, null, _options_decorators, { kind: "field", name: "options", static: false, private: false, access: { has: function (obj) { return "options" in obj; }, get: function (obj) { return obj.options; }, set: function (obj, value) { obj.options = value; } }, metadata: _metadata }, _options_initializers, _instanceExtraInitializers);
            if (_metadata) Object.defineProperty(_a, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        })(),
        _a;
}();
exports.PlanningProductInfo = PlanningProductInfo;
var PlanningContactInfo = /** @class */ (function () {
    function PlanningContactInfo() {
    }
    return PlanningContactInfo;
}());
exports.PlanningContactInfo = PlanningContactInfo;
var PlanningResourceInfo = /** @class */ (function () {
    function PlanningResourceInfo(resourceName, resourceType) {
        this.nm = resourceName;
        this.tp = resourceType;
    }
    return PlanningResourceInfo;
}());
exports.PlanningResourceInfo = PlanningResourceInfo;
var PlanningInfo = function () {
    var _a;
    var _instanceExtraInitializers = [];
    var _prods_decorators;
    var _prods_initializers = [];
    var _cont_decorators;
    var _cont_initializers = [];
    var _res_decorators;
    var _res_initializers = [];
    return _a = /** @class */ (function () {
            function PlanningInfo(productInfo, contactInfo, resourceInfo) {
                /** product info */
                this.prods = (__runInitializers(this, _instanceExtraInitializers), __runInitializers(this, _prods_initializers, []
                /** contact (customer) info */
                ));
                /** contact (customer) info */
                this.cont = __runInitializers(this, _cont_initializers, void 0);
                /** resource info */
                this.res = __runInitializers(this, _res_initializers, void 0);
                this.prods.push(productInfo);
                this.cont = contactInfo;
                this.res = resourceInfo;
            }
            PlanningInfo.prototype.toString = function () {
                var info = "";
                if (Array.isArray(this.prods)) {
                    this.prods.forEach(function (prod) {
                        info += "".concat(prod.nm);
                    });
                }
                /*     if (this.res) {
                      info += ` ${this.res.nm}`
                    } */
                return info;
            };
            return PlanningInfo;
        }()),
        (function () {
            var _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
            _prods_decorators = [(0, class_transformer_1.Type)(function () { return PlanningProductInfo; })];
            _cont_decorators = [(0, class_transformer_1.Type)(function () { return PlanningContactInfo; })];
            _res_decorators = [(0, class_transformer_1.Type)(function () { return PlanningResourceInfo; })];
            __esDecorate(null, null, _prods_decorators, { kind: "field", name: "prods", static: false, private: false, access: { has: function (obj) { return "prods" in obj; }, get: function (obj) { return obj.prods; }, set: function (obj, value) { obj.prods = value; } }, metadata: _metadata }, _prods_initializers, _instanceExtraInitializers);
            __esDecorate(null, null, _cont_decorators, { kind: "field", name: "cont", static: false, private: false, access: { has: function (obj) { return "cont" in obj; }, get: function (obj) { return obj.cont; }, set: function (obj, value) { obj.cont = value; } }, metadata: _metadata }, _cont_initializers, _instanceExtraInitializers);
            __esDecorate(null, null, _res_decorators, { kind: "field", name: "res", static: false, private: false, access: { has: function (obj) { return "res" in obj; }, get: function (obj) { return obj.res; }, set: function (obj, value) { obj.res = value; } }, metadata: _metadata }, _res_initializers, _instanceExtraInitializers);
            if (_metadata) Object.defineProperty(_a, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        })(),
        _a;
}();
exports.PlanningInfo = PlanningInfo;
var ResourcePlanning = function () {
    var _a;
    var _classSuper = ts_common_1.ObjectWithIdPlus;
    var _instanceExtraInitializers = [];
    var _resource_decorators;
    var _resource_initializers = [];
    var _resourceGroup_decorators;
    var _resourceGroup_initializers = [];
    var _order_decorators;
    var _order_initializers = [];
    var _orderLine_decorators;
    var _orderLine_initializers = [];
    var _schedule_decorators;
    var _schedule_initializers = [];
    var _info_decorators;
    var _info_initializers = [];
    return _a = /** @class */ (function (_super) {
            __extends(ResourcePlanning, _super);
            function ResourcePlanning() {
                var _this = _super !== null && _super.apply(this, arguments) || this;
                _this.branchId = (__runInitializers(_this, _instanceExtraInitializers), void 0);
                _this.resource = __runInitializers(_this, _resource_initializers, void 0); //| ConnectTo
                _this.resourceGroup = __runInitializers(_this, _resourceGroup_initializers, void 0);
                _this.order = __runInitializers(_this, _order_initializers, void 0);
                _this.orderLine = __runInitializers(_this, _orderLine_initializers, void 0);
                _this.schedule = __runInitializers(_this, _schedule_initializers, void 0);
                /** stored as JSON in database */
                _this.info = __runInitializers(_this, _info_initializers, void 0);
                _this.type = PlanningType.occ;
                _this.start = ts_common_1.DateHelper.yyyyMMddhhmmss(new Date());
                _this.end = ts_common_1.DateHelper.yyyyMMddhhmmss(new Date());
                /** is preperation time (before or after actual treatment) */
                _this.prep = false;
                /** overlap allowed (used if prep=true). Example: when cleaning of wellness can overlap the preparation of the next session */
                _this.overlap = false;
                // service?: string;
                // customer?: string;
                _this.pre = 0;
                _this.post = 0;
                return _this;
            }
            ResourcePlanning.prototype.asDbObject = function () {
                return new ts_common_1.DbObjectCreate('resourcePlanning', _a, this);
            };
            ResourcePlanning.prototype.clone = function () {
                return ts_common_1.ObjectHelper.clone(this, _a);
            };
            Object.defineProperty(ResourcePlanning.prototype, "available", {
                get: function () {
                    return (this.type === PlanningType.avl);
                },
                enumerable: false,
                configurable: true
            });
            Object.defineProperty(ResourcePlanning.prototype, "startUtc", {
                get: function () {
                    var start = ts_common_1.DateHelper.parse(this.start);
                    return ts_common_1.TimeHelper.hhmmUTC(start);
                },
                set: function (val) {
                    var start = ts_common_1.TimeHelper.hhmmUTCToDate(val);
                    this.start = ts_common_1.DateHelper.yyyyMMdd000000(start);
                },
                enumerable: false,
                configurable: true
            });
            Object.defineProperty(ResourcePlanning.prototype, "startDate", {
                get: function () {
                    return ts_common_1.DateHelper.parse(this.start);
                },
                set: function (value) {
                    this.start = ts_common_1.DateHelper.yyyyMMddhhmmss(value);
                    console.warn(this.start);
                },
                enumerable: false,
                configurable: true
            });
            Object.defineProperty(ResourcePlanning.prototype, "endDate", {
                get: function () {
                    return ts_common_1.DateHelper.parse(this.end);
                },
                set: function (value) {
                    this.end = ts_common_1.DateHelper.yyyyMMddhhmmss(value);
                },
                enumerable: false,
                configurable: true
            });
            ResourcePlanning.prototype.toDateRange = function () {
                var range = logic_1.DateRange.fromNumbers(this.start, this.end);
                return range;
            };
            ResourcePlanning.prototype.setResource = function (resource) {
                if (!resource)
                    return;
                this.resourceId = resource.id;
                this.resource = resource;
            };
            return ResourcePlanning;
        }(_classSuper)),
        (function () {
            var _b;
            var _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create((_b = _classSuper[Symbol.metadata]) !== null && _b !== void 0 ? _b : null) : void 0;
            _resource_decorators = [(0, class_transformer_1.Type)(function () { return Resource; })];
            _resourceGroup_decorators = [(0, class_transformer_1.Type)(function () { return Resource; })];
            _order_decorators = [(0, class_transformer_1.Type)(function () { return Order; })];
            _orderLine_decorators = [(0, class_transformer_1.Type)(function () { return OrderLine; })];
            _schedule_decorators = [(0, class_transformer_1.Type)(function () { return Schedule; })];
            _info_decorators = [(0, class_transformer_1.Type)(function () { return PlanningInfo; })];
            __esDecorate(null, null, _resource_decorators, { kind: "field", name: "resource", static: false, private: false, access: { has: function (obj) { return "resource" in obj; }, get: function (obj) { return obj.resource; }, set: function (obj, value) { obj.resource = value; } }, metadata: _metadata }, _resource_initializers, _instanceExtraInitializers);
            __esDecorate(null, null, _resourceGroup_decorators, { kind: "field", name: "resourceGroup", static: false, private: false, access: { has: function (obj) { return "resourceGroup" in obj; }, get: function (obj) { return obj.resourceGroup; }, set: function (obj, value) { obj.resourceGroup = value; } }, metadata: _metadata }, _resourceGroup_initializers, _instanceExtraInitializers);
            __esDecorate(null, null, _order_decorators, { kind: "field", name: "order", static: false, private: false, access: { has: function (obj) { return "order" in obj; }, get: function (obj) { return obj.order; }, set: function (obj, value) { obj.order = value; } }, metadata: _metadata }, _order_initializers, _instanceExtraInitializers);
            __esDecorate(null, null, _orderLine_decorators, { kind: "field", name: "orderLine", static: false, private: false, access: { has: function (obj) { return "orderLine" in obj; }, get: function (obj) { return obj.orderLine; }, set: function (obj, value) { obj.orderLine = value; } }, metadata: _metadata }, _orderLine_initializers, _instanceExtraInitializers);
            __esDecorate(null, null, _schedule_decorators, { kind: "field", name: "schedule", static: false, private: false, access: { has: function (obj) { return "schedule" in obj; }, get: function (obj) { return obj.schedule; }, set: function (obj, value) { obj.schedule = value; } }, metadata: _metadata }, _schedule_initializers, _instanceExtraInitializers);
            __esDecorate(null, null, _info_decorators, { kind: "field", name: "info", static: false, private: false, access: { has: function (obj) { return "info" in obj; }, get: function (obj) { return obj.info; }, set: function (obj, value) { obj.info = value; } }, metadata: _metadata }, _info_initializers, _instanceExtraInitializers);
            if (_metadata) Object.defineProperty(_a, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        })(),
        _a;
}();
exports.ResourcePlanning = ResourcePlanning;
var ProductType;
(function (ProductType) {
    ProductType["prod"] = "prod";
    ProductType["svc"] = "svc";
    // OLD: do not use anymore
    /* product = 'product',
    service = 'service', */
    //  category = 'category',
    // bundle = 'bundle',
    // subscription = 'subscription',
})(ProductType || (exports.ProductType = ProductType = {}));
var ProductSubType;
(function (ProductSubType) {
    ProductSubType["basic"] = "basic";
    ProductSubType["cat"] = "cat";
    ProductSubType["bundle"] = "bundle";
    ProductSubType["subs"] = "subs";
})(ProductSubType || (exports.ProductSubType = ProductSubType = {}));
var PriceType;
(function (PriceType) {
    PriceType["sales"] = "sales";
    PriceType["purchase"] = "purchase";
    PriceType["tax"] = "tax";
})(PriceType || (exports.PriceType = PriceType = {}));
var DurationMode;
(function (DurationMode) {
    DurationMode["product"] = "product";
    DurationMode["custom"] = "custom";
})(DurationMode || (exports.DurationMode = DurationMode = {}));
var DurationReference;
(function (DurationReference) {
    DurationReference["start"] = "start";
    DurationReference["end"] = "end";
})(DurationReference || (exports.DurationReference = DurationReference = {}));
var SchedulingType;
(function (SchedulingType) {
    SchedulingType["active"] = "active";
    SchedulingType["holiday"] = "holiday";
    SchedulingType["sick"] = "sick";
    SchedulingType["course"] = "course";
})(SchedulingType || (exports.SchedulingType = SchedulingType = {}));
var OrderType;
(function (OrderType) {
    OrderType["sales"] = "sales";
    OrderType["purchase"] = "purchase";
    OrderType["offer"] = "offer";
})(OrderType || (exports.OrderType = OrderType = {}));
var TemplateType;
(function (TemplateType) {
    TemplateType["general"] = "general";
    TemplateType["confirmation"] = "confirmation";
    TemplateType["cancel"] = "cancel";
    TemplateType["cancelClient"] = "cancelClient";
    TemplateType["cancelProvider"] = "cancelProvider";
    TemplateType["change"] = "change";
    TemplateType["reminder"] = "reminder";
})(TemplateType || (exports.TemplateType = TemplateType = {}));
var OrderTemplate;
(function (OrderTemplate) {
    OrderTemplate["noDepositCancel"] = "noDepositCancel";
})(OrderTemplate || (exports.OrderTemplate = OrderTemplate = {}));
exports.orderTemplates = ['waitDeposit', 'confirmed', 'noDepositCancel', 'inTimeCancel', 'lateCancel', 'reminder', 'noShow', 'satisfaction'];
/*
cancel
cancelClient
cancelProvider
*/
var TemplateRecipient;
(function (TemplateRecipient) {
    TemplateRecipient["unknown"] = "unknown";
    TemplateRecipient["client"] = "client";
    TemplateRecipient["staff"] = "staff";
    TemplateRecipient["provider"] = "provider";
})(TemplateRecipient || (exports.TemplateRecipient = TemplateRecipient = {}));
var TemplateChannel;
(function (TemplateChannel) {
    TemplateChannel["email"] = "email";
    TemplateChannel["sms"] = "sms";
})(TemplateChannel || (exports.TemplateChannel = TemplateChannel = {}));
var Template = /** @class */ (function (_super) {
    __extends(Template, _super);
    function Template() {
        var _this = _super !== null && _super.apply(this, arguments) || this;
        _this.idx = 0;
        _this.to = [];
        _this.channels = [];
        _this.remind = 60;
        return _this;
    }
    //fruit = 'pomme'
    Template.prototype.isEmail = function () {
        return (Array.isArray(this.channels) && _.includes(this.channels, 'email'));
    };
    Template.prototype.isSms = function () {
        return (Array.isArray(this.channels) && _.includes(this.channels, 'sms'));
    };
    Template.prototype.msgType = function () {
        if (!Array.isArray(this.channels) || this.channels.length == 0)
            return MsgType.email;
        return this.channels[0];
    };
    Template.prototype.mergeWithOrder = function (order) {
        var message = new Message();
        message.branchId = order.branchId;
        message.orderId = order.id;
        message.code = this.code;
        var replacements = { name: "Nils", info: "baby giraffe" };
        if (this.body) {
            var hbTemplate = Handlebars.compile(this.body);
            message.body = hbTemplate(replacements);
        }
        if (this.subject) {
            var hbTemplate = Handlebars.compile(this.subject);
            message.subject = hbTemplate(replacements);
        }
        message.type = this.msgType();
        return message;
    };
    return Template;
}(ts_common_1.ObjectWithIdPlus));
exports.Template = Template;
var GiftType;
(function (GiftType) {
    // none = 'none', // when nothing is selected yet
    GiftType["amount"] = "amount";
    GiftType["specific"] = "specific";
    /*   prod = 'prod',
      svc = 'svc' */
})(GiftType || (exports.GiftType = GiftType = {}));
var GiftCertificate;
(function (GiftCertificate) {
    GiftCertificate["none"] = "none";
    GiftCertificate["inStore"] = "inStore";
    GiftCertificate["postal"] = "postal";
})(GiftCertificate || (exports.GiftCertificate = GiftCertificate = {}));
var GiftMethods = /** @class */ (function () {
    function GiftMethods() {
        this.emailFrom = false;
        this.emailTo = false;
        this.postal = false;
        this.pos = false;
        this.app = false;
    }
    return GiftMethods;
}());
exports.GiftMethods = GiftMethods;
/** GiftLine is a reduced version of an orderLine.
 *  It is used for specific gift (products/services are gifted) instead of an amount.
 *
 */
var GiftLine = function () {
    var _a;
    var _instanceExtraInitializers = [];
    var _opts_decorators;
    var _opts_initializers = [];
    return _a = /** @class */ (function () {
            function GiftLine() {
                this.qty = (__runInitializers(this, _instanceExtraInitializers), 1);
                this.prc = 0;
                /** options */
                this.opts = __runInitializers(this, _opts_initializers, []);
            }
            // initOptionValues?: Map<String, String[]>
            GiftLine.prototype.getOptionValuesAsMap = function () {
                var map = new Map();
                if (!Array.isArray(this.opts))
                    return map;
                for (var _i = 0, _b = this.opts; _i < _b.length; _i++) {
                    var option = _b[_i];
                    var optionId = option.id;
                    var valueIds = option.vals.map(function (val) { return val.id; });
                    if (optionId && Array.isArray(valueIds) && valueIds.length > 0)
                        map.set(optionId, valueIds);
                }
                return map;
            };
            return GiftLine;
        }()),
        (function () {
            var _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
            _opts_decorators = [(0, class_transformer_1.Type)(function () { return GiftLineOption; })];
            __esDecorate(null, null, _opts_decorators, { kind: "field", name: "opts", static: false, private: false, access: { has: function (obj) { return "opts" in obj; }, get: function (obj) { return obj.opts; }, set: function (obj, value) { obj.opts = value; } }, metadata: _metadata }, _opts_initializers, _instanceExtraInitializers);
            if (_metadata) Object.defineProperty(_a, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        })(),
        _a;
}();
exports.GiftLine = GiftLine;
var CanUseGiftMsg;
(function (CanUseGiftMsg) {
    CanUseGiftMsg["notActive"] = "notActive";
    CanUseGiftMsg["alreadyConsumed"] = "alreadyConsumed";
    CanUseGiftMsg["invalidAmount"] = "invalidAmount";
    CanUseGiftMsg["partialAmount"] = "partialAmount";
})(CanUseGiftMsg || (exports.CanUseGiftMsg = CanUseGiftMsg = {}));
var CanUseGift = /** @class */ (function () {
    function CanUseGift(valid, amount, msg, debug) {
        this.valid = valid;
        this.amount = amount;
        this.msg = msg;
        this.debug = debug;
    }
    return CanUseGift;
}());
exports.CanUseGift = CanUseGift;
/**
 * Changes:
 *   value?: number
 *   type?: GiftType   specific
 *   invoice = false
 */
var Gift = function () {
    var _a;
    var _classSuper = ts_common_1.ObjectWithIdPlus;
    var _instanceExtraInitializers = [];
    var _from_decorators;
    var _from_initializers = [];
    var _to_decorators;
    var _to_initializers = [];
    var _lines_decorators;
    var _lines_initializers = [];
    var _vatPct_decorators;
    var _vatPct_initializers = [];
    var _expiresOn_decorators;
    var _expiresOn_initializers = [];
    var _value_decorators;
    var _value_initializers = [];
    var _used_decorators;
    var _used_initializers = [];
    var _methods_decorators;
    var _methods_initializers = [];
    var _crea_decorators;
    var _crea_initializers = [];
    return _a = /** @class */ (function (_super) {
            __extends(Gift, _super);
            //certificate: GiftCertificate = GiftCertificate.inStore
            function Gift(createNewCode, markAsNew) {
                if (createNewCode === void 0) { createNewCode = false; }
                if (markAsNew === void 0) { markAsNew = false; }
                var _this = _super.call(this) || this;
                _this.orgId = (__runInitializers(_this, _instanceExtraInitializers), void 0);
                _this.from = __runInitializers(_this, _from_initializers, void 0);
                _this.to = __runInitializers(_this, _to_initializers, void 0);
                _this.lines = __runInitializers(_this, _lines_initializers, []);
                _this.invoice = false;
                /** the vat% that will be used if gift is invoice and type=amount  */
                _this.vatPct = __runInitializers(_this, _vatPct_initializers, void 0);
                _this.expiresOn = __runInitializers(_this, _expiresOn_initializers, void 0);
                /** the value of the gift in local currency */
                _this.value = __runInitializers(_this, _value_initializers, void 0);
                /** the amount already used in local currency */
                _this.used = __runInitializers(_this, _used_initializers, 0);
                _this.isConsumed = false;
                //  toSendEmail = false
                _this.methods = __runInitializers(_this, _methods_initializers, new GiftMethods()
                /** created at */
                );
                /** created at */
                _this.crea = __runInitializers(_this, _crea_initializers, new Date()
                //certificate: GiftCertificate = GiftCertificate.inStore
                );
                if (createNewCode)
                    _this.newCode();
                if (markAsNew)
                    _this.m.n = true;
                return _this;
            }
            Gift.prototype.isAmount = function () {
                return this.type == GiftType.amount;
            };
            /** check if given amount (or less) can be used */
            Gift.prototype.canUse = function (amount) {
                if (!amount || amount <= 0)
                    return new CanUseGift(false, 0, CanUseGiftMsg.invalidAmount, "amount=".concat(amount));
                if (!this.act)
                    return new CanUseGift(false, 0, CanUseGiftMsg.notActive);
                /*     if (this.isConsumed)
                      return new CanUseGift(false, 0, CanUseGiftMsg.alreadyConsumed, `isConsumed=true`) */
                var available = this.availableAmount();
                if (!available || available < 0)
                    return new CanUseGift(false, 0, CanUseGiftMsg.alreadyConsumed, "available=".concat(available));
                if (amount <= available)
                    return new CanUseGift(true, amount);
                else {
                    return new CanUseGift(true, available, CanUseGiftMsg.partialAmount);
                }
            };
            Gift.prototype.newCode = function () {
                this.code = ts_common_1.ObjectHelper.createRandomString(6, "ABCDEFGHJKLMNPQRSTUVWXYZ23456789");
            };
            Gift.prototype.use = function (amount) {
                this.used += amount;
                if (this.used >= this.value)
                    this.isConsumed = true;
                else
                    this.isConsumed = false;
            };
            Gift.prototype.free = function (amount) {
                this.used -= amount;
                if (this.used >= this.value)
                    this.isConsumed = true;
                else
                    this.isConsumed = false;
            };
            Gift.prototype.isSpecific = function () {
                return this.type == GiftType.specific;
            };
            Gift.prototype.availableAmount = function () {
                if (this.used && this.used > 0) // we had a bug that used was negative
                    return this.value - this.used;
                return this.value;
            };
            Gift.prototype.hasLines = function () {
                return Array.isArray(this.lines) && this.lines.length > 0;
            };
            Gift.prototype.methodSelected = function () {
                var methods = this.methods;
                return (methods.emailFrom || methods.emailTo || methods.pos || methods.postal);
            };
            return Gift;
        }(_classSuper)),
        (function () {
            var _b;
            var _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create((_b = _classSuper[Symbol.metadata]) !== null && _b !== void 0 ? _b : null) : void 0;
            _from_decorators = [(0, class_transformer_1.Type)(function () { return Contact; })];
            _to_decorators = [(0, class_transformer_1.Type)(function () { return Contact; })];
            _lines_decorators = [(0, class_transformer_1.Type)(function () { return GiftLine; })];
            _vatPct_decorators = [(0, class_transformer_1.Type)(function () { return Number; })];
            _expiresOn_decorators = [(0, class_transformer_1.Type)(function () { return Date; })];
            _value_decorators = [(0, class_transformer_1.Type)(function () { return Number; })];
            _used_decorators = [(0, class_transformer_1.Type)(function () { return Number; })];
            _methods_decorators = [(0, class_transformer_1.Type)(function () { return GiftMethods; })];
            _crea_decorators = [(0, class_transformer_1.Type)(function () { return Date; })];
            __esDecorate(null, null, _from_decorators, { kind: "field", name: "from", static: false, private: false, access: { has: function (obj) { return "from" in obj; }, get: function (obj) { return obj.from; }, set: function (obj, value) { obj.from = value; } }, metadata: _metadata }, _from_initializers, _instanceExtraInitializers);
            __esDecorate(null, null, _to_decorators, { kind: "field", name: "to", static: false, private: false, access: { has: function (obj) { return "to" in obj; }, get: function (obj) { return obj.to; }, set: function (obj, value) { obj.to = value; } }, metadata: _metadata }, _to_initializers, _instanceExtraInitializers);
            __esDecorate(null, null, _lines_decorators, { kind: "field", name: "lines", static: false, private: false, access: { has: function (obj) { return "lines" in obj; }, get: function (obj) { return obj.lines; }, set: function (obj, value) { obj.lines = value; } }, metadata: _metadata }, _lines_initializers, _instanceExtraInitializers);
            __esDecorate(null, null, _vatPct_decorators, { kind: "field", name: "vatPct", static: false, private: false, access: { has: function (obj) { return "vatPct" in obj; }, get: function (obj) { return obj.vatPct; }, set: function (obj, value) { obj.vatPct = value; } }, metadata: _metadata }, _vatPct_initializers, _instanceExtraInitializers);
            __esDecorate(null, null, _expiresOn_decorators, { kind: "field", name: "expiresOn", static: false, private: false, access: { has: function (obj) { return "expiresOn" in obj; }, get: function (obj) { return obj.expiresOn; }, set: function (obj, value) { obj.expiresOn = value; } }, metadata: _metadata }, _expiresOn_initializers, _instanceExtraInitializers);
            __esDecorate(null, null, _value_decorators, { kind: "field", name: "value", static: false, private: false, access: { has: function (obj) { return "value" in obj; }, get: function (obj) { return obj.value; }, set: function (obj, value) { obj.value = value; } }, metadata: _metadata }, _value_initializers, _instanceExtraInitializers);
            __esDecorate(null, null, _used_decorators, { kind: "field", name: "used", static: false, private: false, access: { has: function (obj) { return "used" in obj; }, get: function (obj) { return obj.used; }, set: function (obj, value) { obj.used = value; } }, metadata: _metadata }, _used_initializers, _instanceExtraInitializers);
            __esDecorate(null, null, _methods_decorators, { kind: "field", name: "methods", static: false, private: false, access: { has: function (obj) { return "methods" in obj; }, get: function (obj) { return obj.methods; }, set: function (obj, value) { obj.methods = value; } }, metadata: _metadata }, _methods_initializers, _instanceExtraInitializers);
            __esDecorate(null, null, _crea_decorators, { kind: "field", name: "crea", static: false, private: false, access: { has: function (obj) { return "crea" in obj; }, get: function (obj) { return obj.crea; }, set: function (obj, value) { obj.crea = value; } }, metadata: _metadata }, _crea_initializers, _instanceExtraInitializers);
            if (_metadata) Object.defineProperty(_a, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        })(),
        _a;
}();
exports.Gift = Gift;
var PaymentType;
(function (PaymentType) {
    PaymentType["cash"] = "cash";
    PaymentType["transfer"] = "transfer";
    PaymentType["credit"] = "credit";
    PaymentType["debit"] = "debit";
    PaymentType["gift"] = "gift";
    PaymentType["stripe"] = "stripe";
    /** subscription */
    PaymentType["subs"] = "subs";
})(PaymentType || (exports.PaymentType = PaymentType = {}));
var Payment = function () {
    var _a;
    var _classSuper = ts_common_1.ObjectWithIdPlus;
    var _instanceExtraInitializers = [];
    var _order_decorators;
    var _order_initializers = [];
    var _amount_decorators;
    var _amount_initializers = [];
    var _gift_decorators;
    var _gift_initializers = [];
    var _subs_decorators;
    var _subs_initializers = [];
    return _a = /** @class */ (function (_super) {
            __extends(Payment, _super);
            function Payment() {
                var _this = _super !== null && _super.apply(this, arguments) || this;
                _this.idx = (__runInitializers(_this, _instanceExtraInitializers), 0);
                _this.order = __runInitializers(_this, _order_initializers, void 0);
                _this.amount = __runInitializers(_this, _amount_initializers, 0);
                _this.gift = __runInitializers(_this, _gift_initializers, void 0);
                _this.subs = __runInitializers(_this, _subs_initializers, void 0);
                _this.date = new Date();
                /** amount is declared */
                _this.decl = false;
                return _this;
            }
            return Payment;
        }(_classSuper)),
        (function () {
            var _b;
            var _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create((_b = _classSuper[Symbol.metadata]) !== null && _b !== void 0 ? _b : null) : void 0;
            _order_decorators = [(0, class_transformer_1.Type)(function () { return Order; })];
            _amount_decorators = [(0, class_transformer_1.Type)(function () { return Number; })];
            _gift_decorators = [(0, class_transformer_1.Type)(function () { return Gift; })];
            _subs_decorators = [(0, class_transformer_1.Type)(function () { return Subscription; })];
            __esDecorate(null, null, _order_decorators, { kind: "field", name: "order", static: false, private: false, access: { has: function (obj) { return "order" in obj; }, get: function (obj) { return obj.order; }, set: function (obj, value) { obj.order = value; } }, metadata: _metadata }, _order_initializers, _instanceExtraInitializers);
            __esDecorate(null, null, _amount_decorators, { kind: "field", name: "amount", static: false, private: false, access: { has: function (obj) { return "amount" in obj; }, get: function (obj) { return obj.amount; }, set: function (obj, value) { obj.amount = value; } }, metadata: _metadata }, _amount_initializers, _instanceExtraInitializers);
            __esDecorate(null, null, _gift_decorators, { kind: "field", name: "gift", static: false, private: false, access: { has: function (obj) { return "gift" in obj; }, get: function (obj) { return obj.gift; }, set: function (obj, value) { obj.gift = value; } }, metadata: _metadata }, _gift_initializers, _instanceExtraInitializers);
            __esDecorate(null, null, _subs_decorators, { kind: "field", name: "subs", static: false, private: false, access: { has: function (obj) { return "subs" in obj; }, get: function (obj) { return obj.subs; }, set: function (obj, value) { obj.subs = value; } }, metadata: _metadata }, _subs_initializers, _instanceExtraInitializers);
            if (_metadata) Object.defineProperty(_a, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        })(),
        _a;
}();
exports.Payment = Payment;
/** Products can be included/excluded to a program based on id or on a search string (to be applied to product name) */
var LoyaltyProductMode;
(function (LoyaltyProductMode) {
    LoyaltyProductMode["id"] = "id";
    LoyaltyProductMode["search"] = "search";
})(LoyaltyProductMode || (exports.LoyaltyProductMode = LoyaltyProductMode = {}));
/** Loyalty programs are configured for certain products/services. These can be included or excluded from the program (program.incl or program.excl)
 * using the LoyaltyProduct class
 */
var LoyaltyProduct = /** @class */ (function () {
    // id: string
    // name: string
    // mode: LoyaltyProductMode.id
    function LoyaltyProduct(mode, name, id) {
        if (mode === void 0) { mode = LoyaltyProductMode.id; }
        this.mode = mode;
        this.name = name;
        this.id = id;
    }
    LoyaltyProduct.fromProduct = function (product) {
        return new LoyaltyProduct(LoyaltyProductMode.id, product.name, product.id);
    };
    return LoyaltyProduct;
}());
exports.LoyaltyProduct = LoyaltyProduct;
var LoyaltyRewardType;
(function (LoyaltyRewardType) {
    /** general discount, can be applied to any order */
    LoyaltyRewardType["discount"] = "discount";
    /** discount for certain products only */
    LoyaltyRewardType["productDiscount"] = "productDiscount";
    LoyaltyRewardType["freeProduct"] = "freeProduct";
})(LoyaltyRewardType || (exports.LoyaltyRewardType = LoyaltyRewardType = {}));
/** introduced for use case: 3rd hour of wellness free
 *  Since duration is a product option, we need to express that this option should be minimum 3
 */
var LoyaltyOptionCondition;
(function (LoyaltyOptionCondition) {
    /** equal */
    LoyaltyOptionCondition["eql"] = "eql";
    /** minimum, value should be >= */
    LoyaltyOptionCondition["min"] = "min";
})(LoyaltyOptionCondition || (exports.LoyaltyOptionCondition = LoyaltyOptionCondition = {}));
var LoyaltyRewardOptionValue = /** @class */ (function () {
    function LoyaltyRewardOptionValue(id, name, idx) {
        this.id = id;
        this.name = name;
        this.idx = idx;
    }
    return LoyaltyRewardOptionValue;
}());
exports.LoyaltyRewardOptionValue = LoyaltyRewardOptionValue;
var LoyaltyRewardOption = function () {
    var _a;
    var _instanceExtraInitializers = [];
    var _values_decorators;
    var _values_initializers = [];
    return _a = /** @class */ (function () {
            function LoyaltyRewardOption() {
                this.id = (__runInitializers(this, _instanceExtraInitializers), void 0);
                this.values = __runInitializers(this, _values_initializers, []);
            }
            LoyaltyRewardOption.prototype.valueNames = function (separator) {
                if (separator === void 0) { separator = ', '; }
                if (!this.values)
                    return '';
                return this.values.map(function (v) { return v.name; }).join(separator);
            };
            return LoyaltyRewardOption;
        }()),
        (function () {
            var _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
            _values_decorators = [(0, class_transformer_1.Type)(function () { return LoyaltyRewardOptionValue; })];
            __esDecorate(null, null, _values_decorators, { kind: "field", name: "values", static: false, private: false, access: { has: function (obj) { return "values" in obj; }, get: function (obj) { return obj.values; }, set: function (obj, value) { obj.values = value; } }, metadata: _metadata }, _values_initializers, _instanceExtraInitializers);
            if (_metadata) Object.defineProperty(_a, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        })(),
        _a;
}();
exports.LoyaltyRewardOption = LoyaltyRewardOption;
var LoyaltyRewardProduct = function () {
    var _a;
    var _instanceExtraInitializers = [];
    var _options_decorators;
    var _options_initializers = [];
    return _a = /** @class */ (function () {
            function LoyaltyRewardProduct() {
                this.id = (__runInitializers(this, _instanceExtraInitializers), void 0);
                this.options = __runInitializers(this, _options_initializers, void 0);
            }
            return LoyaltyRewardProduct;
        }()),
        (function () {
            var _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
            _options_decorators = [(0, class_transformer_1.Type)(function () { return LoyaltyRewardOption; })];
            __esDecorate(null, null, _options_decorators, { kind: "field", name: "options", static: false, private: false, access: { has: function (obj) { return "options" in obj; }, get: function (obj) { return obj.options; }, set: function (obj, value) { obj.options = value; } }, metadata: _metadata }, _options_initializers, _instanceExtraInitializers);
            if (_metadata) Object.defineProperty(_a, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        })(),
        _a;
}();
exports.LoyaltyRewardProduct = LoyaltyRewardProduct;
var LoyaltyReward = function () {
    var _a;
    var _instanceExtraInitializers = [];
    var _product_decorators;
    var _product_initializers = [];
    return _a = /** @class */ (function () {
            function LoyaltyReward() {
                this.id = (__runInitializers(this, _instanceExtraInitializers), void 0);
                this.name = '';
                this.type = LoyaltyRewardType.discount;
                /** min amount on card to receive this reward */
                this.amount = 0;
                /** value received if amount  */
                this.discount = 0;
                this.product = __runInitializers(this, _product_initializers, void 0);
                this.id = ts_common_1.ObjectHelper.newGuid();
            }
            LoyaltyReward.prototype.label = function () {
                var _b, _c;
                if (this.name)
                    return this.name;
                else if ((_b = this.product) === null || _b === void 0 ? void 0 : _b.name)
                    return (_c = this.product) === null || _c === void 0 ? void 0 : _c.name;
                return '';
            };
            LoyaltyReward.prototype.hasDiscount = function () {
                return (this.type == LoyaltyRewardType.discount || this.type == LoyaltyRewardType.productDiscount) && this.discount;
            };
            LoyaltyReward.prototype.hasProductOptions = function () {
                var _b;
                return (ts_common_1.ArrayHelper.AtLeastOneItem((_b = this.product) === null || _b === void 0 ? void 0 : _b.options));
            };
            return LoyaltyReward;
        }()),
        (function () {
            var _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
            _product_decorators = [(0, class_transformer_1.Type)(function () { return LoyaltyRewardProduct; })];
            __esDecorate(null, null, _product_decorators, { kind: "field", name: "product", static: false, private: false, access: { has: function (obj) { return "product" in obj; }, get: function (obj) { return obj.product; }, set: function (obj, value) { obj.product = value; } }, metadata: _metadata }, _product_initializers, _instanceExtraInitializers);
            if (_metadata) Object.defineProperty(_a, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        })(),
        _a;
}();
exports.LoyaltyReward = LoyaltyReward;
var LoyaltyUnit;
(function (LoyaltyUnit) {
    LoyaltyUnit["priceIncl"] = "priceIncl";
    LoyaltyUnit["qty"] = "qty";
})(LoyaltyUnit || (exports.LoyaltyUnit = LoyaltyUnit = {}));
var LoyaltyProgram = function () {
    var _a;
    var _classSuper = ts_common_1.ObjectWithIdPlus;
    var _instanceExtraInitializers = [];
    var _cards_decorators;
    var _cards_initializers = [];
    var _incl_decorators;
    var _incl_initializers = [];
    var _excl_decorators;
    var _excl_initializers = [];
    var _rewards_decorators;
    var _rewards_initializers = [];
    return _a = /** @class */ (function (_super) {
            __extends(LoyaltyProgram, _super);
            function LoyaltyProgram() {
                var _this = _super !== null && _super.apply(this, arguments) || this;
                _this.orgId = (__runInitializers(_this, _instanceExtraInitializers), void 0);
                _this.cards = __runInitializers(_this, _cards_initializers, void 0);
                _this.maxValue = -1;
                _this.maxDaysValid = -1;
                _this.track = LoyaltyUnit.qty;
                /** products included?  */
                _this.prod = true;
                /** basic services included?  */
                _this.svc_basic = true;
                /** bundled services included?  */
                _this.svc_bundle = true;
                /** subscription services included? */
                _this.svc_subs = true;
                /** promotions included in program? */
                _this.promo = false;
                _this.incl = __runInitializers(_this, _incl_initializers, []);
                _this.excl = __runInitializers(_this, _excl_initializers, []);
                _this.rewards = __runInitializers(_this, _rewards_initializers, []);
                _this.idx = 0;
                return _this;
            }
            LoyaltyProgram.prototype.hasIncludedCategories = function () {
                return (this.prod || this.svc_basic || this.svc_bundle || this.svc_subs || this.promo);
            };
            LoyaltyProgram.prototype.includedCategories = function () {
                var cats = [];
                if (this.prod)
                    cats.push('prod');
                if (this.svc_basic)
                    cats.push('svc_basic');
                if (this.svc_bundle)
                    cats.push('svc_bundle');
                if (this.svc_subs)
                    cats.push('svc_subs');
                if (this.promo)
                    cats.push('promo');
                return cats;
            };
            LoyaltyProgram.prototype.hasExcludedCategories = function () {
                return (!this.prod || !this.svc_basic || !this.svc_bundle || !this.svc_subs || !this.promo);
            };
            LoyaltyProgram.prototype.excludedCategories = function () {
                var cats = [];
                if (!this.prod)
                    cats.push('prod');
                if (!this.svc_basic)
                    cats.push('svc_basic');
                if (!this.svc_bundle)
                    cats.push('svc_bundle');
                if (!this.svc_subs)
                    cats.push('svc_subs');
                if (!this.promo)
                    cats.push('promo');
                return cats;
            };
            LoyaltyProgram.prototype.hasIncl = function () {
                return ts_common_1.ArrayHelper.AtLeastOneItem(this.incl);
            };
            LoyaltyProgram.prototype.includesProduct = function (productId) {
                if (!this.hasIncl())
                    return false;
                var idx = this.incl.findIndex(function (p) { return p.id == productId; });
                return (idx >= 0);
            };
            LoyaltyProgram.prototype.hasExcl = function () {
                return ts_common_1.ArrayHelper.AtLeastOneItem(this.excl);
            };
            LoyaltyProgram.prototype.excludesProduct = function (productId) {
                if (!this.hasExcl())
                    return false;
                var idx = this.excl.findIndex(function (p) { return p.id == productId; });
                return (idx >= 0);
            };
            LoyaltyProgram.prototype.hasRewards = function () {
                return ts_common_1.ArrayHelper.AtLeastOneItem(this.rewards);
            };
            LoyaltyProgram.prototype.hasProduct = function (product) {
                var inProgram = false;
                if (!product)
                    return false;
                if (this.prod && product.type == ProductType.prod) // if loyalty program is enabled for products
                    inProgram = true;
                else if (product.type == ProductType.svc) { // in case of a service product
                    if (this.svc_basic && product.sub == ProductSubType.basic) // if loyalty program is enabled for basic services
                        inProgram = true;
                    else if (this.svc_bundle && product.sub == ProductSubType.bundle) // if loyalty program is enabled for bundled services 
                        inProgram = true;
                    else if (this.svc_bundle && product.sub == ProductSubType.subs) // if loyalty program is enabled for subscription services 
                        inProgram = true;
                }
                if (!inProgram && this.includesProduct(product.id)) {
                    inProgram = true;
                }
                if (inProgram && this.excludesProduct(product.id)) {
                    inProgram = false;
                }
                return inProgram;
            };
            return LoyaltyProgram;
        }(_classSuper)),
        (function () {
            var _b;
            var _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create((_b = _classSuper[Symbol.metadata]) !== null && _b !== void 0 ? _b : null) : void 0;
            _cards_decorators = [(0, class_transformer_1.Type)(function () { return LoyaltyCard; })];
            _incl_decorators = [(0, class_transformer_1.Type)(function () { return LoyaltyProduct; })];
            _excl_decorators = [(0, class_transformer_1.Type)(function () { return LoyaltyProduct; })];
            _rewards_decorators = [(0, class_transformer_1.Type)(function () { return LoyaltyReward; })];
            __esDecorate(null, null, _cards_decorators, { kind: "field", name: "cards", static: false, private: false, access: { has: function (obj) { return "cards" in obj; }, get: function (obj) { return obj.cards; }, set: function (obj, value) { obj.cards = value; } }, metadata: _metadata }, _cards_initializers, _instanceExtraInitializers);
            __esDecorate(null, null, _incl_decorators, { kind: "field", name: "incl", static: false, private: false, access: { has: function (obj) { return "incl" in obj; }, get: function (obj) { return obj.incl; }, set: function (obj, value) { obj.incl = value; } }, metadata: _metadata }, _incl_initializers, _instanceExtraInitializers);
            __esDecorate(null, null, _excl_decorators, { kind: "field", name: "excl", static: false, private: false, access: { has: function (obj) { return "excl" in obj; }, get: function (obj) { return obj.excl; }, set: function (obj, value) { obj.excl = value; } }, metadata: _metadata }, _excl_initializers, _instanceExtraInitializers);
            __esDecorate(null, null, _rewards_decorators, { kind: "field", name: "rewards", static: false, private: false, access: { has: function (obj) { return "rewards" in obj; }, get: function (obj) { return obj.rewards; }, set: function (obj, value) { obj.rewards = value; } }, metadata: _metadata }, _rewards_initializers, _instanceExtraInitializers);
            if (_metadata) Object.defineProperty(_a, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        })(),
        _a;
}();
exports.LoyaltyProgram = LoyaltyProgram;
var RegisterLoyalty = /** @class */ (function () {
    function RegisterLoyalty(contactId) {
        this.lines = [];
        this.contactId = contactId;
    }
    RegisterLoyalty.prototype.getLinesForPrograms = function (programIds) {
        var lines = this.lines.filter(function (line) { return programIds.indexOf(line.programId) >= 0; });
        return lines;
    };
    RegisterLoyalty.prototype.getLinesForOtherPrograms = function (programIds) {
        var lines = this.lines.filter(function (line) { return programIds.indexOf(line.programId) == -1; });
        return lines;
    };
    return RegisterLoyalty;
}());
exports.RegisterLoyalty = RegisterLoyalty;
var LoyaltyLine = /** @class */ (function () {
    function LoyaltyLine(programId, name, extra) {
        this.programId = programId;
        this.name = name;
        this.extra = extra;
    }
    return LoyaltyLine;
}());
exports.LoyaltyLine = LoyaltyLine;
var LoyaltyCardChange = function () {
    var _a;
    var _instanceExtraInitializers = [];
    var _date_decorators;
    var _date_initializers = [];
    return _a = /** @class */ (function () {
            function LoyaltyCardChange() {
                this.id = (__runInitializers(this, _instanceExtraInitializers), void 0);
                this.value = 0;
                this.isReward = false;
                this.date = __runInitializers(this, _date_initializers, new Date());
            }
            return LoyaltyCardChange;
        }()),
        (function () {
            var _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
            _date_decorators = [(0, class_transformer_1.Type)(function () { return Date; })];
            __esDecorate(null, null, _date_decorators, { kind: "field", name: "date", static: false, private: false, access: { has: function (obj) { return "date" in obj; }, get: function (obj) { return obj.date; }, set: function (obj, value) { obj.date = value; } }, metadata: _metadata }, _date_initializers, _instanceExtraInitializers);
            if (_metadata) Object.defineProperty(_a, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        })(),
        _a;
}();
exports.LoyaltyCardChange = LoyaltyCardChange;
var LoyaltyCard = /** @class */ (function (_super) {
    __extends(LoyaltyCard, _super);
    function LoyaltyCard() {
        var _this = _super !== null && _super.apply(this, arguments) || this;
        _this.value = 0;
        return _this;
    }
    return LoyaltyCard;
}(ts_common_1.ObjectWithIdPlus));
exports.LoyaltyCard = LoyaltyCard;
var TaskSchedule;
(function (TaskSchedule) {
    TaskSchedule["once"] = "once";
    TaskSchedule["daily"] = "daily";
    TaskSchedule["twiceAWeek"] = "twiceAWeek";
    TaskSchedule["weekly"] = "weekly";
    TaskSchedule["twiceAMonth"] = "twiceAMonth";
    TaskSchedule["monthly"] = "monthly";
    TaskSchedule["quarterly"] = "quarterly";
    TaskSchedule["yearly"] = "yearly";
    TaskSchedule["manual"] = "manual";
})(TaskSchedule || (exports.TaskSchedule = TaskSchedule = {}));
var TaskStatus;
(function (TaskStatus) {
    TaskStatus["todo"] = "todo";
    TaskStatus["progress"] = "progress";
    TaskStatus["done"] = "done";
    TaskStatus["skip"] = "skip";
})(TaskStatus || (exports.TaskStatus = TaskStatus = {}));
var TaskPriority;
(function (TaskPriority) {
    TaskPriority[TaskPriority["notUrgent"] = 0] = "notUrgent";
    TaskPriority[TaskPriority["normal"] = 10] = "normal";
    TaskPriority[TaskPriority["asap"] = 20] = "asap";
    TaskPriority[TaskPriority["urgent"] = 30] = "urgent";
})(TaskPriority || (exports.TaskPriority = TaskPriority = {}));
var Task = /** @class */ (function (_super) {
    __extends(Task, _super);
    function Task() {
        var _this = _super !== null && _super.apply(this, arguments) || this;
        _this.prio = TaskPriority.normal;
        _this.schedule = TaskSchedule.once;
        /** human resources = staff, links to a resource or resource group */
        _this.hrIds = [];
        _this.status = TaskStatus.todo;
        _this.active = true;
        _this.createdAt = new Date();
        return _this;
    }
    /** Convert a recurring task (schedule<>'once') into a concrete task (schedule='once') */
    Task.prototype.toInstance = function () {
        var clone = ts_common_1.ObjectHelper.clone(this, Task);
        clone.id = ts_common_1.ObjectHelper.newGuid();
        clone.createdAt = new Date();
        clone.origSched = this.schedule;
        clone.schedule = TaskSchedule.once;
        clone.rTaskId = this.id;
        // clone.id = null  // because it is a new task
        return clone;
    };
    Task.prototype.isRecurrent = function () {
        return this.schedule != TaskSchedule.once;
    };
    Task.prototype.htmlStyle = function () {
        return "color: ".concat(this.color());
    };
    Object.defineProperty(Task.prototype, "template", {
        get: function () {
            return this.schedule == TaskSchedule.manual;
        },
        set: function (value) {
            if (value)
                this.schedule = TaskSchedule.manual;
            else
                this.schedule = TaskSchedule.once;
            //return this.schedule == TaskSchedule.manual
        },
        enumerable: false,
        configurable: true
    });
    Task.prototype.backColorForSchedule = function (schedule) {
        switch (schedule) {
            case TaskSchedule.daily:
                return '#FFF0F0';
            case TaskSchedule.twiceAWeek:
                return '#F2FAFF';
            case TaskSchedule.weekly:
                return '#E5F5FF';
        }
        return "white";
    };
    Task.prototype.backColor = function () {
        if (this.origSched)
            return this.backColorForSchedule(this.origSched);
        else
            return this.backColorForSchedule(this.schedule);
    };
    Task.prototype.color = function () {
        switch (this.prio) {
            case TaskPriority.urgent:
                return 'red';
            case TaskPriority.asap:
                return 'orange';
            default:
                return 'green';
        }
    };
    return Task;
}(ts_common_1.ObjectWithIdPlus));
exports.Task = Task;
/**
 *  Introduced to store web push subscriptions for users, but any extra JSON can be stored here for any object
 */
var CustomJson = /** @class */ (function (_super) {
    __extends(CustomJson, _super);
    function CustomJson() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    return CustomJson;
}(ts_common_1.ObjectWithIdPlus));
exports.CustomJson = CustomJson;
var ObjectLogAction;
(function (ObjectLogAction) {
    /** new object */
    ObjectLogAction["new"] = "new";
    /** update */
    ObjectLogAction["upd"] = "upd";
    /** soft delete */
    ObjectLogAction["sftDel"] = "sftDel";
    /** hard delete */
    ObjectLogAction["hrdDel"] = "hrdDel";
})(ObjectLogAction || (exports.ObjectLogAction = ObjectLogAction = {}));
var ObjectLog = /** @class */ (function (_super) {
    __extends(ObjectLog, _super);
    function ObjectLog() {
        var _this = _super !== null && _super.apply(this, arguments) || this;
        _this.date = new Date();
        return _this;
    }
    ObjectLog.update = function (objId, data) {
        var log = new ObjectLog();
        log.objId = objId;
        log.data = data;
        log.action = ObjectLogAction.upd;
        return log;
    };
    return ObjectLog;
}(ts_common_1.ObjectWithId));
exports.ObjectLog = ObjectLog;
var TypeInfo = function () {
    var _a;
    var _classSuper = ts_common_1.ObjectWithId;
    var _instanceExtraInitializers = [];
    var _lastCreated_decorators;
    var _lastCreated_initializers = [];
    var _lastUpdated_decorators;
    var _lastUpdated_initializers = [];
    var _lastDeleted_decorators;
    var _lastDeleted_initializers = [];
    return _a = /** @class */ (function (_super) {
            __extends(TypeInfo, _super);
            function TypeInfo() {
                var _this = _super !== null && _super.apply(this, arguments) || this;
                _this.branchId = (__runInitializers(_this, _instanceExtraInitializers), void 0);
                _this.lastCreated = __runInitializers(_this, _lastCreated_initializers, void 0);
                _this.lastUpdated = __runInitializers(_this, _lastUpdated_initializers, void 0);
                _this.lastDeleted = __runInitializers(_this, _lastDeleted_initializers, void 0);
                return _this;
            }
            return TypeInfo;
        }(_classSuper)),
        (function () {
            var _b;
            var _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create((_b = _classSuper[Symbol.metadata]) !== null && _b !== void 0 ? _b : null) : void 0;
            _lastCreated_decorators = [(0, class_transformer_1.Type)(function () { return Date; })];
            _lastUpdated_decorators = [(0, class_transformer_1.Type)(function () { return Date; })];
            _lastDeleted_decorators = [(0, class_transformer_1.Type)(function () { return Date; })];
            __esDecorate(null, null, _lastCreated_decorators, { kind: "field", name: "lastCreated", static: false, private: false, access: { has: function (obj) { return "lastCreated" in obj; }, get: function (obj) { return obj.lastCreated; }, set: function (obj, value) { obj.lastCreated = value; } }, metadata: _metadata }, _lastCreated_initializers, _instanceExtraInitializers);
            __esDecorate(null, null, _lastUpdated_decorators, { kind: "field", name: "lastUpdated", static: false, private: false, access: { has: function (obj) { return "lastUpdated" in obj; }, get: function (obj) { return obj.lastUpdated; }, set: function (obj, value) { obj.lastUpdated = value; } }, metadata: _metadata }, _lastUpdated_initializers, _instanceExtraInitializers);
            __esDecorate(null, null, _lastDeleted_decorators, { kind: "field", name: "lastDeleted", static: false, private: false, access: { has: function (obj) { return "lastDeleted" in obj; }, get: function (obj) { return obj.lastDeleted; }, set: function (obj, value) { obj.lastDeleted = value; } }, metadata: _metadata }, _lastDeleted_initializers, _instanceExtraInitializers);
            if (_metadata) Object.defineProperty(_a, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        })(),
        _a;
}();
exports.TypeInfo = TypeInfo;
/*
model TypeInfo {
  id String @id(map: "newtable_pk") @default(dbgenerated("gen_random_uuid()")) @db.Uuid

  branchId String?
  name     String

  lastCreated DateTime?
  lastUpdated DateTime?
  lastDeleted DateTime?

  @@unique([branchId, name])
}



*/ 
