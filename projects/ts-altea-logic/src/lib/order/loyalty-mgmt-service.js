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
exports.LoyaltyMgmtService = exports.LoyaltyByProgram = exports.LoyaltyUiCard = exports.LoyaltyUi = void 0;
var ts_altea_model_1 = require("ts-altea-model");
var altea_db_1 = require("../general/altea-db");
var ts_common_1 = require("ts-common");
var LoyaltyUi = /** @class */ (function () {
    function LoyaltyUi() {
        this.cards = [];
        this.programs = [];
        /** true if there is new loyalty */
        this.newLoyalty = false;
    }
    LoyaltyUi.prototype.getApiObject = function (contactId) {
        var register = new ts_altea_model_1.RegisterLoyalty(contactId);
        if (ts_common_1.ArrayHelper.IsEmpty(this.cards))
            return register;
        register.lines = this.cards.filter(function (c) { return c.extra > 0; }).map(function (uiCard) { return new ts_altea_model_1.LoyaltyLine(uiCard.program.id, uiCard.program.name, uiCard.extra); });
        return register;
    };
    LoyaltyUi.prototype.update = function (cards, resetExtra) {
        if (resetExtra === void 0) { resetExtra = true; }
        if (ts_common_1.ArrayHelper.IsEmpty(cards))
            return;
        var _loop_1 = function (card) {
            var uiCard = this_1.cards.find(function (c) { return c.program.id == card.programId; });
            if (uiCard) {
                uiCard.current = card.value;
                if (resetExtra)
                    uiCard.extra = 0;
            }
        };
        var this_1 = this;
        for (var _i = 0, cards_1 = cards; _i < cards_1.length; _i++) {
            var card = cards_1[_i];
            _loop_1(card);
        }
    };
    LoyaltyUi.prototype.availableRewards = function () {
        if (ts_common_1.ArrayHelper.IsEmpty(this.cards))
            return [];
        var rewards = this.cards.flatMap(function (c) { return c.openRewards; });
        return rewards;
    };
    return LoyaltyUi;
}());
exports.LoyaltyUi = LoyaltyUi;
/** to show loyalty card info in the UI */
var LoyaltyUiCard = /** @class */ (function () {
    function LoyaltyUiCard(program, card) {
        this.current = 0;
        /** the extra (loyalty) amount that can be put on the card  */
        this.extra = 0;
        this.program = program;
        this.card = card;
    }
    LoyaltyUiCard.prototype.hasOpenRewards = function () {
        return ts_common_1.ArrayHelper.AtLeastOneItem(this.openRewards);
    };
    return LoyaltyUiCard;
}());
exports.LoyaltyUiCard = LoyaltyUiCard;
var LoyaltyByProgram = /** @class */ (function () {
    function LoyaltyByProgram() {
        this.values = new Map();
    }
    LoyaltyByProgram.prototype.addLoyalty = function (programId, value) {
        var newValue = value;
        if (this.values.has(programId))
            newValue += this.values.get(programId);
        this.values.set(programId, newValue);
        return newValue;
    };
    LoyaltyByProgram.prototype.hasValues = function () {
        return this.values && this.values.size > 0;
    };
    LoyaltyByProgram.prototype.getValue = function (programId) {
        if (!this.values.has(programId))
            return 0;
        return this.values.get(programId);
    };
    return LoyaltyByProgram;
}());
exports.LoyaltyByProgram = LoyaltyByProgram;
var LoyaltyMgmtService = /** @class */ (function () {
    function LoyaltyMgmtService(db) {
        if (db instanceof altea_db_1.AlteaDb)
            this.alteaDb = db;
        else
            this.alteaDb = new altea_db_1.AlteaDb(db);
    }
    LoyaltyMgmtService.prototype.saveLoyalty = function (register) {
        return __awaiter(this, void 0, void 0, function () {
            var existingCards, existingProgramIds, cardsToUpdate, lines, _loop_2, _i, lines_1, line, updateResult, cardsToCreate, newCardLines, _a, newCardLines_1, line, newCard, createResult;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0: return [4 /*yield*/, this.alteaDb.getLoyaltyCards(register.contactId)];
                    case 1:
                        existingCards = _b.sent();
                        existingProgramIds = [];
                        existingProgramIds = existingCards.map(function (card) { return card.programId; });
                        if (!ts_common_1.ArrayHelper.AtLeastOneItem(existingCards)) return [3 /*break*/, 3];
                        cardsToUpdate = [];
                        lines = register.getLinesForPrograms(existingProgramIds);
                        _loop_2 = function (line) {
                            var card = existingCards.find(function (c) { return c.programId == line.programId; });
                            card.value += line.extra;
                            cardsToUpdate.push(card);
                        };
                        for (_i = 0, lines_1 = lines; _i < lines_1.length; _i++) {
                            line = lines_1[_i];
                            _loop_2(line);
                        }
                        if (!(cardsToUpdate.length > 0)) return [3 /*break*/, 3];
                        return [4 /*yield*/, this.alteaDb.updateLoyaltyCards(cardsToUpdate, ['value'])];
                    case 2:
                        updateResult = _b.sent();
                        console.log(updateResult);
                        _b.label = 3;
                    case 3:
                        cardsToCreate = [];
                        newCardLines = register.getLinesForOtherPrograms(existingProgramIds);
                        for (_a = 0, newCardLines_1 = newCardLines; _a < newCardLines_1.length; _a++) {
                            line = newCardLines_1[_a];
                            newCard = new ts_altea_model_1.LoyaltyCard();
                            newCard.contactId = register.contactId;
                            newCard.programId = line.programId;
                            newCard.name = line.name; // the program name
                            newCard.value = line.extra;
                            cardsToCreate.push(newCard);
                        }
                        if (!(cardsToCreate.length > 0)) return [3 /*break*/, 5];
                        return [4 /*yield*/, this.alteaDb.createLoyaltyCards(cardsToCreate)];
                    case 4:
                        createResult = _b.sent();
                        console.log(createResult);
                        _b.label = 5;
                    case 5: return [2 /*return*/, __spreadArray(__spreadArray([], existingCards, true), cardsToCreate, true)];
                }
            });
        });
    };
    LoyaltyMgmtService.prototype.getOverview = function (order) {
        var _a;
        return __awaiter(this, void 0, void 0, function () {
            var result, loyalty, cards, _loop_3, _i, _b, loyaltyProgram;
            return __generator(this, function (_c) {
                switch (_c.label) {
                    case 0:
                        console.error('-- getOverview --');
                        return [4 /*yield*/, this.calculateLoyalty(order)];
                    case 1:
                        result = _c.sent();
                        loyalty = new LoyaltyUi();
                        loyalty.programs = result.programs;
                        cards = [];
                        if ((_a = order === null || order === void 0 ? void 0 : order.contact) === null || _a === void 0 ? void 0 : _a.cards)
                            cards = order.contact.cards;
                        if (!result || !result.hasValues())
                            return [2 /*return*/, loyalty
                                //  const uiCards = []
                            ];
                        _loop_3 = function (loyaltyProgram) {
                            var existingCard = cards.find(function (c) { return c.programId == loyaltyProgram.id; });
                            var uiCard = new LoyaltyUiCard(loyaltyProgram, existingCard);
                            loyalty.cards.push(uiCard);
                            uiCard.extra = result.getValue(loyaltyProgram.id);
                            if (uiCard.extra > 0)
                                loyalty.newLoyalty = true;
                            if (existingCard) {
                                uiCard.current = existingCard.value;
                                if (existingCard.value > 0 && loyaltyProgram.hasRewards()) {
                                    uiCard.openRewards = loyaltyProgram.rewards.filter(function (r) { return r.amount <= existingCard.value; });
                                }
                            }
                        };
                        //  const uiCards = []
                        for (_i = 0, _b = result.programs; _i < _b.length; _i++) {
                            loyaltyProgram = _b[_i];
                            _loop_3(loyaltyProgram);
                        }
                        return [2 /*return*/, loyalty];
                }
            });
        });
    };
    LoyaltyMgmtService.prototype.calculateLoyalty = function (order) {
        return __awaiter(this, void 0, void 0, function () {
            var result, loyaltyPrograms, _i, _a, line, _b, loyaltyPrograms_1, loyaltyProgram;
            return __generator(this, function (_c) {
                switch (_c.label) {
                    case 0:
                        result = new LoyaltyByProgram();
                        if (!order.hasLines())
                            return [2 /*return*/, result];
                        return [4 /*yield*/, this.alteaDb.getLoyaltyPrograms(order.branchId)];
                    case 1:
                        loyaltyPrograms = _c.sent();
                        if (ts_common_1.ArrayHelper.IsEmpty(loyaltyPrograms)) {
                            result.msg = "No loyalty programs found for branch ".concat(order.branchId, "!");
                            return [2 /*return*/, result];
                        }
                        result.programs = loyaltyPrograms;
                        for (_i = 0, _a = order.lines; _i < _a.length; _i++) {
                            line = _a[_i];
                            if (!line.product)
                                continue;
                            for (_b = 0, loyaltyPrograms_1 = loyaltyPrograms; _b < loyaltyPrograms_1.length; _b++) {
                                loyaltyProgram = loyaltyPrograms_1[_b];
                                if (loyaltyProgram.hasProduct(line.product)) {
                                    switch (loyaltyProgram.track) {
                                        case ts_altea_model_1.LoyaltyUnit.qty:
                                            result.addLoyalty(loyaltyProgram.id, line.qty);
                                            break;
                                        default:
                                            result.addLoyalty(loyaltyProgram.id, line.incl);
                                            break;
                                    }
                                    break; // every orderline can only be allocated to 1 loyalty program 
                                }
                            }
                        }
                        return [2 /*return*/, result];
                }
            });
        });
    };
    return LoyaltyMgmtService;
}());
exports.LoyaltyMgmtService = LoyaltyMgmtService;
